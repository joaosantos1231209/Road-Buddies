import { useState } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import { S, BRAND } from '../lib/design';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useTripsData } from '../hooks/useTripsData';
import { CitySelector } from '../components/CitySelector';
import type { TripSubscription, SubscriptionDurationType } from '../types';

const DURATION_OPTIONS: { value: SubscriptionDurationType; label: string }[] = [
  { value: '24H', label: 'Próximas 24 horas' },
  { value: '7D', label: 'Próximos 7 dias' },
  { value: '30D', label: 'Próximos 30 dias' },
  { value: 'FOREVER', label: 'Para sempre' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

function formatExpiry(sub: TripSubscription): string {
  if (sub.durationType === 'FOREVER' || !sub.expiresAt) return 'Sem expiração';
  const d = new Date(sub.expiresAt);
  return `Expira em ${d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}

interface SubscriptionFormProps {
  citiesData: any[];
  initial?: TripSubscription;
  onSubmit: (data: { originId: number; destinationId: number; durationType: SubscriptionDurationType; expiresAt?: string | null }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
}

function SubscriptionForm({ citiesData, initial, onSubmit, onCancel, isLoading, error }: SubscriptionFormProps) {
  const [originId, setOriginId] = useState(initial?.originId?.toString() || '');
  const [destinationId, setDestinationId] = useState(initial?.destinationId?.toString() || '');
  const [durationType, setDurationType] = useState<SubscriptionDurationType>(initial?.durationType || '7D');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.toISOString().slice(0, 10)}T00:00`;

  const [customDateTime, setCustomDateTime] = useState(
    initial?.expiresAt && initial.durationType === 'CUSTOM'
      ? new Date(initial.expiresAt).toISOString().slice(0, 16)
      : tomorrowStr
  );

  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!originId || !destinationId) return;
    if (durationType === 'CUSTOM') {
      if (!customDateTime) { setLocalError('Seleciona uma data e hora de expiração.'); return; }
      if (new Date(customDateTime) <= new Date()) { setLocalError('A data de expiração tem de ser no futuro.'); return; }
    }
    await onSubmit({
      originId: parseInt(originId),
      destinationId: parseInt(destinationId),
      durationType,
      expiresAt: durationType === 'CUSTOM' && customDateTime ? new Date(customDateTime).toISOString() : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={S.formGroup}>
        <label style={S.label}>Origem</label>
        <CitySelector value={originId} onChange={setOriginId} citiesData={citiesData} placeholder="Selecionar origem..." />
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>Destino</label>
        <CitySelector value={destinationId} onChange={setDestinationId} citiesData={citiesData} placeholder="Selecionar destino..." />
      </div>
      <div style={S.formGroup}>
        <label style={S.label}>Duração</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {DURATION_OPTIONS.map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: BRAND.text }}>
              <input
                type="radio"
                name="durationType"
                value={opt.value}
                checked={durationType === opt.value}
                onChange={() => setDurationType(opt.value)}
                style={{ accentColor: BRAND.primary }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
      {durationType === 'CUSTOM' && (
        <div style={S.formGroup}>
          <label style={S.label}>Data e hora de expiração</label>
          <input
            type="datetime-local"
            style={S.input}
            value={customDateTime}
            min={`${new Date().toISOString().slice(0, 10)}T00:00`}
            onChange={e => setCustomDateTime(e.target.value)}
            required
          />
        </div>
      )}
      {(localError || error) && (
        <p style={{ color: BRAND.danger, fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>{localError || error}</p>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button type="submit" style={{ ...S.submitBtn, flex: 1 }} disabled={isLoading || !originId || !destinationId}>
          {isLoading ? 'A guardar...' : initial ? 'Guardar' : 'Criar Subscrição'}
        </button>
        <button type="button" style={{ ...S.btnSecondary, flex: 1 }} onClick={onCancel} disabled={isLoading}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

interface SubscriptionCardProps {
  sub: TripSubscription;
  onEdit: (sub: TripSubscription) => void;
  onCancel: (id: number) => void;
  isCancelling: boolean;
}

function SubscriptionCard({ sub, onEdit, onCancel, isCancelling }: SubscriptionCardProps) {
  const durationLabel = DURATION_OPTIONS.find(o => o.value === sub.durationType)?.label || sub.durationType;

  return (
    <div style={{
      background: BRAND.white,
      border: `1px solid ${BRAND.border}`,
      borderRadius: '10px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      width: '100%',
    }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: BRAND.primarySurface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Bell size={18} color={BRAND.primaryLight} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: BRAND.text }}>
          {sub.origin?.name} → {sub.destination?.name}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '12px', color: BRAND.textMuted }}>
          {durationLabel} · {formatExpiry(sub)}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onEdit(sub)}
          style={{ padding: '6px 12px', background: BRAND.primarySurface, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: BRAND.primaryLight }}
        >
          Editar
        </button>
        <button
          onClick={() => onCancel(sub.id)}
          disabled={isCancelling}
          style={{ padding: '6px 12px', background: BRAND.dangerBg, border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: BRAND.danger }}
        >
          {isCancelling ? 'A cancelar...' : 'Cancelar'}
        </button>
      </div>
    </div>
  );
}

export function Subscricoes() {
  const { subscriptions, isLoading, createMutation, editMutation, cancelMutation } = useSubscriptions();
  const { citiesData } = useTripsData();

  const [showForm, setShowForm] = useState(false);
  const [editingSub, setEditingSub] = useState<TripSubscription | null>(null);
  const [formError, setFormError] = useState('');
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  type FormData = { originId: number; destinationId: number; durationType: SubscriptionDurationType; expiresAt?: string | null };

  const handleCreate = async (data: FormData) => {
    setFormError('');
    try {
      await createMutation.mutateAsync(data);
      setShowForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao criar subscrição');
    }
  };

  const handleEdit = async (data: FormData) => {
    if (!editingSub) return;
    setFormError('');
    try {
      await editMutation.mutateAsync({ id: editingSub.id, ...data });
      setEditingSub(null);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao editar subscrição');
    }
  };

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await cancelMutation.mutateAsync(id);
    } finally {
      setCancellingId(null);
    }
  };

  const openEditModal = (sub: TripSubscription) => {
    setFormError('');
    setEditingSub(sub);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setFormError('');
    setEditingSub(null);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '13px', color: BRAND.textMuted }}>
          Recebe notificações quando surgir uma oferta para o teu trajeto.
        </p>
        {!showForm && !editingSub && (
          <button
            onClick={openCreateForm}
            style={{ ...S.submitBtn, display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', width: 'fit-content' }}
          >
            <Plus size={15} /> Nova Subscrição
          </button>
        )}
      </div>

      {(showForm || editingSub) && (
        <div style={{ background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: BRAND.text }}>
              {editingSub ? 'Editar Subscrição' : 'Nova Subscrição'}
            </p>
            <button onClick={() => { setShowForm(false); setEditingSub(null); setFormError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.textMuted }}>
              <X size={16} />
            </button>
          </div>
          <SubscriptionForm
            citiesData={citiesData}
            initial={editingSub || undefined}
            onSubmit={editingSub ? handleEdit : handleCreate}
            onCancel={() => { setShowForm(false); setEditingSub(null); setFormError(''); }}
            isLoading={createMutation.isPending || editMutation.isPending}
            error={formError}
          />
        </div>
      )}

      {isLoading ? (
        <p style={{ color: BRAND.textMuted, fontSize: '13px' }}>A carregar subscrições...</p>
      ) : subscriptions.length === 0 ? (
        <div style={{ background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
          <Bell size={32} color={BRAND.border} style={{ marginBottom: '12px' }} />
          <p style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '14px', color: BRAND.text }}>Sem subscrições ativas</p>
          <p style={{ margin: 0, fontSize: '13px', color: BRAND.textMuted }}>Cria uma subscrição para seres notificado quando surgir uma oferta para o teu trajeto.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {subscriptions.map(sub => (
            <SubscriptionCard
              key={sub.id}
              sub={sub}
              onEdit={openEditModal}
              onCancel={handleCancel}
              isCancelling={cancellingId === sub.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
