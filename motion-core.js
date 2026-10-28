/* GB IMPORTS / MOTION CORE (V07)
 * Gramática única de movimento para todas as cenas: tokens, preferências, um único relógio rAF
 * que só roda enquanto há algo animando, molas interrompíveis, visibilidade, gesto e FLIP.
 * Carregado antes das camadas de cena; nenhuma dependência externa.
 */
(function(){
'use strict';
const mq=q=>window.matchMedia?matchMedia(q):{matches:false,addEventListener(){}};

/* ---------- Tokens: duração e curva por "massa" percebida ---------- */
const Tokens={
  dur:{fast:180,normal:480,hero:820,settle:220,prep:90},
  ease:{
    out:'cubic-bezier(.2,.8,.2,1)',     // objeto chegando
    inOut:'cubic-bezier(.7,0,.3,1)',    // cortina / troca de capítulo
    soft:'cubic-bezier(.25,.1,.25,1)',
  },
  // molas: k rigidez, z amortecimento relativo (1 = crítico)
  spring:{object:{k:120,z:.86},hanger:{k:95,z:.42},ui:{k:260,z:1},heavy:{k:70,z:.9}},
};

/* ---------- Preferências e capacidade do aparelho ---------- */
const Prefs={
  reduced:mq('(prefers-reduced-motion: reduce)').matches,
  coarse:mq('(pointer: coarse)').matches,
  fine:mq('(pointer: fine)').matches,
  hoverNone:mq('(hover: none)').matches,
  saveData:!!(navigator.connection&&navigator.connection.saveData),
  // aparelho modesto: menos camadas de luz, sem parallax e sem segunda cortina
  lite:false,
};
Prefs.lite=Prefs.reduced||Prefs.saveData||(navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2);
mq('(prefers-reduced-motion: reduce)').addEventListener?.('change',e=>{Prefs.reduced=e.matches;document.documentElement.classList.toggle('gb-reduced',e.matches)});
document.documentElement.classList.toggle('gb-reduced',Prefs.reduced);
document.documentElement.classList.toggle('gb-lite',!!Prefs.lite);

/* ---------- Relógio: um rAF compartilhado, parado quando ninguém precisa ---------- */
const jobs=new Set();let raf=0,last=0;
function frame(t){
  const dt=Math.min(.034,last?(t-last)/1000:.016)||.016;last=t;
  for(const fn of [...jobs]){let keep=false;try{keep=fn(dt,t)!==false}catch(e){console.error(e)}if(!keep)jobs.delete(fn)}
  raf=jobs.size?requestAnimationFrame(frame):0;if(!raf)last=0;
}
const Ticker={
  add(fn){jobs.add(fn);if(!raf){last=0;raf=requestAnimationFrame(frame)}return()=>jobs.delete(fn)},
  get active(){return jobs.size},
};

/* ---------- Mola interrompível: parte sempre do estado atual ---------- */
class Spring{
  constructor(value=0,{k=120,z=.86}=Tokens.spring.object){this.x=value;this.v=0;this.target=value;this.k=k;this.c=2*Math.sqrt(k)*z}
  set(target,impulse=0){this.target=target;this.v+=impulse;return this}
  jump(v){this.x=this.target=v;this.v=0;return this}
  step(dt){this.v+=((this.target-this.x)*this.k-this.v*this.c)*dt;this.x+=this.v*dt;return this.x}
  get settled(){return Math.abs(this.target-this.x)<.0015&&Math.abs(this.v)<.004}
}

/* ---------- Visibilidade: um IntersectionObserver por configuração ---------- */
const observers=new Map();
function onVisible(el,cb,{margin='0px',threshold=0}={}){
  if(!el)return()=>{};
  if(!('IntersectionObserver'in window)){cb(true);return()=>{}}
  const key=margin+'|'+threshold;let entry=observers.get(key);
  if(!entry){const map=new Map();entry={map,io:new IntersectionObserver(es=>es.forEach(e=>map.get(e.target)?.forEach(f=>f(e.isIntersecting,e))),{rootMargin:margin,threshold})};observers.set(key,entry)}
  const list=entry.map.get(el)||[];list.push(cb);entry.map.set(el,list);entry.io.observe(el);
  return()=>{const l=entry.map.get(el)||[];entry.map.set(el,l.filter(f=>f!==cb));if(!entry.map.get(el).length){entry.map.delete(el);entry.io.unobserve(el)}};
}

/* ---------- Gesto: eixo dominante, 1:1, velocidade, cancelamento e clique pós-arrasto ---------- */
function drag(el,{axis='x',threshold=8,onStart,onMove,onEnd,ignore}={}){
  let s=null,suppress=false;
  const down=e=>{if(e.button>0||(ignore&&e.target.closest(ignore)))return;s={id:e.pointerId,pt:e.pointerType,x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,lt:performance.now(),v:0,active:false};suppress=false};
  const move=e=>{
    if(!s||e.pointerId!==s.id)return;
    const dx=e.clientX-s.x,dy=e.clientY-s.y,main=axis==='x'?dx:dy,cross=axis==='x'?dy:dx;
    if(!s.active){
      if(Math.abs(cross)>threshold&&Math.abs(cross)>Math.abs(main)){s=null;return} // gesto do outro eixo: libera a rolagem
      if(Math.abs(main)<threshold)return;
      s.active=true;suppress=true;el.setPointerCapture?.(e.pointerId);el.classList.add('is-dragging');onStart?.(s)
    }
    const now=performance.now(),d=(axis==='x'?e.clientX-s.lx:e.clientY-s.ly),dtm=Math.max(8,now-s.lt);
    s.v=s.v*.55+(d/dtm*1000)*.45;s.lx=e.clientX;s.ly=e.clientY;s.lt=now;
    onMove?.(main,s);
  };
  const up=e=>{if(!s||(e&&e.pointerId!==s.id))return;const st=s;s=null;el.classList.remove('is-dragging');if(st.active){onEnd?.(st.v,st,e&&e.type==='pointercancel');setTimeout(()=>{suppress=false},60)}};
  el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move,{passive:true});
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  // clique logo após arrasto não abre nada
  el.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation()}},true);
  return{get dragging(){return!!s?.active},destroy(){el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up)}};
}

