# Journal des décisions — Level Up!

Une ligne par décision, avec la raison. Format : `date — décision — pourquoi`.
Objectif : ne pas se refaire proposer six mois plus tard un truc déjà écarté.

---

## Chantier Programmes — septembre 2026

> Cette section **remplace** la décision de fréquence de la v19.8 (2 à 5 +
> option 6 « habitués », pas de 7) et tranche la question ouverte « templates
> du moteur hybride : combien, lesquels ».

### Architecture retenue

**Squelettes faits main + banque d'exercices étiquetée + règles en code + IA
cantonnée à l'habillage** (choix dans la banque selon objectif et sport,
phrases d'accompagnement). **L'IA ne décide plus la structure.** → Le
générateur actuel produit des séances incohérentes : hip thrust en jour
poitrine, même structure à 3 et à 6 séances par semaine.

### Fondement de la qualité

- Les règles ci-dessous sont le **consensus établi de l'entraînement en
  force** : surcharge progressive, 10-20 séries par muscle et par semaine,
  fréquence ≥ 2× par muscle, polyarticulaires d'abord, autorégulation. C'est
  LA fondation.
- Les squelettes sont des **déclinaisons de structures classiques, publiques
  et éprouvées** — full body type Starting Strength / StrongLifts, haut/bas,
  push-pull-legs type r/Fitness — pas des créations.
- **PRÉREQUIS avant ouverture hors du cercle proche : relecture des
  squelettes, de la banque et des règles par un coach diplômé.**
- `docs/programme-reference.pdf` (quand déposé) : référence de **ton et de
  présentation** (explications, variantes, adresse à une débutante), pas
  d'exactitude — généré par IA sans relecture professionnelle.

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

### Affichage des textes d'exercice

- **Consigne visible dès l'exercice déployé**, une ligne sous le nom.
- **Erreur fréquente à la demande** (un tap), jamais imposée.
- **Les deux en grand dans la vue démo.**
- La consigne doit être **actionnable** ; l'erreur fréquente doit **décrire ce
  qu'on voit faire de travers**.

### Banque d'exercices — arbitrages de relecture (étape 1)

Relecture de Léo sans changement de contenu. Validés : ischio-jambiers et
arrière d'épaule ajoutés comme sous-muscles des isolations ; superman et
extension lombaire rangés en hinge (charnière sans charge) ; burpees et
montées de genoux en cardio ; « Développé haltères » des templates gardé en
poussée verticale assis — à corriger en une ligne si un programme prouve le
contraire.

### Squelettes par fréquence

| Séances / semaine | Squelette |
|---|---|
| 1× | full body |
| 2× | full body A-B |
| 3× | full body A-B-C |
| 4× | haut / bas × 2 |
| 5× | haut / bas × 2 + jour focus (objectif ou sport) |
| 6× | push-pull-legs × 2 |
| 7× | 6× + 1 jour de récupération active (mobilité, cardio léger) |

**Pas de 7e séance de force** : crédibilité auprès des avancés et prévention
des blessures.

### Séance du jour : « Adapter ma séance »

Bouton au lancement (« Pas assez de temps ou d'énergie aujourd'hui ? On
ajuste. »). Deux curseurs : **temps disponible** (défaut = dernière fois) et
**énergie** (à fond / normal / petite forme). Compression dans l'ordre :
retirer les isolations, réduire les séries, raccourcir les repos jusqu'aux
planchers, supersets en dernier. **Jamais retirer les polyarticulaires.**
Temps en plus → proposer un complément. Petite forme → charges et séries
réduites : la séance existe au lieu d'être sautée.

### Sports couverts au lancement

Course à pied, cyclisme, natation, football, tennis & padel, rugby, basket &
handball, escalade, sports de frappe (boxe, kick, muay-thaï), sports de
préhension (judo, lutte, JJB), MMA, équitation, danse, yoga & pilates.

## v19.21 — août 2026

- **Sons du chrono lus par un `<audio>` (canal média), pas par Web Audio.**
  → Sur iOS, le bouton silencieux coupe Web Audio mais laisse passer la
  lecture média : c'est ce qui permet au bip de sonner en salle, téléphone en
  silencieux (les boutons de volume restent maîtres). Safari refuse toute
  lecture non initiée par un tap : les deux sons sont joués en muet au premier
  geste (lancement d'un repos ou d'une série), ce qui les débloque pour le
  reste de la session. Bip à 10 s de la fin du repos, triple bip à la fin.

