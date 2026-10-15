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
const pagesOrigin = 'https://selleryd.github.io';
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
  const officeRedirects = [];
  const fetchOfficePage = async (headers = {}) => {
    let url = `${origin}/office/`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await mf.dispatchFetch(url, { headers, redirect: 'manual' });
      if (![307, 308].includes(response.status)) return response;
      const location = response.headers.get('location');
      check(Boolean(location), true, 'framework office canonicalization supplies a destination');
      const destination = new URL(location, url);
      check(destination.origin, origin, 'office canonicalization remains on the same host');
      check(/^\/office\/?$/.test(destination.pathname), true, 'canonicalization stays on the office page');
      officeRedirects.push(`${response.status} ${new URL(url).pathname} -> ${destination.pathname}`);
      url = destination.href;
    }
    throw new Error('Office canonicalization did not settle after three redirects.');
  };
  const officePage = await fetchOfficePage();
  check(officePage.status, 302, 'anonymous office page should hand off to authenticated Sites sign-in');
  check(officePage.headers.get('location'), '/signin-with-chatgpt?return_to=%2Foffice%2F', 'office sign-in returns only to the local office path');
  check(officePage.headers.get('cache-control'), 'private, no-store', 'office sign-in handoff cannot be cached');
  const signedOfficePage = await fetchOfficePage(admin);
  check(signedOfficePage.status, 200, 'authenticated office page remains available');
  const preflight = await mf.dispatchFetch(`${origin}/api/leads`, { method: 'OPTIONS', headers: { Origin: pagesOrigin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type, idempotency-key' } });
  check(preflight.status, 204, 'approved Pages contact preflight is accepted');
  check(preflight.headers.get('access-control-allow-origin'), pagesOrigin, 'preflight allows only the approved Pages origin');
  check(preflight.headers.get('access-control-allow-methods'), 'POST', 'preflight permits only POST');
  check(preflight.headers.get('access-control-allow-headers'), 'Content-Type, Idempotency-Key', 'preflight permits only public contact headers');
  check(preflight.headers.get('access-control-allow-credentials'), null, 'contact CORS does not permit credentials');
  check(await preflight.text(), '', 'preflight has no response body');
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
  const crossOriginOffice = await mf.dispatchFetch(`${origin}/api/office/config`, { headers: { Origin: pagesOrigin } });
  check(crossOriginOffice.status, 401, 'Pages cannot access unsigned office configuration');
  check(crossOriginOffice.headers.get('access-control-allow-origin'), null, 'office routes never gain public contact CORS');
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
  const crossOriginRetry = await mf.dispatchFetch(`${origin}/api/office/leads/${saved.id}/send`, { method: 'POST', headers: { ...admin, ...jsonHeaders, Origin: pagesOrigin, 'Sec-Fetch-Site': 'cross-site' }, body: '{}' });
  check(crossOriginRetry.status, 403, 'even an authenticated office fixture cannot retry email from Pages');
  check(crossOriginRetry.headers.get('access-control-allow-origin'), null, 'office mutations remain outside public CORS');
  const retryResponse = await mf.dispatchFetch(`${origin}/api/office/leads/${saved.id}/send`, { method: 'POST', headers: { ...admin, ...jsonHeaders }, body: '{}' });
  check(retryResponse.status, 200, 'authorized office retry works');
  check((await retryResponse.json()).delivery, 'queued', 'retry cannot pretend to send without email configuration');
  const crossSite = await mf.dispatchFetch(`${origin}/api/leads`, { method: 'POST', headers: { ...jsonHeaders, Origin: 'https://outside.example' }, body: JSON.stringify(valid) });
  check(crossSite.status, 403, 'cross-site public submissions rejected');
  check(crossSite.headers.get('access-control-allow-origin'), null, 'unapproved submission responses do not expose CORS');
  const pagesSubmit = () => mf.dispatchFetch(`${origin}/api/leads`, { method: 'POST', headers: { ...jsonHeaders, Origin: pagesOrigin, 'Sec-Fetch-Site': 'cross-site', 'Idempotency-Key': 'compiled-github-submission-001' }, body: JSON.stringify({ ...valid, firstName: 'Pages' }) });
  const pagesLeadResponse = await pagesSubmit();
  check(pagesLeadResponse.status, 201, 'Pages-origin contacts are durably accepted');
  check(pagesLeadResponse.headers.get('access-control-allow-origin'), pagesOrigin, 'approved Pages success is readable by its frontend');
  check(pagesLeadResponse.headers.get('access-control-allow-credentials'), null, 'Pages success never enables authenticated CORS');
  check(pagesLeadResponse.headers.get('cache-control'), 'private, no-store', 'contact responses are never cacheable');
  const pagesLead = await pagesLeadResponse.json();
  check(pagesLead.delivery, 'queued', 'Pages submissions remain honestly queued without email credentials');
  const pagesDuplicate = await pagesSubmit();
  check((await pagesDuplicate.json()).id, pagesLead.id, 'Pages retry reuses the durable request');
  check((await db.prepare('SELECT COUNT(*) AS count FROM leads').first()).count, 2, 'native and Pages retries each persist exactly one contact');
  for (const [status, body, contentType] of [[400, JSON.stringify({ ...valid, consent: false }), 'application/json'], [415, '{}', 'text/plain'], [413, 'x'.repeat(12_289), 'application/json']]) {
    const invalid = await mf.dispatchFetch(`${origin}/api/leads`, { method: 'POST', headers: { Origin: pagesOrigin, 'Content-Type': contentType }, body });
    check(invalid.status, status, `Pages validation returns HTTP ${status}`);
    check(invalid.headers.get('access-control-allow-origin'), pagesOrigin, `Pages validation HTTP ${status} remains readable`);
    check(invalid.headers.get('access-control-allow-credentials'), null, 'validation errors cannot enable credentials');
  }
  for (const headers of [
    { Origin: 'https://selleryd.github.io.evil.test', 'Access-Control-Request-Method': 'POST' },
    { Origin: pagesOrigin, 'Access-Control-Request-Method': 'PUT' },
    { Origin: pagesOrigin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'oai-authenticated-user-email' },
    { 'Access-Control-Request-Method': 'POST' },
  ]) {
    const denied = await mf.dispatchFetch(`${origin}/api/leads`, { method: 'OPTIONS', headers });
    check(denied.status, 403, 'unapproved contact preflight is denied');
    check(denied.headers.get('access-control-allow-methods'), null, 'denied preflight grants no methods');
  }
  console.log(`Office redirect chain: ${officeRedirects.join('; ')}; anonymous office -> 302 Sites sign-in; signed-in office -> 200.`);
  console.log(`PASS: ${assertions} compiled Worker smoke assertions; native and Pages contacts persist once, scoped CORS and office guards work, and email remains honestly queued. No live emails sent.`);
} finally {
  await mf.dispose();
}
