/* GB V61: light tech signal without heavy gold and with genuinely responsive connecting rail. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const root=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const widths=[320,360,390,430,768,1024,1440];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
try{
 for(const width of widths){
  const height=width===768?1024:width>=1024?900:844;
  const ctx=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference',deviceScaleFactor:1});
  const page=await ctx.newPage(),errs=[];
  page.on('pageerror',e=>errs.push(e.message));
  await page.goto(root+'/',{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForFunction(()=>window.GBLuxStepsV55?.ready&&window.GB_CORE_READY&&!document.getElementById('gbRibbonBoot'),null,{timeout:55000});
  await page.evaluate(()=>{
    document.body.dataset.gbTheme='origem';
    dispatchEvent(new Event('gb:themechange'));
    const s=document.querySelector('#como-funciona');
    const r=s.getBoundingClientRect();
    scrollTo({top:scrollY+r.top-50,behavior:'instant'});
    window.GBLuxStepsV55.measure();
  });
  await page.waitForTimeout(450);
  const data=await page.evaluate(()=>{
   const s=document.querySelector('#como-funciona');
   const cards=[...s.querySelectorAll('.how-card')],tracks=[...s.querySelectorAll('.gb55-track')];
   const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,left:r.left,right:r.right,bottom:r.bottom}};
   return {
    width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,
    isTech:s.classList.contains('gb61-tech'),
    sectionBg:getComputedStyle(s).backgroundImage,
    headerText:s.querySelector('.gb55-heading-aside')?.textContent,
    cards:cards.map(c=>({rect:rect(c),bg:getComputedStyle(c).backgroundImage,edge:getComputedStyle(c).borderTopColor,
      shadow:getComputedStyle(c).boxShadow,title:c.querySelector('h3')?.textContent,
      titleWidth:c.querySelector('h3')?.scrollWidth,titleClient:c.querySelector('h3')?.clientWidth,
      text:c.querySelector('p')?.textContent,textSize:parseFloat(getComputedStyle(c.querySelector('p')).fontSize),
      node:getComputedStyle(c,'::after').opacity})),
    tracks:tracks.map(t=>({rect:rect(t),background:getComputedStyle(t).backgroundImage,shadow:getComputedStyle(t).boxShadow,opacity:parseFloat(getComputedStyle(t).opacity)})),
    cta:s.querySelector('.gb59-after-steps a')?.href,
    globalReady:!!document.querySelector('#universo .gb56-stage')&&!!document.querySelector('#lookstudio .look-stage')
   };
  });
  console.log('GB_V61_VIEW '+width+' '+JSON.stringify({overflow:data.overflow,cardWidths:data.cards.map(c=>Math.round(c.rect.width)),height:data.cards.map(c=>Math.round(c.rect.height)),track:data.tracks.map(c=>({x:Math.round(c.rect.x),w:Math.round(c.rect.width),h:Math.round(c.rect.height)})),neutral:data.cards.map(c=>c.edge)}));
  assert(data.isTech&&data.globalReady,'Missing class or key modules');
  assert(data.cards.length===3&&data.tracks.length===2,'Card/track count changed');
  assert(data.overflow<=3,'Horizontal overflow at '+width+': '+data.overflow);
  assert(data.cards.every(c=>c.title&&c.text.length>65&&c.textSize>=13),'Content lost');
  assert(data.cards.every(c=>c.titleWidth<=c.titleClient+3),'Title clipped at '+width);
  assert(data.cards.every(c=>c.bg.includes('linear-gradient')),'Neutral surface missing');
  assert(!data.sectionBg.includes('rgba(249, 197, 56, 0.22)'),'Heavy gold background still active');
  assert(data.cta?.includes('instagram.com/gb.importts_'),'Lead action broke');
  assert(data.tracks.every(t=>t.opacity>.9),'Signal tracks hidden');
  if(width<=900){
    assert(data.cards.every(c=>c.rect.width>=250&&c.rect.right<=width+3),'Mobile card out of bounds');
    assert(data.tracks.every((t,i)=>Math.abs(t.rect.x-(data.cards[i].rect.left-13))<=4),'Track not on the left side');
    assert(data.tracks.every(t=>t.rect.height>=16&&t.rect.width<=3),'Vertical connector broken');
    assert(data.cards.every(c=>c.node==='1'),'External mobile nodes not active');
  }else{
    assert(Math.abs(data.cards[0].rect.y-data.cards[1].rect.y)<14,'Desktop cards should share a row (allow V55 floating animation)');
    assert(data.tracks.every(t=>t.rect.width>=8&&t.rect.height<=3),'Desktop circuit lines missing');
  }
  mkdirSync('tmp/gb-v61',{recursive:true});
  await page.locator('#como-funciona').screenshot({path:'tmp/gb-v61/light-'+width+'.png',animations:'disabled',timeout:30000});
  // Dark must keep its V55 colors and centered mobile lines.
  await page.evaluate(()=>{
   document.body.dataset.gbTheme='sinal';
   dispatchEvent(new Event('gb:themechange'));
   window.GBLuxStepsV55.measure();
  });
  const dark=await page.evaluate(()=>{
   const s=document.querySelector('#como-funciona');
   const c=s.querySelector('.how-card'),t=s.querySelector('.gb55-track');
   const a=c.getBoundingClientRect(),l=t.getBoundingClientRect();
   return{paper:getComputedStyle(s).getPropertyValue('--gb55-paper').trim(),
     glass:getComputedStyle(s).getPropertyValue('--gb55-glass').trim(),
     side:l.left-a.left+13,relative:l.left-a.left,
     current:s.classList.contains('gb61-tech')};
  });
  assert(dark.paper==='#0e0f10'&&dark.glass==='rgba(30,31,32,.94)','Dark V55 tokens changed '+JSON.stringify(dark));
  if(width<=900)assert(Math.abs(dark.side)>16,'Dark rails incorrectly switched to light geometry '+JSON.stringify(dark));
  assert.deepEqual(errs,[],'Browser exceptions '+JSON.stringify(errs));
  await ctx.close();
 }
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(root+'/',{waitUntil:'domcontentloaded',timeout:55000});
 await page.waitForFunction(()=>window.GBLuxStepsV55?.ready&&window.GB_CORE_READY,null,{timeout:55000});
 const rm=await page.evaluate(()=>({anim:getComputedStyle(document.querySelector('#como-funciona .gb55-card-inner')).animationName}));
 assert(rm.anim==='none','Reduced motion broken');
 await ctx.close();
 console.log('GB_V61_PASS seven widths, restrained light theme, precise technical line, mobile and dark isolation');
}finally{await browser.close()}
