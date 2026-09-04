import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Vyapaar Saathi UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper-100 flex flex-col items-center justify-center p-6 text-stone-800">
          <div className="max-w-md w-full bg-white rounded-3xl border-2 border-terracotta-300 shadow-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-terracotta-600" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">
              व्यापार साथी (Vyapaar Saathi)
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              पेज लोड करने में एक समस्या आई है। कृपया नीचे दिए गए बटन से पुनः लोड करें।
              <br />
              <span className="text-[11px] text-stone-400">An unexpected display error occurred. Please reload the application.</span>
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-terracotta-600 hover:bg-terracotta-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 mx-auto transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>पेज पुनः लोड करें (Reload Page)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
