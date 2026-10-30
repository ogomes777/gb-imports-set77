/* GB IMPORTS / SET77 | BLACK GOLD MATERIAL V42
 * Fur modeled with adaptive WebGL2 instancing, based on the user-supplied
 * Originkit study. Own shader, no React, remote dependencies or copied glyph.
 * Shares the V38 cinematic entry, which still controls shop boot and skip.
 */
(()=>{
'use strict';
const host=document.getElementById('gbRibbonBoot'),film=window.GBGlassRibbons;
if(!host||!film?.opening||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const logoPath='./assets/brand/gb-monograma-amarelo-preto.svg';
const stage=document.createElement('div');
stage.className='gb-material-stage';stage.setAttribute('aria-hidden','true');
stage.innerHTML='<div class="gb-material-halo"></div><div class="gb-material-tile"><span class="gb-material-static"><img src="'+logoPath+'" alt="" draggable="false"></span><canvas class="gb-material-canvas"></canvas></div><div class="gb-material-shadow"></div>';
host.append(stage);host.classList.add('gb-material-v42');
const canvas=stage.querySelector('canvas'),tile=stage.querySelector('.gb-material-tile');
const low=innerWidth<780||navigator.connection?.saveData||navigator.deviceMemory&&navigator.deviceMemory<=4;
const strands=navigator.connection?.saveData?4000:innerWidth<780?9500:low?15000:28000;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let gl=null,programBase=null,programFur=null,tex=null,vao=null,raf=0,first=0,last=0,frames=0,disposed=false,mode='fallback',ready=false;
let UB=null,UF=null;
let px=0,py=0,lastPointer=0;
const res={shaders:[],programs:[]};
const art=document.createElement('canvas');art.width=512;art.height=512;
const actx=art.getContext('2d',{alpha:false});
actx.fillStyle='#f1eee5';actx.fillRect(0,0,512,512);
const logo=new Image();logo.decoding='async';
logo.onload=()=>{try{actx.drawImage(logo,32,107,448,274);ready=true;upload();request()}catch(e){}};
logo.src=logoPath;
const baseVS='#version 300 es\nprecision highp float;out vec2 uv;void main(){vec2 p=vec2((gl_VertexID&1)==0?-1.:1.,gl_VertexID<2?-1.:1.);uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
const baseFS='#version 300 es\nprecision highp float;in vec2 uv;out vec4 frag;uniform sampler2D art;uniform vec2 mouse;float sd(vec2 p){vec2 q=abs(p)-vec2(.58);return length(max(q,0.))+min(max(q.x,q.y),0.)-.32;}void main(){vec2 p=uv*2.-1.;float d=sd(p);float a=1.-smoothstep(-.012,.014,d);if(a<.002)discard;vec3 pigment=texture(art,uv).rgb;float edge=smoothstep(-.27,.009,d);float dome=1.-.16*dot(p,p);float directional=.90+.23*p.y-.16*p.x+dot(mouse,p)*.045;vec3 col=pigment*(1.-edge*.41)*dome*directional;float spec=pow(max(0.,1.-length((p-vec2(-.29,.40))*vec2(1.,1.2))),7.)*.18;col+=vec3(1.,.94,.80)*spec;frag=vec4(col*a,a);}';
const furVS='#version 300 es\nprecision highp float;precision highp int;uniform sampler2D art;uniform float t;uniform vec2 mouse;uniform float touch;out vec3 tint;out float alpha;uint hash(uint x){x^=x>>16;x*=0x7feb352du;x^=x>>15;x*=0x846ca68bu;x^=x>>16;return x;}float rand(uint x){return float(hash(x)&65535u)/65535.;}float sd(vec2 p){vec2 q=abs(p)-vec2(.58);return length(max(q,0.))+min(max(q.x,q.y),0.)-.32;}void main(){uint id=uint(gl_InstanceID);vec2 p=(vec2(rand(id*31u+11u),rand(id*17u+93u))*2.-1.)*.91;float live=1.-smoothstep(-.015,.006,sd(p));float a=rand(id*43u+19u)*6.2831853;float len=(.012+rand(id*29u+37u)*.024);float wind=sin(t*1.62+p.x*7.+p.y*4.+a)*.18;float proximity=exp(-dot(p-mouse,p-mouse)*24.)*touch;vec2 dir=normalize(vec2(.2+sin(a)*.35,.75+cos(a)*.23))+vec2(wind,0.)+normalize(p-mouse+vec2(.001))*.52*proximity;int k=gl_VertexID;float s=(k==1||k==2||k==4)?1.:0.;float side=(k==0||k==1||k==3)?-1.:1.;float w=(.0018+rand(id*7u+77u)*.0018)*(1.-.50*s);vec2 v=p+dir*len*s+normalize(vec2(-dir.y,dir.x))*side*w;gl_Position=vec4(v,0.,1.);vec3 col=texture(art,p*.5+.5).rgb;float glow=max(0.,dot(normalize(dir),normalize(vec2(-.5,.85))));tint=col*(.58+.25*rand(id*67u+21u)+.34*glow*s);alpha=live*(.91-.42*s);}';
const furFS='#version 300 es\nprecision highp float;in vec3 tint;in float alpha;out vec4 frag;void main(){frag=vec4(tint*alpha,alpha);}';
const compile=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));res.shaders.push(s);return s};
const prog=(vs,fs)=>{const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));res.programs.push(p);return p};
function upload(){if(!gl||!tex||!ready)return;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,art)}
function resize(){if(!gl)return;const r=canvas.getBoundingClientRect(),limit=low?480:850,dpr=Math.min(devicePixelRatio||1,low?1:1.2),ratio=Math.min(dpr,limit/Math.max(r.width,r.height,1));canvas.width=Math.max(1,Math.floor(r.width*ratio));canvas.height=Math.max(1,Math.floor(r.height*ratio));gl.viewport(0,0,canvas.width,canvas.height)}
function clean(){cancelAnimationFrame(raf);raf=0;if(!gl)return;res.programs.forEach(p=>gl.deleteProgram(p));res.shaders.forEach(s=>gl.deleteShader(s));if(tex)gl.deleteTexture(tex);if(vao)gl.deleteVertexArray(vao);canvas.width=canvas.height=0;gl=null}
function stop(){if(disposed)return;disposed=true;clean();observer?.disconnect();stage.remove();window.removeEventListener('pointermove',pointer);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility)}
function pointer(e){const r=stage.getBoundingClientRect();px=clamp((e.clientX-r.left)/Math.max(1,r.width)*2-1,-1,1);py=clamp(1-(e.clientY-r.top)/Math.max(1,r.height)*2,-1,1);lastPointer=performance.now();request()}
function visibility(){if(!document.hidden)request()}
function request(){if(!raf&&!disposed&&gl&&host.isConnected&&!document.hidden)raf=requestAnimationFrame(draw)}
function draw(now){
 raf=0;
 if(disposed||!gl||document.hidden||!host.isConnected||host.classList.contains('is-gateway')||host.classList.contains('is-preparing-entry'))return;
 if(!first)first=now;
 if(last&&now-last<(low?32:20)){request();return}
 last=now;const t=(now-first)/1000,active=performance.now()-lastPointer<1800;
 gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
 gl.bindVertexArray(vao);
 gl.useProgram(programBase);
 gl.uniform1i(UB.art,0);gl.uniform2f(UB.mouse,px,py);
 gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
 gl.useProgram(programFur);
 gl.uniform1i(UF.art,0);
 gl.uniform1f(UF.t,t);
 gl.uniform2f(UF.mouse,px,py);
 gl.uniform1f(UF.touch,active?1:0);
 gl.drawArraysInstanced(gl.TRIANGLES,0,6,strands);
 frames++;
 if(ready&&frames>=1)host.classList.add('gb-material-gpu');
 if(t<3&&host.classList.contains('is-opening'))request();
}
function setup(){
 if(disposed)return;
 try{
  gl=canvas.getContext('webgl2',{alpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power',premultipliedAlpha:true});
  if(!gl)return;
  programBase=prog(baseVS,baseFS);programFur=prog(furVS,furFS);
  UB={art:gl.getUniformLocation(programBase,'art'),mouse:gl.getUniformLocation(programBase,'mouse')};
  UF={art:gl.getUniformLocation(programFur,'art'),t:gl.getUniformLocation(programFur,'t'),mouse:gl.getUniformLocation(programFur,'mouse'),touch:gl.getUniformLocation(programFur,'touch')};
  vao=gl.createVertexArray();gl.bindVertexArray(vao);
  tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const fill=art.getContext('2d').getImageData(0,0,1,1);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(fill.data));
  upload();resize();gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  mode='webgl2';request();
 }catch(err){mode='fallback';clean()}
}
let observer=null;
if('MutationObserver'in window){
 observer=new MutationObserver(()=>{
  if(!host.isConnected||host.classList.contains('is-gateway')||host.classList.contains('is-finished'))stop();
  else if(host.classList.contains('is-preparing-entry')){clean();host.classList.remove('gb-material-gpu')}
 });
 observer.observe(host,{attributes:true,attributeFilter:['class']});
 observer.observe(document.body,{childList:true});
}
window.addEventListener('pointermove',pointer,{passive:true});
window.addEventListener('resize',resize,{passive:true});
document.addEventListener('visibilitychange',visibility);
if('requestIdleCallback'in window)requestIdleCallback(setup,{timeout:1500});else setTimeout(setup,700);
window.GBMaterialSignatureV42=Object.freeze({get mode(){return mode},get strands(){return strands},get frames(){return frames},get stopped(){return disposed},get asset(){return logoPath},get artworkReady(){return ready},finish:stop});
})();