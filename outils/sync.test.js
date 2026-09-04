// Échoue si une copie embarquée diffère de sa source :
//   - le moteur et la banque dans index.html (balises <script id="…">)
//   - index.html dans worker.js (ligne 5)
// Lancer : node outils/sync.test.js — remède : node outils/sync.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { calculer } = require("./sync.js");
const racine = path.join(__dirname, "..");
const lire = f => fs.readFileSync(path.join(racine, f), "utf8");

const c = calculer();
const html = lire("index.html"), worker = lire("worker.js");
let ko = 0;
const test = (nom, fn) => { try { fn(); console.log("  ✔ " + nom); } catch (e) { ko++; console.log("  ✘ " + nom + "\n      " + String(e.message).split("\n")[0]); } };

test("index.html embarque la copie exacte de moteur-programmes.js", () => {
  const bloc = html.match(/<script id="moteur-programmes">\n([\s\S]*?)\n<\/script>/);
  assert.ok(bloc, "balise moteur-programmes absente");
  assert.strictEqual(bloc[1].split("\n").slice(1).join("\n"), c.moteur.trim(), "la copie du moteur diffère de la source — lance node outils/sync.js");
});
test("index.html embarque la copie exacte de banque-exercices.json", () => {
  const bloc = html.match(/<script id="banque-exercices">\n([\s\S]*?)\n<\/script>/);
  assert.ok(bloc, "balise banque-exercices absente");
  const json = bloc[1].split("\n").slice(1).join("\n").replace(/^window\.BANQUE = /, "").replace(/;$/, "");
  assert.deepStrictEqual(JSON.parse(json), c.banque, "la copie de la banque diffère de la source — lance node outils/sync.js");
});
test("index.html tout entier est à jour (identique au résultat de la synchronisation)", () => {
  assert.strictEqual(html, c.html, "index.html n'est pas synchronisé — lance node outils/sync.js");
});
test("worker.js embarque la copie exacte de index.html (ligne 5)", () => {
  const m = worker.split("\n")[4].match(/^const HTML = (".*");$/);
  assert.ok(m, "la ligne 5 de worker.js n'est pas la constante HTML");
  assert.strictEqual(JSON.parse(m[1]), html, "worker.js n'embarque pas l'index.html courant — lance node outils/sync.js");
  assert.strictEqual(worker, c.worker, "worker.js n'est pas synchronisé — lance node outils/sync.js");
});
console.log(ko ? `\n${ko} copie(s) désynchronisée(s) — lance node outils/sync.js` : "\ncopies embarquées synchronisées");
process.exit(ko ? 1 : 0);
