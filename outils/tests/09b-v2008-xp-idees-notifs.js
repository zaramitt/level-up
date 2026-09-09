// 09b — v20.8 : barème d'XP selon la difficulté (10 / 15 / 20), cartes et pastilles qui suivent ; idées de
// récompenses avec leur ligne « Concrètement » ; notifications de séance planifiées (repos, relance),
// annulées à la clôture ; clôture automatique après 3 h sans activité.
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
  const texte = p => p.evaluate(() => document.body.innerText);
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:xb')));
  const planifs = async () => (await fetch('http://127.0.0.1:8323/__planifs')).json();
  const ouvrir = async ({ rep, extra = {}, solo = true, code = 'solo-xpidee9ab' } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = M.programmePourApp(rep, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'xb', nom: 'Sam', role: 'coachee', solo: ex.solo, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'xb'); localStorage.setItem('lvlup-tour:xb', '1');
      localStorage.setItem('lvlup-s:xb', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra, solo, code }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p, prog };
  };
  const ppl = { frequence: 6, objectif: 'muscler', muscu: 'an', technique: 'oui', materiel: 'salle', tempsMin: 60 };
  const xpDe = e => e.difficulte === 1 ? 10 : e.difficulte === 3 ? 20 : 15;

  console.log('=== 12. XP selon la difficulté : cartes, pastilles, validation, récap ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    const attendu = A.exos.reduce((a, e) => a + xpDe(e), 0) + 40 + (A.gainage.length ? A.gainage.length * 5 + 15 : 0);
    check('les exercices du programme portent leur difficulté (1, 2 ou 3) et il y en a d\'au moins deux valeurs', A.exos.every(e => [1, 2, 3].includes(e.difficulte)) && new Set(A.exos.map(e => e.difficulte)).size >= 2, A.exos.map(e => e.nom + ':' + e.difficulte).join(', '));
    const carte = await p.locator('.carte-seance').first().innerText();
    check(`la carte annonce « jusqu'à ${attendu} XP » (somme des 10 / 15 / 20 + bonus)`, new RegExp("jusqu'à " + attendu + " XP").test(carte), carte.replace(/\n/g, ' | '));
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    const t = await texte(p);
    const mn = Math.min(...A.exos.map(xpDe)), mx = Math.max(...A.exos.map(xpDe));
    check(`l'en-tête dit « ${mn} à ${mx} XP par exercice »`, t.includes(`${mn} à ${mx} XP par exercice`));
    const pastilles = await p.evaluate(() => [...document.querySelectorAll('button[aria-expanded]')].map(b => (b.innerText.match(/\+(\d+) XP/) || [])[1]).filter(Boolean)); // les cadres de gainage n'ont pas de pastille
    check('chaque ligne porte sa pastille : +10 / +15 / +20 selon la difficulté', JSON.stringify(pastilles.map(Number)) === JSON.stringify(A.exos.map(xpDe)), pastilles.join(','));
    const exo = A.exos.find(e => e.difficulte === 3) || A.exos[0];
    await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.click(); }, exo.nom); await p.waitForTimeout(500);
    await p.locator('.focus-exercice button', { hasText: /^✓$/ }).tap(); await p.waitForTimeout(700);
    const st = await etat(p);
    check(`validé sans photo : ${xpDe(exo) - 5} XP (5 de moins que ${xpDe(exo)}), mémorisés sur la séance`, st.xp === 300 + xpDe(exo) - 5 && st.jour[jour].xpExos[exo.id] === xpDe(exo) - 5, st.xp);
    check('la dernière activité est horodatée', typeof st.jour[jour].activite === 'number' && Date.now() - st.jour[jour].activite < 60000);
    // la validation referme le focus d'elle-même
    await p.locator('button', { hasText: 'Terminer la séance' }).tap(); await p.waitForTimeout(900);
    const t2 = await texte(p);
    check(`récap : « 1 exercice validé = ${xpDe(exo) - 5} XP (10 à 20 XP selon la difficulté) »`, t2.includes(`1 exercice validé = ${xpDe(exo) - 5} XP`) && /10 à 20 XP selon la difficulté/.test(t2), t2.slice(t2.indexOf('Séance enregistrée'), t2.indexOf('Séance enregistrée') + 200));
    await ctx.close(); }

  console.log('\n=== 11. Idées de récompenses : ligne « Concrètement », gardée avec la récompense ===');
  { const { ctx, p } = await ouvrir({ rep: ppl });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(900);
    await p.locator('button', { hasText: 'Générer des idées de récompenses' }).tap(); await p.waitForTimeout(1200);
    check('chaque idée affiche son titre, son niveau et « Concrètement : … »', (await p.locator('.idee').count()) === 8 && (await p.locator('.idee .idee-concret').count()) === 8 && /Concrètement : ce qui se passe vraiment pour l'idée 1/.test(await p.locator('.idee').first().innerText()));
    await p.locator('.idee').first().tap(); await p.waitForTimeout(600);
    const st = await etat(p);
    check('ajoutée : la récompense garde sa ligne concrète', st.recompenses.some(r => /Idée factice 1/.test(r.label) && /pour l'idée 1/.test(r.concret)));
    check('… et la carte de la récompense la montre', (await p.locator('.recompense-concret').count()) >= 1 && /Concrètement : ce qui se passe vraiment/.test(await p.locator('.recompense-concret').first().innerText()));
    await ctx.close(); }

  console.log('\n=== 10. Notifications de séance : repos planifié puis annulé, relance à +18 min, annulée à la clôture ===');
  { await fetch('http://127.0.0.1:8323/__reset');
    const { ctx, p, prog } = await ouvrir({ rep: ppl, extra: { reglages: { photoOblig: false, decay: false, sons: false, rappels: true } } });
    const A = prog.seances.A; const exo = A.exos[0];
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.click(); }, exo.nom); await p.waitForTimeout(500);
    await p.locator('.focus-exercice .bouton-repos').tap(); await p.waitForTimeout(700);
    let l = await planifs();
    const repos = l.find(x => x.type === 'repos' && x.quand);
    check(`repos lancé → /planifier {type:"repos", quand ≈ maintenant + ${exo.repos} s}`, !!repos && Math.abs(repos.quand - (Date.now() + exo.repos * 1000)) < 5000, JSON.stringify(l));
    await p.locator('.focus-exercice button', { hasText: /^✓$/ }).tap(); await p.waitForTimeout(700);
    l = await planifs();
    const relance = l.find(x => x.type === 'relance' && x.quand);
    check('exercice validé → relance planifiée à +18 min', !!relance && Math.abs(relance.quand - (Date.now() + 18 * 60000)) < 5000, JSON.stringify(l));
    // le repos se termine à l'écran : l'app annule la notification du serveur
    await p.evaluate(() => { const orig = Date.now; Date.now = () => orig() + 10 * 60000; }); await p.waitForTimeout(900);
    l = await planifs();
    check('repos écoulé à l\'écran → /planifier {type:"repos", quand:null} (annulation)', l.some(x => x.type === 'repos' && x.quand === null), JSON.stringify(l));
    await p.locator('button', { hasText: 'Terminer la séance' }).tap(); await p.waitForTimeout(900);
    l = await planifs();
    check('séance terminée → la relance est annulée', l.filter(x => x.type === 'relance').pop().quand === null, JSON.stringify(l.filter(x => x.type === 'relance')));
    await ctx.close(); }
  { await fetch('http://127.0.0.1:8323/__reset');
    const { ctx, p } = await ouvrir({ rep: ppl });
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await p.evaluate(() => { document.querySelector('button[aria-expanded]').click(); }); await p.waitForTimeout(400);
    await p.locator('.focus-exercice .bouton-repos').tap(); await p.waitForTimeout(700);
    check('rappels désactivés : aucun appel à /planifier', (await planifs()).length === 0);
    await ctx.close(); }

  console.log('\n=== 10. Clôture automatique après 3 h sans activité, comme partielle ===');
  { const prog = M.programmePourApp(ppl, banque);
    const ex = prog.seances.A.exos[0];
    const { ctx, p } = await ouvrir({ rep: ppl, extra: { jour: { [jour]: { seance: 'A', faits: [ex.id], gainage: [], valide: false, gainValide: false, photos: {}, activite: Date.now() - 4 * 3600000 } } } });
    const st = await etat(p);
    check('au chargement, 4 h après le dernier exercice : séance enregistrée comme partielle, au compteur, marquée auto', st.jour[jour].valide === true && st.jour[jour].partiel === true && st.jour[jour].autoInactivite === true && st.histo.some(h => h.date === jour && h.type === 'A' && h.partiel && h.auto) && st.activeDays[jour] === true, JSON.stringify(st.jour[jour]));
    check('le toast le dit : « 3 h sans activité — venir compte »', /3 h sans activité/.test(await texte(p)));
    check('plus de barre « Terminer la séance »', (await p.locator('button', { hasText: 'Terminer la séance' }).count()) === 0);
    await ctx.close(); }
  { const prog = M.programmePourApp(ppl, banque);
    const ex = prog.seances.A.exos[0];
    const { ctx, p } = await ouvrir({ rep: ppl, extra: { jour: { [jour]: { seance: 'A', faits: [ex.id], gainage: [], valide: false, gainValide: false, photos: {}, activite: Date.now() - 30 * 60000 } } } });
    const st = await etat(p);
    check('30 min après : rien ne bouge, la séance reste ouverte', st.jour[jour].valide === false && (await p.locator('button', { hasText: 'Terminer la séance' }).count()) === 1);
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
