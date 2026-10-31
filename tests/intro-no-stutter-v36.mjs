// V36 → V45: no stutter, no trap. The store boots in parallel (scripts are spaced by idle callbacks), the puff
// keeps its state through it, the core finishes, and a failing core chunk still releases the visitor.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<600});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(slow){const session=await ctx.newCDPSession(page);await session.send('Emulation.setCPUThrottlingRate',{rate:3})}
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:17000});
 const head=await page.evaluate(()=>({logo:GBGlassRibbons.logoAsset,opening:GBGlassRibbons.opening}));
 assert(head.opening&&head.logo.includes('gb-monograma-amarelo-preto.svg'),'original logo/intro missing');
 await page.waitForFunction(()=>GBGlassRibbons.parked===true,null,{timeout:16000});
 // long tasks while the puff is on screen and the store boots underneath it
 const lt=await page.evaluate(()=>new Promise(res=>{const out=[];try{const o=new PerformanceObserver(l=>l.getEntries().forEach(e=>out.push(Math.round(e.duration))));o.observe({type:'longtask',buffered:false});setTimeout(()=>{o.disconnect();res(out)},900)}catch{res([])}}));
 const parked=await page.evaluate(()=>({opening:GBGlassRibbons.opening,state:GBGlassRibbons.state,parkAt:GBGlassRibbons.parkAt,coreCount:document.querySelectorAll('script[src*="gb-core-"]').length}));
 assert(parked.coreCount>0,'store did not boot in parallel '+JSON.stringify(parked));
 assert(!slow?Math.max(0,...lt)<400:true,'main thread blocked for too long while the puff was on screen '+JSON.stringify(lt));
 await page.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:22000});
 const done=await page.evaluate(()=>({core:GB_CORE_READY,removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,canvas:GBGlassRibbons.canvasSize,
  coreCount:document.querySelectorAll('script[src*="gb-core-"]').length,fitting:typeof window.GBFitting,overflow:document.documentElement.scrollWidth-innerWidth}));
 assert(done.core&&done.removed&&!done.active&&done.canvas[0]===0&&done.coreCount>=10&&done.fitting==='object'&&done.overflow<=2&&errors.length===0,
   'Core/hero regression '+JSON.stringify({done,errors}));
 console.log(JSON.stringify({viewport:width+'x'+height,slow,parked,longTasks:lt,done,errors}));
 await ctx.close();
}
// If the store fails to load, the intro cannot trap the visitor.
const failCtx=await browser.newContext({viewport:{width:390,height:844}});
await failCtx.route('**/gb-core-5.*.js',route=>route.abort());
const fail=await failCtx.newPage();
await fail.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
await fail.waitForFunction(()=>GB_CORE_FAILED===true&&GBGlassRibbons.removed===true,null,{timeout:20000});
const failure=await fail.evaluate(()=>({failed:GB_CORE_FAILED,removed:GBGlassRibbons.removed,screen:document.querySelector('#gbRibbonBoot'),playing:document.documentElement.classList.contains('gb-ribbon-intro-playing')}));
assert(failure.failed&&failure.removed&&!failure.screen&&!failure.playing,'Failure path trapped visitor');
console.log('NETWORK_FAILURE',JSON.stringify({failed:failure.failed,removed:failure.removed}));
await failCtx.close();
await browser.close();
