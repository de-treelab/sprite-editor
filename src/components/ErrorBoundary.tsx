import { Component, ErrorInfo, ReactNode } from 'react';
import { Translation } from 'react-i18next';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Translation>
          {(t) => (
            <div className="p-8 bg-red-900 text-white min-h-screen">
              <h1 className="text-2xl font-bold">{t('error_boundary.title', 'Something went wrong.')}</h1>
              <pre className="mt-4 p-4 bg-black/50 overflow-auto text-sm">
                {this.state.error?.message}
                <br />
                {this.state.error?.stack}
              </pre>
            </div>
          )}
        </Translation>
      );
    }

    return this.props.children;
  }
}
