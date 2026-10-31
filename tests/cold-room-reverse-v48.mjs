/* GB / COLD ROOM V48 — bidirectional scroll movie regression.
 * Browser assertions explicitly test the reverse transition rather than
 * settling for compilation and load-only smoke tests.
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const base='http://127.0.0.1:8080';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:viewport.width<500,reducedMotion:'no-preference'});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&!document.getElementById('gbRibbonBoot'),{timeout:25000});
  await page.locator('#showroom .showroom-heading h2').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.GBShowroomCinema?.arrived,{timeout:25000});
  // Leave the heading below, so returning upwards actually crosses the
  // collection-to-cold-room seam (not just a page-down IO event).
  await page.evaluate(()=>{
    const h=document.querySelector('#showroom .showroom-heading');
    window.scrollTo({top:h.getBoundingClientRect().top+scrollY+h.clientHeight+innerHeight*.44,behavior:'instant'});
  });
  await page.waitForTimeout(140);
  const go=async fraction=>{
   await page.evaluate(fr=>{
    const h=document.querySelector('#showroom .showroom-heading');
    const y=window.scrollY+h.getBoundingClientRect().top-innerHeight*fr;
    window.scrollTo({top:y,behavior:'instant'});
   },fraction);
   await page.waitForTimeout(160);
   return page.evaluate(()=>{
    const h=document.querySelector('#showroom .showroom-heading');
    const title=h.querySelector('h2'),letter=title.querySelector('.sc-ch');
    const patch=h.querySelector('.sc-scroll-paper');
    return{top:h.getBoundingClientRect().top,viewport:innerHeight,
     reversing:GBShowroomCinema.reversing,cold:GBShowroomCinema.reverseProgress,
     arrived:GBShowroomCinema.arrived,warm:h.classList.contains('is-warm'),
     progress:h.style.getPropertyValue('--sc-scroll-cold'),
     paperOpacity:getComputedStyle(patch).opacity,
     iceOpacity:letter?getComputedStyle(letter.querySelector('.sc-ice')).opacity:null,
     title:title.getAttribute('aria-label')||title.textContent,
     stageExists:!!h.querySelector('.showroom-cinema-bg'),
     overflow:document.documentElement.scrollWidth-innerWidth};
   });
  };
  const a=await go(.43),b=await go(.64);
  assert(a.reversing&&b.reversing,'reverse thaw state did not engage '+JSON.stringify({viewport,a,b}));
  assert(a.cold>b.cold&&a.cold<1&&b.cold>0,
   'cold->paper sequence is not smoothly reversible '+JSON.stringify({a,b}));
  assert(Number(b.paperOpacity)>Number(a.paperOpacity),
   'white returned as an abrupt switch, not a gradual opacity '+JSON.stringify({a,b}));
  assert(a.stageExists&&b.stageExists&&b.title.includes('ABAIXO'),
   'the original below-zero heading/render disappeared');
  assert(a.overflow<=3&&b.overflow<=3,'horizontal overflow');
  mkdirSync('tmp/gb-cold-v48',{recursive:true});
  await page.locator('#showroom .showroom-heading').screenshot({
   path:'tmp/gb-cold-v48/return-'+viewport.width+'.png',animations:'allow'});
  const c=await go(.47);
  assert(c.reversing&&c.cold>b.cold,
   'reverse direction did not re-freeze smoothly '+JSON.stringify({b,c}));
  const d=await go(.97);
  assert(!d.reversing&&d.warm&&d.cold===0,
   'paper state failed to settle after full upward exit '+JSON.stringify(d));
  assert(Number.isFinite(Number(d.paperOpacity)),'scroll state generated invalid style');
  // On reentry the original reveal begins when the actual title enters
  // the viewport, not merely when the top 52% of heading is onscreen.
  await page.locator('#showroom .showroom-heading h2').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.GBShowroomCinema?.arrived,null,{timeout:10000});
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  assert(await page.locator('#productGrid .product-card').count()>=8,'catalogue regressed');
  assert(!errors.length,'runtime errors: '+errors.join(' | '));
  console.log('V48 reverse cold room passed '+JSON.stringify({viewport,a:a.cold,b:b.cold,c:c.cold,d:d.cold,errors}));
  await context.close();
 }
 const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await reduced.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>window.GB_CORE_READY,{timeout:20000});
 const stat=await page.evaluate(()=>({
  reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
  overlay:getComputedStyle(document.querySelector('#showroom .sc-scroll-paper')).display
 }));
 assert(stat.reduced&&stat.overlay==='none','reduced motion fallback broken');
 console.log('V48 reduced motion passed '+JSON.stringify(stat));
 await reduced.close();
}finally{await browser.close()}
