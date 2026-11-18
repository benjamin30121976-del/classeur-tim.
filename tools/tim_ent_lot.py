#!/usr/bin/env python3
"""Préparation hors-ligne d'un lot ENT Tim : lecture seule, sans Firebase.

collect: deux ZIP Termux -> inventaire différentiel, échéances, plan pédagogique.
validate: pack pédagogique rédigé -> contrôle strict de la qualité technique.
Aucune action sur GitHub, Cloudflare, Firestore, compte Parent ou compte Tim.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import json
import re
import sys
import zipfile
from collections import defaultdict
from pathlib import Path, PurePosixPath
from zoneinfo import ZoneInfo

MAX_ENTRIES = 1500
MAX_TOTAL = 300 * 1024 * 1024
MAX_JSON = 20 * 1024 * 1024
PRIVATE_NAMES = re.compile(r'(^|/)(session(?:\.json)?|.*(?:private[-_]?key|id_rsa|password|credentials|secret|\.pem))($|/|\.)', re.I)
PRIVATE_KEYS = {'access_token','refresh_token','id_token','client_secret','password','mot_de_passe','private_key','authorization'}
SUBJECTS = {'espagnol':'Espagnol', 'math':'Mathématiques', 'physique':'Physique-chimie',
            'chimie':'Physique-chimie','svt':'SVT','science de la vie':'SVT',
            'anglais':'Anglais','histoire':'Histoire-géographie','géographie':'Histoire-géographie',
            'fran':'Français'}
SUPPORTED = {'Espagnol','Mathématiques','Physique-chimie','Anglais','SVT','Histoire-géographie','Français'}


def dump(path: Path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True)+'\n', encoding='utf-8')


def norm_date(value):
    if not value: return ''
    t = str(value)
    m = re.search(r'(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})', t)
    if m:
        try: return dt.date(*map(int,m.groups())).isoformat()
        except ValueError: return ''
    m = re.search(r'\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b', t)
    if m:
        try: return dt.date(int(m[3]),int(m[2]),int(m[1])).isoformat()
        except ValueError: return ''
    return ''


def text_html(value):
    if value is None: return ''
    value = re.sub(r'(?is)<(?:script|style)\b[^>]*>.*?</(?:script|style)>', '', str(value))
    value = re.sub(r'(?i)</(?:p|div|li|h[1-6]|br|tr)>', '\n', value)
    return re.sub(r'\n{3,}', '\n\n', html.unescape(re.sub(r'<[^>]+>', ' ', value))).strip()


def has_secret(obj):
    if isinstance(obj,dict):
        return any(k.casefold() in PRIVATE_KEYS or has_secret(v) for k,v in obj.items())
    if isinstance(obj,list): return any(has_secret(x) for x in obj)
    return False


def unpack(zips):
    files = {}
    for src in zips:
        if not zipfile.is_zipfile(src): raise ValueError(f'Archive invalide : {src.name}')
        with zipfile.ZipFile(src) as z:
            if len(z.infolist()) > MAX_ENTRIES: raise ValueError('Trop de fichiers dans le ZIP')
            total = 0
            for info in z.infolist():
                name=info.filename.replace('\\','/')
                p=PurePosixPath(name)
                if name.startswith('/') or '..' in p.parts or PRIVATE_NAMES.search(name):
                    raise ValueError('Archive avec chemin dangereux ou secret : import refusé')
                if info.flag_bits & 1: raise ValueError('Archive chiffrée : lecture refusée')
                if info.is_dir(): continue
                total += info.file_size
                if total > MAX_TOTAL: raise ValueError('Archive trop volumineuse après décompression')
                if name.lower().endswith('.json'):
                    if info.file_size>MAX_JSON: raise ValueError('Fichier JSON trop volumineux')
                    data = json.loads(z.read(info).decode('utf-8-sig'))
                    if has_secret(data): raise ValueError('Un JSON contient des secrets ; import refusé')
                    # Deux ZIP peuvent contenir le même index ; ne pas le traiter deux fois.
                    key=p.name
                    if key in files and files[key]!=data: raise ValueError('Deux fichiers JSON homonymes différents : '+key)
                    files[key]=data
    return files



def scan_attachment_files(zips):
    """Indexe les pièces non-JSON sans exporter d'octets privés."""
    files=[]
    for src in zips:
        with zipfile.ZipFile(src) as z:
            for info in z.infolist():
                if not info.is_dir() and not info.filename.lower().endswith('.json'):
                    files.append({'name':info.filename.replace('\\\\','/'),'size':info.file_size})
    return files


