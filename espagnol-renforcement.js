/* Compléments pédagogiques originaux : aucune modification des cours ENT,
   ni des 150 questions déjà publiées dans Firebase. 45 mises en situation
   autocorrigées par dévoilement, sans note et sans XP. */
(function(){
'use strict';
const PRONOUNS=['Yo','Tú','Él / Ella','Nosotros / Nosotras','Vosotros / Vosotras','Ellos / Ellas'];
const TABLES={
 L09:[
  ['hablar (parler)',['hablo','hablas','habla','hablamos','habláis','hablan']],
  ['comer (manger)',['como','comes','come','comemos','coméis','comen']],
  ['vivir (vivre)',['vivo','vives','vive','vivimos','vivís','viven']]
 ],
 L10:[
  ['ser (être : identité)',['soy','eres','es','somos','sois','son']],
  ['estar (être : état ou lieu)',['estoy','estás','está','estamos','estáis','están']],
  ['ir (aller)',['voy','vas','va','vamos','vais','van']],
  ['llamarse (s’appeler)',['me llamo','te llamas','se llama','nos llamamos','os llamáis','se llaman']]
 ],
 L13:[
  ['correr (courir)',['corro','corres','corre','corremos','corréis','corren']],
  ['escribir (écrire)',['escribo','escribes','escribe','escribimos','escribís','escriben']],
  ['bañarse (se baigner)',['me baño','te bañas','se baña','nos bañamos','os bañáis','se bañan']]
 ],
 L15:[
  ['llamarse (s’appeler)',['me llamo','te llamas','se llama','nos llamamos','os llamáis','se llaman']],
  ['pensar (penser)',['pienso','piensas','piensa','pensamos','pensáis','piensan']],
  ['poder (pouvoir)',['puedo','puedes','puede','podemos','podéis','pueden']],
  ['decir (dire)',['digo','dices','dice','decimos','decís','dicen']],
  ['traer (apporter)',['traigo','traes','trae','traemos','traéis','traen']],
  ['hacer (faire)',['hago','haces','hace','hacemos','hacéis','hacen']],
  ['ir (aller)',['voy','vas','va','vamos','vais','van']],
  ['ser (être : identité)',['soy','eres','es','somos','sois','son']],
  ['estar (être : état ou lieu)',['estoy','estás','está','estamos','estáis','están']],
  ['tener (avoir)',['tengo','tienes','tiene','tenemos','tenéis','tienen']]
 ]
};
const DATA={
 L01:{goal:'Savoir te présenter avec plusieurs phrases et demander les mêmes informations à quelqu’un.',steps:['Commence par « Me llamo… ».','Pour ton âge, utilise « Tengo… años ».','Pour la ville, utilise « Vivo en… ».'],pitfall:'Ne dis pas « soy quince años » : l’âge s’exprime avec tener.',tasks:[
  ['dialogue','Une nouvelle élève te demande : « ¿Cómo te llamas? » Réponds en espagnol.','Me llamo Tim.','La question demande ton prénom, pas ton âge.'],
  ['repair','Corrige : « Soy quince años ».','Tengo quince años.','En espagnol, on a un âge : tener.'],
  ['listen','Écoute « ¿Dónde vives? » puis écris la question en français.','Où habites-tu ?','Dónde indique le lieu.','¿Dónde vives?']
 ]},
 L02:{goal:'Retrouver un jour et préciser si le cours se déroule le matin ou l’après-midi.',steps:['Repère le jour après « el ».','Repère le moment « por la mañana / por la tarde ».','Assemble une phrase sur l’emploi du temps.'],pitfall:'« El lunes » signifie « le lundi », pas « un lundi » dans ce contexte.',tasks:[
  ['complete','Complète : « Tengo español ___ martes » (le mardi).','el','Un jour habituel s’emploie souvent avec el.'],
  ['repair','Corrige le moment : « Por la mañana = l’après-midi ».','Por la mañana = le matin.','La tarde indique l’après-midi.'],
  ['write','Écris : « Je vais en cours le jeudi ».','Voy a clase el jueves.','Voy a clase + el + jour.']
 ]},
 L03:{goal:'Reconnaître les pays où l’on parle espagnol sans confondre pays, langue et continent.',steps:['Lis le nom espagnol du pays.','Demande-toi où il se situe.','Distingue España (pays) et español (langue).'],pitfall:'« Hispanophone » ne signifie pas « situé en Espagne ».',tasks:[
  ['choice','Le Pérou se trouve : en Europe, en Amérique du Sud ou en Asie ?','En Amérique du Sud.','Le Pérou est un pays d’Amérique du Sud.'],
  ['repair','Corrige : « España est une langue ».','España est un pays ; español est la langue.','Un nom de pays et un nom de langue sont différents.'],
  ['write','Comment dit-on « pays hispanophone » en espagnol ?','País hispanohablante.','Hispanohablante : qui parle espagnol.']
 ]},
 L04:{goal:'Expliquer des goûts avec gusta ou gustan et donner une raison.',steps:['Demande-toi si ce qui plaît est au singulier ou au pluriel.','Utilise « me gusta » ou « me gustan ».','Ajoute « porque » pour expliquer.'],pitfall:'Ce n’est pas le nombre de personnes qui aiment qui détermine gusta/gustan.',tasks:[
  ['complete','Complète : « Me ___ los perros ».','gustan','« Los perros » est au pluriel.'],
  ['repair','Corrige : « Me gustan la música ».','Me gusta la música.','« La música » est au singulier.'],
  ['dialogue','Réponds : « ¿Qué te gusta? » en parlant du football.','Me gusta el fútbol.','La question demande une préférence personnelle.']
 ]},
 L05:{goal:'Écrire une lettre courte avec salutation, présentation, question et formule finale.',steps:['Commence par « ¡Hola! ».','Présente-toi avec deux phrases courtes.','Pose une question à ton correspondant et termine poliment.'],pitfall:'Une suite de mots sans phrase ne constitue pas une lettre.',tasks:[
  ['write','Écris une première phrase de lettre avec ton prénom.','¡Hola! Me llamo Tim.','Une salutation et une présentation suffisent pour commencer.'],
  ['dialogue','Quelle question poses-tu pour demander comment va ton correspondant ?','¿Cómo estás?','Les deux signes de question doivent encadrer la phrase.'],
  ['write','Choisis une formule pour terminer une lettre amicale.','¡Hasta pronto!','La formule de clôture se place après le corps de la lettre.']
 ]},
 L06:{goal:'Décrire le caractère et dire si un horoscope semble correspondre à une personne.',steps:['Utilise « ser » pour présenter un trait de caractère.','Vérifie la forme de l’adjectif.','Dis si tu es d’accord avec la description.'],pitfall:'« Estoy de acuerdo » est une expression à connaître, même si « soy » sert souvent à décrire.',tasks:[
  ['complete','Complète « Yo ___ simpático » pour parler de caractère.','soy','Ser est courant pour décrire une caractéristique.'],
  ['repair','Corrige : « No soy de acuerdo ».','No estoy de acuerdo.','On dit « estar de acuerdo ».'],
  ['write','Comment écrirais-tu « Je suis rêveur » (masculin) ?','Soy soñador.','Adjectif masculin : soñador.']
 ]},
 L07:{goal:'Accorder les adjectifs au féminin et au pluriel.',steps:['Repère le nom décrit.','Choisis masculin/féminin.','Choisis ensuite singulier/pluriel.'],pitfall:'« Vivaz » prend « -ces » au pluriel : « vivaces ».',tasks:[
  ['complete','Complète « Una chica ___ » avec simpático.','simpática','Une fille : féminin singulier.'],
  ['repair','Corrige : « dos chicos simpática ».','Dos chicos simpáticos.','Masculin pluriel : simpáticos.'],
  ['write','Mets « vivaz » au pluriel.','Vivaces.','Le z devient c devant es.']
 ]},
 L08:{goal:'Choisir correctement el, la, los ou las selon le nom.',steps:['Regarde le genre du nom.','Regarde s’il est singulier ou pluriel.','Sélectionne l’article qui correspond.'],pitfall:'Los et las veulent tous les deux dire « les », mais le genre change.',tasks:[
  ['complete','Complète : « ___ casas » (les maisons).','Las','Maisons : féminin pluriel.'],
  ['repair','Corrige : « el profesora ».','La profesora.','Profesora est féminin singulier.'],
  ['write','Écris « les livres » en espagnol.','Los libros.','Libro : masculin, libros : pluriel.']
 ]},
 L09:{goal:'Conjuguer des verbes en -ar, -er et -ir aux six personnes.',steps:['Trouve l’infinitif : hablar, comer ou vivir.','Repère la personne (yo, tú, nosotros…).','Choisis la terminaison propre au groupe et à la personne.'],pitfall:'Ne mélange pas les terminaisons -ar et -er : hablamos mais comemos.',tasks:[
  ['complete','Complète : « Nosotros ___ español » (hablar).','hablamos','Avec nosotros, hablar prend -amos.'],
  ['repair','Corrige : « Tú habla español ».','Tú hablas español.','Hablar prend -as avec tú.'],
  ['write','Conjugue vivir avec vosotros.','Vivís.','Les verbes en -ir prennent -ís avec vosotros.']
 ]},
 L10:{goal:'Choisir entre ser, estar, ir et llamarse selon le sens et la personne.',steps:['Repère le sens : identité, état/lieu, déplacement ou prénom.','Choisis le bon verbe.','Conjugue-le avec la personne donnée.'],pitfall:'Soy et estoy se traduisent souvent par « je suis », mais ne s’emploient pas de la même manière.',tasks:[
  ['complete','Complète : « Yo ___ en clase » (je suis en classe).','estoy','La localisation s’exprime avec estar.'],
  ['repair','Corrige : « Nosotros va al colegio ».','Nosotros vamos al colegio.','Avec nosotros, ir devient vamos.'],
  ['dialogue','Comment réponds-tu à « ¿Cómo te llamas? » ?','Me llamo Tim.','Llamarse est pronominal : me, te, se, nos, os, se.']
 ]},
 L11:{goal:'Former une vraie question et distinguer comment, où, quand et qui.',steps:['Identifie ce que tu demandes.','Choisis le mot interrogatif.','N’oublie pas ¿ en début et ? en fin.'],pitfall:'« Dónde » concerne un lieu ; « cuándo » concerne le moment.',tasks:[
  ['choice','Pour demander un lieu, choisis : ¿Cómo?, ¿Dónde? ou ¿Cuándo?','¿Dónde?','Dónde signifie où.'],
  ['repair','Corrige la ponctuation : « Como te llamas? ».','¿Cómo te llamas?','Interrogation espagnole : ¿ … ? et accent sur cómo.'],
  ['dialogue','Demande : « Où habites-tu ? »','¿Dónde vives?','Dónde = où ; vives = tu habites.']
 ]},
 L12:{goal:'Employer mi, tu, su et la forme de politesse usted.',steps:['Repère le propriétaire de l’objet.','Choisis le possessif et le nombre.','Pour usted, conjugue le verbe comme à la troisième personne.'],pitfall:'« Su » peut signifier « son », « sa » ou « votre » : seul le contexte permet de choisir.',tasks:[
  ['complete','Complète : « ___ libros » (mes livres).','Mis','Le possessif s’accorde avec libros au pluriel.'],
  ['repair','Corrige : « ¿Cómo te llama usted? ».','¿Cómo se llama usted?','Avec usted, on utilise se llama.'],
  ['write','Écris « ton livre » en espagnol.','Tu libro.','Tu (sans accent) est possessif.']
 ]},
 L13:{goal:'Repérer le sujet caché d’une phrase et choisir la bonne terminaison.',steps:['Identifie le sujet réel.','Transforme-le en pronom : yo, tú, nosotros…','Conjugue le verbe avec cette personne.'],pitfall:'« Mi perro y yo » correspond à nosotros, pas à yo.',tasks:[
  ['complete','Complète : « Mi perro y yo ___ » (correr).','corremos','Mon chien et moi = nous.'],
  ['repair','Corrige : « Ellos escribe una carta ».','Ellos escriben una carta.','Avec ellos, escribir prend -en.'],
  ['write','Conjugue bañarse avec nosotros.','Nos bañamos.','Le pronom nos accompagne le verbe pronominal.']
 ]},
 L14:{goal:'Comprendre une consigne avant de chercher la réponse.',steps:['Souligne le verbe de consigne.','Traduits l’action demandée.','Vérifie si une justification est demandée.'],pitfall:'« Justifica » ne signifie pas seulement choisir : il faut donner une raison.',tasks:[
  ['choice','La consigne « Elige la respuesta » signifie : écris, choisis ou traduis ?','Choisis.','Elegir veut dire choisir.'],
  ['repair','Corrige : « Justifica = recopie la réponse ».','Justifica = explique pourquoi tu réponds cela.','Il faut une justification.'],
  ['listen','Écoute « Completa la frase » puis explique la consigne en français.','Complète la phrase.','Completa demande de remplir ce qui manque.','Completa la frase']
 ]},
 L15:{goal:'Conjuguer les dix verbes clés à toutes les personnes, sans se limiter à yo.',steps:['Apprends d’abord les six personnes.','Observe les changements de radical ou les formes irrégulières.','Entraîne-toi en alternant yo, tú, nosotros et ellos.'],pitfall:'« Pensar » : pienso, mais pensamos. « Poder » : puedo, mais podemos.',tasks:[
  ['complete','Complète « Nosotros ___ » (poder).','podemos','Le radical ne change pas avec nosotros.'],
  ['repair','Corrige : « Ellos tiene razón ».','Ellos tienen razón.','Tener avec ellos devient tienen.'],
  ['write','Conjugue decir avec vosotros.','Decís.','Decir : digo, dices, dice, decimos, decís, dicen.']
 ]}
};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const audio=text=>'<button type="button" class="spx-listen" data-say-es="'+esc(text)+'" aria-label="Écouter en espagnol">Écouter</button>'+
 '<button type="button" class="spx-listen" data-say-speed="slow" data-say-es="'+esc(text)+'" aria-label="Écouter lentement en espagnol">Lentement</button>';
function conjugations(ref){
 const tables=TABLES[ref]||[];if(!tables.length)return '';
 return '<section class="spx-panel spx-extra-conjugations"><h3>Les six personnes au présent</h3>'+
 '<p>Ouvre un verbe, cache la colonne espagnole et essaie de le conjuguer tout seul.</p>'+
 tables.map(([verb,forms],index)=>'<details class="spx-verb"'+(index===0?' open':'')+'><summary>'+esc(verb)+'</summary>'+
 '<table class="spx-verb-table"><thead><tr><th>Personne</th><th>Conjugaison</th><th>Écouter</th></tr></thead><tbody>'+
 forms.map((form,i)=>'<tr><td>'+esc(PRONOUNS[i])+'</td><td lang="es">'+esc(form)+'</td><td>'+audio(form)+'</td></tr>').join('')+
 '</tbody></table></details>').join('')+'</section>';
}
function guide(ref){
 const x=DATA[ref];if(!x)return '';
 return '<section class="spx-panel spx-understand-guide"><h3>Comprendre avant de mémoriser</h3>'+
 '<p><strong>Objectif :</strong> '+esc(x.goal)+'</p><ol>'+x.steps.map(v=>'<li>'+esc(v)+'</li>').join('')+'</ol>'+
 '<p class="spx-mistake"><strong>Erreur fréquente :</strong> '+esc(x.pitfall)+'</p></section>'+conjugations(ref);
}
function practice(ref){
 const x=DATA[ref];if(!x)return '';
 return '<section class="spx-panel spx-micropractice"><h3>3 mises en situation avant la note</h3>'+
 '<p>Lis, réponds mentalement ou par écrit, puis ouvre la correction. Ces activités sont libres : elles ne modifient aucune note et ne donnent aucun XP.</p>'+
 x.tasks.map(([kind,prompt,solution,reason,sound],i)=>'<div class="spx-microtask"><h4>'+['Situation','Réparer une erreur','Mise en pratique'][i]+' '+(i+1)+' · '+esc(({dialogue:'Dialogue',repair:'Trouve l’erreur',listen:'Écoute',choice:'Choisis',complete:'Complète',write:'Écris'})[kind])+'</h4>'+
 '<p>'+esc(prompt)+'</p>'+
 (sound?'<p>'+audio(sound)+'</p>':'')+
 '<label class="spx-micro-label">Ta proposition (facultative) <input type="text" class="spx-micro-input" maxlength="250" placeholder="Essaie avant de voir la correction"></label>'+
 '<details class="spx-micro-answer"><summary>Afficher la correction et comprendre</summary>'+
 '<p><strong>Exemple de réponse :</strong> '+esc(solution)+'</p><p>'+esc(reason)+'</p>'+
 '</details></div>').join('')+'</section>';
}
function errorHint(ref,question){
 const x=DATA[ref];if(!x)return '';
 const source=String(question?.source||question?.prompt||'').toLowerCase();
 if(ref==='L09'||ref==='L13'){
  if(/\bnosotros\b|mi perro y yo/.test(source))return 'Repère « nosotros » : cherche la terminaison de nous.';
  if(/\btú\b/.test(source))return 'Repère « tú » : cherche la terminaison de tu.';
  if(/\byo\b/.test(source))return 'Repère « yo » : cherche la terminaison de je.';
  if(/\bvosotros\b/.test(source))return 'Repère « vosotros » : cherche la terminaison de vous.';
 }
 if(ref==='L15'&&/pienso|pensamos|puedo|podemos/.test(source))return 'Pensar et poder changent de radical à certaines personnes, mais pas à nosotros.';
 if(ref==='L10'&&/\bsoy\b|\bestoy\b|\bsomos\b|\bestamos\b/.test(source))return 'Ser sert notamment à l’identité ; estar indique souvent l’état ou le lieu.';
 if(ref==='L04'&&/gusta/.test(source))return 'Observe si ce qui plaît est au singulier ou au pluriel : gusta / gustan.';
 if(ref==='L07'&&/simpát|celos|soñador|vivaz|vivaces/.test(source))return 'Vérifie le genre et le nombre du nom décrit par l’adjectif.';
 if(ref==='L08')return 'Vérifie le genre et le nombre du nom avant de choisir el, la, los ou las.';
 if(ref==='L11')return 'Repère le sens du mot interrogatif et les deux signes ¿ … ?.';
 return x.pitfall;
}
function difficulty(ref){return DATA[ref]?.goal||'';}
window.TIM_SPANISH_REINFORCEMENT={DATA,TABLES,PRONOUNS,guide,practice,errorHint,difficulty};
})();