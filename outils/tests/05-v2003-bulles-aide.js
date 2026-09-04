// 05 — v20.3, les bulles d'aide : six textes réécrits, accordés à la préférence elle / il / neutre,
// variante solo pour Récompenses, et le tour des onglets pour qui ouvre l'app la première fois.
// Lancer via node outils/tests/lancer.js (mock sur 8323)
const { chromium } = require('playwright');
const M = require('../../moteur-programmes.js');
const banque = require('../../banque-exercices.json');
const U = 'http://127.0.0.1:8323/app.html';
const jour = new Date().toISOString().slice(0, 10);
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? '✔' : '✘'} ${nom}${cond || detail === undefined ? '' : ' — ' + String(detail).slice(0, 220)}`); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const ouvrir = async ({ adresse, solo, role }) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = M.programmePourApp({ frequence: 3, objectif: 'mieux', muscu: 'jamais', technique: 'pas_sur', materiel: 'salle', tempsMin: 60 }, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x5', nom: 'Sam', role: ex.role || 'coachee', solo: !!ex.solo, code: 'duo-testabcd' }]));
      localStorage.setItem('lvlup-actif', 'x5'); localStorage.setItem('lvlup-tour:x5', '1');
      localStorage.setItem('lvlup-s:x5', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: {}, xp: 100, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: ex.adresse, vus: {} }));
    }, [{ prog, adresse, solo, role }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    return { ctx, p };
  };
  // la bulle = le contenu de la mise en avant qui porte le bouton « C'est clair »
  const bulle = p => p.evaluate(() => { const f = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === "C'est clair"); return f ? f.parentElement.innerText : ''; });
  const fermer = async p => { await p.locator('button', { hasText: /^C'est clair$/ }).first().tap(); await p.waitForTimeout(400); };
  const onglet = async (p, nom) => { await p.locator('button', { hasText: nom }).first().tap(); await p.waitForTimeout(700); };

  console.log('=== Coachée en duo, préférence « elle » : le tour des quatre onglets ===');
  { const { ctx, p } = await ouvrir({ adresse: 'elle', solo: false });
    let t = await bulle(p);
    check('Séance : consigne, photo, ressenti facile / juste / trop dur, « On ajuste », Repos', /touche un exercice pour le déplier/.test(t) && /facile, juste ou trop dur/.test(t) && /On ajuste/.test(t) && /coche Repos/.test(t), t.slice(0, 200));
    check('titre « Ta base »', /Ta base/.test(t));
    await fermer(p); await onglet(p, 'Habitudes');
    t = await bulle(p);
    check('Habitudes : 5 XP, une seule suffit, accordée au féminin (« fatiguée »)', /5 XP chacune/.test(t) && /Une seule cochée suffit/.test(t) && /même fatiguée\./.test(t), t.slice(0, 200));
    await fermer(p); await onglet(p, 'Progrès');
    t = await bulle(p);
    check('Progrès : niveau, badges, courbe de charge, jours trop durs', /courbe de charge/.test(t) && /balance connectée/.test(t) && /jours trop durs/.test(t), t.slice(0, 200));
    await fermer(p); await onglet(p, 'Récomp.');
    t = await bulle(p);
    check('Récompenses en duo : coach, négos (un aller-retour), paris, cagnotte, accordée (« attendue »)', /récompenses de ton coach/.test(t) && /un aller-retour, pas plus/.test(t) && /paries/.test(t) && /cagnotte/.test(t) && /attendue\./.test(t), t.slice(0, 220));
    check('une seule idée par bulle : quatre phrases au plus', t.split(/[.!?]\s/).length <= 6);
    await fermer(p);
    check('fermée une fois, la bulle ne revient pas sur l\'onglet', !/C'est clair/.test(await p.evaluate(() => document.body.innerText)));
    await ctx.close(); }

  console.log('\n=== Préférence « il » et « neutre » ===');
  { const { ctx, p } = await ouvrir({ adresse: 'il', solo: false });
    await fermer(p); await onglet(p, 'Habitudes');
    const t = await bulle(p);
    check('« il » : « même fatigué. »', /même fatigué\./.test(t), t.slice(0, 200));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ adresse: 'neutre', solo: true });
    await fermer(p); await onglet(p, 'Habitudes');
    let t = await bulle(p);
    check('« neutre » : point médian conservé (« fatigué·e »)', /fatigué·e/.test(t), t.slice(0, 200));
    await fermer(p); await onglet(p, 'Récomp.');
    t = await bulle(p);
    check('solo : variante sans coach, ni négos, ni paris, ni cagnotte — mini-kifs mentionnés', /que tu t'offres/.test(t) && /mini-kifs/.test(t) && !/coach/.test(t) && !/négoci/.test(t) && !/cagnotte/.test(t), t.slice(0, 220));
    await ctx.close(); }

  console.log('\n=== Coach : Suivi et ses outils ===');
  { const { ctx, p } = await ouvrir({ adresse: 'il', role: 'coach' });
    let t = await bulle(p);
    check('Suivi : XP, séances, jokers, photos, et le petit mot', /Son aventure en direct/.test(t) && /photos de preuve/.test(t) && /Un petit mot au bon moment/.test(t), t.slice(0, 220));
    await fermer(p); await onglet(p, 'Négos');
    t = await bulle(p);
    check('Outils de coach : une seule contre-offre, paris, cagnotte, « tenir la barre »', /une seule contre-offre/.test(t) && /paris/.test(t) && /cagnotte/.test(t) && /tenir la barre/.test(t), t.slice(0, 220));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
