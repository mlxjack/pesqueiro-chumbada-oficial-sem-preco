"""CSV da Shopify -> src/data/products.json"""
import csv, json, re, html, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FOTOS = json.load(open(f'{ROOT}/src/data/fotos.json', encoding='utf-8'))
CAT_CHUMB = json.load(open(f'{ROOT}/_fontes/chumbadas_catalogo.json', encoding='utf-8'))
rows = list(csv.DictReader(open(f'{ROOT}/_fontes/pesqueiro.csv', encoding='utf-8')))

# handle: (nº da arte, nome curto, linha, gancho, frase, modo de imagem)
META = {
 'kit-anteninha-2-unidades': (1,'Anteninha Átomo','iscas','11 mm · borracha flexível','Para tambaquis, tambacus e pacus.','photo'),
 'kit-atrativo-comum-5mm-5-filetes-com-10-unidades': (2,'Atrativo Comum','iscas','5 mm · 5 filetes','Até 50 pequenas bolinhas por kit.','cut'),
 'kit-atrativo-holografico-5mm-5-filetes-com-10-unidades': (3,'Atrativo Holográfico','iscas','5 mm · 5 filetes','Cor e movimento para a apresentação da isca.','photo'),
 'kit-mini-atrativo-comum': (4,'Mini Atrativo Comum','iscas','3 mm · 5 filetes','Na curva do anzol ou junto à isca.','photo'),
 'estilingue': (5,'Estilingue Cevador','margem','Precisão na ceva','Abasteça o ponto sem recolher a boia.','cut'),
 'anzol-chinu': (6,'Anzol Chinu','anzois','Pacote com 15 unidades','Haste curta e espaço para uma isca generosa.','photo'),
 'anzol-izumezina': (7,'Anzol Izumezina','anzois','Pacote com 15 unidades','Resistência e versatilidade para sua pescaria.','photo'),
 'anzol-maruseigo': (8,'Anzol Maruseigo','anzois','Pacote com 15 unidades','Haste balanceada e praticidade para iscar.','photo'),
 'stopper-modelo-oliva': (9,'Stopper Oliva','chicotes','Regulagem de linha','Ajuste a posição da boia ou da pernada.','cut'),
 'stopper-modelo-cilindrico': (10,'Stopper Cilíndrico','chicotes','Trava com maior aderência','Pega anatômica para facilitar a montagem.','photo'),
 'micangas-de-vidro-pacote-com-500': (11,'Miçangas de Vidro','chicotes','Pacote com 500 unidades','Diâmetro de 2,5 mm · linhas de até 0,8 mm.','photo'),
 'cobre-no-pacote-com-40': (12,'Cobre Nó','chicotes','Pacote com 40 unidades','Proteção para os nós do seu sistema de pesca.','photo'),
 'kit-snap-frances': (13,'Snap Francês','chicotes','Conexão prática','Troca rápida de chicotes, líderes e arranques.','cut'),
 'snap-double': (14,'Snap Double','chicotes','Pacote com 8 unidades','Troque acessórios sem precisar cortar a linha.','cut'),
 'snap-single': (15,'Snap Single','chicotes','Pacote com 8 unidades','Praticidade na troca dos acessórios de pesca.','cut'),
 'snap-gota': (16,'Snap Gota','chicotes','Formato curvado','Espaço interno para o movimento da isca.','cut'),
 'destorcedor': (17,'Kit Destorcedor','chicotes','Diferentes tamanhos','Uma conexão prática para a sua montagem.','cut'),
 'kit-destorcedor-triplo': (18,'Destorcedor Triplo','chicotes','Montagem versátil','Conecte linha, pernada e chumbada.','cut'),
 'chumbada-bola-furada-natural': (19,'Bola Furada Natural','chumbadas','Chumbada com furo central','Um clássico para compor sua montagem.','cut'),
 'chumbada-oliva-natural': (20,'Oliva Natural','chumbadas','Chumbada oliva','Escolha o peso para a sua pescaria.','cut'),
 'chumbada-poita-natural': (21,'Poita Natural','chumbadas','Chumbada poita','Conheça as opções da linha natural.','cut'),
 'saca-anzol-de-competicao': (22,'Saca Anzol de Competição','margem','Aço inox e termoplástico','Quatro tamanhos para diferentes montagens.','cut'),
 'suporte-horiziontal': (23,'Suporte Horizontal','margem','Para tilápias, carpas e finesse','Mantenha a vara paralela ao chão.','photo'),
 'mini-secretaria': (24,'Mini Secretária','margem','Compacta e funcional','Organize acessórios e prepare sua isca.','cut'),
 'amarra-vara-velcro': (25,'Amarra Vara Velcro','margem','Velcro de 50 cm','Praticidade para apoiar e transportar varas.','photo'),
 'regua-cantoneira': (26,'Régua Cantoneira','margem','Largura de 15 cm','À prova d’água e aferida individualmente.','photo'),
}

def clean(h):
    h = re.sub(r'<br[^>]*>', '\n', h or '')
    h = re.sub(r'</(p|li|h\d)>', '\n', h)
    h = re.sub(r'<[^>]+>', '', h)
    h = html.unescape(h).replace('\xa0', ' ')
    return [p.strip() for p in re.split(r'\n', h) if p.strip()]

