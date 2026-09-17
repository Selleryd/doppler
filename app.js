document.documentElement.classList.add('js');

const one = (selector, scope = document) => scope.querySelector(selector);
const all = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const nav = one('.nav');
const progress = one('.scroll-progress span');
const readingProgress = one('[data-reading-progress]');
const parallaxItems = all('[data-parallax]');
let scrollFrame = 0;

const updateScroll = () => {
  const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  const pageProgress = Math.min(Math.max(scrollY / max, 0), 1);
  if (progress) progress.style.transform = `scaleX(${pageProgress})`;
  nav?.classList.toggle('is-scrolled', scrollY > 24);

  if (!reducedMotion.matches && finePointer.matches && innerWidth > 1160) {
    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const amount = Math.min(Math.max(Number(item.dataset.parallax) || 18, 0), 30);
      const distance = (innerHeight * .5 - (rect.top + rect.height * .5)) / Math.max(innerHeight, 1);
      const offset = Math.min(Math.max(distance * amount * 2, -amount), amount);
      item.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
    });
  }

  if (readingProgress) {
    const article = one('.article-prose');
    if (article) {
      const start = article.getBoundingClientRect().top + scrollY - innerHeight * .35;
      const end = start + article.offsetHeight - innerHeight * .35;
      const value = Math.min(Math.max((scrollY - start) / Math.max(end - start, 1), 0), 1);
      readingProgress.style.transform = `scaleX(${value})`;
    }
  }
  scrollFrame = 0;
};

addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}, { passive: true });
addEventListener('resize', () => {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
}, { passive: true });
updateScroll();

const heroWorld = one('[data-hero-world]');
if (heroWorld) {
  let heroInView = true;
  const syncHeroAmbience = () => {
    heroWorld.classList.toggle('is-ambient-active', heroInView && !document.hidden && !reducedMotion.matches);
  };

  if ('IntersectionObserver' in window) {
    const heroAmbienceObserver = new IntersectionObserver(([entry]) => {
      heroInView = entry.isIntersecting;
      syncHeroAmbience();
    }, { rootMargin: '120px 0px', threshold: .01 });
    heroAmbienceObserver.observe(heroWorld);
  }

  document.addEventListener('visibilitychange', syncHeroAmbience);
  reducedMotion.addEventListener?.('change', syncHeroAmbience);
  syncHeroAmbience();
}

const mobileToggle = one('.menu-toggle');
const mobileMenu = one('.mobile-menu');
const mobileClose = one('[data-menu-close]');
const pageMain = one('main');
const pageFooter = one('.footer');
const navBackground = all('.nav .brand, .nav .desktop-nav, .nav-actions .button');
let returnFocus = null;
let mobileScrollPosition = 0;
let restoreMobileScrollOnShow = false;

const focusableInMenu = () => mobileMenu ? all('a[href], button:not([disabled])', mobileMenu) : [];
const lockPage = () => {
  mobileScrollPosition = scrollY;
  document.body.classList.add('menu-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${mobileScrollPosition}px`;
  document.body.style.width = '100%';
};
const unlockPage = (restoreScroll = true) => {
  document.body.classList.remove('menu-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  if (restoreScroll) scrollTo(0, mobileScrollPosition);
};
const setMobileMenu = (open, { restoreFocus = true, restoreScroll = true } = {}) => {
  if (!mobileToggle || !mobileMenu) return;
  const wasOpen = mobileMenu.classList.contains('is-open');
  mobileToggle.setAttribute('aria-expanded', String(open));
  mobileToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileMenu.classList.toggle('is-open', open);
  mobileMenu.inert = !open;
  mobileMenu.setAttribute('role', 'dialog');
  mobileMenu.setAttribute('aria-modal', String(open));
  mobileMenu.setAttribute('aria-hidden', String(!open));
  if (pageMain) pageMain.inert = open;
  if (pageFooter) pageFooter.inert = open;
  navBackground.forEach((item) => { item.inert = open; });
  if (open) {
    returnFocus = document.activeElement;
    lockPage();
    closeDesktopMenu();
    requestAnimationFrame(() => focusableInMenu()[0]?.focus());
  } else {
    if (wasOpen) unlockPage(restoreScroll);
    if (restoreFocus && wasOpen && returnFocus instanceof HTMLElement && returnFocus.getClientRects().length) returnFocus.focus();
    returnFocus = null;
  }
};

mobileToggle?.addEventListener('click', () => setMobileMenu(mobileToggle.getAttribute('aria-expanded') !== 'true'));
mobileClose?.addEventListener('click', () => setMobileMenu(false));
all('a', mobileMenu || document.createElement('div')).forEach((link) => link.addEventListener('click', () => {
  const destination = new URL(link.href, location.href);
  const sameDocument = destination.origin === location.origin && destination.pathname === location.pathname && destination.search === location.search;
  if (sameDocument) setMobileMenu(false, { restoreFocus: false });
}));
if (mobileMenu) setMobileMenu(false);
const desktopBreakpoint = window.matchMedia('(min-width: 1161px)');
const handleDesktopBreakpoint = () => {
  setMobileMenu(false, { restoreFocus: false });
  closeDesktopMenu();
};
desktopBreakpoint.addEventListener?.('change', handleDesktopBreakpoint);
const normalizeMobileMenu = (restoreScroll = true) => {
  if (!mobileToggle || !mobileMenu) return;
  const wasLocked = document.body.classList.contains('menu-open');
  mobileToggle.setAttribute('aria-expanded', 'false');
  mobileToggle.setAttribute('aria-label', 'Open navigation');
  mobileMenu.classList.remove('is-open');
  mobileMenu.inert = true;
  mobileMenu.setAttribute('aria-hidden', 'true');
  mobileMenu.setAttribute('aria-modal', 'false');
  if (pageMain) pageMain.inert = false;
  if (pageFooter) pageFooter.inert = false;
  navBackground.forEach((item) => { item.inert = false; });
  document.body.classList.remove('menu-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  if (wasLocked && restoreScroll) scrollTo(0, mobileScrollPosition);
  returnFocus = null;
};

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    setMobileMenu(false);
    closeDesktopMenu(true);
  }
  if (event.key === 'Tab' && mobileMenu?.classList.contains('is-open')) {
    const items = focusableInMenu();
    const first = items[0];
    const last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
});

const desktopMenuButton = one('[data-menu-button]');
const desktopMenuPanel = one('[data-menu-panel]');
const closeDesktopMenu = (restoreFocus = false) => {
  const wasOpen = desktopMenuButton?.getAttribute('aria-expanded') === 'true';
  desktopMenuButton?.setAttribute('aria-expanded', 'false');
  desktopMenuPanel?.classList.remove('is-open');
  desktopMenuPanel?.setAttribute('aria-hidden', 'true');
  if (desktopMenuPanel) desktopMenuPanel.inert = true;
  if (restoreFocus && wasOpen) desktopMenuButton?.focus();
};

desktopMenuButton?.addEventListener('click', () => {
  const open = desktopMenuButton.getAttribute('aria-expanded') !== 'true';
  desktopMenuButton.setAttribute('aria-expanded', String(open));
  desktopMenuPanel?.classList.toggle('is-open', open);
  desktopMenuPanel?.setAttribute('aria-hidden', String(!open));
  if (desktopMenuPanel) desktopMenuPanel.inert = !open;
});
desktopMenuButton?.addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  desktopMenuButton.setAttribute('aria-expanded', 'true');
  desktopMenuPanel?.classList.add('is-open');
  desktopMenuPanel?.setAttribute('aria-hidden', 'false');
  if (desktopMenuPanel) desktopMenuPanel.inert = false;
  const links = all('a[href]', desktopMenuPanel || document);
  (event.key === 'ArrowUp' ? links.at(-1) : links[0])?.focus();
});

