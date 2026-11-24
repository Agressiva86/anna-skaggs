import { initSmoothScroll } from "./smooth-scroll.js";
import { initHeroIntro, initHeroVideo } from "./hero-intro.js";

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!root.classList.contains("fonts-ready")) {
  const revealFonts = () => root.classList.add("fonts-ready");
  if (document.fonts) {
    document.fonts.ready.then(revealFonts).catch(revealFonts);
  } else {
    revealFonts();
  }
  setTimeout(revealFonts, 1500);
}

const markReady = () => {
  if (!document.querySelector(".hero-stage")) root.classList.add("is-ready");
};
requestAnimationFrame(() => requestAnimationFrame(markReady));
setTimeout(markReady, 60);

const fitOlhaTitleFill = () => {
  const fill = document.querySelector(".hero-olha .olha__line--fill");
  const title = fill?.closest(".olha__title");
  if (!fill || !title) return;

  const width = title.clientWidth;
  if (width < 1) return;

  let min = 24;
  let max = Math.min(360, width * 0.28);

  while (max - min > 0.25) {
    const mid = (min + max) / 2;
    fill.style.fontSize = `${mid}px`;
    if (fill.scrollWidth > width) max = mid;
    else min = mid;
  }

  fill.style.fontSize = `${min}px`;
  title.style.setProperty("--olha-title-fill", `${min}px`);
};

const scheduleOlhaTitleFit = () => {
  requestAnimationFrame(fitOlhaTitleFill);
};

if (document.querySelector(".hero-olha .olha__line--fill")) {
  const runOlhaTitleFit = () => {
    scheduleOlhaTitleFit();
    setTimeout(scheduleOlhaTitleFit, 150);
  };
  if (document.fonts) {
    document.fonts.ready.then(runOlhaTitleFit).catch(runOlhaTitleFit);
  } else {
    runOlhaTitleFit();
  }
  window.addEventListener("resize", scheduleOlhaTitleFit, { passive: true });
}

document.querySelectorAll("[data-stagger]").forEach((group) => {
  group.querySelectorAll(":scope > [data-animate]").forEach((item, index) => {
    item.style.transitionDelay = `${index * 0.09}s`;
  });
});

document.querySelectorAll('[data-animate="fill"]').forEach((line) => {
  line.querySelectorAll("span").forEach((word, index) => {
    word.style.transitionDelay = `${index * 0.055}s`;
  });
});

const fadeItems = [...document.querySelectorAll('[data-animate="fade"]')];
const animated = document.querySelectorAll('[data-animate]:not([data-animate="line"]):not([data-animate="fade"])');

function replayFade(target) {
  target.classList.remove("in");
  void target.offsetWidth;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => target.classList.add("in"));
  });
}

const lines = reduce ? [] : [...document.querySelectorAll('[data-animate="line"]')];
const marks = reduce ? [] : [...document.querySelectorAll("[data-mark]")];
let lineFrame = 0;

function updateScrub() {
  lineFrame = 0;
  const view = window.innerHeight || 1;
  if (lines.length) {
    const travel = Math.min(320, view * 0.36);
    const start = view - 24;
    lines.forEach((line) => {
      const top = line.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, (start - top) / travel));
      line.style.transformOrigin = "left center";
      line.style.transform = `scaleX(${progress})`;
    });
  }
  if (marks.length) {
    const travel = Math.min(260, view * 0.3);
    const start = view * 0.75;
    marks.forEach((mark) => {
      const top = mark.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, (start - top) / travel));
      mark.style.setProperty("--mark", progress.toFixed(4));
    });
  }
}

if (lines.length || marks.length) {
  const requestScrub = () => {
    if (lineFrame) return;
    lineFrame = requestAnimationFrame(updateScrub);
  };
  window.addEventListener("scroll", requestScrub, { passive: true });
  window.addEventListener("resize", requestScrub);
  updateScrub();
}

if (reduce || !("IntersectionObserver" in window)) {
  fadeItems.forEach((item) => item.classList.add("in"));
  animated.forEach((item) => item.classList.add("in"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
  );

  animated.forEach((item) => observer.observe(item));

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          replayFade(entry.target);
          return;
        }
        entry.target.classList.remove("in");
      });
    },
    { threshold: 0.1, rootMargin: "0px" },
  );

  fadeItems.forEach((item) => fadeObserver.observe(item));
}

