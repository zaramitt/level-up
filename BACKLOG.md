# Backlog — Level Up!

Origine : le retour complet de Léo sur la v19.5, enrichi depuis à chaque
session et à chaque test terrain. Rien ici n'est perdu ; chaque chantier sera
traité dans une session dédiée. Vérifier `DECISIONS.md` avant de traiter un
item.

## Écran Séance

Accordéon, aération de la carte, gainage et « Ta base » en popup traités en
v19.16 (passe 1). Ce qui reste relève des textes d'aide et du confort de
lecture, pas de la structure de l'écran.

- **Passe 2 — textes des bulles d'aide** : le mécanisme de popup au premier
  passage existe depuis la v19.16 et couvre les six onglets ; restent à
  réécrire les textes eux-mêmes, pour qu'ils soient vraiment simples et clairs
  pour une novice.
- **PRIORITÉ HAUTE — Remplacer un exercice en cours de séance** (machine
  indisponible, exercice non réalisable, préférence — ex : tirage vertical
  remplacé par tractions). Vécu dès la première séance en salle réelle.
- Niveaux de difficulté des exercices : certains sont durs pour une débutante
  (ex : deadbug, coordination). Pouvoir choisir plus simple.
- **PRIORITÉ BASSE — En-tête global trop serré à 390 px** : sur l'écran
  coachée, « LEVEL UP ! » et la ligne d'XP passent sur plusieurs lignes, coincés
  entre l'orbe de niveau et le bloc « 7 DERNIERS JOURS ». Antérieur à la v19.16
  (mesuré : bloc titre à 85 px avant, 88 px après). À reprendre lors de la
  refonte visuelle post-Vite.

## Programmes

- **PRIORITÉ HAUTE — Générateur incohérent** : exercices hors groupe musculaire
  (hip thrust dans poitrine/triceps), et même structure à 3 et 6 séances par
  semaine. Programme de référence fait main disponible (PDF A/B/C/D + gainage
  + cardio). Chantier de conception à faire avec Léo — cadrage acté dans
  `DECISIONS.md`, « Chantier Programmes — septembre 2026 ».
- Relecture par un coach diplômé — prérequis avant ouverture hors du cercle
  proche.

## Générateur de séances

- Mode « je construis ma séance du jour » : temps disponible, intensité (charge
  lourde vs entretien, impact sur les repos), partie du corps ciblée ou au
  choix de l'app, proposition de compléments (abdos…) si minutes restantes.
  Gros chantier produit — à concevoir avec Léo avant toute implémentation.

## Onglet Progrès

- **PRIORITÉ HAUTE — Graphique d'évolution de la charge par exercice**, façon
  balance connectée. Données déjà enregistrées par série : affichage
  uniquement.
- Appui long sur « tes preuves » / « tes badges » / carnet pour réorganiser
  les sections (haut/bas)

## Onglet Récompenses

Hiérarchie, validation des mini-kifs et libellés des champs traités en v19.15
(passe 3). Ce qui reste relève de la densité d'affichage et de l'économie des
XP, pas de la structure de l'onglet.

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

- Plusieurs coachs pour une même personne (partager sa séance avec plusieurs
  amis). Décision produit à prendre : un coach principal + spectateurs, ou
  plusieurs coachs égaux ?
- **PRIORITÉ MOYENNE — Page d'accueil du coach à repenser comme un vrai tableau
  de bord** : aujourd'hui elle paraît vide à l'ouverture. Enjeu lié à la
  rétention du coach passif (cf. `DECISIONS.md`).

## Onboarding

- Demander le sport pratiqué et l'objectif (progresser dans son sport vs
  esthétique) — dépend du chantier Programmes.

## Écran Choix de programme (atteint depuis l'onboarding et « changer de programme »)

- Choix à deux voies pour le programme : « décrire votre objectif » OU
  « choisir un programme spécialisé », avec possibilité de changer en bas
  (décision moteur hybride déjà actée dans `DECISIONS.md`)
- Liste des programmes : pas de retour arrière possible ; à la sélection,
  faire apparaître le bouton « c'est parti » sans devoir défiler

## Réglages

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

## Idées produit (non planifiées)

- Rigueur/discipline comme dimension célébrée en soi : visibilité de la
  constance, badge/titre de régularité, lien avec le concept de « healing
  streak » (la reprise comme métrique). Demande initiale : copine de Léo,
  août 2026.
