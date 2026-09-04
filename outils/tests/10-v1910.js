const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERR:', String(e).slice(0, 300)));

  // profil duo coachée avec programme fessiers, 500 XP, une récompense N5 et une N2 (débloquée)
  await page.addInitScript(() => {
    const p = { id: 'p1', nom: 'Léa', role: 'coachee', solo: false, coachEnTete: false, code: 'duo-testabcd' };
    localStorage.setItem('lvlup-profils', JSON.stringify([p]));
    localStorage.setItem('lvlup-actif', 'p1');
    localStorage.setItem('lvlup-tour:p1', '1');
    localStorage.setItem('lvlup-s:p1', JSON.stringify({
      programme: 'fessiers', xp: 500, coachLie: true,
      recompenses: [{ niveau: 2, label: 'Bubble tea offert', pris: false }, { niveau: 5, label: 'Un resto au choix', pris: false }],
      vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }
    }));
  });

  await page.goto('http://127.0.0.1:8323/app.html', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.tap('nav >> text=Récomp');
  await page.waitForTimeout(1200);

  // ===== 4. Grande récompense : spotlight avec XP manquants + barre + séances =====
  await page.locator('text=Un resto au choix').first().tap();
  await page.waitForTimeout(600);
  // xp cible N5 = SEUILS[4] = 150+1320+2490+3660 = 7620 ; manquants = 7120
  // fessiers : A 6exos+gainage = 6*15+40+ (10*5+15)=195? GAINAGE.length inconnu → juste vérifier la présence des blocs
  const manq = await page.locator('text=encore').allTextContents();
  console.log('RÉCOMPENSE — spotlight ouvert, textes "encore":', JSON.stringify(manq.slice(0, 3)));
  const barre = await page.evaluate(() => !![...document.querySelectorAll('div')].find(d => d.style.background && d.style.background.includes('linear-gradient(90deg')));
  console.log('RÉCOMPENSE — barre de progression présente:', barre);
  await page.screenshot({ path: 'v1910-rec-spotlight.png' });
  await page.mouse.click(20, 40); // tap hors carte → fermer
  await page.waitForTimeout(400);
  console.log('RÉCOMPENSE — fermé par tap extérieur:', await page.locator('text=encore ~').count() === 0);

  // récompense débloquée : "Je la prends" dans le spotlight
  await page.locator('text=Bubble tea offert').first().tap();
  await page.waitForTimeout(500);
  const gagneVisible = await page.locator('text=C\'est gagné').count();
  console.log('RÉCOMPENSE débloquée — "C\'est gagné" affiché:', gagneVisible > 0);
  await page.locator('button', { hasText: 'Je la prends' }).last().tap();
  await page.waitForTimeout(500);

  // ===== création : traduction niveau → séances en direct =====
  await page.locator('input[placeholder="ex : 4"]').first().fill('8');
  await page.waitForTimeout(300);
  const trad = await page.locator('text=≈ encore ~').count();
  console.log('CRÉATION — traduction en direct visible pour niveau 8:', trad > 0);
  await page.screenshot({ path: 'v1910-creation.png' });
  await page.locator('input[placeholder="ex : 4"]').first().fill('');

  // ===== 2. Pari : trigger → spotlight, textarea mise coach, bouton maintenir =====
  await page.locator('button', { hasText: 'Lancer un pari' }).tap();
  await page.waitForTimeout(500);
  const taMise = await page.locator('textarea').count();
  console.log('PARI — spotlight + textarea mise coach:', taMise > 0);
  // bouton désactivé tant que le formulaire est vide
  const btnHold = page.locator('button', { hasText: 'Maintiens pour t\'engager' });
  console.log('PARI — bouton maintenir désactivé à vide:', await btnHold.isDisabled());
  // remplir
  await page.locator('input[placeholder="ex : 4"]').last().fill('4');
  await page.fill('input[placeholder="ex : 10"]', '10');
  await page.fill('input[placeholder*="le coaché met en jeu"]', 'la vaisselle 5 jours');
  await page.fill('textarea', 'Un resto au choix avec dessert et tout le tralala');
  await page.waitForTimeout(300);
  console.log('PARI — bouton actif une fois rempli:', !(await btnHold.isDisabled()));
  await page.screenshot({ path: 'v1910-pari-spotlight.png' });

  // maintien PARTIEL (1s) → ne doit PAS engager
  const bb = await btnHold.boundingBox();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }] });
  await page.waitForTimeout(1000);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  let paris = await page.evaluate(() => fetch('/api/duo-testabcd/paris').then(r => r.json()));
  console.log('PARI — relâché à 1s : PAS engagé:', paris.length === 0);

  // maintien COMPLET (3s) → engage
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bb.x + bb.width / 2, y: bb.y + bb.height / 2 }] });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'v1910-pari-decompte.png' });
  await page.waitForTimeout(1900);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(800);
  paris = await page.evaluate(() => fetch('/api/duo-testabcd/paris').then(r => r.json()));
  console.log('PARI — maintien complet : engagé:', paris.length === 1, '| spotlight fermé:', await page.locator('text=Maintiens pour t\'engager').count() === 0);

  // ===== 3. Cagnotte : carte → spotlight, plafond côté coach, maintien pour vider =====
  // le spotlight peut déjà s'être ouvert au premier tap : ne re-tapper que s'il est fermé
  try { if (await page.locator('text=LA CAGNOTTE').count() === 0) { await page.locator('text=Toucher pour ouvrir').scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await page.locator('text=Toucher pour ouvrir').tap({ timeout: 5000 }); } } catch (e) { console.log('TAP FAIL — capture'); await page.screenshot({ path: 'v1910-fail.png' }); const spot = await page.evaluate(() => { const fixed = [...document.querySelectorAll('div')].filter(d => getComputedStyle(d).position === 'fixed' && d.offsetHeight > 300); return fixed.map(f => (f.textContent || '').slice(0, 80)); }); console.log('overlays fixes:', JSON.stringify(spot)); throw e; }
  await page.waitForTimeout(500);
  console.log('CAGNOTTE — spotlight ouvert (LA CAGNOTTE):', await page.locator('text=LA CAGNOTTE').count() > 0);
  console.log('CAGNOTTE — pas de réglage plafond côté coachée:', await page.locator('text=Plafond mensuel').count() === 0);
  const btnVider = page.locator('button', { hasText: 'on l\'a dépensée' });
  const bv = await btnVider.boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bv.x + bv.width / 2, y: bv.y + bv.height / 2 }] });
  await page.waitForTimeout(3100);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(800);
  const pot = await page.evaluate(() => fetch('/api/duo-testabcd/pot').then(r => r.json()));
  console.log('CAGNOTTE — vidée par maintien complet:', pot.total === 0);
  await ctx.close();

  // ===== côté COACH : réglage du plafond visible et fonctionnel =====
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  await ctx2.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => console.log('PAGE ERR2:', String(e).slice(0, 200)));
  await p2.addInitScript(() => {
    const p = { id: 'c1', nom: 'Coach', role: 'coach', solo: false, code: 'duo-testabcd' };
    localStorage.setItem('lvlup-profils', JSON.stringify([p]));
    localStorage.setItem('lvlup-actif', 'c1');
    localStorage.setItem('lvlup-tour:c1', '1');
    localStorage.setItem('lvlup-s:c1', JSON.stringify({ vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 } }));
  });
  await p2.goto('http://127.0.0.1:8323/app.html', { waitUntil: 'load' });
  await p2.waitForTimeout(1500);
  await p2.tap('nav >> text=Négos');
  await p2.waitForTimeout(1200);
  await p2.locator('text=Toucher pour ouvrir').scrollIntoViewIfNeeded(); await p2.waitForTimeout(400); await p2.locator('text=Toucher pour ouvrir').tap();
  await p2.waitForTimeout(500);
  console.log('COACH — réglage plafond visible:', await p2.locator('text=Plafond mensuel').count() > 0);
  await p2.fill('input[placeholder="30"]', '50');
  await p2.locator('button', { hasText: 'OK' }).tap();
  await p2.waitForTimeout(600);
  const pot2 = await p2.evaluate(() => fetch('/api/duo-testabcd/pot').then(r => r.json()));
  console.log('COACH — plafond enregistré à 50:', pot2.plafond === 50);
  await p2.screenshot({ path: 'v1910-pot-coach.png' });

  await browser.close();
})();
