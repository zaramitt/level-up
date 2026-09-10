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

### Programme : onboarding, moteur, migration (v20.0)

Les questions du programme, dans l'ordre : fréquence (1 à 7, le 7 présenté
comme « 6 séances + 1 jour de récupération active »), objectif (5 + texte
libre), deux questions factuelles (« déjà fait de la muscu ? », « squat et
pompe corrects ? ») qui donnent le niveau observé initial sans jamais afficher
le mot « niveau », sport (14 + non, puis intention et jours de sport),
matériel (liste à cocher, 4 raccourcis en tête), temps par séance (curseur +
saisie exacte, défaut 60). Le composant `QuestionsProgramme` est partagé par
l'onboarding, la migration et les réglages ; les réponses vivent dans
`st.reponses`, le programme généré dans `st.programmePerso` (avec
`programme: "perso"` et un bloc `moteur` : entrées, semaine, avertissements,
limites, volume).

La séance vivante (v20.1) : ressenti après chaque exercice (`st.ressentis`,
`J.ressentis`), incrément proposé quand la dernière fois a touché le haut de
la fourchette (`hautFourchette` sur l'entrée de charge), remplacement d'un
exercice pour le jour (`J.remplacements`) ou pour de bon (le programme est
réécrit), « Adapter ma séance » (`J.adaptee`, séance recompressée par le
moteur), recalage du niveau observé proposé et jamais imposé
(`reponses.niveauAjuste`, `st.niveauRefuse`, `st.ressentisDepuis`), jour de
récupération active rendu par `RecupView` (XP réduits). La séance du jour
telle qu'elle se joue est `SJ` dans `App`.

Depuis la v20.6 : la carte d'exercice s'ouvre en **mode focus** (`FocusExercice`,
popup quasi plein écran, fond flouté, fermeture par la croix ou un tap à
l'extérieur — alternative (b) de la v19.16, l'accordéon est abandonné ; le bouton
de ligne garde `aria-expanded`, le corps n'est monté qu'ouvert). Les noms de
séances sont les **muscles** (`S.nom`, « Pecs · épaules · triceps ») et le geste
reste en petit (`S.geste`, « Push (poussée) ») ; `S.sport` porte la phrase
« Adapté au foot : … » quand l'intention est de progresser dans un sport.
**Types de charge** pour les exercices faisables au poids du corps (`ex.pdc`,
posé par le moteur) : poids du corps / lesté (+kg) / assisté (kg d'assistance
stockés en **négatif**), choix mémorisé dans `st.typesCharge[exId]`, type sur
l'entrée de charge (`e.type`), `fmtCharge` / `maxCharge` en tiennent compte
(en assisté, la meilleure série est la moins assistée). « Ajuster ma séance du
jour — temps, énergie » marche dans les **deux sens** : temps en plus →
compléments proposés par le moteur (`adaptee.ajouts`, gainage manquant,
isolation du focus, finisher), « à fond » → une série de plus sur les gros
exercices et un cran de charge suggéré (`adaptee.intensifie`). Les jours de
sport ne bloquent jamais un programme : placement souple
(`moteur.placementSouple`, jamais de grosse séance jambes la veille ni le jour
même), dit dans « À savoir ».

Depuis la v20.7 : le **phare** d'un compartiment (règle 9 : développé couché,
squat barre, soulevé de terre roumain, militaire, rowing barre, traction)
ouvre toujours la première case de son compartiment dans la séance quand il
est faisable et admissible (`phareDe` dans `choisir`) ; la variation joue sur
la seconde case, jamais sur le phare. Sauf pour l'unilatéral, et sauf quand le
sport pousse un favori du même compartiment. Le **modificateur foot** pèse à
tous les niveaux (ischios obligatoires, hanches, mollets, unilatéral,
anti-rotation, avec des options de difficulté 1) ; `adaptesSport(s, entrees)`
liste ce que le sport a marqué dans une séance, `noteSport` en fait la phrase.
Le **ressenti** se replie sur le choix retenu après le tap (« modifier » rouvre
les trois). « dernier » n'est affiché qu'avec une vraie valeur (`derAffiche`).
Les **sons** demandent une session audio `ambient` (`navigator.audioSession`,
iOS 17+) pour se mêler à la musique au lieu de la couper ; sans l'API, volume
baissé. La barre de clôture dit « Terminer la séance ». En duo, **cagnotte et
paris sont toujours présents** : état « dès que ton coach a rejoint » tant que
`st.coachLie` est faux, et « indisponible — réessayer » si le serveur ne répond
pas (plus jamais masqués). Progrès : **un graphique par exercice dès la
première charge notée** (un point au centre).

