/* GB IMPORTS / V06 — direção de movimento da flagship.
 * Hero com capítulos automáticos (pausáveis), transição de marca GB, header que lê o fundo,
 * revelação de títulos por linha e pausa de animações fora da tela.
 * Tudo progressivo: sem JS ou com movimento reduzido, a página continua completa e estática.
 */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
if(typeof heroSlides==='undefined'||typeof changeHero!=='function')return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(pointer:fine)').matches;
const hasIO='IntersectionObserver'in window;
const stage=q('#heroStage');

/* ---------- GB WIPE: cortina amarela com o monograma (0 / 90 / 180 ms, como no manual V1) ---------- */
const wipe=document.createElement('div');wipe.className='gb-wipe';wipe.setAttribute('aria-hidden','true');
wipe.innerHTML='<img src="./assets/brand/gb-monograma-preto.svg" alt="" decoding="async"><span>GB / THE EDIT</span>';
document.body.appendChild(wipe);
let wiping=false;
window.gbWipe=function(cb){
  if(reduced||wiping){cb();return}
  wiping=true;wipe.classList.add('is-cover');
  setTimeout(()=>{cb();requestAnimationFrame(()=>{wipe.classList.add('is-reveal');setTimeout(()=>{wipe.classList.remove('is-cover','is-reveal');wiping=false},560)})},380);
};
q('.hero-cta .btn-yellow')?.addEventListener('click',e=>{e.preventDefault();window.gbWipe(()=>q('#colecao').scrollIntoView({behavior:'auto'}))});

/* ---------- HERO: intro curta, capítulos automáticos com barra de progresso e pausa ---------- */
const sceneTag=q('#heroSceneTag'),sceneName=q('#heroSceneName');
if(sceneName)sceneName.textContent=heroSlides[heroIndex].product.name;
const openScene=()=>detailModal(heroSlides[heroIndex].product);
sceneTag?.addEventListener('click',openScene);
q('#heroProduct')?.addEventListener('click',openScene);

const bar=q('#heroProgress'),toggle=q('#heroAuto');
const pauses=new Set();
function setPaused(){const p=pauses.size>0;stage.classList.toggle('hero-paused',p);if(toggle){toggle.setAttribute('aria-pressed',String(pauses.has('user')));toggle.setAttribute('aria-label',pauses.has('user')?'Retomar capítulos automáticos':'Pausar capítulos automáticos');toggle.textContent=pauses.has('user')?'▶':'❚❚'}}
function restartBar(){if(!bar||reduced)return;bar.classList.remove('run');void bar.offsetWidth;bar.classList.add('run')}
if(!reduced&&bar){
  stage.classList.add('hero-autoplay');
  bar.addEventListener('animationend',()=>{changeHero(heroIndex+1);restartBar()});
  ['heroPrev','heroNext'].forEach(id=>q('#'+id)?.addEventListener('click',restartBar));
  toggle?.addEventListener('click',()=>{pauses.has('user')?pauses.delete('user'):pauses.add('user');setPaused()});
  if(fine){stage.addEventListener('pointerenter',()=>{pauses.add('hover');setPaused()});stage.addEventListener('pointerleave',()=>{pauses.delete('hover');setPaused()})}
  stage.addEventListener('focusin',()=>{pauses.add('focus');setPaused()});stage.addEventListener('focusout',e=>{if(!stage.contains(e.relatedTarget)){pauses.delete('focus');setPaused()}});
  document.addEventListener('visibilitychange',()=>{document.hidden?pauses.add('tab'):pauses.delete('tab');setPaused()});
  if(hasIO)new IntersectionObserver(en=>{en[0].isIntersecting?pauses.delete('view'):pauses.add('view');setPaused()},{threshold:.35}).observe(stage);
  // diálogos abertos também pausam
  new MutationObserver(()=>{document.body.classList.contains('no-scroll')?pauses.add('dialog'):pauses.delete('dialog');setPaused()}).observe(document.body,{attributes:true,attributeFilter:['class']});
  restartBar();setPaused();
}else if(toggle){toggle.hidden=true}

