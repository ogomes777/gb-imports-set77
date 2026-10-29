/* GB Imports / V40 route, interaction and responsive smoke tests */
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const ROOT=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.json':'application/json'};
const server=createServer(async(req,res)=>{
 let name;
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const route=/^\/(?:gb(?:\/|$)|gb-studio(?:\/|$))/.test(path);
  name=resolve(ROOT,route?'index.html':path.slice(1)||'index.html');
  if(!name.startsWith(ROOT+'/')&&name!==ROOT)throw Error('outside dist');
  const body=await readFile(name);
  res.writeHead(200,{'content-type':MIME[extname(name)]||'application/octet-stream','cache-control':'no-store'});
  res.end(body);
 }catch(e){res.writeHead(404);res.end('NOT FOUND')}
});
await new Promise(resolve=>server.listen(8093,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const cfg of [{w:1440,h:900},{w:390,h:844}]){
  const context=await browser.newContext({viewport:{width:cfg.w,height:cfg.h},hasTouch:cfg.w<600,reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const url='http://127.0.0.1:8093';
  await page.goto(url+'/gb',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.GB_CORE_READY===true&&!!window.GBExperience,{timeout:35000});
  assert(await page.locator('#gbExperience').isVisible(),'GB hub not visible');
  assert(await page.locator('body').evaluate(el=>el.classList.contains('gb-experience-open')),'hub not activated');
  assert(await page.locator('.gx-card-grid .gx-tile').count()>=6,'hub modules missing');
  const matrix=['/gb','/gb/entrar','/gb/cadastro','/gb/perfil','/gb/identidade','/gb/pedidos','/gb/pedido','/gb/rastreio','/gb/favoritos','/gb/sacola','/gb/checkout','/gb/comparar','/gb/medidas','/gb/alertas','/gb/colecoes','/gb/drops','/gb/marcas','/gb/busca','/gb/club','/gb/club/armario','/gb/club/recompensas','/gb/club/ranking','/gb/club/amigos','/gb/comunidade','/gb/comunidade/publicar','/gb/ajuda','/gb/trocas','/gb/privacidade','/gb/acessibilidade','/gb/configuracoes','/gb-studio','/gb-studio/pedidos','/gb-studio/produtos','/gb-studio/clientes','/gb-studio/comunidade','/gb-studio/beneficios','/gb-studio/financeiro','/gb-studio/newsletter'];
  const found=await page.evaluate(routes=>routes.map(r=>{window.GBExperience.go(r);return{route:r,ok:window.GBExperience.path===r,title:!!document.querySelector('.gx-heading h1')?.textContent,visible:!document.getElementById('gbExperience').hidden}}),matrix);
  assert(found.every(x=>x.ok&&x.title&&x.visible),'missing routed UI '+JSON.stringify(found.filter(x=>!x.ok||!x.title||!x.visible)));
  await page.goto(url+'/gb/club/recompensas',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.GB_CORE_READY===true&&window.GBExperience?.path==='/gb/club/recompensas',{timeout:35000});
  assert(await page.locator('.gx-levels>div').count()===7,'7 level visual system missing');
  await page.evaluate(()=>window.GBExperience.go('/gb/identidade'));
  await page.locator('#gxHandle').fill('test_visual_gb');
  await page.locator('[data-gx-handle] button[type=submit]').click();
  assert((await page.locator('.gx-identity').innerText()).includes('test_visual_gb'),'local preview identity not working');
  assert((await page.evaluate(()=>JSON.stringify(localStorage.getItem('gb-v40-preview')))).includes('test_visual_gb'),'local identity not stored');
  await page.evaluate(()=>window.GBExperience.go('/gb/entrar'));
  await page.locator('#gxAuthEmail').fill('teste@example.com');
  await page.locator('#gxAuthPassword').fill('not-a-real-password');
  await page.locator('[data-gx-auth] button[type=submit]').click();
  assert(await page.locator('.gx-toast').isVisible(),'login demo feedback missing');
  assert(!(await page.evaluate(()=>localStorage.getItem('gb-v40-preview'))).includes('not-a-real-password'),'password stored');
  await page.evaluate(()=>window.GBExperience.go('/gb-studio'));
  assert(await page.locator('.gx-stats .gx-stat').count()===4,'admin demo missing metrics');
  await page.evaluate(()=>window.GBExperience.go('/#colecao'));
  assert(await page.locator('#gbExperience').isHidden(),'landing not restored');
  assert(!errors.length,'JS errors '+JSON.stringify(errors));
  console.log(JSON.stringify({viewport:cfg.w+'x'+cfg.h,routes:found.length,deepLink:'ok',localIdentity:'ok',accountDemo:'ok',studio:'ok',errors}));
  await context.close();
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
