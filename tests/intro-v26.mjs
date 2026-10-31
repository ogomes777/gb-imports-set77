// V26 → V45: full-bleed black glass, the original GB monogram as the fur's artwork, release onto the store.
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
  opening:GBGlassRibbons.opening,fullGlass:GBGlassRibbons.fullGlass,originalLogo:GBGlassRibbons.logoAsset,
  bg:getComputedStyle(document.getElementById('gbRibbonBoot')).backgroundColor,
  overlayParent:document.querySelector('#gbRibbonBoot')?.parentElement?.tagName,
  flat:[...document.querySelectorAll('#gbRibbonBoot img')].filter(i=>/\.svg/.test(i.getAttribute('src')||'')).length
 }));
 await page.screenshot({path:shot('v26-'+width+'-reveal.jpg'),type:'jpeg',quality:58});
 assert(reveal.opening&&reveal.overlayParent==='BODY','intro not fullscreen/opening '+JSON.stringify(reveal));
 assert(reveal.fullGlass,'Glass background not full bleed');
 assert(reveal.bg==='rgb(0, 0, 0)','stage is not black glass '+reveal.bg);
 assert(reveal.originalLogo==='./assets/brand/gb-monograma-amarelo-preto.svg','Original GB logo was replaced');
 assert(reveal.flat===0,'flat SVG monogram shown on the stage');
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:18000});
 await page.waitForTimeout(400);
 const settled=await page.evaluate(()=>({
  settled:GBGlassRibbons.settled,opening:GBGlassRibbons.opening,removed:GBGlassRibbons.removed,
  hero:!!document.querySelector('#heroArt'),fit:!!document.querySelector('#lookstudio'),
  overflow:document.documentElement.scrollWidth-innerWidth,modal:document.querySelector('#productModal')?.className
 }));
 await page.screenshot({path:shot('v26-'+width+'-settled.jpg'),type:'jpeg',quality:58});
 assert(settled.settled&&!settled.opening&&settled.removed,'never settled: '+JSON.stringify(settled));
 assert(settled.hero&&settled.fit,'existing site damaged: '+JSON.stringify(settled));
 assert(settled.overflow<=3,'horizontal overflow: '+JSON.stringify(settled));
 assert(!settled.modal?.includes('is-open'),'pointer leaked to product modal: '+settled.modal);
 assert(errors.length===0,'runtime errors '+JSON.stringify(errors));
 console.log(JSON.stringify({viewport:width+'x'+height,success:true,reveal,settled,errors}));
 await page.close();
}
await browser.close();
