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
    assert.ok(gros.length >= (s.focus === "pull" ? 2 : 3), `séance ${s.lettre} : ${gros.length} gros mouvements`);
    for (const e of gros.filter(e => e.compartiment !== "unilateral")) { assert.ok(e.reps[1] <= 6, `${e.nom} ${e.reps.join("-")}`); assert.strictEqual(e.repos_s, 180, `${e.nom} repos ${e.repos_s}`); }
    assert.ok(exosForce(s).length >= (s.focus === "pull" ? 4 : 5), `séance ${s.lettre} : ${exosForce(s).length} exercices (force : 5 au moins au niveau 3, 4 en pull)`);
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
    const gainages = seances(p).flatMap(s => s.exercices).filter(e => e.compartiment === "gainage");
    assert.ok(gainages.every(g => g.difficulte === 1 && !byId[g.id].coordination), gainages.map(g => g.id).join(", "));
    assert.ok(gainages.some(g => ["planche_genoux", "bird_dog"].includes(g.id)), gainages.map(g => g.id).join(", "));
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
  const propres = seances(c).filter(s => s.focus === "bas").flatMap(s => s.exercices.filter(e => !basT.includes(e.id)).map(e => e.id));
  assert.ok(propres.length >= 4, `bas du corps : ${propres.length} exercice(s) propres au coureur sur les deux séances (${propres.join(", ")})`);
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