all('a[href]', desktopMenuPanel || document.createElement('div')).forEach((link, index, links) => {
  link.addEventListener('click', () => closeDesktopMenu());
  link.addEventListener('keydown', (event) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = event.key === 'ArrowDown' ? (index + 1) % links.length : (index + links.length - 1) % links.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = links.length - 1;
    links[next]?.focus();
  });
});

document.addEventListener('pointerdown', (event) => {
  if (!event.target.closest('.nav-menu')) closeDesktopMenu();
});
one('.nav-menu')?.addEventListener('focusout', (event) => {
  if (!event.currentTarget.contains(event.relatedTarget)) closeDesktopMenu();
});

const resetNavigationState = (restoreScroll = true) => {
  normalizeMobileMenu(restoreScroll);
  closeDesktopMenu();
};
addEventListener('pagehide', () => {
  restoreMobileScrollOnShow = document.body.classList.contains('menu-open');
  resetNavigationState(false);
});
addEventListener('pageshow', () => {
  resetNavigationState(false);
  if (restoreMobileScrollOnShow) scrollTo(0, mobileScrollPosition);
  restoreMobileScrollOnShow = false;
  updateScroll();
});

const revealItems = all('[data-reveal]');
let revealObserver = null;
const showReveal = (item) => {
  item.classList.add('is-visible');
  revealObserver?.unobserve(item);
};
revealItems.forEach((item) => {
  const delay = clamp(Number(item.dataset.revealDelay || 0), 0, 4);
  item.style.setProperty('--reveal-delay', `${delay * 80}ms`);
});
if (!('IntersectionObserver' in window) || reducedMotion.matches) {
  revealItems.forEach(showReveal);
} else {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      showReveal(entry.target);
    });
  }, { rootMargin: '0px 0px -9% 0px', threshold: .08 });
  revealItems.forEach((item) => revealObserver.observe(item));
}
document.addEventListener('focusin', (event) => {
  const item = event.target.closest?.('[data-reveal]');
  if (item) showReveal(item);
});
reducedMotion.addEventListener?.('change', (event) => {
  if (!event.matches) return;
  revealItems.forEach(showReveal);
  revealObserver?.disconnect();
});

