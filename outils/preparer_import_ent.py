#!/usr/bin/env python3
"""Prépare un ZIP ENT en inventaire traçable, sans modifier le classeur ni les données Tim.
Usage: python outils/preparer_import_ent.py archive.zip --output dossier
"""
import argparse, hashlib, json, pathlib, re, zipfile
from datetime import datetime, timezone

SUBJECTS = {"espagnol":"Espagnol","anglais":"Anglais","math":"Mathématiques","physique":"Physique-chimie","chimie":"Physique-chimie","svt":"SVT","fran":"Français","histoire":"Histoire-géographie","geo":"Histoire-géographie"}
def digest(data): return hashlib.sha256(data).hexdigest()
def subject(name):
    n=name.casefold()
    for key,value in SUBJECTS.items():
        if key in n: return value
    return "À classer"
def classify(name):
    n=name.casefold()
    if re.search(r"devoir|homework|travail.a.faire",n): return "devoir"
    if n.endswith((".pdf",".doc",".docx",".png",".jpg",".jpeg",".svg")): return "pièce"
    return "cours_ou_metadata"
def main():
    p=argparse.ArgumentParser();p.add_argument("zip");p.add_argument("--output",default="import-ent-preparation")
    a=p.parse_args();out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
    records=[];seen=set()
    with zipfile.ZipFile(a.zip) as archive:
        for item in archive.infolist():
            if item.is_dir(): continue
            if item.file_size>50_000_000: raise ValueError("Fichier trop volumineux dans l'archive")
            name=item.filename
            if pathlib.PurePosixPath(name).is_absolute() or ".." in pathlib.PurePosixPath(name).parts: raise ValueError("Chemin ZIP non sûr")
            data=archive.read(item);sha=digest(data)
            if (name,sha) in seen: continue
            seen.add((name,sha))
            records.append({"source":name,"sha256":sha,"bytes":len(data),"matiere_provisoire":subject(name),
              "type_provisoire":classify(name),"statut":"à_comparer_avec_classeur",
              "cours_professeur":"à_extraire_et_vérifier","piece_originale":"à_conserver",
              "lecon_BIS":"à_rédiger","aide":"à_rédiger","exercices":"à_rédiger_et_valider",
              "corrections":"à_valider","xp":"barème_reference_sans_ecriture"})
    manifest={"version":1,"date_utc":datetime.now(timezone.utc).isoformat(),
      "archive_sha256":digest(pathlib.Path(a.zip).read_bytes()),"total":len(records),
      "publication":False,"ecriture_donnees_tim":False,"elements":records}
    (out/"inventaire.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding="utf-8")
    lines=["# Préparation import ENT","",f"Éléments : {len(records)}","",
      "Ce rapport est un inventaire, pas une importation ni une génération pédagogique validée.",
      "Comparer les identifiants et dates ENT avant de créer cours, BIS, aides, exercices et corrections.","",
      "| Matière provisoire | Type provisoire | Fichier |","|---|---|---|"]
    for r in records:lines.append("| "+r["matiere_provisoire"]+" | "+r["type_provisoire"]+" | "+r["source"].replace("|","/")+" |")
    (out/"rapport.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
    print(f"Inventaire créé : {out/'inventaire.json'} ({len(records)} fichiers)")
if __name__=="__main__":main()
