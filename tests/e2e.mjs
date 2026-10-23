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
  if(errors.length){console.error('GB BOOT ERRORS',errors.slice(0,15));throw Error('Page JavaScript failed to initialize: '+errors.slice(0,5).join(' | '))}
  // Mede contra a largura pedida: em modo mobile o Chrome alarga o viewport de layout se algo vaza.
  const overflow=async()=>page.evaluate(w=>Math.max(document.documentElement.scrollWidth,innerWidth)-w,w);
  check(vp,"sem overflow horizontal (topo)",await overflow()<=0,String(await overflow()));
  const cards=()=>page.locator('#productGrid .product-card').count();
  check(vp,'grade inicial com 8 cards',await cards()===8,String(await cards()));
  // Filtros
  await page.locator('.filter[data-filter="track"]').click();check(vp,'filtro agasalhos exibe 8 de 10',await cards()===8);check(vp,'contador de agasalhos atualizado',(await page.locator('#catalogCount').textContent()).includes('10'));
  await page.locator('.filter[data-filter="short"]').click();check(vp,'filtro camisa+short exibe 8 de 10',await cards()===8);
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
  // A vitrine inicial prioriza recortes reais do acervo, com os 14 estudos preservados.
  check(vp,'CRT: primeiros cards incluem imagem do acervo',await page.locator('#productGrid .product-visual img.actual-photo').count()>=4);
  // Detalhe: usar conjunto já catalogado com as 3 vistas e 2 seletores de tamanho.
  await page.fill('#catalogSearch','Argentina');await page.waitForTimeout(260);
  await page.locator('#productGrid .product-visual').first().click();await page.waitForTimeout(700);
  check(vp,'V08: card abre o Object View',await page.locator('#railViewer').isVisible());
  check(vp,'V08: Object View mostra a peça do card',(await page.locator('#railViewerName').textContent()).includes('ARGENTINA'));
  await page.locator('#gbTabColors').click();await page.waitForTimeout(300);
  check(vp,'V08: estudo de cor dentro da peça',await page.locator('#gbColorPanel').isVisible()&&(await page.locator('#gbColorPanel').textContent()).includes('NÃO É VARIANTE'));
  const lab0=await page.locator('#gbLabColorName').textContent();await page.locator('[data-gb-color="2"]').click();
  check(vp,'V08: troca de cor de estudo',(await page.locator('#gbLabColorName').textContent())!==lab0);
  await page.locator('#gbTabObject').click();
  await page.locator('#railViewerProduct').click();await page.waitForTimeout(700);
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
  await page.fill('#catalogSearch','');await page.waitForTimeout(120);
  // Busca na gaveta
  await page.locator('#searchOpen').click();await page.fill('#searchInput','kit');
  check(vp,'busca da gaveta inclui os oito kits iniciais',await page.locator('#searchResults .search-result').count()>=8);
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
  check(vp,'filtro da arara (agasalhos = 10)',await page.locator('.rail-card').count()===10);
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
  check(vp,'hero: protagonista abre a peça',await page.locator('#railViewer').isVisible()&&(await page.locator('#railViewerName').textContent()).length>3);
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
  // Arara: arrasto 1:1 (deslocamento da peça acompanha o ponteiro)
  await page.locator('#railViewport').scrollIntoViewIfNeeded();await page.waitForTimeout(300);
  if(!mobile){const rb=await page.locator('#railViewport').boundingBox();const card=page.locator('.rail-card.is-active');const x0=(await card.boundingBox()).x;
    await page.mouse.move(rb.x+rb.width*.5,rb.y+rb.height*.55);await page.mouse.down();await page.mouse.move(rb.x+rb.width*.5-20,rb.y+rb.height*.55);await page.mouse.move(rb.x+rb.width*.5-80,rb.y+rb.height*.55,{steps:4});await page.waitForTimeout(80);
    const x1=(await card.boundingBox()).x;await page.mouse.up();await page.waitForTimeout(900);
    check(vp,'arara: arrasto 1:1',Math.abs((x0-x1)-80)<14,`${Math.round(x0-x1)}px`)}
  check(vp,'arara: barra em curva',await page.locator('#railBar path').count()===3);
  // Chromatic (V08, dentro da peça): mesma silhueta entre estados de cor
  await page.locator('#productGrid .product-visual').first().click();await page.waitForTimeout(500);await page.locator('#gbTabColors').click();await page.waitForTimeout(500);
  const g0=await page.locator('#gbLabMedia svg').boundingBox();await page.locator('[data-gb-color="3"]').click();await page.waitForTimeout(700);
  const g1=await page.locator('#gbLabMedia svg').boundingBox();
  check(vp,'chromatic: troca sem mover o molde',g0&&g1&&Math.abs(g0.x-g1.x)<1&&Math.abs(g0.width-g1.width)<1);
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
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
for(const [w,h] of VIEWPORTS){console.log(`→ ${w}x${h}`);await run(w,h)}
console.log('→ 390x844 reduced-motion');await run(390,844,true);
const total=results.length;
console.log(`\n${total-failures}/${total} verificações aprovadas.`);
process.exit(failures?1:0);
