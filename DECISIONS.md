# Journal des décisions — Level Up!

Une ligne par décision, avec la raison. Format : `date — décision — pourquoi`.
Objectif : ne pas se refaire proposer six mois plus tard un truc déjà écarté.

---

## v19.16 — août 2026

- **Écran Séance : accordéon avec un seul exercice déployé à la fois**, les
  autres restant visibles en compact, ordre d'affichage jamais modifié.
  → Voir ce qui reste à faire est motivant, et l'ordre d'exécution de la séance
  porte une logique (échauffement, gros exercices, finition) qu'un
  réordonnancement brouillerait. **Statut : à confirmer après test terrain** —
  deux alternatives explorables si insatisfaisant : mode focus plein écran, ou
  repli des autres exercices sous celui qui est ouvert.

- **Bulles d'aide : popup au premier passage, puis rappelables par l'icône
  « ? » de l'en-tête** — au lieu d'un encart permanent en haut de chaque onglet.
  → L'encart mangeait le haut de l'écran à chaque ouverture alors qu'il n'est
  utile qu'une fois. La popup vaut pour les six bulles existantes, y compris
  celle du coach sur l'onglet partagé (cf. correctif B7, v19.14).

- **Corps de l'accordéon monté en permanence, seule la hauteur est animée.**
  → Démonter le corps à la fermeture réinitialiserait les charges saisies par
  série. Coût nul : avant l'accordéon, tous les exercices étaient déjà montés.

## v19.15 — août 2026

- **Mini-kifs validés par le coach en duo, libres en solo.** → Sans garde-fou,
  le coffre mystère est auto-servi : rien n'empêche de mettre « MacBook Pro »
  en mini-kif et de le faire tomber en quatre séances. La validation réutilise
  la table des négos existante (`type: "kiff"` sur l'item) plutôt qu'un
  circuit parallèle : le coach accepte, reformule ou refuse, la coachée a le
  dernier mot sur une reformulation. En solo il n'y a pas de coach : le kif
  entre directement, l'auto-régulation est assumée — et ce parcours ne doit
  jamais être bloqué par la validation.

- **Contre-offre sur un mini-kif = reformulation du libellé, pas un niveau.**
  → Un mini-kif tombe au hasard du coffre, il n'a pas de palier ; ce qui se
  négocie, c'est sa taille (« MacBook Pro » → « un sticker de MacBook Pro »).

- **Grandes récompenses en tête de l'onglet Récompenses.** → C'est l'objectif
  de long terme : il doit être la première chose visible, avant les négos, les
  paris et la cagnotte qui relèvent du court terme.

- **Libellé persistant plutôt que placeholder sur les champs numériques.**
  → Un placeholder disparaît à la saisie et il ne reste qu'un nombre nu
  (« 18 ») sans rien pour dire ce qu'il désigne. À retenir : tout champ dont
  la valeur est un nombre porte un libellé au-dessus, jamais dans le
  placeholder seul.

- **Deuxième valeur morte de l'époque mono-duo corrigée** : l'état vide de la
  table des négos était conditionné par `role === "leo"`, valeur qui n'existe
  plus depuis les profils multiples — le coach ne voyait donc jamais
  « Aucune proposition en attente ». Même famille que `lvlup-role` (v19.14).
  → Deux occurrences en deux versions : le balayage systématique devient un
  item de dette technique dans `BACKLOG.md` plutôt qu'une trouvaille au coup
  par coup.

- **Note de tenue de fichier** : la validation des mini-kifs était annoncée
  comme « actée en v19.9 », mais aucune section v19.9 n'a jamais existé ici —
  l'item ne vivait que comme une question ouverte dans `BACKLOG.md`. La
  décision est donc consignée ici, à sa vraie date.

## v19.14 — août 2026

- **Récompenses et mini-kifs : structure à variantes `{ duo, solo }`** plutôt
  que filtrage ou neutralisation. → Filtrer appauvrissait trop le tirage du
  coffre mystère en solo (1 seul kif restant en « décontracté ») ; neutraliser
  aurait aplati le mordant des formulations duo. Le duo reste la voix de
  référence.

- **Voix des listes : formulées depuis la coachée vers le coach en mode duo**
  (« Je choisis le prochain resto »). → Toute nouvelle liste de style doit
  respecter cette voix ; la variante solo, elle, se formule comme quelque chose
  qu'on s'offre à soi, sans tiers implicite ni ton compensatoire.

- **Bug de fond corrigé (B7)** : la clé localStorage `lvlup-role` était morte
  depuis le passage aux profils multiples et n'était plus jamais écrite, d'où
  un coach qui ouvrait sur l'onglet « jour » (vide pour lui, avec la bulle
  « Ta base » hors sujet). L'onglet d'ouverture dérive désormais du rôle réel
  du profil. → À retenir : chercher d'autres clés localStorage devenues
  orphelines depuis cette migration.

