import { careerPage } from './premium-pages.mjs';

const application = '/pages/employee-application/';
const arrow = '<span aria-hidden="true">↗</span>';
const icon = (index) => {
  const drawings = [
    '<circle cx="24" cy="32" r="15"/><circle cx="40" cy="32" r="15"/><path d="m26 32 4 4 8-9"/>',
    '<path d="M13 45c0-14 38-2 38-20S13 12 13 25s38 2 38 20"/><circle cx="13" cy="45" r="3"/><circle cx="51" cy="45" r="3"/>',
    '<path d="M18 14h28v39H18zM25 24h14M25 32h14M25 40h7"/><path d="m39 42 5 5 9-11"/>',
    '<circle cx="32" cy="22" r="8"/><path d="M18 49v-5a14 14 0 0 1 28 0v5M11 19a7 7 0 1 1 0 14M7 47v-4a12 12 0 0 1 8-11M53 19a7 7 0 1 0 0 14M57 47v-4a12 12 0 0 0-8-11"/>',
    '<circle cx="32" cy="32" r="21"/><path d="M32 18v15l10 6M32 7v5M57 32h-5M32 57v-5M7 32h5"/>',
    '<path d="M32 50S11 37 11 24a11 11 0 0 1 21-5 11 11 0 0 1 21 5c0 13-21 26-21 26Z"/><path d="M22 31h6l4-8 4 16 4-8h5"/>',
    '<rect x="7" y="15" width="32" height="26" rx="5"/><path d="M17 49h13M23 41v8"/><rect x="43" y="25" width="14" height="27" rx="4"/><path d="M49 46h2"/>',
    '<path d="M9 15c8-2 16-1 23 4 7-5 15-6 23-4v34c-8-2-16-1-23 4-7-5-15-6-23-4ZM32 19v34M17 25c3 0 5 1 8 2M17 34c3 0 5 1 8 2M39 27c3-1 5-2 8-2M39 36c3-1 5-2 8-2"/>',
  ];
  return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawings[index]}</svg>`;
};

// The source career page remains the authority for every official benefit.
// Only the surrounding presentation changes; its wording is not duplicated.
function benefitCards() {
  const source = careerPage.split('<div class="dw-benefit-list">')[1]?.split('</div></section>')[0];
  const cards = source?.match(/<article>[\s\S]*?<\/article>/g);
  if (!cards || cards.length !== 8) throw new Error('Careers requires all eight official Doppler benefits.');
  return cards.map((card, index) => card
    .replace('<article>', `<article class="dw-career-benefit dw-career-benefit-${index + 1}">`)
    .replace(/(<span class="dw-step-number">\d+<\/span>)/, `<div class="dw-career-benefit-top">$1<span class="dw-career-icon">${icon(index)}</span></div>`)
  ).join('');
}

export function careersExperience() {
  return `<div class="dw-careers-experience">
    <section class="dw-career-hero" aria-labelledby="dw-career-title">
      <div class="dw-career-hero-copy">
        <span class="dw-eyebrow">Careers at Doppler Wellness</span>
        <h1 id="dw-career-title">Your work matters.<br><em>Your support<br>does, too.</em></h1>
        <p class="dw-lead">At Doppler Wellness, we are dedicated to providing high-quality mental health care, and we’re always looking for passionate therapists to join our growing team.</p>
        <a class="dw-button" href="${application}">Connect with our team ${arrow}</a>
        <a class="dw-career-explore" href="#career-benefits">A little more about life at Doppler <span aria-hidden="true">↓</span></a>
      </div>
      <figure class="dw-career-art">
        <picture class="page-hero-scene"><source media="(max-width: 820px)" srcset="/assets/illustration-clinicians-sm.webp"><img src="/assets/illustration-clinicians.webp" width="1448" height="1086" alt="An illustrated community of clinicians, connected across warm, welcoming spaces." fetchpriority="high" decoding="async"></picture>
        <figcaption class="dw-career-art-note"><span class="dw-career-note-mark" aria-hidden="true">${icon(0)}</span><span>Your expertise.<br><strong>A whole team behind it.</strong></span></figcaption>
        <span class="dw-career-art-label" aria-hidden="true">Space to do meaningful work</span>
      </figure>
    </section>

    <section class="dw-career-mission" aria-labelledby="dw-career-mission-title">
      <div class="dw-career-mission-intro"><span class="dw-eyebrow">Meaningful work, at every stage</span><h2 id="dw-career-mission-title">Bring your experience.<br><em>Make a real impact.</em></h2><span class="dw-career-connection" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></div>
      <div class="dw-career-mission-copy"><p>Our mission is to offer meaningful support to individuals navigating challenges such as grief, anxiety, depression, chronic illness, life transitions, and more.</p><p>We are looking for compassionate clinicians who are eager to make a real impact in the lives of their clients. While we serve clients of all ages, we specialize in supporting older adults, who often face unique challenges like cognitive decline, caregiving stress, depression, and grief.</p><p>However, our practice remains welcoming to clients from all walks of life, ensuring that everyone receives the care and attention they deserve.</p></div>
    </section>

    <section class="dw-career-benefits" id="career-benefits" aria-labelledby="dw-career-benefits-title">
      <div class="dw-career-benefits-heading"><div><span class="dw-eyebrow">Benefits of working with Doppler</span><h2 id="dw-career-benefits-title">More room for<br><em>the work you do best.</em></h2></div><p>A clinician-first practice with thoughtful referrals and comprehensive support.</p></div>
      <div class="dw-career-benefit-grid">${benefitCards()}</div>
    </section>

    <section class="dw-career-invitation" aria-labelledby="dw-career-invitation-title">
      <div class="dw-career-invitation-art" aria-hidden="true"><img src="/assets/career-conversation-v33.webp" srcset="/assets/career-conversation-v33-sm.webp 700w, /assets/career-conversation-v33.webp 1200w" sizes="(max-width: 820px) 86vw, 36vw" width="1200" height="1200" alt="" loading="lazy" decoding="async"></div>
      <div class="dw-career-invitation-copy"><span class="dw-eyebrow">Start with a conversation</span><h2 id="dw-career-invitation-title">Your next chapter.<br><em>Let’s imagine it together.</em></h2><p>A few basic details are enough to express your interest. Our team will follow up and send the full application.</p><a class="dw-button" href="${application}">Express your interest ${arrow}</a></div>
    </section>
  </div>`;
}
