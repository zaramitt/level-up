# Journal des décisions — Level Up!

Une ligne par décision, avec la raison. Format : `date — décision — pourquoi`.
Objectif : ne pas se refaire proposer six mois plus tard un truc déjà écarté.

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

### Cardio (v20.11)

**Cardio : partie intégrante du programme quand l'objectif ou le sport le
réclame, jamais un simple bouton à côté. Notation propre (durée, distance,
vitesse, inclinaison), XP selon la durée.**

- **Qui réclame du cardio** (règles 10 et 11) : « Perdre du poids » et « Me
  sentir mieux » → finisher de 10-15 min d'appareil en fin de chaque séance de
  force, et une séance cardio dédiée dès 4 séances par semaine (3 full body +
  cardio à 4×, haut/bas ×2 + cardio à 5×, push/pull/legs + haut/bas + cardio
  à 6× ; le 7× garde sa récupération active). Un sport d'endurance pratiqué
  pour progresser (course, vélo, natation) → finishers seulement : les
  sorties font le reste, et une séance dédiée viendrait s'ajouter aux jours
  de sport. → Un programme « perdre du poids » sans cardio n'était pas
  crédible ; un coureur n'a pas besoin d'un tapis de plus.
- **Quand un sport est pratiqué pour progresser, il l'emporte sur la
  structure** : même avec « Me sentir mieux », pas de séance dédiée (les
  jours de sport sont déjà là), et le finisher saute avant les exercices
  que le sport a marqués. → Le sport est le modificateur le plus concret.
