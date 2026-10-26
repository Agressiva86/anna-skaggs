export function initSmoothScroll(reduce) {
  if (reduce) return;

  const root = document.documentElement;
  root.style.scrollBehavior = "auto";

  const limit = () => Math.max(0, root.scrollHeight - window.innerHeight);
  let target = window.scrollY;
  let expected = window.scrollY;
  let running = false;
  let last = performance.now();

  const step = (now) => {
    if (document.body.classList.contains("menu-open")) {
      target = window.scrollY;
      running = false;
      return;
    }

    const dt = Math.min(48, Math.max(1, now - last));
    last = now;
    target = Math.min(limit(), Math.max(0, target));
    const current = window.scrollY;
    const delta = target - current;

    if (Math.abs(delta) < 0.4) {
      expected = target;
      window.scrollTo(0, target);
      running = false;
      return;
    }

    expected = current + delta * (1 - Math.exp(-dt / 140));
    window.scrollTo(0, expected);
    requestAnimationFrame(step);
  };

  const start = () => {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(step);
  };

  const wheelDistance = (event) => {
    let delta = event.deltaY;
    if (event.deltaMode === 1) delta *= 16;
    if (event.deltaMode === 2) delta *= window.innerHeight;
    return delta;
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || document.body.classList.contains("menu-open")) return;
      event.preventDefault();
      target = Math.min(limit(), Math.max(0, target + wheelDistance(event)));
      start();
    },
    { passive: false },
  );

  window.addEventListener(
    "scroll",
    () => {
      if (Math.abs(window.scrollY - expected) <= 1.5) return;
      target = window.scrollY;
      expected = target;
    },
    { passive: true },
  );

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link) return;
    const id = link.getAttribute("href").slice(1);
    const destination = document.getElementById(id);
    if (!destination) return;
    event.preventDefault();
    target = Math.min(limit(), destination.getBoundingClientRect().top + window.scrollY);
    start();
  });

  window.addEventListener("resize", () => {
    target = Math.min(limit(), target);
  });
}
