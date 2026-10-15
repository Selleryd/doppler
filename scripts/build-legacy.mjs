import { cp, copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { articlesA } from '../src/articles-a.mjs';
import { articlesB } from '../src/articles-b.mjs';
import { legacyArticles } from '../src/articles-legacy.mjs';
import { createJournalBody, createToolsBody } from '../src/page-templates.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const src = join(root, 'src');
const dist = join(root, '.generated/legacy');

const links = {
  quiz: 'https://form.jotform.com/221866424710151',
  intake: 'https://hipaa.jotform.com/212377807897169',
  careers: 'https://hipaa.jotform.com/212468592144055',
  email: 'mailto:team@dopplerwellness.com'
};

const arrow = `<span class="icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" focusable="false"><path d="M3.5 14.5 14.5 3.5M6 3.5h8.5V12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>`;
const back = `<span class="icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" focusable="false"><path d="M15 9H3m5-5L3 9l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>`;
const forward = `<span class="icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" focusable="false"><path d="M3 9h12m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg></span>`;
const check = `<span class="check-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" focusable="false"><path d="m3.5 9.25 3.3 3.3 7.7-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`;

const brand = (base, light = false) => `<a class="brand${light ? ' brand-light' : ''}" href="${base || './'}" aria-label="Doppler Wellness home"><img class="brand-lockup" src="${base}assets/logo-lockup${light ? '-light' : ''}.svg" alt="" width="208" height="48"></a>`;

const meta = ({ title, description, canonical, base }) => `
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#FFE260">
  <meta name="color-scheme" content="light">
  <link rel="canonical" href="https://dopplerwellness.com${canonical}">
  <link rel="icon" href="${base}assets/mark.svg" type="image/svg+xml">
  <link rel="manifest" href="${base}site.webmanifest">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://dopplerwellness.com${canonical}">
  <meta property="og:image" content="https://dopplerwellness.com/assets/doppler-social-preview.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="An illustrated network of calm paths leading toward personal support">
  <meta name="twitter:card" content="summary_large_image">
  <script>document.documentElement.classList.add('js')</script>
  <link rel="stylesheet" href="${base}styles.css">`;

const header = (base, active = '') => {
  const current = (key) => key === active ? ' aria-current="page"' : '';
  const careActive = ['approach', 'mindfulness', 'at-home', 'insurance', 'faq'].includes(active);
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="scroll-progress" aria-hidden="true"><span></span></div>
  <header class="nav-wrap">
    <nav class="nav" aria-label="Primary navigation">
      ${brand(base)}
      <div class="desktop-nav">
        <a href="${base || './'}"${current('home')}>Home</a>
        <div class="nav-menu">
          <button type="button" data-menu-button aria-haspopup="true" aria-expanded="false" aria-controls="care-menu"${careActive ? ' data-section-current="true"' : ''}>Care <span aria-hidden="true">+</span></button>
          <div class="nav-popover" id="care-menu" data-menu-panel aria-hidden="true" inert>
            <a href="${base}pages/why-doppler-therapy/"${current('approach')}><b>Our approach</b><span>How personal matching works</span></a>
            <a href="${base}pages/mindfulness/"${current('mindfulness')}><b>Mindfulness</b><span>Room to pause, notice, and respond</span></a>
            <a href="${base}pages/at-home-therapy/"${current('at-home')}><b>At-home therapy</b><span>Human care from your own space</span></a>
            <a href="${base}pages/we-accept-insurance/"${current('insurance')}><b>Insurance</b><span>Prepare for a coverage check</span></a>
            <a href="${base}a/help/"${current('faq')}><b>Questions</b><span>Answers before you begin</span></a>
          </div>
        </div>
        <a href="${base}pages/our-mission/"${current('mission')}>Mission</a>
        <a href="${base}pages/mindfulness-tools/"${current('tools')}>Tools</a>
        <a href="${base}blogs/news/"${current('journal')}>Journal</a>
        <a href="${base}pages/careers/"${current('careers')}>For clinicians</a>
        <a href="${base}pages/contact/"${current('contact')}>Contact</a>
      </div>
      <div class="nav-actions">
        <a class="button button-small button-ink" href="${links.quiz}">Take the quiz ${arrow}</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open navigation"><span></span><span></span></button>
      </div>
    </nav>
    <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation">
      <div class="mobile-menu-head"><span>Explore Doppler</span><button type="button" data-menu-close aria-label="Close navigation">Close</button></div>
      <a href="${base || './'}"${current('home')}><span>Home</span>${arrow}</a>
      <a href="${base}pages/why-doppler-therapy/"${current('approach')}><span>Our approach</span>${arrow}</a>
      <a href="${base}pages/mindfulness/"${current('mindfulness')}><span>Mindfulness</span>${arrow}</a>
      <a href="${base}pages/at-home-therapy/"${current('at-home')}><span>At-home therapy</span>${arrow}</a>
      <a href="${base}pages/our-mission/"${current('mission')}><span>Our mission</span>${arrow}</a>
      <a href="${base}pages/mindfulness-tools/"${current('tools')}><span>Mindfulness tools</span>${arrow}</a>
      <a href="${base}pages/we-accept-insurance/"${current('insurance')}><span>Insurance</span>${arrow}</a>
      <a href="${base}a/help/"${current('faq')}><span>Questions</span>${arrow}</a>
      <a href="${base}blogs/news/"${current('journal')}><span>Journal</span>${arrow}</a>
      <a href="${base}pages/careers/"${current('careers')}><span>For clinicians</span>${arrow}</a>
      <a href="${base}pages/contact/"${current('contact')}><span>Contact</span>${arrow}</a>
      <a class="button button-iris" href="${links.quiz}">Take the quiz ${arrow}</a>
    </nav>
  </header>`;
};

const footer = (base, mode = 'match') => {
  const callsToAction = {
    match: {
      kicker: 'You do not need a perfect reason',
      title: 'Start with what feels <em>true today.</em>',
      copy: 'The quiz is a first step, not a diagnosis. It helps Doppler begin the matching process. Eligibility and therapist availability vary.',
      label: 'Take the quiz',
      href: links.quiz
    },
    intake: {
      kicker: 'Ready for the next step',
      title: 'Share your details in the <em>right place.</em>',
      copy: 'Use Doppler’s designated patient intake workflow when you are ready to share personal and care-related information.',
      label: 'Open patient intake',
      href: links.intake
    },
    clinician: {
      kicker: 'Bring more attention back to care',
      title: 'Do meaningful work, with <em>room to do it well.</em>',
      copy: 'Explore current clinician opportunities, thoughtfully matched referrals, flexible care formats, and Doppler’s collaborative practice environment.',
      label: 'Open clinician application',
      href: links.careers
    },
    complete: {
      kicker: 'You have taken the first step',
      title: 'Let the next step arrive <em>clearly.</em>',
      copy: 'Doppler will review what you shared. You can return to the site for practical guidance while you wait for the team’s next communication.',
      label: 'Contact Doppler',
      href: `${base}pages/contact/`
    }
  };
  const cta = callsToAction[mode] || callsToAction.match;
  return `
  <footer class="footer">
    <div class="crisis">
      <div><b>Need support right now?</b><span>In the U.S., call <a href="tel:911">911</a> if you or someone else is in immediate danger. Doppler is not an emergency service.</span></div>
      <div class="crisis-actions"><a href="tel:988">Call 988</a><a href="sms:741741?body=HOME">Text HOME to 741741</a></div>
    </div>
    <div class="footer-shell">
      <div class="footer-lead"><div><span class="kicker">${cta.kicker}</span><h2>${cta.title}</h2><p>${cta.copy}</p></div><a class="button button-ink" href="${cta.href}">${cta.label} ${arrow}</a></div>
      <div class="footer-grid">
        <div class="footer-about">${brand(base, true)}<p>Mindfulness-informed mental wellness care with at-home and in-person options. Eligibility and availability depend on age, location, and a clinician licensed to provide care where you are.</p></div>
        <div><h3>Care</h3><a href="${base}pages/why-doppler-therapy/">Our approach</a><a href="${base}pages/mindfulness/">Mindfulness</a><a href="${base}pages/mindfulness-tools/">Mindfulness tools</a><a href="${base}pages/at-home-therapy/">At-home therapy</a><a href="${base}pages/we-accept-insurance/">Insurance</a><a href="${base}a/help/">Questions</a><a href="${links.quiz}">Take the quiz</a></div>
        <div><h3>Doppler</h3><a href="${base}pages/our-mission/">Mission</a><a href="${base}pages/careers/">For clinicians</a><a href="${base}blogs/news/">Journal</a><a href="${base}pages/contact/">Contact</a></div>
        <div><h3>Connect</h3><a href="${links.email}">team@dopplerwellness.com</a><a href="${base}pages/patient-intake-form/">Patient intake</a><a href="${base}pages/employee-application/">Clinician application</a></div>
      </div>
      <div class="footer-bottom"><span>© <span data-year></span> Doppler Wellness</span><span>Confirm eligibility, location, availability, and insurance participation before care.</span></div>
    </div>
  </footer>`;
};

const imageSize = (path) => {
  if (path.includes('scene-arrive') || path.includes('scene-carry')) return [1920, 722];
  if (path.includes('scene-notice')) return [1920, 791];
  if (path.includes('scene-hero') || path.includes('scene-understand') || path.includes('scene-in-person') || path.includes('scene-virtual')) return [1672, 941];
  if (path.includes('illustration-constellation')) return [1254, 1254];
  if (path.includes('illustration-pathways')) return [1584, 990];
  if (path.includes('illustration-insurance') || path.includes('illustration-clinicians') || path.includes('illustration-contact')) return [1448, 1086];
  return [1536, 1024];
};

const smallImageWidth = (path) => {
  if (path.includes('illustration-constellation')) return 640;
  if (path.includes('scene-')) return 960;
  return 800;
};

const mediaShape = (width, height) => {
  if (width === height) return 'square';
  if (width / height > 1.5) return 'wide';
  return 'landscape';
};

const layout = ({ title, description, canonical, base, active, body, schema = '', footerMode = 'match', bodyClass = '' }) => `<!doctype html>
<html lang="en">
<head>${meta({ title, description, canonical, base })}${schema ? `\n  <script type="application/ld+json">${schema}</script>` : ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
  ${header(base, active)}
  <main id="main" tabindex="-1">${body}</main>
  ${footer(base, footerMode)}
  <script src="${base}app.js" defer></script>
</body>
</html>`;

const pageHero = ({ eyebrow, title, lede, image, alt, tone = 'ink', ctaHref = links.quiz, ctaLabel = 'Take the quiz' }) => {
  const [width, height] = imageSize(image);
  const smallImage = image.replace(/\.webp$/, '-sm.webp');
  const smallWidth = smallImageWidth(image);
  return `
  <section class="page-hero page-hero-${tone}">
    <picture class="page-hero-scene" data-reveal="image" data-reveal-delay="1">
      <source media="(max-width: 820px)" srcset="${smallImage} ${smallWidth}w, ${image} ${width}w" sizes="100vw">
      <img src="${image}" alt="${alt}" width="${width}" height="${height}" fetchpriority="high" decoding="async">
    </picture>
    <div class="page-hero-wash" aria-hidden="true"></div>
    <div class="page-hero-copy" data-reveal>
      <span class="kicker">${eyebrow}</span>
      <h1>${title}</h1>
      <p>${lede}</p>
      <a class="text-link" href="${ctaHref}">${ctaLabel} ${arrow}</a>
    </div>
  </section>`;
};

const trustRail = `
  <section class="trust-rail" aria-label="Doppler care highlights">
    <div>${check}<b>Thoughtful therapist matching</b></div>
    <div>${check}<b>At home or in person</b></div>
    <div>${check}<b>Mindfulness when it helps</b></div>
    <div>${check}<b>Clear next steps</b></div>
  </section>`;

const supportItems = [
  ['When your mind will not slow down.', 'Anxiety & stress', 'Make room between the pressure you feel and the choice you make next.'],
  ['When getting through the day feels heavy.', 'Depression', 'Find a place to be honest, build structure, and move one step at a time.'],
  ['When the past still feels close.', 'Trauma', 'Move at a pace centered on safety, trust, and your goals.'],
  ['When life changed before you were ready.', 'Grief & change', 'Make space for what was lost—and for what may come next.'],
  ['When the same conversation keeps hurting.', 'Relationships', 'Work on communication, boundaries, repair, and connection.'],
  ['When you want change without shame.', 'Substance use', 'Explore support for recovery, change, and the people beside you.'],
  ['When no one prepared you for this chapter.', 'Life transitions', 'Talk through caregiving, aging, identity, health changes, and transition.']
];

const breathExperience = (compact = false) => `
  <article class="breath-tool${compact ? ' breath-tool-home' : ''}" data-breath-tool data-phase="idle">
    <div class="tool-heading">
      <div class="tool-brand"><span class="tool-brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><div><strong>Doppler Pause</strong><small>Guided breathing</small></div></div>
      <b><i aria-hidden="true"></i> Silent by default</b>
    </div>
    <div class="breath-stage" aria-hidden="true"><div class="breath-stage-label"><span>Follow the light</span><i>Natural pace</i></div><div class="breath-halo"><i></i><i></i><i></i><span data-breath-visual-word>Arrive</span></div><div class="breath-orbit"><i></i><i></i><i></i></div></div>
    <div class="breath-content">
      <span class="breath-overline">A small reset, right where you are</span>
      <h3 data-breath-phase>Take one easy breath.</h3>
      <p data-breath-instruction>Follow the light at a comfortable pace. There is no need to breathe more deeply than feels natural.</p>
      <div class="breath-options"><div role="group" aria-label="Choose breathing exercise length"><button type="button" aria-pressed="true" data-breath-duration="63">About one minute</button><button type="button" aria-pressed="false" data-breath-duration="28">About 30 seconds</button></div><button type="button" aria-pressed="false" data-breath-text-only>Text cues only</button></div>
      <div class="breath-actions"><button class="button button-ink" type="button" data-breath-start><span data-breath-start-label>Begin</span>${arrow}</button><button class="quiet-button" type="button" data-breath-end hidden>Stop</button></div>
      <div class="breath-progress" role="progressbar" aria-label="Breathing exercise progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i data-breath-progress></i></div>
      <p class="tool-status" data-breath-status aria-live="polite" aria-atomic="true">Ready when you are.</p>
      ${compact ? `<a class="text-link breath-alternative" href="pages/mindfulness-tools/#grounding">Use grounding instead ${arrow}</a>` : ''}
    </div>
  </article>`;

const soundExperience = `
  <article class="sound-tool" data-sound-tool data-sound="rain" data-playing="false">
    <div class="tool-heading"><span>Ambient sound</span><b>Off</b></div>
    <div class="sound-sky" aria-hidden="true"><i></i><i></i><i></i><i></i><span>Listen</span></div>
    <div class="sound-content">
      <h3>Settle with sound.</h3>
      <p>Choose a softly generated sound texture for reflection, reading, or a quiet pause. Audio begins only when you ask.</p>
      <div class="sound-choices" role="group" aria-label="Choose ambient sound"><button type="button" aria-pressed="true" data-sound-choice="rain">Gentle rain</button><button type="button" aria-pressed="false" data-sound-choice="ocean">Ocean hush</button><button type="button" aria-pressed="false" data-sound-choice="brown">Soft noise</button></div>
      <label class="volume-control"><span>Volume</span><input id="ambient-volume" type="range" min="0" max="35" value="14" data-sound-volume aria-label="Ambient sound volume" aria-valuetext="14 percent"><output for="ambient-volume" data-sound-volume-output>14%</output></label>
      <button class="button button-sand" type="button" data-sound-toggle aria-pressed="false"><span data-sound-label>Ambient sound</span>${arrow}</button>
      <p class="tool-status" data-sound-status aria-live="polite" aria-atomic="true">Sound is off.</p>
    </div>
  </article>`;

const groundingExperience = `
  <article class="ground-tool" data-ground-tool>
    <div class="tool-heading"><span>Outside-in grounding</span><b>Eyes open</b></div>
    <div class="ground-scene" aria-hidden="true"><i></i><i></i><i></i><span data-ground-visual>Here</span></div>
    <div class="ground-content">
      <h3 data-ground-title>Return to the room.</h3>
      <p data-ground-copy>Let breathing happen on its own. This practice uses what you can see, hear, and feel around you.</p>
      <div class="ground-actions"><button class="button button-ink" type="button" data-ground-start><span data-ground-label>Begin grounding</span>${arrow}</button><button class="quiet-button" type="button" data-ground-reset hidden>Start over</button></div>
      <p class="tool-status" data-ground-status aria-live="polite" aria-atomic="true">Nothing to memorize.</p>
    </div>
  </article>`;

const reflectionExperience = `
  <article class="reflection-tool" data-reflection-tool>
    <div class="tool-heading"><span>A quiet check-in</span><b>No score</b></div>
    <div class="reflection-leaf" aria-hidden="true"><i></i><i></i><span>Notice</span></div>
    <div class="reflection-content">
      <h3 data-reflection-title>What is asking for your attention?</h3>
      <p data-reflection-copy>You do not need the perfect label. A few honest words are enough.</p>
      <div class="reflection-choices" role="group" aria-label="Choose a reflection prompt"><button type="button" aria-pressed="true" data-reflection-choice="notice">Notice</button><button type="button" aria-pressed="false" data-reflection-choice="need">Need</button><button type="button" aria-pressed="false" data-reflection-choice="next">Next step</button></div>
      <p class="tool-status sr-only" data-reflection-status aria-live="polite" aria-atomic="true">Notice prompt selected.</p>
      <a class="text-link" href="${links.quiz}">Bring this into a conversation ${arrow}</a>
    </div>
  </article>`;

const mindfulnessStudio = ({ compact = false } = {}) => `
  <section class="section calm-section${compact ? ' calm-section-home' : ''}" id="mindful-minute">
    <div class="section-label" data-reveal><span>${compact ? 'Try the kind of pause we mean' : 'Choose what feels supportive'}</span></div>
    <div class="calm-heading" data-reveal="line"><div><span class="kicker">${compact ? 'A practice for the moments between' : 'The Doppler tools room'}</span><h2>${compact ? 'Notice sooner. Create a pause. <em>Choose what follows.</em>' : 'A quiet place to <em>practice.</em>'}</h2></div><p>${compact ? 'When it fits your care, grounding, breathing, reflection, or meditation can help turn insight into something usable. Follow the light at a comfortable pace, or choose another anchor.' : 'Short, adjustable exercises for breathing, grounding, reflection, and settling with sound. Use what helps. Skip what does not.'}</p></div>
    <div class="calm-studio${compact ? ' calm-studio-home' : ' calm-studio-tools'}" data-calm-studio data-reveal>
      ${breathExperience(compact)}
      ${compact ? '' : `${groundingExperience}${soundExperience}${reflectionExperience}`}
    </div>
    ${compact ? `<div class="calm-note" data-reveal><span>Prefer another anchor?</span><a class="text-link" href="pages/mindfulness-tools/">Explore all mindfulness tools ${arrow}</a></div>` : `<div class="calm-note" data-reveal><b>Choice belongs in the practice.</b><span>Stop or switch tools whenever something does not feel supportive. These exercises are general wellness practices, not emergency care.</span></div>`}
  </section>`;

const homeBody = `
  <section class="hero hero-sanctuary" data-hero-world>
    <picture class="hero-world-scene" aria-hidden="true"><source media="(max-width: 620px)" srcset="assets/hero-mindfulness-world-sm.webp 1122w" sizes="100vw"><img src="assets/hero-mindfulness-world.webp" alt="" width="1672" height="941" fetchpriority="high" decoding="async"></picture>
    <div class="hero-world-wash" aria-hidden="true"></div>
    <div class="hero-signal" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="hero-copy" data-reveal="line">
      <h1><span>Therapy, with</span><em>room to breathe.</em></h1>
      <p>Finding help should not feel like another job. Tell Doppler what has been hard, how you want to be supported, and where therapy fits best. We’ll help you start with a therapist selected around more than an open appointment.</p>
      <div class="hero-review" aria-label="5.0 client rating, based on thousands of satisfied clients">
        <span class="hero-review-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span>
        <strong>5.0 client rating</strong>
        <span>Thousands of satisfied clients</span>
      </div>
      <div class="hero-actions"><a class="button button-ink" href="#quick-start">Help me find the right therapist ${arrow}</a><a class="text-link" href="#mindful-minute">Try a 60-second pause</a></div>
    </div>
    <form class="quick-start" id="quick-start" data-quick-start data-reveal data-reveal-delay="1" aria-labelledby="quick-start-title">
      <svg class="quick-start-botanical" viewBox="0 0 560 150" width="560" height="150" fill="none" aria-hidden="true" focusable="false"><path class="quick-vine-stem" pathLength="1" d="M574 12C499 7 461 31 422 68C384 104 330 104 283 79C239 55 201 62 157 99"/><ellipse class="quick-vine-leaf" cx="463" cy="39" rx="20" ry="8" transform="rotate(-28 463 39)"/><ellipse class="quick-vine-leaf" cx="420" cy="70" rx="18" ry="7" transform="rotate(24 420 70)"/><ellipse class="quick-vine-leaf" cx="369" cy="94" rx="19" ry="8" transform="rotate(-25 369 94)"/><ellipse class="quick-vine-leaf" cx="314" cy="91" rx="17" ry="7" transform="rotate(29 314 91)"/><ellipse class="quick-vine-leaf" cx="257" cy="70" rx="16" ry="7" transform="rotate(-22 257 70)"/></svg>
      <div class="quick-start-appbar"><div class="quick-start-brand"><div><span class="quick-start-eyebrow">A calm place to begin</span><strong id="quick-start-title">Find your starting point</strong><small>Three gentle taps · about 30 seconds</small></div></div><button type="button" data-quick-back hidden>Back</button></div>
      <div class="quick-start-top"><span data-quick-status aria-live="polite" aria-atomic="true">Step 1 of 3</span><div class="quick-progress" aria-hidden="true"><i class="is-active"></i><i></i><i></i></div></div>
      <noscript><div class="quick-noscript"><p>This preview needs JavaScript, but the full questionnaire is ready.</p><a class="button button-ink" href="${links.quiz}">Open the questionnaire ${arrow}</a></div></noscript>
      <fieldset data-quick-step="need"><legend>What would feel most helpful right now?</legend><div class="quick-choices"><button type="button" data-quick-answer data-key="need" data-value="Quiet the noise">Quiet the noise</button><button type="button" data-quick-answer data-key="need" data-value="Feel less stuck">Feel less stuck</button><button type="button" data-quick-answer data-key="need" data-value="Work through something hard">Work through something hard</button><button type="button" data-quick-answer data-key="need" data-value="Not sure yet">I’m not sure</button></div></fieldset>
      <fieldset data-quick-step="format" hidden inert><legend>How would you rather meet?</legend><div class="quick-choices"><button type="button" data-quick-answer data-key="format" data-value="At home">From home</button><button type="button" data-quick-answer data-key="format" data-value="In person">In person</button><button type="button" data-quick-answer data-key="format" data-value="Either">Either works</button></div></fieldset>
      <fieldset data-quick-step="style" hidden inert><legend>What kind of support sounds right?</legend><div class="quick-choices"><button type="button" data-quick-answer data-key="style" data-value="A gentle pace">A gentle pace</button><button type="button" data-quick-answer data-key="style" data-value="Practical tools">Practical tools</button><button type="button" data-quick-answer data-key="style" data-value="Space to talk">Space to talk</button></div></fieldset>
      <div class="quick-result" data-quick-result hidden inert><span>You have a starting point</span><h2>That is enough to begin.</h2><p>Your answers give Doppler a clearer starting point: what feels hard, where you want to meet, and how you want support to feel. You can change or add anything in the full questionnaire.</p><a class="button button-ink" href="${links.quiz}">Continue to the questionnaire ${arrow}</a><button class="quick-reset" type="button" data-quick-reset>Start over</button></div>
    </form>
  </section>
  ${trustRail}

  <section class="section section-soft support-section recognition-section">
    <div class="section-label" data-reveal><span>Before the label</span></div>
    <div class="split-heading" data-reveal="line"><h2>You may not know what to call it. <em>You know what it has been costing you.</em></h2><p>Sleep. Patience. Focus. Energy. Connection. Sometimes the clearest place to start is not a diagnosis—it is noticing what has become harder.</p></div>
    <div class="support-grid">${supportItems.map(([feeling, title, copy], i) => `<article class="support-card" data-reveal data-reveal-delay="${i % 3}"><div><small>${title}</small><h3>${feeling}</h3><p>${copy}</p></div><i aria-hidden="true"></i></article>`).join('')}</div>
  </section>

  <section class="section search-friction" aria-labelledby="search-friction-title">
    <div class="search-friction-copy" data-reveal="line"><span class="kicker">The first barrier</span><h2 id="search-friction-title">Looking for therapy can ask too much of the person already carrying too much.</h2><p>Names, biographies, credentials, insurance, availability, treatment styles—traditional searches can leave you comparing dozens of details before you know which ones will matter in the room. Doppler makes that first decision more human.</p></div>
    <div class="search-friction-map" data-reveal data-reveal-delay="1" role="img" aria-label="Doppler brings practical and personal considerations into one clearer starting point">
      <div class="search-orbit" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="search-signals" aria-hidden="true"><span>Availability</span><span>Insurance</span><span>Approach</span><span>Location</span><span>Conversation style</span></div>
      <div class="search-focus"><small>Doppler listens for</small><strong>What matters to you</strong><span>A clearer place to begin</span></div>
    </div>
  </section>

  <section class="living-practice" data-tabs aria-labelledby="matching-fit-title">
    <picture class="living-practice-scene" aria-hidden="true"><source media="(max-width: 820px)" srcset="assets/illustration-constellation-sm.webp 640w, assets/illustration-constellation.webp 1254w" sizes="100vw"><img src="assets/illustration-constellation.webp" alt="" width="1254" height="1254" loading="lazy" decoding="async"></picture>
    <div class="living-practice-wash" aria-hidden="true"></div>
    <div class="living-practice-shell">
      <div class="living-practice-intro" data-reveal><span class="kicker">How Doppler starts differently</span><h2 id="matching-fit-title">Doppler listens for the details that can shape <em>trust.</em></h2><p>Availability matters. It simply is not the whole decision.</p><a class="text-link text-link-light" href="pages/why-doppler-therapy/">See the complete matching approach ${arrow}</a></div>
      <div class="living-practice-tool" data-reveal data-reveal-delay="1">
        <div class="living-tool-heading"><span>A considered starting point</span><small>Not an endless directory</small></div>
        <div class="living-tabs" role="tablist" aria-label="Explore what can shape a therapist match"><button type="button" role="tab" id="fit-tab-style" aria-selected="true" aria-controls="fit-panel-style">What you’re carrying</button><button type="button" role="tab" id="fit-tab-context" aria-selected="false" aria-controls="fit-panel-context" tabindex="-1">How you want to work</button><button type="button" role="tab" id="fit-tab-practical" aria-selected="false" aria-controls="fit-panel-practical" tabindex="-1">What care must fit around</button></div>
        <div class="living-panels"><article id="fit-panel-style" role="tabpanel" aria-labelledby="fit-tab-style" data-tab-panel tabindex="0"><span>What you’re carrying</span><h3>Start with what has become harder.</h3><p>The concerns, patterns, experiences, and goals you choose to share help create a clearer starting point.</p></article><article id="fit-panel-context" role="tabpanel" aria-labelledby="fit-tab-context" data-tab-panel tabindex="0" hidden><span>How you want to work</span><h3>The way conversation feels matters.</h3><p>You may prefer direct guidance, reflective space, practical tools, deeper exploration, or room for more than one approach.</p></article><article id="fit-panel-practical" role="tabpanel" aria-labelledby="fit-tab-practical" data-tab-panel tabindex="0" hidden><span>What care must fit around</span><h3>Care also has to work in real life.</h3><p>At-home or in-person preferences, location, eligibility, scheduling, and clinician availability help narrow what is possible.</p></article></div>
        <div class="match-resolution" aria-hidden="true"><i></i><span><small>The result</small><b>A considered starting point</b></span></div>
      </div>
    </div>
  </section>

  <section class="emotional-story" data-scroll-story id="how-it-works">
    <div class="story-intro" data-reveal="line">
      <span class="kicker">What the path can feel like</span>
      <h2>Support begins to matter when it reaches <em>the life you actually live.</em></h2>
      <p>The goal is not a perfectly calm life. It is more understanding, more support, and more choice when difficult moments arrive.</p>
    </div>
    <div class="emotional-layout">
      <div class="emotional-visual">
        <figure class="is-active" data-story-scene><img src="assets/story-arrive.webp" srcset="assets/story-arrive-sm.webp 960w, assets/story-arrive.webp 1672w" sizes="(max-width: 1020px) calc(100vw - 32px), 52vw" alt="An illustrated person entering a calm, plant-filled threshold" width="1672" height="941" loading="eager" fetchpriority="high" decoding="async"></figure>
        <figure data-story-scene><img src="assets/story-notice.webp" srcset="assets/story-notice-sm.webp 960w, assets/story-notice.webp 1672w" sizes="(max-width: 1020px) calc(100vw - 32px), 52vw" alt="An illustrated person pausing beside still water and leaves" width="1672" height="941" loading="lazy" decoding="async"></figure>
        <figure data-story-scene><img src="assets/story-understand.webp" srcset="assets/story-understand-sm.webp 960w, assets/story-understand.webp 1672w" sizes="(max-width: 1020px) calc(100vw - 32px), 52vw" alt="An illustrated therapist and client talking in a warm botanical room" width="1672" height="941" loading="lazy" decoding="async"></figure>
        <figure data-story-scene><img src="assets/story-carry.webp" srcset="assets/story-carry-sm.webp 960w, assets/story-carry.webp 1672w" sizes="(max-width: 1020px) calc(100vw - 32px), 52vw" alt="An illustrated person walking through a botanical courtyard into morning light" width="1672" height="941" loading="lazy" decoding="async"></figure>
        <div class="story-dots" aria-hidden="true"><i class="is-active"></i><i></i><i></i><i></i></div>
      </div>
      <div class="emotional-chapters">
        <article class="is-active" data-story-chapter><span>Before reaching out</span><h3>It has been building.</h3><p>The worry follows you into bed. Your patience is thinner. Small decisions take more energy than they should. You keep waiting for life to calm down first.</p></article>
        <article data-story-chapter><span>The decision</span><h3>You stop trying to explain it perfectly.</h3><p>You tell Doppler what has been difficult, what kind of conversation may feel useful, and whether care from home or in person fits your life better.</p></article>
        <article data-story-chapter><span>The introduction</span><h3>The match begins with more context.</h3><p>Your needs and preferences help shape the starting point, together with practical considerations such as location, eligibility, and availability.</p></article>
        <article data-story-chapter><span>Beyond the session</span><h3>Then the work meets you in real life.</h3><p>A difficult moment still comes. But you may recognize the pattern sooner, create a pause before the familiar reaction, and bring another choice into the moment.</p><a class="text-link" href="pages/mindfulness/">See mindfulness in care ${arrow}</a></article>
      </div>
    </div>
    <div class="story-mobile-flow" data-mobile-story aria-label="Four moments in a path toward support">
      <div class="story-mobile-pin">
        <article class="story-mobile-moment is-active" data-mobile-story-card>
          <figure><img src="assets/story-arrive-sm.webp" srcset="assets/story-arrive-sm.webp 960w, assets/story-arrive.webp 1672w" sizes="calc(100vw - 40px)" alt="An illustrated person entering a calm, plant-filled threshold" width="1672" height="941" loading="eager" decoding="async"></figure>
          <div><span>Before reaching out</span><h3>It has been building.</h3><p>The worry follows you into bed. Your patience is thinner. Small decisions take more energy than they should. You keep waiting for life to calm down first.</p></div>
        </article>
        <article class="story-mobile-moment is-after" data-mobile-story-card>
          <figure><img src="assets/story-notice-sm.webp" srcset="assets/story-notice-sm.webp 960w, assets/story-notice.webp 1672w" sizes="calc(100vw - 40px)" alt="An illustrated person pausing beside still water and leaves" width="1672" height="941" loading="lazy" decoding="async"></figure>
          <div><span>The decision</span><h3>You stop trying to explain it perfectly.</h3><p>You tell Doppler what has been difficult, what kind of conversation may feel useful, and whether care from home or in person fits your life better.</p></div>
        </article>
        <article class="story-mobile-moment is-after" data-mobile-story-card>
          <figure><img src="assets/story-understand-sm.webp" srcset="assets/story-understand-sm.webp 960w, assets/story-understand.webp 1672w" sizes="calc(100vw - 40px)" alt="An illustrated therapist and client talking in a warm botanical room" width="1672" height="941" loading="lazy" decoding="async"></figure>
          <div><span>The introduction</span><h3>The match begins with more context.</h3><p>Your needs and preferences help shape the starting point, together with practical considerations such as location, eligibility, and availability.</p></div>
        </article>
        <article class="story-mobile-moment is-after" data-mobile-story-card>
          <figure><img src="assets/story-carry-sm.webp" srcset="assets/story-carry-sm.webp 960w, assets/story-carry.webp 1672w" sizes="calc(100vw - 40px)" alt="An illustrated person walking through a botanical courtyard into morning light" width="1672" height="941" loading="lazy" decoding="async"></figure>
          <div><span>Beyond the session</span><h3>Then the work meets you in real life.</h3><p>A difficult moment still comes. But you may recognize the pattern sooner, create a pause before the familiar reaction, and bring another choice into the moment.</p><a class="text-link" href="pages/mindfulness/">See mindfulness in care ${arrow}</a></div>
        </article>
        <div class="story-mobile-meter" aria-hidden="true"><span><i></i></span><b data-mobile-story-count>01 / 04</b></div>
      </div>
    </div>
  </section>

  <section class="section cinema-section">
    <div class="section-label" data-reveal><span>Care without rearranging your life</span></div>
    <div class="cinema-heading" data-reveal="line"><h2>One relationship. <em>Two ways to meet.</em></h2><p>Choose the setting that makes it easier to keep showing up.</p></div>
    <div class="care-experience" data-care-experience data-care-mode="home" data-reveal>
      <div class="care-console">
        <span class="care-kicker">Care setting</span>
        <h3>Where would conversation feel most possible?</h3>
        <div class="care-segment" role="tablist" aria-label="Choose a therapy setting"><button type="button" role="tab" id="care-tab-home" aria-selected="true" aria-controls="care-panel-home" data-care-choice="home">At home</button><button type="button" role="tab" id="care-tab-person" aria-selected="false" aria-controls="care-panel-person" data-care-choice="person" tabindex="-1">In person</button></div>
        <div class="care-panels">
          <article class="is-active" id="care-panel-home" role="tabpanel" aria-labelledby="care-tab-home" data-care-panel="home"><span>At home</span><h4>Your own room. Time set aside for you.</h4><p>Meet by secure video without adding a commute or another transition to the day.</p><a class="text-link text-link-light" href="pages/at-home-therapy/">Explore at-home therapy ${arrow}</a></article>
          <article id="care-panel-person" role="tabpanel" aria-labelledby="care-tab-person" data-care-panel="person" aria-hidden="true" inert><span>In person</span><h4>A dedicated space outside the day.</h4><p>Meet face to face in a calm setting designed for private conversation.</p><a class="text-link text-link-light" href="${links.quiz}">Ask about availability ${arrow}</a></article>
        </div>
      </div>
      <div class="care-visual">
        <picture class="care-scene care-scene-home is-active" data-care-scene="home" aria-hidden="false"><source media="(max-width: 820px)" srcset="assets/scene-virtual-sm.webp 960w, assets/scene-virtual.webp 1672w" sizes="calc(100vw - 40px)"><img src="assets/scene-virtual.webp" alt="An illustrated man meeting with a woman therapist by video from a warm room at home" width="1672" height="941" loading="lazy" decoding="async"></picture>
        <picture class="care-scene care-scene-person" data-care-scene="person" aria-hidden="true"><source media="(max-width: 820px)" srcset="assets/scene-in-person-sm.webp 960w, assets/scene-in-person.webp 1672w" sizes="calc(100vw - 40px)"><img src="assets/scene-in-person.webp" alt="An illustrated woman therapist and adult man talking in a warm, plant-filled counseling room" width="1672" height="941" loading="lazy" decoding="async"></picture>
      </div>
    </div>
  </section>

  <div class="mindfulness-continuum">
  <section class="home-stillness" data-stillness-story aria-labelledby="home-stillness-title">
    <div class="home-stillness-stage">
      <picture aria-hidden="true"><source media="(max-width: 820px)" srcset="assets/scene-notice-sm.webp 960w, assets/scene-notice.webp 1920w" sizes="100vw"><img src="assets/scene-notice.webp" alt="" width="1920" height="791" loading="lazy" decoding="async"></picture>
      <div class="home-stillness-wash" aria-hidden="true"></div>
      <div class="home-stillness-ambient" aria-hidden="true"><span>A little more room to choose</span><i></i></div>
      <div class="home-stillness-panel" aria-hidden="true"></div>
      <div class="home-stillness-copy">
        <span class="kicker">Where therapy meets the moment</span>
        <h2 id="home-stillness-title">Therapy can help you understand the pattern. <em>Mindfulness can help you notice it while it is happening.</em></h2>
        <p>Mindfulness is not about emptying your mind or remaining calm all the time. It is the practice of noticing thoughts, emotions, and body signals with less automatic judgment.</p>
      </div>
    </div>
  </section>

  ${mindfulnessStudio({ compact: true })}
  </div>

  <section class="section coverage-section coverage-section-clean">
    <div class="coverage-copy" data-reveal><span class="kicker">Know what happens before you commit</span><h2>Care should feel clear before the first conversation.</h2><p>The process should answer practical questions—not create more of them.</p><a class="button button-ink" href="pages/we-accept-insurance/">Review coverage questions ${arrow}</a></div>
    <div class="coverage-questions care-clarity-list" data-reveal data-reveal-delay="1"><span class="kicker">What you can ask about</span><article><b>Matching context</b><p>Your needs and preferences help shape the starting point.</p></article><article><b>Format and availability</b><p>At-home and in-person options depend on location and clinician availability.</p></article><article><b>Virtual-care privacy</b><p>Ask how the platform, privacy practices, and backup plan work before you connect.</p></article><article><b>Coverage and cost</b><p>Confirm network status, deductible, copay, and telehealth coverage before care.</p></article></div>
  </section>

  <section class="section journal-preview">
    <div class="section-label" data-reveal><span>Support between appointments</span></div>
    <div class="split-heading" data-reveal="line"><h2>Useful guidance for the moments that <em>do not wait for a session.</em></h2><a class="text-link" href="blogs/news/">Read all eight guides ${arrow}</a></div>
    <div class="home-articles home-articles-three"><a class="article-card" href="blogs/news/a-90-second-pause-for-worry/" data-reveal><img src="assets/scene-notice.webp" srcset="assets/scene-notice-sm.webp 960w, assets/scene-notice.webp 1920w" sizes="(max-width: 900px) 100vw, 34vw" alt="Illustrated still water and leaves" width="1920" height="791" loading="lazy" decoding="async"><span>Anxiety / 7 min</span><h3>A 90-second pause when worry takes over</h3></a><a class="article-card" href="blogs/news/when-breath-focus-feels-worse/" data-reveal data-reveal-delay="1"><img src="assets/scene-arrive.webp" srcset="assets/scene-arrive-sm.webp 960w, assets/scene-arrive.webp 1920w" sizes="(max-width: 900px) 100vw, 34vw" alt="Illustrated calm botanical threshold" width="1920" height="722" loading="lazy" decoding="async"><span>Grounding / 8 min</span><h3>When focusing on your breath feels worse</h3></a><a class="article-card" href="blogs/news/five-senses-grounding-when-thoughts-race/" data-reveal data-reveal-delay="2"><img src="assets/scene-carry.webp" srcset="assets/scene-carry-sm.webp 960w, assets/scene-carry.webp 1920w" sizes="(max-width: 900px) 100vw, 34vw" alt="Illustrated botanical courtyard in morning light" width="1920" height="722" loading="lazy" decoding="async"><span>Grounding / 7 min</span><h3>Five-senses grounding when thoughts race</h3></a></div>
  </section>

  <section class="section intake-handoff" data-intake-handoff>
    <div class="intake-handoff-ambient" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="intake-handoff-default" data-handoff-default data-reveal="line"><span class="kicker">Ready when you are</span><h2>Let’s find someone you can <em>actually talk to.</em></h2><p>Start with a few questions about what has been difficult, how you prefer to work, and where care fits best.</p><a class="button button-ink" href="${links.quiz}">Start the matching questionnaire ${arrow}</a></div>
    <div class="intake-handoff-personalized" data-handoff-personalized hidden inert>
      <div data-reveal="line"><span class="kicker">Your starting point</span><h2>Continue with what you already <em>shared.</em></h2><p>Your quick preview stays on this device until you continue. The full questionnaire is where you can share details with Doppler.</p></div>
      <div class="handoff-summary" aria-label="Your quick-start selections" aria-live="polite"><div><span>What may help</span><b data-handoff-need></b></div><div><span>Where to meet</span><b data-handoff-format></b></div><div><span>How support feels</span><b data-handoff-style></b></div></div>
      <div class="handoff-actions"><a class="button button-ink" href="${links.quiz}">Continue my questionnaire ${arrow}</a><button type="button" class="quiet-button" data-handoff-reset>Change my answers</button></div>
    </div>
  </section>`;

const approachBody = `
  ${pageHero({ eyebrow: 'Our approach', title: 'A thoughtful match gives therapy a more <em>personal start.</em>', lede: 'Doppler uses the background and preferences you share to begin a more thoughtful introduction.', image: '../../assets/illustration-pathways.webp', alt: 'Editorial illustration of personal paths connecting people with care', tone: 'iris' })}
  <section class="section"><div class="section-label" data-reveal><span>More than one checkbox</span></div><div class="statement" data-reveal><h2>The question is not only “what is wrong?” It is also “what kind of relationship will help?”</h2><p>A therapist’s communication style, experience, availability, format, and the way you feel together can all shape the work.</p></div>
    <div class="spectrum" data-spectrum data-reveal><div class="spectrum-copy"><span class="kicker">Explore a care preference</span><h3 data-spectrum-title>Practical and warm</h3><p data-spectrum-copy>You may value clear tools and next steps, delivered with empathy and room to be human.</p></div><div class="spectrum-controls"><label for="support-style">From reflective to structured</label><input id="support-style" type="range" min="0" max="100" value="55" data-spectrum-input><div><span>Reflective</span><span>Balanced</span><span>Structured</span></div><p>This is a product preview, not a clinical recommendation.</p></div></div>
  </section>
  <section class="section section-ink"><div class="section-label" data-reveal><span>How matching works</span></div><div class="method-grid"><article data-reveal><span>Share</span><h3>We begin with context.</h3><p>The information you choose to share creates a clearer starting point.</p></article><article data-reveal data-reveal-delay="1"><span>Align</span><h3>We look for fit.</h3><p>Doppler considers the kind of support and therapist experience that may fit.</p></article><article data-reveal data-reveal-delay="2"><span>Meet</span><h3>You assess the relationship.</h3><p>The first consultation gives you and the therapist space to decide whether the fit feels right.</p></article></div></section>
  <section class="immersive-media immersive-media-understand"><picture aria-hidden="true"><source media="(max-width: 820px)" srcset="../../assets/scene-understand-sm.webp 960w, ../../assets/scene-understand.webp 1672w" sizes="100vw"><img src="../../assets/scene-understand.webp" alt="" width="1672" height="941" loading="lazy" decoding="async"></picture><div class="immersive-media-wash"></div><div data-reveal><span class="kicker">Human-centered care</span><h2>You remain part of every decision.</h2><p>Care is collaborative. You can ask questions, name what is or is not working, and talk openly about pace, goals, and approach.</p><a class="button button-sand" href="${links.quiz}">Take the quiz ${arrow}</a></div></section>
  <section class="section section-soft"><div class="section-label" data-reveal><span>Mindful when useful</span></div><div class="statement" data-reveal><h2>Grounding, reflection, and breathing can be tools—not rules.</h2><p>When it fits your goals, a therapist may bring mindful practices into your work. The approach should be adapted to you.</p></div></section>`;

const mindfulnessBody = `
  ${pageHero({ eyebrow: 'Mindfulness at Doppler', title: 'Be with the moment—without being <em>ruled by it.</em>', lede: 'Mindfulness can make a little room between what you feel and what you do next. At Doppler, it may become part of therapy when it fits your needs, comfort, and goals.', image: '../../assets/scene-hero.webp', alt: 'A sunlit meditation garden with water, curved architecture, and lush plants', tone: 'iris', ctaHref: '../mindfulness-tools/', ctaLabel: 'Explore the tools room' })}
  <section class="section"><div class="section-label" data-reveal><span>What mindfulness means here</span></div><div class="statement" data-reveal><h2>Your mind does not have to go blank.</h2><p>Mindfulness is the practice of noticing the present moment with less judgment. That may mean observing a thought, feeling your feet on the floor, following a comfortable breath, or pausing before a familiar reaction.</p></div><div class="values-grid mindful-values"><article data-reveal><span>Notice</span><h3>Name what is here.</h3><p>Bring attention to thoughts, emotions, and body signals without deciding they are good or bad.</p></article><article data-reveal data-reveal-delay="1"><span>Understand</span><h3>Explore the pattern.</h3><p>Work with your therapist to understand what tends to trigger, protect, or overwhelm you.</p></article><article data-reveal data-reveal-delay="2"><span>Practice</span><h3>Try what feels useful.</h3><p>Breathing, grounding, meditation, or reflection may become part of care when clinically appropriate.</p></article><article data-reveal><span>Choose</span><h3>Respond with more room.</h3><p>The aim is not constant calm. It is a little more awareness and choice in the moments that matter.</p></article></div></section>
  <section class="section section-ink mindful-evidence"><div class="section-label" data-reveal><span>Support, not a promise</span></div><div class="statement" data-reveal><h2>Mindfulness can support therapy. It does not replace it.</h2><p>Research suggests mindfulness-based approaches may help some people manage stress, anxiety, or depressive symptoms, but results vary. Your clinician can help decide whether a practice fits your care. <a href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety">Read the NIH overview.</a></p></div></section>
  <section class="immersive-media immersive-media-notice"><picture aria-hidden="true"><source media="(max-width: 820px)" srcset="../../assets/scene-notice-sm.webp 960w, ../../assets/scene-notice.webp 1920w" sizes="100vw"><img src="../../assets/scene-notice.webp" alt="" width="1920" height="791" loading="lazy" decoding="async"></picture><div class="immersive-media-wash"></div><div data-reveal><span class="kicker">A practice shaped around you</span><h2>Calm is not the price of admission.</h2><p>You can come anxious, distracted, low, uncertain, or tired. The work begins with what is true—not with how centered you can appear.</p><a class="button button-sand" href="../mindfulness-tools/">Open the tools room ${arrow}</a></div></section>
  <section class="section action-band"><div data-reveal><span class="kicker">Ready to talk?</span><h2>Bring the full, unfinished version of you.</h2></div><a class="button button-iris" href="${links.quiz}">Start your match ${arrow}</a></section>`;

const atHomeBody = `
  ${pageHero({ eyebrow: 'At-home therapy', title: 'A real session, from a place that already feels <em>like yours.</em>', lede: 'Meet with a psychologist or licensed therapist by video when available. No commute, less friction, and space to arrive exactly as your day has left you.', image: '../../assets/scene-virtual.webp', alt: 'An illustrated man joining a private video therapy session from a warm room at home', tone: 'ink', ctaLabel: 'Start your match' })}
  <section class="section"><div class="section-label" data-reveal><span>Care that fits into life</span></div><div class="split-heading" data-reveal="line"><h2>Your room. Your rhythm. <em>Your time.</em></h2><p>At-home therapy can make it easier to protect time for care, especially when travel, work, caregiving, health, or a full schedule would otherwise get in the way.</p></div><div class="method-grid method-grid-four home-care-grid"><article data-reveal><span>Arrive</span><h3>Begin without the commute.</h3><p>Move from your day into a focused conversation without adding travel time.</p></article><article data-reveal data-reveal-delay="1"><span>Settle</span><h3>Choose a private space.</h3><p>Close a door, use headphones if helpful, and settle somewhere you can speak comfortably.</p></article><article data-reveal data-reveal-delay="2"><span>Connect</span><h3>Keep the relationship human.</h3><p>Eye contact, quiet, questions, and careful listening still belong in the room—even when the room is digital.</p></article><article data-reveal><span>Practice</span><h3>Use what surrounds you.</h3><p>Grounding and mindfulness tools can connect directly to the space and routines around you.</p></article></div></section>
  <section class="section telehealth-trust"><div class="telehealth-lock" data-reveal aria-hidden="true"><i></i><i></i><i></i><div><span>Privacy practices</span><b>Ask before you connect</b></div></div><div data-reveal data-reveal-delay="1"><span class="kicker">Privacy deserves plain language</span><h2>Understand privacy before you connect.</h2><p>Before your first virtual visit, ask which telehealth platform is used, how privacy is handled, and what limits apply. Care-related information belongs in designated intake and visit workflows, not ordinary email.</p><ul><li><b>Ask how the visit link works</b><span>Know which platform you will use and how to enter your session.</span></li><li><b>Use a personal device and private network</b><span>Avoid public Wi-Fi when possible and keep your device up to date.</span></li><li><b>Choose a space you can control</b><span>Headphones and a closed door can help when privacy at home is limited.</span></li></ul><a class="text-link" href="https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/telehealth-privacy-security/index.html">Read federal telehealth privacy tips ${arrow}</a></div></section>
  <section class="section section-soft"><div class="section-label" data-reveal><span>Where care can happen</span></div><div class="statement" data-reveal><h2>Available where your clinician is licensed to see you.</h2><p>Telehealth availability depends on your age, location, needs, insurance, clinician licensure, and current availability. Doppler can help you understand which options may apply.</p></div></section>
  <section class="section action-band"><div data-reveal><span class="kicker">Start from home</span><h2>Tell us what kind of support would feel useful.</h2></div><a class="button button-iris" href="${links.quiz}">Take the quiz ${arrow}</a></section>`;

const missionBody = `
  ${pageHero({ eyebrow: 'Our mission', title: 'Care for the <em>whole person.</em>', lede: 'Doppler exists to make it easier to begin care that respects your story, your nervous system, your relationships, and the life you are living now.', image: '../../assets/scene-carry.webp', alt: 'An illustrated person moving through a lush courtyard into morning light', tone: 'clay' })}
  <section class="section manifesto"><div class="section-label" data-reveal><span>Why Doppler exists</span></div><div class="statement" data-reveal><h2>People are complicated. Care can still be <em>clear.</em></h2><p>Traditional therapy does not always meet the nuanced needs of every person. Doppler focuses on understanding, connection, access, and a therapeutic relationship built to support meaningful work.</p></div></section>
  <section class="section section-soft"><div class="values-grid"><article data-reveal><span>Understanding</span><h3>See the story, not just the symptom.</h3><p>Goals, strengths, challenges, identity, and lived experience all matter.</p></article><article data-reveal data-reveal-delay="1"><span>Connection</span><h3>Make the relationship part of the care.</h3><p>A thoughtful match can help a person feel more seen, heard, and supported.</p></article><article data-reveal data-reveal-delay="2"><span>Access</span><h3>Offer care that can fit real life.</h3><p>Virtual and in-person options can make consistency more possible.</p></article><article data-reveal><span>Growth</span><h3>Build insight and skills for daily life.</h3><p>The aim is useful reflection, practical tools, and more choice in the moments that matter.</p></article></div></section>
  <section class="section media-split media-split-reverse"><figure data-reveal><img src="../../assets/illustration-constellation.webp" srcset="../../assets/illustration-constellation-sm.webp 640w, ../../assets/illustration-constellation.webp 1254w" sizes="(max-width: 900px) 100vw, 48vw" alt="Editorial illustration of people connected through a private constellation of care" width="1254" height="1254" loading="lazy" decoding="async"></figure><div data-reveal data-reveal-delay="1"><span class="kicker">For every stage of life</span><h2>Care should recognize where you are now.</h2><p>Doppler supports people across many life stages, including those navigating grief, caregiving, ongoing stress, chronic illness, cognitive change, identity, and major transitions.</p><a class="text-link" href="../why-doppler-therapy/">Explore the approach ${arrow}</a></div></section>`;

const insuranceBody = `
  ${pageHero({ eyebrow: 'Insurance', title: 'Coverage should be a question you can ask <em>clearly.</em>', lede: 'Doppler may work with Medicare and some commercial PPO plans. Participation and your specific benefits must still be confirmed.', image: '../../assets/illustration-insurance.webp', alt: 'Editorial illustration of a person moving through clear, welcoming care pathways', tone: 'mint' })}
  <section class="section"><div class="section-label" data-reveal><span>Prepare your question</span></div><div class="coverage-tool coverage-tool-static" data-reveal><div><span class="kicker">Coverage preparation</span><h2>Bring the basics. Keep private details private.</h2><p>Doppler or your insurer may ask for a few details when checking benefits. You do not need to enter any of them on this page.</p></div><div class="coverage-facts"><article><span>Plan</span><b>Your insurance plan name</b><p>Use the exact name printed on your card.</p></article><article><span>Member details</span><b>Your card, kept with you</b><p>Share identifying information only through the contact path the team designates.</p></article><article><span>Preference</span><b>At home or in person</b><p>Ask whether format changes your benefits or available clinicians.</p></article></div></div></section>
  <section class="section section-ink"><div class="section-label" data-reveal><span>Questions worth asking</span></div><div class="method-grid method-grid-four"><article data-reveal><span>Network</span><h3>Is the therapist in network?</h3><p>Network participation can differ by provider and plan.</p></article><article data-reveal data-reveal-delay="1"><span>Deductible</span><h3>Do I have a deductible?</h3><p>Ask how much has been met and what applies to outpatient therapy.</p></article><article data-reveal data-reveal-delay="2"><span>Cost</span><h3>What is my copay?</h3><p>Confirm the amount for each visit and whether telehealth differs.</p></article><article data-reveal><span>Approval</span><h3>Is authorization required?</h3><p>Some plans ask for approval before or during care.</p></article></div></section>
  <section class="section action-band"><div data-reveal><span class="kicker">Ready to check?</span><h2>Bring your plan name. We’ll help you choose the right contact path.</h2><p class="action-note">Do not send member IDs, diagnoses, or treatment details through ordinary email.</p></div><a class="button button-iris" href="../contact/">Choose a contact path ${arrow}</a></section>`;

const careersBody = `
  ${pageHero({ eyebrow: 'For clinicians', title: 'More room for the work <em>that matters.</em>', lede: 'Join a collaborative network built around thoughtful matching, flexible at-home care, and mindfulness-informed support tailored to each client.', image: '../../assets/scene-in-person.webp', alt: 'An illustrated woman therapist and adult man in a warm, plant-filled counseling room', tone: 'iris', ctaHref: links.careers, ctaLabel: 'Apply to join' })}
  <section class="section"><div class="section-label" data-reveal><span>The clinician experience</span></div><div class="split-heading" data-reveal><h2>More presence. <em>Less friction.</em></h2><p>Thoughtful referrals, flexible care formats, and administrative support leave more attention for the therapeutic relationship.</p></div><div class="benefit-grid"><article data-reveal><span>Referrals</span><h3>Thoughtfully matched referrals</h3><p>Connect with clients whose needs may align with your expertise.</p></article><article data-reveal data-reveal-delay="1"><span>Flexibility</span><h3>Flexible care formats</h3><p>Depending on role and location, care may be virtual, in person, or a mix.</p></article><article data-reveal data-reveal-delay="2"><span>Support</span><h3>Administrative support</h3><p>Spend more attention on care and less on operational friction.</p></article><article data-reveal><span>Community</span><h3>Collaborative environment</h3><p>Share perspective and learn alongside a broader clinical team.</p></article><article data-reveal data-reveal-delay="1"><span>Autonomy</span><h3>Professional autonomy</h3><p>Build a practice rhythm aligned with your strengths and availability.</p></article><article data-reveal data-reveal-delay="2"><span>Learning</span><h3>Continued learning</h3><p>Ask the team about current education and professional-development support.</p></article></div></section>
  <section class="section section-soft"><div class="career-path" data-reveal><div><span class="kicker">Start with context</span><h2>A clearer first conversation.</h2><p>Matching gives you useful context before you meet, while clinical judgment stays where it belongs—with you.</p></div><img src="../../assets/illustration-clinicians.webp" srcset="../../assets/illustration-clinicians-sm.webp 800w, ../../assets/illustration-clinicians.webp 1448w" sizes="(max-width: 900px) 100vw, 56vw" alt="Editorial illustration of connected clinician workspaces and thoughtful care" width="1448" height="1086" loading="lazy" decoding="async"></div></section>
  <section class="section action-band"><div data-reveal><span class="kicker">Interested in joining?</span><h2>Bring your practice to Doppler.</h2><p>Tell us about your license, experience, and availability.</p></div><a class="button button-iris" href="${links.careers}">Apply to join ${arrow}</a></section>`;

const contactBody = `
  ${pageHero({ eyebrow: 'Contact', title: 'Choose the path that gets you to the <em>right place.</em>', lede: 'For general questions, email the Doppler team. For care-related information, use the patient intake form instead of ordinary email.', image: '../../assets/illustration-contact.webp', alt: 'Editorial illustration of four welcoming pathways representing ways to connect', tone: 'mint' })}
  <section class="section"><div class="section-label" data-reveal><span>How can we help?</span></div><div class="route-grid"><a href="${links.quiz}" data-reveal><span>New to Doppler</span><h2>Help me find a therapist.</h2><p>Answer a few questions about the kind of care that may fit.</p><b>Take the quiz ${arrow}</b></a><a href="${links.intake}" data-reveal data-reveal-delay="1"><span>Ready for intake</span><h2>Share care information through the patient form.</h2><p>Open Doppler’s intake form on Jotform for care-related details.</p><b>Open patient intake ${arrow}</b></a><a href="mailto:team@dopplerwellness.com" data-reveal><span>General question</span><h2>Contact the Doppler team.</h2><p>Do not include diagnoses, treatment details, or other sensitive health information.</p><b>Start an email ${arrow}</b></a><a href="${links.careers}" data-reveal data-reveal-delay="1"><span>Clinician</span><h2>Explore working with Doppler.</h2><p>Share your professional background through the clinician application on Jotform.</p><b>Open clinician application ${arrow}</b></a></div></section>
  <section class="section section-ink contact-direct"><div data-reveal><span class="kicker kicker-light">General support</span><h2>team@dopplerwellness.com</h2><p>For urgent emotional support in the U.S., call or text 988. In immediate danger, use local emergency services; in the U.S., call 911.</p></div><a class="button button-sand" href="mailto:team@dopplerwellness.com">Email Doppler ${arrow}</a></section>`;

const faqs = [
  ['Getting started', 'What does Doppler Wellness offer?', 'Doppler connects people with psychologists and licensed therapists for personalized mental wellness care. Depending on provider and location availability, care may be virtual or in person.'],
  ['Getting started', 'Who is eligible for care?', 'Age eligibility, service area, and available care formats can vary. Doppler must confirm that a clinician is available and licensed to provide care where you are located.'],
  ['Matching', 'How does therapist matching work?', 'You share background and preferences that can help Doppler begin matching. The first consultation also gives you and the therapist a chance to assess the fit.'],
  ['Care formats', 'Can I meet virtually or in person?', 'Doppler offers telehealth and in-person options. Eligibility and availability depend on age, location, therapist match, and a clinician licensed to provide care where you are.'],
  ['Insurance', 'Does Doppler accept insurance?', 'Doppler may work with Medicare and some commercial PPO plans. Participation, benefits, network status, copays, and deductibles vary, so your specific plan and provider must be checked.'],
  ['Care', 'What can I get support with?', 'People reach out for anxiety, depression, stress, trauma, grief, relationships, substance use, sleep challenges, chronic illness, caregiving, cognitive change, life transitions, and many other reasons.'],
  ['Mindfulness', 'Is mindfulness part of every session?', 'Not necessarily. A therapist may use grounding, breathing, reflection, or meditation when it fits your goals and feels useful. Mindfulness should be adapted to the person, not forced.'],
  ['Privacy', 'How is privacy handled in at-home therapy?', 'Before virtual care begins, ask which telehealth platform is used, how privacy is handled, and what limits apply. A private room, personal device, headphones, and a trusted network can also help protect privacy at home.'],
  ['Getting started', 'What happens in the first consultation?', 'The first conversation is a chance to discuss what brings you in, what you hope will change, and whether the therapist feels like a good fit. Your therapist can also explain how they work and recommend a next step.'],
  ['Privacy', 'Is the fit preview a clinical assessment?', 'No. The interactive preview only demonstrates the kinds of preferences a thoughtful match might consider. Use Doppler’s actual questionnaire to continue, and never use the preview for urgent or clinical decisions.'],
  ['Urgent help', 'What should I do in a crisis?', 'Doppler is not an emergency service. In the U.S., call or text 988 for crisis support, or text HOME to 741741 to reach Crisis Text Line. In immediate danger, call 911.'],
  ['Clinicians', 'How do I apply as a clinician?', 'Visit the careers page to learn about the clinician experience, then use the clinician application. Opportunities and eligibility may vary by location and licensure.']
];

const faqBody = `
  <section class="faq-hero"><div data-reveal><span class="kicker">Questions, answered</span><h1>What would you like to <em>know first?</em></h1><p>Search by topic or browse the complete list. Urgent-support information is always visible below.</p><label class="faq-search"><span class="sr-only">Search frequently asked questions</span><input type="search" placeholder="Search matching, mindfulness, privacy…" data-faq-search><i aria-hidden="true"></i></label></div><img src="../../assets/illustration-constellation.webp" srcset="../../assets/illustration-constellation-sm.webp 640w, ../../assets/illustration-constellation.webp 1254w" sizes="(max-width: 620px) calc(100vw - 32px), (max-width: 1160px) calc(100vw - 40px), 48vw" alt="Editorial illustration of a constellation of care and connection" width="1254" height="1254" fetchpriority="high" decoding="async"></section>
  <section class="section faq-layout"><aside><span class="kicker">Browse answers</span><div class="faq-filters" data-faq-filters><button type="button" aria-pressed="true" data-faq-filter="all">All</button>${[...new Set(faqs.map(([cat]) => cat))].map(cat => `<button type="button" aria-pressed="false" data-faq-filter="${cat}">${cat}</button>`).join('')}</div><div class="urgent-card"><b>Need immediate help?</b><p>In the U.S., call or text 988, or text HOME to 741741. In immediate danger, call 911.</p></div></aside><div class="faq-list" data-faq-list>${faqs.map(([cat, q, a], i) => `<article class="faq-item" data-faq-item data-category="${cat}" data-reveal><h2><button type="button" id="faq-q-${i}" aria-expanded="true" aria-controls="faq-a-${i}"><span><small>${cat}</small>${q}</span><i aria-hidden="true"></i></button></h2><div id="faq-a-${i}" data-faq-panel role="region" aria-labelledby="faq-q-${i}"><p>${a}</p></div></article>`).join('')}<p class="faq-empty" data-faq-empty role="status" aria-live="polite" aria-atomic="true" hidden>No answers match that search. Try a broader word or contact the Doppler team.</p></div></section>`;

const patientIntakeBody = `
  ${pageHero({ eyebrow: 'Patient intake', title: 'Share care details in the <em>right place.</em>', lede: 'Doppler’s patient intake form on Jotform is the next step when you are ready to share personal and care-related information.', image: '../../assets/scene-arrive.webp', alt: 'An illustrated person entering a warm, plant-filled space', tone: 'ink', ctaHref: links.intake, ctaLabel: 'Open patient intake' })}
  <section class="section"><div class="section-label" data-reveal><span>Before you begin</span></div><div class="method-grid"><article data-reveal><span>Privacy</span><h3>Choose a private moment.</h3><p>The external form may request personal or care-related information. Review each prompt before continuing.</p></article><article data-reveal data-reveal-delay="1"><span>Guidance</span><h3>Follow the form’s guidance.</h3><p>Only share information requested in Doppler’s Jotform workflow.</p></article><article data-reveal data-reveal-delay="2"><span>Security</span><h3>Keep care details out of email.</h3><p>Use the intake workflow rather than ordinary email for personal health information.</p></article></div></section>
  <section class="section action-band"><div data-reveal><span class="kicker">Ready to continue?</span><h2>The patient intake opens on Jotform.</h2></div><a class="button button-iris" href="${links.intake}">Open patient intake ${arrow}</a></section>`;

const employeeApplicationBody = `
  ${pageHero({ eyebrow: 'Clinician application', title: 'Bring your practice to a more <em>thoughtful network.</em>', lede: 'Continue to Doppler’s clinician application on Jotform when you are ready to share your professional background.', image: '../../assets/illustration-clinicians.webp', alt: 'Editorial illustration of connected clinician workspaces and thoughtful care', tone: 'iris', ctaHref: links.careers, ctaLabel: 'Open clinician application' })}
  <section class="section"><div class="section-label" data-reveal><span>What to expect</span></div><div class="statement" data-reveal><h2>A professional application, with space for the context that matters.</h2><p>The external form contains the current application prompts. Review every section and the form’s notices before submitting.</p></div></section>
  <section class="section section-soft"><div class="action-band"><div data-reveal><span class="kicker">Learn before applying</span><h2>Explore the clinician experience, then decide if Doppler feels aligned.</h2></div><a class="button button-ink" href="../careers/">Visit careers ${arrow}</a></div></section>`;

const quizSuccessBody = `
  <section class="not-found success-page"><span class="kicker kicker-light">After the quiz</span><h1>If you just completed the quiz, here is what may happen <em>next.</em></h1><p>A successful submission may be reviewed by the Doppler team as they consider a possible therapist match. Timing, eligibility, and availability can vary.</p><div><a class="button button-sand" href="../why-doppler-therapy/">See how matching works ${arrow}</a><a class="text-link" href="../contact/">Contact Doppler ${arrow}</a></div></section>
  <section class="section"><div class="section-label" data-reveal><span>What you can consider</span></div><div class="method-grid"><article data-reveal><span>Ask</span><h3>Think about your first question.</h3><p>You can ask how a therapist works, what sessions feel like, and how you will set goals together.</p></article><article data-reveal data-reveal-delay="1"><span>Check</span><h3>Check the practical fit.</h3><p>Schedule, format, location, insurance, and cost are reasonable things to clarify.</p></article><article data-reveal data-reveal-delay="2"><span>Notice</span><h3>Notice how the first meeting feels.</h3><p>You and the therapist can both use the first conversation to assess the relationship.</p></article></div></section>`;

const legacyAnswers = [
  { id: '44574', title: 'Does my insurance cover these services?', answer: 'Coverage depends on your specific plan, provider, network status, deductible, copay, and any authorization rules. Doppler may work with Medicare and some commercial PPO plans, but participation and your benefits still need to be confirmed.', label: 'Insurance', href: '../../../../pages/we-accept-insurance/' },
  { id: '44576', title: 'How do you match me with a therapist?', answer: 'The matching quiz lets you share background and preferences that can help Doppler begin matching. Your first conversation is another chance to decide whether the fit feels right.', label: 'Matching', href: links.quiz },
  { id: '44577', title: 'What can I expect in my first therapy session?', answer: 'Your therapist may ask what brings you in, what you hope will change, and what support has or has not helped before. You can ask about their approach, pace, and what working together could look like.', label: 'First visits', href: links.quiz },
  { id: '44575', title: 'Do I need a referral?', answer: 'A referral may or may not be required depending on your plan, provider, and care path. Confirm current requirements with Doppler and your insurance plan before scheduling.', label: 'Getting started', href: '../../../../pages/contact/' }
];

const helpAnswerBody = (item) => `
  ${pageHero({ eyebrow: `${item.label} / Popular question`, title: item.title, lede: item.answer, image: '../../../../assets/illustration-constellation.webp', alt: 'Editorial illustration of people connected through different paths to care', tone: 'mint', ctaHref: item.href, ctaLabel: item.label === 'Insurance' ? 'Explore insurance' : 'Continue' })}
  <section class="section"><div class="action-band"><div data-reveal><span class="kicker">More answers</span><h2>Explore matching, care formats, insurance, first visits, and privacy.</h2></div><a class="button button-ink" href="../../">Browse all questions ${arrow}</a></div></section>`;

const helpCategoryBody = `
  ${pageHero({ eyebrow: 'Help center', title: 'Popular questions, answered <em>clearly.</em>', lede: 'Start with the questions people often ask before care: insurance, matching, referrals, and the first conversation.', image: '../../../../assets/illustration-constellation.webp', alt: 'Editorial illustration of a constellation of care', tone: 'ink', metaText: 'Plain language / Useful next steps' })}
  <section class="section"><div class="route-grid">${legacyAnswers.map((item, index) => `<a href="../../article/${item.id}/" data-reveal data-reveal-delay="${index % 2}"><span>${item.label}</span><h2>${item.title}</h2><p>${item.answer}</p><b>Read answer ${arrow}</b></a>`).join('')}</div></section>`;

const previousArticles = [
  {
    slug: 'a-90-second-pause-for-worry',
    title: 'A brief pause when worry takes over', category: 'Anxiety', read: '6 min read', image: 'scene-notice.webp',
    dek: 'An eyes-open way to notice anxious thoughts, reconnect with the room, and choose one workable next step.',
    content: `<p>A busy mind can feel like a browser with too many tabs open. One thought jumps to the next: tomorrow’s responsibilities, a conversation you wish had gone differently, a problem with no clear answer. Ordering your mind to stop can make the noise feel even louder.</p><p>Mindfulness does not require an empty mind. It means noticing the present moment without immediately judging it. With worry, the goal is not to erase every thought. It is to create a little space between having a thought and being pulled along by it.</p><h2>Try: notice, orient, choose</h2><ol><li><b>Name what your mind is doing.</b> Try “planning,” “remembering,” “worrying,” or simply “thinking.”</li><li><b>Find one steady point.</b> Notice your feet against the floor, the chair beneath you, a sound in the room, or a color you can see.</li><li><b>Let breathing take care of itself.</b> There is no need to take a deep breath. If breath focus feels uncomfortable, stay with an outside anchor.</li><li><b>Sort what needs attention.</b> Ask whether there is something you can do now, something to revisit later, or something outside your control tonight.</li><li><b>Choose one visible next step.</b> Drink water, stand up, write down one question, or return to the page in front of you.</li></ol><div class="article-callout"><span>A different goal</span><h3>Success is noticing—not becoming instantly calm.</h3><p>When your mind wanders, the return is the practice. You are rejoining the part of life that is happening now.</p></div><aside class="article-inline-cta"><span>Want support with the pattern?</span><h3>You do not have to sort through it alone.</h3><a href="${links.quiz}">Tell Doppler what kind of support you want ${arrow}</a></aside><h2>Know when to stop</h2><p>Mindfulness is one option, not a replacement for care. Stop if a practice makes you feel more panicked, detached, or overwhelmed. Open your eyes, orient to the room, move your body, or contact someone you trust. If you may hurt yourself or cannot stay safe, call emergency services or, in the U.S., call or text 988.</p><h2>Sources and further reading</h2><ul class="source-list"><li><a href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety">NIH/NCCIH: Meditation and Mindfulness—Effectiveness and Safety</a></li><li><a href="https://www.nimh.nih.gov/health/topics/anxiety-disorders">NIMH: Anxiety Disorders</a></li></ul>`
  },
  {
    slug: 'start-smaller-on-low-mood-days',
    title: 'When your mood is low, start smaller than you think', category: 'Low mood', read: '6 min read', image: 'illustration-pathways.webp',
    dek: 'One manageable action for days when energy is limited and ordinary tasks feel much farther away.',
    content: `<p>Low mood can make ordinary tasks feel strangely far away. A shower becomes a project. Answering a text feels like work. Advice such as “just get moving” may land as criticism when deciding what to do already takes energy.</p><p>Starting small is not giving up. It is a way to work with the energy you actually have instead of the energy you think you should have.</p><h2>Check your capacity without grading it</h2><p>Ask, “What do I have available right now?” Use a number from zero to ten or a word such as empty, limited, steady, or restless. This is information, not a grade.</p><h2>Make the action almost too small</h2><ul><li>Open the curtains.</li><li>Drink half a glass of water.</li><li>Put clean clothes beside the shower.</li><li>Carry one dish to the sink.</li><li>Stand near an open window.</li><li>Send one person a short hello.</li></ul><p>The action does not need to be impressive. It only needs a clear beginning and end.</p><h3>Remove the hidden extras</h3><p>“Clean the kitchen” may secretly mean sorting clutter, washing everything, and putting it away. Shrink it to “clear one corner of the counter.” Change “I should exercise” to “stretch while one song plays.” The small action still counts if you stop there.</p><div class="article-callout"><span>Notice accurately</span><h3>You do not have to feel better for the action to matter.</h3><p>Perhaps nothing changed. Perhaps you feel one percent more awake—or simply glad it is finished. Record what happened without forcing a positive feeling.</p></div><aside class="article-inline-cta"><span>A workable next step</span><h3>Beginning can be something you do together.</h3><a href="${links.quiz}">Share what support might feel useful ${arrow}</a></aside><h2>Know when to ask for more support</h2><p>Small actions do not replace therapy, medication, medical evaluation, or recommended treatment. If low mood persists, becomes more intense, or makes eating, sleeping, working, studying, or caring for yourself difficult, talk with a qualified health professional. If you are thinking about suicide or may not be able to stay safe, call emergency services or, in the U.S., call or text 988.</p><h2>Sources and further reading</h2><ul class="source-list"><li><a href="https://www.nimh.nih.gov/health/topics/caring-for-your-mental-health">NIMH: Caring for Your Mental Health</a></li><li><a href="https://www.nimh.nih.gov/health/publications/depression">NIMH: Depression</a></li></ul>`
  },
  {
    slug: 'when-breath-focus-feels-worse',
    title: 'When paying attention to breathing feels worse', category: 'Grounding', read: '6 min read', image: 'illustration-constellation.webp',
    dek: 'Breath is only one anchor. Try an eyes-open, outside-in practice when internal focus does not help.',
    content: `<p>“Focus on your breathing” is common mindfulness advice. For some people it feels steadying. For others, attention on the chest, throat, or heartbeat can bring up panic, painful memories, dizziness, or a sense of being trapped.</p><p>If that happens, you are not failing at mindfulness. Breath is only one possible anchor. You can practice present-moment awareness with your eyes open and your attention directed toward the room.</p><h2>Begin with orientation</h2><p>Look around slowly. Name where you are, the day or approximate time, and one thing you plan to do next. Use words that feel true. If “I am safe” does not feel believable, choose something concrete such as “The door is closed” or “I am sitting on a blue chair.”</p><h2>Try a 3–2–1 outside anchor</h2><ol><li>Name three objects or colors you can see.</li><li>Identify two sounds outside your body.</li><li>Notice one neutral contact point, such as your shoes against the floor.</li></ol><p>You can hold an ordinary object and describe its weight, temperature, edges, and surface. Let breathing happen in the background; you do not need to deepen, slow, count, or control it.</p><h3>Movement can be mindful too</h3><p>Turn your head gently and look toward each side of the room. Stretch your hands, stand if that feels steady, or walk slowly while noticing each foot meet the floor.</p><div class="article-callout"><span>Keep choice at the center</span><h3>Try one anchor, then decide.</h3><p>Continue, change anchors, or stop. A useful practice should be adjustable; it should not feel like something being done to you.</p></div><aside class="article-inline-cta"><span>Your preferences matter</span><h3>Care can make room for what does—and does not—feel comfortable.</h3><a href="${links.quiz}">Tell Doppler what helps you feel at ease ${arrow}</a></aside><h2>A gentle boundary</h2><p>Grounding is a coping practice, not trauma treatment or emergency care. Stop if you feel more distressed, numb, confused, or disconnected. Move to a familiar place, contact someone you trust, or follow a safety plan made with your clinician.</p><h2>Sources and further reading</h2><ul class="source-list"><li><a href="https://www.ptsd.va.gov/apps/ptsdcoachonline/tools/be-in-the-moment/pages/page-2.html">VA PTSD Coach: Be in the Moment</a></li><li><a href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety">NIH/NCCIH: Mindfulness Evidence and Safety</a></li></ul>`
  },
  {
    slug: 'five-minute-mindfulness-between-sessions',
    title: 'A five-minute mindfulness practice for between sessions', category: 'Mindfulness', read: '6 min read', image: 'scene-understand.webp',
    dek: 'A flexible check-in for carrying one useful idea from therapy into the middle of ordinary life.',
    content: `<p>A therapy session can bring insight, relief, discomfort, or several feelings at once. Then daily life resumes. The notes stay in a notebook, the week fills up, and it can be hard to remember what you wanted to practice.</p><p>This five-minute check-in can help you reconnect with the work without trying to recreate the whole session. Use a timer if that helps, or move through the steps without watching the clock.</p><h2>Minute one: arrive</h2><p>Pause what you are doing. Let your eyes stay open or close them, depending on what feels comfortable. Notice where you are, your position, and one thing you can see or hear.</p><h2>Minute two: notice</h2><p>Ask, “What is here right now?” Use plain words: tired, busy, tight shoulders, worried, blank, calm, hungry. “I am not sure” is a complete answer.</p><h2>Minute three: make room</h2><p>Respond as you might to someone you care about: “This is hard right now,” “I can take one part at a time,” or “I do not have to argue with this feeling.” Choose language you can believe.</p><h2>Minute four: remember the work</h2><p>Think of one idea, question, or practice from therapy. Ask, “What would it look like to practice this once today?”</p><h2>Minute five: choose and close</h2><p>Name one concrete next action. Then look around again, move your hands or shoulders, and return to your day. You do not need to feel calm for the practice to be complete.</p><div class="article-callout"><span>Three useful lines</span><h3>I noticed… I needed… I chose…</h3><p>Write only those three lines if a record would help. Bring them to therapy when they feel relevant; skip the note if tracking becomes pressure.</p></div><aside class="article-inline-cta"><span>Build the practice with support</span><h3>Find a therapist whose pace and approach fit.</h3><a href="${links.quiz}">Begin Doppler’s matching questionnaire ${arrow}</a></aside><h2>A gentle boundary</h2><p>This check-in is not a substitute for therapy or a crisis plan. Do not practice while driving. If turning toward thoughts or sensations brings intense distress, traumatic memories, or disconnection, stop and orient to your surroundings.</p><h2>Sources and further reading</h2><ul class="source-list"><li><a href="https://mobile.va.gov/app/mindfulness-coach">VA: Mindfulness Coach</a></li><li><a href="https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety">NIH/NCCIH: Meditation and Mindfulness</a></li></ul>`
  },
  {
    slug: 'mindful-wind-down-for-sleep',
    title: 'When your mind will not clock out', category: 'Sleep', read: '7 min read', image: 'scene-hero.webp',
    dek: 'A low-pressure wind-down for nights when your mind keeps reviewing, planning, and replaying the day.',
    content: `<p>The room is quiet, but your mind is holding a meeting. It reviews an awkward moment, rewrites an email, predicts tomorrow, and circles back to the beginning. Trying to force the thoughts away may add another worry: “Why can’t I switch off?”</p><p>Mindfulness is not a sleep switch, and this practice cannot promise sleep. It offers a way to step out of problem-solving mode and create a gentler transition toward rest.</p><h2>Start before getting into bed</h2><p>Set aside five to ten minutes during your wind-down, ideally somewhere other than your bed. Dim the lights and put aside work, news, and conversations that can wait.</p><h2>Give thoughts somewhere to land</h2><p>On paper, make three short columns:</p><ul><li>What my mind is repeating</li><li>What I can do tomorrow</li><li>What cannot be solved tonight</li></ul><p>Write a phrase, not an essay. If there is a next step, note when you will take it. Then close the notebook.</p><h3>Notice the loop without entering it</h3><p>When the replay begins again, label it gently: “reviewing,” “planning,” or “the same loop.” Avoid debating the thought. Try, “My mind is bringing this back. I can return to it tomorrow.”</p><h3>Choose a neutral anchor</h3><p>Notice something low-key and present: the weight of a blanket, a steady sound, or the support of the chair. If breath feels comfortable, notice one natural exhale without changing it.</p><div class="article-callout"><span>Lower the demand</span><h3>“I am giving my body time to rest.”</h3><p>Sleep cannot be commanded. A less demanding phrase may reduce the struggle around it, even if sleep takes time.</p></div><aside class="article-inline-cta"><span>When the loop keeps returning</span><h3>Explore support that fits your needs and schedule.</h3><a href="${links.quiz}">Continue when you are ready ${arrow}</a></aside><h2>A gentle boundary</h2><p>Mindfulness and sleep habits do not replace evaluation or treatment for ongoing sleep problems. Talk with a health professional if difficulty sleeping continues, affects daytime safety, or comes with breathing problems, severe nightmares, unusual nighttime behavior, or extreme daytime sleepiness. Never drive when sleepy.</p><h2>Sources and further reading</h2><ul class="source-list"><li><a href="https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits">NHLBI: Healthy Sleep Habits</a></li><li><a href="https://www.nhlbi.nih.gov/health/insomnia/treatment">NHLBI: Insomnia Treatment</a></li></ul>`
  },
  {
    slug: 'prepare-for-virtual-therapy',
    title: 'A practical setup for more privacy and less scramble', category: 'Virtual care', read: '7 min read', image: 'scene-virtual.webp',
    dek: 'A room, device, privacy, and backup-plan checklist for entering your first virtual session with fewer loose ends.',
    content: `<p>Meeting a therapist from home can remove the commute, but it introduces different questions. Will the link work? Can anyone hear through the wall? What are you supposed to say when the session begins?</p><p>You do not need a perfect room, a polished life story, or a quiet mind. A few practical choices can make the appointment easier to enter.</p><h2>A day or two before</h2><p>Confirm the appointment time and time zone, find the message containing your link, and save the office phone number in case the connection fails. Test the camera, microphone, speaker, and platform if possible. Charge your device.</p><h2>Choose the most private space available</h2><p>Look for a place where you can speak as openly as possible. Headphones can keep others from hearing your clinician. If complete privacy is not possible, tell the clinician at the beginning so you can discuss what feels comfortable to cover.</p><p>Avoid public Wi-Fi when possible, use a password-protected device, install security updates, and turn off smart speakers or nearby devices that might overhear. Do not join while driving.</p><h2>Use a five-point setup scan</h2><ol><li><b>Space:</b> the best privacy available.</li><li><b>Device:</b> charged, updated, and unnecessary apps closed.</li><li><b>Link:</b> opened and audio tested.</li><li><b>Details:</b> your current physical location and emergency contact available.</li><li><b>Backup:</b> the provider’s phone number and a reconnection plan.</li></ol><h3>Bring one honest sentence</h3><p>Write one or two points: what has felt difficult, how it affects daily life, or what you hope could change. “I’m not sure where to start” is a valid opening.</p><div class="article-callout"><span>Leave room afterward</span><h3>Give the conversation a landing place.</h3><p>If possible, keep ten quiet minutes after the appointment. Stand, stretch, drink water, or note one thing you want to remember.</p></div><aside class="article-inline-cta"><span>Care from a space that works for you</span><h3>Tell Doppler what you are looking for.</h3><a href="${links.quiz}">Start the matching questionnaire ${arrow}</a></aside><h2>A gentle boundary</h2><p>Routine virtual appointments are not always appropriate for immediate emergencies. Ask how urgent concerns are handled and what to do if the connection drops. If you are in immediate danger or may hurt yourself or someone else, call emergency services or, in the U.S., call or text 988.</p><h2>Sources and further reading</h2><ul class="source-list"><li><a href="https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/telehealth-privacy-security/index.html">HHS: Telehealth Privacy and Security Tips for Patients</a></li><li><a href="https://telehealth.hhs.gov/patients/what-should-i-know-before-my-telehealth-visit">Telehealth.HHS.gov: Before Your Visit</a></li></ul>`
  }
];

const articleScenes = [
  'scene-notice.webp',
  'scene-carry.webp',
  'scene-arrive.webp',
  'scene-understand.webp',
  'scene-hero.webp',
  'scene-virtual.webp',
  'illustration-pathways.webp',
  'illustration-constellation.webp'
];

const articles = [...[...articlesA, ...articlesB].map((article, index) => ({
  ...article,
  read: article.read || article.readTime,
  content: article.body
    .replace('class="article-callout"', 'class="article-inline-cta"')
    .replace('class="article-cta"', 'class="article-inline-cta"')
    .replace('class="article-sources"', 'class="source-list"'),
  image: articleScenes[index]
})), ...legacyArticles];

void previousArticles;

const previousJournalBody = `
  <section class="journal-hero"><div data-reveal><span class="kicker">The Doppler journal</span><h1>Useful ideas for <em>real moments.</em></h1><p>Eight practical, carefully sourced guides for worry, low mood, grounding, mindfulness, sleep, and preparing for virtual care.</p></div><div class="journal-feature" data-reveal data-reveal-delay="1"><img src="../../assets/scene-notice.webp" srcset="../../assets/scene-notice-sm.webp 960w, ../../assets/scene-notice.webp 1920w" sizes="(max-width: 620px) calc(100vw - 32px), (max-width: 1160px) calc(100vw - 40px), 52vw" alt="An illustrated botanical pool with a quiet ripple" width="1920" height="791" fetchpriority="high" decoding="async"><span>Featured / Anxiety</span><h2>A brief pause when worry takes over</h2><a href="a-90-second-pause-for-worry/">Read the guide ${arrow}</a></div></section>
  <section class="section"><div class="journal-tools" data-reveal><div class="journal-filters" data-journal-filters><button type="button" aria-pressed="true" data-journal-filter="all">All stories</button>${[...new Set(articles.map(a => a.category))].map(cat => `<button type="button" aria-pressed="false" data-journal-filter="${cat}">${cat}</button>`).join('')}</div></div><div class="journal-grid" data-journal-grid>${articles.map((article, i) => { const [width, height] = imageSize(article.image); const smallWidth = smallImageWidth(article.image); const smallImage = article.image.replace(/\.webp$/, '-sm.webp'); return `<a class="journal-card" href="${article.slug}/" data-journal-card data-category="${article.category}" data-reveal data-reveal-delay="${i % 3}"><figure><img src="../../assets/${article.image}" srcset="../../assets/${smallImage} ${smallWidth}w, ../../assets/${article.image} ${width}w" sizes="(max-width: 900px) 100vw, 32vw" alt="" width="${width}" height="${height}" loading="lazy" decoding="async"></figure><span>${article.category} / ${article.read}</span><h2>${article.title}</h2><p>${article.dek}</p><b>Read article ${arrow}</b></a>`; }).join('')}</div></section>`;

const toolsBody = createToolsBody({ arrow, links, breathExperience, groundingExperience, soundExperience, reflectionExperience });
const journalBody = createJournalBody({ arrow, links, articles, imageSize, smallImageWidth });
void previousJournalBody;

const articleBody = (article, index) => {
  const [width, height] = imageSize(article.image);
  const sections = [];
  const content = article.content.replace(/<h2>([\s\S]*?)<\/h2>/g, (_, title) => {
    const id = `article-section-${sections.length + 1}`;
    sections.push({ id, title });
    return `<h2 id="${id}">${title}</h2>`;
  });
  const related = [1, 2, 3].map(offset => articles[(index + offset) % articles.length]);
  return `
  <article class="article-page">
    <header class="article-hero"><div><a class="back-link" href="/blogs/news/">${back} All articles</a><span class="kicker">${article.category} / ${article.read}</span><h1>${article.title}</h1><p>${article.dek}</p><div class="article-meta"><span>General education</span><span>Doppler journal</span></div></div><figure class="media-${mediaShape(width, height)}"><img src="/assets/${article.image}" srcset="/assets/${article.image.replace(/\.webp$/, '-sm.webp')} ${smallImageWidth(article.image)}w, /assets/${article.image} ${width}w" sizes="(max-width: 720px) 100vw, (max-width: 1160px) calc(100vw - 40px), 50vw" alt="" width="${width}" height="${height}" fetchpriority="high" decoding="async"></figure></header>
    <div class="reading-progress" aria-hidden="true"><span data-reading-progress></span></div>
    <div class="article-layout"><nav class="article-rail" aria-label="In this article"><span>In this article</span>${sections.map(section => `<a href="#${section.id}">${section.title}</a>`).join('')}<a class="article-rail-care" href="${links.quiz}">Find your support ${arrow}</a></nav><div class="article-prose" id="article-body">${content}<div class="article-note"><b>About this article</b><p>This article offers general education, not a diagnosis, treatment plan, or replacement for professional care. Talk with a qualified professional about your circumstances.</p></div></div></div>
    <section class="journal-related" aria-labelledby="journal-related-title"><div class="journal-related-head"><span class="kicker">Keep reading</span><h2 id="journal-related-title">A little more <em>perspective.</em></h2><a class="text-link" href="/blogs/news/">All articles ${arrow}</a></div><div class="journal-related-grid">${related.map(item => `<a href="/blogs/news/${item.slug}/"><span>${item.category} · ${item.read}</span><h3>${item.title}</h3><b>Read article ${arrow}</b></a>`).join('')}</div></section>
  </article>`;
};

const notFoundBody = `
  <section class="not-found"><span class="kicker">404 / A quiet wrong turn</span><h1>This path does not lead anywhere—<em>yet.</em></h1><p>Head home, browse the journal, or take the therapist matching quiz.</p><div><a class="button button-iris" href="/">Back home ${arrow}</a><a class="text-link" href="/blogs/news/">Read the journal ${arrow}</a></div></section>`;

const organizationSchema = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Doppler Wellness',
  url: 'https://dopplerwellness.com/',
  email: 'team@dopplerwellness.com',
  description: 'Mindfulness-informed mental wellness care with at-home and in-person therapy options. Eligibility depends on age, location, clinician licensure, and availability.'
});

