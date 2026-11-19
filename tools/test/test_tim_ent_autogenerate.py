"""Tests du moteur : données inventées, aucun ENT, aucun compte Tim, aucune API payante."""
import io
import json
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject
import tempfile
import unittest
import zipfile
from pathlib import Path
from types import SimpleNamespace
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import tim_ent_autogenerate as auto


class FauxModele:
    def __init__(self, reject=False):
        self.count = 0
        self.reject = reject

    def ask(self, instructions, data):
        self.count += 1
        if instructions == auto.REVIEW:
            return {"ok": not self.reject,
                    "issues": ["La réponse est injustifiée."] if self.reject else []}
        if data.get("questionCount"):
            subjects = [x["subject"] for x in data["sources"]]
            questions = []
            for i in range(data["questionCount"]):
                subject = subjects[i % len(subjects)]
                q = {"q": "Quelle notion figure dans la source ? Question " + str(i + 1),
                     "type": "mc", "options": ["La réponse A", "La réponse B",
                                               "La réponse C", "La réponse D"],
                     "right": 0, "subject": subject,
                     "why": "La source fictive explique précisément la réponse A ; "
                            "les trois autres propositions ne conviennent pas à la consigne."}
                if subject == "Espagnol":
                    q["q"] = "¿Qué significa conocer? " + str(i + 1)
                    q["fr"] = "Que signifie conocer ? " + str(i + 1)
                questions.append(q)
            return {"questions": questions}
        subject = data["sources"][0]["subject"]
        audio = []
        if subject == "Espagnol":
            audio = [{"text": "yo conozco", "fr": "je connais"}]
        if subject == "Anglais":
            audio = [{"text": "I visited London last summer.",
                      "fr": "J'ai visité Londres l'été dernier."}]
        return {"audioPhrases": audio,
                "summary": "Le cours explique précisément une notion simple, "
                           "dans un vocabulaire adapté à un élève de troisième.",
                "steps": ["Relire le titre du cours.", "Repérer les informations importantes.",
                          "Rédiger une réponse avec un exemple."],
                "example": "Je relis la consigne et j'explique comment je vérifie ma réponse "
                           "à l'aide des éléments visibles dans le document.",
                "help": "Une autre manière de comprendre consiste à reprendre la définition, "
                        "puis à faire un exemple guidé en expliquant chaque étape."}


def source(ent_id, subject, kind, due=""):
    text = ("Le professeur présente la notion conocer, qui signifie connaître, "
            "et l'exemple yo conozco pour expliquer sa conjugaison."
            if subject == "Espagnol" else
            "Le cours explique I visited London last summer. Cette phrase se situe "
            "au prétérit simple en anglais, une action terminée dans le passé."
            if subject == "Anglais" else
            "Le professeur explique le calcul 2 + 2 = 4 et la nécessité "
            "de rédiger les étapes du raisonnement avant le résultat.")
    return {"entId": ent_id, "subject": subject, "kind": kind,
            "title": "Cours test " + subject, "original": text,
            "date": "2026-11-23", "due": due,
            "attachments": [], "sourceIsComplete": True, "status": "nouveau",
            "fingerprint": ent_id}


