import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Premium dark mode glassmorphic fallback UI
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-gradient-to-br from-surface-light to-surface border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
            
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-6 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Qualcosa è andato storto</h2>
            <p className="text-white/60 text-sm mb-6">
              Si è verificato un errore imprevisto durante il rendering dell'interfaccia. Nessun dato è andato perso.
            </p>

            {this.state.error && (
              <div className="bg-black/20 border border-white/5 rounded-xl p-3 mb-6 text-left max-h-24 overflow-y-auto">
                <code className="text-xs text-red-300/80 block break-all font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 hover:border-red-500/50 text-red-200 text-sm font-semibold rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Ricarica la pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
