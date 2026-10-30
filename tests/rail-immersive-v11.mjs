// GB IMPORTS / QA — GB RAIL IMMERSIVE V11 (palco, câmera, vento, rig, borda direita, capacidades de vista).
// Uso: node tests/rail-immersive-v11.mjs [baseURL]   (sirva dist/ — o mesmo build que a Vercel publica)
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let chromium;
for(const p of ['playwright','/opt/node22/lib/node_modules/playwright']){try{({chromium}=require(p));break}catch{}}
if(!chromium){console.error('Playwright não encontrado.');process.exit(2)}
const BASE=process.argv[2]||process.env.BASE_URL||'http://localhost:8081/';
const VIEWPORTS=[[1440,900],[1024,768],[768,1024],[390,844],[320,720]];
let failures=0;const metrics=[];
const check=(vp,name,ok,info='')=>{if(!ok){failures++;console.log(`  ✗ [${vp}] ${name} ${info}`)}else console.log(`  ✓ [${vp}] ${name}`)};

async function open(browser,w,h,{reduced=false,latency=0}={}){
  const mobile=w<600;
  const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile,reducedMotion:reduced?'reduce':'no-preference'});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/cdn\.jsdelivr|Failed to load resource/.test(m.text()))errors.push(m.text())});
  // latência realista por foto do acervo (CDN/celular): é nela que o fantasma da borda direita aparecia
  if(latency)await page.route(/gb-crt\/(sombras\/)?gb-crt-\d+\.webp$/,async r=>{await new Promise(z=>setTimeout(z,latency));r.continue()});
  await page.goto(BASE,{waitUntil:'load'});
  await page.waitForFunction(()=>window.GB_CORE_READY===true&&!!window.GBRail&&!!window.GBRailScene,{timeout:60000});
  await page.waitForTimeout(900);
  return{ctx,page,errors,mobile};
}
// rola até a arara como gente (a abertura pode devolver a rolagem nos primeiros instantes)
async function toRail(page,off){
  for(let k=0;k<30;k++){
    await page.evaluate(o=>{const r=document.querySelector('#railViewport');scrollTo({top:r.getBoundingClientRect().top+scrollY-o,behavior:'instant'})},off);
    await page.waitForTimeout(120);
    const t=await page.evaluate(()=>document.querySelector('#railViewport').getBoundingClientRect().top);
    if(Math.abs(t-off)<8)return true;
  }
  return false;
}
const settle=async page=>{for(let i=0;i<90;i++){const s=await page.evaluate(()=>GBRail.state);if(s.phase==='focused'&&!s.moving)return s;await page.waitForTimeout(60)}return page.evaluate(()=>GBRail.state)};

