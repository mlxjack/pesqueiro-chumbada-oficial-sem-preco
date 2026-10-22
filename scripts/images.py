"""Converte as faixas (artes originais) em WebP: grande, mobile e miniatura. Sem recorte: a faixa é usada como é."""
import glob, os
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f'{ROOT}/public/img'; os.makedirs(OUT, exist_ok=True)
for f in sorted(glob.glob(f'{ROOT}/_fontes/artes/*.png')):
    slug = os.path.basename(f)[3:-4]
    im = Image.open(f).convert('RGB')
    for suf, w, q in (('', 1800, 80), ('-m', 900, 78), ('-t', 480, 74)):
        r = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
        r.save(f'{OUT}/{slug}{suf}.webp', quality=q, method=6)
    print(slug, flush=True)
