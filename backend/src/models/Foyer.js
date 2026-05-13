const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const Foyer = {
  /**
   * Crée un nouveau foyer dans la base de données.
   * @param {Object} data - Les données du foyer.
   * @param {string} data.nom - Le nom du foyer.
   * @param {string} [data.type_priorite='NORMALE'] - Le type de priorité du foyer.
   * @param {number} [data.jours_sans_electricite=0] - Nombre de jours sans électricité.
   * @param {Array<number>} [data.consommation_historique=[]] - Historique de consommation.
   * @returns {Promise<string>} L'ID du foyer créé.
   */
  create: async (data) => {
    const id = uuidv4();
    const { nom, type_priorite = 'NORMALE', jours_sans_electricite = 0, consommation_historique = [] } = data;
    const query = 'INSERT INTO Foyer (id, nom, type_priorite, jours_sans_electricite, consommation_historique) VALUES (?, ?, ?, ?, ?)';
    await db.execute(query, [id, nom, type_priorite, jours_sans_electricite, JSON.stringify(consommation_historique)]);
    return id;
  },

  /**
   * Récupère tous les foyers.
   * @returns {Promise<Array<Object>>} Une liste de foyers.
   */
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM Foyer');
    return rows.map(row => ({
      ...row,
      consommation_historique: JSON.parse(row.consommation_historique || '[]')
    }));
  },

  /**
   * Récupère un foyer par son ID.
   * @param {string} id - L'ID du foyer.
   * @returns {Promise<Object|undefined>} Le foyer trouvé ou undefined.
   */
  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM Foyer WHERE id = ?', [id]);
    if (rows.length === 0) return undefined;
    return { ...rows[0], consommation_historique: (() => {
  try {
    return JSON.parse(rows[0].consommation_historique || '[]');
  } catch (e) {
    return [];
  }
})() };
  },

  /**
   * Met à jour un foyer.
   * @param {string} id - L'ID du foyer à mettre à jour.
   * @param {Object} data - Les données à mettre à jour.
   * @returns {Promise<boolean>} Vrai si la mise à jour a réussi, faux sinon.
   */
  update: async (id, data) => {
    const fields = [];
    const values = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        fields.push(`${key} = ?`);
        values.push(key === 'consommation_historique' ? JSON.stringify(data[key]) : data[key]);
      }
    }
    if (fields.length === 0) return false;
    const query = `UPDATE Foyer SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.execute(query, [...values, id]);
    return result.affectedRows > 0;
  },

  /**
   * Supprime un foyer par son ID.
   * @param {string} id - L'ID du foyer à supprimer.
   * @returns {Promise<boolean>} Vrai si la suppression a réussi, faux sinon.
   */
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM Foyer WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Foyer;