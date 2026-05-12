const SegmentTree = require('../src/algorithms/segmentTree');
const MinHeap = require('../src/algorithms/heap');
const dijkstra = require('../src/algorithms/dijkstra');
const knapsack = require('../src/algorithms/knapsack');

describe('Suite de tests algorithmiques ElectriMada', () => {
  test('1. Segment Tree : Calcul de consommation sur intervalle', () => {
    const st = new SegmentTree([10, 20, 30, 40]);
    expect(st.query(1, 3)).toBe(50); // 20 + 30
  });

  test('2. Dijkstra : Chemin optimal réseau', () => {
    const graph = { A: { B: 1, C: 4 }, B: { C: 2 }, C: {} };
    const res = dijkstra(graph, 'A', 'C');
    expect(res.distance).toBe(3); // A -> B -> C
  });
});