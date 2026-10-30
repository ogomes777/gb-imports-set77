/* GB Imports | Cinematic catalog wave V41
 * Run after: node scripts/build.mjs; python3 -m http.server 8080 --directory dist
 */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const cfg of [{width:1440,height:900,reduced:false},{width:390,height:844,reduced:false},{width:390,height:844,reduced:true}]){
  const context=await browser.newContext({viewport:{width:cfg.width,height:cfg.height},hasTouch:cfg.width<600,reducedMotion:cfg.reduced?'reduce':'no-preference'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&(matchMedia('(prefers-reduced-motion: reduce)').matches||window.GBCatalogWaveV41),null,{timeout:40000});
  // a abertura segura a página no topo enquanto assina o logo; a grade só entra em tela depois que ela sai
  await page.waitForFunction(()=>!window.GBGlassRibbons||GBGlassRibbons.removed,null,{timeout:20000});
  for(let i=0;i<12;i++){const ok=await page.evaluate(()=>{const r=document.getElementById('productGrid').getBoundingClientRect();if(r.top<innerHeight*.6&&r.bottom>innerHeight*.4)return true;scrollBy(0,r.top-innerHeight*.25);return false});if(ok)break;await page.waitForTimeout(400)}
  await page.waitForTimeout(140);
  const initial=await page.evaluate(()=>window.GBCatalogWaveV41?.state||{totalCards:document.querySelectorAll('#productGrid .product-card').length,active:false});
  assert(initial.totalCards===8,'catalog must still render 8 initial products');
  if(!cfg.reduced){
   await page.mouse.wheel(0,460);
   await page.waitForFunction(()=>GBCatalogWaveV41.state.amplitude>.03,null,{timeout:5000});
   const wave=await page.evaluate(()=>({
    ...GBCatalogWaveV41.state,
    transform:document.getElementById('productGrid').style.transform,
    stagger:[...document.querySelectorAll('#productGrid > .product-card')]
      .some(el=>el.style.getPropertyValue('--gb-wave-y')!=='')
   }));
   assert(wave.skew!==0&&/perspective\(1400px\)/.test(wave.transform),'3D catalog wave not active '+JSON.stringify(wave));
   assert(wave.stagger,'staggered per-card wave missing');
   assert(wave.visibleCards>0,'catalog wave did not activate nearby cards');
   await page.waitForFunction(()=>!GBCatalogWaveV41.state.active,null,{timeout:6000});
   assert((await page.locator('#productGrid').getAttribute('style')||'').indexOf('perspective')===-1,'grid transform not restored at rest');
  }else{
   await page.mouse.wheel(0,450);
   await page.waitForTimeout(300);
   assert(!await page.evaluate(()=>!!window.GBCatalogWaveV41?.state.active),'motion reduced preference ignored');
  }
  // The optical response never changes catalog event handlers, filters or favorites.
  await page.locator('.filter[data-filter="track"]').click();
  assert(await page.locator('#productGrid .product-card').count()>0,'catalog filters stopped working');
  await page.locator('.filter[data-filter="all"]').click();
  await page.locator('#productGrid .favorite-toggle').first().click();
  assert(await page.locator('#productGrid .favorite-toggle.is-fav').count()>0,'favorite click broken');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert(overflow<=2,'horizontal overflow '+overflow);
  assert(!errors.length,'page JavaScript errors '+JSON.stringify(errors));
  console.log(JSON.stringify({viewport:cfg.width+'x'+cfg.height,reduced:cfg.reduced,initial,overflow,errors,wave:'ok',controls:'ok'}));
  await context.close();
 }
}finally{await browser.close()}