def inspect_source_gaps(items, attachment_files):
    """Signale les trous bloquants au lieu de les considérer comme intégrés."""
    issues=[]
    for item in items:
        ent_id=item['entId']
        if item['subject'] not in SUPPORTED:
            issues.append({'type':'matiere_inconnue','entId':ent_id,'message':'Matière ENT non reconnue'})
        if item['kind']=='homework' and not item['due']:
            issues.append({'type':'echeance_absente','entId':ent_id,
                           'message':'Devoir sans échéance : ne pas l’omettre du bilan'})
        if not item['sourceIsComplete'] and not item['attachments']:
            issues.append({'type':'source_incomplete','entId':ent_id,
                           'message':'Aucun texte ENT ni pièce jointe liée : ne rien inventer'})
        for ref in item['attachments']:
            rid=str(ref.get('id') or '')
            source_name=str(ref.get('name') or '')
            matches=[f for f in attachment_files
                     if (rid and (rid in f['name'] or rid.replace('~','_') in f['name'])) or
                     (source_name and f['name'].split('/')[-1]==source_name)]
            if len(matches)!=1:
                issues.append({'type':'piece_jointe_non_verifiee','entId':ent_id,
                               'attachmentId':rid,'message':
                               'Pièce originale absente ou correspondance ambiguë ; vérifier le ZIP'})
    return issues


def raw_doc(item):
    if not isinstance(item,dict): return None
    data=item.get('data')
    if isinstance(data,dict):
        attrs=data.get('attributes') or {}
        return {'id':str(data.get('id') or ''),'attributes':attrs,'included':item.get('included') or [],
                'relationships':data.get('relationships') or {},'raw':item}
    attrs=item.get('attributes') or item
    return {'id':str(item.get('id') or ''),'attributes':attrs,'included':item.get('included') or [],
            'relationships':item.get('relationships') or {},'raw':item}


def subject(item, fallback=''):
    attrs=item['attributes']; candidates=[str(attrs.get('subject') or ''),str(attrs.get('title') or ''),fallback]
    if isinstance(attrs.get('subject'),dict):candidates.insert(0,str(attrs['subject'].get('label') or ''))
    for child in item['included']:
        if isinstance(child,dict) and child.get('type')=='subject':
            candidates.insert(0,str((child.get('attributes') or {}).get('label') or ''))
    for candidate in candidates:
        for key,label in SUBJECTS.items():
            if key in candidate.casefold(): return label
    return 'Matière non identifiée'


def full_text(item):
    a=item['attributes']; fragments=[text_html(a.get('html') or a.get('content') or a.get('description'))]
    for child in item['included']:
        if isinstance(child,dict) and child.get('type') in ('lessonContent','pedagogicContent','commonCorrectedWork'):
            fragments.append(text_html((child.get('attributes') or {}).get('html')))
    return '\n\n'.join(x for x in fragments if x)


def resources(docs, kind, dates, fallback):
    result=[]
    for d in docs:
        item=raw_doc(d)
        if not item or not item['id']:continue
        a=item['attributes']; ident=item['id']
        if kind=='lesson':
            day=norm_date(dates.get(ident) or a.get('date') or a.get('dateTime') or a.get('day'))
            due=''
        else:
            due=norm_date(a.get('dueDateTime') or a.get('dueDate') or a.get('due') or a.get('homeworkDue'))
            day=norm_date(a.get('date') or a.get('createdAt') or a.get('publishedAt'))
        title=str(a.get('title') or a.get('name') or ('Cours ENT' if kind=='lesson' else 'Devoir ENT'))
        orig=full_text(item)
        references=[{'id':str(x.get('id')),'name':str((x.get('attributes') or {}).get('name') or '')}
                    for x in item['included'] if isinstance(x,dict) and x.get('type')=='attachment' and x.get('id')]
        normalized={'kind':kind,'entId':ident,'subject':subject(item,fallback), 'date':day,
                    'due':due,'title':title,'original':orig,'attachments':references,
                    'sourceIsComplete':bool(orig)}
        normalized['fingerprint']=hashlib.sha256(json.dumps(item['raw'],ensure_ascii=False,sort_keys=True).encode()).hexdigest()
        result.append(normalized)
    return result


def find_docs(files):
    lessons=[]; hw=[]; dates={}; reports=[]; attachment_index=[]
    for name,value in files.items():
        low=name.casefold()
        if low in ('dates_seances.json','dates_cours.json') and isinstance(value,dict):
            dates.update({str(k):str(v) for k,v in value.items()})
        elif low.startswith('rapport_collecte') and isinstance(value,dict):reports.append(value)
        elif 'index_fiches' in low or 'index_pieces' in low:
            if isinstance(value,list): attachment_index+=value
        elif ('cours' in low or 'lessons' in low or 'seances' in low) and isinstance(value,list):lessons+=value
        elif ('travaux' in low or 'devoir' in low or 'homework' in low) and isinstance(value,list):hw+=value
        elif isinstance(value,dict):
            for k in ('cours','lessons','seances'):
                if isinstance(value.get(k),list):lessons+=value[k]
            for k in ('devoirs','homework','travaux'):
                if isinstance(value.get(k),list):hw+=value[k]
    return lessons,hw,dates,reports,attachment_index


