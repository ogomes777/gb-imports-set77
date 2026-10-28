/* GB IMPORTS / V16 — GB FIT STUDIO, FIT REAL (evolui a V09; ver docs/FIT_REAL_V16.md)
 * Provador editorial: UM manequim persistente — um robô prata de proporção humana — que VESTE peças REAIS do
 * acervo GB. Cada peça é a foto frontal recortada do próprio acervo (fit-catalog.js, gerado por
 * scripts/gerar_fit_v16.py a partir de data/gb-fit-curation.json), posicionada pelas âncoras medidas no recorte:
 * superior pela linha dos ombros, inferior pelo cós. Os braços do robô saem das mangas (só a mão nos punhos das
 * longas) e as pernas saem da boca da bermuda/calça: o corpo se adapta à peça, a foto nunca é esticada nem pintada.
 * Composição editorial declarada: não é provador de caimento, não ajusta tamanho e não simula tecido.
 *
 * Contrato público (o mesmo da V09)
 *   GBFitting.set({topId,bottomId}, {changedPart:'top'|'bottom'|'both', source, from:{x,y}})
 *   GBFitting.compare(on, {top,bottom})       comparação A/B com divisor (mesma escala e pose)
 *   GBFitting.catalog                          {top:{productId:peça}, bottom:{...}} — só peças reais
 *   evento 'gb:look-change' {topId,bottomId,changedPart,source}  (disparado pelo v03.js)
 * Depende de main.js (PRODUCTS, escaped), fit-catalog.js e motion-core.js (GBMotion). Sem dependências externas.
 */
(()=>{
'use strict';
const M=window.GBMotion,CAT=window.GB_FIT_CATALOG;
if(typeof PRODUCTS==='undefined'||!CAT)return;
const NS='http://www.w3.org/2000/svg';
const byId=id=>PRODUCTS.find(p=>p.id===id);
const reduced=()=>!!(M?M.Prefs.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches);
const lite=()=>!!M?.Prefs.lite;
const r1=n=>Math.round(n*10)/10;

/* ============================== GEOMETRIA ============================== */
// Catmull-Rom → Bézier. Pontos [x,y] ou {x,y}. Fechado por padrão.
function smooth(pts,closed=true){
  const P=pts.map(p=>Array.isArray(p)?{x:p[0],y:p[1]}:p),n=P.length;
  const at=i=>closed?P[(i+n)%n]:P[Math.max(0,Math.min(n-1,i))];
  let d=`M${r1(P[0].x)} ${r1(P[0].y)}`;
  for(let i=0;i<(closed?n:n-1);i++){
    const p0=at(i-1),p1=at(i),p2=at(i+1),p3=at(i+2);
    d+=`C${r1(p1.x+(p2.x-p0.x)/6)} ${r1(p1.y+(p2.y-p0.y)/6)} ${r1(p2.x-(p3.x-p1.x)/6)} ${r1(p2.y-(p3.y-p1.y)/6)} ${r1(p2.x)} ${r1(p2.y)}`;
  }
  return closed?d+'Z':d;
}
// Cápsula afunilada entre dois pontos (membro do robô): raio ra em A, rb em B.
function capsule(ax,ay,ra,bx,by,rb){
  const dx=bx-ax,dy=by-ay,l=Math.hypot(dx,dy)||1,nx=-dy/l,ny=dx/l;
  return `M${r1(ax+nx*ra)} ${r1(ay+ny*ra)}L${r1(bx+nx*rb)} ${r1(by+ny*rb)}A${r1(rb)} ${r1(rb)} 0 0 1 ${r1(bx-nx*rb)} ${r1(by-ny*rb)}L${r1(ax-nx*ra)} ${r1(ay-ny*ra)}A${r1(ra)} ${r1(ra)} 0 0 1 ${r1(ax+nx*ra)} ${r1(ay+ny*ra)}Z`;
}
const mirror=pts=>pts.map(([x,y])=>[420-x,y]);

/* ============================== CORPO: GB UNIT (V17) — viewBox 420×1000, 8 cabeças de 111, chão em y=948 ==============================
   Robô de proporção humana e musculatura de atleta, em armadura preta (carbono) com placas amarelo GB: capacete com faixa
   central e o monograma (SVG oficial, nunca redigitado), máscara preta espelhada com olhos acesos, pescoço com cabos,
   luvas, antebraços blindados, joelheiras e caneleiras. O que aparece fora da roupa é desenhado com cuidado; o tronco
   fica sob a peça. Ombro a 1,4 cabeça, umbigo a 3, gancho a 4, joelho a 6. */
const B={cx:210,crown:58,chin:171,shoulderY:212,shL:[116,236],shR:[304,236],navel:392,waistY:430,
  hipL:[164,506],hipR:[256,506],kneeY:728,ankleY:904,floor:948,
  zones:{top:[90,176,240,340],bottom:[118,420,184,490]}};
// alvos da roupa sobre o corpo: superior pela linha dos ombros, inferior pelo cós (folga de streetwear incluída)
const FIT={top:{shoulder:232,lineY:212,kindDy:{hoodie:6,jacket:4,sweatshirt:0,longsleeve:0,tee:0,polo:0,jersey:0}},
  bottom:{waist:166,waistY:430,pantsHem:886},armTilt:19,neck:{top:29,base:38},
  kindScale:{hoodie:1,jacket:1.02,sweatshirt:1,longsleeve:.98,tee:1,polo:1,jersey:1,pants:1,shorts:1}};
const HEAD_R=[[210,58],[226,59.5],[239,65],[247.5,75],[251.5,88],[252.5,102],[251.5,114],[250,125],[247.5,136],[244,146],[239,155],[232.5,162],[224.5,167.5],[217,170.5],[210,171.5]];
const HEAD=[...HEAD_R,...mirror(HEAD_R).reverse().slice(1,-1)];
const FACE_R=[[210,93],[224,94],[236.5,98.5],[244.5,107],[246.5,118],[245,130],[241,142],[234.5,153],[226.5,161.5],[218,167],[210,169]];
const FACE=[...FACE_R,...mirror(FACE_R).reverse().slice(1,-1)];
const TORSO_R=[[210,198],[230,202],[252,210],[270,220],[280,236],[282,258],[278,290],[274,340],[270,380],[272,420],[278,460],[280,492],[272,512],[254,524],[232,530],[210,532]];
const TORSO=[...TORSO_R,...mirror(TORSO_R).reverse().slice(1,-1)];
const seam=(d,o=.45,w=1.2,c='#000')=>`<path d="${d}" fill="none" stroke="${c}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const shine=(d,o=.5,w=2.4)=>`<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const line=(d,w=1.6,o=.95)=>`<path d="${d}" fill="none" stroke="#ffd447" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const both=f=>f(-1)+f(1);
const X=(side,dx)=>210+side*dx;
const MONO='./assets/brand/gb-monograma-preto.svg',HEAD_DY=24;   // cabeça 8 abaixo do desenho base: pescoço visível de ~0,45 cabeça

// membro afunilado ao longo de uma polilinha [x,y,meia-largura], pontas arredondadas
function limb(pts){
  const Lp=[],Rp=[],n=pts.length,dir=i=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[(b[0]-a[0])/l,(b[1]-a[1])/l]};
  pts.forEach((p,i)=>{const[dx,dy]=dir(i);Lp.push([p[0]-dy*p[2],p[1]+dx*p[2]]);Rp.push([p[0]+dy*p[2],p[1]-dx*p[2]])});
  const[ex,ey]=dir(n-1),[sx,sy]=dir(0),e=pts[n-1],s=pts[0];
  return smooth([...Lp,[e[0]+ex*e[2]*.75,e[1]+ey*e[2]*.75],...Rp.reverse(),[s[0]-sx*s[2]*.6,s[1]-sy*s[2]*.6]]);
}
// placa sobre um membro: trecho [t0,t1] da polilinha, largura k da original, deslocada para o lado 'off' (-1..1)
function plate(pts,t0,t1,k,off=0){
  const L=[];for(let i=0;i<=8;i++){const t=t0+(t1-t0)*i/8,f=t*(pts.length-1),j=Math.min(pts.length-2,Math.floor(f)),u=f-j,a=pts[j],b=pts[j+1];
    const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,w=a[2]+(b[2]-a[2])*u;L.push([a[0]+dx*u-dy/l*w*off,a[1]+dy*u+dx/l*w*off,w*k])}
  return limb(L);
}
const along=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];

// cabeça = a arte do GB UNIT (skin-catalog.js), com o monograma oficial em SVG na testa e os olhos acesos.
// O grupo gira no queixo (emotes) e encolhe de lado no giro.
const SK=window.GB_SKIN?.pieces||null;
const HEAD_S=.53,HEAD_TOP=66;
const HEAD_CHIN=SK?HEAD_TOP+(SK.head.b[1]-SK.head.a[1])*HEAD_S:176;
function headSVG(pfx){
  if(!SK)return '';
  const e=SK.head,[mx0,my0]=e.mono[0],[mx1,my1]=e.mono[1];
  return `<g class="fit-head"><g transform="translate(${B.cx} ${r1(HEAD_CHIN)})"><g class="fit-jnt" data-j="head"><g class="fit-face">`+
    `<g transform="scale(${HEAD_S}) translate(${-e.b[0]} ${-e.b[1]})"><image href="${e.src}" width="${e.w}" height="${e.h}"/>`+
    `<image href="${MONO}" x="${mx0}" y="${my0}" width="${mx1-mx0}" height="${my1-my0}" preserveAspectRatio="xMidYMid meet" opacity=".9"/>`+
    e.eyes.map(([x,y])=>`<ellipse class="fit-glow" cx="${x}" cy="${y}" rx="30" ry="15" fill="url(#${pfx}-gl)"/><ellipse class="fit-glow" cx="${x}" cy="${y}" rx="13" ry="4" fill="#fff6d6" opacity=".55"/>`).join('')+
    `</g></g></g></g></g>`;
}
// pescoço por cima da peça: cobre o forro e as costas da gola e para na gola da frente (medida na foto).
// Sem medida de gola, o pescoço fica por baixo da peça (corpo).
function neckPath(c){
  const{cx,cy,a,b}=c,nb=Math.min(a*.92,FIT.neck.base),th=Math.acos(Math.min(1,nb/a)),pts=[];
  for(let i=0;i<=10;i++){const t=Math.PI-th-(Math.PI-2*th)*i/10;pts.push([cx+a*Math.cos(t),cy+b*Math.sin(t)])}
  const[lx,ly]=pts[0],[rx,ry]=pts[10],nt=FIT.neck.top;
  let d=`M${r1(cx-nt)} ${150+HEAD_DY}C${r1(cx-nt-1)} ${160+HEAD_DY} ${r1(lx+2)} ${r1(ly-24)} ${r1(lx)} ${r1(ly)}`;
  pts.slice(1).forEach(([x,y])=>{d+=`L${r1(x)} ${r1(y)}`});
  return{d:d+`C${r1(rx-2)} ${r1(ry-24)} ${r1(cx+nt+1)} ${160+HEAD_DY} ${r1(cx+nt)} ${150+HEAD_DY}Z`,ly,ry,lx,rx};
}
function neckSVG(pfx,c){
  const n=neckPath(c),{cx}=c,yb=Math.min(n.ly,n.ry);
  return `<path d="${n.d}" fill="url(#${pfx}-bk)"/>`+
    // músculos/cabos laterais em amarelo, anéis do pescoço
    // pescoço da arte: músculos laterais em carbono, tendão central amarelo e nervuras
    both(s=>seam(`M${r1(cx+s*24)} ${168+6}C${r1(cx+s*22)} ${184} ${r1(cx+s*14)} ${r1(yb-12)} ${r1(cx+s*7)} ${r1(yb-2)}`,.65,3.2,'#3a3f47'))+
    line(`M${r1(cx)} 176V${r1(yb-2)}`,2.2,.8)+
    [184,192,200].map(y=>seam(`M${r1(cx-19)} ${y}Q${r1(cx)} ${y+3} ${r1(cx+19)} ${y}`,.45,1,'#5b616b')).join('')+
    // sombra da gola da frente sobre o pescoço
    `<path d="${n.d}" fill="url(#${pfx}-ns)"/>`;
}
const NECK_BACK='M193 150L191.5 194Q174 204 150 213L270 213Q246 204 228.5 194L227 150Z';
function bodySVG(pfx){
  return `<g class="fit-body"><path d="${NECK_BACK}" fill="url(#${pfx}-bk)"/>`+
    `<path d="${smooth(TORSO)}" fill="url(#${pfx}-bk)"/>`+
    seam('M168 262Q190 284 210 280Q230 284 252 262',.6,1.2,'#5b616b')+line('M210 206V530',1.2,.5)+
  `</g>`;
}
/* ---------- ossos: cada peça da skin vai num grupo com a junta na origem; os filhos ficam na ponta ----------
   eixo local +y = do início ao fim do osso; sw = escala na largura, sl = no comprimento (a skin é o personagem, não a
   foto de produto: braços e pernas podem afinar até 28% para caber em manga e boca de perna). */
const DEG=180/Math.PI,angOf=(dx,dy)=>Math.atan2(dy,dx)*DEG;
function bone(k,sw,sl,j,kids='',cls=''){
  const e=SK[k],R=90-angOf(e.b[0]-e.a[0],e.b[1]-e.a[1]),L=e.len*sl;
  // Paz e amor: mão direita com dois dedos abertos em V, articulada no punho.
  // A luva original é ocultada apenas durante o SALVE.
  const peace=j==='wrR'? `<g class="fit-peace-sign" aria-hidden="true" transform="rotate(120) scale(.48) translate(0 -85)">
    <path d="M-16 88Q-26 78-25 60L-38 34Q-44 21-35 17Q-27 13-21 25L-13 41-18-37Q-19-53-9-55Q1-55 3-40L7 22 18-40Q21-56 31-53Q40-50 35-36L24 25 34 19Q44 10 49 20Q52 27 44 40L33 62Q32 79 20 89Z" fill="#11141a" stroke="#c39b1e" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-8 36L2 64 17 38M-12 71Q8 81 23 69" stroke="#ffd447" stroke-width="3.2" stroke-linecap="round" fill="none"/>
    <path d="M-9-36L-5 12M29-36L18 14" stroke="#fff1a8" stroke-width="3" stroke-linecap="round"/>
    </g>`: '';
  return `<g class="fit-jnt${cls?' '+cls:''}" data-j="${j}"><g class="fit-bone-art" transform="scale(${r3(sw)} ${r3(sl)}) rotate(${r1(R)}) translate(${-e.a[0]} ${-e.a[1]})"><image href="${e.src}" width="${e.w}" height="${e.h}"/></g>`+
    peace+(kids?`<g transform="translate(0 ${r1(L)})">${kids}</g>`:'')+`</g>`;
}
const r3=n=>Math.round(n*1000)/1000;
const child=(rel,inner)=>`<g transform="rotate(${r1(rel)})">${inner}</g>`;
const root=(x,y,ang,inner)=>`<g transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(ang-90)})">${inner}</g>`;
const sideK=(side,k)=>k+(side<0?'L':'R');
// largura da peça no ponto t do eixo (0–1), em px da arte
const widAt=(k,t)=>{const w=SK[k].wid,f=Math.max(0,Math.min(1,t))*10,i=Math.min(9,Math.floor(f));return w[i]+(w[i+1]-w[i])*(f-i)};
// mão de manga longa: a luva sai de dentro do punho, na direção da manga
function cuffHand(side,x,y,dx,dy,cuffW){
  const s=Math.max(.32,Math.min(.43,cuffW*1.30/widAt('haL',.05)));
  return `<g class="fit-arm" data-side="${side}">`+root(x-dx*13,y-dy*13,angOf(dx,dy)+side*-4,bone(sideK(side,'ha'),s,s,sideK(side,'wr'),'','fit-hand'))+`</g>`;
}
// braço que sai da manga curta: ombro dentro da manga, cotovelo na altura do umbigo, antebraço e luva da arte.
// A raiz gira no pivô da manga (o mesmo ponto em que a manga gira), para os emotes moverem manga e braço juntos.
function shortArm(sp){
  const{side,O,n,piv}=sp,sw=Math.max(.40,Math.min(.55,sp.ow*.84/widAt('upL',.8))),sl=Math.max(sw,.49);
  const k=sideK(side,'up'),tE=Math.max(26,(388-O[1])/Math.max(.5,n[1])),E=[O[0]+n[0]*tE,O[1]+n[1]*tE];
  const Lup=SK[k].len*sl,A=[E[0]-n[0]*Lup,E[1]-n[1]*Lup],a1=angOf(n[0],n[1]),a2=90+(a1-90)*.92,a3=a2+side*7;
  const hand=bone(sideK(side,'ha'),sw*1.05,sw*1.05,sideK(side,'wr'),'','fit-hand');
  const fore=bone(sideK(side,'fo'),sw,sl,sideK(side,'el'),child(a3-a2,hand));
  const upper=bone(k,sw,sl,sideK(side,'up'),child(a2-a1,fore));
  return `<g class="fit-arm" data-side="${side}"><g transform="translate(${r1(piv[0])} ${r1(piv[1])})"><g class="fit-jnt" data-j="${sideK(side,'sh')}"><g transform="translate(${r1(-piv[0])} ${r1(-piv[1])})">`+
    `<ellipse cx="${r1(O[0])}" cy="${r1(O[1])}" rx="${r1(sp.ow*.5)}" ry="${r1(sp.ow*.2)}" transform="rotate(${r1(a1-90)} ${r1(O[0])} ${r1(O[1])})" fill="#000" opacity=".55"/>`+
    root(A[0],A[1],a1,upper)+`</g></g></g></g>`;
}
/* ============================== PEÇAS REAIS ============================== */
// posição da foto no corpo (em unidades do viewBox) a partir das âncoras medidas no recorte
// comprimento normalizado: a barra cai numa faixa do quadril (camisa curta demais cresce, longa demais encolhe, até ±10%)
const HEM={short:[508,542],long:[496,532]};
function placeTop(e){
  let k=(FIT.kindScale[e.kind]||1)*(e.scale||1),Wb=FIT.top.shoulder*k/e.sh.w,Hb=Wb*e.h/e.w;
  const lineY=FIT.top.lineY+(FIT.top.kindDy[e.kind]||0),run=(e.hem-e.sh.y)*Hb,[h0,h1]=HEM[e.rig||e.kind==='tee'||e.kind==='polo'||e.kind==='jersey'?'short':'long'];
  const want=Math.max(h0,Math.min(h1,lineY+run)),f=Math.max(.9,Math.min(1.12,(want-lineY)/run));
  if(f!==1&&!e.scale){k*=f;Wb*=f;Hb*=f}
  return{x:B.cx-e.cx*Wb+(e.dx||0),y:FIT.top.lineY+(FIT.top.kindDy[e.kind]||0)-e.sh.y*Hb+(e.dy||0),w:Wb,h:Hb};
}
function placeBottom(e){
  const ww=e.waist.r-e.waist.l,leg=Math.max(...e.legs.map(l=>l.y))-e.waist.y;
  let Wb=FIT.bottom.waist*(FIT.kindScale[e.kind]||1)*(e.scale||1)/ww;
  // calça: a barra cai no tornozelo (o cós segue entre 168 e 206 de largura)
  if(e.kind==='pants'){const want=(FIT.bottom.pantsHem-FIT.bottom.waistY)/(leg*e.h/e.w);Wb=Math.max(168/ww,Math.min(206/ww,want))}
  const Hb=Wb*e.h/e.w,dy=e.kind==='shorts'?7:0;
  return{x:B.cx-(e.waist.l+ww/2)*Wb+(e.dx||0),y:FIT.bottom.waistY+dy-e.waist.y*Hb+(e.dy||0),w:Wb,h:Hb};
}
const P=(pl,x,y)=>[pl.x+x*pl.w,pl.y+y*pl.h];
const rot=(p,c,deg)=>{const a=deg*Math.PI/180,dx=p[0]-c[0],dy=p[1]-c[1];return[c[0]+dx*Math.cos(a)-dy*Math.sin(a),c[1]+dx*Math.sin(a)+dy*Math.cos(a)]};
// gola medida → elipse no corpo
function collarOf(e,pl){
  const c=e.collar;if(!c)return null;
  const[cx,yb]=P(pl,c.x,c.yb),yf=P(pl,c.x,c.yf)[1];
  return{cx,cy:(yb+yf)/2,a:Math.max(14,c.w*pl.w),b:Math.max(6,(yf-yb)/2)};
}
// mangas curtas: cada manga (camada recortada da própria foto) desce no ombro até o ângulo do braço
function sleevePose(e,pl){
  const out={};
  for(const k of['l','r']){const s=e.rig?.[k];if(!s)continue;
    const side=k==='l'?-1:1,a0=Math.atan2(s.nx,s.ny)*180/Math.PI,aT=side*FIT.armTilt;
    const th=side<0?Math.max(-24,Math.min(0,a0-aT)):Math.min(24,Math.max(0,a0-aT));
    const piv=P(pl,s.px,s.py),O=rot(P(pl,s.ox,s.oy),piv,th),a=(a0-th)*Math.PI/180;
    // abertura medida torta num lado (dobra/sombra): vale a do outro lado, se maior
    const other=e.rig?.[k==='l'?'r':'l'],ow=Math.max(s.ow,other&&s.ow<other.ow*.7?other.ow:0)*pl.w;
    out[k]={side,th,piv,O,n:[Math.sin(a),Math.cos(a)],ow,box:{x:pl.x+s.x*pl.w,y:pl.y+s.y*pl.h,w:s.w*pl.w,h:s.h*pl.h},src:s.src};
  }
  return out;
}

