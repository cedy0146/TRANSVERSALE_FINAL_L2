/**
 * ============================================================
 * SERVICE DE PLANIFICATION (CRON) — ElectriMada
 * ============================================================
 * Ce service automatise les tâches récurrentes du village.
 * Fréquence : Chaque soir à 23h50.
 * Objectif : Clôturer les données énergétiques du jour.
 * ============================================================
 */

const cron = require('node-cron');
const db = require('../db');
const logger = require('./logger');

/**
 * Initialise toutes les tâches automatisées du backend.
 */
function initialiserAutomatisations() {
  // Planification : 50 23 * * * (Tous les jours à 23h50)
  cron.schedule('50 23 * * *', async () => {
    const aujourdhui = new Date().toISOString().split('T')[0];
    
    try {
      await logger.info(`Démarrage de la clôture automatique pour le ${aujourdhui}`);

      // 1. Calcul de la production totale du jour
      // Dans un système réel de 2035, on interroge l'API des onduleurs ou on somme la télémétrie.
      // Ici, nous récupérons une valeur consolidée ou simulée basée sur l'état des batteries.
      const [stats] = await db.execute('SELECT SUM(capacite_actuelle) as total_wh FROM Batterie');
      
      // On simule un index d'ensoleillement basé sur l'heure (simple pour la démo)
      const productionKwh = (stats[0].total_wh || 5000) / 1000; // Conversion simple pour l'historique
      const indexSolaire = 0.75 + (Math.random() * 0.2); // Index entre 0.75 et 0.95

      // 2. Insertion dans l'historique météo pour que weatherService puisse l'utiliser demain
      // Utilisation de ON DUPLICATE KEY UPDATE pour éviter les doublons en cas de redémarrage serveur
      await db.execute(
        `INSERT INTO historique_meteo (date_mesure, index_ensoleillement) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE index_ensoleillement = VALUES(index_ensoleillement)`,
        [aujourdhui, indexSolaire]
      );

      await logger.success(`Clôture réussie : ${productionKwh.toFixed(2)} kWh enregistrés pour ${aujourdhui}`);

    } catch (err) {
      await logger.error(`Échec de la clôture automatique du ${aujourdhui}`, { erreur: err.message });
    }
  });

  console.log('[\x1b[32mCRON\x1b[0m] Service de planification démarré (Clôture à 23h50)');
}

module.exports = { initialiserAutomatisations };