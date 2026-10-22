"""Baixa as fotos dos produtos do CSV da Shopify (produto + variações) e converte em WebP em public/fotos.
Também converte as fotos das chumbadas coloridas (pasta local). Gera src/data/fotos.json (url -> arquivo)."""
import csv, hashlib, io, json, os, re, shutil, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/public/fotos'
os.makedirs(OUT, exist_ok=True)
COLOR_DIR = r'D:\Dowloads HD 1T\chumbadas coloridas'

rows = list(csv.DictReader(open(f'{ROOT}/_fontes/pesqueiro.csv', encoding='utf-8')))
urls = []
for r in rows:
    for k in ('Image Src', 'Variant Image'):
        u = r[k].strip()
        if u and u not in urls:
            urls.append(u)

def name_for(u):
    return hashlib.sha1(u.split('?')[0].encode()).hexdigest()[:12]

def save(im, dest, maxside=1000):
    im.thumbnail((maxside, maxside), Image.LANCZOS)
    im.save(dest, 'WEBP', quality=80, method=6)

def fetch(u):
    dest = f'{OUT}/{name_for(u)}.webp'
    if os.path.exists(dest):
        return u, name_for(u), 'cache'
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        data = urllib.request.urlopen(req, timeout=40).read()
        im = Image.open(io.BytesIO(data))
        im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
        save(im, dest)
        return u, name_for(u), 'ok'
    except Exception as e:
        return u, None, f'ERRO {e}'

with ThreadPoolExecutor(8) as ex:
    res = list(ex.map(fetch, urls))
mapa = {u: n for u, n, st in res if n}
for u, n, st in res:
    if not n:
        print(st, u)
print(len(mapa), 'de', len(urls), 'fotos')

# chumbadas coloridas: bola-furada-amarela-fluorescente.png -> cor-bola-furada-amarela.webp
for f in sorted(os.listdir(COLOR_DIR)):
    m = re.match(r'(bola-furada|oliva|poita)-(amarela|laranja|preta|vermelha)', f)
    if not m:
        continue
    im = Image.open(os.path.join(COLOR_DIR, f))
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    save(im, f'{OUT}/cor-{m.group(1)}-{m.group(2)}.webp')
    print('cor', f)
json.dump(mapa, open(f'{ROOT}/src/data/fotos.json', 'w', encoding='utf-8'), indent=0)
