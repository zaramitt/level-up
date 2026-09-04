// 01 — SÉCURITÉ : aucun profil existant ne change de programme sans action explicite (v20.0, option b).
// Un profil d'avant le moteur garde son programme au chargement, pendant l'aperçu, après un refus et après rechargement.
// Lancer via node outils/tests/lancer.js (ou seul : mock sur 8323, puis node 01-securite-profils-existants.js)
const { chromium } = require('playwright');
const M = require('../../moteur-programmes.js');
const banque = require('../../banque-exercices.json');
const U = 'http://127.0.0.1:8323/app.html';
const U_IAOFF = 'http://127.0.0.1:8324/app.html';
const jour = new Date().toISOString().slice(0, 10);
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? '✔' : '✘'} ${nom}${cond || detail === undefined ? '' : ' — ' + String(detail).slice(0, 200)}`); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const nouveauCtx = async () => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    return { ctx, p };
  };
  // profil d'avant le moteur : programme template « fessiers », des charges notées
  const seedAncien = (extraState = {}) => ([ex, jk]) => {
    if (localStorage.getItem('lvlup-actif')) return;
    localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x1', nom: 'Léa', role: 'coachee', solo: true, code: 'solo-testabcd' }]));
    localStorage.setItem('lvlup-actif', 'x1'); localStorage.setItem('lvlup-tour:x1', '1');
    localStorage.setItem('lvlup-s:x1', JSON.stringify({ programme: 'fessiers', xp: 500, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: { goblet: [{ date: '2026-08-20', series: [12, 12, 14] }], squat: [{ date: '2026-08-22', series: [40, 40, 45] }] }, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'elle', vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex }));
  };
  const ouvrir = async (seed, url = U) => {
    const { ctx, p } = await nouveauCtx();
    if (seed) await p.addInitScript(seed, [{}, jour]);
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p };
  };
  const texte = p => p.evaluate(() => document.body.innerText);
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:' + localStorage.getItem('lvlup-actif'))));
  // la bulle d'aide du premier passage sur un onglet : on la ferme quand elle est là
  // après la création d'un profil : tour de bienvenue et bulles d'aide marqués comme vus (comme
  // une utilisatrice qui les a fermés), puis rechargement — le test porte sur le programme, pas sur le tour
  const fermerAide = async p => {
    await p.evaluate(() => { const pid = localStorage.getItem('lvlup-actif'); localStorage.setItem('lvlup-tour:' + pid, '1'); const k = 'lvlup-s:' + pid; const st = JSON.parse(localStorage.getItem(k) || '{}'); st.vus = { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }; localStorage.setItem(k, JSON.stringify(st)); });
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1400);
  };
  const tap = async (p, t, n = 0) => { await p.locator('button', { hasText: t }).nth(n).tap(); await p.waitForTimeout(450); };
  // répond aux questions du programme, dans l'ordre affiché
  const repondre = async (p, r) => {
    await tap(p, r.frequence === 7 ? '7 jours' : `${r.frequence} séance`);
    await tap(p, r.objectifLabel);
    if (r.libre) { await p.locator('textarea').fill(r.libre); await tap(p, 'Continuer'); }
    await tap(p, r.muscu); await tap(p, r.technique);
    await tap(p, r.sport || 'Non, pas en ce moment');
    if (r.sport) { await tap(p, r.intention || 'Pour moi'); if (r.jours) for (const j of r.jours) await tap(p, j); await tap(p, 'Continuer'); }
    if (r.raccourci) await tap(p, r.raccourci);
    await tap(p, 'Continuer');
    if (r.temps) { await p.locator('input[type=number]').fill(String(r.temps)); await p.waitForTimeout(200); }
    await tap(p, 'Voir mon programme');
  };

  console.log('=== E. Sécurité — aucun profil existant ne change de programme sans action explicite ===');
  { const { ctx, p } = await ouvrir(seedAncien());
    let st = await etat(p);
    check('au chargement, le programme template est intact', st.programme === 'fessiers' && !st.programmePerso && !st.reponses, JSON.stringify([st.programme, !!st.programmePerso]));
    const t = await texte(p);
    check('la carte « Nouveau moteur de programmes » est proposée dans l\'onglet Séance', /Nouveau moteur de programmes/.test(t));
    check('les séances de l\'ancien programme s\'affichent toujours (cartes A-D)', (await p.locator('.carte-seance').count()) === 4, await p.locator('.carte-seance').count());
    await p.locator('.carte-migration').tap(); await p.waitForTimeout(600);
    let t2 = await texte(p);
    check('le tap ouvre les questions, étiquetées NOUVEAU MOTEUR, fréquence pré-remplie à 4 (le programme actuel a 4 séances)', /NOUVEAU MOTEUR/.test(t2) && /Combien de séances/.test(t2) && await p.evaluate(() => [...document.querySelectorAll('button')].some(b => /4 séances/.test(b.textContent) && /rgba\(124, 92, 255/.test(getComputedStyle(b).backgroundColor))));
    await repondre(p, { frequence: 4, objectifLabel: 'Me tonifier', muscu: 'Quelques mois', technique: 'Oui' });
    t2 = await texte(p);
    check('un APERÇU complet est montré : titre, semaine, séances A-D avec durées, deux boutons', /TON NOUVEAU PROGRAMME/.test(t2) && /Adopter ce programme/.test(t2) && /Garder l'ancien/.test(t2) && /min/.test(t2) && (await p.locator('button[aria-expanded]').count()) >= 4);
    st = await etat(p);
    check('pendant l\'aperçu, rien n\'a été écrit dans le profil', st.programme === 'fessiers' && !st.programmePerso && !st.reponses);
    await tap(p, "Garder l'ancien");
    st = await etat(p);
    check('« Garder l\'ancien » : programme intact, refus mémorisé', st.programme === 'fessiers' && st.moteurRefuse === true && !st.reponses, JSON.stringify([st.programme, st.moteurRefuse]));
    check('la carte n\'est plus proposée', !/Nouveau moteur de programmes — veux-tu/.test(await texte(p)));
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    check('elle reste accessible dans les réglages', /régénérer le mien/.test(await texte(p)));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    st = await etat(p);
    check('après rechargement : toujours l\'ancien programme, toujours pas de carte', st.programme === 'fessiers' && !/veux-tu régénérer/.test(await texte(p)));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
