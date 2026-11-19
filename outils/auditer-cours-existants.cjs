'use strict';
// Lecture seule du catalogue existant, sans accès aux comptes ni aux copies.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'guest-data.js'),'utf8'),ctx,{timeout:5000});
const data=ctx.window.TIM_GUEST_DATA;
if(!data||!Array.isArray(data.lessons)||!Array.isArray(data.exercises))throw Error('Catalogue public incomplet');
const subjects=['Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie','Français'];
const report={catalogue:'guest-data.js',date:new Date().toISOString(),totalLessons:data.lessons.length,totalExercises:data.exercises.length,subjects:{},issues:[]};
for(const s of subjects)report.subjects[s]={lessons:0,exercises:0,withoutHelp:[],withoutOriginal:[]};
for(const lesson of data.lessons){
 const s=lesson.subject;
 if(!report.subjects[s]){report.issues.push('Matière inconnue '+s);continue;}
 const x=report.subjects[s];x.lessons++;
 if(!lesson.help?.steps?.length)x.withoutHelp.push(lesson.id);
 if(!lesson.blocks?.length)x.withoutOriginal.push(lesson.id);
}
for(const exercise of data.exercises){
 const s=exercise.subject;
 if(report.subjects[s])report.subjects[s].exercises++;
 else report.issues.push('Exercice sans matière reconnue '+exercise.id);
}
const out=path.join(root,'audit-pedagogique-existant.json');
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(report.issues.length)process.exitCode=1;