const parallaxNodes = reduce ? [] : [...document.querySelectorAll("[data-parallax]")];
let frame = 0;

function updateParallax() {
  frame = 0;
  const height = window.innerHeight || 1;
  parallaxNodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const progress = (rect.top + rect.height / 2 - height / 2) / height;
    const shift = Math.max(-1, Math.min(1, progress)) * -8;
    node.style.transform = `translate3d(0, ${shift}%, 0)`;
  });
}

if (parallaxNodes.length) {
  const requestTick = () => {
    if (frame) return;
    frame = requestAnimationFrame(updateParallax);
  };
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  updateParallax();
}

document.querySelectorAll(".nav-links a[href='#'], .menu a[href='#']").forEach((link) => {
  link.addEventListener("click", (event) => event.preventDefault());
});

const toggle = document.querySelector(".menu-toggle");
let menuScrollY = 0;

const updateScrollbarWidth = () => {
  const scrollbar = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  document.documentElement.style.setProperty("--scrollbar-width", `${scrollbar}px`);
};

updateScrollbarWidth();
window.addEventListener("resize", updateScrollbarWidth, { passive: true });

const setMenuOpen = (open) => {
  if (open) {
    menuScrollY = window.scrollY;
    updateScrollbarWidth();
    document.body.style.setProperty("--menu-scroll-y", `${menuScrollY}px`);
    document.body.classList.add("menu-open");
  } else {
    document.body.classList.remove("menu-open");
    document.body.style.removeProperty("--menu-scroll-y");
    updateScrollbarWidth();
    window.scrollTo(0, menuScrollY);
  }
  if (!toggle) return;
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
};

const closeMenu = () => {
  if (!document.body.classList.contains("menu-open")) return;
  setMenuOpen(false);
};
if (toggle) {
  toggle.addEventListener("click", () => {
    setMenuOpen(!document.body.classList.contains("menu-open"));
  });
  document.querySelectorAll(".menu a, .menu__lang-btn").forEach((el) => {
    el.addEventListener("click", () => closeMenu());
  });
}

function initMosaicStack() {
  const hero = document.querySelector(".hero-mosaic");
  if (!hero) return;

  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;";
  hero.appendChild(probe);
  const lengthOf = (name) => {
    probe.style.width = `var(${name})`;
    return probe.getBoundingClientRect().width;
  };

  let frame = 0;
  const layout = () => {
    const shots = [...hero.querySelectorAll(".mosaic-shot")];
    if (!shots.length) return;
    const stack = lengthOf("--stack");
    const row = lengthOf("--row");
    const navClear = lengthOf("--nav-clear");
    const tail = lengthOf("--tail");
    const items = shots
      .map((shot) => {
        const caption = shot.querySelector(".shot-caption");
        const units = parseFloat(getComputedStyle(shot).getPropertyValue("--top")) || 0;
        const captionTop = caption ? parseFloat(getComputedStyle(caption).top) || shot.offsetHeight : shot.offsetHeight;
        const captionHeight = caption ? caption.offsetHeight : 0;
        return {
          shot,
          left: shot.offsetLeft,
          right: shot.offsetLeft + shot.offsetWidth,
          height: shot.offsetHeight,
          designTop: navClear + units * row,
          captionEnd: Math.max(0, captionTop + captionHeight - shot.offsetHeight),
        };
      })
      .sort((a, b) => a.designTop - b.designTop || a.left - b.left);

    let lowest = 0;
    for (const item of items) {
      let top = null;
      for (const prev of items) {
        if (prev === item || prev.top == null) continue;
        const overlap = Math.min(item.right, prev.right) - Math.max(item.left, prev.left);
        if (overlap <= 1) continue;
        const minTop = prev.top + prev.height + prev.captionEnd + stack;
        top = top == null ? minTop : Math.max(top, minTop);
      }
      if (top == null) top = item.designTop;
      item.top = top;
      item.shot.style.top = `${top}px`;
      lowest = Math.max(lowest, top + item.height + item.captionEnd);
    }
    const minHeight = `${Math.ceil(lowest + tail)}px`;
    if (hero.style.minHeight !== minHeight) hero.style.minHeight = minHeight;
  };

  const request = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      layout();
    });
  };

  request();
  window.addEventListener("resize", request);
  document.fonts?.ready?.then(request);
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(request);
    observer.observe(hero);
    hero.querySelectorAll(".shot-caption").forEach((caption) => observer.observe(caption));
  }
}

