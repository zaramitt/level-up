const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  for (const [role, nom] of [['coach','Léo'], ['coachee','Léa']]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('  PAGE ERR:', String(e).slice(0,180)));
    await page.addInitScript(([r, n]) => {
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id:'x1', nom:n, role:r, solo:false, code:'duo-testabcd' }]));
      localStorage.setItem('lvlup-actif','x1'); localStorage.setItem('lvlup-tour:x1','1');
      localStorage.setItem('lvlup-s:x1', JSON.stringify({ programme:'fessiers', xp:500, recompenses:[], vus:{} }));
    }, [role, nom]);
    await page.goto('http://127.0.0.1:8323/app.html', { waitUntil:'load' });
    await page.waitForTimeout(1600);
    const r = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const actif = [...nav.querySelectorAll('button')].find(x => getComputedStyle(x).backgroundColor === 'rgb(242, 245, 249)');
      const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
      [...w.querySelectorAll('script,style')].forEach(e => e.remove());
      const t = w.textContent;
      return { ongletActif: actif ? actif.textContent.trim() : null,
               bulleTaBase: t.includes('Ta base') && t.includes("C'est clair"),
               contenuSuivi: t.includes('DERNIERS JOURS') || t.includes('Suivi') };
    });
    console.log(role.toUpperCase() + ' — onglet actif à l\'ouverture:', JSON.stringify(r.ongletActif),
                '| popup « Ta base » affichée:', r.bulleTaBase);
    await page.screenshot({ path: 'v1914-' + role + '.png' });
    await ctx.close();
  }
  await b.close();
})();
