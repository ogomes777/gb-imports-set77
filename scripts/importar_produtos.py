#!/usr/bin/env python3
"""Importador explícito de recortes PNG da GB, sem adivinhação de categoria/variante.
Uso: python scripts/importar_produtos.py /caminho/pasta_pngs
Nome obrigatório: gb-tr-01-combo.png / gb-tr-01-top.png / gb-tr-01-bottom.png
"""
import sys,json,re
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
manifest=json.loads((ROOT/'data/catalogo-fontes.json').read_text(encoding='utf-8'))['items']
expected={item['id'] for item in manifest}
def main(folder):
 folder=Path(folder); assert folder.is_dir(),f'Pasta inexistente: {folder}'
 dest=ROOT/'assets/products';dest.mkdir(parents=True,exist_ok=True)
 entries={};warnings=[]
 for file in sorted(folder.glob('*.png')):
  m=re.fullmatch(r'(gb-(?:tr|sh|ex)-\d{2})-(combo|top|bottom)',file.stem,re.I)
  if not m:
   warnings.append(f'NOME NÃO RECONHECIDO: {file.name}');continue
  id,mode=m.groups();id=id.lower()
  if id not in expected:warnings.append(f'ID AUSENTE NO MANIFESTO: {id}');continue
  im=Image.open(file)
  if im.mode!='RGBA':warnings.append(f'VERIFICAR TRANSPARÊNCIA: {file.name} / {im.mode}'); im=im.convert('RGBA')
  if im.width<300 or im.height<300:warnings.append(f'BAIXA RESOLUÇÃO: {file.name}')
  if im.getextrema()[3]==(255,255):warnings.append(f'SEM PIXELS TRANSPARENTES: {file.name}')
  output=dest/f'{id}-{mode}.webp';im.save(output,format='WEBP',lossless=True,method=4)
  entries.setdefault(id,{})[mode]=f'./assets/products/{output.name}'
 (ROOT/'assets-map.js').write_text('/* GERADO APÓS CONFERÊNCIA DAS FOTOS. NÃO CONFIRMA ESTOQUE OU PREÇO. */\nwindow.GB_ASSETS = '+json.dumps(entries,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
 print('Fotos importadas:',sum(map(len,entries.values())),'em',len(entries),'produtos')
 if warnings:print('\n'.join(warnings))
 print('REVISAR VINCULAÇÃO MANUALMENTE ANTES DE PUBLICAR.')
if __name__=='__main__':
 if len(sys.argv)!=2:sys.exit('Uso: python scripts/importar_produtos.py /pasta_com_pngs')
 main(sys.argv[1])
