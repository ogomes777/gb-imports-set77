import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height] of [[1280,720],[390,844]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<500});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>0,null,{timeout:30000});
  const before=await page.evaluate(()=>({
   quality:GBGlassRibbons.quality,
   frameGapMs:GBGlassRibbons.frameGapMs,
   paintMs:GBGlassRibbons.paintMs,
   frames:GBGlassRibbons.frames,
   logo:GBGlassRibbons.logoAsset,
   settled:GBGlassRibbons.settled,
   glass:GBGlassRibbons.fullGlass
 }));
 assert(before.glass,'intro failed '+JSON.stringify(before));
 assert(before.logo.includes('gb-monograma-amarelo-preto.svg'),'logo changed');
 assert(before.quality>=0&&before.quality<=2,'invalid adaptive state');
 assert(before.paintMs[0]<20,'canvas paint cost too high '+JSON.stringify(before));
 if(width<500)await page.touchscreen.tap(162,325);
 else await page.mouse.move(790,255,{steps:4});
 await page.waitForTimeout(350);
 const moved=await page.evaluate(()=>({
   pointer:GBGlassRibbons.pointer,frames:GBGlassRibbons.frames,
   quality:GBGlassRibbons.quality
 }));
 assert(moved.pointer[0]>.18&&moved.pointer[0]<.82,'input lost');
 assert(moved.frames>before.frames,'ribbon loop stopped');
 // V34+: depois do portal a abertura sai; rolar a página e voltar ao topo não religa o filme
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:18000});
 const retired=await page.evaluate(()=>GBGlassRibbons.frames);
 const scroll=await page.evaluate(()=>{
   window.scrollTo({top:document.documentElement.scrollHeight-innerHeight,behavior:'instant'});
   return {total:document.documentElement.scrollHeight,position:scrollY};
 });
 await page.waitForTimeout(500);
 const away=await page.evaluate(()=>GBGlassRibbons.frames);
 await page.waitForTimeout(600);
 const away2=await page.evaluate(()=>GBGlassRibbons.frames);
 assert(away2===away,'canvas kept painting offscreen');
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
 await page.waitForTimeout(550);
 const resumed=await page.evaluate(()=>GBGlassRibbons.frames);
 assert(resumed===retired&&!(await page.evaluate(()=>GBGlassRibbons.active)),'retired intro restarted on the hero');
 assert(errors.length===0,'JS errors '+JSON.stringify(errors));
 console.log(JSON.stringify({viewport:width+'x'+height,ok:true,before,moved,offscreenFrames:away2-away,errors}));
 await ctx.close();
}
// OS accessibility setting: no ribbon animation, no fullscreen animation trap.
const reduced=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const rpage=await reduced.newPage();
await rpage.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
await rpage.waitForFunction(()=>window.GBGlassRibbons,null,{timeout:30000});
const state=await rpage.evaluate(()=>({opening:GBGlassRibbons.opening,frames:GBGlassRibbons.frames,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches}));
assert(state.reduced&&!state.opening&&state.frames===0,'reduced motion not respected');
console.log('Reduced-motion preference OK');
await reduced.close();
await browser.close();