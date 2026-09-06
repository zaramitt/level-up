// 06 — sécurité, côté front (temps 2 de SECURITE.md) : clé push injectée par le serveur, carte douce
// de réactivation des rappels après changement de clé, rappels indisponibles sans clé.
// Lancer via node outils/tests/lancer.js (mocks sur 8323 — clé factice — et 8324 — sans clé)
const { chromium } = require('playwright');
const M = require('../../moteur-programmes.js');
const banque = require('../../banque-exercices.json');
const U = 'http://127.0.0.1:8323/app.html';
const U_SANS = 'http://127.0.0.1:8324/app.html';
const jour = new Date().toISOString().slice(0, 10);
let ok = 0, ko = 0;
const check = (nom, cond, detail) => { if (cond) ok++; else ko++; console.log(`  ${cond ? '✔' : '✘'} ${nom}${cond || detail === undefined ? '' : ' — ' + String(detail).slice(0, 220)}`); };
// la clé factice que le mock injecte (65 octets : 0x04 puis des zéros)
const CLE_MOCK = 'B' + 'A'.repeat(86);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  // remplace l'API push du navigateur : un abonnement en place pris avec `cleAbonnement`
  // (octets), et un faux gestionnaire qui note ce qu'on lui demande
  const fauxPush = ({ cleAbonnement, sansAbonnement, endpoint }) => {
    const reg = { pushManager: {
      getSubscription: async () => window.__sub,
      subscribe: async o => {
        window.__abonneAvec = Array.from(new Uint8Array(o.applicationServerKey));
        window.__sub = { endpoint: endpoint || 'https://web.push.apple.com/nouveau', options: { applicationServerKey: o.applicationServerKey },
          toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'p', auth: 'a' } }; }, unsubscribe: async () => true };
        return window.__sub;
      } } };
    window.__sub = sansAbonnement ? null : { endpoint: 'https://web.push.apple.com/ancien', options: { applicationServerKey: new Uint8Array(cleAbonnement).buffer },
      toJSON() { return { endpoint: this.endpoint, keys: { p256dh: 'p', auth: 'a' } }; }, unsubscribe: async () => { window.__desabonne = true; return true; } };
    Object.defineProperty(Navigator.prototype, 'serviceWorker', { get: () => ({ register: async () => reg, ready: Promise.resolve(reg), addEventListener() {} }) });
    window.PushManager = function () {};
    window.Notification = { requestPermission: async () => 'granted', permission: 'granted' };
  };
  const ouvrir = async ({ url = U, rappels = true, push, code = 'duo-testabcd', solo = false, role = 'coachee', etat = {} }) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    const prog = M.programmePourApp({ frequence: 3, objectif: 'mieux', muscu: 'jamais', technique: 'pas_sur', materiel: 'salle', tempsMin: 60 }, banque);
    if (push) await p.addInitScript(fauxPush, push);
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x6', nom: 'Sam', role: ex.role, solo: ex.solo, code: ex.code }]));
      localStorage.setItem('lvlup-actif', 'x6'); localStorage.setItem('lvlup-tour:x6', '1');
      localStorage.setItem('lvlup-s:x6', JSON.stringify({ programme: 'perso', programmePerso: ex.prog, reponses: {}, xp: 100, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], jour: {}, habitudes: {}, defis: {}, activeDays: {}, decayCursor: jk, reglages: { photoOblig: false, decay: false, sons: false, rappels: ex.rappels }, adresse: 'neutre', vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex.etat }));
    }, [{ prog, rappels, code, solo, role, etat }, jour]);
    await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    return { ctx, p };
  };
  const texte = p => p.evaluate(() => document.body.innerText);
  const etatLocal = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x6')));
  const profilsMock = async () => { const r = await fetch('http://127.0.0.1:8323/__profils'); return r.json(); };

  console.log('=== La clé publique push vient du serveur, jamais du code ===');
  { const { ctx, p } = await ouvrir({ rappels: false });
    const meta = await p.evaluate(() => document.querySelector('meta[name="vapid-pub"]').getAttribute('content'));
    check('la page porte la clé injectée par le serveur dans <meta name="vapid-pub">', meta === CLE_MOCK, meta);
    check('aucune clé VAPID en dur dans le code de la page', await p.evaluate(() => ![...document.scripts].some(s => /const VAPID_PUB = "B[A-Za-z0-9_-]{80,}"/.test(s.textContent))));
    await ctx.close(); }

  console.log('\n=== Rappels voulus, abonnement pris avec une ancienne clé : une carte, un tap ===');
  { const { ctx, p } = await ouvrir({ rappels: true, push: { cleAbonnement: Array(65).fill(9) } });
    let t = await texte(p);
    check('la carte apparaît, avec un texte simple : « On a renforcé la sécurité de l\'app. Réactive tes rappels en un tap »', /On a renforcé la sécurité de l'app\. Réactive tes rappels en un tap/.test(t) && (await p.locator('.carte-push').count()) === 1, t.slice(0, 200));
    check('aucun vocabulaire technique sur la carte (clé, VAPID, serveur, abonnement)', !/VAPID|clé|serveur|abonnement/i.test(await p.locator('.carte-push').innerText()));
    const requetes = [];
    p.on('request', r => { if (/\/api\/duo-testabcd\/(abonner|desabonner)/.test(r.url())) requetes.push({ url: r.url(), corps: r.postData() }); });
    await p.locator('button', { hasText: 'Réactiver mes rappels' }).tap(); await p.waitForTimeout(900);
    const abonneAvec = await p.evaluate(() => window.__abonneAvec);
    check('un tap : l\'ancien abonnement est retiré, le nouveau est pris avec la clé courante', await p.evaluate(() => window.__desabonne === true) && Array.isArray(abonneAvec) && abonneAvec[0] === 4 && abonneAvec.length === 65 && abonneAvec.slice(1).every(x => x === 0), JSON.stringify(abonneAvec && abonneAvec.slice(0, 4)));
    check('… et déposé sur le serveur (POST /abonner avec le nouvel endpoint)', requetes.some(r => /\/abonner$/.test(r.url) && /nouveau/.test(r.corps || '')), JSON.stringify(requetes).slice(0, 200));
    t = await texte(p);
    check('la carte disparaît, un mot de confirmation', (await p.locator('.carte-push').count()) === 0 && /Rappels réactivés/.test(t));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rappels: true, push: { sansAbonnement: true } });
    check('rappels voulus mais abonnement perdu : la carte est proposée aussi', (await p.locator('.carte-push').count()) === 1);
    await ctx.close(); }

  console.log('\n=== Pas de carte quand tout est en ordre ===');
  { const cle = [4].concat(Array(64).fill(0));
    const { ctx, p } = await ouvrir({ rappels: true, push: { cleAbonnement: cle } });
    check('abonnement déjà pris avec la clé courante : aucune carte', (await p.locator('.carte-push').count()) === 0);
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rappels: false, push: { cleAbonnement: Array(65).fill(9) } });
    check('rappels non activés : aucune carte, même avec un vieil abonnement', (await p.locator('.carte-push').count()) === 0);
    await ctx.close(); }

  console.log('\n=== Serveur sans clé push : rappels indisponibles, dit clairement ===');
  { const { ctx, p } = await ouvrir({ url: U_SANS, rappels: false, push: { sansAbonnement: true } });
    check('sans clé côté serveur : meta vide', (await p.evaluate(() => document.querySelector('meta[name="vapid-pub"]').getAttribute('content'))) === '');
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    await p.locator('xpath=//div[div[normalize-space()="Rappel du soir"]]/following-sibling::button[1]').first().tap();
    await p.waitForTimeout(600);
    const t = await texte(p);
    check('activer les rappels → « Rappels indisponibles pour le moment »', /Rappels indisponibles pour le moment/.test(t), t.slice(t.indexOf('Rappel du soir'), t.indexOf('Rappel du soir') + 200));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ url: U_SANS, rappels: true, push: { cleAbonnement: Array(65).fill(9) } });
    check('sans clé côté serveur : pas de carte de réactivation (rien à réactiver vers)', (await p.locator('.carte-push').count()) === 0);
    await ctx.close(); }

  console.log('\n=== Service push hors liste (Apple, Google/FCM, Mozilla) : refusé, dit simplement ===');
  { const { ctx, p } = await ouvrir({ rappels: false, push: { sansAbonnement: true, endpoint: 'https://wns2-par02p.notify.windows.com/w/?token=x' } });
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    await p.locator('xpath=//div[div[normalize-space()="Rappel du soir"]]/following-sibling::button[1]').first().tap(); await p.waitForTimeout(800);
    const t = await texte(p);
    check('endpoint refusé par le serveur → « Ce service de notifications n\'est pas encore accepté par l\'app », rappels non activés', /service de notifications n'est pas encore accepté par l'app/.test(t) && (await etatLocal(p)).reglages.rappels !== true, t.slice(-200));
    await ctx.close(); }

  console.log('\n=== Routes IA : le code est enregistré côté serveur, une fois ; les refus sont dits clairement ===');
  { await fetch('http://127.0.0.1:8323/__reset');
    const { ctx, p } = await ouvrir({ rappels: false, code: 'duo-enregabcd' });
    await p.waitForTimeout(600);
    let m = await profilsMock();
    check('un profil existant enregistre son code au premier démarrage (POST /profil)', m.codes.includes('duo-enregabcd') && m.enregistrements === 1, JSON.stringify(m));
    check('… et s\'en souvient (profilEnregistre)', (await etatLocal(p)).profilEnregistre === true);
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
    m = await profilsMock();
    check('au démarrage suivant, pas de nouvel enregistrement', m.enregistrements === 1, JSON.stringify(m));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rappels: false, code: 'solo-budgetabcd', solo: true, etat: { profilEnregistre: true } });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(700);
    const bouton = p.locator('button', { hasText: 'Générer des idées de récompenses' });
    check('le panneau d\'idées est là (profil solo, récompenses auto-définies)', (await bouton.count()) === 1);
    await bouton.first().tap(); await p.waitForTimeout(900);
    const t = await texte(p);
    check('budget de toute l\'app atteint → « Le quota d\'idées du jour est atteint pour toute l\'app — réessaie demain »', /Le quota d'idées du jour est atteint pour toute l'app — réessaie demain/.test(t), t.slice(-250));
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ rappels: false, code: 'solo-quotaabcd', solo: true, etat: { profilEnregistre: true } });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(700);
    await p.locator('button', { hasText: 'Générer des idées de récompenses' }).first().tap(); await p.waitForTimeout(900);
    check('quota du code atteint → « Tu as utilisé tes 10 idées du jour — réessaie demain »', /Tu as utilisé tes 10 idées du jour — réessaie demain/.test(await texte(p)));
    await ctx.close(); }
  { // un code jamais enregistré côté serveur (mock relancé) : le premier refus 403 déclenche l'enregistrement, puis l'appel repasse
    await fetch('http://127.0.0.1:8323/__reset');
    const { ctx, p } = await ouvrir({ rappels: false, code: 'solo-neufabcd', solo: true, etat: { profilEnregistre: true } });
    await p.locator('button', { hasText: 'Récomp.' }).first().tap(); await p.waitForTimeout(700);
    await p.locator('button', { hasText: 'Générer des idées de récompenses' }).first().tap(); await p.waitForTimeout(1200);
    const t = await texte(p);
    check('code inconnu du serveur → enregistré à la volée puis idées obtenues (8 « Idée factice »)', (t.match(/Idée factice/g) || []).length === 8 && (await profilsMock()).codes.includes('solo-neufabcd'), t.slice(-200));
    await ctx.close(); }

  await b.close();
  console.log(`\n${ok}/${ok + ko} vérifications passent` + (ko ? ` — ${ko} en échec` : ''));
  process.exit(ko ? 1 : 0);
})();
