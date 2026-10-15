// Keep the ambient light quiet while this page is in the background.
(() => {
  const syncVisibility = () => document.body.classList.toggle('dw-motion-paused', document.hidden);
  syncVisibility();
  document.addEventListener('visibilitychange', syncVisibility);
})();
