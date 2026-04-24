import { Component, type ReactNode } from 'react';
import { BRAND, S } from '../lib/design';

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

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{ minHeight: '100vh', background: BRAND.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...S.card, maxWidth: '420px', textAlign: 'center' }}>
            <p style={{ fontSize: '18px', fontWeight: '700', color: BRAND.danger, margin: '0 0 8px' }}>Algo correu mal</p>
            <p style={{ fontSize: '13px', color: BRAND.textMuted, margin: '0 0 20px' }}>
              Ocorreu um erro inesperado. Tenta recarregar a página.
            </p>
            <button style={S.submitBtn} onClick={() => window.location.reload()}>
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
