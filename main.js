/**
 * GB IMPORTS / FLAGSHIP — núcleo comercial (V02 → V06)
 * Arte e produtos: estudo visual, não confirmação de catálogo, marcas ou preço.
 * Fotos reais entram por assets-map.js (scripts/importar_produtos.py); o SVG é fallback honesto.
 */
const INSTAGRAM = 'https://www.instagram.com/gb.importts_/'
const SHORT_GROUP = 'Camisa + Short'
const TRACK_GROUP = 'Agasalho + Calça'
const PRODUCTS = [
  {id:'gb-tr-01',name:'Conjunto Argentina',category:'track',label:TRACK_GROUP,tag:'ESTUDO 01',top:'#d9edf2',bottom:'#182f55',accent:'#64bed5',stripe:'#9bcbdc',model:'jacket'},
  {id:'gb-tr-02',name:'Conjunto Real Madrid',category:'track',label:TRACK_GROUP,tag:'ESTUDO 02',top:'#f5f2e8',bottom:'#171717',accent:'#d7c17d',stripe:'#b0a16b',model:'jacket'},
  {id:'gb-tr-03',name:'Conjunto Arsenal',category:'track',label:TRACK_GROUP,tag:'ESTUDO 03',top:'#b92329',bottom:'#faf6ec',accent:'#f3d6b6',stripe:'#fff6e9',model:'jacket'},
  {id:'gb-tr-04',name:'Conjunto Inter',category:'track',label:TRACK_GROUP,tag:'ESTUDO 04',top:'#1b263c',bottom:'#11141b',accent:'#1974b8',stripe:'#277dcc',model:'jacket'},
  {id:'gb-tr-05',name:'Conjunto Chelsea',category:'track',label:TRACK_GROUP,tag:'ESTUDO 05',top:'#2351a5',bottom:'#16234a',accent:'#f1f0e8',stripe:'#739de3',model:'jacket'},
  {id:'gb-tr-06',name:'Conjunto Alemanha',category:'track',label:TRACK_GROUP,tag:'ESTUDO 06',top:'#f4f1e7',bottom:'#242527',accent:'#b6b2ad',stripe:'#3b3d43',model:'jacket'},
  {id:'gb-sh-01',name:'Kit Real Madrid',category:'short',label:SHORT_GROUP,tag:'ESTUDO 07',top:'#efede8',bottom:'#18181a',accent:'#b4a277',stripe:'#1e1e24',model:'shirt'},
  {id:'gb-sh-02',name:'Kit Manchester City',category:'short',label:SHORT_GROUP,tag:'ESTUDO 08',top:'#a6d4e6',bottom:'#171b21',accent:'#e9f1f1',stripe:'#eef7f9',model:'shirt'},
  {id:'gb-sh-03',name:'Kit Manchester United / A',category:'short',label:SHORT_GROUP,tag:'ESTUDO 09',top:'#c5262e',bottom:'#171719',accent:'#f3f2e8',stripe:'#212126',model:'shirt'},
  {id:'gb-sh-04',name:'Kit Manchester United / B',category:'short',label:SHORT_GROUP,tag:'ESTUDO 10',top:'#aa191f',bottom:'#242427',accent:'#d7cbbb',stripe:'#e7e3da',model:'shirt'},
  {id:'gb-sh-05',name:'Kit 05 / A catalogar',category:'short',label:SHORT_GROUP,tag:'ESTUDO 11',top:'#353738',bottom:'#272829',accent:'#eee4d1',stripe:'#a79d87',model:'shirt'},
  {id:'gb-sh-06',name:'Kit 06 / A catalogar',category:'short',label:SHORT_GROUP,tag:'ESTUDO 12',top:'#e7e4d7',bottom:'#5b656a',accent:'#9aa8a9',stripe:'#e9d49c',model:'shirt'},
  {id:'gb-sh-07',name:'Kit 07 / A catalogar',category:'short',label:SHORT_GROUP,tag:'ESTUDO 13',top:'#385d4e',bottom:'#16221c',accent:'#a4cead',stripe:'#b6c5b0',model:'shirt'},
  {id:'gb-sh-08',name:'Kit 08 / A catalogar',category:'short',label:SHORT_GROUP,tag:'ESTUDO 14',top:'#4f455d',bottom:'#1b1a25',accent:'#c8b0d7',stripe:'#a392c1',model:'shirt'},
]
// Peças complementares do acervo: só entram na vitrine quando a imagem do acervo existir em assets-map.js.
const EXTRA_PRODUCTS = [
  {id:'gb-ex-01',name:'Conjunto branco athleisure',category:'extra',label:'Conjunto',tag:'ACERVO 01',single:true},
  {id:'gb-ex-02',name:'Jaqueta preta / referência TNF',category:'extra',label:'Jaqueta',tag:'ACERVO 02',single:true},
  {id:'gb-ex-03',name:'Jaqueta branca / referência TNF',category:'extra',label:'Jaqueta',tag:'ACERVO 03',single:true},
  {id:'gb-ex-04',name:'Moletom cinza / referência Nike',category:'extra',label:'Moletom',tag:'ACERVO 04',single:true},
]
EXTRA_PRODUCTS.forEach(p=>{if(window.GB_ASSETS?.[p.id]?.combo)PRODUCTS.push(p)});
(window.GB_IMPORTED_PRODUCTS||[]).forEach(p=>{if(!PRODUCTS.some(x=>x.id===p.id))PRODUCTS.push(p)})
const heroSlides = [
  {eyebrow:'THE GB EDIT / CAPÍTULO 001',title:'O ESTILO<br>É <span class="emphasis">SEU.</span><br><span class="hero-title-outline">O MUNDO</span><br> TAMBÉM<span class="yellow-dot">.</span>',sub:'Peças, combinações e liberdade para construir o visual sem seguir o roteiro de ninguém.',product:PRODUCTS[1]},
  {eyebrow:'GB / A CURADORIA · 002',title:'LOOK<br>NÃO É<br><span class="emphasis">UNIFORME.</span><br>É ATITUDE<span class="yellow-dot">.</span>',sub:'Da rua para o seu dia. Escolha o que veste, não o que te define.',product:PRODUCTS[7]},
  {eyebrow:'GB / NOVO CAPÍTULO · 003',title:'SEU CORRE.<br><span class="emphasis">SEU</span><br><span class="hero-title-outline">PRÓXIMO</span><br>CAPÍTULO<span class="yellow-dot">.</span>',sub:'Tudo começa na escolha. A GB leva o produto e a experiência mais perto de você.',product:PRODUCTS[4]},
]
const $ = (sel,scope=document)=>scope.querySelector(sel)
const $$ = (sel,scope=document)=>[...scope.querySelectorAll(sel)]
const escaped = (s)=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
const pad2 = (n)=>String(n).padStart(2,'0')
const reducedMotion = ()=>matchMedia('(prefers-reduced-motion: reduce)').matches
const productById = (id)=>PRODUCTS.find(p=>p.id===id)
function lsRead(k,fallback){try {return JSON.parse(localStorage.getItem(k)) ?? fallback} catch{return fallback}}
function lsSave(k,data){try{localStorage.setItem(k,JSON.stringify(data))}catch{}}
let favorites=lsRead('gb-v03-favs',[]).filter(id=>PRODUCTS.some(p=>p.id===id))
let bag=lsRead('gb-v03-bag',[]).filter(p=>PRODUCTS.some(x=>x.id===p.id))
let recent=lsRead('gb-v06-recent',[]).filter(id=>PRODUCTS.some(p=>p.id===id))
let currentFilter='all',sortMode='curadoria',searchQuery='',showAll=false,heroIndex=0,activeModal=null,modalView='combo',topSize='',bottomSize='',toastTimeout=0,lastFocus=null,productPushed=false

