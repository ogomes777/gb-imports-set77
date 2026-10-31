/* GB IMPORTS / PUFF INTRO V45 — acceptance suite (03_QA/MATRIZ_ACEITE.md, the automatable part).
 * Serve the build first:  node scripts/build.mjs && python3 -m http.server 8080 --directory dist
 *   node tests/puff-intro-v45.mjs [baseUrl]      (protected preview: GB_SHARE=<url with _vercel_share> as well)
 * Headless Chromium rasterises WebGL in software (SwiftShader), which visitors never get live: the default runs
 * cover the poster path, `?gbPuffLive=1` forces the original PlushTile live to test fibres, cross-fade and teardown.
 */
import {chromium} from 'playwright';

const BASE=(process.argv[2]||'http://127.0.0.1:8080/').replace(/\/?$/,'/');
const results=[];let failures=0;
const check=(sc,name,ok,detail='')=>{results.push({sc,name,ok});if(!ok)failures++;console.log(`  ${ok?'✓':'✗'} [${sc}] ${name}${ok?'':' '+detail}`)};
const browser=await chromium.launch();
// GB_FROM=<n>: start at section n (1 poster, 2 live, 3 touch, 4 failures, 5 routes, 6 revisit) to resume a long remote run
const FROM=+(process.env.GB_FROM||1);

