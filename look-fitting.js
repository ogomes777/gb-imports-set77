/* GB IMPORTS / V09 — GB FIT STUDIO
 * Provador editorial: UM manequim autoral persistente, de corpo inteiro, que VESTE o superior e o
 * inferior escolhidos. As roupas são geradas a partir das mesmas âncoras anatômicas do rig (ombro,
 * cotovelo, punho, cintura, quadril, joelho, tornozelo), em camadas com oclusão — não são duas
 * imagens soltas. Interpretação editorial declarada como estudo: não é provador de caimento real.
 *
 * Contrato público
 *   GBFitting.set({topId,bottomId}, {changedPart:'top'|'bottom'|'both', source, from:{x,y}})
 *   GBFitting.compare(on, {top,bottom})       comparação A/B com divisor (mesma escala e pose)
 *   evento 'gb:look-change' {topId,bottomId,changedPart,source}  (disparado pelo v03.js)
 * Depende de main.js (PRODUCTS, escaped) e motion-core.js (GBMotion). Sem dependências externas.
 */
(()=>{
'use strict';
const M=window.GBMotion;
if(typeof PRODUCTS==='undefined')return;
const NS='http://www.w3.org/2000/svg';
const byId=id=>PRODUCTS.find(p=>p.id===id);
const reduced=()=>!!(M?M.Prefs.reduced:matchMedia('(prefers-reduced-motion: reduce)').matches);
const lite=()=>!!M?.Prefs.lite;
const r1=n=>Math.round(n*10)/10;

/* ============================== GEOMETRIA ============================== */
// Catmull-Rom → Bézier. Pontos {x,y,sharp?}. Fechado por padrão.
function smooth(pts,closed=true){
  const P=pts.map(p=>Array.isArray(p)?{x:p[0],y:p[1],sharp:p[2]==='s'}:p),n=P.length;
  const at=i=>closed?P[(i+n)%n]:P[Math.max(0,Math.min(n-1,i))];
  let d=`M${r1(P[0].x)} ${r1(P[0].y)}`;
  const last=closed?n:n-1;
  for(let i=0;i<last;i++){
    const p0=at(i-1),p1=at(i),p2=at(i+1),p3=at(i+2);
    const k1=p1.sharp?0:1/6,k2=p2.sharp?0:1/6;
    d+=`C${r1(p1.x+(p2.x-p0.x)*k1)} ${r1(p1.y+(p2.y-p0.y)*k1)} ${r1(p2.x-(p3.x-p1.x)*k2)} ${r1(p2.y-(p3.y-p1.y)*k2)} ${r1(p2.x)} ${r1(p2.y)}`;
  }
  return closed?d+'Z':d;
}
// Tubo anatômico por articulações [x,y,raio]: membros do corpo e mangas/pernas das roupas.
function tubePoints(J,{capStart=true,capEnd=true}={}){
  const L=[],R=[],n=J.length;
  for(let i=0;i<n;i++){
    const a=J[Math.max(0,i-1)],b=J[Math.min(n-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const len=Math.hypot(dx,dy)||1;dx/=len;dy/=len;
    const nx=-dy,ny=dx,r=J[i][2];
    L.push({x:J[i][0]+nx*r,y:J[i][1]+ny*r,sharp:(!capStart&&i===0)||(!capEnd&&i===n-1)});
    R.push({x:J[i][0]-nx*r,y:J[i][1]-ny*r,sharp:(!capStart&&i===0)||(!capEnd&&i===n-1)});
  }
  const dir=(i,j)=>{const dx=J[j][0]-J[i][0],dy=J[j][1]-J[i][1],l=Math.hypot(dx,dy)||1;return[dx/l,dy/l]};
  const out=[...L];
  if(capEnd){const[dx,dy]=dir(n-2,n-1),r=J[n-1][2];out.push({x:J[n-1][0]+dx*r*.92,y:J[n-1][1]+dy*r*.92})}
  out.push(...R.reverse());
  if(capStart){const[dx,dy]=dir(0,1),r=J[0][2];out.push({x:J[0][0]-dx*r*.92,y:J[0][1]-dy*r*.92})}
  return out;
}
const tube=(J,o)=>smooth(tubePoints(J,o));
// Linha ao longo da lateral de um tubo (listras, costuras): lado +1/-1, recuo da borda.
function sideLine(J,side,inset){
  const n=J.length,pts=[];
  for(let i=0;i<n;i++){const a=J[Math.max(0,i-1)],b=J[Math.min(n-1,i+1)];let dx=b[0]-a[0],dy=b[1]-a[1];const l=Math.hypot(dx,dy)||1;dx/=l;dy/=l;
    const r=J[i][2]-inset;pts.push({x:J[i][0]-dy*r*side,y:J[i][1]+dx*r*side})}
  return smooth(pts,false);
}

/* ============================== RIG (pose editorial neutra) ============================== */
// viewBox 0 0 420 1000 · ~9 cabeças · chão em y=948 · peso levemente na perna direita
const RIG={
  head:{cx:210,cy:96,rx:35.5,ry:46.5,rot:-3},
  neck:[[210,134,16.5],[210,192,21]],
  torso:[[190,184],[164,189],[139,197],[125,211],[121,232],[129,262],[137,296],[143,344],[147,392],[147,420],[143,452],[138,488],[138,520],[150,552],[178,571],[210,577],[242,571],[270,552],[282,520],[282,488],[277,452],[273,420],[273,392],[277,344],[283,296],[291,262],[299,232],[295,211],[281,197],[256,189],[230,184]],
  armL:[[135,220,20.5],[107,418,14],[100,578,10.5]],
  armR:[[285,220,20.5],[313,416,14],[320,576,10.5]],
  legL:[[174,520,37],[174,712,20.5],[175,778,22.5],[177,897,11.5]],
  legR:[[246,520,37],[246,712,20.5],[246,778,22.5],[249,897,11.5]],
  wristL:[100,578],wristR:[320,576],ankleL:[177,897],ankleR:[249,897],floor:948,
  // zonas de encaixe (para áreas de soltar e feedback)
  zones:{top:[86,140,248,440],bottom:[124,476,172,430]},
};
function handPath(wx,wy,side){ // side -1 = mão esquerda (polegar para +x), +1 = direita
  const s=-side;const P=[[wx-10*s,wy-5],[wx+10*s,wy-5],[wx+12*s,wy+12],[wx+16*s,wy+22],[wx+15*s,wy+30],[wx+10*s,wy+31],[wx+11*s,wy+46],[wx+6*s,wy+60],[wx-2*s,wy+64],[wx-9*s,wy+55],[wx-12*s,wy+30]];
  return smooth(P);
}
function shoePath(ax,ay,toe){ // vista frontal, bico levemente para fora
  return smooth([[ax-19,ay-1],[ax+19,ay-1],[ax+25+toe,ay+20],[ax+29+toe,ay+38],[ax+21+toe,ay+50],[ax-16+toe,ay+50],[ax-27+toe,ay+40],[ax-24,ay+19]]);
}

/* ============================== MAPA DE VESTUÁRIO ============================== */
// Por categoria; GB_FIT_OVERRIDES[productId] ajusta por SKU quando houver referência validada.
const KIND={top:{track:'jacket',short:'shirt'},bottom:{track:'pants',short:'shorts'}};
const FIT={
  jacket:{sleeveL:[[136,213,26],[107,418,22],[100,560,17.5]],sleeveR:[[284,213,26],[313,416,22],[320,558,17.5]],hem:533},
  shirt:{sleeveL:[[136,213,26.5],[124,302,22]],sleeveR:[[284,213,26.5],[296,302,22]],hem:552},
  pants:{legL:[[171,522,40],[174,712,27],[177,889,22]],legR:[[249,522,40],[246,712,27],[249,889,22]],waist:484},
  shorts:{legL:[[170,522,37.5],[165,646,33.5]],legR:[[250,522,37.5],[255,646,33.5]],waist:484},
};
const overrides=()=>window.GB_FIT_OVERRIDES||{};

/* ============================== RENDERIZAÇÃO ============================== */
let uid=0;
function unit(pfx,shapes,fill,inner='',edge=shapes.length===1){ // forma união (clipPath) + preenchimento + luz: sem costuras internas falsas
  const id=`${pfx}-c${++uid}`,bb=bounds(shapes);
  const line=edge?`<path d="${shapes[0]}" fill="none" stroke="#000" stroke-opacity=".32" stroke-width="3.2"/>`:'';
  return {id,svg:`<clipPath id="${id}">${shapes.map(d=>`<path d="${d}"/>`).join('')}</clipPath><g clip-path="url(#${id})"><rect x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}" fill="${fill}"/>${inner}<rect x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}" fill="url(#gbShadeV)"/>${line}</g>`};
}
function bounds(shapes){ // caixa a partir das coordenadas (paths só têm M/C/Z → números em pares)
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const d of shapes){const n=d.match(/-?\d+(?:\.\d+)?/g)||[];for(let i=0;i+1<n.length;i+=2){const x=+n[i],y=+n[i+1];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}}
  return[r1(x0-4),r1(y0-4),r1(x1-x0+8),r1(y1-y0+8)];
}
const cyl=(d,o=1)=>`<path d="${d}" fill="url(#${CYL})" opacity="${o}"/>`;
let CYL='gbFitCyl';

function bodySVG(pfx){
  const parts=[smooth(RIG.torso),tube(RIG.neck),tube(RIG.armL),tube(RIG.armR),tube(RIG.legL),tube(RIG.legR)];
  const u=unit(pfx,parts,'#d9d3c5',
    `<rect x="100" y="120" width="220" height="900" fill="url(#${pfx}-skin)"/>`+
    [RIG.armL,RIG.armR,RIG.legL,RIG.legR].map(J=>cyl(tube(J),.9)).join('')+
    `<path d="M150 300Q156 360 150 420M270 300Q264 360 270 420" stroke="#8d8577" stroke-opacity=".28" stroke-width="10" fill="none"/>`+
    `<ellipse cx="174" cy="712" rx="16" ry="10" fill="#fff" opacity=".18"/><ellipse cx="244" cy="712" rx="16" ry="10" fill="#fff" opacity=".18"/>`);
  // contorno interno dos braços: oclusão discreta braço × tronco
  const occl=`<path d="${sideLine(RIG.armL,-1,1)}" stroke="#6f6a60" stroke-opacity=".35" stroke-width="2" fill="none"/><path d="${sideLine(RIG.armR,1,1)}" stroke="#6f6a60" stroke-opacity=".35" stroke-width="2" fill="none"/>`;
  const head=`<g transform="rotate(${RIG.head.rot} ${RIG.head.cx} ${RIG.head.cy})"><ellipse cx="${RIG.head.cx}" cy="${RIG.head.cy}" rx="${RIG.head.rx}" ry="${RIG.head.ry}" fill="url(#${pfx}-head)"/><path d="M${RIG.head.cx-30} ${RIG.head.cy+12}Q${RIG.head.cx} ${RIG.head.cy+58} ${RIG.head.cx+30} ${RIG.head.cy+12}" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="3"/></g>`;
  const shoes=[[RIG.ankleL,-4],[RIG.ankleR,4]].map(([a,t])=>`<path d="${shoePath(a[0],a[1],t)}" fill="#17181a"/><path d="${shoePath(a[0],a[1],t)}" fill="url(#gbShadeH)"/><path d="M${a[0]-26+t} ${a[1]+41}Q${a[0]+t} ${a[1]+47} ${a[0]+28+t} ${a[1]+41}L${a[0]+21+t} ${a[1]+50}L${a[0]-16+t} ${a[1]+50}Z" fill="#ece6d8"/><path d="M${a[0]-12} ${a[1]+6}Q${a[0]} ${a[1]+12} ${a[0]+12} ${a[1]+6}" stroke="#ece6d8" stroke-opacity=".5" stroke-width="1.6" fill="none"/>`).join('');
  return `<g class="fit-body">${u.svg}${occl}${shoes}${head}</g>`;
}
function handsSVG(pfx){
  return `<g class="fit-hands">`+[[RIG.wristL,-1],[RIG.wristR,1]].map(([w,s])=>{const d=handPath(w[0],w[1],s);return `<path d="${d}" fill="#d6d0c2"/><path d="${d}" fill="url(#${pfx}-skin)"/><path d="${d}" fill="url(#gbShadeH)" opacity=".7"/>`}).join('')+`</g>`;
}

function jacketSVG(p,pfx){
  const f=FIT.jacket,o=overrides()[p.id]?.top||{};
  const sleeve=(J,side)=>{const s=unit(pfx,[tube(J,{capEnd:false})],p.top,cyl(tube(J,{capEnd:false}))+
      `<path d="${sideLine(J,side,6.5)}" stroke="${p.stripe}" stroke-width="5.5" fill="none" opacity=".92"/>`+
      `<path d="M${J[1][0]-14} ${J[1][1]-6}Q${J[1][0]} ${J[1][1]+4} ${J[1][0]+14} ${J[1][1]-8}M${J[1][0]-12} ${J[1][1]+16}Q${J[1][0]} ${J[1][1]+22} ${J[1][0]+11} ${J[1][1]+12}" stroke="#000" stroke-opacity=".16" stroke-width="2.4" fill="none"/>`);
    const w=J[J.length-1],cuff=[[w[0],w[1]-16,w[2]],[w[0],w[1]+8,w[2]-1.5]];
    const c=unit(pfx,[tube(cuff,{capStart:false,capEnd:false})],p.top,`<rect x="${w[0]-30}" y="${w[1]-20}" width="60" height="34" fill="url(#gbRib)"/><rect x="${w[0]-30}" y="${w[1]-20}" width="60" height="34" fill="#000" opacity=".16"/>`);
    return `<g class="fit-sleeve fit-sleeve-${side<0?'l':'r'}" style="transform-origin:${J[0][0]}px ${J[0][1]}px">${s.svg}${c.svg}</g>`};
  const hem=o.hem||f.hem;
  const panel=smooth([[186,173],[160,180],[136,192],[120,209],[117,232],[124,262],[131,300],[136,356],[136,420],[133,474],[130,hem-6],[176,hem-1],[210,hem+1],[244,hem-1],[290,hem-6],[287,474],[284,420],[284,356],[289,300],[296,262],[303,232],[300,209],[284,192],[260,180],[234,173]]);
  const collar=smooth([[185,177],[187,157],[210,152],[233,157],[235,177],[222,183],[210,185],[198,183]]);
  const body=unit(pfx,[panel],p.top,
    `<rect x="100" y="${hem-27}" width="220" height="40" fill="url(#gbRib)"/><rect x="100" y="${hem-27}" width="220" height="40" fill="#000" opacity=".1"/>`+
    `<path d="M150 300Q156 380 148 470M270 300Q264 380 272 470" stroke="#000" stroke-opacity=".09" stroke-width="12" fill="none"/>`+
    `<path d="M126 236Q150 230 168 246M294 236Q270 230 252 246" stroke="#fff" stroke-opacity=".16" stroke-width="5" fill="none"/>`+
    `<path d="M155 438L168 474M265 438L252 474" stroke="#000" stroke-opacity=".34" stroke-width="2.6" stroke-linecap="round"/>`+
    `<path d="M175 400Q192 410 196 428M245 400Q228 410 224 428" stroke="#000" stroke-opacity=".07" stroke-width="4" fill="none"/>`+
    `<rect x="100" y="120" width="220" height="460" fill="url(#gbShadeH)"/>`);
  const col=unit(pfx,[collar],p.accent,`<rect x="180" y="148" width="60" height="40" fill="url(#gbRib)"/>`);
  const zip=`<path d="M210 176V${hem+1}" stroke="#0b0b0c" stroke-width="3.4"/><path d="M210 177V${hem}" stroke="#e8e3d8" stroke-opacity=".5" stroke-width="1" stroke-dasharray="1.6 1.7"/><rect x="207" y="184" width="6" height="16" rx="2" fill="#d2ccc1" stroke="#111" stroke-opacity=".35"/>`;
  const shadow=`<path d="M132 ${hem}Q210 ${hem+16} 288 ${hem}L282 ${hem+22}Q210 ${hem+36} 138 ${hem+22}Z" fill="url(#${pfx}-drop)"/>`;
  return `${shadow}${sleeve(f.sleeveL,-1)}${sleeve(f.sleeveR,1)}<g class="fit-panel">${body.svg}${col.svg}${zip}</g>`;
}
function shirtSVG(p,pfx){
  const f=FIT.shirt,o=overrides()[p.id]?.top||{};const hem=o.hem||f.hem;
  const sleeve=(J,side)=>{const d=tube(J,{capEnd:false}),e=J[J.length-1],n=Math.atan2(J[1][1]-J[0][1],J[1][0]-J[0][0]);
    const nx=-Math.sin(n),ny=Math.cos(n),a=[e[0]+nx*e[2],e[1]+ny*e[2]],b=[e[0]-nx*e[2],e[1]-ny*e[2]];
    const s=unit(pfx,[d],p.top,cyl(d)+`<path d="M${r1(a[0])} ${r1(a[1]-6)}L${r1(b[0])} ${r1(b[1]-6)}" stroke="${p.accent}" stroke-width="6"/><path d="M${r1(a[0])} ${r1(a[1]-13)}L${r1(b[0])} ${r1(b[1]-13)}" stroke="${p.stripe}" stroke-opacity=".7" stroke-width="2"/>`+
      `<path d="M${J[0][0]-6*side} ${J[0][1]+30}Q${J[0][0]+4*side} ${J[0][1]+60} ${J[0][0]-2*side} ${J[0][1]+80}" stroke="#000" stroke-opacity=".12" stroke-width="3" fill="none"/>`);
    return `<g class="fit-sleeve fit-sleeve-${side<0?'l':'r'}" style="transform-origin:${J[0][0]}px ${J[0][1]}px">${s.svg}</g>`};
  const panel=smooth([[188,176],[162,182],[138,194],[121,212],[118,234],[125,262],[134,300],[138,356],[138,420],[135,480],[131,hem-8],[176,hem-2],[210,hem],[244,hem-2],[289,hem-8],[285,480],[282,420],[282,356],[286,300],[295,262],[302,234],[299,212],[282,194],[258,182],[232,176],[210,214,'s']]);
  const body=unit(pfx,[panel],p.top,
    `<path d="M141 300Q143 420 138 ${hem-10}M279 300Q277 420 282 ${hem-10}" stroke="${p.stripe}" stroke-opacity=".5" stroke-width="3.5" fill="none"/>`+
    `<path d="M152 330Q160 400 150 480M268 330Q260 400 270 480" stroke="#000" stroke-opacity=".08" stroke-width="12" fill="none"/>`+
    `<path d="M128 238Q150 232 168 248M292 238Q270 232 252 248" stroke="#fff" stroke-opacity=".15" stroke-width="5" fill="none"/>`+
    `<path d="M150 ${hem-4}Q210 ${hem+4} 270 ${hem-4}" stroke="#000" stroke-opacity=".15" stroke-width="5" fill="none"/>`+
    `<rect x="100" y="120" width="220" height="460" fill="url(#gbShadeH)"/>`);
  const trim=`<path d="M187 175L210 213L233 175" fill="none" stroke="${p.accent}" stroke-width="6.5" stroke-linejoin="round"/><path d="M192 178L210 207L228 178" fill="none" stroke="#000" stroke-opacity=".2" stroke-width="1.5"/>`;
  const shadow=`<path d="M133 ${hem}Q210 ${hem+14} 287 ${hem}L281 ${hem+20}Q210 ${hem+32} 139 ${hem+20}Z" fill="url(#${pfx}-drop)"/>`;
  return `${shadow}${sleeve(f.sleeveL,-1)}${sleeve(f.sleeveR,1)}<g class="fit-panel">${body.svg}${trim}</g>`;
}
function bottomSVG(p,pfx,kind){
  const f=FIT[kind],w=f.waist;
  const hips=smooth([[135,w,"s"],[285,w,"s"],[289,530],[262,571],[210,586],[158,571],[131,530]]);
  const legs=[f.legL,f.legR].map(J=>tube(J,{capStart:false,capEnd:false}));
  const isPants=kind==='pants';
  let inner=legs.map(d=>cyl(d,.95)).join('')+
    `<rect x="120" y="${w-2}" width="180" height="24" fill="url(#gbRib)"/><rect x="120" y="${w-2}" width="180" height="24" fill="#000" opacity=".12"/>`+
    `<path d="M204 ${w+22}Q201 ${w+40} 199 ${w+56}M216 ${w+22}Q219 ${w+40} 221 ${w+56}" stroke="${p.accent}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`+
    `<path d="M210 520L210 584" stroke="#000" stroke-opacity=".22" stroke-width="2"/>`+
    `<path d="${sideLine(f.legL,1,4)}" stroke="#000" stroke-opacity=".18" stroke-width="7" fill="none"/><path d="${sideLine(f.legR,-1,4)}" stroke="#000" stroke-opacity=".18" stroke-width="7" fill="none"/>`+
    `<path d="${sideLine(f.legL,-1,6)}" stroke="${p.stripe}" stroke-opacity=".8" stroke-width="6" fill="none"/><path d="${sideLine(f.legR,1,6)}" stroke="${p.stripe}" stroke-opacity=".8" stroke-width="6" fill="none"/>`+
    `<path d="M140 506Q156 520 160 546M280 506Q264 520 260 546" stroke="#000" stroke-opacity=".26" stroke-width="2" fill="none"/>`;
  if(isPants){
    inner+=[f.legL,f.legR].map(J=>{const k=J[1];return `<path d="M${k[0]-20} ${k[1]-8}Q${k[0]} ${k[1]+4} ${k[0]+18} ${k[1]-10}M${k[0]-16} ${k[1]+20}Q${k[0]} ${k[1]+26} ${k[0]+14} ${k[1]+16}" stroke="#fff" stroke-opacity=".08" stroke-width="3" fill="none"/>`}).join('')+
      [f.legL,f.legR].map(J=>{const a=J[2];return `<rect x="${a[0]-30}" y="${a[1]-22}" width="60" height="26" fill="url(#gbRib)"/><rect x="${a[0]-30}" y="${a[1]-22}" width="60" height="26" fill="#000" opacity=".2"/>`}).join('');
  }else{
    inner+=[f.legL,f.legR].map(J=>{const e=J[1];return `<path d="M${e[0]-e[2]} ${e[1]-7}L${e[0]+e[2]} ${e[1]-7}" stroke="${p.accent}" stroke-opacity=".8" stroke-width="5"/>`}).join('');
  }
  inner+=`<rect x="110" y="${w-6}" width="200" height="440" fill="url(#gbShadeH)"/>`;
  const u=unit(pfx,[hips,...legs],p.bottom,inner);
  return u.svg;
}
function topSVG(p,pfx){return (KIND.top[p.category]==='shirt'?shirtSVG:jacketSVG)(p,pfx)}

function defsSVG(pfx){
  return `<defs>
  <linearGradient id="${pfx}-skin" x1="0" x2="1"><stop offset="0" stop-color="#fbf7ee" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5b5448" stop-opacity=".42"/></linearGradient>
  <radialGradient id="${pfx}-head" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#f4efe4"/><stop offset=".55" stop-color="#d2cbbd"/><stop offset="1" stop-color="#8c8579"/></radialGradient>
  <linearGradient id="${pfx}-drop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  <radialGradient id="${pfx}-floor" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".6" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
  <linearGradient id="gbFitCyl" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".18"/><stop offset=".28" stop-color="#fff" stop-opacity=".14"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></linearGradient>
  </defs>`;
}
function figureSVG(pfx,label){
  return `<svg class="fit-svg" viewBox="0 0 420 1000" role="img" aria-label="${label}" focusable="false">${defsSVG(pfx)}
  <ellipse class="fit-floor" cx="212" cy="${RIG.floor}" rx="118" ry="15" fill="url(#${pfx}-floor)"/>
  <g class="fit-rig">${bodySVG(pfx)}<g class="fit-layer fit-layer-bottom"></g><g class="fit-layer fit-layer-top"></g>${handsSVG(pfx)}</g></svg>`;
}
function garmentGroup(part,p,pfx){
  const g=document.createElementNS(NS,'g');g.setAttribute('class',`fit-garment fit-${part}`);g.dataset.product=p.id;g.dataset.kind=KIND[part][p.category]||'jacket';
  g.innerHTML=part==='top'?topSVG(p,pfx):bottomSVG(p,pfx,KIND.bottom[p.category]||'pants');
  g.style.transformOrigin=part==='top'?'210px 200px':'210px 490px';
  return g;
}

/* ============================== MOTOR DE TROCA ============================== */
let stage=null,fig=null,figB=null,layers=null,state={topId:null,bottomId:null},pending=null,flushQueued=false,rev=0,tagTimer=0;
const live={top:{cur:null,anims:[],leaving:[]},bottom:{cur:null,anims:[],leaving:[]}};
function entryVector(opts){
  if(opts.from&&fig){const r=fig.getBoundingClientRect(),sx=420/r.width;const dx=(opts.from.x-(r.left+r.width/2))*sx,dy=(opts.from.y-(r.top+r.height*.4))*sx;return[Math.max(-140,Math.min(140,dx*.5)),Math.max(-120,Math.min(160,dy*.45))]}
  if(opts.dir)return[opts.dir*70,-12];
  return innerWidth<781?[0,90]:[84,-18]; // seletores à direita no desktop, abaixo no mobile
}
function dress(part,p,opts,delay=0){
  const L=live[part],layer=layers[part];
  // a última escolha vence: quem já estava saindo some, a peça em cena sai do estado atual
  L.leaving.forEach(el=>el.remove());L.leaving=[];
  L.anims.forEach(a=>{try{a.commitStyles?.()}catch{}a.cancel()});L.anims=[];
  const old=L.cur,g=garmentGroup(part,p,'fitA');g.dataset.rev=String(++rev);
  layer.appendChild(g);L.cur=g;
  if(!old||old.dataset.product===p.id&&!opts.force){if(old&&old!==g)old.remove();return}
  if(reduced()||!g.animate){old.remove();return}
  const quick=lite()?.72:1;
  // saída: a peça perde tensão, cede e dissolve
  const out=old.animate([{opacity:1,transform:old.style.transform||'none'},{opacity:0,transform:part==='top'?'translate(0px,12px) scale(1,.965)':'translate(0px,16px) scale(1,.97)'}],{duration:300*quick,easing:'cubic-bezier(.4,0,.8,.4)',fill:'forwards'});
  L.leaving.push(old);out.finished.then(()=>{old.remove();L.leaving=L.leaving.filter(x=>x!==old)}).catch(()=>{});
  // entrada: chega como fantasma a partir do seletor, encosta no corpo, ajusta costuras e assenta
  const[dx,dy]=entryVector(opts),d=delay;
  const ease='cubic-bezier(.2,.8,.2,1)';
  const fly=(el,extra='',dur=760,del=0)=>{const a=el.animate([
      {opacity:0,transform:`translate(${dx}px,${dy}px) scale(1.07) ${extra}`},
      {opacity:.5,offset:.32,transform:`translate(${dx*.22}px,${dy*.22}px) scale(1.02) ${extra}`},
      {opacity:1,offset:.68,transform:'translate(0px,-3px) scale(.992)'},
      {opacity:1,transform:'translate(0px,0px) scale(1)'}],{duration:dur*quick,delay:(d+del)*quick,easing:ease,fill:'backwards'});L.anims.push(a);return a};
  if(part==='top'){
    const panel=g.querySelector('.fit-panel'),sl=g.querySelector('.fit-sleeve-l'),sr=g.querySelector('.fit-sleeve-r');
    if(panel)fly(panel,'',760,0);
    if(sl)fly(sl,'rotate(9deg)',800,55);
    if(sr)fly(sr,'rotate(-9deg)',800,55);
    const rest=[...g.children].filter(c=>c!==panel&&c!==sl&&c!==sr);rest.forEach(c=>fly(c,'',760,0));
  }else fly(g,'',780,0);
}
function flush(){
  flushQueued=false;const want=pending;pending=null;if(!want||!layers)return;
  const t=byId(want.topId),b=byId(want.bottomId),opts=want.opts||{};
  const topChanged=t&&t.id!==live.top.cur?.dataset.product,botChanged=b&&b.id!==live.bottom.cur?.dataset.product;
  const both=topChanged&&botChanged;
  stage.dataset.phase=reduced()?'reduced-motion':both?'switching-both':topChanged?'switching-top':botChanged?'switching-bottom':'idle';
  if(topChanged)dress('top',t,opts,0);
  if(botChanged)dress('bottom',b,opts,both?120:0);
  state={topId:want.topId,bottomId:want.bottomId};
  fig.dataset.top=state.topId;fig.dataset.bottom=state.bottomId;
  if(t&&b)fig.querySelector('.fit-svg')?.setAttribute('aria-label',`Manequim GB vestindo ${t.name} com ${b.name}`);
  if(topChanged||botChanged)showTag(both?'both':topChanged?'top':'bottom',t,b,opts);
  clearTimeout(flush.idle);flush.idle=setTimeout(()=>{if(stage.dataset.phase!=='comparing')stage.dataset.phase=reduced()?'reduced-motion':'idle'},both?1000:860);
}
function showTag(part,t,b,opts){
  const tag=stage.querySelector('.fit-tag');if(!tag||opts.silent)return;
  tag.innerHTML=part==='both'?`<b>MIX</b><span>${escaped(t.name)} + ${escaped(b.name)}</span>`:`<b>${part==='top'?'SUPERIOR':'INFERIOR'}</b><span>${escaped((part==='top'?t:b).name)}</span>`;
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
  const tp=byId(b.top),bp=byId(b.bottom);if(!tp||!bp)return;
  figB?.remove();
  figB=document.createElement('div');figB.className='fit-figure fit-figure-b';figB.setAttribute('aria-hidden','true');
  figB.innerHTML=figureSVG('fitB','Look B salvo');
  figB.querySelector('.fit-layer-bottom').appendChild(garmentGroup('bottom',bp,'fitB'));
  figB.querySelector('.fit-layer-top').appendChild(garmentGroup('top',tp,'fitB'));
  figB.dataset.top=tp.id;figB.dataset.bottom=bp.id;
  fig.after(figB);
  stage.classList.add('is-fit-compare');stage.dataset.phase='comparing';
  if(wrap){wrap.hidden=false;
    const ta=byId(state.topId),ba=byId(state.bottomId);
    wrap.querySelector('.fit-cmp-a').innerHTML=`<b>A / ATUAL</b><span>${escaped(ta.name)}<br>${escaped(ba.name)}</span>`;
    wrap.querySelector('.fit-cmp-b').innerHTML=`<b>B / SALVO</b><span>${escaped(tp.name)}<br>${escaped(bp.name)}</span>`;
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
   <p class="fit-legal">SIMULAÇÃO EDITORIAL DE COMPOSIÇÃO · CAIMENTO E CORES REAIS SUJEITOS À FOTO APROVADA</p>
   <div class="fit-compare" hidden><div class="fit-cmp-a"></div><div class="fit-cmp-b"></div><span class="fit-split-line" aria-hidden="true"><i>A | B</i></span><label class="fit-split"><span class="sr-only">Divisor entre o look A (atual) e o look B (salvo)</span><input type="range" min="8" max="92" value="50" step="1"></label></div>`;
  stage.prepend(scene);
  fig=scene.querySelector('.fit-figure');
  layers={top:fig.querySelector('.fit-layer-top'),bottom:fig.querySelector('.fit-layer-bottom')};
  // áreas de encaixe acompanham o corpo (soltar peça / feedback de encaixe)
  stage.querySelectorAll('.look-dock').forEach(d=>fig.appendChild(d));
  const range=scene.querySelector('.fit-split input');
  range.addEventListener('input',()=>setSplit(range.value));
  // arrastar o divisor diretamente sobre o palco (mouse e toque)
  if(M)M.drag(scene,{axis:'x',threshold:6,ignore:'button,input',
    onMove(dx,s){if(!stage.classList.contains('is-fit-compare'))return;const r=fig.getBoundingClientRect();const v=Math.max(8,Math.min(92,(s.lx-r.left)/r.width*100));range.value=String(Math.round(v));setSplit(v)}});
  // primeira roupa sem animação; o palco "acorda" quando entra em cena
  const t=byId(initial.topId),b=byId(initial.bottomId);
  if(b){const g=garmentGroup('bottom',b,'fitA');layers.bottom.appendChild(g);live.bottom.cur=g}
  if(t){const g=garmentGroup('top',t,'fitA');layers.top.appendChild(g);live.top.cur=g}
  state={topId:initial.topId,bottomId:initial.bottomId};fig.dataset.top=state.topId;fig.dataset.bottom=state.bottomId;
  stage.dataset.phase=reduced()?'reduced-motion':'entering';
  const wake=()=>{stage.classList.add('is-awake');setTimeout(()=>{if(stage.dataset.phase==='entering')stage.dataset.phase='idle'},1100)};
  if(reduced()||!M)wake();else{const off=M.onVisible(stage,v=>{if(v){off();wake()}},{threshold:.3})}
  // microparallax de luz apenas com ponteiro fino e aparelho capaz
  if(M&&M.Prefs.fine&&!reduced()&&!lite()){let tx=0,ty=0,cx=0,cy=0,on=false;
    const loop=dt=>{const k=1-Math.pow(.002,dt);cx+=(tx-cx)*k;cy+=(ty-cy)*k;scene.style.setProperty('--fx',cx.toFixed(3));scene.style.setProperty('--fy',cy.toFixed(3));if(Math.abs(tx-cx)<.002&&Math.abs(ty-cy)<.002){on=false;return false}};
    scene.addEventListener('pointermove',e=>{const r=scene.getBoundingClientRect();tx=(e.clientX-r.left)/r.width-.5;ty=(e.clientY-r.top)/r.height-.5;if(!on){on=true;M.Ticker.add(loop)}},{passive:true});
    scene.addEventListener('pointerleave',()=>{tx=0;ty=0;if(!on){on=true;M.Ticker.add(loop)}})}
}
window.GBFitting={mount,set,compare,get state(){return{...state}},zones:RIG.zones,RIG,FIT};
})();
