/* Missions 2026 : génération déterministe côté client et côté serveur.
 * Ce module ne contient aucune réponse ; les réponses privées viennent de Firestore.
 */
export const DAILY_MISSION_COUNT=24;
export const parisDay=date=>{
 const parts=new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(date));
 const p=Object.fromEntries(parts.filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
 return p.year+'-'+p.month+'-'+p.day;
};
export function monday(date){
 const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
 return d.toISOString().slice(0,10);
}
export function weekId(date){
 const m=monday(date),d=new Date(m+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+3);
 const year=d.getUTCFullYear(),first=new Date(Date.UTC(year,0,4,12));
 first.setUTCDate(first.getUTCDate()-((first.getUTCDay()+6)%7));
 return 'WEEK_'+year+'W'+String(Math.floor((new Date(m+'T12:00:00Z')-first)/604800000)+1).padStart(2,'0');
}
const dateUTC=s=>new Date(s+'T12:00:00Z');
const addDays=(s,n)=>{const d=dateUTC(s);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const hash=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
const validDate=s=>/^20\d{2}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(dateUTC(s).getTime());
function publication(lesson){
 const text=String(lesson?.publishedAt||lesson?.date||'');
 const iso=text.match(/(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})/);
 if(iso)return iso[1]+'-'+iso[2].padStart(2,'0')+'-'+iso[3].padStart(2,'0');
 const fr=text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b/);
 if(fr)return fr[3]+'-'+fr[2].padStart(2,'0')+'-'+fr[1].padStart(2,'0');
 return '';
}
function pool(content,on){
 const lessons=new Map((content?.lessons||[]).filter(l=>l?.id).map(l=>[l.id,l]));
 const found=[];
 for(const ex of content?.exercises||[]){
  if(!ex?.id||ex.kind||!Array.isArray(ex.questions)||ex.category==='school'||ex.exerciseType==='school'||ex.fromENT===true||ex.origin==='ENT'||ex.sourceType==='ENT')continue;
  const lesson=lessons.get(ex.lesson);if(!lesson)continue;
  const stamp=publication(lesson);if(stamp&&stamp>on)continue;
  for(let i=0;i<ex.questions.length;i++){
   const q=ex.questions[i];if(!q||!['mc','text'].includes(q.type)||typeof q.q!=='string'||!q.q.trim())continue;
   if(q.type==='mc'&&(!Array.isArray(q.options)||q.options.length<2))continue;
   found.push({id:ex.id+':'+i,lesson,q,stamp});
  }
 }
 return found;
}
const sorted=(items,seed)=>items.slice().sort((a,b)=>hash(seed+'|'+a.id)-hash(seed+'|'+b.id)||a.id.localeCompare(b.id));
function select(items,amount,seed,offset=0){
 if(items.length<amount)return [];
 const s=sorted(items,seed);
 return Array.from({length:amount},(_,i)=>s[(offset+i)%s.length]);
}
export function isMissionId(id){
 return /^DAY_20\d{6}_(?:0[1-9]|1\d|2[0-4])$/.test(id)||/^WEEK_20\d{2}W\d{2}$/.test(id)||/^SUNDAY_20\d{6}$/.test(id);
}
export function buildMission(id,content,curriculum=null){
 if(!isMissionId(id))return null;
 let chosen=[],kind='',period='',label='';
 const dm=id.match(/^DAY_(20\d{2})(\d{2})(\d{2})_(\d{2})$/);
 const wm=id.match(/^WEEK_(20\d{2})W(\d{2})$/);
 const sm=id.match(/^SUNDAY_(20\d{2})(\d{2})(\d{2})$/);
 if(dm){
  const on=dm[1]+'-'+dm[2]+'-'+dm[3],number=Number(dm[4]);
  const dow=dateUTC(on).getUTCDay();
  if(!validDate(on)||dow===0||dow===6)return null;
  chosen=select(pool(content,on),10,'DAY_'+on,(number-1)*10);
  kind='daily';period=on;label='Petit défi du jour n°'+number; }else if(wm){
  const year=Number(wm[1]),num=Number(wm[2]),jan4=new Date(Date.UTC(year,0,4,12));
  jan4.setUTCDate(jan4.getUTCDate()-((jan4.getUTCDay()+6)%7)+(num-1)*7);
  const start=jan4.toISOString().slice(0,10);if(weekId(start)!==id)return null;
  const end=addDays(start,6),available=pool(content,end);
  const current=available.filter(x=>x.stamp&&x.stamp>=start&&x.stamp<=end);
  const older=available.filter(x=>!current.includes(x));
  chosen=[...sorted(current,id),...sorted(older,id)].slice(0,20);
  kind='weekly';period=start;label='Grand défi du samedi · Semaine et révisions';
 }else if(sm){
  const on=sm[1]+'-'+sm[2]+'-'+sm[3];
  if(!validDate(on)||dateUTC(on).getUTCDay()!==0)return null;
  const start=(Number(on.slice(5,7))>=9?on.slice(0,4):String(Number(on.slice(0,4))-1))+'-09-01';
  chosen=select(pool(content,on).filter(x=>!x.stamp||x.stamp>=start),20,id);
  kind='sunday';period=on;label='Grand défi du dimanche · Depuis la rentrée';
 }
 if(chosen.length!==(kind==='daily'?10:20))return null;
 const q=chosen.map(x=>({...x.q,q:(x.lesson.subject||'Espagnol')+' · '+x.q.q,sourceId:x.id}));
 return {id,title:label,description:kind==='daily'?'10 questions de révision des leçons déjà étudiées.':kind==='weekly'?'20 questions sur les leçons de la semaine et les révisions.':'20 questions de révision depuis septembre.',
  level:kind==='daily'?'Mission quotidienne':kind==='weekly'?'Contrôle du samedi':'Grand contrôle du dimanche',
  subject:'Défis',lesson:chosen[0].lesson.id,kind,category:'challenge',period,
  realLessons:[...new Set(chosen.map(x=>x.lesson.title))],questions:q};
}
export function isMissionOpen(ex,today=parisDay(new Date())){
 if(!ex||!isMissionId(ex.id)||!validDate(today))return false;
 const dow=dateUTC(today).getUTCDay();
 if(ex.kind==='daily')return dow>=1&&dow<=5&&ex.id.startsWith('DAY_'+today.replace(/-/g,'')+'_');
 if(ex.kind==='weekly')return dow===6&&ex.id===weekId(today);
 if(ex.kind==='sunday')return dow===0&&ex.id==='SUNDAY_'+today.replace(/-/g,'');
 return false;
}
export function setupMissions(content,now=new Date(),curriculum=null){
 const today=parisDay(now),dow=dateUTC(today).getUTCDay();
 const dailyIds=dow>=1&&dow<=5?Array.from({length:DAILY_MISSION_COUNT},(_,i)=>'DAY_'+today.replace(/-/g,'')+'_'+String(i+1).padStart(2,'0')):[];
 const saturday=addDays(monday(today),5),sunday=addDays(monday(today),6);
 const weekly=weekId(today),sundayId='SUNDAY_'+sunday.replace(/-/g,'');
 const ids=[...dailyIds,weekly,sundayId],exercises=ids.map(id=>buildMission(id,content,curriculum)).filter(Boolean);
 return {meta:{today,weekStart:monday(today),weekEnd:sunday, daily:dailyIds[0]||null,dailyIds,weekly,sunday:sundayId,saturdayDate:saturday,sundayDate:sunday},exercises};
}
