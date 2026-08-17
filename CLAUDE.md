# Level Up! — Contexte projet

## Ce qu'est l'app

Web app fitness gamifiée en duo **coach / coaché**. Le coaché prouve ses séances
(photo), gagne des XP, monte de niveau et débloque des récompenses offertes par
le coach. Créée à l'origine pour un usage à deux, en cours d'ouverture vers un
produit plus général.

Version actuelle : **v19.5**

## Architecture

Déploiement : **Cloudflare Worker** (pas Pages).

- `worker.js` — serveur : routes API, stockage, crons, appels IA
- `index.html` — front : React, JSX **précompilé** (plus de babel-standalone)

Configuration Cloudflare :

| Élément | Valeur |
|---|---|
| Namespace KV | `LEVELUP` |
| Variable de liaison (binding) | `NEGOS` ⚠️ nom historique, ne pas renommer sans migrer les clés |
| Secret | `ANTHROPIC_API_KEY` |
| Cron rappel du soir | `0 18 * * *` |
| Cron compléments du matin | `0 6 * * *` |

Génération de programmes et route `/idees` : appels à l'API Anthropic
(Claude Haiku). `/idees` accepte des **styles de récompenses combinés**.

## Règles de livraison

- `worker.js` et `index.html` sont **toujours livrés en paire**. Une
  modification d'un seul des deux fichiers est presque toujours un bug.
- Toute modification doit être testée sur l'URL Worker avant d'être considérée
  comme faite.

## Conventions de design — à respecter systématiquement

Thème **dark glass**. Ne pas improviser de couleur ni de police.

- Fond : `#0B0E14`, avec halos radiaux bleu / violet
- Police : **Space Grotesk** uniquement, pas de seconde famille
- Palette « électrifiée » (voir les variables en tête de `index.html`)
- **Icônes : système SVG maison** (~30 paths façon Feather). Aucun emoji dans
  l'interface. Les emojis sont réservés aux contenus rédigés (récompenses,
  messages), jamais aux éléments d'UI.
- Barre d'onglets : pilule flottante
- Approbations et négociations : cartes d'approbation

## Règles de contenu / UX acquises

- **Révélation progressive** de l'écran Séance : la grille du mois et le défi de
  la semaine n'apparaissent qu'après la première journée couverte / séance
  validée. Ne pas les afficher d'entrée.
- **Transparence totale des XP** : pastille `+15 XP` sur chaque exercice,
  estimation « jusqu'à N XP » sur chaque carte du carrousel de séances.
- **Cardio** et **Repos** sont deux boutons fixes permanents sous les cartes,
  pas des éléments du carrousel.
- L'accueil affiche un pitch en 3 lignes (« Quelqu'un qui tient à toi devient
  ton coach… »). L'objectif de l'app doit être compris en 5 secondes.
- Codes duo : 10 caractères aléatoires générés ; minimum 8 caractères si
  personnalisé. Route de suppression : `/supprimer`.

## Avant de proposer une évolution

Lire `DECISIONS.md`. Plusieurs pistes évidentes ont déjà été écartées pour de
bonnes raisons.
