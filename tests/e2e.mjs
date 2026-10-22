// GB IMPORTS / QA E2E — Playwright sem dependências locais.
// Uso: node tests/e2e.mjs [baseURL]   (padrão http://localhost:8080; sirva a raiz ou dist/)
// Requer o pacote playwright disponível (global ou via NODE_PATH) e um Chromium instalado.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=require(p));break}catch{}}
if(!chromium){console.error('Playwright não encontrado.');process.exit(2)}
const BASE=process.argv[2]||process.env.BASE_URL||'http://localhost:8080/';
const VIEWPORTS=[[1440,900],[1024,768],[768,1024],[390,844],[320,720]];
const results=[];let failures=0;
const check=(vp,name,ok,info='')=>{results.push({vp,name,ok,info});if(!ok){failures++;console.log(`  ✗ [${vp}] ${name} ${info}`)}};

async function run(w,h,reduced=false){
  const vp=`${w}x${h}${reduced?' reduced':''}`;
  const browser=await chromium.launch();
  const mobile=w<600;
  const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
  const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('requestfailed',r=>{if(!r.url().includes('fonts.g'))errors.push('requestfailed '+r.url())});
  await page.goto(BASE,{waitUntil:'networkidle'});await page.waitForTimeout(400);
  // Mede contra a largura pedida: em modo mobile o Chrome alarga o viewport de layout se algo vaza.
  const overflow=async()=>page.evaluate(w=>Math.max(document.documentElement.scrollWidth,innerWidth)-w,w);
  check(vp,"sem overflow horizontal (topo)",await overflow()<=0,String(await overflow()));
  const cards=()=>page.locator('#productGrid .product-card').count();
  check(vp,'grade inicial com 8 cards',await cards()===8,String(await cards()));
  // Filtros
  await page.locator('.filter[data-filter="track"]').click();check(vp,'filtro agasalhos = 6',await cards()===6);
  await page.locator('.filter[data-filter="short"]').click();check(vp,'filtro camisa+short = 8',await cards()===8);
  await page.locator('.filter[data-filter="saved"]').click();check(vp,'salvos vazio mostra estado vazio',await page.locator('.catalog-empty').count()===1);
  await page.locator('.filter[data-filter="all"]').click();
  // Busca inline (sem acento) e URL
  await page.fill('#catalogSearch','madri');await page.waitForTimeout(250);
  check(vp,'busca "madri" = 2 resultados',await cards()===2,String(await cards()));
  check(vp,'busca refletida na URL',page.url().includes('q=madri'));
  await page.fill('#catalogSearch','');await page.waitForTimeout(250);
  await page.selectOption('#sortSelect','az');const first=await page.locator('#productGrid .product-name').first().textContent();
  check(vp,'ordenação A–Z',first.trim()==='Conjunto Alemanha',first);
  await page.selectOption('#sortSelect','curadoria');
  // Favorito
  await page.locator('#productGrid .favorite-toggle').first().click();
  check(vp,'favorito incrementa contador',(await page.locator('#wishCount').textContent())==='1');
  // Detalhe
  await page.locator('#productGrid .product-visual').first().click();await page.waitForTimeout(700);
  check(vp,'detalhe abre',await page.locator('#productModal').isVisible());
  check(vp,'URL da peça (?peca=)',page.url().includes('peca=gb-tr-01'));
  await page.locator('[data-gallery="top"]').click();
  check(vp,'galeria troca vista',(await page.locator('#galleryHero').getAttribute('data-view'))==='top');
  const n1=await page.locator('#productModal h2').textContent();
  await page.locator('[data-step-product="1"]').click();
  const n2=await page.locator('#productModal h2').textContent();
  check(vp,'próxima peça no detalhe',n1!==n2,`${n1} → ${n2}`);
  await page.locator('[data-size="top"][data-value="M"]').click();await page.locator('[data-size="bottom"][data-value="G"]').click();
  await page.locator('#addInterest').click();await page.waitForTimeout(200);
  check(vp,'seleção de interesse = 1',(await page.locator('#bagCount').textContent())==='1');
  check(vp,'sacola abre após adicionar',await page.locator('#bagDrawer').isVisible());
  check(vp,'URL limpa após fechar detalhe',!page.url().includes('peca='));
  await page.keyboard.press('Escape');await page.waitForTimeout(150);
  check(vp,'Escape fecha gaveta',!(await page.locator('#bagDrawer').isVisible()));
  // Busca na gaveta
  await page.locator('#searchOpen').click();await page.fill('#searchInput','kit');
  check(vp,'busca da gaveta "kit" = 8',await page.locator('#searchResults .search-result').count()===8);
  await page.keyboard.press('Escape');
  // Rail: botões, arrasto e visualizador
  await page.locator('#rail').scrollIntoViewIfNeeded();
  const c0=await page.locator('#railCounter').textContent();
  await page.locator('#railNext').click();await page.waitForTimeout(500);
  const c1=await page.locator('#railCounter').textContent();
  check(vp,'rail avança',c0!==c1,`${c0} → ${c1}`);
  const box=await page.locator('#railViewport').boundingBox();
  if(!mobile){await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5);await page.mouse.down();for(let i=1;i<=10;i++)await page.mouse.move(box.x+box.width*.7-i*28,box.y+box.height*.5);await page.mouse.up();await page.waitForTimeout(900);
    const c2=await page.locator('#railCounter').textContent();check(vp,'rail responde ao arrasto',c2!==c1,`${c1} → ${c2}`)}
  await page.locator('.rail-chips [data-rail-filter="track"]').click();
  check(vp,'filtro da arara (agasalhos = 6)',await page.locator('.rail-card').count()===6);
  await page.locator('#railExplore').click();await page.waitForTimeout(200);
  check(vp,'visualizador abre',await page.locator('#railViewer').isVisible());
  await page.locator('#railViewerNext').click();await page.keyboard.press('Escape');
  check(vp,'visualizador fecha',!(await page.locator('#railViewer').isVisible()));
  // Showroom
  await page.locator('#showroom').scrollIntoViewIfNeeded();
  await page.locator('.showroom-selector [data-show-index="2"]').click();
  check(vp,'showroom troca peça',(await page.locator('#showroomFeatureNum').textContent())==='03');
  // Look Studio
  await page.locator('#lookstudio').scrollIntoViewIfNeeded();
  const s0=await page.locator('#lookSummary').textContent();
  await page.locator('[data-look-cycle="top:1"]').click();
  check(vp,'look studio troca superior',(await page.locator('#lookSummary').textContent())!==s0);
  await page.locator('#lookSave').click();
  check(vp,'look salvo aparece na lista',await page.locator('.look-saved-item').count()>=1);
  // Identidade
  await page.locator('[data-gb-identity="1"]').click();
  check(vp,'identidade troca para TRAMA',(await page.locator('#identityTitle').textContent())==='TRAMA.');
  // Hero
  await page.evaluate(()=>scrollTo(0,0));const h0=await page.locator('#heroNum').textContent();await page.locator('#heroNext').click();await page.waitForTimeout(450);
  check(vp,'hero avança capítulo',(await page.locator('#heroNum').textContent())!==h0);
  // Entrada de loja com transição GB
  await page.locator('.shop-entry [data-v03-filter="short"]').click();await page.waitForTimeout(1100);
  check(vp,'atalho de loja aplica filtro',(await page.locator('.filter.active').getAttribute('data-filter'))==='short');
  // Deep link + voltar
  await page.goto(BASE+'?peca=gb-sh-02',{waitUntil:'networkidle'});
  check(vp,'deep link abre peça',(await page.locator('#productModal h2').textContent()).includes('MANCHESTER CITY'));
  // Overflow após rolar a página inteira
  const H=await page.evaluate(()=>document.documentElement.scrollHeight);
  await page.keyboard.press('Escape');
  for(let y=0;y<H;y+=900){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(40)}
  check(vp,'sem overflow horizontal (página inteira)',await overflow()<=0,String(await overflow()));
  check(vp,'sem erros de JS / rede',errors.length===0,errors.join(' | '));
  await browser.close();
}
for(const [w,h] of VIEWPORTS){console.log(`→ ${w}x${h}`);await run(w,h)}
console.log('→ 390x844 reduced-motion');await run(390,844,true);
const total=results.length;
console.log(`\n${total-failures}/${total} verificações aprovadas.`);
process.exit(failures?1:0);
