import { conditions } from './premium-pages.mjs';

const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// This is deliberately separate from the condition list: the line brings a
// little life to the page without asking someone to chase moving information.
const lifeline = (id) => {
  const shapes = [
    { name: 'wide', width: 1000, end: '980 92', path: 'M20 94H70C99 94 104 48 132 48S167 138 196 138S229 60 261 60S302 121 335 121S374 73 411 73S455 112 493 112S535 80 578 80S627 103 674 103S724 87 772 87S824 96 873 96S934 92 980 92' },
    { name: 'compact', width: 400, end: '380 92', path: 'M20 94H36C53 94 59 48 78 48S104 133 126 133S155 65 179 65S211 116 235 116S265 81 290 81S325 97 348 97S366 92 380 92' },
  ];
  return `<div class="dw-support-edit-lifeline" data-support-lifeline aria-hidden="true">${shapes.map(({ name, width, end, path }) => `<svg class="dw-support-edit-wave dw-support-edit-wave--${name}" viewBox="0 0 ${width} 180" fill="none" focusable="false">
    <defs><linearGradient id="${id}-lifeline-${name}" x1="20" y1="90" x2="${width - 20}" y2="90" gradientUnits="userSpaceOnUse"><stop stop-color="#d7ac49"/><stop offset=".36" stop-color="#ba9bbd"/><stop offset=".72" stop-color="#8768b0"/><stop offset="1" stop-color="#674699"/></linearGradient></defs>
    <path class="dw-support-edit-wave-track" d="${path}" stroke="#b8a7c4" stroke-opacity=".17" stroke-width="1.3" vector-effect="non-scaling-stroke"/>
    <path class="dw-support-edit-wave-line" data-lifeline-path d="${path}" pathLength="1" stroke="url(#${id}-lifeline-${name})" stroke-width="2" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="0" vector-effect="non-scaling-stroke"/>
    <g class="dw-support-edit-wave-beacon" data-lifeline-beacon transform="translate(${end})"><circle r="10" fill="#8965aa" fill-opacity=".09"/><circle r="3.8" fill="#72509d" stroke="#fffaf0" stroke-width="1.5" vector-effect="non-scaling-stroke"/></g>
  </svg>`).join('')}</div>`;
};

