import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

SCRIPT=Path(__file__).resolve().parents[1]/'tools'/'tim_ent_lot.py'
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
        self.make_zip(b,{'index_fiches_espagnol.json':[{'id':'10099~115430','nom_ENT':'3D.pdf'}]})
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
                                'lesson':'ES_BIS18','questions':[q]*10}]}
            pack.write_text(json.dumps(data))
            args=type('A',(),{'pack':str(pack)})()
            self.assertEqual(p.validate(args),1)
            for x in data['exercises'][0]['questions']:x['options'][1]='tener'
            pack.write_text(json.dumps(data))
            self.assertEqual(p.validate(args),0)

if __name__=='__main__':unittest.main()