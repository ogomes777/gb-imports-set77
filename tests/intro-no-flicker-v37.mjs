import {chromium} from 'playwright';import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const [w,h,slow] of [[1440,900,false],[390,844,false],[360,780,true]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:w<600});
 const page=await ctx.newPage(),errors=[],badImages=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.url().includes('gb-glass-pearl')&&!r.ok())badImages.push(r.status())});
 if(slow){const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:3})}
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBGlassRibbons?.frames>1,null,{timeout:20000});
 const frames=[];
 for(const name of ['start','sign','finish']){
  await page.waitForTimeout(name==='start'?170:name==='sign'?780:720);
  frames.push(await page.evaluate(()=>{
   const glass=document.querySelector('.gb-ribbon-glass'),logo=document.querySelector('.gb-ribbon-original'),
         ink=document.querySelector('.gb-ribbon-ink-outline'),specular=document.querySelector('.gb-ribbon-glass-specular');
   return {clip:getComputedStyle(logo).clipPath,ink:GBGlassRibbons.signatureProgress,
    bg:getComputedStyle(glass).backgroundImage,filter:getComputedStyle(logo).filter,
    inkFilter:ink?getComputedStyle(ink).filter:'missing',specularAnimation:getComputedStyle(specular).animationName,
    frames:GBGlassRibbons.frames};
  }));
 }
 assert(frames[1].bg.includes('gb-glass-pearl-v37.webp'),'glass image missing');
 const resource=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('gb-glass-pearl-v37.webp')).map(e=>({url:e.name,duration:e.duration,bytes:e.transferSize})));
 assert(resource.length===1&&!badImages.length,'glass asset not downloaded '+JSON.stringify({resource,badImages}));
 assert(frames.every(x=>x.filter==='none'&&x.inkFilter==='none'&&x.specularAnimation==='none'),
   'expensive animated image filter / specular still active '+JSON.stringify(frames));
 assert(frames[0].clip.startsWith('inset('),'first frame mask not stable');
 assert(frames[0].ink<=frames[1].ink&&frames[1].ink<=frames[2].ink,'logo reveals backwards');
 await page.waitForFunction(()=>GBGlassRibbons.parked===true,null,{timeout:11000});
 const parked=await page.evaluate(()=>{
  const outline=document.querySelector('.gb-ribbon-ink'),signature=document.querySelector('.gb-ribbon-signature');
  return {active:GBGlassRibbons.active,ink:GBGlassRibbons.signatureProgress,
   outlineDisplay:getComputedStyle(outline).display,signatureOpacity:Number(getComputedStyle(signature).opacity),
   mask:getComputedStyle(document.querySelector('.gb-ribbon-original')).clipPath};
 });
 assert(!parked.active&&parked.ink>.99&&parked.outlineDisplay==='block'&&parked.mask==='none',
  'park causes blink '+JSON.stringify(parked));
 await page.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.removed,null,{timeout:21000});
 const hero=await page.evaluate(()=>({removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,
  canvas:GBGlassRibbons.canvasSize,fit:typeof GBFitting,overflow:document.documentElement.scrollWidth-innerWidth}));
 assert(hero.removed&&!hero.active&&hero.canvas[0]===0&&hero.fit==='object'&&hero.overflow<=2&&!errors.length,'hero broken '+JSON.stringify({hero,errors}));
 console.log(JSON.stringify({viewport:w+'x'+h,slow,frames:frames.map(x=>({clip:x.clip,ink:x.ink,frame:x.frames})),resource,parked,hero,errors}));
 await ctx.close();
}
await browser.close();