/* ---------- Arte de estudo (fallback sem foto). Sem logos, escudos ou marcas de terceiros. ---------- */
const SHADE_DEFS=`<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
 <linearGradient id="gbShadeH" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".42" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
 <linearGradient id="gbShadeV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".24"/></linearGradient>
 <pattern id="gbRib" width="3.4" height="10" patternUnits="userSpaceOnUse"><rect width="1.3" height="10" fill="#000" fill-opacity=".2"/></pattern>
 <pattern id="gbKnit" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5 5 0" stroke="#fff" stroke-opacity=".045"/></pattern>
</defs></svg>`
const MIRROR=(inner)=>`<g transform="translate(214 0) scale(-1 1)">${inner}</g>`
function shade(d){return `<path d="${d}" fill="url(#gbShadeH)"/><path d="${d}" fill="url(#gbShadeV)"/>`}
function jacketShape(p){
 const torso='M72 34Q107 47 142 34L166 44Q172 47 172 58L170 236Q170 246 160 246L54 246Q44 246 44 236L42 58Q42 47 48 44Z'
 const sleeve='M48 44Q30 50 24 72L6 206Q5 214 13 216L33 220Q40 221 41 213L50 98Z'
 const cuff='M7 199L36 205L34 219Q25 221 13 218Q5 216 6 207Z'
 const sleeveSet=`<path d="${sleeve}" fill="${p.top}" stroke="#141414" stroke-opacity=".32" stroke-width="1.4"/>${shade(sleeve)}<path d="M52 50Q34 58 30 78L14 200" fill="none" stroke="${p.stripe}" stroke-width="6" stroke-linecap="round" opacity=".9"/><path d="${cuff}" fill="${p.top}"/><path d="${cuff}" fill="url(#gbRib)"/><path d="${cuff}" fill="#000" fill-opacity=".14"/>`
 const hem='M44 230L170 230L170 236Q170 246 160 246L54 246Q44 246 44 236Z'
 return `${sleeveSet}${MIRROR(sleeveSet)}
 <path d="${torso}" fill="${p.top}" stroke="#141414" stroke-opacity=".32" stroke-width="1.4"/>${shade(torso)}
 <path d="M47 60Q50 150 46 228" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="7"/>
 <path d="M167 60Q164 150 168 228" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="6"/>
 <path d="${hem}" fill="url(#gbRib)"/><path d="${hem}" fill="#000" fill-opacity=".1"/>
 <path d="M72 34Q107 47 142 34L139 19Q107 31 75 19Z" fill="${p.accent}" stroke="#141414" stroke-opacity=".25"/><path d="M72 34Q107 47 142 34L139 19Q107 31 75 19Z" fill="url(#gbRib)"/>
 <path d="M60 168L73 197M154 168L141 197" stroke="#000" stroke-opacity=".32" stroke-width="2.4" stroke-linecap="round"/>
 <path d="M107 32V246" stroke="#0b0b0b" stroke-width="3.2"/><path d="M107 33V245" stroke="#e9e5da" stroke-opacity=".55" stroke-width="1" stroke-dasharray="1.6 1.6"/>
 <rect x="104.2" y="38" width="5.6" height="16" rx="2" fill="#cfcac0" stroke="#111" stroke-opacity=".4"/>
 <path d="M84 86Q96 96 92 118M132 80Q124 98 128 120" fill="none" stroke="#000" stroke-opacity=".07" stroke-width="5" stroke-linecap="round"/>`
}
function shirtShape(p){
 const torso='M70 36Q107 52 144 36L164 46Q170 50 170 60L168 238Q168 246 160 246L54 246Q46 246 46 238L44 60Q44 50 50 46Z'
 const sleeve='M50 46Q30 52 20 70L2 110Q0 116 6 118L38 132Q44 134 46 128L48 96Z'
 const sleeveSet=`<path d="${sleeve}" fill="${p.top}" stroke="#141414" stroke-opacity=".3" stroke-width="1.4"/>${shade(sleeve)}<path d="M4 106L42 123" stroke="${p.accent}" stroke-width="5" stroke-linecap="round"/><path d="M8 98L44 114" stroke="${p.stripe}" stroke-opacity=".7" stroke-width="2"/>`
 return `${sleeveSet}${MIRROR(sleeveSet)}
 <path d="${torso}" fill="${p.top}" stroke="#141414" stroke-opacity=".3" stroke-width="1.4"/>${shade(torso)}
 <path d="M50 72L53 238M164 72L161 238" stroke="${p.stripe}" stroke-opacity=".55" stroke-width="7"/>
 <path d="M74 37L107 66L140 37" fill="none" stroke="${p.accent}" stroke-width="6" stroke-linejoin="round"/>
 <path d="M80 39L107 62L134 39Z" fill="#000" fill-opacity=".18"/>
 <path d="M48 240Q107 248 166 240" stroke="#000" stroke-opacity=".16" stroke-width="5" fill="none"/>
 <path d="M86 100Q98 120 92 150M132 96Q122 124 128 156" fill="none" stroke="#000" stroke-opacity=".06" stroke-width="6" stroke-linecap="round"/>`
}
function pantsShape(p){
 const body='M24 14Q105 22 186 14L190 60L176 276Q176 286 166 286L128 286Q120 286 120 278L106 112L90 278Q90 286 82 286L44 286Q34 286 34 276L20 60Z'
 const band='M24 14Q105 22 186 14L187 33Q105 41 23 33Z'
 const cuffL='M35 264Q62 269 90 264L90 278Q90 286 82 286L44 286Q34 286 34 276Z',cuffR='M120 264Q148 269 176 264L176 276Q176 286 166 286L128 286Q120 286 120 278Z'
 return `<path d="${body}" fill="${p.bottom}" stroke="#141414" stroke-opacity=".35" stroke-width="1.6"/>${shade(body)}
 <path d="${band}" fill="url(#gbRib)"/><path d="${band}" fill="#000" fill-opacity=".12"/>
 <path d="M99 34Q97 48 95 60M111 34Q113 48 115 60" stroke="${p.accent}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
 <path d="M22 40L38 262M188 40L172 262" stroke="${p.stripe}" stroke-width="6" stroke-opacity=".75"/>
 <path d="${cuffL}" fill="url(#gbRib)"/><path d="${cuffR}" fill="url(#gbRib)"/><path d="${cuffL}" fill="#000" fill-opacity=".12"/><path d="${cuffR}" fill="#000" fill-opacity=".12"/>
 <path d="M32 46Q46 60 48 82M178 46Q164 60 162 82" stroke="#000" stroke-opacity=".3" stroke-width="2" fill="none"/>
 <path d="M48 170Q62 176 80 170M130 170Q148 176 164 170" stroke="#fff" stroke-opacity=".09" stroke-width="5" fill="none"/>
 <path d="M106 40V108" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`
}
function shortsShape(p){
 const body='M24 36Q105 44 186 36L204 184Q204 190 198 191L128 200Q122 200 121 194L106 122L90 194Q89 200 83 200L12 191Q6 190 6 184Z'
 const band='M24 36Q105 44 186 36L188 54Q105 62 22 54Z'
 return `<path d="${body}" fill="${p.bottom}" stroke="#141414" stroke-opacity=".35" stroke-width="1.6"/>${shade(body)}
 <path d="${band}" fill="url(#gbRib)"/><path d="${band}" fill="#000" fill-opacity=".12"/>
 <path d="M99 56Q97 70 95 80M111 56Q113 70 115 80" stroke="${p.accent}" stroke-width="2.4" stroke-linecap="round" fill="none"/>
 <path d="M22 52L10 182M188 52L200 182" stroke="${p.stripe}" stroke-width="6" stroke-opacity=".7"/>
 <path d="M9 180L88 190M122 190L201 180" stroke="${p.accent}" stroke-width="4" stroke-opacity=".75"/>
 <path d="M106 60V118" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`
}
function garmentSVG(p,mode='combo',extraClass='garment-svg'){
 const track=p.category==='track'
 const top=track?jacketShape(p):shirtShape(p)
 const bottom=track?pantsShape(p):shortsShape(p)
 let pieces
 if(mode==='top')pieces=`<g transform="translate(115 70) scale(1.36)">${top}</g>`
 else if(mode==='bottom') pieces=`<g transform="translate(115 ${track?65:130}) scale(1.4)">${bottom}</g>`
 else pieces=`<g transform="translate(34 84) rotate(-8 103 130) scale(1.02)">${top}</g><g transform="translate(272 ${track?187:233}) rotate(9 103 130) scale(.92)">${bottom}</g>`
 return `<svg class="${extraClass}" viewBox="0 0 520 580" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Estudo gráfico de ${escaped(p.label)} ${escaped(p.name)}"><ellipse cx="262" cy="530" rx="175" ry="17" fill="#000" opacity=".07"/>${pieces}</svg>`
}
const VIEW_LABEL={combo:'conjunto completo',top:'parte superior',bottom:'parte inferior'}
const hasPhoto=(p)=>!!window.GB_ASSETS?.[p.id]&&Object.keys(window.GB_ASSETS[p.id]).length>0
// Vistas exibíveis: com imagem do acervo, somente vistas fotografadas; sem foto, as três vistas do estudo.
function availableViews(p){
 if(hasPhoto(p))return ['combo','top','bottom'].filter(v=>window.GB_ASSETS[p.id][v])
 return p.single?['combo']:['combo','top','bottom']
}
// Configurar fotos verdadeiras em assets-map.js; SVG continua como fallback honesto.
function productMedia(p,mode='combo'){
 const set=window.GB_ASSETS?.[p.id]
 const source=set?.[mode]||(set&&set.combo)
 if(source){return `<img class="garment-svg actual-photo" src="${escaped(source)}" alt="${escaped(p.name)} / ${VIEW_LABEL[mode]||'foto'}" loading="lazy" decoding="async" data-pid="${p.id}" data-mode="${mode}"/>`}
 return garmentSVG(p,mode)
}
const heartSVG=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 4.5 12.6A5.3 5.3 0 0 1 12 5.9a5.3 5.3 0 0 1 7.5 6.7Z"/></svg>`

