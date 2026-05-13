/**
 * ============================================================
 * SERVICE OFFLINE-FIRST — ElectriMada Mobile
 * ============================================================
 * Stratégie :
 *  1. Toujours lire depuis le cache local (AsyncStorage) en premier
 *  2. Synchroniser avec le backend quand internet est disponible
 *  3. Les opérations hors-ligne sont mises en file d'attente
 *     et envoyées dès que la connexion revient
 *
 * Fonctionne même sans internet :
 *  - Allocation → utilise les données locales
 *  - Historique → affichage des données cachées
 *  - Prévision  → utilise le dernier cache météo
 * ============================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { safeGet, safePost, safePut, safeDelete } from './api';

// ─── Clés de stockage ────────────────────────────────────────
const KEYS = {
  BATTERIES       : 'cache:batteries',
  DEMANDES        : 'cache:demandes',
  FOYERS          : 'cache:foyers',
  UTILISATEURS    : 'cache:utilisateurs',
  PREVISION_METEO : 'cache:prevision_meteo',
  COMPARAISON     : 'cache:comparaison',
  QUEUE           : 'offline:queue',          // file d'attente des mutations
  LAST_SYNC       : 'offline:last_sync',
};

// ─── Durée de validité du cache (ms) ─────────────────────────
const TTL = {
  BATTERIES : 5  * 60 * 1000,   // 5 min
  DEMANDES  : 2  * 60 * 1000,   // 2 min
  FOYERS    : 30 * 60 * 1000,   // 30 min
  METEO     : 60 * 60 * 1000,   // 1 heure
};

// ─────────────────────────────────────────────────────────────
// UTILITAIRES CACHE
// ─────────────────────────────────────────────────────────────

/**
 * Sauvegarde des données dans le cache local.
 * @param {string} key
 * @param {any} data
 */
async function cacheSet(key, data) {
  try {
    const entry = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(entry));
  } catch (err) {
    console.warn(`[OFFLINE] cacheSet(${key}) échoué :`, err.message);
  }
}

/**
 * Récupère les données du cache local.
 * Retourne null si le cache est expiré ou absent.
 *
 * @param {string} key
 * @param {number} [ttl] - Durée de validité en ms (0 = infini)
 * @returns {Promise<any|null>}
 */
async function cacheGet(key, ttl = 0) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (ttl > 0 && Date.now() - entry.timestamp > ttl) return null; // expiré
    return entry.data;
  } catch (_) {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// FILE D'ATTENTE OFFLINE (mutations en attente de sync)
// ─────────────────────────────────────────────────────────────

/**
 * Ajoute une mutation (POST/PUT/DELETE) à la file d'attente offline.
 * @param {Object} operation - { method, path, body }
 */
async function enqueueOperation(operation) {
  try {
    const raw   = await AsyncStorage.getItem(KEYS.QUEUE);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ ...operation, id: Date.now(), timestamp: new Date().toISOString() });
    await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(queue));
    console.log(`[OFFLINE] Opération mise en file : ${operation.method} ${operation.path}`);
  } catch (err) {
    console.warn('[OFFLINE] enqueueOperation échoué :', err.message);
  }
}

/**
 * Synchronise la file d'attente quand internet revient.
 * Chaque opération réussie est retirée de la file.
 */
async function syncQueue() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.QUEUE);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (queue.length === 0) return;

    console.log(`[OFFLINE] Synchronisation de ${queue.length} opération(s) en attente`);
    const restantes = [];

    for (const op of queue) {
      let result;
      switch (op.method) {
        case 'POST':   result = await safePost(op.path, op.body);   break;
        case 'PUT':    result = await safePut(op.path, op.body);    break;
        case 'DELETE': result = await safeDelete(op.path);          break;
        default:       result = { ok: false };
      }
      if (!result.ok) {
        restantes.push(op); // réessayer plus tard
        console.warn(`[OFFLINE] Sync échoué pour op ${op.id}`);
      } else {
        console.log(`[OFFLINE] Sync réussi pour op ${op.id} (${op.method} ${op.path})`);
      }
    }

    await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(restantes));
    await AsyncStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.error('[OFFLINE] syncQueue échoué :', err.message);
  }
}

// ─────────────────────────────────────────────────────────────
// API OFFLINE-FIRST POUR CHAQUE ENTITÉ
// ─────────────────────────────────────────────────────────────

/**
 * Récupère les batteries.
 * Online  : serveur + mise à jour cache
 * Offline : cache local
 */
