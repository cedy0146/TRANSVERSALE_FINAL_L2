require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ROOT
// ==========================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur API ElectriMada'
  });
});

// ==========================================
// HEALTH
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    uptime: process.uptime()
  });
});

// ==========================================
// DÉLÉGATION VERS LE BACKEND “RÉEL”
// ==========================================
// IMPORTANT OFFLINE-FIRST:
// Ce fichier (backend/index.js) ne doit pas renvoyer de données mockées.
// On délègue donc l'ensemble des routes à backend/src/server.js,
// qui s'appuie sur MySQL (models + db pool).

require('./src/server');

// Remarque : les endpoints existants REST dans backend/src/server.js
// gardent les mêmes URL côté frontend.

// Aucun endpoint mocké n'est conservé ici.


// ==========================================
// ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {

  console.error(err);

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });

});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});