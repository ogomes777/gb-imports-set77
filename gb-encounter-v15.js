/* GB IMPORTS / V15 — THE ENCOUNTER (ver docs/ENCOUNTER_V15.md e .claude/skills/gb-encounter).
   No editorial "NÃO É SOBRE TER. É SOBRE SER." o palco à direita é de Gui e Vitin (ilustrações aprovadas, nunca redesenhadas).
   Cena (uma vez por entrada relevante): luz do palco → Gui entra pela direita e Vitin pela esquerda, com passada, peso e parada →
   o cumprimento: Gui manda o salve com a mão do gesto (a mão é uma camada recortada do próprio desenho e gira no pulso) e Vitin
   responde com o queixo (a cabeça é outra camada, gira na base do pescoço) → um pulso amarelo e o "SER." respondem →
   quadro final com aproximação discreta da câmera. Depois, nada se move.
   Camadas geradas por scripts/gerar_rig_encounter.py. Movimento: Web Animations (só transform/opacity), sem rAF em loop.
   Movimento reduzido: quadro final parado. */
(()=>{
'use strict';
const sec=document.getElementById('editorial'),model=sec?.querySelector('.editorial-model');
if(!sec||!model||!('IntersectionObserver'in window))return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const lite=(navigator.hardwareConcurrency||8)<=4||!!navigator.connection?.saveData;
const BASE='./assets/characters/';
// proporções e pivôs medidos nos arquivos aprovados (saída do gerar_rig_encounter.py); Vitin é o mais baixo
const CH={
  gui:{r:.3689,h:1,part:'hand',piv:'71.38% 37.25%'},     // pulso, junto do relógio
  vitin:{r:.3397,h:.93,part:'head',piv:'44.94% 21.28%'}  // base do pescoço, acima da gola
};
const CAM=.66;   // largura da dupla em relação à altura (4% de sobreposição no centro)

/* ---------- palco ---------- */
const stage=document.createElement('div');stage.className='gbe is-pre';stage.setAttribute('role','img');
stage.setAttribute('aria-label','A galera da GB: Gui e Vitin, em ilustração, se cumprimentando');
const layers=(k,cls='')=>`<img class="gbe-base" alt="" decoding="async" draggable="false" data-k="${k}" data-l="base"/>`+
  `<img class="gbe-part ${cls}" alt="" decoding="async" draggable="false" data-k="${k}" data-l="${CH[k].part}" style="transform-origin:${CH[k].piv}"/>`;
// rastro da chegada: dois ecos do próprio desenho (mesmos arquivos, já decodificados) que ficam para trás e somem
const fig=k=>`<figure class="gbe-char is-${k}"><span class="gbe-shadow" aria-hidden="true"></span><span class="gbe-land" aria-hidden="true"></span>`+
  `<span class="gbe-ghost" aria-hidden="true">${layers(k)}</span><span class="gbe-ghost" aria-hidden="true">${layers(k)}</span>`+
  `<span class="gbe-lean"><span class="gbe-body">${layers(k,'gbe-'+CH[k].part)}</span></span></figure>`;
stage.innerHTML=`<div class="gbe-light" aria-hidden="true"></div><div class="gbe-cam" aria-hidden="true"><div class="gbe-floor"></div>`+fig('gui')+fig('vitin')+
  `<span class="gbe-pulse"><i></i><b></b></span></div>`+
  `<p class="gbe-tag"><b>GB IMPORTS</b><span class="gbe-sep">/</span><span data-no-translate>GUI × VITIN</span><em>ILUSTRAÇÃO</em></p>`;
const bar=document.createElement('div');bar.className='gbe-bar';
bar.innerHTML=`<button type="button" class="gbe-replay" aria-label="Rever o encontro"><span aria-hidden="true">↻</span> <b>REVER</b></button>`;
const $=s=>stage.querySelector(s);
const cam=$('.gbe-cam'),light=$('.gbe-light'),pulse=$('.gbe-pulse'),tag=$('.gbe-tag');
const chars={gui:$('.gbe-char.is-gui'),vitin:$('.gbe-char.is-vitin')};
const ser=sec.querySelector('.editorial-copy h2 mark');
let ready=false,played=false,anims=[],playId=0,waitingWall=false;

/* ---------- mídia: só perto da seção; o palco só liga com as quatro camadas decodificadas ---------- */
function load(){
  layout();   // tamanho real antes do srcset: o navegador escolhe o arquivo uma vez só
  const imgs=[...stage.querySelectorAll('img')];
  imgs.forEach(img=>{const n=`${BASE}gb-${img.dataset.k}-${img.dataset.l}`;img.srcset=`${n}-m.webp 720w, ${n}.webp 1280w`;img.src=`${n}.webp`});
  Promise.all(imgs.map(i=>i.decode())).then(enable,()=>{stage.remove();bar.remove()});   // falhou: o editorial segue com a foto do acervo
}
const near=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){near.disconnect();load()}},{rootMargin:'500px 0px'});
near.observe(sec);

