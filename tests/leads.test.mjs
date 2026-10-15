import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import {
  LeadError, OFFICE_RECIPIENT, MAX_LEAD_BODY_BYTES, assertSameOrigin, readLeadBody, validateLead,
  leadPdf, deliveryConfigured, sendLeadEmail, requireOfficeUser, saveLead, deliverStoredLead, enforceRateLimit,
} from '../lib/leads.ts';

const valid = {
  kind: 'patient', firstName: 'Eleanor', lastName: 'Reed', email: 'eleanor@example.test',
  phone: '(845) 555-0110', state: 'NY', contactPreference: 'Phone', consent: true, website: '',
  relationship: 'family', careFormat: 'Help me decide', insurance: 'Medicare',
};
const configured = { RESEND_API_KEY: 'test-secret-never-sent', LEAD_FROM_EMAIL: 'website@dopplerwellness.com' };
const time = '2026-10-13T12:00:00.000Z';
const id = '6cb8c39c-283f-4b38-80c0-6b3956c2453e';
function request(body, extra = {}) {
  return new Request('https://doppler.example/api/leads', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://doppler.example', ...extra }, body,
  });
}
function database() {
  const sqlite = new DatabaseSync(':memory:');
  const sql = readFileSync(new URL('../drizzle/0000_short_glorian.sql', import.meta.url), 'utf8');
  sqlite.exec(sql.replaceAll('--> statement-breakpoint', ''));
  return {
    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      return {
        bind(...args) {
          return {
            async first() { return stmt.get(...args) || null; },
            async all() { return { results: stmt.all(...args), success: true }; },
            async run() { const result = stmt.run(...args); return { success: true, meta: { changes: Number(result.changes) } }; },
          };
        },
      };
    },
    sqlite,
  };
}
async function providerSuccess(_url, options) {
  const payload = JSON.parse(options.body);
  assert.deepEqual(payload.to, [OFFICE_RECIPIENT]);
  assert.equal(payload.from, configured.LEAD_FROM_EMAIL);
  assert.equal(payload.reply_to, valid.email);
  assert.equal(options.headers['Idempotency-Key'].startsWith('doppler-lead-'), true);
  assert.equal(payload.attachments.length, 1);
  assert.equal(Buffer.from(payload.attachments[0].content, 'base64').subarray(0, 8).toString(), '%PDF-1.4');
  return Response.json({ id: 'provider-message-id' });
}

