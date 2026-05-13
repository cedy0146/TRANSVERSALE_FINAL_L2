/**
 * ============================================================
 * SERVICE DE COMPARAISON D'ALGORITHMES — ElectriMada
 * ============================================================
 * Compare en temps réel 3 stratégies d'allocation :
 *  1. FIFO naïf      : premier arrivé, premier servi
 *  2. Partage égal   : divise l'énergie en parts égales
 *  3. Knapsack DP    : optimise l'utilité sociale
 *
 * Toutes les données viennent de MySQL (aucune valeur codée en dur).
 * Les résultats sont sauvegardés en base pour historique.
 * ============================================================
 */

const db = require('../db');
const { allocuerEnergie, allocuerNaif, UTILITY_MAP } = require('../algorithms/allocationKnapsack');
const logger = require('./logger');

/**
 * Partage égalitaire de l'énergie disponible.
 * Chaque foyer accepté reçoit une part fixe.
 *
 * @param {Array}  demandes    - Liste des demandes
 * @param {number} capaciteWh - Énergie disponible en Wh
 * @returns {Object}
 */
function allocuerEgalitaire(demandes, capaciteWh) {
  if (!demandes || demandes.length === 0 || capaciteWh <= 0) {
    return { acceptees: [], rejetees: demandes || [], utilite_totale: 0,
             energie_utilisee_kwh: 0, methode: 'egalitaire' };
  }

  const partParFoyer = (capaciteWh / 1000) / demandes.length; // kWh par foyer
  const acceptees = [];
  const rejetees  = [];

  demandes.forEach(d => {
    if (d.quantite_kwh <= partParFoyer) {
      const utilite = UTILITY_MAP[d.niveau_criticite] || UTILITY_MAP.NORMALE;
      acceptees.push({ ...d, utilite, part_allouee_kwh: partParFoyer });
    } else {
      rejetees.push(d);
    }
  });

  return {
    acceptees,
    rejetees,
    utilite_totale        : acceptees.reduce((s, d) => s + d.utilite, 0),
    energie_utilisee_kwh  : acceptees.length * partParFoyer,
    methode               : 'egalitaire',
  };
}

/**
 * Lance la comparaison des 3 algorithmes avec les données MySQL en cours.
 *
 * @returns {Promise<Object>} Résultats comparatifs
 */
async function comparerEnTempsReel() {
  // ── Lecture de la capacité batterie ────────────────────────
  const [batteries] = await db.execute(
    'SELECT capacite_actuelle FROM Batterie ORDER BY id DESC LIMIT 1'
  );
  if (!batteries.length) {
    throw new Error('Aucune batterie configurée en base de données');
  }
  const capaciteWh = batteries[0].capacite_actuelle * 1000; // kWh → Wh

  // ── Lecture des demandes en attente ────────────────────────
  const [rows] = await db.execute(
    `SELECT id, foyer_id, quantite_kwh, niveau_criticite, heure_souhaitee
     FROM DemandeEnergie
     WHERE est_acceptee = 0
     ORDER BY heure_souhaitee ASC`
  );
  const demandes = rows;

  if (demandes.length === 0) {
    await logger.info('comparerEnTempsReel : aucune demande en attente');
    return { message: 'Aucune demande en attente', capacite_wh: capaciteWh, resultats: [] };
  }

  // ── Exécution des 3 stratégies ─────────────────────────────
  const t0 = Date.now();
  const resKnapsack = allocuerEnergie(demandes, capaciteWh);
  const tempsKnapsack = Date.now() - t0;

  const t1 = Date.now();
  const resFifo = allocuerNaif(demandes, capaciteWh);
  const tempsFifo = Date.now() - t1;

  const t2 = Date.now();
  const resEgal = allocuerEgalitaire(demandes, capaciteWh);
  const tempsEgal = Date.now() - t2;

  // ── Calcul des métriques de satisfaction ───────────────────
  const totalDemandes = demandes.length;

  function metriques(res, tempsMs) {
    const critiques = demandes.filter(d => d.niveau_criticite === 'CRITIQUE').length;
    const critiquesSauves = res.acceptees.filter(d => d.niveau_criticite === 'CRITIQUE').length;
    const satisfaction = totalDemandes > 0
      ? ((res.acceptees.length / totalDemandes) * 100).toFixed(1)
      : '0';

    return {
      methode              : res.methode,
      demandes_acceptees   : res.acceptees.length,
      demandes_rejetees    : res.rejetees.length,
      satisfaction_pct     : parseFloat(satisfaction),
      utilite_totale       : res.utilite_totale,
      energie_utilisee_kwh : parseFloat(res.energie_utilisee_kwh.toFixed(3)),
      energie_economisee_kwh: parseFloat(((capaciteWh / 1000) - res.energie_utilisee_kwh).toFixed(3)),
      critiques_sauves     : critiquesSauves,
      critiques_total      : critiques,
      coupures_evitees     : res.acceptees.length,
      temps_calcul_ms      : tempsMs,
    };
  }

  const resultats = [
    metriques(resFifo,     tempsFifo),
    metriques(resEgal,     tempsEgal),
    metriques(resKnapsack, tempsKnapsack),
  ];

  // Meilleure méthode = plus haute utilité sociale
  const meilleur = resultats.reduce((best, cur) =>
    cur.utilite_totale > best.utilite_totale ? cur : best, resultats[0]);
  meilleur.est_optimal = true;

  // ── Sauvegarde en base ────────────────────────────────────
  try {
    for (const r of resultats) {
      await db.execute(
        `INSERT INTO comparaisons_algorithmes
           (methode, satisfaction_pct, utilite_totale, energie_utilisee_kwh,
            critiques_sauves, temps_calcul_ms, nb_demandes, capacite_wh, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [r.methode, r.satisfaction_pct, r.utilite_totale, r.energie_utilisee_kwh,
         r.critiques_sauves, r.temps_calcul_ms, totalDemandes, capaciteWh]
      );
    }
  } catch (err) {
    await logger.warning('Sauvegarde comparaison échouée (mode offline)', { err: err.message });
  }

  await logger.success('Comparaison des algorithmes terminée', {
    nb_demandes: totalDemandes,
    meilleure_methode: meilleur.methode,
    utilite_knapsack: resKnapsack.utilite_totale,
  });

  return {
    capacite_wh      : capaciteWh,
    nb_demandes_total: totalDemandes,
    resultats,
    meilleure_methode: meilleur.methode,
  };
}

/**
 * Récupère l'historique des comparaisons depuis MySQL.
 * @param {number} [limit=20]
 */
async function getHistoriqueComparaisons(limit = 20) {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM comparaisons_algorithmes ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows;
  } catch (err) {
    await logger.error('getHistoriqueComparaisons échoué', { err: err.message });
    return [];
  }
}

module.exports = { comparerEnTempsReel, getHistoriqueComparaisons, allocuerEgalitaire };
