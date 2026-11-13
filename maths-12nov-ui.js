/* Exercices BIS sur la réciproque de Thalès — 12 novembre 2026.
   Le compte Tim utilise la validation Firebase existante (submitTimExercise).
   Le Parent peut essayer sans créer de tentative. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(slot,id,back){
 if(!slot||!/^MTH12_0[1-3]$/.test(id))return;
 const bridge=window.__TIM_BRIDGE;
 if(!bridge?.mathNov12Task){slot.textContent='Connexion aux exercices indisponible.';return;}
 if(window.__TIM_GUEST){slot.textContent='Connecte-toi au compte Tim ou Parent pour consulter les dix questions.';return;}
 const result=report=>{
  if(!slot.isConnected)return;
  const questions=Array.isArray(report.items)?report.items:[];
  slot.innerHTML='<h3>Note : '+esc(report.score)+' / 10 · '+esc(Number(report.xp??0).toLocaleString('fr-FR'))+' XP</h3>'+
   '<p>Exercice terminé. Une seule validation. Les réponses restent consultables.</p>'+
   '<p>'+questions.filter(x=>x.correct).length+' bonnes réponses sur '+questions.length+'.</p>'+
   questions.map((q,i)=>'<section class="spx-training-question math12-correction"><h4>Question '+(i+1)+' — '+(q.correct?'Réussie':'À revoir')+'</h4>'+
    '<p>'+esc(q.prompt)+'</p><p><strong>Réponse de Tim :</strong> '+esc(q.response)+'</p>'+
    '<p><strong>Réponse attendue :</strong> '+esc(q.expected)+'</p>'+
    '<p>'+esc(q.explanation||'Revois les rapports de Thalès dans la leçon BIS.')+'</p></section>').join('')+
   '<button class="spx-button" type="button" id="math12-return">Revoir la leçon BIS et le dessin</button>';
  slot.querySelector('#math12-return').onclick=back;
 };
 const load=async()=>{
  try{
   const saved=await bridge.mathNov12Progress(id);
   if(saved?.attempt){result(saved.attempt);return;}
   if(saved?.completed&&!window.__TIM_PARENT){
    slot.textContent='Exercice déjà validé. La correction n’est pas disponible sur cet appareil ; consulte le compte Parent. Cette tentative ne peut pas être refaite.';
    return;
   }
   const data=await bridge.mathNov12Task(id);
   if(!slot.isConnected)return;
   if(data.completed&&!window.__TIM_PARENT){
    slot.textContent='Cet exercice a déjà été enregistré. Consulte le compte Parent et n’envoie pas de nouvelle tentative.';
    return;
   }
   const qs=data?.task?.questions||[];
   if(qs.length!==10||qs.some(q=>!q.prompt||q.choices?.length!==4||
    new Set(q.choices.map(x=>String(x).toLowerCase().trim())).size!==4))
    throw Error('Les dix questions ne sont pas complètes.');
   slot.innerHTML='<h3>'+esc(data.task.title)+'</h3><p>'+
    (window.__TIM_PARENT
     ?'Essai Parent : aucune note ni XP de Tim ne seront enregistrés.'
     :'Tim : réponds aux dix questions. Une seule validation définitive et une correction après enregistrement.')+
    '</p><form id="math12-quiz-form">'+qs.map((q,i)=>
     '<fieldset class="spx-training-question"><legend>Question '+(i+1)+' / 10</legend>'+
     '<p>'+esc(q.prompt)+'</p>'+q.choices.map((choice,j)=>
      '<label class="math-choice"><input type="radio" name="math12q'+i+'" value="'+j+'"> '+esc(choice)+'</label>').join('')+
     '</fieldset>').join('')+
    '<button type="submit" class="spx-button">'+(window.__TIM_PARENT?'Corriger cet essai sans enregistrer':'Valider définitivement les 10 réponses')+'</button>'+
    '<p role="status" aria-live="polite" id="math12-message"></p></form>';
   const form=slot.querySelector('#math12-quiz-form');
   form.onsubmit=async ev=>{
    ev.preventDefault();
    const values=qs.map((_,i)=>{const input=form.querySelector('input[name="math12q'+i+'"]:checked');return input?Number(input.value):null;});
    const status=form.querySelector('#math12-message');
    if(values.some(x=>x===null)){status.textContent='Réponds d’abord aux dix questions.';return;}
    if(!window.__TIM_PARENT&&!window.confirm('Valider une seule fois ? Ce résultat sera définitif.'))return;
    form.querySelectorAll('input,button').forEach(el=>el.disabled=true);
    status.textContent=window.__TIM_PARENT?'Calcul de la correction…':'Enregistrement de la tentative dans Firebase…';
    try{
     const report=window.__TIM_PARENT?await bridge.mathNov12Preview(id,values):await bridge.mathNov12Submit(id,values);
     if(!report||!Number.isInteger(report.score)||report.items?.length!==10)throw Error('La correction n’est pas confirmée.');
     result(report);
    }catch(error){
     if(!window.__TIM_PARENT){
      try{
       await bridge.refresh();
       const stored=await bridge.mathNov12Progress(id);
       if(stored?.attempt){result(stored.attempt);return;}
       if(stored?.completed){status.textContent='Une tentative a peut-être été enregistrée. Consulte le compte Parent avant toute autre action.';return;}
      }catch(_){}
     }
     form.querySelectorAll('input,button').forEach(el=>el.disabled=false);
     status.textContent='Validation non confirmée : '+String(error?.message||error);
    }
   };
  }catch(e){if(slot.isConnected)slot.textContent='Exercices indisponibles : '+String(e?.message||e);}
 };
 load();
}
window.TIM_MATH12_UI={render};
})();