initSmoothScroll(reduce);
initHeroIntro(reduce);
initHeroVideo(reduce);
initInertiaHero(reduce);
initAutoHideHeroBar(reduce);

function initAutoHideHeroBar(reduceMotion) {
  const bar = document.querySelector(".hero-bar");
  if (!bar) return;

  let lastY = window.scrollY;
  let ticking = false;
  const revealTop = 64;
  const deltaMin = 6;

  const update = () => {
    ticking = false;
    if (reduceMotion) {
      bar.classList.remove("is-hidden");
      lastY = window.scrollY;
      return;
    }

    const y = window.scrollY;
    const dy = y - lastY;

    if (y <= revealTop) {
      bar.classList.remove("is-hidden");
    } else if (dy > deltaMin) {
      bar.classList.add("is-hidden");
    } else if (dy < -deltaMin) {
      bar.classList.remove("is-hidden");
    }

    lastY = y;
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", request, { passive: true });
}

function initInertiaHero(reduceMotion) {
  const pin = document.querySelector("[data-inertia-pin]");
  const frame = document.querySelector("[data-inertia-video]");
  const slot = document.querySelector("[data-inertia-slot]");
  const view = pin?.querySelector(".inertia__view");
  if (!pin || !frame || !slot || !view) return;

  const topLine = pin.querySelector(".inertia__line--top");
  const bottomLine = pin.querySelector(".inertia__line--bottom");
  const captions = pin.querySelector(".inertia__captions");
  const cta = pin.querySelector(".inertia__cta");
  const player = frame.querySelector("[data-inertia-player]");
  let tick = 0;
  let introStart = 0;
  let introLoop = 0;
  const introMs = 1200;

  const posterImg = frame.querySelector("[data-inertia-poster]");

  const captureVideoPoster = () => {
    if (!player || !posterImg || !player.videoWidth) return;
    const paint = () => {
      const canvas = document.createElement("canvas");
      canvas.width = player.videoWidth;
      canvas.height = player.videoHeight;
      canvas.getContext("2d")?.drawImage(player, 0, 0);
      posterImg.src = canvas.toDataURL("image/jpeg", 0.86);
    };
    if (player.currentTime < 0.05) paint();
    else {
      player.addEventListener("seeked", paint, { once: true });
      player.currentTime = 0;
    }
  };

  if (player) {
    const showPlayer = () => {
      if (player.readyState >= 2) player.classList.add("is-ready");
    };
    player.addEventListener("loadeddata", () => {
      captureVideoPoster();
      showPlayer();
    });
    player.addEventListener("error", () => {
      console.warn("Hero video failed to load:", player.currentSrc || player.src);
    }, { once: true });
    showPlayer();
  }

  const easeOut = (value) => 1 - (1 - value) ** 3;
  const compactHero = window.matchMedia("(max-width: 980px)");

  const clearFrameStyles = () => {
    frame.style.width = "";
    frame.style.height = "";
    frame.style.left = "";
    frame.style.top = "";
    frame.style.transform = "";
    frame.style.zIndex = "";
  };

  const paintPlayer = (introT) => {
    if (player) {
      const ready = player.classList.contains("is-ready");
      const fade = ready ? introT : 0;
      player.style.opacity = String(fade);
      if (fade >= 1 || reduceMotion) {
        player.style.transform = "";
        player.style.filter = "";
      } else {
        const lift = 18 * (1 - fade);
        const scale = 1 + 0.035 * (1 - fade);
        const blur = 7 * (1 - fade);
        player.style.transform = `translateY(${lift}px) scale(${scale})`;
        player.style.filter = blur > 0.2 ? `blur(${blur}px)` : "none";
      }
    }
    if (posterImg?.src) {
      posterImg.style.opacity = String(1 - (player?.classList.contains("is-ready") ? introT : 0));
    }
  };

  const updateMobile = (now, introT) => {
    pin.style.height = "";
    clearFrameStyles();

    if (topLine) {
      topLine.style.transform = "";
      topLine.style.opacity = String(introT);
    }
    if (bottomLine) {
      bottomLine.style.transform = "";
      bottomLine.style.opacity = String(introT);
    }
    if (captions) captions.style.opacity = String(introT);
    if (cta) cta.style.opacity = String(introT);

    paintPlayer(introT);
  };

  const updateDesktop = (now, introT) => {
    const expand = window.innerHeight * 0.7;
    const hold = window.innerHeight * 0.4;
    pin.style.height = `${window.innerHeight + expand + hold}px`;
    const scrolled = Math.max(0, -pin.getBoundingClientRect().top);
    const grow = reduceMotion ? Math.min(1, scrolled / expand) : Math.min(1, scrolled / expand);

    const viewBox = view.getBoundingClientRect();
    const home = slot.getBoundingClientRect();
    const introScale = 0.58 + 0.42 * introT;
    const restW = home.width * introScale;
    const restH = home.height * introScale;
    const width = restW + (viewBox.width - restW) * grow;
    const height = restH + (viewBox.height - restH) * grow;
    const fromX = home.left - viewBox.left + home.width / 2;
    const fromY = home.top - viewBox.top + home.height / 2;
    const x = fromX + (viewBox.width / 2 - fromX) * grow;
    const y = fromY + (viewBox.height / 2 - fromY) * grow;

    frame.style.transform = "none";
    frame.style.width = `${width}px`;
    frame.style.height = `${height}px`;
    frame.style.left = `${x - width / 2 - (home.left - viewBox.left)}px`;
    frame.style.top = `${y - height / 2 - (home.top - viewBox.top)}px`;
    frame.style.zIndex = grow > 0.04 ? "5" : "1";

    const travel = Math.min(viewBox.width * 0.42, 520);
    const enterTop = (1 - introT) * travel;
    const enterBottom = (1 - introT) * -travel;
    const titleFade = introT * (1 - Math.min(1, grow / 0.55));
    if (topLine) {
      topLine.style.transform = `translateX(${enterTop}px)`;
      topLine.style.opacity = String(titleFade);
    }
    if (bottomLine) {
      bottomLine.style.transform = `translateX(${enterBottom}px)`;
      bottomLine.style.opacity = String(titleFade);
    }
    if (captions) captions.style.opacity = String(introT * (1 - Math.min(1, grow / 0.4)));

    paintPlayer(introT);
  };

  const update = (now = performance.now()) => {
    tick = 0;
    const introT = reduceMotion ? 1 : easeOut(Math.min(1, Math.max(0, (now - introStart) / introMs)));

    if (compactHero.matches) updateMobile(now, introT);
    else updateDesktop(now, introT);

    if (!reduceMotion && introT < 1) {
      introLoop = requestAnimationFrame(update);
    }
  };

  const request = () => {
    if (!tick) tick = requestAnimationFrame(update);
  };

  const begin = () => {
    introStart = performance.now();
    cancelAnimationFrame(introLoop);
    update(introStart);
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  compactHero.addEventListener("change", request);
  if (root.classList.contains("fonts-ready")) begin();
  else {
    const watch = new MutationObserver(() => {
      if (!root.classList.contains("fonts-ready")) return;
      watch.disconnect();
      begin();
    });
    watch.observe(root, { attributes: true, attributeFilter: ["class"] });
    setTimeout(() => {
      watch.disconnect();
      if (!introStart) begin();
    }, 1400);
  }
}
initMosaicStack();
initWorkPin(reduce);
initSteps(reduce);
initVoices(reduce);
initStatementStats(reduce);

const finePointer = window.matchMedia("(pointer: fine)").matches;
if (!reduce && finePointer) {
  root.classList.add("has-cursor");
  const cursor = document.createElement("div");
  cursor.className = "cursor";
  cursor.setAttribute("aria-hidden", "true");
  const label = document.createElement("span");
  label.className = "cursor__label";
  label.textContent = "View";
  cursor.appendChild(label);
  document.body.appendChild(cursor);

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;
  let targetX = x;
  let targetY = y;
  let frame = 0;
  let last = 0;

  const place = (now) => {
    frame = 0;
    const dt = Math.min(48, Math.max(1, now - (last || now)));
    last = now;
    x += (targetX - x) * (1 - Math.exp(-dt / 70));
    y += (targetY - y) * (1 - Math.exp(-dt / 70));
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    if (Math.hypot(targetX - x, targetY - y) > 0.3) {
      frame = requestAnimationFrame(place);
    }
  };

  const follow = () => {
    if (!frame) frame = requestAnimationFrame(place);
  };

  window.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
    const under = event.target instanceof Element
      ? event.target.closest(".frame.hover-shot, .work-card__media, .project-visual, .publications__media")
      : null;
    cursor.classList.toggle("is-view", Boolean(under));
    label.textContent = under?.classList.contains("publications__media") ? "Read" : "View";
    cursor.classList.add("is-on");
    follow();
  }, { passive: true });

  document.addEventListener("pointerout", (event) => {
    if (event.relatedTarget) return;
    cursor.classList.remove("is-on", "is-view");
  });
}

