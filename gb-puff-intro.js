/* GB IMPORTS / SET77 LABS — PUFF INTRO V45
 * Black glass, and the first brand object on screen is the GB plush puff with real fur: the decoded poster
 * (rendered fur, RGBA) or the user's original PlushTile running live in WebGL2. Never a flat icon, a bare
 * cushion, a spinner or a black box. Cursor and finger part the fibres (the original brush); the camera then
 * dives into the puff and the landing, already painted underneath, takes over.
 *
 * The store never waits on the puff: the storefront core boots in parallel, a watchdog releases the page at
 * WATCHDOG ms whatever the GPU, the network or the bundle do, and finish() is idempotent.
 *
 *   idle → visible-poster → visible-live → transitioning → finished
 *              └────── fallback (poster only) / failed (nothing drawable) ──────┘   (never blocking)
 *
 * window.GBPuffIntro is the API; window.GBGlassRibbons stays as an alias, because the navbar, the route CSS,
 * the core boot and the regression suites read the intro's lifecycle by that name.
 */
(()=>{
'use strict';
const stage=document.getElementById('heroStage');
const host=document.getElementById('gbRibbonBoot');
if(!stage||!host||window.GBPuffIntro)return;
// The puff opens the landing; the V12 opening (gb-edit-v12) does not start by itself — the puff plays it, gold,
// in the middle of its dive (window.GBEditOpening).
window.GB_GLASS_RIBBON_INTRO=true;

const now=()=>performance.now();
const T0=now();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const params=new URLSearchParams(location.search);
const hold=params.get('gbPuffHold')==='1';   // QA / recording only: no automatic exit (skip or finish())
// Direct landing only: deep links (#colecao, ?peca, /gb…) open the store straight away.
const atTop=!params.has('peca')&&(!location.hash||location.hash==='#inicio')&&!/^\/(?:gb|gb-studio)(?:\/|$)/.test(location.pathname);
const play=atTop&&!reduced;
let seen=false;try{seen=sessionStorage.getItem('gbPuffSeen')==='1'}catch{}

// the page is released by then, no matter what: the quick dive started at 5.2 s ends by ~5.7 s, inside the
// 6 s contract even when a busy main thread fires the timer a few hundred ms late
const WATCHDOG=5200;
const CORE_AT=650;                   // storefront boot starts once the puff is on screen (parallel, never gated)
const SHOW=seen?1300:2600;           // how long the puff holds before the dive (shorter on a revisit)
const DIVE=950,DIVE_SKIP=480;
// the build writes both; the source page (no build) has no bundle and uses the committed poster
const POSTER='GB_PUFF_POSTER_URL' in window?window.GB_PUFF_POSTER_URL:'./assets/brand/gb-puff-poster-v44.webp';
const BUNDLE=window.GB_PLUSH_BUNDLE_SRC||null;
const GB_SVG='./assets/brand/gb-monograma-amarelo-preto.svg';

const camera=host.querySelector('.gb-puff-camera');
const posterEl=host.querySelector('.gb-puff-poster');
const liveEl=host.querySelector('.gb-puff-live');
const skipEl=host.querySelector('.gb-puff-skip');

let state='idle',mode='none',reason='',finished=false,transitionAt=0,brandAt=0,lastTouch=0;
const tl={start:0,posterShown:0,liveReady:0,coreBoot:0,coreReady:0,transition:0,finished:0};
const timers=new Set();
const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn()},ms);timers.add(id);return id};
const mark=k=>{if(!tl[k])tl[k]=+(now()-T0).toFixed(1)};
const set=s=>{state=s;host.dataset.state=s};
const off=[];
const on=(t,type,fn,o)=>{t.addEventListener(type,fn,o);off.push(()=>t.removeEventListener(type,fn,o))};

/* ---------- not playing: hand the page over at once ---------- */
if(!play){
 host.remove();
 publish();
 window.GB_BOOT_CORE?.();
 return;
}

document.documentElement.classList.add('gb-ribbon-intro-playing');
// QA hold: the CSS-only failsafe would otherwise hide the held stage at 9 s
if(hold)document.documentElement.classList.add('gb-puff-hold');
document.body.appendChild(host);
host.classList.remove('is-boot');
host.classList.add('is-opening');
mark('start');set('idle');

/* ---------- the GPU decides the path before anything is shown ----------
   A real GPU gets the original PlushTile live from its very first visible frame and keeps it to the end: the stage
   stays black until a verified lit frame, then the puff rises. Without one (software rasteriser, no WebGL2,
   Save-Data) the real-fur poster is the puff, and it stays — never a poster that turns into something else. */
