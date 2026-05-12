const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const Utilisateur = {
  /**
   * Crée un nouvel utilisateur.
   * @param {Object} data - Les données de l'utilisateur.
   * @param {string} data.username - Nom d'utilisateur unique.
   * @param {string} data.password - Mot de passe (non haché pour le prototype).
   * @param {string} [data.role='VILLAGEOIS'] - Rôle de l'utilisateur ('RESPONSABLE', 'VILLAGEOIS').
   * @param {string} [data.foyer_id=null] - ID du foyer associé, si applicable.
   * @returns {Promise<string>} L'ID de l'utilisateur créé.
   */
  create: async (data) => {
    const id = uuidv4();
    const { username, password, role = 'VILLAGEOIS', foyer_id = null } = data;

    // Validation simple du mot de passe comme demandé (au moins 1 maj, 1 min, 1 chiffre, 1 spécial)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial, et avoir au moins 8 caractères.');
    }

    const query = 'INSERT INTO Utilisateur (id, username, password, role, foyer_id) VALUES (?, ?, ?, ?, ?)';
    await db.execute(query, [id, username, password, role, foyer_id]);
    return id;
  },

  /**
   * Récupère tous les utilisateurs.
   * @returns {Promise<Array<Object>>} Une liste d'utilisateurs.
   */
  findAll: async () => {
    const [rows] = await db.query('SELECT * FROM Utilisateur');
    return rows;
  },

  /**
   * Récupère un utilisateur par son ID.
   * @param {string} id - L'ID de l'utilisateur.
   * @returns {Promise<Object|undefined>} L'utilisateur trouvé ou undefined.
   */
  findById: async (id) => {
    const [rows] = await db.execute('SELECT * FROM Utilisateur WHERE id = ?', [id]);
    return rows[0];
  },

  /**
   * Récupère un utilisateur par son nom d'utilisateur.
   * @param {string} username - Le nom d'utilisateur.
   * @returns {Promise<Object|undefined>} L'utilisateur trouvé ou undefined.
   */
  findByUsername: async (username) => {
    const [rows] = await db.execute('SELECT * FROM Utilisateur WHERE username = ?', [username]);
    return rows[0];
  },

  /**
   * Supprime un utilisateur par son ID.
   * @param {string} id - L'ID de l'utilisateur à supprimer.
   * @returns {Promise<boolean>} Vrai si la suppression a réussi, faux sinon.
   */
  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM Utilisateur WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Utilisateur;