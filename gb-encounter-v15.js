/* GB IMPORTS / V15 — THE ENCOUNTER (ver docs/ENCOUNTER_V15.md e .claude/skills/gb-encounter).
   No editorial "NÃO É SOBRE TER. É SOBRE SER." o palco à direita apresenta Gui e Vitin (ilustrações aprovadas, nunca redesenhadas)
   antes do carrossel de peças da V12. Dois modos: A GALERA / AS PEÇAS.
   Cena (uma vez por entrada relevante): luz do palco → Gui entra pela direita e Vitin pela esquerda, com passada, peso e parada →
   os dois se inclinam um para o outro (microencontro: os PNGs são achatados, então não fingimos aperto de mão) → um pulso amarelo no
   ponto de encontro e o "SER." responde → quadro final com aproximação discreta da câmera. Depois, nada se move.
   Movimento: Web Animations API (compositor, só transform/opacity), sem rAF em loop. Movimento reduzido: quadro final parado. */
(()=>{
'use strict';
const sec=document.getElementById('editorial'),model=sec?.querySelector('.editorial-model'),host=document.getElementById('editorialProduct');
if(!sec||!model||!host||!('IntersectionObserver'in window))return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const lite=(navigator.hardwareConcurrency||8)<=4||!!navigator.connection?.saveData;
const BASE='./assets/characters/';
// proporções medidas nos arquivos aprovados (largura/altura do recorte); Vitin é o mais baixo
const CH={vitin:{r:.3397,h:.93},gui:{r:.3689,h:1}};
const CAM=.66;   // largura da dupla em relação à altura (com 4% de sobreposição no centro)

/* ---------- palco ---------- */
const stage=document.createElement('div');stage.className='gbe is-pre';stage.setAttribute('role','group');stage.setAttribute('aria-label','A galera da GB: Gui e Vitin, em ilustração');
const fig=(k,alt)=>`<figure class="gbe-char is-${k}"><span class="gbe-shadow" aria-hidden="true"></span><span class="gbe-lean"><span class="gbe-body"><img alt="${alt}" decoding="async" draggable="false" data-k="${k}"/></span></span></figure>`;
stage.innerHTML=`<div class="gbe-light" aria-hidden="true"></div><div class="gbe-cam"><div class="gbe-floor" aria-hidden="true"></div>`+
  fig('gui','Gui, da GB Imports, em ilustração: conjunto branco, boné bege e o gesto com a mão')+
  fig('vitin','Vitin, da GB Imports, em ilustração: conjunto preto, boné bege virado para trás e óculos')+
  `<span class="gbe-pulse" aria-hidden="true"><i></i><b></b></span></div>`+
  `<p class="gbe-tag"><b>GB IMPORTS</b><span class="gbe-sep">/</span><span data-no-translate>GUI × VITIN</span><em>ILUSTRAÇÃO</em></p>`;
const bar=document.createElement('div');bar.className='gbe-bar';
bar.innerHTML=`<div class="gbe-switch" role="group" aria-label="O que ver no palco"><i class="gbe-knob" aria-hidden="true"></i>`+
  `<button type="button" data-gbe="galera" aria-pressed="true">A GALERA</button><button type="button" data-gbe="pecas" aria-pressed="false">AS PEÇAS</button></div>`+
  `<button type="button" class="gbe-replay" aria-label="Rever o encontro"><span aria-hidden="true">↻</span> <b>REVER</b></button>`;
const wipe=document.createElement('i');wipe.className='gbe-wipe';wipe.setAttribute('aria-hidden','true');
const $=s=>stage.querySelector(s);
const cam=$('.gbe-cam'),light=$('.gbe-light'),pulse=$('.gbe-pulse'),tag=$('.gbe-tag');
const chars={gui:$('.gbe-char.is-gui'),vitin:$('.gbe-char.is-vitin')};
const ser=sec.querySelector('.editorial-copy h2 mark');
let ready=false,mode='galera',played=false,inView=false,anims=[],endTimer=0,waitingWall=false;

/* ---------- mídia: só perto da seção, e o palco só liga com as duas ilustrações decodificadas ---------- */
function load(){
  const imgs=[...stage.querySelectorAll('img')];
  layout();   // tamanho real antes do srcset: o navegador escolhe o arquivo uma vez só
  imgs.forEach(img=>{const k=img.dataset.k;img.srcset=`${BASE}gb-${k}-m.webp 245w, ${BASE}gb-${k}.webp 472w`;img.src=`${BASE}gb-${k}.webp`});
  Promise.all(imgs.map(i=>i.decode())).then(enable,()=>{stage.remove();bar.remove()});   // falhou: carrossel V12 intacto
}
const near=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){near.disconnect();load()}},{rootMargin:'500px 0px'});
near.observe(sec);

