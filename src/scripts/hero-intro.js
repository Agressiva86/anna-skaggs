import gsap from "gsap";

const LOCKUP_VIEW = { w: 226, h: 36 };
const SIGN_SLOT = { x: 56.5, y: 10.25, w: 25.0134, h: 25 };

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function lockupSignSlot(lockup) {
  const box = lockup.getBoundingClientRect();
  const sx = box.width / LOCKUP_VIEW.w;
  const sy = box.height / LOCKUP_VIEW.h;
  return {
    left: box.left + SIGN_SLOT.x * sx,
    top: box.top + SIGN_SLOT.y * sy,
    width: SIGN_SLOT.w * sx,
    height: SIGN_SLOT.h * sy,
  };
}

function placeSignCover(cover, brand, slot) {
  if (!cover || !brand) return;
  const brandRect = brand.getBoundingClientRect();
  const bleed = 1.5;
  gsap.set(cover, {
    left: slot.left - brandRect.left - bleed,
    top: slot.top - brandRect.top - bleed,
    width: slot.width + bleed * 2,
    height: slot.height + bleed * 2,
  });
}

function centerSignRect() {
  const width = Math.min(window.innerWidth * 0.32, 220);
  const height = width * (140 / 141);
  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2 - window.innerHeight * 0.04,
    width,
    height,
  };
}

function placeSign(sign, rect) {
  sign.style.position = "fixed";
  sign.style.left = `${rect.left}px`;
  sign.style.top = `${rect.top}px`;
  sign.style.width = `${rect.width}px`;
  sign.style.height = `${rect.height}px`;
  sign.style.transform = "none";
}

export function initHeroIntro(reduceMotion) {
  const stage = document.querySelector(".hero-stage");
  if (!stage) return;

  const intro = stage.querySelector("[data-hero-intro]");
  const sign = stage.querySelector("[data-hero-sign]");
  const leftArrow = sign?.querySelector('[data-sign-arrow="left"]');
  const rightArrow = sign?.querySelector('[data-sign-arrow="right"]');
  const bar = sign?.querySelector("[data-sign-bar]");
  const lockup = stage.querySelector("[data-hero-lockup]");
  const shell = stage.querySelector("[data-hero-lockup-shell]");
  const brand = stage.querySelector("[data-hero-brand]");
  const cover = stage.querySelector("[data-hero-sign-cover]");
  const barEl = document.querySelector(".hero-bar");
  const media = stage.querySelector("[data-hero-media]");
  const copy = stage.querySelector("[data-hero-copy]");
  const lines = copy ? [...copy.querySelectorAll(".hero-stage__line")] : [];

  const finish = () => {
    if (shell) gsap.set(shell, { width: "100%", clearProps: "width" });
    cover?.remove();
    intro?.remove();
    document.body.classList.remove("hero-intro-active");
    stage.classList.add("is-intro-complete");
    document.documentElement.classList.add("is-ready");
    window.dispatchEvent(new Event("hero-intro-complete"));
  };

  if (reduceMotion || !intro || !sign || !leftArrow || !rightArrow || !bar || !lockup || !shell || !brand) {
    finish();
    return;
  }

  document.body.classList.add("hero-intro-active");
  document.documentElement.classList.remove("is-ready");

  gsap.set(shell, { width: "100%" });
  gsap.set(lockup, { autoAlpha: 0, filter: "none" });
  gsap.set(intro, { autoAlpha: 1 });
  gsap.set([barEl, media, copy], { autoAlpha: 0 });
  if (media) gsap.set(media, { y: 28 });
  if (copy) gsap.set(copy, { y: 20 });
  gsap.set(lines, { yPercent: 115, opacity: 0 });
  gsap.set([leftArrow, rightArrow], { x: 0, autoAlpha: 1 });
  gsap.set(leftArrow, { x: -108, autoAlpha: 0 });
  gsap.set(rightArrow, { x: 108, autoAlpha: 0 });
  gsap.set(bar, { attr: { y: 70, height: 0 } });
  placeSign(sign, centerSignRect());
  if (cover) gsap.set(cover, { autoAlpha: 1 });

  const syncCover = () => placeSignCover(cover, brand, lockupSignSlot(lockup));

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      syncCover();
      const flight = { ...centerSignRect() };

      const tl = gsap.timeline({
        defaults: { ease: "power3.inOut" },
        onComplete: finish,
      });

      tl.to(leftArrow, { x: 0, autoAlpha: 1, duration: 0.92, ease: "power3.out" }, 0)
        .to(rightArrow, { x: 0, autoAlpha: 1, duration: 0.92, ease: "power3.out" }, 0)
        .to(bar, { attr: { y: 0, height: 140 }, duration: 0.68, ease: "power3.out" }, 0.92)
        .addLabel("move", "+=0.18")
        .add(() => syncCover(), "move")
        .to(lockup, { autoAlpha: 1, duration: 0.55, ease: "power2.out" }, "move")
        .to(
          flight,
          {
            left: () => lockupSignSlot(lockup).left,
            top: () => lockupSignSlot(lockup).top,
            width: () => lockupSignSlot(lockup).width,
            height: () => lockupSignSlot(lockup).height,
            duration: 1.2,
            ease: "power3.inOut",
            onUpdate: () => placeSign(sign, flight),
          },
          "move",
        )
        .add(() => {
          placeSign(sign, lockupSignSlot(lockup));
          sign.style.visibility = "hidden";
          if (cover) cover.style.visibility = "hidden";
        }, "move+=1.2")
        .to(intro, { autoAlpha: 0, duration: 0.3, ease: "power2.inOut" }, "move+=1.22")
        .to(barEl, { autoAlpha: 1, duration: 0.55, ease: "power2.out" }, "move+=1.26")
        .to(media, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, "move+=1.3")
        .to(copy, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, "move+=1.34")
        .to(
          lines,
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.9,
            stagger: 0.11,
            ease: "power3.out",
          },
          "move+=1.38",
        );
    });
  });
}