const articleSchema = (article) => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: article.title,
  description: article.dek,
  datePublished: '2026-09-11',
  dateModified: '2026-09-14',
  author: { '@type': 'Organization', name: 'Doppler Wellness' },
  publisher: { '@type': 'Organization', name: 'Doppler Wellness' },
  mainEntityOfPage: `https://dopplerwellness.com/blogs/news/${article.slug}`,
  image: `https://dopplerwellness.com/assets/${article.image}`
});

const pages = [
  { path: 'index.html', html: layout({ title: 'Doppler Wellness | Therapy, With Room to Breathe', description: 'Explore mindfulness-informed therapy for anxiety, depression, stress, grief, trauma, and life transitions, with at-home and in-person options.', canonical: '/', base: '', active: 'home', body: homeBody, schema: organizationSchema }) },
  { path: 'pages/why-doppler-therapy/index.html', html: layout({ title: 'Our Approach | Doppler Wellness', description: 'Learn how Doppler Wellness approaches therapist matching, collaborative care, virtual and in-person therapy, and mindful support.', canonical: '/pages/why-doppler-therapy', base: '../../', active: 'approach', body: approachBody }) },
  { path: 'pages/mindfulness/index.html', html: layout({ title: 'Mindfulness-Informed Therapy | Doppler Wellness', description: 'Learn how awareness, grounding, breathing, and reflection may support therapy when those practices fit your needs, comfort, and goals.', canonical: '/pages/mindfulness', base: '../../', active: 'mindfulness', body: mindfulnessBody }) },
  { path: 'pages/mindfulness-tools/index.html', html: layout({ title: 'Mindfulness Tools | Doppler Wellness', description: 'Try adjustable breathing, grounding, reflection, and ambient sound exercises designed for a short, supportive pause.', canonical: '/pages/mindfulness-tools', base: '../../', active: 'tools', body: toolsBody }) },
  { path: 'pages/at-home-therapy/index.html', html: layout({ title: 'At-Home Therapy | Doppler Wellness', description: 'Explore virtual therapy from home, including what to expect, how to prepare your space, and how Doppler explains telehealth privacy.', canonical: '/pages/at-home-therapy', base: '../../', active: 'at-home', body: atHomeBody }) },
  { path: 'pages/our-mission/index.html', html: layout({ title: 'Our Mission | Doppler Wellness', description: 'Doppler Wellness is working to make mental wellness care more personalized, human-centered, accessible, and connected.', canonical: '/pages/our-mission', base: '../../', active: 'mission', body: missionBody }) },
  { path: 'pages/we-accept-insurance/index.html', html: layout({ title: 'Insurance | Doppler Wellness', description: 'Prepare to ask about insurance coverage for therapy with Doppler Wellness, including questions about networks, deductibles, copays, and authorization.', canonical: '/pages/we-accept-insurance', base: '../../', active: 'insurance', body: insuranceBody }) },
  { path: 'pages/careers/index.html', html: layout({ title: 'Careers for Therapists | Doppler Wellness', description: 'Explore clinician opportunities with Doppler Wellness, including thoughtfully matched referrals, flexible care formats, and a collaborative practice environment.', canonical: '/pages/careers', base: '../../', active: 'careers', body: careersBody, footerMode: 'clinician' }) },
  { path: 'pages/contact/index.html', html: layout({ title: 'Contact | Doppler Wellness', description: 'Contact Doppler Wellness about starting therapy, patient intake, insurance questions, or clinician opportunities.', canonical: '/pages/contact', base: '../../', active: 'contact', body: contactBody }) },
  { path: 'pages/patient-intake-form/index.html', html: layout({ title: 'Patient Intake | Doppler Wellness', description: 'Continue to Doppler Wellness patient intake when you are ready to share personal and care-related information.', canonical: '/pages/patient-intake-form', base: '../../', body: patientIntakeBody, footerMode: 'intake' }) },
  { path: 'pages/employee-application/index.html', html: layout({ title: 'Clinician Application | Doppler Wellness', description: 'Learn what to expect and continue to the Doppler Wellness clinician application.', canonical: '/pages/employee-application', base: '../../', active: 'careers', body: employeeApplicationBody, footerMode: 'clinician' }) },
  { path: 'pages/your-quiz-submission-was-successful/index.html', html: layout({ title: 'After the Quiz | Doppler Wellness', description: 'What may happen after completing the Doppler Wellness therapist matching questionnaire.', canonical: '/pages/your-quiz-submission-was-successful', base: '../../', body: quizSuccessBody, footerMode: 'complete' }) },
  { path: 'a/help/index.html', html: layout({ title: 'Frequently Asked Questions | Doppler Wellness', description: 'Clear answers about therapist matching, virtual and in-person care, insurance, first visits, and getting started with Doppler Wellness.', canonical: '/a/help', base: '../../', active: 'faq', body: faqBody }) },
  { path: 'a/help/category/24888/index.html', html: layout({ title: 'Popular Questions | Doppler Wellness', description: 'Popular questions about Doppler Wellness insurance, therapist matching, referrals, and first therapy visits.', canonical: '/a/help/category/24888', base: '../../../../', active: 'faq', body: helpCategoryBody }) },
  ...legacyAnswers.map((item) => ({ path: `a/help/article/${item.id}/index.html`, html: layout({ title: `${item.title} | Doppler Wellness`, description: item.answer, canonical: `/a/help/article/${item.id}`, base: '../../../../', active: 'faq', body: helpAnswerBody(item) }) })),
  { path: 'blogs/news/index.html', html: layout({ title: 'Mental Wellness Journal | Doppler Wellness', description: 'Explore all twelve Doppler articles about worry, low mood, relationships, mindfulness, sleep, self-compassion, and beginning therapy.', canonical: '/blogs/news', base: '../../', active: 'journal', body: journalBody }) },
  ...articles.map((article, index) => ({ path: `blogs/news/${article.slug}/index.html`, html: layout({ title: `${article.title} | Doppler Wellness`, description: article.dek, canonical: `/blogs/news/${article.slug}`, base: '../../../', active: 'journal', body: articleBody(article, index), schema: articleSchema(article), bodyClass: 'article-document' }) })),
  { path: '404.html', html: layout({ title: 'Page Not Found | Doppler Wellness', description: 'The page you requested could not be found.', canonical: '/404', base: '/', body: notFoundBody }) }
];

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'assets'), { recursive: true });
await cp(join(src, 'assets'), join(dist, 'assets'), { recursive: true });
const [baseStyles, refinementStyles, toolsJournalStyles, responsiveStyles] = await Promise.all([
  readFile(join(src, 'styles.css'), 'utf8'),
  readFile(join(src, 'refinement.css'), 'utf8'),
  readFile(join(src, 'tools-journal.css'), 'utf8'),
  readFile(join(src, 'responsive.css'), 'utf8')
]);
await writeFile(join(dist, 'styles.css'), `${baseStyles.trimEnd()}\n\n${refinementStyles.trim()}\n\n${toolsJournalStyles.trim()}\n\n${responsiveStyles.trim()}\n`);
await copyFile(join(src, 'app.js'), join(dist, 'app.js'));