def uniq(items):
    result={}
    for item in items:
        key=item['kind']+':'+item['entId']
        if key in result and item['fingerprint']!=result[key]['fingerprint']:
            raise ValueError('Deux versions contradictoires du même identifiant ENT : '+key)
        result[key]=item
    return sorted(result.values(),key=lambda r:(r['date'],r['due'],r['subject'],r['entId']))


def exercise_id_for_homework(ent_id, due, series=1):
    """Identifiant stable : un devoir revient dans les collectes sans recréer son bonus."""
    digest=hashlib.sha256((str(ent_id)+'|'+str(due)+'|'+str(series)).encode()).hexdigest()[:18]
    return 'BDENT_'+digest


def homework_preparation_tasks(homework, asof):
    """Une préparation de 10 questions minimum par devoir futur, sans inventer de contenu."""
    tomorrow=(asof+dt.timedelta(days=1)).isoformat()
    tasks=[]
    for x in homework:
        if x.get('kind')!='homework' or not x.get('due') or x['due']<tomorrow:
            continue
        delta=(dt.date.fromisoformat(x['due'])-asof).days
        is_exam=bool(re.search(r'contr[oô]le|[eé]valu|interro|brevet|dict[eé]e',x['title']+' '+x['original'],re.I))
        # Le lendemain utilise 1 à 3 séries selon les devoirs du jour ;
        # pour les échéances à J+2 et au-delà, une série obligatoire par devoir,
        # une deuxième conseillée si contrôle (sans la déclarer créée).
        target=1  # minimum une série pour chaque devoir, y compris à J+2/J+7
        recommended=2 if is_exam else target
        tasks.append({'entId':x['entId'],'subject':x['subject'],'due':x['due'],
                      'daysUntil':delta,'area':'devoirs-a-venir' if delta>=2 else 'devoirs-demain',
                      'title':x['title'],'originalAvailable':x['sourceIsComplete'],
                      'requiredSeries':target,'suggestedSeries':recommended,
                      'exerciseIds':[exercise_id_for_homework(x['entId'],x['due'],i+1)
                                     for i in range(recommended)],
                      'questionCountPerSeries':10,'linkedHomework':[x['entId']],
                      'homeworkDue':x['due'],'homeworkBonus':True,'xp':'training',
                      'status':'à rédiger et vérifier — jamais à annoncer prêt avant contrôle'})
    return tasks