const conn=navigator.connection;
const saveData=!!conn?.saveData||/(^|-)2g$/.test(conn?.effectiveType||'');
const forceLive=params.get('gbPuffLive')==='1';           // QA capture on software GPUs only
const coarse=matchMedia('(pointer: coarse)').matches;
const mem=navigator.deviceMemory||8,cores=navigator.hardwareConcurrency||8;
function probeGpu(){
 // Chrome hands out no context at all with failIfMajorPerformanceCaveat on a software rasteriser
 try{
  const c=document.createElement('canvas');
  const gl=c.getContext('webgl2',{failIfMajorPerformanceCaveat:true,powerPreference:'low-power',antialias:false,depth:false});
  if(!gl)return 'none';
  const d=gl.getExtension('WEBGL_debug_renderer_info');
  const name=String(d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /swiftshader|llvmpipe|software|basic render/i.test(name)?'software':'hardware';
 }catch{return 'none'}
}
const gpu=window.WebGL2RenderingContext?probeGpu():'none';
const wantLive=!!BUNDLE&&!!liveEl&&!saveData&&!!window.WebGL2RenderingContext&&(gpu==='hardware'||forceLive);
// device budget: strands, backing-store pixels and DPR (the original's adaptive quality works inside these)
const budget=forceLive?{strandCap:12000,pixelBudget:900000,maxDpr:1}
 :coarse||innerWidth<720?{strandCap:22000,pixelBudget:1000000,maxDpr:2}
 :mem<=4||cores<=4?{strandCap:34000,pixelBudget:1400000,maxDpr:1.5}
 :{strandCap:70000,pixelBudget:1900000,maxDpr:1.5};
const strandCap=budget.strandCap;
const LIVE_WAIT=forceLive?12000:1500;   // the live tile must be up by then, or the poster takes the stage for good
host.dataset.gpu=gpu;
if(wantLive)host.classList.add('is-live-path');

/* ---------- storefront: boots in parallel; the intro only listens ---------- */
const bootCore=()=>{if(!tl.coreBoot){mark('coreBoot');window.GB_BOOT_CORE?.()}};
// on the live path the store waits for the first fur frame (or 1.2 s, whichever is first), so the two never fight
later(bootCore,wantLive?1200:CORE_AT);
const coreDone=()=>window.GB_CORE_READY||window.GB_CORE_FAILED||!window.GB_BOOT_CORE;
on(document,'gb:core-ready',()=>{mark('coreReady');maybeLeave()});

function showBrand(kind){
 if(brandAt||finished)return;
 brandAt=now();
 host.classList.add('is-brand',kind==='live'?'is-live-first':'is-poster-first');
 later(()=>host.classList.add('is-settled'),1300);  // entrance done: the camera stops promoting a layer
 later(maybeLeave,SHOW);
}

/* ---------- poster: decoded early as the fallback; shown only when there is no live tile ---------- */
let posterImg=null,posterReady=false,posterFailed=!POSTER||!posterEl,liveGaveUp=!wantLive;
function showPoster(){
 if(finished||brandAt||!posterReady)return;
 posterEl.src=posterImg.src;
 set('visible-poster');mode='poster';mark('posterShown');showBrand('poster');
 if(wantLive)dropLive();
}
if(!posterFailed){
 posterImg=new Image();
 posterImg.decoding='async';
 posterImg.src=POSTER;
 (posterImg.decode?posterImg.decode():new Promise((ok,ko)=>{posterImg.onload=ok;posterImg.onerror=ko})).then(()=>{
  if(!posterImg.naturalWidth)throw 0;
  posterReady=true;
  if(liveGaveUp)showPoster();
 }).catch(()=>{
  posterFailed=true;host.dataset.poster='failed';
  if(!brandAt&&liveGaveUp)later(()=>finish('no-visual'),0);
 });
}

/* ---------- live: the original PlushTile, mounted the moment its chunk arrives ---------- */
function mountLive(){
 if(finished||!window.GBPlush||liveGaveUp)return;
 try{window.GBPlush.mount(liveEl,{strandCap,pixelBudget:budget.pixelBudget,maxDpr:budget.maxDpr,allowSoftware:forceLive})}catch{liveFailed('mount')}
}
function dropLive(){try{window.GBPlush?.unmount()}catch{} host.dataset.live=host.dataset.live||'late'}
function liveFailed(why){
 if(liveGaveUp&&host.dataset.live)return;
 liveGaveUp=true;host.dataset.live=why||'failed';
 if(brandAt)return;
 if(posterReady)showPoster();
 else if(posterFailed)later(()=>finish('no-visual'),0);
}
if(wantLive){
 on(liveEl,'gb:plush-ready',()=>{
  if(finished)return;
  if(brandAt||liveGaveUp){dropLive();return}   // the poster already holds the stage: no swap, free the GPU
  mark('liveReady');mode='live';
  host.classList.add('is-live');
  set('visible-live');
  showBrand('live');
  later(bootCore,250);
 });
 on(liveEl,'gb:plush-unsupported',e=>liveFailed(e.detail?.reason));
 on(liveEl,'gb:plush-failed',e=>liveFailed(e.detail?.reason));
 later(()=>{if(!brandAt)liveFailed('late')},LIVE_WAIT);
 if(window.GBPlush)mountLive();
 else{
  on(document,'gb:plush-bundle',mountLive,{once:true});
  const sc=document.createElement('script');
  sc.src=BUNDLE;sc.async=true;sc.fetchPriority='high';
  sc.onerror=()=>liveFailed('bundle');
  document.head.append(sc);
 }
}else host.dataset.live=BUNDLE?(gpu==='hardware'?'save-data':'gpu-'+gpu):'no-bundle';
// nothing drawable at all: black glass for a breath, then the store
if(!wantLive&&posterFailed)later(()=>finish('no-visual'),400);

/* ---------- touch and cursor: the fibres answer (inside PlushTile); the intro only notes activity ---------- */
on(host,'pointermove',()=>{lastTouch=now()},{passive:true});
on(host,'pointerdown',()=>{lastTouch=now()},{passive:true});
// Leaving on purpose: the skip control, keys, a wheel. A tap or a drag on the puff never skips.
skipEl&&on(skipEl,'click',e=>{e.preventDefault();finish('skip')});
on(window,'keydown',e=>{if(/^(Escape|Enter| |PageDown|ArrowDown)$/.test(e.key))finish('skip')});
on(window,'wheel',e=>{if(e.deltaY>8&&now()-T0>700)finish('skip')},{passive:true});
on(document,'visibilitychange',()=>{if(document.hidden)finish('hidden')});
on(window,'pagehide',()=>finish('pagehide'));

/* ---------- leaving: the camera dives into the puff ---------- */
function maybeLeave(){
 if(finished||transitionAt||!brandAt||hold)return;
 const held=now()-brandAt>=SHOW;
 const touching=now()-lastTouch<550;
 if(held&&coreDone()&&!touching)return finish('ready');
 later(maybeLeave,touching?300:160);
}
if(!hold)later(()=>finish('watchdog'),WATCHDOG);

function finish(why){
 if(finished||transitionAt)return;
 reason=why;transitionAt=now();mark('transition');set('transitioning');
 bootCore();
 try{sessionStorage.setItem('gbPuffSeen','1')}catch{}
 const quick=why==='skip'||why==='hidden'||why==='pagehide'||why==='no-visual'||why==='watchdog';
 const dur=why==='hidden'||why==='pagehide'?0:quick?DIVE_SKIP:DIVE;
 host.style.setProperty('--gb-dive',dur+'ms');
 // The landing is already laid out underneath: un-hide it and let the camera pass through the puff.
 document.documentElement.classList.remove('gb-ribbon-intro-playing');
 host.classList.remove('is-opening');
 host.classList.add('is-diving');
 host.style.pointerEvents='none';
 // halfway through the dive the puff fills the frame: the landing's own V12 opening (gold wall, monogram,
 // GB IMPORTS) takes over and bursts into blocks onto the hero, like every chapter wall of the page
 if(!/^(hidden|pagehide|no-visual)$/.test(why))later(()=>window.GBEditOpening?.({gold:true,hold:quick?700:1000}),Math.round(dur*.45));
 later(teardown,dur+40);
}

function teardown(){
 if(finished)return;
 finished=true;mark('finished');set('finished');
 timers.forEach(clearTimeout);timers.clear();
 off.splice(0).forEach(f=>f());
 document.documentElement.classList.remove('gb-puff-hold');
 try{window.GBPlush?.unmount()}catch{}
 if(posterEl)posterEl.removeAttribute('src');
 host.remove();
 host.classList.add('is-finished');
 document.dispatchEvent(new CustomEvent('gb:intro-finished',{detail:{reason,timeline:{...tl}}}));
}

publish();

function publish(){
 const live=()=>liveEl?.firstElementChild?.__gbPlush||null;
 const canvas=()=>liveEl?.querySelector('canvas');
 const api=Object.freeze({
  get state(){return play?state:'skipped'},get mode(){return mode},get reason(){return reason},
  get timeline(){return {...tl}},get strandCap(){return strandCap},get gpu(){return gpu},get live(){const s=live();return s?{...s}:null},
  // lifecycle names kept from the ribbon film, read by gb-nav-v39, the core boot and the suites
  get visible(){return !!brandAt},  // the puff (poster or live) is on screen
  get opening(){return play&&!transitionAt&&!finished},
  get settled(){return !play||!!transitionAt},
  get parked(){return !!tl.coreBoot},get parkAt(){return tl.coreBoot},
  get removed(){return !host.isConnected},
  get active(){return !!live()&&!finished},
  get frames(){return live()?.frames||0},
  get quality(){return live()?.quality??0},
  get canvasSize(){const c=canvas();return c&&host.isConnected?[c.width,c.height]:[0,0]},
  get logoAsset(){return GB_SVG},
  get posterAsset(){return POSTER},
  get fullGlass(){const r=host.getBoundingClientRect();return host.isConnected&&r.width>=innerWidth-1&&r.height>=innerHeight-1},
  get brush(){return live()?.brush||0},
  finish:()=>finish('api'),
 });
 window.GBPuffIntro=api;
 window.GBGlassRibbons=api;
}
})();
