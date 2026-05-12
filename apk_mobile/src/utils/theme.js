/**
 * @file theme.js
 * @description Définit le système de design unifié pour l'application ElectriMada.
 *              Centralise les couleurs, espacements, typographies et autres constantes UI.
 *              Ceci assure l'homogénéité et la cohérence visuelle de l'application.
 */

export const THEME = {
  colors: {
    primary: '#F4A300',      // Orange solaire — action principale
    secondary: '#1A6B3C',    // Vert nature — succès, énergie
    danger: '#C0392B',       // Rouge — alerte batterie basse
    warning: '#E67E22',      // Orange foncé — avertissement
    background: '#FAFAF7',   // Blanc cassé — fond principal
    surface: '#FFFFFF',      // Blanc — cartes
    textPrimary: '#1C1C1E',  // Quasi-noir — texte principal
    textSecondary: '#6B6B6B',// Gris — texte secondaire
    border: '#E0E0DC',       // Gris clair — séparateurs
    disabled: '#BDBDBD',     // Gris — éléments inactifs
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 8, md: 12, lg: 20, pill: 50 },
  typography: {
    h1: { fontSize: 24, fontWeight: '700' },
    h2: { fontSize: 20, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 13, fontWeight: '400' },
    button: { fontSize: 17, fontWeight: '600' },
  },
  touchTarget: 48, // minimum dp — obligatoire pour accessibilité village
};