/* GB IMPORTS / V12 — GB EDIT (gramática em .claude/skills/gb-ref-motion/SKILL.md).
   A. editorial NÃO É SOBRE TER: carrossel com fantasmas + rastro + entrada em mosaico.
   B. GB EDIT: grade → cortina amarela com "GB IMPORTS" embaralhando → página da peça em mosaico,
      trocando sozinha só entre vistas FOTOGRAFADAS (peça com uma vista só não entra).
   Timers só com a seção visível ou durante a visualização; movimento reduzido = sem cortina/mosaico/troca automática. */
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
  const tick=()=>{if(performance.now()>holdUntil)go(1)};
  const setAuto=()=>{clearInterval(timer);timer=0;const on=visible&&!document.hidden&&!reduce.matches&&!document.body.classList.contains('no-scroll');wrap.classList.toggle('is-auto',on);if(on)timer=setInterval(tick,DW)};
  layout(0);
  ui.addEventListener('click',e=>{const b=e.target.closest('[data-gbc]');if(b){go(+b.dataset.gbc,true);setAuto()}});
  wrap.addEventListener('click',e=>{if(e.target.closest('.gbc-item.is-c')&&typeof detailModal==='function')detailModal(picks[c])});
  // arrasto horizontal troca a peça (a rolagem vertical segue livre)
  let sx=0,sy=0,dragging=false;
  model.addEventListener('pointerdown',e=>{if(e.target.closest('button,a'))return;sx=e.clientX;sy=e.clientY;dragging=true},{passive:true});
  model.addEventListener('pointerup',e=>{if(!dragging)return;dragging=false;const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2){go(dx<0?1:-1,true);setAuto()}},{passive:true});
  model.addEventListener('pointercancel',()=>{dragging=false},{passive:true});
  if('IntersectionObserver'in window)new IntersectionObserver(es=>es.forEach(e=>{visible=e.isIntersecting;setAuto()}),{threshold:.25}).observe(model);else{visible=true;setAuto()}
  document.addEventListener('visibilitychange',setAuto);
  new MutationObserver(setAuto).observe(document.body,{attributes:true,attributeFilter:['class']});
  // entrada em mosaico (uma vez)
  if(!reduce.matches){const m=mosaic();m.style.setProperty('--mosaic','#101013');model.append(m);onceVisible(model,()=>requestAnimationFrame(()=>m.classList.add('is-open')),.3);setTimeout(()=>m.remove(),9000)}
}

/* ================= B. GB EDIT ================= */
const sec=document.getElementById('gbedit'),grid=document.getElementById('gbeGrid');
if(!sec||!grid)return;
if(!picks.length){sec.hidden=true;return}
grid.innerHTML=picks.map((p,i)=>{const v=viewsOf(p);return `<button class="gbe-tile" data-gbe="${i}" style="--i:${i}" type="button" aria-label="Abrir ${esc(p.name)}">
  <span class="gbe-frame"><img alt="" decoding="async" loading="lazy" src="${esc(v[0].src)}"/><span class="gbe-views" aria-hidden="true">${v.map(()=>'<i></i>').join('')}</span></span>
  <span class="gbe-cap"><b>${esc(p.name)}</b><small>${CAT[p.category]||'PEÇA'} ↗</small></span></button>`}).join('');
const count=document.getElementById('gbeCount');if(count)count.textContent=String(picks.length).padStart(2,'0')+' PEÇAS';
onceVisible(sec,()=>sec.classList.add('is-in'),.12);

const curtain=document.createElement('div');curtain.className='gbe-curtain';curtain.setAttribute('aria-hidden','true');curtain.innerHTML='<span class="gbe-curtain-word"></span>';
const view=document.createElement('div');view.className='gbe-view';view.hidden=true;view.id='gbeView';view.setAttribute('role','dialog');view.setAttribute('aria-modal','true');view.setAttribute('aria-label','Peça do GB Edit');
document.body.append(view,curtain);
const word=curtain.firstChild,WORD='GB IMPORTS',GLYPHS='GBIMPORTS✳/#',DWELL=3600;
let cur=-1,slide=0,timer=0,scr=0,lastFocus=null,busy=false;

