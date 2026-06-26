import { layoutForViewport, renderComputer } from "./ce-computer-visual";

type Cleanup = () => void;
type RenderFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) => void;
type Rgb = [number, number, number];

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): Rgb {
  const m = hex.trim().replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(full || "888888", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgba = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

function makeNoise() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const valAt = (ix: number, iy: number) => p[(ix + p[iy & 255]) & 255] / 255;
  return (x: number, y: number) => {
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const xf = x - x0,
      yf = y - y0;
    const u = fade(xf),
      v = fade(yf);
    const n00 = valAt(x0, y0),
      n10 = valAt(x0 + 1, y0);
    const n01 = valAt(x0, y0 + 1),
      n11 = valAt(x0 + 1, y0 + 1);
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
  };
}

let cleanups: Cleanup[] = [];

function destroyTalkCardVisuals() {
  cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
  cleanups = [];
}

function mount(canvas: HTMLCanvasElement, render: RenderFn, animate = false) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  let geom = fit();
  let raf = 0;
  let visible = false;
  const start = performance.now();

  const frame = (now: number) => {
    raf = 0;
    render(geom.ctx, geom.w, geom.h, (now - start) / 1000);
    if (animate && visible && !reduce) raf = requestAnimationFrame(frame);
  };
  const request = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  const ro = new ResizeObserver(() => {
    geom = fit();
    request();
  });
  ro.observe(canvas);
  const io = new IntersectionObserver(
    (es) => {
      visible = es[0].isIntersecting;
      if (visible) request();
    },
    { rootMargin: "80px" },
  );
  io.observe(canvas);
  request();

  cleanups.push(() => {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
  });
}

function readAccents(wrap: HTMLElement): { a1: Rgb; a2: Rgb; a3: Rgb } {
  const root = wrap.closest(".talk-card") ?? wrap;
  const cs = getComputedStyle(root);
  return {
    a1: hexToRgb(cs.getPropertyValue("--t1")),
    a2: hexToRgb(cs.getPropertyValue("--t2")),
    a3: hexToRgb(cs.getPropertyValue("--t3")),
  };
}

/** Complex Animations hero — drifting dust field */
function initDust(canvas: HTMLCanvasElement, wrap: HTMLElement) {
  const { a1: A1, a2: A2, a3: A3 } = readAccents(wrap);
  const noise = makeNoise();
  type P = { x: number; y: number; r: number; s: number; c: Rgb };
  let parts: P[] = [];
  let lastW = -1;

  const seed = (w: number, h: number) => {
    const count = Math.round(clamp((w * h) / 14000, 28, 72));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.45 + Math.random() * 1.6,
      s: 0.25 + Math.random() * 0.7,
      c: mixRgb(A1, A3, Math.random()),
    }));
  };

  mount(
    canvas,
    (ctx, w, h, t) => {
      if (lastW !== w) {
        seed(w, h);
        lastW = w;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        const ang = noise(p.x * 0.0016, p.y * 0.0016 + t * 0.04) * TAU * 2;
        p.x += Math.cos(ang) * p.s;
        p.y += Math.sin(ang) * p.s - 0.12;
        if (p.x < -10) p.x = w + 10;
        else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        else if (p.y > h + 10) p.y = -10;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * p.s * 1.5 + p.x));
        ctx.beginPath();
        ctx.fillStyle = rgba(p.c, 0.55 * tw);
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    },
    true,
  );
}

/** Multi-Threading hero — flowing scheduler lanes */
function initLanes(canvas: HTMLCanvasElement, wrap: HTMLElement) {
  const { a1: A1, a2: A2, a3: A3 } = readAccents(wrap);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  type Blk = {
    lane: number;
    x: number;
    w: number;
    v: number;
    c: Rgb;
    a: number;
  };
  let blks: Blk[] = [];
  let lanes = 5;
  let lastW = -1;
  let prev = 0;

  const box = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill: string,
  ) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  const seed = (w: number, h: number) => {
    lanes = Math.round(clamp(h / 48, 3, 6));
    blks = [];
    for (let ln = 0; ln < lanes; ln++) {
      const n = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < n; i++) {
        blks.push({
          lane: ln,
          x: Math.random() * w,
          w: 22 + Math.random() * 56,
          v: 12 + Math.random() * 20,
          c: mixRgb(mixRgb(A1, A2, Math.random()), A3, Math.random() * 0.5),
          a: 0.2 + Math.random() * 0.38,
        });
      }
    }
  };

  mount(
    canvas,
    (ctx, w, h, t) => {
      const dt = Math.min(t - prev, 0.05);
      prev = t;
      if (w !== lastW) {
        seed(w, h);
        lastW = w;
      }
      ctx.clearRect(0, 0, w, h);

      const laneH = h / lanes;
      ctx.strokeStyle = rgba(A3, 0.07);
      ctx.lineWidth = 1;
      for (let i = 1; i < lanes; i++) {
        const y = i * laneH;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      for (const b of blks) {
        if (!reduce) b.x += b.v * dt;
        if (b.x > w + 20) b.x = -b.w - Math.random() * 120;
        const y = b.lane * laneH + laneH / 2;
        const bh = clamp(laneH * 0.42, 5, 12);
        ctx.globalAlpha = b.a;
        box(ctx, b.x, y - bh / 2, b.w, bh, bh / 2, rgba(b.c, 0.9));
        ctx.globalAlpha = b.a * 0.5;
        const g = ctx.createLinearGradient(b.x - 28, 0, b.x, 0);
        g.addColorStop(0, rgba(b.c, 0));
        g.addColorStop(1, rgba(b.c, 0.35));
        ctx.fillStyle = g;
        ctx.fillRect(b.x - 28, y - bh / 2, 28, bh);
      }
      ctx.globalAlpha = 1;

      if (!reduce) {
        const sx = ((t * 70) % (w + 160)) - 80;
        const sg = ctx.createLinearGradient(sx - 24, 0, sx + 24, 0);
        sg.addColorStop(0, rgba(A1, 0));
        sg.addColorStop(0.5, rgba(A1, 0.12));
        sg.addColorStop(1, rgba(A1, 0));
        ctx.fillStyle = sg;
        ctx.fillRect(sx - 24, 0, 48, h);
      }
    },
    true,
  );
}

/** Navigating CE Studies — laptop terminal */
function initComputer(canvas: HTMLCanvasElement, wrap: HTMLElement) {
  const accents = readAccents(wrap);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  mount(
    canvas,
    (ctx, w, h, t) => {
      const layout = layoutForViewport(w, h, "card");
      renderComputer(ctx, w, h, t, accents, { reduce, ...layout });
    },
    true,
  );
}

const RENDERERS: Record<
  string,
  (canvas: HTMLCanvasElement, wrap: HTMLElement) => void
> = {
  "complex-animations": initDust,
  "multi-threading": initLanes,
  "navigating-ce-studies": initComputer,
};

function initTalkCardVisuals() {
  destroyTalkCardVisuals();
  document.querySelectorAll<HTMLElement>("[data-tcv]").forEach((wrap) => {
    const id = wrap.dataset.tcv;
    const canvas = wrap.querySelector<HTMLCanvasElement>("[data-tcv-canvas]");
    if (!id || !canvas) return;
    const render = RENDERERS[id];
    if (render) render(canvas, wrap);
  });
}

document.addEventListener("astro:page-load", initTalkCardVisuals);
document.addEventListener("astro:before-swap", destroyTalkCardVisuals);

if (document.readyState !== "loading") initTalkCardVisuals();
else document.addEventListener("DOMContentLoaded", initTalkCardVisuals);
