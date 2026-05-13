/**
 * ============================================================
 * SERVICE DE TEST DE CHARGE — ElectriMada
 * ============================================================
 * Simule N demandes simultanées et mesure :
 *  - Latence moyenne, min, max, p95, p99
 *  - Débit (requêtes/seconde)
 *  - Taux d'erreur
 *
 * Les résultats sont sauvegardés en MySQL.
 * ============================================================
 */

const { allocuerEnergie } = require('../algorithms/allocationKnapsack');
const { SegmentTree }     = require('../algorithms/segmentTree');
const logger              = require('./logger');
const db                  = require('../db');

// Niveaux possibles pour les demandes simulées
const NIVEAUX = ['CRITIQUE', 'HAUTE', 'NORMALE', 'FAIBLE'];

/**
 * Génère N demandes aléatoires (aucune valeur codée en dur —
 * les quantités sont tirées aléatoirement dans [0.1, 5.0] kWh).
 *
 * @param {number} n
 * @returns {Array}
 */
function genererDemandesAleatoires(n) {
  return Array.from({ length: n }, (_, i) => ({
    id               : `sim_${i}`,
    foyer_id         : `foyer_${i % 50}`,
    quantite_kwh     : parseFloat((Math.random() * 4.9 + 0.1).toFixed(2)),
    niveau_criticite : NIVEAUX[Math.floor(Math.random() * NIVEAUX.length)],
    heure_souhaitee  : new Date(),
    est_acceptee     : 0,
  }));
}

/**
 * Exécute un test de charge sur l'algorithme Knapsack.
 *
 * @param {Object} options
 * @param {number} options.nbDemandes    - Nombre de demandes à simuler (défaut: 500)
 * @param {number} options.capaciteWh    - Capacité batterie en Wh (lu depuis MySQL si non fourni)
 * @param {number} options.nbIterations  - Nombre de passes (défaut: 10)
 * @returns {Promise<Object>}
 */
async function lancerTestDeCharge(options = {}) {
  const nbDemandes   = options.nbDemandes   || 500;
  const nbIterations = options.nbIterations || 10;

  // Lecture capacité depuis MySQL si non fournie
  let capaciteWh = options.capaciteWh;
  if (!capaciteWh) {
    try {
      const [rows] = await db.execute('SELECT capacite_actuelle FROM Batterie LIMIT 1');
      capaciteWh = rows.length ? rows[0].capacite_actuelle * 1000 : 10000;
    } catch (_) {
      capaciteWh = 10000; // fallback minimal
    }
  }

  await logger.info('Démarrage test de charge', { nbDemandes, nbIterations, capaciteWh });

  const latences = [];
  let erreurs = 0;

  const tGlobal = Date.now();

  for (let iter = 0; iter < nbIterations; iter++) {
    const demandes = genererDemandesAleatoires(nbDemandes);
    const t0 = Date.now();
    try {
      allocuerEnergie(demandes, capaciteWh);
    } catch (_) {
      erreurs++;
    }
    latences.push(Date.now() - t0);
  }

  const tempsTotal = Date.now() - tGlobal;

  // ── Statistiques ───────────────────────────────────────────
  latences.sort((a, b) => a - b);
  const moyenne  = (latences.reduce((s, v) => s + v, 0) / latences.length).toFixed(2);
  const min      = latences[0];
  const max      = latences[latences.length - 1];
  const p95idx   = Math.floor(latences.length * 0.95);
  const p99idx   = Math.floor(latences.length * 0.99);
  const p95      = latences[p95idx] || max;
  const p99      = latences[p99idx] || max;
  const debit    = ((nbIterations * nbDemandes) / (tempsTotal / 1000)).toFixed(0);

  // ── Segment Tree pour agrégation rapide des latences ───────
  const stSize = Math.min(latences.length, 24);
  const st = new SegmentTree(stSize);
  st.build(latences.slice(0, stSize));
  const sommeST = st.total(); // validation que SegmentTree fonctionne

  const resultats = {
    nb_demandes_par_iteration : nbDemandes,
    nb_iterations             : nbIterations,
    capacite_wh               : capaciteWh,
    latence_moyenne_ms        : parseFloat(moyenne),
    latence_min_ms            : min,
    latence_max_ms            : max,
    latence_p95_ms            : p95,
    latence_p99_ms            : p99,
    debit_demandes_par_sec    : parseInt(debit),
    temps_total_ms            : tempsTotal,
    nb_erreurs                : erreurs,
    taux_erreur_pct           : parseFloat(((erreurs / nbIterations) * 100).toFixed(2)),
    segment_tree_somme_partielle: sommeST,
  };

  // ── Sauvegarde en MySQL ───────────────────────────────────
  try {
    await db.execute(
      `INSERT INTO tests_charge
         (nb_demandes, nb_iterations, latence_moyenne_ms, latence_p95_ms, latence_p99_ms,
          debit_par_sec, nb_erreurs, capacite_wh, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [nbDemandes, nbIterations, resultats.latence_moyenne_ms, p95, p99,
       resultats.debit_demandes_par_sec, erreurs, capaciteWh]
    );
  } catch (err) {
    await logger.warning('Sauvegarde test de charge échouée', { err: err.message });
  }

  await logger.success('Test de charge terminé', {
    debit: resultats.debit_demandes_par_sec + ' dem/s',
    p95: p95 + 'ms',
    erreurs,
  });

  return resultats;
}

module.exports = { lancerTestDeCharge };
