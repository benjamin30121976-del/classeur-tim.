/* Figures de repérage pour les énoncés de géométrie, tous exercices.
 * Aucune réponse, correction, tentative, XP ni appel réseau.
 * Ne jamais marquer un parallélisme ou un angle droit à démontrer.
 */
(function(){'use strict';
 const NS='http://www.w3.org/2000/svg';
 const clean=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const svgNode=(name,attrs,text)=>{
  const n=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs||{}))n.setAttribute(key,String(value));
  if(text!==undefined)n.textContent=String(text);
  return n;
 };
 function paint(svg,name,attrs,text){const x=svgNode(name,attrs,text);svg.append(x);return x;}
 function segment(svg,p,q,color='#265d8c',w=3){
  paint(svg,'line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:color,'stroke-width':w,'stroke-linecap':'round'});
 }
 function label(svg,letter,point,dx=0,dy=-13){
  paint(svg,'circle',{cx:point[0],cy:point[1],r:3.8,fill:'#234e70'});
  paint(svg,'text',{x:point[0]+dx,y:point[1]+dy,fill:'#173b5b','text-anchor':'middle','font-size':18,'font-weight':750},letter);
 }
 function measure(svg,x,y,value){
  if(!value)return;
  const w=Math.max(44,String(value).length*7.4+12);
  paint(svg,'rect',{x:x-w/2,y:y-17,width:w,height:25,rx:6,fill:'#fff',stroke:'#aac4d9'});
  paint(svg,'text',{x,y:y+1,fill:'#183a58','font-size':13,'font-weight':650,'text-anchor':'middle'},value);
 }
 function base(kind,description){
  const fig=document.createElement('figure');
  fig.className='tim-math-bonus-figure tim-math-geometry-figure';
  fig.style.cssText='box-sizing:border-box;width:100%;max-width:560px;margin:14px 0 18px;padding:7px;border:1px solid #9bb8ce;border-radius:15px;background:#f8fbff;color:#1d3650';
  const svg=svgNode('svg',{viewBox:'0 0 400 320',role:'img','aria-label':description,style:'display:block;width:100%;max-width:100%;height:auto;margin:auto'});
  paint(svg,'title',{},description);
  paint(svg,'rect',{x:1,y:1,width:398,height:318,rx:12,fill:'#f8fbff',stroke:'#cfdfec'});
  fig.append(svg);
  const caption=document.createElement('figcaption');
  caption.textContent='Schéma de repérage, non à l’échelle. Les conditions de l’énoncé doivent être vérifiées par le calcul.';
  caption.style.cssText='font-size:13px;line-height:1.45;color:#334e68;text-align:center;padding:7px 4px';
  fig.append(caption);
  fig.dataset.diagramKind=kind;
  return {fig,svg,caption};
 }
 function lengths(prompt){
  const found={};
  const unit=/\b(cm|m)\b/i.exec(prompt)?.[1]||'';
  const re=/\b(AM|AB|AN|AC|MN|BC|AD|AE|DE|DF|EF|CG|CD|DG|GH|HI|GI|IJ|IK|JK|JL|KL|MP|NP)\s*=\s*([0-9]+(?:[,.][0-9]+)?)\s*(cm|m)?/gi;
  for(const m of String(prompt||'').matchAll(re)){
   found[m[1].toUpperCase()]={value:m[2],number:Number(m[2].replace(',','.')),unit:m[3]||unit};
  }
  return found;
 }
 const interpolate=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const span=(data,key)=>data[key]?key+' : '+data[key].value+(data[key].unit?' '+data[key].unit:''):null;
 const nums=(data,a,b)=>data[a]&&data[b]?data[a].number/data[b].number:null;
 function thales(prompt,context){
  const normalized=clean(prompt);
  const crossed=/crois[eé]e|papillon/.test(normalized);
  const small=(/\bAD\b|\bAE\b|\bDE\b|\bD\s*(?:sur|appartient)/i.test(prompt)||
    /\bA[\s,–-]*D[\s,–-]*B\b/i.test(prompt))?['D','E']:['M','N'];
  const a=small[0],b=small[1];
  const data=lengths(prompt);
  // Une question « peut-on conclure (MN)//(BC) ? » n'est PAS une donnée.
  // Ne pas révéler la conclusion avant le raisonnement.
  const givenParallel=/(?:\((?:MN|DE)\)|\b(?:MN|DE)\b)\s+est\s+parall[eè]le\b/i.test(prompt)||
    /\bavec\s+\((?:MN|DE)\)\s*(?:parall[eè]le|∥)/i.test(prompt);
  const knownDifferent=/diff[eé]rent|ne sont pas parall[eè]le|non parall[eè]le/.test(normalized);
  let ratio1=nums(data,'A'+a,'AB'),ratio2=nums(data,'A'+b,'AC');
  if(!Number.isFinite(ratio1)||ratio1<=0||ratio1>=1)ratio1=.44;
  if(!Number.isFinite(ratio2)||ratio2<=0||ratio2>=1)ratio2=knownDifferent?.57:ratio1;
  const {fig,svg,caption}=base('thales','Triangle ABC, '+a+' sur AB et '+b+' sur AC, segments '+a+b+' et BC dessinés');
  const pts=crossed?{A:[196,152],B:[337,51],C:[338,257]}:{A:[199,43],B:[60,249],C:[342,249]};
  pts[a]=interpolate(pts.A,pts.B,ratio1);
  pts[b]=interpolate(pts.A,pts.C,ratio2);
  segment(svg,pts.A,pts.B);segment(svg,pts.A,pts.C);
  segment(svg,pts.B,pts.C,'#376c91',3);
  segment(svg,pts[a],pts[b],givenParallel?'#168266':'#c0772b',4);
  label(svg,'A',pts.A,0,crossed?-13:-13);
  label(svg,'B',pts.B,-10,crossed?-13:22);
  label(svg,'C',pts.C,10,crossed?20:22);
  label(svg,a,pts[a],-18,0);label(svg,b,pts[b],18,0);
  const places={AB:[58,142],AC:[342,142],BC:[198,277]};
  places['A'+a]=[111,91];places['A'+b]=[285,91];places[a+b]=[200,164];
  for(const [key,point] of Object.entries(places))if(data[key])measure(svg,...point,span(data,key));
  if(givenParallel){
   caption.textContent='Les droites '+a+b+' et BC sont indiquées parallèles dans l’énoncé. Schéma non à l’échelle.';
  }else{
   caption.textContent='Aucun parallélisme n’est marqué : la conclusion doit être justifiée par les données de l’énoncé. Schéma non à l’échelle.';
  }
  return fig;
 }
 function triangle(prompt,context){
  const normalized=clean(prompt);
  const letters=(/\btriangle\s+([A-Z]{3})\b/.exec(prompt)||/\b([A-Z]{3})\s+est\s+(?:un\s+)?triangle\b/.exec(prompt)||[])[1]||'ABC';
  const [a,b,c]=letters.split('');
  const right=(/rectangle\s+en\s+([A-Z])\b/i.exec(prompt)||[])[1]||'';
  const data=lengths(prompt);
  let p;
  if(right===a)p={ [a]:[74,250],[b]:[74,55],[c]:[334,250] };
  else if(right===b)p={ [a]:[74,55],[b]:[74,250],[c]:[334,250] };
  else if(right===c)p={ [a]:[74,250],[b]:[334,55],[c]:[334,250] };
  else p={ [a]:[192,44],[b]:[60,245],[c]:[342,245] };
  const {fig,svg,caption}=base('triangle','Triangle '+letters+(right?' rectangle en '+right:' sans angle droit présumé'));
  segment(svg,p[a],p[b]);segment(svg,p[b],p[c]);segment(svg,p[c],p[a]);
  for(const letter of [a,b,c])label(svg,letter,p[letter],letter===a?0:letter===b?-14:14,letter===a?-13:20);
  if(right){
   const q=p[right],h=right===a?13:13;
   const other=[a,b,c].filter(k=>k!==right);
   const v1=other.map(k=>p[k]).filter(t=>Math.abs(t[0]-q[0])<1)[0];
   const v2=other.map(k=>p[k]).filter(t=>Math.abs(t[1]-q[1])<1)[0];
   if(v1&&v2){
    const dx=v2[0]>q[0]?1:-1,dy=v1[1]>q[1]?1:-1;
    paint(svg,'path',{d:'M'+q[0]+','+(q[1]+dy*h)+' L'+(q[0]+dx*h)+','+(q[1]+dy*h)+' L'+(q[0]+dx*h)+','+q[1],
     fill:'none',stroke:'#bd6427','stroke-width':2.8});
   }
   caption.textContent='L’angle droit en '+right+' est donné dans l’énoncé. Schéma non à l’échelle.';
  }else{
   caption.textContent='Aucun angle droit marqué : il faut vérifier les longueurs avant de conclure. Schéma non à l’échelle.';
  }
  const sides=[a+b,b+c,a+c];
  const places=[[62,143],[210,273],[291,137]];
  sides.forEach((name,i)=>{if(data[name])measure(svg,...places[i],span(data,name));});
  return fig;
 }
 function rectangle(prompt){
  const values=[...String(prompt||'').matchAll(/([0-9]+(?:[,.][0-9]+)?)\s*(cm|m)\b/gi)].slice(0,2);
  const {fig,svg,caption}=base('rectangle','Rectangle, longueur et largeur indiquées lorsqu’elles sont fournies');
  paint(svg,'rect',{x:67,y:67,width:256,height:174,rx:1,fill:'#e4f2fd',stroke:'#225c8e','stroke-width':4});
  if(values.length===2){
   measure(svg,195,49,values[0][1]+' '+values[0][2]);
   measure(svg,351,149,values[1][1]+' '+values[1][2]);
   caption.textContent='Les deux mesures reprises sont données dans l’énoncé. Ne confonds pas aire et périmètre.';
  }else caption.textContent='Repère les quatre côtés du rectangle : deux longueurs et deux largeurs. Schéma non à l’échelle.';
  return fig;
 }
 function choose(prompt,hint){
  const s=String(prompt||''),c=clean(s),h=clean(hint);
  if(!s.trim())return null;
  if(/enonce (?:du|de|n.est pas)|le professeur a demande|page \d+.*manu|reproduire le devoir/.test(c))return null;
  if(/thales|thal[eè]s|parallele|align[eé]|droites? \(|\b(?:AM|AN|AD|AE)\s*\/\s*(?:AB|AC)\b/i.test(c)||
    (/thales|thal[eè]s/.test(h)&&/triangle|rapport|reciproque|segment|angles?|droites?|align|parallele|position|configuration|egalit|conclu|redaction|\babc\b|\bad\s*=|\bae\s*=|\bam\s*=|\ban\s*=/i.test(c))){
   return 'thales';
  }
  if(/pythagore|hypotenuse|triangle (?:[A-Z]{3} )?rectangle|nature du triangle|triangle .*cotes|triangle .*angles|diagonale/i.test(c)||
    (/pythagore|triangle rectangle/.test(h)&&/triangle|longueur|perimetre|aire|rectangle|cotes?|hypotenuse|calcul|nature/i.test(c))){
   return 'triangle';
  }
  if(/rectangle|potager rectangulaire|contour d.un cadre|perimetre de l.affiche|affiche rectangulaire/i.test(c)||
    (/rectangle|perimetre/.test(h)&&/perimetre|aire|contour|cadre|longueur/i.test(c))){
   return 'rectangle';
  }
  return null;
 }
 function renderPrompt(prompt,hint='',contextPrompt=''){
  const kind=choose(prompt,hint);
  if(!kind)return null;
  const full=contextPrompt&&contextPrompt!==prompt?String(contextPrompt)+' '+String(prompt):String(prompt);
  if(kind==='thales')return thales(full,hint);
  if(kind==='triangle')return triangle(full,hint);
  return rectangle(full);
 }
 function render(ex,index){
  if(!ex||ex.subject!=='Mathématiques')return null;
  const q=ex.questions?.[index];if(!q)return null;
  const prompt=String(q.q||q.prompt||'');
  const hint=String(ex.title||'')+' '+String(ex.topic||'')+' '+String(ex.chapter||'');
  let shared='';
  if((/quel(?:le)? est (?:son|sa)|quel est le (?:perimetre|périmètre)/i.test(prompt))&&ex.questions?.length){
   shared=String(ex.questions.find(x=>/AB\s*=\s*[0-9]|triangle\s+[A-Z]{3}/i.test(x.q||x.prompt||''))?.q||'');
  }
  return renderPrompt(prompt,hint,shared);
 }
 window.TIM_GEOMETRY_DIAGRAMS=Object.freeze({render,renderPrompt,choose});
})();