/* ---------- Catálogo: filtro, busca normalizada, ordenação e estado na URL ---------- */
const SYNONYMS={track:'agasalho agasalhos conjunto conjuntos calca jaqueta treino moletom',short:'kit kits camisa camiseta short shorts futebol',extra:'acervo avulsa'}
const norm=(s)=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').toLocaleLowerCase('pt-BR')
function matchesQuery(p,q){
 const tokens=norm(q).split(/\s+/).filter(Boolean);if(!tokens.length)return true
 const hay=norm(`${p.name} ${p.label} ${p.id} ${p.tag} ${SYNONYMS[p.category]||''}`)
 return tokens.every(t=>hay.includes(t))
}
function catalogList(){
 let list=PRODUCTS.filter(p=>currentFilter==='all'||(currentFilter==='saved'?favorites.includes(p.id):p.category===currentFilter)).filter(p=>matchesQuery(p,searchQuery))
 if(sortMode==='curadoria'&&window.GB_IMPORTED_PRODUCTS?.length)list=[...list].sort((a,b)=>Number(!!window.GB_ASSETS?.[b.id]?.combo)-Number(!!window.GB_ASSETS?.[a.id]?.combo))
 if(sortMode==='az')list=[...list].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))
 else if(sortMode==='za')list=[...list].sort((a,b)=>b.name.localeCompare(a.name,'pt-BR'))
 return list
}
function makeCard(p,i){
 const n=PRODUCTS.indexOf(p)+1,fav=favorites.includes(p.id)
 const second=availableViews(p).includes('top')?`<span class="card-media card-media-b" aria-hidden="true" data-lazy-view="top"></span>`:''
 return `<article class="product-card" style="--i:${i}"><div class="product-frame"><button class="product-visual" data-product="${p.id}" aria-label="Ver detalhes de ${escaped(p.name)}"><span class="card-media card-media-a">${productMedia(p)}</span>${second}</button><span class="product-index" aria-hidden="true">GB / ${pad2(n)}</span><span class="product-badge" aria-hidden="true">${hasPhoto(p)?'IMAGEM DO ACERVO / A VALIDAR':'ESTUDO / CADASTRO EM REVISÃO'}</span><button class="favorite-toggle ${fav?'is-fav':''}" data-fav="${p.id}" aria-label="${fav?'Remover dos favoritos':'Salvar nos favoritos'}: ${escaped(p.name)}" aria-pressed="${fav}">${heartSVG}</button></div><div class="product-meta"><div><div class="product-overline">${escaped(p.label.toUpperCase())} / ${hasPhoto(p)?'FOTO':'ESTUDO'}</div><div class="product-name">${escaped(p.name)}</div><div class="product-sub">Preço e tamanhos: a validar</div></div><span class="product-arrow" aria-hidden="true">↗</span></div></article>`
}
function renderProducts(){
 const products=catalogList(),grid=$('#productGrid')
 const display=showAll||searchQuery?products:products.slice(0,8)
 grid.innerHTML=display.length?display.map((p,i)=>makeCard(p,i)).join(''):`<div class="catalog-empty"><strong>${currentFilter==='saved'&&!searchQuery?'NENHUMA PEÇA SALVA AINDA.':'NENHUMA PEÇA ENCONTRADA.'}</strong><p>${currentFilter==='saved'&&!searchQuery?'Toque no coração de uma peça para guardá-la aqui.':'Tente outro termo: time, “agasalho”, “kit” ou “short”.'}</p><button type="button" class="text-link" data-catalog-reset>LIMPAR BUSCA E FILTROS ↺</button></div>`
 grid.classList.remove('is-entering');void grid.offsetWidth;grid.classList.add('is-entering')
 const more=$('#showMore');more.textContent=showAll?'VER MENOS ↑':`VER TODAS AS ${products.length} PEÇAS ↗`;more.hidden=!!searchQuery||products.length<=8
 const count=$('#catalogCount');if(count)count.textContent=searchQuery?`${pad2(products.length)} RESULTADO${products.length===1?'':'S'} PARA “${searchQuery.toUpperCase()}”`:`${pad2(products.length)} ${products.length===1?'PEÇA':'PEÇAS'}${currentFilter==='saved'?' SALVAS':''}`
 syncCatalogURL()
}
function updateFilterCounts(){
 const n=(f)=>PRODUCTS.filter(p=>f==='all'||(f==='saved'?favorites.includes(p.id):p.category===f)).length
 $$('.filter').forEach(b=>{const sup=b.querySelector('sup');if(sup)sup.textContent=pad2(n(b.dataset.filter))})
 const extra=$('.filter[data-filter="extra"]');if(extra)extra.hidden=n('extra')===0
}
function selectFilter(filter){currentFilter=filter;showAll=false;$$('.filter').forEach(b=>{let active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});renderProducts()}
function syncCatalogURL(){
 const u=new URL(location.href)
 currentFilter==='all'?u.searchParams.delete('cat'):u.searchParams.set('cat',currentFilter)
 searchQuery?u.searchParams.set('q',searchQuery):u.searchParams.delete('q')
 sortMode==='curadoria'?u.searchParams.delete('ordem'):u.searchParams.set('ordem',sortMode)
 if(u.href!==location.href)history.replaceState(history.state,'',u)
}
function updateCounters(){$('#wishCount').textContent=favorites.length;$('#wishCount').hidden=favorites.length===0;$('#bagCount').textContent=bag.length;$('#bagDrawerCount').textContent=`(${pad2(bag.length)})`;updateFilterCounts()}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3400)}
function toggleFavorite(id){if(favorites.includes(id))favorites=favorites.filter(x=>x!==id);else favorites=[...favorites,id];lsSave('gb-v03-favs',favorites);updateCounters();renderProducts();renderWishlist();if(activeModal&&!$('#productModal').hidden)renderProductModal();toast(favorites.includes(id)?'Adicionado aos favoritos.':'Removido dos favoritos.')}

