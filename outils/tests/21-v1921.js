const { chromium } = require('playwright');
const U = 'http://127.0.0.1:8323/app.html';
const jour = new Date().toISOString().slice(0, 10);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation', '--autoplay-policy=no-user-gesture-required'] });
  const ouvrir = async (extra = {}) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    await p.addInitScript(([ex, jk]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x1', nom: 'Léa', role: 'coachee', solo: false, code: 'duo-testabcd' }]));
      localStorage.setItem('lvlup-actif', 'x1'); localStorage.setItem('lvlup-tour:x1', '1');
      localStorage.setItem('lvlup-s:x1', JSON.stringify({ programme: 'fessiers', xp: 500, coachLie: true, styles: ['soins'], kiffs: [], recompenses: [], negos: [], negosImportes: {}, drops: [], charges: { goblet: [{ date: '2026-08-20', series: [20, 22.5, 20] }] }, histo: [], activeDays: {}, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }, ...ex }));
    }, [extra, jour]);
    await p.addInitScript(() => { window.__skew = 0; const o = Date.now.bind(Date); Date.now = () => o() + window.__skew; });
    await p.goto(U, { waitUntil: 'load' }); await p.waitForTimeout(1600);
    return { ctx, p };
  };
  const avancer = async (p, sec) => { await p.evaluate(s => { window.__skew += s * 1000; document.dispatchEvent(new Event('visibilitychange')); }, sec); await p.waitForTimeout(500); };
  const texte = p => p.evaluate(() => { const w = document.createElement('div'); w.innerHTML = document.body.innerHTML; [...w.querySelectorAll('script,style')].forEach(e => e.remove()); return w.textContent; });
  const overlay = p => p.evaluate(() => { const el = [...document.querySelectorAll('div')].find(d => /^(\+?\d+:\d\d|GO !|Bouclé ✔)$/.test((d.textContent || '').trim()) && d.children.length === 0 && parseFloat(getComputedStyle(d).fontSize) > 40); return el ? el.textContent.trim() : null; });
  const swipeDroite = async (ctx, p, y) => { const cdp = await ctx.newCDPSession(p); await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 120, y }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300, y: y + 4 }] }); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500); };

  console.log('=== 1. Réglages : fermer flottant + swipe ===');
  { const { ctx, p } = await ouvrir();
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    const btn = p.locator('button[title="Fermer"]');
    console.log('  bouton ✕ flottant visible sans défiler:', await btn.count() === 1 && (await btn.boundingBox()).y < 60);
    await btn.tap(); await p.waitForTimeout(500);
    console.log('  ferme les réglages:', !(await texte(p)).includes("Comment on s'adresse à toi"));
    await p.locator('header button').last().tap(); await p.waitForTimeout(700);
    await swipeDroite(ctx, p, 400);
    console.log('  swipe gauche→droite ferme aussi:', !(await texte(p)).includes("Comment on s'adresse à toi"));
    await ctx.close(); }

  console.log('\n=== 2/3. Séries : « + une série », « idem » ===');
  { const { ctx, p } = await ouvrir();
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(900);
    await p.locator('button[aria-expanded]').first().tap(); await p.waitForTimeout(600);
    const carte = () => p.evaluate(() => { const c = document.querySelector('button[aria-expanded]').parentElement; return { steppers: c.querySelectorAll('input[inputmode], [title="Même charge que la série précédente"]').length, idem: [...c.querySelectorAll('button')].filter(b => b.textContent.trim() === 'idem').length, plus: [...c.querySelectorAll('button')].filter(b => b.textContent.includes('+ une série')).length, s: c.textContent.match(/S\d/g) }; });
    let c = await carte();
    console.log('  libellé « idem » (plus de « = ») :', c.idem === 2, '| bouton « + une série » présent:', c.plus === 1, '| séries:', JSON.stringify(c.s));
    await p.locator('button', { hasText: '+ une série' }).first().tap(); await p.waitForTimeout(500);
    c = await carte();
    console.log('  après tap → 4 séries, 3 « idem »:', (c.s || []).includes('S4') && c.idem === 3);
    // « idem » sur la S4 (nouvelle) reprend la S3 (pré-remplie 20)
    await p.evaluate(() => { const c = document.querySelector('button[aria-expanded]').parentElement; const bs = [...c.querySelectorAll('button[title="Même charge que la série précédente"]')]; bs[bs.length - 1].click(); });
    await p.waitForTimeout(600);
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
    const d = st.charges.goblet[st.charges.goblet.length - 1];
    console.log('  « idem » sur la S4 enregistre 20 en 4e série:', JSON.stringify(d.series), '→', d.series[3] === 20);
    console.log('  légende mise à jour:', (await texte(p)).includes('« idem » reprend la charge'));
    await ctx.close(); }

  console.log('\n=== 5/6. Sons + repos en dépassement ===');
  { const { ctx, p } = await ouvrir();
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(900);
    await p.locator('button[aria-expanded]').first().tap(); await p.waitForTimeout(600);
    await p.locator('button', { hasText: 'Fin de série — repos' }).first().tap(); await p.waitForTimeout(600);
    console.log('  repos lancé:', await overlay(p));
    await avancer(p, 112); // 2:00 → reste 8 s : l'alerte 10 s a dû sonner
    console.log('  à 8 s de la fin, affiche', await overlay(p));
    await avancer(p, 10);
    let o = await overlay(p);
    console.log('  repos écoulé → compteur en dépassement:', o, '→', /^\+0:0\d$/.test(o || ''));
    await avancer(p, 23);
    o = await overlay(p);
    console.log('  23 s plus tard (+ le temps réel des étapes):', o, '→', /^\+0:2[4-9]$/.test(o || ''));
    const t = await texte(p);
    console.log('  libellé « REPOS FINI — TU DÉPASSES DE »:', t.includes('TU DÉPASSES DE'), '| bouton OK:', await p.locator('button', { hasText: /^OK$/ }).count() > 0);
    console.log('  bouton de l\'exercice montre le dépassement:', t.includes('repos dépassé'));
    await p.locator('button', { hasText: /^OK$/ }).tap(); await p.waitForTimeout(400);
    console.log('  OK referme:', (await overlay(p)) === null);
    const son = await p.evaluate(() => ({ debloque: typeof sonDebloque !== 'undefined' ? sonDebloque : null, fin: !!(typeof audioFin !== 'undefined' && audioFin && audioFin.src.startsWith('data:audio/wav')), alerte: !!(typeof audioAlerte !== 'undefined' && audioAlerte && audioAlerte.src.startsWith('data:audio/wav')) }));
    console.log('  sons : deux <audio> WAV prêts:', son.fin && son.alerte, '| débloqués au premier tap « repos »:', son.debloque === true);
    await ctx.close(); }

  console.log('\n=== 7. Gainage : tap sur le cadre, fin sans « GO » ===');
  { const { ctx, p } = await ouvrir({ jour: { [jour]: { seance: 'A', faits: [], gainage: [], valide: false, gainValide: false, photos: {}, gainTours: { planche: 2 } } } });
    await p.locator('text=+ GAINAGE').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
    // tap sur le cadre = déploiement (détails + bouton de lancement), pas de lancement direct
    await p.locator('div', { hasText: /^Planche$/ }).first().tap(); await p.waitForTimeout(600);
    let t7 = await texte(p);
    console.log('  tap sur le cadre le déploie : « Tour 3 sur 3 » + infos + bouton :', t7.includes('Tour 3 sur 3') && t7.includes('40 s de travail par tour') && t7.includes('Tour 3 · 40 s'));
    console.log('  rien lancé au simple tap :', (await overlay(p)) === null);
    await p.locator('button[title^="Lancer"]').first().tap(); await p.waitForTimeout(600);
    console.log('  bouton « Lancer » → mise en place 3 s :', (await overlay(p)) === '0:03');
    console.log('  pastille « en cours » sur le cadre :', (await texte(p)).includes('En cours…'));
    await avancer(p, 4); await avancer(p, 41); await p.waitForTimeout(300);
    const o = await overlay(p); const t = await texte(p);
    console.log('  3e série finie → « Bouclé ✔ » et pas « GO »:', o === 'Bouclé ✔', '| texte GO absent:', !t.includes("C'EST REPARTI"), '| libellé « bouclé »:', t.includes('BOUCLÉ !'));
    await p.waitForTimeout(2400);
    console.log('  disparaît seul après ~2 s:', (await overlay(p)) === null);
    await ctx.close(); }

  console.log('\n=== 8. Changer de séance ===');
  { const { ctx, p } = await ouvrir();
    await p.locator('.carte-seance').first().tap(); await p.waitForTimeout(900);
    const b = p.locator('button', { hasText: 'Changer de séance' });
    const st = await b.evaluate(el => ({ fs: parseFloat(getComputedStyle(el).fontSize), border: getComputedStyle(el).borderTopWidth, deco: getComputedStyle(el).textDecorationLine }));
    console.log('  bouton pilule « Changer de séance »:', await b.count() === 1, JSON.stringify(st), '→', st.fs >= 12 && st.border !== '0px' && st.deco === 'none');
    await ctx.close(); }

  console.log('\n=== 9/10. Barre « Fin de séance » + célébration ===');
  { const { ctx, p } = await ouvrir({ jour: { [jour]: { seance: 'A', faits: ['goblet', 'hipthrust'], gainage: [], valide: false, gainValide: false, photos: {} } } });
    let bar = p.locator('button', { hasText: 'Fin de séance' });
    const bb = await bar.boundingBox();
    console.log('  barre fixe visible sans défiler (y =', bb && Math.round(bb.y), '):', !!bb && bb.y > 600 && bb.y < 720);
    console.log('  compte « 2/6 exercices gardés »:', (await bar.textContent()).includes('2/6 exercices gardés'));
    console.log('  plus de carte discrète dans la liste:', !(await texte(p)).includes("je m'arrête là"));
    await bar.tap(); await p.waitForTimeout(900);
    let t = await texte(p);
    console.log('  popup de célébration (partielle):', t.includes('Séance enregistrée') && t.includes('2/6 exercices gardés'));
    console.log('  récap XP : « 2 exercices × 15 XP = 30 » :', t.includes('2 exercices × 15 XP = 30') && t.includes('+30 XP'));
    console.log('  barre de niveau (« niveau 3 dans N XP »):', /niveau 3 dans \d+ XP/.test(t));
    await p.locator('button', { hasText: 'Continuer' }).tap(); await p.waitForTimeout(400);
    console.log('  barre « Fin de séance » disparue après clôture:', await p.locator('button', { hasText: 'Fin de séance' }).count() === 0);
    await p.screenshot({ path: 'v1921-celebration-partielle.png' });
    await ctx.close(); }
  { const { ctx, p } = await ouvrir({ jour: { [jour]: { seance: 'A', faits: ['goblet', 'hipthrust', 'presse', 'legcurl', 'abduction', 'mollets'], gainage: [], valide: false, gainValide: false, photos: {} } } });
    const bar = p.locator('button', { hasText: 'Valider ma séance · +40 XP' }).first();
    console.log('  tous faits → la barre devient « Valider ma séance · +40 XP »:', await bar.count() >= 1);
    await bar.tap(); await p.waitForTimeout(1000);
    const t = await texte(p);
    console.log('  célébration complète : « Séance validée ! » + « Fière de toi » :', t.includes('Séance validée !') && t.includes('Fière de toi'));
    console.log('  récap : 6 × 15 = 90, bonus +40, total +130 :', t.includes('6 exercices × 15 XP = 90') && t.includes('Bonus séance complète : +40') && t.includes('+130 XP'));
    const anim = await p.evaluate(() => { const el = [...document.querySelectorAll('div')].find(d => getComputedStyle(d).animationName === 'secousse'); return !!el; });
    console.log('  secousse visuelle (pas de vibrate) :', anim);
    await p.screenshot({ path: 'v1921-celebration.png' });
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
    console.log('  XP : +40 de bonus (les exos pré-remplis par le test n\'ont pas été validés dans l\'app) :', st.xp === 540);
    await ctx.close(); }
  await b.close();
})();