/* V1.2: manga longa com fonte real única, separada por máscaras suaves em ombro/cotovelo.
   Toda a cor e estampa vêm do mesmo produto; punho e mão acompanham a articulação. */
/* V1.4: mangas da foto são uma peça contínua. O algoritmo antigo desenhava
   a manga em dois clips (bíceps e antebraço) e gerava uma costura falsa no
   cotovelo. Usamos a mesma fotografia UMA vez por manga. A mão acompanha
   o punho. O gesto nunca torce/parte a estampa no cotovelo. */
function articulatedLongSleeves(e,pl,pfx,pid){
  const defs=[],parts=[];
  const safe=v=>r1(v),pt=(x,y)=>P(pl,x,y);
  const capsule=(a,b,wa,wb)=>{
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,nx=dy/len,ny=-dx/len;
    return 'M'+safe(a[0]+nx*wa)+' '+safe(a[1]+ny*wa)+
      'L'+safe(b[0]+nx*wb)+' '+safe(b[1]+ny*wb)+
      'Q'+safe(b[0]+dx/len*7)+' '+safe(b[1]+dy/len*7)+' '+safe(b[0]-nx*wb)+' '+safe(b[1]-ny*wb)+
      'L'+safe(a[0]-nx*wa)+' '+safe(a[1]-ny*wa)+'Z';
  };
  for(const k of ['l','r']){
    const side=k==='l'?-1:1,s=e.sleeves[k];
    const shoulder=pt(e.cx+side*e.sh.w*.47,e.sh.y+.013),
      cuff=pt(s.x,s.y-.018),
      elbow=[shoulder[0]+(cuff[0]-shoulder[0])*.57+side*9,
             shoulder[1]+(cuff[1]-shoulder[1])*.57];
    // Os dois contornos compõem um único clip e UMA imagem, sem cortes no cotovelo.
    const id=pfx+'-ls-'+pid+'-'+k+'-whole',
      w0=Math.min(59,pl.w*.145),mid=Math.min(52,pl.w*.124),
      wc=Math.max(22,s.w*pl.w*.88);
    defs.push('<clipPath id="'+id+'"><path d="'+capsule(shoulder,elbow,w0,mid)+'"/>'+
      '<path d="'+capsule(elbow,cuff,mid+5,wc)+'"/></clipPath>');
    const art=photo(e.src,pl.x,pl.y,pl.w,pl.h,' clip-path="url(#'+id+')"');
    const hand=cuffHand(side,...pt(s.x,s.y),s.dx,s.dy,s.w*pl.w);
    parts.push('<g class="fit-long-arm fit-long-arm-single" data-side="'+side+'">'+
      '<g transform="translate('+safe(shoulder[0])+' '+safe(shoulder[1])+')">'+
      '<g class="fit-jnt" data-j="sh'+(side<0?'L':'R')+'">'+
      '<g transform="translate('+safe(-shoulder[0])+' '+safe(-shoulder[1])+')">'+art+
      '<g transform="translate('+safe(cuff[0])+' '+safe(cuff[1])+')">'+
      '<g class="fit-jnt" data-j="el'+(side<0?'L':'R')+'">'+
      '<g transform="translate('+safe(-cuff[0])+' '+safe(-cuff[1])+')">'+
      hand+'</g></g></g></g></g></g></g>');
  }
  const l=pt(e.cx-e.sh.w*.50,e.sh.y),r=pt(e.cx+e.sh.w*.50,e.sh.y),
    hemL=pt(e.cx-e.hemw*.50,e.hem),hemR=pt(e.cx+e.hemw*.50,e.hem),
    torsoId=pfx+'-ls-'+pid+'-body';
  // Transição contínua do ombro para o torso; a gola/capuz permanece inteiro.
  const contour='M0 0H420V'+safe(r[1]+13)+'H'+safe(r[0]+14)+
    'Q'+safe(r[0]-12)+' '+safe(r[1]+92)+' '+safe(hemR[0])+' '+safe(hemR[1]+5)+
    'H'+safe(hemL[0])+'Q'+safe(l[0]+12)+' '+safe(l[1]+92)+' '+safe(l[0]-14)+' '+safe(l[1]+13)+'H0Z';
  defs.push('<clipPath id="'+torsoId+'"><path d="'+contour+'"/></clipPath>');
  return{defs:'<defs>'+defs.join('')+'</defs>',torsoId,sleeves:parts.join('')};
}

