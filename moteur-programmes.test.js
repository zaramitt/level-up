/* Tests du moteur de génération (chantier Programmes, étape 2).
   Écrits AVANT le moteur : chaque règle 1 à 12 et chaque squelette est
   vérifié mécaniquement sur toutes les combinaisons fréquence × objectif ×
   niveau × matériel, plus les cas demandés par Léo. Lancer : node moteur-programmes.test.js */
const assert = require("assert");
const banque = require("./banque-exercices.json");
const M = require("./moteur-programmes.js");
const { genererProgramme, remplacerExercice, verifierRegles, GROS_GROUPES, grosGroupe, groupesDe } = M;

let nb = 0, ko = 0;
const test = (nom, fn) => { nb++; try { fn(); console.log("  ✔ " + nom); } catch (e) { ko++; console.log("  ✘ " + nom + "\n      " + String(e.message || e).split("\n").slice(0, 6).join("\n      ")); } };
const byId = Object.fromEntries(banque.exercices.map(e => [e.id, e]));
const seances = p => p.semaine.filter(j => j.seance).map(j => j.seance);
const exosForce = s => s.exercices.filter(e => e.compartiment !== "gainage" && e.compartiment !== "cardio_mobilite");

const OBJECTIFS = ["tonifier", "poids", "muscler", "mieux", "douce", "libre"];
const MATERIELS = ["salle", "halteres", "pdc"];

console.log("=== grille : fréquence × objectif × niveau × matériel — toutes les règles ===");
let total = 0, echecs = [];
for (let f = 1; f <= 7; f++) for (const o of OBJECTIFS) for (let n = 1; n <= 3; n++) for (const m of MATERIELS) {
  total++;
  const entrees = { frequence: f, objectif: o, objectifLibre: o === "libre" ? "je veux être plus forte sur mes squats" : "", sport: null, intention: "soi", materiel: m, niveau: n, tempsMin: 60 };
  let prog;
  try { prog = genererProgramme(entrees, banque); } catch (e) { echecs.push(`${f}× ${o} n${n} ${m} : exception ${e.message}`); continue; }
  const v = verifierRegles(prog, banque);
  if (v.length) echecs.push(`${f}× ${o} n${n} ${m} : ` + v.map(x => `[${x.regle}] ${x.message}`).join(" | "));
}
test(`${total} programmes générés, 0 violation`, () => { assert.strictEqual(echecs.length, 0, echecs.slice(0, 12).join("\n")); });

console.log("\n=== squelettes ===");
test("1× = 1 full body ; 2× = A-B ; 3× = A-B-C, toutes full body", () => {
  for (const f of [1, 2, 3]) {
    const p = genererProgramme({ frequence: f, objectif: "mieux", materiel: "salle", niveau: 2 }, banque);
    assert.strictEqual(seances(p).length, f);
    assert.ok(seances(p).every(s => s.focus.startsWith("full")), "focus full body attendu");
    assert.strictEqual(new Set(seances(p).map(s => s.lettre)).size, f);
  }
});
test("4× = haut / bas × 2 ; 5× = haut / bas × 2 + focus", () => {
  const p4 = genererProgramme({ frequence: 4, objectif: "mieux", materiel: "salle", niveau: 2 }, banque);
  assert.deepStrictEqual(seances(p4).map(s => s.focus), ["haut", "bas", "haut", "bas"]);
  const p5 = genererProgramme({ frequence: 5, objectif: "tonifier", materiel: "salle", niveau: 2 }, banque);
  const f5 = seances(p5).map(s => s.focus);
  assert.strictEqual(f5.length, 5);
  assert.ok(f5.filter(x => x === "haut").length === 2 && f5.filter(x => x === "bas").length === 2 && f5.some(x => x.startsWith("focus")), f5.join(","));
});
test("6× = push / pull / legs × 2 ; 7× = 6× + récupération active, jamais de force le 7e jour", () => {
  const p6 = genererProgramme({ frequence: 6, objectif: "muscler", materiel: "salle", niveau: 3 }, banque);
  assert.deepStrictEqual(seances(p6).map(s => s.focus), ["push", "pull", "legs", "push", "pull", "legs"]);
  const p7 = genererProgramme({ frequence: 7, objectif: "muscler", materiel: "salle", niveau: 3 }, banque);
  const s7 = seances(p7);
  assert.strictEqual(s7.length, 7);
  assert.strictEqual(s7[6].focus, "recup");
  assert.ok(s7[6].exercices.every(e => e.compartiment === "cardio_mobilite"), "récup active = cardio et mobilité uniquement");
  assert.strictEqual(exosForce(s7[6]).length, 0);
});
test("la structure à 3× et à 6× n'est PAS la même (le générateur actuel échoue ici)", () => {
  const p3 = genererProgramme({ frequence: 3, objectif: "tonifier", materiel: "salle", niveau: 2 }, banque);
  const p6 = genererProgramme({ frequence: 6, objectif: "tonifier", materiel: "salle", niveau: 2 }, banque);
  assert.notDeepStrictEqual(seances(p3).map(s => s.focus), seances(p6).map(s => s.focus).slice(0, 3));
  assert.notStrictEqual(p3.squelette.nom, p6.squelette.nom);
});

