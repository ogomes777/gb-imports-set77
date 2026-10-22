/** GB / MÍDIA DE CAMPANHA — slots editoriais (foto ou filme AUTORIZADOS pela GB).
 * Vazio = o site mostra a composição de estudo no lugar, sem quebrar layout nem movimento.
 * Para publicar, preencha por slot (data-media-slot no index.html):
 *   'campaign-hero': { type:'video', src:'./assets/campaign/gb-campanha-01.mp4', poster:'./assets/campaign/gb-campanha-01.webp',
 *                      alt:'Descrição da cena', credit:'FOTO: NOME / AUTORIZADO', width:1920, height:1080 }
 *   type:'image' aceita src/alt/width/height. Vídeo sempre mudo, sem áudio, com poster.
 * NUNCA usar rosto, modelo ou campanha sem autorização de imagem; nada de banco de imagem como se fosse a equipe GB.
 */
window.GB_CAMPAIGN_MEDIA = {};
