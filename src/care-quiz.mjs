/** Four-step contact request. The office completes clinical intake personally. */
const states = 'AL:Alabama|AK:Alaska|AZ:Arizona|AR:Arkansas|CA:California|CO:Colorado|CT:Connecticut|DE:Delaware|DC:District of Columbia|FL:Florida|GA:Georgia|HI:Hawaii|ID:Idaho|IL:Illinois|IN:Indiana|IA:Iowa|KS:Kansas|KY:Kentucky|LA:Louisiana|ME:Maine|MD:Maryland|MA:Massachusetts|MI:Michigan|MN:Minnesota|MS:Mississippi|MO:Missouri|MT:Montana|NE:Nebraska|NV:Nevada|NH:New Hampshire|NJ:New Jersey|NM:New Mexico|NY:New York|NC:North Carolina|ND:North Dakota|OH:Ohio|OK:Oklahoma|OR:Oregon|PA:Pennsylvania|RI:Rhode Island|SC:South Carolina|SD:South Dakota|TN:Tennessee|TX:Texas|UT:Utah|VT:Vermont|VA:Virginia|WA:Washington|WV:West Virginia|WI:Wisconsin|WY:Wyoming|PR:Puerto Rico|VI:U.S. Virgin Islands|GU:Guam|AS:American Samoa|MP:Northern Mariana Islands'.split('|').map(x => x.split(':'));
const icon = (path, cls = '') => `<svg class="dq-icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
const icons = {
  person: icon('<circle cx="12" cy="7.5" r="3.5"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>'),
  family: icon('<circle cx="9" cy="7" r="3"/><path d="M3 19v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 5v1"/>'),
  care: icon('<path d="M12 20s-8-4.8-8-10.2a4.7 4.7 0 0 1 8-3.4 4.7 4.7 0 0 1 8 3.4C20 15.2 12 20 12 20Z"/>'),
  home: icon('<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>'),
  video: icon('<rect x="3" y="6" width="12" height="12" rx="3"/><path d="m15 10 6-3v10l-6-3"/>'),
  chat: icon('<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 10 10 0 0 1-4-.8L3 21l1.8-5.5a10 10 0 0 1-.8-4 8.5 8.5 0 0 1 17 0Z"/><path d="M8 11h9M8 14h5"/>'),
  match: icon('<path d="M5 5h4v4H5zM15 15h4v4h-4zM7 9v6a2 2 0 0 0 2 2h6M9 7h6a2 2 0 0 1 2 2v6"/><path d="m14 4 2-2 2 2M4 14l-2 2 2 2"/>'),
  shield: icon('<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z"/><path d="m8 12 3 3 5-6"/>'),
};
const arrow = icon('<path d="M4 12h16m-6-6 6 6-6 6"/>');
const benefit = (symbol, title, text) => `<aside class="dq-benefit">${icons[symbol]}<div><strong>${title}</strong><p>${text}</p></div></aside>`;
const choice = (prefix, name, value, title, detail, symbol, checked = false) => `<label class="dq-choice" for="${prefix}-${name}-${value.toLowerCase().replaceAll(' ', '-')}"><input id="${prefix}-${name}-${value.toLowerCase().replaceAll(' ', '-')}" type="radio" name="${name}" value="${value}" required${checked ? ' checked' : ''}>${icons[symbol]}<span class="dq-choice-copy"><strong>${title}</strong>${detail ? `<small>${detail}</small>` : ''}</span><span class="dq-choice-check" aria-hidden="true"></span></label>`;
const field = (prefix, name, title, attributes) => `<label class="dq-field" for="${prefix}-${name}"><span>${title}</span><input id="${prefix}-${name}" name="${name}" ${attributes}></label>`;

export function careQuiz(id = 'hero') {
  const formId = String(id).replace(/[^a-zA-Z0-9_-]/g, '-') || 'care';
  const prefix = `dq-${formId}`;
  return `<form class="dq-quiz dw-care-quiz" id="${formId}" data-patient-quiz method="post" action="/api/leads" novalidate aria-label="Find personalized care">
  <div class="dq-topline"><span class="dq-eyebrow">Your first step</span><span class="dq-counter" data-quiz-counter>01 / 04</span></div>
  <ol class="dq-progress" aria-label="Your care request progress">${['About you', 'Care preference', 'A few details', 'Connect'].map((label, i) => `<li data-quiz-progress${i === 0 ? ' aria-current="step"' : ''}><span>${i + 1}. ${label}</span></li>`).join('')}</ol>
  <div class="dq-stages" data-quiz-stages>
    <fieldset class="dq-step" data-quiz-step="0" aria-labelledby="${prefix}-step-0">
      <h3 id="${prefix}-step-0" tabindex="-1">Who are you<br>finding <em>care for?</em></h3><p class="dq-intro">We’ll help you take the next step.</p>
      <div class="dq-choices">
        ${choice(prefix, 'relationship', 'self', 'Myself', '', 'person')}
        ${choice(prefix, 'relationship', 'family', 'A family member', '', 'family')}
        ${choice(prefix, 'relationship', 'professional', 'Someone in my care', '', 'care')}
      </div>
      ${benefit('match', 'We find the therapist for you.', 'A thoughtful match, shaped around the person and their needs.')}
    </fieldset>
    <fieldset class="dq-step" data-quiz-step="1" aria-labelledby="${prefix}-step-1" hidden disabled>
      <h3 id="${prefix}-step-1" tabindex="-1">Where would you<br>feel <em>most comfortable?</em></h3><p class="dq-intro">Choose a preference. We’ll explore the options.</p>
      <div class="dq-choices">
        ${choice(prefix, 'careFormat', 'In person', 'In person', 'A familiar, welcoming setting', 'home')}
        ${choice(prefix, 'careFormat', 'Telehealth', 'By video', 'Connect from wherever you feel at ease', 'video')}
        ${choice(prefix, 'careFormat', 'Help me decide', 'Help me decide', 'Talk through it with our team', 'chat')}
      </div>
      ${benefit('care', 'Care that fits your life.', 'We help arrange in-person or telehealth support, based on availability.')}
    </fieldset>
    <fieldset class="dq-step" data-quiz-step="2" aria-labelledby="${prefix}-step-2" hidden disabled>
      <h3 id="${prefix}-step-2" tabindex="-1">A little context.<br><em>A clearer next step.</em></h3><p class="dq-intro">Tell us where the person receiving care is based.</p>
      <div class="dq-details">
        <label class="dq-field" for="${prefix}-state"><span>State of residence</span><select id="${prefix}-state" name="state" required autocomplete="address-level1"><option value="">Select a state</option>${states.map(([code, name]) => `<option value="${code}">${name}</option>`).join('')}</select></label>
        <label class="dq-field" for="${prefix}-insurance"><span>Insurance <small>Optional</small></span><select id="${prefix}-insurance" name="insurance"><option value="">Select an option</option>${['Medicare', 'Commercial PPO', 'Other insurance', 'Not sure', 'Self-pay'].map(x => `<option value="${x}">${x}</option>`).join('')}</select></label>
      </div>
      ${benefit('shield', 'Less paperwork. More support.', 'Our team helps check benefits and explain coverage before care begins.')}
    </fieldset>
    <fieldset class="dq-step dq-contact" data-quiz-step="3" aria-labelledby="${prefix}-step-3" hidden disabled>
      <h3 id="${prefix}-step-3" tabindex="-1">Let’s make it<br><em>personal.</em></h3><p class="dq-intro">How can our team reach you?</p>
      <div class="dq-name-row">
        ${field(prefix, 'firstName', 'Your first name', 'type="text" autocomplete="given-name" maxlength="80" required')}
        ${field(prefix, 'lastName', 'Your last name', 'type="text" autocomplete="family-name" maxlength="80" required')}
      </div>
      <fieldset class="dq-channel"><legend>Preferred contact</legend><div class="dq-channel-options"><label><input type="radio" name="contactPreference" value="Phone" checked><span>Phone</span></label><label><input type="radio" name="contactPreference" value="Email"><span>Email</span></label></div></fieldset>
      <div data-quiz-channel="Phone">${field(prefix, 'phone', 'Your phone number', 'type="tel" autocomplete="tel" inputmode="tel" maxlength="32" required')}</div>
      <div data-quiz-channel="Email" hidden>${field(prefix, 'email', 'Your email address', 'type="email" autocomplete="email" inputmode="email" maxlength="254" disabled')}</div>
      <label class="dq-consent" for="${prefix}-consent"><input id="${prefix}-consent" type="checkbox" name="consent" required><span>I agree that Doppler Wellness may contact me about this request.</span></label>
      ${benefit('chat', 'A real team takes it from here.', 'We’ll contact you, send the full intake, and coordinate with your care team with permission.')}
    </fieldset>
  </div>
  <label class="dq-honeypot" aria-hidden="true" for="${prefix}-website">Leave this blank<input id="${prefix}-website" name="website" type="text" tabindex="-1" autocomplete="off"></label>
  <p class="dq-status" data-quiz-status role="status" aria-live="polite" aria-atomic="true"></p>
  <div class="dq-controls" data-quiz-controls><button type="button" class="dq-back" data-quiz-back hidden>${icon('<path d="M20 12H4m6 6-6-6 6-6"/>')}<span>Back</span></button><button type="submit" class="dq-next" data-quiz-next disabled><span data-quiz-next-label>Continue</span>${arrow}</button></div>
  <div class="dq-success" data-quiz-success hidden tabindex="-1"><span class="dq-success-mark">${icon('<path d="m5 12 4 4L19 6"/>')}</span><span class="dq-eyebrow">Your request is received</span><h3>You’ve taken<br><em>the first step.</em></h3><p>Our team will contact you to learn more, help with insurance, and send the full intake.</p><p class="dq-success-note">Your therapist match comes after that personal conversation.</p><a href="mailto:team@dopplerwellness.com">Contact our team ${arrow}</a></div>
  <noscript><style>[data-patient-quiz] .dq-stages,[data-patient-quiz] .dq-progress,[data-patient-quiz] .dq-controls,[data-patient-quiz] .dq-topline{display:none!important}</style><p class="dq-noscript">Please enable JavaScript to use these steps, or email <a href="mailto:team@dopplerwellness.com">team@dopplerwellness.com</a> to get started.</p></noscript>
</form>`;
}
