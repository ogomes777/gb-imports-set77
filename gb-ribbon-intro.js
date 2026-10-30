/* GB IMPORTS / SET77 LABS — GLASS RIBBON CINEMATIC V26
 * Original Canvas2D film only. GPU work ends permanently after the hero opens.
 * No React Bits Pro source copied or implied; Pro requires a licensed registry.
 */
(()=>{
'use strict';
const stage=document.getElementById('heroStage');
if(!stage||window.GBGlassRibbons)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=()=>innerWidth<=780;
const host=document.getElementById('gbRibbonBoot');
if(!host)return;

// Play on every direct landing load; deep links bypass the cinematic cover.
const enterAtTop=!reduced.matches&&(!new URLSearchParams(location.search).has('peca'))&&(!location.hash||location.hash==='#inicio');
if(enterAtTop)document.body.appendChild(host);
else {host.classList.remove('is-opening');}
const canvas=host.querySelector('canvas');
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
if(!ctx)return;
host.classList.remove('is-boot');
const logo=host.querySelector('.gb-ribbon-original');
if(enterAtTop)logo.style.clipPath='none';
const signature=host.querySelector('.gb-ribbon-signature');
const bloom=host.querySelector('.gb-ribbon-bloom');
const scan=host.querySelector('.gb-ribbon-scan');
// Signature is traced from the EXACT existing vector path, never redrawn.
let strokeOutline=null,strokeGlint=null,strokeLength=0,signatureReady=false;
if(enterAtTop){
 fetch('./assets/brand/gb-monograma-amarelo-preto.svg',{cache:'force-cache'})
  .then(r=>{if(!r.ok)throw new Error('SVG unavailable');return r.text()})
  .then(markup=>{
   // A delayed network response must never insert a glowing outline mid-signature.
   // The original GB SVG remains visible and signed by the moving wipe.
   if(settled||parked||signatureProgress>.075)return;
   const doc=new DOMParser().parseFromString(markup,'image/svg+xml');
   const sourcePath=doc.querySelector('svg path');
   if(!sourcePath)return;
   const ns='http://www.w3.org/2000/svg';
   const svg=document.createElementNS(ns,'svg');
   svg.setAttribute('viewBox','0 0 1000 610');
   svg.setAttribute('class','gb-ribbon-ink');
   svg.setAttribute('aria-hidden','true');
   const d=sourcePath.getAttribute('d');
   const make=(cls,weight)=>{
    const el=document.createElementNS(ns,'path');
    el.setAttribute('d',d);el.setAttribute('class',cls);
    el.setAttribute('fill','none');el.setAttribute('stroke-width',String(weight));
    el.setAttribute('stroke-linecap','round');el.setAttribute('stroke-linejoin','round');
    svg.append(el);return el;
   };
   strokeOutline=make('gb-ribbon-ink-outline',8);
   if(!mobile())strokeGlint=make('gb-ribbon-ink-glint',13);
   signature.append(svg);
   strokeLength=strokeOutline.getTotalLength();
   strokeOutline.style.strokeDasharray=strokeLength+' '+strokeLength;
   strokeOutline.style.strokeDashoffset=String(strokeLength);
   if(strokeGlint){
     strokeGlint.style.strokeDasharray=(strokeLength*.075)+' '+(strokeLength*1.2);
     strokeGlint.style.strokeDashoffset=String(strokeLength);
   }
   signatureReady=true;
  }).catch(()=>{signatureReady=false});
}
let intro=enterAtTop,settled=!enterAtTop,visibility=true,parked=false,parkTimer=0,parkAt=0;
let width=1,height=1,pixelRatio=1,raf=0,last=0,t=0,frames=0,paintAvg=0,paintMax=0,firstFrame=0,resizeTimer=0,settleTimeout=0;
// Frame-time feedback keeps the same visual language while lowering detail on weak GPUs.
// Conservative first frames. Increase detail only when the device proves it can render smoothly.
const constrained=(navigator.hardwareConcurrency>0&&navigator.hardwareConcurrency<=4) || (navigator.deviceMemory>0&&navigator.deviceMemory<=4) || Boolean(navigator.connection?.saveData);
// Keep the same renderer resolution from first frame to final signature:
 // changing canvas.width on a slow Edge GPU forces a fresh graphics buffer.
let quality=constrained?2:1,rollingGap=16,lastQualityChange=0,lastLogoPaint=0,throttledFrames=0;
let sweepHead=1.085,sweepX=1.0,signatureProgress=0,logoRevealed=false;
const pointer={x:.5,y:.5,targetX:.5,targetY:.5,force:0,tap:0};
// The film now holds its mark, then opens two glass doors into the existing hero.
const duration=2200;
 const puffOnly=true;
 let visiblePuffAt=0,handoffTimer=0;
 window.addEventListener('gb:plush-first-visible',()=>{visiblePuffAt=performance.now()},{once:true}); // V43: reference plush without the golden ribbons
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const ease=k=>k*k*(3-2*k);
host.classList.add(intro?'is-opening':'is-settled','is-visible');
if(intro)document.documentElement.classList.add('gb-ribbon-intro-playing');
window.GB_GLASS_RIBBON_INTRO=true;
function measure(){
 const r=host.getBoundingClientRect();
 width=Math.max(1,Math.round(r.width));height=Math.max(1,Math.round(r.height));
 // A full-viewport canvas at 1.35x DPR can fill ~1.8x the pixels.
 // Thin filaments are still visually crisp at <=1.05 DPR.
 pixelRatio=Math.min(devicePixelRatio||1,quality>=2?.85:mobile()?1:1.05);
 const w=Math.round(width*pixelRatio),h=Math.round(height*pixelRatio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
}
function isVisible(){return intro&&host.isConnected}
function alive(){return intro&&!parked&&!settled&&!reduced.matches&&!document.hidden&&visibility&&isVisible()}
function request(){if(alive()&&!raf)raf=requestAnimationFrame(draw)}
function track(e){
 if(!intro||settled||!host.isConnected)return;
 const r=host.getBoundingClientRect();
 if(!r.width||!r.height)return;
 pointer.targetX=clamp((e.clientX-r.left)/r.width,0,1);
 pointer.targetY=clamp((e.clientY-r.top)/r.height,0,1);
 pointer.force=1;
 request();
}
function trackTouch(e){if(e.touches?.[0])track(e.touches[0])}
function touch(e){track(e);pointer.tap=1;pointer.force=1;request()}
// Attach pointer listeners only while the fullscreen cinematic film exists.
let linked=false;
const onResize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(intro){measure();request()}},110)};
const onVisibility=()=>{last=0;request()};
function connect(){
 if(linked)return;
 linked=true;
 window.addEventListener('pointermove',track,{passive:true});
 window.addEventListener('pointerdown',touch,{passive:true});
 window.addEventListener('touchmove',trackTouch,{passive:true});
 window.addEventListener('resize',onResize,{passive:true});
 document.addEventListener('visibilitychange',onVisibility,{passive:true});
}
function disconnect(){
 if(!linked)return;
 linked=false;
 window.removeEventListener('pointermove',track);
 window.removeEventListener('pointerdown',touch);
 window.removeEventListener('touchmove',trackTouch);
 window.removeEventListener('resize',onResize);
 document.removeEventListener('visibilitychange',onVisibility);
 clearTimeout(resizeTimer);
}
if(intro&&!reduced.matches)connect();
// V31 | Fluid ribbon: one spring-damped spline and hundreds of hairline lights.
// Cache curve normals once per frame; strands no longer recompute a spline
// three times per sample. The result is more organic and cheaper to draw.
const logistic=x=>1/(1+Math.exp(-x));
const curveCount=100;
const cxCache=new Float32Array(curveCount+1);
const cyCache=new Float32Array(curveCount+1);
const nxCache=new Float32Array(curveCount+1);
const nyCache=new Float32Array(curveCount+1);
const curlCache=new Float32Array(curveCount+1);
const shimmerCache=new Float32Array(curveCount+1);
const magnetCache=new Float32Array(curveCount+1);
const pinchCache=new Float32Array(curveCount+1);
const ribbonPoint=new Float32Array(2);
const sampleCurve=(arr,index,next,f)=>arr[index]+(arr[next]-arr[index])*f;
let compactCurve=false,spreadScale=0;
const flow={bend:0,velocity:0,twist:0,twistVelocity:0,phase:0};
function spring(state,velocity,target,dt,freq=3.8){
 // Analytical critically damped spring. No frame-rate-dependent Euler drift.
 const h=Math.min(dt,.20);
 const displacement=state-target;
 const tangent=velocity+freq*displacement;
 const decay=Math.exp(-freq*h);
 return [target+(displacement+tangent*h)*decay,
   (velocity-freq*tangent*h)*decay];
}
function spine(u,phase){
 const a=logistic((u-.183)*21.5);
 const b=logistic((u-.735)*19.4);
 const taper=Math.sin(u*Math.PI);
 // A living Bezier-like wave, not a wobbling cutout. Endpoints remain outside
 // screen, while middle sections bend with a smooth travelling deformation.
 const longWave=Math.sin(phase*.43+u*5.3)*.027;
 const fineWave=Math.sin(phase*.29-u*8.1)*.010;
 const lift=flow.bend*taper*.052;
 const x=width*(-.145+1.29*u+Math.sin(phase*.30+u*4.3)*taper*.010);
 const y=height*(1.175-.625*a-.77*b+longWave+fineWave*taper+lift);
 return [x,y];
}
function buildCurve(phase){
 compactCurve=mobile();
 spreadScale=Math.min(width,height)*(compactCurve?.036:.049);
 for(let i=0;i<=curveCount;i++){
  const u=i/curveCount;
  const q=spine(u,phase);
  cxCache[i]=q[0];cyCache[i]=q[1];
  const curl=Math.sin(u*10.2-phase*.52+flow.twist*.35);
  curlCache[i]=curl;
  pinchCache[i]=(.22+.78*Math.pow(Math.abs(curl),.76))*(.74+.26*Math.sin(u*Math.PI));
  shimmerCache[i]=Math.sin(u*17.2+phase*.37)*height*.00065;
  magnetCache[i]=Math.exp(-Math.pow((u-(pointer.x+.145)/1.29)*3.1,2))*pointer.force*(pointer.y-.5)*height*.024;
 }
 for(let i=0;i<=curveCount;i++){
  const prev=Math.max(0,i-1),next=Math.min(curveCount,i+1);
  const dx=cxCache[next]-cxCache[prev],dy=cyCache[next]-cyCache[prev];
  const inv=1/Math.max(1,Math.hypot(dx,dy));
  nxCache[i]=-dy*inv;nyCache[i]=dx*inv;
 }
}
function strand(u,v,out=ribbonPoint){
 const position=clamp(u,0,1)*curveCount;
 const index=Math.min(curveCount-1,position|0),f=position-index,next=index+1;
 const nx=sampleCurve(nxCache,index,next,f),ny=sampleCurve(nyCache,index,next,f);
 const lateral=v*spreadScale*sampleCurve(pinchCache,index,next,f);
 const cross=lateral+v*v*lateral*.16*Math.cos(u*12.2+t*.41)+sampleCurve(shimmerCache,index,next,f)*Math.abs(v);
 const magnet=sampleCurve(magnetCache,index,next,f);
 out[0]=sampleCurve(cxCache,index,next,f)+nx*cross+ny*magnet*.10;
 out[1]=sampleCurve(cyCache,index,next,f)+ny*cross+magnet;
 return out;
}
function trace(path,v,samples,head=0){
 if(head>=1)return;
 const beginning=Math.max(0,head);
 for(let i=0;i<=samples;i++){
  const q=strand(beginning+(1-beginning)*(i/samples),v);
  if(!i)path.moveTo(q[0],q[1]);else path.lineTo(q[0],q[1]);
 }
}
function updateLogo(now){
 if(settled||!intro)return;
 // A single stable masking edge avoids blinking from polygon retessellation
 // plus animated nested GPU filters in Edge.
 const progress=ease(clamp((.765-sweepHead)/.445,0,1));
 signatureProgress=progress;
 const edge=100-progress*100;
 if(progress>.998){
   if(!logoRevealed){logo.style.clipPath='none';logoRevealed=true}
 }else if(progress>0.003){
   logo.style.clipPath='inset(0 0 0 '+edge.toFixed(2)+'%)';
 }
 scan.style.left=(100-progress*100).toFixed(2)+'%';
 signature.style.setProperty('--gb-emerge',clamp(progress*2.5,0,1).toFixed(3));
 // The glow remains static. The thin scan-line and ribbon deliver movement.
 if(signatureReady&&strokeOutline){
   const ink=ease(clamp((progress-.04)/.88,0,1));
   strokeOutline.style.strokeDashoffset=String(Math.round(strokeLength*(1-ink)));
   if(strokeGlint){
     strokeGlint.style.strokeDashoffset=String(Math.round(strokeLength*(.93-ink)));
   }
 }
}
// A V35 regression: gb-core scripts started ~3.1s while the signed ribbon still
// rendered, producing 70-120ms main-thread stalls in CPU-throttled Chromium.
// Complete the moving film first, then stop Canvas rAF and show a stable entry
// title BEFORE evaluating storefront scripts. The doors open once boot is done.
function parkForStore(){
 if(parked||settled||!intro)return;
 if(puffOnly){
  parked=true;parkAt=performance.now();cancelAnimationFrame(raf);raf=0;
  host.classList.add('is-preparing-entry','is-render-idle');
  // Boot starts; puff remains visible while the original storefront initializes.
  if(window.GB_BOOT_CORE)window.GB_BOOT_CORE();else settle(true);
  if(window.GB_CORE_READY||window.GB_CORE_FAILED)onCoreReady();
  return;
 }
 parked=true;
 parkAt=performance.now();
 host.classList.add('is-preparing-entry','is-render-idle');
 cancelAnimationFrame(raf);raf=0;
 // CSS title transition finishes while the main thread is free.
 parkTimer=setTimeout(()=>{
  if(settled)return;
  if(window.GB_BOOT_CORE)window.GB_BOOT_CORE();
  else settle(); // standalone or source mode has no staged store boot
 },1100);
 if(window.GB_CORE_READY||window.GB_CORE_FAILED)
  parkTimer=setTimeout(settle,1050);
}
function onCoreReady(){
 if(!parked||settled)return;
 // The store is ready. Allow enough screen time to perceive real fur; never
 // wait forever for a device which cannot draw WebGL.
 const now=performance.now();
 const age=now-firstFrame;
 const wait=visiblePuffAt?Math.max(0,990-(now-visiblePuffAt)):Math.max(0,2900-age);
 clearTimeout(handoffTimer);
 if(wait>0&&age<4550){
  handoffTimer=setTimeout(()=>settle(true),Math.min(wait,4550-age));
 }else settle(true);
}
document.addEventListener('gb:core-ready',onCoreReady);
function settle(force=false){
 if(settled)return;
 // Do not open the glass doors onto a half-initialized storefront.
 // Keep the elegant title visible until the background bundle finishes;
 // a hard failsafe always releases the visitor if the network fails.
 if(!force&&intro&&window.GB_BOOT_CORE&&!window.GB_CORE_READY&&!window.GB_CORE_FAILED&&performance.now()-firstFrame<5200){
   window.GB_BOOT_CORE?.();
   host.classList.add('is-preparing-entry');
   return;
 }
 settled=true;intro=false;
 clearTimeout(parkTimer);clearTimeout(handoffTimer);
 document.removeEventListener('gb:core-ready',onCoreReady);
 host.classList.remove('is-opening','is-preparing-entry','is-render-idle');
 host.classList.add('is-gateway');
 host.style.pointerEvents='none';
 document.documentElement.classList.remove('gb-ribbon-intro-playing');
 logo.style.clipPath='none';
 clearTimeout(settleTimeout);
 // The page is revealed through a moving central aperture; not a hard cut.
 settleTimeout=setTimeout(()=>{
  // Intro-only: no yellow ribbon behind the products, no background GPU loop.
  cancelAnimationFrame(raf);raf=0;
  disconnect();
  host.remove();
  canvas.width=0;canvas.height=0;
  host.classList.remove('is-gateway');
  host.classList.add('is-finished');
 },600);
}
function draw(now){
 raf=0;if(!alive())return;
 if(puffOnly){
  if(!firstFrame)firstFrame=now;
  frames++;
  if(now-firstFrame>=1850)parkForStore();else request();
  return;
 }
 // Never throttle powerful devices below the display's native cadence.
 // Budget mode is reserved for low-end hardware or detected sustained jank.
 const budget=quality>=2?(mobile()?30:24):0;
 if(last&&now-last<budget){request();return}
 const started=performance.now();
 const elapsed=last?now-last:16;
 const dt=Math.min(elapsed/1000,.20);
 // Frame pacing is a browser/hardware budget, not a fixed artificial animation speed.
 // Quality adapts slowly, so a single camera-recording spike doesn't cause flicker.
 if(frames>8)rollingGap=rollingGap*.91+Math.min(elapsed,250)*.09;
 // Adapt only at the very beginning. Switching quality after the ribbon
 // covers half the display caused a costly Canvas backing-store reallocation
 // at exactly the time users observed the end-of-sweep freeze.
 const frameAge=firstFrame?now-firstFrame:0;
 if(frames>12&&frameAge<950&&now-lastQualityChange>500){
   const next=(rollingGap>53||paintAvg>5.5)?2:quality;
   if(next>quality){quality=next;measure()}
   lastQualityChange=now;
 }
 last=now;if(!firstFrame)firstFrame=now;
 // Preserve cinematic movement speed when rAF drops frames instead of going into slow motion.
 t+=dt;
 flow.phase=t;
 const pull=pointer.force*(pointer.y-.5)*1.1;
 const twistTarget=pointer.force*(pointer.x-.5)*.9;
 [flow.bend,flow.velocity]=spring(flow.bend,flow.velocity,pull,dt,4.1);
 [flow.twist,flow.twistVelocity]=spring(flow.twist,flow.twistVelocity,twistTarget,dt,3.5);
 buildCurve(t);
 const age=now-firstFrame;
 const travel=intro?ease(clamp((age-190)/2920,0,1)):1;
 sweepHead=intro?1.085-travel*1.105:0;
 sweepX=1-travel;
 host.style.setProperty('--gb-sweep',travel.toFixed(4));
 // Keep ribbon and signature uninterrupted until ~2.85s.
 // No storefront script is evaluated during the moving/inking frames.
 if(intro&&age>=3380)host.classList.add('is-preparing-entry');
 const k=1-Math.exp(-dt*3.9);
 pointer.x=lerp(pointer.x,pointer.targetX,k);
 pointer.y=lerp(pointer.y,pointer.targetY,k);
 pointer.force*=Math.exp(-dt*1.65);
 pointer.tap*=Math.exp(-dt*3.2);
 ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
 ctx.clearRect(0,0,width,height);
 const compact=mobile();
 const n=compact?(quality>=2?17:quality===1?24:34):(quality>=2?28:quality===1?38:54);
 const steps=compact?(quality>=2?28:40):(quality>=2?38:52);
 const faint=settled?.59:1;
 const head=intro?sweepHead:0;
 const minDim=Math.min(width,height);
 // Ambient golden light. Three broad strokes only; shadows on every thin
 // filament would burn mobile GPU resources.
 ctx.save();
 ctx.lineJoin='round';ctx.lineCap='round';
 const centre=new Path2D();
 trace(centre,0,44,head);
 // The fat ambient halo now uses translucent strokes, not shadowBlur.
 // Blurring a 100+ pixel-wide path whose visible length grows to full screen
 // makes some integrated GPUs stall near the lower-left end of the sweep.
 ctx.shadowBlur=0;
 ctx.strokeStyle='rgba(183,135,48,'+(.16*faint)+')';
 ctx.lineWidth=minDim*.15;
 ctx.stroke(centre);
 ctx.strokeStyle='rgba(216,147,27,'+(.25*faint)+')';
 ctx.lineWidth=minDim*.095;ctx.stroke(centre);
 ctx.strokeStyle='rgba(250,200,52,'+(.47*faint)+')';
 ctx.lineWidth=minDim*.041;ctx.stroke(centre);
 ctx.restore();
 // Layer 1: grouped fine gold wires, not a grey S-shaped sheet.
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<n;i++){
  const v=-1+2*i/(n-1);
  ctx.beginPath();trace(ctx,v,steps,head);
  const core=Math.exp(-v*v*2.2);
  const deep=(i%7===0);
  const light=(i%5===1||i%5===2);
  const opacity=(.48+.49*core)*(1+pointer.tap*.13)*faint;
  ctx.strokeStyle=deep?'rgba(110,64,10,'+(.75*opacity)+')':
    light?'rgba(250,184,31,'+Math.min(.98,1.06*opacity)+')':
    'rgba(161,91,6,'+Math.min(.97,.92*opacity)+')';
  ctx.lineWidth=(compact?.55:.70)+core*.33;
  ctx.stroke();
 }
 // Layer 2: the almost-white cores glow against their warm-gold underlay.
 for(let i=0;i<Math.max(5,Math.floor(n/6));i++){
  const v=(i/(Math.max(5,Math.floor(n/6))-1)-.5)*.83;
  ctx.beginPath();trace(ctx,v,steps,head);
  ctx.strokeStyle='rgba(255,246,177,'+(.82*faint)+')';
  ctx.lineWidth=compact?.85:1.12;
  ctx.stroke();
 }
 ctx.restore();
 // A luminous leading tip makes the direction of travel unmistakable.
 if(intro&&head>0.015&&head<.995){
   const tip=strand(head,0);
   const radius=Math.min(width,height)*(quality>=2?.038:.063);
   const grad=ctx.createRadialGradient(tip[0],tip[1],0,tip[0],tip[1],radius);
   grad.addColorStop(0,'rgba(255,250,203,.85)');
   grad.addColorStop(.18,'rgba(250,199,64,.43)');
   grad.addColorStop(1,'rgba(234,174,51,0)');
   ctx.fillStyle=grad;
   ctx.beginPath();ctx.arc(tip[0],tip[1],radius,0,Math.PI*2);ctx.fill();
 }
 if(intro&&(now-lastLogoPaint>(mobile()?48:33)||frames<2)){updateLogo(now);lastLogoPaint=now}
 const cost=performance.now()-started;
 paintAvg=frames?paintAvg*.93+cost*.07:cost;
 paintMax=Math.max(paintMax,cost);
 frames++;
 if(intro&&age>=3380)parkForStore();
 else request();
}
function start(){
 if(!intro||reduced.matches){
  // Deep product links and reduced-motion users have zero intro canvas cost.
  host.remove();canvas.width=0;canvas.height=0;
  return;
 }
 if(puffOnly){
  firstFrame=performance.now();frames=0;request();
  // Guaranteed release even if a chunk fails, hangs or never emits the event.
  settleTimeout=setTimeout(()=>{if(!settled){window.GB_BOOT_CORE?.();settle(true)}},6400);
 }else{
  measure();request();settleTimeout=setTimeout(()=>settle(true),11800);
 }
}
start();
window.GBGlassRibbons=Object.freeze({
 get active(){return!!raf},get frames(){return frames},
 get parked(){return parked},get parkAt(){return parkAt},
 get removed(){return!host.isConnected},
 get opening(){return intro},get settled(){return settled},
 get canvasSize(){return[canvas.width,canvas.height]},
 get pointer(){return[pointer.x,pointer.y]},
 get paintMs(){return[paintAvg,paintMax]},
 get quality(){return quality},get frameGapMs(){return +rollingGap.toFixed(1)},
 get fullGlass(){return getComputedStyle(host.querySelector('.gb-ribbon-glass')).inset==='0px'},
 get logoAsset(){return logo.getAttribute('src')},
 get sweep(){return sweepX},get signatureProgress(){return signatureProgress},
 get flowBend(){return +flow.bend.toFixed(4)},get flowTwist(){return +flow.twist.toFixed(4)},
 get signatureInkReady(){return signatureReady},get puffOnly(){return puffOnly},
 finish:()=>{window.GB_BOOT_CORE?.();settle(true)},
 replay(){
  if(reduced.matches)return;
  intro=true;settled=false;parked=false;parkAt=0;firstFrame=0;last=0;lastLogoPaint=0;
  signature.style.removeProperty('--gb-emerge');
  logo.style.clipPath='inset(0 0 0 100%)';
  logoRevealed=false;
  sweepHead=1.085;signatureProgress=0;
  if(strokeOutline)strokeOutline.style.strokeDashoffset=String(strokeLength);
  if(strokeGlint)strokeGlint.style.strokeDashoffset=String(strokeLength);
  host.classList.remove('is-finished','is-settled','is-gateway','is-preparing-entry');
  document.body.append(host);
  host.classList.add('is-opening','is-visible');
  document.documentElement.classList.add('gb-ribbon-intro-playing');
  clearTimeout(settleTimeout);settleTimeout=setTimeout(()=>settle(true),6400);
  connect();if(!puffOnly)measure();request();
 }
});
})();
