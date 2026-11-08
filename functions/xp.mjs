export function rawPoints({kind,category,score,total,needsReview}) {
 if(category==='school'||needsReview||!total)return 0;
 const p=Math.max(0,Math.min(1,score/total));
 if(['daily','weekly','sunday'].includes(kind)){
  const base=p===1?3:p>=.8?2:p>=.6?1:p>=.4?-1:-2;
  return base+(p>=.8?5:0);
 }
 if(category==='training')return 0;
 if(category==='bonus')return p===1?2:p>=.6?1:0;
 throw Error('Unknown exercise category');
}
export function cappedPoints(raw,dayEarned=0,dayLost=0,weekEarned=0,dayBonus=0,category='bonus'){
 if(raw<0)return Math.min(0,Math.max(raw,-5+dayLost));
 let cap=Math.min(10-dayEarned,50-weekEarned);
 if(category==='bonus')cap=Math.min(cap,3-dayBonus);
 return Math.max(0,Math.min(raw,cap));
}
