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
 const light=document.body.dataset.gbTheme!=='sinal',gold=light?'138,105,32':'255,208,100',ink=light?'85,73,66':'188,198,213';
 const cx=w*.52,cy=h*.49,rad=Math.max(w*.36,h*.32);
 const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
 halo.addColorStop(0,'rgba('+gold+','+(light?.014:.034)+')');
 halo.addColorStop(.55,'rgba('+gold+','+(light?.036:.060)+')');halo.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
 const n=M.Prefs.lite?14:mobile()?29:70,spin=time*.00013;
 for(let i=0;i<n;i++){
  const s=stars[i],angle=s.a+spin*s.speed,length=(.19+.23*s.z)*(s.lane===0?1.9:1);
  const alpha=(light?.085:.15)*(s.z*.65+.37)*(s.lane===0?1:.64);
  ctx.strokeStyle='rgba('+(s.lane===0?gold:ink)+','+alpha.toFixed(3)+')';
  ctx.lineWidth=(mobile()?.72:.9)*s.width;
  ctx.beginPath();
  const steps=mobile()?5:8;
  for(let k=0;k<=steps;k++){
   const p=project(angle+(k/steps)*length,s.r,s.skew);
   if(k===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
  }
  ctx.stroke();
  if(i%5===0){const p=project(angle+length,s.r,s.skew);
   ctx.fillStyle='rgba('+gold+','+(alpha*1.35).toFixed(3)+')';
   ctx.beginPath();ctx.arc(p.x,p.y,mobile()?.65:1.1,0,Math.PI*2);ctx.fill();
  }
 }
 if(!mobile()&&!M.Prefs.lite){
  for(let i=70;i<95;i++){const s=stars[i],p=project(s.a+spin*.2,s.r*.85,s.skew);
   ctx.fillStyle='rgba('+gold+','+(light?.07:.13)+')';
   ctx.fillRect(p.x,p.y,s.width*.75,s.width*.75);
  }
 }
 frames++;
}
function runnable(){
 return visible&&!reduced.matches&&!document.hidden&&!document.body.classList.contains('no-scroll')&&!document.body.classList.contains('gb-experience-open');
}
function tick(dt,t){
 if(!runnable()){attached=false;ctx.clearRect(0,0,w,h);return false}
 acc+=dt;const step=mobile()?1/20:M.Prefs.lite?1/15:1/30;
 if(acc<step)return true;
 acc=0;mx+=(tx-mx)*.11;my+=(ty-my)*.11;paint(t);
 return true;
}
function start(){
 if(attached||!runnable())return;
 attached=true;acc=0;M.Ticker.add(tick);
}
function pause(){ctx.clearRect(0,0,w,h)}
M.onVisible(stage,v=>{visible=v;if(v)start();else pause()},{threshold:.08});
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
