/** GB IMPORTS V04 → V07 / INTERACTIVE REFERENCE TRANSLATION
 *  Princípios das gravações de referência traduzidos em interação própria (nada copiado).
 *  Todo movimento passa pelo GBMotion: um relógio rAF compartilhado, só ativo durante gesto ou acomodação.
 */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
if(typeof PRODUCTS==='undefined'||typeof productMedia==='undefined')return;
const M=window.GBMotion;
const items=PRODUCTS;
const reduced=M?M.Prefs.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=i=>String(i+1).padStart(2,'0');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
requestAnimationFrame(()=>document.body.classList.add('v04-ready'));

// HERO legado: peças secundárias só quando o palco V07 não está ativo.
const ghosts=[q('#heroGhostA'),q('#heroGhostB')];
function updateGhosts(){
  if(window.GBHeroStage)return;
  const i=typeof heroIndex==='number'?heroIndex:0;
  ghosts[0].innerHTML=productMedia(items[[7,1,4][i]],'top');
  ghosts[1].innerHTML=productMedia(items[[3,6,0][i]],'top');
}
requestAnimationFrame(updateGhosts);
document.addEventListener('gb:hero',updateGhosts);

/* ---------- GB RAIL + OBJECT VIEW: migrados para gb-rail-v10.js (arara física V10, catálogo curado) ---------- */
const viewer=q('#railViewer');
document.addEventListener('keydown',e=>{
 if(e.key!=='Tab')return;
 // Focus trap compartilhado (rail, filme, produto, gavetas).
 const active=[viewer,q('#filmModal'),q('#productModal'),...qa('.drawer')].find(el=>el&&!el.hidden);
 if(!active)return;
 const nodes=qa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',active).filter(el=>!el.disabled && !el.hidden && el.getClientRects().length>0);
 if(!nodes.length)return;
 const first=nodes[0],last=nodes.at(-1);
 if(e.shiftKey && (document.activeElement===first || !active.contains(document.activeElement))){e.preventDefault();last.focus()}
 else if(!e.shiftKey && (document.activeElement===last || !active.contains(document.activeElement))){e.preventDefault();first.focus()}
},true);

/* ---------- NIGHT SHOWROOM: palco duplo em perspectiva, luz amortecida, prévia por intenção ---------- */
// Night Showroom é uma curadoria exclusiva dos quatro conjuntos Tech Fleece.
// Fonte única: grupo e variantes fotografadas em rail-catalog.js. Nunca usar produtos genéricos como fallback.
const techFleeceGroup=window.GB_RAIL_CATALOG?.items?.find(g=>g.id==='gb-v10-tech-fleece');
const TECH_FLEECE_ORDER=['grafite','azul','cinza','creme'];
const techFleece=TECH_FLEECE_ORDER.map(color=>techFleeceGroup?.variants?.find(v=>v.id===color))
  .filter(Boolean).map(v=>({product:items.find(p=>p.id===v.sourceId),variant:v})).filter(v=>v.product);
