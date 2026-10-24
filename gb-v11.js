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
  // régua de progresso + brilho na borda (camada própria, só transform)
  const fx=document.createElement('span');fx.className='gb-island-fx';fx.setAttribute('aria-hidden','true');fx.innerHTML='<i class="gb-island-sheen"></i><i class="gb-island-progress"></i>';header.prepend(fx);
  const bar=fx.querySelector('.gb-island-progress');let pq=false;
  const prog=()=>{pq=false;const max=document.documentElement.scrollHeight-innerHeight;bar.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max).toFixed(4):0})`};
  addEventListener('scroll',()=>{if(!pq){pq=true;requestAnimationFrame(prog)}},{passive:true});prog();
  // link da seção atual acende
  const links=[...header.querySelectorAll('.desktop-nav a[href^="#"]')],targets=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if(targets.length&&'IntersectionObserver'in window){const vis=new Map();
    const io=new IntersectionObserver(es=>{es.forEach(e=>vis.set(e.target,e.isIntersecting));const cur=targets.find(t=>vis.get(t));links.forEach(a=>a.classList.toggle('is-here',!!cur&&a.getAttribute('href')==='#'+cur.id))},{rootMargin:'-45% 0px -50% 0px'});
    targets.forEach(t=>io.observe(t))}
}

/* ---------- 2. tema claro/escuro (sol/lua) sobre o motor de temas da V05: claro = ORIGEM, escuro = SINAL ---------- */
const toggle=document.getElementById('gbThemeToggle');
if(window.GBSetTheme){
  let saved=null;try{saved=localStorage.getItem('gb-theme')}catch(e){}
  if(saved==='trama')window.GBSetTheme(0,true);                                   // TRAMA saiu: vira o claro
  else if(!saved&&matchMedia('(prefers-color-scheme: dark)').matches)window.GBSetTheme(2,false);   // 1ª visita segue o sistema
}
if(toggle){
  const sync=()=>{const dark=document.body.dataset.gbTheme==='sinal';toggle.setAttribute('aria-checked',String(dark));toggle.setAttribute('aria-label',dark?'Tema claro':'Tema escuro');toggle.title=dark?'Tema claro':'Tema escuro'};
  toggle.addEventListener('click',()=>{const dark=document.body.dataset.gbTheme==='sinal';window.GBSetTheme?.(dark?0:2)});
  addEventListener('gb:themechange',sync);sync();
}

/* ---------- 3. hero: trio com luz própria; flutuação só com o hero em tela ---------- */
const hero=document.getElementById('inicio');
const addGlow=()=>document.querySelectorAll('#heroTrio .trio-obj').forEach(o=>{if(!o.querySelector('.trio-glow')){const g=document.createElement('span');g.className='trio-glow';g.setAttribute('aria-hidden','true');o.prepend(g)}});
addGlow();if(!document.querySelector('#heroTrio'))addEventListener('load',addGlow,{once:true});
const heroStage=document.getElementById('heroStage');
if(heroStage&&!heroStage.querySelector('.gb-stage-lights')){const l=document.createElement('div');l.className='gb-stage-lights';l.setAttribute('aria-hidden','true');
  l.innerHTML='<i class="gb-beam b1"></i><i class="gb-beam b2"></i><i class="gb-beam b3"></i><i class="gb-stage-halo"></i><i class="gb-stage-floor"></i>';heroStage.prepend(l)}
if(hero&&'IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>hero.classList.toggle('gb-hero-live',e.isIntersecting&&!reduce.matches)),{threshold:.05}).observe(hero);

/* ---------- 3b. duas faixas de categorias (catálogo real; marcas entram quando a GB confirmar a lista) ---------- */
const mq=document.getElementById('gbMarquee');
if(mq&&typeof PUBLIC_PRODUCTS!=='undefined'&&typeof matchesQuery==='function'){
  const GROUPS=[['CONJUNTOS','conjunto'],['AGASALHOS',null,'track'],['CAMISA + SHORT',null,'short'],['CAMISAS DE TIME','camisa'],['CAMISETAS','camiseta'],['POLOS','polo'],['MOLETONS','moletom'],['JAQUETAS','jaqueta'],['BERMUDAS','bermuda'],['BONÉS','boné'],['TÊNIS','tênis'],['KITS','kit']];
  const items=GROUPS.map(([label,term,cat])=>({label,term,cat,n:PUBLIC_PRODUCTS.filter(p=>cat?p.category===cat:matchesQuery(p,term)).length})).filter(g=>g.n>0);
  const chip=g=>`<a class="gb-mq-chip" href="#colecao" data-mq-term="${g.term||''}" data-mq-cat="${g.cat||''}">${g.label}<sup>${String(g.n).padStart(2,'0')}</sup><i aria-hidden="true">✳</i></a>`;
  const half=Math.ceil(items.length/2),rowA=items,rowB=[...items.slice(half),...items.slice(0,half)];
  // conteúdo duplicado = laço sem emenda; a cópia fica fora da árvore de acessibilidade e do Tab
  const fill=(track,list)=>{track.innerHTML=list.map(chip).join('')+`<span aria-hidden="true" style="display:contents">${list.map(chip).join('').replace(/<a /g,'<a tabindex="-1" ')}</span>`};
  const tracks=mq.querySelectorAll('.gb-mq-track');fill(tracks[0],rowA);fill(tracks[1],rowB);
  mq.addEventListener('click',e=>{const a=e.target.closest('.gb-mq-chip');if(!a)return;e.preventDefault();
    const term=a.dataset.mqTerm,cat=a.dataset.mqCat,input=document.getElementById('catalogSearch');
    if(typeof selectFilter==='function')selectFilter(cat||'all');
    if(input){input.value=term||'';input.dispatchEvent(new Event('input',{bubbles:true}))}
    document.getElementById('colecao')?.scrollIntoView({behavior:reduce.matches?'auto':'smooth'})});
  if('IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>mq.classList.toggle('is-live',e.isIntersecting)),{rootMargin:'100px 0px'}).observe(mq);else mq.classList.add('is-live');
}

/* ---------- 4. Tech Fleece: piso de luz fria sob a peça ---------- */
const media=document.getElementById('showroomFeatureMedia');
if(media&&!media.parentElement.querySelector('.sf-floor')){const f=document.createElement('span');f.className='sf-floor';f.setAttribute('aria-hidden','true');media.before(f)}
})();
