import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

/**
 * PageErrorBoundary
 * Isolates runtime errors or dynamic import failures inside individual page tabs,
 * preventing the entire application layout (Navbar, Sidebar) from crashing.
 */
export class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`SaakhSetu Tab [${this.props.activeTab}] Error:`, error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Automatically reset error state when user switches to a different tab
    if (prevProps.activeTab !== this.props.activeTab && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-stone-800">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-[#E7DFD4] shadow-md p-6 sm:p-8 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-amber-700" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                इस अनुभाग को लोड करने में समस्या आई
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                यह अस्थायी समस्या हो सकती है। आप पुनः प्रयास कर सकते हैं या मुख्य अवलोकन पर लौट सकते हैं।
              </p>
              <p className="text-[11px] text-stone-400">
                Unable to load this section. You can retry or return to Overview.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="px-4 py-2 bg-[#0F3E2E] hover:bg-[#165640] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>पुनः प्रयास करें (Try Again)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  this.props.onResetTab?.();
                }}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200/80 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-stone-600" />
                <span>अवलोकन पर लौटें (Overview)</span>
              </button>
            </div>

            {this.state.error?.message && (
              <div className="pt-3 border-t border-stone-100 text-[11px] font-mono text-stone-400 text-left truncate">
                {this.state.error.message}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
