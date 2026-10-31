/* GB IMPORTS / V49.2 SHOWROOM NEON ARRIVAL
 * A reusable entry signature: later (when the FEATURE is central), slower,
 * and replayed on every genuine re-entry, from above or below.
 * Zero permanent loops, no external dependencies, no modifications to
 * original Tech Fleece, cold-room, cinematic intro or product swap code.
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
 const effects=document.createElement('div');
 effects.className='gb49-arrival-vfx';
 effects.setAttribute('aria-hidden','true');
 effects.innerHTML='<i class="gb49-lightshaft"></i><i class="gb49-portal"></i><i class="gb49-neon-impact"></i><i class="gb49-flare"></i><i class="gb49-particles"></i>';
 feature.appendChild(effects);

 const current=()=>media.querySelector('.sf-layer.is-on');
 const readyMedia=()=>!!current()?.children.length;
 const accessible=()=>!motion.matches&&!lite();
 const blocked=()=>!!document.getElementById('gbRibbonBoot')
   ||document.body.classList.contains('gb-experience-open')
   ||!!document.querySelector('.product-modal:not([hidden])');
 let state='idle',entered=0,plays=0,initialLayer=null,lastScrollY=scrollY;
 let lastDirection='down',startDirection='down',lastCoverage=0,frame=0,finishTimer=0,ready=false;
 const duration=direction=>{
   const mobile=innerWidth<=720;
   return mobile?(direction==='up'?1040:1160):(direction==='up'?1380:1550);
 };

 function geometry(){
   const r=feature.getBoundingClientRect();
   const v=Math.max(1,innerHeight);
   const visible=Math.max(0,Math.min(r.bottom,v)-Math.max(r.top,0));
   // Some devices render the feature taller than the viewport. Normalize
   // to its visible potential rather than an impossible element ratio.
   const available=Math.min(Math.max(1,r.height),v);
   return{
     coverage:visible/available,
     centered:r.top<=v*.49&&r.bottom>=v*.51,
     top:r.top,bottom:r.bottom
   };
 }
 const setState=name=>{
   state=name;
   section.classList.toggle('gb49-cued',name==='armed'&&accessible());
   section.classList.toggle('gb49-entering',name==='playing');
   section.classList.toggle('gb49-complete',name==='done');
 };
 function finish(){
   clearTimeout(finishTimer);finishTimer=0;
   if(state==='playing'){setState('done');return}
   if(state==='armed'){setState('done');return}
   if(state==='idle')setState('done');
 }
 function arm(){
   if(!readyMedia())return;
   ready=true;
   initialLayer=current();
   if(!accessible()){setState('done');return}
   // Only hide the media when safely offstage, never during reading/swipe.
   setState('armed');
 }
 function play(){
   if(state!=='armed'||!readyMedia()||blocked())return;
   if(!accessible()){finish();return}
   startDirection=lastDirection;
   initialLayer=current();
   section.style.setProperty('--gb49-duration',duration(startDirection)+'ms');
   section.classList.toggle('gb49-returning',startDirection==='up');
   setState('playing');
   plays++;
   // Remove animation styles once they have finished. Small safety margin
   // covers mobile compositing without extending the apparent animation.
   finishTimer=setTimeout(finish,duration(startDirection)+110);
 }
 function evaluate(){
   frame=0;
   const y=scrollY,dy=y-lastScrollY;
   if(Math.abs(dy)>.7)lastDirection=dy<0?'up':'down';
   lastScrollY=y;
   const g=geometry();
   lastCoverage=g.coverage;
   if(!ready){
     if(readyMedia()){
       // If media lazily appears while already centered, arm and play on
       // the next meaningful geometry evaluation.
       arm();
     }else return;
   }
   if(motion.matches||lite()){
     if(state==='playing'||state==='armed')finish();
     return;
   }
   if(state==='playing'&&g.coverage<=.08){
     // Fast flick / overscroll: reveal cleanly, then re-arm safely offscreen.
     finish();
   }
   if((state==='done'||state==='idle')&&g.coverage<=.08){
     arm();
   }
   if(state==='armed'&&g.coverage>=.58&&g.centered&&!blocked()){
     play();
   }
   // Do not re-arm while the user remains in the section, even when the
   // animation ends and the user changes variants or reverses direction.
 }
 const update=()=>{if(!frame)frame=requestAnimationFrame(evaluate)};
 const observer=new IntersectionObserver(update,{
   threshold:[0,.08,.15,.28,.4,.55,.58,.7,.85,1],
   rootMargin:'0px'
 });
 observer.observe(feature);
 const mediaObserver=new MutationObserver(()=>{
   if(!ready&&readyMedia())update();
   else if(state==='playing'&&current()&&current()!==initialLayer)finish();
 });
 mediaObserver.observe(media,{
   childList:true,subtree:true,attributes:true,attributeFilter:['class']
 });
 addEventListener('scroll',update,{passive:true});
 addEventListener('resize',update,{passive:true});
 document.addEventListener('visibilitychange',()=>{
   if(document.hidden&&state==='playing')finish();
   else if(!document.hidden)update();
 });
 document.addEventListener('gb:core-ready',update,{once:true});
 document.addEventListener('gb:puff-closed',update);
 // Customer interaction wins, including touch on the main product.
 feature.addEventListener('pointerdown',()=>{if(state==='playing')finish()},{passive:true});
 section.addEventListener('click',e=>{
   if(state==='playing'&&e.target.closest('[data-show-index],[data-show-view]'))finish();
 });
 motion.addEventListener?.('change',update);
 const destroy=()=>{
   clearTimeout(finishTimer);
   cancelAnimationFrame(frame);
   observer.disconnect();mediaObserver.disconnect();
   removeEventListener('scroll',update);removeEventListener('resize',update);
   document.removeEventListener('gb:puff-closed',update);
   section.classList.remove('gb49-cued','gb49-entering','gb49-returning');
   effects.remove();
 };
 addEventListener('pagehide',destroy,{once:true});
 // First evaluation, but respect lazy loading and cinematic intro.
 update();
 window.GBShowroomArrivalV49={
   get ready(){return ready},
   get playing(){return state==='playing'},
   get activated(){return plays>0},
   get completed(){return state==='done'},
   get armed(){return state==='armed'},
   get state(){return state},
   get playCount(){return plays},
   get lastDirection(){return startDirection},
   get coverage(){return lastCoverage},
   get activeColor(){return document.querySelector('#showroomSelector button.active')?.dataset.showIndex??null},
   finish
 };
})();
