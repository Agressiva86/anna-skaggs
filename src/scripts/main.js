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

const animated = document.querySelectorAll("[data-animate]");

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

document.querySelectorAll("[data-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const note = form.querySelector(".form-note");
    if (note) note.hidden = false;
    form.reset();
  });
});