const serviceItems = [...document.querySelectorAll(".services__item")];
if (serviceItems.length && !reduce && "IntersectionObserver" in window) {
  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );

  const active = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-active", entry.isIntersecting);
      });
    },
    { rootMargin: "-49% 0px -49% 0px", threshold: 0 },
  );

  serviceItems.forEach((item) => {
    reveal.observe(item);
    active.observe(item);
  });
} else {
  serviceItems.forEach((item) => item.classList.add("is-in", "is-active"));
}

const updateLangUi = (key) => {
  const trigger = document.querySelector("[data-lang-trigger]");
  const label = key === "pl" ? "Polski" : "English";
  if (trigger) {
    trigger.querySelectorAll(".swap > span").forEach((span) => {
      span.textContent = label;
    });
    trigger.setAttribute("aria-label", key === "pl" ? "Język" : "Language");
  }
  document.querySelectorAll("[data-lang-option]").forEach((btn) => {
    const active = btn.getAttribute("data-lang-option") === key;
    btn.classList.toggle("is-selected", active);
    btn.setAttribute("aria-selected", String(active));
  });
};

const applyLang = (code) => {
  const key = code === "pl" ? "pl" : "en";
  document.documentElement.lang = key;
  document.querySelectorAll("[data-en][data-pl]").forEach((el) => {
    const text = el.getAttribute(`data-${key}`);
    if (!text) return;
    const spans = el.querySelectorAll(":scope > .swap > span");
    if (spans.length) spans.forEach((span) => {
      span.textContent = text;
    });
    else el.textContent = text;
  });
  updateLangUi(key);
};

