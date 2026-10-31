/* GB Imports V52 — responsive scene and storefront regression. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
for(const vp of [{width:1440,height:900},{width:768,height:1024},{width:430,height:932},{width:390,height:844},{width:320,height:720}]){
 const ctx=await b.newContext({viewport:vp,hasTouch:vp.width<781,deviceScaleFactor:1,reducedMotion:'no-preference'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:40000});
 await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBTheChoiceV52?.ready&&!document.getElementById('gbRibbonBoot'),null,{timeout:40000});
 const init=await page.evaluate(()=>{
   const sec=document.querySelector('#categorias');
   return {ready:sec.dataset.gb52,scenes:document.querySelectorAll('#categorias .gb52-parts').length,
     products:[...document.querySelectorAll('#categorias .category-object > .garment-svg')].map(n=>({name:n.getAttribute('data-pid'),loaded:n.tagName==='IMG'?n.complete&&n.naturalWidth>0:true})),
     shadow:!!document.querySelector('#categorias .gb52-bridge'),
     headline:document.querySelector('#categorias .category-intro h2')?.textContent,
     first:document.querySelector('.category-tile[data-go-filter="track"]')?.tagName,
     second:document.querySelector('.category-tile[data-go-filter="short"]')?.tagName};
 });
 assert(init.ready==='ready'&&init.scenes===2&&init.shadow&&init.first==='BUTTON'&&init.second==='BUTTON',
   'V52 or original buttons missing '+JSON.stringify(init));
 assert(init.products.length===2&&init.products.every(p=>p.loaded),'Missing original product assets '+JSON.stringify(init));
 for(const category of ['track','short']){
   await page.evaluate(c=>{
     const el=document.querySelector('.category-tile[data-go-filter="'+c+'"]');
     const r=el.getBoundingClientRect();
     window.scrollTo({top:window.scrollY+r.top-Math.max(0,(innerHeight-r.height)/2),behavior:'instant'});
   },category);
   await page.waitForFunction(c=>window.GBTheChoiceV52.states.some(s=>s.category===c&&s.shown),category,{timeout:13000});
   const info=await page.evaluate(c=>{
     const tile=document.querySelector('.category-tile[data-go-filter="'+c+'"]');
     const t=tile.getBoundingClientRect(),orig=tile.querySelector('.category-object > .garment-svg');
     const clones=[...tile.querySelectorAll('.gb52-piece .garment-svg')];
     const heading=tile.querySelector('.category-bottom h3');
     const r=heading.getBoundingClientRect();
     return{w:t.width,h:t.height,width:innerWidth,headingWidth:r.width,headingScroll:heading.scrollWidth,headingText:heading.textContent,
      clones:clones.length,loaded:clones.every(n=>n.tagName==='IMG'?n.complete&&n.naturalWidth>0:true),
      source:orig?.getAttribute('data-pid'),same:clones.every(n=>n.getAttribute('src')===orig?.getAttribute('src')),
      pieceA:!!tile.querySelector('.gb52-piece-a'),pieceB:!!tile.querySelector('.gb52-piece-b'),
      footer:!!tile.querySelector('.category-cta'),horizontal:document.documentElement.scrollWidth-innerWidth,
      stage:tile.querySelector('.category-object').getBoundingClientRect().height,
      effect:!!tile.querySelector('.gb52-impact')};
   },category);
   console.log('GB_V52 '+vp.width+' '+category+' '+JSON.stringify(info));
   assert(info.w>240&&info.h>500&&info.stage>210&&info.horizontal<=3,'Card sizing/overflow '+JSON.stringify(info));
   assert(info.clones===2&&info.loaded&&info.same&&info.effect&&info.footer,'Products or decoration broken '+JSON.stringify(info));
   assert(info.headingScroll<=info.headingWidth+5,'Clipped headline '+JSON.stringify(info));
   mkdirSync('tmp/gb-the-choice-v52',{recursive:true});
   await page.screenshot({path:'tmp/gb-the-choice-v52/'+vp.width+'-'+category+'.png',fullPage:false,animations:'allow'});
 }
 const filter='short';
 await page.locator('.category-tile[data-go-filter="'+filter+'"]').click();
 await page.waitForFunction(()=>document.querySelector('.filter[data-filter="short"]')?.classList.contains('active'),null,{timeout:16000});
 assert.deepEqual(errors,[],'Page exceptions '+JSON.stringify(errors));
 await ctx.close();
}
const ctx=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await ctx.newPage();
await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:40000});
await page.waitForFunction(()=>window.GBTheChoiceV52?.ready,null,{timeout:40000});
const quiet=await page.evaluate(()=>{
 const t=document.querySelector('.category-tile');
 return{source:getComputedStyle(t.querySelector('.category-object > .garment-svg')).visibility,
  split:getComputedStyle(t.querySelector('.gb52-parts')).display,fx:getComputedStyle(t.querySelector('.gb52-fx')).display}
});
assert(quiet.source==='visible'&&quiet.split==='none'&&quiet.fx==='none','Reduced motion must show original garment '+JSON.stringify(quiet));
await ctx.close();
console.log('OK GB CHOICE V52 / mobile, desktop, products, filters, reduced motion');
}finally{await b.close()}
