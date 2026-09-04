const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGE ERR:', String(e).slice(0, 300)));
  // nouveau profil solo → les listes par défaut du style soins sont appliquées
  await page.goto('http://127.0.0.1:8323/app.html', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  await page.tap('text=C\'est parti');
  await page.tap('text=En solo');
  await page.waitForTimeout(400);
  await page.tap('text=3 séances'); await page.waitForTimeout(500);
  await page.tap('text=Me tonifier'); await page.waitForTimeout(500);
  await page.tap('text=Jamais'); await page.waitForTimeout(500);
  await page.tap('text=Pas sûr·e'); await page.waitForTimeout(500);
  await page.tap('text=Non, pas en ce moment'); await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Continuer' }).tap(); await page.waitForTimeout(500);
  await page.locator('button', { hasText: 'Voir mon programme' }).tap(); await page.waitForTimeout(900);
  await page.locator('button', { hasText: 'Suivant' }).tap(); await page.waitForTimeout(600);
  await page.fill('input[placeholder="Ton prénom / pseudo"]', 'Léa');
  await page.locator('button', { hasText: 'Démarrer en solo' }).last().tap();
  await page.waitForTimeout(1500);
  await page.locator('text=Passer').first().waitFor({ timeout: 12000 }).catch(() => {});
  const niveaux = await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('lvlup-s:' + localStorage.getItem('lvlup-actif')));
    return st.recompenses.map(r => r.niveau);
  });
  console.log('NOUVEAU PROFIL — niveaux des récompenses par défaut:', JSON.stringify(niveaux), '| tous ≤ 5:', niveaux.every(n => n <= 5), '| min 2:', Math.min(...niveaux) === 2);
  // profil existant simulé : ses récompenses perso ne bougent pas (elles sont dans SON stockage)
  await page.evaluate(() => {
    const pid = localStorage.getItem('lvlup-actif');
    const st = JSON.parse(localStorage.getItem('lvlup-s:' + pid));
    st.recompenses.push({ niveau: 18, label: 'Ancienne récompense perso', pris: false });
    localStorage.setItem('lvlup-s:' + pid, JSON.stringify(st));
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const apres = await page.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:' + localStorage.getItem('lvlup-actif'))).recompenses.some(r => r.niveau === 18));
  console.log('PROFIL EXISTANT — récompense perso N18 intacte après rechargement:', apres);
  // barème négos : plus de N16/N20 (profil duo requis pour la table — on vérifie dans le source servi)
  const html = await page.evaluate(() => fetch('/app.html').then(r => r.text()));
  console.log('BARÈME — plus de semParf(16)/semParf(20):', !html.includes('semParf(16)') && !html.includes('semParf(20)'));
  console.log('RÈGLES — nouvelle équivalence v19.7 présente:', html.includes('N4 ≈ 4 semaines'));
  console.log('LISTES — plus aucun niveau: >12 dans le source:', ![...html.matchAll(/niveau: (\d+)/g)].some(m => parseInt(m[1]) > 12));
  await browser.close();
})();
