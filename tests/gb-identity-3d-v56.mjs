/* V56 Brand Identity QA: actual WebGL volume, automatic motion, semantic conversions, mobile, reduced motion. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const widths=[{width:1440,height:900},{width:1024,height:768},{width:768,height:1024},{width:430,height:932},{width:390,height:844},{width:320,height:720}];
try{
 for(const vp of widths){
  const ctx=await browser.newContext({viewport:vp,deviceScaleFactor:1,reducedMotion:'no-preference'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&!document.getElementById('gbRibbonBoot'),null,{timeout:50000});
  await page.evaluate(()=>{const s=document.querySelector('#universo .gb56-stage'),r=s.getBoundingClientRect();scrollTo({top:scrollY+r.top-110,behavior:'instant'})});
  await page.waitForFunction(()=>window.GBBrand3DV56?.ready||window.GBBrand3DV56?.failed,null,{timeout:18000});
  await page.waitForFunction(()=>document.querySelector('.gb56-stage')?.classList.contains('gb56-webgl')||window.GBBrand3DV56?.failed,null,{timeout:8000});
  await page.waitForTimeout(620); // fade from official SVG fallback to volumetric WebGL canvas

  const scene=await page.evaluate(()=>{
   const q=s=>document.querySelector(s),geo=e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
   const s=q('#universo'),stage=q('#universo .gb56-stage'),obj=window.GBBrand3DV56;
   return{ready:obj.ready,failed:obj.failed,error:s.dataset.gb56Error,triangles:obj.triangles,angle:obj.angle,running:obj.running,section:geo(s),stage:geo(stage),
    title:q('.gb56-story h2')?.innerText,copy:q('.gb56-lead')?.textContent,bodyCount:q('.gb56-story').querySelectorAll('p').length,
    actions:[...q('.gb56-actions').querySelectorAll('a')].map(a=>({href:a.getAttribute('href'),label:a.textContent.trim()})),
    instagram:q('.gb56-contact a')?.href,overflow:document.documentElement.scrollWidth-innerWidth,
    canvasVisible:getComputedStyle(q('.gb56-canvas')).opacity,
    source:q('.gb56-static-logo')?.getAttribute('src')};
  });
  console.log('GB_V56_SCREEN '+vp.width+' '+JSON.stringify({ready:scene.ready,triangles:scene.triangles,stage:scene.stage,overflow:scene.overflow,body:scene.bodyCount,error:scene.error}));
  assert(scene.ready&&!scene.failed,'Actual 3D renderer failed '+JSON.stringify(scene));
  assert(scene.triangles>500,'Logo is not an extruded mesh '+JSON.stringify(scene));
  assert(scene.canvasVisible==='1','WebGL canvas hidden '+JSON.stringify(scene));
  assert(scene.source?.includes('gb-monograma-amarelo-preto.svg'),'Official logo missing');
  assert(scene.copy?.includes('GB Imports')&&scene.bodyCount>=3,'Brand story missing');
  assert(scene.actions.length===2&&scene.actions[0].href==='#colecao'&&scene.actions[1].href==='#lookstudio','CTA routes wrong');
  assert(scene.instagram?.includes('instagram.com/gb.importts_'),'Contact invalid');
  assert(scene.overflow<=3,'Horizontal clipping '+vp.width+' '+scene.overflow);
  assert(scene.stage.w>=vp.width*.34&&scene.stage.h>=280,'3D frame tiny '+JSON.stringify(scene.stage));
  const initial=scene.angle;
  await page.waitForTimeout(750);
  const later=await page.evaluate(()=>window.GBBrand3DV56.angle);
  assert(Math.abs(later-initial)>.08,'Automatic rotation stopped '+vp.width);
  mkdirSync('tmp/gb-brand-v56',{recursive:true});
  await page.screenshot({path:'tmp/gb-brand-v56/'+vp.width+'.png',animations:'allow'});
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>!window.GBBrand3DV56.running,null,{timeout:8000});
  assert.deepEqual(errors,[],'JS errors '+JSON.stringify(errors));
  await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.GBBrand3DV56&&window.GB_CORE_READY,null,{timeout:50000});
 await page.evaluate(()=>{const r=document.querySelector('#universo').getBoundingClientRect();scrollTo({top:scrollY+r.top,behavior:'instant'})});
 const status=await page.evaluate(()=>({running:window.GBBrand3DV56.running,fallback:window.GBBrand3DV56.fallback,src:document.querySelector('.gb56-static-logo')?.src}));
 assert(!status.running&&status.fallback&&status.src?.includes('gb-monograma'),'Reduced motion must show static official mark '+JSON.stringify(status));
 await page.close();
 console.log('OK GB V56: WebGL volume, 360 rotation, six viewports, fallback, conversion and no overflow');
}finally{await browser.close()}