async function film(browser,w,h){
  const vp=`${w}x${h}`;const {ctx,page,errors,mobile}=await open(browser,w,h);
  // 1. capítulo V12 preservado; a loja espera atrás dele no plano aberto
  const pre=await page.evaluate(()=>({chap:!!document.querySelector('#rail>.gb-chap'),phase:GBRailScene.phase,cam:GBRailScene.camera,
    layers:['.r11-room','.r11-wall','.r11-floor','.r11-ceil','.r11-rack #railItems','.r11-rack #railBar','.r11-portal'].every(s=>document.querySelector(s)),
    items:document.querySelectorAll('#railItems .r10-item').length,perspective:getComputedStyle(document.querySelector('.r11-room')).perspective}));
  check(vp,'V11: capítulo EM MOVIMENTO preservado e loja montada sob a mesma arara',pre.chap&&pre.layers&&pre.items===63&&pre.perspective!=='none',JSON.stringify(pre));
  check(vp,'V11: antes do capítulo a câmera está no plano aberto (arara ao fundo)',pre.phase==='far'&&pre.cam.scale<.72,JSON.stringify(pre.cam));
  const hid=await page.evaluate(()=>({entering:GBRail.entering,shown:[...document.querySelectorAll('#railItems .r10-item:not([hidden])')].filter(c=>+getComputedStyle(c).opacity>0).length}));
  check(vp,'V11: antes do filme a barra está vazia (cabides ainda não pousaram)',hid.entering===63&&hid.shown===0,JSON.stringify(hid));
  // 2. rola: grava a câmera por quadro (rAF) desde o capítulo até assentar
  await page.evaluate(()=>{window.__cam=[];const t0=performance.now();let lt=0;const f=t=>{const c=GBRailScene.camera,ch=document.querySelector('#rail>.gb-chap');
    const op=[...document.querySelectorAll('#railItems .r10-item:not([hidden])')].map(c=>+c.style.opacity||(c.style.opacity===''?1:0));
    window.__cam.push({t:t-t0,dt:lt?t-lt:0,s:c.scale,light:c.light,phase:GBRailScene.phase,chap:ch?ch.className:'',shown:op.filter(o=>o>.98).length,partial:op.filter(o=>o>.02&&o<.98).length,entering:GBRail.entering});lt=t;if(t-t0<7000)requestAnimationFrame(f)};requestAnimationFrame(f);
    window.__lt=0;try{new PerformanceObserver(l=>{window.__lt+=l.getEntries().length}).observe({type:'longtask',buffered:false})}catch{}});
  await toRail(page,mobile?60:40);
  await page.waitForFunction(()=>window.__cam.length&&performance.now()&&window.__cam.at(-1).t>6900,null,{timeout:12000}).catch(()=>{});
  const cam=await page.evaluate(()=>({cam:window.__cam,lt:window.__lt}));
  const c=cam.cam,firstOut=c.findIndex(x=>/is-out/.test(x.chap)),firstMove=c.findIndex((x,i)=>i>0&&x.phase==='dolly'&&x.s-c[i-1].s>1e-5),live=c.findIndex(x=>x.phase==='live');
  check(vp,'V11: a câmera só anda depois que os blocos do capítulo abrem (sem intro concorrente)',firstOut>=0&&firstMove>firstOut,`out@${c[firstOut]?.t|0}ms move@${c[firstMove]?.t|0}ms`);
    // salto = variação de escala por milissegundo acima do dobro do pico do easing (independe da taxa de quadros)
  // inclinação medida em janelas de ≥40 ms (o rAF de um navegador sem GPU varia muito quadro a quadro)
  const dolly=c.slice(firstMove,live>0?live:undefined),jumps=[];
  for(let i=1;i<dolly.length;i++){let j=i-1;while(j>0&&dolly[i].t-dolly[j].t<40)j--;jumps.push((dolly[i].s-dolly[j].s)/Math.max(1,dolly[i].t-dolly[j].t))}
  // ao chegar, a câmera passa 1–2% e assenta (sem degrau): o repouso exato é conferido no plano final
  check(vp,'V11: dolly contínuo até o plano final (escala só cresce, sem salto)',live>0&&dolly.length>20&&Math.min(...jumps)>-1e-6&&Math.max(...jumps)<.0012&&c[live].s>.995&&c[live].s<1.02,`frames ${dolly.length} maior passo ${(Math.max(...jumps)*1000).toFixed(3)}/s`);
  const dur=live>0?c[live].t-c[firstMove].t:0;
  // a arara surge: cabides pousam um a um (vários instantes com peças a meio caminho), todos antes da câmera assentar
  const firstShown=c.findIndex(x=>x.shown>0),cascade=c.filter(x=>x.partial>0).length,landed=c.findIndex(x=>x.entering===0&&x.phase!=='far');
  check(vp,'V11: cabides surgem em cascata depois dos blocos e pousam antes de a câmera chegar',firstShown>firstOut&&cascade>=6&&landed>0&&landed<=live+2,`primeiro@${c[firstShown]?.t|0}ms cascata ${cascade} quadros, pousados@${c[landed]?.t|0}ms, câmera@${c[live]?.t|0}ms`);
  const mid=c[Math.floor((firstMove+live)/2)]||{},lp=(mid.light-c[0].light)/(1-c[0].light),sp=(mid.s-c[0].s)/(1-c[0].s);
  check(vp,'V11: travelling de cinema (1,2–2,4 s), luz chega antes da câmera',dur>1200&&dur<2400&&lp>sp,`${dur|0}ms luz ${lp.toFixed(2)} câmera ${sp.toFixed(2)}`);
  const dts=dolly.map(x=>x.dt).filter(Boolean).sort((a,b)=>a-b),p95=dts[Math.floor(dts.length*.95)]||0,mean=dts.reduce((a,b)=>a+b,0)/(dts.length||1);
  metrics.push({vp,dollyMs:dur|0,frameMeanMs:+mean.toFixed(1),frameP95Ms:+p95.toFixed(1),longTasks:cam.lt});
  // 3. plano final: arara exatamente no plano da V10 (sem transform), piso e parede projetados pela mesma perspectiva
  const fin=await page.evaluate(()=>{const v=document.querySelector('#railViewport').getBoundingClientRect(),fl=document.querySelector('.r11-floor').getBoundingClientRect(),wl=document.querySelector('.r11-wall').getBoundingClientRect(),
    hem=Math.max(...[...document.querySelectorAll('.r10-item.is-focus .r10-turn .hg-fig .hg-part')].map(p=>p.getBoundingClientRect().bottom));
    return{rack:document.querySelector('.r11-rack').style.transform,cam:GBRailScene.camera,portal:document.querySelector('.r11-portal').hidden,
      junction:wl.bottom-v.top,floorTop:fl.top-v.top,hem:hem-v.top,h:v.height,floor3d:/matrix3d/.test(getComputedStyle(document.querySelector('.r11-floor')).transform)}});
  check(vp,'V11: câmera assentada = plano da arara idêntico à V10 (identidade, porta fora de quadro)',fin.rack===''&&fin.cam.scale===1&&fin.portal,JSON.stringify(fin.cam));
  const glass=await page.evaluate(()=>{const fl=document.querySelector('.r11-floor'),rf=document.querySelector('.r10-item.is-focus .r10-refl.on'),r=rf&&rf.querySelector('img')&&rf.getBoundingClientRect().top>=GBRailScene.floorY+document.querySelector('#railViewport').getBoundingClientRect().top-2?'below':'none';
    return{out:!!document.querySelector('.r11-out .r11-city b'),panes:document.querySelectorAll('.r11-glass').length,mullions:document.querySelectorAll('.r11-wall .r11-mullions b').length,
      sideMullions:document.querySelectorAll('.r11-side-l .r11-mullions b').length,floorOut:parseFloat(fl.style.getPropertyValue('--glass'))<100,reflect:r&&r!=='none'?r.slice(0,12):r}});
  check(vp,'V11: vitrine de vidro — fundo e laterais em caixilhos, rua lá fora, piso que continua depois do vidro, reflexo no piso',
    glass.out&&glass.panes===3&&glass.mullions>=1&&glass.sideMullions>=1&&glass.floorOut&&/^below/.test(glass.reflect||''),JSON.stringify(glass));
  // piso do plano da arara logo abaixo das barras das roupas; o trilho do vidro do fundo encontra o piso mais acima
  const fy=await page.evaluate(()=>GBRailScene.floorY);
  check(vp,'V11: piso em perspectiva real logo abaixo das roupas e dentro do palco; vidro do fundo pousa mais acima',fin.floor3d&&fy>fin.hem&&fy<fin.h-40&&fin.junction<fy,JSON.stringify({...fin,floorY:fy}));
  if(!mobile){
    const vb=await page.locator('#railViewport').boundingBox();
    await page.mouse.move(vb.x+vb.width*.85,vb.y+vb.height*.3,{steps:4});await page.waitForTimeout(700);
    const par=await page.evaluate(()=>({rack:document.querySelector('.r11-rack').style.transform,wall:document.querySelector('.r11-wall').style.transform,orbit:GBRailScene.camera.orbit}));
    check(vp,'V11: parallax do mouse gira a sala em torno da arara (plano da arara intocado)',par.rack===''&&Math.abs(par.orbit[0])>2,JSON.stringify(par));
    // tira o mouse e espera o hover e a rajada que o próprio gesto levantou assentarem
    await page.mouse.move(2,2);await settle(page);
    await page.waitForFunction(()=>GBRail.state.wind===0,null,{timeout:6000}).catch(()=>{});
  }
  // 4. a arara ganha vida: rajada de vento ambiente, peças fora de sincronia, a arara não conta como "movendo"
  let wind=null;
  // rajadas a cada 4,5–8 s (2,4–3,8 s cada): espera a próxima por até 16 s, sem depender da taxa de quadros
  await page.waitForFunction(()=>GBRail.state.wind>.3,null,{timeout:16000,polling:50}).catch(()=>{});
  for(let i=0;i<3&&!wind;i++){const s=await page.evaluate(()=>{const cards=[...document.querySelectorAll('#railItems .r10-item:not([hidden])')];
      const ang=cards.map(c=>{const m=/rotate\((-?[\d.]+)deg/.exec(c.querySelector('.r10-swing').style.transform);return m?+m[1]:0});
      return{wind:GBRail.state.wind,moving:GBRail.state.moving,ang,rig:document.querySelectorAll('.r10-item.is-rig').length,focusRig:document.querySelector('.r10-item.is-focus').classList.contains('is-rig'),
        hem:getComputedStyle(document.querySelector('.r10-item.is-focus .r10-turn .hg-bone-b')).display}});
    if(s.wind>.2)wind=s;else await page.waitForTimeout(150)}
  check(vp,'V11: vento ambiente chega depois da câmera',!!wind,JSON.stringify(wind||await page.evaluate(()=>({air:GBRailScene.air,st:GBRail.state}))));
  if(wind){
    const distinct=new Set(wind.ang.map(a=>a.toFixed(2))).size;
    check(vp,'V11: cabides balançam fora de sincronia (ângulos distintos, pequenos)',distinct>=Math.min(3,wind.ang.length)&&Math.max(...wind.ang.map(Math.abs))<4,JSON.stringify(wind.ang));
    check(vp,'V11: vento não é "arara em movimento" (estado da V10 em repouso)',wind.moving===false);
    // aparelho que mediu quadros lentos no dolly rebaixa para "-low": sem rig (o vento continua)
    const low=await page.evaluate(()=>GBRailScene.tier.endsWith('-low'));
    check(vp,`V11: rig do tecido só na peça em foco (e vizinhas no desktop)${low?' — nível low: rig desligado':''}`,low?wind.rig===0:wind.focusRig&&wind.hem==='block'&&wind.rig<=(mobile?1:3),JSON.stringify({rig:wind.rig,hem:wind.hem,low}));
  }
  // 5. rajada termina e o relógio para (nada roda parado)
  const calm=await page.waitForFunction(()=>GBRail.state.wind===0&&!document.querySelector('#railItems').classList.contains('is-moving'),null,{timeout:9000}).then(()=>true).catch(()=>false);
  check(vp,'V11: entre rajadas a arara para o relógio',calm);
  // 5b. arrasto rápido: balanço contido (cabide ≤ 4,5°), a barra do tecido não se solta no arrasto (peça inteira)
  if(!mobile){
    const vb=await page.locator('#railViewport').boundingBox(),y=vb.y+vb.height*.5;
    await page.evaluate(()=>{window.__sw=[];const f=()=>{const cs=[...document.querySelectorAll('#railItems .r10-item:not([hidden])')];
      const ang=cs.map(c=>{const m=/rotate\((-?[\d.]+)deg/.exec(c.querySelector('.r10-swing').style.transform);return m?Math.abs(+m[1]):0});
      const hem=[...document.querySelectorAll('#railItems .r10-item.is-rig .r10-turn .hg-bone-b')].map(b=>{const m=/rotate\((-?[\d.]+)deg/.exec(b.style.transform);return m?Math.abs(+m[1]):0});
      __sw.push({a:Math.max(0,...ang),h:Math.max(0,...hem),drag:document.querySelector('#railViewport').classList.contains('is-dragging')});if(__sw.length<150)requestAnimationFrame(f)};requestAnimationFrame(f)});
    for(const d of [-1,1]){await page.mouse.move(vb.x+vb.width*(d<0?.72:.28),y);await page.mouse.down();for(let k=1;k<=10;k++){await page.mouse.move(vb.x+vb.width*(d<0?.72:.28)+d*k*34,y);await page.waitForTimeout(12)}await page.mouse.up();await page.waitForTimeout(700)}
    const sw=await page.evaluate(()=>__sw);await page.mouse.move(2,2);await settle(page);
    const maxA=Math.max(...sw.map(x=>x.a)),hemDrag=Math.max(0,...sw.filter(x=>x.drag).map(x=>x.h));
    check(vp,'V11: arrasto rápido com balanço contido (cabide < 4,5°) e peça inteira (barra do tecido presa no arrasto)',maxA<4.5&&hemDrag<.05,`cabide máx ${maxA.toFixed(2)}° · barra no arrasto ${hemDrag.toFixed(3)}°`);
    // troca de cor em onda: a foto nova sobe da barra até a gola, a antiga sai só no fim
    const iv=await page.evaluate(()=>GBRail.items().findIndex(i=>i.id==='gb-v10-tech-fleece'));await page.evaluate(i=>GBRail.navigate(i),iv);await settle(page);await page.waitForTimeout(900);
    await page.locator('.r10-item.is-focus .gb-tag[data-variant="2"]').click();
    const wv=[];for(let k=0;k<14;k++){wv.push(await page.evaluate(()=>{const c=document.querySelector('.r10-item.is-focus'),n=c.querySelector('.r10-turn>.hg:not(.is-leaving)');
      const cp=n?n.style.clipPath:'',m=/polygon\(([^)]*)\)/.exec(cp);let edgeY=null;if(m){const ys=m[1].split(',').slice(2).map(p=>parseFloat(p.trim().split(/\s+/)[1]));edgeY=ys.reduce((a,b)=>a+b,0)/ys.length}
      return{hg:c.querySelectorAll('.r10-turn>.hg').length,glow:c.querySelectorAll('.hg-glow').length,edgeY,src:n?.querySelector('.hg-fig img')?.getAttribute('src')||''}}));await page.waitForTimeout(90)}
    await page.waitForTimeout(900);
    const end=await page.evaluate(()=>{const c=document.querySelector('.r10-item.is-focus');return{hg:c.querySelectorAll('.r10-turn>.hg').length,glow:c.querySelectorAll('.hg-glow').length,clip:c.querySelector('.r10-turn>.hg').style.clipPath,variant:GBRail.state.variantId,src:c.querySelector('.r10-turn>.hg .hg-fig img').getAttribute('src')}});
    const ys=wv.map(x=>x.edgeY).filter(v=>v!=null),rising=ys.length>=4&&ys.every((v,i)=>i===0||v<=ys[i-1]+1e-6)&&ys[0]-ys.at(-1)>.4;
    check(vp,'V11: troca de cor em onda de baixo para cima (foto antiga por baixo + faixa de luz), uma camada só no fim',
      wv.some(x=>x.hg===3&&x.glow===1)&&rising&&end.hg===1&&end.glow===0&&!end.clip&&end.variant==='azul'&&/gb-crt-0(38|39|40)/.test(end.src),JSON.stringify({ys:ys.map(v=>+v.toFixed(2)),end}));
    await page.evaluate(()=>GBRail.navigate(2));await settle(page);
  }
  // 6. interação: setas e teclado continuam; a câmera reage e volta ao eixo
  await page.locator('#railNext').click();let s=await settle(page);
  check(vp,'V11: seta avança uma peça com a loja montada',s.index===3,JSON.stringify(s));
  await page.locator('#railItems .r10-item.is-focus .r10-hit').focus();await page.keyboard.press('End');s=await settle(page);
  const end=s.index;await page.keyboard.press('Home');s=await settle(page);
  check(vp,'V11: teclado Home/End — primeira e última peça',end===62&&s.index===0,`${end} ${s.index}`);
  // 7. Object View: abre, fecha, câmera recua até o plano médio e preserva a peça
  await page.evaluate(()=>GBRail.navigate(5));await settle(page);
  await page.locator('#railItems .r10-item.is-focus .r10-hit').focus();await page.keyboard.press('Enter');await page.waitForTimeout(700);
  const opened=await page.evaluate(()=>!document.querySelector('#railViewer').hidden);
  await page.keyboard.press('Escape');await page.waitForTimeout(120);
  const back1=await page.evaluate(()=>({c:GBRailScene.camera.c,s:GBRail.state}));
  await page.waitForFunction(()=>Math.abs(GBRailScene.camera.c)<.05,null,{timeout:3000}).catch(()=>{});
  const back2=await page.evaluate(()=>({c:GBRailScene.camera.c,s:GBRail.state,focus:!!document.activeElement?.closest('#railViewport')}));
  check(vp,'V11: Object View abre e, ao fechar, a câmera recua da peça até o plano médio',opened&&back1.c<-1&&Math.abs(back2.c)<.05&&back2.s.index===5&&back2.focus,JSON.stringify({c1:back1.c,c2:back2.c}));
  // 8. filtros com a loja montada
  for(const [f,n] of [['set',11],['top',35],['bottom',17],['all',63]]){
    await page.locator(`.rail-chips [data-rail-filter="${f}"]`).click();await page.waitForTimeout(250);
    const r=await page.evaluate(()=>({n:document.querySelectorAll('#railItems .r10-item').length,c:document.querySelector('#railCounter').textContent,in:!!document.querySelector('.r11-rack #railItems')}));
    check(vp,`V11: filtro ${f} (${n}) dentro do palco`,r.n===n&&r.c.endsWith('/ '+n)&&r.in,JSON.stringify(r));
  }
  // 9. letreiros laterais fora da faixa onde as peças existem (a arara esmaece antes deles)
  const st=await page.evaluate(()=>{const v=document.querySelector('#railViewport').getBoundingClientRect();return[...document.querySelectorAll('.rail-side-stamp')].filter(e=>getComputedStyle(e).display!=='none').map(e=>{const r=e.getBoundingClientRect();return{l:r.left-v.left,r:v.right-r.right,w:r.width}})});
  check(vp,'V11: letreiros laterais na faixa limpa da borda (≤36 px)',st.every(x=>Math.min(x.l+x.w,x.r+x.w)<=36),JSON.stringify(st));
  const ov=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  check(vp,'V11: sem overflow horizontal',ov<=0,String(ov));
  check(vp,'V11: zero erro de JavaScript',errors.length===0,errors.join(' | '));
  await ctx.close();
}

// Toque: arrastar para o lado com o dedo navega 1:1 (durante e depois do filme), sem prender a rolagem
async function touch(browser,w,h){
  const vp=`${w}x${h} toque`;const {ctx,page,errors}=await open(browser,w,h);
  const cdp=await ctx.newCDPSession(page);
  const swipe=async(dx)=>{const b=await page.locator('#railViewport').boundingBox(),y=b.y+b.height*.42,x0=b.x+b.width*(dx<0?.78:.22);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y}]});
    for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+dx*i/12,y:y+i*.4}]});await page.waitForTimeout(16)}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})};
  await toRail(page,60);
  await page.waitForFunction(()=>GBRailScene.phase==='dolly',null,{timeout:8000}).catch(()=>{});
  const i0=(await page.evaluate(()=>GBRail.state)).index,y0=await page.evaluate(()=>scrollY);
  await swipe(-w*.5);await page.waitForTimeout(700);
  const a=await settle(page),ph=await page.evaluate(()=>({phase:GBRailScene.phase,y:scrollY}));
  check(vp,'V11 toque: arrastar durante o filme encurta a câmera e troca de peça',a.index>i0&&ph.phase==='live'&&Math.abs(ph.y-y0)<4,JSON.stringify({i0,a:a.index,...ph,y0}));
  await swipe(w*.5);await page.waitForTimeout(700);const b=await settle(page);
  check(vp,'V11 toque: arrastar para o outro lado volta',b.index<a.index,`${a.index} → ${b.index}`);
  const fly=await page.evaluate(()=>({moving:GBRail.state.moving,pos:GBRail.state.pos,index:GBRail.state.index}));
  check(vp,'V11 toque: assenta numa peça inteira',Math.abs(fly.pos-fly.index)<.01&&!fly.moving,JSON.stringify(fly));
  check(vp,'V11 toque: zero erro de JavaScript',errors.length===0,errors.join(' | '));
  await ctx.close();
}

