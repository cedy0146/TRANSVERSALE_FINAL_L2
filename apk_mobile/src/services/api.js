import axios from 'axios';
import { Platform } from 'react-native';

// Web → localhost, Android emulator → 10.0.2.2, iOS simulator → localhost
const getBaseURL = () => {
  if (Platform.OS === 'web') return 'http://localhost:3000/api';
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000/api';
  return 'http://localhost:3000/api'; // iOS
};

const BASE_URL = getBaseURL();

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

export async function safeGet(path, config) {
  try { const r = await api.get(path, config); return { ok:true, data:r.data }; }
  catch(e) { return { ok:false, error:e?.message||'Network error' }; }
}
export async function safePost(path, body, config) {
  try { const r = await api.post(path, body, config); return { ok:true, data:r.data }; }
  catch(e) { return { ok:false, error:e?.message||'Network error' }; }
}
export async function safePut(path, body, config) {
  try { const r = await api.put(path, body, config); return { ok:true, data:r.data }; }
  catch(e) { return { ok:false, error:e?.message||'Network error' }; }
}
export async function safeDelete(path, config) {
  try { const r = await api.delete(path, config); return { ok:true, data:r.data }; }
  catch(e) { return { ok:false, error:e?.message||'Network error' }; }
}

export default api;
