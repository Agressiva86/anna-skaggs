import { initMosaicCurl, initSectionEdgeCurl, redrawMosaicCurl } from "./mosaic-curl.js";
import { initSmoothScroll } from "./smooth-scroll.js";

const root = document.documentElement;
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const markReady = () => root.classList.add("is-ready");
requestAnimationFrame(() => requestAnimationFrame(markReady));
setTimeout(markReady, 60);

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

const animated = document.querySelectorAll('[data-animate]:not([data-animate="line"])');

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
    { threshold: 0.22, rootMargin: "0px 0px -8% 0px" }
  );

  animated.forEach((item) => observer.observe(item));
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
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
}

initSmoothScroll(reduce);
initMosaicCurl(reduce);
initSectionEdgeCurl(".services__surface", reduce);
initSectionEdgeCurl(".steps__surface", reduce);
initWorkPin(reduce);
initSteps(reduce);
initVoices(reduce);

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
    const under = event.target instanceof Element ? event.target.closest(".mosaic-shot, .frame.hover-shot, .work-card__media, .project-visual") : null;
    cursor.classList.toggle("is-view", Boolean(under));
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

const heroMore = document.querySelector(".hero-more");
const hero = document.querySelector(".hero-mosaic");
if (heroMore && hero) {
  const placeHeroMore = () => {
    const bottom = hero.getBoundingClientRect().bottom;
    heroMore.classList.toggle("is-gone", bottom < window.innerHeight - 8);
  };
  placeHeroMore();
  window.addEventListener("scroll", placeHeroMore, { passive: true });
  window.addEventListener("resize", placeHeroMore);
}

const bar = document.querySelector(".mosaic-nav");
const header = bar?.querySelector(".nav");
if (bar && header) {
  let lastY = window.scrollY;
  let hidden = false;

  const updateHeader = () => {
    const y = window.scrollY;
    const delta = y - lastY;
    lastY = y;
    header.classList.toggle("is-scrolled", y > 8);
    if (document.body.classList.contains("menu-open") || y < 16) {
      hidden = false;
    } else if (Math.abs(delta) >= 3) {
      hidden = delta > 0;
    }
    bar.classList.toggle("is-hidden", hidden);
  };

  header.addEventListener("focusin", () => {
    hidden = false;
    bar.classList.remove("is-hidden");
  });

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
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
  if (!root || !track || !slides.length) return;

  let index = 0;
  let fadeUntil = 0;

  const paintFade = (now) => {
    redrawMosaicCurl();
    if (now < fadeUntil) requestAnimationFrame(paintFade);
  };

  const go = (nextIndex) => {
    index = Math.min(slides.length - 1, Math.max(0, nextIndex));
    track.style.transform = `translate3d(${-slides[index].offsetLeft}px, 0, 0)`;
    photos.forEach((photo, item) => photo.classList.toggle("is-active", item === index));
    slides.forEach((slide, item) => {
      const active = item === index;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", active ? "false" : "true");
    });
    if (back) back.disabled = index === 0;
    if (next) next.disabled = index === slides.length - 1;
    fadeUntil = performance.now() + (reduceMotion ? 0 : 860);
    requestAnimationFrame(paintFade);
  };

  next?.addEventListener("click", () => go(index + 1));
  back?.addEventListener("click", () => go(index - 1));

  if (viewport) {
    let startX = 0;
    let dragging = false;
    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      dragging = true;
      startX = event.clientX;
    });
    viewport.addEventListener("pointerup", (event) => {
      if (!dragging) return;
      dragging = false;
      const delta = event.clientX - startX;
      if (delta <= -48) go(index + 1);
      else if (delta >= 48) go(index - 1);
    });
    viewport.addEventListener("pointercancel", () => {
      dragging = false;
    });
  }

  go(0);
  window.addEventListener("resize", () => go(index));
}

