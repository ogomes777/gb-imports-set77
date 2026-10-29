
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const BASE=process.argv[2]||'http://127.0.0.1:8080/';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBFitting&&document.querySelector('#lookstudio .look-stage'),null,{timeout:30000});
 await page.evaluate(()=>document.querySelector('#lookstudio .look-stage').scrollIntoView({block:'center',behavior:'instant'}));
 for(let attempt=0;attempt<20;attempt++){
   if(await page.evaluate(()=>!!document.getElementById('gbFitFigure')))break;
   await page.evaluate(()=>document.querySelector('#lookstudio .look-stage')
     ?.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForTimeout(350);
 }
 await page.waitForFunction(()=>!!document.getElementById('gbFitFigure'),null,{timeout:20000});
 await page.waitForFunction(()=>window.GBTrue360,null,{timeout:30000});
 await page.evaluate(()=>GBTrue360.open());
 await page.waitForFunction(()=>GBTrue360.active&&GBTrue360.vertices>10000,null,{timeout:20000});
 await page.waitForFunction(()=>{
   const f=document.getElementById('gbFitFigure');
   return document.querySelector('#lookstudio .look-stage')?.classList.contains('is-awake') &&
     f && getComputedStyle(f).visibility==='visible' && +getComputedStyle(f).opacity>.99;
 },null,{timeout:18000});
 let getState=()=>page.evaluate(()=>{
   const f=document.getElementById('gbFitFigure'),st=GBFitting.state;
   const part=n=>f.querySelector('.fit-layer-'+n+' .fit-garment')?.dataset.product||null;
   return {
    front:GBTrue360.frontFidelity,view:document.querySelector('.fit-scene').dataset.actorView,
    visible:getComputedStyle(f).visibility,opacity:+getComputedStyle(f).opacity,
    top:part('top'),bottom:part('bottom'),
    shoe:f.querySelector('.fit-layer-shoe .fit-shoe')?.dataset.product||null,
    cap:f.querySelector('.fit-layer-cap .fit-cap')?.dataset.product||null,
    head:!!f.querySelector('.fit-head'),hands:f.querySelectorAll('.fit-layer-arms .fit-hand').length,
    worn:{...st},actor:{...GBActor.state},vertices:GBTrue360.vertices,
    docWidth:document.documentElement.scrollWidth,
    viewport:innerWidth,
    imgCount:[...f.querySelectorAll('image')].filter(x=>x.getAttribute('href')?.includes('assets/fit/')).length
   };
 });
 let front=await getState();
 assert(front.visible==='visible'&&front.opacity>.995,'approved reference front hidden '+JSON.stringify(front));
 assert(front.top===front.worn.topId&&front.bottom===front.worn.bottomId,'garment anchors detached '+JSON.stringify(front));
 assert(front.imgCount>=3&&front.head&&front.hands===2,'original skin missing '+JSON.stringify(front));
 assert(front.actor.renderer==='webgl'&&front.vertices>10000,'true 3D unavailable');
 const catalog=await page.evaluate(()=>{
  const c=GB_FIT_CATALOG,s=GBFitting.state;
  const different=k=>Object.keys(c[k]||{}).find(id=>id!==s[k+'Id']);
  return{top:different('top'),bottom:different('bottom'),shoe:different('shoe'),cap:different('cap')};
 });
 if(width===1440&&process.env.GB_SCREENSHOTS==='1')await page.locator('#lookstudio .look-stage').screenshot({path:'preview-v24-front.jpg',type:'jpeg',quality:55});
 await page.evaluate(({top,bottom,shoe,cap})=>GBFitting.set({topId:top,bottomId:bottom,shoeId:shoe,capId:cap,hood:false},{source:'e2e-v24'}),catalog);
 await page.waitForFunction(c=>{
  const f=document.getElementById('gbFitFigure');
  return GBFitting.state.topId===c.top&&GBFitting.state.bottomId===c.bottom&&
   f.querySelector('.fit-layer-top .fit-garment')?.dataset.product===c.top&&
   f.querySelector('.fit-layer-bottom .fit-garment')?.dataset.product===c.bottom &&
   f.querySelector('.fit-layer-shoe .fit-shoe')?.dataset.product===c.shoe &&
   f.querySelector('.fit-layer-cap .fit-cap')?.dataset.product===c.cap;
 },catalog,{timeout:18000}).catch(async err=>{
   const d=await page.evaluate(()=>{
     const f=document.querySelector('#gbFitFigure');
     return{state:GBFitting.state,
       top:f?.querySelector('.fit-layer-top .fit-garment')?.dataset.product,
       bottom:f?.querySelector('.fit-layer-bottom .fit-garment')?.dataset.product,
       shoe:f?.querySelector('.fit-layer-shoe .fit-shoe')?.dataset.product,
       cap:f?.querySelector('.fit-layer-cap .fit-cap')?.dataset.product,
       stage:document.querySelector('#lookstudio .look-stage')?.className};
   });
   throw new Error('Outfit did not settle: '+JSON.stringify(d)+' / '+err.message);
 });
 await page.waitForTimeout(600);
 let outf=await getState();
 assert(outf.top===catalog.top&&outf.bottom===catalog.bottom&&outf.shoe===catalog.shoe&&outf.cap===catalog.cap,'fitting regression '+JSON.stringify(outf));
 assert(outf.opacity>.995,'not same exact front after swap');
 await page.evaluate(()=>GBTrue360.rotateTo(90));
 await page.waitForTimeout(1800);
 let side=await getState();
 assert(side.front<.01&&side.view==='volumetric'&&side.opacity<.05,'side failed '+JSON.stringify(side));
 if(width===1440&&process.env.GB_SCREENSHOTS==='1')await page.locator('#lookstudio .look-stage').screenshot({path:'preview-v24-side.jpg',type:'jpeg',quality:55});
 await page.evaluate(()=>GBTrue360.rotateTo(180));
 await page.waitForTimeout(1800);
 let back=await getState();
 assert(back.front<.01&&back.actor.renderer==='webgl','back failed '+JSON.stringify(back));
 await page.evaluate(()=>GBTrue360.rotateTo(0));
 await page.waitForTimeout(1800);
 let returned=await getState();
 assert(returned.front>.99&&returned.opacity>.99&&returned.top===outf.top&&returned.bottom===outf.bottom,'cannot restore same character '+JSON.stringify(returned));
 assert(returned.docWidth<=returned.viewport+2,'overflow '+JSON.stringify(returned));
 assert(errors.length===0,'js errors '+errors.join('; '));
 console.log(JSON.stringify({viewport:width+'x'+height,ok:true,frontFigureIntact:true,frontFidelity:front.opacity,top:outf.top,bottom:outf.bottom,shoe:outf.shoe,cap:outf.cap,vertices:side.vertices,side:side.view,back:back.view,returned:returned.view}));
 await page.close();
}
await browser.close();

