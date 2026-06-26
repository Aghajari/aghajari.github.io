export type Milestone = {
  period: string;
  title: string;
  org: string;
  orgUrl?: string;
  location?: string;
  summary: string;
  points: string[];
  links?: { label: string; href: string }[];
  badge?: string;
  kind: "work" | "award" | "contribution" | "education";
};

/** Playful year-by-year "where was I?" stops for the interactive timeline. */
export type YearStop = {
  year: string;
  place: string;
  role: string;
  note: string;
  kind: Milestone["kind"];
  /** Optional accent override for the interactive year rail/card. */
  tint?: "green";
};

export const yearStops: YearStop[] = [
  {
    year: "2017",
    place: "My own bedroom",
    role: "Freelance developer",
    note: "Teaching myself to ship — first Android apps and my earliest open-source repos.",
    kind: "work",
  },
  {
    year: "2018",
    place: "Freelance · Independent",
    role: "Open-source author",
    note: "Android apps and open-source libraries — the portfolio that opened doors.",
    kind: "work",
  },
  {
    year: "2019",
    place: "Freelance · Independent",
    role: "Open-source author",
    note: "More libraries, more stars — components other apps started depending on.",
    kind: "work",
  },
  {
    year: "2020",
    place: "Freelance · Independent",
    role: "Software developer",
    note: "Built Titan, a transpiler for Android libraries, plus APIs in Go, Node and PHP.",
    kind: "work",
  },
  {
    year: "2021",
    place: "Vidone · Tehran Polytechnic",
    role: "Android engineer & CE student",
    note: "Joined Vidone, started Computer Engineering at Amirkabir, and won a national gold medal.",
    kind: "education",
  },
  {
    year: "2022",
    place: "Cafe Bazaar, Tehran",
    role: "Senior Android Engineer",
    note: "Joined one of the region's biggest app marketplaces — Compose migration, performance, and platform work at scale.",
    kind: "work",
    tint: "green",
  },
  {
    year: "2023",
    place: "South Korea → Tehran",
    role: "WorldSkills Champion",
    note: "WorldSkills Champion — then back to shipping at Cafe Bazaar.",
    kind: "award",
  },
  {
    year: "2024",
    place: "Cafe Bazaar, Tehran",
    role: "Android System Owner",
    note: "Took ownership of the Android codebase's quality and technical standards.",
    kind: "work",
  },
  {
    year: "2025",
    place: "Cafe Bazaar · Telegram · AndroidX",
    role: "System Owner & contributor",
    note: "Telegram contest win merged upstream, AndroidX contribution, and graduation.",
    kind: "award",
  },
  {
    year: "2026",
    place: "Cafe Bazaar, Tehran",
    role: "Android Chapter Lead",
    note: "Leading the Android chapter — direction, standards and engineering culture.",
    kind: "work",
  },
];

