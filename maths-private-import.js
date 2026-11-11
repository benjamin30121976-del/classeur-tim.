/* Import réservé au Parent : les corrigés ne sont jamais inclus dans le dépôt ni le site.
   Le navigateur les transmet directement au serveur Cloudflare authentifié
   et le serveur les conserve dans Firestore avec des règles sans accès client. */
(()=>{'use strict';
 const VERSION='TIM-MATH-20261111-32b5d2cb2e6a';
 const ids=Array.from({length:23},(_,i)=>'MT'+String(i+1).padStart(2,'0'));
 function make(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
 async function readBank(file){
  if(file.size>1500000)throw Error('Fichier trop volumineux.');
  let raw;
  if(/\.zip$/i.test(file.name)){
   if(!window.JSZip)throw Error('Lecteur ZIP indisponible.');
   const zip=await window.JSZip.loadAsync(await file.arrayBuffer());
   const match=Object.values(zip.files).find(f=>!f.dir&&/TIM_MATH_PRIVATE_KV_STRICTEMENT_PRIVE\.json$/i.test(f.name));
   if(!match)throw Error('Le ZIP ne contient pas la banque privée attendue.');
   raw=await match.async('string');
  }else if(/\.json$/i.test(file.name)){raw=await file.text();}
  else throw Error('Sélectionne le ZIP privé V6 ou son fichier JSON.');
  if(raw.length>350000)throw Error('Banque privée trop volumineuse.');
  const bank=JSON.parse(raw);
  if(bank?.version!==VERSION||bank.public?.version!==VERSION||bank.private?.version!==VERSION||
     bank.public?.questions!==230||bank.private?.questions!==230)
   throw Error('Ce fichier ne correspond pas aux 230 questions vérifiées.');
  for(const id of ids){
   const pub=bank.public.quizzes?.[id],priv=bank.private.quizzes?.[id];
   if(pub?.id!==id||pub.bankVersion!==VERSION||!Array.isArray(pub.questions)||pub.questions.length!==10||
      !Array.isArray(priv?.questions)||priv.questions.length!==10)
    throw Error('Questionnaire manquant ou incomplet : '+id+'.');
  }
  return bank;
 }
 function render(){
  const wrap=make('details');wrap.className='panel math-private-import';
  if(!window.__TIM_PARENT||window.__TIM_GUEST)return wrap;
  const summary=make('summary','Administration Parent — installer les corrigés de mathématiques');
  summary.style.cssText='cursor:pointer;font-weight:750';
  const intro=make('p','Importer les 230 questions dans le stockage privé Firebase du classeur. Les réponses ne seront jamais ajoutées à GitHub ni affichées à Tim avant validation.');
  const input=make('input');input.type='file';input.accept='.json,.zip,application/json,application/zip';
  input.setAttribute('aria-label','Fichier privé des 230 questions de mathématiques');
  const button=make('button','Importer les 23 questionnaires');button.type='button';button.className='plain';
  const status=make('p','Aucun import lancé.');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  button.addEventListener('click',async()=>{
   if(!window.__TIM_PARENT||window.__TIM_GUEST||!window.__TIM_BRIDGE?.mathBankImport){
    status.textContent='Connexion Parent sécurisée indisponible.';return;
   }
   if(!input.files?.[0]){status.textContent='Sélectionne d’abord le fichier privé V6 (.zip ou .json).';return;}
   button.disabled=true;input.disabled=true;
   try{
    const bank=await readBank(input.files[0]);let saved=0;
    for(const id of ids){
     const fragment={id,version:VERSION,public:bank.public.quizzes[id],private:bank.private.quizzes[id]};
     const response=await window.__TIM_BRIDGE.mathBankImport(id,fragment);
     if(!response?.saved||response.id!==id)throw Error('Import non confirmé pour '+id);
     saved++;
     status.textContent='Stockage privé : '+saved+' / 23 questionnaires vérifiés et enregistrés.';
    }
    status.textContent='23 / 23 questionnaires stockés dans Firebase. Les tentatives et les notes de Tim n’ont pas été modifiées.';
   }catch(e){
    status.textContent='Import interrompu : '+String(e.message||e)+'. Les questionnaires déjà reçus sont conservés ; relancer l’import est sans danger.';
   }finally{button.disabled=false;input.disabled=false;}
  });
  wrap.append(summary,intro,input,button,status);
  return wrap;
 }
 window.TIM_MATH_PRIVATE_IMPORT={render};
})();
