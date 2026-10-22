/**
 * GB IMPORTS / FLAGSHIP V02
 * Arte e produtos: estudo visual, não confirmação de catálogo, marcas ou preço.
 * Substituir arte SVG por fotos licenciadas no catálogo ao integrar PIM.
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
const heroSlides = [
  {eyebrow:'THE GB EDIT / CAPÍTULO 001',title:'O ESTILO<br>É <span class="emphasis">SEU.</span><br><span class="hero-title-outline">O MUNDO</span><br> TAMBÉM<span class="yellow-dot">.</span>',sub:'Peças, combinações e liberdade para construir o visual sem seguir o roteiro de ninguém.',product:PRODUCTS[1]},
  {eyebrow:'GB / A CURADORIA · 002',title:'LOOK<br>NÃO É<br><span class="emphasis">UNIFORME.</span><br>É ATITUDE<span class="yellow-dot">.</span>',sub:'Da rua para o seu dia. Escolha o que veste, não o que te define.',product:PRODUCTS[7]},
  {eyebrow:'GB / NOVO CAPÍTULO · 003',title:'SEU CORRE.<br><span class="emphasis">SEU</span><br><span class="hero-title-outline">PRÓXIMO</span><br>CAPÍTULO<span class="yellow-dot">.</span>',sub:'Tudo começa na escolha. A GB leva o produto e a experiência mais perto de você.',product:PRODUCTS[4]},
]
const $ = (sel,scope=document)=>scope.querySelector(sel)
const $$ = (sel,scope=document)=>[...scope.querySelectorAll(sel)]
const escaped = (s)=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')
function lsRead(k,fallback){try {return JSON.parse(localStorage.getItem(k)) ?? fallback} catch{return fallback}}
function lsSave(k,data){try{localStorage.setItem(k,JSON.stringify(data))}catch{}}
let favorites=lsRead('gb-v03-favs',[]).filter(id=>PRODUCTS.some(p=>p.id===id))
let bag=lsRead('gb-v03-bag',[]).filter(p=>PRODUCTS.some(x=>x.id===p.id))
let currentFilter='all',sortReverse=false,showAll=false,heroIndex=0,activeModal=null,modalView='combo',topSize='',bottomSize='',toastTimeout=0,lastFocus=null
const colorId = (prefix,p)=>`${prefix}-${p.id.replace(/[^a-z0-9]/gi,'')}`
function shirtShape(p,jacket=false){
 const collar='#3339'
 return `<path d="M63 39 L45 47 Q29 50 21 74 L2 109 L44 130 L61 103 L57 244 Q108 260 159 244 L155 103 L171 129 L212 108 L190 69 Q182 49 164 46 L144 38 Q104 59 63 39Z" fill="${p.top}" stroke="#171717" stroke-opacity=".3" stroke-width="1.6"/>
 <path d="M63 39Q103 59 144 38L136 27Q103 44 73 27Z" fill="${p.accent}" stroke="#17171733" stroke-width="1"/>
 <path d="M74 27Q104 53 136 27" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
 <path d="M48 61L13 111M165 61L201 109" fill="none" stroke="${p.stripe}" stroke-width="8" opacity=".88"/>
 <path d="M63 44L61 239M154 44L156 239" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2"/>
 ${jacket?`<path d="M105 45V249" fill="none" stroke="#090909" stroke-width="4" opacity=".72"/><path d="M105 52V242" fill="none" stroke="#e8e6dd" stroke-width="1" opacity=".66"/><path d="M72 173L92 189M138 189L155 173" stroke="#151515" stroke-opacity=".5" stroke-width="2"/>`: `<path d="M85 61Q104 67 125 61" fill="none" stroke="${p.accent}" stroke-width="2"/><path d="M70 88H150" stroke="${p.stripe}" stroke-opacity=".6" stroke-width="2"/>`}
 <path d="M59 244Q106 252 158 244" stroke="#000" stroke-opacity=".22" stroke-width="6" fill="none"/><path d="M35 70Q23 92 15 107M178 68L197 107" stroke="#fff" stroke-opacity=".25" stroke-width="4" fill="none"/>
 <text x="131" y="95" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" letter-spacing="1" fill="#181818" opacity=".35">GB</text>`
}
function bottomShape(p,short=false){return short? `<path d="M25 37Q102 45 184 37L204 184L127 199L107 124L91 200L7 185Z" fill="${p.bottom}" stroke="#131313" stroke-opacity=".35" stroke-width="2"/>
 <path d="M24 42Q103 51 185 42" fill="none" stroke="${p.stripe}" stroke-opacity=".6" stroke-width="9"/>
 <path d="M107 52L107 118M25 78L15 167M182 78L195 164" stroke="#fff" stroke-opacity=".19" stroke-width="2" fill="none"/>
 <path d="M10 187L90 201M129 200L202 185" stroke="${p.accent}" stroke-opacity=".5" stroke-width="3"/>
 <path d="M51 64L49 169M165 64L178 171" stroke="${p.stripe}" stroke-width="4" stroke-opacity=".55" fill="none"/>`: `<path d="M22 12Q106 24 189 12L195 54L172 285L124 289L106 100L89 289L40 285L16 55Z" fill="${p.bottom}" stroke="#171717" stroke-opacity=".35" stroke-width="2"/>
 <path d="M25 23Q106 35 187 23" stroke="${p.accent}" stroke-opacity=".35" stroke-width="8" fill="none"/>
 <path d="M106 40L106 97M19 51L41 280M190 51L170 280" stroke="${p.stripe}" stroke-opacity=".52" stroke-width="5" fill="none"/>
 <path d="M42 282Q64 289 88 283M124 283Q147 288 172 282" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="7"/>
 <path d="M48 52L64 176M169 52L146 176" stroke="#fff" stroke-opacity=".16" stroke-width="2" fill="none"/>`}
function garmentSVG(p,mode='combo',extraClass='garment-svg'){
 const top = shirtShape(p,p.category==='track')
 const bottom=bottomShape(p,p.category==='short')
 let pieces
 if(mode==='top')pieces=`<g transform="translate(120 80) scale(1.36)">${top}</g>`
 else if(mode==='bottom') pieces=`<g transform="translate(115 ${p.category==='track'?65:130}) scale(1.4)">${bottom}</g>`
 else pieces=`<g transform="translate(34 84) rotate(-8 103 130) scale(1.02)">${top}</g><g transform="translate(272 ${p.category==='track'?187:233}) rotate(9 103 130) scale(.92)">${bottom}</g>`
 return `<svg class="${extraClass}" viewBox="0 0 520 580" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Estudo gráfico de ${escaped(p.label)} ${escaped(p.name)}"><ellipse cx="262" cy="513" rx="175" ry="19" fill="#000" opacity=".065"/>${pieces}</svg>`
}
// Configurar fotos verdadeiras em assets-map.js; SVG continua como fallback honesto.
function productMedia(p,mode='combo'){
 const source=window.GB_ASSETS?.[p.id]?.[mode]
 if(source){return `<img class="garment-svg actual-photo" src="${escaped(source)}" alt="${escaped(p.name)} / ${mode==='combo'?'conjunto completo':mode==='top'?'parte superior':'parte inferior'}" loading="lazy" decoding="async" />`}
 return garmentSVG(p,mode)
}
const heartSVG=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20 4.5 12.6A5.3 5.3 0 0 1 12 5.9a5.3 5.3 0 0 1 7.5 6.7Z"/></svg>`
function makeCard(p,i){return `<article class="product-card"><button class="product-visual" data-product="${p.id}" aria-label="Ver detalhes de ${escaped(p.name)}"><span class="product-index">GB / ${String(i+1).padStart(2,'0')}</span>${productMedia(p)}<span class="product-badge">CADASTRO EM REVISÃO</span></button><button class="favorite-toggle ${favorites.includes(p.id)?'is-fav':''}" data-fav="${p.id}" aria-label="${favorites.includes(p.id)?'Remover favorito':'Salvar favorito'}" aria-pressed="${favorites.includes(p.id)}">${heartSVG}</button><div class="product-meta"><div><div class="product-overline">${p.label.toUpperCase()} / ESTUDO</div><div class="product-name">${escaped(p.name)}</div><div class="product-sub">Preço e tamanhos: a validar</div></div><span class="product-arrow">↗</span></div></article>`}
function renderProducts(){let products=PRODUCTS.filter(p=>currentFilter==='all'||p.category===currentFilter);if(sortReverse)products=[...products].reverse();const display=showAll?products:products.slice(0,8);$('#productGrid').innerHTML=display.map((p,i)=>makeCard(p,i)).join('');$('#showMore').textContent=showAll?'VER MENOS ↑':'VER TODAS AS PEÇAS ↗';$('#showMore').hidden=products.length<=8}
function selectFilter(filter){currentFilter=filter;showAll=false;$$('.filter').forEach(b=>{let active=b.dataset.filter===filter;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});renderProducts()}
function updateCounters(){$('#wishCount').textContent=favorites.length;$('#wishCount').hidden=favorites.length===0;$('#bagCount').textContent=bag.length;$('#bagDrawerCount').textContent=`(${String(bag.length).padStart(2,'0')})`}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3200)}
function toggleFavorite(id){if(favorites.includes(id))favorites=favorites.filter(x=>x!==id);else favorites=[...favorites,id];lsSave('gb-v03-favs',favorites);updateCounters();renderProducts();renderWishlist();toast(favorites.includes(id)?'Adicionado aos favoritos.':'Removido dos favoritos.')}
function openDialog(id){closeAll(false);const el=$('#'+id);if(!el)return;lastFocus=document.activeElement;el.hidden=false;$('#overlay').hidden=false;document.body.classList.add('no-scroll');const close=el.querySelector('[data-close],.modal-close');close?.focus()}
function closeAll(returnFocus=true){$$('.drawer,.product-modal').forEach(x=>x.hidden=true);$('#overlay').hidden=true;document.body.classList.remove('no-scroll');if(returnFocus)lastFocus?.focus?.()}
function renderBag(){const el=$('#bagContent');if(!bag.length){el.innerHTML=`<div class="drawer-empty"><strong>SUA SELEÇÃO ESTÁ VAZIA.</strong><p>Salve um conjunto com suas preferências de tamanho para consultar depois.</p></div>`;return}el.innerHTML=bag.map((item,i)=>{const p=PRODUCTS.find(p=>p.id===item.id);return `<div class="drawer-lineitem"><div class="drawer-thumb">${productMedia(p)}</div><div class="drawer-linecopy"><b>${escaped(p.name)}</b><span>Superior: ${escaped(item.top)} / Inferior: ${escaped(item.bottom)}</span><span>Disponibilidade a confirmar</span><button data-removebag="${i}">REMOVER ×</button></div></div>`}).join('')}
function renderWishlist(){const el=$('#wishContent');if(!favorites.length){el.innerHTML=`<div class="drawer-empty"><strong>SEM FAVORITOS AINDA.</strong><p>Toque no coração de uma peça para guardar sua escolha.</p></div>`;return}el.innerHTML=favorites.map(id=>{const p=PRODUCTS.find(p=>p.id===id);return `<div class="drawer-lineitem"><div class="drawer-thumb">${productMedia(p)}</div><div class="drawer-linecopy"><b>${escaped(p.name)}</b><span>Item em revisão</span><button data-openfav="${p.id}">VER PEÇA ↗</button><button data-fav="${p.id}">REMOVER ×</button></div></div>`}).join('')}
function renderSearch(q=''){const clean=q.trim().toLocaleLowerCase('pt-BR');const found=PRODUCTS.filter(p=>`${p.name} ${p.label}`.toLocaleLowerCase('pt-BR').includes(clean));$('#searchResults').innerHTML=found.length?found.map(p=>`<button class="search-result" data-searchproduct="${p.id}"><span class="drawer-thumb">${productMedia(p)}</span><span><b>${escaped(p.name)}</b><p>${escaped(p.label)} · Em revisão</p></span><span style="margin-left:auto">↗</span></button>`).join(''):`<div class="drawer-empty"><strong>NENHUMA PEÇA ENCONTRADA.</strong><p>Busque pelo tipo de conjunto ou pela referência do catálogo.</p></div>`}
function detailModal(p){activeModal=p;modalView='combo';topSize='';bottomSize='';renderProductModal();openDialog('productModal')}
function renderProductModal(){const p=activeModal;if(!p)return;$('#productModal').innerHTML=`<button class="modal-close" data-close aria-label="Fechar detalhes">✕</button><div class="product-gallery"><span style="font-size:10px;letter-spacing:1.4px;font-weight:900">GB / ESTUDO DE PRODUTO / ${escaped(p.id)}</span><div class="gallery-hero" id="galleryHero">${productMedia(p,modalView)}</div><div class="gallery-thumbs">${[['combo','CONJUNTO'],['top','SUPERIOR'],['bottom','INFERIOR']].map(([view,label])=>`<button data-gallery="${view}" aria-label="Ver ${label.toLowerCase()}" title="${label}" class="${modalView===view?'active':''}">${productMedia(p,view)}</button>`).join('')}</div></div><div class="product-detail"><span class="detail-heading">GB / ${p.label.toUpperCase()} / ${p.tag}</span><h2>${escaped(p.name).toUpperCase()}</h2><p>Visualização demonstrativa do conjunto. A composição de imagens será substituída pelas fotos reais do catálogo, com vistas do kit e das peças separadas.</p><div class="detail-status"><b>PRODUTO EM VALIDAÇÃO</b><br>Preço, marca comercial, medidas, estoque, procedência e prazo ainda não confirmados.</div><div class="size-label"><span>TAMANHO DA PARTE SUPERIOR</span><small>REFERÊNCIA INTERNACIONAL</small></div><div class="size-buttons" role="group" aria-label="Selecionar tamanho da parte superior">${['S','M','L','XL'].map(s=>`<button data-size="top" data-value="${s}" class="${topSize===s?'active':''}" aria-pressed="${topSize===s}">${s}</button>`).join('')}</div><div class="size-label"><span>TAMANHO DA PARTE INFERIOR</span><small>REFERÊNCIA INTERNACIONAL</small></div><div class="size-buttons" role="group" aria-label="Selecionar tamanho da parte inferior">${['S','M','L','XL'].map(s=>`<button data-size="bottom" data-value="${s}" class="${bottomSize===s?'active':''}" aria-pressed="${bottomSize===s}">${s}</button>`).join('')}</div><div class="detail-add"><button class="btn btn-yellow" id="addInterest">ADICIONAR À SELEÇÃO DE INTERESSE <span>↗</span></button></div><p class="detail-footer">Tamanhos escolhidos indicam preferência, não disponibilidade ou equivalência garantida com numeração brasileira. Nenhuma cobrança ocorre nesta versão.</p></div>`}
function saveInterest(){if(!topSize||!bottomSize){toast('Selecione os tamanhos das duas peças.');return}if(!bag.some(x=>x.id===activeModal.id&&x.top===topSize&&x.bottom===bottomSize))bag.push({id:activeModal.id,top:topSize,bottom:bottomSize});lsSave('gb-v03-bag',bag);updateCounters();renderBag();closeAll();toast('Peça salva na sua seleção de interesse.');openDialog('bagDrawer')}
function changeHero(next){heroIndex=(next+heroSlides.length)%heroSlides.length;const slide=heroSlides[heroIndex];$('#heroTitle').style.opacity='0';$('#heroTitle').style.transform='translateY(8px)';setTimeout(()=>{$('#heroEyebrow').textContent=slide.eyebrow;$('#heroTitle').innerHTML=slide.title;$('#heroSub').textContent=slide.sub;$('#heroProduct').innerHTML=productMedia(slide.product);$('#heroNum').textContent=String(heroIndex+1).padStart(2,'0');$('#heroTitle').style.opacity='1';$('#heroTitle').style.transform='translateY(0)'},160)}
function init(){
 $('#heroProduct').innerHTML=productMedia(heroSlides[0].product)
 $('#categoryTrack').innerHTML=productMedia(PRODUCTS[3])
 $('#categoryShort').innerHTML=productMedia(PRODUCTS[7])
 renderProducts();updateCounters()
 $('#heroPrev').addEventListener('click',()=>changeHero(heroIndex-1));$('#heroNext').addEventListener('click',()=>changeHero(heroIndex+1))
 $$('.filter').forEach(b=>b.addEventListener('click',()=>selectFilter(b.dataset.filter)))
 $$('#showMore').forEach(b=>b.addEventListener('click',()=>{showAll=!showAll;renderProducts()}))
 $('#sortToggle').addEventListener('click',()=>{sortReverse=!sortReverse;renderProducts();$('#sortToggle').innerHTML=`ORDENAR: ${sortReverse?'ORDEM INVERSA':'CURADORIA'} <span>↓</span>`})
 $$('.category-tile').forEach(b=>b.addEventListener('click',()=>{selectFilter(b.dataset.goFilter);$('#colecao').scrollIntoView({behavior:'smooth'})}))
 $('#productGrid').addEventListener('click',e=>{const fav=e.target.closest('[data-fav]');if(fav){toggleFavorite(fav.dataset.fav);return}const product=e.target.closest('[data-product]');if(product)detailModal(PRODUCTS.find(p=>p.id===product.dataset.product))})
 $('#menuOpen').addEventListener('click',()=>openDialog('navDrawer'))
 $('#searchOpen').addEventListener('click',()=>{renderSearch();openDialog('searchDrawer');setTimeout(()=>$('#searchInput').focus(),50)})
 $('#wishlistOpen').addEventListener('click',()=>{renderWishlist();openDialog('wishlistDrawer')})
 $('#bagOpen').addEventListener('click',()=>{renderBag();openDialog('bagDrawer')})
 $('#overlay').addEventListener('click',()=>closeAll());document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAll();if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();renderSearch();openDialog('searchDrawer');$('#searchInput').focus()}})
 document.addEventListener('click',e=>{if(e.target.closest('[data-close]'))closeAll();let r=e.target.closest('[data-removebag]');if(r){bag.splice(Number(r.dataset.removebag),1);lsSave('gb-v03-bag',bag);renderBag();updateCounters();toast('Removido da seleção.')}let w=e.target.closest('#wishlistDrawer [data-fav]');if(w)toggleFavorite(w.dataset.fav);let wo=e.target.closest('[data-openfav]');if(wo)detailModal(PRODUCTS.find(p=>p.id===wo.dataset.openfav));let sr=e.target.closest('[data-searchproduct]');if(sr)detailModal(PRODUCTS.find(p=>p.id===sr.dataset.searchproduct));const gallery=e.target.closest('[data-gallery]');if(gallery){modalView=gallery.dataset.gallery;renderProductModal()}const size=e.target.closest('[data-size]');if(size){if(size.dataset.size==='top')topSize=size.dataset.value;else bottomSize=size.dataset.value;renderProductModal()}if(e.target.closest('#addInterest'))saveInterest()})
 $('#searchInput').addEventListener('input',e=>renderSearch(e.target.value))
 $('#bagContact').addEventListener('click',()=>{closeAll();toast('O canal direto ainda será confirmado. O perfil oficial da GB está disponível.');window.open(INSTAGRAM,'_blank','noopener,noreferrer')})
 if('IntersectionObserver'in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.body.classList.add('js-motion');const io=new IntersectionObserver(entries=>entries.forEach(en=>{if(en.isIntersecting){en.target.classList.add('visible');io.unobserve(en.target)}}),{threshold:.12});$$('.reveal').forEach(el=>io.observe(el))}
}
init()
