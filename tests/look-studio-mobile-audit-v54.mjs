import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const origin=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
try{
 for(const vp of [{width:320,height:700},{width:360,height:740},{width:390,height:844},{width:430,height:932},{width:768,height:1024},{width:1440,height:900}]){
  const page=await browser.newPage({viewport:vp,hasTouch:vp.width<=780,isMobile:false,deviceScaleFactor:1});
  const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.goto(origin+'/',{waitUntil:'domcontentloaded',timeout:40000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&!document.getElementById('gbRibbonBoot'),null,{timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#lookstudio .look-stage')?.classList.contains('has-fit'),null,{timeout:30000});
  await page.evaluate(()=>{const el=document.querySelector('#lookstudio .look-stage'),r=el.getBoundingClientRect();scrollTo({top:r.top+scrollY-110,behavior:'instant'})});
  await page.waitForTimeout(400);
  const metrics=await page.evaluate(()=>{
   const q=s=>document.querySelector('#lookstudio '+s);
   const box=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),right:Math.round(r.right),bottom:Math.round(r.bottom)}};
   const stage=q('.look-stage'),fig=q('#gbFitFigure'),panel=q('.look-controls'),layout=q('.look-layout');
   const all=Array.from(q('.fit-emotes')?.querySelectorAll('button')||[]);
   return {viewport:innerWidth,layout:getComputedStyle(layout).gridTemplateColumns,stage:box(stage),figure:box(fig),panel:box(panel),topline:box(q('.look-topline')),title:box(q('.look-intro h2')),turnbar:box(q('.fit-turnbar')),
     shuffle:box(q('#lookShuffle')),emotes:all.map(x=>({label:x.getAttribute('aria-label')||x.textContent.trim(),...box(x),visible:getComputedStyle(x).display!=='none'})), rows:[...document.querySelectorAll('#lookstudio .look-step')].map(x=>({box:box(x),row:box(x.querySelector('.look-options')),thumb:box(x.querySelector('.look-option')),selected:!!x.querySelector('.look-option.active')})),
     nav:box(document.querySelector('.mobile-shop-nav')),horizontalOverflow:document.documentElement.scrollWidth-innerWidth,figureExists:!!fig,
     options:document.querySelectorAll('#lookstudio .look-option').length};
  });
  console.log('GB_LOOK_MOBILE_AUDIT '+JSON.stringify(metrics));
  assert(metrics.figureExists&&metrics.options>=8,'Critical: no figure or catalog options');
  assert(metrics.horizontalOverflow<=3,'Page horizontal overflow '+vp.width);
  if(vp.width<=780){
    assert(metrics.stage.y+metrics.stage.h<=metrics.panel.y+4,'Stage/panel collision '+vp.width);
    assert(metrics.stage.w<=vp.width,'Stage too wide '+vp.width);
  }
  mkdirSync('tmp/gb-look-studio-audit',{recursive:true});
  await page.locator('#lookstudio').screenshot({path:'tmp/gb-look-studio-audit/'+vp.width+'.png',animations:'disabled',timeout:25000});
  await page.close();
 }
 console.log('GB_LOOK_AUDIT_DONE');
}finally{await browser.close()}
