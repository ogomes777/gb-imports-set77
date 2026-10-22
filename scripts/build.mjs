#!/usr/bin/env node
// GB IMPORTS / build estático sem dependências.
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
// JS: cada camada isolada por ';' — as camadas já são IIFEs ou declarações globais intencionais.
const js=scripts.map(f=>`/* ${f} */\n${read(f).trim()}\n;`).join('\n');
const hash=s=>createHash('sha1').update(s).digest('hex').slice(0,10);
const cssName=`_gb/gb.${hash(css)}.css`,jsName=`_gb/gb.${hash(js)}.js`;

rmSync(DIST,{recursive:true,force:true});
mkdirSync(join(DIST,'_gb'),{recursive:true});
writeFileSync(join(DIST,cssName),css);
writeFileSync(join(DIST,jsName),js);
for(const d of ['assets','data'])cpSync(join(ROOT,d),join(DIST,d),{recursive:true});
if(existsSync(join(ROOT,'robots.txt')))cpSync(join(ROOT,'robots.txt'),join(DIST,'robots.txt'));

const stripLocal=h=>h
  .replace(/<link href="\.\/[^"]+\.css" rel="stylesheet"\/>/g,'')
  .replace(/<script defer="[^"]*" src="\.\/[^"]+\.js"><\/script>/g,'');
let out=stripLocal(html).replace('</head>',()=>`<link href="./${cssName}" rel="stylesheet"/>\n<script defer src="./${jsName}"></script>\n</head>`);
writeFileSync(join(DIST,'index.html'),out);

// Standalone: CSS/JS inline e ativos ./assets/... como data URI.
const MIME={'.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.avif':'image/avif'};
const inlineAssets=s=>s.replace(/\.\/assets\/[A-Za-z0-9_\-./]+\.(svg|png|webp|jpe?g|avif)/g,p=>{
  const f=join(ROOT,p.slice(2));if(!existsSync(f))return p;
  return `data:${MIME[extname(f).toLowerCase()]};base64,${readFileSync(f).toString('base64')}`});
const safeJs=js.replace(/<\/script/gi,'<\\/script');
// Replacer em função: o código contém sequências como $' que String.replace interpretaria.
let standalone=stripLocal(html).replace('</head>',()=>`<style>\n${inlineAssets(css)}\n</style>\n</head>`).replace('</body>',()=>`<script>\n${inlineAssets(safeJs)}\n</script>\n</body>`);
writeFileSync(join(DIST,'gb-standalone.html'),inlineAssets(standalone));

const kb=f=>(statSync(join(DIST,f)).size/1024).toFixed(1)+' KB';
console.log('✓ build GB concluído em dist/');
console.log(`  ${cssName}  ${kb(cssName)}  (${styles.length} camadas)`);
console.log(`  ${jsName}  ${kb(jsName)}  (${scripts.length} camadas)`);
console.log(`  index.html  ${kb('index.html')}`);
console.log(`  gb-standalone.html  ${kb('gb-standalone.html')}  (abre offline)`);
