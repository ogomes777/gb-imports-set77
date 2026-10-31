/* GB HERO COSMOS V46 | regression tests, original shop untouched */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const url='http://127.0.0.1:8080/';
const presets=[
 {w:1440,h:900,reduced:false},
 {w:390,h:844,reduced:false},
 {w:320,h:720,reduced:false},
 {w:390,h:844,reduced:true}
];
try{
 for(const p of presets){
  const ctx=await browser.newContext({viewport:{width:p.w,height:p.h},
   hasTouch:p.w<600,isMobile:false,deviceScaleFactor:1,
   reducedMotion:p.reduced?'reduce':'no-preference'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBHeroCosmosV46&&window.GBHeroStage,{timeout:30000});
  // Loader, if enabled, must always hand control to the existing storefront.
  await page.waitForFunction(()=>document.querySelector('#gbRibbonBoot')===null,{timeout:25000});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(280);
  const snapshot=await page.evaluate(()=>{
   const hero=document.querySelector('#inicio'),items=[...document.querySelectorAll('#heroTrio .trio-obj')];
   const c=document.getElementById('gbHeroCosmosV46'),rect=hero.getBoundingClientRect();
   return {
    stage:!!window.GBHeroStage,
    count:items.length,imaged:items.filter(x=>x.querySelector('img')).length,
    css:getComputedStyle(c).display,canvas:c.width+'x'+c.height,
    active:GBHeroCosmosV46.active,frames:GBHeroCosmosV46.frames,
    dimensions:GBHeroCosmosV46.dimensions,quality:GBHeroCosmosV46.quality,
    heroHeight:rect.height,overflow:document.documentElement.scrollWidth-innerWidth
   };
  });
  assert(snapshot.stage&&snapshot.count===3,'original 3D trio lost '+JSON.stringify(snapshot));
  assert(snapshot.heroHeight>=620,'hero collapsed on mobile '+JSON.stringify(snapshot));
  assert(snapshot.overflow<=3,'horizontal overflow '+JSON.stringify(snapshot));
  // Regression proof for the specific user screenshots: ghost garments and
  // yellow slabs masking the headline cannot return during automatic orbit.
  const visual=await page.evaluate(()=>{
   const objs=[...document.querySelectorAll('#heroTrio .trio-obj')];
   const h=document.querySelector('#heroTitle');
   const pieces=[...h.querySelectorAll('.hl>span')];
   return {
    opaque:objs.map(el=>({css:getComputedStyle(el).opacity,inline:el.style.opacity,
      media:getComputedStyle(el.querySelector('.trio-media')).opacity,
      z:Number(getComputedStyle(el).zIndex)})),
    headline:h.textContent.trim().replace(/\\s+/g,' '),
    letterOpacity:pieces.map(el=>getComputedStyle(el).opacity),
    yellowBlades:[...h.querySelectorAll('.hl')].map(el=>getComputedStyle(el,'::after').display),
    cosmosBlend:getComputedStyle(document.getElementById('gbHeroCosmosV46')).mixBlendMode
   };
  });
  assert(visual.opaque.every(v=>v.css==='1'&&v.inline==='1'&&v.media==='1'),
   'transparent garment lets back jacket show through: '+JSON.stringify(visual));
  assert(visual.headline.length>13&&visual.letterOpacity.every(v=>v==='1'),
   'headline still hidden behind yellow animation '+JSON.stringify(visual));
  assert(visual.yellowBlades.every(v=>v==='none'),
   'yellow reveal slabs still cover live headline '+JSON.stringify(visual));
  if(!p.reduced) assert(visual.cosmosBlend==='normal',
   'galaxy darkened by multiply blending on ivory background');
  if(!p.reduced){
   try{await page.waitForFunction(()=>GBHeroCosmosV46.frames>=2,{timeout:6000})}
   catch(err){
    const diag=await page.evaluate(()=>({
     state:GBHeroCosmosV46.dimensions,frames:GBHeroCosmosV46.frames,
     active:GBHeroCosmosV46.active,quality:GBHeroCosmosV46.quality,
     hero:document.getElementById('heroStage').getBoundingClientRect().toJSON(),
     art:document.getElementById('heroArt').getBoundingClientRect().toJSON(),
     canvas:document.getElementById('gbHeroCosmosV46').getBoundingClientRect().toJSON(),
     intro:!!document.getElementById('gbRibbonBoot'),
     classes:document.body.className,html:document.documentElement.className,
     reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
     isHidden:document.hidden,scrollY,heroVisible:getComputedStyle(document.getElementById('heroStage')).visibility
    }));
    throw Error('Galaxy failed to render: '+JSON.stringify(diag));
   }
   const motion1=await page.evaluate(()=>({phase:GBHeroStage.phase,transform:document.querySelector('#heroTrio .trio-obj').style.transform}));
   await page.waitForTimeout(600);
   const motion2=await page.evaluate(()=>({phase:GBHeroStage.phase,transform:document.querySelector('#heroTrio .trio-obj').style.transform}));
   assert(motion2.phase>motion1.phase,'continuous orbital animation stopped on '+p.w);
   assert(motion1.transform!==motion2.transform,'the three items have become stationary');
   const result=await page.evaluate(()=>GBHeroCosmosV46);
   assert(snapshot.dimensions.canvas[0]<=1500&&snapshot.dimensions.canvas[1]<=1250,'unbounded canvas resolution');
   const ink=await page.evaluate(()=>{
     const canvas=document.getElementById('gbHeroCosmosV46');
     const rect=canvas.getBoundingClientRect();
     const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
     let nonempty=0,brightest=0;
     for(let i=0;i<d.length;i+=32){
      if(d[i+3]>0)nonempty++;
      if(d[i+3]>brightest)brightest=d[i+3];
     }
     return{nonempty,brightest,canvas:[canvas.width,canvas.height],rect:[rect.width,rect.height],stage:getComputedStyle(document.querySelector('#heroStage')).display};
   });
   assert(ink.canvas[0]>160&&ink.canvas[1]>160,'cosmos backing surface still 1px '+JSON.stringify(ink));
   assert(ink.nonempty>90&&ink.brightest>20,'cosmic trails invisible, too dark or never painted '+JSON.stringify(ink));
   if(p.w<600){
    assert(snapshot.quality.includes('mobile'),'adaptive mobile rendering missing');
    await page.touchscreen.tap(p.w*.66,Math.min(p.h*.48,p.h-160));
   }
  }else{
   assert(snapshot.css==='none','reduced motion should hide star trails');
   assert(snapshot.frames===0,'reduced motion should have zero ambient frames');
  }
  // Original shop navigation and catalog must remain intact.
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  assert(await page.locator('#productGrid .product-card').count()>=8,'product catalog lost');
  const after=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth-innerWidth,
   started:GB_CORE_READY,
   route:location.pathname
  }));
  assert(after.overflow<=3,'catalog overflow after hero');
  assert(errors.length===0,'JavaScript page errors '+errors.join(' | '));
  console.log('V46 OK',JSON.stringify({vp:p.w+'x'+p.h,reduced:p.reduced,
   count:snapshot.count,quality:snapshot.quality,frames:snapshot.frames,
   dpr:snapshot.dimensions.dpr,errors}));
  await ctx.close();
 }
}finally{await browser.close()}