/* ---------- FLIP: continuidade de objeto quando não há View Transitions ---------- */
function flipClone(fromEl,toEl,{duration=Tokens.dur.hero,easing=Tokens.ease.out}={}){
  if(!fromEl||!toEl||Prefs.reduced||!fromEl.animate)return Promise.resolve();
  const a=fromEl.getBoundingClientRect(),b=toEl.getBoundingClientRect();
  if(!a.width||!b.width)return Promise.resolve();
  const ghost=fromEl.cloneNode(true);ghost.removeAttribute('id');
  Object.assign(ghost.style,{position:'fixed',left:b.left+'px',top:b.top+'px',width:b.width+'px',height:b.height+'px',margin:0,zIndex:400,pointerEvents:'none',transformOrigin:'0 0',display:'grid',placeItems:'center'});
  document.body.appendChild(ghost);toEl.style.visibility='hidden';
  const sx=a.width/b.width,sy=a.height/b.height,s=Math.min(sx,sy);
  const anim=ghost.animate([{transform:`translate(${a.left-b.left}px,${a.top-b.top}px) scale(${s})`},{transform:'none'}],{duration,easing});
  return anim.finished.catch(()=>{}).then(()=>{ghost.remove();toEl.style.visibility=''});
}

/* ---------- will-change só enquanto anima ---------- */
function animating(el,on){if(el)el.style.willChange=on?'transform, opacity':''}

/* ---------- MediaSlot: produto/vista/estado da mídia sem prender o layout ao desenho ---------- */
const VIEW_ALT={combo:'conjunto completo',top:'parte superior',bottom:'parte inferior',front:'frente',back:'costas',detail:'detalhe'};
const Media={
  // ProductMedia: {productId, view, src, status:'official-photo'|'concept-study'|'pending', alt}
  product(p,view='combo'){
    const set=window.GB_ASSETS?.[p.id]||{},src=set[view]||null;
    return{productId:p.id,view,src,status:src?'official-photo':(p.single?'pending':'concept-study'),alt:`${p.name} / ${VIEW_ALT[view]||view}`};
  },
  // Mídia de campanha (foto/filme autorizados) por slot; vazio = composição de estudo.
  campaign(slot){return window.GB_CAMPAIGN_MEDIA?.[slot]||null},
};

window.GBMotion={Tokens,Prefs,Ticker,Spring,onVisible,drag,flipClone,animating,Media,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),lerp:(a,b,t)=>a+(b-a)*t};
})();
