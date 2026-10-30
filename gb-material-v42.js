/* GB Imports V43 | Exact original user-supplied PlushTile bootstrap.
 * React/WebGL2 loads separately from the storefront core; a safe local GB
 * image stays present until an actually-rendered nonblack GPU frame arrives.
 * No gold ribbons, no remote textures, no boot dependency on this animation.
 */
(()=>{
 'use strict';
 const host=document.getElementById('gbRibbonBoot'),film=window.GBGlassRibbons;
 if(!host||!film?.opening||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const logo='./assets/brand/gb-monograma-amarelo-preto.svg';
 host.classList.add('gb-material-v42','gb-puff-v43');
 const stage=document.createElement('div');
 stage.className='gb-material-stage';
 stage.setAttribute('aria-label','GB Imports, assinatura de pelúcia');
 stage.innerHTML='<div class="gb-material-aura"></div><div class="gb-plush-fallback"><img src="'+logo+'" alt="GB Imports" draggable="false"></div><div class="gb-plush-react-root"></div>';
 host.append(stage);
 const mount=stage.querySelector('.gb-plush-react-root');
 const fallback=stage.querySelector('.gb-plush-fallback');
 let done=false,ready=false,started=false,failed=false,script=null,observer=null,entryTimer=0,loadTimer=0;
 function finish(){
  if(done)return;done=true;
  clearTimeout(entryTimer);clearTimeout(loadTimer);
  try{window.GBPlushV43?.finish()}catch{}
  if(script){script.onerror=null;script.onload=null}
  observer?.disconnect();stage.remove();
  document.removeEventListener('keydown',skip);
 }
 function skip(e){
  if(e.key==='Escape'&&film.opening){e.preventDefault();film.finish()}
 }
 function frame(){
  if(done||ready)return;
  ready=true;
  stage.classList.add('gb-plush-ready');
  window.GB_PUFF_RENDERED=true;
 }
 function start(){
  if(started||done)return;started=true;
  const src=window.GB_PLUSH_BUNDLE_SRC;
  if(!src){failed=true;return}
  stage.addEventListener('gb:plush-ready',frame,{once:true});
  script=document.createElement('script');script.async=true;script.src=src;
  script.onerror=()=>{failed=true;script=null};
  script.onload=()=>{if(done)return;try{window.GBPlushV43?.mount(mount)}catch(e){failed=true}};
  document.head.append(script);
  // Loading the original code must never block the original GB asset or
  // the navigation. The fallback is intentionally permanent if it fails.
  loadTimer=setTimeout(()=>{if(!ready)failed=true},1650);
 }
 observer=new MutationObserver(()=>{
  if(!host.isConnected||host.classList.contains('is-gateway')||host.classList.contains('is-finished'))finish();
 });
 observer.observe(host,{attributes:true,attributeFilter:['class']});
 observer.observe(document.body,{childList:true});
 document.addEventListener('keydown',skip);
 if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:180});
 else entryTimer=setTimeout(start,20);
 window.GBMaterialSignatureV42=Object.freeze({
  get mode(){return ready?'original-originkit-webgl2':failed?'fallback':'loading'},
  get asset(){return logo},get stopped(){return done},get verified(){return ready},
  get strands(){return ready?null:0},get artworkReady(){return ready},
  get frames(){return ready?1:0},get buffer(){return null},
  finish
 });
 window.GBPuffV43=Object.freeze({
  get ready(){return ready},get failed(){return failed},get stopped(){return done},
  get originalSource(){return true},skip:()=>film.finish()
 });
})();
