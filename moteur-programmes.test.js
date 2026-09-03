/* Tests du moteur de génération (chantier Programmes, étape 2).
   Écrits AVANT le moteur : chaque règle 1 à 12 et chaque squelette est
   vérifié mécaniquement sur toutes les combinaisons fréquence × objectif ×
   niveau × matériel, plus les cas demandés par Léo et les corrections de
   personnalisation de la relecture (A à F, durée exacte, matériel « rien »).
   Lancer : node moteur-programmes.test.js */
const assert = require("assert");
const banque = require("./banque-exercices.json");
const M = require("./moteur-programmes.js");
const { genererProgramme, remplacerExercice, verifierRegles, GROS_GROUPES, grosGroupe, groupesDe } = M;

let nb = 0, ko = 0;
const test = (nom, fn) => { nb++; try { fn(); console.log("  ✔ " + nom); } catch (e) { ko++; console.log("  ✘ " + nom + "\n      " + String(e.message || e).split("\n").slice(0, 6).join("\n      ")); } };
const byId = Object.fromEntries(banque.exercices.map(e => [e.id, e]));
const seances = p => p.semaine.filter(j => j.seance).map(j => j.seance);
const exosForce = s => s.exercices.filter(e => e.compartiment !== "gainage" && e.compartiment !== "cardio_mobilite");
const ids = p => seances(p).map(s => s.exercices.map(e => e.id));

const OBJECTIFS = ["tonifier", "poids", "muscler", "mieux", "douce", "libre"];
const MATERIELS = ["salle", "halteres", "pdc", "rien"];

console.log("=== grille : fréquence × objectif × niveau × matériel — toutes les règles ===");
let total = 0, echecs = [];
for (let f = 1; f <= 7; f++) for (const o of OBJECTIFS) for (let n = 1; n <= 3; n++) for (const m of MATERIELS) {
  total++;
  const entrees = { frequence: f, objectif: o, objectifLibre: o === "libre" ? "je veux être plus forte sur mes squats" : "", sport: null, intention: "soi", materiel: m, niveau: n, tempsMin: 60 };
  let prog;
  try { prog = genererProgramme(entrees, banque); } catch (e) { echecs.push(`${f}× ${o} n${n} ${m} : exception ${e.stack}`); continue; }
  const v = verifierRegles(prog, banque);
  if (v.length) echecs.push(`${f}× ${o} n${n} ${m} : ` + v.map(x => `[${x.regle}] ${x.message}`).join(" | "));
}
test(`${total} programmes générés, 0 violation`, () => { assert.strictEqual(echecs.length, 0, echecs.slice(0, 12).join("\n")); });
test("le même programme est généré deux fois de suite (fonction pure)", () => {
  const e = { frequence: 4, objectif: "tonifier", sport: "course", intention: "sport", materiel: "salle", niveau: 2, tempsMin: 47, joursSport: [7] };
  assert.deepStrictEqual(genererProgramme(e, banque), genererProgramme(e, banque));
});

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
test("règle 3 — le plafond porte sur les séries directes, le minimum compte les secondaires ½", () => {
  const p = genererProgramme({ frequence: 6, objectif: "libre", objectifLibre: "plus fort", materiel: "salle", niveau: 3, tempsMin: 75 }, banque);
  for (const g of GROS_GROUPES) {
    assert.ok(p.volume.direct[g] <= M.NIVEAU[3].volumeMax || p.avertissements.some(a => a.startsWith(`Volume ${g}`)), `${g} : ${p.volume.direct[g]} séries directes`);
    assert.ok(p.volume.total[g] >= p.volume.direct[g], "le total inclut le direct");
  }
  // le dos rempli par les tirages (secondaires) ne déclenche plus le plafond
  assert.ok(!p.avertissements.some(a => /Volume dos/.test(a)), p.avertissements.join("\n"));
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
test("règle 6 — n'importe quel nombre entier de minutes (47, 33), pas seulement des multiples de 5", () => {
  for (const t of [47, 33, 52, 25]) {
    const p = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2, tempsMin: t }, banque);
    assert.strictEqual(p.entrees.tempsMin, t);
    for (const s of seances(p)) assert.ok(s.dureeMin <= t, `${t} min : séance ${s.lettre} = ${s.dureeMin}`);
    assert.deepStrictEqual(verifierRegles(p, banque), []);
  }
  const p47 = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2, tempsMin: 47 }, banque);
  const p45 = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2, tempsMin: 45 }, banque);
  assert.ok(seances(p47).some((s, i) => s.dureeMin > seances(p45)[i].dureeMin) || seances(p47).every((s, i) => s.dureeMin === seances(p45)[i].dureeMin), "47 min ne donne pas moins que 45");
  assert.strictEqual(genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: 2, tempsMin: "38" }, banque).entrees.tempsMin, 38, "chaîne acceptée");
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
  assert.notDeepStrictEqual(ids(a), ids(b), "les exercices changent avec le sport");
  assert.ok(seances(b).some(s => s.exercices.some(e => e.compartiment === "tirage_v" || e.compartiment === "tirage_h")), "escalade : du tirage");
});

