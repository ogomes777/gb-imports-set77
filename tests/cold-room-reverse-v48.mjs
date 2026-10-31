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
  // Opening the root must play the full puff. Direct #showroom URLs
  // deliberately skip it and are NOT the right link for visual QA.
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>Boolean(window.GBPuffIntro),null,{timeout:8500});
  const intro=await page.evaluate(()=>({
   playing:GBPuffIntro.opening,
   hasStage:!!document.getElementById('gbRibbonBoot'),
   pathname:location.pathname,hash:location.hash,
   heroPresent:!!document.getElementById('heroStage')
  }));
  assert(intro.playing&&intro.hasStage&&intro.heroPresent&&!intro.hash,
   'root must preserve original GB intro, hero and landing '+JSON.stringify(intro));
  await page.waitForFunction(()=>window.GB_CORE_READY&&!document.getElementById('gbRibbonBoot'),null,{timeout:25000});
  assert(await page.locator('#heroStage').isVisible(),'original hero missing after puff');
  await page.locator('#showroom .showroom-heading h2').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>window.GBShowroomCinema?.arrived,{timeout:25000});
  // Leave the heading below, so returning upwards actually crosses the
  // collection-to-cold-room seam (not just a page-down IO event).
  await page.evaluate(()=>{
    const h=document.querySelector('#showroom .showroom-heading');
    window.scrollTo({top:h.getBoundingClientRect().top+scrollY+h.clientHeight+innerHeight*.44,behavior:'instant'});
  });
  await page.waitForTimeout(140);
  // Instead of measuring a narrow near-edge strip, scrub the full
  // section-relative transition: 0 = halfway into Cold Room (all ice),
  // 1 = nearly all the way back in the catalogue (all warm paper).
  const go=async fraction=>{
   await page.evaluate(fr=>{
    const h=document.querySelector('#showroom .showroom-heading');
    const r=h.getBoundingClientRect(),v=innerHeight;
    const from=-Math.min(r.height*.5,v*.70),to=v*.88;
    const target=from+fr*(to-from);
    window.scrollTo({top:window.scrollY+r.top-target,behavior:'instant'});
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
  // Simulate a continuous upward gesture rather than a single teleport.
  await go(.12);
  const a=await go(.25),b=await go(.57);
  assert(a.reversing&&b.reversing,'reverse thaw state did not engage '+JSON.stringify({viewport,a,b}));
  assert(a.top<0&&a.cold>.76&&b.cold>.28&&b.cold<.56,
   'reverse should begin mid-section and thaw slowly over long travel '+JSON.stringify({a,b}));
  assert(a.cold>b.cold&&a.cold<1&&b.cold>0,
   'cold->paper sequence is not smoothly reversible '+JSON.stringify({a,b}));
  assert(Number(b.paperOpacity)>Number(a.paperOpacity),
   'white returned as an abrupt switch, not a gradual opacity '+JSON.stringify({a,b}));
  assert(a.stageExists&&b.stageExists&&b.title.includes('ABAIXO'),
   'the original below-zero heading/render disappeared');
  assert(a.overflow<=3&&b.overflow<=3,'horizontal overflow');
  mkdirSync('tmp/gb-cold-v48',{recursive:true});
  // Element.screenshot() scrolls the element into view, which would
  // silently FORCE p=0 and ruin the reverse-direction test. Capture the
  // viewport without moving it.
  await page.screenshot({
   path:'tmp/gb-cold-v48/return-'+viewport.width+'.png',animations:'allow'});
  const c=await go(.35);
  assert(c.reversing&&c.cold>b.cold,
   'reverse direction did not re-freeze smoothly '+JSON.stringify({b,c}));
  const d=await go(1);
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
  console.log('V48.2 slow reverse cold room passed '+JSON.stringify({viewport,a:a.cold,b:b.cold,c:c.cold,d:d.cold,errors}));
  await context.close();
 }
 // A deep-link is an intentional shortcut, not a page deletion or intro bug.
 const deepCtx=await browser.newContext({viewport:{width:390,height:844}});
 const deepPage=await deepCtx.newPage();
 await deepPage.goto(base+'/#showroom',{waitUntil:'domcontentloaded',timeout:40000});
 await deepPage.waitForFunction(()=>window.GB_CORE_READY===true,null,{timeout:25000});
 const deepStat=await deepPage.evaluate(()=>({
  hash:location.hash,opening:GBPuffIntro.opening,
  stage:!!document.getElementById('gbRibbonBoot'),
  hasHero:!!document.getElementById('heroStage'),
  hasShowroom:!!document.getElementById('showroom')
 }));
 assert(deepStat.hash==='#showroom'&&!deepStat.opening&&!deepStat.stage&&deepStat.hasHero&&deepStat.hasShowroom,
  'deep section link must skip only intro, never delete landing content '+JSON.stringify(deepStat));
 console.log('V48 deep-link skip expected '+JSON.stringify(deepStat));
 await deepCtx.close();
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
