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

// A fast commerce entry layered over the editorial flagship.
many('[data-v03-filter]').forEach(button=>button.addEventListener('click',()=>{
  selectFilter(button.dataset.v03Filter);
  one('#colecao').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
}));
one('#shopFavorites')?.addEventListener('click',()=>one('#wishlistOpen').click());
one('#mobileSaved')?.addEventListener('click',()=>one('#wishlistOpen').click());
one('#mobileBag')?.addEventListener('click',()=>one('#bagOpen').click());

// The digital styling studio does not represent a real purchasable kit.
let selectedTop=PRODUCTS[1].id;
let selectedBottom=PRODUCTS[7].id;
const MAX_OPTIONS=14;
function renderStudio(){
 const top=getItem(selectedTop),bottom=getItem(selectedBottom);
 one('#lookPreviewTop').innerHTML=productMedia(top,'top');
 one('#lookPreviewBottom').innerHTML=productMedia(bottom,'bottom');
 one('#lookSummary').textContent=top.name+' (superior)  +  '+bottom.name+' (inferior)';
 for(const [id,selected,mode] of [['lookTops',selectedTop,'top'],['lookBottoms',selectedBottom,'bottom']]){
   one('#'+id).innerHTML=PRODUCTS.slice(0,MAX_OPTIONS).map((p,i)=>`<button class="look-option ${p.id===selected?'active':''}" data-look-mode="${mode}" data-look-id="${p.id}" aria-pressed="${p.id===selected}" title="${escaped(p.name)}" aria-label="${escaped(p.name)} / ${mode==='top'?'parte superior':'parte inferior'}"><span class="look-index">${String(i+1).padStart(2,'0')}</span>${productMedia(p,mode)}</button>`).join('');
 }
}
renderStudio();
for(const id of ['lookTops','lookBottoms'])one('#'+id)?.addEventListener('click',e=>{
 const btn=e.target.closest('[data-look-id]'); if(!btn)return;
 if(btn.dataset.lookMode==='top')selectedTop=btn.dataset.lookId;else selectedBottom=btn.dataset.lookId;
 renderStudio();
});
one('#lookSave')?.addEventListener('click',()=>{
 const value={top:selectedTop,bottom:selectedBottom,createdAt:new Date().toISOString()};
 let saved=[];try{saved=JSON.parse(localStorage.getItem('gb-v03-outfits'))||[];if(!Array.isArray(saved))saved=[];}catch{}
 saved.unshift(value);saved=saved.slice(0,10);
 try{localStorage.setItem('gb-v03-outfits',JSON.stringify(saved));}catch{}
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
