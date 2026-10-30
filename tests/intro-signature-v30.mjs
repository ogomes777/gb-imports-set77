import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const shot=name=>join(tmpdir(),name);
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [w,h] of [[1440,900],[390,844]]){
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<600,deviceScaleFactor:1});
 const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>0,null,{timeout:20000});
 const samples=[];
 for(const [label,wait] of [['begin',500],['flow',1100],['signature',1000],['complete',1300]]){
  await page.waitForTimeout(wait);
  const s=await page.evaluate(()=>({
   sweep:GBGlassRibbons.sweep,
   sig:GBGlassRibbons.signatureProgress,
   frames:GBGlassRibbons.frames,
   opening:GBGlassRibbons.opening,
   clip:getComputedStyle(document.querySelector('.gb-ribbon-original')).clipPath,
   scanLeft:getComputedStyle(document.querySelector('.gb-ribbon-scan')).left,
   glass:getComputedStyle(document.querySelector('.gb-ribbon-glass')).backgroundImage.slice(0,110),
   original:GBGlassRibbons.logoAsset,
   contentBlock:document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest('#gbRibbonBoot')!==null
  }));
  await page.screenshot({path:shot('v30-'+w+'-'+label+'.jpg'),type:'jpeg',quality:60});
  samples.push({label,...s});
 }
 assert(samples[0].sweep>samples[1].sweep&&samples[1].sweep>=samples[2].sweep,
  'beam not advancing right-to-left: '+JSON.stringify(samples));
 assert(samples[0].sig<=samples[1].sig&&samples[1].sig<=samples[2].sig,
  'logo not following beam: '+JSON.stringify(samples));
 assert(samples[2].sig>.80,'logo not sufficiently signed '+JSON.stringify(samples));
 assert(samples[0].original.endsWith('gb-monograma-amarelo-preto.svg'),'original GB logo altered');
 assert(samples[0].contentBlock,'landing visible before intro');
 if(w<600)await page.touchscreen.tap(155,360);else await page.mouse.move(760,270,{steps:8});
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:17000});
 const final=await page.evaluate(()=>({frames:GBGlassRibbons.frames,quality:GBGlassRibbons.quality,pointer:GBGlassRibbons.pointer,overflow:document.documentElement.scrollWidth-innerWidth}));
 assert(final.overflow<3&&errors.length===0,'errors/overflow');
 console.log(JSON.stringify({viewport:w,sequence:samples.map(x=>({label:x.label,sweep:x.sweep,sig:x.sig,scanLeft:x.scanLeft,opening:x.opening})),final,errors}));
 await ctx.close();
}
await b.close();