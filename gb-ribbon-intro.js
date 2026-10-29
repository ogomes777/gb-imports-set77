/* GB IMPORTS / SET77 LABS | Glass Ribbon Reveal v25
   Original Canvas2D ribbon engine, designed for the existing static flagship.
   This is not a copy of the licensed React Bits Pro component.
*/
(()=>{
'use strict';
const stage=document.getElementById('heroStage');
if(!stage)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const isMobile=()=>innerWidth<780;
const host=document.createElement('div');
host.className='gb-ribbon-layer';
host.setAttribute('aria-hidden','true');
host.innerHTML='<div class="gb-ribbon-glass"><i class="gb-ribbon-glass-edge"></i><i class="gb-ribbon-glass-reflection"></i></div>'+
  '<canvas class="gb-ribbon-canvas"></canvas>'+
  '<div class="gb-ribbon-signature"><span class="gb-ribbon-logo-halo"></span>'+
  '<img src="./assets/brand/gb-monograma-claro.svg" alt="" width="380" height="254" decoding="async"/>'+
  '<span class="gb-ribbon-label">GB IMPORTS</span></div>'+
  '<span class="gb-ribbon-beam"></span>';
const enterAtTop=!reduce.matches&&scrollY<64;
if(enterAtTop)document.body.append(host);else stage.prepend(host);
const canvas=host.querySelector('canvas');
const cx=canvas.getContext('2d',{alpha:true,desynchronized:true});
if(!cx){host.remove();return}
window.GB_GLASS_RIBBON_INTRO=true;
let opening=enterAtTop;
let ended=!opening,visible=true,raf=0,last=0,clock=0,w=1,h=1,dpr=1,frames=0,started=0,resizeTimer;
let avgPaintMs=0,maxPaintMs=0;
const pointer={x:.5,y:.5,tx:.5,ty:.5,strength:0,charge:0};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=x=>x*x*(3-2*x);
host.classList.add(opening?'is-opening':'is-settled','is-visible');
if(opening)document.documentElement.classList.add('gb-intro-playing');
function size(){
 const r=host.getBoundingClientRect();
 w=Math.max(1,Math.round(r.width));h=Math.max(1,Math.round(r.height));
 dpr=Math.min(devicePixelRatio||1,isMobile()?1.25:1.5);
 const W=Math.round(w*dpr),H=Math.round(h*dpr);
 if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
 cx.setTransform(dpr,0,0,dpr,0,0);
}
function inView(){
 if(opening)return true;
 const r=stage.getBoundingClientRect();
 return r.bottom>-120&&r.top<innerHeight+120;
}
function viable(){return !document.hidden&&!reduce.matches&&visible&&inView()}
function request(){if(viable()&&!raf)raf=requestAnimationFrame(render)}
function move(e){
 if(!opening&&!visible)return;
 const r=host.getBoundingClientRect();
 if(!r.width||!r.height)return;
 pointer.tx=clamp((e.clientX-r.left)/r.width,0,1);
 pointer.ty=clamp((e.clientY-r.top)/r.height,0,1);
 pointer.strength=1;request();
}
function touch(e){if(e.touches&&e.touches[0])move(e.touches[0])}
function flash(){pointer.charge=1;pointer.strength=1;request()}
window.addEventListener('pointermove',move,{passive:true});
window.addEventListener('touchmove',touch,{passive:true});
window.addEventListener('pointerdown',e=>{move(e);flash()},{passive:true});
window.addEventListener('scroll',request,{passive:true});
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{size();request()},110)},{passive:true});
document.addEventListener('visibilitychange',request,{passive:true});
if('IntersectionObserver'in window){
 new IntersectionObserver(entries=>{visible=opening||!!entries[0]?.isIntersecting;request()},{rootMargin:'180px'}).observe(stage);
}
function settle(){
 if(ended)return;
 ended=true;opening=false;
 host.classList.remove('is-opening');
 host.classList.add('is-seating');
 document.documentElement.classList.remove('gb-intro-playing');
 setTimeout(()=>{
  stage.prepend(host);
  host.classList.remove('is-seating');
  host.classList.add('is-settled');
  size();request();
 },260);
}
function render(now){
 raf=0;if(!viable())return;
 const budget=isMobile()?31:17;
 if(now-last<budget){request();return}
 const paintStart=performance.now();
 const dt=last?Math.min((now-last)/1000,.05):.017;
 last=now;if(!started)started=now;clock+=dt;
 if(opening&&now-started>2440)settle();
 const k=1-Math.exp(-dt*7);
 pointer.x=lerp(pointer.x,pointer.tx,k);
 pointer.y=lerp(pointer.y,pointer.ty,k);
 pointer.strength*=Math.exp(-dt*1.7);
 pointer.charge*=Math.exp(-dt*3.2);
 cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,w,h);
 const mobile=isMobile(),short=Math.min(w,h);
 const ca=Math.cos(mobile?-.47:-.36),sa=Math.sin(mobile?-.47:-.36);
 const centerX=w*(mobile?.5:.57),centerY=h*(mobile?.49:.52);
 const length=Math.max(w,h)*1.56;
 const unit=short*(mobile?.37:.48);
 const alpha=opening?1:.72;
 const wave=u=>Math.sin(u*7.6-clock*.26)*.53+Math.sin(u*12.2+clock*.17)*.16;
 function route(path,samples){
  for(let j=0;j<=samples;j++){
   const u=j/samples;
   const x=(u-.5)*length;
   const y=wave(u)*unit;
   const X=centerX+x*ca-y*sa,Y=centerY+x*sa+y*ca;
   if(!j)path.moveTo(X,Y);else path.lineTo(X,Y);
  }
 }
 // One blurred base ribbon, not dozens of costly per-line shadows.
 cx.save();cx.globalCompositeOperation='screen';
 for(let glow=1;glow>=0;glow--){
  const p=new Path2D();route(p,56);
  cx.strokeStyle=glow===0?'rgba(255,242,188,.065)':'rgba(206,152,51,.075)';
  cx.lineWidth=unit*(.16+glow*.15);
  cx.shadowBlur=glow===1?12:6;
  cx.shadowColor='rgba(224,171,55,.32)';
  cx.stroke(p);
 }
 cx.restore();
 cx.save();cx.globalCompositeOperation='screen';
 const wires=mobile?18:30,samples=mobile?34:50;
 for(let i=0;i<wires;i++){
  const v=i/(wires-1)*2-1;
  const t=ease((v+1)*.5),bright=Math.exp(-v*v*2.9);
  const R=Math.round(lerp(248,205,t)),G=Math.round(lerp(245,151,t)),B=Math.round(lerp(230,53,t));
  const p=new Path2D();
  for(let j=0;j<=samples;j++){
   const u=j/samples;
   const turn=u*10.1+clock*.5;
   const width=Math.cos(turn)*v*unit*.21;
   const influence=Math.exp(-Math.pow((u-pointer.x)*4.2,2))*pointer.strength*unit*.19*(pointer.y-.5);
   const y=wave(u)*unit+width+influence+v*unit*.07;
   const x=(u-.5)*length+Math.sin(turn)*v*unit*.052;
   const X=centerX+x*ca-y*sa,Y=centerY+x*sa+y*ca;
   if(!j)p.moveTo(X,Y);else p.lineTo(X,Y);
  }
  cx.lineCap='round';cx.lineJoin='round';
  cx.strokeStyle='rgba('+R+','+G+','+B+','+clamp((.28+bright*.65)*(1+pointer.strength*.18+pointer.charge*.46)*alpha,.02,1)+')';
  cx.lineWidth=(mobile?.55:.82)+bright*.36;
  cx.stroke(p);
 }
 const p=new Path2D();route(p,56);
 cx.strokeStyle='rgba(255,254,239,'+(.28*alpha+pointer.charge*.22)+')';
 cx.lineWidth=mobile?.9:1.15;cx.stroke(p);
 cx.restore();
 const paintMs=performance.now()-paintStart;
 avgPaintMs=frames?avgPaintMs*.93+paintMs*.07:paintMs;maxPaintMs=Math.max(maxPaintMs,paintMs);
 frames++;request();
}
function start(){
 size();
 if(reduce.matches){host.classList.remove('is-opening');host.classList.add('is-settled');return}
 request();
 if(opening)setTimeout(settle,3000);
}
start();
window.GBGlassRibbons=Object.freeze({
 get active(){return !!raf},get frames(){return frames},
 get opening(){return opening},get settled(){return ended},
 get canvasSize(){return[canvas.width,canvas.height]},
 get paintMs(){return[avgPaintMs,maxPaintMs]},
 get pointer(){return[pointer.x,pointer.y]},
 finish:settle,
 replay(){
  if(reduce.matches)return;
  ended=false;opening=true;started=0;
  host.classList.remove('is-settled','is-seating');
  document.body.append(host);
  host.classList.add('is-opening','is-visible');
  document.documentElement.classList.add('gb-intro-playing');
  size();request();
 }
});
})();
