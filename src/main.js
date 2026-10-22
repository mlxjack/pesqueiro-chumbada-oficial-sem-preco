import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import data from './data/products.json';
import { PRECO } from './config.js';
import { detailHTML, gridPageHTML, brl, productPath, productTitle, DEFAULT_TITLE } from './render.js';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const stats = JSON.parse(document.body.dataset.stats || '{}');
const list = data.produtos;
const byHandle = (h) => list.find((p) => p.handle === h);
const productPage = () => location.pathname.match(/^\/produtos\/([^/]+)\/?$/)?.[1];
const gridPath = () => /^\/produtos\/?$/.test(location.pathname);

/* ---------- scroll suave ---------- */
let lenis = null;
if (!reduce) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
const scrollTo = (target, opts = {}) =>
  lenis ? lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts })
        : (typeof target === 'string' ? $(target) : target)?.scrollIntoView({ behavior: 'smooth' });
$$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); scrollTo(a.getAttribute('href')); }));

/* ---------- loader + entrada ---------- */
const loader = $('.loader');
function intro() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.nav-logo > *, .nav-links > *', { y: -16, opacity: 0, duration: 0.8, stagger: 0.08 }, 0)
    .from('.hero-tag', { y: 20, opacity: 0, duration: 0.9 }, 0.1)
    .from('.hero-title .line > span', { yPercent: 115, duration: 1.3, stagger: 0.12 }, 0.1)
    .from('.hero-lead', { y: 24, opacity: 0, duration: 1 }, 0.6)
    .from('.hero-down', { y: 24, opacity: 0, duration: 1 }, 0.75)
    .from('.wall-row', { xPercent: (i) => (i % 2 ? -12 : 12), opacity: 0, duration: 2, stagger: 0.12, ease: 'power3.out' }, 0);
}
function runLoader() {
  if (reduce || productPage() || gridPath()) { loader.remove(); document.body.classList.remove('loading'); return setup(); }
  lenis?.stop();
  const count = $('.loader-count'), o = { v: 0 };
  const logo = $('.loader-logo');
  // a logo entra girando, dá um "pulo" ao fim da contagem e some enquanto as barras sobem
  gsap.from(logo, { scale: 0.35, rotation: -18, opacity: 0, duration: 1.2, ease: 'back.out(1.7)' });
  gsap.timeline()
    .to(o, { v: 100, duration: 1.4, ease: 'power2.inOut', onUpdate: () => (count.textContent = Math.round(o.v)) })
    .to(count, { opacity: 0, y: 20, duration: 0.3 })
    .to(logo, { scale: 1.12, rotation: 4, duration: 0.3, ease: 'power2.out' }, '<')
    .addLabel('go')
    .to(logo, { scale: 1.5, opacity: 0, rotation: -6, y: -40, duration: 0.7, ease: 'power3.in' }, 'go')
    .to('.loader i', { yPercent: -101, duration: 0.95, stagger: 0.09, ease: 'power4.inOut' }, 'go+=0.1')
    .add(() => { lenis?.start(); document.body.classList.remove('loading'); intro(); }, 'go+=0.55')
    .set(loader, { display: 'none' });
  setup();
}

