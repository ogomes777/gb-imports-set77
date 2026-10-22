/* GB IMPORTS / V05. New identity layer uses assets from brand manual v1. */
(()=>{
 const states=[
  {name:'ORIGEM.',desc:'A essência reconhecível, refinada e colocada em primeiro plano.',img:'./assets/brand/gb-monograma-amarelo-preto.svg',theme:'yellow'},
  {name:'TRAMA.',desc:'O gesto do GB se repete como linguagem de campanha, sempre subordinado ao produto.',img:'./assets/brand/gb-trama.png',theme:'paper'},
  {name:'SINAL.',desc:'Blocos de alto contraste organizam informação, coleção e experiência.',img:'./assets/brand/gb-sinal.png',theme:'signal'},
 ];
 const stage=document.querySelector('[data-identity-stage]');const image=document.querySelector('#identitySymbol');
 const title=document.querySelector('#identityTitle');const desc=document.querySelector('#identityDesc');
 if(!stage||!image)return;
 document.querySelectorAll('[data-gb-identity]').forEach(b=>b.addEventListener('click',()=>{
  const index=Number(b.dataset.gbIdentity),s=states[index];if(!s)return;
  stage.dataset.theme=s.theme;image.classList.remove('changed');void image.offsetWidth;
  image.src=s.img; image.alt=`Estudo visual ${s.name} da identidade GB v1`;image.classList.add('changed');
  title.textContent=s.name;desc.textContent=s.desc;
  document.querySelectorAll('[data-gb-identity]').forEach(x=>{const on=x===b;x.classList.toggle('selected',on);x.setAttribute('aria-pressed',String(on))});
 }));
 // Replace the non-official typographic logo in every hero slide with real asset, without altering its typography copy.
 if(typeof heroSlides!=='undefined'){
  heroSlides[0].title='SEU ESTILO.<br><span class="emphasis">SEU CORRE.</span><br><span class="hero-title-outline">SEU MUNDO.</span>';
  heroSlides[0].sub='A GB tem origem, rua e gente. Uma seleção para viver seu próprio estilo, da loja para o digital.';
  heroSlides[0].eyebrow='GB / ORIGEM · CAPÍTULO 001';
 }
 const foot=document.querySelector('.prototype-ribbon');
 if(foot)foot.dataset.brand='manual-v1';
})();
