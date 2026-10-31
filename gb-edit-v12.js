/* GB IMPORTS / V12 — gramática da referência "coleção" na landing (ver .claude/skills/gb-ref-motion/SKILL.md).
   O carrossel de peças do editorial e a página da peça em três colunas saíram na V15, a pedido:
   o palco do NÃO É SOBRE TER agora é do encontro de Gui e Vitin (gb-encounter-v15). Fica a parte C. */
/* ================= C. a landing inteira na gramática da referência ================= */
(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
if(reduce.matches||!('IntersectionObserver'in window))return;
const O=['0 0','100% 0','0 100%','100% 100%','50% 0','50% 100%'];
const blocks=(n=24,cols=6)=>Array.from({length:n},(_,i)=>{const r=Math.floor(i/cols),c=i%cols;return `<i style="--d:${(r+c)*45}ms;--o:${O[(r*5+c*3)%O.length]}"></i>`}).join('');

/* abertura: muro de tinta + monograma (SVG) + GB IMPORTS → blocos abrem o hero. Toque/rolagem pula.
   Com a intro do puff (V45) ela não começa sozinha: o puff a chama em dourado no meio do mergulho, como os muros
   amarelos dos capítulos (window.GBEditOpening({gold, hold})). */
const opening=({gold=false,hold=1500,defer=false}={})=>{
  if(document.querySelector('.gb-intro'))return null;
  const intro=document.createElement('div');intro.className='gb-intro'+(gold?' is-gold':'')+(defer?' is-staged':'');intro.setAttribute('aria-hidden','true');
  const mark=gold?'./assets/brand/gb-monograma-preto.svg':'./assets/brand/gb-monograma-amarelo-preto.svg';
  intro.innerHTML=`<div class="gb-intro-grid">${blocks()}</div><div class="gb-intro-mark"><img alt="" src="${mark}" width="190" height="127" decoding="async"/><span class="gb-intro-word">${[...'GB IMPORTS'].map((c,i)=>`<span style="--i:${i}">${c===' '?'&nbsp;':c}</span>`).join('')}</span></div>`;
  document.body.append(intro);
  let gone=false,played=false;const out=()=>{if(gone)return;gone=true;intro.classList.add('is-out');setTimeout(()=>intro.remove(),1400)};
  // staged (defer): built and laid out ahead of time, invisible; play() only flips classes — no DOM work mid-dive
  const play=()=>{if(played)return;played=true;intro.classList.remove('is-staged');
    requestAnimationFrame(()=>requestAnimationFrame(()=>intro.classList.add('is-on')));
    setTimeout(out,hold);addEventListener('pointerdown',out,{once:true,passive:true});addEventListener('wheel',out,{once:true,passive:true});addEventListener('keydown',out,{once:true})};
  const drop=()=>{if(!played)intro.remove()};
  if(!defer)play();
  return {play,drop};
};
window.GBEditOpening=opening;
if(!window.GB_GLASS_RIBBON_INTRO&&(document.readyState!=='complete'||scrollY<40))opening();

/* capítulos: cada seção chega num muro de cor com a palavra; a palavra sobe e os blocos abrem a seção (uma vez) */
const CH=[['#rail','EM <em>MOVIMENTO</em>',0],['#colecao','CURADORIA',1],['#editorial','<em>SER.</em>',0],['#categorias','SEU <em>JEITO</em>',1],['#lookstudio','SEU <em>LOOK</em>',0],['#universo','<em>PRÓXIMO</em>',1]];
CH.forEach(([sel,word,ink])=>{
  const sec=document.querySelector(sel);if(!sec||sec.querySelector(':scope>.gb-chap'))return;
  if(getComputedStyle(sec).position==='static')sec.classList.add('gb-chap-host');
  const r=sec.getBoundingClientRect();if(r.top<innerHeight*.8&&r.bottom>0)return;   // já está na tela ao carregar: não cobre
  const ch=document.createElement('div');ch.className='gb-chap'+(ink?' is-ink':'');ch.setAttribute('aria-hidden','true');
  ch.innerHTML=`<div class="gb-chap-grid">${blocks()}</div><div class="gb-chap-word"><span>${word}</span></div>`;
  sec.prepend(ch);
  const io=new IntersectionObserver(es=>{if(!es.some(e=>e.isIntersecting))return;io.disconnect();
    ch.classList.add('is-on');setTimeout(()=>ch.classList.add('is-out'),720);setTimeout(()=>ch.remove(),2200)},{threshold:0,rootMargin:'0px 0px -22% 0px'});
  io.observe(sec);
});
})();