/* ---------- Diálogos ---------- */
function hideAll(){$$('.drawer,.product-modal').forEach(x=>x.hidden=true);$('#productModal').classList.remove('no-anim');$('#overlay').hidden=true;document.body.classList.remove('no-scroll')}
function openDialog(id){const wasOpen=$$('.drawer,.product-modal').some(x=>!x.hidden);if(!wasOpen)lastFocus=document.activeElement;if(id!=='productModal')clearProductURL();hideAll();const el=$('#'+id);if(!el)return;el.hidden=false;$('#overlay').hidden=false;document.body.classList.add('no-scroll');const close=el.querySelector('[data-close],.modal-close');close?.focus({preventScroll:true})}
function closeAll(returnFocus=true){const modalWasOpen=!$('#productModal').hidden;if(modalWasOpen&&returnFocus)closeProductVisual(hideAll);else hideAll();if(modalWasOpen)clearProductURL();if(returnFocus)lastFocus?.focus?.({preventScroll:true})}
// Ao fechar, a peça volta para o card de origem quando ele está na tela (View Transitions); senão fecha direto.
function closeProductVisual(done){
 const card=activeModal&&$(`#productGrid [data-product="${activeModal.id}"] .card-media-a`),hero=$('#galleryHero')
 const r=card?.getBoundingClientRect()
 if(!document.startViewTransition||reducedMotion()||!card||!hero||!r||r.bottom<0||r.top>innerHeight){done();return}
 hero.style.viewTransitionName='gb-product';document.documentElement.classList.add('vt-product')
 const vt=document.startViewTransition(()=>{hero.style.viewTransitionName='';done();card.style.viewTransitionName='gb-product'})
 vt.finished.finally(()=>{card.style.viewTransitionName='';document.documentElement.classList.remove('vt-product')})
}
function clearProductURL(){
 if(!new URL(location.href).searchParams.has('peca'))return
 if(productPushed){productPushed=false;history.back();return}
 const u=new URL(location.href);u.searchParams.delete('peca');history.replaceState(null,'',u)
}

