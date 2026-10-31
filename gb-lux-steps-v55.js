/* GB IMPORTS / V55 THE LUMINOUS PATH
   Connects actual Look Studio exit to GB three-step luxury guide.
   No ongoing JavaScript ticker; pulses run in CSS only while section is visible.
   Does not modify showroom rig, storefront state, shopping actions or navigation. */
(()=>{
'use strict';
const section=document.querySelector('.how-section.gb55-how');
const grid=section?.querySelector('.how-grid');
const cards=[...section?.querySelectorAll('.how-card[data-gb55-step]')||[]];
const links=[...section?.querySelectorAll('.gb55-track')||[]];
if(!section||!grid||cards.length!==3||links.length!==2||section.dataset.gb55)return;
section.dataset.gb55='ready';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const lite=!!navigator.connection?.saveData; // CSS opacity/transform loops remain light even on 4-core mobile.
if(lite)section.classList.add('gb55-lite');
const pointer=matchMedia('(pointer:fine) and (hover:hover)');
let pending=0;
function layout(){
 pending=0;
 const gridRect=grid.getBoundingClientRect(),vertical=matchMedia('(max-width:900px)').matches;
 for(let i=0;i<2;i++){
   const a=cards[i].getBoundingClientRect(),b=cards[i+1].getBoundingClientRect(),link=links[i];
   let left,top,width,height;
   if(vertical){
     const x=(a.left+a.width/2+b.left+b.width/2)/2;
     left=x-gridRect.left-1;
     top=a.bottom-gridRect.top+1;
     width=2;height=Math.max(0,b.top-a.bottom-2);
   }else{
     left=a.right-gridRect.left+1;
     top=(a.top+a.height*.28+b.top+b.height*.28)/2-gridRect.top;
     width=Math.max(0,b.left-a.right-2);
     height=2;
   }
   link.style.left=Math.round(left)+'px';
   link.style.top=Math.round(top)+'px';
   link.style.width=Math.round(width)+'px';
   link.style.height=Math.round(height)+'px';
   link.style.opacity=(vertical?height:width)>4?'1':'0';
 }
}
function schedule(){if(pending)return;pending=requestAnimationFrame(layout)}
schedule();
if('ResizeObserver'in window){
 const ro=new ResizeObserver(schedule);
 ro.observe(grid);cards.forEach(c=>ro.observe(c));
}else addEventListener('resize',schedule,{passive:true});
addEventListener('orientationchange',schedule,{passive:true});
if('IntersectionObserver'in window){
 const io=new IntersectionObserver(([entry])=>{
   section.classList.toggle('gb55-active',entry.isIntersecting&&!reduce.matches&&!lite);
 },{rootMargin:'90px 0px 90px 0px',threshold:0});
 io.observe(section);
}else section.classList.toggle('gb55-active',!reduce.matches&&!lite);
if(pointer.matches&&!reduce.matches&&!lite){
 cards.forEach(card=>{
   let frame=0;
   card.addEventListener('pointermove',ev=>{
     if(ev.pointerType!=='mouse'||frame)return;
     const x=ev.clientX,y=ev.clientY;
     frame=requestAnimationFrame(()=>{
       frame=0;
       const r=card.getBoundingClientRect();
       if(!r.width||!r.height)return;
       card.style.setProperty('--gb55-x',Math.max(0,Math.min(100,(x-r.left)/r.width*100)).toFixed(1)+'%');
       card.style.setProperty('--gb55-y',Math.max(0,Math.min(100,(y-r.top)/r.height*100)).toFixed(1)+'%');
     });
   },{passive:true});
   card.addEventListener('pointerleave',()=>{
     card.style.removeProperty('--gb55-x');
     card.style.removeProperty('--gb55-y');
   },{passive:true});
 });
}
window.GBLuxStepsV55={ready:true,version:55,get active(){return section.classList.contains('gb55-active')},measure:layout};
})();