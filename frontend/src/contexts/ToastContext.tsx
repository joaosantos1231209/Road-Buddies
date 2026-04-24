import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BRAND } from '../lib/design';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const BG: Record<ToastType, string> = {
  success: BRAND.success ?? '#059669',
  error: BRAND.danger ?? '#dc2626',
  info: BRAND.primaryLight ?? '#1e40af',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: BG[t.type], color: 'white', padding: '12px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', maxWidth: '360px', textAlign: 'center', animation: 'fadeIn 0.2s ease' }}>
            {t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  );
}
