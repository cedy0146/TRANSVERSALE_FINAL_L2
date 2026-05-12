const Rapport = require('../models/Rapport');

const RapportController = {
  getAll: async (req, res) => {
    try {
      const rapports = await Rapport.findAll();
      res.json(rapports);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const rapport = await Rapport.findById(req.params.id);
      if (rapport) {
        res.json(rapport);
      } else {
        res.status(404).json({ message: 'Rapport non trouvé' });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const success = await Rapport.delete(req.params.id);
      res.json({ message: success ? 'Rapport supprimé avec succès' : 'Rapport non trouvé' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = RapportController;