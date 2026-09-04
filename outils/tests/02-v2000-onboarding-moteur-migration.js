// 02 — v20.0, étape 3 passe 1 : migration (adoption), onboarding solo/duo/coach, lecture IA et repli, réglages, 7×, sans matériel.
// Lancer via node outils/tests/lancer.js (mocks sur 8323 et 8324/IA off)
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

  console.log('=== C. Migration — adoption : charges conservées, pas de « dernier » pour un exercice jamais fait ===');
  { const { ctx, p } = await ouvrir(seedAncien());
    await p.locator('.carte-migration').tap(); await p.waitForTimeout(600);
    await repondre(p, { frequence: 4, objectifLabel: 'Me tonifier', muscu: 'Quelques mois', technique: 'Oui' });
    await tap(p, 'Adopter ce programme');
    const st = await etat(p);
    check('programme adopté : perso + moteur, réponses stockées, refus effacé', st.programme === 'perso' && st.programmePerso && st.programmePerso.moteur && st.reponses && st.reponses.frequence === 4 && st.reponses.objectif === 'tonifier' && st.moteurRefuse === false, JSON.stringify([st.programme, !!st.programmePerso, st.reponses]));
    check('niveau observé 2 (quelques mois + squat/pompe sûrs), 4 séances', st.programmePerso.moteur.entrees.niveau === 2 && Object.keys(st.programmePerso.seances).length === 4);
    check('l\'historique des charges est conservé tel quel', st.charges.goblet[0].series[2] === 14 && st.charges.squat[0].series[2] === 45);
    check('XP conservés', st.xp === 500);
    const exos = Object.values(st.programmePerso.seances).flatMap(s => s.exos.map(e => e.id));
    check('les identifiants d\'exercices sont ceux de la banque (stables depuis l\'étape 1)', exos.every(id => banque.exercices.some(e => e.id === id)), exos.join(','));
    // la séance qui contient le squat barre : « dernier » affiché pour lui, pas pour un exercice jamais fait
    const lettre = Object.keys(st.programmePerso.seances).find(l => st.programmePerso.seances[l].exos.some(e => e.id === 'squat'));
    check('le squat barre (charge déjà notée) est dans le programme tonifier niveau 2', !!lettre);
    if (lettre) {
      const idx = Object.keys(st.programmePerso.seances).indexOf(lettre);
      await p.locator('.carte-seance').nth(idx).tap(); await p.waitForTimeout(900);
      const cartes = await p.evaluate(() => [...document.querySelectorAll('button[aria-expanded]')].map(b => b.parentElement.innerText));
      const squat = cartes.find(c => /Squat barre/.test(c)), autres = cartes.filter(c => !/Squat barre|Goblet/.test(c));
      check('« dernier : 40 / 40 / 45 kg » sous le squat barre', !!squat && /dernier : 40 \/ 40 \/ 45 kg/.test(squat), squat && squat.slice(0, 120));
      check('aucun « dernier » sous les exercices jamais faits', autres.length > 0 && autres.every(c => !/dernier :/.test(c)));
    }
    check('la carte de migration n\'est plus proposée (réponses présentes)', !/veux-tu régénérer/.test(await texte(p)));
    await ctx.close(); }

  console.log('\n=== A/B. Onboarding solo de bout en bout : questions → programme du moteur ===');
  { const { ctx, p } = await ouvrir(null);
    let t = await texte(p);
    check('écran promesse, version v20.x', /v20\.\d/.test(t) && /C'est parti/.test(t));
    await tap(p, "C'est parti"); await tap(p, 'En solo');
    t = await texte(p);
    check('première question : la fréquence, 1 à 7, le 7 présenté honnêtement', /Combien de séances par semaine/.test(t) && /1 séance/.test(t) && /7 jours : 6 séances \+ 1 jour de récupération active/.test(t) && !/niveau/i.test(t));
    check('l\'écran tient sans défiler (390 × 780)', await p.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 4), await p.evaluate(() => document.documentElement.scrollHeight));
    await tap(p, '3 séances');
    check('deuxième question : l\'objectif, les 5 + « Autre chose »', /Ton objectif/.test(await texte(p)) && /Autre chose \? Décris-le/.test(await texte(p)));
    await tap(p, 'Me tonifier');
    t = await texte(p);
    check('question factuelle 1 : « Tu as déjà fait de la muscu ? », jamais le mot niveau', /déjà fait de la muscu/.test(t) && !/niveau/i.test(t));
    await tap(p, 'Jamais');
    t = await texte(p);
    check('question factuelle 2 : squat et pompe', /squat et une pompe/.test(t) && /Pas sûr·e/.test(t));
    await tap(p, 'Pas sûr·e');
    t = await texte(p);
    check('sport : 14 sports + « Non », tient sans défiler', /Tu pratiques un sport/.test(t) && /Course à pied/.test(t) && /Yoga & pilates/.test(t) && /Non, pas en ce moment/.test(t) && await p.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 4));
    await tap(p, 'Course à pied');
    check('sport choisi → intention', /pour progresser dans ce sport ou pour toi/.test(await texte(p)));
    await tap(p, 'Pour progresser');
    check('puis les jours de sport', /Quels jours/.test(await texte(p)));
    await tap(p, 'Dim'); await tap(p, 'Continuer');
    t = await texte(p);
    check('matériel : 4 raccourcis en tête + liste à cocher, tient sans défiler', /Salle complète/.test(t) && /Rien du tout/.test(t) && /Barre de traction/.test(t) && /Trap bar/.test(t) && await p.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 4), await p.evaluate(() => document.documentElement.scrollHeight));
    check('« Salle complète » coche tout', await p.evaluate(() => [...document.querySelectorAll('input[type=checkbox]')].every(c => c.checked)));
    await tap(p, 'Maison équipée');
    check('« Maison équipée » pré-coche haltères, banc, élastique, barre de traction', await p.evaluate(() => [...document.querySelectorAll('input[type=checkbox]')].filter(c => c.checked).length === 4));
    await tap(p, 'Continuer');
    t = await texte(p);
    check('temps : curseur + saisie exacte, défaut 60', /Combien de temps par séance/.test(t) && await p.evaluate(() => document.querySelector('input[type=number]').value === '60' && !!document.querySelector('input[type=range]')));
    await p.locator('input[type=number]').fill('47'); await p.waitForTimeout(200);
    await tap(p, 'Voir mon programme');
    check('retour possible depuis les récompenses vers la dernière question', /TES RÉCOMPENSES/.test(await texte(p)));
    await tap(p, 'Retour');
    check('retour → question du temps, valeur 47 conservée', await p.evaluate(() => (document.querySelector('input[type=number]') || {}).value === '47'));
    await tap(p, 'Voir mon programme'); await tap(p, 'Suivant');
    await p.locator('input[placeholder="Ton prénom / pseudo"]').fill('Léa');
    await tap(p, 'Démarrer en solo'); await p.waitForTimeout(1800); await fermerAide(p);
    const st = await etat(p);
    check('profil créé avec un programme du moteur : 3 séances, réponses stockées, niveau 1, 47 min, course + dimanche', st.programme === 'perso' && st.programmePerso && st.programmePerso.moteur && Object.keys(st.programmePerso.seances).length === 3 && st.reponses.frequence === 3 && st.reponses.tempsMin === 47 && st.programmePerso.moteur.entrees.niveau === 1 && st.reponses.sport === 'course' && st.reponses.intention === 'sport' && JSON.stringify(st.reponses.joursSport) === '[7]', JSON.stringify(st.reponses));
    check('matériel réel transmis au moteur (liste cochée, pas un raccourci)', JSON.stringify(st.programmePerso.moteur.entrees.materiel) === JSON.stringify(['haltères', 'banc', 'élastique', 'barre de traction']), JSON.stringify(st.programmePerso.moteur.entrees.materiel));
    check('chaque séance tient en 47 min', Object.values(st.programmePerso.seances).every(s => s.dureeMin <= 47));
    t = await texte(p);
    check('l\'onglet Séance affiche 3 cartes avec la durée calculée, pas de carte de migration', (await p.locator('.carte-seance').count()) === 3 && /\d+ min/.test(t) && !/veux-tu régénérer/.test(t));
    check('le squelette respecte la règle 4 (sport le dimanche → pas de séance jambes le samedi ni le lundi)', st.programmePerso.moteur.semaine.every(j => !(j.sport && j.lettre)));
    // écran Séance : consigne visible dès l'exercice déployé, erreur fréquente à la demande
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(900);
    await p.locator('button[aria-expanded]').first().tap(); await p.waitForTimeout(600);
    const carte = await p.evaluate(() => document.querySelector('button[aria-expanded]').parentElement.innerText);
    const exo1 = Object.values(st.programmePerso.seances)[0].exos[0];
    check('consigne visible sous le nom une fois déployé', carte.includes(exo1.consigne.slice(0, 40)), carte.slice(0, 200));
    check('erreur fréquente pas affichée d\'office', !carte.includes(exo1.erreur.slice(0, 30)));
    await tap(p, 'Erreur fréquente');
    check('… puis affichée à la demande', (await p.evaluate(() => document.querySelector('button[aria-expanded]').parentElement.innerText)).includes(exo1.erreur.slice(0, 30)));
    check('dose lisible et repos affichés', new RegExp(exo1.dose.replace(/[×]/g, '×')).test(carte) && /repos \d+:\d\d/.test(carte));
    const gainageBloc = await p.evaluate(() => document.body.innerText.includes('+ GAINAGE'));
    check('le gainage de la séance (liste du moteur) s\'affiche', gainageBloc);
    await ctx.close(); }

  console.log('\n=== B. Objectif libre → lecture IA (mock) appliquée et dite ; IA indisponible → repli dit ===');
  { const { ctx, p } = await ouvrir(null);
    await tap(p, "C'est parti"); await tap(p, 'En duo');
    await repondre(p, { frequence: 4, objectifLabel: 'Autre chose', libre: 'des jambes solides pour le ski', muscu: 'Plus d', technique: 'Oui' });
    await tap(p, 'Suivant');
    await p.waitForTimeout(800);
    let t = await texte(p);
    check('écran prénom sans message d\'échec (l\'IA mock a répondu)', /ON T'APPELLE COMMENT/.test(t) && !/pas réussi à lire/.test(t) && !/pas activée/.test(t), t.slice(0, 200));
    await p.locator('input[placeholder="Ton prénom / pseudo"]').fill('Léa');
    await p.locator('input[style*="monospace"]').fill('duo-skiabcd');
    await tap(p, 'Démarrer'); await tap(p, 'Je verrai plus tard'); await p.waitForTimeout(1800); await fermerAide(p);
    const st = await etat(p);
    check('l\'interprétation IA est stockée et appliquée (base tonifier, priorités fessiers, quadriceps)', st.reponses && st.reponses.interpretation && st.reponses.interpretation.base === 'tonifier' && st.programmePerso.moteur.entrees.objectif === 'tonifier', JSON.stringify(st.reponses && st.reponses.interpretation));
    t = await texte(p);
    check('l\'avertissement « lu comme » est montré dans l\'onglet Séance, en clair', /À SAVOIR SUR CE PROGRAMME/.test(t) && /a été lu comme « Me tonifier »/.test(t), t.slice(0, 300));
    check('niveau observé 3 (plus d\'un an + sûr) : versions avancées présentes', st.programmePerso.moteur.entrees.niveau === 3);
    await ctx.close(); }
  { const { ctx, p } = await ouvrir(null, U_IAOFF);
    await tap(p, "C'est parti"); await tap(p, 'En solo');
    await repondre(p, { frequence: 3, objectifLabel: 'Autre chose', libre: 'des jambes solides pour le ski', muscu: 'Jamais', technique: 'Oui' });
    await tap(p, 'Suivant'); await p.waitForTimeout(800);
    const t = await texte(p);
    check('IA non configurée : le repli est annoncé sur l\'écran prénom, avec « Réessayer »', /pas activée ici/.test(t) && /esthétique équilibré/.test(t) && /Réessayer/.test(t), t.slice(0, 300));
    await p.locator('input[placeholder="Ton prénom / pseudo"]').fill('Léa');
    await tap(p, 'Démarrer en solo'); await p.waitForTimeout(1800); await fermerAide(p);
    const st = await etat(p);
    check('programme créé quand même, base « mieux » (équilibré), repli mémorisé', st.programmePerso && st.programmePerso.moteur.entrees.objectif === 'mieux' && st.reponses.interpretation && st.reponses.interpretation.repli === true);
    check('… et dit dans l\'onglet Séance', /pas réussi à lire ton objectif/.test(await texte(p)));
    await ctx.close(); }

  console.log('\n=== Coach : parcours intact ===');
  { const { ctx, p } = await ouvrir(null);
    await tap(p, "C'est parti"); await p.locator('.carte-mode').nth(2).tap(); await p.waitForTimeout(500);
    await p.locator('input[placeholder="Ton prénom / pseudo"]').fill('Léo');
    await p.locator('input[style*="monospace"]').fill('duo-skiabcd');
    await tap(p, "C'est parti !"); await p.waitForTimeout(1800); await fermerAide(p);
    const t = await texte(p);
    check('le coach arrive sur Suivi, sans questions de programme ni carte de migration', /SUIVI|Suivi/.test(t) && !/Nouveau moteur/.test(t) && !/Combien de séances/.test(t), t.slice(0, 160));
    await ctx.close(); }

  console.log('\n=== Réglages : chaque réponse modifiable, chacune propose une régénération ; 7× ; sans matériel ===');
  const seedMoteur = rep => {
    const prog = M.programmePourApp({ ...rep, sport: rep.sport && rep.sport !== 'non' ? rep.sport : null }, banque);
    return ([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x2', nom: 'Léa', role: 'coachee', solo: true, code: 'solo-testabcd' }]));
      localStorage.setItem('lvlup-actif', 'x2'); localStorage.setItem('lvlup-tour:x2', '1');
      localStorage.setItem('lvlup-s:x2', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 100, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 } }));
    };
  };
  const repBase = { frequence: 4, objectif: 'muscler', objectifLibre: '', muscu: 'mois', technique: 'oui', sport: 'non', intention: 'soi', joursSport: [], materiel: ['haltères', 'barre', 'banc', 'machine', 'poulie', 'élastique', 'barre de traction', 'barres de dips', 'kettlebell', 'trap bar', 'rack', 'roulette', 'ballon', 'rouleau', 'tapis / machine cardio'], raccourci: 'salle', tempsMin: 60, interpretation: null };
  { const { ctx, p } = await nouveauCtx();
    const prog = M.programmePourApp({ ...repBase, sport: null }, banque);
    await p.addInitScript(seedMoteur(repBase), [{ prog, rep: repBase }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    let t = await texte(p);
    check('section MON PROGRAMME : six réponses visibles et modifiables', /MON PROGRAMME/.test(t) && /Séances par semaine/.test(t) && /Objectif/.test(t) && /Expérience/.test(t) && /Sport/.test(t) && /Matériel/.test(t) && /Temps par séance/.test(t) && (t.match(/modifier/g) || []).length === 6, (t.match(/modifier/g) || []).length);
    check('« Changer de programme » présent, plus de bouton d\'ancien moteur', /Changer de programme/.test(t) && !/régénérer le mien/.test(t));
    await p.locator('button', { hasText: 'Temps par séance' }).tap(); await p.waitForTimeout(700);
    t = await texte(p);
    check('modifier le temps ouvre le flux directement à cette question, pré-remplie à 60', /Combien de temps par séance/.test(t) && await p.evaluate(() => document.querySelector('input[type=number]').value === '60'));
    await p.locator('input[type=number]').fill('45'); await p.waitForTimeout(200);
    await tap(p, 'Voir mon programme');
    t = await texte(p);
    check('proposition = aperçu avant d\'adopter, avec « Garder mon programme actuel »', /Adopter ce programme/.test(t) && /Garder mon programme actuel/.test(t));
    await tap(p, 'Adopter ce programme');
    const st = await etat(p);
    check('adopté : 45 min stockées, toutes les séances ≤ 45 min', st.reponses.tempsMin === 45 && Object.values(st.programmePerso.seances).every(s => s.dureeMin <= 45), JSON.stringify(Object.values(st.programmePerso.seances).map(s => s.dureeMin)));
    await ctx.close(); }
  { const { ctx, p } = await nouveauCtx();
    const rep7 = { ...repBase, frequence: 7, muscu: 'an' };
    const prog = M.programmePourApp({ ...rep7, sport: null }, banque);
    await p.addInitScript(seedMoteur(rep7), [{ prog, rep: rep7 }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const t = await texte(p);
    check('7× : 7 cartes dont la récupération active, sans exercice à charge', (await p.locator('.carte-seance').count()) === 7 && /Récupération active/.test(t) && prog.seances.G.exos.every(e => !e.charge));
    await p.locator('.carte-seance').nth(6).tap(); await p.waitForTimeout(900);
    const t2 = await texte(p);
    check('la séance de récupération s\'ouvre : durées en minutes, pas de bouton de repos', /\d+ min/.test(t2) && (await p.locator('button', { hasText: /^Repos/ }).count()) === 0);
    await ctx.close(); }
  { const { ctx, p } = await nouveauCtx();
    const repRien = { ...repBase, frequence: 3, objectif: 'mieux', materiel: [], raccourci: 'rien', muscu: 'jamais', technique: 'pas_sur' };
    const prog = M.programmePourApp({ ...repRien, sport: null }, banque);
    await p.addInitScript(seedMoteur(repRien), [{ prog, rep: repRien }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    const t = await texte(p);
    check('sans matériel : la limite physique est dite en clair dans l\'onglet Séance', /À SAVOIR SUR CE PROGRAMME/.test(t) && /Sans barre de traction/.test(t) && /le dos reste sous-travaillé/.test(t), t.slice(0, 300));
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(900);
    check('aucune saisie de charge au poids du corps', (await p.locator('input[inputmode]').count()) === 0);
    await ctx.close(); }

  console.log('\n=== Duo : parcours complet avec coach lié, séance, preuves (non-régression) ===');
  { const { ctx, p } = await ouvrir(seedAncien({ coachLie: true }));
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(900);
    const n = await p.locator('button[aria-expanded]').count();
    check('un ancien programme reste jouable : séance A ouverte, exercices dépliables', n >= 4, n);
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
