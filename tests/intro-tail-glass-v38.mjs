import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const configs=[
 {name:'edge-desktop-light',w:1440,h:900,scheme:'light',forced:'none',webp:true,slow:2},
 {name:'edge-desktop-dark',w:1440,h:900,scheme:'dark',forced:'none',webp:true,slow:2},
 {name:'edge-mobile-dark',w:390,h:844,scheme:'dark',forced:'none',webp:true,slow:3},
 {name:'forced-colors',w:390,h:844,scheme:'dark',forced:'active',webp:true,slow:1},
 {name:'no-webp-network',w:390,h:844,scheme:'dark',forced:'none',webp:false,slow:1},
];
for(const cfg of configs){
 const ctx=await browser.newContext({viewport:{width:cfg.w,height:cfg.h},colorScheme:cfg.scheme,forcedColors:cfg.forced,deviceScaleFactor:1,hasTouch:cfg.w<600});
 const p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 if(!cfg.webp)await p.route('**/gb-glass-pearl-v37.webp',route=>route.abort());
 const cpu=await ctx.newCDPSession(p);await cpu.send('Emulation.setCPUThrottlingRate',{rate:cfg.slow});
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.GBGlassRibbons?.frames>=2,null,{timeout:20000});
 await p.waitForTimeout(1450);
 const mid=await p.evaluate(()=>{
  const host=document.getElementById('gbRibbonBoot'),glass=host.querySelector('.gb-ribbon-glass');
  const g=getComputedStyle(glass),cs=getComputedStyle(host);
  return {bg:g.backgroundColor,image:g.backgroundImage,hostbg:cs.backgroundColor,can:GBGlassRibbons.canvasSize,quality:GBGlassRibbons.quality,progress:GBGlassRibbons.sweep,frames:GBGlassRibbons.frames,animation:GBGlassRibbons.opening};
 });
 // CI must never assume a Vercel sandbox filesystem path.
 // Visual capture is not needed for this layout/animation regression.
 assert(mid.image.includes('gb-glass-pearl-v37.webp'),'The optical glass asset was lost '+JSON.stringify(mid));
 assert(['rgb(247, 247, 243)','rgb(248, 247, 243)'].includes(mid.bg)&&['rgb(246, 245, 241)','rgb(248, 247, 243)'].includes(mid.hostbg),'Dark theme/failure did not get a light fallback '+JSON.stringify(mid));
 await p.waitForFunction(()=>GBGlassRibbons.parked===true,null,{timeout:18000});
 const tail=await p.evaluate(()=>({can:GBGlassRibbons.canvasSize,quality:GBGlassRibbons.quality,frames:GBGlassRibbons.frames,sweep:GBGlassRibbons.sweep,ink:GBGlassRibbons.signatureProgress}));
 assert(mid.can[0]===tail.can[0]&&mid.can[1]===tail.can[1],'Backing store changed while ribbon was completing '+JSON.stringify({mid,tail}));
 assert(tail.ink>.99,'Logo not complete');
 await p.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.removed,null,{timeout:25000});
 const end=await p.evaluate(()=>({removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,fit:typeof window.GBFitting,overflow:document.documentElement.scrollWidth-innerWidth}));
 assert(end.removed&&!end.active&&end.fit==='object'&&end.overflow<=2&&errors.length===0,'Landing regressions '+JSON.stringify({end,errors}));
 console.log(JSON.stringify({mode:cfg.name,mid:{bg:mid.bg,hostbg:mid.hostbg,can:mid.can,quality:mid.quality,sweep:mid.progress},tail,end,errors}));
 await ctx.close();
}
await browser.close();