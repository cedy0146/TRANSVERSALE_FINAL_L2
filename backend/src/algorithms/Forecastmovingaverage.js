/**
 * ============================================================
 * ALGORITHME DE MOYENNE GLISSANTE — Prévision Solaire
 * ============================================================
 * Famille : Streaming / Fenêtrage (maintien d'agrégats)
 * Objectif : Estimer la production solaire de demain à partir
 *            des données des N derniers jours.
 * Complexité : O(k) par calcul, O(k) mémoire (k = fenêtre)
 * Robuste aux données manquantes (plan B automatique).
 * ============================================================
 */

const FENETRE_PAR_DEFAUT = 7; // 7 derniers jours
const PRODUCTION_DEFAUT_KWH = 5.0; // fallback si aucune donnée disponible

/**
 * Calcule la moyenne glissante sur une fenêtre de k valeurs.
 * Filtre automatiquement les valeurs nulles ou aberrantes.
 *
 * @param {Array<number>} historique - Tableau de productions passées (kWh)
 * @param {number} fenetre           - Taille de la fenêtre glissante
 * @returns {number}                 - Estimation en kWh
 */
function moyenneGlissante(historique, fenetre = FENETRE_PAR_DEFAUT) {
  if (!historique || historique.length === 0) {
    return PRODUCTION_DEFAUT_KWH;
  }

  // Ne prendre que les dernières `fenetre` valeurs
  const recentes = historique.slice(-fenetre);

  // Filtrer les valeurs invalides (null, undefined, négatives, aberrantes)
  const valides = recentes.filter(v => typeof v === 'number' && v >= 0 && v < 100);

  if (valides.length === 0) {
    return PRODUCTION_DEFAUT_KWH; // Plan B : fallback
  }

  const somme = valides.reduce((acc, val) => acc + val, 0);
  return parseFloat((somme / valides.length).toFixed(3));
}

/**
 * Prévision avancée avec pondération exponentielle.
 * Les jours récents ont plus de poids que les anciens.
 *
 * @param {Array<number>} historique
 * @param {number} fenetre
 * @returns {number} - Estimation pondérée en kWh
 */
function moyennePonderee(historique, fenetre = FENETRE_PAR_DEFAUT) {
  if (!historique || historique.length === 0) {
    return PRODUCTION_DEFAUT_KWH;
  }

  const recentes = historique.slice(-fenetre).filter(v => typeof v === 'number' && v >= 0 && v < 100);

  if (recentes.length === 0) return PRODUCTION_DEFAUT_KWH;
  if (recentes.length === 1) return recentes[0];

  // Poids croissants : les jours récents comptent davantage
  let somme = 0;
  let totalPoids = 0;
  recentes.forEach((val, idx) => {
    const poids = idx + 1; // poids = position (1, 2, 3, ..., k)
    somme += val * poids;
    totalPoids += poids;
  });

  return parseFloat((somme / totalPoids).toFixed(3));
}

/**
 * Génère une prévision complète avec intervalle de confiance.
 *
 * @param {Array<number>} historique - Historique de production (kWh/jour)
 * @param {Object} options
 * @param {number} options.fenetre     - Taille fenêtre (défaut 7)
 * @param {boolean} options.ponderee   - Utiliser moyenne pondérée (défaut false)
 * @returns {{ estimation_kwh, confiance_pct, methode, donnees_utilisees, min_kwh, max_kwh }}
 */
function prevoir(historique, options = {}) {
  const { fenetre = FENETRE_PAR_DEFAUT, ponderee = false } = options;

  if (!historique || historique.length === 0) {
    return {
      estimation_kwh: PRODUCTION_DEFAUT_KWH,
      confiance_pct: 10,
      methode: 'fallback_defaut',
      donnees_utilisees: 0,
      min_kwh: 0,
      max_kwh: PRODUCTION_DEFAUT_KWH * 2
    };
  }

  const recentes = historique.slice(-fenetre).filter(v => typeof v === 'number' && v >= 0 && v < 100);

  const estimation_kwh = ponderee
    ? moyennePonderee(historique, fenetre)
    : moyenneGlissante(historique, fenetre);

  // Calcul de l'écart-type pour évaluer la fiabilité
  const moy = recentes.length > 0
    ? recentes.reduce((s, v) => s + v, 0) / recentes.length
    : PRODUCTION_DEFAUT_KWH;

  const variance = recentes.length > 1
    ? recentes.reduce((s, v) => s + Math.pow(v - moy, 2), 0) / (recentes.length - 1)
    : moy * moy;

  const ecartType = Math.sqrt(variance);

  // Confiance inversement proportionnelle à la variabilité relative
  const cvPct = moy > 0 ? (ecartType / moy) * 100 : 100;
  const confiance_pct = Math.max(10, Math.min(95, Math.round(100 - cvPct)));

  const min_kwh = Math.max(0, parseFloat((estimation_kwh - ecartType).toFixed(3)));
  const max_kwh = parseFloat((estimation_kwh + ecartType).toFixed(3));

  return {
    estimation_kwh,
    confiance_pct,
    methode: ponderee ? 'moyenne_ponderee' : 'moyenne_glissante',
    donnees_utilisees: recentes.length,
    min_kwh,
    max_kwh,
    ecart_type: parseFloat(ecartType.toFixed(3))
  };
}

/**
 * Convertit la production estimée (kWh) en capacité batterie disponible (Wh)
 * en tenant compte du niveau actuel de la batterie.
 *
 * @param {number} estimationKwh   - Production solaire prévue (kWh)
 * @param {number} capaciteActWh   - Capacité actuelle batterie (Wh)
 * @param {number} capaciteTotWh   - Capacité totale batterie (Wh)
 * @param {number} seuilCritiqueWh - Seuil à ne pas dépasser (Wh)
 * @returns {{ disponible_wh, charge_apres_production_pct }}
 */
function calculerDisponible(estimationKwh, capaciteActWh, capaciteTotWh, seuilCritiqueWh) {
  const prodWh = estimationKwh * 1000;
  const chargeApres = Math.min(capaciteTotWh, capaciteActWh + prodWh);
  const disponible = Math.max(0, chargeApres - seuilCritiqueWh);

  return {
    disponible_wh: parseFloat(disponible.toFixed(2)),
    charge_apres_production_pct: parseFloat(((chargeApres / capaciteTotWh) * 100).toFixed(1))
  };
}

module.exports = { moyenneGlissante, moyennePonderee, prevoir, calculerDisponible, PRODUCTION_DEFAUT_KWH };