#!/usr/bin/env python3
"""Moteur pédagogique ENT de Tim : ZIP -> brouillon BIS/exercices -> lot importable.

Aucune connexion à l'ENT, à GitHub, à Firebase ou à Cloudflare. Aucun test
sur la copie de Tim. Le ZIP et les PDF restent locaux. Le texte envoyé à
l'IA nécessite un consentement explicite et une clé API distincte.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import io
import json
import os
import re
import zipfile
from pathlib import Path
import sys
import time
import urllib.error
import urllib.request
from types import SimpleNamespace

import tim_ent_lot as lot


class GenerationBlocked(ValueError):
    pass


def uid(prefix, *parts):
    return prefix + hashlib.sha256("|".join(map(str, parts)).encode("utf-8")).hexdigest()[:20]


def require(value, msg):
    if not value:
        raise GenerationBlocked(msg)
    return value


def json_answer(payload):
    """Lit uniquement les blocs texte de sortie de l'API Responses."""
    if payload.get("status") not in (None, "completed"):
        raise GenerationBlocked("Réponse IA incomplète : aucun contenu publiable.")
    fragments = []
    for block in payload.get("output", []):
        if block.get("type") == "message":
            for part in block.get("content", []):
                if part.get("type") == "output_text":
                    fragments.append(part.get("text", ""))
    try:
        obj = json.loads("".join(fragments))
    except (TypeError, ValueError) as exc:
        raise GenerationBlocked("L'IA n'a pas retourné un JSON valide.") from exc
    if not isinstance(obj, dict):
        raise GenerationBlocked("L'IA doit retourner un objet JSON.")
    return obj


class ResponsesProvider:
    """Client API minimal, sans dépendance ajoutée ni journalisation des sources."""

    def __init__(self, model=None, key=None, transport=None):
        self.model = model or os.environ.get("TIM_AI_MODEL", "gpt-4.1")
        self.key = key or os.environ.get("OPENAI_API_KEY")
        self.transport = transport
        if not self.transport and not self.key:
            raise GenerationBlocked(
                "OPENAI_API_KEY absent : génération IA impossible. "
                "L'abonnement ChatGPT ne fournit pas automatiquement une clé API."
            )

    def ask(self, instructions, data):
        if self.transport:
            return self.transport(instructions, data)
        request_data = {
            "model": self.model,
            "instructions": instructions,
            "input": json.dumps(data, ensure_ascii=False),
            "text": {"format": {"type": "json_object"}},
            "store": False,
        }
        body = json.dumps(request_data, ensure_ascii=False).encode("utf-8")
        request = urllib.request.Request(
            "https://api.openai.com/v1/responses",
            data=body,
            headers={"Authorization": "Bearer " + self.key,
                     "Content-Type": "application/json"},
            method="POST",
        )
        # Ne jamais journaliser les en-têtes, le corps, ni la réponse brute.
        try:
            with urllib.request.urlopen(request, timeout=110) as response:
                answer = json.load(response)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            raise GenerationBlocked("Service IA indisponible ; lot non publié.") from exc
        return json_answer(answer)


PEDAGOGY = """Tu rédiges des ressources pour un collégien français de 3e.
Tu n'utilises QUE le texte original ENT fourni : aucune connaissance de programme
supposée, aucun exercice de manuel inventé, aucun faux corrigé de professeur.
Réponds avec UN OBJET JSON, sans markdown. Signale insuffisance avec
{"blocked": "raison précise"} plutôt que d'inventer une réponse.
Clarté : consigne courte, raisonnement en étapes, unités et phrase réponse utiles.
Les questions de mathématiques/physique doivent avoir des données et résultats
cohérents. Le QCM comporte exactement 4 options distinctes et right=index 0..3.
Les réponses texte ont right=réponse attendue. why explique la méthode et
l'erreur fréquente en français (minimum 30 caractères). Pour l'espagnol,
q est en espagnol, fr traduit uniquement la consigne (jamais sa réponse).
Ne révèle aucune solution dans l'énoncé. Évite les questions redondantes.
Toute explication doit s'appuyer sur les éléments fournis.
"""