function enable(){
  ready=true;
  model.append(stage,bar);model.classList.add('gbe-ready');
  layout();new ResizeObserver(()=>layout()).observe(sec);
  bar.querySelector('.gbe-replay').addEventListener('click',play);
  if(reduce.matches){final();return}
  watch.observe(model);
}

/* ---------- composição responsiva: o palco nunca cobre o texto nem corta pés/boné ---------- */
function layout(){
  const S=sec.getBoundingClientRect(),M=model.getBoundingClientRect(),copy=sec.querySelector('.editorial-copy').getBoundingClientRect();
  // V51: no mobile o palco e um bloco proprio ABAIXO do texto. Nao tentar encaixar
  // os personagens no espaco residual do editorial como na versao absoluta antiga.
  // Preserva o rig V15 inteiro (corpos, mao do Gui, cabeca do Vitin e timeline).
  if(window.innerWidth<=780&&getComputedStyle(model).position==='relative'){
    const pad=Math.max(12,Math.min(30,Math.round(M.width*.038)));
    const top=30,tagRoom=68;
    const h=Math.max(160,Math.floor(Math.min((M.width-pad*2)/CAM,M.height-top-tagRoom)));
    const bottom=Math.max(0,M.height-top-h),st=model.style;
    st.setProperty('--gbe-t',top+'px');
    st.setProperty('--gbe-l',pad+'px');st.setProperty('--gbe-r',pad+'px');
    st.setProperty('--gbe-b',bottom+'px');st.setProperty('--gbe-hpx',h+'px');
    stage.querySelectorAll('img').forEach(img=>{
      const c=CH[img.dataset.k],v=Math.ceil(c.r*c.h*h/40)*40+'px';
      if(img.sizes!==v)img.sizes=v;
    });
    return;
  }
  const R=s=>sec.querySelector(s)?.getBoundingClientRect();
  const h2=R('.editorial-copy h2'),p=R('.editorial-copy p'),link=R('.editorial-link'),strip=R('.editorial-bottom');
  const BAR=52,side=M.left>=copy.right-2;   // desktop: texto e palco lado a lado
  const visL=Math.max(M.left,S.left+(side?0:14)),visR=Math.min(M.right,S.right-(side?0:14));
  const floor=Math.min(M.bottom,strip&&strip.height?strip.top:M.bottom)-58;   // espaço da assinatura acima da faixa de rodapé
  const opt=[];
  if(side)opt.push({l:visL,r:visR,t:M.top+92});
  else{
    const low=[p,link].filter(Boolean);
    opt.push({l:visL,r:visR,t:Math.max(...[h2,...low].filter(Boolean).map(x=>x.bottom))+12});
    opt.push({l:Math.max(visL,...low.map(x=>x.right+22)),r:visR,t:(h2?h2.bottom:M.top)+12});
  }
  let best=null;
  for(const o of opt){const h=Math.min(floor-o.t-BAR,(o.r-o.l)/CAM*.96);if(!best||h>best.h)best={...o,h}}
  const h=Math.max(160,Math.floor(best.h)),st=model.style;
  st.setProperty('--gbe-t',(best.t-M.top)+'px');st.setProperty('--gbe-l',(best.l-M.left)+'px');st.setProperty('--gbe-r',(M.right-best.r)+'px');
  st.setProperty('--gbe-b',(M.bottom-floor)+'px');st.setProperty('--gbe-hpx',h+'px');
  // as camadas ocupam o quadro inteiro do personagem: sizes = largura real dele
  stage.querySelectorAll('img').forEach(img=>{const c=CH[img.dataset.k],v=Math.ceil(c.r*c.h*h/40)*40+'px';if(img.sizes!==v)img.sizes=v});
}

