import { initMosaicCurl, initSectionEdgeCurl } from "./mosaic-curl.js";
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
let lineFrame = 0;

function updateLines() {
  lineFrame = 0;
  const view = window.innerHeight || 1;
  const travel = Math.min(320, view * 0.36);
  const start = view - 24;
  lines.forEach((line) => {
    const top = line.getBoundingClientRect().top;
    const progress = Math.max(0, Math.min(1, (start - top) / travel));
    line.style.transform = `scaleX(${progress})`;
  });
}

if (lines.length) {
  const requestLines = () => {
    if (lineFrame) return;
    lineFrame = requestAnimationFrame(updateLines);
  };
  window.addEventListener("scroll", requestLines, { passive: true });
  window.addEventListener("resize", requestLines);
  updateLines();
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
    const under = event.target instanceof Element ? event.target.closest(".mosaic-shot, .frame.hover-shot, .project") : null;
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

const header = document.querySelector(".mosaic-nav .nav");
if (header) {
  let lastY = window.scrollY;
  let hidden = false;

  const setHidden = (next) => {
    if (next === hidden) return;
    hidden = next;
    header.classList.toggle("nav--hidden", next);
  };

  header.addEventListener("focusin", () => setHidden(false));

  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (document.body.classList.contains("menu-open") || y < 16) {
        setHidden(false);
        return;
      }
      if (Math.abs(delta) < 3) return;
      setHidden(delta > 0);
    },
    { passive: true },
  );
}

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    if (note) note.hidden = false;
    form.reset();
  });
});
