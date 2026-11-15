/* Défi du dimanche du 15/11/2026. Banque privée chargée uniquement par Worker.
   Ne pas exposer les variantes ou barèmes de correction au navigateur avant validation.
   Les anciennes missions SUNDAY_* et leurs copies sont préservées. */
export const SUNDAY_BILAN_20261115={
  "id": "SUNDAY_BILAN_20261115",
  "kind": "sunday",
  "category": "challenge",
  "questionBank": "mixed-202611-v1",
  "period": "2026-11-15",
  "title": "Défi du dimanche — Bilan de la semaine et révisions",
  "description": "20 questions : 10 sur les cours de la semaine du 9 au 15 novembre et 10 sur les leçons depuis septembre. Raisonner, calculer et rédiger.",
  "level": "Grand contrôle du dimanche",
  "subject": "Défis",
  "lesson": "MBIS06",
  "realLessons": [
    "FR_BIS07",
    "L14",
    "SVT_BIS07",
    "HG_BIS08",
    "EN_BIS07",
    "PC_BIS01",
    "MBIS06",
    "FR_BIS01",
    "HG_BIS01",
    "SVT_BIS01",
    "MBIS03"
  ],
  "questions": [
    {
      "number": 1,
      "type": "structured",
      "format": "structured",
      "q": "Complète correctement : « Les filles sont arriv___ en classe. »",
      "fields": [
        {
          "name": "Auxiliaire",
          "points": 0.25,
          "instruction": "Quel auxiliaire est employé ?",
          "accepted": [
            "être",
            "etre"
          ]
        },
        {
          "name": "Sujet",
          "points": 0.25,
          "instruction": "Quel groupe de mots commande l’accord ?",
          "accepted": [
            "les filles"
          ]
        },
        {
          "name": "Participe passé",
          "points": 0.3,
          "instruction": "Écris le participe passé entier.",
          "accepted": [
            "arrivées"
          ]
        },
        {
          "name": "Phrase finale",
          "points": 0.2,
          "instruction": "Réécris la phrase complète correcte.",
          "accepted": [
            "Les filles sont arrivées en classe."
          ]
        }
      ],
      "why": "Avec « être », le participe passé s’accorde avec le sujet. « Les filles » est féminin pluriel : arrivées.",
      "subject": "Français",
      "topic": "Accord du participe passé avec être",
      "difficulty": "facile",
      "lessonId": "FR_BIS07",
      "lessonReview": "Français — chapitre 5 : accord du participe passé",
      "sourceEnt": "10099~6410527",
      "sourceId": "dim-20261115-01",
      "skill": "Français: Accord du participe passé avec être"
    },
    {
      "number": 2,
      "type": "structured",
      "format": "structured",
      "q": "Factorise l’expression 6x + 12.",
      "fields": [
        {
          "name": "Méthode",
          "points": 0.25,
          "instruction": "Quel facteur numérique est commun aux deux termes ?",
          "accepted": [
            "6"
          ]
        },
        {
          "name": "Étape de calcul",
          "points": 0.2,
          "instruction": "Complète : 6x = 6 × …",
          "accepted": [
            "x"
          ]
        },
        {
          "name": "Étape de calcul",
          "points": 0.2,
          "instruction": "Complète : 12 = 6 × …",
          "accepted": [
            "x"
          ]
        },
        {
          "name": "Résultat et rédaction",
          "points": 0.35,
          "instruction": "Écris « L’expression factorisée est … » avec ton résultat.",
          "accepted": [
            "L’expression factorisée est 6(x+2).",
            "L’expression factorisée est 6 × (x + 2)."
          ]
        }
      ],
      "why": "On met 6 en facteur : 6x + 12 = 6 × x + 6 × 2 = 6(x + 2). Il ne faut pas confondre développer et factoriser.",
      "subject": "Mathématiques",
      "topic": "Factorisation",
      "difficulty": "intermédiaire",
      "lessonId": null,
      "lessonReview": "Mathématiques — leçon BIS : factoriser une expression littérale",
      "sourceEnt": "10099~6402906",
      "sourceId": "dim-20261115-02",
      "skill": "Mathématiques: Factorisation"
    },
    {
      "number": 3,
      "type": "structured",
      "format": "structured",
      "q": "Complète en espagnol : « Nous pouvons étudier. » (verbe poder, présent de l’indicatif).",
      "fields": [
        {
          "name": "Sujet",
          "points": 0.25,
          "instruction": "Écris le pronom sujet espagnol pour « nous ».",
          "accepted": [
            "nosotros",
            "nosotras"
          ]
        },
        {
          "name": "Conjugaison",
          "points": 0.45,
          "instruction": "Conjugue poder à cette personne.",
          "accepted": [
            "podemos"
          ]
        },
        {
          "name": "Phrase complète",
          "points": 0.3,
          "instruction": "Écris la phrase entière en espagnol.",
          "accepted": [
            "Nosotros podemos estudiar.",
            "Nosotras podemos estudiar.",
            "Podemos estudiar."
          ]
        }
      ],
      "why": "Poder : puedo, puedes, puede, podemos, podéis, pueden. À nosotros, on écrit podemos sans diphtongue. « Podemos estudiar » est correct.",
      "subject": "Espagnol",
      "topic": "Présent de poder",
      "difficulty": "facile",
      "lessonId": "L14",
      "lessonReview": "Espagnol — liste 1 : conjugaison des dix verbes",
      "sourceEnt": "10099~214319",
      "sourceId": "dim-20261115-03",
      "skill": "Espagnol: Présent de poder"
    },
    {
      "number": 4,
      "type": "structured",
      "format": "structured",
      "q": "Après une piqûre, une zone de peau devient inflammatoire. Cite les quatre signes classiques, un signe différent dans chaque cadre.",
      "fields": [
        {
          "name": "Signe 1",
          "points": 0.25,
          "instruction": "Premier signe.",
          "accepted": [
            "rougeur",
            "chaleur",
            "gonflement",
            "douleur"
          ]
        },
        {
          "name": "Signe 2",
          "points": 0.25,
          "instruction": "Deuxième signe différent.",
          "accepted": [
            "rougeur",
            "chaleur",
            "gonflement",
            "douleur"
          ]
        },
        {
          "name": "Signe 3",
          "points": 0.25,
          "instruction": "Troisième signe différent.",
          "accepted": [
            "rougeur",
            "chaleur",
            "gonflement",
            "douleur"
          ]
        },
        {
          "name": "Signe 4",
          "points": 0.25,
          "instruction": "Quatrième signe différent.",
          "accepted": [
            "rougeur",
            "chaleur",
            "gonflement",
            "douleur"
          ]
        }
      ],
      "why": "Les quatre signes sont rougeur, chaleur, gonflement et douleur. Un même signe écrit plusieurs fois ne donne pas plusieurs points.",
      "subject": "SVT",
      "topic": "Symptômes de l’inflammation",
      "difficulty": "facile",
      "lessonId": "SVT_BIS07",
      "lessonReview": "SVT — réponse immunitaire rapide et inflammation",
      "sourceEnt": "10099~214069",
      "sourceId": "dim-20261115-04",
      "skill": "SVT: Symptômes de l’inflammation"
    },
    {
      "number": 5,
      "type": "structured",
      "format": "structured",
      "q": "Complète la devise de la République française, puis nomme le principe permettant à chacun d’avoir ou non une religion.",
      "fields": [
        {
          "name": "Valeur 1",
          "points": 0.2,
          "instruction": "Premier mot de la devise.",
          "accepted": [
            "Liberté"
          ]
        },
        {
          "name": "Valeur 2",
          "points": 0.2,
          "instruction": "Deuxième mot.",
          "accepted": [
            "Égalité"
          ]
        },
        {
          "name": "Valeur 3",
          "points": 0.2,
          "instruction": "Troisième mot.",
          "accepted": [
            "Fraternité"
          ]
        },
        {
          "name": "Principe",
          "points": 0.4,
          "instruction": "Quel est le principe mentionné dans le cours ?",
          "accepted": [
            "Laïcité",
            "la laïcité"
          ]
        }
      ],
      "why": "La devise est « Liberté, Égalité, Fraternité ». Le cours traite également du principe de laïcité, lié notamment à la liberté de conscience.",
      "subject": "Histoire-géographie / EMC",
      "topic": "Devise et laïcité",
      "difficulty": "facile",
      "lessonId": "HG_BIS08",
      "lessonReview": "Histoire-géographie / EMC — valeurs et principes de la République",
      "sourceEnt": "10099~214592",
      "sourceId": "dim-20261115-05",
      "skill": "Histoire-géographie / EMC: Devise et laïcité"
    },
    {
      "number": 6,
      "type": "structured",
      "format": "structured",
      "q": "Complète : « Les lettres qu’elle a écri… sont longues. »",
      "fields": [
        {
          "name": "Auxiliaire",
          "points": 0.15,
          "instruction": "Quel auxiliaire est employé ?",
          "accepted": [
            "avoir"
          ]
        },
        {
          "name": "COD",
          "points": 0.25,
          "instruction": "Quel est le COD de « a écrit » ?",
          "accepted": [
            "les lettres",
            "lettres"
          ]
        },
        {
          "name": "Position du COD",
          "points": 0.2,
          "instruction": "Le COD est-il avant ou après le verbe ?",
          "accepted": [
            "avant"
          ]
        },
        {
          "name": "Participe passé",
          "points": 0.25,
          "instruction": "Écris le participe passé correct.",
          "accepted": [
            "écrites"
          ]
        },
        {
          "name": "Phrase finale",
          "points": 0.15,
          "instruction": "Recopie la phrase correcte.",
          "accepted": [
            "Les lettres qu’elle a écrites sont longues."
          ]
        }
      ],
      "why": "Avec « avoir », on accorde le participe passé avec le COD si ce COD est placé avant le verbe. Ici « les lettres » est féminin pluriel et placé avant « a écrit » : écrites.",
      "subject": "Français",
      "topic": "Accord du participe passé avec avoir",
      "difficulty": "intermédiaire",
      "lessonId": "FR_BIS07",
      "lessonReview": "Français — chapitre 5 : accord du participe passé",
      "sourceEnt": "10099~6410527",
      "sourceId": "dim-20261115-06",
      "skill": "Français: Accord du participe passé avec avoir"
    },
    {
      "number": 7,
      "type": "structured",
      "format": "structured",
      "q": "À partir de l’adjectif happy (heureux), forme le nom anglais qui signifie « bonheur ».",
      "fields": [
        {
          "name": "Suffixe",
          "points": 0.25,
          "instruction": "Quel suffixe transforme l’adjectif en nom ?",
          "accepted": [
            "ness",
            "-ness"
          ]
        },
        {
          "name": "Orthographe",
          "points": 0.25,
          "instruction": "Quelle lettre remplace le y final dans happiness ?",
          "accepted": [
            "i"
          ]
        },
        {
          "name": "Nom formé",
          "points": 0.5,
          "instruction": "Écris le nom entier.",
          "accepted": [
            "happiness"
          ]
        }
      ],
      "why": "Happy devient happiness : on remplace y par i avant d’ajouter -ness. Le suffixe sert à former certains noms abstraits.",
      "subject": "Anglais",
      "topic": "Suffixe -ness",
      "difficulty": "facile",
      "lessonId": "EN_BIS07",
      "lessonReview": "Anglais — The Sounds of Music / dérivation en -ness",
      "sourceEnt": "10099~6401372;10099~6401356;10099~6401427",
      "sourceId": "dim-20261115-07",
      "skill": "Anglais: Suffixe -ness"
    },
    {
      "number": 8,
      "type": "structured",
      "format": "structured",
      "q": "Factorise complètement l’expression 8x² + 12x.",
      "fields": [
        {
          "name": "Facteur commun",
          "points": 0.35,
          "instruction": "Quel monôme le plus grand peut-on mettre en facteur ?",
          "accepted": [
            "4x",
            "4 × x"
          ]
        },
        {
          "name": "Premier terme restant",
          "points": 0.2,
          "instruction": "Complète : 8x² ÷ (4x) = …",
          "accepted": [
            "2x",
            "2 × x"
          ]
        },
        {
          "name": "Deuxième terme restant",
          "points": 0.2,
          "instruction": "Complète : 12x ÷ (4x) = …",
          "accepted": [
            "3"
          ]
        },
        {
          "name": "Expression finale",
          "points": 0.25,
          "instruction": "Écris la factorisation complète.",
          "accepted": [
            "4x(2x+3)",
            "4x × (2x+3)",
            "4 × x(2x+3)"
          ]
        }
      ],
      "why": "Le facteur commun maximal est 4x. On obtient 8x² + 12x = 4x(2x + 3). Vérification : 4x × 2x = 8x² et 4x × 3 = 12x.",
      "subject": "Mathématiques",
      "topic": "Factorisation avec x commun",
      "difficulty": "difficile",
      "lessonId": null,
      "lessonReview": "Mathématiques — leçon BIS : factoriser une expression littérale",
      "sourceEnt": "10099~6402906",
      "sourceId": "dim-20261115-08",
      "skill": "Mathématiques: Factorisation avec x commun"
    },
    {
      "number": 9,
      "type": "structured",
      "format": "structured",
      "q": "Lorsqu’un microbe entre dans une plaie, certaines cellules immunitaires interviennent. Complète les trois informations.",
      "fields": [
        {
          "name": "Cellule",
          "points": 0.35,
          "instruction": "Quel globule blanc peut détruire un agent étranger en l’engloutissant ?",
          "accepted": [
            "phagocyte",
            "un phagocyte",
            "les phagocytes"
          ]
        },
        {
          "name": "Mécanisme",
          "points": 0.4,
          "instruction": "Comment s’appelle ce processus ?",
          "accepted": [
            "phagocytose",
            "la phagocytose"
          ]
        },
        {
          "name": "Fin du processus",
          "points": 0.25,
          "instruction": "Qu’arrive-t-il au microbe à l’intérieur de la cellule ?",
          "accepted": [
            "digéré",
            "digestion",
            "il est digéré",
            "détruit par digestion"
          ]
        }
      ],
      "why": "Les cellules sentinelles donnent l’alerte. Les phagocytes sont attirés vers la zone touchée et détruisent certains agents étrangers par phagocytose, notamment par digestion.",
      "subject": "SVT",
      "topic": "Phagocytose",
      "difficulty": "facile",
      "lessonId": "SVT_BIS07",
      "lessonReview": "SVT — cellules sentinelles, phagocytes et phagocytose",
      "sourceEnt": "10099~214815",
      "sourceId": "dim-20261115-09",
      "skill": "SVT: Phagocytose"
    },
    {
      "number": 10,
      "type": "structured",
      "format": "structured",
      "q": "Complète les informations sur le Parlement européen étudiées cette semaine.",
      "fields": [
        {
          "name": "Représentants",
          "points": 0.35,
          "instruction": "Comment appelle-t-on ses membres élus ?",
          "accepted": [
            "députés",
            "députés européens",
            "eurodéputés",
            "les députés européens"
          ]
        },
        {
          "name": "Durée",
          "points": 0.35,
          "instruction": "Pour combien d’années sont-ils élus ?",
          "accepted": [
            "5",
            "5 ans",
            "cinq ans"
          ]
        },
        {
          "name": "Pouvoir",
          "points": 0.3,
          "instruction": "À quel pouvoir participe le Parlement européen ?",
          "accepted": [
            "législatif",
            "pouvoir législatif",
            "le pouvoir législatif"
          ]
        }
      ],
      "why": "Les députés européens sont élus pour cinq ans. Le Parlement européen participe au pouvoir législatif de l’Union européenne.",
      "subject": "Histoire-géographie / EMC",
      "topic": "Parlement européen",
      "difficulty": "facile",
      "lessonId": "HG_BIS08",
      "lessonReview": "Histoire-géographie / EMC — institutions de l’Union européenne",
      "sourceEnt": "10099~214770",
      "sourceId": "dim-20261115-10",
      "skill": "Histoire-géographie / EMC: Parlement européen"
    },
    {
      "number": 11,
      "type": "structured",
      "format": "structured",
      "q": "Un atome neutre possède Z = 11 et A = 23. Réponds à chaque étape.",
      "fields": [
        {
          "name": "Protons",
          "points": 0.25,
          "instruction": "Combien de protons y a-t-il dans son noyau ?",
          "accepted": [
            "11"
          ]
        },
        {
          "name": "Méthode",
          "points": 0.25,
          "instruction": "Écris le calcul du nombre de neutrons sous la forme A − Z.",
          "accepted": [
            "23-11",
            "23 − 11",
            "23 - 11"
          ]
        },
        {
          "name": "Neutrons",
          "points": 0.25,
          "instruction": "Combien de neutrons ?",
          "accepted": [
            "12"
          ]
        },
        {
          "name": "Électrons",
          "points": 0.25,
          "instruction": "Combien d’électrons pour cet atome neutre ?",
          "accepted": [
            "11"
          ]
        }
      ],
      "why": "Z est le nombre de protons. A est le nombre de nucléons (protons + neutrons). Donc N = A − Z = 23 − 11 = 12. Un atome neutre possède autant d’électrons que de protons : 11.",
      "subject": "Physique-chimie",
      "topic": "Écriture d’un atome A/Z",
      "difficulty": "intermédiaire",
      "lessonId": "PC_BIS01",
      "lessonReview": "Physique-chimie — structure de l’atome, A, Z, N",
      "sourceEnt": "10099~6390167",
      "sourceId": "dim-20261115-11",
      "skill": "Physique-chimie: Écriture d’un atome A/Z"
    },
    {
      "number": 12,
      "type": "structured",
      "format": "structured",
      "q": "ABC est un triangle rectangle en A. AB = 6 cm et AC = 8 cm. Calcule BC.",
      "fields": [
        {
          "name": "Repérage",
          "points": 0.15,
          "instruction": "Quel côté est l’hypoténuse ?",
          "accepted": [
            "BC",
            "[BC]"
          ]
        },
        {
          "name": "Relation",
          "points": 0.25,
          "instruction": "Écris l’égalité de Pythagore.",
          "accepted": [
            "BC²=AB²+AC²",
            "BC^2=AB^2+AC^2"
          ]
        },
        {
          "name": "Calcul",
          "points": 0.25,
          "instruction": "Quelle est la valeur de BC² ?",
          "accepted": [
            "100",
            "6²+8²",
            "36+64"
          ]
        },
        {
          "name": "Phrase-réponse",
          "points": 0.35,
          "instruction": "Écris une phrase donnant la longueur BC avec l’unité.",
          "accepted": [
            "BC mesure 10 cm.",
            "La longueur BC est de 10 cm.",
            "Le côté BC mesure 10 cm."
          ]
        }
      ],
      "why": "Comme le triangle est rectangle en A, BC² = AB² + AC² = 6² + 8² = 100. Donc BC = √100 = 10 cm.",
      "subject": "Mathématiques",
      "topic": "Théorème de Pythagore",
      "difficulty": "intermédiaire",
      "lessonId": "MBIS06",
      "lessonReview": "Mathématiques — théorème de Pythagore",
      "sourceEnt": "10099~6402901",
      "sourceId": "dim-20261115-12",
      "skill": "Mathématiques: Théorème de Pythagore"
    },
    {
      "number": 13,
      "type": "structured",
      "format": "structured",
      "q": "Traduis « J’aime les mathématiques » en espagnol.",
      "fields": [
        {
          "name": "Accord",
          "points": 0.35,
          "instruction": "Pour « las matemáticas », choisis gusta ou gustan.",
          "accepted": [
            "gustan"
          ]
        },
        {
          "name": "Phrase espagnole",
          "points": 0.65,
          "instruction": "Écris la phrase correcte.",
          "accepted": [
            "Me gustan las matemáticas."
          ]
        }
      ],
      "why": "On utilise « gustan » parce que « las matemáticas » est au pluriel. La phrase correcte est « Me gustan las matemáticas ».",
      "subject": "Espagnol",
      "topic": "Me gusta / me gustan",
      "difficulty": "facile",
      "lessonId": "L14",
      "lessonReview": "Espagnol — présentation au correspondant et gustar",
      "sourceEnt": "10099~212833",
      "sourceId": "dim-20261115-13",
      "skill": "Espagnol: Me gusta / me gustan"
    },
    {
      "number": 14,
      "type": "structured",
      "format": "structured",
      "q": "Une personne dit « I like music. » Tu es d’accord : toi aussi tu aimes la musique.",
      "fields": [
        {
          "name": "Mot de liaison",
          "points": 0.4,
          "instruction": "Écris le mot qui signifie ici « moi aussi ».",
          "accepted": [
            "So",
            "so"
          ]
        },
        {
          "name": "Réplique complète",
          "points": 0.6,
          "instruction": "Écris la réponse anglaise courte.",
          "accepted": [
            "So do I."
          ]
        }
      ],
      "why": "Après « I like music », on répond « So do I » pour dire « Moi aussi ». « Neither do I » convient à une phrase négative.",
      "subject": "Anglais",
      "topic": "So do I / Neither do I",
      "difficulty": "facile",
      "lessonId": "EN_BIS07",
      "lessonReview": "Anglais — exprimer les similitudes et différences",
      "sourceEnt": "10099~6401371",
      "sourceId": "dim-20261115-14",
      "skill": "Anglais: So do I / Neither do I"
    },
    {
      "number": 15,
      "type": "structured",
      "format": "structured",
      "q": "Lis : « Il faut réduire les déchets plastiques, car ils polluent la mer. Par exemple, des animaux marins les avalent. » Identifie le rôle de chaque extrait.",
      "fields": [
        {
          "name": "Thèse",
          "points": 0.35,
          "instruction": "Quelle partie exprime la position défendue ?",
          "accepted": [
            "Il faut réduire les déchets plastiques",
            "il faut réduire les déchets plastiques"
          ]
        },
        {
          "name": "Argument",
          "points": 0.35,
          "instruction": "Quelle partie donne la raison ?",
          "accepted": [
            "ils polluent la mer",
            "car ils polluent la mer"
          ]
        },
        {
          "name": "Exemple",
          "points": 0.3,
          "instruction": "Quelle partie donne un exemple concret ?",
          "accepted": [
            "des animaux marins les avalent",
            "Par exemple, des animaux marins les avalent"
          ]
        }
      ],
      "why": "La thèse est l’idée défendue : réduire les déchets plastiques. L’argument est qu’ils polluent la mer. L’exemple est que des animaux marins peuvent avaler ces déchets.",
      "subject": "Français",
      "topic": "Thèse, argument et exemple",
      "difficulty": "intermédiaire",
      "lessonId": "FR_BIS01",
      "lessonReview": "Français — séquence I : l’argumentation",
      "sourceEnt": "10099~6410570",
      "sourceId": "dim-20261115-15",
      "skill": "Français: Thèse, argument et exemple"
    },
    {
      "number": 16,
      "type": "structured",
      "format": "structured",
      "q": "Complète trois repères sur la révolution russe.",
      "fields": [
        {
          "name": "Date",
          "points": 0.35,
          "instruction": "En quelle année a lieu la révolution russe étudiée dans le cours ?",
          "accepted": [
            "1917"
          ]
        },
        {
          "name": "Chef",
          "points": 0.35,
          "instruction": "Quel dirigeant soutient les révolutionnaires bolcheviks ?",
          "accepted": [
            "Lénine",
            "Lenine"
          ]
        },
        {
          "name": "Groupe",
          "points": 0.3,
          "instruction": "Comment s’appellent les communistes russes évoqués dans le cours ?",
          "accepted": [
            "bolcheviks",
            "bolchéviks",
            "bolsheviks"
          ]
        }
      ],
      "why": "La révolution russe étudiée a lieu en 1917. Lénine dirige les bolcheviks, les communistes russes mentionnés dans la leçon.",
      "subject": "Histoire-géographie",
      "topic": "Révolution russe",
      "difficulty": "facile",
      "lessonId": "HG_BIS01",
      "lessonReview": "Histoire-géographie — révolution russe et URSS",
      "sourceEnt": "10099~6402817;10099~209976",
      "sourceId": "dim-20261115-16",
      "skill": "Histoire-géographie: Révolution russe"
    },
    {
      "number": 17,
      "type": "structured",
      "format": "structured",
      "q": "Distingue la contamination de l’infection.",
      "fields": [
        {
          "name": "Contamination",
          "points": 0.5,
          "instruction": "Quand les micro-organismes franchissent les barrières naturelles, c’est la …",
          "accepted": [
            "contamination"
          ]
        },
        {
          "name": "Infection",
          "points": 0.5,
          "instruction": "Quand ils se multiplient dans l’organisme, c’est l’…",
          "accepted": [
            "infection"
          ]
        }
      ],
      "why": "La contamination est l’entrée des micro-organismes dans l’organisme après franchissement des barrières. L’infection correspond à leur multiplication dans l’organisme.",
      "subject": "SVT",
      "topic": "Contamination et infection",
      "difficulty": "facile",
      "lessonId": "SVT_BIS01",
      "lessonReview": "SVT — contamination et infection",
      "sourceEnt": "10099~6396497;10099~6396482",
      "sourceId": "dim-20261115-17",
      "skill": "SVT: Contamination et infection"
    },
    {
      "number": 18,
      "type": "structured",
      "format": "structured",
      "q": "Un atome perd un électron. Indique le type d’ion obtenu.",
      "fields": [
        {
          "name": "Électrons",
          "points": 0.3,
          "instruction": "A-t-il gagné ou perdu un électron ?",
          "accepted": [
            "perdu",
            "perte",
            "il a perdu"
          ]
        },
        {
          "name": "Charge",
          "points": 0.35,
          "instruction": "Quelle est la charge électrique de l’ion formé ?",
          "accepted": [
            "positive",
            "positif",
            "+"
          ]
        },
        {
          "name": "Nom",
          "points": 0.35,
          "instruction": "Comment s’appelle un ion chargé positivement ?",
          "accepted": [
            "cation",
            "un cation"
          ]
        }
      ],
      "why": "Les électrons ont une charge négative. Lorsqu’un atome perd un électron, il perd une charge négative et devient positif : c’est un cation.",
      "subject": "Physique-chimie",
      "topic": "Ions positifs",
      "difficulty": "facile",
      "lessonId": "PC_BIS01",
      "lessonReview": "Physique-chimie — les ions",
      "sourceEnt": "10099~6390184",
      "sourceId": "dim-20261115-18",
      "skill": "Physique-chimie: Ions positifs"
    },
    {
      "number": 19,
      "type": "structured",
      "format": "structured",
      "q": "Calcule 2³ × 2⁴ et explique la règle.",
      "fields": [
        {
          "name": "Règle",
          "points": 0.3,
          "instruction": "Avec des puissances de même base que fait-on des exposants lors d’une multiplication ?",
          "accepted": [
            "additionne",
            "on additionne",
            "addition",
            "on les additionne"
          ]
        },
        {
          "name": "Calcul des exposants",
          "points": 0.2,
          "instruction": "Combien vaut 3 + 4 ?",
          "accepted": [
            "7"
          ]
        },
        {
          "name": "Puissance obtenue",
          "points": 0.2,
          "instruction": "Écris le résultat sous forme d’une puissance.",
          "accepted": [
            "2^7",
            "2⁷"
          ]
        },
        {
          "name": "Valeur numérique",
          "points": 0.3,
          "instruction": "Quelle est la valeur numérique finale ?",
          "accepted": [
            "128"
          ]
        }
      ],
      "why": "Quand on multiplie des puissances de même base, on additionne les exposants : 2³ × 2⁴ = 2^(3+4) = 2⁷ = 128.",
      "subject": "Mathématiques",
      "topic": "Puissances de même base",
      "difficulty": "intermédiaire",
      "lessonId": "MBIS03",
      "lessonReview": "Mathématiques — les puissances",
      "sourceEnt": "10099~6402932;10099~6402966",
      "sourceId": "dim-20261115-19",
      "skill": "Mathématiques: Puissances de même base"
    },
    {
      "number": 20,
      "type": "structured",
      "format": "structured",
      "q": "Observe : « Tu pourras t’amuser lorsque tu auras fini tes devoirs. »",
      "fields": [
        {
          "name": "Verbe 1",
          "points": 0.3,
          "instruction": "Dans « tu pourras », quel est le temps ?",
          "accepted": [
            "futur simple",
            "le futur simple"
          ]
        },
        {
          "name": "Verbe 2",
          "points": 0.3,
          "instruction": "Dans « tu auras fini », quel est le temps ?",
          "accepted": [
            "futur antérieur",
            "le futur antérieur"
          ]
        },
        {
          "name": "Ordre des actions",
          "points": 0.2,
          "instruction": "Quelle action doit être terminée en premier ?",
          "accepted": [
            "finir les devoirs",
            "avoir fini les devoirs",
            "les devoirs"
          ]
        },
        {
          "name": "Conclusion",
          "points": 0.2,
          "instruction": "Complète la phrase : « Le futur antérieur exprime ici une action … avant une autre action future. »",
          "accepted": [
            "achevée",
            "terminée",
            "finie"
          ]
        }
      ],
      "why": "« Tu pourras » est au futur simple et « tu auras fini » est au futur antérieur. Le futur antérieur marque une action qui sera terminée avant celle exprimée au futur simple.",
      "subject": "Français",
      "topic": "Futur simple et futur antérieur",
      "difficulty": "difficile",
      "lessonId": "FR_BIS07",
      "lessonReview": "Français — chapitre 4 : mode indicatif et temps composés",
      "sourceEnt": "10099~6410525;10099~6410459",
      "sourceId": "dim-20261115-20",
      "skill": "Français: Futur simple et futur antérieur"
    }
  ]
};
