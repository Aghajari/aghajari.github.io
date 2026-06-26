import { highlightPresentationCode } from "../lib/syntax-highlight";
import { initPresentationRail } from "../lib/presentation-rail";

type Cleanup = () => void;
type RenderFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) => void;

const ROOT_SELECTOR = "[data-ca-root]";
const TAU = Math.PI * 2;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim().replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(full || "f0a6ca", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const rgba = (c: [number, number, number], a = 1) =>
  `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const mixRgb = (
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] => [
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
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const xf = x - x0;
    const yf = y - y0;
    const u = fade(xf);
    const v = fade(yf);
    const n00 = valAt(x0, y0);
    const n10 = valAt(x0 + 1, y0);
    const n01 = valAt(x0, y0 + 1);
    const n11 = valAt(x0 + 1, y0 + 1);
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
  };
}

const PATRICK_SRC = "/demos/patrick-graduation.png";
let patrickImg: HTMLImageElement | undefined;
let patrickLoad: Promise<HTMLImageElement> | undefined;

function loadPatrick(): Promise<HTMLImageElement> {
  if (patrickImg) return Promise.resolve(patrickImg);
  patrickLoad ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      patrickImg = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load ${PATRICK_SRC}`));
    img.src = PATRICK_SRC;
  });
  return patrickLoad;
}

function patrickFitStage(
  stageW: number,
  stageH: number,
  img: HTMLImageElement,
  pad = 0.08,
) {
  const aspect = img.naturalWidth / img.naturalHeight;
  const availW = stageW * (1 - 2 * pad);
  const availH = stageH * (1 - 2 * pad);
  let w = availW;
  let h = w / aspect;
  if (h > availH) {
    h = availH;
    w = h * aspect;
  }
  return { w, h };
}

function drawPatrickSized(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement,
) {
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
}

function drawPatrick(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  img: HTMLImageElement,
) {
  drawPatrickSized(ctx, w, h, img);
}

function drawPatrickAt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  img: HTMLImageElement,
) {
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function isSubjectPixel(_r: number, _g: number, _b: number, a: number) {
  return a > 32;
}

function analyzeSubject(data: Uint8ClampedArray, w: number, h: number) {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  let found = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!isSubjectPixel(data[i], data[i + 1], data[i + 2], data[i + 3]))
        continue;
      found = true;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (!found) return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1, w, h };
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

function destroyCA() {
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __caCleanups?: Cleanup[] })
    | null;
  if (root?.__caCleanups) {
    root.__caCleanups.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
    root.__caCleanups = [];
  }
}

