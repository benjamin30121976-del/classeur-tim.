"""Tests du moteur : données inventées, aucun ENT, aucun compte Tim, aucune API payante."""
import io
import json
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
        return {"summary": "Le cours explique précisément une notion simple, "
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
                                  if x["practiceRole"] == "daily-review"]) if False
                             else len([x for x in pack["exercises"]
                                       if x.get("practiceRole") == "daily-review"]), 3)
            self.assertEqual(len([x for x in pack["exercises"]
                                  if x["category"] == "challenge"]), 5)
            self.assertEqual(len(manifest["homework"]), 1)
            self.assertGreater(modele.count, 12)
            self.assertTrue((root / "resultat" / "ETAT_RELECTURE_OBLIGATOIRE.txt").exists())
            self.assertFalse(any(p.name == "session.json" for p in root.rglob("*")))
            self.assertFalse(any("publicationReady" in str(x) for x in pack["lessons"]))

    def test_mode_api_interdit_sans_consentement(self):
        with tempfile.TemporaryDirectory() as tmp:
            args = SimpleNamespace(zips=[], out=tmp, previous=None,
                                   existing=None, date=None, model=None,
                                   ai_consent=False)
            with self.assertRaises(auto.GenerationBlocked):
                auto.run(args, provider=None)


if __name__ == "__main__":
    unittest.main()
