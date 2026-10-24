/* GB IMPORTS / DARK SPECTRUM V3 · GELO — GSAP + THREE (lazy, section-scoped).
 * Tema frio da coleção Tech Fleece: floco de neve 3D com bordas acesas em azul, neve real, névoa glacial e geada.
 * Chegada: o título entra letra a letra e troca de cor na hora; cada nova cor corre como onda pelas letras.
 * Fundo: nebulosa líquida em shader, escultura cromática que respira, túnel de partículas e anéis orbitais,
 * tudo tingido pela cor do capítulo, reagindo ao ponteiro e à rolagem. Só roda visível, com teto de fps;
 * aparelho modesto/reduzido fica no fallback CSS. Nenhuma imagem ou estado do catálogo é alterado.
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
const palette=[
 {name:'GELO',rgb:[74,168,255],bg:[4,10,24],hold:3.1},
 {name:'GLACIAL',rgb:[150,214,255],bg:[6,14,30],hold:3.0},
 {name:'ÁRTICO',rgb:[46,124,255],bg:[3,8,22],hold:3.2},
 {name:'CRISTAL',rgb:[196,234,255],bg:[7,16,32],hold:2.9}
];
const state={r:74,g:168,b:255,br:4,bg:10,bb:24,energy:.42,pulse:0};
let active=false,initialized=false,destroyed=false,gsap=null,cycle=null,scene3d=null,visible=false,arrived=false,chapter=0;
let loading3d=false,webglFailed=false;
const status=heading.querySelector('[data-spectrum-number]');
const title=heading.querySelector('h2');
const cap=(n,min,max)=>Math.max(min,Math.min(max,n));
const rgb=(r,g,b)=>'rgb('+[r,g,b].map(x=>Math.round(cap(x,0,255))).join(',')+')';
const apply=()=>{
  const c=[state.r,state.g,state.b].map(x=>Math.round(cap(x,0,255)));
  heading.style.setProperty('--cinema-accent',rgb(...c));
  heading.style.setProperty('--cinema-rgb',c.join(','));
  heading.style.setProperty('--cinema-bg',rgb(state.br,state.bg,state.bb));
  heading.style.setProperty('--cinema-energy',String(state.energy));
  scene3d?.tint(state);
};
apply();

/* ---------- título em letras (leitores de tela leem o h2 inteiro pelo aria-label) ---------- */
let chars=[];
function splitTitle(){
  if(!title||title.dataset.split)return;
  title.dataset.split='1';title.setAttribute('aria-label',title.innerHTML.replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim());
  let i=0;
  const walk=node=>{[...node.childNodes].forEach(n=>{
    if(n.nodeType===3){const f=document.createDocumentFragment();[...n.textContent].forEach(ch=>{if(ch.trim()===''){f.append(ch);return}const s=document.createElement('span');s.className='sc-ch';s.setAttribute('aria-hidden','true');s.style.setProperty('--i',i++);s.textContent=ch;f.append(s)});n.replaceWith(f)}
    else if(n.nodeType===1&&n.tagName!=='BR')walk(n);
  })};
  walk(title);chars=[...title.querySelectorAll('.sc-ch')];
  heading.style.setProperty('--sc-count',chars.length);
}
// cor das letras muda por capítulo (CSS transiciona com atraso por letra = onda); o resto acompanha quadro a quadro
const setTarget=p=>{heading.style.setProperty('--sc-target',p.rgb.join(','));heading.dataset.spectrum=p.name;if(status)status.textContent=String(palette.indexOf(p)+1).padStart(2,'0')+' / 04'};