function initCA() {
  destroyCA();
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __caCleanups?: Cleanup[] })
    | null;
  if (!root) return;

  const cleanups: Cleanup[] = [];
  root.__caCleanups = cleanups;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noise = makeNoise();

  const cs = getComputedStyle(root);
  const A1 = hexToRgb(cs.getPropertyValue("--ca-accent") || "#f0a6ca");
  const A2 = hexToRgb(cs.getPropertyValue("--ca-accent-2") || "#b388ff");
  const A3 = hexToRgb(cs.getPropertyValue("--ca-accent-3") || "#6d6af0");

  function fit(canvas: HTMLCanvasElement) {
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

  function mount(canvas: HTMLCanvasElement, render: RenderFn, animate = false) {
    let geom = fit(canvas);
    let raf = 0;
    let visible = false;
    const start = performance.now();

    const frame = (now: number) => {
      raf = 0;
      const t = (now - start) / 1000;
      render(geom.ctx, geom.w, geom.h, t);
      if (animate && visible && !reduce) raf = requestAnimationFrame(frame);
    };

    const request = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const ro = new ResizeObserver(() => {
      geom = fit(canvas);
      request();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (es) => {
        visible = es[0].isIntersecting;
        if (visible) request();
      },
      { rootMargin: "140px" },
    );
    io.observe(canvas);
    request();

    cleanups.push(() => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    });
    return { request };
  }

  const on = <K extends keyof HTMLElementEventMap>(
    el: EventTarget,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
    opts?: AddEventListenerOptions,
  ) => {
    el.addEventListener(type, fn as EventListener, opts);
    cleanups.push(() =>
      el.removeEventListener(type, fn as EventListener, opts),
    );
  };

  function grid(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    step = 26,
  ) {
    ctx.save();
    ctx.strokeStyle = rgba(A3, 0.1);
    ctx.lineWidth = 1;
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = step / 2; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function initHero(canvas: HTMLCanvasElement) {
    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
      depth: number;
      c: [number, number, number];
      phase: number;
    };
    let parts: P[] = [];
    let lastW = -1;
    let prevT: number | null = null;
    const pointer = { x: 0, y: 0, sx: 0, sy: 0, active: false };

    const hero = canvas.closest(".ca-hero");
    if (hero) {
      const syncPointer = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect();
        pointer.x = clientX - rect.left;
        pointer.y = clientY - rect.top;
        pointer.active = true;
      };
      on(hero, "pointermove", (e) => syncPointer(e.clientX, e.clientY), {
        passive: true,
      });
      on(hero, "pointerleave", () => {
        pointer.active = false;
      });
    }

    const seed = (w: number, h: number) => {
      const count = Math.round(clamp((w * h) / 6500, 90, 260));
      parts = Array.from({ length: count }, () => {
        const depth = Math.random();
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          r: 0.45 + depth * 2.4,
          depth,
          c: mixRgb(mixRgb(A1, A2, Math.random() * 0.45), A3, depth * 0.55),
          phase: Math.random() * TAU,
        };
      });
    };

    mount(
      canvas,
      (ctx, w, h, t) => {
        const dt = prevT === null ? 1 / 60 : clamp(t - prevT, 1 / 120, 1 / 20);
        prevT = t;
        if (lastW !== w) {
          seed(w, h);
          lastW = w;
          prevT = t;
        }

        const ptrBlend = clamp(dt * (pointer.active ? 10 : 4), 0, 1);
        pointer.sx = lerp(pointer.sx, pointer.x, ptrBlend);
        pointer.sy = lerp(pointer.sy, pointer.y, ptrBlend);

        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";

        for (const p of parts) {
          const nx = p.x * 0.0011;
          const ny = p.y * 0.0011;
          const n1 = noise(nx, ny + t * 0.07);
          const n2 = noise(nx * 2.1 + 31, ny * 2.1 - t * 0.045);
          const ang = (n1 * 0.65 + n2 * 0.35) * TAU * 2;
          const speed = (10 + p.depth * 22) * (0.4 + n2 * 0.6);
          let targetVx = Math.cos(ang) * speed;
          let targetVy = Math.sin(ang) * speed - (5 + p.depth * 5);

          if (pointer.active && !reduce) {
            const dx = p.x - pointer.sx;
            const dy = p.y - pointer.sy;
            const distSq = dx * dx + dy * dy;
            const radius = 110 + p.depth * 90;
            if (distSq < radius * radius && distSq > 4) {
              const dist = Math.sqrt(distSq);
              const falloff = (1 - dist / radius) ** 2;
              const push = falloff * (95 + p.depth * 55);
              targetVx += (dx / dist) * push;
              targetVy += (dy / dist) * push;
              targetVx += (-dy / dist) * push * 0.28;
              targetVy += (dx / dist) * push * 0.28;
            }
          }

          const steer = clamp(dt * (2.2 + p.depth * 2.5), 0, 1);
          p.vx = lerp(p.vx, targetVx, steer);
          p.vy = lerp(p.vy, targetVy, steer);

          if (!reduce) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
          }

          const margin = 16;
          if (p.x < -margin) p.x = w + margin;
          else if (p.x > w + margin) p.x = -margin;
          if (p.y < -margin) p.y = h + margin;
          else if (p.y > h + margin) p.y = -margin;

          const tw =
            0.35 +
            0.65 * (0.5 + 0.5 * Math.sin(t * (0.7 + p.depth * 0.9) + p.phase));
          const alpha = (0.12 + p.depth * 0.5) * tw;

          if (p.r > 1.35) {
            const glowR = p.r * 3.2;
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
            glow.addColorStop(0, rgba(p.c, alpha * 0.5));
            glow.addColorStop(1, rgba(p.c, 0));
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, TAU);
            ctx.fill();
          }

          ctx.beginPath();
          ctx.fillStyle = rgba(p.c, alpha);
          ctx.arc(p.x, p.y, p.r, 0, TAU);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      },
      true,
    );
  }

  function initTransform(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const ctlEls = Array.from(
      fig.querySelectorAll<HTMLInputElement>("input[data-ctl]"),
    );
    const defaults: Record<string, number> = {
      tx: 0,
      ty: 0,
      scale: 100,
      rotate: 0,
      skew: 0,
      alpha: 100,
    };
    const val = (k: string) =>
      Number(
        fig.querySelector<HTMLInputElement>(`input[data-ctl="${k}"]`)?.value ??
          defaults[k],
      );

    const subjectSize = (w: number, h: number) =>
      patrickImg
        ? patrickFitStage(w, h, patrickImg, 0.08)
        : { w: Math.min(w, h) * 0.5, h: Math.min(w, h) * 0.5 };

    const drawSubject = (
      ctx: CanvasRenderingContext2D,
      pw: number,
      ph: number,
    ) => {
      if (patrickImg) drawPatrick(ctx, pw, ph, patrickImg);
    };

    const { request } = mount(canvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h);
      const { w: pw, h: ph } = subjectSize(w, h);
      const cx = w / 2;
      const cy = h / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = 0.12;
      drawSubject(ctx, pw, ph);
      ctx.restore();

      ctx.save();
      ctx.translate(cx + val("tx"), cy + val("ty"));
      ctx.rotate((val("rotate") * Math.PI) / 180);
      ctx.transform(1, 0, Math.tan((val("skew") * Math.PI) / 180), 1, 0, 0);
      ctx.scale(val("scale") / 100, val("scale") / 100);
      ctx.globalAlpha = val("alpha") / 100;
      drawSubject(ctx, pw, ph);
      ctx.restore();
    });

    loadPatrick()
      .then(() => request())
      .catch(() => {});

    ctlEls.forEach((el) => on(el, "input", request));
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    );
    if (resetBtn)
      on(resetBtn, "click", () => {
        ctlEls.forEach((el) => {
          el.value = String(defaults[el.dataset.ctl ?? ""]);
        });
        request();
      });
  }

  function initMatrix(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    const matrixEl = fig.querySelector<HTMLElement>("[data-matrix]");
    const eqEl = fig.querySelector<HTMLElement>("[data-matrix-eq]");
    const tabs = Array.from(
      fig.querySelectorAll<HTMLButtonElement>("[data-matrix-tabs] .ca-chip"),
    );
    if (!canvas) return;

    let kind = "translate";
    const pt = { x: 2, y: -1 };

    const matrixFor = (k: string): number[][] => {
      switch (k) {
        case "scale":
          return [
            [1.8, 0, 0],
            [0, 1.4, 0],
            [0, 0, 1],
          ];
        case "rotate": {
          const a = (35 * Math.PI) / 180;
          return [
            [Math.cos(a), -Math.sin(a), 0],
            [Math.sin(a), Math.cos(a), 0],
            [0, 0, 1],
          ];
        }
        case "skew":
          return [
            [1, Math.tan((22 * Math.PI) / 180), 0],
            [0, 1, 0],
            [0, 0, 1],
          ];
        default:
          return [
            [1, 0, 2],
            [0, 1, -1.5],
            [0, 0, 1],
          ];
      }
    };

    const apply = (m: number[][], x: number, y: number) => ({
      x: m[0][0] * x + m[0][1] * y + m[0][2],
      y: m[1][0] * x + m[1][1] * y + m[1][2],
    });

    let unit = 28;
    const { request } = mount(canvas, (ctx, w, h) => {
      unit = clamp(Math.min(w, h) / 9, 18, 40);
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = rgba(A3, 0.12);
      ctx.lineWidth = 1;
      for (let gx = cx % unit; gx < w; gx += unit) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = cy % unit; gy < h; gy += unit) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      ctx.strokeStyle = rgba(A3, 0.4);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();

      const m = matrixFor(kind);
      const tp = apply(m, pt.x, pt.y);
      const toScreen = (gx: number, gy: number) => ({
        x: cx + gx * unit,
        y: cy - gy * unit,
      });
      const sp = toScreen(pt.x, pt.y);
      const stp = toScreen(tp.x, tp.y);

      ctx.strokeStyle = rgba(A1, 0.55);
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y);
      ctx.lineTo(stp.x, stp.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = rgba(A3);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 7, 0, TAU);
      ctx.stroke();

      ctx.fillStyle = rgba(A1);
      ctx.beginPath();
      ctx.arc(stp.x, stp.y, 7, 0, TAU);
      ctx.fill();

      ctx.fillStyle = rgba(A3, 0.9);
      ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(
        `(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`,
        sp.x + 10,
        sp.y - 8,
      );
      ctx.fillStyle = rgba(A1);
      ctx.fillText(
        `(${tp.x.toFixed(1)}, ${tp.y.toFixed(1)})`,
        stp.x + 10,
        stp.y - 8,
      );

      if (matrixEl) {
        matrixEl.innerHTML = m
          .flat()
          .map((n) => `<span>${(+n.toFixed(2)).toString()}</span>`)
          .join("");
      }
      if (eqEl)
        eqEl.textContent = "M · [x, y, 1]ᵀ = [x′, y′, 1]ᵀ — drag the point.";
    });

    let dragging = false;
    const setFromEvent = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      pt.x = clamp((e.clientX - rect.left - cx) / unit, -5, 5);
      pt.y = clamp((cy - (e.clientY - rect.top)) / unit, -5, 5);
      request();
    };

    on(canvas, "pointerdown", (e) => {
      dragging = true;
      canvas.setPointerCapture((e as PointerEvent).pointerId);
      setFromEvent(e as PointerEvent);
    });
    on(canvas, "pointermove", (e) => {
      if (dragging) setFromEvent(e as PointerEvent);
    });
    on(canvas, "pointerup", () => {
      dragging = false;
    });
    canvas.style.cursor = "grab";

    tabs.forEach((tab) =>
      on(tab, "click", () => {
        kind = tab.dataset.kind ?? "translate";
        tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
        request();
      }),
    );
  }

  function initOrder(fig: HTMLElement) {
    const cTs = fig.querySelector<HTMLCanvasElement>('[data-canvas="ts"]');
    const cSt = fig.querySelector<HTMLCanvasElement>('[data-canvas="st"]');
    const outTs = fig.querySelector<HTMLElement>('[data-out="ts"]');
    const outSt = fig.querySelector<HTMLElement>('[data-out="st"]');
    if (!cTs || !cSt) return;

    const P0 = { x: 10, y: 20 };
    const T = { x: 100, y: 50 };
    const S = { x: 3, y: 2 };
    const endTS = { x: P0.x * S.x + T.x, y: P0.y * S.y + T.y };
    const endST = { x: (P0.x + T.x) * S.x, y: (P0.y + T.y) * S.y };
    if (outTs) outTs.textContent = `(10, 20) → (${endTS.x}, ${endTS.y})`;
    if (outSt) outSt.textContent = `(10, 20) → (${endST.x}, ${endST.y})`;

    const worldW = 380;
    const worldH = 170;
    const render =
      (
        canvas: HTMLCanvasElement,
        end: { x: number; y: number },
        col: [number, number, number],
      ) =>
      (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
        const pad = 22;
        const sx = (w - pad * 2) / worldW;
        const sy = (h - pad * 2) / worldH;
        const toS = (x: number, y: number) => ({
          x: pad + x * sx,
          y: h - pad - y * sy,
        });
        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = rgba(A3, 0.18);
        ctx.lineWidth = 1;
        const o = toS(0, 0);
        ctx.beginPath();
        ctx.moveTo(pad, o.y);
        ctx.lineTo(w - pad, o.y);
        ctx.moveTo(o.x, pad);
        ctx.lineTo(o.x, h - pad);
        ctx.stroke();

        const f = Math.sin(t * 0.9) * 0.5 + 0.5;
        const cur = { x: lerp(P0.x, end.x, f), y: lerp(P0.y, end.y, f) };
        const s0 = toS(P0.x, P0.y);
        const sc = toS(cur.x, cur.y);
        const se = toS(end.x, end.y);

        ctx.strokeStyle = rgba(col, 0.4);
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s0.x, s0.y);
        ctx.lineTo(se.x, se.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = rgba(A3, 0.7);
        ctx.beginPath();
        ctx.arc(s0.x, s0.y, 4, 0, TAU);
        ctx.fill();

        ctx.strokeStyle = rgba(col, 0.5);
        ctx.beginPath();
        ctx.arc(se.x, se.y, 6, 0, TAU);
        ctx.stroke();

        ctx.fillStyle = rgba(col);
        ctx.beginPath();
        ctx.arc(sc.x, sc.y, 6, 0, TAU);
        ctx.fill();
      };

    mount(cTs, render(cTs, endTS, A1), true);
    mount(cSt, render(cSt, endST, A2), true);
  }

  function initInterpolators(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const legendItems = Array.from(
      fig.querySelectorAll<HTMLElement>("[data-legend] li"),
    );

    const easings: Record<string, (t: number) => number> = {
      linear: (t) => t,
      easeIn: (t) => t * t,
      easeInOut: (t) => (1 - Math.cos(t * Math.PI)) / 2,
      overshoot: (t) => {
        const s = 1.70158;
        const u = t - 1;
        return 1 + (s + 1) * u * u * u + s * u * u;
      },
    };
    const colors: Record<string, [number, number, number]> = {
      linear: A3,
      easeIn: A2,
      easeInOut: A1,
      overshoot: hexToRgb("#ffd27d"),
    };
    const order = ["linear", "easeIn", "easeInOut", "overshoot"];
    const active = new Set(order);

    legendItems.forEach((li) => {
      const k = li.dataset.curve ?? "";
      const sw = li.querySelector<HTMLElement>(".ca-legend__sw");
      if (sw) sw.style.setProperty("--curve-color", rgba(colors[k] ?? A1));
    });

    const { request } = mount(
      canvas,
      (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const pad = 26;
        const plotH = h * 0.6;
        const gx0 = pad;
        const gx1 = w - pad;
        const gy0 = pad;
        const gy1 = plotH - pad / 2;
        const plotW = gx1 - gx0;
        const yFor = (v: number) =>
          lerp(gy1, gy0, clamp((v + 0.18) / 1.36, 0, 1));

        ctx.strokeStyle = rgba(A3, 0.18);
        ctx.lineWidth = 1;
        ctx.strokeRect(gx0, gy0, plotW, gy1 - gy0);
        ctx.fillStyle = rgba(A3, 0.5);
        ctx.font = "10px ui-monospace, monospace";
        ctx.fillText("0", gx0, gy1 + 12);
        ctx.fillText("t", gx1 - 6, gy1 + 12);
        ctx.fillText("f(t)", gx0 - 2, gy0 - 8);

        const cycle = 2.6;
        const phase = (t % cycle) / cycle;

        for (const k of order) {
          const dim = !active.has(k);
          ctx.strokeStyle = rgba(colors[k], dim ? 0.12 : 0.95);
          ctx.lineWidth = dim ? 1 : 2;
          ctx.beginPath();
          for (let i = 0; i <= 60; i++) {
            const tt = i / 60;
            const x = gx0 + tt * plotW;
            const y = yFor(easings[k](tt));
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
          if (!dim) {
            const x = gx0 + phase * plotW;
            const y = yFor(easings[k](phase));
            ctx.fillStyle = rgba(colors[k]);
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, TAU);
            ctx.fill();
          }
        }

        ctx.strokeStyle = rgba(A1, 0.3);
        ctx.lineWidth = 1;
        const px = gx0 + phase * plotW;
        ctx.beginPath();
        ctx.moveTo(px, gy0);
        ctx.lineTo(px, gy1);
        ctx.stroke();

        const tracks = order.filter((k) => active.has(k));
        const ty0 = plotH + 8;
        const trackGap = (h - ty0 - 8) / Math.max(tracks.length, 1);
        tracks.forEach((k, idx) => {
          const ty = ty0 + trackGap * (idx + 0.5);
          ctx.strokeStyle = rgba(A3, 0.18);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(gx0, ty);
          ctx.lineTo(gx1, ty);
          ctx.stroke();
          const dotX = gx0 + clamp(easings[k](phase), 0, 1.2) * plotW;
          ctx.fillStyle = rgba(colors[k]);
          ctx.beginPath();
          ctx.arc(dotX, ty, 5, 0, TAU);
          ctx.fill();
        });
      },
      true,
    );

    legendItems.forEach((li) =>
      on(li, "click", () => {
        const k = li.dataset.curve ?? "";
        const onlyThis = active.size === 1 && active.has(k);
        active.clear();
        if (onlyThis) order.forEach((o) => active.add(o));
        else active.add(k);
        legendItems.forEach((x) =>
          x.classList.toggle("is-dim", !active.has(x.dataset.curve ?? "")),
        );
        request();
      }),
    );
  }

  function initNoise(fig: HTMLElement) {
    const cRand = fig.querySelector<HTMLCanvasElement>(
      '[data-canvas="random"]',
    );
    const cPerlin = fig.querySelector<HTMLCanvasElement>(
      '[data-canvas="perlin"]',
    );
    if (cRand) {
      mount(
        cRand,
        (ctx, w, h) => {
          const cell = 12;
          for (let y = 0; y < h; y += cell)
            for (let x = 0; x < w; x += cell) {
              const v = Math.random();
              ctx.fillStyle = rgba(mixRgb([10, 8, 16], A2, v), 1);
              ctx.fillRect(x, y, cell + 1, cell + 1);
            }
        },
        true,
      );
    }
    if (cPerlin) {
      mount(
        cPerlin,
        (ctx, w, h, t) => {
          const cell = 12;
          for (let y = 0; y < h; y += cell)
            for (let x = 0; x < w; x += cell) {
              const v = noise(x * 0.02 + t * 0.4, y * 0.02);
              ctx.fillStyle = rgba(mixRgb([10, 8, 16], A1, v), 1);
              ctx.fillRect(x, y, cell + 1, cell + 1);
            }
        },
        true,
      );
    }
  }

  function initParticles(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const hint = fig.querySelector<HTMLButtonElement>(".ca-particle-hint");
    const hintText = fig.querySelector<HTMLElement>(
      "[data-particle-hint-text]",
    );
    const organicEl = fig.querySelector<HTMLInputElement>(
      'input[data-ctl="organic"]',
    );
    const stepEl = fig.querySelector<HTMLInputElement>(
      'input[data-ctl="step"]',
    );
    const countEl = fig.querySelector<HTMLElement>("[data-particle-count]");
    const playBtns = Array.from(
      fig.querySelectorAll<HTMLElement>('[data-action="play"]'),
    );
    const resetBtn = fig.querySelector<HTMLElement>('[data-action="reset"]');

    type Part = {
      ix: number;
      iy: number;
      x: number;
      y: number;
      r: number;
      ir: number;
      col: string;
      a: number;
      ia: number;
      life: number;
      vel: number;
      tx: number;
      ty: number;
      time: number;
      seed: number;
      dir: number;
    };

    let W = 0;
    let H = 0;
    let dpr = 1;
    let srcW = 0;
    let srcH = 0;
    let srcOx = 0;
    let srcOy = 0;
    let subjectW = 0;
    let subjectH = 0;
    let source: ImageData | null = null;
    let parts: Part[] = [];
    let state: "idle" | "run" | "done" = "idle";
    let cx = 0;
    let cy = 0;
    let raf = 0;
    let last = 0;
    let visible = false;
    const ctx = canvas.getContext("2d")!;

    const setHintLabel = (label: string) => {
      if (hintText) hintText.textContent = label;
      if (hint) hint.setAttribute("aria-label", label);
    };

    const refit = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(rect.width));
      H = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const buildSource = () => {
      if (!patrickImg) {
        source = null;
        srcW = srcH = srcOx = srcOy = subjectW = subjectH = 0;
        return;
      }
      const { w: dw, h: dh } = patrickFitStage(W, H, patrickImg, 0.08);
      srcW = Math.max(1, Math.round(dw));
      srcH = Math.max(1, Math.round(dh));
      srcOx = (W - srcW) / 2;
      srcOy = (H - srcH) / 2;

      const off = document.createElement("canvas");
      off.width = srcW;
      off.height = srcH;
      const o = off.getContext("2d")!;
      o.clearRect(0, 0, srcW, srcH);
      o.drawImage(patrickImg, 0, 0, srcW, srcH);
      source = o.getImageData(0, 0, srcW, srcH);

      const subject = analyzeSubject(source.data, srcW, srcH);
      subjectW = subject.w;
      subjectH = subject.h;
    };

    const drawSource = () => {
      ctx.clearRect(0, 0, W, H);
      if (!source) return;
      const off = document.createElement("canvas");
      off.width = srcW;
      off.height = srcH;
      off.getContext("2d")!.putImageData(source, 0, 0);
      ctx.drawImage(off, srcOx, srcOy, srcW, srcH);
    };

    const stepVal = () => clamp(Math.round(Number(stepEl?.value ?? 6)), 2, 16);

    const updateCount = (n: number, step: number, organic: boolean) => {
      if (countEl) {
        countEl.textContent = `${n.toLocaleString()} particles at step ${step}px · ${organic ? "organic" : "uniform"}`;
      }
    };

    const build = () => {
      if (!source) return 0;
      const organic = organicEl?.checked ?? true;
      const step = stepVal();
      const data = source.data;
      const subject = analyzeSubject(data, srcW, srcH);
      subjectW = subject.w;
      subjectH = subject.h;
      cx = srcOx + (subject.minX + subject.maxX) / 2;
      cy = srcOy + (subject.minY + subject.maxY) / 2;

      const S = Math.min(subjectW, subjectH) / 360;
      const rnd = (a: number, b: number) => a + Math.random() * (b - a);
      parts = [];
      for (let y = 0; y < srcH; y += step)
        for (let x = 0; x < srcW; x += step) {
          const i = (y * srcW + x) * 4;
          const al = data[i + 3];
          if (!isSubjectPixel(data[i], data[i + 1], data[i + 2], al)) continue;
          const px = srcOx + x;
          const py = srcOy + y;
          const col = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
          parts.push({
            ix: px,
            iy: py,
            x: px,
            y: py,
            ir: organic
              ? (step * 0.62) / (1 + Math.floor(Math.random() * 3))
              : step * 0.55,
            r: step * 0.55,
            col,
            ia: al / 255,
            a: al / 255,
            life: organic ? rnd(1.2, 2.0) : 1.7,
            vel: (organic ? rnd(15, 35) : 25) * Math.sqrt(S),
            tx: (organic ? rnd(250, 450) : 250) * S,
            ty: (organic ? rnd(150, 350) : 200) * S,
            time: 0,
            seed: Math.random() * 1000,
            dir: [-1, 1, 1, 1][Math.floor(Math.random() * 4)],
          });
        }
      updateCount(parts.length, step, organic);
      return parts.length;
    };

    const stepFrame = (dt: number) => {
      const organic = organicEl?.checked ?? true;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      const S = Math.min(subjectW, subjectH) / 360;
      for (const p of parts) {
        p.time += dt;
        const f = p.time / p.life;
        const alpha = p.ia * Math.min(1.2 - f, 1);
        if (f >= 1.2 || alpha <= 0.01) continue;
        alive++;
        p.x = p.ix + ((p.ix - cx) / (cx || 1)) * p.tx * f;
        p.y = p.iy + ((p.iy - cy) / (cy || 1)) * p.ty * f;
        p.y -= Math.pow(f * p.vel, 2) * 0.012;
        if (organic) {
          const n = noise(p.seed, f * 4) - 0.5;
          p.x += n * 8 * S * p.dir;
          p.y -= Math.abs(n) * 6 * S;
        }
        p.r = Math.max(0.5, p.ir * (1 - f));
        p.a = alpha;
        ctx.globalAlpha = clamp(p.a, 0, 1);
        ctx.fillStyle = p.col;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive === 0) {
        state = "done";
        setHintLabel("Tap to reset");
        if (hint) hint.classList.remove("is-hidden");
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (state !== "run") return;
      let dt = (now - last) / 1000;
      last = now;
      dt = clamp(dt, 1 / 60, 4 / 60);
      stepFrame(dt);
      if (state === "run" && visible) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (state !== "idle") return;
      buildSource();
      build();
      state = "run";
      last = performance.now();
      if (hint) hint.classList.add("is-hidden");
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const reset = () => {
      state = "idle";
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      buildSource();
      drawSource();
      setHintLabel("Tap to disintegrate");
      if (hint) hint.classList.remove("is-hidden");
      build();
    };

    refit();
    loadPatrick()
      .then(() => {
        buildSource();
        drawSource();
        build();
      })
      .catch(() => {});

    const ro = new ResizeObserver(() => {
      refit();
      if (state === "idle") {
        buildSource();
        drawSource();
        build();
      }
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (es) => {
        visible = es[0].isIntersecting;
        if (visible && state === "run" && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      },
      { rootMargin: "140px" },
    );
    io.observe(canvas);

    playBtns.forEach((b) => on(b, "click", start));
    if (hint)
      on(hint, "click", () => {
        if (state === "done") reset();
        else if (state === "idle") start();
      });
    if (resetBtn) on(resetBtn, "click", reset);
    const syncBuild = () => {
      if ((state === "idle" || state === "run") && source) build();
    };
    if (organicEl) on(organicEl, "change", syncBuild);
    if (stepEl) on(stepEl, "input", syncBuild);

    cleanups.push(() => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    });
  }

  function initPointSprite(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const sizeEl = fig.querySelector<HTMLInputElement>(
      'input[data-ctl="size"]',
    );
    const gridEl = fig.querySelector<HTMLInputElement>(
      'input[data-ctl="grid"]',
    );
    const discardEl = fig.querySelector<HTMLElement>("[data-discard]");

    const { request } = mount(canvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const frac = Number(sizeEl?.value ?? 80) / 100;
      const side = Math.min(w, h) * frac;
      const ox = (w - side) / 2;
      const oy = (h - side) / 2;
      const showGrid = gridEl?.checked ?? true;

      const cells = 40;
      const cs = side / cells;
      for (let j = 0; j < cells; j++)
        for (let i = 0; i < cells; i++) {
          const u = (i + 0.5) / cells;
          const v = (j + 0.5) / cells;
          const x = 2 * u - 1;
          const y = 2 * v - 1;
          const inside = x * x + y * y <= 1;
          ctx.fillStyle = inside
            ? rgba(mixRgb(A2, A1, (x + 1) / 2), 0.92)
            : rgba([60, 20, 38], 0.32);
          ctx.fillRect(ox + i * cs, oy + j * cs, cs + 0.6, cs + 0.6);
        }

      ctx.strokeStyle = rgba(A3, 0.5);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, oy, side, side);

      ctx.strokeStyle = rgba(A1, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox + side / 2, oy + side / 2, side / 2, 0, TAU);
      ctx.stroke();

      if (showGrid) {
        ctx.fillStyle = rgba(A3, 0.8);
        ctx.font = "11px ui-monospace, monospace";
        ctx.fillText("gl_PointCoord (0,0)", ox + 4, oy - 6);
        ctx.fillText("(1,1)", ox + side - 28, oy + side + 14);
        ctx.fillText("(0,0)→(-1,-1)   (1,1)→(1,1)", ox, oy + side + 30);
      }
      if (discardEl)
        discardEl.textContent =
          "Corners discarded ≈ 21.5% of the sprite — that's the whole circle.";
    });

    if (sizeEl) on(sizeEl, "input", request);
    if (gridEl) on(gridEl, "change", request);
  }

  function initYouTube(el: HTMLElement) {
    const btn = el.querySelector<HTMLButtonElement>("[data-yt-play]");
    const id = el.dataset.videoId;
    if (!btn || !id) return;
    on(btn, "click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = "Complex Animations — full talk";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      el.innerHTML = "";
      el.appendChild(iframe);
    });
  }

  function initRail() {
    initPresentationRail(root, (fn) => cleanups.push(fn));
  }

  const heroCanvas =
    root.querySelector<HTMLCanvasElement>('[data-demo="hero"]');
  if (heroCanvas) initHero(heroCanvas);

  root
    .querySelectorAll<HTMLElement>('[data-demo="transform"]')
    .forEach(initTransform);
  root
    .querySelectorAll<HTMLElement>('[data-demo="matrix"]')
    .forEach(initMatrix);
  root.querySelectorAll<HTMLElement>('[data-demo="order"]').forEach(initOrder);
  root
    .querySelectorAll<HTMLElement>('[data-demo="interpolators"]')
    .forEach(initInterpolators);
  root.querySelectorAll<HTMLElement>('[data-demo="noise"]').forEach(initNoise);
  root
    .querySelectorAll<HTMLElement>('[data-demo="particles"]')
    .forEach(initParticles);
  root
    .querySelectorAll<HTMLElement>('[data-demo="pointsprite"]')
    .forEach(initPointSprite);
  root
    .querySelectorAll<HTMLElement>('[data-demo="youtube"]')
    .forEach(initYouTube);
  initRail();
  highlightPresentationCode(root);
}

document.addEventListener("astro:page-load", initCA);
document.addEventListener("astro:before-swap", destroyCA);

if (document.readyState !== "loading") initCA();
else document.addEventListener("DOMContentLoaded", initCA);
