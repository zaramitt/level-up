# Backlog — Level Up!

Source : retour complet de Léo sur v19.5. Rien ici n'est perdu ; chaque
chantier sera traité dans une session dédiée. Vérifier `DECISIONS.md` avant de
traiter un item.

## Écran Séance

- « Ta base » : transformer l'encart permanent en popup
- Popup d'explication au premier passage sur chaque onglet (simple et claire)
- Dans une séance : sélectionner UN exercice qui se déploie, les autres se
  rangent en dessous pour aérer (on peut toujours quitter)
- Carte d'exercice (ex. goblet squat) : aérer
- Gainage : le cercle doit être cliquable (lancer/déplier), infos chrono plus
  grandes

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
- **PRIORITÉ BASSE — État vide de la table des négos jamais affiché côté
  coach** : la condition est écrite `role === "leo"`, valeur qui n'existe plus
  depuis le passage aux profils multiples (`role` vaut `coach` ou `coachee`).
  Le coach ne voit donc jamais le message « Aucune proposition en attente ».
  Même famille de bug que la clé morte `lvlup-role` corrigée en v19.14 —
  repéré pendant la passe 3, laissé de côté pour tenir le périmètre annoncé.

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
