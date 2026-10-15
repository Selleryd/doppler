/** Compiled Worker smoke test. No preview server, browser, or live email. */
import { strict as assert } from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = resolve(project, 'dist/server/wrangler.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const serverRoot = dirname(configPath);
const mainPath = resolve(serverRoot, config.main);
const modulePaths = readdirSync(serverRoot, { recursive: true }).filter(name => /\.(mjs|js)$/.test(name)).map(name => resolve(serverRoot, name));
const mf = new Miniflare({
  name: config.name,
  modules: [mainPath, ...modulePaths.filter(path => path !== mainPath)].map(path => ({ type: 'ESModule', path })),
  modulesRoot: serverRoot,
  modulesRules: [{ type: 'ESModule', include: ['**/*.js', '**/*.mjs'] }],
  compatibilityDate: config.compatibility_date,
  compatibilityFlags: config.compatibility_flags,
  bindings: { ...config.vars },
  d1Databases: { DB: 'doppler-worker-smoke' },
  d1Persist: false,
  assets: { directory: resolve(serverRoot, config.assets.directory), routerConfig: { has_user_worker: true } },
});
const origin = 'https://test.local';
const admin = { 'oai-authenticated-user-id': 'smoke-office-user', 'oai-authenticated-user-email': 'team@dopplerwellness.com' };
const valid = { kind: 'patient', firstName: 'Smoke', lastName: 'Test', email: 'smoke@example.test', phone: '8455550111', state: 'NY', contactPreference: 'Phone', relationship: 'self', careFormat: 'Help me decide', consent: true, website: '' };
const jsonHeaders = { Origin: origin, 'Content-Type': 'application/json' };
let assertions = 0;
const check = (value, expected, message) => { assert.equal(value, expected, message); assertions++; };
try {
  const db = await mf.getD1Database('DB');
  const migrations = readdirSync(resolve(project, 'drizzle')).filter(name => name.endsWith('.sql')).sort();
  for (const migration of migrations) {
    const sql = readFileSync(resolve(project, 'drizzle', migration), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint').map(value => value.trim()).filter(Boolean)) await db.prepare(statement).run();
  }
  for (const path of ['/', '/pages/assisted-living/', '/pages/for-families/', '/pages/careers/', '/pages/patient-intake-form/']) {
    const response = await mf.dispatchFetch(`${origin}${path}`);
    check(response.status, 200, `${path} should render`);
    const html = await response.text();
    check(html.includes('Doppler Wellness'), true, `${path} should contain site content`);
  }
  const submit = () => mf.dispatchFetch(`${origin}/api/leads`, { method: 'POST', headers: { ...jsonHeaders, 'Idempotency-Key': 'compiled-smoke-submission-001' }, body: JSON.stringify(valid) });
  const response = await submit();
  check(response.status, 201, 'public request should be durably accepted');
  const saved = await response.json();
  check(saved.ok, true, 'lead submission should succeed');
  check(saved.delivery, 'queued', 'email is honestly queued without secrets');
  check(typeof saved.id, 'string', 'lead has durable ID');
  const duplicate = await submit();
  check(duplicate.status, 201, 'duplicate retry should succeed');
  check((await duplicate.json()).id, saved.id, 'retry uses original durable ID');
  check((await db.prepare('SELECT COUNT(*) AS count FROM leads').first()).count, 1, 'retry does not duplicate lead');
  const unsigned = await mf.dispatchFetch(`${origin}/api/office/leads`);
  check(unsigned.status, 401, 'unsigned office requests are denied');
  const forbidden = await mf.dispatchFetch(`${origin}/api/office/leads`, { headers: { ...admin, 'oai-authenticated-user-email': 'outside@example.test' } });
  check(forbidden.status, 403, 'unlisted signed-in account is denied');
  const officeResponse = await mf.dispatchFetch(`${origin}/api/office/leads`, { headers: admin });
  check(officeResponse.status, 200, 'authorized office list should succeed');
  const office = await officeResponse.json();
  check(office.leads.length, 1, 'office can see saved lead');
  check(office.leads[0].id, saved.id, 'office shows correct lead');
  check(office.deliveryConfigured, false, 'office configuration correctly reports missing email secrets');
  check(office.recipient, 'team@dopplerwellness.com', 'recipient remains fixed');
  const pdfResponse = await mf.dispatchFetch(`${origin}${office.leads[0].pdfUrl}`, { headers: admin });
  check(pdfResponse.status, 200, 'authorized PDF download succeeds');
  check(pdfResponse.headers.get('content-type'), 'application/pdf', 'PDF content type');
  check(Buffer.from(await pdfResponse.arrayBuffer()).subarray(0, 8).toString(), '%PDF-1.4', 'download is a PDF');
  check(pdfResponse.headers.get('cache-control'), 'private, no-store', 'PDF is not cacheable');
  const privatePdf = await mf.dispatchFetch(`${origin}${office.leads[0].pdfUrl}`);
  check(privatePdf.status, 401, 'PDF requires office authentication');
  const retryResponse = await mf.dispatchFetch(`${origin}/api/office/leads/${saved.id}/send`, { method: 'POST', headers: { ...admin, ...jsonHeaders }, body: '{}' });
  check(retryResponse.status, 200, 'authorized office retry works');
  check((await retryResponse.json()).delivery, 'queued', 'retry cannot pretend to send without email configuration');
  const crossSite = await mf.dispatchFetch(`${origin}/api/leads`, { method: 'POST', headers: { ...jsonHeaders, Origin: 'https://outside.example' }, body: JSON.stringify(valid) });
  check(crossSite.status, 403, 'cross-site public submissions rejected');
  console.log(`PASS: ${assertions} compiled Worker smoke assertions; pages render, D1 captures once, queue is honest, office authorization and PDF download work. No live emails sent.`);
} finally {
  await mf.dispose();
}
