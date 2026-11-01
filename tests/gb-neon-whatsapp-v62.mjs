/* GB IMPORTS V62 / conversion neon + WhatsApp tests.
   Ensure light-only 3-step aesthetics, dark isolation, mobile, logo, WhatsApp real icon,
   no fabricated phone/group, and reduced motion on 320-1440 viewports. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const widths=[320,360,390,430,768,1024,1440];
try{
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width===768?1024:width>=1024?900:844},reducedMotion:'no-preference'});
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBLuxStepsV55?.ready&&window.GBWhatsAppV62?.ready&&!document.getElementById('gbRibbonBoot'),null,{timeout:60000});
  await page.evaluate(()=>{
   document.body.dataset.gbTheme='origem';
   dispatchEvent(new Event('gb:themechange'));
   const s=document.querySelector('#como-funciona'),r=s.getBoundingClientRect();
   scrollTo({top:scrollY+r.top-60,behavior:'instant'});
   window.GBLuxStepsV55.measure();
  });
  await page.waitForFunction(()=>document.querySelector('#como-funciona').classList.contains('gb55-active'),null,{timeout:12000});
  await page.waitForTimeout(200);
  const d=await page.evaluate(()=>{
   const s=document.querySelector('#como-funciona');
   const bb=e=>{const r=e.getBoundingClientRect();return{left:r.left,right:r.right,y:r.y,width:r.width,height:r.height}};
   const cards=[...s.querySelectorAll('.how-card')],lines=[...s.querySelectorAll('.gb55-track')],cta=s.querySelector('.gb62-wa-cta');
   return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,
    cards:cards.map(x=>({box:bb(x),ring:getComputedStyle(x.querySelector('.gb62-neon-outline')),
      numberColor:getComputedStyle(x.querySelector('.how-num')).color,
      title:x.querySelector('h3').textContent})).map(x=>({...x,ring:{display:x.ring.display,animation:x.ring.animationName,opacity:x.ring.opacity}})),
    lines:lines.map(x=>({box:bb(x),pulse:getComputedStyle(x.querySelector('i')).animationName})),
    whatsapp:{box:bb(s.querySelector('.gb62-whatsapp-card')),link:cta.href,
      label:cta.textContent.trim(),icon:!!cta.querySelector('svg path[d]'),
      iconFill:getComputedStyle(cta).color,note:s.querySelector('.gb62-wa-disclaimer')?.textContent,
      ring:getComputedStyle(s.querySelector('.gb62-whatsapp-neon')).animationName,
      preview:s.querySelector('.gb62-chat-preview p')?.textContent,previewDisplay:getComputedStyle(s.querySelector('.gb62-chat-preview')).display},
    ready:window.GBWhatsAppV62.ready,
    whatsappMode:window.GBWhatsAppV62.mode,
    look:!!document.querySelector('#lookstudio .look-stage')
   };
  });
  console.log('GB_V63_LIGHT '+width+' '+JSON.stringify({overflow:d.overflow,cards:d.cards.map(x=>Math.round(x.box.width)),ring:d.cards.map(x=>x.ring.animation),lines:d.lines.map(x=>({x:Math.round(x.box.left),w:x.box.width,h:x.box.height})),waMode:d.whatsappMode,wa:d.whatsapp.link.slice(0,38)}));
  assert(d.overflow<=3,'Overflow at '+width+': '+d.overflow);
  assert(d.cards.length===3&&d.lines.length===2&&d.look,'Missing cards, connector or Look Studio');
  assert(d.cards.every(x=>x.ring.display==='block'&&x.ring.animation.includes('gb63-energy-loop')),'Infinite yellow loop missing');
  assert(d.cards.every(x=>x.numberColor!=='rgb(164, 170, 171)'),'Numbers still gray');
  assert(d.whatsapp.icon&&d.whatsapp.ring.includes('gb63-energy-loop'),'WhatsApp authentic icon or green loop missing');
  assert(d.whatsapp.link.startsWith('https://wa.me/'),'CTA does not open WhatsApp');
  assert(!d.whatsapp.link.includes('chat.whatsapp.com'),'CTA must not redirect to news group');
  assert(d.whatsapp.link.includes('text='),'Prepared contact text missing');
  assert(d.whatsapp.preview?.includes('Oi, GB!'),'Conversation preview missing');
  assert(d.whatsapp.box.width>=250&&d.whatsapp.box.right<=width+3,'WhatsApp panel clipped');
  if(width<=560){
    assert(d.whatsapp.previewDisplay==='none','Large redundant preview should be hidden on phone');
    assert(d.whatsapp.box.height<=390,'WhatsApp card remains too tall on '+width+': '+d.whatsapp.box.height);
  }else{
    assert(d.whatsapp.previewDisplay!=='none','Conversation preview missing on wider displays');
  }
  if(width<=900){
    assert(d.cards.every(x=>x.box.right<=width+3&&x.box.width>=250),'Mobile cards clipped');
    assert(d.lines.every(x=>x.box.width<=3&&x.box.height>=12),'Mobile connection wrong');
    assert(d.whatsapp.box.y>d.cards[2].box.y,'CTA must follow cards');
  }else{
    assert(d.lines.every(x=>x.box.width>8&&x.box.height<=3),'Horizontal circuit missing');
  }
  mkdirSync('tmp/gb-v62-neon',{recursive:true});
  await page.locator('#como-funciona').screenshot({path:'tmp/gb-v62-neon/light-'+width+'.png',animations:'disabled',timeout:30000});
  await page.evaluate(()=>{
   document.body.dataset.gbTheme='sinal';
   dispatchEvent(new Event('gb:themechange'));
   window.GBLuxStepsV55.measure();
  });
  const dark=await page.evaluate(()=>{
    const s=document.querySelector('#como-funciona'),c=s.querySelector('.how-card');
    return{ring:getComputedStyle(c.querySelector('.gb62-neon-outline')).display,
      paper:getComputedStyle(s).getPropertyValue('--gb55-paper').trim(),
      glass:getComputedStyle(s).getPropertyValue('--gb55-glass').trim(),
      contact:!!s.querySelector('.gb62-wa-cta svg path')};
  });
  assert(dark.ring==='none'&&dark.paper==='#0e0f10'&&dark.glass==='rgba(30,31,32,.94)'&&dark.contact,
    'Dark upper cards visually changed '+JSON.stringify(dark));
  assert.deepEqual(errors,[],'Javascript errors '+width+' '+JSON.stringify(errors));
  await ctx.close();
 }
 // Tab language and accessibility, reduced motion and no crypto / phone fabrication.
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await ctx.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForFunction(()=>window.GBWhatsAppV62?.ready&&window.GBSetLanguage,null,{timeout:60000});
 const reduced=await page.evaluate(()=>({
   ring:getComputedStyle(document.querySelector('.gb62-whatsapp-neon')).animationName,
   card:getComputedStyle(document.querySelector('.gb62-neon-outline')).animationName,
   mode:window.GBWhatsAppV62.mode,number:window.GBWhatsAppV62.hasOfficialNumber
 }));
 assert(reduced.ring==='none'&&reduced.card==='none','Reduced motion must stop neon loops');
 if(!reduced.number)assert(reduced.mode==='share','No number must never imply direct contact');
 await page.evaluate(()=>window.GBSetLanguage('en'));
 await page.waitForFunction(()=>document.querySelector('#gb62WhatsAppLabel')?.textContent.includes('WHATSAPP'),null,{timeout:9000});
 const en=await page.locator('.gb62-wa-intro p').textContent();
 assert(en.includes('Found an item'),'English not translated '+en);
 await page.evaluate(()=>window.GBSetLanguage('pt'));
 await page.waitForFunction(()=>document.querySelector('.gb62-wa-intro p')?.textContent.includes('Encontrou uma peça'),null,{timeout:9000});
 await ctx.close();
 console.log('GB_V63_PASS | 7 widths, yellow light border loop, green WhatsApp loop, safe prepared share link, dark isolated, reduced motion, locales');
}finally{await browser.close()}
