// 03 — v20.1, la séance vivante : ressenti, incrément proposé, remplacement, adapter ma séance,
// recalage du niveau observé, jour de récupération active.
// Lancer via node outils/tests/lancer.js (mock sur 8323)
const { chromium } = require('playwright');
const M = require('../../moteur-programmes.js');
const banque = require('../../banque-exercices.json');
const U = 'http://127.0.0.1:8323/app.html';
const jour = new Date().toISOString().slice(0, 10);
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? '✔' : '✘'} ${nom}${cond || detail === undefined ? '' : ' — ' + String(detail).slice(0, 220)}`); };
const repBase = { frequence: 4, objectif: 'muscler', objectifLibre: '', muscu: 'mois', technique: 'oui', sport: 'non', intention: 'soi', joursSport: [], materiel: ['haltères', 'barre', 'banc', 'machine', 'poulie', 'élastique', 'barre de traction', 'barres de dips', 'kettlebell', 'trap bar', 'rack', 'roulette', 'ballon', 'rouleau', 'tapis / machine cardio'], raccourci: 'salle', tempsMin: 60, interpretation: null };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const ouvrir = async (rep, extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = M.programmePourApp({ ...rep, sport: rep.sport && rep.sport !== 'non' ? rep.sport : null }, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x3', nom: 'Léa', role: 'coachee', solo: true, code: 'solo-testabcd' }]));
      localStorage.setItem('lvlup-actif', 'x3'); localStorage.setItem('lvlup-tour:x3', '1');
      localStorage.setItem('lvlup-s:x3', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    return { ctx, p, prog };
  };
  const texte = p => p.evaluate(() => document.body.innerText);
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x3')));
  const tap = async (p, t, n = 0) => { await p.locator('button', { hasText: t }).nth(n).tap(); await p.waitForTimeout(450); };
  const ouvrirSeance = async (p, prog, lettre) => { await p.locator('.carte-seance').nth(Object.keys(prog.seances).indexOf(lettre)).tap(); await p.waitForTimeout(900); };
  const deplier = async (p, nom) => { await p.locator('button[aria-expanded]', { hasText: nom }).first().tap(); await p.waitForTimeout(600); };
  const carte = (p, nom) => p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); return b ? b.parentElement.innerText : ''; }, nom);
  const validerSansPhoto = async (p, nom) => { await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); const v = [...b.parentElement.querySelectorAll('button')].find(x => x.textContent.trim() === '✓'); v.click(); }, nom); await p.waitForTimeout(700); };
  // un bouton du corps de l'exercice déployé (les corps repliés restent montés, invisibles)
  const tapOuvert = async (p, t) => { await p.locator('button[aria-expanded="true"]').locator('xpath=..').locator('button', { hasText: t }).first().tap(); await p.waitForTimeout(500); };
  const lettreDe = (prog, id) => Object.keys(prog.seances).find(l => prog.seances[l].exos.some(e => e.id === id));

  console.log('=== 1. Ressenti après exercice : un tap, facultatif, stocké par exercice et par séance ===');
  { const { ctx, p, prog } = await ouvrir(repBase);
    const L = lettreDe(prog, 'developpe_couche');
    await ouvrirSeance(p, prog, L);
    const exo = prog.seances[L].exos[0];
    check('avant validation : pas de question de ressenti', !/C'était comment/.test(await texte(p)));
    await deplier(p, exo.nom); await validerSansPhoto(p, exo.nom);
    let t = await texte(p);
    check('après validation : « C\'était comment ? » avec Facile / Juste / Trop dur', /C'était comment \?/.test(t) && /Facile/.test(t) && /Juste/.test(t) && /Trop dur/.test(t));
    let st = await etat(p);
    check('rien n\'est bloqué si on ignore : l\'exercice est validé, aucun ressenti stocké', st.jour[jour].faits.includes(exo.id) && !(st.jour[jour].ressentis || {})[exo.id] && !(st.ressentis || {})[exo.id]);
    await tap(p, 'Facile');
    st = await etat(p);
    const r = (st.ressentis || {})[exo.id];
    check('« Facile » : stocké pour la séance du jour et dans l\'historique de l\'exercice, marqué polyarticulaire', st.jour[jour].ressentis[exo.id] === 'facile' && r && r.length === 1 && r[0].r === 'facile' && r[0].date === jour && r[0].compose === true, JSON.stringify([st.jour[jour].ressentis, r]));
    await tap(p, 'Trop dur');
    st = await etat(p);
    check('modifiable : « Trop dur » remplace, une seule entrée par jour', st.jour[jour].ressentis[exo.id] === 'dur' && st.ressentis[exo.id].length === 1 && st.ressentis[exo.id][0].r === 'dur');
    check('les boutons sont de vrais <button> (iOS : tap franc)', await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => /^(Facile|Juste|Trop dur)$/.test(b.textContent.trim())).length === 3));
    await ctx.close(); }

  console.log('\n=== 2. Incrément proposé (règle 8) : pré-rempli, visible, jamais imposé ; « trop dur » l\'annule ===');
  { const charges = { developpe_couche: [{ date: '2026-08-30', series: [40, 40, 40], hautFourchette: true, ressenti: 'juste' }], squat: [{ date: '2026-08-31', series: [60, 60, 60], hautFourchette: true, ressenti: 'dur' }], rowing_barre: [{ date: '2026-08-30', series: [50, 50, 50], hautFourchette: false, ressenti: 'facile' }] };
    const { ctx, p, prog } = await ouvrir(repBase, { charges });
    const L = lettreDe(prog, 'developpe_couche');
    await ouvrirSeance(p, prog, L);
    await deplier(p, 'Développé couché');
    const c = await carte(p, 'Développé couché');
    check('suggestion visible et expliquée : « Suggestion : 42,5 kg — +2,5 kg, tu as tenu 8 reps partout »', /Suggestion : 42,5 kg — \+2,5 kg, tu as tenu 8 reps partout/.test(c), c.slice(0, 260));
    check('les séries sont pré-remplies à 42,5', (c.match(/42[.,]5 kg/g) || []).length >= 3, c.slice(0, 300));
    check('modifiable : la case « J\'ai tenu 8 reps sur toutes les séries » est là, décochée', /J'ai tenu 8 reps sur toutes les séries/.test(c) && await p.evaluate(() => document.querySelector('.haut-fourchette').getAttribute('aria-pressed') === 'false'));
    await p.locator('button[aria-expanded="true"]').locator('xpath=..').locator('.haut-fourchette').tap(); await p.waitForTimeout(500);
    let st = await etat(p);
    const der = st.charges.developpe_couche[st.charges.developpe_couche.length - 1];
    check('cocher crée l\'entrée du jour avec hautFourchette', der.date === jour && der.hautFourchette === true, JSON.stringify(der));
    await deplier(p, 'Rowing barre');
    check('reps pas atteintes la dernière fois → pas de suggestion, dernière charge rappelée', !/Suggestion/.test(await carte(p, 'Rowing barre')) && /dernier : 50/.test(await carte(p, 'Rowing barre')));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('lvlup-s:x3')); st.jour = {}; localStorage.setItem('lvlup-s:x3', JSON.stringify(st)); });
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    const LB = lettreDe(prog, 'squat');
    await ouvrirSeance(p, prog, LB); await deplier(p, 'Squat barre');
    check('« trop dur » la dernière fois → pas de suggestion sur le squat', !/Suggestion/.test(await carte(p, 'Squat barre')));
    await ctx.close(); }

  console.log('\n=== 3. « Remplacer » (règle 12) : deux motifs, 2 à 3 candidats, aujourd\'hui ou pour de bon ===');
  { const charges = { rowing_barre: [{ date: '2026-08-30', series: [50, 50, 50] }] };
    const { ctx, p, prog } = await ouvrir(repBase, { charges });
    const L = lettreDe(prog, 'rowing_barre');
    await ouvrirSeance(p, prog, L); await deplier(p, 'Rowing barre');
    await tapOuvert(p, 'Remplacer');
    let t = await texte(p);
    check('panneau : deux motifs', /Matériel indisponible/.test(t) && /Je préfère autre chose/.test(t));
    await tap(p, 'Je préfère autre chose');
    const cands = await p.evaluate(() => [...document.querySelectorAll('button')].filter(b => /·.*·/.test(b.textContent) && b.closest('[style*="z-index: 95"], [style*="zIndex"]')).map(b => b.innerText));
    const attendu = M.remplacantsPour(banque, prog.seances[L].exos.find(e => e.id === 'rowing_barre'), { materiel: repBase.materiel, niveau: 2, motif: 'prefere', exclure: prog.seances[L].exos.map(e => e.id) });
    check('2 à 3 candidats, chacun avec muscle, matériel et dose', cands.length >= 2 && cands.length <= 3 && cands.every(c => /dos \(grand dorsal\)/.test(c) && /×/.test(c)), cands.join(' | '));
    check('dans l\'ordre du moteur (phare en premier quand il y en a un)', cands[0].includes(attendu.candidats[0].exo.nom), cands[0]);
    const premier = attendu.candidats[0].exo;
    await p.locator('button', { hasText: premier.nom }).first().tap(); await p.waitForTimeout(700);
    let st = await etat(p);
    check('remplacé pour aujourd\'hui : la séance affiche le remplaçant, le programme est intact', (await texte(p)).includes(premier.nom) && st.jour[jour].remplacements.rowing_barre.id === premier.id && st.programmePerso.seances[L].exos.some(e => e.id === 'rowing_barre'), JSON.stringify(Object.keys(st.jour[jour].remplacements)));
    check('l\'historique des charges de l\'ancien exercice est intact', st.charges.rowing_barre[0].series[0] === 50);
    // pour toutes les prochaines séances : le développé militaire
    await deplier(p, 'Développé militaire'); await tapOuvert(p, 'Remplacer'); await tap(p, 'Matériel indisponible');
    t = await texte(p);
    check('motif matériel : des candidats sans barre d\'abord', await p.evaluate(() => { const l = [...document.querySelectorAll('button')].filter(b => /épaules ·/.test(b.textContent)); return l.length >= 2 && !/barre(?! de)/.test(l[0].textContent.split('·')[1] || ''); }), t.slice(t.indexOf('Remplacer «'), t.indexOf('Remplacer «') + 300));
    await p.locator('label', { hasText: 'Pour toutes les prochaines séances' }).tap(); await p.waitForTimeout(300);
    const nom2 = await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /épaules ·/.test(b.textContent)).textContent.split('\n')[0].replace('PHARE', '').trim());
    await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /épaules ·/.test(b.textContent)).click()); await p.waitForTimeout(700);
    st = await etat(p);
    const dansProg = Object.values(st.programmePerso.seances).filter(s => s.exos.some(e => e.remplace === 'militaire')).length;
    check('« pour toutes les prochaines séances » : le programme lui-même est modifié, dans chaque séance qui l\'avait', dansProg >= 1 && !Object.values(st.programmePerso.seances).some(s => s.exos.some(e => e.id === 'militaire')), JSON.stringify([nom2, dansProg]));
    await ctx.close(); }

  console.log('\n=== 4. « Adapter ma séance » : temps exact + énergie, recompression, marquée dans l\'historique ===');
  { const charges = { developpe_couche: [{ date: '2026-08-30', series: [40, 40, 40], hautFourchette: true, ressenti: 'juste' }] };
    const { ctx, p, prog } = await ouvrir(repBase, { charges });
    const L = lettreDe(prog, 'developpe_couche');
    await ouvrirSeance(p, prog, L);
    let t = await texte(p);
    check('sous la carte : « Pas assez de temps ou d\'énergie aujourd\'hui ? On ajuste. »', /Pas assez de temps ou d'énergie aujourd'hui \? On ajuste\./.test(t));
    await p.locator('.bouton-adapter').tap(); await p.waitForTimeout(600);
    t = await texte(p);
    check('panneau : temps (saisie exacte) et énergie, résultat annoncé', /TEMPS DISPONIBLE/.test(t) && /ÉNERGIE/.test(t) && /Petite forme/.test(t) && /Résultat :/.test(t) && await p.evaluate(() => !!document.querySelector('input[type=number]')));
    await p.locator('input[type=number]').fill('33'); await p.waitForTimeout(200); await tap(p, 'Petite forme');
    t = await texte(p);
    check('aperçu du résultat : une série de moins, charges −10 %, repos gardés', /une série de moins, charges suggérées −10 %, repos gardés/.test(t));
    await tap(p, 'Ajuster ma séance');
    let st = await etat(p);
    const A = st.jour[jour].adaptee;
    check('séance ajustée stockée : 33 min, petite forme, durée recalculée ≤ 33', A && A.tempsMin === 33 && A.energie === 'petite' && A.seance.dureeMin <= 33, JSON.stringify(A && [A.tempsMin, A.energie, A.seance.dureeMin]));
    const orig = prog.seances[L];
    check('les polyarticulaires restent, séries −1, repos préservés', orig.exos.filter(e => e.compartiment !== 'isolation').every(o => A.seance.exos.some(e => e.id === o.id)) && A.seance.exos.every(e => { const o = orig.exos.find(x => x.id === e.id); return e.series === Math.max(2, o.series - 1) && e.repos <= o.repos; }));
    t = await texte(p);
    check('en-tête : « Séance ajustée · N min · petite forme », et le bouton d\'ajustement a disparu', /Séance ajustée · \d+ min · petite forme/.test(t) && !/On ajuste\./.test(t));
    await deplier(p, 'Développé couché');
    const c = await carte(p, 'Développé couché');
    check('petite forme : pas d\'incrément, charges pré-remplies à −10 % arrondies (35 kg au lieu de 40)', !/Suggestion/.test(c) && /−10 %/.test(c) && (c.match(/\b35 kg/g) || []).length >= 2, c.slice(0, 300));
    check('« défaut = dernière fois » mémorisé pour la prochaine adaptation', st.derniereAdaptation && st.derniereAdaptation.tempsMin === 33);
    // on joue la séance adaptée jusqu'au bout : elle compte comme une séance normale, marquée adaptée
    for (const e of A.seance.exos) { await deplier(p, e.nom); await validerSansPhoto(p, e.nom); }
    await p.waitForTimeout(500);
    await p.locator('button', { hasText: /Valider ma séance/ }).first().tap(); await p.waitForTimeout(900);
    st = await etat(p);
    check('validée : entrée d\'historique de type séance, marquée adaptée, bonus de séance complète', st.histo[0] && st.histo[0].type === L && st.histo[0].adaptee === true && st.jour[jour].valide === true && st.xp > 300, JSON.stringify(st.histo[0]));
    await ctx.close(); }

  console.log('\n=== 5. Le niveau observé bouge, jamais à l\'insu ===');
  const facile = id => [{ date: '2026-09-01', r: 'facile', compose: true }, { date: '2026-09-02', r: 'facile', compose: true }];
  { const { ctx, p } = await ouvrir(repBase, { ressentis: { developpe_couche: facile(), squat: facile() }, ressentisDepuis: '2026-08-01' });
    let t = await texte(p);
    const carteN = t.slice(t.indexOf('On dirait'), t.indexOf('Pas maintenant') + 14);
    check('4 « facile » d\'affilée sur les gros exercices → « On monte d\'un cran ? » avec deux choix, sans le mot niveau', /On dirait que tu progresses/.test(t) && /On monte d'un cran \?/.test(t) && /Oui, on monte d'un cran/.test(t) && /Pas maintenant/.test(t) && !/niveau/i.test(carteN), carteN);
    await tap(p, 'Pas maintenant');
    let st = await etat(p);
    check('« Pas maintenant » : refus mémorisé, carte disparue, programme intact', st.niveauRefuse && st.niveauRefuse.sens === 1 && !/On monte d'un cran/.test(await texte(p)) && st.programmePerso.moteur.entrees.niveau === 2);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    check('après rechargement, toujours pas de carte', !/On monte d'un cran/.test(await texte(p)));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir(repBase, { ressentis: { developpe_couche: facile(), squat: facile() }, ressentisDepuis: '2026-08-01' });
    await tap(p, "Oui, on monte d'un cran"); await p.waitForTimeout(900);
    let t = await texte(p);
    check('aperçu direct du programme un cran plus haut, sans reposer les questions', /UN CRAN PLUS HAUT/.test(t) && /Adopter ce programme/.test(t) && !/Combien de séances/.test(t), t.slice(0, 200));
    await tap(p, 'Adopter ce programme');
    const st = await etat(p);
    check('adopté : cran mémorisé dans les réponses, programme au niveau 3, ressentis d\'avant remis à zéro pour la prochaine proposition', st.reponses.niveauAjuste === 1 && st.programmePerso.moteur.entrees.niveau === 3 && st.ressentisDepuis === jour && !/On monte d'un cran/.test(await texte(p)), JSON.stringify([st.reponses.niveauAjuste, st.programmePerso.moteur.entrees.niveau]));
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    check('réglages : « relevé d\'un cran » sur la ligne Expérience, jamais le mot niveau', /relevé d'un cran/.test(await texte(p)));
    await ctx.close(); }
  { const dur = [{ date: '2026-09-01', r: 'dur', compose: true }, { date: '2026-09-02', r: 'dur', compose: true }];
    const { ctx, p } = await ouvrir(repBase, { ressentis: { developpe_couche: dur, squat: [{ date: '2026-09-03', r: 'dur', compose: true }] }, ressentisDepuis: '2026-08-01' });
    check('3 « trop dur » sur les 6 derniers → proposition de redescendre', /On redescend d'un cran/.test(await texte(p)) && /Oui, on redescend/.test(await texte(p)));
    await ctx.close(); }

  console.log('\n=== 6. Jour de récupération active (7×) : traitement dédié ===');
  { const rep7 = { ...repBase, frequence: 7, muscu: 'an' };
    const { ctx, p, prog } = await ouvrir(rep7);
    await ouvrirSeance(p, prog, 'G');
    let t = await texte(p);
    check('écran dédié : ton différent, durées, XP réduits annoncés', /RÉCUPÉRATION ACTIVE/.test(t) && /Pas de charge aujourd'hui/.test(t) && /5 XP par activité/.test(t) && /Fait · \+5/.test(t));
    check('pas de repos, pas de saisie de charge, pas de barre « Fin de séance »', !/Repos \d/.test(t) && (await p.locator('input[inputmode]').count()) === 0 && !/Fin de séance/.test(t));
    const n = prog.seances.G.exos.length;
    for (let i = 0; i < n; i++) { await tap(p, 'Fait · +5'); }
    t = await texte(p);
    check('tout fait → « Journée de récupération bouclée · +15 XP »', /Journée de récupération bouclée · \+15 XP/.test(t));
    await tap(p, 'Journée de récupération bouclée');
    const st = await etat(p);
    check(`XP : ${n} × 5 + 15, historique marqué récupération`, st.xp === 300 + n * 5 + 15 && st.histo[0].type === 'G' && st.histo[0].recup === true && st.jour[jour].valide === true, JSON.stringify([st.xp, st.histo[0]]));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
