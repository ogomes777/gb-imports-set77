/* GB V59 / Human Copy QA. Mobile first, conversion paths, truthfulness, interactions and language. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const sizes=[320,360,390,430,768,1440];
try{
 for(const width of sizes){
  const height=width>=1000?900:width>=700?1024:844;
  const context=await b.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<=768});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&!document.getElementById('gbRibbonBoot'),null,{timeout:45000});
  await page.evaluate(()=>{document.body.setAttribute('data-gb-theme','origem');let r=document.querySelector('#como-funciona').getBoundingClientRect();scrollTo({top:scrollY+r.top-90,behavior:'instant'})});
  await page.waitForTimeout(350);
  const d=await page.evaluate(()=>{
   const steps=[...document.querySelectorAll('#como-funciona .how-card')],q=s=>document.querySelector(s);
   const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right}};
   const keys=steps.map(x=>({h:x.querySelector('h3')?.textContent,p:x.querySelector('p')?.textContent,rect:rect(x),icon:!!x.querySelector('.how-icon'),eyebrow:x.querySelector('.gb55-card-eyebrow')?.textContent}));
   const cta=q('.gb59-after-steps>a');
   const nav=q('.mobile-shop-nav');
   return {steps:keys,hero:q('#heroSub')?.textContent,
      heading:q('#como-funciona h2')?.innerText,cta:{href:cta?.href,text:cta?.textContent,rect:rect(cta)},
      documentWidth:document.documentElement.scrollWidth,screenWidth:innerWidth,
      lead:rect(q('.gb59-after-steps')),nav:rect(nav),
      catalog:!!q('#productGrid .product-card'),intro:!!q('#inicio'),
      studio:!!q('#lookstudio .look-stage'),brand:!!q('#universo .gb56-stage'),
      visibleSlashes:[...document.querySelectorAll('#como-funciona h3,#como-funciona p,#como-funciona .gb55-card-eyebrow')]
        .some(e=>e.textContent.includes(' / ')),
      decorativeGlyphs:steps.reduce((n,e)=>n+(e.querySelector('.how-icon')?1:0),0),
      linkCount:q('.footer-nav')?.querySelectorAll('a').length,
      navIconsVisible:nav?Array.from(nav.querySelectorAll('a>span,button>span')).some(e=>getComputedStyle(e).display!=='none'):false};
  });
  console.log('GB_V59_MOBILE '+width+' '+JSON.stringify({titles:d.steps.map(x=>x.h),cardWidths:d.steps.map(x=>Math.round(x.rect.w)),overflow:d.documentWidth-d.screenWidth,leadWidth:d.lead?.w,lead:d.cta?.text}));
  assert(d.steps.length===3&&d.decorativeGlyphs===0,'Generic step icons remain');
  assert.deepEqual(d.steps.map(x=>x.h),['ENCONTRE SUAS PEÇAS','MONTE SEU LOOK','FALE COM A GB'],'Conversion headings missing');
  assert(d.steps.every(x=>x.p.length>85),'Incomplete step copy');
  assert(!d.visibleSlashes,'Decorative separators still in step copy');
  assert(d.catalog&&d.studio&&d.intro&&d.brand,'Critical section or catalog missing');
  assert(d.documentWidth<=d.screenWidth+3,'Horizontal overflow '+width+': '+(d.documentWidth-d.screenWidth));
  assert(d.steps.every(x=>x.rect.w>=245&&x.rect.right<=width+4),'Card clipped '+width);
  assert(d.cta.text.includes('CONVERSAR COM A GB')&&d.cta.href.includes('instagram.com/gb.importts_'),'Lead CTA not connected to official channel');
  assert(d.cta.rect.w>=170&&d.cta.rect.right<=width+4,'Lead CTA clipped');
  assert(d.linkCount>=3,'Footer links lost');
  if(width<=430)assert(!d.navIconsVisible,'Generic glyphs still visible in mobile dock');
  mkdirSync('tmp/gb-v59',{recursive:true});
  await page.locator('#como-funciona').screenshot({path:'tmp/gb-v59/'+width+'.png',animations:'disabled',timeout:25000});
  assert.deepEqual(errors,[],'Browser errors '+JSON.stringify(errors));
  if(width===390){
    await page.evaluate(()=>window.GBSetLanguage('en'));
    await page.waitForFunction(()=>document.querySelector('[data-gb55-step="03"] h3')?.textContent==='TALK TO GB',null,{timeout:8000});
    const en=await page.locator('.gb59-after-steps p').textContent();
    assert(en.includes('No need to describe'),'English lead copy not translated');
    await page.evaluate(()=>window.GBSetLanguage('pt'));
    await page.waitForFunction(()=>document.querySelector('[data-gb55-step="03"] h3')?.textContent==='FALE COM A GB',null,{timeout:8000});
  }
  await context.close();
 }
 const context=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const p=await context.newPage();
 await p.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
 await p.waitForFunction(()=>window.GBLuxStepsV55?.ready&&window.GBBrand3DV56,null,{timeout:45000});
 const calm=await p.evaluate(()=>({animation:getComputedStyle(document.querySelector('#como-funciona .gb55-card-inner')).animationName,brand:window.GBBrand3DV56.fallback}));
 assert(calm.animation==='none'&&calm.brand,'Reduced motion protections lost');
 await context.close();
 console.log('GB_V59_PASS 6 sizes + languages + functional storefront + buyer journey + reduced motion');
}finally{await b.close()}
