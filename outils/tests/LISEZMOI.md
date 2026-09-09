# Harnais Playwright — Level Up!

Les vérifications faites en session sur un faux worker local, versionnées ici
depuis la v20.0 pour survivre à la session.

```
node outils/tests/lancer.js          # toutes les suites
node outils/tests/lancer.js 01       # seulement la sécurité des profils existants
node outils/sync.test.js             # les copies embarquées sont-elles à jour ?
```

- `mock-server.js` — faux worker : sert `app.html` et React en local, imite
  `/interpreter` (IA), `/pause`, `/paris`, `/pot`, `/negos`, `/etat`.
  Variables : `PORT` (8323 par défaut), `MOCK_IA=off` (503, clé absente) ou
  `ko` (502), `COACH_LIE=1`.
- `lancer.js` — construit `app.html` depuis `index.html`, lance les mocks sur
  8323 et 8324 (IA non configurée), joue les suites numérotées dans l'ordre.
- `01-securite-profils-existants.js` — **en premier** : aucun profil existant
  ne change de programme sans action explicite (option (b), v20.0).
- `02-v2000-onboarding-moteur-migration.js` — onboarding solo, duo et coach,
  moteur branché, lecture IA et repli, réglages, 7 séances, sans matériel.
- `07-v2005-terrain.js` — retours terrain v20.5 : chaque écran d'onboarding
  tient sans défiler et remplit ≥ 85 % sur 390×664 (Safari avec ses barres)
  et 390×844, toasts (4 s, tap, erreurs persistantes), « dernier » à 0,
  cagnotte sur les jours prévus, « À savoir » fermable, bulle en puces,
  chrono et bouton de repos, charges facultatives.
- `08-v2006-evolutions.js` — v20.6 : noms de séances par muscles, mode
  focus, séance choisie en avant, types de charge, ajustement dans les deux
  sens, jours de sport et note sport, proposition sans coach → inviter,
  parcours coach par lien, « Ton coach t'attend », Progrès vide.
- `09-v2007-terrain.js` — v20.7 : ressenti replié sur le choix retenu,
  « dernier » seulement avec une valeur, phare du jour push, cagnotte et paris
  toujours présents en duo (coach pas relié, serveur en erreur), session audio
  « ambient », Progrès dès la première charge, « Terminer la séance ».
- `09b-v2008-xp-idees-notifs.js` — v20.8 : barème d'XP selon la difficulté
  (cartes, pastilles, validation, récap), idées de récompenses avec leur ligne
  « Concrètement », notifications de séance planifiées et annulées (mock
  `/planifier`, `/__planifs`), clôture automatique après 3 h sans activité.
- `10` à `21` — non-régressions v19.10 → v19.21, portées sur les nouvelles
  questions d'onboarding quand elles passaient par les anciennes.

Prérequis : Playwright et Chromium (`NODE_PATH=/opt/node22/lib/node_modules`,
exécutable `/opt/pw-browsers/chromium` dans les suites). `app.html`, les
captures `.png` et les journaux ne sont pas versionnés.

## Sécurité (v20.4)

- `06-securite-front.js` — clé push injectée par le serveur, carte de
  réactivation des rappels après changement de clé, rappels indisponibles
  sans clé (mock 8324, `MOCK_VAPID=off`), service push refusé, enregistrement
  du code (`/profil`) et messages de quota, CSP réelle rejouée sur un
  parcours (aucune violation, aucune requête vers un tiers, police chargée),
  page Confidentialité, phrase d'onboarding.
- `node outils/worker.test.js` — le worker importé dans Node avec un faux KV
  et un faux `fetch` : aucun secret dans le code, jeton VAPID vérifiable,
  routes 503 sans secret, quotas et budget IA, validation, photos, en-têtes,
  limitation de débit. À lancer avec le harnais.
- Le mock sert la page à travers `preparerPage` (exportée par `worker.js`) :
  mêmes en-têtes et même CSP à nonce que le vrai worker ; il injecte une clé
  publique factice (`meta vapid-pub`) et un contact ; `MOCK_VAPID=off` sert
  la page sans clé ; les routes IA refusent un code jamais enregistré, un
  code contenant `budget` ou `quota` provoque le refus correspondant ; la
  police est servie depuis `outils/polices`.
