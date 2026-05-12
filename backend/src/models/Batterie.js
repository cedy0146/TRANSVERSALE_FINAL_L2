const db = require('../db');

const Batterie = {
  /**
   * Crée une nouvelle batterie dans la base de données.
   * @param {Object} data - Les données de la batterie.
   * @param {number} data.capacite_totale - Capacité totale en Wh.
   * @param {number} data.capacite_actuelle - Capacité actuelle en Wh.
   * @param {number} data.seuil_critique - Seuil critique en Wh.
   * @param {Array<Object>} [data.historique=[]] - Historique des relevés de la batterie.
   * @returns {Promise<number>} L'ID de la batterie créée.
   */
  create: async (data) => {
    const { capacite_totale, capacite_actuelle, seuil_critique, historique = [] } = data;
    const query = 'INSERT INTO Batterie (capacite_totale, capacite_actuelle, seuil_critique, historique) VALUES (?, ?, ?, ?)';
    const [result] = await db.execute(query, [capacite_totale, capacite_actuelle, seuil_critique, JSON.stringify(historique)]);
    return result.insertId;
  },

  /**
   * Récupère toutes les batteries.
   * @returns {Promise<Array<Object>>} Une liste de batteries.
   */
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM Batterie');
    return rows.map(row => ({
      ...row,
      historique: JSON.parse(row.historique)
    }));
  },

  /**
   * Récupère une batterie par son ID.
   * @param {number} id - L'ID de la batterie.
   * @returns {Promise<Object|undefined>} La batterie trouvée ou undefined.
   */
  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM Batterie WHERE id = ?', [id]);
    if (rows.length === 0) return undefined;
    return { ...rows[0], historique: JSON.parse(rows[0].historique) };
  },

  /**
   * Met à jour une batterie.
   * @param {number} id - L'ID de la batterie à mettre à jour.
   * @param {Object} data - Les données à mettre à jour.
   * @returns {Promise<boolean>} Vrai si la mise à jour a réussi, faux sinon.
   */
  update: async (id, data) => {
    const fields = [];
    const values = [];
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        fields.push(`${key} = ?`);
        values.push(key === 'historique' ? JSON.stringify(data[key]) : data[key]);
      }
    }
    if (fields.length === 0) return false;
    const query = `UPDATE Batterie SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.execute(query, [...values, id]);
    return result.affectedRows > 0;
  },

  /**
   * Supprime une batterie par son ID.
   * @param {number} id - L'ID de la batterie à supprimer.
   * @returns {Promise<boolean>} Vrai si la suppression a réussi, faux sinon.
   */
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM Batterie WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Batterie;