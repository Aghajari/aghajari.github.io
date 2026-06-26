import type { CollectionEntry } from "astro:content";
import covers from "@data/publication-covers.json";

export type CoverMeta = {
  local: string;
  remote: string;
  alt: string;
};

export function getPublicationCover(
  entry:
    | CollectionEntry<"publications">
    | { id: string; data: { title: string; coverImage?: string } },
): CoverMeta | null {
  if (entry.data.coverImage) {
    return {
      local: entry.data.coverImage,
      remote: entry.data.coverImage,
      alt: entry.data.title,
    };
  }
  const meta = (covers as Record<string, CoverMeta>)[entry.id];
  if (!meta?.local) return null;
  return { ...meta, alt: entry.data.title };
}
