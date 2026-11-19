import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

SCRIPT=Path(__file__).resolve().parent.parent/'tim_ent_lot.py'
spec=importlib.util.spec_from_file_location('tim_ent_lot',SCRIPT)
p=importlib.util.module_from_spec(spec)
spec.loader.exec_module(p)

class LotTest(unittest.TestCase):
    def make_zip(self,path,entries):
        with zipfile.ZipFile(path,'w') as z:
            for name,data in entries.items():
                z.writestr(name,json.dumps(data,ensure_ascii=False) if not isinstance(data,bytes) else data)
    def inputs(self,folder):
        lessons=[{'data':{'id':'10099~6400507','attributes':{'title':'ESPAGNOL LV2','date':'2026-11-18'},'relationships':{}},
                  'included':[{'type':'subject','attributes':{'label':'ESPAGNOL LV2'}},
                  {'type':'lessonContent','attributes':{'html':'<p>Conocer : yo conozco</p>'}},
                  {'type':'attachment','id':'10099~115430','attributes':{'name':'3D.pdf'}}]}]
        homework=[{'data':{'id':'10099~215356','attributes':{'title':'Interrogation verbes espagnols','dueDate':'2026-11-19'}},
                   'included':[{'type':'subject','attributes':{'label':'ESPAGNOL LV2'}},
                    {'type':'pedagogicContent','attributes':{'html':'<p>Apprendre les verbes</p>'}}]}]
        a=folder/'cours.zip';b=folder/'fiches.zip'
        self.make_zip(a,{'cours_espagnol_ENT_originaux.json':lessons,
                         'travaux_associes_ENT_originaux.json':homework,
                         'dates_seances.json':{'10099~6400507':'2026-11-18'},
                         'rapport_collecte_en_ligne.json':{'matiere':'ESPAGNOL LV2'}})
        self.make_zip(b,{'index_fiches_espagnol.json':[{'id':'10099~115430','nom_ENT':'3D.pdf'}],
                         'pieces/10099~115430.pdf':b'%PDF-1.4\n%Test non prive\n'})
        return a,b
    def test_first_run_no_false_novelty_and_plan(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,'out':str(d/'out'),'date':'2026-11-18','subject':''})()
            p.collect(args)
            plan=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            private=json.loads((d/'out'/'ent_prive_lot.json').read_text())
            self.assertEqual(len(plan['dueTomorrow']),1)
            self.assertEqual(plan['bonusSuggestions'][0]['proposedSeries'],2)
            self.assertEqual(len(plan['lessonsToPrepare']),1)
            self.assertIn('première comparaison',private['items'][0]['status'])
            self.assertIn('conozco',next(x['original'] for x in private['items'] if x['kind']=='lesson'))
    def test_diff_second_run_unchanged(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,'out':str(d/'out'),'date':'2026-11-18','subject':''})()
            p.collect(args)
            args.previous=str(d/'out'/'etat_candidat_non_confirme.json');args.out=str(d/'out2')
            p.collect(args)
            private=json.loads((d/'out2'/'ent_prive_lot.json').read_text())
            self.assertTrue(all(x['status']=='inchangé' for x in private['items']))
            self.assertEqual(json.loads((d/'out2'/'plan_pedagogique.json').read_text())['lessonsToPrepare'],[])
    def test_no_secret_in_zip(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);bad=d/'bad.zip';self.make_zip(bad,{'session.json':{'access_token':'PRIVATE'}})
            with self.assertRaises(ValueError):p.unpack([bad])
    def test_no_path_traversal(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);bad=d/'bad.zip';self.make_zip(bad,{'../outside.json':{}})
            with self.assertRaises(ValueError):p.unpack([bad])
    def test_question_validator_detects_duplicates(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);pack=d/'pack.json'
            q={'type':'mc','q':'Que signifie connaître en espagnol ?',
               'options':['conocer','conocer','poder','hacer'],'right':0,
               'why':'Conocer signifie connaître, pas pouvoir ni faire ; on vérifie le sens exact.'}
            data={'lessons':[{'id':'ES_BIS18','entId':'10099~6400507','subject':'Espagnol',
                              'title':'Verbes','blocks':[{'kind':'note','text':'Conocer'}],
                              'help':'Je repère la personne','examples':['Yo conozco']}],
                  'exercises':[{'id':'ES_HW18_B01','subject':'Espagnol','title':'Bonus','kind':'homework-bonus',
                                'homeworkBonus':True,'linkedHomework':['10099~215356'],
                                'homeworkDue':'2026-11-19','lesson':'ES_BIS18','questions':[q]*10}]}
            pack.write_text(json.dumps(data))
            args=type('A',(),{'pack':str(pack)})()
            self.assertEqual(p.validate(args),1)
            for x in data['exercises'][0]['questions']:x['options'][1]='tener'
            pack.write_text(json.dumps(data))
            self.assertEqual(p.validate(args),0)

    def test_full_cycle_future_homework_j2_j3_j4_j7(self):
        # Collecte ENT factice : exercice anticipé pour chaque échéance,
        # correction, liaison, absence de doublons et lot Parent non publié.
        with tempfile.TemporaryDirectory() as d:
            d=Path(d)
            a,b=self.inputs(d)
            with zipfile.ZipFile(a) as z:
                rows=json.loads(z.read('travaux_associes_ENT_originaux.json'))
                lessons=json.loads(z.read('cours_espagnol_ENT_originaux.json'))
            for index, day in enumerate((20,21,22,25), 1):
                rows.append({'data':{'id':f'10099~21536{index}','attributes':{
                    'title':f'Réviser la conjugaison espagnole pour le {day}/11',
                    'dueDate':f'2026-11-{day}'}},'included':[
                        {'type':'subject','attributes':{'label':'ESPAGNOL LV2'}},
                        {'type':'pedagogicContent','attributes':{
                            'html':'<p>Revoir connaître et les verbes du présent.</p>'}}]})
            self.make_zip(a,{'cours_espagnol_ENT_originaux.json':lessons,
                             'travaux_associes_ENT_originaux.json':rows,
                             'dates_seances.json':{'10099~6400507':'2026-11-18'}})
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,'out':str(d/'out'),
                               'date':'2026-11-18','subject':''})()
            p.collect(args)
            plan=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            due=plan['upcomingHomeworkExercisePreparations']
            self.assertEqual([x['daysUntil'] for x in due],[2,3,4,7])
            self.assertEqual(len(plan['homeworkExercisePreparations']),5)
            self.assertTrue(all(x['requiredSeries']>=1 and x['questionCountPerSeries']==10 for x in due))
            self.assertEqual(len(set(x['exerciseIds'][0] for x in due)),4)
            args.previous=str(d/'out'/'etat_candidat_non_confirme.json')
            args.out=str(d/'out2')
            p.collect(args)
            plan2=json.loads((d/'out2'/'plan_pedagogique.json').read_text())
            self.assertEqual([x['exerciseIds'][0] for x in plan2['upcomingHomeworkExercisePreparations']],
                             [x['exerciseIds'][0] for x in due])
            q={'type':'mc','q':'Que veut dire conocer en français ?',
               'options':['connaître','venir','pouvoir','faire'],'right':0,
               'why':'Le mot espagnol conocer signifie connaître ; les trois autres traductions correspondent à d’autres verbes.'}
            lesson={'id':'ES_BIS18','entId':'10099~6400507','subject':'Espagnol',
                    'title':'Verbes','blocks':[{'kind':'note','text':'Conocer'}],
                    'help':'Regarder les terminaisons','examples':['Yo conozco']}
            exs=[]
            for prep in plan['homeworkExercisePreparations']:
                n=prep['suggestedSeries'] if prep['area']=='devoirs-demain' else 1
                for k in range(n):
                    exs.append({'id':p.exercise_id_for_homework(prep['entId'],prep['due'],k+1),
                                'subject':prep['subject'],'title':'Révision des verbes',
                                'kind':'homework-bonus','homeworkBonus':True,
                                'homeworkDue':prep['due'],'linkedHomework':[prep['entId']],
                                'lesson':'ES_BIS18','questions':[dict(q) for _ in range(10)]})
            # Le contrôle du lendemain exige deux séries, sans plafond de bonus.
            if len(exs)<6:
                exam=plan['homeworkExercisePreparations'][0]
                exs.append({'id':p.exercise_id_for_homework(exam['entId'],exam['due'],2),
                            'subject':exam['subject'],'title':'Révision supplémentaire',
                            'kind':'homework-bonus','homeworkBonus':True,
                            'homeworkDue':exam['due'],'linkedHomework':[exam['entId']],
                            'lesson':'ES_BIS18','questions':[dict(q) for _ in range(10)]})
            exs.append({'id':'ES_LESSON18_T01','subject':'Espagnol',
                        'title':'Comprendre le cours','kind':'training','lesson':'ES_BIS18',
                        'questions':[dict(q) for _ in range(10)]})
            data={'lessons':[lesson],'exercises':exs}
            pack=d/'pack.json';pack.write_text(json.dumps(data),encoding='utf-8')
            validate=type('A',(),{'pack':str(pack),'plan':str(d/'out'/'plan_pedagogique.json'),
                                  'existing':None,'out':str(d/'import.json')})()
            self.assertEqual(p.validate(validate),0)
            imported=json.loads(validate.out and Path(validate.out).read_text())
            bonus_only=[x for x in imported['exercises'] if x.get('homeworkBonus') is True]
            self.assertEqual(len(bonus_only),len(exs)-1)
            self.assertTrue(all(x['homeworkDue'] and len(x['questions'])==10 for x in bonus_only))
            self.assertEqual(sum(x.get('kind')=='training' for x in imported['exercises']),1)
            data['exercises']=[x for x in exs if '10099~215364' not in (x.get('linkedHomework') or [])]
            pack.write_text(json.dumps(data),encoding='utf-8')
            self.assertEqual(p.validate(validate),1)
            # Rattrapage par un bonus déjà publié, sans le republier.
            previous=d/'existing.json'
            previous.write_text(json.dumps({'exercises':[x for x in exs
                if '10099~215364' in (x.get('linkedHomework') or [])]}),encoding='utf-8')
            validate.existing=str(previous)
            self.assertEqual(p.validate(validate),0)

    def test_future_bonus_missing_correction_blocks_ready(self):
        task={'entId':'10099~215999','subject':'Mathématiques','due':'2026-11-25',
              'requiredSeries':1}
        sample={'id':'BDENT_TEST','subject':'Mathématiques','homeworkBonus':True,
                'homeworkDue':'2026-11-25','linkedHomework':['10099~215999'],
                'questions':[{'type':'text','q':'Calcule','right':'4','why':'Court'}]*10}
        self.assertTrue(p.validate_homework_coverage({
            'homeworkExercisePreparations':[task],'bonusSuggestions':[]},[sample]))
        for q in sample['questions']:
            q['why']='On additionne les deux quantités connues, puis on rédige le résultat.'
        self.assertEqual(p.validate_homework_coverage({
            'homeworkExercisePreparations':[task],'bonusSuggestions':[]},[sample]),[])

    def test_missing_attachment_blocks_ready_gate(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            # Simule un ZIP où les métadonnées font référence à un PDF non fourni.
            self.make_zip(b,{'index_fiches_espagnol.json':[
                {'id':'10099~115430','nom_ENT':'3D.pdf'}]})
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,'out':str(d/'out'),
                              'date':'2026-11-18','subject':''})()
            p.collect(args)
            plan=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            self.assertTrue(any(i['type']=='piece_jointe_non_verifiee' for i in plan['sourceIssues']))
            self.assertFalse(plan['sourceReady'])

    def test_missing_due_date_is_reported_not_lost(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            with zipfile.ZipFile(a) as z:
                hw=json.loads(z.read('travaux_associes_ENT_originaux.json'))
                lessons=json.loads(z.read('cours_espagnol_ENT_originaux.json'))
            hw[0]['data']['attributes'].pop('dueDate')
            self.make_zip(a,{'cours_espagnol_ENT_originaux.json':lessons,
                             'travaux_associes_ENT_originaux.json':hw})
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,'out':str(d/'out'),
                              'date':'2026-11-18','subject':''})()
            p.collect(args)
            plan=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            self.assertEqual(len(plan['dueTomorrow'])+len(plan['dueLater']),0)
            self.assertTrue(any(i['type']=='echeance_absente' for i in plan['sourceIssues']))

    def test_lesson_without_training_is_rejected_by_plan(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,'out':str(d/'out'),
                              'date':'2026-11-18','subject':''})()
            p.collect(args)
            q={'type':'text','q':'Explique le sens du verbe conocer','right':'connaître',
               'why':'Conocer veut dire connaître, et la réponse doit décrire le sens précis.'}
            lesson={'id':'ES_BIS18','entId':'10099~6400507','subject':'Espagnol','title':'Cours',
                    'blocks':[{'kind':'note','text':'Conocer'}],
                    'help':'Relire les verbes','examples':['Yo conozco']}
            tasks=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            bonus=[{'id':'ES_HW18_'+str(i),'subject':'Espagnol','title':'Bonus',
                    'kind':'homework-bonus','homeworkBonus':True,
                    'linkedHomework':['10099~215356'],'homeworkDue':'2026-11-19',
                    'lesson':'ES_BIS18','questions':[dict(q) for _ in range(10)]}
                   for i in range(2)]
            pack=d/'pack.json';pack.write_text(json.dumps({'lessons':[lesson],'exercises':bonus}),
                                              encoding='utf-8')
            validation=type('A',(),{'pack':str(pack),'plan':str(d/'out'/'plan_pedagogique.json'),
                                    'existing':None,'out':None})()
            self.assertEqual(p.validate(validation),1)
            bonus.append({'id':'ES_TR18','subject':'Espagnol','title':'Entraînement du cours',
                          'kind':'training','lesson':'ES_BIS18',
                          'questions':[dict(q) for _ in range(10)]})
            pack.write_text(json.dumps({'lessons':[lesson],'exercises':bonus}),encoding='utf-8')
            self.assertEqual(p.validate(validation),0)

    def test_pdf_only_course_requires_verified_reading(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            with zipfile.ZipFile(a) as z:
                lessons=json.loads(z.read('cours_espagnol_ENT_originaux.json'))
                homework=json.loads(z.read('travaux_associes_ENT_originaux.json'))
            lessons[0]['included']=[x for x in lessons[0]['included'] if x.get('type')!='lessonContent']
            self.make_zip(a,{'cours_espagnol_ENT_originaux.json':lessons,
                             'travaux_associes_ENT_originaux.json':homework})
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,
                              'out':str(d/'out'),'date':'2026-11-18','subject':''})()
            p.collect(args)
            plan=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            self.assertEqual(len(plan['sourceReadingRequired']),1)
            self.assertEqual(plan['sourceReadingRequired'][0]['entId'],'10099~6400507')

    def test_today_overdue_and_tomorrow_not_silently_dropped(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            with zipfile.ZipFile(a) as z:
                lessons=json.loads(z.read('cours_espagnol_ENT_originaux.json'))
                hw=json.loads(z.read('travaux_associes_ENT_originaux.json'))
            for ident,day in [('TODAY','2026-11-18'),('PAST','2026-11-17')]:
                h=json.loads(json.dumps(hw[0]))
                h['data']['id']=ident
                h['data']['attributes']['dueDate']=day
                hw.append(h)
            self.make_zip(a,{'cours_espagnol_ENT_originaux.json':lessons,
                             'travaux_associes_ENT_originaux.json':hw})
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,
                              'out':str(d/'out'),'date':'2026-11-18','subject':''})()
            p.collect(args)
            plan=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            self.assertEqual(len(plan['dueToday']),1)
            self.assertEqual(len(plan['overdueHomework']),1)
            self.assertEqual(len(plan['dueTomorrow']),1)

    def test_assemble_unified_private_zip_with_pdf_and_homework(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,
                              'out':str(d/'out'),'date':'2026-11-18','subject':''})()
            p.collect(args)
            inventory=json.loads((d/'out'/'ent_prive_lot.json').read_text())
            original=next(x['original'] for x in inventory['items'] if x['kind']=='lesson')
            base_help={'simple':'Le présent de conocer correspond à connaître.',
                       'steps':['Conocer est un infinitif','Le radical change avec yo'],
                       'example':'Yo conozco','check':None}
            ent={'id':'ES_ENT_BATCH18','entId':'10099~6400507','timEntBatch':True,
                 'title':'Cours original du 18 novembre','subject':'Espagnol',
                 'kind':'ent','category':'school','chapter':'Conjugaison',
                 'date':'2026-11-18','blocks':[{'kind':'note','body':original}],
                 'help':base_help,'examples':['Yo conozco']}
            bis={'id':'ES_BIS_BATCH18','entId':'10099~6400507','timEntBatch':True,
                 'title':'Conjugaison expliquée','subject':'Espagnol',
                 'kind':'bis','category':'bis','chapter':'Conjugaison',
                 'date':'2026-11-18','blocks':[{'kind':'note','body':'Conocer signifie connaître.'}],
                 'help':base_help,'examples':['Yo conozco']}
            q={'type':'mc','q':'Que veut dire conocer en français ?',
               'options':['connaître','venir','pouvoir','faire'],'right':0,
               'fr':'Que veut dire conocer en français ?',
               'why':'Le mot espagnol conocer signifie connaître ; les trois autres traductions correspondent à des verbes différents.'}
            training={'id':'ES_TR_BATCH18','kind':'training','category':'training',
                      'timEntBatch':True,'subject':'Espagnol','title':'Réviser conocer',
                      'lesson':bis['id'],'questions':[dict(q) for _ in range(10)]}
            extras=[]
            for i in range(2):
                extras.append({'id':'ES_BD_BATCH'+str(i+1),'kind':'homework-bonus',
                   'category':'bonus','timEntBatch':True,'subject':'Espagnol',
                   'homeworkBonus':True,'homeworkDue':'2026-11-19',
                   'linkedHomework':['10099~215356'],'lesson':bis['id'],
                   'title':'Préparation du devoir n°'+str(i+1),
                   'questions':[dict(q) for _ in range(10)]})
            daily=[]
            for j in range(2):
                daily.append({**training,'id':'ES_DAILY_REVIEW'+str(j+1),
                    'practiceRole':'daily-review',
                    'title':'Révision quotidienne du cours '+str(j+1)})
            pack=d/'pack.json';pack.write_text(json.dumps({'lessons':[ent,bis],
                                    'exercises':[training]+daily+extras},ensure_ascii=False))
            result=d/'valid-import.zip'
            cmd=type('A',(),{'pack':str(pack),'plan':str(d/'out'/'plan_pedagogique.json'),
                 'inventory':str(d/'out'/'ent_prive_lot.json'),'existing':None,
                 'reviewed_sources':None,'mapping':None,'zips':[str(a),str(b)],
                 'out':str(result),'overwrite':False})()
            self.assertIsNone(p.assemble(cmd))
            with zipfile.ZipFile(result) as z:
                self.assertIn('PACK_PEDAGOGIQUE.json',z.namelist())
                manifest=json.loads(z.read('MANIFESTE_LOT_TIM.json'))
                self.assertEqual(len(manifest['homework']),1)
                self.assertEqual(len(manifest['documents']),1)
                item=manifest['documents'][0]
                self.assertEqual(item['entId'],'10099~6400507')
                self.assertEqual(item['targetId'],'ES_ENT_BATCH18')
                self.assertTrue(z.read(item['path']).startswith(b'%PDF-'))
                self.assertEqual(item['size'],len(z.read(item['path'])))
            with self.assertRaises(ValueError):
                p.assemble(cmd)  # pas d'écrasement
            ent['blocks']=[{'kind':'note','body':'Résumé seulement'}]
            pack.write_text(json.dumps({'lessons':[ent,bis],'exercises':[training]+daily+extras}))
            cmd.out=str(d/'bad.zip')
            with self.assertRaises(ValueError):
                p.assemble(cmd)  # texte du professeur non remplacé par résumé

    def test_empty_ent_session_is_reported_without_blocking_other_subjects(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);a,b=self.inputs(d)
            with zipfile.ZipFile(a) as z:
                lessons=json.loads(z.read('cours_espagnol_ENT_originaux.json'))
                hw=json.loads(z.read('travaux_associes_ENT_originaux.json'))
            lessons[0]['included']=[{'type':'subject','attributes':{'label':'ESPAGNOL LV2'}}]
            self.make_zip(a,{'cours_espagnol_ENT_originaux.json':lessons,
                             'travaux_associes_ENT_originaux.json':hw})
            args=type('A',(),{'zips':[str(a),str(b)],'previous':None,
                              'out':str(d/'out'),'date':'2026-11-18','subject':''})()
            p.collect(args)
            plan=json.loads((d/'out'/'plan_pedagogique.json').read_text())
            self.assertEqual(plan['sourceIssues'],[])
            self.assertEqual(len(plan['sourceWarnings']),1)
            self.assertEqual(plan['sourceWarnings'][0]['type'],'seance_sans_contenu')
            self.assertEqual(plan['dueTomorrow'][0]['entId'],'10099~215356')
            self.assertEqual(plan['lessonsToPrepare'][0]['originalAvailable'],False)

if __name__=='__main__':unittest.main()