const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const DemandeEnergie = {
  /**
   * Crée une nouvelle demande d'énergie.
   * @param {Object} data - Les données de la demande.
   * @param {string} data.foyer_id - L'ID du foyer demandeur.
   * @param {number} data.quantite_kwh - La quantité d'énergie demandée en kWh.
   * @param {string} data.heure_souhaitee - L'heure souhaitée pour la demande (format DATETIME).
   * @param {string} data.niveau_criticite - Le niveau de criticité (CRITIQUE, HAUTE, NORMALE, FAIBLE).
   * @param {boolean} [data.est_acceptee=false] - Indique si la demande a été acceptée.
   * @returns {Promise<string>} L'ID de la demande créée.
   */
  create: async (data) => {
    const id = uuidv4();
    const { foyer_id, quantite_kwh, heure_souhaitee, niveau_criticite, est_acceptee = false } = data;
    const query = 'INSERT INTO DemandeEnergie (id, foyer_id, quantite_kwh, heure_souhaitee, niveau_criticite, est_acceptee) VALUES (?, ?, ?, ?, ?, ?)';
    await db.execute(query, [id, foyer_id, quantite_kwh, heure_souhaitee, niveau_criticite, est_acceptee]);
    return id;
  },

  /**
   * Récupère toutes les demandes d'énergie.
   * @returns {Promise<Array<Object>>} Une liste de demandes d'énergie.
   */
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM DemandeEnergie');
    return rows;
  },

  /**
   * Récupère une demande d'énergie par son ID.
   * @param {string} id - L'ID de la demande.
   * @returns {Promise<Object|undefined>} La demande trouvée ou undefined.
   */
  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM DemandeEnergie WHERE id = ?', [id]);
    return rows[0];
  },

  /**
   * Met à jour une demande d'énergie.
   * @param {string} id - L'ID de la demande à mettre à jour.
   * @param {Object} data - Les données à mettre à jour.
   * @returns {Promise<boolean>} Vrai si la mise à jour a réussi, faux sinon.
   */
  update: async (id, data) => {
    const fields = Object.keys(data).map(key => `${key} = ?`);
    const values = Object.values(data);
    const query = `UPDATE DemandeEnergie SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.execute(query, [...values, id]);
    return result.affectedRows > 0;
  },

  /**
   * Supprime une demande d'énergie par son ID.
   * @param {string} id - L'ID de la demande à supprimer.
   * @returns {Promise<boolean>} Vrai si la suppression a réussi, faux sinon.
   */
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM DemandeEnergie WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = DemandeEnergie;