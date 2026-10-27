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
const MAG='.btn,.showroom-link,#showMore,.gbc-ui button,.hero-pager button,.gb-mode-toggle,.action-btn,.gbp-close,.gbp-nav button';
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

/* ---------- 4c. a grade do catálogo dobra com a velocidade da rolagem (loop só enquanto rola) ---------- */
{const grid=document.getElementById('productGrid');
  if(grid&&M?.Ticker){let lastY=scrollY,lastT=performance.now(),target=0,cur=0,on=false;
    const loop=()=>{target*=.86;cur+=(target-cur)*.2;grid.style.transform=Math.abs(cur)<.02?'':`skewY(${cur.toFixed(3)}deg)`;if(Math.abs(cur)<.02&&Math.abs(target)<.02){on=false;grid.style.transform='';return false}};
    addEventListener('scroll',()=>{const t=performance.now(),dt=Math.max(8,t-lastT),v=(scrollY-lastY)/dt;lastY=scrollY;lastT=t;
      const r=grid.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
      target=clamp(v*1.6,-2.4,2.4);if(!on){on=true;M.Ticker.add(loop)}},{passive:true});
  }}

/* ---------- 3. lupa da própria foto (só com mouse; o cursor continua o do sistema) ---------- */
if(!fine)return;
const loupe=document.createElement('div');loupe.className='gb-loupe';loupe.setAttribute('aria-hidden','true');loupe.innerHTML='<img alt="" decoding="async"/>';
document.body.append(loupe);
const limg=loupe.querySelector('img');
const LOUPE='#railViewer .hg-fig img,#gbpView .gbp-slide.is-on img';
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
  const z=e.target.closest?.(LOUPE);
  z?zoom(z,tx,ty):unzoom();
},{passive:true});
document.documentElement.addEventListener('mouseleave',unzoom);
addEventListener('blur',unzoom);
// rolar com a lupa aberta: recalcula sob o ponteiro parado
addEventListener('scroll',()=>{if(zoomEl){const el=document.elementFromPoint(tx,ty)?.closest?.(LOUPE);el?zoom(el,tx,ty):unzoom()}},{passive:true});
})();
