// Robot BH AUTOSELECT : parcourt Interenchères, Alcopa et Enchères Domaine,
// analyse chaque lot, estime la marge et prévient sur le téléphone (ntfy).
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { analyserTexte, enrichir, detecterMarqueModele } from './analyse.mjs';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(await fs.readFile(path.join(RACINE, 'config.json'), 'utf8'));
const FICHIER = path.join(RACINE, 'docs/data/lots.json');
const DEBUG = path.join(RACINE, 'docs/data/debug.json');
const pause = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * 600));
const PRIORITE = /(judiciaire|liquidation|\blj\b|redressement|mandataire|saisie|domaine|fourri|v[ée]hicules?|voitures?|automobiles?|tourisme)/i;
const EXCLURE_VENTE = /(collection|prestige|sport-et-de-collection|moto|bateau|maritime|aerien|tracteur|agricole|camping|caravane|poids-lourd|engins|bijou|art-)/i;

const SOURCES = {
  interencheres: {
    nom: 'Interenchères',
    departs: [
      'https://www.interencheres.com/vehicules/',
      'https://www.interencheres.com/vehicules/vehicules-particuliers-et-de-loisirs',
      'https://www.interencheres.com/calendrier?universe=vehicles',
    ],
    // Les pages /recherche sont interdites aux robots par le site : on ne les visite pas.
    interdit: /\/recherche|\/mon-compte|\/status/,
    estVente: (u) => /interencheres\.com\/vehicules\/[a-z0-9-]+-\d{5,}\/?(\?|$)/.test(u),
    estLot: (u) => /interencheres\.com\/vehicules\/[^?#]+\/lot-\d+\.html/.test(u),
    estCategorie: (u) => /interencheres\.com\/vehicules\/(vehicules-particuliers|vehicules-professionnels|voitures)[a-z-]*\/?(\?|$)/.test(u),
  },
  alcopa: {
    nom: 'Alcopa',
    departs: [
      'https://www.alcopa-auction.fr/vehicules-de-tourisme',
      'https://www.alcopa-auction.fr/salle-de-vente-web',
      'https://www.alcopa-auction.fr/salle-de-vente-encheres/beauvais',
      'https://www.alcopa-auction.fr/salle-de-vente-encheres/paris-sud',
    ],
    interdit: /\/(mon-compte|connexion|inscription|login|panier)/,
    estVente: (u) => /alcopa-auction\.fr\/(vente|ventes|salle-de-vente[^/]*)\/[^?#]*\d{3,}/.test(u),
    estLot: (u) => /alcopa-auction\.fr\/.*(voiture|vehicule|fiche|lot|annonce|detail)[^?#]*\d{4,}/i.test(u),
    estCategorie: (u) => /alcopa-auction\.fr\/(vehicules-de-tourisme|vehicules-utilitaires)(\?|$|\/page)/.test(u),
  },
  domaines: {
    nom: 'Enchères Domaine (État)',
    departs: ['https://encheres-domaine.gouv.fr/', 'https://encheres-domaine.gouv.fr/hermes/biens-mobiliers/vehicules'],
    interdit: /\/(compte|connexion|login|inscription)/,
    estVente: (u) => /encheres-domaine\.gouv\.fr\/.*(vente|categorie)[^?#]*\d{3,}/i.test(u),
    estLot: (u) => /encheres-domaine\.gouv\.fr\/.*(lot|annonce|bien|detail)[^?#]*\d{4,}/i.test(u),
    estCategorie: (u) => /encheres-domaine\.gouv\.fr\/.*v[ée]hicule/i.test(u),
    toujoursJudiciaire: true,
  },
};

async function liens(page) {
  return page.$$eval('a[href]', (as) => as.map((a) => ({ href: a.href.split('#')[0], texte: (a.innerText || a.title || '').trim().slice(0, 160) })));
}

async function ouvrir(page, url, dbg) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
    // accepter les cookies si une bannière gêne
    for (const sel of ['#didomi-notice-agree-button', 'button:has-text("Tout accepter")', 'button:has-text("Accepter")', 'button:has-text("J\'accepte")']) {
      const b = page.locator(sel).first();
      if (await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 3000); await pause(500); }
    dbg.pages.push({ url, statut: 'ok', titre: (await page.title()).slice(0, 100) });
    return true;
  } catch (e) {
    dbg.pages.push({ url, statut: 'erreur', erreur: String(e.message).slice(0, 200) });
    return false;
  }
}

async function parcourir(ctx, cle, src) {
  const dbg = { source: src.nom, pages: [], lotsTrouves: 0, lotsAnalyses: 0, exemplesLiens: [], api: [] };
  const page = await ctx.newPage();
  page.on('response', (r) => {
    const ct = r.headers()['content-type'] || '';
    if (ct.includes('json') && dbg.api.length < 40) dbg.api.push(r.url().slice(0, 200));
  });
  const ventes = new Map(), lots = new Map(), vus = new Set();
  const collecter = async () => {
    for (const l of await liens(page)) {
      if (vus.has(l.href) || src.interdit.test(l.href)) continue;
      vus.add(l.href);
      if (dbg.exemplesLiens.length < 60) dbg.exemplesLiens.push(l.href);
      if (src.estLot(l.href)) lots.set(l.href, l.texte);
      else if (src.estVente(l.href) && !EXCLURE_VENTE.test(l.href + ' ' + l.texte)) ventes.set(l.href, l.texte);
      else if (src.estCategorie(l.href)) ventes.set(l.href, l.texte);
    }
  };
  for (const u of src.departs) { if (await ouvrir(page, u, dbg)) await collecter(); await pause(1500); }
  // Ventes prioritaires d'abord (judiciaire / véhicules)
  const listeVentes = [...ventes.entries()].sort((a, b) => (PRIORITE.test(b[0] + b[1]) ? 1 : 0) - (PRIORITE.test(a[0] + a[1]) ? 1 : 0)).slice(0, 30);
  for (const [u] of listeVentes) {
    if (lots.size >= cfg.maxLotsAnalysesParSource * 2) break;
    if (await ouvrir(page, u, dbg)) await collecter();
    await pause(1500);
  }
  dbg.lotsTrouves = lots.size;
  // On ne garde que les lots qui ressemblent à une voiture (marque reconnue dans le texte du lien) en premier
  const tri = [...lots.entries()].sort((a, b) => (detecterMarqueModele(b[1]).marque ? 1 : 0) - (detecterMarqueModele(a[1]).marque ? 1 : 0));
  const resultats = [];
  for (const [u, texteLien] of tri.slice(0, cfg.maxLotsAnalysesParSource)) {
    if (!(await ouvrir(page, u, dbg))) continue;
    const titre = await page.locator('h1').first().innerText({ timeout: 3000 }).catch(() => texteLien);
    const texte = await page.locator('body').innerText().catch(() => '');
    const photo = await page.$$eval('img', (imgs) => (imgs.map((i) => i.currentSrc || i.src).find((s) => /^https/.test(s) && !/logo|icon|sprite|avatar|svg/i.test(s)) || null)).catch(() => null);
    const a = analyserTexte(texte, titre || texteLien);
    if (!a.marque) continue; // pas une voiture
    if (src.toujoursJudiciaire) a.judiciaire = true;
    resultats.push({ id: cle + ':' + u.replace(/\?.*$/, ''), source: src.nom, url: u, photo, ...a });
    dbg.lotsAnalyses++;
    await pause(1200);
  }
  await page.close();
  return { resultats, dbg };
}

async function alerter(lots) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic || !lots.length) return;
  const site = process.env.SITE_URL || '';
  const envoyer = (body) => fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, ...body }) }).catch(() => {});
  for (const l of lots.slice(0, cfg.maxAlertesParPassage)) {
    await envoyer({
      title: `${l.judiciaire ? '⚖️ ' : ''}${l.marque} ${l.modele || ''} ${l.annee || ''} · marge ~${l.marge} €`,
      message: `${l.km ? l.km.toLocaleString('fr-FR') + ' km · ' : ''}${l.carburant || ''}\nAchat estimé ${l.coutTotal} € (frais inclus) · cote ~${l.cote} €\n${l.ville || ''} ${l.cp || ''} · ${l.source}${l.dateVente ? ' · vente ' + l.dateVente.replace('T', ' ') : ''}`,
      click: l.url, tags: ['car'], priority: l.marge > 1500 ? 4 : 3,
      actions: [{ action: 'view', label: 'Comparer Leboncoin', url: l.leboncoin }, ...(site ? [{ action: 'view', label: 'Ouvrir l\'appli', url: site }] : [])],
    });
    await pause(300);
  }
  if (lots.length > cfg.maxAlertesParPassage) await envoyer({ title: `+${lots.length - cfg.maxAlertesParPassage} autres bonnes affaires`, message: 'Ouvre l\'appli BH Chasseur pour tout voir.', click: site || undefined });
}

