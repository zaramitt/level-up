// Test de bout en bout de la sauvegarde et de la restauration dans le VRAI runtime Workers (workerd, via
// Miniflare) : KV + R2 + cron. Sauvegarde → suppression totale → restauration d'un duo → restauration
// complète → vérification octet pour octet. Voir SECURITE.md, « Restauration ».
//   npm i --no-save miniflare@4 && node outils/sauvegarde.e2e.js
// (miniflare n'est pas une dépendance du dépôt : ~30 paquets et le binaire workerd, installés à la demande.)
const fs = require("fs");
const path = require("path");
const { Miniflare } = require("miniflare");
const { lireSauvegarde, restaurer, filtrer } = require("./restaurer.js");
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? "✔" : "✘"} ${nom}${cond || detail === undefined ? "" : " — " + String(detail).slice(0, 200)}`); };
(async () => {
  const mf = new Miniflare({
    script: fs.readFileSync(path.join(__dirname, "..", "worker.js"), "utf8"), modules: true, compatibilityDate: "2026-08-01",
    kvNamespaces: ["NEGOS"], r2Buckets: ["SAUVEGARDES"], bindings: { ADMIN_TOKEN: "jeton-e2e-tres-long-1234" }, unsafeTriggerHandlers: true,
  });
  const url = await mf.ready;
  let ip = 0;
  const post = (chemin, corps) => mf.dispatchFetch(url + chemin.slice(1), { method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "10.1." + (++ip >> 8) + "." + (ip & 255) }, body: JSON.stringify(corps) });
  await post("/api/duo-e2eabcdef/profil", {});
  await post("/api/duo-e2eabcdef/etat", { xp: 999, adresse: "il", histo: [{ date: "2026-09-10", type: "B", nomS: "Dos · biceps", photos: ["p1"] }], jours: { "2026-09-10": true } });
  await post("/api/duo-e2eabcdef/photo", { id: "p1", data: "data:image/jpeg;base64," + "/9j/4AAQ".repeat(30000) });
  await post("/api/duo-e2eabcdef/negos", { action: "proposer", label: "Un café « chez toi » — é à ü ñ 🎁", niveau: 2, mot: "mot" });
  await post("/api/duo-e2eabcdef/pot", { action: "plafond", montant: 40 });
  await post("/api/duo-deuxabcdef/etat", { xp: 3 });
  const kv = await mf.getKVNamespace("NEGOS");
  const dump = async () => { const l = await kv.list(); const out = {}; for (const k of l.keys) if (!k.name.startsWith("journal:")) out[k.name] = await kv.get(k.name); return JSON.stringify(Object.entries(out).sort()); };
  const avant = await dump();
  check("données en place (deux duos, une photo de 240 Ko, des accents et un emoji)", JSON.parse(avant).length === 6 && JSON.parse(avant).find(([k]) => k.endsWith("photo:p1"))[1].length > 200000);
  const r = await mf.dispatchFetch(url + "cdn-cgi/handler/scheduled?cron=0+3+*+*+*");
  check("cron « 0 3 * * * » déclenché dans workerd", r.status === 200);
  const r2 = await mf.getR2Bucket("SAUVEGARDES");
  const liste = await r2.list();
  const nom = "sauvegarde-" + new Date().toISOString().slice(0, 10) + ".json";
  check("un objet R2 daté du jour", liste.objects.some(o => o.key === nom), liste.objects.map(o => o.key).join(","));
  const sauv = lireSauvegarde(await (await r2.get(nom)).text());
  check("format version 1, toutes les clés présentes (journal compris)", sauv.version === 1 && sauv.cles >= 6 && JSON.parse(avant).every(([k, v]) => sauv.donnees[k] === v));
  for (const [k] of JSON.parse(avant)) await kv.delete(k);
  check("suppression totale : le namespace est vide", JSON.parse(await dump()).length === 0);
  await restaurer(filtrer(sauv.donnees, "duo-e2eabcdef"), (k, v) => kv.put(k, v));
  const unDuo = JSON.parse(await dump());
  check("restauration d'un seul duo : ses clés, rien d'autre", unDuo.length === 5 && unDuo.every(([k]) => k.startsWith("duo-e2eabcdef:")), unDuo.map(([k]) => k).join(","));
  await restaurer(sauv.donnees, (k, v) => kv.put(k, v));
  const apres = await dump();
  check("restauration complète : identique octet pour octet à l'état d'avant", apres === avant);
  const j = await mf.dispatchFetch(url + "admin/journal", { headers: { "x-admin-token": "jeton-e2e-tres-long-1234" } });
  check("/admin/journal avec le jeton : 200 et des entrées", j.status === 200 && (await j.json()).entrees.length >= 1);
  check("/admin/journal sans le bon jeton : 401", (await mf.dispatchFetch(url + "admin/journal", { headers: { "x-admin-token": "faux" } })).status === 401);
  check("requête depuis une autre origine : 403", (await mf.dispatchFetch(url + "api/duo-e2eabcdef/etat", { headers: { origin: "https://evil.example" } })).status === 403);
  await mf.dispose();
  console.log(`\n${ok}/${ok + ko} vérifications passent${ko ? " — " + ko + " en échec" : ""}`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(String(e).slice(0, 400)); process.exit(1); });
