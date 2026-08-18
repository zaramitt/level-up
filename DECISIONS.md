# Journal des décisions — Level Up!

Une ligne par décision, avec la raison. Format : `date — décision — pourquoi`.
Objectif : ne pas se refaire proposer six mois plus tard un truc déjà écarté.

---

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
