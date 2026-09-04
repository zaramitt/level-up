const { chromium } = require('playwright');

const parcours = async (b, mode) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('  PAGE ERR:', String(e).slice(0, 200)));
  await page.goto('http://127.0.0.1:8323/app.html', { waitUntil: 'load' });
  await page.waitForTimeout(1300);
  await page.locator('button', { hasText: "C'est parti" }).first().tap();
  await page.waitForTimeout(500);
  await page.tap(mode === 'solo' ? 'text=En solo' : 'text=En duo');
  await page.waitForTimeout(500);
  await page.tap('text=3 séances'); await page.waitForTimeout(500);
  await page.tap('text=Me muscler'); await page.waitForTimeout(500);
  await page.tap('text=Jamais'); await page.waitForTimeout(500);
  await page.tap('text=Pas sûr·e'); await page.waitForTimeout(500);
  await page.tap('text=Non, pas en ce moment'); await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Continuer' }).tap(); await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Voir mon programme' }).tap(); await page.waitForTimeout(900);

  // aperçu de l'écran styles avant sélection
  const apercuAvant = await page.evaluate(() => {
    const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    return w.textContent;
  });

  await page.tap('text=Décontracté'); await page.waitForTimeout(250);
  await page.tap('text=Gourmandises'); await page.waitForTimeout(400);
  const apercu = await page.evaluate(() => {
    const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    const t = w.textContent; const i = t.indexOf('Par exemple :');
    return i < 0 ? null : t.slice(i, i + 200);
  });
  await page.screenshot({ path: 'b8-' + mode + '-styles.png' });

  await page.locator('button', { hasText: 'Suivant' }).tap(); await page.waitForTimeout(600);
  await page.fill('input[placeholder="Ton prénom / pseudo"]', mode === 'solo' ? 'Sam' : 'Léa');
  await page.locator('button', { hasText: 'Démarrer' }).last().tap();
  await page.waitForTimeout(900);
  const skip = await page.locator('text=Je verrai plus tard').count();
  if (skip) { await page.tap('text=Je verrai plus tard'); }
  await page.waitForTimeout(2200);

  const st = await page.evaluate(() => {
    const l = JSON.parse(localStorage.getItem('lvlup-profils') || '[]');
    const p = l[l.length - 1];
    const raw = localStorage.getItem('lvlup-s:' + p.id);
    if (!raw) return { erreur: 'pas de state', profil: p };
    const s = JSON.parse(raw);
    return { solo: p.solo, styles: s.styles, rec: s.recompenses.map(r => r.label), kiffs: s.kiffs };
  });
  // balayage de toute l'app à la recherche de [object Object]
  const objets = [];
  for (const onglet of ['Séance', 'Habitudes', 'Progrès', 'Récomp']) {
    try { await page.tap('nav >> text=' + onglet); await page.waitForTimeout(900); } catch (e) { continue; }
    const t = await page.evaluate(() => {
      const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
      [...w.querySelectorAll('script,style')].forEach(e => e.remove());
      return w.textContent;
    });
    if (t.includes('[object Object]')) objets.push(onglet);
  }
  await page.screenshot({ path: 'b8-' + mode + '-rec.png' });
  await ctx.close();
  return { st, apercu, objets, apercuAvant };
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const duo = await parcours(b, 'duo');
  const solo = await parcours(b, 'solo');
  for (const [nom, r] of [['DUO', duo], ['SOLO', solo]]) {
    console.log('\n===== ' + nom + ' =====');
    if (r.st.erreur) { console.log('ÉCHEC:', JSON.stringify(r.st)); continue; }
    console.log('profil.solo:', r.st.solo, '| styles:', JSON.stringify(r.st.styles));
    console.log('aperçu onboarding:', JSON.stringify(r.apercu));
    console.log('récompenses (' + r.st.rec.length + '):');
    r.st.rec.forEach(x => console.log('   -', x));
    console.log('kiffs (' + r.st.kiffs.length + '):');
    r.st.kiffs.forEach(x => console.log('   -', x));
    const bad = [...r.st.rec, ...r.st.kiffs].filter(x => typeof x !== 'string' || x.includes('object Object'));
    console.log('>>> entrées non résolues:', bad.length, '| onglets avec [object Object]:', JSON.stringify(r.objets));
  }
  // comparaison
  const diff = duo.st.rec.filter((x, i) => x !== solo.st.rec[i]).length;
  console.log('\n>>> libellés récompenses différents entre duo et solo:', diff, '/', duo.st.rec.length);
  const dk = duo.st.kiffs.filter(x => !solo.st.kiffs.includes(x)).length;
  console.log('>>> kiffs propres au duo (absents du solo):', dk, '/', duo.st.kiffs.length);
  await b.close();
})();
