const { chromium } = require('playwright');
const U = 'http://127.0.0.1:8323/app.html';

const init = () => {
  if (localStorage.getItem('lvlup-actif')) return;
  localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x1', nom: 'Léa', role: 'coachee', solo: false, code: 'duo-testabcd' }]));
  localStorage.setItem('lvlup-actif', 'x1');
  localStorage.setItem('lvlup-tour:x1', '1');
  localStorage.setItem('lvlup-s:x1', JSON.stringify({
    programme: 'fessiers', xp: 500, coachLie: true, styles: ['soins'], kiffs: [], recompenses: [],
    negos: [], negosImportes: {}, drops: [], charges: { goblet: [{ date: '2026-08-20', series: [20, 22.5, 20] }] },
    vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }
  }));
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
  await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
  await p.addInitScript(init);
  // décale artificiellement l'horloge de la page : simule le temps qui passe
  // pendant que l'app est en arrière-plan (les intervalles, eux, sont gelés)
  await p.addInitScript(() => {
    window.__skew = 0;
    const orig = Date.now.bind(Date);
    Date.now = () => orig() + window.__skew;
  });
  const avancer = async sec => {
    await p.evaluate(s => { window.__skew += s * 1000; document.dispatchEvent(new Event('visibilitychange')); }, sec);
    await p.waitForTimeout(500);
  };
  const overlay = () => p.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(d => /^(\d+:\d\d|GO !)$/.test((d.textContent || '').trim()) && d.children.length === 0 && parseFloat(getComputedStyle(d).fontSize) > 40);
    if (!el) return null;
    let bg = null, n = el;
    while (n && n !== document.body) { const s = getComputedStyle(n); if (s.position === 'fixed') { bg = s.backgroundColor; break; } n = n.parentElement; }
    return { txt: el.textContent.trim(), bg };
  });
  const texte = () => p.evaluate(() => {
    const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    return w.textContent;
  });

  await p.goto(U, { waitUntil: 'load' });
  await p.waitForTimeout(1600);
  await p.locator('.carte-seance').first().tap();
  await p.waitForTimeout(900);
  await p.locator('button[aria-expanded]').first().tap(); // goblet squat déployé
  await p.waitForTimeout(600);

  console.log('=== A1 — chrono sur horodatage (arrière-plan simulé) ===');
  await p.locator('button', { hasText: 'Fin de série — repos' }).first().tap();
  await p.waitForTimeout(600);
  let o = await overlay();
  console.log('  repos lancé, affiche', o && o.txt, '(attendu 2:00 ou 1:59)');
  await avancer(65);
  o = await overlay();
  console.log('  après 65 s « en arrière-plan » : recalculé à', o && o.txt, '→', o && /0:5[0-9]/.test(o.txt));

  console.log('\n=== A5 — repos : re-tap sans remise à zéro + visibilité ===');
  console.log('  overlay repos en BLEU (avant : gris sombre):', o && o.bg === 'rgb(61, 90, 254)');
  const surBouton = await p.locator('button', { hasText: 'repos en cours' }).count();
  console.log('  bouton de l\'exercice devenu chrono « repos en cours »:', surBouton > 0);
  await p.locator('button', { hasText: 'repos en cours' }).tap(); // RE-TAP
  await p.waitForTimeout(600);
  o = await overlay();
  console.log('  re-tap → PAS remis à 2:00, toujours', o && o.txt, '→', o && /0:5[0-9]/.test(o.txt));
  await avancer(60);
  await p.waitForTimeout(600);
  o = await overlay();
  console.log('  fin atteinte en arrière-plan → dépassement affiché au retour:', o && /^\+\d+:\d\d$/.test(o.txt), '(' + (o && o.txt) + ')');
  await p.locator('button', { hasText: /^OK$/ }).tap(); await p.waitForTimeout(400);

  console.log('\n=== A3 — saisie des charges ===');
  const nbEgal = await p.evaluate(() => {
    const carte = document.querySelector('button[aria-expanded]').parentElement;
    return carte.querySelectorAll('button[title="Même charge que la série précédente"]').length;
  });
  console.log('  boutons « = » dans la carte déployée (3 séries → 2):', nbEgal === 2, '(' + nbEgal + ')');
  // saisie libre : tap sur la valeur de la série 1 → input clavier
  await p.locator('.carte-seance').first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  await p.evaluate(() => {
    const carte = document.querySelector('button[aria-expanded]').parentElement;
    const cellules = [...carte.querySelectorAll('div')].filter(d => /^20 kg$|^22\.5 kg$/.test((d.textContent || '').trim()) && d.querySelector('span'));
    cellules[0].click(); // valeur de la série 1
  });
  await p.waitForTimeout(400);
  const inp = p.locator('input[inputmode="decimal"]');
  console.log('  tap sur la valeur → champ clavier ouvert:', await inp.count() === 1);
  await inp.fill('88');
  await inp.press('Enter');
  await p.waitForTimeout(600);
  let st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
  let dernier = st.charges.goblet[st.charges.goblet.length - 1];
  console.log('  88 enregistré en série 1:', JSON.stringify(dernier.series), '→', dernier.series[0] === 88);
  // « = » : série 2 reprend 88
  await p.locator('button[title="Même charge que la série précédente"]').first().tap();
  await p.waitForTimeout(600);
  st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
  dernier = st.charges.goblet[st.charges.goblet.length - 1];
  console.log('  « = » copie sur la série 2:', JSON.stringify(dernier.series), '→', dernier.series[1] === 88);

  console.log('\n=== A4 — « dernier » sur sa propre ligne ===');
  const a4 = await p.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(d => (d.textContent || '').startsWith('dernier : ') && d.children.length === 0);
    if (!el) return null;
    const parent = el.parentElement.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const dose = [...el.parentElement.querySelectorAll('div')].find(d => /repos \d/.test(d.textContent || ''));
    return { texte: el.textContent, pleineLargeur: r.width > parent.width * .9, sousLaMeta: dose ? r.top >= dose.getBoundingClientRect().bottom - 2 : null };
  });
  console.log('  div dédiée:', a4 && JSON.stringify(a4.texte), '| pleine largeur:', a4 && a4.pleineLargeur, '| sous la ligne méta:', a4 && a4.sousLaMeta);

  console.log('\n=== A2 — enchaînement du gainage ===');
  await p.locator('text=+ GAINAGE').scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  await p.locator('div', { hasText: /^Planche$/ }).first().tap(); await p.waitForTimeout(500); // déplier (v19.21)
  await p.locator('button[title^="Lancer"]').first().tap(); // planche, 40 s / 3 tours
  await p.waitForTimeout(600);
  o = await overlay();
  let t = await texte();
  console.log('  mise en place 3 s (ambre):', o && o.txt === '0:03' && o.bg === 'rgb(255, 176, 32)', '| libellé « EN PLACE »:', t.includes('EN PLACE — PLANCHE'));
  await avancer(4);
  o = await overlay();
  console.log('  → travail lancé automatiquement:', o && /0:3[0-9]/.test(o.txt));
  await avancer(41);
  o = await overlay();
  st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
  const tours = () => p.evaluate(() => { const s = JSON.parse(localStorage.getItem('lvlup-s:x1')); const j = s.jour[Object.keys(s.jour)[0]]; return (j.gainTours || {}).planche || 0; });
  console.log('  fin du travail → tour compté:', await tours(), '(attendu 1) | repos lancé:', o && /0:4[0-9]/.test(o.txt));
  t = await texte();
  console.log('  repos annonce le tour suivant:', t.includes('TOUR 2/3'));
  await avancer(46);
  o = await overlay();
  console.log('  fin du repos → ENCHAÎNEMENT AUTO (mise en place tour 2):', o && o.txt === '0:03');
  await avancer(4); // → travail 2
  await avancer(41); // fin travail 2 → repos
  console.log('  tour 2 compté:', await tours(), '(attendu 2)');
  await avancer(46); // fin repos → prep 3
  await avancer(4); // → travail 3
  await avancer(41); // fin travail 3
  await p.waitForTimeout(400);
  console.log('  tour 3 compté:', await tours(), '(attendu 3)');
  o = await overlay();
  const pasDeRepos = !o || o.txt === 'GO !';
  console.log('  PAS de repos après la DERNIÈRE série (overlay:', o ? o.txt : 'fermé', '):', pasDeRepos);
  st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
  console.log('  planche validée (3 tours) + XP:', st.xp > 500);
  await p.screenshot({ path: 'v1917-gainage.png' });

  await ctx.close();
  await b.close();
})();