async function getBatteries() {
  const { isConnected } = await NetInfo.fetch();
  if (isConnected) {
    const res = await safeGet('/batteries');
    if (res.ok) {
      await cacheSet(KEYS.BATTERIES, res.data);
      return { data: res.data, source: 'network' };
    }
  }
  // Fallback cache
  const cached = await cacheGet(KEYS.BATTERIES);
  return { data: cached || [], source: 'cache' };
}

/**
 * Récupère les demandes d'énergie.
 */
async function getDemandes() {
  const { isConnected } = await NetInfo.fetch();
  if (isConnected) {
    const res = await safeGet('/demandes');
    if (res.ok) {
      await cacheSet(KEYS.DEMANDES, res.data);
      return { data: res.data, source: 'network' };
    }
  }
  const cached = await cacheGet(KEYS.DEMANDES);
  return { data: cached || [], source: 'cache' };
}

/**
 * Crée une demande d'énergie.
 * Offline : mise en file d'attente + sauvegarde locale optimiste
 */
async function creerDemande(demande) {
  const { isConnected } = await NetInfo.fetch();
  if (isConnected) {
    const res = await safePost('/demandes', demande);
    if (res.ok) {
      // Rafraîchir cache
      await getDemandes();
      return { ok: true, data: res.data, source: 'network' };
    }
  }
  // Mode offline : enregistrement local optimiste
  await enqueueOperation({ method: 'POST', path: '/demandes', body: demande });
  // Ajout local immédiat dans le cache
  const cached = (await cacheGet(KEYS.DEMANDES)) || [];
  const localDemande = {
    ...demande,
    id          : `local_${Date.now()}`,
    est_acceptee: 0,
    _pending    : true, // marqueur offline
  };
  cached.push(localDemande);
  await cacheSet(KEYS.DEMANDES, cached);
  return { ok: true, data: localDemande, source: 'offline' };
}

/**
 * Récupère les foyers.
 */
async function getFoyers() {
  const { isConnected } = await NetInfo.fetch();
  if (isConnected) {
    const res = await safeGet('/foyers');
    if (res.ok) {
      await cacheSet(KEYS.FOYERS, res.data);
      return { data: res.data, source: 'network' };
    }
  }
  const cached = await cacheGet(KEYS.FOYERS);
  return { data: cached || [], source: 'cache' };
}

/**
 * Récupère la prévision météo/solaire.
 * Fonctionne toujours offline (cache longue durée).
 */
async function getPrevisionMeteo() {
  const { isConnected } = await NetInfo.fetch();
  if (isConnected) {
    const res = await safeGet('/meteo/prevision');
    if (res.ok) {
      await cacheSet(KEYS.PREVISION_METEO, res.data);
      return { data: res.data, source: 'network' };
    }
  }
  // Cache valide 1h
  const cached = await cacheGet(KEYS.PREVISION_METEO, TTL.METEO);
  if (cached) return { data: cached, source: 'cache' };

  // Valeur de repli minimale si aucune donnée
  return {
    data: {
      estimation_kwh : 5.0,
      confiance_pct  : 0,
      methode        : 'repli_par_defaut',
      offline        : true,
    },
    source: 'default',
  };
}

/**
 * Récupère la dernière comparaison d'algorithmes.
 */
async function getComparaison() {
  const { isConnected } = await NetInfo.fetch();
  if (isConnected) {
    const res = await safeGet('/comparaison');
    if (res.ok) {
      await cacheSet(KEYS.COMPARAISON, res.data);
      return { data: res.data, source: 'network' };
    }
  }
  const cached = await cacheGet(KEYS.COMPARAISON);
  return { data: cached || null, source: 'cache' };
}

/**
 * Démarre l'écouteur de connectivité.
 * Déclenche une synchronisation automatique quand internet revient.
 */
function demarrerEcouteurConnexion() {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      console.log('[OFFLINE] Connexion rétablie — synchronisation en cours...');
      syncQueue().catch(err => console.error('[OFFLINE] Sync auto échoué :', err.message));
    }
  });
  return unsubscribe; // appeler pour arrêter l'écouteur
}

/**
 * Retourne le statut offline et la dernière synchronisation.
 */
async function getStatutSync() {
  const { isConnected } = await NetInfo.fetch();
  const raw   = await AsyncStorage.getItem(KEYS.QUEUE);
  const queue = raw ? JSON.parse(raw) : [];
  const lastSync = await AsyncStorage.getItem(KEYS.LAST_SYNC);
  return {
    en_ligne          : isConnected,
    operations_en_attente: queue.length,
    derniere_sync     : lastSync,
  };
}

export default {
  getBatteries,
  getDemandes,
  creerDemande,
  getFoyers,
  getPrevisionMeteo,
  getComparaison,
  syncQueue,
  demarrerEcouteurConnexion,
  getStatutSync,
};
