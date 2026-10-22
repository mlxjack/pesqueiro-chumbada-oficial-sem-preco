// Funções puras (navegador, build do Vite e prerender) que geram o HTML. As faixas são usadas como vieram das artes.
import { PRECO, SITE_URL } from './config.js';

export const SITE = {
  url: SITE_URL,
  loja: 'https://chumbadas.com.br',
  wa: '5511941900602',
};
export const pad = (n) => String(n).padStart(2, '0');
export const brl = (n) => (n == null ? '' : 'R$ ' + n.toFixed(2).replace('.', ','));
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const lojaUrl = (p) => `${SITE.loja}/products/${p.handle}`;
export const waUrl = (p) => `https://wa.me/${SITE.wa}?text=${encodeURIComponent(`Olá! Quero saber mais sobre: ${p.titulo}`)}`;
export const productPath = (p) => `/produtos/${p.handle}/`;
export const bannerSrc = (p, suf = '') => `/img/${p.handle}${suf}.webp`;
const catName = (data, id) => data.categorias.find((c) => c.id === id)?.nome ?? '';
const meta = (p) => [p.variacoes > 1 ? `${p.variacoes} variações` : '1 versão', PRECO && p.preco ? `a partir de ${brl(p.preco)}` : ''].filter(Boolean).join(' · ');

const img = (p, cls, eager) =>
  `<img class="${cls}" src="${bannerSrc(p)}" srcset="${bannerSrc(p, '-m')} 900w, ${bannerSrc(p)} 1800w" sizes="(max-width: 900px) 100vw, 1500px" width="1800" height="600" alt="${esc(p.titulo)} — ${esc(p.frase)}" ${eager ? '' : 'loading="lazy"'} decoding="async">`;

export function slideHTML(p, data) {
  return `<section class="slide" data-cat="${p.cat}" data-n="${p.n}" data-search="${esc((p.titulo + ' ' + p.tags.join(' ')).toLowerCase())}">
  <div class="slide-in">
    <a class="banner" href="${productPath(p)}" data-handle="${p.handle}">
      <span class="banner-clip">${img(p, 'banner-img')}<i class="shine"></i></span>
    </a>
    <div class="cap">
      <span class="cap-n">${pad(p.n)}</span>
      <div class="cap-t"><h3>${esc(p.nome)}</h3><p>${esc(p.gancho)}. ${esc(p.frase)}</p></div>
      <span class="cap-cat">${esc(catName(data, p.cat))}</span>
      <span class="cap-meta">${esc(meta(p))}</span>
      <a class="cap-go" href="${productPath(p)}" data-handle="${p.handle}" aria-label="Ver detalhes de ${esc(p.nome)}">Ver detalhes <b>↗</b></a>
    </div>
  </div>
</section>`;
}

export function cardHTML(p, data) {
  return `<a class="pcard" href="${productPath(p)}" data-handle="${p.handle}" data-cat="${p.cat}" data-search="${esc((p.titulo + ' ' + p.tags.join(' ')).toLowerCase())}">
  <span class="pcard-n">${pad(p.n)}</span>
  <span class="pcard-img"><img src="${p.foto}" alt="${esc(p.titulo)} — Chumbada Oficial" loading="lazy" decoding="async" width="600" height="600"></span>
  <span class="pcard-body"><em>${esc(catName(data, p.cat))}</em><h3>${esc(p.nome)}</h3><span class="pcard-meta">${esc(meta(p))}</span><b class="pcard-go" aria-hidden="true">↗</b></span>
</a>`;
}