REVIEW = """Tu effectues un contrôle INDÉPENDANT d'un exercice de 3e.
Compare chaque question, options et right à la SOURCE fournie ; refais chaque
calcul et vérifie les unités, l'absence d'ambiguïté, la qualité des explications,
et la traduction des consignes espagnoles. En cas de doute, refuse.
Réponds exclusivement avec un objet JSON:
{"ok": true, "issues": []} ou {"ok": false, "issues": ["problème exact"]}.
Ne déduis jamais que les informations non présentes dans la source sont vraies.
"""


def read_attached_pdfs(inventory, plan, zips):
    """Extrait du texte seulement; refuse scans/illustrations non vérifiables."""
    targets = {str(x["entId"]): x for x in plan.get("sourceReadingRequired") or []}
    if not targets:
        return {}
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise GenerationBlocked("pypdf requis pour lire les PDF, aucun cours inventé.") from exc
    proof = {}
    for item in inventory["items"]:
        ent_id = str(item["entId"])
        if ent_id not in targets:
            continue
        refs = targets[ent_id].get("attachmentIds") or []
        if not refs:
            raise GenerationBlocked("Référence PDF absente : " + ent_id)
        excerpts = []
        for ref in refs:
            matches = []
            for src in zips:
                with zipfile.ZipFile(src) as archive:
                    for row in archive.infolist():
                        name = row.filename.replace("\\", "/")
                        if row.is_dir() or not name.lower().endswith(".pdf"):
                            continue
                        identifiers = (str(ref), str(ref).replace("~", "_"))
                        if any(re.search(r"(?<!\d)" + re.escape(token) + r"(?!\d)", name)
                               for token in identifiers):
                            matches.append((src, name, row.file_size))
            if len(matches) != 1:
                raise GenerationBlocked("PDF original absent ou ambigu : " + ent_id)
            src, name, size = matches[0]
            if not 0 < size <= 4 * 1024 * 1024:
                raise GenerationBlocked("PDF trop volumineux pour l'import : " + ent_id)
            with zipfile.ZipFile(src) as archive:
                binary = archive.read(name)
            if not binary.startswith(b"%PDF-"):
                raise GenerationBlocked("Faux PDF détecté : " + ent_id)
            try:
                pdf = PdfReader(io.BytesIO(binary), strict=True)
                if pdf.is_encrypted or not 1 <= len(pdf.pages) <= 30:
                    raise GenerationBlocked("PDF chiffré ou trop long : " + ent_id)
                pages = []
                for page in pdf.pages:
                    if len(page.images):
                        raise GenerationBlocked(
                            "Schéma/image dans le PDF : contrôle visuel indispensable (" +
                            ent_id + ")")
                    stream = page.get_contents()
                    if stream is not None and len(stream.get_data()) > 4 * 1024 * 1024:
                        raise GenerationBlocked("Contenu PDF trop lourd : " + ent_id)
                    pages.append(page.extract_text() or "")
                text = "\n".join(pages).strip()
            except GenerationBlocked:
                raise
            except Exception as exc:
                raise GenerationBlocked("PDF illisible : " + ent_id) from exc
            if len(text) < 35:
                raise GenerationBlocked("PDF scanné ou texte insuffisant : " + ent_id)
            excerpts.append(text)
        item["sourceContent"] = (str(item.get("original") or "").strip() +
                                 "\n\n" + "\n\n".join(excerpts)).strip()
        check_source(item)
        proof[ent_id] = {
            "attachmentIds": refs,
            "description": "Texte extrait automatiquement des PDF originaux identifiés; "
                           "images/scans refusés. Relecture humaine obligatoire.",
            "verifiedMode": "extraction_non_officielle",
        }
    return proof


