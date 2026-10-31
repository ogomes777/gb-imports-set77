// V33 → V45: staged boot. The first paint is the stage alone (no store script yet); the store then boots IN
// PARALLEL while the puff is on screen (V45 contract: never gated on the GPU), and the page is complete after.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [w,h,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const c=await b.newContext({viewport:{width:w,height:h},hasTouch:w<600});
 const p=await c.newPage(),errs=[];
 p.on('pageerror',e=>errs.push(e.message));
 if(slow){const cd=await c.newCDPSession(p);await cd.send('Emulation.setCPUThrottlingRate',{rate:3})}
 const started=Date.now();
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:30000});
 await p.waitForFunction(()=>window.GBGlassRibbons,null,{timeout:10000});
 // V45.1: the store starts ~60 ms after the intro (its evaluation lands in the puff's rise) — never before the stage
 const atStart=await p.evaluate(()=>({opening:GBGlassRibbons.opening,ready:window.GB_CORE_READY,original:GBGlassRibbons.logoAsset,
  tl:GBGlassRibbons.timeline,hidden:getComputedStyle(document.querySelector('#top')).visibility}));
 assert(atStart.opening&&!atStart.ready&&atStart.hidden==='hidden'&&(!atStart.tl.coreBoot||atStart.tl.coreBoot>=40),'store scripts raced the first paint '+JSON.stringify(atStart));
 await p.waitForFunction(()=>GBGlassRibbons.visible,null,{timeout:12000});
 await p.waitForFunction(()=>document.querySelectorAll('script[src*="gb-core-"]').length>0||GBGlassRibbons.removed,null,{timeout:12000});
 const during=await p.evaluate(()=>({opening:GBGlassRibbons.opening,heavy:document.querySelectorAll('script[src*="gb-core-"]').length,coreBoot:GBGlassRibbons.timeline.coreBoot,visible:GBGlassRibbons.visible}));
 assert(during.heavy>0&&during.opening&&during.visible,'store did not boot in parallel with the puff '+JSON.stringify(during));
 await p.waitForFunction(()=>window.GB_CORE_READY===true&&GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:22000});
 const after=await p.evaluate(()=>({ms:Math.round(performance.now()),ready:GB_CORE_READY,fit:typeof GBFitting,
  heavy:document.querySelectorAll('script[src*="gb-core-"]').length,hidden:getComputedStyle(document.querySelector('#top')).visibility,
  logo:GBGlassRibbons.logoAsset,overflow:document.documentElement.scrollWidth-innerWidth,modal:!!document.getElementById('productModal'),
  active:GBGlassRibbons.active,retired:!document.querySelector('#gbRibbonBoot')}));
 assert(after.retired&&!after.active&&after.heavy>=10&&after.fit==='object'&&after.hidden==='visible'&&after.overflow<3&&errs.length===0,'Store incomplete '+JSON.stringify({after,errs}));
 console.log(JSON.stringify({width:w,slow,elapsed:Date.now()-started,atStart,during,after,errors:errs}));
 await c.close();
}
// Direct product links must load the product immediately, without holding the lead in a film.
const deepCtx=await b.newContext({viewport:{width:390,height:844}});
const deep=await deepCtx.newPage();const deepe=[];
deep.on('pageerror',e=>deepe.push(e.message));
await deep.goto('http://127.0.0.1:8080/?peca=gb-sh-02',{waitUntil:'domcontentloaded'});
await deep.waitForFunction(()=>window.GB_CORE_READY===true,null,{timeout:25000});
await deep.waitForFunction(()=>document.querySelector('#productModal h2')?.textContent?.length>3,null,{timeout:10000});
const direct=await deep.evaluate(()=>({opening:GBGlassRibbons.opening,ready:GB_CORE_READY,product:document.querySelector('#productModal h2')?.textContent,hidden:getComputedStyle(document.querySelector('#top')).visibility}));
assert(!direct.opening&&direct.ready&&direct.hidden==='visible'&&deepe.length===0,'direct product URL regressed '+JSON.stringify({direct,deepe}));
console.log('DIRECT_PRODUCT',direct);
await deepCtx.close();
await b.close();
