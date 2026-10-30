/* GB IMPORTS / V13 — direção de cinema (ver gb-cinema-v13.css).
   Loop só durante interação: a dobra da grade usa o Ticker do GBMotion e para ao assentar. */
(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer: fine)').matches&&matchMedia('(hover: hover)').matches;
const M=window.GBMotion,root=document.documentElement;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- grão (sempre; animado só com ponteiro fino) ---------- */
{const g=document.createElement('div');g.className='gb-grain';g.setAttribute('aria-hidden','true');document.body.append(g);
  // ladrilho de ruído pintado uma vez em canvas (bitmap leve; filtro SVG pesaria na captura das transições)
  try{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),d=x.createImageData(128,128);
    for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255|0;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=Math.random()<.5?0:150}
    x.putImageData(d,0,0);root.style.setProperty('--gb-grain',`url(${c.toDataURL()})`)}catch{}}
if(reduce)return;

/* ---------- 1. tema em círculo a partir do sol/lua ---------- */
const tg=document.getElementById('gbThemeToggle');
let busy=false;
if(tg&&document.startViewTransition&&window.GBSetTheme){
  tg.addEventListener('click',e=>{
    e.stopImmediatePropagation();e.preventDefault();
    const r=tg.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
    root.style.setProperty('--vt-x',x+'px');root.style.setProperty('--vt-y',y+'px');
    root.style.setProperty('--vt-r',Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y))+'px');
    const dark=document.body.dataset.gbTheme==='sinal';
    let done=false;const apply=()=>{if(!done){done=true;window.GBSetTheme(dark?0:2)}};
    if(busy){apply();return}
    busy=true;const vt=document.startViewTransition(apply);
    vt.finished.finally(()=>{busy=false});
    // aparelho lento para fotografar a tela: troca direto, sem esperar o círculo
    setTimeout(()=>{if(!done){vt.skipTransition();apply()}},220);
  },true);   // captura: substitui a troca instantânea da V11 pela troca em círculo
}

/* ---------- 4a. botões magnéticos (sem loop: só a propriedade translate com transição) ---------- */
const MAG='.btn,.showroom-link,#showMore,.gbe-replay,.hero-pager button,.gb-mode-toggle,.action-btn';
if(fine){
  document.addEventListener('pointermove',e=>{
    const el=e.target.closest?.(MAG);
    if(!el)return;
    const r=el.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;
    el.classList.add('gb-mag','is-mag');el.style.setProperty('--mx',(nx*Math.min(16,r.width*.18)).toFixed(1)+'px');el.style.setProperty('--my',(ny*Math.min(12,r.height*.3)).toFixed(1)+'px');
  },{passive:true});
  document.addEventListener('pointerout',e=>{const el=e.target.closest?.(MAG);if(el&&!el.contains(e.relatedTarget)){el.classList.remove('is-mag');el.style.setProperty('--mx','0px');el.style.setProperty('--my','0px')}},{passive:true});
}

/* ---------- 4b. cards do catálogo: inclinação 3D com reflexo ---------- */
if(fine){
  const grid=document.getElementById('productGrid');
  grid?.addEventListener('pointermove',e=>{
    const f=e.target.closest('.product-frame');if(!f)return;
    if(!f.querySelector('.gb-glare-box')){const b=document.createElement('span');b.className='gb-glare-box';b.setAttribute('aria-hidden','true');b.innerHTML='<span class="gb-glare"></span>';f.append(b)}
    const r=f.getBoundingClientRect(),nx=clamp((e.clientX-r.left)/r.width-.5,-.5,.5),ny=clamp((e.clientY-r.top)/r.height-.5,-.5,.5);
    f.classList.add('is-tilt');
    const ang=Math.hypot(nx,ny)*14;f.style.rotate=ang>.05?`${(-ny).toFixed(3)} ${nx.toFixed(3)} 0 ${ang.toFixed(2)}deg`:'';
    f.querySelector('.gb-glare').style.transform=`translate3d(${(nx*50).toFixed(1)}%,${(ny*50).toFixed(1)}%,0)`;
  },{passive:true});
  grid?.addEventListener('pointerout',e=>{const f=e.target.closest?.('.product-frame');if(f&&!f.contains(e.relatedTarget)){f.classList.remove('is-tilt');f.style.rotate=''}},{passive:true});
}

