# Sécurité — audit (temps 1)

Audit du 6 septembre 2026, sur `main` à la v20.3. Aucun code modifié.
Périmètre : `worker.js`, `index.html`, `wrangler.jsonc`, l'historique git
complet (76 commits, dépôt public depuis le premier), le harnais `outils/`.

Ce fichier ne contient **aucune valeur secrète** : les secrets trouvés sont
décrits, jamais recopiés.

Ce qui n'a pas pu être vérifié depuis la session : les en-têtes réellement
servis par le Worker (l'URL n'est pas dans le dépôt), le plan Cloudflare
(gratuit ou payant, ça change les limites KV, voir le point 5), et les
empreintes SRI des fichiers React de cdnjs (réseau bloqué vers cdnjs ici ; les
copies du harnais ont été hachées, l'origine reste à confirmer).

## Récapitulatif, trié par risque

| # | Point | Risque réel | Constat en une ligne | Correctif proposé |
|---|---|---|---|---|
| 1 | Clé privée VAPID dans le code | **Élevé** | Présente en clair dans `worker.js` depuis le premier commit (17 août), même valeur dans les 76 commits, dépôt public → compromise par principe | Régénérer la paire, clé privée en secret Cloudflare, purge de l'historique inutile |
| 5 | Routes IA sans plafond global | **Élevé** | Quota 10/jour **par code**, mais tout code de 8 à 30 caractères est accepté : quota infini pour un script. Coût jusqu'à ~12 €/h au palier 1 Anthropic, ~240 €/h au palier 2 | Budget global par jour en KV, règle de limitation par IP (dashboard), plafond de dépense Anthropic |
| 11 | Épuisement des écritures KV | **Élevé si plan gratuit** | 1 000 écritures KV par jour sur le plan gratuit : une boucle sur `/etat` ou `/photo` vide ce quota en quelques secondes → plus rien ne se sauvegarde jusqu'au lendemain | Règle de limitation par IP sur `/api/*` ; vérifier le plan (le plan Workers payant porte la limite à 1 M/jour) |
| 4 | Photos de preuve | Moyen | EXIF (dont GPS) bien retirés (réencodage canvas), 380 px max, TTL 90 j, effacées par `/supprimer`. Mais tout contenu texte ≤ 300 000 caractères est accepté sans vérifier que c'est une image ; lecture par quiconque a le code | Vérifier le préfixe `data:image/jpeg;base64,`, borner la taille du corps, `nosniff` |
| 12 | RGPD minimal | Moyen | Aucune mention légale ni politique de confidentialité dans l'app ; **pas trouvé au backlog** malgré ce qui était prévu ; Google Fonts envoie l'adresse IP de chaque utilisatrice à Google | Page « Confidentialité » sobre, police auto-hébergée, ajout au backlog |
| 6 | Validation des entrées | Moyen | Pas de limite de taille du corps des requêtes ; `/etat` réécrit tel quel `histo`, `photosMeta`, `jours`, `pauses` (objets libres, jusqu'à 25 Mo par clé KV) ; `/abonner` accepte n'importe quelle URL d'endpoint | Taille maximale par route, liste blanche des champs, endpoint `https://` obligatoire |
| 2 | Accès par le code duo | Moyen | Code aléatoire : 36¹⁰ ≈ 3,7·10¹⁵ possibilités, indevinable. Code personnalisé : choisi par un humain, devinable par un proche. Aucune séparation des rôles : la coachée peut forger toute action coach, et inversement | Accepté comme limite de l'architecture (duo de confiance, pas d'argent réel) ; renforcer la consigne à la création d'un code personnalisé ; vraie séparation = clés par rôle, chantier à part |
| 9 | En-têtes de sécurité | Faible | Aucun en-tête de sécurité (CSP, nosniff, Referrer-Policy, Permissions-Policy, frame-ancestors). HSTS assuré par le domaine `workers.dev` (préchargé). Aucune ressource en `http:` | Jeu d'en-têtes sur le HTML, le SW et l'API, CSP avec nonce |
| 10 | Dépendances CDN | Faible | React 18.3.1 et ReactDOM épinglés sur cdnjs, **sans intégrité SRI** ; Google Fonts non vérifiable. Aucune dépendance npm dans le dépôt (Playwright global, 1.56.1) | Attributs `integrity` + `crossorigin` sur les deux scripts, police auto-hébergée |
| 3 | Intégrité des champs | Faible | XP, niveau, jours, jokers sont calculés par le client et stockés tels quels ; un client modifié s'attribue des XP. Cagnotte : montants calculés serveur (bien), mais le déclencheur et le plafond viennent du client. Paris : résolus par le client | Accepté (jeu de motivation, la photo reste la preuve) ; bornes de type et de taille avec le point 6 |
| 8 | Réponses trop bavardes | Faible | Rien d'un autre duo, aucun champ interne. Mais `/etat` renvoie tout ce que le client a envoyé, sans liste blanche | Liste blanche des champs (avec le point 6) |
| 7 | Échappement | Aucun correctif | Zéro `dangerouslySetInnerHTML`, zéro `innerHTML`, aucun HTML construit dans le worker (JSON seulement), liens construits avec `encodeURIComponent`, textes push fixes | Rien à faire |
| 2b | Code duo dans l'URL | Faible | Pas dans l'historique du navigateur (appels `fetch`), pas dans le Referer (politique par défaut, même origine). Reste : les journaux Cloudflare **si** « Workers Logs » est activé, et le lien d'invitation `/?code=` (voulu) | Passage en en-tête : gain marginal, ~25 points d'appel à toucher → pas prioritaire |

## 1. Secrets

**État actuel.**

- `ANTHROPIC_API_KEY` : jamais commitée. Vérifié sur les 76 commits (motifs
  `sk-ant-`, affectations de clé, en-tête `x-api-key` avec valeur) : zéro
  occurrence. Elle vit bien côté Cloudflare, comme le dit `CLAUDE.md`.
- **Clé privée VAPID** (signature des notifications push, courbe P-256, format
  PKCS8) : écrite en dur dans `worker.js`, à côté de la clé publique. Elle est
  là depuis le tout premier commit du dépôt (17 août 2026, « Add files via
  upload ») et n'a jamais changé : une seule valeur sur tout l'historique. Le
  dépôt étant public depuis le début, elle est à considérer comme connue de
  tous.
- Ce qu'un tiers peut en faire : signer des jetons VAPID au nom de l'app,
  c'est-à-dire envoyer des notifications aux abonnées **dont il connaît
  l'endpoint**. Les endpoints ne sont lisibles par aucune route (la clé
  `<code>:subs` s'écrit, ne se lit pas) et les pushs n'ont pas de contenu (le
  service worker affiche un texte fixe). L'exploitation réelle est donc
  limitée à du spam de rappels vers des endpoints obtenus autrement. Le
  principe, lui, ne se discute pas : un secret privé dans un dépôt public se
  révoque.
- Identifiant du namespace KV dans `wrangler.jsonc` : pas un secret (inutile
  sans jeton de compte), c'est la pratique normale des Workers Builds.
- Adresse `mailto:levelup@example.com` comme sujet VAPID : pas un secret, mais
  un espace réservé ; certains services push exigent un contact réel.
- Pas de `.gitignore` à la racine : rien n'empêche un futur `.dev.vars` ou
  `.env` de partir dans un commit.

**Risque réel : élevé** (par principe ; exploitation limitée).

**Correctif.**

1. Générer une nouvelle paire VAPID (script Node de 5 lignes avec
   `crypto.subtle`, fourni au temps 2).
2. Clé privée → secret Cloudflare `VAPID_PRIV` (dashboard, comme
   `ANTHROPIC_API_KEY`). Clé publique → reste dans le code, elle est publique
   par définition (le navigateur en a besoin pour s'abonner).
3. Le worker lit `env.VAPID_PRIV` ; sans lui, les routes push répondent
   `503 non_configure` comme les routes IA.
4. **Changement visible à signaler** : les abonnements push existants sont
   signés avec l'ancienne clé publique et deviennent invalides. Les personnes
   qui avaient activé les rappels devront les réactiver (un tap dans les
   réglages). L'app peut le détecter (clé publique de l'abonnement ≠ clé
   courante) et proposer la réactivation.
5. Purger l'historique git est inutile et trompeur : la clé est déjà copiée
   partout où le dépôt a été cloné. La révocation suffit.
6. `.gitignore` racine : `.dev.vars`, `.env*`, `node_modules/`, `.wrangler/`.

## 2. Accès aux données

**État actuel.**

- Le code duo est l'unique capacité : quiconque le connaît lit et écrit
  **tout** (état, photos, négos, paris, cagnotte, pause, rappels,
  abonnements) et peut tout effacer (`/supprimer`). Les deux membres du duo
  ont le même code ; le serveur ne distingue pas les rôles.
- Entropie : code généré = `duo-` + 10 caractères parmi 36 (`a-z0-9`) tirés
  avec `crypto.getRandomValues` (modulo 36 sur un octet : biais de 256 mod 36
  = 4 valeurs légèrement plus fréquentes, négligeable ici). 36¹⁰ ≈ 3,7·10¹⁵
  possibilités, soit ~52 bits : indevinable en ligne, même sans limitation de
  débit. Code personnalisé : 8 caractères minimum, mais choisi par un humain
  (« marie-leo ») : devinable par quelqu'un qui connaît le duo.
- Énumération : aucune route ne liste les codes ; `idx:codes` (les codes
  abonnés aux rappels) n'est lisible par aucune route ; `KV.list` n'est
  appelé que dans `/supprimer` avec le préfixe du code. Lister le KV demande
  un jeton d'API Cloudflare, absent du dépôt.
- Le motif accepté par le worker (`[a-z0-9-]{8,30}`) fait qu'**un code qui
  n'existe pas est traité comme un code valide** : toute chaîne devient un
  espace de stockage et un quota IA (voir 5).
- Le code dans l'URL : les appels sont des `fetch` (jamais dans l'historique
  du navigateur) ; la page elle-même est `/`, donc le Referer envoyé à Google
  Fonts et cdnjs ne contient que l'origine. Côté Cloudflare, les journaux
  Workers ne sont conservés que si « Workers Logs » est activé dans les
  paramètres du Worker (à vérifier ; par défaut, non). Le lien d'invitation
  `/?code=…` finit dans l'historique et dans la messagerie utilisée pour le
  partager : c'est le fonctionnement voulu.
