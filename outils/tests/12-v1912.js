const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation,TouchpadOverscrollHistoryNavigation'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 745 }, hasTouch: true, isMobile: true });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERR:', String(e).slice(0, 200)));
  await page.addInitScript(() => localStorage.getItem('lvlup-profils') || localStorage.setItem('lvlup-profils', JSON.stringify([
    { id: 'p1', nom: 'Léo', role: 'coach', solo: false, code: 'duo-abcdefgh' },
    { id: 'p2', nom: 'Léa', role: 'coachee', solo: false, code: 'duo-abcdefgh' }])));
  await page.goto('http://127.0.0.1:8323/app.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  // --- 1. lancement ---
  const m1 = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(x => (x.textContent||'').includes("C'est parti"));
    const prof = [...document.querySelectorAll('div')].find(d => (d.textContent||'').trim() === 'PROFILS EXISTANTS');
    return { scroll: document.body.scrollHeight > innerHeight, basBtn: Math.round(btn.getBoundingClientRect().bottom),
             basProfils: Math.round(prof.parentElement.getBoundingClientRect().bottom), vue: innerHeight };
  });
  console.log('1. LANCEMENT — aucun scroll:', !m1.scroll, '| bouton visible:', m1.basBtn <= m1.vue, '| profils entièrement visibles:', m1.basProfils <= m1.vue);
  await page.screenshot({ path: 'ap-lancement.png' });

  // --- 2. mode ---
  await page.locator('button', { hasText: "C'est parti" }).first().tap();
  await page.waitForTimeout(500);
  const m2 = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.carte-mode')];
    return { n: c.length, bas: Math.round(c[c.length-1].getBoundingClientRect().bottom), vue: innerHeight };
  });
  console.log('2. MODE — occupation:', Math.round(100*m2.bas/m2.vue) + '% (avant: 58%)');
  await page.screenshot({ path: 'ap-mode.png' });

  // --- 3. retour : bouton visible + swipe ---
  console.log('3a. bouton Retour présent sur mode:', await page.locator('button', { hasText: 'Retour' }).count() > 0);
  await page.locator('button', { hasText: 'Retour' }).tap();
  await page.waitForTimeout(400);
  console.log('3b. retour → lancement:', await page.locator('text=PROFILS EXISTANTS').count() > 0);
  await page.locator('button', { hasText: "C'est parti" }).first().tap();
  await page.waitForTimeout(400);
  await page.tap('text=En duo');
  await page.waitForTimeout(500);
  // v20.0 : la fréquence vient d'abord ; choisir l'objectif puis revenir : le choix doit rester pré-rempli
  await page.tap('text=3 séances');
  await page.waitForTimeout(500);
  await page.tap('text=Me muscler');
  await page.waitForTimeout(600);
  const cdp = await ctx.newCDPSession(page);
  const swipe = async () => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 130, y: 400 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300, y: 405 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(500);
  };
  await swipe();
  const q1 = await page.locator('text=Ton objectif ?').count();
  console.log('3c. SWIPE gauche→droite ramène à la question précédente:', q1 > 0);
  const prerempli = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => (x.textContent||'').includes('Me muscler'));
    return b ? getComputedStyle(b).borderColor : null;
  });
  console.log('3d. choix « Me muscler » toujours pré-rempli:', prerempli && prerempli.includes('124'));
  await page.screenshot({ path: 'ap-retour.png' });

  // --- 4 & 5. styles puis prénom ---
  await page.tap('text=Me muscler'); await page.waitForTimeout(500);
  await page.tap('text=Jamais'); await page.waitForTimeout(500);
  await page.tap('text=Pas sûr·e'); await page.waitForTimeout(500);
  await page.tap('text=Non, pas en ce moment'); await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Continuer' }).tap(); await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Voir mon programme' }).tap(); await page.waitForTimeout(900);
  const t = await page.evaluate(() => {
    const w = document.createElement('div');
    w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    return w.textContent;
  });
  const chips = await page.evaluate(() => [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(x=>['Décontracté','Aux petits soins','Performance','Gourmandises','Sorties & aventures','Cocooning','Shopping'].includes(x)));
  console.log('4. STYLES — récap programme supprimé:', !t.includes('séance(s)/sem') && !t.includes('PARFAIT POUR TOI'), '| styles proposés:', chips.length, JSON.stringify(chips));
  console.log('   pas de champ prénom sur cet écran:', await page.locator('input[placeholder="Ton prénom / pseudo"]').count() === 0);
  await page.screenshot({ path: 'ap-styles.png' });
  await page.tap('text=Gourmandises'); await page.waitForTimeout(300);
  await page.locator('button', { hasText: 'Suivant' }).tap(); await page.waitForTimeout(600);
  console.log('5. PRÉNOM — écran dédié:', await page.locator('text=ON T\'APPELLE COMMENT').count() > 0, '| champ prénom:', await page.locator('input[placeholder="Ton prénom / pseudo"]').count() > 0);
  await page.screenshot({ path: 'ap-prenom.png' });

  // --- 6. création : récompenses des nouveaux styles ---
  await page.fill('input[placeholder="Ton prénom / pseudo"]', 'Léa');
  await page.locator('button', { hasText: 'Démarrer' }).last().tap();
  await page.waitForTimeout(700);
  await page.tap('text=Je verrai plus tard');
  await page.waitForTimeout(2000);
  const st = await page.evaluate(() => {
    const l = JSON.parse(localStorage.getItem('lvlup-profils'));
    const p = l[l.length-1];
    if (!localStorage.getItem('lvlup-s:' + p.id)) return { erreur: 'pas de state', nbProfils: l.length, dernier: p, cles: Object.keys(localStorage) };
    const s = JSON.parse(localStorage.getItem('lvlup-s:' + p.id));
    return { styles: s.styles, niveaux: s.recompenses.map(r=>r.niveau), nb: s.recompenses.length, kiffs: s.kiffs.length,
             ex: s.recompenses.slice(0,2).map(r=>r.label) };
  });
  if (st.erreur) { console.log('6. CRÉATION — ÉCHEC:', JSON.stringify(st)); await page.screenshot({ path: 'ap-echec.png' }); await b.close(); return; }
  console.log('6. CRÉATION — styles:', JSON.stringify(st.styles), '| récompenses:', st.nb, '| kiffs:', st.kiffs);
  console.log('   niveaux:', JSON.stringify(st.niveaux), '| tous ≤5:', st.niveaux.every(n=>n<=5));
  console.log('   exemples:', JSON.stringify(st.ex));
  await b.close();
})();
