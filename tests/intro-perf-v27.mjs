// V27 → V45: adaptive, cheap, and nothing paints once the store is open (on or off screen); reduced motion skips.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height,q] of [[1280,720,''],[390,844,''],[1280,720,'?gbPuffLive=1']]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<500});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/'+q,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:30000});
 const before=await page.evaluate(()=>({logo:GBGlassRibbons.logoAsset,glass:GBGlassRibbons.fullGlass,mode:GBGlassRibbons.mode,cap:GBGlassRibbons.strandCap}));
 assert(before.glass,'intro failed '+JSON.stringify(before));
 assert(before.logo.includes('gb-monograma-amarelo-preto.svg'),'logo changed');
 assert(before.cap>=1000&&before.cap<=260000,'invalid strand budget '+JSON.stringify(before));
 if(q){
  await page.waitForFunction(()=>GBGlassRibbons.live||GBGlassRibbons.removed,null,{timeout:20000});
  const live=await page.evaluate(()=>GBGlassRibbons.live);
  if(live)assert(live.count<=before.cap&&live.quality>0&&live.quality<=1,'strand budget or adaptive quality broken '+JSON.stringify(live));
 }
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:18000});
 const retired=await page.evaluate(()=>GBGlassRibbons.frames);
 const scroll=await page.evaluate(()=>{window.scrollTo({top:document.documentElement.scrollHeight-innerHeight,behavior:'instant'});return {total:document.documentElement.scrollHeight,position:scrollY}});
 await page.waitForTimeout(500);
 const away=await page.evaluate(()=>GBGlassRibbons.frames);
 await page.waitForTimeout(600);
 const away2=await page.evaluate(()=>GBGlassRibbons.frames);
 assert(away2===away,'canvas kept painting offscreen');
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 if(width>=500)await page.mouse.move(width*.6,height*.4,{steps:4});
 await page.waitForTimeout(550);
 const resumed=await page.evaluate(()=>GBGlassRibbons.frames);
 assert(resumed===retired&&!(await page.evaluate(()=>GBGlassRibbons.active)),'retired intro restarted on the hero');
 assert(errors.length===0,'JS errors '+JSON.stringify(errors));
 console.log(JSON.stringify({viewport:width+'x'+height,q,ok:true,before,scroll,offscreenFrames:away2-away,errors}));
 await ctx.close();
}
// OS accessibility setting: no animation, no fullscreen trap.
const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const rpage=await reduced.newPage();
await rpage.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
await rpage.waitForFunction(()=>window.GBGlassRibbons,null,{timeout:30000});
const state=await rpage.evaluate(()=>({opening:GBGlassRibbons.opening,frames:GBGlassRibbons.frames,host:!!document.getElementById('gbRibbonBoot'),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
assert(state.reduced&&!state.opening&&state.frames===0&&!state.host,'reduced motion not respected '+JSON.stringify(state));
console.log('Reduced-motion preference OK');
await reduced.close();
await browser.close();