test('minimal contact request accepts exact frontend options and normalizes preference', () => {
  const value = validateLead({ ...valid, email: 'ELEANOR@example.test', state: 'ny' });
  assert.equal(value.contactPreference, 'phone');
  assert.equal(value.email, valid.email);
  assert.equal(value.state, 'NY');
  assert.equal('website' in value, false);
  assert.equal(validateLead({ ...valid, phone: '', contactPreference: 'Email' }).phone, '');
});
test('careers and partner exact display values are supported', () => {
  const base = { kind: 'careers', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.test', state: 'NY', consent: true };
  assert.equal(validateLead({ ...base, role: 'Licensed therapist', licenseState: 'ny', careFormat: 'Both' }).licenseState, 'NY');
  assert.equal(validateLead({ ...base, kind: 'partner', community: 'River House', jobTitle: 'Director', residentCount: '50–100 residents' }).residentCount, '50–100 residents');
  assert.throws(() => validateLead({ ...base, kind: 'partner' }), { field: 'community' });
});
test('rejects clinical narratives, unknown fields, missing consent, malformed contact and honeypot', () => {
  for (const extra of [
    { clinicalNarrative: 'sensitive content' }, { diagnosis: 'sensitive content' }, { to: 'outsider@example.test' },
    { consent: false }, { email: 'not-an-email' }, { phone: 'hello' }, { firstName: 'A\nB' },
    { website: 'bot website' }, { state: 'ZZ' }, { firstName: 'A'.repeat(81) }, { contactPreference: 'Fax' },
    { careFormat: 'Long narrative outside a dropdown' }, { email: '', phone: '' },
  ]) assert.throws(() => validateLead({ ...valid, ...extra }), LeadError);
});
test('requires same-origin forms and rejects cross-site or missing origins', () => {
  assertSameOrigin(request('{}'));
  assert.throws(() => assertSameOrigin(request('{}', { Origin: 'https://evil.example' })), { status: 403 });
  assert.throws(() => assertSameOrigin(request('{}', { 'Sec-Fetch-Site': 'cross-site' })), { status: 403 });
  assert.throws(() => assertSameOrigin(new Request('https://doppler.example/api/leads')), { status: 403 });
});
test('reads JSON and rejects malformed content types, malformed JSON and bounded stream bodies', async () => {
  assert.deepEqual(await readLeadBody(request(JSON.stringify(valid))), valid);
  await assert.rejects(() => readLeadBody(request('bad json')), LeadError);
  await assert.rejects(() => readLeadBody(request('{}', { 'Content-Type': 'text/plain' })), { status: 415 });
  await assert.rejects(() => readLeadBody(request('A'.repeat(MAX_LEAD_BODY_BYTES + 1))), { status: 413 });
  await assert.rejects(() => readLeadBody(request('{}', { 'Content-Length': '999999' })), { status: 413 });
});
test('PDF is valid ASCII, escapes syntax and has exact byte offsets', () => {
  const bytes = leadPdf(validateLead({ ...valid, firstName: 'José (Jay)', lastName: 'A\\B' }), id, time);
  const pdf = Buffer.from(bytes).toString('ascii');
  assert.equal(pdf.startsWith('%PDF-1.4\n'), true);
  assert.equal(pdf.includes('Jose \\(Jay\\) A\\\\B'), true);
  assert.equal(pdf.endsWith('%%EOF\n'), true);
  const offset = Number(pdf.match(/startxref\n(\d+)/)[1]);
  assert.equal(pdf.slice(offset, offset + 4), 'xref');
  const xrefEntries = pdf.slice(offset).split('\n').slice(3, 8);
  xrefEntries.forEach((entry, index) => assert.equal(pdf.slice(Number(entry.slice(0, 10)), Number(entry.slice(0, 10)) + 7), `${index + 1} 0 obj`));
  const stream = pdf.match(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/);
  assert.equal(Number(stream[1]), stream[2].length);
});
test('missing credentials returns queued without invoking an email provider', async () => {
  let calls = 0;
  assert.equal(deliveryConfigured({}), false);
  assert.equal(deliveryConfigured({ ...configured, LEAD_FROM_EMAIL: 'bad\naddress' }), false);
  const result = await sendLeadEmail(validateLead(valid), id, time, {}, async () => { calls++; throw new Error('must not run'); });
  assert.equal(result.delivery, 'queued');
  assert.equal(calls, 0);
});
test('email always routes to office with PDF attachment and only marks provider-confirmed delivery sent', async () => {
  assert.equal(deliveryConfigured(configured), true);
  assert.deepEqual(await sendLeadEmail(validateLead(valid), id, time, configured, providerSuccess), { delivery: 'sent', messageId: 'provider-message-id' });
  for (const provider of [
    async () => new Response('not accepted', { status: 429 }),
    async () => Response.json({}),
    async () => { throw new Error('network failure with secret contents'); },
  ]) {
    const result = await sendLeadEmail(validateLead(valid), id, time, configured, provider);
    assert.equal(result.delivery, 'queued');
    assert.equal(result.error.includes('secret'), false);
  }
});
test('office authorization rejects unsigned and unlisted users server-side', () => {
  const url = 'https://doppler.example/api/office/leads';
  assert.throws(() => requireOfficeUser(new Request(url), {}), { status: 401 });
  assert.throws(() => requireOfficeUser(new Request(url, { headers: { 'oai-authenticated-user-email': 'team@dopplerwellness.com' } }), {}), { status: 401 });
  const user = (email) => new Request(url, { headers: { 'oai-authenticated-user-email': email, 'oai-authenticated-user-id': 'trusted-sites-user' } });
  assert.throws(() => requireOfficeUser(user('outsider@example.test'), {}), { status: 403 });
  assert.equal(requireOfficeUser(user('TEAM@dopplerwellness.com'), {}), 'team@dopplerwellness.com');
  assert.equal(requireOfficeUser(user('mykitchensupplier@gmail.com'), {}), 'mykitchensupplier@gmail.com');
  assert.throws(() => requireOfficeUser(user('team@dopplerwellness.com'), { OFFICE_ADMIN_EMAILS: 'other@example.test' }), { status: 403 });
});
test('D1 schema persists minimal leads and retry keys return the same record', async () => {
  const db = database();
  const lead = validateLead(valid);
  const first = await saveLead(db, lead, 'submission-key-000001');
  const second = await saveLead(db, lead, 'submission-key-000001');
  assert.equal(first.id, second.id);
  assert.equal(db.sqlite.prepare('SELECT COUNT(*) count FROM leads').get().count, 1);
  assert.equal(first.status, 'queued');
  assert.equal(first.consent, 1);
  assert.equal(JSON.parse(first.fields_json).relationship, 'family');
  await assert.rejects(() => saveLead(db, { ...lead, firstName: 'Different' }, 'submission-key-000001'), { status: 409 });
  db.sqlite.close();
});
test('durable queue remains queued without delivery setup; failure remains retryable', async () => {
  const db = database();
  const row = await saveLead(db, validateLead(valid), 'submission-key-000002');
  assert.equal(await deliverStoredLead(db, row, {}, async () => { throw new Error('must not run'); }), 'queued');
  assert.equal(db.sqlite.prepare('SELECT status FROM leads').get().status, 'queued');
  assert.equal(await deliverStoredLead(db, row, configured, async () => new Response('no', { status: 503 })), 'queued');
  const failed = db.sqlite.prepare('SELECT * FROM leads').get();
  assert.equal(failed.status, 'queued');
  assert.equal(failed.attempts, 1);
  assert.equal(await deliverStoredLead(db, failed, configured, providerSuccess), 'sent');
  assert.equal(db.sqlite.prepare('SELECT status FROM leads').get().status, 'sent');
  db.sqlite.close();
});
test('concurrent delivery attempts send once and sent requests never send twice', async () => {
  const db = database();
  const row = await saveLead(db, validateLead(valid), 'submission-key-000003');
  let calls = 0;
  const provider = async (...args) => { calls++; return providerSuccess(...args); };
  await Promise.all([deliverStoredLead(db, row, configured, provider), deliverStoredLead(db, row, configured, provider)]);
  assert.equal(calls, 1);
  const sent = db.sqlite.prepare('SELECT * FROM leads').get();
  assert.equal(await deliverStoredLead(db, sent, configured, provider), 'sent');
  assert.equal(calls, 1);
  db.sqlite.close();
});
test('short-window rate limit uses hashes and blocks excess submissions', async () => {
  const db = database();
  for (let count = 0; count < 8; count++) await enforceRateLimit(db, '192.0.2.44');
  await assert.rejects(() => enforceRateLimit(db, '192.0.2.44'), { status: 429 });
  const rate = db.sqlite.prepare('SELECT * FROM lead_rate_limits').get();
  assert.match(rate.bucket, /^[a-f0-9]{64}$/);
  assert.equal(rate.bucket.includes('192.0.2.44'), false);
  db.sqlite.close();
});
