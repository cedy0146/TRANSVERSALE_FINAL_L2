const express = require('express');
const DemandeEnergieController = require('../controllers/DemandeEnergieController');

const router = express.Router();

// GET toutes les demandes d'énergie
router.get('/', DemandeEnergieController.getAll);
// GET une demande d'énergie par ID
router.get('/:id', DemandeEnergieController.getById);
// POST créer une nouvelle demande d'énergie
router.post('/', DemandeEnergieController.create);
// PUT mettre à jour une demande d'énergie
router.put('/:id', DemandeEnergieController.update);
// DELETE supprimer une demande d'énergie
router.delete('/:id', DemandeEnergieController.delete);

module.exports = router;