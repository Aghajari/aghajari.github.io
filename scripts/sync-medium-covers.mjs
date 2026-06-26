#!/usr/bin/env node
/**
 * Fetches Medium cover images from the @aghajari RSS feed and saves them
 * locally so the static site never depends on Medium CDN at runtime.
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
} from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pubsDir = join(root, "src/content/publications");
const outDir = join(root, "public/images/publications");
const manifestPath = join(root, "src/data/publication-covers.json");

const RSS_URL = "https://medium.com/feed/@aghajari";

function slugFromMediumUrl(url) {
  try {
    const path = new URL(url).pathname;
    return path.split("/").filter(Boolean).pop() ?? "";
  } catch {
    return "";
  }
}

function parsePublications() {
  const files = readdirSync(pubsDir).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const content = readFileSync(join(pubsDir, file), "utf8");
    const mediumUrl = content
      .match(/^mediumUrl:\s*["']?([^"'\n]+)["']?/m)?.[1]
      ?.trim();
    const id = file.replace(/\.md$/, "");
    if (!mediumUrl) throw new Error(`Missing mediumUrl in ${file}`);
    const title = content.match(/^title:\s*["']?([^"'\n]+)["']?/m)?.[1]?.trim();
    return {
      id,
      mediumUrl,
      slug: slugFromMediumUrl(mediumUrl),
      title: title ?? id,
    };
  });
}

async function fetchRssImageMap() {
  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "aghajari-website-cover-sync/1.0" },
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const items = xml.split("<item>").slice(1);
  const map = new Map();

  for (const item of items) {
    const link = item.match(/<link>(.*?)<\/link>/)?.[1]?.split("?")[0] ?? "";
    const slug = slugFromMediumUrl(link);
    const img =
      item.match(/<img[^>]+src="([^"]+)"/)?.[1] ??
      item.match(/https:\/\/cdn-images-1\.medium\.com\/[^"<]+/)?.[0];
    if (slug && img) map.set(slug, img);
  }
  return map;
}

function optimizeMediumUrl(url) {
  // Smaller CDN variant — plenty for cards & heroes, much lighter to ship
  return url.replace("/max/1024/", "/max/800/");
}

function extFromUrl(url) {
  const base = extname(new URL(url).pathname).toLowerCase();
  return base === ".png" ? ".png" : ".jpg";
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "aghajari-website-cover-sync/1.0" },
  });
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const publications = parsePublications();
  const imageMap = await fetchRssImageMap();
  const manifest = {};

  for (const pub of publications) {
    const remote = optimizeMediumUrl(imageMap.get(pub.slug));
    if (!remote) {
      console.warn(`⚠ No RSS image for ${pub.id} (${pub.slug})`);
      continue;
    }

    const ext = extFromUrl(remote);
    const filename = `${pub.id}${ext}`;
    const localPath = `/images/publications/${filename}`;
    const dest = join(outDir, filename);

    if (!existsSync(dest)) {
      process.stdout.write(`↓ ${pub.id}… `);
      await download(remote, dest);
      console.log("saved");
    } else {
      console.log(`✓ ${pub.id} (cached)`);
    }

    manifest[pub.id] = { local: localPath, remote, alt: pub.title };
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `\nWrote ${Object.keys(manifest).length} covers → ${manifestPath}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
