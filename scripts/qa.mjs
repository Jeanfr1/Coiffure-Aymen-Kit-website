// QA against a running build: QA_BASE=http://localhost:4377/ npm run qa
// Layout (overflow, density, text size), hero passage, links, services dialog (keyboard),
// CTA hit-tests, phone menu, reduced motion, pause, no-JS, process words, kit kept out of the deploy.
// Exit code 1 when a check fails.
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:4377/';
const TEL = 'tel:+33753496435';
const PROCESS_WORDS = /\b(conceptuel|conceptual|illustrati|g[ée]n[ée]r[ée]e?s?\b|generated|edited|retouch|original photo|photo d.origine|campagne|campaign|mockup|maquette|prompt|IA\b|AI\b|placeholder|lorem|TODO|planity|r[ée]server en ligne|horaires)/i;
let failed = 0;
const ok = (cond, label, extra = '') => { console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? `  (${extra})` : ''}`); if (!cond) failed++; };

const browser = await chromium.launch({ channel: 'chrome' });

async function open(width, height, { query = '', js = true, reduced = false, touch = width < 1024 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: js, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: touch, isMobile: touch });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', (r) => errors.push(`failed ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(BASE + query, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(1500);
  return { ctx, page, errors };
}

// ---------- layout at six sizes ----------
for (const [w, h] of [[1280, 720], [1440, 900], [1920, 1080], [1024, 768], [390, 844], [360, 640]]) {
  const { ctx, page, errors } = await open(w, h);
  const m = await page.evaluate(async () => {
    const out = { overflow: [] };
    for (let y = 0; y < document.documentElement.scrollHeight; y += Math.round(innerHeight * 0.5)) {
      scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (document.documentElement.scrollWidth > innerWidth) out.overflow.push(y);
    }
    scrollTo(0, 0); await new Promise((r) => setTimeout(r, 150));
    const u = Math.min(document.documentElement.clientWidth, 1600, 1.66 * innerHeight) / 1024;
    const hgt = (s) => document.querySelector(s).getBoundingClientRect().height / innerHeight;
    out.hero = hgt('.hero');
    out.sections = ['.sf', '.facade', '.services', '.contact'].map((s) => [s, hgt(s)]);
    // display titles at the board's size x u, never larger (src/data/board-type.json)
    out.titles = [['.hero-title .l2', 75.52], ['.sf-title', 102.13], ['.facade-title .l1', 58.5], ['.services-title .l1', 60.14], ['.contact-title .l2', 51.75]]
      .map(([s, board]) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize) / (board * u));
    out.small = [...document.querySelectorAll('main a, main p, main span, main button, main li, main h1, main h2')]
      .filter((el) => el.getClientRects().length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .map((el) => [el.textContent.trim().slice(0, 28), parseFloat(getComputedStyle(el).fontSize)])
      .filter(([, fs]) => fs < 11);
    out.targets = [...document.querySelectorAll('main a, .motion-toggle')]
      .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
      .map((el) => { const r = el.getBoundingClientRect(); return [el.textContent.trim().slice(0, 20) || el.getAttribute('aria-label'), Math.round(r.height)]; })
      .filter(([, hh]) => hh < 40);
    return out;
  });
  ok(m.overflow.length === 0, `${w}x${h} no horizontal overflow`, m.overflow.join(','));
  if (w >= 1024) {
    ok(m.hero <= 1.05, `${w}x${h} hero <= 1.05 screen`, m.hero.toFixed(2));
    ok(m.sections.every(([, r]) => r <= 0.8), `${w}x${h} sections <= 0.8 screen`, m.sections.map(([s, r]) => `${s} ${r.toFixed(2)}`).join(' '));
    ok(m.titles.every((t) => t <= 1.01 && t > 0.97), `${w}x${h} titles at board size (1024 density)`, m.titles.map((t) => t.toFixed(3)).join(' '));
  }
  ok(m.small.length === 0, `${w}x${h} text >= 11 px`, m.small.slice(0, 4).map(([t, f]) => `${t}:${f}`).join(' | '));
  ok(m.targets.length === 0, `${w}x${h} links >= 40 px tall`, m.targets.slice(0, 4).map(([t, hh]) => `${t}:${hh}`).join(' | '));
  ok(errors.length === 0, `${w}x${h} no console / network errors`, errors.slice(0, 3).join(' | '));
  await ctx.close();
}