export const milestones: Milestone[] = [
  {
    period: "Jun 2026 — Present",
    title: "Android Chapter Lead",
    org: "Cafe Bazaar",
    orgUrl: "https://cafebazaar.ir",
    location: "Tehran, Iran",
    summary:
      "Leading the Android chapter — shaping engineering direction, standards and how the team ships across one of the region's largest app marketplaces with 40M+ active users.",
    points: [
      "Guide technical direction and chapter-wide practices for Android engineers.",
      "Champion quality, architecture and a consistent engineering culture across teams.",
    ],
    kind: "work",
  },
  {
    period: "Nov 2025",
    title: "Open Source Contribution — AndroidX",
    org: "Google · AndroidX",
    orgUrl: "https://github.com/androidx/androidx",
    summary:
      "Contributed to Google's Android open-source project. Reviewed and merged into AndroidX.",
    points: ["Merged contribution to the official Android Jetpack codebase."],
    badge: "Merged upstream",
    kind: "contribution",
  },
  {
    period: "Jul 2025",
    title: "1st Place — Telegram Profile Redesign Contest",
    org: "Telegram",
    summary:
      "Won first place in the Telegram profile redesign contest. The work was merged into Telegram's official Android codebase.",
    points: [
      "Profile redesign accepted and integrated into the Telegram Android app.",
      "Full contest implementation and personal changes are available on GitHub.",
    ],
    badge: "1st place",
    links: [
      {
        label: "View on GitHub",
        href: "https://github.com/Aghajari/Telegram-ProfileRedesign",
      },
    ],
    kind: "award",
  },
  {
    period: "May 2024 — Jun 2026",
    title: "Android System Owner",
    org: "Cafe Bazaar",
    orgUrl: "https://cafebazaar.ir",
    location: "Tehran, Iran",
    summary:
      "Owned the overall quality of the Android codebase and technical standards for the product.",
    points: [
      "Accountable for source-code quality, technical health and engineering standards across the system.",
      "Drove architectural consistency, code quality practices and long-term technical sustainability.",
    ],
    kind: "work",
  },
  {
    period: "Oct 2022 — May 2024",
    title: "Senior Android Engineer",
    org: "Cafe Bazaar",
    orgUrl: "https://cafebazaar.ir",
    location: "Tehran, Iran",
    summary:
      "Helped build and harden one of the region's largest Android products — leading the new design system migration while raising performance and engineering standards.",
    points: [
      "Led the Compose migration and shared primitives teams still depend on (e.g. ComposeLayoutAnimation).",
      "Improved rendering performance and motion consistency alongside architecture reviews and code-health work.",
      "Built shared infrastructure and practices adopted across feature teams.",
    ],
    kind: "work",
  },
  {
    period: "Apr 2023",
    title: "Champion · Best of Nation — Mobile Applications Development",
    org: "WorldSkills Competition 2022",
    orgUrl: "https://worldskills.org",
    location: "South Korea",
    summary:
      "Recognized internationally for excellence in mobile application development at the WorldSkills Competition 2022, held in South Korea.",
    points: [
      "Champion and Best of Nation in Mobile Applications Development.",
      "Medallion for Excellence at the WorldSkills Competition 2022 Special Edition, South Korea.",
    ],
    badge: "Champion",
    kind: "award",
  },
  {
    period: "Aug 2021 — Nov 2025",
    title: "B.Sc. Computer Engineering",
    org: "Amirkabir University of Technology (Tehran Polytechnic)",
    orgUrl: "https://aut.ac.ir",
    location: "Tehran, Iran",
    summary:
      "Studying computer engineering — compilers, operating systems, and hands-on systems projects — and writing about what I learn.",
    points: [
      "Hands-on systems work: kernel threads in xv6, a MiniJava→C compiler, information-retrieval engines.",
    ],
    kind: "education",
  },
  {
    period: "Nov 2021",
    title: "Gold Medal — Mobile Application Development",
    org: "WorldSkills Iran · 19th National Skills",
    summary:
      "National gold medal that qualified me for the international WorldSkills competition.",
    points: [],
    badge: "Gold medal",
    kind: "award",
  },
  {
    period: "Jan 2021 — Aug 2022",
    title: "Senior Android / Java Engineer",
    org: "Vidone",
    location: "Tehran, Iran",
    summary:
      "Rebuilt the Android application for an e-learning platform with a focus on stability and speed.",
    points: [
      "Eliminated ~90% of reported crashes and cut load time by ~50% through code and database optimization.",
      "Rebuilt core flows for stability and speed; streamlined common tasks by ~40% fewer taps.",
    ],
    kind: "work",
  },
  {
    period: "2017 — 2022",
    title: "Freelance Software Developer",
    org: "Independent",
    summary:
      "Five years of shipping Android, iOS and backend software — and building the open-source portfolio that became my calling card.",
    points: [
      "Authored 35+ open-source projects and reusable Android components, earning 1K+ GitHub stars.",
      "Built Titan, a transpiler for Open-Source Android libraries.",
      "Engineered 20+ APIs and 5+ libraries in Go, Node.js and PHP.",
    ],
    kind: "work",
  },
];