function enable(){
  ready=true;
  model.append(stage,bar,wipe);model.classList.add('gbe-ready');
  layout();new ResizeObserver(()=>layout()).observe(sec);
  bar.addEventListener('click',e=>{const b=e.target.closest('[data-gbe]');if(b)setMode(b.dataset.gbe,true);else if(e.target.closest('.gbe-replay'))play()});
  bar.addEventListener('keydown',e=>{if(!e.target.closest('[data-gbe]')||!/^Arrow(Left|Right)$/.test(e.key))return;e.preventDefault();
    const n=mode==='galera'?'pecas':'galera';setMode(n,true);bar.querySelector(`[data-gbe="${n}"]`).focus()});
  apply(true);
  if(reduce.matches){final();return}
  watch.observe(model);
}

/* ---------- composição responsiva: o palco nunca cobre o texto nem corta pés/boné ---------- */
function layout(){
  const S=sec.getBoundingClientRect(),M=model.getBoundingClientRect(),copy=sec.querySelector('.editorial-copy').getBoundingClientRect();
  const ui=model.querySelector('.gbc-ui')?.getBoundingClientRect();
  const R=s=>sec.querySelector(s)?.getBoundingClientRect();
  const h2=R('.editorial-copy h2'),p=R('.editorial-copy p'),link=R('.editorial-link');
  const BAR=58,side=M.left>=copy.right-2;   // desktop: texto e palco lado a lado
  const visL=Math.max(M.left,S.left+(side?0:14)),visR=Math.min(M.right,S.right-(side?0:14));
  const floor=(ui&&ui.height?ui.top:M.bottom-120)-14;
  const opt=[];
  if(side)opt.push({l:visL,r:visR,t:M.top+92});
  else{
    const low=[p,link].filter(Boolean);
    opt.push({l:visL,r:visR,t:Math.max(...[h2,...low].filter(Boolean).map(x=>x.bottom))+12});
    opt.push({l:Math.max(visL,...low.map(x=>x.right+22)),r:visR,t:(h2?h2.bottom:M.top)+12});
  }
  let best=null;
  for(const o of opt){const h=Math.min(floor-o.t-BAR,(o.r-o.l)/CAM*.96);if(!best||h>best.h)best={...o,h}}
  const h=Math.max(160,Math.floor(best.h));
  const st=model.style;
  st.setProperty('--gbe-t',(best.t-M.top)+'px');st.setProperty('--gbe-l',(best.l-M.left)+'px');st.setProperty('--gbe-r',(M.right-best.r)+'px');
  st.setProperty('--gbe-b',(M.bottom-floor)+'px');st.setProperty('--gbe-hpx',h+'px');
  // o navegador escolhe o arquivo certo (celular/desktop) pela largura real de cada personagem
  stage.querySelectorAll('img').forEach(img=>{const c=CH[img.dataset.k],v=Math.ceil(c.r*c.h*h/40)*40+'px';if(img.sizes!==v)img.sizes=v});
}

