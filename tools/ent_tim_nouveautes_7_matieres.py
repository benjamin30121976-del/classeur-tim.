#!/usr/bin/env python3
"""ENT Tim, collecte CIBLÉE des sept matières en lecture seule sous Termux.

Reprend la méthode en ligne V4.1 déjà validée, avec fenêtre de dates courte :
  1. l'agenda actuel de Tim sur l'API Skolengo ;
  2. le texte original des séances des sept matières ;
  3. les devoirs liés et annoncés dans la période ;
  4. les pièces ENT associées, en HTTP authentifié.

Réutilise les bibliothèques et l'authentification Termux V3.7 validées.
Un seul ZIP daté est produit dans Téléchargements ; les originaux ne sont pas altérés.
N'efface ni ne modifie les archives et les classeurs précédents.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import importlib.util
import json
import unicodedata
from zoneinfo import ZoneInfo
import os
import re
import sys
import tempfile
import zipfile
from pathlib import Path

HOME = Path.home()
DOWNLOAD = HOME / 'storage' / 'downloads'
ROOT = HOME / '.ent_tim_prive'
STATE = DOWNLOAD / 'ENT-Tim-7-matieres-derniere-collecte.json'
COLLECT_UNTIL_DAYS = 21
MAX_LOOKBACK_DAYS = 35
MAX_FILE_SIZE = 50 * 1024 * 1024
MAX_TOTAL_SIZE = 250 * 1024 * 1024
LESSON_INCLUDE = 'teachers,contents,contents.attachments,subject,toDoForTheLesson,toDoAfterTheLesson'
HOMEWORK_INCLUDE = ('subject,teacher,pedagogicContent,attachments,audio,'
                    'individualCorrectedWork,individualCorrectedWork.attachments,'
                    'commonCorrectedWork,commonCorrectedWork.attachments')


def import_script(path: Path, name: str):
    if not path.is_file():
        raise ValueError('Programme requis absent des Téléchargements : ' + path.name)
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise ValueError('Chargement impossible : ' + path.name)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


SUBJECT_LABELS = (
    ('espagnol', 'Espagnol'),
    ('mathematique', 'Mathématiques'), ('maths', 'Mathématiques'),
    ('physique', 'Physique-chimie'), ('chimie', 'Physique-chimie'),
    ('anglais', 'Anglais'),
    ('svt', 'SVT'), ('sciences de la vie', 'SVT'),
    ('histoire', 'Histoire-géographie'), ('geographie', 'Histoire-géographie'),
    ('francais', 'Français'),
)


def fold(text):
    return ''.join(x for x in unicodedata.normalize('NFKD', str(text or ''))
                   if not unicodedata.combining(x)).casefold()


def subject_label(raw):
    label = fold(raw)
    for key, value in SUBJECT_LABELS:
        if key in label:
            return value
    return ''


def agenda_subject(row):
    if not isinstance(row, dict):
        return ''
    subject = row.get('subject') or {}
    if isinstance(subject, dict):
        label = subject.get('label') or subject.get('name') or ''
    else:
        label = str(subject)
    return subject_label(label) or subject_label(row.get('title'))


def document_subject(doc):
    if not isinstance(doc, dict):
        return ''
    for item in doc.get('included') or []:
        if isinstance(item, dict) and item.get('type') == 'subject':
            result = subject_label((item.get('attributes') or {}).get('label'))
            if result:
                return result
    attrs = (doc.get('data') or {}).get('attributes') or {}
    value = attrs.get('subject') or {}
    if isinstance(value, dict):
        return subject_label(value.get('label')) or subject_label(attrs.get('title'))
    return subject_label(value) or subject_label(attrs.get('title'))


def lesson_ids_from_agenda(agenda, today, start, selected=''):
    ids, date_by_id = {}, {}
    for day in agenda:
        if not isinstance(day, dict):
            continue
        day_str = str(day.get('date') or '')[:10]
        try:
            day_date = dt.date.fromisoformat(day_str)
        except ValueError:
            continue
        if not start <= day_date <= today:
            continue
        for lesson in day.get('lessons') or []:
            subject = agenda_subject(lesson)
            if subject and (not selected or subject == selected) and lesson.get('id'):
                lid = str(lesson['id'])
                ids[lid] = subject
                date_by_id[lid] = day_str
    return ids, date_by_id


def agenda_homework_ids(agenda, selected=''):
    found = {}
    for day in agenda:
        if not isinstance(day, dict):
            continue
        for row in day.get('homeworkAssignments') or []:
            subject = agenda_subject(row)
            if subject and (not selected or selected == subject) and row.get('id'):
                found[str(row['id'])] = subject
    return found

def linked_homework_ids(lessons):
    out = set()
    for lesson in lessons:
        rel = (lesson.get('data') or {}).get('relationships') or {}
        for key in ('toDoForTheLesson', 'toDoAfterTheLesson'):
            value = ((rel.get(key) or {}).get('data') or [])
            if isinstance(value, dict):
                value = [value]
            for item in value:
                if isinstance(item, dict) and item.get('id'):
                    out.add(str(item['id']))
    return out


def attachment_references(lessons, homework):
    found = {}
    for typ, docs in [('cours', lessons), ('travail_associe', homework)]:
        for doc in docs:
            owner = str((doc.get('data') or {}).get('id') or '')
            for item in doc.get('included') or []:
                if not isinstance(item, dict) or item.get('type') != 'attachment':
                    continue
                a = item.get('attributes') or {}
                ident = str(item.get('id') or '')
                url = a.get('url')
                if not ident or not url:
                    continue
                ref = found.setdefault(ident, {
                    'id': ident,
                    'nom_ENT': str(a.get('name') or 'Document ' + ident),
                    'type_fichier': a.get('mimeType'),
                    'taille_annoncee': a.get('size'),
                    'url_ENT': url,
                    'rattache_a': [],
                })
                owner_ref = {'type': typ, 'id': owner}
                if owner_ref not in ref['rattache_a']:
                    ref['rattache_a'].append(owner_ref)
    return found


def text_html(raw):
    if not raw:
        return ''
    try:
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(str(raw), 'html.parser')
        for tag in soup(['script', 'style']):
            tag.decompose()
        return soup.get_text('\n', strip=True)
    except ImportError:
        return html.unescape(re.sub(r'<[^>]*>', ' ', str(raw))).strip()


def read_course_text(lesson):
    return '\n\n'.join(text_html((item.get('attributes') or {}).get('html'))
                      for item in lesson.get('included') or []
                      if isinstance(item, dict) and item.get('type') == 'lessonContent'
                      and (item.get('attributes') or {}).get('html')).strip()


def has_substantive_content(lesson):
    raw = read_course_text(lesson)
    # Une date seule comme « Miércoles 30/09 » n'est pas un cours.
    remainder = re.sub(r'(?i)\b(?:lunes|martes|mi[eé]rcoles|jueves|viernes|samedi|dimanche)\b', '', raw)
    remainder = re.sub(r'[\d\s\W_]+', '', remainder, flags=re.UNICODE)
    return bool(remainder)


def homework_from_live_agenda(agenda, homework):
    # Le détail de l'API contient parfois title/html=null, alors que l'agenda
    # LIVE contient le texte entier. Ne pas perdre ces consignes officielles.
    by_id = {}
    for day in agenda:
        for row in day.get('homeworkAssignments') or []:
            if isinstance(row, dict) and row.get('id'):
                by_id[str(row['id'])] = row
    enriched = []
    for row in homework:
        doc = dict(row)
        data = dict(row.get('data') or {})
        attrs = dict(data.get('attributes') or {})
        summary = by_id.get(str(data.get('id')))
        if summary:
            for k in ('title','html','dueDateTime','dueDate'):
                if not attrs.get(k) and summary.get(k):
                    attrs[k] = summary[k]
        data['attributes'] = attrs
        doc['data'] = data
        enriched.append(doc)
    return enriched


def format_txt(lessons, homework, dates, references, now):
    lessons = sorted(lessons, key=lambda item: (dates.get(str((item.get('data') or {}).get('id')), ''),str((item.get('data') or {}).get('id'))))
    lines = [
        'COURS ORIGINAUX ENT — ESPAGNOL LV2 — TIM 3e D',
        'Nouvelle interrogation en ligne le ' + now,
        'Ce fichier ne contient AUCUNE leçon BIS, aucun exercice fabriqué.',
        'Travaux associés inclus uniquement pour identifier les consignes et les fiches ENT.',
        '',
    ]
    hmap = {str((h.get('data') or {}).get('id')): h for h in homework}
    for lesson in lessons:
        lid = str((lesson.get('data') or {}).get('id'))
        date = dates.get(lid, '')
        lines.extend(['=' * 68,
                      'SÉANCE ENT : ' + date + ' | identifiant ' + lid,
                      'TITRE : ' + str(((lesson.get('data') or {}).get('attributes') or {}).get('title') or 'ESPAGNOL LV2'),
                      'CONTENU ORIGINAL DE LA SÉANCE :',
                      read_course_text(lesson) or '[Aucun texte de cours publié pour cette séance]',
                      ''])
        linked = linked_homework_ids([lesson])
        for hid in sorted(linked):
            hw = hmap.get(hid)
            if hw is None:
                lines.append('Travail ENT lié : ' + hid + ' — détail inaccessible')
                continue
            attrs = (hw.get('data') or {}).get('attributes') or {}
            lines.append('TRAVAIL ENT ASSOCIÉ (' + hid + ') :')
            pedagogic = [text_html((i.get('attributes') or {}).get('html'))
                         for i in hw.get('included') or []
                         if isinstance(i, dict) and i.get('type') in ('pedagogicContent', 'commonCorrectedWork')]
            lines.append('\n'.join(x for x in [attrs.get('title') or '',
                                                text_html(attrs.get('html')),
                                                *pedagogic] if x) or '[Texte complet conservé dans le JSON ENT]')
            associated = [r['nom_ENT'] for r in references.values()
                          if {'type': 'travail_associe', 'id': hid} in r['rattache_a']]
            if associated:
                lines.append('DOCUMENTS JOINTS : ' + ' ; '.join(associated))
            lines.append('')
    return '\n'.join(lines) + '\n'


def create_zip(path, writes):
    if path.is_symlink():
        raise ValueError('Fichier de sortie invalide : lien symbolique')
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    if tmp.is_symlink():
        raise ValueError('Fichier temporaire invalide : lien symbolique')
    try:
        with zipfile.ZipFile(tmp, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=7,
                             allowZip64=True) as z:
            for name, content in writes:
                if isinstance(content, Path):
                    z.write(content, arcname=name)
                elif isinstance(content, bytes):
                    z.writestr(name, content)
                elif isinstance(content, str):
                    z.writestr(name, content.encode('utf-8'))
                else:
                    z.writestr(name, json.dumps(content, ensure_ascii=False, indent=2).encode('utf-8'))
        tmp.replace(path)
    finally:
        if tmp.exists():
            tmp.unlink()



def agenda_live_raw_fallback(client, student, start, end):
    """Alternative en ligne, sans ancienne archive, si le lecteur agenda standard échoue.

    Utilise l'API JSON:API déjà authentifiée. Tolère des ressources liées
    absentes ou inhabituelles et ne conserve aucune réponse sensible sur disque.
    """
    def decode(doc):
        if not isinstance(doc, dict):
            raise TypeError('Réponse API agenda invalide')
        included = { (str(item.get('type')),str(item.get('id'))): item
                     for item in doc.get('included') or [] if isinstance(item,dict) }
        def flatten(item, visited=frozenset()):
            if not isinstance(item, dict):
                return {}
            key=(str(item.get('type')), str(item.get('id')))
            val={'id': item.get('id'), 'type': item.get('type')}
            val.update(item.get('attributes') or {} if isinstance(item.get('attributes'),dict) else {})
            if key in visited:
                return val
            for name, body in (item.get('relationships') or {}).items():
                rel=(body or {}).get('data') if isinstance(body,dict) else None
                if isinstance(rel,list):
                    val[name] = [flatten(included.get((str(x.get('type')),str(x.get('id'))),x), visited | {key})
                                 for x in rel if isinstance(x,dict)]
                elif isinstance(rel,dict):
                    val[name] = flatten(included.get((str(rel.get('type')),str(rel.get('id'))),rel),visited | {key})
                else:
                    val[name]=None
            return val
        rows=doc.get('data') or []
        if isinstance(rows,dict):
            rows=[rows]
        return [flatten(d) for d in rows if isinstance(d,dict)]
    out=[]
    begin=start
    while begin <= end:
        finish=min(begin + dt.timedelta(days=13),end)
        query={'filter[student.id]':student,'filter[date][GE]':begin.isoformat(),
               'filter[date][LE]':finish.isoformat(),
               'include':'lessons,lessons.subject,lessons.teachers,homeworkAssignments,homeworkAssignments.subject'}
        result=client._request('GET','/agendas',params=query)
        out.extend(decode(result))
        begin=finish + dt.timedelta(days=1)
    return out

def format_txt_all(lessons, homework, dates, collected_at):
    lines = ['COURS ET DEVOIRS ORIGINAUX ENT — TIM 3e D',
             'Collecte ciblée en ligne : ' + collected_at,
             'Pas de leçons BIS, pas de corrigés inventés.', '']
    for lesson in sorted(lessons, key=lambda x: (dates.get(str((x.get('data') or {}).get('id')), ''),
                                                  str((x.get('data') or {}).get('id')))):
        lid = str((lesson.get('data') or {}).get('id'))
        attrs = (lesson.get('data') or {}).get('attributes') or {}
        lines += ['='*50, 'DATE : ' + dates.get(lid, ''),
                  'MATIÈRE : ' + document_subject(lesson), 'ID ENT : ' + lid,
                  'TITRE : ' + str(attrs.get('title') or ''),
                  read_course_text(lesson) or '[Aucun texte de cours publié]', '']
    for hw in homework:
        attrs = (hw.get('data') or {}).get('attributes') or {}
        lines += ['='*50, 'DEVOIR : ' + document_subject(hw),
                  'ID ENT : ' + str((hw.get('data') or {}).get('id')),
                  'ÉCHÉANCE : ' + str(attrs.get('dueDateTime') or attrs.get('dueDate') or ''),
                  'TITRE : ' + str(attrs.get('title') or ''),
                  text_html(attrs.get('html') or '') or '[Consigne conservée en JSON ENT]', '']
    return '\n'.join(lines) + '\n'


def pick_start(today, explicit):
    if explicit:
        try:
            start = dt.date.fromisoformat(explicit)
        except ValueError:
            raise ValueError('Date --depuis invalide ; utiliser AAAA-MM-JJ')
    else:
        start = today-dt.timedelta(days=7)
        if STATE.is_file() and not STATE.is_symlink():
            try:
                data=json.loads(STATE.read_text(encoding='utf-8'))
                prior=dt.date.fromisoformat(str(data['lastSuccessfulDay']))
                if prior <= today:
                    start=max(today-dt.timedelta(days=MAX_LOOKBACK_DAYS),
                              min(prior-dt.timedelta(days=1), today-dt.timedelta(days=7)))
            except (ValueError,KeyError,TypeError, OSError):
                pass
    if start>today or (today-start).days>MAX_LOOKBACK_DAYS:
        raise ValueError('Période hors limite : au maximum 35 jours, sans date future')
    return start


def get_client_and_student():
    # Exactement le raccordement SSO prouvé dans V4.1, sans nouvelle méthode.
    v37=import_script(DOWNLOAD/'ent_tim_sso_entetes_v37.py','ent_t_v37_nouveautes')
    v39=import_script(DOWNLOAD/'ent_tim_pieces_jointes_v39.py','ent_t_v39_nouveautes')
    v38=import_script(DOWNLOAD/'ent_tim_pieces_jointes_v38.py','ent_t_v38_nouveautes')
    v31=v37.load_previous()
    v31.load_dependencies()
    Client, School, BirthdateRequired, _, _=v31.load_vendor()
    collector=v31.load_collector()
    school=collector.school_search()
    if school.get('emsCode')!='entmip' or 'desmons' not in fold(school.get('name', '')):
        raise ValueError('Collège Frédéric Desmons non confirmé : arrêt')
    client=None
    cached=ROOT/'session.json'
    if cached.is_file() and not cached.is_symlink():
        try:
            meta=collector.oidc_metadata(school)
            session=json.loads(cached.read_text(encoding='utf-8'))
            from skolengo_vendor.api import SkolengoTokens
            token=SkolengoTokens(access_token=session['access_token'],
                refresh_token=session.get('refresh_token'),id_token=session.get('id_token'),
                expires_at=float(session['expires_at']),token_endpoint=meta['token_endpoint'])
            candidate=Client(school['id'],school['emsCode'],token)
            if token.is_expired:
                candidate.refresh_access_token()
            if candidate.get_user_id():
                client=candidate
                print('Session Parent existante réutilisée ou renouvelée.',flush=True)
        except Exception:
            pass
    if client is None:
        print('Session à renouveler dans la procédure EduConnect V3.7.',flush=True)
        v37.patch_client(Client)
        v31.install_safe_sso_trace(Client)
        client=v31.login(Client,School,BirthdateRequired,school)
    collector.save_json(ROOT/'session.json',{
       'access_token':client.tokens.access_token,'id_token':client.tokens.id_token,
       'refresh_token':client.tokens.refresh_token,
       'expires_at':int(client.tokens.expires_at)})
    student=v31.get_tim_id(client)
    return client,student,school,v38,v39


def main(argv=None):
    ap=argparse.ArgumentParser(description='ENT Tim : nouveautés directes des sept matières ; lecture seule')
    ap.add_argument('--depuis',default='',help='date de début AAAA-MM-JJ ; sinon dernière collecte réussie - 1 jour')
    ap.add_argument('--matiere',default='',help='une matière parmi les sept ; sans option : toutes')
    args=ap.parse_args(argv)
    today=dt.datetime.now(ZoneInfo('Europe/Paris')).date()
    start=pick_start(today,args.depuis)
    selected=subject_label(args.matiere) if args.matiere else ''
    if args.matiere and not selected:
        raise ValueError('Matière inconnue : choisir une des sept matières')
    end=today+dt.timedelta(days=COLLECT_UNTIL_DAYS)
    print('=== ENT TIM — NOUVEAUTÉS CIBLÉES EN DIRECT ===',flush=True)
    print('Fenêtre séances :',start,'au',today,"; échéances : jusqu'au",end,flush=True)
    print('Matière :',selected or 'les sept',flush=True)
    client,student,school,v38,v39=get_client_and_student()
    try:
        agenda=client.get_agenda(student,start,end)
        if not isinstance(agenda,list):
            raise TypeError('Format agenda inattendu')
    except TypeError:
        agenda=agenda_live_raw_fallback(client,student,start,end)
    ids,dates=lesson_ids_from_agenda(agenda,today,start,selected)
    hw_ids=agenda_homework_ids(agenda,selected)
    print('Séances repérées :',len(ids),"; devoirs d'agenda :",len(hw_ids),flush=True)
    lessons,homework,failures=[],[],[]
    for ix,(lid,expected_subject) in enumerate(sorted(ids.items(),key=lambda x:(dates[x[0]],x[0])),1):
        try:
            doc=client._request('GET','/lessons/'+lid,
                                params={'filter[student.id]':student,'include':LESSON_INCLUDE})
            if document_subject(doc)==expected_subject:
                lessons.append(doc)
            else:
                failures.append({'type':'cours','id':lid,'raison':'matière différente ou non confirmée'})
        except Exception:
            failures.append({'type':'cours','id':lid,'raison':'détail inaccessible'})
        print('Cours :',ix,'/',len(ids),flush=True)
    for lesson in lessons:
        for hid in linked_homework_ids([lesson]):
            hw_ids.setdefault(hid,document_subject(lesson))
    for ix,(hid,expected_subject) in enumerate(sorted(hw_ids.items()),1):
        try:
            doc=client._request('GET','/homework-assignments/'+hid,
               params={'filter[student.id]':student,'include':HOMEWORK_INCLUDE})
            if document_subject(doc)==expected_subject:
                homework.append(doc)
            else:
                failures.append({'type':'devoir','id':hid,'raison':'matière différente ou non confirmée'})
        except Exception:
            failures.append({'type':'devoir','id':hid,'raison':'détail inaccessible'})
        print('Devoir :',ix,'/',len(hw_ids),flush=True)
    homework=homework_from_live_agenda(agenda,homework)
    refs=attachment_references(lessons,homework)
    v39.MAX_FILE=MAX_FILE_SIZE
    headers={'Authorization':'Bearer '+client.tokens.access_token,
             'X-Skolengo-Date-Format':'utc',
             'X-Skolengo-School-Id':str(school['id']),
             'X-Skolengo-Ems-Code':str(school['emsCode']),
             'Accept':'*/*','Accept-Language':'fr-FR,fr;q=0.9',
             'Referer':'https://frederic-desmons.mon-ent-occitanie.fr/',
             'User-Agent':v39.USER_AGENT}
    now=dt.datetime.now(ZoneInfo('Europe/Paris')).isoformat(timespec='seconds')
    stamp=dt.datetime.now(ZoneInfo('Europe/Paris')).strftime('%Y%m%d_%H%M%S')
    outfile=DOWNLOAD/('ENT-Tim-nouveautes-'+stamp+'.zip')
    with tempfile.TemporaryDirectory(prefix='ent-7-direct-',dir=ROOT) as td:
        temp=Path(td);binary=[];size=0
        for ix,(aid,info) in enumerate(sorted(refs.items()),1):
            stem=re.sub(r'[^a-zA-Z0-9_-]+','_',aid).strip('_')
            name=stem+'_'+v38.name_safe(info['nom_ENT'])
            dest=temp/name
            try:
                url=v38.check_url(info['url_ENT'])
                amount=v39.fetch_attachment(url,headers,dest)
                size+=amount
                if size>MAX_TOTAL_SIZE:
                    raise ValueError('Pièces jointes dépassant 250 Mo ; collecte interrompue')
                info['present']=True
                info['nom_dans_archive']='pieces_ENT/'+name
                if amount>4*1024*1024:
                    failures.append({'type':'piece_jointe','id':aid,
                                      'raison':'fichier supérieur à la limite d’import Parent (4 Mo)'})
                binary.append((info['nom_dans_archive'],dest))
                print('Pièce :',ix,'/',len(refs),flush=True)
            except ValueError:
                raise
            except Exception as exc:
                info['present']=False
                info['nom_dans_archive']=None
                failures.append({'type':'piece_jointe','id':aid,
                                 'raison':'HTTP '+str(exc.code) if hasattr(exc,'code') else type(exc).__name__})
                if dest.exists():dest.unlink()
        meta={'source':'Skolengo API direct V4.1 adaptée, aucune archive historique lue',
              'date_collecte':now,'depuis':start.isoformat(),'jusqua':today.isoformat(),
              'horizon_devoirs':end.isoformat(),
              'matiere':selected or 'sept matières',
              'cours_ent':len(lessons),'cours_avec_texte':sum(has_substantive_content(x) for x in lessons),
              'devoirs_ent':len(homework),'pieces_referencees':len(refs),
              'pieces_obtenues':len(binary),'erreurs':failures,
              'non_verifie_android':True}
        clean_index=[{k:v for k,v in info.items() if k!='url_ENT'} for info in refs.values()]
        package=[('LIRE_D_ABORD.txt','Collecte ciblée des sept matières, en lecture seule.\n'
                  'Ne contient aucun corrigé ou exercice inventé.\n'
                  'Joindre ce ZIP à ChatGPT pour comparaison avec le classeur.\n'),
                 ('cours_toutes_matieres_ENT_originaux.json',lessons),
                 ('travaux_associes_ENT_originaux.json',homework),
                 ('dates_seances.json',dates),
                 ('index_pieces_ENT.json',clean_index),
                 ('rapport_collecte_en_ligne.json',meta),
                 ('cours_et_devoirs_originaux.txt',format_txt_all(lessons,homework,dates,now)),*binary]
        create_zip(outfile,package)
    # Ne pas avancer le curseur après une collecte incomplète. Les anciennes
    # archives restent intactes ; chaque ZIP a son propre nom daté.
    if not failures:
        create_state={'lastSuccessfulDay':today.isoformat(),
                      'source':'ENT en direct','matiere':selected or 'toutes'}
        # Une collecte filtrée ne doit pas faire avancer le curseur commun des sept matières.
        if not selected:
            tmp=STATE.with_suffix('.json.tmp')
            tmp.write_text(json.dumps(create_state,ensure_ascii=False)+'\n',encoding='utf-8')
            tmp.replace(STATE)
    print('\nARCHIVE :',outfile,flush=True)
    print('Cours :',len(lessons),'Devoirs :',len(homework),'Pièces :',len(binary),'/',len(refs),flush=True)
    if not lessons and not homework:
        print('Aucune nouvelle entrée dans la période ; le ZIP ne prouve aucun nouveau cours.',flush=True)
    if failures:
        print('ATTENTION : collecte partielle ;',len(failures),'erreur(s). Curseur non avancé.',flush=True)
        return 1
    print('Collecte terminée. Envoie ce ZIP à ChatGPT.',flush=True)
    return 0


if __name__=='__main__':
    try:
        sys.exit(main())
    except (KeyboardInterrupt,EOFError):
        print('Interrompu.',flush=True);sys.exit(130)
    except ValueError as exc:
        print('BLOCAGE :',str(exc),flush=True);sys.exit(2)
    except Exception as exc:
        import traceback
        last=traceback.extract_tb(exc.__traceback__)[-1]
        print('BLOCAGE TECHNIQUE :',type(exc).__name__,'/ étape',last.name,'/ ligne',last.lineno,flush=True)
        sys.exit(2)