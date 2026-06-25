/* ============================================================
   Complex Animations — interactive teaching demos
   All vanilla Canvas 2D, dependency-free, DPR-aware.
   Demos pause off-screen and respect prefers-reduced-motion.
   ============================================================ */

type Cleanup = () => void;
type RenderFn = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

const ROOT_SELECTOR = "[data-ca-root]";
const TAU = Math.PI * 2;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim().replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const n = parseInt(full || "f0a6ca", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];

/** Smooth value noise in [0,1]. */
function makeNoise() {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = p[i]; p[i] = p[j]; p[j] = tmp;
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const valAt = (ix: number, iy: number) => p[(ix + p[iy & 255]) & 255] / 255;
  return (x: number, y: number) => {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const xf = x - x0, yf = y - y0;
    const u = fade(xf), v = fade(yf);
    const n00 = valAt(x0, y0), n10 = valAt(x0 + 1, y0);
    const n01 = valAt(x0, y0 + 1), n11 = valAt(x0 + 1, y0 + 1);
    return lerp(lerp(n00, n10, u), lerp(n01, n11, u), v);
  };
}

/* ---------------- lifecycle ---------------- */

function destroyCA() {
  const root = document.querySelector(ROOT_SELECTOR) as (HTMLElement & { __caCleanups?: Cleanup[] }) | null;
  if (root?.__caCleanups) {
    root.__caCleanups.forEach((fn) => {
      try { fn(); } catch { /* noop */ }
    });
    root.__caCleanups = [];
  }
}