let storedLang = "en";
try {
  storedLang = localStorage.getItem("lang") || "en";
} catch {
  storedLang = "en";
}
applyLang(storedLang === "pl" ? "pl" : "en");
document.querySelectorAll("[data-lang-option]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const next = btn.getAttribute("data-lang-option");
    applyLang(next);
    try {
      localStorage.setItem("lang", next === "pl" ? "pl" : "en");
    } catch {
      /* storage unavailable */
    }
  });
});

const header = document.querySelector(".nav");
const menuWord = header?.querySelector(".nav-menu");
const compactNav = window.matchMedia("(max-width: 700px)");
if (header && menuWord) {
  const updateHeader = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 8);
    if (compactNav.matches) {
      header.classList.remove("is-collapsed", "is-menu");
      return;
    }
    const collapsed = y > 72;
    if (!collapsed) header.classList.remove("is-menu");
    header.classList.toggle("is-collapsed", collapsed);
    if (!header.classList.contains("is-menu")) menuWord.setAttribute("aria-expanded", "false");
  };

  menuWord.addEventListener("click", () => {
    if (compactNav.matches) return;
    const open = header.classList.toggle("is-menu");
    menuWord.setAttribute("aria-expanded", String(open));
    menuWord.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
  compactNav.addEventListener("change", updateHeader);
}

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    if (note) note.hidden = false;
    form.reset();
  });
});

