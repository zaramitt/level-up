#!/usr/bin/env node
// Amorçage du KV de test depuis une sauvegarde R2 de production (v20.13) — voir SECURITE.md,
// section « Restauration d'essai et amorçage du KV de test ». C'est aussi la restauration d'essai :
// une vraie sauvegarde, un vrai namespace, vérification par l'app sur l'URL de test.
//
//   node outils/amorcer-test.js <sauvegarde.json> --prenoms Léo,Zara --compte <ACCOUNT_ID> --namespace <KV_TEST_ID> --jeton <CF_API_TOKEN>
//   node outils/amorcer-test.js <sauvegarde.json> --prenoms Léo,Zara --bulk amorcage.json     (puis wrangler kv bulk put --namespace-id=<KV_TEST_ID> --env test amorcage.json)
//
// Ce qui est écarté d'office : les abonnements push (`<code>:subs`, la paire VAPID de test est différente et
// les téléphones de production ne doivent pas recevoir les pushs de test), les planifications en cours
// (`planif:index`), les compteurs de quota (`quota:*`), et les photos (`<code>:photo:*`) sauf --photos.
// Ce qui est anonymisé : chaque prénom passé à --prenoms, partout où il apparaît dans une chaîne (récompenses,
// mots de négo, motifs de pause, notes de cagnotte, mises de pari…), remplacé par un pseudonyme fixe —
// le premier prénom devient « Alex », le deuxième « Sam », etc. Les prénoms eux-mêmes ne sont pas stockés
// côté serveur (liste blanche de /etat) : c'est dans les textes libres qu'ils peuvent traîner.
// Les codes duo sont conservés : Léo se connecte sur l'URL de test avec son code habituel.
const fs = require("fs");
const { lireSauvegarde, versBulk, restaurerParApi } = require("./restaurer.js");

const PSEUDONYMES = ["Alex", "Sam", "Charlie", "Lou", "Noa", "Camille", "Eden", "Sacha"];
const sansAccent = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// un motif par prénom, insensible à la casse et aux accents, borné par des non-lettres
const motifs = (prenoms) => prenoms.map((p, i) => {
  const lettres = [...sansAccent(p).toLowerCase()].map(c => {
    const variantes = { a: "aàâä", e: "eéèêë", i: "iîï", o: "oôö", u: "uùûü", c: "cç", y: "yÿ" }[c];
    return variantes ? "[" + variantes + variantes.toUpperCase() + "]" : c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");
  return { re: new RegExp("(^|[^\\p{L}])(" + lettres + ")(?=[^\\p{L}]|$)", "giu"), par: PSEUDONYMES[i % PSEUDONYMES.length] };
});
const anonymiserTexte = (t, ms) => ms.reduce((s, m) => s.replace(m.re, (_, avant) => avant + m.par), t);
const anonymiserValeur = (v, ms) => {
  if (typeof v === "string") return anonymiserTexte(v, ms);
  if (Array.isArray(v)) return v.map(x => anonymiserValeur(x, ms));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, anonymiserValeur(x, ms)]));
  return v;
};
const ECARTEES = (cle, photos) => /:subs$/.test(cle) || cle === "planif:index" || cle.startsWith("quota:") || (!photos && /:photo:/.test(cle));
// prépare les données à écrire dans le KV de test : filtre, puis anonymise chaque valeur JSON
const preparer = (donnees, { prenoms = [], photos = false } = {}) => {
  const ms = motifs(prenoms.filter(Boolean));
  const sortie = {}, bilan = { gardees: 0, ecartees: 0, modifiees: 0 };
  for (const [k, v] of Object.entries(donnees)) {
    if (ECARTEES(k, photos)) { bilan.ecartees++; continue; }
    let nv = v;
    if (ms.length && !/:photo:/.test(k)) {
      try { const j = JSON.parse(v); nv = JSON.stringify(anonymiserValeur(j, ms)); } catch { nv = anonymiserTexte(v, ms); }
    }
    if (nv !== v) bilan.modifiees++;
    sortie[k] = nv; bilan.gardees++;
  }
  return { donnees: sortie, bilan };
};

if (require.main === module) {
  const a = process.argv.slice(2);
  const opt = (nom) => { const i = a.indexOf(nom); return i >= 0 ? a[i + 1] : null; };
  const fichier = a[0];
  if (!fichier || fichier.startsWith("--")) {
    console.error("usage : node outils/amorcer-test.js <sauvegarde.json> --prenoms Léo,Zara [--photos] [--bulk sortie.json | --compte ID --namespace ID --jeton TOKEN]");
    process.exit(2);
  }
  (async () => {
    const s = lireSauvegarde(fs.readFileSync(fichier, "utf8"));
    const prenoms = (opt("--prenoms") || "").split(",").map(x => x.trim()).filter(Boolean);
    if (!prenoms.length) console.warn("attention : aucun prénom à anonymiser (--prenoms) — les textes libres partent tels quels");
    const { donnees, bilan } = preparer(s.donnees, { prenoms, photos: a.includes("--photos") });
    console.log(`sauvegarde du ${s.date} : ${s.cles} clés ; gardées ${bilan.gardees}, écartées ${bilan.ecartees} (abonnements, planifications, quotas${a.includes("--photos") ? "" : ", photos"}), anonymisées ${bilan.modifiees}`);
    if (!bilan.gardees) { console.error("rien à écrire"); process.exit(1); }
    if (opt("--jeton")) {
      if (opt("--namespace") === "b01ca4e9f02549828073664575d5eaf8") { console.error("refus : c'est le namespace de production, pas celui de test"); process.exit(1); }
      const n = await restaurerParApi(donnees, { compte: opt("--compte"), namespace: opt("--namespace"), jeton: opt("--jeton") });
      console.log(`${n} clés écrites dans le KV de test — ouvre l'URL de test avec ton code pour vérifier`);
    } else {
      const sortie = opt("--bulk") || "amorcage.json";
      fs.writeFileSync(sortie, JSON.stringify(versBulk(donnees)));
      console.log(`${bilan.gardees} clés écrites dans ${sortie} — puis : npx wrangler kv bulk put --namespace-id=<KV_TEST_ID> ${sortie}`);
    }
  })().catch(e => { console.error(e.message); process.exit(1); });
}
module.exports = { preparer, anonymiserTexte, motifs, PSEUDONYMES };
