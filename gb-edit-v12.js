/* GB IMPORTS / V12 — referência "coleção" (gramática em .claude/skills/gb-ref-motion/SKILL.md).
   A. editorial NÃO É SOBRE TER: carrossel com fantasmas + rastro + entrada em mosaico.
   B. tocar a peça em foco: mosaico de tela cheia monta a página da peça em três colunas (texto · peça · ficha),
      trocando sozinha só entre vistas FOTOGRAFADAS (peça com uma vista só não entra no carrossel).
   Timers só com a seção visível ou durante a visualização; movimento reduzido = sem mosaico nem troca automática. */
(()=>{
'use strict';
if(typeof PUBLIC_PRODUCTS==='undefined')return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const VIEW={combo:'CONJUNTO',top:'SUPERIOR',bottom:'INFERIOR'};
const CAT={track:'AGASALHO',short:'CAMISA + SHORT',extra:'CONJUNTO'};
const viewsOf=p=>{const s=window.GB_ASSETS?.[p.id]||{},seen=new Set();return ['combo','top','bottom'].filter(k=>typeof s[k]==='string'&&!seen.has(s[k])&&seen.add(s[k])).map(k=>({k,src:s[k]}))};
const picks=PUBLIC_PRODUCTS.filter(p=>viewsOf(p).length>1).slice(0,8);
const mosaic=(cls='')=>{const m=document.createElement('div');m.className='gb-mosaic '+cls;m.setAttribute('aria-hidden','true');
  const O=['0 0','100% 0','0 100%','100% 100%','50% 0','50% 100%'];
  m.innerHTML=Array.from({length:12},(_,i)=>{const r=Math.floor(i/4),c=i%4;return `<i style="--d:${(r+c)*70}ms;--o:${O[(r*7+c*3)%O.length]}"></i>`}).join('');return m};
const onceVisible=(el,fn,th=.2)=>{if(reduce.matches||!('IntersectionObserver'in window)){fn();return}const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){fn();io.disconnect()}},{threshold:th});io.observe(el)};