const scrollStory = one('[data-scroll-story]');
if (scrollStory) {
  const chapters = all('[data-story-chapter]', scrollStory);
  const scenes = all('[data-story-scene]', scrollStory);
  const sceneImages = scenes.map((scene) => one('img', scene));
  const dots = all('.story-dots i', scrollStory);
  const previousStory = one('[data-story-prev]', scrollStory);
  const nextStory = one('[data-story-next]', scrollStory);
  const storyCurrent = one('[data-story-current]', scrollStory);
  const desktopStory = window.matchMedia('(min-width: 1021px)');
  let activeStoryIndex = 0;
  let requestedStoryIndex = 0;
  let storyRequestToken = 0;
  let storyScrollFrame = 0;

  const decodeStoryImage = async (index, priority = 'auto') => {
    const image = sceneImages[index];
    if (!image) return false;
    image.loading = 'eager';
    image.fetchPriority = priority;
    if (!image.complete) await new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
    if (!image.naturalWidth) return false;
    try { await image.decode?.(); } catch { return image.naturalWidth > 0; }
    return image.naturalWidth > 0;
  };

  const setStoryA11y = () => {
    const compact = !desktopStory.matches;
    chapters.forEach((chapter, chapterIndex) => {
      const active = chapterIndex === activeStoryIndex;
      chapter.inert = compact && !active;
      if (compact) chapter.setAttribute('aria-hidden', String(!active));
      else chapter.removeAttribute('aria-hidden');
    });
  };

  const commitChapter = (index) => {
    activeStoryIndex = clamp(index, 0, chapters.length - 1);
    chapters.forEach((chapter, chapterIndex) => chapter.classList.toggle('is-active', chapterIndex === activeStoryIndex));
    scenes.forEach((scene, sceneIndex) => {
      const active = sceneIndex === activeStoryIndex;
      scene.classList.toggle('is-active', active);
      scene.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === activeStoryIndex));
    if (storyCurrent) {
      const chapterName = one('span', chapters[activeStoryIndex])?.textContent?.trim() || 'Mindfulness moment';
      storyCurrent.textContent = `${chapterName} · ${activeStoryIndex + 1} of ${chapters.length}`;
    }
    scrollStory.dataset.activeChapter = String(activeStoryIndex);
    setStoryA11y();
  };

  const requestChapter = async (index) => {
    const nextIndex = clamp(index, 0, chapters.length - 1);
    if (nextIndex === activeStoryIndex) {
      requestedStoryIndex = activeStoryIndex;
      storyRequestToken += 1;
      return;
    }
    if (nextIndex === requestedStoryIndex) return;
    requestedStoryIndex = nextIndex;
    const token = ++storyRequestToken;
    const ready = await decodeStoryImage(nextIndex, 'high');
    if (token !== storyRequestToken || requestedStoryIndex !== nextIndex) return;
    if (!ready) {
      requestedStoryIndex = activeStoryIndex;
      return;
    }
    commitChapter(nextIndex);
  };

  const chooseStoryFromScroll = () => {
    storyScrollFrame = 0;
    if (!desktopStory.matches || reducedMotion.matches) return;
    const anchor = innerHeight * .5;
    const centers = chapters.map((chapter) => {
      const rect = chapter.getBoundingClientRect();
      return rect.top + rect.height * .5;
    });
    let candidate = activeStoryIndex;
    centers.forEach((center, index) => {
      if (Math.abs(center - anchor) < Math.abs(centers[candidate] - anchor)) candidate = index;
    });
    const candidateDistance = Math.abs(centers[candidate] - anchor);
    const activeDistance = Math.abs(centers[activeStoryIndex] - anchor);
    if (candidate === activeStoryIndex && requestedStoryIndex !== activeStoryIndex) requestChapter(activeStoryIndex);
    else if (candidate !== activeStoryIndex && candidateDistance + 56 < activeDistance) requestChapter(candidate);
  };

  const scheduleStoryUpdate = () => {
    if (!storyScrollFrame) storyScrollFrame = requestAnimationFrame(chooseStoryFromScroll);
  };

  const warmStoryScenes = () => sceneImages.forEach((image, index) => {
    if (!image) return;
    image.loading = 'eager';
    decodeStoryImage(index, index === 0 ? 'high' : 'low');
  });

  if ('IntersectionObserver' in window) {
    const warmObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      warmStoryScenes();
      observer.disconnect();
    }, { rootMargin: '1200px 0px' });
    warmObserver.observe(scrollStory);
  } else warmStoryScenes();

  previousStory?.addEventListener('click', () => requestChapter((activeStoryIndex + chapters.length - 1) % chapters.length));
  nextStory?.addEventListener('click', () => requestChapter((activeStoryIndex + 1) % chapters.length));
  addEventListener('scroll', scheduleStoryUpdate, { passive: true });
  addEventListener('resize', scheduleStoryUpdate, { passive: true });
  desktopStory.addEventListener?.('change', () => {
    setStoryA11y();
    scheduleStoryUpdate();
  });
  if (reducedMotion.matches) scrollStory.classList.add('story-static');
  commitChapter(0);
  requestedStoryIndex = 0;
  decodeStoryImage(0, 'high');
  scheduleStoryUpdate();

  const mobileStory = one('[data-mobile-story]', scrollStory);
  if (mobileStory) {
    const mobileCards = all('[data-mobile-story-card]', mobileStory);
    const mobileCount = one('[data-mobile-story-count]', mobileStory);
    const mobilePin = one('.story-mobile-pin', mobileStory);
    const mobileStoryQuery = matchMedia('(max-width: 820px)');
    let activeMobileIndex = 0;
    let mobileStoryFrame = 0;
    const easeMobileStory = (value) => value * value * (3 - 2 * value);

    const commitMobileCard = (index) => {
      activeMobileIndex = clamp(index, 0, mobileCards.length - 1);
      mobileCards.forEach((card, cardIndex) => {
        const active = cardIndex === activeMobileIndex;
        card.classList.toggle('is-active', active);
        card.classList.toggle('is-before', cardIndex < activeMobileIndex);
        card.classList.toggle('is-after', cardIndex > activeMobileIndex);
        card.inert = !active;
        card.setAttribute('aria-hidden', String(!active));
        if (active) {
          const image = one('img', card);
          if (image) image.loading = 'eager';
        }
      });
      if (mobileCount) mobileCount.textContent = `${String(activeMobileIndex + 1).padStart(2, '0')} / ${String(mobileCards.length).padStart(2, '0')}`;
    };

    const updateMobileStory = () => {
      mobileStoryFrame = 0;
      if (!mobileStoryQuery.matches) {
        mobileCards.forEach((card) => {
          card.inert = true;
          card.setAttribute('aria-hidden', 'true');
          card.style.removeProperty('--story-card-opacity');
          card.style.removeProperty('--story-card-y');
          card.style.removeProperty('--story-card-scale');
          card.style.removeProperty('--story-card-blur');
          card.style.removeProperty('--story-image-scale');
          card.style.removeProperty('z-index');
        });
        return;
      }

      if (reducedMotion.matches) {
        mobileCards.forEach((card) => {
          card.inert = false;
          card.removeAttribute('aria-hidden');
          card.style.removeProperty('--story-card-opacity');
          card.style.removeProperty('--story-card-y');
          card.style.removeProperty('--story-card-scale');
          card.style.removeProperty('--story-card-blur');
          card.style.removeProperty('--story-image-scale');
          card.style.removeProperty('z-index');
        });
        mobileStory.style.setProperty('--mobile-story-progress', '1');
        return;
      }

      const rect = mobileStory.getBoundingClientRect();
      const pinTop = mobilePin ? Math.max(parseFloat(getComputedStyle(mobilePin).top) || 0, 0) : Math.min(innerHeight * .14, 118);
      const pinHeight = mobilePin?.offsetHeight || innerHeight * .82;
      const travel = Math.max(rect.height - pinHeight - pinTop, 1);
      const storyProgress = clamp((pinTop - rect.top) / travel, 0, 1);
      const sectionPosition = Math.min(storyProgress * mobileCards.length, mobileCards.length - .0001);
      const sectionIndex = Math.min(mobileCards.length - 1, Math.floor(sectionPosition));
      const sectionProgress = sectionPosition - sectionIndex;
      const transitionProgress = easeMobileStory(clamp((sectionProgress - .62) / .38, 0, 1));
      const visualPosition = Math.min(mobileCards.length - 1, sectionIndex + transitionProgress);
      const nextIndex = Math.round(visualPosition);

      mobileCards.forEach((card, cardIndex) => {
        const delta = cardIndex - visualPosition;
        const distance = Math.min(Math.abs(delta), 1);
        const visibility = Math.pow(clamp(1 - distance, 0, 1), .72);
        const direction = clamp(delta, -1, 1);
        card.style.setProperty('--story-card-opacity', visibility.toFixed(4));
        card.style.setProperty('--story-card-y', `${(direction * 7.5).toFixed(3)}%`);
        card.style.setProperty('--story-card-scale', (1 - distance * .028).toFixed(4));
        card.style.setProperty('--story-card-blur', `${(distance * 6).toFixed(2)}px`);
        card.style.setProperty('--story-image-scale', (1.006 + distance * .026).toFixed(4));
        card.style.zIndex = String(10 - Math.round(distance * 5));
      });

      mobileStory.style.setProperty('--mobile-story-progress', String(Math.max(storyProgress, .02)));
      const a11yStateNeedsSync = mobileCards.some((card, cardIndex) => card.getAttribute('aria-hidden') !== String(cardIndex !== nextIndex));
      if (nextIndex !== activeMobileIndex || a11yStateNeedsSync) commitMobileCard(nextIndex);
    };

    const scheduleMobileStory = () => {
      if (!mobileStoryFrame) mobileStoryFrame = requestAnimationFrame(updateMobileStory);
    };

    addEventListener('scroll', scheduleMobileStory, { passive: true });
    addEventListener('resize', scheduleMobileStory, { passive: true });
    addEventListener('pageshow', scheduleMobileStory);
    mobileStoryQuery.addEventListener?.('change', scheduleMobileStory);
    reducedMotion.addEventListener?.('change', scheduleMobileStory);
    commitMobileCard(0);
    scheduleMobileStory();
  }
}

