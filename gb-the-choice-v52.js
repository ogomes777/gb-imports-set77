/* GB IMPORTS / V52 THE CHOICE — cinematic category cards.
   Original catalogue media stays source of truth; finite Web Animations, no GPU loops. */
(()=>{
'use strict';
const section=document.getElementById('categorias');
if(!section||section.dataset.gb52)return;
const tiles=[...section.querySelectorAll('.category-tile[data-go-filter]')];
if(tiles.length!==2)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(pointer:fine) and (hover:hover)');
const lite=!!navigator.connection?.saveData||(navigator.hardwareConcurrency||8)<=4;
const motion=!reduce.matches&&typeof Element.prototype.animate==='function';
const ease='cubic-bezier(.16,1,.3,1)';
const scenes=[];
const grid=section.querySelector('.category-layout');
const bridge=document.createElement('span');bridge.className='gb52-bridge';bridge.setAttribute('aria-hidden','true');grid.append(bridge);
function setup(tile,i){
 const object=tile.querySelector('.category-object'),media=object?.querySelector('img.garment-svg,svg.garment-svg');
 if(!media)return false;
 const parts=document.createElement('span');parts.className='gb52-parts';parts.setAttribute('aria-hidden','true');
 for(const side of ['a','b']){
   const part=document.createElement('span');part.className='gb52-piece gb52-piece-'+side;
   const cloned=media.cloneNode(true);cloned.removeAttribute('id');cloned.removeAttribute('data-pid');cloned.removeAttribute('data-mode');
   cloned.setAttribute('aria-hidden','true');
   if(cloned.tagName==='IMG'){cloned.alt='';cloned.loading='eager';cloned.decoding='async'}
   part.append(cloned);parts.append(part);
 }
 object.append(parts);
 const fx=document.createElement('span');fx.className='gb52-fx';fx.setAttribute('aria-hidden','true');
 fx.innerHTML='<i class="gb52-light"></i><i class="gb52-sweep"></i><i class="gb52-ring"></i><i class="gb52-impact"></i>';
 tile.prepend(fx);
 tile.classList.add('gb52-ready');tile.dataset.gb52Scene=i?'energy':'structure';
 const scene={tile,i,parts,fx,a:parts.querySelector('.gb52-piece-a'),b:parts.querySelector('.gb52-piece-b'),
  light:fx.querySelector('.gb52-light'),sweep:fx.querySelector('.gb52-sweep'),ring:fx.querySelector('.gb52-ring'),impact:fx.querySelector('.gb52-impact'),
  heading:tile.querySelector('.category-bottom h3'),running:[],active:false,seen:false,armed:true,frame:0,pointer:null};
 scenes.push(scene);
 if(fine.matches&&!lite){
   tile.addEventListener('pointermove',ev=>{
     if(ev.pointerType!=='mouse')return;
     scene.pointer={x:ev.clientX,y:ev.clientY};
     if(scene.frame)return;
     scene.frame=requestAnimationFrame(()=>{
       scene.frame=0;
       const r=tile.getBoundingClientRect(),p=scene.pointer;
       if(!p||!r.width||!r.height)return;
       const x=Math.max(0,Math.min(100,(p.x-r.left)/r.width*100));
       const y=Math.max(0,Math.min(100,(p.y-r.top)/r.height*100));
       tile.style.setProperty('--gb52-x',x.toFixed(1)+'%');
       tile.style.setProperty('--gb52-y',y.toFixed(1)+'%');
     });
   },{passive:true});
   tile.addEventListener('pointerleave',()=>{tile.style.removeProperty('--gb52-x');tile.style.removeProperty('--gb52-y')},{passive:true});
 }
 tile.addEventListener('pointerdown',ev=>{
   if(reduce.matches||ev.button>0||ev.target.closest('a,input,select'))return;
   const r=tile.getBoundingClientRect(),ring=document.createElement('i');
   ring.className='gb52-tap';ring.style.left=(ev.clientX-r.left)+'px';ring.style.top=(ev.clientY-r.top)+'px';fx.append(ring);
   if(typeof ring.animate!=='function'){ring.remove();return}
   const a=ring.animate([{opacity:0,transform:'translate(-50%,-50%) scale(.18)'},{opacity:.88,transform:'translate(-50%,-50%) scale(.65)',offset:.3},{opacity:0,transform:'translate(-50%,-50%) scale(1.8)'}],{duration:520,easing:ease});
   a.finished.then(()=>ring.remove(),()=>ring.remove());
 },{passive:true});
 return true;
}
if(!tiles.every(setup)){section.dataset.gb52='fallback';return}
section.dataset.gb52='ready';
function animate(s,el,keyframes,duration,delay=0,easing=ease){
 if(!el)return;
 const a=el.animate(keyframes,{duration,delay,easing,fill:'both'});s.running.push(a);
}
function stop(s){
 s.running.forEach(a=>a.cancel());s.running=[];s.tile.classList.remove('gb52-playing');s.active=false;
}
function enter(s){
 if(!motion){s.seen=true;s.armed=false;s.tile.classList.add('gb52-done');return}
 stop(s);s.armed=false;s.seen=true;s.active=true;
 const {tile,a,b,light,sweep,ring,impact,heading,i}=s;
 tile.classList.remove('gb52-done');tile.classList.add('gb52-playing');
 const delay=(i&&innerWidth>780)?155:0;
 const first=i?['16%','-21%','-7deg']:['-19%','-16%','-5deg'];
 const second=i?['-13%','29%','5deg']:['21%','-5%','6deg'];
 const frames=(v)=>[{opacity:0,transform:'translate3d('+v[0]+','+v[1]+',0) rotate('+v[2]+') scale(.91)'},{opacity:1,transform:'translate3d(0,0,0) rotate(0deg) scale(1)'}];
 animate(s,a,frames(first),1150,delay+220);
 animate(s,b,frames(second),1170,delay+430);
 animate(s,light,[{opacity:0,transform:'translate3d(-10%,0,0) scale(.7)'},{opacity:.9,transform:'translate3d(0,0,0) scale(1.18)',offset:.45},{opacity:.15,transform:'translate3d(0,0,0) scale(1)'}],1640,delay);
 animate(s,sweep,[{opacity:0,transform:'translate3d(-115%,0,0) rotate(12deg)'},{opacity:.75,transform:'translate3d(0,0,0) rotate(12deg)',offset:.5},{opacity:0,transform:'translate3d(125%,0,0) rotate(12deg)'}],1100,delay+320);
 animate(s,ring,[{opacity:0,transform:'translate(-50%,-50%) scale(.45)'},{opacity:.68,transform:'translate(-50%,-50%) scale(.92)',offset:.4},{opacity:.12,transform:'translate(-50%,-50%) scale(1.16)'}],1490,delay+220);
 animate(s,impact,[{opacity:0,transform:'translate(-50%,-50%) scale(.12)'},{opacity:i?.88:.56,transform:'translate(-50%,-50%) scale(.85)',offset:.26},{opacity:0,transform:'translate(-50%,-50%) scale(2.1)'}],660,delay+(i?1100:1010));
 animate(s,heading,[{opacity:.76,transform:'translateY(13px)'},{opacity:1,transform:'translateY(0)'}],680,delay+780);
 const jobs=s.running.slice();
 Promise.allSettled(jobs.map(x=>x.finished)).then(()=>{
   if(!s.active||s.running[0]!==jobs[0])return;
   stop(s);s.tile.classList.add('gb52-done');
 });
}
if(motion&&'IntersectionObserver' in window){
 const io=new IntersectionObserver(entries=>{
   for(const e of entries){
     const s=scenes.find(g=>g.tile===e.target);if(!s)continue;
     if(e.isIntersecting&&e.intersectionRatio>=.18&&s.armed){
       const wall=section.querySelector(':scope>.gb-chap');
       if(wall&&!wall.classList.contains('is-out')){
         const mo=new MutationObserver(()=>{if(!wall.isConnected||wall.classList.contains('is-out')){mo.disconnect();if(s.armed)enter(s)}});
         mo.observe(wall,{attributes:true,attributeFilter:['class']});
         setTimeout(()=>{mo.disconnect();if(s.armed&&s.tile.getBoundingClientRect().bottom>0)enter(s)},3800);
       }else enter(s);
     }else if(!e.isIntersecting&&s.seen){if(s.active)stop(s);s.armed=true}
   }
 },{threshold:[0,.18,.45],rootMargin:'0px 0px -4% 0px'});
 scenes.forEach(s=>io.observe(s.tile));
}else scenes.forEach(s=>{s.armed=false;s.seen=true;s.tile.classList.add('gb52-done')});
window.GBTheChoiceV52={version:52,ready:true,get states(){return scenes.map(s=>({category:s.tile.dataset.goFilter,playing:s.active,shown:s.seen,armed:s.armed}))}};
})();