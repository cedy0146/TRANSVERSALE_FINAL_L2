const express = require('express');
const BatterieController = require('../controllers/BatterieController');

const router = express.Router();

// GET toutes les batteries
router.get('/', BatterieController.getAll);
// GET une batterie par ID
router.get('/:id', BatterieController.getById);
// POST créer une nouvelle batterie
router.post('/', BatterieController.create);
// PUT mettre à jour une batterie
router.put('/:id', BatterieController.update);
// DELETE supprimer une batterie
router.delete('/:id', BatterieController.delete);

module.exports = router;