/* Atelier lettre de Tim — photo manuscrite inchangée, conservée en pièce jointe PRIVÉE.
   Aucun octet de la photo personnelle n'est publié dans GitHub ou le site public. */
(function(){
"use strict";
const LABEL="Lettre manuscrite originale de Tim — avec corrections de Mme Gonzalez";
const TARGET="L05";
const NAME_PATTERN=/lettre.*tim|tim.*lettre|manuscrite.*corrig|copie.*corrig/i;
const pdfNo=false;
const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
const showNote=(holder,text,kind="")=>{holder.replaceChildren(el("p","tim-letter-status "+kind,text));};
function createPanel(){
 const panel=el("section","spx-panel tim-letter-panel");
 panel.append(el("span","spx-label","LETTRE PERSONNELLE DE TIM"));
 panel.append(el("h3","","Ma lettre manuscrite, corrigée par la professeure"));
 panel.append(el("p","","Retrouve exactement ta propre copie, avec ton écriture, les ratures et les annotations rouges de Mme Gonzalez. La photo n’est ni réécrite, ni retouchée."));
 const frame=el("div","tim-letter-frame");
 const state=el("div","tim-letter-state");
 const preview=el("div","tim-letter-preview");
 frame.append(state,preview);
 panel.append(frame);
 let openUrl=null;
 const cleanup=()=>{if(openUrl){URL.revokeObjectURL(openUrl);openUrl=null;}preview.replaceChildren();};
 const api=window.__TIM_BRIDGE?.attachments;
 if(!api||window.__TIM_GUEST){
  showNote(state,"La photo originale est réservée aux comptes Parent et Tim. Connecte-toi pour la consulter.");
  return panel;
 }
 function matching(items){
  const preferred=items.filter(item=>NAME_PATTERN.test(String(item.title||"")+" "+String(item.fileName||"")));
  return preferred.find(item=>String(item.mime).startsWith("image/"))||null;
 }
 async function display(item){
  cleanup();showNote(state,"Ouverture de la photo originale…");
  try{
   const blob=await api.read(item);
   if(!String(blob.type).startsWith("image/"))throw Error("La pièce jointe n'est pas une image.");
   openUrl=URL.createObjectURL(blob);
   state.replaceChildren();
   const img=el("img","tim-letter-original");
   img.src=openUrl;
   img.alt="Photographie originale de la lettre manuscrite de Tim, avec les ratures et corrections rouges de Mme Gonzalez";
   img.loading="eager";
   const link=el("a","spx-button tim-letter-download","Voir la lettre en grand");
   link.href=openUrl;link.target="_blank";link.rel="noopener noreferrer";
   preview.append(img,link);
  }catch(e){showNote(state,"La photo n’a pas pu s’ouvrir : "+String(e.message||e));}
 }
 function uploadBox(){
  if(!window.__TIM_PARENT)return;
  const details=el("details","tim-letter-upload");
  details.append(el("summary","","Ajouter la photo manuscrite originale (parent seulement)"));
  details.append(el("p","","Choisis la photo originale au format PNG, JPG ou WebP. Elle restera privée : seuls Tim et son parent pourront l’ouvrir. Ne la redessine pas : nous conservons l’image telle quelle."));
  const input=el("input","tim-letter-file");input.type="file";input.accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp";
  input.setAttribute("aria-label","Sélectionner la photo manuscrite originale de Tim");
  const send=el("button","spx-button","Ajouter la photo originale");send.type="button";
  const progress=el("p","tim-letter-status","");
  send.onclick=async()=>{
    const file=input.files&&input.files[0];
    if(!file){progress.textContent="Sélectionne d’abord la photo originale.";return;}
    if(!/\.(png|jpe?g|webp)$/i.test(file.name)){progress.textContent="Choisis un PNG, JPG ou WebP.";return;}
    if(file.size>4*1024*1024){progress.textContent="La photo dépasse la limite de 4 Mo.";return;}
    send.disabled=true;progress.textContent="Enregistrement privé en cours…";
    try{
      await api.upload("lesson",TARGET,file,LABEL,value=>{progress.textContent="Enregistrement privé : "+value+" %";});
      progress.textContent="Photo enregistrée. Tim et toi pouvez maintenant voir la copie originale.";
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