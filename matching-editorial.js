/* A small decorative rule follows ordinary scrolling. It never controls the page. */
(() => {
  const sections = [...document.querySelectorAll('[data-matching-editorial]')];
  if (!sections.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const visible = new Set();
  let pending = 0;
  const paint = () => {
    pending = 0;
    if (document.hidden || reduced.matches) return;
    visible.forEach(section => {
      const rect = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (window.innerHeight * .9 - rect.top) / (rect.height + window.innerHeight * .65)));
      section.style.setProperty('--dw-match-edit-progress', progress.toFixed(4));
    });
  };
  const schedule = () => {
    if (!pending && visible.size && !document.hidden && !reduced.matches) pending = requestAnimationFrame(paint);
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      if (!visible.size && pending) { cancelAnimationFrame(pending); pending = 0; }
      schedule();
    });
    sections.forEach(section => observer.observe(section));
  } else sections.forEach(section => visible.add(section));
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && pending) { cancelAnimationFrame(pending); pending = 0; }
    else schedule();
  });
  reduced.addEventListener?.('change', () => {
    if (reduced.matches) {
      if (pending) cancelAnimationFrame(pending);
      pending = 0;
      sections.forEach(section => section.style.removeProperty('--dw-match-edit-progress'));
    } else schedule();
  });
  schedule();
})();
