const express = require('express');
const HealthController = require('../controllers/HealthController');

const router = express.Router();

// Route de test de la base de données
// Le chemin est '/' car ce routeur sera monté sous '/api/health' dans server.js
router.get('/', HealthController.check);

module.exports = router;