function canRun(){return !destroyed&&visible&&!document.hidden&&!reduce.matches}
function activate(){
  if(!initialized||!canRun()||active)return;
  active=true;cycle?.resume();scene3d?.resume();ensure3d();stage.classList.add('is-running');
}
function deactivate(){
  if(!active)return;active=false;cycle?.pause();scene3d?.pause();stage.classList.remove('is-running');
}
function setStatic(){
  deactivate();cycle?.kill();cycle=null;
  Object.assign(state,{r:74,g:168,b:255,br:4,bg:10,bb:24,energy:.42,pulse:0});
  setTarget(palette[0]);if(status)status.textContent='01 / 04';
  if(gsap&&chars.length)gsap.set(chars,{clearProps:'transform,opacity'});
  apply();
}
// um capítulo de cor: mergulho curto, virada de cor com pulso, letras dão um tranco e assentam
function chapterTo(t,p,at){
  const c=gsap.timeline();
  c.add(()=>{setTarget(p);scene3d?.kick(.85)},0);
  c.to(state,{energy:.16,duration:.18,ease:'power2.in',onUpdate:apply},0);
  c.to(state,{r:p.rgb[0],g:p.rgb[1],b:p.rgb[2],br:p.bg[0],bg:p.bg[1],bb:p.bg[2],energy:.95,pulse:1,duration:.9,ease:'expo.out',onUpdate:apply},.18);
  if(chars.length)c.to(chars,{keyframes:[{yPercent:-7,skewX:-6,duration:.16,ease:'power2.out'},{yPercent:0,skewX:0,duration:.6,ease:'elastic.out(1,.45)'}],stagger:{each:.018,from:'start'}},.14);
  c.to(state,{energy:.48,pulse:0,duration:1.6,ease:'sine.out',onUpdate:apply},1.08);
  t.add(c,at);
}
function makeCycle(){
  if(!gsap||reduce.matches||destroyed)return;
  cycle?.kill();
  const t=gsap.timeline({paused:true,repeat:-1});
  palette.forEach((p,i)=>{const n=palette[(chapter+1+i)%palette.length];chapterTo(t,n,'>'+(i?palette[(chapter+i)%palette.length].hold:0).toFixed(2))});
  t.to({},{duration:palette[chapter].hold});
  cycle=t;
}
// chegada: letras sobem em 3D, a primeira troca de cor acontece quase de imediato, a cena explode em luz
function arrive(){
  if(!gsap||reduce.matches||destroyed)return;
  arrived=true;cycle?.kill();cycle=null;
  const t=gsap.timeline({onComplete:()=>{chapter=(chapter+1)%palette.length;makeCycle();if(active)cycle?.play()}});
  if(chars.length){
    gsap.set(title,{perspective:900});
    t.fromTo(chars,{yPercent:118,rotationX:-88,opacity:0,transformOrigin:'50% 100% -40px'},{yPercent:0,rotationX:0,opacity:1,duration:1.05,ease:'expo.out',stagger:{each:.032,from:'start'}},0);
  }
  t.add(()=>{scene3d?.arrive()},0);
  const next=palette[(chapter+1)%palette.length];
  t.add(()=>{setTarget(next)},.38);
  t.to(state,{r:next.rgb[0],g:next.rgb[1],b:next.rgb[2],br:next.bg[0],bg:next.bg[1],bb:next.bg[2],energy:1,pulse:1,duration:1.1,ease:'expo.out',onUpdate:apply},.38);
  t.to(state,{energy:.5,pulse:0,duration:1.8,ease:'sine.out',onUpdate:apply});
}

function loadGSAP(){
  if(window.gsap)return Promise.resolve(window.gsap);
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.async=true;
    script.src='https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';script.crossOrigin='anonymous';
    script.onload=()=>window.gsap?resolve(window.gsap):reject(new Error('GSAP did not initialize'));
    script.onerror=()=>reject(new Error('GSAP blocked'));
    document.head.appendChild(script);
  });
}

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

