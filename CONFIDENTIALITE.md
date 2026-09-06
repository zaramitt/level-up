# Confidentialité et mentions légales

Le même texte que la page « Confidentialité et mentions légales » des Réglages
de l'app. En clair : ce que l'app garde, où, combien de temps, et comment tout
effacer.

## Sur ton téléphone

Tout ce que tu fais vit d'abord ici : ton prénom ou pseudo, ton rôle, ton code
duo, ta préférence elle / il / neutre, ton programme et tes réponses, tes XP,
ton historique, tes charges et ressentis, tes habitudes, et tes photos de
preuve — réduites à 380 pixels, sans aucune métadonnée (ni position, ni
appareil). En solo, rien de tout ça ne quitte le téléphone, sauf ce qui est
écrit plus bas pour l'IA.

## Sur le serveur, en duo

Pour que ton coach te suive, l'app publie sous ton code duo : tes XP, tes 30
dernières séances, tes jours actifs, tes jokers, tes pauses, tes photos de
preuve, les négociations, les paris, la cagnotte (un compteur, jamais
d'argent), ta préférence de rappels et, si tu actives les rappels, l'adresse
technique que ton navigateur donne pour les notifications.

Le serveur est un Worker Cloudflare avec son espace de stockage ; les données
peuvent être répliquées dans plusieurs centres de données, en Europe et
ailleurs. Pas de compte, pas d'e-mail, pas de mot de passe, pas de publicité,
pas de mesure d'audience : la seule clé, c'est le code duo. Quiconque le
connaît peut lire et écrire ces données — ne le partage qu'avec ton coach.

## Ce qui part vers l'IA

Deux choses seulement, et seulement si tu les utilises : l'objectif que tu
écris en texte libre (pour le traduire en programme) et le contexte que tu
tapes pour des idées de récompenses. Ils sont envoyés aux serveurs d'Anthropic
(États-Unis), sans ton prénom, sans photo, sans historique. Dix lectures par
jour au plus.

## Combien de temps

Photos de preuve : 90 jours sur le serveur, puis effacées d'elles-mêmes. Le
reste : tant que ton code duo existe. Sur ton téléphone : tant que tu ne
l'effaces pas.

## Tout effacer

Réglages → Zone danger : « Effacer les données serveur du duo » efface tout ce
qui est rangé sous ton code, photos comprises, pour vous deux ; « Supprimer ce
profil de ce téléphone » efface ce qui est ici. Ton coach fait la même chose
sur son téléphone. Il n'y a pas de compte à fermer, ni de permission à
demander.

## Tes droits

Accès, rectification, effacement : tout est dans l'app, sans intermédiaire.
Pour une question, une demande, ou signaler un problème de sécurité : l'adresse
affichée dans l'app (variable `CONTACT` du Worker).

## Mentions légales

- Éditeur : la personne joignable à l'adresse ci-dessus, à titre personnel et
  sans but lucratif.
- Hébergeur : Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107,
  États-Unis.
- Le code source de l'app est public (ce dépôt).
- Police Space Grotesk (licence OFL, `outils/polices/OFL.txt`), React (licence
  MIT).