const isLongSleeve=e=>!!e&&!e.rig&&e.sleeves?.l?.type==='long'&&e.sleeves?.r?.type==='long';
function armsSVG(e,pl,pfx,sp){
  const out=[];
  if(e.rig){for(const k of['l','r'])if(sp[k])out.push(shortArm(sp[k]))}
  else for(const side of[-1,1]){
    const s=e.sleeves?.[side<0?'l':'r'];if(!s||s.type!=='long')continue;
    const[cx,cy]=P(pl,s.x,s.y);out.push(cuffHand(side,cx,cy,s.dx,s.dy,s.w*pl.w));
  }
  return out.join('');
}
// pernas da arte: coxa → canela (joelheira) → bota; IK de dois ossos do quadril até o tornozelo-alvo
// (boca do tênis, barra da calça ou chão da bota). A coxa afina para caber na boca da bermuda.
const HIP={dx:54,y:500};
function legSpec(e,pl){
  const ww=(e.waist.r-e.waist.l)*pl.w,open=e.legs.slice(0,2).map(l=>{const[x,y]=P(pl,l.x,l.y);return{x,y,hw:l.w*pl.w/2}});
  const ok=open.length===2&&open[0].x<B.cx&&open[1].x>B.cx&&open[1].x-open[0].x>ww*.25&&open.every(o=>o.hw>ww*.12&&o.hw<ww*.42);
  if(e.kind==='pants'){const sep=ok?Math.max(40,Math.min(66,(open[1].x-open[0].x)/2)):52;return{pants:true,sep,openW:null}}
  // bermuda: boca medida quando confiável; senão, proporção do cós
  const hw=ok?Math.min(...open.map(o=>o.hw)):ww*.27,y=Math.max(...open.map(o=>o.y));
  return{pants:false,sep:50,openW:hw*2,openY:y};
}
function legsSVG(pfx,spec){
  return[-1,1].map((side,i)=>{
    const H=[X(side,HIP.dx),HIP.y],T=spec.ank[i],D=Math.hypot(T[0]-H[0],T[1]-H[1]);
    const kt=sideK(side,'th'),ks=sideK(side,'shin'),kb=sideK(side,'boot');
    const lenS=Math.max(.5,Math.min(.74,D/((SK[kt].len+SK[ks].len)*.995)));
    // largura: a coxa no nível da barra da bermuda cabe na boca (92%); a perna toda segue essa largura
    // Fotos de bermudas variam; a anatomia do GB UNIT não deve mudar de espessura a cada peça.
    const sw=spec.pants?.54:.555;
    const Lt=SK[kt].len*lenS,Ls=SK[ks].len*lenS,base=angOf(T[0]-H[0],T[1]-H[1]);
    const cosA=Math.max(-1,Math.min(1,(Lt*Lt+D*D-Ls*Ls)/(2*Lt*D))),bend=Math.acos(cosA)*DEG;
    // o joelho dobra para fora (lado do corpo)
    const aT=base+side*-bend*.64,K=[H[0]+Math.cos(aT/DEG)*Lt,H[1]+Math.sin(aT/DEG)*Lt],aS=angOf(T[0]-K[0],T[1]-K[1]);
    const bs=Math.max(.44,Math.min(.58,sw));
    const boot=spec.boots===false?'':child(90-aS,bone(kb,bs,bs,sideK(side,'an')));
    const shin=bone(ks,sw,lenS,sideK(side,'kn'),boot);
    return `<g class="fit-leg" data-side="${side}">`+root(H[0],H[1],aT,bone(kt,sw,lenS,sideK(side,'hip'),child(aS-aT,shin)))+`</g>`;
  }).join('');
}
/* ============================== GIRO (jogo): esquerda · frente · direita ==============================
   Pseudo-3D só com transform: o corpo estreita, o rosto e o boné viram, o braço do lado de trás recua e os tênis
   giram no tornozelo. De frente, cada pé aponta para fora (em V) e encurta como num 3/4. O par de tênis é simétrico:
   o pé que aponta para o lado oposto ao da foto é o mesmo recorte espelhado (é como o outro pé do par se vê). */
let yaw=0,yawDir='F';
const dirOf=y=>y<-.4?'L':y>.4?'R':'F';
// escala horizontal de cada pé para a direção pedida (1 = como na foto; -1 = virado; ±.64 = de frente, em V)
function applyFeet(g,dir){
  const toe=g.dataset.toe,flip=want=>want===toe?1:-1;
  const sc={L:[flip('L')*.98,flip('L')*.98],R:[flip('R')*.98,flip('R')*.98],F:[flip('L')*.91,flip('R')*.91]}[dir];
  g.style.setProperty('--fl',sc[0]);g.style.setProperty('--fr',sc[1]);
  // o pé mais perto de quem olha vai por cima (pés para a direita: o da esquerda está na frente)
  const near=g.querySelector(`.fit-foot[data-side="${dir==='R'?-1:1}"]`);if(near&&near!==g.lastElementChild)g.appendChild(near);
}
function applyYaw(root,y){
  const a=Math.abs(y);root.style.setProperty('--yaw',y.toFixed(3));root.style.setProperty('--yawa',a.toFixed(3));
  // braço do lado de trás (oposto ao giro) recua para trás do tronco
  root.style.setProperty('--armL',(y<0?-y*10:0).toFixed(2)+'px');root.style.setProperty('--armR',(y>0?-y*10:0).toFixed(2)+'px');
  const d=dirOf(y);if(root===fig){yaw=y;yawDir=d}if(root.dataset.dir!==d){root.dataset.dir=d;root.querySelectorAll('.fit-shoe').forEach(g=>applyFeet(g,d))}
}

