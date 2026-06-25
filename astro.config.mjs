// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Deployed as a GitHub Pages *user* site -> root domain, base "/".
export default defineConfig({
  site: "https://aghajari.github.io",
  base: "/",
  trailingSlash: "ignore",
  compressHTML: true,
  integrations: [mdx(), sitemap()],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  build: {
    inlineStylesheets: "auto",
  },
});
