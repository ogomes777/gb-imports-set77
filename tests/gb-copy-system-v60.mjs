/* GB Imports V60 / full UI content and conversion audit.
   Simulates customer paths, modal, look studio, navigation and demonstrative pages.
   Never treats an inactive account/order feature as a live commercial service. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
const paths=["/gb","/gb/entrar","/gb/cadastro","/gb/perfil","/gb/identidade","/gb/pedidos","/gb/pedido","/gb/rastreio","/gb/favoritos","/gb/sacola","/gb/checkout","/gb/comparar","/gb/medidas","/gb/alertas","/gb/colecoes","/gb/drops","/gb/marcas","/gb/busca","/gb/club","/gb/club/avatar","/gb/club/distrito","/gb/club/conquistas","/gb/club/temporada","/gb/club/armario","/gb/club/recompensas","/gb/club/ranking","/gb/club/amigos","/gb/comunidade","/gb/comunidade/publicar","/gb/ajuda","/gb/trocas","/gb/privacidade","/gb/acessibilidade","/gb/configuracoes","/gb-studio","/gb-studio/pedidos","/gb-studio/produtos","/gb-studio/clientes","/gb-studio/comunidade","/gb-studio/beneficios","/gb-studio/financeiro","/gb-studio/newsletter"];
try{
 for(const width of [320,390,768,1440]){
  const height=width===768?1024:width>=1000?900:844;
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<=768,reducedMotion:'no-preference'});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:50000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBExperience&&!document.getElementById('gbRibbonBoot'),null,{timeout:50000});
  const initial=await page.evaluate(()=>{
   const q=s=>document.querySelector(s);
   return {styles:[...document.styleSheets].map(x=>x.href||'').some(x=>x.includes('gb.')),look:!!q('#lookstudio .look-stage'),
   catalog:!!q('#productGrid'),hero:!!q('#inicio'),newCopy:!!q('.gb59-after-steps'),
   width:document.documentElement.scrollWidth-innerWidth,nav:!!q('.gb-nav-mobile-tools')};
  });
  assert(initial.styles&&initial.look&&initial.catalog&&initial.hero&&initial.newCopy,'Main landing broken '+JSON.stringify(initial));
  assert(initial.width<=3,'Landing overflow '+width+': '+initial.width);
  // Browse actual internal routes via SPA navigation, including screens with intentionally inactive services.
  for(const path of paths){
   await page.evaluate(p=>window.GBExperience.go(p),path);
   const data=await page.evaluate(()=>{
    const e=document.querySelector('#gbExperience'),head=e?.querySelector('h1,h2');
    const all=[...e?.querySelectorAll('.gx-empty-glyph,.gx-tile>i')||[]];
    return {path:window.GBExperience?.path,visible:!!e&&!e.hidden,
      title:head?.textContent?.trim(),banner:!!e?.querySelector('.gx-demo'),
      overflow:document.documentElement.scrollWidth-innerWidth,
      glyphs:all.filter(x=>getComputedStyle(x).display!=='none'&&x.textContent.trim()!=='').map(x=>x.textContent),
      copy:e?.textContent?.slice(0,520),
      cards:e?.querySelectorAll('.gx-tile').length||0};
   });
   assert(data.visible&&data.path===path&&data.banner,'Internal route failed '+JSON.stringify(data));
   assert(data.overflow<=4,'Route overflow at '+width+' '+path+': '+data.overflow);
   assert(data.glyphs.length===0,'Decorative route glyphs at '+path+' '+JSON.stringify(data.glyphs));
   if(['/gb/entrar','/gb/cadastro','/gb/pedidos','/gb/checkout'].includes(path))
    assert(/DEMONSTRATIVA|DEMONSTRAÇÃO|não/i.test(data.copy),'Missing commercial warning '+path);
  }
  // User can still open real catalogue, find product information and contact.
  await page.evaluate(()=>window.GBExperience.go('/#colecao'));
  await page.waitForTimeout(100);
  const catalogCard=page.locator('#productGrid [data-product], #productGrid [data-open-product], #productGrid .product-card').first();
  if(await catalogCard.count()){
    await catalogCard.click({timeout:16000,force:true}).catch(()=>{});
    const modal=await page.evaluate(()=>{
      const e=document.querySelector('#productModal');return {visible:!!e&&!e.hidden,text:e?.textContent?.slice(0,900),
      consult:!!e?.querySelector('[data-consult]'),gallery:!!e?.querySelector('.product-gallery')}
    });
    assert(!modal.visible||modal.consult,'Product consultation action lost '+JSON.stringify(modal));
  }
  await page.evaluate(()=>window.GBExperience.go('/gb/favoritos'));
  const saved=await page.evaluate(()=>({path:window.GBExperience.path,active:!document.querySelector('#gbExperience').hidden}));
  assert(saved.active&&saved.path==='/gb/favoritos','Favorites route inaccessible');
  mkdirSync('tmp/gb-v60-audit',{recursive:true});
  await page.screenshot({path:'tmp/gb-v60-audit/'+width+'.png',animations:'disabled'});
  assert.deepEqual(errors,[],'Browser exceptions '+width+' '+JSON.stringify(errors.slice(0,8)));
  console.log('GB_V60_WIDTH '+width+' '+JSON.stringify({routes:paths.length,overflow:initial.width,errors:errors.length}));
  await ctx.close();
 }
 // Navigate the service menus and validate browser storage and reduced-motion.
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage();
 await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBExperience,null,{timeout:50000});
 await page.evaluate(()=>window.GBExperience.go('/gb/checkout'));
 const demo=await page.evaluate(()=>({notice:document.querySelector('.gx-demo')?.textContent||'',motion:getComputedStyle(document.querySelector('.gb55-card-inner')).animationName}));
 assert(demo.notice.includes('Nenhuma ação gera pagamento')&&demo.motion==='none','Demo truthfulness or accessibility changed '+JSON.stringify(demo));
 await context.close();
 console.log('GB_V60_PASS full internal route audit, 4 screen widths, no decorative glyphs, live catalog & reduced motion');
}finally{await browser.close()}
