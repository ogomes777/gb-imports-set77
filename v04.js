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

/* ---------- GB RAIL: barra em catenária, mola de posição + mola do cabide, gesto 1:1 ---------- */
const railViewport=q('#railViewport'), railTrack=q('#railItems');
const railSource={all:items.filter(p=>!p.single),track:items.filter(p=>p.category==='track'),short:items.filter(p=>p.category==='short')};
let railItems=railSource.all, cards=[];
const pos=new M.Spring(2,M.Tokens.spring.object), swing=new M.Spring(0,M.Tokens.spring.hanger);
let target=2, running=false, dragging=false, dragStart=0, wheelTimer=0, vw=railViewport.clientWidth;
const mobile=()=>innerWidth<600;
const step=()=>mobile()?Math.max(150,innerWidth*.56):Math.min(230,Math.max(118,innerWidth*.24));
// curva da barra: flecha no centro, ganchos acompanham
const sagPx=()=>Math.min(26,vw*.02);
const barY=x=>{const h=vw*.47;const t=clamp(x/h,-1.2,1.2);return sagPx()*(1-t*t)};
function buildRail(){
  railTrack.innerHTML=railItems.map((p,i)=>`<button class="rail-card" type="button" data-rail-item="${i}" tabindex="-1" aria-label="${escaped(p.name)} — ${fmt(i)} / ${escaped(p.label.toUpperCase())}, ${i+1} de ${railItems.length}"><span class="rail-hanger" aria-hidden="true"><svg viewBox="0 0 100 55"><path d="M48 16a9 9 0 1 1 9 9c-8 4-15 9-39 23-4 3-2 5 2 5h61c4 0 6-2 2-5L56 27"/></svg></span><span class="rail-media">${productMedia(p,'top')}</span><span class="rail-card-index">${fmt(i)} / ${escaped(p.label.toUpperCase())}</span></button>`).join('');
  cards=qa('.rail-card',railTrack);
}
// barra desenhada como parábola (Bézier quadrática simétrica): mesma curva usada pelos ganchos
function drawBar(){
  const svg=q('#railBar');if(!svg)return;const hs=svg.clientHeight||60,u=sagPx()/hs*100;
  // ancora a barra na altura real dos ganchos (o CSS de cada largura posiciona os cards) e deixa o gancho abraçar o metal
  if(cards[0])svg.style.top=(cards[0].offsetTop-hs*.08+7)+'px';
  svg.querySelectorAll('path').forEach(p=>p.setAttribute('d',`M0 8 Q500 ${(8+2*u).toFixed(2)} 1000 8`));
}
function layout(){
  const s=step(),p=pos.x,sw=swing.x,m=mobile();
  cards.forEach((card,i)=>{
    const d=i-p,a=Math.abs(d),x=d*s;
    const scale=Math.max(m?.68:.6,1-a*(m?.2:.14)), op=clamp(1.35-a*(m?.45:.34),0,1);
    const rot=d*(m?2:3.2)+sw*(1-Math.min(a,3)*.18);
    card.style.transform=`translate3d(${x.toFixed(1)}px,${barY(x).toFixed(1)}px,0) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    card.style.opacity=op.toFixed(3);card.style.zIndex=String(100-Math.round(a*10));
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
function loop(dt){
  if(!dragging)pos.step(dt);
  swing.set(clamp(-pos.v*5.5,-16,16));swing.step(dt);layout();
  if(!dragging&&pos.settled&&Math.abs(swing.x)<.03&&Math.abs(swing.v)<.05){pos.jump(target);swing.jump(0);layout();running=false;railTrack.classList.remove('is-moving');return false}
}
function kick(){if(reduced){pos.jump(target);swing.jump(0);layout();return}if(!running){running=true;railTrack.classList.add('is-moving');M.Ticker.add(loop)}}
function navigateRail(i){const n=clamp(i,0,railItems.length-1);if(n===target){if(i!==n){pos.v+=(i>n?1:-1)*1.2;kick()}return}target=n;pos.set(n);updateInfo();kick()}
function setRailFilter(f){railItems=railSource[f]||railSource.all;buildRail();target=Math.min(2,railItems.length-1);pos.jump(target);swing.jump(0);layout();updateInfo();
  qa('[data-rail-filter]').forEach(b=>{const on=b.dataset.railFilter===f;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});}
buildRail();drawBar();layout();updateInfo();
q('#railPrev')?.addEventListener('click',()=>navigateRail(target-1));
q('#railNext')?.addEventListener('click',()=>navigateRail(target+1));
qa('[data-rail-filter]').forEach(b=>b.addEventListener('click',()=>setRailFilter(b.dataset.railFilter)));
railTrack.addEventListener('click',e=>{const b=e.target.closest('[data-rail-item]');if(!b)return;const i=+b.dataset.railItem;if(i===target)openRailViewer();else navigateRail(i)});
railViewport.addEventListener('keydown',e=>{
  const map={ArrowRight:1,ArrowLeft:-1};
  if(map[e.key]){e.preventDefault();navigateRail(target+map[e.key])}
  if(e.key==='Home'){e.preventDefault();navigateRail(0)}
  if(e.key==='End'){e.preventDefault();navigateRail(railItems.length-1)}
  if(e.key==='Enter'&&e.target===railViewport){e.preventDefault();openRailViewer()}
});
// Arrasto: a arara acompanha o dedo 1:1; ao soltar, inércia curta com fricção e acomodação na peça mais próxima.
M.drag(railViewport,{axis:'x',ignore:'.rail-controls,.rail-chips',
  onStart(){dragging=true;dragStart=pos.x;kick()},
  onMove(dx){const max=railItems.length-1;let p=dragStart-dx/step();if(p<0)p*=.32;else if(p>max)p=max+(p-max)*.32;pos.v=(p-pos.x)*60;pos.x=p;pos.target=p;if(reduced)layout()},
  onEnd(v){dragging=false;const proj=pos.x-clamp(v/step()*.16,-1.6,1.6);target=clamp(Math.round(proj),0,railItems.length-1);pos.set(target);pos.v=-v/step()*.35;updateInfo();kick()}
});
railViewport.addEventListener('wheel',e=>{
  if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<2)return;
  e.preventDefault();const max=railItems.length-1;
  pos.x=clamp(pos.x+e.deltaX/step()*.9,-.35,max+.35);pos.target=pos.x;pos.v=e.deltaX/step()*12;kick();
  clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{target=clamp(Math.round(pos.x),0,max);pos.set(target);updateInfo();kick()},90);
},{passive:false});
let rz=0;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{vw=railViewport.clientWidth;drawBar();layout()},80)},{passive:true});
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
  previousFocus=document.activeElement;viewerMode='combo';drawViewer();viewer.hidden=false;document.body.classList.add('no-scroll');
  const from=cards[target]?.querySelector('.rail-media'),to=q('#railViewerMedia .garment-svg');if(from&&to&&M)M.flipClone(from,to,{duration:M.Tokens.dur.normal+120});
  q('#railViewerClose').focus();
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

/* ---------- NIGHT SHOWROOM: palco duplo em perspectiva, luz amortecida, prévia por intenção ---------- */
let showPos=0,showView='top',layerFlip=false;const six=[items[4],items[1],items[7],items[3],items[8],items[0]];
const featureMedia=q('#showroomFeatureMedia');featureMedia.innerHTML='<div class="sf-layer"></div><div class="sf-layer"></div>';
const layers=qa('.sf-layer',featureMedia);
function selectShowroom(i,focus=false,force=false){
  const prev=showPos,next=(i+six.length)%six.length;if(next===prev&&!force&&layers.some(l=>l.classList.contains('is-on')))return;
  showPos=next;const p=six[showPos],dir=showPos>=prev?1:-1;
  const inL=layers[layerFlip?0:1],outL=layers[layerFlip?1:0];layerFlip=!layerFlip;
  inL.innerHTML=productMedia(p,showView);inL.style.setProperty('--dir',dir);outL.style.setProperty('--dir',dir);
  outL.classList.remove('is-on');outL.classList.add('is-off');inL.classList.remove('is-off');
  void inL.offsetWidth;inL.classList.add('is-on');
  q('#showroomFeatureNum').textContent=fmt(showPos);q('#showroomFeatureName').textContent=p.name.toUpperCase();
  qa('[data-show-index]').forEach(b=>{const active=+b.dataset.showIndex===showPos;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
  if(focus)q(`.showroom-selector [data-show-index="${showPos}"]`)?.focus();
}
q('#showroomGrid').innerHTML=six.map((p,i)=>`<button type="button" data-show-index="${i}" class="showroom-small"><span class="showroom-small-media" aria-hidden="true">${productMedia(p,'top')}</span><span>${fmt(i)} / ${escaped(p.name)}</span></button>`).join('');
q('#showroomSelector').innerHTML=six.map((p,i)=>`<button type="button" data-show-index="${i}"><span>${fmt(i)}</span>${escaped(p.name)}</button>`).join('');
q('#showroom').addEventListener('click',e=>{const b=e.target.closest('[data-show-index]');if(b)selectShowroom(+b.dataset.showIndex);const v=e.target.closest('[data-show-view]');if(v){showView=v.dataset.showView;qa('[data-show-view]').forEach(x=>{const on=x===v;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on))});selectShowroom(showPos,false,true)}});
q('#showroomSelector').addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();selectShowroom(showPos+1,true)}if(e.key==='ArrowUp'){e.preventDefault();selectShowroom(showPos-1,true)}});
q('#showroomOpen').addEventListener('click',()=>detailModal(six[showPos]));
q('.showroom-feature')?.addEventListener('click',e=>{const l=e.target.closest('.sf-layer.is-on');if(l)detailModal(six[showPos],{transition:l.querySelector('.garment-svg')})});
selectShowroom(0,false,true);
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
const palettes=[{name:'CARVÃO',top:'#222428',accent:'#a3a4a0',bottom:'#222428'}, {name:'CERÂMICA',top:'#e7e1d2',accent:'#bdb6a1',bottom:'#e7e1d2'}, {name:'ELÉTRICO',top:'#3659bd',accent:'#869dec',bottom:'#3659bd'}, {name:'ARGILA',top:'#a4432c',accent:'#e99a63',bottom:'#a4432c'}];
let colorPos=0;const colorBase={...items[0],model:'jacket'};
const colorMedia=q('#colorlabMedia');
colorMedia.innerHTML=palettes.map((p,i)=>`<div class="cl-layer" data-cl="${i}" aria-hidden="${i?'true':'false'}">${garmentSVG({...colorBase,top:p.top,accent:p.accent,bottom:p.bottom,stripe:p.accent},'top')}</div>`).join('');
const clLayers=qa('.cl-layer',colorMedia);
q('#colorlabSwatches').innerHTML=palettes.map((p,i)=>`<button type="button" data-color-index="${i}" style="--swatch:${p.top}" title="Estudo ${p.name}" aria-label="Estudo de cor ${p.name} (não é variante disponível)"><span></span></button>`).join('');
function paintColor(i){
  const prev=colorPos;colorPos=(i+palettes.length)%palettes.length;const p=palettes[colorPos];
  clLayers.forEach((l,k)=>{l.classList.toggle('is-on',k===colorPos);l.classList.toggle('is-ghost',k===prev&&prev!==colorPos);l.setAttribute('aria-hidden',String(k!==colorPos))});
  q('#colorlabColorName').textContent=`${fmt(colorPos)} / ${p.name}`;q('#colorlabCounter').textContent=`${fmt(colorPos)} — 04`;q('#colorlabAura').style.setProperty('--aura',p.top);
  qa('[data-color-index]').forEach(b=>{b.classList.toggle('active',+b.dataset.colorIndex===colorPos);b.setAttribute('aria-pressed',String(+b.dataset.colorIndex===colorPos))});
}
q('#colorlabSwatches').addEventListener('click',e=>{let b=e.target.closest('[data-color-index]');if(b)paintColor(+b.dataset.colorIndex)});
q('#colorlabSwatches').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();paintColor(colorPos+(e.key==='ArrowRight'?1:-1));q(`[data-color-index="${colorPos}"]`)?.focus()}});
if(M)M.drag(q('.colorlab-canvas'),{axis:'x',threshold:14,onEnd(v,st){const dx=st.lx-st.x;if(Math.abs(dx)>40)paintColor(colorPos+(dx<0?1:-1))}});
paintColor(0);

// Revelação progressiva leve, respeita movimento reduzido.
if(!reduced&&'IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('v04-in');obs.unobserve(x.target)}})},{threshold:.12});qa('.rail-title-row,.showroom-heading,.colorlab-copy,.editorial-break-hero').forEach(x=>{x.classList.add('v04-reveal');obs.observe(x)})}
})();
