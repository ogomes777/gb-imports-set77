/* GB IMPORTS / RAIL V11 — IMMERSIVE STAGE. A arara V10 dentro de uma loja que existe.
 * Evolui a V10 sem substituí-la: o mesmo #railBar/#railItems/GBRail (estado, catálogo, gestos, viewer) passam a
 * ficar no plano z=0 de uma sala com perspectiva real (CSS 3D, sem WebGL): parede ao fundo, piso, teto, paredes
 * laterais e o batente da porta à frente. A câmera é uma posição (cx, cy, c) — cada plano é projetado pela mesma
 * perspectiva, então o piso converge, a parede anda menos que a arara e a porta passa pela câmera (parallax físico,
 * não zoom de imagem). Em repouso a câmera fica em (0,0,0): o plano da arara volta a ser exatamente o da V10.
 *
 * Sistemas (cada um pequeno e separado):
 *   Perf    nível do aparelho (full / touch / static) e rebaixamento se o dolly medir quadros lentos
 *   Scene   cenário físico: monta as camadas, mede a sala a partir da geometria da arara
 *   Camera  pose, dolly com easing de cinema, molas de parallax/impulso, projeção de cada camada
 *   Reveal  espera o capítulo V12 (EM MOVIMENTO) abrir e só então começa o filme; nunca repete, nunca bloqueia
 *   Wind    rajadas curtas e espaçadas (setTimeout, sem rAF parado); a física por peça mora na V10 e lê daqui
 *   Light   nível de luz da sala (revela durante a chegada) e foco pela fase da arara (CSS)
 *   Depth   parallax do ponteiro (mouse) e impulso de câmera ao navegar
 *   Views   capacidades de vista por produto: 360°/costas/lateral só com foto aprovada e procedência
 * Tudo roda no relógio único do GBMotion e só enquanto há algo mudando. prefers-reduced-motion e aparelho modesto:
 * a loja aparece pronta, sem dolly nem vento. Ver docs/GB_RAIL_V11.md.
 */