- **Autres objectifs → le cardio est une option explicite** d'« Ajuster ma
  séance » (« ajouter 15 min de cardio ? » avec le choix de l'appareil),
  jamais imposé. Écarté : l'ancien finisher cardio ajouté d'office dès qu'il
  restait du temps (v20.6) — il surprenait. Le vérificateur le tient : pas
  de finisher hors objectif, un finisher dans chaque séance quand l'objectif
  le réclame (sauf retrait annoncé, faute de temps).
- **Compression** : le finisher passe de 15 à 10 min avant que quoi que ce
  soit ne saute ; ensuite, objectif cardio → les isolations sans rôle
  sautent avant lui ; sport → il saute en premier. Retiré, c'est dit dans
  « À savoir ».
- **Notation du cardio, sans appareil photo par défaut** : durée au chrono
  (qui survit à la fermeture de la carte) ou saisie, et selon l'appareil
  distance, vitesse, inclinaison, résistance ; la photo reste possible,
  facultative, sans malus sans photo — la durée est la preuve. → Une photo de
  machine ne prouvait rien de plus et coupait l'élan.
- **XP selon la durée**, cohérents avec 10 / 15 / 20 par exercice : moins de
  10 min → 5, 10-19 → 10, 20-29 → 15, 30 min et plus → 20. Le jour « Cardio »
  n'a plus de forfait de 30 XP : il joue comme une séance (choix de
  l'appareil, carte, « Terminer la séance »), ses XP viennent de la durée.
- **Progrès** trace le cardio comme une charge (durée, distance) ; le
  journal porte la notation.

### Étape 4 — la séance libre (v20.9)

- **Ajouter, retirer, réordonner, remplacer pour un jour ne touche jamais le
  programme.** Tout vit dans `st.jour[date]` (ajouts, retirés, ordre,
  remplacements) ; seules les actions dites « pour toutes les prochaines
  séances » réécrivent le programme. → Un programme qui bouge à chaque geste
  devient illisible, et le coaché doit pouvoir improviser sans « casser » ce
  qu'on lui a proposé.
- **Un exercice retiré ne compte ni en positif ni en négatif** : pas d'XP, pas
  de malus, il sort simplement de la séance du jour (journalisé à part).
  → Sans culpabilité : la machine est prise, l'épaule tire, le temps manque —
  aucune de ces raisons ne mérite une pénalité.
- **Ajout libre, sans limite**, depuis un panneau à trois onglets — Similaires
  (même focus, phare en premier), Toute la banque (recherche + filtres),
  Cardio & mobilité — avec les doses par défaut de la banque et les XP selon
  la difficulté (barème v20.8). Le même panneau sert à « Remplacer », les
  remplaçants directs (règle 12) en tête. → Un seul outil à apprendre.
- **Reps réelles par série** à la place de la case « j'ai tenu N reps » :
  pré-remplies au haut de la fourchette, corrigées au tap ou −/+, une série
  non modifiée vaut la valeur pré-remplie. La règle 8 lit ces reps ; les
  entrées d'avant gardent leur case « tenu ». → Le geste le plus fréquent
  (tout tenu) reste à zéro tap ; la précision arrive sans friction. Sans
  charge notée ce jour-là, la dernière charge connue sert de base à
  l'incrément (la charge reste facultative).
- **Séance libre** : carte permanente du carrousel, démarre vide, compte comme
  une séance (venir compte), XP des exercices faits, pas de bonus « complète »
  (rien à compléter). → Un jour sans programme reste un jour d'entraînement.
- **Le journal enregistre ce qui a été FAIT** (prévus validés, ajoutés,
  retirés, remplacés, séries, reps, charges, type de charge, ressenti) dans
  chaque entrée d'historique ; Progrès et « dernier » lisent les charges, pas
  le programme. → Un exercice ajouté une fois existe dans Progrès comme les
  autres.
- **Retiré ou remplacé 3 séances de suite → « on l'enlève du programme ? »**,
  jamais automatique ; « Non, je le garde » remet le compteur à zéro. → L'app
  observe et propose, elle n'impose pas (même logique que le niveau observé).
- Écarté : **limiter le nombre d'ajouts** ou les cantonner au focus de la
  séance (« pas de hip thrust un jour pecs »). → Le programme est une
  proposition ; en salle, on fait ce qu'on peut avec ce qui est libre.
- Écarté : un **onglet « Séance libre » séparé** de l'onglet Séance. → Une
  carte de plus dans le carrousel suffit et garde un seul écran de séance.
- Mise en page : le bandeau de repos passe **sous** la carte focus (dedans,
  le bouton de repos est déjà le chrono) — avec les reps par série, la carte
  s'allonge et le bandeau recouvrait la validation.

### Moteur de génération — arbitrages de relecture (étape 2)

Relecture de `MOTEUR.md` par Léo : les règles tenaient, la personnalisation
était trop faible (quatre programmes qui se ressemblaient). Décisions :

**L'objectif se voit dans les exercices.**
- Objectif fessiers : hip thrust obligatoire dans chaque séance qui admet
  les fessiers (c'est le phare), abductions en plus. L'obligatoire prend une
  case d'isolation ; le suivant occupe une **case supplémentaire** ajoutée
  seulement si le temps le permet (retirée en premier par la compression).
  C'est la lecture retenue de la règle 11 : l'objectif colore les cases, et
  peut en ajouter une quand il reste du temps. Au niveau 1 ou sans barre, le
  hip thrust est remplacé selon la règle 12 (hip thrust machine, pont…) et
  le moteur le dit.
- Objectif force : gros mouvements à **3-6 reps, 180 s de repos**, 5 séries
  sur les phares au niveau 3 (4 au niveau 2), **au plus une isolation par
  muscle** par séance (dur en force, simple pénalité sinon), et un exercice
  de moins au minimum de la règle 7 — les séries lourdes prennent la place.
- L'objectif et le sport pèsent autant l'un que l'autre, et bien plus lourd
  que le confort du choix (poids +40 sur un muscle prioritaire).

**Le niveau se voit aussi.**
- Niveau 3 : ni difficulté 1 ni **régression** (pompes genoux, traction
  négative, pistol assisté — marquées dans la banque), sauf absence totale
  d'alternative (mollets, abductions, élévations latérales n'existent qu'en
  difficulté 1 : elles restent).
- Niveau 1 : pas d'exercice marqué **coordination** (dead bug) ; planche
  genoux ou bird-dog (ajouté à la banque) à la place.
- Une variation ne descend jamais de deux crans de difficulté (règle 12).
- Un **accessoire** (extension lombaire, superman, chaise, pull-through,
  marqués dans la banque) n'ouvre jamais une séance et ne remplit une case de
  polyarticulaire que faute de vrai mouvement ; il est alors rangé après.

**Le sport se voit.** Pour un sport avec intention de progresser : une
seconde case unilatérale au bas du corps (bulgares, step-up), les isolations
du haut vont aux épaules plutôt qu'aux bras, un gainage anti-rotation
(planche latérale, Pallof) en plus, et des exercices favoris par sport. Une
entrée **jours de sport** : jamais de séance ce jour-là, séances jambes
loin de la sortie longue (la veille et le lendemain pénalisés).

**Placement** : l'espacement l'emporte sur les blocs collés (4× = lundi,
mardi, jeudi, vendredi ; 3× = lundi, mercredi, vendredi), la semaine avant
le week-end, et le gainage tourne d'une séance à l'autre.

**Volume (règle 3), les cinq arbitrages :**
1. À 1-2 séances/semaine, l'objectif est l'entretien, pas la progression
   maximale ; le moteur le dit honnêtement (« programme d'entretien »).
2. Le **plafond** ne compte que les séries **directes** ; les secondaires
   (comptés ½) restent dans le **minimum**. Motif : le risque de
   surentraînement vient des séries directes ; un dos rempli par les tirages
   est bien travaillé, et c'est souhaité. L'arrière d'épaule reste « dos »
   pour le placement (jour pull) mais ne compte pas dans son plafond.
   Un groupe sous le minimum gagne une série sur son polyarticulaire
   principal tant que la séance tient dans le temps ; la seconde case
   unilatérale du sport peut descendre à 2 séries si le plafond l'exige.
3. Full body 3× à 60 min au niveau 2 : priorité au temps, avertissement
   sur le volume. Le programme tient toujours dans le temps donné.
4. 30 min : compression avec l'étiquette « comprimé », cohérent avec
   « Adapter ma séance » — une séance courte existe au lieu d'être sautée.
5. Quatrième matériel **« rien du tout »** (maison sans équipement) : ni
   barre de traction, ni dips, ni élastique ; le rowing inversé se fait sous
   une table solide ; pas de tirage vertical possible, et le moteur le dit.
   « Poids du corps » garde l'hypothèse barre de traction + dips.

**Finitions de la seconde relecture.** En force, le soulevé de terre
conventionnel est présent une fois par semaine (mouvement roi du « soulever
plus lourd » ; trap bar au niveau 2, et le moteur le dit), un seul rowing
horizontal par séance pull (quatre exercices : deux tirages, deux
isolations), et la poussée verticale est le militaire ou le push press,
jamais l'Arnold press (marqué « hypertrophie » dans la banque). Le filtre
des régressions s'applique **dès le niveau 2** quand le matériel permet
mieux : en salle, pas de pompes genoux ni de planche sur les genoux pour un
intermédiaire ; au poids du corps, la traction négative reste faute de
mieux. Pour le coureur, les ischio-jambiers sont obligatoires (muscle
protecteur) : nordic curl au niveau 3, leg curl sinon.

**Matériel réel.** Les quatre situations (salle, haltères et banc, poids du
corps, rien) ne sont que des raccourcis pré-cochés. À l'étape 3, le matériel
sera une **liste à cocher** dans l'onboarding (haltères, élastique, barre de
traction, banc, kettlebell…) et le moteur lit cette liste telle quelle : un
exercice est faisable si l'une de ses alternatives est entièrement cochée,
le poids du corps étant toujours disponible. Le raccourci « haltères » ne
présume donc ni élastique ni barre de traction : c'est à cocher.

**Durée de séance** : le moteur accepte n'importe quel nombre entier de
minutes (47, 33), pas seulement des multiples de 5. L'interface (étape 4)
permettra de saisir la durée exacte au clavier, en plus d'un curseur.

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

## v20.11 — septembre 2026

Retour terrain de Léo sur la v20.9, second commit : le cardio, citoyen de
première classe. Décisions dans « Chantier Programmes — Cardio » ci-dessus.
En bref : notation propre du cardio (chrono ou saisie, distance, vitesse,
inclinaison, résistance), XP selon la durée (5 / 10 / 15 / 20), photo
facultative, jour « Cardio » joué comme une séance, courbe dans Progrès ;
cardio intégré au programme quand l'objectif ou le sport le réclame (finisher
10-15 min, séance dédiée dès 4×), vérifié par les règles ; sinon option
explicite d'« Ajuster ma séance » avec le choix de l'appareil.