function initWorkPin(reduceMotion) {
  const pin = document.querySelector(".work-pin");
  const track = pin?.querySelector(".work-pin__track");
  if (!pin || !track) return;

  const mq = window.matchMedia("(max-width: 980px)");
  let pinFrame = 0;

  const quote = track.querySelector(".work-quote");
  const rules = [...pin.querySelectorAll(".work-rule")];

  const drawRules = (horizontal) => {
    const view = window.innerHeight || 1;
    rules.forEach((rule) => {
      if (reduceMotion) {
        rule.style.transform = "none";
        return;
      }
      if (!horizontal) {
        const top = rule.getBoundingClientRect().top;
        const grown = Math.max(0, Math.min(1, (view * 0.9 - top) / (view * 0.45)));
        rule.style.transformOrigin = "left center";
        rule.style.transform = `scaleX(${grown})`;
        return;
      }
      const left = rule.getBoundingClientRect().left;
      const across = Math.max(0, Math.min(1, (window.innerWidth * 0.96 - left) / (window.innerWidth * 0.68)));
      const top = rule.getBoundingClientRect().top;
      const arrived = Math.max(0, Math.min(1, (view * 0.92 - top) / (view * 0.7)));
      rule.style.transformOrigin = "center top";
      rule.style.transform = `scaleY(${Math.min(across, arrived)})`;
    });
  };

  const update = () => {
    pinFrame = 0;
    if (mq.matches) {
      pin.style.height = "";
      track.style.transform = "";
      if (quote) quote.style.flexBasis = "";
      pin.querySelectorAll(".work-card__body").forEach((body) => {
        body.style.transform = "";
      });
      drawRules(false);
      return;
    }

    if (quote) quote.style.flexBasis = `${window.innerWidth}px`;
    const travel = Math.max(0, track.scrollWidth - window.innerWidth);
    const nextHeight = `${window.innerHeight + travel}px`;
    if (pin.style.height !== nextHeight) pin.style.height = nextHeight;

    const range = Math.max(1, pin.offsetHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / range));
    track.style.transform = `translate3d(${-progress * travel}px, 0, 0)`;
    drawRules(true);
    if (reduceMotion) return;

    const rise = Math.min(420, window.innerHeight * 0.46);
    const start = window.innerWidth * 0.98;
    const end = window.innerWidth * 0.58;
    pin.querySelectorAll(".work-card").forEach((card) => {
      const body = card.querySelector(".work-card__body");
      if (!body) return;
      const t = Math.min(1, Math.max(0, (start - card.getBoundingClientRect().left) / (start - end)));
      body.style.transform = `translate3d(0, ${(1 - t) * rise}px, 0)`;
    });
  };

  const request = () => {
    if (!pinFrame) pinFrame = requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  mq.addEventListener("change", request);
}