// tênis: o pé real do acervo nos dois pés; a sola pisa o chão e a canela entra na boca
const SHOE={len:164,sep:50};
function shoePlace(e,sep=SHOE.sep){
  const Wu=SHOE.len,Hu=Wu*e.h/e.w,y=B.floor+1-Hu;
  return[-1,1].map(side=>{const ax=X(side,SHOE.sep),dx=side*(sep-SHOE.sep);return{side,x:ax-e.collar.x*Wu,y,w:Wu,h:Hu,ank:[ax+dx,y+e.collar.y*Hu+4]}});
}
// boné: a copa (marcada na foto) assenta no capacete, base na altura da testa
// boné: a copa (marcada na foto) assenta no capacete; a aba nunca desce além do topo dos olhos (o rosto fica à vista)
const CAP={w:106,cx:210};
const EYE_TOP=SK?HEAD_TOP+(SK.head.eyes[0][1]-SK.head.a[1]-10)*HEAD_S:120;
function capPlace(e){
  const c=e.crown,Wc=CAP.w/(c.x1-c.x0),Hc=Wc*e.h/e.w;
  const base=Math.min(HEAD_TOP+36,EYE_TOP-2-(1-c.yb)*Hc*.82);
  return{x:CAP.cx-(c.x0+c.x1)/2*Wc,y:base-c.yb*Hc,w:Wc,h:Hc};
}
const photo=(src,x,y,w,h,extra='')=>`<image class="fit-photo" href="${src}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" preserveAspectRatio="none"${extra}/>`;
const mkG=(cls,id)=>{const g=document.createElementNS(NS,'g');g.setAttribute('class',cls);if(id)g.dataset.product=id;return g};
// pernas = inferior (boca da bermuda / barra da calça) + tênis (boca do tênis); sem tênis, a bota GB do robô
function legsGroup(pfx,bot,shoeE,root){
  const spec=bot?legSpec(bot.e,bot.pl):{pants:false,sep:50,openW:null};
  // os tênis acompanham as pernas da calça; sem tênis, a bota da arte pisa o chão
  const sep=spec.pants?spec.sep:SHOE.sep;
  if(shoeE){spec.ank=shoePlace(shoeE,sep).map(s=>s.ank);spec.boots=false}
  else{const s0=SK?Math.max(.5,.6):.6,drop=SK?(SK.bootL.h-SK.bootL.a[1])*.6:100;spec.ank=[[X(-1,sep),B.floor-drop+2],[X(1,sep),B.floor-drop+2]]}
  root?.style.setProperty('--shoeDx',(sep-SHOE.sep).toFixed(1)+'px');
  const g=mkG('fit-legs');g.dataset.bottom=bot?.id||'';g.dataset.shoe=shoeE?.id||'';
  // Sombras de contato sob as bocas da bermuda evitam frestas artificiais entre tecido e pele.
  const seams=!spec.pants&&spec.openW?[-1,1].map(side=>`<ellipse cx="${r1(X(side,HIP.dx))}" cy="${r1(spec.openY+5)}" rx="${r1(Math.min(38,spec.openW*.40))}" ry="9" fill="#08090a" opacity=".38"/>`).join(''):'';
  g.dataset.pants=spec.pants?'true':'false';
  // A roupa de calça esconde a skin: evita canela/amarelo vazando em bainhas estreitas.
  g.innerHTML=seams+(spec.pants&&shoeE?'':legsSVG(pfx,spec));return g;
}
// uma peça vira camadas: base (foto/torso) e corpo exposto (braços, pescoço) e, no superior, mangas por cima dos braços
function garmentParts(part,p,pfx){
  const e=CAT[part][p.id],out={soft:[]};
  if(part==='shoe'){const g=mkG('fit-garment fit-shoe',p.id),pl=shoePlace(e);g.dataset.toe=e.toe;
    // cada pé gira no tornozelo (vira para a esquerda, para a direita ou fica de frente, em V); a sombra acompanha
    g.innerHTML=pl.map(s=>`<g class="fit-foot" data-side="${s.side}" style="transform-origin:${r1(s.ank[0])}px ${r1(s.ank[1])}px"><g class="fit-foot-flip" style="transform-origin:${r1(s.ank[0])}px ${r1(s.ank[1])}px">`+
      `<ellipse cx="${r1(s.ank[0]-(e.toe==='L'?1:-1)*s.w*.3)}" cy="${B.floor}" rx="${r1(s.w*.5)}" ry="7" fill="url(#${pfx}-drop)"/>`+photo(e.src,s.x,s.y,s.w,s.h)+`</g></g>`).join('');
    applyFeet(g,yawDir);g.style.transformOrigin='210px 920px';out.base=g;return out}
  if(part==='cap'){const g=mkG('fit-garment fit-cap',p.id),c=capPlace(e);g.innerHTML=photo(e.src,c.x,c.y,c.w,c.h);g.style.transformOrigin='214px 90px';out.base=g;return out}
  const pl=part==='top'?placeTop(e):placeBottom(e);
  const g=mkG(`fit-garment fit-${part}`,p.id);g.dataset.kind=e.kind;out.base=g;out.e=e;out.pl=pl;
  if(part==='top'){
    const[hx,hy]=P(pl,e.cx,e.hem),sp=sleevePose(e,pl),c=collarOf(e,pl),limbs=mkG('fit-limbs fit-limbs-top',p.id);
    const longRig=isLongSleeve(e)?articulatedLongSleeves(e,pl,pfx,p.id):null;
    // sombra de contato da barra sobre a peça de baixo: a camisa cai por cima, não "flutua" sobre a calça
    g.innerHTML=`<ellipse cx="${r1(hx)}" cy="${r1(hy+4)}" rx="${r1(e.hemw*pl.w*.53)}" ry="17" fill="url(#${pfx}-drop)"/><ellipse cx="${r1(hx)}" cy="${r1(hy+1)}" rx="${r1(e.hemw*pl.w*.47)}" ry="6" fill="url(#${pfx}-drop)"/>`+(e.hood?hoodHideMask(e,pl,pfx,p.id):'')+
      (()=>{
      const hemY=pl.y+e.hem*pl.h,hemHalf=Math.max(75,e.hemw*pl.w*.48),cx=pl.x+e.cx*pl.w;
      const upper=Math.min(hemY-28,Math.max(260,hemY-135)),id=`${pfx}-waist-${p.id}`;
      const taper=(e.kind==='tee'||e.kind==='polo'||e.kind==='jersey')?.91:.965;
      const mask=`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse">
        <path d="M0 0H420V${r1(upper)}H${r1(cx+hemHalf*1.17)}
        Q${r1(cx+hemHalf*1.08)} ${r1(upper+58)} ${r1(cx+hemHalf*taper)} ${r1(hemY-5)}
        V${r1(hemY+14)}H${r1(cx-hemHalf*taper)}V${r1(hemY-5)}
        Q${r1(cx-hemHalf*1.08)} ${r1(upper+58)} ${r1(cx-hemHalf*1.17)} ${r1(upper)}H0Z"/>
        </clipPath></defs>`;
      const src=e.rig?e.rig.torso:e.src;
      const hoodAttr=e.hood?` mask="url(#${pfx}-hd-${p.id}-t)"`:'';
      if(!longRig){
        // Camisetas usam modelagem leve na cintura; não alterar essa categoria.
        return mask+photo(src,pl.x,pl.y,pl.w,pl.h,` clip-path="url(#${id})"`+hoodAttr);
      }
      // CRITICAL: NÃO aplicar clip de cintura sobre o hoodie inteiro. O path
      // convergia na cintura mas era aplicado à foto COMPLETA, incluindo mangas.
      // Por isso amputava o tecido na altura do cotovelo, mesmo em repouso.
      // A fotografia original já tem transparência/silhueta correta; respeitá-la.
      return longRig.defs+
        `<g class="fit-long-rest">`+photo(src,pl.x,pl.y,pl.w,pl.h,hoodAttr)+`</g>`+
        `<g class="fit-long-action" clip-path="url(#${longRig.torsoId})">`+
          photo(src,pl.x,pl.y,pl.w,pl.h,hoodAttr)+`</g>`;
    })();
    limbs.innerHTML=armsSVG(e,pl,pfx,sp);out.limbs=limbs;out.soft.push(limbs);
    if(longRig){const sl=mkG('fit-sleeves fit-articulated-longsleeves',p.id);sl.innerHTML=longRig.sleeves;out.sleeves=sl;out.soft.push(sl)}
    if(e.rig){const sl=mkG('fit-sleeves',p.id);
      // a manga gira no mesmo pivô do ombro do braço (emotes movem os dois juntos)
      sl.innerHTML=Object.values(sp).map(s=>`<g class="fit-arm" data-side="${s.side}"><g transform="translate(${r1(s.piv[0])} ${r1(s.piv[1])})"><g class="fit-jnt" data-j="${sideK(s.side,'sh')}"><g transform="translate(${r1(-s.piv[0])} ${r1(-s.piv[1])})">`+
        photo(s.src,s.box.x,s.box.y,s.box.w,s.box.h,` transform="rotate(${r1(s.th)} ${r1(s.piv[0])} ${r1(s.piv[1])})"`)+`</g></g></g></g>`).join('');
      out.sleeves=sl}
    if(c){const nk=mkG('fit-neck',p.id);nk.innerHTML=neckSVG(pfx,c);out.neck=nk;out.soft.push(nk)}
    if(e.hood){const hd=hoodParts(e,pl,pfx,p.id);out.hoodBack=hd.back;out.hood=hd.front}
    g.style.transformOrigin='210px 220px';
  }else{
    // Barra curta no tornozelo: foto real recortada, sem deformação da textura.
    // A calça é UMA peça inteira: preservar a silhueta, textura e o afunilamento
    // reais do PNG/WebP. O clip trapezoidal antigo cortava a foto no joelho e
    // fabricava o efeito de bermuda por cima de canelas estreitas.
    g.innerHTML=photo(e.src,pl.x,pl.y,pl.w,pl.h);
    g.style.transformOrigin='210px 480px';
  }
  return out;
}
// capuz na cabeça: o próprio capuz da foto, levantado por inteiro (escala única) até a abertura emoldurar o rosto.
// Atrás da cabeça vai o capuz inteiro (o forro escuro aparece em volta do capacete); na frente, o mesmo capuz com a
// abertura vazada (borda suave), para a cabeça ficar DENTRO dele. A base some aos poucos sobre os ombros.
const HOOD={open:95,top:HEAD_TOP+1};
// com o capuz na cabeça, a parte de cima do capuz deitado na foto some (fica só a gola que desce aos ombros)
function hoodHideMask(e,pl,pfx,pid){
  const h=e.hood,ox0=pl.x+h.x0*pl.w,ox1=pl.x+h.x1*pl.w,ot=pl.y+h.top*pl.h,ob=pl.y+h.bottom*pl.h,id=`${pfx}-hd-${pid}-t`;
  return `<defs><radialGradient id="${id}-g"><stop offset="0" stop-color="#000"/><stop offset=".86" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>`+
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="420" height="1000"><rect width="420" height="1000" fill="#fff"/>`+
    `<ellipse class="fit-hood-hide" cx="${r1((ox0+ox1)/2)}" cy="${r1(ot-(ob-ot)*.1)}" rx="${r1((ox1-ox0)*1.05)}" ry="${r1((ob-ot)*1.05)}" fill="url(#${id}-g)"/></mask></defs>`;
}
function hoodParts(e,pl,pfx,pid){
  // Um único recorte da foto para o tecido do capuz. Todas as máscaras são calculadas
  // nas coordenadas FINAIS do palco; a V19 misturava origem da foto e do SVG e duplicava
  // o capuz inteiro em cima do rosto.
  const h=e.hood,ox0=pl.x+h.x0*pl.w,ox1=pl.x+h.x1*pl.w,ot=pl.y+h.top*pl.h;
  const ow=Math.max(1,ox1-ox0),k=Math.max(.83,Math.min(1.25,HOOD.open/ow));
  const tx=B.cx-k*(ox0+ox1)/2,ty=HOOD.top-k*ot,id=`${pfx}-hood-${pid}`;
  const cx=B.cx,cy=HEAD_TOP+69,rx=61,ry=78,ix=53,iy=70;
  const img=`<g transform="translate(${r1(tx)} ${r1(ty)}) scale(${r3(k)})">${photo(e.src,pl.x,pl.y,pl.w,pl.h)}</g>`;
  const outer=`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`;
  const back=mkG('fit-hoodpart fit-hood-back',pid);
  back.innerHTML=`<defs><clipPath id="${id}-back">${outer}</clipPath></defs>`+
    `<ellipse cx="${cx}" cy="${cy+9}" rx="${rx+6}" ry="${ry+4}" fill="url(#${pfx}-hs)" opacity=".9"/>`+
    `<g clip-path="url(#${id}-back)">${img}</g>`;
  const front=mkG('fit-hoodpart fit-hood-front',pid);
  front.innerHTML=`<defs><mask id="${id}-rim" maskUnits="userSpaceOnUse" x="125" y="42" width="170" height="196">`+
    `<rect x="125" y="42" width="170" height="196" fill="#000"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff"/>`+
    `<ellipse cx="${cx}" cy="${cy+3}" rx="${ix}" ry="${iy}" fill="#000"/></mask></defs>`+
    `<g mask="url(#${id}-rim)">${img}</g>`;
  return{back,front};
}
const srcsOf=e=>e.rig?[e.rig.torso,e.rig.l?.src,e.rig.r?.src].filter(Boolean):[e.src];

function defsSVG(pfx){
  return `<defs>
  <linearGradient id="${pfx}-yl" x1="0" x2="1"><stop offset="0" stop-color="#5e470a"/><stop offset=".14" stop-color="#b48a16"/><stop offset=".38" stop-color="#ffd447"/><stop offset=".5" stop-color="#fff2b2"/><stop offset=".62" stop-color="#ffd447"/><stop offset=".86" stop-color="#a47c12"/><stop offset="1" stop-color="#4e3b08"/></linearGradient>
  <radialGradient id="${pfx}-yh" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#fff6c8"/><stop offset=".3" stop-color="#ffd447"/><stop offset=".74" stop-color="#c2981c"/><stop offset="1" stop-color="#5e470a"/></radialGradient>
  <linearGradient id="${pfx}-bk" x1="0" x2="1"><stop offset="0" stop-color="#030304"/><stop offset=".22" stop-color="#16181b"/><stop offset=".42" stop-color="#3a3f47"/><stop offset=".5" stop-color="#565c66"/><stop offset=".6" stop-color="#2a2e34"/><stop offset=".85" stop-color="#0f1012"/><stop offset="1" stop-color="#030304"/></linearGradient>
  <radialGradient id="${pfx}-bh" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#6c737d"/><stop offset=".35" stop-color="#2c3036"/><stop offset=".8" stop-color="#0e0f11"/><stop offset="1" stop-color="#040405"/></radialGradient>
  <linearGradient id="${pfx}-fc" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#5d646e"/><stop offset=".2" stop-color="#1b1e23"/><stop offset=".55" stop-color="#040405"/><stop offset=".82" stop-color="#0e0f12"/><stop offset="1" stop-color="#2c3037"/></linearGradient>
  <linearGradient id="${pfx}-ey" x1="0" x2="1"><stop offset="0" stop-color="#ffd447"/><stop offset=".5" stop-color="#fff8d6"/><stop offset="1" stop-color="#ffd447"/></linearGradient>
  <radialGradient id="${pfx}-gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd447" stop-opacity=".7"/><stop offset=".5" stop-color="#ffd447" stop-opacity=".18"/><stop offset="1" stop-color="#ffd447" stop-opacity="0"/></radialGradient>
  <linearGradient id="${pfx}-ns" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".12" stop-color="#000" stop-opacity="0"/></linearGradient>
  <linearGradient id="${pfx}-sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd447" stop-opacity="0"/><stop offset=".5" stop-color="#ffd447" stop-opacity=".32"/><stop offset="1" stop-color="#ffd447" stop-opacity="0"/></linearGradient>
  <radialGradient id="${pfx}-hs" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0b0c0e" stop-opacity=".95"/><stop offset=".7" stop-color="#0b0c0e" stop-opacity=".85"/><stop offset="1" stop-color="#0b0c0e" stop-opacity="0"/></radialGradient>
  <radialGradient id="${pfx}-drop" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="${pfx}-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".6" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>`;
}
// hélice de DNA (duas fitas + degraus) que varre a área vestida; o desenho é fixo, só o transform anda
const HELIX=(()=>{const P=46,A=13,x0=-16,x1=436,pt=(x,ph)=>`${r1(x)} ${r1(A*Math.sin((x/P)*2*Math.PI+ph))}`;
  let a='',b='',r='';for(let x=x0;x<=x1;x+=4){a+=(x===x0?'M':'L')+pt(x,0);b+=(x===x0?'M':'L')+pt(x,Math.PI)}
  for(let x=x0+P/8;x<=x1;x+=P/4){const y=A*Math.sin((x/P)*2*Math.PI);r+=`M${r1(x)} ${r1(y)}V${r1(-y)}`}
  return `<path d="${r}" stroke="#ffd447" stroke-opacity=".55" stroke-width="1.6"/><path d="${a}" fill="none" stroke="#ffd447" stroke-width="2.4"/><path d="${b}" fill="none" stroke="#fff3c4" stroke-opacity=".9" stroke-width="1.8"/>`})();