console.log("\n=== règles, sur un exemple lisible ===");
const ex = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2 }, banque);
test("règle 1 — tout exercice appartient au focus de sa séance", () => {
  for (const s of seances(ex)) for (const e of s.exercices) assert.ok(M.appartientAuFocus(e, s.focus), `${e.nom} hors focus ${s.focus}`);
});
test("règle 2 — polyarticulaires, puis isolations, gainage en fin", () => {
  for (const s of seances(ex)) {
    const rangs = s.exercices.map(e => e.compartiment === "gainage" ? 2 : e.compartiment === "isolation" ? 1 : 0);
    for (let i = 1; i < rangs.length; i++) assert.ok(rangs[i] >= rangs[i - 1], `${s.lettre} : ${s.exercices.map(e => e.compartiment).join(" > ")}`);
  }
});
test("règle 3 — chaque gros groupe ≥ 2× par semaine dès 4 séances", () => {
  for (const g of GROS_GROUPES) {
    const jours = seances(ex).filter(s => s.exercices.some(e => groupesDe(e).has(g))).length; // principal ou secondaire
    assert.ok(jours >= 2, `${g} travaillé ${jours} fois`);
  }
});
test("règle 4 — jamais le même gros groupe deux jours consécutifs (semaine cyclique)", () => {
  const p = genererProgramme({ frequence: 5, objectif: "tonifier", materiel: "salle", niveau: 2 }, banque);
  const parJour = {};
  for (const j of p.semaine) if (j.seance) parJour[j.jour] = new Set(j.seance.exercices.map(grosGroupe).filter(Boolean));
  for (let d = 1; d <= 7; d++) {
    const a = parJour[d], b = parJour[d === 7 ? 1 : d + 1];
    if (!a || !b) continue;
    for (const g of a) assert.ok(!b.has(g), `${g} les jours ${d} et ${d === 7 ? 1 : d + 1}`);
  }
});
test("règle 5 — repos selon la fourchette de reps", () => {
  for (const s of seances(ex)) for (const e of s.exercices) if (e.reps && e.compartiment !== "gainage") {
    if (e.reps[1] <= 6) assert.strictEqual(e.repos_s, 180, e.nom);
    else if (e.reps[0] >= 12 || e.compartiment === "isolation") assert.ok(e.repos_s >= 60 && e.repos_s <= 90, `${e.nom} repos ${e.repos_s}`);
    else assert.strictEqual(e.repos_s, 120, `${e.nom} repos ${e.repos_s}`);
  }
});
test("règle 6 — durée calculée depuis séries et repos, et ≤ temps disponible", () => {
  for (const t of [30, 45, 60, 90]) {
    const p = genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: 2, tempsMin: t }, banque);
    for (const s of seances(p)) {
      assert.ok(typeof s.dureeMin === "number" && s.dureeMin > 0);
      assert.ok(s.dureeMin <= t, `${t} min demandées, séance ${s.lettre} = ${s.dureeMin} min`);
      assert.strictEqual(s.dureeMin, M.dureeSeance(s), "la durée affichée doit être recalculée depuis les séries et repos");
    }
  }
});
test("règle 7 — le niveau filtre les difficultés et le nombre d'exercices (débutant 4-5)", () => {
  for (let n = 1; n <= 3; n++) {
    const p = genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: n }, banque);
    for (const s of seances(p)) {
      assert.ok(s.exercices.every(e => e.difficulte <= n), `niveau ${n} : ${s.exercices.filter(e => e.difficulte > n).map(e => e.nom)}`);
      const c = exosForce(s).length;
      if (n === 1) assert.ok(c >= 4 && c <= 5, `débutant : ${c} exercices`);
      if (n === 2) assert.ok(c >= 5 && c <= 6, `intermédiaire : ${c} exercices`);
      if (n === 3) assert.ok(c >= 6 && c <= 7, `avancé : ${c} exercices`);
    }
  }
});
test("règle 9 — débutant : versions simples ; avancé : versions avancées quand elles existent", () => {
  const p1 = genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: 1 }, banque);
  assert.ok(seances(p1).every(s => s.exercices.every(e => e.echelle !== "avance")), "aucune version avancée pour un débutant");
  const p3 = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 3 }, banque);
  const nAv = seances(p3).flatMap(s => s.exercices).filter(e => e.echelle === "avance").length;
  assert.ok(nAv >= 3, `avancé : seulement ${nAv} versions avancées`);
});
test("règles 10-11 — sport et objectif colorent les cases, pas la structure", () => {
  const a = genererProgramme({ frequence: 4, objectif: "mieux", materiel: "salle", niveau: 2 }, banque);
  const b = genererProgramme({ frequence: 4, objectif: "mieux", sport: "escalade", intention: "sport", materiel: "salle", niveau: 2 }, banque);
  assert.deepStrictEqual(seances(a).map(s => s.focus), seances(b).map(s => s.focus), "même squelette avec ou sans sport");
  assert.notDeepStrictEqual(seances(a).map(s => s.exercices.map(e => e.id)), seances(b).map(s => s.exercices.map(e => e.id)), "les exercices changent avec le sport");
  assert.ok(seances(b).some(s => s.exercices.some(e => e.compartiment === "tirage_v" || e.compartiment === "tirage_h")), "escalade : du tirage");
});