console.log("\n=== finitions de relecture (force, régressions niveau 2, ischios du coureur, matériel réel) ===");
test("force — le soulevé de terre conventionnel est présent une fois par semaine (trap bar au niveau 2, et c'est dit)", () => {
  for (const f of [3, 4, 6]) {
    const p3 = genererProgramme({ frequence: f, objectif: "libre", objectifLibre: "plus fort", materiel: "salle", niveau: 3, tempsMin: 75 }, banque);
    const sdt = seances(p3).flatMap(s => s.exercices).filter(e => e.id === "souleve_terre");
    assert.strictEqual(sdt.length, 1, `${f}× niveau 3 : soulevé de terre ${sdt.length} fois`);
    assert.strictEqual(sdt[0].role, "objectif");
    assert.deepStrictEqual(verifierRegles(p3, banque), []);
    const p2 = genererProgramme({ frequence: f, objectif: "libre", objectifLibre: "plus fort", materiel: "salle", niveau: 2, tempsMin: 75 }, banque);
    assert.ok(seances(p2).flatMap(s => s.exercices).some(e => e.id === "trap_bar" && e.role === "objectif"), `${f}× niveau 2 : trap bar attendu`);
    assert.ok(p2.avertissements.some(a => /Soulevé de terre remplacé par Soulevé de terre trap bar/.test(a)), p2.avertissements.join(" | "));
  }
});
test("force — un seul rowing horizontal par séance pull, poussée verticale = militaire ou push press, jamais l'Arnold press", () => {
  for (const n of [2, 3]) {
    const p = genererProgramme({ frequence: 6, objectif: "libre", objectifLibre: "plus fort", materiel: "salle", niveau: n, tempsMin: 75 }, banque);
    for (const s of seances(p)) {
      if (s.focus === "pull") { assert.ok(s.exercices.filter(e => e.compartiment === "tirage_h").length <= 1, `séance ${s.lettre} : deux rowings`); assert.ok(s.exercices.filter(e => e.compartiment === "tirage_v").length <= 1); assert.ok(exosForce(s).length >= 4); }
      for (const e of s.exercices) { assert.notStrictEqual(e.id, "arnold", `séance ${s.lettre} : Arnold press en force`); if (e.compartiment === "poussee_v" && n === 3) assert.ok(["militaire", "push_press"].includes(e.id), `${e.nom} en poussée verticale de force`); }
    }
    assert.deepStrictEqual(verifierRegles(p, banque), []);
  }
  // hors force, l'Arnold press reste disponible
  const m = genererProgramme({ frequence: 6, objectif: "muscler", materiel: "salle", niveau: 3, tempsMin: 75 }, banque);
  assert.ok(seances(m).flatMap(s => s.exercices).some(e => e.id === "arnold"), "muscler 6× : Arnold press attendu quelque part");
});
test("régressions — dès le niveau 2 en salle : ni pompes genoux, ni pompes au mur, ni planche sur les genoux, ni traction négative", () => {
  for (const o of ["tonifier", "muscler", "mieux", "poids"]) for (const f of [3, 4, 6]) {
    const p = genererProgramme({ frequence: f, objectif: o, materiel: "salle", niveau: 2 }, banque);
    for (const s of seances(p)) for (const e of s.exercices) assert.ok(!byId[e.id].regression, `${o} ${f}× séance ${s.lettre} : ${e.nom}`);
    assert.deepStrictEqual(verifierRegles(p, banque), []);
  }
  // au poids du corps, la traction négative reste : rien de mieux n'existe
  const pdc = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "pdc", niveau: 2 }, banque);
  assert.ok(seances(pdc).flatMap(s => s.exercices).some(e => e.id === "traction_negative"), "pdc niveau 2 : traction négative attendue");
  assert.deepStrictEqual(verifierRegles(pdc, banque), []);
  // le vérificateur le voit : une planche sur les genoux glissée chez un intermédiaire en salle
  const q = genererProgramme({ frequence: 3, objectif: "mieux", materiel: "salle", niveau: 2 }, banque);
  const s0 = seances(q)[0]; s0.exercices[s0.exercices.length - 1] = M.exerciceProgramme(byId.planche_genoux, { series: 3, duree_s: 30, repos_s: 45 });
  assert.ok(verifierRegles(q, banque).some(x => x.regle === 7 && /Planche sur les genoux/.test(x.message)));
});
test("coureur — les ischio-jambiers sont obligatoires : nordic curl au niveau 3, leg curl au niveau 2", () => {
  for (const n of [2, 3]) {
    const p = genererProgramme({ frequence: 4, objectif: "mieux", sport: "course", intention: "sport", materiel: "salle", niveau: n }, banque);
    for (const s of seances(p).filter(s => s.focus === "bas")) {
      const isch = s.exercices.find(e => e.compartiment === "isolation" && e.muscle === "ischio-jambiers");
      assert.ok(isch && isch.role === "objectif", `niveau ${n} séance ${s.lettre} : ${s.exercices.map(e => e.id).join(", ")}`);
      if (n === 3) assert.strictEqual(isch.id, "nordic"); else assert.ok(isch.id.startsWith("legcurl"), isch.id);
    }
    assert.ok(seances(p).flatMap(s => s.exercices).some(e => e.muscle === "mollets"), "mollets toujours là");
    assert.deepStrictEqual(verifierRegles(p, banque), []);
  }
});
test("matériel réel — une liste de tags cochés remplace les raccourcis, qui n'en sont que des pré-sélections", () => {
  const a = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "halteres", niveau: 2 }, banque);
  const b = genererProgramme({ frequence: 4, objectif: "muscler", materiel: ["haltères", "banc"], niveau: 2 }, banque);
  assert.deepStrictEqual(ids(a), ids(b), "raccourci haltères = haltères + banc cochés");
  assert.deepStrictEqual(b.entrees.materiel, ["haltères", "banc"]);
  const c = genererProgramme({ frequence: 4, objectif: "muscler", materiel: ["haltères", "banc", "élastique", "barre de traction"], niveau: 2 }, banque);
  const tousC = seances(c).flatMap(s => s.exercices);
  assert.ok(tousC.some(e => e.id.startsWith("traction")), "barre de traction cochée : tractions");
  assert.ok(tousC.every(e => M.faisable(byId[e.id], ["haltères", "banc", "élastique", "barre de traction"])), "tout est faisable avec la liste");
  assert.ok(!tousC.some(e => byId[e.id].materiel.some(alt => alt.split(" + ").some(t => ["poulie", "machine", "barre"].includes(t)) && !byId[e.id].materiel.some(alt => alt.split(" + ").every(t => ["haltères", "banc", "élastique", "barre de traction", "poids du corps", "aucun"].includes(t))))), "rien qui exige poulie, machine ou barre");
  assert.deepStrictEqual(verifierRegles(c, banque), []);
  assert.strictEqual(M.nomMateriel(["haltères", "élastique"]), "matériel coché : haltères, élastique");
  assert.deepStrictEqual(M.normaliserMateriel(["haltères", "sabre laser", "haltères"]), ["haltères"], "tag inconnu ignoré, doublon retiré");
  const r = genererProgramme({ frequence: 3, objectif: "mieux", materiel: [], niveau: 2 }, banque);
  assert.deepStrictEqual(ids(r), ids(genererProgramme({ frequence: 3, objectif: "mieux", materiel: "rien", niveau: 2 }, banque)), "liste vide = rien du tout");
  for (const m of M.MATERIELS) assert.deepStrictEqual(ids(genererProgramme({ frequence: 3, objectif: "tonifier", materiel: m, niveau: 2 }, banque)), ids(genererProgramme({ frequence: 3, objectif: "tonifier", materiel: m === "salle" ? M.TAGS_MATERIEL : [...M.MATERIEL_OK[m]], niveau: 2 }, banque)), `raccourci ${m} = sa liste`);
});

