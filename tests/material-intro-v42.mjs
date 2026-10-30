import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try {
 for(const cfg of [
  {name:'desktop',width:1440,height:900,reduced:false},
  {name:'mobile',width:390,height:844,reduced:false},
  {name:'reduced',width:390,height:844,reduced:true}
 ]){
  const ctx=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},deviceScaleFactor:1,hasTouch:cfg.width<700,reducedMotion:cfg.reduced?'reduce':'no-preference'});
  const p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:35000});
  if(cfg.reduced){
   await p.waitForFunction(()=>window.GB_CORE_READY,{timeout:25000});
   assert(await p.locator('#gbRibbonBoot').count()===0,'reduced intro should be removed immediately');
  }else{
   await p.waitForFunction(()=>window.GBGlassRibbons?.frames>1&&window.GBMaterialSignatureV42,{timeout:20000});
   const init=await p.evaluate(()=>{
    const el=document.querySelector('#gbRibbonBoot'),css=getComputedStyle(el);
    return {logo:GBMaterialSignatureV42.asset,bg:css.backgroundColor,mode:GBMaterialSignatureV42.mode,scene:!!el.querySelector('.gb-material-tile'),count:GBMaterialSignatureV42.strands,heavy:document.querySelectorAll('script[src*="gb-core-"]').length};
   });
   assert(init.bg==='rgb(5, 5, 6)','first-frame black substrate missing '+JSON.stringify(init));
   assert(init.scene&&init.logo.includes('gb-monograma-amarelo-preto.svg'),'monogram is not local/official');
   assert(init.heavy===0,'heavy store scripts started before material film');
   await p.waitForTimeout(1600);
   const during=await p.evaluate(()=>({material:GBMaterialSignatureV42.mode,frames:GBMaterialSignatureV42.frames,alive:GBGlassRibbons.opening}));
   assert(['webgl2','fallback'].includes(during.material),'material renderer not initialized');
   const material=await p.evaluate(()=>{
     const gb=window.GBMaterialSignatureV42;
     const el=document.querySelector('.gb-material-tile');
     const fallback=document.querySelector('.gb-material-static');
     const logo=document.querySelector('.gb-material-static img');
     return {
       mode:gb.mode,verified:gb.verified,sample:gb.sample,buffer:gb.buffer,
       frameCount:gb.frames,ready:gb.artworkReady,
       size:el?.getBoundingClientRect().width,
       fallbackDisplay:getComputedStyle(fallback).display,
       logoLoaded:logo.complete&&logo.naturalWidth>0
     };
   });
   assert(material.logoLoaded,'official GB monogram not loaded');
   assert(material.size>170,'signature object size is invalid');
   assert(material.mode==='fallback'||(
     material.buffer[0]>24&&material.buffer[1]>24&&
     (material.verified||material.fallbackDisplay!=='none')
   ),'GPU hidden fallback without verified visible output '+JSON.stringify(material));
   if(material.verified){
     assert(material.sample?.buffer[0]>24,'GPU still has a 1px buffer');
     const colors=[material.sample.center,material.sample.offset];
     assert(colors.some(p=>p[3]>150&&Math.max(...p.slice(0,3))>90),'GPU frame appears black '+JSON.stringify(material));
   }else{
     assert(material.fallbackDisplay!=='none','unverified GPU hid the safe GB fallback '+JSON.stringify(material));
   }
   await p.waitForFunction(()=>window.GBGlassRibbons?.parked,{timeout:20000});
   const parked=await p.evaluate(()=>({running:GBGlassRibbons.active,material:GBMaterialSignatureV42?.mode,heavy:document.querySelectorAll('script[src*="gb-core-"]').length}));
   assert(!parked.running,'gold ribbon kept rendering with boot');
   assert(parked.heavy===0,'heavy core started while cinematic was moving');
   await p.waitForFunction(()=>window.GB_CORE_READY&&GBGlassRibbons.removed,{timeout:30000});
   assert(await p.locator('#gbRibbonBoot').count()===0,'intro leaked after landing reveal');
  }
  await p.locator('#colecao').scrollIntoViewIfNeeded();
  const cards=await p.locator('#productGrid .product-card').count();
  assert(cards===8,'catalog changed unexpectedly '+cards);
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert(overflow<=2,'horizontal overflow '+overflow);
  assert(!errors.length,'JavaScript errors '+JSON.stringify(errors));
  console.log(JSON.stringify({cfg:cfg.name,cards,overflow,errors,ok:true}));
  await ctx.close();
 }
}finally{await browser.close()}