console.log("\n=== cas demandés ===");
test("débutant à 6× : PPL, difficulté 1 seulement, 4-5 exercices par séance", () => {
  const p = genererProgramme({ frequence: 6, objectif: "muscler", materiel: "salle", niveau: 1 }, banque);
  assert.deepStrictEqual(seances(p).map(s => s.focus), ["push", "pull", "legs", "push", "pull", "legs"]);
  for (const s of seances(p)) { assert.ok(s.exercices.every(e => e.difficulte === 1)); assert.ok(exosForce(s).length >= 4 && exosForce(s).length <= 5); }
  assert.deepStrictEqual(verifierRegles(p, banque), []);
});
test("avancé à 1× : full body, versions avancées, et un avertissement sur le volume (règle 3 inatteignable)", () => {
  const p = genererProgramme({ frequence: 1, objectif: "muscler", materiel: "salle", niveau: 3 }, banque);
  assert.strictEqual(seances(p).length, 1);
  assert.ok(seances(p)[0].exercices.some(e => e.echelle === "avance"));
  assert.ok(p.avertissements.some(a => /volume/i.test(a)), "avertissement volume attendu : " + JSON.stringify(p.avertissements));
  assert.strictEqual(verifierRegles(p, banque).length, 0);
});
test("coureur (course à pied, intention sport) à 4× : haut/bas, chaîne postérieure et mollets et unilatéral présents", () => {
  const p = genererProgramme({ frequence: 4, objectif: "mieux", sport: "course", intention: "sport", materiel: "salle", niveau: 2 }, banque);
  assert.deepStrictEqual(seances(p).map(s => s.focus), ["haut", "bas", "haut", "bas"]);
  const tous = seances(p).flatMap(s => s.exercices);
  assert.ok(tous.some(e => e.compartiment === "unilateral"), "unilatéral");
  assert.ok(tous.some(e => e.muscle === "mollets"), "mollets");
  assert.ok(tous.some(e => e.compartiment === "hinge" || e.muscle === "ischio-jambiers"), "chaîne postérieure");
  assert.strictEqual(verifierRegles(p, banque).length, 0);
});
test("poids du corps à 3× : aucun exercice n'exige barre, machine ou poulie", () => {
  const p = genererProgramme({ frequence: 3, objectif: "tonifier", materiel: "pdc", niveau: 2 }, banque);
  for (const s of seances(p)) for (const e of s.exercices) assert.ok(M.faisable(byId[e.id], "pdc"), `${e.nom} : ${byId[e.id].materiel.join(", ")}`);
  assert.strictEqual(verifierRegles(p, banque).length, 0);
});

