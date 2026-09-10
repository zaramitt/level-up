// 09c — v20.9, étape 4 : la séance libre. Ajout depuis chaque onglet du panneau, retrait, réordonnancement,
// reps réelles → incrément, séance libre complète, journal fidèle, programme inchangé après les ajouts
// d'un jour, proposition après 3 retraits de suite.
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
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:xc')));
  const ouvrir = async ({ rep, extra = {}, solo = true, code = 'solo-libre9abcd' } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = M.programmePourApp(rep, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'xc', nom: 'Sam', role: 'coachee', solo: ex.solo, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'xc'); localStorage.setItem('lvlup-tour:xc', '1');
      localStorage.setItem('lvlup-s:xc', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra, solo, code }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p, prog };
  };
  const ppl = { frequence: 6, objectif: 'muscler', muscu: 'an', technique: 'oui', materiel: 'salle', tempsMin: 60 };
  const lignes = p => p.evaluate(() => [...document.querySelectorAll('button[data-exo]')].map(b => b.innerText.split('\n')[0].replace(/^\d+\. /, '')));
  const ouvrirFocus = async (p, nom) => { await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.click(); }, nom); await p.waitForTimeout(500); };
  const fermerFocus = async p => { if (await p.locator('.fermer-focus').count()) { await p.locator('.fermer-focus').tap(); await p.waitForTimeout(400); } };
  const appui = async (p, b) => { await b.dispatchEvent('pointerdown'); await p.waitForTimeout(60); await b.dispatchEvent('pointerup'); await p.waitForTimeout(500); };

  console.log('=== 1. Ajouter un exercice : depuis chaque onglet, en fin ou après l\'exercice ouvert, doses de la banque, XP par difficulté ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    const nExosProg = Object.values(prog.seances).map(s => s.exos.length);
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    check('« + Ajouter un exercice » sous la liste, toujours visible', (await p.locator('.ajouter-exercice').count()) === 1);
    await p.locator('.ajouter-exercice').tap(); await p.waitForTimeout(500);
    const panneau = p.locator('.panneau-exercices');
    check('panneau avec trois onglets, « Similaires » ouvert (muscle principal dans le focus), phare en premier par compartiment', (await panneau.count()) === 1 && (await panneau.locator('.onglet-panneau').count()) === 3 && await panneau.locator('.onglet-panneau').first().getAttribute('aria-pressed') === 'true' && await panneau.locator('.exo-candidat').evaluateAll(l => l.length >= 8));
    const cat = M.catalogue(banque, { focus: A.focus, materiel: 'salle', exclure: A.exos.map(e => e.id) });
    const premiers = await panneau.locator('.exo-candidat').evaluateAll(l => l.slice(0, 3).map(b => b.innerText.split('\n')[0].replace(/PHARE|même geste/g, '').trim()));
    check('… dans l\'ordre du catalogue du moteur', premiers.every((n, k) => n === cat.similaires[k].nom), premiers.join(' | ') + ' vs ' + cat.similaires.slice(0, 3).map(x => x.nom).join(' | '));
    check('un exercice déjà dans la séance n\'est jamais proposé', await panneau.locator('.exo-candidat').evaluateAll((l, ids) => !l.some(b => ids.includes(b.dataset.id)), A.exos.map(e => e.id)));
    const sim = cat.similaires[0];
    await panneau.locator('.exo-candidat').first().tap(); await p.waitForTimeout(600);
    let l = await lignes(p);
    let st = await etat(p);
    check(`onglet Similaires : « ${sim.nom} » ajouté en fin de séance, doses de la banque, marqué ajouté`, l[l.length - 1] === sim.nom && st.jour[jour].ajouts.length === 1 && st.jour[jour].ajouts[0].ajoute === true && st.jour[jour].ajouts[0].dose === sim.dose, l.join(' | '));
    const xpAttendu = sim.difficulte === 1 ? 10 : sim.difficulte === 3 ? 20 : 15;
    check(`il porte ses XP selon sa difficulté (+${xpAttendu})`, await p.evaluate(({ n, x }) => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x2 => x2.textContent.includes(n)); return b && b.innerText.includes('+' + x + ' XP'); }, { n: sim.nom, x: xpAttendu }));
    // toute la banque : recherche + filtre matériel
    await p.locator('.ajouter-exercice').tap(); await p.waitForTimeout(400);
    await p.locator('.onglet-panneau', { hasText: 'Toute la banque' }).tap(); await p.waitForTimeout(300);
    await p.locator('.recherche-exo').fill('hip thrust'); await p.waitForTimeout(300);
    const trouves = await panneau.locator('.exo-candidat').evaluateAll(l => l.map(b => b.innerText.split('\n')[0]));
    check('Toute la banque : la recherche « hip thrust » ne rend que les hip thrusts', trouves.length >= 2 && trouves.every(n => /hip thrust/i.test(n)), trouves.join(' | '));
    await p.locator('select[aria-label="Matériel"]').selectOption('machine'); await p.waitForTimeout(300);
    const filtres = await panneau.locator('.exo-candidat').evaluateAll(l => l.map(b => b.innerText.split('\n')[0]));
    check('filtre matériel « machine » : reste le hip thrust machine', filtres.length === 1 && /Hip thrust machine/.test(filtres[0]), filtres.join(' | '));
    await panneau.locator('.exo-candidat').first().tap(); await p.waitForTimeout(600);
    l = await lignes(p);
    check('ajouté depuis « Toute la banque » (hors focus : la séance est libre de ce qu\'on y met)', l[l.length - 1] === 'Hip thrust machine', l.join(' | '));
    // cardio & mobilité, depuis un focus : après l'exercice ouvert
    await ouvrirFocus(p, A.exos[0].nom);
    await p.locator('.focus-exercice .ajouter-apres').tap(); await p.waitForTimeout(400);
    check('depuis une carte focus : « Il se place juste après l\'exercice ouvert »', /juste après l'exercice ouvert/.test(await panneau.innerText()));
    await p.locator('.onglet-panneau', { hasText: 'Cardio' }).tap(); await p.waitForTimeout(300);
    const cardio = await panneau.locator('.exo-candidat').evaluateAll(l => l.map(b => b.innerText));
    check('Cardio & mobilité : que du cardio et de la mobilité, avec leur durée', cardio.length >= 10 && cardio.every(t => /cardio|mobilité/.test(t) && /min/.test(t)), cardio[0]);
    await panneau.locator('.exo-candidat', { hasText: 'Rameur' }).first().tap(); await p.waitForTimeout(600);
    await fermerFocus(p);
    l = await lignes(p);
    check('« Rameur » inséré juste après l\'exercice ouvert, pas en fin', l[1] === 'Rameur' && l[0] === A.exos[0].nom, l.join(' | '));
    st = await etat(p);
    check('le programme n\'a pas bougé (mêmes exercices, même nombre)', JSON.stringify(Object.values(st.programmePerso.seances).map(s => s.exos.length)) === JSON.stringify(nExosProg) && !st.programmePerso.seances.A.exos.some(e => e.id === 'rameur' || e.id === 'hipthrust_machine'));
    await ctx.close(); }

  console.log('\n=== 2. Retirer et réordonner ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, A.exos[1].nom);
    await p.locator('.focus-exercice .retirer-exercice').tap(); await p.waitForTimeout(400);
    check('« Retirer » : confirmation légère, sans culpabilité', (await p.locator('.confirm-retrait').count()) === 1 && /Ça ne change rien à tes XP/.test(await p.locator('.confirm-retrait').innerText()));
    await p.locator('.confirmer-retrait').tap(); await p.waitForTimeout(600);
    let l = await lignes(p);
    let st = await etat(p);
    check('retiré pour aujourd\'hui : disparu de la liste, mémorisé dans le jour, le programme intact, toast « Retiré. Ça ne change rien à tes XP. »', !l.includes(A.exos[1].nom) && st.jour[jour].retires[0] === A.exos[1].id && st.programmePerso.seances.A.exos.some(e => e.id === A.exos[1].id) && /Retiré\. Ça ne change rien à tes XP\./.test(await texte(p)), l.join(' | '));
    check('ni en positif ni en négatif : XP inchangés, compte « 0/5 »', st.xp === 300 && /0\/5/.test(await texte(p)));
    await ouvrirFocus(p, A.exos[0].nom);
    await p.locator('.focus-exercice .deplacer-exercice').tap(); await p.waitForTimeout(300); // v20.10 : « Déplacer » ouvre le menu Monter / Descendre
    check('premier exercice : « ▲ » désactivé, « ▼ » actif', await p.locator('.focus-exercice .monter').isDisabled() && !(await p.locator('.focus-exercice .descendre').isDisabled()));
    await p.locator('.focus-exercice .descendre').tap(); await p.waitForTimeout(400);
    l = await lignes(p);
    check('« Descendre » : il passe en deuxième position, l\'ordre du jour est mémorisé', l[1] === A.exos[0].nom && l[0] === A.exos[2].nom && JSON.stringify((await etat(p)).jour[jour].ordre) === JSON.stringify(l.map(n => A.exos.find(e => e.nom === n).id)), l.join(' | '));
    if (!(await p.locator('.focus-exercice .menu-deplacer').count())) { await p.locator('.focus-exercice .deplacer-exercice').tap(); await p.waitForTimeout(300); }
    await p.locator('.focus-exercice .monter').tap(); await p.waitForTimeout(400);
    check('« Monter » : retour en tête', (await lignes(p))[0] === A.exos[0].nom);
    await fermerFocus(p);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1400);
    check('après rechargement : retrait et ordre conservés', !(await lignes(p)).includes(A.exos[1].nom) && (await lignes(p))[0] === A.exos[0].nom);
    await ctx.close(); }

  console.log('\n=== 3. Reps réelles par série → incrément (règle 8) ===');
  { const prog = M.programmePourApp(ppl, banque);
    const dc = prog.seances.A.exos.find(e => e.id === 'developpe_couche');
    const { ctx, p } = await ouvrir({ rep: ppl, extra: { charges: { developpe_couche: [{ date: ilYA(3), series: [40, 40, 40], reps: [5, 5, 5], ressenti: 'juste' }] } } });
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, dc.nom);
    const focus = p.locator('.focus-exercice');
    check('la dernière fois : 5 reps partout sur 5-8 → pas de suggestion, « dernier : 40 / 40 / 40 kg »', !/Suggestion/.test(await focus.innerText()) && /dernier : 40 \/ 40 \/ 40 kg/.test(await focus.innerText()));
    check(`reps pré-remplies au haut de la fourchette (${dc.reps[1]}), une par série`, (await focus.locator('.reps-serie').count()) === dc.series && await focus.locator('.reps-serie').evaluateAll((l, m) => l.every(x => x.innerText.includes(String(m))), dc.reps[1]));
    await focus.locator('button', { hasText: /^✓$/ }).tap(); await p.waitForTimeout(700);
    let st = await etat(p);
    let der = st.charges.developpe_couche[st.charges.developpe_couche.length - 1];
    check('validation sans toucher aux reps : une série non modifiée = valeur pré-remplie, écrite dans le journal du jour', der.date === jour && JSON.stringify(der.reps) === JSON.stringify(Array(dc.series).fill(dc.reps[1])) && der.hautFourchette === true, JSON.stringify(der));
    await p.locator('button', { hasText: 'Facile' }).first().tap(); await p.waitForTimeout(400);
    await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('lvlup-s:xc')); st.jour = {}; localStorage.setItem('lvlup-s:xc', JSON.stringify(st)); });
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, dc.nom);
    check('la séance suivante : toutes les séries au haut de fourchette + ressenti facile → « Suggestion : 42,5 kg »', /Suggestion : 42,5 kg/.test(await focus.innerText()), (await focus.innerText()).slice(0, 300));
    await appui(p, focus.locator('.reps-serie').first().locator('button', { hasText: /^[−-]$/ }));
    st = await etat(p);
    der = st.charges.developpe_couche[st.charges.developpe_couche.length - 1];
    check('une série corrigée à la main : reps réelles enregistrées, haut de fourchette non tenu', der.date === jour && der.reps[0] === dc.reps[1] - 1 && der.hautFourchette === false, JSON.stringify(der));
    await ctx.close(); }

  console.log('\n=== 4. Séance libre complète ===');
  { const { ctx, p } = await ouvrir({ rep: ppl });
    check('carte permanente « Séance libre » dans le carrousel', (await p.locator('.carte-libre').count()) === 1 && /Séance libre/i.test(await p.locator('.carte-libre').innerText()));
    await p.locator('.carte-libre').tap(); await p.waitForTimeout(800);
    let t = await texte(p);
    check('démarre vide : en-tête « SÉANCE LIBRE », invitation à ajouter, pas de bouton « Valider ma séance »', /SÉANCE LIBRE/.test(t) && (await p.locator('.libre-vide').count()) === 1 && (await p.locator('.ajouter-exercice').count()) === 1 && !/Valider ma séance/.test(t) && !/Ajuster ma séance du jour/.test(t), JSON.stringify([/SÉANCE LIBRE/.test(t), await p.locator('.libre-vide').count(), await p.locator('.ajouter-exercice').count(), /Valider ma séance/.test(t), /Ajuster ma séance du jour/.test(t)]));
    await p.locator('.ajouter-exercice').tap(); await p.waitForTimeout(500);
    const panneau = p.locator('.panneau-exercices');
    check('sans focus : le panneau s\'ouvre sur « Toute la banque »', await panneau.locator('.onglet-panneau', { hasText: 'Toute la banque' }).getAttribute('aria-pressed') === 'true');
    await p.locator('.recherche-exo').fill('squat barre'); await p.waitForTimeout(300);
    await panneau.locator('.exo-candidat', { hasText: 'Squat barre' }).first().tap(); await p.waitForTimeout(600);
    await p.locator('.ajouter-exercice').tap(); await p.waitForTimeout(400);
    await p.locator('.onglet-panneau', { hasText: 'Cardio' }).tap(); await p.waitForTimeout(300);
    await panneau.locator('.exo-candidat', { hasText: 'Rameur' }).first().tap(); await p.waitForTimeout(600);
    const l = await lignes(p);
    check('deux exercices ajoutés, dans l\'ordre', JSON.stringify(l) === JSON.stringify(['Squat barre', 'Rameur']), l.join(' | '));
    await ouvrirFocus(p, 'Squat barre');
    await p.locator('.focus-exercice button', { hasText: /^✓$/ }).tap(); await p.waitForTimeout(700);
    await ouvrirFocus(p, 'Rameur');
    await p.locator('.focus-exercice button', { hasText: /^✓$/ }).tap(); await p.waitForTimeout(700);
    let st = await etat(p);
    check('XP : ceux des exercices faits (squat barre difficulté 2 sans photo : 10 ; rameur : 10), pas de bonus', st.xp === 320, st.xp);
    const barre = p.locator('button', { hasText: 'Terminer la séance' });
    check('la barre dit « Terminer la séance · 2/2 » (jamais « Valider +40 »)', (await barre.count()) === 1 && /2\/2 exercices faits/.test(await barre.innerText()));
    await barre.tap(); await p.waitForTimeout(900);
    t = await texte(p);
    check('célébration « Séance libre enregistrée — 2 exercices — ça compte. »', /Séance libre enregistrée/.test(t) && /2 exercices — ça compte/.test(t));
    st = await etat(p);
    const h = st.histo[0];
    check('journal : type L, marquée libre, les deux exercices faits et ajoutés, jour couvert', h.type === 'L' && h.libre === true && h.exos.length === 2 && h.exos.every(e => e.fait && e.ajoute) && st.activeDays[jour] === true, JSON.stringify(h));
    await p.locator('button', { hasText: 'Continuer' }).tap(); await p.waitForTimeout(400);
    await p.locator('button', { hasText: 'Progrès' }).first().tap(); await p.waitForTimeout(700);
    check('Progrès : la séance libre apparaît dans l\'historique comme « Séance libre — 2 exercices »', /Séance libre — 2 exercices/.test(await texte(p)));
    await ctx.close(); }

  console.log('\n=== 5. Le journal enregistre ce qui a été FAIT ; Progrès lit le journal, pas le programme ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    // retirer le 2e, ajouter un hip thrust machine, valider le 1er avec une charge et un ressenti
    await ouvrirFocus(p, A.exos[1].nom); await p.locator('.focus-exercice .retirer-exercice').tap(); await p.waitForTimeout(300); await p.locator('.confirmer-retrait').tap(); await p.waitForTimeout(500);
    await p.locator('.ajouter-exercice').tap(); await p.waitForTimeout(400);
    await p.locator('.onglet-panneau', { hasText: 'Toute la banque' }).tap(); await p.waitForTimeout(300);
    await p.locator('.recherche-exo').fill('hip thrust machine'); await p.waitForTimeout(300);
    await p.locator('.exo-candidat').first().tap(); await p.waitForTimeout(600);
    await ouvrirFocus(p, 'Hip thrust machine');
    const focus = p.locator('.focus-exercice');
    await appui(p, focus.locator('.reps-serie').first().locator('button', { hasText: /^[−-]$/ }));
    await focus.locator('div', { hasText: /^kg$/ }).first().tap(); await p.waitForTimeout(200);
    const champ = focus.locator('input[inputmode="decimal"]');
    await champ.first().fill('60'); await champ.first().press('Enter'); await p.waitForTimeout(900);
    await focus.locator('button', { hasText: /^✓$/ }).tap(); await p.waitForTimeout(700);
    await p.locator('button', { hasText: 'Juste' }).first().tap(); await p.waitForTimeout(400);
    await p.locator('button', { hasText: 'Terminer la séance' }).tap(); await p.waitForTimeout(900);
    const st = await etat(p);
    const h = st.histo[0];
    const ht = h.exos.find(e => e.id === 'hipthrust_machine');
    check('journal : l\'exercice ajouté est là, fait, avec sa charge, ses reps réelles et son ressenti', ht && ht.fait && ht.ajoute && ht.series[0] === 60 && ht.reps[0] === 11 && ht.ressenti === 'juste' && ht.xp === 5, JSON.stringify(ht));
    check('journal : l\'exercice retiré est listé à part, les prévus non faits sont là avec fait:false', h.retires.length === 1 && h.retires[0].id === A.exos[1].id && !h.exos.some(e => e.id === A.exos[1].id) && h.exos.filter(e => !e.fait).length === A.exos.length - 1, JSON.stringify(h.retires));
    await p.locator('button', { hasText: 'Continuer' }).tap(); await p.waitForTimeout(400);
    await p.locator('button', { hasText: 'Progrès' }).first().tap(); await p.waitForTimeout(700);
    check('Progrès : l\'exercice ajouté une fois a son graphique comme les autres (« Hip thrust machine », 60 kg)', await p.evaluate(() => { const g = [...document.querySelectorAll('.graphe-charge')].find(x => /Hip thrust machine/.test(x.innerText)); return !!g && /60 kg/.test(g.innerText); }));
    await ctx.close(); }

  console.log('\n=== 6. Le programme ne bouge pas ; après 3 retraits de suite, l\'app propose de l\'enlever ===');
  { const prog = M.programmePourApp(ppl, banque);
    const A = prog.seances.A; const cible = A.exos[1];
    const jours = [ilYA(6), ilYA(4), ilYA(2)];
    const jourEtat = d => ({ seance: 'A', faits: [A.exos[0].id], gainage: [], valide: false, gainValide: false, photos: {}, retires: [cible.id], activite: Date.now() - 4 * 3600000, xpExos: { [A.exos[0].id]: 15 } });
    const { ctx, p } = await ouvrir({ rep: ppl, extra: { jour: Object.fromEntries(jours.map(d => [d, jourEtat(d)])) } });
    const st = await etat(p);
    check('trois séances passées enregistrées (clôture automatique), chacune avec son journal et le retrait', st.histo.filter(h => h.type === 'A' && h.retires && h.retires[0].id === cible.id).length === 3 && st.retraits[cible.id] === 3, JSON.stringify(st.retraits));
    check('le programme est intact : l\'exercice y est toujours', st.programmePerso.seances.A.exos.some(e => e.id === cible.id));
    const carte = p.locator('.proposition-retrait');
    check(`carte « « ${cible.nom} » retiré ou remplacé 3 séances de suite — on l'enlève du programme ? »`, (await carte.count()) === 1 && (await carte.innerText()).includes(cible.nom) && /3 séances de suite/.test(await carte.innerText()) && /On l'enlève du programme \?/.test(await carte.innerText()));
    await carte.locator('.garder-programme').tap(); await p.waitForTimeout(400);
    let st2 = await etat(p);
    check('« Non, je le garde » : le compteur repart de zéro, l\'exercice reste', st2.retraits[cible.id] === 0 && st2.programmePerso.seances.A.exos.some(e => e.id === cible.id) && (await p.locator('.proposition-retrait').count()) === 0);
    await p.evaluate(id => { const st = JSON.parse(localStorage.getItem('lvlup-s:xc')); st.retraits[id] = 3; localStorage.setItem('lvlup-s:xc', JSON.stringify(st)); }, cible.id);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('.proposition-retrait .enlever-programme').tap(); await p.waitForTimeout(500);
    st2 = await etat(p);
    check('« Oui, on l\'enlève » : retiré de chaque séance du programme qui l\'avait, charges intactes', !Object.values(st2.programmePerso.seances).some(s => s.exos.some(e => e.id === cible.id)) && st2.retraits[cible.id] === 0);
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
