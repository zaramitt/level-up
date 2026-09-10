#!/usr/bin/env node
// Restauration d'une sauvegarde du KV (v20.12) — voir SECURITE.md, section « Restauration ».
//
//   node outils/restaurer.js <sauvegarde.json> [--code duo-xxxxxxxxxx] [--bulk restauration.json]
//   node outils/restaurer.js <sauvegarde.json> [--code duo-xxxxxxxxxx] --compte <ACCOUNT_ID> --namespace <KV_ID> --jeton <CF_API_TOKEN>
//
// <sauvegarde.json> : le fichier « sauvegarde-AAAA-MM-JJ.json » déposé chaque nuit par le worker dans le
// bucket R2 (téléchargé par `wrangler r2 object get level-up-sauvegardes/sauvegarde-AAAA-MM-JJ.json --file …`
// ou depuis le dashboard), ou le fichier assemblé depuis le namespace KV de repli (voir SECURITE.md).
// --code   : ne restaurer que les clés de ce duo (préfixe « code: ») ; sans --code, tout le namespace.
// --bulk   : n'écrit rien chez Cloudflare, produit un fichier pour `wrangler kv bulk put --namespace-id=<KV_ID> restauration.json`.
// --jeton  : écrit directement par l'API Cloudflare (PUT …/storage/kv/namespaces/<KV_ID>/bulk, par paquets de 5 000 clés).
// Les valeurs sont restaurées octet pour octet (chaînes JSON telles quelles). Une clé absente de la sauvegarde
// n'est jamais supprimée : la restauration ajoute et écrase, elle n'efface pas.
const fs = require("fs");

const lireSauvegarde = (texte) => {
  const s = JSON.parse(texte);
  if (!s || s.version !== 1 || !s.donnees || typeof s.donnees !== "object") throw new Error("format de sauvegarde inconnu (version 1 attendue)");
  return s;
};
// assemble une sauvegarde « version 1 » depuis les entrées du namespace KV de repli (sauvegarde:<date>:<groupe>)
const assemblerDepuisKV = (date, groupes) => {
  const donnees = {};
  for (const g of groupes) for (const [k, v] of Object.entries(JSON.parse(g))) donnees[k] = v;
  return { version: 1, date, cles: Object.keys(donnees).length, donnees };
};
const filtrer = (donnees, code) => {
  if (!code) return donnees;
  if (!/^[a-z0-9-]{8,30}$/.test(code)) throw new Error("code duo invalide");
  return Object.fromEntries(Object.entries(donnees).filter(([k]) => k.startsWith(code + ":")));
};
const versBulk = (donnees) => Object.entries(donnees).map(([key, value]) => ({ key, value }));
// restaure via une fonction put(cle, valeur) — le KV réel, un faux KV de test, ou l'API
const restaurer = async (donnees, put) => { let n = 0; for (const [k, v] of Object.entries(donnees)) { await put(k, v); n++; } return n; };
const restaurerParApi = async (donnees, { compte, namespace, jeton }) => {
  const paquets = versBulk(donnees), taille = 5000; let n = 0;
  for (let i = 0; i < paquets.length; i += taille) {
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${compte}/storage/kv/namespaces/${namespace}/bulk`, {
      method: "PUT", headers: { "authorization": "Bearer " + jeton, "content-type": "application/json" }, body: JSON.stringify(paquets.slice(i, i + taille)) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.success) throw new Error("API Cloudflare : " + r.status + " " + JSON.stringify(j.errors || j).slice(0, 300));
    n += Math.min(taille, paquets.length - i);
  }
  return n;
};

if (require.main === module) {
  const a = process.argv.slice(2);
  const opt = (nom) => { const i = a.indexOf(nom); return i >= 0 ? a[i + 1] : null; };
  const fichier = a.find(x => !x.startsWith("--") && a[a.indexOf(x) - 1] !== undefined && !String(a[a.indexOf(x) - 1]).startsWith("--")) || a[0];
  if (!fichier || fichier.startsWith("--")) { console.error("usage : node outils/restaurer.js <sauvegarde.json> [--code duo-…] [--bulk sortie.json | --compte ID --namespace ID --jeton TOKEN]"); process.exit(2); }
  (async () => {
    const s = lireSauvegarde(fs.readFileSync(fichier, "utf8"));
    const donnees = filtrer(s.donnees, opt("--code"));
    const nb = Object.keys(donnees).length;
    console.log(`sauvegarde du ${s.date} : ${s.cles} clés ; à restaurer : ${nb}${opt("--code") ? " (duo " + opt("--code") + ")" : ""}`);
    if (!nb) { console.error("rien à restaurer (code absent de la sauvegarde ?)"); process.exit(1); }
    if (opt("--jeton")) {
      const n = await restaurerParApi(donnees, { compte: opt("--compte"), namespace: opt("--namespace"), jeton: opt("--jeton") });
      console.log(`${n} clés écrites par l'API Cloudflare`);
    } else {
      const sortie = opt("--bulk") || "restauration.json";
      fs.writeFileSync(sortie, JSON.stringify(versBulk(donnees)));
      console.log(`${nb} clés écrites dans ${sortie} — puis : wrangler kv bulk put --namespace-id=<KV_ID> ${sortie}`);
    }
  })().catch(e => { console.error(e.message); process.exit(1); });
}
module.exports = { lireSauvegarde, assemblerDepuisKV, filtrer, versBulk, restaurer, restaurerParApi };
