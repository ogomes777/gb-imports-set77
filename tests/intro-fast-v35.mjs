import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<600,deviceScaleFactor:1});
 const page=await context.newPage(),errors=[];
 if(slow){const cd=await context.newCDPSession(page);await cd.send('Emulation.setCPUThrottlingRate',{rate:3})}
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>=2,null,{timeout:16000});
 const t0=performance.now();
 const before=await page.evaluate(()=>({
  opening:GBGlassRibbons.opening,
  svg:GBGlassRibbons.logoAsset,
  removed:GBGlassRibbons.removed,
  core:GB_CORE_READY
 }));
 assert(before.opening&&!before.removed&&before.svg.includes('gb-monograma-amarelo-preto.svg'),'intro not initial');
 await page.waitForTimeout(1450);
 const signed=await page.evaluate(()=>({
  sweep:GBGlassRibbons.sweep,
  ink:GBGlassRibbons.signatureProgress,
  frames:GBGlassRibbons.frames,
  glow:!!document.querySelector('#gbRibbonBoot .gb-ribbon-scan'),
  active:GBGlassRibbons.active
 }));
 assert(signed.frames>2&&signed.glow&&signed.sweep<.96&&!!(await page.locator('#gbRibbonBoot .gb-material-tile').count()),'material signature or cinematic motion missing '+JSON.stringify(signed));
 await page.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:20000});
 const elapsed=performance.now()-t0;
 const ended=await page.evaluate(()=>({
  removed:GBGlassRibbons.removed,
  active:GBGlassRibbons.active,
  frame:GBGlassRibbons.frames,
  canvas:GBGlassRibbons.canvasSize,
  fit:typeof GBFitting,
  core:GB_CORE_READY,
  overflow:document.documentElement.scrollWidth-innerWidth
 }));
 assert(ended.removed&&!ended.active&&ended.canvas[0]===0&&ended.fit==='object'&&ended.core&&ended.overflow<3,'hero regression '+JSON.stringify(ended));
 await page.waitForTimeout(250);
 assert(await page.evaluate(()=>GBGlassRibbons.frames)===ended.frame,'intro still paints hero');
 assert(errors.length===0,'JS errors '+JSON.stringify(errors));
 console.log(JSON.stringify({viewport:width+'x'+height,slow,elapsedMs:Math.round(elapsed),before,signed,ended,errors}));
 await context.close();
}
await browser.close();