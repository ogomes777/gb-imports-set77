/* GB IMPORTS V56 | Original SVG volume, WebGL 360 (no CDN/interaction) */
(()=>{
'use strict';
const section=document.querySelector('#universo.gb56-brand'),stage=section?.querySelector('.gb56-stage'),canvas=stage?.querySelector('.gb56-canvas');
if(!section||!stage||!canvas||section.dataset.gb56)return;
section.dataset.gb56='ready';
const reduced=matchMedia('(prefers-reduced-motion:reduce)'),low=!!navigator.connection?.saveData||(navigator.hardwareConcurrency||8)<=4;
let gl,program,buffer,tex,count=0,raf=0,loaded=false,failed=false,visible=false,angle=-.24,last=0,paint=0,frames=0;const epoch=performance.now();
const uniform={},proj=new Float32Array(16),TWO=Math.PI*2;
const vert=[
'attribute vec3 aPos,aNormal;attribute vec2 aUV;attribute float aType;',
'uniform mat4 uProjection;uniform float uAngle;',
'varying vec3 vN;varying vec2 vUV;varying float vType;',
'void main(){float s=sin(uAngle),c=cos(uAngle);',
'vec3 p=vec3(c*aPos.x+s*aPos.z,aPos.y,-s*aPos.x+c*aPos.z);',
'vec3 n=vec3(c*aNormal.x+s*aNormal.z,aNormal.y,-s*aNormal.x+c*aNormal.z);',
'float t=-.115,st=sin(t),ct=cos(t);',
'p=vec3(p.x,ct*p.y-st*p.z,st*p.y+ct*p.z-6.25);',
'n=vec3(n.x,ct*n.y-st*n.z,st*n.y+ct*n.z);',
'vN=normalize(n);vUV=aUV;vType=aType;',
'gl_Position=uProjection*vec4(p,1.0);}'
].join('\n');
const frag=[
'precision mediump float;uniform sampler2D uTexture;',
'varying vec3 vN;varying vec2 vUV;varying float vType;',
'void main(){vec3 n=normalize(vN),l=normalize(vec3(-.60,.72,1.20));',
'float diffuse=max(dot(n,l),0.0);',
'float spec=pow(max(dot(reflect(-l,n),vec3(0.0,0.0,1.0)),0.0),24.0);',
'if(vType<1.5){vec4 color=texture2D(uTexture,vUV);if(color.a<.28)discard;',
'float k=(vType<.5?.70:.50)+diffuse*.30;',
'vec3 shine=vec3(1.0,.81,.34)*spec*.28;',
'gl_FragColor=vec4(clamp(color.rgb*k+shine,0.0,1.0),color.a);',
'}else{vec3 gold=vec3(.23,.15,.04)*(.67+diffuse*.9);',
'gold+=vec3(.76,.53,.12)*spec*.67;gl_FragColor=vec4(gold,1.0);}}'
].join('\n');
function fail(e){failed=true;stop();stage.classList.remove('gb56-webgl');section.dataset.gb56Error=String(e?.message||e).slice(0,100);if(gl){if(buffer)gl.deleteBuffer(buffer);if(tex)gl.deleteTexture(tex);if(program)gl.deleteProgram(program)}gl=null}
function shader(t,src){const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
function makeProgram(){
 const a=shader(gl.VERTEX_SHADER,vert),b=shader(gl.FRAGMENT_SHADER,frag);
 program=gl.createProgram();gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
 gl.deleteShader(a);gl.deleteShader(b);
 for(const k of ['aPos','aNormal','aUV','aType'])uniform[k]=gl.getAttribLocation(program,k);
 uniform.mvp=gl.getUniformLocation(program,'uProjection');uniform.rotation=gl.getUniformLocation(program,'uAngle');
 uniform.texture=gl.getUniformLocation(program,'uTexture');
}
function mesh(image){
 const w=low?188:266,h=Math.round(w*.61),mask=document.createElement('canvas');
 mask.width=w;mask.height=h;
 const ctx=mask.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('2d unavailable');
 ctx.drawImage(image,0,0,w,h);
 const alpha=ctx.getImageData(0,0,w,h).data;
 const inside=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&alpha[(y*w+x)*4+3]>=128;
 const W=3.72,H=W*.61,Z=.245,v=[];
 const xx=x=>(x/w-.5)*W, yy=y=>(.5-y/h)*H;
 function put(p,n,uv,kind){v.push(...p,...n,...uv,kind)}
 function tri(a,b,c,n,kind,uv=[[0,0],[1,0],[1,1]]){put(a,n,uv[0],kind);put(b,n,uv[1],kind);put(c,n,uv[2],kind)}
 let a=[-W/2,-H/2,Z],b=[W/2,-H/2,Z],c=[W/2,H/2,Z],d=[-W/2,H/2,Z];
 tri(a,b,c,[0,0,1],0);tri(a,c,d,[0,0,1],0,[[0,0],[1,1],[0,1]]);
 a=[-W/2,-H/2,-Z];b=[W/2,-H/2,-Z];c=[W/2,H/2,-Z];d=[-W/2,H/2,-Z];
 tri(a,c,b,[0,0,-1],1,[[0,0],[1,1],[1,0]]);tri(a,d,c,[0,0,-1],1,[[0,0],[0,1],[1,1]]);
 function wall(x0,y0,x1,y1,n){
  const a=[xx(x0),yy(y0),Z],b=[xx(x1),yy(y1),Z],c=[xx(x1),yy(y1),-Z],d=[xx(x0),yy(y0),-Z];
  tri(a,b,c,n,2);tri(a,c,d,n,2);
 }
 let edges=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(inside(x,y)){
  if(!inside(x,y-1)){wall(x,y,x+1,y,[0,1,0]);edges++}
  if(!inside(x,y+1)){wall(x+1,y+1,x,y+1,[0,-1,0]);edges++}
  if(!inside(x-1,y)){wall(x,y+1,x,y,[-1,0,0]);edges++}
  if(!inside(x+1,y)){wall(x+1,y,x+1,y+1,[1,0,0]);edges++}
 }
 if(edges<300||edges>20000)throw Error('invalid silhouette '+edges);
 buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.STATIC_DRAW);
 count=v.length/9;section.dataset.gb56Faces=String(count);
 const face=document.createElement('canvas');face.width=low?512:768;face.height=Math.round(face.width*.61);
 face.getContext('2d').drawImage(image,0,0,face.width,face.height);
 tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,face);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
}
function resize(){
 if(!loaded||!gl)return;
 const box=canvas.getBoundingClientRect();if(box.width<30||box.height<30)return;
 const dpr=Math.min(devicePixelRatio||1,low?1.2:1.6),s=Math.min(dpr,(low?580:900)/box.width);
 const w=Math.max(1,Math.round(box.width*s)),h=Math.max(1,Math.round(box.height*s));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
 const near=.1,far=50,f=1/Math.tan(40*Math.PI/360);
 proj.set([f/(w/h),0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);
}
function draw(){
 if(!loaded||!gl)return;
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 for(const [k,n,off] of [['aPos',3,0],['aNormal',3,3],['aUV',2,6],['aType',1,8]]){
  const loc=uniform[k];gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,36,off*4);
 }
 gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);gl.uniform1i(uniform.texture,0);
 gl.uniformMatrix4fv(uniform.mvp,false,proj);gl.uniform1f(uniform.rotation,angle);
 gl.drawArrays(gl.TRIANGLES,0,count);
}
function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0}
function step(now){
 raf=0;if(!loaded||!visible||document.hidden||reduced.matches||failed)return;
 if(!last)last=now;
 last=now;angle=-.24+((now-epoch)%23500)*TWO/23500;frames++;
 if(!low||now-paint>=32){draw();paint=now}
 raf=requestAnimationFrame(step);
}
function start(){if(!raf&&loaded&&visible&&!document.hidden&&!reduced.matches&&!failed){last=0;raf=requestAnimationFrame(step)}}
function init(){
 if(loaded||failed||reduced.matches||navigator.connection?.saveData)return;
 try{
  gl=canvas.getContext('webgl',{alpha:true,antialias:!low,depth:true,preserveDrawingBuffer:false,powerPreference:'low-power'});
  if(!gl)throw Error('WebGL unavailable');
  makeProgram();
  const image=new Image();image.decoding='async';
  image.onload=()=>{if(failed)return;try{
   mesh(image);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
   gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
   gl.disable(gl.CULL_FACE);loaded=true;resize();draw();stage.classList.add('gb56-webgl');start();
  }catch(e){fail(e)}};
  image.onerror=()=>fail(Error('Original GB SVG could not load'));
  image.src='./assets/brand/gb-monograma-amarelo-preto.svg';
 }catch(e){fail(e)}
}
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(Error('WebGL context lost'))});
if('ResizeObserver'in window)new ResizeObserver(()=>{if(loaded){resize();draw()}}).observe(stage);
else addEventListener('resize',()=>{resize();draw()},{passive:true});
document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
if('IntersectionObserver'in window)new IntersectionObserver(([e])=>{
 visible=!!e?.isIntersecting;if(visible){init();start()}else stop();
},{rootMargin:'140px 0px 140px 0px',threshold:0}).observe(stage);
else{visible=true;init()}
window.GBBrand3DV56={version:56,get ready(){return loaded},get running(){return !!raf},get failed(){return failed},get angle(){return angle},get triangles(){return count/3},get frames(){return frames},get fallback(){return !stage.classList.contains('gb56-webgl')}};
})();