// ---------- hero passage, links, dialog (desktop) ----------
{
  const { ctx, page } = await open(1440, 900);
  const p0 = await page.evaluate(() => document.documentElement.dataset.heroP);
  ok(p0 === '0.000', 'hero passage starts at 0', p0);
  await page.mouse.move(700, 450);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 110); await page.waitForTimeout(60); }
  await page.waitForTimeout(500);
  const mid = await page.evaluate(() => ({ p: Number(document.documentElement.dataset.heroP), top: Math.round(document.querySelector('.hero').getBoundingClientRect().top), strips: [...document.querySelectorAll('[data-strip]')].map((s) => Math.round(s.getBoundingClientRect().top)), sf: Math.round(document.querySelector('.sf').getBoundingClientRect().top) }));
  const spread = Math.max(...mid.strips) - Math.min(...mid.strips);
  ok(mid.p > 0.3 && mid.p < 0.8 && mid.top === 0 && spread > 15 && mid.strips.every((t) => t <= mid.sf + 1), 'hero pinned, montage rising in staggered strips (the comb)', JSON.stringify(mid));
  await page.evaluate(() => scrollTo(0, document.querySelector('.sf').offsetTop));
  await page.waitForTimeout(400);
  const end = await page.evaluate(() => ({ p: document.documentElement.dataset.heroP, sf: Math.round(document.querySelector('.sf').getBoundingClientRect().top), strips: [...document.querySelectorAll('[data-strip]')].map((s) => Math.round(s.getBoundingClientRect().top)), inert: document.querySelector('.hero-copy').inert }));
  ok(end.p === '1.000' && Math.abs(end.sf) <= 1 && end.strips.every((t) => Math.abs(t - end.sf) <= 1) && end.inert, 'passage ends flat with savoir-faire at the top, hero links inert', JSON.stringify(end));
  const seam = await page.evaluate(() => Math.abs(document.querySelector('.sf').getBoundingClientRect().bottom - document.querySelector('.facade').getBoundingClientRect().top));
  ok(seam < 1, 'savoir-faire meets the street with no band', String(seam));

  const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map((a) => a.href));
  ok(links.filter((h) => h === TEL).length >= 5, 'phone links', String(links.filter((h) => h === TEL).length));
  ok(links.filter((h) => h.startsWith('https://www.google.com/maps/')).length >= 5, 'map links', String(links.filter((h) => h.startsWith('https://www.google.com/maps/')).length));
  ok(!links.some((h) => /planity|instagram|facebook|mailto:/.test(h)), 'no booking, social or e-mail links (none confirmed)');
  const ext = await page.evaluate(() => [...document.querySelectorAll('a[target="_blank"]')].every((a) => /noopener/.test(a.rel)));
  ok(ext, 'external links have rel=noopener');

  await page.evaluate(() => scrollTo(0, document.querySelector('.services').offsetTop - 200));
  await page.waitForTimeout(500);
  const trigger = page.locator('[data-service="enfant"]');
  await trigger.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(350);
  let st = await page.evaluate(() => ({ open: document.getElementById('service-dialog').open, sel: document.querySelector('[role=tab][aria-selected=true]').dataset.tab, title: document.getElementById('service-dialog-title').textContent }));
  ok(st.open && st.sel === 'enfant' && st.title === 'Coupe enfant', 'services dialog opens on the chosen tab', JSON.stringify(st));
  await page.locator('[role=tab][aria-selected=true]').focus();
  await page.keyboard.press('ArrowRight');
  st = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').dataset.tab);
  ok(st === 'barbe', 'tabs: ArrowRight', st);
  await page.keyboard.press('Home');
  st = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').dataset.tab);
  ok(st === 'homme', 'tabs: Home', st);
  await page.keyboard.press('End');
  st = await page.evaluate(() => document.querySelector('[role=tab][aria-selected=true]').dataset.tab);
  ok(st === 'barbe', 'tabs: End', st);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
  st = await page.evaluate(() => ({ open: document.getElementById('service-dialog').open, focus: document.activeElement.dataset.service }));
  ok(!st.open && st.focus === 'enfant', 'Escape closes, focus returns', JSON.stringify(st));
  await trigger.click();
  await page.waitForTimeout(350);
  await page.mouse.click(8, 8);
  await page.waitForTimeout(250);
  ok(!(await page.evaluate(() => document.getElementById('service-dialog').open)), 'click outside closes the services dialog');

  for (const [label, sel, y] of [['hero', '.hero-cta', 0], ['nav', '.nav-cta', 0], ['street', '.facade-cta', 'facade'], ['contact', '.ct-cta1', 'end'], ['call', '.ct-cta2', 'end']]) {
    if (y === 'end') await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    else if (y === 'facade') await page.evaluate(() => scrollTo(0, document.querySelector('.facade').offsetTop - 200));
    else await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(900);
    const hit = await page.evaluate((s) => {
      const a = document.querySelector(s); const r = a.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top && (top === a || a.contains(top)) ? 'ok' : `covered by ${top && top.className}`;
    }, sel);
    ok(hit === 'ok', `${label} CTA is on top and clickable`, hit);
  }

  const text = await page.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('[alt]')].map((i) => i.alt).join(' ') + ' ' + [...document.querySelectorAll('[aria-label]')].map((i) => i.getAttribute('aria-label')).join(' ') + ' ' + document.title + ' ' + document.querySelector('meta[name=description]').content);
  const word = text.match(PROCESS_WORDS);
  ok(!word, 'no production notes, booking or hours on the page', word ? word[0] : '');
  ok(!/[ãõ]|ção\b|você|\bnão\b/.test(text), 'no Portuguese on the page');
  ok(/07 53 49 64 35/.test(text) && /2 rue Maurice Sambron/.test(text) && /Sans rendez-vous/i.test(text), 'phone, address and walk-in on the page');
  await ctx.close();
}

