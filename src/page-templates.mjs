export const createToolsBody = ({ arrow, links, breathExperience, groundingExperience, soundExperience, reflectionExperience }) => `
  <section class="tools-hero botanical-world botanical-world-dawn">
    <div class="botanical-sky" aria-hidden="true"><i></i><i></i><i></i></div>
    <div class="botanical-canopy botanical-canopy-left" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div class="botanical-canopy botanical-canopy-right" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
    <div class="tools-hero-copy" data-reveal="line">
      <span class="kicker">Mindfulness tools</span>
      <h1>A quiet place to <em>practice.</em></h1>
      <p>Try a short exercise for breathing, grounding, reflection, or settling with sound. Use what feels supportive. Skip what does not.</p>
      <a class="button button-ink" href="#choose-a-practice">Choose a practice ${arrow}</a>
    </div>
    <div class="tools-hero-prompt" data-reveal data-reveal-delay="1">
      <span>No streaks. No score.</span>
      <p>Just a few adjustable ways to return to the moment you are already in.</p>
    </div>
  </section>

  <section class="tools-intro" id="choose-a-practice">
    <div data-reveal="line">
      <span class="kicker">Begin where you are</span>
      <h2>What would feel most useful <em>right now?</em></h2>
    </div>
    <nav class="tools-jump" aria-label="Choose a mindfulness practice" data-reveal data-reveal-delay="1">
      <a href="#breathing"><span>Slow the pace</span><b>Breathing</b>${arrow}</a>
      <a href="#grounding"><span>Look outside the feeling</span><b>Grounding</b>${arrow}</a>
      <a href="#sound"><span>Soften the room</span><b>Sound</b>${arrow}</a>
      <a href="#reflection"><span>Name what is here</span><b>Reflection</b>${arrow}</a>
    </nav>
  </section>

  <section class="tool-landscape tool-landscape-breath" id="breathing">
    <div class="tool-landscape-art" aria-hidden="true"><div class="breathing-bloom"><i></i><i></i><i></i><i></i><span></span></div><div class="plant-line plant-line-one"></div><div class="plant-line plant-line-two"></div></div>
    <div class="tool-landscape-copy" data-reveal>
      <span class="kicker">When the pace feels fast</span>
      <h2>Let the light set a <em>gentler rhythm.</em></h2>
      <p>Follow without forcing a deeper breath. Choose text-only cues whenever watching the motion feels more comfortable.</p>
    </div>
    <div class="tool-landscape-experience" data-reveal data-reveal-delay="1">${breathExperience()}</div>
  </section>

  <section class="tool-landscape tool-landscape-ground" id="grounding">
    <div class="tool-landscape-art" aria-hidden="true"><div class="ground-horizon"><i></i><i></i><i></i></div><div class="ground-leaves"><span></span><span></span><span></span><span></span><span></span></div></div>
    <div class="tool-landscape-copy" data-reveal>
      <span class="kicker">When breath is not the right anchor</span>
      <h2>Come back through what is <em>around you.</em></h2>
      <p>Keep your eyes open and let breathing happen on its own. Notice ordinary details in the room without trying to change how you feel.</p>
    </div>
    <div class="tool-landscape-experience" data-reveal data-reveal-delay="1">${groundingExperience}</div>
  </section>

  <section class="tool-landscape tool-landscape-sound" id="sound">
    <div class="tool-landscape-art" aria-hidden="true"><div class="sound-ripples"><i></i><i></i><i></i><i></i></div><div class="night-plant"><span></span><span></span><span></span></div></div>
    <div class="tool-landscape-copy" data-reveal>
      <span class="kicker">When quiet feels too sharp</span>
      <h2>Give the room a <em>softer edge.</em></h2>
      <p>Blend a low-volume sound texture for reading, reflection, or rest. Nothing plays until you choose it.</p>
    </div>
    <div class="tool-landscape-experience" data-reveal data-reveal-delay="1">${soundExperience}</div>
  </section>

  <section class="tool-landscape tool-landscape-reflect" id="reflection">
    <div class="tool-landscape-art" aria-hidden="true"><div class="reflection-stem"><i></i><span></span><span></span><span></span></div><div class="reflection-sun"></div></div>
    <div class="tool-landscape-copy" data-reveal>
      <span class="kicker">When the feeling needs words</span>
      <h2>Notice first. Decide what comes <em>next.</em></h2>
      <p>A brief prompt can help you name what is present, what you may need, and one manageable next step.</p>
    </div>
    <div class="tool-landscape-experience" data-reveal data-reveal-delay="1">${reflectionExperience}</div>
  </section>

  <section class="tools-choice-note">
    <div data-reveal>
      <span class="kicker">Choice belongs in the practice</span>
      <h2>The useful tool is the one you can <em>adjust.</em></h2>
    </div>
    <div data-reveal data-reveal-delay="1">
      <p>Stop, switch, or step away whenever a practice does not feel supportive. These exercises offer general wellness support; they are not therapy, diagnosis, or emergency care.</p>
      <a class="button button-ink" href="${links.quiz}">Bring this into a conversation ${arrow}</a>
    </div>
  </section>`;

