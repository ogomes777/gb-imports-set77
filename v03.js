/**
 * GB IMPORTS / THE GB EDIT — V03 enhancement layer.
 * A11y/perf: explicit film playback only, reduced-motion respect, idle-safe effects.
 * All merchandise represented by existing V02 placeholder data until official assets are supplied.
 */
(function(){
'use strict';
const one=(s,p=document)=>p.querySelector(s);
const many=(s,p=document)=>Array.from(p.querySelectorAll(s));
const getItem=(id)=>PRODUCTS.find(p=>p.id===id);
const stage=one('#heroStage');
const editorial=one('#editorialProduct');
if(editorial)editorial.innerHTML=productMedia(PRODUCTS.find(p=>p.id==='gb-crt-004')||PUBLIC_PRODUCTS[0]);

one('#mobileSaved')?.addEventListener('click',()=>one('#wishlistOpen').click());
one('#mobileBag')?.addEventListener('click',()=>one('#bagOpen').click());

// The digital styling studio does not represent a real purchasable kit.
// Só entram peças com vista superior e inferior coerentes (todas as de estudo, ou fotos com as duas vistas).
// Os recortes CRT flat-lay não são malhas vestíveis e exigem mapeamento anatômico antes do Fit Studio.
const lookPool=PRODUCTS.filter(p=>!p.id.startsWith('gb-crt-')&&!p.single&&(!hasPhoto(p)||(GB_ASSETS[p.id].top&&GB_ASSETS[p.id].bottom)));
const savedLook=(()=>{try{return JSON.parse(localStorage.getItem('gb-v06-look'))}catch{return null}})();
let selectedTop=lookPool.some(p=>p.id===savedLook?.top)?savedLook.top:PRODUCTS[1].id;
let selectedBottom=lookPool.some(p=>p.id===savedLook?.bottom)?savedLook.bottom:PRODUCTS[7].id;
const reducedLook=matchMedia('(prefers-reduced-motion: reduce)').matches;
function readOutfits(){let saved=[];try{saved=JSON.parse(localStorage.getItem('gb-v03-outfits'))||[];if(!Array.isArray(saved))saved=[];}catch{}return saved.filter(o=>getItem(o.top)&&getItem(o.bottom))}
function writeOutfits(list){try{localStorage.setItem('gb-v03-outfits',JSON.stringify(list.slice(0,10)));}catch{}}
// V09 / GB FIT STUDIO: toda origem (clique, setas, swipe, arraste, misturar, restaurar) passa por aqui.
// Com o provador montado, a peça VESTE o manequim persistente; sem ele, cai no comportamento V07.
let lookSource='init',lookFrom=null,lookParts=new Set(),lookEmitQueued=false;
function withSource(src,from,fn){lookSource=src;lookFrom=from||null;try{fn()}finally{lookSource='init';lookFrom=null}}
const centerOf=el=>{const r=el?.getBoundingClientRect();return r?{x:r.left+r.width/2,y:r.top+r.height/2}:null};
function emitLookChange(part,source){
 lookParts.add(part);if(lookEmitQueued)return;lookEmitQueued=true;
 queueMicrotask(()=>{lookEmitQueued=false;const parts=[...lookParts];lookParts.clear();
  document.dispatchEvent(new CustomEvent('gb:look-change',{bubbles:true,detail:{topId:selectedTop,bottomId:selectedBottom,changedPart:parts.length>1?'both':parts[0],source}}))});
}
function paintPiece(mode,dir=0,snap=false){
 if(window.GBFitting?.state.topId){
  GBFitting.set({topId:selectedTop,bottomId:selectedBottom},{changedPart:mode,source:lookSource,from:lookFrom,dir:lookSource==='cycle'||lookSource==='swipe'?dir:0});
  emitLookChange(mode,lookSource);
  if(snap&&!reducedLook)snapIn(mode);
  return;
 }
 const el=one(mode==='top'?'#lookPreviewTop':'#lookPreviewBottom'),p=getItem(mode==='top'?selectedTop:selectedBottom);
 el.innerHTML=productMedia(p,mode);
 if(reducedLook)return;
 if(snap)snapIn(mode);
 else if(dir){el.classList.remove('look-swap');void el.offsetWidth;el.style.setProperty('--dir',dir);el.classList.add('look-swap')}
}
// Encaixe: a peça "assenta" na área com uma mola curta e a área acende em amarelo.
function snapIn(mode){
 const el=one(mode==='top'?'#lookPreviewTop':'#lookPreviewBottom'),dock=one(`.look-dock[data-dock="${mode}"]`),media=el.firstElementChild;
 media?.animate?.([{transform:'translateY(-18px) scale(1.07)',opacity:.4},{transform:'translateY(4px) scale(.985)',opacity:1,offset:.62},{transform:'none',opacity:1}],{duration:560,easing:'cubic-bezier(.2,.8,.2,1)'});
 if(dock){dock.classList.remove('is-snap');void dock.offsetWidth;dock.classList.add('is-snap')}
}
function renderOptions(){
 for(const [id,selected,mode] of [['lookTops',selectedTop,'top'],['lookBottoms',selectedBottom,'bottom']]){
   const box=one('#'+id);
   box.innerHTML=lookPool.map((p,i)=>`<button type="button" class="look-option ${p.id===selected?'active':''}" data-look-mode="${mode}" data-look-id="${p.id}" aria-pressed="${p.id===selected}" title="${escaped(p.name)}" aria-label="${String(i+1).padStart(2,'0')} — ${escaped(p.name)} / ${mode==='top'?'parte superior':'parte inferior'}"><span class="look-index">${String(i+1).padStart(2,'0')}</span>${productMedia(p,mode)}</button>`).join('');
   const active=box.querySelector('.active');if(active){const ar=active.getBoundingClientRect(),br=box.getBoundingClientRect();box.scrollLeft+=ar.left-br.left-box.clientWidth/2+ar.width/2;}
 }
}
function renderSummary(){
 const top=getItem(selectedTop),bottom=getItem(selectedBottom);
 one('#lookSummary').textContent=top.name+' (superior)  +  '+bottom.name+' (inferior)';
 const links=one('#lookSources');if(links)links.innerHTML=`<button type="button" data-look-open="${top.id}">VER SUPERIOR ↗</button><button type="button" data-look-open="${bottom.id}">VER INFERIOR ↗</button>`;
 try{localStorage.setItem('gb-v06-look',JSON.stringify({top:selectedTop,bottom:selectedBottom}));}catch{}
}
function renderSaved(){
 const box=one('#lookSaved');if(!box)return;const list=readOutfits();
 box.hidden=!list.length;
 box.innerHTML=list.length?`<span class="look-saved-title">LOOKS SALVOS / ${String(list.length).padStart(2,'0')}</span><div class="look-saved-list">${list.map((o,i)=>`<div class="look-saved-item"><button type="button" class="look-saved-thumb" data-look-restore="${i}" aria-label="Restaurar look: ${escaped(getItem(o.top).name)} com ${escaped(getItem(o.bottom).name)}"><span>${productMedia(getItem(o.top),'top')}</span><span>${productMedia(getItem(o.bottom),'bottom')}</span></button><button type="button" class="look-saved-remove" data-look-remove="${i}" aria-label="Remover look salvo">×</button></div>`).join('')}</div>`:'';
}
function renderStudio(){window.GBFitting?.mount(one('.look-stage'),{topId:selectedTop,bottomId:selectedBottom});paintPiece('top');paintPiece('bottom');renderOptions();renderSummary();renderSaved()}
// Comparação A/B: look atual × look salvo, lado a lado no mesmo palco e na mesma escala.
let comparing=false,compareIndex=0;
function renderCompare(){
 const box=one('#lookCompare'),list=readOutfits();if(!box)return;
 const o=list[compareIndex]||list[0];
 if(window.GBFitting?.state.topId){box.hidden=true;one('.look-stage')?.classList.toggle('is-compare',!!(comparing&&o));GBFitting.compare(!!(comparing&&o),o);return}
 if(!comparing||!o){box.hidden=true;one('.look-stage')?.classList.remove('is-compare');return}
 box.hidden=false;one('.look-stage')?.classList.add('is-compare');
 box.innerHTML=`<span class="look-compare-tag">B / SALVO</span><div class="look-compare-top">${productMedia(getItem(o.top),'top')}</div><div class="look-compare-bottom">${productMedia(getItem(o.bottom),'bottom')}</div><span class="look-compare-name">${escaped(getItem(o.top).name)} + ${escaped(getItem(o.bottom).name)}</span>`;
}
function toggleCompare(){
 if(!readOutfits().length){toast('Salve um look para comparar com o atual.');return}
 comparing=!comparing;compareIndex=0;renderCompare();
 const b=one('#lookCompareBtn');if(b){b.setAttribute('aria-pressed',String(comparing));b.textContent=comparing?'FECHAR COMPARAÇÃO':'COMPARAR A / B'}
 if(comparing)toast('Comparando o look atual (A) com o salvo (B). Toque num look salvo para trocar o B.');
}
function choose(mode,id,dir,snap=false){
 if(mode==='top'){if(id===selectedTop)return;selectedTop=id}else{if(id===selectedBottom)return;selectedBottom=id}
 paintPiece(mode,dir,snap);renderOptions();renderSummary();if(comparing)renderCompare();
}
function cycle(mode,d,src='cycle'){const cur=mode==='top'?selectedTop:selectedBottom;const i=lookPool.findIndex(p=>p.id===cur);withSource(src,null,()=>choose(mode,lookPool[(i+d+lookPool.length)%lookPool.length].id,d))}
// monta o estúdio só quando ele se aproxima da tela (menos trabalho no carregamento)
if(window.GBMotion){const off=GBMotion.onVisible(one('#lookstudio'),v=>{if(v){off();renderStudio()}},{margin:'900px 0px'})}else renderStudio();
for(const id of ['lookTops','lookBottoms'])one('#'+id)?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-look-id]'); if(!btn)return;
 const mode=btn.dataset.lookMode,cur=mode==='top'?selectedTop:selectedBottom;
 const dir=lookPool.findIndex(p=>p.id===btn.dataset.lookId)>lookPool.findIndex(p=>p.id===cur)?1:-1;
 withSource('click',centerOf(btn),()=>choose(mode,btn.dataset.lookId,dir,true));
});
one('.look-studio')?.addEventListener('click',e=>{
 const c=e.target.closest('[data-look-cycle]');if(c){const [mode,d]=c.dataset.lookCycle.split(':');cycle(mode,+d)}
 if(e.target.closest('#lookShuffle')){const pick=not=>{const pool=lookPool.filter(p=>p.id!==not);return pool[Math.floor(Math.random()*pool.length)].id};const t=pick(selectedTop),b=pick(selectedBottom);/* misturar troca as duas peças, sempre */selectedTop=t;selectedBottom=b;withSource('shuffle',null,()=>{paintPiece('top',1);paintPiece('bottom',-1)});renderOptions();renderSummary();if(comparing)renderCompare()}
 const open=e.target.closest('[data-look-open]');if(open)detailModal(getItem(open.dataset.lookOpen));
 if(e.target.closest('#lookCompareBtn'))toggleCompare();
 const rest=e.target.closest('[data-look-restore]');if(rest&&comparing){compareIndex=+rest.dataset.lookRestore;renderCompare();return}
 if(rest){const o=readOutfits()[+rest.dataset.lookRestore];if(o){selectedTop=o.top;selectedBottom=o.bottom;withSource('restore',null,()=>{paintPiece('top',1);paintPiece('bottom',1)});renderOptions();renderSummary();toast('Look restaurado.')}}
 const rem=e.target.closest('[data-look-remove]');if(rem){const list=readOutfits();list.splice(+rem.dataset.lookRemove,1);writeOutfits(list);renderSaved();if(comparing){if(!list.length){comparing=false;const b=one('#lookCompareBtn');if(b){b.setAttribute('aria-pressed','false');b.textContent='COMPARAR A / B'}}compareIndex=0;renderCompare()}toast('Look removido.')}
});
// Swipe no palco: metade de cima troca a parte superior, metade de baixo a inferior.
const lookStage=one('.look-stage');let lsx=0,lsy=0,lsHalf='top';
lookStage?.addEventListener('touchstart',e=>{const r=lookStage.getBoundingClientRect();lsx=e.touches[0].clientX;lsy=e.touches[0].clientY;lsHalf=(lsy-r.top)<r.height*.5?'top':'bottom'},{passive:true});
lookStage?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-lsx,dy=e.changedTouches[0].clientY-lsy;if(comparing)return; // no A/B o gesto horizontal move o divisor
 if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)cycle(lsHalf,dx<0?1:-1,'swipe')},{passive:true});
