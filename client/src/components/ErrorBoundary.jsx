import React from 'react';
import { RotateCcw, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { safeStorage } from '../utils/safeStorage';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      showDetails: false,
      isClearing: false 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SaakhSetu Global UI Error:', error, errorInfo);

    // Auto-recovery for chunk load errors from new deployments
    const errorMsg = String(error?.message || '');
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

    if (isChunkError) {
      const lastAutoReload = Number(safeStorage.session.getItem('saakhsetu_auto_reload_ts') || 0);
      const now = Date.now();
      // Auto-reload at most once per 12 seconds
      if (now - lastAutoReload > 12000) {
        safeStorage.session.setItem('saakhsetu_auto_reload_ts', String(now));
        if (typeof window !== 'undefined' && 'caches' in window) {
          caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
        }
        window.location.reload();
      }
    }
  }

  handleReload = async () => {
    this.setState({ hasError: false, error: null });
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch (_) {}
    window.location.reload();
  };

  handleClearCacheAndReset = async () => {
    this.setState({ isClearing: true });
    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }

      // 2. Clear all cache storage
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }

      // 3. Clear session storage flags
      safeStorage.session.removeItem('saakhsetu_auto_reload_ts');
    } catch (e) {
      console.warn('Cache clearing notice:', e);
    } finally {
      // Hard redirect with cache-busting timestamp
      const target = window.location.origin + window.location.pathname + '?_reset=' + Date.now();
      window.location.href = target;
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'An unexpected display error occurred.';

      return (
        <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 sm:p-6 text-stone-800 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#E7DFD4] shadow-xl p-6 sm:p-7 text-center space-y-4">
            
            <div className="w-13 h-13 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-6 h-6 text-amber-700" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-serif font-black text-stone-900 tracking-tight">
                साख सेतु (Saakh Setu)
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                पेज लोड करने में एक समस्या आई है। कृपया नीचे दिए गए बटन से पुनः लोड करें।
              </p>
              <p className="text-[11px] text-stone-400">
                An unexpected display error occurred. Please reload the application.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>पेज पुनः लोड करें (Reload Page)</span>
              </button>

              <button
                type="button"
                onClick={this.handleClearCacheAndReset}
                disabled={this.state.isClearing}
                className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200/80 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${this.state.isClearing ? 'animate-spin' : ''}`} />
                <span>{this.state.isClearing ? 'साफ़ हो रहा है...' : 'कैश साफ़ करें (Clear Cache)'}</span>
              </button>
            </div>

            {/* Collapsible Technical Details */}
            <div className="pt-3 border-t border-stone-100 text-left">
              <button
                type="button"
                onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                className="flex items-center justify-between w-full text-[11px] text-stone-400 hover:text-stone-600 transition cursor-pointer"
              >
                <span>तकनीकी विवरण (Technical Details)</span>
                {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {this.state.showDetails && (
                <div className="mt-2 p-3 bg-stone-50 border border-stone-200/80 rounded-xl text-[10px] font-mono text-stone-600 break-words max-h-36 overflow-y-auto leading-relaxed">
                  <div className="font-semibold text-rose-700 mb-1">{errorMsg}</div>
                  {this.state.error?.stack && (
                    <div className="text-stone-400 whitespace-pre-wrap">{this.state.error.stack}</div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
