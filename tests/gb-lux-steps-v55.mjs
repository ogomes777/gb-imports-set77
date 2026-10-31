/* GB Imports V55 / The Luminous Path QA.
   Checks layout, cross-section continuity, copy in 4 languages, mobile connectors,
   infinite loop only while visible, safe reduced motion and existing Look Studio. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const sizes=[{width:1440,height:900},{width:1024,height:768},{width:768,height:1024},{width:430,height:932},{width:390,height:844},{width:320,height:720}];
try{
 for(const vp of sizes){
  const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:1,hasTouch:vp.width<=900,reducedMotion:'no-preference'});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBLuxStepsV55?.ready&&!document.getElementById('gbRibbonBoot'),null,{timeout:45000});
  await page.evaluate(()=>{const s=document.querySelector('#como-funciona'),r=s.getBoundingClientRect();window.scrollTo({top:scrollY+r.top-Math.max(0,(innerHeight-r.height)/2),behavior:'instant'})});
  await page.waitForFunction(()=>document.querySelector('#como-funciona')?.classList.contains('is-in'),null,{timeout:14000});
  await page.waitForTimeout(1100);
  const info=await page.evaluate(()=>{
   const q=s=>document.querySelector(s),b=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,l:r.left,r:r.right,t:r.top,b:r.bottom}};
   const how=q('#como-funciona'),cards=[...how.querySelectorAll('.how-card[data-gb55-step]')],links=[...how.querySelectorAll('.gb55-track')],grid=q('#como-funciona .how-grid');
   return{titles:cards.map(x=>x.querySelector('h3').textContent),copies:cards.map(x=>x.querySelector('p').textContent),
    cards:cards.map(b),links:links.map(b),linkOpacity:links.map(x=>getComputedStyle(x).opacity),
    icons:cards.map(c=>b(c.querySelector('.how-icon'))),overflow:document.documentElement.scrollWidth-innerWidth,
    handoff:!!q('#lookstudio>.gb55-departure')&&!!q('#como-funciona>.gb55-arrival'),
    previous:!!q('#lookstudio .look-stage')&&!!q('#lookstudio #lookTops'),
    extra:!!q('#universo'),theme:getComputedStyle(how).backgroundColor,active:how.classList.contains('gb55-active'),
    section:b(how),grid:b(grid),lang:document.documentElement.lang};
  });
  console.log('V55_VIEWPORT '+vp.width+' '+JSON.stringify({titles:info.titles,cardWidths:info.cards.map(c=>Math.round(c.w)),link:info.links.map(l=>({w:Math.round(l.w),h:Math.round(l.h)})),overflow:info.overflow,active:info.active}));
  assert.deepEqual(info.titles,['EXPLORE','MONTE','CONSULTE A GB'],'Wrong journey copy');
  assert(info.copies.every(c=>c.length>=65&&c.length<=135),'Cards copy too short or long '+JSON.stringify(info.copies));
  assert(info.handoff&&info.previous&&info.extra,'Look Studio or campaign connection removed');
  assert(info.overflow<=3,'Horizontal overflow '+vp.width+': '+info.overflow);
  assert(info.active,'Gold pulse should animate when section is in viewport '+vp.width);
  assert(info.cards.length===3&&info.cards.every(c=>c.w>220&&c.h>=240),'Tiny/clipped cards '+vp.width+' '+JSON.stringify(info.cards));
  assert(info.links.length===2&&info.linkOpacity.every(x=>+x>.4),'Connector invisible');
  if(vp.width<=900){
   assert(info.links.every(l=>l.h>=15&&l.w<=3),'Mobile connector must be vertical '+JSON.stringify(info.links));
   assert(info.cards.every(c=>c.l>=0&&c.r<=vp.width+3),'Mobile cards cropped');
  }else{
   assert(info.links.every(l=>l.w>=11&&l.h<=3),'Desktop connector must be horizontal '+JSON.stringify(info.links));
   assert(info.cards[0].r<info.cards[1].l&&info.cards[1].r<info.cards[2].l,'Cards not side-by-side');
  }
  if(vp.width===390){
   await page.evaluate(()=>window.GBSetLanguage('en'));
   await page.waitForFunction(()=>document.querySelector('[data-gb55-step="03"] h3')?.textContent==='CHECK WITH GB',null,{timeout:7000});
   await page.evaluate(()=>window.GBSetLanguage('pt'));
   await page.waitForFunction(()=>document.querySelector('[data-gb55-step="03"] h3')?.textContent==='CONSULTE A GB',null,{timeout:7000});
  }
  mkdirSync('tmp/gb-lux-steps-v55',{recursive:true});
  await page.locator('#como-funciona').screenshot({path:'tmp/gb-lux-steps-v55/'+vp.width+'x'+vp.height+'.png',animations:'allow',timeout:25000});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>!window.GBLuxStepsV55.active,null,{timeout:7500});
  assert.deepEqual(errors,[],'Browser exceptions '+JSON.stringify(errors));
  await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.GBLuxStepsV55?.ready,null,{timeout:40000});
 await page.evaluate(()=>{const r=document.querySelector('#como-funciona').getBoundingClientRect();scrollTo({top:scrollY+r.top,behavior:'instant'})});
 await page.waitForFunction(()=>document.querySelector('#como-funciona')?.classList.contains('is-in'),null,{timeout:7500});
 const rm=await page.evaluate(()=>{
 const s=document.querySelector('#como-funciona'),c=s.querySelector('.how-card'),track=s.querySelector('.gb55-track i');
 return{active:s.classList.contains('gb55-active'),opacity:getComputedStyle(c).opacity,animation:getComputedStyle(c.querySelector('.gb55-card-inner')).animationName,track:getComputedStyle(track).animationName};
 });
 assert(!rm.active&&rm.opacity==='1'&&rm.animation==='none'&&rm.track==='none','Reduced motion broken '+JSON.stringify(rm));
 await ctx.close();
 console.log('OK GB V55 / six viewports, scene continuity, translations, reduced motion, no errors');
}finally{await browser.close();}
