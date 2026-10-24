/* GB IMPORTS / DARK SPECTRUM V2 — GSAP + THREE (lazy, section-scoped).
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
 {name:'ÂMBAR',rgb:[255,214,53],bg:[13,14,19],hold:2.9},
 {name:'AZUL ELÉTRICO',rgb:[90,186,255],bg:[6,14,30],hold:3.2},
 {name:'CORAL',rgb:[255,103,107],bg:[26,9,16],hold:2.8},
 {name:'LIMA',rgb:[185,241,111],bg:[9,20,12],hold:3.3}
];
const state={r:255,g:214,b:53,br:13,bg:14,bb:19,energy:.42,pulse:0};
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
  Object.assign(state,{r:255,g:214,b:53,br:13,bg:14,bb:19,energy:.42,pulse:0});
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
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'high-performance',premultipliedAlpha:false})}catch(err){canvas.remove();return null}
  const touch=coarse.matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,touch?1:1.25));
  renderer.setClearColor(0x000000,0);
  const world=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(40,1,.1,80);camera.position.set(0,0,11);
  const U={uTime:{value:0},uColor:{value:new THREE.Color(1,.84,.2)},uBg:{value:new THREE.Color(.05,.055,.075)},uEnergy:{value:.42},uPulse:{value:0},uPointer:{value:new THREE.Vector2(0,0)},uRes:{value:new THREE.Vector2(1,1)},uScroll:{value:0},uWarp:{value:0}};
  const disposables=[];
  const keep=x=>{disposables.push(x);return x};

  // 1. Nebulosa líquida: domínio deformado (fbm sobre fbm), aberração cromática, raio de luz e grão de filme
  const octaves=touch?4:5;
  const neb=new THREE.Mesh(keep(new THREE.PlaneGeometry(2,2)),keep(new THREE.ShaderMaterial({uniforms:U,depthWrite:false,depthTest:false,transparent:true,
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`precision highp float;varying vec2 vUv;uniform float uTime,uEnergy,uPulse,uScroll;uniform vec3 uColor,uBg;uniform vec2 uPointer,uRes;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.,a=.5;mat2 r=mat2(.8,.6,-.6,.8);for(int i=0;i<${octaves};i++){v+=a*n2(p);p=r*p*2.03;a*=.5;}return v;}
    float field(vec2 p,float t){vec2 q=vec2(fbm(p+vec2(0.,t*.07)),fbm(p+vec2(5.2,1.3)-t*.05));vec2 r=vec2(fbm(p+3.6*q+vec2(1.7,9.2)+t*.11),fbm(p+3.6*q+vec2(8.3,2.8)-t*.09));return fbm(p+3.2*r+uPointer*.6);}
    void main(){vec2 uv=vUv;vec2 p=(uv-.5)*vec2(uRes.x/uRes.y,1.)*2.4;float t=uTime;
      p+=vec2(.0,uScroll*.6);
      float ab=.012+uPulse*.035;
      float fr=field(p+vec2(ab,0.),t),fg=field(p,t),fb=field(p-vec2(ab,0.),t);
      vec3 col=uBg;
      vec3 c2=vec3(uColor.b,uColor.r,uColor.g)*.85;
      col=mix(col,uColor*(.45+uEnergy*.9),smoothstep(.42,.95,vec3(fr,fg,fb)));
      col+=c2*pow(smoothstep(.55,1.,fg),3.)*.55*uEnergy;
      // raio de luz que atravessa a nebulosa, preso ao ponteiro
      vec2 lp=vec2(.62+uPointer.x*.25,.38-uPointer.y*.2);float d=length((uv-lp)*vec2(uRes.x/uRes.y,1.));
      col+=uColor*(.10/(d*6.+.15))*(.35+uEnergy*.6+uPulse*1.2);
      float beam=exp(-abs((uv.y-.5)-(uv.x-.5)*-.42+sin(t*.2)*.04)*38.);col+=uColor*beam*(.08+uPulse*.5);
      // leitura do título: escurece o canto esquerdo/alto, vinheta de cinema
      col*=mix(.42,1.,smoothstep(.0,.75,uv.x*.9+(1.-uv.y)*.25));
      col*=1.-.55*pow(length((uv-.5)*vec2(1.1,1.35)),2.2);
      col+=(h(uv*uRes+t*60.)-.5)*.045;
      gl_FragColor=vec4(col,1.);}`})));
  neb.frustumCulled=false;neb.renderOrder=-10;world.add(neb);

  // 2. Escultura cromática: icosfera deformada por ruído 3D, iridescente (fresnel + desvio de matiz), respira com a energia
  const sculpt=new THREE.Group();world.add(sculpt);
  const blobMat=keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,
    vertexShader:NOISE+`uniform float uTime,uEnergy,uPulse;varying vec3 vPos;varying vec3 vN;varying float vD;
    void main(){vec3 p=position;float n=snoise(p*.85+vec3(0.,uTime*.22,uTime*.13));float n2=snoise(p*2.3-uTime*.3)*.25;
      float d=(n+n2)*(.32+uEnergy*.38+uPulse*.55);p+=normal*d;vD=d;vN=normalize(normalMatrix*normal);
      vec4 mv=modelViewMatrix*vec4(p,1.);vPos=mv.xyz;gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uEnergy,uPulse,uTime;varying vec3 vPos;varying vec3 vN;varying float vD;
    vec3 hue(vec3 c,float a){const vec3 k=vec3(.57735);float ca=cos(a);return c*ca+cross(k,c)*sin(a)+k*dot(k,c)*(1.-ca);}
    void main(){vec3 n=normalize(cross(dFdx(vPos),dFdy(vPos)));vec3 v=normalize(-vPos);float fres=pow(1.-max(dot(n,v),0.),2.6);
      vec3 base=uColor*(.10+vD*.35);vec3 iri=hue(uColor,fres*2.4+vD*3.+uTime*.15);
      vec3 col=base+iri*fres*(.9+uPulse*.8)+vec3(1.)*pow(fres,6.)*.55;
      gl_FragColor=vec4(col,.92);}`}));
  const blob=new THREE.Mesh(keep(new THREE.IcosahedronGeometry(1.55,touch?28:56)),blobMat);sculpt.add(blob);
  // anéis orbitais finos atravessando a escultura
  const ringMats=[];
  for(let i=0;i<3;i++){const m=keep(new THREE.MeshBasicMaterial({color:U.uColor.value,transparent:true,opacity:.35-i*.08,depthWrite:false,blending:THREE.AdditiveBlending}));ringMats.push(m);
    const r=new THREE.Mesh(keep(new THREE.TorusGeometry(2.35+i*.55,.008+(i===0?.006:0),6,220)),m);r.rotation.set(1.1+i*.45,i*.7,.3*i);r.userData.spin=.08+i*.045;sculpt.add(r)}

  // 3. Túnel de partículas: posições fixas, o movimento todo no vertex shader (zero alocação por quadro)
  const count=touch?900:2600,pos=new Float32Array(count*3),spd=new Float32Array(count);
  let seed=17577;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<count;i++){const a=rand()*Math.PI*2,rr=1.2+Math.pow(rand(),.6)*9;pos[i*3]=Math.cos(a)*rr;pos[i*3+1]=Math.sin(a)*rr*.62;pos[i*3+2]=rand()*34;spd[i]=.6+rand()*1.6}
  const pg=keep(new THREE.BufferGeometry());pg.setAttribute('position',new THREE.BufferAttribute(pos,3));pg.setAttribute('aSpeed',new THREE.BufferAttribute(spd,1));
  const stars=new THREE.Points(pg,keep(new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`uniform float uTime,uWarp,uPulse;attribute float aSpeed;varying float vA;
    void main(){vec3 p=position;float z=mod(p.z+uTime*aSpeed*(1.2+uWarp*14.),34.)-28.;p.z=z;vec4 mv=modelViewMatrix*vec4(p,1.);
      vA=smoothstep(-28.,-18.,z)*(1.-smoothstep(4.,7.,z));gl_PointSize=(1.6+aSpeed*1.4+uWarp*5.)*(18./-mv.z);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`precision highp float;uniform vec3 uColor;uniform float uEnergy,uWarp;varying float vA;
    void main(){vec2 c=gl_PointCoord-.5;float d=length(c);float a=smoothstep(.5,.0,d)*vA*(.35+uEnergy*.5+uWarp);gl_FragColor=vec4(mix(uColor,vec3(1.),.35)*a,a);}`})));
  stars.frustumCulled=false;world.add(stars);

  // composição: escultura à direita do título no desktop, abaixo e menor no celular
  const layout=w=>{const m=w<720;sculpt.position.set(m?0:3.1,m?-1.9:-.2,m?-1.5:0);sculpt.scale.setScalar(m?.72:1)};
  let px=0,py=0,sx=0,sy=0,frameStop=false,last=0,progress=0,resizeTimer=0,base=1;
  const pointer=e=>{if(touch)return;const r=heading.getBoundingClientRect();px=cap((e.clientX-r.left)/Math.max(1,r.width)-.5,-.5,.5);py=cap((e.clientY-r.top)/Math.max(1,r.height)-.5,-.5,.5)};
  const resetPointer=()=>{px=0;py=0};
  heading.addEventListener('pointermove',pointer,{passive:true});heading.addEventListener('pointerleave',resetPointer,{passive:true});
  const size=()=>{const rect=mount.getBoundingClientRect(),w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();U.uRes.value.set(w,h);layout(w)};
  size();
  const resize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(size,130)};window.addEventListener('resize',resize,{passive:true});
  const contextLost=e=>{e.preventDefault();frameStop=true;stage.classList.add('cinema-css-fallback')};canvas.addEventListener('webglcontextlost',contextLost,false);
  const frame=(dt,t)=>{
    if(frameStop||!canRun())return false;
    if(t-last<(touch?33:24))return true; // teto ~30 fps toque / ~40 fps desktop
    last=t;const step=Math.min(.05,dt);progress+=step;
    U.uTime.value=progress;U.uWarp.value*=Math.pow(.18,step);
    const r=heading.getBoundingClientRect();U.uScroll.value=cap((innerHeight/2-(r.top+r.height/2))/Math.max(1,innerHeight),-1,1);
    sx+=(px-sx)*.05;sy+=(py-sy)*.05;U.uPointer.value.set(sx,sy);
    camera.position.set(sx*1.3,-sy*.8+U.uScroll.value*.6,11-U.uPulse.value*1.6);camera.lookAt(0,0,0);
    blob.rotation.set(progress*.11+sy*.6,progress*.17+sx*.9,0);
    sculpt.children.forEach(c=>{if(c.userData.spin)c.rotation.z+=c.userData.spin*step*(1+U.uPulse.value*4)});
    sculpt.scale.setScalar((innerWidth<720?.72:1)*base*(1+U.uEnergy.value*.06));
    renderer.render(world,camera);return true;
  };
  let running=false,generation=0;
  const resume=()=>{
    if(frameStop||running||!canRun())return;running=true;const token=++generation;
    if(motion?.Ticker?.add)motion.Ticker.add((dt,t)=>{if(!running||token!==generation)return false;const k=frame(dt,t);if(!k)running=false;return k});
    else{let old=0;const loop=t=>{if(!running||token!==generation||!canRun()){if(token===generation)running=false;return}frame(Math.min(.04,(t-old)/1000||.016),t);old=t;requestAnimationFrame(loop)};requestAnimationFrame(loop)}
  };
  const pause=()=>{running=false;generation++};
  const tint=s=>{U.uColor.value.setRGB(s.r/255,s.g/255,s.b/255);U.uBg.value.setRGB(s.br/255,s.bg/255,s.bb/255);U.uEnergy.value=s.energy;U.uPulse.value=s.pulse||0;ringMats.forEach((m,i)=>m.opacity=(.18+s.energy*.3)-i*.06)};
  // chegada: a escultura nasce do vazio e o túnel dispara
  const arriveFx=()=>{U.uWarp.value=1.4;if(gsap){const o={b:.15};gsap.to(o,{b:1,duration:1.6,ease:'elastic.out(1,.5)',onUpdate:()=>{base=o.b}})}};
  const kick=v=>{U.uWarp.value=Math.max(U.uWarp.value,v)};
  const destroy=()=>{pause();clearTimeout(resizeTimer);window.removeEventListener('resize',resize);heading.removeEventListener('pointermove',pointer);heading.removeEventListener('pointerleave',resetPointer);canvas.removeEventListener('webglcontextlost',contextLost);disposables.forEach(d=>d.dispose?.());renderer.dispose();canvas.remove()};
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
window.GBShowroomCinema={get active(){return active},get enabled(){return !reduce.matches},get hasWebGL(){return !!scene3d},get arrived(){return arrived},get color(){return heading.dataset.spectrum||'ÂMBAR'},pause:deactivate,resume:activate};
})();