/* ================= A. carrossel com fantasmas ================= */
const model=document.querySelector('#editorial .editorial-model'),host=document.getElementById('editorialProduct');
if(model&&host&&picks.length>2){
  host.classList.add('has-gbc');host.innerHTML='';
  const wrap=document.createElement('div');wrap.className='gbc';wrap.setAttribute('role','group');wrap.setAttribute('aria-roledescription','carrossel');wrap.setAttribute('aria-label','Peças do GB Edit');
  wrap.innerHTML=picks.map((p,i)=>{const src=viewsOf(p)[0].src;return `<div class="gbc-item" data-i="${i}" aria-hidden="true"><span class="gbc-tr"><img alt="" decoding="async" loading="lazy" src="${esc(src)}"/></span><span class="gbc-tr"><img alt="" decoding="async" loading="lazy" src="${esc(src)}"/></span><img alt="${esc(p.name)}" decoding="async" loading="lazy" src="${esc(src)}"/></div>`}).join('');
  host.append(wrap);
  const ui=document.createElement('div');ui.className='gbc-ui';
  ui.innerHTML='<button aria-label="Peça anterior" data-gbc="-1" type="button">←</button><span class="gbc-name" aria-live="polite"></span><span class="gbc-count"></span><button aria-label="Próxima peça" data-gbc="1" type="button">→</button><span class="gbc-bar" aria-hidden="true"><i></i></span>';
  model.append(ui);
  const items=[...wrap.querySelectorAll('.gbc-item')],N=items.length,nameEl=ui.querySelector('.gbc-name'),countEl=ui.querySelector('.gbc-count'),bar=ui.querySelector('.gbc-bar i');
  let c=0,timer=0,visible=false,holdUntil=0;const DW=3200;wrap.style.setProperty('--dwell',DW+'ms');ui.style.setProperty('--dwell',DW+'ms');
  const mod=n=>(n%N+N)%N;
  function layout(dir){
    items.forEach((el,i)=>{const d=mod(i-c);const cls=d===0?'is-c':d===1?'is-r':d===N-1?'is-l':(dir<0?'is-off-l':'');
      el.className='gbc-item '+cls;el.setAttribute('aria-hidden',String(d!==0))});
    if(dir){const el=items[c];void el.offsetWidth;el.classList.add(dir>0?'trail-r':'trail-l')}
    nameEl.textContent=picks[c].name;countEl.textContent=String(c+1).padStart(2,'0')+' / '+String(N).padStart(2,'0');
    if(bar){bar.style.animation='none';void bar.offsetWidth;bar.style.animation=''}
  }
  const go=(d,user)=>{c=mod(c+d);layout(d);if(user)holdUntil=performance.now()+6000};
  let hover=false,swiped=false;
  const tick=()=>{if(!hover&&performance.now()>holdUntil)go(1)};
  const setAuto=()=>{clearInterval(timer);timer=0;const on=visible&&!document.hidden&&!reduce.matches&&!document.body.classList.contains('no-scroll')&&!model.classList.contains('is-galera');wrap.classList.toggle('is-auto',on);if(on)timer=setInterval(tick,DW)};
  layout(0);
  ui.addEventListener('click',e=>{const b=e.target.closest('[data-gbc]');if(b){go(+b.dataset.gbc,true);setAuto()}});
  // o clique vale pela posição (a peça pode estar no meio da troca): centro abre, fantasma vai até ela; arrasto não abre
  wrap.addEventListener('click',e=>{if(swiped){swiped=false;return}
    const r=wrap.getBoundingClientRect(),dx=(e.clientX-r.left)/r.width-.5;
    if(Math.abs(dx)<.24)window.GBPiece?.open(c,items[c]);else{go(dx<0?-1:1,true);setAuto()}});
  wrap.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true},{passive:true});
  wrap.addEventListener('pointerleave',()=>{hover=false},{passive:true});
  wrap.addEventListener('dragstart',e=>e.preventDefault());   // arrastar a foto com mouse não pode virar arrasto nativo de imagem
  // arrasto horizontal troca a peça (a rolagem vertical segue livre)
  let sx=0,sy=0,dragging=false;
  model.addEventListener('pointerdown',e=>{if(e.target.closest('button,a'))return;sx=e.clientX;sy=e.clientY;dragging=true},{passive:true});
  model.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;if(model.classList.contains('is-galera'))return;   // V15: palco com a galera, o arrasto não mexe no carrossel escondido
    const dx=e.clientX-sx,dy=e.clientY-sy;swiped=false;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2){swiped=true;setTimeout(()=>{swiped=false},0);go(dx<0?1:-1,true);setAuto()}},{passive:true});
  model.addEventListener('pointercancel',()=>{dragging=false},{passive:true});
  if('IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>{visible=e.isIntersecting;setAuto()}),{threshold:.25}).observe(model);else{visible=true;setAuto()}
  document.addEventListener('visibilitychange',setAuto);
  window.GBEditCarousel={refresh:setAuto};   // V15 avisa quando troca A GALERA / AS PEÇAS
  new MutationObserver(setAuto).observe(document.body,{attributes:true,attributeFilter:['class']});
  // entrada em mosaico (uma vez)
  if(!reduce.matches){const m=mosaic();m.style.setProperty('--mosaic','#101013');model.append(m);onceVisible(model,()=>requestAnimationFrame(()=>m.classList.add('is-open')),.3);setTimeout(()=>m.remove(),9000)}
}

