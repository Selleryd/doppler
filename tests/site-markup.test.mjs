import test from 'node:test';
import assert from 'node:assert/strict';
import { refineSiteMarkup } from '../src/site-markup.mjs';

test('headings retain a word boundary when mobile removes a visual line break', () => {
  const html = refineSiteMarkup('<h3>What’s been<br>on your mind.</h3><h3>How you like<br>to work.</h3>');
  const mobileText = html.replace(/<[^>]+>/g, '');
  assert.ok(mobileText.includes('What’s been on your mind.'));
  assert.ok(mobileText.includes('How you like to work.'));
});

test('device-dependent symbols become accessible decorative vector icons', () => {
  const html = refineSiteMarkup('<a href="/care/">Find your support <span aria-hidden="true">↗️</span></a><p>✓ Covered ✦ Personal</p>');
  assert.ok(!/[↗✓✦\uFE0F]/u.test(html));
  assert.equal((html.match(/<svg /g) || []).length, 3);
  assert.ok(html.includes('Find your support '));
  assert.ok(html.includes('dw-arrow-icon'));
  assert.ok(html.includes('aria-hidden="true"'));
});

test('markup refinement preserves scripts, attributes, copyright and article text', () => {
  const input = '<script>const example="A<br>B ↗";</script><a title="arrow ↗">Care</a><p>© Doppler. A thoughtful next step.</p>';
  assert.equal(refineSiteMarkup(input), input);
});
