/* GB Imports V57 | editorial brand QA.
   Tests type hierarchy, link navigation, no button regression, 3D preservation
   and accurate mobile layout from 320 through 1440 px. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const widths=[{width:320,height:720},{width:360,height:740},{width:390,height:844},{width:430,height:932},{width:768,height:1024},{width:1440,height:900}];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
try{
 for(const vp of widths){
  const context=await browser.newContext({viewport:vp,deviceScaleFactor:1,reducedMotion:'no-preference'});
  const page=await context.newPage();
  const exceptions=[];page.on('pageerror',e=>exceptions.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:48000});
  await page.waitForFunction(()=>Boolean(window.GB_CORE_READY)&&!document.getElementById('gbRibbonBoot'),null,{timeout:48000});
  await page.evaluate(()=>{
    const stage=document.querySelector('#universo .gb56-stage');
    const r=stage.getBoundingClientRect();
    scrollTo({top:scrollY+r.top-90,behavior:'instant'});
  });
  await page.waitForFunction(()=>window.GBBrand3DV56?.ready||window.GBBrand3DV56?.failed,null,{timeout:19000});
  await page.waitForTimeout(350);
  const m=await page.evaluate(()=>{
    const s=document.querySelector('#universo');
    const q=t=>s.querySelector(t),box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,left:r.left,right:r.right}};
    const rail=q('.gb57-action-rail');
    const links=[...rail.querySelectorAll('a.gb57-action')];
    const contact=q('.gb57-direct a');
    const paragraphs=[...s.querySelectorAll('.gb56-story p')];
    return {viewport:innerWidth,scene:s.classList.contains('gb56-brand'),
      rail:box(rail),links:links.map(e=>({href:e.getAttribute('href'),title:e.querySelector('strong')?.textContent,
        label:e.querySelector('.gb57-action-top span:first-child')?.textContent,box:box(e),titleBox:box(e.querySelector('strong')),
        titleScroll:e.querySelector('strong')?.scrollWidth,titleClient:e.querySelector('strong')?.clientWidth,
        weight:getComputedStyle(e.querySelector('strong')).fontWeight,family:getComputedStyle(e.querySelector('strong')).fontFamily})),
      contact:{href:contact?.href,text:contact?.innerText},copy:paragraphs.map(e=>({size:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight,color:getComputedStyle(e).color})),
      labelSize:getComputedStyle(q('.gb56-values b')).fontSize,
      overflow:document.documentElement.scrollWidth-innerWidth,
      scene3d:window.GBBrand3DV56?.ready,broken:window.GBBrand3DV56?.failed,
      canvas:q('.gb56-canvas')!==null,oldButtons:s.querySelectorAll('.gb56-actions a').length,
      headline:q('h2')?.textContent,stage:box(q('.gb56-stage'))};
  });
  console.log('GB_V57_METRICS '+vp.width+' '+JSON.stringify({
    titles:m.links.map(l=>l.title),widths:m.links.map(l=>Math.round(l.box.w)),text:m.links.map(l=>Math.round(l.titleBox.w)),
    copyWeight:m.copy[0]?.weight,labelSize:m.labelSize,overflow:m.overflow,webgl:m.scene3d}));
  assert(m.scene&&m.scene3d&&!m.broken&&m.canvas,'3D V56 has regressed '+JSON.stringify(m));
  assert(m.links.length===2&&m.oldButtons===0,'Old template buttons returned '+JSON.stringify(m));
  assert.deepEqual(m.links.map(x=>x.href),['#colecao','#lookstudio'],'Shopping navigation broken');
  assert.deepEqual(m.links.map(x=>x.title),['VER A SELEÇÃO','COMPOR MEU LOOK'],'Editorial links missing');
  assert(m.contact?.href.includes('instagram.com/gb.importts_'),'GB direct contact incorrect');
  assert(m.copy.length>=3&&m.copy.every(x=>parseInt(x.weight,10)>=600&&parseFloat(x.size)>=14),'Body typography still too thin '+JSON.stringify(m.copy));
  assert(m.links.every(x=>Number(x.weight)>=800),'Link typography lacks presence');
  assert(m.overflow<=3,'Horizontal document overflow '+vp.width+' '+m.overflow);
  assert(m.links.every(x=>x.titleScroll<=x.titleClient+3),'Link title clipped at '+vp.width+' '+JSON.stringify(m.links));
  if(vp.width<=480){
    assert(m.links[0].box.y<m.links[1].box.y-18,'Links must stack on phones');
    assert(m.links.every(x=>x.box.left>=0&&x.box.right<=vp.width+3),'Editorial link out of mobile viewport');
  }
  if(vp.width>=1024){
    assert(Math.abs(m.links[0].box.y-m.links[1].box.y)<=3,'Desktop links should share one row');
  }
  mkdirSync('tmp/gb-editorial-v57',{recursive:true});
  await page.screenshot({path:'tmp/gb-editorial-v57/'+vp.width+'.png',fullPage:false});
  assert.deepEqual(exceptions,[],'Browser JS exceptions '+JSON.stringify(exceptions));
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:48000});
 await page.waitForFunction(()=>Boolean(window.GB_CORE_READY),null,{timeout:45000});
 const accessibility=await page.evaluate(()=>{
  const s=document.querySelector('#universo');
  return{rails:s.querySelectorAll('nav[aria-label="Explore a GB Imports"] .gb57-action').length,
    fallback:window.GBBrand3DV56?.fallback,
    linkNames:[...s.querySelectorAll('.gb57-action')].map(x=>x.textContent.trim())};
 });
 assert(accessibility.rails===2&&accessibility.fallback,'Reduced motion should keep original GB logo');
 await page.evaluate(()=>window.GBSetLanguage('en'));
 await page.waitForFunction(()=>document.querySelector('.gb57-action strong')?.textContent==='VIEW THE SELECTION',null,{timeout:9000});
 await page.evaluate(()=>window.GBSetLanguage('pt'));
 await page.waitForFunction(()=>document.querySelector('.gb57-action strong')?.textContent==='VER A SELEÇÃO',null,{timeout:9000});
 await context.close();
 console.log('GB_V57_PASS | 6 sizes, strong typography, functional links, EN/PT translation, no clipping, WebGL 3D intact');
} finally { await browser.close(); }
