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
