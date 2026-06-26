import {
  highlightCode,
  highlightPresentationCode,
} from "../lib/syntax-highlight";
import { initPresentationRail } from "../lib/presentation-rail";

type Cleanup = () => void;
type RenderFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) => void;

const ROOT_SELECTOR = "[data-mt-root]";
const TAU = Math.PI * 2;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeInOut = (t: number) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim().replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(full || "fb923c", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbA = (c: [number, number, number], a = 1) =>
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
function destroyMT() {
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __mtCleanups?: Cleanup[] })
    | null;
  if (root?.__mtCleanups) {
    root.__mtCleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* noop */
      }
    });
    root.__mtCleanups = [];
  }
}

function initMT() {
  destroyMT();
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __mtCleanups?: Cleanup[] })
    | null;
  if (!root) return;

  const cleanups: Cleanup[] = [];
  root.__mtCleanups = cleanups;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cs = getComputedStyle(root);
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  const A1 = hexToRgb(cs.getPropertyValue("--mt-accent") || "#fb923c"); // amber
  const A2 = hexToRgb(cs.getPropertyValue("--mt-accent-2") || "#f43f5e"); // rose
  const A3 = hexToRgb(cs.getPropertyValue("--mt-accent-3") || "#8b5cf6"); // violet
  const INK = hexToRgb(cs.getPropertyValue("--mt-demo-ink").trim() || "#969eb2");
  const GREEN = hexToRgb(
    cs.getPropertyValue("--mt-demo-green").trim() || "#4ec98a",
  );
  const fillBoost = isLight
    ? parseFloat(cs.getPropertyValue("--mt-demo-fill")) || 1.35
    : 1;
  const paint = (c: [number, number, number], a = 1) =>
    rgbA(c, isLight && a < 0.45 ? Math.min(1, a * fillBoost) : a);

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

  /** Mount a render loop. Animated loops run only while visible. */
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

  /* shared drawing helpers ------------------------------------ */
  function box(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill?: string,
    stroke?: string,
    lw = 1,
  ) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }
  function label(
    ctx: CanvasRenderingContext2D,
    s: string,
    x: number,
    y: number,
    color: string,
    size = 12,
    align: CanvasTextAlign = "left",
    weight = "400",
  ) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ui-monospace, "SF Mono", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(s, x, y);
  }
  function initHero(canvas: HTMLCanvasElement) {
    type Blk = {
      lane: number;
      x: number;
      w: number;
      v: number;
      c: [number, number, number];
      a: number;
    };
    let blks: Blk[] = [];
    let lanes = 6;
    let lastW = -1;

    const seed = (w: number, h: number) => {
      lanes = Math.round(clamp(h / 64, 4, 9));
      blks = [];
      for (let ln = 0; ln < lanes; ln++) {
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
          blks.push({
            lane: ln,
            x: Math.random() * w,
            w: 30 + Math.random() * 90,
            v: 14 + Math.random() * 26,
            c: mixRgb(mixRgb(A1, A2, Math.random()), A3, Math.random() * 0.5),
            a: 0.18 + Math.random() * 0.4,
          });
        }
      }
    };

    let prev = 0;
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
        // faint lane rails
        ctx.strokeStyle = paint(A3, 0.06);
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
          if (b.x > w + 20) {
            b.x = -b.w - Math.random() * 200;
          }
          const y = b.lane * laneH + laneH / 2;
          const bh = clamp(laneH * 0.4, 6, 16);
          ctx.globalAlpha = b.a;
          box(ctx, b.x, y - bh / 2, b.w, bh, bh / 2, paint(b.c, 0.9));
          ctx.globalAlpha = b.a * 0.5;
          // trailing glow
          const g = ctx.createLinearGradient(b.x - 40, 0, b.x, 0);
          g.addColorStop(0, paint(b.c, 0));
          g.addColorStop(1, paint(b.c, 0.35));
          ctx.fillStyle = g;
          ctx.fillRect(b.x - 40, y - bh / 2, 40, bh);
        }
        ctx.globalAlpha = 1;

        // a soft "now" scanline sweeping
        if (!reduce) {
          const sx = ((t * 90) % (w + 200)) - 100;
          const sg = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
          sg.addColorStop(0, paint(A1, 0));
          sg.addColorStop(0.5, paint(A1, 0.1));
          sg.addColorStop(1, paint(A1, 0));
          ctx.fillStyle = sg;
          ctx.fillRect(sx - 30, 0, 60, h);
        }
      },
      true,
    );
  }
  function initRegisters(fig: HTMLElement) {
    const codeLines = [
      "fun main() {",
      "    println(sum(10, 20))",
      "}",
      "",
      "fun sum(a: Int, b: Int): Int {",
      "    val c = a + b",
      "    return c",
      "}",
    ];
    const regOrder = ["PC", "SP", "LR", "R0", "R1", "R2"];
    type Regs = Record<string, string>;
    type Step = { line: number; regs: Regs; out?: string; note: string };
    const base: Regs = {
      PC: "main",
      SP: "0xF0",
      LR: "—",
      R0: "—",
      R1: "—",
      R2: "—",
    };
    const steps: Step[] = [
      {
        line: 0,
        regs: { ...base },
        note: "Enter main(). The PC points at the first instruction; the stack pointer is set.",
      },
      {
        line: 1,
        regs: { ...base, R0: "10", R1: "20", LR: "main+1", PC: "sum" },
        note: "Pass args in R0/R1, save the return address in LR, then jump into sum().",
      },
      {
        line: 4,
        regs: {
          PC: "sum",
          SP: "0xE8",
          LR: "main+1",
          R0: "10",
          R1: "20",
          R2: "—",
        },
        note: "We are now executing the callee. A new stack frame was pushed (SP moved).",
      },
      {
        line: 5,
        regs: {
          PC: "sum",
          SP: "0xE8",
          LR: "main+1",
          R0: "10",
          R1: "20",
          R2: "30",
        },
        note: "c = a + b → the ALU adds R0 + R1 and stores 30 in R2.",
      },
      {
        line: 6,
        regs: {
          PC: "main+1",
          SP: "0xF0",
          LR: "main+1",
          R0: "30",
          R1: "20",
          R2: "30",
        },
        note: "Return: move the result into R0 and set PC = LR to jump back to main().",
      },
      {
        line: 1,
        regs: {
          PC: "main+1",
          SP: "0xF0",
          LR: "main+1",
          R0: "30",
          R1: "20",
          R2: "30",
        },
        out: "30",
        note: "Back in main(). R0 holds 30 — println prints it. Done.",
      },
    ];

    fig.innerHTML = `
      <div class="mt-regs">
        <pre class="mt-regs__code">${codeLines
          .map((l, i) => {
            const inner = l ? highlightCode(l, "kotlin") : "&nbsp;";
            return `<span class="mt-regs__line" data-line="${i}">${inner}</span>`;
          })
          .join("")}</pre>
        <div class="mt-regs__side">
          <div class="mt-regs__grid">
            ${regOrder
              .map(
                (r) => `
              <div class="mt-reg" data-reg="${r}">
                <span class="mt-reg__k">${r}</span><span class="mt-reg__v">—</span>
              </div>`,
              )
              .join("")}
          </div>
          <div class="mt-regs__out" data-out>stdout</div>
          <p class="mt-regs__note" data-note></p>
          <div class="mt-regs__actions">
            <button class="mt-btn" data-action="step">Step ▶</button>
            <button class="mt-btn mt-btn--ghost" data-action="reset">Reset</button>
          </div>
        </div>
      </div>`;

    const lineEls = Array.from(
      fig.querySelectorAll<HTMLElement>(".mt-regs__line"),
    );
    const regEls = new Map<string, HTMLElement>();
    regOrder.forEach((r) =>
      regEls.set(r, fig.querySelector<HTMLElement>(`[data-reg="${r}"]`)!),
    );
    const outEl = fig.querySelector<HTMLElement>("[data-out]")!;
    const noteEl = fig.querySelector<HTMLElement>("[data-note]")!;
    const stepBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="step"]',
    )!;
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    )!;

    let i = -1;
    let prevRegs: Regs = { ...base, PC: "—", SP: "—" };

    const apply = (idx: number) => {
      if (idx < 0) {
        lineEls.forEach((l) => l.classList.remove("is-active"));
        regOrder.forEach((r) => {
          const el = regEls.get(r)!;
          el.querySelector(".mt-reg__v")!.textContent = "—";
          el.classList.remove("is-changed");
        });
        outEl.textContent = "stdout";
        noteEl.textContent = "Press Step to execute one instruction at a time.";
        prevRegs = { PC: "—", SP: "—", LR: "—", R0: "—", R1: "—", R2: "—" };
        stepBtn.disabled = false;
        stepBtn.textContent = "Step ▶";
        return;
      }
      const s = steps[idx];
      lineEls.forEach((l) =>
        l.classList.toggle("is-active", Number(l.dataset.line) === s.line),
      );
      regOrder.forEach((r) => {
        const el = regEls.get(r)!;
        const v = s.regs[r] ?? "—";
        el.querySelector(".mt-reg__v")!.textContent = v;
        el.classList.toggle("is-changed", v !== prevRegs[r]);
      });
      outEl.textContent = s.out ? `> ${s.out}` : "stdout";
      noteEl.textContent = s.note;
      prevRegs = { ...s.regs };
      const last = idx >= steps.length - 1;
      stepBtn.disabled = last;
      stepBtn.textContent = last ? "Done ✓" : "Step ▶";
    };

    apply(-1);
    on(stepBtn, "click", () => {
      if (i < steps.length - 1) {
        i++;
        apply(i);
      }
    });
    on(resetBtn, "click", () => {
      i = -1;
      apply(-1);
    });
  }
  function initContextSwitch(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const note = fig.querySelector<HTMLElement>("[data-cs-note]");
    const playBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="play"]',
    );
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    );

    let active = 1; // which process owns the core
    let anim: { t0: number; from: number; to: number } | null = null;
    const DUR = 1.6;
    let nowT = 0;

    const setNote = () => {
      if (note) note.textContent = `Process ${active} is running on the core.`;
    };
    setNote();

    mount(
      canvas,
      (ctx, w, h, t) => {
        nowT = t;
        ctx.clearRect(0, 0, w, h);
        const cw = Math.min(w * 0.26, 150),
          ch = Math.min(h * 0.42, 150);
        const cx = w / 2,
          cy = h / 2;
        const pcbW = Math.min(w * 0.24, 132),
          pcbH = ch + 24;
        const lx = Math.max(12, w * 0.04),
          rx = w - pcbW - Math.max(12, w * 0.04);
        const py = cy - pcbH / 2;

        let prog = 0;
        if (anim) {
          prog = clamp((t - anim.t0) / DUR, 0, 1);
          if (prog >= 1) {
            active = anim.to;
            anim = null;
            setNote();
          }
        }
        const phase = anim ? (prog < 0.5 ? "save" : "restore") : "idle";

        // PCBs
        const drawPCB = (x: number, n: number, on: boolean) => {
          box(
            ctx,
            x,
            py,
            pcbW,
            pcbH,
            12,
            paint(on ? A1 : INK, on ? 0.1 : 0.05),
            paint(on ? A1 : INK, on ? 0.5 : 0.22),
            1.2,
          );
          label(
            ctx,
            `PCB · Process ${n}`,
            x + pcbW / 2,
            py + 16,
            paint(on ? A1 : INK, 0.9),
            11,
            "center",
            "600",
          );
          // register slots
          const cols = 3,
            rows = 3,
            gap = 6;
          const slotW = (pcbW - 20 - gap * (cols - 1)) / cols;
          const slotH = 14;
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) {
              const sx = x + 10 + c * (slotW + gap);
              const sy = py + 34 + r * (slotH + gap);
              box(
                ctx,
                sx,
                sy,
                slotW,
                slotH,
                4,
                paint(on ? A2 : INK, on ? 0.18 : 0.08),
              );
            }
        };
        drawPCB(lx, 1, active === 1 && phase === "idle");
        drawPCB(rx, 2, active === 2 && phase === "idle");

        // CPU core
        box(
          ctx,
          cx - cw / 2,
          cy - ch / 2,
          cw,
          ch,
          14,
          paint(A3, 0.08),
          paint(A3, 0.55),
          1.4,
        );
        label(
          ctx,
          "CPU CORE",
          cx,
          cy - ch / 2 + 16,
          paint(A3, 0.95),
          11,
          "center",
          "600",
        );
        const running =
          phase === "idle" ? active : phase === "save" ? anim?.from : anim?.to;
        label(
          ctx,
          phase === "idle"
            ? `running P${running}`
            : phase === "save"
              ? "saving…"
              : "restoring…",
          cx,
          cy + ch / 2 - 14,
          paint(A1, 0.85),
          10,
          "center",
        );
        // core register grid
        const gc = 3,
          gr = 2,
          ggap = 7,
          gw = (cw - 28 - ggap * (gc - 1)) / gc,
          gh = 16;
        for (let r = 0; r < gr; r++)
          for (let c = 0; c < gc; c++) {
            const sx = cx - cw / 2 + 14 + c * (gw + ggap);
            const sy = cy - ch / 2 + 30 + r * (gh + ggap);
            box(ctx, sx, sy, gw, gh, 4, paint(A1, 0.16));
          }

        // moving register dots
        if (anim) {
          const fromPCB = anim.from === 1 ? lx : rx;
          const toPCB = anim.to === 1 ? lx : rx;
          const drawDots = (
            ax: number,
            ay: number,
            bx: number,
            by: number,
            p: number,
            col: [number, number, number],
          ) => {
            for (let k = 0; k < 5; k++) {
              const kp = clamp(p * 1.3 - k * 0.06, 0, 1);
              const e = easeInOut(kp);
              const x = lerp(ax, bx, e),
                y = lerp(ay, by, e) + Math.sin(e * Math.PI) * -10;
              ctx.globalAlpha = kp > 0 && kp < 1 ? 1 : 0.25;
              ctx.fillStyle = paint(col, 0.95);
              ctx.beginPath();
              ctx.arc(x, y, 4, 0, TAU);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          };
          if (phase === "save") {
            // CPU -> outgoing PCB
            drawDots(cx, cy, fromPCB + pcbW / 2, cy, prog * 2, A1);
          } else {
            // incoming PCB -> CPU
            drawDots(toPCB + pcbW / 2, cy, cx, cy, (prog - 0.5) * 2, A2);
          }
        }
      },
      true,
    );

    if (playBtn)
      on(playBtn, "click", () => {
        if (anim) return;
        anim = { t0: nowT, from: active, to: active === 1 ? 2 : 1 };
        if (note)
          note.textContent =
            "Saving registers to the PCB, restoring the next process…";
      });
    if (resetBtn)
      on(resetBtn, "click", () => {
        anim = null;
        active = 1;
        setNote();
      });
  }
  function initFork(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const note = fig.querySelector<HTMLElement>("[data-fork-note]");
    const forkBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="fork"]',
    );
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    );

    let forked = false;
    let t0 = -1;
    let nowT = 0;
    const DUR = 0.9;
    const PID = 4021;

    mount(
      canvas,
      (ctx, w, h, t) => {
        nowT = t;
        ctx.clearRect(0, 0, w, h);
        const bw = Math.min(w * 0.32, 180),
          bh = Math.min(h * 0.5, 150);
        const cy = h / 2;
        let prog = forked && t0 >= 0 ? clamp((t - t0) / DUR, 0, 1) : 0;
        const e = easeInOut(prog);
        const spread = (forked ? w * 0.24 : 0) * e;

        const drawProc = (
          cx: number,
          title: string,
          res: string,
          col: [number, number, number],
          alpha = 1,
        ) => {
          ctx.globalAlpha = alpha;
          box(
            ctx,
            cx - bw / 2,
            cy - bh / 2,
            bw,
            bh,
            14,
            paint(col, 0.09),
            paint(col, 0.5),
            1.3,
          );
          label(
            ctx,
            title,
            cx,
            cy - bh / 2 + 18,
            paint(col, 0.95),
            12,
            "center",
            "600",
          );
          // memory + registers slots
          box(
            ctx,
            cx - bw / 2 + 14,
            cy - bh / 2 + 32,
            bw - 28,
            26,
            6,
            paint(A3, 0.14),
          );
          label(
            ctx,
            "memory",
            cx,
            cy - bh / 2 + 45,
            paint(INK, 0.8),
            10,
            "center",
          );
          box(
            ctx,
            cx - bw / 2 + 14,
            cy - bh / 2 + 66,
            bw - 28,
            20,
            5,
            paint(A1, 0.14),
          );
          label(
            ctx,
            "registers",
            cx,
            cy - bh / 2 + 76,
            paint(INK, 0.8),
            10,
            "center",
          );
          if (res) {
            box(
              ctx,
              cx - bw / 2 + 14,
              cy + bh / 2 - 34,
              bw - 28,
              22,
              6,
              paint(col, 0.16),
              paint(col, 0.5),
              1,
            );
            label(
              ctx,
              res,
              cx,
              cy + bh / 2 - 23,
              paint(col, 0.95),
              11,
              "center",
              "600",
            );
          }
          ctx.globalAlpha = 1;
        };

        if (!forked) {
          drawProc(w / 2, "Process 1", "res = ?", A1);
        } else {
          // connecting line
          ctx.strokeStyle = paint(A2, 0.4 * e);
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(w / 2 - spread, cy - bh / 2 - 8);
          ctx.lineTo(w / 2 + spread, cy - bh / 2 - 8);
          ctx.stroke();
          ctx.setLineDash([]);
          label(
            ctx,
            "fork()",
            w / 2,
            cy - bh / 2 - 18,
            paint(A2, 0.9 * e),
            11,
            "center",
            "600",
          );
          drawProc(w / 2 - spread, "Parent", `res = ${PID}`, A1);
          drawProc(w / 2 + spread, "Child", "res = 0", A2);
        }
      },
      true,
    );

    if (forkBtn)
      on(forkBtn, "click", () => {
        if (forked) return;
        forked = true;
        t0 = nowT;
        if (note)
          note.textContent =
            "fork() returned twice — child sees 0, parent sees the child's PID.";
      });
    if (resetBtn)
      on(resetBtn, "click", () => {
        forked = false;
        t0 = -1;
        if (note) note.textContent = "One process, about to fork.";
      });
  }
  function initMemory(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const note = fig.querySelector<HTMLElement>("[data-memory-note]");
    const tabs = Array.from(
      fig.querySelectorAll<HTMLButtonElement>("[data-memory-tabs] [data-kind]"),
    );
    let kind: "process" | "thread" = "process";

    const notes = {
      process:
        "Two processes — each has its OWN memory. They can't touch each other's data. Safe, but expensive to create and to communicate.",
      thread:
        "One process, three threads — they SHARE the same memory. Cheap and fast to communicate, but every shared write is a potential race.",
    };
    if (note) note.textContent = notes.process;

    mount(
      canvas,
      (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const pad = Math.max(14, w * 0.04);
        const pulse = 0.5 + 0.5 * Math.sin(t * 2);

        if (kind === "process") {
          const bw = (w - pad * 3) / 2,
            bh = h - pad * 2,
            y = pad;
          ["Process A", "Process B"].forEach((name, i) => {
            const x = pad + i * (bw + pad);
            const col = i === 0 ? A1 : A3;
            box(ctx, x, y, bw, bh, 14, paint(col, 0.06), paint(col, 0.45), 1.3);
            label(
              ctx,
              name,
              x + bw / 2,
              y + 18,
              paint(col, 0.95),
              12,
              "center",
              "600",
            );
            box(
              ctx,
              x + 14,
              y + 36,
              bw - 28,
              bh * 0.4,
              8,
              paint(col, 0.14),
              paint(col, 0.3),
            );
            label(
              ctx,
              "private memory",
              x + bw / 2,
              y + 36 + bh * 0.2,
              paint(INK, 0.85),
              11,
              "center",
            );
            box(ctx, x + 14, y + bh - 56, bw - 28, 34, 6, paint(A2, 0.16));
            label(
              ctx,
              "thread + registers",
              x + bw / 2,
              y + bh - 39,
              paint(INK, 0.85),
              10,
              "center",
            );
          });
          // barrier
          label(
            ctx,
            "isolated",
            w / 2,
            h - pad + 2,
            paint(INK, 0.5),
            10,
            "center",
          );
        } else {
          const bw = w - pad * 2,
            bh = h - pad * 2,
            x = pad,
            y = pad;
          box(ctx, x, y, bw, bh, 14, paint(A1, 0.06), paint(A1, 0.45), 1.3);
          label(
            ctx,
            "Process",
            x + bw / 2,
            y + 16,
            paint(A1, 0.95),
            12,
            "center",
            "600",
          );
          // shared memory (pulsing highlight)
          const mh = bh * 0.32;
          box(
            ctx,
            x + 16,
            y + 30,
            bw - 32,
            mh,
            8,
            paint(A2, 0.1 + pulse * 0.12),
            paint(A2, 0.5 + pulse * 0.3),
            1.4,
          );
          label(
            ctx,
            "SHARED memory",
            x + bw / 2,
            y + 30 + mh / 2,
            paint(A2, 0.95),
            12,
            "center",
            "600",
          );
          // three threads
          const tw = (bw - 32 - 24) / 3,
            ty = y + 30 + mh + 16,
            th = bh - mh - 64;
          for (let i = 0; i < 3; i++) {
            const tx = x + 16 + i * (tw + 12);
            box(ctx, tx, ty, tw, th, 8, paint(A3, 0.1), paint(A3, 0.45), 1.1);
            label(
              ctx,
              `Thread ${i + 1}`,
              tx + tw / 2,
              ty + 14,
              paint(A3, 0.92),
              10,
              "center",
              "600",
            );
            box(ctx, tx + 8, ty + 26, tw - 16, 18, 4, paint(A1, 0.16));
            label(
              ctx,
              "stack",
              tx + tw / 2,
              ty + 35,
              paint(INK, 0.8),
              9,
              "center",
            );
            box(ctx, tx + 8, ty + 48, tw - 16, 16, 4, paint(A1, 0.12));
            label(
              ctx,
              "regs",
              tx + tw / 2,
              ty + 56,
              paint(INK, 0.8),
              9,
              "center",
            );
            // link to shared memory
            ctx.strokeStyle = paint(A2, 0.2 + pulse * 0.25);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tx + tw / 2, ty);
            ctx.lineTo(tx + tw / 2, y + 30 + mh);
            ctx.stroke();
          }
        }
      },
      true,
    );

    tabs.forEach((b) =>
      on(b, "click", () => {
        kind = (b.dataset.kind as "process" | "thread") ?? "process";
        tabs.forEach((x) => x.classList.toggle("is-active", x === b));
        if (note) note.textContent = notes[kind];
      }),
    );
  }
  function initThreadLocal(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const note = fig.querySelector<HTMLElement>("[data-tl-note]");
    const runBtn = fig.querySelector<HTMLButtonElement>('[data-action="run"]');
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    );

    let t0 = -1,
      nowT = 0;
    const DUR = 2.4;

    mount(
      canvas,
      (ctx, w, h, t) => {
        nowT = t;
        ctx.clearRect(0, 0, w, h);
        const prog = t0 >= 0 ? clamp((t - t0) / DUR, 0, 1) : -1;
        const pad = Math.max(14, w * 0.04);

        // shared key chip at top center
        const keyW = 150,
          keyH = 30,
          keyX = w / 2 - keyW / 2,
          keyY = pad;
        box(
          ctx,
          keyX,
          keyY,
          keyW,
          keyH,
          8,
          paint(A3, 0.12),
          paint(A3, 0.55),
          1.3,
        );
        label(
          ctx,
          "threadLocal  (the key)",
          w / 2,
          keyY + keyH / 2,
          paint(A3, 0.95),
          11,
          "center",
          "600",
        );

        const bw = (w - pad * 3) / 2,
          by = keyY + keyH + 24,
          bh = h - by - pad;
        [1, 2].forEach((n, i) => {
          const x = pad + i * (bw + pad);
          const col = i === 0 ? A1 : A2;
          const setP = clamp((prog - (i === 0 ? 0.1 : 0.3)) * 4, 0, 1);
          const getP = clamp((prog - (i === 0 ? 0.55 : 0.75)) * 4, 0, 1);
          box(ctx, x, by, bw, bh, 12, paint(col, 0.06), paint(col, 0.45), 1.2);
          label(
            ctx,
            `Thread ${n}`,
            x + bw / 2,
            by + 16,
            paint(col, 0.95),
            12,
            "center",
            "600",
          );

          // its own threadLocals map
          const mY = by + 32,
            mH = 40;
          box(ctx, x + 14, mY, bw - 28, mH, 8, paint(col, 0.1), paint(col, 0.3));
          label(
            ctx,
            "threadLocals (its own map)",
            x + bw / 2,
            mY + 13,
            paint(INK, 0.8),
            9,
            "center",
          );
          if (setP > 0) {
            ctx.globalAlpha = setP;
            label(
              ctx,
              `{ key → ${n} }`,
              x + bw / 2,
              mY + 28,
              paint(col, 0.95),
              12,
              "center",
              "600",
            );
            ctx.globalAlpha = 1;
          }

          // set()/get() lines
          label(
            ctx,
            `set(${n})`,
            x + bw / 2,
            mY + mH + 18,
            paint(setP > 0 ? col : INK, setP > 0 ? 0.9 : 0.4),
            11,
            "center",
          );
          if (getP > 0) {
            ctx.globalAlpha = getP;
            box(
              ctx,
              x + 14,
              by + bh - 30,
              bw - 28,
              22,
              6,
              paint(col, 0.14),
              paint(col, 0.5),
              1,
            );
            label(
              ctx,
              `get() → ${n}`,
              x + bw / 2,
              by + bh - 19,
              paint(col, 0.95),
              11,
              "center",
              "600",
            );
            ctx.globalAlpha = 1;
          }

          // link from key to map
          if (setP > 0) {
            ctx.strokeStyle = paint(A3, 0.25 * setP);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(w / 2, keyY + keyH);
            ctx.lineTo(x + bw / 2, mY);
            ctx.stroke();
          }
        });
      },
      true,
    );

    if (runBtn)
      on(runBtn, "click", () => {
        t0 = nowT;
        if (note)
          note.textContent =
            "Both threads call set() on the SAME key — yet each get() returns its own value.";
      });
    if (resetBtn)
      on(resetBtn, "click", () => {
        t0 = -1;
        if (note) note.textContent = "Same key, different value per thread.";
      });
  }
  function initMessageQueue(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const note = fig.querySelector<HTMLElement>("[data-mq-note]");
    const postBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="post"]',
    );
    const delBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="postDelayed"]',
    );
    const toggleBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="toggle"]',
    );
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    );

    type Msg = {
      id: number;
      due: number;
      color: [number, number, number];
      label: string;
    };
    let msgs: Msg[] = [];
    let now = 0; // logical clock (s)
    let looping = true;
    let dispatch: { msg: Msg; t0: number } | null = null;
    let dispatched = 0;
    let seq = 1;
    let lastReal = -1;
    const palette: [number, number, number][] = [A1, A2, A3, GREEN];

    const add = (delay: number) => {
      const m: Msg = {
        id: seq,
        due: now + delay,
        color: palette[(seq - 1) % palette.length],
        label: `M${seq}`,
      };
      seq++;
      msgs.push(m);
      msgs.sort((a, b) => a.due - b.due);
    };
    // seed
    add(0.6);
    add(1.8);

    const updateNote = () => {
      if (!note) return;
      note.textContent = looping
        ? `Looping · ${msgs.length} queued · ${dispatched} dispatched`
        : "Loop paused — messages wait in the queue.";
    };
    updateNote();

    mount(
      canvas,
      (ctx, w, h, t) => {
        if (lastReal < 0) lastReal = t;
        const dt = Math.min(t - lastReal, 0.05);
        lastReal = t;
        if (looping && !reduce) now += dt;

        // process head when due
        if (looping && !dispatch && msgs.length && msgs[0].due <= now) {
          dispatch = { msg: msgs.shift()!, t0: t };
        }
        if (dispatch && t - dispatch.t0 > 0.7) {
          dispatch = null;
          dispatched++;
          updateNote();
        }

        ctx.clearRect(0, 0, w, h);
        const pad = Math.max(14, w * 0.04);

        // clock
        label(
          ctx,
          `t = ${now.toFixed(1)}s`,
          pad,
          pad + 4,
          paint(A1, 0.9),
          12,
          "left",
          "600",
        );
        label(
          ctx,
          `dispatched: ${dispatched}`,
          w - pad,
          pad + 4,
          paint(GREEN, 0.85),
          11,
          "right",
        );

        // queue column (left)
        const qx = pad,
          qw = Math.min(w * 0.42, 230),
          qTop = pad + 26;
        label(
          ctx,
          "MessageQueue (sorted by due time)",
          qx,
          qTop - 4,
          paint(INK, 0.7),
          10,
          "left",
        );
        const cardH = 34,
          gap = 8;
        msgs.slice(0, 5).forEach((m, i) => {
          const y = qTop + 8 + i * (cardH + gap);
          const ready = m.due <= now;
          box(
            ctx,
            qx,
            y,
            qw,
            cardH,
            8,
            paint(m.color, ready ? 0.22 : 0.1),
            paint(m.color, ready ? 0.7 : 0.4),
            ready ? 1.4 : 1,
          );
          label(
            ctx,
            m.label,
            qx + 14,
            y + cardH / 2,
            paint(m.color, 0.95),
            12,
            "left",
            "600",
          );
          const remain = m.due - now;
          label(
            ctx,
            remain > 0.05 ? `due in ${remain.toFixed(1)}s` : "ready ▸",
            qx + qw - 12,
            y + cardH / 2,
            paint(ready ? GREEN : INK, ready ? 0.95 : 0.7),
            10,
            "right",
          );
        });
        if (!msgs.length)
          label(
            ctx,
            "empty — post a message",
            qx + 6,
            qTop + 24,
            paint(INK, 0.5),
            11,
            "left",
          );

        // Looper (center) — rotating ring
        const cx = qx + qw + (w - (qx + qw) - pad) * 0.34;
        const cy = h / 2 + 6,
          R = Math.min(h * 0.16, 42);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = paint(A3, 0.5);
        ctx.lineWidth = 3;
        const a0 = looping ? (t * 2) % TAU : 0;
        ctx.beginPath();
        ctx.arc(0, 0, R, a0, a0 + Math.PI * 1.5);
        ctx.stroke();
        // arrow head
        const ah = a0 + Math.PI * 1.5;
        ctx.fillStyle = paint(A3, 0.8);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ah) * R, Math.sin(ah) * R);
        ctx.lineTo(Math.cos(ah - 0.3) * (R - 7), Math.sin(ah - 0.3) * (R - 7));
        ctx.lineTo(Math.cos(ah - 0.3) * (R + 7), Math.sin(ah - 0.3) * (R + 7));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        label(ctx, "Looper", cx, cy - 2, paint(A3, 0.95), 11, "center", "600");
        label(
          ctx,
          looping ? "loop()" : "paused",
          cx,
          cy + 13,
          paint(INK, 0.75),
          9,
          "center",
        );

        // Handler box (right)
        const hxW = Math.min(w * 0.2, 110),
          hx = w - pad - hxW,
          hy = cy - 30;
        box(ctx, hx, hy, hxW, 60, 10, paint(A2, 0.08), paint(A2, 0.5), 1.3);
        label(
          ctx,
          "Handler",
          hx + hxW / 2,
          hy + 16,
          paint(A2, 0.95),
          11,
          "center",
          "600",
        );
        label(
          ctx,
          "dispatchMessage()",
          hx + hxW / 2,
          hy + 38,
          paint(INK, 0.75),
          9,
          "center",
        );

        // dispatching message flying queue→looper→handler
        if (dispatch) {
          const p = clamp((t - dispatch.t0) / 0.7, 0, 1);
          const e = easeInOut(p);
          const sx = qx + qw / 2,
            sy = qTop + 8 + cardH / 2;
          const mx = cx,
            my = cy;
          const ex = hx + hxW / 2,
            ey = hy + 30;
          let x: number, y: number;
          if (e < 0.5) {
            const k = e * 2;
            x = lerp(sx, mx, k);
            y = lerp(sy, my, k);
          } else {
            const k = (e - 0.5) * 2;
            x = lerp(mx, ex, k);
            y = lerp(my, ey, k);
          }
          ctx.fillStyle = paint(dispatch.msg.color, 0.95);
          ctx.beginPath();
          ctx.roundRect(x - 18, y - 12, 36, 24, 6);
          ctx.fill();
          label(ctx, dispatch.msg.label, x, y, "#15080f", 11, "center", "700");
        }
      },
      true,
    );

    if (postBtn)
      on(postBtn, "click", () => {
        add(0);
        updateNote();
      });
    if (delBtn)
      on(delBtn, "click", () => {
        add(2.5);
        updateNote();
      });
    if (toggleBtn)
      on(toggleBtn, "click", () => {
        looping = !looping;
        toggleBtn.textContent = looping ? "Pause loop" : "Resume loop";
        updateNote();
      });
    if (resetBtn)
      on(resetBtn, "click", () => {
        msgs = [];
        dispatch = null;
        dispatched = 0;
        seq = 1;
        now = 0;
        add(0.6);
        add(1.8);
        updateNote();
      });
  }
  function initVsync(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const syncEl = fig.querySelector<HTMLInputElement>(
      'input[data-ctl="synced"]',
    );
    const PULSE = 0.6; // seconds between vsync pulses (slowed for clarity)

    mount(
      canvas,
      (ctx, w, h, t) => {
        ctx.clearRect(0, 0, w, h);
        const synced = syncEl?.checked ?? true;
        const pad = Math.max(16, w * 0.05);

        const intended = (Math.sin(t * 1.4) + 1) / 2;
        const lastPulseT = Math.floor(t / PULSE) * PULSE;
        const sampled = (Math.sin(lastPulseT * 1.4) + 1) / 2;
        const value = synced ? sampled : intended;

        // bar showing displayed value
        const barX = pad,
          barY = pad + 20,
          barW = w - pad * 2,
          barH = Math.min(h * 0.32, 90);
        label(
          ctx,
          "ValueAnimator output",
          barX,
          barY - 8,
          paint(INK, 0.7),
          10,
          "left",
        );
        box(ctx, barX, barY, barW, barH, 10, paint(A3, 0.05), paint(A3, 0.25), 1);
        const fillW = barW * value;
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        grad.addColorStop(0, paint(A1, 0.85));
        grad.addColorStop(1, paint(A2, 0.85));
        box(ctx, barX, barY, Math.max(8, fillW), barH, 10, grad);
        // faint "intended" marker
        const ix = barX + barW * intended;
        ctx.strokeStyle = paint(INK, 0.5);
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ix, barY);
        ctx.lineTo(ix, barY + barH);
        ctx.stroke();
        ctx.setLineDash([]);
        label(
          ctx,
          "intended",
          ix,
          barY + barH + 12,
          paint(INK, 0.6),
          9,
          "center",
        );

        // VSYNC pulse timeline at bottom
        const tlY = h - pad - 22;
        label(ctx, "VSYNC", barX, tlY - 14, paint(A1, 0.9), 10, "left", "600");
        const span = 3.0; // seconds visible
        const px = (sec: number) => barX + (sec / span) * barW;
        const startSec = t - span;
        ctx.strokeStyle = paint(INK, 0.25);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(barX, tlY);
        ctx.lineTo(barX + barW, tlY);
        ctx.stroke();
        for (let k = Math.ceil(startSec / PULSE); k * PULSE <= t; k++) {
          const sec = k * PULSE;
          const x = px(sec - startSec);
          const fresh = clamp(1 - (t - sec) / 0.25, 0, 1);
          ctx.strokeStyle = paint(A1, 0.4 + fresh * 0.5);
          ctx.lineWidth = fresh > 0 ? 2.4 : 1.4;
          ctx.beginPath();
          ctx.moveTo(x, tlY - 10 - fresh * 6);
          ctx.lineTo(x, tlY + 10);
          ctx.stroke();
          if (fresh > 0) {
            ctx.fillStyle = paint(A1, fresh);
            ctx.beginPath();
            ctx.arc(x, tlY - 16 - fresh * 6, 3, 0, TAU);
            ctx.fill();
          }
        }
        label(
          ctx,
          synced
            ? "synced — value steps once per pulse"
            : "unsynced — value drifts between pulses",
          barX + barW,
          tlY + 22,
          paint(synced ? GREEN : A2, 0.9),
          10,
          "right",
        );
      },
      true,
    );

    if (syncEl) on(syncEl, "change", () => {});
  }
  function initThreads(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;

    const CARRIERS = 3;
    type V = {
      state: "queued" | "running" | "parked";
      carrier: number;
      until: number;
      col: [number, number, number];
      id: number;
    };
    let vs: V[] = [];
    let carriers: (number | null)[] = new Array(CARRIERS).fill(null); // holds virtual id
    let lastReal = -1,
      clock = 0;

    const seed = () => {
      vs = Array.from({ length: 18 }, (_, i) => ({
        state: "queued" as const,
        carrier: -1,
        until: 0,
        col: mixRgb(A1, A3, Math.random()),
        id: i,
      }));
      carriers = new Array(CARRIERS).fill(null);
    };
    seed();

    mount(
      canvas,
      (ctx, w, h, t) => {
        if (lastReal < 0) lastReal = t;
        const dt = Math.min(t - lastReal, 0.05);
        lastReal = t;
        if (!reduce) clock += dt;

        // scheduler: free carriers pick a queued virtual
        for (let c = 0; c < CARRIERS; c++) {
          if (carriers[c] === null) {
            const cand = vs.find((v) => v.state === "queued");
            if (cand) {
              cand.state = "running";
              cand.carrier = c;
              cand.until = clock + 0.7 + Math.random() * 1.0;
              carriers[c] = cand.id;
            }
          }
        }
        // running -> parked (hit a suspend point); parked -> queued (woke)
        for (const v of vs) {
          if (v.state === "running" && clock >= v.until) {
            v.state = "parked";
            carriers[v.carrier] = null;
            v.carrier = -1;
            v.until = clock + 0.6 + Math.random() * 1.2;
          } else if (v.state === "parked" && clock >= v.until) {
            v.state = "queued";
          }
        }

        ctx.clearRect(0, 0, w, h);
        const pad = Math.max(14, w * 0.05);

        // carriers row (platform threads)
        label(
          ctx,
          "Platform threads (carriers)",
          pad,
          pad,
          paint(A1, 0.9),
          11,
          "left",
          "600",
        );
        const cw = (w - pad * 2 - 16 * (CARRIERS - 1)) / CARRIERS,
          cy = pad + 14,
          chh = Math.min(h * 0.28, 78);
        for (let c = 0; c < CARRIERS; c++) {
          const cx = pad + c * (cw + 16);
          const occupied = carriers[c] !== null;
          box(
            ctx,
            cx,
            cy,
            cw,
            chh,
            12,
            paint(A1, occupied ? 0.1 : 0.04),
            paint(A1, occupied ? 0.6 : 0.25),
            1.3,
          );
          label(
            ctx,
            `carrier ${c + 1}`,
            cx + cw / 2,
            cy + 14,
            paint(A1, 0.85),
            10,
            "center",
          );
          if (occupied) {
            const v = vs.find((x) => x.id === carriers[c]);
            if (v) {
              ctx.fillStyle = paint(v.col, 0.95);
              ctx.beginPath();
              ctx.arc(cx + cw / 2, cy + chh / 2 + 8, 12, 0, TAU);
              ctx.fill();
              label(
                ctx,
                `VT${v.id}`,
                cx + cw / 2,
                cy + chh / 2 + 8,
                "#15080f",
                9,
                "center",
                "700",
              );
            }
          } else {
            label(
              ctx,
              "idle",
              cx + cw / 2,
              cy + chh / 2 + 8,
              paint(INK, 0.5),
              10,
              "center",
            );
          }
        }

        // pool of virtual threads
        const poolY = cy + chh + 24;
        label(
          ctx,
          "Virtual threads — queued ● and parked ○",
          pad,
          poolY - 8,
          paint(A3, 0.85),
          10,
          "left",
        );
        const pool = vs.filter((v) => v.state !== "running");
        const cols = Math.max(6, Math.floor((w - pad * 2) / 40));
        pool.forEach((v, i) => {
          const r = i % cols,
            rr = Math.floor(i / cols);
          const x = pad + 16 + r * 40,
            y = poolY + 16 + rr * 34;
          if (y > h - 10) return;
          const parked = v.state === "parked";
          ctx.globalAlpha = parked ? 0.4 : 1;
          ctx.fillStyle = paint(v.col, parked ? 0.3 : 0.9);
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, TAU);
          if (parked) {
            ctx.strokeStyle = paint(v.col, 0.7);
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else ctx.fill();
          ctx.globalAlpha = 1;
        });
      },
      true,
    );
  }
  function initModels(fig: HTMLElement) {
    const tabs = Array.from(
      fig.querySelectorAll<HTMLButtonElement>("[data-model]"),
    );
    const panes = Array.from(
      fig.querySelectorAll<HTMLElement>("[data-model-pane]"),
    );
    tabs.forEach((b) =>
      on(b, "click", () => {
        const id = b.dataset.model;
        tabs.forEach((x) => x.classList.toggle("is-active", x === b));
        panes.forEach((p) =>
          p.classList.toggle("is-active", p.dataset.modelPane === id),
        );
      }),
    );
  }
  function initStateMachine(fig: HTMLElement) {
    type St = { badge: string; label: string; desc: string };
    const states: St[] = [
      {
        badge: "label 0",
        label: "Enter helloWorld()",
        desc: "First call. The function checks its continuation's label — it's 0 — and prepares to call delay().",
      },
      {
        badge: "suspend",
        label: "Set label = 1, call delay()",
        desc: "Before suspending it sets label = 1 (where to resume), then delay() returns COROUTINE_SUSPENDED. The function returns — the thread is now FREE.",
      },
      {
        badge: "resume",
        label: "Resumed via continuation",
        desc: "~1s later the timer invokes continuation.invokeSuspend(). It re-enters helloWorld; label is 1, so it jumps past delay().",
      },
      {
        badge: "label 1",
        label: 'Return "Hello World!"',
        desc: "The final state returns the result to the original caller through the continuation. The coroutine is complete.",
      },
    ];

    fig.innerHTML = `
      <div class="mt-sm">
        <div class="mt-sm__states">
          ${states
            .map(
              (s, i) => `
            <div class="mt-sm__state" data-state="${i}">
              <span class="mt-sm__badge">${s.badge}</span>
              <div>
                <div class="mt-sm__label">${s.label}</div>
                <div class="mt-sm__desc">${s.desc}</div>
              </div>
            </div>`,
            )
            .join("")}
        </div>
        <div class="mt-sm__side">
          <div class="mt-sm__cont">
            <div class="mt-sm__cont-title">Continuation</div>
            <div class="mt-sm__field"><span class="mt-sm__field-k">label</span><span class="mt-sm__field-v" data-f="label">0</span></div>
            <div class="mt-sm__field"><span class="mt-sm__field-k">result</span><span class="mt-sm__field-v" data-f="result">null</span></div>
          </div>
          <div class="mt-sm__thread is-busy" data-thread>
            <span class="mt-sm__dot"></span><span data-thread-label>Thread: busy (running coroutine)</span>
          </div>
          <div class="mt-sm__actions">
            <button class="mt-btn" data-action="step">Step ▶</button>
            <button class="mt-btn mt-btn--ghost" data-action="reset">Reset</button>
          </div>
        </div>
      </div>`;

    const stateEls = Array.from(
      fig.querySelectorAll<HTMLElement>(".mt-sm__state"),
    );
    const labelF = fig.querySelector<HTMLElement>('[data-f="label"]')!;
    const resultF = fig.querySelector<HTMLElement>('[data-f="result"]')!;
    const thread = fig.querySelector<HTMLElement>("[data-thread]")!;
    const threadLabel = fig.querySelector<HTMLElement>("[data-thread-label]")!;
    const stepBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="step"]',
    )!;
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    )!;

    // per-step continuation + thread snapshots
    const snap = [
      {
        label: "0",
        result: "null",
        busy: true,
        tl: "Thread: busy (running coroutine)",
      },
      {
        label: "1",
        result: "null",
        busy: false,
        tl: "Thread: FREE — doing other work while we wait",
      },
      {
        label: "1",
        result: "Unit",
        busy: true,
        tl: "Thread: busy again (resumed)",
      },
      { label: "1", result: '"Hello World!"', busy: true, tl: "Thread: done" },
    ];

    let i = -1;
    const apply = (idx: number) => {
      stateEls.forEach((el, k) => {
        el.classList.toggle("is-active", k === idx);
        el.classList.toggle("is-done", k < idx);
      });
      if (idx < 0) {
        labelF.textContent = "0";
        resultF.textContent = "null";
        thread.className = "mt-sm__thread is-busy";
        threadLabel.textContent = "Thread: idle — press Step to begin";
        stepBtn.disabled = false;
        stepBtn.textContent = "Step ▶";
        return;
      }
      const s = snap[idx];
      labelF.textContent = s.label;
      resultF.textContent = s.result;
      thread.className = `mt-sm__thread ${s.busy ? "is-busy" : "is-free"}`;
      threadLabel.textContent = s.tl;
      const last = idx >= states.length - 1;
      stepBtn.disabled = last;
      stepBtn.textContent = last ? "Done ✓" : "Step ▶";
    };
    apply(-1);
    on(stepBtn, "click", () => {
      if (i < states.length - 1) {
        i++;
        apply(i);
      }
    });
    on(resetBtn, "click", () => {
      i = -1;
      apply(-1);
    });
  }
  function initDelaySleep(fig: HTMLElement) {
    const canvas = fig.querySelector<HTMLCanvasElement>("[data-canvas]");
    if (!canvas) return;
    const playBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="play"]',
    );
    const resetBtn = fig.querySelector<HTMLButtonElement>(
      '[data-action="reset"]',
    );
    const N = 5;
    let t0 = -1,
      nowT = 0;

    mount(
      canvas,
      (ctx, w, h, t) => {
        nowT = t;
        ctx.clearRect(0, 0, w, h);
        const elapsed = t0 >= 0 ? t - t0 : 0;
        const pad = Math.max(14, w * 0.05);
        const laneH = (h - pad * 3) / 2;

        const drawLane = (
          y: number,
          title: string,
          sub: string,
          col: [number, number, number],
          progressOf: (i: number) => number,
          free: boolean,
        ) => {
          label(ctx, title, pad, y - 6, paint(col, 0.95), 12, "left", "600");
          label(ctx, sub, w - pad, y - 6, paint(INK, 0.7), 10, "right");
          // thread indicator
          const tIndW = 90;
          box(
            ctx,
            pad,
            y + 6,
            tIndW,
            20,
            6,
            paint(free ? GREEN : col, 0.16),
            paint(free ? GREEN : col, 0.5),
            1,
          );
          label(
            ctx,
            free ? "thread free" : "thread busy",
            pad + tIndW / 2,
            y + 16,
            paint(free ? GREEN : col, 0.95),
            9,
            "center",
          );
          // task bars
          const barX = pad + tIndW + 14,
            barW = w - pad - barX;
          const bh = (laneH - 36) / N - 4;
          for (let i = 0; i < N; i++) {
            const by = y + 32 + i * (bh + 4);
            box(ctx, barX, by, barW, bh, 4, paint(INK, 0.08));
            const p = clamp(progressOf(i), 0, 1);
            if (p > 0)
              box(ctx, barX, by, Math.max(2, barW * p), bh, 4, paint(col, 0.8));
            label(
              ctx,
              `task ${i + 1}`,
              barX + 4,
              by + bh / 2,
              paint(p >= 1 ? GREEN : INK, 0.85),
              9,
              "left",
            );
          }
        };

        // SLEEP: serial. Each task takes ~1s (incl. blocking sleep). Thread always busy.
        const sleepTaskDur = 1.0;
        const sleepProg = (i: number) =>
          (elapsed - i * sleepTaskDur) / sleepTaskDur;
        const sleepDone = elapsed >= N * sleepTaskDur;
        // DELAY: concurrent. All start together; each ~1s but overlapping → all done ~1.1s.
        const delayProg = (_i: number) => (elapsed - 0.1) / 1.0;
        const delayDone = elapsed >= 1.15;
        const delayFree = t0 >= 0 && elapsed > 0.1 && !delayDone;

        drawLane(
          pad,
          "Thread.sleep()",
          sleepDone
            ? "finished in 5.0s"
            : t0 >= 0
              ? `${elapsed.toFixed(1)}s`
              : "idle",
          A2,
          sleepProg,
          false,
        );
        drawLane(
          pad * 2 + laneH,
          "delay() (coroutines)",
          delayDone
            ? "finished in ~1.1s"
            : t0 >= 0
              ? `${elapsed.toFixed(1)}s`
              : "idle",
          GREEN,
          delayProg,
          delayFree,
        );
      },
      true,
    );

    if (playBtn)
      on(playBtn, "click", () => {
        t0 = nowT;
      });
    if (resetBtn)
      on(resetBtn, "click", () => {
        t0 = -1;
      });
  }
  function initYouTube(el: HTMLElement) {
    const btn = el.querySelector<HTMLButtonElement>("[data-yt-play]");
    const id = el.dataset.videoId;
    if (!btn || !id) return;
    on(btn, "click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&start=168`;
      iframe.title = "Multi-Threading — full talk";
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
    .querySelectorAll<HTMLElement>('[data-demo="registers"]')
    .forEach(initRegisters);
  root
    .querySelectorAll<HTMLElement>('[data-demo="contextswitch"]')
    .forEach(initContextSwitch);
  root.querySelectorAll<HTMLElement>('[data-demo="fork"]').forEach(initFork);
  root
    .querySelectorAll<HTMLElement>('[data-demo="memory"]')
    .forEach(initMemory);
  root
    .querySelectorAll<HTMLElement>('[data-demo="threadlocal"]')
    .forEach(initThreadLocal);
  root
    .querySelectorAll<HTMLElement>('[data-demo="messagequeue"]')
    .forEach(initMessageQueue);
  root.querySelectorAll<HTMLElement>('[data-demo="vsync"]').forEach(initVsync);
  root
    .querySelectorAll<HTMLElement>('[data-demo="threads"]')
    .forEach(initThreads);
  root
    .querySelectorAll<HTMLElement>('[data-demo="models"]')
    .forEach(initModels);
  root
    .querySelectorAll<HTMLElement>('[data-demo="statemachine"]')
    .forEach(initStateMachine);
  root
    .querySelectorAll<HTMLElement>('[data-demo="delaysleep"]')
    .forEach(initDelaySleep);
  root
    .querySelectorAll<HTMLElement>('[data-demo="youtube"]')
    .forEach(initYouTube);
  initRail();
  highlightPresentationCode(root);
}

/* run on first load and after every client-side navigation */
document.addEventListener("astro:page-load", initMT);
document.addEventListener("astro:before-swap", destroyMT);

// Fallback for a non-transition initial load.
if (document.readyState !== "loading") initMT();
else document.addEventListener("DOMContentLoaded", initMT);
