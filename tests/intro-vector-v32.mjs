// V32 → V45: the mark is drawn by real geometry, not a picture of it — instanced strands grown from the official
// SVG (live forced on this software GPU), the poster a real-fur RGBA render; the input never restarts it.
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
 await page.goto('http://127.0.0.1:8080/?gbPuffLive=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:30000});
 const state=await page.evaluate(()=>({original:GBGlassRibbons.logoAsset,poster:GBGlassRibbons.posterAsset,
  screen:document.getElementById('gbRibbonBoot').getBoundingClientRect().toJSON(),
  pointer:getComputedStyle(document.getElementById('gbRibbonBoot')).pointerEvents}));
 assert(/gb-puff-poster-v4\d\.webp$/.test(state.poster||''),'poster is not the real-fur render');
 const img=await page.evaluate(async src=>{const i=new Image();i.src=src;await i.decode();const c=document.createElement('canvas');c.width=i.naturalWidth;c.height=i.naturalHeight;const x=c.getContext('2d');x.drawImage(i,0,0);
  const d=x.getImageData(0,0,c.width,c.height).data;let clear=0;for(let k=3;k<d.length;k+=4)if(d[k]<10)clear++;return{w:i.naturalWidth,h:i.naturalHeight,alpha:clear/(d.length/4)}},state.poster);
 assert(img.w>=500&&img.h>=500&&img.alpha>.05&&img.alpha<.5,'poster must be an RGBA cut-out of the fur render '+JSON.stringify(img));
 const live=await page.waitForFunction(()=>GBGlassRibbons.live||GBGlassRibbons.removed,null,{timeout:23000}).then(()=>page.evaluate(()=>GBGlassRibbons.live));
 if(live)assert(live.count>=1000&&live.requested>=live.count&&live.frames>0,'strands not instanced '+JSON.stringify(live));
 await page.screenshot({path:shot('v32-'+w+'-puff.jpg'),type:'jpeg',quality:62});
 await page.waitForFunction(()=>GBGlassRibbons.settled&&GBGlassRibbons.removed,null,{timeout:23000});
 const hero=await page.evaluate(()=>({frames:GBGlassRibbons.frames,overflow:document.documentElement.scrollWidth-innerWidth,hero:!!document.getElementById('heroStage'),fit:!!document.getElementById('lookstudio')}));
 assert(hero.hero&&hero.fit&&hero.overflow<=2&&errors.length===0,'regression '+JSON.stringify({hero,errors}));
 if(w<600)await page.touchscreen.tap(100,290);else await page.mouse.move(690,340,{steps:6});
 await page.waitForTimeout(350);
 const after=await page.evaluate(()=>({frames:GBGlassRibbons.frames,active:GBGlassRibbons.active}));
 assert(after.frames===hero.frames&&!after.active,'retired intro restarted on input');
 console.log(JSON.stringify({w,h,slow,state,img,live,hero,after,errors}));
 await context.close();
}
await browser.close();
