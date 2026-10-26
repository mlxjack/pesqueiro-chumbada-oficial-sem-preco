"""Produtos que não estão no CSV do pesqueiro mas fazem parte da linha (vêm do catálogo de acessórios).
Gera fotos em public/fotos, o banner em public/img e src/data/extras.json (mesclado por build_data.py).
Fonte: E:\\Claude\\catalogo-acessorios-precos-chumbada + dados extraídos em _fontes/paredao.json."""
import hashlib, html, io, json, os, re, shutil, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = r'E:\Claude\catalogo-acessorios-precos-chumbada\assets'
src = json.load(open(f'{ROOT}/_fontes/paredao.json', encoding='utf-8'))


def save(im, dest, maxside=1000):
    im.thumbnail((maxside, maxside), Image.LANCZOS)
    im.save(dest, 'WEBP', quality=80, method=6)


def foto(ref):
    """caminho relativo do catálogo ou URL -> /fotos/<hash>.webp"""
    h = hashlib.sha1(ref.split('?')[0].encode()).hexdigest()[:12]
    dest = f'{ROOT}/public/fotos/{h}.webp'
    if not os.path.exists(dest):
        if ref.startswith('http'):
            data = urllib.request.urlopen(urllib.request.Request(ref, headers={'User-Agent': 'Mozilla/5.0'}), timeout=40).read()
            im = Image.open(io.BytesIO(data))
        else:
            im = Image.open(f'{CAT}/{ref.replace("assets/", "", 1)}')
        save(im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB'), dest)
    return f'/fotos/{h}.webp'


def clean(h):
    h = re.sub(r'<br[^>]*>', '\n', h or '')
    h = re.sub(r'</(p|li|h\d)>', '\n', h)
    h = re.sub(r'<[^>]+>', '', h)
    return [p.strip() for p in html.unescape(h).replace('\xa0', ' ').split('\n') if p.strip()]


brl = lambda t: float(t.replace('R$', '').replace('.', '').replace(',', '.').strip())
precos = {n: brl(v) for n, v in src['vars']}
cores = [n for n, _ in src['vars']]
variantes = []
for sv in src['skuVariants']:
    cor = sv['opts'][0]
    variantes.append({'sku': sv['sku'], 'opts': {'Cor': cor}, 'price': precos[cor], 'img': foto(src['variantImageMap'][cor])})
fotos = []
for ref in src['images']:
    f = foto(ref)
    if f not in fotos:
        fotos.append(f)
for v in variantes:
    if v['img'] not in fotos:
        fotos.append(v['img'])

desc = [l for l in clean(src['description']) if not l.startswith('#')]
prod = {
    'n': 27, 'handle': 'secretaria-paredao', 'nome': 'Secretária Paredão', 'titulo': 'Secretária Paredão',
    'cat': 'margem', 'catSelecao': 'acessorios',
    'gancho': 'Para paredões, decks e plataformas', 'frase': 'Apoio firme para pescar em qualquer lugar.',
    'desc': desc, 'tags': ['Acessorios', 'Secretária', 'Paredão', 'Eco', 'Todos'],
    'opcoes': {'Cor': cores}, 'variantes': variantes,
    'preco': min(v['price'] for v in variantes), 'variacoes': len(variantes),
    'foto': fotos[0], 'fotos': fotos,
}
json.dump([prod], open(f'{ROOT}/src/data/extras.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# faixa (banner) do catálogo de acessórios, mesmo formato 3:1 das demais
im = Image.open(f'{CAT}/img/banners/secretaria-paredao.webp').convert('RGB')
for suf, w, q in (('', 1600, 82), ('-m', 900, 78), ('-t', 480, 74)):
    r = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS) if im.width != w else im
    r.save(f'{ROOT}/public/img/secretaria-paredao{suf}.webp', quality=q, method=6)
print('ok', len(fotos), 'fotos', im.size)