export function initHeroVideo(reduceMotion) {
  const stage = document.querySelector(".hero-stage");
  const slot = stage?.querySelector("[data-hero-video-slot]");
  const frame = stage?.querySelector("[data-hero-video]");
  const runway = document.querySelector("[data-hero-runway]");
  if (!stage || !slot || !frame || !runway || reduceMotion) return;

  let parked = false;
  let tick = 0;

  const clearFrame = () => {
    frame.style.left = "";
    frame.style.top = "";
    frame.style.width = "";
    frame.style.height = "";
  };

  const park = () => {
    if (frame.parentElement !== runway) runway.appendChild(frame);
    frame.classList.remove("is-floating");
    frame.classList.add("is-fullscreen");
    clearFrame();
    parked = true;
  };

  const restore = () => {
    if (frame.parentElement !== slot) slot.appendChild(frame);
    frame.classList.remove("is-floating", "is-fullscreen");
    clearFrame();
    parked = false;
  };

  const restingRect = () => {
    const stageTop = stage.getBoundingClientRect().top;
    const home = slot.getBoundingClientRect();
    return {
      left: home.left,
      top: home.top - stageTop,
      width: home.width,
      height: home.height,
    };
  };

  const floatTo = (progress) => {
    if (frame.parentElement !== document.body) document.body.appendChild(frame);
    frame.classList.remove("is-fullscreen");
    frame.classList.add("is-floating");
    parked = false;

    const home = restingRect();
    const t = smoothstep(progress);
    const gutter =
      parseFloat(getComputedStyle(stage).getPropertyValue("--hero-video-gutter")) ||
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--band-gutter")) ||
      40;
    const viewWidth = document.documentElement.clientWidth;
    const targetLeft = gutter;
    const targetWidth = Math.max(0, viewWidth - gutter * 2);
    frame.style.left = `${home.left + (targetLeft - home.left) * t}px`;
    frame.style.top = `${home.top * (1 - t)}px`;
    frame.style.width = `${home.width + (targetWidth - home.width) * t}px`;
    frame.style.height = `${home.height + (window.innerHeight - home.height) * t}px`;
  };

  const update = () => {
    tick = 0;
    if (document.body.classList.contains("hero-intro-active")) return;

    const progress = clamp(1 - runway.getBoundingClientRect().top / window.innerHeight);

    if (progress <= 0.001) {
      restore();
      return;
    }

    if (progress >= 0.999) {
      park();
      return;
    }

    floatTo(progress);
  };

  const request = () => {
    if (!tick) tick = requestAnimationFrame(update);
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("hero-intro-complete", request);
  update();
}