class AutoGenerationTests(unittest.TestCase):
    def test_api_json_response(self):
        payload = {"status": "completed", "output": [
            {"type": "message", "content": [
                {"type": "output_text", "text": "{\"ok\":true,\"issues\":[]}"}]}]}
        self.assertTrue(auto.json_answer(payload)["ok"])
        with self.assertRaises(auto.GenerationBlocked):
            auto.json_answer({"status": "incomplete", "output": []})

    def test_relecture_independante_bloque_question(self):
        with self.assertRaises(auto.GenerationBlocked):
            auto.make_questions(FauxModele(reject=True),
                [source("L1", "Mathématiques", "lesson")], "test", 10)

    def test_pas_de_cours_invente_avec_titre_seul(self):
        s = source("L1", "Mathématiques", "lesson")
        s["original"] = "Titre"
        with self.assertRaises(auto.GenerationBlocked):
            auto.make_bis(FauxModele(), s)

    def test_vocabulaire_audio_source_exacte_espagnol_et_anglais(self):
        for matiere, expected in (("Espagnol", "yo conozco"),
                                  ("Anglais", "I visited London last summer.")):
            with self.subTest(matiere=matiere):
                bis = auto.make_bis(FauxModele(), source("L_AUDIO", matiere, "lesson"))
                self.assertEqual(bis["audioPhrases"][0]["text"], expected)
                self.assertTrue(bis["audioPhrases"][0]["fr"])

    def test_vocabulaire_audio_invente_est_refuse(self):
        class FauxInvente(FauxModele):
            def ask(self, instructions, data):
                result = super().ask(instructions, data)
                if instructions == auto.PEDAGOGY and not data.get("questionCount"):
                    result["audioPhrases"] = [{"text": "Un mot jamais publié par la prof",
                                               "fr": "Une fausse traduction"}]
                return result
        with self.assertRaises(auto.GenerationBlocked):
            auto.make_bis(FauxInvente(), source("L_AUDIO", "Anglais", "lesson"))

    def test_generation_complete_sans_reseau_et_sans_publication(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            l1 = source("L_ES", "Espagnol", "lesson")
            l2 = source("L_MA", "Mathématiques", "lesson")
            h1 = source("H_ES", "Espagnol", "homework", "2026-11-24")
            courses = []
            homework = []
            for x in (l1, l2, h1):
                doc = {"data": {"id": x["entId"], "attributes": {
                    "title": x["title"], "date": x["date"],
                    "dueDate": x["due"] if x["kind"] == "homework" else None}},
                    "included": [
                        {"type": "subject", "attributes": {"label": x["subject"]}},
                        {"type": "lessonContent" if x["kind"] == "lesson"
                         else "pedagogicContent",
                         "attributes": {"html": x["original"]}}]}
                (courses if x["kind"] == "lesson" else homework).append(doc)
            archive = root / "faux_ENT.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("cours_originaux.json", json.dumps(courses))
                z.writestr("devoirs_originaux.json", json.dumps(homework))
            args = SimpleNamespace(zips=[str(archive)], out=str(root / "resultat"),
                                   previous=None, existing=None, date="2026-11-23",
                                   ai_consent=False, model=None)
            modele = FauxModele()
            ready = auto.run(args, provider=modele)
            self.assertTrue(ready.exists())
            with zipfile.ZipFile(ready) as z:
                pack = json.loads(z.read("PACK_PEDAGOGIQUE.json"))
                manifest = json.loads(z.read("MANIFESTE_LOT_TIM.json"))
            self.assertEqual(len([x for x in pack["lessons"] if x["kind"] == "bis"]), 3)
            self.assertEqual(len([x for x in pack["exercises"]
                                  if x["kind"] == "homework-bonus"]), 1)
            self.assertEqual(len([x for x in pack["exercises"]
                                  if x.get("practiceRole") == "daily-review"]), 3)
            self.assertEqual(len([x for x in pack["exercises"]
                                  if x["category"] == "challenge"]), 5)
            self.assertEqual(len(manifest["homework"]), 1)
            self.assertGreater(modele.count, 12)
            self.assertTrue((root / "resultat" / "ETAT_RELECTURE_OBLIGATOIRE.txt").exists())
            self.assertFalse(any(p.name == "session.json" for p in root.rglob("*")))
            self.assertFalse(any("publicationReady" in str(x) for x in pack["lessons"]))
            saved_dir = root / "resultat" / "sources_privees"
            previous_inv = json.loads((saved_dir / "ent_prive_lot.json").read_text())
            previous_plan = json.loads((saved_dir / "plan_pedagogique.json").read_text())
            second_ai = FauxModele()
            same = auto.prepare(previous_inv, previous_plan, second_ai, existing=pack)
            self.assertEqual(second_ai.count, 0, "Un lot identique ne doit pas relancer l'IA")
            self.assertEqual({x["id"] for x in same["exercises"]},
                             {x["id"] for x in pack["exercises"]})

    def test_defi_melange_avec_reference_deja_publiee(self):
        nouveau = source("N_MA", "Mathématiques", "lesson")
        historique = source("A_ES", "Espagnol", "lesson")
        historique["verified"] = True
        historique["publishedBisId"] = "BIS_ES_DEJA_PUBLIEE"
        inv = {"items": [nouveau]}
        plan = {"sourceIssues": [], "sourceReadingRequired": [],
                "homeworkExercisePreparations": [], "dailyTrainingSuggested": 0,
                "newChallengeTasks": [
                    {"id": "ENTD_20261124_01", "date": "2026-11-24",
                     "kind": "daily", "questionCount": 10}]}
        pack = auto.prepare(inv, plan, FauxModele(),
                            reference_items=[historique])
        challenge = next(x for x in pack["exercises"] if x["kind"] == "daily")
        self.assertEqual(challenge["id"], "ENTD_20261124_01")
        self.assertIn("BIS_ES_DEJA_PUBLIEE", challenge["realLessons"])
        self.assertEqual({q["subject"] for q in challenge["questions"]},
                         {"Espagnol", "Mathématiques"})

    def test_defi_refuse_sans_deux_matieres(self):
        inv = {"items": [source("N_MA", "Mathématiques", "lesson")]}
        plan = {"sourceIssues": [], "sourceReadingRequired": [],
                "homeworkExercisePreparations": [], "dailyTrainingSuggested": 0,
                "newChallengeTasks": [
                    {"id": "ENTD_20261124_01", "date": "2026-11-24",
                     "kind": "daily", "questionCount": 10}]}
        with self.assertRaises(auto.GenerationBlocked):
            auto.prepare(inv, plan, FauxModele())

    def test_pdf_texte_lu_sans_remplacer_original(self):
        with tempfile.TemporaryDirectory() as folder:
            folder = Path(folder)
            writer = PdfWriter()
            page = writer.add_blank_page(width=595, height=842)
            font = DictionaryObject({NameObject("/Type"): NameObject("/Font"),
                NameObject("/Subtype"): NameObject("/Type1"),
                NameObject("/BaseFont"): NameObject("/Helvetica")})
            page[NameObject("/Resources")] = DictionaryObject({
                NameObject("/Font"): DictionaryObject({NameObject("/F1"): font})})
            stream = DecodedStreamObject()
            stream.set_data(
                b"BT /F1 12 Tf 40 760 Td (Le professeur explique la notion. "
                b"Voici une phrase assez longue pour permettre une revision.) Tj ET")
            page[NameObject("/Contents")] = writer._add_object(stream)
            dest = io.BytesIO()
            writer.write(dest)
            pdf_zip = folder / "pdf.zip"
            with zipfile.ZipFile(pdf_zip, "w") as zipf:
                zipf.writestr("pieces/100~123.pdf", dest.getvalue())
            item = source("L_PDF", "Mathématiques", "lesson")
            item["original"] = ""
            item["attachments"] = [{"id": "100~123", "name": "Cours.pdf"}]
            inventory = {"items": [item]}
            plan = {"sourceReadingRequired": [
                {"entId": "L_PDF", "attachmentIds": ["100~123"]}]}
            proof = auto.read_attached_pdfs(inventory, plan, [str(pdf_zip)])
            self.assertEqual(item["original"], "")
            self.assertIn("notion", item["sourceContent"])
            self.assertEqual(proof["L_PDF"]["attachmentIds"], ["100~123"])

    def test_pdf_scane_sans_texte_refuse(self):
        with tempfile.TemporaryDirectory() as folder:
            folder = Path(folder)
            writer = PdfWriter()
            writer.add_blank_page(width=200, height=300)
            dest = io.BytesIO()
            writer.write(dest)
            archive = folder / "scan.zip"
            with zipfile.ZipFile(archive, "w") as z:
                z.writestr("pieces/987~321.pdf", dest.getvalue())
            item = source("L_SCAN", "Mathématiques", "lesson")
            item["original"] = ""
            inv = {"items": [item]}
            with self.assertRaises(auto.GenerationBlocked):
                auto.read_attached_pdfs(inv, {"sourceReadingRequired": [
                    {"entId": "L_SCAN", "attachmentIds": ["987~321"]}]},
                    [str(archive)])

    def test_mode_api_interdit_sans_consentement(self):
        with tempfile.TemporaryDirectory() as tmp:
            args = SimpleNamespace(zips=[], out=tmp, previous=None,
                                   existing=None, date=None, model=None,
                                   ai_consent=False)
            with self.assertRaises(auto.GenerationBlocked):
                auto.run(args, provider=None)


if __name__ == "__main__":
    unittest.main()
