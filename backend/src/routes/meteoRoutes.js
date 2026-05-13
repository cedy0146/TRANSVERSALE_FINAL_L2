const express = require('express');
const router = express.Router();
const weatherService = require('../services/weatherService');
const db = require('../db');

/**
 * GET /api/meteo/prevision
 * Retourne la prévision solaire pour demain (WMA + Real-time sync).
 */
router.get('/prevision', async (req, res, next) => {
  try {
    const data = await weatherService.obtenirPrevision();
    res.json({
      success: true,
      ...data
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/meteo/reel
 * Synchronise les données météo en temps réel depuis OpenWeatherMap.
 */
router.get('/reel', async (req, res, next) => {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const city = process.env.WEATHER_CITY || 'Antananarivo';
    
    // Utilisation du fetch natif de Node.js 18+
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    const data = await response.json();

    if (!response.ok) throw new Error(`Erreur API Météo: ${data.message}`);

    const ensoleillement = (100 - data.clouds.all) / 100;

    // Synchronisation avec weather_history
    await db.execute(
      'INSERT INTO weather_history (date_mesure, ensoleillement_index) VALUES (CURDATE(), ?) ON DUPLICATE KEY UPDATE ensoleillement_index = ?',
      [ensoleillement, ensoleillement]
    );

    res.json({
      success: true,
      ensoleillement_index: ensoleillement,
      synced_to_db: true
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;