function initCA() {
  destroyCA();
  const root = document.querySelector(ROOT_SELECTOR) as (HTMLElement & { __caCleanups?: Cleanup[] }) | null;
  if (!root) return;

  const cleanups: Cleanup[] = [];
  root.__caCleanups = cleanups;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const noise = makeNoise();

  const cs = getComputedStyle(root);
  const A1 = hexToRgb(cs.getPropertyValue("--ca-accent") || "#f0a6ca");
  const A2 = hexToRgb(cs.getPropertyValue("--ca-accent-2") || "#b388ff");
  const A3 = hexToRgb(cs.getPropertyValue("--ca-accent-3") || "#6d6af0");

  /** Fit a canvas to its CSS box at device pixel ratio. */
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

  /**
   * Mount a render loop on a canvas. Animated loops run only while visible.
   * Returns a `request()` to schedule a single frame (for interactive demos).
   */
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
    const request = () => { if (!raf) raf = requestAnimationFrame(frame); };

    const ro = new ResizeObserver(() => { geom = fit(canvas); request(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      (es) => { visible = es[0].isIntersecting; if (visible) request(); },
      { rootMargin: "140px" }
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
    opts?: AddEventListenerOptions
  ) => {
    el.addEventListener(type, fn as EventListener, opts);
    cleanups.push(() => el.removeEventListener(type, fn as EventListener, opts));
  };

  /* faint reference grid used by several demos */
  function grid(ctx: CanvasRenderingContext2D, w: number, h: number, step = 26) {
    ctx.save();
    ctx.strokeStyle = rgba(A3, 0.1);
    ctx.lineWidth = 1;
    for (let x = step / 2; x < w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = step / 2; y < h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* ============================================================
     1. HERO — drifting dust field
     ============================================================ */
  function initHero(canvas: HTMLCanvasElement) {
    type P = { x: number; y: number; r: number; s: number; c: [number, number, number] };
    let parts: P[] = [];
    let lastW = -1;

    const seed = (w: number, h: number) => {
      const count = Math.round(clamp((w * h) / 9000, 60, 190));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.5 + Math.random() * 2,
        s: 0.3 + Math.random() * 0.9,
        c: mixRgb(A1, A3, Math.random()),
      }));
    };

    mount(canvas, (ctx, w, h, t) => {
      if (lastW !== w) { seed(w, h); lastW = w; }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of parts) {
        const ang = noise(p.x * 0.0016, p.y * 0.0016 + t * 0.04) * TAU * 2;
        p.x += Math.cos(ang) * p.s;
        p.y += Math.sin(ang) * p.s - 0.15; // gentle upward drift, like dust
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * p.s * 1.5 + p.x));
        ctx.beginPath();
        ctx.fillStyle = rgba(p.c, 0.5 * tw);
        ctx.arc(p.x, p.y, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    }, true);
  }

  /* ============================================================
     2. TRANSFORM playground
     ============================================================ */
  function initTransform(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const ctlEls = Array.from(fig.querySelectorAll<HTMLInputElement>("input[data-ctl]"));
    const defaults: Record<string, number> = { tx: 0, ty: 0, scale: 100, rotate: 0, skew: 0, alpha: 100 };
    const val = (k: string) => Number(fig.querySelector<HTMLInputElement>(`input[data-ctl="${k}"]`)?.value ?? defaults[k]);

    const drawFace = (ctx: CanvasRenderingContext2D, size: number) => {
      const r = size / 2;
      const grd = ctx.createLinearGradient(-r, -r, r, r);
      grd.addColorStop(0, rgba(A2)); grd.addColorStop(1, rgba(A1));
      ctx.fillStyle = grd;
      const rad = size * 0.22;
      ctx.beginPath();
      ctx.roundRect(-r, -r, size, size, rad);
      ctx.fill();
      // eyes
      ctx.fillStyle = "#fff";
      const ey = -size * 0.1, ex = size * 0.2, er = size * 0.12;
      ctx.beginPath(); ctx.arc(-ex, ey, er, 0, TAU); ctx.arc(ex, ey, er, 0, TAU); ctx.fill();
      ctx.fillStyle = "#15080f";
      ctx.beginPath(); ctx.arc(-ex, ey, er * 0.45, 0, TAU); ctx.arc(ex, ey, er * 0.45, 0, TAU); ctx.fill();
      // smile
      ctx.strokeStyle = "#15080f"; ctx.lineWidth = size * 0.05; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(0, size * 0.08, size * 0.24, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    };

    const { request } = mount(canvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      grid(ctx, w, h);
      const base = Math.min(w, h) * 0.32;
      const cx = w / 2, cy = h / 2;

      // ghost reference
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = 0.12;
      drawFace(ctx, base);
      ctx.restore();

      // transformed
      ctx.save();
      ctx.translate(cx + val("tx"), cy + val("ty"));
      ctx.rotate((val("rotate") * Math.PI) / 180);
      ctx.transform(1, 0, Math.tan((val("skew") * Math.PI) / 180), 1, 0, 0);
      ctx.scale(val("scale") / 100, val("scale") / 100);
      ctx.globalAlpha = val("alpha") / 100;
      drawFace(ctx, base);
      ctx.restore();
    });

    ctlEls.forEach((el) => on(el, "input", request));
    const resetBtn = fig.querySelector<HTMLButtonElement>('[data-action="reset"]');
    if (resetBtn) on(resetBtn, "click", () => {
      ctlEls.forEach((el) => { el.value = String(defaults[el.dataset.ctl ?? ""]); });
      request();
    });
  }

  /* ============================================================
     3. MATRIX · point
     ============================================================ */
  function initMatrix(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    const matrixEl = fig.querySelector<HTMLElement>("[data-matrix]");
    const eqEl = fig.querySelector<HTMLElement>("[data-matrix-eq]");
    const tabs = Array.from(fig.querySelectorAll<HTMLButtonElement>("[data-matrix-tabs] .ca-chip"));
    if (!canvas) return;

    let kind = "translate";
    // point in "grid units"
    const pt = { x: 2, y: -1 };

    const matrixFor = (k: string): number[][] => {
      switch (k) {
        case "scale": return [[1.8, 0, 0], [0, 1.4, 0], [0, 0, 1]];
        case "rotate": {
          const a = (35 * Math.PI) / 180;
          return [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
        }
        case "skew": return [[1, Math.tan((22 * Math.PI) / 180), 0], [0, 1, 0], [0, 0, 1]];
        default: return [[1, 0, 2], [0, 1, -1.5], [0, 0, 1]]; // translate
      }
    };

    const apply = (m: number[][], x: number, y: number) => ({
      x: m[0][0] * x + m[0][1] * y + m[0][2],
      y: m[1][0] * x + m[1][1] * y + m[1][2],
    });

    let unit = 28;
    const { request } = mount(canvas, (ctx, w, h) => {
      unit = clamp(Math.min(w, h) / 9, 18, 40);
      const cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      // axes
      ctx.strokeStyle = rgba(A3, 0.12); ctx.lineWidth = 1;
      for (let gx = cx % unit; gx < w; gx += unit) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (let gy = cy % unit; gy < h; gy += unit) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
      ctx.strokeStyle = rgba(A3, 0.4);
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

      const m = matrixFor(kind);
      const tp = apply(m, pt.x, pt.y);
      const toScreen = (gx: number, gy: number) => ({ x: cx + gx * unit, y: cy - gy * unit });
      const sp = toScreen(pt.x, pt.y);
      const stp = toScreen(tp.x, tp.y);

      // arrow original -> transformed
      ctx.strokeStyle = rgba(A1, 0.55); ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(stp.x, stp.y); ctx.stroke();
      ctx.setLineDash([]);

      // original point (hollow)
      ctx.strokeStyle = rgba(A3); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 7, 0, TAU); ctx.stroke();
      // transformed point (filled, glowing)
      ctx.fillStyle = rgba(A1);
      ctx.beginPath(); ctx.arc(stp.x, stp.y, 7, 0, TAU); ctx.fill();

      // labels
      ctx.fillStyle = rgba(A3, 0.9); ctx.font = "11px ui-monospace, monospace";
      ctx.fillText(`(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)})`, sp.x + 10, sp.y - 8);
      ctx.fillStyle = rgba(A1);
      ctx.fillText(`(${tp.x.toFixed(1)}, ${tp.y.toFixed(1)})`, stp.x + 10, stp.y - 8);

      // matrix readout
      if (matrixEl) {
        matrixEl.innerHTML = m.flat().map((n) => `<span>${(+n.toFixed(2)).toString()}</span>`).join("");
      }
      if (eqEl) eqEl.textContent = "M · [x, y, 1]ᵀ = [x′, y′, 1]ᵀ — drag the point.";
    });

    // dragging
    let dragging = false;
    const setFromEvent = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2, cy = rect.height / 2;
      pt.x = clamp((e.clientX - rect.left - cx) / unit, -5, 5);
      pt.y = clamp((cy - (e.clientY - rect.top)) / unit, -5, 5);
      request();
    };
    on(canvas, "pointerdown", (e) => { dragging = true; canvas.setPointerCapture((e as PointerEvent).pointerId); setFromEvent(e as PointerEvent); });
    on(canvas, "pointermove", (e) => { if (dragging) setFromEvent(e as PointerEvent); });
    on(canvas, "pointerup", () => { dragging = false; });
    canvas.style.cursor = "grab";

    tabs.forEach((tab) => on(tab, "click", () => {
      kind = tab.dataset.kind ?? "translate";
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      request();
    }));
  }

  /* ============================================================
     4. ORDER MATTERS
     ============================================================ */
  function initOrder(fig: HTMLElement) {
    const cTs = fig.querySelector<HTMLCanvasElement>('[data-canvas="ts"]');
    const cSt = fig.querySelector<HTMLCanvasElement>('[data-canvas="st"]');
    const outTs = fig.querySelector<HTMLElement>('[data-out="ts"]');
    const outSt = fig.querySelector<HTMLElement>('[data-out="st"]');
    if (!cTs || !cSt) return;

    // slide values: point (10,20), translate (100,50), scale (3,2)
    const P0 = { x: 10, y: 20 };
    const T = { x: 100, y: 50 };
    const S = { x: 3, y: 2 };
    const endTS = { x: P0.x * S.x + T.x, y: P0.y * S.y + T.y };   // 130, 90
    const endST = { x: (P0.x + T.x) * S.x, y: (P0.y + T.y) * S.y }; // 330, 140
    if (outTs) outTs.textContent = `(10, 20) → (${endTS.x}, ${endTS.y})`;
    if (outSt) outSt.textContent = `(10, 20) → (${endST.x}, ${endST.y})`;

    const worldW = 380, worldH = 170;
    const render = (canvas: HTMLCanvasElement, end: { x: number; y: number }, col: [number, number, number]) =>
      (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
        const pad = 22;
        const sx = (w - pad * 2) / worldW, sy = (h - pad * 2) / worldH;
        const toS = (x: number, y: number) => ({ x: pad + x * sx, y: h - pad - y * sy });
        ctx.clearRect(0, 0, w, h);
        // axes
        ctx.strokeStyle = rgba(A3, 0.18); ctx.lineWidth = 1;
        const o = toS(0, 0);
        ctx.beginPath(); ctx.moveTo(pad, o.y); ctx.lineTo(w - pad, o.y); ctx.moveTo(o.x, pad); ctx.lineTo(o.x, h - pad); ctx.stroke();

        const f = (Math.sin(t * 0.9) * 0.5 + 0.5); // 0..1 ping-pong
        const cur = { x: lerp(P0.x, end.x, f), y: lerp(P0.y, end.y, f) };
        const s0 = toS(P0.x, P0.y), sc = toS(cur.x, cur.y), se = toS(end.x, end.y);

        // path
        ctx.strokeStyle = rgba(col, 0.4); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(se.x, se.y); ctx.stroke(); ctx.setLineDash([]);
        // start + end markers
        ctx.fillStyle = rgba(A3, 0.7); ctx.beginPath(); ctx.arc(s0.x, s0.y, 4, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(col, 0.5); ctx.beginPath(); ctx.arc(se.x, se.y, 6, 0, TAU); ctx.stroke();
        // moving point
        ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.arc(sc.x, sc.y, 6, 0, TAU); ctx.fill();
      };

    mount(cTs, render(cTs, endTS, A1), true);
    mount(cSt, render(cSt, endST, A2), true);
  }

  /* ============================================================
     5. INTERPOLATORS
     ============================================================ */
  function initInterpolators(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const legendItems = Array.from(fig.querySelectorAll<HTMLElement>("[data-legend] li"));

    const easings: Record<string, (t: number) => number> = {
      linear: (t) => t,
      easeIn: (t) => t * t,
      easeInOut: (t) => (1 - Math.cos(t * Math.PI)) / 2,
      overshoot: (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; },
    };
    const colors: Record<string, [number, number, number]> = {
      linear: A3, easeIn: A2, easeInOut: A1, overshoot: hexToRgb("#ffd27d"),
    };
    const order = ["linear", "easeIn", "easeInOut", "overshoot"];
    const active = new Set(order);

    // colour the legend swatches
    legendItems.forEach((li) => {
      const k = li.dataset.curve ?? "";
      const sw = li.querySelector<HTMLElement>(".ca-legend__sw");
      if (sw) sw.style.setProperty("--curve-color", rgba(colors[k] ?? A1));
    });

    const { request } = mount(canvas, (ctx, w, h, t) => {
      ctx.clearRect(0, 0, w, h);
      const pad = 26;
      const plotH = h * 0.6;
      const gx0 = pad, gx1 = w - pad, gy0 = pad, gy1 = plotH - pad / 2;
      const plotW = gx1 - gx0;
      const yFor = (v: number) => lerp(gy1, gy0, clamp((v + 0.18) / 1.36, 0, 1)); // allow overshoot headroom

      // frame
      ctx.strokeStyle = rgba(A3, 0.18); ctx.lineWidth = 1;
      ctx.strokeRect(gx0, gy0, plotW, gy1 - gy0);
      ctx.fillStyle = rgba(A3, 0.5); ctx.font = "10px ui-monospace, monospace";
      ctx.fillText("0", gx0, gy1 + 12); ctx.fillText("t", gx1 - 6, gy1 + 12); ctx.fillText("f(t)", gx0 - 2, gy0 - 8);

      const cycle = 2.6;
      const phase = (t % cycle) / cycle;

      // curves
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
          const x = gx0 + phase * plotW, y = yFor(easings[k](phase));
          ctx.fillStyle = rgba(colors[k]); ctx.beginPath(); ctx.arc(x, y, 4, 0, TAU); ctx.fill();
        }
      }
      // playhead
      ctx.strokeStyle = rgba(A1, 0.3); ctx.lineWidth = 1;
      const px = gx0 + phase * plotW;
      ctx.beginPath(); ctx.moveTo(px, gy0); ctx.lineTo(px, gy1); ctx.stroke();

      // motion tracks below
      const tracks = order.filter((k) => active.has(k));
      const ty0 = plotH + 8;
      const trackGap = (h - ty0 - 8) / Math.max(tracks.length, 1);
      tracks.forEach((k, idx) => {
        const ty = ty0 + trackGap * (idx + 0.5);
        ctx.strokeStyle = rgba(A3, 0.18); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx0, ty); ctx.lineTo(gx1, ty); ctx.stroke();
        const dotX = gx0 + clamp(easings[k](phase), 0, 1.2) * plotW;
        ctx.fillStyle = rgba(colors[k]); ctx.beginPath(); ctx.arc(dotX, ty, 5, 0, TAU); ctx.fill();
      });
    }, true);

    legendItems.forEach((li) => on(li, "click", () => {
      const k = li.dataset.curve ?? "";
      const onlyThis = active.size === 1 && active.has(k);
      active.clear();
      if (onlyThis) order.forEach((o) => active.add(o));
      else active.add(k);
      legendItems.forEach((x) => x.classList.toggle("is-dim", !active.has(x.dataset.curve ?? "")));
      request();
    }));
  }

  /* ============================================================
     6. NOISE — random vs perlin
     ============================================================ */
  function initNoise(fig: HTMLElement) {
    const cRand = fig.querySelector<HTMLCanvasElement>('[data-canvas="random"]');
    const cPerlin = fig.querySelector<HTMLCanvasElement>('[data-canvas="perlin"]');
    if (cRand) {
      mount(cRand, (ctx, w, h) => {
        const cell = 12;
        for (let y = 0; y < h; y += cell)
          for (let x = 0; x < w; x += cell) {
            const v = Math.random();
            ctx.fillStyle = rgba(mixRgb([10, 8, 16], A2, v), 1);
            ctx.fillRect(x, y, cell + 1, cell + 1);
          }
      }, true);
    }
    if (cPerlin) {
      mount(cPerlin, (ctx, w, h, t) => {
        const cell = 12;
        for (let y = 0; y < h; y += cell)
          for (let x = 0; x < w; x += cell) {
            const v = noise(x * 0.02 + t * 0.4, y * 0.02);
            ctx.fillStyle = rgba(mixRgb([10, 8, 16], A1, v), 1);
            ctx.fillRect(x, y, cell + 1, cell + 1);
          }
      }, true);
    }
  }

  /* ============================================================
     7. PARTICLES — the Thanos dust effect
     ============================================================ */
  function initParticles(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const hint = fig.querySelector<HTMLElement>(".ca-particle-hint");
    const organicEl = fig.querySelector<HTMLInputElement>('input[data-ctl="organic"]');
    const countEl = fig.querySelector<HTMLElement>("[data-particle-count]");
    const playBtns = Array.from(fig.querySelectorAll<HTMLElement>('[data-action="play"]'));
    const resetBtn = fig.querySelector<HTMLElement>('[data-action="reset"]');

    type Part = {
      ix: number; iy: number; x: number; y: number; r: number; ir: number;
      col: string; a: number; ia: number; life: number; vel: number;
      tx: number; ty: number; time: number; seed: number; dir: number;
    };

    let W = 0, H = 0, dpr = 1;
    let source: ImageData | null = null;
    let parts: Part[] = [];
    let state: "idle" | "run" = "idle";
    let cx = 0, cy = 0;
    let raf = 0, last = 0, visible = false;
    const ctx = canvas.getContext("2d")!;

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
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d")!;
      o.clearRect(0, 0, W, H);
      // a friendly subject with internal colour variation
      const size = Math.min(W, H) * 0.62;
      const r = size / 2;
      o.save();
      o.translate(W / 2, H / 2);
      const grd = o.createLinearGradient(-r, -r, r, r);
      grd.addColorStop(0, rgba(A2)); grd.addColorStop(0.6, rgba(A1)); grd.addColorStop(1, rgba(A3));
      o.fillStyle = grd;
      o.beginPath(); o.roundRect(-r, -r, size, size, size * 0.24); o.fill();
      o.fillStyle = "#fff";
      const ex = size * 0.2, ey = -size * 0.08, er = size * 0.13;
      o.beginPath(); o.arc(-ex, ey, er, 0, TAU); o.arc(ex, ey, er, 0, TAU); o.fill();
      o.fillStyle = "#15080f";
      o.beginPath(); o.arc(-ex, ey, er * 0.45, 0, TAU); o.arc(ex, ey, er * 0.45, 0, TAU); o.fill();
      o.strokeStyle = "#15080f"; o.lineWidth = size * 0.05; o.lineCap = "round";
      o.beginPath(); o.arc(0, size * 0.08, size * 0.24, 0.15 * Math.PI, 0.85 * Math.PI); o.stroke();
      o.restore();
      source = o.getImageData(0, 0, W, H);
    };

    const drawSource = () => {
      ctx.clearRect(0, 0, W, H);
      if (!source) return;
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      off.getContext("2d")!.putImageData(source, 0, 0);
      ctx.drawImage(off, 0, 0, W, H);
    };

    const build = () => {
      if (!source) return;
      const organic = organicEl?.checked ?? true;
      const data = source.data;
      let step = 6;
      // keep the particle budget reasonable on big screens
      while ((W / step) * (H / step) > 4200 && step < 14) step++;

      let minX = W, minY = H, maxX = 0, maxY = 0;
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 40) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
          }
        }
      cx = (minX + maxX) / 2 || W / 2;
      cy = (minY + maxY) / 2 || H / 2;

      const S = Math.min(W, H) / 360;
      const rnd = (a: number, b: number) => a + Math.random() * (b - a);
      parts = [];
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step) {
          const i = (y * W + x) * 4;
          const al = data[i + 3];
          if (al <= 40) continue;
          const col = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`;
          parts.push({
            ix: x, iy: y, x, y,
            ir: organic ? (step * 0.62) / (1 + Math.floor(Math.random() * 3)) : step * 0.55,
            r: step * 0.55,
            col, ia: al / 255, a: al / 255,
            life: organic ? rnd(1.2, 2.0) : 1.7,
            vel: (organic ? rnd(15, 35) : 25) * Math.sqrt(S),
            tx: (organic ? rnd(250, 450) : 250) * S,
            ty: (organic ? rnd(150, 350) : 200) * S,
            time: 0, seed: Math.random() * 1000,
            dir: [-1, 1, 1, 1][Math.floor(Math.random() * 4)],
          });
        }
      if (countEl) countEl.textContent = `${parts.length.toLocaleString()} particles · ${organic ? "organic" : "uniform"}`;
    };

    const stepFrame = (dt: number) => {
      const organic = organicEl?.checked ?? true;
      ctx.clearRect(0, 0, W, H);
      let alive = 0;
      const S = Math.min(W, H) / 360;
      for (const p of parts) {
        p.time += dt;
        const f = p.time / p.life;
        if (f >= 1) continue;
        alive++;
        p.x = p.ix + ((p.ix - cx) / (cx || 1)) * p.tx * f;
        p.y = p.iy + ((p.iy - cy) / (cy || 1)) * p.ty * f;
        p.y -= Math.pow(f * p.vel, 2) * 0.012; // gravity arc
        if (organic) {
          const n = noise(p.seed, f * 4) - 0.5;
          p.x += n * 8 * S * p.dir;
          p.y -= Math.abs(n) * 6 * S;
        }
        p.r = Math.max(0.5, p.ir * (1 - f));
        p.a = p.ia * Math.min(1.2 - f, 1);
        ctx.globalAlpha = clamp(p.a, 0, 1);
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive === 0) {
        state = "idle";
        drawSource();
        if (hint) hint.classList.remove("is-hidden");
      }
    };

    const loop = (now: number) => {
      raf = 0;
      if (state !== "run") return;
      let dt = (now - last) / 1000;
      last = now;
      dt = clamp(dt, 1 / 60, 4 / 60); // time-tuning, straight from the talk
      stepFrame(dt);
      if (visible) raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (state === "run") return;
      buildSource();
      build();
      state = "run";
      last = performance.now();
      if (hint) hint.classList.add("is-hidden");
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const reset = () => {
      state = "idle";
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      buildSource();
      drawSource();
      if (hint) hint.classList.remove("is-hidden");
      if (countEl) countEl.textContent = "";
    };

    refit();
    buildSource();
    drawSource();

    const ro = new ResizeObserver(() => {
      refit();
      if (state === "idle") { buildSource(); drawSource(); }
    });
    ro.observe(canvas);
    const io = new IntersectionObserver((es) => {
      visible = es[0].isIntersecting;
      if (visible && state === "run" && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    }, { rootMargin: "140px" });
    io.observe(canvas);

    playBtns.forEach((b) => on(b, "click", start));
    if (resetBtn) on(resetBtn, "click", reset);
    if (organicEl) on(organicEl, "change", () => { if (state !== "run") return; build(); });

    cleanups.push(() => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
    });
  }

  /* ============================================================
     8. POINT SPRITE → circle (shader discard)
     ============================================================ */
  function initPointSprite(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const sizeEl = fig.querySelector<HTMLInputElement>('input[data-ctl="size"]');
    const gridEl = fig.querySelector<HTMLInputElement>('input[data-ctl="grid"]');
    const discardEl = fig.querySelector<HTMLElement>("[data-discard]");

    const { request } = mount(canvas, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const frac = (Number(sizeEl?.value ?? 80)) / 100;
      const side = Math.min(w, h) * frac;
      const ox = (w - side) / 2, oy = (h - side) / 2;
      const showGrid = gridEl?.checked ?? true;

      // cells: keep / discard
      const cells = 40;
      const cs = side / cells;
      for (let j = 0; j < cells; j++)
        for (let i = 0; i < cells; i++) {
          const u = (i + 0.5) / cells, v = (j + 0.5) / cells;
          const x = 2 * u - 1, y = 2 * v - 1;
          const inside = x * x + y * y <= 1;
          ctx.fillStyle = inside ? rgba(mixRgb(A2, A1, (x + 1) / 2), 0.92) : rgba([60, 20, 38], 0.32);
          ctx.fillRect(ox + i * cs, oy + j * cs, cs + 0.6, cs + 0.6);
        }

      // sprite border
      ctx.strokeStyle = rgba(A3, 0.5); ctx.lineWidth = 1.5;
      ctx.strokeRect(ox, oy, side, side);
      // circle outline
      ctx.strokeStyle = rgba(A1, 0.9); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ox + side / 2, oy + side / 2, side / 2, 0, TAU); ctx.stroke();

      if (showGrid) {
        ctx.fillStyle = rgba(A3, 0.8); ctx.font = "11px ui-monospace, monospace";
        ctx.fillText("gl_PointCoord (0,0)", ox + 4, oy - 6);
        ctx.fillText("(1,1)", ox + side - 28, oy + side + 14);
        ctx.fillText("(0,0)→(-1,-1)   (1,1)→(1,1)", ox, oy + side + 30);
      }
      if (discardEl) discardEl.textContent = "Corners discarded ≈ 21.5% of the sprite — that's the whole circle.";
    });

    if (sizeEl) on(sizeEl, "input", request);
    if (gridEl) on(gridEl, "change", request);
  }

  /* ============================================================
     YouTube facade
     ============================================================ */
  function initYouTube(el: HTMLElement) {
    const btn = el.querySelector<HTMLButtonElement>("[data-yt-play]");
    const id = el.dataset.videoId;
    if (!btn || !id) return;
    on(btn, "click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = "Complex Animations — full talk";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      el.innerHTML = "";
      el.appendChild(iframe);
    });
  }

  /* ============================================================
     Chapter rail — highlight the section in view
     ============================================================ */
  function initRail() {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-rail-link]"));
    if (!links.length) return;
    const ratios = new Map<string, number>();
    const sections = links
      .map((l) => document.getElementById(l.dataset.railLink ?? ""))
      .filter((s): s is HTMLElement => !!s);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let bestId = ""; let best = 0;
      ratios.forEach((r, id) => { if (r > best) { best = r; bestId = id; } });
      links.forEach((l) => l.classList.toggle("is-active", l.dataset.railLink === bestId && best > 0));
    }, { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.75] });

    sections.forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());
  }

  /* ---------------- wire everything up ---------------- */
  const heroCanvas = root.querySelector<HTMLCanvasElement>('[data-demo="hero"]');
  if (heroCanvas) initHero(heroCanvas);

  root.querySelectorAll<HTMLElement>('[data-demo="transform"]').forEach(initTransform);
  root.querySelectorAll<HTMLElement>('[data-demo="matrix"]').forEach(initMatrix);
  root.querySelectorAll<HTMLElement>('[data-demo="order"]').forEach(initOrder);
  root.querySelectorAll<HTMLElement>('[data-demo="interpolators"]').forEach(initInterpolators);
  root.querySelectorAll<HTMLElement>('[data-demo="noise"]').forEach(initNoise);
  root.querySelectorAll<HTMLElement>('[data-demo="particles"]').forEach(initParticles);
  root.querySelectorAll<HTMLElement>('[data-demo="pointsprite"]').forEach(initPointSprite);
  root.querySelectorAll<HTMLElement>('[data-demo="youtube"]').forEach(initYouTube);
  initRail();
}

/* run on first load and after every client-side navigation */
document.addEventListener("astro:page-load", initCA);
document.addEventListener("astro:before-swap", destroyCA);

// Fallback for a non-transition initial load.
if (document.readyState !== "loading") initCA();
else document.addEventListener("DOMContentLoaded", initCA);