export const createJournalBody = ({ arrow, links, articles, imageSize, smallImageWidth }) => `
  <section class="journal-hero journal-hero-garden">
    <div class="journal-hero-copy">
      <span class="kicker">The Doppler journal</span>
      <h1>Useful words for <em>difficult days.</em></h1>
      <p>Thoughtful, practical reading for worry, low mood, relationships, rest, and finding your way into care.</p>
      <a class="button button-ink" href="#journal-library">Explore all ${articles.length} articles ${arrow}</a>
      <a class="text-link" href="../../pages/mindfulness-tools/">Try a mindful minute ${arrow}</a>
    </div>
    <div class="journal-garden" aria-hidden="true">
      <div class="journal-sun"></div>
      <div class="journal-path"><i></i><i></i><i></i></div>
      <div class="journal-plant journal-plant-tall"><span></span><span></span><span></span><span></span><span></span></div>
      <div class="journal-plant journal-plant-soft"><span></span><span></span><span></span><span></span></div>
      <div class="journal-plant journal-plant-small"><span></span><span></span><span></span></div>
      <div class="journal-bird"></div>
    </div>
  </section>

  <section class="journal-library" id="journal-library" aria-labelledby="journal-library-title">
    <div class="journal-library-head">
      <div><span class="kicker">Read at your pace</span><h2 id="journal-library-title">Find one idea to <em>carry with you.</em></h2></div>
      <p>Explore our complete collection. Choose a topic, or simply begin with the article that speaks to today.</p>
    </div>
    <div class="journal-tools">
      <div class="journal-filters" role="group" aria-label="Filter articles by topic" data-journal-filters>
        <button type="button" aria-pressed="true" data-journal-filter="all">All articles <span>${articles.length}</span></button>
        ${[...new Set(articles.map(article => article.category))].map(category => `<button type="button" aria-pressed="false" data-journal-filter="${category}">${category}</button>`).join('')}
      </div>
    </div>
    <div class="journal-grid journal-grid-illustrated" data-journal-grid>
      ${articles.map(article => { const [width, height] = imageSize(article.image); return `<a class="journal-card journal-card-illustrated" href="/blogs/news/${article.slug}/" data-journal-card data-category="${article.category}">
        <figure class="journal-card-art" aria-hidden="true"><img src="/assets/${article.image}" srcset="/assets/${article.image.replace(/\.webp$/, '-sm.webp')} ${smallImageWidth(article.image)}w, /assets/${article.image} ${width}w" sizes="(max-width: 720px) calc(100vw - 40px), (max-width: 1200px) 46vw, 400px" alt="" width="${width}" height="${height}" loading="lazy" decoding="async"></figure>
        <span class="journal-card-meta">${article.category} · ${article.read}</span>
        <h2>${article.title}</h2>
        <p>${article.dek}</p>
        <b>Read article ${arrow}</b>
      </a>`; }).join('')}
    </div>
  </section>

  <section class="journal-closing botanical-world botanical-world-evening">
    <div class="botanical-canopy botanical-canopy-left" aria-hidden="true"><span></span><span></span><span></span></div>
    <div><span class="kicker">You can begin without having it figured out</span><h2>Bring one honest thought into a <em>real conversation.</em></h2></div>
    <a class="button button-ink" href="${links.quiz}">Take the quiz ${arrow}</a>
  </section>`;
