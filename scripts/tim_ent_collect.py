import hashlib
import json
import os
import re
import sys
from datetime import date, timedelta
from pathlib import Path
from urllib.parse import urlparse

from skolengo.api import SkolengoClient, SkolengoBirthdateRequired, jsonapi_deserialize

username = (os.getenv("ENT_USERNAME") or "").strip()
password = os.getenv("ENT_PASSWORD") or ""
if not username or not password:
    sys.exit("ARRET : ENT_USERNAME et ENT_PASSWORD absents. Pas de tentative de connexion.")

schools = SkolengoClient.search_schools("Desmons")
matches = [s for s in schools if "desmons" in s.name.lower()]
if len(matches) != 1:
    sys.exit("ARRET : etablissement Frederic Desmons non identifie de facon unique.")
school = matches[0]
print("Etablissement :", school.name)

birthdates = {}
resume = None
client = None
for attempt in range(3):
    try:
        client = SkolengoClient.login(school, username, password, birthdates, resume)
        break
    except SkolengoBirthdateRequired as err:
        birthday = (os.getenv("ENT_BIRTHDATE") or "").strip()
        if not re.fullmatch(r"\d{1,2}/\d{1,2}/\d{4}", birthday):
            sys.exit("ARRET : EduConnect demande ENT_BIRTHDATE (JJ/MM/AAAA).")
        if err.rejected:
            sys.exit("ARRET : date de naissance non acceptee.")
        birthdates[err.student_name.casefold()] = tuple(map(int, birthday.split("/")))
        resume = err.resume
if client is None:
    sys.exit("ARRET : identification EduConnect non aboutie.")

user = client.get_user_info(client.get_user_id())
students = user.get("students") or [user]
tim = [p for p in students if str(p.get("firstName") or "").lower().startswith("tim")]
if len(tim) != 1:
    sys.exit("ARRET : Tim introuvable ou ambigu parmi les enfants rattaches.")
student_id = tim[0]["id"]
print("Connexion Parent acceptee ; Tim trouve.")

today = date.today()
start, end = today - timedelta(days=15), today + timedelta(days=35)
homework = client.get_homework(
    student_id, start, end,
    not_before=date(today.year if today.month >= 9 else today.year - 1, 9, 1),
)
agenda = client.get_agenda(student_id, today - timedelta(days=14), today + timedelta(days=14))
lessons = [l for day in agenda for l in (day.get("lessons") or [])]
print("Devoirs :", len(homework), "| Cours :", len(lessons))
if not homework and not lessons:
    sys.exit("ARRET : aucune donnee scolaire retournee ; export non effectue.")

errors = []
def details(item, kind):
    ident = str(item.get("id") or "")
    if not ident:
        return item
    path = "/homework-assignments/" if kind == "devoir" else "/lessons/"
    include = ("subject,teacher,attachments,pedagogicContent" if kind == "devoir"
               else "subject,teachers,contents,contents.attachments,toDoForTheLesson,toDoAfterTheLesson")
    try:
        raw = client._request("GET", path + ident, params={
            "include": include, "filter[student.id]": student_id})
        return jsonapi_deserialize(raw)
    except Exception:
        errors.append({"type": kind, "id": ident, "erreur": "detail inaccessible"})
        return item

homework = [details(x, "devoir") for x in homework]
lessons = [details(x, "cours") for x in lessons]

out = Path("ENT/tim") / today.isoformat()
out.mkdir(parents=True, exist_ok=True)
def save(name, obj):
    (out / name).write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
save("devoirs.json", homework)
save("cours.json", lessons)

attachments = {}
def discover(obj):
    if isinstance(obj, dict):
        url = obj.get("url")
        if isinstance(url, str) and url.startswith("https://") and (
            obj.get("name") or obj.get("mimeType") or obj.get("type") == "attachment"
        ):
            attachments[url] = obj
        for v in obj.values():
            discover(v)
    elif isinstance(obj, list):
        for v in obj:
            discover(v)
discover([homework, lessons])
save("liens_pieces_jointes.json", list(attachments.values()))
files_dir = out / "pieces_jointes"
files_dir.mkdir(exist_ok=True)

for url, item in attachments.items():
    host = (urlparse(url).hostname or "").lower()
    known = (host == "api.skolengo.com" or host == "mon-ent-occitanie.fr"
             or host.endswith(".mon-ent-occitanie.fr")
             or host == "skolengo.com" or host.endswith(".skolengo.com"))
    if not known:
        errors.append({"piece_jointe": item.get("name"), "erreur": "domaine non autorise"})
        continue
    filename = re.sub(r"[^\w. -]+", "_", str(item.get("name") or "document"))[:90].strip(". ")
    filename = hashlib.sha256(url.encode()).hexdigest()[:10] + "_" + (filename or "document")
    headers = client._headers() if host == "api.skolengo.com" else {}
    try:
        with client._session.get(url, headers=headers, timeout=20,
                                 allow_redirects=False, stream=True) as response:
            if response.status_code != 200:
                errors.append({"piece_jointe": item.get("name"), "statut": response.status_code})
                continue
            parts = []
            size = 0
            for part in response.iter_content(65536):
                size += len(part)
                if size > 12_000_000:
                    raise ValueError("fichier trop volumineux")
                parts.append(part)
            (files_dir / filename).write_bytes(b"".join(parts))
    except Exception:
        errors.append({"piece_jointe": item.get("name"), "erreur": "echec telechargement"})

save("erreurs.json", errors)
print("Liens de pieces jointes :", len(attachments),
      "| Fichiers :", len(list(files_dir.iterdir())),
      "| Erreurs :", len(errors))
print("Export cree :", out)
