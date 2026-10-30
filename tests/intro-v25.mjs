// V25 → V45: the opening covers the page from the first frame, holds the GB puff, then hands over to the store.
// (V25 tested the ribbon film; its contract — fullscreen cover, retire, store intact, no click leak — stays.)
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const shot=name=>join(tmpdir(),name);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<600});
 let errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:16000});
 const reveal=await page.evaluate(()=>({
  opening:GBGlassRibbons.opening,mode:GBGlassRibbons.mode,
  poster:document.querySelector('.gb-puff-poster')?.getAttribute('src'),
  glass:!!document.querySelector('.gb-puff-glass'),
  oldIntro:!!document.querySelector('.gb-intro-grid'),
  ribbon:!!document.querySelector('.gb-ribbon-canvas,.gb-ribbon-signature'),
  overlayParent:document.querySelector('#gbRibbonBoot')?.parentElement?.tagName
 }));
 await page.screenshot({path:shot('v25-'+width+'-reveal.jpg'),type:'jpeg',quality:58});
 assert(reveal.opening,'opening finished too early '+JSON.stringify(reveal));
 assert(/gb-puff-poster/.test(reveal.poster||'')||reveal.mode==='live','first brand object is not the fur puff '+JSON.stringify(reveal));
 assert(!reveal.oldIntro&&!reveal.ribbon,'old block intro or ribbon still mounted');
 assert(reveal.overlayParent==='BODY','intro not fullscreen');
 // a tap or click on the stage never leaks to the store underneath
 if(width<600){await page.touchscreen.tap(120,340)}else{await page.mouse.move(800,320);await page.mouse.down();await page.mouse.up()}
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:18000});
 await page.waitForTimeout(400);
 const settled=await page.evaluate(()=>({
  opening:GBGlassRibbons.opening,settled:GBGlassRibbons.settled,
  removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,canvas:GBGlassRibbons.canvasSize,
  layer:!!document.querySelector('#gbRibbonBoot'),
  hero:!!document.querySelector('#heroArt'),fit:!!document.querySelector('#lookstudio'),
  overflow:document.documentElement.scrollWidth-innerWidth,
  modal:document.querySelector('#productModal')?.className
 }));
 await page.screenshot({path:shot('v25-'+width+'-settled.jpg'),type:'jpeg',quality:58});
 assert(settled.settled&&!settled.opening,'never settled: '+JSON.stringify(settled));
 assert(settled.removed&&!settled.active&&!settled.layer&&settled.canvas[0]===0,'intro still painting over the hero: '+JSON.stringify(settled));
 assert(settled.hero&&settled.fit,'existing site damaged: '+JSON.stringify(settled));
 assert(settled.overflow<=3,'horizontal overflow: '+JSON.stringify(settled));
 assert(!settled.modal?.includes('is-open'),'pointer leaked to product modal: '+settled.modal);
 assert(errors.length===0,'runtime errors '+JSON.stringify(errors));
 console.log(JSON.stringify({viewport:width+'x'+height,success:true,reveal,settled,errors}));
 await page.close();
}
await browser.close();
