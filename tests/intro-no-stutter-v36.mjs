import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<600});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(slow){const session=await ctx.newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:3})}
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>1,null,{timeout:17000});
 const head=await page.evaluate(()=>({logo:GBGlassRibbons.logoAsset,opening:GBGlassRibbons.opening}));
 assert(head.opening&&head.logo.includes('gb-monograma-amarelo-preto.svg'),'original logo/film missing');
 await page.waitForFunction(()=>GBGlassRibbons.parked===true,null,{timeout:16000});
 const parked=await page.evaluate(()=>({
   frame:GBGlassRibbons.frames,parkAt:GBGlassRibbons.parkAt,
   ink:GBGlassRibbons.signatureProgress,
   active:GBGlassRibbons.active,
   visibleTitle:document.querySelector('#gbRibbonBoot')?.classList.contains('is-preparing-entry'),
   coreCount:document.querySelectorAll('script[src*="gb-core-"]').length
 }));
 assert(parked.ink>.99&&!parked.active&&parked.visibleTitle&&parked.coreCount===0,
   'Logo must finish its motion BEFORE any heavy store JS '+JSON.stringify(parked));
 await page.waitForTimeout(450);
 const frozen=await page.evaluate(()=>({
   frames:GBGlassRibbons.frames,parked:GBGlassRibbons.parked,
   coreCount:document.querySelectorAll('script[src*="gb-core-"]').length
 }));
 assert(frozen.frames===parked.frame&&frozen.coreCount===0,
   'Core raced with moving ribbon or background rAF continued '+JSON.stringify({parked,frozen}));
 await page.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:22000});
 const done=await page.evaluate(()=>({
  core:GB_CORE_READY,removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,
  canvas:GBGlassRibbons.canvasSize,
  coreCount:document.querySelectorAll('script[src*="gb-core-"]').length,
  fitting:typeof window.GBFitting,overflow:document.documentElement.scrollWidth-innerWidth
 }));
 assert(done.core&&done.removed&&!done.active&&done.canvas[0]===0&&
   done.coreCount>=10&&done.fitting==='object'&&done.overflow<=2&&errors.length===0,
   'Core/hero regression '+JSON.stringify({done,errors}));
 console.log(JSON.stringify({viewport:width+'x'+height,slow,parked,frozen,done,errors}));
 await ctx.close();
}
// If the store fails to load, the intro cannot trap the visitor.
const failCtx=await browser.newContext({viewport:{width:390,height:844}});
await failCtx.route('**/gb-core-5.*.js',route=>route.abort());
const fail=await failCtx.newPage();
await fail.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
await fail.waitForFunction(()=>GB_CORE_FAILED===true&&GBGlassRibbons.removed===true,null,{timeout:20000});
const failure=await fail.evaluate(()=>({failed:GB_CORE_FAILED,removed:GBGlassRibbons.removed,screen:document.querySelector('#gbRibbonBoot')}));
assert(failure.failed&&failure.removed&&!failure.screen,'Failure path trapped visitor');
console.log('NETWORK_FAILURE',JSON.stringify({failed:failure.failed,removed:failure.removed}));
await failCtx.close();
await browser.close();