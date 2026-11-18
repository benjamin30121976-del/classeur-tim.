/* Contenus pédagogiques du 18/11/2026 (aucune donnée Tim ni pièce ENT publiée).
   Ajout sans remplacement : français du 18, espagnol du 18.  Les documents
   sont lus dans le stockage Parent/Tim, jamais distribués dans ce dépôt. */
(function(){'use strict';
const FR=window.TIM_FR_PACK;
if(FR?.lessons&&!FR.lessons.some(x=>x.entId==='10099~6410460')){
 FR.lessons.push({
  id:'FR_ENT_20261118',entId:'10099~6410460',date:'2026-11-18',
  chapter:'Le subjonctif',bisRefs:['FR_BIS12'],
  title:'Subjonctif présent et passé — emplois et exemples',
  original:'La séance ENT prolonge le subjonctif : repère « il faut que » ; passé = auxiliaire être ou avoir au subjonctif présent + participe passé. Emplois travaillés : souhait, ordre, prière, supposition, indignation. Conjugaisons de courir, se plaindre, retenir, plier, briller, aller, bâtir, mourir, s’enfuir, savoir, voir, être, vouloir, faire, haïr, conquérir et résoudre. Début de la séance 3 : La Métamorphose, Franz Kafka. Le texte exact complet demeure dans le ZIP ENT privé.',
  teacher:'LUNEL',source:'Synthèse fidèle du cours ENT du 18/11/2026, réf. 10099~6410460.',
  hasExactOriginal:false
 });
}
if(FR?.bis){
 const subj=FR.bis.find(x=>x.id==='FR_BIS12');
 if(subj&&Array.isArray(subj.examples)&&!subj.examples.some(x=>x[0]==='Il faut que je sois arrivé')){
  subj.examples.push(['Il faut que je sois arrivé','« sois » est être au subjonctif présent, suivi du participe passé « arrivé ».'],
   ['Que tu aies fini','« aies » est avoir au subjonctif présent ; « fini » est le participe passé.']);
 }
 if(subj&&Array.isArray(subj.help)&&!subj.help.some(x=>x.includes('auxiliaire au subjonctif'))){
  subj.help.push('Pour le subjonctif passé, cherche : auxiliaire au subjonctif présent + participe passé. Ne conjugue pas les deux verbes.');
 }
}
const E=(tag,value,cls='')=>{const e=document.createElement(tag);if(value!=null)e.textContent=String(value);if(cls)e.className=cls;return e;};
const add=(host,tag,text)=>{const e=E(tag,text);host.append(e);return e;};
const TAG='ENTESP_2026';
const ASSETS=[
 {id:'10099~115426',title:'Liste 2 — verbes au présent',sha:'1a7d9be5cb0bda99adb1a337795822f5295478bba7994ffcb0bb543bade816e3'},
 {id:'10099~115430',title:'Cours et corrections du mercredi 18 novembre (3 pages)',sha:'1ca666f7b213054347c1eec08c8aad87983f25c8279af7202a387dd95071192f'}
];
const forms=[
 ['yo','conozco','pido','salgo','pongo'],
 ['tú','conoces','pides','sales','pones'],
 ['él / ella','conoce','pide','sale','pone'],
 ['nosotros','conocemos','pedimos','salimos','ponemos'],
 ['vosotros','conocéis','pedís','salís','ponéis'],
 ['ellos / ellas','conocen','piden','salen','ponen']
];
function renderDocs(host){
 const api=window.__TIM_BRIDGE?.attachments;host.replaceChildren();
 if(window.__TIM_GUEST||!api?.list){add(host,'p','PDF du professeur : connexion Parent ou Tim nécessaire.');return;}
 api.list('lesson',TAG).then(files=>{
  if(!host.isConnected)return;
  for(const item of ASSETS){
   const box=E('section');box.style.cssText='border:1px solid #bbcee3;background:#f5f8ff;color:#243c56;padding:12px;border-radius:9px;margin:9px 0';
   add(box,'h4',item.title+' — ENT '+item.id);
   const hit=(files||[]).find(x=>String(x.sha256||'').toLowerCase()===item.sha);
   if(hit&&window.TIM_PHYSICS_INLINE_PDF?.createFullInline)
    box.append(window.TIM_PHYSICS_INLINE_PDF.createFullInline({target:TAG,fileName:hit.fileName},'PDF original complet — '+item.title));
   else add(box,'p','Document original non encore importé sur le compte Parent.');
   host.append(box);
  }
 }).catch(()=>{add(host,'p','Documents privés momentanément indisponibles.');});
}
function render18(){
 const card=E('details',null,'tim-es-lesson ent-es-followup');
 card.dataset.entId='10099~6400507';
 card.style.cssText='border:1px solid #9bbfda;border-radius:13px;background:#f5f8ff;color:#243c56;margin:14px 0;padding:12px';
 card.append(E('summary','Mercredi 18 novembre — Conjugaison, hemisferio et corrections (ENT 10099~6400507)'));
 const tabs=E('nav');tabs.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin-top:14px';
 const pane=E('section');pane.style.cssText='padding:10px 2px;line-height:1.65';
 card.append(tabs,pane);
 function open(which){
  pane.replaceChildren();
  for(const b of tabs.children){b.style.background=b.dataset.which===which?'#d8fc67':'#e1e7f2';b.style.color='#243c56';}
  if(which==='ent'){
   add(pane,'h3','1 · Leçon ENT — Mme Gonzalez');
   add(pane,'p','18 novembre 2026. Référence 10099~6400507. Révision de conocer, pedir, salir ; correction IIb et bonification sur l’hémisphère sud ; retour de l’évaluation de conjugaison liste 1 ; début de correction « Chica Popular ».');
   add(pane,'p','Ce résumé identifie le texte du professeur. Le document original complet apparaît ci-dessous après import privé ; il ne faut pas confondre les deux 3D.pdf des 17 et 18 novembre.');
   const slot=E('section');pane.append(slot);renderDocs(slot);
  }else if(which==='bis'){
   add(pane,'h3','2 · Leçon BIS — je comprends');
   add(pane,'p','Conocer (connaître) a une forme particulière avec yo : conozco. Pedir (demander) : e devient i dans pido, pides, pide, piden. Salir (sortir) : salgo avec yo. Poner (mettre) : pongo avec yo.');
   const table=E('table');table.style.cssText='width:100%;border-collapse:collapse;font-size:13px';
   const labels=['Personne','conocer','pedir','salir','poner'];
   const row=values=>{const tr=E('tr');for(const val of values){const td=E('td',val);td.style.cssText='border:1px solid #b0c3d5;padding:4px';tr.append(td);}table.append(tr);};
   row(labels);forms.forEach(row);pane.append(table);
   add(pane,'h4','Phrase modèle : non… mais…');
   add(pane,'p','« No empiezo en septiembre sino en abril. » = Je ne commence pas en septembre, mais en avril. Le verbe ne se répète pas après sino.');
   add(pane,'h4','Pourquoi décembre est-il chaud au Pérou ?');
   add(pane,'p','« En Perú es verano en diciembre porque el país está en el hemisferio sur. En Francia es invierno. » Ici, la réponse explique avec porque et compare les deux hémisphères.');
  }else if(which==='help'){
   add(pane,'h3','3 · Je n’ai pas compris');
   for(const p of ['Je repère d’abord la personne : yo, tú, él, nosotros, vosotros ou ellos.',
    'Je cherche le verbe à l’infinitif, puis je copie la forme de la bonne ligne du tableau.',
    'Je souligne les changements : conozco, pido, salgo, pongo. Attention aux accents dans conocéis, pedís, salís, ponéis.',
    'Je rédige des phrases complètes : no… sino… pour corriger une information ; porque pour justifier.',
    'Pour corriger un contrôle, je recopie uniquement mes erreurs puis j’écris la bonne forme avec son pronom.'])add(pane,'p','• '+p);
  }else if(which==='entex'){
   add(pane,'h3','4 · Exercices et devoirs ENT');
   add(pane,'p','Pour le mercredi 18/11 (10099~215356) : finir IIb et apprendre conocer, pedir, salir ; compléter les verbes indiqués entre parenthèses dans la consigne ; rapporter la carte Plickers.');
   add(pane,'p','Pour le jeudi 19/11 (10099~215358) : corriger l’évaluation de conjugaison liste 1 et apprendre conocer, pedir, salir, poner. Apporter la carte Plickers.');
   add(pane,'p','La correction du 18/11 et la liste 2 figurent dans les PDF originaux de la leçon ENT.');
   const slot=E('section');pane.append(slot);renderDocs(slot);
  }else{
   add(pane,'h3','5 · Entraînement — trois exercices de dix questions');
   add(pane,'p','QCM, phrases à compléter, écriture et conjugaison. Une seule tentative pour Tim ; correction immédiate. Le Parent peut essayer sans enregistrer de note ni de XP.');
   const module=window.TIM_SPANISH_SIMPLIFIED,bridge=window.__TIM_BRIDGE;
   if(!module?.renderQuestions||!module?.drawCorrection||!bridge?.spanishEntTrainingTask||window.__TIM_GUEST){
    add(pane,'p','Correcteur sécurisé indisponible : aucune tentative ne peut être lancée.');return;
   }
   const actions=E('div');actions.style.cssText='display:grid;gap:8px;margin:12px 0';
   const work=E('section');pane.append(actions,work);
   const ids=['ESE_L17_01','ESE_L17_02','ESE_L17_03'];
   const titles=['Je comprends les mots','Je complète les phrases','Je conjugue et j’écris'];
   for(let i=0;i<ids.length;i++){
    const id=ids[i],button=E('button','Exercice '+(i+1)+' — '+titles[i]);
    button.type='button';button.dataset.esTrainingId=id;button.className='plain';
    button.style.cssText='text-align:left;min-height:45px;padding:10px;margin:3px 0;white-space:normal';
    button.onclick=async()=>{
     work.replaceChildren(E('p','Ouverture sécurisée de l’exercice…'));
     const back=()=>open('bis'),refresh=async()=>{};
     try{
      const data=await bridge.spanishEntTrainingTask(id);
      if(!data?.task||data.task.questions?.length!==10)throw Error('Banque de dix questions indisponible');
      if(data.completed&&!window.__TIM_PARENT){
       const saved=await bridge.spanishEntTrainingProgress(id);
       if(!saved?.attempt)throw Error('Copie déjà enregistrée mais non disponible ; deuxième tentative interdite');
       module.drawCorrection(work,saved.attempt,17,back);return;
      }
      if(data.completed&&window.__TIM_PARENT){
       const details=E('details');details.append(E('summary','Voir la copie existante de Tim'));
       const copy=E('div');details.append(copy);
       details.addEventListener('toggle',async()=>{
        if(!details.open)return;
        try{
         const saved=await bridge.spanishEntTrainingProgress(id);
         if(saved?.attempt)module.drawCorrection(copy,saved.attempt,17,back);
         else copy.textContent='Copie non disponible.';
        }catch{copy.textContent='Consultation du résultat indisponible.';}
       });
       work.replaceChildren(details);
       const trial=E('section');work.append(trial);
       module.renderQuestions(trial,data.task,17,refresh,back);return;
      }
      module.renderQuestions(work,data.task,17,refresh,back);
     }catch(error){
      work.replaceChildren(E('p','Exercice indisponible : '+String(error?.message||error)+'. Aucune tentative ne doit être consommée.'));
     }
    };
    actions.append(button);
   }
  }
 }
 for(const [key,label] of [['ent','Leçon ENT'],['bis','Leçon BIS'],['help','Je n’ai pas compris'],['entex','Exercices ENT'],['train','Entraînement']]){
  const button=E('button',label);button.type='button';button.dataset.which=key;button.className='plain';
  button.style.cssText='margin:3px;padding:8px;min-height:44px';button.onclick=()=>open(key);tabs.append(button);
 }
 card.addEventListener('toggle',()=>{if(card.open&&!pane.childElementCount)open('ent');});
 return card;
}
const route=window.TIM_SPANISH_ENT_EXACT;
if(route?.render&&!route.__nov18Wrapped){
 const original=route.render;
 route.render=async function(root,options){
  await original(root,options);
  if(window.__TIM_GUEST)return;
  // Une seule fiche pédagogique datée ; les références ENT restent uniques.
  if(!root.querySelector('[data-ent-id="10099~6400507"]')){
   const node=render18();
   const chronology=root.querySelector('.tim-es-chronological');
   if(chronology)chronology.prepend(node);else root.append(node);
  }
  if(window.__TIM_PARENT&&window.TIM_ENT_18NOV_IMPORT?.panel&&!root.querySelector('#tim-ent-18nov-private-import'))
   root.prepend(window.TIM_ENT_18NOV_IMPORT.panel());
 };
 route.__nov18Wrapped=true;
}
window.TIM_ENT_18NOV_LESSONS={render18,exerciseIds:['ESE_L17_01','ESE_L17_02','ESE_L17_03'],assets:ASSETS};
})();