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
- `10` à `21` — non-régressions v19.10 → v19.21, portées sur les nouvelles
  questions d'onboarding quand elles passaient par les anciennes.

Prérequis : Playwright et Chromium (`NODE_PATH=/opt/node22/lib/node_modules`,
exécutable `/opt/pw-browsers/chromium` dans les suites). `app.html`, les
captures `.png` et les journaux ne sont pas versionnés.
