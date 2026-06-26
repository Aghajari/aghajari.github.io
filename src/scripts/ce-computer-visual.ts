export type Rgb = [number, number, number];
export type VisualAccents = { a1: Rgb; a2: Rgb; a3: Rgb };

export type VisualOptions = {
  reduce?: boolean;
  anchorX?: number;
  anchorY?: number;
  scale?: number;
  /** Smaller canvases (talk cards) — larger frame, shorter lines, fitted text */
  compact?: boolean;
  /** Hero canvas — tighter vertical sizing on narrow viewports */
  hero?: boolean;
};

export type ViewportMode = "hero" | "card";

/** Responsive laptop placement for hero canvases and talk-card thumbnails */
export function layoutForViewport(
  w: number,
  h: number,
  mode: ViewportMode = "hero",
) {
  if (mode === "card") {
    const scale = w < 320 ? 0.72 : 0.78;
    return { anchorX: 0.5, anchorY: 0.5, scale, compact: true };
  }

  // Mobile hero: canvas is a bottom art strip — keep laptop centered in that band
  if (w < 720) {
    const scale = w < 380 ? 0.9 : 0.92;
    return { anchorX: 0.5, anchorY: 0.56, scale, compact: true };
  }
  if (w < 960)
    return { anchorX: 0.7, anchorY: 0.52, scale: 0.44, compact: false };
  return { anchorX: 0.78, anchorY: 0.5, scale: 0.48, compact: false };
}

