/**
 * ============================================================
 * SERVICE MÉTÉO — Moyenne Glissante (Offline-First)
 * ============================================================
 * Objectif : Prévoir la production solaire de demain
 *            à partir des 7 derniers jours enregistrés en MySQL.
 *
 * Fonctionnement hors-ligne :
 *  1. Lecture de l'historique MySQL
 *  2. Si base inaccessible → utilise le dernier cache local (mémoire)
 *  3. Si aucun historique → valeur de repli configurable (en base)
 * ============================================================
 */

const db = require('../db');
const logger = require('./logger');

// ─── Paramètres de repli (si aucune donnée) ──────────────────
const FENETRE_DEFAUT = 7;            // 7 derniers jours
const PRODUCTION_DEFAUT_KWH = 5.0;  // kWh/jour si aucun historique

// ─── Cache mémoire (tampon offline) ──────────────────────────
let _cacheHistorique = [];
let _cachePrevision  = null;

/**
 * Calcule la moyenne glissante sur les derniers `fenetre` jours.
 * Filtre les valeurs nulles ou aberrantes (< 0 ou > 100 kWh/jour).
 *
 * @param {number[]} historique - Productions passées (kWh)
 * @param {number}   fenetre    - Taille de la fenêtre
 * @returns {number}
 */
function moyenneGlissante(historique, fenetre = FENETRE_DEFAUT) {
  if (!historique || historique.length === 0) return PRODUCTION_DEFAUT_KWH;

  const recentes = historique.slice(-fenetre);
  const valides  = recentes.filter(v => typeof v === 'number' && v >= 0 && v <= 100);

  if (valides.length === 0) return PRODUCTION_DEFAUT_KWH;

  const somme = valides.reduce((acc, v) => acc + v, 0);
  return parseFloat((somme / valides.length).toFixed(3));
}

/**
 * Moyenne pondérée exponentielle :
 * les jours récents ont plus de poids.
 *
 * @param {number[]} historique
 * @param {number}   fenetre
 * @returns {number}
 */
function moyennePonderee(historique, fenetre = FENETRE_DEFAUT) {
  if (!historique || historique.length === 0) return PRODUCTION_DEFAUT_KWH;

  const recentes = historique.slice(-fenetre).filter(v => typeof v === 'number' && v >= 0 && v <= 100);
  if (recentes.length === 0) return PRODUCTION_DEFAUT_KWH;
  if (recentes.length === 1) return recentes[0];

  let somme = 0, totalPoids = 0;
  recentes.forEach((v, i) => {
    const poids = i + 1; // poids croissant : plus récent = poids plus élevé
    somme      += v * poids;
    totalPoids += poids;
  });
  return parseFloat((somme / totalPoids).toFixed(3));
}

/**
 * Récupère l'historique de production depuis MySQL.
 * En cas d'erreur réseau, retourne le cache mémoire.
 *
 * @param {number} nbJours - Nombre de jours à récupérer
 * @returns {Promise<number[]>}
 */
async function getHistoriqueProduction(nbJours = FENETRE_DEFAUT) {
  try {
    const [rows] = await db.execute(
      `SELECT production_kwh
       FROM historique_meteo
       ORDER BY date_jour DESC
       LIMIT ?`,
      [nbJours]
    );
    const valeurs = rows.map(r => r.production_kwh).reverse(); // du plus ancien au plus récent
    _cacheHistorique = valeurs; // mise à jour du cache
    return valeurs;
  } catch (err) {
    await logger.warning('getHistoriqueProduction : BD inaccessible, utilisation du cache', {
      err: err.message,
      cache_size: _cacheHistorique.length,
    });
    return _cacheHistorique; // cache offline
  }
}

/**
 * Enregistre la production solaire du jour en MySQL.
 *
 * @param {number} productionKwh
 * @param {string} [dateJour] - Format YYYY-MM-DD (défaut: aujourd'hui)
 */
async function enregistrerProduction(productionKwh, dateJour = null) {
  const date = dateJour || new Date().toISOString().split('T')[0];
  try {
    await db.execute(
      `INSERT INTO historique_meteo (date_jour, production_kwh, created_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE production_kwh = VALUES(production_kwh)`,
      [date, productionKwh]
    );
    await logger.success('Production solaire enregistrée', { date, productionKwh });
  } catch (err) {
    await logger.error('Échec enregistrement production', { err: err.message });
    throw err;
  }
}

/**
 * Génère une prévision complète avec intervalle de confiance.
 * Fonctionne en mode offline grâce au cache mémoire.
 *
 * @param {Object} options
 * @param {number}  options.fenetre    - Taille fenêtre (défaut 7)
 * @param {boolean} options.ponderee  - Utiliser la pondération (défaut false)
 * @returns {Promise<Object>}
 */
async function prevoir(options = {}) {
  const fenetre   = options.fenetre  || FENETRE_DEFAUT;
  const ponderee  = options.ponderee || false;

  const historique = await getHistoriqueProduction(fenetre);

  const estimation = ponderee
    ? moyennePonderee(historique, fenetre)
    : moyenneGlissante(historique, fenetre);

  // Intervalle de confiance : ±20% si peu de données, ±10% sinon
  const marge = historique.length >= fenetre ? 0.10 : 0.20;

  const prevision = {
    estimation_kwh    : estimation,
    min_kwh           : parseFloat((estimation * (1 - marge)).toFixed(3)),
    max_kwh           : parseFloat((estimation * (1 + marge)).toFixed(3)),
    confiance_pct     : historique.length >= fenetre ? 80 : 50,
    methode           : ponderee ? 'moyenne_ponderee' : 'moyenne_glissante',
    donnees_utilisees : historique.length,
    fenetre_jours     : fenetre,
    offline           : historique === _cacheHistorique && _cacheHistorique.length > 0,
  };

  _cachePrevision = prevision; // sauvegarde en cache
  await logger.info('Prévision solaire calculée', {
    estimation: prevision.estimation_kwh,
    confiance: prevision.confiance_pct,
    offline: prevision.offline,
  });

  return prevision;
}

/**
 * Retourne la dernière prévision en cache (sans appel BD).
 * Utile quand le réseau est coupé.
 */
function getDernierePrevisionCache() {
  return _cachePrevision;
}

module.exports = {
  prevoir,
  enregistrerProduction,
  getHistoriqueProduction,
  moyenneGlissante,
  moyennePonderee,
  getDernierePrevisionCache,
};
