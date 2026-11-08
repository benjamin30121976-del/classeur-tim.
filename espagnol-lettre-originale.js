/* Atelier lettre de Tim — photo manuscrite inchangée, conservée en pièce jointe PRIVÉE.
   Aucun octet de la photo personnelle n'est publié dans GitHub ou le site public. */
(function(){
"use strict";
const LABEL="Lettre manuscrite originale de Tim — avec corrections de Mme Gonzalez";
const TARGET="L05";
const NAME_PATTERN=/lettre.*tim|tim.*lettre|manuscrite.*corrig|copie.*corrig/i;
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const showNote=(holder,text,kind="")=>{holder.replaceChildren(el("p","tim-letter-status "+kind,text));};
function createWorkshop(){
 const area=el("section","tim-letter-workshop");
 area.append(el("h3","","Comprendre et améliorer ma lettre"));
 area.append(el("p","","On conserve ta copie avec les remarques de la professeure. Ici, on reprend son sens paragraphe par paragraphe, puis on voit comment améliorer ta rédaction. Les exemples ci-dessous sont pédagogiques et ne reproduisent pas la lettre complète."));
 const blocks=[
  {heading:"1 · Se présenter",es:"Hola, me llamo… / Tengo… años. / Nací en…",fr:"Bonjour, je m’appelle… / J’ai… ans. / Je suis né à…",why:"Vérifie l’âge et l’année de naissance avant d’apprendre la phrase. La professeure distingue également « el pueblo de » (le village de) et « la ciudad de » (la ville de)."},
  {heading:"2 · Dire ce qu’on aime",es:"Me gusta escuchar música. / Me gustan las matemáticas.",fr:"J’aime écouter de la musique. / J’aime les mathématiques.",why:"« Me gusta » s’utilise avec une activité ou un nom au singulier ; « me gustan » avec plusieurs choses au pluriel. Une phrase = une idée claire."},
  {heading:"3 · Parler de son sport",es:"Mi deporte favorito es el fútbol porque…",fr:"Mon sport préféré est le football parce que…",why:"« Porque » signifie « parce que ». Après avoir donné ton sport, explique pourquoi tu l’aimes : c’est une justification, pas seulement un nom de sport."},
  {heading:"4 · Décrire le loup",es:"El lobo es fuerte, inteligente y fiel. Vive en grupo.",fr:"Le loup est fort, intelligent et fidèle. Il vit en groupe.",why:"Tu utilises plusieurs adjectifs de caractère. Vérifie les accents, la ponctuation et le genre des adjectifs. Le mot espagnol « tótem » prend un accent."},
  {heading:"5 · Inviter à son anniversaire",es:"Te invito a mi cumpleaños… / Espero que puedas venir.",fr:"Je t’invite à mon anniversaire… / J’espère que tu pourras venir.",why:"La professeure a ajouté l’année à la date de l’invitation. L'invitation doit préciser quand elle aura lieu pour que le correspondant comprenne."},
  {heading:"6 · Terminer la lettre",es:"¡Hasta pronto!",fr:"À bientôt !",why:"Termine par une formule de politesse et ta signature. Aère bien la fin de la lettre."}
 ];
 for(const b of blocks){
  const card=el("details","tim-letter-lesson");
  const sum=el("summary","",b.heading);
  card.append(sum);
  const orig=el("p","tim-letter-es",b.es),fr=el("p","tim-letter-fr");
  const voice=el("button","spx-listen","🔊");voice.type="button";voice.dataset.sayEs=b.es;voice.title="Écouter cette expression espagnole";voice.setAttribute("aria-label","Écouter cet exemple en espagnol");orig.append(document.createTextNode(" "),voice);
  fr.append(el("strong","","Traduction : "),document.createTextNode(b.fr));
  const note=el("p","tim-letter-why");
  note.append(el("strong","","À comprendre ou corriger : "),document.createTextNode(b.why));
  card.append(orig,fr,note);area.append(card);
 }
 const method=el("div","tim-letter-method");
 method.append(el("h4","","Les remarques de Mme Gonzalez"));
 for(const item of [
  "« C’est mieux » : le contenu progresse déjà ; on garde les idées que tu as écrites.",
  "Mise en forme : sépare présentation, goûts, sport, animal totem et invitation en paragraphes.",
  "Informations personnelles : corrige l'âge et l'année de naissance seulement après les avoir vérifiés.",
  "Lieu : utilise « el pueblo de » pour un village et « la ciudad de » pour une ville.",
  "Invitation : écris la date complète, avec l'année.",
  "Les autres marques rouges difficiles à déchiffrer restent à vérifier sur la photo : nous n'inventons pas leur sens."
 ])method.append(el("p","",item));
 area.append(method);
 const hand=el("div","tim-letter-handwriting");
 hand.append(el("h4","","Rendre ton écriture plus lisible"));
 for(const item of [
  "Écris un peu plus grand et plus rond, sans changer complètement ton écriture.",
  "Détache mieux les lettres qui se ressemblent, notamment a, o, e, n et u.",
  "Laisse un espace régulier entre les mots et une ligne vide entre deux parties de la lettre.",
  "Garde les lignes assez droites et évite d’écraser les fins de mots.",
  "Relis les accents et les points sur les i avant de rendre ton travail."
 ])hand.append(el("p","",item));
 area.append(hand);
 area.append(el("p","tim-letter-disclaimer","L'atelier explique les corrections et propose des améliorations ; il ne remplace pas la photo de la copie manuscrite originale, qui doit être conservée intacte et en privé."));
 return area;
}
function createPanel(){
 const panel=el("section","spx-panel tim-letter-panel");
 panel.append(el("span","spx-label","LETTRE PERSONNELLE DE TIM"));
 panel.append(el("h3","","Ma lettre manuscrite, corrigée par la professeure"));
 panel.append(el("p","","Retrouve exactement ta propre copie, avec ton écriture, les ratures et les annotations rouges de Mme Gonzalez. La photo n’est ni réécrite, ni retouchée."));
 const frame=el("div","tim-letter-frame");
 const state=el("div","tim-letter-state");
 const preview=el("div","tim-letter-preview");
 frame.append(state,preview);
 panel.append(frame,createWorkshop());
 let openUrl=null,disposeReader=()=>{};
 const cleanup=()=>{disposeReader();disposeReader=()=>{};if(openUrl){URL.revokeObjectURL(openUrl);openUrl=null;}preview.replaceChildren();};
 const api=window.__TIM_BRIDGE?.attachments;
 if(!api||window.__TIM_GUEST){
  showNote(state,"La photo originale est réservée aux comptes Parent et Tim. Connecte-toi pour la consulter.");
  return panel;
 }
 function matching(items){
  const preferred=items.filter(item=>NAME_PATTERN.test(String(item.title||"")+" "+String(item.fileName||"")));
  return preferred.find(item=>item.mime==="application/pdf")||preferred.find(item=>String(item.mime).startsWith("image/"))||null;
 }
 async function display(item){
  cleanup();showNote(state,"Ouverture du document original…");
  try{
   const blob=await api.read(item);
   if(!String(blob.type).startsWith("image/")&&blob.type!=="application/pdf")throw Error("Le document n'est ni une photo ni un PDF.");
   openUrl=URL.createObjectURL(blob);
   state.replaceChildren();
   if(blob.type==="application/pdf"){
    const host=el("div","tim-letter-pdf");
    preview.append(host);
    const viewer=await import("./pdf-preview.js");
    const release=await viewer.mountPdfPreview(host,blob);
    if(typeof release==="function")disposeReader=release;
   }else{
    const img=el("img","tim-letter-original");
    img.src=openUrl;
    img.alt="Photographie originale de la lettre manuscrite de Tim, avec les ratures et corrections rouges de Mme Gonzalez";
    img.loading="eager";
    preview.append(img);
   }
   const link=el("a","spx-button tim-letter-download",blob.type==="application/pdf"?"Ouvrir le dossier complet en grand":"Voir la lettre en grand");
   link.href=openUrl;link.target="_blank";link.rel="noopener noreferrer";
   preview.append(link);
  }catch(e){showNote(state,"Le document n’a pas pu s’ouvrir : "+String(e.message||e));}
 }
 function uploadBox(){
  if(!window.__TIM_PARENT)return;
  const details=el("details","tim-letter-upload");
  details.append(el("summary","","Ajouter la copie originale et sa traduction (parent seulement)"));
  details.append(el("p","","Choisis de préférence le PDF « Lettre de Tim : originale, traduction et corrections » : il contient la vraie photo manuscrite intacte sur sa première page, suivie des traductions. Tu peux aussi ajouter la photo originale en PNG, JPG ou WebP. Le document restera privé."));
  const input=el("input","tim-letter-file");input.type="file";input.accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";
  input.setAttribute("aria-label","Sélectionner le dossier original de Tim avec sa traduction, au format PDF ou image");
  const send=el("button","spx-button","Ajouter le document privé");send.type="button";
  const progress=el("p","tim-letter-status","");
  send.onclick=async()=>{
    const file=input.files&&input.files[0];
    if(!file){progress.textContent="Sélectionne d’abord la photo originale.";return;}
    if(!/\.(pdf|png|jpe?g|webp)$/i.test(file.name)){progress.textContent="Choisis un PDF, PNG, JPG ou WebP.";return;}
    if(file.size>4*1024*1024){progress.textContent="La photo dépasse la limite de 4 Mo.";return;}
    send.disabled=true;progress.textContent="Enregistrement privé en cours…";
    try{
      await api.upload("lesson",TARGET,file,LABEL,value=>{progress.textContent="Enregistrement privé : "+value+" %";});
      progress.textContent="Document enregistré. Tim et toi pouvez maintenant voir la copie originale et, si tu as choisi le PDF, sa traduction.";
      await reload();
      details.open=false;
    }catch(err){progress.textContent="Enregistrement impossible : "+String(err.message||err);}
    finally{send.disabled=false;}
  };
  details.append(input,send,progress);panel.append(details);
 }
 async function reload(){
  cleanup();showNote(state,"Recherche de la copie manuscrite privée…");
  try{
   const items=await api.list("lesson",TARGET);
   const item=matching(items);
   if(!item){
    showNote(state,window.__TIM_PARENT?
      "La photo originale n’a pas encore été ajoutée à ce cours. Utilise la commande parent ci-dessous pour l’enregistrer une seule fois.":
      "La photo originale n’a pas encore été ajoutée par le parent.");
    return;
   }
   await display(item);
  }catch(err){showNote(state,"Impossible de consulter les pièces jointes privées : "+String(err.message||err));}
 }
 uploadBox();
 reload();
 return panel;
}
window.TIM_SPANISH_LETTER={createPanel,lessonId:TARGET};
})();