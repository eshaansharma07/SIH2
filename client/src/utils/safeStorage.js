/**
 * safeStorage.js
 * Defensive storage wrapper for SaakhSetu.
 * Prevents fatal unhandled exceptions (DOMException: SecurityError, QuotaExceededError)
 * in Safari Private Browsing, sandboxed web views, or restricted iframe contexts.
 */

const memoryStorage = new Map();
const sessionMemoryStorage = new Map();

export const safeStorage = {
  getItem: (key, fallback = null) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : fallback;
      }
    } catch (_) {
      if (memoryStorage.has(key)) return memoryStorage.get(key);
    }
    return fallback;
  },

  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, String(value));
        return true;
      }
    } catch (_) {
      memoryStorage.set(key, String(value));
      return true;
    }
    return false;
  },

  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (_) {
      memoryStorage.delete(key);
    }
  },

  getJSON: (key, fallback = null) => {
    try {
      const raw = safeStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (_) {
      return fallback;
    }
  },

  setJSON: (key, obj) => {
    try {
      return safeStorage.setItem(key, JSON.stringify(obj));
    } catch (_) {
      return false;
    }
  },

  // Safe wrapper for sessionStorage
  session: {
    getItem: (key, fallback = null) => {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          const val = window.sessionStorage.getItem(key);
          return val !== null ? val : fallback;
        }
      } catch (_) {
        if (sessionMemoryStorage.has(key)) return sessionMemoryStorage.get(key);
      }
      return fallback;
    },

    setItem: (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(key, String(value));
          return true;
        }
      } catch (_) {
        sessionMemoryStorage.set(key, String(value));
        return true;
      }
      return false;
    },

    removeItem: (key) => {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.removeItem(key);
        }
      } catch (_) {
        sessionMemoryStorage.delete(key);
      }
    }
  }
};