// Arrastar da lista para o palco (mouse): a peça segue o cursor e encaixa na área correspondente.
if(window.GBMotion&&GBMotion.Prefs.fine&&!reducedLook){
 let dragItem=null;
 const stageEl=one('.look-stage');
 const end=(e,cancel)=>{if(!dragItem)return;const {ghost,mode,id,moved}=dragItem;dragItem=null;stageEl.classList.remove('is-dropping');
   const r=stageEl.getBoundingClientRect(),inside=!cancel&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;
   if(!moved){ghost.remove();return}
   if(inside){const target=(one(`.fit-figure .look-dock[data-dock="${mode}"]`)||one(mode==='top'?'#lookPreviewTop':'#lookPreviewBottom')).getBoundingClientRect(),g=ghost.getBoundingClientRect();
     ghost.animate([{transform:ghost.style.transform},{transform:`translate(${target.left+target.width/2-g.width/2}px,${target.top+target.height/2-g.height/2}px) scale(1.6)`,opacity:0}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'}).finished.then(()=>ghost.remove());
     const cur=mode==='top'?selectedTop:selectedBottom;if(id!==cur)withSource('drag',{x:e.clientX,y:e.clientY},()=>choose(mode,id,1,true));else snapIn(mode)}
   else ghost.animate([{opacity:1},{opacity:0}],{duration:180}).finished.then(()=>ghost.remove());
 };
 for(const box of ['#lookTops','#lookBottoms'].map(s=>one(s))){
  box?.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-look-id]');if(!b||e.pointerType!=='mouse'||e.button)return;
    const ghost=document.createElement('div');ghost.className='look-drag-ghost';ghost.innerHTML=productMedia(getItem(b.dataset.lookId),b.dataset.lookMode);document.body.appendChild(ghost);
    dragItem={ghost,mode:b.dataset.lookMode,id:b.dataset.lookId,x:e.clientX,y:e.clientY,moved:false};ghost.style.transform=`translate(${e.clientX-60}px,${e.clientY-70}px)`;ghost.style.opacity='0'});
 }
 document.addEventListener('pointermove',e=>{if(!dragItem)return;if(!dragItem.moved&&Math.hypot(e.clientX-dragItem.x,e.clientY-dragItem.y)<8)return;
   if(!dragItem.moved){dragItem.moved=true;dragItem.ghost.style.opacity='1';stageEl.classList.add('is-dropping');stageEl.dataset.drop=dragItem.mode}
   dragItem.ghost.style.transform=`translate(${e.clientX-60}px,${e.clientY-70}px) rotate(-6deg)`},{passive:true});
 document.addEventListener('pointerup',e=>{const wasDrag=dragItem?.moved;end(e,false);if(wasDrag){const stop=ev=>{ev.stopPropagation();ev.preventDefault()};document.addEventListener('click',stop,{capture:true,once:true});setTimeout(()=>document.removeEventListener('click',stop,true),50)}});
 document.addEventListener('pointercancel',e=>end(e,true));
}
one('#lookSave')?.addEventListener('click',()=>{
 const list=readOutfits();
 if(list.some(o=>o.top===selectedTop&&o.bottom===selectedBottom)){toast('Esse look já está salvo.');return}
 list.unshift({top:selectedTop,bottom:selectedBottom,createdAt:new Date().toISOString(),presentationVersion:'fit-v09'});writeOutfits(list);renderSaved();
 toast('Referência de look salva neste navegador.');
});

