/* Génère MOTEUR.md : cinq programmes d'exemple, lisibles comme un pratiquant les lirait.
   Lancer : node moteur-exemples.js */
const fs = require("fs");
const banque = require("./banque-exercices.json");
const M = require("./moteur-programmes.js");
const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const CAS = [
  { titre: "Débutante, 3 séances, objectif fessiers (« me tonifier »)", entrees: { frequence: 3, objectif: "tonifier", materiel: "salle", niveau: 1, tempsMin: 60 } },
  { titre: "Intermédiaire, 4 séances, esthétique (« me muscler »)", entrees: { frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2, tempsMin: 60 } },
  { titre: "Avancé, 6 séances, force (objectif libre « je veux être plus fort »)", entrees: { frequence: 6, objectif: "libre", objectifLibre: "je veux être plus fort, soulever plus lourd", materiel: "salle", niveau: 3, tempsMin: 75 } },
  { titre: "Coureur, 4 séances, pour progresser en course à pied, sortie longue le dimanche", entrees: { frequence: 4, objectif: "mieux", sport: "course", intention: "sport", materiel: "salle", niveau: 2, tempsMin: 60, joursSport: [7] } },
  { titre: "À la maison sans rien, 3 séances de 47 minutes (« me sentir mieux »)", entrees: { frequence: 3, objectif: "mieux", materiel: "rien", niveau: 2, tempsMin: 47 } }
];
const dose = x => x.compartiment === "cardio_mobilite" ? `${Math.round(x.duree_s / 60)} min` : x.duree_s ? `${x.series} × ${x.duree_s} s · repos ${x.repos_s} s` : `${x.series} × ${x.reps[0]}-${x.reps[1]}${x.unilateral ? " / côté" : ""} · repos ${x.repos_s} s`;
const ROLE = { objectif: "objectif", objectif_extra: "objectif, case en plus", sport: "sport" };
const COMP = Object.fromEntries(banque.compartiments.map(c => [c.id, c.nom]));
let md = `# Moteur de génération — 5 programmes d'exemple

Générés par \`moteur-programmes.js\` depuis \`banque-exercices.json\`, sans IA. Chaque programme a été vérifié mécaniquement contre les règles 1 à 12 (\`node moteur-programmes.test.js\`). Ce document est régénéré par \`node moteur-exemples.js\`.

Lecture : la semaine indique où tombent les séances (règle 4 : jamais le même gros groupe deux jours de suite, dimanche et lundi compris ; jamais de séance un jour de sport, et les séances jambes loin de la sortie longue). Chaque séance liste ses exercices dans l'ordre d'exécution (règle 2), avec séries × reps et repos (règle 5) ; la durée est calculée depuis ces chiffres, échauffement de 6 min compris (règle 6), et tient dans le temps demandé à la minute près. La colonne « Pourquoi » marque ce que l'objectif ou le sport a imposé. Le volume compte les séries par gros groupe et par semaine (règle 3) : les séries **directes** servent au plafond, le total avec les secondaires comptés ½ sert au minimum.

`;
for (const cas of CAS) {
  const p = M.genererProgramme(cas.entrees, banque);
  const v = M.verifierRegles(p, banque);
  md += `\n## ${cas.titre}\n\n`;
  md += `**Squelette** : ${p.squelette.description} (\`${p.squelette.nom}\`). Niveau observé ${p.entrees.niveau}, ${p.entrees.tempsMin} min par séance, matériel : ${M.MATERIEL_NOM[p.entrees.materiel]}.${p.entrees.sport ? ` Sport : ${M.SPORTS[p.entrees.sport].nom} (intention : progresser dans ce sport${p.entrees.joursSport.length ? `, jours de sport : ${p.entrees.joursSport.map(d => JOURS[d - 1]).join(", ")}` : ""}).` : ""}\n\n`;
  md += `**Semaine** : ` + p.semaine.map(j => `${JOURS[j.jour - 1]} ${j.seance ? `**${j.seance.lettre}** ${j.seance.nom.toLowerCase()}` : j.sport ? "*sport*" : "repos"}`).join(" · ") + `\n\n`;
  for (const s of p.seances) {
    md += `### Séance ${s.lettre} — ${s.nom} · ${s.dureeMin} min\n\n| # | Exercice | Compartiment | Dose | Pourquoi | Consigne |\n|---|---|---|---|---|---|\n`;
    s.exercices.forEach((x, i) => { md += `| ${i + 1} | **${x.nom}** | ${COMP[x.compartiment]}${x.compartiment === "isolation" ? ` (${x.muscle})` : ""} | ${dose(x)} | ${x.role ? ROLE[x.role] : ""} | ${x.consigne} |\n`; });
    md += `\n`;
  }
  const niv = M.NIVEAU[p.entrees.niveau];
  md += `**Volume par semaine** (séries directes / total avec secondaires ½) : ` + M.GROS_GROUPES.map(g => `${g} ${p.volume.direct[g]} / ${p.volume.total[g]}`).join(" · ") + ` — bornes du niveau ${p.entrees.niveau} : ${niv.volumeMin}-${niv.volumeMax}.\n\n`;
  if (p.avertissements.length) md += `**Avertissements du moteur** :\n` + p.avertissements.map(a => `- ${a}`).join("\n") + `\n\n`;
  md += `Vérification des règles : ${v.length ? "**" + v.length + " violation(s)** — " + v.map(x => `[${x.regle}] ${x.message}`).join(" ; ") : "aucune violation."}\n`;
}
/* ---------- Trous de la banque ---------- */
const audit = M.auditerBanque(banque);
const trous = audit.filter(l => l.trou), limites = audit.filter(l => l.limite);
const MAT = { salle: "salle", halteres: "haltères", pdc: "poids du corps", rien: "rien" };
const cellule = l => !l.trou ? "—" : !l.disponibles ? "**aucun exercice**" : `${l.disponibles} exo${l.disponibles > 1 ? "s" : ""}, ${l.remplacants} rempl. · ${l.isole.nom}`;
md += `\n## Trous de la banque\n\nAudit mécanique (\`auditerBanque\`, lancé par les tests) : pour chaque compartiment (isolations par muscle, cardio et mobilité par type), chaque matériel et chaque niveau, combien d'exercices sont disponibles et combien de remplaçants exacts la règle 12 trouve pour le plus isolé d'entre eux (même compartiment, même muscle, un cran de difficulté au plus). Un trou = aucun exercice disponible, ou moins de 2 remplaçants. **Rien n'est comblé ici** : Léo décide quels exercices ajouter, ils passeront par \`EXERCICES.md\` comme les autres.\n\n**${trous.length} trous sur ${audit.length} combinaisons**, dont ${trous.filter(l => !l.disponibles).length} sans aucun exercice à ce niveau ; ${limites.length} combinaisons sont des **limites physiques** (listées après le tableau), pas des trous. Chaque cellule : exercices disponibles, remplaçants trouvés, et l'exercice le plus isolé (celui qui a le moins de remplaçants). « — » : pas un trou.\n\nUne chose à savoir pour lire le tableau. Certains trous viennent du **muscle principal déclaré** plus que du nombre d'exercices : la fente latérale est seule sur les adducteurs dans l'unilatéral, le soulevé de terre est seul sur la chaîne postérieure à un cran de difficulté, la planche latérale n'a que le Pallof sur les obliques — la réponse peut être un exercice de plus ou un muscle principal différent, c'est à trancher dans la banque.\n\n| Compartiment | Matériel | Niveau 1 | Niveau 2 | Niveau 3 |\n|---|---|---|---|---|\n`;
const cles = [...new Set(trous.map(l => l.nom + "|" + l.materiel))];
for (const nom of [...new Set(audit.map(l => l.nom))]) for (const materiel of M.MATERIELS) {
  if (!cles.includes(nom + "|" + materiel)) continue;
  const par = n => audit.find(l => l.nom === nom && l.materiel === materiel && l.niveau === n);
  md += `| ${nom} | ${MAT[materiel]} | ${cellule(par(1))} | ${cellule(par(2))} | ${cellule(par(3))} |\n`;
}
const parNom = {}; for (const l of limites) (parNom[l.nom] = parNom[l.nom] || new Set()).add(MAT[l.materiel]);
md += `\n**Limites physiques** (hors salle, le mouvement n'existe pas avec ce matériel, à aucun niveau) — le moteur les signale dans le programme en langage utilisateur (« Sans barre de traction ni élastique, pas de tirage vertical : le dos reste sous-travaillé ») :\n\n` + Object.entries(parNom).map(([n, m]) => `- ${n} : ${[...m].join(", ")}`).join("\n") + `\n`;
md += `\n## Points d'extension laissés ouverts (IA, étape ultérieure)\n\n` + M.genererProgramme(CAS[0].entrees, banque).pointsExtension.map(x => `- ${x}`).join("\n") + `\n`;
fs.writeFileSync("MOTEUR.md", md);
console.log("MOTEUR.md écrit :", md.split("\n").length, "lignes");
