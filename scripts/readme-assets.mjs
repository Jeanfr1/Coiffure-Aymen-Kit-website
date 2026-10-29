// README assets from the production build (npm run build && npm run preview):
// banner.png, hero-scroll.gif frames, desktop-sections.jpg, mobile-screens.jpg in .github/assets/.
// BASE=http://localhost:4377/ FRAMES=<dir> node scripts/readme-assets.mjs, then ffmpeg (see README).
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const BASE = process.env.BASE || 'http://localhost:4377/';
const FRAMES = process.env.FRAMES || path.join(ROOT, 'qa/frames');
const OUT = path.join(ROOT, '.github/assets');
await fs.mkdir(FRAMES, { recursive: true });
await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
const hideToggle = 'html .motion-toggle{display:none!important}';
const ready = async (page) => { await page.addStyleTag({ content: hideToggle }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1700); };

// ---- banner: the site's own fonts and plates, served from the preview origin ----
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 520 } });
  const bannerHtml = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:B;src:url('/fonts/BarlowCondensed-ExtraBold.woff2');font-weight:800}
    @font-face{font-family:S;src:url('/fonts/Sora-Medium.woff2');font-weight:500}
    html,body{margin:0;width:1600px;height:520px;overflow:hidden;background:#101110;color:#EFE7D8}
    .bg{position:absolute;left:520px;top:-40px;width:1180px;height:620px;background:url('/img/plate-v1-2000.webp') 78% 30%/cover}
    .bg::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#101110 0%,rgba(16,17,16,.82) 22%,rgba(16,17,16,.2) 60%,rgba(16,17,16,.55))}
    .sig{position:absolute;left:640px;top:70px;width:640px;opacity:.95}
    .chair{position:absolute;left:1040px;top:84px;width:330px}
    .logo{position:absolute;left:104px;top:40px;width:230px}
    h1{position:absolute;left:104px;top:150px;margin:0;font:800 150px/.88 B;text-transform:uppercase;letter-spacing:-.01em}
    p{position:absolute;left:108px;top:440px;margin:0;font:500 15px S;letter-spacing:.3em;text-transform:uppercase;color:#D5AC62}
  </style></head><body><div class="bg"></div>
  <img class="sig" src="/img/signature-v1-1300.webp"><img class="chair" src="/img/chair-v1-720.webp">
  <img class="logo" src="/logo-ambre.svg">
  <h1>Prenez<br>place.</h1><p>Coiffure &amp; barbier · Pontchâteau</p></body></html>`;
  await page.route(`${BASE}__banner`, (route) => route.fulfill({ contentType: 'text/html; charset=utf-8', body: bannerHtml }));
  await page.goto(`${BASE}__banner`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, 'banner.png') });
  await page.close();
}

// ---- hero GIF frames: the comb passage and the street arriving, 1440 x 900 ----
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await ready(page);
  const end = await page.evaluate(() => document.querySelector('.sf').offsetTop + 420);
  const N = 60;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const y = Math.round(end * (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2));
    await page.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
    await page.waitForTimeout(350);
    await settle(page);
    await page.screenshot({ path: path.join(FRAMES, `f_${String(i).padStart(4, '0')}.png`) });
  }
  await page.close();
}

// ---- browser-framed desktop sections ----
async function shotAt(page, sel, offset = 0) {
  await page.evaluate(([s, o]) => scrollTo({ top: document.querySelector(s).offsetTop + o, behavior: 'instant' }), [sel, offset]);
  await page.waitForTimeout(1500);
  await settle(page);
  return page.screenshot();
}
function browserFrame(png, w, h) {
  const bar = 34;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + bar}"><rect width="${w}" height="${h + bar}" rx="12" fill="#1b1c1a"/><circle cx="20" cy="17" r="5.5" fill="#ff5f57"/><circle cx="38" cy="17" r="5.5" fill="#febc2e"/><circle cx="56" cy="17" r="5.5" fill="#28c840"/><rect x="${w / 2 - 170}" y="8" width="340" height="18" rx="9" fill="#2a2b28"/><text x="${w / 2}" y="21" font-family="Helvetica, Arial" font-size="11" fill="#a8a294" text-anchor="middle">coiffure-aymen-pontchateau.vercel.app</text></svg>`;
  return sharp(Buffer.from(svg)).composite([{ input: png, left: 0, top: bar }]).png().toBuffer();
}
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await ready(page);
  const shots = [await page.screenshot()];
  shots.push(await shotAt(page, '.sf', 0));
  shots.push(await shotAt(page, '.facade', -200));
  shots.push(await shotAt(page, '.services', -330));
  await page.locator('[data-service="barbe"]').click();
  await page.waitForTimeout(700);
  shots.push(await page.screenshot());
  await page.keyboard.press('Escape');
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1600);
  shots.push(await page.screenshot());
  await page.close();
  const W = 720; const H = 450; const gap = 28;
  const framed = [];
  for (const s of shots) framed.push(await browserFrame(await sharp(s).resize(W, H).png().toBuffer(), W, H));
  const cols = 2; const rows = Math.ceil(framed.length / cols);
  await sharp({ create: { width: cols * W + (cols + 1) * gap, height: rows * (H + 34) + (rows + 1) * gap, channels: 3, background: '#D9CDB4' } })
    .composite(framed.map((input, i) => ({ input, left: gap + (i % cols) * (W + gap), top: gap + Math.floor(i / cols) * (H + 34 + gap) })))
    .jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'desktop-sections.jpg'));
}

// ---- phone screens ----
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await ready(page);
  const shots = [await page.screenshot()];
  shots.push(await shotAt(page, '.sf', 0));
  shots.push(await shotAt(page, '.facade', 0));
  shots.push(await shotAt(page, '.services', -40));
  shots.push(await shotAt(page, '.contact', 160));
  await ctx.close();
  const w = 300; const h = 649; const pad = 12; const gap = 34;
  const phones = [];
  for (const s of shots) {
    const screen = await sharp(s).resize(w, h).png().toBuffer();
    const mask = Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="34" fill="#fff"/></svg>`);
    const rounded = await sharp(screen).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
    const body = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w + 2 * pad}" height="${h + 2 * pad}"><rect width="${w + 2 * pad}" height="${h + 2 * pad}" rx="44" fill="#0b0b0a"/></svg>`);
    phones.push(await sharp(body).composite([{ input: rounded, left: pad, top: pad }]).png().toBuffer());
  }
  const PW = w + 2 * pad; const PH = h + 2 * pad;
  await sharp({ create: { width: phones.length * PW + (phones.length + 1) * gap, height: PH + 2 * gap, channels: 3, background: '#D9CDB4' } })
    .composite(phones.map((input, i) => ({ input, left: gap + i * (PW + gap), top: gap })))
    .jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(OUT, 'mobile-screens.jpg'));
}
await browser.close();
console.log('assets written; frames in', FRAMES);
