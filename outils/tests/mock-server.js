// Faux worker local : sert les fichiers statiques + imite /generer et /pause
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const COACH_LIE = process.env.COACH_LIE === '1';

const PROG_5 = {
  nom: 'Muscu 5 jours sur mesure',
  emoji: '💪',
  desc: 'Programme généré pour se muscler, 5 séances par semaine.',
  lieu: 'perso',
  seances: Object.fromEntries(['A', 'B', 'C', 'D', 'E'].map((l, i) => [l, {
    nom: ['Jambes', 'Poussée', 'Tirage', 'Fessiers', 'Full body'][i],
    couleur: ['#E8503A', '#2C5BE8', '#0E8F63', '#E89B0C', '#C2417A'][i],
    gainage: i === 0,
    exos: [
      { id: 'goblet', nom: 'Goblet squat', dose: '3 × 10', repos: 120, charge: true },
      { id: 'hipthrust', nom: 'Hip thrust', dose: '4 × 10', repos: 150, charge: true },
      { id: 'rowing', nom: 'Tirage horizontal', dose: '3 × 12', repos: 90, charge: true },
      { id: 'dev', nom: 'Développé haltères', dose: '3 × 10', repos: 120, charge: true }
    ]
  }]))
};

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  // v20.0 : lecture IA de l'objectif libre (le programme est calculé dans l'app). MOCK_IA=off → 503, MOCK_IA=ko → 502
  if (/^\/api\/[^/]+\/interpreter$/.test(u.pathname) && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('MOCK /interpreter reçu:', body.slice(0, 160));
      if (process.env.MOCK_IA === 'off') { res.writeHead(503, { 'content-type': 'application/json' }); res.end(JSON.stringify({ erreur: 'non_configure' })); return; }
      if (process.env.MOCK_IA === 'ko') { res.writeHead(502); res.end('lecture impossible'); return; }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ base: 'tonifier', prioritaires: ['fessiers', 'quadriceps'] }));
    });
    return;
  }
  if (/^\/api\/[^/]+\/generer$/.test(u.pathname) && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      console.log('MOCK /generer reçu:', body.slice(0, 160));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(PROG_5));
    });
    return;
  }
  if (/^\/api\/[^/]+\/pause$/.test(u.pathname) && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ demande: null, active: null, coachLie: COACH_LIE }));
    return;
  }
  if (/^\/api\/[^/]+\/paris$/.test(u.pathname)) {
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(global.__paris || [])); return; }
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const b = JSON.parse(body);
      if (b.action === 'proposer') (global.__paris = global.__paris || []).push({ id: 'p' + Date.now(), statut: 'propose', auteur: b.auteur, type: b.type, cible: b.cible, duree: b.duree, miseCoachee: b.miseCoachee, miseCoach: b.miseCoach });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(global.__paris || []));
    });
    return;
  }
  if (/^\/api\/[^/]+\/etat$/.test(u.pathname)) {
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(global.__etat || null)); return; }
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => { const b = JSON.parse(body); global.__etat = { xp: Math.max(0, parseInt(b.xp) || 0), adresse: ["elle","il","neutre"].includes(b.adresse) ? b.adresse : undefined, date: '2026-08-23', histo: b.histo || [], photosMeta: [], jours: b.jours || {}, jokersMois: 0, pauses: [] }; res.writeHead(200, { 'content-type': 'application/json' }); res.end('ok'); });
    return;
  }
  if (/^\/api\/[^/]+\/negos$/.test(u.pathname)) {
    global.__negos = global.__negos || [];
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(global.__negos)); return; }
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const b = JSON.parse(body);
      const list = global.__negos;
      // même logique que worker.js
      if (b.action === 'proposer' && b.label && (b.niveau || b.type === 'kiff')) {
        const kif = b.type === 'kiff';
        list.unshift({
          id: b.id || String(Math.round(performance.now() * 1000)),
          label: String(b.label).slice(0, 140),
          ...(kif ? { type: 'kiff' } : { niveau: Math.max(1, Math.min(40, parseInt(b.niveau))) }),
          mot: String(b.mot || '').slice(0, 200),
          date: '2026-08-21', statut: 'proposee'
        });
      } else {
        const g = list.find(x => x.id === b.id);
        if (g) {
          if (b.action === 'accepter' && (g.statut === 'proposee' || g.statut === 'contre')) {
            g.statut = 'acceptee';
            if (g.type === 'kiff') g.labelFinal = String(b.label || g.contreLabel || g.label).slice(0, 140);
            else g.niveauFinal = Math.max(1, Math.min(40, parseInt(b.niveau) || g.contreNiveau || g.niveau));
          }
          if (b.action === 'contrer' && g.statut === 'proposee' && (g.type !== 'kiff' || b.label)) {
            g.statut = 'contre';
            if (g.type === 'kiff') g.contreLabel = String(b.label).slice(0, 140);
            else g.contreNiveau = Math.max(1, Math.min(40, parseInt(b.niveau)));
            g.contreMot = String(b.mot || '').slice(0, 200);
            g.dateContre = '2026-08-21';
          }
          if (b.action === 'refuser' && g.statut !== 'acceptee') g.statut = 'refusee';
        }
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(list));
    });
    return;
  }
  if (/^\/api\/[^/]+\/pot$/.test(u.pathname)) {
    global.__pot = global.__pot || { total: 12, mois: '2026-08', nbMois: 2, moisEuros: 5, histo: [{ date: '2026-08-15', type: 'manquement', montant: 2 }] };
    if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(global.__pot)); return; }
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const b = JSON.parse(body);
      if (b.action === 'depenser') { const v = Math.max(1, Math.min(parseInt(b.montant) || global.__pot.total, global.__pot.total)); global.__pot.histo.unshift({ date: '2026-08-18', type: 'depense', montant: v }); global.__pot.total -= v; }
      if (b.action === 'vider') { global.__pot.histo.unshift({ date: '2026-08-18', type: 'depense', montant: global.__pot.total }); global.__pot.total = 0; }
      if (b.action === 'plafond') global.__pot.plafond = b.montant;
      if (b.action === 'ajouter') { global.__pot.total += b.montant; global.__pot.histo.unshift({ date: '2026-08-18', type: 'ajout', montant: b.montant, note: b.note }); }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(global.__pot));
    });
    return;
  }
  if (u.pathname === '/__reset') { global.__negos = []; global.__paris = []; global.__pot = null; global.__etat = null; res.writeHead(200); res.end('ok'); return; }
  if (u.pathname.startsWith('/api/')) { res.writeHead(404); res.end('route inconnue'); return; }
  const f = path.join(DIR, u.pathname === '/' ? 'app.html' : u.pathname.slice(1));
  if (!fs.existsSync(f)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html;charset=utf-8' : 'application/javascript' });
  res.end(fs.readFileSync(f));
}).listen(parseInt(process.env.PORT) || 8323, () => console.log('mock sur 8323, coachLie=' + COACH_LIE));
