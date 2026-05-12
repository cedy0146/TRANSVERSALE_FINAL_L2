const Utilisateur = require('../models/Utilisateur');

const UtilisateurController = {
  getAll: async (req, res) => {
    try {
      const utilisateurs = await Utilisateur.findAll();
      res.json(utilisateurs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const utilisateur = await Utilisateur.findById(req.params.id);
      if (utilisateur) {
        res.json(utilisateur);
      } else {
        res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const success = await Utilisateur.delete(req.params.id);
      res.json({ message: success ? 'Utilisateur supprimé avec succès' : 'Utilisateur non trouvé' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = UtilisateurController;