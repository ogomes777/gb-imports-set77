import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height] of [[1440,900],[390,844]]){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<500,deviceScaleFactor:1});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>0,null,{timeout:25000});
 const first=await page.evaluate(()=>({sweep:GBGlassRibbons.sweep,signature:GBGlassRibbons.signatureProgress,
  glass:getComputedStyle(document.querySelector('#gbRibbonBoot .gb-ribbon-glass')).backgroundImage,
  originalLogo:GBGlassRibbons.logoAsset}));
 assert(first.originalLogo==='./assets/brand/gb-monograma-amarelo-preto.svg','original logo changed');
 assert(first.glass.includes('radial-gradient'),'ceramic glass layers missing');
 await page.waitForFunction(()=>GBGlassRibbons.settled&&document.getElementById('gbRibbonBoot').parentElement.id==='heroStage',null,{timeout:17000});
 const before=await page.evaluate(()=>({bend:GBGlassRibbons.flowBend,twist:GBGlassRibbons.flowTwist,frames:GBGlassRibbons.frames}));
 if(width<500){await page.touchscreen.tap(70,170);}else{await page.mouse.move(210,170,{steps:4});await page.mouse.down();}
 await page.waitForTimeout(260);
 const left=await page.evaluate(()=>({bend:GBGlassRibbons.flowBend,twist:GBGlassRibbons.flowTwist,frames:GBGlassRibbons.frames}));
 if(width<500){await page.touchscreen.tap(300,650);}else{await page.mouse.move(1080,650,{steps:8});await page.mouse.up();}
 await page.waitForTimeout(450);
 const right=await page.evaluate(()=>({bend:GBGlassRibbons.flowBend,twist:GBGlassRibbons.flowTwist,frames:GBGlassRibbons.frames,
  paint:GBGlassRibbons.paintMs,quality:GBGlassRibbons.quality}));
 assert(right.frames>left.frames&&left.frames>before.frames,'ribbon loop stopped');
 assert(left.bend!==right.bend||left.twist!==right.twist,'spring response inert');
 assert(right.paint[0]<25,'paint too expensive in sandbox '+right.paint[0]);
 assert([0,1,2].includes(right.quality),'invalid adaptive quality');
 assert(!errors.length,'page errors '+errors);
 console.log(JSON.stringify({viewport:width+'x'+height,first,reactivity:{before,left,right},errors}));
 await ctx.close();
}
await browser.close();