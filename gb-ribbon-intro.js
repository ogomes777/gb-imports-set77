/* GB IMPORTS / SET77 LABS — GLASS RIBBON CINEMATIC V26
 * Original canvas rendering. One loop: fullscreen reveal -> existing hero.
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
const enterAtTop=!reduced.matches&&(!location.hash||location.hash==='#inicio');
if(enterAtTop)document.body.appendChild(host);
else {stage.prepend(host);host.classList.remove('is-opening');}
const canvas=host.querySelector('canvas');
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
if(!ctx)return;
host.classList.remove('is-boot');
const logo=host.querySelector('.gb-ribbon-original');
const signature=host.querySelector('.gb-ribbon-signature');
const bloom=host.querySelector('.gb-ribbon-bloom');
const scan=host.querySelector('.gb-ribbon-scan');
let intro=enterAtTop,settled=!enterAtTop,visibility=true;
let width=1,height=1,pixelRatio=1,raf=0,last=0,t=0,frames=0,paintAvg=0,paintMax=0,firstFrame=0,resizeTimer=0,settleTimeout=0;
// Frame-time feedback keeps the same visual language while lowering detail on weak GPUs.
let quality=0,rollingGap=16,lastQualityChange=0,lastLogoPaint=0,throttledFrames=0;
let sweepHead=1.085,sweepX=1.0,signatureProgress=0;
const pointer={x:.5,y:.5,targetX:.5,targetY:.5,force:0,tap:0};
// The film now holds its mark, then opens two glass doors into the existing hero.
const duration=5450;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const ease=k=>k*k*(3-2*k);
host.classList.add(intro?'is-opening':'is-settled','is-visible');
if(intro)document.documentElement.classList.add('gb-ribbon-intro-playing');
window.GB_GLASS_RIBBON_INTRO=true;
function measure(){
 const r=host.getBoundingClientRect();
 width=Math.max(1,Math.round(r.width));height=Math.max(1,Math.round(r.height));
 pixelRatio=Math.min(devicePixelRatio||1,quality>=2?1:mobile()?1.2:1.35);
 const w=Math.round(width*pixelRatio),h=Math.round(height*pixelRatio);
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
}
function isVisible(){
 if(intro)return true;
 const r=stage.getBoundingClientRect();
 return r.bottom>0&&r.top<innerHeight+100;
}
function alive(){return!reduced.matches&&!document.hidden&&visibility&&isVisible()}
function request(){if(alive()&&!raf)raf=requestAnimationFrame(draw)}
function track(e){
 if(!intro&&!isVisible())return;
 const r=host.getBoundingClientRect();
 if(!r.width||!r.height)return;
 pointer.targetX=clamp((e.clientX-r.left)/r.width,0,1);
 pointer.targetY=clamp((e.clientY-r.top)/r.height,0,1);
 pointer.force=1;
 request();
}
function trackTouch(e){if(e.touches?.[0])track(e.touches[0])}
function touch(e){track(e);pointer.tap=1;pointer.force=1;request()}
window.addEventListener('pointermove',track,{passive:true});
window.addEventListener('pointerdown',touch,{passive:true});
window.addEventListener('touchmove',trackTouch,{passive:true});
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measure();request()},110)},{passive:true});
window.addEventListener('scroll',request,{passive:true});
document.addEventListener('visibilitychange',()=>{last=0;request()},{passive:true});
if('IntersectionObserver'in window){
 new IntersectionObserver(es=>{visibility=intro||!!es[0]?.isIntersecting;request()},{rootMargin:'200px'}).observe(stage);
}
// Match the recorded reference's concentrated luminous S-curve.
// The path comes from below the lower-left corner, flattens through the middle,
// twists into an upper-right ascent. It is ONE continuous bundle of filaments.
const logistic=x=>1/(1+Math.exp(-x));
function spine(u,phase){
 const x=width*(-.145+1.29*u);
 const a=logistic((u-.18)*23);
 const b=logistic((u-.72)*21);
 const breathing=Math.sin(u*7.7+phase*.31)*.013+Math.sin(u*13.0-phase*.16)*.003;
 const drift=Math.sin(phase*.19)*.016;
 const y=height*(1.175-.625*a-.77*b+breathing+drift);
 return [x,y];
}
function strand(u,v,phase){
 // Offsets are measured across the *normal* of the S-curve: no flat fan.
 const e=.002;
 const p=spine(u,phase),prev=spine(Math.max(0,u-e),phase),next=spine(Math.min(1,u+e),phase);
 const dx=next[0]-prev[0],dy=next[1]-prev[1],inv=1/Math.max(1,Math.hypot(dx,dy));
 const nx=-dy*inv,ny=dx*inv;
 // Twisting and pinching make multiple light-threads cross without a rigid strip.
 const twist=Math.sin(u*10.0-phase*.43+v*.20);
 const separation=.28+.72*Math.pow(Math.abs(twist),.78);
 const spread=Math.min(width,height)*(mobile()?.038:.049)*separation;
 const cross=v*spread+v*v*spread*.17*Math.cos(u*14.5+phase*.49);
 const shimmer=Math.sin(u*19.2+phase*.38+v*1.25)*Math.abs(v)*height*.00075;
 const magnet=Math.exp(-Math.pow((u-(pointer.x+.145)/1.29)*3.2,2))*pointer.force*(pointer.y-.5)*height*.031;
 return [p[0]+nx*(cross+shimmer)+ny*magnet*.14,p[1]+ny*(cross+shimmer)+magnet];
}
function trace(path,v,phase,samples,head=0){
 // From right to left, progressive and naturally flexible.
 if(head>=1)return;
 const start=Math.max(0,head);
 for(let i=0;i<=samples;i++){
  const u=start+(1-start)*(i/samples);
  const q=strand(u,v,phase);
  if(!i)path.moveTo(q[0],q[1]);else path.lineTo(q[0],q[1]);
 }
}
function updateLogo(now){
 if(settled||!intro)return;
 // The original SVG is signed by the SAME traveling right-to-left beam.
 const progress=ease(clamp((.765-sweepHead)/.445,0,1));
 signatureProgress=progress;
 const boundary=104-progress*119;
 const edge=[];
 for(let i=10;i>=0;i--){
  const y=i*10;
  const flutter=Math.sin(y*.062+t*.42)*2.7*Math.sin(progress*Math.PI);
  edge.push((boundary+flutter).toFixed(2)+'% '+y.toFixed(2)+'%');
 }
 logo.style.clipPath='polygon(110% 0%,110% 100%,'+edge.join(',')+')';
 scan.style.left=boundary.toFixed(2)+'%';
 scan.style.top='12%';
 signature.style.setProperty('--gb-emerge',clamp(progress*2.5,0,1).toFixed(4));
 bloom.style.opacity=(Math.sin(progress*Math.PI)*.44).toFixed(3);
}
function settle(){
 if(settled)return;
 settled=true;intro=false;
 host.classList.remove('is-opening','is-preparing-entry');
 host.classList.add('is-gateway');
 document.documentElement.classList.remove('gb-ribbon-intro-playing');
 logo.style.clipPath='none';
 clearTimeout(settleTimeout);
 // The page is revealed through a moving central aperture; not a hard cut.
 settleTimeout=setTimeout(()=>{
  stage.prepend(host);
  host.classList.remove('is-gateway');
  host.classList.add('is-settled');
  measure();last=0;request();
 },1080);
}
function draw(now){
 raf=0;if(!alive())return;
 const budget=mobile()?30:16;
 if(last&&now-last<budget){request();return}
 const started=performance.now();
 const elapsed=last?now-last:16;
 const dt=Math.min(elapsed/1000,.20);
 // Frame pacing is a browser/hardware budget, not a fixed artificial animation speed.
 // Quality adapts slowly, so a single camera-recording spike doesn't cause flicker.
 if(frames>8)rollingGap=rollingGap*.91+Math.min(elapsed,250)*.09;
 if(frames>18 && now-lastQualityChange>2000){
   const next=rollingGap>70?Math.min(2,quality+1):rollingGap>37?Math.max(quality,1):rollingGap<26?Math.max(0,quality-1):quality;
   if(next!==quality){quality=next;measure()}
   lastQualityChange=now;
 }
 last=now;if(!firstFrame)firstFrame=now;
 // Preserve cinematic movement speed when rAF drops frames instead of going into slow motion.
 t+=dt;
 const age=now-firstFrame;
 const travel=intro?ease(clamp((age-380)/3030,0,1)):1;
 sweepHead=intro?1.085-travel*1.105:0;
 sweepX=1-travel;
 host.style.setProperty('--gb-sweep',travel.toFixed(4));
 if(intro&&now-firstFrame>4050)host.classList.add('is-preparing-entry');
 if(intro&&now-firstFrame>duration)settle();
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
 trace(centre,0,t,44,head);
 ctx.shadowColor='rgba(207,143,28,.68)';
 ctx.shadowBlur=quality>=2?10:compact?19:32;
 ctx.strokeStyle='rgba(88,61,32,'+(.20*faint)+')';
 ctx.lineWidth=minDim*.16;
 ctx.stroke(centre);
 ctx.shadowBlur=0;
 ctx.strokeStyle='rgba(216,147,27,'+(.25*faint)+')';
 ctx.lineWidth=minDim*.095;ctx.stroke(centre);
 ctx.strokeStyle='rgba(250,200,52,'+(.47*faint)+')';
 ctx.lineWidth=minDim*.041;ctx.stroke(centre);
 ctx.restore();
 // Layer 1: grouped fine gold wires, not a grey S-shaped sheet.
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(let i=0;i<n;i++){
  const v=-1+2*i/(n-1);
  const p=new Path2D();trace(p,v,t,steps,head);
  const core=Math.exp(-v*v*2.2);
  const deep=(i%7===0);
  const light=(i%5===1||i%5===2);
  const opacity=(.48+.49*core)*(1+pointer.tap*.13)*faint;
  ctx.strokeStyle=deep?'rgba(110,64,10,'+(.75*opacity)+')':
    light?'rgba(250,184,31,'+Math.min(.98,1.06*opacity)+')':
    'rgba(161,91,6,'+Math.min(.97,.92*opacity)+')';
  ctx.lineWidth=(compact?.55:.70)+core*.33;
  ctx.stroke(p);
 }
 // Layer 2: the almost-white cores glow against their warm-gold underlay.
 for(let i=0;i<Math.max(5,Math.floor(n/6));i++){
  const v=(i/(Math.max(5,Math.floor(n/6))-1)-.5)*.83;
  const p=new Path2D();trace(p,v,t,steps,head);
  ctx.strokeStyle='rgba(255,246,177,'+(.82*faint)+')';
  ctx.lineWidth=compact?.85:1.12;
  ctx.stroke(p);
 }
 ctx.restore();
 // A luminous leading tip makes the direction of travel unmistakable.
 if(intro&&head>0.015&&head<.995){
   const tip=strand(head,0,t);
   const radius=Math.min(width,height)*(quality>=2?.038:.063);
   const grad=ctx.createRadialGradient(tip[0],tip[1],0,tip[0],tip[1],radius);
   grad.addColorStop(0,'rgba(255,250,203,.85)');
   grad.addColorStop(.18,'rgba(250,199,64,.43)');
   grad.addColorStop(1,'rgba(234,174,51,0)');
   ctx.fillStyle=grad;
   ctx.beginPath();ctx.arc(tip[0],tip[1],radius,0,Math.PI*2);ctx.fill();
 }
 if(intro&&(now-lastLogoPaint>28||frames<2)){updateLogo(now);lastLogoPaint=now}
 const cost=performance.now()-started;
 paintAvg=frames?paintAvg*.93+cost*.07:cost;
 paintMax=Math.max(paintMax,cost);
 frames++;request();
}
function start(){
 measure();
 if(reduced.matches){logo.style.clipPath='none';host.classList.remove('is-opening');host.classList.add('is-settled');return}
 request();
 if(intro)settleTimeout=setTimeout(settle,7600);
}
start();
window.GBGlassRibbons=Object.freeze({
 get active(){return!!raf},get frames(){return frames},
 get opening(){return intro},get settled(){return settled},
 get canvasSize(){return[canvas.width,canvas.height]},
 get pointer(){return[pointer.x,pointer.y]},
 get paintMs(){return[paintAvg,paintMax]},
 get quality(){return quality},get frameGapMs(){return +rollingGap.toFixed(1)},
 get fullGlass(){return getComputedStyle(host.querySelector('.gb-ribbon-glass')).inset==='0px'},
 get logoAsset(){return logo.getAttribute('src')},
 get sweep(){return sweepX},get signatureProgress(){return signatureProgress},
 finish:settle,
 replay(){
  if(reduced.matches)return;
  intro=true;settled=false;firstFrame=0;last=0;lastLogoPaint=0;
  signature.style.removeProperty('--gb-emerge');
  logo.style.clipPath='polygon(110% 0%,110% 100%,110% 100%,110% 0%)';
  sweepHead=1.085;signatureProgress=0;
  host.classList.remove('is-settled','is-gateway','is-preparing-entry');
  document.body.append(host);
  host.classList.add('is-opening','is-visible');
  document.documentElement.classList.add('gb-ribbon-intro-playing');
  clearTimeout(settleTimeout);settleTimeout=setTimeout(settle,7600);
  measure();request();
 }
});
})();
