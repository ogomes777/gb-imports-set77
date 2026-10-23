#!/usr/bin/env node
/** GB RAIL V10 — gerador + validador determinístico do catálogo da arara.
 *
 * Entradas (fontes de verdade, nenhuma lista copiada à mão):
 *   data/catalogo-crt.json      114 registros importados + origem de cada arquivo
 *   imported-products.js        o que o site realmente carrega (GB_IMPORTED_PRODUCTS / GB_ASSETS)
 *   data/gb-rail-curation.json  decisão visual por registro (arara / variante / vista / duplicata / fora)
 *   data/gb-media-meta.json     medição das mídias (scripts/medir_midia_rail.py)
 * Saídas:
 *   rail-catalog.js             window.GB_RAIL_CATALOG + correções de categoria/vistas aplicadas no site
 *   data/gb-rail-audit.json|csv decisão e motivo de cada um dos 114 registros
 *   docs/GB_RAIL_V10_ASSET_AUDIT.md
 * Uso: node scripts/gerar-rail-v10.mjs          (gera)
 *      node scripts/gerar-rail-v10.mjs --check  (falha se algo estiver faltando ou desatualizado)
 */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve,basename} from 'node:path';
import vm from 'node:vm';

const root=resolve(import.meta.dirname,'..');
const CHECK=process.argv.includes('--check');
const read=f=>readFileSync(join(root,f),'utf8');
const errors=[];
const fail=m=>errors.push(m);

const crt=JSON.parse(read('data/catalogo-crt.json'));
const cur=JSON.parse(read('data/gb-rail-curation.json'));
const meta=JSON.parse(read('data/gb-media-meta.json')).files;
const win={GB_ASSETS:{}};
vm.runInNewContext(read('imported-products.js'),{window:win},{timeout:2000});
const imported=win.GB_IMPORTED_PRODUCTS||[], assets=win.GB_ASSETS||{};
const byId=new Map(imported.map(p=>[p.id,p]));

