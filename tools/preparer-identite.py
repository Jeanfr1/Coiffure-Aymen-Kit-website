#!/usr/bin/env python3
"""Exports natifs de la marque choisie, signature et fontes locales; aucune vidéo."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,re,shutil,urllib.request,urllib.parse
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import fitz
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT=Path(__file__).resolve().parents[1]
for name in ('Ambre','Ivoire'):
    original=(ROOT/'brand'/f'Logo-AYMEN-{name}.svg').read_text()
    header=original.replace('viewBox="0 0 1774 887"','viewBox="80 225 1620 475"')
    (ROOT/'site/assets'/f'logo-{name.lower()}.svg').write_text(header)
def render(markup,dest,width):
    doc=fitz.open(stream=markup.encode(),filetype='svg');page=doc[0];scale=width/page.rect.width
    page.get_pixmap(matrix=fitz.Matrix(scale,scale),alpha=True).save(str(dest));doc.close()
def svg(path,color,viewbox,title,outline=False):
    style=('fill="none" stroke="'+color+'" stroke-width="3.5" stroke-linejoin="round"') if outline else 'fill="'+color+'" fill-rule="evenodd"'
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+viewbox+'"><title>'+title+'</title><path '+style+' d="'+path+'"/></svg>'

tree=ET.fromstring((ROOT/'brand/Logo-AYMEN-Ambre.svg').read_text())
data=tree.find('.//{http://www.w3.org/2000/svg}path').attrib['d']
parts=re.findall(r'M[^M]+',data)
symbol=[]
for part in parts:
    points=[(float(x),float(y)) for x,y in re.findall(r'(-?[\d.]+),(-?[\d.]+)',part)]
    if points and max(x for x,y in points)<590:symbol.append(part)
symbol_path=' '.join(symbol)
for name,color,outline in [('Ambre','#D5AC62',False),('Ivoire','#EFE7D8',False),('Contour','#D5AC62',True)]:
    markup=svg(symbol_path,color,'80 220 520 470','Aymen — monogramme A',outline)
    (ROOT/'brand'/f'Monogramme-{name}.svg').write_text(markup)
shutil.copy2(ROOT/'brand/Monogramme-Ambre.svg',ROOT/'site/assets/favicon.svg')
shutil.copy2(ROOT/'brand/Monogramme-Contour.svg',ROOT/'site/assets/monogramme-contour.svg')
pts=[(float(x),float(y)) for x,y in re.findall(r'(-?[\d.]+),(-?[\d.]+)',symbol_path)]
cx=(min(x for x,y in pts)+max(x for x,y in pts))/2;cy=(min(y for x,y in pts)+max(y for x,y in pts))/2
scale=1.55
avatar=('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><title>AYMEN</title>'
        '<rect width="1024" height="1024" fill="#101110"/>'
        f'<g transform="translate({512-cx*scale:.3f} {512-cy*scale:.3f}) scale({scale})">'+
        '<path fill="#D5AC62" fill-rule="evenodd" d="'+symbol_path+'"/></g></svg>')
(ROOT/'brand/Avatar-Social.svg').write_text(avatar);render(avatar,ROOT/'brand/Avatar-Social.png',1024)

source=ROOT/'images/master/signature-master.png';image=Image.open(source);a=np.asarray(image)[:,:,3]/255
fig,ax=plt.subplots();segs=ax.contour(np.pad(a,1),levels=[.5]).allsegs[0];plt.close(fig)
paths=[]
for s in segs:
    p=s-.5
    if len(p)<4:continue
    x,y=p[:,0],p[:,1];area=abs(np.dot(x,np.roll(y,1))-np.dot(y,np.roll(x,1)))/2
    if area<2:continue
    paths.append('M'+' L'.join(f'{x:.2f},{y:.2f}' for x,y in p)+' Z')
signature=svg(' '.join(paths),'#D5AC62',f'0 0 {image.width} {image.height}','Aymen — signature de campagne')
(ROOT/'brand/Signature-Aymen.svg').write_text(signature)
shutil.copy2(ROOT/'brand/Signature-Aymen.svg',ROOT/'site/assets/signature-aymen.svg')
render(signature,ROOT/'brand/Signature-Aymen-Transparente.png',image.width)

items=[('barlowcondensed','BarlowCondensed-Bold.ttf','BarlowCondensed-Bold.ttf'),
       ('barlowcondensed','BarlowCondensed-ExtraBold.ttf','BarlowCondensed-ExtraBold.ttf'),
       ('barlowcondensed','OFL.txt','BarlowCondensed-OFL.txt'),
       ('sora','Sora[wght].ttf','Sora-Variable.ttf'),('sora','OFL.txt','Sora-OFL.txt'),
       ('yellowtail','Yellowtail-Regular.ttf','Yellowtail-Regular.ttf'),('yellowtail','LICENSE.txt','Yellowtail-Apache-2.0.txt')]
def fetch(item):
    family,name,dest=item;license_dir='apache' if family=='yellowtail' else 'ofl';url='https://raw.githubusercontent.com/google/fonts/main/'+license_dir+'/'+family+'/'+urllib.parse.quote(name)
    path=ROOT/'fonts/originals'/dest
    if not path.exists():
        with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Aymen-BrandKit/1.0'}),timeout=45) as response:path.write_bytes(response.read())
    return {'path':str(path.relative_to(ROOT)),'url':url,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
with ThreadPoolExecutor(max_workers=5) as pool:origins=list(pool.map(fetch,items))
instances=[('BarlowCondensed-Bold.ttf','BarlowCondensed-Bold',None),('BarlowCondensed-ExtraBold.ttf','BarlowCondensed-ExtraBold',None),
           ('Sora-Variable.ttf','Sora-Regular',400),('Sora-Variable.ttf','Sora-Medium',500),('Sora-Variable.ttf','Sora-SemiBold',600),
           ('Yellowtail-Regular.ttf','Yellowtail-Regular',None)]
for filename,name,weight in instances:
    font=TTFont(ROOT/'fonts/originals'/filename)
    if weight:font=instantiateVariableFont(font,{'wght':weight},inplace=True)
    font.save(ROOT/'fonts'/(name+'.ttf'));font.flavor='woff';font.save(ROOT/'site/fonts'/(name+'.woff'))
for filename in ['BarlowCondensed-OFL.txt','Sora-OFL.txt','Yellowtail-Apache-2.0.txt']:shutil.copy2(ROOT/'fonts/originals'/filename,ROOT/'site/fonts'/filename)
(ROOT/'docs/font-sources.json').write_text(json.dumps(origins,ensure_ascii=False,indent=2))
(ROOT/'docs/vector-exports.json').write_text(json.dumps({'monogramme_contours':len(symbol),'signature_contours':len(paths),'native_svg':True,'embedded_bitmap':False,'approved_logo_png_preserved':True},indent=2))
print(json.dumps({'font_downloads':len(origins),'woff':len(instances),'monogramme_contours':len(symbol),'signature_contours':len(paths)}))
