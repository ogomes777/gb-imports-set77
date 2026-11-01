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
 const languageSelect=$('#gbLanguage'),languageTrigger=$('#gbLanguageTrigger'),languageMenu=$('#gbLanguageMenu');
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
 const panelButton=(label,action,right='')=>'<button type="button" class="gb-nav-panel-item" data-gb-action="'+action+'"><span>'+label+'</span>'+(right?'<span>'+right+'</span>':'')+'</button>';
 const updateAccount=()=>{
   const c=counts();
   account.innerHTML=panelHeader('MINHA GB','ÁREA PESSOAL')+
     '<p class="gb-nav-sub">Suas peças salvas ficam neste navegador. Para consultar tamanhos, preços e disponibilidade, fale diretamente com a GB. Contas e pedidos ainda são demonstrações.</p>'+
     panelButton('Favoritos salvos','favorites',String(c.saved).padStart(2,'0'))+
     panelButton('Minha seleção','bag',String(c.bag).padStart(2,'0'))+
     panelButton('Montar meu look','studio')+
     panelButton('Explorar as peças','shop')+
     '<div class="gb-nav-panel-divider"></div>'+
     panelButton('Minha GB, área demonstrativa','dashboard')+
     panelButton('Pedidos, ainda indisponível','orders')+
     panelButton('Clube GB, demonstração','club')+
     panelButton('Benefícios, demonstração','rewards')+
     panelButton('Conhecer a comunidade','community')+
     panelButton('Dúvidas e atendimento','help');
 };
 const closePanels=()=>{
   if(account)account.hidden=true;
   accountBtn?.setAttribute('aria-expanded','false');
   navOpen=false;
 };
 const togglePanel=()=>{
   const show=!!account?.hidden;
   closePanels();
   closeLanguage();
   if(!show||!account)return;
   updateAccount();
   account.hidden=false;
   accountBtn?.setAttribute('aria-expanded','true');
   navOpen=true;
 };
 accountBtn?.addEventListener('click',e=>{e.stopPropagation();togglePanel()});

 // V41 | Premium language picker. The native select stays the single source of
 // truth for GB i18n, persistence and the rest of the storefront.
 const languageNames={pt:'Português',en:'English',es:'Español',it:'Italiano'};
 const languageOptions=Array.from(languageMenu?.querySelectorAll('[data-gb-locale]')||[]);
 const syncLanguage=()=>{
   const code=languageSelect?.value||'pt';
   const current=languageTrigger?.querySelector('.gb-language-current');
   if(current)current.textContent=code.toUpperCase();
   languageTrigger?.setAttribute('aria-label','Idioma: '+(languageNames[code]||code.toUpperCase()));
   languageOptions.forEach(option=>{
     const selected=option.dataset.gbLocale===code;
     option.setAttribute('aria-checked',String(selected));
     option.tabIndex=selected?0:-1;
   });
 };
 const closeLanguage=(restoreFocus=false)=>{
   if(!languageMenu||languageMenu.hidden)return;
   languageMenu.hidden=true;
   languageTrigger?.setAttribute('aria-expanded','false');
   if(restoreFocus)languageTrigger?.focus({preventScroll:true});
 };
 const openLanguage=(focusOption=false)=>{
   if(!languageMenu)return;
   closePanels();
   syncLanguage();
   languageMenu.hidden=false;
   languageTrigger?.setAttribute('aria-expanded','true');
   if(focusOption)languageOptions.find(el=>el.getAttribute('aria-checked')==='true')?.focus({preventScroll:true});
 };
 languageTrigger?.addEventListener('click',e=>{
   e.stopPropagation();
   if(languageMenu?.hidden)openLanguage();else closeLanguage();
 });
 languageTrigger?.addEventListener('keydown',e=>{
   if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
   e.preventDefault();
   if(languageMenu?.hidden)openLanguage(true);
   const active=languageOptions.indexOf(document.activeElement);
   const index=active<0?languageOptions.findIndex(el=>el.getAttribute('aria-checked')==='true'):active;
   const next=(index+(e.key==='ArrowDown'?1:-1)+languageOptions.length)%languageOptions.length;
   languageOptions[next]?.focus({preventScroll:true});
 });
 languageMenu?.addEventListener('click',e=>{
   const option=e.target.closest('[data-gb-locale]');
   if(!option||!languageSelect)return;
   languageSelect.value=option.dataset.gbLocale;
   languageSelect.dispatchEvent(new Event('change',{bubbles:true}));
   syncLanguage();
   closeLanguage(true);
 });
 languageMenu?.addEventListener('keydown',e=>{
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeLanguage(true);return}
   if(e.key==='Tab'){closeLanguage();return}
   if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
   e.preventDefault();
   const current=languageOptions.indexOf(document.activeElement);
   const next=e.key==='Home'?0:e.key==='End'?languageOptions.length-1:
     (current+(e.key==='ArrowDown'?1:-1)+languageOptions.length)%languageOptions.length;
   languageOptions.forEach(option=>{option.tabIndex=option===languageOptions[next]?0:-1});
   languageOptions[next]?.focus({preventScroll:true});
 });
 languageSelect?.addEventListener('change',syncLanguage);
 window.addEventListener('gb:languagechange',syncLanguage);
 syncLanguage();

 document.addEventListener('click',e=>{
   const action=e.target.closest('[data-gb-action]');
   if(action){
     closePanels();
     const a=action.dataset.gbAction;
     const suitePaths={dashboard:'/gb',orders:'/gb/pedidos',club:'/gb/club',rewards:'/gb/club/recompensas',community:'/gb/comunidade',help:'/gb/ajuda'};
     if(suitePaths[a]){window.GBExperience?.go(suitePaths[a]);return}
     if(a==='favorites')$('#wishlistOpen')?.click();
     if(a==='bag')$('#bagOpen')?.click();
     if(a==='studio'||a==='shop'){
       const id=a==='studio'?'lookstudio':'colecao';
       document.getElementById(id)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
     }
     return;
   }
   const locale=e.target.closest('[data-gb-lang]');
   if(locale){
     const select=$('#gbLanguage');if(select){select.value=locale.dataset.gbLang;select.dispatchEvent(new Event('change',{bubbles:true}))}
     syncLanguage();return;
   }
   if(navOpen&&!e.target.closest('.gb-nav-popwrap'))closePanels();
   if(!e.target.closest('.gb-language-control'))closeLanguage();
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePanels();closeLanguage(true)}});
 // Add genuine destinations to mobile menu instead of decorative dead-end routes.
 const mobileNav=$('#navDrawer .mobile-nav');
 if(mobileNav&&!mobileNav.querySelector('[data-gb-action]')){
   const group=document.createElement('div');group.className='gb-nav-mobile-tools';
   group.innerHTML='<div class="gb-nav-panel-divider"></div>'+
     panelButton('Buscar peças','search')+
     panelButton('Peças selecionadas','bag')+
     panelButton('Meus favoritos','favorites')+
     panelButton('Montar look no Studio','studio')+
     panelButton('Minha GB, demonstração','dashboard')+
     panelButton('Pedidos, ainda indisponível','orders')+
     panelButton('Clube GB, demonstração','club')+
     panelButton('Benefícios, demonstração','rewards')+
     panelButton('Conhecer a comunidade','community')+
     panelButton('Dúvidas e atendimento','help')+
     panelButton('Tema claro / escuro','theme','☼')+
     '<div class="gb-nav-settings-lang" aria-label="Idioma da GB">'+
     ['pt','en','es','it'].map(l=>'<button type="button" data-gb-lang="'+l+'">'+l.toUpperCase()+'</button>').join('')+'</div>'+
     '<p class="gb-nav-sub">Sua seleção e seus favoritos ficam salvos aqui. Esta área ainda não recebe dados de contas ou pedidos reais.</p>';
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
   const suitePaths={dashboard:'/gb',orders:'/gb/pedidos',club:'/gb/club',rewards:'/gb/club/recompensas',community:'/gb/comunidade',help:'/gb/ajuda'};
   if(suitePaths[a])window.GBExperience?.go(suitePaths[a]);
 });
 window.GBNavV39={update:setAmbient,get ambient(){return header.dataset.ambient},get accountOpen(){return!!account&&!account.hidden},get languageOpen(){return!!languageMenu&&!languageMenu.hidden}};
})();
