const DemandeEnergie = require('../models/DemandeEnergie');

const DemandeEnergieController = {
  // GET toutes les demandes d'énergie
  getAll: async (req, res) => {
    try {
      const demandes = await DemandeEnergie.findAll();
      res.json(demandes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // GET une demande d'énergie par ID
  getById: async (req, res) => {
    try {
      const demande = await DemandeEnergie.findById(req.params.id);
      if (demande) {
        res.json(demande);
      } else {
        res.status(404).json({ message: "Demande d'énergie non trouvée" });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },

  // POST créer une nouvelle demande d'énergie
  create: async (req, res) => {
    try {
      const {
        foyer_id,
        quantite_kwh,
        heure_souhaitee,
        niveau_criticite,
        est_acceptee = false
      } = req.body;

      // Validation des champs obligatoires
      if (!foyer_id || !quantite_kwh || !heure_souhaitee) {
        return res.status(400).json({
          message: "Champs obligatoires manquants : foyer_id, quantite_kwh, heure_souhaitee"
        });
      }

      const id = await DemandeEnergie.create({
        foyer_id,
        quantite_kwh,
        heure_souhaitee,
        niveau_criticite,
        est_acceptee
      });

      res.status(201).json({ id, message: "Demande d'énergie créée avec succès" });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // PUT mettre à jour une demande d'énergie
  update: async (req, res) => {
    try {
      const success = await DemandeEnergie.update(req.params.id, req.body);
      if (success) {
        res.json({ message: "Demande d'énergie mise à jour avec succès" });
      } else {
        res.status(404).json({ message: "Demande d'énergie non trouvée ou aucune modification" });
      }
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  },

  // DELETE supprimer une demande d'énergie
  delete: async (req, res) => {
    try {
      const success = await DemandeEnergie.delete(req.params.id);
      res.json({
        message: success
          ? "Demande d'énergie supprimée avec succès"
          : "Demande d'énergie non trouvée"
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
};

module.exports = DemandeEnergieController;