const four=techFleece.map(v=>v.product);
let showPos=0,showView='combo',layerFlip=false;
function syncShowroomViews(p){
  // Creme possui somente a foto do conjunto completo; não alegar vista isolada do superior.
  const hasTop=!!window.GB_ASSETS?.[p.id]?.top;
  if(showView==='top'&&!hasTop)showView='combo';
  qa('[data-show-view]').forEach(button=>{
    const view=button.dataset.showView,available=view!=='top'||hasTop;
    button.disabled=!available;
    button.setAttribute('aria-disabled',String(!available));
    button.title=available?'': 'Parte superior isolada ainda sem imagem validada nesta cor';
    button.classList.toggle('active',showView===view);
    button.setAttribute('aria-pressed',String(showView===view));
  });
}
const featureMedia=q('#showroomFeatureMedia');featureMedia.innerHTML='<div class="sf-layer"></div><div class="sf-layer"></div>';
const layers=qa('.sf-layer',featureMedia);
function selectShowroom(i,focus=false,force=false){
  if(!four.length)return;
   const prev=showPos,next=(i+four.length)%four.length;if(next===prev&&!force&&layers.some(l=>l.classList.contains('is-on')))return;
  showPos=next;const p=four[showPos],dir=showPos>=prev?1:-1;
   syncShowroomViews(p);
  const inL=layers[layerFlip?0:1],outL=layers[layerFlip?1:0];layerFlip=!layerFlip;
  inL.innerHTML=productMedia(p,showView);inL.style.setProperty('--dir',dir);outL.style.setProperty('--dir',dir);
  outL.classList.remove('is-on');outL.classList.add('is-off');inL.classList.remove('is-off');
  void inL.offsetWidth;inL.classList.add('is-on');
  q('#showroomFeatureNum').textContent=fmt(showPos);q('#showroomFeatureName').textContent=`TECH FLEECE / ${techFleece[showPos]?.variant?.label||p.name}`;
  qa('[data-show-index]').forEach(b=>{const active=+b.dataset.showIndex===showPos;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  if(focus)q(`.showroom-selector [data-show-index="${showPos}"]`)?.focus();
}
// grade e palco montados ao se aproximar da tela; seletor e eventos já ficam prontos
function mountShowroomGrid(){q('#showroomGrid').innerHTML=four.map((p,i)=>`<button type="button" data-show-product="${p.id}" data-show-index="${i}" class="showroom-small"><span class="showroom-small-media" aria-hidden="true">${productMedia(p,'combo')}</span><span>TECH FLEECE · ${escaped(techFleece[i].variant.label)}</span></button>`).join('');selectShowroom(showPos,false,true)}
q('#showroomSelector').innerHTML=four.map((p,i)=>`<button type="button" data-show-product="${p.id}" data-show-index="${i}">Tech Fleece / ${escaped(techFleece[i].variant.label)}</button>`).join('');
q('#showroom').addEventListener('click',e=>{const b=e.target.closest('[data-show-index]');if(b)selectShowroom(+b.dataset.showIndex);const v=e.target.closest('[data-show-view]');if(v&&!v.disabled){showView=v.dataset.showView;selectShowroom(showPos,false,true)}});
q('#showroomSelector').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();selectShowroom(showPos+1,true)}if(e.key==='ArrowUp'){e.preventDefault();selectShowroom(showPos-1,true)}});
q('#showroomOpen').addEventListener('click',()=>{if(four[showPos])detailModal(four[showPos])});
q('.showroom-feature')?.addEventListener('click',e=>{const l=e.target.closest('.sf-layer.is-on');if(l&&four[showPos])detailModal(four[showPos],{transition:l.querySelector('.garment-svg')})});
if(M)M.onVisible(q('#showroom'),v=>{if(v&&!q('#showroomGrid').firstChild)mountShowroomGrid()},{margin:'900px 0px'});else mountShowroomGrid();
const feature=q('.showroom-feature');
if(feature&&!reduced&&M&&M.Prefs.fine&&!M.Prefs.lite){
  // luz segue o cursor com amortecimento (sem perseguição nervosa)
  let tx=50,ty=42,cx=50,cy=42,on=false;
  const lightLoop=dt=>{const k=1-Math.pow(.0009,dt);cx+=(tx-cx)*k;cy+=(ty-cy)*k;feature.style.setProperty('--lx',cx.toFixed(2)+'%');feature.style.setProperty('--ly',cy.toFixed(2)+'%');if(Math.abs(tx-cx)<.05&&Math.abs(ty-cy)<.05){on=false;return false}};
  feature.addEventListener('pointermove',e=>{const r=feature.getBoundingClientRect();tx=(e.clientX-r.left)/r.width*100;ty=(e.clientY-r.top)/r.height*100;if(!on){on=true;M.Ticker.add(lightLoop)}},{passive:true});
  feature.addEventListener('pointerleave',()=>{tx=50;ty=42;if(!on){on=true;M.Ticker.add(lightLoop)}});
  // prévia contextual: parar sobre uma peça da grade a traz para o palco
  let intent=0;q('#showroomGrid').addEventListener('pointerover',e=>{const b=e.target.closest('[data-show-index]');if(!b)return;clearTimeout(intent);intent=setTimeout(()=>selectShowroom(+b.dataset.showIndex),140)});
  q('#showroomGrid').addEventListener('pointerleave',()=>clearTimeout(intent));
}
// Luz acende uma vez quando o showroom entra na tela.
if(M)M.onVisible(q('#showroom'),v=>{if(v)q('#showroom').classList.add('is-lit')},{threshold:.25});else q('#showroom').classList.add('is-lit');

/* ---------- CHROMATIC LAB: mesmo molde, quatro camadas de cor; nada é redesenhado na troca ---------- */
// Laboratório de cores migrou para a experiência interna de produto (v08.js).

// Revelação progressiva leve, respeita movimento reduzido.
if(!reduced&&'IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('v04-in');obs.unobserve(x.target)}})},{threshold:.12});qa('.rail-title-row,.showroom-heading,.colorlab-copy,.editorial-break-hero').forEach(x=>{x.classList.add('v04-reveal');obs.observe(x)})}
})();