export function gridPageHTML(data) {
  const chips = [['todos', 'Todos'], ...data.categorias.map((c) => [c.id, c.nome])]
    .map(([id, n], i) => `<button class="chip${i === 0 ? ' is-on' : ''}" data-gfilter="${id}" type="button">${esc(n)}</button>`)
    .join('');
  return `<div class="gp-inner">
  <button class="detail-close gp-close" type="button" aria-label="Fechar"><span></span><span></span></button>
  <header class="gp-head">
    <p class="eyebrow">Chumbada Oficial · Linha Pesqueiro</p>
    <h2 class="big gp-title">Todos os produtos</h2>
    <div class="filters" role="toolbar" aria-label="Filtrar produtos">${chips}<label class="search"><span class="sr-only">Buscar produto</span><input type="search" data-gsearch placeholder="Buscar: snap, oliva, anzol…" autocomplete="off"></label></div>
    <p class="gp-count" aria-live="polite"><b>${data.produtos.length}</b> produtos</p>
  </header>
  <div class="gp-grid">${data.produtos.map((p) => cardHTML(p, data)).join('')}</div>
  <p class="empty" data-gempty hidden>Nenhum produto encontrado. Tente outra palavra.</p>
</div>`;
}

export function wallHTML(data) {
  const ps = data.produtos;
  const rows = [0, 1, 2, 3].map((r) => ps.filter((_, i) => i % 4 === r));
  return rows
    .map((row, r) => {
      const strip = row.map((p) => `<img src="${bannerSrc(p, '-t')}" width="480" height="160" alt="" loading="${r < 2 ? 'eager' : 'lazy'}" decoding="async">`).join('');
      return `<div class="wall-row" data-dir="${r % 2 ? -1 : 1}"><div class="wall-track">${strip}${strip}</div></div>`;
    })
    .join('');
}

