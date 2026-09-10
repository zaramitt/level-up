# Journal des décisions — Level Up!

Une ligne par décision, avec la raison (`date — décision — pourquoi`), pour ne pas se refaire proposer un truc déjà écarté. Détail par version dans `CHANGELOG.md` (lu sur demande).

---

## Chantier Programmes — septembre 2026

> **Principe fondateur (étape 4, v20.9) : le programme est une proposition. La
> séance est ce que tu as fait. Tout ce qu'on fait en salle doit pouvoir se
> noter, sans culpabilité et sans quitter la séance.**

> Cette section **remplace** la décision de fréquence de la v19.8 (2 à 5 +
> option 6 « habitués », pas de 7) et tranche la question ouverte « templates
> du moteur hybride : combien, lesquels ».

### Architecture retenue

**Squelettes faits main + banque d'exercices étiquetée + règles en code + IA
cantonnée à l'habillage** (choix dans la banque selon objectif et sport,
phrases d'accompagnement). **L'IA ne décide plus la structure.** → Le
générateur actuel produit des séances incohérentes : hip thrust en jour
poitrine, même structure à 3 et à 6 séances par semaine.
### Règles du générateur — à implémenter en code, pas en prompt

1. **Focus par séance** ; tout exercice appartient au focus.
2. **Ordre** : polyarticulaires d'abord, isolations ensuite, gainage en fin.
3. **Volume par muscle borné** ; chaque gros groupe ≥ 2× par semaine dès
   4 séances.
4. **Jamais le même gros groupe deux jours consécutifs.**
5. **Repos par fourchette de reps** : ≤ 6 → 3 min ; 8-12 → 2 min ; 12+ et
   isolation → 60-90 s. Ajusté par temps disponible (avec planchers) et
   niveau.
6. **Durée calculée** depuis séries et repos, jamais devinée.
7. **Niveau OBSERVÉ, jamais demandé** : deux questions factuelles à
   l'onboarding (déjà fait de la muscu ? sait faire squat et pompe ?), puis
   ressenti d'effort après chaque exercice (facile / juste / trop dur) qui
   recale en continu. Ce ressenti mesure l'effort, pas la technique. Le
   niveau est un état qui bouge.
8. **Double progression** : reps dans une fourchette, puis charge. L'app
   PROPOSE l'incrément (+2,5 kg haut du corps, +5 kg bas du corps et
   machines, bornés) quand toutes les séries touchent le haut de la
   fourchette avec ressenti facile / juste.
9. **Variantes** : ≥ 4 par exercice dont l'exercice phare connu de tous,
   étiquetées matériel (barre / haltères / machine / poids du corps) et
   difficulté. Chaque schéma de mouvement a une échelle simple → phare →
   avancé ; après plusieurs semaines stables, l'app propose de monter d'un
   cran, sans imposer. C'est ainsi que la technique progresse sans que l'app
   la voie.
10. **Sport pratiqué = modificateur du squelette** (muscles prioritaires,
    charges, placement vs jours de sport), pas un squelette à part. Deux
    questions chaînées à l'onboarding : le sport, puis « pour progresser
    dans ce sport ou pour toi ? ».
11. **Objectif = coloration des exercices** dans les cases du squelette.
12. **Remplacement d'exercice** (« pas cette machine », « générer une
    variante ») : candidats du **même compartiment ET même muscle principal**
    d'abord, triés par difficulté la plus proche et matériel disponible. Si
    aucun candidat : même muscle principal dans un autre compartiment,
    signalé comme approximatif (« même muscle, geste différent »). → Deux
    exercices d'un même compartiment travaillent les mêmes muscles par le
    même geste : le compartiment est le critère d'interchangeabilité, le
    muscle est la vérification.
### Sports couverts au lancement

Course à pied, cyclisme, natation, football, tennis & padel, rugby, basket &
handball, escalade, sports de frappe (boxe, kick, muay-thaï), sports de
préhension (judo, lutte, JJB), MMA, équitation, danse, yoga & pilates.
---

## Décisions en vigueur

Chantier Programmes (détails par étape dans `CHANGELOG.md`) :