/* ---------- 4c. GB CATALOG WAVE V41 | scroll-responsive cinematic wave ---------- */
/* The original V13 skew remains the basis, with physically damped depth and
   staggered cards. One shared GBMotion ticker; no perpetual animation.
   Do not animate .product-frame: V14 owns its view-timeline entrance, and
   V13 owns its pointer 3D tilt. Catalog data and events remain untouched. */
{const grid=document.getElementById('productGrid');
 if(grid&&M?.Ticker){
  const wave=new M.Spring(0,{k:116,z:.72});
  let cards=[],active=new Set(),columns=4,on=false,lastY=scrollY,lastT=performance.now(),lastScroll=0;
  let amplitude=0,skew=0,layoutReads=0;
  const mobile=()=>innerWidth<780;
  const allowed=()=>!M.Prefs.reduced&&!document.hidden&&!document.body.classList.contains('gb-experience-open');
  const visible=()=>{const r=grid.getBoundingClientRect();return r.bottom>-90&&r.top<innerHeight+90};
  const sync=()=>{
   const cols=getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length;
   columns=Math.max(1,cols);
   cards=[...grid.querySelectorAll(':scope > .product-card')].map((el,i)=>({el,i,top:el.offsetTop}));
  };
  const reset=()=>{
   grid.style.transform='';
   grid.classList.remove('gb-wave-live');
   for(const el of active){el.style.removeProperty('--gb-wave-y');el.style.removeProperty('--gb-wave-rot');}
   active.clear();amplitude=skew=0;
  };
  const loop=(dt)=>{
   if(!allowed()||!visible()){wave.jump(0);reset();on=false;return false}
   if(performance.now()-lastScroll>70)wave.set(0);
   wave.step(dt);
   const intensity=Math.max(-1,Math.min(1,wave.x));
   const strength=M.Prefs.lite?.55:1,amp=intensity*strength;
   const peak=mobile()?3.7:5.25;
   skew=amp*peak;amplitude=Math.abs(amp);
   const roll=amp*(mobile()?.65:1.2);
   grid.classList.add('gb-wave-live');
   grid.style.transform=`perspective(1400px) rotateX(${roll.toFixed(3)}deg) skewY(${skew.toFixed(3)}deg) translate3d(0,${(-amp*(mobile()?3:6)).toFixed(2)}px,0)`;
   const stage=grid.getBoundingClientRect();layoutReads++;
   const low=-stage.top-360,high=low+innerHeight+720;
   const next=new Set(),count=Math.max(1,columns),phase=scrollY*.010;
   for(const item of cards){
    if(item.top<low||item.top>high)continue; // Only the nearby visible rows receive per-card motion.
    const row=Math.floor(item.i/count),col=item.i%count;
    const offset=Math.sin(phase+col*1.12+row*.72)*amp*(mobile()?9:20);
    const twist=Math.sin(phase*.55+col*.92-row*.48)*amp*(mobile()?.32:.68);
    item.el.style.setProperty('--gb-wave-y',offset.toFixed(2)+'px');
    item.el.style.setProperty('--gb-wave-rot',twist.toFixed(3)+'deg');
    next.add(item.el);
   }
   for(const el of active)if(!next.has(el)){el.style.removeProperty('--gb-wave-y');el.style.removeProperty('--gb-wave-rot')}
   active=next;
   if(wave.target===0&&Math.abs(wave.x)<.004&&Math.abs(wave.v)<.018){
    wave.jump(0);reset();on=false;return false;
   }
  };
  const kick=()=>{if(!on){on=true;M.Ticker.add(loop)}};
  const scroll=()=>{
   const now=performance.now(),dt=Math.max(12,now-lastT),delta=scrollY-lastY;
   lastY=scrollY;lastT=now;
   if(!allowed()||!visible())return;
   if(cards.length!==grid.querySelectorAll(':scope > .product-card').length)sync();
   const velocity=delta/dt;
   if(Math.abs(velocity)<.075)return;
   lastScroll=now;
   wave.set(Math.max(-1,Math.min(1,velocity*.68)));
   kick();
  };
  sync();
  addEventListener('scroll',scroll,{passive:true});
  addEventListener('resize',sync,{passive:true});
  if('MutationObserver'in window)new MutationObserver(()=>{reset();wave.jump(0);sync()}).observe(grid,{childList:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){wave.jump(0);reset()}});
  window.GBCatalogWaveV41={get state(){return{active:on,amplitude,skew,columns,visibleCards:active.size,totalCards:cards.length,layoutReads}}};
 }
}

/* ---------- 3. lupa da própria foto (só com mouse; o cursor continua o do sistema) ---------- */
if(!fine)return;
const loupe=document.createElement('div');loupe.className='gb-loupe';loupe.setAttribute('aria-hidden','true');loupe.innerHTML='<img alt="" decoding="async"/>';
document.body.append(loupe);
const limg=loupe.querySelector('img');
const LOUPE='#railViewer .hg-fig';   // a foto fica sob uma camada (.hg-part): o alvo é a moldura, a lupa usa a foto dela
const Z=2.2,R=110;
let tx=-100,ty=-100,zoomEl=null;
function zoom(img,x,y){
  const r=img.getBoundingClientRect();
  if(zoomEl!==img){zoomEl=img;limg.src=img.currentSrc||img.src;limg.style.objectFit=getComputedStyle(img).objectFit||'fill';limg.style.width=r.width*Z+'px';limg.style.height=r.height*Z+'px';loupe.classList.add('is-on')}
  limg.style.transform=`translate3d(${(-(x-r.left)*Z+R).toFixed(1)}px,${(-(y-r.top)*Z+R).toFixed(1)}px,0)`;
  loupe.style.translate=`${x}px ${y}px`;
}
function unzoom(){if(zoomEl){zoomEl=null;loupe.classList.remove('is-on')}}
addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  tx=e.clientX;ty=e.clientY;
  const z=e.target.closest?.(LOUPE)?.querySelector('img');
  z?zoom(z,tx,ty):unzoom();
},{passive:true});
document.documentElement.addEventListener('mouseleave',unzoom);
addEventListener('blur',unzoom);
// rolar com a lupa aberta: recalcula sob o ponteiro parado
addEventListener('scroll',()=>{if(zoomEl){const el=document.elementFromPoint(tx,ty)?.closest?.(LOUPE)?.querySelector('img');el?zoom(el,tx,ty):unzoom()}},{passive:true});
})();
