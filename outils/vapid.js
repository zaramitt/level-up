// Génère une paire de clés VAPID (courbe P-256) pour les notifications push.
//
//   node outils/vapid.js
//
// Affiche deux valeurs à coller dans le dashboard Cloudflare (Workers & Pages → level-up →
// Settings → Variables and Secrets) :
//   VAPID_PUB   type « Text »   — la clé publique, le navigateur en a besoin pour s'abonner
//   VAPID_PRIV  type « Secret » — la clé privée, ne la colle nulle part ailleurs
// Aucune des deux ne va dans le code : le worker les lit dans son environnement et injecte la
// clé publique dans la page. Changer de paire invalide les abonnements existants : l'app propose
// alors de réactiver les rappels en un tap.
const { webcrypto } = require("crypto");
(async () => {
  const paire = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pub = Buffer.from(await webcrypto.subtle.exportKey("raw", paire.publicKey)).toString("base64url");
  const priv = Buffer.from(await webcrypto.subtle.exportKey("pkcs8", paire.privateKey)).toString("base64");
  console.log("Nouvelle paire VAPID — à coller dans le dashboard Cloudflare, puis redéployer.\n");
  console.log("VAPID_PUB  (Text)   : " + pub);
  console.log("VAPID_PRIV (Secret) : " + priv);
  console.log("\nNe commite jamais VAPID_PRIV. Ferme ce terminal une fois les valeurs collées.");
})();
