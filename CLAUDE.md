# CLAUDE.md — Level Up!

## Contexte (ne pas redemander)
- App web fitness gamifiée. Repo `zaramitt/level-up`. Déploiement auto Cloudflare Workers Builds au merge sur `main`.
- Invariant produit : « tu ne t'entraînes jamais seul — quelqu'un voit tes séances ». Le regard, pas la récompense.
- Cible : les gens qui abandonnent régulièrement. North star = régularité et ré-engagement, pas la précision du tracking.
- Mécaniques clés : streak qui cicatrise (cicatrices visibles, multiplicateur perdu, historique jamais effacé), duo/coach, XP en confiance+audit, récompenses {duo, solo}.
- Priorité actuelle : qualité des séances (≥ 4 variantes par exercice, temps dispo demandé à chaque séance avec compression, niveau observé et jamais demandé, progression de charge proposée + graphique par exercice), puis chantier UI/UX (simplifier, rendre sympathique, faire mieux que les apps standard).
- Chantier ouvert : le modèle coach-qui-finance ne marche que pour un couple — ne pas construire dessus sans validation.
- Design dark glass = temporaire, migration Vite + refactor modulaire prévus.

## Avant toute tâche
1. Lire `DECISIONS.md`. Dans `BACKLOG.md`, lire seulement la section concernée par la tâche. Lire `ARCHITECTURE.md` seulement si la tâche touche `worker.js`, le moteur, les routes ou la livraison. Ne jamais lire `CHANGELOG.md` sauf demande. Ne jamais relire l'ensemble du code : ouvrir uniquement les fichiers cités ou trouvés par grep.
2. Si la tâche contredit une décision de `DECISIONS.md`, le dire en une phrase et s'arrêter.
3. Une seule question de clarification, uniquement si elle change l'implémentation. Sinon avancer avec l'hypothèse la plus probable et la noter.

## Règles d'exécution (économie de tokens)
- Plan en ≤ 5 lignes, puis code. Pas de plan pour les corrections < 20 lignes.
- Modifier par diffs ciblés. Ne jamais réécrire un fichier entier ni réimprimer du code non modifié.
- Pas de commentaires explicatifs dans le chat sur du code évident, pas de récap du contexte, pas de politesse.
- Pas de nouvelle dépendance, pas de refactor hors périmètre, pas de « pendant que j'y suis ».
- Conserver le style, le nommage et l'architecture existants.
- Tests ou vérification manuelle décrite avant de déclarer terminé.

## Règles de livraison

- `worker.js` et `index.html` sont **toujours livrés en paire**, via
  `node outils/sync.js` (qui embarque aussi le moteur et la banque dans
  `index.html`). Une modification d'un seul des deux fichiers est presque
  toujours un bug.
- En session, toute modification est vérifiée sur un worker mock local
  (Playwright : `node outils/tests/lancer.js`, et `node outils/worker.test.js`
  dès que `worker.js` change) ; c'est Léo qui la valide sur l'URL Worker
  après déploiement.
- **Aucun secret dans le code** : clés et contact vivent dans le dashboard
  Cloudflare (`ANTHROPIC_API_KEY`, `VAPID_PRIV`, `VAPID_PUB`, `CONTACT`). Le
  test du worker échoue si une clé revient dans `worker.js`.
  Une modification n'est « faite » qu'après cette seconde vérification.
- **La version affichée dans `index.html` et celle d'`ARCHITECTURE.md` doivent être
  mises à jour à chaque livraison, dans le même commit que le chantier.
  Vérifier avant de commiter** — sans ça, les deux numéros divergent en
  quelques livraisons.

## Définition de « terminé »
- Aucune régression sur les flux : onboarding, séance, récompenses, invitation coach.
- `DECISIONS.md` mis à jour si une décision produit ou technique a été prise ; `BACKLOG.md` mis à jour si un item est fermé ou créé.
- Message de commit conventionnel : `feat|fix|refactor|ui(scope): description`.

## Format de réponse
1. Fichiers touchés (liste)
2. Ce qui change (≤ 5 lignes)
3. Comment vérifier (≤ 3 lignes)
4. Doutes ou hypothèses prises (si aucun : rien)

## Référence technique
`ARCHITECTURE.md` : version courante et son emplacement unique dans `index.html`, paire `worker.js` / `index.html` livrée via `node outils/sync.js`, moteur et banque embarqués, routes API, configuration Cloudflare (aucun secret dans le code), harnais (`node outils/tests/lancer.js`, `node outils/worker.test.js`, `node moteur-programmes.test.js`), conventions de design. À lire avant de toucher au worker, au moteur ou à la livraison.
