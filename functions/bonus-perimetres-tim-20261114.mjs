/* Défi bonus de remédiation : périmètres, en réponse aux erreurs constatées le 13 novembre 2026.
 * Préparation uniquement : ce module N'IMPORTE rien dans Firebase et N'ACTIVE aucune mission.
 * Sans leçon pertinente dans le classeur, aucun lien n'est inventé.
 * Les réponses/explications sont destinées à l'import privé Parent (jamais au script public du site).
 */
export const BONUS_PERIMETRE_TIM = {
  "id": "TIMBONUSPERIM20261114",
  "title": "Défi bonus — Le tour des rectangles",
  "chapter": "Périmètre et aire",
  "questions": [
    {
      "type": "mc",
      "q": "Dans un problème de géométrie, que signifie « la longueur du tour d'un rectangle » ?",
      "options": [
        "La surface du rectangle",
        "La longueur de tout son contour",
        "La quantité de carreaux à l'intérieur",
        "La longueur de sa diagonale"
      ],
      "right": 1,
      "why": "Le périmètre correspond à la longueur de tout le contour de la figure. On additionne ses côtés. Il se mesure en cm, m, etc., et non en cm².",
      "skill": "Comprendre"
    },
    {
      "type": "mc",
      "q": "Un rectangle mesure 3 cm de long et 4 cm de large. Quel calcul permet de trouver son périmètre ?",
      "options": [
        "3 × 4",
        "3 + 4",
        "3 + 4 + 3 + 4",
        "3 × 4 × 2"
      ],
      "right": 2,
      "why": "Un rectangle a quatre côtés : deux de 3 cm et deux de 4 cm. On additionne 3 + 4 + 3 + 4, soit 14 cm. Multiplier 3 par 4 donne l'aire, pas le périmètre.",
      "skill": "Comprendre"
    },
    {
      "type": "text",
      "q": "Un rectangle mesure 3 cm de long et 4 cm de large. Quelle est la longueur de tout son contour ? Donne le résultat en cm.",
      "right": "14 cm",
      "why": "Il faut additionner les quatre côtés, et non multiplier longueur et largeur : 3 + 4 + 3 + 4 = 14 cm. On peut aussi écrire 2 × (3 + 4) = 14 cm. Phrase-réponse : le contour mesure 14 cm.",
      "skill": "Appliquer",
      "reasoningRequired": false,
      "also": [
        "14"
      ]
    },
    {
      "type": "mc",
      "q": "Un rectangle mesure 3 cm sur 4 cm. Quelle proposition donne correctement son aire ?",
      "options": [
        "12 cm",
        "12 cm²",
        "14 cm",
        "14 cm²"
      ],
      "right": 1,
      "why": "L'aire mesure la surface intérieure : 3 × 4 = 12 cm². L'unité est le centimètre carré (cm²). Le périmètre, lui, mesure le tour et vaut 14 cm.",
      "skill": "Comprendre"
    },
    {
      "type": "mc",
      "q": "Tu veux poser une baguette tout autour d'une affiche rectangulaire. Quelle grandeur faut-il calculer ?",
      "options": [
        "L'aire de l'affiche",
        "Le volume de l'affiche",
        "Le périmètre de l'affiche",
        "La diagonale de l'affiche"
      ],
      "right": 2,
      "why": "Une baguette suit le bord extérieur de l'affiche : il faut calculer son périmètre. Les mots « bord », « cadre », « tour » et « clôture » renvoient généralement au contour.",
      "skill": "Comprendre"
    },
    {
      "type": "text",
      "q": "Une affiche rectangulaire mesure 6 cm de long et 5 cm de large. Quelle longueur de baguette faut-il pour faire entièrement le cadre ? Donne le résultat en cm.",
      "right": "22 cm",
      "why": "Le mot « cadre » désigne ici tout le bord : 6 + 5 + 6 + 5 = 22 cm, ou 2 × (6 + 5) = 22 cm. Phrase-réponse : il faut 22 cm de baguette pour entourer l'affiche. Tu avais écrit « j'ai pas compris » dans le défi du 13 novembre : cette formulation demandait bien un périmètre.",
      "skill": "Appliquer",
      "reasoningRequired": false,
      "also": [
        "22"
      ]
    },
    {
      "type": "text",
      "q": "Un rectangle mesure 5 cm de long et 2 cm de large. Calcule son périmètre en cm.",
      "right": "14 cm",
      "why": "Le tour comprend deux longueurs de 5 cm et deux largeurs de 2 cm. On écrit P = 5 + 2 + 5 + 2 = 14 cm, ou P = 2 × (5 + 2) = 14 cm. Phrase-réponse : le périmètre est de 14 cm.",
      "skill": "Appliquer",
      "reasoningRequired": false,
      "also": [
        "14"
      ]
    },
    {
      "type": "mc",
      "q": "Un élève affirme : « Un rectangle de 7 cm sur 3 cm a un périmètre de 21 cm car 7 × 3 = 21 ». Quelle explication est juste ?",
      "options": [
        "Il a raison : le périmètre est de 21 cm.",
        "Il a calculé l'aire ; le périmètre vaut 20 cm.",
        "Il faut faire 7 − 3 ; le périmètre vaut 4 cm.",
        "Il faut faire 7 + 3 ; le périmètre vaut 10 cm."
      ],
      "right": 1,
      "why": "7 × 3 = 21 cm² est une aire. Pour le périmètre, il faut additionner les quatre côtés : 7 + 3 + 7 + 3 = 20 cm. Phrase-réponse : le périmètre du rectangle mesure 20 cm.",
      "skill": "Raisonner"
    },
    {
      "type": "text",
      "q": "Un rectangle mesure 8 cm de long et 4 cm de large. Quel est son périmètre ? Écris le résultat en cm et détaille ton calcul dans la zone de raisonnement.",
      "right": "24 cm",
      "why": "Méthode : on additionne deux longueurs et deux largeurs. Au brouillon : P = 8 + 4 + 8 + 4 = 24 cm, ou P = 2 × (8 + 4) = 24 cm. Phrase-réponse : le périmètre du rectangle est de 24 cm.",
      "skill": "Raisonner",
      "reasoningRequired": true,
      "also": [
        "24"
      ],
      "reasoningCheck": {
        "kind": "rectangle-perimeter-v1",
        "length": 8,
        "width": 4,
        "unit": "cm"
      }
    },
    {
      "type": "text",
      "q": "Un potager rectangulaire mesure 9 m de long et 6 m de large. On veut poser une clôture sur tout son contour, sans ouverture. Combien de mètres de clôture faut-il ? Écris le résultat en m et détaille ton calcul dans la zone de raisonnement.",
      "right": "30 m",
      "why": "Une clôture fait tout le tour du potager : c'est un périmètre. Au brouillon : P = 9 + 6 + 9 + 6 = 30 m, ou P = 2 × (9 + 6) = 30 m. Phrase-réponse : il faut 30 m de clôture. L'unité est le mètre, pas le mètre carré.",
      "skill": "Raisonner",
      "reasoningRequired": true,
      "also": [
        "30"
      ]
    }
  ],
  "subject": "Mathématiques",
  "kind": "bonus-day",
  "category": "bonus",
  "enabled": true,
  "description": "10 questions sur les périmètres et la différence avec l'aire. Une tentative, note et corrections détaillées après validation. +5 XP à partir de 7/10 ; +2,5 XP de 5/10 à moins de 7/10 ; sinon 0 XP."
};
export function bonusPerimetreTimPack(){return {lessons:[],exercises:[structuredClone(BONUS_PERIMETRE_TIM)]};}
