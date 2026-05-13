/**
 * ============================================================
 * NOUVELLES ROUTES — ElectriMada (ajouts sans casser l'existant)
 * ============================================================
 * Ajouter dans server.js : app.use('/api', newRoutes);
 * ============================================================
 */

const express  = require('express');
const router   = express.Router();
const db       = require('../db');
const logger   = require('../services/logger');
const weather  = require('../services/weatherService');
const { comparerEnTempsReel, getHistoriqueComparaisons } = require('../services/comparisonService');
const { lancerTestDeCharge } = require('../services/loadTestService');
const dijkstra = require('../algorithms/dijkstra');
const { SegmentTree, construireArbreConsommation } = require('../algorithms/segmentTree');
const { allocuerEnergie } = require('../algorithms/allocationKnapsack');

// ─────────────────────────────────────────────────────────────
// LOGS SYSTÈME
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/logs
 * Retourne les derniers logs depuis MySQL.
 */
router.get('/logs', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 500);
    const niveau = req.query.niveau || null; // INFO | WARNING | ERROR | SUCCESS
    const rows   = await logger.getLogs(limit, niveau);
    res.json({ success: true, count: rows.length, logs: rows });
  } catch (err) {
    await logger.error('GET /logs échoué', { err: err.message });
    res.status(500).json({ success: false, message: 'Erreur récupération des logs' });
  }
});

// ─────────────────────────────────────────────────────────────
// MÉTÉO / PRÉVISION SOLAIRE (Moyenne Glissante)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/meteo/prevision
 * Prévision de production solaire basée sur les 7 derniers jours.
 * Fonctionne offline (cache mémoire).
 */
router.get('/meteo/prevision', async (req, res) => {
  try {
    const fenetre  = parseInt(req.query.fenetre)  || 7;
    const ponderee = req.query.ponderee === 'true';
    const prevision = await weather.prevoir({ fenetre, ponderee });
    res.json({ success: true, ...prevision });
  } catch (err) {
    // Fallback cache si BD inaccessible
    const cache = weather.getDernierePrevisionCache();
    if (cache) {
      return res.json({ success: true, source: 'cache', ...cache });
    }
    await logger.error('GET /meteo/prevision échoué', { err: err.message });
    res.status(500).json({ success: false, message: 'Prévision indisponible' });
  }
});

/**
 * POST /api/meteo/production
 * Enregistre la production solaire du jour.
 * Body: { production_kwh: number, date_jour?: string }
 */