console.log("\n=== personnalisation (relecture de MOTEUR.md) ===");
test("A — objectif fessiers : hip thrust présent dans chaque séance qui admet les fessiers, à tous les niveaux", () => {
  for (let n = 1; n <= 3; n++) for (const f of [3, 4, 6]) {
    const p = genererProgramme({ frequence: f, objectif: "tonifier", materiel: "salle", niveau: n, tempsMin: 60 }, banque);
    for (const s of seances(p)) {
      if (!M.FOCUS[s.focus].iso.includes("fessiers")) continue;
      const ht = s.exercices.find(e => e.id.startsWith("hipthrust"));
      assert.ok(ht, `niveau ${n}, ${f}×, séance ${s.lettre} sans hip thrust : ${s.exercices.map(e => e.id).join(", ")}`);
      assert.strictEqual(ht.role, "objectif");
    }
    assert.deepStrictEqual(verifierRegles(p, banque), []);
  }
});
test("A — objectif fessiers : les abductions s'ajoutent quand le temps le permet (débutante 3× à 60 min)", () => {
  const p = genererProgramme({ frequence: 3, objectif: "tonifier", materiel: "salle", niveau: 1, tempsMin: 60 }, banque);
  const tous = seances(p).flatMap(s => s.exercices);
  assert.ok(tous.filter(e => e.muscle === "abducteurs").length >= 2, "abductions attendues dans au moins deux séances : " + tous.map(e => e.id).join(", "));
  assert.ok(tous.some(e => e.role === "objectif_extra"), "la case supplémentaire d'objectif a été utilisée");
  for (const s of seances(p)) assert.ok(s.dureeMin <= 60);
  // à 35 min, la case supplémentaire saute, le hip thrust reste
  const court = genererProgramme({ frequence: 3, objectif: "tonifier", materiel: "salle", niveau: 1, tempsMin: 35 }, banque);
  for (const s of seances(court)) { assert.ok(s.dureeMin <= 35); assert.ok(s.exercices.some(e => e.id.startsWith("hipthrust")), `séance ${s.lettre} à 35 min sans hip thrust`); }
  assert.ok(seances(court).flatMap(s => s.exercices).every(e => e.role !== "objectif_extra"), "pas de case supplémentaire à 35 min");
});
test("A — objectif fessiers sans matériel : le hip thrust est remplacé par une isolation fessiers (règle 12), et c'est dit", () => {
  for (const m of ["halteres", "pdc", "rien"]) {
    const p = genererProgramme({ frequence: 3, objectif: "tonifier", materiel: m, niveau: 2 }, banque);
    for (const s of seances(p)) { const o = s.exercices.find(e => e.role === "objectif"); assert.ok(o && o.muscle === "fessiers" && o.compartiment === "isolation", `${m} séance ${s.lettre} : ${o && o.nom}`); }
    assert.ok(p.avertissements.some(a => /Hip thrust remplacé/.test(a)), m + " : " + p.avertissements.join(" | "));
  }
});
test("A — force : gros mouvements à 3-6 reps avec 180 s, au plus une isolation par muscle", () => {
  const p = genererProgramme({ frequence: 6, objectif: "libre", objectifLibre: "je veux être plus fort", materiel: "salle", niveau: 3, tempsMin: 75 }, banque);
  assert.strictEqual(p.entrees.objectif, "force");
  for (const s of seances(p)) {
    const gros = s.exercices.filter(e => ["squat", "hinge", "poussee_h", "poussee_v", "tirage_h", "tirage_v", "unilateral"].includes(e.compartiment));
    assert.ok(gros.length >= 3, `séance ${s.lettre} : ${gros.length} gros mouvements`);
    for (const e of gros.filter(e => e.compartiment !== "unilateral")) { assert.ok(e.reps[1] <= 6, `${e.nom} ${e.reps.join("-")}`); assert.strictEqual(e.repos_s, 180, `${e.nom} repos ${e.repos_s}`); }
    assert.ok(exosForce(s).length >= 5, `séance ${s.lettre} : ${exosForce(s).length} exercices (force : 5 au moins au niveau 3)`);
    const muscles = s.exercices.filter(e => e.compartiment === "isolation").map(e => e.muscle);
    assert.strictEqual(new Set(muscles).size, muscles.length, `séance ${s.lettre} : deux isolations d'un même muscle (${muscles.join(", ")})`);
  }
  assert.deepStrictEqual(verifierRegles(p, banque), []);
});
test("A — l'objectif pèse : tonifier et muscler donnent des isolations différentes à squelette égal", () => {
  const t = genererProgramme({ frequence: 4, objectif: "tonifier", materiel: "salle", niveau: 2 }, banque);
  const m = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2 }, banque);
  const isoT = seances(t).flatMap(s => s.exercices).filter(e => e.compartiment === "isolation").map(e => e.muscle);
  const isoM = seances(m).flatMap(s => s.exercices).filter(e => e.compartiment === "isolation").map(e => e.muscle);
  assert.ok(isoT.filter(x => ["fessiers", "abducteurs", "ischio-jambiers"].includes(x)).length > isoM.filter(x => ["fessiers", "abducteurs", "ischio-jambiers"].includes(x)).length, `tonifier ${isoT} / muscler ${isoM}`);
  assert.ok(isoM.filter(x => ["triceps", "biceps", "épaules latérales"].includes(x)).length >= isoT.filter(x => ["triceps", "biceps", "épaules latérales"].includes(x)).length);
});
test("B — niveau 3 : aucune difficulté 1 ni régression, sauf absence totale d'alternative", () => {
  for (const o of ["muscler", "tonifier", "mieux"]) for (const m of ["salle", "halteres", "pdc"]) for (const f of [4, 6]) {
    const p = genererProgramme({ frequence: f, objectif: o, materiel: m, niveau: 3, tempsMin: 75 }, banque);
    for (const s of seances(p)) {
      const pris = new Set(s.exercices.map(e => e.id));
      for (const e of exosForce(s)) {
        if (!M.tropFacilePourAvance(e)) continue;
        const alt = banque.exercices.filter(x => !pris.has(x.id) && x.compartiment === e.compartiment && (e.compartiment !== "isolation" || x.muscle === e.muscle) && M.faisable(x, m) && !M.tropFacilePourAvance(x) && M.appartientAuFocus(x, s.focus));
        assert.strictEqual(alt.length, 0, `${o} ${m} ${f}× séance ${s.lettre} : ${e.nom} (difficulté ${e.difficulte}) alors que ${alt.map(x => x.nom).join(", ")} existe`);
      }
    }
    // en salle, les polyarticulaires d'un avancé sont tous de difficulté ≥ 2
    if (m === "salle") for (const s of seances(p)) for (const e of exosForce(s)) if (e.compartiment !== "isolation") assert.ok(e.difficulte >= 2 && !e.regression, `${o} ${f}× : ${e.nom} difficulté ${e.difficulte}`);
  }
});
test("B — niveau 1 : pas d'exercice marqué coordination (dead bug) ; planche genoux ou bird-dog à la place", () => {
  for (const o of ["tonifier", "mieux", "douce"]) for (const f of [2, 3, 4]) {
    const p = genererProgramme({ frequence: f, objectif: o, materiel: "salle", niveau: 1 }, banque);
    for (const s of seances(p)) for (const e of s.exercices) assert.ok(!byId[e.id].coordination, `${o} ${f}× séance ${s.lettre} : ${e.nom}`);
    const gainages = seances(p).flatMap(s => s.exercices).filter(e => e.compartiment === "gainage").map(e => e.id);
    assert.ok(gainages.every(g => ["planche_genoux", "bird_dog"].includes(g)), gainages.join(", "));
  }
});
test("B — une variation ne descend jamais de deux crans de difficulté", () => {
  for (const id of ["squat_avant", "souleve_terre", "traction", "hipthrust", "bulgare", "developpe_couche"]) {
    const o = byId[id];
    for (const m of ["salle", "halteres", "pdc"]) for (let n = 1; n <= 3; n++) {
      const r = remplacerExercice(banque, id, { materiel: m, niveau: n });
      for (const c of r.candidats) assert.ok(Math.abs(c.difficulte - o.difficulte) <= 1, `${id} → ${c.id} (${o.difficulte} → ${c.difficulte})`);
    }
  }
  assert.strictEqual(remplacerExercice(banque, "souleve_terre", { materiel: "salle", niveau: 1 }).exercice, null, "soulevé de terre (3) n'a pas de variation de niveau 1 : on ne descend pas de deux crans");
});
test("C — un accessoire (extension lombaire, superman, chaise, pull-through) n'ouvre jamais une séance", () => {
  for (const o of ["tonifier", "mieux", "douce"]) for (const m of ["salle", "halteres", "pdc", "rien"]) for (const f of [1, 2, 3, 4]) for (let n = 1; n <= 3; n++) {
    const p = genererProgramme({ frequence: f, objectif: o, materiel: m, niveau: n }, banque);
    for (const s of seances(p)) if (s.exercices.length) assert.ok(!s.exercices[0].accessoire, `${o} ${m} ${f}× n${n} séance ${s.lettre} ouvre sur ${s.exercices[0].nom}`);
  }
  // en salle, la charnière d'une débutante est un vrai hinge (RDL haltères), pas l'extension lombaire
  const p = genererProgramme({ frequence: 3, objectif: "tonifier", materiel: "salle", niveau: 1 }, banque);
  const hinges = seances(p).flatMap(s => s.exercices).filter(e => e.compartiment === "hinge");
  assert.ok(hinges.length >= 1 && hinges.every(e => !e.accessoire), hinges.map(e => e.nom).join(", "));
});
test("D — coureur : programme visiblement différent (bulgares ou step-up, chaîne postérieure, mollets, hanche, anti-rotation, bras réduits)", () => {
  const c = genererProgramme({ frequence: 4, objectif: "mieux", sport: "course", intention: "sport", materiel: "salle", niveau: 2 }, banque);
  const t = genererProgramme({ frequence: 4, objectif: "mieux", materiel: "salle", niveau: 2 }, banque);
  const tous = seances(c).flatMap(s => s.exercices);
  assert.ok(tous.some(e => ["bulgare", "stepup"].includes(e.id)), "fentes bulgares ou step-up");
  for (const s of seances(c).filter(s => s.focus === "bas")) assert.ok(s.exercices.filter(e => e.compartiment === "unilateral").length >= 2, `séance ${s.lettre} : unilatéral prioritaire (deux exercices)`);
  assert.ok(tous.some(e => e.compartiment === "hinge" || e.muscle === "ischio-jambiers" || e.muscle === "chaîne postérieure"), "chaîne postérieure");
  assert.ok(tous.some(e => e.muscle === "mollets"), "mollets");
  assert.ok(tous.some(e => e.muscle === "abducteurs"), "stabilité de hanche (abducteurs)");
  assert.ok(tous.some(e => ["planche_laterale", "pallof"].includes(e.id)), "gainage anti-rotation");
  const bras = tous.filter(e => ["biceps", "triceps"].includes(e.muscle)).length;
  const brasTemoin = seances(t).flatMap(s => s.exercices).filter(e => ["biceps", "triceps"].includes(e.muscle)).length;
  assert.ok(bras === 0 && brasTemoin > 0, `isolations bras : coureur ${bras}, témoin ${brasTemoin}`);
  // les séances bas du corps et les accessoires (isolations, gainage) sont là où la différence se voit
  const basT = seances(t).filter(s => s.focus === "bas").flatMap(s => s.exercices.map(e => e.id));
  for (const s of seances(c).filter(s => s.focus === "bas")) { const propres = s.exercices.filter(e => !basT.includes(e.id)); assert.ok(propres.length >= 3, `séance ${s.lettre} : ${propres.length} exercice(s) propres au coureur seulement`); }
  const accC = tous.filter(e => e.compartiment === "isolation" || e.compartiment === "gainage").map(e => e.id), accT = seances(t).flatMap(s => s.exercices).filter(e => e.compartiment === "isolation" || e.compartiment === "gainage").map(e => e.id);
  assert.ok(accC.filter(x => accT.includes(x)).length < accC.length * 0.5, `accessoires : ${accC.join(", ")} contre ${accT.join(", ")}`);
  assert.deepStrictEqual(verifierRegles(c, banque), []);
});
test("D — jours de sport : jamais de séance ce jour-là, séances jambes loin de la sortie longue", () => {
  const p = genererProgramme({ frequence: 4, objectif: "mieux", sport: "course", intention: "sport", materiel: "salle", niveau: 2, joursSport: [7] }, banque);
  assert.deepStrictEqual(p.entrees.joursSport, [7]);
  assert.ok(p.semaine[6].sport && !p.semaine[6].seance, "dimanche = sortie longue, pas de séance");
  for (const j of p.semaine) if (j.seance && M.FOCUS[j.seance.focus].bas) assert.ok(j.jour !== 6 && j.jour !== 1, `séance jambes ${j.seance.lettre} le jour ${j.jour}, collée à la sortie longue du dimanche`);
  assert.deepStrictEqual(verifierRegles(p, banque), []);
  const p2 = genererProgramme({ frequence: 3, objectif: "tonifier", sport: "football", intention: "sport", materiel: "salle", niveau: 2, joursSport: [3, 7] }, banque);
  for (const j of p2.semaine) if (j.sport) assert.strictEqual(j.seance, null, `séance un jour de sport (${j.jour})`);
});
test("E — placement espacé : 4× = lundi, mardi, jeudi, vendredi ; 3× = lundi, mercredi, vendredi ; jamais un bloc de 4 jours", () => {
  const j = p => p.semaine.filter(x => x.seance).map(x => x.jour);
  assert.deepStrictEqual(j(genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2 }, banque)), [1, 2, 4, 5]);
  assert.deepStrictEqual(j(genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: 2 }, banque)), [1, 3, 5]);
  assert.deepStrictEqual(j(genererProgramme({ frequence: 2, objectif: "mieux", materiel: "salle", niveau: 2 }, banque)), [1, 4]);
  const j5 = j(genererProgramme({ frequence: 5, objectif: "tonifier", materiel: "salle", niveau: 2 }, banque));
  let bloc = 1, max = 1; for (let i = 1; i < j5.length; i++) { bloc = j5[i] - j5[i - 1] === 1 ? bloc + 1 : 1; max = Math.max(max, bloc); }
  assert.ok(max <= 3, `5× : bloc de ${max} jours collés (${j5.join(", ")})`);
});
test("F — le gainage tourne d'une séance à l'autre", () => {
  for (const [f, n] of [[3, 2], [4, 2], [6, 3], [4, 3]]) {
    const p = genererProgramme({ frequence: f, objectif: "muscler", materiel: "salle", niveau: n }, banque);
    const g = seances(p).map(s => (s.exercices.find(e => e.compartiment === "gainage") || {}).id);
    assert.ok(new Set(g).size >= Math.min(g.length, 3), `${f}× n${n} : ${g.join(", ")}`);
    for (let i = 1; i < g.length; i++) assert.notStrictEqual(g[i], g[i - 1], `${f}× n${n} : même gainage deux séances de suite (${g[i]})`);
  }
});