- Séparation des rôles : la coachée peut envoyer `plafond`, `vider`,
  `depenser` sur `/pot`, `resoudre` sur `/paris`, `valider` sur `/pause` ;
  le coach peut réécrire `/etat`. Le paramètre `?coach=1` qui marque « un
  coach est connecté » est posable par n'importe qui.

**Risque réel : moyen.** Duo de confiance, pas d'argent réel (la cagnotte est
un compteur), rien de public. Le vrai enjeu est le code personnalisé faible et
la suppression totale par quiconque a le code.

**Correctif.**

- Code personnalisé : consigne renforcée à la création (« évite prénoms et
  dates »), refus des codes trop simples (un seul mot du dictionnaire, prénom
  seul) — sans changer la règle des 8 caractères.
- Passage du code en en-tête (`X-Code-Duo`) : évaluation faite, gain marginal
  (seuls les journaux Cloudflare optionnels sont concernés) pour ~25 points
  d'appel côté front, le routage du worker et les mocks du harnais. **Pas
  recommandé maintenant.** Si « Workers Logs » est activé, le désactiver ou
  le laisser sur un échantillonnage sans URL suffit.
- Séparation des rôles : impossible sans identité par rôle. La solution
  propre est un secret par rôle (le lien d'invitation porterait une clé
  coach, la coachée garderait la sienne), c'est un chantier « comptes » à
  part entière, hors périmètre ici. À noter au backlog, pas à bricoler.
- `?coach=1` : laisser, c'est un confort d'affichage.

## 3. Intégrité des champs

**État actuel.** L'app est locale d'abord : XP, niveau, historique, jours
actifs, jokers, pauses sont calculés sur le téléphone de la coachée et
**publiés** sur `/etat`, que le coach lit. Le serveur ne recalcule rien et
n'a pas les règles pour le faire (elles sont dans `index.html`). Un client
modifié peut donc publier n'importe quel XP. Cagnotte : les montants (2, 3,
5 €, plafond) sont calculés côté serveur, bien ; mais c'est le client qui
déclenche `manquement` avec un nombre de jours, et n'importe qui avec le
code règle le plafond. Paris : gagné/perdu est décidé par le client.

**Risque réel : faible.** C'est un jeu de motivation entre deux personnes ;
la preuve est la photo, que le coach voit. Tricher revient à se mentir.

**Correctif.** Accepter cette limite, la documenter dans `DECISIONS.md`.
Ce qui se corrige sans changer l'architecture, avec le point 6 : bornes de
type et de taille sur tout ce que `/etat` accepte (XP entier ≤ 10⁶, `histo`
en objets à champs connus, `jours` en clés `AAAA-MM-JJ`). Un recalcul serveur
des XP demanderait de déplacer les règles côté worker : non.

## 4. Photos de preuve

**État actuel.**