const stillnessStory = one('[data-stillness-story]');
if (stillnessStory) {
  const stillnessCopy = one('.home-stillness-copy', stillnessStory);
  const stillnessPicture = one('picture', stillnessStory);
  const stillnessImage = one('picture img', stillnessStory);
  let stillnessFrame = 0;

  const smoothstep = (value) => value * value * (3 - 2 * value);
  const updateStillnessStory = () => {
    stillnessFrame = 0;
    if (reducedMotion.matches) {
      if (stillnessCopy) stillnessCopy.inert = false;
      return;
    }

    const rect = stillnessStory.getBoundingClientRect();
    const travel = Math.max(rect.height - innerHeight, 1);
    const progressValue = clamp(-rect.top / travel, 0, 1);
    const compactScene = innerWidth <= 820;
    const sceneProgress = compactScene
      ? smoothstep(clamp((progressValue - .32) / .46, 0, 1))
      : smoothstep(clamp((progressValue - .015) / .6, 0, 1));
    const copyProgress = compactScene
      ? smoothstep(clamp((progressValue - .43) / .34, 0, 1))
      : smoothstep(clamp((progressValue - .075) / .39, 0, 1));
    const ambientOpacity = 1 - smoothstep(clamp(progressValue / (compactScene ? .24 : .2), 0, 1));

    if (compactScene && stillnessPicture && stillnessImage) {
      const panProgress = smoothstep(clamp(progressValue / .42, 0, 1));
      const imageOverflow = Math.max(stillnessImage.offsetWidth - stillnessPicture.clientWidth, 0);
      stillnessStory.style.setProperty('--stillness-mobile-pan-x', `${(-imageOverflow * panProgress).toFixed(2)}px`);
    } else {
      stillnessStory.style.setProperty('--stillness-mobile-pan-x', '0px');
    }

    stillnessStory.style.setProperty('--stillness-panel-x', `${(-104 + sceneProgress * 104).toFixed(3)}%`);
    stillnessStory.style.setProperty('--stillness-panel-y', `${(104 - sceneProgress * 104).toFixed(3)}%`);
    stillnessStory.style.setProperty('--stillness-panel-opacity', (sceneProgress * .98).toFixed(4));
    stillnessStory.style.setProperty('--stillness-image-x', `${(sceneProgress * 11).toFixed(3)}%`);
    stillnessStory.style.setProperty('--stillness-image-y', `${(-sceneProgress * 7).toFixed(3)}%`);
    stillnessStory.style.setProperty('--stillness-image-scale', (1.02 + sceneProgress * .025).toFixed(4));
    stillnessStory.style.setProperty('--stillness-copy-opacity', copyProgress.toFixed(4));
    stillnessStory.style.setProperty('--stillness-copy-x', `${(-48 + copyProgress * 48).toFixed(2)}px`);
    stillnessStory.style.setProperty('--stillness-copy-y', `${(34 - copyProgress * 34).toFixed(2)}px`);
    stillnessStory.style.setProperty('--stillness-ambient-opacity', ambientOpacity.toFixed(4));
    stillnessStory.style.setProperty('--stillness-ambient-y', `${((1 - ambientOpacity) * 18).toFixed(2)}px`);
    stillnessStory.dataset.stillnessPhase = progressValue < .18 ? 'arrive' : progressValue < .68 ? 'open' : 'settle';
    if (stillnessCopy) stillnessCopy.inert = copyProgress < .32;
  };

  const scheduleStillnessStory = () => {
    if (!stillnessFrame) stillnessFrame = requestAnimationFrame(updateStillnessStory);
  };

  addEventListener('scroll', scheduleStillnessStory, { passive: true });
  addEventListener('resize', scheduleStillnessStory, { passive: true });
  addEventListener('pageshow', scheduleStillnessStory);
  reducedMotion.addEventListener?.('change', scheduleStillnessStory);
  scheduleStillnessStory();
}

