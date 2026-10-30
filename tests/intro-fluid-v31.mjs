// V31 → V45: glass layers present, original logo as the fur's art, and the material answers the pointer: the
// original PlushTile brush opens under cursor/finger (live forced on this software GPU). Retires cleanly.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height] of [[1440,900],[390,844]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<500,deviceScaleFactor:1});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/?gbPuffLive=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:25000});
 const first=await page.evaluate(()=>({glass:getComputedStyle(document.querySelector('#gbRibbonBoot .gb-puff-glass')).backgroundImage,
  originalLogo:GBGlassRibbons.logoAsset,full:GBGlassRibbons.fullGlass}));
 assert(first.originalLogo==='./assets/brand/gb-monograma-amarelo-preto.svg','original logo changed');
 assert(first.full&&/gradient\(/.test(first.glass),'glass layers missing');
 const live=await page.waitForFunction(()=>GBGlassRibbons.live||GBGlassRibbons.removed,null,{timeout:20000}).then(()=>page.evaluate(()=>!!GBGlassRibbons.live));
 assert(live,'original PlushTile did not run live');
 const before=await page.evaluate(()=>({brush:GBGlassRibbons.brush,frames:GBGlassRibbons.frames}));
 if(width<500){const cdp=await ctx.newCDPSession(page);const tp=(t,x,y)=>cdp.send('Input.dispatchTouchEvent',{type:t,touchPoints:t==='touchEnd'?[]:[{x,y}]});
  await tp('touchStart',150,380);for(let i=1;i<=8;i++){await tp('touchMove',150+i*9,380+i*6);await page.waitForTimeout(40)}}
 else await page.mouse.move(width*.45,height*.45,{steps:6});
 const opened=await page.waitForFunction(()=>GBGlassRibbons.brush>.2||GBGlassRibbons.removed,null,{timeout:8000}).then(()=>page.evaluate(()=>({brush:GBGlassRibbons.brush,frames:GBGlassRibbons.frames,quality:GBGlassRibbons.quality,reason:GBGlassRibbons.reason})));
 assert(opened.brush>.2,'fibres inert under the pointer '+JSON.stringify({before,opened}));
 assert(opened.frames>before.frames,'render loop stopped');
 assert(opened.reason!=='skip','touching the puff skipped the intro');
 assert(opened.quality>0&&opened.quality<=1,'invalid adaptive quality');
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:17000});
 assert(!(await page.evaluate(()=>GBGlassRibbons.active)),'retired intro still painting');
 assert(!errors.length,'page errors '+errors);
 console.log(JSON.stringify({viewport:width+'x'+height,first,before,opened,errors}));
 await ctx.close();
}
await browser.close();
