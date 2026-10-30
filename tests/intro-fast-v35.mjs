// V35 → V45: fast. The puff is on screen in well under a second and the store is open within the watchdog, on
// desktop, mobile and a 3× slower CPU; nothing keeps painting the hero afterwards.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 if(slow){const cd=await context.newCDPSession(page);await cd.send('Emulation.setCPUThrottlingRate',{rate:3})}
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:16000});
 const before=await page.evaluate(()=>({opening:GBGlassRibbons.opening,svg:GBGlassRibbons.logoAsset,removed:GBGlassRibbons.removed,tl:GBGlassRibbons.timeline}));
 assert(before.opening&&!before.removed&&before.svg.includes('gb-monograma-amarelo-preto.svg'),'intro not initial');
 assert((before.tl.posterShown||before.tl.liveReady)<(slow?2000:1200),'puff too slow to appear '+JSON.stringify(before.tl));
 await page.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:20000});
 const ended=await page.evaluate(()=>({removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,frame:GBGlassRibbons.frames,canvas:GBGlassRibbons.canvasSize,
  fit:typeof GBFitting,core:GB_CORE_READY,overflow:document.documentElement.scrollWidth-innerWidth,tl:GBGlassRibbons.timeline}));
 assert(ended.removed&&!ended.active&&ended.canvas[0]===0&&ended.fit==='object'&&ended.core&&ended.overflow<3,'hero regression '+JSON.stringify(ended));
 assert(ended.tl.finished<=(slow?7600:6600),'store released after the watchdog '+JSON.stringify(ended.tl));
 await page.waitForTimeout(250);
 assert(await page.evaluate(()=>GBGlassRibbons.frames)===ended.frame,'intro still paints hero');
 assert(errors.length===0,'JS errors '+JSON.stringify(errors));
 console.log(JSON.stringify({viewport:width+'x'+height,slow,before:before.tl,ended:ended.tl,errors}));
 await context.close();
}
await browser.close();