console.log("\n=== étape 3 : questions → niveau, réponses → programme pour l'app, interprétation IA ===");
test("les deux questions factuelles donnent le niveau observé initial (1, 2 ou 3)", () => {
  const n = M.niveauDepuisQuestions;
  assert.strictEqual(n("jamais", "oui"), 1); assert.strictEqual(n("jamais", "pas_sur"), 1);
  assert.strictEqual(n("mois", "oui"), 2); assert.strictEqual(n("mois", "pas_sur"), 1);
  assert.strictEqual(n("an", "oui"), 3); assert.strictEqual(n("an", "pas_sur"), 2);
  assert.strictEqual(n(undefined, undefined), 1, "sans réponse : débutant");
});
test("réponses de l'onboarding → programme pour l'app : lettres, doses lisibles, gainage en liste, durée, avertissements", () => {
  const rep = { frequence: 4, objectif: "tonifier", muscu: "mois", technique: "oui", sport: "course", intention: "sport", joursSport: [7], materiel: ["haltères", "banc", "élastique"], tempsMin: 47 };
  const p = M.programmePourApp(rep, banque);
  assert.deepStrictEqual(Object.keys(p.seances), ["A", "B", "C", "D"]);
  assert.strictEqual(p.lieu, "perso"); assert.ok(p.nom.includes("4 séances"));
  assert.strictEqual(p.moteur.entrees.niveau, 2); assert.deepStrictEqual(p.moteur.entrees.materiel, ["haltères", "banc", "élastique"]); assert.strictEqual(p.moteur.entrees.tempsMin, 47);
  assert.strictEqual(p.moteur.semaine.length, 7); assert.ok(p.moteur.semaine[6].sport && !p.moteur.semaine[6].lettre);
  for (const [l, s] of Object.entries(p.seances)) {
    assert.ok(s.nom && s.couleur && s.dureeMin <= 47, l);
    assert.ok(Array.isArray(s.gainage) && s.gainage.length >= 1 && s.gainage.every(g => g.id && g.dose && g.repos && (g.duree === null || g.duree > 0)), l + " gainage");
    for (const e of s.exos) {
      assert.ok(/^\d × \d+-\d+( \/ côté)?$|^\d × \d+ s$/.test(e.dose), `${e.id} : dose « ${e.dose} »`);
      assert.strictEqual(parseInt(e.dose), e.series, "nbSeries(ex) = parseInt(dose)");
      assert.ok(typeof e.repos === "number" && e.repos >= 45 && e.consigne.length > 20 && e.erreur.length > 10, e.id);
      assert.ok(e.compartiment !== "gainage");
    }
    assert.ok(s.exos.filter(e => e.charge).length >= 1, l + " : des exercices avec charge");
  }
  const p7 = M.programmePourApp({ frequence: 7, objectif: "muscler", muscu: "an", technique: "oui", materiel: "salle", tempsMin: 60 }, banque);
  assert.ok(p7.seances.G && p7.seances.G.exos.every(e => !e.charge && /min$/.test(e.dose)) && p7.seances.G.gainage.length === 0, "7e jour : récupération active, en minutes, sans charge");
  const rien = M.programmePourApp({ frequence: 3, objectif: "mieux", muscu: "jamais", technique: "pas_sur", materiel: [], tempsMin: 40 }, banque);
  assert.ok(rien.moteur.avertissements.some(a => /barre de traction/.test(a)) && rien.moteur.limites.length, "sans matériel : la limite est dite");
  assert.ok(rien.seances.A.exos.every(e => !e.charge), "sans matériel : pas de charge à noter");
});
test("interprétation IA de l'objectif libre : appliquée quand elle est fournie, repli « esthétique équilibré » dit clairement", () => {
  const base = { frequence: 4, objectif: "libre", objectifLibre: "des jambes solides pour le ski", muscu: "an", technique: "oui", materiel: "salle" };
  const ia = M.programmePourApp({ ...base, interpretation: { base: "tonifier", prioritaires: ["quadriceps", "fessiers"] } }, banque);
  assert.strictEqual(ia.moteur.entrees.objectif, "tonifier");
  assert.ok(ia.moteur.avertissements.some(a => /lu comme « Me tonifier », priorité à quadriceps, fessiers/.test(a)), ia.moteur.avertissements.join(" | "));
  const repli = M.programmePourApp({ ...base, interpretation: { repli: true } }, banque);
  assert.strictEqual(repli.moteur.entrees.objectif, "mieux");
  assert.ok(repli.moteur.avertissements.some(a => /pas réussi à lire ton objectif/.test(a) && /esthétique équilibré/.test(a)), repli.moteur.avertissements.join(" | "));
  const horsFormat = M.programmePourApp({ ...base, interpretation: { base: "n'importe quoi", prioritaires: [] } }, banque);
  assert.ok(horsFormat.moteur.avertissements.some(a => /mots-clés, sans IA/.test(a)), "hors format sans repli explicite : mots-clés");
  assert.deepStrictEqual(verifierRegles(genererProgramme(M.entreesDepuisReponses({ ...base, interpretation: { base: "force", prioritaires: [] } }), banque), banque), []);
});

