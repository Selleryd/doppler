(() => {
  const artworks = [...document.querySelectorAll('[data-support-lifeline], [data-support-ripple]')];
  if (!artworks.length) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  const records = new Map(artworks.map((art) => [art, {
    art,
    paths: [...art.querySelectorAll('[data-lifeline-path]')].map((path) => {
      const beacon = path.parentNode.querySelector('[data-lifeline-beacon]');
      const record = { path, beacon, endTransform: beacon?.getAttribute('transform'), length: 0, disabled: false };
      // A hidden responsive SVG may not expose usable geometry in every
      // browser. Keep that individual path in its complete native fallback.
      measurePath(record);
      return record;
    }),
  }]));
  let frame = 0;
  let retryGeometry = false;
  const clamp = (value) => Math.max(0, Math.min(1, value));

  function measurePath(record) {
    record.disabled = false;
    try { record.length = record.path.getTotalLength(); }
    catch { record.disabled = true; }
    if (!Number.isFinite(record.length) || record.length <= 0) record.disabled = true;
  }

  function lifelineProgress(rect) {
    // A short, native reading gesture. Both ends have a deliberate hold and
    // completion happens near the centre, while the entire line is in view.
    const startTop = window.innerHeight * .86;
    const finishTop = Math.max(24, (window.innerHeight - rect.height) * .52);
    const raw = (startTop - rect.top) / Math.max(1, startTop - finishTop);
    return clamp((raw - .08) / .84);
  }
  function waveState(record, progress) {
    return record.paths.map((geometry) => {
      const { path, beacon, length, endTransform } = geometry;
      if (!geometry.disabled) {
        try {
          const point = path.getPointAtLength(length * progress);
          if (Number.isFinite(point.x) && Number.isFinite(point.y)) return { path, beacon, progress, transform: `translate(${point.x} ${point.y})` };
        } catch { /* This SVG remains static while the other artwork works. */ }
        geometry.disabled = true;
      }
      return { path, beacon, progress: 1, transform: endTransform };
    });
  }
  function paintWave(states) {
    states.forEach(({ path, beacon, progress, transform }) => {
      path.style.strokeDashoffset = String(1 - progress);
      if (beacon && transform) beacon.setAttribute('transform', transform);
    });
  }
  function paint() {
    frame = 0;
    if (document.hidden || motion.matches) return;
    if (retryGeometry) {
      // A breakpoint change can reveal a formerly hidden responsive SVG.
      // Retry only on resize or entry, never in a continuing animation loop.
      visible.forEach((art) => records.get(art).paths.forEach((record) => { if (record.disabled) measurePath(record); }));
      retryGeometry = false;
    }
    // Read every visible box and every path point before writing any styles.
    // Scroll position is the only clock; nothing continues after scrolling.
    const measurements = [...visible].map((art) => {
      const record = records.get(art);
      const rect = art.getBoundingClientRect();
      return { record, rect, wave: record.paths.length ? waveState(record, lifelineProgress(rect)) : null };
    });
    measurements.forEach(({ record, rect, wave }) => {
      if (wave) { paintWave(wave); return; }
      const progress = clamp((window.innerHeight * .9 - rect.top) / (window.innerHeight * .8 + rect.height * .35));
      record.art.style.setProperty('--dw-support-spread', (.94 + progress * .12).toFixed(4));
      record.art.style.setProperty('--dw-support-drift', `${(5 - progress * 10).toFixed(2)}px`);
      record.art.style.setProperty('--dw-support-pebble', `${(2 - progress * 4).toFixed(2)}px`);
    });
  }
  function cancel() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  }
  function schedule() {
    if (!frame && visible.size && !motion.matches && !document.hidden) frame = requestAnimationFrame(paint);
  }
  function resetMotion() {
    cancel();
    // Default HTML and reduced motion both show the complete, settled line.
    const settled = [...records.values()].filter(({ paths }) => paths.length).flatMap((record) => waveState(record, 1));
    paintWave(settled);
    artworks.forEach((art) => ['--dw-support-spread', '--dw-support-drift', '--dw-support-pebble'].forEach((property) => art.style.removeProperty(property)));
    schedule();
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { visible.add(target); retryGeometry = true; }
        else visible.delete(target);
      });
      if (!visible.size) cancel();
      schedule();
    });
    artworks.forEach((art) => observer.observe(art));
  } else {
    artworks.forEach((art) => visible.add(art));
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', () => { retryGeometry = true; schedule(); }, { passive: true });
  document.addEventListener('visibilitychange', () => document.hidden ? cancel() : schedule());
  motion.addEventListener('change', resetMotion);
  schedule();
})();
