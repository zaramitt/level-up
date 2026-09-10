// 09d — v20.10, retours terrain sur la v20.9 : bugs et clarté. Champs de saisie à 16 px (plus de zoom iOS),
// table des négos harmonisée, « + » des reps dans la carte, « Déplacer » explicite + appui long pour glisser,
// « Ajouter un exercice après celui-ci », gainage avec Remplacer / Ajouter après, carte « premiers XP »
// fermable et qui disparaît, idées « Niveau 2 » avec progression et mesure.
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
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:xd')));
  const ouvrir = async ({ rep, extra = {}, solo = true, code = 'solo-clarte10abc', profil = true } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = rep ? M.programmePourApp(rep, banque) : null;
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif') || !ex.profil) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'xd', nom: 'Sam', role: 'coachee', solo: ex.solo, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'xd'); localStorage.setItem('lvlup-tour:xd', '1');
      localStorage.setItem('lvlup-s:xd', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra, solo, code, profil }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p, prog };
  };
  const ppl = { frequence: 6, objectif: 'muscler', muscu: 'an', technique: 'oui', materiel: 'salle', tempsMin: 60 };
  const lignes = p => p.evaluate(() => [...document.querySelectorAll('button[data-exo]')].map(b => b.innerText.split('\n')[0].replace(/^\d+\. /, '')));
  const ouvrirFocus = async (p, nom) => { await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.click(); }, nom); await p.waitForTimeout(500); };
  // tous les champs texte / numériques / textarea / select visibles font au moins 16 px (Safari iOS ne zoome plus)
  const champsPetits = p => p.evaluate(() => [...document.querySelectorAll('input, textarea, select')].filter(e => !['checkbox', 'range', 'file', 'radio'].includes(e.type) && e.offsetParent !== null).map(e => ({ t: e.type, ph: e.placeholder || e.value || e.tagName, fs: parseFloat(getComputedStyle(e).fontSize) })).filter(x => x.fs < 16));

  console.log('=== 1. Plus aucun champ de saisie sous 16 px (zoom iOS) : onboarding, récompenses, négos, réglages, séance ===');
  { const { ctx, p } = await ouvrir({ profil: false });
    // onboarding : on avance jusqu'au prénom
    let petits = await champsPetits(p);
    check('écran d\'accueil : aucun champ sous 16 px', petits.length === 0, JSON.stringify(petits));
    for (let k = 0; k < 14; k++) { if ((await p.locator('input[placeholder*="prénom" i]').count())) break; const btn = p.locator('button', { hasText: /Continuer|Suivant|C'est parti|Je me coache|Commencer|On y va/ }).first(); if (!(await btn.count())) break; await btn.tap({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(350); const opt = p.locator('button[aria-pressed="false"], button.choix').first(); if (await opt.count()) { await opt.tap().catch(() => {}); await p.waitForTimeout(200); } petits = petits.concat(await champsPetits(p)); }
    check('parcours d\'onboarding (dont le prénom) : aucun champ sous 16 px', petits.length === 0, JSON.stringify(petits));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rep: ppl, solo: false, code: 'duo-clarte10abc' });
    let petits = [];
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, 'Développé couché');
    await p.locator('.focus-exercice div', { hasText: /^kg$/ }).first().tap(); await p.waitForTimeout(200);
    petits = petits.concat(await champsPetits(p));
    await p.locator('.fermer-focus').tap(); await p.waitForTimeout(300);
    await p.locator('.ajouter-exercice').tap(); await p.waitForTimeout(400);
    await p.locator('.onglet-panneau', { hasText: 'Toute la banque' }).tap(); await p.waitForTimeout(300);
    petits = petits.concat(await champsPetits(p));
    await p.locator('button', { hasText: 'Fermer' }).last().tap(); await p.waitForTimeout(300);
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(1200);
    petits = petits.concat(await champsPetits(p));
    await p.locator('button[aria-label="Réglages"], button:has-text("Réglages")').first().tap().catch(() => {}); await p.waitForTimeout(600);
    petits = petits.concat(await champsPetits(p));
    check('séance (saisie de charge, recherche du panneau), récompenses / négos, réglages : aucun champ sous 16 px', petits.length === 0, JSON.stringify(petits));
    await ctx.close(); }

  console.log('\n=== 2. Table des négos harmonisée, « + » des reps dans la carte, « Déplacer », libellés, gainage ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl, solo: false, code: 'duo-clarte10abc' });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(1200);
    const tn = p.locator('.table-negos');
    check('table des négos : un en-tête comme « Le Pari » (titre + sous-titre) puis une ligne de puces (duo, actualiser)', (await tn.count()) === 1 && /La table des négos/.test(await tn.innerText()) && /un aller-retour, réponse sous 48 h/.test(await tn.innerText()) && (await tn.locator('.negos-puces').count()) === 1 && /duo «/.test(await tn.locator('.negos-puces').innerText()));
    check('… plus de ligne « Un aller-retour max · réponse sous 48 h » à part', !/Un aller-retour max · réponse/.test(await p.evaluate(() => document.body.innerText)));
    check('idées pré-remplies : « Niveau 2 », plus « N2 »', await p.evaluate(() => { const t = document.body.innerText; return /· Niveau 2/.test(t) && !/· N2\b/.test(t); }));
    await p.locator('button', { hasText: 'Séance' }).first().tap(); await p.waitForTimeout(600);
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    const A = prog.seances.A;
    await ouvrirFocus(p, A.exos[0].nom);
    const focus = p.locator('.focus-exercice');
    const carte = await focus.boundingBox();
    const plus = await focus.locator('.reps-serie').first().locator('button', { hasText: /^[+＋]$/ }).boundingBox();
    check('le « + » des reps reste dans la carte focus', plus && carte && plus.x + plus.width <= carte.x + carte.width - 4, JSON.stringify([plus, carte]));
    check('« + Ajouter un exercice après celui-ci » (plus « + Ajouter après »)', (await focus.locator('.ajouter-apres').innerText()).trim() === '+ Ajouter un exercice après celui-ci');
    check('« Déplacer » est un bouton explicite, sans flèches nues', (await focus.locator('.deplacer-exercice').innerText()).trim() === 'Déplacer' && (await focus.locator('.monter').count()) === 0);
    await focus.locator('.deplacer-exercice').tap(); await p.waitForTimeout(300);
    check('… qui ouvre un menu « Monter d\'une place » / « Descendre d\'une place » et rappelle l\'appui long', (await focus.locator('.menu-deplacer').count()) === 1 && /Monter d'une place/.test(await focus.locator('.menu-deplacer').innerText()) && /Descendre d'une place/.test(await focus.locator('.menu-deplacer').innerText()) && /appuie longtemps/.test(await focus.locator('.menu-deplacer').innerText()));
    await focus.locator('.descendre').tap(); await p.waitForTimeout(400);
    let l = await lignes(p);
    check('« Descendre d\'une place » déplace bien', l[1] === A.exos[0].nom);
    await p.locator('.fermer-focus').tap(); await p.waitForTimeout(300);
    // gainage : Remplacer + Ajouter après
    const g = A.gainage[0];
    await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.scrollIntoView(); b.click(); }, g.nom); await p.waitForTimeout(500);
    check('gainage : « Remplacer » et « + Ajouter un exercice après celui-ci » présents', (await p.locator('.remplacer-gainage').count()) === 1 && (await p.locator('.ajouter-apres-gainage').count()) === 1);
    await p.locator('.remplacer-gainage').tap(); await p.waitForTimeout(600);
    const panneau = p.locator('.panneau-exercices');
    const premiers = await panneau.locator('.exo-candidat').evaluateAll(l => l.slice(0, 5).map(b => b.dataset.id));
    const gainages = new Set(banque.exercices.filter(e => e.compartiment === 'gainage').map(e => e.id));
    check('… le panneau propose des gainages en premier (remplaçants directs), puis les similaires du focus', (await panneau.count()) === 1 && premiers.length >= 2 && premiers.slice(0, 2).every(id => gainages.has(id)), premiers.join(','));
    await panneau.locator('.exo-candidat').first().tap(); await p.waitForTimeout(600);
    let st = await etat(p);
    const nouveau = st.jour[jour].remplacements && st.jour[jour].remplacements[g.id];
    check('… remplacé pour le jour : le bloc gainage montre le nouveau, le programme est intact', !!nouveau && gainages.has(nouveau.id) && await p.evaluate(n => document.body.innerText.includes(n), nouveau.nom) && st.programmePerso.seances.A.gainage[0].id === g.id, JSON.stringify(nouveau && nouveau.nom));
    await p.evaluate(n => { const b = [...document.querySelectorAll('button[aria-expanded]')].find(x => x.textContent.includes(n)); b.scrollIntoView(); if (b.getAttribute('aria-expanded') !== 'true') b.click(); }, nouveau.nom); await p.waitForTimeout(400);
    await p.locator('.ajouter-apres-gainage').tap(); await p.waitForTimeout(500);
    const propos = await panneau.locator('.exo-candidat').evaluateAll(l => l.map(b => b.dataset.id));
    check('« Ajouter après » depuis un gainage : « Similaires » propose des gainages, jamais celui déjà dans la séance', propos.length >= 2 && propos.every(id => gainages.has(id)) && !propos.includes(nouveau.id), propos.join(','));
    const cand = propos[0];
    await panneau.locator('.exo-candidat').first().tap(); await p.waitForTimeout(600);
    st = await etat(p);
    const aj = st.jour[jour].ajouts[0];
    check('« Ajouter après » depuis un gainage : un gainage ajouté rejoint le bloc gainage, juste après', aj && aj.id === cand && aj.apres === nouveau.id && await p.evaluate(([a, b]) => { const t = [...document.querySelectorAll('button[data-gain]')].map(x => x.dataset.gain); return t.indexOf(a) >= 0 && t.indexOf(b) === t.indexOf(a) + 1; }, [nouveau.id, aj.id]), JSON.stringify([aj && aj.apres, nouveau.id, cand, await p.evaluate(() => [...document.querySelectorAll('button[data-gain]')].map(x => x.dataset.gain))]));
    await ctx.close(); }

  console.log('\n=== 3. Appui long dans la liste : glisser un exercice à la place voulue (tactile, sans casser le défilement) ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    const cdp = await ctx.newCDPSession(p);
    const centre = async id => { const bb = await p.locator(`button[data-exo="${id}"]`).boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }; };
    // un doigt qui bouge tout de suite : c'est un défilement, rien ne se déplace
    let c0 = await centre(A.exos[0].id);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [c0] });
    await p.waitForTimeout(120);
    for (let k = 1; k <= 6; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c0.x, y: c0.y + 30 * k }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500);
    let st = await etat(p);
    check('glisser sans appui long = défilement : l\'ordre ne bouge pas, pas de focus ouvert', !st.jour[jour].ordre && (await p.locator('.focus-exercice').count()) === 0);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300);
    // appui long, puis glisser le 1er exercice sous le 3e
    c0 = await centre(A.exos[0].id);
    const c2 = await centre(A.exos[2].id);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [c0] });
    await p.waitForTimeout(650);
    check('après 450 ms sans bouger : l\'exercice est soulevé (classe en-vol)', (await p.locator('.ligne-exercice.en-vol').count()) === 1);
    const pas = 8;
    for (let k = 1; k <= pas; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c0.x, y: c0.y + (c2.y + 10 - c0.y) * k / pas }] }); await p.waitForTimeout(30); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500);
    st = await etat(p);
    const l = await lignes(p);
    check('relâché sous le 3e : il prend la 3e place, l\'ordre du jour est mémorisé, le programme est intact', l[2] === A.exos[0].nom && l[0] === A.exos[1].nom && st.jour[jour].ordre && st.jour[jour].ordre[2] === A.exos[0].id && st.programmePerso.seances.A.exos[0].id === A.exos[0].id, l.slice(0, 3).join(' | '));
    check('le relâchement n\'ouvre pas la carte focus (clic avalé)', (await p.locator('.focus-exercice').count()) === 0);
    await p.waitForTimeout(400);
    await p.locator(`button[data-exo="${A.exos[0].id}"]`).tap(); await p.waitForTimeout(400);
    check('un tap normal ouvre toujours la carte', (await p.locator('.focus-exercice').count()) === 1);
    await ctx.close(); }

  console.log('\n=== 4. Carte « Gagne tes premiers XP » : fermable, et disparaît d\'elle-même dès les premiers XP ===');
  { const { ctx, p } = await ouvrir({ rep: ppl, extra: { xp: 0 } });
    check('à 0 XP : la carte est là, avec sa croix', (await p.locator('.carte-premiers-xp').count()) === 1 && (await p.locator('.fermer-premiers-xp').count()) === 1);
    await p.locator('.fermer-premiers-xp').tap(); await p.waitForTimeout(800);
    check('la croix la ferme, et c\'est mémorisé', (await p.locator('.carte-premiers-xp').count()) === 0 && (await etat(p)).carteXPFermee === true, JSON.stringify([(await p.locator('.carte-premiers-xp').count()), (await etat(p)).carteXPFermee]));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    check('… même après rechargement', (await p.locator('.carte-premiers-xp').count()) === 0);
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rep: ppl, extra: { xp: 5 }, code: 'solo-clarte10xp2' });
    check('dès les premiers XP gagnés (5 XP) : la carte a disparu d\'elle-même', (await p.locator('.carte-premiers-xp').count()) === 0);
    await ctx.close(); }

  console.log('\n=== 5. Idées de récompenses : progression pendant l\'attente, mesure du serveur, « Niveau » ===');
  { const { ctx, p } = await ouvrir({ rep: ppl, solo: false, code: 'duo-clarte10abc' });
    await p.route(/\/api\/[^/]+\/idees$/, async route => { await new Promise(r => setTimeout(r, 1800)); await route.continue(); });
    let corps = null; p.on('request', r => { if (/\/idees$/.test(r.url())) corps = r.postDataJSON(); });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(1000);
    await p.locator('button', { hasText: 'Générer des idées de récompenses' }).tap(); await p.waitForTimeout(1200);
    check('pendant l\'attente : compteur de secondes et barre de progression', (await p.locator('.attente-idees').count()) === 1 && (await p.locator('.progression-idees').count()) === 1 && /Une vingtaine de secondes/.test(await p.evaluate(() => document.body.innerText)));
    await p.locator('.idee').first().waitFor({ timeout: 8000 }); await p.waitForTimeout(150);
    const t = await p.evaluate(() => document.body.innerText);
    check('à la réponse : les idées, « · Niveau 2 » (plus « N2 »), et la mesure du serveur en toast (« 8 idées en 1 s »)', (await p.locator('.idee').count()) === 8 && /· Niveau 2/.test(t) && /8 idées en 1 s/.test(t), t.match(/idées en[^\n]*/) && t.match(/idées en[^\n]*/)[0]);
    check('la demande porte solo:false en duo', corps && corps.solo === false, JSON.stringify(corps));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent${ko ? ' — ' + ko + ' en échec' : ''}`);
  process.exit(ko ? 1 : 0);
})();
