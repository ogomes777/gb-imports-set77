/* GB IMPORTS / V08 — Experiência de produto unificada.
 * O laboratório pertence à ficha imersiva, nunca à home.
 * Cores são estudos gráficos, NÃO SKUs ou variantes reais. Desde a V10 o laboratório só aparece
 * para estudos SVG; peças com foto usam as fichas de cores fotografadas do GB RAIL.
 */
(()=>{
'use strict';
const viewer=document.getElementById('railViewer');
if(!viewer||typeof window.GBOpenProductExperience!=='function')return;
const body=viewer.querySelector('.rail-viewer-body');
const header=viewer.querySelector('.rail-viewer-top');
if(!body||!header)return;
body.id='gbObjectPanel';
body.setAttribute('role','tabpanel');
body.setAttribute('aria-labelledby','gbTabObject');
const tabs=document.createElement('div');
tabs.className='gb-object-tabs';
tabs.setAttribute('role','tablist');
tabs.setAttribute('aria-label','Experiências da peça');
tabs.innerHTML='<button type="button" id="gbTabObject" role="tab" aria-controls="gbObjectPanel" aria-selected="true">01 / VISUALIZAR</button><button type="button" id="gbTabColors" role="tab" aria-controls="gbColorPanel" aria-selected="false">02 / EXPERIMENTAR CORES</button><span>GB / PRODUCT EXPERIENCE</span>';
header.after(tabs);
const panel=document.createElement('section');
panel.id='gbColorPanel';panel.className='gb-product-color-panel';panel.hidden=true;
panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','gbTabColors');
panel.innerHTML='<div class="gb-lab-intro"><span class="gb-lab-eyebrow">GB / INTERACTIVE COLOR STUDY · NÃO COMERCIAL</span><h2>MUDA A<br><em>COR.</em><br>NÃO A<br>ATITUDE.</h2><p>Explore outras leituras da mesma silhueta. Cores conceituais, sem confirmar estoque, fabricação ou variantes disponíveis.</p><div id="gbLabSwatches" role="group" aria-label="Cores ilustrativas da peça"></div><div class="gb-lab-meta"><span id="gbLabColorName">01 / CARVÃO</span><span>04 ESTUDOS</span></div><button id="gbLabBack" type="button" class="gb-lab-return">← VOLTAR À PEÇA</button></div><div class="gb-lab-art"><span class="gb-lab-bg" aria-hidden="true">GB</span><div id="gbLabMedia" class="gb-lab-media" aria-live="off"></div><div class="gb-lab-art-foot"><span id="gbLabItemName">GB / PEÇA SELECIONADA</span><strong>ESTUDO DE COR · NÃO É VARIANTE À VENDA</strong></div></div>';
viewer.appendChild(panel);
const swatches=panel.querySelector('#gbLabSwatches');
const stage=panel.querySelector('#gbLabMedia');
const swatchLabel=panel.querySelector('#gbLabColorName');
const itemLabel=panel.querySelector('#gbLabItemName');
const palette=[
 {name:'CARVÃO',top:'#26282b',bottom:'#26282b',accent:'#a5a9ac'},
 {name:'CERÂMICA',top:'#e9e3d6',bottom:'#e9e3d6',accent:'#ada596'},
 {name:'ELÉTRICO',top:'#3659ba',bottom:'#3659ba',accent:'#91a8ed'},
 {name:'ARGILA',top:'#a74b34',bottom:'#a74b34',accent:'#e1a383'}
];
let product=null;
let position=0;
let mode='object';
const pad=n=>String(n+1).padStart(2,'0');
swatches.innerHTML=palette.map((p,i)=>'<button type="button" class="gb-lab-swatch" data-gb-color="'+i+'" style="--gb-swatch:'+p.top+'" aria-label="Estudo de cor '+p.name+'" aria-pressed="'+(i===0)+'"><span></span></button>').join('');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function renderColor(){
 if(!product)return;
 const p=palette[position];
 const colored=Object.assign({},product,{top:p.top,bottom:p.bottom,accent:p.accent,stripe:p.accent});
 stage.innerHTML=garmentSVG(colored,product.single?'top':'combo','garment-svg gb-lab-render');
 if(!reduced.matches){stage.classList.remove('gb-color-enter');void stage.offsetWidth;stage.classList.add('gb-color-enter');}
 swatchLabel.textContent=pad(position)+' / '+p.name;
 itemLabel.textContent='GB / '+product.name.toUpperCase();
 panel.style.setProperty('--gb-study-aura',p.top);
 swatches.querySelectorAll('[data-gb-color]').forEach(b=>{
  const selected=Number(b.dataset.gbColor)===position;
  b.classList.toggle('is-active',selected);
  b.setAttribute('aria-pressed',String(selected));
 });
}
function switchMode(next,focus=false){
 mode=next==='color'?'color':'object';
 const lab=mode==='color';
 body.hidden=lab;panel.hidden=!lab;
 viewer.classList.toggle('gb-mode-color',lab);
 tabs.querySelector('#gbTabObject').setAttribute('aria-selected',String(!lab));
 tabs.querySelector('#gbTabColors').setAttribute('aria-selected',String(lab));
 if(lab)renderColor();
 if(focus)(lab?tabs.querySelector('#gbTabColors'):tabs.querySelector('#gbTabObject')).focus();
}
window.GBColorLabStep=n=>{position=(position+n+palette.length)%palette.length;renderColor()};
tabs.querySelector('#gbTabObject').addEventListener('click',()=>switchMode('object'));
tabs.querySelector('#gbTabColors').addEventListener('click',()=>switchMode('color'));
panel.querySelector('#gbLabBack').addEventListener('click',()=>switchMode('object',true));
swatches.addEventListener('click',e=>{
 const b=e.target.closest('[data-gb-color]');if(!b)return;
 position=Number(b.dataset.gbColor);renderColor();
});
document.addEventListener('gb:object-product',e=>{
 product=e.detail?.product||null;position=0;
 // V10: estudo de cor só para ilustrações. Peça com foto do acervo nunca recebe cor pintada por cima;
 // as cores reais dela são as fichas fotografadas do GB RAIL.
 const study=e.detail?.study??!window.GB_ASSETS?.[product?.id]?.combo;
 tabs.hidden=!study;viewer.classList.toggle('gb-has-study',study);
 if(!study||viewer.hidden||mode==='object')switchMode('object');
 else renderColor();
});
// Ao fechar, não conservar um laboratório anterior para outra peça.
viewer.querySelector('#railViewerClose')?.addEventListener('click',()=>switchMode('object'),{capture:true});
// Toda abertura comum de produto começa no GB OBJECT VIEW.
// "VER TAMANHOS & DETALHES" segue para a ficha existente sem looping.
if(typeof window.detailModal==='function'){
 const original=window.detailModal;
 window.detailModal=function(p,opts={}){
  if(!p||opts.detailOnly||opts.replace||opts.direct)return original(p,opts);
  if(window.GBOpenProductExperience(p))return;
  return original(p,opts);
 };
}
// No painel de tamanhos, um retorno explícito ao palco visual.
if(typeof window.renderProductModal==='function'){
 const originalRender=window.renderProductModal;
 window.renderProductModal=function(){
  const result=originalRender.apply(this,arguments);
  const detail=document.querySelector('#productModal .product-detail');
  if(detail&&!detail.querySelector('#gbReturnObject')){
   const btn=document.createElement('button');
   btn.id='gbReturnObject';btn.type='button';btn.className='gb-return-object';
   btn.textContent='↗ VOLTAR À PEÇA NO CABIDE';
   detail.querySelector('.detail-facts')?.before(btn);
  }
  return result;
 };
 document.addEventListener('click',e=>{
  if(!e.target.closest('#gbReturnObject'))return;
  if(typeof activeModal==='undefined'||!activeModal)return;
  window.GBOpenProductExperience(activeModal);
 });
}
})();