console.log("\n=== règle 12 — remplacement ===");
test("même compartiment et même muscle d'abord, trié par difficulté la plus proche puis matériel", () => {
  const r = remplacerExercice(banque, "squat", { materiel: "salle", niveau: 2 });
  assert.ok(r.exercice && r.exercice.id !== "squat");
  assert.strictEqual(r.exercice.compartiment, "squat");
  assert.strictEqual(r.exercice.muscle, "quadriceps");
  assert.strictEqual(r.approximatif, null);
  const diffs = r.candidats.map(c => Math.abs(c.difficulte - 2));
  for (let i = 1; i < diffs.length; i++) assert.ok(diffs[i] >= diffs[i - 1], "tri par écart de difficulté");
});
test("matériel indisponible : les candidats faisables passent devant", () => {
  const r = remplacerExercice(banque, "presse", { materiel: "halteres", niveau: 1 });
  assert.ok(M.faisable(r.exercice, "halteres"), r.exercice.nom);
});
test("aucun candidat dans le compartiment : même muscle ailleurs, signalé approximatif", () => {
  // kickback (isolation fessiers, poulie) avec haltères seulement, toutes les autres isolations fessiers exclues :
  // plus aucun candidat du même compartiment → même muscle ailleurs (swing, pull-through), signalé
  const r = remplacerExercice(banque, "kickback", { materiel: "halteres", niveau: 2, exclure: ["pont_sol", "pont", "hipthrust_machine", "hipthrust"] });
  assert.ok(r.exercice, "un remplaçant attendu");
  assert.strictEqual(r.exercice.muscle, "fessiers");
  assert.notStrictEqual(r.exercice.compartiment, "isolation");
  assert.strictEqual(r.approximatif, "même muscle, geste différent");
  const r2 = remplacerExercice(banque, "legcurl", { materiel: "pdc", niveau: 1, exclure: ["legcurl_ballon"] });
  assert.ok(r2.exercice === null || r2.approximatif, "sans candidat exact, le remplaçant est approximatif ou absent");
});

console.log("\n=== le vérificateur détecte un programme comme l'actuel ===");
test("hip thrust en séance poitrine → violation de la règle 1", () => {
  const p = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2 }, banque);
  const haut = seances(p).find(s => s.focus === "haut");
  haut.exercices.splice(1, 0, { ...M.exerciceProgramme(byId.hipthrust, { series: 3, reps: [8, 12], repos_s: 120 }) });
  const v = verifierRegles(p, banque);
  assert.ok(v.some(x => x.regle === 1 && /Hip thrust/.test(x.message)), JSON.stringify(v));
});
test("même structure à 3× et 6× → violation squelette", () => {
  const p6 = genererProgramme({ frequence: 6, objectif: "muscler", materiel: "salle", niveau: 2 }, banque);
  const faux = { ...p6, squelette: { ...p6.squelette, nom: "fullbody-ABC" }, semaine: p6.semaine.map(j => j.seance ? { ...j, seance: { ...j.seance, focus: "fullA" } } : j) };
  const v = verifierRegles(faux, banque);
  assert.ok(v.some(x => x.regle === "squelette"), JSON.stringify(v));
});
test("repos incohérent avec les reps → violation de la règle 5", () => {
  const p = genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: 2 }, banque);
  seances(p)[0].exercices[0].repos_s = 30;
  assert.ok(verifierRegles(p, banque).some(x => x.regle === 5));
});

console.log(`\n${nb - ko}/${nb} tests passent` + (ko ? ` — ${ko} en échec` : ""));
process.exit(ko ? 1 : 0);