// Interromper o filme: o gesto manda, a câmera encurta o plano e nada bloqueia
async function interrupt(browser,w,h){
  const vp=`${w}x${h} interrupt`;const {ctx,page,mobile}=await open(browser,w,h);
  await toRail(page,mobile?60:40);
  await page.waitForFunction(()=>GBRailScene.phase==='dolly'&&GBRailScene.camera.scale>.68,null,{timeout:8000}).catch(()=>{});
  const before=await page.evaluate(()=>({s:GBRailScene.camera.scale,i:GBRail.state.index}));
  await page.locator('#railNext').click();
  await page.waitForTimeout(450);
  const after=await page.evaluate(()=>({phase:GBRailScene.phase,s:GBRailScene.camera.scale,i:GBRail.state.index}));
  check(vp,'V11: clicar durante o dolly encurta o plano e navega na hora',before.s<1&&after.phase==='live'&&after.s===1&&after.i===before.i+1,JSON.stringify({before,after}));
  await ctx.close();
}

// Bug da borda direita: 30 avanços rápidos com foto lenta — nenhum cabide/sombra sem a roupa, nenhuma cópia
async function edge(browser,w,h){
  const vp=`${w}x${h} borda`;const {ctx,page,errors,mobile}=await open(browser,w,h,{latency:400});
  await toRail(page,mobile?60:40);await page.evaluate(()=>window.GBRailScene&&document.querySelector('#railViewport').dispatchEvent(new Event('pointerdown')));
  await page.waitForFunction(()=>GBRailScene.phase==='live',null,{timeout:8000}).catch(()=>{});
  const res=await page.evaluate(()=>new Promise(done=>{
    const V=document.querySelector('#railViewport').getBoundingClientRect();let frames=0,bad=0;const who=new Set();
    const ok=i=>i&&i.getAttribute('src')&&i.complete&&i.naturalWidth>0;
    const tick=()=>{frames++;let n=0;
      document.querySelectorAll('#railItems .r10-item:not([hidden])').forEach(c=>{
        const r=c.querySelector('.hg-fig').getBoundingClientRect();if(r.right<V.left||r.left>V.right)return;
        if(+getComputedStyle(c.querySelector('.hg')).opacity===0)return;
        if(!ok(c.querySelector('.hg:not(.is-leaving) .hg-fig img'))){n++;who.add(c.dataset.railItem)}});
      if(n)bad++;if(frames<300)requestAnimationFrame(tick);else done({frames,bad,who:[...who]})};
    let i=0;const nav=setInterval(()=>{document.querySelector('#railNext').click();if(++i>=30)clearInterval(nav)},140);requestAnimationFrame(tick);
  }));
  check(vp,'V11 bug borda: nenhum quadro com cabide/sombra sem a foto da roupa (foto a 400 ms)',res.bad===0,JSON.stringify(res));
  await page.waitForTimeout(700);
  const rest=await settle(page);
  const st=await page.evaluate(()=>{const it=GBRail.items()[GBRail.state.index];return{cards:document.querySelectorAll('#railItems .r10-item').length,
    hgMax:Math.max(...[...document.querySelectorAll('.r10-item')].map(i=>i.querySelectorAll(':scope .r10-turn>.hg').length)),leaving:document.querySelectorAll('.hg.is-leaving').length,
    tags:document.querySelectorAll('#railItems .gb-tags').length,tagN:document.querySelectorAll('#railItems .gb-tag').length,want:it.variants.length>1?it.variants.length:0,
    over:document.documentElement.scrollWidth-innerWidth}});
  check(vp,'V11 bug borda: em repouso uma lista única, um cabide por peça, ≤1 grupo de fichas correto, sem overflow',
    st.cards===63&&st.hgMax===1&&st.leaving===0&&st.tags<=1&&st.tagN===st.want&&st.over<=0,JSON.stringify({rest:rest.index,...st}));
  check(vp,'V11 bug borda: zero erro de JavaScript',errors.length===0,errors.join(' | '));
  await ctx.close();
}

