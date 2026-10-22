/** GB IMPORTS V04 / INTERACTIVE REFERENCE TRANSLATION
 *  Nine videos -> original interaction principles, not copied branding / layout / footage.
 *  Dedicated rAF updates only on direct interaction. No scroll-linked canvas / autoplay video.
 */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
if(typeof PRODUCTS==='undefined'||typeof productMedia==='undefined')return;
const items=PRODUCTS;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=i=>String(i+1).padStart(2,'0');
const introDone=()=>document.body.classList.add('v04-ready');
requestAnimationFrame(introDone);
// V04 hero - three actual V03 illustrated items: no pretending this is photography.
const ghosts=[q('#heroGhostA'),q('#heroGhostB')];
function updateGhosts(){
  const i=typeof heroIndex==='number'?heroIndex:0;
  ghosts[0].innerHTML=productMedia(items[[7,1,4][i]],'top');
  ghosts[1].innerHTML=productMedia(items[[3,6,0][i]],'top');
}
updateGhosts();
q('#heroPrev')?.addEventListener('click',()=>setTimeout(updateGhosts,185));
q('#heroNext')?.addEventListener('click',()=>setTimeout(updateGhosts,185));

// THE RAIL: no costly per-frame React state or heavy 3D scene.
const railItems=items.slice(0,8);
let railPos=2, isDragging=false, pointerStart=0, pointerCurrent=0, initialPos=0, railGesture=false;
const railViewport=q('#railViewport'), railTrack=q('#railItems');
function railOffset(idx){const delta=idx-railPos;const a=Math.abs(delta);
  return {x:delta*min(226,innerWidth*.25),scale:Math.max(.65,1-a*.13),rotation:delta*4,y:a*19,opacity:a>3?.12:a>2?.4:1,z:20-a};
}
function min(a,b){return Math.min(a,b)}
function renderRail(){
  railTrack.innerHTML=railItems.map((p,i)=>{
    const d=railOffset(i);return `<button class="rail-card ${i===railPos?'is-active':''}" type="button" data-rail-item="${i}" tabindex="${i===railPos?'0':'-1'}" aria-label="${escaped(p.name)}, ${i+1} de ${railItems.length}" style="--x:${d.x}px;--s:${d.scale};--rot:${d.rotation}deg;--y:${d.y}px;--op:${d.opacity};--z:${d.z}"><span class="rail-hanger" aria-hidden="true"><svg viewBox="0 0 100 55"><path d="M48 16a9 9 0 1 1 9 9c-8 4-15 9-39 23-4 3-2 5 2 5h61c4 0 6-2 2-5L56 27"/></svg></span><span class="rail-media">${productMedia(p,'top')}</span><span class="rail-card-index">${fmt(i)} / GB EDIT</span></button>`;
  }).join('');
  q('#railCounter').textContent=`${fmt(railPos)} / ${fmt(railItems.length-1)}`;
  q('#railFocusIndex').textContent=fmt(railPos);
  q('#railFocusName').textContent=railItems[railPos].name.toUpperCase();
  q('#railFocusType').textContent=railItems[railPos].label.toUpperCase();
}
function navigateRail(i){railPos=Math.max(0,Math.min(railItems.length-1,i));renderRail()}
renderRail();
q('#railPrev')?.addEventListener('click',()=>navigateRail(railPos-1));
q('#railNext')?.addEventListener('click',()=>navigateRail(railPos+1));
railTrack.addEventListener('click',e=>{const b=e.target.closest('[data-rail-item]');if(!b||railGesture)return;const i=+b.dataset.railItem;if(i===railPos)openRailViewer();else navigateRail(i)});
railViewport.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();navigateRail(railPos+1)}if(e.key==='ArrowLeft'){e.preventDefault();navigateRail(railPos-1)}if(e.key==='Enter'){e.preventDefault();openRailViewer()}});
// Pointer event gesture; capture only after drag threshold. Native vertical page scroll retained on touch.
railViewport.addEventListener('pointerdown',e=>{if(e.target.closest('button.rail-controls'))return;isDragging=true;pointerStart=e.clientX;pointerCurrent=e.clientX;initialPos=railPos;railGesture=false;});
railViewport.addEventListener('pointermove',e=>{if(!isDragging)return;pointerCurrent=e.clientX;if(Math.abs(pointerCurrent-pointerStart)>22)railGesture=true;},{passive:true});
const endRail=()=>{if(!isDragging)return;isDragging=false;const diff=pointerCurrent-pointerStart;if(Math.abs(diff)>42)navigateRail(initialPos+(diff<0?1:-1));setTimeout(()=>{railGesture=false},50)};
railViewport.addEventListener('pointerup',endRail);railViewport.addEventListener('pointercancel',()=>{isDragging=false;railGesture=false});
q('#railExplore')?.addEventListener('click',openRailViewer);