def check_source(item):
    text = str(item.get("sourceContent") or item.get("original") or "").strip()
    if len(text) < 35:
        raise GenerationBlocked(
            "Source insuffisante pour " + str(item.get("entId")) +
            " : ne pas fabriquer d'exercices à partir d'un titre."
        )
    if len(text) > 18000:
        raise GenerationBlocked(
            "Cours trop long " + str(item.get("entId")) +
            " : découpage avec preuves nécessaires, aucune troncature silencieuse."
        )
    return text


def ask_checked(provider, task, sources, count=None):
    data = {"task": task, "sources": sources}
    if count is not None:
        data["questionCount"] = count
        data["requiredQuestionFormat"] = {
            "q": "énoncé autonome", "type": "mc ou text",
            "options": ["A", "B", "C", "D"],
            "right": "index 0..3 si QCM, sinon réponse exacte",
            "why": "correction pédagogique détaillée",
            "subject": "matière de la source", "fr": "traduction FR si espagnol"
        }
    answer = provider.ask(PEDAGOGY, data)
    if answer.get("blocked"):
        raise GenerationBlocked("IA : " + str(answer["blocked"]))
    if count is not None:
        questions = answer.get("questions")
        if not isinstance(questions, list) or len(questions) != count:
            raise GenerationBlocked("L'IA n'a pas rédigé exactement " + str(count) + " questions.")
        for q in questions:
            if not isinstance(q, dict):
                raise GenerationBlocked("Question non structurée.")
            if not str(q.get("q") or "").strip() or len(str(q.get("why") or "")) < 30:
                raise GenerationBlocked("Énoncé ou correction manquante.")
            if q.get("type") == "mc":
                opts = q.get("options")
                if not isinstance(opts, list) or len(opts) != 4 or len({
                    str(x).strip().casefold() for x in opts
                }) != 4 or type(q.get("right")) is not int or not 0 <= q["right"] < 4:
                    raise GenerationBlocked("QCM ambigu ou réponse invalide.")
            elif q.get("type") != "text" or not str(q.get("right") or "").strip():
                raise GenerationBlocked("Réponse écrite non vérifiable.")
            if q.get("subject") == "Espagnol" and not str(q.get("fr") or "").strip():
                raise GenerationBlocked("Traduction de consigne espagnole absente.")
    audit = provider.ask(REVIEW, {"task": task, "sources": sources, "candidate": answer})
    if audit.get("ok") is not True or audit.get("issues"):
        raise GenerationBlocked(
            "Contrôle pédagogique indépendant refusé : " +
            "; ".join(map(str, audit.get("issues") or ["réponse non certifiée"]))[:400]
        )
    return answer


def make_questions(provider, source_items, title, count):
    sources = [
        {"subject": x["subject"], "entId": x["entId"], "title": x["title"],
         "original": check_source(x)} for x in source_items
    ]
    answer = ask_checked(
        provider, "Créer " + str(count) + " questions originales de révision sur " + title +
        ". Mélanger réellement les matières si plusieurs sources sont fournies.",
        sources, count,
    )
    questions = answer["questions"]
    allowed = {x["subject"] for x in source_items}
    for q in questions:
        q.setdefault("subject", source_items[0]["subject"])
        if q["subject"] not in allowed:
            raise GenerationBlocked("Question basée sur une matière extérieure aux sources.")
        if q["subject"] == "Espagnol" and not q.get("fr"):
            raise GenerationBlocked("Traduction espagnole obligatoire.")
    if len(allowed) > 1 and len({q["subject"] for q in questions}) < 2:
        raise GenerationBlocked("Défi non mélangé : plusieurs matières obligatoires.")
    return questions


