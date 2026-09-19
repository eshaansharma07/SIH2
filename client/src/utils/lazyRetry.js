import { lazy } from 'react';
import { safeStorage } from './safeStorage';

/**
 * Resilient lazy loader for dynamic imports in Vite SPA.
 * Automatically recovers from:
 * 1. ChunkLoadError / "Failed to fetch dynamically imported module" after new Vercel deployments.
 * 2. Transient network disconnects or brief offline transitions.
 * 3. Cache mismatches between stale index.html and newly deployed asset hashes.
 */
export function lazyRetry(componentImport, componentName = 'Component') {
  return lazy(async () => {
    const retryKey = `saakhsetu_lazy_retry_${componentName}`;
    const hasAlreadyRetried = safeStorage.session.getItem(retryKey) === 'true';

    try {
      return await componentImport();
    } catch (firstError) {
      console.warn(`[SaakhSetu LazyRetry] Initial chunk load failed for ${componentName}:`, firstError?.message || firstError);

      // Attempt 1: Wait 400ms and retry import once before touching browser cache/reloads
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return await componentImport();
      } catch (secondError) {
        console.warn(`[SaakhSetu LazyRetry] Retry 1 failed for ${componentName}. Checking error signature...`, secondError?.message);

        const errorMsg = String(secondError?.message || secondError || '');
        const isChunkError = 
          errorMsg.includes('Failed to fetch dynamically imported module') ||
          errorMsg.includes('Loading chunk') ||
          errorMsg.includes('ChunkLoadError') ||
          errorMsg.includes('dynamically imported module') ||
          errorMsg.includes('error loading dynamically imported module') ||
          errorMsg.includes('Importing a module script failed') ||
          errorMsg.includes('Load failed') ||
          errorMsg.includes('Failed to load') ||
          errorMsg.includes('load script');

        // If chunk error and we haven't already refreshed this session:
        if (isChunkError && !hasAlreadyRetried) {
          safeStorage.session.setItem(retryKey, 'true');

          // Invalidate outdated Service Worker & precache caches to force fresh network fetch
          if (typeof window !== 'undefined' && 'caches' in window) {
            try {
              const cacheNames = await window.caches.keys();
              await Promise.all(
                cacheNames
                  .filter((name) => name.includes('workbox') || name.includes('saakhsetu') || name.includes('precache') || name.includes('html'))
                  .map((name) => window.caches.delete(name))
              );
            } catch (_) {}
          }

          // Trigger smooth page reload to grab latest deployment assets
          console.info(`[SaakhSetu LazyRetry] Refreshing page to load latest deployment assets for ${componentName}...`);
          window.location.reload();

          // Return a hanging promise so React doesn't throw and trigger error boundary while reloading
          return new Promise(() => {});
        }

        // Clean up retry flag and throw to let boundary handle if truly unrecoverable
        safeStorage.session.removeItem(retryKey);
        throw secondError;
      }
    }
  });
}
