/**
 * ============================================================
 * ALGORITHME DU SAC À DOS (Knapsack) — Programmation Dynamique
 * ============================================================
 * Objectif : Maximiser l'utilité sociale du village
 *            sans dépasser la capacité de la batterie.
 * Complexité Temporelle : O(n * W)
 * Complexité Spatiale   : O(W) — optimisé pour téléphone bas de gamme
 * ============================================================
 */

// Utilité sociale par niveau de criticité
const UTILITY_MAP = {
  CRITIQUE: 100,   // hôpital, pompe à eau potable
  HAUTE:     60,   // éclairage pour les enfants qui étudient
  NORMALE:   30,   // charge téléphone, radio
  FAIBLE:    10    // confort, gadgets non essentiels
};

// -------------------------------------------------------
// TAS BINAIRE (Min-Heap) — File de priorité des urgences
// Extraction max-priorité en O(1), insertion en O(log n)
// -------------------------------------------------------
class MinHeap {
  constructor() { this.heap = []; }

  push(item) {
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  peek() { return this.heap[0] || null; }
  size() { return this.heap.length; }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.heap[parent].score <= this.heap[i].score) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }

  _sinkDown(i) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.heap[l].score < this.heap[smallest].score) smallest = l;
      if (r < n && this.heap[r].score < this.heap[smallest].score) smallest = r;
      if (smallest === i) break;
      [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
      i = smallest;
    }
  }
}

/**
 * Trie les demandes par priorité décroissante via Tas Binaire.
 * @param {Array} demandes
 * @returns {Array} demandes triées
 */
function trierParPriorite(demandes) {
  const heap = new MinHeap();
  demandes.forEach(d => {
    const utilite = UTILITY_MAP[d.niveau_criticite] || UTILITY_MAP.NORMALE;
    heap.push({ ...d, utilite, score: -utilite }); // score négatif = max d'abord
  });
  const sorted = [];
  while (heap.size() > 0) sorted.push(heap.pop());
  return sorted;
}

/**
 * SOLUTION OPTIMISÉE — Sac à Dos (Knapsack) par Programmation Dynamique
 *
 * @param {Array}  demandes    - [{id, foyer_id, quantite_kwh, niveau_criticite, ...}]
 * @param {number} capaciteWh - Énergie disponible en Wh (batterie + prod. solaire prévue)
 * @returns {{ acceptees, rejetees, utilite_totale, energie_utilisee_kwh, methode }}
 */
function allocuerEnergie(demandes, capaciteWh) {
  if (!demandes || demandes.length === 0 || capaciteWh <= 0) {
    return {
      acceptees: [], rejetees: demandes || [],
      utilite_totale: 0, energie_utilisee_kwh: 0, methode: 'knapsack'
    };
  }

  // Étape 1 : Tri prioritaire via Tas Binaire
  const sorted = trierParPriorite(demandes);
  const n = sorted.length;

  // Discrétisation en unités de 100 Wh pour maîtriser O(W)
  const UNITE_WH = 100;
  const W = Math.floor(capaciteWh / UNITE_WH);

  // Étape 2 : DP — tableau 1D (optimisé mémoire O(W))
  const dp = new Array(W + 1).fill(0);
  // Tableau de reconstructions (garder si demande i a été choisie pour capacité w)
  const keep = Array.from({ length: n }, () => new Uint8Array(W + 1));

  for (let i = 0; i < n; i++) {
    const poids = Math.max(1, Math.round((sorted[i].quantite_kwh * 1000) / UNITE_WH));
    const val   = sorted[i].utilite;
    for (let w = W; w >= poids; w--) {
      if (dp[w - poids] + val > dp[w]) {
        dp[w] = dp[w - poids] + val;
        keep[i][w] = 1;
      }
    }
  }

  // Étape 3 : Reconstruction de la solution optimale
  const acceptees = [], rejetees = [];
  let w = W;
  for (let i = n - 1; i >= 0; i--) {
    if (keep[i][w]) {
      acceptees.push(sorted[i]);
      w -= Math.max(1, Math.round((sorted[i].quantite_kwh * 1000) / UNITE_WH));
    } else {
      rejetees.push(sorted[i]);
    }
  }

  const energie_utilisee_kwh = acceptees.reduce((s, d) => s + d.quantite_kwh, 0);

  return {
    acceptees,
    rejetees,
    utilite_totale: dp[W],
    energie_utilisee_kwh,
    methode: 'knapsack'
  };
}

/**
 * SOLUTION NAÏVE FIFO — Baseline pour comparaison de performance
 * Sert les demandes dans l'ordre d'arrivée jusqu'à épuisement.
 *
 * @param {Array}  demandes
 * @param {number} capaciteWh
 * @returns {{ acceptees, rejetees, utilite_totale, energie_utilisee_kwh, methode }}
 */
function allocuerNaif(demandes, capaciteWh) {
  let restantKwh = capaciteWh / 1000;
  const acceptees = [], rejetees = [];

  for (const d of demandes) {
    if (restantKwh >= d.quantite_kwh) {
      acceptees.push({ ...d, utilite: UTILITY_MAP[d.niveau_criticite] || UTILITY_MAP.NORMALE });
      restantKwh -= d.quantite_kwh;
    } else {
      rejetees.push(d);
    }
  }

  return {
    acceptees,
    rejetees,
    utilite_totale: acceptees.reduce((s, d) => s + d.utilite, 0),
    energie_utilisee_kwh: capaciteWh / 1000 - restantKwh,
    methode: 'fifo_naif'
  };
}

/**
 * Compare les deux méthodes et retourne les métriques de performance.
 *
 * @param {Array}  demandes
 * @param {number} capaciteWh
 * @returns {{ optimise, naif, amelioration_utilite_pct, besoins_critiques_sauves }}
 */
function comparerAlgorithmes(demandes, capaciteWh) {
  const tStart = Date.now();
  const optimise = allocuerEnergie(demandes, capaciteWh);
  const tOpt = Date.now() - tStart;

  const tStart2 = Date.now();
  const naif = allocuerNaif(demandes, capaciteWh);
  const tNaif = Date.now() - tStart2;

  const critiquesSauves_opt  = optimise.acceptees.filter(d => d.niveau_criticite === 'CRITIQUE').length;
  const critiquesSauves_naif = naif.acceptees.filter(d => d.niveau_criticite === 'CRITIQUE').length;

  const amelioration = naif.utilite_totale > 0
    ? (((optimise.utilite_totale - naif.utilite_totale) / naif.utilite_totale) * 100).toFixed(2)
    : 0;

  return {
    optimise: { ...optimise, temps_ms: tOpt },
    naif:     { ...naif, temps_ms: tNaif },
    amelioration_utilite_pct: parseFloat(amelioration),
    critiques_sauves_optimise: critiquesSauves_opt,
    critiques_sauves_naif:     critiquesSauves_naif,
    gain_critiques: critiquesSauves_opt - critiquesSauves_naif
  };
}

module.exports = { allocuerEnergie, allocuerNaif, comparerAlgorithmes, MinHeap, UTILITY_MAP };