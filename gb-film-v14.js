/* GB IMPORTS / V14 — filme puro (ver gb-film-v14.css).
   Loop só durante interação: as camadas do hero usam o Ticker do GBMotion e param ao assentar. */
(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer: fine)').matches&&matchMedia('(hover: hover)').matches;
const M=window.GBMotion;

/* cartela final: o monograma (SVG) sobe no fim da página */
const foot=document.querySelector('.footer');
if(foot&&!foot.querySelector('.gbf-end')){
  const e=document.createElement('div');e.className='gbf-end';e.setAttribute('aria-hidden','true');
  e.innerHTML='<img alt="" decoding="async" loading="lazy" src="./assets/brand/gb-monograma-claro.svg"/>';
  foot.prepend(e);foot.classList.add('gbf-has-end');
}
if(reduce||!('IntersectionObserver'in window))return;

/* ---------- 1. letreiros: títulos que ainda não tinham revelação por linha ganham a mesma estrutura da V06 ---------- */
const lio=new IntersectionObserver(en=>en.forEach(x=>{if(x.isIntersecting){x.target.classList.add('lines-in');lio.unobserve(x.target)}}),{threshold:.3});
document.querySelectorAll('.rail-title-row h2,.category-intro h2,.editorial-break-hero h2').forEach(h=>{
  if(h.classList.contains('split-ready')||[...h.querySelectorAll('br')].some(br=>br.parentElement!==h))return;
  h.innerHTML=h.innerHTML.split(/<br\s*\/?>/i).map((l,i)=>`<span class="hl" style="--l:${i}"><span>${l}</span></span>`).join('');
  h.classList.add('split-ready');lio.observe(h);
});
// seção ainda coberta pelo muro do capítulo (V12): o letreiro só roda quando o muro abre
document.querySelectorAll('.split-ready').forEach(h=>{
  const sec=h.closest('section');const ch=sec?.querySelector(':scope>.gb-chap');if(!ch)return;
  h.classList.add('gbf-hold');
  const free=()=>{mo.disconnect();setTimeout(()=>h.classList.remove('gbf-hold'),260)};
  const mo=new MutationObserver(()=>{if(!ch.isConnected||ch.classList.contains('is-out'))free()});
  mo.observe(ch,{attributes:true,attributeFilter:['class']});mo.observe(sec,{childList:true});
  setTimeout(()=>{if(h.classList.contains('gbf-hold'))free()},9000);   // garantia: nunca fica preso
});

/* ---------- 3. hero em camadas com canhão de luz (só mouse) ---------- */
const stage=document.getElementById('heroStage');
if(stage&&fine&&M?.Ticker){
  const spot=document.createElement('div');spot.className='gbf-spot';spot.setAttribute('aria-hidden','true');
  const lb=stage.querySelector('.hero-lightbar');lb?lb.after(spot):stage.prepend(spot);
  // profundidade: negativo vai contra o mouse (fundo), positivo acompanha (frente)
  const L=[['.hero-giant-mark',-22,-14],['#heroArt',16,10],['.hero-copy',-9,-6]].map(([s,dx,dy])=>{const el=stage.querySelector(s);el?.classList.add('gbf-depth');return el&&{el,dx,dy}}).filter(Boolean);
  let tx=0,ty=0,cx=0,cy=0,sx=0,sy=0,ssx=0,ssy=0,on=false,vis=true;
  const loop=()=>{cx+=(tx-cx)*.08;cy+=(ty-cy)*.08;ssx+=(sx-ssx)*.14;ssy+=(sy-ssy)*.14;
    L.forEach(l=>{l.el.style.translate=`${(cx*l.dx).toFixed(2)}px ${(cy*l.dy).toFixed(2)}px`});
    spot.style.transform=`translate3d(${ssx.toFixed(1)}px,${ssy.toFixed(1)}px,0)`;
    if(Math.abs(tx-cx)<.002&&Math.abs(ty-cy)<.002&&Math.abs(sx-ssx)<.3&&Math.abs(sy-ssy)<.3){on=false;return false}};
  const kick=()=>{if(!on&&vis){on=true;M.Ticker.add(loop)}};
  stage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const r=stage.getBoundingClientRect();
    tx=(e.clientX-r.left)/r.width*2-1;ty=(e.clientY-r.top)/r.height*2-1;sx=e.clientX-r.left;sy=e.clientY-r.top;
    if(!stage.classList.contains('gbf-lit')){ssx=sx;ssy=sy;stage.classList.add('gbf-lit')}kick()},{passive:true});
  stage.addEventListener('pointerleave',()=>{tx=ty=0;stage.classList.remove('gbf-lit');kick()},{passive:true});
  M.onVisible?.(stage,v=>{vis=v});
}
})();
