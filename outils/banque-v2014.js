#!/usr/bin/env node
// v20.14 — banque : ajout des classiques de salle manquants, champ « alias » (autres appellations, français
// et anglais) et marqueur « classique » (exercice courant en salle, connu de tous) sur chaque exercice.
// Script d'application, lancé une fois (node outils/banque-v2014.js) ; il est idempotent et sert de trace.
const fs = require("fs");
const path = require("path");
const F = path.join(__dirname, "..", "banque-exercices.json");
const b = JSON.parse(fs.readFileSync(F, "utf8"));

const NOUVEAUX = [
  { id: "leg_extension", nom: "Leg extension (machine)", compartiment: "isolation", muscle: "quadriceps", secondaires: [], materiel: ["machine"], difficulte: 1, echelle: "simple", monte_vers: null, reps: [12, 15], unilateral: false,
    consigne: "Dos calé, coussin sur le bas des tibias, tends les jambes jusqu'à l'horizontale sans claquer les genoux, tiens une seconde et redescends en deux secondes.",
    erreur: "Balancer le buste ou lâcher la charge en descendant : la montée doit être la seule chose qui bouge.", isolation: true, lot: 3, trou: "isolation quadriceps de base, absente", repos_s: 90, demo: "Leg extension" },
  { id: "presse_horizontale", nom: "Presse à cuisses horizontale (assise)", compartiment: "squat", muscle: "quadriceps", secondaires: ["fessiers"], materiel: ["machine"], difficulte: 1, echelle: "simple", monte_vers: "squat", reps: [8, 12], unilateral: false,
    consigne: "Assise, dos et bassin calés, pieds largeur d'épaules au milieu du plateau, pousse sans verrouiller les genoux et reviens jusqu'à 90°.",
    erreur: "Descendre jusqu'à ce que le bassin bascule, ou verrouiller les genoux en haut.", lot: 3, repos_s: 120, demo: "Presse à cuisses horizontale" },
  { id: "adduction", nom: "Adduction machine", compartiment: "isolation", muscle: "adducteurs", secondaires: [], materiel: ["machine"], difficulte: 1, echelle: "simple", monte_vers: null, reps: [12, 15], unilateral: false,
    consigne: "Assise, dos calé, serre les genoux contre les coussins en contrôlant le retour, sans à-coups.",
    erreur: "Régler une amplitude trop grande dès le départ : l'aine tire, on ouvre progressivement.", isolation: true, lot: 3, trou: "adducteurs en salle", repos_s: 90, demo: "Adduction machine" },
  { id: "pec_deck", nom: "Pec deck (butterfly)", compartiment: "isolation", muscle: "pectoraux", secondaires: ["épaules"], materiel: ["machine"], difficulte: 1, echelle: "simple", monte_vers: null, reps: [12, 15], unilateral: false,
    consigne: "Dos plaqué, coudes à hauteur des épaules et légèrement pliés, rapproche les bras devant toi en serrant les pecs une seconde, reviens lentement.",
    erreur: "Ouvrir loin derrière le plan des épaules : c'est l'épaule qui encaisse.", isolation: true, lot: 3, trou: "isolation pectoraux en salle", repos_s: 90, demo: "Pec deck" },
  { id: "poulie_vis_a_vis", nom: "Écarté à la poulie vis-à-vis", compartiment: "isolation", muscle: "pectoraux", secondaires: ["épaules"], materiel: ["poulie"], difficulte: 2, echelle: "simple", monte_vers: null, reps: [12, 15], unilateral: false,
    consigne: "Un pied devant, poignées hautes, bras presque tendus et coudes fixes, rapproche les mains devant le bas des pecs sans bouger le buste.",
    erreur: "Plier les coudes et pousser au lieu d'écarter : ça devient un développé.", isolation: true, lot: 3, repos_s: 90, demo: "Écarté poulie vis-à-vis" },
  { id: "ecarte_halteres", nom: "Écarté haltères sur banc", compartiment: "isolation", muscle: "pectoraux", secondaires: ["épaules"], materiel: ["haltères + banc"], difficulte: 2, echelle: "simple", monte_vers: null, reps: [10, 12], unilateral: false,
    consigne: "Allongée, haltères au-dessus de la poitrine, coudes légèrement pliés et fixes, descends en arc jusqu'à sentir l'étirement, remonte sans cogner les haltères.",
    erreur: "Descendre très bas avec du lourd : l'épaule prend tout.", isolation: true, lot: 3, repos_s: 90, demo: "Écarté haltères" },
  { id: "curl_pupitre", nom: "Curl pupitre (Larry Scott)", compartiment: "isolation", muscle: "biceps", secondaires: ["avant-bras"], materiel: ["machine", "barre + banc", "haltères + banc"], difficulte: 1, echelle: "simple", monte_vers: "curl_barre", reps: [10, 12], unilateral: false,
    consigne: "Bras posés sur le pupitre, aisselles calées, monte la charge sans décoller les coudes, descends lentement sans tendre complètement.",
    erreur: "Tendre les bras à fond en bas, d'un coup : le tendon du biceps encaisse.", isolation: true, lot: 3, repos_s: 90, demo: "Curl pupitre" }
];

