import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const shot=name=>join(tmpdir(),name);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [w,h,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:w<600,deviceScaleFactor:w<600?2:1,reducedMotion:'no-preference'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(slow){const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:3})}
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>=2,null,{timeout:30000});
 const state=await page.evaluate(()=>({
  ready:GBGlassRibbons.signatureInkReady,
  original:GBGlassRibbons.logoAsset,
  screen:document.getElementById('gbRibbonBoot').getBoundingClientRect().toJSON(),
  pointer:getComputedStyle(document.getElementById('gbRibbonBoot')).pointerEvents
 }));
 await page.waitForFunction(()=>GBGlassRibbons.signatureInkReady,{timeout:10000});
 const initial=await page.evaluate(()=>{
  const line=document.querySelector('.gb-ribbon-ink-outline');
  return {length:line.getTotalLength(),dash:parseFloat(line.style.strokeDashoffset),paths:document.querySelectorAll('.gb-ribbon-ink path').length}
 });
 assert(initial.length>1200&&initial.paths>0,'Signature needs real vector outlines');
 assert(initial.paths===(w<600?1:2),'mobile missing lite outline or desktop glint');
 await page.waitForTimeout(1550);
 const mid=await page.evaluate(()=>{
  const line=document.querySelector('.gb-ribbon-ink-outline');
  return {progress:GBGlassRibbons.signatureProgress,offset:parseFloat(line.style.strokeDashoffset),
   ready:GBGlassRibbons.signatureInkReady,frames:GBGlassRibbons.frames,paint:GBGlassRibbons.paintMs,
   sample:GBGlassRibbons.sweep,quality:GBGlassRibbons.quality}
 });
 await page.screenshot({path:shot('v32-'+w+'-signature.jpg'),type:'jpeg',quality:62});
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:23000});
 const hero=await page.evaluate(()=>({frames:GBGlassRibbons.frames,quality:GBGlassRibbons.quality,overflow:document.documentElement.scrollWidth-innerWidth,hero:!!document.getElementById('heroStage'),fit:!!document.getElementById('lookstudio')}));
 assert(hero.hero&&hero.fit&&hero.overflow<=2&&errors.length===0,'regression '+JSON.stringify({hero,errors}));
 if(w<600)await page.touchscreen.tap(100,290);else await page.mouse.move(690,340,{steps:6});
 await page.waitForTimeout(350);
 const after=await page.evaluate(()=>({frames:GBGlassRibbons.frames,bend:GBGlassRibbons.flowBend,ink:GBGlassRibbons.signatureInkReady}));
 assert(after.frames===hero.frames&&!(await page.evaluate(()=>GBGlassRibbons.active)),'retired intro restarted on input');
 console.log(JSON.stringify({w,h,slow,state,initial,mid,hero,after,errors}));
 await context.close();
}
await browser.close();