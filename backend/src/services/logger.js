/**
 * ============================================================
 * SERVICE DE LOGS — ElectriMada
 * ============================================================
 * Niveaux : [INFO] [WARNING] [ERROR] [SUCCESS]
 * Les logs sont :
 *  1. Affichés en console (avec couleurs)
 *  2. Enregistrés en base MySQL (table system_logs)
 * ============================================================
 */

const db = require('../db');

// ─── Couleurs ANSI pour la console ───────────────────────────
const COLORS = {
  INFO:    '\x1b[36m', // Cyan
  WARNING: '\x1b[33m', // Jaune
  ERROR:   '\x1b[31m', // Rouge
  SUCCESS: '\x1b[32m', // Vert
  RESET:   '\x1b[0m',
};

/**
 * Formate un message de log.
 * @param {string} level   - INFO | WARNING | ERROR | SUCCESS
 * @param {string} message - Message principal
 * @param {Object} [meta]  - Données supplémentaires (optionnel)
 */
function format(level, message, meta) {
  const ts   = new Date().toISOString();
  const color = COLORS[level] || COLORS.RESET;
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `${color}[${level}]${COLORS.RESET} ${ts} — ${message}${metaStr}`;
}

/**
 * Enregistre le log en base de données MySQL.
 * Erreur silencieuse si la BD est indisponible (offline-first).
 *
 * @param {string} level
 * @param {string} message
 * @param {Object} [meta]
 */
async function persistLog(level, message, meta) {
  try {
    const metaJson = meta ? JSON.stringify(meta) : null;
    await db.execute(
      'INSERT INTO system_logs (niveau, message, meta, created_at) VALUES (?, ?, ?, NOW())',
      [level, message.substring(0, 1000), metaJson]
    );
  } catch (_err) {
    // Silencieux : ne jamais crasher à cause des logs
  }
}

/**
 * Log INFO — événements normaux (démarrage, requêtes réussies, etc.)
 */
async function info(message, meta) {
  console.log(format('INFO', message, meta));
  await persistLog('INFO', message, meta);
}

/**
 * Log WARNING — situations anormales non critiques
 * (batterie basse, donnée manquante, seuil approché, etc.)
 */
async function warning(message, meta) {
  console.warn(format('WARNING', message, meta));
  await persistLog('WARNING', message, meta);
}

/**
 * Log ERROR — erreurs nécessitant une attention (réseau, BD, validation)
 */
async function error(message, meta) {
  console.error(format('ERROR', message, meta));
  await persistLog('ERROR', message, meta);
}

/**
 * Log SUCCESS — opérations réussies importantes
 * (allocation effectuée, synchronisation terminée, etc.)
 */
async function success(message, meta) {
  console.log(format('SUCCESS', message, meta));
  await persistLog('SUCCESS', message, meta);
}

/**
 * Récupère les derniers logs depuis MySQL.
 * @param {number} [limit=50]
 * @param {string} [niveau]  - Filtre optionnel
 */
async function getLogs(limit = 50, niveau = null) {
  try {
    let query = 'SELECT * FROM system_logs';
    const params = [];
    if (niveau) {
      query += ' WHERE niveau = ?';
      params.push(niveau);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    const [rows] = await db.execute(query, params);
    return rows;
  } catch (err) {
    console.error(format('ERROR', 'getLogs échoué', { err: err.message }));
    return [];
  }
}

module.exports = { info, warning, error, success, getLogs };
