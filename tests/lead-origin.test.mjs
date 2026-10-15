import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GITHUB_PAGES_ORIGIN, allowedLeadOrigin, leadPreflightResponse, withLeadCors } from '../lib/lead-origin.ts';
import { assertSameOrigin } from '../lib/leads.ts';

const backend = 'https://doppler.example';
const request = (origin = GITHUB_PAGES_ORIGIN, extra = {}, method = 'OPTIONS') => new Request(`${backend}/api/leads`, {
  method, headers: { ...(origin === undefined ? {} : { Origin: origin }), ...extra },
});
const preflight = (origin = GITHUB_PAGES_ORIGIN, extra = {}) => request(origin, {
  'Access-Control-Request-Method': 'POST',
  'Access-Control-Request-Headers': 'content-type, idempotency-key',
  ...extra,
});

test('public lead origins are exact, allow Pages cross-site requests, and preserve native cross-site rejection', () => {
  assert.equal(allowedLeadOrigin(request(GITHUB_PAGES_ORIGIN, { 'Sec-Fetch-Site': 'cross-site' })), GITHUB_PAGES_ORIGIN);
  assert.equal(allowedLeadOrigin(request(backend, { 'Sec-Fetch-Site': 'same-origin' })), backend);
  assert.equal(allowedLeadOrigin(request(backend, { 'Sec-Fetch-Site': 'cross-site' })), null);
  for (const origin of [null, 'null', '', 'http://selleryd.github.io', 'https://selleryd.github.io.evil.test', 'https://evil.test', `${GITHUB_PAGES_ORIGIN}/doppler/`, `${GITHUB_PAGES_ORIGIN}:444`]) {
    const candidate = origin === null ? new Request(`${backend}/api/leads`) : request(origin);
    assert.equal(allowedLeadOrigin(candidate), null, String(origin));
  }
});

test('valid native and Pages preflights allow only POST and the two public contact headers', async () => {
  for (const origin of [backend, GITHUB_PAGES_ORIGIN]) {
    const response = leadPreflightResponse(preflight(origin));
    assert.equal(response.status, 204);
    assert.equal(await response.text(), '');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
    assert.equal(response.headers.get('Access-Control-Allow-Methods'), 'POST');
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), 'Content-Type, Idempotency-Key');
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.match(response.headers.get('Vary'), /Origin/);
    assert.match(response.headers.get('Vary'), /Access-Control-Request-Method/);
    assert.match(response.headers.get('Vary'), /Access-Control-Request-Headers/);
  }
  assert.equal(leadPreflightResponse(preflight(GITHUB_PAGES_ORIGIN, { 'Access-Control-Request-Headers': '  CONTENT-TYPE , Idempotency-Key  ' })).status, 204);
  assert.equal(leadPreflightResponse(request(GITHUB_PAGES_ORIGIN, { 'Access-Control-Request-Method': 'POST' })).status, 204);
});

test('preflights deny other origins, methods, malformed headers and authentication headers', () => {
  const badOrigin = leadPreflightResponse(preflight('https://evil.test'));
  assert.equal(badOrigin.status, 403);
  assert.equal(badOrigin.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(leadPreflightResponse(new Request(`${backend}/api/leads`, { method: 'OPTIONS', headers: { 'Access-Control-Request-Method': 'POST' } })).status, 403);
  for (const method of ['GET', 'PUT', 'DELETE', 'post', 'POST, GET', '']) assert.equal(leadPreflightResponse(preflight(GITHUB_PAGES_ORIGIN, { 'Access-Control-Request-Method': method })).status, 403);
  for (const headers of ['authorization', 'cookie', 'oai-authenticated-user-id', 'oai-authenticated-user-email', 'content-type, authorization', 'content-type,,idempotency-key', '*', 'x'.repeat(1025)]) {
    const response = leadPreflightResponse(preflight(GITHUB_PAGES_ORIGIN, { 'Access-Control-Request-Headers': headers }));
    assert.equal(response.status, 403, headers.slice(0, 80));
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Methods'), null);
    assert.equal(response.headers.get('Access-Control-Allow-Headers'), null);
  }
});

test('success and every validation-error response remain readable only to approved origins', async () => {
  for (const status of [201, 400, 403, 409, 413, 415, 429, 503]) {
    const response = withLeadCors(request(), Response.json({ ok: status === 201 }, { status, headers: { Vary: 'Accept-Encoding' } }));
    assert.equal(response.status, status);
    assert.deepEqual(await response.json(), { ok: status === 201 });
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), GITHUB_PAGES_ORIGIN);
    assert.equal(response.headers.get('Access-Control-Allow-Credentials'), null);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('Vary'), 'Accept-Encoding, Origin');
  }
  const untrusted = withLeadCors(request('https://evil.test'), Response.json({ ok: false }, { status: 403, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' } }));
  assert.equal(untrusted.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(untrusted.headers.get('Access-Control-Allow-Credentials'), null);
});

test('the public origin exception never widens the office same-origin policy or CORS surface', () => {
  const office = new Request(`${backend}/api/office/leads/example/send`, { method: 'POST', headers: { Origin: GITHUB_PAGES_ORIGIN, 'Sec-Fetch-Site': 'cross-site' } });
  assert.throws(() => assertSameOrigin(office), { status: 403 });
  const route = readFileSync(new URL('../app/api/leads/route.ts', import.meta.url), 'utf8');
  assert.match(route, /export function OPTIONS/);
  assert.match(route, /allowedLeadOrigin\(request\)/);
  assert.match(route, /withLeadCors\(request, leadErrorResponse\(error\)\)/);
  for (const file of ['../lib/leads-runtime.ts', '../app/api/office/config/route.ts', '../app/api/office/leads/route.ts', '../app/api/office/leads/[id]/pdf/route.ts', '../app/api/office/leads/[id]/send/route.ts']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert(!/lead-origin|withLeadCors|Access-Control-Allow-Origin/.test(source), `${file} must remain outside public CORS handling`);
  }
});
