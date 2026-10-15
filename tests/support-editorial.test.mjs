import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { supportEditorial } from '../src/support-editorial.mjs';
import { conditions } from '../src/premium-pages.mjs';

const script = readFileSync(new URL('../src/support-editorial.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/support-editorial.css', import.meta.url), 'utf8');

function setup({ reduced = false, observer = true, viewport = 900, waveHeight = 170, geometry = [] } = {}) {
  let top = viewport, frameId = 0, observeCallback, motionCallback;
  const frames = new Map(), handlers = {}, documentHandlers = {}, observed = [];
  const values = new Map();
  const style = () => ({ setProperty(name, value) { values.set(name, value); }, removeProperty(name) { values.delete(name); } });
  const paths = [980, 380].map((end, index) => {
    const beacon = { transform: `translate(${end} 92)`, getAttribute(name) { return this[name]; }, setAttribute(name, value) { this[name] = value; } };
    const length = index ? 600 : 1200;
    return { length, end, beacon, style: { strokeDashoffset: '0' },
      parentNode: { querySelector: () => beacon },
      getTotalLength() { if (geometry[index] === 'throw-length') throw new Error('SVG is not rendered'); return geometry[index] === 'zero-length' ? 0 : length; },
      getPointAtLength(distance) { if (geometry[index] === 'throw-point') throw new Error('SVG point unavailable'); this.lastDistance = distance; const progress = distance / length; return { x: 20 + (end - 20) * progress, y: geometry[index] === 'invalid-point' ? NaN : 94 - 2 * progress }; },
    };
  });
  const wave = { getBoundingClientRect: () => ({ top, height: waveHeight }), style: style(), querySelectorAll: () => paths };
  const ripple = { getBoundingClientRect: () => ({ top, height: 380 }), style: style(), querySelectorAll: () => [] };
  const motion = { matches: reduced, addEventListener(_name, fn) { motionCallback = fn; } };
  const window = { innerHeight: viewport, matchMedia: () => motion, addEventListener(name, fn) { handlers[name] = fn; } };
  const document = { hidden: false, querySelectorAll: () => [wave, ripple], addEventListener(name, fn) { documentHandlers[name] = fn; } };
  const context = { window, document, requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; }, cancelAnimationFrame(id) { frames.delete(id); } };
  if (observer) { context.IntersectionObserver = class { constructor(fn) { observeCallback = fn; } observe(target) { observed.push(target); } }; window.IntersectionObserver = context.IntersectionObserver; }
  vm.runInNewContext(script, context);
  const flush = () => { for (const [id, fn] of [...frames]) { frames.delete(id); fn(); } };
  return { wave, ripple, paths, observed, values, pending: () => frames.size, flush,
    snapshot: () => JSON.stringify({ line: paths.map(({ style, beacon }) => [style.strokeDashoffset, beacon.transform]), ripple: [...values] }),
    progress: () => 1 - Number(paths[0].style.strokeDashoffset),
    scrollTo(value) { top = value; handlers.scroll(); flush(); },
    resize() { handlers.resize(); flush(); },
    visible(value) { observeCallback([wave, ripple].map((target) => ({ target, isIntersecting: value }))); flush(); },
    reduce(value) { motion.matches = value; motionCallback(); flush(); },
    hide(value) { document.hidden = value; documentHandlers.visibilitychange(); flush(); },
  };
}

test('all twelve support areas are visible native list content without JavaScript', () => {
  const html = supportEditorial();
  const list = html.match(/<ul class="dw-support-edit-areas">([\s\S]*?)<\/ul>/)[1];
  assert.equal((list.match(/<li>/g) || []).length, 12);
  for (const [label] of conditions) assert(list.includes(`<li>${label}</li>`), `${label} is present in the list`);
  assert(!/<(?:details|button|canvas)\b|\bhidden\b|data-(?:life|chapter|pin)/.test(list));
  assert.match(html, /href="#find-care"/);
  assert.match(html, /href="\/pages\/why-doppler-therapy\/#what-we-help-with"/);
  assert.match(html, /You don’t need a diagnosis/);
  assert.match(html, /family, friends, and the people who care for you/);
  assert.match(html, /with your permission/);
});

