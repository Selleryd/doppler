const svg = (paths, kind = 'arrow') => `<svg class="dw-${kind}-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">${paths}</svg>`;
const line = paths => `<path d="${paths}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`;
export const arrowIcon = svg(line('M3.5 14.5 14.5 3.5M6 3.5h8.5V12'));
const icons = {
  '↗': arrowIcon,
  '↘': svg(line('m3.5 3.5 11 11M6 14.5h8.5V6')),
  '→': svg(line('M3 9h12m-5-5 5 5-5 5')),
  '←': svg(line('M15 9H3m5-5L3 9l5 5')),
  '↓': svg(line('M9 3v12m-5-5 5 5 5-5')),
  '↑': svg(line('M9 15V3M4 8l5-5 5 5')),
  '✓': svg(line('m3.5 9.25 3.3 3.3 7.7-8'), 'check'),
  '✔': svg(line('m3.5 9.25 3.3 3.3 7.7-8'), 'check'),
  '✅': svg(line('m3.5 9.25 3.3 3.3 7.7-8'), 'check'),
  '✦': svg('<path d="M9 1.5c1.1 5 2.5 6.4 7.5 7.5-5 1.1-6.4 2.5-7.5 7.5C7.9 11.5 6.5 10.1 1.5 9 6.5 7.9 7.9 6.5 9 1.5Z" fill="currentColor"/>', 'sparkle'),
};
icons['✨'] = icons['✦'];

// Content remains readable when a responsive layout suppresses a line break.
// Icons are vectors, so a device never substitutes its emoji font.
export function refineSiteMarkup(html) {
  return html.replace(/(<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<[^>]+>)|([^<]+)/gi, (whole, tag, text) => {
    if (tag) return /^<br\s*\/?\s*>$/i.test(tag) ? `${tag} ` : tag;
    return text.replace(/([↗↘→←↓↑✓✔✅✦✨])[\uFE0E\uFE0F]?/gu, (_, character) => icons[character]);
  });
}
