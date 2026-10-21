// Analyse d'une fiche de lot (texte brut de la page) + cote estimée + marge.
// Pur JavaScript, sans dépendance : testable hors ligne.

const MARQUES = {
  'ALFA ROMEO': ['alfa romeo', 'alfa'], AUDI: ['audi'], BMW: ['bmw'], CITROEN: ['citroen', 'citroën'],
  DACIA: ['dacia'], DS: ['ds automobiles', 'ds3', 'ds4', 'ds5', 'ds 3', 'ds 4', 'ds 7'], FIAT: ['fiat'], FORD: ['ford'],
  HONDA: ['honda'], HYUNDAI: ['hyundai'], JEEP: ['jeep'], KIA: ['kia'], 'LAND ROVER': ['land rover', 'range rover'],
  MAZDA: ['mazda'], MERCEDES: ['mercedes', 'mercedes-benz'], MINI: ['mini cooper', 'mini one', 'mini countryman', 'mini '],
  MITSUBISHI: ['mitsubishi'], NISSAN: ['nissan'], OPEL: ['opel'], PEUGEOT: ['peugeot'], RENAULT: ['renault'],
  SEAT: ['seat'], SKODA: ['skoda', 'škoda'], SMART: ['smart'], SUZUKI: ['suzuki'], TOYOTA: ['toyota'],
  VOLKSWAGEN: ['volkswagen', 'vw '], VOLVO: ['volvo'], CUPRA: ['cupra'], TESLA: ['tesla'], LEXUS: ['lexus'],
  CHEVROLET: ['chevrolet'], ALPINE: ['alpine'], PORSCHE: ['porsche'], JAGUAR: ['jaguar'], MG: ['mg motor', 'mg zs', 'mg4'],
  LANCIA: ['lancia'], SUBARU: ['subaru'], 'SSANGYONG': ['ssangyong'],
};

// Prix neuf indicatif (€) par segment, pour une cote grossière. À compléter par la comparaison Leboncoin.
const SEGMENTS = {
  A: { neuf: 13500, modeles: ['twingo', 'aygo', 'c1', '107', '108', 'i10', 'picanto', 'up', 'panda', 'spark', 'fortwo', 'forfour', 'ka', 'ka+', 'alto', 'celerio', 'zoe', 'c-zero', 'ion', 'mii', 'citigo', 'agila', 'adam', 'spring', '500', 'ypsilon'] },
  B: { neuf: 18500, modeles: ['clio', '206', '207', '208', 'c3', 'c2', 'polo', 'fiesta', 'corsa', 'yaris', 'ibiza', 'fabia', 'micra', 'note', 'sandero', 'logan', 'jazz', 'i20', 'rio', 'mazda2', '2', 'swift', 'punto', 'grande punto', 'mito', 'modus', 'colt', 'a1', 'ds3', 'mini', 'one', 'cooper', 'auris', 'fox', 'kangoo', 'berlingo', 'partner', 'doblo', 'bipper', 'nemo', 'combo', 'meriva', 'c3 picasso', 'fiorino', 'qubo', 'tigra', '1007', 'clio 4', 'clio 5', 'clio iv', 'clio v'] },
  C: { neuf: 26000, modeles: ['megane', 'mégane', '308', '307', 'c4', 'golf', 'focus', 'astra', 'leon', 'octavia', 'corolla', 'i30', 'ceed', "cee'd", 'civic', 'a3', 'serie 1', 'série 1', 'classe a', 'classe b', 'scenic', 'scénic', 'c4 picasso', 'picasso', 'xsara', 'xsara picasso', 'zafira', 'touran', 'c-max', 'b-max', 'bravo', 'tipo', 'giulietta', 'lancer', 'mazda3', '3', 'rapid', 'scala', 'jetta', 'beetle', '3008', '2008', 'captur', 'duster', 'kadjar', 'juke', 'qashqai', 'c3 aircross', 't-roc', 't-cross', 'stonic', 'kona', 'arona', 'ecosport', 'puma', 'mokka', 'crossland', 'grandland', 'sportage', 'tucson', 'ix35', 'ix20', 'venga', 'rav4', 'chr', 'c-hr', 'cx-3', 'cx-5', 'vitara', 'sx4', 's-cross', 'jogger', 'lodgy', 'dokker', 'kuga', 'yeti', 'karoq', 'ateca', 'renegade', 'mg zs', 'ds4', 'ds 4', 'ds3 crossback', 'xv', 'impreza', 'outlander', 'asx', 'x-trail', '5008', 'espace', 'grand scenic', 'c5', 'sharan', 'alhambra', 'galaxy', 's-max', 'caddy', 'trafic', 'expert', 'jumpy', 'vivaro', 'transit', 'master', 'boxer', 'jumper', 'ducato'] },
  D: { neuf: 37000, modeles: ['a4', 'a5', 'a6', 'serie 3', 'série 3', 'serie 5', 'série 5', 'serie 2', 'série 2', 'serie 4', 'série 4', 'classe c', 'classe e', 'cla', 'gla', 'glc', 'passat', 'arteon', '508', '407', '607', 'talisman', 'laguna', 'latitude', 'mondeo', 'insignia', 'vectra', 'superb', 'kodiaq', 'tiguan', 'x1', 'x2', 'x3', 'q2', 'q3', 'q5', 'xc40', 'xc60', 'v40', 'v60', 's60', 'v50', 'c30', 'ds5', 'ds 5', 'ds7', 'ds 7', 'evoque', 'freelander', 'discovery sport', 'koleos', 'avensis', 'prius', 'is', 'ct', 'nx', 'model 3', 'compass', 'cherokee', 'santa fe', 'sorento', 'mazda6', '6', 'cx-30', 'giulia', 'stelvio', 'golf gti', 'leaf'] },
  E: { neuf: 55000, modeles: ['x4', 'x5', 'x6', 'q7', 'q8', 'a7', 'a8', 'serie 7', 'série 7', 'classe s', 'gle', 'glk', 'ml', 'cayenne', 'macan', 'range rover', 'velar', 'discovery', 'xc90', 'touareg', 'model s', 'model x', 'model y', 'f-pace', 'xe', 'xf'] },
};
const MARQUES_FORTE_REVENTE = ['TOYOTA', 'DACIA', 'SUZUKI', 'HONDA', 'MAZDA', 'LEXUS'];
const MARQUES_FAIBLE_REVENTE = ['ALFA ROMEO', 'LANCIA', 'CHEVROLET', 'SSANGYONG', 'JAGUAR', 'FIAT'];

