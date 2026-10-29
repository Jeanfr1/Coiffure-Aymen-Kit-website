// Web images: AVIF + WebP at the widths each plate is shown at.
// Sources: the 2x plates from `npm run prepare-images` (scripts/out/plates), the kit's
// chair and signature masters (alpha). Writes public/img/<name>-<v>-<width>.{avif,webp}.
// Bump a plate's v when it changes: /img is cached for 30 days.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'public/img');
const V = 'v1';

const PLATES = [
  { name: 'plate-wide', src: 'scripts/out/plates/plate-wide.png', widths: [1400, 2000, 2800] },
  { name: 'plate', src: 'scripts/out/plates/plate.png', widths: [1200, 2000, 3208] },
  { name: 'montage-wide', src: 'scripts/out/plates/montage-wide.png', widths: [2000, 2800] },
  { name: 'montage', src: 'scripts/out/plates/montage.png', widths: [1000, 1600] },
  { name: 'facade-wide', src: 'scripts/out/plates/facade-wide.png', widths: [1300, 1900, 2600] },
  { name: 'facade', src: 'scripts/out/plates/facade.png', widths: [800, 1200, 1700] },
  { name: 'contact-wide', src: 'scripts/out/plates/contact-wide.png', widths: [1400, 2000, 2800] },
  { name: 'contact', src: 'scripts/out/plates/contact.png', widths: [1000, 1600, 2400] },
  { name: 'chair', src: 'images/master/hero-chair.png', widths: [480, 720, 1060], alpha: true },
  { name: 'signature', src: 'images/master/signature-master.png', widths: [600, 900, 1300, 1881], alpha: true },
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const only = process.argv.slice(2);
  for (const plate of PLATES) {
    if (only.length && !only.includes(plate.name)) continue;
    const base = sharp(path.join(ROOT, plate.src));
    const info = await base.metadata();
    const done = [];
    for (const w of [...new Set(plate.widths.map((width) => Math.min(width, info.width)))]) {
      const pipe = base.clone().resize({ width: w, kernel: 'lanczos3' });
      const stem = `${plate.name}-${plate.v || V}-${w}`;
      await pipe.clone().avif({ quality: plate.alpha ? 62 : 58, effort: 6 }).toFile(path.join(OUT, `${stem}.avif`));
      await pipe.clone().webp({ quality: 80, alphaQuality: 90, effort: 6 }).toFile(path.join(OUT, `${stem}.webp`));
      done.push(w);
    }
    console.log(plate.name.padEnd(14), `${info.width}x${info.height}`, done.join(','));
  }
}

main();
