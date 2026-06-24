import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { S, BRAND } from '../lib/design';
import { useAuth } from '../contexts/AuthContext';
import { useTripsData } from '../hooks/useTripsData';
import { CitySelector } from '../components/CitySelector';
import { API_BASE_URL } from '../lib/constants';
import { getTodayDatetimeLocal } from '../lib/dateFormatters';
import { getVehicleObj } from '../lib/tripFormatters';

interface Props {
  onNavigate: (page: string) => void;
  isMobile: boolean;
}

export function CriarViagem({ onNavigate, isMobile }: Props) {
  const { dbUser, getToken } = useAuth() as any;
  const { citiesData } = useTripsData();
  const queryClient = useQueryClient();

  const [tripType, setTripType] = useState('NEEDRIDE');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [seats, setSeats] = useState(1);
  const [viatura, setViatura] = useState('Viatura Pessoal');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [createError, setCreateError] = useState('');
  const [showViaturaWarning, setShowViaturaWarning] = useState(false);
  const [showOfficeMismatchWarning, setShowOfficeMismatchWarning] = useState(false);

  const personalVehicle = getVehicleObj(dbUser?.vehicleInfo);
  const personalVehicleString = `${personalVehicle.brand || '---'} ${personalVehicle.plate ? `- ${personalVehicle.plate}` : ''}`.trim();

  const isCompanyVehicle = tripType === 'PROVIDER' && viatura === 'Viatura da Empresa';
  const tripDateFrom = date ? date.split('T')[0] : null;
  const tripDateTo = returnDate ? returnDate.split('T')[0] : tripDateFrom;

  const { data: companyVehicles, isLoading: vehiclesLoading, isFetching: vehiclesFetching } = useQuery({
    queryKey: ['company_vehicles_available', tripDateFrom, tripDateTo],
    queryFn: async () => {
      const token = await getToken();
      const url = (tripDateFrom && tripDateTo)
        ? `${API_BASE_URL}/company-vehicles?from=${tripDateFrom}&to=${tripDateTo}`
        : `${API_BASE_URL}/company-vehicles`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao carregar veículos');
      return res.json() as Promise<Array<{ id: number; brand: string; model: string; plate: string; officeId: number; office: { id: number; name: string }; available: boolean }>>;
    },
    enabled: isCompanyVehicle,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!selectedVehicleId || vehiclesFetching || !companyVehicles) return;
    const vehicle = companyVehicles.find(v => v.id === selectedVehicleId);
    if (!vehicle || !vehicle.available) setSelectedVehicleId(null);
  }, [companyVehicles, vehiclesFetching, selectedVehicleId]);

  const sortedVehicles = React.useMemo(() => {
    if (!companyVehicles) return [];
    const originId = origin ? parseInt(origin) : null;
    return [...companyVehicles].sort((a, b) => {
      const aMatchesOrigin = originId && a.officeId === originId ? 0 : 1;
      const bMatchesOrigin = originId && b.officeId === originId ? 0 : 1;
      if (aMatchesOrigin !== bMatchesOrigin) return aMatchesOrigin - bMatchesOrigin;
      if (a.available !== b.available) return a.available ? -1 : 1;
      return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
    });
  }, [companyVehicles, origin]);

  const selectedVehicle = companyVehicles?.find(v => v.id === selectedVehicleId) ?? null;
  const officeMismatch = selectedVehicle && origin
    ? selectedVehicle.officeId !== parseInt(origin)
    : false;

  useEffect(() => {
    if (officeMismatch) setShowOfficeMismatchWarning(true);
  }, [officeMismatch]);

  const createTripMutation = useMutation({
    mutationFn: async (newTrip: any) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTrip),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao criar viagem');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      onNavigate('proximas');
      setCreateError('');
    },
    onError: (error: Error) => { setCreateError(error.message); },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!origin || !destination || !date) {
      setCreateError('Por favor, selecione a origem, o destino e a data da viagem.');
      return;
    }
    if (origin === destination) {
      setCreateError('A origem e o destino têm de ser diferentes.');
      return;
    }

    let finalVehicleDetails = null;
    let finalCompanyVehicleId = null;
    let finalReturnTime = null;

    if (tripType === 'PROVIDER') {
      if (viatura === 'Viatura Pessoal') {
        const parsedVehicle = getVehicleObj(dbUser?.vehicleInfo);
        if (!parsedVehicle || !parsedVehicle.brand) {
          setCreateError('Selecionou viatura pessoal mas não tem viatura pessoal associada à sua conta. Dirija-se ao seu perfil e preencha os dados da sua viatura.');
          return;
        }
        finalVehicleDetails = dbUser.vehicleInfo;
      } else {
        if (!returnDate) {
          setCreateError('A data de retorno é obrigatória para viatura da empresa.');
          return;
        }
        if (returnDate < date) {
          setCreateError('A data de retorno tem de ser igual ou posterior à data de partida.');
          return;
        }
        if (!selectedVehicleId) {
          setCreateError('Por favor, selecione um veículo da empresa.');
          return;
        }
        const vehicle = companyVehicles?.find(v => v.id === selectedVehicleId);
        if (!vehicle?.available) {
          setCreateError('Este veículo já está ocupado nesse período. Selecione outro.');
          return;
        }
        finalCompanyVehicleId = selectedVehicleId;
        finalReturnTime = returnDate;
      }
    }

    createTripMutation.mutate({
      type: tripType,
      originId: parseInt(origin),
      destinationId: parseInt(destination),
      departureTime: date,
      returnTime: finalReturnTime,
      availableSeats: tripType === 'PROVIDER' ? seats : 0,
      vehicleType: tripType === 'PROVIDER' ? viatura : null,
      tripVehicleDetails: finalVehicleDetails,
      companyVehicleId: finalCompanyVehicleId,
    });
  };

  return (
    <div style={{ width: '100%' }}>
      {showViaturaWarning && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}
          onClick={() => setShowViaturaWarning(false)}
        >
          <div
            style={{ background: BRAND.white, borderRadius: '12px', padding: '24px', maxWidth: '380px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: BRAND.danger }}>⚠️ ATENÇÃO!</p>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: BRAND.text, lineHeight: '1.5' }}>
              Se não solicitaste viatura da empresa aos Serviços Partilhados, solicita antes de publicares a oferta de boleia!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                style={S.btnPrimary}
                onClick={() => { onNavigate('solicitar'); }}
              >
                Solicitar Viatura
              </button>
              <button
                style={S.btnSecondary}
                onClick={() => { setViatura('Viatura da Empresa'); setSelectedVehicleId(null); setReturnDate(date || ''); setShowViaturaWarning(false); }}
              >
                OK, continuar com a oferta
              </button>
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleCreate} style={S.card}>
        <div style={S.formGroup}>
          <label style={S.label}>Tipo de Registo</label>
          <select style={S.select} value={tripType} onChange={e => setTripType(e.target.value)}>
            <option value="NEEDRIDE">Passageiro (pede boleia)</option>
            <option value="PROVIDER">Condutor (oferece boleia)</option>
          </select>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isCompanyVehicle ? '1fr 1fr 1fr' : '1fr 1fr', gap: '12px' }}>
          <div style={S.formGroup}>
            <label style={S.label}>Data de Partida</label>
            <input
              style={S.input}
              type="datetime-local"
              value={date}
              min={getTodayDatetimeLocal()}
              onChange={e => { setDate(e.target.value); if (returnDate && e.target.value > returnDate) setReturnDate(e.target.value); }}
              required
            />
          </div>
          {isCompanyVehicle && (
            <div style={S.formGroup}>
              <label style={S.label}>Data de Retorno</label>
              <input
                style={S.input}
                type="datetime-local"
                value={returnDate}
                min={date || getTodayDatetimeLocal()}
                onChange={e => { setReturnDate(e.target.value); }}
                required
              />
            </div>
          )}
          <div style={{ ...S.formGroup, opacity: tripType === 'PROVIDER' ? 1 : 0.4 }}>
            <label style={S.label}>Lugares Disponíveis</label>
            <input style={S.input} type="number" min="1" value={seats} onChange={e => setSeats(Number(e.target.value))} disabled={tripType !== 'PROVIDER'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {['Viatura Pessoal', 'Viatura da Empresa'].map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer', opacity: tripType === 'PROVIDER' ? 1 : 0.4 }}>
              <input
                type="radio"
                name="viatura"
                value={v}
                checked={viatura === v}
                disabled={tripType !== 'PROVIDER'}
                onChange={() => {
                  if (v === 'Viatura da Empresa') {
                    setShowViaturaWarning(true);
                  } else {
                    setViatura(v);
                    setSelectedVehicleId(null);
                    setReturnDate('');
                  }
                }}
              /> {v}
            </label>
          ))}
        </div>
        {tripType === 'PROVIDER' && (
          <div style={{ padding: '12px', background: BRAND.primarySurface, borderRadius: '8px', marginBottom: '16px' }}>
            {viatura === 'Viatura Pessoal' ? (
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: BRAND.primaryLight }}>A sua Viatura Pessoal (Perfil)</p>
                <p style={{ margin: 0, fontSize: '14px', color: BRAND.text }}>{personalVehicleString || 'Nenhuma viatura definida no perfil.'}</p>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: BRAND.primaryLight }}>
                  Selecionar Veículo da Empresa
                  {(!date || !returnDate) ? (
                    <span style={{ fontWeight: 400, color: BRAND.textMuted }}>
                      {' '}— {!date ? 'selecione uma data de partida' : 'selecione a data de retorno'} para ver disponibilidade
                    </span>
                  ) : vehiclesFetching && !vehiclesLoading ? (
                    <span style={{ fontWeight: 400, color: BRAND.textMuted }}> — a verificar disponibilidade...</span>
                  ) : null}
                </p>
                {vehiclesLoading ? (
                  <p style={{ margin: 0, fontSize: '13px', color: BRAND.textMuted }}>A carregar veículos...</p>
                ) : sortedVehicles.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: BRAND.textMuted }}>Nenhum veículo disponível.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                    {sortedVehicles.map(v => {
                      const isSelected = selectedVehicleId === v.id;
                      const matchesOrigin = origin && v.officeId === parseInt(origin);
                      return (
                        <label
                          key={v.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: isSelected ? BRAND.primaryLight + '22' : BRAND.white,
                            border: `1px solid ${isSelected ? BRAND.primaryLight : BRAND.border}`,
                            cursor: v.available ? 'pointer' : 'not-allowed',
                            opacity: v.available ? 1 : 0.5,
                          }}
                        >
                          <input
                            type="radio"
                            name="company_vehicle"
                            value={v.id}
                            checked={isSelected}
                            disabled={!v.available}
                            onChange={() => setSelectedVehicleId(v.id)}
                          />
                          <div style={{ flex: 1 }}>
                            <div>
                              <span style={{ fontSize: '13.5px', fontWeight: '500' }}>{v.brand} {v.model}</span>
                              <span style={{ fontSize: '12px', color: BRAND.textMuted, marginLeft: '6px' }}>— {v.plate}</span>
                            </div>
                            <div style={{ marginTop: '2px' }}>
                              <span style={{ fontSize: '11px', color: matchesOrigin ? BRAND.primaryLight : BRAND.textMuted, fontWeight: matchesOrigin ? 600 : 400 }}>
                                {v.office?.name || '—'}
                              </span>
                              {matchesOrigin && (
                                <span style={{ fontSize: '11px', background: BRAND.primaryLight + '33', color: BRAND.primaryLight, borderRadius: '4px', padding: '1px 5px', marginLeft: '5px', fontWeight: 600 }}>
                                  escritório de origem
                                </span>
                              )}
                            </div>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: v.available ? '#16a34a' : BRAND.danger }}>
                            {v.available ? 'Disponível' : 'Ocupado'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {showOfficeMismatchWarning && officeMismatch && selectedVehicle && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', background: BRAND.warningBg, borderRadius: '8px', border: `1px solid ${BRAND.warning}33`, marginBottom: '4px' }}>
            <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '700', color: BRAND.warning }}>Escritório do veículo diferente da origem</p>
              <p style={{ margin: '0 0 8px', fontSize: '12.5px', color: BRAND.text, lineHeight: '1.5' }}>
                O veículo <strong>{selectedVehicle.brand} {selectedVehicle.model}</strong> pertence ao escritório de <strong>{selectedVehicle.office?.name}</strong>, que é diferente da origem selecionada. Confirma que está correto ou altera a origem da viagem.
              </p>
              <button
                type="button"
                style={{ ...S.btnSecondary, fontSize: '12px', padding: '4px 10px' }}
                onClick={() => setShowOfficeMismatchWarning(false)}
              >
                OK, está correto
              </button>
            </div>
          </div>
        )}
        <button type="submit" style={S.submitBtn} disabled={createTripMutation.isPending}>
          {createTripMutation.isPending ? 'A publicar...' : 'Publicar Viagem'}
        </button>
        {(createError || createTripMutation.isError) && (
          <p style={{ color: BRAND.danger, fontSize: '13px', marginTop: '10px', fontWeight: '500', lineHeight: '1.4' }}>
            {createError || 'Erro ao criar viagem. Verifique os dados e tente novamente.'}
          </p>
        )}
      </form>
    </div>
  );
}
