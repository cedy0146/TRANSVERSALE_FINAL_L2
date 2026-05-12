const express = require('express');
const RapportController = require('../controllers/RapportController');

const router = express.Router();

// GET tous les rapports
router.get('/', RapportController.getAll);
// GET un rapport par ID
router.get('/:id', RapportController.getById);
// DELETE supprimer un rapport
router.delete('/:id', RapportController.delete);

module.exports = router;