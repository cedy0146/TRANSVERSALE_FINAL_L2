/**
 * ============================================================
 * TESTS UNITAIRES — ElectriMada
 * Framework : Jest
 * Couvre : Knapsack, Heap, Dijkstra, SegmentTree
 * ============================================================
 */

const { allocuerEnergie, allocuerNaif, comparerAlgorithmes, MinHeap: KnapsackHeap, UTILITY_MAP } =
  require('../src/algorithms/allocationKnapsack');
const MinHeap = require('../src/algorithms/heap');
const dijkstra = require('../src/algorithms/dijkstra');
const { SegmentTree, construireArbreConsommation, NB_HEURES } = require('../src/algorithms/segmentTree');
const knapsack = require('../src/algorithms/knapsack');

// ─────────────────────────────────────────────────────────────
// HELPERS DE TEST
// ─────────────────────────────────────────────────────────────
function makeDemande(id, quantite_kwh, niveau_criticite) {
  return { id, foyer_id: 'f1', quantite_kwh, heure_souhaitee: new Date(), niveau_criticite };
}

// ─────────────────────────────────────────────────────────────
// SECTION 1 : KNAPSACK (Sac à dos — Programmation Dynamique)
// ─────────────────────────────────────────────────────────────
describe('Knapsack — allocuerEnergie', () => {

  test('KS-01 : Aucune demande → résultat vide', () => {
    const res = allocuerEnergie([], 10000);
    expect(res.acceptees).toHaveLength(0);
    expect(res.rejetees).toHaveLength(0);
    expect(res.utilite_totale).toBe(0);
    expect(res.methode).toBe('knapsack');
  });

  test('KS-02 : Capacité zéro → tout rejeté', () => {
    const demandes = [makeDemande('d1', 1.0, 'CRITIQUE'), makeDemande('d2', 0.5, 'HAUTE')];
    const res = allocuerEnergie(demandes, 0);
    expect(res.acceptees).toHaveLength(0);
    expect(res.rejetees).toHaveLength(2);
  });

  test('KS-03 : Demande CRITIQUE priorisée avant FAIBLE à capacité égale', () => {
    // 2000 Wh → 2 kWh : suffit pour une seule demande de 1.5 kWh
    const demandes = [
      makeDemande('faible', 1.5, 'FAIBLE'),
      makeDemande('critique', 1.5, 'CRITIQUE'),
    ];
    const res = allocuerEnergie(demandes, 2000);
    const ids = res.acceptees.map(d => d.id);
    expect(ids).toContain('critique');
    expect(ids).not.toContain('faible');
  });

  test('KS-04 : Toutes les demandes acceptées quand capacité suffisante', () => {
    const demandes = [
      makeDemande('d1', 1.0, 'CRITIQUE'),
      makeDemande('d2', 0.5, 'HAUTE'),
      makeDemande('d3', 0.3, 'NORMALE'),
    ];
    // 10 kWh = 10000 Wh largement suffisant
    const res = allocuerEnergie(demandes, 10000);
    expect(res.acceptees).toHaveLength(3);
    expect(res.rejetees).toHaveLength(0);
  });

  test('KS-05 : Énergie utilisée ne dépasse pas la capacité', () => {
    const demandes = Array.from({ length: 10 }, (_, i) =>
      makeDemande(`d${i}`, 0.8, ['CRITIQUE', 'HAUTE', 'NORMALE', 'FAIBLE'][i % 4])
    );
    const capaciteWh = 3000; // 3 kWh
    const res = allocuerEnergie(demandes, capaciteWh);
    const energieWh = res.energie_utilisee_kwh * 1000;
    expect(energieWh).toBeLessThanOrEqual(capaciteWh + 100); // tolérance arrondi
  });

  test('KS-06 : Utilité totale >= résultat FIFO (Knapsack optimal)', () => {
    const demandes = [
      makeDemande('d1', 1.0, 'CRITIQUE'),
      makeDemande('d2', 2.0, 'FAIBLE'),
      makeDemande('d3', 1.5, 'HAUTE'),
      makeDemande('d4', 0.5, 'NORMALE'),
    ];
    const capaciteWh = 2500;
    const opt  = allocuerEnergie(demandes, capaciteWh);
    const fifo = allocuerNaif(demandes, capaciteWh);
    expect(opt.utilite_totale).toBeGreaterThanOrEqual(fifo.utilite_totale);
  });

  test('KS-07 : Retourne le champ methode = "knapsack"', () => {
    const res = allocuerEnergie([makeDemande('d1', 1.0, 'HAUTE')], 5000);
    expect(res.methode).toBe('knapsack');
  });

  test('KS-08 : Demande unique inférieure à capacité → acceptée', () => {
    const res = allocuerEnergie([makeDemande('d1', 0.5, 'CRITIQUE')], 1000);
    expect(res.acceptees).toHaveLength(1);
    expect(res.acceptees[0].id).toBe('d1');
  });

  test('KS-09 : comparerAlgorithmes retourne les deux résultats', () => {
    const demandes = [makeDemande('d1', 1.0, 'CRITIQUE'), makeDemande('d2', 0.5, 'FAIBLE')];
    const cmp = comparerAlgorithmes(demandes, 1500);
    expect(cmp).toHaveProperty('optimise');
    expect(cmp).toHaveProperty('naif');
    expect(cmp).toHaveProperty('amelioration_utilite_pct');
    expect(cmp).toHaveProperty('gain_critiques');
  });

  test('KS-10 : UTILITY_MAP contient les 4 niveaux requis', () => {
    expect(UTILITY_MAP).toHaveProperty('CRITIQUE');
    expect(UTILITY_MAP).toHaveProperty('HAUTE');
    expect(UTILITY_MAP).toHaveProperty('NORMALE');
    expect(UTILITY_MAP).toHaveProperty('FAIBLE');
    // CRITIQUE doit valoir plus que FAIBLE
    expect(UTILITY_MAP.CRITIQUE).toBeGreaterThan(UTILITY_MAP.FAIBLE);
  });

});

