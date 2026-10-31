/* GB IMPORTS / V49 SHOWROOM NEON ARRIVAL
 * The real graphite Tech Fleece (catalog default) rises into the cold chamber
 * with a travelling blue light and restrained radial neon impact.
 * It does not draw or replace clothes, touch catalogue data, GSAP timelines,
 * intro boot, the 3D snowflake or the existing colour swap mechanism.
 * CSS transforms/opacity only, and never a permanent animation loop.
 */
(()=>{
'use strict';
const section=document.getElementById('showroom');
const feature=section?.querySelector('.showroom-feature');
const media=feature?.querySelector('#showroomFeatureMedia');
if(!section||!feature||!media||window.GBShowroomArrivalV49)return;
const motion=matchMedia('(prefers-reduced-motion: reduce)');
const saveData=!!navigator.connection?.saveData;
const lite=()=>saveData||!!window.GBMotion?.Prefs?.lite;
let ready=false,played=false,playing=false,activated=false,observer=null,mediaObserver=null,release=0;
const effects=document.createElement('div');
effects.className='gb49-arrival-vfx';
effects.setAttribute('aria-hidden','true');
effects.innerHTML='<i class="gb49-lightshaft"></i><i class="gb49-portal"></i><i class="gb49-neon-impact"></i><i class="gb49-flare"></i><i class="gb49-particles"></i>';
feature.appendChild(effects);
const current=()=>media.querySelector('.sf-layer.is-on');
const readyMedia=()=>!!current()?.children.length;
const accessible=()=>!motion.matches&&!lite();
const revealNow=()=>{
 if(played)return;
 played=true;playing=false;
 clearTimeout(release);
 section.classList.remove('gb49-cued','gb49-entering');
 section.classList.add('gb49-complete');
};
function play(){
 if(played||playing)return;
 if(!readyMedia()){revealNow();return}
 if(!accessible()){revealNow();return}
 // Never trigger underneath an open dialog or while the cinematic intro
 // is covering the landing. The first real arrival will still animate.
 if(document.getElementById('gbRibbonBoot')||document.body.classList.contains('gb-experience-open'))return;
 playing=true;
 activated=true;
 ready=true;
 section.classList.remove('gb49-cued');
 section.classList.add('gb49-entering');
 // Automatically remove the GPU animation hints once the 1.2s reveal ends.
 release=setTimeout(revealNow,1350);
}
function arm(){
 if(ready||played)return;
 if(!readyMedia())return;
 initialLayer=current();
 ready=true;
 if(!accessible()){revealNow();return}
 section.classList.add('gb49-cued');
 observer=new IntersectionObserver(entries=>{
  if(!entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.16))return;
  play();
  if(playing||played){observer?.disconnect();observer=null}
 },{threshold:[0,.16,.3],rootMargin:'0px 0px -5% 0px'});
 observer.observe(feature);
 // The component can already be visible when the JS boots, especially
 // on an intentional #showroom deep link.
 requestAnimationFrame(()=>{
  if(played||playing)return;
  const r=feature.getBoundingClientRect(),vh=innerHeight;
  const visible=Math.max(0,Math.min(vh,r.bottom)-Math.max(0,r.top));
  if(visible/Math.max(1,Math.min(vh,r.height))>.34)play();
 });
}
mediaObserver=new MutationObserver(()=>{
 if(!ready)arm();
 else if(playing){
  // Any manual product change during the reveal wins immediately;
  // never animate a newly selected colour as if it were the default.
  const active=current();
  if(active&&active!==initialLayer)revealNow();
 }
});
let initialLayer=null;
mediaObserver.observe(media,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
function guardArm(){
 if(ready)return;
 if(readyMedia())arm();
}
guardArm();
const wake=()=>{if(!ready)guardArm();else if(!played&&!playing)play()};
document.addEventListener('gb:core-ready',guardArm,{once:true});
document.addEventListener('gb:puff-closed',wake);
feature.addEventListener('pointerdown',()=>{if(playing)revealNow()},{passive:true});
section.addEventListener('click',e=>{
 if(playing&&e.target.closest('[data-show-index],[data-show-view]'))revealNow();
});
motion.addEventListener?.('change',()=>{if(motion.matches)revealNow()});
addEventListener('pagehide',()=>{
 clearTimeout(release);observer?.disconnect();mediaObserver?.disconnect();
 document.removeEventListener('gb:puff-closed',wake);
},{once:true});
window.GBShowroomArrivalV49={
 get ready(){return ready},
 get playing(){return playing},
 get activated(){return activated},
 get completed(){return played},
 get activeColor(){return document.querySelector('#showroomSelector button.active')?.dataset.showIndex??null},
 finish:revealNow
};
})();
