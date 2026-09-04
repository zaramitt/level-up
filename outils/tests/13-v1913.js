const { chromium } = require('playwright');
const seed = () => {
  if (localStorage.getItem('lvlup-profils')) return;
  localStorage.setItem('lvlup-profils', JSON.stringify([{ id:'p1', nom:'Léa', role:'coachee', solo:false, code:'duo-testabcd' }]));
  localStorage.setItem('lvlup-actif','p1'); localStorage.setItem('lvlup-tour:p1','1');
  localStorage.setItem('lvlup-s:p1', JSON.stringify({ programme:'fessiers', xp:500, coachLie:true,
    charges: { goblet: [{ date:'2026-08-16', kg:62.5 }] }, recompenses:[], vus:{jour:1,hab:1,prog:1,rec:1,suivi:1,rec_coach:1} }));
};
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERR:', String(e).slice(0,200)));
  await page.addInitScript(seed);
  const cdp = await ctx.newCDPSession(page);
  const ouvrir = async (onglet) => { await page.goto('http://127.0.0.1:8323/app.html', { waitUntil:'load' });
    await page.waitForTimeout(1400); await page.tap('nav >> text=' + onglet); await page.waitForTimeout(1300); };
  const tapSur = async (sel) => { const l = page.locator(sel).first(); await l.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400); await l.click(); await page.waitForTimeout(700); };
  const spotlightOuvert = (t) => page.evaluate(txt => [...document.querySelectorAll('div')]
    .some(d => getComputedStyle(d).position === 'fixed' && (d.textContent || '').includes(txt)), t);

  // ===== 5. carte d'exercice =====
  await page.goto('http://127.0.0.1:8323/app.html', { waitUntil:'load' }); await page.waitForTimeout(1400);
  await page.locator('.carte-seance').first().tap(); await page.waitForTimeout(900);
  const d = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(x => (x.textContent||'').trim().startsWith('dernier :') && x.children.length === 0);
    if (!el) return null; const r = el.getBoundingClientRect();
    return { txt: el.textContent.trim(), lignes: Math.round(r.height / (parseFloat(getComputedStyle(el).lineHeight) || 16)) };
  });
  console.log('5. CARTE EXERCICE —', JSON.stringify(d), '→ une seule ligne:', d && d.lignes <= 1);
  await page.screenshot({ path: 'v1913-exo.png' });

  // ===== 1a. carte du pari =====
  await ouvrir('Récomp');
  await tapSur('text=Un défi, deux enjeux');
  console.log('1a. PARI — tap sur le corps de la carte ouvre la mise en avant:', await spotlightOuvert("Lancer un pari"));
  await page.screenshot({ path: 'v1913-pari.png' });

  // ===== 1b + 3 + 4. cagnotte =====
  await ouvrir('Récomp');
  await tapSur('text=Automatique :');
  console.log('1b. CAGNOTTE — tap sur le corps de la carte ouvre la mise en avant:', await spotlightOuvert("Combien avez-vous dépensé"));
  const avant = await page.evaluate(() => fetch('/api/duo-testabcd/pot').then(r=>r.json()));
  console.log('4a. solde avant:', avant.total, '€');
  await page.locator('input[placeholder="' + avant.total + '"]').fill('5');
  const hold = page.locator('button', { hasText: "on l'a dépensée" });
  const hb = await hold.boundingBox();
  console.log('3a. BOUTON — hauteur:', Math.round(hb.height), 'px');
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:hb.x+hb.width/2, y:hb.y+hb.height/2}] });
  await page.waitForTimeout(1800);
  const p = await page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find(x => /^\d+$/.test((x.textContent||'').trim()) && parseFloat(getComputedStyle(x).fontSize) >= 28);
    const btn = [...document.querySelectorAll('button')].find(x => (x.textContent||'').includes('Tiens bon'));
    return { compte: el ? el.textContent.trim() : null, taille: el ? getComputedStyle(el).fontSize : null,
             ombre: btn ? (getComputedStyle(btn).boxShadow || '').slice(0,40) : null };
  });
  console.log('3b. pendant le maintien —', JSON.stringify(p));
  await page.screenshot({ path: 'v1913-maintien.png' });
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] }); await page.waitForTimeout(700);
  const a2 = await page.evaluate(() => fetch('/api/duo-testabcd/pot').then(r=>r.json()));
  console.log('3c. relâché à 1,8 s (< 3 s) → rien dépensé:', a2.total === avant.total);
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:hb.x+hb.width/2, y:hb.y+hb.height/2}] });
  await page.waitForTimeout(3300);
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] }); await page.waitForTimeout(900);
  const ap = await page.evaluate(() => fetch('/api/duo-testabcd/pot').then(r=>r.json()));
  console.log('4b. dépense de 5 € — solde serveur:', ap.total, '€ (attendu', avant.total - 5, ')');
  const vu = await page.evaluate(() => { const w=document.createElement('div'); w.innerHTML=document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e=>e.remove()); return w.textContent; });
  console.log('4c. solde restant affiché:', vu.includes((avant.total-5) + ' € disponibles'));
  await page.screenshot({ path: 'v1913-cagnotte.png' });
  await b.close();
})();
