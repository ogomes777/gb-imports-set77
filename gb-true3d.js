/* GB IMPORTS — V21 / TRUE VOLUME
 * Independent WebGL mannequin: real lateral/back surfaces, never a flipped photo.
 * Product color is estimated from the FRONT photograph. Reverse is simulated.
 * Keeps the existing photographic configurator and all its outfits intact. */
(() => {
'use strict';
const PI=Math.PI,TAU=2*PI,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const C={armor:[.086,.095,.112],joint:[.24,.26,.29],gold:[.97,.59,.045],
  light:[1,.83,.25],shoe:[.12,.13,.15],white:[.83,.84,.82]};
const dark=(c,k)=>c.map(x=>clamp(x*k,0,1));
let installed=false,controller=null;
function mount(){
  if(installed)return true;
  const scene=document.querySelector('#lookstudio .fit-scene');
  const stage=document.querySelector('#lookstudio .look-stage');
  const original=document.getElementById('gbFitFigure');
  if(!scene||!stage||!original||!window.GBFitting)return false;
  const surface=document.createElement('section');
  surface.className='gb-volume';surface.setAttribute('aria-label','Visualização volumétrica 360 graus do manequim GB');
  surface.setAttribute('aria-hidden','true');
  surface.innerHTML='<canvas class="gb-volume-canvas" aria-label="Manequim tridimensional, arraste para girar"></canvas>'+
  '<div class="gb-volume-top"><span>GB / VOLUME 360°</span><div class="gb-volume-actions"><button type="button" class="gb-volume-dance" aria-pressed="false">PASSINHO 3D</button><button type="button" class="gb-volume-exit">VOLTAR À FOTO ×</button></div></div>'+
  '<div class="gb-volume-bottom"><strong class="gb-volume-angle">000° · FRENTE</strong><small>MODELO 3D EDITORIAL · VERSO DAS ROUPAS SIMULADO</small></div>'+
  '<nav class="gb-volume-views" aria-label="Ângulo do manequim">'+
  '<button data-volume-angle="0" type="button">FRENTE</button>'+
  '<button data-volume-angle="90" type="button">DIREITA</button>'+
  '<button data-volume-angle="180" type="button">COSTAS</button>'+
  '<button data-volume-angle="270" type="button">ESQUERDA</button></nav>';
  scene.appendChild(surface);
  const canvas=surface.querySelector('canvas'),gl=canvas.getContext('webgl',{
    antialias:true,alpha:true,premultipliedAlpha:false,powerPreference:'low-power'});
  if(!gl){surface.remove();stage.classList.add('gb-volume-unsupported');return false}
  const vs=`
attribute vec3 position;
attribute vec3 normal;
attribute vec3 color;
attribute float bone;
uniform float turn;
uniform float aspect;
uniform float motionTime;
uniform float motionOn;
uniform vec2 gaze;
uniform float eyeBlink;
varying vec3 N;
varying vec3 C;
vec3 rotateX(vec3 p, float a){float c=cos(a),s=sin(a);return vec3(p.x,c*p.y-s*p.z,s*p.y+c*p.z);}
vec3 rotateZ(vec3 p, float a){float c=cos(a),s=sin(a);return vec3(c*p.x-s*p.y,s*p.x+c*p.y,p.z);}
void main(){
  vec3 p=position,n=normal;
  float phase=motionTime*6.2831853/5.3;
  float sway=sin(phase*2.0)*0.047*motionOn;
  float bounce=(sin(phase*6.0)+0.30*sin(phase*12.0))*0.020*motionOn;
  if(bone>1.5 && bone<3.5){
    float side=bone<2.5?-1.0:1.0;
    vec3 pivot=vec3(side*0.412,2.30,0.0);
    float armX=motionOn*(0.20*sin(phase*3.0+side*1.32)+0.055*sin(phase*6.0-side));
    float armZ=motionOn*(side*0.095+0.14*sin(phase*2.0+side*1.05));
    p=pivot+rotateZ(rotateX(p-pivot,armX),armZ);
    n=rotateZ(rotateX(n,armX),armZ);
  }
  if(bone>3.5 && bone<5.5){
    float side=bone<4.5?-1.0:1.0;
    vec3 pivot=vec3(side*0.240,1.36,0.0);
    float legX=motionOn*(0.145*sin(phase*3.0+(side+1.0)*1.57)+0.045*sin(phase*6.0));
    float legZ=motionOn*(0.085*sin(phase*2.0+side*1.57));
    p=pivot+rotateZ(rotateX(p-pivot,legX),legZ);
    n=rotateZ(rotateX(n,legX),legZ);
  }
  if(bone>0.5 && bone<1.5 || bone>5.5){
    if(bone>5.5){
      p.y=2.94+(p.y-2.94)*(1.0-0.96*eyeBlink);
      p.x+=gaze.x*0.021;
      p.y+=gaze.y*0.012;
    }
    vec3 pivot=vec3(0.0,2.57,0.0);
    float headX=-gaze.y*0.090+motionOn*0.055*sin(phase*4.0);
    float headZ=-gaze.x*0.084+motionOn*0.046*sin(phase*2.0+0.8);
    p=pivot+rotateZ(rotateX(p-pivot,headX),headZ);
    n=rotateZ(rotateX(n,headX),headZ);
  }
  float upper=smoothstep(0.13,1.45,position.y);
  p.x+=sway*upper+gaze.x*0.012*upper;
  p.y+=bounce*upper;
  float co=cos(turn),si=sin(turn);
  vec3 rp=vec3(co*p.x+si*p.z,p.y,-si*p.x+co*p.z);
  N=vec3(co*n.x+si*n.z,n.y,-si*n.x+co*n.z);
  C=color;
  float z=6.0-rp.z;
  gl_Position=vec4(rp.x*2.85/aspect,(rp.y-1.6)*2.85,z*1.026-.20,z);
}`;
  const fs='precision mediump float;varying vec3 N;varying vec3 C;void main(){vec3 n=normalize(N);vec3 l=normalize(vec3(-.7,.95,1.15));float diffuse=.39+.56*max(dot(n,l),0.0)+.13*max(dot(n,normalize(vec3(.8,.35,-.65))),0.0);float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),30.)*.17;gl_FragColor=vec4(clamp(C*diffuse+vec3(1.,.81,.33)*spec,0.,1.),1.);}';
  function shader(kind,body){const s=gl.createShader(kind);gl.shaderSource(s,body);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  let prog;
  try{
    prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vs));
    gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(prog);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
  }catch(err){console.warn('[GB volume] Shader indisponível',err);surface.remove();return false}
  gl.useProgram(prog);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  ['position','normal','color'].forEach((key,i)=>{
    const a=gl.getAttribLocation(prog,key);
    if(a>=0){gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,40,i*12)}
  });
  const boneAttrib=gl.getAttribLocation(prog,'bone');
  if(boneAttrib>=0){gl.enableVertexAttribArray(boneAttrib);gl.vertexAttribPointer(boneAttrib,1,gl.FLOAT,false,40,36)}
  const yawUniform=gl.getUniformLocation(prog,'turn'),aspectUniform=gl.getUniformLocation(prog,'aspect'),
    timeUniform=gl.getUniformLocation(prog,'motionTime'),motionUniform=gl.getUniformLocation(prog,'motionOn'),
    gazeUniform=gl.getUniformLocation(prog,'gaze'),blinkUniform=gl.getUniformLocation(prog,'eyeBlink');
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  let triangles=[],bonePart=0,nVertices=0,active=false,rotation=0,target=0,velocity=0,lastStamp=0,
    tweenFrom=0,tweenStart=0,tweenDuration=750,settleTimer=0,
    frame=0,drag=null,dragX=0,dirty=false,visible=true,lastSelection='',revision=0,
    dancing=false,danceEpoch=0,blinkStart=0,blinkTimer=0,lookX=0,lookY=0,wantX=0,wantY=0;
  let look={top:C.white,bottom:C.armor,shoe:C.shoe,cap:C.armor,topKind:'hoodie',
    bottomKind:'pants',hasShoe:true,hasCap:false,hoodUp:false};
  const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const r=Math.hypot(a[0],a[1],a[2])||1;return a.map(v=>v/r)};
  function tri(a,b,c,color){const n=norm(cross(sub(b,a),sub(c,a)));for(const p of[a,b,c])triangles.push(...p,...n,...color,bonePart)}
  function quad(a,b,c,d,color){tri(a,b,c,color);tri(a,c,d,color)}
  function ball(x,y,z,rx,ry,rz,color,steps=12,stacks=8){
    const at=(i,j)=>{const u=i*TAU/steps,v=j*PI/stacks;
      return [x+rx*Math.sin(v)*Math.cos(u),y+ry*Math.cos(v),z+rz*Math.sin(v)*Math.sin(u)]};
    for(let i=0;i<steps;i++)for(let j=0;j<stacks;j++)quad(at(i,j),at(i+1,j),at(i+1,j+1),at(i,j+1),color)
  }
  function tube(from,to,r0,r1,color,steps=12){
    const ax=norm(sub(to,from)),ref=Math.abs(ax[1])>.82?[1,0,0]:[0,1,0],
      U=norm(cross(ax,ref)),V=cross(ax,U);
    const ring=(p,r)=>Array.from({length:steps},(_,i)=>{const u=i*TAU/steps;
      return p.map((n,k)=>n+r*(Math.cos(u)*U[k]+Math.sin(u)*V[k]))});
    const a=ring(from,r0),b=ring(to,r1);
    for(let i=0;i<steps;i++)quad(a[i],a[(i+1)%steps],b[(i+1)%steps],b[i],color)
  }
  function body(rings,color,steps=20){
    const at=(r,i)=>{const u=i*TAU/steps;return[r[0]+r[3]*Math.cos(u),r[1],r[2]+r[4]*Math.sin(u)]};
    for(let j=0;j<rings.length-1;j++)for(let i=0;i<steps;i++){
      quad(at(rings[j],i),at(rings[j],i+1),at(rings[j+1],i+1),at(rings[j+1],i),color)}
  }
  function box(x,y,z,w,h,d,color){
    const a=x-w/2,b=x+w/2,c=y-h/2,e=y+h/2,f=z-d/2,g=z+d/2;
    quad([a,c,g],[b,c,g],[b,e,g],[a,e,g],color);
    quad([b,c,f],[a,c,f],[a,e,f],[b,e,f],color);
    quad([a,c,f],[a,c,g],[a,e,g],[a,e,f],color);
    quad([b,c,g],[b,c,f],[b,e,f],[b,e,g],color);
    quad([a,e,g],[b,e,g],[b,e,f],[a,e,f],color);
    quad([a,c,f],[b,c,f],[b,c,g],[a,c,g],color)
  }
  function rebuild(){
    triangles=[];bonePart=0;
    const long=/hood|jacket|sweat|track|zip|long/i.test(look.topKind),
      hood=/hood|jacket/i.test(look.topKind),short=/short|bermuda/i.test(look.bottomKind),
      top=look.top,bottom=look.bottom;
    // Full cyborg skeleton and shell, including actual back and lateral depth.
    body([[0,2.40,0,.32,.205],[0,1.9,0,.29,.18],[0,1.45,0,.28,.19]],C.armor);
    bonePart=1;
    tube([0,2.52,0],[0,2.68,0],.107,.103,C.armor);
    for(const side of[-1,1]){
      bonePart=side<0?2:3;
      const sh=[side*.40,2.29,0],el=[side*.52,1.77,0],hand=[side*.54,1.23,.03];
      ball(...sh,.13,.14,.13,C.gold);
      tube(sh,el,.118,.103,C.armor);
      ball(...el,.11,.11,.105,C.gold);
      tube(el,hand,.103,.081,C.armor);
      ball(side*.55,1.17,.03,.086,.111,.075,C.joint);
      tube([side*.52,1.55,.078],[side*.54,1.27,.078],.044,.035,C.gold);
      bonePart=side<0?4:5;
      tube([side*.235,1.43,0],[side*.24,.90,0],.154,.134,C.armor);
      ball(side*.24,.88,0,.138,.13,.141,C.gold);
      tube([side*.242,.81,0],[side*.253,.22,.01],.124,.099,C.armor);
      tube([side*.254,.68,.105],[side*.255,.40,.10],.028,.021,C.gold);
    }
    // Sculpted GB helmet, faceplate, golden eyes and back panels.
    bonePart=1;
    ball(0,2.91,0,.206,.252,.191,C.armor,20,14);
    ball(0,3.105,-.018,.214,.102,.188,C.joint);
    box(0,2.93,.171,.307,.17,.027,C.joint);
    box(0,2.92,.192,.025,.19,.016,C.gold);
    for(const side of[-1,1]){
      bonePart=side<0?6:7;
      ball(side*.083,2.94,.201,.057,.027,.014,C.light);
      bonePart=1;
      ball(side*.181,2.92,-.07,.037,.095,.096,C.gold);
      box(side*.17,2.87,.08,.024,.19,.15,C.gold)
    }
    box(0,2.789,.175,.19,.024,.02,C.gold);
    // Product clothing: volume has thickness. Colors only estimated from front images.
    bonePart=0;
    body([[0,2.4,0,.366,.239],[0,2.24,0,.390,.244],
      [0,1.98,0,.348,.245],[0,1.70,0,.305,.226],[0,1.47,0,.309,.232]],top);
    body([[0,1.477,0,.310,.236],[0,1.446,0,.314,.237]],dark(top,.78));
    ball(0,2.405,0,.147,.033,.125,dark(top,.65));
    if(hood){
      body([[0,2.65,-.085,.237,.179],[0,2.5,-.093,.273,.229],
        [0,2.36,-.105,.28,.235]],dark(top,.88));
      ball(0,2.55,-.15,.225,.117,.161,dark(top,.84));
    }
    for(const s of[-1,1]){
      bonePart=s<0?2:3;
      const sh=[s*.412,2.3,0],el=[s*.52,1.77,0],hand=[s*.54,1.25,.02];
      tube(sh,long?hand:[s*.47,2.00,0],long?.151:.161,long?.093:.152,top);
      if(long)tube([s*.534,1.34,.02],hand,.096,.093,dark(top,.75));
      else tube([s*.47,2.01,0],[s*.48,1.967,0],.154,.156,dark(top,.76))
    }
    bonePart=0;
    box(0,2.15,-.25,.41,.018,.018,dark(top,.76));
    if(short){
      body([[0,1.48,0,.329,.232],[0,1.32,0,.337,.247]],bottom);
      for(const s of[-1,1]){
        bonePart=s<0?4:5;
        tube([s*.24,1.34,0],[s*.242,.94,0],.203,.193,bottom,16);
        tube([s*.242,.96,0],[s*.244,.921,0],.196,.196,dark(bottom,.73))
      }
    }else{
      body([[0,1.48,0,.325,.231],[0,1.33,0,.329,.246]],bottom);
      for(const s of[-1,1]){
        bonePart=s<0?4:5;
        tube([s*.24,1.35,0],[s*.242,.87,0],.194,.143,bottom,16);
        ball(s*.242,.87,0,.146,.103,.144,bottom);
        tube([s*.244,.91,0],[s*.254,.211,.01],.142,.106,bottom,16);
        tube([s*.254,.225,.01],[s*.255,.203,.01],.107,.107,dark(bottom,.75))
      }
    }
    for(const s of[-1,1]){
      bonePart=s<0?4:5;
      const x=s*.254,shoe=look.hasShoe?look.shoe:C.shoe;
      ball(x,.142,.116,.151,.102,.286,shoe,16,10);
      ball(x,.075,.119,.166,.038,.307,dark(shoe,.62),16,8);
      ball(x,.23,-.035,.102,.107,.119,dark(shoe,.85))
    }
    bonePart=1;
    if(look.hasCap){
      ball(0,3.16,-.018,.229,.086,.226,look.cap,16,10);
      ball(0,3.114,.188,.240,.027,.118,dark(look.cap,.77),16,8)
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    const data=new Float32Array(triangles);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    nVertices=data.length/10;dirty=true;renderNext()
  }
  const sampled=new Map();
  function imageColor(src,fallback){
    if(!src)return Promise.resolve(fallback);
    if(sampled.has(src))return Promise.resolve(sampled.get(src));
    return new Promise(resolve=>{
      const image=new Image();image.decoding='async';
      image.onload=()=>{
        try{
          const c=document.createElement('canvas');c.width=c.height=40;
          const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,40,40);
          const d=ctx.getImageData(0,0,40,40).data,bins=new Map();
          for(let i=0;i<d.length;i+=4){
            if(d[i+3]<185)continue;
            const key=[d[i],d[i+1],d[i+2]].map(v=>Math.floor(v/32)).join('/');
            const e=bins.get(key)||[0,0,0,0];e[0]++;e[1]+=d[i];e[2]+=d[i+1];e[3]+=d[i+2];bins.set(key,e)
          }
          const most=[...bins.values()].sort((a,b)=>b[0]-a[0])[0];
          const color=most?[most[1]/most[0]/255,most[2]/most[0]/255,most[3]/most[0]/255]:fallback;
          sampled.set(src,color);resolve(color)
        }catch{resolve(fallback)}
      };
      image.onerror=()=>resolve(fallback);image.src=src
    })
  }
  function outfit(force=false){
    const s=window.GBFitting.state||{},catalog=window.GB_FIT_CATALOG||{};
    const key=[s.topId,s.bottomId,s.shoeId,s.capId,s.hood].join(':');
    if(!force&&key===lastSelection)return;
    lastSelection=key;const rev=++revision;
    const top=catalog.top?.[s.topId],bottom=catalog.bottom?.[s.bottomId],
      shoe=catalog.shoe?.[s.shoeId],cap=catalog.cap?.[s.capId];
    Promise.all([imageColor(top?.src,C.white),imageColor(bottom?.src,C.armor),
      imageColor(shoe?.src,C.shoe),imageColor(cap?.src,C.armor)]).then(colors=>{
        if(rev!==revision)return;
        look={top:colors[0],bottom:colors[1],shoe:colors[2],cap:colors[3],
          topKind:top?.kind||'tee',bottomKind:bottom?.kind||'pants',
          hasShoe:!!shoe,hasCap:!!cap,hoodUp:!!s.hood};rebuild()
      })
  }
  const label=surface.querySelector('.gb-volume-angle');
  const danceButton=surface.querySelector('.gb-volume-dance');
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function blinkLater(){
    clearTimeout(blinkTimer);
    if(!active)return;
    blinkTimer=setTimeout(()=>{
      if(!active)return;
      blinkStart=performance.now();
      dirty=true;renderNext();blinkLater();
    },2700+Math.random()*1800);
  }
  function setDancing(on){
    dancing=!!on&&!reduced();
    danceEpoch=performance.now();
    danceButton.textContent=dancing?'PARAR PASSINHO':'PASSINHO 3D';
    danceButton.setAttribute('aria-pressed',String(dancing));
    dirty=true;renderNext();
  }
  function renderNext(){if(active&&!frame&&!document.hidden)frame=requestAnimationFrame(draw)}
  function draw(now){
    frame=0;if(!active||document.hidden)return;
    const w=canvas.clientWidth,h=canvas.clientHeight,
      dpr=clamp(window.devicePixelRatio||1,1,innerWidth<780?1.25:1.7);
    if(!w||!h||!nVertices)return;
    const W=Math.round(w*dpr),H=Math.round(h*dpr);
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H}
    const dt=lastStamp?clamp(now-lastStamp,1,45):16;
    lastStamp=now;
    const follow=1-Math.exp(-dt/115);
    lookX+=(wantX-lookX)*follow;lookY+=(wantY-lookY)*follow;
    let blink=0;
    if(blinkStart){
      const t=(now-blinkStart)/225;
      if(t>=1)blinkStart=0;
      else blink=Math.pow(Math.sin(PI*t),2);
    }
    if(drag==null&&tweenStart){
      // Duration uses wall-clock time, not per-frame Euler steps.
      // Even a slow GPU catches up instead of freezing at 1° forever.
      const t=clamp((now-tweenStart)/tweenDuration,0,1);
      const eased=1-Math.pow(1-t,3.3);
      rotation=tweenFrom+(target-tweenFrom)*eased;
      if(t>=1){rotation=target;tweenStart=0;velocity=0}
    }
    gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(yawUniform,rotation);gl.uniform1f(aspectUniform,W/H);
    gl.uniform1f(timeUniform,(now-danceEpoch)/1000);
    gl.uniform1f(motionUniform,dancing?1:0);
    gl.uniform2f(gazeUniform,lookX,lookY);
    gl.uniform1f(blinkUniform,blink);
    gl.drawArrays(gl.TRIANGLES,0,nVertices);
    const degrees=((Math.round(rotation*180/PI)%360)+360)%360;
    const name=degrees<35||degrees>325?'FRENTE':degrees>145&&degrees<215?'COSTAS':degrees<=145?'DIREITA':'ESQUERDA';
    label.textContent=String(degrees).padStart(3,'0')+'° · '+name;
    const slider=scene.querySelector('.fit-dial');
    if(slider&&dialPointer==null){
      slider.setAttribute('aria-valuenow',String(Math.round(((degrees+180)%360)-180)));
      slider.setAttribute('aria-valuetext',name);
      slider.style.setProperty('--orbit-position',(((((degrees+180)%360)-180)/360+.5)*100).toFixed(1)+'%');
    }
    if(dancing||blinkStart||Math.abs(wantX-lookX)>.006||Math.abs(wantY-lookY)>.006||
       drag!=null||tweenStart!==0||dirty){
      dirty=false;renderNext()
    }else lastStamp=0
  }
  function open(){
    if(active)return true;
    if(stage.classList.contains('is-fit-compare'))return false;
    if(window.GBFitting.emoting)window.GBFitting.emote(window.GBFitting.emoting);
    active=true;rotation=0;target=0;velocity=0;lastStamp=0;tweenStart=0;clearTimeout(settleTimer);dirty=true;
    setDancing(false);wantX=wantY=lookX=lookY=0;blinkLater();
    stage.classList.add('is-true-3d');surface.setAttribute('aria-hidden','false');
    outfit(true);renderNext();return true
  }
  function close(){
    active=false;stage.classList.remove('is-true-3d');surface.setAttribute('aria-hidden','true');
    cancelAnimationFrame(frame);clearTimeout(settleTimer);clearTimeout(blinkTimer);
    dancing=false;blinkStart=0;wantX=wantY=lookX=lookY=0;
    frame=0;lastStamp=0;tweenStart=0;drag=null;surface.classList.remove('is-dragging')
  }
  function tweenTo(destination,duration){
    clearTimeout(settleTimer);
    tweenFrom=rotation;target=destination;tweenStart=performance.now();
    tweenDuration=duration;dirty=true;renderNext();
    // Safety deadline for browsers that throttle rAF under heavy compositing:
    // finish the requested angle rather than leaving the robot half-turned.
    settleTimer=setTimeout(()=>{
      if(!active||drag!==null||target!==destination)return;
      rotation=destination;tweenStart=0;dirty=true;renderNext()
    },duration+75)
  }
  function rotateTo(deg){
    if(!open())return;
    const rad=deg*PI/180,dest=rad+Math.round((rotation-rad)/TAU)*TAU;
    const duration=clamp(420+Math.abs(dest-rotation)*340,430,1550);
    tweenTo(dest,matchMedia('(prefers-reduced-motion: reduce)').matches?1:duration)
  }
  function turnFull(){
    if(!open())return;
    tweenTo(rotation+TAU,matchMedia('(prefers-reduced-motion: reduce)').matches?1:1800)
  }
  function begin(e){
    if(e.button!==0||!open())return;
    e.preventDefault();e.stopImmediatePropagation();drag=e.pointerId;dragX=e.clientX;
    velocity=0;tweenStart=0;clearTimeout(settleTimer);surface.classList.add('is-dragging');renderNext();
    try{e.target.setPointerCapture(e.pointerId)}catch{}
  }
  function move(e){
    if(drag!==e.pointerId)return;
    e.preventDefault();e.stopImmediatePropagation();
    rotation+=(e.clientX-dragX)*PI/Math.max(180,canvas.clientWidth*.7);
    dragX=e.clientX;target=rotation;velocity=0;tweenStart=0;dirty=true;renderNext()
  }
  function end(e){
    if(drag!==e.pointerId)return;
    e.stopImmediatePropagation();drag=null;surface.classList.remove('is-dragging');renderNext()
  }
  danceButton.addEventListener('click',()=>setDancing(!dancing));
  const aim=e=>{
    const r=canvas.getBoundingClientRect();
    if(!r.width||!r.height)return;
    wantX=clamp((e.clientX-r.left)/r.width*2-1,-1,1);
    wantY=clamp(1-(e.clientY-r.top)/r.height*2,-1,1);
    renderNext();
  };
  canvas.addEventListener('pointermove',aim,{passive:true});
  canvas.addEventListener('pointerdown',aim,{passive:true});
  canvas.addEventListener('pointerleave',()=>{wantX=wantY=0;renderNext()});
  canvas.addEventListener('pointerdown',begin);
  canvas.addEventListener('pointermove',move);
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
  // Pointer gesture starts directly on the original sprite. Continue receiving
  // its movement from the original scene, with no 2D spin competing.
  scene.addEventListener('pointerdown',e=>{
    if(active||!original.contains(e.target)||stage.classList.contains('is-fit-compare'))return;
    begin(e)
  },true);
  scene.addEventListener('pointermove',move,true);
  scene.addEventListener('pointerup',end,true);
  scene.addEventListener('pointercancel',end,true);
  surface.querySelector('.gb-volume-exit').addEventListener('click',close);
  surface.querySelectorAll('[data-volume-angle]').forEach(b=>b.addEventListener('click',()=>rotateTo(+b.dataset.volumeAngle)));
  // Convert the existing emote 360° and orbit buttons to actual volumetric rotation.
  scene.addEventListener('click',e=>{
    const b=e.target.closest?.('[data-fit-emote="spin"],[data-fit-turn]');
    if(!b)return;
    e.preventDefault();e.stopImmediatePropagation();
    if(b.matches('[data-fit-emote="spin"]'))turnFull();
    else rotateTo(+b.dataset.fitTurn*90)
  },true);
  const activate=document.createElement('button');
  activate.type='button';activate.className='gb-volume-open';activate.textContent='VOLUME 3D';
  activate.title='Visualizar o manequim em 360 graus com volume real';
  scene.querySelector('.fit-turnbar')?.appendChild(activate);
  activate.addEventListener('click',()=>open());
  const dial=scene.querySelector('.fit-dial');
  // Keep the slider's accessible range consistent with 360° instead of
  // the old ±45° 2D sprite limit.
  dial?.setAttribute('aria-valuemin','-180');
  dial?.setAttribute('aria-valuemax','180');
  // Physical ORBIT track controls the entire 360° continuously. No CSS
  // sprite yaw or 3-pose snap while in volumetric mode.
  let dialPointer=null;
  const moveDial=e=>{
    const track=dial.querySelector('.fit-spin-track')||dial;
    const r=track.getBoundingClientRect();if(!r.width)return;
    const fraction=clamp((e.clientX-r.left)/r.width,0,1);
    rotation=(fraction-.5)*TAU;target=rotation;velocity=0;tweenStart=0;clearTimeout(settleTimer);dirty=true;renderNext();
    dial.style.setProperty('--orbit-position',(fraction*100).toFixed(1)+'%');
  };
  dial?.addEventListener('pointerdown',e=>{
    if(e.button!==0||stage.classList.contains('is-fit-compare'))return;
    if(!open())return;
    e.preventDefault();e.stopImmediatePropagation();dialPointer=e.pointerId;
    try{dial.setPointerCapture(e.pointerId)}catch{}
    moveDial(e)
  },true);
  dial?.addEventListener('pointermove',e=>{
    if(dialPointer!==e.pointerId)return;
    e.preventDefault();e.stopImmediatePropagation();moveDial(e)
  },true);
  const releaseDial=e=>{
    if(dialPointer!==e.pointerId)return;
    e.stopImmediatePropagation();dialPointer=null;renderNext()
  };
  dial?.addEventListener('pointerup',releaseDial,true);
  dial?.addEventListener('pointercancel',releaseDial,true);
  dial?.addEventListener('lostpointercapture',releaseDial,true);
  dial?.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    if(!open())return;
    e.preventDefault();e.stopImmediatePropagation();
    if(e.key==='Home')rotateTo(0);else if(e.key==='End')rotateTo(180);
    else rotateTo(rotation*180/PI+(e.key==='ArrowLeft'?-15:15))
  },true);
  const refresh=setInterval(()=>{if(!document.body.contains(scene)){clearInterval(refresh);close()}else if(active)outfit()},800);
  window.addEventListener('resize',()=>{dirty=true;renderNext()},{passive:true});
  document.addEventListener('visibilitychange',()=>{lastStamp=0;if(!document.hidden)renderNext()});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();close();stage.classList.add('gb-volume-unsupported')});
  controller={open,close,rotateTo,turnFull,outfit,get active(){return active},
    get angle(){return rotation},get vertices(){return nVertices},get rendered(){return canvas.width>0},
    get pending(){return target-rotation},get dancing(){return dancing},get gaze(){return [lookX,lookY]}};
  window.GBTrue360=controller;
  installed=true;return true
}
const watch=new MutationObserver(()=>{if(mount())watch.disconnect()});
if(!mount()){
  watch.observe(document.documentElement,{subtree:true,childList:true});
  setTimeout(()=>watch.disconnect(),90000)
}
})();
