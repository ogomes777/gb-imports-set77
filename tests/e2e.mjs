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
  page.on('requestfailed',r=>{const url=r.url();if(optionalCDN(url))optionalFailures.push(url);else if(!url.includes('fonts.g'))errors.push('requestfailed '+url+' '+(r.failure()?.errorText||''))});
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
  await page.waitForFunction(()=>document.querySelector('#wishCount')?.textContent==='1',null,{timeout:3000}).catch(()=>{});   // espera o efeito, não um tempo fixo
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
  check(vp,'cinema: ambiente inicial continua legivel sem rede 3D',cinema.accent!=='rgba(0, 0, 0, 0)'&&cinema.status==='GB / 03',JSON.stringify(cinema));
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
  // Tema claro/escuro (V11.2: sol/lua na ilha; claro = ORIGEM, escuro = SINAL, vale para a página inteira)
  const toDark=async v=>{if(((await page.locator('body').getAttribute('data-gb-theme'))==='sinal')!==v){await page.locator('#gbThemeToggle').click();await page.waitForTimeout(600)}};
  await toDark(true);
  check(vp,'tema escuro aplicado globalmente',(await page.locator('body').getAttribute('data-gb-theme'))==='sinal'&&(await page.locator('#gbThemeToggle').getAttribute('aria-checked'))==='true');
  const darkBg=await page.evaluate(()=>['#rail','#lookstudio'].map(s=>getComputedStyle(document.querySelector(s)).backgroundColor));
  check(vp,'tema escuro cobre arara e Look Studio',darkBg.every(c=>{const m=c.match(/\d+/g).map(Number);return (m[0]+m[1]+m[2])/3<60}),JSON.stringify(darkBg));
  await toDark(false);
  check(vp,'tema claro aplicado globalmente',(await page.locator('body').getAttribute('data-gb-theme'))==='origem'&&(await page.locator('#gbThemeToggle').getAttribute('aria-checked'))==='false');
  await toDark(true);
  await page.locator('#gbLanguage').selectOption('en');
  check(vp,'idioma inglês traduz interface e lang',(await page.locator('html').getAttribute('lang'))==='en'&&(await page.locator('.footer-nav a').first().textContent()).trim()==='Collection');
  await page.locator('#gbLanguage').selectOption('es');
  check(vp,'idioma espanhol traduz interface',(await page.locator('.footer-nav a').first().textContent()).trim()==='Colección');
  await page.locator('#gbLanguage').selectOption('it');
  check(vp,'idioma italiano traduz interface',(await page.locator('.footer-nav a').first().textContent()).trim()==='Collezione');
  await page.locator('#gbLanguage').selectOption('pt');
  await toDark(false);
  check(vp,'idioma e tema retornam ao padrão',(await page.locator('html').getAttribute('lang'))==='pt-BR'&&(await page.locator('body').getAttribute('data-gb-theme'))==='origem');
  // Faixas de categorias entre o hero e a arara: dois sentidos, clique filtra o catálogo
  const mqInfo=await page.evaluate(()=>({rows:document.querySelectorAll('#gbMarquee .gb-mq-row').length,chips:document.querySelectorAll('#gbMarquee .gb-mq-chip:not([tabindex="-1"])').length}));
  check(vp,'faixas: duas linhas com categorias reais',mqInfo.rows===2&&mqInfo.chips>=10,JSON.stringify(mqInfo));
  await page.evaluate(()=>{const m=document.getElementById('gbMarquee');scrollTo({top:m.getBoundingClientRect().top+scrollY-innerHeight/2+m.offsetHeight/2,behavior:'instant'})});await page.waitForTimeout(200);
  // a faixa anda: pausa sob o ponteiro e clica numa cópia de "boné" que esteja na tela (sem ela, dispara no próprio chip)
  const mqRow=await page.locator('#gbMarquee .gb-mq-chip[data-mq-term="boné"]').first().evaluate(a=>{const r=a.closest('.gb-mq-row').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}});
  if(!mobile){await page.mouse.move(mqRow.x,mqRow.y);await page.waitForTimeout(250)}
  const mqHit=await page.evaluate(()=>{for(const a of document.querySelectorAll('#gbMarquee .gb-mq-chip[data-mq-term="boné"]')){const r=a.getBoundingClientRect();if(r.left>=8&&r.right<=innerWidth-8&&r.top>=110&&r.bottom<=innerHeight-8&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.gb-mq-chip')===a)return{x:r.x+r.width/2,y:r.y+r.height/2}}return null});
  if(mqHit&&!mobile)await page.mouse.click(mqHit.x,mqHit.y);else await page.locator('#gbMarquee .gb-mq-chip[data-mq-term="boné"]').first().dispatchEvent('click');
  await page.waitForTimeout(500);
  const mqRes={q:await page.locator('#catalogSearch').inputValue(),n:await page.locator('#productGrid .product-visual').count(),hit:!!mqHit};
  check(vp,'faixas: clicar na categoria filtra o catálogo',mqRes.q==='boné'&&mqRes.n>0,JSON.stringify(mqRes));
  await page.locator('#catalogSearch').fill('');await page.waitForTimeout(300);
  // V15 — THE ENCOUNTER: o palco do editorial é só de Gui e Vitin (o carrossel de peças saiu); eles entram e se cumprimentam
  await page.evaluate(()=>{const e=document.querySelector('#editorial'),r=e.getBoundingClientRect();scrollTo({top:r.top+scrollY+(innerWidth<900?Math.max(0,r.height-innerHeight):0),behavior:'instant'})});
  await page.waitForFunction(()=>document.querySelector('.editorial-model')?.classList.contains('gbe-done'),null,{timeout:20000});
  const enc=await page.evaluate(()=>{const R=s=>{const r=document.querySelector(s).getBoundingClientRect();return{l:r.left,t:r.top,r:r.right,b:r.bottom}};
    const imgs=[...document.querySelectorAll('.gbe img')],g=R('.gbe-char.is-gui .gbe-base'),v=R('.gbe-char.is-vitin .gbe-base'),S=R('#editorial');
    const txt=['.editorial-copy h2','.editorial-copy p','.editorial-link'].map(R),hit=(a,b)=>a.l<b.r-1&&a.r>b.l+1&&a.t<b.b-1&&a.b>b.t+1;
    return{n:document.querySelectorAll('.gbe-body img').length,loaded:imgs.every(i=>i.complete&&i.naturalWidth>0),taller:(g.b-g.t)>(v.b-v.t)*1.04,over:txt.some(t=>hit(t,g)||hit(t,v)),inside:[g,v].every(x=>x.l>=S.l-1&&x.r<=S.r+1&&x.t>=S.t-1&&x.b<=S.b+1),
      carousel:!!document.querySelector('.gbc,#gbpView,[data-gbe]'),photo:getComputedStyle(document.getElementById('editorialProduct')).visibility,
      tag:document.querySelector('.gbe-tag')?.textContent.includes('GUI × VITIN')}});
  check(vp,'encontro: só Gui e Vitin no palco, Gui mais alto, sem cobrir texto nem cortar',enc.n===4&&enc.loaded&&enc.taller&&!enc.over&&enc.inside&&enc.tag&&!enc.carousel&&enc.photo==='hidden',JSON.stringify(enc));
  await page.locator('.gbe-replay').click();
  if(!reduced){
    // o cumprimento é articulado: a mão do Gui gira no pulso e a cabeça do Vitin acena; o resto do desenho não deforma
    const gr=await page.evaluate(()=>{const k=s=>document.querySelector(s).getAnimations().flatMap(a=>a.effect.getKeyframes().map(f=>f.transform||''));
      return{playing:document.querySelector('.gbe').classList.contains('is-playing'),hand:k('.gbe-hand').some(t=>/rotate\((2\d|3\d)/.test(t)),head:k('.gbe-head').some(t=>/rotate\([4-6]/.test(t)),
        pivots:[...document.querySelectorAll('.gbe-part')].map(i=>i.style.transformOrigin)}});
    check(vp,'encontro: REVER roda o cumprimento (mão do Gui no pulso, aceno do Vitin)',gr.playing&&gr.hand&&gr.head&&gr.pivots.every(Boolean),JSON.stringify(gr));
  }
  await page.waitForFunction(()=>document.querySelector('.editorial-model').classList.contains('gbe-done'),null,{timeout:15000});
  const idle=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest?.('.gbe')).length);
  check(vp,'encontro: terminou, nada fica animando',idle===0,String(idle));
  // V13 — cursor sempre o do sistema; lupa só com mouse (toque e movimento reduzido ficam sem)
  const cine=await page.evaluate(()=>({grain:!!document.querySelector('.gb-grain'),custom:!!document.querySelector('.gb-cur-ring,.gb-cur-dot')||getComputedStyle(document.body).cursor==='none',loupe:!!document.querySelector('.gb-loupe')}));
  check(vp,'cinema: grão presente, cursor do sistema, lupa só com mouse',cine.grain&&!cine.custom&&cine.loupe===(!mobile&&!reduced),JSON.stringify(cine));
  if(!mobile&&!reduced){
    await page.locator('#productGrid .product-visual').first().click();await page.waitForTimeout(900);
    const fig=page.locator('#railViewer .hg-fig img').first();
    if(await fig.count()){const sb=await fig.boundingBox();
      await page.mouse.move(sb.x+sb.width/2,sb.y+sb.height/2,{steps:4});await page.waitForTimeout(250);
      const lp=await page.evaluate(()=>{const l=document.querySelector('.gb-loupe'),i=l.querySelector('img'),s=document.querySelector('#railViewer .hg-fig img');return{on:l.classList.contains('is-on'),same:!!s&&i.src===(s.currentSrc||s.src)}});
      await page.mouse.move(5,5);
      check(vp,'cinema: lupa amplia a própria foto da peça',lp.on&&lp.same,JSON.stringify(lp))}
    else check(vp,'cinema: viewer com foto para a lupa',false,'sem .hg-fig img');
    await page.keyboard.press('Escape');await page.waitForTimeout(600);
  }
  // V14 — filme: letreiros por linha (luz que varre a linha) que esperam o muro do capítulo; cartela final com o monograma SVG
  const film=await page.evaluate(()=>({split:['.rail-title-row h2','.category-intro h2','.editorial-break-hero h2'].map(s=>!!document.querySelector(s)?.classList.contains('split-ready')),end:!!document.querySelector('.footer .gbf-end img[src*="gb-monograma"]'),txt:document.querySelector('.editorial-break-hero h2')?.textContent.replace(/\s+/g,'')}));
  check(vp,'filme: letreiros nos títulos e cartela final com monograma',film.end&&film.txt==='SEUPRÓXIMOCAPÍTULO.'&&film.split.every(x=>x===!reduced),JSON.stringify(film));
  if(!reduced){await page.locator('#categorias .category-intro h2').scrollIntoViewIfNeeded();await page.waitForTimeout(3200);
    const fh=await page.evaluate(()=>{const h=document.querySelector('#categorias .category-intro h2');return{inn:h.classList.contains('lines-in'),hold:h.classList.contains('gbf-hold')}});
    check(vp,'filme: letreiro roda e não fica preso atrás do muro',fh.inn&&!fh.hold,JSON.stringify(fh))}
  // Hero
  await page.evaluate(()=>scrollTo(0,0));const h0=await page.locator('#heroNum').textContent();await page.locator('#heroNext').click();
  await page.waitForFunction(h=>document.querySelector('#heroNum')?.textContent!==h,h0,{timeout:3000}).catch(()=>{});   // espera o efeito, não um tempo fixo
  check(vp,'hero avança capítulo',(await page.locator('#heroNum').textContent())!==h0);
  // A arara conecta diretamente à curadoria, sem atalhos pretos duplicados.
  const connected=await page.evaluate(()=>{const rail=document.querySelector('#rail'),collection=document.querySelector('#colecao');return !document.querySelector('.shop-entry')&&rail?.nextElementSibling===collection});
  check(vp,'arara seguida pela curadoria sem a faixa Entre e Encontre',connected);
  await page.locator('.filter[data-filter="short"]').click();
  check(vp,'filtro camisa+short permanece funcional',(await page.locator('.filter.active').getAttribute('data-filter'))==='short');
  // o filtro começa a carregar as capas; recarregar antes da rede assentar abortaria essas imagens
  await page.waitForFunction(()=>[...document.querySelectorAll('#productGrid img')].every(i=>i.complete),null,{timeout:8000}).catch(()=>{});
  await page.waitForLoadState('networkidle').catch(()=>{});
  // o provador (V16) baixa as fotos reais do look inicial; navegar antes abortaria essas imagens
  await page.evaluate(()=>window.GBFitting?.ready?.()).catch(()=>{});
  // Deep link + voltar
  await page.goto(BASE+'?peca=gb-sh-02',{waitUntil:'networkidle'});
  check(vp,'deep link abre peça',(await page.locator('#productModal h2').textContent()).includes('MANCHESTER CITY'));
  // ===== V07 =====
  await page.goto(BASE,{waitUntil:'networkidle'});await page.waitForTimeout(500);
  // a entrada do hero (V06) e a abertura em blocos (V12) terminam antes de interagir com o anel
  await page.waitForFunction(()=>!document.body.classList.contains('gb-intro')&&!document.querySelector('.gb-intro'),null,{timeout:6000}).catch(()=>{});
  // Hero: trio persistente, periférica vira protagonista, protagonista abre a peça
  check(vp,'hero: trio com 3 peças',await page.locator('#heroTrio .trio-obj').count()===3);
  const num0=await page.locator('#heroNum').textContent();
  // o trio gira sem parar e, no celular, a peça da frente cobre parte das laterais: toca onde a lateral está à vista (como uma pessoa faria)
  const side=await page.evaluate(()=>{for(const o of document.querySelectorAll('#heroTrio .trio-obj:not(.is-front)')){const r=o.getBoundingClientRect();
    for(const fy of [.4,.3,.5,.6,.25,.7])for(const fx of [.5,.3,.7,.2,.8]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if(x<2||x>innerWidth-2||y<2||y>innerHeight-2)continue;
      if(document.elementFromPoint(x,y)?.closest('.trio-obj')===o)return{x,y,id:+o.dataset.trio}}}return null});
  if(side)await page.mouse.click(side.x,side.y);else await page.locator('#heroTrio .trio-obj:not(.is-front)').first().click({force:true});
  // o anel também troca de capítulo sozinho: o que vale é a peça TOCADA virar a protagonista (não só "o número mudou")
  const want=side?String(side.id+1).padStart(2,'0'):null;
  // espera o número E o anel assentarem na peça tocada (a classe is-front segue a mola do giro)
  if(want)await page.waitForFunction(w=>document.querySelector('#heroNum')?.textContent===w&&document.querySelector('#heroTrio .trio-obj.is-front')?.dataset.trio===String(+w-1),want,{timeout:3000}).catch(()=>{});else await page.waitForTimeout(1300);
  const numNow=await page.locator('#heroNum').textContent();
  check(vp,'hero: periférica assume o capítulo',want?numNow===want:numNow!==num0,JSON.stringify({num0,want,numNow}));
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
  const settled=async()=>{await page.waitForTimeout(reduced?120:1700);return fit()};  // V18: a peça é arremessada do seletor antes de vestir
  const one1=s=>s.figs===1&&s.top.length===1&&s.bottom.length===1;
  const events=[];await page.exposeFunction('__gbLook',d=>events.push(d)).catch(()=>{});
  await page.evaluate(()=>addEventListener('gb:look-change',e=>window.__gbLook(e.detail)));
  let f0=await fit();
  check(vp,'fit: um único manequim vestindo superior e inferior',one1(f0)&&f0.top[0]===f0.state.topId&&f0.bottom[0]===f0.state.bottomId,JSON.stringify(f0));
  check(vp,'fit: aviso de simulação editorial visível',/SIMULAÇÃO EDITORIAL DE COMPOSIÇÃO/.test(await page.locator('#lookstudio .fit-legal').innerText()));
  // V16 / FIT REAL: só peças reais do acervo; manga curta desce no ombro com o braço saindo dela; corpo completo
  const real=await page.evaluate(async()=>{const C=window.GB_FIT_CATALOG,f=document.querySelector('#gbFitFigure');
    const hrefs=[...f.querySelectorAll('image.fit-photo')].map(i=>i.getAttribute('href'));
    const ok=(await Promise.all(hrefs.map(h=>{const i=new Image();i.src=h;return i.decode().then(()=>i.naturalWidth>0,()=>false)}))).every(Boolean);
    return{n:Object.keys(C.top).length+Object.keys(C.bottom).length,opts:document.querySelectorAll('#lookTops .look-option,#lookBottoms .look-option').length,
      thumbs:[...document.querySelectorAll('#lookTops .look-option img,#lookBottoms .look-option img')].every(i=>/assets\/fit\/thumb\//.test(i.getAttribute('src'))),
      hrefs:hrefs.length&&hrefs.every(h=>/^\.\/assets\/fit\//.test(h)),ok,head:!!f.querySelector('.fit-head'),hands:f.querySelectorAll('.fit-layer-arms .fit-hand').length,
      legs:f.querySelectorAll('.fit-layer-legs .fit-leg').length}});
  check(vp,'fit V16: seletores e manequim só com fotos reais do acervo (assets/fit)',real.opts===real.n&&real.thumbs&&real.hrefs&&real.ok,JSON.stringify(real));
  check(vp,'fit V16: robô completo — cabeça, duas mãos, duas pernas',real.head&&real.hands===2&&real.legs===2,JSON.stringify(real));
  const tee=await page.evaluate(async()=>{const C=window.GB_FIT_CATALOG,id=Object.keys(C.top).find(k=>C.top[k].rig?.l&&C.top[k].rig?.r);
    document.querySelector(`#lookTops [data-look-id="${id}"]`).click();await new Promise(r=>setTimeout(r,1800));const f=document.querySelector('#gbFitFigure');
    const sl=[...f.querySelectorAll('.fit-layer-sleeves .fit-sleeves image')].map(i=>i.getAttribute('transform')||'');
    return{id,state:GBFitting.state.topId,sl,arms:f.querySelectorAll('.fit-layer-arms .fit-limbs').length,hands:f.querySelectorAll('.fit-layer-arms .fit-hand').length,
      leftovers:f.querySelectorAll('.fit-layer-sleeves .fit-sleeves').length}});
  check(vp,'fit V16: manga curta = duas mangas da própria foto giradas no ombro + braços',tee.state===tee.id&&tee.sl.length===2&&tee.sl.every(t=>/rotate\(-?[1-9]/.test(t))&&tee.arms===1&&tee.hands===2&&tee.leftovers===1,JSON.stringify(tee));
  // V17: tênis e boné reais; "sem" volta à bota GB / cabeça livre; pescoço sai da gola medida
  const acc=await page.evaluate(async()=>{const C=window.GB_FIT_CATALOG,wait=ms=>new Promise(r=>setTimeout(r,ms)),f=document.querySelector('#gbFitFigure');
    const opt=(box,id)=>document.querySelector(`#${box} [data-look-id="${id}"]`);
    const shoes=document.querySelectorAll('#lookShoes .look-option').length,caps=document.querySelectorAll('#lookCaps .look-option').length;
    const s1=Object.keys(C.shoe)[3],c1=Object.keys(C.cap)[1];
    opt('lookShoes',s1).click();await wait(80);opt('lookCaps',c1).click();await wait(1800);
    const worn={state:{...GBFitting.state},shoe:f.querySelector('.fit-layer-shoe .fit-shoe')?.dataset.product,shoeImgs:f.querySelectorAll('.fit-layer-shoe image.fit-photo').length,
      cap:f.querySelector('.fit-layer-cap .fit-cap')?.dataset.product,boots:f.querySelectorAll('.fit-layer-legs .fit-leg').length,legsShoe:f.querySelector('.fit-layer-legs .fit-legs')?.dataset.shoe,
      summary:document.querySelector('#lookSummary').textContent,neck:f.querySelectorAll('.fit-layer-neck .fit-neck').length,kind:f.dataset.kind};
    opt('lookShoes','').click();await wait(80);opt('lookCaps','').click();await wait(1800);
    const off={state:{...GBFitting.state},shoe:f.querySelectorAll('.fit-layer-shoe .fit-shoe').length,cap:f.querySelectorAll('.fit-layer-cap .fit-cap').length,legsShoe:f.querySelector('.fit-layer-legs .fit-legs')?.dataset.shoe,legs:f.querySelectorAll('.fit-layer-legs .fit-legs').length};
    return{shoes,caps,nShoe:Object.keys(C.shoe).length,nCap:Object.keys(C.cap).length,s1,c1,worn,off}});
  check(vp,'fit V17: seletores de tênis e boné = acervo real + opção "sem" (+ capuz)',acc.shoes===acc.nShoe+1&&acc.caps===acc.nCap+2&&acc.nShoe>=10&&acc.nCap>=4,JSON.stringify(acc));
  check(vp,'fit V17: veste tênis (dois pés reais) e boné, pernas entram no tênis',acc.worn.state.shoeId===acc.s1&&acc.worn.state.capId===acc.c1&&acc.worn.shoe===acc.s1&&acc.worn.shoeImgs===2&&acc.worn.cap===acc.c1&&acc.worn.legsShoe===acc.s1&&/\+.*\+/.test(acc.worn.summary),JSON.stringify(acc.worn));
  check(vp,'fit V17: pescoço por cima da peça, saindo da gola',acc.worn.neck===1,JSON.stringify(acc.worn));
  check(vp,'fit V17: "sem tênis / sem boné" tira as peças sem sobrar camada',acc.off.state.shoeId===null&&acc.off.state.capId===null&&acc.off.shoe===0&&acc.off.cap===0&&acc.off.legs===1&&!acc.off.legsShoe,JSON.stringify(acc.off));
  // V18: giro (esquerda · frente · direita) com tênis virando; capuz na cabeça; arremesso + hélice
  const v18=await page.evaluate(async([red])=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),f=document.querySelector('#gbFitFigure'),C=window.GB_FIT_CATALOG;
    const shoe=Object.keys(C.shoe)[0];GBFitting.set({shoeId:shoe},{silent:true});await wait(1800);
    const sg=()=>f.querySelector('.fit-layer-shoe .fit-shoe'),sc=()=>[sg().style.getPropertyValue('--fl'),sg().style.getPropertyValue('--fr')].map(Number);
    const front=sc();GBFitting.turn(-1);await wait(red?150:1300);const left={yaw:GBFitting.yaw,dir:f.dataset.dir,sc:sc()};
    GBFitting.turn(1);await wait(red?150:1300);const right={yaw:GBFitting.yaw,dir:f.dataset.dir,sc:sc()};
    document.querySelector('[data-fit-turn="0"]').click();await wait(red?150:1300);const back={yaw:GBFitting.yaw,dir:f.dataset.dir};
    const hoodie=Object.keys(C.top).find(k=>C.top[k].hood);document.querySelector(`#lookTops [data-look-id="${hoodie}"]`).click();await wait(1900);
    const hb=document.querySelector('[data-look-hood]');const enabled=!!hb&&!hb.disabled;hb?.click();await wait(1200);
    const hood={enabled,state:GBFitting.state.hood,attr:f.dataset.hood,front:f.querySelectorAll('.fit-layer-hood .fit-hood-front').length,capHidden:getComputedStyle(f.querySelector('.fit-layer-cap')).display==='none'};
    const firstCap=document.querySelector('#lookCaps [data-look-id]:not([data-look-id=""])');firstCap.click();await wait(1500);
    const capBack={hood:GBFitting.state.hood,attr:f.dataset.hood,cap:GBFitting.state.capId};
    const tee=Object.keys(C.top).find(k=>!C.top[k].hood);const btn=document.querySelector(`#lookTops [data-look-id="${tee}"]`);btn.scrollIntoView({block:'nearest',inline:'nearest'});btn.click();await wait(140);
    const fly=[...document.querySelectorAll('.fit-fly')].some(n=>n.getAnimations().length),helix=!!f.querySelector('.fit-scan .fit-helix path');await wait(1800);
    return{front,left,right,back,hood,capBack,fly,helix,top:GBFitting.state.topId===tee}},[reduced]);
  check(vp,'fit V18: girar para a esquerda/direita vira os dois tênis; de frente ficam em V',v18.left.dir==='L'&&v18.right.dir==='R'&&v18.back.dir==='F'&&Math.abs(v18.left.yaw+1)<.02&&Math.abs(v18.right.yaw-1)<.02&&Math.abs(v18.back.yaw)<.02&&
    v18.left.sc[0]===v18.left.sc[1]&&v18.right.sc[0]===v18.right.sc[1]&&v18.left.sc[0]===-v18.right.sc[0]&&Math.sign(v18.front[0])===-Math.sign(v18.front[1])&&Math.abs(v18.front[0])<1,JSON.stringify(v18));
  check(vp,'fit V18: capuz na cabeça (moletom com capuz) tira o boné; escolher boné baixa o capuz',v18.hood.enabled&&v18.hood.state===true&&v18.hood.attr==='up'&&v18.hood.front===1&&v18.hood.capHidden&&v18.capBack.hood===false&&v18.capBack.attr==='down'&&!!v18.capBack.cap,JSON.stringify(v18.hood)+JSON.stringify(v18.capBack));
  check(vp,'fit V18: a peça é arremessada do seletor e a hélice de DNA varre o corpo',v18.top&&v18.helix&&(reduced?!v18.fly:v18.fly),JSON.stringify({fly:v18.fly,helix:v18.helix,top:v18.top}));
  // V19: skin da arte do GB UNIT, emotes, arrastar o boneco gira, setas das fileiras
  const v19=await page.evaluate(async([red])=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),f=document.querySelector('#gbFitFigure');
    const imgs=[...f.querySelectorAll('.fit-head image,.fit-layer-arms image,.fit-layer-legs image')].map(i=>i.getAttribute('href'));
    const skin=imgs.filter(h=>/assets\/fit\/skin\//.test(h)).length,mono=!!f.querySelector('.fit-head image[href*="gb-monograma"]');
    const ok=(await Promise.all([...new Set(imgs.filter(h=>/skin/.test(h)))].map(h=>{const i=new Image();i.src=h;return i.decode().then(()=>i.naturalWidth>0,()=>false)}))).every(Boolean);
    const started=GBFitting.emote('dance',{bpm:240,beats:4});await wait(60);
    const moving=[...f.querySelectorAll('[data-j]')].filter(el=>el.getAnimations().length).length,body=f.querySelector('.fit-emote').getAnimations().length;
    await wait(3300);
    const continuous=f.dataset.emote==='dance'&&f.querySelector('.fit-emote').getAnimations().some(a=>a.effect.getTiming().iterations===Infinity);
    const stopped=GBFitting.emote('dance');
    await wait(90);
    const done=!f.dataset.emote&&f.querySelector('.fit-emote').getAnimations().length===0;
    const control=document.querySelector('#lookstudio [data-fit-emote="dance"]');
    const reset=control?.getAttribute('aria-pressed')==='false'&&control?.querySelector('b')?.textContent==='PASSINHO';
    const step=document.querySelector('#lookTops').closest('.look-step'),next=step.querySelector('.look-row-next'),row=step.querySelector('.look-options');row.scrollLeft=0;await wait(50);
    const s0=row.scrollLeft;next?.click();await wait(700);const s1=row.scrollLeft;
    return{skin,mono,ok,started,moving,body,continuous,stopped,done,reset,arrows:!!next,s0,s1}},[reduced]);
  check(vp,'fit V19: robô = peças da arte do GB UNIT (cabeça, braços, pernas) + monograma oficial',v19.skin>=6&&v19.mono&&v19.ok,JSON.stringify(v19));
  if(!reduced)check(vp,'fit V1.3: passinho dança continuamente e segundo clique interrompe',v19.started&&v19.moving>=3&&v19.body===1&&v19.continuous&&v19.stopped&&v19.done&&v19.reset,JSON.stringify(v19));
  else check(vp,'fit V19: movimento reduzido não roda emote',v19.started===false,JSON.stringify(v19));
  check(vp,'fit V19: seta › da fileira de peças rola a lista',v19.arrows&&v19.s1>v19.s0,JSON.stringify(v19));
  // V1.6: base Jamal = três toques por lado + deslocamento + braços leves.
  // Não confundir com apenas mover o corpo inteiro para esquerda/direita.
  if(!reduced){
    const jamal=await page.evaluate(async()=>{
      const sleep=t=>new Promise(r=>setTimeout(r,t)),old={...GBFitting.state};
      GBFitting.set({topId:'gb-crt-003',bottomId:'gb-crt-001',shoeId:'gb-crt-s-052',hood:false,capId:null},{silent:true});
      await sleep(1550);
      GBFitting.emote('dance');await sleep(110);
      const f=document.querySelector('#gbFitFigure'),feet=[...f.querySelectorAll('.fit-layer-shoe .fit-foot')];
      const tracks=feet.map(el=>({origin:el.style.transformOrigin,
        frames:el.getAnimations()[0]?.effect.getKeyframes()||[]}));
      const signs=tracks.map(({frames})=>frames.map(x=>x.transform).filter(Boolean));
      const hoodie=f.dataset.articulated==='on';
      const continuous=f.querySelector('.fit-emote').getAnimations().some(a=>a.effect.getTiming().iterations===Infinity);
      const result={hoodie,continuous,tracks:tracks.map(x=>({origin:x.origin,frames:x.frames.length})),
        triples:signs.map(a=>a.filter(s=>/rotate\([+-]?(?:4|5|6|7)/.test(s)).length),
        negativeLifts:signs.map(a=>a.filter(s=>/,-(?:3|4|5|6)\./.test(s)).length)};
      GBFitting.emote('dance');await sleep(80);
      result.restored=f.dataset.articulated!=='on';
      GBFitting.set(old,{silent:true});await sleep(1150);
      return result;
    });
    check(vp,'GB V1.6: passinho com pés pivotando, três batidas, manga articulada e loop reversível',
      jamal.hoodie&&jamal.continuous&&jamal.tracks.every(t=>t.frames===17&&t.origin.includes('px'))&&
      jamal.triples.every(n=>n>=2)&&jamal.negativeLifts.every(n=>n>=2)&&jamal.restored,JSON.stringify(jamal));
  }
  // V20: escala real dos tênis, rig com capuz medido, painel premium com cinco emotes.
  const v20=await page.evaluate(()=>{const f=document.querySelector('#gbFitFigure'),dock=document.querySelector('#lookstudio .fit-emotes');
    const base=window.GBFitting;return{shoeWidth:base.SHOE.len,buttons:dock?.querySelectorAll('[data-fit-emote]').length||0,
      salute:!!dock?.querySelector('[data-fit-emote="salute"]'),
      previewWidth:document.documentElement.scrollWidth-innerWidth,
      legs:f?.querySelectorAll('.fit-layer-legs .fit-leg').length||0}});
  check(vp,'fit V20: tênis na escala corrigida, dois membros e cinco emotes',v20.shoeWidth>=160&&v20.buttons===5&&v20.salute&&v20.legs===2,JSON.stringify(v20));
  check(vp,'fit V20: interface não cria overflow horizontal',v20.previewWidth<=1,JSON.stringify(v20));
  const v21=await page.evaluate(()=>{
    const f=document.querySelector('#gbFitFigure');
    return{icons:document.querySelectorAll('#lookstudio .fit-icon-glyph').length,
      poses:document.querySelectorAll('#lookstudio .fit-spin-track [data-pose]').length,
      peace:!!f?.querySelector('[data-j="wrR"] .fit-peace-sign'),
      ankle:GBFitting.FIT.bottom.pantsHem,
      shortStable:GBFitting?.RIG?.floor===948};
  });
  check(vp,'fit V21: controles originais, mão em V e barra curta',v21.icons===5&&v21.poses===3&&v21.peace&&v21.ankle===886&&v21.shortStable,JSON.stringify(v21));
   // V22: controle ORBIT 1:1. Arrasto no slider NÃO deve ser interceptado pelo drag do palco.
   if(!reduced&&!mobile){
     const dial=page.locator('#lookstudio .fit-dial'),r=await dial.boundingBox(),track=await page.locator('.fit-spin-track').boundingBox();
     await page.mouse.move(r.x+r.width/2,r.y+r.height*.65);await page.mouse.down();
     await page.mouse.move(track.x+track.width-3,r.y+r.height*.65,{steps:8});
     const live=await page.evaluate(()=>GBFitting.yaw);await page.mouse.up();await page.waitForTimeout(850);
     const end=await page.evaluate(()=>GBFitting.yaw);
     check(vp,'fit V22: bolinha ORBIT acompanha arrasto contínuo',live>.85&&end>.94,JSON.stringify({live,end}));
     await page.evaluate(()=>GBFitting.turn(0));await page.waitForTimeout(850);
   }
   const v22=await page.evaluate(()=>({knob:!!document.querySelector('.fit-orbit-thumb'),
     save:!!document.querySelector('#lookSave .look-cta-mark'),
     shuffle:!!document.querySelector('#lookShuffle svg'),
     clipped:!!document.querySelector('#gbFitFigure [id*="-waist-"]'),
     scrollWidth:document.documentElement.scrollWidth-innerWidth}));
   check(vp,'fit V22: novo design premium com marcador e sem overflow',v22.knob&&v22.save&&v22.shuffle&&v22.clipped&&v22.scrollWidth<=1,JSON.stringify(v22));

   // V1: SALVE calibrado ao lado da face; a mão em V não deve formar chifres.
   if(!reduced){
     const v1=await page.evaluate(async()=>{
       const sleep=t=>new Promise(r=>setTimeout(r,t)),old=GBFitting.state.topId;
       GBFitting.set({topId:'gb-crt-005'},{silent:true});await sleep(1400);
       GBFitting.emote('salute');await sleep(820);
       const f=document.querySelector('#gbFitFigure'),hand=f.querySelector('.fit-peace-sign');
       const matrix=hand.getScreenCTM(),finger=new DOMPoint(0,-40).matrixTransform(matrix),palm=new DOMPoint(0,80).matrixTransform(matrix),face=f.querySelector('.fit-head').getBoundingClientRect();
       const active=document.querySelector('[data-fit-emote="salute"]')?.getAttribute('aria-pressed');
       const dark=()=>({mix:getComputedStyle(document.querySelector('#lookShuffle')).backgroundImage,
         kitCount:document.querySelectorAll('#lookstudio .look-kit').length});
       GBSetTheme(2);const theme=dark();GBSetTheme(0);
       await sleep(1050);
       const cleared=document.querySelector('[data-fit-emote="salute"]')?.getAttribute('aria-pressed')==='false';
       GBFitting.set({topId:old},{silent:true});await sleep(1300);
       return{active,cleared,dx:Math.round(palm.x-face.right),dy:Math.round(finger.y-palm.y),
         theme:theme.mix.includes('linear-gradient'),gestures:document.querySelectorAll('#lookstudio [data-fit-emote][aria-pressed]').length};
     });
     check(vp,'GB Look Studio V1: SALVE junto à face, dedos para cima e indicador acessível',v1.dx>4&&v1.dy< -15&&v1.active==='true'&&v1.cleared&&v1.gestures===5,JSON.stringify(v1));
     check(vp,'GB Look Studio V1: controles satin-gold no tema escuro',v1.theme,JSON.stringify(v1));
   }

   // V1.3: fotografia da calça original não sofre corte artificial em joelho.
   const whole=await page.evaluate(async()=>{
      const sleep=t=>new Promise(r=>setTimeout(r,t)), old={...GBFitting.state};
      GBFitting.set({topId:'gb-crt-003',bottomId:'gb-crt-003'},{silent:true});
      await sleep(1380);
      const f=document.querySelector('#gbFitFigure'),p=f.querySelector('.fit-layer-bottom .fit-garment'),long=f.querySelector('.fit-long-rest'),active=f.querySelector('.fit-long-action');
      const r={pantsImage:!!p?.querySelector('image'),pantsClip:!!p?.querySelector('[id*="trouser"]'),
        restVisible:getComputedStyle(long).opacity==='1',actionHidden:getComputedStyle(active).opacity==='0'};
      GBFitting.set(old,{silent:true});await sleep(1150);return r;
   });
   check(vp,'GB V1.3: calça integral e mangas contínuas na pose neutra',
     whole.pantsImage&&!whole.pantsClip&&whole.restVisible&&whole.actionHidden,JSON.stringify(whole));

   // V1.5: cintura não pode recortar os punhos/cotovelos dos moletons.
   // O erro anterior vinha da waist clip aplicada à FOTO inteira.
   const hoodIntegrity=await page.evaluate(async()=>{
     const sleep=t=>new Promise(r=>setTimeout(r,t)),saved={...GBFitting.state},
       ids=['gb-crt-001','gb-crt-003','gb-crt-004'],result=[];
     for(const topId of ids){
       GBFitting.set({topId},{silent:true});
       await sleep(1250);
       const f=document.querySelector('#gbFitFigure'),
         img=f.querySelector('.fit-long-rest image'),
         e=GBFitting.catalog.top[topId];
       result.push({topId,original:img?.getAttribute('href')===e.src,
         clip:img?.getAttribute('clip-path')||null,
         rest:getComputedStyle(f.querySelector('.fit-long-rest')).opacity});
     }
     GBFitting.set(saved,{silent:true});await sleep(1200);
     return result;
   });
   check(vp,'GB V1.5: foto integral do moletom sem waist clip nos cotovelos',
     hoodIntegrity.length===3&&hoodIntegrity.every(x=>x.original&&!x.clip&&x.rest==='1'),JSON.stringify(hoodIntegrity));

   // V1.4: manga longa preserva a fotografia contínua, sem corte artificial
   // no cotovelo, e o SALVE não atravessa a face.
   const v14=await page.evaluate(async()=>{
     const sleep=t=>new Promise(r=>setTimeout(r,t)),old={...GBFitting.state},f=document.querySelector('#gbFitFigure');
     const results=[];
     for(const topId of ['gb-crt-003','gb-crt-005']){
       GBFitting.set({topId,bottomId:'gb-crt-001',shoeId:'gb-crt-s-052',capId:null,hood:false},{silent:true});
       await sleep(1250);
       const photoCount=f.querySelectorAll('.fit-long-arm > g > .fit-jnt > g > image').length;
       const started=GBFitting.emote('salute');await sleep(350);
       const anim=[...f.querySelectorAll('*')].flatMap(x=>x.getAnimations()).filter(x=>x.effect?.getTiming().duration===1450);
       anim.forEach(x=>{x.pause();x.currentTime=940});
       const sign=f.querySelector('.fit-peace-sign'),m=sign.getScreenCTM(),tip=new DOMPoint(0,-40).matrixTransform(m),
        palm=new DOMPoint(0,80).matrixTransform(m),face=f.querySelector('.fit-head').getBoundingClientRect();
       results.push({topId,photoCount,started,side:palm.x-face.right,up:palm.y-tip.y,active:document.querySelector('[data-fit-emote="salute"]')?.getAttribute('aria-pressed')});
       GBFitting.set({topId:'gb-crt-005'},{silent:true});await sleep(1100);
     }
     GBFitting.set(old,{silent:true});await sleep(1100);
     return results;
   });
   check(vp,'GB V1.4: moletom uma foto por manga; SALVE aberto, dedos verticais e sem cruzar face',
     reduced||v14[0].photoCount===2&&v14.every(v=>v.started&&v.side>12&&v.up>18&&v.active==='true'),JSON.stringify(v14));

   // Manga longa articulada, pele ocultada quando se veste calça e tênis na frente da bainha.
   const v12=await page.evaluate(async()=>{
     const sleep=t=>new Promise(r=>setTimeout(r,t)),old={...GBFitting.state};
     GBFitting.set({topId:'gb-crt-003',bottomId:'gb-crt-003',shoeId:'gb-crt-s-052',hood:false,capId:null},{silent:true});
     await sleep(1400);
     const f=document.querySelector('#gbFitFigure'),rig=f.querySelector('.fit-rig'),
       arms=f.querySelectorAll('.fit-articulated-longsleeves .fit-long-arm').length,
       skin=f.querySelectorAll('.fit-legs[data-pants="true"] .fit-leg').length,
       shoeAbove=!!(rig.querySelector('.fit-layer-bottom').compareDocumentPosition(rig.querySelector('.fit-layer-shoe'))&Node.DOCUMENT_POSITION_FOLLOWING);
     let bending=false,full=false;
     if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
       GBFitting.emote('salute');await sleep(820);
       bending=f.querySelector('.fit-articulated-longsleeves [data-j="elR"]')?.getAnimations().some(a=>a.playState==='running')||false;
       full=f.dataset.salveMode==='full';
     }
     GBFitting.set(old,{silent:true});await sleep(1300);
     return{arms,skin,shoeAbove,bending,full};
   });
   check(vp,'GB Look V1.2: manga em duas juntas, calça sem skin e sapato sobreposto',
     v12.arms===2&&v12.skin===0&&v12.shoeAbove&&(reduced||v12.bending&&v12.full),JSON.stringify(v12));





  // V19.1: o 360 não pode cortar de uma lateral para a outra; é uma rotação
  // editorial sinalizada, nunca uma foto inventada do verso da roupa.
  if(!reduced&&(w===1440||w===390)){
    const orbit=await page.evaluate(async()=>{
      const wait=ms=>new Promise(r=>setTimeout(r,ms)),f=document.querySelector('#gbFitFigure');
      const started=GBFitting.emote('spin'),plane=f.querySelector('.fit-yaw');
      await wait(480);
      const a=plane.getAnimations()[0],middle=a?.effect?.getComputedTiming().progress;
      const labeled=document.querySelector('.look-stage').classList.contains('is-fit-orbiting')&&!!document.querySelector('.fit-orbit-note');
      await wait(2200);
      return{started,middle,labeled,done:!f.dataset.emote&&!document.querySelector('.look-stage').classList.contains('is-fit-orbiting'),yaw:GBFitting.yaw};
    });
    check(vp,'fit V19.1: 360 contínuo, legenda editorial e retorno à frente',orbit.started&&orbit.middle>.05&&orbit.middle<.8&&orbit.labeled&&orbit.done&&Math.abs(orbit.yaw)<.02,JSON.stringify(orbit));
  }
  if(!reduced&&!mobile){const fb=await page.locator('#gbFitFigure').boundingBox();const y0=await page.evaluate(()=>GBFitting.yaw);
    await page.mouse.move(fb.x+fb.width*.5,fb.y+fb.height*.45);await page.mouse.down();await page.mouse.move(fb.x+fb.width*.62,fb.y+fb.height*.45,{steps:4});await page.mouse.move(fb.x+fb.width*.95,fb.y+fb.height*.45,{steps:6});await page.mouse.up();
    await page.waitForTimeout(1300);const y1=await page.evaluate(()=>GBFitting.yaw);
    check(vp,'fit V19: arrastar o próprio boneco gira (mouse)',Math.abs(y0)<.02&&Math.abs(y1-1)<.02,JSON.stringify({y0,y1}));
    await page.evaluate(()=>GBFitting.turn(0));await page.waitForTimeout(1200)}
  if(!reduced&&mobile){const c=await page.context().newCDPSession(page),fb=await page.locator('#gbFitFigure').boundingBox(),x0=fb.x+fb.width*.45,y=fb.y+fb.height*.5;
    const before=await page.evaluate(()=>({yaw:GBFitting.yaw,top:GBFitting.state.topId,sy:scrollY}));
    const tp=(type,x)=>c.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
    await tp('touchStart',x0);for(let i=1;i<=10;i++){await tp('touchMove',x0-i*16);await page.waitForTimeout(16)}
    const mid=await page.evaluate(()=>GBFitting.yaw);await tp('touchEnd');await page.waitForTimeout(1300);
    const after=await page.evaluate(()=>({yaw:GBFitting.yaw,top:GBFitting.state.topId,sy:scrollY}));
    check(vp,'fit V19: arrastar o boneco com o dedo gira e acompanha o toque (sem rolar a página nem trocar peça)',mid<-.5&&Math.abs(after.yaw+1)<.02&&after.top===before.top&&Math.abs(after.sy-before.sy)<2,JSON.stringify({before,mid,after}));
    await page.evaluate(()=>GBFitting.turn(0));await page.waitForTimeout(1200);await c.detach()}
  // kit: com metade de um kit escolhida, um toque veste o kit completo (superior e inferior do MESMO produto)
  const kit=await page.evaluate(async([t0,b0])=>{const C=window.GB_FIT_CATALOG,kid=Object.keys(C.top).find(k=>C.bottom[k]),other=Object.keys(C.bottom).find(k=>!C.top[k]);
    const wait=ms=>new Promise(r=>setTimeout(r,ms)),opt=(m,id)=>document.querySelector(`${m==='top'?'#lookTops':'#lookBottoms'} [data-look-id="${id}"]`);
    opt('top',kid).click();opt('bottom',other).click();await wait(300);const btn=document.querySelector('[data-look-kit]');const had=!!btn&&btn.dataset.lookKit===kid;
    btn?.click();await wait(1800);const f=document.querySelector('#gbFitFigure'),st={...GBFitting.state},fig=[f.querySelector('.fit-layer-top .fit-garment')?.dataset.product,f.querySelector('.fit-layer-bottom .fit-garment')?.dataset.product];
    const gone=!document.querySelector('[data-look-kit]');opt('top',t0).click();opt('bottom',b0).click();await wait(1800);
    return{kid,had,st,fig,gone,back:GBFitting.state}},[f0.state.topId,f0.state.bottomId]);
  check(vp,'fit V16: botão "vestir o kit completo" veste superior + inferior do mesmo produto',kit.had&&kit.st.topId===kit.kid&&kit.st.bottomId===kit.kid&&kit.fig.every(x=>x===kit.kid)&&kit.gone,JSON.stringify(kit));
  check(vp,'fit V16: volta ao look inicial depois dos testes',kit.back.topId===f0.state.topId&&kit.back.bottomId===f0.state.bottomId,JSON.stringify(kit.back));
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
