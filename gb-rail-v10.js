/* GB IMPORTS / RAIL V10 — arara física com catálogo verdadeiro.
 * Uma única fonte de estado para a arara e o Object View: item, variante (cor fotografada), vista
 * (conjunto / superior / inferior) e orientação. Orientação é capacidade da mídia: o acervo atual só
 * tem fotos frontais (tier D), então só existe FRENTE; lateral e costas aparecem como "sem foto" e
 * nenhum verso é simulado. Variantes vêm da curadoria V10 (mesmo modelo fotografado em outra cor).
 * Movimento: GBMotion (um rAF compartilhado, molas interrompíveis, gesto 1:1); nada roda parado.
 * Geometria: cada peça é desenhada em "em" (1em = largura útil da roupa); o ponto (0,0) é onde o
 * gancho abraça a barra. Gancho, tecido, presilhas, sombra e fichas usam o mesmo espaço.
 */
(()=>{
'use strict';
const CAT=window.GB_RAIL_CATALOG,M=window.GBMotion;
const viewport=document.getElementById('railViewport'),track=document.getElementById('railItems'),viewer=document.getElementById('railViewer');
if(!CAT||!M||!viewport||!track||!viewer||typeof PRODUCTS==='undefined')return;
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=M.clamp,fmt=i=>String(i+1).padStart(2,'0'),f4=n=>(+n).toFixed(4);
const reduced=()=>M.Prefs.reduced,lite=()=>!!M.Prefs.lite;
const esc=s=>typeof escaped==='function'?escaped(s):String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const byId=id=>PRODUCTS.find(p=>p.id===id);
const META=CAT.media||{};
const ITEMS=CAT.items.filter(it=>it.variants.every(v=>byId(v.sourceId)));
const VIEW_NAME={combo:'CONJUNTO',top:'SUPERIOR',bottom:'INFERIOR'};
const live=q('#railCounter');
let announce=q('#r10Live');if(!announce){announce=document.createElement('p');announce.id='r10Live';announce.className='sr-only';announce.setAttribute('aria-live','polite');viewer.appendChild(announce)}

/* ============================== FIGURA: gancho + tecido + presilhas + sombra ============================== */
const HOOK=.2,BAR=.19,JAW=.045;
// mídia por referência "produto:vista": o arquivo vem de GB_ASSETS (no standalone já é a imagem embutida)
const srcOf=ref=>{const [pid,view]=String(ref).split(':');return window.GB_ASSETS?.[pid]?.[view]||''};
const meta=ref=>META[ref]||{w:1000,h:1000,bbox:[0,0,1,1],neckX:.5,clips:[[.22,0],[.78,0]],color:'#888'};
// moldura da área útil do recorte: a imagem é posicionada para que só o tecido conte na geometria
function frame(ref,fw){
  const m=meta(ref),[x0,y0,x1,y1]=m.bbox,bw=x1-x0,bh=y1-y0,fh=fw*(bh*m.h)/(bw*m.w);
  return{src:srcOf(ref),m,fw,fh,x0,y0,bw,bh,neck:(m.neckX-x0)/bw,iw:fw/bw,il:-x0/bw*fw,it:-(y0*m.h/m.w)*fw/bw};
}
const hookSVG=(x,cls='')=>`<svg class="hg-hook ${cls}" style="left:${f4(x-.06)}em" viewBox="0 0 30 60" aria-hidden="true"><path class="hg-hook-wire" d="M15 60V24c0-6 9-7 9-14 0-5-4-9-9-9-4 0-7 2.5-8 6"/><path class="hg-hook-neck" d="M11 50h8v10h-8z"/></svg>`;
// sombra da parede pré-calculada (scripts/medir_midia_rail.py): só uma imagem com opacidade, sem blur por quadro
const shadowOf=src=>/^\.\/assets\/products\/gb-crt\/gb-crt-\d+\.webp$/.test(src)?src.replace('/gb-crt/gb-crt-','/gb-crt/sombras/gb-crt-'):'';
function part(f,left,top,cls,alt,lazy){
  const box=`class="hg-part ${cls}" style="left:${f4(left)}em;top:${f4(top)}em;width:${f4(f.fw)}em;height:${f4(f.fh)}em"`,pos=`style="width:${f4(f.iw)}em;left:${f4(f.il)}em;top:${f4(f.it)}em"`;
  const img=(src,a)=>`<img ${lazy?'data-src':'src'}="${src}" alt="${a}" width="${f.m.w}" height="${f.m.h}" decoding="async" draggable="false" ${pos}>`;
  const sh=shadowOf(f.src);
  return{html:`<span ${box}>${img(f.src,esc(alt))}</span>`,shadow:`<span ${box}>${img(sh||f.src,'')}</span>`,baked:!!sh,minX:left,maxX:left+f.fw,maxY:top+f.fh};
}
// peça de cima: gancho no centro, gola/capuz encostado no pescoço do cabide
function shoulder(src,fw,cx,alt,lazy){
  const f=frame(src,fw),p=part(f,cx-f.neck*f.fw,HOOK-.012,'hg-top',alt,lazy);
  return{...p,hooks:hookSVG(cx),clips:''};
}
// presilhas: barra reta sob o gancho, duas garras mordendo a borda superior real do recorte
function clipped(src,fw,cx,bar,alt,lazy,cls='hg-bottom'){
  const f=frame(src,fw),left=cx-f.fw/2;
  const pts=f.m.clips.map(([x,y])=>[left+(x-f.x0)/f.bw*f.fw,(y-f.y0)/f.bh*f.fh]);
  const top=bar+JAW-Math.min(...pts.map(p=>p[1]));
  const xs=pts.map(p=>p[0]),b0=Math.min(...xs)-.035,b1=Math.max(...xs)+.035;
  const clips=`<span class="hg-bar" style="left:${f4(b0)}em;top:${f4(bar)}em;width:${f4(b1-b0)}em"></span>`+pts.map(([x,y])=>`<span class="hg-clip" style="left:${f4(x)}em;top:${f4(bar)}em;height:${f4(top+y-bar)}em"></span>`).join('');
  const p=part(f,left,top,cls,alt,lazy);
  return{...p,hooks:hookSVG(cx),clips,barLen:bar};
}
// como a peça é apresentada: kit em dois cabides (superior + inferior isolados), peça de cima no
// cabide de ombro, bermuda ou foto de kit (sem partes isoladas) em presilhas.
const hasParts=v=>!!(v.media.top&&v.media.bottom);
function modeFor(it,v,view){
  if(view==='top')return v.media.top?'top':null;
  if(view==='bottom')return v.media.bottom?'bottom':null;
  if(it.adhoc)return it.hanger==='none'?'object':it.hanger;
  if(it.family==='set')return hasParts(v)&&(it.kitAll??=it.variants.every(hasParts))?'kit':'kitphoto';
  return it.hanger==='clip'?'clip':'shoulder';
}
const WIDTH={set:1,outer:1,top:.9,bottom:.78};
// a peça cabe no palco: foto muito vertical reduz a largura até a altura útil (gancho + tecido ≤ ~1,42em)
const MAXH=1.17;
const fitW=(ref,fw,maxH=MAXH)=>Math.min(fw,maxH/frame(ref,1).fh);
function figure(it,v,view,{lazy=false}={}){
  const mode=modeFor(it,v,view)||'shoulder',p=byId(v.sourceId),alt=`${p?.name||it.title} / ${VIEW_NAME[view]?.toLowerCase()||'peça'}`;
  let parts=[],hooks='',clips='';
  if(mode==='kit'){
    const tw=fitW(v.media.top,1,1.12),top=shoulder(v.media.top,tw,-.32,alt+' — parte superior',lazy);
    const tf=frame(v.media.top,tw),bf=frame(v.media.bottom,1),aspect=bf.fh/bf.fw;
    const fwB=(aspect>1.15?tf.fh*.96:tf.fh*.56)/aspect;
    const bot=clipped(v.media.bottom,fwB,.38,BAR+.09,alt+' — parte inferior',lazy);
    parts=[bot,top];hooks=bot.hooks+top.hooks;clips=bot.clips;
  }else if(mode==='kitphoto'||mode==='clip'||mode==='bottom'){
    const src=mode==='bottom'?v.media.bottom:v.media.combo;
    const fw=mode==='kitphoto'?1.3:mode==='bottom'?.78:(WIDTH[it.family]||.8);
    const c=clipped(src,fitW(src,fw),0,BAR,alt,lazy,mode==='kitphoto'?'hg-kit':'hg-bottom');parts=[c];hooks=c.hooks;clips=c.clips;
  }else if(mode==='object'){
    const f=frame(v.media.combo,1.1),pp=part(f,-f.fw/2,.06,'hg-object',alt,lazy);parts=[pp];
  }else{
    const src=mode==='top'?v.media.top:v.media.combo;
    const s=shoulder(src,fitW(src,mode==='top'?1:(WIDTH[it.family]||.9)),0,alt,lazy);parts=[s];hooks=s.hooks;
  }
  const minX=Math.min(...parts.map(x=>x.minX)),maxX=Math.max(...parts.map(x=>x.maxX)),maxY=Math.max(...parts.map(x=>x.maxY));
  const body=parts.map(x=>x.html).join(''),shadow=parts.map(x=>x.shadow).join(''),baked=parts.every(x=>x.baked);
  const html=`<span class="hg" data-mode="${mode}"><span class="hg-shadow${baked?'':' is-css'}" aria-hidden="true">${shadow}</span>${hooks}<span class="hg-fig">${body}</span>${clips}<i class="hg-neckshade" aria-hidden="true"></i></span>`;
  return{html,mode,minX,maxX,maxY};
}

/* ============================== FICHAS DE COR (variantes reais) ============================== */
// Ficha = amostra fotografada da própria peça (recorte do peito), rótulo da cor e marca GB.
function tagsHTML(it,sel,scope){
  if(it.variants.length<2)return'';
  return `<div class="gb-tags" role="group" aria-label="Cores fotografadas de ${esc(it.title)}" data-scope="${scope}">`+it.variants.map((v,i)=>{
    const on=i===sel,m=meta(v.swatch.ref),[x0,y0,x1,y1]=m.bbox;
    const fx=((x0+x1)/2*100).toFixed(1),fy=((y0+(y1-y0)*.42)*100).toFixed(1);
    return `<button type="button" class="gb-tag${on?' is-on':''}" data-variant="${i}" aria-pressed="${on}" aria-label="Cor ${esc(v.label.toLowerCase())} — foto do acervo${on?', selecionada':''}" style="--i:${i};--c:${v.swatch.color}"><i class="gb-tag-cord" aria-hidden="true"></i><span class="gb-tag-card" aria-hidden="true"><i class="gb-tag-eye"></i><span class="gb-tag-chip" style="background-image:url('${srcOf(v.swatch.ref)}');background-position:${fx}% ${fy}%"></span><b>${esc(v.label)}</b><small>GB</small></span></button>`;
  }).join('')+`</div>`;
}
// entrada vertical: caem do alto presas pelo cordão, passam do ponto e acomodam (mola curta)
function dropTags(box){
  if(!box||reduced()||!box.animate)return;
  qa('.gb-tag',box).forEach((t,i)=>{t.getAnimations().forEach(a=>a.cancel());t.animate([
    {transform:'translateY(-105%) rotate(-7deg)',opacity:0},
    {opacity:1,offset:.25},
    {transform:'translateY(5%) rotate(3.2deg)',offset:.62},
    {transform:'translateY(-1.5%) rotate(-1.4deg)',offset:.82},
    {transform:'translateY(0) rotate(0)',opacity:1}],{duration:620,delay:90+i*60,easing:'cubic-bezier(.3,.72,.3,1)',fill:'backwards'})});
}
function retractTags(box){
  if(!box)return;if(reduced()||!box.animate){box.remove();return}
  box.style.pointerEvents='none';
  const a=box.animate([{transform:'none',opacity:1},{transform:'translateY(-40%)',opacity:0}],{duration:200,easing:'cubic-bezier(.5,0,.8,.4)',fill:'forwards'});
  a.finished.then(()=>box.remove()).catch(()=>box.remove());
}
// balanço da ficha escolhida (as vizinhas acompanham um pouco)
function swingTags(box,sel){
  qa('.gb-tag',box).forEach((t,i)=>{const on=i===sel;t.classList.toggle('is-on',on);t.setAttribute('aria-pressed',String(on));
    const lab=t.getAttribute('aria-label').replace(/, selecionada$/,'');t.setAttribute('aria-label',on?lab+', selecionada':lab);
    if(reduced()||!t.animate)return;const amp=on?6:Math.max(0,2.4-Math.abs(i-sel)*.8);if(!amp)return;
    t.animate([{transform:'rotate(0)'},{transform:`rotate(${amp}deg)`},{transform:`rotate(${-amp*.55}deg)`},{transform:`rotate(${amp*.25}deg)`},{transform:'rotate(0)'}],{duration:on?780:620,easing:'ease-out'})});
}
// troca de mídia sem piscar: decodifica antes, cruza as duas camadas; se falhar, mantém a anterior
async function swapFigure(host,html,{dir=0}={}){
  const tmp=document.createElement('span');tmp.innerHTML=html;const next=tmp.firstElementChild;
  const imgs=qa('img',next);
  try{await Promise.all(imgs.map(i=>{if(i.dataset.src){i.src=i.dataset.src;i.removeAttribute('data-src')}return i.decode?i.decode():Promise.resolve()}))}
  catch{announce.textContent='Não foi possível carregar esta foto agora. A peça anterior foi mantida.';return false}
  const old=host.querySelector(':scope>.hg');
  if(!old||reduced()||!next.animate){old?.remove();host.prepend(next);return true}
  next.classList.add('is-entering');host.prepend(next);
  old.classList.add('is-leaving');
  old.animate([{opacity:1},{opacity:0}],{duration:240,easing:'ease-out',fill:'forwards'}).finished.then(()=>old.remove()).catch(()=>old.remove());
  next.animate([{opacity:0,transform:`perspective(1100px) rotateY(${dir*7}deg)`},{opacity:1,transform:'none'}],{duration:340,easing:M.Tokens.ease.out}).finished.then(()=>next.classList.remove('is-entering')).catch(()=>{});
  return true;
}

/* ============================== ESTADO ÚNICO ============================== */
const variantSel=new Map(ITEMS.map(it=>[it.id,0]));
const S={list:ITEMS,index:0,filter:'all',view:'combo',orientation:'front',phase:'idle',open:false,current:null,input:'mouse'};
const FILTERS={all:()=>true,set:it=>it.family==='set',top:it=>it.family==='top'||it.family==='outer',bottom:it=>it.family==='bottom'};
const itemFor=p=>{
  const it=ITEMS.find(x=>x.variants.some(v=>v.sourceId===p.id));
  if(it)return{it,vi:it.variants.findIndex(v=>v.sourceId===p.id)};
  return{it:adhoc(p),vi:0};
};
// peça fora da arara (boné, tênis, chinelo, estudo SVG): mesma experiência, sem cabide inventado
const ADHOC=new Map();
function adhoc(p){
  if(ADHOC.has(p.id))return ADHOC.get(p.id);
  const set=window.GB_ASSETS?.[p.id];
  const it=set?.combo?{id:'p:'+p.id,adhoc:true,title:p.name,family:'object',label:(p.label||'PEÇA').toUpperCase(),hanger:'none',
      variants:[{id:'unica',label:null,sourceId:p.id,name:p.name,media:Object.fromEntries(Object.keys(set).map(k=>[k,p.id+':'+k])),swatch:null}],orientations:['front'],tier:'D',
      capabilities:{canTurnBack:false,canTurnSide:false,canRotate360:false,canSplitParts:!!(set.top&&set.bottom),hasColorTags:false}}
    :{id:'p:'+p.id,adhoc:true,study:true,title:p.name,family:'study',label:(p.label||'ESTUDO').toUpperCase(),variants:[{id:'unica',label:null,sourceId:p.id,name:p.name,media:{}}],orientations:['front'],tier:'study',capabilities:{}};
  ADHOC.set(p.id,it);return it;
};
const currentVariant=it=>it.variants[variantSel.get(it.id)||0];

/* ============================== ARARA ============================== */
const pos=new M.Spring(0,M.Tokens.spring.object),swing=new M.Spring(0,M.Tokens.spring.hanger),lag=new M.Spring(0,{k:62,z:.5}),spread=new M.Spring(0,{k:150,z:.9}),shift=new M.Spring(0,{k:150,z:.9});
let cards=[],target=0,running=false,dragging=false,dragStart=0,wheelTimer=0,hoverIdx=-1,lastWin=-99;
const mobile=()=>innerWidth<600;
let G={vw:viewport.clientWidth,gw:240,barTop:72,sag:18,S0:240,S1:110};
function measure(){
  const vw=viewport.clientWidth,m=mobile();
  const gw=m?Math.min(250,vw*.54):clamp(vw*.185,176,292);
  G={vw,gw,barTop:m?58:76,sag:Math.min(24,vw*.016),S0:gw*(m?.9:1.02),S1:gw*(m?.34:.47),m};
  viewport.style.setProperty('--gw',gw.toFixed(1)+'px');viewport.style.setProperty('--bar-top',G.barTop+'px');
  const bar=q('#railBar');
  if(bar){const u=G.sag/40*100;bar.querySelectorAll('path').forEach(p=>p.setAttribute('d',`M0 5 Q500 ${(5+2*u).toFixed(2)} 1000 5`))}
}
const barY=x=>{const t=clamp((G.vw*.485+x)/(G.vw*.97),0,1);return G.barTop+G.sag*4*t*(1-t)};
// distância foco→vizinho: em repouso os cabides se afastam o quanto a peça em foco (e as fichas) ocupam
let gapL=0,gapR=0,shiftX=0,fScale=1;
function computeGaps(){
  const f=cards[target];if(!f){gapL=gapR=0;shiftX=0;fScale=1;return}
  const it=S.list[target],tagsPx=it?.variants.length>1?it.variants.length*(G.m?24:36)+(G.m?10:18):0;
  // composição peça + fichas: cabe na largura (no celular a peça em foco encolhe só o necessário) e fica centrada
  const avail=G.vw-(G.m?16:120),need=(f.maxX-f.minX)*G.gw+tagsPx;
  fScale=need>avail?avail/need:1;
  const left=f.minX*G.gw*fScale,right=f.maxX*G.gw*fScale+tagsPx;shiftX=-(left+right)/2;
  const ns=G.m?.84:.8,room=G.m?.06:.1,r=cards[target+1],l=cards[target-1],tagsW=tagsPx/G.gw;
  const wantR=(f.maxX*fScale+tagsW+room+(r?-r.minX*ns:0))*G.gw,wantL=(-f.minX*fScale+room+(l?l.maxX*ns:0))*G.gw;
  gapR=Math.max(G.gw*(G.m?.22:.3),wantR-G.S0);gapL=Math.max(G.gw*(G.m?.22:.3),wantL-G.S0);
}
function xOf(d){
  const a=Math.abs(d),s=Math.sign(d),sp=spread.x*(s>0?gapR:gapL);
  return s*(Math.min(a,1)*(G.S0+sp)+Math.max(a-1,0)*G.S1)+shift.x;
}
function buildRail(){
  track.innerHTML=S.list.map((it,i)=>{
    const v=currentVariant(it),fig=figure(it,v,'combo',{lazy:true});
    const n=it.variants.length>1?`, ${it.variants.length} cores fotografadas`:'';
    return `<div class="r10-item" data-rail-item="${i}" data-mode="${fig.mode}" style="--minx:${f4(fig.minX)}em;--maxx:${f4(fig.maxX)}em;--maxy:${f4(fig.maxY)}em"><button type="button" class="r10-hit" data-rail-hit="${i}" tabindex="-1" aria-label="${esc(it.title)} — ${fmt(i)} de ${S.list.length}, ${esc(it.label.toLowerCase())}${n}"></button><span class="r10-swing"><span class="r10-turn">${fig.html}</span></span></div>`;
  }).join('');
  cards=qa('.r10-item',track).map(el=>({el,swing:el.querySelector('.r10-swing'),turn:el.querySelector('.r10-turn'),hit:el.querySelector('.r10-hit'),h:0,hydrated:false,vis:true,minX:parseFloat(el.style.getPropertyValue('--minx')),maxX:parseFloat(el.style.getPropertyValue('--maxx'))}));
  lastWin=-99;
}
function renderCard(i,html){
  const it=S.list[i],card=cards[i];if(!card)return null;const fig=figure(it,currentVariant(it),'combo');
  card.el.dataset.mode=fig.mode;card.minX=fig.minX;card.maxX=fig.maxX;if(i===target)computeGaps();card.el.style.setProperty('--minx',f4(fig.minX)+'em');card.el.style.setProperty('--maxx',f4(fig.maxX)+'em');card.el.style.setProperty('--maxy',f4(fig.maxY)+'em');
  if(html!==false){card.turn.innerHTML=fig.html;card.fig=null;card.hydrated=true}
  return fig;
}
function hydrate(force){
  const c=Math.round(pos.x),R=G.m?3:6;if(!force&&c===lastWin)return;lastWin=c;
  cards.forEach((card,i)=>{
    const a=Math.abs(i-pos.x);
    if(a<=R&&!card.hydrated){card.hydrated=true;qa('img[data-src]',card.el).forEach(img=>{img.src=img.dataset.src;img.removeAttribute('data-src')})}
    // longe do foco libera a memória decodificada; nunca aborta uma imagem que ainda está chegando
    else if(a>R+5&&card.hydrated){const imgs=qa('img[src]',card.el);if(imgs.every(img=>img.complete)){card.hydrated=false;imgs.forEach(img=>{img.dataset.src=img.getAttribute('src');img.removeAttribute('src')})}}
  });
}
function layout(){
  const p=pos.x,sw=swing.x,lg=lag.x-swing.x,m=G.m,R=m?2.4:5.2;
  cards.forEach((card,i)=>{
    const d=i-p,a=Math.abs(d);
    const vis=a<R+.8;if(vis!==card.vis){card.vis=vis;card.el.hidden=!vis}
    if(!vis)return;
    const h=card.h,x=xOf(d);
    const s=(Math.max(.6,1-Math.min(a,1)*(m?.16:.2)-Math.max(a-1,0)*.05)+h*.035)*(i===target?1-(1-fScale)*spread.x:1);
    const ry=-Math.sign(d)*Math.min(a,1)*(m?16:24)*(1-h)-Math.sign(d)*Math.max(a-1,0)*4*(1-h);
    const y=barY(x)-h*5;
    card.el.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
    card.el.style.zIndex=String(200-Math.round(a*12)+(h>.05?30:0));
    card.el.style.opacity=a>R-.6?clamp((R+.6-a)/1.2,0,1).toFixed(3):'1';
    // o cabide balança a partir do gancho; o tecido acompanha com atraso (inércia do pano)
    const k=1-Math.min(a,4)*.12,ph=1+(((i*37)%7)-3)*.05;
    card.swing.style.transform=Math.abs(sw)>.01?`rotate(${(sw*k*ph).toFixed(3)}deg)`:'';
    card.turn.style.transform=`perspective(${m?700:950}px) rotateY(${ry.toFixed(2)}deg)`;
    const fig=card.fig||(card.fig=qa('.hg-fig,.hg-shadow',card.el));
    const tr=Math.abs(lg)>.01?`rotate(${(lg*.9*k).toFixed(3)}deg)`:'';fig.forEach(f=>f.style.transform=tr);
  });
  const bar=q('#railProgress');if(bar)bar.style.transform=`scaleX(${((clamp(p,0,S.list.length-1)+1)/S.list.length).toFixed(4)})`;
}
function loop(dt){
  if(!dragging)pos.step(dt);
  swing.set(clamp(-pos.v*5.2,-14,14));swing.step(dt);lag.set(swing.x);lag.step(dt);
  const rest=!dragging&&Math.abs(pos.target-pos.x)<=.02;spread.set(rest?1:0);spread.step(dt);
  // recentramento da composição só em repouso: sob o dedo a arara anda 1:1, sem deriva
  if(rest)shift.set(shiftX);shift.step(dt);
  let hovering=false;
  cards.forEach((c,i)=>{const t=i===hoverIdx&&!dragging?1:0;if(Math.abs(t-c.h)>.002){c.h+=(t-c.h)*(1-Math.exp(-dt*13));hovering=true}else c.h=t});
  hydrate();layout();
  // a peça chegou: fichas descem enquanto o tecido ainda termina de balançar
  if(!dragging&&Math.abs(pos.target-pos.x)<.02&&Math.abs(pos.v)<.35&&S.phase!=='focused'&&S.phase!=='viewer')onSettled();
  const idle=!dragging&&pos.settled&&shift.settled&&Math.abs(swing.x)<.02&&Math.abs(swing.v)<.04&&Math.abs(lag.x)<.02&&Math.abs(lag.v)<.04&&spread.settled&&!hovering;
  if(idle){pos.jump(target);swing.jump(0);lag.jump(0);layout();running=false;track.classList.remove('is-moving');onSettled();return false}
}
// foco do teclado acompanha a peça em foco; se ela ainda está longe (Home/End), o foco espera na arara
function keyFocus(){const c=cards[target];if(c&&!c.el.hidden)c.hit.focus({preventScroll:true});else viewport.focus({preventScroll:true})}
function onSettled(){setPhase(S.open?'viewer':'focused');const it=S.list[target];if(it&&!railTags&&!dragging)mountRailTags(it);if(S.input==='keyboard'&&viewport.contains(document.activeElement)&&document.activeElement!==cards[target]?.hit&&!document.activeElement.closest('.gb-tags'))keyFocus()}
function kick(){
  if(reduced()){pos.jump(target);swing.jump(0);lag.jump(0);spread.jump(1);shift.jump(shiftX);cards.forEach(c=>c.h=c===cards[hoverIdx]?1:0);hydrate();layout();onSettled();return}
  if(!running){running=true;track.classList.add('is-moving');M.Ticker.add(loop)}
}
function setPhase(p){S.phase=p;viewport.dataset.phase=p}
function navigate(i,{input}={}){
  if(!S.list.length)return;const n=clamp(i,0,S.list.length-1);
  if(input)S.input=input;
  if(n===target){if(i!==n){pos.v+=(i>n?1:-1)*1.4;kick()}return}
  target=n;pos.set(n);setPhase('settling');computeGaps();updateInfo();kick();
}
// informação e fichas da peça em foco (fichas entram só quando a arara acomoda)
let railTags=null;
function updateInfo(){
  const it=S.list[target];if(!it)return;const v=currentVariant(it),n=S.list.length;
  cards.forEach((c,i)=>{const on=i===target;c.el.classList.toggle('is-focus',on);c.hit.tabIndex=on?0:-1;c.hit.setAttribute('aria-current',on?'true':'false')});
  live.textContent=`${fmt(target)} / ${fmt(n-1)}`;
  q('#railFocusIndex').textContent=fmt(target);
  q('#railFocusName').textContent=it.title.toUpperCase();
  q('#railFocusType').textContent=it.label+(it.variants.length>1?` · ${it.variants.length} CORES`:'');
  const cap=q('#r10Caption');if(cap){
    cap.querySelector('[data-cap-name]').textContent=it.title.toUpperCase();
    cap.querySelector('[data-cap-color]').textContent=it.variants.length>1?`COR / ${v.label} · ${it.variants.length} FOTOGRAFADAS`:it.label;
  }
  if(railTags&&railTags.dataset.item!==it.id){retractTags(railTags);railTags=null}
  prefetch(target);
}
function mountRailTags(it){
  const card=cards[target];if(!card||it.variants.length<2)return;
  const tmp=document.createElement('div');tmp.innerHTML=tagsHTML(it,variantSel.get(it.id),'rail');railTags=tmp.firstElementChild;railTags.dataset.item=it.id;
  railTags.style.left=`calc(var(--maxx) + .05em)`;card.el.appendChild(railTags);dropTags(railTags);
}
function prefetch(i){[i-2,i-1,i+1,i+2].forEach(k=>{const it=S.list[k];if(!it)return;const v=currentVariant(it);Object.values(v.media).forEach(ref=>{const src=srcOf(ref);if(!src)return;const im=new Image();im.decoding='async';im.src=src;im.decode?.().catch(()=>{})})})}
function setFilter(f){
  S.filter=FILTERS[f]?f:'all';S.list=ITEMS.filter(FILTERS[S.filter]);buildRail();
  target=Math.min(S.filter==='all'?2:1,S.list.length-1);pos.jump(target);swing.jump(0);lag.jump(0);spread.jump(reduced()?1:0);
  computeGaps();hydrate(true);layout();updateInfo();kick();
  qa('[data-rail-filter]').forEach(b=>{const on=b.dataset.railFilter===S.filter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
}
async function chooseVariant(it,i,scope){
  if(i===variantSel.get(it.id))return;
  const prev=variantSel.get(it.id);variantSel.set(it.id,i);const v=it.variants[i],dir=i>prev?1:-1;
  // a vista escolhida segue valendo se a nova cor também foi fotografada nela; senão volta ao conjunto
  if(S.open&&S.current===it&&!modeFor(it,v,S.view)){S.view='combo';announce.textContent=`A cor ${v.label.toLowerCase()} não tem foto ${VIEW_NAME[S.view]?.toLowerCase()}; mostrando o conjunto.`}
  const ri=S.list.indexOf(it),card=cards[ri];
  if(card){const ok=await swapFigure(card.turn,figure(it,v,'combo').html,{dir});if(!ok){variantSel.set(it.id,prev);return}renderCard(ri,false);card.fig=null;card.hydrated=true;swing.v+=dir*(reduced()?0:22);kick();if(railTags&&ri===target)swingTags(railTags,i)}
  if(ri===target)updateCaptionOnly(it);
  if(S.open&&S.current===it){await drawViewer({dir,variantOnly:true});}
  announce.textContent=`${it.title}: cor ${v.label.toLowerCase()} selecionada.`;
  document.dispatchEvent(new CustomEvent('gb:rail-variant',{detail:{item:it.id,variant:v.id,productId:v.sourceId}}));
}
function updateCaptionOnly(it){const v=currentVariant(it),cap=q('#r10Caption');if(cap)cap.querySelector('[data-cap-color]').textContent=`COR / ${v.label} · ${it.variants.length} FOTOGRAFADAS`}

/* ---------- entrada: gesto, teclado, setas, roda horizontal, hover ---------- */
// clique só é clique: se o ponteiro andou (em qualquer eixo) desde o toque, não abre nem troca nada
let downAt=null;
viewport.addEventListener('pointerdown',e=>{downAt={x:e.clientX,y:e.clientY}},{capture:true,passive:true});
viewport.addEventListener('click',e=>{
  if(downAt&&e.detail&&Math.hypot(e.clientX-downAt.x,e.clientY-downAt.y)>10){downAt=null;return}
  downAt=null;
  const tag=e.target.closest('.gb-tag');if(tag){e.stopPropagation();const it=S.list[target];chooseVariant(it,+tag.dataset.variant,'rail');return}
  if(e.target.closest('[data-cap-open]')){openViewer(S.list[target],{from:cards[target]});return}
  const hit=e.target.closest('[data-rail-hit]');if(!hit)return;const i=+hit.dataset.railHit;
  if(i===target)openViewer(S.list[target],{from:cards[target]});else navigate(i,{input:e.pointerType||'mouse'});
});
viewport.addEventListener('keydown',e=>{
  if(e.target.closest('.gb-tag'))return;
  const map={ArrowRight:1,ArrowLeft:-1};
  const go=i=>{e.preventDefault();navigate(i,{input:'keyboard'});keyFocus()};
  if(map[e.key])go(target+map[e.key]);
  if(e.key==='Home')go(0);
  if(e.key==='End')go(S.list.length-1);
  if((e.key==='Enter'||e.key===' ')&&(e.target===viewport)){e.preventDefault();openViewer(S.list[target],{from:cards[target]})}
});
// arrasto 1:1 na área livre; fichas, botões e legenda não iniciam arrasto; gesto vertical libera a rolagem
M.drag(viewport,{axis:'x',ignore:'.rail-controls,.gb-tags,.r10-caption,.rail-bottom button',
  onStart(){dragging=true;dragStart=pos.x;setPhase('drag');if(railTags){retractTags(railTags);railTags=null}kick()},
  onMove(dx){const max=S.list.length-1,step=G.S0;let p=dragStart-dx/step;if(p<0)p*=.3;else if(p>max)p=max+(p-max)*.3;pos.v=(p-pos.x)*60;pos.x=p;pos.target=p;if(reduced()){hydrate();layout()}},
  onEnd(v){dragging=false;const step=G.S0,proj=pos.x-clamp(v/step*.18,-2.2,2.2);target=clamp(Math.round(proj),0,S.list.length-1);pos.set(target);pos.v=-v/step*.35;setPhase('settling');computeGaps();updateInfo();kick()}
});
viewport.addEventListener('wheel',e=>{
  if(Math.abs(e.deltaX)<=Math.abs(e.deltaY)||Math.abs(e.deltaX)<2)return; // rolagem vertical nunca é capturada
  e.preventDefault();const max=S.list.length-1,step=G.S1*1.4;
  pos.x=clamp(pos.x+e.deltaX/step,-.3,max+.3);pos.target=pos.x;pos.v=e.deltaX/step*12;setPhase('drag');kick();
  clearTimeout(wheelTimer);wheelTimer=setTimeout(()=>{target=clamp(Math.round(pos.x),0,max);pos.set(target);computeGaps();updateInfo();kick()},110);
},{passive:false});
if(M.Prefs.fine){
  track.addEventListener('pointerover',e=>{const it=e.target.closest('.r10-item');const i=it?+it.dataset.railItem:-1;if(i!==hoverIdx){hoverIdx=i;kick()}});
  track.addEventListener('pointerleave',()=>{hoverIdx=-1;kick()});
}
q('#railPrev')?.addEventListener('click',()=>navigate(target-1,{input:'mouse'}));
q('#railNext')?.addEventListener('click',()=>navigate(target+1,{input:'mouse'}));
qa('[data-rail-filter]').forEach(b=>b.addEventListener('click',()=>setFilter(b.dataset.railFilter)));
q('#railExplore')?.addEventListener('click',()=>openViewer(S.list[target],{from:cards[target]}));
let rz=0;addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{const was=G.m;measure();computeGaps();if(was!==G.m)lastWin=-99;hydrate(true);layout();if(S.open)fitViewer()},90)},{passive:true});

/* ============================== OBJECT VIEW (viewer unificado) ============================== */
const vMedia=q('#railViewerMedia'),vArt=q('.rail-viewer-art'),vDetail=q('.rail-viewer-detail');
viewer.classList.add('r10-viewer');
vMedia.classList.add('r10-vstage');
vMedia.innerHTML='';
const vTilt=document.createElement('div');vTilt.className='r10-vtilt';vMedia.appendChild(vTilt);
const vHost=document.createElement('div');vHost.className='r10-vhost';vTilt.appendChild(vHost);
// orientação: só o que a mídia sustenta; o resto fica visível e desligado, com o motivo
const orient=document.createElement('div');orient.className='r10-orient';orient.setAttribute('role','group');orient.setAttribute('aria-label','Orientação da peça');
orient.innerHTML=`<span class="r10-orient-label">ORIENTAÇÃO</span><div class="r10-orient-btns"><button type="button" data-orient="front" aria-pressed="true">FRENTE</button><button type="button" data-orient="side" aria-pressed="false" aria-disabled="true">LATERAL</button><button type="button" data-orient="back" aria-pressed="false" aria-disabled="true">COSTAS</button></div><p class="r10-orient-note" id="r10OrientNote">Só a frente foi fotografada. Lateral e costas aguardam fotos reais: o verso não é simulado.</p>`;
const varLine=document.createElement('p');varLine.className='r10-variant-line';varLine.id='r10VariantLine';
const vName=q('#railViewerName');vName.after(varLine);
q('.rail-view-switch')?.before(orient);
const vRail=document.createElement('i');vRail.className='r10-vrail';vRail.setAttribute('aria-hidden','true');vArt.prepend(vRail);
const vTags=document.createElement('div');vTags.className='r10-vtags';vArt.appendChild(vTags);
let previousFocus=null,vSettle=0;
const vSwing=new M.Spring(0,M.Tokens.spring.hanger),vRy=new M.Spring(0,{k:90,z:.8}),vRx=new M.Spring(0,{k:90,z:.8});let vRunning=false;
function vLoop(dt){vSwing.step(dt);vRy.step(dt);vRx.step(dt);applyV();if(vSwing.settled&&vRy.settled&&vRx.settled){vSwing.jump(vSwing.target);applyV();vRunning=false;return false}}
function vKick(){if(reduced()){vSwing.jump(0);vRy.jump(0);vRx.jump(0);applyV();return}if(!vRunning){vRunning=true;M.Ticker.add(vLoop)}}
function applyV(){vTilt.style.transform=`perspective(1200px) rotateX(${vRx.x.toFixed(2)}deg) rotateY(${vRy.x.toFixed(2)}deg)`;const h=vHost.querySelector('.hg');if(h)h.style.transform=Math.abs(vSwing.x)>.01?`rotate(${vSwing.x.toFixed(3)}deg)`:''}
function fitViewer(){
  const r=vArt.getBoundingClientRect(),it=S.current;if(!it||!r.width)return;
  const v=currentVariant(it),fig=figure(it,v,S.view),w=fig.maxX-fig.minX,h=fig.maxY+.1;
  // cabe na parte visível do palco (o palco pode ser mais alto que a tela no desktop)
  const visH=Math.min(r.height,innerHeight-Math.max(0,r.top)-24),tagsW=it.variants.length>1?it.variants.length*(G.m?30:40)+(G.m?24:60):0;
  const gw=Math.max(120,Math.min((r.width*.86-tagsW)/w,(visH*.84)/h,480));vMedia.style.setProperty('--vtagsw',tagsW+'px');
  vMedia.style.setProperty('--vgw',gw.toFixed(1)+'px');vMedia.style.setProperty('--vcx',f4(-(fig.minX+fig.maxX)/2)+'em');vMedia.style.setProperty('--vh',f4(h)+'em');vMedia.style.setProperty('--vbw',f4(w+.5)+'em');
  if(G.m)vArt.style.minHeight=Math.round(h*gw+150)+'px';else vArt.style.minHeight='';
  const vtop=G.m?56:Math.max(24,(visH-h*gw)/2);vMedia.style.setProperty('--vtop',vtop.toFixed(0)+'px');vArt.style.setProperty('--vrail',(vtop+.05*gw).toFixed(1)+'px');
}
async function drawViewer({dir=0,entry=false,variantOnly=false}={}){
  const it=S.current,v=currentVariant(it),p=byId(v.sourceId);
  if(!modeFor(it,v,S.view)&&!it.study)S.view='combo';
  viewer.dataset.productId=v.sourceId;viewer.dataset.item=it.id;viewer.dataset.variant=v.id;viewer.dataset.view=S.view;viewer.dataset.orientation=S.orientation;viewer.dataset.tier=it.tier;
  vName.textContent=it.title.toUpperCase();
  varLine.textContent=it.study?'ESTUDO GRÁFICO / NÃO É FOTO':it.variants.length>1?`COR / ${v.label} · ${fmt(variantSel.get(it.id))} DE ${fmt(it.variants.length-1)} FOTOGRAFADAS`:'COR ÚNICA FOTOGRAFADA';
  const listIdx=S.list.indexOf(it);
  q('#railViewerIndex').textContent=it.adhoc?`ACERVO / ${esc(p?.id||'')}`:`${fmt(listIdx)} / ${fmt(S.list.length-1)}`;
  q('#railViewerDescription').textContent=it.study?'Ilustração de estudo até a entrada da foto oficial da GB. Não representa a peça real.':`${it.label.charAt(0)+it.label.slice(1).toLowerCase()}. Imagem do acervo GB; nome de trabalho, marca, procedência, preço e estoque em validação.${it.variants.length>1?' As cores mostradas foram fotografadas, não são simulação.':''}`;
  q('.rail-viewer-art-label').textContent=it.study?'ARQUIVO DE ESTUDO / CATÁLOGO EM CONSTRUÇÃO':'IMAGEM DO ACERVO / A VALIDAR · SÓ FRENTE FOTOGRAFADA';
  // composição: só modos com foto real para esta cor
  let shown=0;qa('[data-rail-view]').forEach(b=>{const view=b.dataset.railView,ok=it.study?availableViews(p).includes(view):!!modeFor(it,v,view)&&(view==='combo'||it.family==='set');b.hidden=!ok;shown+=ok;const on=view===S.view;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
  const sw=q('.rail-view-switch');if(sw)sw.hidden=shown<2;
  qa('[data-orient]',orient).forEach(b=>{const on=b.dataset.orient==='front';b.setAttribute('aria-pressed',String(on));b.classList.toggle('selected',on)});
  orient.hidden=!!it.study;
  // avisa as outras camadas antes de esperar pelas fotos (o V08 esconde o estudo de cor de peça com foto na hora)
  document.dispatchEvent(new CustomEvent('gb:object-product',{detail:{product:p,item:it.id,variant:v.id,view:S.view,orientation:S.orientation,study:!!it.study,photo:!it.study}}));
  if(it.study){vHost.innerHTML=`<div class="r10-study">${productMedia(p,S.view)}</div>`;vTags.innerHTML=''}
  else{
    const html=figure(it,v,S.view).html;fitViewer();
    if(entry||!vHost.firstElementChild){vHost.innerHTML=html;await Promise.all(qa('img',vHost).map(i=>i.decode?.().catch(()=>{})));}
    else await swapFigure(vHost,html,{dir});
    if(!variantOnly||!vTags.firstElementChild){vTags.innerHTML=tagsHTML(it,variantSel.get(it.id),'viewer');if(entry)dropTags(vTags.firstElementChild)}
    else swingTags(vTags.firstElementChild,variantSel.get(it.id));
    vSwing.v+=dir*(reduced()?0:26)+(entry&&!reduced()?14:0);vKick();
  }
}
function openViewer(it,{from,variant}={}){
  if(!it)return;
  if(typeof closeAll==='function'&&viewer.hidden)closeAll(false);
  if(viewer.hidden)previousFocus=document.activeElement;
  if(variant!=null&&!it.study)variantSel.set(it.id,variant);
  S.current=it;S.view='combo';S.orientation='front';S.open=true;setPhase('viewer');
  viewer.hidden=false;document.body.classList.add('no-scroll');
  drawViewer({entry:true}).then(()=>{
    const fig=vHost.querySelector('.hg-fig')||vHost.firstElementChild,src=from?.el?.querySelector('.hg-fig');
    if(src&&fig&&!reduced())M.flipClone(src,fig,{duration:M.Tokens.dur.normal+140});
    else if(fig&&!reduced()&&vTilt.animate)vTilt.animate([{opacity:0,transform:'perspective(1200px) rotateY(-16deg) translateX(3%)'},{opacity:1,offset:.4},{opacity:1,transform:'perspective(1200px) rotateY(0deg)'}],{duration:640,easing:M.Tokens.ease.out});
  });
  q('#railViewerClose').focus();
}
function closeViewer(){
  if(viewer.hidden)return;viewer.hidden=true;S.open=false;document.body.classList.remove('no-scroll');setPhase('focused');
  // o estado da arara acompanha a cor escolhida dentro do viewer
  const it=S.current,ri=S.list.indexOf(it);
  if(ri>=0&&cards[ri]&&!it.adhoc){const v=currentVariant(it),cur=cards[ri].el.querySelector('.hg-fig img')?.getAttribute('src')||cards[ri].el.querySelector('.hg-fig img')?.dataset.src;
    if(!Object.values(v.media).map(srcOf).includes(cur)){renderCard(ri);layout()}
    if(ri===target){if(railTags){railTags.remove();railTags=null}mountRailTags(it);updateCaptionOnly(it)}}
  previousFocus?.focus?.({preventScroll:true});
}
function viewerStep(d){
  const it=S.current;
  if(it.adhoc){const list=PRODUCTS,i=list.findIndex(p=>p.id===it.variants[0].sourceId),p=list[(i+d+list.length)%list.length];const r=itemFor(p);S.current=r.it;if(!r.it.adhoc)variantSel.set(r.it.id,r.vi)}
  else{navigate(target+d,{input:'viewer'});if(S.list[target]===it)return;S.current=S.list[target]}
  S.view='combo';drawViewer({dir:d,entry:true});
}
q('#railViewerClose')?.addEventListener('click',closeViewer);
q('#railViewerPrev')?.addEventListener('click',()=>viewerStep(-1));
q('#railViewerNext')?.addEventListener('click',()=>viewerStep(1));
qa('[data-rail-view]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.railView===S.view)return;const order=['combo','top','bottom'];const dir=order.indexOf(b.dataset.railView)>order.indexOf(S.view)?1:-1;S.view=b.dataset.railView;drawViewer({dir});announce.textContent=`Vista ${VIEW_NAME[S.view].toLowerCase()}.`}));
orient.addEventListener('click',e=>{const b=e.target.closest('[data-orient]');if(!b||b.dataset.orient==='front')return;announce.textContent=`Vista ${b.textContent.toLowerCase()} indisponível: ainda não há foto real desse ângulo.`;q('#r10OrientNote').classList.remove('is-flash');void q('#r10OrientNote').offsetWidth;q('#r10OrientNote').classList.add('is-flash')});
vTags.addEventListener('click',e=>{const t=e.target.closest('.gb-tag');if(!t||!S.current)return;chooseVariant(S.current,+t.dataset.variant,'viewer')});
q('#railViewerProduct')?.addEventListener('click',()=>{const v=currentVariant(S.current);const p=byId(v.sourceId);closeViewer();if(typeof detailModal==='function')detailModal(p,{detailOnly:true})});
// toque: swipe horizontal troca de peça (não há multivista real para girar); fichas e botões não contam
let tx=0,ty=0,tOk=false;
viewer.addEventListener('touchstart',e=>{tOk=!e.target.closest('.gb-tags,button,input,.gb-product-color-panel');tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
viewer.addEventListener('touchend',e=>{if(!tOk)return;const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.3){if(viewer.classList.contains('gb-mode-color'))window.GBColorLabStep?.(dx<0?1:-1);else viewerStep(dx<0?1:-1)}},{passive:true});
// mouse: leve ângulo editorial (até ~9°) que volta à frente; não é rotação de produto
if(M.Prefs.fine&&!lite()){
  vArt.addEventListener('pointermove',e=>{if(reduced()||!S.current||S.current.study)return;const r=vArt.getBoundingClientRect();vRy.set(((e.clientX-r.left)/r.width-.5)*18);vRx.set(-((e.clientY-r.top)/r.height-.5)*5);vKick()},{passive:true});
  vArt.addEventListener('pointerleave',()=>{vRy.set(0);vRx.set(0);vKick()});
}
document.addEventListener('keydown',e=>{
  if(viewer.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeViewer();return}
  if(e.target.closest?.('.gb-tags,input,[role=tablist]'))return;
  if(e.key==='ArrowRight'){e.preventDefault();if(viewer.classList.contains('gb-mode-color'))window.GBColorLabStep?.(1);else viewerStep(1)}
  if(e.key==='ArrowLeft'){e.preventDefault();if(viewer.classList.contains('gb-mode-color'))window.GBColorLabStep?.(-1);else viewerStep(-1)}
});

/* ============================== API pública (contratos existentes) ============================== */
// Catálogo, hero, busca e ficha abrem a mesma experiência; peça da arara abre na cor clicada.
window.GBOpenProductExperience=p=>{
  if(!p)return false;const r=itemFor(p);
  if(!r.it.adhoc){const li=S.list.indexOf(r.it);if(li<0){setFilter('all')}const idx=S.list.indexOf(r.it);if(idx>=0){target=idx;pos.jump(idx);computeGaps();hydrate(true);layout();updateInfo()}}
  openViewer(r.it,{variant:r.vi});return true;
};
window.GBRail={get state(){const it=S.list[target],v=it&&currentVariant(it);return{index:target,count:S.list.length,itemId:it?.id,productId:v?.sourceId,variantId:v?.id,view:S.view,orientation:S.orientation,phase:S.phase,open:S.open,filter:S.filter,pos:pos.x,moving:running}},
  items:()=>S.list.map(it=>({id:it.id,title:it.title,family:it.family,variants:it.variants.map(v=>({id:v.id,label:v.label,productId:v.sourceId})),capabilities:it.capabilities})),
  navigate:i=>navigate(i),setFilter,chooseVariant:i=>chooseVariant(S.open?S.current:S.list[target],i,'api'),open:()=>openViewer(S.list[target],{from:cards[target]}),close:closeViewer,counts:CAT.counts};

/* ============================== MONTAGEM ============================== */
viewport.classList.add('r10');
// legenda da peça em foco (como etiqueta de loja: nome, cor, vistas fotografadas, abrir)
const cap=document.createElement('div');cap.className='r10-caption';cap.id='r10Caption';
cap.innerHTML=`<b data-cap-name></b><span data-cap-color></span><span class="r10-cap-row"><span class="r10-pill" role="img" aria-label="Vistas fotografadas: frente. Costas sem foto."><i class="on">FRENTE</i><i title="Sem foto de costas no acervo">COSTAS</i></span><button type="button" data-cap-open>VER PEÇA ↗</button></span>`;
viewport.appendChild(cap);
// chips com contagem derivada do catálogo curado
qa('[data-rail-filter]').forEach(b=>{const n=ITEMS.filter(FILTERS[b.dataset.railFilter]||FILTERS.all).length;if(!b.querySelector('small'))b.insertAdjacentHTML('beforeend',` <small>${n}</small>`)});
measure();
const start=()=>{setFilter('all')};
start();
viewport.dataset.ready='true';
})();
