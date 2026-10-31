/* GB IMPORTS / SET77 | HERO COSMOS V46
 * Lightweight 3D-projected star trails behind ORIGINAL Tech Fleece imagery.
 * One shared GBMotion ticker, zero extra rAF or Three.js runtime. Curves
 * produce the cosmic spatial language while remaining safe on mobile.
 */
(()=>{
'use strict';
const M=window.GBMotion,stage=document.getElementById('heroStage'),art=document.getElementById('heroArt');
if(!M?.Ticker||!M?.onVisible||!stage||!art||!window.GBHeroStage)return;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const canvas=document.createElement('canvas');canvas.id='gbHeroCosmosV46';canvas.className='gb-hero-cosmos-v46';canvas.setAttribute('aria-hidden','true');
art.prepend(canvas);
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
if(!ctx){canvas.remove();return}
let w=1,h=1,dpr=1,frames=0,acc=0,attached=false,visible=false,mx=0,my=0,tx=0,ty=0;
const mobile=()=>innerWidth<781;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let seed=772026;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const stars=Array.from({length:95},(_,i)=>({
 a:random()*6.28318,r:.24+random()*.72,z:.2+random()*.8,
 skew:(random()-.5)*.42,width:.45+random()*1.2,speed:.35+random()*.6,lane:i%5
}));
function resize(){
 const box=art.getBoundingClientRect();if(box.width<10||box.height<10)return;
 w=box.width;h=box.height;
 dpr=Math.min(devicePixelRatio||1,mobile()?1:1.35,Math.sqrt((mobile()?420000:1050000)/Math.max(1,w*h)));
 canvas.width=Math.max(2,Math.round(w*dpr));canvas.height=Math.max(2,Math.round(h*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);
}
function project(angle,r,skew){
 const z=.5+.5*Math.cos(angle+.36),pers=1/(1.28-.39*z),rr=r*pers;
 return{x:w*(.53+Math.cos(angle)*rr*.42)+mx*7*(1-z),
  y:h*(.49+(Math.sin(angle)*.29+skew*.17)*rr)+my*5*(1-z)};
}
function paint(time){
 ctx.clearRect(0,0,w,h);
 const theme=document.body.dataset.gbTheme;
 const dark=theme==='sinal';
 const gold=dark?'255,207,93':'152,102,15';
 const ink=dark?'211,226,238':'83,70,44';
 const cx=w*.515,cy=h*.495,scale=Math.min(w,h);
 const spin=time*.00022;
 const isMob=mobile();
 // Controlled vignette with light held BEHIND the garment, not across text.
 const halo=ctx.createRadialGradient(cx,cy,scale*.07,cx,cy,scale*.66);
 halo.addColorStop(0,'rgba('+gold+','+(dark?.11:.078)+')');
 halo.addColorStop(.44,'rgba('+gold+','+(dark?.055:.059)+')');
 halo.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
 ctx.save();
 // Four interrupted orbital light-paths in spatial perspective, with
 // distinct major axes and bank angles. The original assets stay in front.
 const bands=[
  {r:.43,tilt:-.36,width:2.3,omega:.29,part:1.70},
  {r:.62,tilt:.29,width:1.8,omega:-.22,part:1.38},
  {r:.82,tilt:-.61,width:1.4,omega:.13,part:1.15},
  {r:1.02,tilt:.14,width:1.2,omega:-.14,part:.86}
 ];
 for(let k=0;k<bands.length;k++){
  const ring=bands[k],rx=w*.385*ring.r,ry=h*.31*ring.r;
  const start=spin*ring.omega+k*1.47;
  // A dark metallic foundation for a believable trajectory.
  ctx.save();ctx.translate(cx,cy);ctx.rotate(ring.tilt);
  ctx.strokeStyle='rgba('+ink+','+(dark?.075:.11)+')';
  ctx.lineWidth=ring.width*.8;
  ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,2*Math.PI);
  ctx.stroke();
  for(let j=0;j<2;j++){
   const lo=start+j*Math.PI*.92;
   ctx.beginPath();
   ctx.ellipse(0,0,rx,ry,0,lo,lo+ring.part*(j===0?1:.52));
   ctx.lineWidth=ring.width*(j===0?1:.55)*(isMob?.8:1);
   ctx.strokeStyle='rgba('+(j===0?gold:ink)+','+(dark?.44:.38)/(1+k*.16)+')';
   ctx.stroke();
  }
  ctx.restore();
 }
 // Deliberate streaks sweep on those same planes and have depth-dependent
 // length and luminance. More visible than original V46, without particle fog.
 const n=M.Prefs.lite?17:isMob?36:92;
 const t=time*.00023;
 for(let i=0;i<n;i++){
  const star=stars[i%stars.length];
  const angle=star.a+t*star.speed;
  const length=(.27+.31*star.z)*(star.lane===0?1.7:1);
  const alpha=(dark?.43:.38)*(star.z*.58+.46)*(star.lane===0?1:.66);
  const color=star.lane===0?gold:ink;
  const thick=(isMob?.89:1.15)*star.width;
  ctx.beginPath();
  const steps=isMob?5:9;
  for(let j=0;j<=steps;j++){
   const v=project(angle+(j/steps)*length,star.r,star.skew);
   j===0?ctx.moveTo(v.x,v.y):ctx.lineTo(v.x,v.y);
  }
  ctx.lineWidth=thick;
  ctx.strokeStyle='rgba('+color+','+alpha.toFixed(3)+')';
  ctx.stroke();
  if(i%5===0){
   const v=project(angle+length,star.r,star.skew);
   ctx.beginPath();
   ctx.arc(v.x,v.y,isMob?1:1.5,0,2*Math.PI);
   ctx.fillStyle='rgba('+gold+','+Math.min(.67,alpha*1.6).toFixed(3)+')';
   ctx.fill();
  }
 }
 // Three larger strokes establish a "galaxy of lines" in motion, not just a
 // background speckle. Use lightweight paths instead of shaders/shadows.
 for(let k=0;k<(isMob?2:3);k++){
  const t0=t*.72+k*2.094,rad=.82+k*.15;
  ctx.beginPath();
  for(let j=0;j<=38;j++){
   const a=t0+j/38*1.96;
   const x=cx+Math.cos(a)*w*.42*rad;
   const y=cy+Math.sin(a)*h*.26*rad+Math.cos(a*.5+k)*h*.025;
   j===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  }
  ctx.strokeStyle='rgba('+gold+','+(dark?.18:.16)+')';
  ctx.lineWidth=isMob?1.05:1.5;
  ctx.stroke();
 }
 ctx.restore();
 frames++;
}
function runnable(){
 return visible&&!reduced.matches&&!document.hidden&&!document.getElementById('gbRibbonBoot')&&!document.body.classList.contains('gb-experience-open')&&!document.querySelector('.product-modal:not([hidden])');
}
function tick(dt,t){
 if(!runnable()){attached=false;ctx.clearRect(0,0,w,h);return false}
 if(w<10||h<10){resize();return true}
 acc+=dt;const step=mobile()?1/20:M.Prefs.lite?1/15:1/30;
 if(acc<step)return true;
 acc=0;mx+=(tx-mx)*.11;my+=(ty-my)*.11;paint(t);
 return true;
}
function start(){
 if(!runnable())return;
 // Core chunks initialize while the intro hides <main>. The first resize
 // therefore sees 0 x 0; rebuild the actual backing store AFTER unlock.
 // Never let the original 300x150 canvas paint a galaxy into a 1px scene.
 const box=art.getBoundingClientRect();
 if(box.width>10&&box.height>10&&
    (w<10||h<10||Math.abs(w-box.width)>2||Math.abs(h-box.height)>2))resize();
 if(w<10||h<10)return;
 if(attached)return;
 attached=true;acc=0;M.Ticker.add(tick);
}
function pause(){ctx.clearRect(0,0,w,h)}
M.onVisible(stage,v=>{
 visible=v;if(v)start();else pause();
},{threshold:.08});
// The intro can hold no-scroll while IO already reports the hero as visible.
// Wake the renderer when the storefront unlocks, or the canvas stays blank.
// Cinematic intro uses a class on html/body and can finish after the
// original IntersectionObserver fires. Detect removal of its actual overlay
// and independently measure whether the stage is onscreen.
const wake=()=>{
 if(document.getElementById('gbRibbonBoot'))return;
 const box=stage.getBoundingClientRect();
 if(box.bottom>0&&box.top<innerHeight){visible=true;start()}
};
const wakeObserver=new MutationObserver(wake);
wakeObserver.observe(document.body,{childList:true,attributes:true,attributeFilter:['class']});
document.addEventListener('gb:core-ready',wake);
addEventListener('scroll',()=>{if(!attached)wake()},{passive:true});
setTimeout(wake,0);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)start()});
reduced.addEventListener?.('change',e=>{if(!e.matches)start();else pause()});
stage.addEventListener('pointermove',e=>{
 if(e.pointerType!=='mouse'||mobile())return;
 const b=art.getBoundingClientRect();tx=clamp((e.clientX-b.left)/Math.max(1,b.width)*2-1,-1,1);
 ty=clamp((e.clientY-b.top)/Math.max(1,b.height)*2-1,-1,1);
},{passive:true});
stage.addEventListener('pointerleave',()=>{tx=ty=0},{passive:true});
addEventListener('resize',resize,{passive:true});
if('ResizeObserver'in window)new ResizeObserver(resize).observe(art);
resize();
window.GBHeroCosmosV46={get frames(){return frames},get active(){return attached&&runnable()},
 get quality(){return mobile()?'mobile/20fps':M.Prefs.lite?'lite/15fps':'desktop/30fps'},
 get dimensions(){return{w,h,canvas:[canvas.width,canvas.height],dpr}},stop(){visible=false;pause()}};
})();
