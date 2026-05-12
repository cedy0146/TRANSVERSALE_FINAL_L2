const allocationService = require('../services/AllocationService');

const AllocationController = {
  lancer: async (req, res) => {
    try {
      const result = await allocationService.lancerAllocation();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  comparer: async (req, res) => {
    try {
      const result = await allocationService.comparerMethodes();
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  previsionSolaire: async (req, res) => {
    try {
      if (!req.body.historique) {
        return res.status(400).json({ message: "L'historique est requis pour la prévision." });
      }
      const result = await allocationService.prevoirProductionSolaire(req.body.historique, req.body.options);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = AllocationController;