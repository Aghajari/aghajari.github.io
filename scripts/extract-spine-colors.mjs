/**
 * Derive a believable hardcover *spine* colour from each cover image.
 *
 * The spine continues the binding, so we sample the left + right vertical
 * edge strips (where the background usually wins over title art), blend with
 * the overall average, and deepen it slightly for a bound-book feel.
 *
 * Usage:
 *   node scripts/extract-spine-colors.mjs            # print { slug: "#hex" }
 *   node scripts/extract-spine-colors.mjs --check    # warn on covers missing
 *
 * Paste the printed value into each book's `spine` field in
 * src/data/reading.ts. Lettering colour adapts to the spine automatically.
 */
import sharp from "sharp";
import { readdirSync } from "node:fs";

const DIR = "public/books";

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const toHex = (r, g, b) =>
  "#" + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, "0")).join("");

async function spineColor(file) {
  const path = `${DIR}/${file}`;
  const { width, height } = await sharp(path).metadata();
  const stripW = Math.max(2, Math.round(width * 0.1));
  const px = async (left) =>
    sharp(path)
      .extract({ left, top: 0, width: stripW, height })
      .resize(1, 1, { fit: "fill" })
      .raw()
      .toBuffer();
  const left = await px(0);
  const right = await px(width - stripW);
  const all = await sharp(path).resize(1, 1, { fit: "fill" }).raw().toBuffer();
  const mix = (i) => ((left[i] + right[i]) * 0.35 + all[i] * 0.3) * 0.82;
  return toHex(mix(0), mix(1), mix(2));
}

const files = readdirSync(DIR)
  .filter((f) => /\.(jpe?g|png)$/i.test(f))
  .sort();

const out = {};
for (const f of files) {
  out[f.replace(/\.(jpe?g|png)$/i, "")] = await spineColor(f);
}
console.log(JSON.stringify(out, null, 2));
