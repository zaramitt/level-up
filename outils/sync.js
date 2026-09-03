// Synchronisation des copies embarquées — à lancer avant chaque livraison :
//   node outils/sync.js
// 1. moteur-programmes.js et banque-exercices.json → index.html (entre les balises
//    <script id="moteur-programmes"> et <script id="banque-exercices">)
// 2. index.html → worker.js (ligne 5, constante HTML)
// Les sources sont les fichiers à la racine ; les copies ne s'éditent jamais à la main.
const fs = require("fs");
const path = require("path");
const racine = path.join(__dirname, "..");
const lire = f => fs.readFileSync(path.join(racine, f), "utf8");

let html = lire("index.html");
const moteur = lire("moteur-programmes.js");
const banque = JSON.parse(lire("banque-exercices.json"));
const bloc = (id, contenu) => `<script id="${id}">\n${contenu}\n</script>`;
const remplacer = (id, contenu) => {
  const re = new RegExp(`<script id="${id}">[\\s\\S]*?</script>`);
  if (!re.test(html)) throw new Error(`balise <script id="${id}"> introuvable dans index.html`);
  html = html.replace(re, () => bloc(id, contenu));
};
remplacer("moteur-programmes", "/* copie de moteur-programmes.js — ne pas éditer ici : node outils/sync.js */\n" + moteur.trim());
remplacer("banque-exercices", "/* copie de banque-exercices.json — ne pas éditer ici : node outils/sync.js */\nwindow.BANQUE = " + JSON.stringify(banque).replace(/<\//g, "<\\/") + ";");
fs.writeFileSync(path.join(racine, "index.html"), html);

// worker.js : ligne 5 = const HTML = "…" (copie de index.html, échappée en ASCII)
const w = lire("worker.js").split("\n");
if (!w[4].startsWith("const HTML = \"")) throw new Error("worker.js : la ligne 5 n'est pas la constante HTML");
const enc = s => JSON.stringify(s).replace(/[\u007f-\uffff]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
w[4] = "const HTML = " + enc(html) + ";";
fs.writeFileSync(path.join(racine, "worker.js"), w.join("\n"));
const verif = JSON.parse(lire("worker.js").split("\n")[4].match(/^const HTML = (".*");$/)[1]) === html;
console.log(`index.html : moteur (${moteur.length} car.) et banque (${banque.exercices.length} exercices) synchronisés ; worker.js : copie identique à index.html → ${verif}`);
if (!verif) process.exit(1);
