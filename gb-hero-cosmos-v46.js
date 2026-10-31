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
/* An actual spiral-galaxy image, generated from dust/clouds/starlight.
 * No paths, lines, scribbles, ellipses or decorative orbit strokes.
 * All expensive fog/shader-like work is cached on resize or theme change.
 * The animated layer renders only individual distant stars.
 */
function buildNebula(){
 if(!nctx||w<10||h<10)return;
 const theme=document.body.dataset.gbTheme||'origem';
 const dark=theme==='sinal',silver=theme==='trama';
 const pixels=mobile()?390000:780000;
 const ratio=Math.min(1,Math.sqrt(pixels/(w*h)));
 nebula.width=Math.max(2,Math.round(w*ratio));
 nebula.height=Math.max(2,Math.round(h*ratio));
 nctx.setTransform(ratio,0,0,ratio,0,0);
 nctx.clearRect(0,0,w,h);
 const cx=w*.53,cy=h*.495,rx=w*.45,ry=h*.44,span=Math.min(w,h);
 let seed=770042;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const warm=dark?'255,200,99':silver?'229,218,199':'235,179,77';
 const ice=dark?'133,181,231':'112,128,151';
 const outer=dark?'20,29,49':'17,24,38';
 const glow=(x,y,r,col,a)=>{
  const g=nctx.createRadialGradient(x,y,0,x,y,r);
  g.addColorStop(0,'rgba('+col+','+a+')');
  g.addColorStop(.43,'rgba('+col+','+(a*.35)+')');
  g.addColorStop(1,'rgba('+col+',0)');
  nctx.fillStyle=g;nctx.fillRect(x-r,y-r,2*r,2*r);
 };
 // Dark, feathered spatial volume. This is an atmospheric galaxy viewport
 // behind clothes, not a rectangle or an outline drawn on cream paper.
 nctx.save();
 nctx.translate(cx,cy);nctx.scale(rx,ry);
 const voidG=nctx.createRadialGradient(0,0,.04,0,0,1.07);
 voidG.addColorStop(0,'rgba('+outer+','+(dark?.95:.90)+')');
 voidG.addColorStop(.50,'rgba('+outer+','+(dark?.88:.79)+')');
 voidG.addColorStop(.77,'rgba('+outer+','+(dark?.57:.48)+')');
 voidG.addColorStop(.94,'rgba('+outer+',.11)');
 voidG.addColorStop(1,'rgba('+outer+',0)');
 nctx.fillStyle=voidG;nctx.fillRect(-1.1,-1.1,2.2,2.2);
 nctx.restore();
 // Pre-baked glow stamps, much cheaper than thousands of dynamic gradients.
 const makeSprite=(col)=>{
   const c=document.createElement('canvas');c.width=c.height=64;
   const g=c.getContext('2d');
   const light=g.createRadialGradient(32,32,0,32,32,32);
   light.addColorStop(0,'rgba('+col+',.24)');
   light.addColorStop(.22,'rgba('+col+',.17)');
   light.addColorStop(.62,'rgba('+col+',.042)');
   light.addColorStop(1,'rgba('+col+',0)');
   g.fillStyle=light;g.fillRect(0,0,64,64);
   return c;
 };
 const dustWarm=makeSprite(warm),dustIce=makeSprite(ice),dustWhite=makeSprite('250,240,218');
 nctx.save();nctx.globalCompositeOperation='screen';
 // Three intertwined logarithmic spiral arms, made of overlapping billowing
 // nebula clouds and thousands of stellar grains. Never draw polylines.
 const clouds=mobile()?750:1500;
 for(let i=0;i<clouds;i++){
   const arm=i%3;
   const t=Math.pow(rnd(),.79);
   const theta=t*Math.PI*3.45+(arm*Math.PI*2/3)-1.3;
   const radius=.045+.91*t;
   const spread=(.028+.070*t)*(rnd()-.5)*2;
   const rr=radius+spread;
   const x=cx+Math.cos(theta)*rx*rr;
   const y=cy+Math.sin(theta)*ry*rr*.80;
   const radiusPx=(.018+rnd()*.058)*(1-t*.48)*span;
   const sprite=arm===0?dustWarm:arm===1?dustWhite:dustIce;
   nctx.globalAlpha=(.18+.37*rnd())*(1-t*.36);
   nctx.drawImage(sprite,x-radiusPx,y-radiusPx,radiusPx*2,radiusPx*2);
 }
 // Astronomical dust lanes add depth without graphic arcs.
 nctx.globalAlpha=.68;
 for(let i=0;i<(mobile()?450:950);i++){
   const arm=i%3,t=rnd(),theta=t*10.2+arm*2.094-1.30;
   const rr=.06+t*.86+(rnd()-.5)*.07;
   const x=cx+Math.cos(theta)*rx*rr,y=cy+Math.sin(theta)*ry*rr*.80;
   const size=.28+rnd()*.95;
   nctx.fillStyle=(i%6===0?'rgba(230,209,157,.85)':'rgba(240,239,228,.70)');
   nctx.fillRect(x,y,size,size);
 }
 nctx.restore();
 // Luminous galactic bulge, with an intense core and warm auroral haze.
 glow(cx,cy,span*.29,warm,dark?.23:.18);
 glow(cx,cy,span*.14,'255,230,175',dark?.36:.30);
 glow(cx,cy,span*.062,'255,251,229',.56);
 glow(cx,cy,span*.016,'255,255,246',.70);
 // Secondary blue-slate arms: an immersive counterpoint to GB yellow.
 glow(cx-rx*.28,cy+ry*.10,span*.18,ice,.13);
 glow(cx+rx*.39,cy-ry*.12,span*.20,ice,.11);
 // Hundreds of tiny sharp pinpricks, concentrated toward the spiral.
 const points=mobile()?370:880;
 for(let i=0;i<points;i++){
   const arm=i%3,t=Math.pow(rnd(),.83),ang=t*10.8+arm*2.094-1.3;
   const rr=.06+t*.92+(rnd()-.5)*.15;
   const x=cx+Math.cos(ang)*rx*rr,y=cy+Math.sin(ang)*ry*rr*.81;
   const alpha=(.24+rnd()*.54)*(1-t*.30);
   nctx.fillStyle='rgba('+(i%8===0?warm:'243,241,225')+','+alpha+')';
   const size=(i%26===0?2.0:.45+rnd()*.85)*(mobile()?.8:1);
   nctx.fillRect(x,y,size,size);
 }
 // The entire cloud composition has a feathered edge. No harsh circle.
 nctx.save();
 nctx.globalCompositeOperation='destination-in';
 nctx.translate(cx,cy);nctx.scale(rx,ry);
 const feather=nctx.createRadialGradient(0,0,.16,0,0,1.035);
 feather.addColorStop(0,'rgba(0,0,0,1)');
 feather.addColorStop(.64,'rgba(0,0,0,1)');
 feather.addColorStop(.82,'rgba(0,0,0,.79)');
 feather.addColorStop(1,'rgba(0,0,0,0)');
 nctx.fillStyle=feather;nctx.fillRect(-1.1,-1.1,2.2,2.2);
 nctx.restore();
 nebulaTheme=theme;nebulaReady=true;nebulaBuilds++;
}
function paint(time){
 if(!nebulaReady||nebulaTheme!==(document.body.dataset.gbTheme||'origem'))buildNebula();
 ctx.clearRect(0,0,w,h);
 if(!nebulaReady)return;
 const cx=w*.53,cy=h*.495;
 // The whole nebulous galaxy rotates very slowly. Stellar foreground drifts
 // at a separate speed, yielding cinematic depth rather than pen scribbles.
 ctx.save();ctx.translate(cx,cy);
 ctx.rotate(Math.sin(time*.000055)*.023);
 ctx.drawImage(nebula,-cx,-cy,w,h);
 ctx.restore();
 const theme=document.body.dataset.gbTheme||'origem';
 const dark=theme==='sinal',gold=dark?'255,213,125':'242,208,147';
 const t=time*.000085;
 const count=M.Prefs.lite?24:mobile()?58:127;
 for(let i=0;i<count;i++){
   const star=stars[i];
   const a=star.a+t*star.speed;
   const r=star.r,near=star.z;
   const persp=.70+.40*near;
   const x=cx+Math.cos(a)*w*.39*r*persp+mx*16*near;
   const y=cy+Math.sin(a)*h*.35*r*.78*persp+my*12*near;
   const scint=.62+.38*Math.sin(time*.0016+star.twinkle);
   const alpha=(dark?.43:.48)*scint*(.40+near*.60);
   ctx.fillStyle='rgba('+(star.lane===0?gold:'247,243,231')+','+alpha.toFixed(3)+')';
   const radius=(.55+star.width*.72)*(.7+near*.44);
   ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
   if(i%27===0&&!mobile()){
     // A very occasional point-source diffraction glint, not a line trail.
     const size=3.8+near*3;
     ctx.fillStyle='rgba(255,249,222,'+(alpha*.22).toFixed(3)+')';
     ctx.fillRect(x-size/2,y-.35,size,.7);
     ctx.fillRect(x-.35,y-size/2,.7,size);
   }
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
 get dimensions(){return{w,h,canvas:[canvas.width,canvas.height],dpr}},get scene(){return 'volumetric-spiral-galaxy'},get nebulaBuilds(){return nebulaBuilds},stop(){visible=false;pause()}};
})();
