/**
 * @file strings.js
 * @description Système d'internationalisation simplifié pour l'application ElectriMada.
 *              Permet de gérer les textes bilingues (FR/MG) de manière centralisée.
 *              En production, ceci serait remplacé par une librairie i18n plus robuste.
 */

const translations = {
  fr: {
    home: 'Accueil',
    battery: 'Batterie',
    demands: 'Demandes',
    allocation: 'Partage',
    reports: 'Rapports',
    electrimada: 'EléctriMada ☀️',
    declare_need: 'Déclarer un besoin',
    battery_level: 'Niveau batterie',
    production_tomorrow: 'Production demain',
    demands_pending: 'Demandes en attente',
    active_alerts: 'Alertes actives',
    cancel: 'Annuler',
    validate: 'Valider',
    close: 'Fermer',
    // ... autres traductions
  },
  mg: {
    home: 'Fandraisana',
    battery: 'Bateria',
    demands: 'Fangatahana',
    allocation: 'Fizarana',
    reports: 'Tatitra',
    electrimada: 'EléctriMada ☀️',
    declare_need: 'Maneho ny filana',
    battery_level: 'Haavon\'ny bateria',
    production_tomorrow: 'Famokarana rahampitso',
    demands_pending: 'Fangatahana miandry',
    active_alerts: 'Fampitandremana mavitrika',
    cancel: 'Hanafoana',
    validate: 'Hamarina',
    close: 'Hanidy',
    // ... autres traductions
  },
};

let currentLanguage = 'fr'; // Peut être défini dynamiquement par l'utilisateur ou le système

export const setLanguage = (lang) => {
  currentLanguage = lang;
};

export const get = (key) => {
  return translations[currentLanguage][key] || key; // Retourne la clé si non trouvée
};