const quickStart = one('[data-quick-start]');
if (quickStart) {
  const steps = all('[data-quick-step]', quickStart);
  const result = one('[data-quick-result]', quickStart);
  const backButton = one('[data-quick-back]', quickStart);
  const resetButton = one('[data-quick-reset]', quickStart);
  const status = one('[data-quick-status]', quickStart);
  const progressDots = all('.quick-progress i', quickStart);
  const answers = {};
  const answerKeys = ['need', 'format', 'style'];
  const handoff = one('[data-intake-handoff]');
  const handoffDefault = handoff ? one('[data-handoff-default]', handoff) : null;
  const handoffPersonalized = handoff ? one('[data-handoff-personalized]', handoff) : null;
  const handoffReset = handoff ? one('[data-handoff-reset]', handoff) : null;
  const handoffValues = handoff ? {
    need: one('[data-handoff-need]', handoff),
    format: one('[data-handoff-format]', handoff),
    style: one('[data-handoff-style]', handoff)
  } : {};
  const compactQuiz = matchMedia('(max-width: 820px)');
  let index = 0;
  let stepTimer = 0;

  const hasCompleteAnswers = () => answerKeys.every((key) => Boolean(answers[key]));
  const saveQuickAnswers = () => {
    try { sessionStorage.setItem('dopplerQuickAnswers', JSON.stringify(answers)); } catch {}
  };
  const clearQuickAnswers = () => {
    try { sessionStorage.removeItem('dopplerQuickAnswers'); } catch {}
  };
  const renderHandoff = () => {
    if (!handoffDefault || !handoffPersonalized) return;
    const complete = hasCompleteAnswers();
    handoffDefault.hidden = complete;
    handoffDefault.inert = complete;
    handoffPersonalized.hidden = !complete;
    handoffPersonalized.inert = !complete;
    if (!complete) return;
    answerKeys.forEach((key) => {
      if (handoffValues[key]) handoffValues[key].textContent = answers[key];
    });
  };

  const focusStep = (node) => requestAnimationFrame(() => one('legend, h2', node)?.focus({ preventScroll: true }));
  const showStep = (nextIndex, moveFocus = true) => {
    clearTimeout(stepTimer);
    stepTimer = 0;
    index = clamp(nextIndex, 0, steps.length);
    const complete = index === steps.length;
    steps.forEach((step, stepIndex) => {
      const active = !complete && stepIndex === index;
      step.hidden = !active;
      step.inert = !active;
    });
    result.hidden = !complete;
    result.inert = !complete;
    backButton.hidden = index === 0;
    progressDots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex <= Math.min(index, steps.length - 1)));
    status.textContent = complete ? 'Ready to continue' : `Step ${index + 1} of ${steps.length}`;
    if (moveFocus) {
      focusStep(complete ? result : steps[index]);
      const bounds = quickStart.getBoundingClientRect();
      const navBottom = one('.nav-wrap')?.getBoundingClientRect().bottom || 82;
      if (compactQuiz.matches && (bounds.top < navBottom + 8 || bounds.top > innerHeight * .35)) {
        requestAnimationFrame(() => quickStart.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' }));
      }
    }
  };

  all('[data-quick-answer]', quickStart).forEach((button) => {
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      const step = button.closest('[data-quick-step]');
      const stepIndex = steps.indexOf(step);
      clearTimeout(stepTimer);
      all('[data-quick-answer]', step).forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
      answers[button.dataset.key] = button.dataset.value;
      saveQuickAnswers();
      renderHandoff();
      stepTimer = setTimeout(() => showStep(stepIndex + 1), reducedMotion.matches ? 0 : 300);
    });
  });
  backButton.addEventListener('click', () => showStep(index - 1));
  resetButton.addEventListener('click', () => {
    Object.keys(answers).forEach((key) => delete answers[key]);
    clearQuickAnswers();
    all('[data-quick-answer]', quickStart).forEach((button) => button.setAttribute('aria-pressed', 'false'));
    renderHandoff();
    showStep(0);
  });
  handoffReset?.addEventListener('click', () => {
    resetButton.click();
    requestAnimationFrame(() => quickStart.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' }));
  });
  quickStart.addEventListener('submit', (event) => event.preventDefault());
  steps.forEach((step) => one('legend', step)?.setAttribute('tabindex', '-1'));
  one('h2', result)?.setAttribute('tabindex', '-1');
  try {
    const storedAnswers = JSON.parse(sessionStorage.getItem('dopplerQuickAnswers') || '{}');
    answerKeys.forEach((key) => {
      if (typeof storedAnswers[key] === 'string') answers[key] = storedAnswers[key];
    });
  } catch {}
  all('[data-quick-answer]', quickStart).forEach((button) => {
    button.setAttribute('aria-pressed', String(answers[button.dataset.key] === button.dataset.value));
  });
  renderHandoff();
  const firstOpenStep = answerKeys.findIndex((key) => !answers[key]);
  showStep(firstOpenStep === -1 ? steps.length : firstOpenStep, false);
}

all('[data-care-experience]').forEach((experience) => {
  const buttons = all('[data-care-choice]', experience);
  const scenes = all('[data-care-scene]', experience);
  const panels = all('[data-care-panel]', experience);
  let activeMode = experience.dataset.careMode || 'home';
  let requestedMode = activeMode;
  let careRequestToken = 0;

  const decodeCareScene = async (mode) => {
    const scene = scenes.find((item) => item.dataset.careScene === mode);
    const image = scene ? one('img', scene) : null;
    if (!image) return false;
    image.loading = 'eager';
    if (!image.complete) await new Promise((resolve) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', resolve, { once: true });
    });
    if (!image.naturalWidth) return false;
    try { await image.decode?.(); } catch { return image.naturalWidth > 0; }
    return image.naturalWidth > 0;
  };

  const setCareTabState = (mode, focus = false) => {
    buttons.forEach((button) => {
      const active = button.dataset.careChoice === mode;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
  };

  const commitCareMode = (mode) => {
    activeMode = mode;
    requestedMode = mode;
    experience.dataset.careMode = mode;
    setCareTabState(mode);
    scenes.forEach((scene) => {
      const active = scene.dataset.careScene === mode;
      scene.classList.toggle('is-active', active);
      scene.setAttribute('aria-hidden', String(!active));
    });
    panels.forEach((panel) => {
      const active = panel.dataset.carePanel === mode;
      panel.classList.toggle('is-active', active);
      panel.inert = !active;
      panel.setAttribute('aria-hidden', String(!active));
    });
  };

  const activateCareMode = async (mode, focus = false) => {
    requestedMode = mode;
    const token = ++careRequestToken;
    if (focus) buttons.find((button) => button.dataset.careChoice === mode)?.focus();
    if (mode === activeMode) {
      experience.removeAttribute('aria-busy');
      commitCareMode(activeMode);
      return;
    }
    experience.setAttribute('aria-busy', 'true');
    const ready = await decodeCareScene(mode);
    if (token !== careRequestToken || requestedMode !== mode) return;
    experience.removeAttribute('aria-busy');
    if (!ready) {
      requestedMode = activeMode;
      setCareTabState(activeMode);
      return;
    }
    commitCareMode(mode);
  };

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activateCareMode(button.dataset.careChoice));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      activateCareMode(buttons[next].dataset.careChoice, true);
    });
  });
  if ('IntersectionObserver' in window) {
    const careWarmObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      scenes.forEach((scene) => decodeCareScene(scene.dataset.careScene));
      observer.disconnect();
    }, { rootMargin: '900px 0px' });
    careWarmObserver.observe(experience);
  } else scenes.forEach((scene) => decodeCareScene(scene.dataset.careScene));

  commitCareMode(activeMode);
});

