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
uniform float uCurl;
uniform float uMix;
varying vec2 vScreenUv;

vec2 coverUv(vec2 local, vec2 imageSize) {
  float aspect = uRect.z / max(uRect.w, 1.0);
  float imageAspect = imageSize.x / max(imageSize.y, 1.0);
  if (imageAspect > aspect) {
    local.x = 0.5 + (local.x - 0.5) * aspect / imageAspect;
  } else {
    local.y = 0.5 + (local.y - 0.5) * imageAspect / aspect;
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
  if (mask <= 0.0) discard;

  vec2 disp = texture2D(uDisp, localUv).rg - 0.5;
  vec2 fromUv = coverUv(localUv + rot(disp, 0.78539816) * 0.2 * uMix, uImageSize);
  vec2 toUv = coverUv(localUv + rot(disp, -2.35619449) * 0.2 * (1.0 - uMix), uImageSize2);
  vec3 color = mix(texture2D(uTexture, fromUv).rgb, texture2D(uTexture2, toUv).rgb, uMix);

  gl_FragColor = vec4(color, mask);
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
    ["uViewport", "uRect", "uImageSize", "uImageSize2", "uCurl", "uMix", "uTexture", "uTexture2", "uDisp"].map((name) => [
      name,
      gl.getUniformLocation(program, name),
    ]),
  );
  gl.uniform1i(uniforms.uTexture, 0);
  gl.uniform1i(uniforms.uTexture2, 1);
  gl.uniform1i(uniforms.uDisp, 2);
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

      for (const shot of shots) {
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
        gl.uniform1f(uniforms.uCurl, shot.classList.contains("mosaic-shot") ? curl : 0);
        gl.uniform1f(uniforms.uMix, Number(shot.dataset.mix) || 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
    },
  };
}

export function initMosaicCurl(reduce) {
  const field = document.querySelector(".mosaic-field");
  const sample = field?.querySelector(".mosaic-shot__fill");
  const hover = field?.querySelector(".mosaic-shot__hover");
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
  let frame = 0;
  let curl = 0;
  let speed = 0;
  let lastY = window.scrollY;
  let lastScrollAt = 0;
  let lastFrame = performance.now();
  let pointerX = -1;
  let pointerY = -1;

  const render = (now) => {
    const dt = Math.min(48, Math.max(1, now - lastFrame));
    lastFrame = now;
    if (now - lastScrollAt > 70) speed += (0 - speed) * (1 - Math.exp(-dt / 120));
    const target = Math.min(speed / 1600, 1);
    curl += (target - curl) * (1 - Math.exp(-dt / 180));

    const focused = document.activeElement?.closest?.(".hover-shot");
    for (const shot of shots) {
      const rect = shot.getBoundingClientRect();
      const over =
        hover?.naturalWidth > 0 &&
        (shot === focused ||
          (pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom));
      shot.classList.toggle("is-over", over);
      const next = over ? 1 : 0;
      const current = Number(shot.dataset.mix) || 0;
      const tau = over ? 480 : 620;
      shot.dataset.mix = String(current + (next - current) * (1 - Math.exp(-dt / tau)));
      if (!shot.classList.contains("mosaic-shot")) {
        shot.classList.toggle("is-replaced", (Number(shot.dataset.mix) || 0) > 0.01);
      }
    }

    renderer.draw(shots, 0.16 * curl);
    const settling = shots.some((shot) => {
      const mix = Number(shot.dataset.mix) || 0;
      const rect = shot.getBoundingClientRect();
      const over =
        hover?.naturalWidth > 0 &&
        (shot === focused ||
          (pointerX >= rect.left && pointerX <= rect.right && pointerY >= rect.top && pointerY <= rect.bottom));
      return Math.abs(mix - (over ? 1 : 0)) > 0.012;
    });
    if (curl > 0.003 || speed > 8 || settling) requestDraw();
  };

  const requestDraw = () => {
    if (!frame) frame = requestAnimationFrame((now) => {
      frame = 0;
      render(now);
    });
  };

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

  const armHover = () => {
    if (!hover?.naturalWidth) return;
    renderer.uploadHover(hover);
    requestDraw();
  };

  if (sample.complete && sample.naturalWidth) arm();
  else sample.addEventListener("load", arm, { once: true });
  if (hover?.complete && hover.naturalWidth) armHover();
  else hover?.addEventListener("load", armHover, { once: true });

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
