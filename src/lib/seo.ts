import type { CollectionEntry } from "astro:content";
import { profile } from "@data/profile";

export const SITE_ORIGIN = "https://aghajari.github.io";

export function absoluteUrl(path: string, origin = SITE_ORIGIN) {
  return new URL(path, origin).href;
}

export function youtubeVideoId(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be"))
      return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {
    return null;
  }
  return null;
}

export function youtubeOgImage(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string) {
  return `https://www.youtube.com/embed/${videoId}`;
}

type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
  origin = SITE_ORIGIN,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, origin),
    })),
  };
}

export function personJsonLd(origin = SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    worksFor: { "@type": "Organization", name: profile.company },
    url: origin,
    sameAs: [
      profile.socials.github,
      profile.socials.medium,
      profile.socials.linkedin,
    ],
  };
}

export function websiteJsonLd(origin = SITE_ORIGIN) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: profile.name,
    url: origin,
    description: profile.description,
    author: { "@type": "Person", name: profile.name },
  };
}

type PresentationSeoInput = {
  id: string;
  title: string;
  description: string;
  event: string;
  topic: string;
  date?: Date;
  duration?: string;
  language?: string;
  videoUrl?: string;
  speakers?: string[];
  technologies?: string[];
};

export function presentationJsonLd(
  talk: PresentationSeoInput,
  pagePath: string,
  origin = SITE_ORIGIN,
) {
  const pageUrl = absoluteUrl(pagePath, origin);
  const videoId = talk.videoUrl ? youtubeVideoId(talk.videoUrl) : null;
  const image = videoId
    ? youtubeOgImage(videoId)
    : absoluteUrl("/og-default.svg", origin);
  const published = talk.date?.toISOString();

  const crumbs = breadcrumbJsonLd(
    [
      { name: "Home", path: "/" },
      { name: "Presentations", path: "/presentations" },
      { name: talk.title, path: pagePath },
    ],
    origin,
  );

  const learningResource = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: talk.title,
    description: talk.description,
    url: pageUrl,
    image,
    inLanguage: talk.language ?? "en",
    learningResourceType: "Presentation",
    educationalLevel: "Professional",
    author: (talk.speakers?.length ? talk.speakers : [profile.name]).map(
      (name) => ({
        "@type": "Person",
        name,
      }),
    ),
    about: talk.topic,
    keywords: talk.technologies?.join(", "),
    ...(published && { datePublished: published }),
    isPartOf: {
      "@type": "Event",
      name: talk.event,
      ...(published && { startDate: published }),
    },
  };

  const schemas: Record<string, unknown>[] = [crumbs, learningResource];

  if (videoId && talk.videoUrl) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: talk.title,
      description: talk.description,
      thumbnailUrl: image,
      uploadDate: published,
      duration: talk.duration ? isoDurationFromLabel(talk.duration) : undefined,
      contentUrl: talk.videoUrl,
      embedUrl: youtubeEmbedUrl(videoId),
      inLanguage: talk.language ?? "en",
      publisher: {
        "@type": "Person",
        name: profile.name,
        url: origin,
      },
    });
  }

  return schemas;
}

export function publicationJsonLd(
  entry: CollectionEntry<"publications">,
  coverImage?: string,
  origin = SITE_ORIGIN,
) {
  const { data, id } = entry;
  const pagePath = `/publications/${id}`;
  const pageUrl = absoluteUrl(pagePath, origin);
  const image = coverImage
    ? absoluteUrl(coverImage, origin)
    : absoluteUrl("/og-default.svg", origin);
  const published = data.date.toISOString();

  return [
    breadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: "Publications", path: "/publications" },
        { name: data.title, path: pagePath },
      ],
      origin,
    ),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.title,
      description: data.summary,
      image,
      datePublished: published,
      author: { "@type": "Person", name: profile.name, url: origin },
      publisher: { "@type": "Person", name: profile.name },
      mainEntityOfPage: pageUrl,
      url: pageUrl,
      keywords: data.technologies.join(", "),
      isAccessibleForFree: false,
      hasPart: {
        "@type": "WebPage",
        url: data.mediumUrl,
        name: "Full article on Medium",
      },
    },
  ];
}

export function presentationSeoProps(
  entry: CollectionEntry<"presentations">,
  origin = SITE_ORIGIN,
) {
  const { data, id } = entry;
  const pagePath = `/presentations/${id}`;
  const videoId = data.videoUrl ? youtubeVideoId(data.videoUrl) : null;

  return {
    title: data.title,
    description: data.description,
    type: "article" as const,
    image: videoId ? youtubeOgImage(videoId) : undefined,
    publishedTime: data.date?.toISOString(),
    jsonLd: presentationJsonLd(
      {
        id,
        title: data.title,
        description: data.description,
        event: data.event,
        topic: data.topic,
        date: data.date,
        duration: data.duration,
        language: data.language,
        videoUrl: data.videoUrl,
        speakers: data.speakers,
        technologies: data.technologies,
      },
      pagePath,
      origin,
    ),
  };
}

/** Best-effort ISO 8601 duration from labels like "1h 05m" or "35 min". */
function isoDurationFromLabel(label: string) {
  const h = label.match(/(\d+)\s*h/i);
  const m = label.match(/(\d+)\s*m/i);
  const hours = h ? Number(h[1]) : 0;
  const mins = m ? Number(m[1]) : 0;
  if (!hours && !mins) return undefined;
  let out = "PT";
  if (hours) out += `${hours}H`;
  if (mins) out += `${mins}M`;
  return out;
}
