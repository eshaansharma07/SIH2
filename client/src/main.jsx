import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update handling
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info('[SaakhSetu PWA] New version detected. Applying latest assets...');
    updateSW(true);
  },
  onOfflineReady() {
    console.info('[SaakhSetu PWA] Application precached and ready for offline use.');
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Periodically check for updates every 20 minutes in background
      setInterval(() => {
        registration.update().catch(() => {});
      }, 20 * 60 * 1000);
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
