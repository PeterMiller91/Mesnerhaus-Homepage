import sharp from "sharp";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bilderDir = join(root, "..", "Bilder");
const outDir = join(root, "public", "images");

mkdirSync(outDir, { recursive: true });

const sources = [
  {
    src: join(bilderDir, "480518753_1229929718569061_2282234287489739564_n.jpg"),
    name: "panorama",
    widths: [480, 900, 1400, 1920],
    quality: 82,
  },
  {
    src: join(
      bilderDir,
      "Gaststätte Mesnerhaus Armesberg _ Ihre Ausflugsgaststätte am Armesberg_files",
      "terasse-1.jpg"
    ),
    name: "terrasse",
    widths: [480, 800, 1200],
    quality: 85,
  },
  {
    src: join(bilderDir, "42922279_2104464032919040_5715797861120081920_n.jpg"),
    name: "abend",
    widths: [480, 800, 1200],
    quality: 83,
  },
  {
    src: join(bilderDir, "816953193_1099128413084695_8849665751020379899_n.jpg"),
    name: "essen1",
    widths: [480, 800],
    quality: 83,
  },
  {
    src: join(bilderDir, "776200558_1578528530722281_5725621122544726172_n.jpg"),
    name: "essen2",
    widths: [480, 800],
    quality: 83,
  },
];

for (const { src, name, widths, quality } of sources) {
  const img = sharp(src);
  const meta = await img.metadata();
  console.log(`\n${name}: ${meta.width}×${meta.height}`);

  for (const w of widths) {
    if (w > meta.width) continue; // skip upscaling
    const dest = join(outDir, `${name}-${w}.webp`);
    await sharp(src)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality })
      .toFile(dest);
    const stat = (await import("fs")).statSync(dest);
    console.log(`  → ${name}-${w}.webp  (${Math.round(stat.size / 1024)} KB)`);
  }
}

console.log("\nDone.");
