export const profile = {
  name: "AmirHossein Aghajari",
  shortName: "AmirHossein",
  monogram: "AA",
  role: "Android Chapter Lead",
  company: "Cafe Bazaar",
  location: "Tehran, Iran",
  tagline: "Engineering the way things move.",
  // SEO / meta
  description:
    "AmirHossein Aghajari — Android Chapter Lead at Cafe Bazaar. Leading architecture, quality, and performance on a large Android product — open-source author and writer on systems, concurrency, and the stack underneath.",
  // Long-form intro statement
  statement:
    "I lead Android engineering at scale — standards, architecture, and how teams ship reliable software. I've owned large codebases, contributed upstream to AndroidX, and gone deep on concurrency, performance, and rendering when the work demands it. Open source and writing are how I pressure-test what I learn.",
  heroLead:
    "I'm {name} — {role} at {company}. Leading Android at scale, contributing in the open, and writing about what I learn — from thread schedulers to the pixels on screen.",
  // Hero rotating descriptors
  facets: [],
  socials: {
    github: "https://github.com/aghajari",
    medium: "https://medium.com/@aghajari",
    linkedin: "https://www.linkedin.com/in/amir-aghajari/",
    telegram: "https://t.me/theAghajari",
    email: "mailto:amirhossein.aghajari.82@gmail.com",
  },
  githubUser: "aghajari",
};

export const homeJourney = {
  cta: {
    href: "/experience",
    label: "Follow the full journey",
    hint: "Where I was, year by year",
  },
};

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Experience", href: "/experience" },
  { label: "Open Source", href: "/open-source" },
  { label: "Publications", href: "/publications" },
  { label: "Presentations", href: "/presentations" },
  { label: "Reading", href: "/reading" },
  { label: "Contact", href: "/contact" },
];