/* ---------- 1. mídia: existe, é WebP íntegro, confere com a medição ---------- */
function webpSize(buf){
  if(buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WEBP')return null;
  const t=buf.toString('ascii',12,16);
  if(t==='VP8X')return[1+buf.readUIntLE(24,3),1+buf.readUIntLE(27,3)];
  if(t==='VP8 ')return[buf.readUInt16LE(26)&0x3fff,buf.readUInt16LE(28)&0x3fff];
  if(t==='VP8L'){const b=buf.readUInt32LE(21);return[(b&0x3fff)+1,((b>>14)&0x3fff)+1]}
  return null;
}
const media=new Map();
function asset(path){
  const file=basename(path);
  if(media.has(file))return media.get(file);
  const abs=join(root,path.replace(/^\.\//,''));
  if(!existsSync(abs)){fail('Mídia ausente: '+path);return null}
  const buf=readFileSync(abs),dim=webpSize(buf),m=meta[file];
  if(!dim)fail('WebP inválido: '+path);
  if(!m)fail('Sem medição em data/gb-media-meta.json: '+file+' (rode scripts/medir_midia_rail.py)');
  else{
    if(createHash('sha256').update(buf).digest('hex')!==m.sha256)fail('Arquivo mudou desde a medição: '+file+' (rode scripts/medir_midia_rail.py)');
    if(dim&&(dim[0]!==m.w||dim[1]!==m.h))fail('Dimensão divergente: '+file);
    if(!m.alpha)fail('Recorte sem transparência: '+file);
    if(!existsSync(join(root,'assets/products/gb-crt/sombras',file)))fail('Sombra pré-calculada ausente: sombras/'+file+' (rode scripts/medir_midia_rail.py)');
  }
  const out=m?{src:'./assets/products/gb-crt/'+file,w:m.w,h:m.h,bbox:m.bbox,neckX:m.neckX,topW:m.topW,clips:m.clips,color:m.color}:null;
  media.set(file,out);return out;
}

/* ---------- 2. decisões: toda linha de origem precisa de uma ---------- */
const DECISIONS=['rack','variant','view','duplicate','excluded'];
const rows=[];
for(const p of crt.products){
  const d=cur.decisions[p.id];
  if(!d){fail('Registro sem decisão de curadoria: '+p.id);continue}
  if(!DECISIONS.includes(d.decision))fail('Decisão desconhecida em '+p.id+': '+d.decision);
  if(!byId.has(p.id))fail('Registro não carregado pelo site: '+p.id);
  const set=assets[p.id]||{};
  for(const [view,path] of Object.entries(set))asset(path);
  if(!set.combo)fail('Registro sem mídia principal: '+p.id);
  if(['view','duplicate'].includes(d.decision)&&!d.of)fail('Vínculo sem destino: '+p.id);
  if(d.decision==='variant'&&!cur.groups[d.group])fail('Grupo inexistente: '+d.group);
  const gen=p.source_files.some(f=>/ChatGPT|image-gen/i.test(f));
  rows.push({p,d,set,origin:gen?'imagem digital do acervo':'foto/recorte do acervo'});
}
for(const id of Object.keys(cur.decisions))if(!crt.products.some(p=>p.id===id))fail('Decisão para registro inexistente: '+id);
const known=id=>byId.has(id)||!!cur.groups[id];
for(const {p,d} of rows)if(d.of&&!known(d.of))fail(`Destino inexistente em ${p.id}: ${d.of}`);

/* ---------- 3. vistas vinculadas (mesma peça, mídia isolada) e correções de cadastro ---------- */
const viewLinks={};
for(const {p,d,set} of rows)if(d.decision==='view'&&d.part!=='gallery'){
  if(!byId.has(d.of))continue;
  if(assets[d.of]?.[d.part])fail(`${d.of} já tem vista ${d.part}; vínculo de ${p.id} conflita`);
  (viewLinks[d.of]??={})[d.part]=set.combo;
}
const fixes=cur.catalogFixes||{};
for(const id of Object.keys(fixes))if(!byId.has(id))fail('Correção para registro inexistente: '+id);

/* ---------- 4. itens da arara: um cabide por produto canônico (+ variantes reais) ---------- */
const FAMILY_ORDER=['set','outer','top','bottom'];
const FAMILY_LABEL={set:'CONJUNTO',outer:'JAQUETA / MOLETOM',top:'PARTE DE CIMA',bottom:'BERMUDA'};
const HANGER={set:'shoulder',outer:'shoulder',top:'shoulder',bottom:'clip'};
const mediaOf=id=>{
  const set={...(assets[id]||{}),...(viewLinks[id]||{})},out={};
  for(const v of ['combo','top','bottom'])if(set[v])out[v]=asset(set[v]);
  return out;
};
const variantOf=(id,d)=>{
  const p=byId.get(id),m=mediaOf(id);
  const sw=m.top||m.combo;
  // só caminhos: a medição de cada arquivo vai uma vez em catalog.media
  // referências "produto:vista": o arquivo é resolvido no navegador por GB_ASSETS (cada imagem existe uma vez no site e no standalone)
  return{id:d?.variant||'unica',label:d?.label||null,sourceId:id,name:p.name,media:Object.fromEntries(Object.keys(m).map(k=>[k,id+':'+k])),swatch:sw?{ref:id+':'+(m.top?'top':'combo'),color:sw.color}:null};
};
const items=[],placed=new Set();
for(const {p,d} of rows){
  if(d.decision==='rack'){
    items.push({id:p.id,title:p.name,family:d.family,sourceIds:[p.id],variants:[variantOf(p.id)]});
  }else if(d.decision==='variant'&&!placed.has(d.group)){
    placed.add(d.group);const g=cur.groups[d.group];
    const members=rows.filter(r=>r.d.decision==='variant'&&r.d.group===d.group);
    const fams=new Set(members.map(r=>r.d.family));if(fams.size>1)fail('Grupo com famílias diferentes: '+d.group);
    const gallery=rows.filter(r=>r.d.decision==='view'&&r.d.of===d.group).map(r=>({sourceId:r.p.id,ref:r.p.id+':combo'}));
    items.push({id:d.group,title:g.title,family:g.family,evidence:g.evidence,sourceIds:members.map(r=>r.p.id),variants:members.map(r=>variantOf(r.p.id,r.d)),gallery});
  }
}
for(const it of items){
  it.label=FAMILY_LABEL[it.family];it.hanger=HANGER[it.family];
  if(!it.hanger)fail('Família sem cabide definido: '+it.id);
  for(const v of it.variants){
    if(!v.media.combo)fail('Variante sem mídia: '+it.id+'/'+v.id);
    if(it.variants.length>1&&!v.label)fail('Variante sem rótulo de cor: '+it.id+'/'+v.id);
  }
  // capacidades derivadas da evidência: todas as mídias atuais são frontais (nenhum arquivo de costas/lateral/órbita/3D)
  const parts=it.variants.some(v=>v.media.top&&v.media.bottom);
  it.orientations=['front'];
  it.tier='D';
  it.capabilities={canTurnBack:false,canTurnSide:false,canRotate360:false,canSplitParts:parts,hasColorTags:it.variants.length>1};
}
items.sort((a,b)=>FAMILY_ORDER.indexOf(a.family)-FAMILY_ORDER.indexOf(b.family));
const ids=new Set();for(const it of items){if(ids.has(it.id))fail('Item duplicado na arara: '+it.id);ids.add(it.id)}
// nenhuma capa aponta para foto de outro registro
for(const it of items)for(const v of it.variants){
  const own=new Set([v.sourceId]);rows.filter(r=>r.d.decision==='view'&&r.d.of===v.sourceId).forEach(r=>own.add(r.p.id));
  for(const ref of Object.values(v.media)){const [pid,view]=ref.split(':'),src={...assets[pid],...viewLinks[pid]}[view];const owner=crt.products.find(x=>Object.values(x.media).some(s=>basename(s)===basename(src||'')));if(!src)fail('Referência sem arquivo: '+ref);else if(owner&&!own.has(owner.id))fail(`Capa de ${it.id}/${v.id} aponta para mídia de ${owner.id}`)}
}

/* ---------- 5. auditoria por registro ---------- */
const itemOf=id=>items.find(it=>it.sourceIds.includes(id));
const audit=rows.map(({p,d,set,origin})=>{
  const it=itemOf(p.id),fx=fixes[p.id]||{},links=viewLinks[p.id]||{};
  const views=Object.keys({...set,...links});
  const reason=d.reason||(d.decision==='rack'?'Imagem real do acervo, peça pendurável, sem duplicata na arara.':d.decision==='variant'?`Cor real (${d.label}) de ${cur.groups[d.group].title}: ${cur.groups[d.group].evidence}`:'');
  return{sourceId:p.id,name:p.name,categoryObserved:p.category+(p.single?' / avulso':' / conjunto'),categoryVerified:(fx.category||p.category)+((fx.single??p.single)?' / avulso':' / conjunto'),
    family:d.family||(d.decision==='view'?'vista':'—'),decision:d.decision,railItem:it?.id||null,variant:d.variant||null,duplicateOf:d.decision==='duplicate'?d.of:null,linkedTo:d.decision==='view'?d.of:null,
    certainty:d.certainty||null,views:views.join('+'),orientations:'frente',origin,files:Object.values({...set,...links}).map(s=>basename(s)).join(' '),reason};
});
const counts={sources:rows.length,rackItems:items.length,rackSources:new Set(items.flatMap(i=>i.sourceIds)).size,
  variantGroups:items.filter(i=>i.variants.length>1).length,variants:items.reduce((n,i)=>n+(i.variants.length>1?i.variants.length:0),0),
  linkedViews:rows.filter(r=>r.d.decision==='view').length,duplicates:rows.filter(r=>r.d.decision==='duplicate').length,excluded:rows.filter(r=>r.d.decision==='excluded').length,
  studiesHidden:14,media:media.size,withParts:items.filter(i=>i.capabilities.canSplitParts).length};

/* ---------- 6. saídas ---------- */
// medição de toda mídia do acervo (o viewer apresenta também peças fora da arara, como bonés e tênis, sem medir nada no navegador)
const mediaIndex={};
for(const p of imported)for(const [view,path] of Object.entries({...assets[p.id],...viewLinks[p.id]})){const m=meta[basename(path)];if(m)mediaIndex[p.id+':'+view]={w:m.w,h:m.h,bbox:m.bbox,neckX:m.neckX,clips:m.clips,color:m.color}}
const catalog={version:'rail-v10.1',note:'Gerado por scripts/gerar-rail-v10.mjs a partir de data/gb-rail-curation.json. Imagens do acervo; dados comerciais a validar.',counts,items,media:mediaIndex};
const js=`/* GB RAIL V10 — catálogo curado da arara. GERADO por scripts/gerar-rail-v10.mjs; não editar à mão.
 * Só entram peças com mídia real do acervo, conferida arquivo a arquivo. Estudos SVG ficam fora da arara.
 * Também aplica no site as correções de cadastro e os vínculos de vista conferidos na auditoria visual. */
window.GB_RAIL_CATALOG=${JSON.stringify(catalog)};
(function(fixes,links){
 for(const p of window.GB_IMPORTED_PRODUCTS||[]){const f=fixes[p.id];if(f){if(f.category)p.category=f.category;if(typeof f.single==='boolean')p.single=f.single}}
 const A=window.GB_ASSETS||(window.GB_ASSETS={});
 for(const id in links)A[id]=Object.assign({},A[id],links[id]);
})(${JSON.stringify(Object.fromEntries(Object.entries(fixes).map(([k,v])=>[k,{category:v.category,single:v.single}])))},${JSON.stringify(viewLinks)});
`;
const csvCols=['sourceId','name','categoryObserved','categoryVerified','family','decision','railItem','variant','duplicateOf','linkedTo','certainty','views','orientations','origin','files','reason'];
const esc=v=>{const s=v==null?'':String(v);return/[",\n;]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
const csv=[csvCols.join(','),...audit.map(r=>csvCols.map(c=>esc(r[c])).join(','))].join('\n')+'\n';
const ptDecision={rack:'NA ARARA',variant:'VARIANTE',view:'VISTA VINCULADA',duplicate:'DUPLICATA (oculta)',excluded:'FORA DA ARARA'};
const md=`# GB RAIL V10 — Auditoria de ativos

> Gerado por \`node scripts/gerar-rail-v10.mjs\` a partir de \`data/gb-rail-curation.json\` (decisões tomadas olhando cada imagem) e \`data/gb-media-meta.json\` (medição dos arquivos). Não editar à mão. Detalhe completo: \`data/gb-rail-audit.csv\`.

## Resumo
| Item | Quantidade |
| --- | ---: |
| Registros importados auditados | ${counts.sources} |
| Arquivos de mídia conferidos (existe, WebP íntegro, hash e dimensão iguais à medição, com transparência) | ${counts.media} |
| **Cabides na arara** (produto canônico) | **${counts.rackItems}** |
| Registros de origem representados na arara | ${counts.rackSources} |
| Grupos com variantes reais de cor | ${counts.variantGroups} (${counts.variants} cores) |
| Vistas vinculadas a outro produto (mesma peça) | ${counts.linkedViews} |
| Duplicatas ocultadas da arara | ${counts.duplicates} |
| Fora da arara por categoria (bonés, calçados, chinelos) | ${counts.excluded} |
| Conjuntos com superior e inferior isolados | ${counts.withParts} |
| Estudos SVG \`gb-tr-*\`/\`gb-sh-*\` | ${counts.studiesHidden} fora da arara (seguem no catálogo como estudo) |

## Vistas e rotação
Todas as ${counts.media} mídias são **frontais**. Não há arquivo de costas, lateral, sequência de órbita ou modelo 3D. Por isso, para todas as peças: \`canTurnBack=false\`, \`canTurnSide=false\`, \`canRotate360=false\` (tier D). O viewer oferece só a frente; COSTAS e LATERAL aparecem como "sem foto". Algumas camisas de futebol trazem o verso dobrado dentro da mesma foto: isso não vira vista de costas.

## Variantes reais
${items.filter(i=>i.variants.length>1).map(i=>`- **${i.title}** (${i.variants.map(v=>`${v.label} = \`${v.sourceId}\``).join(', ')}). ${i.evidence}`).join('\n')}

## Correções de cadastro aplicadas no site
${Object.entries(fixes).map(([id,f])=>`- \`${id}\`: ${f.category?`categoria → \`${f.category}\`, `:''}${typeof f.single==='boolean'?`unidade → ${f.single?'avulso':'conjunto'}`:''}. ${f.reason}`).join('\n')}

Vistas vinculadas: ${Object.entries(viewLinks).map(([id,l])=>`\`${id}\` + ${Object.entries(l).map(([k,v])=>`${k} \`${basename(v)}\``).join(', ')}`).join('; ')}.

## Origem das imagens
${audit.filter(r=>r.origin==='imagem digital do acervo').length} registros vêm de arquivos com nome de geração digital (\`Imagem do ChatGPT…\`, \`image-gen…\`). Eles entram na arara como **imagem do acervo a validar**, nunca como foto comercial confirmada. O catálogo de origem já declara: "algumas geradas digitalmente".

## Decisão por registro
| Origem | Nome de trabalho | Cadastro (antes → conferido) | Decisão | Cabide / vínculo | Motivo |
| --- | --- | --- | --- | --- | --- |
${audit.map(r=>`| \`${r.sourceId}\` | ${r.name} | ${r.categoryObserved}${r.categoryVerified!==r.categoryObserved?' → **'+r.categoryVerified+'**':''} | ${ptDecision[r.decision]}${r.certainty?' ('+r.certainty+')':''} | ${r.railItem?'`'+r.railItem+'`':r.duplicateOf?'= `'+r.duplicateOf+'`':r.linkedTo?'→ `'+r.linkedTo+'`':'—'} | ${r.reason.replace(/\|/g,'/')} |`).join('\n')}
`;
const outputs={'rail-catalog.js':js,'data/gb-rail-audit.json':JSON.stringify({counts,rows:audit},null,1)+'\n','data/gb-rail-audit.csv':csv,'docs/GB_RAIL_V10_ASSET_AUDIT.md':md};
if(!errors.length){
  for(const [f,content] of Object.entries(outputs)){
    if(CHECK){if(!existsSync(join(root,f))||read(f)!==content)fail('Saída desatualizada: '+f+' (rode node scripts/gerar-rail-v10.mjs)')}
    else writeFileSync(join(root,f),content);
  }
}
if(errors.length){console.error('✗ GB RAIL V10\n'+errors.map(e=>'  - '+e).join('\n'));process.exit(1)}
console.log(`✓ GB RAIL V10 ${CHECK?'conferido':'gerado'}: ${counts.rackItems} cabides de ${counts.sources} registros · ${counts.variantGroups} grupos de cor · ${counts.duplicates} duplicatas · ${counts.excluded} fora por categoria · ${counts.media} mídias íntegras`);
