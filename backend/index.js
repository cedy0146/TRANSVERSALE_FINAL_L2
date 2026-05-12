require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROOT
// ==========================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur API ElectriMada'
  });
});

// ==========================================
// HEALTH
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: process.uptime()
  });
});

// ==========================================
// COMPARAISON DES ALGORITHMES
// ==========================================
app.get('/api/allocation/comparer', (req, res) => {

  const results = [
    {
      name: 'FIFO (Baseline)',
      complexity: 'O(1)',
      satisfaction: '45%',
      time: '1.2ms',
      cuts: 12
    },
    {
      name: 'Partage Égal',
      complexity: 'O(n)',
      satisfaction: '60%',
      time: '0.8ms',
      cuts: 8
    },
    {
      name: 'Knapsack (Optimisé)',
      complexity: 'O(nW)',
      satisfaction: '95%',
      time: '4.5ms',
      cuts: 1,
      best: true
    }
  ];

  res.json({
    success: true,
    results
  });

});

// ==========================================
// ALLOCATION
// ==========================================
app.post('/api/allocation/lancer', (req, res) => {

  res.json({
    success: true,
    message: 'Allocation exécutée avec succès',
    allocation: [
      {
        foyer: 'F001',
        energie: 120
      },
      {
        foyer: 'F002',
        energie: 80
      }
    ]
  });

});

// ==========================================
// DIJKSTRA DEMO
// ==========================================
app.get('/api/demo/dijkstra', (req, res) => {

  res.json({
    success: true,
    chemin: [
      'Source',
      'Noeud A',
      'Noeud B',
      'Destination'
    ],
    distance: 24
  });

});

// ==========================================
// SEGMENT TREE DEMO
// ==========================================
app.get('/api/demo/segment-tree', (req, res) => {

  res.json({
    success: true,
    intervalSum: 540,
    complexity: 'O(log n)'
  });

});

// ==========================================
// HEAP DEMO
// ==========================================
app.get('/api/demo/heap', (req, res) => {

  res.json({
    success: true,
    priorities: [
      {
        description: 'Hôpital',
        priorite: 1
      },
      {
        description: 'École',
        priorite: 2
      }
    ]
  });

});

// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });

});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});