## v20.10 — septembre 2026

Retour terrain de Léo sur la v20.9, premier commit : bugs et clarté.

- **Champs de saisie à 16 px minimum.** → Safari iOS zoome sur tout champ
  plus petit, et l'écran reste zoomé à la fermeture du clavier (vu sur le
  prénom). Vérifié par le harnais sur tous les écrans qui ont un champ.
- **Déplacer un exercice : un libellé explicite plus un appui long.** Les
  flèches ▲ ▼ nues étaient incompréhensibles. « Déplacer » ouvre « Monter /
  Descendre d'une place » ; dans la liste, un appui long soulève l'exercice
  pour le glisser. Arbitrage tactile : tant que l'appui long n'a pas abouti,
  un doigt qui bouge fait défiler (et annule l'appui) ; une fois l'exercice
  soulevé, le défilement est bloqué. → Pas de conflit avec le scroll, pas de
  poignée à viser, tap franc sur iOS (le clic qui suit le relâchement est
  avalé).
- **Tout exercice a « Remplacer » et « Ajouter un exercice après celui-ci »**,
  gainage compris (le cardio, dans la liste des exercices, les avait déjà).
  → Le gainage était le seul bloc figé.
- **Idées de récompenses en voix nominale**, sans pronom de locuteur : « Un
  café dans ton endroit préféré, offert par ton coach » / en solo « que tu
  t'offres ». → « Je t'emmène dans ton café préféré » faisait croire à la
  coachée qu'elle devait offrir. Une idée qui garde un « je » est écartée
  par le worker.
- **Temps de génération : mesuré et montré, pas deviné.** Le worker renvoie la
  durée et le nombre d'appels ; l'app affiche une progression pendant
  l'attente et la mesure en toast. Le second appel (relecture) ne part
  qu'après détection d'un problème — c'était déjà le cas, la mesure dira si
  c'est lui qui pèse. Écarté : couper la relecture ou raccourcir la sortie
  sans mesure réelle.
- **Carte « Gagne tes premiers XP »** : fermable, et disparaît d'elle-même
  dès les premiers XP. → Elle restait affichée sans raison.
- Table des négos harmonisée avec le thème (en-tête comme « Le Pari », puces),
  « + » des reps recadré dans la carte focus.

## v20.9 — septembre 2026

Chantier Programmes, étape 4 : **la séance libre**. Décisions détaillées dans
« Chantier Programmes — Étape 4 » ci-dessus (principe fondateur en tête de la
section). En bref : ajouter / retirer / réordonner un exercice pour le jour
sans toucher au programme, panneau unique à trois onglets partagé avec
« Remplacer », reps réelles par série (règle 8 sur les reps), séance libre
permanente dans le carrousel, journal de ce qui a été fait, proposition après
trois retraits de suite. Backlog : « Répétitions par série » et « ÉTAPE 4 »
traités.

## v20.8 — septembre 2026

Retour terrain de Léo sur la v20.6, second commit : rappels et idées.

- **Notifications de séance, quand l'app est installée sur l'écran
  d'accueil** : fin du repos en cours si l'app est en arrière-plan, « Tu as
  fini ? Termine ta séance pour la compter » 18 min après le dernier exercice
  validé tant que la séance n'est pas terminée. Mise en œuvre : sur iPhone,
  l'app en arrière-plan est gelée, seul un push du serveur arrive. L'app
  planifie donc côté serveur (`/planifier`) et un **cron chaque minute**
  pousse ce qui est dû ; le message à afficher est déposé sous `<code>:notif`
  et le service worker vient le lire (le push reste sans payload chiffré,
  comme depuis la v19). Limites assumées : une minute d'imprécision au plus
  sur la fin du repos (le cron), et un push qui peut arriver alors qu'on vient
  de rouvrir l'app (l'annulation part dès que le repos s'achève à l'écran, le
  cron peut déjà être passé). Écarté : Durable Objects avec alarme (exact à la
  seconde, mais une migration de déploiement à faire par Léo) — à reprendre
  si l'imprécision gêne en salle. Sur Android, l'app notifie aussi elle-même
  en arrière-plan. Une échéance en retard de plus de 15 min n'est jamais
  poussée. Compteur KV : une écriture par planification (≈ 25 par séance),
  loin des 1 000 par jour du palier gratuit pour quelques personnes.