- Capture : `<input type="file" accept="image/*" capture="environment">`.
  Avant tout envoi, l'image est redessinée dans un canvas (380 px de grand
  côté maximum) et réencodée en JPEG à 55 % : **les métadonnées EXIF, GPS
  compris, disparaissent** au réencodage. Poids typique : 15 à 40 Ko.
- Stockage : sur le téléphone de la coachée (`localStorage`, data URL) et,
  en duo seulement, dans KV sous `<code>:photo:<id>` avec un TTL de 90
  jours. Le serveur accepte n'importe quelle chaîne jusqu'à 300 000
  caractères, sans vérifier que c'est une image (`data:image/jpeg;base64,`).
- Lecture : `/photo/<id>` pour quiconque a le code, servie en `text/plain`
  avec `cache-control: private, max-age=86400` (le navigateur du coach la
  garde 24 h).
- Suppression : `/supprimer` efface toutes les clés du préfixe, photos
  comprises (vérifié dans le code) ; l'effacement local existe aussi
  (« effacer sur ce téléphone »). Restent après suppression : le cache
  navigateur du coach (≤ 24 h) et le `localStorage` de la coachée tant
  qu'elle n'efface pas localement.
- Chiffrement : celui de Cloudflare au repos ; le contenu est lisible par
  quiconque accède au dashboard KV.

**Risque réel : moyen** (données personnelles, un seul secret pour y accéder,
mais entropie suffisante et rétention courte).

**Correctif.**

- Serveur : exiger le préfixe `data:image/jpeg;base64,`, plafonner le corps
  de la requête (400 Ko), `X-Content-Type-Options: nosniff` sur la réponse.
- Réduire `max-age` du cache coach à 1 h : après un `/supprimer`, la photo
  disparaît vite partout.
- Option, pas proposée pour le temps 2 : chiffrer les photos côté client
  avec une clé dérivée du code (le serveur ne verrait jamais une image en
  clair). Ça protège contre une fuite KV ou un regard sur le dashboard, pas
  contre quelqu'un qui a le code. Coût : moyen ; à décider plus tard.

## 5. Routes IA et coût

**État actuel.**

- `/idees` et `/interpreter` : quota **10 appels par code et par jour**
  (compteur KV à TTL 24 h). Mais le code n'a pas besoin d'exister : un script
  qui change de code à chaque requête n'a aucun quota. Aucune limitation par
  IP, ni dans le code, ni (a priori) dans le dashboard.
- Entrées bornées : objectif ≤ 300 caractères, contexte ≤ 80, styles en
  liste fermée. Sorties bornées par le schéma (structured outputs) et
  `max_tokens` (700 et 200). Modèle `claude-haiku-4-5` : 1 $ le million de
  jetons en entrée, 5 $ en sortie.
- Coût par appel, au pire : `/idees` ≈ 450 jetons entrés + 700 sortis
  ≈ 0,004 $ ; `/interpreter` ≈ 350 + 200 ≈ 0,0014 $.
- Coût par heure si quelqu'un boucle, borné par le palier Anthropic du
  compte : palier 1 (50 requêtes/min) ≈ 12 $/h sur `/idees` ; palier 2
  (1 000/min) ≈ 240 $/h. Sur 24 h, le plan Workers gratuit (100 000
  requêtes/jour) plafonne à ~400 $/jour. Nuance : sur le plan gratuit, la
  1 001ᵉ écriture KV du jour échoue, donc l'appel IA passe puis la route
  répond 500 : le vrai plafond journalier est ~1 000 appels payés (~4 $),
  mais toute l'app est bloquée en écriture le reste de la journée.

**Risque réel : élevé** (le dépôt public montre les routes ; aucune barrière
au-delà d'un code libre).

**Correctif** (par ordre d'efficacité).

1. **Budget global par jour** dans KV : `quota:idees:<date>` et
   `quota:interp:<date>`, par exemple 150 et 100 appels pour toute l'app,
   `429 quota` au-delà. Une écriture KV par appel réussi, comme aujourd'hui.
2. **Quota par code seulement pour les codes qui existent** : n'accorder le
   quota qu'aux codes ayant déjà une clé `etat` ou `profil`. Les profils solo
   ne publiant pas d'état, ajouter une route `POST /profil` appelée à la
   création (une clé `<code>:profil` minuscule), et n'autoriser l'IA qu'aux
   codes enregistrés. Un bot doit alors créer un profil par code : ça ne
   coûte rien, mais ça se limite par IP (point suivant) et, si besoin un
   jour, par Turnstile (point 11).
3. **Règle de limitation de débit Cloudflare** par IP sur
   `/api/*/idees` et `/api/*/interpreter` (dashboard, 1 règle incluse dans
   le plan gratuit ; marche à suivre écran par écran au temps 2).
4. **Plafond de dépense Anthropic** : clé d'API dans un espace de travail
   dédié à Level Up, limite mensuelle (par exemple 10 $) dans la console.
   C'est le vrai filet : même si tout le reste échoue, la facture s'arrête.
5. Corps de requête plafonné (2 Ko) sur ces deux routes.

## 6. Validation des entrées

**État actuel, route par route** (ce qui est vérifié / ce qui manque).

| Route | Vérifié | Manque |
|---|---|---|
| `/negos` | actions en liste fermée, `label` ≤ 140, `mot` ≤ 200, niveau 1-40, `type` normalisé, liste ≤ 50 | `id` non borné (chaîne libre) |
| `/etat` | XP entier ≥ 0, `adresse` en liste, `jokersMois` 0-9, tableaux tronqués (30, 30, 40, 5) | **contenu** des éléments libre (objets de toute forme et de toute taille), pas de limite de taille du corps |
| `/photo` | `id` ≤ 40, `data` ≤ 300 000 caractères | préfixe image non vérifié, `id` non filtré à l'écriture (il l'est à la lecture) |
| `/idees` | styles en liste, contexte ≤ 80, sortie par schéma | corps non plafonné |
| `/interpreter` | objectif 8-300, sortie par schéma et listes fermées | corps non plafonné |
| `/supprimer` | — | aucune confirmation serveur (voulu : les deux membres peuvent) |
| `/rappels` | booléen | rien |
| `/pot` | montants bornés, note ≤ 60, historique ≤ 30 | rien de grave |
| `/pause` | durée 1-14, motif ≤ 80 | rien |
| `/paris` | type en liste, durée 3-21, mises ≤ 120, liste ≤ 30 | `id` non borné |
| `/abonner` | endpoint présent, 4 abonnements max | **endpoint non vérifié** : n'importe quelle URL, que le worker appellera en POST à chaque cron (SSRF vers l'Internet public, sous-requêtes gaspillées) ; objet `sub` stocké tel quel |
| toutes | JSON invalide → 400 | **aucune limite de taille du corps** : `req.json()` avale jusqu'à la limite Workers ; une clé KV accepte 25 Mo |

