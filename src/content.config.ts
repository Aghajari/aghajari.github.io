import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * Publications — premium PREVIEW pages for Medium articles.
 * The full article always lives on Medium; we only show a curated preview.
 * `theme` drives a topic-adaptive hero so each page feels unique.
 */
const publications = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/publications",
  }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    summary: z.string(),
    mediumUrl: z.string().url(),
    date: z.coerce.date(),
    readingTime: z.number(), // minutes
    theme: z.enum([
      "shader", // OpenGL / shaders / liquid glass
      "motion", // animation internals
      "compose", // jetpack compose
      "systems", // kernels / classloaders / low-level
      "audio", // piano / midi
    ]),
    series: z.string().optional(),
    keyIdeas: z.array(z.string()),
    technologies: z.array(z.string()),
    coverImage: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

/**
 * Presentations — curated collection of talks.
 * Detail pages are intentionally placeholder for now; the architecture
 * supports a fully custom layout per talk via `layout` + future content.
 */
const presentations = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/presentations",
  }),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    date: z.coerce.date().optional(),
    topic: z.string(),
    description: z.string(),
    theme: z
      .enum(["shader", "motion", "compose", "systems", "audio", "academic"])
      .default("motion"),
    technologies: z.array(z.string()).default([]),
    status: z.enum(["published", "coming-soon"]).default("coming-soon"),
    slidesUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    // Optional metadata for richer cards / bespoke pages
    duration: z.string().optional(),
    language: z.string().optional(),
    recorded: z.boolean().default(false),
    speakers: z.array(z.string()).default([]),
    // When true, this talk has its own hand-built page at
    // /presentations/<id>.astro and is excluded from the generic [id] route.
    custom: z.boolean().default(false),
  }),
});

export const collections = { publications, presentations };
