/**
 * ============================================================
 * ARBRE DE SEGMENT (Segment Tree) — Consommations par fenêtre
 * ============================================================
 * Objectif : Répondre en O(log n) à la question :
 *   "Combien d'énergie a été consommée entre 18h et 22h ?"
 * Complexité build : O(n), query/update : O(log n)
 * ============================================================
 */

const NB_HEURES = 24;

class SegmentTree {
  constructor(size = NB_HEURES) {
    this.n = size;
    this.tree = new Float64Array(4 * size); // tableau de sommes
  }

  /**
   * Construit l'arbre à partir d'un tableau de valeurs horaires.
   * @param {Array<number>} arr - Consommations par heure (kWh)
   */
  build(arr) {
    this._build(arr, 1, 0, this.n - 1);
  }

  _build(arr, node, start, end) {
    if (start === end) {
      this.tree[node] = arr[start] || 0;
    } else {
      const mid = Math.floor((start + end) / 2);
      this._build(arr, 2 * node, start, mid);
      this._build(arr, 2 * node + 1, mid + 1, end);
      this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
    }
  }

  /**
   * Met à jour la valeur à l'index donné.
   * @param {number} idx   - Index (heure 0-23)
   * @param {number} value - Nouvelle consommation (kWh)
   */
  update(idx, value) {
    this._update(1, 0, this.n - 1, idx, value);
  }

  _update(node, start, end, idx, value) {
    if (start === end) {
      this.tree[node] = value;
    } else {
      const mid = Math.floor((start + end) / 2);
      if (idx <= mid) this._update(2 * node, start, mid, idx, value);
      else            this._update(2 * node + 1, mid + 1, end, idx, value);
      this.tree[node] = this.tree[2 * node] + this.tree[2 * node + 1];
    }
  }

  /**
   * Somme sur l'intervalle [l, r] en O(log n).
   * @param {number} l - Heure de début (0-23)
   * @param {number} r - Heure de fin (0-23)
   * @returns {number} - Consommation totale sur la fenêtre
   */
  query(l, r) {
    if (l < 0 || r >= this.n || l > r) return 0;
    return this._query(1, 0, this.n - 1, l, r);
  }

  _query(node, start, end, l, r) {
    if (r < start || end < l) return 0;
    if (l <= start && end <= r) return this.tree[node];
    const mid = Math.floor((start + end) / 2);
    return this._query(2 * node, start, mid, l, r)
         + this._query(2 * node + 1, mid + 1, end, l, r);
  }

  /** Retourne le total sur les 24h */
  total() {
    return this.tree[1];
  }
}

/**
 * Crée un arbre de segment à partir d'un historique de demandes acceptées.
 * @param {Array} demandes - [{heure_souhaitee: Date|string, quantite_kwh: number}]
 * @returns {SegmentTree}
 */
function construireArbreConsommation(demandes) {
  const parHeure = new Array(NB_HEURES).fill(0);
  for (const d of demandes) {
    if (d.est_acceptee) {
      const heure = new Date(d.heure_souhaitee).getHours();
      if (heure >= 0 && heure < NB_HEURES) {
        parHeure[heure] += d.quantite_kwh;
      }
    }
  }
  const arbre = new SegmentTree(NB_HEURES);
  arbre.build(parHeure);
  return arbre;
}

module.exports = { SegmentTree, construireArbreConsommation, NB_HEURES };