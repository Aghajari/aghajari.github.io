/**
 * Topic themes drive the adaptive heroes across publications and presentations.
 * Each theme has its own accent so an OpenGL article and a Compose article
 * never feel identical.
 */
export type ThemeKey =
  | "shader"
  | "motion"
  | "compose"
  | "systems"
  | "audio"
  | "academic";

export type ThemeMeta = {
  label: string;
  /** gradient stops */
  c1: string;
  c2: string;
  c3: string;
  /** short descriptor used in eyebrows */
  domain: string;
};

export const themes: Record<ThemeKey, ThemeMeta> = {
  shader: {
    label: "Graphics & Shaders",
    c1: "#6d6af0",
    c2: "#8b5cf6",
    c3: "#22d3ee",
    domain: "OpenGL / GPU",
  },
  motion: {
    label: "Motion & Animation",
    c1: "#f0a6ca",
    c2: "#b388ff",
    c3: "#6d6af0",
    domain: "Animation",
  },
  compose: {
    label: "Jetpack Compose",
    c1: "#3ddc84",
    c2: "#2dd4bf",
    c3: "#22d3ee",
    domain: "Android UI",
  },
  systems: {
    label: "Systems & Internals",
    c1: "#fb923c",
    c2: "#f43f5e",
    c3: "#8b5cf6",
    domain: "Low-level",
  },
  audio: {
    label: "Audio & MIDI",
    c1: "#22d3ee",
    c2: "#38bdf8",
    c3: "#818cf8",
    domain: "Sound",
  },
  academic: {
    label: "Academia & Mentorship",
    c1: "#d8a657", // warm gold
    c2: "#c47b5a", // terracotta
    c3: "#7c9a86", // sage
    domain: "Mentorship",
  },
};

export function themeGradient(key: ThemeKey): string {
  const t = themes[key];
  return `linear-gradient(120deg, ${t.c1}, ${t.c2} 50%, ${t.c3})`;
}

export function themeVars(key: ThemeKey): string {
  const t = themes[key];
  return `--t1:${t.c1};--t2:${t.c2};--t3:${t.c3};`;
}

export function formatDate(date?: Date): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}
