import React from 'react';

type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('Widget error', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-3 text-red-300 text-sm">Widget crashed. Check console.</div>
      );
    }
    return this.props.children;
  }
}

