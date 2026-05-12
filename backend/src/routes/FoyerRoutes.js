const express = require('express');
const FoyerController = require('../controllers/FoyerController');

const router = express.Router();

// GET tous les foyers
router.get('/', FoyerController.getAll);
// GET un foyer par ID
router.get('/:id', FoyerController.getById);
// POST créer un nouveau foyer
router.post('/', FoyerController.create);
// PUT mettre à jour un foyer
router.put('/:id', FoyerController.update);
// DELETE supprimer un foyer
router.delete('/:id', FoyerController.delete);

module.exports = router;