// A small piece of dimensional artwork, rather than a diagram that has to be
// deciphered. Its meaning is stated in the neighbouring, always-visible copy.
const ripple = (id) => `<div class="dw-support-edit-art" data-support-ripple aria-hidden="true">
  <svg class="dw-support-edit-ripple" viewBox="0 0 660 380" fill="none">
    <defs>
      <linearGradient id="${id}-ripple-light" x1="83" y1="95" x2="553" y2="304" gradientUnits="userSpaceOnUse"><stop stop-color="#ffdc76"/><stop offset=".32" stop-color="#ded3f1"/><stop offset=".68" stop-color="#a995d3"/><stop offset="1" stop-color="#eee5c9"/></linearGradient>
      <linearGradient id="${id}-ripple-edge" x1="330" y1="126" x2="330" y2="283" gradientUnits="userSpaceOnUse"><stop stop-color="#b3a3cd" stop-opacity=".16"/><stop offset=".65" stop-color="#a18cbf" stop-opacity=".38"/><stop offset="1" stop-color="#8c72b4" stop-opacity=".72"/></linearGradient>
      <linearGradient id="${id}-ripple-core" x1="306" y1="165" x2="355" y2="216" gradientUnits="userSpaceOnUse"><stop stop-color="#fff5b4"/><stop offset=".55" stop-color="#f6d269"/><stop offset="1" stop-color="#d4a858"/></linearGradient>
    </defs>
    <g class="dw-support-edit-rings">
      <ellipse cx="330" cy="216" rx="267" ry="94" stroke="url(#${id}-ripple-edge)" stroke-width="1" opacity=".46"/>
      <ellipse cx="330" cy="212" rx="267" ry="94" stroke="url(#${id}-ripple-light)" stroke-width="1.5" opacity=".58"/>
      <ellipse cx="330" cy="215" rx="211" ry="74" fill="#fffdf7" fill-opacity=".12" stroke="url(#${id}-ripple-edge)" stroke-width="1.5" opacity=".68"/>
      <ellipse cx="330" cy="210" rx="211" ry="74" stroke="url(#${id}-ripple-light)" stroke-width="2" opacity=".83"/>
      <ellipse cx="330" cy="215" rx="157" ry="55" fill="#fffdf7" fill-opacity=".16" stroke="url(#${id}-ripple-edge)" stroke-width="2"/>
      <ellipse cx="330" cy="208" rx="157" ry="55" stroke="url(#${id}-ripple-light)" stroke-width="2.8"/>
      <ellipse cx="330" cy="215" rx="105" ry="36" fill="#fffdf7" fill-opacity=".28" stroke="url(#${id}-ripple-edge)" stroke-width="2.5"/>
      <ellipse cx="330" cy="206" rx="105" ry="36" stroke="url(#${id}-ripple-light)" stroke-width="3.4"/>
      <ellipse cx="330" cy="213" rx="57" ry="20" fill="#eee7f5" fill-opacity=".48" stroke="url(#${id}-ripple-edge)" stroke-width="2.5"/>
      <ellipse cx="330" cy="203" rx="57" ry="20" fill="#fffaf0" fill-opacity=".4" stroke="url(#${id}-ripple-light)" stroke-width="3"/>
    </g>
    <g class="dw-support-edit-pebble">
      <path d="M308 194c0-10 10-18 22-18s22 8 22 18v6c0 10-10 18-22 18s-22-8-22-18v-6Z" fill="url(#${id}-ripple-core)"/>
      <ellipse cx="330" cy="193" rx="22" ry="16" fill="url(#${id}-ripple-core)" stroke="#fff7cf" stroke-width="1.2"/>
      <path d="M315 188c4-6 13-9 21-7" stroke="#fff9dc" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>
    </g>
  </svg>
</div>`;

export function supportEditorial(id = 'home-support-editorial') {
  if (!/^[A-Za-z][\w-]*$/.test(id)) throw new Error('Support editorial needs an SVG-safe id');
  return `<section class="dw-support-edit" data-support-editorial aria-labelledby="${id}-title">
  <div class="dw-support-edit-wrap">
    <div class="dw-support-edit-intro">
      <div class="dw-support-edit-heading"><span class="dw-support-edit-eyebrow">Support for life’s changing chapters</span><h2 id="${id}-title">Whatever this<br>chapter brings,<br><em>there’s room for you.</em></h2></div>
      <div class="dw-support-edit-intro-copy"><p>Some changes are expected. Others take us by surprise. We find a therapist who understands what you’re going through—and helps you find your way forward.</p><a class="dw-support-edit-link" href="#find-care">Find your support ${arrow}</a></div>
    </div>
    ${lifeline(id)}
    <div class="dw-support-edit-atlas"><p class="dw-support-edit-atlas-caption">We’re here to help with</p><ul class="dw-support-edit-areas">${conditions.map(([label]) => `<li>${label}</li>`).join('')}</ul><div class="dw-support-edit-atlas-footer"><p>You don’t need a diagnosis to start a conversation.</p><a class="dw-support-edit-link dw-support-edit-link--quiet" href="/pages/why-doppler-therapy/#what-we-help-with">Explore our care &amp; support ${arrow}</a></div></div>
    <div class="dw-support-edit-connection">
      <div class="dw-support-edit-connection-copy"><span class="dw-support-edit-eyebrow">The Doppler effect</span><h3>Feeling better can<br><em>ripple outward.</em></h3><p>When you feel more supported, connection can grow around you—with family, friends, and the people who care for you.</p><p class="dw-support-edit-consent">And with your permission, we help keep your care team in the conversation.</p></div>
      ${ripple(id)}
    </div>
  </div>
</section>`;
}
