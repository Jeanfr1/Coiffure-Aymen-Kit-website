// Coiffure Aymen · motion and interactions. No library, no permanent loop: one
// requestAnimationFrame per scroll / resize / pointer event (motion/timeline.json).
import './styles/main.css';
import { SERVICES } from './data/content.js';

const root = document.documentElement;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };

const hero = $('[data-hero]');
const chair = $('[data-chair]');
const shadow = $('[data-chair-shadow]');
const signature = $('[data-signature]');
const heroUi = $$('[data-hero-ui]');
const strips = $$('[data-strip]');
const script = $('[data-script]');
const facade = $('[data-facade]');
const facadePhoto = $('.facade-photo');
const services = $('[data-services]');
const monoPath = $('[data-mono]');
const wipes = $$('[data-wipe]');
const rules = $$('[data-rule]');
const contact = $('[data-contact]');
const contactPhoto = $('[data-contact-photo]');
const brush = $('[data-brush]');
const toggle = $('[data-motion-toggle]');

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const isStatic = /[?&]static\b/.test(location.search);
let paused = root.classList.contains('paused');
let enabled = root.classList.contains('motion');
let frame = 0;
let pointer = 0;
let W = innerWidth;
let H = innerHeight;

function systemOff() {
  return isStatic || reduce.matches || !!navigator.connection?.saveData;
}

function setInert(els, on) {
  els.forEach((el) => { el.inert = on; if (on) el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
}

// ---------- one frame ----------
function draw() {
  frame = 0;
  if (!enabled || document.hidden) return;
  const hst = hero.offsetHeight;
  const desktop = W >= 1024;
  // 1 · the stage is pinned for one hero height while « Le savoir-faire » rises over it
  const p = clamp(scrollY / Math.max(1, hst));
  root.dataset.heroP = p.toFixed(3);
  const ui = 1 - smooth(0.18, 0.57, p);
  heroUi.forEach((el) => { el.style.opacity = ui.toFixed(3); el.style.transform = `translate3d(0, ${(-25 * p).toFixed(2)}px, 0)`; });
  setInert(heroUi, ui < 0.15);
  const chairOut = 1 - smooth(0.3, 0.92, p);
  chair.style.transform = `translate3d(${(-p * Math.min(W * 0.045, 74) + pointer).toFixed(2)}px, ${(-12 * p).toFixed(2)}px, 0) scale(${(1 + 0.025 * p).toFixed(4)})`;
  chair.style.opacity = chairOut.toFixed(3);
  shadow.style.opacity = chairOut.toFixed(3);
  signature.style.transform = `translate3d(${(p * W * 0.035).toFixed(2)}px, 0, 0)`;
  signature.style.opacity = (1 - smooth(0.18, 0.72, p)).toFixed(3);
  hero.style.setProperty('--dim', (0.45 * smooth(0.1, 1, p)).toFixed(3));

  // the comb: five strips of the montage, a wave that runs left to right and settles flat
  const lead = (desktop ? 0.17 : 0.14) * hst;
  strips.forEach((strip, i) => {
    const k = Math.sin(Math.PI * clamp((p - 0.06 * i) / 0.76));
    strip.style.transform = `translate3d(0, ${(-lead * k).toFixed(2)}px, 0)`;
    strip.style.setProperty('--lead', k.toFixed(3));
  });
  // « Le détail. » is written like the signature, once the montage reaches the top
  const sfBox = script.closest('section').getBoundingClientRect();
  const write = smooth(0.15, 0.85, clamp((H * 0.92 - sfBox.top - sfBox.height * 0.55) / (H * 0.45)));
  script.style.clipPath = `inset(-20% ${((1 - write) * 104).toFixed(2)}% -30% -6%)`;

  // 3 · the street: a short firm diagonal cut that closes, the photo settles
  const fr = facade.getBoundingClientRect();
  const fq = smooth(0, 1, clamp((H - fr.top) / (H * 0.62)));
  const cut = (1 - fq) * (desktop ? 0.07 : 0.1) * fr.width * 0.42;
  facade.style.clipPath = `polygon(0 ${cut.toFixed(1)}px, ${fr.width}px 0, ${fr.width}px ${fr.height + 2}px, 0 ${fr.height + 2}px)`;
  parallax(facadePhoto, fr, desktop);

  // 4 · services: the A is drawn, the titles wipe in, the rails draw
  const sr = services.getBoundingClientRect();
  const sq = clamp((H * 0.95 - sr.top) / (H * 0.7));
  monoPath.style.strokeDashoffset = (1000 * (1 - smooth(0, 0.95, sq))).toFixed(1);
  wipes.forEach((el, i) => { el.style.clipPath = `inset(-12% ${((1 - smooth(0.08 + i * 0.12, 0.5 + i * 0.12, sq)) * 101).toFixed(2)}% -12% -2%)`; });
  rules.forEach((el, i) => { el.style.transform = `scaleX(${smooth(0.25 + i * 0.1, 0.7 + i * 0.1, sq).toFixed(4)})`; });

  // 5 · contact: the photo opens from the right, the brush stroke is laid
  const cr = contact.getBoundingClientRect();
  const cq = clamp((H - cr.top) / (H * 0.75));
  const open = smooth(0, 0.8, cq);
  contactPhoto.style.clipPath = `inset(0 0 0 ${((1 - open) * 100).toFixed(2)}%)`;
  contactPhoto.style.transform = `translate3d(0, ${ratio(cr) * (desktop ? 18 : 10)}px, 0) scale(${(1.03 - 0.03 * open).toFixed(4)})`;
  brush.style.clipPath = `inset(0 ${((1 - smooth(0.4, 0.85, cq)) * 100).toFixed(2)}% 0 0)`;
}

function ratio(rect) {
  return +clamp((H * 0.5 - rect.top - rect.height * 0.5) / H, -0.8, 0.8).toFixed(4);
}

function parallax(el, rect, desktop) {
  const visible = rect.bottom > -80 && rect.top < H + 80;
  el.style.transform = `translate3d(0, ${visible ? (ratio(rect) * (desktop ? 18 : 10)).toFixed(2) : 0}px, 0)`;
}

function schedule() {
  if (enabled && !frame && !document.hidden) frame = requestAnimationFrame(draw);
}

// ---------- motion on / off ----------
const motionEls = () => [chair, shadow, signature, ...heroUi, ...strips, script, facade, facadePhoto, monoPath, ...wipes, ...rules, contactPhoto, brush];

function setMotion() {
  const off = systemOff();
  enabled = !paused && !off;
  root.classList.toggle('motion', enabled);
  root.classList.toggle('still', !enabled);
  root.classList.toggle('paused', paused);
  toggle.disabled = off;
  toggle.setAttribute('aria-pressed', String(!enabled));
  toggle.setAttribute('aria-label', off ? 'Animations désactivées selon vos préférences' : enabled ? 'Mettre en pause les animations' : 'Reprendre les animations');
  if (enabled) {
    if (observer) $$('[data-reveal]').forEach((el) => { if (!el.classList.contains('is-in')) watchReveal(el); });
    schedule();
  } else {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    root.classList.remove('intro', 'pre');
    motionEls().forEach((el) => { el.removeAttribute('style'); });
    hero.style.removeProperty('--dim');
    setInert(heroUi, false);
    delete root.dataset.heroP;
  }
}

toggle.addEventListener('click', () => {
  paused = !paused;
  try { localStorage.setItem('aymen.motion.paused', paused ? '1' : '0'); } catch (e) { /* optional */ }
  setMotion();
});
reduce.addEventListener?.('change', setMotion);
navigator.connection?.addEventListener?.('change', setMotion);
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => { W = innerWidth; H = innerHeight; pointer = 0; schedule(); }, { passive: true });
document.addEventListener('visibilitychange', schedule);
hero.addEventListener('pointermove', (e) => {
  if (!enabled || !finePointer.matches) return;
  pointer = clamp(e.clientX / Math.max(1, W) - 0.5, -0.5, 0.5) * 8;
  schedule();
}, { passive: true });
hero.addEventListener('pointerleave', () => { pointer = 0; schedule(); });

// ---------- once-only entries ----------
// a masked element has no visible area to intersect, so its frame is watched instead
const watched = new Map();
const observer = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    (watched.get(entry.target) || [entry.target]).forEach((el) => el.classList.add('is-in'));
    observer.unobserve(entry.target);
  }), { threshold: 0.12, rootMargin: '0px 0px -24px 0px' })
  : null;
