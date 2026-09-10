# Level Up! — Référence technique

Déplacée de `CLAUDE.md` (règles de travail) vers ce fichier : architecture, routes, configuration Cloudflare, moteur, tests, règles de livraison, conventions de design. À tenir à jour à chaque livraison (version comprise).

Version actuelle : **v20.11** (à mettre à jour ici et dans `index.html` à chaque livraison)

Le numéro de version est écrit **en dur dans `index.html`, à un seul endroit** :
le pied du premier écran d'onboarding (chaîne `"v20.11"` dans le composant
`Onboarding`, écran « profils existants »). C'est la seule source : `worker.js`
ne le contient qu'à travers la copie d'`index.html` qu'il embarque (ligne 5,
régénérée à chaque livraison), et il n'y a pas de fichier de version dédié.

## Architecture

Déploiement : **Cloudflare Worker** (pas Pages).

- `worker.js` — serveur : routes API, stockage, crons, appels IA
- `index.html` — front : React, JSX **précompilé** (plus de babel-standalone).
  Les composants ajoutés en v20.0 (questions du programme, aperçu,
  régénération, section « Mon programme ») sont écrits à la main avec
  `h = React.createElement`.
- `moteur-programmes.js` — le **moteur de génération de programmes**
  (fonction pure, règles 1-12 de `DECISIONS.md`, testé par
  `moteur-programmes.test.js`) ; `banque-exercices.json` — la banque
  d'exercices (vue lisible : `EXERCICES.md`, à tenir à la main à chaque ajout —
  118 exercices). Tous deux sont **embarqués dans
  `index.html`** (balises `<script id="moteur-programmes">` et
  `<script id="banque-exercices">`) : la génération se fait dans l'app,
  instantanément et hors ligne.
- `outils/sync.js` — synchronise les copies embarquées : moteur + banque →
  `index.html`, puis `index.html` → `worker.js` (ligne 5), et la police
  `outils/polices/space-grotesk-latin.woff2` → `worker.js` (ligne 6, base64 ;
  le worker la sert sur `/polices/space-grotesk.woff2`). **`node
  outils/sync.js` avant chaque commit touchant au moteur ou à la banque ; le
  test de synchronisation (`node outils/sync.test.js`) le vérifie.** Les
  copies ne s'éditent jamais à la main.
