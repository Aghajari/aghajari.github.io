export type Repo = {
  name: string;
  tagline: string;
  description: string;
  language: string;
  stars: number;
  topics: string[];
  url: string;
  category:
    | "Compose"
    | "Graphics & Motion"
    | "Android Views"
    | "Tooling & Systems";
  featured?: boolean;
  highlight?: string; // an interesting engineering detail
};

/** Round star counts up to a friendly figure with "+" — exact values stay in data. */
export function formatRepoStars(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    const step = k >= 10 ? 1 : 0.5;
    const rounded = Math.ceil(k / step) * step;
    const text = Number.isInteger(rounded)
      ? String(rounded)
      : rounded.toFixed(1);
    return `${text}K+`;
  }
  let rounded: number;
  if (count >= 100) rounded = Math.ceil(count / 50) * 50;
  else if (count >= 20) rounded = Math.ceil(count / 10) * 10;
  else rounded = Math.ceil(count / 5) * 5;
  return `${rounded}+`;
}

// Curated from github.com/aghajari — presented as products, not raw cards.
// Star counts are a snapshot; display uses formatRepoStars so they don't need constant rebuilds.
export const repos: Repo[] = [
  {
    name: "ZoomHelper",
    tagline: "Instagram-style pinch-to-zoom for any view",
    description:
      "Drop-in zoom for any Android view hierarchy — the same fluid pinch-to-zoom interaction you know from Instagram, with correct overlay handling, hit-testing and release animations.",
    language: "Kotlin",
    stars: 249,
    topics: ["Android", "Gestures", "UI"],
    url: "https://github.com/Aghajari/ZoomHelper",
    category: "Android Views",
    featured: true,
    highlight:
      "Reparents the zoomed view into a window overlay on the fly so it floats above everything, then animates it back into place pixel-perfectly.",
  },
  {
    name: "AXEmojiView",
    tagline: "A complete emoji, sticker & memoji keyboard",
    description:
      "An advanced input library that adds emoji, stickers and memoji support to any Android app — variant skin tones, recents, search, and pluggable providers.",
    language: "Java",
    stars: 197,
    topics: ["Android", "Emoji", "Keyboard"],
    url: "https://github.com/Aghajari/AXEmojiView",
    category: "Android Views",
    featured: true,
    highlight:
      "A provider architecture lets you swap the entire emoji set (Google, Apple, Twitter, IOS) without touching the UI layer.",
  },
  {
    name: "AXrLottie",
    tagline: "High-performance Lottie rendering via rLottie",
    description:
      "Renders Bodymovin/Lottie JSON animations on Android through Samsung's native rLottie engine — built in C++ for buttery playback with a tiny memory footprint.",
    language: "C++",
    stars: 150,
    topics: ["Android", "Animation", "C++", "NDK"],
    url: "https://github.com/Aghajari/AXrLottie",
    category: "Graphics & Motion",
    featured: true,
    highlight:
      "Built in collaboration with Samsung's rLottie developers; adopted by top companies and integrated into 100+ projects.",
  },
  {
    name: "AnnotatedText",
    tagline: "Convert Android Spanned to Compose AnnotatedString",
    description:
      "A bridge between the classic Android text stack and Jetpack Compose — fully converts Spanned/Spannable into Compose's AnnotatedString, spans and all.",
    language: "Kotlin",
    stars: 79,
    topics: ["Jetpack Compose", "Text", "Interop"],
    url: "https://github.com/Aghajari/AnnotatedText",
    category: "Compose",
    featured: true,
    highlight:
      "Maps the full span taxonomy — styles, clickables, images and custom spans — so legacy rich text just works in Compose.",
  },
  {
    name: "LazySwipeCards",
    tagline: "Tinder-style swipeable card stack for Compose",
    description:
      "A composable card-swiping deck with natural physics, drag thresholds, and a lazy data model so you can deal an infinite stack without paying for it up front.",
    language: "Kotlin",
    stars: 67,
    topics: ["Jetpack Compose", "Gestures", "Animation"],
    url: "https://github.com/Aghajari/LazySwipeCards",
    category: "Compose",
    featured: true,
    highlight:
      "A lazy layout model only composes the cards that are visible in the stack, keeping large decks cheap.",
  },
  {
    name: "ThanosEffect",
    tagline: "Particle disintegration — Canvas & OpenGL",
    description:
      "The famous 'snap' disintegration animation, implemented two ways: a Canvas particle system and a GPU-accelerated OpenGL version, so you can compare the trade-offs.",
    language: "Kotlin",
    stars: 39,
    topics: ["OpenGL", "Particles", "Animation"],
    url: "https://github.com/Aghajari/ThanosEffect",
    category: "Graphics & Motion",
    featured: true,
    highlight:
      "Two complete implementations side-by-side: one CPU-bound on Canvas, one pushing tens of thousands of particles through the GPU.",
  },
  {
    name: "AXAnimation",
    tagline: "Animate any view — and everything about it",
    description:
      "A fluent animation library for Android that can animate virtually any view property with keyframes, rules and a readable DSL.",
    language: "Java",
    stars: 40,
    topics: ["Android", "Animation", "DSL"],
    url: "https://github.com/Aghajari/AXAnimation",
    category: "Graphics & Motion",
    highlight:
      "A rule-based DSL describes animations declaratively, then compiles them down to efficient property animators.",
  },
  {
    name: "LazyFlowLayout",
    tagline: "CSS Flexbox, as a Compose layout",
    description:
      "Brings the CSS Flexible Box model to Jetpack Compose — wrap, grow, shrink and alignment behaving exactly like flexbox on the web.",
    language: "Kotlin",
    stars: 48,
    topics: ["Jetpack Compose", "Layout"],
    url: "https://github.com/Aghajari/LazyFlowLayout",
    category: "Compose",
    highlight:
      "Implements the flexbox grow/shrink resolution algorithm inside a custom Compose measure pass.",
  },
  {
    name: "ComposeLayoutAnimation",
    tagline: "ViewGroup layoutAnimation for Compose",
    description:
      "Staggered entrance animations for the children of any Compose layout — including LazyColumn — recreating the classic ViewGroup layoutAnimation, which Compose never shipped.",
    language: "Kotlin",
    stars: 34,
    topics: ["Jetpack Compose", "Animation"],
    url: "https://github.com/Aghajari/ComposeLayoutAnimation",
    category: "Compose",
    highlight:
      "Born from migrating Cafe Bazaar to Compose — fills a real gap left by AnimatedVisibility for list entrances.",
  },
  {
    name: "AnimatedTextDiff",
    tagline: "Smooth text-change animations in Compose",
    description:
      "Animates between two strings character-by-character using an efficient diff, so counters, prices and labels morph instead of snapping.",
    language: "Kotlin",
    stars: 31,
    topics: ["Jetpack Compose", "Text", "Animation"],
    url: "https://github.com/Aghajari/AnimatedTextDiff",
    category: "Compose",
    highlight:
      "Computes a minimal edit script between strings so only the characters that actually changed animate.",
  },
  {
    name: "AXVideoTimelineView",
    tagline: "A precise video cropper timeline",
    description:
      "A scrollable, frame-accurate video timeline and cropper view for Android — the kind of control you find inside polished media editors.",
    language: "Java",
    stars: 65,
    topics: ["Android", "Media", "UI"],
    url: "https://github.com/Aghajari/AXVideoTimelineView",
    category: "Android Views",
    highlight:
      "Extracts and caches frame thumbnails asynchronously for a smooth scrubbing experience.",
  },
  {
    name: "MathParser",
    tagline: "A pure-Java expression engine",
    description:
      "A small but powerful open-source math tool that parses and evaluates algebraic expressions in pure Java — functions, variables, precedence and all.",
    language: "Java",
    stars: 51,
    topics: ["Parser", "Java", "Math"],
    url: "https://github.com/Aghajari/MathParser",
    category: "Tooling & Systems",
    highlight:
      "A hand-written recursive-descent parser with pluggable functions and operator precedence.",
  },
  {
    name: "AXGraphView",
    tagline: "Zoomable, scrollable function graphs",
    description:
      "Plots mathematical functions or custom drawings on a zoomable, pannable Android canvas — ideal for calculators and teaching tools.",
    language: "Java",
    stars: 49,
    topics: ["Android", "Graphics", "Math"],
    url: "https://github.com/Aghajari/AXGraphView",
    category: "Graphics & Motion",
  },
  {
    name: "AndroidDirectoryAccess",
    tagline: "Access Android/data without root",
    description:
      "A practical solution for reading the Android/data and Android/obb directories on Android 11+ without root, navigating the Scoped Storage maze.",
    language: "Java",
    stars: 42,
    topics: ["Android", "Storage", "SAF"],
    url: "https://github.com/Aghajari/AndroidDirectoryAccess",
    category: "Tooling & Systems",
  },
  {
    name: "XmlByPass",
    tagline: "Compile XML layouts to Java for speed",
    description:
      "An annotation processor that generates Java code for your XML layouts at source level — skipping runtime inflation for the highest UI performance.",
    language: "Java",
    stars: 14,
    topics: ["Android", "Performance", "APT"],
    url: "https://github.com/Aghajari/XmlByPass",
    category: "Tooling & Systems",
    highlight:
      "Trades runtime LayoutInflater reflection for generated code — measurable startup and inflation wins.",
  },
  {
    name: "AutoAnimate",
    tagline: "Figma Smart Animate for Android",
    description:
      "A custom shared-element transition that automatically animates between two layouts the way Figma's Smart Animate does — match by id, tween the rest.",
    language: "Kotlin",
    stars: 17,
    topics: ["Android", "Transitions", "Animation"],
    url: "https://github.com/Aghajari/AutoAnimate",
    category: "Graphics & Motion",
  },
];

export const ossCategories = [
  "Compose",
  "Graphics & Motion",
  "Android Views",
  "Tooling & Systems",
] as const;

export const ossSummary = {
  totalStars: repos.reduce((s, r) => s + r.stars, 0),
  totalRepos: 56,
  collaborators: "Samsung rLottie team",
};