- 2026-09 — Fondation = consensus de l'entraînement en force (surcharge progressive, 10-20 séries/muscle/semaine, ≥ 2×/muscle, polyarticulaires d'abord) ; squelettes = structures classiques publiques, pas des créations ; **relecture par un coach diplômé, prérequis avant ouverture hors du cercle proche** — c'est LA fondation.
- 2026-09 — Squelettes : 1-3× full body, 4× haut/bas ×2, 5× + jour focus, 6× push/pull/legs ×2, 7× = 6× + récupération active ; jamais de 7e séance de force — crédibilité auprès des avancés, prévention des blessures.
- 2026-09 — Consigne visible dès l'exercice déployé, erreur fréquente à la demande, les deux en grand dans la démo ; banque : ischios et arrière d'épaule en isolation, superman et extension lombaire en hinge, burpees et montées de genoux en cardio — à corriger en une ligne si un programme prouve le contraire.
- 2026-09 — L'objectif, le niveau et le sport se voient : obligatoires de l'objectif dans une case d'isolation + une case en plus si le temps le permet ; force = 3-6 reps, 180 s, 5 séries sur les phares, une isolation par muscle ; niveau 3 sans difficulté 1 ni régression, niveau 1 sans « coordination », jamais deux crans en dessous, un accessoire n'ouvre jamais ; sport (intention progresser) = seconde case unilatérale, isolations du haut aux épaules, anti-rotation, favoris ; objectif et sport pèsent autant (+40) — quatre programmes qui se ressemblaient ne servaient à rien.
- 2026-09 — Placement : l'espacement l'emporte sur les blocs collés, le gainage tourne ; jours de sport strict d'abord, souple sinon (jamais de grosse séance jambes la veille ni le jour même), et le moteur le dit — un programme n'est jamais impossible.
- 2026-09 — Volume (règle 3) : 1-2×/semaine = entretien, dit honnêtement ; plafond sur les séries directes, minimum avec secondaires ½ ; priorité au temps donné, 30 min = comprimé ; matériel réel = liste à cocher (« rien du tout » distinct du poids du corps) ; durée en minutes entières.
- 2026-09 — « Adapter ma séance » : temps + énergie, compression isolations → séries → repos → supersets (non fait), jamais les polyarticulaires ; temps en plus → compléments ; petite forme → la séance existe au lieu d'être sautée.
- 2026-09 — Le programme est une proposition, la séance est ce qu'on a fait (v20.9) : ajouter / retirer / réordonner / remplacer pour un jour ne touche jamais le programme ; un retiré ne compte ni en positif ni en négatif ; 3 retraits de suite → proposer de l'enlever, jamais automatique ; ajout libre sans limite via un seul panneau partagé avec Remplacer ; séance libre permanente sans bonus « complète » ; le journal enregistre ce qui a été fait, Progrès lit les charges — sans culpabilité, sans quitter la séance.
- 2026-09 — Reps réelles par série pré-remplies au haut de la fourchette, lues par la règle 8 ; sans charge notée, la dernière connue sert de base — le geste le plus fréquent reste à zéro tap.
- 2026-09 — Cardio (v20.11) : partie intégrante du programme quand l'objectif (perdre du poids, se sentir mieux) ou un sport d'endurance le réclame (finisher 10-15 min, séance dédiée dès 4× pour l'objectif seul) ; sinon option explicite d'« Ajuster » avec l'appareil, jamais imposé ; un sport à progresser l'emporte sur la structure ; le finisher passe à 10 min avant que quoi que ce soit ne saute ; notation chrono ou saisie (distance, vitesse, inclinaison, résistance), photo facultative sans malus, XP 5 / 10 / 15 / 20 selon la durée ; le jour « Cardio » joue comme une séance — un programme perte de poids sans cardio n'est pas crédible, la durée est la preuve.

Séance, XP, suivi :

- 2026-08 — XP en « confiance + audit », attribués instantanément, contestables 48 h — une validation bloquante casse la boucle de récompense. XP par difficulté 10 / 15 / 20, sans photo 5 de moins, points mémorisés par exercice (v20.8).
- 2026-08 — Séance partielle = 1 séance au compteur sans bonus ni coffre (venir compte) ; clôture automatique au jour suivant et après 3 h sans activité — une séance réelle ne doit jamais être perdue.
- 2026-09 — Ressenti facile / juste / trop dur, facultatif, replié sur le choix ; niveau observé recalé sur les gros exercices, proposé jamais imposé, le mot « niveau » n'apparaît jamais ; incrément proposé jamais imposé (+2,5 haut, +5 bas et machines), annulé par « trop dur » ou petite forme ; « dernier » seulement avec une vraie valeur ; le phare ouvre toujours sa case.
- 2026-09 — Remplacer : 2-3 candidats du même compartiment et muscle, phare d'abord, aujourd'hui ou pour de bon ; charges sous l'ancien identifiant, jamais fusionnées, les remplacés sous leur propre nom.
- 2026-09 — Écran Séance en mode focus (popup), accordéon abandonné après test terrain ; muscles en grand, geste en petit ; séance choisie au-dessus de la grille ; bandeau de repos au-dessus du focus ; types de charge poids du corps / lesté / assisté (négatif) ; Déplacer = libellé explicite + appui long, le défilement gagne tant que l'appui n'a pas abouti ; tout exercice a Remplacer et Ajouter après.
- 2026-08 — Chronos sur horodatage cible, jamais un décompte (iOS gèle le JS) ; re-tap repos ignoré ; repos écoulé continue en « + » ; barre de fin de séance fixe ; célébration en popup ; sons par `<audio>` (canal média) en session « ambient » (revers : le bouton silencieux coupe aussi).
- 2026-09 — Progrès : un graphique par exercice dès la première charge (remplace le carnet), exemple grisé sans historique, cardio en durée et distance.
- 2026-09 — Notifications de séance planifiées côté serveur, cron chaque minute, imprécision ≤ 1 min acceptée ; Durable Objects écartés (migration de déploiement) ; iOS : app installée seulement.
- 2026-09 — Onboarding : chaque écran tient sans défiler et remplit ≥ 85 % du viewport (`100dvh`), vérifié par le harnais ; toasts 4 s minimum, erreurs jusqu'au tap ; champs de saisie ≥ 16 px — Safari iOS zoome.
- 2026-09 — Programme généré dans l'app par le moteur embarqué ; l'IA ne lit que l'objectif libre (`/interpreter`), `/generer` supprimée, repli « esthétique équilibré » dit clairement ; migration option (b) : un profil existant garde son programme, régénération avec questions pré-remplies et aperçu, testée ; questions : fréquence 1-7, objectif 5 + libre, deux questions factuelles → niveau, sport + intention + jours, matériel à cocher, temps exact, toutes modifiables.
- 2026-08 — Appels IA en sortie structurée, schémas réduits au sous-ensemble supporté ; idées de récompenses sur Sonnet, concrètes et expliquées, français irréprochable, voix nominale sans pronom de locuteur (solo : « que tu t'offres »), vérification minimale côté worker, jamais une idée suspecte à l'écran ; temps mesuré et affiché, relecture seulement sur problème détecté.

Récompenses, coach, duo, design :

- 2026-08 — 12 niveaux (150 + 1170×(n−1)), titres en autodérision jamais militaire ; 4 niveaux de récompenses en séances (N2 ~2, N3 ~10, N4 ~27, N5 ~52), mini-kifs généreux tenus par le coffre ; tout changement de MAX_NIVEAU exige de rebalayer récompenses, presets et textes chiffrés.
- 2026-08 — Récompenses et mini-kifs en variantes {duo, solo} (voix duo = de la coachée vers le coach) ; mini-kifs validés par le coach via la table des négos (contre-offre = reformulation), libres en solo ; grandes récompenses en tête ; libellé persistant au-dessus de tout champ numérique.
- 2026-08 — Moments à enjeu : mise en avant floutée + maintien 2-3 s ; plafond de cagnotte réglable par le coach (30 €), seuls les jours de séance prévus manqués comptent ; en duo, cagnotte et paris toujours présents, jamais masqués.
- 2026-08 — Invitation coach : graine dans l'onboarding, bandeau adaptatif, rappel aux premiers XP ; parcours coach par lien sans onboarding complet, un code = une personne coachée ; le gain du coach est relationnel, rémunération écartée ; modèle coach-qui-finance : ne pas construire dessus sans validation.
- 2026-08 — Adresse elle / il / neutre dans les Réglages (neutre = reformulation chaleureuse), côté coach accord selon la préférence publiée ; bulles d'aide accordées, variante solo, popup au premier passage puis « ? ».
- 2026-09 — Sécurité (audit dans `SECURITE.md`) : aucun secret dans le code, code inconnu = zéro appel IA + budget journalier global, texte utilisateur jamais dans le prompt système, `/abonner` limité à Apple / Google / Mozilla, liste blanche de `/etat`, XP calculés côté client (la photo reste la preuve), débit limité dans le worker, Space Grotesk auto-hébergée, CSP à nonce, Confidentialité en langage clair ; pas de séparation des rôles côté serveur pour l'instant (prérequis avant ouverture), code duo dans l'URL, pas de chiffrement des photos.
- 2026-08 — Thème dark glass temporaire, refonte après Vite ; mode clair et « Nana punk » reportés ; icônes SVG, plus d'emojis d'interface ; JSX précompilé ; retours des testeuses : pitch en 3 lignes, révélation progressive de l'écran Séance, XP visibles partout, Cardio et Repos en boutons fixes.

---

## Questions ouvertes — à trancher

Sur le moteur de programmes (discuté, pas arbitré) :

- ~~Templates du moteur hybride : combien au lancement, et lesquels ?~~
  Tranché : voir « Chantier Programmes — septembre 2026 » (squelettes par
  fréquence).
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
