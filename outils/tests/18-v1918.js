const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const jour = new Date().toISOString().slice(0, 10);
  const hier = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const avantHier = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);

  const ouvrir = async etatJour => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 200)));
    await p.addInitScript(([jours]) => {
      if (localStorage.getItem('lvlup-actif')) return;
      localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x1', nom: 'Léa', role: 'coachee', solo: false, code: 'duo-testabcd' }]));
      localStorage.setItem('lvlup-actif', 'x1');
      localStorage.setItem('lvlup-tour:x1', '1');
      localStorage.setItem('lvlup-s:x1', JSON.stringify({
        programme: 'fessiers', xp: 500, coachLie: true, styles: ['soins'], kiffs: [], recompenses: [],
        negos: [], negosImportes: {}, drops: [], charges: {}, histo: [], activeDays: {},
        jour: jours, vus: { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 }
      }));
    }, [etatJour]);
    await p.goto('http://127.0.0.1:8323/app.html', { waitUntil: 'load' });
    await p.waitForTimeout(1800);
    return { ctx, p };
  };
  const lireSt = p => p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')));
  const texte = p => p.evaluate(() => {
    const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    return w.textContent;
  });

  console.log('=== POINT 2 — clôture automatique des séances passées ===');
  {
    // hier : séance A, 4 exos validés, jamais clôturée (le cas exact de Léo)
    // avant-hier : séance B complète déjà validée (ne doit PAS être retouchée)
    const { ctx, p } = await ouvrir({
      [hier]: { seance: 'A', faits: ['goblet', 'hipthrust', 'rowing', 'dev'], gainage: [], valide: false, gainValide: false, photos: {} },
      [avantHier]: { seance: 'B', faits: ['a', 'b'], gainage: [], valide: true, gainValide: false, photos: {} }
    });
    const st = await lireSt(p);
    const entree = (st.histo || []).find(h => h.date === hier);
    console.log('  séance d\'hier enregistrée en partielle:', !!entree && entree.partiel === true && entree.auto === true, JSON.stringify(entree));
    console.log('  jour d\'hier marqué valide+partiel:', st.jour[hier].valide === true && st.jour[hier].partiel === true);
    console.log('  avant-hier (déjà validée) NON dupliquée:', (st.histo || []).filter(h => h.date === avantHier).length === 0);
    const t = await texte(p);
    console.log('  toast « rien n\'est perdu » affiché:', t.includes("rien n'est perdu"));
    const bloc = await p.evaluate(() => { const b = [...document.querySelectorAll('div')].find(d => (d.textContent || '').trim() === '7 DERNIERS JOURS'); return b ? b.parentElement.textContent : null; });
    console.log('  compteur de la semaine passé à 1 (' + JSON.stringify(bloc) + '):', !!bloc && bloc.startsWith('1/'));
    // rechargement : pas de double enregistrement
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1800);
    const st2 = await lireSt(p);
    console.log('  rechargement → pas de doublon:', st2.histo.filter(h => h.date === hier).length === 1);
    await ctx.close();
  }
  {
    // séance d'AUJOURD'HUI en cours : ne doit PAS être clôturée
    const { ctx, p } = await ouvrir({
      [jour]: { seance: 'A', faits: ['goblet'], gainage: [], valide: false, gainValide: false, photos: {} }
    });
    const st = await lireSt(p);
    console.log('  séance du jour en cours : PAS touchée:', st.jour[jour].valide === false && (st.histo || []).length === 0);

    console.log('\n=== POINT 3 — carte de clôture proéminente ===');
    await p.waitForTimeout(400);
    const carte = await p.evaluate(() => {
      const b = [...document.querySelectorAll('button')].find(x => (x.textContent || '').includes("Fin de séance"));
      if (!b) return null;
      const cs = getComputedStyle(b);
      return { texte: b.textContent.slice(0, 130), borderColor: cs.borderColor, aFond: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && !cs.backgroundColor.includes('0.055') };
    });
    console.log('  barre « Fin de séance » visible dès 1 exo validé:', !!carte);
    console.log('  compte affiché « 1/6 exercices gardés »:', carte && carte.texte.includes('1/6 exercices gardés'));
    console.log('  mention « la séance compte, sans le bonus »:', carte && carte.texte.includes('sans le bonus'));
    await p.screenshot({ path: 'v1918-carte.png' });

    // le tap clôture en partielle et compte au compteur
    await p.locator('button', { hasText: "Fin de séance" }).tap();
    await p.waitForTimeout(800);
    await p.locator('button', { hasText: 'Continuer' }).tap(); await p.waitForTimeout(400); // popup de célébration
    const st3 = await lireSt(p);
    const e3 = st3.histo.find(h => h.date === jour);
    console.log('  tap → partielle enregistrée aujourd\'hui:', !!e3 && e3.partiel === true, '| XP inchangés (pas de +40):', st3.xp === 500);
    const bloc2 = await p.evaluate(() => { const b = [...document.querySelectorAll('div')].find(d => (d.textContent || '').trim() === '7 DERNIERS JOURS'); return b ? b.parentElement.textContent : null; });
    console.log('  compteur passe à 1 (' + JSON.stringify(bloc2) + '):', !!bloc2 && bloc2.startsWith('1/'));
    await ctx.close();
  }
  await b.close();
})();
