// Synchronisation des copies embarquées — à lancer avant chaque commit touchant au
// moteur ou à la banque, et avant chaque livraison :
//   node outils/sync.js
// 1. moteur-programmes.js et banque-exercices.json → index.html (entre les balises
//    <script id="moteur-programmes"> et <script id="banque-exercices">)
// 2. index.html → worker.js (ligne 5, constante HTML)
// 3. outils/polices/space-grotesk-latin.woff2 → worker.js (ligne 6, constante POLICE_WOFF2,
//    en base64 : la police est servie par le worker, plus aucun appel à Google Fonts)
// Les sources sont les fichiers à la racine ; les copies ne s'éditent jamais à la main.
// `node outils/sync.test.js` échoue si une copie diffère de sa source.
const fs = require("fs");
const path = require("path");
const racine = path.join(__dirname, "..");
const lire = f => fs.readFileSync(path.join(racine, f), "utf8");
const enc = s => JSON.stringify(s).replace(/[\u007f-\uffff]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));

// calcule ce que index.html et worker.js DOIVENT contenir, sans rien écrire
const calculer = () => {
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
  const w = lire("worker.js").split("\n");
  if (!w[4].startsWith("const HTML = \"")) throw new Error("worker.js : la ligne 5 n'est pas la constante HTML");
  w[4] = "const HTML = " + enc(html) + ";";
  const police = fs.readFileSync(path.join(racine, "outils", "polices", "space-grotesk-latin.woff2")).toString("base64");
  if (!w[5].startsWith("const POLICE_WOFF2 = \"")) throw new Error("worker.js : la ligne 6 n'est pas la constante POLICE_WOFF2");
  w[5] = "const POLICE_WOFF2 = \"" + police + "\";";
  return { html, worker: w.join("\n"), moteur, banque, police };
};

if (require.main === module) {
  const c = calculer();
  fs.writeFileSync(path.join(racine, "index.html"), c.html);
  fs.writeFileSync(path.join(racine, "worker.js"), c.worker);
  const verif = JSON.parse(lire("worker.js").split("\n")[4].match(/^const HTML = (".*");$/)[1]) === c.html;
  console.log(`index.html : moteur (${c.moteur.length} car.) et banque (${c.banque.exercices.length} exercices) synchronisés ; worker.js : copie identique à index.html → ${verif}, police embarquée (${Math.round(c.police.length * 3 / 4 / 1024)} Ko)`);
  if (!verif) process.exit(1);
}
module.exports = { calculer };
