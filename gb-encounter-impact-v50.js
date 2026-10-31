/* GB IMPORTS / V50 — ENCOUNTER SIGNAL.
   Camada aditiva sobre o palco V15. NUNCA move a mao do Gui, a cabeca do Vitin,
   as imagens ou a camera original. Apenas luz, choque e resposta ao cursor/toque.
   Sem loops de animacao, canvas, filtros caros ou listeners globais de scroll. */
(()=>{
'use strict';
const section=document.getElementById('editorial');
const model=section?.querySelector('.editorial-model');
if(!model||!('MutationObserver' in window)||!('Element' in window))return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const lite=(navigator.hardwareConcurrency||8)<=4||!!navigator.connection?.saveData;
const hover=matchMedia('(hover: hover) and (pointer: fine)').matches;
let mountObserver=null;
function attach(){
  const stage=model.querySelector('.gbe'),cam=stage?.querySelector('.gbe-cam');
  if(!cam||stage.dataset.gb50)return false;
  stage.dataset.gb50='ready';
  stage.classList.add('gb50-ready');

  const atmosphere=document.createElement('span');
  atmosphere.className='gb50-atmos';
  atmosphere.setAttribute('aria-hidden','true');
  atmosphere.innerHTML='<i class="gb50-core"></i><i class="gb50-gate"></i>'+
    '<i class="gb50-reveal gb50-reveal-left"></i><i class="gb50-reveal gb50-reveal-right"></i>'+
    '<i class="gb50-ground"></i><i class="gb50-orbit"></i>';
  cam.insertBefore(atmosphere,cam.firstChild);

  const strike=document.createElement('span');
  strike.className='gb50-strike';
  strike.setAttribute('aria-hidden','true');
  strike.innerHTML='<i class="gb50-flare"></i><i class="gb50-shock gb50-shock-a"></i>'+
    '<i class="gb50-shock gb50-shock-b"></i><i class="gb50-afterglow"></i>'+
    Array.from({length:lite?4:10},()=>'<i class="gb50-spark"></i>').join('');
  cam.append(strike);

  const glint=document.createElement('span');
  glint.className='gb50-glint';
  glint.setAttribute('aria-hidden','true');
  cam.append(glint);

  const effects=[...atmosphere.querySelectorAll('i'),...strike.querySelectorAll('i')];
  const sparks=[...strike.querySelectorAll('.gb50-spark')];
  let animations=[],wasPlaying=false,frame=0,lastPointer=null;
  const ease='cubic-bezier(.16,1,.3,1)';
  function stop(){
    animations.forEach(a=>a.cancel());
    animations=[];
    effects.forEach(el=>{el.style.opacity='';el.style.transform=''});
    glint.classList.remove('is-visible');
    stage.querySelectorAll('.gb50-tap').forEach(el=>el.remove());
  }
  const animate=(selector,frames,duration,delay=0,easing=ease)=>{
    const el=cam.querySelector(selector);
    if(!el)return;
    animations.push(el.animate(frames,{duration,delay,easing,fill:'both'}));
  };
  function play(){
    stop();
    if(reduce.matches)return;
    const w=cam.clientWidth;
    const small=lite||w<360;
    // 01 / O sinal GB abre o espaco. A luz acompanha a chegada real dos dois.
    animate('.gb50-gate',[
      {opacity:0,transform:'translateX(-50%) scaleY(.08) scaleX(.3)'},
      {opacity:.98,transform:'translateX(-50%) scaleY(1) scaleX(1.15)',offset:.32},
      {opacity:.75,transform:'translateX(-50%) scaleY(1.05) scaleX(2)',offset:.60},
      {opacity:0,transform:'translateX(-50%) scaleY(1.08) scaleX(4)'}
    ],990,0);
    animate('.gb50-core',[
      {opacity:0,transform:'scale(.6)'},
      {opacity:.93,transform:'scale(1.10)',offset:.48},
      {opacity:.22,transform:'scale(1)'}
    ],1300,80);
    animate('.gb50-reveal-left',[
      {opacity:0,transform:'translate3d(-35%,15%,0) scaleX(.35)'},
      {opacity:.98,transform:'translate3d(0,0,0) scaleX(1)',offset:.42},
      {opacity:0,transform:'translate3d(25%,-8%,0) scaleX(1.2)'}
    ],1100,190);
    animate('.gb50-reveal-right',[
      {opacity:0,transform:'translate3d(35%,15%,0) scaleX(.35)'},
      {opacity:.96,transform:'translate3d(0,0,0) scaleX(1)',offset:.42},
      {opacity:0,transform:'translate3d(-25%,-8%,0) scaleX(1.2)'}
    ],1160,285);
    animate('.gb50-ground',[
      {opacity:0,transform:'scaleX(.2) scaleY(.8)'},
      {opacity:.98,transform:'scaleX(1.1) scaleY(1.5)',offset:.32},
      {opacity:.26,transform:'scaleX(1.25) scaleY(.9)'}
    ],1550,780);
    // 02 / Os pes pousam. O cumprimento ORIGINAL V15 continua sem qualquer alteracao.
    animate('.gb50-orbit',[
      {opacity:0,transform:'translate(-50%,-50%) scale(.42)'},
      {opacity:.65,transform:'translate(-50%,-50%) scale(1)',offset:.45},
      {opacity:.16,transform:'translate(-50%,-50%) scale(1.18)'}
    ],1800,900);
    // 03 / Na batida do salve (~2.14 s na V15), o gesto dispara o choque.
    const hit=lite?1800:2140;
    animate('.gb50-flare',[
      {opacity:0,transform:'translate(-50%,-50%) scaleX(.08)'},
      {opacity:1,transform:'translate(-50%,-50%) scaleX(1.16)',offset:.23},
      {opacity:.65,transform:'translate(-50%,-50%) scaleX(1.35)',offset:.44},
      {opacity:0,transform:'translate(-50%,-50%) scaleX(1.6)'}
    ],740,hit);
    animate('.gb50-shock-a',[
      {opacity:0,transform:'translate(-50%,-50%) scale(.12)'},
      {opacity:1,transform:'translate(-50%,-50%) scale(.7)',offset:.24},
      {opacity:0,transform:'translate(-50%,-50%) scale(2.45)'}
    ],lite?600:930,hit+40);
    animate('.gb50-shock-b',[
      {opacity:0,transform:'translate(-50%,-50%) scale(.08)'},
      {opacity:.76,transform:'translate(-50%,-50%) scale(.7)',offset:.35},
      {opacity:0,transform:'translate(-50%,-50%) scale(2.7)'}
    ],lite?740:1120,hit+130);
    // Sobra um brilho discreto e estatico apos a revelacao, sem GPU em loop.
    animate('.gb50-afterglow',[
      {opacity:0,transform:'translate(-50%,-50%) scale(.5)'},
      {opacity:.32,transform:'translate(-50%,-50%) scale(1.1)',offset:.52},
      {opacity:.13,transform:'translate(-50%,-50%) scale(1)'}
    ],lite?830:1300,hit+120);
    sparks.forEach((el,i)=>{
      const angle=(-145+i*(290/Math.max(1,sparks.length-1)))*Math.PI/180;
      const dist=(small?Math.min(48,w*.17):Math.min(104,w*.33))*(i%3===0?.73:1);
      const dx=Math.round(Math.cos(angle)*dist),dy=Math.round(Math.sin(angle)*dist*.70);
      const start='translate(-50%,-50%) translate3d(0px,0px,0) rotate('+Math.round(angle*180/Math.PI)+'deg) scale(.3)';
      const end='translate(-50%,-50%) translate3d('+dx+'px,'+dy+'px,0) rotate('+Math.round(angle*180/Math.PI+24)+'deg) scale(.65)';
      animations.push(el.animate([
        {opacity:0,transform:start},
        {opacity:.96,transform:start,offset:.13},
        {opacity:.7,transform:end,offset:.63},
        {opacity:0,transform:end}
      ],{duration:small?540:780,delay:hit+75+i*19,easing:'cubic-bezier(.18,.75,.25,1)',fill:'both'}));
    });
  }
  function state(){
    const current=stage.classList.contains('is-playing');
    if(current&&!wasPlaying)play();
    else if(!current&&stage.classList.contains('is-pre'))stop();
    wasPlaying=current;
  }
  const sceneObserver=new MutationObserver(state);
  sceneObserver.observe(stage,{attributes:true,attributeFilter:['class']});
  state();

  if(hover&&!reduce.matches&&!lite){
    section.addEventListener('pointermove',event=>{
      if(event.pointerType==='touch'||!stage.classList.contains('is-done'))return;
      lastPointer={x:event.clientX,y:event.clientY};
      if(frame)return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        if(!lastPointer)return;
        const rect=cam.getBoundingClientRect();
        const inside=lastPointer.x>=rect.left&&lastPointer.x<=rect.right&&lastPointer.y>=rect.top&&lastPointer.y<=rect.bottom;
        glint.classList.toggle('is-visible',inside);
        if(inside)glint.style.transform='translate3d('+Math.round(lastPointer.x-rect.left)+'px,'+Math.round(lastPointer.y-rect.top)+'px,0) translate(-50%,-50%)';
      });
    },{passive:true});
    section.addEventListener('pointerleave',()=>glint.classList.remove('is-visible'),{passive:true});
  }
  section.addEventListener('pointerdown',event=>{
    if(reduce.matches||!stage.classList.contains('is-done')||event.target.closest('a,button,input,select'))return;
    const rect=cam.getBoundingClientRect();
    const x=event.clientX-rect.left,y=event.clientY-rect.top;
    if(x<0||x>rect.width||y<0||y>rect.height)return;
    // Toque = resposta luminosa pequena. Nao reinicia as pessoas nem bloqueia o clique.
    const ring=document.createElement('i');
    ring.className='gb50-tap';ring.style.left=x+'px';ring.style.top=y+'px';
    strike.append(ring);
    const a=ring.animate([
      {opacity:0,transform:'translate(-50%,-50%) scale(.18)'},
      {opacity:.85,transform:'translate(-50%,-50%) scale(.75)',offset:.24},
      {opacity:0,transform:'translate(-50%,-50%) scale(1.75)'}
    ],{duration:650,easing:ease,fill:'none'});
    a.finished.then(()=>ring.remove(),()=>ring.remove());
  },{passive:true});
  return true;
}
mountObserver=new MutationObserver(()=>{if(attach())mountObserver.disconnect()});
mountObserver.observe(model,{childList:true});
if(attach())mountObserver.disconnect();
})();