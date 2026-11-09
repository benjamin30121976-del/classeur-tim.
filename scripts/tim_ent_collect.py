"""Collecte a la demande, en lecture seule, des cours et devoirs de Tim dans Skolengo.

S'execute exclusivement dans GitHub Actions avec identifiants dans GitHub Secrets.
Tous les fichiers JSON et PDF temporaires restent sur le runner puis sont chiffres.
Ne jamais pousser le repertoire temporaire ou afficher des donnees scolaires dans les logs.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlparse

from skolengo.api import SkolengoClient, SkolengoBirthdateRequired, SkolengoAuthError, SkolengoLoginRefused, jsonapi_deserialize


OUT = Path(os.getenv("TIM_ENT_OUTPUT", "ent-private-output"))
STUDENT_FIRST_NAME = "tim"


def academic_year_start(today: date) -> date:
    return date(today.year if today.month >= 9 else today.year - 1, 9, 1)


def save(rel: str, value: object) -> None:
    target = OUT / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, ensure_ascii=False, indent=2, default=str), encoding="utf-8")


def contains_marker(value: str, marker: str) -> bool:
    return marker.casefold() in value.casefold()


def school_lookup() -> object:
    matches = [s for s in SkolengoClient.search_schools("Desmons")
               if contains_marker(s.name, "Desmons")]
    if len(matches) != 1:
        raise ValueError("L'etablissement Frederic Desmons n'est pas identifie sans ambiguite")
    school = matches[0]
    if school.ems_code != "entmip":
        raise ValueError("Le portail de l'etablissement n'est pas celui de Mon ENT Occitanie")
    return school


def login(school: object):
    username = (os.environ.get("ENT_USERNAME") or "").strip()
    password = os.environ.get("ENT_PASSWORD") or ""
    if not username or not password:
        raise RuntimeError("Secrets ENT_USERNAME et ENT_PASSWORD manquants : configurer dans GitHub Actions")
    birthday = (os.getenv("ENT_BIRTHDATE") or "").strip()
    birthdates: dict[str, tuple[int, int, int]] = {}
    resume = None
    for _ in range(3):
        try:
            return SkolengoClient.login(school, username, password, birthdates, resume)
        except SkolengoBirthdateRequired as err:
            if err.rejected:
                raise RuntimeError("Verification de date de naissance refusee") from None
            if not re.fullmatch(r"\d{1,2}/\d{1,2}/\d{4}", birthday):
                raise RuntimeError("EduConnect demande ENT_BIRTHDATE, au format JJ/MM/AAAA") from None
            birthdates[err.student_name.casefold()] = tuple(map(int, birthday.split("/")))
            resume = err.resume
    raise RuntimeError("Connexion EduConnect inaboutie apres verification")


def student_id(client) -> str:
    info = client.get_user_info(client.get_user_id())
    students = info.get("students") or ([info] if info.get("type") == "student" else [])
    matches = [p for p in students if str(p.get("firstName") or "").casefold().startswith(STUDENT_FIRST_NAME)]
    if len(matches) != 1:
        raise RuntimeError("L'eleve Tim n'est pas identifie sans ambiguite dans le compte Parent")
    return str(matches[0]["id"])


def details(client, student: str, entry: dict, kind: str, errors: list) -> dict:
    ident = str(entry.get("id") or "")
    if not ident:
        return entry
    path = ("/homework-assignments/" if kind == "devoir" else "/lessons/") + ident
    includes = (
        ["subject,teacher,attachments,pedagogicContent", "subject,attachments", "subject", ""]
        if kind == "devoir" else
        ["subject,teachers,contents,contents.attachments,toDoForTheLesson,toDoAfterTheLesson",
         "subject,teachers,contents", "subject", ""]
    )
    for include in includes:
        params = {"filter[student.id]": student}
        if include:
            params["include"] = include
        try:
            result = jsonapi_deserialize(client._request("GET", path, params=params))
            if isinstance(result, dict):
                return result
        except Exception:
            continue
    errors.append({"type": kind, "id": ident, "erreur": "detail non accessible"})
    return entry


def collect_links(obj, discovered: dict):
    if isinstance(obj, dict):
        name = str(obj.get("name") or obj.get("fileName") or obj.get("filename") or "")
        mime = str(obj.get("mimeType") or obj.get("contentType") or "")
        typ = str(obj.get("type") or "")
        looks_file = bool(name or mime or "attachment" in typ.casefold())
        if looks_file:
            for field in ("url", "downloadUrl", "downloadURL", "fileUrl", "href"):
                url = obj.get(field)
                if isinstance(url, str) and url.startswith("https://"):
                    discovered[url] = obj
        for value in obj.values():
            collect_links(value, discovered)
    elif isinstance(obj, list):
        for value in obj:
            collect_links(value, discovered)


def authorized_attachment_host(url: str) -> bool:
    host = (urlparse(url).hostname or "").casefold()
    return host == "api.skolengo.com" or host == "mon-ent-occitanie.fr" or host.endswith(".mon-ent-occitanie.fr") or host == "skolengo.com" or host.endswith(".skolengo.com")


def download_files(client, records: list, errors: list) -> tuple[int, int]:
    discovered = {}
    collect_links(records, discovered)
    save("liens_pieces_jointes.json", list(discovered.values()))
    file_dir = OUT / "pieces_jointes"
    file_dir.mkdir(parents=True, exist_ok=True)
    n_files = 0
    total = 0
    for url, item in discovered.items():
        if not authorized_attachment_host(url):
            errors.append({"piece_jointe": item.get("name"), "erreur": "domaine non autorise"})
            continue
        name = str(item.get("name") or item.get("fileName") or item.get("filename") or "document")
        name = re.sub(r"[^\w. -]+", "_", name)[:100].strip(". ") or "document"
        filename = hashlib.sha256(url.encode()).hexdigest()[:12] + "_" + name
        if (file_dir / filename).exists():
            continue
        headers = client._headers() if urlparse(url).hostname == "api.skolengo.com" else {}
        try:
            with client._session.get(url, headers=headers, timeout=30, allow_redirects=False, stream=True) as response:
                if response.status_code != 200:
                    errors.append({"piece_jointe": name, "statut": response.status_code})
                    continue
                parts = []
                size = 0
                for part in response.iter_content(65536):
                    size += len(part)
                    if size > 15_000_000 or total + size > 200_000_000:
                        raise ValueError("Document ou volume total trop important")
                    parts.append(part)
                (file_dir / filename).write_bytes(b"".join(parts))
                n_files += 1
                total += size
        except Exception:
            errors.append({"piece_jointe": name, "erreur": "telechargement impossible"})
    return len(discovered), n_files


def collect() -> None:
    today = date.today()
    start = academic_year_start(today)
    # Ne rien collecter avant septembre de l'annee scolaire en cours.
    print("Periode depuis la rentree :", start.isoformat(), "->", today.isoformat())
    school = school_lookup()
    print("Etablissement ENT Occitanie trouve : oui")
    client = login(school)
    student = student_id(client)
    print("Compte Parent, dossier de Tim : authentification acceptee")

    errors: list[dict] = []
    agenda = client.get_agenda(student, start, today + timedelta(days=14))
    lessons_map: dict[str, dict] = {}
    homework_map: dict[str, dict] = {}
    for day in agenda:
        for lesson in (day.get("lessons") or []):
            if isinstance(lesson, dict) and lesson.get("id"):
                lessons_map[str(lesson["id"])] = lesson
        for assignment in (day.get("homeworkAssignments") or []):
            if isinstance(assignment, dict) and assignment.get("id"):
                homework_map[str(assignment["id"])] = assignment

    due = client.get_homework(student, start, today + timedelta(days=35), not_before=start)
    for assignment in due:
        if isinstance(assignment, dict) and assignment.get("id"):
            homework_map[str(assignment["id"])] = assignment

    lessons = [details(client, student, x, "cours", errors) for x in lessons_map.values()]
    homework = [details(client, student, x, "devoir", errors) for x in homework_map.values()]
    if not lessons and not homework:
        raise RuntimeError("Aucun cours ni devoir : export suspendu")
    errors += [{"type": "agenda", "date": d, "erreur": "jour non retourne par Skolengo"}
               for d in getattr(client, "agenda_skipped", [])]
    OUT.mkdir(parents=True, exist_ok=True)
    save("cours.json", lessons)
    save("devoirs.json", homework)
    found, downloaded = download_files(client, [lessons, homework], errors)
    save("erreurs.json", errors)
    save("manifest.json", {
        "date_collecte": today.isoformat(),
        "date_debut": start.isoformat(),
        "date_fin_cours": (today + timedelta(days=14)).isoformat(),
        "date_fin_devoirs": (today + timedelta(days=35)).isoformat(),
        "nombre_cours": len(lessons),
        "nombre_devoirs": len(homework),
        "liens_pieces_jointes": found,
        "fichiers_recuperes": downloaded,
        "anomalies": len(errors),
        "statut": "a_verifier",
    })
    print("Collecte terminee :", len(lessons), "cours,", len(homework),
          "devoirs,", downloaded, "fichiers,", len(errors), "anomalies")


def safe_auth_error_code(exc: Exception) -> str:
    """Diagnostic ferme, sans URL, jeton ni identifiant dans les logs publics."""
    if isinstance(exc, SkolengoBirthdateRequired):
        return "EDUCONNECT_VERIFICATION_NAISSANCE"
    if isinstance(exc, SkolengoLoginRefused):
        return "EDUCONNECT_REFUS_CONNEXION_OU_PARCOURS_NON_PRIS_EN_CHARGE"
    msg = str(exc).casefold()
    if "could not obtain an authorization code" in msg or "authorization code after resuming" in msg:
        return "SSO_CODE_AUTORISATION_ABSENT"
    if "login form not found" in msg or "impossible de trouver le formulaire" in msg:
        return "SSO_FORMULAIRE_CONNEXION_INTRouvABLE"
    if "unrecognized login form" in msg or "impossible d'identifier les champs" in msg:
        return "SSO_CHAMPS_FORMULAIRE_INCONNUS"
    if "invalid credentials or unsupported login flow" in msg:
        return "EDUCONNECT_IDENTIFIANTS_OU_PARCOURS_INCOMPATIBLE"
    if "token exchange failed" in msg:
        return "SSO_ECHANGE_JETON_ECHOUE"
    if "discovery document" in msg:
        return "SSO_DOCUMENT_CONFIGURATION_INDISPONIBLE"
    if "authorization endpoint" in msg:
        return "SSO_ENDPOINT_INJOIGNABLE"
    if "redirect" in msg:
        return "SSO_REDIRECTION_INCOMPLETE"
    if "form submission failed" in msg:
        return "SSO_SOUMISSION_FORMULAIRE_ECHOUEE"
    return "SSO_AUTRE_ERREUR_AUTHENTIFICATION"


if __name__ == "__main__":
    try:
        if "--preflight" in sys.argv:
            school = school_lookup()
            print("PREFLIGHT_OK: etablissement et API Skolengo trouves")
            # Diagnose public OIDC metadata without requesting user credentials.
            import requests
            from urllib.parse import urlparse
            url = school.oidc_wellknown_url
            print("OIDC_METADATA_HOTE:", urlparse(url).hostname)
            try:
                resp = requests.get(url, timeout=20, allow_redirects=True)
                print("OIDC_METADATA_HTTP:", resp.status_code)
                print("OIDC_METADATA_FINAL_HOTE:", urlparse(resp.url).hostname)
                ct = resp.headers.get("Content-Type", "").split(";")[0].lower().strip()
                print("OIDC_METADATA_FORMAT:", ct or "absent")
                if resp.ok:
                    try:
                        doc = resp.json()
                        print("OIDC_METADATA_ENDPOINTS_VALIDES:",
                              bool(doc.get("authorization_endpoint") and doc.get("token_endpoint")))
                    except ValueError:
                        print("OIDC_METADATA_JSON_INVALIDE")
            except requests.RequestException as exc:
                print("OIDC_METADATA_ERREUR_RESEAU:", type(exc).__name__)

        else:
            collect()
    except Exception as exc:
        # Les erreurs detaillees de HTTP/SSO peuvent inclure des URL avec des jetons.
        # Ne pas les imprimer dans un journal GitHub public.
        if isinstance(exc, RuntimeError) and (
            "Secrets" in str(exc) or "ENT_BIRTHDATE" in str(exc)
        ):
            print("ECHEC_CONFIGURATION_ENT:", str(exc), file=sys.stderr)
        elif isinstance(exc, SkolengoAuthError):
            print("ECHEC_AUTH_ENT: code", safe_auth_error_code(exc),
                  "(aucune donnee sensible publiee)", file=sys.stderr)
        else:
            print("ECHEC_COLLECTE_ENT: categorie", type(exc).__name__,
                  "(details masques pour proteger les donnees scolaires)", file=sys.stderr)
        sys.exit(1)
