# Level Up! — Contexte projet

## Ce qu'est l'app

Web app fitness gamifiée en duo **coach / coaché**. Le coaché prouve ses séances
(photo), gagne des XP, monte de niveau et débloque des récompenses offertes par
le coach. Créée à l'origine pour un usage à deux, en cours d'ouverture vers un
produit plus général.

Version actuelle : **v19.12**

Le numéro de version est écrit **en dur dans `index.html`, à un seul endroit** :
le pied du premier écran d'onboarding (chaîne `"v19.12"` dans le composant
`Onboarding`, écran « profils existants »). Il n'apparaît ni dans `worker.js`,
ni dans un fichier de version dédié — chercher la chaîne pour la mettre à jour.

## Architecture

Déploiement : **Cloudflare Worker** (pas Pages).

- `worker.js` — serveur : routes API, stockage, crons, appels IA
- `index.html` — front : React, JSX **précompilé** (plus de babel-standalone)
- `wrangler.jsonc` — configuration de déploiement (Workers Builds) : nom, point
  d'entrée, liaison KV et crons ; le secret `ANTHROPIC_API_KEY` vit côté
  Cloudflare, pas dans ce fichier

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

### Routes API

Toutes les routes API sont préfixées par le code duo :
**`/api/<code-duo>/<route>`**. Le worker sert aussi `/sw.js` (service worker)
et renvoie `index.html` sur tout le reste ; une route inconnue **sous `/api/`**
renvoie `404 route inconnue`. Chaque route lit et écrit des clés KV préfixées
par le code duo (`<code>:etat`, `<code>:negos`…).

| Route | Méthodes | Rôle |
|---|---|---|
| `/etat` | GET, POST | état publié par le coaché (XP, histo, jours actifs, jokers, pauses) — c'est la source de l'écran Suivi du coach |
| `/negos` | GET, POST | négociations de récompenses entre coach et coaché |
| `/paris` | GET, POST | paris coach / coaché |
| `/pot` | GET, POST | pot commun (cumul du mois en euros + historique), alimenté par les pertes d'XP |
| `/pause` | GET, POST | demande de pause et pause active |
| `/photo` | POST | dépôt d'une preuve photo (300 000 caractères max, TTL 90 jours) |
| `/photo/<id>` | GET | lecture d'une preuve photo |
| `/rappels` | GET, POST | préférences de rappels (drapeau `matin`) |
| `/abonner` | POST | enregistrement d'un abonnement push (4 derniers conservés) |
| `/desabonner` | POST | retrait d'un abonnement push |
| `/testpush` | POST | envoi d'une notification de test |
| `/idees` | POST | idées de récompenses via l'API Anthropic (quota journalier par code) |
| `/generer` | POST | génération de programme via l'API Anthropic |
| `/supprimer` | POST | purge de **toutes** les clés KV du code duo |

`/idees` et `/generer` renvoient `503 {"erreur":"non_configure"}` quand
`ANTHROPIC_API_KEY` n'est pas défini.

## Structure de l'interface

### Les onglets

La barre d'onglets est **dépendante du rôle** : 5 clés d'onglet existent dans le
code, mais jamais les 5 à l'écran en même temps. Le coach en voit 2, le coaché
4.

| Clé | Libellé | Icône | Rôle |
|---|---|---|---|
| `jour` | Séance | `barbell` | coaché — séance du jour : carrousel de séances, cardio / repos, validation des exercices et preuve photo |
| `hab` | Habitudes | `leaf` | coaché — habitudes quotidiennes à cocher |
| `prog` | Progrès | `chart` | coaché — progression, historique et photos |
| `rec` | Récomp. (coaché) / Négos (coach) | `gift` | récompenses, négociations, paris et pot |
| `suivi` | Suivi | `activity` | coach — état du coaché tel que publié sur `/etat` |

`rec` est le seul onglet partagé par les deux rôles : même composant
`Recompenses`, libellé différent dans la barre, et bulle d'aide dédiée côté
coach (clé `rec_coach`).

### Mode solo

L'onboarding propose **trois modes** : `duo` (quelqu'un me coache), `solo` (je
me coache moi-même) et `coach` (je supervise quelqu'un). Le choix est figé dans
le profil sous `profil.solo`.

Ce que `solo` coupe, c'est la **synchronisation duo**, pas le réseau en entier :
`pousserEtat` et `pousserPhoto` sortent immédiatement, `/pause` n'est plus
rafraîchie et le pot n'est plus crédité lors d'une perte d'XP. Côté interface,
sont masqués : négociations, paris, pot (y compris son réglage) et l'invitation
du coach. Les récompenses restent, mais auto-définies — le coaché se les offre
lui-même au niveau atteint.

En revanche **restent actifs en solo** : `/generer` (l'écran `ChoixProgramme`
s'affiche pour tout profil non-coach sans programme), `/idees`, et les
notifications push (`/abonner`, `/desabonner`, `/testpush`, `/rappels`) — aucune
de ces routes n'est derrière un garde `solo`. Un profil solo possède donc bien
un code duo généré, utilisé comme préfixe KV ; il est simplement affiché
« solo » au lieu du code dans la liste des profils, et jamais proposé au
partage.

## Règles de livraison

- `worker.js` et `index.html` sont **toujours livrés en paire**. Une
  modification d'un seul des deux fichiers est presque toujours un bug.
- Toute modification doit être testée sur l'URL Worker avant d'être considérée
  comme faite.
- **La version affichée dans `index.html` et celle de `CLAUDE.md` doivent être
  mises à jour à chaque livraison, dans le même commit que le chantier.
  Vérifier systématiquement avant de commiter.** (Le décalage v19.5 → v19.12
  vient de l'absence de cette règle.)

## Conventions de design — à respecter systématiquement

Thème **dark glass**. Ne pas improviser de couleur ni de police.

⚠️ Ce thème est **temporaire** : il sera remplacé après la migration Vite
(refonte visuelle avec un vrai brief, voir `DECISIONS.md` v19.6). D'ici là, le
maintenir tel quel — mais ne pas le défendre si Léo demande à en changer.

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
  personnalisé. Route de suppression : `/api/<code-duo>/supprimer`.

## Avant de proposer une évolution

Lire `DECISIONS.md`. Plusieurs pistes évidentes ont déjà été écartées pour de
bonnes raisons.

`BACKLOG.md` liste tout ce qui est identifié mais pas encore traité (retour
complet de Léo sur la v19.5) — le consulter avant de proposer un chantier, et
y piocher les items d'une session dédiée.