const ALIAS = {
  chaise: ["wall sit", "chaise murale"], squat_pdc: ["air squat", "squat sans charge", "bodyweight squat"], goblet: ["goblet squat haltère", "squat gobelet", "kettlebell squat"],
  presse: ["leg press", "presse inclinée", "presse 45", "presse à jambes"], hack_squat: ["hack squat machine", "squat hack"], squat: ["back squat", "squat arrière", "squat barre nuque"],
  squat_saut: ["jump squat", "squat jump"], squat_avant: ["front squat", "squat avant barre"], superman: ["superman", "extension lombaire au sol"],
  lombaire: ["hyperextension", "extension lombaire banc", "banc à lombaires", "back extension"], rdl_halteres: ["romanian deadlift haltères", "rdl haltères", "soulevé roumain haltères"],
  rdl: ["romanian deadlift", "rdl", "soulevé de terre jambes tendues", "stiff leg deadlift"], swing: ["kb swing", "swing kettlebell", "russian swing"], good_morning: ["good morning barre", "bonjour barre"],
  rdl_une_jambe: ["single leg deadlift", "rdl une jambe", "soulevé de terre unilatéral"], trap_bar: ["trap bar deadlift", "hex bar", "soulevé barre hexagonale"], souleve_sumo: ["sumo deadlift", "deadlift sumo"],
  rack_pull: ["rack pull", "soulevé partiel"], souleve_terre: ["deadlift", "soulevé de terre conventionnel", "dead lift"], hip_hinge_elastique: ["pull through", "pull-through poulie", "cable pull through"],
  pompes_mur: ["pompes inclinées", "push up mur", "incline push up"], pompes_genoux: ["knee push up", "pompes à genoux"], pompes: ["push up", "push-ups", "pushup", "pompe"],
  chest_press: ["développé machine", "machine pectoraux", "press pectoraux machine", "chest press"], dc_halteres: ["dumbbell bench press", "développé haltères couché", "dc haltères"],
  developpe_couche: ["bench press", "bench", "développé couché barre", "dc barre"], dc_incline: ["incline bench press", "développé incliné", "incline dumbbell press"],
  dips: ["dips", "dips barres parallèles", "dips pectoraux"], dips_machine: ["machine à dips", "dips assis", "dip machine"], pike: ["pike push up", "pompes en pique"],
  shoulder_press_machine: ["shoulder press", "presse épaules", "développé épaules assis machine"], dev: ["dumbbell shoulder press", "développé épaules haltères", "overhead press haltères"],
  arnold: ["arnold press haltères", "développé arnold"], militaire: ["overhead press", "ohp", "développé debout", "press militaire", "military press"], push_press: ["push press barre", "développé poussé"],
  rowing_inverse: ["inverted row", "rowing australien", "tirage inversé", "australian pull up"], rowing_elastique: ["tirage élastique", "band row", "rowing bande"],
  rowing: ["tirage poulie basse", "seated row", "rowing assis", "tirage bas", "rowing poulie", "tirage horizontal"], rowing_halteres: ["one arm row", "rowing un bras", "rowing haltère", "dumbbell row"],
  rowing_barre: ["barbell row", "rowing buste penché", "bent over row", "rowing barre penché"], rowing_pendlay: ["pendlay row", "rowing pendlay barre"],
  tirage_elastique_v: ["lat pulldown élastique", "tirage vertical bande"], tirage_v: ["lat pulldown", "tirage poitrine", "tirage vertical", "pulldown", "tirage devant"],
  traction_assistee: ["assisted pull up", "traction machine", "tractions assistées", "traction élastique"], traction_negative: ["negative pull up", "traction excentrique"],
  traction: ["pull up", "pull-up", "tractions", "chin up", "traction pronation"], traction_lestee: ["weighted pull up", "traction avec lest", "tractions lestées"],
  split_squat: ["split squat", "fente statique", "fente sur place"], fente_arr: ["reverse lunge", "fentes arrières", "fente arrière"], stepup: ["step up", "montée sur banc", "step-up", "montée de banc"],
  fente: ["walking lunge", "fentes", "fente avant", "lunges", "fentes marchées haltères"], fente_laterale: ["side lunge", "lateral lunge", "fentes latérales"],
  bulgare: ["bulgarian split squat", "fente bulgare", "split squat bulgare", "bulgares"], pistol_assiste: ["assisted pistol squat", "pistol assisté", "squat une jambe assisté"],
  stepup_leste: ["weighted step up", "step up haltères"], curtsy: ["curtsy lunge", "fente croisée", "fente révérence"], bulgare_lestee: ["bulgarian split squat haltères", "fentes bulgares haltères", "bulgares lestées"],
  fente_barre: ["barbell lunge", "fentes avec barre"], pistol: ["pistol squat", "squat une jambe", "squat pistol"],
  planche_genoux: ["knee plank", "planche genoux", "gainage genoux"], deadbug: ["dead bug", "insecte mort", "gainage dead bug"], bird_dog: ["bird dog", "chien oiseau", "gainage bird dog"],
  planche: ["plank", "gainage planche", "gainage ventral", "planche ventrale"], planche_laterale: ["side plank", "gainage latéral", "planche côté"], hollow: ["hollow body", "hollow hold", "gainage hollow"],
  releves: ["leg raises", "relevé de jambes au sol", "lying leg raise"], pallof: ["pallof press", "anti-rotation poulie", "gainage pallof"], roulette: ["ab wheel", "ab roller", "roue abdominale", "rollout"],
  releve_genoux_suspendu: ["hanging knee raise", "relevé de genoux barre", "knee raise suspendu"], farmer_walk: ["farmer walk", "marche du fermier", "farmer carry", "farmers walk"],
  pallof_rotation: ["pallof rotation", "pallof press rotation"], pallof_demi_genou: ["half kneeling pallof", "pallof à genou"],
  pont_sol: ["glute bridge", "pont fessier", "pont au sol", "hip bridge"], pont: ["single leg glute bridge", "pont une jambe", "pont fessier une jambe"],
  hipthrust_machine: ["hip thrust machine", "machine hip thrust", "poussée de hanches machine"], hipthrust: ["hip thrust", "hip thrust barre", "poussée de hanche", "hip trust"],
  kickback: ["cable kickback", "glute kickback", "kickback fessier", "extension de hanche poulie"], abduction: ["abducteurs machine", "machine à abducteurs", "hip abduction", "écarter les cuisses"],
  abduction_elastique: ["band abduction", "abduction bande", "abducteurs élastique"], clamshell: ["clamshell", "coquillage", "clam shell"],
  legcurl: ["leg curl", "leg curl couché", "lying leg curl", "curl ischios", "ischio machine"], legcurl_ballon: ["swiss ball leg curl", "leg curl ballon", "curl ischios ballon"],
  nordic: ["nordic hamstring curl", "nordic curl", "nordics"], legcurl_assis: ["seated leg curl", "leg curl assis machine", "curl ischios assis", "leg curl machine assis"],
  glute_ham_raise: ["ghd", "glute ham raise", "ghr"], curl: ["dumbbell curl", "curl haltères", "biceps curl", "curl biceps"], curl_barre: ["barbell curl", "curl barre droite", "curl ez", "curl barre ez"],
  curl_marteau: ["hammer curl", "curl marteau haltères", "curl neutre"], curl_poulie: ["cable curl", "curl poulie", "curl câble"],
  triceps: ["triceps pushdown", "pushdown", "extension triceps poulie haute", "triceps corde", "triceps poulie"], dips_banc: ["bench dips", "dips entre bancs", "dips triceps banc"],
  extension_nuque: ["overhead triceps extension", "extension triceps nuque", "triceps nuque", "french press haltère"], barre_front: ["skull crusher", "skullcrusher", "barre au front", "triceps barre au front", "french press"],
  lateral: ["lateral raise", "élévations latérales haltères", "élévation latérale", "side raise"], lateral_poulie: ["cable lateral raise", "élévation latérale câble", "latérales poulie"],
  lateral_machine: ["lateral raise machine", "élévations latérales machine", "machine élévations latérales", "machine épaules latérales"], oiseau: ["rear delt fly", "oiseau haltères", "élévations arrière", "reverse fly"],
  tirage_ela: ["face pull", "face-pull", "tirage visage", "tirage au visage"], reverse_pec_deck: ["reverse pec deck", "reverse fly machine", "oiseau machine", "rear delt machine"],
  mollets: ["standing calf raise", "mollets debout", "calf raise", "extension mollets debout"], mollets_marche: ["calf raise marche", "mollets escalier", "mollets sur marche"],
  mollets_assis: ["seated calf raise", "mollets assis", "mollets machine assis", "calf assis"], mollets_presse: ["calf press", "mollets presse", "mollets à la presse à cuisses"],
  marche_inclinee: ["incline walk", "marche tapis incliné", "marche en côte", "tapis incliné"], escaliers: ["stairmaster", "stepper", "escalier machine", "stair climber"],
  rameur: ["rowing machine", "rameur concept", "rowing cardio", "rower"], velo: ["vélo d'appartement", "bike", "spinning", "vélo cardio", "cycling"], corde: ["jump rope", "corde à sauter", "skipping"],
  elliptique: ["elliptical", "vélo elliptique", "cross trainer"], course_douce: ["footing", "jogging", "course lente", "tapis de course"], burpees: ["burpee"], montees: ["high knees", "montées de genoux", "genoux hauts"],
  mobilite_hanches: ["90/90", "mobilité de hanche", "hip mobility", "90 90"], flechisseurs: ["hip flexor stretch", "étirement psoas", "fente basse", "étirement fléchisseurs"],
  ischios_etirement: ["hamstring stretch", "étirement ischios", "étirement arrière cuisse"], ouverture_epaules: ["shoulder dislocates", "dislocations épaules", "passage de bâton", "ouverture épaules bâton"],
  thoracique: ["thoracic extension", "extension thoracique", "foam roller dos", "rouleau dos"], chat_vache: ["cat cow", "cat-cow", "chat vache", "mobilité colonne"],
  leg_extension: ["extension de jambes", "extension quadriceps", "extension des jambes", "leg extension machine", "extension de jambe"],
  presse_horizontale: ["presse assise", "leg press horizontal", "seated leg press", "presse horizontale"],
  adduction: ["adducteurs machine", "machine à adducteurs", "hip adduction", "serrer les cuisses"],
  pec_deck: ["butterfly", "machine pec deck", "écarté machine", "pec-deck"],
  poulie_vis_a_vis: ["cable crossover", "crossover", "cable fly", "écarté poulie", "vis à vis"],
  ecarte_halteres: ["dumbbell fly", "fly haltères", "écartés couché", "écarté couché"],
  curl_pupitre: ["preacher curl", "larry scott", "curl au pupitre", "curl machine"]
};
// exercices courants en salle, connus de tous ; les autres sont « moins courants » (variation ou demande)
const CLASSIQUES = new Set(["squat_pdc", "goblet", "presse", "presse_horizontale", "hack_squat", "squat", "lombaire", "rdl_halteres", "rdl", "swing", "good_morning", "souleve_terre", "souleve_sumo",
  "pompes_genoux", "pompes", "chest_press", "dc_halteres", "developpe_couche", "dc_incline", "dips", "dips_machine", "shoulder_press_machine", "dev", "arnold", "militaire",
  "rowing", "rowing_halteres", "rowing_barre", "tirage_v", "traction_assistee", "traction", "traction_lestee", "split_squat", "fente_arr", "stepup", "fente", "bulgare", "bulgare_lestee",
  "planche", "planche_genoux", "planche_laterale", "releves", "roulette", "releve_genoux_suspendu", "farmer_walk", "pont_sol", "hipthrust_machine", "hipthrust", "kickback", "abduction", "adduction",
  "legcurl", "legcurl_assis", "leg_extension", "curl", "curl_barre", "curl_marteau", "curl_poulie", "curl_pupitre", "triceps", "dips_banc", "extension_nuque", "barre_front",
  "lateral", "lateral_poulie", "lateral_machine", "oiseau", "tirage_ela", "reverse_pec_deck", "pec_deck", "poulie_vis_a_vis", "ecarte_halteres", "mollets", "mollets_assis", "mollets_presse",
  "marche_inclinee", "escaliers", "rameur", "velo", "corde", "elliptique", "course_douce", "burpees", "montees"]);

let ajoutes = 0;
for (const n of NOUVEAUX) if (!b.exercices.some(e => e.id === n.id)) { b.exercices.push(n); ajoutes++; }
const manque = [];
for (const e of b.exercices) {
  if (!ALIAS[e.id]) manque.push(e.id);
  e.alias = ALIAS[e.id] || [];
  e.classique = CLASSIQUES.has(e.id);
}
if (manque.length) { console.error("sans alias : " + manque.join(", ")); process.exit(1); }
b.genere = "programmes étape 1 (marqueurs étape 2 : accessoire, regression, coordination ; v20.14 : alias, classique ; convention du matériel : alternatives, « a + b » = combinaison)";
b.regles.alias = "autres appellations (français et anglais) : la recherche du panneau matche nom ET alias, insensible aux accents, à la casse et aux tirets, tolérante à une faute";
b.regles.classique = "exercice courant en salle, connu de tous : le moteur le préfère à égalité, et ne pioche dans les moins courants que pour varier ou sur demande";
fs.writeFileSync(F, JSON.stringify(b, null, 2) + "\n");
console.log(`${ajoutes} exercice(s) ajouté(s), ${b.exercices.length} au total, ${b.exercices.filter(e => e.classique).length} classiques`);
