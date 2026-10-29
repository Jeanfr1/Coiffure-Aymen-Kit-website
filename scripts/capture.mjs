// Contact sheet of scroll positions with motion on (real wheel scrolling, rAF cadence).
// QA_BASE=http://localhost:4377/ node scripts/capture.mjs 1440 900 0,200,450,650,873,1200,1700,2300 out.png
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.env.QA_BASE || 'http://localhost:4377/';
const [W, H] = [Number(process.argv[2] || 1440), Number(process.argv[3] || 900)];
const ys = (process.argv[4] || '0,300,600,900').split(',').map(Number);
const out = process.argv[5] || 'qa/sheet.png';
const mobile = W < 1024;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('pageerror', e.message));
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1600);
const shots = [];
for (const y of ys) {
  await page.evaluate((yy) => scrollTo(0, yy), y);
  await page.waitForTimeout(350);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const info = await page.evaluate(() => `y${Math.round(scrollY)} p${document.documentElement.dataset.heroP || '-'}`);
  shots.push({ buf: await page.screenshot(), info });
  console.log(info);
}
await browser.close();
const scale = mobile ? 0.5 : 0.3;
const tw = Math.round(W * scale); const th = Math.round(H * scale);
const cols = mobile ? 4 : 3;
const rows = Math.ceil(shots.length / cols);
const tiles = await Promise.all(shots.map(async (s) => sharp(s.buf).resize(tw, th).png().toBuffer()));
await sharp({ create: { width: cols * (tw + 8), height: rows * (th + 8), channels: 3, background: '#ff00ff' } })
  .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * (tw + 8), top: Math.floor(i / cols) * (th + 8) })))
  .png().toFile(out);
