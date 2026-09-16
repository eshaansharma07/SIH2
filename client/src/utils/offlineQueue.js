import { openDB } from 'idb';

const DB_NAME = 'vyapaar_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_transactions';

let dbPromise = null;
let isSyncing = false;
let lastSyncedAt = null;
const subscribers = new Set();

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('queuedAt', 'queuedAt');
        }
      }
    });
  }
  return dbPromise;
}

export async function enqueueTransaction(tx) {
  try {
    const db = await getDb();
    const id = tx.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const record = {
      ...tx,
      id,
      queuedAt: Date.now(),
      synced: false
    };
    await db.put(STORE_NAME, record);
    notifySubscribers();
    return record;
  } catch (err) {
    console.error('[OfflineQueue] Failed to enqueue transaction:', err);
    return tx;
  }
}

export async function getPendingTransactions() {
  try {
    const db = await getDb();
    return await db.getAll(STORE_NAME);
  } catch (err) {
    console.error('[OfflineQueue] Failed to fetch pending transactions:', err);
    return [];
  }
}

export async function removeQueuedTransaction(id) {
  try {
    const db = await getDb();
    await db.delete(STORE_NAME, id);
    notifySubscribers();
  } catch (err) {
    console.error('[OfflineQueue] Failed to remove transaction:', id, err);
  }
}

export async function getPendingCount() {
  try {
    const db = await getDb();
    return await db.count(STORE_NAME);
  } catch {
    return 0;
  }
}

export async function syncPendingTransactions() {
  if (isSyncing) return { inProgress: true };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { offline: true };
  }

  isSyncing = true;
  notifySubscribers();

  try {
    const pending = await getPendingTransactions();
    if (!pending || pending.length === 0) {
      isSyncing = false;
      notifySubscribers();
      return { syncedCount: 0 };
    }

    let syncedCount = 0;

    // Try batch sync first if available
    try {
      const res = await fetch('/api/transactions/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: pending })
      });

      if (res.ok) {
        const db = await getDb();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        for (const item of pending) {
          await tx.store.delete(item.id);
        }
        await tx.done;
        syncedCount = pending.length;
      } else {
        throw new Error(`Sync endpoint status: ${res.status}`);
      }
    } catch (batchErr) {
      // Fallback: sequential sync
      console.warn('[OfflineQueue] Batch sync failed, falling back to sequential:', batchErr.message);
      for (const item of pending) {
        try {
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          if (res.ok) {
            await removeQueuedTransaction(item.id);
            syncedCount++;
          }
        } catch (itemErr) {
          console.warn('[OfflineQueue] Item replay deferred:', item.id, itemErr.message);
        }
      }
    }

    lastSyncedAt = Date.now();
    if (typeof window !== 'undefined' && syncedCount > 0) {
      window.dispatchEvent(new CustomEvent('vyapaar:sync-completed', { detail: { count: syncedCount } }));
    }
    return { syncedCount };
  } catch (err) {
    console.error('[OfflineQueue] Sync cycle encountered error:', err);
    return { error: err.message };
  } finally {
    isSyncing = false;
    notifySubscribers();
  }
}

async function notifySubscribers() {
  const count = await getPendingCount();
  const state = {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: count,
    isSyncing,
    lastSyncedAt
  };
  subscribers.forEach(cb => {
    try {
      cb(state);
    } catch (e) {
      console.error(e);
    }
  });
}

export function subscribeSyncStatus(callback) {
  subscribers.add(callback);
  // Immediate trigger with current known state
  notifySubscribers();
  return () => subscribers.delete(callback);
}

// Global connectivity and lifecycle listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Connection restored. Triggering automatic background sync...');
    notifySubscribers();
    syncPendingTransactions();
  });

  window.addEventListener('offline', () => {
    console.log('[OfflineQueue] Offline mode detected.');
    notifySubscribers();
  });

  // Check queue shortly after boot
  setTimeout(() => {
    if (navigator.onLine) {
      syncPendingTransactions();
    }
  }, 2000);
}