**Injection dans les prompts.** `/interpreter` : l'objectif libre part en
message utilisateur, la sortie est contrainte à deux listes fermées ; au
pire, une classification fausse. `/idees` : le `contexte` (≤ 80 caractères)
est **concaténé dans le prompt système** ; il peut infléchir le ton des
libellés (sortie bornée à 8 libellés de 55 caractères). Risque faible, mais
facile à corriger : le contexte passe dans le message utilisateur, les règles
restent seules dans le système.

**Risque réel : moyen** (surtout la taille libre et l'endpoint push).

**Correctif.** Une fonction `lireJson(req, maxOctets)` unique (vérifie
`content-length` et la longueur réelle, 400 au-delà) avec un plafond par
route (64 Ko `/etat`, 400 Ko `/photo`, 2 Ko ailleurs) ; liste blanche des
champs de chaque élément d'`histo`, `photosMeta`, `jours`, `pauses` ; `id`
filtrés par `[\w-]{1,40}` partout ; `/abonner` : endpoint `https://`
obligatoire, `keys.p256dh` et `keys.auth` en chaînes ≤ 200, rien d'autre
conservé ; contexte d'`/idees` déplacé dans le message utilisateur.

## 7. Échappement

**État actuel.** React échappe tout par défaut et l'app ne le contourne
jamais : zéro `dangerouslySetInnerHTML`, zéro `innerHTML`, zéro `eval` ou
`document.write`. Le worker ne construit aucun HTML : il sert une chaîne
statique et des réponses JSON. Les liens construits (recherche YouTube,
lien d'invitation) passent par `encodeURIComponent`. Les textes de
notification push sont fixes dans le service worker. Le partage (`navigator.share`)
n'accepte que du texte.

**Risque réel : aucun.** Rien à corriger ; la CSP du point 9 ajoute un filet.

## 8. Réponses

**État actuel.** Chaque route ne lit que les clés du code demandé : aucune
donnée d'un autre duo ne peut sortir. Aucun champ interne. Deux remarques :
`/etat` renvoie exactement ce que le client a publié, sans liste blanche (si
demain le client y glisse un champ sensible, il ressort) ; le message
d'erreur « KV manquant : lier un namespace sous le nom NEGOS » nomme la
liaison (sans importance). Les réponses JSON n'ont pas de
`cache-control`, le navigateur ne les met pas en cache pour autant.

**Risque réel : faible.** Correctif : liste blanche des champs (point 6),
`cache-control: no-store` sur l'API.

## 9. En-têtes et transport

**État actuel.** Le worker ne pose **aucun** en-tête de sécurité. HTTPS :
`*.workers.dev` est dans la liste de préchargement HSTS des navigateurs,
donc HSTS est effectif même sans en-tête ; aucune ressource ne charge en
`http:` (vérifié : seules les URL `http://www.w3.org/2000/svg` des icônes
SVG, qui sont des espaces de noms, pas des chargements). CORS : aucun
en-tête `Access-Control-Allow-Origin`, donc l'API n'est lisible qu'en même
origine, ce qui est le bon réglage. Le service worker n'a pas de cache.

**Risque réel : faible** (pas de HTML injectable, pas de cookies), mais le
correctif est bon marché et protège l'avenir.

**Correctif** (sur le HTML, `/sw.js` et l'API) :

- `Content-Security-Policy` : `default-src 'self'` ; `script-src 'self'
  'nonce-<aléa>' https://cdnjs.cloudflare.com` (le worker pose un nonce sur
  les scripts en ligne à chaque réponse) ; `style-src 'self' 'unsafe-inline'
  https://fonts.googleapis.com` (les styles React sont en ligne) ;
  `font-src https://fonts.gstatic.com` ; `img-src 'self' data: blob:` ;
  `media-src data:` (les bips sont des WAV en data URI) ; `connect-src
  'self' data: blob:` (le partage relit les photos par `fetch` d'une data
  URL) ; `worker-src 'self'` ; `frame-ancestors 'none'` ; `base-uri 'none'` ;
  `form-action 'self'` ; `object-src 'none'`. Si la police est auto-hébergée
  (point 10), les deux entrées Google disparaissent.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy: camera=(),
  microphone=(), geolocation=(), payment=()` (la capture photo passe par
  l'appareil photo du système, pas par `getUserMedia`, donc rien ne casse),
  `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`.
- API : `nosniff`, `cache-control: no-store`.
- HSTS explicite (`max-age=31536000; includeSubDomains`) : inutile sur
  `workers.dev`, à poser le jour d'un domaine personnalisé.
- Test : `worker.js` est un module ES importable dans Node 22 avec un faux
  KV ; un `outils/worker.test.js` vérifiera en-têtes, validation et quotas
  sans navigateur. Le harnais Playwright, lui, teste le front sur le mock ;
  la CSP y sera rejouée pour s'assurer qu'elle ne casse rien (polices,
  data URI, service worker).

## 10. Dépendances

**État actuel.**

- Chargé depuis un CDN : `react` 18.3.1 et `react-dom` 18.3.1 (cdnjs,
  versions épinglées, **sans `integrity` ni `crossorigin`**) ; feuille de
  style Google Fonts (Space Grotesk), par nature non épinglable.
- npm : aucun `package.json` ni lockfile dans le dépôt ; le harnais utilise
  le Playwright global du conteneur (1.56.1) et les modules natifs de Node.
  Il n'y a donc rien à auditer, et rien non plus qui fige la version de
  Playwright pour qui rejoue les tests ailleurs.
- Les copies de React du harnais (`outils/tests/react*.min.js`) ont été
  hachées (SHA-384) ; si elles viennent bien de cdnjs ou de npm, ce sont
  les empreintes SRI à poser. À confirmer au temps 2 avec un accès à cdnjs
  (les empreintes sont aussi affichées sur la page cdnjs de chaque fichier).

**Risque réel : faible** (cdnjs est opéré par Cloudflare, versions figées).

**Correctif.** SRI + `crossorigin="anonymous"` sur les deux scripts ; police
Space Grotesk auto-hébergée (fichiers WOFF2 sous licence OFL servis par le
worker ou incorporés en data URI, ~60 Ko) : supprime le tiers Google, le
`preconnect`, et deux entrées de CSP ; noter la version de Playwright dans
`outils/tests/LISEZMOI.md`.

## 11. Bots

**État actuel.** La création de profil est entièrement locale (aucune
requête serveur) : rien à protéger là. Le serveur ne découvre un code qu'à
sa première écriture. Ce qui s'expose aux bots : les routes IA (coût, point
5) et toutes les écritures KV (quota du plan gratuit, point 5). Il n'y a ni
Turnstile, ni règle WAF, ni limitation de débit.

**Risque réel : élevé si plan gratuit** (déni de service par épuisement des
1 000 écritures KV/jour), sinon moyen (coût IA).

**Correctif, sans friction.**

1. Règle de limitation de débit Cloudflare par IP : `/api/*` à 60
   requêtes/minute et les deux routes IA à 6/minute (une règle incluse dans
   le plan gratuit ; les deux se combinent dans une seule règle à seuil
   unique, ou deux règles sur le plan payant). Marche à suivre au temps 2.
2. Budget global IA (point 5) et route `/profil` d'enregistrement.
3. Turnstile en mode « géré » (invisible dans la plupart des cas) sur les
   routes IA seulement : faisable (clé de site publique dans `index.html`,
   secret côté Cloudflare, vérification `siteverify` dans le worker). À
   garder en réserve si les deux premières mesures ne suffisent pas ; ce
   n'est pas proposé pour le temps 2.
4. Vérifier le plan Workers : le plan payant (5 $/mois) porte les écritures
   KV à 1 M/jour et les requêtes à 10 M/mois, ce qui change la nature du
   risque 11.

## 12. RGPD minimal

**État actuel.**

- Aucune mention légale, aucune politique de confidentialité, aucun contact
  dans l'app ni dans le dépôt (`grep` sur confidentialité, mentions légales,
  RGPD, données personnelles : zéro résultat dans `index.html`, `BACKLOG.md`
  et `DECISIONS.md`). **Le point n'est pas au backlog** contrairement à ce
  qui était prévu : il est à y ajouter.
- Droit à l'effacement : `/supprimer` efface toutes les clés du duo, photos
  et abonnements push compris (vérifié). L'effacement local existe. Ce qui
  reste : le cache navigateur du coach (≤ 24 h, point 4) et les données
  locales de l'autre membre du duo (chacun efface les siennes).
- Données traitées : prénom, préférence elle/il/neutre, photos de preuve
  (données personnelles, potentiellement de santé au sens large : une
  personne à l'entraînement), XP et historique, endpoints push, cagnotte.
  Conservation serveur : 90 jours pour les photos, sans limite pour le
  reste tant que le code vit.
- Google Fonts : chaque ouverture de l'app envoie l'adresse IP de
  l'utilisatrice aux serveurs de Google, sans consentement. En Europe, c'est
  précisément le cas jugé (tribunal de Munich, 2022). L'auto-hébergement
  (point 10) règle le sujet.

**Risque réel : moyen** (exposition juridique faible pour une app de cette
taille, mais le dépôt et l'app sont publics, et le correctif est simple).

**Correctif.** Une page « Confidentialité » dans les réglages (qui est
responsable, quelles données, où, combien de temps, comment effacer, un
contact) ; la même en `CONFIDENTIALITE.md` dans le dépôt ; la phrase « tes
photos restent entre vous deux, effaçables à tout moment » à l'onboarding ;
police auto-hébergée ; ajout au backlog avec ce qui manque encore (mentions
légales complètes si ouverture au public, registre des traitements
minimal).

## Constats hors sécurité, vus en passant

- `idx:codes` (les codes abonnés aux rappels) est tronqué aux 200 derniers :
  au-delà de 200 duos abonnés, les plus anciens ne reçoivent plus de rappel
  et ne s'en rendent pas compte.
- Le sujet VAPID est une adresse d'exemple ; à remplacer par un vrai contact
  quand la paire sera régénérée.

## Temps 2 — fait (v20.4)

Huit commits sur la branche, par thème, chacun avec ses tests. Sept étaient
prévus ; le huitième (limitation de débit par IP dans le worker) remplace la
règle de dashboard, impossible sur `workers.dev` (voir plus bas).

| Commit | Ce qui a changé | Tests |
|---|---|---|
| `sécurité : secrets` | clé privée VAPID hors du code (`VAPID_PRIV`), clé publique et contact injectés dans la page (`VAPID_PUB`, `CONTACT`), `503` sans secret, carte « On a renforcé la sécurité de l'app. Réactive tes rappels en un tap », `outils/vapid.js`, `.gitignore` | `worker.test.js` (jeton VAPID vérifié avec la clé publique, aucun secret dans le source), suite 06 |
| `sécurité : routes IA` | un code inconnu = 0 appel (`/profil`, `403 code_inconnu`), 10/jour par code puis budget journalier de toute l'app (150 idées, 100 lectures, `429 budget`), corps ≤ 2 Ko, contexte hors du prompt système, messages clairs | `worker.test.js`, suite 06 (enregistrement au démarrage une seule fois, messages, enregistrement à la volée sur 403) |
| `sécurité : validation des entrées` | `lireJson` avec plafond par route (`413`), liste blanche des champs de `/etat`, identifiants `[\w-]{1,40}`, `/abonner` limité à Apple / Google (FCM) / Mozilla et aux champs utiles, `no-store` sur le JSON | `worker.test.js`, suite 06 (service refusé, dit simplement) |
| `sécurité : photos` | JPEG base64 seulement, identifiant filtré, corps ≤ 400 Ko, `nosniff`, cache privé 1 h | `worker.test.js` (dont `/supprimer` efface les photos) |
| `sécurité : en-têtes et police auto-hébergée` | CSP à nonce, nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options, COOP ; SRI sur React ; Space Grotesk servie par le worker, Google Fonts retiré | `worker.test.js`, suite 06 (CSP réelle rejouée par le mock : aucune violation, aucune requête vers un tiers), `sync.test.js` |
| `sécurité : confidentialité` | page « Confidentialité et mentions légales » depuis les Réglages, `CONFIDENTIALITE.md`, phrase d'onboarding | suite 06 |
| `sécurité : limitation de débit par IP` | compteur par IP en mémoire : 120 écritures/min, 6/min sur l'IA et `/profil`, `429 trop_vite` | `worker.test.js` |
| `docs` | `DECISIONS.md`, `CLAUDE.md` (v20.4), `BACKLOG.md`, ce fichier | harnais complet |

État des douze points de l'audit après le temps 2 :

| # | Point | État |
|---|---|---|
| 1 | Secrets | fait (reste : coller les valeurs dans le dashboard, voir ci-dessous) |
| 2 | Accès aux données | accepté et documenté ; séparation des rôles au backlog, priorité haute |
| 3 | Intégrité des champs | accepté (XP côté client) ; bornes posées |
| 4 | Photos | fait ; chiffrement côté client au backlog |
| 5 | Routes IA et coût | fait dans le code (les quatre correctifs) ; reste le plafond de dépense Anthropic, côté console |
| 6 | Validation | fait |
| 7 | Échappement | rien à faire |
| 8 | Réponses | fait (liste blanche, `no-store`) |
| 9 | En-têtes | fait ; HSTS explicite le jour d'un domaine à soi |
| 10 | Dépendances | fait (SRI, police auto-hébergée) |
| 11 | Bots | limitation de débit dans le worker + budget ; Turnstile en réserve au backlog ; reste : vérifier le plan Workers |
| 12 | RGPD minimal | fait pour l'usage personnel ; mentions complètes au backlog si ouverture au public |

Changements visibles pour les utilisatrices : la carte de réactivation des
rappels (une fois, pour qui les avait activés), la page « Confidentialité »
et la phrase d'onboarding, les messages de quota (« pour toute l'app »,
« réessaie dans une minute »), et « Ce service de notifications n'est pas
encore accepté par l'app » pour Edge sur Windows. Rien d'autre.

## Ce qui reste de ton côté (dashboard Cloudflare, console Anthropic)

Les libellés du dashboard sont ceux de l'interface en anglais ; en français,
ils sont traduits mot à mot. Si un écran a bougé, le nom de la section reste
le repère.

### 1. La paire de clés push (obligatoire, sinon les rappels sont indisponibles)

1. Sur ton ordinateur, dans le dossier du dépôt à jour : `node outils/vapid.js`
   (Node 18 ou plus). Le script affiche deux lignes, `VAPID_PUB` et
   `VAPID_PRIV`. Ne les colle nulle part ailleurs que dans le dashboard.
2. Dashboard Cloudflare → **Workers & Pages** → **level-up** → onglet
   **Settings** → section **Variables and Secrets** → **Add**.
3. Première entrée : **Type** `Secret`, **Variable name** `VAPID_PRIV`,
   **Value** la valeur affichée par le script → **Save** (ou **Deploy** si le
   bouton le propose).
4. Deuxième entrée : **Type** `Text`, **Variable name** `VAPID_PUB`, la valeur
   affichée → **Save**.
5. Troisième entrée, facultative mais recommandée : **Type** `Text`,
   **Variable name** `CONTACT`, ton adresse de contact (elle apparaît sur la
   page Confidentialité et sert de sujet VAPID auprès des services push) →
   **Save**.
6. Si le dashboard propose **Deploy** après l'ajout, accepte : les variables
   ne sont prises en compte qu'au déploiement suivant. Sinon, le prochain
   déploiement (le merge) les appliquera.
7. Vérification : ouvre l'app → **Réglages** → active **Rappel du soir** →
   « Rappel du soir activé ». Sur un téléphone qui avait déjà les rappels, la
   carte « On a renforcé la sécurité de l'app… » apparaît en haut : un tap.
8. L'ancienne clé n'a rien à révoquer nulle part : une clé VAPID n'est
   enregistrée chez personne, la remplacer la rend inutile.
9. Ferme le terminal où le script a affiché les valeurs.

### 2. Le plafond de dépense Anthropic (le vrai filet)

1. Console Anthropic (console.anthropic.com) → menu **Settings** →
   **Limits** (le nom exact varie : « Spend limits », « Usage limits »).
2. Pose une **limite mensuelle** basse, par exemple 10 $ : au-delà, l'API
   refuse, l'app se replie (programme équilibré, idées indisponibles) et le
   dit ; rien ne casse.
3. Mieux, si la console le propose : crée un **Workspace** dédié « level-up »
   (**Settings** → **Workspaces** → **Create**), avec sa propre limite, puis
   une **API key** dans ce workspace (**API keys** → **Create key**), et
   remplace le secret `ANTHROPIC_API_KEY` du Worker par cette clé (même écran
   **Variables and Secrets** qu'au point 1, **Edit** sur la ligne). L'ancienne
   clé se révoque ensuite dans la console (**API keys** → la clé → **Disable**
   ou **Delete**).

### 3. Limitation de débit : pourquoi elle est dans le worker

Les **Rate limiting rules** du dashboard vivent dans la section **Security**
→ **WAF** d'une **zone**, c'est-à-dire d'un domaine que tu as ajouté à
Cloudflare. Un sous-domaine `*.workers.dev` n'est pas une zone : la section
n'existe pas pour lui. C'est pour ça que le huitième commit met la limitation
dans le worker (compteur par IP en mémoire, 120 écritures/min, 6/min sur
l'IA et `/profil`).

Le jour où l'app a un domaine à toi (**Workers & Pages** → **level-up** →
**Settings** → **Domains & Routes** → **Add** → **Custom domain**), la règle
de dashboard devient possible et plus solide (elle s'applique avant le
worker) :

1. Dashboard → ton domaine → **Security** → **WAF** → onglet **Rate limiting
   rules** → **Create rule**.
2. **Rule name** : `api-ecritures`.
3. **If incoming requests match** : passe en **Edit expression** et colle
   `(http.request.uri.path contains "/api/") and (http.request.method eq "POST")`.
4. **With the same characteristics** : `IP` (par défaut).
5. **When rate exceeds** : **Requests** `120`, **Period** `1 minute`.
6. **Then take action** : `Block`, **For duration** `1 minute` (ou
   `Managed Challenge`, moins brutal).
7. **Deploy**. Le plan gratuit inclut une règle ; une seconde, plus stricte
   sur `/idees`, `/interpreter` et `/profil` (6 par minute), demande le plan
   Pro. Sur le plan gratuit, garde la première : le worker fait déjà la
   seconde.
8. Au même moment, ajoute HSTS : dans `worker.js`, `ENTETES_COMMUNS`, une
   ligne `"strict-transport-security": "max-age=31536000; includeSubDomains"`
   (sur `workers.dev` elle est inutile, le domaine est préchargé).

### 4. Trois vérifications, cinq minutes

1. **Le plan Workers** : **Workers & Pages** → **Plans**. Sur le plan gratuit,
   KV accepte 1 000 écritures par jour pour toute l'app ; chaque séance
   publiée, chaque photo, chaque négo en consomme une. Dès que vous êtes plus
   de quelques duos actifs, le plan payant (5 $/mois, 1 M d'écritures/jour)
   s'impose, et il enlève le risque de déni de service par épuisement du
   quota.
2. **Workers Logs** : **level-up** → **Settings** → **Observability** (ou
   **Logs**). S'il est activé, les URL des requêtes (donc les codes duo) sont
   conservées quelques jours. Laisse-le désactivé, ou active-le le temps d'un
   diagnostic puis coupe-le.
3. **Le déploiement** : après le merge, **level-up** → **Deployments** montre
   la version ; ouvre l'app, **Réglages** → **Confidentialité et mentions
   légales** doit afficher ton adresse de contact (sinon la variable
   `CONTACT` n'est pas prise en compte : redéploie).

### 5. En réserve

- **Turnstile** (Cloudflare → **Turnstile** → **Add site**, mode
  **Managed**) sur les routes IA et `/profil`, si le budget journalier et la
  limitation de débit ne suffisent pas. Demande une clé de site (publique,
  dans `index.html`) et un secret (`TURNSTILE_SECRET`, dashboard), plus une
  vérification `siteverify` dans le worker. Au backlog.
- **Edge sur Windows** : `/abonner` refuse les services hors Apple / Google /
  Mozilla ; l'app le dit. Si une utilisatrice le demande, ajouter
  `*.notify.windows.com` à `HOTES_PUSH` (avec une vérification de suffixe).


---

# Passage 2 (v20.12) — sauvegardes et traçabilité

## Sauvegarde du KV

Chaque nuit à 3 h (cron `0 3 * * *`), le worker lit **tout** le namespace
`LEVELUP` (profils, états, historiques, négos, paris, cagnottes, pauses,
abonnements, index, photos, journal) et dépose un fichier
`sauvegarde-AAAA-MM-JJ.json` dans le bucket R2 **`level-up-sauvegardes`**
(liaison `SAUVEGARDES` dans `wrangler.jsonc`). Format : `{ version: 1,
date, cles, donnees: { "<clé KV>": "<valeur telle quelle>" } }` — les valeurs
sont des chaînes copiées octet pour octet, une photo de 240 Ko reste une
photo de 240 Ko. Le même cron supprime les fichiers de plus de **30 jours**.
Le journal note chaque sauvegarde (nombre de clés, taille, fichiers purgés).

Repli si R2 n'est pas utilisable (plan, région, refus du bucket) : lier un
**second namespace KV** sous le nom `SAUVEGARDES_KV` ; le cron y écrit une
entrée par duo (`sauvegarde:<date>:<code>`, plus `sauvegarde:<date>:_index`)
avec un TTL de 30 jours qui fait la purge tout seul (une valeur KV est bornée
à 25 Mo, d'où le découpage par duo). Sans aucune des deux liaisons, rien
n'est écrit et le journal dit `sauvegarde_non_configuree`.

**À vérifier dans le dashboard après déploiement** (Workers & Pages →
level-up) :

1. **Settings → Bindings** : une ligne **R2 bucket**, variable `SAUVEGARDES`,
   bucket `level-up-sauvegardes`. Si elle manque, Workers Builds a refusé
   `wrangler.jsonc` : ouvre **Deployments** → le dernier build → le log dit
   « bucket not found » (nom différent de `level-up-sauvegardes` : renomme le
   bucket ou corrige `wrangler.jsonc`) ou « R2 not enabled » (active R2 dans
   le menu **R2 Object Storage**, plan gratuit : 10 Go).
2. **Settings → Triggers → Cron Triggers** : quatre expressions, dont
   `0 3 * * *`.
3. **Settings → Variables and Secrets** : `ADMIN_TOKEN` (type Secret, une
   chaîne longue et aléatoire : `openssl rand -base64 32`).
4. Le lendemain matin : **R2 Object Storage → level-up-sauvegardes** →
   un objet `sauvegarde-<date>.json`. Sa taille doit correspondre à peu
   près aux photos stockées (compte 250 Ko par photo).
5. `curl -H "x-admin-token: <ADMIN_TOKEN>" https://<ton-worker>/admin/journal`
   → une entrée `"ev":"sauvegarde"` avec `cles` et `octets`. Si tu vois
   `sauvegarde_non_configuree`, la liaison n'est pas prise : redéploie.

Limites connues : un cron a le même budget CPU qu'une requête ; l'export est
surtout de l'attente réseau (une lecture KV par clé), ce qui tient largement
pour quelques duos. Au-delà de quelques centaines de photos, le fichier
dépasse le Mo par dizaines : R2 s'en moque, mais surveille le temps du cron
dans **Observability** le jour où l'app s'ouvre.

## Restauration

Le script est `outils/restaurer.js`. Il ne supprime jamais rien : il ajoute
et écrase les clés qu'il restaure, une clé absente de la sauvegarde reste en
l'état.

**1. Récupérer la sauvegarde.** Sur ton ordinateur, dans le dépôt, avec
`wrangler` connecté (`npx wrangler login`) :

```
npx wrangler r2 object get level-up-sauvegardes/sauvegarde-2026-09-10.json --file sauvegarde.json
```

ou depuis le dashboard : **R2 → level-up-sauvegardes → l'objet → Download**.
Avec le repli KV : `npx wrangler kv key list --namespace-id=<ID_SAUVEGARDES_KV>
--prefix "sauvegarde:2026-09-10:"` puis `kv key get` sur chaque groupe ;
`assemblerDepuisKV` du script recompose un fichier version 1 (voir les tests).

**2. Restaurer un profil précis** (le duo `duo-xxxxxxxxxx`) :

```
node outils/restaurer.js sauvegarde.json --code duo-xxxxxxxxxx --bulk restauration.json
npx wrangler kv bulk put --namespace-id=b01ca4e9f02549828073664575d5eaf8 restauration.json
```

(l'identifiant du namespace est celui de `wrangler.jsonc`). Le script dit
combien de clés il a préparées ; `wrangler` confirme l'écriture.

**3. Restaurer tout le namespace** : même commande sans `--code`. À faire
sur un namespace vide ou après un incident ; sur un namespace vivant, les
clés plus récentes que la sauvegarde sont écrasées par leur version de la
sauvegarde (c'est le but), les clés créées depuis restent.

**4. Sans `wrangler`, par l'API Cloudflare** (jeton créé dans **My Profile →
API Tokens → Create Token → Edit Cloudflare Workers** ou un jeton
personnalisé avec `Workers KV Storage: Edit`) :

```
node outils/restaurer.js sauvegarde.json [--code duo-xxxxxxxxxx] \
  --compte <ACCOUNT_ID> --namespace b01ca4e9f02549828073664575d5eaf8 --jeton <CF_API_TOKEN>
```

Le script écrit par paquets de 5 000 clés (`PUT …/storage/kv/namespaces/<id>/bulk`).

**5. Vérifier** : ouvrir l'app avec le code restauré (Suivi côté coach, ou
`curl https://<ton-worker>/api/<code>/etat`) ; les photos se rouvrent depuis
l'onglet Progrès. Pour comparer octet pour octet : `npx wrangler kv key get
--namespace-id=… "<code>:etat"` et la valeur `donnees["<code>:etat"]` du fichier
doivent être identiques (`diff <(…) <(…)`).

**6. Le test réel.** La procédure a été jouée de bout en bout le
10 septembre 2026 dans le vrai runtime Workers (workerd, via Miniflare, KV et
R2 réels en local) par `outils/sauvegarde.e2e.js` : six clés dont une photo
de 240 023 octets, accents et emoji dans une négo → cron `0 3 * * *` → objet
`sauvegarde-2026-09-10.json` (240 989 octets) → suppression de toutes les clés
→ restauration d'un seul duo (ses 5 clés, rien d'autre) → restauration
complète → **identique octet pour octet** à l'état d'avant. Le même
enchaînement tourne sur faux KV et faux R2 dans `outils/worker.test.js`
(purge à 31 jours, conservation à 29, repli KV, format bulk). Pour rejouer le
test réel : `npm i --no-save miniflare@4 && node outils/sauvegarde.e2e.js`.
Ce qui n'a pas pu être testé d'ici : le compte Cloudflare lui-même
(liaison, quota R2) — d'où la liste de vérifications ci-dessus, et une
restauration d'essai à faire une fois sur un code de test dès la première
sauvegarde en place.

## Journal des actions critiques

Clé KV `journal:AAAA-MM` (2 000 entrées au plus par mois), écrite par le
worker au moment de l'action, sans donnée sensible : `{ t: horodatage ISO,
ev, duo: "duo-…" (quatre caractères), montant: <plafond seulement> }`.
Événements : `suppression` (`/supprimer`), `plafond` et `cagnotte_videe`
(`/pot`), `nego_acceptee` / `nego_refusee` (`/negos`), `pari_accepte` /
`pari_refuse` / `pari_resolu` (`/paris`), `pause_validee` / `pause_refusee`
(`/pause`), `programme` (déclaré par l'app via `POST /api/<code>/journal`, le
seul événement qu'elle a le droit de déclarer : l'adoption ou le changement de
programme se décide dans le téléphone), `sauvegarde`,
`sauvegarde_non_configuree`. Jamais un libellé, un motif, un montant de
cagnotte, un code complet. La suppression d'un duo ne touche pas au journal.

Lecture : `GET /admin/journal?mois=AAAA-MM` avec l'en-tête `x-admin-token:
<ADMIN_TOKEN>` (comparaison en temps constant ; le jeton dans l'URL ne compte
pas ; 10 essais par minute et par IP ; `404` tant que le secret n'est pas
posé, `401` sinon ; `no-store`, `nosniff`, lecture seule).

```
curl -s -H "x-admin-token: $ADMIN_TOKEN" "https://<ton-worker>/admin/journal?mois=2026-09" | jq .
```

## CORS — la configuration exacte

Dans `worker.js`, pour `/api/…` et `/admin/…` :

```
origine autorisée   = url.origin (l'origine du worker lui-même : https://level-up.<compte>.workers.dev,
                       ou ton domaine le jour venu) — aucune autre, aucun joker, aucune liste
requête avec Origin ≠ url.origin       → 403 {"erreur":"origine"}, rien n'est lu ni écrit
OPTIONS (pré-vol) depuis url.origin    → 204
    access-control-allow-origin: <url.origin>
    access-control-allow-methods: GET, POST, OPTIONS
    access-control-allow-headers: content-type, x-admin-token
    access-control-max-age: 600
    vary: origin
OPTIONS depuis une autre origine       → 403, sans en-tête allow-origin
réponses de l'API                      → access-control-allow-origin: <url.origin> ; vary: origin
jamais                                 → access-control-allow-credentials, « * »
```

Une requête sans en-tête `Origin` (navigation, `curl`, le service worker en
même origine) passe : c'est le comportement des navigateurs pour la même
origine. Vérifié par `outils/worker.test.js` (pré-vol, écriture et lecture
depuis `https://evil.example` → 403 ; même origine → 200 avec l'origine
exacte) et par le test de bout en bout.

## Dépendances : `npm audit`

`package.json` et `package-lock.json` sont désormais dans le dépôt. L'app
elle-même n'a **aucune** dépendance npm (React vient de cdnjs avec SRI, le
worker et le moteur sont sans import). La seule entrée est celle du
harnais : `playwright` **1.56.1**, figée (pas de `^`), soit trois paquets
résolus dans le lockfile (`playwright`, `playwright-core`, `fsevents`
optionnel).

Rapport du 10 septembre 2026, `npm audit` (registre npm, Node 22.22.2) :
**0 vulnérabilité** (info, low, moderate, high, critical : 0). `miniflare`,
utilisé pour le test de bout en bout, est installé à la demande
(`--no-save`) et reste hors du lockfile. À refaire à chaque changement de
version de Playwright et à chaque rotation (calendrier ci-dessous) : `npm
audit` dans le dépôt.

## Rotation des secrets — calendrier et procédures

Tous les 90 jours, ensemble. Premier tour : **9 septembre 2026** (pose des
secrets). **Prochaine échéance : 8 décembre 2026**, puis 8 mars 2027,
6 juin 2027, 4 septembre 2027 — note-les dans ton agenda, l'app ne le
rappellera pas.

| Secret | Où | Procédure | Effet visible |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | console Anthropic + dashboard Workers | 1. Console Anthropic → **API keys** → **Create key** (dans le workspace level-up). 2. Dashboard → level-up → **Settings → Variables and Secrets** → `ANTHROPIC_API_KEY` → **Edit** → coller → **Deploy**. 3. Vérifier : **Générer des idées** dans l'app → des idées, pas « non configurée ». 4. Console → l'ancienne clé → **Disable**, puis **Delete** au tour suivant. | aucun pendant la bascule (le worker relit le secret à chaque requête) |
| Paire VAPID (`VAPID_PRIV`, `VAPID_PUB`) | `node outils/vapid.js` + dashboard | 1. `node outils/vapid.js` → deux valeurs. 2. Dashboard → `VAPID_PRIV` (Secret) et `VAPID_PUB` (Text) → **Edit** → **Deploy**. 3. Fermer le terminal. | les abonnements pris avec l'ancienne clé ne valent plus rien : chaque téléphone voit la carte « On a renforcé la sécurité de l'app. Réactive tes rappels en un tap » — c'est prévu (v20.4), un tap |
| `ADMIN_TOKEN` | dashboard | 1. `openssl rand -base64 32`. 2. Dashboard → `ADMIN_TOKEN` (Secret) → **Edit** → **Deploy**. 3. Mettre à jour la valeur là où tu la gardes (gestionnaire de mots de passe), jamais dans le dépôt. 4. Vérifier avec le `curl` de la section Journal. | aucun pour les utilisatrices |

Hors calendrier, tourner **immédiatement** : une clé aperçue dans un log, un
écran partagé, un dépôt ou un terminal ; un appareil perdu qui avait accès au
dashboard ; le jeton API Cloudflare utilisé pour une restauration, à
**supprimer** dès la restauration finie (**My Profile → API Tokens**).
