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

/* ============================== CORPO (viewBox 420×1000, 8 cabeças de 111, chão em y=948) ==============================
   Proporção humana: ombro a 1,4 cabeça, umbigo a 3, gancho a 4, joelho a 6. O que aparece por fora da roupa
   (cabeça, pescoço, braços, mãos, pernas, pés) é desenhado com cuidado; o tronco fica sob a peça. */
const B={cx:210,crown:58,chin:171,shoulderY:212,shL:[118,236],shR:[302,236],navel:392,waistY:430,
  hipL:[166,506],hipR:[254,506],kneeY:728,ankleY:904,floor:948,
  zones:{top:[90,176,240,340],bottom:[118,420,184,490]}};
// alvos da roupa sobre o corpo: superior pela linha dos ombros, inferior pelo cós (folga de streetwear incluída)
const FIT={top:{shoulder:232,lineY:212,kindDy:{hoodie:6,jacket:4,sweatshirt:0,longsleeve:0,tee:0,polo:0,jersey:0}},
  bottom:{waist:184,waistY:430,pantsHem:896},armTilt:11,
  kindScale:{hoodie:1,jacket:1.02,sweatshirt:1,longsleeve:.98,tee:1,polo:1,jersey:1,pants:1,shorts:1}};
const HEAD_R=[[210,58],[226,59.5],[239,65],[247,75],[251,88],[252,102],[251,114],[250,125],[248,135],[245,145],[240,154],[234,161],[226,167],[218,170.5],[210,171.5]];
const HEAD=[...HEAD_R,...mirror(HEAD_R).reverse().slice(1,-1)];
const TORSO_R=[[210,198],[228,202],[250,210],[268,220],[278,236],[280,258],[276,290],[272,340],[268,380],[270,420],[276,460],[278,492],[270,512],[252,524],[232,530],[210,532]];
const TORSO=[...TORSO_R,...mirror(TORSO_R).reverse().slice(1,-1)];
const seam=(d,o=.45,w=1.2)=>`<path d="${d}" fill="none" stroke="#1d2126" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const shine=(d,o=.5,w=2.4)=>`<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const both=f=>f(-1)+f(1);
const X=(side,dx)=>210+side*dx;

// membro afunilado ao longo de uma polilinha [x,y,meia-largura], pontas arredondadas
function limb(pts){
  const Lp=[],Rp=[],n=pts.length,dir=i=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[(b[0]-a[0])/l,(b[1]-a[1])/l]};
  pts.forEach((p,i)=>{const[dx,dy]=dir(i);Lp.push([p[0]-dy*p[2],p[1]+dx*p[2]]);Rp.push([p[0]+dy*p[2],p[1]-dx*p[2]])});
  const[ex,ey]=dir(n-1),[sx,sy]=dir(0),e=pts[n-1],s=pts[0];
  return smooth([...Lp,[e[0]+ex*e[2]*.75,e[1]+ey*e[2]*.75],...Rp.reverse(),[s[0]-sx*s[2]*.6,s[1]-sy*s[2]*.6]]);
}
const along=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];

