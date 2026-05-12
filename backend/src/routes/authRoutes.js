const express = require('express');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// POST pour l'inscription (register)
router.post('/register', AuthController.register);
// POST pour la connexion (login)
router.post('/login', AuthController.login);

module.exports = router;