/* Reconstructed Doppler UI. No analytics, cookies, localStorage or form submission.
   All reflective / mini-quiz answers stay in memory in the current tab. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const focusHeading = (node) => { if (node) { node.tabIndex = -1; node.focus({preventScroll: true}); } };

  const menu = $('[data-main-nav]');
  const menuButton = $('[data-menu-toggle]');
  function closeMenu(returnFocus = false) {
    if (!menu || !menuButton) return;
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    if (returnFocus) menuButton.focus();
  }
  if (menu && menuButton) {
    menuButton.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('click', e => { if (!e.target.closest('.nav-shell')) closeMenu(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (menu.classList.contains('is-open')) closeMenu(true);
        $$('.care-menu[open]').forEach(d => { d.open = false; $('summary', d).focus(); });
      }
    });
    window.matchMedia('(min-width: 801px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  }
  $$('.care-menu').forEach(d => document.addEventListener('click', e => { if (!d.contains(e.target)) d.open = false; }));

  $$('[data-mini-quiz]').forEach(root => {
    const questions = [
      {title: 'What would feel most helpful right now?', choices: ['Quiet the noise', 'Feel less stuck', 'Work through something hard', 'I’m not sure']},
      {title: 'How would you prefer to meet?', choices: ['At home', 'In person', 'Either works', 'Help me decide']},
      {title: 'What would help you open up?', choices: ['Room to process', 'Practical direction', 'A balance of both', 'I’m not sure yet']}
    ];
    let index = 0;
    let answers = [];
    const heading = $('[data-quiz-heading]', root);
    const options = $('[data-quiz-choices]', root);
    const progressLabel = $('[data-quiz-step]', root);
    const result = $('[data-quiz-result]', root);
    const previous = $('[data-quiz-back]', root);
    function render(focus = false) {
      const complete = index === questions.length;
      progressLabel.textContent = complete ? 'A considered next step' : `Step ${index + 1} of 3`;
      $$('[data-quiz-progress] span', root).forEach((p, i) => p.classList.toggle('on', i <= index));
      heading.textContent = complete ? 'You have a place to begin.' : questions[index].title;
      options.replaceChildren();
      options.hidden = complete;
      result.hidden = !complete;
      previous.hidden = index === 0;
      if (complete) {
        $('[data-quiz-summary]', root).textContent = 'These preferences are a starting point, not a diagnosis or a therapist match. Continue to Doppler’s questionnaire to share what you want the team to know. Your selections here are not sent to the form.';
      } else {
        questions[index].choices.forEach(value => {
          const button = document.createElement('button');
          button.type = 'button'; button.className = 'quiz-choice'; button.textContent = value;
          button.addEventListener('click', () => { answers[index] = value; index++; render(true); });
          options.append(button);
        });
      }
      if (focus) focusHeading(heading);
    }
    previous.addEventListener('click', () => { index = Math.max(0, index - 1); render(true); });
    $('[data-quiz-reset]', root).addEventListener('click', () => { index = 0; answers = []; render(true); });
    window.addEventListener('pagehide', () => { answers = []; index = 0; render(); });
    render();
  });

  $$('[data-tabs]').forEach(root => {
    const tabs = $$('[role=tab]', root);
    const panels = $$('[role=tabpanel]', root);
    function activate(tab, focus = false) {
      tabs.forEach(t => { const active = t === tab; t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; });
      panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
      if (focus) tab.focus();
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', e => {
        let next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) { e.preventDefault(); activate(tabs[next], true); }
      });
    });
  });

  $$('[data-setting]').forEach(root => {
    const tabs = $$('[data-setting-choice]', root);
    const image = $('[data-setting-image]', root);
    function set(tab, focus = false) {
      const home = tab.dataset.settingChoice === 'home';
      tabs.forEach(t => { const active = t === tab; t.setAttribute('aria-selected', String(active)); t.tabIndex = active ? 0 : -1; });
      $$('[data-setting-panel]', root).forEach(p => { p.hidden = p.dataset.settingPanel !== tab.dataset.settingChoice; });
      image.src = home ? image.dataset.home : image.dataset.person;
      image.alt = home ? 'Illustrated at-home video therapy scene with a person and a therapist on a tablet' : 'Staged therapy conversation; not a depiction of actual Doppler clinicians or clients';
      if (focus) tab.focus();
    }
    tabs.forEach((t,i) => {
      t.addEventListener('click', () => set(t));
      t.addEventListener('keydown', e => {
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
          e.preventDefault(); set(tabs[e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i+1)%tabs.length], true);
        }
      });
    });
  });

  $$('[data-rail]').forEach(rail => {
    const buttons = $$(`[data-scroll-rail="${rail.id}"]`);
    buttons.forEach(b => b.addEventListener('click', () => rail.scrollBy({left: Number(b.dataset.direction) * Math.max(280, rail.clientWidth * .78), behavior: reducedMotion.matches ? 'instant' : 'smooth'})));
  });

  if ('IntersectionObserver' in window) {
    const steps = $$('[data-journey-step]');
    const label = $('[data-journey-label]');
    const number = $('[data-journey-number]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          steps.forEach(s => s.classList.toggle('is-current', s === entry.target));
          if (label) label.textContent = entry.target.dataset.journeyLabel;
          if (number) number.textContent = entry.target.dataset.journeyStep + ' / 04';
        }
      });
    }, {rootMargin: '-25% 0px -42% 0px', threshold: 0});
    steps.forEach(s => observer.observe(s));
  }

  $$('[data-breath-tool]').forEach(root => {
    const duration = $('[data-breath-duration]', root);
    const textOnly = $('[data-breath-text]', root);
    const start = $('[data-breath-start]', root);
    const reset = $('[data-breath-reset]', root);
    const progress = $('[data-breath-progress]', root);
    const status = $('[data-breath-status]', root);
    const cue = $('[data-breath-cue]', root);
    const visualCue = $('[data-breath-visual-cue]', root);
    const orb = $('.orb', root);
    let running = false, elapsed = 0, startedAt = 0, interval = 0;
    let total = Number(duration.value) * 1000;
    const paintCue = text => { if (cue.textContent !== text) cue.textContent = text; visualCue.textContent = text; };
    function elapsedNow() { return elapsed + (running ? performance.now() - startedAt : 0); }
    function stopInterval() { clearInterval(interval); interval = 0; }
    function update() {
      const ms = Math.min(total, elapsedNow());
      progress.max = total; progress.value = ms;
      if (ms >= total) {
        running = false; elapsed = total; stopInterval();
        root.classList.remove('is-running', 'is-paused');
        duration.disabled = false; start.textContent = 'Begin again';
        paintCue('A moment, just for you.'); status.textContent = 'Complete. Return to your own natural rhythm.';
        return;
      }
      if (running) {
        paintCue(ms % 10000 < 4000 ? 'Breathe in, gently.' : 'Breathe out, easily.');
        status.textContent = `${Math.ceil((total-ms)/1000)} seconds remaining · your own comfortable pace`;
      }
    }
    function pause(hidden = false) {
      if (!running) return;
      elapsed = elapsedNow(); running = false; stopInterval();
      root.classList.add('is-paused'); start.textContent = 'Resume breathing';
      status.textContent = hidden ? 'Paused while this tab is out of view.' : 'Paused. Take all the time you need.';
      paintCue('No hurry.');
    }
    function clear() {
      running = false; elapsed = 0; stopInterval(); total = Number(duration.value)*1000;
      root.classList.remove('is-running','is-paused'); duration.disabled=false;
      progress.max=total; progress.value=0; start.textContent='Start breathing';
      status.textContent='Ready when you are.'; cue.textContent='Take one easy breath.'; visualCue.textContent='At your own pace.';
    }
    start.addEventListener('click', () => {
      if (running) { pause(); return; }
      if (elapsed >= total) clear();
      startedAt=performance.now(); running=true; duration.disabled=true;
      root.classList.remove('is-running','is-paused');
      void orb.offsetWidth; // Restart the visual at the same elapsed phase after a pause.
      orb.style.animationDelay = `${-elapsed/1000}s`;
      root.classList.add('is-running');
      start.textContent='Pause breathing'; interval=setInterval(update,120); update();
    });
    reset.addEventListener('click', clear); duration.addEventListener('change',clear);
    textOnly.checked = reducedMotion.matches;
    const syncText = () => root.classList.toggle('text-only',textOnly.checked);
    textOnly.addEventListener('change',syncText); syncText();
    reducedMotion.addEventListener('change',e => { if(e.matches) {textOnly.checked=true;syncText();} });
    document.addEventListener('visibilitychange', () => { if(document.hidden) pause(true); });
    window.addEventListener('pagehide',clear); clear();
  });

  $$('[data-grounding]').forEach(root => {
    const stages=[
      ['5','Find five things you can see.','Keep your eyes open. Let your gaze rest on a shape, a color, a line, a light, or a familiar object. There is no need to name them out loud.'],
      ['4','Notice four points of contact.','Your feet on the floor, the chair beneath you, clothing on your skin, or your hands resting together. Choose only sensations that feel comfortable.'],
      ['3','Listen for three sounds.','A distant conversation, a fan, a bird, the room around you. Nothing to change; just something to notice.'],
      ['2','Choose two gentle details.','Notice two familiar scents, or choose two colors in the room instead. You can adapt any step to your senses and comfort.'],
      ['1','Come back to one thing.','Notice a taste already present, or settle your attention on one neutral object. You do not need to eat, drink, or change your breathing.'],
      ['✓','There is no perfect way to do this.','Notice whether anything feels different. It is also okay if it does not. Stop here, repeat a step, or choose another kind of support.']
    ];
    let index=0;
    const heading=$('[data-ground-heading]',root),next=$('[data-ground-next]',root),back=$('[data-ground-back]',root);
    function render(focus=false){
      const [n,h,p]=stages[index]; $('[data-ground-number]',root).textContent=n; heading.textContent=h; $('[data-ground-copy]',root).textContent=p;
      $$('[data-ground-progress] i',root).forEach((e,i)=>e.classList.toggle('on',i<=index));
      next.textContent=index===5?'Start again':'Next gentle step';back.disabled=index===0;
      if(focus) focusHeading(heading);
    }
    next.addEventListener('click',()=>{index=(index+1)%stages.length;render(true);});
    back.addEventListener('click',()=>{index=Math.max(0,index-1);render(true);});render();
  });

  $$('[data-reflection]').forEach(root=>{
    const prompts=['What feels hardest to carry today, and what would make it one small degree lighter?','What have you been asking yourself to handle alone?','What would you like someone to understand before trying to fix anything?','What is one boundary, request, or next step you could name without solving the whole situation?'];
    const field=$('textarea',root),prompt=$('[data-reflection-prompt]',root),count=$('[data-word-count]',root);let index=0;
    function update(){const text=field.value.trim();count.textContent=`${text?text.split(/\s+/).length:0} words · not sent or saved`;}
    $('[data-new-prompt]',root).addEventListener('click',()=>{index=(index+1)%prompts.length;prompt.textContent=prompts[index];});
    $('[data-clear-reflection]',root).addEventListener('click',()=>{field.value='';update();field.focus();});
    field.addEventListener('input',update);window.addEventListener('pagehide',()=>{field.value='';update();});update();
  });

  $$('[data-meditation]').forEach(root=>{
    const select=$('[data-timer-duration]',root),face=$('[data-timer-face]',root),button=$('[data-timer-start]',root),status=$('[data-timer-status]',root);
    let total=Number(select.value)*1000,elapsed=0,started=0,running=false,id=0;
    const now=()=>elapsed+(running?performance.now()-started:0);
    function paint(){const left=Math.max(0,Math.ceil((total-now())/1000));face.textContent=`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;if(!left){running=false;elapsed=total;clearInterval(id);button.textContent='Begin again';select.disabled=false;status.textContent='Your time is complete. Return when you are ready.';}}
    function pause(){if(running){elapsed=now();running=false;clearInterval(id);button.textContent='Resume';status.textContent='Paused. Nothing you need to catch up with.';}}
    function reset(){clearInterval(id);total=Number(select.value)*1000;elapsed=0;running=false;button.textContent='Start quiet time';select.disabled=false;status.textContent='Silent by default. No bell or automatic audio.';paint();}
    button.addEventListener('click',()=>{if(running){pause();return;}if(elapsed>=total)reset();running=true;started=performance.now();button.textContent='Pause';select.disabled=true;status.textContent='Let your attention rest somewhere comfortable. You can stop at any time.';id=setInterval(paint,200);paint();});
    $('[data-timer-reset]',root).addEventListener('click',reset);select.addEventListener('change',reset);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('pagehide',reset);reset();
  });

  const search=$('[data-journal-search]');
  if(search){const cards=$$('[data-journal-card]'),buttons=$$('[data-journal-filter]'),status=$('[data-search-status]');let category='All';
    function filter(){const q=search.value.toLowerCase().trim();let count=0;cards.forEach(card=>{const show=(category==='All'||card.dataset.category===category)&&card.textContent.toLowerCase().includes(q);card.hidden=!show;if(show)count++;});status.textContent=`${count} ${count===1?'guide':'guides'}`;$('[data-no-results]').hidden=count>0;}
    search.addEventListener('input',filter);buttons.forEach(b=>b.addEventListener('click',()=>{category=b.dataset.journalFilter;buttons.forEach(t=>t.setAttribute('aria-pressed',String(t===b)));filter();}));filter();
  }
})();
