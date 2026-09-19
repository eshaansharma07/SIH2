import React from 'react';
import { AlertCircle, X } from 'lucide-react';

/**
 * ModalErrorBoundary
 * Catches runtime errors inside modal dialogs (Keypad, Voice, Wholesale, Tours)
 * and displays a contained recovery state, preventing the root ErrorBoundary from
 * crashing and unmounting the entire application.
 */
export class ModalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[SaakhSetu Modal Error - ${this.props.modalName || 'Dialog'}]:`, error, errorInfo);
  }

  componentDidUpdate(prevProps) {
    // Reset when modal open status toggles
    if (prevProps.isOpen !== this.props.isOpen && !this.props.isOpen) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleClose = () => {
    this.setState({ hasError: false, error: null });
    this.props.onClose?.();
  };

  render() {
    if (this.state.hasError) {
      if (!this.props.isOpen) return null;

      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-300 shadow-2xl p-5 text-center space-y-4">
            <div className="w-11 h-11 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 text-amber-700" />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base text-stone-900">
                {this.props.title || 'संवाद लोड करने में समस्या आई'}
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {this.props.message || 'इस विंडो को लोड करने में एक अस्थायी समस्या आई है। कृपया पुनः प्रयास करें।'}
              </p>
              {this.state.error?.message && (
                <p className="text-[10px] font-mono text-stone-400 bg-stone-50 p-1.5 rounded border border-stone-200 text-left truncate">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={this.handleClose}
              className="w-full py-2.5 bg-[#0F3E2E] hover:bg-[#165640] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>विंडो बंद करें (Close Window)</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ModalErrorBoundary;