/* ---------- Sacola de interesse, favoritos e busca ---------- */
function renderBag(){const el=$('#bagContent');if(!bag.length){el.innerHTML=`<div class="drawer-empty"><strong>SUA SELEÇÃO ESTÁ VAZIA.</strong><p>Salve um conjunto com suas preferências de tamanho para consultar depois.</p></div>`;$('#bagCopy')&&($('#bagCopy').disabled=true);return}$('#bagCopy')&&($('#bagCopy').disabled=false);el.innerHTML=bag.map((item,i)=>{const p=productById(item.id);return `<div class="drawer-lineitem"><button class="drawer-thumb" data-openfav="${p.id}" aria-label="Ver ${escaped(p.name)}">${productMedia(p)}</button><div class="drawer-linecopy"><b>${escaped(p.name)}</b><span>${p.single?`Tamanho: ${escaped(item.top)}`:`Superior: ${escaped(item.top)} / Inferior: ${escaped(item.bottom)}`}</span><span>Preço e disponibilidade a confirmar</span><button data-removebag="${i}">REMOVER ×</button></div></div>`}).join('')}
function renderWishlist(){const el=$('#wishContent');if(!favorites.length){el.innerHTML=`<div class="drawer-empty"><strong>SEM FAVORITOS AINDA.</strong><p>Toque no coração de uma peça para guardar sua escolha.</p></div>`;return}el.innerHTML=favorites.map(id=>{const p=productById(id);return `<div class="drawer-lineitem"><button class="drawer-thumb" data-openfav="${p.id}" aria-label="Ver ${escaped(p.name)}">${productMedia(p)}</button><div class="drawer-linecopy"><b>${escaped(p.name)}</b><span>${escaped(p.label)} · cadastro em revisão</span><button data-openfav="${p.id}">VER PEÇA ↗</button><button data-fav="${p.id}">REMOVER ×</button></div></div>`}).join('')}
const SEARCH_HINTS=['Agasalho','Kit','Real Madrid','Manchester','Chelsea','Short']
function renderSearch(q=''){
 const found=q.trim()?PRODUCTS.filter(p=>matchesQuery(p,q)):[]
 const hints=`<div class="search-hints"><span>SUGESTÕES</span>${SEARCH_HINTS.map(h=>`<button type="button" data-search-hint="${h}">${h}</button>`).join('')}</div>`
 if(!q.trim()){$('#searchResults').innerHTML=hints+`<div class="search-all"><span>TODA A SELEÇÃO / ${pad2(PRODUCTS.length)}</span>${PRODUCTS.map(p=>`<button class="search-result" data-searchproduct="${p.id}"><span class="drawer-thumb">${productMedia(p)}</span><span><b>${escaped(p.name)}</b><p>${escaped(p.label)} · Em revisão</p></span><span class="search-go" aria-hidden="true">↗</span></button>`).join('')}</div>`;return}
 $('#searchResults').innerHTML=found.length?`<p class="search-count" role="status">${pad2(found.length)} resultado${found.length===1?'':'s'}</p>`+found.map(p=>`<button class="search-result" data-searchproduct="${p.id}"><span class="drawer-thumb">${productMedia(p)}</span><span><b>${escaped(p.name)}</b><p>${escaped(p.label)} · Em revisão</p></span><span class="search-go" aria-hidden="true">↗</span></button>`).join(''):`<div class="drawer-empty"><strong>NENHUMA PEÇA ENCONTRADA.</strong><p>Busque pelo tipo de conjunto, pelo time ou pela referência do catálogo.</p></div>`+hints
}
function copyText(text){
 if(navigator.clipboard?.writeText)return navigator.clipboard.writeText(text).then(()=>true,()=>legacyCopy(text))
 return Promise.resolve(legacyCopy(text))
}
function legacyCopy(text){const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0;top:0';document.body.appendChild(t);t.select();let ok=false;try{ok=document.execCommand('copy')}catch{}t.remove();return ok}
// Mensagem de atendimento no tom do manual V1: pede confirmação, não promete nada.
function interestMessage(items){
 const lines=items.map(({p,top,bottom})=>`• ${p.name}${top||bottom?` — ${p.single?`tamanho ${top}`:`superior ${top||'?'} / inferior ${bottom||'?'}`}`:''}`)
 return `Salve, GB! Vi estas peças no site e queria consultar:\n${lines.join('\n')}\nPode me confirmar disponibilidade, tamanhos e valores?`
}
function consult(items){copyText(interestMessage(items)).then(ok=>{toast(ok?'Mensagem copiada. Cole no Direct da GB para confirmar disponibilidade.':'Abra o Direct da GB e informe a peça e o tamanho.');window.open(INSTAGRAM,'_blank','noopener,noreferrer')})}

/* ---------- Detalhe da peça (PDP) ---------- */
function rememberRecent(id){recent=[id,...recent.filter(x=>x!==id)].slice(0,8);lsSave('gb-v06-recent',recent);renderRecent()}
function renderRecent(){
 const el=$('#recentStrip');if(!el)return
 const items=recent.map(productById).filter(Boolean)
 el.hidden=items.length<2
 el.querySelector('.recent-list').innerHTML=items.map(p=>`<button type="button" class="recent-item" data-product="${p.id}" aria-label="Ver ${escaped(p.name)}"><span class="drawer-thumb">${productMedia(p)}</span><span>${escaped(p.name)}</span></button>`).join('')
}
function detailModal(p,opts={}){
 if(!p)return
 const sameProduct=activeModal?.id===p.id&&!$('#productModal').hidden
 activeModal=p;modalView=availableViews(p)[0];topSize='';bottomSize=''
 const show=()=>{renderProductModal();if($('#productModal').hidden)openDialog('productModal');else $('#productModal').scrollTop=0}
 if(opts.transition&&document.startViewTransition&&!reducedMotion()&&!sameProduct){
  const src=opts.transition;src.style.viewTransitionName='gb-product'
  document.documentElement.classList.add('vt-product')
  const vt=document.startViewTransition(()=>{src.style.viewTransitionName='';show();$('#productModal').classList.add('no-anim');const hero=$('#galleryHero');if(hero)hero.style.viewTransitionName='gb-product'})
  vt.finished.finally(()=>{const hero=$('#galleryHero');if(hero)hero.style.viewTransitionName='';document.documentElement.classList.remove('vt-product')})
 }else{show();if(opts.transition&&window.GBMotion&&!sameProduct){const hero=$('#galleryHero .garment-svg');if(hero)GBMotion.flipClone(opts.transition,hero)}}
 const u=new URL(location.href),had=u.searchParams.has('peca')
 if(u.searchParams.get('peca')!==p.id){u.searchParams.set('peca',p.id);if(opts.replace||had)history.replaceState({peca:p.id},'',u);else{history.pushState({peca:p.id},'',u);productPushed=true}}
 rememberRecent(p.id)
}
function stepProduct(dir){if(!activeModal)return;const filtered=catalogList(),list=filtered.length>1?filtered:PRODUCTS;let i=list.findIndex(p=>p.id===activeModal.id);if(i<0)i=0;detailModal(list[(i+dir+list.length)%list.length],{replace:true})}
function renderProductModal(){
 const p=activeModal;if(!p)return
 const views=availableViews(p),labels={combo:'CONJUNTO',top:'SUPERIOR',bottom:'INFERIOR'}
 const filtered=catalogList(),list=filtered.length>1?filtered:PRODUCTS,pos=Math.max(0,list.findIndex(x=>x.id===p.id))
 const fav=favorites.includes(p.id),photo=hasPhoto(p)
 const related=PRODUCTS.filter(x=>x.id!==p.id&&x.category===p.category).slice(0,8)
 const rel=related.length?related.slice((PRODUCTS.indexOf(p))%Math.max(1,related.length-3)).slice(0,4):[]
 const sizeGroup=(part,label,current)=>`<div class="size-label"><span>${label}</span><small>PREFERÊNCIA / NÃO CONFIRMA ESTOQUE</small></div><div class="size-buttons" role="group" aria-label="Selecionar ${label.toLowerCase()}">${['P','M','G','GG'].map(s=>`<button type="button" data-size="${part}" data-value="${s}" class="${current===s?'active':''}" aria-pressed="${current===s}">${s}</button>`).join('')}</div>`
 $('#productModal').innerHTML=`<button class="modal-close" data-close aria-label="Fechar detalhes">✕</button>
 <div class="product-gallery"><div class="gallery-topline"><span>GB / ${photo?'IMAGEM DO ACERVO':'ESTUDO DE PRODUTO'} / ${escaped(p.id)}</span><span>${views.length>1?`${pad2(views.indexOf(modalView)+1)} / ${pad2(views.length)}`:''}</span></div>
 <div class="gallery-hero" id="galleryHero" data-view="${modalView}">${productMedia(p,modalView)}${views.length>1?`<button type="button" class="gallery-step gallery-prev" data-gallery-step="-1" aria-label="Vista anterior">←</button><button type="button" class="gallery-step gallery-next" data-gallery-step="1" aria-label="Próxima vista">→</button>`:''}</div>
 ${views.length>1?`<div class="gallery-thumbs" role="group" aria-label="Vistas da peça">${views.map(view=>`<button type="button" data-gallery="${view}" aria-label="Ver ${VIEW_LABEL[view]}" aria-pressed="${modalView===view}" class="${modalView===view?'active':''}">${productMedia(p,view)}<small>${labels[view]}</small></button>`).join('')}</div>`:''}
 ${photo?'':`<p class="gallery-note">Ilustração de estudo. A imagem do acervo desta peça entra assim que o recorte oficial for importado.</p>`}</div>
 <div class="product-detail"><div class="detail-nav"><button type="button" data-step-product="-1" aria-label="Peça anterior">← ANTERIOR</button><span>${pad2(pos+1)} / ${pad2(list.length)}</span><button type="button" data-step-product="1" aria-label="Próxima peça">PRÓXIMA →</button></div>
 <span class="detail-heading">GB / ${escaped(p.label.toUpperCase())} / ${escaped(p.tag)}</span><h2>${escaped(p.name).toUpperCase()}</h2>
 <p>${p.single?'Peça do acervo GB.':`Conjunto ${p.category==='track'?'agasalho + calça':'camisa + short'} com vistas do kit completo e das partes.`} Nome de trabalho para organização do catálogo — não confirma marca, licença ou procedência.</p>
 <dl class="detail-facts"><div><dt>PREÇO</dt><dd>A confirmar com a GB</dd></div><div><dt>ESTOQUE / TAMANHOS</dt><dd>A confirmar por variante</dd></div><div><dt>ENTREGA / RETIRADA</dt><dd>Condições em validação</dd></div></dl>
 ${p.single?sizeGroup('top','TAMANHO',topSize):sizeGroup('top','TAMANHO DA PARTE SUPERIOR',topSize)+sizeGroup('bottom','TAMANHO DA PARTE INFERIOR',bottomSize)}
 <div class="detail-add"><button type="button" class="btn btn-yellow" id="addInterest">ADICIONAR À SELEÇÃO DE INTERESSE <span>↗</span></button>
 <div class="detail-actions"><button type="button" class="detail-action ${fav?'is-fav':''}" data-fav="${p.id}" aria-pressed="${fav}">${heartSVG}<span>${fav?'SALVO':'SALVAR'}</span></button><button type="button" class="detail-action" data-consult="${p.id}">CONSULTAR NA GB ↗</button><button type="button" class="detail-action" data-share="${p.id}">COPIAR LINK</button></div></div>
 <p class="detail-footer">Tamanhos indicam preferência, não disponibilidade nem equivalência garantida. Nenhuma cobrança ocorre nesta versão.</p>
 ${rel.length?`<div class="detail-related"><span>MESMA LINHA / ${escaped(p.label.toUpperCase())}</span><div>${rel.map(r=>`<button type="button" data-related="${r.id}" aria-label="Ver ${escaped(r.name)}"><span class="drawer-thumb">${productMedia(r)}</span><small>${escaped(r.name)}</small></button>`).join('')}</div></div>`:''}
 </div>`
}
function setGalleryView(view){
 const p=activeModal,views=availableViews(p);if(!views.includes(view))return
 const dir=views.indexOf(view)>views.indexOf(modalView)?1:-1;modalView=view
 const hero=$('#galleryHero');if(!hero){renderProductModal();return}
 const media=productMedia(p,view);const current=hero.querySelector('.garment-svg');const wrap=document.createElement('div');wrap.innerHTML=media;const next=wrap.firstElementChild
 if(current&&!reducedMotion()){next.classList.add('view-enter');next.style.setProperty('--dir',dir);current.replaceWith(next)}else if(current)current.replaceWith(next)
 hero.dataset.view=view
 $$('[data-gallery]').forEach(b=>{const on=b.dataset.gallery===view;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))})
 const counter=$('.gallery-topline span:last-child');if(counter&&views.length>1)counter.textContent=`${pad2(views.indexOf(view)+1)} / ${pad2(views.length)}`
}
function saveInterest(){
 const p=activeModal
 if(!topSize||(!p.single&&!bottomSize)){toast(p.single?'Selecione um tamanho.':'Selecione os tamanhos das duas peças.');return}
 const bottom=p.single?'':bottomSize
 if(!bag.some(x=>x.id===p.id&&x.top===topSize&&x.bottom===bottom))bag.push({id:p.id,top:topSize,bottom})
 lsSave('gb-v03-bag',bag);updateCounters();renderBag();closeAll(false);openDialog('bagDrawer');toast('Peça salva na sua seleção de interesse.')
}