prods, cur = [], None
for r in rows:
    if r['Title']:
        cur = {'handle': r['Handle'], 'title': r['Title'], 'body': clean(r['Body (HTML)']),
               'tags': [t.strip() for t in r['Tags'].split(',') if t.strip()],
               'opts': [r[f'Option{i} Name'] for i in (1, 2, 3) if r[f'Option{i} Name']],
               'vals': {}, 'prices': [], 'skus': 0, 'vars': [], 'fotos': []}
        prods.append(cur)
    p = cur
    url = r['Image Src'].strip()
    if url and url in FOTOS and FOTOS[url] not in [f for _, f in p['fotos']]:
        p['fotos'].append((int(r['Image Position'] or 99), FOTOS[url]))
    if r['Variant SKU']:
        p['skus'] += 1
        try: price = float(r['Variant Price'])
        except ValueError: price = 0.0
        p['prices'].append(price)
        opts = {}
        for i, name in enumerate(p['opts'], 1):
            v = r[f'Option{i} Value'].strip()
            if v and v != 'Default Title': opts[name] = v
        vi = FOTOS.get(r['Variant Image'].strip())
        p['vars'].append({'sku': r['Variant SKU'].lstrip("'"), 'opts': opts, 'price': price, 'img': f'/fotos/{vi}.webp' if vi else None})
    for i, name in enumerate(p['opts'], 1):
        v = r[f'Option{i} Value'].strip()
        if v and v != 'Default Title':
            lst = p['vals'].setdefault(name, [])
            if v not in lst: lst.append(v)

CATS = [('chumbadas', 'Chumbadas', 'Peso de verdade para ancorar a montagem.'),
        ('iscas', 'Iscas & Atrativos', 'Cor e movimento no anzol.'),
        ('anzois', 'Anzóis', 'Aço afiado, pacote com 15.'),
        ('chicotes', 'Chicotes & Conexões', 'Snaps, destorcedores, stoppers e miçangas.'),
        ('margem', 'Acessórios de Margem', 'Do ceva ao suporte de vara.')]
COR_FOTO = {'Amarelo': 'amarela', 'Laranja': 'laranja', 'Preto': 'preta', 'Vermelho': 'vermelha'}
CHUMB_SLUG = {'chumbada-bola-furada-natural': 'bola-furada', 'chumbada-oliva-natural': 'oliva', 'chumbada-poita-natural': 'poita'}
brl = lambda t: float(t.replace('R$', '').replace('.', '').replace(',', '.').strip())
out = []
for p in prods:
    n, nome, cat, gancho, frase, modo = META[p['handle']]
    fotos = [f'/fotos/{f}.webp' for _, f in sorted(p['fotos'])]
    variantes, opcoes = p['vars'], {k: v for k, v in p['vals'].items() if v}
    if p['handle'] in CHUMB_SLUG:  # o catálogo de chumbadas tem as opções coloridas (CSV só tem a natural)
        slug = CHUMB_SLUG[p['handle']]
        variantes, opcoes = [], {}
        for v in CAT_CHUMB[p['handle']]:
            o = {x['name']: x['value'] for x in v['opts']}
            cor = o.get('Cor')
            variantes.append({'sku': v['sku'], 'opts': o, 'price': brl(v['price']),
                              'img': f'/fotos/cor-{slug}-{COR_FOTO[cor]}.webp' if cor in COR_FOTO else (fotos[0] if fotos else None)})
            for k, val in o.items():
                lst = opcoes.setdefault(k, [])
                if val not in lst: lst.append(val)
        fotos = fotos[:1] + [f'/fotos/cor-{slug}-{c}.webp' for c in COR_FOTO.values()]
    prices = [v['price'] for v in variantes if v['price'] > 0]
    out.append({'n': n, 'handle': p['handle'], 'nome': nome, 'titulo': p['title'], 'cat': cat,
        'catSelecao': {'chumbadas': 'chumbadas', 'iscas': 'iscas', 'anzois': 'anzois'}.get(cat, 'acessorios'),
        'gancho': gancho, 'frase': frase, 'desc': p['body'], 'tags': p['tags'],
        'opcoes': opcoes, 'variantes': variantes, 'preco': min(prices, default=None), 'variacoes': len(variantes),
        'foto': fotos[0] if fotos else None, 'fotos': fotos})
# produtos da linha que não estão no CSV (ver scripts/extras.py)
if os.path.exists(f'{ROOT}/src/data/extras.json'):
    out += json.load(open(f'{ROOT}/src/data/extras.json', encoding='utf-8'))
out.sort(key=lambda x: x['n'])
json.dump({'categorias': [{'id': a, 'nome': b, 'frase': c} for a, b, c in CATS], 'produtos': out},
          open(f'{ROOT}/src/data/products.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'produtos', sum(p['variacoes'] for p in out), 'variações')
for p in out[:2] + out[16:18]:
    print(ascii(p['nome']), p['preco'], list(p['opcoes']), ascii(p['desc'][:1]))
