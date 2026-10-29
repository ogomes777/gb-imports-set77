import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const cfg of [{w:1440,h:900},{w:390,h:844}]){
 const c=await browser.newContext({viewport:{width:cfg.w,height:cfg.h},hasTouch:cfg.w<600,reducedMotion:'reduce'});
 const page=await c.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8080/',{waitUntil:'domcontentloaded',timeout:32000});
 await page.waitForFunction(()=>window.GB_CORE_READY&&window.GBNavV39,{timeout:30000});
 const start=await page.evaluate(()=>({brand:document.querySelector('.brand-lockup').innerText,ambient:document.querySelector('#top').dataset.ambient,navCount:document.querySelectorAll('.desktop-nav a').length,search:document.querySelector('#searchDrawer').hidden}));
 assert(start.brand==='IMPORTS'&&start.navCount>=5,'brand/nav broken '+JSON.stringify(start));
 if(cfg.w>900){
  await page.evaluate(()=>document.getElementById('showroom').scrollIntoView());
  await page.waitForTimeout(270);
  const showroom=await page.evaluate(()=>({ambient:GBNavV39.ambient,compact:document.querySelector('#top').classList.contains('is-compact')}));
  assert(showroom.ambient==='ice'&&showroom.compact,'showroom dynamic tone or compact failed '+JSON.stringify(showroom));
  await page.locator('#gbAccountOpen').click();
  assert(await page.locator('#gbAccountPanel').isVisible(),'account menu missing');
  const account=await page.locator('#gbAccountPanel').innerText();
  assert(account.includes('Favoritos')&&account.includes('Minha seleção'),'account actions unavailable');
  assert(await page.locator('#gbSettingsOpen').count()===0,'redundant settings button must be removed');
  const beforeTheme=await page.evaluate(()=>document.body.dataset.gbTheme);
  await page.locator('#gbThemeToggle').click();
  const afterTheme=await page.evaluate(()=>document.body.dataset.gbTheme);
  assert(afterTheme!==beforeTheme,'native theme toggle stopped working '+beforeTheme+' → '+afterTheme);
  await page.locator('#gbLanguageTrigger').click();
  assert(await page.locator('#gbLanguageMenu').isVisible(),'premium language menu missing');
  assert(await page.locator('#gbLanguageMenu [role="menuitemradio"]').count()===4,'four languages expected');
  await page.locator('#gbLanguageMenu [data-gb-locale="en"]').click();
  assert(await page.locator('#gbLanguage').inputValue()==='en','language not connected to native i18n');
  assert(await page.locator('html').getAttribute('lang')==='en','document language not updated');
  assert(await page.locator('#gbLanguageMenu').isHidden(),'language popover did not dismiss on selection');
  assert(await page.locator('#gbLanguageTrigger .gb-language-current').innerText()==='EN','language trigger not synced');
  await page.locator('#gbLanguageTrigger').press('ArrowDown');
  assert(await page.locator('#gbLanguageMenu').isVisible(),'keyboard picker did not open');
  await page.keyboard.press('Escape');
  assert(await page.locator('#gbLanguageMenu').isHidden(),'escape should close the language menu');
  await page.screenshot({path:'v39-desktop-navbar.png'});
 }else{
  assert(await page.locator('#gbSettingsOpen').count()===0,'mobile duplicate preferences remain');
  await page.locator('#gbLanguageTrigger').click();
  assert(await page.locator('#gbLanguageMenu').isVisible(),'mobile premium language menu missing');
  await page.locator('#gbLanguageMenu [data-gb-locale="es"]').click();
  assert(await page.locator('#gbLanguage').inputValue()==='es','mobile locale not connected');
  assert(await page.locator('#gbLanguageTrigger .gb-language-current').innerText()==='ES','mobile premium locale not synced');
  await page.locator('#menuOpen').click();
  assert(await page.locator('#navDrawer').isVisible(),'mobile menu missing');
  assert(await page.locator('#navDrawer [data-gb-action="search"]').count()===1,'mobile action missing');
  await page.locator('#navDrawer [data-gb-action="search"]').click();
  assert(await page.locator('#searchDrawer').isVisible(),'mobile route to search missing');
 }
 if(cfg.w>900)await page.locator('#searchOpen').click();
 assert(await page.locator('#searchDrawer').isVisible(),'search not showing');
 const open=await page.evaluate(()=>({drawerWidth:document.querySelector('#searchDrawer').getBoundingClientRect().width,
  suggestion:!document.querySelector('#gbSearchSuggestions').hidden,searchCards:document.querySelectorAll('#searchResults .search-result').length}));
 assert(open.drawerWidth>=cfg.w-2&&open.suggestion&&open.searchCards===8,'search flagship UI broken '+JSON.stringify(open));
 await page.locator('#searchInput').fill('Manchester');
 await page.waitForTimeout(200);
 const filtered=await page.evaluate(()=>({suggestions:document.querySelector('#gbSearchSuggestions').hidden,
 count:document.querySelectorAll('#searchResults [data-searchproduct]').length}));
 assert(filtered.suggestions&&filtered.count>0,'live real catalog search broken '+JSON.stringify(filtered));
 await page.screenshot({path:cfg.w>900?'v39-desktop-search.png':'v39-mobile-search.png'});
 await page.locator('#searchDrawer [data-close]').click();
 assert(await page.locator('#searchDrawer').isHidden(),'search close broke');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert(overflow<=2&&!errors.length,'layout/JS errors '+JSON.stringify({overflow,errors}));
 console.log(JSON.stringify({viewport:cfg.w+'x'+cfg.h,start,search:open,filtered,overflow,errors}));
 await c.close();
}
await browser.close();