## v19.11 — août 2026

- **Horizons des récompenses, exprimés en séances** : mini-kif 2-4, moyenne
  8-12, grande 30-45. → Choix de l'unité « séances » plutôt que « durée » :
  c'est l'unité déjà affichée dans l'app, et elle récompense l'assiduité
  plutôt que le simple écoulement du temps.

- **Répartition retenue : 4 niveaux de récompenses** (N2 première victoire
  ~2 séances, N3 moyenne ~10, N4 grande ~27, N5 très grande ~52). → Hiérarchie
  à deux étages conservée dans les grandes récompenses. Paliers XP
  volontairement non touchés : ne pas changer le niveau affiché des profils
  existants deux fois en trois semaines.

- **Mini-kifs : aucune modification nécessaire.** → Horizon déjà tenu
  mécaniquement par le coffre mystère (1 séance validée sur 4, médiane
  3 séances). Mini-kifs volontairement généreux (2-4 séances) : la boucle
  courte est ce qui prouve à une débutante que le système récompense
  réellement. Garde-fou contre l'abus = validation via les négos.

- **Constat v19.11 : 12 récompenses par défaut sur 33 et 14 presets de négos
  étaient structurellement inatteignables** (niveaux > MAX_NIVEAU = 12) depuis
  le recalibrage v19.7. → À retenir comme leçon : tout changement de
  MAX_NIVEAU ou de barème exige de rebalayer les listes de récompenses et de
  presets (et les textes d'aide chiffrés — deux résidus « N16/N20 » et une
  équivalence en semaines d'avant v19.7 ont été nettoyés au passage, ainsi que
  le prompt `/idees` qui générait encore des niveaux 2-20).

## v19.10 — août 2026

- **Moments à enjeu (pari, cagnotte, grande récompense) : mise en avant avec
  flou + engagement par maintien 2-3 s avec décompte.** → Le suspens fait
  partie du jeu ; l'engagement doit être un geste délibéré, pas un tap
  accidentel. Base du « encore ~N séances » : moyenne des estimations XP des
  cartes du carrousel du programme courant (repli 150 XP). Plafond mensuel de
  la cagnotte réglable par le coach (5-200 €, 30 € par défaut).

## v19.8 — août 2026

- **Invitation coach : graine dans l'onboarding** (intention sans action),
  **bandeau permanent adaptatif** sur l'accueil, **rappel en modale aux
  premiers XP**. → Ni formalité d'entrée, ni absente pendant la période
  critique des premiers jours. Le bandeau ne disparaît qu'une fois un coach
  connecté — détection : le Suivi coach s'identifie (`GET /etat?coach=1`), le
  worker mémorise `coachlie`, le coaché le reçoit via `GET /pause`.

- **Objectifs : 5 + carte texte libre** (voie IA du moteur hybride).
  → Multiplication des objectifs écartée au profit de la carte libre. Mapping
  1:1 vers les templates (tonifier→Fessiers & galbe avec bascule Full body si
  ≤3 séances, poids→Perte de gras, muscler→Haut du corps, mieux→Full body,
  douceur→Remise douce) : chaque réponse a son programme, aucun template
  orphelin.