function initStatementStats(reduceMotion) {
  const root = document.querySelector("[data-statement-stats]");
  if (!root) return;

  const pin = root.querySelector(".statement-stats__pin");
  const track = root.querySelector(".statement-stats__track");
  const tiles = [...root.querySelectorAll(".stat-tile")];
  const values = tiles.map((tile) => tile.querySelector("[data-stat-count]"));
  if (!tiles.length) return;

  const mqMobile = window.matchMedia("(max-width: 720px)");
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const smooth = (value) => value * value * (3 - 2 * value);

  const segmentProgress = (progress, index) => {
    const start = index / 3;
    return smooth(clamp01((progress - start) / (1 / 3)));
  };

  const applyProgress = (progress) => {
    root.style.setProperty("--stats-line", progress.toFixed(4));
    tiles.forEach((tile, index) => {
      const reveal = segmentProgress(progress, index);
      root.style.setProperty(`--reveal-${index}`, reveal.toFixed(4));
      const valueEl = values[index];
      if (!valueEl) return;
      const target = Number(valueEl.getAttribute("data-stat-count")) || 0;
      valueEl.textContent = String(Math.round(reveal * target));
    });
  };

  const setFinal = () => {
    root.style.setProperty("--stats-line", "1");
    for (let i = 0; i < 3; i += 1) root.style.setProperty(`--reveal-${i}`, "1");
    values.forEach((el) => {
      if (!el) return;
      el.textContent = el.getAttribute("data-stat-count") || "0";
    });
  };

  let frameId = 0;

  const update = () => {
    frameId = 0;
    if (reduceMotion) {
      root.style.height = "";
      if (track) track.style.transform = "";
      setFinal();
      return;
    }

    root.style.height = "";
    if (track) track.style.transform = "";

    const rect = root.getBoundingClientRect();
    const view = window.innerHeight || 1;
    const start = view * 0.84;
    const end = view * 0.28;
    const progress = clamp01((start - rect.top) / (start - end));
    applyProgress(progress);
  };

  const request = () => {
    if (frameId) return;
    frameId = requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  mqMobile.addEventListener("change", request);
}

function initSteps(reduceMotion) {
  const section = document.querySelector(".steps");
  const board = section?.querySelector(".steps__board");
  const rail = section?.querySelector(".steps__rail");
  if (!section || !board || !rail) return;

  const items = [...section.querySelectorAll(".steps__item")];
  const mq = window.matchMedia("(max-width: 980px)");
  let frameId = 0;

  const clamp = (value) => Math.min(1, Math.max(0, value));

  const update = () => {
    frameId = 0;
    if (reduceMotion || mq.matches) {
      section.classList.add("is-static");
      section.style.height = "";
      section.style.setProperty("--steps-progress", "1");
      items.forEach((item) => item.style.setProperty("--reveal", "1"));
      return;
    }

    section.classList.remove("is-static");
    if (section.style.height) section.style.height = "";

    const range = Math.max(1, section.offsetHeight - window.innerHeight);
    const progress = clamp(-section.getBoundingClientRect().top / range);
    const eased = clamp(progress / 0.86);
    section.style.setProperty("--steps-progress", eased.toFixed(4));

    items.forEach((item, index) => {
      if (index === 0) {
        item.style.setProperty("--reveal", "1");
        return;
      }
      const at = index / (items.length - 1);
      const raw = clamp((eased - (at - 0.22)) / 0.22);
      const smooth = raw * raw * (3 - 2 * raw);
      item.style.setProperty("--reveal", smooth.toFixed(4));
    });
  };

  const request = () => {
    if (!frameId) frameId = requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  mq.addEventListener("change", request);
}

function initVoices(reduceMotion) {
  const root = document.querySelector(".voices");
  const track = root?.querySelector(".voices__track");
  const slides = [...(root?.querySelectorAll(".voices__slide") || [])];
  const photos = [...(root?.querySelectorAll(".voices__photo") || [])];
  const next = root?.querySelector(".voices__next");
  const back = root?.querySelector(".voices__back");
  const viewport = root?.querySelector(".voices__viewport");
  if (!root || !track || !slides.length || !viewport) return;

  let index = 0;
  let timer = 0;
  let dragging = false;
  let paused = false;
  let pointerId = null;
  let startX = 0;
  let startOffset = 0;
  const autoDelay = 7000;

  const offsetFor = (item) => -slides[item].offsetLeft;

  const arm = () => {
    window.clearTimeout(timer);
    if (reduceMotion || paused || dragging) return;
    timer = window.setTimeout(() => go(index + 1), autoDelay);
  };

  const go = (nextIndex) => {
    const count = slides.length;
    index = ((nextIndex % count) + count) % count;
    track.style.transition = reduceMotion ? "none" : "";
    track.style.transform = `translate3d(${offsetFor(index)}px, 0, 0)`;
    photos.forEach((photo, item) => {
      const active = item === index;
      photo.classList.toggle("is-active", active);
      const media = photo.querySelector(".voices__photo-media");
      if (active && media && !reduceMotion) replayFade(media);
    });
    slides.forEach((slide, item) => {
      const active = item === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    if (back) back.disabled = false;
    if (next) next.disabled = false;
    arm();
  };

  next?.addEventListener("click", () => go(index + 1));
  back?.addEventListener("click", () => go(index - 1));

  const finishDrag = (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    dragging = false;
    viewport.classList.remove("is-dragging");
    try {
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    } catch {
      /* Capture was never taken. */
    }
    const delta = event.clientX - startX;
    pointerId = null;
    if (delta <= -48) go(index + 1);
    else if (delta >= 48) go(index - 1);
    else go(index);
  };

  viewport.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragging = true;
    pointerId = event.pointerId;
    startX = event.clientX;
    startOffset = offsetFor(index);
    viewport.classList.add("is-dragging");
    try {
      viewport.setPointerCapture(event.pointerId);
    } catch {
      /* The pointer can disappear before capture. */
    }
    track.style.transition = "none";
    window.clearTimeout(timer);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragging || event.pointerId !== pointerId) return;
    const delta = event.clientX - startX;
    track.style.transform = `translate3d(${startOffset + delta}px, 0, 0)`;
  });

  viewport.addEventListener("pointerup", finishDrag);
  viewport.addEventListener("pointercancel", finishDrag);

  root.addEventListener("pointerenter", () => {
    paused = true;
    window.clearTimeout(timer);
  });
  root.addEventListener("pointerleave", () => {
    paused = false;
    if (!dragging) arm();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.clearTimeout(timer);
    else arm();
  });

  go(0);
  window.addEventListener("resize", () => go(index));
}

