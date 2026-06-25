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
    "AmirHossein Aghajari — Android Chapter Lead at Cafe Bazaar. Software engineer building beautiful, performant softwares — and writing about the internals.",
  // Long-form intro statement
  statement:
    "I build the layer where software meets the eye — interfaces, motion, and graphics — and I care about what happens underneath them. For nearly a decade I've shipped Android products, crafted open-source libraries used in hundreds of apps, and written about the internals of animation, rendering, and performance.",
  // Hero rotating descriptors
  facets: [
  ],
  socials: {
    github: "https://github.com/aghajari",
    medium: "https://medium.com/@aghajari",
    linkedin: "https://www.linkedin.com/in/amir-aghajari/",
    telegram: "https://t.me/theAghajari",
    email: "mailto:amirhossein.aghajari.82@gmail.com",
  },
  githubUser: "aghajari",
};

export const stats = [
  { value: "9", suffix: "+", label: "Years engineering" },
  { value: "3", suffix: "", label: "Talks on the site" },
  { value: "2", suffix: "", label: "Interactive editions" },
  { value: "10", suffix: "", label: "Technical articles" },
];

export type NavItem = { label: string; href: string };

export const primaryNav: NavItem[] = [
  { label: "Experience", href: "/experience" },
  { label: "Open Source", href: "/open-source" },
  { label: "Publications", href: "/publications" },
  { label: "Presentations", href: "/presentations" },
  { label: "Contact", href: "/contact" },
];
