import axios from 'axios';
import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────────
//  CONFIGURATION DE L'URL DU BACKEND
//
//  EN DÉVELOPPEMENT (Expo Go sur vrai téléphone) :
//    → Remplace l'IP ci-dessous par l'IP Wi-Fi de ta machine
//    → Commande pour trouver ton IP : ifconfig | grep "inet 192"
//      Exemple : 192.168.1.190
//
//  EN PRODUCTION (APK buildée / site web déployé) :
//    → Remplace par l'URL publique de ton backend déployé
//      Exemple : https://electrimada.railway.app
// ─────────────────────────────────────────────────────────────────

// ⚙️  Mets ton IP Wi-Fi locale ici (pour le développement Expo Go)
const LOCAL_IP = '192.168.1.190';          // ← CHANGE ICI
const DEV_PORT = '3000';

// 🌐  URL publique quand le backend est déployé (Railway, Render…)
const PROD_URL = 'https://ton-backend.railway.app'; // ← CHANGE ICI en prod

// ─── Détection automatique de l'environnement ───────────────────
const isDev = __DEV__; // true avec `npx expo start`, false en build APK

const getBaseURL = () => {
  // Web (npx expo start --web) → localhost fonctionne directement
  if (Platform.OS === 'web') {
    return isDev
      ? `http://localhost:${DEV_PORT}/api`
      : `${PROD_URL}/api`;
  }

  // Android / iOS sur Expo Go (vrai téléphone) → IP Wi-Fi de la machine
  // Android / iOS en APK buildée → URL publique
  return isDev
    ? `http://${LOCAL_IP}:${DEV_PORT}/api`
    : `${PROD_URL}/api`;
};

const BASE_URL = getBaseURL();

console.log(`[API] Plateforme: ${Platform.OS} | Mode: ${isDev ? 'DEV' : 'PROD'} | URL: ${BASE_URL}`);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Intercepteur pour déboguer les erreurs réseau ──────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Pas de réponse = problème réseau (IP incorrecte, backend éteint…)
      console.error(`[API] Erreur réseau — impossible de joindre ${BASE_URL}`);
      console.error('[API] Vérifie que :');
      console.error('  1. Le backend tourne bien (node server.js)');
      console.error(`  2. L\'IP dans api.js (${LOCAL_IP}) est celle de ta machine`);
      console.error('  3. Ton téléphone et ton PC sont sur le même Wi-Fi');
    }
    return Promise.reject(error);
  }
);

export async function safeGet(path, config) {
  try {
    const r = await api.get(path, config);
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function safePost(path, body, config) {
  try {
    const r = await api.post(path, body, config);
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function safePut(path, body, config) {
  try {
    const r = await api.put(path, body, config);
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export async function safeDelete(path, config) {
  try {
    const r = await api.delete(path, config);
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, error: e?.message || 'Network error' };
  }
}

export default api;