function scramble(){clearInterval(scr);let t=0;scr=setInterval(()=>{t++;word.textContent=[...WORD].map((ch,i)=>ch===' '||t>4+i*1.2?ch:GLYPHS[(Math.random()*GLYPHS.length)|0]).join('');if(t>4+WORD.length*1.2){clearInterval(scr);word.textContent=WORD}},42)}
function render(i){
  const p=picks[i],v=viewsOf(p);cur=i;slide=0;
  view.innerHTML=`<div class="gbe-stage">${v.map((x,j)=>`<figure class="gbe-slide${j?'':' is-on'}" data-k="${x.k}"><img alt="${esc(p.name)} / ${VIEW[x.k]}" decoding="async" src="${esc(x.src)}"/></figure>`).join('')}
    <div class="gbe-ticks" role="group" aria-label="Vistas fotografadas">${v.map((x,j)=>`<button type="button" data-go="${j}" aria-current="${j?'false':'true'}"><span>${VIEW[x.k]}</span><i></i></button>`).join('')}</div></div>
    <div class="gbe-info"><span class="gbe-crumb" style="--k:0">GB EDIT / ${CAT[p.category]||'PEÇA'} · ${String(i+1).padStart(2,'0')} DE ${String(picks.length).padStart(2,'0')}</span>
      <h3 class="gbe-title" style="--k:1">${esc(p.name)}<em>${v.length} vistas fotografadas</em></h3>
      <span class="gbe-price" style="--k:2">PREÇO E TAMANHOS: A VALIDAR</span>
      <p class="gbe-desc" style="--k:3">Imagem do acervo a validar. As vistas trocam sozinhas; toque numa delas para parar ali.</p>
      <div class="gbe-chips" role="group" aria-label="Vista" style="--k:4">${v.map((x,j)=>`<button type="button" data-go="${j}" aria-pressed="${j?'false':'true'}">${VIEW[x.k]}</button>`).join('')}</div>
      <div class="gbe-actions" style="--k:5"><button class="btn btn-yellow" data-open type="button">ABRIR DETALHES DA PEÇA <span>↗</span></button></div>
      <div class="gbe-nav" style="--k:6"><button data-step="-1" type="button">← ANTERIOR</button><button data-step="1" type="button">PRÓXIMA →</button></div></div>
    <button aria-label="Fechar" class="gbe-close" data-close-gbe type="button">✕</button>`;
  view.style.setProperty('--dwell',DWELL+'ms');
  if(!reduce.matches){const m=mosaic();view.querySelector('.gbe-stage').append(m);setTimeout(()=>m.classList.add('is-open'),60);setTimeout(()=>m.remove(),1800)}
}
function show(j,user){
  const slides=[...view.querySelectorAll('.gbe-slide')];if(!slides.length)return;j=(j+slides.length)%slides.length;if(j===slide&&!user)return;
  slides.forEach((s,k)=>{s.classList.toggle('is-on',k===j);s.classList.toggle('is-out',k===slide&&k!==j)});
  // quem saiu volta para baixo sem animar (senão atravessaria o palco de volta)
  setTimeout(()=>slides.forEach((s,k)=>{if(k!==j&&s.classList.contains('is-out')){s.style.transition='none';s.classList.remove('is-out');void s.offsetWidth;s.style.transition=''}}),950);
  slide=j;
  view.querySelectorAll('.gbe-ticks [data-go]').forEach((b,k)=>b.setAttribute('aria-current',String(k===j)));
  view.querySelectorAll('.gbe-chips [data-go]').forEach((b,k)=>b.setAttribute('aria-pressed',String(k===j)));
  const t=view.querySelector('.gbe-ticks [aria-current="true"] i');if(t){t.style.display='none';void t.offsetWidth;t.style.display=''}
  if(user){stopAuto();view.classList.add('is-hold')}
}
function auto(){stopAuto();if(reduce.matches||view.querySelectorAll('.gbe-slide').length<2)return;view.classList.add('is-auto');view.classList.remove('is-hold');timer=setInterval(()=>show(slide+1),DWELL)}
function stopAuto(){clearInterval(timer);timer=0}
function enter(i){
  render(i);view.hidden=false;view.classList.remove('is-leaving','is-in');document.body.classList.add('no-scroll');
  requestAnimationFrame(()=>requestAnimationFrame(()=>view.classList.add('is-in')));
  view.querySelector('.gbe-close')?.focus({preventScroll:true});auto();
}
function open(i,from){
  if(busy)return;lastFocus=from||document.activeElement;
  if(reduce.matches){enter(i);return}
  busy=true;word.textContent='';curtain.classList.remove('is-lift');void curtain.offsetWidth;curtain.classList.add('is-cover');setTimeout(scramble,160);
  setTimeout(()=>{enter(i);curtain.classList.add('is-lift');curtain.classList.remove('is-cover');setTimeout(()=>{curtain.classList.remove('is-lift');busy=false},680)},900);
}
function close(){
  if(view.hidden)return;stopAuto();
  const done=()=>{view.hidden=true;view.classList.remove('is-leaving','is-in','is-auto','is-hold');view.innerHTML='';document.body.classList.remove('no-scroll');lastFocus?.focus?.({preventScroll:true})};
  if(reduce.matches){done();return}
  view.classList.add('is-leaving');setTimeout(done,380);
}
function step(d){const n=(cur+d+picks.length)%picks.length;if(reduce.matches){render(n);view.classList.add('is-in');return}
  view.classList.remove('is-in');setTimeout(()=>{render(n);requestAnimationFrame(()=>view.classList.add('is-in'));auto()},260)}
grid.addEventListener('click',e=>{const b=e.target.closest('.gbe-tile');if(b)open(+b.dataset.gbe,b)});
view.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){show(+g.dataset.go,true);return}
  if(e.target.closest('[data-close-gbe]')){close();return}
  const st=e.target.closest('[data-step]');if(st){step(+st.dataset.step);return}
  if(e.target.closest('[data-open]')){const p=picks[cur];close();setTimeout(()=>typeof detailModal==='function'&&detailModal(p),reduce.matches?0:400)}
});
document.addEventListener('keydown',e=>{if(view.hidden)return;
  if(e.key==='Escape'){e.stopPropagation();close()}
  else if(e.key==='ArrowRight')show(slide+1,true);else if(e.key==='ArrowLeft')show(slide-1,true);
  else if(e.key==='Tab'){const f=[...view.querySelectorAll('button')];if(!f.length)return;const a=f[0],z=f[f.length-1];
    if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus()}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus()}}},true);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAuto();else if(!view.hidden&&view.classList.contains('is-auto')&&!view.classList.contains('is-hold'))auto()});
window.GBEdit={open:i=>open(i),close};
})();
