const db = require('../db');

const HealthController = {
  check: async (req, res) => {
    try {
      const [rows] = await db.query('SELECT 1 + 1 AS result');
      res.json({ status: 'OK', database: 'Connected', test: rows[0].result });
    } catch (err) {
      res.status(500).json({ status: 'Error', database: 'Disconnected', error: err.message });
    }
  }
};

module.exports = HealthController;