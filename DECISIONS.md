# Journal des décisions — Level Up!

Une ligne par décision, avec la raison. Format : `date — décision — pourquoi`.
Objectif : ne pas se refaire proposer six mois plus tard un truc déjà écarté.

---

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

- v1 en **génératif** (objectif × fréquence × niveau × matériel, piochant dans
  un pool d'exercices tagué) ou en **templates fixes**, ou hybride ?
- Quels types de salle couvrir en priorité ?
- Quels objectifs construire en premier ? (fessiers / bas du corps,
  recomposition, débutant, esthétique équilibrée, force pure, santé-posture,
  préparation sportive)

Autres chantiers identifiés, non planifiés :

- Migration vers Vite (débloque le mode clair et les tokens de couleur)
- Sauvegarde serveur de la progression pour les profils autonomes
- Ambition App Store

---

## Comment tenir ce fichier

À chaque fois qu'une décision est prise en conversation, l'ajouter ici **avec sa
raison** avant de fermer la conversation. Le code est dans l'historique Git ; le
*pourquoi*, lui, n'est nulle part ailleurs.