function headSVG(pfx){
  const h=smooth(HEAD);
  return `<g class="fit-head">`+
    // orelhas (módulos), atrás do crânio
    both(s=>`<path d="M${X(s,46)} 113C${X(s,51.5)} 115 ${X(s,52)} 132 ${X(s,47)} 140C${X(s,45)} 138 ${X(s,44.5)} 117 ${X(s,46)} 113Z" fill="url(#${pfx}-mt)"/>`+seam(`M${X(s,48)} 120C${X(s,49.5)} 126 ${X(s,49.5)} 131 ${X(s,47.5)} 135`,.4,.9))+
    `<path d="${h}" fill="url(#${pfx}-mh)"/>`+
    // sombreado de volume: têmporas, maçãs, mandíbula
    both(s=>`<ellipse cx="${X(s,31)}" cy="141" rx="9" ry="15" fill="#1d2126" opacity=".13"/><ellipse cx="${X(s,37)}" cy="104" rx="7" ry="14" fill="#1d2126" opacity=".1"/>`)+
    `<ellipse cx="210" cy="96" rx="27" ry="20" fill="#fff" opacity=".18"/>`+
    // placa do rosto e articulação da mandíbula
    seam('M177 97Q210 84 243 97',.3,1)+both(s=>seam(`M${X(s,33)} 97C${X(s,35)} 116 ${X(s,34)} 134 ${X(s,27)} 152C${X(s,21)} 161 ${X(s,12)} 166 210 167`,.28,1))+
    both(s=>seam(`M${X(s,46)} 139L${X(s,37)} 157`,.4,1.2))+
    // sobrancelha, órbitas e olhos (vidro escuro com íris GB)
    both(s=>`<ellipse cx="${X(s,15)}" cy="117" rx="14" ry="8" fill="#14171b" opacity=".16"/>`+seam(`M${X(s,4)} 108Q${X(s,15)} 102 ${X(s,27)} 108`,.42,2))+
    both(s=>`<path d="M${X(s,5)} 117Q${X(s,15)} 110.5 ${X(s,25)} 117Q${X(s,15)} 121.5 ${X(s,5)} 117Z" fill="url(#${pfx}-vs)"/><circle cx="${X(s,15)}" cy="116.6" r="2.7" fill="#ffd447" opacity=".9"/><circle cx="${X(s,13.6)}" cy="115.4" r=".9" fill="#fff" opacity=".85"/>`)+
    // nariz, boca e queixo
    shine('M210 113V132',.42,2)+seam('M203.5 137.5Q210 142 216.5 137.5',.45,1.3)+both(s=>seam(`M${X(s,7)} 134Q${X(s,8.5)} 137 ${X(s,6.5)} 139`,.3,1))+
    seam('M199.5 150.6Q210 152.2 220.5 150.6',.6,1.5)+seam('M206 147.2Q210 146.2 214 147.2',.25,.9)+shine('M203.5 155.6Q210 157.4 216.5 155.6',.45,1.6)+`<ellipse cx="210" cy="163" rx="8" ry="3.6" fill="#fff" opacity=".28"/>`+
    // emenda do crânio e brilho de topo
    seam('M182 72Q210 61 238 72',.25,1)+shine('M186 70Q198 62 214 61',.75,3)+
  `</g>`;
}
// pescoço: cilindro com tendões e anéis, abrindo no trapézio
const NECK='M193 150L191.5 194Q174 204 150 213L270 213Q246 204 228.5 194L227 150Z';
const neckSVG=pfx=>`<path d="${NECK}" fill="url(#${pfx}-mt)"/>`+seam('M193 171H227',.35)+seam('M192.5 184H227.5',.3)+both(s=>seam(`M${X(s,11)} 154L${X(s,6)} 196`,.22));
// pescoço por cima da peça (capuz: o pescoço fica à frente do forro), base em sombra
const neckFrontSVG=pfx=>`<g class="fit-neck-front"><path d="M193 150L192 201Q210 208 228 201L227 150Z" fill="url(#${pfx}-mt)"/>`+seam('M193 171H227',.35)+seam('M192.5 186H227.5',.3)+
  `<ellipse cx="210" cy="203" rx="22" ry="6" fill="#000" opacity=".38"/></g>`;
