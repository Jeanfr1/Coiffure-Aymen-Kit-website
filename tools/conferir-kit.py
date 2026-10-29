#!/usr/bin/env python3
"""Verificação estática somente leitura; browser QA não é simulado."""
from pathlib import Path
from html.parser import HTMLParser
import argparse,hashlib,json,re,subprocess,xml.etree.ElementTree as ET
from urllib.parse import unquote
import numpy as np
from PIL import Image,ImageFont
from fontTools.ttLib import TTFont

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--atualizar-relatorio',action='store_true')
args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1];SITE=ROOT/'site';checks=[]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def check(name,condition,**details):
    checks.append({'check':name,'status':'PASS' if condition else 'FAIL',**details})
    if not condition:raise AssertionError(name)

class Page(HTMLParser):
    def __init__(self,path):
        super().__init__();self.path=path;self.ids=[];self.local=[];self.anchors=[];self.aria=[];self.scenes=[];self.links=[];self.h1=0;self.lang='';self.script_type=None;self.ld=[];self.service=[];self.tabs=[];self.comb=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html':self.lang=a.get('lang')
        if tag=='h1':self.h1+=1
        if a.get('id'):self.ids.append(a['id'])
        if a.get('data-scene'):self.scenes.append({'id':a.get('id'),'scene':a['data-scene'],'background':a.get('data-background')})
        if 'data-comb' in a:self.comb+=1
        if a.get('data-service'):self.service.append(a['data-service'])
        if a.get('data-tab'):self.tabs.append(a['data-tab'])
        for key in ('src','href'):
            val=a.get(key)
            if val and not val.startswith(('http:','https:','tel:','data:')):
                if val.startswith('#'):self.anchors.append(val[1:])
                else:self.local.append(val.split('#',1)[0].split('?',1)[0])
        for key in ('aria-labelledby','aria-controls'):
            if a.get(key):self.aria+=a[key].split()
        if tag=='a':self.links.append(a)
        if tag=='script':self.script_type=a.get('type')
    def handle_endtag(self,tag):
        if tag=='script':self.script_type=None
    def handle_data(self,data):
        if self.script_type=='application/ld+json':self.ld.append(json.loads(data))

index=Page(SITE/'index.html');index.feed(index.path.read_text())
lock=json.loads((ROOT/'docs/architecture-lock.json').read_text())
check('modelo 3, cinco cenas e ordem exata',lock['model']==3 and index.scenes==lock['scene_order'],order=index.scenes)
check('um único fundo principal liso',sum(s['background']=='solid' for s in index.scenes)==1 and next(s['id'] for s in index.scenes if s['background']=='solid')=='prestations')
check('francês e um H1',index.lang=='fr' and index.h1==1)
check('IDs únicos',len(set(index.ids))==len(index.ids))
check('âncoras internas',set(index.anchors)<=set(index.ids))
check('alvos ARIA existentes',set(index.aria)<=set(index.ids))
check('referências locais do site',all((SITE/unquote(v)).is_file() for v in index.local))
check('cinco faixas SVG',index.comb==5)
check('links externos protegidos',all('noopener' in a.get('rel','') and 'noreferrer' in a.get('rel','') for a in index.links if a.get('target')=='_blank'))
maps=[a['href'] for a in index.links if 'google.com/maps' in a.get('href','')]
expected_map='https://www.google.com/maps/search/?api=1&query=2+rue+Maurice+Sambron+44160+Pontchateau+France'
check('itinerários corretos',len(maps)>=6 and set(maps)=={expected_map},count=len(maps))
phones=[a['href'] for a in index.links if a.get('href','').startswith('tel:')]
check('telefone da fachada em todos os links',len(phones)>=6 and set(phones)=={'tel:+33753496435'},count=len(phones))
check('sem reserva online inventada','planity' not in (SITE/'index.html').read_text().lower() and not any('réserver' in a.get('aria-label','').lower() for a in index.links))
check('dados estruturados coerentes',len(index.ld)==1 and index.ld[0]['@type']=='HairSalon' and index.ld[0]['telephone']=='+33753496435' and index.ld[0]['address']['streetAddress']=='2 rue Maurice Sambron')
check('prancha aprovada íntegra',sha(ROOT/lock['reference']['path'])==lock['reference']['sha256'])
check('logo PNG aprovada preservada',sha(ROOT/lock['logo']['path'])==lock['logo']['sha256'] and sha(SITE/'assets/logo.png')==lock['logo']['sha256'])

