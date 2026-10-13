import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside Element Vault:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (err) {
        console.error('Error during ErrorBoundary reset:', err);
      }
    }
  };

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          id="error-boundary-fallback"
          role="alert"
          className="flex-1 h-full w-full flex flex-col items-center justify-center p-6 bg-[#1a1a1a] text-center select-none min-h-[300px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mb-3.5 shadow-lg shadow-rose-950/20">
            <AlertTriangle className="w-7 h-7 text-rose-400" />
          </div>

          <h2 className="text-sm font-bold text-white mb-1.5 tracking-wide">
            {this.props.fallbackTitle || 'Unable to display view'}
          </h2>

          <p className="text-[11px] text-[#9e9e9e] max-w-sm mb-4 font-mono leading-relaxed">
            {this.props.fallbackMessage ||
              this.state.error?.message ||
              'A rendering issue interrupted this view in After Effects.'}
          </p>

          <div className="flex items-center gap-2">
            <button
              id="error-boundary-recovery-btn"
              type="button"
              onClick={this.handleRecover}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1473E6] hover:bg-[#0d66d0] active:bg-blue-800 text-white text-xs font-semibold shadow-md shadow-blue-900/40 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Recover View</span>
            </button>

            <button
              id="error-boundary-reload-btn"
              type="button"
              onClick={this.handleReload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#252525] hover:bg-[#2e2e2e] text-[#a0a0a0] hover:text-white border border-[#383838] text-xs font-medium transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload Panel</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

