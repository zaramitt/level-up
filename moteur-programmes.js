/* Moteur de génération de programmes — chantier Programmes, étape 2.
   Fonction pure, sans IA, sans réseau, sans état : mêmes entrées → même
   programme. NON branché à l'interface ni à /generer (étape 3).
   Implémente les squelettes 1× à 7× et les règles 1 à 12 de DECISIONS.md,
   plus les arbitrages de relecture de l'étape 2 (personnalisation, volume
   direct, matériel « rien », jours de sport, durée exacte).
   Chargeable en Node (module.exports) et dans le navigateur (window.Moteur). */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.Moteur = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Vocabulaire                                                        */
  /* ------------------------------------------------------------------ */
  const R = { force: [3, 6], lourd: [5, 8], moyen: [8, 12], leger: [12, 15], long: [15, 20] };
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
  // pour le volume (règle 3), l'arrière d'épaule est un petit muscle à part : il pèse dans le
  // placement (règle 4, jour pull) mais pas dans le plafond du dos
  const grosGroupeVolume = e => e.muscle === "arrière d'épaule" ? null : grosGroupe(e);
  // groupes « travaillés » par un exercice : principal + secondaires (un squat travaille les fessiers)
  const groupesDe = e => new Set([grosGroupe(e), ...grosSecondaires(e)].filter(Boolean));
  const COMPOSES = ["squat", "hinge", "poussee_h", "poussee_v", "tirage_h", "tirage_v", "unilateral"];
  const estForce = x => x.compartiment !== "gainage" && x.compartiment !== "cardio_mobilite";
  // règle 2 : gros exercices d'abord ; un accessoire (extension lombaire, superman…) passe après les vrais polyarticulaires
  const ORDRE_COMP = { squat: 0, hinge: 1, poussee_h: 2, tirage_h: 3, poussee_v: 4, tirage_v: 5, unilateral: 6, isolation: 10, gainage: 20, cardio_mobilite: 30 };
  const rangOrdre = x => (x.accessoire && COMPOSES.includes(x.compartiment) ? 9 : ORDRE_COMP[x.compartiment]);

  // Le matériel est une LISTE de tags réellement disponibles (à l'étape 3 : cases à cocher dans
  // l'onboarding). Les quatre situations ci-dessous ne sont que des raccourcis pré-cochés :
  // « salle » (tout), « halteres » (haltères et banc), « pdc » (poids du corps, avec barre de traction
  // et barres de dips), « rien » (maison sans équipement). Le poids du corps est toujours disponible.
  const TAGS_MATERIEL = ["haltères", "barre", "banc", "élastique", "kettlebell", "poulie", "machine", "barre de traction", "barres de dips", "roulette", "ballon", "rouleau", "trap bar", "rack", "tapis / machine cardio"];
  const TOUJOURS = ["poids du corps", "aucun"];
  const MATERIEL_OK = {
    salle: null,
    halteres: new Set(["haltères", "banc", ...TOUJOURS]),
    pdc: new Set(["barre de traction", "barres de dips", ...TOUJOURS]),
    rien: new Set(TOUJOURS)
  };
  const MATERIEL_NOM = { salle: "salle complète", halteres: "haltères et banc", pdc: "poids du corps (barre de traction, barres de dips)", rien: "rien du tout (maison sans équipement)" };
  // un raccourci (chaîne) ou une liste de tags → l'ensemble disponible (null = tout)
  const okDe = materiel => Array.isArray(materiel) ? new Set([...materiel.map(String), ...TOUJOURS]) : MATERIEL_OK.hasOwnProperty(materiel) ? MATERIEL_OK[materiel] : null;
  const nomMateriel = materiel => Array.isArray(materiel) ? `matériel coché : ${materiel.join(", ")}` : MATERIEL_NOM[materiel] || MATERIEL_NOM.salle;
  const normaliserMateriel = m => Array.isArray(m) ? [...new Set(m.map(String).filter(t => TAGS_MATERIEL.includes(t)))] : MATERIEL_OK.hasOwnProperty(m) ? m : "salle";
  // convention de la banque : le champ materiel est une liste d'ALTERNATIVES (n'importe laquelle
  // suffit) ; un tag « a + b » est une combinaison obligatoire. Faisable = une alternative dont
  // chaque composant est disponible.
  const tagsDe = alt => alt.split(" + ").map(t => t.trim());
  const faisable = (e, materiel) => {
    const ok = okDe(materiel);
    if (ok === null) return true;
    return e.materiel.some(alt => tagsDe(alt).every(t => ok.has(t)));
  };
  // ce qui manque pour une case vide, en langage utilisateur : les tags absents, du plus courant à la
  // maison au plus « salle »
  const ORDRE_TAGS = ["barre de traction", "élastique", "haltères", "banc", "kettlebell", "barres de dips", "ballon", "roulette", "rouleau", "poulie", "machine", "barre", "trap bar", "rack", "tapis / machine cardio"];
  const manqueDe = (exos, materiel) => {
    const ok = okDe(materiel) || new Set();
    const tags = new Set(exos.flatMap(e => e.materiel.flatMap(tagsDe)).filter(t => !ok.has(t)));
    const l = [...tags].sort((a, b) => (ORDRE_TAGS.indexOf(a) + 1 || 99) - (ORDRE_TAGS.indexOf(b) + 1 || 99)).slice(0, 2);
    return l.length ? l.join(" ni ") : "matériel";
  };
  const CONSEQUENCE = {
    tirage_v: ["tirage vertical", "le dos reste sous-travaillé"], tirage_h: ["tirage horizontal", "le dos reste sous-travaillé"],
    poussee_h: ["poussée horizontale", "les pectoraux restent sous-travaillés"], poussee_v: ["poussée verticale", "les épaules restent sous-travaillées"],
    squat: ["squat", "les cuisses restent sous-travaillées"], hinge: ["charnière de hanche", "l'arrière des cuisses et les fessiers restent sous-travaillés"],
    unilateral: ["travail sur une jambe", "les cuisses et l'équilibre restent sous-travaillés"], gainage: ["gainage", "le tronc reste sous-travaillé"],
    cardio_mobilite: ["cardio ou mobilité", "la séance de récupération est plus courte"]
  };

  /* ------------------------------------------------------------------ */
  /* Focus (règle 1) : compartiments et muscles autorisés, cases à remplir */
  /* ------------------------------------------------------------------ */
  const ISO_HAUT = ["biceps", "triceps", "épaules latérales", "arrière d'épaule"];
  const ISO_BAS = ["fessiers", "ischio-jambiers", "abducteurs", "mollets"];
  const FULL = [...COMPOSES, "isolation", "gainage"];
  // repli : quand une case d'isolation n'a plus de muscle libre dans la séance (jamais deux
  // isolations du même muscle), elle devient un polyarticulaire du focus
  const FOCUS = {
    fullA: { nom: "Full body A", comp: FULL, iso: [...ISO_HAUT, ...ISO_BAS], bas: true,
      cases: [{ c: "squat" }, { c: "poussee_h" }, { c: "tirage_h" }, { c: "hinge" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    fullB: { nom: "Full body B", comp: FULL, iso: [...ISO_HAUT, ...ISO_BAS], bas: true,
      cases: [{ c: "hinge" }, { c: "poussee_v" }, { c: "tirage_v" }, { c: "unilateral" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    fullC: { nom: "Full body C", comp: FULL, iso: [...ISO_HAUT, ...ISO_BAS], bas: true,
      cases: [{ c: "unilateral" }, { c: "poussee_h" }, { c: "tirage_h" }, { c: "squat" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    haut: { nom: "Haut du corps", comp: ["poussee_h", "poussee_v", "tirage_h", "tirage_v", "isolation", "gainage"], iso: ISO_HAUT, bas: false,
      cases: [{ c: "poussee_h" }, { c: "tirage_h" }, { c: "poussee_v" }, { c: "tirage_v" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    bas: { nom: "Bas du corps", comp: ["squat", "hinge", "unilateral", "isolation", "gainage"], iso: ISO_BAS, bas: true,
      cases: [{ c: "squat" }, { c: "hinge" }, { c: "unilateral" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    push: { nom: "Push (poussée)", comp: ["poussee_h", "poussee_v", "isolation", "gainage"], iso: ["triceps", "épaules latérales"], bas: false,
      cases: [{ c: "poussee_h" }, { c: "poussee_v" }, { c: "poussee_h" }, { c: "isolation", m: ["triceps"] }, { c: "isolation", m: ["épaules latérales"] }, { c: "isolation", repli: "poussee_v" }, { c: "gainage" }] },
    pull: { nom: "Pull (tirage)", comp: ["tirage_h", "tirage_v", "isolation", "gainage"], iso: ["biceps", "arrière d'épaule"], bas: false,
      cases: [{ c: "tirage_v" }, { c: "tirage_h" }, { c: "tirage_h" }, { c: "isolation", m: ["arrière d'épaule"] }, { c: "isolation", m: ["biceps"] }, { c: "isolation", repli: "tirage_v" }, { c: "gainage" }] },
    legs: { nom: "Legs (jambes)", comp: ["squat", "hinge", "unilateral", "isolation", "gainage"], iso: ISO_BAS, bas: true,
      cases: [{ c: "squat" }, { c: "hinge" }, { c: "unilateral" }, { c: "isolation", m: ["fessiers"] }, { c: "isolation" }, { c: "isolation" }, { c: "gainage" }] },
    focusBas: { nom: "Focus bas du corps", comp: ["hinge", "unilateral", "squat", "isolation", "gainage"], iso: ISO_BAS, bas: true,
      cases: [{ c: "hinge" }, { c: "unilateral" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation", repli: "squat" }, { c: "gainage" }] },
    focusHaut: { nom: "Focus haut du corps", comp: ["poussee_h", "tirage_h", "poussee_v", "tirage_v", "isolation", "gainage"], iso: ISO_HAUT, bas: false,
      cases: [{ c: "poussee_h" }, { c: "tirage_h" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation" }, { c: "isolation", repli: "poussee_v" }, { c: "gainage" }] },
    recup: { nom: "Récupération active", comp: ["cardio_mobilite"], iso: [], bas: false,
      cases: [{ c: "cardio_mobilite", type: "cardio", duree: 1200 }, { c: "cardio_mobilite", type: "mobilite" }, { c: "cardio_mobilite", type: "mobilite" }, { c: "cardio_mobilite", type: "mobilite" }] }
  };
  const appartientAuFocus = (e, focus) => {
    const f = FOCUS[focus];
    if (!f) return false;
    if (!f.comp.includes(e.compartiment)) return false;
    if (e.compartiment === "isolation" && !f.iso.includes(e.muscle)) return false;
    return true;
  };

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
  // prioritaires : muscles qui pèsent lourd dans le choix ; obligatoires : exercices placés
  // d'office dans chaque séance qui admet leur muscle (remplacés selon matériel et niveau, règle 12),
  // le premier dans une case d'isolation, le suivant en case supplémentaire si le temps le permet
  const OBJECTIFS = {
    tonifier: { nom: "Me tonifier", prioritaires: ["fessiers", "ischio-jambiers", "abducteurs", "chaîne postérieure"], obligatoires: ["hipthrust", "abduction"], cote: "bas", reps: "moyen", repsIso: "leger" },
    poids: { nom: "Perdre du poids", prioritaires: [], obligatoires: [], cote: null, reps: "leger", repsIso: "long" },
    muscler: { nom: "Me muscler", prioritaires: ["pectoraux", "dos (grand dorsal)", "épaules", "épaules latérales", "triceps", "biceps"], obligatoires: [], cote: "haut", reps: "moyen", repsIso: "leger" },
    mieux: { nom: "Me sentir mieux", prioritaires: [], obligatoires: [], cote: null, reps: "moyen", repsIso: "leger" },
    douce: { nom: "Reprendre en douceur", prioritaires: [], obligatoires: [], cote: null, reps: "leger", repsIso: "leger", difficulteMax: 1, seriesMax: 3 },
    // obligatoiresComposes : placé une fois par semaine dans la première case de son compartiment
    force: { nom: "Force", prioritaires: [], obligatoires: [], obligatoiresComposes: ["souleve_terre"], cote: null, reps: "force", repsIso: "moyen" }
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
  // favoris : exercices poussés en avant pour ce sport ; brasMin : isolations de bras réduites
  // au minimum (les cases d'isolation du haut vont aux épaules) ; unilateral : une case
  // d'isolation du bas devient une seconde case unilatérale ; gainage anti-rotation en plus
  const SPORTS = {
    // obligatoires : une entrée = un exercice ou une liste d'alternatives (le premier admissible est pris)
    course: { nom: "Course à pied", prioritaires: ["ischio-jambiers", "fessiers", "mollets", "chaîne postérieure", "abducteurs"], favoris: ["bulgare", "stepup", "planche_laterale", "pallof", "mollets", "nordic", "rdl", "abduction", "clamshell", "legcurl", "legcurl_assis", "glute_ham_raise"], obligatoires: [["nordic", "legcurl", "legcurl_assis", "legcurl_ballon"]], unilateral: true, brasMin: true, antiRotation: true, cote: "bas" },
    cyclisme: { nom: "Cyclisme", prioritaires: ["quadriceps", "fessiers", "chaîne postérieure"], favoris: ["bulgare", "stepup", "planche_laterale"], unilateral: true, brasMin: true, antiRotation: false, cote: "bas" },
    natation: { nom: "Natation", prioritaires: ["dos (grand dorsal)", "épaules", "arrière d'épaule", "triceps"], favoris: ["traction", "tirage_v", "tirage_ela", "pallof"], unilateral: false, brasMin: false, antiRotation: true, cote: "haut" },
    football: { nom: "Football", prioritaires: ["ischio-jambiers", "fessiers", "adducteurs", "quadriceps"], favoris: ["nordic", "bulgare", "fente_laterale", "planche_laterale"], unilateral: true, brasMin: true, antiRotation: true, cote: "bas" },
    tennis: { nom: "Tennis & padel", prioritaires: ["arrière d'épaule", "épaules", "fessiers", "obliques"], favoris: ["pallof", "planche_laterale", "fente_laterale", "tirage_ela"], unilateral: true, brasMin: false, antiRotation: true, cote: null },
    rugby: { nom: "Rugby", prioritaires: ["chaîne postérieure", "dos (grand dorsal)", "quadriceps", "pectoraux"], favoris: ["souleve_terre", "squat", "rowing_barre"], unilateral: false, brasMin: false, antiRotation: false, cote: null },
    basket: { nom: "Basket & handball", prioritaires: ["quadriceps", "fessiers", "mollets", "épaules"], favoris: ["bulgare", "stepup", "mollets", "squat_saut"], unilateral: true, brasMin: true, antiRotation: false, cote: "bas" },
    escalade: { nom: "Escalade", prioritaires: ["dos (grand dorsal)", "biceps", "arrière d'épaule", "avant-bras"], favoris: ["traction", "traction_lestee", "rowing_inverse", "hollow"], unilateral: false, brasMin: false, antiRotation: false, cote: "haut" },
    frappe: { nom: "Sports de frappe", prioritaires: ["obliques", "épaules", "chaîne postérieure", "mollets"], favoris: ["pallof", "planche_laterale", "push_press", "swing"], unilateral: true, brasMin: false, antiRotation: true, cote: null },
    prehension: { nom: "Sports de préhension", prioritaires: ["dos (grand dorsal)", "chaîne postérieure", "biceps", "obliques"], favoris: ["traction", "rowing_barre", "souleve_terre", "pallof"], unilateral: false, brasMin: false, antiRotation: true, cote: null },
    mma: { nom: "MMA", prioritaires: ["chaîne postérieure", "dos (grand dorsal)", "obliques", "épaules"], favoris: ["traction", "souleve_terre", "pallof", "push_press"], unilateral: true, brasMin: false, antiRotation: true, cote: null },
    equitation: { nom: "Équitation", prioritaires: ["adducteurs", "fessiers", "abducteurs", "dos (grand dorsal)"], favoris: ["fente_laterale", "abduction", "planche_laterale"], unilateral: true, brasMin: true, antiRotation: true, cote: "bas" },
    danse: { nom: "Danse", prioritaires: ["fessiers", "abducteurs", "mollets", "obliques"], favoris: ["bulgare", "mollets", "planche_laterale", "abduction"], unilateral: true, brasMin: true, antiRotation: true, cote: "bas" },
    yoga: { nom: "Yoga & pilates", prioritaires: ["dos (grand dorsal)", "pectoraux", "fessiers", "épaules"], favoris: ["traction", "developpe_couche", "hipthrust"], unilateral: false, brasMin: false, antiRotation: false, cote: null }
  };

  /* ------------------------------------------------------------------ */
  /* Niveau observé (règle 7) et échelle (règle 9)                      */
  /* ------------------------------------------------------------------ */
  const NIVEAU = {
    1: { difficulteMax: 1, echelle: "simple", nbExos: [4, 5], seriesCompose: 3, seriesIso: 2, volumeMin: 6, volumeMax: 12 },
    2: { difficulteMax: 2, echelle: "phare", nbExos: [5, 6], seriesCompose: 3, seriesIso: 3, volumeMin: 8, volumeMax: 16 },
    3: { difficulteMax: 3, echelle: "avance", nbExos: [6, 7], seriesCompose: 4, seriesIso: 3, volumeMin: 10, volumeMax: 20 }
  };
  // règle 7 : nombre d'exercices par séance ; en force, un de moins au minimum — les 5 séries
  // des gros mouvements prennent la place, et jamais deux isolations du même muscle
  // (en force, le pull n'a qu'un tirage vertical et un rowing : deux tirages, deux isolations, 4 exercices)
  const nbExosDe = (niveau, objCle, focus) => { const n = NIVEAU[niveau].nbExos; return objCle === "force" ? [Math.max(3, n[0] - (focus === "pull" ? 2 : 1)), n[1]] : n; };
  // une régression (pompes genoux, planche genoux, pistol assisté…) n'a sa place qu'à défaut
  // d'alternative dès le niveau 2 ; au niveau 3, les difficultés 1 non plus
  const tropFacilePour = (e, niveau) => niveau >= 3 ? e.difficulte <= 1 || !!e.regression : niveau === 2 ? !!e.regression : false;
  const tropFacilePourAvance = e => tropFacilePour(e, 3);

  /* ------------------------------------------------------------------ */
  /* Sélection d'un exercice pour une case                              */
  /* ------------------------------------------------------------------ */
  const POIDS = { prioritaire: 40, secondairePrioritaire: 12, favori: 30, unilateralSport: 15, accessoire: -30, dejaSemaine: -22, gainageRepete: -60, isolationRepetee: -40, muscleIsoleSemaine: -15 };
  const scoreExo = (e, ctx, cas) => {
    let s = 0;
    // règle 9 : la version qui correspond au niveau
    if (ctx.obj.reps === "force" && COMPOSES.includes(e.compartiment)) { if (e.echelle === "phare") s += 32; else if (e.echelle === "avance") s += 22; else s += 4; }
    else if (e.echelle === ctx.niv.echelle) s += 30; else if (e.echelle === "phare") s += 18; else if (ctx.niveau === 3 && e.echelle === "avance") s += 20;
    // difficulté proche du niveau
    s -= Math.abs(e.difficulte - ctx.niveau) * 6;
    // la version simple qui mène au phare du compartiment en peu d'étapes (goblet → squat barre : +6 ;
    // tirage élastique → poulie → assistée → négative → traction : 0)
    if (e.echelle === "simple") { const d = ctx.distancePhare(e.id); if (d > 0) s += Math.max(0, 8 - 2 * d); }
    // déjà éprouvé dans les programmes de l'app
    if (e.existant) s += 3;
    // un polyarticulaire en répétitions plutôt qu'en isométrie (la chaise n'est pas « le squat »)
    if (COMPOSES.includes(e.compartiment) && e.reps) s += 4;
    if (e.accessoire) s += POIDS.accessoire;
    // muscles prioritaires (règles 10-11) : l'objectif et le sport pèsent autant l'un que l'autre
    if (ctx.prioritaires.includes(e.muscle)) s += POIDS.prioritaire;
    if ((e.secondaires || []).some(m => ctx.prioritaires.includes(m))) s += POIDS.secondairePrioritaire;
    if (ctx.favoris.has(e.id)) s += POIDS.favori;
    if (cas.m && cas.m.includes(e.muscle)) s += 25;
    // variation dans la semaine : pas deux fois le même exercice ; le gainage tourne d'une séance à l'autre
    if (e.compartiment === "gainage") s += POIDS.gainageRepete * (ctx.compteSemaine[e.id] || 0);
    else if (ctx.dejaSemaine.has(e.id)) s += POIDS.dejaSemaine;
    if (e.compartiment === "isolation" && ctx.musclesSeance.has(e.muscle)) s += POIDS.isolationRepetee;
    // variété des isolations dans la semaine : un muscle déjà isolé cette semaine laisse la place à un autre
    if (e.compartiment === "isolation" && ctx.musclesSemaine.has(e.muscle)) s += POIDS.muscleIsoleSemaine;
    // unilatéral demandé par le sport
    if (ctx.unilateral && e.unilateral) s += POIDS.unilateralSport;
    return s;
  };
  // en force, jamais deux isolations du même muscle dans une séance (dur) ; sinon c'est une pénalité
  const admissible = (e, ctx, focus) => faisable(e, ctx.materiel) && e.difficulte <= ctx.difficulteMax && !ctx.dejaSeance.has(e.id)
    && !(ctx.niveau === 1 && e.coordination) && appartientAuFocus(e, focus)
    && !(e.compartiment === "isolation" && ctx.musclesSeance.has(e.muscle) && (ctx.obj.reps === "force" || ctx.forceUnique));
  const choisir = (banque, cas, focus, ctx) => {
    let cands = banque.exercices.filter(e => e.compartiment === cas.c && admissible(e, ctx, focus));
    if (cas.c === "cardio_mobilite") cands = cands.filter(e => e.type === cas.type);
    // niveau 2 : pas de régression ; niveau 3 : ni difficulté 1 ni régression — sauf absence totale d'alternative
    // (pour une isolation, l'alternative se cherche dans le même muscle : un mollet ne se remplace pas par un hip thrust)
    if (ctx.niveau >= 2) {
      const ok = e => !tropFacilePour(e, ctx.niveau);
      const h = cas.c === "isolation" ? cands.filter(e => ok(e) || !cands.some(x => x.muscle === e.muscle && ok(x))) : cands.filter(ok);
      if (h.length) cands = h;
    }
    // force : jamais un mouvement d'hypertrophie (Arnold press) en polyarticulaire, si un autre existe
    if (ctx.obj.reps === "force" && COMPOSES.includes(cas.c)) { const h = cands.filter(e => !e.hypertrophie); if (h.length) cands = h; }
    // un accessoire n'ouvre jamais une séance, et ne remplit une case de polyarticulaire que faute de mieux
    // (s'il ne reste qu'un accessoire, il est pris mais rangé après les vrais polyarticulaires — jamais en ouverture)
    if (COMPOSES.includes(cas.c)) { const p = cands.filter(e => !e.accessoire); if (p.length) cands = p; }
    if (cas.m) { const m = cands.filter(e => cas.m.includes(e.muscle)); if (m.length) cands = m; }
    if (!cands.length) return cas.repli && ctx.obj.reps !== "force" ? choisir(banque, { ...cas, c: cas.repli, repli: null, m: null }, focus, ctx) : null;
    cands.sort((a, b) => scoreExo(b, ctx, cas) - scoreExo(a, ctx, cas) || a.id.localeCompare(b.id));
    return cands[0];
  };
  // exercice obligatoire de l'objectif : lui-même s'il est admissible, sinon son remplaçant (règle 12)
  const forcer = (banque, id, focus, ctx) => {
    const e = banque.exercices.find(x => x.id === id);
    if (!e) return null;
    if (admissible(e, ctx, focus) && !tropFacilePour(e, ctx.niveau)) return { exercice: e, remplace: false };
    // un remplaçant exact seulement (même compartiment, même muscle) : une case d'isolation ne devient pas un hinge
    const r = remplacerExercice(banque, id, { materiel: ctx.materiel, niveau: ctx.niveau, exclure: [...ctx.dejaSeance] });
    if (r.approximatif !== null) return null;
    const ok = r.candidats.find(c => admissible(c, ctx, focus) && !tropFacilePour(c, ctx.niveau)) || r.candidats.find(c => admissible(c, ctx, focus));
    return ok ? { exercice: ok, remplace: true } : null;
  };

  /* ------------------------------------------------------------------ */
  /* Séries × reps, repos, durée (règles 5 et 6)                        */
  /* ------------------------------------------------------------------ */
  const exerciceProgramme = (e, dose, role) => ({
    id: e.id, nom: e.nom, compartiment: e.compartiment, muscle: e.muscle, secondaires: e.secondaires || [], difficulte: e.difficulte, echelle: e.echelle,
    unilateral: !!e.unilateral, accessoire: !!e.accessoire, regression: !!e.regression, consigne: e.consigne, erreur: e.erreur, demo: e.demo, materiel: e.materiel,
    series: dose.series, reps: dose.reps || null, duree_s: dose.duree_s || null, repos_s: dose.repos_s, role: role || null
  });
  const doser = (e, ctx) => {
    if (e.compartiment === "cardio_mobilite") return { series: 1, duree_s: ctx.dureeCardio && e.type === "cardio" ? ctx.dureeCardio : e.duree_s, repos_s: 0 };
    if (e.compartiment === "gainage") return { series: 3, reps: e.reps || null, duree_s: e.duree_s || null, repos_s: 45 };
    const iso = e.compartiment === "isolation";
    if (!e.reps && e.duree_s) return { series: iso ? ctx.niv.seriesIso : ctx.niv.seriesCompose, duree_s: e.duree_s, repos_s: 60 };
    const compose = COMPOSES.includes(e.compartiment);
    const force = ctx.obj.reps === "force";
    let reps = iso ? R[ctx.obj.repsIso] : R[ctx.obj.reps];
    if (force && compose) reps = e.compartiment === "unilateral" ? R.lourd : R.force; // gros mouvements à 3-6, unilatéral 5-8
    if (force && ctx.niveau === 1) reps = iso ? R.moyen : R.moyen; // un débutant ne descend pas sous 8 reps
    if (e.compartiment === "unilateral" && reps[1] < 8) reps = R.moyen;
    // une fourchette spécifique de la banque (négatives 3-5, nordic 3-6, tractions 5-8) l'emporte ;
    // un accessoire (superman, extension lombaire) garde sa fourchette longue
    if (e.reps && (e.reps[1] <= (force ? 6 : 8) || e.accessoire)) reps = e.reps;
    let series = iso ? ctx.niv.seriesIso : ctx.niv.seriesCompose;
    if (ctx.obj.seriesMax) series = Math.min(series, ctx.obj.seriesMax);
    if (force && compose && e.compartiment !== "unilateral" && (e.echelle === "phare" || e.echelle === "avance") && ctx.niveau >= 2) series = ctx.niveau === 3 ? 5 : 4;
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

  // compression pour tenir dans le temps : la case supplémentaire de l'objectif, puis les isolations
  // (l'obligatoire de l'objectif en dernier), puis séries, puis repos jusqu'aux planchers
  // (ordre de DECISIONS.md « Adapter ma séance ») ; jamais les polyarticulaires
  const comprimer = (s, tempsMin, nbMin) => {
    const tient = () => dureeSeance(s) <= tempsMin;
    const forces = () => s.exercices.filter(estForce);
    const retirer = x => s.exercices.splice(s.exercices.indexOf(x), 1);
    while (!tient()) {
      const extra = s.exercices.filter(x => x.role === "objectif_extra");
      if (!extra.length) break;
      retirer(extra[extra.length - 1]); s._extraRetiree = true;
    }
    // deux gainages (le sien + l'anti-rotation du sport) : le gainage ordinaire saute avant les isolations
    while (!tient()) {
      const g = s.exercices.filter(x => x.compartiment === "gainage");
      if (g.length < 2 || !g.some(x => x.role === "sport")) break;
      retirer(g.find(x => x.role !== "sport"));
    }
    // l'isolation obligatoire de l'objectif (hip thrust) ne saute qu'en tout dernier recours
    while (!tient()) {
      const isos = s.exercices.filter(x => x.compartiment === "isolation" && x.role !== "objectif");
      if (isos.length && forces().length > nbMin) { retirer(isos[isos.length - 1]); continue; }
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
      const iso = s.exercices.filter(x => x.compartiment === "isolation" && x.role !== "objectif");
      if (iso.length) { retirer(iso[iso.length - 1]); s._sousMinimum = true; continue; }
      const g = s.exercices.find(x => x.compartiment === "gainage");
      if (g) { retirer(g); s._sousMinimum = true; continue; }
      const o = s.exercices.find(x => x.role === "objectif");
      if (o) { retirer(o); s._sousMinimum = true; s._objectifRetire = true; continue; }
      break;
    }
    s._comprimee = true;
    return tient();
  };

  /* ------------------------------------------------------------------ */
  /* Volume hebdomadaire par gros groupe (règle 3)                      */
  /* direct : séries où le groupe est le muscle principal (sert au plafond) */
  /* total : + secondaires comptés ½ (sert au minimum)                    */
  /* ------------------------------------------------------------------ */
  const volumeSemaine = seances => {
    const direct = Object.fromEntries(GROS_GROUPES.map(g => [g, 0]));
    const total = Object.fromEntries(GROS_GROUPES.map(g => [g, 0]));
    for (const s of seances) for (const x of s.exercices) {
      if (!estForce(x)) continue;
      const g = grosGroupeVolume(x); if (g) { direct[g] += x.series; total[g] += x.series; }
      for (const g2 of grosSecondaires(x)) if (g2 !== g) total[g2] += x.series * 0.5;
    }
    for (const g of GROS_GROUPES) total[g] = Math.round(total[g] * 2) / 2;
    return { direct, total };
  };

  /* ------------------------------------------------------------------ */
  /* Placement des séances dans la semaine (règle 4, semaine cyclique)   */
  /* ------------------------------------------------------------------ */
  const combinaisons = (n, k) => { const out = []; const rec = (d, acc) => { if (acc.length === k) { out.push(acc.slice()); return; } for (let i = d; i <= n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); } }; rec(1, []); return out; };
  const suivant = d => d === 7 ? 1 : d + 1, precedent = d => d === 1 ? 7 : d - 1;
  // jamais le même gros groupe deux jours de suite (dur) ; jamais de séance un jour de sport (dur) ;
  // ensuite : le moins de jours collés, le bloc le plus court, la semaine plutôt que le week-end,
  // les séances jambes loin des jours de sport
  const placer = (seances, joursSport) => {
    const k = seances.length;
    const groupes = seances.map(s => new Set(s.exercices.map(grosGroupe).filter(Boolean)));
    const jambes = seances.map(s => FOCUS[s.focus] && FOCUS[s.focus].bas);
    const sport = new Set(joursSport);
    let meilleur = null, meilleurScore = -Infinity;
    for (const jours of combinaisons(7, k)) {
      if (jours.some(d => sport.has(d))) continue;
      let ok = true, colles = 0;
      for (let i = 0; i < k; i++) {
        const j = (i + 1) % k, ecart = j > i ? jours[j] - jours[i] : jours[j] + 7 - jours[i];
        if (k > 1 && ecart === 1) { colles++; for (const g of groupes[i]) if (groupes[j].has(g)) { ok = false; break; } }
        if (!ok) break;
      }
      if (!ok) continue;
      const pris = new Set(jours);
      let bloc = 0, cur = 0;
      for (let d = 1; d <= 14; d++) { if (pris.has(((d - 1) % 7) + 1)) { cur++; bloc = Math.max(bloc, cur); } else cur = 0; }
      bloc = Math.min(bloc, k);
      const weekend = jours.filter(d => d >= 6).length;
      let pres = 0;
      jours.forEach((d, i) => { if (jambes[i] && (sport.has(suivant(d)) || sport.has(precedent(d)))) pres++; });
      let minEcart = 7;
      for (let i = 0; i < k; i++) { const j = (i + 1) % k; minEcart = Math.min(minEcart, j > i ? jours[j] - jours[i] : jours[j] + 7 - jours[i]); }
      const score = -colles * 10 - bloc * 10 - weekend * 15 - pres * 25 + (k > 1 ? minEcart * 3 : 0) - jours[0];
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
    // n'importe quel nombre entier de minutes (47, 33…), 15 au moins
    const tempsMin = Math.max(15, Math.round(Number(entrees.tempsMin)) || 60);
    const materiel = normaliserMateriel(entrees.materiel);
    const joursSport = [...new Set((entrees.joursSport || []).map(Number).filter(d => d >= 1 && d <= 7))].sort();
    const avertissements = [], limites = [];

    // objectif : les 5 de l'onboarding, ou texte libre interprété (point d'extension)
    let objCle = entrees.objectif, prioritaires = [];
    if (!OBJECTIFS[objCle] || objCle === "libre") {
      const texte = String(entrees.objectifLibre || "").trim(), it = entrees.interpretation;
      if (it && it.repli) {
        // l'IA a échoué ou répondu hors format : esthétique équilibré, et on le dit
        objCle = "mieux";
        avertissements.push(`Je n'ai pas réussi à lire ton objectif « ${texte} » : programme esthétique équilibré. Tu peux le reformuler dans les réglages.`);
      } else if (it && OBJECTIFS[it.base] && it.base !== "libre") {
        // point d'extension IA : l'objectif en texte libre lu en muscles prioritaires
        objCle = it.base; prioritaires = (it.prioritaires || []).map(String).slice(0, 6);
        avertissements.push(`Ton objectif « ${texte} » a été lu comme « ${OBJECTIFS[objCle].nom} »${prioritaires.length ? ", priorité à " + prioritaires.join(", ") : ""}.`);
      } else {
        const i = interpreterObjectifLibre(texte);
        objCle = i.base; prioritaires = i.prioritaires.slice();
        if (texte) avertissements.push(`Objectif libre « ${texte} » interprété comme « ${OBJECTIFS[objCle].nom} » (mots-clés, sans IA).`);
      }
    }
    const obj = OBJECTIFS[objCle];
    prioritaires.push(...obj.prioritaires);
    // sport : modificateur seulement si l'intention est de progresser dans ce sport (règle 10)
    const sport = entrees.sport && SPORTS[entrees.sport] ? SPORTS[entrees.sport] : null;
    const intentionSport = !!(sport && entrees.intention === "sport");
    if (intentionSport) prioritaires.push(...sport.prioritaires);
    const favoris = new Set(intentionSport ? sport.favoris : []);
    const difficulteMax = Math.min(niv.difficulteMax, obj.difficulteMax || 3);
    if (joursSport.length + frequence > 7) avertissements.push(`${frequence} séances et ${joursSport.length} jours de sport ne tiennent pas dans 7 jours : les jours de sport sont ignorés pour le placement.`);
    const joursSportPlacement = joursSport.length + frequence > 7 ? [] : joursSport;

    // squelette ; le jour focus du 5× suit le côté dominant (objectif, puis sport)
    const squelette = SQUELETTES[frequence];
    const cote = obj.cote || (intentionSport ? sport.cote : null) || "bas";
    const focusList = squelette.seances.map(f => f === "focus" ? (cote === "haut" ? "focusHaut" : "focusBas") : f);

    const phares = new Set((banque.compartiments || []).map(c => c.phare).filter(Boolean));
    const byId = Object.fromEntries(banque.exercices.map(e => [e.id, e]));
    // nombre d'étapes de « monte_vers » jusqu'au phare du compartiment (0 si la chaîne n'y mène pas)
    const distancePhare = id => { let n = 0, cur = byId[id], vus = new Set(); while (cur && cur.monte_vers && !vus.has(cur.id) && n < 9) { vus.add(cur.id); n++; if (phares.has(cur.monte_vers)) return n; cur = byId[cur.monte_vers]; } return 0; };
    const ctxBase = { niveau, niv, materiel, difficulteMax, obj, prioritaires, favoris, phares, distancePhare, unilateral: intentionSport && sport.unilateral, dejaSemaine: new Set(), compteSemaine: {}, musclesSemaine: new Set() };
    const obligatoires = [...obj.obligatoires, ...(intentionSport ? sport.obligatoires || [] : [])].map(o => Array.isArray(o) ? o : [o]);
    const composesAPlacer = (obj.obligatoiresComposes || []).slice();
    const lettres = "ABCDEFG";
    const seances = focusList.map((focus, i) => {
      const f = FOCUS[focus];
      const ctx = { ...ctxBase, dejaSeance: new Set(), musclesSeance: new Set() };
      const exercices = [];
      let cases = f.cases.map(c => ({ ...c }));
      // règle 7 : nombre d'exercices selon le niveau (les cases d'isolation en trop sautent)
      const nbExos = nbExosDe(niveau, objCle, focus);
      const nbMax = nbExos[1];
      const nbForce = () => cases.filter(c => c.c !== "gainage" && c.c !== "cardio_mobilite").length;
      while (nbForce() > nbMax) {
        const idx = cases.map(c => c.c).lastIndexOf("isolation");
        if (idx < 0) break; cases.splice(idx, 1);
      }
      // force : un seul rowing horizontal par séance pull (pas deux fois le même geste)
      if (obj.reps === "force" && focus === "pull") { const i2 = cases.map(c => c.c).lastIndexOf("tirage_h"); if (i2 > cases.map(c => c.c).indexOf("tirage_h")) cases.splice(i2, 1); }
      // règle 10 : le sport modifie les cases — une seconde case unilatérale au bas du corps,
      // les isolations du haut vont aux épaules plutôt qu'aux bras, un gainage anti-rotation en plus
      if (intentionSport && f.bas && sport.unilateral) {
        const idx = cases.map(c => c.c).lastIndexOf("isolation");
        if (idx >= 0 && !cases.some(c => c.c === "unilateral" && c.sport)) cases[idx] = { c: "unilateral", sport: true };
      }
      if (intentionSport && !f.bas && sport.brasMin) for (const c of cases) if (c.c === "isolation" && !c.m) c.m = ["arrière d'épaule", "épaules latérales"];
      if (intentionSport && sport.antiRotation && focus !== "recup") cases.push({ c: "gainage", m: ["obliques"], sport: true });
      // règle 11 : les obligatoires de l'objectif prennent les cases d'isolation ; au-delà, une case
      // supplémentaire par séance si le temps le permet (retirée en premier par la compression)
      let extra = false;
      for (const alts of obligatoires) {
        const e = byId[alts[0]];
        if (!e || !f.iso.includes(e.muscle)) continue;
        const libre = cases.find(c => c.c === "isolation" && !c.force);
        if (libre) { libre.force = alts; libre.m = null; }
        else if (!extra) { cases.push({ c: "isolation", force: alts, extra: true }); extra = true; }
      }
      // polyarticulaires obligatoires (soulevé de terre en force) : la première case du compartiment dans la semaine
      for (const id of composesAPlacer.slice()) {
        const e = byId[id]; if (!e) continue;
        const cas = cases.find(c => c.c === e.compartiment && !c.force);
        if (cas) { cas.force = [id]; cas.compose = true; composesAPlacer.splice(composesAPlacer.indexOf(id), 1); }
      }
      cases[0].ouverture = true;
      for (const cas of cases) {
        let e = null, role = null;
        if (cas.force) {
          let r = null;
          for (const id of cas.force) { r = forcer(banque, id, focus, ctx); if (r) { r.id = id; break; } }
          if (r) { e = r.exercice; role = cas.extra ? "objectif_extra" : "objectif"; if (r.remplace && !ctxBase.dejaSemaine.has(e.id)) avertissements.push(`Séance ${lettres[i]} : ${byId[r.id].nom} remplacé par ${e.nom} (${nomMateriel(materiel)}, niveau ${niveau}, règle 12).`); }
          else if (cas.compose) avertissements.push(`${byId[cas.force[0]].nom} : pas de version adaptée (${nomMateriel(materiel)}, niveau ${niveau}), la case est remplie normalement.`);
        }
        if (!e) e = choisir(banque, cas, focus, ctx);
        if (!e) {
          // case vide faute de matériel : une limite physique, dite en langage utilisateur (une fois par case)
          if (!(cas.force && !cas.compose) && !(cas.c === "isolation" && obj.reps === "force")) {
            // pour une isolation : seuls les muscles sans aucun exercice faisable comptent (pas ceux déjà pris dans la séance)
            const muscles = cas.c === "isolation" ? (cas.m || f.iso).filter(m => !banque.exercices.some(x => x.compartiment === "isolation" && x.muscle === m && faisable(x, materiel))) : null;
            const groupe = banque.exercices.filter(x => x.compartiment === cas.c && (cas.c !== "isolation" || muscles.includes(x.muscle)) && (cas.c !== "cardio_mobilite" || x.type === cas.type));
            if (cas.c !== "isolation" || muscles.length) {
              const manque = manqueDe(groupe, materiel);
              const quoi = cas.c === "isolation" ? [`travail isolé des ${muscles.join(", ")}`, "ces muscles ne travaillent que dans les gros mouvements"] : CONSEQUENCE[cas.c];
              const message = `Sans ${manque}, pas de ${quoi[0]} : ${quoi[1]}.`;
              if (!limites.some(l => l.message === message)) { limites.push({ seance: lettres[i], compartiment: cas.c, muscles, manque, message }); avertissements.push(message); }
            if (cas.force && !cas.compose) { /* obligatoire d'objectif ou de sport sans version faisable : déjà couvert par la limite */ }
            }
          }
          continue;
        }
        const dose = doser(e, { ...ctx, dureeCardio: cas.duree });
        exercices.push(exerciceProgramme(e, dose, role || (cas.sport ? "sport" : null)));
        ctx.dejaSeance.add(e.id); ctxBase.dejaSemaine.add(e.id); ctxBase.compteSemaine[e.id] = (ctxBase.compteSemaine[e.id] || 0) + 1;
        if (e.compartiment === "isolation") { ctx.musclesSeance.add(e.muscle); ctxBase.musclesSemaine.add(e.muscle); }
      }
      // règle 2 : ordre (tri stable : à rang égal, l'ordre des cases)
      exercices.forEach((x, k) => { x._k = k; });
      exercices.sort((a, b) => rangOrdre(a) - rangOrdre(b) || a._k - b._k);
      exercices.forEach(x => { delete x._k; });
      const s = { lettre: lettres[i], nom: f.nom, focus, exercices, dureeMin: 0 };
      // règle 6 : tenir dans le temps
      if (!comprimer(s, tempsMin, nbExos[0])) avertissements.push(`Séance ${s.lettre} : ${dureeSeance(s)} min même compressée, au-delà des ${tempsMin} min demandées.`);
      if (s._objectifRetire) avertissements.push(`Séance ${s.lettre} : même l'exercice obligatoire de l'objectif ne tenait pas dans ${tempsMin} min, retiré en dernier recours.`);
      if (s._extraRetiree) avertissements.push(`Séance ${s.lettre} : la case supplémentaire de l'objectif ne tenait pas dans ${tempsMin} min, retirée.`);
      s.dureeMin = dureeSeance(s);
      return s;
    });
    // règle 3 : plafond hebdomadaire sur les séries DIRECTES par gros groupe — d'abord les séries des
    // isolations du groupe (jamais sous 2), puis celles des polyarticulaires (jamais sous 3), puis on
    // retire des isolations du groupe tant que la séance garde son minimum d'exercices
    let volume = volumeSemaine(seances);
    for (const g of GROS_GROUPES) {
      let garde = 0;
      while (volume.direct[g] > niv.volumeMax && garde++ < 60) {
        const duGroupe = seances.flatMap(s => s.exercices).filter(x => grosGroupeVolume(x) === g);
        const iso = duGroupe.filter(x => x.compartiment === "isolation" && x.series > 2);
        if (iso.length) { iso[iso.length - 1].series--; volume = volumeSemaine(seances); continue; }
        const comp = duGroupe.filter(x => x.compartiment !== "isolation" && x.series > 3).sort((a, b) => (a.echelle === "phare" ? 1 : 0) - (b.echelle === "phare" ? 1 : 0) || b.series - a.series);
        if (comp.length) { comp[0].series--; volume = volumeSemaine(seances); continue; }
        // la seconde case unilatérale ajoutée par le sport peut descendre à 2 séries
        const sportUni = duGroupe.filter(x => x.role === "sport" && x.compartiment === "unilateral" && x.series > 2);
        if (sportUni.length) { sportUni[0].series--; volume = volumeSemaine(seances); continue; }
        let retire = false;
        for (const s of [...seances].reverse()) {
          const idx = s.exercices.map(x => x.compartiment === "isolation" && grosGroupeVolume(x) === g && x.role !== "objectif").lastIndexOf(true);
          if (idx >= 0 && s.exercices.filter(estForce).length > nbExosDe(niveau, objCle, s.focus)[0]) { s.exercices.splice(idx, 1); retire = true; break; }
        }
        if (!retire) { avertissements.push(`Volume ${g} : ${volume.direct[g]} séries directes/semaine au-dessus du maximum ${niv.volumeMax} du niveau ${niveau}, sans isolation à retirer (règle 3).`); break; }
        volume = volumeSemaine(seances);
      }
    }
    // règle 3, minimum : un groupe sous le minimum gagne une série sur son polyarticulaire principal
    // (phare d'abord, 5 séries au plus) tant que la séance tient dans le temps et que rien ne dépasse
    for (const g of GROS_GROUPES) {
      let garde = 0;
      while (frequence >= 3 && volume.total[g] < niv.volumeMin && garde++ < 20) {
        const cands = seances.flatMap(s => s.exercices.filter(x => estForce(x) && grosGroupeVolume(x) === g && x.compartiment !== "isolation" && x.series < Math.min(5, niv.seriesCompose + 1) && !x._bump).map(x => ({ x, s })))
          .sort((a, b) => (b.x.echelle === "phare" ? 1 : 0) - (a.x.echelle === "phare" ? 1 : 0) || a.x.series - b.x.series);
        let fait = false;
        for (const { x, s } of cands) {
          x.series++;
          const v2 = volumeSemaine(seances);
          if (dureeSeance(s) <= tempsMin && GROS_GROUPES.every(h => v2.direct[h] <= niv.volumeMax || v2.direct[h] === volume.direct[h])) { volume = v2; fait = true; x._bump = true; break; }
          x.series--;
        }
        if (!fait) break;
      }
    }
    for (const g of GROS_GROUPES) if (frequence >= 3 && volume.total[g] < niv.volumeMin) avertissements.push(`Volume ${g} : ${volume.total[g]} séries/semaine (secondaires comptés ½), sous le minimum ${niv.volumeMin} du niveau ${niveau} (règle 3).`);
    if (frequence <= 2) {
      const sous = GROS_GROUPES.filter(g => volume.total[g] < niv.volumeMin);
      if (sous.length) avertissements.push(`À ${frequence} séance${frequence > 1 ? "s" : ""} par semaine, le volume minimal de la règle 3 (${niv.volumeMin} séries par muscle) n'est pas atteignable dans ${tempsMin} min : programme d'entretien (${sous.join(", ")} sous le minimum).`);
    }
    for (const s of seances) { s.dureeMin = dureeSeance(s); for (const x of s.exercices) delete x._bump; }
    // règle 7 : nombre minimal d'exercices (si le matériel ou le temps a fait sauter des cases)
    for (const s of seances) {
      const c = s.exercices.filter(estForce).length, nbExos = nbExosDe(niveau, objCle, s.focus);
      if (s.focus !== "recup" && c < nbExos[0]) avertissements.push(`Séance ${s.lettre} : ${c} exercices seulement (minimum ${nbExos[0]} au niveau ${niveau}${objCle === "force" ? " en force" : ""}) — ${s._sousMinimum ? `le temps (${tempsMin} min) l'a emporté sur le nombre d'exercices` : "matériel trop restreint pour ce focus"}.`);
    }

    // règle 4 : placement dans la semaine
    const jours = placer(seances, joursSportPlacement);
    if (!jours) avertissements.push("Aucun placement dans la semaine ne respecte la règle 4 (même gros groupe deux jours consécutifs).");
    const semaine = [];
    for (let d = 1; d <= 7; d++) {
      const i = jours ? jours.indexOf(d) : (d <= seances.length ? d - 1 : -1);
      semaine.push({ jour: d, seance: i >= 0 ? seances[i] : null, sport: joursSport.includes(d) });
    }

    return {
      entrees: { frequence, objectif: objCle, objectifLibre: entrees.objectifLibre || "", sport: sport ? entrees.sport : null, intention: intentionSport ? "sport" : "soi", materiel, niveau, tempsMin, joursSport },
      squelette: { nom: squelette.nom, description: squelette.description },
      semaine, seances, volume, avertissements, limites,
      pointsExtension: [
        "interpreterObjectifLibre(texte) : l'IA choisira les muscles prioritaires depuis un objectif en texte libre (aujourd'hui : mots-clés).",
        "habillage : phrases d'accompagnement par séance et par exercice (nom du programme, mot d'encouragement) — non implémenté, le moteur ne produit que la structure.",
        "supersets : dernier cran de compression de « Adapter ma séance », non implémenté.",
        "finisher : un cardio (perte de gras) ou une mobilité (reprise en douceur) en fin de séance — à décider avec Léo, sur le même principe que la case supplémentaire de l'objectif (ajoutée seulement si le temps le permet)."
      ]
    };
  };

  /* ------------------------------------------------------------------ */
  /* Étape 3 : ce que l'app donne au moteur, et ce qu'elle en reçoit     */
  /* ------------------------------------------------------------------ */
  // les deux questions factuelles de l'onboarding → niveau observé initial (règle 7) :
  // jamais fait de muscu → 1 ; quelques mois → 2 si squat et pompe sont sûrs, sinon 1 ;
  // plus d'un an régulièrement → 3 si sûrs, sinon 2. Le mot « niveau » n'apparaît jamais à l'écran.
  const niveauDepuisQuestions = (muscu, technique) => muscu === "an" ? (technique === "oui" ? 3 : 2) : muscu === "mois" ? (technique === "oui" ? 2 : 1) : 1;
  const REPONSES_DEFAUT = { frequence: 3, objectif: "mieux", objectifLibre: "", muscu: "jamais", technique: "pas_sur", sport: null, intention: "soi", joursSport: [], materiel: "salle", tempsMin: 60, interpretation: null };
  const entreesDepuisReponses = r => {
    const x = { ...REPONSES_DEFAUT, ...(r || {}) };
    // niveauAjuste : ±1 accepté par la personne quand ses ressentis le suggèrent (v20.1), jamais à son insu
    const niveau = Math.max(1, Math.min(3, niveauDepuisQuestions(x.muscu, x.technique) + (parseInt(x.niveauAjuste) || 0)));
    return { frequence: x.frequence, objectif: x.objectif, objectifLibre: x.objectifLibre || "", interpretation: x.interpretation || null, sport: x.sport || null, intention: x.intention || "soi", joursSport: x.joursSport || [], materiel: x.materiel, niveau, tempsMin: x.tempsMin || 60 };
  };
  // forme attendue par l'écran Séance : lettres, exos {id, nom, dose, repos, charge}, gainage en liste
  const PALETTE_APP = ["#FF5C4D", "#3D5AFE", "#2CE5A7", "#FFB020", "#7C5CFF", "#22D3EE", "#C2417A"];
  const doseDe = x => x.compartiment === "cardio_mobilite" ? `${Math.round(x.duree_s / 60)} min` : x.duree_s ? `${x.series} × ${x.duree_s} s` : `${x.series} × ${x.reps[0]}-${x.reps[1]}${x.unilateral ? " / côté" : ""}`;
  // « charge » = il y a une charge à noter en kg : une alternative faisable avec le matériel de la
  // personne qui passe par des poids (haltères, barre, kettlebell, machine, poulie, trap bar)
  const TAGS_CHARGE = new Set(["haltères", "barre", "kettlebell", "machine", "poulie", "trap bar", "rack"]);
  const chargeDe = (x, materiel) => { const ok = okDe(materiel); return (x.materiel || []).some(alt => { const t = tagsDe(alt); return (ok === null || t.every(u => ok.has(u))) && t.some(u => TAGS_CHARGE.has(u)); }); };
  const presenterPourApp = prog => {
    const seances = {};
    prog.seances.forEach((s, i) => {
      const exos = s.exercices.filter(x => x.compartiment !== "gainage").map(x => ({
        id: x.id, nom: x.nom, dose: doseDe(x), repos: x.repos_s || 0, charge: x.compartiment !== "cardio_mobilite" && chargeDe(x, prog.entrees.materiel),
        series: x.series, reps: x.reps || null, duree: x.duree_s || null, unilateral: !!x.unilateral,
        consigne: x.consigne || "", erreur: x.erreur || "", compartiment: x.compartiment, muscle: x.muscle, role: x.role || null
      }));
      const gainage = s.exercices.filter(x => x.compartiment === "gainage").map(g => ({
        id: g.id, nom: g.nom, dose: doseDe(g), duree: g.duree_s || null, reps: g.reps || null, repos: g.repos_s || 45, consigne: g.consigne || "", erreur: g.erreur || ""
      }));
      seances[s.lettre] = { nom: s.nom, couleur: PALETTE_APP[i % PALETTE_APP.length], focus: s.focus, dureeMin: s.dureeMin, exos, gainage };
    });
    const obj = OBJECTIFS[prog.entrees.objectif] || OBJECTIFS.mieux;
    const f = prog.entrees.frequence;
    return {
      nom: `${obj.nom} · ${f} séance${f > 1 ? "s" : ""}`,
      emoji: "",
      desc: `${prog.squelette.description}, ${prog.entrees.tempsMin} min par séance.`,
      lieu: "perso",
      moteur: {
        version: 1, entrees: prog.entrees, squelette: prog.squelette,
        semaine: prog.semaine.map(j => ({ jour: j.jour, lettre: j.seance ? j.seance.lettre : null, sport: !!j.sport })),
        avertissements: prog.avertissements, limites: prog.limites, volume: prog.volume
      },
      seances
    };
  };
  // le tout en un : réponses de l'onboarding → programme pour l'app
  const programmePourApp = (reponses, banque) => presenterPourApp(genererProgramme(entreesDepuisReponses(reponses), banque));

  /* ------------------------------------------------------------------ */
  /* Étape 3 passe 2 (v20.1) : la séance vivante                          */
  /* ------------------------------------------------------------------ */
  // règle 8, double progression : quand toutes les séries de la dernière fois ont touché le haut de
  // la fourchette avec un ressenti facile ou juste, on PROPOSE l'incrément — +2,5 kg haut du corps,
  // +5 kg bas du corps et machines — jamais plus, jamais imposé. Un « trop dur » annule la proposition suivante.
  const HAUT = new Set(["poussee_h", "poussee_v", "tirage_h", "tirage_v"]), ISO_HAUT_M = new Set(ISO_HAUT);
  const surMachine = (x, materiel) => { const ok = okDe(materiel); return (x.materiel || []).some(alt => { const t = tagsDe(alt); return (ok === null || t.every(u => ok.has(u))) && t.includes("machine"); }); };
  const incrementDe = (x, materiel) => (x.compartiment === "isolation" ? ISO_HAUT_M.has(x.muscle) : HAUT.has(x.compartiment)) && !surMachine(x, materiel) ? 2.5 : 5;
  const chargeDeSerie = e => e == null ? 0 : e.kg != null ? Number(e.kg) : Math.max(0, ...(e.series || []).filter(v => v != null && v !== "").map(Number));
  const suggererCharge = (x, histo, materiel) => {
    if (!x || !x.charge || !x.reps || !histo || !histo.length) return null;
    const der = histo[histo.length - 1];
    if (!der || !der.hautFourchette) return null;
    if (der.ressenti === "dur" || der.ressenti == null) return null;
    const base = chargeDeSerie(der);
    if (!(base > 0)) return null;
    const plus = incrementDe(x, materiel);
    return { kg: base + plus, plus, base, reps: x.reps[1], raison: `+${String(plus).replace(".", ",")} kg, tu as tenu ${x.reps[1]} reps partout` };
  };
  // règle 7, niveau observé qui bouge : ressentis sur les GROS exercices (polyarticulaires), du plus ancien au
  // plus récent. Quatre « facile » d'affilée → proposer +1 ; trois « trop dur » sur les six derniers → proposer −1.
  const recalerNiveau = (ressentis, niveau) => {
    const gros = (ressentis || []).filter(r => r && r.compose).slice(-6).map(r => r.r);
    const fin = gros.slice(-4);
    if (niveau < 3 && fin.length === 4 && fin.every(r => r === "facile")) return { sens: 1, message: "On dirait que tu progresses : les gros exercices te paraissent faciles depuis plusieurs séances. On monte d'un cran ?" };
    if (niveau > 1 && gros.filter(r => r === "dur").length >= 3) return { sens: -1, message: "Plusieurs gros exercices t'ont paru trop durs ces derniers temps. On redescend d'un cran, le temps de consolider ?" };
    return null;
  };
  // règle 12 côté app : un exercice remplaçant garde la dose de l'original (séries, reps, repos), sauf
  // si la banque impose la sienne (isométrie, fourchette courte comme les négatives)
  const remplacantPourApp = (orig, cand, materiel) => {
    const iso = !cand.reps && cand.duree_s;
    const reps = iso ? null : cand.reps && cand.reps[1] <= 6 ? cand.reps : orig.reps || cand.reps || [8, 12];
    const x = { compartiment: cand.compartiment, series: orig.series || 3, reps, duree_s: iso ? cand.duree_s : null, unilateral: !!cand.unilateral };
    return {
      id: cand.id, nom: cand.nom, dose: doseDe(x), repos: orig.repos || reposDe(reps || [8, 12], cand.compartiment === "isolation"), charge: chargeDe(cand, materiel),
      series: x.series, reps, duree: x.duree_s, unilateral: x.unilateral, consigne: cand.consigne || "", erreur: cand.erreur || "",
      compartiment: cand.compartiment, muscle: cand.muscle, role: orig.role || null, remplace: orig.remplace || orig.id
    };
  };
  // les 2 à 3 candidats proposés à l'écran : le phare en premier, chacun avec son muscle et son matériel.
  // motif « materiel » : d'abord ceux qui ne demandent pas le matériel de l'original
  const remplacantsPour = (banque, exoApp, opts = {}) => {
    const o = banque.exercices.find(e => e.id === exoApp.id);
    if (!o) return { candidats: [], approximatif: null, inconnu: true };
    const materiel = opts.materiel || "salle";
    const r = remplacerExercice(banque, o.id, { materiel, niveau: opts.niveau || 2, exclure: opts.exclure || [] });
    let cands = r.candidats.slice();
    if (opts.motif === "materiel") {
      const tagsO = new Set(o.materiel.flatMap(tagsDe).filter(t => !TOUJOURS.includes(t)));
      const autres = cands.filter(c => !c.materiel.some(alt => tagsDe(alt).some(t => tagsO.has(t))));
      if (autres.length >= 1) cands = autres.concat(cands.filter(c => !autres.includes(c)));
    }
    cands.sort((a, b) => (b.echelle === "phare" ? 1 : 0) - (a.echelle === "phare" ? 1 : 0));
    return {
      approximatif: r.approximatif,
      candidats: cands.slice(0, 3).map(c => ({ exo: remplacantPourApp(exoApp, c, materiel), muscle: c.muscle, materiel: c.materiel.join(" ou "), phare: c.echelle === "phare", difficulte: c.difficulte }))
    };
  };
  // « Adapter ma séance » : moins de temps ou d'énergie → la séance existe au lieu d'être sautée.
  // Ordre de DECISIONS.md : isolations, séries, repos jusqu'aux planchers, jamais les polyarticulaires.
  // Petite forme : une série de moins, charges suggérées −10 %, repos préservés.
  const adapterSeance = (S, opts = {}) => {
    const tempsMin = Math.max(10, Math.round(Number(opts.tempsMin)) || S.dureeMin || 60);
    const energie = ["fond", "normal", "petite"].includes(opts.energie) ? opts.energie : "normal";
    // un ancien programme n'a ni reps ni durée structurées : on les lit dans la dose (« 3 × 10 », « 3 × 30-45 s »)
    const lireDose = x => { const m = /×\s*(\d+)(?:-(\d+))?\s*(s\b)?/.exec(x.dose || ""); if (!m) return { reps: [8, 12], duree_s: null }; return m[3] ? { reps: null, duree_s: parseInt(m[2] || m[1]) } : { reps: [parseInt(m[1]), parseInt(m[2] || m[1])], duree_s: null }; };
    const interne = (x, gainage) => { const d = x.reps || x.duree ? { reps: x.reps || null, duree_s: x.duree || null } : lireDose(x); return { ...x, compartiment: gainage ? "gainage" : x.compartiment || "inconnu", series: x.series || parseInt(x.dose) || 3, reps: d.reps, duree_s: d.duree_s, repos_s: x.repos || 0, role: x.role || null, _app: x }; };
    const s = { exercices: [...S.exos.map(x => interne(x, false)), ...(Array.isArray(S.gainage) ? S.gainage : []).map(g => interne(g, true))] };
    if (energie === "petite") for (const x of s.exercices) if (estForce(x) && x.compartiment !== "cardio_mobilite") x.series = Math.max(2, x.series - 1);
    const avant = dureeSeance(s);
    const nbMin = Math.min(3, s.exercices.filter(estForce).length);
    const tient = comprimer(s, tempsMin, nbMin);
    const retour = x => ({ ...x._app, series: x.series, repos: x.repos_s, dose: doseDe({ ...x, reps: x.reps, duree_s: x.duree_s }) });
    return {
      ...S,
      exos: s.exercices.filter(x => x.compartiment !== "gainage").map(retour),
      gainage: s.exercices.filter(x => x.compartiment === "gainage").map(retour),
      dureeMin: dureeSeance(s),
      adaptee: { tempsMin, energie, chargeFacteur: energie === "petite" ? 0.9 : 1, avantMin: avant, tient, retires: S.exos.length + (Array.isArray(S.gainage) ? S.gainage.length : 0) - s.exercices.length }
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
    // jamais deux crans de difficulté d'écart : une variation reste une variation
    const base = banque.exercices.filter(e => !exclure.has(e.id) && e.difficulte <= diffMax && Math.abs(e.difficulte - o.difficulte) <= 1);
    // même compartiment ET même muscle principal, faisables d'abord
    let cands = base.filter(e => e.compartiment === o.compartiment && e.muscle === o.muscle && faisable(e, materiel)).sort(tri);
    if (cands.length) return { exercice: cands[0], approximatif: null, candidats: cands };
    // sinon même muscle principal dans un autre compartiment, signalé
    cands = base.filter(e => e.muscle === o.muscle && faisable(e, materiel) && e.compartiment !== "cardio_mobilite").sort(tri);
    if (cands.length) return { exercice: cands[0], approximatif: "même muscle, geste différent", candidats: cands };
    return { exercice: null, approximatif: null, candidats: [] };
  };

  /* ------------------------------------------------------------------ */
  /* Audit de la banque : où la règle 12 manque de candidats            */
  /* ------------------------------------------------------------------ */
  // Pour chaque compartiment (isolations par muscle, cardio / mobilité par type) × matériel × niveau :
  // combien d'exercices sont disponibles, et combien de remplaçants exacts la règle 12 trouve pour le
  // plus isolé d'entre eux. Un « trou » = aucun exercice, ou moins de 2 remplaçants. Le cardio et la
  // mobilité n'ont pas de « même muscle » : on y compte simplement les autres exercices du même type.
  const MATERIELS = ["salle", "halteres", "pdc", "rien"];
  const auditerBanque = banque => {
    const groupes = [];
    for (const c of banque.compartiments) {
      const du = banque.exercices.filter(e => e.compartiment === c.id);
      if (c.id === "isolation") for (const m of [...new Set(du.map(e => e.muscle))]) groupes.push({ compartiment: c.id, nom: `${c.nom} · ${m}`, exos: du.filter(e => e.muscle === m) });
      else if (c.id === "cardio_mobilite") for (const t of ["cardio", "mobilite"]) groupes.push({ compartiment: c.id, nom: `${c.nom} · ${t === "cardio" ? "cardio" : "mobilité"}`, type: t, exos: du.filter(e => e.type === t) });
      else groupes.push({ compartiment: c.id, nom: c.nom, exos: du });
    }
    const lignes = [];
    for (const g of groupes) for (const materiel of MATERIELS) for (let niveau = 1; niveau <= 3; niveau++) {
      const dispo = g.exos.filter(e => faisable(e, materiel) && e.difficulte <= NIVEAU[niveau].difficulteMax);
      let min = null, isole = null;
      for (const e of dispo) {
        let k;
        if (g.type) k = dispo.length - 1;
        else { const r = remplacerExercice(banque, e.id, { materiel, niveau }); k = r.approximatif === null ? r.candidats.length : 0; }
        if (min === null || k < min) { min = k; isole = e; }
      }
      lignes.push({ compartiment: g.compartiment, nom: g.nom, materiel, niveau, disponibles: dispo.length, remplacants: min, isole: isole ? { id: isole.id, nom: isole.nom } : null, trou: !dispo.length || min < 2, limite: false });
    }
    // limite physique : hors salle, aucun exercice à aucun niveau — le mouvement n'existe pas avec ce
    // matériel (isolation des biceps sans charge…). Ce n'est pas un trou à combler : le moteur le dit
    // dans le programme.
    for (const l of lignes) if (l.materiel !== "salle" && lignes.filter(x => x.nom === l.nom && x.materiel === l.materiel).every(x => x.disponibles === 0)) { l.limite = true; l.trou = false; }
    return lignes;
  };

  /* ------------------------------------------------------------------ */
  /* Vérificateur : les règles, mécaniquement                            */
  /* ------------------------------------------------------------------ */
  const verifierRegles = (prog, banque) => {
    const v = [];
    const seances = prog.semaine.filter(j => j.seance).map(j => j.seance);
    const f = prog.entrees.frequence, niveau = prog.entrees.niveau, niv = NIVEAU[niveau], materiel = prog.entrees.materiel;
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
      if (s.exercices[0] && s.exercices[0].accessoire) v.push({ regle: 2, message: `séance ${s.lettre} ouvre sur un accessoire (${s.exercices[0].nom})` });
      for (const e of s.exercices) if (e.reps && e.compartiment !== "gainage") { const attendu = reposDe(e.reps, e.compartiment === "isolation"); const okRep = e.reps[1] <= 6 ? e.repos_s === 180 : (e.reps[0] >= 12 || e.compartiment === "isolation") ? e.repos_s >= 60 && e.repos_s <= 90 : e.repos_s === 120; if (!okRep && !(e.repos_s < attendu && e.repos_s >= (e.compartiment === "isolation" ? PLANCHER_REPOS.isolation : PLANCHER_REPOS.compose) && s._comprimee)) v.push({ regle: 5, message: `${e.nom} : ${e.reps.join("-")} reps, repos ${e.repos_s} s` }); }
      if (s.dureeMin !== dureeSeance(s)) v.push({ regle: 6, message: `séance ${s.lettre} : durée affichée ${s.dureeMin}, calculée ${dureeSeance(s)}` });
      if (s.dureeMin > prog.entrees.tempsMin) v.push({ regle: 6, message: `séance ${s.lettre} : ${s.dureeMin} min > ${prog.entrees.tempsMin}` });
      for (const e of s.exercices) if (e.difficulte > niv.difficulteMax) v.push({ regle: 7, message: `${e.nom} difficulté ${e.difficulte} au niveau ${niveau}` });
      if (niveau === 1) for (const e of s.exercices) { const b = banque.exercices.find(x => x.id === e.id); if (b && b.coordination) v.push({ regle: 7, message: `${e.nom} demande de la coordination, niveau 1` }); }
      if (niveau >= 2 && prog.entrees.objectif !== "douce") for (const e of s.exercices) {
        if (!tropFacilePour(e, niveau) || e.compartiment === "cardio_mobilite") continue;
        const pris = new Set(s.exercices.map(x => x.id));
        const alt = banque.exercices.filter(x => !pris.has(x.id) && x.compartiment === e.compartiment && (e.compartiment !== "isolation" || x.muscle === e.muscle) && x.difficulte <= niv.difficulteMax && faisable(x, materiel) && !tropFacilePour(x, niveau) && appartientAuFocus(x, s.focus));
        if (alt.length) v.push({ regle: 7, message: `${e.nom} (difficulté ${e.difficulte}${e.regression ? ", régression" : ""}) au niveau ${niveau} alors que ${alt[0].nom} existe` });
      }
      const c = s.exercices.filter(estForce).length, extra = s.exercices.filter(e => e.role === "objectif_extra").length, nbExos = nbExosDe(niveau, prog.entrees.objectif, s.focus);
      if (s.focus !== "recup" && (c < nbExos[0] || c > nbExos[1] + extra) && !prog.avertissements.some(a => a.startsWith(`Séance ${s.lettre} : ${c} exercices`))) v.push({ regle: 7, message: `séance ${s.lettre} : ${c} exercices (attendu ${nbExos.join("-")}${extra ? " + " + extra + " d'objectif" : ""})` });
      if (niveau === 1 && s.exercices.some(e => e.echelle === "avance")) v.push({ regle: 9, message: `séance ${s.lettre} : version avancée pour un débutant` });
      const musclesIso = s.exercices.filter(e => e.compartiment === "isolation").map(e => e.muscle);
      if (prog.entrees.objectif === "force" && new Set(musclesIso).size !== musclesIso.length) v.push({ regle: 11, message: `séance ${s.lettre} : deux isolations du même muscle en force (${musclesIso.join(", ")})` });
      for (const e of s.exercices) if (!faisable(banque.exercices.find(x => x.id === e.id) || e, materiel)) v.push({ regle: "materiel", message: `${e.nom} infaisable avec « ${materiel} »` });
    }
    // règle 3
    if (f >= 4) for (const g of GROS_GROUPES) { const n = seances.filter(s => s.exercices.some(e => groupesDe(e).has(g))).length; if (n < 2 && !(prog.limites || []).length) v.push({ regle: 3, message: `${g} travaillé ${n} fois par semaine` }); }
    const vol = volumeSemaine(seances);
    for (const g of GROS_GROUPES) { if (vol.direct[g] > niv.volumeMax && !prog.avertissements.some(a => a.startsWith(`Volume ${g} : `) && /au-dessus du maximum/.test(a))) v.push({ regle: 3, message: `${g} : ${vol.direct[g]} séries directes > max ${niv.volumeMax}` }); if (f >= 3 && vol.total[g] < niv.volumeMin && !prog.avertissements.some(a => a.startsWith(`Volume ${g}`))) v.push({ regle: 3, message: `${g} : ${vol.total[g]} séries < min ${niv.volumeMin}` }); }
    // règle 4 (cyclique) et jours de sport
    const parJour = {};
    for (const j of prog.semaine) if (j.seance) parJour[j.jour] = new Set(j.seance.exercices.map(grosGroupe).filter(Boolean));
    for (let d = 1; d <= 7; d++) { const a = parJour[d], b = parJour[suivant(d)]; if (!a || !b) continue; for (const g of a) if (b.has(g)) v.push({ regle: 4, message: `${g} les jours ${d} et ${suivant(d)}` }); }
    if (prog.entrees.joursSport.length + f <= 7) for (const j of prog.semaine) if (j.seance && j.sport) v.push({ regle: "sport", message: `séance ${j.seance.lettre} un jour de sport (${j.jour})` });
    return v;
  };

  return { genererProgramme, remplacerExercice, verifierRegles, auditerBanque, niveauDepuisQuestions, entreesDepuisReponses, presenterPourApp, programmePourApp, REPONSES_DEFAUT, suggererCharge, incrementDe, recalerNiveau, remplacantsPour, remplacantPourApp, adapterSeance, dureeSeance, dureeExercice, appartientAuFocus, faisable, okDe, nomMateriel, normaliserMateriel, grosGroupe, grosGroupeVolume, groupesDe, nbExosDe, exerciceProgramme, interpreterObjectifLibre, volumeSemaine, tropFacilePour, tropFacilePourAvance, GROS_GROUPES, SQUELETTES, FOCUS, OBJECTIFS, SPORTS, NIVEAU, MATERIEL_OK, MATERIEL_NOM, MATERIELS, TAGS_MATERIEL, POIDS };
});