(()=>{
'use strict';
const M=window.GBMotion,R=window.GBRail,vp=document.getElementById('railViewport'),sec=document.getElementById('rail');
if(!M||!R||!vp||!sec||!vp.classList.contains('r10'))return;
const clamp=M.clamp,lerp=M.lerp,now=()=>performance.now();
const reduced=()=>M.Prefs.reduced;

/* ============================== Views: capacidades por produto ============================== */
// Fonte futura: window.GB_RAIL_MULTIVIEW = {[productId]:{approved:true,provenance:'sessão X',views:{back:'pid:back',side:'pid:side'},
// turntable:{frames:['pid:t00',…]}}}. Uma vista só existe com aprovação, procedência e o arquivo real em GB_ASSETS.
// Nada aqui deriva vista de outra (sem espelhar frente, sem rotateY de foto plana).
const Views={
  ref(r){const [pid,view]=String(r||'').split(':');return!!(pid&&view&&window.GB_ASSETS?.[pid]?.[view])},
  resolve(productId,manifest=window.GB_RAIL_MULTIVIEW||{}){
    const e=manifest[productId],ok=!!(e&&e.approved===true&&typeof e.provenance==='string'&&e.provenance.trim());
    const back=ok&&Views.ref(e.views?.back),side=ok&&Views.ref(e.views?.side);
    const frames=ok&&Array.isArray(e.turntable?.frames)?e.turntable.frames.filter(Views.ref):[];
    return{front:true,back,side,rotate360:frames.length>=12,refs:{back:back?e.views.back:null,side:side?e.views.side:null},frames,
      reason:ok?'':'Só a frente foi fotografada. Lateral, costas e 360° aguardam fotos reais aprovadas: nada é simulado.'};
  },
};
window.GBRailViews=Views;

/* ============================== Perf ============================== */
const Perf={
  tier:reduced()||M.Prefs.lite?'static':(M.Prefs.coarse||innerWidth<600?'touch':'full'),
  dts:[],
  sample(dt){if(this.tier==='static')return;this.dts.push(dt);if(this.dts.length===45){const mean=this.dts.reduce((a,b)=>a+b,0)/this.dts.length;
    // abaixo de ~36 fps no próprio dolly: mantém sala, câmera e vento (barato: só os ~12 cabides em cena);
    // desliga o que pesa na composição (rig do tecido com máscaras, sombra desfocada da barra)
    if(mean>.028)this.downgrade()}},
  downgrade(){if(this.low)return;this.low=true;vp.classList.add('r11-low');Stage.rig=false},
};

/* ============================== Scene ============================== */
const el=(cls,html='')=>{const d=document.createElement('div');d.className=cls;d.setAttribute('aria-hidden','true');d.innerHTML=html;return d};
const room=el('r11-room');
// V11.2 vitrine de vidro: o fundo e as laterais são caixilhos de vidro; atrás deles, a rua em luz de dia
// (cidade fora de foco, sol baixo). O piso atravessa o vidro e continua lá fora — a câmera vê o chão seguir.
const out=el('r11-plane r11-out','<i class="r11-sky"></i><i class="r11-sun"></i><i class="r11-city"></i>');
// corredor do shopping, mais perto: pilares redondos entre a vitrine e as lojas da frente — outro plano, outra
// profundidade, parallax real através do vidro
const near=el('r11-plane r11-near','<i class="r11-trees"></i><i class="r11-rail-glass"></i>');
// a loja acorda: fileiras de spots no teto, cones de luz e poças no piso acendem da porta para o fundo
const cones=el('r11-cones');
const glassKids='<i class="r11-mullions"></i><i class="r11-sheen"></i><i class="r11-head"></i><i class="r11-base"></i>';
const wall=el('r11-plane r11-wall r11-glass',`${glassKids}<i class="r11-frost"></i><i class="r11-focus-light"></i><span class="r11-sign"><img src="./assets/brand/gb-monograma-preto.svg" alt="" width="120" height="80" decoding="async"></span>`);
const ceil=el('r11-plane r11-ceil','<i class="r11-track r11-track-l"></i><i class="r11-track r11-track-r"></i>');
const sideL=el('r11-plane r11-side r11-glass r11-side-l',glassKids),sideR=el('r11-plane r11-side r11-glass r11-side-r',glassKids);
const floor=el('r11-plane r11-floor','<i class="r11-floor-pool"></i><i class="r11-floor-sun"></i><i class="r11-floor-mull"></i><i class="r11-pools"></i>');
// o shopping lá fora: duas fileiras de vitrines acesas (térreo e mezanino com guarda-corpo de vidro), fora de foco,
// larguras e tons determinísticos — nenhuma marca, só luz de loja
(()=>{const city=out.querySelector('.r11-city');let r=7;const rnd=()=>(r=(r*9301+49297)%233280)/233280;let html='';
  for(const[row,bottom,h]of[[0,0,34],[1,47,27]]){let x=-2;while(x<100){const w=9+rnd()*9,tone=rnd();html+=`<b class="r11-shop" style="left:${x.toFixed(2)}%;width:${w.toFixed(2)}%;bottom:${bottom}%;height:${h}%;--t:${tone.toFixed(2)};--row:${row}"></b>`;x+=w+.6}}
  city.innerHTML=html+'<i class="r11-mezz"></i><i class="r11-skylight"></i>';
  const trees=near.querySelector('.r11-trees');let t='';for(const l of[8,37,63,92]){t+=`<b style="left:${l}%;width:2.6%;height:100%"></b>`}trees.innerHTML=t;})();
const rack=document.createElement('div');rack.className='r11-rack';
const rods=el('r11-rods','<i class="r11-rod r11-rod-l"></i><i class="r11-rod r11-rod-r"></i>');
const portal=el('r11-portal','<i class="r11-jamb r11-jamb-l"></i><i class="r11-jamb r11-jamb-r"></i><i class="r11-lintel"></i><i class="r11-sill"></i>');
const atmo=el('r11-atmo','<i class="r11-dim"></i>'),atmoDim=atmo.firstElementChild;
const Scene={
  W:0,H:0,P:1000,Oy:300,Dw:360,Dn:420,Zp:420,C0:550,
  build(){
    const bar=document.getElementById('railBar'),items=document.getElementById('railItems');
    // a arara (barra + cabides) muda de pai mas não de lugar: o plano z=0 tem o mesmo tamanho do palco
    rack.append(rods,bar,items);
    // ordem de pintura: rua → piso (o trecho de fora aparece pelo vidro) → vidro → teto → laterais → arara → porta
    room.append(out,near,floor,wall,cones,ceil,sideL,sideR,rack,portal);
    vp.prepend(room);room.after(atmo);
    vp.classList.add('r11');vp.dataset.stage=Perf.tier;
  },
  measure(){
    const g=R.geometry,W=vp.clientWidth,H=vp.clientHeight;if(!W||!H||!g.gw)return false;
    const P=Math.round(clamp(.55*W+.6*H,620,1500)),Oy=g.barTop+g.gw*.62;
    const Dw=.36*P,Zp=.42*P,C0=(g.m?.5:.55)*P,Dn=Math.min(.9*P,C0+.32*P),f=P/(P+Dw);
    // piso no plano da arara a ~0,2 roupa abaixo da barra das peças mais longas (arara de loja); o vidro do fundo
    // encontra o piso mais acima, por trás das barras — e o reflexo das peças cai dentro do quadro
    const Yf=g.barTop+g.gw*1.65,Yc=Oy-(Oy+14)/f,Xr=W/2*.97/f,L=Dn+Dw,Do=1.1*P,Lf=L+Do;
    Object.assign(this,{W,H,P,Oy,Dw,Dn,Zp,C0,f,Yf,Yc,Xr,L,Do,Lf});
    // linha do piso no plano da arara: a V10 pousa ali a sombra de contato de cada peça
    Stage.floorY=Yf;
    room.style.perspective=P+'px';room.style.perspectiveOrigin=`50% ${Oy.toFixed(1)}px`;
    const box=(n,l,t,w,h)=>Object.assign(n.style,{left:l.toFixed(1)+'px',top:t.toFixed(1)+'px',width:w.toFixed(1)+'px',height:h.toFixed(1)+'px'});
    box(wall,W/2-Xr,Yc,2*Xr,Yf-Yc);
    box(floor,W/2-Xr,Yf,2*Xr,Lf);box(ceil,W/2-Xr,Yc,2*Xr,L);
    floor.style.setProperty('--glass',(L/Lf*100).toFixed(2)+'%');floor.style.setProperty('--tile',Math.round(g.gw*1.45)+'px');
    // rua: o retângulo do vidro ampliado pela distância extra (e folga para a câmera andar), no mesmo eixo O
    const k=(P+Dw+Do)/(P+Dw)*1.18,ox=W/2-Xr*k,oy=Oy+(Yc-Oy)*k,ow=2*Xr*k,oh=(Yf-Oy)*k-(Yc-Oy)*k;
    box(out,ox,oy,ow,oh);out.style.setProperty('--ground',(Yf-oy).toFixed(1)+'px');
    // calçada: plano das árvores a 0,35P além do vidro, com a base exatamente no chão (não cobre o piso da frente)
    const Dn2=.35*P,k2=(P+Dw+Dn2)/(P+Dw)*1.2,ny=Oy+(Yc-Oy)*k2;this.Dnear=Dn2;
    box(near,W/2-Xr*k2,ny,2*Xr*k2,Yf-ny);
    // spots do teto: 4 fileiras entre a porta e o vidro (posição local = Dn - z, igual no teto e no piso)
    const rows=[.42,.16,-.08,-.26].map(z=>clamp(z*P,-Dw*.9,Dn*.95)),lx=[30,70];
    ceil.querySelector('.r11-lights')?.remove();const cl=document.createElement('i');cl.className='r11-lights';
    cl.innerHTML=rows.map((z,r)=>lx.map(x=>`<b style="left:${x}%;top:${(Dn-z).toFixed(1)}px;--r:${r}"></b>`).join('')).join('');ceil.append(cl);
    floor.querySelector('.r11-pools').innerHTML=rows.map((z,r)=>lx.map(x=>`<b style="left:${x}%;top:${(Dn-z).toFixed(1)}px;--r:${r}"></b>`).join('')).join('');
    // cones de luz: só as fileiras atrás da arara (z<0), planos verticais entre o vidro e as roupas
    this.coneRows=rows.filter(z=>z<0);
    cones.innerHTML=this.coneRows.map((z,r)=>`<div class="r11-cone-row" style="--r:${r+2}">${lx.map(x=>`<b style="left:${x}%"></b>`).join('')}</div>`).join('');
    [...cones.children].forEach(c=>Object.assign(c.style,{left:(W/2-Xr).toFixed(1)+'px',top:Yc.toFixed(1)+'px',width:(2*Xr).toFixed(1)+'px',height:(Yf-Yc).toFixed(1)+'px'}));
    // caixilhos: painéis de ~1,5 m (a largura útil da roupa é ~0,6 m) no fundo e ao longo das laterais
    const panel=g.gw*2.4,n=Math.max(2,Math.round(2*Xr/panel)),nd=Math.max(1,Math.round(L/panel));
    wall.querySelector('.r11-mullions').innerHTML=Array.from({length:n-1},(_,i)=>`<b style="left:${((i+1)/n*100).toFixed(3)}%"></b>`).join('');
    // a luz do dia entra pelo vidro: cada montante (e as quinas) deita uma sombra longa no piso em direção à câmera
    floor.querySelector('.r11-floor-mull').innerHTML=Array.from({length:n+1},(_,i)=>`<b style="left:${(i/n*100).toFixed(3)}%"></b>`).join('');
    [sideL,sideR].forEach(sd=>{sd.querySelector('.r11-mullions').innerHTML=Array.from({length:nd},(_,i)=>`<b style="left:${((i+1)/(nd+1)*100).toFixed(3)}%"></b>`).join('')});

    box(sideL,W/2-Xr,Yc,L,Yf-Yc);box(sideR,W/2+Xr,Yc,L,Yf-Yc);
    // contato e poça de luz no piso, sob a arara (plano z=0 fica a Dn da borda de perto do piso)
    floor.style.setProperty('--rack',(Dn/L*100).toFixed(2)+'%');floor.style.setProperty('--sill',(Dn-Zp).toFixed(1)+'px');
    // letreiro GB no alto da parede: visível ao entrar, sai de quadro para cima quando a câmera chega
    wall.style.setProperty('--sign-y',(Oy-(Oy+40)/f-Yc).toFixed(1)+'px');
    // hastes da arara presas no teto (plano z=0, y=Yc)
    // barra de parede a parede (encaixada nas laterais, sem ponta solta) com duas hastes no teto a 6% das bordas
    vp.style.setProperty('--r11-bar-l',(W/2-Xr).toFixed(1)+'px');vp.style.setProperty('--r11-bar-w',(2*Xr).toFixed(1)+'px');R.setBarSpan(Xr);
    rods.style.setProperty('--ceil',Yc.toFixed(1)+'px');
    const rx=W*.44;rods.style.setProperty('--rod-x',rx.toFixed(1)+'px');rods.style.setProperty('--rod-h',(R.barY(rx)-Yc+2).toFixed(1)+'px');
    // batente da porta: abertura ~80% do quadro na chegada, fora de quadro quando a câmera passa
    const sp=P/(P-Zp+C0),Xp=.41*W/sp,Yl=Oy-(Oy-.04*H)/sp;
    portal.style.setProperty('--xp',Xp.toFixed(1)+'px');portal.style.setProperty('--yl',Yl.toFixed(1)+'px');portal.style.setProperty('--yf',Yf.toFixed(1)+'px');
    Camera.apply();return true;
  },
};

/* ============================== Camera ============================== */
const ease=u=>u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;                 // in-out de cinema: arranca e assenta macio
const Camera={
  c:0,cx:0,cy:0,light:1,
  // molas de reação (parallax do ponteiro, impulso de navegação, push/pull do Object View)
  px:new M.Spring(0,{k:38,z:.9}),py:new M.Spring(0,{k:38,z:.9}),cz:new M.Spring(0,{k:46,z:.92}),
  shot:null,running:false,
  far(){const S=Scene;this.c=S.C0;this.cx=-.035*S.W;this.cy=-.07*S.H;this.light=.38;this.scene('far');R.stageHide();this.apply()},
  live(){this.shot=null;this.c=0;this.cx=this.cy=0;this.light=1;this.scene('live');vp.classList.add('r11-lit');this.apply()},
  scene(n){vp.dataset.scene=n;vp.classList.toggle('r11-film',n!=='live')},
  // dolly: avanço com crane e pequeno arco lateral; interrompível — o gesto encurta o resto do plano
  dolly({hold=520,dur=Perf.tier==='touch'?1400:1600}={}){
    const from={c:this.c,cx:this.cx,cy:this.cy,light:this.light};
    this.shot={t0:now()+hold,dur,from};this.scene('dolly');this.run();
    // a arara surge: os cabides são pousados na barra enquanto a câmera ainda está na porta
    R.stageEnter(520);
    // a loja acorda: as fileiras de spots acendem da porta para o fundo enquanto os cabides pousam
    setTimeout(()=>vp.classList.add('r11-lit'),Math.max(0,hold-420));
  },
  hurry(){
    if(!this.shot)return;
    this.shot={t0:now(),dur:340,from:{c:this.c,cx:this.cx,cy:this.cy,light:this.light},hurried:true};this.run();
    R.stageEnter(0,{step:18});
  },
  run(){if(this.running)return;this.running=true;M.Ticker.add(dt=>this.step(dt))},
  step(dt){
    const s=this.shot;
    if(s){
      const u=clamp((now()-s.t0)/s.dur,0,1),e=s.hurried?1-Math.pow(1-u,3):ease(u);
      if(u>0&&!s.hurried)Perf.sample(dt);
      // primeira pessoa: três passos curtos (a câmera sobe e desce poucos px), que somem ao chegar
      const walk=s.hurried?0:Math.sin(e*Math.PI*6)*Math.sin(e*Math.PI)*Scene.H*(Perf.tier==='touch'?.004:.005);
      this.c=lerp(s.from.c,0,e);this.cx=lerp(s.from.cx,0,e);this.cy=lerp(s.from.cy,0,e)+walk;
      // a luz chega um pouco antes da câmera: "a luz revela as peças"
      this.light=lerp(s.from.light,1,clamp(e*1.35,0,1));
      if(u>=1){this.shot=null;this.scene('live');if(!s.hurried)this.cz.v=-.16*Scene.P;Reveal.arrived()}
    }
    this.px.step(dt);this.py.step(dt);this.cz.step(dt);this.apply();
    const busy=!!this.shot||!(this.px.settled&&this.py.settled&&this.cz.settled);
    if(!busy){this.px.jump(this.px.target);this.py.jump(this.py.target);this.cz.jump(this.cz.target);this.apply();this.running=false;return false}
  },
  apply(){
    const S=Scene;if(!S.W)return;
    // dolly/crane movem a câmera inteira; parallax do ponteiro e respiro de navegação giram em torno do plano
    // focal (a arara): cada plano desloca px·z/P — a arara (z=0) fica parada, a sala ao redor desliza
    const c=this.c+this.cz.x,x=this.cx,y=this.cy,ox=this.px.x/S.P,oy=this.py.x/S.P;
    const t=z=>`translate3d(${(-x-ox*z).toFixed(2)}px,${(-y-oy*z).toFixed(2)}px,${(z-c).toFixed(2)}px)`;
    wall.style.transform=t(-S.Dw);out.style.transform=t(-S.Dw-S.Do);near.style.transform=t(-S.Dw-S.Dnear);
    const cr=cones.children;for(let i=0;i<cr.length;i++)cr[i].style.transform=t(S.coneRows[i]);
    floor.style.transform=ceil.style.transform=t(S.Dn)+' rotateX(-90deg)';
    sideL.style.transform=sideR.style.transform=t(S.Dn)+' rotateY(90deg)';
    // em repouso o plano da arara fica sem transform: geometria, hit-test e nitidez idênticos à V10
    const rest=Math.abs(c)<.05&&Math.abs(x)<.05&&Math.abs(y)<.05;
    rack.style.transform=rest?'':t(0);
    const pv=c>S.Zp*.25;if(pv!==!portal.hidden)portal.hidden=!pv;
    if(pv)portal.style.transform=t(S.Zp);
    // só a atmosfera usa o nível de luz: escrever a variável no palco inteiro invalidaria o estilo de todas as
    // peças a cada quadro (medido: ~4× mais caro). A luz vai direto na opacidade da camada que escurece.
    const dim=((1-this.light)*.16).toFixed(3);if(dim!==this.lastDim){this.lastDim=dim;atmoDim.style.opacity=dim}
    window.GBRailScene.camera={c:+c.toFixed(2),x:+x.toFixed(2),y:+y.toFixed(2),orbit:[+this.px.x.toFixed(2),+this.py.x.toFixed(2)],scale:+(S.P/(S.P+c)).toFixed(4),light:+this.light.toFixed(3)};
  },
};

/* ============================== Wind ============================== */
// Ar de loja: rajadas de 2,4–3,8 s a cada 4,5–8 s, sequência determinística. Entre rajadas nada roda.
let seed=0x6b1d;const rand=()=>(seed=(seed*1103515245+12345)>>>0)/4294967296;
const Wind={
  g:null,timer:0,on:false,lastPoke:0,
  level(t){
    // rajada criada no meio de um quadro pode ter t0 depois do carimbo do quadro: devolve um valor mínimo
    // (não zero) para o relógio da arara não parar antes de ela começar — senão a rajada fica presa
    const g=this.g;if(!g)return 0;const u=(t-g.t0)/g.dur;if(u<0)return 1e-4;
    if(u>=1){this.g=null;this.next();return 0}
    const s=Math.sin(Math.PI*u);return g.peak*s*s;
  },
  gust(peak,dur){if(!this.on||this.g)return;this.g={t0:now()/1000,dur,peak};R.wake()},
  // brisa mais presente (pedido V11.3): rajadas de 3–5 s a cada 1,8–4 s com a arara em tela; fora dela, nada
  // a próxima rajada só sopra com a arara parada: se os cabides ainda assentam a anterior, espera mais um pouco
  // (sem rAF) — entre rajadas o relógio sempre para, mesmo num aparelho lento
  next(delay){clearTimeout(this.timer);if(!this.on)return;const blow=()=>{if(document.getElementById('railItems')?.classList.contains('is-moving')){this.timer=setTimeout(blow,600);return}this.gust(.62+rand()*.38,3+rand()*2)};this.timer=setTimeout(blow,delay??(1400+rand()*1800))},
  setOn(v){v=!!v&&Perf.tier!=='static'&&!reduced();if(v===this.on)return;this.on=v;if(v)this.next(1600);else{clearTimeout(this.timer);this.g=null}},
  // o ar se move com a mão: passar rápido o mouse pela arara levanta uma rajada curta (no máximo a cada 2,5 s)
  poke(speed){const t=now();if(!this.on||this.g||t-this.lastPoke<2500||speed<.9)return;this.lastPoke=t;this.gust(clamp(speed*.22,.25,.55),1.8)},
};

/* ============================== Stage (contrato lido pela V10) ============================== */
const Stage=window.GBRailScene={
  rig:Perf.tier!=='static',
  // espelho da peça em foco no piso polido (a V10 desenha; medido: reflexo da camada inteira custava ~45 ms/quadro)
  reflect:true,
  wind:t=>Wind.level(t),
  get phase(){return vp.dataset.scene},
  get tier(){return Perf.tier+(Perf.low?'-low':'')},
  get air(){return{on:Wind.on,gust:!!Wind.g,inView,done:Reveal.done}},
  camera:{},
};

/* ============================== Reveal: depois do capítulo V12 ============================== */
const Reveal={
  done:false,started:false,
  start(){if(this.started)return;this.started=true;if(Perf.tier==='static'){this.arrived();return}Camera.dolly()},
  arrived(){if(this.done)return;this.done=true;Camera.live();
    // a arara ganha vida: primeira rajada logo depois de a câmera assentar
    Wind.setOn(inView&&!document.hidden);if(Wind.on){clearTimeout(Wind.timer);setTimeout(()=>Wind.gust(1,3.2),180)}},
  init(){
    if(Perf.tier==='static'){Camera.live();this.done=this.started=true;return}
    Camera.far();
    const chap=sec.querySelector(':scope>.gb-chap');
    if(chap){
      // o muro do capítulo cobre a seção: a loja espera atrás dele, já no plano aberto; o filme começa quando os
      // blocos abrem (is-out). Sem um segundo overlay e sem timer cego: só um teto de segurança se o capítulo sumir.
      const go=()=>{mo.disconnect();this.start()};
      const mo=new MutationObserver(()=>{if(chap.classList.contains('is-out')||!chap.isConnected)go()});
      mo.observe(chap,{attributes:true,attributeFilter:['class']});mo.observe(sec,{childList:true});
      M.onVisible(vp,v=>{if(v&&!this.started)setTimeout(()=>{if(!this.started&&!chap.classList.contains('is-on'))go()},2600)},{threshold:.2});
    }else{
      // sem capítulo (seção já na tela ao carregar, link direto): o filme começa quando a arara aparece
      const off=M.onVisible(vp,v=>{if(v){off();setTimeout(()=>this.start(),220)}},{threshold:.3});
    }
  },
};

let inView=false;
/* ============================== Light + Depth ============================== */
// qualquer intenção do visitante encurta o filme (nunca bloqueia arrasto, setas, teclado ou clique)
const hurry=()=>{if(!Reveal.started)Reveal.start();if(Camera.shot)Camera.hurry()};
['pointerdown','wheel','keydown'].forEach(e=>vp.addEventListener(e,hurry,{passive:true,capture:true}));
vp.addEventListener('gb:rail:intent',hurry);
// arrasto (mouse ou toque): a sala gira levemente contra o gesto, a arara segue 1:1 sob o dedo
vp.addEventListener('gb:rail:drag',e=>{if(Perf.tier==='static'||!Reveal.done)return;Camera.px.set(clamp(-(e.detail?.v||0)*Scene.W*.006,-Scene.W*.035,Scene.W*.035));Camera.run()});
vp.addEventListener('gb:rail:navigate',e=>{
  hurry();if(Perf.tier!=='static'&&!vp.matches(':hover'))Camera.px.set(0);
  // câmera quase ancorada: acompanha o deslocamento com um respiro e volta ao eixo
  const d=Math.sign((e.detail?.index??0)-(e.detail?.from??e.detail?.index??0));
  if(d&&Perf.tier!=='static'){Camera.px.v+=d*(Perf.tier==='touch'?70:110);Camera.run()}
});
vp.addEventListener('gb:rail:open',()=>{if(Perf.tier==='static')return;vp.classList.add('r11-viewing');Camera.cz.set(-.06*Scene.P);Camera.run()});
vp.addEventListener('gb:rail:close',()=>{vp.classList.remove('r11-viewing');if(Perf.tier==='static')return;
  // volta do Object View: a câmera sai de perto da peça e recua até o plano médio
  Camera.cz.jump(-.07*Scene.P);Camera.cz.set(0);Camera.run()});
// primeira pessoa: apertar (dedo, caneta ou mouse) inclina o corpo para a arara; o olhar segue o ponto tocado
// (no toque, o vertical; o horizontal vem do próprio arrasto). Soltar devolve a câmera. Nada bloqueia rolagem.
if(Perf.tier!=='static'){
  let press=null;
  const look=(e,both)=>{const r=vp.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;
    if(both)Camera.px.set(nx*Scene.W*.035);Camera.py.set(ny*Scene.H*.03);Camera.run()};
  vp.addEventListener('pointerdown',e=>{if(!Reveal.done||e.button>0||e.target.closest('.rail-controls,.r10-caption,.gb-tags'))return;press=e.pointerId;
    Camera.cz.set(-.015*Scene.P);look(e,e.pointerType!=='mouse');},{passive:true});
  vp.addEventListener('pointermove',e=>{if(press===e.pointerId&&e.pointerType!=='mouse')look(e,false)},{passive:true});
  const release=e=>{if(press!==e.pointerId)return;press=null;if(!vp.matches('.r11-viewing'))Camera.cz.set(0);if(e.pointerType!=='mouse'){Camera.px.set(0);Camera.py.set(0)}Camera.run()};
  ['pointerup','pointercancel','lostpointercapture'].forEach(n=>vp.addEventListener(n,release,{passive:true}));
}
if(Perf.tier==='full'&&M.Prefs.fine){
  let lx=0,lt=0;
  vp.addEventListener('pointermove',e=>{
    if(e.pointerType!=='mouse'||vp.classList.contains('is-dragging')||!Reveal.done)return;
    const r=vp.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;
    Camera.px.set(nx*Scene.W*.04);Camera.py.set(ny*Scene.H*.03);Camera.run();
    const t=now();if(lt){Wind.poke(Math.abs(e.clientX-lx)/Math.max(8,t-lt))}lx=e.clientX;lt=t;
  },{passive:true});
  vp.addEventListener('pointerleave',()=>{Camera.px.set(0);Camera.py.set(0);Camera.run()});
}

/* ============================== Montagem ============================== */
Scene.build();
if(!Scene.measure())requestAnimationFrame(()=>Scene.measure());
Reveal.init();
let rz=0;const remeasure=()=>{clearTimeout(rz);rz=setTimeout(()=>Scene.measure(),140)};
if('ResizeObserver'in window)new ResizeObserver(remeasure).observe(vp);else addEventListener('resize',remeasure,{passive:true});
// vento só com a arara em cena e a aba visível
M.onVisible(vp,v=>{inView=v;Wind.setOn(v&&Reveal.done&&!document.hidden)},{threshold:.15});
document.addEventListener('visibilitychange',()=>Wind.setOn(inView&&Reveal.done&&!document.hidden));
vp.addEventListener('gb:rail:settled',()=>{if(Reveal.done&&inView)Wind.setOn(!document.hidden)});
})();