test('decorative responsive lifelines are complete without JavaScript and their SVG references stay local', () => {
  const variants = [supportEditorial('support-one'), supportEditorial('support-two')];
  const allIds = variants.flatMap((html) => [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
  assert.equal(allIds.length, new Set(allIds).size);
  for (const html of variants) {
    assert.match(html, /data-support-ripple aria-hidden="true"/);
    assert.match(html, /data-support-lifeline aria-hidden="true"/);
    assert.equal((html.match(/data-lifeline-path/g) || []).length, 2);
    assert.equal((html.match(/stroke-dashoffset="0"/g) || []).length, 2, 'both responsive paths render complete in native HTML');
    assert.match(html, /viewBox="0 0 1000 180"/);
    assert.match(html, /viewBox="0 0 400 180"/);
    assert.match(html, /data-lifeline-beacon transform="translate\(980 92\)"/);
    assert.match(html, /data-lifeline-beacon transform="translate\(380 92\)"/);
    assert(!html.includes('preserveAspectRatio="none"'), 'the responsive beacon retains circular proportions');
    const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
    for (const [, reference] of html.matchAll(/url\(#([^\)]+)\)/g)) assert(ids.has(reference));
  }
  assert.throws(() => supportEditorial('bad"id'), /SVG-safe/);
  assert(!/position:\s*(?:sticky|fixed)|scroll-snap|animation:|opacity:\s*0\s*[;}]/.test(css), 'no concealed content, pinning, or endless animation');
  assert.match(css, /repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.dw-support-edit-wave-line, \.dw-support-edit-wave-beacon \{ transition: none; \}/);
});

test('component typography applies to the actual homepage body class', () => {
  const build = readFileSync(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
  assert.match(build, /path\s*===\s*['"]\/['"]\s*\?\s*['"]original-refined['"]/);
  assert(!css.includes('.dw-body'), 'home type must not depend on an absent body class');
  for (const selector of ['heading h2', 'intro-copy > p', 'areas > li', 'connection-copy h3']) {
    assert(css.includes(`.original-refined .dw-support-edit-${selector}`) || css.includes(`.dw-support-edit-${selector}`), `${selector} matches the homepage context`);
  }
});

test('lifeline has opening and closing holds, and completes while the full graphic is visible', () => {
  for (const { viewport, waveHeight } of [{ viewport: 900, waveHeight: 170 }, { viewport: 720, waveHeight: 150 }, { viewport: 400, waveHeight: 150 }]) {
    const page = setup({ viewport, waveHeight });
    page.visible(true);
    assert.equal(page.progress(), 0);
    page.scrollTo(viewport * .86);
    assert.equal(page.progress(), 0, 'the start holds after the graphic enters');
    const middle = (viewport - waveHeight) * .52;
    page.scrollTo(middle);
    assert.equal(page.progress(), 1, 'completion is held while reading past the centre');
    assert(middle >= 0 && middle + waveHeight <= viewport, 'the full graphic fits at completion');
    page.scrollTo(middle - 30);
    assert.equal(page.progress(), 1, 'the end holds after completion');
    for (const path of page.paths) {
      assert.equal(path.lastDistance, path.length, 'the beacon reaches the actual path endpoint');
      assert.equal(path.beacon.transform, `translate(${path.end} 92)`);
    }
    page.scrollTo(viewport * .86);
    assert.equal(page.progress(), 0, 'scrolling up restores the start');
    for (const path of page.paths) assert.equal(path.beacon.transform, 'translate(20 94)');
  }
});

test('lifeline and ripple reverse exactly and leave no pending animation frames', () => {
  const page = setup();
  assert.deepEqual(page.observed, [page.wave, page.ripple]);
  page.visible(true);
  const states = new Map();
  for (const top of [780, 700, 620, 520, 380, 520, 620, 700, 780]) {
    page.scrollTo(top);
    const state = page.snapshot();
    if (states.has(top)) assert.equal(state, states.get(top), 'backscroll restores precisely the same line and beacon');
    states.set(top, state);
    const progress = page.progress();
    for (const path of page.paths) assert(Math.abs(path.lastDistance / path.length - progress) < 1e-12, 'beacon distance follows the drawn stroke');
    assert.equal(page.pending(), 0);
  }
  assert.notEqual(states.get(780), states.get(620));
  assert(!/scrollTo\(|scrollBy\(|preventDefault|wheel|setTimeout|setInterval/.test(script));
});

test('offscreen and hidden artwork pauses, while reduced motion settles on a completed line', () => {
  const page = setup();
  page.scrollTo(620);
  assert.equal(page.progress(), 1, 'offscreen graphic keeps its complete native fallback');
  assert.equal(page.values.size, 0);
  page.visible(true);
  assert(page.progress() > 0 && page.progress() < 1);
  assert.equal(page.values.size, 3);
  page.visible(false);
  const offscreen = page.snapshot();
  page.scrollTo(380);
  assert.equal(page.snapshot(), offscreen);
  page.visible(true);
  page.hide(true);
  const hidden = page.snapshot();
  page.scrollTo(620);
  assert.equal(page.snapshot(), hidden, 'hidden documents do no scroll rendering');
  page.hide(false);
  assert(page.progress() < 1);
  page.reduce(true);
  assert.equal(page.progress(), 1);
  assert.equal(page.values.size, 0);
  for (const path of page.paths) assert.equal(path.beacon.transform, `translate(${path.end} 92)`);
  page.scrollTo(760);
  assert.equal(page.progress(), 1);
  assert.equal(page.pending(), 0);
  page.reduce(false);
  assert.equal(page.progress(), 0, 'disabling reduced motion restores the current scroll position');
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('older browsers keep finite updates and reduced-motion starts fully complete', () => {
  const page = setup({ observer: false });
  page.flush();
  page.scrollTo(620);
  assert(page.progress() > 0 && page.progress() < 1);
  assert.equal(page.values.size, 3);
  assert.equal(page.pending(), 0);
  const reduced = setup({ reduced: true, observer: false });
  assert.equal(reduced.progress(), 1);
  assert.equal(reduced.values.size, 0);
  assert.equal(reduced.pending(), 0);
});

test('unavailable, zero, or invalid SVG geometry keeps that path complete while other art still works', () => {
  const geometry = ['throw-length', 'zero-length'];
  const unavailable = setup({ geometry });
  unavailable.visible(true);
  unavailable.scrollTo(620);
  for (const path of unavailable.paths) {
    assert.equal(path.style.strokeDashoffset, '0', 'failed geometry keeps a fully drawn path');
    assert.equal(path.beacon.transform, `translate(${path.end} 92)`, 'the beacon stays at its native endpoint');
  }
  assert.equal(unavailable.values.size, 3, 'the independent ripple continues rendering');
  geometry[1] = 'usable';
  unavailable.resize();
  assert(Number(unavailable.paths[1].style.strokeDashoffset) > 0, 'resize retries the responsive path after it becomes usable');
  assert.equal(unavailable.paths[0].style.strokeDashoffset, '0', 'the still unavailable path remains safely complete');
  assert.equal(unavailable.pending(), 0, 'a geometry retry never starts a rendering loop');
  for (const failure of ['throw-point', 'invalid-point']) {
    const partial = setup({ geometry: [failure] });
    partial.visible(true);
    partial.scrollTo(620);
    assert.equal(partial.paths[0].style.strokeDashoffset, '0');
    assert.equal(partial.paths[0].beacon.transform, 'translate(980 92)');
    const workingProgress = 1 - Number(partial.paths[1].style.strokeDashoffset);
    assert(workingProgress > 0 && workingProgress < 1, 'a usable responsive path continues to draw');
    assert.equal(partial.values.size, 3);
    partial.reduce(true);
    assert.equal(partial.paths[1].style.strokeDashoffset, '0');
    assert.equal(partial.paths[1].beacon.transform, 'translate(380 92)');
    assert.equal(partial.pending(), 0);
  }
});