export function detailHTML(p, data, { prev, next } = {}) {
  const cat = catName(data, p.cat);
  // seletores: só dimensões com mais de um valor (as fixas entram no rótulo da variação)
  const pickers = Object.entries(p.opcoes)
    .filter(([, v]) => v.length > 1)
    .map(([k, v]) => `<div class="pick" data-opt="${esc(k)}"><h4>${esc(k)}</h4><div class="pills">${v.map((x) => `<button type="button" class="pill" data-val="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`)
    .join('');
  const desc = p.desc.map((t) => (t.length < 60 && /:$/.test(t) ? `<h3>${esc(t.replace(/:$/, ''))}</h3>` : `<p>${esc(t)}</p>`)).join('');
  return `<div class="detail-inner">
  <button class="detail-close" type="button" aria-label="Fechar produto"><span></span><span></span></button>
  <div class="detail-bar">
    <p class="crumbs"><span>Pesqueiro</span><i>/</i><span>${esc(cat)}</span><i>/</i><b>${esc(p.nome)}</b></p>
  </div>
  <div class="detail-banner">${img(p, 'detail-img', true)}</div>
  <div class="detail-cols">
    <header class="dinfo">
      <p class="eyebrow">${esc(cat)} · nº ${pad(p.n)}</p>
      <h2 class="detail-name">${esc(p.nome)}</h2>
      <p class="detail-title">${esc(p.titulo)}</p>
      <p class="detail-hook"><b>${esc(p.gancho)}.</b> ${esc(p.frase)}</p>
    </header>
    <div class="side">
    <div class="gallery" data-gallery>
      <figure class="gal-main"><img src="${p.foto}" alt="${esc(p.titulo)} — foto do produto" data-main width="1000" height="1000"></figure>
      ${p.fotos.length > 1 ? `<div class="gal-thumbs" role="group" aria-label="Fotos do produto">${p.fotos.map((f, i) => `<button type="button" class="thumb${i === 0 ? ' is-on' : ''}" data-foto="${f}" aria-label="Foto ${i + 1}"><img src="${f}" alt="" loading="lazy" width="120" height="120"></button>`).join('')}</div>` : ''}
    </div>
    <aside class="buy" aria-label="Comprar">
      ${PRECO ? `<div class="buy-price"><small data-price-label>${p.variacoes > 1 ? 'a partir de' : 'preço'}</small><b data-price>${p.preco ? brl(p.preco) : 'Consulte'}</b></div>` : `<div class="buy-price"><small>${p.variacoes > 1 ? p.variacoes + ' variações' : 'versão única'}</small></div>`}
      ${pickers}
      <p class="buy-sel" data-sel></p>
      <div class="buy-row">
        <div class="qty" role="group" aria-label="Quantidade"><button type="button" data-q="-1" aria-label="Menos">−</button><input type="number" min="1" max="9999" value="1" inputmode="numeric" aria-label="Quantidade"><button type="button" data-q="1" aria-label="Mais">+</button></div>
        <button type="button" class="btn btn-solid btn-add" data-add>${PRECO ? 'Adicionar à Minha Seleção' : 'Adicionar à Lista'}</button>
      </div>
      <div class="buy-links">
        <a class="btn" href="${lojaUrl(p)}" target="_blank" rel="noopener">Comprar na loja <span>↗</span></a>
        <a class="btn" href="${waUrl(p)}" target="_blank" rel="noopener">WhatsApp <span>↗</span></a>
      </div>
    </aside>
    </div>
    <div class="ddesc"><h3 class="sr-only">Descrição</h3>${desc}</div>
  </div>
  <nav class="detail-nav" aria-label="Outros produtos">
    ${prev ? `<a href="${productPath(prev)}" data-handle="${prev.handle}"><small>← anterior</small>${esc(prev.nome)}</a>` : '<span></span>'}
    ${next ? `<a href="${productPath(next)}" data-handle="${next.handle}"><small>próximo →</small>${esc(next.nome)}</a>` : '<span></span>'}
  </nav>
</div>`;
}

const plain = (p) => p.desc.find((t) => t.length > 60)?.slice(0, 280) ?? p.frase;

export function productJsonLd(p, data) {
  const url = SITE.url + productPath(p);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product', name: p.titulo, image: [SITE.url + (p.foto || bannerSrc(p)), SITE.url + bannerSrc(p)], description: plain(p),
        brand: { '@type': 'Brand', name: 'Chumbada Oficial' }, category: catName(data, p.cat), url,
        offers: PRECO && p.preco ? {
          '@type': p.variacoes > 1 ? 'AggregateOffer' : 'Offer', priceCurrency: 'BRL',
          ...(p.variacoes > 1 ? { lowPrice: p.preco, offerCount: p.variacoes } : { price: p.preco }),
          availability: 'https://schema.org/InStock', url: lojaUrl(p),
        } : undefined,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Pesqueiro', item: SITE.url + '/' },
          { '@type': 'ListItem', position: 2, name: catName(data, p.cat), item: SITE.url + '/#produtos' },
          { '@type': 'ListItem', position: 3, name: p.nome, item: url },
        ],
      },
    ],
  };
}

export function indexJsonLd(data) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', name: 'Chumbada Oficial', url: SITE.loja, sameAs: [SITE.loja] },
      {
        '@type': 'ItemList', name: 'Produtos para pesqueiro — Chumbada Oficial',
        itemListElement: data.produtos.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE.url + productPath(p), name: p.titulo })),
      },
    ],
  };
}

export function headTags({ title, description, path, image, jsonld }) {
  const url = SITE.url + path;
  return `<!--HEAD-START-->
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Chumbada Oficial — Pesqueiro">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE.url}${image}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<!--HEAD-END-->`;
}

export const DEFAULT_TITLE = 'Produtos para Pesqueiro | Chumbadas, Anzóis, Iscas e Acessórios — Chumbada Oficial';
export const DEFAULT_DESC = 'Linha completa Chumbada Oficial para pesqueiro: chumbadas bola furada, oliva e poita, anzóis, atrativos, snaps, destorcedores, stoppers e acessórios de margem.';
export const productTitle = (p) => `${p.titulo} | Pesqueiro — Chumbada Oficial`;
export const productDesc = (p) => `${p.titulo}. ${p.gancho}. ${p.frase} Veja variações e compre na loja oficial Chumbada.`.slice(0, 300);