function computeSize(
  w: number,
  h: number,
  scale: number,
  compact: boolean,
  hero?: boolean,
) {
  // Hero bottom strip on mobile (short canvas)
  if (compact && hero && h < 320) {
    return Math.min(w * 0.78, h * 0.86, Math.min(w, h) * scale);
  }
  if (compact && hero && w < 720) {
    return Math.min(w * 0.8, h * 0.86, Math.min(w, h) * scale);
  }
  if (compact) {
    return Math.min(w * 0.72, h * 0.82, Math.min(w, h) * scale);
  }
  return Math.min(w, h) * scale;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rgba = (c: Rgb, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(lerp(a[0], b[0], t)),
  Math.round(lerp(a[1], b[1], t)),
  Math.round(lerp(a[2], b[2], t)),
];

function isLightTheme() {
  return document.documentElement.getAttribute("data-theme") === "light";
}

type TokenRole =
  | "prompt"
  | "cmd"
  | "flag"
  | "path"
  | "num"
  | "out"
  | "sub"
  | "plain";

type CodeToken = { text: string; role: TokenRole };
type CodeLine = { indent: number; tokens: CodeToken[] };

const CODE_LINES: CodeLine[] = [
  {
    indent: 0,
    tokens: [
      { text: "$ ", role: "prompt" },
      { text: "gcc", role: "cmd" },
      { text: " ", role: "plain" },
      { text: "main.c", role: "path" },
      { text: " ", role: "plain" },
      { text: "-o", role: "flag" },
      { text: " ", role: "plain" },
      { text: "app", role: "path" },
    ],
  },
  {
    indent: 0,
    tokens: [
      { text: "$ ", role: "prompt" },
      { text: "./app", role: "path" },
    ],
  },
  {
    indent: 0,
    tokens: [
      { text: "exit ", role: "out" },
      { text: "0", role: "num" },
    ],
  },
  {
    indent: 0,
    tokens: [
      { text: "$ ", role: "prompt" },
      { text: "git", role: "cmd" },
      { text: " ", role: "plain" },
      { text: "push", role: "sub" },
      { text: " ", role: "plain" },
      { text: "origin", role: "path" },
      { text: " ", role: "plain" },
      { text: "main", role: "path" },
    ],
  },
];

const CODE_LINES_COMPACT: CodeLine[] = [
  {
    indent: 0,
    tokens: [
      { text: "$ ", role: "prompt" },
      { text: "gcc", role: "cmd" },
      { text: " ", role: "plain" },
      { text: "main.c", role: "path" },
    ],
  },
  {
    indent: 0,
    tokens: [
      { text: "$ ", role: "prompt" },
      { text: "./app", role: "path" },
    ],
  },
  {
    indent: 0,
    tokens: [
      { text: "exit ", role: "out" },
      { text: "0", role: "num" },
    ],
  },
  {
    indent: 0,
    tokens: [
      { text: "$ ", role: "prompt" },
      { text: "git", role: "cmd" },
      { text: " ", role: "plain" },
      { text: "push", role: "sub" },
    ],
  },
];

function lineText(line: CodeLine) {
  return line.tokens.map((t) => t.text).join("");
}

type SyntaxPalette = Record<TokenRole, string>;

function buildSyntaxPalette(
  accents: VisualAccents,
  textDim: Rgb,
  textBright: Rgb,
  active: boolean,
  light: boolean,
): SyntaxPalette {
  const { a1, a2, a3 } = accents;
  const a = (n: number) => (active ? n : n * (light ? 0.62 : 0.58));

  if (light) {
    // Vivid terminal palette — readable on the dark screen inset in light page theme
    return {
      prompt: rgba(mixRgb([36, 148, 88], a1, 0.22), a(0.98)),
      cmd: rgba(mixRgb([148, 102, 232], a2, 0.18), a(0.96)),
      flag: rgba(mixRgb([228, 138, 58], a3, 0.12), a(0.94)),
      path: rgba(mixRgb([78, 148, 228], a1, 0.15), a(0.95)),
      num: rgba(mixRgb([232, 168, 72], a2, 0.15), a(0.94)),
      out: rgba(mixRgb([210, 212, 222], a1, 0.08), a(0.9)),
      sub: rgba(mixRgb([186, 118, 232], a3, 0.12), a(0.93)),
      plain: rgba(active ? [188, 192, 202] : [118, 122, 132], a(0.78)),
    };
  }

  return {
    prompt: rgba(mixRgb(a1, [110, 198, 130], 0.35), a(0.96)),
    cmd: rgba(mixRgb(a2, [186, 148, 255], 0.28), a(0.94)),
    flag: rgba(mixRgb(a3, [255, 176, 112], 0.22), a(0.9)),
    path: rgba(mixRgb(a1, [132, 196, 255], 0.38), a(0.92)),
    num: rgba(mixRgb(a2, [255, 204, 120], 0.32), a(0.92)),
    out: rgba(mixRgb(textBright, a1, 0.15), a(0.86)),
    sub: rgba(mixRgb(a3, [196, 158, 255], 0.28), a(0.88)),
    plain: rgba(active ? textBright : textDim, a(0.72)),
  };
}

function drawTokens(
  ctx: CanvasRenderingContext2D,
  tokens: CodeToken[],
  x: number,
  y: number,
  palette: SyntaxPalette,
) {
  for (const tok of tokens) {
    ctx.fillStyle = palette[tok.role];
    ctx.fillText(tok.text, x, y);
    x += ctx.measureText(tok.text).width;
  }
  return x;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  lines: CodeLine[],
  maxW: number,
  preferred: number,
) {
  let size = preferred;
  const min = 5.5;
  ctx.font = `${size}px ui-monospace, "SF Mono", "Cascadia Code", monospace`;
  const widest = Math.max(
    ...lines.map((l) => ctx.measureText(lineText(l)).width),
  );
  if (widest > maxW && widest > 0) size = Math.max(min, size * (maxW / widest));
  return size;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawLaptop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  s: number,
  t: number,
  accents: VisualAccents,
  reduce: boolean,
  compact: boolean,
  light: boolean,
) {
  const { a1, a2, a3 } = accents;
  const body = light
    ? mixRgb(a3, [36, 40, 54], 0.55)
    : mixRgb(a3, [14, 18, 30], 0.78);
  const bezel = mixRgb(body, light ? [72, 78, 96] : [40, 46, 62], 0.35);
  const screenBg = mixRgb(a3, light ? [10, 12, 20] : [6, 8, 14], 0.88);
  const textDim = mixRgb(a3, [130, 138, 158], 0.55);
  const textBright = mixRgb(a1, [230, 228, 220], 0.35);

  const bob = reduce ? 0 : Math.sin(t * 1.2) * s * 0.012;

  ctx.save();
  ctx.translate(cx, cy + bob);

  const lidW = s * 0.92;
  const lidH = s * 0.54;
  const lidX = -lidW / 2;
  const lidY = -s * 0.42;
  const r = s * 0.04;

  // Lid / screen housing
  roundRect(ctx, lidX, lidY, lidW, lidH, r);
  ctx.fillStyle = rgba(body, 1);
  ctx.fill();
  ctx.strokeStyle = rgba(bezel, 0.55);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Screen inset
  const pad = s * 0.045;
  const sx = lidX + pad;
  const sy = lidY + pad;
  const sw = lidW - pad * 2;
  const sh = lidH - pad * 2 - s * 0.02;
  roundRect(ctx, sx, sy, sw, sh, s * 0.018);
  ctx.fillStyle = rgba(screenBg, 1);
  ctx.fill();

  // Screen glow pulse
  const pulse = reduce ? 0.5 : 0.5 + Math.sin(t * 2.4) * 0.5;
  const glow = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
  glow.addColorStop(0, rgba(a1, 0.06 + pulse * 0.04));
  glow.addColorStop(0.5, rgba(a2, 0.03));
  glow.addColorStop(1, rgba(a3, 0.05));
  ctx.fillStyle = glow;
  ctx.fillRect(sx, sy, sw, sh);

  // Window chrome dots
  const dotY = sy + sh * 0.1;
  const dotR = Math.max(1.5, sh * 0.035);
  [a1, a2, a3].forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(sx + sw * 0.08 + i * sw * 0.07, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = rgba(c, 0.55);
    ctx.fill();
  });

  const lines = compact ? CODE_LINES_COMPACT : CODE_LINES;

  // Terminal lines — font scaled to stay inside the screen
  const fontSize = fitFontSize(
    ctx,
    lines,
    sw * 0.88,
    compact ? s * 0.062 : s * 0.048,
  );
  ctx.font = `${fontSize}px ui-monospace, "SF Mono", "Cascadia Code", monospace`;
  ctx.textBaseline = "top";
  const lineH = fontSize * 1.4;
  const textX = sx + sw * 0.06;
  const textY = sy + sh * 0.24;
  const activeLine = reduce ? 1 : Math.floor(t * 0.55) % lines.length;
  const cursorOn = reduce || Math.floor(t * 2.8) % 2 === 0;

  ctx.save();
  roundRect(ctx, sx, sy, sw, sh, s * 0.018);
  ctx.clip();

  lines.forEach((line, i) => {
    const ly = textY + i * lineH;
    if (ly + lineH > sy + sh - s * 0.02) return;
    const active = i === activeLine;
    const x0 = textX + line.indent * fontSize * 0.8;
    const palette = buildSyntaxPalette(
      accents,
      textDim,
      textBright,
      active,
      light,
    );
    const x = drawTokens(ctx, line.tokens, x0, ly, palette);

    if (active && cursorOn) {
      ctx.fillStyle = palette.prompt;
      ctx.fillRect(x + 1, ly + 1, fontSize * 0.45, fontSize - 1);
    }
  });

  ctx.restore();

  // Data packets drifting across screen
  if (!reduce) {
    for (let i = 0; i < 4; i++) {
      const phase = i * 1.7;
      const px = sx + ((t * 28 + phase * 40) % (sw + 20)) - 10;
      const py = sy + sh * (0.35 + (i % 3) * 0.18);
      ctx.fillStyle = rgba(i % 2 ? a2 : a3, 0.22 + (i % 3) * 0.08);
      ctx.fillRect(px, py, s * 0.018, s * 0.004);
    }
  }

  // Keyboard deck
  const baseY = lidY + lidH + s * 0.015;
  const baseW = lidW * 1.06;
  const baseH = s * 0.1;
  ctx.beginPath();
  ctx.moveTo(-baseW * 0.42, baseY);
  ctx.lineTo(baseW * 0.42, baseY);
  ctx.lineTo(baseW * 0.48, baseY + baseH);
  ctx.lineTo(-baseW * 0.48, baseY + baseH);
  ctx.closePath();
  ctx.fillStyle = rgba(mixRgb(body, [30, 34, 48], 0.4), 0.95);
  ctx.fill();
  ctx.strokeStyle = rgba(bezel, 0.4);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Trackpad
  const tpW = s * 0.18;
  const tpH = s * 0.035;
  roundRect(ctx, -tpW / 2, baseY + baseH * 0.55, tpW, tpH, s * 0.006);
  ctx.fillStyle = rgba(bezel, 0.35);
  ctx.fill();

  // Hinge highlight
  ctx.fillStyle = rgba(a1, 0.12 + pulse * 0.08);
  ctx.fillRect(lidX + lidW * 0.08, baseY - s * 0.006, lidW * 0.84, s * 0.008);

  ctx.restore();
}

