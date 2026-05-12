const express = require('express');
const AllocationController = require('../controllers/AllocationController');

const router = express.Router();

// Lancer allocation
router.post('/lancer', AllocationController.lancer);

// Comparer algorithmes
router.get('/comparer', AllocationController.comparer);

// Prévision solaire
router.post('/prevision-solaire', AllocationController.previsionSolaire);

module.exports = router;
