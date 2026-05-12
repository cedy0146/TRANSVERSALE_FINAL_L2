const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const Rapport = {
  create: async (data) => {
    const id = uuidv4();
    const { consommation_totale, batterie_debut, batterie_fin, alertes } = data;
    const query = 'INSERT INTO Rapport (id, consommation_totale, batterie_debut, batterie_fin, alertes) VALUES (?, ?, ?, ?, ?)';
    await db.execute(query, [id, consommation_totale, batterie_debut, batterie_fin, JSON.stringify(alertes || [])]);
    return id;
  },

  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM Rapport');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM Rapport WHERE id = ?', [id]);
    return rows[0];
  },

  // Méthode pour lier une demande à un rapport (Table Rapport_Demande)
  addDemande: async (rapportId, demandeId) => {
    const query = 'INSERT INTO Rapport_Demande (rapport_id, demande_id) VALUES (?, ?)';
    const [result] = await db.execute(query, [rapportId, demandeId]);
    return result.affectedRows > 0;
  },

  // Récupérer les demandes liées à un rapport
  getDemandes: async (rapportId) => {
    const query = `
      SELECT de.* FROM DemandeEnergie de
      JOIN Rapport_Demande rd ON de.id = rd.demande_id
      WHERE rd.rapport_id = ?
    `;
    const [rows] = await db.execute(query, [rapportId]);
    return rows;
  },

  delete: async (id) => {
    // Le ON DELETE CASCADE dans le SQL gérera automatiquement la table Rapport_Demande
    const [result] = await db.execute('DELETE FROM Rapport WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Rapport;