import { conditions } from './premium-pages.mjs';

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** A compact, progressively enhanced directory. Selections never enter a lead form. */
export function supportDirectory(id = 'home-support') {
  const directoryId = slug(id) || 'home-support';
  return `<div class="dw-support-directory" id="${directoryId}" data-support-directory>
    <div class="dw-support-directory__intro"><span>Explore an area of support</span><span class="dw-support-directory__count">12 areas · One thoughtful approach</span></div>
    <div class="dw-support-directory__grid" role="group" aria-label="Areas of support">
      ${conditions.map(([title, description], index) => `<a class="dw-support-directory__choice" href="#${directoryId}-${slug(title)}" data-support-choice data-support-index="${index}" data-support-title="${escape(title)}" data-support-description="${escape(description)}"><span class="dw-support-directory__label">${escape(title)}</span><span class="dw-support-directory__indicator" aria-hidden="true">↗</span></a>`).join('')}
    </div>
    <div class="dw-support-directory__detail" data-support-detail hidden>
      <div class="dw-support-directory__description" aria-live="polite" aria-atomic="true"><h3 data-support-title>${escape(conditions[0][0])}</h3><p data-support-description>${escape(conditions[0][1])}</p></div>
      <a class="dw-support-directory__start" href="/pages/patient-intake-form/">Find your support <span aria-hidden="true">↗</span></a>
    </div>
    <details class="dw-support-directory__fallback" data-support-fallback><summary>Read about each area of support</summary><dl>${conditions.map(([title, description]) => `<div id="${directoryId}-${slug(title)}"><dt>${escape(title)}</dt><dd>${escape(description)}</dd></div>`).join('')}</dl><a href="/pages/patient-intake-form/">Find your support <span aria-hidden="true">↗</span></a></details>
  </div>`;
}
