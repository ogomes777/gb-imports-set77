/* GB IMPORTS V50 / QA de regressao visual e estrutural.
   Rodar com dist/ em http://127.0.0.1:8080 e Playwright instalado. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const base=process.env.GB_TEST_URL||'http://127.0.0.1:8080';
try{
for(const vp of [
  {width:1440,height:900,reduce:false},
  {width:390,height:844,reduce:false},
  {width:320,height:720,reduce:false},
  {width:390,height:844,reduce:true}
]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height},
    hasTouch:vp.width<600,isMobile:false,deviceScaleFactor:1,
    reducedMotion:vp.reduce?'reduce':'no-preference'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.GB_CORE_READY&&!document.getElementById('gbRibbonBoot'),null,{timeout:35000});
  await page.evaluate(()=>{const e=document.querySelector('#editorial'),r=e.getBoundingClientRect();
    scrollTo({top:r.top+scrollY+(innerWidth<900?Math.max(0,r.height-innerHeight):0),behavior:'instant'});});
  await page.waitForFunction(()=>document.querySelector('.editorial-model')?.classList.contains('gbe-done'),null,{timeout:20000});
  const settled=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const stage=q('.gbe'),cam=q('.gbe-cam'),g=q('.gbe-char.is-gui'),v=q('.gbe-char.is-vitin');
    const ids=[...stage.querySelectorAll('img')].filter(n=>n.closest('.gbe-body')).map(n=>n.dataset.k+'/'+n.dataset.l);
    return{
      effect:!!q('.gb50-atmos')&&!!q('.gb50-strike')&&!!q('.gb50-glint'),
      assets:ids,figures:!!g&&!!v,
      handPivot:q('.gbe-hand')?.style.transformOrigin,
      headPivot:q('.gbe-head')?.style.transformOrigin,
      stageW:stage.getBoundingClientRect().width,
      camW:cam.getBoundingClientRect().width,
      horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
      reduceStyle:getComputedStyle(q('.gb50-strike')).display,
      running:document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest?.('.gbe')).length
    };
  });
  assert(settled.effect&&settled.figures&&settled.assets.length===4,'Rig or enhancement absent '+JSON.stringify(settled));
  assert(settled.handPivot&&settled.headPivot,'Original hand or head pivot lost');
  assert(settled.horizontalOverflow<=2,'New horizontal overflow '+JSON.stringify(settled));
  if(settled.running){
    const details=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest?.('.gbe')).map(a=>({tag:a.effect?.target?.tagName,cls:a.effect?.target?.className,duration:a.effect?.getTiming?.().duration,delay:a.effect?.getTiming?.().delay,currentTime:a.currentTime}))); 
    console.log('V50 POST_SCENE_TAIL',JSON.stringify(details));
    await page.waitForFunction(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest?.('.gbe')).length===0,null,{timeout:3500});
  }
  if(vp.reduce){
    assert.equal(settled.reduceStyle,'none','V50 VFX must be hidden for reduced motion');
    assert.deepEqual(errors,[],'Console page errors');
    await page.close();continue;
  }
  const replay=page.locator('.gbe-replay');
  await replay.click();
  const running=await page.evaluate(()=>{
    const q=s=>document.querySelector(s);
    const key=s=>q(s).getAnimations().flatMap(a=>a.effect?.getKeyframes?.()||[]).map(f=>f.transform||'');
    return{
      playing:q('.gbe').classList.contains('is-playing'),
      hand:key('.gbe-hand').some(t=>/rotate\((2\d|3\d)/.test(t)),
      head:key('.gbe-head').some(t=>/rotate\([4-6]/.test(t)),
      vfx:key('.gb50-shock-a').some(t=>t.includes('scale(2.45)')),
      flare:key('.gb50-flare').some(t=>t.includes('scaleX(1.16)')),
      sparks:q('.gb50-strike').querySelectorAll('.gb50-spark').length
    };
  });
  assert(running.playing&&running.hand&&running.head,'V15 original greeting was altered '+JSON.stringify(running));
  assert(running.vfx&&running.flare&&running.sparks>=4,'V50 impact is not active '+JSON.stringify(running));
  await page.waitForFunction(()=>document.querySelector('.editorial-model').classList.contains('gbe-done'),null,{timeout:18000});
  const idle=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.target?.closest?.('.gbe')).length);
  assert.equal(idle,0,'Original and V50 animations must finish');
  // Real pointer-down routed through the stage area. Decorative VFX must never intercept the replay.
  const point=await page.evaluate(()=>{const r=document.querySelector('.gbe-cam').getBoundingClientRect();
    return{x:Math.round(r.left+r.width*.55),y:Math.round(r.top+r.height*.48)};});
  if(point.x>5&&point.y>5&&point.x<vp.width-5&&point.y<vp.height-5){
    if(vp.width<600)await page.touchscreen.tap(point.x,point.y);
    else await page.mouse.click(point.x,point.y);
    const tap=await page.evaluate(()=>document.querySelectorAll('.gb50-tap').length);
    assert(tap>=1,'Pointer/touch feedback not visible');
  }
  mkdirSync('tmp/gb-encounter-v50',{recursive:true});
  await page.screenshot({path:'tmp/gb-encounter-v50/'+vp.width+'x'+vp.height+'.png',fullPage:false});
  assert.deepEqual(errors,[],'Console page errors '+JSON.stringify(errors));
  console.log('OK encounter V50 '+vp.width+'x'+vp.height+' / original greeting, impact, replay, idle, input');
  await page.close();
}
}finally{await browser.close();}
