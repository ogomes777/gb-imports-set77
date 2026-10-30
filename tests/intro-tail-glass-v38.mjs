// V38 → V45: the stage is black glass in every theme and colour scheme (light theme included), with forced colours,
// a slow CPU and a blocked poster; the store always opens and nothing is left painting.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const configs=[
 {name:'desktop-light',w:1440,h:900,scheme:'light',forced:'none',poster:true,slow:2},
 {name:'desktop-dark',w:1440,h:900,scheme:'dark',forced:'none',poster:true,slow:2},
 {name:'mobile-dark',w:390,h:844,scheme:'dark',forced:'none',poster:true,slow:3},
 {name:'forced-colors',w:390,h:844,scheme:'dark',forced:'active',poster:true,slow:1},
 {name:'no-poster-network',w:390,h:844,scheme:'dark',forced:'none',poster:false,slow:1},
];
for(const cfg of configs){
 const ctx=await browser.newContext({viewport:{width:cfg.w,height:cfg.h},colorScheme:cfg.scheme,forcedColors:cfg.forced,deviceScaleFactor:1,hasTouch:cfg.w<600});
 const p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 if(!cfg.poster)await p.route('**/gb-puff-poster-*.webp',route=>route.abort());
 const cpu=await ctx.newCDPSession(p);await cpu.send('Emulation.setCPUThrottlingRate',{rate:cfg.slow});
 await p.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded'});
 await p.waitForFunction(()=>window.GBGlassRibbons,null,{timeout:20000});
 const mid=await p.evaluate(()=>{const host=document.getElementById('gbRibbonBoot');return host?{hostbg:getComputedStyle(host).backgroundColor,mode:GBGlassRibbons.mode,opening:GBGlassRibbons.opening}:{gone:true}});
 assert(mid.gone||mid.hostbg==='rgb(0, 0, 0)','stage is not black glass in this theme '+JSON.stringify(mid));
 await p.waitForFunction(()=>GB_CORE_READY&&GBGlassRibbons.removed,null,{timeout:25000});
 const end=await p.evaluate(()=>({removed:GBGlassRibbons.removed,active:GBGlassRibbons.active,mode:GBGlassRibbons.mode,fit:typeof window.GBFitting,overflow:document.documentElement.scrollWidth-innerWidth,
  playing:document.documentElement.classList.contains('gb-ribbon-intro-playing')}));
 assert(end.removed&&!end.active&&!end.playing&&end.fit==='object'&&end.overflow<=2&&errors.length===0,'Landing regressions '+JSON.stringify({end,errors}));
 if(!cfg.poster)assert(end.mode!=='poster','a blocked poster cannot be reported as shown');
 console.log(JSON.stringify({mode:cfg.name,mid,end,errors}));
 await ctx.close();
}
await browser.close();
