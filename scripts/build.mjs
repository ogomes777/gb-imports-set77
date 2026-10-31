#!/usr/bin/env node
// GB IMPORTS / build estático. Única dependência: a intro de pelúcia (PlushTile original, React) empacotada com esbuild.
// - Valida a sintaxe de todas as camadas JS (falha o build se houver erro).
// - Concatena CSS e JS na ordem do index.html em dois arquivos com hash (cache imutável).
// - Copia assets/, data/ e robots.txt para dist/.
// - Gera dist/gb-standalone.html: um único arquivo que abre offline (ativos locais embutidos).
// Uso: node scripts/build.mjs
import {readFileSync,writeFileSync,mkdirSync,rmSync,cpSync,existsSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';

const ROOT=join(dirname(fileURLToPath(import.meta.url)),'..');
const DIST=join(ROOT,'dist');
const read=f=>readFileSync(join(ROOT,f),'utf8');
const html=read('index.html');

const styles=[...html.matchAll(/<link href="\.\/([^"]+\.css)" rel="stylesheet"\/>/g)].map(m=>m[1]);
const scripts=[...html.matchAll(/<script defer="[^"]*" src="\.\/([^"]+\.js)"><\/script>/g)].map(m=>m[1]);
if(!styles.length||!scripts.length)throw new Error('Não encontrei CSS/JS locais no index.html');

for(const f of scripts){
  try{execFileSync(process.execPath,['--check',join(ROOT,f)],{stdio:'pipe'})}
  catch(e){console.error(`✗ Erro de sintaxe em ${f}\n${e.stderr}`);process.exit(1)}
}

// CSS: remove só comentários e linhas vazias (sem minificador agressivo, para não alterar seletores).
const css=styles.map(f=>`/* ${f} */\n`+read(f).replace(/\/\*[\s\S]*?\*\//g,'').replace(/\n\s*\n/g,'\n').trim()).join('\n');
// The intro is an independent render entrypoint: it begins before the heavy store JS.
const introScript='gb-puff-intro.js';
if(!scripts.includes(introScript))throw new Error('Intro JS missing');
const introJs=read(introScript).trim();
const restScripts=scripts.filter(f=>f!==introScript);
const hash=s=>createHash('sha1').update(s).digest('hex').slice(0,10);
const cssName='_gb/gb.'+hash(css)+'.css';
const introName='_gb/gb-intro.'+hash(introJs)+'.js';
// One ordered script per group, not a single half-megabyte blocking evaluation.
const coreGroups=[];
let group=[],size=0;
for(const f of restScripts){
  const bytes=Buffer.byteLength(read(f));
  if(group.length&&size+bytes>72000){
    coreGroups.push(group);
    group=[];size=0;
  }
  group.push(f);size+=bytes;
}
if(group.length)coreGroups.push(group);
const coreFiles=coreGroups.map((files,i)=>{
 const content=files.map(f=>'/* '+f+' */\n'+read(f).trim()+'\n;').join('\n');
 return {name:'_gb/gb-core-'+(i+1)+'.'+hash(content)+'.js',content,files};
});
const coreNames=coreFiles.map(part=>'./'+part.name);

rmSync(DIST,{recursive:true,force:true});
mkdirSync(join(DIST,'_gb'),{recursive:true});
writeFileSync(join(DIST,cssName),css);
for(const part of coreFiles)writeFileSync(join(DIST,part.name),part.content);
writeFileSync(join(DIST,introName),introJs);

// V45: the user's original PlushTile is its own chunk, loaded only by the landing intro. It is REQUIRED:
// a missing esbuild/React or a compile error fails the build — never a READY deploy with a flat fallback.
let plushName;
try{
  const esbuild=createRequire(import.meta.url)('esbuild');
  const out=await esbuild.build({
    entryPoints:[join(ROOT,'src/plush/gb-plush-entry.jsx')],bundle:true,write:false,platform:'browser',format:'iife',
    jsx:'automatic',target:['es2020'],minify:true,legalComments:'none',logLevel:'silent',
    define:{'process.env.NODE_ENV':'"production"'},
  });
  const text=out.outputFiles[0].text;
  if(!/gb:plush-ready/.test(text)||!/transformFeedbackVaryings/.test(text))throw new Error('bundle sem o renderizador PlushTile');
  plushName='_gb/gb-plush.'+hash(text)+'.js';
  writeFileSync(join(DIST,plushName),text);
}catch(err){
  console.error('✗ PlushTile (intro V45) não empacotou: '+(err.message||err)+'\n  Rode `npm ci` (esbuild + react + react-dom) antes do build.');
  process.exit(1);
}
const POSTER='assets/brand/gb-puff-poster-v44.webp';
if(!existsSync(join(ROOT,POSTER)))throw new Error('Poster de pelo real ausente: '+POSTER);
for(const d of ['assets','data'])cpSync(join(ROOT,d),join(DIST,d),{recursive:true});
if(existsSync(join(ROOT,'robots.txt')))cpSync(join(ROOT,'robots.txt'),join(DIST,'robots.txt'));

const stripLocal=h=>h
  .replace(/<link href="\.\/[^"]+\.css" rel="stylesheet"\/>/g,'')
  .replace(/<script defer="[^"]*" src="\.\/[^"]+\.js"><\/script>/g,'');
const coreBoot = [
'<script>',
'(()=>{',
' let started=false,index=0;',
' const groups='+JSON.stringify(coreNames)+';',
' window.GB_CORE_READY=false;window.GB_CORE_FAILED=false;',
' const next=()=>{',
'  if(index>=groups.length){window.GB_CORE_READY=true;document.dispatchEvent(new Event("gb:core-ready"));return;}',
'  const sc=document.createElement("script");sc.src=groups[index];sc.async=false;',
'  sc.onload=()=>{index++;if(index>=groups.length)next();else if(window.requestIdleCallback)requestIdleCallback(next,{timeout:90});else setTimeout(next,24)};',
'  sc.onerror=()=>{window.GB_CORE_FAILED=true;document.dispatchEvent(new Event("gb:core-ready"))};',
'  document.head.append(sc);',
' };',
' window.GB_BOOT_CORE=()=>{if(started)return;started=true;next()};',
// The intro starts the core ~0.65 s in; this timer is the store's own guarantee, independent of the intro.
' if(window.GBGlassRibbons?.opening)setTimeout(window.GB_BOOT_CORE,1200);',
' else window.GB_BOOT_CORE();',
'})();',
'</script>'
].join('\n');
// The poster (the fallback puff) is fetched early on the landing only; deep routes (/gb…, #colecao) never pay for it.
// The plush chunk is not preloaded: the intro requests it only after its GPU probe finds a real GPU.
const introPreload='<script>if(location.pathname==="/"&&(!location.hash||location.hash==="#inicio")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){'+
  '{const l=document.createElement("link");l.rel="preload";l.as="image";l.href="./'+POSTER+'";l.fetchPriority="auto";document.head.append(l)}}</script>';
const introGlobals='<script>window.GB_PLUSH_BUNDLE_SRC="./'+plushName+'";window.GB_PUFF_POSTER_URL="./'+POSTER+'"</script>';
let out=stripLocal(html)
 .replace('</head>',()=>introPreload+'\n<link href="./'+cssName+'" rel="stylesheet"/>\n</head>')
 .replace('</body>',()=>introGlobals+'\n<script src="./'+introName+'"></script>\n'+coreBoot+'\n</body>');
writeFileSync(join(DIST,'index.html'),out);

// V40 route entrypoints: emit real clean-URL HTML files for every visual route.
// This avoids relying solely on platform SPA rewrites for direct links / refresh.
// Each page shares the same hashed chunks and original storefront source of truth.
const experienceRoutes=[...read('gb-experience-v40.js').matchAll(/^\s*'(\/(?:gb|gb-studio)(?:\/[^']*)?)':\[/gm)]
  .map(match=>match[1]);
if(new Set(experienceRoutes).size!==experienceRoutes.length)throw new Error('Duplicate V40 route paths');
for(const route of experienceRoutes){
  const rel=route.slice(1)+'.html';
  mkdirSync(dirname(join(DIST,rel)),{recursive:true});
  writeFileSync(join(DIST,rel),out);
}
console.log('  GB V40 clean-route entrypoints: '+experienceRoutes.length);


// Standalone: CSS/JS inline e ativos ./assets/... como data URI.
const MIME={'.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.avif':'image/avif'};
const inlineAssets=s=>s.replace(/(?:\.\/|\/)assets\/[A-Za-z0-9_\-./]+\.(svg|png|webp|jpe?g|avif)/g,p=>{
  const rel=p.startsWith('./')?p.slice(2):p.replace(/^\/+/, '');
  const f=join(ROOT,rel);if(!existsSync(f))return p;
  return `data:${MIME[extname(f).toLowerCase()]};base64,${readFileSync(f).toString('base64')}`});
const fullJs=scripts.map(f=>'/* '+f+' */\n'+read(f).trim()+'\n;').join('\n');
const safeJs=fullJs.replace(/<\/script/gi,'<\\/script');
// Replacer em função: o código contém sequências como $' que String.replace interpretaria.
let standalone=stripLocal(html).replace('</head>',()=>`<style>\n${inlineAssets(css)}\n</style>\n</head>`).replace('</body>',()=>`<script>\n${inlineAssets(safeJs)}\n</script>\n</body>`);
writeFileSync(join(DIST,'gb-standalone.html'),inlineAssets(standalone));

const kb=f=>(statSync(join(DIST,f)).size/1024).toFixed(1)+' KB';
console.log('✓ build GB concluído em dist/');
console.log(`  ${cssName}  ${kb(cssName)}  (${styles.length} camadas)`);
console.log('  '+introName+'  '+kb(introName)+' (intro primeiro)');
console.log('  '+plushName+'  '+kb(plushName)+' (PlushTile original + React, só na landing)');
console.log('  '+coreFiles.length+' blocos JS da loja, '+restScripts.length+' camadas sequenciais');
for(const part of coreFiles)console.log('    '+part.name+'  '+kb(part.name)+'  '+part.files.join(', '));
console.log(`  index.html  ${kb('index.html')}`);
console.log(`  gb-standalone.html  ${kb('gb-standalone.html')}  (abre offline)`);