router.post('/meteo/production', async (req, res) => {
  try {
    const { production_kwh, date_jour } = req.body;
    if (production_kwh === undefined || production_kwh < 0) {
      return res.status(400).json({
        success: false,
        message: 'production_kwh est requis et doit être ≥ 0',
      });
    }
    await weather.enregistrerProduction(production_kwh, date_jour);
    res.status(201).json({ success: true, message: 'Production enregistrée' });
  } catch (err) {
    await logger.error('POST /meteo/production échoué', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/meteo/historique
 * Retourne l'historique de production depuis MySQL.
 */
router.get('/meteo/historique', async (req, res) => {
  try {
    const jours = Math.min(parseInt(req.query.jours) || 30, 365);
    const data  = await weather.getHistoriqueProduction(jours);
    res.json({ success: true, nb_jours: data.length, historique: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// COMPARAISON DES ALGORITHMES (données réelles MySQL)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/comparaison
 * Compare FIFO / Égalitaire / Knapsack sur les demandes en attente.
 */
router.get('/comparaison', async (req, res) => {
  try {
    const resultats = await comparerEnTempsReel();
    res.json({ success: true, ...resultats });
  } catch (err) {
    await logger.error('GET /comparaison échoué', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/comparaison/historique
 * Historique des comparaisons passées.
 */
router.get('/comparaison/historique', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const data  = await getHistoriqueComparaisons(limit);
    res.json({ success: true, count: data.length, historique: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// TEST DE CHARGE
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/test-charge
 * Lance un test de charge avec N demandes simultanées.
 * Body: { nb_demandes?: number, nb_iterations?: number }
 */
router.post('/test-charge', async (req, res) => {
  try {
    const nbDemandes   = Math.min(parseInt(req.body.nb_demandes)   || 500, 2000);
    const nbIterations = Math.min(parseInt(req.body.nb_iterations) || 10,  50);

    const resultats = await lancerTestDeCharge({ nbDemandes, nbIterations });
    res.json({ success: true, ...resultats });
  } catch (err) {
    await logger.error('POST /test-charge échoué', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DIJKSTRA RÉEL (graphe depuis MySQL)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/reseau/dijkstra
 * Calcule le chemin optimal dans le réseau électrique.
 * Query: ?start=Centrale&end=Village_C
 */
router.get('/reseau/dijkstra', async (req, res) => {
  try {
    const [nodes] = await db.execute('SELECT id, nom, type FROM noeuds_reseau');
    const [links] = await db.execute(
      `SELECT n1.nom AS source, n2.nom AS target, c.perte_energie AS weight
       FROM connexions_reseau c
       JOIN noeuds_reseau n1 ON c.source_id = n1.id
       JOIN noeuds_reseau n2 ON c.destination_id = n2.id`
    );

    if (nodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun nœud réseau configuré',
      });
    }

    // Construction du graphe à partir de MySQL
    const graph = {};
    nodes.forEach(n => { graph[n.nom] = {}; });
    links.forEach(l => { graph[l.source][l.target] = l.weight; });

    // Source et destination depuis query ou premiers/derniers nœuds
    const startNode = req.query.start || nodes[0].nom;
    const endNode   = req.query.end   || nodes[nodes.length - 1].nom;

    if (!graph[startNode] || !graph[endNode]) {
      return res.status(400).json({
        success: false,
        message: `Nœud '${!graph[startNode] ? startNode : endNode}' introuvable`,
        noeuds_disponibles: nodes.map(n => n.nom),
      });
    }

    const result = dijkstra(graph, startNode, endNode);

    await logger.info('Dijkstra exécuté', {
      start: startNode, end: endNode,
      distance: result.distance, chemin: result.path,
    });

    res.json({
      success       : true,
      depart        : startNode,
      arrivee       : endNode,
      perte_energie : result.distance,
      chemin_optimal: result.path,
      nb_noeuds     : nodes.length,
      nb_liaisons   : links.length,
      graph_visuel  : links,
    });
  } catch (err) {
    await logger.error('GET /reseau/dijkstra échoué', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/reseau/noeuds
 * Liste tous les nœuds du réseau.
 */
router.get('/reseau/noeuds', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM noeuds_reseau ORDER BY type, nom');
    res.json({ success: true, noeuds: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/reseau/noeuds
 * Ajoute un nœud au réseau.
 */
router.post('/reseau/noeuds', async (req, res) => {
  try {
    const { nom, type } = req.body;
    if (!nom) return res.status(400).json({ success: false, message: 'Le nom est requis' });
    const [result] = await db.execute(
      'INSERT INTO noeuds_reseau (nom, type) VALUES (?, ?)',
      [nom, type || 'VILLAGE']
    );
    await logger.success('Nœud réseau ajouté', { nom, type });
    res.status(201).json({ success: true, id: result.insertId, nom, type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/reseau/connexions
 * Ajoute une connexion (arête) dans le réseau.
 * Body: { source_id, destination_id, perte_energie }
 */
router.post('/reseau/connexions', async (req, res) => {
  try {
    const { source_id, destination_id, perte_energie } = req.body;
    if (!source_id || !destination_id || perte_energie === undefined) {
      return res.status(400).json({
        success: false,
        message: 'source_id, destination_id et perte_energie sont requis',
      });
    }
    const [result] = await db.execute(
      'INSERT INTO connexions_reseau (source_id, destination_id, perte_energie) VALUES (?, ?, ?)',
      [source_id, destination_id, perte_energie]
    );
    await logger.success('Connexion réseau ajoutée', { source_id, destination_id, perte_energie });
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SEGMENT TREE — Consommation par fenêtre horaire (données MySQL)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/consommation/intervalle
 * Calcule la consommation entre heure_debut et heure_fin via SegmentTree.
 * Query: ?debut=8&fin=22&date=2035-01-01
 */
router.get('/consommation/intervalle', async (req, res) => {
  try {
    const debut = parseInt(req.query.debut) || 0;
    const fin   = parseInt(req.query.fin)   || 23;
    const date  = req.query.date || new Date().toISOString().split('T')[0];

    if (debut < 0 || fin > 23 || debut > fin) {
      return res.status(400).json({
        success: false,
        message: 'debut et fin doivent être entre 0 et 23, debut ≤ fin',
      });
    }

    // Récupérer demandes acceptées du jour
    const [rows] = await db.execute(
      `SELECT heure_souhaitee, quantite_kwh
       FROM DemandeEnergie
       WHERE DATE(heure_souhaitee) = ? AND est_acceptee = 1`,
      [date]
    );

    // Construction du SegmentTree sur les 24 heures
    const parHeure = new Array(24).fill(0);
    rows.forEach(d => {
      const heure = new Date(d.heure_souhaitee).getHours();
      if (heure >= 0 && heure < 24) parHeure[heure] += d.quantite_kwh;
    });

    const arbre = new SegmentTree(24);
    arbre.build(parHeure);

    const consommation = arbre.query(debut, fin);
    const total24h     = arbre.total();

    await logger.info('SegmentTree consommation', { date, debut, fin, consommation });

    res.json({
      success             : true,
      date,
      heure_debut         : debut,
      heure_fin           : fin,
      consommation_kwh    : parseFloat(consommation.toFixed(3)),
      total_journee_kwh   : parseFloat(total24h.toFixed(3)),
      repartition_horaire : parHeure,
      algorithme          : 'SegmentTree O(log n)',
    });
  } catch (err) {
    await logger.error('GET /consommation/intervalle échoué', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ALLOCATION AVEC DIJKSTRA INTÉGRÉ
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/allocation/optimale
 * Lance l'allocation Knapsack + calcule les chemins réseau via Dijkstra.
 */
router.post('/allocation/optimale', async (req, res) => {
  try {
    // 1. Lire batterie
    const [batteries] = await db.execute(
      'SELECT id, capacite_actuelle, seuil_critique FROM Batterie ORDER BY id DESC LIMIT 1'
    );
    if (!batteries.length) {
      return res.status(400).json({ success: false, message: 'Aucune batterie configurée' });
    }
    const batterie   = batteries[0];
    const capaciteWh = batterie.capacite_actuelle * 1000;

    if (batterie.capacite_actuelle <= batterie.seuil_critique) {
      await logger.warning('Batterie en dessous du seuil critique', {
        actuelle: batterie.capacite_actuelle,
        seuil: batterie.seuil_critique,
      });
      return res.status(400).json({
        success : false,
        message : `⚠️ Batterie critique (${batterie.capacite_actuelle} kWh). Allocation suspendue.`,
        code    : 'BATTERIE_CRITIQUE',
      });
    }

    // 2. Lire demandes en attente
    const [demandes] = await db.execute(
      `SELECT id, foyer_id, quantite_kwh, niveau_criticite, heure_souhaitee
       FROM DemandeEnergie WHERE est_acceptee = 0 ORDER BY heure_souhaitee ASC`
    );

    if (demandes.length === 0) {
      return res.json({ success: true, message: 'Aucune demande en attente' });
    }

    // 3. Knapsack
    const resultat = allocuerEnergie(demandes, capaciteWh);

    // 4. Mise à jour des statuts en MySQL
    for (const d of resultat.acceptees) {
      await db.execute(
        'UPDATE DemandeEnergie SET est_acceptee = 1 WHERE id = ?',
        [d.id]
      );
    }

    // 5. Mise à jour batterie
    const energieUtiliseeKwh = resultat.energie_utilisee_kwh;
    await db.execute(
      'UPDATE Batterie SET capacite_actuelle = capacite_actuelle - ? WHERE id = ?',
      [energieUtiliseeKwh, batterie.id]
    );

    // 6. Dijkstra pour le chemin réseau (optionnel)
    let cheminReseau = null;
    try {
      const [nodes] = await db.execute('SELECT nom FROM noeuds_reseau');
      const [links] = await db.execute(
        `SELECT n1.nom AS source, n2.nom AS target, perte_energie AS weight
         FROM connexions_reseau c
         JOIN noeuds_reseau n1 ON c.source_id = n1.id
         JOIN noeuds_reseau n2 ON c.destination_id = n2.id`
      );
      if (nodes.length > 1) {
        const graph = {};
        nodes.forEach(n => { graph[n.nom] = {}; });
        links.forEach(l => { graph[l.source][l.target] = l.weight; });
        cheminReseau = dijkstra(graph, nodes[0].nom, nodes[nodes.length - 1].nom);
      }
    } catch (_) { /* Dijkstra non bloquant */ }

    await logger.success('Allocation optimale effectuée', {
      acceptees    : resultat.acceptees.length,
      rejetees     : resultat.rejetees.length,
      utilite      : resultat.utilite_totale,
      energie_kwh  : energieUtiliseeKwh,
    });

    res.json({
      success           : true,
      nb_acceptees      : resultat.acceptees.length,
      nb_rejetees       : resultat.rejetees.length,
      utilite_totale    : resultat.utilite_totale,
      energie_allouee_kwh: energieUtiliseeKwh,
      chemin_reseau     : cheminReseau,
      methode           : 'knapsack_dijkstra',
    });
  } catch (err) {
    await logger.error('POST /allocation/optimale échoué', { err: err.message });
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
