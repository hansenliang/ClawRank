'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: 40, fontFamily: 'monospace', color: '#ff6b8a', background: '#0a0f0d', minHeight: '100vh' }}>
            <h1 style={{ color: '#5fffb0' }}>ClawRank — Error</h1>
            <pre style={{ marginTop: 20, color: '#80b69a', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.message || 'Something broke. Reload to try again.'}
            </pre>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