/* ---------- Hero: troca de capítulo com saída e entrada coreografadas ---------- */
const splitLines=(html)=>html.split(/<br\s*\/?>/i).map((line,i)=>`<span class="hl" style="--l:${i}"><span>${line}</span></span>`).join('')
function changeHero(next){
 heroIndex=(next+heroSlides.length)%heroSlides.length;const slide=heroSlides[heroIndex],stage=$('#heroStage')
 window.GBHeroStage?.go(heroIndex) // V07: o trio gira imediatamente; o texto troca em seguida
 const swap=()=>{$('#heroEyebrow').textContent=slide.eyebrow;$('#heroTitle').innerHTML=splitLines(slide.title);$('#heroSub').textContent=slide.sub;if(!window.GBHeroStage)$('#heroProduct').innerHTML=productMedia(slide.product);$('#heroNum').textContent=pad2(heroIndex+1);const tag=$('#heroSceneName');if(tag)tag.textContent=slide.product.name;document.dispatchEvent(new CustomEvent('gb:hero',{detail:{index:heroIndex,product:slide.product}}))}
 if(reducedMotion()){swap();return}
 stage.classList.remove('is-in');stage.classList.add('is-out')
 setTimeout(()=>{swap();stage.classList.remove('is-out');void stage.offsetWidth;stage.classList.add('is-in')},260)
}

