/* Défis tirés uniquement des exercices liés aux vrais cours. Aucun contenu scolaire généré. */
(()=>{'use strict';
 const f = new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
 const isoDate=(date)=>{const p=Object.fromEntries(f.formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return `${p.year}-${p.month}-${p.day}`;};
 const UTC=(s)=>new Date(s+'T12:00:00Z');
 function monday(s){const d=UTC(s),w=(d.getUTCDay()+6)%7;d.setUTCDate(d.getUTCDate()-w);return d.toISOString().slice(0,10);}
 const pad=n=>String(n).padStart(2,'0');
 function weekId(s){const d=UTC(monday(s)), thursday=new Date(d);thursday.setUTCDate(thursday.getUTCDate()+3);const isoYear=thursday.getUTCFullYear();const first=new Date(Date.UTC(isoYear,0,4,12));first.setUTCDate(first.getUTCDate()-((first.getUTCDay()+6)%7));const week=Math.floor((d-first)/604800000)+1;return `WEEK_${isoYear}W${pad(week)}`;}
 function addDays(s,n){const d=UTC(s);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
 function sundayFor(s){const d=UTC(s),dow=d.getUTCDay();d.setUTCDate(d.getUTCDate()+(7-dow)%7);return d.toISOString().slice(0,10);}
 function schoolStart(s){const y=Number(s.slice(0,4)),month=Number(s.slice(5,7));return `${month>=9?y:y-1}-09-01`;}
 function isSchoolLesson(l,from,to){
  // Une ancienne fiche possède parfois seulement « 16 septembre » : elle est conservée
  // si elle appartient au catalogue actuel. Les dates ISO connues, elles, sont filtrées.
  const stamp=lessonDay(l.publishedAt)||lessonDay(l.date);
  return !stamp || (stamp>=from&&stamp<=to);
 }

 function lessonDay(s){s=String(s||'').trim().toLowerCase();let m=s.match(/(20\d\d)[-\/.](0?[1-9]|1[012])[-\/.]([012]?\d|3[01])(?=$|[^0-9])/);if(m)return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
  m=s.match(/\b([012]?\d|3[01])[/\-.](0?[1-9]|1[012])[/\-.](20\d\d)\b/);if(m)return `${m[3]}-${pad(m[2])}-${pad(m[1])}`;
  const months={'janvier':1,'février':2,'fevrier':2,'mars':3,'avril':4,'mai':5,'juin':6,'juillet':7,'août':8,'aout':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12,'decembre':12};
  m=s.match(/\b([012]?\d|3[01])\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+(20\d\d)\b/);return m?`${m[3]}-${pad(months[m[2]])}-${pad(m[1])}`:null;
 }
 function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function qlist(content,lesson){const all=[];for(const ex of content.exercises||[]){if(ex.kind||ex.lesson!==lesson.id||window.TIM_EXERCISE?.school(ex))continue;for(let i=0;i<(ex.questions||[]).length;i++){const q=ex.questions[i];if(q.type==='mc'||q.type==='text')all.push({...q,sourceId:ex.id+':'+i});}}return all;}
 const subject=l=>l.subject||'Espagnol';
 function build(id,content){const lessons=(content.lessons||[]).filter(l=>l.id);const seen=new Set();let chosen=[],isWeekly=false,covered=[],missing=[];
  if(/^DAY_20\d{6}$/.test(id))return null;
  if(false&&/^DAY_20\d{6}$/.test(id)){
    const stamp=id.slice(4);const day=`${stamp.slice(0,4)}-${stamp.slice(4,6)}-${stamp.slice(6)}`;
    // Pas de recyclage d'anciens cours : seules les leçons mises en ligne aujourd'hui.
    // Les exercices authentiques de l'ENT ne sont pas utilisés dans le défi.
    const todays=lessons.filter(l=>lessonDay(l.publishedAt)===day);
    const groups=new Map();
    for(const l of todays){const qs=qlist(content,l).map(q=>({l,q})).sort((a,b)=>hash(id+a.q.sourceId)-hash(id+b.q.sourceId));
      const name=subject(l);if(!groups.has(name))groups.set(name,[]);groups.get(name).push(...qs);
    }
    const names=[...groups.keys()].sort((a,b)=>hash(id+a)-hash(id+b)||a.localeCompare(b));
    // Une première question par matière quand son cours possède des questions bonus.
    const limit=Math.max(5,names.length);
    for(const name of names){const item=groups.get(name).shift();if(item&&!seen.has(item.q.sourceId)){seen.add(item.q.sourceId);chosen.push(item);}}
    // Puis répartir les questions restantes entre les matières, à tour de rôle.
    let progress=true;while(chosen.length<limit&&progress){progress=false;for(const name of names){if(chosen.length>=limit)break;let item=groups.get(name).shift();while(item&&seen.has(item.q.sourceId))item=groups.get(name).shift();if(item){chosen.push(item);seen.add(item.q.sourceId);progress=true;}}}
    if(chosen.length<5)return null;
    return {id,title:'Défi du jour · '+day,description:`${chosen.length} questions tirées des leçons publiées aujourd’hui, ${names.length} matière(s).`,level:'Mission quotidienne',subject:'Défis',lesson:chosen[0].l.id,kind:'daily',questions:chosen.map(x=>({...x.q,q:`${subject(x.l)} · ${x.q.q}`})),realLessons:[...new Set(chosen.map(x=>x.l.title))]};
  }
  const sm=id.match(/^SUNDAY_(20\d{6})$/);
  if(sm){
   const stamp=sm[1],on=`${stamp.slice(0,4)}-${stamp.slice(4,6)}-${stamp.slice(6)}`;
   if(UTC(on).getUTCDay()!==0)return null;
   const start=schoolStart(on);
   const eligible=lessons.filter(l=>isSchoolLesson(l,start,on));
   const groups=new Map();for(const l of eligible){const qs=qlist(content,l);
    if(!qs.length){missing.push(l.title);continue;}
    qs.sort((a,b)=>hash(id+a.sourceId)-hash(id+b.sourceId));
    const name=subject(l);if(!groups.has(name))groups.set(name,[]);
    groups.get(name).push({l,qs});
   }
   // Équilibre les matières, avec rotation des leçons et des questions chaque dimanche.
   const names=[...groups.keys()].sort((a,b)=>a.localeCompare(b,'fr'));
   for(const name of names)groups.get(name).sort((a,b)=>hash(id+a.l.id)-hash(id+b.l.id));
   const sources=[];let something=true;
   while(something){something=false;for(const name of names){const pool=groups.get(name);if(pool.length){sources.push(pool.shift());something=true;}}}
   const maxQuestions=20;
   // Un tour sur chaque leçon, puis un deuxième tour pour étoffer le contrôle.
   for(const pool of sources){if(chosen.length>=maxQuestions)break;const q=pool.qs.shift();if(q){chosen.push({l:pool.l,q});covered.push(pool.l.title);}}
   let somethingMore=true;while(chosen.length<maxQuestions&&somethingMore){somethingMore=false;
    for(const pool of sources){if(chosen.length>=maxQuestions)break;const q=pool.qs.shift();if(q){chosen.push({l:pool.l,q});somethingMore=true;}}
   }
   if(chosen.length<5)return null;
   const nSubjects=new Set(chosen.map(x=>subject(x.l))).size;
   return {id,title:'Défi du dimanche · Depuis la rentrée',description:`${chosen.length} questions de révision sur les cours disponibles depuis le ${start.slice(8)}/${start.slice(5,7)}/${start.slice(0,4)}. ${nSubjects} matière(s).`,level:'Grand défi du dimanche',subject:'Défis',lesson:chosen[0].l.id,kind:'sunday',sundayDate:on,schoolStart:start,realLessons:covered,missingLessons:missing,questions:chosen.map(x=>({...x.q,q:`${subject(x.l)} · ${x.l.title} : ${x.q.q}`}))};
  }
  const wm=id.match(/^WEEK_(20\d{2})W(\d{2})$/);if(!wm)return null;
  const base=UTC(`${wm[1]}-01-04`);base.setUTCDate(base.getUTCDate()-((base.getUTCDay()+6)%7)+(Number(wm[2])-1)*7);const start=base.toISOString().slice(0,10);const end=addDays(start,6);
  const thisWeek=lessons.filter(l=>{const d=lessonDay(l.publishedAt);return d&&d>=start&&d<=end;}).sort((a,b)=>subject(a).localeCompare(subject(b),'fr')||a.id.localeCompare(b.id));
  const pools=[];
  for(const l of thisWeek){const qs=qlist(content,l);if(!qs.length){missing.push(l.title);continue;}qs.sort((a,b)=>hash(id+l.id+a.sourceId)-hash(id+l.id+b.sourceId));pools.push({l,qs});chosen.push({l,q:qs.shift()});covered.push(l.title);}
  // Une question par leçon au minimum, puis un tour équilibré pour obtenir un véritable contrôle.
  const target=Math.max(8,pools.length*2);let more=true;
  while(chosen.length<target&&more){more=false;for(const pool of pools){if(chosen.length>=target)break;if(pool.qs.length){chosen.push({l:pool.l,q:pool.qs.shift()});more=true;}}}
  if(chosen.length<5)return null;
  return {id,title:'Défi de la semaine · '+start+' au '+end,description:`${chosen.length} leçon(s) de cette semaine, ${[...new Set(chosen.map(x=>subject(x.l)))].length} matière(s). ${missing.length?'Certaines leçons sans questionnaire sont exclues.':''}`,level:'Mission hebdomadaire',subject:'Défis',lesson:chosen[0].l.id,kind:'weekly',weekStart:start,realLessons:covered,missingLessons:missing,questions:chosen.map(x=>({...x.q,q:`${subject(x.l)} · ${x.l.title} : ${x.q.q}`}))};
 }
 function fromRefs(id,content,refs){
  if(!/^(DAY_20\d{6}|WEEK_20\d{2}W\d{2}|SUNDAY_20\d{6})$/.test(id)||!Array.isArray(refs)||!refs.length||refs.length>60)return null;
  const chosen=[];for(const key of refs){const m=String(key).match(/^([A-Za-z][A-Za-z0-9_-]{1,35}):(\d{1,2})$/);if(!m)return null;
   const e=content.exercises.find(x=>x.id===m[1]&&!x.kind);if(!e)return null;const q=e.questions[Number(m[2])],l=content.lessons.find(x=>x.id===e.lesson);
   if(!q||!l||!['mc','text'].includes(q.type))return null;chosen.push({l,q:{...q,sourceId:key}});
  }
  const kind=id.startsWith('DAY_')?'daily':id.startsWith('SUNDAY_')?'sunday':'weekly';return {id,kind,title:kind==='daily'?'Défi du jour':kind==='sunday'?'Défi du dimanche · Depuis la rentrée':'Défi de la semaine',description:'Épreuve validée, questions figées à la première validation.',level:kind==='daily'?'Mission quotidienne':kind==='sunday'?'Grand défi du dimanche':'Mission hebdomadaire',subject:'Défis',lesson:chosen[0].l.id,realLessons:[...new Set(chosen.map(x=>x.l.title))],missingLessons:[],questions:chosen.map(x=>({...x.q,q:`${subject(x.l)} · ${x.l.title} : ${x.q.q}`}))};
 }
 function ensure(content,id){if(content.exercises.some(x=>x.id===id))return content.exercises.find(x=>x.id===id);const ex=build(id,content);if(ex)content.exercises.push(ex);return ex;}
 function setup(content){const today=isoDate(new Date());const daily='DAY_'+today.replaceAll('-','');const weekly=weekId(today);const weekStart=monday(today);const sundayDate=sundayFor(today);const sunday='SUNDAY_'+sundayDate.replaceAll('-','');
  // Défi du jour supprimé définitivement ; conserver seulement les missions hebdomadaires.
  ensure(content,weekly);ensure(content,sunday);
  window.__TIM_CHALLENGES={today,weekStart,weekEnd:addDays(weekStart,6),daily:null,dailyIds:[],weekly,sunday,sundayDate,schoolStart:schoolStart(sundayDate)};
  return content;
 }
 window.__TIM_CHALLENGE_BUILD=build;window.__TIM_CHALLENGE_SETUP=setup;window.__TIM_CHALLENGE_ENSURE=ensure;window.__TIM_CHALLENGE_FROM_REFS=fromRefs;
})();
