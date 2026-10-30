import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const shot=name=>join(tmpdir(),name);
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [width,height,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<600});
 const page=await ctx.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 if(slow){const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:3});}
 const start=Date.now();
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>=2,null,{timeout:17000});
 const first=await page.evaluate(()=>({
   opening:GBGlassRibbons.opening,
   host:document.querySelector('#gbRibbonBoot')?.parentElement?.tagName,
   originalLogo:GBGlassRibbons.logoAsset,
   active:GBGlassRibbons.active
 }));
 assert(first.opening&&first.host==='BODY','first paint intro lost '+JSON.stringify(first));
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GB_CORE_READY&&GBGlassRibbons.removed,null,{timeout:25000});
 const end=await page.evaluate(()=>({
  removed:GBGlassRibbons.removed,
  active:GBGlassRibbons.active,
  frames:GBGlassRibbons.frames,
  canvas:GBGlassRibbons.canvasSize,
  child:!!document.getElementById('heroStage')?.querySelector('#gbRibbonBoot'),
  hostInDoc:!!document.querySelector('#gbRibbonBoot'),
  fit:typeof window.GBFitting,
  overflow:document.documentElement.scrollWidth-innerWidth
 }));
 await page.screenshot({path:shot('v34-'+width+'-hero.jpg'),type:'jpeg',quality:70});
 assert(end.removed&&!end.active&&end.canvas[0]===0&&end.canvas[1]===0&&!end.child&&!end.hostInDoc,'ribbon leaked into hero '+JSON.stringify(end));
 assert(end.fit==='object'&&end.overflow<=2&&!errors.length,'store regression '+JSON.stringify({end,errors}));
 await page.waitForTimeout(1200);
 const stop=await page.evaluate(()=>({frames:GBGlassRibbons.frames,active:GBGlassRibbons.active,host:document.querySelector('#gbRibbonBoot')}));
 assert(stop.frames===end.frames&&!stop.active&&!stop.host,'rAF still painting after intro '+JSON.stringify({end,stop}));
 const before=await page.evaluate(()=>GBGlassRibbons.frames);
 await page.mouse.move(width*.7,height*.45);
 await page.waitForTimeout(250);
 assert(await page.evaluate(()=>GBGlassRibbons.frames)===before,'mousemove restarted retired film');
 console.log(JSON.stringify({viewport:width+'x'+height,slow,elapsed:Date.now()-start,first,end,pausedFrames:stop.frames,errors}));
 await ctx.close();
}
for(const [suffix,reduced] of [['?peca=gb-sh-02',false],['',true]]){
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:reduced?'reduce':'no-preference'});
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8080/'+suffix,{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>GB_CORE_READY===true,null,{timeout:20000});
 const result=await p.evaluate(()=>({removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,canvas:GBGlassRibbons.canvasSize,heading:document.querySelector('#productModal h2')?.textContent}));
 assert(result.removed&&!result.active&&result.canvas[0]===0&&errors.length===0,'skip/reduced path '+JSON.stringify({result,errors}));
 if(suffix)assert(result.heading?.includes('MANCHESTER CITY'),'direct product broke');
 console.log('SKIP',JSON.stringify({suffix,reduced,result}));
 await ctx.close();
}
await browser.close();