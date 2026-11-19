const VERT = `
attribute vec2 aPosition;
varying vec2 vScreenUv;
void main() {
  vScreenUv = aPosition;
  gl_Position = vec4(aPosition.x * 2.0 - 1.0, 1.0 - aPosition.y * 2.0, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;
uniform sampler2D uTexture;
uniform sampler2D uTexture2;
uniform sampler2D uDisp;
uniform vec2 uViewport;
uniform vec4 uRect;
uniform vec2 uImageSize;
uniform vec2 uImageSize2;
uniform vec2 uFocus;
uniform float uCurl;
uniform float uMix;
uniform float uZoom;
uniform float uRadius;
uniform float uAlpha;
varying vec2 vScreenUv;

vec2 coverUv(vec2 local, vec2 imageSize) {
  float aspect = uRect.z / max(uRect.w, 1.0);
  float imageAspect = imageSize.x / max(imageSize.y, 1.0);
  if (imageAspect > aspect) {
    float window = aspect / imageAspect;
    local.x = uFocus.x * (1.0 - window) + local.x * window;
  } else {
    float window = imageAspect / aspect;
    local.y = uFocus.y * (1.0 - window) + local.y * window;
  }
  return clamp(local, 0.0, 1.0);
}

vec2 rot(vec2 v, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

void main() {
  vec2 screenUv = vScreenUv;
  float centeredY = screenUv.y * 2.0 - 1.0;
  float edgeProfile = 1.0 - sqrt(max(0.0, 1.0 - centeredY * centeredY));
  screenUv.x = 0.5 + (screenUv.x - 0.5) * (1.0 - edgeProfile * uCurl);
  vec2 localUv = (screenUv * uViewport - uRect.xy) / uRect.zw;
  vec2 edgePx = min(localUv, 1.0 - localUv) * uRect.zw;
  float mask = smoothstep(0.0, 0.75, min(edgePx.x, edgePx.y));
  if (uRadius > 0.5) {
    vec2 halfSize = uRect.zw * 0.5;
    float rad = min(uRadius, min(halfSize.x, halfSize.y));
    vec2 p = (localUv - 0.5) * uRect.zw;
    vec2 q = abs(p) - (halfSize - rad);
    float dist = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
    mask *= 1.0 - smoothstep(0.0, 1.25, dist);
  }
  if (mask <= 0.0) discard;

  vec2 zoomed = (localUv - 0.5) / max(uZoom, 1.0) + 0.5;
  vec2 disp = texture2D(uDisp, localUv).rg - 0.5;
  vec2 fromUv = coverUv(zoomed + rot(disp, 0.78539816) * 0.2 * uMix, uImageSize);
  vec2 toUv = coverUv(zoomed + rot(disp, -2.35619449) * 0.2 * (1.0 - uMix), uImageSize2);
  vec3 color = mix(texture2D(uTexture, fromUv).rgb, texture2D(uTexture2, toUv).rgb, uMix);

  gl_FragColor = vec4(color, mask * uAlpha);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
}

function createRenderer(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
  });
  if (!gl) return null;

  const vertex = compile(gl, gl.VERTEX_SHADER, VERT);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vertex || !fragment) return null;

  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniforms = Object.fromEntries(
    ["uViewport", "uRect", "uImageSize", "uImageSize2", "uFocus", "uCurl", "uMix", "uZoom", "uRadius", "uAlpha", "uTexture", "uTexture2", "uDisp"].map((name) => [
      name,
      gl.getUniformLocation(program, name),
    ]),
  );
  gl.uniform1i(uniforms.uTexture, 0);
  gl.uniform1i(uniforms.uTexture2, 1);
  gl.uniform1i(uniforms.uDisp, 2);
  gl.uniform2f(uniforms.uFocus, 0.5, 0.5);
  gl.uniform1f(uniforms.uZoom, 1);
  gl.uniform1f(uniforms.uRadius, 0);
  gl.uniform1f(uniforms.uAlpha, 1);
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const textures = [0, 1, 2].map((unit) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    return texture;
  });

  const dispSize = 128;
  const disp = new Uint8Array(dispSize * dispSize * 4);
  for (let y = 0; y < dispSize; y += 1) {
    for (let x = 0; x < dispSize; x += 1) {
      const nx = x / dispSize;
      const ny = y / dispSize;
      const wave =
        Math.sin(nx * 6.2 + ny * 2.4) * 0.34 +
        Math.sin(nx * 11.0 - ny * 7.5) * 0.22 +
        Math.sin(ny * 8.4 + nx * 3.1) * 0.22 +
        Math.sin((nx + ny) * 16.0) * 0.14;
      const value = Math.max(0, Math.min(255, Math.round((wave * 0.5 + 0.5) * 255)));
      const index = (y * dispSize + x) * 4;
      disp[index] = value;
      disp[index + 1] = value;
      disp[index + 2] = value;
      disp[index + 3] = 255;
    }
  }
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, dispSize, dispSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, disp);

  let imageSize = [1, 1];
  let imageSize2 = [1, 1];
  let ready = false;
  const ownTextures = new Map();

  function bindState() {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(uniforms.uTexture, 0);
    gl.uniform1i(uniforms.uTexture2, 1);
    gl.uniform1i(uniforms.uDisp, 2);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    textures.forEach((texture, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * ratio));
    const height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      bindState();
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    return rect;
  }

  return {
    upload(image) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      imageSize = [image.naturalWidth || image.width, image.naturalHeight || image.height];
      ready = imageSize[0] > 0;
    },
    uploadHover(image) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, textures[1]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      imageSize2 = [image.naturalWidth || image.width, image.naturalHeight || image.height];
    },
    uploadOwn(shot, image) {
      const texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.bindTexture(gl.TEXTURE_2D, textures[0]);
      const focus = (shot.dataset.focus || "0.5 0.5").split(/\s+/).map(Number);
      ownTextures.set(shot, {
        texture,
        size: [image.naturalWidth || image.width, image.naturalHeight || image.height],
        focus: [Number.isFinite(focus[0]) ? focus[0] : 0.5, Number.isFinite(focus[1]) ? focus[1] : 0.5],
      });
    },
    draw(shots, curl) {
      if (!ready) return;
      const canvasRect = resize();
      gl.uniform2f(uniforms.uViewport, canvasRect.width, canvasRect.height);
      gl.uniform2f(uniforms.uImageSize, imageSize[0], imageSize[1]);
      gl.uniform2f(uniforms.uImageSize2, imageSize2[0], imageSize2[1]);
      gl.disable(gl.SCISSOR_TEST);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.SCISSOR_TEST);
      const scale = canvas.width / Math.max(canvasRect.width, 1);
      const pad = (canvasRect.width * 0.5 * curl) / Math.max(0.05, 1 - curl) + 2;

      const ordered = [
        ...shots.filter((shot) => !shot.classList.contains("voices__photo")),
        ...shots.filter((shot) => shot.classList.contains("voices__photo") && !shot.classList.contains("is-active")),
        ...shots.filter((shot) => shot.classList.contains("voices__photo") && shot.classList.contains("is-active")),
      ];
      for (const shot of ordered) {
        const alpha = shot.classList.contains("voices__photo") ? parseFloat(getComputedStyle(shot).opacity) || 0 : 1;
        if (alpha < 0.02) continue;
        const rect = shot.getBoundingClientRect();
        if (rect.bottom < -pad || rect.top > canvasRect.height + pad || rect.width < 2) continue;
        const x = rect.left - canvasRect.left;
        const y = rect.top - canvasRect.top;
        const left = Math.max(0, Math.floor((x - pad) * scale));
        const right = Math.min(canvas.width, Math.ceil((x + rect.width + pad) * scale));
        const bottom = Math.max(0, Math.floor((canvasRect.height - (y + rect.height) - pad) * scale));
        const top = Math.min(canvas.height, Math.ceil((canvasRect.height - y + pad) * scale));
        gl.scissor(left, bottom, Math.max(0, right - left), Math.max(0, top - bottom));
        gl.uniform4f(uniforms.uRect, x, y, rect.width, rect.height);
        const own = ownTextures.get(shot);
        const radius = parseFloat(getComputedStyle(shot).borderTopLeftRadius) || 0;
        gl.uniform1f(uniforms.uRadius, radius);
        gl.uniform1f(uniforms.uAlpha, alpha);
        const zoom = Number(shot.dataset.zoom);
        gl.uniform1f(uniforms.uZoom, Number.isFinite(zoom) && zoom > 0 ? zoom : 1);
        gl.activeTexture(gl.TEXTURE0);
        if (own) {
          gl.bindTexture(gl.TEXTURE_2D, own.texture);
          gl.uniform2f(uniforms.uImageSize, own.size[0], own.size[1]);
          gl.uniform2f(uniforms.uFocus, own.focus[0], own.focus[1]);
          gl.uniform1f(uniforms.uCurl, curl);
          gl.uniform1f(uniforms.uMix, 0);
        } else if (shot.classList.contains("curl-shot")) {
          continue;
        } else {
          gl.bindTexture(gl.TEXTURE_2D, textures[0]);
          gl.uniform2f(uniforms.uImageSize, imageSize[0], imageSize[1]);
          gl.uniform2f(uniforms.uFocus, 0.5, 0.5);
          gl.uniform1f(uniforms.uCurl, shot.classList.contains("mosaic-shot") ? curl : 0);
          gl.uniform1f(uniforms.uMix, 0);
        }
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    },
  };
}

let requestMosaicDraw = () => {};

export function redrawMosaicCurl() {
  requestMosaicDraw();
}

export function initMosaicCurl(reduce) {
  const field = document.querySelector(".mosaic-field");
  const sample = field?.querySelector(".mosaic-shot__fill");
  if (!field || !sample || reduce) return;

  const canvas = document.createElement("canvas");
  canvas.className = "mosaic-curl";
  canvas.setAttribute("aria-hidden", "true");
  field.appendChild(canvas);

  const renderer = createRenderer(canvas);
  if (!renderer) {
    canvas.remove();
    return;
  }

  const shots = [...document.querySelectorAll(".hover-shot")];
  const curlShots = [...document.querySelectorAll(".curl-shot")];
  const drawn = [...shots, ...curlShots];
  let frame = 0;
  let curl = 0;
  let speed = 0;
  let lastY = window.scrollY;
  let lastScrollAt = 0;
  let lastFrame = performance.now();
  let pointerX = -1;
  let pointerY = -1;
  const zoomOf = new WeakMap();

  const render = (now) => {
    const dt = Math.min(48, Math.max(1, now - lastFrame));
    lastFrame = now;
    if (now - lastScrollAt > 70) speed += (0 - speed) * (1 - Math.exp(-dt / 120));
    const target = Math.min(speed / 1600, 1);
    curl += (target - curl) * (1 - Math.exp(-dt / 180));

    const focused = document.activeElement?.closest?.(".hover-shot");
    let zooming = false;
    for (const shot of shots) {
      const rect = shot.getBoundingClientRect();
      const over =
        shot === focused ||
        (pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom);
      shot.classList.toggle("is-over", over);
      const current = zoomOf.get(shot) ?? 1;
      const zoomTarget = over ? 1.1 : 1;
      let next = current + (zoomTarget - current) * (1 - Math.exp(-dt / 380));
      if (Math.abs(zoomTarget - next) < 0.0008) next = zoomTarget;
      else zooming = true;
      zoomOf.set(shot, next);
      shot.dataset.zoom = String(next);
    }

    renderer.draw(drawn, 0.16 * curl);
    if (curl > 0.003 || speed > 8 || zooming) requestDraw();
  };

  const requestDraw = () => {
    if (!frame) frame = requestAnimationFrame((now) => {
      frame = 0;
      render(now);
    });
  };

  requestMosaicDraw = requestDraw;

  const onScroll = () => {
    const now = performance.now();
    const y = window.scrollY;
    const dt = lastScrollAt ? Math.max(1, now - lastScrollAt) : 16;
    const instant = (Math.abs(y - lastY) / dt) * 1000;
    if (instant < Math.max(window.innerHeight * 2, 1600)) {
      speed += (instant - speed) * 0.45;
    }
    lastY = y;
    lastScrollAt = now;
    render(now);
  };

  const arm = () => {
    if (!sample.naturalWidth) return;
    renderer.upload(sample);
    field.classList.add("is-curling");
    requestDraw();
  };

  if (sample.complete && sample.naturalWidth) arm();
  else sample.addEventListener("load", arm, { once: true });

  curlShots.forEach((shot) => {
    const image = shot.querySelector("img");
    if (!image) return;
    const armShot = () => {
      if (!image.naturalWidth) return;
      renderer.uploadOwn(shot, image);
      shot.classList.add("is-curled");
      requestDraw();
    };
    if (image.complete && image.naturalWidth) armShot();
    else image.addEventListener("load", armShot, { once: true });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", requestDraw);
  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    requestDraw();
  }, { passive: true });
  window.addEventListener("pointerleave", () => {
    pointerX = -1;
    pointerY = -1;
    requestDraw();
  });
  window.addEventListener("focusin", requestDraw);
  window.addEventListener("focusout", requestDraw);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    field.classList.remove("is-curling");
  });
}

export function initSectionEdgeCurl(selector, reduce) {
  const surface = document.querySelector(selector);
  if (!surface || reduce) return;

  const steps = 18;
  let frame = 0;
  let curl = 0;
  let speed = 0;
  let lastY = window.scrollY;
  let lastScrollAt = 0;
  let lastFrame = performance.now();

  const inset = (screenY, amount, view) => {
    const centered = Math.min(1, Math.max(-1, (screenY / view) * 2 - 1));
    const edge = 1 - Math.sqrt(Math.max(0, 1 - centered * centered));
    return edge * amount * 0.5;
  };

  const apply = (amount) => {
    if (amount < 0.002) {
      surface.style.clipPath = "";
      return;
    }
    const rect = surface.getBoundingClientRect();
    const view = window.innerHeight || 1;
    if (rect.bottom < 0 || rect.top > view || rect.width < 2) {
      surface.style.clipPath = "";
      return;
    }
    const gutter = Math.max(0, surface.parentElement.getBoundingClientRect().left - rect.left);
    const span = rect.width;
    const right = [];
    const left = [];
    for (let i = 0; i <= steps; i += 1) {
      const screenY = rect.top + (rect.height * i) / steps;
      const bulge = Math.min(gutter, inset(screenY, amount, view) / 0.08 * gutter);
      const y = (i / steps) * 100;
      right.push(`${((gutter + (span - gutter * 2) + bulge) / span) * 100}% ${y}%`);
      left.push(`${((gutter - bulge) / span) * 100}% ${y}%`);
    }
    left.reverse();
    surface.style.clipPath = `polygon(${right.concat(left).join(",")})`;
  };

  const render = (now) => {
    const dt = Math.min(48, Math.max(1, now - lastFrame));
    lastFrame = now;
    if (now - lastScrollAt > 70) speed += (0 - speed) * (1 - Math.exp(-dt / 120));
    const target = Math.min(speed / 1600, 1);
    curl += (target - curl) * (1 - Math.exp(-dt / 180));
    apply(0.16 * curl);
    if (curl > 0.003 || speed > 8) requestDraw();
  };

  const requestDraw = () => {
    if (frame) return;
    frame = requestAnimationFrame((now) => {
      frame = 0;
      render(now);
    });
  };

  window.addEventListener("scroll", () => {
    const now = performance.now();
    const y = window.scrollY;
    const dt = lastScrollAt ? Math.max(1, now - lastScrollAt) : 16;
    const instant = (Math.abs(y - lastY) / dt) * 1000;
    if (instant < Math.max(window.innerHeight * 2, 1600)) {
      speed += (instant - speed) * 0.45;
    }
    lastY = y;
    lastScrollAt = now;
    render(now);
  }, { passive: true });
  window.addEventListener("resize", requestDraw);
}
