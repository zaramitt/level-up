// 09e — v20.11 : le cardio, citoyen de première classe. Notation (durée au chrono ou saisie, distance, vitesse,
// inclinaison, résistance), XP selon la durée, photo facultative, jour « Cardio » joué comme une séance,
// Progrès avec la courbe du cardio, cardio dans le programme (objectif / sport) dit dans « À savoir »,
// « Ajuster ma séance » avec l'option cardio explicite.
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
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:xe')));
  const texte = p => p.evaluate(() => document.body.innerText);
  const ouvrir = async ({ rep, extra = {}, code = 'solo-cardio11abc' } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = M.programmePourApp(rep, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'xe', nom: 'Sam', role: 'coachee', solo: true, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'xe'); localStorage.setItem('lvlup-tour:xe', '1');
      localStorage.setItem('lvlup-s:xe', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: true, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra, code }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p, prog };
  };
  const ouvrirFocus = async (p, nom) => { await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.click(); }, nom); await p.waitForTimeout(500); };
  const appui = async (p, b) => { await b.dispatchEvent('pointerdown'); await p.waitForTimeout(60); await b.dispatchEvent('pointerup'); await p.waitForTimeout(400); };
  const poids = { frequence: 3, objectif: 'poids', muscu: 'mois', technique: 'oui', materiel: 'salle', tempsMin: 60 };
  const muscler = { frequence: 4, objectif: 'muscler', muscu: 'an', technique: 'oui', materiel: 'salle', tempsMin: 60 };

  console.log('=== 1. Le programme « Perdre du poids » intègre le cardio : finisher dans chaque séance, carte cardio dans la séance, « À savoir » ===');
  { const { ctx, p, prog } = await ouvrir({ rep: poids });
    const A = prog.seances.A;
    const fin = A.exos[A.exos.length - 1];
    check('le programme a un finisher cardio en fin de chaque séance (moteur), typé cardio, 10 à 15 min', Object.values(prog.seances).every(s => { const d = s.exos[s.exos.length - 1]; return d && d.type === 'cardio' && d.role === 'cardio' && /^1[05] min$/.test(d.dose); }), Object.values(prog.seances).map(s => s.exos[s.exos.length - 1].dose).join(','));
    check('« À savoir » du programme : « Cardio intégré (objectif « Perdre du poids ») » et « XP … dépendent de la durée »', prog.moteur.avertissements.some(a => /^Cardio intégré \(objectif « Perdre du poids »\)/.test(a) && /XP du cardio dépendent de la durée/.test(a)));
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    const pastille = await p.evaluate(n => { const b = [...document.querySelectorAll('button[data-exo]')].find(x => x.textContent.includes(n)); return b && b.innerText; }, fin.nom);
    check('la ligne du cardio annonce ses XP selon la durée prévue (10 min → +10 XP)', /\+10 XP/.test(pastille), pastille);
    await ouvrirFocus(p, fin.nom);
    const focus = p.locator('.focus-exercice');
    check('la carte cardio : chrono, durée en minutes, pas de charge, « Terminer le cardio » en premier et la photo en option (même avec photo obligatoire)', (await focus.locator('.cardio-inputs').count()) === 1 && (await focus.locator('.chrono-cardio').count()) === 1 && (await focus.locator('.duree-cardio').count()) === 1 && (await focus.locator('.reps-serie').count()) === 0 && (await focus.locator('.terminer-cardio').count()) === 1 && (await focus.locator('button[aria-label="Ajouter une photo (facultatif)"]').count()) === 1 && !/Valider avec une photo/.test(await focus.innerText()));
    const champs = await focus.locator('.champ-cardio').evaluateAll(l => l.map(x => x.dataset.champ));
    const attendus = { marche_inclinee: ['distance', 'vitesse', 'inclinaison'], course_douce: ['distance', 'vitesse', 'inclinaison'], escaliers: ['resistance'], rameur: ['distance', 'resistance'], velo: ['distance', 'vitesse', 'resistance'], elliptique: ['distance', 'resistance'] }[fin.id] || [];
    check(`selon l'appareil (${fin.nom}) : ${attendus.join(', ') || 'aucun champ'}`, JSON.stringify(champs) === JSON.stringify(attendus), champs.join(','));
    // durée saisie : 10 → 25 min par le stepper (+15 appuis) → 15 XP
    for (let k = 0; k < 15; k++) await appui(p, focus.locator('.duree-cardio button', { hasText: /^[+＋]$/ }));
    let st = await etat(p);
    let c = st.charges[fin.id] && st.charges[fin.id][st.charges[fin.id].length - 1];
    check('la durée saisie est écrite dans l\'entrée du jour (25 min) et l\'aperçu des XP suit (+15 XP)', c && c.date === jour && c.cardio && c.cardio.duree_s === 1500 && /\+15 XP/.test(await focus.locator('.xp-cardio').innerText()), JSON.stringify(c));
    if (champs.includes('distance')) { for (let k = 0; k < 5; k++) await appui(p, focus.locator('.champ-cardio[data-champ="distance"] button', { hasText: /^[+＋]$/ })); st = await etat(p); c = st.charges[fin.id][st.charges[fin.id].length - 1]; check('la distance se note (0,5 km)', c.cardio.distance === 0.5, JSON.stringify(c.cardio)); }
    await focus.locator('.terminer-cardio').tap(); await p.waitForTimeout(700);
    st = await etat(p);
    check('« Terminer le cardio » : validé sans photo, 15 XP (25 min), XP mémorisés sur la séance', st.jour[jour].faits.includes(fin.id) && st.jour[jour].xpExos[fin.id] === 15 && st.xp === 315, JSON.stringify([st.jour[jour].xpExos, st.xp]));
    await ctx.close(); }

  console.log('\n=== 2. Le chrono : lancé, il survit à la fermeture de la carte ; arrêté, il remplit la durée ===');
  { const { ctx, p, prog } = await ouvrir({ rep: poids, code: 'solo-cardio11chr' });
    const A = prog.seances.A; const fin = A.exos[A.exos.length - 1];
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, fin.nom);
    await p.locator('.focus-exercice .chrono-cardio').tap(); await p.waitForTimeout(400);
    let st = await etat(p);
    let c = st.charges[fin.id][st.charges[fin.id].length - 1];
    check('chrono lancé : horodaté dans l\'entrée du jour', c.cardio && c.cardio.chronoDebut > Date.now() - 5000);
    await p.locator('.fermer-focus').tap(); await p.waitForTimeout(300);
    await ouvrirFocus(p, fin.nom);
    check('la carte rouverte montre le chrono en cours', /■ 0:0/.test(await p.locator('.focus-exercice .chrono-cardio').innerText()));
    // 32 min « plus tard »
    await p.evaluate(([id, jk]) => { const s = JSON.parse(localStorage.getItem('lvlup-s:xe')); const l = s.charges[id]; l[l.length - 1].cardio.chronoDebut = Date.now() - 32 * 60000; localStorage.setItem('lvlup-s:xe', JSON.stringify(s)); }, [fin.id, jour]);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    await ouvrirFocus(p, fin.nom);
    await p.locator('.focus-exercice .chrono-cardio').tap(); await p.waitForTimeout(400);
    st = await etat(p); c = st.charges[fin.id][st.charges[fin.id].length - 1];
    check('arrêté après 32 min : durée 32 min, chrono effacé, +20 XP annoncés', c.cardio.duree_s === 32 * 60 && !c.cardio.chronoDebut && /\+20 XP/.test(await p.locator('.focus-exercice .xp-cardio').innerText()), JSON.stringify(c.cardio));
    await ctx.close(); }

  console.log('\n=== 3. Le jour « Cardio » : un choix, une vraie carte, une séance enregistrée avec sa notation ; Progrès a la courbe ===');
  { const charges = { rameur: [{ date: ilYA(9), series: [], cardio: { duree_s: 1200, distance: 3 } }, { date: ilYA(4), series: [], cardio: { duree_s: 1500, distance: 3.8 } }] };
    const { ctx, p } = await ouvrir({ rep: muscler, code: 'solo-cardio11kkk', extra: { charges, reglages: { photoOblig: false, decay: false, sons: false } } });
    check('le bouton Cardio annonce « 5 à 20 XP selon la durée » (plus « +30 XP »)', await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Cardio/.test(x.innerText.trim())); return b && /5 à 20 XP selon la durée/.test(b.innerText) && !/\+30 XP/.test(b.innerText); }));
    await p.locator('button', { hasText: /^Cardio/ }).first().tap(); await p.waitForTimeout(800);
    check('le jour Cardio ouvre sur le choix de l\'appareil, sans appareil photo', (await p.locator('.choix-cardio').count()) === 1 && !/📷/.test(await p.locator('.choix-cardio').innerText()));
    await p.locator('.choix-cardio button', { hasText: 'Rameur' }).tap(); await p.waitForTimeout(700);
    check('« Rameur » devient un exercice de la séance du jour (carte cardio), le choix disparaît', (await p.locator('button[data-exo="rameur"]').count()) === 1 && (await p.locator('.choix-cardio').count()) === 0 && /CARDIO/.test(await texte(p)));
    await ouvrirFocus(p, 'Rameur');
    const focus = p.locator('.focus-exercice');
    check('« dernier : 25 min · 3,8 km » rappelé', /dernier : 25 min · 3,8 km/.test(await focus.innerText()), (await focus.innerText()).slice(0, 200));
    for (let k = 0; k < 5; k++) await appui(p, focus.locator('.duree-cardio button', { hasText: /^[+＋]$/ }));
    for (let k = 0; k < 8; k++) await appui(p, focus.locator('.champ-cardio[data-champ="resistance"] button', { hasText: /^[+＋]$/ }));
    await focus.locator('.terminer-cardio').tap(); await p.waitForTimeout(700);
    let st = await etat(p);
    check('validé : cardioFait, 15 XP pour 20 min, résistance 8 notée', st.jour[jour].cardioFait === true && st.jour[jour].xpExos.rameur === 15 && st.charges.rameur[2].cardio.duree_s === 1200 && st.charges.rameur[2].cardio.resistance === 8, JSON.stringify([st.jour[jour].xpExos, st.charges.rameur[2]]));
    await p.locator('button', { hasText: 'Terminer la séance' }).tap(); await p.waitForTimeout(900);
    st = await etat(p);
    const h = st.histo[0];
    check('historique : type K, journal avec la notation (durée, résistance), marqué cardio', h.type === 'K' && h.cardio === true && h.exos[0].id === 'rameur' && h.exos[0].fait && h.exos[0].cardio.duree_s === 1200 && h.exos[0].cardio.resistance === 8, JSON.stringify(h));
    check('célébration « Cardio enregistré »', /Cardio enregistré/.test(await texte(p)));
    await p.locator('button', { hasText: 'Continuer' }).tap(); await p.waitForTimeout(400);
    await p.locator('button', { hasText: 'Progrès' }).first().tap(); await p.waitForTimeout(800);
    const g = p.locator('.graphe-cardio');
    check('Progrès : la courbe du rameur (3 fois), « dernier : 20 min · niveau 8 », pointillé de la distance', (await g.count()) === 1 && /Rameur/.test(await g.innerText()) && /3 fois/.test(await g.innerText()) && /dernier : 20 min · niveau 8/.test(await g.innerText()) && /pointillé : distance/.test(await g.innerText()), await g.innerText());
    check('l\'historique lit « Cardio — Rameur 20 min · niveau 8 »', /Cardio — Rameur 20 min · niveau 8/.test(await texte(p)));
    await ctx.close(); }

  console.log('\n=== 4. « Ajuster ma séance » : sans objectif cardio, l\'option explicite avec le choix de l\'appareil ; avec, le cardio vient d\'office ===');
  { const { ctx, p, prog } = await ouvrir({ rep: muscler, code: 'solo-cardio11adj' });
    check('« Me muscler » : aucun cardio d\'office dans le programme', !Object.values(prog.seances).some(s => s.exos.some(e => e.type === 'cardio')));
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await p.locator('.bouton-adapter').tap(); await p.waitForTimeout(500);
    const panneau = p.locator('.panneau-ajuster');
    await panneau.locator('input[aria-label="Minutes disponibles"]').fill('90'); await p.waitForTimeout(400);
    check('avec 90 min : « Ajouter 15 min de cardio ? » proposé, sur « Non » par défaut, pas de cardio dans les compléments', (await panneau.locator('.option-cardio').count()) === 1 && /Ajouter 15 min de cardio \?/.test(await panneau.locator('.option-cardio').innerText()) && (await panneau.locator('.bascule-cardio').innerText()) === 'Non' && !/cardio/i.test(await panneau.locator('.ajout').allInnerTexts().then(l => l.join(' '))));
    await panneau.locator('.bascule-cardio').tap(); await p.waitForTimeout(400);
    const appareils = await panneau.locator('.appareils-cardio button').allInnerTexts();
    check('« Oui » : le choix de l\'appareil (tapis, vélo, rameur…)', appareils.length >= 3 && appareils.some(a => /Rameur/.test(a)), appareils.join(','));
    await panneau.locator('.appareils-cardio button', { hasText: 'Rameur' }).tap(); await p.waitForTimeout(400);
    check('… et le cardio demandé apparaît dans l\'aperçu des compléments', /cardio demandé/.test(await panneau.innerText()));
    await panneau.locator('button', { hasText: /^Ajuster/ }).tap().catch(async () => { await panneau.locator('button').filter({ hasText: /Ajuster|Appliquer|C'est parti/ }).first().tap(); }); await p.waitForTimeout(800);
    const st = await etat(p);
    const S = st.jour[jour].adaptee && st.jour[jour].adaptee.seance;
    check('séance ajustée : le rameur (15 min) en fin de séance, typé cardio', S && S.exos[S.exos.length - 1].id === 'rameur' && S.exos[S.exos.length - 1].type === 'cardio' && S.exos[S.exos.length - 1].dose === '15 min', S && JSON.stringify(S.exos.map(e => e.id)));
    check('… avec sa carte cardio dans la séance', (await p.locator('button[data-exo="rameur"]').count()) === 1);
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rep: poids, code: 'solo-cardio11ad2' });
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await p.locator('.bouton-adapter').tap(); await p.waitForTimeout(500);
    const panneau = p.locator('.panneau-ajuster');
    await panneau.locator('input[aria-label="Minutes disponibles"]').fill('90'); await p.waitForTimeout(400);
    check('« Perdre du poids » : la séance a déjà son finisher, pas d\'option à part (le cardio est dans le programme)', (await panneau.locator('.option-cardio').count()) === 0);
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent${ko ? ' — ' + ko + ' en échec' : ''}`);
  process.exit(ko ? 1 : 0);
})();
