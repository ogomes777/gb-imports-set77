/* GB Imports V39 | Adaptive Navigation
   Reference: Street Goose interaction patterns. No fake auth/orders/XP.
   One passive scroll handler; no continuous animation loop. */
(()=>{
 'use strict';
 const header=document.querySelector('#top.site-header.gb-island');
 if(!header)return;
 const $=s=>document.querySelector(s);
 const search=$('#searchDrawer'),searchInput=$('#searchInput'),suggestions=$('#gbSearchSuggestions');
 const accountBtn=$('#gbAccountOpen'),account=$('#gbAccountPanel');
 const settingsBtn=$('#gbSettingsOpen'),settings=$('#gbSettingsPanel');
 const links=Array.from(header.querySelectorAll('.desktop-nav a[href^="#"]'));
 const sections=['inicio','rail','colecao','showroom','categorias','lookstudio','universo','atendimento']
   .map(id=>document.getElementById(id)).filter(Boolean);
 let heroIndex=0,lastAmbient='',queued=false,navOpen=false;
 const setAmbient=()=>{
   queued=false;
   if(document.querySelector('#gbRibbonBoot.is-opening'))return;
   const probe=Math.min(innerHeight*.47,460);
   let current=sections.find(section=>{const r=section.getBoundingClientRect();return r.top<=probe&&r.bottom>probe;});
   if(!current)current=sections.find(section=>section.getBoundingClientRect().bottom>probe)||sections.at(-1);
   const id=current?.id||'inicio';
   const bodyTheme=document.body.dataset.gbTheme||'origem';
   let ambient=({
     inicio:['pearl','gold','graphite'][heroIndex%3],
     rail:'pearl',colecao:'pearl',showroom:'ice',categorias:'gold',
     lookstudio:'graphite',universo:'graphite',atendimento:'pearl'
   })[id]||'pearl';
   if(bodyTheme==='sinal'&&ambient==='pearl')ambient='graphite';
   if(ambient!==lastAmbient){header.dataset.ambient=ambient;lastAmbient=ambient}
   links.forEach(link=>{
     const here=link.getAttribute('href')==='#'+id;
     link.classList.toggle('is-here',here);
     if(here)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');
   });
 };
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(setAmbient)};
 addEventListener('scroll',schedule,{passive:true});
 addEventListener('resize',schedule,{passive:true});
 document.addEventListener('gb:hero',ev=>{heroIndex=Number(ev.detail?.index)||0;schedule()});
 addEventListener('gb:themechange',schedule);
 document.addEventListener('gb:core-ready',schedule);
 schedule();
 // Search uses existing GB search/product catalog and preserves Ctrl+K/Esc behavior.
 const syncSearch=()=>{
   const q=searchInput?.value.trim()||'';
   if(suggestions)suggestions.hidden=!!q;
   const clr=$('#gbSearchClear');if(clr)clr.hidden=!q;
 };
 searchInput?.addEventListener('input',syncSearch);
 searchInput?.addEventListener('search',syncSearch);
 $('#searchOpen')?.addEventListener('click',()=>setTimeout(syncSearch,15));
 $('#gbSearchClear')?.addEventListener('click',()=>{
   searchInput.value='';
   searchInput.dispatchEvent(new Event('input',{bubbles:true}));
   searchInput.focus();
 });
 suggestions?.addEventListener('click',e=>{
   const button=e.target.closest('[data-search-hint]');
   if(button){setTimeout(syncSearch,12)}
 });
 // Focus is handled by the original dialog engine. Extra search results are real catalog entries.
 const safeSaved=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
 const counts=()=>({saved:safeSaved('gb-v03-favs').length,bag:safeSaved('gb-v03-bag').length});
 const panelHeader=(title,side)=>'<div class="gb-nav-panel-head"><strong>'+title+'</strong><small>'+side+'</small></div>';
 const panelButton=(label,action,right)=>'<button type="button" class="gb-nav-panel-item" data-gb-action="'+action+'"><span>'+label+'</span><span>'+right+'</span></button>';
 const updateAccount=()=>{
   const c=counts();
   account.innerHTML=panelHeader('MINHA GB','ÁREA PESSOAL')+
     '<p class="gb-nav-sub">Sua curadoria neste navegador. Pedidos, login e ranking estarão disponíveis apenas quando a GB habilitar esses serviços.</p>'+
     panelButton('Favoritos salvos','favorites',String(c.saved).padStart(2,'0'))+
     panelButton('Minha seleção','bag',String(c.bag).padStart(2,'0'))+
     panelButton('Montar look','studio','↗')+
     panelButton('Explorar o shop','shop','↗');
 };
 const themeState=()=>{
   const actual=document.body.dataset.gbTheme==='sinal'?'dark':'light';
   return actual;
 };
 const updateSettings=()=>{
   const mode=themeState();
   const lang=$('#gbLanguage')?.value||'pt';
   settings.innerHTML=panelHeader('PREFERÊNCIAS','GB / EXPERIENCE')+
    '<p class="gb-nav-sub">A aparência do site é independente da cor adaptativa da navegação.</p>'+
    '<div class="gb-nav-theme-choices">'+
    ['light','dark','auto'].map((m,i)=>'<button type="button" data-gb-mode="'+m+'" aria-pressed="'+String(m===mode)+'">'+['Claro','Escuro','Sistema'][i]+'</button>').join('')+
    '</div><div class="gb-nav-panel-divider"></div>'+
    '<div class="gb-nav-settings-lang">'+['pt','en','es','it'].map(l=>'<button type="button" data-gb-lang="'+l+'" aria-pressed="'+String(l===lang)+'">'+l.toUpperCase()+'</button>').join('')+'</div>';
 };
 const closePanels=()=>{
   account.hidden=true;settings.hidden=true;
   accountBtn?.setAttribute('aria-expanded','false');
   settingsBtn?.setAttribute('aria-expanded','false');
   navOpen=false;
 };
 const togglePanel=(target)=>{
   const show=target.hidden;
   closePanels();
   if(!show)return;
   if(target===account)updateAccount();else updateSettings();
   target.hidden=false;
   (target===account?accountBtn:settingsBtn)?.setAttribute('aria-expanded','true');
   navOpen=true;
 };
 accountBtn?.addEventListener('click',e=>{e.stopPropagation();togglePanel(account)});
 settingsBtn?.addEventListener('click',e=>{e.stopPropagation();togglePanel(settings)});
 document.addEventListener('click',e=>{
   const action=e.target.closest('[data-gb-action]');
   if(action){
     closePanels();
     const a=action.dataset.gbAction;
     if(a==='favorites')$('#wishlistOpen')?.click();
     if(a==='bag')$('#bagOpen')?.click();
     if(a==='studio'||a==='shop'){
       const id=a==='studio'?'lookstudio':'colecao';
       document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
     }
     return;
   }
   const mode=e.target.closest('[data-gb-mode]');
   if(mode){
     const wanted=mode.dataset.gbMode;
     const next=wanted==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?2:0):wanted==='dark'?2:0;
     window.GBSetTheme?.(next);
     updateSettings();schedule();return;
   }
   const locale=e.target.closest('[data-gb-lang]');
   if(locale){
     const select=$('#gbLanguage');if(select){select.value=locale.dataset.gbLang;select.dispatchEvent(new Event('change',{bubbles:true}))}
     updateSettings();return;
   }
   if(navOpen&&!e.target.closest('.gb-nav-popwrap'))closePanels();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closePanels()});
 // Add genuine destinations to mobile menu instead of decorative dead-end routes.
 const mobileNav=$('#navDrawer .mobile-nav');
 if(mobileNav&&!mobileNav.querySelector('[data-gb-action]')){
   const group=document.createElement('div');group.className='gb-nav-mobile-tools';
   group.innerHTML='<div class="gb-nav-panel-divider"></div>'+
     panelButton('Buscar peças','search','⌕')+
     panelButton('Minha seleção','bag','↗')+
     panelButton('Favoritos','favorites','♡')+
     panelButton('Look Studio','studio','↗')+
     panelButton('Tema claro / escuro','theme','☼')+
     '<div class="gb-nav-settings-lang" aria-label="Idioma da GB">'+
     ['pt','en','es','it'].map(l=>'<button type="button" data-gb-lang="'+l+'">'+l.toUpperCase()+'</button>').join('')+'</div>'+
     '<p class="gb-nav-sub">Minha GB: as escolhas e favoritos ficam salvos neste navegador. Contas e pedidos ainda não estão habilitados.</p>';
   mobileNav.append(group);
 }
 document.querySelector('#navDrawer')?.addEventListener('click',e=>{
   const target=e.target.closest('[data-gb-action]');
   if(!target)return;
   const a=target.dataset.gbAction;
   document.querySelector('#navDrawer [data-close]')?.click();
   if(a==='search')$('#searchOpen')?.click();
   if(a==='bag')$('#bagOpen')?.click();
   if(a==='favorites')$('#wishlistOpen')?.click();
   if(a==='theme')$('#gbThemeToggle')?.click();
   if(a==='studio')document.getElementById('lookstudio')?.scrollIntoView({behavior:'smooth'});
 });
 window.GBNavV39={update:setAmbient,get ambient(){return header.dataset.ambient},get accountOpen(){return!account.hidden},get settingsOpen(){return!settings.hidden}};
})();
