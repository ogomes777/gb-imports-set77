
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const BASE=process.argv[2]||process.env.BASE_URL||'http://127.0.0.1:8080/';
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox']});
for(const [width,height] of [[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
 await page.goto(BASE,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.GBFitting&&document.querySelector('#lookstudio .look-stage'),null,{timeout:15000});
 // The mobile flagship may restore scroll after DOMContentLoaded. Bring the
 // lazy-mounted fitting scene into view repeatedly until its observer fires.
 for(let attempt=0;attempt<18;attempt++){
   const mounted=await page.evaluate(()=>!!document.querySelector('#lookstudio .fit-scene'));
   if(mounted)break;
   await page.evaluate(()=>document.querySelector('#lookstudio .look-stage')
     ?.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForTimeout(350);
 }
 await page.evaluate(()=>document.querySelector('#lookstudio .look-stage')
   ?.scrollIntoView({block:'center',behavior:'instant'}));
 await page.waitForFunction(()=>window.GBActor&&window.GBTrue360,null,{timeout:45000}).catch(async err=>{
    const diagnostic=await page.evaluate(()=>({
      fit:!!window.GBFitting,actor:!!window.GBActor,volume:!!window.GBTrue360,
      scene:!!document.querySelector('#lookstudio .fit-scene'),
      canvas:!!document.querySelector('#lookstudio .gb-volume-canvas'),
      stage:document.querySelector('#lookstudio .look-stage')?.className,
      scroll:scrollY
    }));
    throw new Error('Actor mount not ready: '+JSON.stringify({diagnostic,errors,reason:err.message}));
  });
 await page.waitForTimeout(600);
 const beforeActivation=await page.evaluate(()=>({active:GBTrue360.active,visible:document.querySelector('#lookstudio .look-stage').getBoundingClientRect().top,scroll:scrollY,compare:document.querySelector('#lookstudio .look-stage').className}));
 console.log('ACTIVATION',width,beforeActivation);
 if(!beforeActivation.active)await page.evaluate(()=>GBTrue360.open());
 await page.waitForFunction(()=>window.GBTrue360.active,null,{timeout:8000});
 await page.waitForTimeout(1600);
 if(width===1440&&process.env.GB_SCREENSHOTS==='1')await page.screenshot({path:'preview-v23-front.jpg',type:'jpeg',quality:50});
 const before=await page.evaluate(()=>({state:GBActor.state,vertices:GBTrue360.vertices,canvas:document.querySelector('.gb-volume-canvas')?.width,photos:document.querySelectorAll('#gbFitFigure').length,renderer:getComputedStyle(document.querySelector('#gbFitFigure')).visibility}));
 assert(before.vertices>15000,JSON.stringify(before));
 assert(before.canvas>0,JSON.stringify(before));
 const approvedFront=await page.evaluate(()=>document.querySelector('.fit-scene')?.dataset.actorView==='reference-front');
 assert.equal(before.renderer,approvedFront?'visible':'hidden');
 const angleBefore=before.state.yaw;
 await page.evaluate(()=>GBActor.rotateTo(180));
 await page.waitForTimeout(1900);
 const angle=await page.evaluate(()=>GBTrue360.angle*180/Math.PI);
 assert(Math.abs(angle-180)<4,'rear angle '+angle);
 const dance=await page.evaluate(()=>{GBActor.dance(true);return GBActor.state.dancing});
 assert(dance===true);
 await page.waitForTimeout(250);
 const gazeRect=await page.locator('.gb-volume-canvas').boundingBox();
 await page.mouse.move(gazeRect.x+gazeRect.width*.83,gazeRect.y+gazeRect.height*.27,{steps:6});
 await page.waitForTimeout(450);
 const tracked=await page.evaluate(()=>GBTrue360.gaze);
 assert(tracked[0]>.1,'eye tracking '+tracked);
 await page.evaluate(()=>GBActor.dance(false));
 const sc=await page.evaluate(()=>({...GBActor.state,verts:GBTrue360.vertices,parts:document.querySelectorAll('#lookstudio .look-option').length,overflow:document.documentElement.scrollWidth-innerWidth}));
 assert(sc.overflow<=2,'overflow '+sc.overflow);
 assert(sc.dancing===false);
 console.log(JSON.stringify({viewport:width+'x'+height,passed:true,vertices:sc.verts,angle,tracked,ui:before.state.renderer,errors}));
 await page.close();
}
await browser.close();