// ---------- phone: menu, anchor ----------
{
  const { ctx, page } = await open(390, 844);
  await page.locator('.menu summary').click();
  await page.locator('.menu a[href="#prestations"]').click();
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({ open: document.querySelector('.menu').open, top: Math.round(document.getElementById('prestations').getBoundingClientRect().top) }));
  ok(!r.open && Math.abs(r.top) < 4, 'phone menu: anchor reached, menu closed', JSON.stringify(r));
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(600);
  const hit = await page.evaluate(() => { const a = document.querySelector('.hero-cta'); const b = a.getBoundingClientRect(); const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return t === a || a.contains(t); });
  ok(hit, 'phone hero CTA is on top and clickable');
  await ctx.close();
}

// ---------- reduced motion: board at rest, no pin, no hidden state ----------
{
  const { ctx, page } = await open(1440, 900, { reduced: true });
  const r = await page.evaluate(() => ({ motion: document.documentElement.classList.contains('motion'), pos: getComputedStyle(document.querySelector('.hero')).position, runway: document.querySelector('.runway').offsetHeight === document.querySelector('.hero').offsetHeight, hidden: [...document.querySelectorAll('[data-reveal], [data-wipe], [data-script]')].filter((el) => Number(getComputedStyle(el).opacity) < 0.99 || getComputedStyle(el).clipPath.includes('100%')).length, btn: document.querySelector('[data-motion-toggle]').disabled }));
  ok(!r.motion && r.pos !== 'sticky' && r.runway && r.hidden === 0 && r.btn, 'reduced motion: no pin, all content visible, toggle disabled', JSON.stringify(r));
  await ctx.close();
}

// ---------- pause button ----------
{
  const { ctx, page } = await open(1440, 900);
  await page.locator('[data-motion-toggle]').click();
  const r = await page.evaluate(() => ({ motion: document.documentElement.classList.contains('motion'), pressed: document.querySelector('[data-motion-toggle]').getAttribute('aria-pressed'), stored: localStorage.getItem('aymen.motion.paused'), sticky: getComputedStyle(document.querySelector('.hero')).position }));
  ok(!r.motion && r.pressed === 'true' && r.stored === '1' && r.sticky !== 'sticky', 'pause: motion off and remembered', JSON.stringify(r));
  await page.reload({ waitUntil: 'networkidle' });
  ok(await page.evaluate(() => document.documentElement.classList.contains('still')), 'pause survives a reload');
  await page.evaluate(() => localStorage.removeItem('aymen.motion.paused'));
  await ctx.close();
}

// ---------- no JavaScript: everything readable ----------
{
  const { ctx, page } = await open(1440, 900, { js: false });
  const r = await page.evaluate(() => ({
    titles: [...document.querySelectorAll('main h1, main h2')].length,
    hidden: [...document.querySelectorAll('main h1, main h2, main p, main a')].filter((el) => Number(getComputedStyle(el).opacity) < 0.99).length,
    tel: [...document.querySelectorAll('main a')].filter((a) => a.href === 'tel:+33753496435').length,
    toggle: getComputedStyle(document.querySelector('[data-motion-toggle]')).display,
  }));
  ok(r.titles === 5 && r.hidden === 0 && r.tel >= 5 && r.toggle === 'none', 'no-JS: titles, copy and phone links present', JSON.stringify(r));
  await ctx.close();
}

// ---------- kit stays out of the deploy ----------
{
  const { ctx, page } = await open(800, 600);
  for (const p of ['LEIA-ME-KIT.md', 'roteiros/01-implementacao.md', 'site/index.html', 'references/Modelo-3-Aprovado.png', 'images/originals/Fachada-Aymen-Original.png', 'images/master/hero-plate.png', 'brand/palette.json']) {
    const res = await page.request.get(BASE + p);
    const body = await res.text();
    ok(!(res.status() === 200 && !body.includes('data-hero')), `kit file not served: ${p}`, String(res.status()));
  }
  await ctx.close();
}

await browser.close();
console.log(failed ? `\n${failed} check(s) failed` : '\nall checks passed');
process.exit(failed ? 1 : 0);