function makeWebGL(THREE){
  if(!canRun()||lite()||destroyed)return null;
  const mount=stage.querySelector('.showroom-cinema-webgl');if(!mount)return null;
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.setAttribute('role','presentation');mount.appendChild(canvas);
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse.matches,alpha:true,powerPreference:'high-performance',premultipliedAlpha:false})}catch(err){canvas.remove();return null}
  const touch=coarse.matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,touch?1:1.25));
  renderer.setClearColor(0x000000,0);
  const world=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(38,1,.1,80);camera.position.set(0,0,11);
  const U={uTime:{value:0},uColor:{value:new THREE.Color(.29,.66,1)},uBg:{value:new THREE.Color(.016,.04,.094)},uEnergy:{value:.42},uPulse:{value:0},uPointer:{value:new THREE.Vector2(0,0)},uRes:{value:new THREE.Vector2(1,1)},uScroll:{value:0},uWarp:{value:0},uHover:{value:0}};
  const disposables=[];const keep=x=>{disposables.push(x);return x};

  // 1. Fundo glacial: névoa fria em movimento lento, luz caindo do alto, geada cristalizando nas bordas,
  //    vinheta de cinema e grão; o pé do quadro funde com a cor da seção Tech Fleece logo abaixo.
  const octaves=touch?4:5;
  const fog=new THREE.Mesh(keep(new THREE.PlaneGeometry(2,2)),keep(new THREE.ShaderMaterial({uniforms:U,depthWrite:false,depthTest:false,transparent:false,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`precision highp float;varying vec2 vUv;uniform float uTime,uEnergy,uPulse,uScroll,uWarp;uniform vec3 uColor,uBg;uniform vec2 uPointer,uRes;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<${octaves};i++){v+=a*n2(p);p=r*p*2.03;a*=.5;}return v;}
    // geada: células de Voronoi finas (cristais) que crescem a partir das bordas
    float frost(vec2 p){vec2 i=floor(p),f=fract(p);float m1=8.,m2=8.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y);vec2 o=vec2(h(i+g),h(i+g+19.1));float d=length(g+o-f);if(d<m1){m2=m1;m1=d;}else if(d<m2)m2=d;}return m2-m1;}
    void main(){vec2 uv=vUv;float asp=uRes.x/uRes.y;vec2 p=(uv-.5)*vec2(asp,1.)*2.2;float t=uTime;
      vec2 q=vec2(fbm(p*.9+vec2(t*.025,0.)),fbm(p*.9+vec2(3.1,-t*.02)));
      float f=fbm(p*1.1+2.2*q+vec2(-t*.04,t*.015)+uPointer*.3);
      vec3 col=uBg;
      col=mix(col,uColor*.42,smoothstep(.35,.9,f)*.9);
      col+=vec3(.7,.88,1.)*pow(smoothstep(.55,1.,f),3.)*.22;
      // feixes de luz fria vindo do alto
      float rays=0.;for(int k=0;k<3;k++){float fk=float(k);rays+=exp(-abs((uv.x-.58-fk*.13+sin(t*.07+fk)*.04)+(1.-uv.y)*(.22+fk*.05))*(26.-fk*5.));}
      col+=uColor*rays*(.10+uEnergy*.08)*smoothstep(.0,.9,uv.y);
      // halo central atrás do floco (segue o ponteiro de leve)
      vec2 c=vec2(.69+uPointer.x*.03,.47-uPointer.y*.03);if(asp<1.)c=vec2(.66,.78);
      float d=length((uv-c)*vec2(asp,1.));col+=uColor*(.065/(d*4.5+.12))*(.55+uPulse*1.1+uWarp*.6);
      // geada nas bordas: cristais brilhantes onde a moldura esfria
      float bd=min(min(uv.x,1.-uv.x)*asp,min(uv.y,1.-uv.y)*1.4);float edge=(1.-smoothstep(.0,.16,bd+(fbm(uv*9.)-.5)*.08))*smoothstep(.0,.25,uv.y);
      float fr=frost(uv*vec2(asp,1.)*22.);float fr2=frost(uv*vec2(asp,1.)*61.+3.);
      float cryst=(smoothstep(.06,.0,fr)*.8+smoothstep(.05,.0,fr2)*.5)*edge;
      col+=vec3(.75,.9,1.)*cryst*(.12+uPulse*.12);col=mix(col,vec3(.62,.8,.96)*.3,edge*.24);
      // legibilidade do título e vinheta; pé funde com a seção de baixo (#08090a)
      col*=mix(.55,1.,smoothstep(.0,.8,uv.x*.95+(1.-uv.y)*.2));
      col*=1.-.5*pow(length((uv-.5)*vec2(1.05,1.3)),2.3);
      col=mix(vec3(.031,.035,.039),col,smoothstep(.0,.16,uv.y));
      col+=(h(uv*uRes+t*61.)-.5)*.04;
      gl_FragColor=vec4(col,1.);}`})));
  fog.frustumCulled=false;fog.renderOrder=-10;world.add(fog);

  // 2. Floco de neve 3D: seis braços com ramos, extrudado com chanfro. Face escura, bordas acesas em azul
  //    (como neon contra o gelo), núcleo que pulsa. Flutua, gira devagar e inclina para o ponteiro.
  const flake=new THREE.Group();world.add(flake);
  const shapes=[];
  const bar=(x1,y1,x2,y2,w)=>{const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy),nx=-dy/l*w/2,ny=dx/l*w/2;const s=new THREE.Shape();s.moveTo(x1+nx,y1+ny);s.lineTo(x2+nx,y2+ny);s.lineTo(x2-nx,y2-ny);s.lineTo(x1-nx,y1-ny);s.closePath();return s};
  for(let k=0;k<6;k++){
    const a=k*Math.PI/3,ca=Math.cos(a),sa=Math.sin(a),R=(x,y)=>[x*ca-y*sa,x*sa+y*ca];
    const arm=[[0,0,2.15,0,.34],[.95,0,1.55,.62,.24],[.95,0,1.55,-.62,.24],[1.5,0,1.98,.4,.2],[1.5,0,1.98,-.4,.2]];
    arm.forEach(([x1,y1,x2,y2,w])=>{const[a1,b1]=R(x1,y1),[a2,b2]=R(x2,y2);shapes.push(bar(a1,b1,a2,b2,w))});
    // ponta chanfrada do braço
    const tip=new THREE.Shape();const t0=R(2.15,.17),t1=R(2.42,0),t2=R(2.15,-.17);tip.moveTo(t0[0],t0[1]);tip.lineTo(t1[0],t1[1]);tip.lineTo(t2[0],t2[1]);tip.closePath();shapes.push(tip);
  }
  const hub=new THREE.Shape();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;hub[k?'lineTo':'moveTo'](Math.cos(a)*.52,Math.sin(a)*.52)}hub.closePath();shapes.push(hub);
  const fg=keep(new THREE.ExtrudeGeometry(shapes,{depth:.34,bevelEnabled:true,bevelThickness:.07,bevelSize:.045,bevelSegments:touch?2:4,curveSegments:2}));fg.center();
  const flakeMat=keep(new THREE.ShaderMaterial({uniforms:U,
    vertexShader:`varying vec3 vN;varying vec3 vP;varying vec3 vL;void main(){vN=normalize(normalMatrix*normal);vL=position;vec4 mv=modelViewMatrix*vec4(position,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uTime,uEnergy,uPulse,uHover;varying vec3 vN;varying vec3 vP;varying vec3 vL;
    void main(){vec3 n=normalize(vN);vec3 v=normalize(-vP);float side=1.-abs(n.z);float fres=pow(1.-max(dot(n,v),0.),2.2);
      float r=length(vL.xy);float core=exp(-r*2.2)*(.6+.4*sin(uTime*2.2));
      vec3 face=mix(vec3(.02,.03,.08),vec3(.04,.07,.17),.5+.5*n.y);
      vec3 glow=mix(vec3(.12,.42,1.),uColor,.35)*(1.5+uPulse*1.2+uHover*.6)+vec3(.05,.12,.25)*sin(uTime*2.2);
      float edgeL=smoothstep(.08,.8,side);vec3 col=face+glow*edgeL*2.2+glow*smoothstep(.55,1.,fres)*edgeL*.9+uColor*core*(.22+uPulse*.6);
      // reflexo de gelo correndo pela face
      float sweep=smoothstep(.06,.0,abs(fract((vL.x+vL.y)*.18-uTime*.12)-.5)-.36);col+=vec3(.5,.7,1.)*sweep*.07*(1.-side);
      gl_FragColor=vec4(col,1.);}`}));
  const flakeMesh=new THREE.Mesh(fg,flakeMat);flake.add(flakeMesh);
  // casca de brilho (bloom barato): a mesma forma, um pouco maior, só a silhueta acesa em azul, aditiva
  const shell=new THREE.Mesh(fg,keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,
    vertexShader:`varying vec3 vN;varying vec3 vP;void main(){vec3 p=position+normal*.09;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(p,1.);vP=mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uTime,uPulse;varying vec3 vN;varying vec3 vP;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(-vP))),1.6);float a=f*(.55+.25*sin(uTime*2.2)+uPulse*.6);gl_FragColor=vec4(mix(vec3(.1,.4,1.),uColor,.4)*a,a);}`})));
  flakeMesh.add(shell);
  // halo atrás do floco (aditivo) que pulsa no ritmo do núcleo
  const halo=new THREE.Mesh(keep(new THREE.PlaneGeometry(9,9)),keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uTime,uPulse,uEnergy;varying vec2 vUv;void main(){float d=length(vUv-.5);float a=exp(-d*7.)*(.42+.18*sin(uTime*2.2)+uPulse*.5+uEnergy*.15);gl_FragColor=vec4(uColor*a,a);}`})));
  halo.position.z=-1.2;flake.add(halo);

  // 3. Neve real: três camadas de profundidade. Queda, deriva com o vento e rotação no vertex shader
  //    (zero CPU por quadro); flocos de primeiro plano maiores e desfocados como bokeh de lente.
  const snow=(count,spread,depth,sizeMin,sizeMax,blur,seed0)=>{
    const pos=new Float32Array(count*3),rnd=new Float32Array(count*2);let seed=seed0;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
    for(let i=0;i<count;i++){pos[i*3]=(rand()-.5)*spread;pos[i*3+1]=(rand()-.5)*12;pos[i*3+2]=depth[0]+rand()*(depth[1]-depth[0]);rnd[i*2]=rand();rnd[i*2+1]=rand()}
    const g=keep(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aRnd',new THREE.BufferAttribute(rnd,2));
    const m=keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`uniform float uTime,uWarp;attribute vec2 aRnd;varying float vA;varying float vR;
      void main(){vec3 p=position;float sp=.35+aRnd.x*.55;p.y=mod(p.y-uTime*sp*(1.+uWarp*2.5)+6.,12.)-6.;
        p.x+=sin(uTime*(.3+aRnd.y*.5)+aRnd.x*6.28)*(.35+aRnd.y*.5)+uTime*.06;p.x=mod(p.x+${(spread/2).toFixed(1)},${spread.toFixed(1)})-${(spread/2).toFixed(1)};
        vec4 mv=modelViewMatrix*vec4(p,1.);vA=smoothstep(6.,4.5,abs(p.y))*(.45+aRnd.y*.55);vR=aRnd.x;
        gl_PointSize=(${sizeMin.toFixed(1)}+aRnd.y*${(sizeMax-sizeMin).toFixed(1)})*(12./-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`precision highp float;uniform vec3 uColor;varying float vA;varying float vR;
      void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,${blur.toFixed(2)},d)*vA;
        vec3 col=mix(vec3(.86,.94,1.),uColor,.25+vR*.2);gl_FragColor=vec4(col*a,a);}`}));
    const pts=new THREE.Points(g,m);pts.frustumCulled=false;world.add(pts);return pts;
  };
  snow(touch?700:1800,22,[-9,-1],1.4,3.2,.0,9177);       // fundo: neve fina, longe
  snow(touch?220:560,18,[-1,4],2.6,5.5,.05,4401);        // meio: flocos nítidos
  snow(touch?18:40,16,[5,8.5],5,11,.38,7319);           // frente: bokeh desfocado passando na lente

  // 4. Cristais em órbita: micropartículas que cintilam em volta do floco (brilho aceso e apagado)
  const gn=touch?90:220,gp=new Float32Array(gn*3),gr=new Float32Array(gn);let gs=331;const grand=()=>{gs=(1664525*gs+1013904223)>>>0;return gs/4294967296};
  for(let i=0;i<gn;i++){const a=grand()*Math.PI*2,rr=2.4+grand()*1.8,z=(grand()-.5)*1.6;gp[i*3]=Math.cos(a)*rr;gp[i*3+1]=Math.sin(a)*rr;gp[i*3+2]=z;gr[i]=grand()}
  const ggeo=keep(new THREE.BufferGeometry());ggeo.setAttribute('position',new THREE.BufferAttribute(gp,3));ggeo.setAttribute('aR',new THREE.BufferAttribute(gr,1));
  const glints=new THREE.Points(ggeo,keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`uniform float uTime,uPulse,uWarp;attribute float aR;varying float vA;void main(){vec3 p=position;float a=uTime*(.08+aR*.12)+aR*6.28;float c=cos(a),s=sin(a);p.xy=mat2(c,-s,s,c)*p.xy*(1.+uWarp*.35+uPulse*.15);
      vec4 mv=modelViewMatrix*vec4(p,1.);vA=pow(.5+.5*sin(uTime*(2.+aR*5.)+aR*40.),6.);gl_PointSize=(2.+aR*4.)*(1.+vA*1.6)*(12./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float star=max(smoothstep(.06,.0,abs(c.x))*smoothstep(.5,.0,abs(c.y)),smoothstep(.06,.0,abs(c.y))*smoothstep(.5,.0,abs(c.x)));
      float a=(smoothstep(.5,.0,d)*.6+star)*(.15+vA);gl_FragColor=vec4(mix(uColor,vec3(1.),.6)*a,a);}`})));
  glints.frustumCulled=false;flake.add(glints);

  const layout=w=>{const m=w<720;flake.position.set(m?.35:3.35,m?1.75:-.15,m?-1:0);flake.userData.base=m?.34:.8};
  let px=0,py=0,sx=0,sy=0,frameStop=false,last=0,progress=0,resizeTimer=0,birth=1,spin=0,spinV=0,hover=0,hoverT=0;
  const pointer=e=>{if(touch)return;const r=heading.getBoundingClientRect();px=cap((e.clientX-r.left)/Math.max(1,r.width)-.5,-.5,.5);py=cap((e.clientY-r.top)/Math.max(1,r.height)-.5,-.5,.5);hoverT=1};
  const resetPointer=()=>{px=0;py=0;hoverT=0};
  // microinteração: toque/clique no palco solta uma onda de gelo e dá um giro no floco
  const tap=e=>{if(e.target.closest('a,button'))return;spinV+=4.5;U.uWarp.value=Math.max(U.uWarp.value,1.1);U.uPulse.value=Math.max(U.uPulse.value,.8)};
  heading.addEventListener('pointermove',pointer,{passive:true});heading.addEventListener('pointerleave',resetPointer,{passive:true});heading.addEventListener('pointerdown',tap,{passive:true});
  const size=()=>{const rect=mount.getBoundingClientRect(),w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();U.uRes.value.set(w,h);layout(w)};
  size();
  const resize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(size,130)};window.addEventListener('resize',resize,{passive:true});
  const contextLost=e=>{e.preventDefault();frameStop=true;stage.classList.add('cinema-css-fallback')};canvas.addEventListener('webglcontextlost',contextLost,false);
  const frame=(dt,t)=>{
    if(frameStop||!canRun())return false;
    if(t-last<(touch?33:24))return true;
    last=t;const step=Math.min(.05,dt);progress+=step;
    U.uTime.value=progress;U.uWarp.value*=Math.pow(.25,step);
    const r=heading.getBoundingClientRect();U.uScroll.value=cap((innerHeight/2-(r.top+r.height/2))/Math.max(1,innerHeight),-1,1);
    sx+=(px-sx)*.05;sy+=(py-sy)*.05;hover+=(hoverT-hover)*.06;U.uPointer.value.set(sx,sy);U.uHover.value=hover;
    camera.position.set(sx*1.1,-sy*.7+U.uScroll.value*.5,11);camera.lookAt(0,0,0);
    // flutua (respiração), gira devagar no próprio eixo, inclina para o ponteiro; giro extra amortecido
    spinV*=Math.pow(.15,step);spin+=step*(.18+hover*.25+spinV);
    flakeMesh.rotation.set(Math.sin(progress*.5)*.22-sy*.7,Math.sin(spin)*.55+sx*.9,progress*.05);
    const pulse=1+Math.sin(progress*2.2)*.025+U.uPulse.value*.06;
    flake.scale.setScalar((flake.userData.base||1)*birth*pulse);
    flake.position.y=(innerWidth<720?1.75:-.15)+Math.sin(progress*.8)*.16;
    renderer.render(world,camera);return true;
  };
  let running=false,generation=0;
  const resume=()=>{
    if(frameStop||running||!canRun())return;running=true;const token=++generation;
    if(motion?.Ticker?.add)motion.Ticker.add((dt,t)=>{if(!running||token!==generation)return false;const k=frame(dt,t);if(!k)running=false;return k});
    else{let old=0;const loop=t=>{if(!running||token!==generation||!canRun()){if(token===generation)running=false;return}frame(Math.min(.04,(t-old)/1000||.016),t);old=t;requestAnimationFrame(loop)};requestAnimationFrame(loop)}
  };
  const pause=()=>{running=false;generation++};
  const tint=s=>{U.uColor.value.setRGB(s.r/255,s.g/255,s.b/255);U.uBg.value.setRGB(s.br/255,s.bg/255,s.bb/255);U.uEnergy.value=s.energy;U.uPulse.value=Math.max(s.pulse||0,U.uPulse.value*.9)};
  // chegada: o floco cristaliza do nada (escala elástica + giro) e a neve sopra
  const arriveFx=()=>{U.uWarp.value=1.3;spinV=6;if(gsap){const o={b:.05};gsap.to(o,{b:1,duration:1.7,ease:'elastic.out(1,.55)',onUpdate:()=>{birth=o.b}})}};
  const kick=v=>{U.uWarp.value=Math.max(U.uWarp.value,v*.6);spinV+=1.2};
  const destroy=()=>{pause();clearTimeout(resizeTimer);window.removeEventListener('resize',resize);heading.removeEventListener('pointermove',pointer);heading.removeEventListener('pointerleave',resetPointer);heading.removeEventListener('pointerdown',tap);canvas.removeEventListener('webglcontextlost',contextLost);disposables.forEach(d=>d.dispose?.());renderer.dispose();canvas.remove()};
  tint(state);
  return{resume,pause,tint,destroy,arrive:arriveFx,kick};
}
async function ensure3d(){
  if(scene3d||loading3d||webglFailed||lite()||!canRun())return;
  loading3d=true;
  try{
    const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js');
    if(!canRun())return;
    scene3d=makeWebGL(THREE);
    if(!scene3d){webglFailed=true;stage.classList.add('cinema-css-fallback')}
    else{stage.classList.add('has-webgl');if(active)scene3d.resume();if(arrived)scene3d.arrive()}
  }catch(err){webglFailed=true;stage.classList.add('cinema-css-fallback')}
  finally{loading3d=false}
}
async function init(){
  if(initialized||destroyed||reduce.matches)return;
  initialized=true;stage.classList.add('is-enhancing');splitTitle();
  try{
    gsap=await loadGSAP();if(destroyed||reduce.matches)return;
    if(chars.length&&!arrived)gsap.set(chars,{yPercent:118,rotationX:-88,opacity:0});
    activate();
    if(arrivalReady&&!arrived)arrive();
  }catch(err){stage.classList.add('cinema-css-fallback');activate()}
}
// visível (pré-carrega) × chegou de fato (título em tela): a troca de cor dispara na chegada
let arrivalReady=false;
const io=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{entries.forEach(entry=>{visible=entry.isIntersecting;if(visible){if(!initialized)init();else activate()}else deactivate()})},{threshold:0,rootMargin:'240px 0px'}):null;
const arrivalIO=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{entries.forEach(entry=>{
  if(entry.isIntersecting){arrivalReady=true;if(gsap&&!arrived)arrive()}
  else if(entry.boundingClientRect.top>0&&arrived&&gsap&&chars.length){arrived=false;cycle?.pause();gsap.set(chars,{yPercent:118,rotationX:-88,opacity:0})} // saiu por baixo: a chegada se repete ao voltar
})},{threshold:.35}):null;
if(io){io.observe(heading);arrivalIO?.observe(title||heading)}else{visible=true;arrivalReady=true;init()}
const mediaChange=()=>{if(reduce.matches)setStatic();else if(visible){if(!gsap){initialized=false;init()}else{makeCycle();activate()}}};
reduce.addEventListener?.('change',mediaChange);
const visibilityChange=()=>{if(document.hidden)deactivate();else if(visible)activate()};
document.addEventListener('visibilitychange',visibilityChange);
const cleanup=()=>{if(destroyed)return;destroyed=true;deactivate();io?.disconnect();arrivalIO?.disconnect();reduce.removeEventListener?.('change',mediaChange);document.removeEventListener('visibilitychange',visibilityChange);cycle?.kill();scene3d?.destroy()};
window.addEventListener('pagehide',cleanup,{once:true});
setTarget(palette[0]);if(status)status.textContent='01 / 04';
window.GBShowroomCinema={get active(){return active},get enabled(){return !reduce.matches},get hasWebGL(){return !!scene3d},get arrived(){return arrived},get color(){return heading.dataset.spectrum||'GELO'},pause:deactivate,resume:activate};
})();