def collect(args):
    zip_paths=[Path(x) for x in args.zips]
    files=unpack(zip_paths); lessons,hw,dates,reports,attachment_index=find_docs(files)
    if not lessons and not hw: raise ValueError('Aucun cours ni devoir ENT reconnu dans les ZIP. Ne rien inventer.')
    items=uniq(resources(lessons,'lesson',dates,args.subject)+resources(hw,'homework',dates,args.subject))
    source_issues=inspect_source_gaps(items,scan_attachment_files(zip_paths))
    previous={}
    if args.previous:
        state=json.loads(Path(args.previous).read_text(encoding='utf-8'))
        previous=state.get('fingerprints') or {}
        if not isinstance(previous,dict):raise ValueError('État antérieur invalide')
    states={}
    for x in items:
        k=x['kind']+':'+x['entId']
        states[k]='inconnu (première comparaison)' if not args.previous else ('nouveau' if k not in previous else 'inchangé' if previous[k]==x['fingerprint'] else 'modifié')
        x['status']=states[k]
    current={**previous,**{x['kind']+':'+x['entId']:x['fingerprint'] for x in items}}
    output=Path(args.out);output.mkdir(parents=True,exist_ok=True)
    asof=dt.date.fromisoformat(args.date) if args.date else dt.datetime.now(ZoneInfo('Europe/Paris')).date()
    tomorrow=(asof+dt.timedelta(days=1)).isoformat()
    due_tomorrow=[x for x in items if x['kind']=='homework' and x['due']==tomorrow]
    later=[x for x in items if x['kind']=='homework' and x['due']>tomorrow]
    due_today=[x for x in items if x['kind']=='homework' and x['due']==asof.isoformat()]
    overdue=[x for x in items if x['kind']=='homework' and x['due'] and x['due']<asof.isoformat()]
    unplanned=[x for x in items if x['kind']=='homework' and not x['due']]
    requires_pdf_reading=[{'entId':x['entId'],'subject':x['subject'],'attachmentIds':[a['id'] for a in x['attachments']]}
                          for x in items if x['kind']=='lesson' and not x['sourceIsComplete'] and x['attachments']]
    future_tasks=homework_preparation_tasks(items,asof)
    upcoming=[x for x in future_tasks if x['area']=='devoirs-a-venir']
    lesson_tasks=[{'entId':x['entId'],'subject':x['subject'],'date':x['date'],
                   'originalAvailable':x['sourceIsComplete'],
                   'actions':['conserver ENT original','BIS avec exemple','Je n’ai pas compris','exercice de 10 questions avec correction']
                   if x['sourceIsComplete'] else ['indiquer cours ENT sans texte','ne rien inventer']}
                  for x in items if x['kind']=='lesson' and x['status']!='inchangé']
    grouped=defaultdict(list)
    for x in due_tomorrow:grouped[x['subject']].append(x)
    bonus_plan=[]
    for mat,assignments in sorted(grouped.items()):
        count=min(3,max(1,len(assignments)+int(any(re.search(r'contr[oô]le|[eé]valu|interro|brevet',i['title'],re.I) for i in assignments))))
        bonus_plan.append({'subject':mat,'proposedSeries':count,'questionCountPerSeries':10,
                           'homeworkIds':[a['entId'] for a in assignments],'homeworkBonus':True,
                           'xp':'7-10:1 / 5-6:0.5 / 0-4:0, sans plafond'})
    plan={'date':asof.isoformat(),'tomorrow':tomorrow,'lessonsToPrepare':lesson_tasks,
          'dueTomorrow':due_tomorrow,'dueLater':later,'bonusSuggestions':bonus_plan,
          'sourceIssues':source_issues,'sourceReady':len(source_issues)==0 and not requires_pdf_reading,
          'sourceReadingRequired':requires_pdf_reading,
          'dueToday':due_today,'overdueHomework':overdue,'homeworkWithoutDue':unplanned,
          'homeworkExercisePreparations':future_tasks,
          'upcomingHomeworkExercisePreparations':upcoming,
          'futureHomeworkSeriesRequired':sum(x['requiredSeries'] for x in upcoming),
          'dailyTrainingSuggested':min(5,max(2,len(grouped)+len(lesson_tasks))) if (grouped or lesson_tasks) else 0,
          'dailyChallenges':{'weekday':3,'questionsEach':10,'engine':'missions-v18 + getMixedChallengePlan (existant)',
                             'action':'contrôler le mélange ; préserver missions déjà attribuées'},
          'weekendChallenges':{'saturday':20,'sunday':20,'action':'préparer en avance ; conserver les identifiants et tentatives'},
          'qualityGate':'Toutes les réponses, explications et liaisons doivent être contrôlées avant toute publication.',
          'publication':'INTERDITE par ce script ; seule autorisation Parent via système existant'}
    dump(output/'ent_prive_lot.json',{'asOf':asof.isoformat(),'items':items,'reports':reports,'attachmentIndex':attachment_index})
    dump(output/'plan_pedagogique.json',plan)
    dump(output/'etat_candidat_non_confirme.json',{'fingerprints':current})
    status=defaultdict(int)
    for s in states.values():status[s]+=1
    lines=['# Bilan de préparation ENT — '+asof.isoformat(),'',
           'Statut : **inventaire et préparation seulement, aucune publication**','',
           f'Cours ENT détectés : {sum(x["kind"]=="lesson" for x in items)}',
           f'Devoirs détectés : {sum(x["kind"]=="homework" for x in items)}',
           'États : '+', '.join(f'{k} {v}' for k,v in status.items()),
           f'Devoirs pour demain ({tomorrow}) : {len(due_tomorrow)}',
           f'Devoirs à venir : {len(later)}',
           f'Devoirs du jour (sans preuve de réalisation) : {len(due_today)}',
           f'Devoirs à échéance passée (ne pas cocher comme faits) : {len(overdue)}',
           f'Devoirs sans échéance : {len(unplanned)}',
           f'Leçons avec cours uniquement en pièces à lire : {len(requires_pdf_reading)}',
           f'Éléments ENT manquants/à vérifier : {len(source_issues)}',
           f'Exercices dédiés aux devoirs à venir à construire/vérifier : {sum(x["requiredSeries"] for x in upcoming)}',
           f'Bonus proposés : {sum(x["proposedSeries"] for x in bonus_plan)}',
           f'Entraînements quotidiens proposés : {plan["dailyTrainingSuggested"]}',
           'Défis du jour : générateur existant à vérifier, non publiés par ce script.',
           'Défis du samedi et dimanche : 20 questions chacun à contrôler sur le système existant.',
           '', '**Aucun contenu pédagogique n’a été inventé.** Les fiches à produire figurent dans le plan.',
           'IMPORTANT : toute source manquante ou pièce non vérifiée bloque le feu vert final.']
    (output/'bilan_preparation.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('\n'.join(lines))


def corrected_ten_question_bonus(ex):
    if not isinstance(ex,dict) or ex.get('homeworkBonus') is not True:
        return False
    questions=ex.get('questions') or []
    if len(questions)!=10: return False
    for q in questions:
        if not isinstance(q,dict) or not str(q.get('q') or '').strip() or len(str(q.get('why') or '').strip())<30:
            return False
        if q.get('type')=='text' and not str(q.get('right') or '').strip(): return False
        if q.get('type')=='mc':
            opts=q.get('options') or []
            if len(opts)!=4 or len({str(z).strip().casefold() for z in opts})!=4 or not isinstance(q.get('right'),int) or not 0<=q['right']<=3:
                return False
        elif q.get('type')!='text': return False
    return True


def validate_homework_coverage(plan, exercises, existing=()):
    """Refuse un cycle incomplet : échéance, liaison, questions et explications."""
    requirements=plan.get('homeworkExercisePreparations',[])
    available=[ex for ex in list(exercises)+list(existing) if corrected_ten_question_bonus(ex)]
    issues=[]
    for task in requirements:
        ident=str(task.get('entId') or '')
        due=str(task.get('due') or '')
        subject=task.get('subject')
        matched=[x for x in available if ident in [str(i) for i in (x.get('linkedHomework') or [])]
                 and x.get('homeworkDue')==due and x.get('subject')==subject]
        required=int(task.get('requiredSeries') or 1)
        if len({x.get('id') for x in matched}) < required:
            issues.append(f'{ident} pour le {due} ({subject}) : seulement {len(matched)}/{required} '
                          'série(s) corrigée(s), devoir non prêt')
    # Demain : respecter aussi la charge validée de 1 à 3 bonus par matière.
    tomorrow=plan.get('tomorrow')
    for target in plan.get('bonusSuggestions',[]):
        subject=target.get('subject')
        ids={str(i) for i in target.get('homeworkIds',[])}
        total={ex.get('id') for ex in available
               if ex.get('subject')==subject and ex.get('homeworkDue')==tomorrow and
               ids.intersection(str(i) for i in (ex.get('linkedHomework') or []))}
        expected=int(target.get('proposedSeries') or 0)
        if len(total)<expected:
            issues.append(f'Bonus pour demain ({subject}) : seulement {len(total)}/{expected} '
                          'série(s) corrigée(s), lot non prêt')
    return issues


def validate(args):
    obj=json.loads(Path(args.pack).read_text(encoding='utf-8'))
    lessons=obj.get('lessons') or []; exercises=obj.get('exercises') or []
    if not lessons and not exercises:raise ValueError('Pack vide : aucune leçon ni exercice')
    issues=[]; ids=set(); lesson_ids={str(l.get('id')) for l in lessons}
    for t,items in [('leçon',lessons),('exercice',exercises)]:
        for v in items:
            ident=v.get('id')
            if not isinstance(ident,str) or not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{1,35}',ident):
                issues.append(f'{t}: identifiant invalide');continue
            if ident in ids:issues.append(f'{ident}: identifiant dupliqué')
            ids.add(ident)
            if not isinstance(v.get('title'),str) or not v['title'].strip():issues.append(f'{ident}: titre absent')
            if v.get('subject') not in SUPPORTED:issues.append(f'{ident}: matière non reconnue')
    for l in lessons:
        ident=l.get('id','?')
        if not l.get('entId'):issues.append(f'{ident}: identifiant ENT d’origine absent')
        if not l.get('blocks') or not isinstance(l.get('blocks'),list):issues.append(f'{ident}: BIS en blocs absente')
        if not str(l.get('help','')).strip():issues.append(f'{ident}: aide Je n’ai pas compris absente')
        if not l.get('examples'):issues.append(f'{ident}: aucun exemple guidé')
    for ex in exercises:
        ident=ex.get('id','?');kind=ex.get('kind')
        if kind not in ('training','homework-bonus'):issues.append(f'{ident}: type inédit/non pris en charge')
        if not ex.get('lesson'):issues.append(f'{ident}: leçon associée absente')
        questions=ex.get('questions')
        if not isinstance(questions,list) or len(questions)!=10:
            issues.append(f'{ident}: dix questions obligatoires');continue
        if kind=='homework-bonus' and (ex.get('homeworkBonus') is not True or not ex.get('linkedHomework') or not norm_date(ex.get('homeworkDue'))):
            issues.append(f'{ident}: bonus devoirs sans liaison ENT, échéance ou marqueur XP correct')
        for i,q in enumerate(questions,1):
            prefix=f'{ident} Q{i}'
            if not str(q.get('q','')).strip():issues.append(prefix+': énoncé absent')
            if len(str(q.get('why','')).strip())<30:issues.append(prefix+': correction insuffisamment expliquée')
            if q.get('type')=='mc':
                opts=q.get('options') or []
                if len(opts)!=4 or len({re.sub(r'\s+',' ',str(x)).casefold().strip() for x in opts})!=4:
                    issues.append(prefix+': quatre choix distincts obligatoires')
                if not isinstance(q.get('right'),int) or not 0<=q['right']<=3:
                    issues.append(prefix+': réponse correcte manquante')
            elif q.get('type')=='text':
                if not q.get('right'):issues.append(prefix+': réponse écrite attendue dans right absente')
            else:issues.append(prefix+': format non reconnu')
    if getattr(args,'plan',None):
        plan=json.loads(Path(args.plan).read_text(encoding='utf-8'))
        for issue in plan.get('sourceIssues',[]):
            issues.append('Source ENT non résolue '+str(issue.get('entId'))+': '+str(issue.get('message')))
        if plan.get('sourceReadingRequired'):
            reviewed={}
            if getattr(args,'reviewed_sources',None):
                reviewed=json.loads(Path(args.reviewed_sources).read_text(encoding='utf-8'))
            for item in plan['sourceReadingRequired']:
                evidence=reviewed.get(str(item['entId'])) if isinstance(reviewed,dict) else None
                if not isinstance(evidence,dict) or not str(evidence.get('description') or '').strip() or not evidence.get('attachmentIds'):
                    issues.append('Cours ENT '+str(item['entId'])+
                                  ' : original PDF à lire et certifier avant leçon BIS')
        required_lessons=[t for t in plan.get('lessonsToPrepare',[]) if t.get('originalAvailable')]
        for task in required_lessons:
            candidates=[l for l in lessons if str(l.get('entId'))==str(task.get('entId')) and
                        l.get('subject')==task.get('subject')]
            if not candidates:
                issues.append('Leçon BIS absente pour cours ENT '+str(task.get('entId')))
                continue
            if any(l.get('timEntBatch') is True for l in candidates):
                ent=[l for l in candidates if l.get('kind')=='ent']
                bis=[l for l in candidates if l.get('kind')=='bis']
                if not ent or not bis:
                    issues.append('Cours ENT et BIS distincts obligatoires pour '+str(task.get('entId')))
                eligible={l.get('id') for l in bis}
            else:
                eligible={l.get('id') for l in candidates}
            if not any(ex.get('kind')=='training' and ex.get('lesson') in eligible and
                       ex.get('subject')==task.get('subject') and
                       len(ex.get('questions') or [])==10 for ex in exercises):
                issues.append('Entraînement de leçon absent pour '+str(task.get('entId')))
        existing=[]
        if getattr(args,'existing',None):
            prev=json.loads(Path(args.existing).read_text(encoding='utf-8'))
            existing=prev.get('exercises') or []
        issues.extend(validate_homework_coverage(plan,exercises,existing))
    if issues:
        print('VALIDATION REFUSÉE : '+str(len(issues))+' problème(s):\n'+'\n'.join('- '+x for x in issues[:80]))
        return 1
    print(f'VALIDATION TECHNIQUE RÉUSSIE : {len(lessons)} leçon(s), {len(exercises)} exercice(s) de 10 questions, corrections présentes.')
    if getattr(args,"out",None):
        # Le format exporté cible l'import Parent déjà présent dans app.js/boot.js.
        # Aucune donnée n'est envoyée à Firebase par ce script.
        published=[]
        for ex in exercises:
            e=dict(ex)
            if e['kind']=='homework-bonus':
                e.pop('kind',None)
                e['category']='bonus'
                e['homeworkBonus']=True
            else:
                e['kind']='training'
                e['category']='training'
                e.pop('homeworkBonus',None)
            published.append(e)
        output={'lessons':[], 'exercises':published}
        for l in lessons:
            v=dict(l)
            v.setdefault('kind','bis');v.setdefault('category','bis')
            if isinstance(v['help'],str):
                v['help']={'simple':v['help'],'steps':[],'example':str(v['examples'][0])}
            v.setdefault('chapter',v['title'])
            output['lessons'].append(v)
        if len(output['lessons'])+len(output['exercises'])>30:
            raise ValueError('Lot >30 contenus : découper pour respecter le moteur Parent')
        dump(Path(args.out),output)
        print('Lot au format import Parent créé (NON PUBLIÉ) : '+str(args.out))
    print('Ne prouve PAS exactitude pédagogique, publication, XP serveur, ni vue Parent/Tim. Aucune donnée en ligne écrite.')
    return 0



def assemble(args):
    """Prépare un seul ZIP privé importable par le pont Parent existant.

    Ne publie rien. Les leçons BIS et réponses doivent avoir été rédigées,
    vérifiées et validées à partir des originaux avant cette étape.
    """
    from types import SimpleNamespace
    plan=json.loads(Path(args.plan).read_text(encoding='utf-8'))
    inventory=json.loads(Path(args.inventory).read_text(encoding='utf-8'))
    pack=json.loads(Path(args.pack).read_text(encoding='utf-8'))
    evidence=json.loads(Path(args.reviewed_sources).read_text(encoding='utf-8')) if args.reviewed_sources else {}
    problems=list(plan.get('sourceIssues') or [])
    for source in plan.get('sourceReadingRequired') or []:
        proof=evidence.get(str(source['entId'])) if isinstance(evidence,dict) else None
        if not isinstance(proof,dict) or not proof.get('attachmentIds') or not str(proof.get('description') or '').strip():
            problems.append({'entId':source['entId'],'message':'PDF officiel non lu/confirmé'})
    if problems:
        raise ValueError('Impossible de créer un lot : '+str(len(problems))+' source(s) ENT non résolue(s)')
    result=validate(SimpleNamespace(pack=args.pack,plan=args.plan,existing=args.existing,
                                    reviewed_sources=args.reviewed_sources,out=None))
    if result!=0:raise ValueError('Lot pédagogique non validé. Aucun ZIP d’import produit.')
    maps=json.loads(Path(args.mapping).read_text(encoding='utf-8')) if args.mapping else {}
    targets=maps.get('sourceTargets') or {}
    attachment_sources=maps.get('attachmentSources') or {}
    if not isinstance(targets,dict) or not isinstance(attachment_sources,dict):
        raise ValueError('Table des rattachements ENT invalide')
    lessons=pack.get('lessons') or []
    exercises=pack.get('exercises') or []
    represented={str(l.get('entId')) for l in lessons if l.get('entId')}
    work={str(x['entId']):x for x in
          plan.get('dueToday',[])+plan.get('dueTomorrow',[])+plan.get('dueLater',[])}
    selected={*represented,*work,*targets}
    rows=[x for x in inventory.get('items',[]) if str(x.get('entId')) in selected]
    if not rows:raise ValueError('Aucun cours ou devoir ENT lié au lot')
    for l in lessons:
        if l.get('timEntBatch') is not True or l.get('kind') not in ('ent','bis'):
            raise ValueError('Leçon sans marqueur ENT ou sans type ENT/BIS : '+str(l.get('id')))
        if l.get('kind')=='ent':
            original=next((x for x in rows if x['kind']=='lesson' and x['entId']==l.get('entId')),None)
            if original and original.get('original'):
                body='\n'.join(str(b.get('body') or '') for b in (l.get('blocks') or []))
                if original['original'].strip() not in body:
                    raise ValueError('Texte original ENT non recopié intégralement : '+original['entId'])
    expected_reviews=int(plan.get('dailyTrainingSuggested') or 0)
    got_reviews=len([x for x in exercises if x.get('kind')=='training'
                     and x.get('practiceRole')=='daily-review' and
                     len(x.get('questions') or [])==10])
    if got_reviews<expected_reviews:
        raise ValueError('Entraînements du jour manquants : '+str(got_reviews)+'/'+
                         str(expected_reviews)+' séries corrigées')
    for e in exercises:
        if e.get('timEntBatch') is not True:raise ValueError('Exercice sans marqueur de lot ENT : '+str(e.get('id')))
    source_targets={}
    for x in rows:
        key=str(x['entId'])
        new=[l['id'] for l in lessons if str(l.get('entId'))==key]
        explicit=targets.get(key)
        if explicit is not None and not re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]{1,35}',str(explicit)):
            raise ValueError('Cible du cours ENT invalide : '+key)
        source_targets[key]=list(dict.fromkeys(new+([str(explicit)] if explicit else [])))
    docs=[]
    binary=[]
    for src in map(Path,args.zips):
        with zipfile.ZipFile(src) as z:
            for info in z.infolist():
                if info.is_dir() or info.filename.lower().endswith('.json'):continue
                binary.append((src,info.filename.replace('\\','/'),info.file_size))
    # Les documents sont retrouvés par ID ENT exact, jamais par titre tel que 3D.pdf.
    attachments={str(a['id']):x['entId'] for x in rows for a in x.get('attachments',[]) if a.get('id')}
    # Index Skolengo : une fiche peut être référencée dans l'index des pièces
    # sans apparaître dans le tableau included de la séance.
    labels={str(a['id']):str(a.get('name') or '') for x in rows
            for a in x.get('attachments',[]) if a.get('id')}
    for entry in inventory.get('attachmentIndex') or []:
        if not isinstance(entry,dict):continue
        rid=str(entry.get('id') or '')
        if not rid:continue
        labels[rid]=str(entry.get('nom_ENT') or entry.get('name') or labels.get(rid) or '')
        relations=entry.get('rattache_a') or entry.get('relatedTo') or []
        if isinstance(relations,dict):relations=[relations]
        parent_ids=[]
        for rel in relations if isinstance(relations,list) else []:
            if not isinstance(rel,dict):continue
            parent_ids += [str(rel.get(k)) for k in ('id','entId','targetId') if rel.get(k)]
        linked=list(dict.fromkeys(x for x in parent_ids if x in selected))
        if len(linked)==1:
            if rid in attachments and attachments[rid]!=linked[0]:
                raise ValueError('Index de pièces contradictoire pour '+rid)
            attachments[rid]=linked[0]
        elif len(linked)>1:
            raise ValueError('Pièce ENT rattachée à plusieurs cours/devoirs : '+rid)
    for rid,srcid in attachment_sources.items():
        if str(srcid) not in source_targets:raise ValueError('Pièce rattachée à un cours non sélectionné : '+str(rid))
        if rid in attachments and attachments[rid]!=srcid:raise ValueError('Conflit de rattachement de pièce : '+rid)
        attachments[str(rid)]=str(srcid)
    seen=set();payload=[]
    for ref,source_id in sorted(attachments.items()):
        if source_id not in source_targets:continue
        token=ref.replace('~','_')
        tokens=(token,ref)  # Les deux exports historiques utilisent _ ou ~ dans l'ID.
        found=[(src,name,size) for src,name,size in binary
               if any(re.search(r'(?<!\d)'+re.escape(t)+r'(?!\d)',name) for t in tokens)]
        if len(found)!=1:
            raise ValueError('Pièce ENT absente/ambiguë : '+ref+
                             ' ; aucun rattachement par simple nom autorisé')
        src,name,size=found[0]
        if size>4*1024*1024 or size<=0:raise ValueError('Pièce >4 Mo non supportée par Firestore : '+ref)
        ext=Path(name).suffix.lower()
        mime={'.pdf':'application/pdf','.png':'image/png','.jpg':'image/jpeg',
              '.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp',
              '.odt':'application/vnd.oasis.opendocument.text',
              '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              '.txt':'text/plain'}.get(ext)
        if not mime:raise ValueError('Extension de document non supportée : '+name)
        target=targets.get(source_id) or next((l['id'] for l in lessons
                   if l.get('kind')=='ent' and str(l.get('entId'))==source_id),None)
        if not target:raise ValueError('Pas de leçon cible pour le document ENT '+ref)
        with zipfile.ZipFile(src) as z:data=z.read(name)
        if ext=='.pdf' and not data.startswith(b'%PDF-'):raise ValueError('Signature PDF incorrecte : '+ref)
        newpath='pieces_ENT/'+token+'_'+Path(name).name
        if newpath in seen:raise ValueError('Même nom de pièce originale dans le lot : '+newpath)
        seen.add(newpath)
        payload.append((newpath,data))
        docs.append({'entId':source_id,'attachmentId':ref,'path':newpath,
                     'targetId':target,'fileName':Path(name).name,
                     'title':labels.get(ref) or Path(name).name,'mime':mime,'size':len(data),
                     'sha256':hashlib.sha256(data).hexdigest()})
    sources=[]
    for x in rows:
        is_new=x['kind']=='lesson' and str(x['entId']) in represented
        sources.append({'entId':str(x['entId']),'kind':x['kind'],
                        'targets':source_targets[str(x['entId'])],
                        'needsBis':is_new})
    homework=[{'entId':str(x['entId']),'subject':x['subject'],'due':x['due'],
               'title':x['title'],'content':x['original'],
               'attachments':[a['id'] for a in x['attachments']]}
              for x in work.values()]
    manifest={'schema':'tim-ent-batch-v1','sources':sources,
              'homework':homework,'documents':docs,'date':plan.get('date',''),
              'dailyTrainingRequired':expected_reviews}
    target=Path(args.out)
    if target.exists() and not args.overwrite:raise ValueError('ZIP de sortie déjà présent : refuser écrasement')
    target.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('PACK_PEDAGOGIQUE.json',json.dumps(pack,ensure_ascii=False,indent=2))
        z.writestr('MANIFESTE_LOT_TIM.json',json.dumps(manifest,ensure_ascii=False,indent=2))
        for name,data in payload:z.writestr(name,data)
    print('Lot ENT privé produit : '+str(len(lessons))+' leçons, '+str(len(exercises))+
          ' exercices, '+str(len(homework))+' devoirs, '+str(len(docs))+' documents originaux. Aucune publication.')

def main(argv=None):
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='mode',required=True)
    c=sub.add_parser('collect',help='Préparer le lot à partir de ZIP Termux sans aucune écriture en ligne')
    c.add_argument('zips',nargs='+');c.add_argument('--previous');c.add_argument('--out',required=True)
    c.add_argument('--date',help='Date française YYYY-MM-DD');c.add_argument('--subject',default='')
    v=sub.add_parser('validate',help='Vérifier les contenus rédigés avant import dans le classeur')
    v.add_argument('pack')
    v.add_argument('--out',help='Produire un JSON compatible avec import Parent existant, sans publier')
    v.add_argument('--plan',help='Exiger la couverture de tous les devoirs demain et à venir figurant dans ce plan ENT')
    v.add_argument('--existing',help='Lot des bonus déjà publiés : lecture seule pour éviter doublons')
    v.add_argument('--reviewed-sources',dest='reviewed_sources',help='Compte rendu des PDF originaux réellement lus, par identifiant ENT')
    a=sub.add_parser('assemble',help='Après rédaction/correction, créer un lot ZIP privé pour le compte Parent, sans publication')
    a.add_argument('--pack',required=True);a.add_argument('--plan',required=True)
    a.add_argument('--inventory',required=True);a.add_argument('--existing')
    a.add_argument('--reviewed-sources',dest='reviewed_sources')
    a.add_argument('--mapping',help='Cibles ENT existantes et correspondances explicites des pièces')
    a.add_argument('--out',required=True);a.add_argument('--overwrite',action='store_true')
    a.add_argument('zips',nargs='+',help='ZIP originaux Termux')
    args=p.parse_args(argv)
    try:
        if args.mode=='collect': return collect(args) or 0
        if args.mode=='validate': return validate(args)
        return assemble(args) or 0
    except (ValueError, OSError, json.JSONDecodeError,zipfile.BadZipFile) as exc:
        print('BLOCAGE SÉCURISÉ : '+str(exc),file=sys.stderr)
        return 2

if __name__=='__main__':sys.exit(main())