/* ---------- animações de scroll ---------- */
let slideTriggers = [];
function setup() {
  // nav + barra de progresso
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { $('.nav-bar').style.transform = `scaleX(${s.progress})`; $('.nav').classList.toggle('solid', s.scroll() > 60); } });

  // hero: parede de faixas anda em sentidos opostos e afasta ao rolar
  $$('.wall-row').forEach((row, i) =>
    gsap.to(row, { x: (i % 2 ? 1 : -1) * 260, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } }),
  );
  gsap.to('.wall', { scale: 1.18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-inner', { yPercent: -22, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '20% top', end: 'bottom top', scrub: true } });

  // faixa laranja reage à velocidade
  const skew = gsap.quickTo('.ticker-in', 'skewX', { duration: 0.5, ease: 'power3' });
  ScrollTrigger.create({ onUpdate: (s) => skew(clamp(s.getVelocity() / -250, -14, 14)) });

  // contadores
  $$('[data-count]').forEach((el) => {
    const end = stats[el.dataset.count] ?? parseInt(el.dataset.count, 10);
    if (!end) return;
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => (el.textContent = Math.round(o.v)), scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
  gsap.from('.stats > div', { y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.stats', start: 'top 90%', once: true } });

  // texto da introdução palavra por palavra
  const it = $('.reveal-words');
  it.innerHTML = it.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  gsap.fromTo($$('.w', it), { opacity: 0.14 }, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: it, start: 'top 78%', end: 'bottom 48%', scrub: true } });

  // títulos em máscara
  $$('.big, .cta-title').forEach((t) =>
    gsap.from($$('.line > span', t), { yPercent: 115, duration: 1.2, stagger: 0.12, ease: 'power4.out', scrollTrigger: { trigger: t, start: 'top 85%', once: true } }),
  );
  gsap.from('.filters > *', { y: 24, opacity: 0, duration: 0.7, stagger: 0.05, ease: 'power3.out', scrollTrigger: { trigger: '.filters', start: 'top 92%', once: true } });
  gsap.from('.cta .tag, .cta-actions, .cta-links', { y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 70%', once: true } });

  buildSlides();
  if (fine) setupBanners();
  setupMagnetic();
  ScrollTrigger.refresh();
}

/* ---------- faixas empilhadas ---------- */
const nowEl = $('.now');
function buildSlides() {
  slideTriggers.forEach((t) => t.kill());
  slideTriggers = [];
  const slides = $$('.slide').filter((s) => !s.classList.contains('is-hidden'));
  $('.now span').textContent = `/ ${String(slides.length).padStart(2, '0')}`;
  slides.forEach((s, i) => {
    const clip = $('.banner-clip', s), img = $('.banner-img', s), cap = $('.cap', s);
    // entrada: faixa se revela com um corte e a arte "assenta"
    if (!s.dataset.shown) {
      gsap.set(clip, { clipPath: 'inset(0 100% 0 0 round 20px)' });
      gsap.set(img, { scale: 1.3 });
      gsap.set(cap.children, { y: 30, opacity: 0 });
    }
    slideTriggers.push(ScrollTrigger.create({
      trigger: s, start: 'top 88%', once: true,
      onEnter: () => {
        s.dataset.shown = '1';
        gsap.timeline({ defaults: { ease: 'power4.out' } })
          .to(clip, { clipPath: 'inset(0 0% 0 0 round 20px)', duration: 1.3 }, 0)
          .to(img, { scale: 1, duration: 1.8 }, 0)
          .to(cap.children, { y: 0, opacity: 1, duration: 0.9, stagger: 0.07 }, 0.35);
      },
    }));
    // a faixa anterior recua quando a próxima sobe por cima
    const next = slides[i + 1];
    if (next) {
      const tw = gsap.to($('.slide-in', s), {
        scale: 0.9, opacity: 0.25, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top 85%', end: 'top 90px', scrub: true },
      });
      slideTriggers.push(tw.scrollTrigger);
    }
    // indicador "01 / 26"
    slideTriggers.push(ScrollTrigger.create({
      trigger: s, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) { $('.now b').textContent = String(i + 1).padStart(2, '0'); $('.now em').textContent = $('h3', s).textContent; } },
    }));
  });
  slideTriggers.push(ScrollTrigger.create({ trigger: '.slides', start: 'top 60%', end: 'bottom 40%', onToggle: (self) => nowEl.classList.toggle('on', self.isActive) }));
}

/* ---------- inclinação 3D das faixas ---------- */
function setupBanners() {
  $$('.banner').forEach((b) => {
    const clip = $('.banner-clip', b);
    gsap.set(b, { transformPerspective: 1200 });
    const rx = gsap.quickTo(b, 'rotationX', { duration: 0.6, ease: 'power3' });
    const ry = gsap.quickTo(b, 'rotationY', { duration: 0.6, ease: 'power3' });
    b.addEventListener('pointermove', (e) => {
      const r = clip.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 5);
      rx((0.5 - (e.clientY - r.top) / r.height) * 4);
    });
    b.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
function setupMagnetic() {
  if (!fine) return;
  $$('.btn, .nav-cta').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' }), y = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' });
    el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
    el.addEventListener('pointerleave', () => { x(0); y(0); });
  });
}

/* ---------- filtros + busca ---------- */
let filter = 'todos', query = '';
function applyFilter() {
  let n = 0;
  $$('.slide').forEach((s) => {
    const ok = (filter === 'todos' || s.dataset.cat === filter) && (!query || s.dataset.search.includes(query));
    s.classList.toggle('is-hidden', !ok);
    if (ok) n++;
  });
  $('.empty').hidden = n > 0;
  buildSlides();
  ScrollTrigger.refresh();
  const top = $('.slides').getBoundingClientRect().top + scrollY - 160;
  if (scrollY > top) scrollTo(top, { duration: 0.9 });
}
$$('.chip').forEach((c) => c.addEventListener('click', () => {
  filter = c.dataset.filter;
  $$('.chip').forEach((x) => x.classList.toggle('is-on', x === c));
  applyFilter();
}));
$('.search input').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); applyFilter(); });

