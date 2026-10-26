// Pós-build: gera uma página estática por produto (título, meta, JSON-LD e texto no HTML) + sitemap/robots.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  SITE, bannerSrc, detailHTML, gridPageHTML, headTags, indexJsonLd, productJsonLd, productTitle, productDesc, productPath,
} from '../src/render.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const data = JSON.parse(readFileSync(join(root, 'src/data/products.json'), 'utf-8'));
const tpl = readFileSync(join(dist, 'index.html'), 'utf-8');
const EMPTY = '<div id="detail" data-lenis-prevent class="detail" role="dialog" aria-modal="true" aria-label="Detalhes do produto" aria-hidden="true"></div>';
if (!tpl.includes(EMPTY)) throw new Error('marcador #detail não encontrado no index.html');

data.produtos.forEach((p, i) => {
  const head = headTags({
    title: productTitle(p), description: productDesc(p), path: productPath(p),
    image: bannerSrc(p), jsonld: productJsonLd(p, data),
  });
  const body = `<div id="detail" data-lenis-prevent class="detail open static" role="dialog" aria-modal="true" aria-label="Detalhes do produto">${detailHTML(p, data, {
    prev: data.produtos[i - 1], next: data.produtos[i + 1],
  })}</div>`;
  const html = tpl
    .replace(/<!--HEAD-START-->[\s\S]*?<!--HEAD-END-->/, head)
    .replace(EMPTY, body);
  const dir = join(dist, 'produtos', p.handle);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
});

// /produtos/ — página em grade com as fotos dos produtos
{
  const GEMPTY = '<div id="gridpage" data-lenis-prevent class="gridpage" role="dialog" aria-modal="true" aria-label="Todos os produtos" aria-hidden="true"></div>';
  if (!tpl.includes(GEMPTY)) throw new Error('marcador #gridpage não encontrado');
  const head = headTags({
    title: 'Todos os produtos para pesqueiro | Chumbada Oficial',
    description: `Veja os ${data.produtos.length} produtos da linha pesqueiro da Chumbada Oficial: chumbadas, anzóis, atrativos, snaps, destorcedores, stoppers e acessórios de margem.`,
    path: '/produtos/', image: '/img/chumbada-bola-furada-natural.webp', jsonld: indexJsonLd(data),
  });
  const html = tpl
    .replace(/<!--HEAD-START-->[\s\S]*?<!--HEAD-END-->/, head)
    .replace(GEMPTY, `<div id="gridpage" data-lenis-prevent class="gridpage open static" role="dialog" aria-modal="true" aria-label="Todos os produtos">${gridPageHTML(data)}</div>`);
  mkdirSync(join(dist, 'produtos'), { recursive: true });
  writeFileSync(join(dist, 'produtos', 'index.html'), html);
}

const urls = ['/', '/produtos/', ...data.produtos.map(productPath)];
writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.url}/sitemap.xml\n`);
console.log(`prerender: ${data.produtos.length} páginas de produto + sitemap`);