Migration, option (b) : un profil d'avant la v20.0 **garde son programme tel
quel**. Une carte dans l'onglet Séance (« Nouveau moteur de programmes —
veux-tu régénérer le tien ? ») ouvre les questions pré-remplies puis un
aperçu complet ; « Adopter » remplace le programme (charges et historique
conservés, identifiants d'exercices stables), « Garder l'ancien » masque la
carte (`st.moteurRefuse`), qui reste accessible dans les réglages. Le même
flux (`Regenerer`) sert à « Changer de programme » et à chaque réponse
modifiée dans « Mon programme ».

### Notifications de séance et XP (v20.8)

Le service worker (`SW` dans `worker.js`) reçoit le code duo par `postMessage`
(rangé dans le Cache API) et, à chaque push, demande `/api/<code>/notif` pour
savoir quoi afficher. L'app ne planifie que si les rappels sont activés
(`st.reglages.rappels`) : `planifier(type, quand)` dans `App`, annulation dès
que le repos se termine à l'écran ; en arrière-plan sur Android, l'app notifie
aussi elle-même (`showNotification`). Le cron ne passe qu'une fois par minute :
une notification de fin de repos peut arriver jusqu'à une minute après la fin
réelle, et une échéance en retard de plus de 15 min est abandonnée.
`J.activite` horodate le dernier geste (validation, charge, repos, tour de
gainage) ; après **3 h sans activité**, la séance entamée est enregistrée
comme partielle (`autoInactivite`, historique `auto: true`), au chargement, au
retour au premier plan ou à la minute — règle « venir compte ».

**XP par difficulté** : `xpExo(ex)` = 10 / 15 / 20 selon `ex.difficulte` (1 / 2
/ 3, posée par le moteur ; 15 sans difficulté connue, anciens programmes),
sans photo 5 de moins (`xpExoSansPhoto`). Les points attribués sont mémorisés
par exercice dans `J.xpExos` (annulation, récap) ; `xpSeance(S)` donne le
« jusqu'à N XP » des cartes et `fourchetteXP(S)` la ligne d'en-tête.

### La séance libre (v20.9, étape 4 du Chantier Programmes)

Principe : **le programme est une proposition, la séance est ce que tu as
fait.** Tout ce qui se fait en salle se note sans quitter la séance, et rien de
ce qu'on change pour un jour ne touche le programme.

- **La séance du jour telle qu'elle se joue** est `SJ = seanceDuJour(J,
  SEANCES)` dans `App` : programme (ou `SEANCE_LIBRE` quand `J.seance === "L"`),
  séance adaptée, remplacements du jour, **retirés** (`J.retires`, ids),
  **ajoutés** (`J.ajouts`, exercices au format app portant `ajoute: true` et
  éventuellement `apres`, l'id de l'exercice après lequel se placer) et
  l'**ordre du jour** (`J.ordre`). `SJ.retiresExos` garde id + nom des retirés
  pour le journal. Le programme (`st.programmePerso`) ne bouge que par les
  actions « pour toutes les prochaines séances » (remplacement pour de bon,
  « Oui, on l'enlève » de la proposition ci-dessous).
- **Panneau d'exercices** (`PanneauExercices`, mode `ajouter` ou `remplacer`,
  style spotlight) : trois onglets — « Similaires » (muscle principal dans le
  focus de la séance, triés par compartiment, phare en premier),
  « Toute la banque » (recherche par nom, filtres muscle / compartiment /
  matériel) et « Cardio & mobilité ». Le contenu vient du moteur :
  `catalogue(banque, {focus, materiel, exclure})` → `{similaires, tous,
  cardio}` (faisables d'abord, puis ordre des compartiments, phare, difficulté,
  nom), `exerciceLibrePourApp(banque, id, {materiel})` fabrique l'exercice au
  format app avec les doses de la banque (3 séries, reps ou durée, repos,
  `difficulte` → XP). Bouton `.ajouter-exercice` sous la liste (toujours
  visible, ajout en fin) et `.ajouter-apres` dans la carte focus (après
  l'exercice ouvert). « Remplacer » utilise le même panneau, remplaçants
  directs (`remplacantsPour`) en tête, case « Pour toutes les prochaines
  séances aussi ».
- **Retirer et déplacer** dans la carte focus : `.retirer-exercice` →
  `ConfirmRetrait` (« Retiré. Ça ne change rien à tes XP. »), `.monter` /
  `.descendre`. Un exercice retiré ne compte ni en positif ni en négatif.
- **Reps réelles par série** (`SerieInputs`) : un stepper `.reps-serie` à côté
  de chaque charge, pré-rempli au haut de la fourchette, modifiable au tap
  (clavier) ou −/+ ; une série non modifiée vaut la valeur pré-remplie.
  `noterReps` / `persisterReps` écrivent `e.reps` sur l'entrée de charge du
  jour et en déduisent `e.hautFourchette` ; `figerReps` à la validation. Le
  moteur (`suggererCharge`, règle 8) lit `der.reps` (toutes ≥ haut de
  fourchette) et retombe sur `hautFourchette` pour les entrées d'avant ; sans
  charge notée ce jour-là, la dernière charge connue du même type sert de
  base. La phrase « Tout tenu ? … » ne s'affiche que quand c'est le cas.
- **Séance libre** : carte permanente `.carte-libre` dans le carrousel,
  `choisir("L")`, démarre vide, pas de bouton « Valider ma séance » ni
  d'« Ajuster » : la barre dit « Terminer la séance », XP des exercices
  faits, pas de bonus « complète ». Historique `type: "L"`, `libre: true`,
  « Séance libre — N exercices ».
- **Le journal** : chaque entrée d'historique porte `...journalDe(J, SJ,
  charges, jourKey)` — `exos` (id, nom, fait, xp, ajoute, remplace, series,
  reps, type, ressenti) et `retires` ({id, nom}). Progrès et « dernier » lisent
  les charges (`st.charges[exId]`), donc un exercice ajouté une fois a son
  graphique comme les autres.
- **Proposition après 3 retraits** : `compterRetraits` (à chaque clôture)
  tient `st.retraits[exId]` — retiré ou remplacé pour le jour trois séances de
  suite → carte `.proposition-retrait` « on l'enlève du programme ? »
  (`enleverDuProgramme` retire l'exercice de chaque séance du programme,
  `garderDansProgramme` remet le compteur à zéro).

### Retours terrain sur la v20.9 (v20.10)

- **Champs de saisie à 16 px minimum** partout (Safari iOS zoome sur tout
  champ plus petit) : la suite 09d vérifie qu'aucun `input`, `textarea` ou
  `select` visible n'est en dessous.
- **Table des négos** : même en-tête que « Le Pari » (titre, sous-titre), puis
  une ligne de puces (duo, ACTUALISER, hors ligne) — `.table-negos`,
  `.negos-puces`.
- **Déplacer** : dans la carte focus, le bouton « Déplacer » ouvre un menu
  `.menu-deplacer` (« Monter d'une place » / « Descendre d'une place »,
  `.monter` / `.descendre`). Dans la liste, **appui long (450 ms, sans
  bouger)** sur une ligne `button[data-exo]` la soulève (`.ligne-exercice.en-vol`)
  pour la glisser ; pointer events + `setPointerCapture`, un écouteur
  `touchmove` non passif sur `document` bloque le défilement pendant le
  glisser seulement, le clic qui suit est avalé ; `onOrdre(ids)` écrit
  `J.ordre`.
- **Gainage** : les lignes `button[data-gain]` ont « Remplacer »
  (`.remplacer-gainage`) et « + Ajouter un exercice après celui-ci »
  (`.ajouter-apres-gainage`) ; `seanceDuJour` applique les remplacements au
  gainage et range un gainage ajouté « après » un gainage dans le bloc
  gainage ; le panneau exclut aussi les gainages déjà présents et, ancré sur
  un gainage, ouvre « Similaires » sur les gainages.
- **Carte « Gagne tes premiers XP »** : croix `.fermer-premiers-xp`
  (`st.carteXPFermee`), disparaît d'elle-même dès que `st.xp > 0`.
- **Idées de récompenses** : « Niveau 2 » (plus « N2 ») ; prompt en
  **formulations nominales** sans pronom de locuteur (« offert par ton
  coach » ; en solo « que tu t'offres », `solo: true` dans la demande) et
  une idée portant « je / on va… » est écartée (`VOIX_RE`) ; pendant
  l'attente, compteur de secondes et barre (`.progression-idees`) ; le worker
  renvoie `x-duree-ms` et `x-appels` (1, ou 2 si relecture) et l'app le dit
  en toast (« 8 idées en 14 s »). La relecture ne part que sur détection d'un
  problème (hors format, moins de 4 idées propres, plus d'un tiers écartées).

### Le cardio, citoyen de première classe (v20.11)

Principe (DECISIONS, Chantier Programmes) : le cardio fait partie du programme
quand l'objectif ou le sport le réclame, jamais un simple bouton à côté ;
notation propre, XP selon la durée.

- **Moteur** : `cardioIntegre(entrees)` → `"objectif"` (« Perdre du poids »,
  « Me sentir mieux » sans sport à progresser : finisher de 10-15 min en fin de
  chaque séance de force, `role: "cardio"`, et une **séance cardio dédiée**
  dès 4× — `SQUELETTES_CARDIO` : `fullbody-ABC-cardio`, `haut-bas-x2-cardio`,
  `ppl-haut-bas-cardio`, focus `cardio` = 30 min d'appareil + une mobilité ;
  le 7× garde sa récupération active), `"sport"` (sport d'endurance avec
  intention de progresser — `endurance: true` sur course, cyclisme, natation —
  ou objectif cardio avec un sport à progresser : finishers seulement, les
  sorties font le reste), ou `false` (rien d'imposé). `squeletteDe(f, cardio)`.
  Compression : le finisher passe de 15 à 10 min d'abord ; en mode sport il
  saute ensuite en premier, en mode objectif il saute après les isolations
  sans rôle et avant celles du sport ; le retrait est dit dans « À savoir »
  (« ajoute-le avec Ajuster »). Le finisher préfère un appareil (tag
  `tapis / machine cardio`). `verifierRegles` a une règle `cardio` : finisher
  présent (sauf retrait annoncé), séance dédiée dès 4× en mode objectif,
  jamais de cardio imposé sinon, jamais de force dans une séance cardio.
  Les exercices `cardio_mobilite` portent `type` (`cardio` / `mobilite`)
  jusqu'à l'app (`presenterPourApp`, `exerciceLibrePourApp`, `versApp`).
- **« Ajuster ma séance »** : `adapterSeance` ajoute le cardio en premier parmi
  les compléments quand `cardioIntegre` (« cardio (objectif) ») ; sinon il
  renvoie `adaptee.optionCardio = {duree, candidats}` et honore
  `opts.cardio = {id, duree}` (« cardio demandé »). Le panneau
  (`AdapterPanneau`) montre `.option-cardio` (« Ajouter 15 min de cardio ? »,
  `.bascule-cardio`, `.appareils-cardio`).
- **App** : `estCardio(ex)`, `xpCardioMin(min)` = 5 / 10 / 15 / 20 (moins de
  10 min / 10-19 / 20-29 / 30 et plus), `xpExo` d'un cardio = par sa durée
  prévue, `xpExoSansPhoto` = idem (la durée est la preuve, pas de malus sans
  photo). La carte focus d'un cardio montre `CardioInputs` (`.chrono-cardio`,
  `.duree-cardio`, `.champ-cardio[data-champ]` selon `CARDIO_CHAMPS[ex.id]` :
  distance, vitesse, inclinaison, résistance) et valide par
  `.terminer-cardio` (photo en option, `aria-label="Ajouter une photo
  (facultatif)"`). La notation vit dans `st.charges[exId]` comme une charge :
  entrée du jour `{date, series: [], cardio: {duree_s, distance, vitesse,
  inclinaison, resistance, chronoDebut}}` (`noterCardio`), `fmtCharge` la
  lit (`fmtCardio`), le journal la porte (`exos[].cardio`), Progrès dessine
  `GrapheCardio` (durée pleine, distance en pointillé). Le **jour « Cardio »
  (K)** joue comme une séance libre ouverte sur le cardio
  (`SEANCE_CARDIO`, `cardioSeul`) : la carte `.choix-cardio` renvoie aux
  exercices de la banque (`CARDIO_IDS`), la barre « Terminer la séance » le
  clôt (historique `type: "K"`, `cardio: true`, libellé « Cardio — Rameur
  25 min · 4,2 km »), `J.cardioFait` est posé à la validation. `XP.cardio`
  (30) ne sert plus qu'aux anciens chemins.

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