// Movimento reduzido: loja pronta, sem dolly, sem vento, sem rig — navegação completa
async function reducedRun(browser,w,h){
  const vp=`${w}x${h} reduced`;const {ctx,page,errors,mobile}=await open(browser,w,h,{reduced:true});
  const r0=await page.evaluate(()=>({phase:GBRailScene.phase,tier:GBRailScene.tier,cam:GBRailScene.camera,chap:!!document.querySelector('#rail>.gb-chap')}));
  check(vp,'V11 reduzido: plano final pronto, sem capítulo nem dolly',r0.phase==='live'&&r0.cam.scale===1&&!r0.chap&&r0.tier.startsWith('static'),JSON.stringify(r0));
  await toRail(page,mobile?60:40);
  const samples=[];for(let i=0;i<12;i++){samples.push(await page.evaluate(()=>({w:GBRail.state.wind,rig:document.querySelectorAll('.r10-item.is-rig').length})));await page.waitForTimeout(250)}
  check(vp,'V11 reduzido: sem vento e sem rig',samples.every(x=>x.w===0&&x.rig===0),JSON.stringify(samples.slice(0,3)));
  await page.locator('#railNext').click();const s=await settle(page);
  check(vp,'V11 reduzido: navegação completa',s.index===3,JSON.stringify(s));
  check(vp,'V11 reduzido: zero erro de JavaScript',errors.length===0,errors.join(' | '));
  await ctx.close();
}

