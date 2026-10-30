#!/usr/bin/env node
// GB IMPORTS / PUFF V45 — renders the poster from the real renderer, offline (never part of the boot or of CI).
// Mounts the bundled original PlushTile alone in a square stage, at full density (no device cap) and on any GPU,
// waits for the first verified lit frame plus a few settled frames, and saves the square frame as PNG.
// The poster is shown at min(100vw, 100dvh), the same framing the live tile has on screen, so poster → live is a
// cross-fade in place.
//   node scripts/build.mjs && python3 -m http.server 8080 --directory dist &
//   node scripts/capture-gb-puff-poster-v45.mjs [out.png] [size]
import {chromium} from 'playwright';
import {readdirSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]||join(ROOT,'gb-puff-poster-v45.png');
const size=+(process.argv[3]||1400);
const cap=+(process.argv[4]||260000);
const log=(...a)=>console.error(new Date().toISOString().slice(11,19),...a);
const base=process.env.GB_BASE||'http://127.0.0.1:8080/';
const bundle=readdirSync(join(ROOT,'dist/_gb')).find(f=>/^gb-plush\..+\.js$/.test(f));
if(!bundle)throw new Error('dist/_gb/gb-plush.*.js ausente: rode node scripts/build.mjs');

const browser=await chromium.launch();
try{
  // the stage sits inside a margin so the cursor can rest outside it (brush closed, tile upright)
  const page=await browser.newPage({viewport:{width:size+40,height:size+40},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'robots.txt');
  await page.setContent(`<!doctype html><html><head><base href="${base}"><style>html,body{margin:0;background:#000}body{padding:20px}#s{width:${size}px;height:${size}px}</style></head>
    <body><div id="s"></div><script src="./_gb/${bundle}"></script></body></html>`,{waitUntil:'load'});
  await page.mouse.move(4,4);
  await page.evaluate(cap=>{
    const s=document.getElementById('s');
    s.addEventListener('gb:plush-ready',()=>{window.__ready=true});
    GBPlush.mount(s,{strandCap:cap,allowSoftware:true,breeze:0});
  },cap);log('mounted',cap);
  // software rasterisers take seconds per frame at full density: generous, offline-only timeout
  await page.waitForFunction(()=>window.__ready,null,{timeout:600000,polling:500});
  log('first verified frame');
  const f0=await page.evaluate(()=>document.querySelector('#s>div').__gbPlush.frames);
  await page.waitForFunction(n=>document.querySelector('#s>div').__gbPlush.frames>=n+3,f0,{timeout:600000,polling:500});
  // breeze 0: once settled the loop stops, so the compositor is free to hand over a still frame
  let last=-1;for(;;){const n=await page.evaluate(()=>document.querySelector('#s>div').__gbPlush.frames);if(n===last)break;last=n;await page.waitForTimeout(4000)}
  log('settled');
  const stats=await page.evaluate(()=>({...document.querySelector('#s>div').__gbPlush}));
  await page.locator('#s canvas').screenshot({path:out,timeout:300000});
  console.log(JSON.stringify({out,size,stats,errors}));
}finally{await browser.close()}
