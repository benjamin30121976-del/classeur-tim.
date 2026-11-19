import json, pathlib, tempfile, unittest, zipfile, sys
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'outils'))
from preparer_import_ent import main as ignored_main, subject, classify
from construire_pack import check, build
class AutomationTests(unittest.TestCase):
 def test_subjects(self):
  self.assertEqual(subject('cours/espagnol/01.pdf'),'Espagnol')
  self.assertEqual(subject('SVT/chapitre.pdf'),'SVT')
  self.assertEqual(classify('devoirs/maths.txt'),'devoir')
 def test_reject_missing_content(self):
  self.assertTrue(check({'id_ent':'123','matiere':'Mathématiques','questions':[]}))
 def test_pack_is_draft(self):
  with tempfile.TemporaryDirectory() as d:
   p=pathlib.Path(d);qs=[{'type':'ecrit','enonce':f'Question {i}','reponse':str(i),'explication':'Méthode détaillée','lecon_a_revoir':'Chapitre 1'} for i in range(10)]
   lesson={'id_ent':'a1','matiere':'Mathématiques','titre':'Calcul','cours_original':'Cours professeur','source_document':'cours.txt','date_seance':'2026-11-19','lecon_bis':'Explication guidée','je_n_ai_pas_compris':'Exemple progressif','questions':qs}
   (p/'fiches.json').write_text(json.dumps({'lecons':[lesson]}),encoding='utf8')
   self.assertEqual(build(p/'fiches.json',p/'pack.json'),0)
   result=json.loads((p/'pack.json').read_text())
   self.assertFalse(result['publication'])
   self.assertFalse(result['ecriture_donnees_tim'])
   self.assertEqual(len(result['lecons'][0]['exercices'][0]['questions']),10)
if __name__=='__main__':unittest.main()