/* ---------- modos ---------- */
function apply(first){
  const g=mode==='galera';
  model.classList.toggle('is-galera',g);
  host.inert=g;stage.inert=!g;
  const ui=model.querySelector('.gbc-ui');if(ui)ui.inert=g;
  bar.querySelectorAll('[data-gbe]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gbe===mode)));
  bar.classList.toggle('is-pecas',!g);
  window.GBEditCarousel?.refresh();
  if(!first&&!reduce.matches)wipe.animate([{transform:'scaleX(0)',transformOrigin:'0 50%'},{transform:'scaleX(1)',transformOrigin:'0 50%',offset:.45},{transform:'scaleX(1)',transformOrigin:'100% 50%',offset:.55},{transform:'scaleX(0)',transformOrigin:'100% 50%'}],{duration:560,easing:'cubic-bezier(.76,0,.24,1)'});
}
function setMode(m,user){
  if(m===mode||!ready)return;mode=m;apply(false);
  if(m==='galera'){
    // voltar para a galera mostra o quadro final (a cena inteira fica no REVER)
    if(!played&&!reduce.matches&&inView)play();else final();
  }
}

/* ---------- cena ---------- */
const A=(el,kf,o)=>{const a=el.animate(kf,{fill:'both',...o});anims.push(a);return a};
function reset(){anims.forEach(a=>a.cancel());anims=[];clearTimeout(endTimer)}
function done(){stage.classList.remove('is-pre','is-playing');stage.classList.add('is-done');model.classList.add('gbe-done','gbe-seen')}
function final(){reset();played=true;done()}

// passada: deslocamento com desaceleração (sem linha reta constante), meio-passos com subida/descida e troca de peso, parada com
// ultrapassagem mínima (≤2% da largura) e volta ao ponto
function walk(k,dir,{D,steps,dur,delay,bob,sway,over}){
  const ch=chars[k],body=ch.querySelector('.gbe-body'),n=steps*2,X=[],B=[];
  for(let i=0;i<=n;i++){const o=i/n*.9,e=1-Math.pow(1-i/n,1.55),s=.92+.08*Math.min(1,i/n*1.6);
    X.push({offset:o,transform:`translateX(${(dir*D*(1-e)).toFixed(1)}px) scale(${s.toFixed(3)})`,opacity:Math.min(1,i/n*5.5)});
    const up=i%2===1&&i<n,damp=1-i/n*.6;
    B.push({offset:o,transform:`translateY(${up?(-bob*damp).toFixed(1):0}px) rotate(${up?0:(((i/2)%2?1:-1)*sway*damp*(i===n?0:1)).toFixed(2)}deg)`});}
  X.push({offset:.95,transform:`translateX(${(-dir*over).toFixed(1)}px) scale(1)`,opacity:1},{offset:1,transform:'translateX(0) scale(1)',opacity:1});
  B.push({offset:1,transform:'none'});
  A(ch,X,{duration:dur,delay,easing:'linear'});
  A(body,B,{duration:dur,delay,easing:'ease-in-out'});
  A(ch.querySelector('.gbe-shadow'),[{opacity:0,transform:'scaleX(.6)'},{opacity:1,transform:'scaleX(1)',offset:.3},{opacity:1,transform:'scaleX(1)'}],{duration:dur,delay});
}
function play(){
  if(!ready)return;
  if(reduce.matches){final();return}
  reset();played=true;
  stage.classList.remove('is-pre','is-done');stage.classList.add('is-playing');model.classList.remove('gbe-done');
  const W=stage.clientWidth,H=cam.clientHeight,mob=W<560,ease='cubic-bezier(.22,1,.36,1)';
  const D=Math.max(W*.62,H*.55);
  // 01 · a chegada: o palco acende antes de qualquer personagem
  A(light,[{opacity:0,transform:'scale(.82)'},{opacity:1,transform:'none'}],{duration:900,easing:ease});
  A(cam.querySelector('.gbe-floor'),[{opacity:0,transform:'scaleX(.5)'},{opacity:1,transform:'none'}],{duration:900,delay:120,easing:ease});
  // 02 · entrada: Gui pela direita (passada longa, mais alto), Vitin pela esquerda (passada curta e mais rápida), tempos diferentes
  const lt=lite?.6:1,tG=280,dG=(mob?1250:1650)*lt,tV=430,dV=(mob?1150:1500)*lt;
  walk('gui',1,{D,steps:lite?2:3,dur:dG,delay:tG,bob:H*.012,sway:1.1,over:W*.012});
  walk('vitin',-1,{D,steps:lite?2:4,dur:dV,delay:tV,bob:H*.009,sway:1.4,over:W*.014});
  // 03 · o encontro: os dois se inclinam um para o outro e voltam (só o corpo; mão articulada é a fase 2 com rig)
  const tC=Math.max(tG+dG,tV+dV)+60,dL=980,hit=tC+dL*.42;
  const lean=(k,dir,deg,px)=>A(chars[k].querySelector('.gbe-lean'),[{transform:'none'},{transform:`translateX(${dir*px}px) rotate(${dir*deg}deg)`,offset:.42},{transform:`translateX(${dir*px*1.1}px) rotate(${dir*deg*1.08}deg)`,offset:.56},{transform:`translateX(${-dir*px*.12}px) rotate(${-dir*deg*.1}deg)`,offset:.82},{transform:'none'}],{duration:dL,delay:tC,easing:'cubic-bezier(.45,0,.2,1)'});
  lean('vitin',1,2.6,W*.012);lean('gui',-1,1.5,W*.008);
  // 04 · impacto: um único pulso amarelo no ponto de encontro; o "SER." responde
  A(pulse.querySelector('i'),[{opacity:0,transform:'scale(.15)'},{opacity:1,transform:'scale(.7)',offset:.25},{opacity:0,transform:'scale(1.55)'}],{duration:760,delay:hit,easing:'cubic-bezier(.16,1,.3,1)'});
  A(pulse.querySelector('b'),[{opacity:0,transform:'rotate(45deg) scale(0)'},{opacity:1,transform:'rotate(45deg) scale(1)',offset:.3},{opacity:0,transform:'rotate(45deg) scale(.4)'}],{duration:520,delay:hit,easing:ease});
  if(ser)A(ser,[{transform:'none'},{transform:'translateY(-.04em) scale(1.045)',offset:.32},{transform:'none'}],{duration:640,delay:hit,easing:ease,fill:'none'});
  // 05 · quadro final: aproximação discreta da câmera, assinatura, e acabou
  if(!lite)A(cam,[{transform:'none'},{transform:'scale(1.035)'}],{duration:1700,delay:hit+120,easing:ease});
  A(tag,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:700,delay:hit+380,easing:ease});
  endTimer=setTimeout(done,hit+760);
}

