const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const jour = new Date().toISOString().slice(0, 10);
  const ouvrir = async (etatStocke, role = 'coachee') => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 220)));
    await p.addInitScript(([st, r]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x1', nom: r === 'coach' ? 'Léo' : 'Léa', role: r, solo: false, code: 'duo-testabcd' }]));
      localStorage.setItem('lvlup-actif', 'x1');
      localStorage.setItem('lvlup-tour:x1', '1');
      if (st) localStorage.setItem('lvlup-s:x1', JSON.stringify(st));
    }, [etatStocke, role]);
    await p.goto('http://127.0.0.1:8323/app.html', { waitUntil: 'load' });
    await p.waitForTimeout(1700);
    return { ctx, p };
  };
  const texte = p => p.evaluate(() => {
    const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    return w.textContent;
  });
  const base = { programme: 'fessiers', xp: 500, coachLie: true, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], activeDays: {}, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 } };

  console.log('=== défauts ===');
  {
    // profil EXISTANT (état stocké sans adresse) → féminin conservé
    const { ctx, p } = await ouvrir({ ...base });
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
    const t = await texte(p);
    console.log('  profil existant → adresse "elle":', st.adresse === 'elle');
    console.log('  titre au féminin (« Motivée du lundi »):', t.includes('Motivée du lundi'));
    await ctx.close();
  }
  {
    // NOUVEAU profil (aucun état stocké) → neutre
    const { ctx, p } = await ouvrir(null);
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1') || '{}'));
    console.log('  nouveau profil → adresse "neutre":', st.adresse === 'neutre');
    await ctx.close();
  }
  {
    // profil en neutre avec programme : le titre garde le point médian
    const { ctx, p } = await ouvrir({ ...base, adresse: 'neutre' });
    const t = await texte(p);
    console.log('  titre au point médian en neutre (« Motivé·e »):', t.includes('Motivé·e du lundi'));
    await ctx.close();
  }

  console.log('\n=== bascule dans les Réglages + accords coachée ===');
  {
    const { ctx, p } = await ouvrir({ ...base, jour: { [jour]: { seance: 'A', faits: ['goblet', 'hipthrust', 'rowing', 'dev', 'abduction', 'mollets'], gainage: [], valide: false, gainValide: false, photos: {} } } });
    // réglages → passer en "il"
    await p.locator('button:has(svg)').first();
    await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.querySelector('svg') && getComputedStyle(x).borderRadius === '999px' && x.offsetWidth <= 40 && x.offsetTop < 200); });
    const btns = p.locator('header button');
    await btns.last().tap(); // réglages (dernier bouton de l'en-tête)
    await p.waitForTimeout(800);
    let t = await texte(p);
    console.log('  bloc « Comment on s\'adresse à toi » présent:', t.includes("Comment on s'adresse à toi"));
    console.log('  chips avec exemples (« Fier de toi », « Quelle fierté »):', t.includes('Fier de toi') && t.includes('Quelle fierté'));
    await p.locator('button', { hasText: 'Au masculin' }).tap();
    await p.waitForTimeout(700);
    const st1 = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
    console.log('  bascule enregistrée:', st1.adresse === 'il');
    await p.waitForTimeout(3000); // pousserEtat est débouncé à 2,5 s
    const srv = await p.evaluate(() => fetch('/api/duo-testabcd/etat').then(r => r.json()).catch(() => null));
    console.log('  adresse publiée sur /etat:', srv && srv.adresse === 'il');
    // fermer les réglages (bouton tout en bas)
    await p.locator('button', { hasText: 'Fermer' }).last().tap().catch(() => {});
    await p.waitForTimeout(700);
    t = await texte(p);
    console.log('  titre passé au masculin (« Motivé du lundi »):', t.includes('Motivé du lundi') && !t.includes('Motivé·e'));
    // valider la séance → « Fier de toi »
    await p.locator('button', { hasText: 'Valider ma séance' }).first().tap();
    await p.waitForTimeout(900);
    t = await texte(p);
    console.log('  « Séance validée. Fier de toi. » au masculin:', t.includes('Fier de toi'));
    await p.screenshot({ path: 'v1919-fier.png' });
    await ctx.close();
  }
  {
    // neutre : « Quelle fierté »
    const { ctx, p } = await ouvrir({ ...base, adresse: 'neutre', jour: { [jour]: { seance: 'A', faits: ['goblet', 'hipthrust', 'rowing', 'dev', 'abduction', 'mollets'], gainage: [], valide: false, gainValide: false, photos: {} } } });
    await p.locator('button', { hasText: 'Valider ma séance' }).first().tap();
    await p.waitForTimeout(900);
    const t = await texte(p);
    console.log('  neutre → « Séance validée. Quelle fierté. »:', t.includes('Quelle fierté'));
    await ctx.close();
  }

  console.log('\n=== côté coach : accords depuis l\'adresse reçue ===');
  {
    // la coachée « il » a déjà publié son état (fait au test précédent : adresse=il)
    // + une négo en contre pour afficher chip et balle dans son camp
    await fetch('http://127.0.0.1:8323/api/duo-testabcd/negos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'proposer', id: 'g1', label: 'Un resto', niveau: 3 }) });
    await fetch('http://127.0.0.1:8323/api/duo-testabcd/negos', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'contrer', id: 'g1', niveau: 2 }) });
    const { ctx, p } = await ouvrir({ ...base, recompenses: undefined }, 'coach');
    await p.waitForTimeout(1200); // le Suivi (onglet d'ouverture) reçoit /etat → adresseCoachee
    const stc = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
    console.log('  adresseCoachee mémorisée depuis /etat:', stc.adresseCoachee === 'il');
    let t = await texte(p);
    console.log('  Suivi — titre de la coachée au masculin:', t.includes('Motivé du lundi'));
    await p.tap('nav >> text=Négos');
    await p.waitForTimeout(1000);
    t = await texte(p);
    console.log('  chip « CONTRE-OFFRE — À LUI »:', t.includes('À LUI'));
    console.log('  « il accepte ou refuse »:', t.includes('il accepte ou refuse'));
    await p.screenshot({ path: 'v1919-coach.png' });
    await ctx.close();
  }
  await b.close();
})();
