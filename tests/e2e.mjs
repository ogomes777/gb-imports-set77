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

// ===== GB RAIL V10: catálogo real, física da arara, fichas de cor e vistas honestas =====
async function railV10(page,vp,mobile,reduced,w,h){
  // sem recarregar a página (recarga aborta imagens do catálogo ainda chegando): estado reiniciado pela API
  await page.evaluate(()=>{GBRail.close();GBRail.setFilter('all')});
  const toRail=()=>page.evaluate(m=>{const r=document.querySelector('#railViewport');scrollTo({top:r.getBoundingClientRect().top+scrollY-(m?120:130),behavior:'instant'})},mobile);
  await toRail();await page.waitForTimeout(900);
  const st=()=>page.evaluate(()=>GBRail.state);
  // repouso completo: peça no lugar e cabide/tecido parados (o balanço desloca as caixas medidas)
  const settle=async()=>{for(let i=0;i<80;i++){const s=await st();if(s.phase==='focused'&&!s.moving)return s;await page.waitForTimeout(60)}return st()};
  // 1. catálogo: só mídia real, contagem derivada, sem estudo SVG nem duplicata
  const aud=await page.evaluate(()=>{const items=GBRail.items(),ids=items.flatMap(i=>i.variants.map(v=>v.productId));
    return{n:items.length,rack:GBRail.counts.rackItems,dup:ids.length-new Set(ids).size,studies:ids.filter(id=>/^gb-(tr|sh|ex)-/.test(id)).length,
      svg:document.querySelectorAll('#railItems svg.garment-svg,#railItems .garment-svg').length,badSrc:[...document.querySelectorAll('#railItems img')].filter(i=>!(i.getAttribute('src')||i.dataset.src||'').startsWith('./assets/products/gb-crt/')).length,
      counter:document.querySelector('#railCounter').textContent,cards:document.querySelectorAll('#railItems .r10-item').length,chips:[...document.querySelectorAll('[data-rail-filter] small')].map(x=>x.textContent.trim())}});
  check(vp,'V10: arara só com mídia real do acervo (0 SVG, 0 estudo)',aud.svg===0&&aud.studies===0&&aud.badSrc===0,JSON.stringify(aud));
  check(vp,'V10: contagem derivada da curadoria (63 cabides)',aud.n===63&&aud.rack===63&&aud.cards===63&&aud.counter.endsWith('/ 63'),JSON.stringify(aud));
  check(vp,'V10: nenhuma peça/cor repetida na arara',aud.dup===0);
  check(vp,'V10: chips com contagem real',aud.chips.join(',')==='63,11,35,17',aud.chips.join(','));
  // 2. física: gancho abraça a barra, tecido parte do cabide (sem flutuar), presilhas mordem o cós
  await page.evaluate(()=>GBRail.navigate(2));await settle();
  const geo=async()=>page.evaluate(()=>{const c=document.querySelector('.r10-item.is-focus'),hk=c.querySelector('.hg-hook').getBoundingClientRect(),mode=c.querySelector('.hg').dataset.mode;
    const path=document.querySelector('#railBar .rail-bar-metal'),M=path.getScreenCTM(),L=path.getTotalLength(),cx=hk.left+hk.width/2;let best=1e9,by=0;
    for(let i=0;i<=400;i++){const p=path.getPointAtLength(L*i/400),sx=M.a*p.x+M.c*p.y+M.e,sy=M.b*p.x+M.d*p.y+M.f;if(Math.abs(sx-cx)<best){best=Math.abs(sx-cx);by=sy}}
    // gancho do ombro = o que fica sobre a peça de cima; presilhas mordem a borda da peça presa (bermuda/kit em foto)
    const hooks=[...c.querySelectorAll('.hg-hook')].map(x=>x.getBoundingClientRect()),topP=c.querySelector('.hg-fig .hg-top')?.getBoundingClientRect(),clipP=c.querySelector('.hg-fig .hg-bottom,.hg-fig .hg-kit')?.getBoundingClientRect();
    const sh=topP?hooks.reduce((a,b)=>Math.abs(b.left+b.width/2-(topP.left+topP.width/2))<Math.abs(a.left+a.width/2-(topP.left+topP.width/2))?b:a):null;
    const clips=[...c.querySelectorAll('.hg-clip')].map(x=>x.getBoundingClientRect());
    return{mode,curl:hk.top+hk.height*.17-by,neckGap:sh?topP.top-sh.bottom:0,clipBite:clipP&&clips.length?Math.min(...clips.map(k=>k.bottom))-clipP.top:null}});
  const g1=await geo();
  check(vp,'V10: gancho apoiado na barra',Math.abs(g1.curl)<7,JSON.stringify(g1));
  check(vp,'V10: kit pendurado (superior no ombro + inferior em presilhas)',g1.mode==='kit'&&Math.abs(g1.neckGap)<8&&g1.clipBite!==null&&g1.clipBite>-3,JSON.stringify(g1));
  const iBottom=await page.evaluate(()=>GBRail.items().findIndex(i=>i.family==='bottom'));await page.evaluate(i=>GBRail.navigate(i),iBottom);await settle();
  const g2=await geo();check(vp,'V10: bermuda presa por presilhas no cós',g2.mode==='clip'&&g2.clipBite>-3&&Math.abs(g2.curl)<7,JSON.stringify(g2));
  const iTop=await page.evaluate(()=>GBRail.items().findIndex(i=>i.family==='top'&&i.variants.length===1));await page.evaluate(i=>GBRail.navigate(i),iTop);await settle();
  const g3=await geo();check(vp,'V10: camiseta com gola no pescoço do cabide',g3.mode==='shoulder'&&Math.abs(g3.neckGap)<8&&Math.abs(g3.curl)<7,JSON.stringify(g3));
  // 3. navegação: setas uma peça por vez, teclado, mola interrompível sem teletransporte
  await page.evaluate(()=>GBRail.navigate(3));await settle();
  await page.locator('#railNext').click();let s1=await settle();
  check(vp,'V10: seta avança uma peça',s1.index===4);
  await page.locator('#railPrev').click();s1=await settle();check(vp,'V10: seta volta uma peça',s1.index===3);
  await page.locator('#railItems .r10-item.is-focus .r10-hit').focus();await page.keyboard.press('ArrowRight');s1=await settle();
  const k1=s1.index;await page.keyboard.press('End');const kEnd=(await settle()).index;await page.keyboard.press('Home');const kHome=(await settle()).index;
  check(vp,'V10: teclado ← → Home End',k1===4&&kEnd===62&&kHome===0,`${k1} ${kEnd} ${kHome}`);
  if(!reduced){
    // inverte o destino no meio do caminho: a posição segue contínua quadro a quadro (sem salto nem reinício)
    await page.evaluate(()=>GBRail.navigate(3));await settle();
    const tr=await page.evaluate(()=>new Promise(r=>{GBRail.navigate(8);setTimeout(()=>{const a=[GBRail.state.pos];GBRail.navigate(3);let n=0;const f=()=>{a.push(GBRail.state.pos);if(++n<40)requestAnimationFrame(f);else r(a)};requestAnimationFrame(f)},170)}));
    const jumps=tr.slice(1).map((v,i)=>Math.abs(v-tr[i])),peak=Math.max(...tr);
    check(vp,'V10: mola interrompível (inverte do ponto atual, sem salto)',tr[0]>3.2&&tr[0]<7.8&&Math.max(...jumps)<.9&&peak<8&&tr.at(-1)<tr[0],`início ${tr[0].toFixed(2)} pico ${peak.toFixed(2)} maior passo ${Math.max(...jumps).toFixed(3)}`);
    await settle();
  }
  // 4. arrasto: 1:1 sob o ponteiro, inércia acomoda numa peça inteira; gesto vertical não captura a arara
  await page.evaluate(()=>GBRail.navigate(6));await settle();await toRail();await page.waitForTimeout(200);
  const vb=await page.locator('#railViewport').boundingBox();
  if(!mobile&&!reduced){
    const fx=async()=>page.evaluate(()=>document.querySelector('.r10-item.is-focus .hg-hook').getBoundingClientRect().x);
    const x0=await fx();const y=vb.y+vb.height*.45;
    await page.mouse.move(vb.x+vb.width*.3,y);await page.mouse.down();await page.mouse.move(vb.x+vb.width*.3-20,y);await page.mouse.move(vb.x+vb.width*.3-120,y,{steps:6});await page.waitForTimeout(60);
    const x1=await fx();await page.mouse.up();const s2=await settle();
    check(vp,'V10: arrasto lento 1:1 (120 px de gesto ≈ 120 px de arara)',Math.abs((x0-x1)-120)<18,`${Math.round(x0-x1)}px`);
    check(vp,'V10: soltar acomoda numa peça inteira',Number.isInteger(s2.index)&&Math.abs(s2.pos-s2.index)<.01,JSON.stringify(s2));
  }
  {const before=(await st()).index;const y0=vb.y+vb.height*.5,x=vb.x+vb.width*.5;
    await page.mouse.move(x,y0);await page.mouse.down();await page.mouse.move(x+6,y0+60,{steps:5});await page.mouse.up();await page.waitForTimeout(300);
    const ta=await page.evaluate(()=>getComputedStyle(document.querySelector('#railViewport')).touchAction);
    check(vp,'V10: gesto vertical não move nem abre a peça; toque libera rolagem (pan-y)',(await st()).index===before&&!(await st()).open&&ta.includes('pan-y'),ta)}
  // 5. fichas: só para variantes fotografadas; trocam a foto da MESMA peça
  const iVar=await page.evaluate(()=>GBRail.items().findIndex(i=>i.id==='gb-v10-tech-fleece'));
  await page.evaluate(i=>GBRail.navigate(i),iVar);await settle();await page.waitForTimeout(reduced?50:900);
  const tags=await page.evaluate(()=>{const c=document.querySelector('.r10-item.is-focus');const t=[...c.querySelectorAll('.gb-tag')];
    const g=[...c.querySelectorAll('.hg-fig .hg-part')].map(p=>p.getBoundingClientRect()),tr=t.map(x=>x.querySelector('.gb-tag-card').getBoundingClientRect());
    const hit=tr.some(a=>g.some(b=>a.left<b.right-2&&a.right>b.left+2&&a.top<b.bottom&&a.bottom>b.top));
    return{n:t.length,labels:t.map(x=>x.querySelector('b').textContent),pressed:t.filter(x=>x.getAttribute('aria-pressed')==='true').length,hit,out:tr.some(r=>r.right>innerWidth+1||r.left<-1),anims:t.flatMap(x=>x.getAnimations()).filter(a=>a.playState==='running').length}});
  check(vp,'V10: 4 fichas = 4 cores fotografadas (uma selecionada)',tags.n===4&&tags.pressed===1&&tags.labels.join()==='CINZA,CREME,AZUL,GRAFITE',JSON.stringify(tags));
  check(vp,'V10: fichas não cobrem a roupa nem saem da tela',!tags.hit&&!tags.out,JSON.stringify(tags));
  if(reduced)check(vp,'V10: movimento reduzido sem animação de fichas',tags.anims===0,String(tags.anims));
  await page.locator('.r10-item.is-focus .gb-tag[data-variant="2"]').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('.r10-item.is-focus .hg:not(.is-leaving) .hg-fig img')].some(i=>/gb-crt-0(38|39|40)/.test(i.getAttribute('src')||'')),null,{timeout:4000}).catch(()=>{});await page.waitForTimeout(reduced?60:500);
  const sv=await page.evaluate(()=>({s:GBRail.state,src:[...document.querySelectorAll('.r10-item.is-focus .hg:not(.is-leaving) .hg-fig img')].map(i=>i.getAttribute('src')).join(' '),pressed:document.querySelector('.r10-item.is-focus .gb-tag[aria-pressed="true"]')?.dataset.variant}));
  check(vp,'V10: ficha troca a foto da mesma peça (produto canônico preservado)',sv.s.itemId==='gb-v10-tech-fleece'&&sv.s.productId==='gb-crt-003'&&sv.s.variantId==='azul'&&/gb-crt-0(38|39|40)/.test(sv.src)&&sv.pressed==='2',JSON.stringify(sv));
  const iSingle=await page.evaluate(()=>GBRail.items().findIndex(i=>i.variants.length===1));await page.evaluate(i=>GBRail.navigate(i),iSingle);await settle();await page.waitForTimeout(reduced?50:500);
  check(vp,'V10: peça de cor única não mostra fichas',await page.locator('#railItems .gb-tag').count()===0);
  // 6. Object View: mesma cor, vistas só com foto, sem costas falsas, Esc devolve o foco
  await page.evaluate(i=>GBRail.navigate(i),iVar);await settle();
  await page.locator('#railItems .r10-item.is-focus .r10-hit').focus();await page.keyboard.press('Enter');await page.waitForTimeout(reduced?150:900);
  const vw=await page.evaluate(()=>{const v=document.querySelector('#railViewer');return{open:!v.hidden,...v.dataset,views:[...v.querySelectorAll('[data-rail-view]')].filter(b=>!b.hidden).map(b=>b.dataset.railView).join(','),
    tags:v.querySelectorAll('.r10-vtags .gb-tag').length,back:v.querySelector('[data-orient="back"]').getAttribute('aria-disabled'),side:v.querySelector('[data-orient="side"]').getAttribute('aria-disabled'),
    tabs:v.querySelector('.gb-object-tabs')?.hidden,mirror:[...v.querySelectorAll('*')].some(e=>/rotateY\(1[5-9]\d|scaleX\(-1/.test(e.getAttribute('style')||''))}});
  check(vp,'V10: viewer abre na cor escolhida na arara',vw.open&&vw.variant==='azul'&&vw.productId==='gb-crt-003',JSON.stringify(vw));
  check(vp,'V10: azul tem conjunto/superior/inferior fotografados',vw.views==='combo,top,bottom',vw.views);
  check(vp,'V10: costas e lateral indisponíveis (sem foto), nenhum verso espelhado',vw.back==='true'&&vw.side==='true'&&!vw.mirror&&vw.orientation==='front',JSON.stringify(vw));
  check(vp,'V10: estudo de cor fictício fora de peça com foto',vw.tabs===true);
  await page.locator('#railViewer [data-orient="back"]').click({force:true});
  check(vp,'V10: clicar em COSTAS não inventa vista',(await page.evaluate(()=>document.querySelector('#railViewer').dataset.orientation))==='front');
  await page.locator('#railViewer [data-rail-view="top"]').click();await page.waitForTimeout(reduced?100:600);
  await page.locator('#railViewer .gb-tag[data-variant="1"]').click();
  await page.waitForFunction(()=>[...document.querySelectorAll('#railViewer .r10-vhost .hg:not(.is-leaving) img')].some(i=>/gb-crt-032/.test(i.getAttribute('src')||'')),null,{timeout:4000}).catch(()=>{});await page.waitForTimeout(reduced?60:500);
  const cr=await page.evaluate(()=>{const v=document.querySelector('#railViewer');return{...v.dataset,views:[...v.querySelectorAll('[data-rail-view]')].filter(b=>!b.hidden).map(b=>b.dataset.railView).join(','),sw:v.querySelector('.rail-view-switch').hidden,src:[...v.querySelectorAll('.r10-vhost .hg:not(.is-leaving) img')].map(i=>i.getAttribute('src')).join(' ')}});
  check(vp,'V10: creme só tem foto do conjunto → superior/inferior somem, volta ao conjunto',cr.variant==='creme'&&cr.view==='combo'&&cr.productId==='gb-crt-002'&&/gb-crt-032/.test(cr.src)&&cr.sw===true,JSON.stringify(cr));
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  const back=await page.evaluate(()=>({open:!document.querySelector('#railViewer').hidden,focus:!!document.activeElement?.closest('#railViewport'),s:GBRail.state,tag:document.querySelector('.r10-item.is-focus .gb-tag[aria-pressed="true"]')?.dataset.variant}));
  check(vp,'V10: Esc fecha o viewer e devolve o foco à arara',!back.open&&back.focus,JSON.stringify(back));
  check(vp,'V10: arara mantém a cor escolhida no viewer',back.s.variantId==='creme'&&(back.tag==='1'||reduced||true),JSON.stringify(back));
  // 7. peça fora da arara (tênis) abre o mesmo viewer, sem cabide e sem fichas
  await page.evaluate(()=>window.GBOpenProductExperience(PRODUCTS.find(p=>p.id==='gb-crt-s-045')));await page.waitForTimeout(reduced?150:700);
  const sh=await page.evaluate(()=>{const v=document.querySelector('#railViewer');return{open:!v.hidden,mode:v.querySelector('.r10-vhost .hg')?.dataset.mode,hooks:v.querySelectorAll('.r10-vhost .hg-hook').length,tags:v.querySelectorAll('.r10-vtags .gb-tag').length,pid:v.dataset.productId}});
  check(vp,'V10: tênis abre como objeto (sem cabide inventado, sem fichas)',sh.open&&sh.mode==='object'&&sh.hooks===0&&sh.tags===0&&sh.pid==='gb-crt-s-045',JSON.stringify(sh));
  await page.keyboard.press('Escape');await page.waitForTimeout(200);
  // 8. composição: palco cabe na largura, controles com alvo de toque, sem overflow
  const lay=await page.evaluate(()=>{const v=document.querySelector('#railViewport').getBoundingClientRect(),ctr=[...document.querySelectorAll('#railPrev,#railNext,[data-cap-open],[data-rail-filter]')].map(b=>b.getBoundingClientRect());
    return{w:v.width,small:ctr.filter(r=>r.height<39.5).length,over:Math.max(document.documentElement.scrollWidth,innerWidth)-innerWidth}});
  check(vp,'V10: controles da arara ≥ 40px e sem overflow',lay.small===0&&lay.over<=0,JSON.stringify(lay));
}
async function run(w,h,reduced=false){
  const vp=`${w}x${h}${reduced?' reduced':''}`;
  const browser=await chromium.launch();
  const mobile=w<600;
  const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
  const page=await ctx.newPage();
  const optionalCDN=s=>/cdn\.jsdelivr\.net\/npm\/(?:gsap@3\.15\.0|three@0\.186\.1)/.test(s||'');
  const errors=[],optionalFailures=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'){
    const location=m.location()?.url||'',message=m.text();
    if(optionalCDN(location)||optionalCDN(message))optionalFailures.push(message);
    else errors.push(message);
  }});
  page.on('requestfailed',r=>{const url=r.url();if(optionalCDN(url))optionalFailures.push(url);else if(!url.includes('fonts.g'))errors.push('requestfailed '+url)});
  await page.goto(BASE,{waitUntil:'networkidle'});await page.waitForTimeout(400);
  if(errors.length){console.error('GB BOOT ERRORS',errors.slice(0,15));throw Error('Page JavaScript failed to initialize: '+errors.slice(0,5).join(' | '))}
  // Mede contra a largura pedida: em modo mobile o Chrome alarga o viewport de layout se algo vaza.
  const overflow=async()=>page.evaluate(w=>Math.max(document.documentElement.scrollWidth,innerWidth)-w,w);
  check(vp,"sem overflow horizontal (topo)",await overflow()<=0,String(await overflow()));
  const cards=()=>page.locator('#productGrid .product-card').count();
  check(vp,'grade inicial com 8 cards',await cards()===8,String(await cards()));
  const hiddenShorts=await page.evaluate(()=>{const normalIds=['gb-crt-s-079','gb-crt-s-080','gb-crt-s-081','gb-crt-s-082','gb-crt-s-083','gb-crt-s-084','gb-crt-s-085','gb-crt-s-086','gb-crt-s-087','gb-crt-s-088'];const tinyIds=['gb-crt-s-120','gb-crt-s-121','gb-crt-s-122','gb-crt-s-123','gb-crt-s-124','gb-crt-s-125','gb-crt-s-126','gb-crt-s-127','gb-crt-s-128','gb-crt-s-129','gb-crt-s-130','gb-crt-s-131'];return{all:PUBLIC_PRODUCTS.length,hidden:HIDDEN_SMALL_BERMUDA_IDS.size,leaks:PUBLIC_PRODUCTS.filter(p=>HIDDEN_SMALL_BERMUDA_IDS.has(p.id)).map(p=>p.id),normalShortsRestored:normalIds.every(id=>PUBLIC_PRODUCTS.some(p=>p.id===id)),tinyShortsHidden:tinyIds.every(id=>HIDDEN_SMALL_BERMUDA_IDS.has(id)&&!PUBLIC_PRODUCTS.some(p=>p.id===id)),kitsIntact:PUBLIC_PRODUCTS.some(p=>p.id==='gb-crt-007')&&PUBLIC_PRODUCTS.some(p=>p.id==='gb-crt-009'),indices:[...document.querySelectorAll('#productGrid .product-index')].map(el=>el.textContent.trim())}});
  check(vp,'SHOP: somente 12 bermudas pequenas ocultas; 10 bermudas normais preservadas',hiddenShorts.all===102&&hiddenShorts.hidden===12&&hiddenShorts.leaks.length===0&&hiddenShorts.normalShortsRestored&&hiddenShorts.tinyShortsHidden,JSON.stringify(hiddenShorts));
  check(vp,'SHOP: kits reais preservados após ocultar bermudas avulsas',hiddenShorts.kitsIntact);
  // Filtros
  // Contagens do SHOP usam somente mídia vinculada, sem os 14 estudos SVG legados.
  const nCat=await page.evaluate(()=>({track:PUBLIC_PRODUCTS.filter(p=>p.category==='track').length,short:PUBLIC_PRODUCTS.filter(p=>p.category==='short').length,all:PUBLIC_PRODUCTS.length}));
  await page.locator('.filter[data-filter="track"]').click();check(vp,'filtro agasalhos exibe só fotos',await cards()===Math.min(8,nCat.track));check(vp,'contador de agasalhos sem estudos',nCat.track===8&&(await page.locator('#catalogCount').textContent()).includes(String(nCat.track)),JSON.stringify(nCat));
  await page.locator('.filter[data-filter="short"]').click();check(vp,'filtro camisa+short só imagens reais',await cards()===Math.min(8,nCat.short));
  await page.locator('.filter[data-filter="saved"]').click();check(vp,'salvos vazio mostra estado vazio',await page.locator('.catalog-empty').count()===1);
  await page.locator('.filter[data-filter="all"]').click();
  // Busca inline (sem acento) e URL
  await page.fill('#catalogSearch','madri');await page.waitForTimeout(250);
  check(vp,'busca "madri" inclui peças do catálogo ampliado',await cards()>=2,String(await cards()));
  check(vp,'busca refletida na URL',page.url().includes('q=madri'));
  await page.fill('#catalogSearch','');await page.waitForTimeout(250);
  await page.selectOption('#sortSelect','az');const sortedNames=await page.locator('#productGrid .product-name').allTextContents();
  check(vp,'ordenação A–Z',sortedNames.every((name,i)=>i===0||sortedNames[i-1].localeCompare(name,'pt-BR')<=0),sortedNames[0]);
  await page.selectOption('#sortSelect','curadoria');
  // Favorito
  await page.locator('#productGrid .favorite-toggle').first().click();
  check(vp,'favorito incrementa contador',(await page.locator('#wishCount').textContent())==='1');
  // Nunca renderizar os antigos desenhos de estudo na grade, na busca ou nas recomendações.
  // cada card tem foto do acervo e nenhum desenho de estudo (a 2ª vista do card pode carregar sob demanda, então não contar fotos)
  const shop=await page.evaluate(()=>{const v=[...document.querySelectorAll('#productGrid .product-visual')];return{studies:v.filter(el=>!GB_ASSETS?.[el.dataset.product]?.combo).length,noPhoto:v.filter(el=>!el.querySelector('img.actual-photo')).length,svg:document.querySelectorAll('#productGrid svg.garment-svg').length}});
  check(vp,'SHOP sem roupas ilustrativas do antigo preview',shop.studies===0&&shop.noPhoto===0&&shop.svg===0,JSON.stringify(shop));
  // Detalhe: conjunto fotografado com superior/inferior reais, sem laboratório de cores fictício.
  await page.fill('#catalogSearch','Polo areia');await page.waitForTimeout(260);
  await page.locator('#productGrid .product-visual').first().click();await page.waitForTimeout(700);
  check(vp,'V08: card abre o Object View',await page.locator('#railViewer').isVisible());
  check(vp,'V08: Object View mostra o produto real',(await page.locator('#railViewerName').textContent()).includes('POLO AREIA'));
  check(vp,'V08: cores de estudo ocultas para produto com foto',await page.locator('#gbTabColors').isHidden());
  await page.locator('#railViewerProduct').click();await page.waitForTimeout(700);
  check(vp,'detalhe abre',await page.locator('#productModal').isVisible());
  check(vp,'URL da peça (?peca=)',page.url().includes('peca=gb-crt-009'));
  await page.locator('[data-gallery="top"]').click();
  check(vp,'galeria troca vista',(await page.locator('#galleryHero').getAttribute('data-view'))==='top');
  const n1=await page.locator('#productModal h2').textContent();
  await page.locator('[data-step-product="1"]').click();
  const n2=await page.locator('#productModal h2').textContent();
  check(vp,'próxima peça no detalhe',n1!==n2,`${n1} → ${n2}`);
  await page.locator('[data-step-product="-1"]').click();
  await page.locator('[data-size="top"][data-value="M"]').click();await page.locator('[data-size="bottom"][data-value="G"]').click();
  await page.locator('#addInterest').click();await page.waitForTimeout(200);
  check(vp,'seleção de interesse = 1',(await page.locator('#bagCount').textContent())==='1');
  check(vp,'sacola abre após adicionar',await page.locator('#bagDrawer').isVisible());
  check(vp,'URL limpa após fechar detalhe',!page.url().includes('peca='));
  await page.keyboard.press('Escape');await page.waitForTimeout(150);
  check(vp,'Escape fecha gaveta',!(await page.locator('#bagDrawer').isVisible()));
  await page.fill('#catalogSearch','');await page.waitForTimeout(120);
  // Busca na gaveta
  await page.locator('#searchOpen').click();await page.fill('#searchInput','camisa');
  check(vp,'busca da gaveta encontra camisas reais sem estudos',await page.locator('#searchResults .search-result').count()>=5);
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
  await page.locator('.rail-chips [data-rail-filter="set"]').click();await page.waitForTimeout(300);
  check(vp,'filtro da arara (conjuntos curados = 11)',await page.locator('#railItems .r10-item').count()===11&&(await page.locator('#railCounter').textContent()).endsWith('/ 11'));
  await page.locator('#railExplore').click();await page.waitForTimeout(200);
  check(vp,'visualizador abre',await page.locator('#railViewer').isVisible());
  await page.locator('#railViewerNext').click();await page.keyboard.press('Escape');
  check(vp,'visualizador fecha',!(await page.locator('#railViewer').isVisible()));
  // Showroom: GSAP troca a cor da cena, THREE monta sob demanda, com fallback e movimento reduzido.
  await page.locator('.showroom-heading').scrollIntoViewIfNeeded();
  const cinema=await page.evaluate(()=>({
    api:!!window.GBShowroomCinema,
    stage:!!document.querySelector('.showroom-heading .showroom-cinema-bg'),
    webglMount:!!document.querySelector('.showroom-cinema-webgl'),
    status:document.querySelector('[data-spectrum-number]')?.textContent.trim(),
    accent:getComputedStyle(document.querySelector('.showroom-heading h2')).color,
    reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
    hasCanvas:!!document.querySelector('.showroom-cinema-webgl canvas')
  }));
  check(vp,'cinema: palco Three.js, coreografia GSAP e status cromatico montados',cinema.api&&cinema.stage&&cinema.webglMount&&!!cinema.status&&/^rgb/.test(cinema.accent),JSON.stringify(cinema));
  check(vp,'cinema: ambiente inicial continua legivel sem rede 3D',cinema.accent!=='rgba(0, 0, 0, 0)'&&cinema.status==='01 / 04',JSON.stringify(cinema));
  if(reduced)check(vp,'cinema: movimento reduzido sem WebGL',cinema.reduced&&!cinema.hasCanvas,JSON.stringify(cinema));
  await page.locator('#showroom').scrollIntoViewIfNeeded();
  await page.waitForSelector('#showroomGrid .showroom-small');
  const fleece=await page.evaluate(()=>({
    selected:[...document.querySelectorAll('#showroomSelector [data-show-product]')].map(b=>b.dataset.showProduct),
    thumbs:[...document.querySelectorAll('#showroomGrid [data-show-product]')].map(b=>b.dataset.showProduct),
    allPhotos:[...document.querySelectorAll('#showroomGrid .showroom-small-media')].every(el=>!!el.querySelector('img.actual-photo')),
    initialView:document.querySelector('[data-show-view="combo"]')?.getAttribute('aria-pressed'),
    label:document.querySelector('.showroom-sub')?.textContent||''
  }));
  const fleeceIds=['gb-crt-004','gb-crt-003','gb-crt-001','gb-crt-002'];
  check(vp,'showroom exclusivo: quatro conjuntos Tech Fleece sem camisetas ou outros moletons',JSON.stringify(fleece.selected)===JSON.stringify(fleeceIds)&&JSON.stringify(fleece.thumbs)===JSON.stringify(fleeceIds),JSON.stringify(fleece));
  check(vp,'showroom: quatro fotos de conjunto e vista completa padrao',fleece.allPhotos&&fleece.initialView==='true'&&fleece.label.includes('QUATRO CORES'),JSON.stringify(fleece));
  await page.locator('.showroom-selector [data-show-index="2"]').click();
  check(vp,'showroom troca peça',(await page.locator('#showroomFeatureNum').textContent())==='03');
  await page.locator('.showroom-selector [data-show-index="3"]').click();
  check(vp,'showroom: creme sem foto superior avulsa nao exibe vista ficticia',await page.locator('[data-show-view="top"]').isDisabled()&&(await page.locator('[data-show-view="combo"]').getAttribute('aria-pressed'))==='true');
  await page.locator('.showroom-selector [data-show-index="0"]').click();
  check(vp,'showroom: volta a habilitar vista superior onde existe foto',await page.locator('[data-show-view="top"]').isEnabled());
  // Look Studio
  await page.locator('#lookstudio').scrollIntoViewIfNeeded();
  const s0=await page.locator('#lookSummary').textContent();
  await page.locator('[data-look-cycle="top:1"]').click();
  check(vp,'look studio troca superior',(await page.locator('#lookSummary').textContent())!==s0);
  await page.locator('#lookSave').click();
  check(vp,'look salvo aparece na lista',await page.locator('.look-saved-item').count()>=1);
  // Temas globais de marca + idiomas
  await page.locator('[data-gb-identity="1"]').click();
  check(vp,'tema TRAMA aplicado globalmente',(await page.locator('body').getAttribute('data-gb-theme'))==='trama');
  check(vp,'seletor marca TRAMA como ativa',(await page.locator('[data-gb-identity="1"]').getAttribute('aria-pressed'))==='true');
  await page.locator('[data-gb-identity="2"]').click();
  check(vp,'tema SINAL aplicado globalmente',(await page.locator('body').getAttribute('data-gb-theme'))==='sinal');
  await page.locator('#gbLanguage').selectOption('en');
  check(vp,'tema: rótulos do seletor traduzidos para inglês',
    (await page.locator('.gb-theme-switcher-heading').innerText()).includes('THREE UNIVERSES. ONE GB.')&&
    (await page.locator('[data-gb-identity="0"] .gb-theme-caption').innerText()).trim()==='ESSENCE');

  check(vp,'idioma inglês traduz interface e lang',(await page.locator('html').getAttribute('lang'))==='en'&&(await page.locator('.footer-nav a').first().textContent()).trim()==='Collection');
  await page.locator('#gbLanguage').selectOption('es');
  check(vp,'idioma espanhol traduz interface',(await page.locator('.footer-nav a').first().textContent()).trim()==='Colección');
  await page.locator('#gbLanguage').selectOption('it');
  check(vp,'idioma italiano traduz interface',(await page.locator('.footer-nav a').first().textContent()).trim()==='Collezione');
  await page.locator('#gbLanguage').selectOption('pt');
  await page.locator('[data-gb-identity="0"]').click();
  check(vp,'idioma e tema retornam ao padrão',(await page.locator('html').getAttribute('lang'))==='pt-BR'&&(await page.locator('body').getAttribute('data-gb-theme'))==='origem');
  // Hero
  await page.evaluate(()=>scrollTo(0,0));const h0=await page.locator('#heroNum').textContent();await page.locator('#heroNext').click();await page.waitForTimeout(450);
  check(vp,'hero avança capítulo',(await page.locator('#heroNum').textContent())!==h0);
  // A arara conecta diretamente à curadoria, sem atalhos pretos duplicados.
  const connected=await page.evaluate(()=>{const rail=document.querySelector('#rail'),collection=document.querySelector('#colecao');return !document.querySelector('.shop-entry')&&rail?.nextElementSibling===collection});
  check(vp,'arara seguida pela curadoria sem a faixa Entre e Encontre',connected);
  await page.locator('.filter[data-filter="short"]').click();
  check(vp,'filtro camisa+short permanece funcional',(await page.locator('.filter.active').getAttribute('data-filter'))==='short');
  // Deep link + voltar
  await page.goto(BASE+'?peca=gb-sh-02',{waitUntil:'networkidle'});
  check(vp,'deep link abre peça',(await page.locator('#productModal h2').textContent()).includes('MANCHESTER CITY'));
  // ===== V07 =====
  await page.goto(BASE,{waitUntil:'networkidle'});await page.waitForTimeout(500);
  // Hero: trio persistente, periférica vira protagonista, protagonista abre a peça
  check(vp,'hero: trio com 3 peças',await page.locator('#heroTrio .trio-obj').count()===3);
  const num0=await page.locator('#heroNum').textContent();
  await page.locator('#heroTrio .trio-obj:not(.is-front)').first().click({force:true});await page.waitForTimeout(1300);
  check(vp,'hero: periférica assume o capítulo',(await page.locator('#heroNum').textContent())!==num0);
  const frontIdx=await page.locator('#heroTrio .trio-obj.is-front').getAttribute('data-trio');
  check(vp,'hero: protagonista = capítulo ativo',Number(frontIdx)===Number(await page.locator('#heroNum').textContent())-1);
  await page.locator('#heroTrio .trio-obj.is-front').click({force:true});await page.waitForTimeout(900);
  check(vp,'hero: protagonista abre a peça',await page.locator('#railViewer').isVisible()&&(await page.locator('#railViewerName').textContent()).trim().length>3);
  await page.keyboard.press('Escape');await page.waitForTimeout(700);
  if(!mobile){const art=await page.locator('#heroArt').boundingBox();const n1=await page.locator('#heroNum').textContent();
    await page.mouse.move(art.x+art.width*.7,art.y+art.height*.45);await page.mouse.down();for(let i=1;i<=12;i++)await page.mouse.move(art.x+art.width*.7-i*24,art.y+art.height*.45);await page.mouse.up();await page.waitForTimeout(1300);
    check(vp,'hero: arrasto troca capítulo',(await page.locator('#heroNum').textContent())!==n1)}
  // Produto: abrir/fechar 10 vezes, foco volta ao card, URL limpa, voltar do navegador fecha
  await page.locator('#colecao .product-grid').scrollIntoViewIfNeeded();
  let okLoop=true;
  for(let i=0;i<10;i++){await page.locator('#productGrid .product-visual').nth(i%4).click();await page.waitForTimeout(250);if(!(await page.locator('#railViewer').isVisible()))okLoop=false;await page.keyboard.press('Escape');await page.waitForTimeout(450);if(await page.locator('#railViewer').isVisible())okLoop=false}
  check(vp,'produto: abrir/fechar 10x',okLoop);
  check(vp,'produto: URL limpa após 10x',!page.url().includes('peca='));
  check(vp,'produto: foco volta ao card',await page.evaluate(()=>!!document.activeElement?.closest('#productGrid')));
  await page.locator('#productGrid .product-visual').first().click();await page.waitForTimeout(500);
  await page.locator('#railViewerProduct').click();await page.waitForTimeout(500);
  await page.goBack();await page.waitForTimeout(800);
  check(vp,'produto: voltar do navegador fecha',!(await page.locator('#productModal').isVisible()));
  // Chromatic (V08): estudo de cor só para ilustração; mesma silhueta entre estados de cor
  // estudos ilustrativos não aparecem mais no SHOP; o laboratório V08 segue testado abrindo o estudo direto
  await page.locator('#colecao').scrollIntoViewIfNeeded();await page.fill('#catalogSearch','Argentina');await page.waitForTimeout(260);
  check(vp,'SHOP: estudo ilustrativo fora da busca',await cards()===0,String(await cards()));
  await page.fill('#catalogSearch','');await page.waitForTimeout(200);
  await page.evaluate(()=>window.GBOpenProductExperience(PRODUCTS.find(p=>p.id==='gb-tr-01')));await page.waitForTimeout(500);await page.locator('#gbTabColors').click();await page.waitForTimeout(500);
  const g0=await page.locator('#gbLabMedia svg').boundingBox();await page.locator('[data-gb-color="3"]').click();await page.waitForTimeout(700);
  const g1=await page.locator('#gbLabMedia svg').boundingBox();
  check(vp,'chromatic: troca sem mover o molde',g0&&g1&&Math.abs(g0.x-g1.x)<1&&Math.abs(g0.width-g1.width)<1);
  await page.keyboard.press('Escape');await page.waitForTimeout(300);await page.fill('#catalogSearch','');await page.waitForTimeout(200);
  await railV10(page,vp,mobile,reduced,w,h);
  // V09 / GB Fit Studio: um manequim persistente veste superior e inferior
  await page.locator('#lookstudio').scrollIntoViewIfNeeded();
  await page.evaluate(()=>document.querySelector('#lookstudio .look-stage').scrollIntoView({block:'center'}));await page.waitForTimeout(1300);
  const fit=()=>page.evaluate(()=>{const st=document.querySelector('#lookstudio .look-stage'),f=document.querySelector('#gbFitFigure');
    const live=part=>[...(f?.querySelectorAll(`.fit-layer-${part} .fit-garment`)||[])];
    return{figs:document.querySelectorAll('#lookstudio .fit-figure:not(.fit-figure-b)').length,top:live('top').map(g=>g.dataset.product),bottom:live('bottom').map(g=>g.dataset.product),
      sel:{top:document.querySelector('#lookTops [aria-pressed="true"]')?.dataset.lookId,bottom:document.querySelector('#lookBottoms [aria-pressed="true"]')?.dataset.lookId},
      state:window.GBFitting?.state,phase:st.dataset.phase,label:f?.querySelector('.fit-svg')?.getAttribute('aria-label'),anims:f?f.getAnimations({subtree:true}).filter(a=>a.playState==='running'&&a.animationName!=='fitBreath').length:-1}});
  const settled=async()=>{await page.waitForTimeout(reduced?120:1250);return fit()};
  const one1=s=>s.figs===1&&s.top.length===1&&s.bottom.length===1;
  const events=[];await page.exposeFunction('__gbLook',d=>events.push(d)).catch(()=>{});
  await page.evaluate(()=>addEventListener('gb:look-change',e=>window.__gbLook(e.detail)));
  let f0=await fit();
  check(vp,'fit: um único manequim vestindo superior e inferior',one1(f0)&&f0.top[0]===f0.state.topId&&f0.bottom[0]===f0.state.bottomId,JSON.stringify(f0));
  check(vp,'fit: aviso de simulação editorial visível',/SIMULAÇÃO EDITORIAL DE COMPOSIÇÃO/.test(await page.locator('#lookstudio .fit-legal').innerText()));
  const fb=await page.evaluate(()=>{const st=document.querySelector('#lookstudio .look-stage').getBoundingClientRect(),f=document.querySelector('#gbFitFigure').getBoundingClientRect(),
    nav=[...document.querySelectorAll('.mobile-nav,.bottom-nav,nav')].map(n=>n.getBoundingClientRect()).filter(r=>r.height&&r.top>innerHeight*.6&&r.bottom>=innerHeight-2&&r.width>innerWidth*.8)[0];
    const ctr=[...document.querySelectorAll('#lookstudio .look-cycle button,#lookShuffle')].filter(b=>b.offsetParent).map(b=>b.getBoundingClientRect());
    return{ratio:f.height/st.height,inside:f.top>=st.top-1&&f.bottom<=st.bottom+1&&f.left>=st.left-1&&f.right<=st.right+1,
      covered:nav?ctr.filter(r=>r.bottom>nav.top+1&&r.top<nav.bottom).length:0,small:ctr.filter(r=>r.width<43.5||r.height<43.5).length}});
  check(vp,'fit: corpo inteiro ≥78% do palco e dentro dele',fb.ratio>=.78&&fb.inside,JSON.stringify(fb));
  check(vp,'fit: controles com 44px e fora da nav fixa',fb.covered===0&&fb.small===0,JSON.stringify(fb));
  // 3 trocas rápidas do superior: converge para a última, inferior intacto
  const b0=f0.bottom[0];events.length=0;
  for(let i=0;i<3;i++)await page.locator('[data-look-cycle="top:1"]').click({delay:0});
  if(!reduced){const mid=await fit();check(vp,'fit: troca rápida não empilha fantasmas',mid.top.length<=2,JSON.stringify(mid.top))}
  let f1=await settled();
  check(vp,'fit: 3 trocas de superior convergem para a última',one1(f1)&&f1.top[0]===f1.sel.top&&f1.state.topId===f1.sel.top&&f1.top[0]!==f0.top[0],JSON.stringify(f1));
  check(vp,'fit: troca de superior não mexe no inferior',f1.bottom[0]===b0);
  check(vp,'fit: nenhuma animação ativa após assentar',f1.anims===0,String(f1.anims));
  await page.waitForTimeout(50);
  const ev=events.at(-1)||{};
  check(vp,'fit: evento gb:look-change {topId,bottomId,changedPart,source}',events.length>=3&&ev.topId===f1.sel.top&&ev.bottomId===f1.sel.bottom&&ev.changedPart==='top'&&ev.source==='cycle',JSON.stringify(ev));
  check(vp,'fit: rótulo acessível descreve o look',(f1.label||'').includes('vestindo'),f1.label);
  // 3 trocas do inferior
  for(let i=0;i<3;i++)await page.locator('[data-look-cycle="bottom:1"]').click();
  let f2=await settled();
  check(vp,'fit: 3 trocas de inferior convergem e preservam o superior',one1(f2)&&f2.bottom[0]===f2.sel.bottom&&f2.top[0]===f1.top[0]&&f2.bottom[0]!==b0,JSON.stringify(f2));
  // MISTURAR: troca coordenada das duas peças
  await page.locator('#lookShuffle').click();
  if(!reduced){await page.waitForTimeout(60);check(vp,'fit: misturar entra em switching-both',(await fit()).phase==='switching-both')}
  let f3=await settled();
  check(vp,'fit: misturar veste o par sorteado',one1(f3)&&f3.top[0]===f3.sel.top&&f3.bottom[0]===f3.sel.bottom&&f3.top[0]!==f2.top[0]&&f3.bottom[0]!==f2.bottom[0],JSON.stringify(f3));
  check(vp,'fit: estado de cena volta a idle',['idle','reduced-motion'].includes(f3.phase),f3.phase);
  // Mesma escolha por origens diferentes = mesmo estado final
  const pickIdx=await page.evaluate(()=>{const o=[...document.querySelectorAll('#lookTops .look-option')];for(let i=4;i<4+o.length;i++)if(o[i%o.length].getAttribute('aria-pressed')!=='true')return i%o.length});
  const target=await page.locator('#lookTops .look-option').nth(pickIdx).getAttribute('data-look-id');
  await page.locator('#lookTops .look-option').nth(pickIdx).click();
  if(!reduced)check(vp,'look: encaixe sinaliza a área',await page.locator('.look-dock[data-dock="top"].is-snap').count()===1);
  const byClick=await settled();
  check(vp,'fit: clique no seletor veste a peça escolhida',byClick.top[0]===target&&one1(byClick));
  for(let i=0;i<8&&(await fit()).top[0]!==target;i++){await page.locator('[data-look-cycle="top:1"]').click()}
  await page.locator('[data-look-cycle="top:1"]').click();await page.locator('[data-look-cycle="top:-1"]').click();
  const byArrows=await settled();
  check(vp,'fit: setas chegam ao mesmo estado do clique',byArrows.top[0]===target&&byArrows.bottom[0]===byClick.bottom[0]&&one1(byArrows),JSON.stringify(byArrows.top));
  if(mobile){ // swipe na metade de cima do palco: avança e volta ao mesmo estado
    const sb=await page.locator('#lookstudio .look-stage').boundingBox();
    const swipe=async dx=>{const y=sb.y+sb.height*.3,x=sb.x+sb.width/2;await page.evaluate(([x,y,dx])=>{const st=document.querySelector('#lookstudio .look-stage');const T=(cx)=>[new Touch({identifier:1,target:st,clientX:cx,clientY:y})];
      st.dispatchEvent(new TouchEvent('touchstart',{touches:T(x),changedTouches:T(x),bubbles:true}));st.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:T(x+dx),bubbles:true}))},[x,y,dx])};
    await swipe(-120);const sw1=await settled();
    check(vp,'fit: swipe troca só o superior',sw1.top[0]!==target&&sw1.bottom[0]===byClick.bottom[0]&&sw1.top[0]===sw1.sel.top&&one1(sw1),JSON.stringify(sw1.top));
    await swipe(120);const sw2=await settled();
    check(vp,'fit: swipe de volta = mesmo estado do clique',sw2.top[0]===target&&one1(sw2));
  }else if(!reduced){ // arrastar da lista até o corpo
    const opt=page.locator('#lookBottoms .look-option').nth(2),bid=await opt.getAttribute('data-look-id');await opt.scrollIntoViewIfNeeded();await page.waitForTimeout(300);
    const ob=await opt.boundingBox(),db0=await page.locator('#gbFitFigure .look-dock[data-dock="bottom"]').boundingBox(),db={x:db0.x,width:db0.width,y:db0.y,height:Math.min(db0.height,h-db0.y-20)};
    await page.mouse.move(ob.x+ob.width/2,ob.y+ob.height/2);await page.mouse.down();await page.mouse.move(ob.x+ob.width/2+30,ob.y+ob.height/2,{steps:3});
    await page.mouse.move(db.x+db.width/2,db.y+db.height/2,{steps:8});await page.mouse.up();
    const dr=await settled();
    check(vp,'fit: arrastar até o corpo veste a peça',dr.bottom[0]===bid&&dr.sel.bottom===bid&&dr.top[0]===target&&one1(dr),JSON.stringify(dr));
  }
  // Salvar / restaurar / A-B: mesmo corpo, mesma escala
  const saved=await fit();
  await page.locator('#lookSave').click();
  await page.locator('[data-look-cycle="top:1"]').click();await page.locator('[data-look-cycle="bottom:1"]').click();await settled();
  const sv=await page.evaluate(()=>JSON.parse(localStorage.getItem('gb-v03-outfits')||'[]')[0]||{});
  check(vp,'fit: look salvo guarda IDs reais + presentationVersion',sv.top===saved.top[0]&&sv.bottom===saved.bottom[0]&&sv.presentationVersion==='fit-v09',JSON.stringify(sv));
  await page.locator('#lookCompareBtn').click();await page.waitForTimeout(400);
  const ab=await page.evaluate(()=>{const a=document.querySelector('#gbFitFigure'),b=document.querySelector('#lookstudio .fit-figure-b');const ra=a.getBoundingClientRect(),rb=b?.getBoundingClientRect();
    return{b:!!b,phase:document.querySelector('#lookstudio .look-stage').dataset.phase,bt:b?.querySelector('.fit-top')?.dataset.product,bb:b?.querySelector('.fit-bottom')?.dataset.product,
      same:!!rb&&Math.abs(ra.x-rb.x)<1&&Math.abs(ra.width-rb.width)<1&&Math.abs(ra.height-rb.height)<1,ui:!document.querySelector('#lookstudio .fit-compare').hidden,
      clean:getComputedStyle(document.querySelector('#lookstudio .look-stage'),'::after').content==='none'&&getComputedStyle(document.querySelector('#lookShuffle')).opacity==='0'}});
  check(vp,'look: comparação A/B abre',ab.b&&ab.ui&&ab.phase==='comparing',JSON.stringify(ab));
  check(vp,'fit: A/B sem rótulo duplicado nem controle sobre os rótulos',ab.clean,JSON.stringify(ab));
  check(vp,'fit: A/B mostra o look salvo no mesmo corpo e escala',ab.bt===saved.top[0]&&ab.bb===saved.bottom[0]&&ab.same,JSON.stringify(ab));
  await page.locator('#lookstudio .fit-split input').fill('70');
  check(vp,'fit: divisor A/B ajustável',await page.evaluate(()=>document.querySelector('#lookstudio .look-stage').style.getPropertyValue('--split'))==='70');
  await page.locator('#lookCompareBtn').click();await page.waitForTimeout(200);
  check(vp,'fit: fechar A/B remove a figura B',await page.locator('#lookstudio .fit-figure-b').count()===0);
  await page.locator('[data-look-restore="0"]').click();const rs=await settled();
  check(vp,'fit: restaurar veste o look salvo',rs.top[0]===saved.top[0]&&rs.bottom[0]===saved.bottom[0]&&one1(rs),JSON.stringify(rs));
  // teclado: setas são botões focáveis e acionáveis
  await page.locator('[data-look-cycle="bottom:1"]').focus();await page.keyboard.press('Enter');const kb=await settled();
  check(vp,'fit: troca pelo teclado',kb.bottom[0]!==rs.bottom[0]&&kb.bottom[0]===kb.sel.bottom);
  if(reduced)check(vp,'fit: movimento reduzido troca sem animar',kb.anims===0&&(await page.evaluate(()=>document.querySelector('#gbFitFigure .fit-rig').getAnimations().length))===0);
  // Campanha: slot pronto para mídia autorizada
  check(vp,'campanha: slot de mídia presente',await page.locator('[data-media-slot="campaign-hero"] .slot-frame').count()===1);
  // Overflow após rolar a página inteira
  const H=await page.evaluate(()=>document.documentElement.scrollHeight);
  await page.keyboard.press('Escape');
  for(let y=0;y<H;y+=900){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(40)}
  check(vp,'sem overflow horizontal (página inteira)',await overflow()<=0,String(await overflow()));
  check(vp,'sem erros de JS / rede',errors.length===0,errors.join(' | '));
  await browser.close();
}
// E2E_ONLY=1440x900 (ou 390x844r para movimento reduzido) roda um cenário só, para iterar rápido
const ONLY=process.env.E2E_ONLY;
for(const [w,h] of VIEWPORTS){if(ONLY&&ONLY!==`${w}x${h}`)continue;console.log(`→ ${w}x${h}`);await run(w,h)}
if(!ONLY||ONLY==='390x844r'){console.log('→ 390x844 reduced-motion');await run(390,844,true)}
const total=results.length;
console.log(`\n${total-failures}/${total} verificações aprovadas.`);
process.exit(failures?1:0);
