type Cleanup = () => void;

const ROOT_SELECTOR = "[data-lg-root]";

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
precision highp sampler2D;

in vec2 v_uv;
out vec4 out_color;

uniform vec2 u_resolution;
uniform vec4 u_mouse;
uniform sampler2D u_texture;

vec3 getTextureColorAt(vec2 coord) {
    return texture(u_texture, coord / u_resolution.xy).rgb;
}

float sdf(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

vec3 getBlurredColor(vec2 coord, float blurRadius) {
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;

    for (int x = -2; x <= 2; x++) {
        for (int y = -2; y <= 2; y++) {
            vec2 offset = vec2(float(x), float(y)) * blurRadius;
            float weight = exp(-0.5 * (float(x * x + y * y)) / 2.0);

            color += getTextureColorAt(coord + offset) * weight;
            totalWeight += weight;
        }
    }

    return color / totalWeight;
}

void main() {
    vec2 fragCoord = v_uv * u_resolution;
    float scale = max(1.0, min(u_resolution.x, u_resolution.y) / 420.0);
    vec2 glassSize = vec2(120.0, 80.0) * scale;
    vec2 glassCenter = u_mouse.xy;
    vec2 glassCoord = fragCoord - glassCenter;
    float size = min(glassSize.x, glassSize.y);
    float inversedSDF = -sdf(glassCoord, glassSize * 0.5, 16.0 * scale) / size;

    if (inversedSDF < 0.0) {
        out_color = vec4(getTextureColorAt(fragCoord), 1.0);
        return;
    }

    vec2 normalizedGlassCoord = normalize(glassCoord);
    float distFromCenter = 1.0 - clamp(inversedSDF / 0.3, 0.0, 1.0);
    float distortion = 1.0 - sqrt(1.0 - pow(distFromCenter, 2.0));
    vec2 offset = distortion * normalizedGlassCoord * glassSize * 0.5;
    vec2 glassColorCoord = fragCoord - offset;
    float blurIntensity = 1.2 * scale;
    float blurRadius = blurIntensity * (1.0 - distFromCenter * 0.5);

    float edge = smoothstep(0.0, 0.02, inversedSDF);
    vec2 shift = normalizedGlassCoord * edge * 3.0 * scale;
    vec3 glassColor = vec3(
        getBlurredColor(glassColorCoord - shift, blurRadius).r,
        getBlurredColor(glassColorCoord, blurRadius).g,
        getBlurredColor(glassColorCoord + shift, blurRadius).b
    );
    glassColor *= vec3(0.90);

    out_color = vec4(glassColor, 1.0);
}`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function destroyLG() {
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __lgCleanups?: Cleanup[] })
    | null;
  if (root?.__lgCleanups) {
    root.__lgCleanups.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    root.__lgCleanups = [];
  }
}

function initDemo(root: HTMLElement, cleanups: Cleanup[]) {
  const stage = root.querySelector<HTMLElement>(".lg-demo__stage");
  const seed = root.querySelector<HTMLCanvasElement>("[data-lg-canvas]");
  if (!stage || !seed) return;

  const canvas = seed.cloneNode(false) as HTMLCanvasElement;
  seed.replaceWith(canvas);

  const showFallback = (message: string) => {
    let note = stage.querySelector<HTMLElement>("[data-lg-fallback]");
    if (!note) {
      note = document.createElement("p");
      note.className = "lg-demo__fallback";
      note.dataset.lgFallback = "";
      stage.appendChild(note);
    }
    note.textContent = message;
    note.hidden = false;
  };

  const hideFallback = () => {
    stage.querySelector<HTMLElement>("[data-lg-fallback]")?.remove();
  };

  let frameId = 0;
  cleanups.push(() => {
    if (frameId) cancelAnimationFrame(frameId);
  });

  const start = () => {
    if (canvas.clientWidth < 1 || canvas.clientHeight < 1) {
      frameId = requestAnimationFrame(start);
      return;
    }

    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) {
      showFallback("WebGL 2 is required to run this demo in your browser.");
      return;
    }

    const program = createProgram(gl);
    if (!program) {
      showFallback("This demo could not compile its shader on your device.");
      return;
    }

    hideFallback();

  const posLoc = gl.getAttribLocation(program, "a_position");
  const resLoc = gl.getUniformLocation(program, "u_resolution");
  const mouseLoc = gl.getUniformLocation(program, "u_mouse");
  const texLoc = gl.getUniformLocation(program, "u_texture");

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const texture = gl.createTexture();
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
    new Uint8Array([20, 20, 28, 255]),
  );

  const image = new Image();
  image.decoding = "async";

  let width = 0;
  let height = 0;
  let mouseX = 0;
  let mouseY = 0;
  let mouseReady = false;
  let raf = 0;
  let dirty = false;
  let textureReady = false;

  const render = () => {
    if (!textureReady || !dirty) return;
    dirty = false;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(texLoc, 0);
    gl.uniform2f(resLoc, width, height);
    gl.uniform4f(mouseLoc, mouseX, mouseY, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const nextW = Math.max(1, Math.round(rect.width * dpr));
    const nextH = Math.max(1, Math.round(rect.height * dpr));

    if (nextW === width && nextH === height) return;

    const prevW = width || nextW;
    const prevH = height || nextH;
    if (mouseReady) {
      mouseX = (mouseX / prevW) * nextW;
      mouseY = (mouseY / prevH) * nextH;
    } else {
      mouseX = nextW * 0.5;
      mouseY = nextH * 0.5;
    }

    width = nextW;
    height = nextH;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    dirty = true;
    render();
  };

  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  };

  const setPointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    const dpr = canvas.width / Math.max(rect.width, 1);
    mouseX = (clientX - rect.left) * dpr;
    mouseY = (rect.bottom - clientY) * dpr;
    mouseReady = true;
    dirty = true;
    schedule();
  };

  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    textureReady = true;
    dirty = true;
    render();
  };

  image.onerror = () => {
    textureReady = true;
    dirty = true;
    render();
  };

  const onPointerMove = (event: PointerEvent) => {
    setPointer(event.clientX, event.clientY);
  };

  const onPointerDown = (event: PointerEvent) => {
    canvas.setPointerCapture(event.pointerId);
    setPointer(event.clientX, event.clientY);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  resize();
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerUp);

  const ro = new ResizeObserver(() => {
    resize();
  });
  ro.observe(stage);

  image.src =
    canvas.dataset.lgTexture || "/images/publications/liquid-glass-demo.png";

  cleanups.push(() => {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointerleave", onPointerUp);
    gl.deleteProgram(program);
    gl.deleteBuffer(quad);
    gl.deleteTexture(texture);
  });
  };

  start();
}

function initLG() {
  destroyLG();
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __lgCleanups?: Cleanup[] })
    | null;
  if (!root) return;

  const cleanups: Cleanup[] = [];
  root.__lgCleanups = cleanups;

  initDemo(root, cleanups);
}

document.addEventListener("astro:page-load", initLG);
document.addEventListener("astro:before-swap", destroyLG);

if (document.readyState !== "loading") initLG();
else document.addEventListener("DOMContentLoaded", initLG);
