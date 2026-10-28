/* GB IMPORTS / V05. Brand themes: ORIGEM / TRAMA / SINAL. */
(()=>{
 const states=[
  {id:'origem',name:'ORIGEM',desc:'A essência reconhecível, refinada e colocada em primeiro plano.',img:'./assets/brand/gb-origem.png',stageTheme:'yellow'},
  {id:'trama',name:'TRAMA',desc:'O gesto do GB se repete como linguagem de campanha, sempre subordinado ao produto.',img:'./assets/brand/gb-trama.png',stageTheme:'paper'},
  {id:'sinal',name:'SINAL',desc:'Blocos de alto contraste organizam informação, coleção e experiência.',img:'./assets/brand/gb-sinal.png',stageTheme:'signal'}
 ];
 const stage=document.querySelector('[data-identity-stage]'),image=document.querySelector('#identitySymbol');
 let activeTheme=null;
 const title=document.querySelector('#identityTitle'),desc=document.querySelector('#identityDesc');
 const buttons=[...document.querySelectorAll('[data-gb-identity]')];
 function setTheme(index,persist=true){
  const s=states[index];if(!s)return;
  if(activeTheme===s.id)return;activeTheme=s.id;
  document.documentElement.dataset.gbTheme=s.id;if(document.body)document.body.dataset.gbTheme=s.id;
  if(stage)stage.dataset.theme=s.stageTheme;
  if(image){image.classList.remove('changed');if(image.getAttribute('src')!==s.img)image.src=s.img;
    image.alt='Estudo visual '+s.name+' da identidade GB v1';
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)requestAnimationFrame(()=>{if(activeTheme===s.id)image.classList.add('changed')})}
  if(title)title.textContent=s.name+'.';if(desc)desc.textContent=s.desc;
  buttons.forEach(b=>{const on=Number(b.dataset.gbIdentity)===index;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
  if(persist){try{localStorage.setItem('gb-theme',s.id)}catch(e){}}
  window.dispatchEvent(new CustomEvent('gb:themechange',{detail:{theme:s.id,index:index}}));
 }
 buttons.forEach(b=>b.addEventListener('click',()=>setTheme(Number(b.dataset.gbIdentity))));
 let initial=0;try{const saved=localStorage.getItem('gb-theme'),found=states.findIndex(s=>s.id===saved);if(found>=0)initial=found}catch(e){}
 setTheme(initial,false);
 if(typeof heroSlides!=='undefined'&&heroSlides[0]){
  heroSlides[0].title='SEU ESTILO.<br><span class="emphasis">SEU CORRE.</span><br><span class="hero-title-outline">SEU MUNDO.</span>';
  heroSlides[0].sub='A GB tem origem, rua e gente. Uma seleção para viver seu próprio estilo, da loja para o digital.';
  heroSlides[0].eyebrow='GB / ORIGEM · CAPÍTULO 001';
 }
 const foot=document.querySelector('.prototype-ribbon');if(foot)foot.dataset.brand='manual-v1';
 window.GBSetTheme=setTheme;
})();
