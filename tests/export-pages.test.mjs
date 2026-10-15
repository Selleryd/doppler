import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { exportPages, normalizeBase, rewriteCss, rewriteHtml, rewriteLocalUrl, rewriteSrcset } from '../scripts/export-pages.mjs';

const base = '/doppler/';
const leadEndpoint = 'https://doppler-wellness-reimagined.sellery.chatgpt.site/api/leads';

test('local URLs resolve from the original route and preserve external URLs and fragments', () => {
  assert.equal(rewriteLocalUrl('../../../assets/mark.svg?x=1#mark', '/blogs/news/article/', base), '/doppler/assets/mark.svg?x=1#mark');
  assert.equal(rewriteLocalUrl('/pages/contact/', '/', base), '/doppler/pages/contact/');
  for (const value of ['#find-care', 'https://google.com', '//cdn.example/image.webp', 'mailto:team@dopplerwellness.com', 'data:image/svg+xml,a,b']) assert.equal(rewriteLocalUrl(value, '/', base), value);
  assert.throws(() => normalizeBase('/x/../doppler/'));
});

test('responsive images and CSS retain embedded data and rewrite root and relative assets', () => {
  assert.equal(rewriteSrcset('../../../assets/a.webp 640w, /assets/b.webp 1280w', '/blogs/news/article/', base), '/doppler/assets/a.webp 640w, /doppler/assets/b.webp 1280w');
  assert.equal(rewriteSrcset('data:image/png;base64,abc 1x, /assets/b.png 2x', '/', base), 'data:image/png;base64,abc 1x, /doppler/assets/b.png 2x');
  assert.equal(rewriteCss('a{background:url("../assets/a.webp")}b{mask:url(#icon)}c{mask:url("data:image/svg+xml,x(y),z")}', '/css/main.css', base), 'a{background:url("/doppler/assets/a.webp")}b{mask:url(#icon)}c{mask:url("data:image/svg+xml,x(y),z")}');
});

test('HTML gets the configured endpoint and base paths without changing canonical or data attributes', () => {
  const output = rewriteHtml('<head><link href="https://dopplerwellness.com/"></head><img src="/assets/a.webp" srcset="a.webp 1x, /assets/b.webp 2x"><form action="/api/leads"><a href="#find-care" data-href="/not-a-link">Start</a><span style="background:url(/assets/c.webp)"></span>', '/', { base, leadEndpoint });
  assert.ok(output.includes(`name="doppler-lead-endpoint" content="${leadEndpoint}"`));
  assert.ok(output.includes(`action="${leadEndpoint}"`));
  assert.ok(output.includes('href="https://dopplerwellness.com/"'));
  assert.ok(output.includes('src="/doppler/assets/a.webp"'));
  assert.ok(output.includes('srcset="/doppler/a.webp 1x, /doppler/assets/b.webp 2x"'));
  assert.ok(output.includes('href="#find-care" data-href="/not-a-link"'));
  assert.ok(output.includes('url(/doppler/assets/c.webp)'));
});

test('clean export uses final pages, copies assets, configures manifest, and replaces office UI', async () => {
  const temporary = await mkdtemp(join(tmpdir(), 'doppler-pages-test-'));
  try {
    const root = join(temporary, 'project');
    const output = join(temporary, 'export');
    await mkdir(join(root, 'src'), { recursive: true });
    await mkdir(join(root, 'public/assets'), { recursive: true });
    await mkdir(output);
    await writeFile(join(output, 'stale.html'), 'old');
    await writeFile(join(root, 'src/generated-pages.json'), JSON.stringify({ '/': '<head></head><img src="/assets/mark.svg">', '/blogs/news/': '<head></head>Journal', '/blogs/news/latest/': '<head></head>Final article', '/office/': '<head></head><form>Private lead UI</form>' }));
    await writeFile(join(root, 'public/assets/mark.svg'), '<svg/>');
    await writeFile(join(root, 'public/styles.css'), 'a{background:url(/assets/mark.svg)}');
    await writeFile(join(root, 'public/site.webmanifest'), JSON.stringify({ start_url: '/', icons: [{ src: '/assets/mark.svg' }] }));
    const report = await exportPages({ root, output, base, leadEndpoint });
    assert.equal(report.routes, 4);
    assert.equal(report.articles, 1);
    assert.match(await readFile(join(output, 'blogs/news/latest/index.html'), 'utf8'), /Final article/);
    assert.equal(await readFile(join(output, 'styles.css'), 'utf8'), 'a{background:url(/doppler/assets/mark.svg)}');
    const manifest = JSON.parse(await readFile(join(output, 'site.webmanifest'), 'utf8'));
    assert.equal(manifest.start_url, base);
    assert.equal(manifest.scope, base);
    assert.equal(manifest.icons[0].src, '/doppler/assets/mark.svg');
    const office = await readFile(join(output, 'office/index.html'), 'utf8');
    assert.match(office, /https:\/\/doppler-wellness-reimagined\.sellery\.chatgpt\.site\/office\//);
    assert.ok(!office.includes('<form'));
    await access(join(output, '.nojekyll'));
    await access(join(output, 'assets/mark.svg'));
    await assert.rejects(access(join(output, 'stale.html')));
    await assert.rejects(exportPages({ root, output: root, base, leadEndpoint }), /must not contain/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