console.log("\n=== cas demandés ===");
test("débutant à 6× : PPL, difficulté 1 seulement, 4-5 exercices par séance", () => {
  const p = genererProgramme({ frequence: 6, objectif: "muscler", materiel: "salle", niveau: 1 }, banque);
  assert.deepStrictEqual(seances(p).map(s => s.focus), ["push", "pull", "legs", "push", "pull", "legs"]);
  for (const s of seances(p)) { assert.ok(s.exercices.every(e => e.difficulte === 1)); assert.ok(exosForce(s).length >= 4 && exosForce(s).length <= 5); }
  assert.deepStrictEqual(verifierRegles(p, banque), []);
});
test("avancé à 1× : full body, versions avancées, et un avertissement « programme d'entretien » (règle 3 inatteignable)", () => {
  const p = genererProgramme({ frequence: 1, objectif: "muscler", materiel: "salle", niveau: 3 }, banque);
  assert.strictEqual(seances(p).length, 1);
  assert.ok(seances(p)[0].exercices.some(e => e.echelle === "avance"));
  assert.ok(p.avertissements.some(a => /programme d'entretien/.test(a)), "avertissement attendu : " + JSON.stringify(p.avertissements));
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
test("rien du tout (maison sans équipement) : ni barre de traction, ni dips, ni élastique ; le manque de tirage vertical est dit", () => {
  for (let n = 1; n <= 3; n++) {
    const p = genererProgramme({ frequence: 3, objectif: "mieux", materiel: "rien", niveau: n }, banque);
    for (const s of seances(p)) for (const e of s.exercices) {
      assert.ok(M.faisable(byId[e.id], "rien"), `${e.nom}`);
      assert.ok(!["traction", "traction_negative", "traction_lestee", "dips", "pallof", "rowing_elastique"].includes(e.id), e.nom);
    }
    assert.ok(p.avertissements.some(a => /tirage_v/.test(a)), "avertissement tirage vertical attendu : " + p.avertissements.join(" | "));
    assert.strictEqual(verifierRegles(p, banque).length, 0);
  }
  // le poids du corps garde l'hypothèse barre de traction + dips
  const pdc = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "pdc", niveau: 2 }, banque);
  assert.ok(seances(pdc).flatMap(s => s.exercices).some(e => e.id.startsWith("traction")), "pdc : tractions présentes");
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
test("accessoire en ouverture, pompes genoux chez un avancé, deux isolations du même muscle → violations", () => {
  const p = genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: 2 }, banque);
  seances(p)[0].exercices.unshift(M.exerciceProgramme(byId.lombaire, { series: 3, reps: [12, 15], repos_s: 90 }));
  assert.ok(verifierRegles(p, banque).some(x => x.regle === 2 && /accessoire/.test(x.message)));
  const p3 = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 3, tempsMin: 75 }, banque);
  const haut = seances(p3).find(s => s.focus === "haut");
  haut.exercices[0] = M.exerciceProgramme(byId.pompes, { series: 4, reps: [8, 12], repos_s: 120 });
  assert.ok(verifierRegles(p3, banque).some(x => x.regle === 7 && /Pompes/.test(x.message)), JSON.stringify(verifierRegles(p3, banque)));
  const p2 = genererProgramme({ frequence: 4, objectif: "libre", objectifLibre: "force", materiel: "salle", niveau: 2, tempsMin: 90 }, banque);
  const h2 = seances(p2).find(s => s.focus === "haut");
  const iso = h2.exercices.find(e => e.compartiment === "isolation");
  const autre = banque.exercices.find(x => x.compartiment === "isolation" && x.muscle === iso.muscle && x.id !== iso.id);
  h2.exercices.splice(h2.exercices.indexOf(iso) + 1, 0, M.exerciceProgramme(autre, { series: 3, reps: [8, 12], repos_s: 90 }));
  assert.ok(verifierRegles(p2, banque).some(x => x.regle === 11), JSON.stringify(verifierRegles(p2, banque)));
  // le même doublon n'est qu'une pénalité hors force : pas de violation 11 pour « me muscler »
  const p4 = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "salle", niveau: 2 }, banque);
  const h4 = seances(p4).find(s => s.focus === "haut");
  h4.exercices.push(M.exerciceProgramme(byId.curl_poulie, { series: 2, reps: [12, 15], repos_s: 90 }));
  assert.ok(!verifierRegles(p4, banque).some(x => x.regle === 11));
});

console.log(`\n${nb - ko}/${nb} tests passent` + (ko ? ` — ${ko} en échec` : ""));
process.exit(ko ? 1 : 0);
