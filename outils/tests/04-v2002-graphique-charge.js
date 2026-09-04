// 04 — v20.2, onglet Progrès : un graphique de charge par exercice pratiqué au moins deux fois,
// points « trop dur » marqués, tri par récence, exercices remplacés sous leur propre nom.
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
  const ouvrir = async (extra) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const rep = { frequence: 4, objectif: 'muscler', muscu: 'mois', technique: 'oui', sport: null, materiel: 'salle', tempsMin: 60 };
    const prog = M.programmePourApp(rep, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x4', nom: 'Léa', role: 'coachee', solo: true, code: 'solo-testabcd' }]));
      localStorage.setItem('lvlup-actif', 'x4'); localStorage.setItem('lvlup-tour:x4', '1');
      localStorage.setItem('lvlup-s:x4', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('button', { hasText: 'Progrès' }).first().tap(); await p.waitForTimeout(800);
    return { ctx, p, prog };
  };
  const texte = p => p.evaluate(() => document.body.innerText);

  console.log('=== Graphique de charge par exercice ===');
  { const charges = {
      developpe_couche: [{ date: '2026-08-10', series: [35, 35, 35] }, { date: '2026-08-17', series: [37.5, 37.5, 37.5], ressenti: 'dur' }, { date: '2026-08-24', series: [37.5, 40, 40] }, { date: '2026-08-31', series: [40, 40, 42.5] }],
      squat: [{ date: '2026-08-12', series: [60, 60, 60] }, { date: '2026-09-02', series: [65, 65, 65] }],
      rowing_pendlay: [{ date: '2026-08-05', series: [50, 50, 50] }, { date: '2026-08-19', series: [50, 50, 50] }],
      lateral: [{ date: '2026-08-31', series: [8, 8, 8] }]
    };
    const ressentis = { squat: [{ date: '2026-09-02', r: 'dur', compose: true }] };
    const { ctx, p } = await ouvrir({ charges, ressentis });
    const t = await texte(p);
    check('un graphique par exercice pratiqué au moins deux fois (3), pas pour la note unique', (await p.locator('.graphe-charge').count()) === 3 && (await p.locator('.note-unique').count()) === 1, [await p.locator('.graphe-charge').count(), await p.locator('.note-unique').count()]);
    const noms = await p.evaluate(() => [...document.querySelectorAll('.graphe-charge')].map(g => g.innerText.split('\n')[0]));
    check('triés par récence : squat (2 sept.), développé couché (31 août), rowing Pendlay (19 août)', /^Squat barre/.test(noms[0]) && /^Développé couché/.test(noms[1]) && /^Rowing Pendlay/.test(noms[2]), noms.join(' | '));
    check('un exercice absent du programme (remplacé) apparaît sous son propre nom, pris dans la banque', /Rowing Pendlay/.test(t));
    check('chaque carte reprend le carnet : nombre de séances, dernière date, record', /4 séances · dernier : 31\/08 · record : 42,5 kg/.test(t) && /2 séances · dernier : 02\/09 · record : 65 kg/.test(t), t.slice(t.indexOf('Ton carnet'), t.indexOf('Ton carnet') + 300));
    check('la charge de travail par séance est la meilleure série (42,5 kg pour la dernière du développé couché)', await p.evaluate(() => [...document.querySelectorAll('.graphe-charge')].some(g => /42,5 kg/.test(g.innerText))));
    check('les points « trop dur » sont marqués discrètement : un sur le développé (entrée), un sur le squat (ressenti du jour)', (await p.locator('.graphe-charge .point-dur').count()) === 2 && /séance ressentie « trop dur »/.test(t));
    check('record : badge PR sur le développé (dernière = meilleure), pas sur le Pendlay (à plat)', await p.evaluate(() => { const g = [...document.querySelectorAll('.graphe-charge')]; const dc = g.find(x => /Développé couché/.test(x.innerText)), rp = g.find(x => /Pendlay/.test(x.innerText)); return /PR/.test(dc.innerText) && !/PR/.test(rp.innerText); }));
    check('courbe SVG lisible sur mobile : viewBox, axe des kg (min / max) et dates aux extrémités', await p.evaluate(() => { const s = document.querySelector('.graphe-charge svg'); const tx = [...s.querySelectorAll('text')].map(x => x.textContent); return s.getAttribute('viewBox') && s.clientWidth > 250 && s.clientWidth <= 390 && tx.includes('65') && tx.includes('60') && tx.includes('12/08') && tx.includes('02/09'); }));
    check('la note unique liste nom, date et charge', await p.evaluate(() => /Élévations latérales.*31\/08.*8 \/ 8 \/ 8 kg/s.test(document.querySelector('.note-unique').innerText)));
    check('l\'ancien carnet n\'est plus dupliqué en dessous', !/dernières charges notées/.test(t));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({});
    check('sans charge notée : message d\'invitation, pas de graphique', (await p.locator('.graphe-charge').count()) === 0 && /Rien encore/.test(await texte(p)));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
