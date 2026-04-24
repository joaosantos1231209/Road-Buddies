import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { S, BRAND } from '../lib/design';
import { useAuth } from '../contexts/AuthContext';
import { useTripsData } from '../hooks/useTripsData';
import { CitySelector } from '../components/CitySelector';
import { API_BASE_URL } from '../lib/constants';
import { getTodayDate } from '../lib/dateFormatters';
import { useToast } from '../contexts/ToastContext';

interface Props {
  onNavigate: (page: string) => void;
  isMobile: boolean;
}

export function SolicitarViatura({ onNavigate, isMobile }: Props) {
  const { dbUser, user, getToken } = useAuth() as any;
  const { citiesData } = useTripsData();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [spDate, setSpDate] = useState('');
  const [spJustification, setSpJustification] = useState('');
  const [formError, setFormError] = useState('');

  const createSpRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/sp-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao submeter solicitação');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spRequests'] });
      setOrigin('');
      setDestination('');
      setSpDate('');
      setSpJustification('');
      setFormError('');
      showToast('Solicitação enviada com sucesso!', 'success');
      onNavigate('minhas');
    },
    onError: (error: Error) => { showToast(error.message, 'error'); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!origin || !destination || !spDate) {
      setFormError('Por favor, selecione a origem, o destino e a data pretendida.');
      return;
    }
    if (origin === destination) {
      setFormError('A origem e o destino têm de ser diferentes.');
      return;
    }
    createSpRequestMutation.mutate({ originId: origin, destinationId: destination, dateNeeded: spDate, justification: spJustification });
  };

  return (
    <div style={{ width: '100%' }}>
      <form onSubmit={handleSubmit} style={S.card}>
        <div style={{ background: BRAND.primarySurface, borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
          <p style={{ margin: 0, fontWeight: '600', color: BRAND.primaryLight }}>Colaborador</p>
          <p style={{ margin: '2px 0 0', color: BRAND.textMuted }}>{dbUser?.username || 'Utilizador'} · {user?.email}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          <div style={S.formGroup}>
            <label style={S.label}>Origem</label>
            <CitySelector value={origin} onChange={setOrigin} citiesData={citiesData} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Destino</label>
            <CitySelector value={destination} onChange={setDestination} citiesData={citiesData} />
          </div>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Data Necessária</label>
          <input style={S.input} type="date" value={spDate} min={getTodayDate()} onChange={e => setSpDate(e.target.value)} required />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Justificação</label>
          <textarea style={S.textarea} value={spJustification} onChange={e => setSpJustification(e.target.value)} />
        </div>
        <button type="submit" style={S.submitBtn} disabled={createSpRequestMutation.isPending}>
          {createSpRequestMutation.isPending ? 'A enviar...' : 'Solicitar Viatura'}
        </button>
        {formError && <p style={{ color: BRAND.danger, fontSize: '13px', marginTop: '8px' }}>{formError}</p>}
      </form>
    </div>
  );
}
