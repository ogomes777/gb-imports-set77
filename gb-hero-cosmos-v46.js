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
const stars=Array.from({length:165},(_,i)=>({
 a:random()*Math.PI*2,r:.16+Math.pow(random(),.68)*.87,z:.16+random()*.84,
 skew:(random()-.5)*.19,width:.45+random()*1.28,speed:.25+random()*.65,lane:i%6,
 twinkle:random()*Math.PI*2
}));
const nebula=document.createElement('canvas');
const nctx=nebula.getContext('2d',{alpha:true});
let nebulaTheme='',nebulaReady=false,nebulaBuilds=0;
function resize(){
 const box=art.getBoundingClientRect();if(box.width<10||box.height<10)return;
 w=box.width;h=box.height;
 dpr=Math.min(devicePixelRatio||1,mobile()?1:1.35,Math.sqrt((mobile()?420000:1050000)/Math.max(1,w*h)));
 canvas.width=Math.max(2,Math.round(w*dpr));canvas.height=Math.max(2,Math.round(h*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);
 nebulaReady=false;
 if(nctx)buildNebula();
}
function project(angle,r,skew){
 const z=.5+.5*Math.cos(angle+.36),pers=1/(1.28-.39*z),rr=r*pers;
 return{x:w*(.53+Math.cos(angle)*rr*.42)+mx*7*(1-z),
  y:h*(.49+(Math.sin(angle)*.29+skew*.17)*rr)+my*5*(1-z)};
}
/* GB COSMOS / ATMOSPHERE V47
 * Cinematic atmosphere, not a literal illustrated galaxy.
 * The environment uses ONE low-contrast light field, a few feathered
 * fog banks, and sparse spatial glints. On light theme it remains airy
 * champagne/stone rather than forming a dark disc; on dark theme it is
 * gentle illuminated smoke over the existing graphite surface.
 * Build once per resize or theme change, move only a few points in runtime.
 */
function buildNebula(){
 if(!nctx||w<10||h<10)return;
 const theme=document.body.dataset.gbTheme||'origem';
 const dark=theme==='sinal',silver=theme==='trama',mob=mobile();
 const budget=mob?260000:640000;
 const ratio=Math.min(1,Math.sqrt(budget/(w*h)));
 nebula.width=Math.max(2,Math.round(w*ratio));
 nebula.height=Math.max(2,Math.round(h*ratio));
 nctx.setTransform(ratio,0,0,ratio,0,0);
 nctx.clearRect(0,0,w,h);
 const cx=w*.525,cy=h*.49,scale=Math.min(w,h);
 let noiseSeed=775419;
 function rnd(){noiseSeed=(Math.imul(noiseSeed,1664525)+1013904223)>>>0;return noiseSeed/4294967296}
 // The same spatial composition across themes; only color and contrast vary.
 const scheme=dark?{
  warm:'247,188,99',cold:'116,150,179',pearl:'235,233,221',
  base:.19,secondary:.12,center:.23,cloud:.065,dust:.23
 }:silver?{
  warm:'165,144,115',cold:'116,134,153',pearl:'228,222,207',
  base:.09,secondary:.055,center:.115,cloud:.022,dust:.125
 }:{
  warm:'201,155,78',cold:'120,139,157',pearl:'243,233,212',
  base:.105,secondary:.065,center:.128,cloud:.026,dust:.135
 };
 function mist(x,y,rx,ry,rgb,opacity){
  nctx.save();
  nctx.translate(x,y);
  nctx.scale(rx,ry);
  const g=nctx.createRadialGradient(0,0,.02,0,0,1);
  g.addColorStop(0,'rgba('+rgb+','+opacity+')');
  g.addColorStop(.34,'rgba('+rgb+','+(opacity*.52)+')');
  g.addColorStop(.69,'rgba('+rgb+','+(opacity*.13)+')');
  g.addColorStop(1,'rgba('+rgb+',0)');
  nctx.fillStyle=g;
  nctx.fillRect(-1,-1,2,2);
  nctx.restore();
 }
 // One big diffuse atmosphere; no outlines, dark circular portal or arms.
 mist(cx,cy,w*.50,h*.46,scheme.warm,scheme.base);
 mist(cx+w*.15,cy-h*.12,w*.28,h*.38,scheme.cold,scheme.secondary);
 mist(cx-w*.16,cy+h*.14,w*.28,h*.30,scheme.pearl,scheme.secondary*.82);
 // The three volumes gently overlap. A short axial glow makes the
 // garments read like they're floating inside a premium photo studio.
 mist(cx,cy,scale*.23,scale*.23,scheme.pearl,scheme.center);
 mist(cx,cy+scale*.02,scale*.11,scale*.12,scheme.warm,scheme.base*.52);
 // Very faint grain confined to the same atmosphere, pre-rendered once.
 const count=mob?55:140;
 for(let i=0;i<count;i++){
  const a=rnd()*Math.PI*2;
  const rad=Math.sqrt(rnd());
  const x=cx+Math.cos(a)*w*.39*rad;
  const y=cy+Math.sin(a)*h*.39*rad*.67;
  const grain=.28+rnd()*.80;
  const alpha=scheme.dust*(1-rad*.78)*(.35+rnd()*.65);
  nctx.fillStyle='rgba('+(i%8===0?scheme.warm:scheme.pearl)+','+alpha.toFixed(3)+')';
  nctx.fillRect(x,y,grain,grain);
 }
 // A restrained rim-lit cloud at the rear of the hero: visual depth
 // without drawing a frame or competing with the brand's lettering.
 mist(cx+w*.08,cy+h*.015,w*.24,h*.26,scheme.cold,scheme.cloud);
 nebulaTheme=theme;nebulaReady=true;nebulaBuilds++;
}
function paint(time){
 const currentTheme=document.body.dataset.gbTheme||'origem';
 if(!nebulaReady||nebulaTheme!==currentTheme)buildNebula();
 ctx.clearRect(0,0,w,h);
 if(!nebulaReady)return;
 const cx=w*.525,cy=h*.49;
 // Keep the cloud image cached; only fractional drift and a slow
 // luminous breathing make it feel dimensional.
 const breath=1+Math.sin(time*.00038)*.009;
 const driftX=Math.sin(time*.00013)*w*.006+mx*5;
 const driftY=Math.cos(time*.00011)*h*.005+my*4;
 ctx.save();
 ctx.translate(cx+driftX,cy+driftY);
 ctx.scale(breath,breath);
 ctx.drawImage(nebula,-cx,-cy,w,h);
 ctx.restore();
 const dark=currentTheme==='sinal';
 const silver=currentTheme==='trama';
 const warm=dark?'245,207,151':silver?'151,133,109':'172,137,83';
 const pearl=dark?'240,239,228':'127,115,101';
 const timePhase=time*.000046;
 const count=M.Prefs.lite?8:mobile()?13:28;
 for(let i=0;i<count;i++){
  const star=stars[i];
  const near=star.z,angle=star.a+timePhase*star.speed;
  const r=star.r;
  const x=cx+Math.cos(angle)*w*.40*r+mx*10*near;
  const y=cy+Math.sin(angle)*h*.34*r*.76+my*8*near;
  const twinkle=.68+.32*Math.sin(time*.0009+star.twinkle);
  const a=(dark?.31:silver?.19:.21)*twinkle*(.43+near*.52);
  const radius=(mobile()?.40:.47)+star.width*(mobile()?.34:.40);
  ctx.fillStyle='rgba('+(i%6===0?warm:pearl)+','+a.toFixed(3)+')';
  ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
 }
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
 get dimensions(){return{w,h,canvas:[canvas.width,canvas.height],dpr}},get scene(){return 'atmospheric-cosmos-dual-theme'},get nebulaBuilds(){return nebulaBuilds},stop(){visible=false;pause()}};
})();
