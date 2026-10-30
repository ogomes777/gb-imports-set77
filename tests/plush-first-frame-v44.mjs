import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const base='http://127.0.0.1:8080';
try{
 for(const c of [
  {name:'desktop',width:1440,height:900,reduced:false},
  {name:'mobile',width:390,height:844,reduced:false},
  {name:'reduced',width:390,height:844,reduced:true}
 ]){
  const ctx=await browser.newContext({viewport:{width:c.width,height:c.height},deviceScaleFactor:1,
    reducedMotion:c.reduced?'reduce':'no-preference',hasTouch:c.width<600});
  const page=await ctx.newPage(),errors=[],failedRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',req=>failedRequests.push(req.url()));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:35000});
  if(!c.reduced){
   await page.waitForFunction(()=>window.GBPuffV43&&window.GBGlassRibbons,{timeout:12000});
   const first=await page.evaluate(()=>{
    const boot=document.getElementById('gbRibbonBoot');
    const stage=boot?.querySelector('.gb-material-stage');
    const flat=stage?.querySelector('.gb-plush-fallback');
    const root=stage?.querySelector('.gb-plush-react-root');
    return {
      bg:getComputedStyle(boot).backgroundColor,
      noFlat:flat?getComputedStyle(flat).display==='none':true,
      sourceHidden:root?getComputedStyle(root).opacity==='0':false,
      oldRibbonHidden:getComputedStyle(boot.querySelector('.gb-ribbon-canvas')).display==='none',
      isV44:boot.classList.contains('gb-puff-v44'),
      glyph:stage?.getAttribute('aria-label'),
      mobile:innerWidth<=780
    };
   });
   assert(first.isV44&&first.noFlat&&first.oldRibbonHidden,
     'flat/icon/ribbon leaked into first frame '+JSON.stringify(first));
   assert(first.bg==='rgb(5, 5, 6)','first frame not black glass');
   await page.waitForFunction(()=>window.GBPlushV43?.mounted,{timeout:15000});
   assert(await page.locator('.gb-plush-react-root canvas').count()===1,'original fur canvas missing');
   await page.mouse.move(c.width/2,c.height/2);
   if(c.width<600){
    await page.touchscreen.tap(c.width/2,c.height/2);
   }
   await page.waitForFunction(()=>window.GBGlassRibbons?.removed&&window.GB_CORE_READY,{timeout:13000});
   assert(await page.locator('#gbRibbonBoot').count()===0,'intro held storefront after handoff');
   assert(!await page.evaluate(()=>document.documentElement.classList.contains('gb-ribbon-intro-playing')),
     'main page remained scroll-locked');
  }else{
   await page.waitForFunction(()=>window.GB_CORE_READY,{timeout:17000});
   assert(await page.locator('#gbRibbonBoot').count()===0,'reduced-motion intro not skipped');
  }
  await page.locator('#colecao').scrollIntoViewIfNeeded();
  const cards=await page.locator('#productGrid .product-card').count();
  assert(cards>=8,'store catalog empty');
  assert((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,'horizontal overflow');
  assert(errors.length===0,'page errors '+errors);
  assert(!failedRequests.some(u=>u.includes('gb-plush-v43')),'plush bundle load failure '+failedRequests);
  console.log('V44',JSON.stringify({mode:c.name,flatHidden:true,coreOpened:true,cards,errors}));
  await ctx.close();
 }
 for(const mode of ['no-webgl','network-failure']){
  const ctx=await browser.newContext({viewport:{width:390,height:844}});
  if(mode==='no-webgl')await ctx.addInitScript(()=>{
   const get=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(type,...args){
    if(type==='webgl2')return null;
    return get.call(this,type,...args);
   };
  });
  const page=await ctx.newPage();
  if(mode==='network-failure'){
   await page.route('**/_gb/gb-plush-v43.*.js',route=>route.abort());
  }
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.GBPuffV43,{timeout:9000});
  const flat=await page.evaluate(()=>getComputedStyle(document.querySelector('.gb-plush-fallback')).display);
  assert(flat==='none','flat tile displayed on failed WebGL/network');
  await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBGlassRibbons.removed,{timeout:16000});
  assert(await page.locator('#productGrid .product-card').count()>=8,'store failed after '+mode);
  assert(errors.length===0,'console error under '+mode+': '+errors);
  console.log('V44 failure test',JSON.stringify({mode,flat,core:true}));
  await ctx.close();
 }
}finally{await browser.close()}
