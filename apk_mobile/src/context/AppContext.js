import React, { createContext, useContext, useState } from 'react';

const DARK = {
  mode:'dark',
  bgPrimary:'#080f10',bgSecondary:'#0d1a1c',bgCard:'#122226',bgHover:'#172e32',bgInput:'#0f1d20',
  border:'#1e3a3f',borderActive:'#00e5a0',
  textPrimary:'#e0f5f0',textSecondary:'#7ab5aa',textMuted:'#3d6b65',
  accentGreen:'#00e5a0',accentTeal:'#00bcd4',accentYellow:'#ffd666',accentRed:'#ff6b6b',accentPurple:'#b388ff',accentOrange:'#ffab76',
  glowGreen:'rgba(0,229,160,0.15)',glowTeal:'rgba(0,188,212,0.12)',
  tabBar:'#0a1618',tabActive:'#00e5a0',tabInactive:'#3d6b65',
  shadow:'rgba(0,0,0,0.4)',
};

const LIGHT = {
  mode:'light',
  bgPrimary:'#f0faf6',bgSecondary:'#e4f5ee',bgCard:'#ffffff',bgHover:'#f0faf6',bgInput:'#f8fffe',
  border:'#b2ddd0',borderActive:'#00a878',
  textPrimary:'#0d2e28',textSecondary:'#2e6b5e',textMuted:'#7ab5aa',
  accentGreen:'#00a878',accentTeal:'#0097a7',accentYellow:'#f59e0b',accentRed:'#dc2626',accentPurple:'#7c3aed',accentOrange:'#ea580c',
  glowGreen:'rgba(0,168,120,0.10)',glowTeal:'rgba(0,151,167,0.10)',
  tabBar:'#ffffff',tabActive:'#00a878',tabInactive:'#7ab5aa',
  shadow:'rgba(0,0,0,0.12)',
};

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState('fr');
  const theme = isDark ? DARK : LIGHT;
  return (
    <AppContext.Provider value={{ theme, isDark, toggleTheme:()=>setIsDark(v=>!v), lang, setLang, toggleLang:()=>setLang(l=>l==='fr'?'mg':'fr') }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
