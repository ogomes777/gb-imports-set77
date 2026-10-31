/* GB Imports / SHOWROOM V49 — cinematic neon entrance tests.
 * Test original entry, default graphite product, burst timing, product swaps,
 * viewport/lazy behavior, mobile, reduced motion, and no runtime regressions.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync,statSync} from 'node:fs';
const base='http://127.0.0.1:8080';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:720}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:viewport.width<500,reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>Boolean(window.GB_CORE_READY)&&!!window.GBShowroomArrivalV49&&!document.getElementById('gbRibbonBoot'),null,{timeout:32000});
  const start=await page.evaluate(()=>{
   const f=document.querySelector('#showroom .showroom-feature');
   return{
    v49:!!window.GBShowroomArrivalV49,
    defaultIndex:document.querySelector('#showroomSelector button.active')?.dataset.showIndex,
    effect:f.querySelectorAll('.gb49-arrival-vfx>i').length,
    hasHero:!!document.querySelector('#heroStage'),
    hasLanding:!!document.querySelector('#colecao'),
    noModal:document.querySelector('#productModal')?.hidden,
    width:document.documentElement.scrollWidth-innerWidth
   };
  });
  assert(start.v49&&start.effect===5&&start.hasHero&&start.hasLanding&&start.noModal,
    'showroom, landing or visual effect unavailable '+JSON.stringify(start));
  // Product tiles and initial variant are mounted lazily near the viewport;
  // they are intentionally absent at the top of the landing.
  // Naturally scroll to the showroom, not #showroom in the URL (which skips intro).
  await page.locator('#showroom .showroom-feature').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('#showroomSelector button.active')?.dataset.showIndex==='0',null,{timeout:9000});
  await page.waitForFunction(()=>window.GBShowroomArrivalV49.playing||window.GBShowroomArrivalV49.completed,null,{timeout:7000});
  if(await page.evaluate(()=>GBShowroomArrivalV49.playing)){
   mkdirSync('tmp/gb-showroom-v49',{recursive:true});
   await page.waitForTimeout(160);
   await page.screenshot({path:'tmp/gb-showroom-v49/arrival-'+viewport.width+'.png',animations:'allow'});
  }
  await page.waitForFunction(()=>window.GBShowroomArrivalV49.completed,null,{timeout:7000});
  const state=await page.evaluate(()=>{
   const s=document.querySelector('#showroom'),media=document.querySelector('#showroomFeatureMedia');
   const product=media.querySelector('.sf-layer.is-on');
   const rect=product?.getBoundingClientRect();
   return{
    entered:s.classList.contains('gb49-complete'),
    activated:GBShowroomArrivalV49.activated,
    lite:!!window.GBMotion?.Prefs?.lite||!!navigator.connection?.saveData,
    remainsCued:s.classList.contains('gb49-cued'),
    remainsAnimating:s.classList.contains('gb49-entering'),
    productOpacity:product?getComputedStyle(product).opacity:null,
    productCount:media.querySelectorAll('.sf-layer').length,
    assetCount:product?.querySelectorAll('img,.garment-svg').length||0,
    productWidth:rect?.width||0,
    label:document.querySelector('#showroomFeatureName')?.textContent,
    vfx:!!document.querySelector('#showroom .gb49-arrival-vfx'),
    overflow:document.documentElement.scrollWidth-innerWidth
   }
  });
  assert(state.entered&&!state.remainsAnimating&&!state.remainsCued,
   'arrival not released for normal interaction '+JSON.stringify(state));
  assert(state.activated||state.lite,
   'entrance skipped on a capable browser instead of playing '+JSON.stringify(state));
  assert(state.productCount===2&&state.assetCount>=1&&state.productWidth>90,
   'garment disappeared after reveal '+JSON.stringify(state));
  assert(state.productOpacity==='1','product still transparent '+JSON.stringify(state));
  assert(state.overflow<=3,'mobile layout overflows '+JSON.stringify(state));
  assert(state.label?.toUpperCase().includes('GRAFITE'),'initial textile not graphite '+JSON.stringify(state));
  mkdirSync('tmp/gb-showroom-v49',{recursive:true});
  const file='tmp/gb-showroom-v49/feature-'+viewport.width+'.png';
  await page.screenshot({path:file,animations:'allow'});
  assert(statSync(file).size>25000,'visual QA screenshot too small');
  // Change garments; the new reveal must not hijack the existing two-layer
  // catalogue transition, customer action, hit boxes or product history.
  await page.locator('#showroomSelector [data-show-index="1"]').click();
  // Existing v04/v07 transitions are time-based. Wait for the final
  // opacity instead of sampling a perfectly valid 97%-complete frame.
  await page.waitForFunction(()=>{
   const on=document.querySelector('#showroomFeatureMedia .sf-layer.is-on');
   return on&&Number(getComputedStyle(on).opacity)>.99;
  },null,{timeout:4000});
  assert((await page.locator('#showroomFeatureName').innerText()).toUpperCase().includes('AZUL'),
   'colour selector failed after reveal');
  const switched=await page.evaluate(()=>({
    current:window.GBShowroomArrivalV49.activeColor,
    completed:window.GBShowroomArrivalV49.completed,
    on:[...document.querySelectorAll('#showroomFeatureMedia .sf-layer.is-on')].length,
    opacity:getComputedStyle(document.querySelector('#showroomFeatureMedia .sf-layer.is-on')).opacity
  }));
  assert(switched.current==='1'&&switched.completed&&switched.on===1&&Number(switched.opacity)>.99,
   'garment switching broken after introduction '+JSON.stringify(switched));
  assert(errors.length===0,'JS console errors '+errors.join(' | '));
  console.log('GB SHOWROOM V49 OK '+JSON.stringify({viewport,start,state,switched,errors}));
  await context.close();
 }
 const small=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await small.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBShowroomArrivalV49,null,{timeout:26000});
 await page.locator('#showroom .showroom-feature').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>window.GBShowroomArrivalV49.completed,null,{timeout:8000});
 const reduced=await page.evaluate(()=>({
  complete:GBShowroomArrivalV49.completed,
  on:document.querySelector('#showroomFeatureMedia .sf-layer.is-on'),
  vfx:getComputedStyle(document.querySelector('.gb49-arrival-vfx')).display,
  opacity:getComputedStyle(document.querySelector('#showroomFeatureMedia .sf-layer.is-on')).opacity
 }));
 assert(reduced.complete&&reduced.vfx==='none'&&reduced.opacity==='1',
  'reduced-motion fallback invisibly hides garment '+JSON.stringify({...reduced,on:!!reduced.on}));
 console.log('V49 reduced motion passed');
 await small.close();
}finally{
 await browser.close();
}
