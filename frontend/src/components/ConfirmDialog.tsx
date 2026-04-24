import { BRAND, S } from '../lib/design';

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}

export function ConfirmDialog({ message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = false }: Props) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
      onClick={onCancel}
    >
      <div
        style={{ background: BRAND.white, borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        <p style={{ margin: '0 0 20px', fontSize: '15px', color: BRAND.text, lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button style={S.btnSecondary} onClick={onCancel}>Cancelar</button>
          <button
            style={danger ? S.btnDanger : S.btnPrimary}
            onClick={() => { onConfirm(); onCancel(); }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