- **Fréquence : 2 à 5 + option 6 « habitués »**. Pas de 7 (repos non
  négociable). Modifiable dans les réglages (via « changer de programme »).
  → Les templates plafonnant à 4 séances, 5-6 et l'objectif libre basculent
  sur la génération IA (le worker accepte jusqu'à 7), avec repli sur le
  template le plus proche si la génération échoue. Statut : à confirmer après
  test terrain par Léo.

## v19.7 — août 2026

- **Titres de niveaux : échelle de 12** (« Canapé Lover » → « Icône »), option
  « niveaux recalibrés » retenue : `MAX_NIVEAU` passe de 40 à 12, coût par
  niveau `150 + 1170×(n−1)`. → Le niveau 2 reste quasi immédiat (150 XP) pour
  préserver la boucle de récompense précoce ; « Icône » à 66 000 XP conserve
  l'horizon de l'ancien niveau 40 ; les XP acquis sont conservés tels quels.

- **Motivation du coach : le « gain » du coach est relationnel** (voir
  quelqu'un qu'il aime progresser) + le plaisir du jeu (paris, négos).
  → Rémunération monétaire du coach écartée : transformerait une relation de
  soin en transaction.

## v19.6 — août 2026

- **Titres de niveaux : registre autodérision / fun**, jamais militaire ni
  performance brute. Le niveau 1 doit donner envie d'en sortir en souriant.
  → « Recrue » écarté pour connotation militaire.

- **Thème dark glass : TEMPORAIRE.** Léo ne le valide pas (UI, couleurs,
  police). Refonte visuelle prévue après la migration Vite, avec un vrai brief.
  → D'ici là, maintenu par cohérence, sans investir dessus.

- **Moteur de programmes v1 : hybride à deux voies.** Choix utilisateur :
  « décris ton objectif » (génération IA existante) ou « choisis un programme
  spécialisé » (templates faits main). → Nombre et liste des templates : à
  définir.

## v19 / v19.5 — août 2026

- **Validation des XP : modèle « confiance + audit »**, pas de validation
  bloquante par le coach. Les XP sont attribués instantanément, le coach peut
  contester sous 48 h. → Une validation bloquante casse la boucle de
  récompense : le coaché finit sa séance et n'a rien.

- **Mode clair : reporté** à la migration Vite. → Les couleurs sont encore
  écrites en dur dans `index.html` ; il faut d'abord qu'elles deviennent des
  variables, sinon c'est un double entretien à chaque changement de design.

- **Thème « Nana punk » : reporté**, deviendra un thème optionnel et non le
  thème par défaut. → Trop clivant pour un produit qui s'ouvre à d'autres
  utilisateurs.

- **Suppression des emojis d'interface** au profit d'un système d'icônes SVG
  maison. → Rendu incohérent d'un OS à l'autre et registre trop enfantin.

- **Abandon de babel-standalone** au profit d'une précompilation du JSX.
  → Temps de chargement et taille du fichier.

### Décisions issues des retours des testeuses

- **Pitch en 3 lignes sur l'accueil.** → Testeuse 1 : l'objectif de l'app
  n'était pas clair.

- **Révélation progressive de l'écran Séance.** → Testeuse 1 : l'interface
  « faisait peur » au premier regard, trop dense.

- **XP rendus visibles partout** (pastilles par exercice, estimation par carte).
  → Testeuse 2 : ne comprenait pas comment les XP étaient calculés.

- **Cardio et Repos sortis du carrousel** vers deux boutons fixes permanents.
  → Testeuse 2 : la limite de séances proposées paraissait insuffisante.

---

## Questions ouvertes — à trancher

Sur le moteur de programmes (discuté, pas arbitré) :

- Templates du moteur hybride : combien au lancement, et lesquels ?
- Quels types de salle couvrir en priorité ?
- Quels objectifs construire en premier ? (fessiers / bas du corps,
  recomposition, débutant, esthétique équilibrée, force pure, santé-posture,
  préparation sportive)

Sur le rôle du coach (discuté, pas arbitré) :

- Motivation du coach au-delà du lien affectif fort : rôle-joueur
  (paris/négos), duo symétrique (chacun coache l'autre), ou progression propre
  du coach (XP/titres de coach) ? À trancher avant ouverture hors duos proches.
- Rétention du coach passif/tiède, pistes identifiées : pilote automatique (si
  inactif X jours, l'app suggère récompenses et validations, le coach ne fait
  que ratifier en 1 tap), sollicitations limitées aux moments émotionnels forts
  (passage de titre, record, retour de pause, fin de pari), gratitude
  remontante (le coaché envoie un merci pré-rempli en 1 tap), compteur
  d'investissement visible côté coach (jours/séances accompagnées), sceau du
  témoin (« Vu par ton coach » en 1 tap), bascule douce vers le mode autonome
  si abandon réel. Règle absolue : jamais de culpabilisation du coach.
  Priorité pressentie : pilote automatique + gratitude remontante.

Autres chantiers identifiés, non planifiés :

- Migration vers Vite (débloque le mode clair et les tokens de couleur)
- Sauvegarde serveur de la progression pour les profils autonomes
- Ambition App Store

---

## Comment tenir ce fichier

À chaque fois qu'une décision est prise en conversation, l'ajouter ici **avec sa
raison** avant de fermer la conversation. Le code est dans l'historique Git ; le
*pourquoi*, lui, n'est nulle part ailleurs.
