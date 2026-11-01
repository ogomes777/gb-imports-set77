/* GB Imports V58: light luxury-only regression test.
   Verifies positive styling in light theme, unchanged dark theme,
   actual gold connectors and content legibility in 6 viewports. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const sizes=[{width:1440,height:900},{width:1024,height:768},{width:768,height:1024},{width:430,height:932},{width:390,height:844},{width:320,height:720}];
try {
 for(const v of sizes){
  const context=await browser.newContext({viewport:v,deviceScaleFactor:1,reducedMotion:'no-preference'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBLuxStepsV55?.ready&&!document.getElementById('gbRibbonBoot'),null,{timeout:45000});
  await page.evaluate(()=>document.body.setAttribute('data-gb-theme','origem'));
  await page.evaluate(()=>{
   const el=document.querySelector('#como-funciona'),r=el.getBoundingClientRect();
   scrollTo({top:scrollY+r.top-Math.max(0,(innerHeight-r.height)/2),behavior:'instant'});
  });
  await page.waitForFunction(()=>document.querySelector('#como-funciona').classList.contains('is-in'),null,{timeout:15000});
  await page.waitForTimeout(230);
  const before=await page.evaluate(()=>{
   const section=document.querySelector('#como-funciona'),cards=[...section.querySelectorAll('.how-card')],links=[...section.querySelectorAll('.gb55-track')];
   const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,left:r.left,right:r.right,bottom:r.bottom}};
   return {
    dark:false,bodyTheme:document.body.dataset.gbTheme,background:getComputedStyle(section).backgroundImage,
    overflow:document.documentElement.scrollWidth-innerWidth,
    cards:cards.map(c=>({rect:rect(c),background:getComputedStyle(c).backgroundImage,border:getComputedStyle(c).borderColor,
      radius:getComputedStyle(c).borderRadius,shadow:getComputedStyle(c).boxShadow,
      icon:rect(c.querySelector('.how-icon')),
      headline:{text:c.querySelector('h3').innerText,weight:getComputedStyle(c.querySelector('h3')).fontWeight,scrollWidth:c.querySelector('h3').scrollWidth,clientWidth:c.querySelector('h3').clientWidth},
      description:{text:c.querySelector('p').innerText,fontSize:getComputedStyle(c.querySelector('p')).fontSize,weight:getComputedStyle(c.querySelector('p')).fontWeight,color:getComputedStyle(c.querySelector('p')).color},
      kicker:{fontSize:getComputedStyle(c.querySelector('.gb55-card-eyebrow')).fontSize,color:getComputedStyle(c.querySelector('.gb55-card-eyebrow')).color}})),
    tracks:links.map(l=>({rect:rect(l),opacity:getComputedStyle(l).opacity,shadow:getComputedStyle(l).boxShadow})),
    look:!!document.querySelector('#lookstudio .look-stage'),brand:!!document.querySelector('#universo .gb56-stage'),
    active:section.classList.contains('gb55-active')
   };
  });
  console.log('GB_V58_LIGHT '+v.width+' '+JSON.stringify({cards:before.cards.map(c=>({w:Math.round(c.rect.w),h:Math.round(c.rect.h),fontsize:c.description.fontSize,weight:c.description.weight})),tracks:before.tracks.map(t=>({w:Math.round(t.rect.w),h:Math.round(t.rect.h)})),overflow:before.overflow,active:before.active}));
  assert(before.cards.length===3&&before.look&&before.brand,'Look Studio connection or brand missing');
  assert(before.overflow<=3,'Horizontal overflow '+v.width+' '+before.overflow);
  assert(before.cards.every(c=>c.rect.w>240&&c.rect.h>=245),'Card too small '+JSON.stringify(before.cards));
  assert(before.cards.every(c=>c.background.includes('gradient')&&!c.background.includes('none')),'Premium light gradients not applied');
  assert(before.cards.every(c=>c.shadow.includes('rgba')||c.shadow.includes('rgb')),'Light premium depth not applied');
  assert(before.cards.every(c=>parseFloat(c.description.fontSize)>=13&&parseInt(c.description.weight,10)>=600),'Copy contrast/weight too weak');
  assert(before.cards.every(c=>c.headline.scrollWidth<=c.headline.clientWidth+3),'Card title clipped');
  assert(before.cards.every(c=>c.kicker.color!=='rgba(0, 0, 0, 0)'),'Eyebrow invisible');
  assert(before.tracks.length===2&&before.tracks.every(t=>+t.opacity>=.9),'Gold line not visible');
  if(v.width<=900){
   assert(before.tracks.every(t=>t.rect.h>=12&&t.rect.w<=4),'Mobile line must be vertical');
   assert(before.cards.every(c=>c.rect.left>=0&&c.rect.right<=v.width+3),'Mobile card clipped');
  }else assert(before.tracks.every(t=>t.rect.w>=10&&t.rect.h<=4),'Desktop lines must be horizontal');
  mkdirSync('tmp/gb-light-lux-v58',{recursive:true});
  await page.locator('#como-funciona').screenshot({path:'tmp/gb-light-lux-v58/light-'+v.width+'.png',animations:'disabled',timeout:30000});
  // Theme switch must restore existing V55 dark material without V58 gold-ivory overrides.
  await page.evaluate(()=>document.body.setAttribute('data-gb-theme','sinal'));
  await page.waitForTimeout(70);
  const dark=await page.evaluate(()=>{
    const root=document.querySelector('#como-funciona'),card=root.querySelector('.how-card');
    return {glass:getComputedStyle(root).getPropertyValue('--gb55-glass').trim(),
      ink:getComputedStyle(root).getPropertyValue('--gb55-ink').trim(),
      background:getComputedStyle(card).backgroundImage,
      cardColor:getComputedStyle(card).backgroundColor,
      readable:getComputedStyle(card.querySelector('p')).color};
  });
  assert(dark.glass==='rgba(30,31,32,.94)'&&dark.ink==='#f5f2e8','Dark mode V55 tokens overwritten '+JSON.stringify(dark));
  if(v.width===390){
    await page.evaluate(()=>document.body.setAttribute('data-gb-theme','origem'));
    await page.evaluate(()=>window.GBSetLanguage('en'));
    await page.waitForFunction(()=>document.querySelector('#como-funciona .how-card h3')?.textContent==='EXPLORE',null,{timeout:6500});
    await page.evaluate(()=>window.GBSetLanguage('pt'));
  }
  assert.deepEqual(errors,[],'Browser errors '+JSON.stringify(errors));
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.GBLuxStepsV55?.ready,null,{timeout:40000});
 const calm=await page.evaluate(()=>{
  const s=document.querySelector('#como-funciona'),c=s.querySelector('.how-card');
  return{animation:getComputedStyle(c.querySelector('.gb55-card-inner')).animationName,opacity:getComputedStyle(c).opacity};
 });
 assert(calm.animation==='none'&&calm.opacity==='1','Reduced motion no longer honored '+JSON.stringify(calm));
 await context.close();
 console.log('GB_V58_PASS — six screen widths, premium light materials, strong copy, gold track, original dark, reduced-motion');
}finally{await browser.close()}
