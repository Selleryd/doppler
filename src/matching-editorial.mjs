const arrow = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const considerations = [
  { label: 'Your needs', copy: 'Your experiences, health, and goals shape the kind of support we look for.' },
  { label: 'Your preferences', copy: 'Practical guidance, room to reflect, or a little of both. Your comfort matters.' },
  { label: 'Your daily life', copy: 'Home, family, insurance, and assisted living. Care should fit into your world.' },
];

const support = [
  { title: 'Help with insurance', copy: 'We help you understand coverage and handle the insurance details.' },
  { title: 'A connected care team', copy: 'With your consent, we keep the people involved in your care up to date.' },
  { title: 'Room for connection', copy: 'Support groups offer another place to share, listen, and feel less alone.' },
];

export function matchingEditorial() {
  return `<section class="dw-match-edit" data-matching-editorial aria-labelledby="matching-fit-title">
    <div class="dw-match-edit-wrap">
      <div class="dw-match-edit-layout">
        <figure class="dw-match-edit-figure">
          <div class="dw-match-edit-art">
            <img src="/assets/matching-conversation-v38.webp" srcset="/assets/matching-conversation-v38-sm.webp 640w, /assets/matching-conversation-v38.webp 1122w" sizes="(max-width: 860px) calc(100vw - 48px), (max-width: 1448px) 44vw, 576px" width="1122" height="1402" alt="An older adult and a therapist sharing a relaxed conversation." loading="lazy" decoding="async">
          </div>
          <figcaption>A more human beginning.</figcaption>
        </figure>
        <div class="dw-match-edit-content">
          <p class="dw-match-edit-eyebrow"><span aria-hidden="true"></span>A match that starts with you</p>
          <h2 id="matching-fit-title">Less searching.<br> <em>More feeling understood.</em></h2>
          <p class="dw-match-edit-lead">You shouldn’t have to try therapist after therapist. We listen first, then find a clinician who fits your needs and preferences.</p>
          <dl class="dw-match-edit-considerations">${considerations.map((item, index) => `<div><dt><span aria-hidden="true">0${index + 1}</span>${item.label}</dt><dd>${item.copy}</dd></div>`).join('')}</dl>
          <div class="dw-match-edit-actions">
            <a class="dw-match-edit-primary" href="#find-care">Find your support ${arrow}</a>
            <a class="dw-match-edit-link" href="/pages/why-doppler-therapy/">Our approach ${arrow}</a>
          </div>
        </div>
      </div>
      <div class="dw-match-edit-support">
        <div class="dw-match-edit-ruler" aria-hidden="true"></div>
        <p class="dw-match-edit-support-intro">And a little more support around you.</p>
        <div class="dw-match-edit-support-grid">${support.map(item => `<div><h3>${item.title}</h3><p>${item.copy}</p></div>`).join('')}</div>
      </div>
    </div>
  </section>`;
}
