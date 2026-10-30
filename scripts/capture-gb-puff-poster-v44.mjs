import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdirSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
const port=8787,url='http://127.0.0.1:'+port+'/';
const server=spawn('python3',['-m','http.server',String(port),'--directory','dist'],{stdio:'ignore'});
let browser;
try{
  await new Promise(resolve=>setTimeout(resolve,1300));
  browser=await chromium.launch({headless:true,args:[
    '--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader'
  ]});
  const page=await browser.newPage({viewport:{width:1200,height:800},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url+'?gbCapturePoster=1',{waitUntil:'domcontentloaded',timeout:35000});
  await page.waitForFunction(()=>window.GBPlushV43?.mounted,{timeout:12500});
  await page.waitForFunction(()=>window.GB_PUFF_RENDERED===true,{timeout:20000});
  // Capture the precise user-provided shader rendered at rest. Not an AI asset.
  await page.waitForTimeout(380);
  const canvas=page.locator('.gb-plush-react-root canvas');
  const bounds=await canvas.boundingBox();
  assert(bounds?.width>700 && bounds.height>450,'GPU canvas bounds invalid');
  mkdirSync('tmp',{recursive:true});
  await canvas.screenshot({path:'tmp/gb-puff-full-v44.png',animations:'disabled'});
  console.log(JSON.stringify({posterScreenshot:true,bounds,errors,originalFur:true}));
  assert(!errors.length,'GPU capture JS errors '+errors.join(' | '));
  assert(existsSync('tmp/gb-puff-full-v44.png'),'no poster created');
}finally{
  await browser?.close();server.kill();
}
