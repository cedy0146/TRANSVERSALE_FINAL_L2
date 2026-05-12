const express = require('express');
const AllocationController = require('../controllers/AllocationController');

const router = express.Router();

// POST pour lancer l'allocation d'énergie
router.post('/lancer', AllocationController.lancer);
// GET pour comparer les méthodes d'allocation
router.get('/comparer', AllocationController.comparer);
// POST pour tester la prévision solaire (utilise Forecastmovingaverage)
router.post('/prevision-solaire', AllocationController.previsionSolaire);

module.exports = router;