async function open(sc,{w=1440,h=900,path='',reduced=false,touch=false,cpu=0,block=[],init=null}={}){
  const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:touch,isMobile:touch,deviceScaleFactor:1,reducedMotion:reduced?'reduce':'no-preference'});
  const page=await ctx.newPage();
  const errors=[],bad=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/net::ERR_FAILED|Failed to load resource/.test(m.text()))errors.push(m.text())});
  page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
  page.on('request',r=>requests.push(r.url()));
  for(const pat of block)await page.route(pat,r=>r.abort());
  if(cpu){const cdp=await ctx.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu})}
  // sample the stage every frame from the first script: what is the first brand object that becomes visible?
  await page.addInitScript(()=>{
    window.__puff={frames:[],fin:null};
    document.addEventListener('gb:intro-finished',e=>{window.__puff.fin={...e.detail,at:performance.now()}});
    const tick=()=>{
      const h=document.getElementById('gbRibbonBoot');
      if(h&&h.isConnected){
        const cam=h.querySelector('.gb-puff-camera'),poster=h.querySelector('.gb-puff-poster'),live=h.querySelector('.gb-puff-live');
        const camOp=cam?+getComputedStyle(cam).opacity:0;
        window.__puff.frames.push({t:performance.now(),camOp,
          poster:!!(poster&&poster.getAttribute('src')&&poster.complete&&poster.naturalWidth),
          posterOp:poster?+getComputedStyle(poster).opacity:0,
          liveOp:live?+getComputedStyle(live).opacity:0,
          canvas:live?.querySelector('canvas')?[live.querySelector('canvas').width,live.querySelector('canvas').height]:null,
          flat:[...h.querySelectorAll('img,svg,object,use')].filter(e=>/monograma|\.svg/.test(e.getAttribute('src')||e.getAttribute('href')||'')).length,
          bg:getComputedStyle(h).backgroundColor,state:h.dataset.state||'',brush:window.GBPuffIntro?.brush||0,gold:!!document.querySelector('.gb-intro.is-gold')});
      }
      else if(document.querySelector('.gb-intro.is-gold'))window.__puff.goldAfter=true;
      if(window.__puff.frames.length<1200)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  if(init)await page.addInitScript(init);
  // protected Vercel preview: GB_SHARE (a _vercel_share URL) sets the access cookie for this context first
  if(process.env.GB_SHARE){const pre=await ctx.newPage();await pre.goto(process.env.GB_SHARE,{waitUntil:'commit'});await pre.close()}
  const t0=Date.now();
  await page.goto(BASE+path,{waitUntil:'commit'});
  return {ctx,page,errors,bad,requests,t0};
}
const finished=page=>page.waitForFunction(()=>window.__puff.fin||(window.GBPuffIntro&&GBPuffIntro.removed&&GBPuffIntro.state!=='idle'),null,{timeout:20000}).then(()=>true).catch(()=>false);
const GBPuffIntroReason=r=>r!=='skip';
const firstBrand=page=>page.evaluate(()=>{const f=window.__puff.frames.find(x=>x.camOp>.02);return f?{...f}:null});

// 1. Desktop, default policy. Software GPU here → the real-fur poster is the brand object, then the dive.
if(FROM<=1){
  const sc='1440 poster';
  const {ctx,page,errors,bad,requests}=await open(sc);
  const ok=await finished(page);
  const s=await page.evaluate(()=>({api:{state:GBPuffIntro.state,mode:GBPuffIntro.mode,reason:GBPuffIntro.reason,removed:GBPuffIntro.removed,frames:GBPuffIntro.frames,tl:GBPuffIntro.timeline},fin:window.__puff.fin,
    playing:document.documentElement.classList.contains('gb-ribbon-intro-playing'),hero:!!document.querySelector('#heroArt,#heroStage'),
    heroVisible:getComputedStyle(document.querySelector('#inicio')||document.body).visibility,core:window.GB_CORE_READY,v12wall:!!document.querySelector('.gb-intro:not(.is-gold)')}));
  const fb=await firstBrand(page);
  check(sc,'intro termina e remove o palco (estado finished, host fora do DOM)',ok&&s.api.removed,JSON.stringify(s.api));
  check(sc,'primeiro objeto de marca visível é o poster de pelo real (decodificado), nunca um ícone chapado',!!fb&&fb.poster&&fb.flat===0,JSON.stringify(fb));
  check(sc,'palco preto (nenhum quadro branco)',(await page.evaluate(()=>window.__puff.frames.every(f=>/rgba?\(0, 0, 0/.test(f.bg)))),'');
  check(sc,'poster aparece cedo (< 1,2 s) e a loja abre antes do watchdog (≤ 6 s)',s.api.tl.posterShown>0&&s.api.tl.posterShown<1200&&s.api.tl.finished<=6000,JSON.stringify(s.api.tl));
  check(sc,'loja inicia em paralelo (boot do core aos ~0,65 s, não no fim da intro)',s.api.tl.coreBoot>0&&s.api.tl.coreBoot<1500,JSON.stringify(s.api.tl));
  check(sc,'depois da intro: página visível, hero presente, sem o muro escuro antigo da V12 (só o dourado do mergulho), core pronto',!s.playing&&s.hero&&s.heroVisible==='visible'&&!s.v12wall&&s.core===true,JSON.stringify(s));
  check(sc,'GPU por software não roda o shader para visitantes (0 quadros live) nem baixa o chunk do PlushTile',s.api.mode==='poster'&&s.api.frames===0&&!requests.some(u=>/gb-plush\./.test(u)),JSON.stringify(s.api));
  const gold=await page.evaluate(()=>window.__puff.frames.some(f=>f.gold)||!!window.__puff.goldAfter);
  const goldGone=await page.waitForFunction(()=>!document.querySelector('.gb-intro'),null,{timeout:6000}).then(()=>true).catch(()=>false);
  check(sc,'no mergulho a abertura da landing chega em dourado (muro amarelo que explode em blocos, V12) e sai sozinha',gold&&goldGone,JSON.stringify({gold,goldGone}));
  check(sc,'sem 404 e sem erro de JS',!bad.length&&!errors.length,JSON.stringify({bad,errors}));
  await ctx.close();
}

// 2. Live (forced on the software GPU): PlushTile original, verified frame, fibres answer the cursor, teardown.
if(FROM<=2){
  const sc='1440 live';
  const {ctx,page,errors,bad}=await open(sc,{path:'?gbPuffLive=1&gbPuffHold=1'});
  const live=await page.waitForFunction(()=>window.GBPuffIntro&&(GBPuffIntro.timeline.liveReady>0||GBPuffIntro.removed),null,{timeout:20000}).then(()=>page.evaluate(()=>GBPuffIntro.timeline.liveReady>0)).catch(()=>false);
  check(sc,'PlushTile original monta e entrega um quadro verificado (pelo iluminado no centro)',live);
  if(live){
    const st=await page.evaluate(()=>({live:GBPuffIntro.live,canvas:GBPuffIntro.canvasSize,cls:document.getElementById('gbRibbonBoot').className}));
    check(sc,'canvas medido no palco visível (nunca 1×1 / quadrado preto)',st.canvas[0]>=600&&st.canvas[1]>=400,JSON.stringify(st.canvas));
    const noPoster=await page.evaluate(()=>window.__puff.frames.every(f=>!f.poster));
    check(sc,'live desde o primeiro objeto: nenhum quadro de poster antes (sem troca de tecido)',/is-live/.test(st.cls)&&noPoster,JSON.stringify({cls:st.cls,noPoster}));
    check(sc,'monograma GB local como arte do pelo, fios instanciados contados',st.live&&st.live.count>=1000&&st.live.requested>=st.live.count,JSON.stringify(st.live));
    // the cursor runs through the fur: the brush opens under it (PlushTile's own uBrush)
    // the cursor leaves the stage (brush closes), then runs through the fur (brush opens under it)
    await page.mouse.move(-1,-1).catch(()=>{});await page.dispatchEvent('#gbRibbonBoot .gb-puff-live > div','pointerleave').catch(()=>{});
    await page.waitForFunction(()=>window.GBPuffIntro&&GBPuffIntro.brush<.05,null,{timeout:8000}).catch(()=>{});
    const b0=await page.evaluate(()=>GBPuffIntro.brush);
    await page.mouse.move(600,380);await page.mouse.move(720,450,{steps:6});await page.mouse.move(820,470,{steps:4});
    const opened=await page.waitForFunction(b=>window.GBPuffIntro&&GBPuffIntro.brush>b+.1,b0,{timeout:12000}).then(()=>page.evaluate(()=>GBPuffIntro.brush)).catch(()=>0);
    check(sc,'cursor abre os fios (pincel do original sobe a partir do repouso) e a intro não pula por isso',b0<.05&&opened>b0+.1&&GBPuffIntroReason(await page.evaluate(()=>GBPuffIntro.reason)),JSON.stringify({b0,opened}));
    await page.evaluate(()=>GBPuffIntro.finish());
  }
  await finished(page);
  const td=await page.evaluate(()=>({removed:GBPuffIntro.removed,mounted:window.GBPlush?.mounted,canvas:GBPuffIntro.canvasSize,frames:GBPuffIntro.frames,host:!!document.getElementById('gbRibbonBoot')}));
  check(sc,'teardown: React desmontado, canvas liberado, host removido',td.removed&&td.mounted===false&&td.canvas[0]===0&&!td.host,JSON.stringify(td));
  check(sc,'sem 404 e sem erro de JS',!bad.length&&!errors.length,JSON.stringify({bad,errors}));
  await ctx.close();
}

// 3. Mobile touch: a finger on the puff moves the fibres and never skips; the skip control does.
if(FROM<=3){
  const sc='390 touch';
  const {ctx,page,errors,bad}=await open(sc,{w:390,h:844,touch:true,path:'?gbPuffLive=1&gbPuffHold=1'});
  const live=await page.waitForFunction(()=>window.GBPuffIntro&&(GBPuffIntro.timeline.liveReady>0||GBPuffIntro.removed),null,{timeout:20000}).then(()=>page.evaluate(()=>GBPuffIntro.timeline.liveReady>0)).catch(()=>false);
  if(live){
    const cdp=await ctx.newCDPSession(page);
    const tp=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
    await tp('touchStart',150,400);for(let i=1;i<=8;i++){await tp('touchMove',150+i*10,400+i*4);await page.waitForTimeout(30)}
    const during=await page.evaluate(()=>({brush:Math.max(GBPuffIntro.brush,...window.__puff.frames.slice(-40).map(f=>f.brush)),state:GBPuffIntro.state,reason:GBPuffIntro.reason}));
    await tp('touchEnd');
    check(sc,'dedo no puff abre os fios (pincel > 0,2) sem disparar a saída',during.brush>.2&&during.reason!=='skip',JSON.stringify(during));
  }else check(sc,'live forçado disponível para o teste de toque',false);
  check(sc,'sem 404 e sem erro de JS',!bad.length&&!errors.length,JSON.stringify({bad,errors}));
  // held live loop on a software GPU: leave first, so closing the context never waits on a busy frame
  await page.evaluate(()=>window.GBPuffIntro?.finish()).catch(()=>{});
  await page.waitForFunction(()=>window.GBPuffIntro?.removed,null,{timeout:15000}).catch(()=>{});
  await ctx.close();
}
// 3b. The skip control (no GPU involved): a tap on PULAR releases the store at once.
if(FROM<=3){
  const sc='390 pular';
  const {ctx,page,errors}=await open(sc,{w:390,h:844,touch:true});
  await page.waitForFunction(()=>window.GBPuffIntro?.visible,null,{timeout:12000});
  await page.waitForTimeout(1000);
  const t=await page.evaluate(()=>performance.now());
  await page.locator('.gb-puff-skip').tap({timeout:5000});
  const skipped=await page.waitForFunction(()=>window.GBPuffIntro&&GBPuffIntro.removed,null,{timeout:4000}).then(()=>true).catch(()=>false);
  const s=await page.evaluate(t=>({reason:GBPuffIntro.reason,ms:Math.round(GBPuffIntro.timeline.finished-(t-0)),tl:GBPuffIntro.timeline}),t);
  check(sc,'PULAR libera a loja em menos de 1 s',skipped&&s.reason==='skip',JSON.stringify(s));
  check(sc,'sem erro de JS',!errors.length,JSON.stringify(errors));
  await ctx.close();
}

// 4. Failure matrix: every branch releases the store; none shows a flat tile.
const failures4=[
  ['bundle bloqueado',{path:'?gbPuffLive=1',block:['**/_gb/gb-plush.*.js']},s=>s.mode==='poster'],
  ['poster bloqueado + live',{path:'?gbPuffLive=1',block:['**/gb-puff-poster-*.webp']},s=>s.mode==='live'],
  ['poster bloqueado + sem GPU',{block:['**/gb-puff-poster-*.webp']},s=>s.mode==='none'],
  ['core falha',{block:['**/_gb/gb-core-5.*.js']},s=>true],
  ['CPU 4× mais lenta',{cpu:4},s=>true],
  ['sem WebGL2',{path:'?gbPuffLive=1',init:()=>{delete window.WebGL2RenderingContext}},s=>s.mode==='poster'],
];
if(FROM<=4)for(const [name,opt,modeOk] of failures4){
  // GB_SKIP_FORCED_LIVE=1: over a remote preview, skip the forced software-GPU failure cases (covered locally)
  if(process.env.GB_SKIP_FORCED_LIVE&&/gbPuffLive/.test(opt.path||''))continue;
  const sc='falha: '+name;
  const {ctx,page,errors}=await open(sc,opt);
  const ok=await finished(page);
  const s=await page.evaluate(()=>({mode:GBPuffIntro.mode,reason:GBPuffIntro.reason,tl:GBPuffIntro.timeline,removed:GBPuffIntro.removed,playing:document.documentElement.classList.contains('gb-ribbon-intro-playing')}));
  const fb=await firstBrand(page);
  // forced live on a software GPU can block the main thread for seconds (that is why visitors never get it):
  // there the store must still open; the time bound applies to every real visitor path
  const forced=/gbPuffLive/.test(opt.path||'');
  check(sc,forced?'a loja abre (palco removido, página visível) mesmo com o live forçado na GPU por software':'a loja abre (palco removido, página visível) dentro do watchdog (saída começa ≤ 6 s)',
    ok&&s.removed&&!s.playing&&(forced||s.tl.transition<=(opt.cpu?6600:6000)),JSON.stringify(s));
  check(sc,'nenhum quadro de ícone chapado; marca, se houver, é pelo real',!fb||(fb.flat===0&&(fb.poster||fb.liveOp>0)),JSON.stringify(fb));
  check(sc,'modo esperado ('+s.mode+')',modeOk(s),JSON.stringify(s));
  if(!/bloqueado|falha/.test(name))check(sc,'sem erro de JS',!errors.length,JSON.stringify(errors));
  await ctx.close();
}

// 5. Reduced motion, deep links and routes: no intro, no plush chunk, store straight away.
// (python's http.server has no clean URLs: /gb/club.html is what Vercel serves for /gb/club)
if(FROM<=5)for(const [sc,opt] of [['reduced motion',{reduced:true}],['/#colecao',{path:'#colecao'}],['/gb/club',{path:'gb/club.html'}]]){
  const {ctx,page,errors,bad,requests}=await open(sc,opt);
  await page.waitForFunction(()=>window.GB_CORE_READY===true,null,{timeout:20000}).catch(()=>{});
  const s=await page.evaluate(()=>({host:!!document.getElementById('gbRibbonBoot'),state:window.GBPuffIntro?.state,frames:window.GBPuffIntro?.frames,core:window.GB_CORE_READY,
    playing:document.documentElement.classList.contains('gb-ribbon-intro-playing')}));
  check(sc,'sem intro: palco ausente, nenhum quadro, loja pronta',!s.host&&s.frames===0&&s.core===true&&!s.playing,JSON.stringify(s));
  check(sc,'não baixa o chunk do PlushTile nem o poster',!requests.some(u=>/gb-plush\.|gb-puff-poster/.test(u)),requests.filter(u=>/plush|poster/.test(u)).join(' '));
  check(sc,'sem 404 e sem erro de JS',!bad.length&&!errors.length,JSON.stringify({bad,errors}));
  await ctx.close();
}

// 6. Revisit in the same session: shorter hold.
if(FROM<=6){
  const sc='revisita';
  const {ctx,page}=await open(sc);
  await finished(page);
  const first=await page.evaluate(()=>GBPuffIntro.timeline);
  await page.reload({waitUntil:'commit'});
  await finished(page);
  const second=await page.evaluate(()=>GBPuffIntro.timeline);
  check(sc,'segunda visita na sessão segura o puff por menos tempo',second.transition-second.posterShown<first.transition-first.posterShown,JSON.stringify({first,second}));
  await ctx.close();
}

await browser.close();
console.log(`\n${results.length-failures}/${results.length} verificações aprovadas.`);
process.exit(failures?1:0);
