// Lanceur du harnais Playwright — depuis la racine du dépôt :
//   node outils/tests/lancer.js            toutes les suites, dans l'ordre des numéros
//   node outils/tests/lancer.js 01 02      seulement celles dont le nom commence ainsi
// Ce qu'il fait : construit app.html (index.html avec React servi en local), lance deux faux
// workers (8323 normal, 8324 avec l'IA non configurée), joue chaque suite et compte les
// échecs (« ✘ », « : false », sortie ≠ 0), puis arrête les faux workers.
// Prérequis : Playwright et Chromium (ici : NODE_PATH=/opt/node22/lib/node_modules,
// exécutable /opt/pw-browsers/chromium, comme dans les suites).
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn, spawnSync } = require("child_process");
const ici = __dirname;
const racine = path.join(ici, "..", "..");

// 1. app.html : index.html, React pris en local (les suites coupent le réseau vers les CDN)
const html = fs.readFileSync(path.join(racine, "index.html"), "utf8")
  .replace("https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js", "/react.production.min.js")
  .replace("https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js", "/react-dom.production.min.js");
fs.writeFileSync(path.join(ici, "app.html"), html);

// 2. faux workers — relancés avant chaque suite : leur état (pot, paris, négos) repart à neuf
let mocks = [];
const lancerMocks = () => { mocks = [
  spawn(process.execPath, [path.join(ici, "mock-server.js")], { env: { ...process.env, PORT: "8323" }, stdio: "ignore" }),
  spawn(process.execPath, [path.join(ici, "mock-server.js")], { env: { ...process.env, PORT: "8324", MOCK_IA: "off" }, stdio: "ignore" })
]; };
const arreterMocks = () => new Promise(res => { mocks.forEach(m => m.kill()); setTimeout(res, 400); });
const attendre = port => new Promise((res, rej) => {
  let n = 0;
  const essai = () => {
    const req = http.get(`http://127.0.0.1:${port}/app.html`, r => { r.resume(); if (r.statusCode === 200) res(); else rej(new Error(`mock ${port} : statut ${r.statusCode}`)); });
    req.on("error", () => (++n > 40 ? rej(new Error("mock " + port + " injoignable")) : setTimeout(essai, 250)));
  };
  essai();
});

(async () => {
  const filtres = process.argv.slice(2);
  const suites = fs.readdirSync(ici).filter(f => /^\d/.test(f) && f.endsWith(".js") && (!filtres.length || filtres.some(x => f.startsWith(x)))).sort();
  const bilan = [];
  for (const f of suites) {
    console.log(`\n########## ${f}`);
    lancerMocks();
    try { await attendre(8323); await attendre(8324); } catch (e) { console.error(e.message); await arreterMocks(); process.exit(2); }
    const r = spawnSync(process.execPath, [path.join(ici, f)], { cwd: ici, env: process.env, encoding: "utf8", timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
    const sortie = (r.stdout || "") + (r.stderr || "");
    process.stdout.write(sortie);
    // échec = « ✘ », ou une vérification numérotée à l'ancienne (« 1b. … : false ») ; les autres « false »
    // imprimés sont des valeurs d'information
    const echecs = (sortie.match(/✘/g) || []).length + (sortie.match(/^\s*\d+[a-z]?\.\s.*: false\b/gm) || []).length;
    bilan.push({ f, echecs, code: r.status, timeout: !!r.error });
    await arreterMocks();
  }
  console.log("\n========== bilan");
  for (const b of bilan) console.log(`  ${b.echecs || b.code || b.timeout ? "✘" : "✔"} ${b.f}${b.echecs ? ` — ${b.echecs} échec(s)` : ""}${b.code ? ` — sortie ${b.code}` : ""}${b.timeout ? " — délai dépassé" : ""}`);
  const ko = bilan.filter(b => b.echecs || b.code || b.timeout).length;
  console.log(ko ? `\n${ko} suite(s) en échec` : "\ntoutes les suites passent");
  process.exit(ko ? 1 : 0);
})();
