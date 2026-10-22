/** GB IMPORTS V04 → V06 / INTERACTIVE REFERENCE TRANSLATION
 *  Nine videos -> original interaction principles, not copied branding / layout / footage.
 *  rAF só durante gesto ou acomodação da arara; nenhum loop ocioso, nenhum vídeo em autoplay.
 */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
if(typeof PRODUCTS==='undefined'||typeof productMedia==='undefined')return;
const items=PRODUCTS;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=i=>String(i+1).padStart(2,'0');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
requestAnimationFrame(()=>document.body.classList.add('v04-ready'));

// HERO - peças secundárias em profundidade acompanham o capítulo ativo.
const ghosts=[q('#heroGhostA'),q('#heroGhostB')];
function updateGhosts(){
  const i=typeof heroIndex==='number'?heroIndex:0;
  ghosts[0].innerHTML=productMedia(items[[7,1,4][i]],'top');
  ghosts[1].innerHTML=productMedia(items[[3,6,0][i]],'top');
}
updateGhosts();
document.addEventListener('gb:hero',updateGhosts);

/* ---------- GB RAIL: arara física. DOM persistente, posição contínua, mola + balanço do cabide. ---------- */
const railViewport=q('#railViewport'), railTrack=q('#railItems');
const railSource={all:items.filter(p=>!p.single),track:items.filter(p=>p.category==='track'),short:items.filter(p=>p.category==='short')};
let railItems=railSource.all, cards=[];
let target=2, pos=2, vel=0, swing=0, swingVel=0, raf=0, last=0;
let drag=null, suppressClick=false, wheelTimer=0;
const step=()=>Math.min(230,Math.max(118,innerWidth*.24));
function buildRail(){
  railTrack.innerHTML=railItems.map((p,i)=>`<button class="rail-card" type="button" data-rail-item="${i}" tabindex="-1" aria-label="${escaped(p.name)}, ${i+1} de ${railItems.length}"><span class="rail-hanger" aria-hidden="true"><svg viewBox="0 0 100 55"><path d="M48 16a9 9 0 1 1 9 9c-8 4-15 9-39 23-4 3-2 5 2 5h61c4 0 6-2 2-5L56 27"/></svg></span><span class="rail-media">${productMedia(p,'top')}</span><span class="rail-card-index">${fmt(i)} / ${escaped(p.label.toUpperCase())}</span></button>`).join('');
  cards=qa('.rail-card',railTrack);
}
function layout(){
  const s=step();
  cards.forEach((card,i)=>{
    const d=i-pos,a=Math.abs(d);
    const scale=Math.max(.6,1-a*.14), y=a*18, op=clamp(1.35-a*.34,0,1);
    const rot=d*3.2+swing*(1-Math.min(a,3)*.18);
    card.style.transform=`translate3d(${(d*s).toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    card.style.opacity=op.toFixed(3);
    card.style.zIndex=String(100-Math.round(a*10));
    card.style.visibility=op<.02?'hidden':'visible';
  });
}
function updateInfo(){
  const p=railItems[target];
  cards.forEach((c,i)=>{const on=i===target;c.classList.toggle('is-active',on);c.tabIndex=on?0:-1;c.setAttribute('aria-current',on?'true':'false')});
  q('#railCounter').textContent=`${fmt(target)} / ${fmt(railItems.length-1)}`;
  q('#railFocusIndex').textContent=fmt(target);
  q('#railFocusName').textContent=p.name.toUpperCase();
  q('#railFocusType').textContent=p.label.toUpperCase();
  const bar=q('#railProgress');if(bar)bar.style.transform=`scaleX(${(target+1)/railItems.length})`;
}
function tick(t){
  const dt=Math.min(.034,(t-(last||t))/1000)||.016;last=t;
  if(!drag){const k=150,c=2*Math.sqrt(k)*.92;vel+=((target-pos)*k-vel*c)*dt;pos+=vel*dt}
  // o cabide atrasa em relação ao movimento e volta com amortecimento, como peça pendurada
  const desired=clamp(-vel*5.5,-16,16);swingVel+=((desired-swing)*95-swingVel*7)*dt;swing+=swingVel*dt;
  layout();
  const settled=!drag&&Math.abs(target-pos)<.002&&Math.abs(vel)<.005&&Math.abs(swing)<.03&&Math.abs(swingVel)<.05;
  if(settled){pos=target;vel=0;swing=0;swingVel=0;layout();raf=0;last=0;return}
  raf=requestAnimationFrame(tick);
}
function kick(){if(reduced){pos=target;vel=0;swing=0;layout();return}if(!raf){last=0;raf=requestAnimationFrame(tick)}}
function navigateRail(i){const n=clamp(i,0,railItems.length-1);if(n===target&&!drag){if(i!==n){vel+= (i>n?1:-1)*1.2;kick()}return}target=n;updateInfo();kick()}
function setRailFilter(f){railItems=railSource[f]||railSource.all;buildRail();target=pos=Math.min(2,railItems.length-1);vel=0;layout();updateInfo();
  qa('[data-rail-filter]').forEach(b=>{const on=b.dataset.railFilter===f;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});}
buildRail();layout();updateInfo();
q('#railPrev')?.addEventListener('click',()=>navigateRail(target-1));
q('#railNext')?.addEventListener('click',()=>navigateRail(target+1));
qa('[data-rail-filter]').forEach(b=>b.addEventListener('click',()=>setRailFilter(b.dataset.railFilter)));
railTrack.addEventListener('click',e=>{const b=e.target.closest('[data-rail-item]');if(!b||suppressClick)return;const i=+b.dataset.railItem;if(i===target)openRailViewer();else navigateRail(i)});
railViewport.addEventListener('keydown',e=>{
  const map={ArrowRight:1,ArrowLeft:-1};
  if(map[e.key]){e.preventDefault();navigateRail(target+map[e.key])}
  if(e.key==='Home'){e.preventDefault();navigateRail(0)}
  if(e.key==='End'){e.preventDefault();navigateRail(railItems.length-1)}
  if(e.key==='Enter'&&e.target===railViewport){e.preventDefault();openRailViewer()}
});
// Arrasto contínuo: a arara acompanha o dedo; scroll vertical da página continua nativo (touch-action: pan-y).
railViewport.addEventListener('pointerdown',e=>{if(e.button>0||e.target.closest('.rail-controls,.rail-chips'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:pos,active:false,lastX:e.clientX,lastT:performance.now(),v:0};suppressClick=false});
railViewport.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  if(!drag.active){if(Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){drag.active=true;suppressClick=true;railViewport.setPointerCapture?.(e.pointerId);railViewport.classList.add('is-dragging');kick()}else return}
  const now=performance.now(),s=step();
  let p=drag.start-dx/s;const max=railItems.length-1;
  if(p<0)p=p*.32;else if(p>max)p=max+(p-max)*.32;
  const instV=-(e.clientX-drag.lastX)/s/Math.max(.008,(now-drag.lastT)/1000);
  drag.v=drag.v*.6+instV*.4;vel=drag.v;drag.lastX=e.clientX;drag.lastT=now;pos=p;
  if(reduced)layout();
});
const endDrag=e=>{
  if(!drag||(e&&e.pointerId!==drag.id))return;
  const wasActive=drag.active,v=drag.v;drag=null;railViewport.classList.remove('is-dragging');
  if(wasActive){target=clamp(Math.round(pos+clamp(v*.18,-1.6,1.6)),0,railItems.length-1);updateInfo();kick();setTimeout(()=>{suppressClick=false},60)}
};
railViewport.addEventListener('pointerup',endDrag);railViewport.addEventListener('pointercancel',endDrag);railViewport.addEventListener('lostpointercapture',endDrag);
// Trackpad / roda horizontal
railViewport.addEventListener('wheel',e=>{
  if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<2)return;
  e.preventDefault();const max=railItems.length-1;
  pos=clamp(pos+e.deltaX/step()*.9,-.35,max+.35);vel=e.deltaX/step()*12;kick();
  clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{target=clamp(Math.round(pos),0,max);updateInfo();kick()},90);
},{passive:false});
addEventListener('resize',()=>layout(),{passive:true});
q('#railExplore')?.addEventListener('click',openRailViewer);

// VIEWER: foco em tela cheia com vistas e navegação, depois o detalhe oficial do produto.
const viewer=q('#railViewer');let viewerMode='combo';let previousFocus=null;
function drawViewer(dir=0){
  const p=railItems[target],views=availableViews(p);if(!views.includes(viewerMode))viewerMode=views[0];
  const media=q('#railViewerMedia');media.innerHTML=productMedia(p,viewerMode);
  if(dir&&!reduced){media.classList.remove('viewer-in');void media.offsetWidth;media.style.setProperty('--dir',dir);media.classList.add('viewer-in')}
  q('#railViewerName').textContent=p.name.toUpperCase();q('#railViewerIndex').textContent=`${fmt(target)} / ${fmt(railItems.length-1)}`;
  q('#railViewerDescription').textContent=`${p.label}. ${hasPhoto(p)?'Foto real do acervo; dados comerciais em validação.':'Ilustração de estudo até a entrada das fotos oficiais da GB.'}`;
  q('.rail-viewer-art-label').textContent=hasPhoto(p)?'FOTO REAL / CADASTRO EM REVISÃO':'ARQUIVO DE ESTUDO / CATÁLOGO EM CONSTRUÇÃO';
  qa('[data-rail-view]').forEach(b=>{b.hidden=!views.includes(b.dataset.railView);b.classList.toggle('selected',b.dataset.railView===viewerMode);b.setAttribute('aria-pressed',String(b.dataset.railView===viewerMode))});
}
function openRailViewer(){
  if(typeof closeAll==='function')closeAll(false);
  previousFocus=document.activeElement;viewerMode='combo';drawViewer();viewer.hidden=false;document.body.classList.add('no-scroll');q('#railViewerClose').focus();
}
function closeRailViewer(){viewer.hidden=true;document.body.classList.remove('no-scroll');previousFocus?.focus?.({preventScroll:true})}
function viewerStep(d){navigateRail(target+d);drawViewer(d)}
q('#railViewerClose')?.addEventListener('click',closeRailViewer);
q('#railViewerPrev')?.addEventListener('click',()=>viewerStep(-1));
q('#railViewerNext')?.addEventListener('click',()=>viewerStep(1));
qa('[data-rail-view]').forEach(b=>b.addEventListener('click',()=>{viewerMode=b.dataset.railView;drawViewer()}));
q('#railViewerProduct')?.addEventListener('click',()=>{const p=railItems[target];closeRailViewer();detailModal(p)});
let vx=0,vy=0;viewer.addEventListener('touchstart',e=>{vx=e.touches[0].clientX;vy=e.touches[0].clientY},{passive:true});
viewer.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-vx,dy=e.changedTouches[0].clientY-vy;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3)viewerStep(dx<0?1:-1)},{passive:true});
document.addEventListener('keydown',e=>{
 if(!viewer.hidden){
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeRailViewer();return;}
  if(e.key==='ArrowRight'){e.preventDefault();viewerStep(1);return}
  if(e.key==='ArrowLeft'){e.preventDefault();viewerStep(-1);return}
 }
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

/* ---------- NIGHT SHOWROOM: palco duplo (crossfade sem flash), luz que segue o gesto, teclado. ---------- */
let showPos=0,showView='top',layerFlip=false;const six=[items[4],items[1],items[7],items[3],items[8],items[0]];
const featureMedia=q('#showroomFeatureMedia');featureMedia.innerHTML='<div class="sf-layer"></div><div class="sf-layer"></div>';
const layers=qa('.sf-layer',featureMedia);
function selectShowroom(i,focus=false){
  const prev=showPos;showPos=(i+six.length)%six.length;const p=six[showPos];
  const next=layers[layerFlip?0:1],cur=layers[layerFlip?1:0];layerFlip=!layerFlip;
  next.innerHTML=productMedia(p,showView);next.style.setProperty('--dir',showPos>=prev?1:-1);
  cur.classList.remove('is-on');next.classList.add('is-on');
  q('#showroomFeatureNum').textContent=fmt(showPos);q('#showroomFeatureName').textContent=p.name.toUpperCase();
  qa('[data-show-index]').forEach(b=>{const active=+b.dataset.showIndex===showPos;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  if(focus)q(`.showroom-selector [data-show-index="${showPos}"]`)?.focus();
}
q('#showroomGrid').innerHTML=six.map((p,i)=>`<button type="button" data-show-index="${i}" class="showroom-small" aria-label="Selecionar ${escaped(p.name)}"><span class="showroom-small-media">${productMedia(p,'top')}</span><span>${fmt(i)} / ${escaped(p.name)}</span></button>`).join('');
q('#showroomSelector').innerHTML=six.map((p,i)=>`<button type="button" data-show-index="${i}"><span>${fmt(i)}</span>${escaped(p.name)}</button>`).join('');
q('#showroom').addEventListener('click',e=>{const b=e.target.closest('[data-show-index]');if(b)selectShowroom(+b.dataset.showIndex);const v=e.target.closest('[data-show-view]');if(v){showView=v.dataset.showView;qa('[data-show-view]').forEach(x=>{const on=x===v;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on))});selectShowroom(showPos)}});
q('#showroomSelector').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();selectShowroom(showPos+1,true)}if(e.key==='ArrowUp'){e.preventDefault();selectShowroom(showPos-1,true)}});
q('#showroomOpen').addEventListener('click',()=>detailModal(six[showPos]));
q('.showroom-feature')?.addEventListener('click',e=>{if(e.target.closest('.sf-layer'))detailModal(six[showPos])});
selectShowroom(0);
const feature=q('.showroom-feature');
if(feature&&!reduced&&matchMedia('(pointer:fine)').matches){let pend=false,lx=50,ly=40;feature.addEventListener('pointermove',e=>{const r=feature.getBoundingClientRect();lx=(e.clientX-r.left)/r.width*100;ly=(e.clientY-r.top)/r.height*100;if(pend)return;pend=true;requestAnimationFrame(()=>{feature.style.setProperty('--lx',lx.toFixed(1)+'%');feature.style.setProperty('--ly',ly.toFixed(1)+'%');pend=false})},{passive:true});feature.addEventListener('pointerleave',()=>{feature.style.setProperty('--lx','50%');feature.style.setProperty('--ly','42%')})}
// Luz acende uma vez quando o showroom entra na tela.
if('IntersectionObserver'in window){const sr=q('#showroom');const lio=new IntersectionObserver(en=>{if(en[0].isIntersecting){sr.classList.add('is-lit');lio.disconnect()}},{threshold:.25});lio.observe(sr)}else q('#showroom').classList.add('is-lit');

// CHROMATIC: simulação gráfica de cor, nunca uma variante comprável.
const palettes=[{name:'CARVÃO',top:'#222428',accent:'#a3a4a0',bottom:'#222428'}, {name:'CERÂMICA',top:'#e7e1d2',accent:'#bdb6a1',bottom:'#e7e1d2'}, {name:'ELÉTRICO',top:'#3659bd',accent:'#869dec',bottom:'#3659bd'}, {name:'ARGILA',top:'#a4432c',accent:'#e99a63',bottom:'#a4432c'}];
let colorPos=0;const colorBase={...items[0],model:'jacket'};
q('#colorlabSwatches').innerHTML=palettes.map((p,i)=>`<button type="button" data-color-index="${i}" style="--swatch:${p.top}" title="Simulação ${p.name}" aria-label="Simulação de cor ${p.name}"><span></span></button>`).join('');
function paintColor(i){colorPos=i;const p=palettes[i];const m=q('#colorlabMedia');m.innerHTML=garmentSVG({...colorBase,top:p.top,accent:p.accent,bottom:p.bottom,stripe:p.accent},'top');if(!reduced){m.classList.remove('is-swap');void m.offsetWidth;m.classList.add('is-swap')}q('#colorlabColorName').textContent=`${fmt(i)} / ${p.name}`;q('#colorlabCounter').textContent=`${fmt(i)} — 04`;q('#colorlabAura').style.setProperty('--aura',p.top);qa('[data-color-index]').forEach(b=>{b.classList.toggle('active',+b.dataset.colorIndex===i);b.setAttribute('aria-pressed',String(+b.dataset.colorIndex===i))})}
q('#colorlabSwatches').addEventListener('click',e=>{let b=e.target.closest('[data-color-index]');if(b)paintColor(+b.dataset.colorIndex)});paintColor(0);

// Revelação progressiva leve, respeita movimento reduzido.
if(!reduced&&'IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('v04-in');obs.unobserve(x.target)}})},{threshold:.12});qa('.rail-title-row,.showroom-heading,.colorlab-copy,.editorial-break-hero').forEach(x=>{x.classList.add('v04-reveal');obs.observe(x)})}
})();