/* ---------- cena ---------- */
const A=(el,kf,o)=>{const a=el.animate(kf,{fill:'both',...o});anims.push(a);return a};
function reset(){playId++;anims.forEach(a=>a.cancel());anims=[]}
function done(){stage.classList.remove('is-pre','is-playing');stage.classList.add('is-done');model.classList.add('gbe-done')}
function final(){reset();played=true;done()}

// passada: deslocamento com desaceleração (não é linha reta constante), meio-passos com subida/descida e troca de peso,
// parada com ultrapassagem mínima (≤2% da largura) e volta ao ponto
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
  // rastro: os ecos ficam para trás no sentido do movimento e se recolhem no corpo enquanto ele freia
  if(!lite)ch.querySelectorAll('.gbe-ghost').forEach((g,j)=>A(g,[{opacity:0,transform:`translateX(${dir*D*.05*(j+1)}px)`},{opacity:.34/(j+1),transform:`translateX(${dir*D*.06*(j+1)}px)`,offset:.12},{opacity:.2/(j+1),transform:`translateX(${dir*D*.035*(j+1)}px)`,offset:.5},{opacity:0,transform:'translateX(0)',offset:.86},{opacity:0,transform:'translateX(0)'}],{duration:dur,delay,easing:'linear'}));
  // pouso: uma onda amarela no chão, nos pés, no instante em que ele para
  A(ch.querySelector('.gbe-land'),[{opacity:0,transform:'scale(.25)'},{opacity:.95,transform:'scale(.6)',offset:.18},{opacity:0,transform:'scale(1.6)'}],{duration:700,delay:delay+dur*.86,easing:'cubic-bezier(.16,1,.3,1)'});
  return delay+dur*.86;
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
  const lt=lite?.7:1,tG=260,dG=(mob?1000:1250)*lt,tV=400,dV=(mob?950:1150)*lt;
  const landG=walk('gui',1,{D,steps:lite?2:3,dur:dG,delay:tG,bob:H*.016,sway:1.6,over:W*.016});
  const landV=walk('vitin',-1,{D,steps:lite?2:4,dur:dV,delay:tV,bob:H*.012,sway:1.9,over:W*.018});
  // a câmera sente o segundo pouso: um soco curto de enquadramento
  A(cam,[{transform:'none'},{transform:'scale(1.022) translateY(-.5%)',offset:.35},{transform:'none'}],{duration:340,delay:Math.max(landG,landV),easing:'cubic-bezier(.2,.9,.3,1)'});
  // 03 · o cumprimento. Os corpos se aproximam (inclinação a partir dos pés) e:
  //  Gui levanta a mão do gesto na direção do Vitin e manda o salve forte (gira no pulso, chacoalha três vezes rápido, volta à pose dele);
  //  Vitin responde com o queixo: a cabeça sobe, inclina para o Gui e volta. O rosto nunca deforma: só gira/desloca inteiro.
  const tC=Math.max(tG+dG,tV+dV)+20,dL=1300;
  const lean=(k,dir,deg,px)=>A(chars[k].querySelector('.gbe-lean'),[{transform:'none'},{transform:`translateX(${dir*px}px) rotate(${dir*deg}deg)`,offset:.3},{transform:`translateX(${dir*px*1.05}px) rotate(${dir*deg*1.05}deg)`,offset:.7},{transform:`translateX(${-dir*px*.1}px) rotate(${-dir*deg*.08}deg)`,offset:.88},{transform:'none'}],{duration:dL,delay:tC,easing:'cubic-bezier(.45,0,.2,1)'});
  lean('vitin',1,2.6,W*.014);lean('gui',-1,1.7,W*.01);
  const tH=tC+80,dH=lite?760:1000;
  const snap='cubic-bezier(.3,0,.2,1)',H_=(d,o)=>({transform:`rotate(${d}deg)`,offset:o,easing:snap});
  A($('.gbe-hand'),lite
    ?[{transform:'none',easing:snap},H_(30,.24),H_(12,.42),H_(28,.6),H_(-4,.84),{transform:'none'}]
    :[{transform:'none',easing:snap},H_(34,.16),H_(12,.28),H_(32,.4),H_(10,.52),H_(30,.64),H_(-6,.84),{transform:'none'}],
    {duration:dH,delay:tH,easing:'linear'});
  const tN=tH+220,dN=900;
  A($('.gbe-head'),[{transform:'none'},{transform:'translateY(-.85%) rotate(5.5deg)',offset:.28},{transform:'translateY(-.6%) rotate(4.4deg)',offset:.55},{transform:'translateY(.12%) rotate(-.5deg)',offset:.82},{transform:'none'}],
    {duration:dN,delay:tN,easing:'cubic-bezier(.3,0,.2,1)'});
  // 04 · impacto: um único pulso amarelo entre a mão do Gui e o Vitin, no pico do salve; o "SER." responde
  const hit=tN+dN*.3;
  A(pulse.querySelector('i'),[{opacity:0,transform:'scale(.15)'},{opacity:1,transform:'scale(.7)',offset:.25},{opacity:0,transform:'scale(1.9)'}],{duration:820,delay:hit,easing:'cubic-bezier(.16,1,.3,1)'});
  A(pulse.querySelector('b'),[{opacity:0,transform:'rotate(45deg) scale(0)'},{opacity:1,transform:'rotate(45deg) scale(1)',offset:.3},{opacity:0,transform:'rotate(45deg) scale(.4)'}],{duration:520,delay:hit,easing:ease});
  if(ser)A(ser,[{transform:'none'},{transform:'translateY(-.04em) scale(1.045)',offset:.32},{transform:'none'}],{duration:640,delay:hit,easing:ease,fill:'none'});
  // 05 · quadro final: aproximação discreta da câmera, assinatura, e acabou
  const tEnd=Math.max(tH+dH,tN+dN,tC+dL);
  if(!lite)A(cam,[{transform:'none'},{transform:'scale(1.035)'}],{duration:1700,delay:tEnd-500,easing:ease,fill:'forwards'});
  A(tag,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:700,delay:tEnd-300,easing:ease});
  // a cena só termina quando TODAS as animações terminam de fato (relógio das próprias animações, não do setTimeout)
  const token=++playId;
  Promise.all(anims.map(a=>a.finished)).then(()=>{if(token===playId)done()},()=>{});
}

/* ---------- gatilho: palco bem visível, uma vez por entrada (só reinicia depois de sair inteiro da tela) ---------- */
const watch=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting){if(!reduce.matches){reset();played=false;stage.classList.add('is-pre');stage.classList.remove('is-done','is-playing');model.classList.remove('gbe-done')}return}
  if(e.intersectionRatio>=.5&&!played)afterWall(play);
}),{threshold:[0,.5]});
// a seção chega coberta pelo muro do capítulo (V12): a cena começa quando o muro abre
function afterWall(fn){
  const wall=sec.querySelector(':scope>.gb-chap');
  if(!wall||wall.classList.contains('is-out')){fn();return}
  if(waitingWall)return;waitingWall=true;
  const go=()=>{mo.disconnect();clearTimeout(t);waitingWall=false;setTimeout(()=>{if(!played)fn()},380)};
  const mo=new MutationObserver(()=>{if(!wall.isConnected||wall.classList.contains('is-out'))go()});
  mo.observe(wall,{attributes:true,attributeFilter:['class']});mo.observe(sec,{childList:true});
  const t=setTimeout(go,4000);
}
})();
