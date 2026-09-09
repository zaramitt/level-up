// 08 — v20.6 : noms de séances par muscles, mode focus, séance choisie mise en avant, types de charge
// (poids du corps / lesté / assisté), ajustement dans les deux sens, jours de sport visibles,
// proposition sans coach → inviter, parcours coach par lien, « Ton coach t'attend », Progrès vide.
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
  const tap = async (p, t) => { await p.locator('button', { hasText: t }).first().tap(); await p.waitForTimeout(450); };
  const texte = p => p.evaluate(() => document.body.innerText);
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x8')));
  const ouvrir = async ({ rep, extra = {}, solo = true, code = 'solo-evolabcd', role = 'coachee', profilExtra = {}, url = U, height = 780 }) => {
    const ctx = await b.newContext({ viewport: { width: 390, height }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = M.programmePourApp(rep, banque);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x8', nom: 'Sam', role: ex.role, solo: ex.solo, code: ex.code, ...ex.profilExtra }]));
      localStorage.setItem('lvlup-actif', 'x8'); localStorage.setItem('lvlup-tour:x8', '1');
      localStorage.setItem('lvlup-s:x8', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra, solo, code, role, profilExtra }, jour]);
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p, prog };
  };
  const ppl = { frequence: 6, objectif: 'muscler', muscu: 'an', technique: 'oui', materiel: 'salle', tempsMin: 60 };
  const maison = { frequence: 3, objectif: 'mieux', muscu: 'mois', technique: 'oui', materiel: 'pdc', tempsMin: 60 };

  console.log('=== 14. Noms de séances : les muscles en grand, le geste en petit ===');
  { const { ctx, p } = await ouvrir({ rep: ppl });
    const cartes = await p.locator('.carte-seance').evaluateAll(l => l.map(c => c.innerText));
    check('carrousel : « Pecs · épaules · triceps » en grand, « Push (poussée) » en petit', /Pecs · épaules · triceps/.test(cartes[0]) && /Push \(poussée\)/.test(cartes[0]) && /Dos · biceps/.test(cartes[1]) && /Jambes · fessiers/.test(cartes[2]), cartes.slice(0, 3).map(c => c.split('\n')[0]).join(' | '));
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    check('en-tête de séance : muscles puis geste entre parenthèses', /Pecs · épaules · triceps \(Push \(poussée\)\)/.test(await texte(p)));
    await ctx.close(); }

  console.log('\n=== 15. Mode focus : la carte s\'ouvre en popup, fermeture par la croix ou un tap à l\'extérieur ; 16. séance choisie en avant ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl, extra: { activeDays: { [ilYA(1)]: true, [ilYA(2)]: true }, histo: [{ date: ilYA(2), type: 'A', xp: 100 }] } });
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    check('après le choix, la séance vient juste sous « Changer de séance » — la grille du mois passe dessous', await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Changer de séance/.test(x.innerText)); const n = b && b.nextElementSibling; return !!n && /SÉANCE/.test(n.innerText); }));
    const lignes = () => p.locator('button[aria-expanded]:not(.focus-exercice button)').count(); // les lignes compactes, pas « Erreur fréquente ? » dans la popup
    const nbAvant = await lignes();
    const exo = Object.values(prog.seances)[0].exos[0];
    await p.locator('button[aria-expanded]', { hasText: exo.nom }).first().tap(); await p.waitForTimeout(500);
    const focus = p.locator('.focus-exercice');
    check('un tap ouvre le mode focus : popup avec le titre, la consigne et la validation photo', (await focus.count()) === 1 && (await focus.innerText()).includes('1. ' + exo.nom) && /Valider avec une photo/.test(await focus.innerText()));
    check('la popup couvre presque tout l\'écran, la liste compacte reste derrière', await focus.evaluate(el => { const r = el.getBoundingClientRect(); return r.height > window.innerHeight * 0.85 && r.width > window.innerWidth * 0.9; }) && (await lignes()) === nbAvant);
    check('fond flouté comme le spotlight', await p.locator('.focus-exercice-fond').evaluate(el => /blur/.test(getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter || el.style.backdropFilter)));
    await p.locator('.fermer-focus').tap(); await p.waitForTimeout(400);
    check('la croix ferme', (await p.locator('.focus-exercice').count()) === 0);
    await p.locator('button[aria-expanded]', { hasText: exo.nom }).first().tap(); await p.waitForTimeout(500);
    await p.locator('.focus-exercice-fond').tap({ position: { x: 195, y: 4 } }); // bande du haut, hors de la carte await p.waitForTimeout(400);
    check('un tap à l\'extérieur ferme aussi', (await p.locator('.focus-exercice').count()) === 0);
    await p.locator('button[aria-expanded]', { hasText: exo.nom }).first().tap(); await p.waitForTimeout(500);
    await p.locator('.focus-exercice .bouton-repos').tap(); await p.waitForTimeout(500);
    check('le chrono de repos s\'affiche au-dessus du focus', await p.evaluate(() => { const c = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).position === 'fixed' && !d.closest('.focus-exercice-fond') && d.style.bottom && /Repos/i.test(d.innerText)); const f = document.querySelector('.focus-exercice-fond'); return !!c && !!f && parseInt(getComputedStyle(c).zIndex) > parseInt(getComputedStyle(f).zIndex); }));
    await ctx.close(); }

  console.log('\n=== 17. Types de charge : poids du corps / lesté / assisté ===');
  { const { ctx, p, prog } = await ouvrir({ rep: maison });
    const S = Object.values(prog.seances)[0];
    const exo = S.exos.find(e => e.pdc && !e.charge);
    check('le moteur signale les exercices faisables au poids du corps', !!exo && S.exos.some(e => e.pdc), S.exos.map(e => e.nom + (e.pdc ? ' (pdc)' : '')).join(', '));
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await p.locator('button[aria-expanded]', { hasText: exo.nom }).first().tap(); await p.waitForTimeout(500);
    const focus = p.locator('.focus-exercice');
    check('le sélecteur poids du corps / lesté / assisté est là, « Poids du corps » par défaut', (await focus.locator('.type-charge button').count()) === 3 && await focus.locator('.type-charge button[aria-pressed="true"]').innerText() === 'Poids du corps');
    check('au poids du corps : pas de saisie de kg, les reps par série (v20.9) et le conseil', (await focus.locator('.charge-pdc').count()) === 1 && /passe en lesté/.test(await focus.innerText()) && (await focus.locator('.reps-pdc .reps-serie').count()) >= 3);
    await focus.locator('.type-charge button', { hasText: 'Assisté' }).tap(); await p.waitForTimeout(400);
    check('assisté : saisie d\'assistance, « moins, c\'est mieux »', /ASSISTANCE PAR SÉRIE \(KG\) · moins, c'est mieux/.test(await focus.innerText()));
    // saisie au clavier : un tap sur la valeur ouvre le champ
    const champ = focus.locator('input[inputmode="decimal"]');
    await focus.locator('div', { hasText: /^kg$/ }).first().tap(); await p.waitForTimeout(200); // valeur vide : le stepper n'affiche que l'unité
    await champ.first().fill('20'); await champ.first().press('Enter'); await p.waitForTimeout(900);
    let st = await etat(p);
    check('20 kg d\'assistance enregistrés en négatif, avec le type', st.charges[exo.id] && st.charges[exo.id][0].series[0] === -20 && st.charges[exo.id][0].type === 'assiste' && st.typesCharge[exo.id] === 'assiste', JSON.stringify(st.charges[exo.id]));
    await p.locator('.fermer-focus').tap(); await p.waitForTimeout(400);
    check('la ligne compacte dit « dernier : 20 kg d\'assistance »', /dernier : 20 kg d'assistance/.test(await texte(p)));
    await p.locator('button[aria-expanded]', { hasText: exo.nom }).first().tap(); await p.waitForTimeout(500);
    await focus.locator('.type-charge button', { hasText: 'Lesté' }).tap(); await p.waitForTimeout(400);
    check('lesté : saisie du lest (+ kg)', /LEST PAR SÉRIE \(KG\)/.test(await focus.innerText()));
    await p.locator('.fermer-focus').tap(); await p.waitForTimeout(300);
    await p.locator('button', { hasText: 'Progrès' }).first().tap(); await p.waitForTimeout(700);
    // v20.7 : un graphique dès la première note (plus de « note unique »)
    check('le graphique tient compte de l\'assistance (valeur négative, note « moins, c\'est mieux »)', (await p.locator('.graphe-charge').count()) === 1 && /kg d'assistance : moins, c'est mieux/.test(await p.locator('.graphe-charge').innerText()));
    await ctx.close(); }

  console.log('\n=== 18. Ajuster dans les deux sens : temps en plus → compléments ; à fond → intensification ===');
  { const rep = { frequence: 4, objectif: 'muscler', muscu: 'mois', technique: 'oui', materiel: 'salle', tempsMin: 60 };
    const { ctx, p, prog } = await ouvrir({ rep });
    const S = Object.values(prog.seances)[0];
    const exoC = S.exos.find(e => e.charge);
    await p.evaluate(([id, d]) => { const s = JSON.parse(localStorage.getItem('lvlup-s:x8')); s.charges[id] = [{ date: d, series: [40, 40, 40] }]; localStorage.setItem('lvlup-s:x8', JSON.stringify(s)); }, [exoC.id, ilYA(3)]);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    check('le bouton est renommé « Ajuster ma séance du jour — temps, énergie »', (await p.locator('button', { hasText: 'Ajuster ma séance du jour — temps, énergie' }).count()) === 1);
    await tap(p, 'Ajuster ma séance du jour — temps, énergie');
    const panneau = p.locator('.panneau-ajuster');
    await panneau.locator('input[aria-label="Minutes disponibles"]').fill('120'); await p.waitForTimeout(400);
    check('120 min : « Tu as du temps en plus, on ajoute ? » avec des compléments proposés', (await panneau.locator('.temps-en-plus').count()) === 1 && /Tu as du temps en plus, on ajoute \?/.test(await panneau.innerText()) && (await panneau.locator('.ajout').count()) >= 1, await panneau.innerText());
    const nbAjouts = await panneau.locator('.ajout').count();
    const resultat = (await panneau.innerText()).match(/Résultat : (\d+) exercice/);
    check('le résultat annonce plus d\'exercices que la séance de base et une durée qui monte', resultat && parseInt(resultat[1]) >= S.exos.length && /· (\d+) min/.test(await panneau.innerText()) && parseInt((await panneau.innerText()).match(/· (\d+) min/)[1]) > S.dureeMin);
    await panneau.locator('.bascule-complements').tap(); await p.waitForTimeout(300);
    check('« Non » retire les compléments du résultat', (await panneau.locator('.ajout').count()) === 0 && parseInt((await panneau.innerText()).match(/Résultat : (\d+) exercice/)[1]) === S.exos.length);
    await panneau.locator('.bascule-complements').tap(); await p.waitForTimeout(300);
    await panneau.locator('button', { hasText: 'À fond' }).tap(); await p.waitForTimeout(300);
    check('« À fond » : une série de plus sur les gros exercices, un cran de charge suggéré', (await panneau.locator('.note-fond').count()) === 1);
    await panneau.locator('button', { hasText: /^Ajuster ma séance$/ }).tap(); await p.waitForTimeout(700);
    const st = await etat(p);
    const A = st.jour[jour].adaptee;
    check('séance ajustée : compléments ajoutés, à fond, tag en en-tête', A && A.seance.adaptee.ajouts.length === nbAjouts && A.seance.adaptee.intensifie && A.seance.exos.length + A.seance.gainage.length === S.exos.length + S.gainage.length + nbAjouts && new RegExp('Séance ajustée · \\d+ min · \\+' + nbAjouts + ' complément').test(await texte(p)) && /· à fond/.test(await texte(p)), JSON.stringify(A && [A.seance.adaptee.ajouts, A.seance.exos.length]));
    check('les gros exercices ont une série de plus', A.seance.exos.filter(e => e.compartiment !== 'isolation' && e.role !== 'complement').every(e => e.series === Math.min(5, S.exos.find(x => x.id === e.id).series + 1)));
    await p.locator('button[aria-expanded]', { hasText: exoC.nom }).first().tap(); await p.waitForTimeout(500);
    const f = p.locator('.focus-exercice');
    check('à fond : la charge est pré-remplie un cran au-dessus de la dernière fois, et dite', (await f.locator('.suggestion-fond').count()) === 1 && /À fond : \+(2,5|5) kg suggéré/.test(await f.innerText()) && /4(2[.,]5|5) kg/.test(await f.innerText()), (await f.innerText()).slice(0, 400));
    await ctx.close(); }

  console.log('\n=== 19-20. Jours de sport jamais bloquants ; sport + progresser visible ===');
  { const rep = { frequence: 6, objectif: 'mieux', muscu: 'mois', technique: 'oui', sport: 'football', intention: 'sport', joursSport: [2, 5], materiel: 'salle', tempsMin: 60 };
    const { ctx, p, prog } = await ouvrir({ rep, extra: { vus: { jour: 1, hab: 1, prog: 1, rec: 1 } } });
    check('6 séances et 2 jours de foot : les 6 sont placées, on s\'entraîne aussi un jour de foot, et c\'est dit', prog.moteur.semaine.filter(j => j.lettre).length === 6 && prog.moteur.semaine.some(j => j.sport && j.lettre) && prog.moteur.avertissements.some(a => /tu t'entraînes aussi certains jours de sport/.test(a)), prog.moteur.avertissements.join(' | '));
    check('« À savoir » le dit dans l\'onglet Séance', /jamais de grosse séance jambes la veille ni le jour même/.test(await texte(p)));
    const notes = Object.values(prog.seances).map(s => s.sport).filter(Boolean);
    check('chaque séance adaptée porte sa phrase « Adapté au foot : … »', notes.length >= 2 && notes.every(n => /^Adapté au foot : /.test(n)), notes.join(' | '));
    const idx = Object.values(prog.seances).findIndex(s => s.sport);
    await p.locator('.carte-seance').nth(idx).tap(); await p.waitForTimeout(800);
    check('… et l\'en-tête de la séance l\'affiche', (await p.locator('.note-sport').count()) >= 1 && /Adapté au foot/.test(await p.locator('.note-sport').first().innerText()));
    await ctx.close(); }

  console.log('\n=== 21. Proposer une récompense sans coach : inviter maintenant ===');
  { await fetch('http://127.0.0.1:8323/__reset');
    const { ctx, p } = await ouvrir({ rep: ppl, solo: false, code: 'duo-sanscoachab' });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(900);
    check('sans coach relié : une carte le dit et propose d\'inviter', (await p.locator('.sans-coach').count()) === 1 && /tes propositions l'attendent/.test(await p.locator('.sans-coach').innerText()));
    await p.locator('input[placeholder="… ou ta propre idée, champ libre"]').fill('Un resto');
    await p.locator('input[placeholder="ex : 4"]').last().fill('3'); // le champ de la table des négos (le premier est celui des kiffs)
    await p.locator('button', { hasText: /^Proposer$/ }).first().tap(); await p.waitForTimeout(800); // le « Proposer » de la table des négos (le second est celui des mini-kiffs)
    const modale = p.locator('.modale-inviter');
    check('après la proposition : « Ta proposition est prête » — inviter maintenant, ou plus tard', (await modale.count()) === 1 && /Ta proposition est prête/.test(await modale.innerText()) && (await modale.locator('button', { hasText: 'Inviter mon coach' }).count()) === 1);
    await modale.locator('button', { hasText: 'Plus tard' }).tap(); await p.waitForTimeout(300);
    check('« Plus tard » referme, la proposition est bien dans la table', (await p.locator('.modale-inviter').count()) === 0 && /Un resto/.test(await texte(p)));
    await ctx.close(); }

  console.log('\n=== 22. Parcours coach par lien : prénom, puis « tu veux aussi t\'entraîner ? » ===');
  { const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(U + '?code=duo-testabcd&de=L%C3%A9a', { waitUntil: 'load' }); await p.waitForTimeout(1200);
    let t = await texte(p);
    check('pas d\'onboarding complet : « TU DEVIENS LE COACH DE LÉA », le code est déjà rempli, on demande juste le prénom', /TU DEVIENS LE COACH DE LÉA/.test(t) && /Léa t'a envoyé ce lien/.test(t) && !/Combien de séances/.test(t) && (await p.locator('input[placeholder="Ton prénom / pseudo"]').count()) === 1);
    check('« Continuer » attend le prénom', await p.locator('button', { hasText: 'Continuer' }).isDisabled());
    await p.locator('input[placeholder="Ton prénom / pseudo"]').fill('Max');
    await tap(p, 'Continuer');
    t = await texte(p);
    check('« Tu veux aussi t\'entraîner, Max ? » — non / en duo avec Léa / avec quelqu\'un d\'autre', /Tu veux aussi t'entraîner, Max \?/.test(t) && /Non, je coache seulement/.test(t) && /Oui, en duo avec Léa/.test(t) && /Oui, avec quelqu'un d'autre/.test(t), t.slice(0, 300));
    await tap(p, 'Non, je coache seulement'); await p.waitForTimeout(1800);
    check('« Non » : profil coach créé, il arrive sur le Suivi', (await p.locator('button', { hasText: 'Suivi' }).count()) >= 1 && await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-profils')).some(x => x.role === 'coach' && x.nom === 'Max' && x.code === 'duo-testabcd')));
    await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(U + '?code=duo-testabcd&de=L%C3%A9a', { waitUntil: 'load' }); await p.waitForTimeout(1200);
    await p.locator('input[placeholder="Ton prénom / pseudo"]').fill('Max');
    await tap(p, 'Continuer'); await tap(p, 'Oui, en duo avec Léa');
    check('« Oui » : le profil coach existe déjà, et l\'onboarding coaché commence (sans recharger)', /Combien de séances par semaine/.test(await texte(p)) && await p.evaluate(() => { const l = JSON.parse(localStorage.getItem('lvlup-profils') || '[]'); return l.length === 1 && l[0].role === 'coach' && !localStorage.getItem('lvlup-actif'); }));
    await ctx.close(); }

  console.log('\n=== 23. « Ton coach t\'attend » : ce que ça implique ; 24. Progrès sans historique ===');
  { const { ctx, p } = await ouvrir({ rep: ppl, solo: false, code: 'duo-attendabcd', profilExtra: { coachEnTete: true } });
    check('la carte « Ton futur coach t\'attend » est là', (await p.locator('.carte-coach').count()) === 1);
    await p.locator('.carte-coach').tap(); await p.waitForTimeout(400);
    const e = p.locator('.explic-coach');
    check('un tap : une ligne explique (voir tes séances, valider, offrir — et que ça ne lui coûte rien)', (await e.count()) === 1 && /voit tes séances/.test(await e.innerText()) && /valide/.test(await e.innerText()) && /ne lui coûte rien/.test(await e.innerText()) && (await e.locator('button', { hasText: "Envoyer l'invitation" }).count()) === 1);
    await p.locator('button', { hasText: 'Progrès' }).first().tap(); await p.waitForTimeout(700);
    check('Progrès sans historique : un graphique exemple grisé, « Ta courbe apparaîtra ici dès ta première charge notée »', (await p.locator('.graphe-exemple .graphe-charge').count()) === 1 && /Ta courbe apparaîtra ici dès ta première charge notée/.test(await texte(p)) && await p.locator('.graphe-exemple').evaluate(el => parseFloat(getComputedStyle(el).opacity) < 0.6));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
