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
const host=document.createElement('div');
host.className='gb-ribbon-layer';
host.setAttribute('aria-hidden','true');
host.innerHTML=
 '<div class="gb-ribbon-glass"><i class="gb-ribbon-glass-depth"></i><i class="gb-ribbon-glass-specular"></i><i class="gb-ribbon-glass-grain"></i></div>'+
 '<canvas class="gb-ribbon-canvas"></canvas>'+
 '<div class="gb-ribbon-signature">'+
 '<i class="gb-ribbon-logo-atmosphere"></i>'+
 '<span class="gb-ribbon-logo-plate"><img class="gb-ribbon-original" src="./assets/brand/gb-monograma-amarelo-preto.svg" width="1000" height="610" alt="" decoding="async"/></span>'+
 '<span class="gb-ribbon-scan"></span>'+
 '<span class="gb-ribbon-label">GB IMPORTS</span>'+
 '<span class="gb-ribbon-subline">THE GB EDIT</span>'+
 '</div>'+
 '<div class="gb-ribbon-bloom"></div>'+
 '<div class="gb-ribbon-scene-number">GB / 001</div>'+
 '<div class="gb-ribbon-scene-foot">CURATED MOTION <span>•</span> GB IMPORTS</div>';
const enterAtTop=scrollY<70&&!reduced.matches;
if(enterAtTop)document.body.appendChild(host);
else stage.prepend(host);
const canvas=host.querySelector('canvas');
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
if(!ctx){host.remove();return}
const logo=host.querySelector('.gb-ribbon-original');
const signature=host.querySelector('.gb-ribbon-signature');
const bloom=host.querySelector('.gb-ribbon-bloom');
const scan=host.querySelector('.gb-ribbon-scan');
let intro=enterAtTop,settled=!enterAtTop,visibility=true;
let width=1,height=1,pixelRatio=1,raf=0,last=0,t=0,frames=0,paintAvg=0,paintMax=0,firstFrame=0,resizeTimer=0,settleTimeout=0;
const pointer={x:.5,y:.5,targetX:.5,targetY:.5,force:0,tap:0};
const duration=2750;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,k)=>a+(b-a)*k;
const ease=k=>k*k*(3-2*k);
host.classList.add(intro?'is-opening':'is-settled','is-visible');
if(intro)document.documentElement.classList.add('gb-ribbon-intro-playing');
window.GB_GLASS_RIBBON_INTRO=true;
function measure(){
 const r=host.getBoundingClientRect();
 width=Math.max(1,Math.round(r.width));height=Math.max(1,Math.round(r.height));
 pixelRatio=Math.min(devicePixelRatio||1,mobile()?1.2:1.5);
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
// Centerline is a smooth S-fold, not a straight sloping stripe.
// The same shape is shared by the gold threads and their soft ambient reflection.
function center(u,phase){
 const bend= .93 - .89/(1+Math.exp(-8*(u-.29)));
 const returnFold=.27*Math.exp(-Math.pow((u-.76)/.135,2));
 const upperPull=-.16/(1+Math.exp(-14*(u-.88)));
 return bend+returnFold+upperPull+Math.sin(u*11.8-phase*.68)*.017;
}
function strand(u,v,phase){
 const x=(-.14+u*1.3)*width;
 const centerY=center(u,phase)*height;
 const twist=u*13.4+phase*.59;
 const pinch=.34+.63*(.5+.5*Math.sin(u*6.9+phase*.14));
 const spread=(mobile()?.095:.14)*height*pinch;
 const pulse=Math.cos(twist)*v*spread;
 const ripple=Math.sin(u*25+phase*.9+v*2.4)*Math.abs(v)*height*.0035;
 const magnet=Math.exp(-Math.pow((u-pointer.x)*3.2,2))*pointer.force*(pointer.y-.5)*height*.06;
 return [x,centerY+pulse+ripple+magnet];
}
function trace(path,v,phase,samples){
 for(let i=0;i<=samples;i++){
  const u=i/samples;
  const p=strand(u,v,phase);
  if(!i)path.moveTo(p[0],p[1]);else path.lineTo(p[0],p[1]);
 }
}
function updateLogo(now){
 if(settled||!intro)return;
 const progress=clamp((now-firstFrame-510)/1350,0,1);
 const reveal=ease(progress);
 const boundary=115-132*reveal;
 // Non-flat, ribbon-shaped masking boundary reveals the actual original SVG.
 const edge=[];
 for(let i=8;i>=0;i--){
  const x=i*12.5;
  const displacement=Math.sin((i/8)*6.28+t*.9)*4*Math.sin(progress*Math.PI);
  edge.push(x.toFixed(2)+'% '+(boundary+displacement).toFixed(2)+'%');
 }
 logo.style.clipPath='polygon(0% 110%,100% 110%,'+edge.join(',')+')';
 scan.style.top=boundary.toFixed(2)+'%';
 signature.style.setProperty('--gb-emerge',reveal.toFixed(4));
 bloom.style.opacity=(Math.sin(progress*Math.PI)*.6).toFixed(3);
}
function settle(){
 if(settled)return;
 settled=true;intro=false;
 host.classList.remove('is-opening');
 host.classList.add('is-seating');
 document.documentElement.classList.remove('gb-ribbon-intro-playing');
 logo.style.clipPath='none';
 clearTimeout(settleTimeout);
 settleTimeout=setTimeout(()=>{
  stage.prepend(host);host.classList.remove('is-seating');
  host.classList.add('is-settled');
  measure();last=0;request();
 },370);
}
function draw(now){
 raf=0;if(!alive())return;
 const budget=mobile()?30:16;
 if(last&&now-last<budget){request();return}
 const started=performance.now(),dt=last?Math.min((now-last)/1000,.07):.016;
 last=now;if(!firstFrame)firstFrame=now;
 t+=dt;
 if(intro&&now-firstFrame>duration)settle();
 const k=1-Math.exp(-dt*5.5);
 pointer.x=lerp(pointer.x,pointer.targetX,k);
 pointer.y=lerp(pointer.y,pointer.targetY,k);
 pointer.force*=Math.exp(-dt*1.65);
 pointer.tap*=Math.exp(-dt*3.2);
 ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
 ctx.clearRect(0,0,width,height);
 const compact=mobile(),n=compact?38:84,steps=compact?34:56;
 const faint=settled?.58:1;
 ctx.save();ctx.globalCompositeOperation='screen';
 // A restrained broad spectral body. Hairlines are crisp and not blurred individually.
 for(let g=0;g<2;g++){
  const path=new Path2D();trace(path,g?-.22:.25,t,40);
  ctx.lineWidth=height*(g?.12:.25);
  ctx.strokeStyle=g?'rgba(222,177,68,.057)':'rgba(242,199,95,.035)';
  ctx.stroke(path);
 }
 ctx.restore();
 ctx.save();ctx.globalCompositeOperation='lighter';
 for(let i=0;i<n;i++){
  const v=-1+2*i/(n-1),abs=Math.abs(v);
  const path=new Path2D();trace(path,v,t,steps);
  const bright=Math.exp(-abs*abs*1.9);
  const gold=i%6<3;
  const alpha=clamp((gold?.24:.38)+bright*.30+pointer.tap*.12,0,.93)*faint;
  ctx.strokeStyle=gold?'rgba(242,194,76,'+alpha+')':'rgba(255,248,206,'+alpha+')';
  ctx.lineWidth=compact?.47:.58;
  ctx.lineCap='round';ctx.lineJoin='round';
  ctx.stroke(path);
 }
 const core=new Path2D();trace(core,0,t,62);
 ctx.strokeStyle='rgba(255,253,236,'+(.49*faint)+')';
 ctx.lineWidth=compact?.86:1.1;ctx.stroke(core);
 ctx.restore();
 if(intro)updateLogo(now);
 const cost=performance.now()-started;
 paintAvg=frames?paintAvg*.93+cost*.07:cost;
 paintMax=Math.max(paintMax,cost);
 frames++;request();
}
function start(){
 measure();
 if(reduced.matches){logo.style.clipPath='none';host.classList.remove('is-opening');host.classList.add('is-settled');return}
 request();
 if(intro)settleTimeout=setTimeout(settle,4100);
}
start();
window.GBGlassRibbons=Object.freeze({
 get active(){return!!raf},get frames(){return frames},
 get opening(){return intro},get settled(){return settled},
 get canvasSize(){return[canvas.width,canvas.height]},
 get pointer(){return[pointer.x,pointer.y]},
 get paintMs(){return[paintAvg,paintMax]},
 get fullGlass(){return getComputedStyle(host.querySelector('.gb-ribbon-glass')).inset==='0px'},
 get logoAsset(){return logo.getAttribute('src')},
 finish:settle,
 replay(){
  if(reduced.matches)return;
  intro=true;settled=false;firstFrame=0;last=0;
  signature.style.removeProperty('--gb-emerge');
  logo.style.clipPath='polygon(0% 110%,100% 110%,100% 110%,0% 110%)';
  host.classList.remove('is-settled','is-seating');
  document.body.append(host);
  host.classList.add('is-opening','is-visible');
  document.documentElement.classList.add('gb-ribbon-intro-playing');
  clearTimeout(settleTimeout);settleTimeout=setTimeout(settle,4100);
  measure();request();
 }
});
})();
