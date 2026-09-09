// 07 — v20.5, retours terrain : chaque écran d'onboarding tient sans défiler ET remplit ≥ 85 % de
// la hauteur, sur un viewport iPhone réel (390×664, barres Safari) et en plein écran (390×844) ;
// toasts (4 s, tap, erreurs persistantes) ; « dernier » à 0 ; cagnotte sur les jours prévus ;
// « À savoir » fermable ; bulle « Ta base » en puces ; chrono et bouton de repos ; charges facultatives.
// Lancer via node outils/tests/lancer.js (mocks sur 8323 et 8324)
const { chromium } = require('playwright');
const M = require('../../moteur-programmes.js');
const banque = require('../../banque-exercices.json');
const U = 'http://127.0.0.1:8323/app.html';
const U_SANS = 'http://127.0.0.1:8324/app.html';
const jour = new Date().toISOString().slice(0, 10);
const ilYA = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? '✔' : '✘'} ${nom}${cond || detail === undefined ? '' : ' — ' + String(detail).slice(0, 220)}`); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const tap = async (p, t) => { await p.locator('button', { hasText: t }).first().tap(); await p.waitForTimeout(450); };
  const texte = p => p.evaluate(() => document.body.innerText);
  // tient sans défiler ET remplit ≥ 85 % de la hauteur visible : le bas de l'élément le plus bas
  const mesure = p => p.evaluate(() => {
    const H = window.innerHeight;
    let bas = 0;
    for (const el of document.body.querySelectorAll('*')) {
      const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) bas = Math.max(bas, r.bottom);
    }
    return { H, defile: document.documentElement.scrollHeight > H + 4, remplissage: Math.round(bas / H * 100) };
  });
  const ecran = async (p, nom, vp) => { const m = await mesure(p); check(`${nom} (${vp}) : tient sans défiler et remplit ≥ 85 % (${m.remplissage} %)`, !m.defile && m.remplissage >= 85, JSON.stringify(m)); };

  for (const [vp, height] of [['390×664 Safari', 664], ['390×844 plein écran', 844]]) {
    console.log(`\n=== Onboarding sur ${vp} : chaque écran tient sans défiler et remplit ≥ 85 % ===`);
    const ctx = await b.newContext({ viewport: { width: 390, height }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1200);
    await ecran(p, 'promesse', vp);
    await tap(p, "C'est parti"); await ecran(p, 'mode', vp);
    check('mode : trois cartes denses, non étirées (hauteur < 120 px)', await p.evaluate(() => { const c = [...document.querySelectorAll('.carte-mode')]; return c.length === 3 && c.every(x => x.getBoundingClientRect().height < 120); }));
    await tap(p, 'En solo');
    const etapes = [['3 séance', 'question fréquence'], ['Me tonifier', 'question objectif'], ['Jamais', 'question expérience'], ['Pas sûr·e', 'question technique'], ['Non, pas en ce moment', 'question sport'], ['Continuer', 'question matériel'], ['Voir mon programme', 'question temps'], ['Suivant', 'récompenses']];
    for (const [bouton, nom] of etapes) { await ecran(p, nom, vp); await tap(p, bouton); }
    await ecran(p, 'prénom', vp);
    await ctx.close();
    // le coach par lien d'invitation, et l'écran d'invitation en duo
    const ctx2 = await b.newContext({ viewport: { width: 390, height }, hasTouch: true, isMobile: true });
    const p2 = await ctx2.newPage();
    await p2.goto(U + '?code=duo-testabcd', { waitUntil: 'load' }); await p2.waitForTimeout(1000);
    await ecran(p2, 'coach par lien', vp);
    await ctx2.close();
    const ctx3 = await b.newContext({ viewport: { width: 390, height }, hasTouch: true, isMobile: true });
    const p3 = await ctx3.newPage();
    await p3.goto(U, { waitUntil: 'load' }); await p3.waitForTimeout(1000);
    await tap(p3, "C'est parti"); await tap(p3, 'En duo');
    for (const [bouton] of etapes) await tap(p3, bouton);
    await p3.locator('input[placeholder="Ton prénom / pseudo"]').fill('Léa');
    await tap(p3, 'Démarrer'); await p3.waitForTimeout(600);
    await ecran(p3, 'invitation', vp);
    await ctx3.close();
  }

  // ---------- profils prêts pour la suite ----------
  const rep = { frequence: 3, objectif: 'mieux', muscu: 'jamais', technique: 'pas_sur', materiel: 'salle', tempsMin: 60 };
  const prog = M.programmePourApp(rep, banque);
  const ouvrir = async ({ url = U, extra = {}, solo = true, code = 'solo-terrainab', vus = true, height = 780, ua }) => {
    const ctx = await b.newContext({ viewport: { width: 390, height }, hasTouch: true, isMobile: true, ...(ua ? { userAgent: ua } : {}) });
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x7', nom: 'Sam', role: 'coachee', solo: ex.solo, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'x7'); localStorage.setItem('lvlup-tour:x7', '1');
      localStorage.setItem('lvlup-s:x7', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: ex.rep, xp: 300, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: true, sons: false, pot: true }, adresse: 'neutre', profilEnregistre: true, vus: ex.vus ? { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 } : {}, ...ex.extra }));
    }, [{ prog, rep, extra, solo, code, vus }, jour]);
    return { ctx, p };
  };
  const etat = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x7')));

  console.log('\n=== Toasts : 4 s, fermeture au tap, erreurs jusqu\'au tap, lisibles au-dessus des Réglages ===');
  { const { ctx, p } = await ouvrir({ url: U_SANS, extra: { decayCursor: jour } });
    await p.goto(U_SANS, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    await p.locator('xpath=//div[div[normalize-space()="Rappel du soir"]]/following-sibling::button[1]').first().tap(); await p.waitForTimeout(500);
    const t = p.locator('.toast-erreur');
    check('activer les rappels sans clé serveur → erreur explicite « Rappels indisponibles côté serveur … configuration en cours »', (await t.count()) === 1 && /Rappels indisponibles côté serveur/.test(await t.innerText()) && /configuration en cours/.test(await t.innerText()), (await t.count()) && await t.innerText());
    check('l\'erreur est lisible : au-dessus du panneau Réglages, sur plusieurs lignes, entièrement visible', await p.evaluate(() => { const e = document.querySelector('.toast-erreur'); if (!e) return false; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const dessus = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return r.right <= window.innerWidth && r.left >= 0 && cs.whiteSpace !== 'nowrap' && (dessus === e || e.contains(dessus)); }));
    await p.waitForTimeout(4500);
    check('… et reste après 4,5 s (jusqu\'au tap)', (await t.count()) === 1);
    await t.first().tap(); await p.waitForTimeout(300);
    check('un tap la ferme', (await p.locator('.toast-erreur').count()) === 0);
    await ctx.close(); }
  // iPhone dans l'onglet Safari (pas sur l'écran d'accueil) : le message dit le geste exact
  { const { ctx, p } = await ouvrir({ extra: { decayCursor: jour }, ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    await p.locator('xpath=//div[div[normalize-space()="Rappel du soir"]]/following-sibling::button[1]').first().tap(); await p.waitForTimeout(500);
    const t = p.locator('.toast-erreur');
    check('iPhone hors écran d\'accueil → « Ajoute Level Up! à ton écran d\'accueil pour activer les rappels », avec Partager → Sur l\'écran d\'accueil', (await t.count()) === 1 && /Ajoute Level Up! à ton écran d'accueil pour activer les rappels/.test(await t.innerText()) && /Partager/.test(await t.innerText()) && /Sur l'écran d'accueil/.test(await t.innerText()), (await t.count()) && await t.innerText());
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ extra: { decayCursor: jour } });
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('button', { hasText: 'Habitudes' }).first().tap(); await p.waitForTimeout(600);
    // une habitude sans photo (« 3 vrais repas ») : le toast « Noté » est un message ordinaire
    await p.locator('main button', { hasText: '3 vrais repas' }).first().tap(); await p.waitForTimeout(300);
    const n1 = await p.locator('.toast').count();
    await p.waitForTimeout(3000);
    const n2 = await p.locator('.toast').count();
    await p.waitForTimeout(1500);
    const n3 = await p.locator('.toast').count();
    check('un message ordinaire reste au moins 3,3 s puis disparaît avant 5 s', n1 >= 1 && n2 >= 1 && n3 === 0, [n1, n2, n3].join('/'));
    await ctx.close(); }

  console.log('\n=== « dernier » : revenir à 0 avec les boutons efface bien la charge ===');
  { const { ctx, p } = await ouvrir({ extra: { decayCursor: jour } });
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(800);
    const exo = Object.values(prog.seances)[0].exos.find(e => e.charge);
    await p.locator('button[aria-expanded]', { hasText: exo.nom }).first().tap(); await p.waitForTimeout(500);
    const ouvert = p.locator('button[aria-expanded="true"]').locator('xpath=..');
    // les boutons du stepper écoutent les événements pointer (appui long possible) : on les envoie tels quels
    const appui = async b => { await b.dispatchEvent('pointerdown'); await p.waitForTimeout(60); await b.dispatchEvent('pointerup'); await p.waitForTimeout(800); };
    const plus = ouvert.locator('button', { hasText: /^[+＋]$/ }).first(), moins = ouvert.locator('button', { hasText: /^[−-]$/ }).first();
    await appui(plus);
    let st = await etat(p);
    const exId = Object.keys(st.charges)[0];
    check('« + » : 2,5 kg enregistrés sur la série 1', exId && st.charges[exId][0].series[0] === 2.5, JSON.stringify(st.charges));
    await appui(moins); await p.waitForTimeout(300);
    st = await etat(p);
    check('« − » : retour à 0, la charge enregistrée devient 0 (plus 2,5)', st.charges[exId][0].series[0] === 0, JSON.stringify(st.charges[exId]));
    check('le champ de charge est dit facultatif', /CHARGE PAR SÉRIE \(KG\) · facultatif/i.test(await ouvert.innerText()));
    check('sous la case « J\'ai tenu N reps » : le signal pour monter la charge', /Tout tenu \? C'est le signal pour monter la charge la prochaine fois — les dernières séries devraient être dures\./.test(await ouvert.innerText()));
    // le bouton de repos ressemble à un bouton : bordure et texte de la couleur de la séance, libellé d'action
    const rb = ouvert.locator('.bouton-repos');
    check('« Fin de série → lancer le repos » : un vrai bouton (bordure colorée, libellé d\'action)', (await rb.count()) === 1 && /Fin de série → lancer le repos/.test(await rb.innerText()) && await rb.evaluate(el => getComputedStyle(el).borderColor !== 'rgba(255, 255, 255, 0.12)'));
    await rb.tap(); await p.waitForTimeout(500);
    check('le chrono apparaît centré, sans translation horizontale résiduelle', await p.evaluate(() => { const c = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).position === 'fixed' && d.style.bottom && /Repos/i.test(d.innerText)); if (!c) return false; const r = c.getBoundingClientRect(); const cs = getComputedStyle(c); return cs.transform === 'none' && Math.abs((r.left + r.right) / 2 - window.innerWidth / 2) < 2; }));
    check('sons du gainage : go discret, tic des 3 dernières secondes, fin distincte', await p.evaluate(() => typeof bipGo === 'function' && typeof bipTic === 'function' && typeof bipFinTravail === 'function' && audioTic instanceof Audio));
    await ctx.close(); }

  console.log('\n=== Cagnotte : seuls les jours de séance prévus manqués comptent ===');
  { const semaine = prog.moteur.semaine;
    const prevu = k => { const g = new Date(k + 'T12:00:00').getDay(); const e = semaine.find(x => x.jour === (g === 0 ? 7 : g)); return !!(e && e.lettre); };
    const manques = [ilYA(3), ilYA(2), ilYA(1)];
    const attendu = manques.filter(prevu).length;
    const { ctx, p } = await ouvrir({ solo: false, code: 'duo-cagnotteab', extra: { decayCursor: ilYA(4) } });
    const corps = [];
    p.on('request', r => { if (/\/pot$/.test(r.url()) && r.method() === 'POST') corps.push(r.postData()); });
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1600);
    const st = await etat(p);
    check(`3 jours sans passage : −75 XP (la décroissance ne change pas)`, st.xp === 225, st.xp);
    check(`cagnotte : ${attendu} jour(s) de séance prévu(s) manqué(s) envoyé(s) au pot, pas 3`, attendu < 3 ? (attendu === 0 ? corps.length === 0 : corps.length === 1 && JSON.parse(corps[0]).jours === attendu) : corps.length === 1 && JSON.parse(corps[0]).jours === 3, JSON.stringify(corps) + ' semaine=' + JSON.stringify(semaine.map(j => j.lettre)));
    await ctx.close(); }

  console.log('\n=== « À savoir sur ce programme » : fermable, reste dans Mon programme ; bulle « Ta base » en puces ===');
  { const progA = JSON.parse(JSON.stringify(prog)); progA.moteur.avertissements = ["Test d'avertissement du moteur"];
    const { ctx, p } = await ouvrir({ extra: { programmePerso: progA, decayCursor: jour }, vus: false });
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1400);
    check('bulle « Ta base » : 4 puces numérotées, une action par puce', (await p.locator('.bulle-puces li').count()) === 4 && /Ta base/.test(await texte(p)));
    await p.locator('button', { hasText: /^C'est clair$/ }).first().tap(); await p.waitForTimeout(400);
    check('la carte « À savoir » est là, avec « Compris »', (await p.locator('.avertissements-programme').count()) === 1 && (await p.locator('.fermer-avertissements').count()) === 1);
    await p.locator('.fermer-avertissements').tap(); await p.waitForTimeout(400);
    check('« Compris » la ferme pour de bon', (await p.locator('.avertissements-programme').count()) === 0 && (await etat(p)).avertissementsFermes === "Test d'avertissement du moteur");
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
    check('… et elle ne revient pas au démarrage suivant', (await p.locator('.avertissements-programme').count()) === 0);
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    check('elle reste accessible dans Réglages → Mon programme', (await p.locator('.avertissements-programme').count()) === 1 && /Test d'avertissement du moteur/.test(await texte(p)));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