function figureSVG(pfx,label){
  return `<svg class="fit-svg" viewBox="0 0 420 1000" role="img" aria-label="${label}" focusable="false">${defsSVG(pfx)}
  <ellipse class="fit-floor" cx="210" cy="${B.floor}" rx="130" ry="15" fill="url(#${pfx}-floor)"/>
  <g class="fit-yaw"><g class="fit-emote"><g class="fit-rig">${bodySVG(pfx)}<g class="fit-layer fit-layer-legs"></g><g class="fit-layer fit-layer-bottom"></g><g class="fit-layer fit-layer-shoe"></g><g class="fit-layer fit-layer-arms"></g><g class="fit-layer fit-layer-top"></g><g class="fit-layer fit-layer-sleeves"></g><g class="fit-layer fit-layer-neck"></g><g class="fit-layer fit-layer-hoodback"></g>${headSVG(pfx)}<g class="fit-layer fit-layer-hood"></g><g class="fit-layer fit-layer-cap"></g></g></g></g>
  <g class="fit-scan" aria-hidden="true"><rect x="30" y="-22" width="360" height="44" fill="url(#${pfx}-sc)"/><g class="fit-helix">${HELIX}</g></g></svg>`;
}
// coloca as camadas de uma peça na figura
function placeParts(root,part,o){
  const q=n=>root.querySelector('.fit-layer-'+n);
  q(part).appendChild(o.base);if(o.limbs)q('arms').appendChild(o.limbs);if(o.sleeves)q('sleeves').appendChild(o.sleeves);if(o.neck)q('neck').appendChild(o.neck);
  if(o.hood){q('hoodback').appendChild(o.hoodBack);q('hood').appendChild(o.hood)}
  return[o.base,o.limbs,o.sleeves,o.neck,o.hoodBack,o.hood].filter(Boolean);
}

/* ============================== MÍDIA: troca só com a foto pronta ============================== */
const ready=new Map(),keep=new Map();   // keep: a imagem pré-carregada fica viva até decodificar (sem requisição abortada)
function preload(part,id){
  const e=CAT[part]?.[id];if(!e)return Promise.resolve();
  return Promise.all(srcsOf(e).map(src=>{
    if(!ready.has(src)){const im=new Image();im.decoding='async';im.src=src;keep.set(src,im);ready.set(src,(im.decode?im.decode():new Promise(r=>{im.onload=im.onerror=r})).catch(()=>{}))}
    return ready.get(src)}));
}

