import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<600});
 let errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons&&document.querySelector('.gb-ribbon-layer'),null,{timeout:16000});
 await page.waitForTimeout(1240);
 const reveal=await page.evaluate(()=>({
  opening:GBGlassRibbons.opening,frames:GBGlassRibbons.frames,
  logo:getComputedStyle(document.querySelector('.gb-ribbon-signature')).opacity,
  image:getComputedStyle(document.querySelector('.gb-ribbon-signature img')).clipPath,
  glass:!!document.querySelector('.gb-ribbon-glass'),
  oldIntro:!!document.querySelector('.gb-intro-grid'),
  overlayParent:document.querySelector('.gb-ribbon-layer')?.parentElement?.tagName,
  ribbon:!!document.querySelector('.gb-ribbon-canvas'),
  fullGlass:GBGlassRibbons.fullGlass,
  originalLogo:GBGlassRibbons.logoAsset
 }));
 await page.screenshot({path:'v25-'+width+'-reveal.jpg',type:'jpeg',quality:58});
 assert(reveal.frames>2,'ribbons not rendering: '+JSON.stringify(reveal));
 assert(reveal.opening,'opening finished too early');
 assert(!reveal.oldIntro,'old block intro still mounted');
 assert(reveal.overlayParent==='BODY','intro not fullscreen');
 assert(reveal.fullGlass,'Glass background not full bleed');
 assert(reveal.originalLogo==='./assets/brand/gb-monograma-amarelo-preto.svg','Original GB logo was replaced');
 const oldFrames=reveal.frames;
 if(width<600){await page.touchscreen.tap(120,340)}else{await page.mouse.move(800,320);await page.mouse.down();await page.mouse.up()}
 await page.waitForTimeout(1800);
 const settled=await page.evaluate(()=>({
  opening:GBGlassRibbons.opening,
  settled:GBGlassRibbons.settled,
  frames:GBGlassRibbons.frames,
  canvas:GBGlassRibbons.canvasSize,
  parent:document.querySelector('.gb-ribbon-layer').parentElement?.id,
  layer:document.querySelector('.gb-ribbon-layer').className,
  logoPresent:!!document.querySelector('.gb-ribbon-signature img'),
  hero:!!document.querySelector('#heroArt'),
  fit:!!document.querySelector('#lookstudio'),
  overflow:document.documentElement.scrollWidth-innerWidth,
  modal:document.querySelector('#productModal')?.className
 }));
 await page.screenshot({path:'v25-'+width+'-settled.jpg',type:'jpeg',quality:58});
 assert(settled.settled&&!settled.opening,'never settled: '+JSON.stringify(settled));
 assert(settled.frames>oldFrames+5,'ribbons stopped: '+JSON.stringify(settled));
 assert(settled.parent==='heroStage'&&settled.hero&&settled.fit,'existing site damaged: '+JSON.stringify(settled));
 assert(await page.evaluate(()=>GBGlassRibbons.fullGlass),'settled Glass not full bleed');
 assert(settled.overflow<=3,'horizontal overflow: '+JSON.stringify(settled));
 assert(!settled.modal?.includes('is-open'),'pointer leaked to product modal: '+settled.modal);
 assert(errors.length===0,'runtime errors '+JSON.stringify(errors));
 const pointer=await page.evaluate(()=>GBGlassRibbons.pointer);
 assert(pointer[0]>0.2&&pointer[0]<.9,'pointer/touch not tracked '+pointer);
 console.log(JSON.stringify({viewport:width+'x'+height,success:true,reveal,settled,pointer,errors}));
 await page.close();
}
await browser.close();