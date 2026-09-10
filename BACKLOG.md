# Backlog — Level Up!

Origine : le retour complet de Léo sur la v19.5, enrichi depuis à chaque
session et à chaque test terrain. Rien ici n'est perdu ; chaque chantier sera
traité dans une session dédiée. Vérifier `DECISIONS.md` avant de traiter un
item.

## Socle

Les fondations sur lesquelles reposent plusieurs chantiers à la fois.

- ~~**PRIORITÉ HAUTE — Répétitions par série** : les logguer réellement
  (saisie rapide par série, dernière valeur pré-remplie) à la place de la case
  « j'ai tenu N reps partout ».~~ **Traité en v20.9** (étape 4) : reps par
  série pré-remplies au haut de la fourchette, règle 8 sur les reps réelles,
  journal par séance. Restent ouverts derrière : records personnels,
  graphique de volume.
- **Records personnels célébrés** : meilleure charge et meilleure série par
  exercice, avec une célébration à la séance.
- **PRIORITÉ HAUTE — Séparation des rôles côté serveur.** Prérequis avant
  toute ouverture hors du cercle proche. Aujourd'hui le code duo est l'unique
  capacité, partagée par les deux membres : la coachée peut forger une action
  coach (plafond de cagnotte, résolution d'un pari, validation d'une pause) et
  le coach peut réécrire l'état publié. Schéma « un secret par rôle » : à la
  création du duo, l'app tire deux secrets dérivés du code — une clé coachée
  (gardée sur son téléphone) et une clé coach (portée par le lien
  d'invitation) ; chaque requête envoie sa clé dans un en-tête ; le worker
  mémorise les deux empreintes à la première écriture de chaque rôle (première
  arrivée, puis verrouillé) et n'autorise `/etat`, `/photo` qu'à la clé
  coachée, `plafond`, `vider`, `resoudre`, `valider` qu'à la clé coach, le
  reste aux deux. Migration : les duos existants gardent le code seul jusqu'à
  ce que les deux téléphones aient présenté leur clé. Voir `SECURITE.md`,
  point 2, et « Tentative d'intrusion » pour l'estimation : 3 à 4 jours
  (worker ~120 lignes, app ~150 lignes, migration, tests). Y joindre : n'indexer
  dans `idx:codes` (rappels du soir) qu'un code dont l'état est publié depuis
  plus de 24 h, pour qu'on ne puisse pas en évincer les vrais duos.
- **Turnstile sur les routes IA et `/profil`** (mode géré, invisible la plupart
  du temps) : en réserve, si le budget journalier et la limitation de débit ne
  suffisent pas.
- **Restauration d'essai sur Cloudflare** : une fois la liaison R2 en place, restaurer un
  duo de test depuis une sauvegarde réelle (`outils/restaurer.js --compte … --namespace …`)
  et vérifier dans le dashboard. Le cycle complet est testé localement (workerd), pas encore
  sur le compte.
- **Chiffrement des photos côté client** (clé dérivée du code) : protège
  contre une fuite du stockage ou un regard sur le dashboard, pas contre qui a
  le code. À décider quand l'app s'ouvre.

## Solo

- **Cagnotte personnelle en solo — mise que l'on récupère en tenant ses
  séances. Cœur du mode contrat.**

## UI / UX

- **Onboarding « la photo fait foi » → « tes récompenses » : design à revoir.
  Onglet Récompenses : refonte. → chantier UI/UX.**

## Écran Séance

Accordéon, aération, gainage, « Ta base » (v19.16), puis ressenti, incrément
proposé, remplacement d'exercice, « Adapter ma séance » et récupération
active (v20.1), textes des bulles d'aide (v20.3), corrections terrain (v20.5)
et mode focus, types de charge, ajustement dans les deux sens (v20.6) :
traités. Ce qui reste :

- Vérifier en salle réelle le mode focus, le ressenti et « Remplacer » sur
  iOS Safari (tap franc) — le harnais le vérifie en Chromium seulement.
- Supersets, dernier cran de la compression : non fait.
- Ajustement : les compléments sont choisis par le moteur. Le cardio se
  choisit depuis la v20.11 (option « ajouter 15 min de cardio ? » avec
  l'appareil) ; laisser choisir les autres compléments (« plutôt une
  isolation ») reste à faire.
- **PRIORITÉ BASSE — En-tête global trop serré à 390 px** : sur l'écran
  coachée, « LEVEL UP ! » et la ligne d'XP passent sur plusieurs lignes, coincés
  entre l'orbe de niveau et le bloc « 7 DERNIERS JOURS ». Antérieur à la v19.16
  (mesuré : bloc titre à 85 px avant, 88 px après). À reprendre lors de la
  refonte visuelle post-Vite.

## Programmes

Générateur incohérent traité : le moteur (règles en code, banque étiquetée)
est branché en v20.0, étape 3 passe 1. Ce qui reste :

- ~~**PRIORITÉ HAUTE — ÉTAPE 4, avant le champ « ajuster mon programme » : la
  séance libre.**~~ **Traité en v20.9** : ajout / retrait / réordonnancement
  pour le jour, panneau à trois onglets, séance libre permanente, journal,
  proposition après 3 retraits (voir DECISIONS, Étape 4).
- **PRIORITÉ HAUTE — Champ permanent « Ajuster mon programme »** : renforcer
  X en ce moment, éviter Y (blessure), cycles de plusieurs semaines sur un
  focus. Passe par `/interpreter` → contraintes du moteur (exclusions,
  priorités, durée du cycle). Étape 4 du chantier.
- **Vérification par photo : alternatives à étudier** (le duo se voit déjà à
  la salle). Géolocalisation exclue. Piste : photo facultative en duo de
  confiance, obligatoire hors cercle.

- Passe 2 faite en v20.1 (ressenti, incrément, remplacement, adapter,
  récupération active). Reste : monter d'un cran dans l'échelle d'un exercice
  après plusieurs semaines stables (règle 9, « l'app propose de monter »),
  non fait.
- Trous de la banque (`MOTEUR.md`, « Trous de la banque ») : lot 2 hors salle
  (charnière, poussée verticale et tirage au poids du corps, ischios et
  abducteurs sans machine).
- Relecture par un coach diplômé — prérequis avant ouverture hors du cercle
  proche.
- Habillage des séances (nom du programme, phrase d'accompagnement) : point
  d'extension laissé ouvert dans le moteur.

## Générateur de séances

- Mode « je construis ma séance du jour » : temps disponible, intensité (charge
  lourde vs entretien, impact sur les repos), partie du corps ciblée ou au
  choix de l'app, proposition de compléments (abdos…) si minutes restantes.
  Recouvre en partie « Adapter ma séance » (passe 2 du moteur) — à cadrer
  ensemble avec Léo avant toute implémentation.

## Onglet Progrès

- Cardio (v20.11) : la courbe montre durée et distance. Reste : vitesse et
  inclinaison, et un total hebdomadaire de minutes de cardio.

- Graphique de charge par exercice : fait en v20.2 (remplace le carnet).
  Reste : afficher aussi les reps sur le graphique — elles sont notées par
  série depuis la v20.9 (`e.reps` sur chaque entrée de charge), il ne manque
  que l'affichage (volume, meilleure série).
- Appui long sur « tes preuves » / « tes badges » / carnet pour réorganiser
  les sections (haut/bas)

## Onglet Récompenses

Hiérarchie, validation des mini-kifs et libellés des champs traités en v19.15
(passe 3). Ce qui reste relève de la densité d'affichage et de l'économie des
XP, pas de la structure de l'onglet.

- **Récompenser l'atteinte d'objectifs** (mois complet, cycle terminé), pas
  seulement les niveaux.

- **PRIORITÉ MOYENNE — Rythme de déblocage en paquets** : creux de ~17 séances
  avant N4 et ~25 avant N5, puis 4 récompenses d'un coup (8 si deux styles
  combinés). Conséquence mécanique des 4 niveaux utilisables (option a,
  v19.11). Le creux entre le 1er et le 2e mois tombe dans la fenêtre de
  décrochage habituelle. Pistes à explorer : étaler les déblocages d'un même
  palier, ou densifier le coffre mystère pendant les creux.
- **PRIORITÉ MOYENNE — Dépenser ses XP pour choisir ses récompenses** (idée de
  Léo) : au lieu d'un déblocage automatique par palier, les XP deviendraient
  une monnaie dépensable. Réglerait le problème des déblocages en paquets
  (4 récompenses d'un coup à N4). Changement d'économie majeur — à discuter
  avant toute implémentation.
- « Je propose » : interminable — en faire une carte avec quelques idées +
  bouton « en voir plus » ; après sélection, ne pas devoir défiler tout en bas.
  (Le sous-point « la case 18 seule est incompréhensible » est traité en
  v19.15.)
- Coffres mystères : liste trop longue — bouton « en voir plus » progressif
- Barème : tout dans la même pastille au déroulé, pas une seconde pastille en
  dessous
- **PRIORITÉ BASSE — Récompenses jumelles** quand deux styles proches sont
  combinés (déduplication sur le libellé exact uniquement). Ex : « Mon
  dessert/bubble tea préféré offert » + « Ton dessert préféré offert ».
  Piste : déduplication sémantique ou par tag de catégorie.

## Dette technique

- **PRIORITÉ HAUTE — Balayage des valeurs en dur et clés orphelines héritées
  de l'époque mono-duo.** Trois trouvées et corrigées : `lvlup-role` (v19.14),
  `role === 'leo'` (v19.15) et `incTour` qui sauvegardait les tours de gainage
  dans `lvlup-state-v3`, la clé mono-profil (v19.17 — les tours n'étaient
  jamais persistés sous la clé du profil). Faire un balayage systématique du
  code à la recherche d'autres conditions ou clés référençant des prénoms,
  rôles ou identifiants qui n'existent plus depuis le passage aux profils
  multiples. Balayage fait en v19.18 : clés localStorage toutes saines (par
  profil, ou legacy en lecture seule pour l'import), aucune condition
  d'identité morte restante. Les textes genrés relevés au passage sont réglés
  en v19.19 (préférence d'adresse elle/il/neutre, accords appliqués).

## Coach

- **Plusieurs personnes autour d'une coachée : un seul finance, les autres
  regardent et encouragent (spectateurs). Décision de positionnement.**
- **PRIORITÉ MOYENNE — Page d'accueil du coach à repenser comme un vrai tableau
  de bord** : aujourd'hui elle paraît vide à l'ouverture. Enjeu lié à la
  rétention du coach passif (cf. `DECISIONS.md`).

## Onboarding

Sport, intention, matériel et temps demandés depuis la v20.0. Ce qui reste :

- Les anciens profils passent par la carte de migration ; une fois tous les
  profils connus migrés, retirer les templates `PROGRAMMES` du code (v20.x).
- Prénom demandé après les questions du programme : vérifier avec les
  testeuses que l'ordre ne fait pas décrocher (neuf écrans avant le prénom).
- Parcours coach par lien (v20.6) : « en duo avec [prénom] » crée un second
  duo (un code = une personne coachée) ; la personne qui a invité doit encore
  accepter l'invitation en retour. Un duo symétrique natif (chacun coache
  l'autre sous un seul lien) reste à décider.

## Écran Choix de programme

Retiré en v20.0 : « Changer de programme » passe par les mêmes questions et
un aperçu. Reste à discuter :

- Programmes spécialisés nommés (« templates ») comme raccourci de réponses
  pré-remplies, pas comme structure à part.

## Réglages

- **Mentions légales complètes** si ouverture au public : nom de l'éditeur,
  registre des traitements minimal, durée de conservation par donnée, base
  légale. La page « Confidentialité et mentions légales » (v20.4) couvre
  l'usage personnel actuel.
- **HSTS explicite et règle WAF de limitation de débit** le jour d'un domaine
  à soi (sur `workers.dev` : HSTS préchargé, pas de WAF).
- **Edge sur Windows (WNS)** refusé par `/abonner` (liste : Apple, Google/FCM,
  Mozilla) : élargir si une utilisatrice le demande.
- « Habitude compléments » : libellé pas explicite pour un novice
- Pause limitée à 14 jours : lever ou élargir la limite ?
- « Recharger les listes de ce style » : incompréhensible — clarifier, et
  évaluer son déplacement vers l'onglet Récompenses
- Bouton réglages flottant, toujours accessible

## Idées business

- Programmes signature de sportifs ou créateurs connus (templates nommés).
  Obstacle : leurs programmes sont leur produit commercial — nécessite un
  partenariat. Piste : le créateur comme coach pro de ses abonnés.
- Sponsoring / réductions chez des partenaires comme récompenses. Risque de
  triche à traiter (validation coach, plafonds, preuve photo).

## App Store (native)

- **Détection par rythme cardiaque (Apple Watch / Santé)** : reconnaître une
  séance ou une course, valider « j'ai bien bougé » par le podomètre. Réservé
  à la version native.

## Produit

- **Apprentissage des comportements** : l'app doit déduire les habitudes
  (heures, exercices préférés, machines disponibles) — à concevoir.

## Idées produit (non planifiées)

- Rigueur/discipline comme dimension célébrée en soi : visibilité de la
  constance, badge/titre de régularité, lien avec le concept de « healing
  streak » (la reprise comme métrique). Demande initiale : copine de Léo,
  août 2026.
