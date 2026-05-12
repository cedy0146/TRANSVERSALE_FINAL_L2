const Utilisateur = require('../models/Utilisateur');

const AuthController = {
  register: async (req, res) => {
    try {
      const id = await Utilisateur.create(req.body);
      res.status(201).json({ id, message: 'Utilisateur créé avec succès' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  login: async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Nom d\'utilisateur et mot de passe sont requis.' });
    }

    try {
      const utilisateur = await Utilisateur.findByUsername(username);

      if (!utilisateur) {
        return res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
      }

      // Comparaison en clair pour le prototype
      if (utilisateur.password === password) {
        res.json({ 
          message: 'Connexion réussie', 
          utilisateur: { 
            id: utilisateur.id, 
            username: utilisateur.username, 
            role: utilisateur.role, 
            foyer_id: utilisateur.foyer_id 
          } 
        });
      } else {
        res.status(401).json({ message: 'Nom d\'utilisateur ou mot de passe incorrect.' });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = AuthController;