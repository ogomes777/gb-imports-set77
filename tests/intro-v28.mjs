// V28 → V45: the stage covers the document from the first paint even while every JS chunk is delayed; no white,
// no flat logo, then the puff, then a handoff that releases the page. Reduced motion never shows the stage.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const shot=name=>join(tmpdir(),name);
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height] of [[1440,900],[390,844]]){
 const ctx=await b.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<600,isMobile:width<600});
 let delayed=false;
 await ctx.route('**/_gb/*.js',async route=>{if(!delayed){delayed=true;await new Promise(r=>setTimeout(r,1400))}await route.continue()});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pending=page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:30000});
 await page.waitForSelector('#gbRibbonBoot',{state:'attached',timeout:12000});
 const pre=await page.evaluate(()=>{
  const host=document.getElementById('gbRibbonBoot');
  const c=getComputedStyle(host),r=host.getBoundingClientRect();
  const target=document.elementFromPoint(innerWidth*.5,innerHeight*.5);
  const cam=host.querySelector('.gb-puff-camera');
  return{boot:host.classList.contains('is-boot'),width:r.width,height:r.height,position:c.position,bg:c.backgroundColor,
   cover:target===host||host.contains(target),brandShown:cam?+getComputedStyle(cam).opacity:0};
 });
 await page.screenshot({path:shot('v28-'+width+'-FIRST-PAINT.jpg'),type:'jpeg',quality:70});
 assert(pre.boot&&pre.cover&&pre.position==='fixed'&&pre.width>=width-1&&pre.height>=height-1,'landing flashed during JS load '+JSON.stringify(pre));
 assert(pre.bg==='rgb(0, 0, 0)'&&pre.brandShown===0,'first paint must be plain black glass (no logo, no tile) '+JSON.stringify(pre));
 await pending;
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:18000});
 const begin=await page.evaluate(()=>({opening:GBGlassRibbons.opening,asset:GBGlassRibbons.logoAsset,glass:GBGlassRibbons.fullGlass,body:document.querySelector('#gbRibbonBoot').parentElement.tagName}));
 assert(begin.opening&&begin.glass&&begin.asset.includes('gb-monograma-amarelo-preto.svg')&&begin.body==='BODY','intro missing '+JSON.stringify(begin));
 await page.screenshot({path:shot('v28-'+width+'-PUFF.jpg'),type:'jpeg',quality:68});
 if(width<600)await page.touchscreen.tap(210,330);else await page.mouse.move(800,300,{steps:5});
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:14000});
 const after=await page.evaluate(()=>({settled:GBGlassRibbons.settled,removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,frame:GBGlassRibbons.frames,hero:!!document.getElementById('heroArt'),fit:!!document.getElementById('lookstudio'),overflow:document.documentElement.scrollWidth-innerWidth,cover:!!document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest('#gbRibbonBoot')}));
 await page.waitForTimeout(550);
 const later=await page.evaluate(()=>GBGlassRibbons.frames);
 assert(after.settled&&after.removed&&!after.active&&!after.cover&&after.hero&&after.fit&&after.overflow<=2,'landing handoff failed '+JSON.stringify(after));
 assert(later===after.frame,'retired intro kept painting');
 assert(!errors.length,'JS errors: '+errors.join(';'));
 await page.screenshot({path:shot('v28-'+width+'-HERO.jpg'),type:'jpeg',quality:70});
 console.log(JSON.stringify({viewport:width+'x'+height,firstPaint:pre,begin,after,framesAfter:later,errors}));
 await ctx.close();
}
const r=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const reducedPage=await r.newPage();
await reducedPage.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
await reducedPage.waitForFunction(()=>window.GBGlassRibbons,null,{timeout:20000});
const red=await reducedPage.evaluate(()=>({opening:GBGlassRibbons.opening,frames:GBGlassRibbons.frames,removed:GBGlassRibbons.removed,host:!!document.getElementById('gbRibbonBoot')}));
assert(!red.opening&&red.frames===0&&red.removed&&!red.host,'reduced motion broken '+JSON.stringify(red));
console.log('REDUCED',red);
await r.close();await b.close();
