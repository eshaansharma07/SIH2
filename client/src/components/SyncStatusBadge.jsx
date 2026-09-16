import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react';
import { subscribeSyncStatus, syncPendingTransactions } from '../utils/offlineQueue';
import { useTranslation } from '../i18n/LanguageContext';

export function SyncStatusBadge({ className = '', compact = false }) {
  const { language } = useTranslation();
  const [syncState, setSyncState] = useState({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncedAt: null
  });

  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setSyncState);
    return () => unsubscribe();
  }, []);

  const handleManualSync = async (e) => {
    e?.stopPropagation();
    if (syncState.isSyncing) return;
    await syncPendingTransactions();
  };

  const { isOnline, pendingCount, isSyncing } = syncState;

  // Compact indicator (for thumb dock or small headers)
  if (compact) {
    if (!isOnline) {
      return (
        <div 
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 ${className}`}
          title={language === 'hi' ? `ऑफ़लाइन मोड • ${pendingCount} लेन-देन सुरक्षित` : `Offline • ${pendingCount} queued`}
        >
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span>{pendingCount > 0 ? `${pendingCount} Queued` : (language === 'hi' ? 'ऑफ़लाइन' : 'Offline')}</span>
        </div>
      );
    }

    if (isSyncing) {
      return (
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30 animate-pulse ${className}`}>
          <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
          <span>{language === 'hi' ? 'सिंक...' : 'Syncing...'}</span>
        </div>
      );
    }

    if (pendingCount > 0) {
      return (
        <button
          onClick={handleManualSync}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-terracotta-500/20 text-terracotta-400 text-[10px] font-bold border border-terracotta-500/30 hover:bg-terracotta-500/30 transition cursor-pointer ${className}`}
          title={language === 'hi' ? 'क्लिक करके सिंक करें' : 'Click to sync'}
        >
          <CloudUpload className="w-3 h-3 text-terracotta-400" />
          <span>{pendingCount} {language === 'hi' ? 'सिंक करें' : 'Sync'}</span>
        </button>
      );
    }

    return (
      <div 
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 ${className}`}
        title={language === 'hi' ? 'ऑनलाइन • सभी डेटा सिंक है' : 'Online • All transactions synced'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="hidden sm:inline">{language === 'hi' ? 'ऑनलाइन' : 'Live'}</span>
      </div>
    );
  }

  // Full indicator (for main navbar)
  if (!isOnline) {
    return (
      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs ${className}`}>
        <WifiOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <div className="flex items-center gap-1.5">
          <span>{language === 'hi' ? 'ऑफ़लाइन' : 'Offline'}</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-mono font-black">
              {pendingCount}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold shadow-2xs ${className}`}>
        <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
        <span>{language === 'hi' ? 'डेटा सिंक हो रहा है...' : 'Syncing queue...'}</span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={handleManualSync}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-terracotta-50 border border-terracotta-200 text-terracotta-900 hover:bg-terracotta-100 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 ${className}`}
        title={language === 'hi' ? 'कतारबद्ध डेटा सर्वर पर अपलोड करें' : 'Upload queued transactions now'}
      >
        <CloudUpload className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />
        <div className="flex items-center gap-1.5">
          <span>{language === 'hi' ? 'सिंक बाकी' : 'Sync Queue'}</span>
          <span className="px-1.5 py-0.2 bg-terracotta-600 text-white rounded-full text-[10px] font-mono font-black">
            {pendingCount}
          </span>
        </div>
      </button>
    );
  }

  return (
    <div className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs font-medium ${className}`}>
      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs animate-pulse" />
      <span className="text-[11px] font-semibold">{language === 'hi' ? 'ऑनलाइन' : 'Sync OK'}</span>
    </div>
  );
}