/* ---------- detalhe do produto ---------- */
const detail = $('#detail');
let openHandle = null;
/* seletor de variação + quantidade + "Minha Seleção" (mesmo carrinho dos catálogos) */
function setupGallery() {
  const main = $('[data-main]', detail), thumbs = $$('.thumb', detail), strip = $('.gal-thumbs', detail);
  function show(src) {
    if (!main || !src || main.getAttribute('src') === src) return;
    gsap.to(main, { opacity: 0, duration: 0.15, onComplete: () => { main.src = src; gsap.to(main, { opacity: 1, duration: 0.35 }); } });
    thumbs.forEach((t) => {
      const on = t.dataset.foto === src;
      t.classList.toggle('is-on', on);
      if (on && strip) strip.scrollTo({ left: t.offsetLeft - strip.clientWidth / 2 + t.clientWidth / 2, behavior: 'smooth' });
    });
  }
  thumbs.forEach((t) => t.addEventListener('click', () => show(t.dataset.foto)));
  return show;
}

function setupBuy(p) {
  const showFoto = setupGallery();
  const root = $('.buy', detail);
  if (!root || !p.variantes.length) return;
  const vs = p.variantes, dims = Object.keys(p.opcoes);
  let sel = { ...vs[0].opts }, qty = 1, firstPaint = true; // ao abrir, mostra a foto principal; a foto da variação aparece quando o cliente escolhe
  const current = () => vs.find((v) => dims.every((k) => v.opts[k] === sel[k])) || vs[0];
  const label = (v) => Object.entries(v.opts).map(([k, x]) => `${k}: ${x}`).join(', ');
  const input = $('.qty input', root), add = $('[data-add]', root);
  function paint() {
    const v = current();
    $$('.pick', root).forEach((g) => $$('.pill', g).forEach((b) => { const on = v.opts[g.dataset.opt] === b.dataset.val; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); }));
    if (PRECO) {
      $('[data-price]', root).textContent = v.price > 0 ? brl(v.price) : 'Consulte';
      $('[data-price-label]', root).textContent = 'preço unitário';
    }
    $('[data-sel]', root).textContent = [label(v), v.sku && `SKU ${v.sku}`].filter(Boolean).join(' · ');
    add.disabled = PRECO && !(v.price > 0);
    input.value = qty;
    if (v.img && !firstPaint) showFoto(v.img);
    firstPaint = false;
  }
  $$('.pill', root).forEach((b) => b.addEventListener('click', () => {
    const k = b.closest('.pick').dataset.opt, val = b.dataset.val;
    // escolhe a variação que contém o valor clicado e preserva o máximo das outras escolhas
    const score = (v) => dims.filter((d) => d !== k && v.opts[d] === sel[d]).length;
    const best = vs.filter((v) => v.opts[k] === val).sort((a, c) => score(c) - score(a))[0];
    if (best) sel = { ...best.opts };
    paint();
  }));
  $$('.qty button', root).forEach((b) => b.addEventListener('click', () => { qty = clamp(qty + +b.dataset.q, 1, 9999); input.value = qty; }));
  input.addEventListener('input', () => { qty = clamp(parseInt(input.value, 10) || 1, 1, 9999); });
  input.addEventListener('blur', () => (input.value = qty));
  add.addEventListener('click', () => {
    const v = current();
    if (!window.MinhaSelecao) { window.open(`https://wa.me/5511941900602?text=${encodeURIComponent(`Olá! Quero: ${p.titulo} ${label(v)} (${qty}x)`)}`, '_blank'); return; }
    window.MinhaSelecao.addItem({ catalog: p.catSelecao, productId: p.handle, name: p.titulo, sku: v.sku || null, variant: label(v), qty, ...(PRECO ? { unitPrice: v.price } : {}) });
    qty = 1; input.value = 1;
    gsap.fromTo(add, { scale: 0.94 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' });
  });
  paint();
}

function renderDetail(p) {
  const i = list.indexOf(p);
  detail.innerHTML = detailHTML(p, data, { prev: list[i - 1], next: list[i + 1] });
  detail.scrollTop = 0;
  openHandle = p.handle;
  document.title = productTitle(p);
  setupBuy(p);
  $('.detail-close', detail).addEventListener('click', () => closeDetail());
  $$('.detail-nav a', detail).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); swapDetail(byHandle(a.dataset.handle)); }));
  gsap.from('.dinfo > *, .crumbs', { y: 40, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.2 });
  gsap.fromTo('.detail-banner', { clipPath: 'inset(0 100% 0 0 round 20px)' }, { clipPath: 'inset(0 0% 0 0 round 20px)', duration: 1.3, ease: 'power4.out', delay: 0.3 });
  gsap.from('.detail-img', { scale: 1.3, duration: 1.8, ease: 'power4.out', delay: 0.3 });
  gsap.from('.detail-cols > *', { y: 50, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out', delay: 0.6 });
}
let locks = 0;
const lock = () => { if (locks++ === 0) { lenis?.stop(); document.documentElement.classList.add('no-scroll'); } };
const unlock = () => { locks = Math.max(0, locks - 1); if (!locks) { lenis?.start(); document.documentElement.classList.remove('no-scroll'); } };
const originOf = (e, el) => { const r = el.getBoundingClientRect(); return { x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2 }; };

function openDetail(p, { push = true, origin } = {}) {
  renderDetail(p);
  detail.classList.add('open');
  detail.setAttribute('aria-hidden', 'false');
  lock();
  const ox = origin ? origin.x : innerWidth / 2, oy = origin ? origin.y : innerHeight / 2;
  gsap.fromTo(detail, { clipPath: `circle(0px at ${ox}px ${oy}px)` }, { clipPath: `circle(150% at ${ox}px ${oy}px)`, duration: 1, ease: 'power3.inOut', clearProps: 'clipPath' });
  if (push) history.pushState({ h: p.handle }, '', productPath(p));
  $('.detail-close', detail).focus({ preventScroll: true });
}
function swapDetail(p) {
  gsap.to(detail, { opacity: 0, duration: 0.2, onComplete: () => { renderDetail(p); gsap.to(detail, { opacity: 1, duration: 0.3 }); } });
  history.replaceState({ h: p.handle }, '', productPath(p));
}
function closeDetail({ push = true } = {}) {
  if (!openHandle) return;
  const back = $(`.banner[data-handle="${openHandle}"], .pcard[data-handle="${openHandle}"]`);
  openHandle = null;
  gsap.to(detail, {
    clipPath: 'circle(0px at 50% 100%)', duration: 0.75, ease: 'power3.inOut',
    onComplete: () => {
      detail.classList.remove('open', 'static');
      detail.setAttribute('aria-hidden', 'true');
      detail.innerHTML = '';
      gsap.set(detail, { clearProps: 'all' });
      unlock();
      back?.focus({ preventScroll: true });
    },
  });
  document.title = gridOpen ? GRID_TITLE : DEFAULT_TITLE;
  const to = gridOpen ? '/produtos/' : '/';
  if (push && location.pathname !== to) history.pushState({}, '', to);
}

/* ---------- página em grade com as fotos dos produtos (/produtos/) ---------- */
const GRID_TITLE = 'Todos os produtos para pesqueiro | Chumbada Oficial';
const gridEl = $('#gridpage');
let gridOpen = false, gFilter = 'todos', gQuery = '';
function applyGridFilter() {
  const cards = $$('.pcard', gridEl);
  let n = 0;
  cards.forEach((c) => {
    const ok = (gFilter === 'todos' || c.dataset.cat === gFilter) && (!gQuery || c.dataset.search.includes(gQuery));
    c.classList.toggle('is-hidden', !ok);
    if (ok) n++;
  });
  $('.gp-count', gridEl).innerHTML = `<b>${n}</b> ${n === 1 ? 'produto' : 'produtos'}`;
  $('[data-gempty]', gridEl).hidden = n > 0;
  gsap.fromTo($$('.pcard:not(.is-hidden)', gridEl), { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.025, ease: 'power3.out', overwrite: true });
}
function openGrid({ push = true, origin } = {}) {
  if (gridOpen) return;
  gridOpen = true; gFilter = 'todos'; gQuery = '';
  gridEl.innerHTML = gridPageHTML(data);
  gridEl.classList.remove('static');
  gridEl.classList.add('open');
  gridEl.setAttribute('aria-hidden', 'false');
  lock();
  $('.gp-close', gridEl).addEventListener('click', () => closeGrid());
  $$('[data-gfilter]', gridEl).forEach((c) => c.addEventListener('click', () => {
    gFilter = c.dataset.gfilter;
    $$('[data-gfilter]', gridEl).forEach((x) => x.classList.toggle('is-on', x === c));
    applyGridFilter();
  }));
  $('[data-gsearch]', gridEl).addEventListener('input', (e) => { gQuery = e.target.value.trim().toLowerCase(); applyGridFilter(); });
  const ox = origin ? origin.x : innerWidth / 2, oy = origin ? origin.y : 0;
  gsap.fromTo(gridEl, { clipPath: `circle(0px at ${ox}px ${oy}px)` }, { clipPath: `circle(150% at ${ox}px ${oy}px)`, duration: 1, ease: 'power3.inOut', clearProps: 'clipPath' });
  gsap.from('.gp-head > *', { y: 40, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.25 });
  gsap.from('.pcard', { y: 70, opacity: 0, scale: 0.96, duration: 0.9, stagger: { amount: 0.9 }, ease: 'power3.out', delay: 0.45 });
  document.title = GRID_TITLE;
  if (push) history.pushState({ grid: 1 }, '', '/produtos/');
}
function closeGrid({ push = true } = {}) {
  if (!gridOpen) return;
  gridOpen = false;
  gsap.to(gridEl, {
    clipPath: 'circle(0px at 50% 0%)', duration: 0.75, ease: 'power3.inOut',
    onComplete: () => {
      gridEl.classList.remove('open', 'static');
      gridEl.setAttribute('aria-hidden', 'true');
      gridEl.innerHTML = '';
      gsap.set(gridEl, { clearProps: 'all' });
      unlock();
    },
  });
  document.title = DEFAULT_TITLE;
  if (push && location.pathname !== '/') history.pushState({}, '', '/');
}

document.addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey) return;
  const g = e.target.closest('a[data-grid]');
  if (g) { e.preventDefault(); openGrid({ origin: originOf(e, g) }); return; }
  const a = e.target.closest('#slides a[data-handle], .pcard[data-handle]');
  if (a) { e.preventDefault(); openDetail(byHandle(a.dataset.handle), { origin: originOf(e, a) }); }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') { openHandle ? closeDetail() : closeGrid(); } });
addEventListener('popstate', () => {
  const h = productPage();
  if (h && byHandle(h)) { openHandle ? swapDetail(byHandle(h)) : openDetail(byHandle(h), { push: false }); return; }
  if (openHandle) closeDetail({ push: false });
  if (gridPath()) openGrid({ push: false }); else closeGrid({ push: false });
});

/* ---------- arranque ---------- */
$('#ano').textContent = new Date().getFullYear();
document.fonts.ready.then(() => {
  runLoader();
  const h = productPage();
  if (gridPath()) openGrid({ push: false });
  else if (h && byHandle(h)) { detail.classList.remove('static'); openDetail(byHandle(h), { push: false }); }
});
