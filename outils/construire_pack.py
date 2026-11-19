#!/usr/bin/env python3
"""Valide des leçons rédigées à partir des documents ENT et produit un pack brouillon.
Aucune écriture sur le site ou dans les résultats de Tim.
"""
import argparse,json,pathlib,hashlib
SUBJECTS={'Espagnol','Anglais','Mathématiques','Physique-chimie','SVT','Français','Histoire-géographie'}
def check(lesson):
 errors=[]
 for field in ('id_ent','matiere','titre','cours_original','source_document','date_seance','lecon_bis','je_n_ai_pas_compris'):
  if not isinstance(lesson.get(field),str) or not lesson[field].strip():errors.append(field+' manquant')
 if lesson.get('matiere') not in SUBJECTS:errors.append('matière inconnue')
 questions=lesson.get('questions',[])
 if not isinstance(questions,list) or len(questions)<10:return errors+['10 questions minimum']
 for i,q in enumerate(questions):
  for k in ('enonce','reponse','explication','lecon_a_revoir'):
   if not isinstance(q.get(k),str) or not q[k].strip():errors.append(f'Q{i+1} {k} manquant')
  if q.get('type') not in ('ecrit','qcm'):errors.append(f'Q{i+1} type invalide')
  if q.get('type')=='qcm' and (len(q.get('choix',[]))<3 or q.get('reponse') not in q.get('choix',[])):errors.append(f'Q{i+1} QCM incohérent')
 if len({q.get('enonce','').casefold().strip() for q in questions})!=len(questions):errors.append('questions dupliquées')
 return errors
def build(source,target):
 data=json.loads(pathlib.Path(source).read_text(encoding='utf8'));lessons=data.get('lecons',[])
 if not lessons:raise ValueError('Aucune leçon')
 ready=[];errors=[];seen=set()
 for lesson in lessons:
  issues=check(lesson);uid=lesson.get('id_ent')
  if uid in seen:issues.append('identifiant ENT dupliqué')
  seen.add(uid)
  if issues:errors.append({'id_ent':uid,'erreurs':issues});continue
  lid='ENT_'+hashlib.sha256((lesson['matiere']+'|'+uid).encode()).hexdigest()[:16].upper()
  ready.append({'id':lid,'id_ent':uid,'matiere':lesson['matiere'],'titre':lesson['titre'],
   'cours_original':lesson['cours_original'],'source_document':lesson['source_document'],
   'date_seance':lesson['date_seance'],'lecon_bis':lesson['lecon_bis'],
   'je_n_ai_pas_compris':lesson['je_n_ai_pas_compris'],'piece_jointe':lesson.get('piece_jointe'),
   'exercices':[{'id':lid+'_01','kind':'training','questions':lesson['questions'],
     'tentative_unique':True,'correction_immediate':True}],
   'statut':'BROUILLON_NON_PUBLIE'})
 pathlib.Path(target).write_text(json.dumps({'publication':False,'ecriture_donnees_tim':False,
   'lecons':ready,'erreurs':errors},ensure_ascii=False,indent=2),encoding='utf8')
 return len(errors)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('fiches_json');p.add_argument('--output',default='pack-ent-brouillon.json')
 a=p.parse_args();raise SystemExit(bool(build(a.fiches_json,a.output)))
