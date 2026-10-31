/* GB Imports V51 | mobile composition QA.
   Browser-based layout measurements: readable editorial, large figures, unobstructed hand,
   no title overflow, footer collision, scroll overflow, motion or replay regression. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const origin=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const devices=[
 {width:320,height:700},
 {width:360,height:740},
 {width:390,height:844},
 {width:430,height:932},
 {width:768,height:1024},
 {width:1440,height:900}
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const vp of devices){
   const context=await browser.newContext({viewport:vp,deviceScaleFactor:1,isMobile:vp.width<800,hasTouch:vp.width<800,reducedMotion:'no-preference'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:35000});
   await page.waitForFunction(()=>Boolean(window.GB_CORE_READY)&&!document.getElementById('gbRibbonBoot'),null,{timeout:32000});
   await page.evaluate(()=>{
     const rect=document.querySelector('#editorial .editorial-model').getBoundingClientRect();
     window.scrollTo({top:window.scrollY+rect.top-Math.max(0,(innerHeight-rect.height)/2),behavior:'instant'});
   });
   await page.waitForTimeout(4500);
   const debug=await page.evaluate(()=>{
     const model=document.querySelector('#editorial .editorial-model');
     const stage=document.querySelector('#editorial .gbe');
     const wall=document.querySelector('#editorial>.gb-chap');
     const r=model?.getBoundingClientRect();
     return {core:window.GB_CORE_READY,ready:model?.className,stage:stage?.className,stageCount:!!stage,imgs:stage&&[...stage.querySelectorAll('img')].slice(0,4).map(i=>({ok:i.complete,w:i.naturalWidth})),wall:wall?.className,model:r&&{y:r.y,h:r.height},scrollY,viewport:innerHeight,bodyHeight:document.body.scrollHeight};
   });
   console.log('GB_V51_DEBUG '+vp.width+' '+JSON.stringify(debug));
   await page.waitForFunction(()=>document.querySelector('.editorial-model')?.classList.contains('gbe-done'),null,{timeout:16000});
   const m=await page.evaluate(()=>{
     const get=s=>document.querySelector(s),rr=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,l:r.left,r:r.right,t:r.top,b:r.bottom,w:r.width,h:r.height}};
     const section=get('#editorial'),model=get('#editorial .editorial-model'),stage=get('#editorial .gbe'),cam=get('#editorial .gbe-cam');
     const copy=get('#editorial .editorial-copy'),title=get('#editorial .editorial-copy h2'),p=get('#editorial .editorial-copy p'),cta=get('#editorial .editorial-link');
     const g=get('.gbe-char.is-gui'),v=get('.gbe-char.is-vitin'),tag=get('.gbe-tag'),foot=get('.editorial-bottom');
     return{
       viewport:{w:innerWidth,h:innerHeight},section:rr(section),model:rr(model),stage:rr(stage),cam:rr(cam),copy:rr(copy),title:rr(title),p:rr(p),cta:rr(cta),
       gui:rr(g),vitin:rr(v),tag:rr(tag),footer:rr(foot),
       titleScroll:title.scrollWidth,titleClient:title.clientWidth,
       horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
       modelPosition:getComputedStyle(model).position,
       sectionDisplay:getComputedStyle(section).display,
       images:[...stage.querySelectorAll('.gbe-body img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0})),
       pivotHand:get('.gbe-hand').style.transformOrigin,pivotHead:get('.gbe-head').style.transformOrigin,
       vfx:!!get('.gb50-shock')&&!!get('.gb50-flare')
     };
   });
   console.log('GB_V51_METRICS '+vp.width+' '+JSON.stringify({
     titleWidth:m.titleScroll,contentWidth:m.titleClient,modelTop:Math.round(m.model.t),
     ctaBottom:Math.round(m.cta.b),charHeight:Math.round(m.gui.h),camWidth:Math.round(m.cam.w),
     camRatio:Number((m.cam.w/vp.width).toFixed(2)),footerTop:Math.round(m.footer.t),
     tagBottom:Math.round(m.tag.b),overflow:m.horizontalOverflow
   }));
   assert(m.images.length===4&&m.images.every(i=>i.loaded),'Missing illustrated PNG/WebP layers '+JSON.stringify(m.images));
   assert(m.pivotHand&&m.pivotHead&&m.vfx,'Rig hand/head or impact V50 missing');
   assert(m.horizontalOverflow<=2,'Document horizontal overflow '+JSON.stringify(m));
   if(vp.width<=780){
     assert(m.modelPosition==='relative'&&m.sectionDisplay==='flex','Mobile needs its own stacked stage');
     assert(m.model.t>=m.cta.b+8,'Figures overlap copy/CTA');
     assert(m.titleScroll<=m.titleClient+5,'Editorial title clipped at '+vp.width);
     assert(m.cam.l>=m.section.l+5&&m.cam.r<=m.section.r-5,'Figures extend outside mobile viewport');
     assert(m.gui.h>=Math.min(380,vp.width*.95),'Gui too small '+JSON.stringify(m.gui));
     assert(m.vitin.h>=m.gui.h*.89,'Vitin disproportionate');
     if(vp.width<=430)assert(m.cam.w>=vp.width*.72,'Character duo too narrow');
     assert(m.tag.b<=m.footer.t-6,'Character label collides with footer');
   }else{
     assert(m.sectionDisplay==='grid','Desktop must retain original grid');
     assert(m.gui.h>250,'Desktop characters missing');
   }
   mkdirSync('tmp/gb-editorial-mobile-v51',{recursive:true});
   await page.screenshot({path:'tmp/gb-editorial-mobile-v51/'+vp.width+'x'+vp.height+'.png',fullPage:false});
   await page.locator('.gbe-replay').click();
   const gesture=await page.evaluate(()=>{
     const k=s=>document.querySelector(s).getAnimations().flatMap(a=>a.effect?.getKeyframes?.()||[]).map(f=>f.transform||'');
     return{playing:document.querySelector('.gbe').classList.contains('is-playing'),
       hand:k('.gbe-hand').some(t=>/rotate\((2\d|3\d)/.test(t)),
       head:k('.gbe-head').some(t=>/rotate\([4-6]/.test(t)),
       flash:k('.gb50-flare').some(t=>t.includes('scaleX(1.16)'))};
   });
   assert(gesture.playing&&gesture.hand&&gesture.head&&gesture.flash,'Original gesture or V50 impact broke '+JSON.stringify(gesture));
   await page.waitForFunction(()=>document.querySelector('.editorial-model')?.classList.contains('gbe-done'),null,{timeout:16000});
   assert.deepEqual(errors,[],'Browser exception');
   await context.close();
 }
 // Reduced-motion: cinematic effects disabled while the illustrated final frame remains.
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:35000});
 await page.waitForFunction(()=>Boolean(window.GB_CORE_READY),null,{timeout:32000});
 await page.locator('#editorial').scrollIntoViewIfNeeded();
 await page.waitForFunction(()=>document.querySelector('.editorial-model')?.classList.contains('gbe-done'),null,{timeout:16000});
 assert.equal(await page.locator('.gb50-strike').evaluate(e=>getComputedStyle(e).display),'none');
 await ctx.close();
 console.log('OK editorial mobile V51 / all layouts, full figures, rig, replay and reduced motion');
}finally{await browser.close();}
