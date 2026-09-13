# Audit de simplification — Level Up! (v20.14)

Objectif de Léo : l'app est une usine à gaz, il veut de la lisibilité. Cet audit ne change
rien dans le code. Écran par écran, chaque élément affiché reçoit un verdict et une
proposition concrète. Les numéros de ligne renvoient à `index.html`.

Verdicts : **indispensable** (l'écran ne tient pas sans) · **utile** (garde, parfois en
plus discret) · **à fusionner** (deux endroits pour la même chose) · **à retirer** (ou à
mettre à la demande : il sert une fois par mois, ou il explique au lieu de faire).

Ce que l'audit cherche en priorité : les doublons, les informations permanentes qui
pourraient être à la demande, les boutons visibles qui servent une fois par mois.

## Les trois chantiers qui rapportent le plus

1. **Une seule invitation coach.** Six points d'entrée pour la même action (onboarding,
   modale « premiers XP », carte repliable de l'onglet Séance, encart Négos sans coach,
   modale Négos « Ta proposition est prête », Réglages). Garder : l'onboarding et une
   ligne dans Réglages. Le reste devient un rappel unique, discret, qui disparaît au
   premier lien envoyé ou au premier refus (« Je verrai plus tard » = plus jamais de
   carte, seulement Réglages).
2. **Les explications sortent des écrans.** Douze textes permanents de 2 à 6 lignes
   (règles du jeu en pied de Séance, rappel du guide dans Habitudes, barème des négos,
   fonctionnement de la cagnotte, note sur la pause, aide des séries…). Tout ça existe
   déjà sous « Les règles du jeu » et les bulles « ? ». Règle : **un écran montre ce
   qu'on fait, jamais pourquoi** ; le pourquoi est derrière un « ? ».
3. **Une seule validation de séance, une seule façon de déplacer, un seul « Ajouter ».**
   La barre de fin flottante ET le bouton en bas de liste ; « Déplacer » (menu
   Monter/Descendre) ET l'appui long ; « Ajouter un exercice » global ET « Ajouter après
   celui-ci » sur chaque carte et chaque gainage. Chaque fois, garder l'un.

Estimation : ces trois chantiers retirent une trentaine d'éléments visibles sans perdre
une seule fonction.

---

## 1. Onboarding