const MOTS_JUDICIAIRE = /(judiciaire|liquidation|\bLJ\b|redressement|mandataire|saisie|saisi[se]?\b|domaine|ventes? forc[ée]e|sur requ[êe]te|commissaire de justice|tribunal|scell[ée]s|fourri[èe]re|douane)/i;
const MOTS_RISQUE = /(non roulant|ne roule pas|ne d[ée]marre pas|moteur hs|moteur cass|\bHS\b|[ée]pave|pour pi[èe]ces|sans cl[ée]|sans carte grise|sans certificat|sans papiers|accident[ée]|br[uû]l[ée]|incendi|immerg|inond|\bVGE\b|\bVEI\b|\bVE\b non|joint de culasse|boite hs|boîte hs|courroie cass|en l'[ée]tat sans garantie de fonctionnement)/i;

const norm = (s) => (s || '').toString().replace(/[   ]/g, ' ');
const num = (s) => {
  if (s == null) return null;
  const n = parseInt(norm(s).replace(/[ .,]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

export function detecterMarqueModele(titre) {
  const t = ' ' + norm(titre).toLowerCase().replace(/[^a-z0-9àâäéèêëîïôöùûüç+\-' ]/g, ' ').replace(/\s+/g, ' ') + ' ';
  let marque = null, pos = -1, alias = '';
  for (const [m, aliases] of Object.entries(MARQUES)) {
    for (const a of aliases) {
      const i = t.indexOf(' ' + a.trim() + ' ');
      if (i >= 0 && (pos < 0 || i < pos)) { marque = m; pos = i; alias = a.trim(); }
    }
  }
  if (!marque) return { marque: null, modele: null };
  const apres = t.slice(pos + alias.length + 2).trim().split(' ');
  // modèle = 1 à 2 mots après la marque (ex. "c4 picasso", "classe a", "serie 1")
  let modele = apres[0] || '';
  const deux = (apres[0] || '') + ' ' + (apres[1] || '');
  for (const seg of Object.values(SEGMENTS)) if (seg.modeles.includes(deux.trim())) { modele = deux.trim(); break; }
  if (['ds automobiles'].includes(alias)) modele = apres[0];
  return { marque, modele: modele || null };
}

function segmentDe(modele, marque) {
  if (!modele) return null;
  const m = modele.toLowerCase();
  for (const [k, seg] of Object.entries(SEGMENTS)) if (seg.modeles.includes(m)) return k;
  for (const [k, seg] of Object.entries(SEGMENTS)) if (seg.modeles.some((x) => m.startsWith(x) && x.length >= 3)) return k;
  if (['BMW', 'AUDI', 'MERCEDES', 'VOLVO', 'LAND ROVER', 'LEXUS', 'JAGUAR'].includes(marque)) return 'D';
  if (['PORSCHE', 'TESLA'].includes(marque)) return 'E';
  return 'C';
}

export function analyserTexte(texte, titreBrut = '') {
  const t = norm(texte);
  const titre = norm(titreBrut || t.split('\n').find((l) => l.trim().length > 8) || '').trim().slice(0, 140);
  const { marque, modele } = detecterMarqueModele(titre + ' ' + t.slice(0, 600));

  // Année (1ère mise en circulation)
  let annee = null;
  const mec = t.match(/(?:1\s*(?:°|ère|ere|re|er)?\s*mise en circ\w*\.?|mise en circulation|\bMEC\b|\bDMEC\b|date de 1(?:ère|ere)? immat\w*|ann[ée]e)\s*[:\-]?\s*(?:le\s*)?(?:(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})|(\d{1,2})[\/.\-](\d{4})|(\d{4}))/i);
  if (mec) annee = parseInt(mec[3] || mec[5] || mec[6], 10);
  if (!annee) { const y = titre.match(/\b(19[89]\d|20[0-3]\d)\b/); if (y) annee = parseInt(y[1], 10); }
  if (!annee) {
    const anneeMax = new Date().getFullYear() - 1;
    const sansDates = t.slice(0, 1500).replace(/\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{4}/g, ' ');
    const y = [...sansDates.matchAll(/(?<![\d€])\b(199\d|20[0-3]\d)\b(?!\s*(?:€|km|cm|kg))/g)].map((m) => +m[1]).find((v) => v <= anneeMax);
    if (y) annee = y;
  }
  if (annee && (annee < 1950 || annee > new Date().getFullYear() + 1)) annee = null;

  // Kilométrage
  let km = null;
  const reKm = /(\d{1,3}(?:[ .]\d{3})+|\d{3,7})\s*(?:km|kms|kilom[èe]tres?)\b/gi;
  let mk; const kms = [];
  while ((mk = reKm.exec(t))) { const v = num(mk[1]); if (v >= 500 && v <= 600000) kms.push(v); }
  const kmLabel = t.match(/(?:kilom[ée]trage|compteur)\s*(?:affich[ée]|non garanti|lu)?\s*[:\-]?\s*(\d{1,3}(?:[ .]\d{3})+|\d{3,7})/i);
  if (kmLabel && num(kmLabel[1]) >= 500) km = num(kmLabel[1]); else if (kms.length) km = kms[0];

  // Prix : estimation, mise à prix, prix de départ, enchère actuelle
  let estBasse = null, estHaute = null, miseAPrix = null, enchere = null;
  const est = t.match(/estimation\s*[:\-]?\s*(\d[\d .]*)\s*€?\s*(?:-|à|–|\/)\s*(\d[\d .]*)\s*€/i);
  if (est) { estBasse = num(est[1]); estHaute = num(est[2]); }
  else { const e1 = t.match(/estimation\s*[:\-]?\s*(\d[\d .]*)\s*€/i); if (e1) estBasse = estHaute = num(e1[1]); }
  const map = t.match(/(?:mise [àa] prix|prix de d[ée]part|prix de r[ée]serve|d[ée]part\s*:?)\s*[:\-]?\s*(\d[\d .]*)\s*€/i);
  if (map) miseAPrix = num(map[1]);
  const ench = t.match(/(?:ench[èe]re (?:actuelle|en cours)|offre actuelle|derni[èe]re offre|prix actuel)\s*[:\-]?\s*(\d[\d .]*)\s*€/i);
  if (ench) enchere = num(ench[1]);
  const cotePro = t.match(/(?:cote|valeur argus|prix argus)\s*[:\-]?\s*(\d[\d .]*)\s*€/i);

  // Frais acheteur
  let fraisPct = null;
  const fr = t.match(/frais(?: de vente| acheteurs?| d'adjudication)?[^%]{0,60}?(\d{1,2}(?:[.,]\d{1,3})?)\s*%/i);
  if (fr) fraisPct = parseFloat(fr[1].replace(',', '.'));

  // Date de vente
  let dateVente = null;
  const auj = new Date(Date.now() - 86400e3).toISOString().slice(0, 10);
  for (const dv of t.matchAll(/(\d{2})\/(\d{2})\/(20\d{2})(?:\s*(?:à|-|,)?\s*(\d{1,2})\s*[h:]\s*(\d{2})?)?/g)) {
    const d = `${dv[3]}-${dv[2]}-${dv[1]}`;
    if (d >= auj) { dateVente = d + (dv[4] ? `T${dv[4].padStart(2, '0')}:${(dv[5] || '00')}` : ''); break; }
  }

  // Lieu
  let cp = null, ville = null;
  const lieu = t.match(/\b((?:0[1-9]|[1-8]\d|9[0-5]|2[AB])\d{3})\s+([A-ZÉÈÀ][A-Za-zÀ-ÿ'\- ]{2,30})/);
  if (lieu) { cp = lieu[1]; ville = lieu[2].trim().split(/\s{2,}|\n/)[0]; }

  const carburant = (t.match(/\b(diesel|gazole|essence|hybride|[ée]lectrique|gpl|e85|bio[ée]thanol)\b/i) || [])[1]?.toLowerCase().replace('gazole', 'diesel') || null;
  const boiteAuto = /bo[îi]te auto|automatique|\bBVA\b|\bEDC\b|\bDSG\b|\bEAT\d?\b/i.test(t);
  const judiciaire = MOTS_JUDICIAIRE.test(t);
  const risque = (t.match(MOTS_RISQUE) || [])[0] || null;

  return {
    titre, marque, modele, annee, km, carburant, boiteAuto, estBasse, estHaute, miseAPrix, enchere,
    coteVendeur: cotePro ? num(cotePro[1]) : null, fraisPct, dateVente, cp, ville,
    departement: cp ? cp.slice(0, 2) : null, judiciaire, risque,
  };
}

export function coteEstimee(lot) {
  const seg = segmentDe(lot.modele, lot.marque);
  if (!seg || !lot.annee) return null;
  const age = Math.max(0, new Date().getFullYear() - lot.annee);
  // Courbe calée sur les prix constatés du marché VO français (valeurs qui tiennent bien)
  let v = SEGMENTS[seg].neuf * (age === 0 ? 0.88 : 0.8 * Math.pow(0.92, age - 1));
  if (age > 15) v *= Math.pow(0.95, age - 15);
  if (lot.km) {
    const attendu = Math.max(1, age) * 15000;
    const ecart = (lot.km - attendu) / 10000;
    v *= 1 + Math.max(-0.3, Math.min(0.2, ecart > 0 ? -0.03 * ecart : -0.02 * ecart));
    if (lot.km > 250000) v *= 0.8;
  }
  if (MARQUES_FORTE_REVENTE.includes(lot.marque)) v *= 1.08;
  if (MARQUES_FAIBLE_REVENTE.includes(lot.marque)) v *= 0.9;
  if (lot.carburant === 'diesel' && age > 12) v *= 0.93;
  if (lot.boiteAuto) v *= 1.05;
  if (lot.risque) v *= 0.5;
  v = Math.max(500, v);
  return Math.round(v / 50) * 50;
}

export function calculerAchat(lot, cfg) {
  const pct = lot.fraisPct ?? cfg.fraisAcheteurParDefautPourcent;
  let prix = null, base = '';
  if (lot.enchere) { prix = lot.enchere * 1.1; base = 'enchère actuelle +10 %'; }
  else if (lot.estBasse && lot.estHaute) { prix = (lot.estBasse + lot.estHaute) / 2; base = 'milieu de l\'estimation'; }
  else if (lot.miseAPrix) { prix = lot.miseAPrix * 1.3; base = 'mise à prix +30 %'; }
  else if (lot.estBasse) { prix = lot.estBasse; base = 'estimation'; }
  if (!prix) return { prixProbable: null, coutTotal: null, base: 'prix inconnu' };
  const coutTotal = Math.round(prix * (1 + pct / 100) + (cfg.fraisFixesParVoiture || 0));
  return { prixProbable: Math.round(prix), fraisPct: pct, coutTotal, base };
}

export function lienLeboncoin(lot) {
  const q = [lot.marque, lot.modele].filter(Boolean).join(' ').toLowerCase();
  const p = new URLSearchParams({ category: '2', text: q || lot.titre.slice(0, 40) });
  if (lot.annee) p.set('regdate', `${lot.annee - 1}-${lot.annee + 1}`);
  if (lot.km) p.set('mileage', `${Math.max(0, Math.round((lot.km - 25000) / 5000) * 5000)}-${Math.round((lot.km + 25000) / 5000) * 5000}`);
  if (lot.carburant === 'diesel') p.set('fuel', '2');
  if (lot.carburant === 'essence') p.set('fuel', '1');
  p.set('sort', 'price'); p.set('order', 'asc');
  return 'https://www.leboncoin.fr/recherche?' + p.toString();
}

export function enrichir(lot, cfg) {
  const cote = coteEstimee(lot);
  const achat = calculerAchat(lot, cfg);
  const marge = cote && achat.coutTotal ? cote - achat.coutTotal : null;
  const dansZone = !lot.departement || cfg.departementsRetrait.includes(lot.departement);
  const bonneAffaire = !!(marge != null && marge >= cfg.margeMinBonneAffaire && achat.prixProbable <= cfg.prixMaxAchat && !lot.risque && dansZone);
  return { ...lot, cote, ...achat, marge, dansZone, bonneAffaire, leboncoin: lienLeboncoin(lot) };
}
