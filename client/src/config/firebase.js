import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDMExnoqroGyq4G0ZXr63Pt6msjSO24i_E",
  authDomain: "sih2-a60bd.firebaseapp.com",
  projectId: "sih2-a60bd",
  storageBucket: "sih2-a60bd.firebasestorage.app",
  messagingSenderId: "471721936740",
  appId: "1:471721936740:web:689ff8ae790274e17edc71",
  measurementId: "G-XNSMPQ85FJ"
};

/**
 * Retrieves Firebase Web SDK credentials.
 * Checks Vite environment variables (VITE_FIREBASE_*), localStorage, window.__FIREBASE_CONFIG__, or default config.
 */
export function getFirebaseConfig() {
  let localConfig = null;
  try {
    const raw = localStorage.getItem('vyapaar_firebase_config');
    if (raw) localConfig = JSON.parse(raw);
  } catch (_) {}

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || localConfig?.apiKey || window.__FIREBASE_CONFIG__?.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig?.authDomain || window.__FIREBASE_CONFIG__?.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig?.projectId || window.__FIREBASE_CONFIG__?.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig?.storageBucket || window.__FIREBASE_CONFIG__?.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig?.messagingSenderId || window.__FIREBASE_CONFIG__?.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || localConfig?.appId || window.__FIREBASE_CONFIG__?.appId || DEFAULT_FIREBASE_CONFIG.appId,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || localConfig?.measurementId || window.__FIREBASE_CONFIG__?.measurementId || DEFAULT_FIREBASE_CONFIG.measurementId
  };
}

export function isFirebaseConfigured() {
  const cfg = getFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

let appInstance = null;
let authInstance = null;

export function getFirebaseAuth() {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!appInstance) {
    const cfg = getFirebaseConfig();
    appInstance = getApps().length > 0 ? getApp() : initializeApp(cfg);
  }
  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }
  return authInstance;
}

export function parseFirebaseSnippet(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  const trimmed = String(raw).trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {}

  // Regex extraction to support pasting JS code blocks from Firebase console
  const apiKey = trimmed.match(/apiKey\s*:\s*["']([^"']+)["']/)?.[1];
  const authDomain = trimmed.match(/authDomain\s*:\s*["']([^"']+)["']/)?.[1];
  const projectId = trimmed.match(/projectId\s*:\s*["']([^"']+)["']/)?.[1];
  const storageBucket = trimmed.match(/storageBucket\s*:\s*["']([^"']+)["']/)?.[1];
  const messagingSenderId = trimmed.match(/messagingSenderId\s*:\s*["']([^"']+)["']/)?.[1];
  const appId = trimmed.match(/appId\s*:\s*["']([^"']+)["']/)?.[1];

  if (apiKey && projectId) {
    return {
      apiKey: apiKey || '',
      authDomain: authDomain || '',
      projectId: projectId || '',
      storageBucket: storageBucket || '',
      messagingSenderId: messagingSenderId || '',
      appId: appId || ''
    };
  }
  return null;
}

export function saveFirebaseConfig(config) {
  try {
    const parsed = parseFirebaseSnippet(config);
    if (!parsed || !parsed.apiKey || !parsed.projectId) {
      return false;
    }
    localStorage.setItem('vyapaar_firebase_config', JSON.stringify(parsed));
    appInstance = null;
    authInstance = null;
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config:', e);
    return false;
  }
}

export function resetFirebaseConfig() {
  try {
    localStorage.removeItem('vyapaar_firebase_config');
    appInstance = null;
    authInstance = null;
    return true;
  } catch (e) {
    return false;
  }
}

export { RecaptchaVerifier, signInWithPhoneNumber };