all('[data-tabs]').forEach((tabs) => {
  const buttons = all('[role="tab"]', tabs);
  const panels = all('[data-tab-panel]', tabs);
  const activate = (button, focus = false) => {
    buttons.forEach((item) => {
      const active = item === button;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      const active = panel.id === button.getAttribute('aria-controls');
      panel.hidden = !active;
      panel.inert = !active;
    });
    if (focus) button.focus();
  };
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', (event) => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + buttons.length - 1) % buttons.length;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      activate(buttons[next], true);
    });
  });
  activate(buttons.find((button) => button.getAttribute('aria-selected') === 'true') || buttons[0]);
});

const breathTool = one('[data-breath-tool]');
if (breathTool) {
  const start = one('[data-breath-start]', breathTool);
  const startLabel = one('[data-breath-start-label]', breathTool);
  const end = one('[data-breath-end]', breathTool);
  const phaseLabel = one('[data-breath-phase]', breathTool);
  const visualWord = one('[data-breath-visual-word]', breathTool);
  const instruction = one('[data-breath-instruction]', breathTool);
  const status = one('[data-breath-status]', breathTool);
  const progressBar = one('[data-breath-progress]', breathTool);
  const progressTrack = progressBar?.parentElement;
  const durationButtons = all('[data-breath-duration]', breathTool);
  const textOnlyButton = one('[data-breath-text-only]', breathTool);
  let state = 'idle';
  let durationMs = 63000;
  let elapsedBefore = 0;
  let startedAt = 0;
  let frame = 0;
  let currentPhase = '';
  let lastProgress = -1;

  const setProgress = (value) => {
    const bounded = clamp(value, 0, 100);
    progressBar.style.transform = `scaleX(${bounded / 100})`;
    const rounded = Math.round(bounded);
    if (progressTrack && rounded !== lastProgress) {
      progressTrack.setAttribute('aria-valuenow', String(rounded));
      lastProgress = rounded;
    }
  };

  const setPhase = (phase) => {
    if (phase === currentPhase) return;
    currentPhase = phase;
    breathTool.dataset.phase = phase;
    if (phase === 'inhale') {
      phaseLabel.textContent = 'Breathe in, gently.';
      visualWord.textContent = 'Inhale';
      instruction.textContent = reducedMotion.matches || breathTool.classList.contains('is-text-only') ? 'Allow a comfortable inhale for three seconds.' : 'Let the circle open for three comfortable seconds.';
      status.textContent = 'Breathe in gently.';
    } else if (phase === 'exhale') {
      phaseLabel.textContent = 'Breathe out, slowly.';
      visualWord.textContent = 'Exhale';
      instruction.textContent = reducedMotion.matches || breathTool.classList.contains('is-text-only') ? 'Allow a comfortable exhale for four seconds.' : 'Let the breath leave without pushing for four easy seconds.';
      status.textContent = 'Breathe out slowly.';
    }
  };

  const updateControls = () => {
    breathTool.dataset.state = state;
    startLabel.textContent = state === 'running' ? 'Pause' : state === 'paused' ? 'Continue' : 'Start breathing';
    end.hidden = state === 'idle' || state === 'finished';
    durationButtons.forEach((button) => { button.disabled = state === 'running' || state === 'paused'; });
  };

  const finishBreathing = () => {
    const restoreFocus = document.activeElement === end;
    cancelAnimationFrame(frame);
    state = 'finished';
    elapsedBefore = 0;
    currentPhase = '';
    breathTool.dataset.phase = 'finished';
    setProgress(100);
    phaseLabel.textContent = 'Finished. Stay for a moment.';
    visualWord.textContent = 'Here';
    instruction.textContent = 'Return to your natural breathing and notice what is present, if anything.';
    status.textContent = 'The guided breathing exercise is complete.';
    updateControls();
    if (restoreFocus) start.focus();
  };

  const tickBreathing = (time) => {
    if (state !== 'running') return;
    const elapsed = elapsedBefore + time - startedAt;
    setProgress((elapsed / durationMs) * 100);
    if (elapsed >= durationMs) {
      finishBreathing();
      return;
    }
    setPhase(elapsed % 7000 < 3000 ? 'inhale' : 'exhale');
    frame = requestAnimationFrame(tickBreathing);
  };

  const beginBreathing = () => {
    if (state === 'finished' || state === 'idle') {
      elapsedBefore = 0;
      setProgress(0);
    }
    state = 'running';
    startedAt = performance.now();
    updateControls();
    frame = requestAnimationFrame(tickBreathing);
  };

  const pauseBreathing = () => {
    if (state !== 'running') return;
    elapsedBefore += performance.now() - startedAt;
    cancelAnimationFrame(frame);
    state = 'paused';
    currentPhase = '';
    breathTool.dataset.phase = 'paused';
    phaseLabel.textContent = 'Paused.';
    visualWord.textContent = 'Pause';
    instruction.textContent = 'Breathe normally. Continue only if and when you want to.';
    status.textContent = 'The exercise is paused.';
    updateControls();
  };

  const resetBreathing = () => {
    const restoreFocus = document.activeElement === end;
    cancelAnimationFrame(frame);
    state = 'idle';
    elapsedBefore = 0;
    currentPhase = '';
    breathTool.dataset.phase = 'idle';
    setProgress(0);
    phaseLabel.textContent = 'Take one easy breath.';
    visualWord.textContent = 'Arrive';
    instruction.textContent = 'Follow the circle at a comfortable pace. There is no need to breathe more deeply than feels natural.';
    status.textContent = 'Exercise ended. Return whenever you want.';
    updateControls();
    if (restoreFocus) start.focus();
  };

  start.addEventListener('click', () => state === 'running' ? pauseBreathing() : beginBreathing());
  end.addEventListener('click', resetBreathing);
  durationButtons.forEach((button) => button.addEventListener('click', () => {
    durationButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    durationMs = Number(button.dataset.breathDuration) * 1000;
    resetBreathing();
    status.textContent = `${button.textContent.trim()} selected.`;
  }));
  textOnlyButton?.addEventListener('click', () => {
    const active = textOnlyButton.getAttribute('aria-pressed') !== 'true';
    textOnlyButton.setAttribute('aria-pressed', String(active));
    breathTool.classList.toggle('is-text-only', active);
    currentPhase = '';
    if (state === 'running') {
      const elapsed = elapsedBefore + performance.now() - startedAt;
      setPhase(elapsed % 7000 < 3000 ? 'inhale' : 'exhale');
    }
    status.textContent = active ? 'Text-only breathing guidance is on.' : 'Animated breathing guidance is on.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseBreathing(); });
  reducedMotion.addEventListener?.('change', () => {
    if (state === 'running') {
      const phase = currentPhase;
      currentPhase = '';
      setPhase(phase);
    }
  });
  addEventListener('pagehide', resetBreathing);
  updateControls();
}

const soundTool = one('[data-sound-tool]');
if (soundTool) {
  const toggle = one('[data-sound-toggle]', soundTool);
  const label = one('[data-sound-label]', soundTool);
  const stateLabel = one('.tool-heading b', soundTool);
  const status = one('[data-sound-status]', soundTool);
  const volume = one('[data-sound-volume]', soundTool);
  const volumeOutput = one('[data-sound-volume-output]', soundTool);
  const choices = all('[data-sound-choice]', soundTool);
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  let context;
  let nodes;
  let selected = 'rain';
  let soundPending = false;
  let soundWanted = false;
  let soundGeneration = 0;

  const stopSound = (message = 'Sound is off.') => {
    soundWanted = false;
    soundGeneration += 1;
    soundPending = false;
    toggle.removeAttribute('aria-busy');
    if (nodes && context) {
      const oldNodes = nodes;
      const activeContext = context;
      nodes = null;
      const now = activeContext.currentTime;
      oldNodes.gain.gain.cancelScheduledValues(now);
      oldNodes.gain.gain.setValueAtTime(oldNodes.gain.gain.value, now);
      oldNodes.gain.gain.linearRampToValueAtTime(0, now + .35);
      setTimeout(() => {
        try { oldNodes.source.stop(); } catch {}
        try { oldNodes.lfo?.stop(); } catch {}
        if (!nodes && activeContext.state === 'running') activeContext.suspend().catch(() => {});
      }, 380);
    }
    soundTool.dataset.playing = 'false';
    toggle.setAttribute('aria-pressed', 'false');
    label.textContent = 'Ambient sound';
    stateLabel.textContent = 'Off';
    status.textContent = message;
  };

  const buildNoiseBuffer = (mode) => {
    const length = context.sampleRate * 2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      if (mode === 'brown') {
        last = (last + .02 * white) / 1.02;
        data[index] = last * 3.2;
      } else data[index] = white * (mode === 'rain' ? .7 : .48);
    }
    return buffer;
  };

  const startSound = async () => {
    if (!AudioEngine) {
      soundWanted = false;
      status.textContent = 'Ambient sound is not supported in this browser.';
      return;
    }
    const generation = ++soundGeneration;
    soundPending = true;
    toggle.setAttribute('aria-busy', 'true');
    status.textContent = 'Starting ambient sound.';
    try {
      context ||= new AudioEngine();
      await context.resume();
      if (generation !== soundGeneration || !soundWanted || document.hidden) return;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const target = Math.min(Number(volume.value) / 100, .35);
      source.buffer = buildNoiseBuffer(selected);
      source.loop = true;
      filter.type = selected === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = selected === 'rain' ? 3200 : selected === 'ocean' ? 720 : 980;
      filter.Q.value = selected === 'rain' ? .45 : .25;
      gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(context.destination);
      let lfo;
      if (selected === 'ocean') {
        lfo = context.createOscillator();
        const lfoGain = context.createGain();
        lfo.frequency.value = .085;
        lfoGain.gain.value = target * .22;
        lfo.connect(lfoGain).connect(gain.gain);
        lfo.start();
      }
      source.start();
      gain.gain.linearRampToValueAtTime(target, context.currentTime + .8);
      nodes = { source, filter, gain, lfo };
      soundTool.dataset.playing = 'true';
      toggle.setAttribute('aria-pressed', 'true');
      label.textContent = 'Ambient sound';
      stateLabel.textContent = 'Playing';
      status.textContent = `${choices.find((item) => item.dataset.soundChoice === selected)?.textContent.trim()} is playing.`;
    } catch {
      if (generation === soundGeneration) stopSound('This sound could not be played. Try again.');
    } finally {
      if (generation === soundGeneration) {
        soundPending = false;
        toggle.removeAttribute('aria-busy');
      }
    }
  };

  toggle.addEventListener('click', () => {
    if (soundWanted || soundPending || soundTool.dataset.playing === 'true') stopSound();
    else {
      soundWanted = true;
      startSound();
    }
  });
  choices.forEach((button) => button.addEventListener('click', () => {
    selected = button.dataset.soundChoice;
    soundTool.dataset.sound = selected;
    choices.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    if (soundWanted || soundPending || soundTool.dataset.playing === 'true') {
      stopSound('Changing sound.');
      soundWanted = true;
      startSound();
    } else status.textContent = `${button.textContent.trim()} selected. Sound is off.`;
  }));
  volume.addEventListener('input', () => {
    const value = Number(volume.value);
    volumeOutput.textContent = `${value}%`;
    volume.setAttribute('aria-valuetext', `${value} percent`);
    if (nodes && context) nodes.gain.gain.setTargetAtTime(Math.min(value / 100, .35), context.currentTime, .08);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (soundWanted || soundPending || soundTool.dataset.playing === 'true')) stopSound('Sound paused when this tab became inactive.');
  });
  addEventListener('pagehide', () => {
    stopSound('');
    if (context && context.state !== 'closed') context.close().catch(() => {});
    context = null;
  });
  if (!AudioEngine) {
    toggle.disabled = true;
    choices.forEach((button) => { button.disabled = true; });
    volume.disabled = true;
    status.textContent = 'Ambient sound is not supported in this browser.';
  }
  volume.setAttribute('aria-valuetext', `${Number(volume.value)} percent`);
}

