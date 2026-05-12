const Batterie = require('../models/Batterie');

const BatterieController = {
  getAll: async (req, res) => {
    try {
      const batteries = await Batterie.findAll();
      res.json(batteries);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const batterie = await Batterie.findById(req.params.id);
      if (batterie) {
        res.json(batterie);
      } else {
        res.status(404).json({ message: 'Batterie non trouvée' });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  create: async (req, res) => {
    try {
      const id = await Batterie.create(req.body);
      res.status(201).json({ id, message: 'Batterie créée avec succès' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const success = await Batterie.update(req.params.id, req.body);
      if (success) {
        res.json({ message: 'Batterie mise à jour avec succès' });
      } else {
        res.status(404).json({ message: 'Batterie non trouvée ou aucune modification' });
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      const success = await Batterie.delete(req.params.id);
      res.json({ message: success ? 'Batterie supprimée avec succès' : 'Batterie non trouvée' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = BatterieController;