- **Clôture automatique après 3 h sans activité, comme partielle** (règle
  « venir compte » de la v19.18), en plus de la clôture au jour suivant. Le
  dernier geste (`J.activite`) est horodaté à chaque validation, charge,
  repos ou tour de gainage ; la vérification se fait au chargement, au retour
  au premier plan et à la minute — jamais de processus serveur pour ça.
- **Idées de récompenses sur Sonnet** (`claude-sonnet-5`, le quota journalier
  borne le coût : 10 par code, 150 pour l'app), avec trois exigences dans le
  prompt : chaque idée est concrète et expliquée (une ligne « Concrètement :
  … », stockée avec la récompense et affichée sur sa carte), français
  irréprochable, ton humain — et trois bonnes idées, trois mauvaises
  (« défi farfelu avec gage hilarant », « défi photo ridicule », « blagues
  marantesse ») en exemple. **Vérification orthographique minimale côté
  worker** : pas d'analyse de la langue, mais ce qu'un mot inventé ou une
  sortie hors format laisse derrière lui (lettres triplées, mot sans voyelle,
  mot de plus de 20 lettres, caractère hors alphabet, texte trop court ou
  trop long) ; hors format ou plus d'un tiers d'idées suspectes → une seule
  nouvelle génération avec consigne de relecture, puis les suspectes sont
  écartées. Jamais une idée suspecte à l'écran ; s'il ne reste rien, l'app dit
  que l'IA n'a rien produit de propre.
- **Barème d'XP selon la difficulté de l'exercice** (banque : 1 / 2 / 3) :
  +10 / +15 / +20 au lieu de +15 uniforme, sans photo 5 de moins (5 / 10 / 15,
  la photo garde son avantage). Transparence : le « jusqu'à N XP » des cartes
  et la pastille par exercice suivent, l'en-tête de séance dit la fourchette
  (« 10 à 20 XP par exercice »), le récap dit « N exercices validés = X XP ».
  Les points attribués sont mémorisés par exercice (`J.xpExos`) : une
  annulation retire exactement ce qui avait été donné. Les anciens programmes
  (templates sans difficulté) restent à 15.

## v20.7 — septembre 2026

Retour terrain de Léo sur la v20.6, premier commit : les corrections.

- **Ressenti : après le tap, seul le choix retenu reste**, modifiable d'un tap
  (« modifier » rouvre les trois boutons). Trois boutons qui restent affichés
  après le choix faisaient douter que le tap ait été pris.
- **« dernier » n'est affiché qu'avec une vraie valeur.** La case « j'ai tenu
  N reps » et le ressenti créent une entrée du jour sans charge ; elle
  s'affichait en « dernier : » vide. L'app remonte à la dernière entrée qui
  porte une valeur.
- **En duo, cagnotte et paris existent toujours.** Diagnostic : en l'état, la
  cagnotte disparaissait sans un mot dès que `/pot` ne répondait pas, et les
  deux sections ne disaient rien du coach pas encore relié. Désormais : tant
  que le coach n'a pas rejoint (`st.coachLie`), le pari affiche « Dès que ton
  coach a rejoint, vous pourrez lancer un pari » (pas de bouton), la cagnotte
  dit qu'elle se remplit déjà et que le coach la verra ; serveur injoignable →
  « indisponible pour le moment — Réessayer », jamais masqué. Le rôle, lui,
  est bien détecté (`profil.solo` seul décide).
- **Sons : session audio « ambient »** (`navigator.audioSession`, iOS 17+) pour
  que les bips se mêlent à la musique au lieu de la couper ; sans l'API, sons
  courts et volume à 0,45. Revers assumé, à confirmer en salle : en
  « ambient », le bouton silencieux coupe aussi les bips (la v19.21 s'appuyait
  sur l'inverse). Si les bips manquent en silencieux, la piste est un réglage
  « bips prioritaires » qui repasse en `playback`.
- **Modificateur foot renforcé** : ischios obligatoires (nordic au niveau 3,
  leg curl sinon), adducteurs, abducteurs, mollets et quadriceps prioritaires,
  favoris à tous les niveaux (fentes, step-up, curtsy, clamshell, abduction,
  mollets, RDL une jambe, Pallof, face pull, push press). Vérifié par test : au
  moins deux exercices adaptés par séance bas et un par séance haut, à tous
  les niveaux et fréquences. Limite connue : au niveau 1 (4-5 exercices par
  séance), les cases d'isolation vont à l'unilatéral et aux ischios, pas la
  place pour les hanches et les mollets en plus. Le bird-dog compte comme
  anti-rotation de difficulté 1 (la planche sur les genoux n'en est pas).
- **Le phare ouvre toujours sa case** (règle 9) : jour push = développé
  couché, puis un second exercice pecs choisi par la variation ; de même
  squat barre, RDL, militaire, rowing barre, traction. Au niveau 3, la
  préférence pour les versions avancées le faisait sauter (dips et incliné à
  la place). Exceptions : l'unilatéral (case de variété et de sport) et un
  favori du sport dans le même compartiment (rugby : soulevé de terre).
  Corollaire : l'Arnold press ne se place plus de lui-même (le militaire
  ouvre la poussée verticale) ; il reste comme remplaçant.
- **Banque : « Dips à la machine assise »** (machine, charge en kg,
  difficulté 2, monte vers les dips) — remplaçant direct des dips quand les
  barres manquent (règle 12 : un cran de difficulté au plus, d'où le 2). Les
  autres exercices au poids du corps avaient déjà leur version machine ou
  poulie (chest press, traction assistée, tirage horizontal, développé épaules
  machine, presse, triceps poulie, mollets, leg curl, hip thrust machine,
  abduction) — vérifié par test.
- **Progrès : un graphique par exercice dès la première charge notée**, un
  point au centre et « la courbe se dessine dès la prochaine » ; plus de liste
  « une seule note » à part.
- **« Fin de séance » → « Terminer la séance »** : un verbe, une action.
- Au passage : le vérificateur signalait sept fois « grosse séance jambes
  la veille d'un sport » en placement strict (un `else` rattaché au mauvais
  `if`) — corrigé, la règle souple ne s'applique qu'en placement souple.

## v20.6 — septembre 2026

Retour terrain complet de Léo, second commit : les évolutions.

- **Écran Séance : mode focus, l'accordéon est abandonné.** Alternative (b)
  de la v19.16, choisie après test terrain : au tap, la carte s'ouvre en popup
  quasi plein écran, fond flouté comme le spotlight des récompenses, fermeture
  par la croix ou un tap à l'extérieur ; la liste compacte reste derrière.
  Le corps n'est plus monté en permanence (v19.16, « corps monté en
  permanence ») : chaque saisie de charge est enregistrée au fil de l'eau,
  rien ne se perd à la fermeture. Le chrono de repos passe au-dessus du focus.
- **Noms de séances : les muscles en grand, le geste en petit.** « Push » ne
  parle qu'à qui connaît déjà ; « Pecs · épaules · triceps » parle à tout le
  monde. Le geste reste (« Push (poussée) ») pour qui l'a appris.
- **La séance choisie passe au-dessus de la grille du mois**, du défi et du
  joker : c'est elle qu'on vient faire.
- **Types de charge au poids du corps** : poids du corps / lesté (+kg) /
  assisté (−kg, machine ou élastique), pour tout exercice de la banque
  faisable au poids du corps (dips, tractions, pompes, fentes…). L'assistance
  est stockée en négatif : la meilleure série est la moins assistée, le
  graphique et « dernier » suivent, l'incrément proposé fait baisser
  l'assistance. Au poids du corps, la progression se dit en reps puis en
  passant au lesté.
- **« Ajuster ma séance du jour — temps, énergie », dans les deux sens.**
  Temps en plus → le moteur propose des compléments (le gainage s'il manque,
  une isolation d'un muscle du focus pas encore travaillé, un finisher cardio,
  ou mobilité en reprise douce), trois au plus, jamais au-delà du temps,
  refusables d'un tap. « À fond » → une série de plus sur les gros exercices
  (cinq au plus) et un cran de charge suggéré et pré-rempli. 120 min ne donne
  plus une séance de 54.
- **Les jours de sport ne rendent jamais un programme impossible.** Règle 4,
  mode souple : quand les jours de sport ne laissent pas la place, on
  s'entraîne aussi ces jours-là, et la règle dure devient « pas de grosse
  séance jambes la veille ni le jour d'un match ». En tout dernier recours
  (six séances et trois jours de foot : un seul jour possible pour des
  jambes), le moteur place sans en tenir compte et le dit.
- **Sport + « progresser » : l'effet est visible**, une phrase par séance
  (« Adapté au foot : ischios (Nordic curl), unilatéral (Fentes bulgares),
  gainage anti-rotation (Pallof press) »), dans l'aperçu et dans l'en-tête de
  la séance. Vérifié par un test : avec l'intention de progresser, plus de
  favoris du sport, une case unilatérale en plus, un gainage anti-rotation.
- **Proposer une récompense sans coach** : la proposition part dans la
  table, elle attend ; une carte le dit, et juste après la proposition l'app
  propose d'inviter le coach maintenant (« Plus tard » reste possible).
- **Parcours coach par lien : pas d'onboarding complet.** Le lien porte le
  code et le prénom (`&de=`) ; le coach donne son prénom, puis « Tu veux
  aussi t'entraîner ? » — non → Suivi ; oui, en duo avec la personne ou avec
  quelqu'un d'autre → son profil coach est créé sans recharger et
  l'onboarding coaché enchaîne, avec un nouveau code duo (un code = une
  personne coachée). Les deux profils cohabitent sur le téléphone.