export function renderComputer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  accents: VisualAccents,
  options: VisualOptions = {},
) {
  const reduce = options.reduce ?? false;
  const compact = options.compact ?? false;
  const hero = options.hero ?? false;
  const light = isLightTheme();
  const anchorX = options.anchorX ?? 0.5;
  const anchorY = options.anchorY ?? 0.52;
  const scale = options.scale ?? (compact ? 0.78 : 0.36);

  ctx.clearRect(0, 0, w, h);

  const cx = w * anchorX;
  const cy = h * anchorY;
  const s = computeSize(w, h, scale, compact, hero);

  const glow = ctx.createRadialGradient(cx, cy - s * 0.06, 0, cx, cy, s * 1.4);
  glow.addColorStop(0, rgba(accents.a1, 0.1));
  glow.addColorStop(0.45, rgba(accents.a3, 0.05));
  glow.addColorStop(1, rgba(accents.a3, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, rgba(accents.a1, 0.05));
  wash.addColorStop(1, rgba(accents.a3, 0.05));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  drawLaptop(ctx, cx, cy, s, t, accents, reduce, compact, light);

  if (!reduce) {
    const pulse = 0.5 + Math.sin(t * 1.6) * 0.5;
    const ring = ctx.createRadialGradient(cx, cy, s * 0.15, cx, cy, s * 1.05);
    ring.addColorStop(0, rgba(accents.a2, 0));
    ring.addColorStop(0.7, rgba(accents.a2, 0.035 * pulse));
    ring.addColorStop(1, rgba(accents.a2, 0));
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, w, h);
  }
}

/** @deprecated Use renderComputer */
export const renderGradCap = renderComputer;
