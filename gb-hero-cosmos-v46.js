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
/* GB COSMOS V47.1 | Visible atmospheric chamber, dual-theme safe.
 * Replaces near-invisible mist with 2 broad volumetric cloud shelves and
 * a spectral champagne/blue aurora. No polylines, rings, spirals or portals.
 * All gas/light is rendered ONCE at theme change or resize.
 */
function buildNebula(){
 if(!nctx||w<10||h<10)return;
 const theme=document.body.dataset.gbTheme||'origem';
 const dark=theme==='sinal',silver=theme==='trama',mob=mobile();
 const budget=mob?320000:730000;
 const ratio=Math.min(1,Math.sqrt(budget/(w*h)));
 nebula.width=Math.max(2,Math.round(w*ratio));
 nebula.height=Math.max(2,Math.round(h*ratio));
 nctx.setTransform(ratio,0,0,ratio,0,0);
 nctx.clearRect(0,0,w,h);
 const cx=w*.55,cy=h*.51,span=Math.min(w,h);
 const scheme=dark?{
  slate:'80,94,119',champagne:'255,201,118',blue:'119,177,224',
  graphite:.27,warm:.36,cool:.24,core:.37,cloud:.24,dust:.42
 }:silver?{
  slate:'71,83,92',champagne:'188,152,103',blue:'91,132,164',
  graphite:.25,warm:.34,cool:.22,core:.32,cloud:.20,dust:.30
 }:{
  // ORIGEM / LIGHT ONLY. Keep the entire dark SINAL material untouched.
  slate:'72,82,89',champagne:'221,172,83',blue:'105,148,186',
  graphite:.33,warm:.475,cool:.285,core:.455,cloud:.285,dust:.34
 };
 function mist(x,y,rx,ry,col,alpha){
  nctx.save();
  nctx.translate(x,y);nctx.scale(rx,ry);
  const g=nctx.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,'rgba('+col+','+alpha+')');
  g.addColorStop(.34,'rgba('+col+','+(alpha*.82)+')');
  g.addColorStop(.64,'rgba('+col+','+(alpha*.32)+')');
  g.addColorStop(.85,'rgba('+col+','+(alpha*.075)+')');
  g.addColorStop(1,'rgba('+col+',0)');
  nctx.fillStyle=g;nctx.fillRect(-1,-1,2,2);
  nctx.restore();
 }
 // Broad tapered graphite haze provides legible depth on IVORY without
 // creating a dark circular black-hole portal. Positions are asymmetrical
 // and span the space BETWEEN and BEHIND the garments.
 mist(cx-w*.035,cy+h*.04,w*.45,h*.41,scheme.slate,scheme.graphite);
 mist(cx+w*.18,cy-h*.19,w*.28,h*.29,scheme.slate,scheme.graphite*.58);
 // Strong but controlled light volumes are the recognizable hero feature.
 // These are feathered volumetric CLOUDS, not graphic strokes.
 mist(cx-w*.18,cy-h*.16,w*.34,h*.30,scheme.champagne,scheme.warm);
 mist(cx+w*.25,cy+h*.17,w*.34,h*.32,scheme.blue,scheme.cool);
 mist(cx+w*.06,cy-h*.035,w*.23,h*.35,scheme.champagne,scheme.warm*.72);
 mist(cx-w*.12,cy+h*.23,w*.26,h*.25,scheme.blue,scheme.cool*.70);
 // Inner light is deliberately brighter than the old almost invisible fog.
 mist(cx+w*.015,cy+h*.01,span*.23,span*.24,'255,229,176',scheme.core);
 mist(cx+w*.095,cy-h*.09,span*.16,span*.19,scheme.champagne,scheme.core*.68);
 // Four spacious beams of museum-grade light, Origem only. Feathered
 // volumes create visible depth but never an outlined galactic disc.
 if(!dark&&!silver){
  mist(cx-w*.055,cy-h*.065,w*.32,h*.255,'247,226,185',.22);
  mist(cx+w*.19,cy-h*.035,w*.24,h*.205,scheme.champagne,.205);
  mist(cx-w*.225,cy+h*.085,w*.225,h*.195,scheme.blue,.17);
  mist(cx+w*.045,cy+h*.185,w*.255,h*.17,'255,242,218',.12);
 }
 // Airy asymmetric glow wisps: sampled sprites form a luminous gas sheet.
 let seed=770047;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 function sprite(rgb){
  const c=document.createElement('canvas');c.width=c.height=56;
  const g=c.getContext('2d');
  const grd=g.createRadialGradient(28,28,0,28,28,28);
  grd.addColorStop(0,'rgba('+rgb+',.32)');
  grd.addColorStop(.34,'rgba('+rgb+',.18)');
  grd.addColorStop(.71,'rgba('+rgb+',.042)');
  grd.addColorStop(1,'rgba('+rgb+',0)');
  g.fillStyle=grd;g.fillRect(0,0,56,56);
  return c;
 }
 const warmSprite=sprite(scheme.champagne),blueSprite=sprite(scheme.blue);
 nctx.save();
 nctx.globalCompositeOperation='source-over';
 const clouds=mob?75:150;
 // Two gently curved banks of gaseous light, no visible lines.
 for(let i=0;i<clouds;i++){
  const bank=i%2,t=rnd(),angle=(bank?.26:-.28)+t*2.0;
  const x=cx+(t-.5)*w*.83+(rnd()-.5)*w*.065;
  const y=cy+(bank?1:-1)*h*.11+Math.sin(angle)*h*.16+(rnd()-.5)*h*.13;
  const size=span*(.075+rnd()*.13);
  nctx.globalAlpha=scheme.cloud*(.42+rnd()*.56);
  nctx.drawImage(bank?blueSprite:warmSprite,x-size*.5,y-size*.5,size,size);
 }
 nctx.restore();
 // Sparse, purposeful pin-lights in the same physical volume.
 const grains=dark?(mob?19:40):silver?(mob?19:40):(mob?24:48);
 for(let i=0;i<grains;i++){
  const x=cx+(rnd()-.5)*w*.83;
  const y=cy+(rnd()-.5)*h*.58;
  const amount=scheme.dust*(.45+rnd()*.55);
  const size=.68+rnd()*1.25;
  nctx.fillStyle='rgba('+(i%4===0?scheme.champagne:scheme.slate)+','+amount.toFixed(3)+')';
  nctx.beginPath();nctx.arc(x,y,size,0,Math.PI*2);nctx.fill();
 }
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
 const count=M.Prefs.lite?9:dark?(mobile()?16:30):silver?(mobile()?16:30):(mobile()?19:35);
 for(let i=0;i<count;i++){
  const star=stars[i];
  const near=star.z,angle=star.a+timePhase*star.speed;
  const r=star.r;
  const x=cx+Math.cos(angle)*w*.40*r+mx*10*near;
  const y=cy+Math.sin(angle)*h*.34*r*.76+my*8*near;
  const twinkle=.68+.32*Math.sin(time*.0009+star.twinkle);
  const a=(dark?.31:silver?.19:.27)*twinkle*(dark||silver?.43:.48+near*.05+0)*(.95+near*.12);
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
 get dimensions(){return{w,h,canvas:[canvas.width,canvas.height],dpr}},get scene(){return 'visible-atmospheric-cosmos-dual-theme'},get nebulaBuilds(){return nebulaBuilds},stop(){visible=false;pause()}};
})();