def make_bis(provider, source):
    answer = ask_checked(
        provider,
        "Créer une leçon BIS fidèle : champs summary (explication simple et précise), "
        "steps (liste de 3 à 6 étapes pour comprendre), example (exemple guidé complet), "
        "help (seconde explication pour Je n'ai pas compris). Aucun exercice dans ce résultat.",
        [{"subject": source["subject"], "entId": source["entId"],
          "title": source["title"], "original": check_source(source)}],
    )
    for field in ("summary", "example", "help"):
        if len(str(answer.get(field) or "").strip()) < 45:
            raise GenerationBlocked("Leçon BIS incomplète : " + field)
    steps = answer.get("steps")
    if not isinstance(steps, list) or len(steps) < 3 or any(
        len(str(s).strip()) < 10 for s in steps
    ):
        raise GenerationBlocked("Étapes pédagogiques insuffisantes.")
    ident = uid("BISENT_", source["kind"], source["entId"])
    return {
        "id": ident, "entId": source["entId"], "kind": "bis", "category": "bis",
        "chapter": source["title"], "title": "Leçon BIS — " + source["title"],
        "subject": source["subject"], "date": source.get("date") or "",
        "blocks": [{"kind": "note", "h": "Comprendre simplement",
                    "body": str(answer["summary"]).strip()},
                   {"kind": "note", "h": "Méthode",
                    "body": "\n".join(str(s) for s in steps)},
                   {"kind": "note", "h": "Exemple guidé",
                    "body": str(answer["example"]).strip()}],
        "help": {"simple": str(answer["help"]).strip(), "steps": steps,
                 "example": str(answer["example"]).strip()},
        "examples": [str(answer["example"]).strip()],
        "timEntBatch": True, "sourceFingerprint": source.get("fingerprint") or "",
    }


def exercise(ident, title, subject, lesson, kind, questions, **extra):
    category = ("bonus" if kind == "homework-bonus" else
                "challenge" if kind in ("daily", "weekly", "sunday") else "training")
    return {
        "id": ident, "title": title, "subject": subject, "lesson": lesson,
        "kind": kind, "category": category, "timEntBatch": True,
        "questions": questions, **extra,
    }


