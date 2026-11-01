/* GB Imports V62 | verified WhatsApp destination.
   Do not send visitors to the news group or an unverified number.
   The configured phone must be an official GB business number in E.164, digits only.
   Without that value, WhatsApp opens with prepared share text and recipient selection. */
(()=>{
 'use strict';
 const link=document.getElementById('gb62WhatsAppLink');
 const label=document.getElementById('gb62WhatsAppLabel');
 const note=document.getElementById('gb62WhatsAppNote');
 if(!link||!label||!note)return;
 const configured=document.querySelector('meta[name="gb-whatsapp-number"]')?.getAttribute('content')||'';
 const phone=configured.replace(/\D/g,'');
 const official=/^\d{12,15}$/.test(phone);
 const message='Olá, GB Imports! Vi o site e quero consultar as peças que gostei. Podemos conversar sobre tamanhos, preços e disponibilidade?';
 link.href='https://wa.me/'+(official?phone:'')+'?text='+encodeURIComponent(message);
 link.dataset.gbWhatsAppMode=official?'direct':'share';
 const strings={
  pt:['FALAR COM A GB NO WHATSAPP','ABRIR WHATSAPP COM A MENSAGEM','Conversa com o atendimento oficial da GB.','Escolha o contato de atendimento da GB ao abrir o WhatsApp.'],
  es:['HABLAR CON GB EN WHATSAPP','ABRIR WHATSAPP CON EL MENSAJE','Conversación con el contacto oficial de GB.','Elige el contacto de GB al abrir WhatsApp.'],
  en:['MESSAGE GB ON WHATSAPP','OPEN WHATSAPP WITH MESSAGE','Conversation with the official GB contact.','Choose GB’s contact when WhatsApp opens.'],
  it:['SCRIVI A GB SU WHATSAPP','APRI WHATSAPP CON IL MESSAGGIO','Conversazione con il contatto ufficiale di GB.','Scegli il contatto GB quando si apre WhatsApp.']
 };
 const update=()=>{
  const lang=document.documentElement.dataset.gbLanguage||'pt',copy=strings[lang]||strings.pt;
  label.textContent=copy[official?0:1];
  note.textContent=copy[official?2:3];
  link.setAttribute('aria-label',label.textContent);
 };
 update();
 window.addEventListener('gb:languagechange',update);
 window.GBWhatsAppV62={ready:true,hasOfficialNumber:official,mode:official?'direct':'share',get url(){return link.href}};
})();