const groundTool = one('[data-ground-tool]');
if (groundTool) {
  const start = one('[data-ground-start]', groundTool);
  const reset = one('[data-ground-reset]', groundTool);
  const label = one('[data-ground-label]', groundTool);
  const visual = one('[data-ground-visual]', groundTool);
  const title = one('[data-ground-title]', groundTool);
  const copy = one('[data-ground-copy]', groundTool);
  const status = one('[data-ground-status]', groundTool);
  const stages = [
    ['Look', 'Find three ordinary colors.', 'Let your eyes move around the room. Name three colors without searching for anything special.', 'Three colors. Take your time.'],
    ['Listen', 'Notice two sounds.', 'Find the nearest sound and then one farther away. Let each begin and end on its own.', 'Two sounds. No need to identify them.'],
    ['Feel', 'Find one steady contact point.', 'Notice your feet in your shoes, your back against the chair, or your hand resting on a surface.', 'One steady point. Breathing can stay natural.'],
    ['Here', 'You returned to the room.', 'Notice whether you feel more present, less present, or about the same. Any answer is useful information.', 'Complete. Stop here or begin again.']
  ];
  let stage = -1;
  const renderGround = () => {
    const [word, heading, description, message] = stages[Math.max(stage, 0)];
    groundTool.dataset.stage = String(stage);
    visual.textContent = word;
    title.textContent = heading;
    copy.textContent = description;
    status.textContent = `${heading} ${description} ${message}`;
    label.textContent = stage >= stages.length - 1 ? 'Begin again' : stage < 0 ? 'Begin grounding' : 'Continue';
    reset.hidden = stage < 0;
  };
  start.addEventListener('click', () => {
    stage = stage >= stages.length - 1 ? 0 : stage + 1;
    renderGround();
  });
  reset.addEventListener('click', () => {
    const restoreFocus = document.activeElement === reset;
    stage = -1;
    groundTool.dataset.stage = 'idle';
    visual.textContent = 'Here';
    title.textContent = 'Return to the room.';
    copy.textContent = 'Let breathing happen on its own. This practice uses what you can see, hear, and feel around you.';
    status.textContent = 'Nothing to memorize.';
    label.textContent = 'Begin grounding';
    reset.hidden = true;
    if (restoreFocus) start.focus();
  });
}

