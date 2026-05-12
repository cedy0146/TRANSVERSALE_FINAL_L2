const express = require('express');
const UtilisateurController = require('../controllers/UtilisateurController');

const router = express.Router();

// GET tous les utilisateurs
router.get('/', UtilisateurController.getAll);
// GET un utilisateur par ID
router.get('/:id', UtilisateurController.getById);
// DELETE un utilisateur
router.delete('/:id', UtilisateurController.delete);

module.exports = router;