const watchReveal = (el) => {
  if (el.dataset.reveal !== 'mask') { observer.observe(el); return; }
  const target = el.parentElement;
  watched.set(target, [...(watched.get(target) || []), el]);
  observer.observe(target);
};
if (!observer) $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));

// ---------- opening: fonts ready, chair decoded, top of the page ----------
setMotion();
Promise.all([document.fonts?.ready, chair.decode?.().catch(() => {})]).then(() => {
  if (enabled && scrollY < 24 && root.classList.contains('pre')) {
    root.classList.remove('pre');
    root.classList.add('intro');
    setTimeout(() => root.classList.remove('intro'), 1350);
  } else {
    root.classList.remove('pre');
  }
  schedule();
});

// ---------- phone menu ----------
const menu = $('[data-menu]');
$$('a', menu).forEach((a) => a.addEventListener('click', () => menu.removeAttribute('open')));
document.addEventListener('click', (e) => { if (menu.open && !menu.contains(e.target)) menu.removeAttribute('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.open) { menu.removeAttribute('open'); $('summary', menu).focus(); } });

// ---------- services dialog: tabs with arrows / Home / End, Escape, focus return ----------
const dialog = $('#service-dialog');
const tabs = $$('[role="tab"]', dialog);
let opener = null;

function choose(key, focus = false) {
  const s = SERVICES[key];
  if (!s) return;
  $('#service-dialog-title').textContent = s.title;
  $('#service-description').textContent = s.description;
  tabs.forEach((tab) => {
    const on = tab.dataset.tab === key;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  });
  $('#service-panel').setAttribute('aria-labelledby', `tab-${key}`);
}

$$('[data-service]').forEach((link) => link.addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || typeof dialog.showModal !== 'function') return;
  e.preventDefault();
  opener = link;
  choose(link.dataset.service);
  dialog.showModal();
  $('[data-dialog-close]').focus();
}));
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => choose(tab.dataset.tab, true));
  tab.addEventListener('keydown', (e) => {
    const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    choose(tabs[next].dataset.tab, true);
  });
});
$('[data-dialog-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (e) => {
  if (e.target !== dialog) return;
  const r = dialog.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
});
dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus({ preventScroll: true }); });
choose('homme');
