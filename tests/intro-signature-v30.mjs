// V30 → V45: the GB mark arrives as fur — the official monogram is the artwork of the puff, never redrawn and never
// shown flat — while the landing stays hidden behind the stage until the dive.
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
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:20000});
 const samples=[];
 for(const [label,wait] of [['arrive',200],['hold',900],['late',700]]){
  await page.waitForTimeout(wait);
  const s=await page.evaluate(()=>{const host=document.getElementById('gbRibbonBoot');return host?{
   opening:GBGlassRibbons.opening,state:GBGlassRibbons.state,
   camera:+getComputedStyle(host.querySelector('.gb-puff-camera')).opacity,
   poster:host.querySelector('.gb-puff-poster')?.naturalWidth||0,
   original:GBGlassRibbons.logoAsset,
   flat:[...host.querySelectorAll('img')].filter(i=>/\.svg/.test(i.getAttribute('src')||'')).length,
   contentBlock:document.elementFromPoint(innerWidth/2,innerHeight/2)?.closest('#gbRibbonBoot')!==null}:{gone:true}});
  await page.screenshot({path:shot('v30-'+w+'-'+label+'.jpg'),type:'jpeg',quality:60});
  samples.push({label,...s});
 }
 const shown=samples.filter(s=>!s.gone&&s.opening);
 assert(shown.length>=2,'puff held too briefly '+JSON.stringify(samples));
 assert(shown.every(s=>s.camera>.5&&(s.poster>0||s.state==='visible-live')&&s.flat===0),'mark not shown as fur '+JSON.stringify(samples));
 assert(shown[0].original.endsWith('gb-monograma-amarelo-preto.svg'),'original GB logo altered');
 assert(shown.every(s=>s.contentBlock),'landing visible before the dive '+JSON.stringify(samples));
 if(w<600)await page.touchscreen.tap(155,360);else await page.mouse.move(760,270,{steps:8});
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:17000});
 const final=await page.evaluate(()=>({frames:GBGlassRibbons.frames,overflow:document.documentElement.scrollWidth-innerWidth}));
 assert(final.overflow<3&&errors.length===0,'errors/overflow '+JSON.stringify({final,errors}));
 console.log(JSON.stringify({viewport:w,sequence:samples,final,errors}));
 await ctx.close();
}
await b.close();