/* ---------- gatilho: seção bem visível, uma vez por entrada (só reinicia depois de sair inteira da tela) ---------- */
const watch=new IntersectionObserver(es=>es.forEach(e=>{
  inView=e.intersectionRatio>=.5;
  if(!e.isIntersecting){if(mode==='galera'&&!reduce.matches){reset();played=false;stage.classList.add('is-pre');stage.classList.remove('is-done','is-playing');model.classList.remove('gbe-done')}return}
  if(inView&&!played&&mode==='galera')afterWall(play);
}),{threshold:[0,.5]});
// a seção chega coberta pelo muro do capítulo (V12): a cena começa quando o muro abre
function afterWall(fn){
  const wall=sec.querySelector(':scope>.gb-chap');
  if(!wall||wall.classList.contains('is-out')){fn();return}
  if(waitingWall)return;waitingWall=true;
  const go=()=>{mo.disconnect();clearTimeout(t);waitingWall=false;setTimeout(()=>{if(!played&&mode==='galera')fn()},380)};
  const mo=new MutationObserver(()=>{if(!wall.isConnected||wall.classList.contains('is-out'))go()});
  mo.observe(wall,{attributes:true,attributeFilter:['class']});mo.observe(sec,{childList:true});
  const t=setTimeout(go,4000);
}
})();
