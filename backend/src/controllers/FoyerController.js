const Foyer = require('../models/Foyer');

const FoyerController = {
  getAll: async (req, res) => {
    try {
      const foyers = await Foyer.findAll();
      res.json(foyers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      const foyer = await Foyer.findById(req.params.id);
      if (foyer) {
        res.json(foyer);
      } else {
        res.status(404).json({ message: 'Foyer non trouvé' });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  create: async (req, res) => {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Le corps de la requête est vide." });
      }
      const data = req.body.data ? req.body.data : req.body;
      const id = await Foyer.create(data);
      res.status(201).json({ id, message: 'Foyer créé avec succès' });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  update: async (req, res) => {
    try {
      const data = req.body.data ? req.body.data : req.body;
      const success = await Foyer.update(req.params.id, data);
      if (success) {
        res.json({ message: 'Foyer mis à jour avec succès' });
      } else {
        res.status(404).json({ message: 'Foyer non trouvé' });
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  delete: async (req, res) => {
    const success = await Foyer.delete(req.params.id);
    res.json({ message: success ? 'Foyer supprimé' : 'Foyer non trouvé' });
  }
};

module.exports = FoyerController;