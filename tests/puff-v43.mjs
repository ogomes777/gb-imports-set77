import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const c of [
  {name:'desktop',width:1440,height:900,reduced:false},
  {name:'mobile',width:390,height:844,reduced:false},
  {name:'reduced',width:390,height:844,reduced:true},
 ]){
  const ctx=await browser.newContext({viewport:{width:c.width,height:c.height},
    reducedMotion:c.reduced?'reduce':'no-preference',hasTouch:c.width<600,
    deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:35000});
  if(!c.reduced){
   await page.waitForFunction(()=>window.GBGlassRibbons?.opening&&window.GBPuffV43,{timeout:15000});
   assert(await page.locator('#gbRibbonBoot .gb-material-stage').count()===1,'plush stage missing');
   const black=await page.evaluate(()=>getComputedStyle(document.querySelector('#gbRibbonBoot')).backgroundColor);
   assert(black==='rgb(5, 5, 6)','first-paint not black '+black);
   assert(await page.locator('#gbRibbonBoot .gb-ribbon-canvas').isHidden(),'old ribbon canvas still visible');
   await page.waitForFunction(()=>window.GBPlushV43?.mounted,{timeout:15000});
   const pre=await page.evaluate(()=>({
     source:GBPlushV43.mounted,canvas:!!document.querySelector('.gb-plush-react-root canvas'),
     src:document.querySelector('.gb-plush-fallback img')?.getAttribute('src'),
     glyph:document.querySelector('.gb-material-stage')?.getAttribute('aria-label'),
     ribbon:getComputedStyle(document.querySelector('#gbRibbonBoot .gb-ribbon-canvas')).display
   }));
   assert(pre.source&&pre.canvas&&pre.src.includes('gb-monograma'),'original shader app not mounted '+JSON.stringify(pre));
   const area=await page.locator('.gb-plush-react-root').boundingBox();
   assert(area?.width>=c.width-2,'original plush component is not full bleed');
   await page.mouse.move(c.width*.50,c.height*.48);
   await page.waitForTimeout(250);
   await page.waitForFunction(()=>window.GB_CORE_READY||window.GB_CORE_FAILED,{timeout:14000});
   await page.waitForFunction(()=>GBGlassRibbons.removed,{timeout:8500});
   assert(await page.locator('#gbRibbonBoot').count()===0,'intro stuck on foreground');
   assert(!await page.evaluate(()=>document.documentElement.classList.contains('gb-ribbon-intro-playing')),'page remained locked');
   assert(await page.locator('#top').isVisible(),'header never opened');
  }else{
   await page.waitForFunction(()=>window.GB_CORE_READY,{timeout:20000});
   assert(await page.locator('#gbRibbonBoot').count()===0,'reduced-motion users trapped in intro');
  }
  await page.waitForFunction(()=>window.GB_CORE_READY,{timeout:20000});
  assert(await page.locator('#productGrid .product-card').count()>=8,'shop failed after intro');
  assert((await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))<=2,'horizontal overflow');
  assert(!errors.length,'page errors '+JSON.stringify(errors));
  console.log(JSON.stringify({name:c.name,core:true,plush:c.reduced?'skip':'mounted',errors,ok:true}));
  await ctx.close();
 }
 // Simulate no WebGL and failed texture: the official image remains and the shop opens.
 const ctx=await browser.newContext({viewport:{width:390,height:844}});
 await ctx.addInitScript(()=>{
  const oldGet=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(name,...rest){
   if(name==='webgl2')return null;return oldGet.call(this,name,...rest);
  };
 });
 const p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.GBPuffV43&&window.GBPlushV43?.mounted,{timeout:15000});
 const f=await p.evaluate(()=>({
  img:document.querySelector('.gb-plush-fallback img')?.complete,
  source:document.querySelector('.gb-plush-fallback img')?.naturalWidth,
  notHidden:getComputedStyle(document.querySelector('.gb-plush-fallback')).opacity
 }));
 assert(f.img&&f.source>0&&f.notHidden==='1','fallback invisibility '+JSON.stringify(f));
 await p.waitForFunction(()=>window.GB_CORE_READY&&window.GBGlassRibbons.removed,{timeout:18000});
 assert(!errors.length,'failure path JS errors '+errors);
 console.log('NO_WEBGL_FALLBACK',JSON.stringify({...f,opens:true,errors}));
 await ctx.close();
}finally{await browser.close()}
