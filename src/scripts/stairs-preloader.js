import gsap from "gsap";

export function initStairsPreloader(reduceMotion) {
  const root = document.querySelector("[data-stairs-preloader]");
  if (!root || !document.body.classList.contains("page-home")) return;

  const headerLogo = document.querySelector(".hero-bar .logo--cfs");
  const preloaderLogo = root.querySelector("[data-preloader-logo]");
  if (!headerLogo || !preloaderLogo) {
    root.remove();
    return;
  }

  const finish = () => {
    root.remove();
    document.body.classList.remove("is-preloading");
    headerLogo.style.visibility = "";
    headerLogo.style.pointerEvents = "";
    gsap.set(preloaderLogo, { clearProps: "all" });
  };

  if (reduceMotion) {
    finish();
    return;
  }

  document.body.classList.add("is-preloading");
  headerLogo.style.visibility = "hidden";
  headerLogo.style.pointerEvents = "none";

  const waitForFonts = () =>
    new Promise((resolve) => {
      if (document.documentElement.classList.contains("fonts-ready")) {
        resolve();
        return;
      }
      const done = () => resolve();
      if (document.fonts?.ready) {
        document.fonts.ready.then(done).catch(done);
      } else {
        done();
      }
      setTimeout(done, 1200);
    });

  const waitMin = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /** Musi być zgodne z `.stairs-preloader.is-exiting .stairs-preloader__panel` (s). */
  const STAIR_STAGGER_MS = 75;

  const logoFlightDelayMs = () => {
    const cols = [...root.querySelectorAll(".stairs-preloader__col")];
    const n = cols.length;
    if (!n) return 400;

    const logoBox = preloaderLogo.getBoundingClientRect();
    const logoCx = logoBox.left + logoBox.width / 2;

    let colRightOfLogo = Math.ceil(n / 2) - 1;
    for (let i = 0; i < n; i++) {
      const colBox = cols[i].getBoundingClientRect();
      const colCx = colBox.left + colBox.width / 2;
      if (colCx > logoCx) {
        colRightOfLogo = i;
        break;
      }
    }

    return (n - 1 - colRightOfLogo) * STAIR_STAGGER_MS;
  };

  const flyLogoToHeader = () =>
    new Promise((resolve) => {
      const svg = preloaderLogo.querySelector(".logo__cfs");
      const headerSvg = headerLogo.querySelector(".logo__cfs");
      const targetEl = headerSvg || headerLogo;
      const target = targetEl.getBoundingClientRect();

      const fromCx = window.innerWidth / 2;
      const fromCy = window.innerHeight / 2;

      gsap.set(preloaderLogo, {
        clearProps: "transform,left,top,right,bottom,width,height",
      });

      if (svg && headerSvg) {
        const style = getComputedStyle(headerSvg);
        gsap.set(svg, {
          display: "block",
          width: style.width,
          height: style.height,
          maxHeight: "none",
        });
      }

      const sized = (svg || preloaderLogo).getBoundingClientRect();
      const startLeft = fromCx - sized.width / 2;
      const startTop = fromCy - sized.height / 2;

      gsap.set(preloaderLogo, {
        position: "fixed",
        left: startLeft,
        top: startTop,
        width: sized.width,
        height: sized.height,
        margin: 0,
        zIndex: 100001,
        transform: "none",
        x: 0,
        y: 0,
        scale: 1,
      });

      gsap.to(preloaderLogo, {
        duration: 0.85,
        ease: "power3.inOut",
        left: target.left,
        top: target.top,
        onComplete: resolve,
      });
    });

  const run = async () => {
    await Promise.all([waitForFonts(), waitMin(700)]);
    root.classList.add("is-exiting");

    await waitMin(logoFlightDelayMs());
    await flyLogoToHeader();
    finish();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => run(), { once: true });
  } else {
    run();
  }
}