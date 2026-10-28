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
  bottom:{waist:178,waistY:430,pantsHem:896},armTilt:11,neck:{top:22,base:31},
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
const MONO='./assets/brand/gb-monograma-preto.svg',HEAD_DY=8;   // cabeça 8 abaixo do desenho base: pescoço visível de ~0,45 cabeça

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

function headSVG(pfx){
  return `<g class="fit-head" transform="translate(-12.6 ${HEAD_DY}) scale(1.06 1)">`+
    // módulos auriculares com luz
    both(s=>`<circle cx="${X(s,45.5)}" cy="123" r="8.6" fill="url(#${pfx}-yh)"/><circle cx="${X(s,45.5)}" cy="123" r="4.8" fill="#0b0c0e"/><circle class="fit-glow" cx="${X(s,45.5)}" cy="123" r="2" fill="#ffd447"/>`)+
    // capacete amarelo
    `<path d="${smooth(HEAD)}" fill="url(#${pfx}-yh)"/>`+
    both(s=>`<ellipse cx="${X(s,40)}" cy="118" rx="8" ry="26" fill="#3a2b05" opacity=".28"/>`)+
    // faixa central preta do topo à testa
    `<path d="M206 58.4Q210 58 214 58.4L213.4 95H206.6Z" fill="url(#${pfx}-bk)"/>`+
    // monograma GB (arquivo oficial) na testa
    `<image href="${MONO}" x="216" y="72" width="26" height="15.9" preserveAspectRatio="xMidYMid meet" opacity=".92"/>`+
    // respiros nas têmporas
    both(s=>[0,1,2].map(i=>`<path d="M${X(s,37.5)} ${99+i*5.2}L${X(s,44)} ${97.4+i*5.2}" stroke="#0b0c0e" stroke-width="2.2" stroke-linecap="round"/>`).join(''))+
    // máscara preta espelhada
    `<path d="${smooth(FACE)}" fill="url(#${pfx}-fc)"/>`+
    shine('M187 101Q199 96.5 214 98',.42,2.6)+shine('M191 129Q193 149 205 161',.16,4.2)+shine('M236 112Q238 128 232 142',.12,3)+
    line('M210 96V167',1.4,.7)+
    // olhos: fendas acesas com halo
    both(s=>`<ellipse class="fit-glow" cx="${X(s,15.5)}" cy="121" rx="17" ry="9" fill="url(#${pfx}-gl)"/>`+
      `<path d="M${X(s,25.5)} 116.2L${X(s,6)} 121.4L${X(s,7.4)} 125.4L${X(s,23.4)} 121.2Z" fill="url(#${pfx}-ey)"/>`)+
    // grade da boca
    [150,154.5,159].map(y=>`<path d="M203 ${y}H217" stroke="#ffd447" stroke-opacity=".45" stroke-width="1.3" stroke-linecap="round"/>`).join('')+
    // borda da máscara e brilho do topo
    seam(smooth(FACE),.55,1.2)+shine('M186 70Q198 62 206 61',.7,3)+
  `</g>`;
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
    both(s=>line(`M${r1(cx+s*17)} ${160}C${r1(cx+s*15)} 174 ${r1(cx+s*9)} ${r1(yb-16)} ${r1(cx+s*5)} ${r1(yb-4)}`,2.2,.85))+
    seam(`M${r1(cx-20)} 174H${r1(cx+20)}`,.55,1.4,'#5b616b')+seam(`M${r1(cx-22)} 186H${r1(cx+22)}`,.45,1.2,'#5b616b')+
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
// luva: lâmina da mão de lado, polegar à frente voltado ao corpo; aponta +y a partir do punho
function handSVG(pfx,x,y,deg,side,s=1){
  const t=-side,blade=smooth([[-10.5,-3],[10.5,-3],[13,10],[14,27],[13,42],[11.5,55],[8,66],[2,74],[-4,73],[-8.8,64],[-12,50],[-13.5,32],[-13,12]]);
  return `<g class="fit-hand" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(deg)}) scale(${s})">`+
    `<path d="${blade}" fill="url(#${pfx}-bk)"/>`+
    // placas amarelas: dorso, nós dos dedos e pontas
    `<path d="M-11 12Q0 8 12 12L12.5 30Q0 34 -12.5 30Z" fill="url(#${pfx}-yl)"/>`+
    `<path d="M-12.5 38Q0 34 13 38L12 47Q0 51 -12 47Z" fill="url(#${pfx}-yl)"/>`+
    seam('M-9 56Q0 60 10 56',.6,1,'#5b616b')+`<path d="M-6 64Q1 70 7.5 64L5 71Q1 74 -3 72Z" fill="url(#${pfx}-yl)"/>`+
    `<path d="${capsule(t*4,10,5.6,t*9,44,4.6)}" fill="url(#${pfx}-bh)"/>`+`<path d="${capsule(t*5,22,3.2,t*8.4,40,2.8)}" fill="url(#${pfx}-yl)"/>`+
    `<rect x="-12" y="-9" width="24" height="10" rx="3" fill="url(#${pfx}-yl)"/>`+seam('M-11 -4H11',.6,1)+
  `</g>`;
}
// bota padrão (sem tênis): preta com biqueira e faixa amarelas
function bootSVG(pfx,ax,ay,side){
  const o=side*3,y=ay;
  return `<path d="M${ax-12} ${y-8}H${ax+12}C${ax+15+o} ${y+12} ${ax+22+o} ${y+24} ${ax+23+o} ${y+36}C${ax+23+o} ${y+42} ${ax+19+o} ${y+44} ${ax+12+o} ${y+44}H${ax-12+o}C${ax-19+o} ${y+44} ${ax-23+o} ${y+42} ${ax-23+o} ${y+36}C${ax-22+o} ${y+24} ${ax-15} ${y+12} ${ax-12} ${y-8}Z" fill="url(#${pfx}-bk)"/>`+
    `<path d="M${ax-20+o} ${y+28}Q${ax+o} ${y+18} ${ax+20+o} ${y+28}L${ax+22+o} ${y+38}H${ax-22+o}Z" fill="url(#${pfx}-yl)"/>`+
    line(`M${ax-11} ${y+2}L${ax+11} ${y+2}`,2.4,.9)+
    `<path d="M${ax-23+o} ${y+38}H${ax+23+o}V${y+44}Q${ax+o} ${y+46} ${ax-23+o} ${y+44}Z" fill="#2a2d33"/>`;
}

/* ============================== PEÇAS REAIS ============================== */
// posição da foto no corpo (em unidades do viewBox) a partir das âncoras medidas no recorte
function placeTop(e){
  const k=(FIT.kindScale[e.kind]||1)*(e.scale||1),Wb=FIT.top.shoulder*k/e.sh.w,Hb=Wb*e.h/e.w;
  return{x:B.cx-e.cx*Wb+(e.dx||0),y:FIT.top.lineY+(FIT.top.kindDy[e.kind]||0)-e.sh.y*Hb+(e.dy||0),w:Wb,h:Hb};
}
function placeBottom(e){
  const ww=e.waist.r-e.waist.l,leg=Math.max(...e.legs.map(l=>l.y))-e.waist.y;
  let Wb=FIT.bottom.waist*(FIT.kindScale[e.kind]||1)*(e.scale||1)/ww;
  // calça: a barra cai no tornozelo (o cós segue entre 168 e 206 de largura)
  if(e.kind==='pants'){const want=(FIT.bottom.pantsHem-FIT.bottom.waistY)/(leg*e.h/e.w);Wb=Math.max(168/ww,Math.min(206/ww,want))}
  const Hb=Wb*e.h/e.w;
  return{x:B.cx-(e.waist.l+ww/2)*Wb+(e.dx||0),y:FIT.bottom.waistY-e.waist.y*Hb+(e.dy||0),w:Wb,h:Hb};
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
    const th=side<0?Math.max(-60,Math.min(0,a0-aT)):Math.min(60,Math.max(0,a0-aT));
    const piv=P(pl,s.px,s.py),O=rot(P(pl,s.ox,s.oy),piv,th),a=(a0-th)*Math.PI/180;
    out[k]={side,th,piv,O,n:[Math.sin(a),Math.cos(a)],ow:s.ow*pl.w,box:{x:pl.x+s.x*pl.w,y:pl.y+s.y*pl.h,w:s.w*pl.w,h:s.h*pl.h},src:s.src};
  }
  return out;
}
// braço que sai da manga curta: ombro escondido na manga, cotovelo na altura do umbigo, antebraço blindado junto ao quadril
function shortArm(pfx,sp){
  const{side,O,n}=sp,hw=Math.max(18,Math.min(22,sp.ow*.44)),S=[O[0]-n[0]*34,O[1]-n[1]*34];
  const t=Math.max(36,Math.min(170,(B.navel-O[1])/Math.max(.5,n[1]))),E=[O[0]+n[0]*t,O[1]+n[1]*t];
  const a2=Math.atan2(n[0],n[1])*.3,d2=[Math.sin(a2),Math.cos(a2)],Wr=[E[0]+d2[0]*126,E[1]+d2[1]*126];
  const up=[[...S,hw],[...O,hw*.96],[...along(O,E,.55),hw*.88],[...E,16]],fo=[[...E,16],[...along(E,Wr,.28),18.4],[...along(E,Wr,.7),14.2],[...Wr,11.4]];
  // boca da manga: a sombra do lado de dentro fica atrás do braço
  return `<ellipse cx="${r1(O[0])}" cy="${r1(O[1])}" rx="${r1(hw*1.15)}" ry="${r1(hw*.45)}" transform="rotate(${r1(-Math.atan2(n[0],n[1])*180/Math.PI)} ${r1(O[0])} ${r1(O[1])})" fill="#000" opacity=".55"/>`+
    `<path d="${limb(up)}" fill="url(#${pfx}-bk)"/>`+`<path d="${plate(up,.25,.9,.42,side*.5)}" fill="url(#${pfx}-yl)"/>`+
    `<path d="${limb(fo)}" fill="url(#${pfx}-bk)"/>`+`<path d="${plate(fo,.12,.86,.7,side*.18)}" fill="url(#${pfx}-yl)"/>`+
    seam(`M${r1(along(E,Wr,.45)[0]-9)} ${r1(along(E,Wr,.45)[1])}L${r1(along(E,Wr,.45)[0]+9)} ${r1(along(E,Wr,.45)[1]+1)}`,.55,1.2)+
    `<circle cx="${r1(E[0])}" cy="${r1(E[1])}" r="15" fill="url(#${pfx}-bh)"/><circle cx="${r1(E[0])}" cy="${r1(E[1])}" r="10.2" fill="none" stroke="#ffd447" stroke-width="2" stroke-opacity=".9"/>`+
    handSVG(pfx,Wr[0],Wr[1]+3,-a2*180/Math.PI*.6,side);
}
function armsSVG(e,pl,pfx,sp){
  const out=[];
  if(e.rig){for(const k of['l','r'])if(sp[k])out.push(shortArm(pfx,sp[k]))}
  else for(const side of[-1,1]){
    const s=e.sleeves?.[side<0?'l':'r'];if(!s||s.type!=='long')continue;
    // manga longa: só a mão, saindo do punho na direção da manga
    const[cx,cy]=P(pl,s.x,s.y),ang=Math.atan2(s.dx,s.dy)*180/Math.PI;
    out.push(handSVG(pfx,cx-s.dx*3,cy-s.dy*3,-ang,side,.98));
  }
  return out.join('');
}
// pernas: coxa, joelheira, panturrilha, caneleira; a coxa preenche a boca da bermuda e o tornozelo segue a barra
// da calça (ou a boca do tênis). spec: {open:[{x,y,hw}|null ×2], ank:[[x,y]×2], boots}
const LEG=[[0,38],[.14,37],[.3,32.5],[.46,25.5],[.555,21.5],[.6,22.5],[.67,27],[.74,26],[.83,19.5],[.92,14],[1,12.2]];
function legSpec(e,pl){
  const ww=(e.waist.r-e.waist.l)*pl.w,open=e.legs.slice(0,2).map(l=>{const[x,y]=P(pl,l.x,l.y);return{x,y,hw:l.w*pl.w/2}});
  const ok=open.length===2&&open[0].x<B.cx&&open[1].x>B.cx&&open[1].x-open[0].x>ww*.25&&open.every(o=>o.hw>ww*.1);
  if(e.kind==='pants'){const sep=ok?Math.max(30,Math.min(68,(open[1].x-open[0].x)/2)):42;return{open:[null,null],ank:[[X(-1,sep),B.ankleY],[X(1,sep),B.ankleY]]}}
  // bermuda: boca medida quando confiável; senão, simétrica a partir do cós
  const y=Math.max(...open.map(o=>o.y)),sep=ok?(open[1].x-open[0].x)/2:ww*.25,hw=ok?Math.min(...open.map(o=>o.hw)):ww*.26;
  return{open:[{x:X(-1,sep),y,hw},{x:X(1,sep),y,hw}],ank:[[X(-1,40),B.ankleY],[X(1,40),B.ankleY]]};
}
function legsSVG(pfx,spec){
  return spec.ank.map(([ax,ay],i)=>{
    const side=i?1:-1,[hx,hy]=side<0?B.hipL:B.hipR,o=spec.open[i],ky=B.kneeY;
    // a coxa passa pelo centro da boca da bermuda
    const ox=o?o.x:hx+(ax-hx)*.4,oy=o?o.y:hy+(ky-hy)*.6,kx=ox+(ax-ox)*((ky-oy)/(ay-oy));
    const xAt=y=>y<=oy?hx+(ox-hx)*(y-hy)/(oy-hy):y<=ky?ox+(kx-ox)*(y-oy)/(ky-oy):kx+(ax-kx)*(y-ky)/(ay-ky);
    // largura da coxa: preenche a boca (82%) sem passar do atleta
    // a coxa enche a boca da bermuda (88%) e afina até o joelho, como um quadríceps
    const to=(oy-hy)/(ay-hy),tk=(ky-hy)/(ay-hy),lw=t=>{for(let i=1;i<LEG.length;i++)if(LEG[i][0]>=t){const[a,wa]=LEG[i-1],[b,wb]=LEG[i];return wa+(wb-wa)*(t-a)/(b-a)}return LEG.at(-1)[1]};
    const thigh=o?Math.max(26,Math.min(44,o.hw*.88)):lw(to),kw=thigh/lw(to);
    const pts=LEG.map(([t,w])=>{const y=hy+t*(ay-hy),k=t<=to?kw:t<tk?kw+(1-kw)*Math.pow((t-to)/(tk-to),.6):1;return[xAt(y),y,w*Math.max(.9,k)]});
    const L=[],R=[];
    for(const[x,y,w]of pts){const t=(y-hy)/(ay-hy),wo=w*(t>.6&&t<.8?1.08:1);L.push([x+side*wo,y]);R.push([x-side*w,y])}
    const d=smooth([...L,[ax,ay+4],...R.reverse(),[hx,hy-20]]);
    const kp=[[-17,-24],[17,-24],[21,-5],[15,17],[-15,17],[-21,-5]].map(([dx,dy])=>[kx+dx,ky+dy]);
    const tl=pts.map(p=>[p[0]+side*p[2]*.55,p[1],p[2]*.42]);
    return `<g class="fit-leg">`+(o?`<ellipse cx="${r1(o.x)}" cy="${r1(o.y-2)}" rx="${r1(o.hw*.98)}" ry="${r1(o.hw*.3)}" fill="#000" opacity=".6"/>`:'')+
      `<path d="${d}" fill="url(#${pfx}-bk)"/>`+
      // placa da coxa (lado de fora), joelheira, caneleira com faixas
      `<path d="${plate(tl,.04,.42,1,0)}" fill="url(#${pfx}-yl)"/>`+
      line(`M${r1(xAt(hy+70)-side*10)} ${hy+70}Q${r1(xAt(610)-side*16)} 610 ${r1(xAt(660)-side*8)} 662`,2,.7)+
      `<path d="${smooth(kp)}" fill="url(#${pfx}-yh)"/>`+seam(`M${r1(kx)} ${ky-22}V${ky+15}`,.55,1.4)+seam(smooth(kp),.5,1.1)+
      `<path d="${plate(pts,.64,.93,.66,0)}" fill="url(#${pfx}-yl)"/>`+
      [.72,.8].map(t=>{const y=hy+t*(ay-hy),x=xAt(y);return `<path d="M${r1(x-12)} ${r1(y)}L${r1(x+12)} ${r1(y+6)}" stroke="#0b0c0e" stroke-width="3.2" stroke-linecap="round"/>`}).join('')+
      (spec.boots===false?'':`<rect x="${r1(ax-12)}" y="${ay-14}" width="24" height="9" rx="3" fill="url(#${pfx}-yl)"/>`+bootSVG(pfx,ax,ay,side))+`</g>`;
  }).join('');
}
// tênis: o pé real do acervo nos dois pés, apontando para o mesmo lado; a sola pisa o chão e a canela entra na boca
const SHOE={len:148,sep:50};
function shoePlace(e){
  const Wu=SHOE.len,Hu=Wu*e.h/e.w,y=B.floor+3-Hu;
  return[-1,1].map(side=>{const ax=X(side,SHOE.sep);return{side,x:ax-e.collar.x*Wu,y,w:Wu,h:Hu,ank:[ax,y+e.collar.y*Hu+5]}});
}
// boné: a copa (marcada na foto) assenta no capacete, base na altura da testa
const CAP={w:100,cx:213,y:92+HEAD_DY};
function capPlace(e){const c=e.crown,Wc=CAP.w/(c.x1-c.x0),Hc=Wc*e.h/e.w;return{x:CAP.cx-(c.x0+c.x1)/2*Wc,y:CAP.y-c.yb*Hc,w:Wc,h:Hc}}
const photo=(src,x,y,w,h,extra='')=>`<image class="fit-photo" href="${src}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" preserveAspectRatio="none"${extra}/>`;
const mkG=(cls,id)=>{const g=document.createElementNS(NS,'g');g.setAttribute('class',cls);if(id)g.dataset.product=id;return g};
// pernas = inferior (boca da bermuda / barra da calça) + tênis (boca do tênis); sem tênis, a bota GB do robô
function legsGroup(pfx,bot,shoeE){
  const spec=bot?legSpec(bot.e,bot.pl):{open:[null,null],ank:[[X(-1,42),B.ankleY],[X(1,42),B.ankleY]]};
  if(shoeE){spec.ank=shoePlace(shoeE).map(s=>s.ank);spec.boots=false}
  const g=mkG('fit-legs');g.dataset.bottom=bot?.id||'';g.dataset.shoe=shoeE?.id||'';g.innerHTML=legsSVG(pfx,spec);return g;
}
// uma peça vira camadas: base (foto/torso) e corpo exposto (braços, pescoço) e, no superior, mangas por cima dos braços
function garmentParts(part,p,pfx){
  const e=CAT[part][p.id],out={soft:[]};
  if(part==='shoe'){const g=mkG('fit-garment fit-shoe',p.id),pl=shoePlace(e);
    // o pé de trás primeiro: a ponta do pé de frente passa por cima do calcanhar do outro
    (e.toe==='L'?pl:pl.slice().reverse()).forEach(s=>{g.innerHTML+=`<ellipse cx="${r1(s.ank[0]-(e.toe==='L'?1:-1)*s.w*.3)}" cy="${B.floor}" rx="${r1(s.w*.5)}" ry="7" fill="url(#${pfx}-drop)"/>`+photo(e.src,s.x,s.y,s.w,s.h)});
    g.style.transformOrigin='210px 920px';out.base=g;return out}
  if(part==='cap'){const g=mkG('fit-garment fit-cap',p.id),c=capPlace(e);g.innerHTML=photo(e.src,c.x,c.y,c.w,c.h);g.style.transformOrigin='214px 90px';out.base=g;return out}
  const pl=part==='top'?placeTop(e):placeBottom(e);
  const g=mkG(`fit-garment fit-${part}`,p.id);g.dataset.kind=e.kind;out.base=g;out.e=e;out.pl=pl;
  if(part==='top'){
    const[hx,hy]=P(pl,e.cx,e.hem),sp=sleevePose(e,pl),c=collarOf(e,pl),limbs=mkG('fit-limbs fit-limbs-top',p.id);
    g.innerHTML=`<ellipse cx="${r1(hx)}" cy="${r1(hy+6)}" rx="${r1(e.hemw*pl.w*.5)}" ry="12" fill="url(#${pfx}-drop)"/>`+photo(e.rig?e.rig.torso:e.src,pl.x,pl.y,pl.w,pl.h);
    limbs.innerHTML=armsSVG(e,pl,pfx,sp);out.limbs=limbs;out.soft.push(limbs);
    if(e.rig){const sl=mkG('fit-sleeves',p.id);
      sl.innerHTML=Object.values(sp).map(s=>photo(s.src,s.box.x,s.box.y,s.box.w,s.box.h,` transform="rotate(${r1(s.th)} ${r1(s.piv[0])} ${r1(s.piv[1])})"`)).join('');
      out.sleeves=sl}
    if(c){const nk=mkG('fit-neck',p.id);nk.innerHTML=neckSVG(pfx,c);out.neck=nk;out.soft.push(nk)}
    g.style.transformOrigin='210px 220px';
  }else{
    g.innerHTML=photo(e.src,pl.x,pl.y,pl.w,pl.h);
    g.style.transformOrigin='210px 480px';
  }
  return out;
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
  <radialGradient id="${pfx}-drop" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="${pfx}-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".6" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>`;
}
function figureSVG(pfx,label){
  return `<svg class="fit-svg" viewBox="0 0 420 1000" role="img" aria-label="${label}" focusable="false">${defsSVG(pfx)}
  <ellipse class="fit-floor" cx="210" cy="${B.floor}" rx="130" ry="15" fill="url(#${pfx}-floor)"/>
  <g class="fit-rig">${bodySVG(pfx)}<g class="fit-layer fit-layer-legs"></g><g class="fit-layer fit-layer-shoe"></g><g class="fit-layer fit-layer-bottom"></g><g class="fit-layer fit-layer-arms"></g><g class="fit-layer fit-layer-top"></g><g class="fit-layer fit-layer-sleeves"></g><g class="fit-layer fit-layer-neck"></g>${headSVG(pfx)}<g class="fit-layer fit-layer-cap"></g></g>
  <g class="fit-scan" aria-hidden="true"><rect x="40" y="-14" width="340" height="28" fill="url(#${pfx}-sc)"/><rect x="40" y="-.75" width="340" height="1.5" fill="#ffd447"/></g></svg>`;
}
// coloca as camadas de uma peça na figura
function placeParts(root,part,o){
  const q=n=>root.querySelector('.fit-layer-'+n);
  q(part).appendChild(o.base);if(o.limbs)q('arms').appendChild(o.limbs);if(o.sleeves)q('sleeves').appendChild(o.sleeves);if(o.neck)q('neck').appendChild(o.neck);
  return[o.base,o.limbs,o.sleeves,o.neck].filter(Boolean);
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
let stage=null,fig=null,figB=null,state={topId:null,bottomId:null,shoeId:null,capId:null},pending=null,flushQueued=false,rev=0,tagTimer=0,gen=0;
// cada parte em cena: id + camadas (foto, membros, mangas) + medidas; as que estão saindo; animações vivas
const live=Object.fromEntries([...PARTS,'legs'].map(k=>[k,{cur:null,anims:[],leaving:[]}]));
const curId=part=>live[part].cur?.id??null;
function entryVector(opts,part){
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
function scan(part,delay=0){
  const el=fig?.querySelector('.fit-scan');if(!el||reduced()||lite()||!el.animate)return;
  const[a,b]=SCAN[part];scanAnim?.cancel();
  scanAnim=el.animate([{opacity:0,transform:`translateY(${a}px)`},{opacity:1,offset:.15},{opacity:1,offset:.8},{opacity:0,transform:`translateY(${b}px)`}],
    {duration:part==='boot'?1300:620,delay,easing:'cubic-bezier(.45,0,.25,1)',fill:'backwards'});
}
// saída de um conjunto de camadas: a peça perde tensão, cede e dissolve; corpo exposto (soft) só esmaece
function leave(L,cur,part,D,T){
  const quick=lite()?.72:1;
  cur.els.forEach(el=>{
    const soft=cur.soft.includes(el),kf=soft?[{opacity:1},{opacity:0}]:[{opacity:1,transform:el.style.transform||'none'},{opacity:0,transform:part==='cap'?'translate(0px,-14px)':part==='shoe'?'translate(0px,10px)':part==='top'?'translate(0px,12px) scale(1,.965)':'translate(0px,16px) scale(1,.97)'}];
    const a=el.animate(kf,{duration:soft?.14*T:300*quick,delay:soft?D+T*.28:0,easing:soft?'linear':'cubic-bezier(.4,0,.8,.6)',fill:'forwards'});
    L.leaving.push(el);a.finished.then(()=>{el.remove();L.leaving=L.leaving.filter(x=>x!==el)}).catch(()=>{});
  });
}
function reset(L){L.leaving.forEach(el=>el.remove());L.leaving=[];L.anims.forEach(a=>{try{a.commitStyles?.()}catch{}a.cancel()});L.anims=[]}
function dress(part,p,opts,delay=0){
  const L=live[part];reset(L);
  const old=L.cur;
  if(!p){L.cur=null;if(old){if(reduced()||!fig.animate)old.els.forEach(el=>el.remove());else leave(L,old,part,delay,DUR[part]*(lite()?.72:1))}return}
  const o=garmentParts(part,p,'fitA'),els=placeParts(fig,part,o);o.base.dataset.rev=String(++rev);
  L.cur={id:p.id,els,soft:o.soft,e:o.e,pl:o.pl};
  if(part==='top')fig.dataset.kind=o.e.kind;
  if(!old&&!opts.animateIn||reduced()||!o.base.animate){old?.els.forEach(el=>el.remove());return}
  const quick=lite()?.72:1,T=DUR[part]*quick,D=delay*quick;
  if(old)leave(L,old,part,D,T);
  // entrada: chega como fantasma a partir do seletor, encosta no corpo e assenta; a pose nova do corpo acende junto
  const[dx,dy]=entryVector(opts,part);
  els.forEach(el=>{
    const a=o.soft.includes(el)?el.animate([{opacity:0},{opacity:0,offset:.42},{opacity:1,offset:.6},{opacity:1}],{duration:T,delay:D,easing:'linear',fill:'backwards'}):
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
  const g=legsGroup('fitA',bc?{id:bc.id,e:bc.e,pl:bc.pl}:null,shoeId?{...CAT.shoe[shoeId],id:shoeId}:null);
  fig.querySelector('.fit-layer-legs').appendChild(g);
  const old=L.cur;L.cur={id:key,els:[g],soft:[g]};
  if(!old||!animate||reduced()||!g.animate){old?.els.forEach(el=>el.remove());return}
  const T=780*(lite()?.72:1),D=delay*(lite()?.72:1);
  leave(L,old,'legs',D,T);
  L.anims.push(g.animate([{opacity:0},{opacity:0,offset:.42},{opacity:1,offset:.6},{opacity:1}],{duration:T,delay:D,easing:'linear',fill:'backwards'}));
}
function describe(){
  const n=k=>byId(state[KEY[k]])?.name;
  return `Manequim GB vestindo ${n('top')} com ${n('bottom')}`+(n('shoe')?`, tênis ${n('shoe')}`:'')+(n('cap')?`, boné ${n('cap')}`:'');
}
function flush(){
  flushQueued=false;const want=pending;pending=null;if(!want||!fig)return;
  const opts=want.opts||{};
  state={topId:want.topId,bottomId:want.bottomId,shoeId:want.shoeId,capId:want.capId};
  PARTS.forEach(k=>{if(state[KEY[k]])fig.dataset[k]=state[KEY[k]];else delete fig.dataset[k]});
  const my=++gen;
  const valid=k=>{const id=state[KEY[k]];return id==null?(k==='shoe'||k==='cap'):!!(byId(id)&&CAT[k][id])};
  const changed=PARTS.filter(k=>valid(k)&&(state[KEY[k]]??null)!==curId(k));
  const tb=changed.filter(k=>k==='top'||k==='bottom');
  // a fase anuncia a troca na hora do pedido; a foto entra decodificada (sem piscar) e a última escolha vence
  if(stage.dataset.phase!=='comparing'&&changed.length)stage.dataset.phase=reduced()?'reduced-motion':tb.length===2?'switching-both':changed.length>1?'switching-both':'switching-'+changed[0];
  clearTimeout(flush.idle);
  Promise.all(PARTS.map(k=>state[KEY[k]]?preload(k,state[KEY[k]]):null)).then(()=>{if(my!==gen)return;
    let d=0;const delays={};
    changed.forEach(k=>{delays[k]=d;dress(k,state[KEY[k]]?byId(state[KEY[k]]):null,{...opts,animateIn:true},d);d+=120});
    if(changed.length)scan(changed.length>1?'boot':changed[0],(lite()?.72:1)*320);
    if(changed.includes('bottom')||changed.includes('shoe'))swapLegs(Math.min(delays.bottom??99999,delays.shoe??99999));
    fig.querySelector('.fit-svg')?.setAttribute('aria-label',describe());
    if(changed.length)showTag(changed,opts);
    clearTimeout(flush.idle);flush.idle=setTimeout(()=>{if(stage.dataset.phase!=='comparing')stage.dataset.phase=reduced()?'reduced-motion':'idle'},changed.length>1?1000+120*(changed.length-2):860);
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
  pending={topId:next.topId||base.topId,bottomId:next.bottomId||base.bottomId,shoeId:pick('shoe'),capId:pick('cap'),opts:{...(pending?.opts||{}),...opts}};
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
  figB.querySelector('.fit-layer-legs').appendChild(legsGroup('fitB',{id:bp.id,e:ob.e,pl:ob.pl},sh?{...CAT.shoe[sh],id:sh}:null));
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

/* ============================== MONTAGEM ============================== */
function mount(el,initial){
  stage=el;if(!stage||stage.querySelector('.fit-figure'))return;
  stage.classList.add('has-fit');
  const scene=document.createElement('div');scene.className='fit-scene';
  scene.innerHTML=`<div class="fit-backdrop" aria-hidden="true"><i class="fit-key"></i><i class="fit-rim"></i><i class="fit-horizon"></i></div>
   <div class="fit-figure" id="gbFitFigure">${figureSVG('fitA','Manequim GB vestindo o look selecionado')}</div>
   <p class="fit-tag" aria-hidden="true"></p>
   <p class="fit-legal">SIMULAÇÃO EDITORIAL DE COMPOSIÇÃO · FOTOS REAIS DO ACERVO GB · NÃO É PROVADOR DE CAIMENTO</p>
   <div class="fit-compare" hidden><div class="fit-cmp-a"></div><div class="fit-cmp-b"></div><span class="fit-split-line" aria-hidden="true"><i>A | B</i></span><label class="fit-split"><span class="sr-only">Divisor entre o look A (atual) e o look B (salvo)</span><input type="range" min="8" max="92" value="50" step="1"></label></div>`;
  stage.prepend(scene);
  fig=scene.querySelector('.fit-figure');
  // áreas de encaixe acompanham o corpo (soltar peça / feedback de encaixe)
  stage.querySelectorAll('.look-dock').forEach(d=>fig.appendChild(d));
  const range=scene.querySelector('.fit-split input');
  range.addEventListener('input',()=>setSplit(range.value));
  // arrastar o divisor diretamente sobre o palco (mouse e toque)
  if(M)M.drag(scene,{axis:'x',threshold:6,ignore:'button,input',
    onMove(dx,s){if(!stage.classList.contains('is-fit-compare'))return;const r=fig.getBoundingClientRect();const v=Math.max(8,Math.min(92,(s.lx-r.left)/r.width*100));range.value=String(Math.round(v));setSplit(v)}});
  // primeira roupa sem animação; o palco "acorda" quando entra em cena
  const t=byId(initial.topId),b=byId(initial.bottomId);
  state={topId:initial.topId,bottomId:initial.bottomId,shoeId:initial.shoeId&&CAT.shoe[initial.shoeId]?initial.shoeId:null,capId:initial.capId&&CAT.cap[initial.capId]?initial.capId:null};
  for(const part of['bottom','top','shoe','cap']){const p=byId(state[KEY[part]]);if(p&&CAT[part][p.id]){dress(part,p,{});preload(part,p.id);fig.dataset[part]=p.id}}
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
window.GBFitting={mount,set,compare,preload:preloadSoon,ready:readyAll,get state(){return{...state}},zones:B.zones,RIG:B,FIT,SHOE,CAP,catalog:CAT};
})();
