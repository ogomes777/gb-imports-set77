/* GB IMPORTS / DARK SPECTRUM V8 · ABAIXO DE ZERO — GSAP + THREE (lazy, section-scoped).
 * Tema frio da coleção Tech Fleece. A seção chega no papel da landing (V1) e CONGELA ao chegar no título:
 * uma frente de gelo cristalina nasce no floco e transforma o papel em noite azul profunda; a tinta das letras
 * vira gelo em onda (da direita para a esquerda). Ao sair por baixo, volta ao papel e congela de novo na volta.
 * Título azul gelo em 3D que flutua e pulsa; onda de frio a cada 9 s; floco de cristal que gira 360° sozinho
 * e responde a arrasto (mouse/dedo) com inércia.
 * Desempenho: tudo (Three, geometria, shaders, quadro de aquecimento) é preparado em tempo ocioso 1–2 telas antes;
 * um braço do floco extrudado e girado 6x; paisagem em meia resolução; 60 fps com queda adaptativa.
 * Só roda visível; movimento reduzido/aparelho modesto fica no fallback CSS (sem papel, sem congelamento).
 * Nenhuma imagem ou estado do catálogo é alterado.
 */
(()=>{
'use strict';
const section=document.getElementById('showroom');
const heading=section?.querySelector('.showroom-heading');
const stage=heading?.querySelector('.showroom-cinema-bg');
if(!heading||!stage)return;
const motion=window.GBMotion;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const coarse=window.matchMedia('(pointer: coarse)');
const lite=()=>!!(motion?.Prefs?.lite||navigator.connection?.saveData||navigator.deviceMemory<=2);
// cor fixa (gelo): o título não troca mais de cor; vive em 3D, flutua, pulsa e recebe a onda de brilho
const ICE={name:'GELO',rgb:[74,168,255],bg:[4,10,24]};
const state={r:74,g:168,b:255,br:4,bg:10,bb:24,energy:.42,pulse:0};
const WAVE=9; // segundos entre uma onda de frio e a próxima (o shader usa o mesmo período)
let active=false,initialized=false,destroyed=false,gsap=null,cycle=null,scene3d=null,visible=false,arrived=false;
let loading3d=false,webglFailed=false,tilt=null,warm=false;
// estado "landing": a seção chega no papel V1 e só congela ao chegar no título
const setWarm=v=>{warm=!!v;heading.classList.toggle('is-warm',warm)};
const canWarm=()=>!reduce.matches&&!lite()&&!webglFailed&&!destroyed;
const title=heading.querySelector('h2');
const cap=(n,min,max)=>Math.max(min,Math.min(max,n));
const rgb=(r,g,b)=>'rgb('+[r,g,b].map(x=>Math.round(cap(x,0,255))).join(',')+')';
// variáveis CSS só são escritas quando mudam (as tweens chamam isto a cada quadro; evita recálculo de estilo à toa)
const vars={};const setVar=(k,v)=>{if(vars[k]!==v){vars[k]=v;heading.style.setProperty(k,v)}};
const apply=()=>{
  const c=[state.r,state.g,state.b].map(x=>Math.round(cap(x,0,255)));
  setVar('--cinema-accent',rgb(...c));setVar('--cinema-rgb',c.join(','));setVar('--cinema-bg',rgb(state.br,state.bg,state.bb));
  if(!scene3d)setVar('--cinema-energy',state.energy.toFixed(2));   // só o fallback CSS usa a energia
  scene3d?.tint(state);
};
apply();heading.dataset.spectrum=ICE.name;

/* ---------- título em letras (leitores de tela leem o h2 inteiro pelo aria-label) ----------
   .sc-ch recebe a chegada (GSAP) · .sc-fl flutua/pulsa (CSS, só transform) · .sc-gl é a camada de brilho (só opacity) */
let chars=[],glows=[];
function splitTitle(){
  if(!title||title.dataset.split)return;
  title.dataset.split='1';title.setAttribute('aria-label',title.innerHTML.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim());
  let i=0;
  const walk=node=>{[...node.childNodes].forEach(n=>{
    if(n.nodeType===3){const f=document.createDocumentFragment();[...n.textContent].forEach(ch=>{if(ch.trim()===''){f.append(ch);return}
      const s=document.createElement('span');s.className='sc-ch';s.setAttribute('aria-hidden','true');s.style.setProperty('--i',i++);
      const fl=document.createElement('span');fl.className='sc-fl';
      for(const k of ['sc-ice','sc-wm','sc-gl']){const e=document.createElement('span');e.className=k;e.textContent=ch;fl.append(e)}
      s.append(fl);f.append(s)});n.replaceWith(f)}
    else if(n.nodeType===1&&n.tagName!=='BR')walk(n);
  })};
  walk(title);chars=[...title.querySelectorAll('.sc-ch')];glows=[...title.querySelectorAll('.sc-gl')];
  chars.forEach((c,i)=>c.style.setProperty('--j',chars.length-1-i));   // o gelo vem do floco (direita): a última letra congela primeiro
  heading.style.setProperty('--sc-count',chars.length);
}
// o seletor de idioma reescreve o h2: refaz as letras (e esconde de novo se a chegada ainda não aconteceu)
const titleMO=('MutationObserver'in window)&&title?new MutationObserver(()=>{if(title.querySelector('.sc-ch'))return;delete title.dataset.split;splitTitle();
  if(gsap&&!arrived&&!warm&&!reduce.matches&&chars.length)gsap.set(chars,{yPercent:118,rotationX:-88,opacity:0})}):null;
titleMO?.observe(title,{childList:true});

/* ---------- câmara fria do Tech Fleece: anel neon de gelo + duas camadas de neve atrás da peça (só CSS transform/opacity) ---------- */
const shell=section.querySelector('.showroom-shell'),feature=section.querySelector('.showroom-feature');
if(feature&&!feature.querySelector('.sc-snow'))['far','near'].forEach(k=>{const d=document.createElement('span');d.className='sc-snow sc-snow-'+k;d.setAttribute('aria-hidden','true');feature.append(d)});
const ring=feature?.querySelector('.showroom-glow');
if(ring&&!ring.querySelector('.sc-ring'))['ticks','arc','surge'].forEach(k=>{const d=document.createElement('span');d.className='sc-ring sc-ring-'+k;d.setAttribute('aria-hidden','true');ring.append(d)});
// a neve e o neon só animam com o palco na tela
const coldIO=('IntersectionObserver'in window)&&shell?new IntersectionObserver(es=>es.forEach(e=>shell.classList.toggle('is-cold-live',e.isIntersecting)),{rootMargin:'120px 0px'}):null;
coldIO?.observe(shell);

// onda de brilho: corre pelas letras da esquerda para a direita, junto com a frente fria do fundo
function glowWave(strength=1,each=.045){
  if(!gsap||!glows.length||reduce.matches||warm)return;
  gsap.killTweensOf(glows);
  gsap.fromTo(glows,{opacity:0},{keyframes:[{opacity:.6*strength,duration:.3,ease:'power2.out'},{opacity:0,duration:1.1,ease:'sine.inOut'}],stagger:{each,from:'start'}});
}

function canRun(){return !destroyed&&visible&&!document.hidden&&!reduce.matches}
function activate(){
  if(!initialized||!canRun()||active)return;
  active=true;cycle?.resume();scene3d?.resume();ensure3d();stage.classList.add('is-running');
}
function deactivate(){
  if(!active)return;active=false;cycle?.pause();scene3d?.pause();stage.classList.remove('is-running');
}
function setStatic(){
  deactivate();cycle?.kill();cycle=null;setWarm(false);scene3d?.setFrozen(true);
  Object.assign(state,{r:74,g:168,b:255,br:4,bg:10,bb:24,energy:.42,pulse:0});
  if(gsap&&chars.length){gsap.set(chars,{clearProps:'transform,opacity'});gsap.set(glows,{clearProps:'opacity'});if(title)gsap.set(title,{clearProps:'transform'})}
  apply();
}
// sem WebGL (fallback CSS) a onda de brilho segue no mesmo ritmo, guiada só pelo GSAP
function makeCycle(){
  if(!gsap||reduce.matches||destroyed||scene3d)return;
  cycle?.kill();
  cycle=gsap.timeline({paused:true,repeat:-1}).add(()=>glowWave(.8),WAVE-.01).to({},{duration:.01});
}
// inclinação do título pelo ponteiro (desktop): o bloco gira em 3D, as letras seguem flutuando dentro dele
function bindTilt(){
  if(tilt||!gsap||!title||coarse.matches)return;
  gsap.set(title,{transformPerspective:1400,transformOrigin:'40% 60%'});
  const ry=gsap.quickTo(title,'rotationY',{duration:.9,ease:'power3.out'}),rx=gsap.quickTo(title,'rotationX',{duration:.9,ease:'power3.out'});
  const move=e=>{const r=heading.getBoundingClientRect();ry(cap((e.clientX-r.left)/r.width-.5,-.5,.5)*12);rx(-cap((e.clientY-r.top)/r.height-.5,-.5,.5)*8)};
  const leave=()=>{ry(0);rx(0)};
  heading.addEventListener('pointermove',move,{passive:true});heading.addEventListener('pointerleave',leave,{passive:true});
  tilt={off:()=>{heading.removeEventListener('pointermove',move);heading.removeEventListener('pointerleave',leave)}};
}
// chegada: letras sobem em 3D, a cena explode em luz e a primeira onda de brilho passa
function arrive(){
  if(!gsap||reduce.matches||destroyed)return;
  arrived=true;
  const t=gsap.timeline({onComplete:()=>{makeCycle();if(active)cycle?.play()}});
  if(warm){
    // CONGELA: frente de gelo no fundo, letras trocam a tinta pelo gelo (CSS, onda da direita para a esquerda) e dão um arrepio
    t.add(()=>{scene3d?.freeze();scene3d?.arrive();setWarm(false)},0);
    if(chars.length)t.to(chars,{keyframes:[{yPercent:-5,skewX:-5,duration:.14,ease:'power2.out'},{yPercent:0,skewX:0,duration:.7,ease:'elastic.out(1,.4)'}],stagger:{each:.045,from:'end'}},.35);
    t.add(()=>glowWave(1,.06),1.25);
    t.to(state,{energy:1,pulse:1,duration:1.1,ease:'expo.out',onUpdate:apply},.3);
    t.to(state,{energy:.5,pulse:0,duration:1.8,ease:'sine.out',onUpdate:apply});
    return;
  }
  if(chars.length){
    gsap.set(title,{perspective:900});
    t.fromTo(chars,{yPercent:118,rotationX:-88,opacity:0,transformOrigin:'50% 100% -40px'},{yPercent:0,rotationX:0,opacity:1,duration:1.05,ease:'expo.out',stagger:{each:.032,from:'start'}},0);
  }
  t.add(()=>{scene3d?.arrive()},0);
  t.add(()=>glowWave(1),.55);
  t.to(state,{energy:1,pulse:1,duration:1.1,ease:'expo.out',onUpdate:apply},.38);
  t.to(state,{energy:.5,pulse:0,duration:1.8,ease:'sine.out',onUpdate:apply});
}

let gsapP=null;
function loadGSAP(){
  if(window.gsap)return Promise.resolve(window.gsap);
  return gsapP||(gsapP=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.async=true;
    script.src='https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';script.crossOrigin='anonymous';
    script.onload=()=>window.gsap?resolve(window.gsap):reject(new Error('GSAP did not initialize'));
    script.onerror=()=>reject(new Error('GSAP blocked'));
    document.head.appendChild(script);
  }));
}

