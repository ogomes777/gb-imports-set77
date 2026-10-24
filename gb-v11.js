/* GB IMPORTS / V11 — ilha de navegação (encolhe ao rolar e troca de tom pela seção embaixo), menu de tema no topo,
   trio do hero vivo só com o hero em tela, piso de luz no palco Tech Fleece. Sem loop de rAF próprio: só eventos. */
(()=>{
'use strict';
const header=document.querySelector('.site-header.gb-island');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- 1. ilha: compacta ao rolar + tom da seção sob ela ---------- */
if(header){
  // o tom vem do fundo real da seção embaixo da ilha (funciona com os três temas e com o congelamento do showroom)
  const rgbOf=el=>{
    for(let n=el;n&&n!==document.documentElement;n=n.parentElement){
      if(n===header||header.contains(n))continue;
      const cs=getComputedStyle(n);let m=cs.backgroundColor.match(/[\d.]+/g);
      if(m&&(m.length<4||+m[3]>.5))return m.map(Number);
      if(cs.backgroundImage&&cs.backgroundImage!=='none'){m=cs.backgroundImage.match(/rgba?\(([^)]+)\)/);if(m){const v=m[1].split(',').map(Number);if(v.length<4||v[3]>.5)return v}}
    }
    return [244,241,232];
  };
  const toneAt=()=>{
    const r=header.getBoundingClientRect(),y=Math.min(innerHeight-1,r.bottom+10),x=innerWidth/2;
    const el=document.elementFromPoint(x,y);if(!el)return null;
    const sr=el.closest('#showroom');
    if(sr&&!sr.querySelector('.showroom-heading.is-warm'))return 'ice';
    const [R,G,B]=rgbOf(el),L=(.2126*R+.7152*G+.0722*B)/255;
    if(R>200&&G>165&&B<130)return 'yellow';
    return L>.55?'light':'dark';
  };
  let tone='',compact=null,queued=false,last=0;
  const update=()=>{queued=false;last=performance.now();
    const c=scrollY>48;if(c!==compact){compact=c;header.classList.toggle('is-compact',c)}
    const t=toneAt();if(t&&t!==tone){tone=t;header.dataset.tone=t}};
  // no máximo ~8 leituras por segundo durante a rolagem, mais uma ao parar
  let tail=0;
  const onScroll=()=>{clearTimeout(tail);tail=setTimeout(update,140);if(queued||performance.now()-last<120)return;queued=true;requestAnimationFrame(update)};
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll,{passive:true});
  addEventListener('gb:themechange',()=>setTimeout(update,60));
  const sh=document.querySelector('#showroom .showroom-heading');
  if(sh&&'MutationObserver'in window)new MutationObserver(()=>setTimeout(update,80)).observe(sh,{attributes:true,attributeFilter:['class']});
  addEventListener('load',update);update();
}

/* ---------- 2. menu de tema (ORIGEM / TRAMA / SINAL) ---------- */
const btn=document.getElementById('gbThemeBtn'),menu=document.getElementById('gbThemeMenu'),cur=document.getElementById('gbThemeCurrent');
if(btn&&menu){
  const open=v=>{menu.hidden=!v;btn.setAttribute('aria-expanded',String(v));if(v)menu.querySelector('.selected,.gb-theme-option')?.focus({preventScroll:true})};
  btn.addEventListener('click',e=>{e.stopPropagation();open(menu.hidden)});
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&e.target!==btn)open(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){open(false);btn.focus()}});
  const names={origem:'ORIGEM',trama:'TRAMA',sinal:'SINAL'};
  const sync=id=>{if(cur&&names[id])cur.textContent=names[id]};
  sync(document.body.dataset.gbTheme||'origem');
  addEventListener('gb:themechange',e=>{sync(e.detail?.theme);if(!menu.hidden){open(false);btn.focus({preventScroll:true})}});
}

/* ---------- 3. hero: trio com luz própria; flutuação só com o hero em tela ---------- */
const hero=document.getElementById('inicio');
const addGlow=()=>document.querySelectorAll('#heroTrio .trio-obj').forEach(o=>{if(!o.querySelector('.trio-glow')){const g=document.createElement('span');g.className='trio-glow';g.setAttribute('aria-hidden','true');o.prepend(g)}});
addGlow();if(!document.querySelector('#heroTrio'))addEventListener('load',addGlow,{once:true});
if(hero&&'IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>hero.classList.toggle('gb-hero-live',e.isIntersecting&&!reduce.matches)),{threshold:.05}).observe(hero);

/* ---------- 4. Tech Fleece: piso de luz fria sob a peça ---------- */
const media=document.getElementById('showroomFeatureMedia');
if(media&&!media.parentElement.querySelector('.sf-floor')){const f=document.createElement('span');f.className='sf-floor';f.setAttribute('aria-hidden','true');media.before(f)}
})();