if(!reduced){
  stage.classList.add('is-intro');document.body.classList.add('gb-intro');
  setTimeout(()=>{stage.classList.remove('is-intro');document.body.classList.remove('gb-intro')},2100);
}
// Profundidade sob o cursor: só transform, só em ponteiro fino, um rAF por movimento.
if(fine&&!reduced){
  let pend=false,px=0,py=0;
  stage.addEventListener('pointermove',e=>{const r=stage.getBoundingClientRect();px=(e.clientX-r.left)/r.width-.5;py=(e.clientY-r.top)/r.height-.5;if(pend)return;pend=true;requestAnimationFrame(()=>{stage.style.setProperty('--px',px.toFixed(3));stage.style.setProperty('--py',py.toFixed(3));pend=false})},{passive:true});
  stage.addEventListener('pointerleave',()=>{stage.style.setProperty('--px','0');stage.style.setProperty('--py','0')});
}

/* ---------- HEADER: lê o fundo da seção sob ele (claro / escuro) ---------- */
const header=q('.site-header');
const dark=qa('.hero,.shop-entry,.showroom-section,.editorial-film,.manifesto,.editorial-break,.footer');
if(header&&hasIO){
  const under=new Set();let io;
  const build=()=>{io?.disconnect();const h=header.getBoundingClientRect().bottom||70;
    io=new IntersectionObserver(en=>{en.forEach(x=>x.isIntersecting?under.add(x.target):under.delete(x.target));header.classList.toggle('is-dark',under.size>0)},{rootMargin:`-${Math.round(h)}px 0px -${Math.max(0,Math.round(innerHeight-h-2))}px 0px`});
    dark.forEach(s=>io.observe(s))};
  build();let rt=0;addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(build,200)},{passive:true});
}

/* ---------- Títulos revelados por linha (apenas quando cada <br> é filho direto) ---------- */
if(hasIO&&!reduced){
  const heads=qa('.section-collection h2,.look-intro h2,.identity-copy h2,.manifesto-main h2,.how-heading h2,.community-content h2,.showroom-heading h2,.editorial-copy h2');
  const lio=new IntersectionObserver(en=>en.forEach(x=>{if(x.isIntersecting){x.target.classList.add('lines-in');lio.unobserve(x.target)}}),{threshold:.3});
  heads.forEach(h=>{
    if(qa('br',h).some(br=>br.parentElement!==h))return;
    h.innerHTML=h.innerHTML.split(/<br\s*\/?>/i).map((l,i)=>`<span class="hl" style="--l:${i}"><span>${l}</span></span>`).join('');
    h.classList.add('split-ready');lio.observe(h);
  });
}

/* ---------- Animações contínuas pausadas fora da tela ---------- */
if(hasIO){
  const loops=qa('.hero,.gb-identity,.editorial-film,.community-section,.look-studio,.colorlab-section');
  const pio=new IntersectionObserver(en=>en.forEach(x=>x.target.classList.toggle('is-offscreen',!x.isIntersecting)),{rootMargin:'120px 0px'});
  loops.forEach(s=>pio.observe(s));
}

/* ---------- Navegação mobile: item ativo conforme a seção ---------- */
const navLinks=qa('.mobile-shop-nav a[href^="#"]');
if(hasIO&&navLinks.length){
  const targets=navLinks.map(a=>q(a.getAttribute('href'))).filter(Boolean);
  const nio=new IntersectionObserver(en=>en.forEach(x=>{if(x.isIntersecting){navLinks.forEach(a=>{const on=a.getAttribute('href')==='#'+x.target.id;a.classList.toggle('is-current',on);on?a.setAttribute('aria-current','true'):a.removeAttribute('aria-current')})}}),{rootMargin:'-45% 0px -50% 0px'});
  targets.forEach(t=>nio.observe(t));
}
})();