- `outils/tests/` — le harnais Playwright versionné : `mock-server.js` (faux
  worker), `lancer.js` (construit `app.html`, lance les mocks, joue les suites
  dans l'ordre), et les suites numérotées — `01-securite-profils-existants.js`
  en premier (aucun profil existant ne change de programme sans action
  explicite), puis v20.0, la séance vivante, le graphique, les bulles, la
  sécurité côté front (`06-securite-front.js`), les retours terrain (`07`,
  `09`), les évolutions v20.6 (`08`), v20.8 (`09b` : XP par difficulté, idées,
  notifications de séance, clôture à 3 h), v20.9 (`09c` : la séance libre —
  ajout depuis chaque onglet du panneau, retrait, réordonnancement, reps
  réelles, journal, programme inchangé, proposition après 3 retraits), v20.10
  (`09d` : champs à 16 px, négos harmonisées, « Déplacer » et appui long,
  gainage remplaçable, carte des premiers XP, idées avec progression), v20.11
  (`09e` : le cardio — notation, chrono, XP par durée, jour Cardio, Progrès,
  cardio dans le programme, option d'« Ajuster ») et les non-régressions
  v19.10 → v19.21.
- `outils/worker.test.js` — le worker importé dans Node avec un faux KV et un
  faux `fetch` : secrets hors du code, en-têtes, validation, quotas, photos,
  limitation de débit. `node outils/worker.test.js`, à chaque modification
  de `worker.js`.
- `SECURITE.md` — l'audit de sécurité (temps 1) et ce qui a été fait (temps 2),
  avec les actions qui restent côté dashboard. `CONFIDENTIALITE.md` — le texte
  de la page « Confidentialité et mentions légales » des Réglages.
- `wrangler.jsonc` — configuration de déploiement (Workers Builds) : nom, point
  d'entrée, liaison KV et crons ; **aucun secret** dans ce fichier ni dans le
  code : tout vit dans le dashboard Cloudflare (tableau ci-dessous)

Configuration Cloudflare :

| Élément | Valeur |
|---|---|
| Namespace KV | `LEVELUP` |
| Variable de liaison (binding) | `NEGOS` ⚠️ nom historique, ne pas renommer sans migrer les clés |
| Secret `ANTHROPIC_API_KEY` | clé de l'API Anthropic (routes IA) |
| Secret `VAPID_PRIV` | clé privée des notifications push (paire générée par `node outils/vapid.js`) |
| Variable `VAPID_PUB` | clé publique correspondante, injectée dans la page (`<meta name="vapid-pub">`) |
| Variable `CONTACT` (facultative) | adresse de contact : sujet VAPID et page Confidentialité (`<meta name="contact">`) |
| Cron rappel du soir | `0 18 * * *` |
| Cron compléments du matin | `0 6 * * *` |
| Cron notifications de séance (v20.8) | `* * * * *` — pousse les notifications planifiées par l'app (fin de repos, « Tu as fini ? ») |

Routes `/idees` et `/interpreter` : appels à l'API Anthropic (modèles épinglés
dans `worker.js` : `claude-sonnet-5` pour `/idees` depuis la v20.8,
`claude-haiku-4-5` pour `/interpreter`), réponses au format garanti par l'API
(structured outputs). `/idees` accepte des **styles de récompenses combinés**
et renvoie pour chaque idée `niveau`, `label` et `concret` (la ligne
« Concrètement : … ») ; le prompt porte trois bonnes et trois mauvaises idées,
une vérification orthographique minimale écarte les libellés suspects (mot
inventé, lettres triplées, mot sans voyelle) et redemande une fois. Depuis la v20.0, **l'IA ne génère plus de programme** : elle ne
fait que lire un objectif en texte libre (`/interpreter`) ; la structure des
séances vient du moteur, en code.

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
| `/photo` | POST | dépôt d'une preuve photo : data URL **JPEG base64 seulement**, 300 000 caractères max, TTL 90 jours |
| `/photo/<id>` | GET | lecture d'une preuve photo (texte, `nosniff`, cache privé 1 h) |
| `/rappels` | GET, POST | préférences de rappels (drapeau `matin`) |
| `/abonner` | POST | enregistrement d'un abonnement push (4 derniers conservés) — **services acceptés : Apple, Google/FCM, Mozilla** ; `503` sans clé VAPID |
| `/planifier` | POST | notifications de séance (v20.8) : `{type: "repos"|"relance", quand: epoch ms | null}` — l'app planifie la fin du repos et la relance « Tu as fini ? » 18 min après le dernier exercice, `null` annule ; rangé dans la clé globale `planif:index`, poussé par le cron de la minute |
| `/notif` | GET | le message du moment pour le service worker (`<code>:notif`, 5 min) : titre, corps, tag — `404` sinon (le service worker retombe sur le rappel du soir ou du matin) |
| `/desabonner` | POST | retrait d'un abonnement push |
| `/testpush` | POST | envoi d'une notification de test (`503` sans clé VAPID) |
| `/profil` | POST | enregistrement du code (v20.4) : l'app l'appelle à la création d'un profil et au premier démarrage ; **un code jamais enregistré n'a droit à aucun appel IA** (`403 code_inconnu`) |
| `/idees` | POST | idées de récompenses via l'API Anthropic — 10/jour par code, puis **150/jour pour toute l'app** (`429 {"erreur":"quota"|"budget"}`) |
| `/interpreter` | POST | lecture IA d'un objectif en texte libre → `{base, prioritaires}` pour le moteur — 10/jour par code, puis 100/jour pour toute l'app. Remplace `/generer` (v20.0) |
| `/supprimer` | POST | purge de **toutes** les clés KV du code duo, photos comprises |

`/idees` et `/interpreter` renvoient `503 {"erreur":"non_configure"}` quand
`ANTHROPIC_API_KEY` n'est pas défini ; l'app se replie alors sur un programme
« esthétique équilibré » et le dit.

Garde-fous communs (v20.4, voir `SECURITE.md`) : corps des requêtes plafonné
par route (`lireJson` : 64 Ko pour `/etat`, 400 Ko pour `/photo`, 2 Ko
ailleurs, `413` au-delà), liste blanche des champs de `/etat`, identifiants
`[\w-]{1,40}`, limitation de débit par IP en mémoire (120 écritures/min, 6/min
sur l'IA et `/profil`, `429 {"erreur":"trop_vite"}`), `cache-control:
no-store` et `nosniff` sur le JSON. La page est servie avec une CSP à nonce et
le jeu d'en-têtes de sécurité (`preparerPage`, exportée par `worker.js` et
réutilisée par le mock du harnais). Le worker sert aussi
`/polices/space-grotesk.woff2` (plus de Google Fonts).

## Structure de l'interface

### Les onglets

La barre d'onglets est **dépendante du rôle** : 5 clés d'onglet existent dans le
code, mais jamais les 5 à l'écran en même temps. Le coach en voit 2, le coaché
4.

| Clé | Libellé | Icône | Rôle |
|---|---|---|---|
| `jour` | Séance | `barbell` | coaché — séance du jour : carrousel de séances, cardio / repos, validation des exercices et preuve photo (mode focus par exercice depuis la v20.6 ; la séance choisie passe au-dessus de la grille du mois) |
| `hab` | Habitudes | `leaf` | coaché — habitudes quotidiennes à cocher |
| `prog` | Progrès | `chart` | coaché — progression, graphique de charge par exercice (v20.2), historique et photos |
| `rec` | Récomp. (coaché) / Négos (coach) | `gift` | récompenses, négociations, paris et pot |
| `suivi` | Suivi | `activity` | coach — état du coaché tel que publié sur `/etat` |

`rec` est le seul onglet partagé par les deux rôles : même composant
`Recompenses`, libellé différent dans la barre, et bulle d'aide dédiée côté
coach (clé `rec_coach`). Les six bulles (`BULLES`) sont accordées à la
préférence elle/il/neutre via `bulleTexte` ; `rec` a une variante solo.

### Mode solo

L'onboarding propose **trois modes** : `duo` (quelqu'un me coache), `solo` (je
me coache moi-même) et `coach` (je supervise quelqu'un). Le choix est figé dans
le profil sous `profil.solo`. Un coach qui arrive par le lien d'invitation
(`/?code=…&de=<prénom>`) n'a **pas** l'onboarding complet : le rôle est
pré-rempli, on lui demande son prénom, puis « Tu veux aussi t'entraîner ? »
(non → il arrive sur Suivi ; oui → son profil coach est créé sans recharger,
`creerProfil(…, { sansRecharger })`, et l'onboarding coaché enchaîne avec un
nouveau code duo). Chaque écran d'onboarding tient sans défiler et remplit au
moins 85 % du viewport réel (`Cadre`, `100dvh`, vérifié par la suite 07).

Ce que `solo` coupe, c'est la **synchronisation duo**, pas le réseau en entier :
`pousserEtat` et `pousserPhoto` sortent immédiatement, `/pause` n'est plus
rafraîchie et le pot n'est plus crédité lors d'une perte d'XP. Côté interface,
sont masqués : négociations, paris, pot (y compris son réglage) et l'invitation
du coach. Les récompenses restent, mais auto-définies — le coaché se les offre
lui-même au niveau atteint.

En revanche **restent actifs en solo** : `/interpreter` (lecture de
l'objectif libre ; le programme lui-même se calcule dans l'app, sans réseau),
`/idees`, `/profil`, et les notifications push (`/abonner`, `/desabonner`,
`/testpush`, `/rappels`) — aucune de ces routes n'est derrière un garde
`solo`. Un profil solo possède donc bien
un code duo généré, utilisé comme préfixe KV ; il est simplement affiché
« solo » au lieu du code dans la liste des profils, et jamais proposé au
partage.

## Règles de livraison

- `worker.js` et `index.html` sont **toujours livrés en paire**, via
  `node outils/sync.js` (qui embarque aussi le moteur et la banque dans
  `index.html`). Une modification d'un seul des deux fichiers est presque
  toujours un bug.
- En session, toute modification est vérifiée sur un worker mock local
  (Playwright : `node outils/tests/lancer.js`, et `node outils/worker.test.js`
  dès que `worker.js` change) ; c'est Léo qui la valide sur l'URL Worker
  après déploiement.
- **Aucun secret dans le code** : clés et contact vivent dans le dashboard
  Cloudflare (`ANTHROPIC_API_KEY`, `VAPID_PRIV`, `VAPID_PUB`, `CONTACT`). Le
  test du worker échoue si une clé revient dans `worker.js`.
  Une modification n'est « faite » qu'après cette seconde vérification.
- **La version affichée dans `index.html` et celle d'`ARCHITECTURE.md` doivent être
  mises à jour à chaque livraison, dans le même commit que le chantier.
  Vérifier avant de commiter** — sans ça, les deux numéros divergent en
  quelques livraisons.

## Conventions de design — à respecter systématiquement

Thème **dark glass**. Ne pas improviser de couleur ni de police.

⚠️ Ce thème est **temporaire** : il sera remplacé après la migration Vite
(refonte visuelle avec un vrai brief, voir `DECISIONS.md` v19.6). D'ici là, le
maintenir tel quel — mais ne pas le défendre si Léo demande à en changer.

- Fond : `#0B0E14`, avec halos radiaux bleu / violet
- Police : **Space Grotesk** uniquement, pas de seconde famille — servie par
  le worker (`outils/polices`, licence OFL), jamais depuis Google Fonts
- Palette « électrifiée » (voir les variables en tête de `index.html`)
- **Icônes : système SVG maison** (~30 paths façon Feather). Pour tout nouvel
  élément d'interface, une icône SVG — pas d'emoji. Il en reste des dizaines
  dans l'UI existante : ils partiront avec la refonte post-Vite, ne pas en
  ajouter d'ici là. Les emojis restent normaux dans les contenus rédigés
  (récompenses, messages).
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

`BACKLOG.md` liste tout ce qui est identifié mais pas encore traité — le
consulter avant de proposer un chantier, et y piocher les items d'une session
dédiée.