- **Repos écoulé : le compteur continue en « + » jusqu'au tap suivant.**
  → Montrer le temps de repos réellement pris est plus honnête qu'un « GO »
  qui disparaît ; le tap suivant (OK, ou relance d'un repos) le referme.
  Corollaire : la fin du dernier tour de gainage affiche « bouclé », plus
  « c'est reparti » (bug vu en salle).

- **Fin de séance : barre fixe au-dessus des onglets** tant qu'une séance est
  en cours avec au moins un exercice validé — « Fin de séance · 3/6 » ou
  « Valider ma séance · +40 XP » quand tout est fait. → Plus jamais de bouton
  de clôture à chercher en bas de liste.

- **Célébration en popup à la validation** : récap des XP de la séance, barre
  vers le niveau suivant, secousse visuelle (`navigator.vibrate` n'existe pas
  sur iOS Safari) et confettis allongés.

## v19.20 — août 2026

- **Appels IA (`/idees`, `/generer`) : format de réponse garanti par l'API
  (structured outputs, `output_config.format`) au lieu d'un JSON demandé en
  prose puis nettoyé à la main.** → Une réponse hors format renvoyait
  « generation impossible » (502) à l'utilisatrice ; le schéma est maintenant
  imposé côté API, la validation métier (catalogue, palette, plafonds) reste
  côté serveur. Issu d'un audit de prompts (`/claude-api prompt-audit`) : les
  prompts n'avaient aucune béquille d'ancien modèle, seul ce mécanisme était
  daté. À vérifier par Léo sur l'URL Worker — la vraie API n'est pas
  atteignable en session.

## v19.19 — août 2026

- **Adresse au profil : préférence elle / il / neutre dans les Réglages, sans
  question d'onboarding.** Le ton chaleureux prime : le neutre est une
  reformulation chaleureuse (« Quelle fierté »), jamais un appauvrissement
  (« Bravo pour votre séance »). Textes d'origine écrits pour Léa : le féminin
  reste le défaut des profils existants ; les nouveaux profils démarrent en
  neutre. → Côté coach, les textes qui parlent de la coachée s'accordent avec
  l'adresse qu'elle publie via `/etat` (repli : féminin tant qu'elle n'est pas
  reçue) — la préférence appartient à la personne concernée, pas à l'appareil
  qui l'affiche.

## v19.18 — août 2026

- **Séance partielle = 1 séance pleine au compteur, sans bonus ni coffre.**
  → Venir compte ; la perfection est récompensée à part (+40 et tirage du
  coffre réservés à la séance complète). C'est le principe « confiance +
  audit » appliqué aux séances.

- **Clôture automatique en fin de journée si ≥ 1 exercice validé.** → Une
  séance réelle ne doit jamais être perdue pour un bouton non vu. Le geste
  explicite (« je m'arrête là », carte visible dès le premier exercice validé)
  reste le chemin normal ; la clôture auto n'est qu'un filet de sécurité.
  Mise en œuvre : l'app étant côté client, la clôture se joue au premier
  chargement d'un jour ultérieur (aucun processus ne tourne à minuit).

## v19.17 — août 2026

- **Tous les chronos sont basés sur un horodatage cible (`fin` en epoch ms),
  jamais sur un décompte par intervalles.** → iOS gèle le JS de Safari en
  arrière-plan : un « reste − 1 » par seconde s'arrêtait dès qu'on quittait
  l'app (vécu en salle par Léo). Le restant est recalculé à chaque tick et au
  `visibilitychange` ; un segment enchaîné démarre à la fin théorique du
  précédent, pas à « maintenant ». Règle pour tout futur chrono.

- **Re-tap sur « repos » : ignoré, pas de pause/reprise.** → Remettre à zéro
  était le bug ; une pause mentirait sur le temps réellement écoulé, en
  contradiction avec le point précédent (le chrono suit l'horloge, pas l'app).

- **Troisième orphelin mono-profil corrigé** : `incTour` sauvegardait les
  tours de gainage dans `lvlup-state-v3` (clé d'avant les profils multiples) —
  ils n'étaient jamais persistés sous la clé du profil et ne survivaient que si
  une autre écriture passait derrière. Réécrit sur `maj()` comme le reste.
  → Après `lvlup-role` (v19.14) et `role === "leo"` (v19.15), le balayage
  systématique du backlog monte d'un cran en urgence.

- **Gainage : 3 s de mise en place avant chaque série chronométrée,
  enchaînement automatique après le repos, pas de repos après le dernier
  tour.** → Le tour visé est passé en paramètre de la relance plutôt que relu
  dans l'état : la relance part d'un setTimeout, hors du rendu courant.

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

- ~~**Fréquence : 2 à 5 + option 6 « habitués »**. Pas de 7 (repos non
  négociable).~~ **Remplacée** par le Chantier Programmes (septembre 2026) :
  squelettes de 1× à 7×, le 7e jour étant de la récupération active. Modifiable dans les réglages (via « changer de programme »).
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
