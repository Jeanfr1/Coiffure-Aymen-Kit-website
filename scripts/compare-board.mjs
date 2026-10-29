// Board check: renders the static desktop layout (?static), crops the board frame,
// scales it to the board's 748 px and writes qa/board-compare.png
// (board | page | 50 % blend) plus the mean absolute difference per scene.
// QA_BASE=http://localhost:4377/ W=1440 H=900 npm run compare
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = process.env.QA_BASE || 'http://localhost:4377/';
const W = Number(process.env.W || 1440);
const VH = Number(process.env.H || 900);
const BW = 748; const BH = 2103;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: VH }, deviceScaleFactor: 1 });
await page.goto(`${BASE}?static`, { waitUntil: 'networkidle' });
await page.evaluate(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)); }
  scrollTo(0, 0);
  await document.fonts.ready;
  const pending = [...document.querySelectorAll('main img')].filter((img) => !img.complete);
  await Promise.race([Promise.all(pending.map((img) => new Promise((r) => { img.onload = img.onerror = r; }))), new Promise((r) => setTimeout(r, 6000))]);
});
await page.waitForTimeout(600);
const { fl, u } = await page.evaluate(() => { const w = document.documentElement.clientWidth; const u = Math.min(w, 1600, 1.66 * innerHeight) / 1024; return { fl: (w - 748 * u) / 2, u }; });
const shot = await page.screenshot({ fullPage: true });
await browser.close();
const cropW = Math.round(BW * u);
const meta0 = await sharp(shot).metadata();
const cropH = Math.min(Math.round(BH * u), meta0.height);
const outH = Math.round((cropH * BW) / cropW);
const pageCrop = await sharp(shot).extract({ left: Math.round(fl), top: 0, width: cropW, height: cropH }).resize({ width: BW, height: outH, fit: 'fill' }).png().toBuffer();
const H = Math.min(outH, BH);
const board = await sharp(path.join(ROOT, 'references/Modelo-3-Aprovado.png')).removeAlpha().extract({ left: 0, top: 0, width: BW, height: H }).png().toBuffer();
const pageH = await sharp(pageCrop).removeAlpha().extract({ left: 0, top: 0, width: BW, height: H }).png().toBuffer();
const blend = await sharp(board).composite([{ input: await sharp(pageH).ensureAlpha(0.5).png().toBuffer(), blend: 'over' }]).png().toBuffer();
await fs.mkdir(path.join(ROOT, 'qa'), { recursive: true });
await sharp({ create: { width: BW * 3 + 40, height: H, channels: 3, background: '#ff00ff' } })
  .composite([{ input: board, left: 0, top: 0 }, { input: pageH, left: BW + 20, top: 0 }, { input: blend, left: BW * 2 + 40, top: 0 }])
  .png().toFile(path.join(ROOT, 'qa/board-compare.png'));
await sharp(shot).png().toFile(path.join(ROOT, `qa/full-${W}x${VH}.png`));
const a = await sharp(board).raw().toBuffer();
const b = await sharp(pageH).raw().toBuffer();
const rows = { accueil: [0, 621], 'savoir-faire': [621, 1021], 'nous-trouver': [1021, 1434], services: [1434, 1680], contact: [1680, 2103] };
for (const [name, [y0, y1]] of Object.entries(rows)) {
  let sum = 0; let n = 0;
  for (let y = y0; y < Math.min(y1, H); y++) for (let x = 0; x < BW; x++) for (let c = 0; c < 3; c++) { const i = (y * BW + x) * 3 + c; sum += Math.abs(a[i] - b[i]); n++; }
  console.log(name.padEnd(13), 'mean |diff|', (sum / n).toFixed(1));
}
console.log(`page height ${(meta0.height / u).toFixed(0)} board px (board ${BH}); u ${u.toFixed(4)}; wrote qa/board-compare.png`);