- **« Ton coach t'attend »** : un tap explique ce que ça implique pour lui
  (voir tes séances et tes photos, valider, offrir — et que ça ne lui coûte
  rien s'il ne veut pas offrir).
- **Progrès sans historique : un graphique exemple grisé**, pour voir ce qui
  attend, plutôt qu'un « Rien encore ».

## v20.5 — septembre 2026

Retour terrain complet de Léo, premier commit : les corrections.

- **Onboarding : chaque écran remplit le viewport réel et tient sans
  défiler.** `100dvh` (pas `100vh` : sur iPhone, les barres de Safari mangent
  le bas), zones sûres, un pied de page par écran, la promesse répartie sur
  la hauteur, les trois cartes de mode denses au lieu d'étirées. Règle de
  `CLAUDE.md` désormais **vérifiée par le harnais** (suite 07) sur 390×664 et
  390×844 : tient sans scroll ET remplit ≥ 85 % — pour chaque écran.
- **Toasts** : 4 s minimum, fermeture au tap, les erreurs restent jusqu'au
  tap, au-dessus de tout (le panneau Réglages compris), sur plusieurs lignes.
  Plus aucune troncature à 80 caractères. Les erreurs des rappels disent le
  cas (permission refusée, indisponible côté serveur, service non accepté).
- **« Générer des idées » : la vraie cause** était le schéma de sortie
  structurée (`minimum`/`maximum`, `maxLength`, `minItems`/`maxItems`), hors
  du sous-ensemble supporté par l'API → 400 → 502 → « Oups ». Schémas réduits
  au sous-ensemble (types, `enum`, `required`, `additionalProperties:false`),
  bornes en code, repli en texte si l'API refuse encore, et l'app dit la
  raison réelle (statut de l'IA, quota, budget, code inconnu, trop vite).
- **Cagnotte : seuls les jours de séance prévus manqués comptent** (la
  semaine du moteur fait foi ; un programme sans semaine compte tous les
  jours, comme avant). La décroissance d'XP, elle, reste par jour sans
  passage : c'est la règle du jeu affichée.
- **« Fin de série → lancer le repos »** : un vrai bouton (couleur de la
  séance) ; le chrono ne saute plus à droite (la translation de centrage
  entrait en conflit avec l'animation).
- **« À savoir sur ce programme »** se ferme pour de bon (« Compris »,
  signature des avertissements mémorisée) et reste dans Réglages → Mon
  programme.
- **Bulle « Ta base » en quatre puces numérotées**, une action par puce.
- **Sons du gainage** : plus doux (amplitude 0,5), un « go » discret à la fin
  de la mise en place, un tic à chacune des trois dernières secondes, trois
  notes montantes à la fin du travail.
- **Photo de preuve et charges** : aucun blocage n'existait dans le code ; la
  mise en page laissait croire le contraire. Le champ est dit « facultatif »,
  et le mode focus (v20.6) réordonne.
- **« dernier » à 0** : 0 est une valeur, revenir à 0 avec les boutons efface
  bien la charge de la série.

## v20.4 — septembre 2026

Chantier sécurité, temps 2 (l'audit est dans `SECURITE.md`). Ce qui a été
décidé, et pourquoi :

- **Aucun secret dans le code, jamais.** La clé privée VAPID était en clair
  dans `worker.js` depuis le premier commit, dépôt public : régénérée, elle vit
  dans le dashboard (`VAPID_PRIV`), la clé publique aussi (`VAPID_PUB`,
  injectée dans la page). Purger l'historique git aurait été inutile : la clé
  était déjà copiée partout. Révoquer suffit.
- **Réactivation des rappels : une carte, un tap, sans jargon.** Un
  abonnement pris avec l'ancienne clé ne vaut plus rien ; l'app le détecte
  (clé de l'abonnement ≠ clé courante) et propose « On a renforcé la sécurité
  de l'app. Réactive tes rappels en un tap ». Pas de message technique.
- **Un code inconnu = zéro appel IA.** Le quota par code ne bornait rien
  puisque tout code de 8 à 30 caractères était accepté. Désormais l'app
  enregistre son code (`/profil`) et l'IA refuse les autres ; un budget
  journalier pour toute l'app (150 idées, 100 lectures) plafonne la facture
  quoi qu'il arrive. Le message dit quel quota est atteint (le sien, ou celui
  de l'app pour la journée).
- **Ce que la personne tape ne va jamais dans le prompt système.** Le
  contexte des idées passe dans le message utilisateur, présenté comme une
  indication de goût.
- **Le worker n'appelle jamais une URL arbitraire.** `/abonner` n'accepte que
  les services push d'Apple, de Google (FCM) et de Mozilla. Edge sur Windows
  (WNS) est donc refusé, l'app le dit : à élargir si une utilisatrice le
  demande.
- **Le serveur ne garde que ce que l'écran Suivi lit.** Liste blanche des
  champs de `/etat`, tailles bornées par route. Les XP restent calculés par le
  client : un client modifié peut se mentir, la photo reste la preuve, le
  serveur n'a pas les règles pour recalculer et ne les aura pas.
- **Pas de séparation des rôles côté serveur pour l'instant.** La coachée
  peut forger une action coach et inversement ; c'est une limite de
  l'architecture « un code = une capacité », acceptée pour un duo de confiance
  sans argent réel. Le schéma « un secret par rôle » est au backlog, priorité
  haute, prérequis avant ouverture hors du cercle proche.
- **Limitation de débit dans le worker, pas dans le WAF.** Sur `workers.dev`
  il n'y a pas de zone, donc pas de règle WAF ni de limitation de débit
  dashboard : un compteur par IP en mémoire (par isolat) freine les boucles ;
  le budget journalier reste le vrai plafond. À revoir le jour d'un domaine
  à soi.
- **Space Grotesk auto-hébergée.** Google Fonts recevait l'adresse IP de
  chaque utilisatrice à chaque ouverture (le cas jugé à Munich en 2022) ; la
  police (OFL) est servie par le worker, embarquée par `outils/sync.js`.
- **CSP à nonce plutôt qu'à empreintes.** Les scripts en ligne changent à
  chaque livraison ; le nonce est posé à la volée par le worker et rejoué par
  le mock du harnais, ce qui teste la CSP réelle sur un parcours.
- **Page « Confidentialité et mentions légales » en langage clair**, depuis
  les Réglages, même texte dans `CONFIDENTIALITE.md` ; ni « KV », ni « API »,
  ni « RGPD » dans le texte. L'éditeur est désigné par l'adresse de contact
  (variable `CONTACT`), pas par un nom en dur dans un dépôt public.
- **Le code duo reste dans l'URL.** Passage en en-tête évalué : gain marginal
  (seuls les journaux Cloudflare optionnels le voient), ~25 points d'appel.
  Pas fait.
- **Photos : pas de chiffrement côté client pour l'instant.** Ça protégerait
  contre une fuite KV, pas contre qui a le code ; au backlog.

## v20.3 — septembre 2026

Chantier Programmes, étape 3 passe 2, commit 3 : **les textes des bulles
d'aide**. Les six bulles (Séance, Habitudes, Progrès, Récompenses côté
coachée et côté coach, Suivi) sont réécrites : simples, chaleureuses, une
idée par bulle, dans la voix de l'app, et **accordées à la préférence
elle/il/neutre** à l'affichage (`bulleTexte` → `accorde`). Elles expliquent
l'onglet à quelqu'un qui ouvre l'app pour la première fois, y compris
l'accordéon, le ressenti et « On ajuste » arrivés en v20.1, et la courbe de
charge de la v20.2. La bulle Récompenses a une **variante solo** (pas de
négos, de paris ni de cagnotte à expliquer à qui se coache seul·e). Les
bulles du coach parlent de la personne coachée sans la genrer (l'app ne
connaît que la préférence de la personne qui lit).

## v20.2 — septembre 2026

Chantier Programmes, étape 3 passe 2, commit 2 : **le suivi**.

- **Graphique de charge par exercice** dans l'onglet Progrès, façon balance
  connectée : une carte par exercice pratiqué au moins deux fois, avec la
  charge de travail par séance (la meilleure série, comme la progression et
  les badges) dans le temps, courbe et aire, axe des kg (min / max), dates aux
  extrémités, badge PR quand la dernière séance bat toutes les autres. Les
  séances ressenties « trop dur » (entrée de charge ou ressenti du jour) sont
  marquées d'un cercle pointillé discret. Liste triée par récence. Un
  exercice pratiqué une seule fois est listé à part (« la courbe viendra à la
  deuxième »). Inline SVG, sans bibliothèque.
- **Le carnet de charges est remplacé, pas dupliqué** : chaque carte reprend
  ce qu'il montrait (nombre de notes, dernière date, dernière charge, record)
  et y ajoute la courbe. Motif : deux listes des mêmes exercices l'une sous
  l'autre auraient doublé la page.
- **Les exercices remplacés apparaissent sous leur propre nom** : `nomDe`
  cherche dans le programme courant, puis dans la banque embarquée. Leur
  historique reste sous leur identifiant, il n'est jamais fusionné avec celui
  du remplaçant.

## v20.1 — septembre 2026

Chantier Programmes, étape 3 passe 2, commit 1 : **la séance vivante**.

- **Ressenti après exercice (règle 7)** : trois boutons Facile / Juste / Trop
  dur à la validation, un tap, facultatif, modifiable, jamais bloquant. Stocké
  par exercice et par séance (`ressentis`), et reporté sur l'entrée de charge
  du jour. Le niveau observé se recale **sur les gros exercices seulement**
  (polyarticulaires) : quatre « facile » d'affilée → l'app propose de monter
  d'un cran ; trois « trop dur » sur les six derniers → de redescendre.
  Jamais à l'insu : une carte dans l'onglet Séance (« On dirait que tu
  progresses… On monte d'un cran ? ») avec « Oui » (aperçu direct du
  programme recalculé, puis adoption) ou « Pas maintenant » (refus mémorisé
  deux semaines). Le cran accepté vit dans `reponses.niveauAjuste` (±1, borné
  1-3) ; après une adoption, seuls les ressentis postérieurs comptent. Le mot
  « niveau » n'apparaît toujours pas : « relevé / abaissé d'un cran ».
- **Incrément proposé (règle 8)** : condition = toutes les séries de la
  dernière fois au haut de la fourchette **et** ressenti facile ou juste. Les
  reps par série n'étaient pas notées : une seule case « J'ai tenu N reps sur
  toutes les séries » sous la saisie des charges (arbitrage : une case plutôt
  qu'un champ de reps par série, pour rester à un tap). +2,5 kg haut du
  corps, +5 kg bas du corps et machines (le tirage vertical à la poulie est
  « machine »), jamais plus. Suggestion pré-remplie et expliquée (« +2,5 kg,
  tu as tenu 12 reps partout »), modifiable. Un « trop dur » annule la
  proposition suivante ; un jour de petite forme aussi (les charges baissent,
  elles ne montent pas).
- **Remplacer (règle 12)** : deux motifs (matériel indisponible / je préfère
  autre chose), 2 à 3 candidats via `remplacerExercice`, le phare en premier,
  chacun avec muscle, matériel et dose. Le remplaçant garde la dose de
  l'original (séries, fourchette, repos) sauf isométrie ou fourchette courte
  imposée par la banque (négatives, nordic). Pour aujourd'hui
  (`J.remplacements`), ou « pour toutes les prochaines séances aussi » (le
  programme est réécrit, dans chaque séance qui avait l'exercice). Les charges
  restent sous l'ancien identifiant ; un exercice d'un ancien programme, hors
  banque, renvoie vers la migration.
- **Adapter ma séance** : bouton sous la carte tant que rien n'est validé.
  Temps (curseur + saisie exacte, défaut = dernière adaptation, sinon la durée
  prévue) et énergie (à fond / normal / petite forme). Recompression par le
  moteur dans l'ordre de « Adapter ma séance » : isolations, séries, repos
  jusqu'aux planchers, jamais les polyarticulaires. Petite forme : une série
  de moins (jamais sous 2), charges suggérées −10 % arrondies à 2,5 kg, repos
  préservés. La séance adaptée compte comme une séance normale et l'entrée
  d'historique porte `adaptee: true`. Annulable tant que rien n'est validé.
- **Jour de récupération active (7×)** : écran dédié (`RecupView`), ton
  différent, pas de charge, pas de repos, des durées ; 5 XP par activité et
  15 si tout est bouclé (au lieu de 15 et 40), pas de barre « Fin de
  séance », pas de photo demandée. L'historique porte `recup: true`.
- Ressenti, remplacement, adaptation : tous de vrais `<button>` avec
  `touch-action: manipulation` (tap franc sur iOS, comme v19.6 / v19.10).

## v20.0 — septembre 2026

Chantier Programmes, étape 3, passe 1 : **le moteur est branché**. Première
étape qui change l'app pour les utilisatrices, d'où le saut de numéro.

- **Le programme est produit par `genererProgramme()`**, dans l'app :
  `moteur-programmes.js` et `banque-exercices.json` sont embarqués dans
  `index.html` (synchronisés par `outils/sync.js`). → Génération
  instantanée et hors ligne, aperçu de migration sans réseau, aucun quota, une
  seule source de vérité testée à sec. Le worker ne fait plus tourner de
  moteur. Choix de route : **`/generer` est supprimée** (404 « route
  inconnue » comme toute route absente) et remplacée par **`/interpreter`**,
  seul point d'extension IA prévu : l'objectif en texte libre → objectif de
  base + muscles prioritaires (format garanti par l'API, quota 10/jour). Si
  l'IA échoue, répond hors format ou n'est pas configurée : repli sur
  « esthétique équilibré », et l'app le dit sur l'écran prénom et dans
  l'onglet Séance. **Aucune génération de structure par l'IA** ; le prompt de
  génération est retiré.
- **Nouvelles questions d'onboarding**, dans l'ordre : fréquence 1 à 7 (le 7
  présenté comme « 6 séances + 1 jour de récupération active »), objectif
  (inchangé), deux questions factuelles, sport (14 + non, puis intention et
  jours de sport), matériel à cocher (raccourcis salle complète / maison
  équipée / poids du corps / rien du tout, « salle complète » coche tout),
  temps par séance (curseur + saisie exacte au clavier, défaut 60).
  Correspondance questions → niveau observé initial, jamais affiché :
  « Jamais fait de muscu » → 1 quelle que soit la technique ; « Quelques
  mois » → 2 si squat et pompe sûrs, sinon 1 ; « Plus d'un an
  régulièrement » → 3 si sûrs, sinon 2. Le ressenti après exercice (passe 2)
  recalera ensuite.
- **Toutes les réponses sont modifiables dans les réglages** (section « Mon
  programme »), chacune ouvrant le flux de régénération directement à cette
  question, avec aperçu avant d'adopter.
- **Migration des profils existants, option (b)** : rien ne change au
  déploiement. Carte dans l'onglet Séance + accès dans les réglages ; les
  questions sont **pré-remplies depuis le programme actuel** (fréquence =
  nombre de séances, objectif déduit du template, matériel = salle ou rien),
  parce que les anciens onboardings ne stockaient aucune réponse ; puis
  aperçu complet, « Adopter ce programme » / « Garder l'ancien ». Refuser
  masque la carte sans la supprimer des réglages. À l'adoption, l'historique
  des charges est conservé (identifiants stables depuis l'étape 1) ; un
  exercice jamais fait n'affiche pas de « dernier ». Cette carte est aussi
  le chemin de « Changer de programme » pour tout le monde. L'écran
  `ChoixProgramme` (templates + prompt) est retiré ; les templates
  `PROGRAMMES` restent dans le code pour les profils qui les utilisent
  encore.
- **Affichage** : consigne visible sous le nom dès l'exercice déployé,
  erreur fréquente sur un tap (exercices et gainage). Les avertissements du
  moteur (« Sans barre de traction ni élastique, pas de tirage vertical : le
  dos reste sous-travaillé », « programme d'entretien », lecture IA de
  l'objectif) sont montrés dans l'onglet Séance et dans l'aperçu, en clair.
  Le gainage d'un programme du moteur est une liste propre à la séance ;
  les anciens programmes gardent la liste globale. Les cartes du carrousel
  affichent la durée calculée par le moteur.
- **Sécurité** : test automatique (`v2000.js`, harnais Playwright) qui
  vérifie qu'un profil existant ne change pas de programme sans action
  explicite, y compris après un aperçu refusé et un rechargement.
- Hors de cette passe (passe 2) : ressenti après exercice, proposition
  d'incrément, « pas cette machine », « générer une variante », « Adapter ma
  séance ».

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
  réordonnancement brouillerait. **Statut : test terrain fait, l'alternative
  (b) — mode focus plein écran — est retenue en v20.6** ; la liste compacte
  et l'ordre restent, seul le corps change de forme.

- **Bulles d'aide : popup au premier passage, puis rappelables par l'icône
  « ? » de l'en-tête** — au lieu d'un encart permanent en haut de chaque onglet.
  → L'encart mangeait le haut de l'écran à chaque ouverture alors qu'il n'est
  utile qu'une fois. La popup vaut pour les six bulles existantes, y compris
  celle du coach sur l'onglet partagé (cf. correctif B7, v19.14).

- **Corps de l'accordéon monté en permanence, seule la hauteur est animée.**
  → Démonter le corps à la fermeture réinitialiserait les charges saisies par
  série. Coût nul : avant l'accordéon, tous les exercices étaient déjà montés.
  *(Caduc en v20.6 : le corps s'ouvre en focus et n'est monté qu'ouvert ;
  chaque saisie est enregistrée au fil de l'eau, rien ne se perd.)*

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