// Capacidades de vista: só frente hoje; 360°/costas/lateral exigem aprovação + procedência + arquivo real
async function views(browser){
  const vp='views';const {ctx,page}=await open(browser,1280,800);
  const r=await page.evaluate(()=>{const V=GBRailViews,pid='gb-crt-003';
    return{today:V.resolve(pid),noApproval:V.resolve(pid,{[pid]:{views:{back:pid+':combo'},provenance:'x'}}),
      noProvenance:V.resolve(pid,{[pid]:{approved:true,views:{back:pid+':combo'}}}),missingFile:V.resolve(pid,{[pid]:{approved:true,provenance:'sessão',views:{back:pid+':back'}}}),
      few:V.resolve(pid,{[pid]:{approved:true,provenance:'sessão',turntable:{frames:[pid+':combo',pid+':top']}}})}});
  check(vp,'V11 vistas: hoje só a frente (sem costas, lateral ou 360°)',r.today.front&&!r.today.back&&!r.today.side&&!r.today.rotate360&&!!r.today.reason,JSON.stringify(r.today));
  check(vp,'V11 vistas: sem aprovação, sem procedência ou sem arquivo real → indisponível',!r.noApproval.back&&!r.noProvenance.back&&!r.missingFile.back);
  check(vp,'V11 vistas: 360° exige ≥12 quadros reais',!r.few.rotate360);
  await ctx.close();
}

const browser=await chromium.launch();
try{
  await views(browser);
  for(const [w,h] of VIEWPORTS){console.log(`→ ${w}x${h}`);await film(browser,w,h);await edge(browser,w,h)}
  await interrupt(browser,1440,900);await interrupt(browser,390,844);
  await touch(browser,390,844);await touch(browser,320,720);
  await reducedRun(browser,1440,900);await reducedRun(browser,390,844);
}finally{await browser.close()}
console.log('\nMÉTRICAS DO DOLLY (medidas neste ambiente headless, sem GPU dedicada):');
for(const m of metrics)console.log(`  ${m.vp}: dolly ${m.dollyMs} ms · quadro médio ${m.frameMeanMs} ms · p95 ${m.frameP95Ms} ms · long tasks ${m.longTasks}`);
console.log(failures?`\n✗ ${failures} falha(s)`:'\n✓ GB RAIL V11: tudo verde');
process.exit(failures?1:0);