// ─────────────────────────────────────────────────────────────
// SECTION 2 : MIN-HEAP (Tas Binaire)
// ─────────────────────────────────────────────────────────────
describe('MinHeap — Tas Binaire', () => {

  test('HEAP-01 : extractMin sur tas vide retourne null', () => {
    const h = new MinHeap();
    expect(h.extractMin()).toBeNull();
  });

  test('HEAP-02 : extractMin retourne toujours le minimum', () => {
    const h = new MinHeap();
    h.insert('hôpital', 1);
    h.insert('école', 3);
    h.insert('maison', 2);
    const first = h.extractMin();
    expect(first.priority).toBe(1);
    expect(first.element).toBe('hôpital');
  });

  test('HEAP-03 : Extraction ordonnée croissante', () => {
    const h = new MinHeap();
    [5, 2, 8, 1, 4].forEach((p, i) => h.insert(`item${i}`, p));
    const extracted = [];
    while (!h.isEmpty()) extracted.push(h.extractMin().priority);
    expect(extracted).toEqual([1, 2, 4, 5, 8]);
  });

  test('HEAP-04 : isEmpty vrai sur tas vide, faux après insertion', () => {
    const h = new MinHeap();
    expect(h.isEmpty()).toBe(true);
    h.insert('test', 1);
    expect(h.isEmpty()).toBe(false);
    h.extractMin();
    expect(h.isEmpty()).toBe(true);
  });

  test('HEAP-05 : peek ne retire pas l element', () => {
    const h = new MinHeap();
    h.insert('A', 10);
    h.insert('B', 5);
    const top = h.peek();
    expect(top.priority).toBe(5);
    // Toujours 2 éléments
    let count = 0;
    while (!h.isEmpty()) { h.extractMin(); count++; }
    expect(count).toBe(2);
  });

  test('HEAP-06 : Priorités égales — aucune erreur', () => {
    const h = new MinHeap();
    h.insert('A', 3);
    h.insert('B', 3);
    h.insert('C', 3);
    expect(() => { while (!h.isEmpty()) h.extractMin(); }).not.toThrow();
  });

  test('HEAP-07 : Heap de 100 éléments aléatoires reste ordonné', () => {
    const h = new MinHeap();
    const priorities = Array.from({ length: 100 }, () => Math.floor(Math.random() * 1000));
    priorities.forEach((p, i) => h.insert(`item${i}`, p));
    const extracted = [];
    while (!h.isEmpty()) extracted.push(h.extractMin().priority);
    for (let i = 1; i < extracted.length; i++) {
      expect(extracted[i]).toBeGreaterThanOrEqual(extracted[i - 1]);
    }
  });

});

