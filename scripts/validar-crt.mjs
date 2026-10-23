#!/usr/bin/env node
/** GB Imports CRT-01: validate customer-supplied visual archive before merge/deploy. */
import {readFileSync,statSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import vm from 'node:vm';
const root=resolve(import.meta.dirname,'..');
const input=JSON.parse(readFileSync(join(root,'data/catalogo-crt.json'),'utf8'));
const window={GB_ASSETS:{}};
vm.runInNewContext(readFileSync(join(root,'imported-products.js'),'utf8'),{window},{timeout:2000});
const declared=window.GB_IMPORTED_PRODUCTS||[],maps=window.GB_ASSETS||{},errors=[];
if(!Array.isArray(declared)||declared.length!==input.products.length)errors.push('Imported products count mismatch');
const ids=new Set(),paths=new Set();
for(const p of declared){
 if(!p?.id||ids.has(p.id))errors.push('Duplicate/invalid product id: '+p.id);
 ids.add(p.id);
 const obj=maps[p.id];
 if(!obj?.combo)errors.push('Product without combo media: '+p.id);
 for(const [view,path] of Object.entries(obj||{})){
  if(!['combo','top','bottom'].includes(view))errors.push('Unknown view: '+view);
  if(!path.startsWith('./assets/products/gb-crt/')||!/^\.\/assets\/products\/gb-crt\/gb-crt-\d{3}\.webp$/.test(path))errors.push('Unexpected media path '+path);
  const f=join(root,path);
  if(!existsSync(f)){errors.push('Missing '+path);continue;}
  const magic=readFileSync(f).subarray(0,12);
  if(magic.toString('ascii',0,4)!=='RIFF'||magic.toString('ascii',8,12)!=='WEBP'||statSync(f).size<1000)errors.push('Damaged WebP '+path);
  paths.add(path);
 }
}
const filePaths=readdirSync(join(root,'assets/products/gb-crt')).filter(x=>x.endsWith('.webp'));
if(ids.size!==input.total_product_cards)errors.push('Product count mismatch: '+ids.size);
if(filePaths.length!==input.total_unique_images)errors.push('Unique image count mismatch: '+filePaths.length);
if(filePaths.length!==paths.size)errors.push('Unmapped or missing image: '+filePaths.length+' files, '+paths.size+' mapped');
const html=readFileSync(join(root,'index.html'),'utf8');
const i1=html.indexOf('src="./assets-map.js"'),i2=html.indexOf('src="./imported-products.js"'),i3=html.indexOf('src="./main.js"');
if(i1<0||i2<i1||i3<i2)errors.push('Script order must be assets-map > imported-products > main');
if(!readFileSync(join(root,'main.js'),'utf8').includes('GB_IMPORTED_PRODUCTS||[]'))errors.push('Import missing from main.js');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('✓ CRT validated:',ids.size,'visual products,',filePaths.length,'WebP assets, zero broken paths');
