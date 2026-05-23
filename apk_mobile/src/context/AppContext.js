import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Palettes ────────────────────────────────────────────────────────────────
const DARK = {
  mode: 'dark',

  // Backgrounds
  bgPrimary: '#000000ff',
  bgSecondary: '#000000ff',
  bgCard: '#131b26',
  bgHover: '#000b1bff',
  bgInput: '#000000ff',

  // Bordures
  border: '#273a4bff',
  borderActive: '#1aa090ff',

  // Texte
  textPrimary: '#e3e4e6ff',
  textSecondary: '#7993caff',
  textMuted: '#3a85f7ff',

  // Couleurs accents
  accentTeal: '#14b8a6',
  accentViolet: '#8b5cf6',
  accentOrange: '#f97316',
  accentGreen: '#2291c5ff',
  accentPink: '#ec4899',
  accentAmber: '#f59e0b',
  accentRed: '#ef4444',

  // Glows
  glowTeal: 'rgba(20,184,166,.15)',
  glowViolet: 'rgba(139,92,246,.14)',

  // UI
  tabBar: '#000000ff',
  tabActive: '#ced3d2ff',
  tabInactive: '#5682c4ff',
  shadow: 'rgba(0, 0, 0, 0.55)',

  // Animations React Native
  anim: {},

  // Motion
  motion: {
    fast: { duration: 150 },
    normal: { duration: 300 },
    slow: { duration: 600 },
  },
};

const LIGHT = {
  mode: 'light',

  bgPrimary: '#f5f9ffff',
  bgSecondary: '#ffffffff',
  bgCard: '#ffffffff',
  bgHover: '#ffffffff',
  bgInput: '#ffffffff',

  border: '#d2e6ffff',
  borderActive: '#b6d0ffff',

  textPrimary: '#021c57ff',
  textSecondary: '#370f5cff',
  textMuted: '#94a3b8',

  accentTeal: '#0b34a7ff',
  accentViolet: '#7c3aed',
  accentOrange: '#ea580c',
  accentGreen: '#0653aa',
  accentPink: '#db2777',
  accentAmber: '#d97706',
  accentRed: '#dc2626',

  glowTeal: 'rgba(13,148,136,.10)',
  glowViolet: 'rgba(124,58,237,.10)',

  tabBar: '#ffffff',
  tabActive: '#04067cff',
  tabInactive: '#2666c0d3',
  shadow: 'rgba(15,23,42,.10)',

  anim: {},

  motion: {
    fast: { duration: 150 },
    normal: { duration: 300 },
    slow: { duration: 600 },
  },
};

// ─── Context ─────────────────────────────────────────────────────────────────
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState('fr');
  const [user, setUser] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);

  const theme = isDark ? DARK : LIGHT;

  useEffect(() => {
    // Charger la session au démarrage de l'app
    const loadSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem('user_session');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (e) {
        console.error("Erreur de chargement de la session", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadSession();
  }, []);

  const login = async (userData) => {
    setUser(userData);
    await AsyncStorage.setItem('user_session', JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user_session');
    await AsyncStorage.removeItem('userToken'); // Nettoyage du token API
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        isDark,
        user,
        login,
        logout,
        isLoading,

        toggleTheme: () => setIsDark(v => !v),

        lang,
        setLang,

        toggleLang: () =>
          setLang(l => (l === 'fr' ? 'mg' : 'fr')),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error('useApp must be inside AppProvider');
  }

  return ctx;
}