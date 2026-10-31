// V37 → V45: no flicker. Every sampled frame of the stage is black (no white flash), the poster is downloaded once
// and, once visible, stays visible until the live tile takes over or the camera dives; no filter keeps animating.
import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [w,h,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:w<600});
 const page=await ctx.newPage(),errors=[],badImages=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('gb-puff-poster')&&!r.ok())badImages.push(r.status())});
 if(slow){const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:3})}
 await page.addInitScript(()=>{window.__s=[];const f=()=>{const h=document.getElementById('gbRibbonBoot');if(h&&h.isConnected){const p=h.querySelector('.gb-puff-poster'),cam=h.querySelector('.gb-puff-camera');
  window.__s.push({bg:getComputedStyle(h).backgroundColor,state:h.dataset.state||'',cam:+getComputedStyle(cam).opacity,poster:p&&p.naturalWidth?+getComputedStyle(p).opacity:-1,filter:getComputedStyle(cam).filter,anim:cam.getAnimations().length})}
  if(window.__s.length<900)requestAnimationFrame(f)};requestAnimationFrame(f)});
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.visible,null,{timeout:20000});
 await page.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.removed,null,{timeout:21000});
 const s=await page.evaluate(()=>window.__s);
 const resource=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('gb-puff-poster')).map(e=>({url:e.name.split('/').pop(),duration:Math.round(e.duration)})));
 assert(resource.length===1&&!badImages.length,'poster not downloaded exactly once '+JSON.stringify({resource,badImages}));
 const holding=s.filter(x=>/visible-poster/.test(x.state));
 assert(s.every(x=>/^rgba?\(0, 0, 0/.test(x.bg)),'a non-black frame flashed on the stage');
 // once shown, the poster does not blink back to transparent before the live tile or the dive
 const shownAt=holding.findIndex(x=>x.poster>.99&&x.cam>.99);
 assert(shownAt>=0&&holding.slice(shownAt).every(x=>x.poster>.99&&x.cam>.99),'poster flickered while holding '+JSON.stringify(holding.slice(0,6)));
 assert(holding.slice(-3).every(x=>x.filter==='none'),'blur/filter still applied after the entrance');
 const hero=await page.evaluate(()=>({removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,canvas:GBGlassRibbons.canvasSize,fit:typeof GBFitting,overflow:document.documentElement.scrollWidth-innerWidth}));
 assert(hero.removed&&!hero.active&&hero.canvas[0]===0&&hero.fit==='object'&&hero.overflow<=2&&!errors.length,'hero broken '+JSON.stringify({hero,errors}));
 console.log(JSON.stringify({viewport:w+'x'+h,slow,samples:s.length,holding:holding.length,resource,hero,errors}));
 await ctx.close();
}
await browser.close();