def prepare(inventory, plan, provider, existing=None, reference_items=()):
    """Produit un BROUILLON complet ; aucun appel à Firebase."""
    items = inventory["items"]
    problems = plan.get("sourceIssues") or []
    if problems or plan.get("sourceReadingRequired"):
        raise GenerationBlocked(
            "Pièces ou textes ENT non vérifiés : lecture des PDF nécessaire. "
            "Aucun lot trompeusement 'prêt' n'est créé."
        )
    sources = {(x["kind"], str(x["entId"])): x for x in items}
    selected = [
        x for x in items if x.get("status") != "inchangé" and x["kind"] == "lesson"
    ]
    # Les devoirs futurs doivent être couverts même quand le ZIP les répète.
    wanted_homework = {str(x["entId"]) for x in plan.get("homeworkExercisePreparations") or []}
    selected += [x for x in items if x["kind"] == "homework"
                 and str(x["entId"]) in wanted_homework]
    if not selected:
        raise GenerationBlocked("Aucune nouveauté pédagogique à générer.")
    cards = []
    bis_by_key = {}
    exercises = []
    seen = set()
    for item in selected:
        key = (item["kind"], str(item["entId"]))
        if key in seen:
            continue
        seen.add(key)
        check_source(item)
        original = lot.source_card(item)
        if original is None and item.get("sourceContent"):
            original = {
                "id": uid("ENTL_", item["kind"], item["entId"]),
                "entId": item["entId"], "kind": "ent", "category": "school",
                "chapter": item["title"], "title": "Cours ENT (PDF original) — " + item["title"],
                "subject": item["subject"], "date": item.get("date") or "",
                "teacherOriginal": False, "timEntBatch": True,
                "blocks": [{"kind": "note", "h": "Document officiel du professeur",
                            "body": "Consulter la pièce PDF originale jointe. "
                                    "La transcription automatique n'est pas le document officiel."}],
                "help": {"simple": "Ouvrir le PDF original du professeur.",
                         "steps": [], "example": None},
                "attachmentsEntIds": [a["id"] for a in item.get("attachments", [])],
            }
        require(original, "Texte ENT d'origine indisponible.")
        bis = make_bis(provider, item)
        cards.extend([original, bis])
        bis_by_key[key] = bis["id"]
        # Entraînement distinct de l'exercice exact du professeur.
        questions = make_questions(provider, [item], "la leçon " + item["title"], 10)
        exercises.append(exercise(
            uid("TRENT_", *key), "Entraînement — " + item["title"],
            item["subject"], bis["id"], "training", questions,
        ))
    task_by_id = {str(x["entId"]): x for x in plan.get("homeworkExercisePreparations") or []}
    for ent_id, task in task_by_id.items():
        item = sources.get(("homework", ent_id))
        require(item, "Devoir ENT absent de l'inventaire : " + ent_id)
        linked = bis_by_key.get(("homework", ent_id))
        require(linked, "Leçon pour le devoir absente : " + ent_id)
        required = max(int(task.get("requiredSeries", 1)), int(task.get("suggestedSeries", 1)))
        for n in range(1, required + 1):
            questions = make_questions(provider, [item], "le devoir " + item["title"], 10)
            exercises.append(exercise(
                lot.exercise_id_for_homework(ent_id, task["due"], n),
                "Bonus devoir — " + item["title"] + " (" + str(n) + ")",
                item["subject"], linked, "homework-bonus", questions,
                homeworkBonus=True, linkedHomework=[ent_id], homeworkDue=task["due"],
            ))
    # Les 2 à 5 révisions supplémentaires sont distinctes des entraînements de leçon.
    desired = int(plan.get("dailyTrainingSuggested") or 0)
    for i in range(desired):
        item = selected[i % len(selected)]
        bis = bis_by_key[(item["kind"], str(item["entId"]))]
        questions = make_questions(provider, [item], "la révision quotidienne " + item["title"], 10)
        exercises.append(exercise(
            uid("REV_", item["kind"], item["entId"], i),
            "Révision du jour — " + item["title"], item["subject"], bis,
            "training", questions, practiceRole="daily-review",
        ))
    # Des sources DEJA validées permettent de mélanger les défis même si le
    # ZIP du jour ne contient que des maths ou de l'espagnol.
    verified = []
    for x in reference_items:
        if (isinstance(x, dict) and x.get("verified") is True and
            x.get("subject") in lot.SUPPORTED and
            x.get("publishedBisId") and x.get("kind") == "lesson"):
            check_source(x)
            verified.append(x)
    challenge_sources = list({
        (x["subject"], str(x["entId"])): x
        for x in verified + selected
    }.values())
    if plan.get("newChallengeTasks") and len({x["subject"] for x in challenge_sources}) < 2:
        raise GenerationBlocked(
            "Défis mélangés impossibles avec une seule matière documentée. "
            "Ajouter des cours déjà vérifiés au catalogue privé ; ne rien inventer."
        )

    def bis_id(x):
        key = (x["kind"], str(x["entId"]))
        return bis_by_key.get(key) or str(x.get("publishedBisId") or "")

    for task in plan.get("newChallengeTasks") or []:
        sample = challenge_sources[:7]
        if not all(bis_id(x) for x in sample):
            raise GenerationBlocked("Défi : référence BIS historique non vérifiée.")
        questions = make_questions(provider, sample, "défi du " + task["date"],
                                   int(task["questionCount"]))
        exercises.append(exercise(
            task["id"], "Défi — " + task["date"], "Défis",
            bis_id(sample[0]), task["kind"], questions, period=task["date"],
            realLessons=[bis_id(x) for x in sample],
        ))
    return {"lessons": cards, "exercises": exercises}