function bodySVG(pfx){
  return `<g class="fit-body">`+neckSVG(pfx)+
    `<path d="${smooth(TORSO)}" fill="url(#${pfx}-mt)"/>`+
    seam('M168 262Q190 284 210 280Q230 284 252 262',.4)+seam('M210 206V530',.28)+
    [330,360,390].map(y=>seam(`M186 ${y}Q210 ${y+6} 234 ${y}`,.3)).join('')+
  `</g>`;
}
// mão relaxada vista de frente: lâmina da mão de lado, polegar à frente voltado ao corpo; aponta +y a partir do punho
function handSVG(pfx,x,y,deg,side,s=1){
  const t=-side,blade=smooth([[-9.5,-3],[9.5,-3],[12,10],[13,27],[12,42],[10.5,55],[7.5,66],[2,73],[-3.5,72],[-8,64],[-11,50],[-12.5,32],[-12,12]]);
  return `<g class="fit-hand" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(deg)}) scale(${s})">`+
    `<path d="${blade}" fill="url(#${pfx}-mt)"/>`+seam('M-11 40Q0 45 11.5 40',.32,1)+seam('M-9 54Q0 58 9.5 54',.28,.9)+seam('M-4 46L-5.5 70',.22,.8)+seam('M3 46L4 71',.22,.8)+
    `<path d="${capsule(t*3.5,9,5.2,t*8,43,4.2)}" fill="url(#${pfx}-mh)"/>`+seam(`M${t*4.5} 30L${t*9.5} 28`,.4,.9)+
    `<rect x="-9.5" y="-6" width="19" height="8" rx="3" fill="#2a2f36"/>`+seam('M-9 1.5H9',.45,1)+
  `</g>`;
}
// pés: bota robótica de frente, bico levemente para fora
function footSVG(pfx,ax,side){
  const o=side*3,y=B.ankleY;
  return `<path d="M${ax-11} ${y-6}H${ax+11}C${ax+14+o} ${y+12} ${ax+21+o} ${y+24} ${ax+22+o} ${y+36}C${ax+22+o} ${y+42} ${ax+18+o} ${y+44} ${ax+12+o} ${y+44}H${ax-12+o}C${ax-18+o} ${y+44} ${ax-22+o} ${y+42} ${ax-22+o} ${y+36}C${ax-21+o} ${y+24} ${ax-14} ${y+12} ${ax-11} ${y-6}Z" fill="url(#${pfx}-mt)"/>`+
    `<ellipse cx="${ax+o}" cy="${y+34}" rx="15" ry="6" fill="#fff" opacity=".22"/>`+seam(`M${ax-17+o} ${y+22}Q${ax+o} ${y+17} ${ax+17+o} ${y+22}`,.35,1.1)+
    `<path d="M${ax-22+o} ${y+38}H${ax+22+o}V${y+44}Q${ax+o} ${y+46} ${ax-22+o} ${y+44}Z" fill="#1b1e23"/>`;
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
// braço que sai da manga curta: ombro escondido na manga, cotovelo na altura do umbigo, antebraço caindo junto ao quadril
function shortArm(pfx,sp){
  const{side,O,n}=sp,hw=Math.max(13,Math.min(18,sp.ow*.36)),S=[O[0]-n[0]*34,O[1]-n[1]*34];
  const t=Math.max(36,Math.min(170,(B.navel-O[1])/Math.max(.5,n[1]))),E=[O[0]+n[0]*t,O[1]+n[1]*t];
  const a2=Math.atan2(n[0],n[1])*.3,d2=[Math.sin(a2),Math.cos(a2)],Wr=[E[0]+d2[0]*128,E[1]+d2[1]*128];
  const f1=along(E,Wr,.3);
  return `<path d="${limb([[...S,hw],[...O,hw*.94],[...along(O,E,.6),hw*.86],[...E,12.5]])}" fill="url(#${pfx}-mt)"/>`+
    seam(`M${r1(along(O,E,.35)[0]-side*hw*.55)} ${r1(along(O,E,.35)[1])}L${r1(E[0]-side*7)} ${r1(E[1]-8)}`,.22,1)+
    `<path d="${limb([[...E,12.5],[...f1,13.4],[...along(E,Wr,.7),11],[...Wr,9.4]])}" fill="url(#${pfx}-mt)"/>`+
    `<circle cx="${r1(E[0])}" cy="${r1(E[1])}" r="12.4" fill="url(#${pfx}-mh)"/>`+seam(`M${r1(E[0]-8)} ${r1(E[1]+3)}Q${r1(E[0])} ${r1(E[1]+8)} ${r1(E[0]+8)} ${r1(E[1]+3)}`,.35)+
    seam(`M${r1(f1[0]-6)} ${r1(f1[1])}Q${r1(f1[0])} ${r1(f1[1]+3)} ${r1(f1[0]+6)} ${r1(f1[1])}`,.3,1)+
    handSVG(pfx,Wr[0],Wr[1]+2,-a2*180/Math.PI*.6,side);
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
// pernas humanas: coxa, joelho, panturrilha e tornozelo; o tornozelo segue a boca da calça (bermuda: pernas naturais)
const LEG=[[0,34],[.14,32.5],[.3,28.5],[.46,22.5],[.555,18.6],[.6,19.6],[.67,23.6],[.74,23],[.83,17.2],[.92,12.2],[1,10.6]];
function legsSVG(e,pl,pfx){
  const c=e.waist.l+(e.waist.r-e.waist.l)/2,open=e.legs.map(l=>P(pl,l.x,l.y)[0]);
  const sep=e.kind==='pants'&&open.length>1&&open[0]<B.cx&&open[1]>B.cx?Math.max(30,Math.min(68,(open[1]-open[0])/2)):38;
  return e.legs.slice(0,2).map((lg,i)=>{
    const side=i?1:-1,[hx,hy]=side<0?B.hipL:B.hipR,ax=X(side,sep),kx=hx+(ax-hx)*.56,ky=B.kneeY,ay=B.ankleY;
    const xAt=y=>y<=ky?hx+(kx-hx)*(y-hy)/(ky-hy):kx+(ax-kx)*(y-ky)/(ay-ky);
    const L=[],R=[];
    for(const[t,w]of LEG){const y=hy+t*(ay-hy),x=xAt(y),wo=w*(t>.6&&t<.8?1.08:1);L.push([x+side*wo,y]);R.push([x-side*w,y])}
    const d=smooth([...L,[ax,ay+4],...R.reverse(),[hx,hy-20]]);
    return `<g class="fit-leg"><path d="${d}" fill="url(#${pfx}-mt)"/>`+
      seam(`M${r1(xAt(hy+60)+side*20)} ${hy+60}Q${r1(xAt(640)+side*14)} 640 ${r1(kx+side*13)} ${ky-26}`,.22,1)+
      `<path d="M${r1(kx-14)} ${ky-14}Q${r1(kx)} ${ky-24} ${r1(kx+14)} ${ky-14}L${r1(kx+12)} ${ky+12}Q${r1(kx)} ${ky+20} ${r1(kx-12)} ${ky+12}Z" fill="url(#${pfx}-mh)"/>`+
      seam(`M${r1(kx-11)} ${ky+14}Q${r1(kx)} ${ky+22} ${r1(kx+11)} ${ky+14}`,.4,1.1)+
      shine(`M${r1(xAt(770)-side*5)} 772L${r1(xAt(860)-side*3)} 862`,.35,2)+
      `<rect x="${r1(ax-11)}" y="${ay-12}" width="22" height="9" rx="3" fill="#2a2f36"/>`+footSVG(pfx,ax,side)+`</g>`;
  }).join('');
}
// uma peça vira até três camadas: base (foto/torso), membros (braços ou pernas) e mangas por cima dos braços
function garmentParts(part,p,pfx){
  const e=CAT[part][p.id],pl=part==='top'?placeTop(e):placeBottom(e),mk=cls=>{const g=document.createElementNS(NS,'g');g.setAttribute('class',cls);return g};
  const img=(src,x,y,w,h,extra='')=>`<image class="fit-photo" href="${src}" x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" preserveAspectRatio="none"${extra}/>`;
  const g=mk(`fit-garment fit-${part}`);g.dataset.product=p.id;g.dataset.kind=e.kind;
  const limbs=mk(`fit-limbs fit-limbs-${part}`);limbs.dataset.product=p.id;
  const out={base:g,limbs,neck:part==='top'&&e.kind==='hoodie'?'front':'back'};
  if(part==='top'){
    const[hx,hy]=P(pl,e.cx,e.hem),sp=sleevePose(e,pl);
    g.innerHTML=`<ellipse cx="${r1(hx)}" cy="${r1(hy+6)}" rx="${r1(e.hemw*pl.w*.5)}" ry="12" fill="url(#${pfx}-drop)"/>`+img(e.rig?e.rig.torso:e.src,pl.x,pl.y,pl.w,pl.h);
    limbs.innerHTML=armsSVG(e,pl,pfx,sp);
    if(e.rig){const sl=mk('fit-sleeves');sl.dataset.product=p.id;
      sl.innerHTML=Object.values(sp).map(s=>img(s.src,s.box.x,s.box.y,s.box.w,s.box.h,` transform="rotate(${r1(s.th)} ${r1(s.piv[0])} ${r1(s.piv[1])})"`)).join('');
      out.sleeves=sl}
    g.style.transformOrigin='210px 220px';
  }else{
    g.innerHTML=img(e.src,pl.x,pl.y,pl.w,pl.h);limbs.innerHTML=legsSVG(e,pl,pfx);
    g.style.transformOrigin='210px 480px';
  }
  return out;
}
const srcsOf=e=>e.rig?[e.rig.torso,e.rig.l?.src,e.rig.r?.src].filter(Boolean):[e.src];

function defsSVG(pfx){
  return `<defs>
  <linearGradient id="${pfx}-mt" x1="0" x2="1"><stop offset="0" stop-color="#3f454d"/><stop offset=".16" stop-color="#8d96a1"/><stop offset=".36" stop-color="#e4e8ed"/><stop offset=".47" stop-color="#ffffff"/><stop offset=".6" stop-color="#bfc6ce"/><stop offset=".84" stop-color="#6f7782"/><stop offset="1" stop-color="#363b42"/></linearGradient>
  <radialGradient id="${pfx}-mh" cx=".4" cy=".32" r=".8"><stop offset="0" stop-color="#ffffff"/><stop offset=".32" stop-color="#e2e6eb"/><stop offset=".7" stop-color="#9aa3ad"/><stop offset="1" stop-color="#4e545c"/></radialGradient>
  <linearGradient id="${pfx}-vs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3038"/><stop offset=".5" stop-color="#0c0e11"/><stop offset="1" stop-color="#1a1d22"/></linearGradient>
  <radialGradient id="${pfx}-drop" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <radialGradient id="${pfx}-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".6" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  </defs>`;
}
function figureSVG(pfx,label){
  return `<svg class="fit-svg" viewBox="0 0 420 1000" role="img" aria-label="${label}" focusable="false">${defsSVG(pfx)}
  <ellipse class="fit-floor" cx="210" cy="${B.floor}" rx="130" ry="15" fill="url(#${pfx}-floor)"/>
  <g class="fit-rig">${bodySVG(pfx)}<g class="fit-layer fit-layer-legs"></g><g class="fit-layer fit-layer-bottom"></g><g class="fit-layer fit-layer-arms"></g><g class="fit-layer fit-layer-top"></g><g class="fit-layer fit-layer-sleeves"></g>${neckFrontSVG(pfx)}${headSVG(pfx)}</g></svg>`;
}
// coloca as camadas de uma peça na figura
function placeParts(root,part,o){
  const q=n=>root.querySelector('.fit-layer-'+n);
  q(part).appendChild(o.base);q(part==='top'?'arms':'legs').appendChild(o.limbs);if(o.sleeves)q('sleeves').appendChild(o.sleeves);
  if(part==='top')root.dataset.neck=o.neck;
  return[o.base,o.limbs,o.sleeves].filter(Boolean);
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
let stage=null,fig=null,figB=null,state={topId:null,bottomId:null},pending=null,flushQueued=false,rev=0,tagTimer=0,gen=0;
// cada parte em cena: id + camadas (foto, membros, mangas); as que estão saindo; animações vivas
const live={top:{cur:null,anims:[],leaving:[]},bottom:{cur:null,anims:[],leaving:[]}};
const curId=part=>live[part].cur?.id;
function entryVector(opts){
  if(opts.from&&fig){const r=fig.getBoundingClientRect(),sx=420/r.width;const dx=(opts.from.x-(r.left+r.width/2))*sx,dy=(opts.from.y-(r.top+r.height*.4))*sx;return[Math.max(-140,Math.min(140,dx*.5)),Math.max(-120,Math.min(160,dy*.5))]}
  if(opts.dir)return[opts.dir*70,-12];
  return innerWidth<781?[0,90]:[84,-18]; // seletores à direita no desktop, abaixo no mobile
}
function dress(part,p,opts,delay=0){
  const L=live[part];
  // a última escolha vence: quem já estava saindo some, a peça em cena sai do estado atual
  L.leaving.forEach(el=>el.remove());L.leaving=[];
  L.anims.forEach(a=>{try{a.commitStyles?.()}catch{}a.cancel()});L.anims=[];
  const old=L.cur,o=garmentParts(part,p,'fitA'),els=placeParts(fig,part,o);o.base.dataset.rev=String(++rev);
  L.cur={id:p.id,els,limbs:o.limbs};
  if(!old)return;
  if(reduced()||!o.base.animate){old.els.forEach(el=>el.remove());return}
  const quick=lite()?.72:1,T=(part==='top'?760:780)*quick,D=delay*quick;
  // saída: a peça perde tensão, cede e dissolve; o corpo sob ela (braços/pernas da pose anterior) só esmaece
  old.els.forEach(el=>{
    const limb=el===old.limbs,kf=limb?[{opacity:1},{opacity:0}]:[{opacity:1,transform:el.style.transform||'none'},{opacity:0,transform:part==='top'?'translate(0px,12px) scale(1,.965)':'translate(0px,16px) scale(1,.97)'}];
    const a=el.animate(kf,{duration:(limb?.14*T:300*quick),delay:limb?D+T*.28:0,easing:limb?'linear':'cubic-bezier(.4,0,.8,.6)',fill:'forwards'});
    L.leaving.push(el);a.finished.then(()=>{el.remove();L.leaving=L.leaving.filter(x=>x!==el)}).catch(()=>{});
  });
  // entrada: chega como fantasma a partir do seletor, encosta no corpo e assenta; a pose nova do corpo acende junto
  const[dx,dy]=entryVector(opts);
  els.forEach(el=>{
    const a=el===o.limbs?el.animate([{opacity:0},{opacity:0,offset:.42},{opacity:1,offset:.6},{opacity:1}],{duration:T,delay:D,easing:'linear',fill:'backwards'}):
      el.animate([
      {opacity:0,transform:`translate(${dx}px,${dy}px) scale(1.07)`},
      {opacity:.5,offset:.32,transform:`translate(${dx*.22}px,${dy*.22}px) scale(1.02)`},
      {opacity:1,offset:.68,transform:'translate(0px,-3px) scale(.992)'},
      {opacity:1,transform:'translate(0px,0px) scale(1)'}],{duration:T,delay:D,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'});
    L.anims.push(a);
  });
}
function flush(){
  flushQueued=false;const want=pending;pending=null;if(!want||!fig)return;
  const t=byId(want.topId),b=byId(want.bottomId),opts=want.opts||{};
  state={topId:want.topId,bottomId:want.bottomId};
  fig.dataset.top=state.topId;fig.dataset.bottom=state.bottomId;
  const my=++gen;
  const topChanged=t&&CAT.top[t.id]&&t.id!==curId('top'),botChanged=b&&CAT.bottom[b.id]&&b.id!==curId('bottom'),both=topChanged&&botChanged;
  // a fase anuncia a troca na hora do pedido; a foto entra decodificada (sem piscar) e a última escolha vence
  if(stage.dataset.phase!=='comparing')stage.dataset.phase=reduced()?'reduced-motion':both?'switching-both':topChanged?'switching-top':botChanged?'switching-bottom':stage.dataset.phase;
  clearTimeout(flush.idle);
  Promise.all([preload('top',want.topId),preload('bottom',want.bottomId)]).then(()=>{if(my!==gen)return;
    if(topChanged)dress('top',t,opts,0);
    if(botChanged)dress('bottom',b,opts,both?120:0);
    if(t&&b)fig.querySelector('.fit-svg')?.setAttribute('aria-label',`Manequim GB vestindo ${t.name} com ${b.name}`);
    if(topChanged||botChanged)showTag(both?'both':topChanged?'top':'bottom',t,b,opts);
    clearTimeout(flush.idle);flush.idle=setTimeout(()=>{if(stage.dataset.phase!=='comparing')stage.dataset.phase=reduced()?'reduced-motion':'idle'},both?1000:860);
  });
}
const partName=(p,part)=>p.name+(CAT.top[p.id]&&CAT.bottom[p.id]?(part==='top'?' — superior':' — inferior'):'');
function showTag(part,t,b,opts){
  const tag=stage.querySelector('.fit-tag');if(!tag||opts.silent)return;
  tag.innerHTML=part==='both'?`<b>MIX</b><span>${escaped(partName(t,'top'))} + ${escaped(partName(b,'bottom'))}</span>`:`<b>${part==='top'?'SUPERIOR':'INFERIOR'}</b><span>${escaped(part==='top'?partName(t,'top'):partName(b,'bottom'))}</span>`;
  tag.dataset.part=part;tag.classList.remove('is-on');void tag.offsetWidth;tag.classList.add('is-on');
  clearTimeout(tagTimer);tagTimer=setTimeout(()=>tag.classList.remove('is-on'),1700);
}
function set(next,opts={}){
  pending={topId:next.topId||state.topId,bottomId:next.bottomId||state.bottomId,opts:{...(pending?.opts||{}),...opts}};
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
  placeParts(figB,'bottom',garmentParts('bottom',bp,'fitB'));placeParts(figB,'top',garmentParts('top',tp,'fitB'));
  figB.dataset.top=tp.id;figB.dataset.bottom=bp.id;
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
  for(const[part,p]of[['bottom',b],['top',t]])if(p&&CAT[part][p.id]){const o=garmentParts(part,p,'fitA');live[part].cur={id:p.id,els:placeParts(fig,part,o),limbs:o.limbs}}
  preload('top',initial.topId);preload('bottom',initial.bottomId);
  state={topId:initial.topId,bottomId:initial.bottomId};fig.dataset.top=state.topId;fig.dataset.bottom=state.bottomId;
  if(t&&b)fig.querySelector('.fit-svg')?.setAttribute('aria-label',`Manequim GB vestindo ${t.name} com ${b.name}`);
  stage.dataset.phase=reduced()?'reduced-motion':'entering';
  const wake=()=>{stage.classList.add('is-awake');awake=true;later.splice(0).forEach(([p,i])=>preloadSoon(p,i));setTimeout(()=>{if(stage.dataset.phase==='entering')stage.dataset.phase='idle'},1100)};
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
window.GBFitting={mount,set,compare,preload:preloadSoon,ready:readyAll,get state(){return{...state}},zones:B.zones,RIG:B,FIT,catalog:CAT};
})();
