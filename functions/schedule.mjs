// Planning indicatif Q1/Q2. Ne prouve pas qu'un professeur a corrigé.
// Semaine du 2 novembre 2026 = Q2.
// Transcrit du dossier bibliothèque Suivi_Tim_3D_reference.md, photo EDT 01/09/2026.
// Les vacances, jours fériés et changements ENT ne sont pas encore modélisés.
const schedule={
 'mathématiques':{1:['10:30'],4:['09:30','15:00@Q1'],5:['14:00']},
 'français':{1:['09:30'],2:['08:30@Q1','15:00@Q2'],3:['10:30'],4:['11:30']},
 'anglais':{1:['16:00'],2:['09:30@Q1','11:30@Q2'],4:['08:30@Q1'],5:['09:30@Q2']},
 'espagnol':{1:['14:00@Q2'],3:['09:30'],4:['08:30@Q2','16:00@Q1']},
 'physique-chimie':{2:['09:30@Q2','15:00@Q1'],4:['14:00@Q2']},
 'svt':{1:['14:00@Q1'],2:['10:30@Q2'],5:['09:30@Q1']},
 'histoire-géographie':{1:['11:30'],3:['11:30'],4:['10:30@Q1'],5:['15:00@Q1','16:00@Q2']},
 'technologie':{4:['10:30@Q2','14:00@Q1'],5:['15:00@Q2']},
 'eps':{2:['14:00'],5:['10:30']},
 'arts plastiques':{1:['15:00']},
 'éducation musicale':{2:['08:30@Q2','10:30@Q1']}
};
const datePattern=/^\d{4}-\d{2}-\d{2}$/;
function utcDay(s){if(!datePattern.test(s))throw new Error('Date YYYY-MM-DD requise');const d=new Date(s+'T12:00:00Z');if(Number.isNaN(+d)||d.toISOString().slice(0,10)!==s)throw new Error('Date invalide');return d;}
function isoDay(d){return d.toISOString().slice(0,10);}
export function quarter(date){const d=utcDay(date),ref=utcDay('2026-11-02');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);const weeks=Math.round((d-ref)/604800000);return Math.abs(weeks)%2===0?'Q2':'Q1';}
export function normalizeSubject(raw){const s=String(raw||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(/math/.test(s))return 'mathématiques';if(/phys|chim/.test(s))return 'physique-chimie';if(/espagn/.test(s))return 'espagnol';if(/angl/.test(s))return 'anglais';if(/fran/.test(s))return 'français';if(/histo|geo/.test(s))return 'histoire-géographie';if(/svt|vie et terre/.test(s))return 'svt';if(/techno/.test(s))return 'technologie';if(/musique/.test(s))return 'éducation musicale';if(/plastique/.test(s))return 'arts plastiques';if(/eps|sport/.test(s))return 'eps';return '';}
export function suggestedCorrectionDay({subject,dueDate,submittedDate,excludedDates=[]}){
 if(!Array.isArray(excludedDates)||excludedDates.some(x=>typeof x!=='string'||!datePattern.test(x)))throw new Error('Dates exclues invalides');
 const excluded=new Set(excludedDates);
 const name=normalizeSubject(subject);if(!schedule[name])return null;
 const start=dueDate||submittedDate;if(!start)return null;
 const d=utcDay(start);if(submittedDate&&start<submittedDate)utcDay(submittedDate);
 if(submittedDate&&start<submittedDate)d.setTime(utcDay(submittedDate).getTime());
 for(let i=0;i<28;i++){
  const day=isoDay(d),q=quarter(day),slots=schedule[name][d.getUTCDay()]||[];
  if(!excluded.has(day)&&day>=String(submittedDate||'')&&slots.some(slot=>!slot.includes('@')||slot.endsWith('@'+q)))return day;
  d.setUTCDate(d.getUTCDate()+1);
 }
 return null;
}
export function paris18Utc(date){
 const target=Date.parse(date+'T18:00:00Z');
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',timeZoneName:'shortOffset'}).formatToParts(new Date(target));
 const tz=parts.find(p=>p.type==='timeZoneName')?.value||'GMT+1';const match=tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
 const minutes=match?(match[1]==='+'?1:-1)*(Number(match[2])*60+Number(match[3]||0)):60;
 return new Date(target-minutes*60000).toISOString();
}
export function suggestedCorrectionAt(exercise,submittedDate){const date=suggestedCorrectionDay({subject:exercise.subject||exercise.matiere,dueDate:exercise.dueDate||exercise.entDueDate,submittedDate,excludedDates:exercise.excludedClassDates||[]});return date?paris18Utc(date):null;}

export function nextCorrectionAfterSubmission(exercise,submittedAt){
 const instant=submittedAt instanceof Date?submittedAt:new Date(submittedAt);
 if(!Number.isFinite(instant.getTime()))throw new Error('Date de soumission invalide');
 const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 const parts=fmt.formatToParts(instant),part=k=>parts.find(p=>p.type===k)?.value;
 const date=part('year')+'-'+part('month')+'-'+part('day');
 const clock=part('hour')+':'+part('minute');
 const subject=normalizeSubject(exercise.subject||exercise.matiere);
 if(!subject)return null;
 const excluded=new Set(exercise.excludedClassDates||[]);
 for(let i=0;i<28;i++){
  const d=utcDay(date);d.setUTCDate(d.getUTCDate()+i);
  const day=isoDay(d);
  if(excluded.has(day))continue;
  const q=quarter(day);
  const slots=(schedule[subject]?.[d.getUTCDay()]||[]).filter(s=>!s.includes('@')||s.endsWith('@'+q));
  if(slots.some(s=>i>0||s.slice(0,5)>clock))return paris18Utc(day);
 }
 return null;
}