| Élément | Verdict | Proposition |
|---|---|---|
| Promesse : logo, « LEVEL UP ! », accroche « Chaque effort compte. Littéralement. » (l. 10960-10994) | indispensable | — |
| Texte de 3-4 lignes « Quelqu'un qui tient à toi devient ton coach… » (l. 11005) | à retirer | Les 4 puces icônes juste dessous disent la même chose : garder les puces, retirer le paragraphe. |
| Ligne « Tes photos restent entre vous deux… » (l. 11013) | utile | Garder : c'est la seule phrase de confiance. |
| 4 puces (XP, photo-preuve, récompense, régularité) (l. 11020-11050) | indispensable | — |
| Bloc « PROFILS EXISTANTS » (l. 11085-11116) | utile | Ne l'afficher que s'il y a un profil (déjà le cas ?) ; sinon rien. |
| Numéro de version (l. 11123) | utile | Le déplacer dans Réglages, tout en bas. |
| Mode de jeu : 3 cartes + pied « Tu pourras changer d'avis » (l. 11126-11216) | indispensable | Retirer le pied : « rien n'est définitif » est vrai partout, on ne le dit nulle part ailleurs. |
| Écran coach : explication du code duo (3 variantes), champs, écran 2 « Tu veux aussi t'entraîner ? » (l. 11218-11375) | utile | Fusionner les 2 écrans coach en un seul : prénom, code (ou « rempli par le lien »), et une case « Je veux aussi m'entraîner ». |
| Questions programme : 10 questions avec barre de progression (l. 10262-10398) | indispensable | Regrouper « déjà fait de la muscu ? » et « sais faire squat et pompe ? » sur un même écran (deux lignes de boutons) : 9 écrans au lieu de 10. |
| Pied « Tu pourras tout modifier plus tard : Réglages → Mon programme » (l. 10389) | à retirer | Une fois, sur le dernier écran des questions, suffit. |
| Styles de récompenses : chips + note + encart « Par exemple : … » (l. 11610-11685) | utile | Retirer l'encart d'exemples (5 lignes) : les idées IA le font mieux, plus tard. Garder chips + une ligne. |
| Prénom + code : champ prénom, champ code, note « Après, dans les réglages… », case import legacy, bandeau IA, bandeau d'échec 4 variantes (l. 11470-11608) | à fusionner | Le bandeau d'échec IA (3 lignes, 4 variantes) devient un toast. La note « Après, dans les réglages… » saute (doublon de l'écran Invitation qui suit). |
| Écran Invitation « Quelqu'un tient à toi ? » (l. 11403-11468) | indispensable | C'est LE point d'entrée de l'invitation. Garder tel quel. |

## 2. Onglet Séance — sans séance choisie

| Élément | Verdict | Proposition |
|---|---|---|
| Carte migration « Nouveau moteur — régénérer ? » (l. 5477-5516) | à fusionner | Doublon avec Réglages → Mon programme → « Nouveau moteur ». Garder la carte une fois (elle se ferme), retirer le bouton des Réglages une fois le nouveau moteur adopté. Temporaire de toute façon : à supprimer quand plus aucun profil n'est sur l'ancien moteur. |
| « À SAVOIR SUR CE PROGRAMME » + « Compris » (l. 10410-10419) | utile | Garder à la première ouverture, puis derrière le « ? » de l'onglet. C'est déjà le cas (`avertissementsFermes`) : vérifier qu'il ne revient pas à chaque régénération sans raison. |
| Proposition de retrait (« retiré 3 séances de suite ») (l. 5524-5530) | indispensable | — |
| `CarteNiveau` (monter / descendre d'un cran) (l. 10781-10789) | indispensable | — |
| `CartePush` « On a renforcé la sécurité… Réactiver mes rappels » (l. 10774-10779) | à retirer | Carte de migration v20.4 : à supprimer dès que les deux téléphones l'ont vue. Un toast à la première ouverture suffit. |
| Carte d'invitation coach repliable + texte 3 lignes + « Envoyer l'invitation » (l. 5540-5593) | à fusionner | Voir chantier 1 : une seule carte discrète, qui disparaît pour de bon après un « plus tard ». |
| Bandeau pause active (l. 5593-5613) | indispensable | Garder, mais une ligne (« Pause jusqu'au 14/09 · XP gelés »), pas trois. |
| Bandeau série « Série en cours : N jours » (l. 5613-5639) | à fusionner | Le compteur « 7 derniers jours » de l'en-tête et la grille du mois disent déjà la régularité. Fusionner dans l'en-tête (un chiffre, pas un bandeau). |
| Titre « Qu'est-ce qu'on fait aujourd'hui ? » + carrousel des séances (l. 5646-5750) | indispensable | Sur les cartes, garder nom + durée + XP ; retirer « N exercices (+ gainage) » (on le voit en ouvrant). |
| Carte « SÉANCE LIBRE » (l. 5753-5769) | utile | La ramener à une carte du carrousel, même format que les autres, en dernière position. |
| Bouton « Cardio · 5 à 20 XP » (l. 5776-5805) | utile | Idem : une carte du carrousel « Cardio », pas un bouton à part. |
| Bouton « Repos · journée couverte » (l. 5805-5833) | utile | Garder en bouton texte discret sous le carrousel. |
| Grille du mois `MoisGrille` (l. 13855-13983) | utile | La déplacer dans Progrès (c'est de l'historique). L'onglet Séance montre le jour, pas le mois. |
| Carte « DÉFI DE LA SEMAINE » + modale (l. 5917-5973, 4933-5062) | utile | Garder, mais compacte (une ligne : « Défi : 3 preuves · 1/3 · +40 XP »), la modale au tap. |
| Bouton « Joker — journée couverte sans rien faire (n/2 ce mois) » (l. 5973-5995) | à retirer de l'écran | Sert deux fois par mois : le mettre dans le menu du bouton Repos (« Repos » / « Joker »). |
| Carte « Le repos fait partie du programme » + « Voir mes habitudes » (l. 6042-6064) | à retirer | Un toast à la coche du repos suffit ; « Voir mes habitudes » = l'onglet Habitudes, juste en dessous. |
| Carte « Gagne tes premiers XP en 10 secondes » + « Voir mes habitudes » (l. 6064-6110) | utile | Garder pour un profil neuf, jamais après les premiers XP (déjà le cas ?). Retirer le bouton, l'onglet est à un tap. |
| Pied « Règles du jeu : la photo est la preuve · −25 XP · Repos compte… » 3 lignes (l. 6118) | à retirer | Doublon de « Les règles du jeu » (Réglages) et de la bulle « ? ». C'est le plus gros texte permanent de l'app. |
| Modale « premiers XP » + « Partager mon lien d'invitation » (l. 4844-4933) | à fusionner | Chantier 1. |
| Modale coffre mystère (l. 5168-5222) | indispensable | — |

## 3. Onglet Séance — séance en cours

| Élément | Verdict | Proposition |
|---|---|---|
| En-tête : « SÉANCE A », nom, geste, fourchette XP, « +N si complète », note sport, compteur faits/total (l. 7017-7037) | utile | Garder nom + compteur. La fourchette XP et le « +N si complète » vont dans la barre de fin. La note sport : derrière le « ? ». |
| Bandeau « Séance ajustée · N min · … » + « Annuler » (l. 7051-7067) | utile | Une ligne, sous le titre. Bien. |
| Bouton « Ajuster ma séance du jour — temps, énergie » (l. 7069-7093) | utile | Sert souvent : garder, mais en icône + mot dans l'en-tête (« Ajuster »), pas un bouton pleine largeur. |
| « Changer de séance » (l. 5833-5852) | utile | Garder tant qu'aucun exercice n'est fait (déjà le cas). |
| Ligne d'exercice : numéro, nom, « +N XP », dose, repos, dernier, chevron, pastilles (l. 7196-7330) | indispensable | Retirer « +N XP » de la ligne (le total est dans la barre de fin) et « repos MM:SS » (visible à l'ouverture). Reste : numéro, nom, dose, dernier. |
| Ligne validée : « Validé · +N XP » + « ↩ » (l. 7596-7612) | indispensable | — |
| `Ressenti` Facile / Juste / Trop dur (l. 10529-10551) | indispensable | Garder replié sur le choix (déjà). |
| Carte focus : en-tête dose · repos · dernier · niveau · provenance (l. 7331-7335) | indispensable | Depuis v20.14 la sous-ligne est longue : passer « Niveau 2 — intermédiaire » et la provenance de la dose sur une seconde ligne en gris. |
| Consigne (l. 7336) + « Voir la démo » (l. 7362-7380) + « Erreur fréquente ▾ » (l. 10400) | indispensable | — |
| Boutons « Remplacer » / « Retirer » / « + Ajouter un exercice après celui-ci » / « Déplacer » (l. 7396-7435) | à fusionner | Quatre boutons par carte. Garder « Remplacer » et « Retirer » visibles ; « Ajouter après » et « Déplacer » vont derrière un « ⋯ » (chantier 3 : l'appui long dans la liste suffit à déplacer ; le menu Monter/Descendre est un doublon). |
| Note « Ou, dans la liste : appuie longtemps… » (l. 7435) | à retirer | Explication permanente d'un geste : une fois dans le tuto. |
| `TypeCharge` Poids du corps / Lesté / Assisté (l. 10768) | utile | Ne l'afficher que pour les exercices faisables au poids du corps (déjà le cas). |
| `SerieInputs` : message poids du corps, « REPS PAR SÉRIE · pré-remplies… », steppers, « CHARGE … · facultatif », « idem », aide « idem reprend… touche une valeur… », suggestion, encarts À fond / Petite forme, aides « Tout tenu ? » et « Reps pré-remplies… » (l. 7928-8140) | à fusionner | C'est la zone la plus chargée de l'app : 4 textes d'aide permanents. Garder : steppers reps + charge, « idem », la suggestion (une ligne). Retirer les 4 aides (une fois dans le tuto, et un « ? » sur la carte). Les encarts À fond / Petite forme : une ligne « Petite forme : −10 % » dans le bandeau « Séance ajustée », pas dans chaque carte. |
| `CardioInputs` (l. 10741-10766) | indispensable | — |
| Bouton repos « Fin de série → lancer le repos MM:SS » (l. 7475-7522) | indispensable | Le repos en cours est affiché ici ET dans le chrono flottant : ne garder dans la carte que le bouton, le décompte vit dans la pilule (v20.14). |
| « Valider avec une photo » / ✓ sans photo (l. 7541-7589) | indispensable | — |
| Message « Séance vide pour l'instant… » (l. 7613) | utile | Une ligne, pas trois. |
| « + Ajouter un exercice » (bas de liste) (l. 7615) | à fusionner | Chantier 3 : garder celui-ci, retirer « Ajouter après » des cartes (l'exercice ajouté peut se déplacer par appui long). |
| Bouton « Valider ma séance · +N XP » en bas de liste (l. 7618-7640) | à fusionner | Doublon exact de la barre de fin flottante (l. 6423-6476). Garder la barre flottante, retirer le bouton de liste. |
| « Séance validée. Fière de toi. » + partage des photos (l. 7644) | utile | — |
| Bloc gainage : ligne, focus 3 tours, boutons, « Remplacer », « ↩ », « Ajouter après », « Gainage bouclé » (l. 7685-7926) | à fusionner | Même traitement que les cartes : « Ajouter après » disparaît, « Remplacer » reste. |
| `PanneauExercices` : titre, texte 2 lignes (3 variantes), 3 onglets, recherche + 3 sélecteurs, lignes, case « Pour toutes les prochaines séances », « Fermer » (l. 10553-10613) | utile | Retirer le texte explicatif sous le titre (le titre dit tout). Les 3 sélecteurs ne s'affichent que dans l'onglet banque : bien. Le bouton « Fermer » est un doublon du tap à l'extérieur : garder (accessibilité), plus petit. |
| `ConfirmRetrait` (l. 10616-10624) | à retirer | Retirer pour aujourd'hui est réversible (l'exercice reste dans le programme, « ↩ » existe) : pas besoin de confirmation. Un toast « Retiré pour aujourd'hui · annuler ». |
| `AdapterPanneau` : texte 2-3 lignes, temps, énergie, note « À fond… », bloc compléments, bloc cardio + note, « Résultat », 2 boutons (l. 10626-10671) | utile | Retirer le paragraphe sous le titre et la note sous le cardio ; garder « Résultat : … » (c'est l'aperçu). |
| Jour cardio : titre, texte 2-3 lignes, chips (l. 5995-6040) | utile | Texte → une ligne (« 20-30 min · 5 à 20 XP selon la durée »). |
| Jour récupération `RecupView` (l. 10674-10695) | indispensable | Texte d'encart → une ligne. |

## 4. Onglet Habitudes

| Élément | Verdict | Proposition |
|---|---|---|
| Titre + 7 lignes cochables avec vignette photo (l. 6125-6175) | indispensable | — |
| Sous-libellé par ligne « photo requise · +5 XP » / « sans photo possible · 0 XP (invérifiable) » (l. 6175) | à retirer | Sept fois la même phrase. Une icône appareil photo sur les lignes à photo, rien sur les autres ; la règle est dans « ? ». |
| Texte 3 lignes « Rappel du guide : rien à peser… » (l. 6210) | à retirer | Dans la bulle « ? » de l'onglet (elle existe : `hab`). |
| Ligne d'aide « Anorexie Boulimie Info Écoute — 09 69 325 900 » (l. 6217) | indispensable | Garder telle quelle, en pied : c'est une ligne de sécurité, elle ne se négocie pas. |

## 5. Onglet Progrès

| Élément | Verdict | Proposition |
|---|---|---|
| 4 tuiles chiffrées (séances, cardios, jours couverts, records) (l. 6224) | utile | Garder 3 (séances, cardios, jours couverts) ; « Records battus » n'a de sens qu'avec les records célébrés (backlog). |
| Carnet des charges : un graphe par exercice, exemple grisé (l. 10863-10879) | indispensable | Le texte de l'état vide → une ligne. |
| Badges (8) (l. 6266-6300) | utile | Garder. |
| « Tes preuves 📷 (touche pour agrandir — c'est ici qu'on vérifie 😏) » + grille (l. 6305-6360) | à fusionner | Doublon de la galerie du coach (même données). Côté coachée : la garder, mais titre court « Tes preuves ». |
| Historique 20 entrées (l. 6364-6420) | utile | Y accueillir la grille du mois (déplacée depuis Séance) : Progrès = le mois, l'historique, les courbes. |

## 6. Onglet Récompenses (coachée)

| Élément | Verdict | Proposition |
|---|---|---|
| Titre + sous-titre variant (l. 8420) | utile | Sous-titre → une ligne. |
| Carrousel des récompenses + carte dépliée (badge, « Concrètement », barre XP, « encore N XP », « ≈ N séances », note estimation) (l. 8420-8621) | à fusionner | « Je la prends » existe dans le carrousel ET dans la carte dépliée : garder dans la carte. La note « Estimation sur la moyenne d'XP… » (2 lignes) : à retirer, le « ≈ N séances » se comprend seul. |
| « Ajouter une grande récompense » : libellé, niveau, estimation, garde-fou (l. 8632-8695) | utile | Replier derrière un « + Ajouter » ; le formulaire sert quelques fois par an. |
| `Idees` (idées IA) (l. 13458-13562) | utile | Le mettre dans le formulaire replié ci-dessus (« Pas d'idée ? Génère-en ») : c'est son seul usage. |
| Coffre mystère : titre, texte 2 lignes, liste des mini-kifs, champ « Proposer un mini-kif », « Coffres gagnés » (l. 8738-8850) | utile | Texte 2 lignes → « ? ». Le champ de proposition : replié derrière « + ». |
| `Negos`, `Paris`, `Pot` empilés sous les récompenses (l. 8711-8726) | à fusionner | L'onglet fait 5 écrans de long. Proposer 2 sous-onglets : « Récompenses » (grandes + coffre) et « Avec ton coach » (négos, paris, cagnotte, pause). La pause quitte Réglages pour rejoindre ce second sous-onglet. |

### Négos

| Élément | Verdict | Proposition |
|---|---|---|
| Titre « La table des négos — un aller-retour, réponse sous 48 h » + puces d'état + « ACTUALISER » + chips hors ligne (l. 9048-9054) | utile | Titre court « Négos ». « ACTUALISER » → rafraîchissement au retour sur l'onglet, bouton retiré. |
| Encart sans coach + modale « Ta proposition est prête » (l. 9054-9149) | à fusionner | Chantier 1. |
| Bloc repliable « 📊 Le barème » 5-6 lignes (l. 9163-9199) | à retirer | Dans « Les règles du jeu » (déjà là). |
| « Je propose 👇 » : chips d'idées, champ, niveau, argumentaire, « Proposer » (l. 9209-9320) | utile | Replié derrière « + Proposer » ; les chips d'idées sautent (les idées IA existent). |
| Liste des négos, chips de statut, réponses (l. 9346-9739) | indispensable | — |

### Paris

| Élément | Verdict | Proposition |
|---|---|---|
| Titre « Le Pari — chacun met un enjeu, l'app arbitre toute seule » (l. 12593) | utile | Titre court « Paris ». |
| Carte « Un défi, deux enjeux » + phrase + « Lancer un pari » (l. 12648-12666) | utile | Un bouton « + Lancer un pari », sans carte d'explication. |
| Modale de lancement (3 types, cible, durée, 2 mises, `BoutonMaintenir` + note) (l. 12666-12785) | indispensable | La note « Maintiens 2-3 s — relâcher annule » : le bouton le montre lui-même (« Tiens bon… »). À retirer. |
| Cartes de pari + boutons (l. 12806-12924) | indispensable | — |

### Cagnotte

| Élément | Verdict | Proposition |
|---|---|---|
| Titre « La cagnotte — les manquements financent vos activités à deux » (l. 12981) | utile | « Cagnotte ». |
| Montant + texte 3 lignes « Automatique : chaque jour sans passage… » + ligne « Toucher pour ouvrir… » (l. 13033-13055) | à retirer (le texte) | Montant + « ce mois : N € » ; le fonctionnement est dans « Les règles du jeu ». « Toucher pour ouvrir » : le chevron suffit. |
| Modale : montant, plafond, historique, ajout manuel, plafond (coach), « Combien avez-vous dépensé ? » + `BoutonMaintenir` + note (l. 13068-13295) | utile | Note sous le bouton : à retirer (même raison que les paris). |

## 7. Réglages

| Élément | Verdict | Proposition |
|---|---|---|
| Bloc « Comment on s'adresse à toi » + note + 3 boutons avec exemple (l. 11921-11965) | utile | Garder ; la note « accorde les titres… ton coach le voit aussi » → une ligne. |
| 5 interrupteurs `Ligne` avec descriptions (l. 11966-11983) | utile | Descriptions → une ligne chacune ; celle de la cagnotte (3 lignes) → « Jour raté : 2 → 3 → 5 €, plafond réglable ». |
| Rappel du soir + rappel du matin + « M'envoyer une notification de test » (l. 12002-12110) | utile | Le bouton de test sert une fois : le cacher derrière un appui long sur l'interrupteur, ou le laisser mais en lien texte. |
| « Inviter mon coach » (l. 12110-12133) | indispensable | C'est l'entrée permanente (chantier 1). |
| Bloc « PAUSE — VALIDÉE À DEUX » + texte 2 lignes + formulaire (l. 12141-12283) | à fusionner | Déplacer dans « Avec ton coach » (onglet Récompenses) : une pause se demande depuis là où on voit le coach, pas dans les réglages. Texte → une ligne. |
| « STYLE DES RÉCOMPENSES » + chips + `RechargerListes` (l. 12295-12334) | à retirer de Réglages | Sert une fois : le déplacer dans l'onglet Récompenses, derrière « + Ajouter » (« Idées selon ton style »). `RechargerListes` (remplacer les listes) : fonction de migration, à supprimer. |
| `SectionProgramme` (6 lignes modifiables, note, « Nouveau moteur », « Changer de programme ») (l. 10498-10520) | indispensable | Retirer la note « Chaque changement te propose… » (on le voit en cliquant) et « Nouveau moteur » quand la migration est finie. |
| « PROFILS SUR CE TÉLÉPHONE » + « Créer un autre profil » (l. 12350-12393) | utile | Sert une fois : replier derrière une ligne « Profils (2) ». |
| « Les règles du jeu » / « Revoir le tuto » (l. 12399-12423) | indispensable | Ce sont les destinations de tous les textes retirés ailleurs. |
| « Confidentialité et mentions légales » (l. 12436) | indispensable | — |
| `DangerZone` (l. 13304-13383) | indispensable | — |

### Confidentialité, Règles du jeu

Textes longs par nature, à la demande : rien à changer. Ils deviennent la seule maison des
explications.

## 8. Côté coach

| Élément | Verdict | Proposition |
|---|---|---|
| Suivi : erreur serveur 3 lignes « Impossible de joindre le serveur. Le suivi coach nécessite le déploiement en Worker (avec le KV lié sous le nom NEGOS)… » (l. 9860-9872) | à retirer | Message technique pour Léo, pas pour un coach : « Serveur injoignable — réessaie ». |
| État vide 2-3 lignes + « Vérifier » (l. 9885-9897) | utile | Une ligne. |
| Anneau, niveau, « Dernière activité · séances 7 j · jokers », bouton actualiser (l. 9924-9990) | indispensable | Actualisation au retour sur l'onglet, bouton retiré. |
| Preuves + historique (l. 9993-10100) | indispensable | — |
| Négos coach : note « Les grandes récompenses et le coffre vivent sur le téléphone du coaché… » (l. 8412) | à retirer | Dans le tuto coach. |
| Bloc « RÉPONSE DU COACH » : accepter / contre-offre / refuser, chacun avec un sous-texte (l. 9393-9634) | utile | Retirer les sous-textes (« deal conclu, la récompense entre au tableau », « une seule autorisée ») : les boutons se comprennent. |
| Paris et cagnotte côté coach | idem coachée | Plafond mensuel : garder, c'est le seul réglage du coach. |

## 9. Transverses

| Élément | Verdict | Proposition |
|---|---|---|
| En-tête coachée : anneau, « LEVEL UP ! », « Niveau N — titre », « N XP · encore N XP », « n/4 · 7 DERNIERS JOURS », « ? », réglages (l. 5321-5462) | à fusionner | Trop dense à 390 px (backlog). Garder anneau + « Niveau N — titre » + XP ; y ramener la série (bandeau retiré de Séance) à la place du « n/4 ». Le « LEVEL UP ! » peut disparaître de l'en-tête une fois dans l'app. |
| Navigation 4 onglets / 2 onglets (l. 6753-6790) | indispensable | — |
| Barre de fin de séance flottante (l. 6423-6476) | indispensable | Elle absorbe le bouton de liste (chantier 3). Sous-texte → une seule variante courte. |
| Chrono flottant (v20.14) (`ChronoFlottant`) | indispensable | Retirer le décompte dupliqué dans la carte (voir Séance). |
| Toasts (~40 messages) (l. 5233-5263) | utile | Passer les 40 en revue : ceux qui expliquent une règle (« pas d'XP : invérifiable ! ») deviennent muets, ceux qui confirment une action restent. |
| Célébration de fin de séance : titre, sous-titre, 3 lignes de détail XP, niveau, « Continuer » (l. 6476-6590) | utile | Détail XP → une ligne (« +42 XP · niveau 4 »). |
| Bulles « ? » (6 textes de 3-5 lignes) (l. 13576-13583) | indispensable | Elles reçoivent les textes retirés. Les réécrire en puces de 5-8 mots. |
| Visite guidée `Tour` (7 cartes coachée, 5 coach) (l. 13590-13759) | utile | Ramener à 4 cartes coachée (preuve, XP/malus, récompenses, chrono) : le reste est découvrable. |
| 6 points d'invitation coach | à fusionner | Chantier 1. |
| `AvertissementsProgramme`, `CarteNiveau`, proposition de retrait | indispensable | Ce sont des décisions à prendre, pas des explications. |

## Ce que l'audit ne propose pas

- Retirer une mécanique (cagnotte, paris, pause, coffre, négos) : chacune a une décision
  dans `DECISIONS.md` (« en duo, cagnotte et paris toujours présents, jamais masqués »).
  L'audit les regroupe et les tait, il ne les enlève pas.
- Toucher aux règles du jeu ou aux XP.
- Le mode clair et la refonte du thème : après Vite.

## Ordre suggéré

1. Chantier 1 (invitation unique) et retrait des 12 textes permanents → vers « ? » et
   « Les règles du jeu ». Petit, sûr, visible tout de suite.
2. Chantier 3 (une validation, un déplacement, un ajout) + `ConfirmRetrait` → toast.
3. Onglet Récompenses en deux sous-onglets, pause et style de récompenses déplacés.
4. Onglet Séance : grille du mois vers Progrès, séance libre et cardio dans le carrousel,
   joker sous Repos, en-tête allégé.
5. `SerieInputs` : les 4 aides et les encarts À fond / Petite forme.