/* ============================== MOTOR DE TROCA ============================== */
const PARTS=['top','bottom','shoe','cap'],KEY={top:'topId',bottom:'bottomId',shoe:'shoeId',cap:'capId'};
const LABEL={top:'SUPERIOR',bottom:'INFERIOR',shoe:'TÊNIS',cap:'BONÉ'};
let stage=null,fig=null,figB=null,state={topId:null,bottomId:null,shoeId:null,capId:null,hood:false},pending=null,flushQueued=false,rev=0,tagTimer=0,gen=0;
// cada parte em cena: id + camadas (foto, membros, mangas) + medidas; as que estão saindo; animações vivas
const live=Object.fromEntries([...PARTS,'legs'].map(k=>[k,{cur:null,anims:[],leaving:[]}]));
const curId=part=>live[part].cur?.id??null;
function entryVector(opts,part){
  if(opts.thrown)return[0,-10];
  if(part==='cap')return[0,-110];
  if(part==='shoe')return[0,70];
  if(opts.from&&fig){const r=fig.getBoundingClientRect(),sx=420/r.width;const dx=(opts.from.x-(r.left+r.width/2))*sx,dy=(opts.from.y-(r.top+r.height*.4))*sx;return[Math.max(-140,Math.min(140,dx*.5)),Math.max(-120,Math.min(160,dy*.5))]}
  if(opts.dir)return[opts.dir*70,-12];
  return innerWidth<781?[0,90]:[84,-18]; // seletores à direita no desktop, abaixo no mobile
}
const DUR={top:760,bottom:780,shoe:700,cap:700};
// feixe de varredura: atravessa a faixa do corpo da peça que acabou de vestir (só transform/opacity)
const SCAN={top:[190,560],bottom:[420,900],shoe:[860,950],cap:[50,130],boot:[60,940]};
let scanAnim=null;
let helixAnim=null;
function scan(part,delay=0){
  const el=fig?.querySelector('.fit-scan'),hx=el?.querySelector('.fit-helix');if(!el||reduced()||lite()||!el.animate)return;
  const[a,b]=SCAN[part],dur=part==='boot'?1300:640;scanAnim?.cancel();helixAnim?.cancel();
  scanAnim=el.animate([{opacity:0,transform:`translateY(${a}px)`},{opacity:1,offset:.15},{opacity:1,offset:.8},{opacity:0,transform:`translateY(${b}px)`}],
    {duration:dur,delay,easing:'cubic-bezier(.45,0,.25,1)',fill:'backwards'});
  // as fitas giram (a hélice corre um período e meio enquanto desce)
  helixAnim=hx?.animate([{transform:'translateX(0px)'},{transform:'translateX(-69px)'}],{duration:dur,delay,easing:'linear'});
}
/* ---------- arremesso: o ícone da peça sai do seletor, voa tremendo até o corpo e a peça veste ---------- */
const FLY=340,ZONE={top:300,bottom:560,shoe:905,cap:92};
const flyPool=[];
function flyEl(){let el=flyPool.find(f=>!f.busy);if(!el){el={node:document.createElement('div'),busy:false};el.node.className='fit-fly';el.node.setAttribute('aria-hidden','true');el.node.innerHTML='<img alt="" decoding="async"/>';document.body.appendChild(el.node);flyPool.push(el)}return el}
function originOf(part,id,opts){
  const btn=document.querySelector(`.look-option[data-look-mode="${part}"][data-look-id="${id}"]`),r=btn?.getBoundingClientRect();
  if(r&&r.width&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth)return{x:r.left+r.width/2,y:r.top+r.height/2};
  return opts.from||null;
}
function throwIn(part,id,opts,delay){
  if(reduced()||!fig||!document.body.animate)return 0;
  const from=originOf(part,id,opts);if(!from)return 0;
  const fr=fig.getBoundingClientRect(),k=fr.height/1000,to={x:fr.left+fr.width/2,y:fr.top+ZONE[part]*k};
  const f=flyEl();f.busy=true;const img=f.node.firstChild;img.src=CAT[part][id].thumb;
  const dx=to.x-from.x,dy=to.y-from.y,lift=Math.min(180,Math.hypot(dx,dy)*.35),frames=[];
  for(let i=0;i<=12;i++){const t=i/12,u=1-t,x=from.x+dx*t,y=from.y+dy*t-4*lift*t*u,j=i&&i<12?(i%2?1:-1):0;
    frames.push({offset:t,opacity:t<.15?.2+t*3:t>.85?(1-t)*4.5:.62,transform:`translate(${r1(x+j*2.5)}px,${r1(y+j*1.5)}px) translate(-50%,-50%) rotate(${j*7}deg) scale(${r1(1-t*.45)})`})}
  f.node.animate(frames,{duration:FLY*(lite()?.8:1),delay,easing:'cubic-bezier(.35,.1,.25,1)',fill:'both'}).finished.then(()=>{f.busy=false;f.node.getAnimations().forEach(a=>a.cancel())}).catch(()=>{f.busy=false});
  return FLY*(lite()?.8:1);
}
// saída de um conjunto de camadas: a peça perde tensão, cede e dissolve; corpo exposto (soft) só esmaece
function leave(L,cur,part,D,T){
  const quick=lite()?.72:1;
  cur.els.forEach(el=>{
    const soft=cur.soft.includes(el),kf=soft?[{opacity:1},{opacity:0}]:[{opacity:1,transform:el.style.transform||'none'},{opacity:0,transform:part==='cap'?'translate(0px,-14px)':part==='shoe'?'translate(0px,10px)':part==='top'?'translate(0px,12px) scale(1,.965)':'translate(0px,16px) scale(1,.97)'}];
    const a=el.animate(kf,{duration:soft?.14*T:300*quick,delay:soft?D+T*.28:D*.85,easing:soft?'linear':'cubic-bezier(.4,0,.8,.6)',fill:'forwards'});
    L.leaving.push(el);a.finished.then(()=>{el.remove();L.leaving=L.leaving.filter(x=>x!==el)}).catch(()=>{});
  });
}
function reset(L){L.leaving.forEach(el=>el.remove());L.leaving=[];L.anims.forEach(a=>{try{a.commitStyles?.()}catch{}a.cancel()});L.anims=[]}
function dress(part,p,opts,delay=0){
  const L=live[part];reset(L);
  const old=L.cur;
  if(!p){L.cur=null;if(old){if(reduced()||!fig.animate)old.els.forEach(el=>el.remove());else leave(L,old,part,delay,DUR[part]*(lite()?.72:1))}return}
  // A manga articulada anterior não pode conviver com a nova na troca (quatro braços).
  if(part==='top'&&old){old.els=old.els.filter(el=>{
    if(el.classList?.contains('fit-articulated-longsleeves')){el.remove();return false}
    return true;
  })}
  const o=garmentParts(part,p,'fitA'),els=placeParts(fig,part,o);o.base.dataset.rev=String(++rev);
  L.cur={id:p.id,els,soft:o.soft,e:o.e,pl:o.pl};
  if(part==='top')fig.dataset.kind=o.e.kind;
  if(!old&&!opts.animateIn||reduced()||!o.base.animate){old?.els.forEach(el=>el.remove());return}
  const quick=lite()?.72:1,T=DUR[part]*quick,D=delay*quick;
  if(old)leave(L,old,part,D,T);
  // entrada: chega como fantasma a partir do seletor, encosta no corpo e assenta; a pose nova do corpo acende junto
  const[dx,dy]=entryVector(opts,part);
  els.forEach(el=>{
    const a=el.classList?.contains('fit-articulated-longsleeves')?el.animate([{opacity:0},{opacity:1}],{duration:240,delay:D,easing:'ease-out',fill:'backwards'}):o.soft.includes(el)?el.animate([{opacity:0},{opacity:0,offset:.42},{opacity:1,offset:.6},{opacity:1}],{duration:T,delay:D,easing:'linear',fill:'backwards'}):
      el.animate([
      {opacity:0,transform:`translate(${dx}px,${dy}px) scale(1.07)`},
      {opacity:.5,offset:.32,transform:`translate(${dx*.22}px,${dy*.22}px) scale(1.02)`},
      {opacity:1,offset:.68,transform:'translate(0px,-3px) scale(.992)'},
      {opacity:1,transform:'translate(0px,0px) scale(1)'}],{duration:T,delay:D,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
    L.anims.push(a);
  });
}
// pernas: refeitas quando muda o inferior ou o tênis (troca sem sobreposição, junto da peça que chega)
function swapLegs(delay=0,animate=true){
  const L=live.legs;reset(L);
  const bc=live.bottom.cur,shoeId=curId('shoe'),key=(bc?.id||'')+'|'+(shoeId||'');
  if(L.cur?.id===key)return;
  const g=legsGroup('fitA',bc?{id:bc.id,e:bc.e,pl:bc.pl}:null,shoeId?{...CAT.shoe[shoeId],id:shoeId}:null,fig);
  fig.querySelector('.fit-layer-legs').appendChild(g);
  const old=L.cur;L.cur={id:key,els:[g],soft:[g]};
  if(!old||!animate||reduced()||!g.animate){old?.els.forEach(el=>el.remove());return}
  const T=780*(lite()?.72:1),D=delay*(lite()?.72:1);
  leave(L,old,'legs',D,T);
  L.anims.push(g.animate([{opacity:0},{opacity:0,offset:.42},{opacity:1,offset:.6},{opacity:1}],{duration:T,delay:D,easing:'linear',fill:'backwards'}));
}
// capuz: só com superior que tem capuz fotografado de frente; levantar o capuz tira o boné
function hoodSync(delay=0){
  const up=state.hood&&!!CAT.top[state.topId]?.hood,was=fig.dataset.hood==='up';
  fig.dataset.hood=up?'up':'down';if(up===was||!up||reduced())return;
  fig.querySelectorAll('.fit-layer-hood .fit-hoodpart,.fit-layer-hoodback .fit-hoodpart').forEach(el=>el.animate?.([{opacity:0,transform:'translateY(46px) scale(.9)'},{opacity:1,offset:.55},{opacity:1,transform:'none'}],{duration:520,delay,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
  scan('cap',delay+120);
}
function describe(){
  const n=k=>byId(state[KEY[k]])?.name;
  return `Manequim GB vestindo ${n('top')} com ${n('bottom')}`+(n('shoe')?`, tênis ${n('shoe')}`:'')+(n('cap')?`, boné ${n('cap')}`:'');
}
function flush(){
  flushQueued=false;const want=pending;pending=null;if(!want||!fig)return;
  const opts=want.opts||{};
  state={topId:want.topId,bottomId:want.bottomId,shoeId:want.shoeId,capId:want.capId,hood:!!want.hood};
  PARTS.forEach(k=>{if(state[KEY[k]])fig.dataset[k]=state[KEY[k]];else delete fig.dataset[k]});
  const my=++gen;
  const valid=k=>{const id=state[KEY[k]];return id==null?(k==='shoe'||k==='cap'):!!(byId(id)&&CAT[k][id])};
  const changed=PARTS.filter(k=>valid(k)&&(state[KEY[k]]??null)!==curId(k));
  if(changed.length&&emoteName)stopEmote();
  const tb=changed.filter(k=>k==='top'||k==='bottom');
  // a fase anuncia a troca na hora do pedido; a foto entra decodificada (sem piscar) e a última escolha vence
  if(stage.dataset.phase!=='comparing'&&changed.length)stage.dataset.phase=reduced()?'reduced-motion':tb.length===2?'switching-both':changed.length>1?'switching-both':'switching-'+changed[0];
  clearTimeout(flush.idle);
  Promise.all(PARTS.map(k=>state[KEY[k]]?preload(k,state[KEY[k]]):null)).then(()=>{if(my!==gen)return;
    // cada peça nova é arremessada do seletor; ao chegar, a hélice varre a área e a peça veste
    let d=0,last=0;const delays={};
    changed.forEach((k,i)=>{const id=state[KEY[k]],fly=id&&!opts.silent?throwIn(k,id,opts,i*60):0;delays[k]=fly?i*60+fly:d;
      dress(k,id?byId(id):null,{...opts,animateIn:true,thrown:!!fly},delays[k]);last=Math.max(last,delays[k]);d+=fly?0:120});
    if(changed.length)scan(changed.length>1?'boot':changed[0],Math.max(last,(lite()?.72:1)*320));
    hoodSync(changed.length?last+120:0);
    if(changed.includes('bottom')||changed.includes('shoe'))swapLegs(Math.min(delays.bottom??99999,delays.shoe??99999));
    fig.querySelector('.fit-svg')?.setAttribute('aria-label',describe());
    if(changed.length)showTag(changed,opts);
    clearTimeout(flush.idle);flush.idle=setTimeout(()=>{if(stage.dataset.phase!=='comparing')stage.dataset.phase=reduced()?'reduced-motion':'idle'},Math.max(changed.length>1?1000:860,last+720));
  });
}
const partName=(p,part)=>p.name+(CAT.top[p.id]&&CAT.bottom[p.id]&&(part==='top'||part==='bottom')?(part==='top'?' — superior':' — inferior'):'');
function showTag(parts,opts){
  const tag=stage.querySelector('.fit-tag');if(!tag||opts.silent)return;
  const nm=k=>{const p=byId(state[KEY[k]]);return p?escaped(partName(p,k)):(k==='cap'?'Sem boné':'Bota GB')};
  tag.innerHTML=parts.length>1?`<b>MIX</b><span>${parts.map(nm).join(' + ')}</span>`:`<b>${LABEL[parts[0]]}</b><span>${nm(parts[0])}</span>`;
  tag.dataset.part=parts.length>1?'both':parts[0];tag.classList.remove('is-on');void tag.offsetWidth;tag.classList.add('is-on');
  clearTimeout(tagTimer);tagTimer=setTimeout(()=>tag.classList.remove('is-on'),1700);
}
// set({topId,bottomId,shoeId,capId}) — tênis/boné aceitam null (sem); o que não vier fica como está
function set(next,opts={}){
  const base=pending||state,pick=k=>KEY[k] in next?(next[KEY[k]]??null):base[KEY[k]];
  pending={topId:next.topId||base.topId,bottomId:next.bottomId||base.bottomId,shoeId:pick('shoe'),capId:pick('cap'),hood:'hood' in next?!!next.hood:!!base.hood,opts:{...(pending?.opts||{}),...opts}};
  if(!flushQueued){flushQueued=true;(window.queueMicrotask||setTimeout)(flush)}
}

/* ============================== A / B ============================== */
function compare(on,b){
  if(!stage)return;
  const wrap=stage.querySelector('.fit-compare');
  if(!on||!b){stage.dataset.phase='idle';stage.classList.remove('is-fit-compare');figB?.remove();figB=null;if(wrap)wrap.hidden=true;return}
  const tp=byId(b.top),bp=byId(b.bottom);if(!tp||!bp||!CAT.top[tp.id]||!CAT.bottom[bp.id])return;
  figB?.remove();
  figB=document.createElement('div');figB.className='fit-figure fit-figure-b';figB.setAttribute('aria-hidden','true');
  figB.innerHTML=figureSVG('fitB','Look B salvo');
  const ob=garmentParts('bottom',bp,'fitB'),sh=b.shoe&&CAT.shoe[b.shoe]?b.shoe:null,cp=b.cap&&CAT.cap[b.cap]?b.cap:null;
  placeParts(figB,'bottom',ob);placeParts(figB,'top',garmentParts('top',tp,'fitB'));
  if(sh)placeParts(figB,'shoe',garmentParts('shoe',byId(sh),'fitB'));if(cp)placeParts(figB,'cap',garmentParts('cap',byId(cp),'fitB'));
  figB.querySelector('.fit-layer-legs').appendChild(legsGroup('fitB',{id:bp.id,e:ob.e,pl:ob.pl},sh?{...CAT.shoe[sh],id:sh}:null,figB));
  figB.dataset.hood=b.hood&&CAT.top[tp.id]?.hood?'up':'down';
  figB.dataset.top=tp.id;figB.dataset.bottom=bp.id;if(sh)figB.dataset.shoe=sh;if(cp)figB.dataset.cap=cp;
  fig.after(figB);
  stage.classList.add('is-fit-compare');stage.dataset.phase='comparing';
  if(wrap){wrap.hidden=false;
    const ta=byId(state.topId),ba=byId(state.bottomId);
    wrap.querySelector('.fit-cmp-a').innerHTML=`<b>A / ATUAL</b><span>${escaped(partName(ta,'top'))}<br>${escaped(partName(ba,'bottom'))}</span>`;
    wrap.querySelector('.fit-cmp-b').innerHTML=`<b>B / SALVO</b><span>${escaped(partName(tp,'top'))}<br>${escaped(partName(bp,'bottom'))}</span>`;
    const range=wrap.querySelector('input');setSplit(range.value)}
}
function setSplit(v){stage?.style.setProperty('--split',String(v))}

/* ============================== EMOTES (prontos para a música: bpm) ==============================
   Só transform via WAAPI nas juntas da skin (ombro = mesmo pivô da manga curta, cotovelo, punho, cabeça) e no corpo
   inteiro (.fit-emote, pivô nos pés). Mangas longas não dobram (a foto é a peça): aí dançam o corpo, a cabeça e as mãos. */
let spin=()=>{},turnStart=null,emoteAnims=[],emoteName=null,spinAnim=null,danceVisible=true;
function syncDancePlayback(){
  if(emoteName!=='dance')return;
  const play=danceVisible&&!document.hidden;
  for(const a of emoteAnims){
    if(play&&a.playState==='paused')a.play();
    else if(!play&&a.playState==='running')a.pause();
  }
}
// Cancelar um emote também limpa suas juntas e impede que uma animação antiga
// termine por cima de uma nova roupa ou outro gesto.
function setGestureState(name){
  stage?.querySelectorAll('[data-fit-emote]').forEach(b=>{
    const on=b.dataset.fitEmote===name;b.classList.toggle('is-playing',on);b.setAttribute('aria-pressed',String(on));
    if(b.dataset.fitEmote==='dance'){
      b.setAttribute('aria-label',on?'Parar o passinho contínuo':'Iniciar passinho contínuo do Jamal');
      const label=b.querySelector('b');if(label)label.textContent=on?'PARAR':'PASSINHO';
      b.title=on?'Clique novamente para parar':'Clique para dançar continuamente';
    }
  });
}
function setArmForeground(front){
  if(!fig)return;
  const rig=fig.querySelector('.fit-rig'),arms=rig?.querySelector('.fit-layer-arms'),
    top=rig?.querySelector('.fit-layer-top'),sleeves=rig?.querySelector('.fit-layer-sleeves');
  if(!arms||!top||!sleeves)return;
  if(front)rig.insertBefore(arms,sleeves);else rig.insertBefore(arms,top);
}
function stopEmote(){
  setArmForeground(false);
  emoteAnims.forEach(a=>a.cancel());emoteAnims=[];setGestureState(null);
  if(fig){delete fig.dataset.salveMode;delete fig.dataset.articulated}
  spinAnim?.cancel();spinAnim=null;
  emoteName=null;
  if(fig)delete fig.dataset.emote;
  stage?.classList.remove('is-fit-orbiting');
}
function emote(name,{bpm=176,beats=8}={}){
  if(!fig||reduced()||!fig.animate)return false;
  // Alternância real: PASSINHO fica em loop até um segundo clique.
  if(name==='dance'&&emoteName==='dance'){stopEmote();return true}
  stopEmote();
  // Na dança, a manga inteira articula pelo OMBRO (sem cortar antebraço/cotovelo).
  // A fotografia original volta íntegra ao parar.
  if((name==='salute'||name==='wave'||name==='dance')&&isLongSleeve(CAT.top[state.topId]))fig.dataset.articulated='on';
  bpm=Math.max(60,Math.min(240,Number(bpm)||112));
  beats=Math.max(2,Math.min(16,Math.round(Number(beats)||8)));
  const q=j=>[...fig.querySelectorAll(`.fit-figure:not(.fit-figure-b) [data-j="${j}"], #gbFitFigure [data-j="${j}"]`)].filter((v,i,a)=>a.indexOf(v)===i);
  // Tempo global LINEAR: offsets dos ossos permanecem sincronizados. Suavidade em cada intervalo.
  const run=(els,kf,o)=>els.filter(Boolean).forEach(el=>emoteAnims.push(el.animate(
    kf.map(frame=>({...frame,easing:frame.easing||'cubic-bezier(.38,0,.62,1)'})),
    {easing:'linear',...(name==='dance'?{iterations:Infinity}:{}),...o})));
  const body=[fig.querySelector('.fit-emote')],floor=[fig.querySelector('.fit-floor')],beat=60000/bpm;
  if(name==='spin'){spin();setGestureState(name);document.dispatchEvent(new CustomEvent('gb:emote',{detail:{name,editorial:true}}));return true}
  if(name==='dance'){
    // Base descrita pelo criador Jamal e pelo professor Derick:
    // três batidas do pé, transferência lateral e repetir no outro lado;
    // quadril no sentido oposto ao pé de apoio, braços relaxados.
    // Estudo editorial 2D, não é captura de movimento.
    const T=Math.round(Math.max(1780,Math.min(2240,60000/bpm*6.4)));
    // 16 subdivisões sem salto de posição na costura do loop.
    const steps=[
      {w:0,side:0,up:0,tap:0,b:0},
      {w:-.12,side:-1,up:7,tap:1,b:-1},
      {w:-.18,side:-1,up:0,tap:0,b:0},
      {w:-.24,side:-1,up:9,tap:2,b:-1},
      {w:-.30,side:-1,up:0,tap:0,b:0},
      {w:-.40,side:-1,up:7,tap:3,b:-1},
      {w:-.87,side:-1,up:0,tap:0,b:1},
      {w:-1,side:0,up:0,tap:0,b:0},
      {w:-.28,side:0,up:0,tap:0,b:0},
      {w:.12,side:1,up:7,tap:1,b:-1},
      {w:.18,side:1,up:0,tap:0,b:0},
      {w:.24,side:1,up:9,tap:2,b:-1},
      {w:.30,side:1,up:0,tap:0,b:0},
      {w:.40,side:1,up:7,tap:3,b:-1},
      {w:.87,side:1,up:0,tap:0,b:1},
      {w:1,side:0,up:0,tap:0,b:0},
      {w:0,side:0,up:0,tap:0,b:0}
    ];
    const frames=fn=>steps.map((s,i)=>({offset:i/(steps.length-1),...fn(s,i),
      easing:s.up?'cubic-bezier(.22,.06,.23,.98)':'cubic-bezier(.38,0,.62,1)'}));
    const pants=CAT.bottom[state.bottomId]?.kind==='pants';
    // Mais balanço de cintura sem deslocar a boca da calça em relação ao tênis.
    run(body,frames(s=>({transform:`translateX(${(s.w*18).toFixed(2)}px) translateY(${s.up?1.5:0}px) rotate(${-s.w*1.9}deg)`})),{duration:T});
    run(q('head'),frames(s=>({transform:`rotate(${(-s.w*4.5+s.b*1.7).toFixed(2)}deg)`})),{duration:T});
    // Moletom inteiro acompanha o ritmo, sem máscara/recorte no braço.
    run([fig.querySelector('.fit-layer-top')],frames(s=>({
      transform:`translateX(${(-s.w*3.2).toFixed(2)}px) rotate(${(s.w*.8).toFixed(2)}deg)`
    })),{duration:T});
    run([fig.querySelector('.fit-layer-bottom')],frames(s=>({
      transform:`translateX(${(-s.w*(pants?4.8:2.3)).toFixed(2)}px) rotate(${(s.w*(pants?1.0:.45)).toFixed(2)}deg)`
    })),{duration:T});
    const shoeOffset=parseFloat(fig.style.getPropertyValue('--shoeDx'))||0;
    for(const side of [-1,1]){
      const k=side<0?'L':'R',pulse=s=>s.side===side?(s.tap?1:.5):0;
      run(q('sh'+k),frames(s=>({transform:`rotate(${(side*(s.w*12-s.b*4.5)-pulse(s)*side*5).toFixed(2)}deg)`})),{duration:T});
      run(q('el'+k),frames(s=>({transform:`rotate(${(side*(s.w*6+s.b*3.5)+pulse(s)*side*4).toFixed(2)}deg)`})),{duration:T});
      run(q('wr'+k),frames(s=>({transform:`rotate(${(side*(s.w*3.5+s.b*5)).toFixed(2)}deg)`})),{duration:T});
      // Giro em torno da BOCA do tênis: sem separar o pé da calça.
      const shoeKeys=frames(s=>{
        const active=s.side===side,hit=active&&s.tap!==0;
        const angle=active?(s.tap===2?-7:7)*side:(s.w*-1.8)*side;
        const shift=side*shoeOffset+s.w*2+(active?s.up*.4*side:0);
        return {transform:`translate(${shift.toFixed(2)}px,${hit?(-s.up*.63).toFixed(2):0}px) rotate(${angle.toFixed(2)}deg)`};
      });
      run([...fig.querySelectorAll(`.fit-layer-shoe .fit-foot[data-side="${side}"]`)],shoeKeys,{duration:T});
      if(!pants){
        run([...fig.querySelectorAll(`.fit-layer-legs .fit-leg[data-side="${side}"]`)],frames(s=>({
          transform:`translateX(${(s.w*2+(s.side===side?s.up*.32*side:0)).toFixed(2)}px) rotate(${(s.side===side?s.tap*side*1.5:0).toFixed(2)}deg)`
        })),{duration:T});
      }
    }
    run(floor,frames(s=>({transform:`translateX(${(s.w*4).toFixed(2)}px) scale(${s.up?.97:1},1)`})),{duration:T});
  }else if(name==='wave'){
    setArmForeground(true);
    // Tchau real: erguer braço, três oscilações no antebraço/punho, retornar.
    const T=1840;
    run(q('shR'),[{transform:'rotate(0deg)'},{transform:'rotate(-79deg)',offset:.16},{transform:'rotate(-86deg)',offset:.80},{transform:'rotate(0deg)'}],{duration:T});
    run(q('elR'),[{transform:'rotate(0deg)'},{transform:'rotate(-41deg)',offset:.17},{transform:'rotate(-19deg)',offset:.30},{transform:'rotate(-48deg)',offset:.43},{transform:'rotate(-16deg)',offset:.56},{transform:'rotate(-44deg)',offset:.69},{transform:'rotate(0deg)'}],{duration:T});
    run(q('wrR'),[{transform:'rotate(0deg)'},{transform:'rotate(-27deg)',offset:.18},{transform:'rotate(25deg)',offset:.31},{transform:'rotate(-28deg)',offset:.44},{transform:'rotate(24deg)',offset:.57},{transform:'rotate(-26deg)',offset:.70},{transform:'rotate(0deg)'}],{duration:T});
    run(q('head'),[{transform:'rotate(0deg)'},{transform:'rotate(-6deg)',offset:.30},{transform:'rotate(-4deg)',offset:.73},{transform:'rotate(0deg)'}],{duration:T});
  }else if(name==='salute'){
    setArmForeground(true);
    // SALVE ABERTO: braço à direita de quem observa, sem atravessar o rosto.
    const T=1450,isShort=['tee','polo','jersey'].includes(CAT.top[state.topId]?.kind),
      isLong=isLongSleeve(CAT.top[state.topId]);
    fig.dataset.salveMode=isShort||isLong?'full':'soft';
    const sign=fig.querySelector('.fit-peace-sign');
    if(sign)sign.setAttribute('transform',
      'rotate('+(isLong?-15:isShort?45:120)+') scale(.48) translate(0 -85)');
    run(body,[{transform:'none'},{transform:'rotate(-1.2deg)',offset:.31},
      {transform:'rotate(-1.2deg)',offset:.76},{transform:'none'}],{duration:T});
    const arm=[
      {transform:'rotate(0deg)'},{transform:'rotate(-12deg)',offset:.18},
      {transform:'rotate(-25deg)',offset:.39},{transform:'rotate(-25deg)',offset:.76},
      {transform:'rotate(-11deg)',offset:.91},{transform:'rotate(0deg)'}
    ];
    if(isShort||isLong)run(q('shR'),arm,{duration:T});
    if(isShort||isLong)run(q('elR'),[
      {transform:'rotate(0deg)'},{transform:'rotate(-8deg)',offset:.38},
      {transform:'rotate(-14deg)',offset:.58},{transform:'rotate(-14deg)',offset:.76},
      {transform:'rotate(0deg)'}
    ],{duration:T});
    run(q('wrR'),[
      {transform:'rotate(0deg)'},{transform:'rotate(-8deg)',offset:.38},
      {transform:'rotate(9deg)',offset:.59},{transform:'rotate(0deg)',offset:.87},
      {transform:'rotate(0deg)'}
    ],{duration:T});
    if(isShort||isLong){
      const glove=fig.querySelector('[data-j="wrR"] > .fit-bone-art');
      run([glove],[{opacity:1},{opacity:1,offset:.36},{opacity:0,offset:.49},
        {opacity:0,offset:.79},{opacity:1,offset:.91},{opacity:1}],{duration:T});
      run([sign],[{opacity:0},{opacity:0,offset:.36},{opacity:1,offset:.49},
        {opacity:1,offset:.79},{opacity:0,offset:.91},{opacity:0}],{duration:T});
    }
    run(q('head'),[
      {transform:'rotate(0deg)'},{transform:'rotate(-4deg)',offset:.45},
      {transform:'rotate(-4deg)',offset:.75},{transform:'rotate(0deg)'}
    ],{duration:T});
  }else if(name==='jump'){
    const T=1100;
    run(body,[{transform:'none'},{transform:'translateY(9px) scale(1.02,.95)',offset:.18},{transform:'translateY(-64px) scale(.98,1.03)',offset:.46,easing:'cubic-bezier(.3,0,.7,1)'},{transform:'translateY(0px) scale(1.03,.94)',offset:.72},{transform:'translateY(2px) scale(1,.99)',offset:.86},{transform:'none'}],{duration:T});
    run(floor,[{transform:'none',opacity:1},{transform:'scale(1.05,1)',offset:.18},{transform:'scale(.62,.7)',opacity:.45,offset:.46},{transform:'scale(1.08,1)',opacity:1,offset:.72},{transform:'none',opacity:1}],{duration:T});
    for(const s of[-1,1]){const k=s<0?'L':'R';run(q('sh'+k),[{transform:'rotate(0deg)'},{transform:`rotate(${s*12}deg)`,offset:.18},{transform:`rotate(${-s*70}deg)`,offset:.46},{transform:'rotate(0deg)',offset:.75},{transform:'rotate(0deg)'}],{duration:T})}
  }else return false;
  emoteName=name;fig.dataset.emote=name;setGestureState(name);
  if(name==='dance')syncDancePlayback();
  if(name!=='dance')Promise.all(emoteAnims.map(a=>a.finished)).then(()=>{
    if(emoteName===name){stopEmote()}
  }).catch(()=>{});
  document.dispatchEvent(new CustomEvent('gb:emote',{detail:{name,bpm}}));
  return true;
}

const icon=k=>{
const p={
dance:'<path d="M4 15l4-4 3 3-3 4-4 1zM13 6l3-3 4 3-1 5-4 2-3-3z"/><path d="M5 7h3m-1-2v4m9 8h3m-1-2v4"/>',
wave:'<path d="M7 20c-3-2-3-5-3-7l-1-3a1.6 1.6 0 013-1l2 3V5a1.5 1.5 0 013 0v5-6a1.5 1.5 0 013 0v6-5a1.5 1.5 0 013 0v6-3a1.5 1.5 0 013 0v6c0 4-2 7-6 8z"/>',
salute:'<path d="M8 21L6 12 3 8a1.8 1.8 0 013-2l3 3-2-6a1.6 1.6 0 013-1l3 8 2-7a1.6 1.6 0 013 1l-2 9 2-2a1.8 1.8 0 013 2l-5 7z"/>',
spin:'<path d="M19 8a8 8 0 10-1 10"/><path d="M16 4l4 4-5 3"/><path d="M9 20h5"/>',
jump:'<path d="M12 19V4M7 9l5-5 5 5"/><path d="M4 21h16M8 16l-3 3m11-3 3 3"/>'
};
return `<svg class="fit-icon-glyph" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[k]||''}</svg>`;
};
/* ============================== MONTAGEM ============================== */
function mount(el,initial){
  stage=el;if(!stage||stage.querySelector('.fit-figure'))return;
  stage.classList.add('has-fit');
  const scene=document.createElement('div');scene.className='fit-scene';
  // palco de loja: parede de apresentação com faixas de LED, canhões de luz, halo e o monograma, piso com reflexo
  scene.innerHTML=`<div class="fit-backdrop" aria-hidden="true"><i class="fit-wall"></i><i class="fit-led fit-led-l"></i><i class="fit-led fit-led-r"></i><i class="fit-arch"></i><img class="fit-mark" src="./assets/brand/gb-monograma-claro.svg" alt="" decoding="async" loading="lazy"/><i class="fit-halo"></i><i class="fit-spot fit-spot-l"></i><i class="fit-spot fit-spot-r"></i><i class="fit-key"></i><i class="fit-rim"></i><i class="fit-horizon"></i><i class="fit-gloss"></i></div>
   <div class="fit-figure" id="gbFitFigure">${figureSVG('fitA','Manequim GB vestindo o look selecionado')}</div>
   <div class="fit-plat" aria-hidden="true"><i></i><b></b></div><div class="fit-turn" aria-hidden="true"></div>
   <span class="fit-orbit-note" aria-hidden="true">GIRO EDITORIAL · COSTAS NÃO FOTOGRAFADAS</span>
    <div class="fit-emotes" role="group" aria-label="Emotes do GB UNIT">
      <span class="fit-emotes-title" aria-hidden="true">GB / GESTOS</span>
      <button type="button" data-fit-emote="dance" aria-label="Passinho do Jamal" aria-pressed="false"><i aria-hidden="true">${icon('dance')}</i><b>PASSINHO</b></button>
      <button type="button" data-fit-emote="wave" aria-label="Acenar tchau" aria-pressed="false"><i aria-hidden="true">${icon('wave')}</i><b>TCHAU</b></button>
      <button type="button" data-fit-emote="salute" aria-label="Salve com paz e amor" aria-pressed="false"><i aria-hidden="true">${icon('salute')}</i><b>SALVE</b></button>
      <button type="button" data-fit-emote="spin" aria-label="Girar 360 graus" aria-pressed="false"><i aria-hidden="true">${icon('spin')}</i><b>360°</b></button>
      <button type="button" data-fit-emote="jump" aria-label="Pular" aria-pressed="false"><i aria-hidden="true">${icon('jump')}</i><b>PULAR</b></button>
    </div>
    <div class="fit-turnbar" role="group" aria-label="Girar o GB UNIT">
      <span class="fit-turn-title" aria-hidden="true">GB / ORBIT CONTROL</span>
      <button type="button" data-fit-turn="-1" aria-label="Girar para a esquerda" aria-pressed="false"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M15 5l-7 7 7 7"/></svg></button>
      <span class="fit-dial" role="slider" tabindex="0" aria-label="Giro do manequim" aria-valuemin="-45" aria-valuemax="45" aria-valuenow="0" aria-valuetext="FRENTE"><b>ORBITAR</b><span class="fit-spin-track" aria-hidden="true"><i data-pose="-1"></i><i data-pose="0" class="is-active"></i><i data-pose="1"></i><i class="fit-orbit-thumb"></i></span></span>
      <button type="button" data-fit-turn="0" aria-label="De frente" aria-pressed="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="5"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button>
      <button type="button" data-fit-turn="1" aria-label="Girar para a direita" aria-pressed="false"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg></button>
    </div>
    <p class="fit-tag" aria-hidden="true"></p>
   <p class="fit-legal">SIMULAÇÃO EDITORIAL DE COMPOSIÇÃO · FOTOS REAIS DO ACERVO GB · NÃO É PROVADOR DE CAIMENTO</p>
   <div class="fit-compare" hidden><div class="fit-cmp-a"></div><div class="fit-cmp-b"></div><span class="fit-split-line" aria-hidden="true"><i>A | B</i></span><label class="fit-split"><span class="sr-only">Divisor entre o look A (atual) e o look B (salvo)</span><input type="range" min="8" max="92" value="50" step="1"></label></div>`;
  stage.prepend(scene);
  fig=scene.querySelector('.fit-figure');
  // O loop permanece selecionado, mas pausa quando o palco sai da viewport
  // ou a aba fica oculta; retorna no mesmo compasso quando reaparece.
  if(typeof IntersectionObserver!=='undefined'){
    new IntersectionObserver(entries=>{
      danceVisible=entries.some(e=>e.isIntersecting);
      syncDancePlayback();
    },{rootMargin:'80px'}).observe(stage);
  }
  document.addEventListener('visibilitychange',syncDancePlayback);

  // áreas de encaixe acompanham o corpo (soltar peça / feedback de encaixe)
  stage.querySelectorAll('.look-dock').forEach(d=>fig.appendChild(d));
  const range=scene.querySelector('.fit-split input');
  range.addEventListener('input',()=>setSplit(range.value));
  // arrastar o divisor diretamente sobre o palco (mouse e toque)
  // Só o robô e a plataforma giram; no modo A/B o palco move o divisor.
  let turnDrag=null;
  if(M)M.drag(scene,{axis:'x',threshold:6,ignore:'button,input,a,.look-option,.fit-dial,.fit-turnbar,.fit-emotes',
    onStart(st){turnDrag=stage.classList.contains('is-fit-compare')?null:(st.target?.closest?.('#gbFitFigure,.fit-turn')?turnStart?.():null)},
    onMove(dx,st){if(!turnDrag){if(!stage.classList.contains('is-fit-compare'))return;const r=fig.getBoundingClientRect();const v=Math.max(8,Math.min(92,(st.lx-r.left)/r.width*100));range.value=String(Math.round(v));setSplit(v);return}turnDrag.move(dx)},
    onEnd(v){turnDrag?.end(v);turnDrag=null}});
  // giro: arrastar o corpo (mouse) ou a plataforma (toque), botões e setas do teclado; mola e encaixe em 3 poses
  const turn=scene.querySelector('.fit-turn'),dial=scene.querySelector('.fit-dial');
  const spring=M?new M.Spring(0,{k:170,z:.82}):null;let spinning=false,stopTicker=null,orbitPointer=null;
  const label=y=>{const d=dirOf(y);return d==='L'?'ESQUERDA':d==='R'?'DIREITA':'FRENTE'};
  const sync=y=>{applyYaw(fig,y);scene.style.setProperty('--yaw',y.toFixed(3));scene.style.setProperty('--yawa',Math.abs(y).toFixed(3));if(dial){dial.setAttribute('aria-valuenow',String(Math.round(y*45)));dial.setAttribute('aria-valuetext',label(y))}
    scene.querySelectorAll('[data-fit-turn]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.fitTurn===Math.round(y))));
    scene.querySelectorAll('.fit-spin-track [data-pose]').forEach(t=>t.classList.toggle('is-active',+t.dataset.pose===Math.round(y)));
    dial?.style.setProperty('--orbit-position',String(50+Math.max(-1,Math.min(1,y))*41)+'%')};
  const loop=dt=>{const y=spring.step(Math.min(dt,.05));sync(y);if(spring.settled){spring.jump(spring.target);sync(spring.target);spinning=false;stopTicker=null;return false}};
  const goTo=(t,impulse=0)=>{t=Math.max(-1,Math.min(1,t));if(!spring||reduced()){sync(t);return}spring.set(t,impulse);if(!spinning){spinning=true;stopTicker=M.Ticker.add(loop)}};
  scene.querySelectorAll('[data-fit-turn]').forEach(b=>b.addEventListener('click',()=>goTo(+b.dataset.fitTurn)));
  dial?.addEventListener('keydown',e=>{const k={ArrowLeft:-1,ArrowDown:-1,ArrowRight:1,ArrowUp:1}[e.key];if(k==null)return;e.preventDefault();goTo(Math.round(spring?spring.target:yaw)+k)});
   // Slider físico: segue cada pixel do mouse ou dedo; mola apenas ao soltar.
   const track=scene.querySelector('.fit-spin-track');
   const moveOrbit=e=>{const r=track.getBoundingClientRect();if(!r.width)return;
     const pos=Math.max(-1,Math.min(1,((e.clientX-r.left)/r.width-.5)/.41));
     spring?.jump(pos);sync(pos)};
   dial?.addEventListener('pointerdown',e=>{if(e.button!==0||stage.classList.contains('is-fit-compare'))return;
     if(emoteName)stopEmote();stopTicker?.();stopTicker=null;spinning=false;
     orbitPointer=e.pointerId;dial.setPointerCapture?.(e.pointerId);moveOrbit(e);e.preventDefault()});
   dial?.addEventListener('pointermove',e=>{if(e.pointerId===orbitPointer)moveOrbit(e)});
   const endOrbit=e=>{if(e.pointerId!==orbitPointer)return;orbitPointer=null;
     if(dial.hasPointerCapture?.(e.pointerId))dial.releasePointerCapture(e.pointerId);
     goTo(Math.round(Math.max(-1,Math.min(1,yaw))))};
   dial?.addEventListener('pointerup',endOrbit);
   dial?.addEventListener('pointercancel',endOrbit);
   dial?.addEventListener('lostpointercapture',e=>{if(orbitPointer===e.pointerId){orbitPointer=null;goTo(Math.round(yaw))}});

  // o giro acompanha o dedo/mouse; ao soltar, encaixa na pose mais perto (com o embalo do gesto)
  turnStart=()=>{stopTicker?.();stopTicker=null;spinning=false;const y0=spring?spring.x:yaw;spring?.jump(y0);return{
    move(dx){const w=fig.getBoundingClientRect().width;const y=Math.max(-1.15,Math.min(1.15,y0+dx/(w*.55)));spring?.jump(y);sync(y)},
    end(v){const y=spring?spring.x:yaw;goTo(Math.round(Math.max(-1,Math.min(1,y+v/2600))))}}};
  fig.addEventListener('fit:turn',e=>goTo(+e.detail));
  // Órbita de 360° contínua do sprite editorial; a vista traseira não é foto de produto.
  // Elimina o salto instantâneo de uma lateral para a outra da V19 anterior.
  spin=()=>{
    if(!spring||reduced())return;
    spring.jump(0);sync(0);
    const plane=fig.querySelector('.fit-yaw');if(!plane?.animate)return;
    stage.classList.add('is-fit-orbiting');
    const anim=plane.animate([
      {offset:0,transform:'perspective(960px) rotateY(0deg)'},
      {offset:.25,transform:'perspective(960px) rotateY(90deg)'},
      {offset:.5,transform:'perspective(960px) rotateY(180deg)'},
      {offset:.75,transform:'perspective(960px) rotateY(270deg)'},
      {offset:1,transform:'perspective(960px) rotateY(360deg)'}
    ],{duration:2400,easing:'cubic-bezier(.42,0,.58,1)'});
    spinAnim=anim;emoteName='spin';fig.dataset.emote='spin';
    anim.finished.then(()=>{if(spinAnim===anim){spinAnim=null;emoteName=null;delete fig.dataset.emote;stage.classList.remove('is-fit-orbiting');setGestureState(null);sync(0)}}).catch(()=>{});
  };
  scene.querySelectorAll('[data-fit-emote]').forEach(b=>b.addEventListener('click',()=>emote(b.dataset.fitEmote)));
  sync(0);

  const t=byId(initial.topId),b=byId(initial.bottomId);
  state={topId:initial.topId,bottomId:initial.bottomId,shoeId:initial.shoeId&&CAT.shoe[initial.shoeId]?initial.shoeId:null,capId:initial.capId&&CAT.cap[initial.capId]?initial.capId:null};
  for(const part of['bottom','top','shoe','cap']){const p=byId(state[KEY[part]]);if(p&&CAT[part][p.id]){dress(part,p,{});preload(part,p.id);fig.dataset[part]=p.id}}
  state.hood=!!initial.hood;fig.dataset.hood=state.hood&&CAT.top[state.topId]?.hood?'up':'down';
  swapLegs(0,false);
  if(t&&b)fig.querySelector('.fit-svg')?.setAttribute('aria-label',describe());
  stage.dataset.phase=reduced()?'reduced-motion':'entering';
  const wake=()=>{stage.classList.add('is-awake');scan('boot',500);awake=true;later.splice(0).forEach(([p,i])=>preloadSoon(p,i));setTimeout(()=>{if(stage.dataset.phase==='entering')stage.dataset.phase='idle'},1100)};
  if(reduced()||!M)wake();else{const off=M.onVisible(stage,v=>{if(v){off();wake()}},{threshold:.3})}
  // microparallax de luz apenas com ponteiro fino e aparelho capaz
  if(M&&M.Prefs.fine&&!reduced()&&!lite()){let tx=0,ty=0,cx=0,cy=0,on=false;
    const loop=dt=>{const k=1-Math.pow(.002,dt);cx+=(tx-cx)*k;cy+=(ty-cy)*k;scene.style.setProperty('--fx',cx.toFixed(3));scene.style.setProperty('--fy',cy.toFixed(3));if(Math.abs(tx-cx)<.002&&Math.abs(ty-cy)<.002){on=false;return false}};
    scene.addEventListener('pointermove',e=>{const r=scene.getBoundingClientRect();tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5;if(!on){on=true;M.Ticker.add(loop)}},{passive:true});
    scene.addEventListener('pointerleave',()=>{tx=0;ty=0;if(!on){on=true;M.Ticker.add(loop)}})}
}
// pré-carga das vizinhas só depois que o palco aparece, em tempo ocioso; ready(): tudo o que foi pedido já decodificou
let awake=false;const later=[];
function preloadSoon(part,id){if(awake)(window.requestIdleCallback||setTimeout)(()=>preload(part,id));else later.push([part,id])}
const readyAll=()=>Promise.all([...ready.values()]);
window.GBFitting={mount,set,compare,emote,get emoting(){return emoteName},turn:y=>fig&&fig.dispatchEvent(new CustomEvent('fit:turn',{detail:y})),get yaw(){return yaw},preload:preloadSoon,ready:readyAll,get state(){return{...state}},zones:B.zones,RIG:B,FIT,SHOE,CAP,catalog:CAT};
})();
