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
if(editorial)editorial.innerHTML=productMedia(PRODUCTS[4]);

// A fast commerce entry layered over the editorial flagship (com a transição de marca GB quando disponível).
function goToShop(filter){
  const go=()=>{selectFilter(filter);one('#colecao').scrollIntoView({behavior:window.gbWipe||window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
  window.gbWipe?window.gbWipe(go):go();
}
many('[data-v03-filter]').forEach(button=>button.addEventListener('click',()=>goToShop(button.dataset.v03Filter)));
one('#shopFavorites')?.addEventListener('click',()=>goToShop('saved'));
one('#mobileSaved')?.addEventListener('click',()=>one('#wishlistOpen').click());
one('#mobileBag')?.addEventListener('click',()=>one('#bagOpen').click());

// The digital styling studio does not represent a real purchasable kit.
// Só entram peças com vista superior e inferior coerentes (todas as de estudo, ou fotos com as duas vistas).
const lookPool=PRODUCTS.filter(p=>!p.single&&(!hasPhoto(p)||(GB_ASSETS[p.id].top&&GB_ASSETS[p.id].bottom)));
const savedLook=(()=>{try{return JSON.parse(localStorage.getItem('gb-v06-look'))}catch{return null}})();
let selectedTop=lookPool.some(p=>p.id===savedLook?.top)?savedLook.top:PRODUCTS[1].id;
let selectedBottom=lookPool.some(p=>p.id===savedLook?.bottom)?savedLook.bottom:PRODUCTS[7].id;
const reducedLook=matchMedia('(prefers-reduced-motion: reduce)').matches;
function readOutfits(){let saved=[];try{saved=JSON.parse(localStorage.getItem('gb-v03-outfits'))||[];if(!Array.isArray(saved))saved=[];}catch{}return saved.filter(o=>getItem(o.top)&&getItem(o.bottom))}
function writeOutfits(list){try{localStorage.setItem('gb-v03-outfits',JSON.stringify(list.slice(0,10)));}catch{}}
function paintPiece(mode,dir=0){
 const el=one(mode==='top'?'#lookPreviewTop':'#lookPreviewBottom'),p=getItem(mode==='top'?selectedTop:selectedBottom);
 el.innerHTML=productMedia(p,mode);
 if(dir&&!reducedLook){el.classList.remove('look-swap');void el.offsetWidth;el.style.setProperty('--dir',dir);el.classList.add('look-swap')}
}
function renderOptions(){
 for(const [id,selected,mode] of [['lookTops',selectedTop,'top'],['lookBottoms',selectedBottom,'bottom']]){
   const box=one('#'+id);
   box.innerHTML=lookPool.map((p,i)=>`<button type="button" class="look-option ${p.id===selected?'active':''}" data-look-mode="${mode}" data-look-id="${p.id}" aria-pressed="${p.id===selected}" title="${escaped(p.name)}" aria-label="${escaped(p.name)} / ${mode==='top'?'parte superior':'parte inferior'}"><span class="look-index">${String(i+1).padStart(2,'0')}</span>${productMedia(p,mode)}</button>`).join('');
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
function renderStudio(){paintPiece('top');paintPiece('bottom');renderOptions();renderSummary();renderSaved()}
function choose(mode,id,dir){
 if(mode==='top'){if(id===selectedTop)return;selectedTop=id}else{if(id===selectedBottom)return;selectedBottom=id}
 paintPiece(mode,dir);renderOptions();renderSummary();
}
function cycle(mode,d){const cur=mode==='top'?selectedTop:selectedBottom;const i=lookPool.findIndex(p=>p.id===cur);choose(mode,lookPool[(i+d+lookPool.length)%lookPool.length].id,d)}
renderStudio();
for(const id of ['lookTops','lookBottoms'])one('#'+id)?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-look-id]'); if(!btn)return;
 const mode=btn.dataset.lookMode,cur=mode==='top'?selectedTop:selectedBottom;
 const dir=lookPool.findIndex(p=>p.id===btn.dataset.lookId)>lookPool.findIndex(p=>p.id===cur)?1:-1;
 choose(mode,btn.dataset.lookId,dir);
});
one('.look-studio')?.addEventListener('click',e=>{
 const c=e.target.closest('[data-look-cycle]');if(c){const [mode,d]=c.dataset.lookCycle.split(':');cycle(mode,+d)}
 if(e.target.closest('#lookShuffle')){const pick=()=>lookPool[Math.floor(Math.random()*lookPool.length)].id;let t=pick(),b=pick();if(t===selectedTop&&b===selectedBottom)b=lookPool[(lookPool.findIndex(p=>p.id===b)+1)%lookPool.length].id;selectedTop=t;selectedBottom=b;paintPiece('top',1);paintPiece('bottom',-1);renderOptions();renderSummary()}
 const open=e.target.closest('[data-look-open]');if(open)detailModal(getItem(open.dataset.lookOpen));
 const rest=e.target.closest('[data-look-restore]');if(rest){const o=readOutfits()[+rest.dataset.lookRestore];if(o){selectedTop=o.top;selectedBottom=o.bottom;paintPiece('top',1);paintPiece('bottom',1);renderOptions();renderSummary();toast('Look restaurado.')}}
 const rem=e.target.closest('[data-look-remove]');if(rem){const list=readOutfits();list.splice(+rem.dataset.lookRemove,1);writeOutfits(list);renderSaved();toast('Look removido.')}
});
// Swipe no palco: metade de cima troca a parte superior, metade de baixo a inferior.
const lookStage=one('.look-stage');let lsx=0,lsy=0,lsHalf='top';
lookStage?.addEventListener('touchstart',e=>{const r=lookStage.getBoundingClientRect();lsx=e.touches[0].clientX;lsy=e.touches[0].clientY;lsHalf=(lsy-r.top)<r.height*.5?'top':'bottom'},{passive:true});
lookStage?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-lsx,dy=e.changedTouches[0].clientY-lsy;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)cycle(lsHalf,dx<0?1:-1)},{passive:true});
one('#lookSave')?.addEventListener('click',()=>{
 const list=readOutfits();
 if(list.some(o=>o.top===selectedTop&&o.bottom===selectedBottom)){toast('Esse look já está salvo.');return}
 list.unshift({top:selectedTop,bottom:selectedBottom,createdAt:new Date().toISOString()});writeOutfits(list);renderSaved();
 toast('Referência de look salva neste navegador.');
});

// Cinematic sequence: three designed editorial frames. No claim of real footage.
const film=one('#filmModal');let playing=false,filmIndex=0,frameStart=0,frameRequest=0;
const chapters=[
  {head:'A MARCA É<br>QUEM VESTE.',sub:'Toda escolha conta uma história. Você é quem escreve a próxima.',p:PRODUCTS[1]},
  {head:'O VISUAL<br>É <i>SEU.</i>',sub:'Não importa o roteiro. Importa como você entra em cena.',p:PRODUCTS[7]},
  {head:'DA RUA<br>PRO <i>MUNDO.</i>',sub:'A GB continua perto. Agora, em uma experiência pensada para cada tela.',p:PRODUCTS[4]},
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