// ---------- Programme principal ----------
let ancien = { lots: [] };
try { ancien = JSON.parse(await fs.readFile(FICHIER, 'utf8')); } catch {}
const anciens = new Map((ancien.lots || []).map((l) => [l.id, l]));

const browser = await chromium.launch({ headless: true, args: ['--disable-blink-features=AutomationControlled'] });
const ctx = await browser.newContext({
  locale: 'fr-FR', timezoneId: 'Europe/Paris', viewport: { width: 1366, height: 900 },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
});
if (process.env.BH_MOCK) { const { installerMock } = await import(process.env.BH_MOCK); await installerMock(ctx); } // tests hors ligne uniquement
const debug = { date: new Date().toISOString(), sources: [] };
const nouveaux = [];
for (const [cle, src] of Object.entries(SOURCES)) {
  if (!cfg.sources[cle]) continue;
  try {
    const { resultats, dbg } = await parcourir(ctx, cle, src);
    debug.sources.push(dbg);
    for (const r of resultats) nouveaux.push(enrichir(r, cfg));
  } catch (e) { debug.sources.push({ source: src.nom, erreur: String(e.message).slice(0, 300) }); }
}
await browser.close();

const maintenant = new Date().toISOString();
const hier = new Date(Date.now() - 36 * 3600e3).toISOString().slice(0, 10);
const fusion = new Map();
for (const [id, l] of anciens) fusion.set(id, l);
const aAlerter = [];
for (const l of nouveaux) {
  const prec = anciens.get(l.id);
  const lot = { ...l, premiereVue: prec?.premiereVue || maintenant, derniereVue: maintenant, alerte: prec?.alerte || false };
  if (lot.bonneAffaire && !lot.alerte && (!lot.dateVente || lot.dateVente.slice(0, 10) >= hier)) { aAlerter.push(lot); lot.alerte = true; }
  fusion.set(l.id, lot);
}
// Nettoyage : on retire les ventes passées et les lots plus vus depuis 10 jours
const limiteVue = new Date(Date.now() - 10 * 86400e3).toISOString();
const lotsFinal = [...fusion.values()].filter((l) => (!l.dateVente || l.dateVente.slice(0, 10) >= hier) && l.derniereVue >= limiteVue)
  .sort((a, b) => (b.bonneAffaire - a.bonneAffaire) || ((b.marge ?? -1e9) - (a.marge ?? -1e9)));

aAlerter.sort((a, b) => b.marge - a.marge);
await alerter(aAlerter);
await fs.mkdir(path.dirname(FICHIER), { recursive: true });
await fs.writeFile(FICHIER, JSON.stringify({ miseAJour: maintenant, reglages: cfg, lots: lotsFinal }, null, 1));
await fs.writeFile(DEBUG, JSON.stringify(debug, null, 1));
console.log(`Lots analysés : ${nouveaux.length} · en base : ${lotsFinal.length} · bonnes affaires : ${lotsFinal.filter((l) => l.bonneAffaire).length} · alertes : ${aAlerter.length}`);
for (const s of debug.sources) console.log(`- ${s.source} : ${s.lotsTrouves ?? 0} liens de lots, ${s.lotsAnalyses ?? 0} voitures analysées ${s.erreur ? '(erreur ' + s.erreur + ')' : ''}`);
