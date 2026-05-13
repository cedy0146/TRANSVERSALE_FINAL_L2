require('dotenv').config();

let express = require('express');
let cors = require('cors');
let helmet = require('helmet');
let morgan = require('morgan');

let db = require('./db');

let app = express();
let PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(helmet());

// ✅ CORS élargi : autorise le site web, Expo Go, et les APK buildées
app.use(cors({
  origin: '*',               // En production, remplace par ton domaine exact
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// IMPORT ALGORITHMES
// ==========================================
let dijkstra = require('./algorithms/dijkstra');
let MinHeap = require('./algorithms/heap');
let SegmentTree = require('./algorithms/segmentTree');
let knapsack = require('./algorithms/knapsack');

// ==========================================
// IMPORT MIDDLEWARES
// ==========================================
let verifyToken = require('./middlewares/auth');

// ==========================================
// IMPORT CONTROLLERS
// ==========================================
let authController = require('./controllers/authController');

// ==========================================
// IMPORT MODELS
// ==========================================
let Foyer        = require('./models/Foyer');
let Batterie     = require('./models/Batterie');
let DemandeEnergie = require('./models/DemandeEnergie');
let Utilisateur  = require('./models/Utilisateur');

// ==========================================
// IMPORT ROUTES
// ==========================================
let allocationRoutes = require('./routes/AllocationRoutes');

// ==========================================
// AUTH
// ==========================================
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// ==========================================
// ROUTES ALLOCATION
// ==========================================
app.use('/api/allocation', allocationRoutes);

// ==========================================
// BATTERIES
// ==========================================
app.get('/api/batteries', async (req, res) => {
  try {
    const rows = await Batterie.findAll();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/batteries/:id', async (req, res) => {
  try {
    const batterie = await Batterie.findById(req.params.id);
    if (!batterie) return res.status(404).json({ success: false, message: 'Batterie non trouvée' });
    res.json(batterie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/batteries', async (req, res) => {
  try {
    const { capacite_totale, capacite_actuelle, seuil_critique } = req.body;
    if (!capacite_totale || capacite_actuelle === undefined || !seuil_critique) {
      return res.status(400).json({ success: false, message: 'capacite_totale, capacite_actuelle et seuil_critique sont requis' });
    }
    const id = await Batterie.create({ capacite_totale, capacite_actuelle, seuil_critique });
    const batterie = await Batterie.findById(id);
    res.status(201).json(batterie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/batteries/:id', async (req, res) => {
  try {
    const updated = await Batterie.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Batterie non trouvée' });
    const batterie = await Batterie.findById(req.params.id);
    res.json(batterie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/batteries/:id', async (req, res) => {
  try {
    const deleted = await Batterie.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Batterie non trouvée' });
    res.json({ success: true, message: 'Batterie supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// DEMANDES
// ==========================================
app.get('/api/demandes', async (req, res) => {
  try {
    const rows = await DemandeEnergie.findAll();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/demandes/:id', async (req, res) => {
  try {
    const demande = await DemandeEnergie.findById(req.params.id);
    if (!demande) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    res.json(demande);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/demandes', async (req, res) => {
  try {
    const { foyer_id, quantite_kwh, heure_souhaitee, niveau_criticite } = req.body;
    if (!foyer_id || !quantite_kwh || !heure_souhaitee || !niveau_criticite) {
      return res.status(400).json({ success: false, message: 'foyer_id, quantite_kwh, heure_souhaitee et niveau_criticite sont requis' });
    }
    const id = await DemandeEnergie.create({ foyer_id, quantite_kwh, heure_souhaitee, niveau_criticite });
    const demande = await DemandeEnergie.findById(id);
    res.status(201).json(demande);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/demandes/:id', async (req, res) => {
  try {
    const updated = await DemandeEnergie.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    const demande = await DemandeEnergie.findById(req.params.id);
    res.json(demande);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/demandes/:id', async (req, res) => {
  try {
    const deleted = await DemandeEnergie.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    res.json({ success: true, message: 'Demande supprimée' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// FOYERS
// ==========================================
app.get('/api/foyers', async (req, res) => {
  try {
    const rows = await Foyer.findAll();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/foyers/:id', async (req, res) => {
  try {
    const foyer = await Foyer.findById(req.params.id);
    if (!foyer) return res.status(404).json({ success: false, message: 'Foyer non trouvé' });
    res.json(foyer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/foyers', async (req, res) => {
  try {
    const { nom, type_priorite, jours_sans_electricite, consommation_historique } = req.body;
    if (!nom) return res.status(400).json({ success: false, message: 'Le nom est requis' });
    const id = await Foyer.create({ nom, type_priorite, jours_sans_electricite, consommation_historique });
    const foyer = await Foyer.findById(id);
    res.status(201).json(foyer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/foyers/:id', async (req, res) => {
  try {
    const updated = await Foyer.update(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Foyer non trouvé' });
    const foyer = await Foyer.findById(req.params.id);
    res.json(foyer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/foyers/:id', async (req, res) => {
  try {
    const deleted = await Foyer.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Foyer non trouvé' });
    res.json({ success: true, message: 'Foyer supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// UTILISATEURS
// ==========================================
app.get('/api/utilisateurs', async (req, res) => {
  try {
    const rows = await Utilisateur.findAll();
    const safe = rows.map(({ password, ...u }) => u);
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/utilisateurs/:id', async (req, res) => {
  try {
    const deleted = await Utilisateur.delete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// RAPPORTS
// ==========================================
app.get('/api/rapports', async (req, res) => {
  try {
    res.json([]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ALLOCATION OPTIMISÉE
// ==========================================
app.get('/api/allocation/optimize', async (req, res) => {
  try {
    let [battery] = await db.query(`SELECT capacite_actuelle FROM Batterie LIMIT 1`);
    let capacity = battery[0]?.capacite_actuelle || 0;
    let [requests] = await db.query(`
      SELECT id, description, consommation_requise AS weight, priorite AS value
      FROM demandes_energie WHERE statut = 'en_attente'
    `);
    if (requests.length === 0) {
      return res.json({ success: true, message: 'Aucune demande', allocation: [] });
    }
    let allocation = knapsack(requests, capacity);
    res.json({ success: true, battery_capacity: capacity, allocation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// SEGMENT TREE
// ==========================================
app.get('/api/demo/segment-tree', async (req, res) => {
  try {
    let [rows] = await db.query(`SELECT valeur FROM consommation_historique ORDER BY date_heure DESC LIMIT 24`);
    let data = rows.map(r => r.valeur).reverse();
    if (data.length === 0) return res.json({ success: true, intervalSum: 0 });
    let st = new SegmentTree(data);
    let sum = st.query(0, data.length);
    res.json({ success: true, intervalSum: sum, data_points: data.length, complexity: 'O(log n)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// DIJKSTRA
// ==========================================
app.get('/api/demo/dijkstra', async (req, res) => {
  try {
    let [nodes] = await db.query(`SELECT nom FROM noeuds_reseau`);
    let [links] = await db.query(`
      SELECT n1.nom AS source, n2.nom AS target, c.distance
      FROM connexions_reseau c
      JOIN noeuds_reseau n1 ON c.source_id = n1.id
      JOIN noeuds_reseau n2 ON c.destination_id = n2.id
    `);
    let graph = {};
    nodes.forEach(n => { graph[n.nom] = {}; });
    links.forEach(l => { graph[l.source][l.target] = l.distance; });
    let startNode = req.query.start || (nodes.length > 0 ? nodes[0].nom : null);
    let endNode = req.query.end || (nodes.length > 0 ? nodes[nodes.length - 1].nom : null);
    let result = dijkstra(graph, startNode, endNode);
    res.json({ success: true, result, graph_visual: links });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// MIN HEAP
// ==========================================
app.get('/api/demo/heap', async (req, res) => {
  try {
    let [requests] = await db.query(`SELECT description, priorite FROM demandes_energie WHERE statut = 'en_attente'`);
    let heap = new MinHeap();
    requests.forEach(r => { heap.insert(r.description, r.priorite); });
    let priorities = [];
    while (!heap.isEmpty()) { priorities.push(heap.extractMin()); }
    res.json({ success: true, priorities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// COMPARAISON
// ==========================================
app.get('/api/demo/comparison', async (req, res) => {
  try {
    let results = [
      { name: 'FIFO (Baseline)', complexity: 'O(1)', satisfaction: '45%', time: '1.2ms', cuts: 12 },
      { name: 'Partage Égal', complexity: 'O(n)', satisfaction: '60%', time: '0.8ms', cuts: 8 },
      { name: 'Knapsack (Optimisé)', complexity: 'O(nW)', satisfaction: '95%', time: '4.5ms', cuts: 1, best: true },
    ];
    res.json({ success: true, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==========================================
// ROOT
// ==========================================
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur API ElectriMada', status: 'OK' });
});

// ==========================================
// HEALTH
// ==========================================
app.get('/api/health', (req, res) => {
  res.status(200).json({ uptime: process.uptime(), message: 'Server is healthy' });
});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Une erreur interne est survenue' });
});

// ==========================================
// ✅ START SERVER — écoute sur 0.0.0.0 (toutes les interfaces)
//    Indispensable pour Expo Go sur vrai téléphone et déploiement
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur http://0.0.0.0:${PORT}`);
  console.log(`   → Local :    http://localhost:${PORT}`);
  console.log(`   → Réseau :   http://192.168.1.190:${PORT}  (IP à vérifier avec ifconfig)`);
});
