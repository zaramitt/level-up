const { chromium } = require('playwright');
const U = 'http://127.0.0.1:8323/app.html';

const init = ([role, vus]) => {
  // idempotent : un reload NE DOIT PAS réécraser l'état, sinon « vu » est perdu
  if (localStorage.getItem('lvlup-actif')) return;
  localStorage.setItem('lvlup-profils', JSON.stringify([{ id: 'x1', nom: role === 'coach' ? 'Léo' : 'Léa', role, solo: false, code: 'duo-testabcd' }]));
  localStorage.setItem('lvlup-actif', 'x1');
  localStorage.setItem('lvlup-tour:x1', '1');
  localStorage.setItem('lvlup-s:x1', JSON.stringify({
    programme: 'fessiers', xp: 500, coachLie: true, styles: ['soins'], kiffs: [], recompenses: [],
    negos: [], negosImportes: {}, drops: [], charges: { goblet: [{ kg: 20, date: '2026-08-20' }] },
    vus: vus ? { jour: 1, hab: 1, prog: 1, rec: 1, suivi: 1, rec_coach: 1 } : {}
  }));
};

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--disable-features=OverscrollHistoryNavigation'] });
  const texte = p => p.evaluate(() => {
    const w = document.createElement('div'); w.innerHTML = document.body.innerHTML;
    [...w.querySelectorAll('script,style')].forEach(e => e.remove());
    return w.textContent;
  });
  const ouvrir = async (role, vus = true) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true });
    await ctx.route(/fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare/, r => r.abort());
    const p = await ctx.newPage();
    p.on('pageerror', e => console.log('  ⛔ PAGE ERR:', String(e).slice(0, 240)));
    p.on('console', m => { if (m.type() === 'error') console.log('  ⛔ CONSOLE:', m.text().slice(0, 180)); });
    await p.addInitScript(init, [role, vus]);
    await p.goto(U, { waitUntil: 'load' });
    await p.waitForTimeout(1600);
    return { ctx, p };
  };
  // ouvre la première séance du carrousel
  const entrerSeance = async p => {
    await p.locator('.carte-seance').first().tap();
    await p.waitForTimeout(900);
  };
  const etatExos = p => p.evaluate(() => [...document.querySelectorAll('button[aria-expanded]')].map(btn => {
    const carte = btn.parentElement;
    const corps = btn.nextElementSibling;
    return {
      titre: (btn.textContent || '').split('+')[0].trim().slice(0, 40),
      ouvert: btn.getAttribute('aria-expanded') === 'true',
      hauteurCorps: corps ? Math.round(corps.getBoundingClientRect().height) : -1,
      haut: Math.round(carte.getBoundingClientRect().top)
    };
  }));

  console.log('=== POINT 1 — accordéon ===');
  {
    const { ctx, p } = await ouvrir('coachee');
    await entrerSeance(p);
    let e = await etatExos(p);
    console.log('  exercices affichés:', e.length);
    console.log('  tous compacts à l\'ouverture:', e.every(x => !x.ouvert && x.hauteurCorps === 0));
    const ordreInitial = e.map(x => x.titre);
    await p.screenshot({ path: 'v1916-compact.png' });

    // ouvrir le 2e
    await p.locator('button[aria-expanded]').nth(1).tap();
    await p.waitForTimeout(600);
    e = await etatExos(p);
    console.log('  après tap sur le 2e — un seul ouvert:', e.filter(x => x.ouvert).length === 1, '| c\'est bien le 2e:', e[1].ouvert);
    console.log('  son corps est déployé (h =', e[1].hauteurCorps, '):', e[1].hauteurCorps > 100);
    console.log('  les autres restent visibles en compact:', e.filter((x, i) => i !== 1).every(x => x.hauteurCorps === 0));
    console.log('  il y en a AU-DESSUS et EN DESSOUS:', e[0].haut < e[1].haut && e[2].haut > e[1].haut);
    await p.screenshot({ path: 'v1916-deploye.png' });

    // ouvrir le 4e → le 2e doit se refermer, l'ordre ne bouge pas
    await p.locator('button[aria-expanded]').nth(3).tap();
    await p.waitForTimeout(600);
    e = await etatExos(p);
    console.log('  ouvrir le 4e referme le 2e:', e.filter(x => x.ouvert).length === 1 && e[3].ouvert && !e[1].ouvert);
    console.log('  ORDRE D\'AFFICHAGE INCHANGÉ:', JSON.stringify(e.map(x => x.titre)) === JSON.stringify(ordreInitial));

    // second tap → referme
    await p.locator('button[aria-expanded]').nth(3).tap();
    await p.waitForTimeout(600);
    e = await etatExos(p);
    console.log('  second tap referme:', e.every(x => !x.ouvert && x.hauteurCorps === 0));

    // contenu du déployé : stepper, démo, repos, valider
    await p.locator('button[aria-expanded]').first().tap();
    await p.waitForTimeout(600);
    const t = await texte(p);
    console.log('  contenu déployé — charge par série:', t.includes('CHARGE PAR SÉRIE'), '| démo:', t.includes('Voir la démo'),
                '| repos:', t.includes('Fin de série — repos'), '| valider:', t.includes('Valider avec une photo'));
    console.log('  compact garde dose + repos + dernier:', t.includes('3 × 10') && t.includes('dernier'));
    await ctx.close();
  }

  console.log('\n=== POINT 2 — aération ===');
  {
    const { ctx, p } = await ouvrir('coachee');
    await entrerSeance(p);
    const mesureCompact = await p.evaluate(() => {
      const cs = [...document.querySelectorAll('button[aria-expanded]')];
      return { n: cs.length,
               carte: Math.round(cs[0].parentElement.getBoundingClientRect().height),
               listePx: Math.round(cs[cs.length - 1].parentElement.getBoundingClientRect().bottom - cs[0].parentElement.getBoundingClientRect().top),
               page: Math.round(document.body.scrollHeight) };
    });
    const avant = mesureCompact.carte;
    await p.locator('button[aria-expanded]').first().tap();
    await p.waitForTimeout(600);
    const apres = await p.evaluate(() => {
      const b = document.querySelector('button[aria-expanded]');
      return Math.round(b.parentElement.getBoundingClientRect().height);
    });
    console.log('  hauteur carte compacte:', avant, 'px | déployée:', apres, 'px');
    const mesure = await p.evaluate(() => {
      const cs = [...document.querySelectorAll('button[aria-expanded]')];
      const premier = cs[0].parentElement.getBoundingClientRect();
      const dernier = cs[cs.length - 1].parentElement.getBoundingClientRect();
      return { n: cs.length, hautListe: Math.round(premier.top), basListe: Math.round(dernier.bottom),
               listePx: Math.round(dernier.bottom - premier.top), vue: innerHeight,
               pageEntiere: Math.round(document.body.scrollHeight) };
    });
    console.log('  liste TOUT COMPACT:', mesureCompact.n, 'exos sur', mesureCompact.listePx, 'px (page:', mesureCompact.page, 'px)');
    console.log('  liste avec un exo ouvert:', mesure.listePx, 'px (page:', mesure.pageEntiere, 'px, vue:', mesure.vue, 'px)');
    await p.screenshot({ path: 'v1916-aeration.png' });
    await ctx.close();
  }

  console.log('\n=== POINT 3 — gainage ===');
  {
    const { ctx, p } = await ouvrir('coachee');
    await entrerSeance(p);
    const aGainage = (await texte(p)).includes('GAINAGE');
    console.log('  séance avec gainage:', aGainage);
    if (aGainage) {
      await p.locator('text=+ GAINAGE').scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
      await p.locator('div', { hasText: /^Planche$/ }).first().tap(); await p.waitForTimeout(500); // déplier le cadre (v19.21)
      const cercles = await p.evaluate(() => [...document.querySelectorAll('button')]
        .filter(b => b.title && (b.title.startsWith('Lancer') || b.title === 'Série finie'))
        .map(b => ({ titre: b.title, taille: Math.round(b.getBoundingClientRect().width) })));
      console.log('  boutons de lancement trouvés:', cercles.length, JSON.stringify(cercles.slice(0, 2)));
      await p.screenshot({ path: 'v1916-gainage.png' });
      if (cercles.length) {
        await p.locator('button[title^="Lancer"]').first().tap();
        await p.waitForTimeout(800);
        const chrono = await p.evaluate(() => {
          const els = [...document.querySelectorAll('div')].filter(d => /^\d+:\d\d$|^\d+ s$|^GO !$/.test((d.textContent || '').trim()) && d.children.length === 0);
          return els.map(d => ({ txt: d.textContent.trim(), taille: parseFloat(getComputedStyle(d).fontSize) }));
        });
        console.log('  chrono lancé par le cercle:', chrono.length > 0, JSON.stringify(chrono));
        console.log('  taille du chrono ≥ 40px (avant : 22):', chrono.some(c => c.taille >= 40));
        await p.screenshot({ path: 'v1916-chrono.png' });
      }
    }
    await ctx.close();
  }

  console.log('\n=== POINT 4 — « Ta base » en popup ===');
  for (const [role, onglet] of [['coachee', 'jour'], ['coach', 'suivi']]) {
    const { ctx, p } = await ouvrir(role, false); // vus vide → premier passage
    const t = await texte(p);
    const attendu = role === 'coach' ? 'Son suivi' : 'Ta base';
    console.log(`  ${role.toUpperCase()} — popup ouverte d'office au premier passage:`, t.includes(attendu) && t.includes("C'est clair"));
    console.log('    plus d\'encart permanent dans le flux:', await p.evaluate(() => {
      const m = document.querySelector('main');
      return !/Choisis ta séance dans le carrousel|Son évolution en direct/.test(m.textContent);
    }));
    await p.screenshot({ path: 'v1916-popup-' + role + '.png' });
    await p.locator('button', { hasText: "C'est clair" }).tap();
    await p.waitForTimeout(700);
    console.log('    refermée:', !(await texte(p)).includes("C'est clair"));
    const st1 = await p.evaluate(() => JSON.parse(localStorage.getItem('lvlup-s:x1')).vus);
    console.log('    marquée comme vue:', JSON.stringify(st1));
    // rechargement : ne doit plus s'ouvrir seule
    await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
    console.log('    ne se rouvre pas au retour:', !(await texte(p)).includes("C'est clair"));
    // mais rappelable par l'icône
    await p.locator('button[title="À quoi sert cet onglet ?"]').tap();
    await p.waitForTimeout(600);
    console.log('    rappelable par l\'icône « ? »:', (await texte(p)).includes("C'est clair") && (await texte(p)).includes(attendu));
    await ctx.close();
  }
  // la popup suit l'onglet
  {
    const { ctx, p } = await ouvrir('coachee');
    await p.tap('nav >> text=Habitudes'); await p.waitForTimeout(800);
    await p.locator('button[title="À quoi sert cet onglet ?"]').tap();
    await p.waitForTimeout(600);
    console.log('  la popup suit l\'onglet actif (Habitudes):', (await texte(p)).includes('Tes habitudes'));
    await ctx.close();
  }
  await b.close();
})();
