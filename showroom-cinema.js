/* GB IMPORTS / DARK SPECTRUM — GSAP + THREE (lazy, section-scoped).
 * Cinematic color chapters. A real WebGL scene is created only for visible, capable devices.
 * CSS is the offline/no-WebGL fallback. No product images or catalog state are modified.
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
 {name:'ÂMBAR',rgb:[255,214,53],bg:[13,14,19],pace:5.8},
 {name:'AZUL ELÉTRICO',rgb:[90,186,255],bg:[8,17,28],pace:6.7},
 {name:'CORAL',rgb:[255,103,107],bg:[25,11,17],pace:5.3},
 {name:'LIMA',rgb:[185,241,111],bg:[13,20,15],pace:7.1}
];
const state={r:255,g:214,b:53,br:13,bg:14,bb:19,energy:0.42};
let active=false,initialized=false,destroyed=false,gsap=null,cycle=null,scene3d=null,visible=false;
let loading3d=false,webglFailed=false;
let mediaChange=()=>{},visibilityChange=()=>{};
const status=heading.querySelector('[data-spectrum-number]');
const cap=(n,min,max)=>Math.max(min,Math.min(max,n));
const rgb=(r,g,b)=>'rgb('+[r,g,b].map(x=>Math.round(cap(x,0,255))).join(',')+')';
const apply=()=>{
  const accent=rgb(state.r,state.g,state.b);
  const background=rgb(state.br,state.bg,state.bb);
  heading.style.setProperty('--cinema-accent',accent);
  heading.style.setProperty('--cinema-rgb',[state.r,state.g,state.b].map(x=>Math.round(cap(x,0,255))).join(','));
  heading.style.setProperty('--cinema-bg',background);
  heading.style.setProperty('--cinema-energy',String(state.energy));
  if(scene3d)scene3d.tint(state.r,state.g,state.b,state.energy);
};
apply();

function canRun(){
  return !destroyed&&visible&&!document.hidden&&!reduce.matches;
}
function activate(){
  if(!initialized||!canRun()||active)return;
  active=true;
  cycle?.resume();
  scene3d?.resume();
  ensure3d();
  stage.classList.add('is-running');
}
function deactivate(){
  if(!active)return;
  active=false;
  cycle?.pause();
  scene3d?.pause();
  stage.classList.remove('is-running');
}
function setVisibility(on){
  visible=on;
  if(on){if(!initialized)init();else activate();}
  else deactivate();
}
function setStatic(){
  deactivate();
  cycle?.kill();cycle=null;
  Object.assign(state,{r:255,g:214,b:53,br:13,bg:14,bb:19,energy:.42});
  if(status)status.textContent='01 / 04';
  apply();
}
function makeCycle(){
  if(!gsap||reduce.matches||destroyed)return;
  cycle?.kill();
  // Every passage has a considered pause, a brief dip, and a slow cinematic color reveal.
  const t=gsap.timeline({paused:true,repeat:-1});
  palette.forEach((p,i)=>{
    t.to(state,{energy:.18,duration:.28,ease:'sine.in',onUpdate:apply});
    t.to(state,{r:p.rgb[0],g:p.rgb[1],b:p.rgb[2],br:p.bg[0],bg:p.bg[1],bb:p.bg[2],energy:.78,
      duration:1.12,ease:'power3.inOut',onStart:()=>{
        heading.dataset.spectrum=p.name;
        if(status)status.textContent=String(i+1).padStart(2,'0')+' / 04';
      },onUpdate:apply});
    t.to(state,{energy:.37,duration:1.9,ease:'sine.out',onUpdate:apply});
    t.to({}, {duration:p.pace});
  });
  cycle=t;
}

function loadGSAP(){
  if(window.gsap)return Promise.resolve(window.gsap);
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.async=true;
    script.src='https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js';
    script.crossOrigin='anonymous';
    script.onload=()=>window.gsap?resolve(window.gsap):reject(new Error('GSAP did not initialize'));
    script.onerror=()=>reject(new Error('GSAP blocked'));
    document.head.appendChild(script);
  });
}
function makeWebGL(THREE){
  if(!canRun()||lite()||destroyed)return null;
  const mount=stage.querySelector('.showroom-cinema-webgl');
  if(!mount)return null;
  const canvas=document.createElement('canvas');
  canvas.setAttribute('aria-hidden','true');
  canvas.setAttribute('role','presentation');
  mount.appendChild(canvas);
  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:!coarse.matches,alpha:true,powerPreference:'low-power',premultipliedAlpha:false});
  }catch(err){canvas.remove();return null;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,coarse.matches?1:1.35));
  renderer.setClearColor(0x000000,0);
  const world=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(39,1,.1,70);
  camera.position.set(0,0,13);
  const orbit=new THREE.Group();
  world.add(orbit);
  const materials=[];
  const geometry=[];
  const accent=new THREE.Color(1,.84,.2);
  // Differently angled metal light-rings communicate actual three-dimensional space.
  for(let i=0;i<4;i++){
    const g=new THREE.TorusGeometry(3.05+i*.51,.005+(i===1?.011:0),4,160);
    const m=new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:i===0?.26:.11,depthWrite:false});
    const mesh=new THREE.Mesh(g,m);
    mesh.rotation.set(i*.32+.2,i*.36+.5,i*.13);
    mesh.position.set(1.2,-.2,-i*.6);
    orbit.add(mesh);materials.push(m);geometry.push(g);
  }
  // Glass planes, set back in the scene, catch color without blocking the lettering.
  const planes=new THREE.Group();world.add(planes);
  for(let i=0;i<3;i++){
    const g=new THREE.PlaneGeometry(i===0?5.2:2.4,i===0?0.03:0.014);
    const m=new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:i===0?.17:.09,depthWrite:false,side:THREE.DoubleSide});
    const mesh=new THREE.Mesh(g,m);
    mesh.position.set(-1+i*2.2,-1.7+i*.85,-2-i*.8);
    mesh.rotation.z=-.33+i*.38;
    planes.add(mesh);geometry.push(g);materials.push(m);
  }
  // Seeded dust: deterministic positions, no per-frame buffer allocations.
  const count=coarse.matches?125:390;
  const positions=new Float32Array(count*3);
  let seed=17577;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<count;i++){positions[i*3]=(rand()-.5)*18;positions[i*3+1]=(rand()-.5)*9;positions[i*3+2]=(rand()-.5)*7-2;}
  const dustGeo=new THREE.BufferGeometry();
  dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const dustMat=new THREE.PointsMaterial({color:accent,size:coarse.matches?.023:.034,sizeAttenuation:true,transparent:true,opacity:.42,depthWrite:false});
  const dust=new THREE.Points(dustGeo,dustMat);world.add(dust);
  geometry.push(dustGeo);materials.push(dustMat);
  let frameStop=false,last=0,progress=0,resizeTimer=0;
  const size=()=>{
    const rect=mount.getBoundingClientRect();
    const w=Math.max(1,Math.floor(rect.width)),h=Math.max(1,Math.floor(rect.height));
    renderer.setSize(w,h,false);
    camera.aspect=w/h;camera.updateProjectionMatrix();
  };
  size();
  const resize=()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(size,130)};
  window.addEventListener('resize',resize,{passive:true});
  const contextLost=e=>{e.preventDefault();frameStop=true;};
  canvas.addEventListener('webglcontextlost',contextLost,false);
  const frame=(dt,t)=>{
    if(frameStop||!canRun())return false;
    // Hard cap: no more than 36 fps desktop / 25 fps touch.
    const min=coarse.matches?40:28;
    if(t-last<min)return true;
    last=t;progress+=Math.min(.045,dt);
    orbit.rotation.y=Math.sin(progress*.11)*.12;
    orbit.rotation.z=Math.sin(progress*.08)*.034;
    dust.rotation.y=progress*.009;
    planes.rotation.z=Math.sin(progress*.18)*.014;
    renderer.render(world,camera);
    return true;
  };
  let running=false;
  const resume=()=>{
    if(frameStop||running||!canRun())return;
    running=true;
    // Ticker handles scheduling with the site's other animated sections.
    if(motion?.Ticker?.add)motion.Ticker.add((dt,t)=>{const keep=frame(dt,t);if(!keep)running=false;return keep;});
    else {
      let raf=0,old=0;
      const loop=t=>{if(!running||!canRun()){running=false;return}frame(Math.min(.04,(t-old)/1000||.016),t);old=t;raf=requestAnimationFrame(loop)};
      raf=requestAnimationFrame(loop);
    }
  };
  const pause=()=>{running=false};
  const tint=(r,g,b,energy)=>{
    accent.setRGB(r/255,g/255,b/255);
    materials.forEach((m,i)=>{m.color.copy(accent);m.opacity=i<4?(i===0?.13+energy*.18:.055+energy*.08):i<7?.04+energy*.13:.16+energy*.45;});
  };
  const destroy=()=>{
    pause();clearTimeout(resizeTimer);
    window.removeEventListener('resize',resize);
    canvas.removeEventListener('webglcontextlost',contextLost);
    geometry.forEach(g=>g.dispose());
    materials.forEach(m=>m.dispose());
    renderer.dispose();canvas.remove();
  };
  tint(state.r,state.g,state.b,state.energy);
  return {resume,pause,tint,destroy};
}
async function ensure3d(){
  // A fast scroll past the section must not prevent the scene loading later.
  if(scene3d||loading3d||webglFailed||lite()||!canRun())return;
  loading3d=true;
  try{
    const THREE=await import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js');
    if(!canRun())return;
    scene3d=makeWebGL(THREE);
    if(!scene3d)webglFailed=true;
    else if(active)scene3d.resume();
  }catch(err){webglFailed=true;stage.classList.add('cinema-css-fallback');}
  finally{loading3d=false;}
}
async function init(){
  if(initialized||destroyed||reduce.matches)return;
  initialized=true;
  stage.classList.add('is-enhancing');
  try{
    gsap=await loadGSAP();
    if(destroyed||reduce.matches)return;
    makeCycle();
    activate(); // Color motion does not depend on WebGL or the 3D module.
  }catch(err){
    // If GSAP is unavailable, the WebGL backdrop still works and CSS retains a fallback.
    stage.classList.add('cinema-css-fallback');
    activate();
  }
}
const io=('IntersectionObserver'in window)?new IntersectionObserver(entries=>{
  entries.forEach(entry=>setVisibility(entry.isIntersecting));
},{threshold:.05,rootMargin:'120px 0px'}):null;
if(io)io.observe(heading);else setVisibility(true);
mediaChange=()=>{if(reduce.matches)setStatic();else if(visible){if(!gsap){initialized=false;init()}else{makeCycle();activate();}}};
reduce.addEventListener?.('change',mediaChange);
visibilityChange=()=>{if(document.hidden)deactivate();else if(visible)activate()};
document.addEventListener('visibilitychange',visibilityChange);
const cleanup=()=>{
  if(destroyed)return;destroyed=true;
  deactivate();io?.disconnect();
  reduce.removeEventListener?.('change',mediaChange);
  document.removeEventListener('visibilitychange',visibilityChange);
  cycle?.kill();scene3d?.destroy();
};
window.addEventListener('pagehide',cleanup,{once:true});
window.GBShowroomCinema={get active(){return active},get enabled(){return !reduce.matches},get hasWebGL(){return !!scene3d},get color(){return heading.dataset.spectrum||'ÂMBAR'},pause:deactivate,resume:activate};
})();