/* ================= B. página da peça (três colunas) montada em mosaico ================= */
if(!picks.length)return;
const cover=document.createElement('div');cover.className='gbp-mosaic';cover.setAttribute('aria-hidden','true');
cover.innerHTML=Array.from({length:24},(_,i)=>{const r=Math.floor(i/6),c=i%6;return `<i style="--d:${(r+c)*40}ms;--o:${['0 0','100% 0','0 100%','100% 100%'][(r+c)%4]}"></i>`}).join('');
const view=document.createElement('div');view.className='gbp';view.hidden=true;view.id='gbpView';view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-label','Peça');
document.body.append(view,cover);
const DWELL=3600;let cur=-1,slide=0,timer=0,lastFocus=null,busy=false;
function render(i){
  const p=picks[i],v=viewsOf(p);cur=i;slide=0;
  view.innerHTML=`<div class="gbp-col"><span class="gbp-crumb" style="--k:0">${CAT[p.category]||'PEÇA'} · ${String(i+1).padStart(2,'0')} / ${String(picks.length).padStart(2,'0')}</span>
      <h3 class="gbp-head" style="--k:1">UMA PEÇA.<br/>VÁRIOS<br/>CAPÍTULOS.</h3>
      <p class="gbp-text" style="--k:2">Imagem do acervo a validar. As vistas desta peça foram fotografadas e trocam sozinhas; toque numa delas para parar ali.</p></div>
    <div class="gbp-stage">${v.map((x,j)=>`<figure class="gbp-slide${j?'':' is-on'}" data-k="${x.k}"><img alt="${esc(p.name)} / ${VIEW[x.k]}" decoding="async" src="${esc(x.src)}"/></figure>`).join('')}
      <div class="gbp-ticks" role="group" aria-label="Vistas fotografadas">${v.map((x,j)=>`<button type="button" data-go="${j}" aria-current="${j?'false':'true'}"><span>${VIEW[x.k]}</span><i></i></button>`).join('')}</div></div>
    <div class="gbp-col"><h4 class="gbp-name" style="--k:1">${esc(p.name)}</h4>
      <span class="gbp-price" style="--k:2">PREÇO E TAMANHOS: A VALIDAR</span>
      <div class="gbp-chips" role="group" aria-label="Vista" style="--k:3">${v.map((x,j)=>`<button type="button" data-go="${j}" aria-pressed="${j?'false':'true'}">${VIEW[x.k]}</button>`).join('')}</div>
      <div class="gbp-actions" style="--k:4"><button class="btn btn-yellow" data-open type="button">ABRIR DETALHES DA PEÇA <span>↗</span></button>
        <div class="gbp-nav"><button data-step="-1" type="button">← ANTERIOR</button><button data-step="1" type="button">PRÓXIMA →</button></div></div></div>
    <button aria-label="Fechar" class="gbp-close" data-close-gbp type="button">✕</button>`;
  view.style.setProperty('--dwell',DWELL+'ms');
}
function show(j,user){
  const slides=[...view.querySelectorAll('.gbp-slide')];if(!slides.length)return;j=(j+slides.length)%slides.length;
  slides.forEach((s,k)=>s.classList.toggle('is-on',k===j));slide=j;
  view.querySelectorAll('.gbp-ticks [data-go]').forEach((b,k)=>b.setAttribute('aria-current',String(k===j)));
  view.querySelectorAll('.gbp-chips [data-go]').forEach((b,k)=>b.setAttribute('aria-pressed',String(k===j)));
  const t=view.querySelector('.gbp-ticks [aria-current="true"] i');if(t){t.style.display='none';void t.offsetWidth;t.style.display=''}
  if(user){stopAuto();view.classList.add('is-hold')}
}
function auto(){stopAuto();if(reduce.matches||view.querySelectorAll('.gbp-slide').length<2)return;view.classList.add('is-auto');view.classList.remove('is-hold');timer=setInterval(()=>show(slide+1),DWELL)}
function stopAuto(){clearInterval(timer);timer=0}
// mosaico: cobre (blocos crescem em cascata) → troca o conteúdo → revela (blocos recolhem)
function viaMosaic(swap){
  if(reduce.matches){swap();return}
  busy=true;cover.classList.remove('is-reveal');void cover.offsetWidth;cover.classList.add('is-cover');
  setTimeout(()=>{swap();cover.classList.add('is-reveal');cover.classList.remove('is-cover');setTimeout(()=>{cover.classList.remove('is-reveal');busy=false},760)},720);
}
function open(i,from){
  if(busy)return;lastFocus=from||document.activeElement;
  viaMosaic(()=>{render(i);view.hidden=false;view.classList.remove('is-in');document.body.classList.add('no-scroll');
    requestAnimationFrame(()=>requestAnimationFrame(()=>view.classList.add('is-in')));view.querySelector('.gbp-close')?.focus({preventScroll:true});auto()});
}
function close(){
  if(view.hidden||busy)return;stopAuto();
  viaMosaic(()=>{view.hidden=true;view.classList.remove('is-in','is-auto','is-hold');view.innerHTML='';document.body.classList.remove('no-scroll');lastFocus?.focus?.({preventScroll:true})});
}
function step(d){if(busy)return;const n=(cur+d+picks.length)%picks.length;viaMosaic(()=>{render(n);view.classList.add('is-in');auto()})}
view.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){show(+g.dataset.go,true);return}
  if(e.target.closest('[data-close-gbp]')){close();return}
  const st=e.target.closest('[data-step]');if(st){step(+st.dataset.step);return}
  if(e.target.closest('[data-open]')){const p=picks[cur];stopAuto();view.hidden=true;view.innerHTML='';document.body.classList.remove('no-scroll');typeof detailModal==='function'&&detailModal(p)}
});
document.addEventListener('keydown',e=>{if(view.hidden)return;
  if(e.key==='Escape'){e.stopPropagation();close()}
  else if(e.key==='ArrowRight')show(slide+1,true);else if(e.key==='ArrowLeft')show(slide-1,true);
  else if(e.key==='Tab'){const f=[...view.querySelectorAll('button')];if(!f.length)return;const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAuto();else if(!view.hidden&&view.classList.contains('is-auto')&&!view.classList.contains('is-hold'))auto()});
window.GBPiece={open:(i,from)=>open(i,from),close};
})();