console.log("\n=== v20.1 : la séance vivante (incrément, niveau, remplaçants, adapter) ===");
const progApp = M.programmePourApp({ frequence: 4, objectif: "muscler", muscu: "mois", technique: "oui", materiel: "salle", tempsMin: 60 }, banque);
const exoDe = id => Object.values(progApp.seances).flatMap(s => s.exos).find(e => e.id === id);
test("règle 8 — incrément proposé seulement si haut de fourchette partout + ressenti facile/juste ; +2,5 haut, +5 bas et machines ; « trop dur » l'annule", () => {
  const dc = exoDe("developpe_couche"), sq = exoDe("squat"), lat = exoDe("lateral");
  assert.ok(dc && sq && lat, "exercices attendus dans le programme");
  assert.strictEqual(M.incrementDe(dc, "salle"), 2.5); assert.strictEqual(M.incrementDe(sq, "salle"), 5); assert.strictEqual(M.incrementDe(lat, "salle"), 2.5);
  const presse = banque.exercices.find(e => e.id === "presse");
  assert.strictEqual(M.incrementDe({ ...presse, compartiment: "squat" }, "salle"), 5);
  const tirageV = banque.exercices.find(e => e.id === "tirage_v");
  assert.strictEqual(M.incrementDe(tirageV, "salle"), 5, "tirage vertical à la machine : +5 même pour le haut");
  const h = [{ date: "2026-09-01", series: [40, 40, 40], hautFourchette: true, ressenti: "juste" }];
  const s1 = M.suggererCharge(dc, h, "salle");
  assert.ok(s1 && s1.kg === 42.5 && s1.plus === 2.5 && /\+2,5 kg, tu as tenu 8 reps partout/.test(s1.raison), JSON.stringify(s1));
  assert.strictEqual(M.suggererCharge(dc, [{ ...h[0], hautFourchette: false }], "salle"), null, "reps pas atteintes → rien");
  assert.strictEqual(M.suggererCharge(dc, [{ ...h[0], ressenti: "dur" }], "salle"), null, "trop dur → rien");
  assert.strictEqual(M.suggererCharge(dc, [{ ...h[0], ressenti: undefined }], "salle"), null, "sans ressenti → rien (on ne devine pas)");
  assert.strictEqual(M.suggererCharge(dc, [], "salle"), null);
  assert.strictEqual(M.suggererCharge({ ...dc, charge: false }, h, "salle"), null, "exercice sans charge → rien");
  const s2 = M.suggererCharge(sq, [{ date: "2026-09-01", series: [60, 62.5, 62.5], hautFourchette: true, ressenti: "facile" }], "salle");
  assert.ok(s2 && s2.kg === 67.5 && s2.plus === 5, JSON.stringify(s2));
});
test("règle 7 — le niveau observé se recale : 4 « facile » d'affilée sur les gros exercices → +1 proposé ; 3 « trop dur » sur 6 → −1 ; bornes 1 et 3", () => {
  const f = (r, compose = true) => ({ date: "2026-09-01", r, compose });
  assert.strictEqual(M.recalerNiveau([f("facile"), f("facile"), f("facile")], 2), null, "trois seulement");
  const plus = M.recalerNiveau([f("juste"), f("facile"), f("facile"), f("facile"), f("facile")], 2);
  assert.ok(plus && plus.sens === 1 && /On monte d'un cran/.test(plus.message), JSON.stringify(plus));
  assert.strictEqual(M.recalerNiveau([f("facile"), f("facile"), f("facile"), f("facile")], 3), null, "déjà au niveau 3");
  assert.strictEqual(M.recalerNiveau([f("facile"), f("facile"), f("facile", false), f("facile"), f("facile")], 2) && true, true, "les isolations ne comptent pas");
  assert.strictEqual(M.recalerNiveau([f("facile", false), f("facile", false), f("facile", false), f("facile", false)], 1), null, "que des isolations → rien");
  const moins = M.recalerNiveau([f("dur"), f("juste"), f("dur"), f("facile"), f("dur")], 2);
  assert.ok(moins && moins.sens === -1, JSON.stringify(moins));
  assert.strictEqual(M.recalerNiveau([f("dur"), f("dur"), f("dur")], 1), null, "déjà au niveau 1");
  const e = M.entreesDepuisReponses({ muscu: "mois", technique: "oui", niveauAjuste: 1 });
  assert.strictEqual(e.niveau, 3); assert.strictEqual(M.entreesDepuisReponses({ muscu: "jamais", niveauAjuste: -1 }).niveau, 1); assert.strictEqual(M.entreesDepuisReponses({ muscu: "an", technique: "oui", niveauAjuste: 5 }).niveau, 3);
});
test("règle 12 côté app — 2 à 3 remplaçants, le phare en premier, muscle et matériel, dose de l'original conservée, historique sous l'ancien id", () => {
  const goblet = exoDe("goblet") || { ...banque.exercices.find(e => e.id === "goblet"), series: 3, reps: [8, 12], repos: 120, charge: true };
  const r = M.remplacantsPour(banque, goblet, { materiel: "salle", niveau: 2, motif: "prefere" });
  assert.ok(r.candidats.length >= 2 && r.candidats.length <= 3, r.candidats.length);
  assert.ok(r.candidats[0].phare, "le phare (squat barre) en premier : " + r.candidats.map(c => c.exo.id).join(","));
  for (const c of r.candidats) { assert.ok(c.muscle && c.materiel && c.exo.id !== "goblet" && c.exo.remplace === "goblet"); assert.strictEqual(c.exo.series, goblet.series); if (c.exo.duree) assert.ok(/^3 × \d+ s$/.test(c.exo.dose), "isométrie : dose en secondes"); else { assert.deepStrictEqual(c.exo.reps, goblet.reps); assert.ok(/^3 × 8-12/.test(c.exo.dose)); } }
  const m = M.remplacantsPour(banque, goblet, { materiel: "salle", niveau: 2, motif: "materiel" });
  assert.ok(!m.candidats[0].exo.id.includes("goblet") && !m.candidats[0].materiel.includes("haltères"), "matériel indisponible : d'abord un candidat sans haltères ni kettlebell — " + m.candidats.map(c => c.exo.id + " (" + c.materiel + ")").join(", "));
  const sq = exoDe("squat");
  const rs = M.remplacantsPour(banque, sq, { materiel: "salle", niveau: 2, motif: "prefere", exclure: ["goblet"] });
  assert.ok(rs.candidats.every(c => c.exo.id !== "goblet" && c.exo.id !== "squat"), "exclusions respectées");
  const chaise = M.remplacantPourApp(exoDe("goblet") || goblet, banque.exercices.find(e => e.id === "chaise"), "salle");
  assert.ok(/^3 × 40 s$/.test(chaise.dose) && chaise.duree === 40 && chaise.reps === null && chaise.charge === false, JSON.stringify([chaise.dose, chaise.charge]));
  assert.ok(M.remplacantsPour(banque, { id: "rowing2" }, {}).inconnu, "ancien identifiant hors banque → inconnu");
  const pdc = M.remplacantsPour(banque, exoDe("developpe_couche"), { materiel: ["banc"], niveau: 2, motif: "materiel" });
  assert.ok(pdc.candidats.every(c => M.faisable(banque.exercices.find(e => e.id === c.exo.id), ["banc"])), "faisables avec le matériel réel");
});
test("« Adapter ma séance » — recompression dans l'ordre (isolations, séries, repos), jamais les polyarticulaires ; petite forme = −1 série, charges −10 %, repos préservés", () => {
  const S = progApp.seances.A;
  const a30 = M.adapterSeance(S, { tempsMin: 30, energie: "normal" });
  assert.ok(a30.dureeMin <= 30, `30 min demandées : ${a30.dureeMin}`);
  assert.ok(a30.adaptee.tempsMin === 30 && a30.adaptee.energie === "normal" && a30.adaptee.chargeFacteur === 1);
  const composes = S.exos.filter(e => e.compartiment !== "isolation").map(e => e.id);
  assert.ok(composes.every(id => a30.exos.some(e => e.id === id)), "les polyarticulaires restent");
  assert.ok(a30.exos.length < S.exos.length || a30.exos.some((e, i) => e.series < S.exos.find(x => x.id === e.id).series), "des isolations ou des séries en moins");
  for (const e of a30.exos) { const o = S.exos.find(x => x.id === e.id); assert.ok(e.consigne === o.consigne && e.nom === o.nom && parseInt(e.dose) === e.series, e.id); }
  const petite = M.adapterSeance(S, { tempsMin: S.dureeMin, energie: "petite" });
  for (const e of petite.exos) { const o = S.exos.find(x => x.id === e.id); assert.strictEqual(e.series, Math.max(2, o.series - 1), e.id); assert.strictEqual(e.repos, o.repos, e.id + " repos préservé"); }
  assert.strictEqual(petite.adaptee.chargeFacteur, 0.9);
  assert.ok(petite.gainage.length === S.gainage.length, "le gainage reste à énergie basse si le temps le permet");
  const fond = M.adapterSeance(S, { tempsMin: 200, energie: "fond" });
  assert.deepStrictEqual(fond.exos.map(e => [e.id, e.series, e.repos]), S.exos.map(e => [e.id, e.series, e.repos]), "à fond et sans contrainte de temps : rien ne bouge");
  const vieux = M.adapterSeance({ nom: "Bas", couleur: "#fff", exos: [{ id: "goblet", nom: "Goblet squat", dose: "3 × 10", repos: 120, charge: true }], gainage: true }, { tempsMin: 20 });
  assert.ok(vieux.exos.length === 1 && vieux.exos[0].dose, "un ancien programme (sans compartiment) ne casse pas");
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
    assert.ok(p.limites.some(l => l.compartiment === "tirage_v"), "limite tirage vertical attendue : " + JSON.stringify(p.limites));
    assert.ok(p.avertissements.some(a => /^Sans barre de traction ni élastique, pas de tirage vertical : le dos reste sous-travaillé\.$/.test(a)), "en langage utilisateur : " + p.avertissements.join(" | "));
    assert.strictEqual(verifierRegles(p, banque).length, 0);
  }
  // le poids du corps garde l'hypothèse barre de traction + dips
  const pdc = genererProgramme({ frequence: 4, objectif: "muscler", materiel: "pdc", niveau: 2 }, banque);
  assert.ok(seances(pdc).flatMap(s => s.exercices).some(e => e.id.startsWith("traction")), "pdc : tractions présentes");
  assert.ok(pdc.limites.every(l => l.compartiment === "isolation"), "poids du corps avec barre de traction et dips : les gros mouvements existent tous — " + JSON.stringify(pdc.limites));
  assert.ok(pdc.limites.some(l => /^Sans élastique ni haltères, pas de travail isolé des biceps, épaules latérales, arrière d'épaule : ces muscles ne travaillent que dans les gros mouvements\.$/.test(l.message)), JSON.stringify(pdc.limites));
});
test("convention du matériel : alternatives (n'importe laquelle suffit) et combinaisons « a + b »", () => {
  assert.ok(M.faisable(byId.pallof, ["élastique"]) && !M.faisable(byId.pallof, "halteres"), "Pallof : poulie OU élastique → faisable avec un élastique coché, pas avec le raccourci haltères");
  assert.ok(M.faisable(byId.tirage_ela, ["élastique"]) && M.faisable(byId.traction_assistee, ["élastique"]), "face pull et traction assistée à l'élastique");
  assert.ok(!M.faisable(byId.pallof, "rien") && !M.faisable(byId.pallof, "pdc"));
  assert.ok(M.faisable(byId.hipthrust, "salle") && !M.faisable(byId.hipthrust, "halteres"), "hip thrust : barre + banc, les deux");
  assert.ok(M.faisable(byId.dc_incline, "halteres") && !M.faisable(byId.dc_incline, "pdc"), "développé incliné : haltères + banc");
  assert.ok(M.faisable(byId.traction, "pdc") && !M.faisable(byId.traction, "halteres") && M.faisable(byId.traction, ["barre de traction"]) && !M.faisable(byId.traction, "rien"), "traction : barre de traction explicite");
  assert.ok(M.faisable(byId.dips, "pdc") && !M.faisable(byId.dips, "halteres") && !M.faisable(byId.dips, "rien"), "dips : barres de dips");
  assert.ok(!M.faisable(byId.roulette, "pdc") && !M.faisable(byId.legcurl_ballon, "rien"), "roulette et ballon sont du matériel");
  assert.ok(M.faisable(byId.bulgare, "rien") && M.faisable(byId.stepup, "rien"), "bulgares et step-up existent au poids du corps");
  const TAGS = new Set(["poids du corps", "haltères", "kettlebell", "machine", "barre", "élastique", "poulie", "banc", "barres de dips", "barre de traction", "roulette", "ballon", "trap bar", "rack", "tapis / machine cardio", "aucun", "rouleau"]);
  for (const e of banque.exercices) for (const alt of e.materiel) for (const t of alt.split(" + ")) assert.ok(TAGS.has(t), `${e.id} : tag « ${t} » inconnu (dans « ${alt} »)`);
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

console.log("\n=== audit de la banque (règle 12) ===");
test("chaque combinaison compartiment × matériel × niveau est auditée ; les trous sont listés, pas comblés", () => {
  const audit = M.auditerBanque(banque);
  const groupes = new Set(audit.map(l => l.nom));
  assert.strictEqual(audit.length, groupes.size * M.MATERIELS.length * 3, "une ligne par combinaison");
  assert.ok(groupes.has("Squat (s'accroupir)") && groupes.has("Isolations · biceps") && groupes.has("Cardio et mobilité · cardio"), [...groupes].join(", "));
  for (const l of audit) {
    assert.ok(Number.isInteger(l.disponibles) && l.disponibles >= 0);
    if (l.disponibles === 0) assert.ok((l.trou || l.limite) && l.remplacants === null && l.isole === null, JSON.stringify(l));
    else { assert.ok(l.isole && byId[l.isole.id], JSON.stringify(l)); assert.strictEqual(l.trou, l.remplacants < 2, JSON.stringify(l)); }
    if (l.disponibles > 0) assert.ok(l.remplacants <= l.disponibles - 1, JSON.stringify(l));
  }
  // ce que l'on sait de la banque : le squat en salle n'est pas un trou, le tirage vertical sans rien en est un
  assert.ok(audit.filter(l => l.nom === "Squat (s'accroupir)" && l.materiel === "salle").every(l => !l.trou));
  assert.ok(audit.filter(l => l.nom === "Tirage vertical" && l.materiel === "rien").every(l => l.disponibles === 0));
  // le remplaçant compté est bien celui de la règle 12 (même compartiment, même muscle, ≤ 1 cran)
  for (const l of audit.filter(x => x.isole && x.compartiment !== "cardio_mobilite")) {
    const r = remplacerExercice(banque, l.isole.id, { materiel: l.materiel, niveau: l.niveau });
    assert.strictEqual(l.remplacants, r.approximatif === null ? r.candidats.length : 0, `${l.nom} ${l.materiel} n${l.niveau} : ${l.isole.id}`);
  }
  // limites physiques : hors salle, aucun exercice à aucun niveau — signalées, pas comptées comme trous
  const limites = audit.filter(x => x.limite);
  assert.ok(limites.length && limites.every(x => !x.trou && x.disponibles === 0 && x.materiel !== "salle"));
  assert.ok(audit.filter(x => x.nom === "Isolations · biceps" && x.materiel === "rien").every(x => x.limite));
  assert.ok(audit.filter(x => x.nom === "Tirage vertical" && x.materiel === "rien").every(x => x.limite));
  assert.ok(!audit.some(x => x.limite && x.materiel === "salle"));
  const trous = audit.filter(x => x.trou);
  console.log(`      ${trous.length} trous sur ${audit.length} combinaisons, ${limites.length} limites physiques mises à part — voir MOTEUR.md, « Trous de la banque »`);
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
  haut.exercices[0] = M.exerciceProgramme(byId.pompes_genoux, { series: 4, reps: [8, 12], repos_s: 120 });
  assert.ok(verifierRegles(p3, banque).some(x => x.regle === 7 && /Pompes sur les genoux/.test(x.message)), JSON.stringify(verifierRegles(p3, banque)));
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
