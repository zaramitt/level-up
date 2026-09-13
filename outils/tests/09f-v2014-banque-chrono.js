// 09f — v20.14, retours terrain de Léo sur la v20.11 : glisser-déposer entre un exercice validé et un exercice à
// faire, recherche par alias avec une faute tolérée, filtre muscle avec les secondaires, difficulté libellée,
// provenance de la dose du remplaçant, « Retirer » en rouge discret, chrono de repos en pilule déplaçable.
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
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:xf')));
  const ouvrir = async ({ rep, extra = {}, code = 'solo-banque14abc' } = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = rep ? M.programmePourApp(rep, banque) : null;
    await p.addInitScript(([ex, jk]) => {
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'xf', nom: 'Sam', role: 'coachee', solo: true, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'xf'); localStorage.setItem('lvlup-tour:xf', '1');
      localStorage.setItem('lvlup-s:xf', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false }, adresse: 'neutre', profilEnregistre: true, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.extra }));
    }, [{ prog, rep, extra, code }, jour]);
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p, prog };
  };
  const ppl = { frequence: 6, objectif: 'muscler', muscu: 'an', technique: 'oui', materiel: 'salle', tempsMin: 60 };
  const jourEnCours = (A, faits) => ({ [jour]: { seance: 'A', faits, gainage: [], cardioFait: false, valide: false, gainValide: false, photos: {}, ajouts: [], retires: [], ordre: null } });
  const lignes = p => p.evaluate(() => [...document.querySelectorAll('[data-ligne]')].map(b => b.dataset.ligne));
  const centre = async (p, sel) => { const bb = await p.locator(sel).boundingBox(); return { x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }; };
  const ouvrirFocus = async (p, id) => { await p.locator(`button[data-exo="${id}"]`).tap(); await p.waitForTimeout(500); };

  console.log('=== 1. Glisser-déposer : déposer entre le n°2 (terminé) et le n°3 (à faire) ===');
  { const rep = ppl; const prog = M.programmePourApp(rep, banque); const A = prog.seances.A;
    const { ctx, p } = await ouvrir({ rep, extra: { jour: jourEnCours(A, [A.exos[0].id, A.exos[1].id]) } });
    check('les lignes validées sont aussi des zones de dépôt (data-ligne), pas seulement les lignes à faire', (await lignes(p)).join(',') === A.exos.map(e => e.id).join(','), (await lignes(p)).join(','));
    await p.evaluate(() => window.scrollTo(0, 220)); await p.waitForTimeout(300);
    const cdp = await ctx.newCDPSession(p);
    const b1 = await p.locator(`[data-ligne="${A.exos[1].id}"]`).boundingBox(), b2 = await p.locator(`[data-ligne="${A.exos[2].id}"]`).boundingBox();
    const c0 = await centre(p, `button[data-exo="${A.exos[4].id}"]`);
    const cible = { x: c0.x, y: (b1.y + b1.height + b2.y) / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [c0] });
    await p.waitForTimeout(650);
    check('appui long : le 5e exercice est soulevé', (await p.locator('.ligne-exercice.en-vol').count()) === 1);
    const pas = 10;
    for (let k = 1; k <= pas; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c0.x, y: c0.y + (cible.y - c0.y) * k / pas }] }); await p.waitForTimeout(30); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500);
    const st = await etat(p);
    const attendu = [A.exos[0].id, A.exos[1].id, A.exos[4].id, A.exos[2].id, A.exos[3].id, A.exos[5].id];
    check('relâché pile entre le validé n°2 et le n°3 : il prend la 3e place, juste après les validés', JSON.stringify(st.jour[jour].ordre) === JSON.stringify(attendu) && (await lignes(p)).join(',') === attendu.join(','), JSON.stringify(st.jour[jour].ordre));
    await ctx.close(); }

  console.log('\n=== 2. Panneau : recherche par alias avec une faute, filtre muscle avec les secondaires, niveau libellé, provenance de la dose ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await p.locator('.ajouter-exercice, button:has-text("Ajouter un exercice")').first().tap().catch(() => {}); await p.waitForTimeout(500);
    if (!(await p.locator('.panneau-exercices').count())) { await ouvrirFocus(p, A.exos[0].id); await p.locator('.ajouter-apres').first().tap(); await p.waitForTimeout(500); }
    const panneau = p.locator('.panneau-exercices');
    check('le panneau s\'ouvre', (await panneau.count()) === 1);
    await panneau.locator('.onglet-panneau').nth(1).tap(); await p.waitForTimeout(300);
    const ids = () => panneau.locator('.exo-candidat').evaluateAll(l => l.map(b => b.dataset.id));
    await p.locator('.recherche-exo').fill('leg extention'); await p.waitForTimeout(300);
    check('« leg extention » (une faute) trouve le leg extension', (await ids()).includes('leg_extension'), (await ids()).join(','));
    await p.locator('.recherche-exo').fill('Extension de jambes'); await p.waitForTimeout(300);
    check('« Extension de jambes » (alias, majuscule, accents) aussi', (await ids()).includes('leg_extension'), (await ids()).join(','));
    await p.locator('.recherche-exo').fill('tirage-poulie-basse'); await p.waitForTimeout(300);
    check('« tirage-poulie-basse » (tirets) retrouve le tirage horizontal poulie', (await ids()).includes('rowing'), (await ids()).join(','));
    const texte = await panneau.locator('.exo-candidat').first().innerText();
    check('la difficulté est libellée « Niveau N — … », jamais un chiffre seul', /Niveau [123] — (débutant|intermédiaire|avancé)/.test(texte), texte);
    await p.locator('.recherche-exo').fill(''); await p.waitForTimeout(200);
    await panneau.locator('select[aria-label="Muscle"]').selectOption('fessiers'); await p.waitForTimeout(300);
    const parFessiers = await ids();
    check('filtre « fessiers » : le squat (fessiers en secondaire) apparaît avec le hip thrust (principal)', parFessiers.includes('squat') && parFessiers.includes('hipthrust'), parFessiers.slice(0, 12).join(','));
    await panneau.locator('button:has-text("Fermer")').tap(); await p.waitForTimeout(400);
    // remplacement : la provenance de la dose est dite sur chaque candidat
    await ouvrirFocus(p, A.exos[0].id);
    await p.locator('.focus-exercice button:has-text("Remplacer")').first().tap(); await p.waitForTimeout(500);
    const prov = await p.locator('.panneau-exercices .provenance-dose').evaluateAll(l => l.map(x => x.innerText));
    check('remplacer : chaque candidat dit d\'où vient sa dose (« Même séries et repos que l\'exercice remplacé… » ou « Dose de la banque : … »)', prov.length >= 2 && prov.every(t => /^Même séries et repos que l'exercice remplacé/.test(t) || /^Dose de la banque : /.test(t)), prov.join(' | '));
    check('… et les remplaçants directs gardent la dose de l\'original', prov.some(t => /^Même séries et repos/.test(t)), prov.join(' | '));
    await ctx.close(); }

  console.log('\n=== 3. « Retirer » en rouge discret, distinct des actions neutres ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, A.exos[0].id);
    const couleurs = await p.evaluate(() => { const r = document.querySelector('.retirer-exercice'), a = document.querySelector('.ajouter-apres'); const c = e => getComputedStyle(e).color; return { retirer: c(r), ajouter: c(a) }; });
    check('« Retirer » est rouge, « Ajouter » reste neutre', /rgb\(2[34]\d, 1[01]\d, 1[01]\d\)|rgb\(240, 113, 106\)/.test(couleurs.retirer) && couleurs.retirer !== couleurs.ajouter, JSON.stringify(couleurs));
    await ctx.close(); }

  console.log('\n=== 4. Chrono de repos : pilule compacte, agrandie au tap, déplaçable, position mémorisée ===');
  { const { ctx, p, prog } = await ouvrir({ rep: ppl });
    const A = prog.seances.A;
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, A.exos[0].id);
    await p.locator('.focus-exercice button:has-text("lancer le repos")').first().tap(); await p.waitForTimeout(600);
    check('le repos lancé apparaît en pilule compacte', (await p.locator('.chrono-flottant.pilule .chrono-pilule').count()) === 1 && (await p.locator('.chrono-flottant').innerText()).length < 12, await p.locator('.chrono-flottant').innerText().catch(() => ''));
    const avant = await p.locator('.chrono-flottant').boundingBox();
    check('la pilule ne recouvre pas la carte focus (elle est en bas à droite, hors du contenu)', avant.width < 160 && avant.y > 600, JSON.stringify(avant));
    await p.locator('.chrono-flottant').tap(); await p.waitForTimeout(400);
    check('un tap l\'agrandit : libellé, chrono en grand, bouton « Passer »', (await p.locator('.chrono-flottant.ouvert').count()) === 1 && (await p.locator('.chrono-passer').count()) === 1);
    await p.locator('.chrono-flottant').tap(); await p.waitForTimeout(400);
    check('un second tap la réduit', (await p.locator('.chrono-flottant.pilule').count()) === 1);
    // glisser la pilule vers le haut à gauche
    const cdp = await ctx.newCDPSession(p);
    const c0 = await centre(p, '.chrono-flottant');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [c0] });
    for (let k = 1; k <= 8; k++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: c0.x - 25 * k, y: c0.y - 55 * k }] }); await p.waitForTimeout(25); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(400);
    const apres = await p.locator('.chrono-flottant').boundingBox();
    check('glisser-déposer : la pilule suit le doigt (elle a monté et s\'est déplacée à gauche), sans s\'agrandir', apres.y < avant.y - 200 && apres.x < avant.x - 100 && (await p.locator('.chrono-flottant.pilule').count()) === 1, JSON.stringify({ avant, apres }));
    const pos = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-chrono-pos')));
    check('la position est mémorisée', pos && Math.abs(pos.x - apres.x) < 2 && Math.abs(pos.y - apres.y) < 2, JSON.stringify(pos));
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    await ouvrirFocus(p, A.exos[0].id);
    await p.locator('.focus-exercice button:has-text("lancer le repos")').first().tap(); await p.waitForTimeout(600);
    const rechargee = await p.locator('.chrono-flottant').boundingBox();
    check('après rechargement, le chrono revient à la position mémorisée', rechargee && Math.abs(rechargee.x - apres.x) < 2 && Math.abs(rechargee.y - apres.y) < 2, JSON.stringify(rechargee));
    await p.locator('.chrono-flottant').tap(); await p.waitForTimeout(300);
    await p.locator('.chrono-passer').tap(); await p.waitForTimeout(400);
    check('« Passer » dans la version agrandie arrête le repos (le tap du bouton n\'est pas avalé par le glisser)', (await p.locator('.chrono-flottant').count()) === 0);
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
