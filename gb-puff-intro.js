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
// The puff is the landing's opening: the V12 block-wall opening (gb-edit-v12) stands down, as it did for the ribbon.
window.GB_GLASS_RIBBON_INTRO=true;

const now=()=>performance.now();
const T0=now();
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const params=new URLSearchParams(location.search);
// Direct landing only: deep links (#colecao, ?peca, /gb…) open the store straight away.
const atTop=!params.has('peca')&&(!location.hash||location.hash==='#inicio')&&!/^\/(?:gb|gb-studio)(?:\/|$)/.test(location.pathname);
const play=atTop&&!reduced;
let seen=false;try{seen=sessionStorage.getItem('gbPuffSeen')==='1'}catch{}

const WATCHDOG=6000;                 // the page is released by then, no matter what
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
document.body.appendChild(host);
host.classList.remove('is-boot');
host.classList.add('is-opening');
mark('start');set('idle');

/* ---------- storefront: boots in parallel; the intro only listens ---------- */
const bootCore=()=>{if(!tl.coreBoot){mark('coreBoot');window.GB_BOOT_CORE?.()}};
later(bootCore,CORE_AT);
const coreDone=()=>window.GB_CORE_READY||window.GB_CORE_FAILED||!window.GB_BOOT_CORE;
on(document,'gb:core-ready',()=>{mark('coreReady');maybeLeave()});

/* ---------- first brand object: the real-fur poster, decoded before it is shown ---------- */
function showBrand(kind){
 if(brandAt||finished)return;
 brandAt=now();
 host.classList.add('is-brand',kind==='live'?'is-live-first':'is-poster-first');
 later(()=>host.classList.add('is-settled'),1200);  // entrance done: the camera stops promoting a layer
 later(maybeLeave,SHOW);
}
if(POSTER&&posterEl){
 const img=new Image();
 img.decoding='async';
 img.src=POSTER;
 const ready=img.decode?img.decode():new Promise((ok,ko)=>{img.onload=ok;img.onerror=ko});
 ready.then(()=>{
  if(finished||!img.naturalWidth)return;
  posterEl.src=img.src;
  if(state==='idle'){set('visible-poster');mode='poster';mark('posterShown');showBrand('poster')}
 },()=>{
  host.dataset.poster='failed';
  if(!brandAt&&(!wantLive||host.dataset.live))later(()=>finish('no-visual'),0);
 });
}

/* ---------- live: the original PlushTile, only on a real GPU and a full connection ---------- */
const conn=navigator.connection;
const saveData=!!conn?.saveData||/(^|-)2g$/.test(conn?.effectiveType||'');
const forceLive=params.get('gbPuffLive')==='1';           // QA capture on software GPUs only
const coarse=matchMedia('(pointer: coarse)').matches;
const mem=navigator.deviceMemory||8,cores=navigator.hardwareConcurrency||8;
const strandCap=forceLive?12000:coarse||innerWidth<720?26000:mem<=4||cores<=4?36000:90000;
const wantLive=!!BUNDLE&&!!liveEl&&!saveData&&!!window.WebGL2RenderingContext;

function mountLive(){
 if(finished||!window.GBPlush||mode==='live')return;
 // the store's boot is queued first: a busy GPU loop must never be what delays the shop
 if(!tl.coreBoot)return later(mountLive,Math.max(0,CORE_AT-(now()-T0))+16);
 try{window.GBPlush.mount(liveEl,{strandCap,allowSoftware:forceLive})}catch(err){liveFailed('mount')}
}
function liveFailed(why){
 host.dataset.live=why||'failed';
 if(state==='idle'&&!POSTER)set('failed');
 else if(state==='visible-poster')mode='poster';
 if(!brandAt&&(!POSTER||host.dataset.poster==='failed'))later(()=>finish('no-visual'),0);
}
if(wantLive){
 on(liveEl,'gb:plush-ready',()=>{
  if(finished)return;
  mark('liveReady');mode='live';
  host.classList.add('is-live');
  if(state==='idle'||state==='visible-poster')set('visible-live');
  showBrand('live');
 });
 on(liveEl,'gb:plush-unsupported',e=>liveFailed(e.detail?.reason));
 on(liveEl,'gb:plush-failed',e=>liveFailed(e.detail?.reason));
 if(window.GBPlush)mountLive();
 else{
  on(document,'gb:plush-bundle',mountLive,{once:true});
  const sc=document.createElement('script');
  sc.src=BUNDLE;sc.async=true;
  sc.onerror=()=>liveFailed('bundle');
  document.head.append(sc);
 }
}else host.dataset.live=BUNDLE?'skipped':'no-bundle';
// nothing drawable at all: black glass for a breath, then the store
if(!wantLive&&!POSTER)later(()=>finish('no-visual'),400);

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
 if(finished||transitionAt||!brandAt)return;
 const held=now()-brandAt>=SHOW;
 const touching=now()-lastTouch<550;
 if(held&&coreDone()&&!touching)return finish('ready');
 later(maybeLeave,touching?300:160);
}
later(()=>finish('watchdog'),WATCHDOG);

function finish(why){
 if(finished||transitionAt)return;
 reason=why;transitionAt=now();mark('transition');set('transitioning');
 bootCore();
 try{sessionStorage.setItem('gbPuffSeen','1')}catch{}
 const quick=why==='skip'||why==='hidden'||why==='pagehide'||why==='no-visual';
 const dur=why==='hidden'||why==='pagehide'?0:quick?DIVE_SKIP:DIVE;
 host.style.setProperty('--gb-dive',dur+'ms');
 // The landing is already laid out underneath: un-hide it and let the camera pass through the puff.
 document.documentElement.classList.remove('gb-ribbon-intro-playing');
 host.classList.remove('is-opening');
 host.classList.add('is-diving');
 host.style.pointerEvents='none';
 later(teardown,dur+40);
}

function teardown(){
 if(finished)return;
 finished=true;mark('finished');set('finished');
 timers.forEach(clearTimeout);timers.clear();
 off.splice(0).forEach(f=>f());
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
  get timeline(){return {...tl}},get strandCap(){return strandCap},get live(){const s=live();return s?{...s}:null},
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