/* ================= C. a landing inteira na gramática da referência ================= */
(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
if(reduce.matches||!('IntersectionObserver'in window))return;
const O=['0 0','100% 0','0 100%','100% 100%','50% 0','50% 100%'];
const blocks=(n=24,cols=6)=>Array.from({length:n},(_,i)=>{const r=Math.floor(i/cols),c=i%cols;return `<i style="--d:${(r+c)*45}ms;--o:${O[(r*5+c*3)%O.length]}"></i>`}).join('');

/* abertura: muro de tinta + monograma (SVG) + GB IMPORTS → blocos abrem o hero. Toque/rolagem pula. */
if(document.readyState!=='complete'||scrollY<40){
  const intro=document.createElement('div');intro.className='gb-intro';intro.setAttribute('aria-hidden','true');
  intro.innerHTML=`<div class="gb-intro-grid">${blocks()}</div><div class="gb-intro-mark"><img alt="" src="./assets/brand/gb-monograma-amarelo-preto.svg" width="190" height="127"/><span class="gb-intro-word">${[...'GB IMPORTS'].map((c,i)=>`<span style="--i:${i}">${c===' '?'&nbsp;':c}</span>`).join('')}</span></div>`;
  document.body.append(intro);
  let gone=false;const out=()=>{if(gone)return;gone=true;intro.classList.add('is-out');setTimeout(()=>intro.remove(),1400)};
  requestAnimationFrame(()=>requestAnimationFrame(()=>intro.classList.add('is-on')));
  setTimeout(out,1500);addEventListener('pointerdown',out,{once:true,passive:true});addEventListener('wheel',out,{once:true,passive:true});addEventListener('keydown',out,{once:true});
}

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