for (const page of pages) {
  const output = join(dist, page.path);
  await mkdir(dirname(output), { recursive: true });
  const cleanHtml = `${page.html.replace(/[ \t]+$/gm, '').trimEnd()}\n`;
  await writeFile(output, cleanHtml);
}

const sitemapUrls = pages.filter(page => page.path !== '404.html' && page.sitemap !== false).map(page => {
  const route = page.path === 'index.html' ? '' : page.path.replace(/index\.html$/, '');
  return `  <url><loc>https://dopplerwellness.com/${route}</loc></url>`;
}).join('\n');

await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`);
await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://dopplerwellness.com/sitemap.xml\n');
await writeFile(join(dist, 'site.webmanifest'), JSON.stringify({ name: 'Doppler Wellness', short_name: 'Doppler', start_url: '/', display: 'standalone', background_color: '#fff3b5', theme_color: '#ffe260', icons: [{ src: 'assets/mark.svg', sizes: 'any', type: 'image/svg+xml' }] }, null, 2));

await mkdir(join(dist, '.openai'), { recursive: true });
await writeFile(join(dist, '.openai', 'hosting.json'), JSON.stringify({ project_id: 'appgprj_6aa1812705008191bc945eea804ebaf6', static: { directory: 'dist' } }, null, 2));

console.log(`Built ${pages.length} pages.`);
