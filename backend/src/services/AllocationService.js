/**
 * Service d'allocation d'énergie
 * Orchestre le Knapsack + le modèle DemandeEnergie + la batterie.
 * Intègre également la prévision solaire.
 */
const { allocuerEnergie, allocuerNaif, comparerAlgorithmes } = require('../algorithms/allocationKnapsack');
const { prevoir, calculerDisponible } = require('../algorithms/Forecastmovingaverage');
const DemandeEnergie = require('../models/DemandeEnergie');
const Batterie        = require('../models/Batterie');
const Rapport         = require('../models/Rapport');

async function lancerAllocation() {
  const batteries = await Batterie.findAll();
  if (!batteries || batteries.length === 0) throw new Error('Aucune batterie configurée.');
  const batterie = batteries[0];

  const toutesLesDemandes = await DemandeEnergie.findAll();
  const demandesEnAttente = toutesLesDemandes.filter(d => !d.est_acceptee);
  if (demandesEnAttente.length === 0) {
    return { message: 'Aucune demande en attente.', acceptees: [], rejetees: [] };
  }

  const energieDisponibleWh = Math.max(0, batterie.capacite_actuelle - batterie.seuil_critique);
  const { acceptees, rejetees, utilite_totale, energie_utilisee_kwh } =
    allocuerEnergie(demandesEnAttente, energieDisponibleWh);

  for (const d of acceptees) {
    // On ne veut pas envoyer l'id dans la clause SET de l'UPDATE
    const { id, ...donneesAMettreAJour } = d;
    await DemandeEnergie.update(id, { ...donneesAMettreAJour, est_acceptee: true });
  }

  const energieConsommeeWh = energie_utilisee_kwh * 1000;
  const nouvelleCapacite   = Math.max(batterie.seuil_critique, batterie.capacite_actuelle - energieConsommeeWh);
  // Le modèle Batterie.js fait déjà le JSON.parse() dans findAll()
  const historiqueBatterie = Array.isArray(batterie.historique) ? batterie.historique : [];
  historiqueBatterie.push({ ts: new Date().toISOString(), valeur: nouvelleCapacite });

  const { id: batteryId, ...batteryData } = batterie;
  await Batterie.update(batteryId, { ...batteryData, capacite_actuelle: nouvelleCapacite, historique: historiqueBatterie });

  const soc    = (nouvelleCapacite / batterie.capacite_totale) * 100;
  const alertes = [];
  if (soc <= 20) alertes.push({ type: 'BATTERIE_CRITIQUE', message: `Batterie à ${soc.toFixed(1)} %` });
  if (rejetees.some(d => d.niveau_criticite === 'CRITIQUE'))
    alertes.push({ type: 'DEMANDE_CRITIQUE_REJETEE', message: 'Demande critique non satisfaite.' });

  const rapportId = await Rapport.create({
    consommation_totale: energie_utilisee_kwh * 1000, // Conversion en Wh pour cohérence avec la batterie
    batterie_debut: batterie.capacite_actuelle,
    batterie_fin: nouvelleCapacite,
    alertes
  });
  for (const d of acceptees) await Rapport.addDemande(rapportId, d.id);

  return { rapport_id: rapportId, acceptees, rejetees, utilite_totale, energie_utilisee_kwh, batterie_soc_pct: parseFloat(soc.toFixed(1)), alertes };
}

async function comparerMethodes() {
  const batteries = await Batterie.findAll();
  if (!batteries || batteries.length === 0) throw new Error('Aucune batterie configurée.');
  const batterie = batteries[0];
  const toutes   = await DemandeEnergie.findAll();
  const enAttente = toutes.filter(d => !d.est_acceptee);
  const energieWh = Math.max(0, batterie.capacite_actuelle - batterie.seuil_critique);
  return comparerAlgorithmes(enAttente, energieWh);
}

/**
 * Prévient la production solaire en utilisant l'algorithme de moyenne glissante.
 * @param {Array<number>} historique - Historique de production (kWh/jour)
 * @param {Object} options - Options pour la prévision (fenetre, ponderee)
 * @returns {Object} - Résultat de la prévision
 */
async function prevoirProductionSolaire(historique, options) {
  return prevoir(historique, options);
}

module.exports = { lancerAllocation, comparerMethodes, prevoirProductionSolaire, calculerDisponible };