guide=Page(ROOT/'docs/GUIA-VISUAL.html');guide.feed(guide.path.read_text())
check('links locais do guia',all((guide.path.parent/unquote(v)).is_file() for v in guide.local))
css=(SITE/'styles.css').read_text()
css_urls=re.findall(r'url\([\'"]?([^\)\'\"]+)[\'"]?\)',css)
check('assets e fontes CSS locais',all((SITE/v).is_file() for v in css_urls))
def balanced(text):
    text=re.sub(r'/\*.*?\*/','',text,flags=re.S)
    text=re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'','',text)
    stack=[];pairs={'}':'{',')':'(',']':'['}
    for c in text:
        if c in '{([':stack.append(c)
        elif c in '})]':
            if not stack or stack.pop()!=pairs[c]:return False
    return not stack
check('delimitadores CSS consistentes',balanced(css))
check('movimento reduzido e pausa previstos','prefers-reduced-motion' in css and '.motion-off' in css and 'height:auto;min-height:0' in css)
for filename in ('app.js','content.js'):
    run=subprocess.run(['node','--check',str(SITE/filename)],capture_output=True,text=True)
    check('sintaxe '+filename,run.returncode==0,details=run.stderr.strip())
    check('IDs do JS '+filename,all(v in index.ids for v in re.findall(r'getElementById\([\'"]([^\'\"]+)',(SITE/filename).read_text())))
program='global.window={};require(process.argv[1]);process.stdout.write(JSON.stringify(window.AYMEN));'
raw=subprocess.run(['node','-e',program,str(SITE/'content.js')],capture_output=True,text=True,check=True)
data=json.loads(raw.stdout)
check('categorias e abas alinhadas',set(data['services'])==set(index.service)==set(index.tabs)=={'homme','enfant','barbe'})
check('contato editável coerente',data['phone']=='+33753496435' and data['map']==expected_map)

logo=np.asarray(Image.open(ROOT/'brand/Logo-AYMEN-Ambre-Transparente.png'))
check('logo 1774×887 RGBA',logo.shape==(887,1774,4))
check('transparência real da logo',logo[:,:,3].min()==0 and logo[:,:,3].max()==255,transparent_percent=round(float((logo[:,:,3]==0).mean()*100),3))
check('cantos da logo transparentes',all(logo[y,x,3]==0 for x,y in [(0,0),(1773,0),(0,886),(1773,886)]))
check('preenchimento âmbar uniforme',np.all(logo[:,:,:3][logo[:,:,3]==255]==[213,172,98]))
chair=np.asarray(Image.open(ROOT/'images/master/hero-chair.png'));chair_webp=np.asarray(Image.open(SITE/'assets/hero-chair.webp'))
check('cadeira RGBA com alfa real',chair.shape[2]==4 and chair[:,:,3].min()==0 and chair[:,:,3].max()==255)
check('WebP da cadeira preserva dimensão e alfa',chair.shape==chair_webp.shape and np.array_equal(chair[:,:,3],chair_webp[:,:,3]))
for path in (ROOT/'brand').glob('*.svg'):
    svg=ET.fromstring(path.read_text())
    check('vetor nativo '+path.name,bool(svg.findall('.//{http://www.w3.org/2000/svg}path')) and not svg.findall('.//{http://www.w3.org/2000/svg}image'))
for name in ('Ambre','Ivoire'):
    source=ET.parse(ROOT/'brand'/f'Logo-AYMEN-{name}.svg').getroot()
    header=ET.parse(SITE/'assets'/f'logo-{name.lower()}.svg').getroot()
    check('cabeçalho preserva paths '+name,source.find('.//{http://www.w3.org/2000/svg}path').attrib['d']==header.find('.//{http://www.w3.org/2000/svg}path').attrib['d'] and header.attrib['viewBox']=='80 225 1620 475')
for markup in re.findall(r'<svg\b.*?</svg>',(SITE/'index.html').read_text(),re.S):ET.fromstring(markup)
check('SVGs inline válidos',True)
check('recorte documental dentro da fonte',110+780<=1000 and 'viewBox="0 110 1342 780"' in index.path.read_text())