// ─────────────────────────────────────────────────────────────
// SECTION 3 : DIJKSTRA (Chemin le plus court)
// ─────────────────────────────────────────────────────────────
describe('Dijkstra — Réseau électrique', () => {

  const graphSimple = {
    A: { B: 1, C: 4 },
    B: { C: 2, D: 5 },
    C: { D: 1 },
    D: {}
  };

  test('DJ-01 : Chemin optimal A → D = 4 (A→B→C→D)', () => {
    const res = dijkstra(graphSimple, 'A', 'D');
    expect(res.distance).toBe(4);
    expect(res.path).toEqual(['A', 'B', 'C', 'D']);
  });

  test('DJ-02 : Distance A → B = 1', () => {
    const res = dijkstra(graphSimple, 'A', 'B');
    expect(res.distance).toBe(1);
  });

  test('DJ-03 : Nœud inaccessible → distance Infinity', () => {
    const graph = { A: { B: 1 }, B: {}, C: {} }; // C isolé
    const res = dijkstra(graph, 'A', 'C');
    expect(res.distance).toBe(Infinity);
  });

  test('DJ-04 : Source = destination → distance 0', () => {
    const res = dijkstra(graphSimple, 'A', 'A');
    expect(res.distance).toBe(0);
  });

  test('DJ-05 : Graphe réseau village malgache — centrale vers foyer', () => {
    const graphVillage = {
      'Centrale': { 'Village_A': 5, 'Village_B': 10 },
      'Village_A': { 'Village_B': 2, 'Village_C': 8 },
      'Village_B': { 'Village_C': 1 },
      'Village_C': {}
    };
    const res = dijkstra(graphVillage, 'Centrale', 'Village_C');
    // Centrale→Village_A(5)→Village_B(2+5=7)→Village_C(1+7=8)
    expect(res.distance).toBe(8);
    expect(res.path[0]).toBe('Centrale');
    expect(res.path[res.path.length - 1]).toBe('Village_C');
  });

  test('DJ-06 : Graphe avec poids identiques', () => {
    const graph = { X: { Y: 3, Z: 3 }, Y: { Z: 3 }, Z: {} };
    const res = dijkstra(graph, 'X', 'Z');
    expect(res.distance).toBe(3);
  });

  test('DJ-07 : Le chemin retourné connecte bien source et destination', () => {
    const res = dijkstra(graphSimple, 'A', 'D');
    expect(res.path[0]).toBe('A');
    expect(res.path[res.path.length - 1]).toBe('D');
  });

});

// ─────────────────────────────────────────────────────────────
// SECTION 4 : SEGMENT TREE (Arbre de Segment)
// ─────────────────────────────────────────────────────────────
describe('SegmentTree — Consommation par plages horaires', () => {

  test('ST-01 : Build + query sur plage complète = somme totale', () => {
    const st = new SegmentTree(4);
    st.build([10, 20, 30, 40]);
    expect(st.query(0, 3)).toBeCloseTo(100, 5);
  });

  test('ST-02 : Query sur plage partielle [1, 2] = 20+30 = 50', () => {
    const st = new SegmentTree(4);
    st.build([10, 20, 30, 40]);
    expect(st.query(1, 2)).toBeCloseTo(50, 5);
  });

  test('ST-03 : Update puis re-query', () => {
    const st = new SegmentTree(4);
    st.build([10, 20, 30, 40]);
    st.update(1, 50); // 20 → 50
    expect(st.query(0, 3)).toBeCloseTo(130, 5);
  });

  test('ST-04 : total() = somme des 24 heures', () => {
    const st = new SegmentTree(NB_HEURES);
    const arr = Array.from({ length: NB_HEURES }, (_, i) => i); // 0..23
    st.build(arr);
    const somme = (NB_HEURES - 1) * NB_HEURES / 2; // = 276
    expect(st.total()).toBeCloseTo(somme, 5);
  });

  test('ST-05 : query hors plage retourne 0', () => {
    const st = new SegmentTree(4);
    st.build([5, 5, 5, 5]);
    expect(st.query(-1, 2)).toBe(0);
    expect(st.query(0, 10)).toBe(0);
  });

  test('ST-06 : construireArbreConsommation ignore les demandes rejetées', () => {
    const demandes = [
      { est_acceptee: true,  heure_souhaitee: '2035-01-01T08:00:00', quantite_kwh: 2.0 },
      { est_acceptee: false, heure_souhaitee: '2035-01-01T08:00:00', quantite_kwh: 5.0 }, // ignorée
    ];
    const arbre = construireArbreConsommation(demandes);
    // Heure 8 doit valoir 2.0, pas 7.0
    expect(arbre.query(8, 8)).toBeCloseTo(2.0, 5);
  });

  test('ST-07 : SegmentTree de taille 1', () => {
    const st = new SegmentTree(1);
    st.build([42]);
    expect(st.query(0, 0)).toBeCloseTo(42, 5);
    st.update(0, 100);
    expect(st.query(0, 0)).toBeCloseTo(100, 5);
  });

});

// ─────────────────────────────────────────────────────────────
// SECTION 5 : KNAPSACK SIMPLE (knapsack.js)
// ─────────────────────────────────────────────────────────────
describe('Knapsack simple — knapsack.js', () => {

  test('KS_S-01 : Items standard', () => {
    const items = [
      { weight: 2, value: 6 },
      { weight: 2, value: 10 },
      { weight: 3, value: 12 },
    ];
    const result = knapsack(items, 5);
    // On attend les 2 meilleurs items dans capacity=5
    expect(result.length).toBeGreaterThan(0);
    const totalWeight = result.reduce((s, i) => s + Math.round(i.weight), 0);
    expect(totalWeight).toBeLessThanOrEqual(5);
  });

  test('KS_S-02 : Capacité 0 → tableau vide', () => {
    const items = [{ weight: 1, value: 5 }];
    expect(knapsack(items, 0)).toHaveLength(0);
  });

  test('KS_S-03 : Items vides → tableau vide', () => {
    expect(knapsack([], 10)).toHaveLength(0);
  });

});
