/* GB IMPORTS / V07 — "GB / IN MOTION" (nome interno de direção, não renomeia a marca)
 * 1. Hero: palco de câmera com três peças em poses persistentes num anel de profundidade.
 *    Uma única variável contínua (fase) dirige as três; mola interrompível, gesto 1:1, teclado.
 * 2. Slots de campanha: foto/filme autorizados entram por manifesto; sem mídia, composição de estudo.
 * Depende de motion-core.js (GBMotion) e do núcleo main.js.
 */
(()=>{
'use strict';
const M=window.GBMotion;if(!M||typeof heroSlides==='undefined')return;
const {Prefs,Ticker,Spring,onVisible,drag,clamp,lerp}=M;
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
const mod=(n,m)=>((n%m)+m)%m;

/* ================= 1. HERO / PALCO DE CÂMERA ================= */
const stage=q('#heroStage'),art=q('#heroArt');
if(stage&&art){
  const N=heroSlides.length;
  // Poses nomeadas do anel: 0 = protagonista, 1 = fundo direita, 2 = fundo esquerda.
  // x/y em fração da largura/altura do palco; s escala; r rotação; l luz; z ordem.
  const POSES_DESK=[{x:0,y:.02,s:1,r:-3,l:1,o:1,z:30},{x:.33,y:-.07,s:.58,r:8,l:.5,o:.95,z:12},{x:-.31,y:-.02,s:.54,r:-10,l:.42,o:.9,z:10}];
  const POSES_MOB=[{x:0,y:.03,s:1,r:-3,l:1,o:1,z:30},{x:.4,y:-.1,s:.5,r:9,l:.45,o:.85,z:12},{x:-.4,y:-.06,s:.46,r:-11,l:.4,o:.8,z:10}];
  let POSES=innerWidth<781?POSES_MOB:POSES_DESK;
  const smooth=t=>t*t*(3-2*t);
  function poseAt(u){ // u contínuo no anel [0,N)
    const i=Math.floor(u)%N,t=smooth(u-Math.floor(u)),a=POSES[i],b=POSES[(i+1)%N],o={};
    for(const k of ['x','y','s','r','l','o'])o[k]=lerp(a[k],b[k],t);
    // passagem por trás: quem cruza do fundo esquerdo para o direito passa recuado
    o.z=lerp(a.z,b.z,t);if(i===2){o.s*=1-.12*Math.sin(Math.PI*t);o.l*=1-.25*Math.sin(Math.PI*t)}
    return o;
  }
  const trio=document.createElement('div');trio.className='hero-trio';trio.id='heroTrio';
  trio.setAttribute('role','group');trio.setAttribute('aria-label','Peças em cena — use as setas para trocar');
  trio.innerHTML=heroSlides.map((s,i)=>`<button type="button" class="trio-obj" data-trio="${i}" aria-label="${escaped(s.product.name)}"><span class="trio-shadow" aria-hidden="true"></span><span class="trio-media">${productMedia(s.product,'top')}</span></button>`).join('')+'<span class="trio-floor" aria-hidden="true"></span>';
  art.appendChild(trio);stage.classList.add('has-trio');
  const objs=qa('.trio-obj',trio),medias=objs.map(o=>q('.trio-media',o)),shadows=objs.map(o=>q('.trio-shadow',o));
  const phase=new Spring(heroIndex,M.Tokens.spring.object);
  let W=trio.clientWidth,H=trio.clientHeight,running=false;
  const useLight=!Prefs.lite;
  function render(){
    const p=phase.x;
    objs.forEach((el,j)=>{
      const u=mod(j-p,N),o=poseAt(u);
      el.style.transform=`translate3d(${(o.x*W).toFixed(1)}px,${(o.y*H).toFixed(1)}px,0) rotate(${o.r.toFixed(2)}deg) scale(${o.s.toFixed(3)})`;
      el.style.zIndex=String(Math.round(o.z));el.style.opacity=o.o.toFixed(3);
      if(useLight)medias[j].style.filter=`brightness(${(.35+.65*o.l).toFixed(3)}) saturate(${(.55+.45*o.l).toFixed(3)})`;
      shadows[j].style.opacity=(.15+.55*o.l).toFixed(3);
      const front=u<.5||u>N-.5;el.classList.toggle('is-front',front);el.setAttribute('aria-current',front?'true':'false');
    });
  }
  function loop(dt){phase.step(dt);render();if(phase.settled&&!dragging){phase.jump(phase.target);render();running=false;objs.forEach(o=>M.animating(o,false));return false}}
  function kick(){if(Prefs.reduced){phase.jump(phase.target);render();return}if(!running){running=true;objs.forEach(o=>M.animating(o,true));Ticker.add(loop)}}
  // caminho mais curto até o capítulo pedido; preparação = leve recuo antes da passagem
  function go(index){
    const base=Math.round(phase.target);let d=mod(index-mod(base,N),N);if(d>N/2)d-=N;
    if(!d)return;phase.set(base+d,Prefs.reduced?0:-d*.9);kick();
  }
  window.GBHeroStage={go,get phase(){return phase.x}};
  render();
  addEventListener('resize',()=>{POSES=innerWidth<781?POSES_MOB:POSES_DESK;W=trio.clientWidth;H=trio.clientHeight;render()},{passive:true});
  if('ResizeObserver'in window)new ResizeObserver(()=>{W=trio.clientWidth;H=trio.clientHeight;render()}).observe(trio);

  // Seleção: protagonista abre a peça; periféricas viram protagonistas (também durante animação).
  trio.addEventListener('click',e=>{
    const b=e.target.closest('.trio-obj');if(!b)return;const j=+b.dataset.trio;
    if(b.classList.contains('is-front'))detailModal(heroSlides[j].product,{transition:q('.trio-media',b)});
    else{changeHero(j);window.GBHeroAuto?.restart()}
  });
  // Gesto: o anel acompanha o dedo 1:1 e se acomoda no capítulo mais próximo.
  let dragging=false,startP=0;
  drag(art,{axis:'x',ignore:'.hero-scene-tag',
    onStart(){dragging=true;startP=phase.x;window.GBHeroAuto?.pause('drag');kick()},
    onMove(dx){phase.x=startP-dx/(W*.62);phase.target=phase.x;phase.v=0},
    onEnd(v){dragging=false;const proj=phase.x-(v/(W*.62))*.18;let t=Math.round(clamp(proj,startP-1,startP+1));if(Math.abs(phase.x-startP)<.08)t=Math.round(startP);
      phase.target=t;phase.v=-(v/(W*.62))*.6;kick();const idx=mod(t,N);if(idx!==heroIndex)changeHero(idx);window.GBHeroAuto?.resume('drag');window.GBHeroAuto?.restart()}
  });
  // Teclado no palco
  stage.addEventListener('keydown',e=>{if(e.target.closest('input,textarea'))return;if(e.key==='ArrowRight'){e.preventDefault();changeHero(heroIndex+1);window.GBHeroAuto?.restart()}if(e.key==='ArrowLeft'){e.preventDefault();changeHero(heroIndex-1);window.GBHeroAuto?.restart()}});
}

/* ================= 2. SLOTS DE CAMPANHA (MediaSlot) ================= */
// window.GB_CAMPAIGN_MEDIA['campaign-hero'] = {type:'video'|'image', src, poster, alt, credit}
qa('[data-media-slot]').forEach(slot=>{
  const id=slot.dataset.mediaSlot,media=M.Media.campaign(id),frame=q('.slot-frame',slot);if(!frame)return;
  if(media?.src){
    slot.classList.add('has-media');
    if(media.type==='video'){
      frame.innerHTML=`<video muted playsinline loop preload="none" poster="${escaped(media.poster||'')}" aria-label="${escaped(media.alt||'Filme de campanha GB')}"><source src="${escaped(media.src)}"></video>`;
      const v=q('video',frame);if(!Prefs.reduced)onVisible(slot,vis=>{vis?v.play().catch(()=>{}):v.pause()},{threshold:.35});
    }else frame.innerHTML=`<img src="${escaped(media.src)}" alt="${escaped(media.alt||'')}" loading="lazy" decoding="async"${media.width?` width="${media.width}" height="${media.height}"`:''}>`;
    const cap=q('.slot-status',slot);if(cap)cap.textContent=media.credit||'FOTOGRAFIA AUTORIZADA';
  }
  // revelação em mosaico (blocos que se recolhem), uma vez, só transform
  if(!Prefs.reduced){const tiles=document.createElement('div');tiles.className='slot-tiles';tiles.setAttribute('aria-hidden','true');tiles.innerHTML=Array.from({length:12},(_,i)=>`<i style="--t:${(i%4)*55+Math.floor(i/4)*90}ms"></i>`).join('');frame.appendChild(tiles);
    const off=onVisible(slot,vis=>{if(vis){slot.classList.add('is-revealed');off()}},{threshold:.3})}
});
})();