// fatia o trabalho pesado em momentos ociosos (nada de tarefa longa travando a rolagem)
const idle=()=>new Promise(r=>{const ric=window.requestIdleCallback;ric?ric(()=>r(),{timeout:160}):setTimeout(r,16)});
let threeP=null;const loadThree=()=>threeP||(threeP=import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js'));

/* ============================== THREE: cena surreal ============================== */
const NOISE=`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}`;

async function makeWebGL(THREE){
  if(lite()||destroyed||reduce.matches)return null;
  const mount=stage.querySelector('.showroom-cinema-webgl');if(!mount)return null;
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.setAttribute('role','presentation');mount.appendChild(canvas);
  let renderer;
  const touch=coarse.matches;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:!touch,alpha:false,powerPreference:'high-performance'})}catch(err){canvas.remove();return null}
  // 1x no desktop, até 1,25x no toque para o cristal ficar nítido em tela retina (a paisagem vai em meia resolução)
  renderer.setPixelRatio(touch?Math.min(1.25,window.devicePixelRatio||1):1);
  const world=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,.1,60);camera.position.set(0,0,11);
  const U={uTime:{value:0},uColor:{value:new THREE.Color(.29,.66,1)},uEnergy:{value:.42},uPulse:{value:0},uPointer:{value:new THREE.Vector2(0,0)},uRes:{value:new THREE.Vector2(1,1)},uScroll:{value:0},uWarp:{value:0},uHover:{value:0},uFreeze:{value:arrived?1:0},uOrigin:{value:new THREE.Vector2(.78,.5)}};
  const disposables=[];const keep=x=>{disposables.push(x);return x};
  await idle();
  // céu frio compartilhado: a paisagem e o reflexo/refração do cristal usam a mesma luz
  const SKY=`vec3 sky(vec3 d){float y=d.y;vec3 top=vec3(.10,.17,.26),hor=vec3(.55,.66,.75);vec3 c=mix(hor,top,smoothstep(-.05,.6,y));
    c+=vec3(.9,.95,1.)*pow(max(dot(normalize(d),normalize(vec3(.35,.45,-.8))),0.),18.)*.9;c=mix(c,vec3(.3,.38,.46),smoothstep(.0,-.4,y));return c;}`;

  // 1. Paisagem congelada (plano de fundo em tela cheia): céu de tempestade em movimento com abertura de luz,
  //    cordilheira de gelo ao longe, falésia à esquerda, planície gelada que reflete o céu, bruma no horizonte.
  const land=new THREE.Mesh(keep(new THREE.PlaneGeometry(2,2)),keep(new THREE.ShaderMaterial({uniforms:U,depthWrite:false,depthTest:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.999,1.);}`,
    fragmentShader:`precision highp float;varying vec2 vUv;uniform float uTime,uEnergy,uPulse,uScroll;uniform vec3 uColor;uniform vec2 uPointer,uRes;
    float h1(float x){return fract(sin(x*127.1)*43758.5453);}float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n1(float x){float i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(h1(i),h1(i+1.),f);}
    float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<${touch?3:4};i++){v+=a*n2(p);p=p*2.07+vec2(1.7,9.2);a*=.5;}return v;}
    float ridge(float x){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*(1.-abs(n1(x)*2.-1.));x*=2.1;a*=.5;}return v;}
    void main(){vec2 uv=vUv;float asp=uRes.x/uRes.y;float t=uTime;
      float H=.36+uScroll*.04-uPointer.y*.015;          // horizonte (paralaxe leve com rolagem/ponteiro)
      float px=(uv.x-.5)*asp+uPointer.x*.04;
      vec3 col;
      if(uv.y>H){
        float y=(uv.y-H)/(1.-H);
        vec3 c=mix(vec3(.40,.50,.60),vec3(.035,.06,.11),pow(y,.6));
        // nuvens de tempestade: duas camadas em velocidades diferentes, borda iluminada
        vec2 q=vec2(px*1.6+t*.012,y*2.6);float cl=fbm(q*1.3+vec2(t*.02,0.));float cl2=fbm(q*2.4-vec2(t*.035,0.)+cl);
        float dens=smoothstep(.38,.82,cl*.65+cl2*.45);
        vec3 cloud=mix(vec3(.46,.56,.66),vec3(.07,.10,.16),dens*1.15);
        c=mix(c,cloud,smoothstep(.0,.15,y)*.85);
        // abertura de luz atrás do floco
        vec2 sp=vec2(.62*asp-.5*asp,.62);float g=exp(-length(vec2(px-.12*asp,y-.55))*3.2);c+=vec3(.75,.86,.95)*g*(.6+uPulse*.3)*(1.-dens*.5);
        // cordilheira de gelo distante (azulada pela distância) e falésia escura à esquerda
        float m1=H+(.05+ridge(px*2.2+3.)*.11)*(1.-H);float m2=H+(.03+ridge(px*4.1+11.)*.06)*(1.-H);
        if(uv.y<m1)c=mix(c,vec3(.42,.53,.62),.75);
        if(uv.y<m2)c=mix(c,vec3(.29,.38,.47),.85+.15*n2(vec2(px*40.,uv.y*60.)));
        float cliff=H+(1.-H)*smoothstep(-.15*asp,-.62*asp,px)*(.45+ridge(uv.y*6.)*.2);
        if(uv.y<cliff)c=mix(c,vec3(.16,.22,.29)*(.8+.4*n2(vec2(px*14.,uv.y*22.))),.92);
        col=c;
      }else{
        // planície congelada: reflexo borrado do céu + textura de gelo com perspectiva + rachaduras finas
        float d=(H-uv.y)/H;float z=1./(d+.02);vec2 gp=vec2(px*z*.6,z*.9);
        vec3 refl=mix(vec3(.5,.61,.7),vec3(.13,.19,.27),d);
        float ice=fbm(gp*1.2+vec2(0.,t*.01));float crack=smoothstep(.02,.0,abs(fbm(gp*3.)-.5))*(1.-d)*.5;
        col=refl*(.82+ice*.3)+vec3(.8,.9,1.)*crack*.25;
        col+=vec3(.7,.82,.92)*pow(1.-d,8.)*.35;      // brilho rasante na linha do horizonte
      }
      // ONDA DE FRIO: a cada 9 s uma frente de vento gelado atravessa o quadro (mesma fase da neve, do floco e do título)
      float ph=fract(t/9.),front=-.4+ph*1.9,fx=uv.x-front;
      float band=exp(-fx*fx*14.)*smoothstep(0.,.08,ph)*smoothstep(1.,.9,ph);
      float gust=max(band,smoothstep(.0,-.25,fx)*exp(fx*2.2)*.6);   // névoa que fica para trás da frente
      float sd=fbm(vec2(px*1.3-t*.55-gust*.6,uv.y*4.2+t*.05));
      col=mix(col,vec3(.66,.77,.88),smoothstep(.35,.85,sd)*(exp(-abs(uv.y-H)*4.5)*.22+gust*.42));
      col+=vec3(.82,.92,1.)*smoothstep(.86,1.,n2(vec2((px-t*2.6)*3.,uv.y*120.)))*band*.3;   // rajadas de neve riscando
      col+=vec3(.55,.75,1.)*band*.06;
      // geada na borda da lente, só nos cantos, cresce quando a onda passa
      float edge=smoothstep(.62,.95,length((uv-.5)*vec2(1.,.9))*1.3);
      col=mix(col,vec3(.75,.85,.95),smoothstep(.55,.75,fbm(uv*vec2(asp,1.)*9.))*edge*(.10+gust*.14));
      // bruma no horizonte e tingimento frio pela cor do capítulo
      col=mix(col,vec3(.42,.54,.68),exp(-abs(uv.y-H)*16.)*.45);
      col=mix(col,col*(.6+uColor*.7),.35+uEnergy*.15);
      col*=.42;col*=vec3(.74,.88,1.14);   // noite azul profunda: casa com o palco do Tech Fleece abaixo
      // título legível (esquerda/alto mais escuros), vinheta e pé fundindo com o showroom
      col*=mix(.32,1.,smoothstep(.1,.9,uv.x*.95+(1.-uv.y)*.15));
      col*=1.-.45*pow(length((uv-.5)*vec2(1.05,1.25)),2.4);
      col=mix(vec3(.016,.039,.094),col,smoothstep(.0,.18,uv.y));
      gl_FragColor=vec4(col,1.);}`})));
  land.frustumCulled=false;
  // a paisagem é suave: renderiza em meia resolução num buffer e sobe para a tela com grão fino (4x menos pixels de shader)
  const bgScene=new THREE.Scene(),bgCam=new THREE.Camera();bgScene.add(land);
  const rt=keep(new THREE.WebGLRenderTarget(2,2,{depthBuffer:false,stencilBuffer:false}));
  const comp=new THREE.Mesh(keep(new THREE.PlaneGeometry(2,2)),keep(new THREE.ShaderMaterial({uniforms:{tBg:{value:rt.texture},uRes:U.uRes,uTime:U.uTime,uFreeze:U.uFreeze,uOrigin:U.uOrigin},depthWrite:false,depthTest:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,.999,1.);}`,
    fragmentShader:`precision highp float;uniform sampler2D tBg;uniform vec2 uRes,uOrigin;uniform float uTime,uFreeze;varying vec2 vUv;
    float hh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hh(i),hh(i+vec2(1,0)),f.x),mix(hh(i+vec2(0,1)),hh(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 c=texture2D(tBg,vUv).rgb;
      // CONGELAMENTO: a seção chega no papel da landing; uma frente de gelo cristalina nasce no floco e transforma tudo em noite fria
      if(uFreeze<.999){float asp=uRes.x/uRes.y;vec2 a=vUv*vec2(asp,1.);
        float n=vn(a*6.)*.55+vn(a*19.)*.3+vn(a*61.)*.15;
        float d=length((vUv-uOrigin)*vec2(asp,1.))+(n-.5)*.42,R=uFreeze*2.1;
        vec3 paper=vec3(.957,.945,.91);paper=mix(paper,vec3(.78,.87,.95),exp(-max(d-R,0.)*7.)*step(.001,uFreeze)*.6);
        c=mix(paper,c,smoothstep(R+.01,R-.05,d)*step(.001,uFreeze));
        c+=vec3(.72,.9,1.)*exp(-abs(d-R)*38.)*step(.001,uFreeze)*(.9+n*.6);}
      c+=(fract(sin(dot(vUv*uRes+fract(uTime)*91.,vec2(127.1,311.7)))*43758.5453)-.5)*.025;gl_FragColor=vec4(c,1.);}`})));
  comp.frustumCulled=false;comp.renderOrder=-10;world.add(comp);

  // 2. Floco de cristal dendrítico: braços com ramos e sub-ramos finos, placas hexagonais; vidro de gelo com
  //    reflexo e refração do céu, dispersão sutil nas bordas e brilhos especulares. Flutua, gira, segue o ponteiro.
  const flake=new THREE.Group();world.add(flake);
  const shapes=[];
  const bar=(x1,y1,x2,y2,w1,w2=w1*.35)=>{const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),ux=-dy/l,uy=dx/l;const s=new THREE.Shape();
    s.moveTo(x1+ux*w1/2,y1+uy*w1/2);s.lineTo(x2+ux*w2/2,y2+uy*w2/2);s.lineTo(x2+dx/l*w2*.9,y2+dy/l*w2*.9);s.lineTo(x2-ux*w2/2,y2-uy*w2/2);s.lineTo(x1-ux*w1/2,y1-uy*w1/2);s.closePath();return s};
  const plate=(cx,cy,r,rot)=>{const s=new THREE.Shape();for(let k=0;k<6;k++){const a=rot+k*Math.PI/3;s[k?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r)}s.closePath();return s};
  // um braço só, extrudado uma vez e girado 6x num único buffer: 1/6 do trabalho de CPU, um draw call
  const L=2.5,armShapes=[],B=(x1,y1,x2,y2,w1,w2)=>armShapes.push(bar(x1,y1,x2,y2,w1,w2));
  B(.25,0,L,0,.16,.05);armShapes.push(plate(.95,0,.17,Math.PI/6));
  [.42,.72,1.05,1.38,1.7,2.0].forEach((p,i)=>{
    const len=(.95-i*.12)*(i===0?.55:1),w=.09-i*.008,ang=Math.PI/3;
    for(const sgn of [1,-1]){
      const ex=p+Math.cos(ang)*len,ey=sgn*Math.sin(ang)*len;B(p,0,ex,ey,w,.03);
      // sub-ramos (dendritos) nos ramos maiores
      if(len>.4)[.35,.62].forEach(f=>{const bx=p+(ex-p)*f,by=ey*f,l2=len*.32*(1-f*.4);B(bx,by,bx+l2,by,.045,.018);B(bx,by,bx+Math.cos(ang*2)*l2*.9,by+sgn*Math.sin(ang*2)*l2*.9,.045,.018)});
    }
  });
  const EX={depth:.1,bevelEnabled:true,bevelThickness:.045,bevelSize:.028,bevelSegments:touch?1:2,curveSegments:1};
  const arm=new THREE.ExtrudeGeometry(armShapes,EX),core=new THREE.ExtrudeGeometry([plate(0,0,.42,0),plate(0,0,.26,Math.PI/6)],EX);
  const ap=arm.attributes.position.array,an=arm.attributes.normal.array,cp=core.attributes.position.array,cn=core.attributes.normal.array;
  const fpos=new Float32Array(ap.length*6+cp.length),fnor=new Float32Array(fpos.length);
  for(let k=0;k<6;k++){const c=Math.cos(k*Math.PI/3),sn=Math.sin(k*Math.PI/3),o=k*ap.length;
    for(let i=0;i<ap.length;i+=3){fpos[o+i]=ap[i]*c-ap[i+1]*sn;fpos[o+i+1]=ap[i]*sn+ap[i+1]*c;fpos[o+i+2]=ap[i+2];fnor[o+i]=an[i]*c-an[i+1]*sn;fnor[o+i+1]=an[i]*sn+an[i+1]*c;fnor[o+i+2]=an[i+2]}}
  fpos.set(cp,ap.length*6);fnor.set(cn,ap.length*6);arm.dispose();core.dispose();
  const fg=keep(new THREE.BufferGeometry());fg.setAttribute('position',new THREE.BufferAttribute(fpos,3));fg.setAttribute('normal',new THREE.BufferAttribute(fnor,3));fg.translate(0,0,-.05);
  await idle();
  const flakeMat=keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,side:THREE.DoubleSide,
    vertexShader:`varying vec3 vN;varying vec3 vP;varying vec3 vW;varying vec3 vL;void main(){vN=normalize(normalMatrix*normal);vL=normal;vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;vW=position;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uTime,uEnergy,uPulse,uHover;varying vec3 vN;varying vec3 vP;varying vec3 vW;varying vec3 vL;${SKY}
    // estúdio de cristal: o céu frio + softboxes que o gelo reflete (é o reflexo nítido que faz o cristal parecer cristal)
    vec3 env(vec3 r){vec3 c=sky(r)*.75;
      c+=vec3(1.)*smoothstep(.94,.99,dot(r,normalize(vec3(.5,.7,.5))))*3.2;
      c+=vec3(.72,.88,1.)*smoothstep(.965,.995,dot(r,normalize(vec3(-.6,.25,.75))))*2.2;
      c+=vec3(.55,.78,1.)*smoothstep(.0,.05,r.y+.02)*smoothstep(.12,.05,r.y+.02)*.7;
      return c;}
    void main(){vec3 n=normalize(vN);if(!gl_FrontFacing)n=-n;vec3 v=normalize(-vP);float ndv=max(dot(n,v),0.);float fres=.03+.97*pow(1.-ndv,5.);
      vec3 r=reflect(-v,n);vec3 refl=env(r);
      // refração com dispersão (um índice por canal): o corpo é claro e tinge o fundo de azul profundo
      vec3 tr=vec3(env(refract(-v,n,.80)).r,env(refract(-v,n,.78)).g,env(refract(-v,n,.755)).b)*vec3(.5,.68,.95);
      vec3 col=mix(tr,refl,fres);
      // chanfros acesos: onde a normal sai do plano do floco a luz corre pela aresta, como vidro lapidado
      float bev=1.-abs(normalize(vL).z);col+=vec3(.72,.9,1.)*pow(bev,2.5)*(.55+uPulse*.5);
      // núcleo e espinha central com luz interna fria
      float rr=length(vW.xy);col+=mix(uColor,vec3(.8,.93,1.),.4)*exp(-rr*1.4)*.16;
      // cintilação: pontos isolados que piscam ao girar
      float sd=fract(sin(dot(floor(vW*16.),vec3(12.9898,78.233,37.719)))*43758.5453);
      col+=vec3(1.)*step(.94,sd)*pow(max(0.,sin(uTime*2.6+sd*60.+dot(n,vec3(4.,3.,2.)))),24.)*1.6;
      float spec=pow(max(dot(r,normalize(vec3(.4,.6,.7))),0.),140.)*2.6+pow(max(dot(r,normalize(vec3(-.5,.2,.8))),0.),60.)*.7;
      col+=vec3(1.)*spec*(1.+uHover*.4);
      gl_FragColor=vec4(col,clamp(.26+fres*.62+bev*.35+spec*.5,0.,1.));}`}));
  await idle();
  const flakeMesh=new THREE.Mesh(fg,flakeMat);flake.add(flakeMesh);
  const halo=new THREE.Mesh(keep(new THREE.PlaneGeometry(8,8)),keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uTime,uPulse;varying vec2 vUv;void main(){float d=length(vUv-.5);float a=exp(-d*8.)*(.16+.06*sin(uTime*2.)+uPulse*.3);gl_FragColor=vec4(mix(uColor,vec3(.9,.96,1.),.5)*a,a);}`})));
  halo.position.z=-1;flake.add(halo);

  // 3. Neve: duas camadas (longe fina, perto com bokeh), tudo no vertex shader, sem trabalho na CPU
  const snow=(count,spread,depth,sizeMin,sizeMax,blur,seed0)=>{
    const pos=new Float32Array(count*3),rnd=new Float32Array(count*2);let seed=seed0;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<count;i++){pos[i*3]=(rand()-.5)*spread;pos[i*3+1]=(rand()-.5)*12;pos[i*3+2]=depth[0]+rand()*(depth[1]-depth[0]);rnd[i*2]=rand();rnd[i*2+1]=rand()}
    const g=keep(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aRnd',new THREE.BufferAttribute(rnd,2));
    const half=(spread/2).toFixed(1),full=spread.toFixed(1);
    const pts=new THREE.Points(g,keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`uniform float uTime,uWarp,uFreeze;attribute vec2 aRnd;varying float vA;void main(){vec3 p=position;float sp=.3+aRnd.x*.5;p.y=mod(p.y-uTime*sp*(1.+uWarp*2.)+6.,12.)-6.;
        p.x+=sin(uTime*(.3+aRnd.y*.5)+aRnd.x*6.28)*(.3+aRnd.y*.45)+uTime*.08;
        float xs=mod(p.x+${half},${full})/${full},ph=fract(uTime/9.),passed=smoothstep(.2,-.1,xs-(-.4+ph*1.9));
        p.x+=(floor(uTime/9.)+passed)*2.4;p.x=mod(p.x+${half},${full})-${half};
        vec4 mv=modelViewMatrix*vec4(p,1.);vA=smoothstep(6.,4.5,abs(p.y))*(.4+aRnd.y*.6)*uFreeze;gl_PointSize=(${sizeMin.toFixed(1)}+aRnd.y*${(sizeMax-sizeMin).toFixed(1)})*(12./-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`precision highp float;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,${blur.toFixed(2)},d)*vA*.9;gl_FragColor=vec4(vec3(.88,.95,1.)*a,a);}`})));
    pts.frustumCulled=false;world.add(pts);
  };
  snow(touch?600:1400,22,[-9,0],1.3,3.,.0,9177);
  snow(touch?14:30,16,[5,8.5],5,10,.38,7319);

  const layout=w=>{const m=w<720;flake.userData.x=m?.6:3.2;flake.userData.y=m?1.7:.05;flake.userData.base=m?.36:.86;U.uOrigin.value.set(m?.6:.78,m?.8:.5)};   // a frente de gelo nasce no floco
  let tick=0,bgDirty=true,px=0,py=0,sx=0,sy=0,frameStop=false,last=0,progress=0,resizeTimer=0,birth=arrived?1:0,hover=0,hoverT=0;
  const IDLE=.62;let ry=0,vy=IDLE,rx=0,vx=0,drag=null,headW=1000;   // giro 360 contínuo (rad/s) + arrasto com inércia
  const pointer=e=>{if(e.pointerType!=='mouse')return;px=cap(e.clientX/Math.max(1,headW)-.5,-.5,.5);py=cap((e.clientY+scrollY-headTop)/Math.max(1,headH)-.5,-.5,.5);hoverT=1};   // sem leitura de layout
  const resetPointer=()=>{px=0;py=0;hoverT=0};
  // arrastar (mouse ou dedo) gira o floco de verdade: 70% da largura = uma volta; ao soltar, a inércia volta ao giro livre
  const down=e=>{if(e.target.closest('a,button')||(e.pointerType==='mouse'&&e.button!==0))return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now()};if(e.pointerType==='mouse'){vy=0;vx=0}   // o mouse “pega” o floco; o dedo só gira ao arrastar
    heading.classList.add('is-grabbing');
    if(e.pointerType==='mouse')try{heading.setPointerCapture(e.pointerId)}catch(err){}
    U.uPulse.value=Math.max(U.uPulse.value,.35)};
  const move=e=>{pointer(e);if(!drag||e.pointerId!==drag.id)return;const now=performance.now(),dt=Math.max(8,now-drag.t)/1000,k=Math.PI*2/Math.max(300,headW*.7);
    const dx=(e.clientX-drag.x)*k,dy=(e.pointerType==='mouse'?(e.clientY-drag.y)*k*.7:0);ry+=dx;rx=cap(rx+dy,-1.1,1.1);
    vy=vy*.4+dx/dt*.6;vx=vx*.4+dy/dt*.6;drag.x=e.clientX;drag.y=e.clientY;drag.t=now};
  const up=e=>{if(!drag||(e&&e.pointerId!==drag.id))return;if(performance.now()-drag.t>90){vy=0;vx=0}vy=cap(vy,-14,14);drag=null;heading.classList.remove('is-grabbing')};
  heading.addEventListener('pointermove',move,{passive:true});heading.addEventListener('pointerleave',resetPointer,{passive:true});heading.addEventListener('pointerdown',down,{passive:true});
  heading.addEventListener('pointerup',up,{passive:true});heading.addEventListener('pointercancel',up,{passive:true});
  const size=()=>{const rect=mount.getBoundingClientRect(),w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));renderer.setSize(w,h,false);bgDirty=true;const pr=renderer.getPixelRatio();const bs=.5;rt.setSize(Math.max(2,Math.ceil(w*pr*bs)),Math.max(2,Math.ceil(h*pr*bs)));camera.aspect=w/h;camera.updateProjectionMatrix();U.uRes.value.set(w,h);layout(w)};
  size();
  const resize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(size,130)};window.addEventListener('resize',resize,{passive:true});
  const contextLost=e=>{e.preventDefault();frameStop=true;stage.classList.add('cinema-css-fallback')};canvas.addEventListener('webglcontextlost',contextLost,false);
  let lastFront=9,slow=0,minGap=15,ratio=renderer.getPixelRatio(),headTop=0,headH=1;const measure=()=>{const r=heading.getBoundingClientRect();headTop=r.top+scrollY;headH=r.height;headW=r.width};measure();
  window.addEventListener('resize',measure,{passive:true});
  const frame=(dt,t)=>{
    if(frameStop||!canRun())return false;
    if(t-last<minGap-3)return true;   // ~60 fps; aparelho fraco cai para ~30 antes de baixar resolução
    const gap=t-last;last=t;const step=Math.min(.05,gap/1000||dt);progress+=step;   // tempo real entre quadros desenhados: mesma velocidade em 60/90/120 Hz
    // aparelho fraco: se os quadros seguem lentos, baixa a resolução (até .6) em vez de travar
    if(gap<250){slow=gap>minGap+22?slow+1:Math.max(0,slow-1);if(slow>30){slow=0;if(minGap<31)minGap=31;else if(ratio>.6){ratio=Math.max(.6,ratio*.75);renderer.setPixelRatio(ratio);size()}}}
    U.uTime.value=progress;
    const front=-.4+((progress/WAVE)%1)*1.9,fxs=touch?.6:.76;   // frente fria (mesma conta do shader)
    if(lastFront<.04&&front>=.04)glowWave(1,touch?.16:.22);
    if(lastFront<fxs&&front>=fxs){if(!drag)vy+=2.2;U.uPulse.value=Math.max(U.uPulse.value,.6)}
    lastFront=front;U.uWarp.value*=Math.pow(.25,step);U.uPulse.value*=Math.pow(.5,step);
    U.uScroll.value=cap((scrollY+innerHeight/2-(headTop+headH/2))/Math.max(1,innerHeight),-1,1); // sem leitura de layout por quadro
    sx+=(px-sx)*.06;sy+=(py-sy)*.06;hover+=(hoverT-hover)*.06;U.uPointer.value.set(sx,sy);U.uHover.value=hover;
    camera.position.set(sx*.9,-sy*.6,11);camera.lookAt(0,0,0);
    if(!drag){const e=1-Math.pow(.4,step);vy+=(IDLE-vy)*e;vx*=Math.pow(.05,step);ry+=vy*step;rx+=vx*step;rx+=(0-rx)*(1-Math.pow(.12,step))}
    flakeMesh.rotation.set(rx+Math.sin(progress*.5)*.2-sy*.35,ry+sx*.35,Math.sin(progress*.31)*.07);
    flake.visible=birth>.002;flake.scale.setScalar((flake.userData.base||1)*Math.max(.001,birth)*(1+Math.sin(progress*2)*.015));
    flake.position.set(flake.userData.x||0,(flake.userData.y||0)+Math.sin(progress*.8)*.14,0);
    if(U.uFreeze.value>0&&(!touch||(++tick&1)||bgDirty)){bgDirty=false;renderer.setRenderTarget(rt);renderer.render(bgScene,bgCam);renderer.setRenderTarget(null)}   // no toque o céu (lento) vai a 30 fps; floco e neve a 60
    renderer.render(world,camera);return true;
  };
  let running=false,generation=0;
  const resume=()=>{
    if(frameStop||running||!canRun())return;running=true;measure();const token=++generation;
    if(motion?.Ticker?.add)motion.Ticker.add((dt,t)=>{if(!running||token!==generation)return false;const k=frame(dt,t);if(!k)running=false;return k});
    else{let old=0;const loop=t=>{if(!running||token!==generation||!canRun()){if(token===generation)running=false;return}frame(Math.min(.04,(t-old)/1000||.016),t);old=t;requestAnimationFrame(loop)};requestAnimationFrame(loop)}
  };
  const pause=()=>{running=false;generation++};
  const tint=s=>{U.uColor.value.setRGB(s.r/255,s.g/255,s.b/255);U.uEnergy.value=s.energy;U.uPulse.value=Math.max(s.pulse||0,U.uPulse.value)};
  const arriveFx=()=>{U.uWarp.value=1.2;vy=7;if(gsap){const o={b:.05};gsap.to(o,{b:1,duration:1.6,ease:'elastic.out(1,.6)',onUpdate:()=>{birth=o.b}})}};
  const kick=v=>{U.uWarp.value=Math.max(U.uWarp.value,v*.5);if(!drag)vy+=1};
  const destroy=()=>{pause();clearTimeout(resizeTimer);window.removeEventListener('resize',resize);window.removeEventListener('resize',measure);heading.removeEventListener('pointermove',move);heading.removeEventListener('pointerleave',resetPointer);heading.removeEventListener('pointerdown',down);heading.removeEventListener('pointerup',up);heading.removeEventListener('pointercancel',up);canvas.removeEventListener('webglcontextlost',contextLost);disposables.forEach(d=>d.dispose?.());renderer.dispose();canvas.remove()};
  // congelar: a frente de gelo varre do floco para fora; setFrozen posiciona sem animação (fora da tela)
  const freeze=()=>{U.uPulse.value=1;if(!gsap){U.uFreeze.value=1;return}gsap.killTweensOf(U.uFreeze);gsap.to(U.uFreeze,{value:1,duration:1.9,ease:'sine.inOut'})};
  const setFrozen=v=>{if(gsap)gsap.killTweensOf(U.uFreeze);U.uFreeze.value=v?1:0;birth=v?1:0;bgDirty=true};
  tint(state);
  // shaders compilados fora do caminho da rolagem (paralelo quando o navegador suporta); o céu compila para o buffer onde é desenhado
  try{if(renderer.compileAsync){renderer.setRenderTarget(rt);const pb=renderer.compileAsync(bgScene,bgCam);renderer.setRenderTarget(null);await pb;await idle();await renderer.compileAsync(world,camera)}}catch(err){}
  // um quadro de aquecimento (fora da tela, em tempo ocioso): se o navegador não compila em paralelo, a espera de link acontece aqui, e não no congelamento
  try{await idle();if(destroyed){destroy();return null}const f0=U.uFreeze.value;U.uFreeze.value=1;renderer.setRenderTarget(rt);renderer.render(bgScene,bgCam);renderer.setRenderTarget(null);
    await idle();if(destroyed){destroy();return null}renderer.render(world,camera);U.uFreeze.value=f0;bgDirty=true}catch(err){}
  if(destroyed){destroy();return null}
  return{resume,pause,tint,destroy,arrive:arriveFx,kick,freeze,setFrozen};
}
async function ensure3d(){
  if(scene3d||loading3d||webglFailed||lite()||reduce.matches||destroyed)return;
  loading3d=true;
  try{
    const THREE=await loadThree();if(destroyed)return;
    scene3d=await makeWebGL(THREE);
    if(!scene3d){webglFailed=true;stage.classList.add('cinema-css-fallback');setWarm(false)}
    else{stage.classList.add('has-webgl');cycle?.kill();cycle=null;scene3d.setFrozen(arrived||!warm);if(active)scene3d.resume();if(arrived)scene3d.arrive()}
  }catch(err){webglFailed=true;stage.classList.add('cinema-css-fallback');setWarm(false)}
  finally{loading3d=false}
}
async function init(){
  if(initialized||destroyed||reduce.matches)return;
  initialized=true;stage.classList.add('is-enhancing');splitTitle();
  try{
    gsap=await loadGSAP();if(destroyed||reduce.matches)return;
    if(chars.length&&!arrived&&!warm)gsap.set(chars,{yPercent:118,rotationX:-88,opacity:0});
    activate();bindTilt();
    if(arrivalReady&&!arrived)arrive();
  }catch(err){stage.classList.add('cinema-css-fallback');setWarm(false);activate()}
}
// visível (pré-carrega) × chegou de fato (título em tela): a troca de cor dispara na chegada
let arrivalReady=false;
const io=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{entries.forEach(entry=>{visible=entry.isIntersecting;if(visible){if(!initialized)init();else activate()}else deactivate()})},{threshold:0,rootMargin:'240px 0px'}):null;
const arrivalIO=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{entries.forEach(entry=>{
  if(entry.isIntersecting){arrivalReady=true;if(gsap&&!arrived)arrive()}
  else if(entry.boundingClientRect.top>0&&arrived&&gsap){arrived=false;cycle?.pause();   // saiu por baixo: a chegada se repete ao voltar
    if(canWarm()&&scene3d){setWarm(true);scene3d.setFrozen(false);gsap.set(glows,{opacity:0})}else if(chars.length)gsap.set(chars,{yPercent:118,rotationX:-88,opacity:0})}
})},{threshold:.35}):null;
// pré-carga 1–2 telas antes: GSAP, Three, geometria e shaders ficam prontos em momentos ociosos; a seção já chega no papel
const preIO=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;preIO.disconnect();
  const r=heading.getBoundingClientRect();if(canWarm()&&!arrived&&r.top>innerHeight*.6)setWarm(true);   // se já estiver em tela, não pisca
  idle().then(()=>{if(destroyed||reduce.matches)return;loadGSAP().catch(()=>{});ensure3d()})},{rootMargin:'1600px 0px'}):null;
if(io){preIO?.observe(heading);io.observe(heading);arrivalIO?.observe(title||heading)}else{visible=true;arrivalReady=true;init()}
const mediaChange=()=>{if(reduce.matches)setStatic();else if(visible){if(!gsap){initialized=false;init()}else{makeCycle();activate()}}};
reduce.addEventListener?.('change',mediaChange);
const visibilityChange=()=>{if(document.hidden)deactivate();else if(visible)activate()};
document.addEventListener('visibilitychange',visibilityChange);
const cleanup=()=>{if(destroyed)return;destroyed=true;deactivate();io?.disconnect();arrivalIO?.disconnect();preIO?.disconnect();titleMO?.disconnect();coldIO?.disconnect();reduce.removeEventListener?.('change',mediaChange);document.removeEventListener('visibilitychange',visibilityChange);cycle?.kill();tilt?.off();scene3d?.destroy()};
window.addEventListener('pagehide',cleanup,{once:true});
window.GBShowroomCinema={get active(){return active},get enabled(){return !reduce.matches},get hasWebGL(){return !!scene3d},get arrived(){return arrived},get color(){return heading.dataset.spectrum||'GELO'},pause:deactivate,resume:activate};
})();