manifest=json.loads((ROOT/'docs/asset-manifest.json').read_text())
supplied=[a for a in manifest['assets'] if a['origin']=='user_attachment']
check('quatro arquivos recebidos preservados',len(supplied)==4 and all(sha(ROOT/a['path'])==a['source_sha256'] for a in supplied))
check('única fotografia documental identificada',sum(a.get('role')=='documentary_facade' for a in supplied)==1)
check('hashes do inventário',all((ROOT/a['path']).is_file() and sha(ROOT/a['path'])==a['sha256'] for a in manifest['assets']))
for path in (SITE/'fonts').glob('*.woff'):
    font=TTFont(path);chars='Le détail.' if path.name.startswith('Yellowtail') else 'éèêàâçôùûîïÉÂ'
    check('fonte válida '+path.name,path.read_bytes()[:4]==b'wOFF' and all(ord(c) in font.getBestCmap() for c in chars))
for name in ('BarlowCondensed-OFL.txt','Sora-OFL.txt'):
    check('licença '+name,'OPEN FONT LICENSE' in (ROOT/'fonts/originals'/name).read_text().upper())
check('licença Apache de Yellowtail',bool(re.search(r'Apache\s+License',(ROOT/'fonts/originals/Yellowtail-Apache-2.0.txt').read_text(),re.I)))
font_sources=json.loads((ROOT/'docs/font-sources.json').read_text())
check('origens oficiais e hashes das fontes',all(a['url'].startswith('https://raw.githubusercontent.com/google/fonts/') and sha(ROOT/a['path'])==a['sha256'] for a in font_sources))

measurements=[]
for width in (320,360,375,390,430):
    gutter=20 if width<=370 else 24
    sizes=[('PRENEZ',width*.17 if width<=370 else max(64,min(width*.15,100))),
           ('NOTRE ATTENTION.',width*.11 if width<=370 else max(43,min(width*.11,73))),
           ('À PONTCHÂTEAU.',width*.122 if width<=370 else max(53,min(width*.12,83)))]
    for text,size in sizes:
        font=ImageFont.truetype(str(ROOT/'fonts/BarlowCondensed-ExtraBold.ttf'),round(size))
        advance=font.getlength(text)+(len(text)-1)*size*(-.012)
        available=width-2*gutter;measurements.append({'viewport':width,'text':text,'estimated_width':round(advance,1),'available':available})
        check(f'métrica estática {width}px {text}',advance<=available+1)

images=0
for path in ROOT.rglob('*'):
    if path.is_file() and path.suffix.lower() in ('.png','.webp','.jpeg','.jpg'):
        with Image.open(path) as image:image.load()
        images+=1
    if path.is_file() and path.suffix=='.json':json.loads(path.read_text())
check('imagens legíveis',images>=15,count=images)
check('sem vídeo ou frames animados',not any(p.suffix.lower() in ('.mov','.mp4','.webm','.gif') for p in ROOT.rglob('*')))
check('sem pranchas de outros modelos',not any(re.search(r'Model[oè]?-?[12]-',p.name,re.I) for p in ROOT.rglob('*')))
check('README e seis roteiros',(ROOT/'README.md').is_file() and len(list((ROOT/'roteiros').glob('*')))==6)
check('timeline e paleta do modelo 3',json.loads((ROOT/'motion/timeline.json').read_text())['model']==3 and json.loads((ROOT/'brand/palette.json').read_text())['single_solid_scene']=='prestations')
check('runtime sem CDN ou APIs',not re.search(r'\bfetch\s*\(|https?://',(SITE/'app.js').read_text()) and all(not v.startswith('http') for v in css_urls))
check('configuração local sem publicação',json.loads((SITE/'.openai/hosting.json').read_text())=={'static':{'directory':'.'}})

report={'date':'2026-10-29','model':3,'status':'STATIC_CHECKS_PASS_BROWSER_QA_UNVERIFIED','checks':checks,'passed':len(checks),'images':images,'font_metric_support':measurements,'browser_qa':'UNVERIFIED — prévia indisponível; layout, cliques, teclado e desempenho não executados em navegador','preview_error':'sites-previewd mailbox is unavailable at /tmp/sites-previewd/requests','video':False,'deployed':False,'limits':['Campanhas não são documentação do interior, da equipe ou de resultados reais.','Métricas de fonte são apoio estático, não prova de renderização final.']}
if args.atualizar_relatorio:(ROOT/'docs/qa-results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'passed':len(checks),'images':images,'browser_qa':'UNVERIFIED'}))