def run(args, provider=None):
    if provider is None and not args.ai_consent:
        raise GenerationBlocked(
            "Accord d'envoi du texte ENT à l'API IA absent : utiliser --ai-consent. "
            "Aucun identifiant EduConnect n'est transmis."
        )
    provider = provider or ResponsesProvider(model=args.model)
    root = Path(args.out).resolve()
    if root.exists() and any(root.iterdir()):
        raise GenerationBlocked("Dossier de sortie non vide : refus d'écraser un ancien lot.")
    root.mkdir(parents=True, exist_ok=True)
    raw = root / "sources_privees"
    lot.collect(SimpleNamespace(zips=args.zips, previous=args.previous,
                                subject="", date=args.date, out=str(raw)))
    inv = json.loads((raw / "ent_prive_lot.json").read_text(encoding="utf-8"))
    plan = json.loads((raw / "plan_pedagogique.json").read_text(encoding="utf-8"))
    reviewed = read_attached_pdfs(inv, plan, args.zips)
    reviewed_file = root / "preuves_extraction_PDF.json"
    lot.dump(reviewed_file, reviewed)
    catalog = {}
    if args.catalog:
        catalog = json.loads(Path(args.catalog).read_text(encoding="utf-8"))
    reference_items = catalog.get("items") or []
    if not isinstance(reference_items, list):
        raise GenerationBlocked("Catalogue pédagogique privé invalide.")
    result = prepare(inv, plan, provider, reference_items=reference_items)
    inventory_enriched = root / "inventaire_enrichi_prive.json"
    lot.dump(inventory_enriched, inv)
    pack = root / "pack_pedagogique_brouillon.json"
    lot.dump(pack, result)
    # La validation couvre aussi tous les devoirs futurs et les défis.
    accepted = lot.validate(SimpleNamespace(
        pack=str(pack), plan=str(raw / "plan_pedagogique.json"),
        existing=args.existing, reviewed_sources=str(reviewed_file), out=None))
    if accepted != 0:
        raise GenerationBlocked("Contrôle technique du lot refusé. Brouillon conservé ; aucun ZIP importable.")
    ready = root / "lot_ENT_prepare_NON_PUBLIE.zip"
    lot.assemble(SimpleNamespace(
        plan=str(raw / "plan_pedagogique.json"),
        inventory=str(inventory_enriched), pack=str(pack),
        existing=args.existing, reviewed_sources=str(reviewed_file), mapping=None,
        out=str(ready), overwrite=False, zips=args.zips))
    (root / "ETAT_RELECTURE_OBLIGATOIRE.txt").write_text(
        "Brouillon généré et contrôlé automatiquement. "
        "Vérifier humainement chaque calcul, énoncé et réponse, puis autoriser "
        "distinctement l'import Parent. Aucune publication automatique.\n",
        encoding="utf-8",
    )
    return ready


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("zips", nargs="+", help="Archives ENT privées, jamais à pousser sur GitHub")
    parser.add_argument("--out", required=True, help="Dossier privé VIDE pour les résultats")
    parser.add_argument("--date", help="Date YYYY-MM-DD")
    parser.add_argument("--previous", help="État comparatif déjà CONFIRMÉ")
    parser.add_argument("--existing", help="Exercices existants vérifiés, lecture seule")
    parser.add_argument("--catalog", help="Cours ENT historiques privés avec BIS publiées vérifiées")
    parser.add_argument("--model", help="Modèle OpenAI, ou variable TIM_AI_MODEL")
    parser.add_argument("--ai-consent", action="store_true",
                        help="Autorise la transmission des TEXTES ENT à OpenAI via API")
    args = parser.parse_args(argv)
    try:
        path = run(args)
        print("LOT PRÉPARÉ, NON PUBLIÉ : " + str(path))
        return 0
    except (GenerationBlocked, ValueError, OSError, json.JSONDecodeError) as exc:
        print("BLOCAGE SÉCURISÉ : " + str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
