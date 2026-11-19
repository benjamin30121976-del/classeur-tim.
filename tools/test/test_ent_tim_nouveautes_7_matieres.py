"""Tests hors ligne du collecteur sept matières : aucune connexion ENT ni écriture de copie."""
import datetime as dt
import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
from zoneinfo import ZoneInfo

SCRIPT=Path(__file__).resolve().parent.parent/'ent_tim_nouveautes_7_matieres.py'
spec=importlib.util.spec_from_file_location('collector_sept',SCRIPT)
c=importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)

class CollecteurSeptTest(unittest.TestCase):
    def test_sept_matieres_sans_technologie(self):
        subjects={'ESPAGNOL LV2':'Espagnol','MATHÉMATIQUES':'Mathématiques',
                  'PHYSIQUE CHIMIE':'Physique-chimie','ANGLAIS LV1':'Anglais',
                  'SVT':'SVT','HISTOIRE-GÉOGRAPHIE':'Histoire-géographie',
                  'FRANÇAIS':'Français'}
        for name,expected in subjects.items():
            with self.subTest(name=name):self.assertEqual(c.subject_label(name),expected)
        self.assertEqual(c.subject_label('TECHNOLOGIE'),'')
        self.assertEqual(c.agenda_subject({'title':'ESPAGNOL LV2'}),'Espagnol')
        self.assertEqual(c.document_subject({'data':{'attributes':{'title':'FRANÇAIS'}}}),'Français')

    def test_seances_futures_non_presentees_comme_publiees(self):
        days=[
            {'date':'2026-11-19','lessons':[{'id':'A','subject':{'label':'SVT'}}]},
            {'date':'2026-11-20','lessons':[{'id':'B','subject':{'label':'SVT'}}]}
        ]
        items,dates=c.lesson_ids_from_agenda(days,dt.date(2026,11,19),dt.date(2026,11,17))
        self.assertEqual(items,{'A':'SVT'})
        self.assertEqual(dates,{'A':'2026-11-19'})
        self.assertEqual(c.lesson_ids_from_agenda(days,dt.date(2026,11,19),
                         dt.date(2026,11,19),'Mathématiques')[0],{})

    def test_recherche_incrementale_revient_sept_jours(self):
        with tempfile.TemporaryDirectory() as t,patch.object(c,'STATE',Path(t)/'state.json'):
            c.STATE.write_text('{"lastSuccessfulDay":"2026-11-18"}')
            self.assertEqual(c.pick_start(dt.date(2026,11,19),''),dt.date(2026,11,12))
            self.assertEqual(c.pick_start(dt.date(2026,11,19),'2026-11-17'),dt.date(2026,11,17))
            with self.assertRaises(ValueError):
                c.pick_start(dt.date(2026,11,19),'2026-09-01')

    def test_cours_devoirs_pieces_to_zip_unique(self):
        today=dt.datetime.now(ZoneInfo('Europe/Paris')).date()
        date=today.isoformat();due=(today+dt.timedelta(days=7)).isoformat()
        class Tokens:access_token='TEST_TOKEN_A_NE_PAS_EXPORTER'
        class FakeClient:
            tokens=Tokens()
            def get_agenda(self,student,start,end):
                return [{'date':date,
                    'lessons':[{'id':'L1','subject':{'label':'PHYSIQUE-CHIMIE'}}],
                    'homeworkAssignments':[{'id':'H1','subject':{'label':'PHYSIQUE-CHIMIE'},
                                             'title':'Réviser','dueDate':due}]}]
            def _request(self,method,path,params):
                if path=='/lessons/L1':
                    return {'data':{'id':'L1','attributes':{'title':'PHYSIQUE-CHIMIE'}},
                     'included':[{'type':'subject','attributes':{'label':'PHYSIQUE-CHIMIE'}},
                       {'type':'lessonContent','attributes':{'html':'<p>Le noyau contient des protons.</p>'}},
                       {'type':'attachment','id':'10099~321','attributes':
                         {'name':'Schema.pdf','url':'https://exemple.invalid/fichier.pdf','mimeType':'application/pdf'}}]}
                if path=='/homework-assignments/H1':
                    return {'data':{'id':'H1','attributes':{'title':'Réviser les atomes','dueDate':due}},
                     'included':[{'type':'subject','attributes':{'label':'PHYSIQUE-CHIMIE'}},
                        {'type':'pedagogicContent','attributes':{'html':'<p>Relire le chapitre.</p>'}}]}
                raise AssertionError(path)
        class FakeV38:
            def check_url(self,url):return url
            def name_safe(self,name):return name
        class FakeV39:
            MAX_FILE=0
            USER_AGENT='test'
            def fetch_attachment(self,url,headers,path):
                path.write_bytes(b'%PDF-1.4\ncontenu factice\n')
                return path.stat().st_size
        with tempfile.TemporaryDirectory() as temp:
            folder=Path(temp)
            with patch.object(c,'DOWNLOAD',folder),patch.object(c,'ROOT',folder),\
                 patch.object(c,'STATE',folder/'state.json'),\
                 patch.object(c,'get_client_and_student',
                  lambda:(FakeClient(),'eleve',{'id':'etab','emsCode':'entmip'},FakeV38(),FakeV39())):
                self.assertEqual(c.main(['--depuis',date]),0)
                zips=list(folder.glob('ENT-Tim-nouveautes-*.zip'))
                self.assertEqual(len(zips),1)
                with zipfile.ZipFile(zips[0]) as z:
                    docs=json.loads(z.read('cours_toutes_matieres_ENT_originaux.json'))
                    work=json.loads(z.read('travaux_associes_ENT_originaux.json'))
                    refs=json.loads(z.read('index_pieces_ENT.json'))
                    self.assertEqual(len(docs),1)
                    self.assertEqual(len(work),1)
                    self.assertEqual(len(refs),1)
                    self.assertEqual(work[0]['data']['attributes']['dueDate'],due)
                    self.assertTrue(any(n.startswith('pieces_ENT/') for n in z.namelist()))
                    self.assertNotIn('TEST_TOKEN_A_NE_PAS_EXPORTER',
                        z.read('rapport_collecte_en_ligne.json').decode())
                self.assertTrue((folder/'state.json').is_file())

if __name__=='__main__':unittest.main()
