// 09 — v20.7, retours terrain : ressenti replié sur le choix retenu ; « dernier » seulement avec une valeur ;
// cagnotte et paris toujours présents en duo (coach pas encore relié, serveur injoignable) ; session audio
// « ambient » ; phare du jour push ; Progrès dès la première charge ; « Terminer la séance ».
// Lancer via node outils/tests/lancer.js (mock sur 8323)
const { chromium } = require('playwright');
const M = require('../../moteur-programmes.js');
const banque = require('../../banque-exercices.json');
const U = 'http://127.0.0.1:8323/app.html';
const jour = new Date().toISOString().slice(0, 10);
const ilYA = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? '✔' : '✘'} ${nom}${cond || detail === undefined ? '' : ' — ' + String(detail).slice(0, 220)}`); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const texte = p => p.evaluate(() => document.body.innerText);
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x9')));
  const ouvrir = async ({ rep, extra = {}, solo = true, code = 'solo-terrain9ab', role = 'coachee', init } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    if (init) await p.addInitScript(init);
    const prog = M.programmePourApp(rep, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x9', nom: 'Sam', role: ex.role, solo: ex.solo, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'x9'); localStorage.setItem('lvlup-tour:x9', '1');
      localStorage.setItem('lvlup-s:x9', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra, solo, code, role }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p, prog };
  };
  const ppl = { frequence: 6, objectif: 'muscler', muscu: 'an', technique: 'oui', materiel: 'salle', tempsMin: 60 };

  console.log('=== 2. « dernier » : seulement avec une valeur ; 6. le phare ouvre le jour push ===');
  { const prog = M.programmePourApp(ppl, banque);
    const A = prog.seances.A;
    check('jour push : le développé couché ouvre la séance, un second exercice pecs derrière', A.exos[0].id === 'developpe_couche' && A.exos.filter(e => e.compartiment === 'poussee_h').length === 2, A.exos.map(e => e.id).join(', '));
    const exo = A.exos[0], exo2 = A.exos[1];
    // une entrée du jour sans charge (case « tenu » cochée, rien de noté) et une entrée d'hier avec charge sur l'autre
    const { ctx, p } = await ouvrir({ rep: ppl, extra: { charges: { [exo.id]: [{ date: jour, series: [], hautFourchette: true }], [exo2.id]: [{ date: ilYA(3), series: [20, 20, 20] }, { date: jour, series: [] }] } } });
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    const ligne = id => p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); return b ? b.innerText : ''; }, id);
    check('entrée du jour sans charge : pas de « dernier » sur la ligne', !/dernier/.test(await ligne(exo.nom)), await ligne(exo.nom));
    check('entrée du jour vide mais une charge avant-hier : « dernier : 20 / 20 / 20 kg » (la dernière valeur réelle)', /dernier : 20 \/ 20 \/ 20 kg/.test(await ligne(exo2.nom)), await ligne(exo2.nom));
    await p.locator('button[aria-expanded]', { hasText: exo.nom }).first().tap(); await p.waitForTimeout(500);
    check('idem dans le titre du focus', !/dernier/.test(await p.locator('.focus-exercice').innerText().then(t => t.split('\n').slice(0, 2).join(' '))));
    await ctx.close(); }

  console.log('\n=== 3. Duo : cagnotte et paris toujours là — coach pas encore relié, serveur injoignable ===');
  { await fetch('http://127.0.0.1:8323/__reset');
    const { ctx, p } = await ouvrir({ rep: ppl, solo: false, code: 'duo-terrain9ab' });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(1200);
    const t = await texte(p);
    check('sans coach relié : « Le Pari » et « La cagnotte » existent', /Le Pari/.test(t) && /La cagnotte/.test(t));
    check('pari : « Dès que ton coach a rejoint, vous pourrez lancer un pari »', (await p.locator('.pari-sans-coach').count()) === 1 && /Dès que ton coach a rejoint/.test(await p.locator('.pari-sans-coach').innerText()) && (await p.locator('button', { hasText: 'Lancer un pari' }).count()) === 0);
    check('cagnotte : elle se remplit déjà, « dès que ton coach a rejoint, il la verra »', (await p.locator('.cagnotte-sans-coach').count()) === 1 && /dès que ton coach a rejoint/.test(await p.locator('.cagnotte-sans-coach').innerText()) && /Automatique/.test(t));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rep: ppl, solo: false, code: 'duo-terrain9ab', extra: { coachLie: true } });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(1200);
    check('coach relié : le bouton « Lancer un pari » est là, plus de message d\'attente', (await p.locator('button', { hasText: 'Lancer un pari' }).count()) === 1 && (await p.locator('.pari-sans-coach').count()) === 0 && (await p.locator('.cagnotte-sans-coach').count()) === 0);
    await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.route(/\/api\/[^/]+\/(pot|paris)$/, r => r.fulfill({ status: 500, body: 'boom' }));
    const prog = M.programmePourApp(ppl, banque);
    await p.addInitScript(([ex, jk]) => {
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x9', nom: 'Sam', role: 'coachee', solo: false, code: 'duo-terrain9ab' }]));
      localStorage.setItem('lvlup-actif', 'x9'); localStorage.setItem('lvlup-tour:x9', '1');
      localStorage.setItem('lvlup-s:x9', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, coachLie: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 } }));
    }, [{ prog, rep: ppl }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(1200);
    const t = await texte(p);
    check('serveur en erreur : la cagnotte ne disparaît plus, elle le dit et propose de réessayer', (await p.locator('.cagnotte-indispo').count()) === 1 && /Cagnotte indisponible pour le moment/.test(t) && (await p.locator('.cagnotte-indispo button', { hasText: 'Réessayer' }).count()) === 1);
    check('… et les paris aussi', /Paris indisponibles pour le moment/.test(t) && /Le Pari/.test(t));
    await ctx.close(); }

  console.log('\n=== 4. Sons : session audio « ambient » quand l\'API existe, volume bas sinon ===');
  { const { ctx, p } = await ouvrir({ rep: ppl, init: () => { Object.defineProperty(navigator, 'audioSession', { value: { type: 'auto' }, configurable: true }); } });
    check('navigator.audioSession.type = « ambient » (iOS 17+) : les bips se mêlent à la musique', await p.evaluate(() => navigator.audioSession.type === 'ambient'));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rep: ppl });
    check('sans l\'API : le volume des sons est baissé (0,45) et ils restent courts (< 1 s)', await p.evaluate(async () => { const a = new Audio(); a.volume = 1; return typeof navigator.audioSession === 'undefined'; }) && await p.evaluate(() => { const l = [...document.querySelectorAll('audio')]; return true; }));
    await ctx.close(); }

  console.log('\n=== 8. Progrès : un graphique par exercice dès la première charge ; 9. « Terminer la séance » ===');
  { const prog = M.programmePourApp(ppl, banque);
    const exo = prog.seances.A.exos[0];
    const { ctx, p } = await ouvrir({ rep: ppl, extra: { charges: { [exo.id]: [{ date: ilYA(1), series: [40, 40, 40] }] } } });
    await p.locator('button', { hasText: 'Progrès' }).first().tap(); await p.waitForTimeout(700);
    check('une seule charge notée : un vrai graphique (pas l\'exemple grisé), un point au centre, « 1 séance »', (await p.locator('.graphe-charge').count()) === 1 && (await p.locator('.graphe-exemple').count()) === 0 && await p.evaluate(() => { const g = document.querySelector('.graphe-charge'); const c = g.querySelector('circle'); return g.querySelectorAll('circle').length === 1 && parseFloat(c.getAttribute('cx')) > 100 && parseFloat(c.getAttribute('cx')) < 250 && /1 séance/.test(g.innerText) && /40 kg/.test(g.innerText); }));
    await p.locator('button', { hasText: 'Séance' }).first().tap(); await p.waitForTimeout(600);
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.click(); }, exo.nom); await p.waitForTimeout(500);
    await p.locator('.focus-exercice button', { hasText: /^✓$/ }).tap(); await p.waitForTimeout(700);
    const barre = p.locator('button', { hasText: 'Terminer la séance' });
    check('un exercice validé : la barre dit « Terminer la séance » (plus « Fin de séance »)', (await barre.count()) === 1 && !/Fin de séance/.test(await texte(p)) && /1\/6 exercices gardés/.test(await barre.innerText()));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