function applyURLState(){
 const u=new URL(location.href),cat=u.searchParams.get('cat'),q=u.searchParams.get('q'),ordem=u.searchParams.get('ordem')
 if(cat&&['track','short','extra','saved'].includes(cat))currentFilter=cat
 if(q){searchQuery=q.slice(0,60);const input=$('#catalogSearch');if(input)input.value=searchQuery}
 if(ordem&&['az','za'].includes(ordem)){sortMode=ordem;const sel=$('#sortSelect');if(sel)sel.value=ordem}
 $$('.filter').forEach(b=>{const on=b.dataset.filter===currentFilter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))})
}
function init(){
 document.body.insertAdjacentHTML('afterbegin',SHADE_DEFS)
 $('#heroProduct').innerHTML=productMedia(heroSlides[0].product)
 $('#heroTitle').innerHTML=splitLines($('#heroTitle').innerHTML)
 $('#categoryTrack').innerHTML=productMedia(PRODUCTS[3])
 $('#categoryShort').innerHTML=productMedia(PRODUCTS[7])
 applyURLState();renderProducts();updateCounters();renderRecent()
 $('#heroPrev').addEventListener('click',()=>changeHero(heroIndex-1));$('#heroNext').addEventListener('click',()=>changeHero(heroIndex+1))
 $$('.filter').forEach(b=>b.addEventListener('click',()=>selectFilter(b.dataset.filter)))
 $$('#showMore').forEach(b=>b.addEventListener('click',()=>{showAll=!showAll;renderProducts()}))
 $('#sortSelect')?.addEventListener('change',e=>{sortMode=e.target.value;renderProducts()})
 let searchTimer=0;$('#catalogSearch')?.addEventListener('input',e=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{searchQuery=e.target.value.trim().slice(0,60);renderProducts()},120)})
 $$('.category-tile').forEach(b=>b.addEventListener('click',()=>{const go=()=>{selectFilter(b.dataset.goFilter);$('#colecao').scrollIntoView({behavior:window.gbWipe?'auto':'smooth'})};window.gbWipe?window.gbWipe(go,b.dataset.goFilter==='track'?'CONJUNTOS':'CAMISA + SHORT'):go()}))
 $('#productGrid').addEventListener('click',e=>{const fav=e.target.closest('[data-fav]');if(fav){toggleFavorite(fav.dataset.fav);return}if(e.target.closest('[data-catalog-reset]')){searchQuery='';const i=$('#catalogSearch');if(i)i.value='';selectFilter('all');return}const product=e.target.closest('[data-product]');if(product)detailModal(productById(product.dataset.product),{transition:product.querySelector('.card-media-a')})})
 $('#productGrid').addEventListener('pointerover',e=>{const v=e.target.closest?.('.product-visual'),b=v?.querySelector('[data-lazy-view]');if(b&&!b.firstChild){b.innerHTML=productMedia(productById(v.dataset.product),b.dataset.lazyView)}},{passive:true})
 $('#recentStrip')?.addEventListener('click',e=>{const b=e.target.closest('[data-product]');if(b)detailModal(productById(b.dataset.product))})
 $('#menuOpen').addEventListener('click',()=>openDialog('navDrawer'))
 $('#searchOpen').addEventListener('click',()=>{renderSearch($('#searchInput').value);openDialog('searchDrawer');setTimeout(()=>$('#searchInput').focus(),50)})
 $('#wishlistOpen').addEventListener('click',()=>{renderWishlist();openDialog('wishlistDrawer')})
 $('#bagOpen').addEventListener('click',()=>{renderBag();openDialog('bagDrawer')})
 $('#overlay').addEventListener('click',()=>closeAll())
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape')closeAll()
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();renderSearch($('#searchInput').value);openDialog('searchDrawer');$('#searchInput').focus()}
  if(!$('#productModal').hidden&&!e.target.closest?.('input,textarea,select')){if(e.key==='ArrowRight'){e.preventDefault();stepProduct(1)}if(e.key==='ArrowLeft'){e.preventDefault();stepProduct(-1)}}
 })
 document.addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))closeAll()
  let r=e.target.closest('[data-removebag]');if(r){bag.splice(Number(r.dataset.removebag),1);lsSave('gb-v03-bag',bag);renderBag();updateCounters();toast('Removido da seleção.')}
  let w=e.target.closest('#wishlistDrawer [data-fav],#productModal [data-fav]');if(w)toggleFavorite(w.dataset.fav)
  let wo=e.target.closest('[data-openfav]');if(wo)detailModal(productById(wo.dataset.openfav))
  let sr=e.target.closest('[data-searchproduct]');if(sr)detailModal(productById(sr.dataset.searchproduct))
  let hint=e.target.closest('[data-search-hint]');if(hint){$('#searchInput').value=hint.dataset.searchHint;renderSearch(hint.dataset.searchHint);$('#searchInput').focus()}
  const gallery=e.target.closest('[data-gallery]');if(gallery)setGalleryView(gallery.dataset.gallery)
  const gstep=e.target.closest('[data-gallery-step]');if(gstep){const v=availableViews(activeModal);setGalleryView(v[(v.indexOf(modalView)+Number(gstep.dataset.galleryStep)+v.length)%v.length])}
  const pstep=e.target.closest('[data-step-product]');if(pstep)stepProduct(Number(pstep.dataset.stepProduct))
  const rel=e.target.closest('[data-related]');if(rel)detailModal(productById(rel.dataset.related),{replace:true})
  const size=e.target.closest('[data-size]');if(size){if(size.dataset.size==='top')topSize=size.dataset.value;else bottomSize=size.dataset.value;$$(`[data-size="${size.dataset.size}"]`).forEach(b=>{const on=b===size;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))})}
  if(e.target.closest('#addInterest'))saveInterest()
  const cons=e.target.closest('[data-consult]');if(cons){const p=productById(cons.dataset.consult);consult([{p,top:topSize,bottom:p.single?'':bottomSize}])}
  const share=e.target.closest('[data-share]');if(share){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('peca',share.dataset.share);copyText(u.href).then(ok=>toast(ok?'Link da peça copiado.':u.href))}
 })
 // Swipe na galeria do detalhe (mobile): troca de vista sem bloquear o scroll vertical.
 let gx=0,gy=0;$('#productModal').addEventListener('touchstart',e=>{if(!e.target.closest('#galleryHero'))return;gx=e.touches[0].clientX;gy=e.touches[0].clientY},{passive:true})
 $('#productModal').addEventListener('touchend',e=>{if(!gx||!activeModal)return;const dx=e.changedTouches[0].clientX-gx,dy=e.changedTouches[0].clientY-gy;gx=0;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){const v=availableViews(activeModal);setGalleryView(v[(v.indexOf(modalView)+(dx<0?1:-1)+v.length)%v.length])}},{passive:true})
 $('#searchInput').addEventListener('input',e=>renderSearch(e.target.value))
 $('#bagContact').addEventListener('click',()=>{if(!bag.length){toast('Sua seleção está vazia.');return}consult(bag.map(i=>({p:productById(i.id),top:i.top,bottom:i.bottom})))})
 $('#bagCopy')?.addEventListener('click',()=>{if(!bag.length)return;copyText(interestMessage(bag.map(i=>({p:productById(i.id),top:i.top,bottom:i.bottom})))).then(ok=>toast(ok?'Lista copiada para enviar à GB.':'Não foi possível copiar automaticamente.'))})
 // Imagem do acervo quebrada volta ao estudo, sem caixa vazia.
 document.addEventListener('error',e=>{const img=e.target;if(img?.classList?.contains('actual-photo')){const p=productById(img.dataset.pid);if(p){const w=document.createElement('div');w.innerHTML=garmentSVG(p,img.dataset.mode||'combo');img.replaceWith(w.firstElementChild)}}},true)
 window.addEventListener('popstate',()=>{const id=new URL(location.href).searchParams.get('peca');productPushed=false;if(id&&productById(id)){activeModal=productById(id);modalView=availableViews(activeModal)[0];renderProductModal();if($('#productModal').hidden)openDialog('productModal')}else if(!$('#productModal').hidden){closeProductVisual(hideAll);lastFocus?.focus?.({preventScroll:true})}})
 const initial=new URL(location.href).searchParams.get('peca');if(initial&&productById(initial))detailModal(productById(initial),{replace:true})
 if('IntersectionObserver'in window&&!reducedMotion()){document.body.classList.add('js-motion');const io=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('visible');io.unobserve(en.target)}}),{threshold:.12});$$('.reveal').forEach(el=>io.observe(el))}
}
init()
