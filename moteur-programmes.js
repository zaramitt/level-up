/* Moteur de génération de programmes — chantier Programmes, étape 2.
   Fonction pure, sans IA, sans réseau, sans état : mêmes entrées → même
   programme. NON branché à l'interface ni à /generer (étape 3).
   Implémente les squelettes 1× à 7× et les règles 1 à 12 de DECISIONS.md.
   Chargeable en Node (module.exports) et dans le navigateur (window.Moteur). */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.Moteur = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Vocabulaire                                                        */
  /* ------------------------------------------------------------------ */
  const R = { lourd: [5, 8], moyen: [8, 12], leger: [12, 15], long: [15, 20] };
  // règle 5 : repos par fourchette de reps
  const reposDe = (reps, isolation) => reps[1] <= 6 ? 180 : reps[0] >= 12 || isolation ? (reps[0] >= 15 ? 60 : 90) : 120;
  const PLANCHER_REPOS = { compose: 90, isolation: 45 };

  // gros groupes (règles 3 et 4)
  // fessiers et ischio-jambiers comptés séparément, comme le fait le consensus 10-20 séries/muscle
  const GROS_GROUPES = ["quadriceps", "fessiers", "ischio-jambiers", "pectoraux", "dos", "épaules"];
  const MUSCLE_VERS_GROS = {
    quadriceps: "quadriceps", adducteurs: "quadriceps",
    fessiers: "fessiers", abducteurs: "fessiers", "ischio-jambiers": "ischio-jambiers", "chaîne postérieure": "ischio-jambiers",
    pectoraux: "pectoraux", "haut des pectoraux": "pectoraux",
    "dos (grand dorsal)": "dos", "haut du dos": "dos", trapèzes: "dos", "arrière d'épaule": "dos",
    épaules: "épaules", "épaules latérales": "épaules", "avant d'épaule": "épaules"
  };
  const COMP_VERS_GROS = { squat: "quadriceps", unilateral: "quadriceps", hinge: "ischio-jambiers", poussee_h: "pectoraux", poussee_v: "épaules", tirage_h: "dos", tirage_v: "dos" };
  // le muscle principal de la banque d'abord, le compartiment en repli ; ni le gainage
  // ni le cardio / la mobilité ne sont des gros groupes (règles 3 et 4 = force)
  const grosGroupe = e => e.compartiment === "cardio_mobilite" || e.compartiment === "gainage" ? null : MUSCLE_VERS_GROS[e.muscle] || COMP_VERS_GROS[e.compartiment] || null;
  const grosSecondaires = e => e.compartiment === "cardio_mobilite" || e.compartiment === "gainage" ? [] : (e.secondaires || []).map(m => MUSCLE_VERS_GROS[m]).filter(Boolean);
  // groupes « travaillés » par un exercice : principal + secondaires (un squat travaille les fessiers)
  const groupesDe = e => new Set([grosGroupe(e), ...grosSecondaires(e)].filter(Boolean));
  const COMPOSES = ["squat", "hinge", "poussee_h", "poussee_v", "tirage_h", "tirage_v", "unilateral"];
  // règle 2 : gros exercices d'abord
  const ORDRE_COMP = { squat: 0, hinge: 1, poussee_h: 2, tirage_h: 3, poussee_v: 4, tirage_v: 5, unilateral: 6, isolation: 10, gainage: 20, cardio_mobilite: 30 };

  // matériel : « salle » (tout), « halteres » (haltères, banc, poids du corps), « pdc » (poids du corps)
  const MATERIEL_OK = {
    salle: null,
    halteres: new Set(["haltères", "poids du corps", "banc", "aucun", "kettlebell", "élastique"]),
    pdc: new Set(["poids du corps", "aucun"])
  };
  // un exercice est faisable si son matériel principal (premier de la liste) est disponible, ou s'il
  // existe en version poids du corps. Le cardio sur machine n'est faisable qu'en salle.
  const faisable = (e, materiel) => {
    const ok = MATERIEL_OK[materiel];
    if (ok === null || ok === undefined) return true;
    if (e.compartiment === "cardio_mobilite") return e.materiel.some(m => ok.has(m) || m === "rouleau" || m === "élastique");
    return ok.has(e.materiel[0]) || (e.materiel.includes("poids du corps") && ok.has("poids du corps"));
  };

  /* ------------------------------------------------------------------ */
  /* Focus (règle 1) : compartiments et muscles autorisés, cases à remplir */
  /* ------------------------------------------------------------------ */
  const ISO_HAUT = ["biceps", "triceps", "épaules latérales", "arrière d'épaule"];
  const ISO_BAS = ["fessiers", "ischio-jambiers", "abducteurs", "mollets"];
  const FOCUS = {
    fullA: { nom: "Full body A", comp: [...COMPOSES, "isolation", "gainage"], iso: [...ISO_HAUT, ...ISO_BAS],
      cases: [{ c: "squat" }, { c: "poussee_h" }, { c: "tirage_h" }, { c: "hinge" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    fullB: { nom: "Full body B", comp: [...COMPOSES, "isolation", "gainage"], iso: [...ISO_HAUT, ...ISO_BAS],
      cases: [{ c: "hinge" }, { c: "poussee_v" }, { c: "tirage_v" }, { c: "unilateral" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    fullC: { nom: "Full body C", comp: [...COMPOSES, "isolation", "gainage"], iso: [...ISO_HAUT, ...ISO_BAS],
      cases: [{ c: "unilateral" }, { c: "poussee_h" }, { c: "tirage_h" }, { c: "squat" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    haut: { nom: "Haut du corps", comp: ["poussee_h", "poussee_v", "tirage_h", "tirage_v", "isolation", "gainage"], iso: ISO_HAUT,
      cases: [{ c: "poussee_h" }, { c: "tirage_h" }, { c: "poussee_v" }, { c: "tirage_v" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    bas: { nom: "Bas du corps", comp: ["squat", "hinge", "unilateral", "isolation", "gainage"], iso: ISO_BAS,
      cases: [{ c: "squat" }, { c: "hinge" }, { c: "unilateral" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    push: { nom: "Push (poussée)", comp: ["poussee_h", "poussee_v", "isolation", "gainage"], iso: ["triceps", "épaules latérales"],
      cases: [{ c: "poussee_h" }, { c: "poussee_v" }, { c: "poussee_h" }, { c: "isolation", m: ["triceps"] }, { c: "isolation", m: ["épaules latérales"] }, { c: "isolation" }, { c: "gainage" }] },
    pull: { nom: "Pull (tirage)", comp: ["tirage_h", "tirage_v", "isolation", "gainage"], iso: ["biceps", "arrière d'épaule"],
      cases: [{ c: "tirage_v" }, { c: "tirage_h" }, { c: "tirage_h" }, { c: "isolation", m: ["arrière d'épaule"] }, { c: "isolation", m: ["biceps"] }, { c: "isolation" }, { c: "gainage" }] },
    legs: { nom: "Legs (jambes)", comp: ["squat", "hinge", "unilateral", "isolation", "gainage"], iso: ISO_BAS,
      cases: [{ c: "squat" }, { c: "hinge" }, { c: "unilateral" }, { c: "isolation", m: ["fessiers"] }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    focusBas: { nom: "Focus bas du corps", comp: ["hinge", "unilateral", "squat", "isolation", "gainage"], iso: ISO_BAS,
      cases: [{ c: "hinge" }, { c: "unilateral" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    focusHaut: { nom: "Focus haut du corps", comp: ["poussee_h", "tirage_h", "poussee_v", "tirage_v", "isolation", "gainage"], iso: ISO_HAUT,
      cases: [{ c: "poussee_h" }, { c: "tirage_h" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    recup: { nom: "Récupération active", comp: ["cardio_mobilite"], iso: [],
      cases: [{ c: "cardio_mobilite", type: "cardio", duree: 1200 }, { c: "cardio_mobilite", type: "mobilite" }, { c: "cardio_mobilite", type: "mobilite" }, { c: "cardio_mobilite", type: "mobilite" }] }
  };
  const appartientAuFocus = (e, focus) => {
    const f = FOCUS[focus];
    if (!f) return false;
    if (!f.comp.includes(e.compartiment)) return false;
    if (e.compartiment === "isolation" && !f.iso.includes(e.muscle)) return false;
    return true;
  };
  // gros groupes touchés par un focus (pour le placement, règle 4)
  const groupesDuFocus = focus => new Set(FOCUS[focus].comp.map(c => COMP_VERS_GROS[c]).filter(Boolean).concat(FOCUS[focus].iso.map(m => MUSCLE_VERS_GROS[m]).filter(Boolean)));

  /* ------------------------------------------------------------------ */
  /* Squelettes par fréquence                                           */
  /* ------------------------------------------------------------------ */
  const SQUELETTES = {
    1: { nom: "fullbody-1", description: "1 séance full body", seances: ["fullA"] },
    2: { nom: "fullbody-AB", description: "2 séances full body A et B", seances: ["fullA", "fullB"] },
    3: { nom: "fullbody-ABC", description: "3 séances full body A, B et C", seances: ["fullA", "fullB", "fullC"] },
    4: { nom: "haut-bas-x2", description: "haut / bas, deux fois", seances: ["haut", "bas", "haut", "bas"] },
    5: { nom: "haut-bas-x2-focus", description: "haut / bas deux fois + un jour focus (objectif ou sport)", seances: ["haut", "bas", "haut", "bas", "focus"] },
    6: { nom: "push-pull-legs-x2", description: "push / pull / legs, deux fois", seances: ["push", "pull", "legs", "push", "pull", "legs"] },
    7: { nom: "push-pull-legs-x2-recup", description: "push / pull / legs deux fois + un jour de récupération active (mobilité, cardio léger) — jamais une 7e séance de force", seances: ["push", "pull", "legs", "push", "pull", "legs", "recup"] }
  };

  /* ------------------------------------------------------------------ */
  /* Objectifs (règle 11) et sports (règle 10) : des modificateurs      */
  /* ------------------------------------------------------------------ */
  const OBJECTIFS = {
    tonifier: { nom: "Me tonifier", prioritaires: ["fessiers", "ischio-jambiers", "abducteurs", "chaîne postérieure"], cote: "bas", reps: "moyen", repsIso: "leger" },
    poids: { nom: "Perdre du poids", prioritaires: [], cote: null, reps: "leger", repsIso: "long" },
    muscler: { nom: "Me muscler", prioritaires: ["pectoraux", "dos (grand dorsal)", "épaules", "triceps", "biceps"], cote: "haut", reps: "moyen", repsIso: "leger" },
    mieux: { nom: "Me sentir mieux", prioritaires: [], cote: null, reps: "moyen", repsIso: "leger" },
    douce: { nom: "Reprendre en douceur", prioritaires: [], cote: null, reps: "leger", repsIso: "leger", difficulteMax: 1, seriesMax: 3 },
    force: { nom: "Force", prioritaires: [], cote: null, reps: "lourd", repsIso: "moyen" }
  };
  /* POINT D'EXTENSION (IA, étape ultérieure) : interpréter un objectif en texte
     libre. Aujourd'hui : quelques mots-clés déterministes, sinon « mieux ».
     Contrat à conserver : (texte) → { base: clé d'OBJECTIFS, prioritaires: [muscles] }. */
  const interpreterObjectifLibre = texte => {
    const t = (texte || "").toLowerCase();
    if (/\bforce\b|plus forte?\b|soulever plus lourd|1rm/.test(t)) return { base: "force", prioritaires: [] };
    if (/fessier|fesse|galbe/.test(t)) return { base: "tonifier", prioritaires: ["fessiers"] };
    if (/bras|épaule|pec|dos\b|haut du corps/.test(t)) return { base: "muscler", prioritaires: [] };
    if (/maigrir|gras|poids|sèche|seche/.test(t)) return { base: "poids", prioritaires: [] };
    if (/douceur|reprise|blessure|doux/.test(t)) return { base: "douce", prioritaires: [] };
    return { base: "mieux", prioritaires: [] };
  };
  const SPORTS = {
    course: { nom: "Course à pied", prioritaires: ["ischio-jambiers", "fessiers", "mollets", "chaîne postérieure"], unilateral: true, cote: "bas" },
    cyclisme: { nom: "Cyclisme", prioritaires: ["quadriceps", "fessiers", "chaîne postérieure"], unilateral: true, cote: "bas" },
    natation: { nom: "Natation", prioritaires: ["dos (grand dorsal)", "épaules", "arrière d'épaule", "triceps"], unilateral: false, cote: "haut" },
    football: { nom: "Football", prioritaires: ["ischio-jambiers", "fessiers", "adducteurs", "quadriceps"], unilateral: true, cote: "bas" },
    tennis: { nom: "Tennis & padel", prioritaires: ["arrière d'épaule", "épaules", "fessiers", "obliques"], unilateral: true, cote: null },
    rugby: { nom: "Rugby", prioritaires: ["chaîne postérieure", "dos (grand dorsal)", "quadriceps", "pectoraux"], unilateral: false, cote: null },
    basket: { nom: "Basket & handball", prioritaires: ["quadriceps", "fessiers", "mollets", "épaules"], unilateral: true, cote: "bas" },
    escalade: { nom: "Escalade", prioritaires: ["dos (grand dorsal)", "biceps", "arrière d'épaule", "avant-bras"], unilateral: false, cote: "haut" },
    frappe: { nom: "Sports de frappe", prioritaires: ["obliques", "épaules", "chaîne postérieure", "mollets"], unilateral: true, cote: null },
    prehension: { nom: "Sports de préhension", prioritaires: ["dos (grand dorsal)", "chaîne postérieure", "biceps", "obliques"], unilateral: false, cote: null },
    mma: { nom: "MMA", prioritaires: ["chaîne postérieure", "dos (grand dorsal)", "obliques", "épaules"], unilateral: true, cote: null },
    equitation: { nom: "Équitation", prioritaires: ["adducteurs", "fessiers", "abducteurs", "dos (grand dorsal)"], unilateral: true, cote: "bas" },
    danse: { nom: "Danse", prioritaires: ["fessiers", "abducteurs", "mollets", "obliques"], unilateral: true, cote: "bas" },
    yoga: { nom: "Yoga & pilates", prioritaires: ["dos (grand dorsal)", "pectoraux", "fessiers", "épaules"], unilateral: false, cote: null }
  };

  /* ------------------------------------------------------------------ */
  /* Niveau observé (règle 7) et échelle (règle 9)                      */
  /* ------------------------------------------------------------------ */
  const NIVEAU = {
    1: { difficulteMax: 1, echelle: "simple", nbExos: [4, 5], seriesCompose: 3, seriesIso: 2, volumeMin: 6, volumeMax: 12 },
    2: { difficulteMax: 2, echelle: "phare", nbExos: [5, 6], seriesCompose: 3, seriesIso: 3, volumeMin: 8, volumeMax: 16 },
    3: { difficulteMax: 3, echelle: "avance", nbExos: [6, 7], seriesCompose: 4, seriesIso: 3, volumeMin: 10, volumeMax: 20 }
  };

  /* ------------------------------------------------------------------ */
  /* Sélection d'un exercice pour une case                              */
  /* ------------------------------------------------------------------ */
  const scoreExo = (e, ctx, cas) => {
    let s = 0;
    // règle 9 : la version qui correspond au niveau
    if (ctx.obj.reps === "lourd" && COMPOSES.includes(e.compartiment)) { if (e.echelle === "phare") s += 32; else if (e.echelle === "avance") s += 22; else s += 4; }
    else if (e.echelle === ctx.niv.echelle) s += 30; else if (e.echelle === "phare") s += 18; else if (ctx.niveau === 3 && e.echelle === "avance") s += 20;
    // difficulté proche du niveau
    s -= Math.abs(e.difficulte - ctx.niveau) * 6;
    // la version simple qui mène droit au phare du compartiment (goblet → squat barre)
    if (e.monte_vers && ctx.phares.has(e.monte_vers)) s += 8;
    // déjà éprouvé dans les programmes de l'app
    if (e.existant) s += 3;
    // un polyarticulaire en répétitions plutôt qu'en isométrie (la chaise n'est pas « le squat »)
    if (COMPOSES.includes(e.compartiment) && e.reps) s += 4;
    // muscles prioritaires (règles 10-11)
    if (ctx.prioritaires.includes(e.muscle)) s += 14;
    if ((e.secondaires || []).some(m => ctx.prioritaires.includes(m))) s += 4;
    if (cas.m && cas.m.includes(e.muscle)) s += 25;
    // variation dans la semaine : pas deux fois le même exercice, ni deux fois le même muscle d'isolation dans la séance
    if (ctx.dejaSemaine.has(e.id)) s -= 22;
    if (e.compartiment === "isolation" && ctx.musclesSeance.has(e.muscle)) s -= 40;
    if (ctx.dejaSeance.has(e.id)) s -= 1000;
    // unilatéral demandé par le sport
    if (ctx.unilateral && e.unilateral) s += 5;
    return s;
  };
  const choisir = (banque, cas, focus, ctx) => {
    const f = FOCUS[focus];
    let cands = banque.exercices.filter(e => e.compartiment === cas.c && faisable(e, ctx.materiel) && e.difficulte <= ctx.difficulteMax);
    if (cas.c === "isolation") cands = cands.filter(e => f.iso.includes(e.muscle));
    if (cas.c === "cardio_mobilite") cands = cands.filter(e => e.type === cas.type);
    if (cas.m) { const m = cands.filter(e => cas.m.includes(e.muscle)); if (m.length) cands = m; }
    cands = cands.filter(e => !ctx.dejaSeance.has(e.id));
    if (!cands.length) return null;
    cands.sort((a, b) => scoreExo(b, ctx, cas) - scoreExo(a, ctx, cas) || a.id.localeCompare(b.id));
    return cands[0];
  };

  /* ------------------------------------------------------------------ */
  /* Séries × reps, repos, durée (règles 5 et 6)                        */
  /* ------------------------------------------------------------------ */
  const exerciceProgramme = (e, dose) => ({
    id: e.id, nom: e.nom, compartiment: e.compartiment, muscle: e.muscle, secondaires: e.secondaires || [], difficulte: e.difficulte, echelle: e.echelle,
    unilateral: !!e.unilateral, consigne: e.consigne, erreur: e.erreur, demo: e.demo, materiel: e.materiel,
    series: dose.series, reps: dose.reps || null, duree_s: dose.duree_s || null, repos_s: dose.repos_s
  });
  const doser = (e, ctx) => {
    if (e.compartiment === "cardio_mobilite") return { series: 1, duree_s: ctx.dureeCardio && e.type === "cardio" ? ctx.dureeCardio : e.duree_s, repos_s: 0 };
    if (e.compartiment === "gainage") return { series: 3, reps: e.reps || null, duree_s: e.duree_s || null, repos_s: 45 };
    const iso = e.compartiment === "isolation";
    if (!e.reps && e.duree_s) return { series: iso ? ctx.niv.seriesIso : ctx.niv.seriesCompose, duree_s: e.duree_s, repos_s: 60 };
    const compose = COMPOSES.includes(e.compartiment);
    let reps = iso ? R[ctx.obj.repsIso] : e.echelle === "phare" || e.echelle === "avance" ? (ctx.obj.reps === "lourd" ? R.lourd : R[ctx.obj.reps]) : R[ctx.obj.reps];
    if (ctx.obj.reps === "lourd" && ctx.niveau === 1) reps = R.moyen; // un débutant ne descend pas sous 8 reps
    if (e.compartiment === "unilateral" && reps[1] < 8) reps = R.moyen;
    // une fourchette spécifique de la banque (négatives 3-5, nordic 3-6, tractions 5-8) l'emporte
    if (e.reps && e.reps[1] <= 8) reps = e.reps;
    let series = iso ? ctx.niv.seriesIso : ctx.niv.seriesCompose;
    if (ctx.obj.seriesMax) series = Math.min(series, ctx.obj.seriesMax);
    if (ctx.obj.reps === "lourd" && compose && e.compartiment !== "unilateral" && (e.echelle === "phare" || e.echelle === "avance") && ctx.niveau === 3) series = 5;
    return { series, reps, repos_s: reposDe(reps, iso) };
  };
  // règle 6 : durée depuis séries et repos, jamais devinée
  const dureeExercice = x => {
    if (x.compartiment === "cardio_mobilite") return x.duree_s;
    const travail = x.duree_s ? x.duree_s + 10 : x.reps[1] * 3 + 15;
    return x.series * travail + Math.max(0, x.series - 1) * x.repos_s + 60; // + 1 min de transition
  };
  const ECHAUFFEMENT_S = 360;
  const dureeSeance = s => Math.ceil((ECHAUFFEMENT_S + s.exercices.reduce((t, x) => t + dureeExercice(x), 0)) / 60);

  // compression pour tenir dans le temps : isolations, puis séries, puis repos jusqu'aux planchers
  // (ordre de DECISIONS.md « Adapter ma séance ») ; jamais les polyarticulaires
  const comprimer = (s, tempsMin, nbMin) => {
    const tient = () => dureeSeance(s) <= tempsMin;
    const forces = () => s.exercices.filter(x => x.compartiment !== "gainage" && x.compartiment !== "cardio_mobilite");
    while (!tient()) {
      const isos = s.exercices.filter(x => x.compartiment === "isolation");
      if (isos.length && forces().length > nbMin) { s.exercices.splice(s.exercices.lastIndexOf(isos[isos.length - 1]), 1); continue; }
      break;
    }
    while (!tient()) {
      const reductible = s.exercices.filter(x => x.compartiment !== "cardio_mobilite" && x.series > 2);
      if (!reductible.length) break;
      reductible[reductible.length - 1].series--;
    }
    while (!tient()) {
      const r = s.exercices.filter(x => x.reps && x.repos_s > (x.compartiment === "isolation" ? PLANCHER_REPOS.isolation : PLANCHER_REPOS.compose));
      if (!r.length) break;
      for (const x of r) x.repos_s = Math.max(x.compartiment === "isolation" ? PLANCHER_REPOS.isolation : PLANCHER_REPOS.compose, x.repos_s - 30);
    }
    // dernier recours : le temps l'emporte sur le nombre minimal d'exercices du niveau —
    // les isolations restantes sautent, puis le gainage ; jamais un polyarticulaire
    while (!tient()) {
      const iso = s.exercices.filter(x => x.compartiment === "isolation");
      if (iso.length) { s.exercices.splice(s.exercices.lastIndexOf(iso[iso.length - 1]), 1); s._sousMinimum = true; continue; }
      const g = s.exercices.findIndex(x => x.compartiment === "gainage");
      if (g >= 0) { s.exercices.splice(g, 1); s._sousMinimum = true; continue; }
      break;
    }
    s._comprimee = true;
    return tient();
  };

  /* ------------------------------------------------------------------ */
  /* Volume hebdomadaire par gros groupe (règle 3)                      */
  /* ------------------------------------------------------------------ */
  const volumeSemaine = seances => {
    const v = Object.fromEntries(GROS_GROUPES.map(g => [g, 0]));
    for (const s of seances) for (const x of s.exercices) {
      if (x.compartiment === "gainage" || x.compartiment === "cardio_mobilite") continue;
      const g = grosGroupe(x); if (g) v[g] += x.series;
      for (const g2 of grosSecondaires(x)) if (g2 !== g) v[g2] += x.series * 0.5;
    }
    for (const g of GROS_GROUPES) v[g] = Math.round(v[g] * 2) / 2;
    return v;
  };

  /* ------------------------------------------------------------------ */
  /* Placement des séances dans la semaine (règle 4, semaine cyclique)   */
  /* ------------------------------------------------------------------ */
  const combinaisons = (n, k) => { const out = []; const rec = (d, acc) => { if (acc.length === k) { out.push(acc.slice()); return; } for (let i = d; i <= n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); } }; rec(1, []); return out; };
  const placer = seances => {
    const k = seances.length;
    const groupes = seances.map(s => new Set(s.exercices.map(grosGroupe).filter(Boolean)));
    let meilleur = null, meilleurScore = -1;
    for (const jours of combinaisons(7, k)) {
      let ok = true, minEcart = 7;
      for (let i = 0; i < k; i++) {
        const j = (i + 1) % k, d1 = jours[i], d2 = jours[j];
        const ecart = j > i ? d2 - d1 : d2 + 7 - d1;
        if (k > 1 && ecart === 1) for (const g of groupes[i]) if (groupes[j].has(g)) { ok = false; break; }
        if (!ok) break;
        minEcart = Math.min(minEcart, ecart);
      }
      if (!ok) continue;
      const score = minEcart * 10 - jours[0]; // étalement maximal, en commençant tôt
      if (score > meilleurScore) { meilleurScore = score; meilleur = jours; }
    }
    return meilleur; // null si impossible
  };

  /* ------------------------------------------------------------------ */
  /* Génération                                                          */
  /* ------------------------------------------------------------------ */
  const genererProgramme = (entrees, banque) => {
    const frequence = Math.max(1, Math.min(7, parseInt(entrees.frequence) || 3));
    const niveau = Math.max(1, Math.min(3, parseInt(entrees.niveau) || 1));
    const niv = NIVEAU[niveau];
    const tempsMin = entrees.tempsMin || 60;
    const materiel = MATERIEL_OK.hasOwnProperty(entrees.materiel) ? entrees.materiel : "salle";
    const avertissements = [];

    // objectif : les 5 de l'onboarding, ou texte libre interprété (point d'extension)
    let objCle = entrees.objectif, prioritaires = [];
    if (!OBJECTIFS[objCle] || objCle === "libre") {
      const i = interpreterObjectifLibre(entrees.objectifLibre);
      objCle = i.base; prioritaires = i.prioritaires.slice();
      if (entrees.objectifLibre) avertissements.push(`Objectif libre « ${entrees.objectifLibre} » interprété comme « ${OBJECTIFS[objCle].nom} » (point d'extension IA non implémenté).`);
    }
    const obj = OBJECTIFS[objCle];
    prioritaires.push(...obj.prioritaires);
    // sport : modificateur seulement si l'intention est de progresser dans ce sport (règle 10)
    const sport = entrees.sport && SPORTS[entrees.sport] ? SPORTS[entrees.sport] : null;
    const intentionSport = !!(sport && entrees.intention === "sport");
    if (intentionSport) prioritaires.push(...sport.prioritaires);
    const difficulteMax = Math.min(niv.difficulteMax, obj.difficulteMax || 3);

    // squelette ; le jour focus du 5× suit le côté dominant (objectif, puis sport)
    const squelette = SQUELETTES[frequence];
    const cote = obj.cote || (intentionSport ? sport.cote : null) || "bas";
    const focusList = squelette.seances.map(f => f === "focus" ? (cote === "haut" ? "focusHaut" : "focusBas") : f);

    const phares = new Set((banque.compartiments || []).map(c => c.phare).filter(Boolean));
    const ctxBase = { niveau, niv, materiel, difficulteMax, obj, prioritaires, phares, unilateral: intentionSport && sport.unilateral, dejaSemaine: new Set() };
    const lettres = "ABCDEFG";
    const seances = focusList.map((focus, i) => {
      const f = FOCUS[focus];
      const ctx = { ...ctxBase, dejaSeance: new Set(), musclesSeance: new Set() };
      const exercices = [];
      let cases = f.cases.slice();
      // règle 7 : nombre d'exercices selon le niveau (les cases d'isolation en trop sautent)
      const nbMax = niv.nbExos[1];
      while (cases.filter(c => c.c !== "gainage" && c.c !== "cardio_mobilite").length > nbMax) {
        const idx = cases.map(c => c.c).lastIndexOf("isolation");
        if (idx < 0) break; cases.splice(idx, 1);
      }
      for (const cas of cases) {
        const e = choisir(banque, cas, focus, ctx);
        if (!e) { avertissements.push(`Séance ${lettres[i]} : aucun exercice faisable pour la case « ${cas.c}${cas.m ? " " + cas.m.join("/") : ""} » avec le matériel « ${materiel} ».`); continue; }
        const dose = doser(e, { ...ctx, dureeCardio: cas.duree });
        exercices.push(exerciceProgramme(e, dose));
        ctx.dejaSeance.add(e.id); ctxBase.dejaSemaine.add(e.id);
        if (e.compartiment === "isolation") ctx.musclesSeance.add(e.muscle);
      }
      // règle 2 : ordre
      exercices.sort((a, b) => ORDRE_COMP[a.compartiment] - ORDRE_COMP[b.compartiment]);
      const s = { lettre: lettres[i], nom: f.nom, focus, exercices, dureeMin: 0 };
      // règle 6 : tenir dans le temps
      if (!comprimer(s, tempsMin, niv.nbExos[0])) avertissements.push(`Séance ${s.lettre} : ${dureeSeance(s)} min même compressée, au-delà des ${tempsMin} min demandées.`);
      s.dureeMin = dureeSeance(s);
      return s;
    });
    // règle 3 : volume hebdomadaire borné par gros groupe — d'abord les séries des
    // isolations du groupe (jamais sous 2), puis celles des polyarticulaires, puis on
    // retire des isolations du groupe tant que la séance garde son minimum d'exercices
    const estForce = x => x.compartiment !== "gainage" && x.compartiment !== "cardio_mobilite";
    let volume = volumeSemaine(seances);
    for (const g of GROS_GROUPES) {
      let garde = 0;
      while (volume[g] > niv.volumeMax && garde++ < 60) {
        const duGroupe = seances.flatMap(s => s.exercices).filter(x => grosGroupe(x) === g);
        const iso = duGroupe.filter(x => x.compartiment === "isolation" && x.series > 2);
        if (iso.length) { iso[iso.length - 1].series--; volume = volumeSemaine(seances); continue; }
        const comp = duGroupe.filter(x => x.compartiment !== "isolation" && x.series > 3).sort((a, b) => (a.echelle === "phare" ? 1 : 0) - (b.echelle === "phare" ? 1 : 0) || b.series - a.series);
        if (comp.length) { comp[0].series--; volume = volumeSemaine(seances); continue; }
        let retire = false;
        for (const s of [...seances].reverse()) {
          const idx = s.exercices.map(x => x.compartiment === "isolation" && grosGroupe(x) === g).lastIndexOf(true);
          if (idx >= 0 && s.exercices.filter(estForce).length > niv.nbExos[0]) { s.exercices.splice(idx, 1); retire = true; break; }
        }
        if (!retire) { avertissements.push(`Volume ${g} : ${volume[g]} séries/semaine au-dessus du maximum ${niv.volumeMax} du niveau ${niveau}, sans isolation à retirer (règle 3).`); break; }
        volume = volumeSemaine(seances);
      }
    }
    for (const g of GROS_GROUPES) if (frequence >= 3 && volume[g] < niv.volumeMin) avertissements.push(`Volume ${g} : ${volume[g]} séries/semaine, sous le minimum ${niv.volumeMin} du niveau ${niveau} (règle 3).`);
    if (frequence <= 2) {
      const sous = GROS_GROUPES.filter(g => volume[g] < niv.volumeMin);
      if (sous.length) avertissements.push(`À ${frequence} séance${frequence > 1 ? "s" : ""} par semaine, le volume minimal de la règle 3 (${niv.volumeMin} séries par muscle) n'est pas atteignable dans ${tempsMin} min : programme d'entretien (${sous.join(", ")} sous le minimum).`);
    }
    for (const s of seances) s.dureeMin = dureeSeance(s);
    // règle 7 : nombre minimal d'exercices (si le matériel ou le temps a fait sauter des cases)
    for (const s of seances) {
      const c = s.exercices.filter(estForce).length;
      if (s.focus !== "recup" && c < niv.nbExos[0]) avertissements.push(`Séance ${s.lettre} : ${c} exercices seulement (minimum ${niv.nbExos[0]} au niveau ${niveau}) — ${s._sousMinimum ? `le temps (${tempsMin} min) l'a emporté sur le nombre d'exercices` : "matériel trop restreint pour ce focus"}.`);
    }

    // règle 4 : placement dans la semaine
    const jours = placer(seances);
    if (!jours) avertissements.push("Aucun placement dans la semaine ne respecte la règle 4 (même gros groupe deux jours consécutifs).");
    const semaine = [];
    for (let d = 1; d <= 7; d++) {
      const i = jours ? jours.indexOf(d) : (d <= seances.length ? d - 1 : -1);
      semaine.push(i >= 0 ? { jour: d, seance: seances[i] } : { jour: d, seance: null });
    }

    return {
      entrees: { frequence, objectif: objCle, objectifLibre: entrees.objectifLibre || "", sport: sport ? entrees.sport : null, intention: intentionSport ? "sport" : "soi", materiel, niveau, tempsMin },
      squelette: { nom: squelette.nom, description: squelette.description },
      semaine, seances, volume, avertissements,
      pointsExtension: [
        "interpreterObjectifLibre(texte) : l'IA choisira les muscles prioritaires depuis un objectif en texte libre (aujourd'hui : mots-clés).",
        "habillage : phrases d'accompagnement par séance et par exercice (nom du programme, mot d'encouragement) — non implémenté, le moteur ne produit que la structure.",
        "supersets : dernier cran de compression de « Adapter ma séance », non implémenté.",
        "finisher : un cardio (perte de gras) ou une mobilité (reprise en douceur) en fin de séance serait une case en plus du squelette — la règle 11 dit que l'objectif colore les cases, il n'en ajoute pas ; à décider avec Léo."
      ]
    };
  };

  /* ------------------------------------------------------------------ */
  /* Règle 12 : remplacement d'un exercice                              */
  /* ------------------------------------------------------------------ */
  const remplacerExercice = (banque, exoId, opts = {}) => {
    const o = banque.exercices.find(e => e.id === exoId);
    if (!o) return { exercice: null, approximatif: null, candidats: [] };
    const materiel = opts.materiel || "salle", niveau = opts.niveau || 2, exclure = new Set([exoId, ...(opts.exclure || [])]);
    const diffMax = opts.niveau ? NIVEAU[niveau].difficulteMax : 3;
    const tri = (a, b) => Math.abs(a.difficulte - o.difficulte) - Math.abs(b.difficulte - o.difficulte) || (faisable(b, materiel) - faisable(a, materiel)) || (a.echelle === o.echelle ? -1 : 0) - (b.echelle === o.echelle ? -1 : 0) || a.id.localeCompare(b.id);
    const base = banque.exercices.filter(e => !exclure.has(e.id) && e.difficulte <= diffMax);
    // même compartiment ET même muscle principal, faisables d'abord
    let cands = base.filter(e => e.compartiment === o.compartiment && e.muscle === o.muscle && faisable(e, materiel)).sort(tri);
    if (cands.length) return { exercice: cands[0], approximatif: null, candidats: cands };
    // sinon même muscle principal dans un autre compartiment, signalé
    cands = base.filter(e => e.muscle === o.muscle && faisable(e, materiel) && e.compartiment !== "cardio_mobilite").sort(tri);
    if (cands.length) return { exercice: cands[0], approximatif: "même muscle, geste différent", candidats: cands };
    return { exercice: null, approximatif: null, candidats: [] };
  };

  /* ------------------------------------------------------------------ */
  /* Vérificateur : les règles, mécaniquement                            */
  /* ------------------------------------------------------------------ */
  const verifierRegles = (prog, banque) => {
    const v = [];
    const seances = prog.semaine.filter(j => j.seance).map(j => j.seance);
    const f = prog.entrees.frequence, niv = NIVEAU[prog.entrees.niveau];
    // squelette
    const attendu = SQUELETTES[f];
    if (!attendu || prog.squelette.nom !== attendu.nom) v.push({ regle: "squelette", message: `squelette ${prog.squelette.nom} au lieu de ${attendu && attendu.nom}` });
    const focusAttendus = attendu ? attendu.seances.map(x => x === "focus" ? /^focus/ : x) : [];
    if (seances.length !== focusAttendus.length) v.push({ regle: "squelette", message: `${seances.length} séances au lieu de ${focusAttendus.length}` });
    else seances.forEach((s, i) => { const a = focusAttendus[i]; if (a instanceof RegExp ? !a.test(s.focus) : s.focus !== a) v.push({ regle: "squelette", message: `séance ${s.lettre} : focus ${s.focus} au lieu de ${a}` }); });
    if (f === 7 && seances[6] && seances[6].exercices.some(e => e.compartiment !== "cardio_mobilite")) v.push({ regle: "7x", message: "de la force le 7e jour" });
    for (const s of seances) {
      for (const e of s.exercices) if (!appartientAuFocus(e, s.focus)) v.push({ regle: 1, message: `${e.nom} hors du focus ${s.focus} (séance ${s.lettre})` });
      const rangs = s.exercices.map(e => ORDRE_COMP[e.compartiment] >= 20 ? 2 : e.compartiment === "isolation" ? 1 : 0);
      for (let i = 1; i < rangs.length; i++) if (rangs[i] < rangs[i - 1]) { v.push({ regle: 2, message: `séance ${s.lettre} : ordre ${s.exercices.map(e => e.compartiment).join(" > ")}` }); break; }
      for (const e of s.exercices) if (e.reps && e.compartiment !== "gainage") { const attendu = reposDe(e.reps, e.compartiment === "isolation"); const okRep = e.reps[1] <= 6 ? e.repos_s === 180 : (e.reps[0] >= 12 || e.compartiment === "isolation") ? e.repos_s >= 60 && e.repos_s <= 90 : e.repos_s === 120; if (!okRep && !(e.repos_s < attendu && e.repos_s >= (e.compartiment === "isolation" ? PLANCHER_REPOS.isolation : PLANCHER_REPOS.compose) && s._comprimee)) v.push({ regle: 5, message: `${e.nom} : ${e.reps.join("-")} reps, repos ${e.repos_s} s` }); }
      if (s.dureeMin !== dureeSeance(s)) v.push({ regle: 6, message: `séance ${s.lettre} : durée affichée ${s.dureeMin}, calculée ${dureeSeance(s)}` });
      if (s.dureeMin > prog.entrees.tempsMin) v.push({ regle: 6, message: `séance ${s.lettre} : ${s.dureeMin} min > ${prog.entrees.tempsMin}` });
      for (const e of s.exercices) if (e.difficulte > niv.difficulteMax) v.push({ regle: 7, message: `${e.nom} difficulté ${e.difficulte} au niveau ${prog.entrees.niveau}` });
      const c = s.exercices.filter(e => e.compartiment !== "gainage" && e.compartiment !== "cardio_mobilite").length;
      if (s.focus !== "recup" && (c < niv.nbExos[0] || c > niv.nbExos[1]) && !prog.avertissements.some(a => a.startsWith(`Séance ${s.lettre} : ${c} exercices`))) v.push({ regle: 7, message: `séance ${s.lettre} : ${c} exercices (attendu ${niv.nbExos.join("-")})` });
      if (prog.entrees.niveau === 1 && s.exercices.some(e => e.echelle === "avance")) v.push({ regle: 9, message: `séance ${s.lettre} : version avancée pour un débutant` });
    }
    // règle 3
    if (f >= 4) for (const g of GROS_GROUPES) { const n = seances.filter(s => s.exercices.some(e => groupesDe(e).has(g))).length; if (n < 2) v.push({ regle: 3, message: `${g} travaillé ${n} fois par semaine` }); }
    const vol = volumeSemaine(seances);
    for (const g of GROS_GROUPES) { if (vol[g] > niv.volumeMax && !prog.avertissements.some(a => a.startsWith(`Volume ${g} : `) && /au-dessus du maximum/.test(a))) v.push({ regle: 3, message: `${g} : ${vol[g]} séries > max ${niv.volumeMax}` }); if (f >= 3 && vol[g] < niv.volumeMin && !prog.avertissements.some(a => a.startsWith(`Volume ${g}`))) v.push({ regle: 3, message: `${g} : ${vol[g]} séries < min ${niv.volumeMin}` }); }
    // règle 4 (cyclique)
    const parJour = {};
    for (const j of prog.semaine) if (j.seance) parJour[j.jour] = new Set(j.seance.exercices.map(grosGroupe).filter(Boolean));
    for (let d = 1; d <= 7; d++) { const a = parJour[d], b = parJour[d === 7 ? 1 : d + 1]; if (!a || !b) continue; for (const g of a) if (b.has(g)) v.push({ regle: 4, message: `${g} les jours ${d} et ${d === 7 ? 1 : d + 1}` }); }
    return v;
  };

  return { genererProgramme, remplacerExercice, verifierRegles, dureeSeance, dureeExercice, appartientAuFocus, faisable, grosGroupe, groupesDe, exerciceProgramme, interpreterObjectifLibre, volumeSemaine, GROS_GROUPES, SQUELETTES, FOCUS, OBJECTIFS, SPORTS, NIVEAU };
});
