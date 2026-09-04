const { chromium } = require('playwright');
const U = 'http://127.0.0.1:8323/app.html';

const seed = (role, solo) => [role, solo];
const init = ([role, solo]) => {
  localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x1', nom: role === 'coach' ? 'Léo' : 'Léa', role, solo, code: 'duo-testabcd' }]));
  localStorage.setItem('lvlup-actif', 'x1');
  localStorage.setItem('lvlup-tour:x1', '1');
  localStorage.setItem('lvlup-s:x1', JSON.stringify({
    programme: 'fessiers', xp: 500, coachLie: true, styles: ['soins'],
    kiffs: ['Un chocolat chaud offert'],
    recompenses: [{ niveau: 2, label: 'Bubble tea offert', pris: false }, { niveau: 5, label: 'Un resto au choix', pris: false }],
    negos: [], negosImportes: {}, drops: [], vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }
  }));
};
const lire = () => JSON.parse(localStorage.getItem('lvlup-s:x1'));

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  await fetch('http://127.0.0.1:8323/__reset');
  const ouvrir = async (role, solo) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 220)));
    await p.addInitScript(init, seed(role, solo));
    await p.goto(U, { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    await p.tap('nav >> text=' + (role === 'coach' ? 'Négos' : 'Récomp'));
    await p.waitForTimeout(1200);
    return { ctx, p };
  };
  const texte = p => p.evaluate(() => {
    const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    return w.textContent;
  });

  // ============ POINT 1 — ordre des sections ============
  console.log('\n=== POINT 1 — grandes récompenses en tête ===');
  {
    const { ctx, p } = await ouvrir('coachee', false);
    const ordre = await p.evaluate(() => {
      const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
      [...w.querySelectorAll('script,style')].forEach(e => e.remove());
      const t = w.textContent;
      const pos = s => t.indexOf(s);
      return { rec: pos('Les grandes récompenses'), negos: pos('La table des négos'), paris: pos('LES PARIS'), pot: pos('La cagnotte'), coffre: pos('Le coffre mystère') };
    });
    console.log('  positions:', JSON.stringify(ordre));
    console.log('  grandes récompenses AVANT les négos:', ordre.rec >= 0 && ordre.rec < ordre.negos);
    console.log('  ordre complet rec < negos < coffre:', ordre.rec < ordre.negos && ordre.negos < ordre.coffre);
    const y = await p.evaluate(() => {
      const el = [...document.querySelectorAll('div')].find(d => (d.textContent || '').startsWith('Les grandes récompenses —') && d.children.length === 0);
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    console.log('  titre visible sans défilement (top =', y, '):', y !== null && y < 780);
    await p.screenshot({ path: 'v1915-ordre.png' });
    await ctx.close();
  }

  // ============ POINT 2 — mini-kifs ============
  console.log('\n=== POINT 2a — SOLO : mini-kif direct, aucune validation ===');
  {
    const { ctx, p } = await ouvrir('coachee', true);
    await p.fill('input[placeholder="Nouveau mini-kiff…"]', 'Un bain brûlant sans culpabiliser');
    await p.locator('button', { hasText: /^\+$/ }).last().tap();
    await p.waitForTimeout(800);
    const st = await p.evaluate(lire);
    console.log('  kif ajouté directement au coffre:', st.kiffs.includes('Un bain brûlant sans culpabiliser'));
    console.log('  aucune négo créée:', (st.negos || []).length === 0);
    const t = await texte(p);
    console.log('  aucune mention du coach dans l\'écran:', !t.includes('part au coach') && !t.includes('Proposer un mini-kiff au coach'));
    const srv = await p.evaluate(() => fetch('/api/duo-testabcd/negos').then(r => r.json()));
    console.log('  rien envoyé au serveur:', srv.length === 0);
    await p.screenshot({ path: 'v1915-solo.png' });
    await ctx.close();
  }

  console.log('\n=== POINT 2b — DUO coachée : le mini-kif part en négo ===');
  let idNego = null;
  {
    const { ctx, p } = await ouvrir('coachee', false);
    console.log('  bouton « Proposer » (et non « + »):', await p.locator('button', { hasText: 'Proposer' }).count() > 0);
    await p.fill('input[placeholder="Proposer un mini-kiff au coach…"]', 'Un MacBook Pro');
    await p.locator('button', { hasText: 'Proposer' }).last().tap();
    await p.waitForTimeout(1000);
    const st = await p.evaluate(lire);
    console.log('  PAS ajouté au coffre directement:', !st.kiffs.includes('Un MacBook Pro'));
    const srv = await p.evaluate(() => fetch('/api/duo-testabcd/negos').then(r => r.json()));
    console.log('  négo créée côté serveur:', srv.length === 1, '| type:', JSON.stringify(srv[0] && srv[0].type), '| statut:', JSON.stringify(srv[0] && srv[0].statut));
    console.log('  pas de niveau sur la négo kif:', srv[0] && srv[0].niveau === undefined);
    idNego = srv[0] && srv[0].id;
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.tap('nav >> text=Récomp'); await p.waitForTimeout(1200);
    const t = await texte(p);
    console.log('  pastille MINI-KIF visible dans la table:', t.includes('MINI-KIF'));
    console.log('  ligne sans niveau:', t.includes('Pour le coffre mystère — pas de niveau'));
    await p.screenshot({ path: 'v1915-duo-coachee.png' });
    await ctx.close();
  }

  console.log('\n=== POINT 2c — DUO coach : accepter / reformuler / refuser ===');
  {
    const { ctx, p } = await ouvrir('coach', false);
    const t = await texte(p);
    console.log('  carte MINI-KIF visible côté coach:', t.includes('MINI-KIF'));
    console.log('  bouton « Accepter tel quel »:', await p.locator('button', { hasText: 'Accepter tel quel' }).count() > 0);
    console.log('  bouton « Reformuler le mini-kif »:', await p.locator('button', { hasText: 'Reformuler le mini-kif' }).count() > 0);
    console.log('  bouton « Refuser » présent:', await p.locator('button', { hasText: 'Refuser' }).count() > 0);
    console.log('  pas de « Accepter au niveau » sur un kif:', !t.includes('Accepter au niveau'));
    await p.screenshot({ path: 'v1915-coach-kif.png' });

    // reformulation
    await p.locator('button', { hasText: 'Reformuler le mini-kif' }).tap();
    await p.waitForTimeout(500);
    console.log('  libellé « TA REFORMULATION » affiché:', (await texte(p)).includes('TA REFORMULATION'));
    console.log('  pas de champ niveau sur la contre-offre kif:', !(await texte(p)).includes('NIVEAU CONTRE-PROPOSÉ'));
    await p.locator('input[placeholder*="version raisonnable"]').fill('Un sticker de MacBook Pro');
    await p.screenshot({ path: 'v1915-coach-reformule.png' });
    await p.locator('button', { hasText: 'Envoyer' }).tap();
    await p.waitForTimeout(1000);
    const srv = await p.evaluate(() => fetch('/api/duo-testabcd/negos').then(r => r.json()));
    console.log('  contre-offre enregistrée:', srv[0].statut === 'contre', '| contreLabel:', JSON.stringify(srv[0].contreLabel));
    console.log('  aucun contreNiveau parasite:', srv[0].contreNiveau === undefined);
    await ctx.close();
  }

  console.log('\n=== POINT 2d — la coachée accepte la reformulation, le kif entre au coffre ===');
  {
    const { ctx, p } = await ouvrir('coachee', false);
    const t = await texte(p);
    console.log('  bouton d\'acceptation avec le libellé reformulé:', t.includes('Accepter « Un sticker de MacBook Pro »'));
    await p.locator('button', { hasText: 'Accepter « Un sticker de MacBook Pro »' }).tap();
    await p.waitForTimeout(1200);
    const srv = await p.evaluate(() => fetch('/api/duo-testabcd/negos').then(r => r.json()));
    console.log('  négo conclue:', srv[0].statut === 'acceptee', '| labelFinal:', JSON.stringify(srv[0].labelFinal));
    // le passage dans le coffre se fait à l'import de la prochaine synchro
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.tap('nav >> text=Récomp'); await p.waitForTimeout(1500);
    const st = await p.evaluate(lire);
    console.log('  kif importé au coffre:', st.kiffs.includes('Un sticker de MacBook Pro'));
    console.log('  PAS ajouté aux grandes récompenses:', !st.recompenses.some(r => String(r.label).includes('MacBook')));
    console.log('  coffre final:', JSON.stringify(st.kiffs));
    await p.screenshot({ path: 'v1915-coffre-final.png' });
    await ctx.close();
  }

  // ============ POINT 3 — libellés des champs numériques ============
  console.log('\n=== POINT 3 — libellés persistants ===');
  {
    const { ctx, p } = await ouvrir('coachee', false);
    const t = await texte(p);
    for (const l of ['NIVEAU À ATTEINDRE', 'NIVEAU VISÉ'])
      console.log('  libellé « ' + l + ' » présent:', t.includes(l));
    // le libellé doit survivre au remplissage du champ (c'était le bug du « 18 »)
    const chip = p.locator('button').filter({ hasText: '· N' }).first();
    if (await chip.count()) {
      await chip.tap(); await p.waitForTimeout(400);
      const t2 = await texte(p);
      const v = await p.locator('input[placeholder="ex : 4"]').last().inputValue().catch(() => '');
      console.log('  après pré-remplissage par une idée : champ =', JSON.stringify(v), '| libellé toujours affiché:', t2.includes('NIVEAU VISÉ'));
    }
    await p.locator('button', { hasText: 'Lancer un pari' }).tap();
    await p.waitForTimeout(600);
    const t3 = await texte(p);
    console.log('  pari — « COMBIEN DE SÉANCES ? »:', t3.includes('COMBIEN DE SÉANCES ?'));
    console.log('  pari — « DURÉE (3 À 21 JOURS) »:', t3.includes('DURÉE (3 À 21 JOURS)'));
    await p.screenshot({ path: 'v1915-pari.png' });
    await p.locator('button', { hasText: '🫀 Cardios' }).tap(); await p.waitForTimeout(400);
    console.log('  pari — libellé suit le type (« COMBIEN DE CARDIOS ? »):', (await texte(p)).includes('COMBIEN DE CARDIOS ?'));
    await p.keyboard.press('Escape');
    await ctx.close();
  }
  {
    const { ctx, p } = await ouvrir('coach', false);
    await p.locator('text=Toucher pour ouvrir').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
    await p.locator('text=Toucher pour ouvrir').tap(); await p.waitForTimeout(600);
    await p.locator('button', { hasText: 'ajout manuel' }).tap(); await p.waitForTimeout(400);
    console.log('  cagnotte — « MONTANT (€) »:', (await texte(p)).includes('MONTANT (€)'));
    await p.screenshot({ path: 'v1915-pot.png' });
    await ctx.close();
  }

  await b.close();
})();