const reflectionTool = one('[data-reflection-tool]');
if (reflectionTool) {
  const title = one('[data-reflection-title]', reflectionTool);
  const copy = one('[data-reflection-copy]', reflectionTool);
  const status = one('[data-reflection-status]', reflectionTool);
  const prompts = {
    notice: ['What is asking for your attention?', 'You do not need the perfect label. A few honest words are enough.'],
    need: ['What might feel supportive right now?', 'Try a need you can act on gently: quiet, company, food, movement, rest, or more information.'],
    next: ['What is one kind next step?', 'Make it small enough to begin in the next few minutes—or choose a time to return to it.']
  };
  all('[data-reflection-choice]', reflectionTool).forEach((button) => button.addEventListener('click', () => {
    all('[data-reflection-choice]', reflectionTool).forEach((choice) => choice.setAttribute('aria-pressed', String(choice === button)));
    [title.textContent, copy.textContent] = prompts[button.dataset.reflectionChoice];
    reflectionTool.dataset.prompt = button.dataset.reflectionChoice;
    status.textContent = `Prompt selected. ${title.textContent} ${copy.textContent}`;
  }));
}

const spectrum = one('[data-spectrum]');
if (spectrum) {
  const input = one('input[type="range"]', spectrum);
  const title = one('[data-spectrum-title]', spectrum);
  const copy = one('[data-spectrum-copy]', spectrum);
  const positions = [
    ['More room to explore', 'A reflective therapist may give you space, notice patterns with you, and let the conversation unfold.'],
    ['A balanced conversation', 'A collaborative therapist may combine open reflection with questions, structure, and shared next steps.'],
    ['More practical structure', 'A structured therapist may use clear goals, exercises, and direct tools between sessions.']
  ];
  const updateSpectrum = () => {
    const group = Number(input.value) < 34 ? 0 : Number(input.value) > 66 ? 2 : 1;
    [title.textContent, copy.textContent] = positions[group];
    input.setAttribute('aria-valuetext', positions[group][0]);
  };
  input.addEventListener('input', updateSpectrum);
  updateSpectrum();
}

const faqSearch = one('[data-faq-search]');
const faqList = one('[data-faq-list]');
if (faqList) {
  const items = all('[data-faq-item]', faqList);
  const filters = all('[data-faq-filter]');
  const empty = one('[data-faq-empty]');
  let category = 'all';
  const filterFaq = () => {
    const query = (faqSearch?.value || '').trim().toLowerCase();
    let visible = 0;
    items.forEach((item) => {
      const categoryMatch = category === 'all' || item.dataset.category === category;
      const queryMatch = !query || item.textContent.toLowerCase().includes(query);
      item.hidden = !(categoryMatch && queryMatch);
      if (!item.hidden) visible += 1;
    });
    if (empty) empty.hidden = visible !== 0;
  };
  filters.forEach((button) => button.addEventListener('click', () => {
    filters.forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    category = button.dataset.faqFilter;
    filterFaq();
  }));
  faqSearch?.addEventListener('input', filterFaq);
  items.forEach((item, index) => {
    const button = one('button[aria-expanded]', item);
    const panel = one('[data-faq-panel]', item);
    const open = index === 0;
    button.setAttribute('aria-expanded', String(open));
    item.classList.toggle('is-open', open);
    panel.inert = !open;
    panel.setAttribute('aria-hidden', String(!open));
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
      panel.inert = !open;
      panel.setAttribute('aria-hidden', String(!open));
    });
  });
}

const journalFilters = all('[data-journal-filter]');
const journalCards = all('[data-journal-card]');
if (journalFilters.length && journalCards.length) {
  journalFilters.forEach((button) => button.addEventListener('click', () => {
    journalFilters.forEach((item) => item.setAttribute('aria-pressed', 'false'));
    button.setAttribute('aria-pressed', 'true');
    const filter = button.dataset.journalFilter;
    journalCards.forEach((card) => { card.hidden = filter !== 'all' && card.dataset.category !== filter; });
  }));
}

all('[data-year]').forEach((item) => { item.textContent = new Date().getFullYear(); });
