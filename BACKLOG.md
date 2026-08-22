# Backlog — Level Up!

Source : retour complet de Léo sur v19.5. Rien ici n'est perdu ; chaque
chantier sera traité dans une session dédiée. Vérifier `DECISIONS.md` avant de
traiter un item.

## Écran Séance

Accordéon, aération de la carte, gainage et « Ta base » en popup traités en
v19.16 (passe 1). Ce qui reste relève des textes d'aide et du confort de
lecture, pas de la structure de l'écran.

- **Passe 2 — textes des bulles d'aide** : le mécanisme de popup au premier
  passage existe depuis la v19.16 et couvre les six onglets ; restent à
  réécrire les textes eux-mêmes, pour qu'ils soient vraiment simples et clairs
  pour une novice.
- **PRIORITÉ BASSE — En-tête global trop serré à 390 px** : sur l'écran
  coachée, « LEVEL UP ! » et la ligne d'XP passent sur plusieurs lignes, coincés
  entre l'orbe de niveau et le bloc « 7 DERNIERS JOURS ». Antérieur à la v19.16
  (mesuré : bloc titre à 85 px avant, 88 px après). À reprendre lors de la
  refonte visuelle post-Vite.

## Onglet Progrès

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

- **PRIORITÉ MOYENNE — Balayage des valeurs en dur et clés orphelines héritées
  de l'époque mono-duo.** Deux trouvées et corrigées : `lvlup-role` (v19.14)
  et `role === 'leo'` (v19.15). Faire un balayage systématique du code à la
  recherche d'autres conditions ou clés référençant des prénoms, rôles ou
  identifiants qui n'existent plus depuis le passage aux profils multiples.

## Coach

- **PRIORITÉ MOYENNE — Page d'accueil du coach à repenser comme un vrai tableau
  de bord** : aujourd'hui elle paraît vide à l'ouverture. Enjeu lié à la
  rétention du coach passif (cf. `DECISIONS.md`).

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
- Quitter les réglages : swipe gauche→droite ou bouton retour flottant
  (aujourd'hui il faut défiler tout en bas)

## Idées produit (non planifiées)

- Rigueur/discipline comme dimension célébrée en soi : visibilité de la
  constance, badge/titre de régularité, lien avec le concept de « healing
  streak » (la reprise comme métrique). Demande initiale : copine de Léo,
  août 2026.
