let db = require('../db');
let bcrypt = require('bcryptjs');
let jwt = require('jsonwebtoken');
let { v4: uuidv4 } = require('uuid');

exports.register = async (req, res) => {
  try {
    let { username, password, role, foyer_id } = req.body;

    // Vérifier si utilisateur existe déjà
    let [existingUsers] = await db.query(
      "SELECT * FROM Utilisateur WHERE username = ?",
      [username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Nom d'utilisateur déjà utilisé."
      });
    }

    // Hash du mot de passe
    let hashedPassword = await bcrypt.hash(password, 10);

    // Génération UUID
    let id = uuidv4();

    // Insertion utilisateur
    await db.query(
      "INSERT INTO Utilisateur (id, username, password, role, foyer_id) VALUES (?, ?, ?, ?, ?)",
      [id, username, hashedPassword, role || 'VILLAGEOIS', foyer_id || null]
    );

    res.status(201).json({
      success: true,
      message: "Utilisateur créé avec succès."
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    let { username, password } = req.body;

    // Recherche utilisateur
    let [users] = await db.query(
      "SELECT * FROM Utilisateur WHERE username = ?",
      [username]
    );

    let user = users[0];

    // Vérification utilisateur
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur introuvable."
      });
    }

    let isMatch = false;

    // Vérification mot de passe
    // Supporte bcrypt ET anciens mots de passe en clair
    if (
      user.password.startsWith('$2a$') ||
      user.password.startsWith('$2b$') ||
      user.password.startsWith('$2y$')
    ) {
      // Mot de passe hashé
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Ancien mot de passe en clair
      isMatch = (password === user.password);
    }

    // Si mot de passe incorrect
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Identifiants invalides."
      });
    }

    // Génération token JWT
    let token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Réponse succès
    res.json({
      success: true,
      message: "Connexion réussie.",
      token,
      utilisateur: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};