// VIEWER: isolated fullscreen focus with view selector, then validated V03 product modal.
const viewer=q('#railViewer');let viewerMode='combo';let previousFocus=null;
function drawViewer(){const p=railItems[railPos];q('#railViewerMedia').innerHTML=productMedia(p,viewerMode);q('#railViewerName').textContent=p.name.toUpperCase();q('#railViewerIndex').textContent=fmt(railPos);q('#railViewerDescription').textContent=`${p.label}. Ilustração conceitual até a entrada das fotos oficiais da GB.`;qa('[data-rail-view]').forEach(b=>{b.classList.toggle('selected',b.dataset.railView===viewerMode);b.setAttribute('aria-pressed',String(b.dataset.railView===viewerMode))})}
function openRailViewer(){
  if(typeof closeAll==='function')closeAll(false);
  previousFocus=document.activeElement;viewerMode='combo';drawViewer();viewer.hidden=false;document.body.classList.add('no-scroll');q('#railViewerClose').focus();
}
function closeRailViewer(){viewer.hidden=true;document.body.classList.remove('no-scroll');previousFocus?.focus?.()}
q('#railViewerClose')?.addEventListener('click',closeRailViewer);
qa('[data-rail-view]').forEach(b=>b.addEventListener('click',()=>{viewerMode=b.dataset.railView;drawViewer()}));
q('#railViewerProduct')?.addEventListener('click',()=>{const p=railItems[railPos];closeRailViewer();detailModal(p)});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!viewer.hidden){e.preventDefault();e.stopImmediatePropagation();closeRailViewer();return;}
 if(e.key!=='Tab')return;
 // Visible dialogue focus loop across the flagship (rail, film, product, existing drawers).
 const active=[viewer,q('#filmModal'),q('#productModal'),...qa('.drawer')].find(el=>el&&!el.hidden);
 if(!active)return;
 const nodes=qa('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',active).filter(el=>!el.disabled && el.getClientRects().length>0);
 if(!nodes.length)return;
 const first=nodes[0],last=nodes.at(-1);
 if(e.shiftKey && (document.activeElement===first || !active.contains(document.activeElement))){e.preventDefault();last.focus()}
 else if(!e.shiftKey && (document.activeElement===last || !active.contains(document.activeElement))){e.preventDefault();first.focus()}
},true);

// SHOWROOM: dark catalog with central object. No untrusted remote API calls.
let showPos=0;const six=[items[4],items[1],items[7],items[3],items[8],items[0]];
function selectShowroom(i){showPos=i;const p=six[i];const m=q('#showroomFeatureMedia');m.classList.remove('in');m.innerHTML=productMedia(p,'top');q('#showroomFeatureNum').textContent=fmt(i);q('#showroomFeatureName').textContent=p.name.toUpperCase();qa('[data-show-index]').forEach(b=>{const active=+b.dataset.showIndex===showPos;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});requestAnimationFrame(()=>m.classList.add('in'))}
q('#showroomGrid').innerHTML=six.map((p,i)=>`<button type="button" data-show-index="${i}" class="showroom-small" aria-label="Selecionar ${escaped(p.name)}"><span class="showroom-small-media">${productMedia(p,'top')}</span><span>${fmt(i)} / ${escaped(p.name)}</span></button>`).join('');
q('#showroomSelector').innerHTML=six.map((p,i)=>`<button type="button" data-show-index="${i}"><span>${fmt(i)}</span>${escaped(p.name)}</button>`).join('');
q('#showroom').addEventListener('click',e=>{const b=e.target.closest('[data-show-index]');if(b)selectShowroom(+b.dataset.showIndex)});
q('#showroomOpen').addEventListener('click',()=>detailModal(six[showPos]));selectShowroom(0);

// CHROMATIC: color transition is speculative graphic simulation, never a purchasable variant.
const palettes=[{name:'CARVÃO',top:'#222428',accent:'#a3a4a0',bottom:'#222428'}, {name:'CERÂMICA',top:'#e7e1d2',accent:'#bdb6a1',bottom:'#e7e1d2'}, {name:'ELÉTRICO',top:'#3659bd',accent:'#869dec',bottom:'#3659bd'}, {name:'ARGILA',top:'#a4432c',accent:'#e99a63',bottom:'#a4432c'}];
let colorPos=0;const colorBase={...items[0],model:'jacket'};
q('#colorlabSwatches').innerHTML=palettes.map((p,i)=>`<button type="button" data-color-index="${i}" style="--swatch:${p.top}" title="Simulação ${p.name}" aria-label="Simulação de cor ${p.name}"><span></span></button>`).join('');
function paintColor(i){colorPos=i;const p=palettes[i];q('#colorlabMedia').innerHTML=productMedia({...colorBase,top:p.top,accent:p.accent,bottom:p.bottom,stripe:p.accent},'top');q('#colorlabColorName').textContent=`${fmt(i)} / ${p.name}`;q('#colorlabCounter').textContent=`${fmt(i)} — 04`;q('#colorlabAura').style.setProperty('--aura',p.top);qa('[data-color-index]').forEach(b=>{b.classList.toggle('active',+b.dataset.colorIndex===i);b.setAttribute('aria-pressed',String(+b.dataset.colorIndex===i))})}
q('#colorlabSwatches').addEventListener('click',e=>{let b=e.target.closest('[data-color-index]');if(b)paintColor(+b.dataset.colorIndex)});paintColor(0);

// Progressive enhancements: section reveal and hover/scroll lightweight, respect motion preferences.
if(!reduced&&'IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('v04-in');obs.unobserve(x.target)}})},{threshold:.12});qa('.rail-title-row,.showroom-heading,.colorlab-copy,.editorial-break-hero').forEach(x=>{x.classList.add('v04-reveal');obs.observe(x)})}
})();
