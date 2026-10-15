import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { matchingEditorial } from '../src/matching-editorial.mjs';

const script = readFileSync(new URL('../src/matching-editorial.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/matching-editorial.css', import.meta.url), 'utf8');

function setup({ reduced = false, intersection = true } = {}) {
  let top = 900;
  let observerCallback;
  let frame = 0;
  const frames = new Map();
  const events = {};
  const documentEvents = {};
  const properties = {};
  const section = {
    style: { setProperty: (name, value) => { properties[name] = value; }, removeProperty: name => { delete properties[name]; } },
    getBoundingClientRect: () => ({ top, height: 1000 }),
  };
  const preference = { matches: reduced, addEventListener() {} };
  const document = { hidden: false, querySelectorAll: () => [section], addEventListener: (event, fn) => { documentEvents[event] = fn; } };
  const context = {
    document,
    window: { innerHeight: 900, matchMedia: () => preference, addEventListener: (event, fn) => { events[event] = fn; } },
    requestAnimationFrame: fn => { frames.set(++frame, fn); return frame; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  if (intersection) {
    context.window.IntersectionObserver = true;
    context.IntersectionObserver = class { constructor(fn) { observerCallback = fn; } observe() {} };
  }
  const flush = () => {
    for (const [id, fn] of [...frames]) { frames.delete(id); fn(); }
  };
  vm.runInNewContext(script, context);
  return {
    events, properties, pending: () => frames.size,
    observe(value) { observerCallback([{ target: section, isIntersecting: value }]); flush(); },
    scroll(value) { top = value; events.scroll(); flush(); },
    hidden(value) { document.hidden = value; documentEvents.visibilitychange(); flush(); },
  };
}

test('the complete match and wider support are present without any interaction', () => {
  const html = matchingEditorial();
  for (const text of ['Your needs', 'Your preferences', 'Your daily life', 'health, and goals', 'insurance, and assisted living', 'Help with insurance', 'With your consent', 'Support groups']) assert(html.includes(text), text);
  assert.equal((html.match(/<dt>/g) || []).length, 3);
  assert.equal((html.match(/<dd>/g) || []).length, 3);
  assert(!/\bhidden\b|role="tab|data-match-chapter|data-seasonal-garden/.test(html.replace(/aria-hidden="true"/g, '')));
  assert(html.includes('href="#find-care"'));
  assert(html.includes('href="/pages/why-doppler-therapy/"'));
  assert.match(html, /srcset="[^\"]+ 640w, [^\"]+ 1122w"/);
  assert.match(html, /width="1122" height="1402"/);
  assert(html.includes('alt="An older adult'));
  assert(!/illustration/i.test(html));
});

test('the editorial layout applies to the actual homepage body scope', () => {
  assert.match(css, /\.original-refined \.dw-match-edit-layout\s*\{/);
  assert.match(css, /\.original-refined \.dw-match-edit-content h2\s*\{/);
  assert(!css.includes('.dw-body'));
});

test('the decorative rule follows both scroll directions and has no perpetual frames', () => {
  const page = setup();
  assert.equal(page.pending(), 0);
  page.observe(true);
  page.scroll(0);
  const first = Number(page.properties['--dw-match-edit-progress']);
  page.scroll(-500);
  const later = Number(page.properties['--dw-match-edit-progress']);
  assert(later > first);
  page.scroll(0);
  assert.equal(Number(page.properties['--dw-match-edit-progress']), first);
  assert.equal(page.pending(), 0);
  assert(!('wheel' in page.events));
  assert(!('touchmove' in page.events));
});

test('offscreen and hidden documents do no decorative work', () => {
  const page = setup();
  page.scroll(-300);
  assert.equal(Object.keys(page.properties).length, 0);
  page.observe(true);
  page.scroll(0);
  const before = page.properties['--dw-match-edit-progress'];
  page.hidden(true);
  page.scroll(-600);
  assert.equal(page.properties['--dw-match-edit-progress'], before);
  page.hidden(false);
  assert.notEqual(page.properties['--dw-match-edit-progress'], before);
  page.observe(false);
  page.scroll(100);
  assert.equal(page.pending(), 0);
});

test('reduced motion and missing observer retain the complete static experience', () => {
  const page = setup({ reduced: true });
  page.observe(true);
  page.scroll(-600);
  assert.equal(page.pending(), 0);
  assert.equal(Object.keys(page.properties).length, 0);
  const fallback = setup({ intersection: false });
  fallback.scroll(0);
  assert(Number(fallback.properties['--dw-match-edit-progress']) > 0);
  assert.equal(fallback.pending(), 0);
});