// Cinematic sequence: three designed editorial frames. No claim of real footage.
const film=one('#filmModal');let playing=false,filmIndex=0,frameStart=0,frameRequest=0;
const chapters=[
  {head:'A MARCA É<br>QUEM VESTE.',sub:'Toda escolha conta uma história. Você é quem escreve a próxima.',p:PRODUCTS.find(p=>p.id==='gb-crt-001')||PUBLIC_PRODUCTS[0]},
  {head:'O VISUAL<br>É <i>SEU.</i>',sub:'Não importa o roteiro. Importa como você entra em cena.',p:PRODUCTS.find(p=>p.id==='gb-crt-005')||PUBLIC_PRODUCTS[0]},
  {head:'DA RUA<br>PRO <i>MUNDO.</i>',sub:'A GB continua perto. Agora, em uma experiência pensada para cada tela.',p:PRODUCTS.find(p=>p.id==='gb-crt-006')||PUBLIC_PRODUCTS[0]},
];
function drawFilm(){
 const c=chapters[filmIndex];
 one('#filmSceneNumber').textContent=`THE GB EDIT / FILM 0${filmIndex+1}—03`;
 one('#filmSceneTitle').innerHTML=c.head;
 one('#filmSceneSub').textContent=c.sub;
 one('#filmSceneProduct').innerHTML=productMedia(c.p);
 one('#filmProgress').style.width='0%';
}
function tick(t){if(!playing)return;if(!frameStart)frameStart=t;
 const progress=Math.min((t-frameStart)/7000,1);
 one('#filmProgress').style.width=(progress*100)+'%';
 if(progress>=1){filmIndex=(filmIndex+1)%chapters.length;frameStart=t;drawFilm();}
 frameRequest=requestAnimationFrame(tick);
}
function openFilm(){
 closeAll(false);filmIndex=0;frameStart=0;drawFilm();film.hidden=false;document.body.classList.add('no-scroll');playing=true;cancelAnimationFrame(frameRequest);
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)frameRequest=requestAnimationFrame(tick);
 one('#filmClose').focus();
}
function closeFilm(){if(film.hidden)return;playing=false;cancelAnimationFrame(frameRequest);film.hidden=true;document.body.classList.remove('no-scroll');one('#filmOpen')?.focus()}
one('#filmOpen')?.addEventListener('click',openFilm);
one('#filmClose')?.addEventListener('click',closeFilm);
one('#filmNext')?.addEventListener('click',()=>{filmIndex=(filmIndex+1)%chapters.length;frameStart=0;drawFilm();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!film.hidden){e.stopImmediatePropagation();closeFilm();}},true);
film?.addEventListener('click',e=>{if(e.target===film)closeFilm()});

// Scroll progress & visibility based header / no heavyweight scroll render loops.
let scrollQueued=false;
function onScroll(){if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{
 const total=document.documentElement.scrollHeight-innerHeight;
 const ratio=total?Math.min(Math.max(scrollY/total,0),1):0;
 const progress=one('#scrollProgress');if(progress)progress.style.width=(ratio*100)+'%';
 one('.v03-header')?.classList.toggle('is-scrolled',scrollY>80);
 scrollQueued=false;
});}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();

// Pointer follows a single pre-rendered light instead of forcing all products to repaint.
if(stage&&matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 const light=one('.hero-lightbar',stage);let pending=false,px=0,py=0;
 stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;if(pending)return;pending=true;requestAnimationFrame(()=>{light.style.translate=`${(px*22).toFixed(1)}px ${(py*14).toFixed(1)}px`;pending=false})},{passive:true});
}
})();
