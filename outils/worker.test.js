// Test du worker dans Node, sans Cloudflare : faux KV, faux fetch, environnement contrôlé.
//   node outils/worker.test.js
// Ce qu'il vérifie (temps 2 de SECURITE.md) : aucun secret dans le code, clé publique push
// injectée dans la page, routes push qui répondent 503 sans secret, jeton VAPID signé avec la
// clé de l'environnement et vérifiable avec la clé publique.
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { webcrypto: c } = require("crypto");
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? "✔" : "✘"} ${nom}${cond || detail === undefined ? "" : " — " + String(detail).slice(0, 200)}`); };

class KV {
  constructor() { this.m = new Map(); this.ecritures = 0; }
  async get(k) { return this.m.has(k) ? this.m.get(k) : null; }
  async put(k, v) { this.ecritures++; this.m.set(k, String(v)); }
  async delete(k) { this.m.delete(k); }
  async list({ prefix = "" } = {}) { return { keys: [...this.m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }; }
}
const b64u = buf => Buffer.from(buf).toString("base64url");
const deB64u = s => Buffer.from(s, "base64url");

(async () => {
  const fichier = path.join(__dirname, "..", "worker.js");
  const src = fs.readFileSync(fichier, "utf8");
  const W = (await import(pathToFileURL(fichier).href)).default;
  const appel = (env, chemin, init = {}) => W.fetch(new Request("https://levelup.test" + chemin, init), env);
  const post = (env, chemin, corps, entetes) => appel(env, chemin, { method: "POST", headers: { "content-type": "application/json", ...(entetes || {}) }, body: typeof corps === "string" ? corps : JSON.stringify(corps) });

  // paire de test, générée à la volée : aucune clé dans le dépôt
  const paire = await c.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const VAPID_PUB = b64u(await c.subtle.exportKey("raw", paire.publicKey));
  const VAPID_PRIV = Buffer.from(await c.subtle.exportKey("pkcs8", paire.privateKey)).toString("base64");
  const envNu = () => ({ NEGOS: new KV() });
  const envPush = () => ({ NEGOS: new KV(), VAPID_PUB, VAPID_PRIV, CONTACT: "test@example.org" });

  console.log("=== Secrets : rien dans le code, tout dans l'environnement ===");
  const logique = src.split("\n").slice(5).join("\n"); // la ligne 5 est la copie d'index.html
  check("aucune clé privée VAPID dans worker.js (ni constante, ni en-tête PKCS8 en base64)", !/VAPID_PRIV_PKCS8|MIGHAgEAMBMGByqGSM49/.test(src));
  check("aucune clé publique VAPID en dur : elle vient de env.VAPID_PUB", !/const VAPID_PUB = "/.test(logique) && /env\.VAPID_PUB/.test(logique));
  check("aucune clé Anthropic en dur", !/sk-ant-/.test(src));
  { const r = await appel(envPush(), "/"); const html = await r.text();
    check("la page reçoit la clé publique dans <meta name=\"vapid-pub\">", html.includes(`<meta name="vapid-pub" content="${VAPID_PUB}">`) && !html.includes("__VAPID_PUB__"));
    check("… et le contact dans <meta name=\"contact\">", html.includes('<meta name="contact" content="test@example.org">') && !html.includes("__CONTACT__")); }
  { const r = await appel(envNu(), "/"); const html = await r.text();
    check("sans variables : meta vides, jamais les espaces réservés", html.includes('<meta name="vapid-pub" content="">') && html.includes('<meta name="contact" content="">')); }

  console.log("\n=== Push : 503 sans secret, jeton VAPID signé avec le secret et vérifiable avec la clé publique ===");
  const sub = { endpoint: "https://web.push.apple.com/abc-123", expirationTime: null, keys: { p256dh: "p", auth: "a" } };
  { const env = envNu();
    const r1 = await post(env, "/api/duo-testabcd/abonner", { sub });
    check("/abonner sans VAPID → 503 non_configure", r1.status === 503 && (await r1.json()).erreur === "non_configure");
    const r2 = await post(env, "/api/duo-testabcd/testpush", {});
    check("/testpush sans VAPID → 503 non_configure", r2.status === 503);
    const r3 = await post(env, "/api/duo-testabcd/desabonner", { endpoint: sub.endpoint });
    check("/desabonner reste possible (200) : on peut toujours se retirer", r3.status === 200); }
  { const env = envPush();
    const r1 = await post(env, "/api/duo-testabcd/abonner", { sub });
    check("/abonner avec VAPID → ok, abonnement mémorisé, code indexé pour les crons", r1.status === 200 && JSON.parse(await env.NEGOS.get("duo-testabcd:subs")).length === 1 && JSON.parse(await env.NEGOS.get("idx:codes")).includes("duo-testabcd"));
    const captures = [];
    const vraiFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => { captures.push({ url: String(url), init }); return new Response("", { status: 201 }); };
    let r2, d2;
    try { r2 = await post(env, "/api/duo-testabcd/testpush", {}); d2 = await r2.json(); } finally { globalThis.fetch = vraiFetch; }
    check("/testpush → un envoi vers l'endpoint de l'abonnement", r2.status === 200 && d2.envoyes === 1 && captures.length === 1 && captures[0].url === sub.endpoint, JSON.stringify(d2));
    const auth = captures[0] && captures[0].init.headers.Authorization || "";
    const m = auth.match(/^vapid t=([^,]+), k=(.+)$/);
    check("en-tête Authorization : vapid t=<jwt>, k=<clé publique de l'environnement>", !!m && m[2] === VAPID_PUB, auth.slice(0, 40));
    if (m) {
      const [tete, corps, sig] = m[1].split(".");
      const entete = JSON.parse(deB64u(tete).toString()), charge = JSON.parse(deB64u(corps).toString());
      check("JWT : ES256, aud = origine du service push, sub = mailto:CONTACT, exp ≤ 24 h", entete.alg === "ES256" && charge.aud === "https://web.push.apple.com" && charge.sub === "mailto:test@example.org" && charge.exp > Date.now() / 1000 && charge.exp < Date.now() / 1000 + 86400, JSON.stringify(charge));
      const valide = await c.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, paire.publicKey, deB64u(sig), Buffer.from(tete + "." + corps));
      check("signature du JWT vérifiée avec la clé publique (donc signée avec env.VAPID_PRIV)", valide); }
    // cron du soir : journée non couverte → un push ; journée couverte → rien
    const envois = [];
    globalThis.fetch = async (url) => { envois.push(String(url)); return new Response("", { status: 201 }); };
    try {
      const hier = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      await env.NEGOS.put("duo-testabcd:etat", JSON.stringify({ date: hier }));
      const attentes = [];
      await W.scheduled({ cron: "0 18 * * *" }, env, { waitUntil: p => attentes.push(p) });
      await Promise.all(attentes);
      check("cron du soir : un rappel envoyé quand le dernier passage date d'hier", envois.length === 1);
      await env.NEGOS.put("duo-testabcd:etat", JSON.stringify({ date: new Date().toISOString().slice(0, 10) }));
      const attentes2 = []; envois.length = 0;
      await W.scheduled({ cron: "0 18 * * *" }, env, { waitUntil: p => attentes2.push(p) });
      await Promise.all(attentes2);
      check("cron du soir : rien si un passage a eu lieu aujourd'hui", envois.length === 0);
      const envSans = { NEGOS: env.NEGOS };
      const attentes3 = []; envois.length = 0;
      await W.scheduled({ cron: "0 18 * * *" }, envSans, { waitUntil: p => attentes3.push(p) });
      await Promise.all(attentes3);
      check("cron sans secret : aucun appel sortant", envois.length === 0);
    } finally { globalThis.fetch = vraiFetch; } }

  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ""));
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
