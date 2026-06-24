import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { S, BRAND } from '../lib/design';
import { useAuth } from '../contexts/AuthContext';
import { getCityName, getVehicleObj } from '../lib/tripFormatters';
import { API_BASE_URL } from '../lib/constants';

interface Props {
  trip: any;
  citiesData: any[];
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
  error?: string;
}

export function EditTripModal({ trip, citiesData, onClose, onSave, isSaving, error }: Props) {
  const { dbUser, getToken } = useAuth() as any;

  const participantCount = trip.participants?.length || 0;

  const [seats, setSeats] = useState<number>(trip.availableSeats + participantCount);
  const [viatura, setViatura] = useState<string>(trip.vehicleType || 'Viatura Pessoal');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(trip.companyVehicleId || null);
  const [returnDate, setReturnDate] = useState<string>(
    trip.returnTime ? new Date(trip.returnTime).toISOString().slice(0, 16) : ''
  );

  const isCompany = viatura === 'Viatura da Empresa';
  const departureDay = new Date(trip.departureTime).toISOString().slice(0, 10);
  const returnDay = returnDate ? returnDate.split('T')[0] : departureDay;
  const departureDatetimeLocal = new Date(trip.departureTime).toISOString().slice(0, 16);

  const { data: companyVehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['company_vehicles_edit', trip.id, departureDay, returnDay],
    queryFn: async () => {
      const token = await getToken();
      const url = `${API_BASE_URL}/company-vehicles?from=${departureDay}&to=${returnDay}&excludeTripId=${trip.id}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Erro ao carregar veículos');
      return res.json();
    },
    enabled: isCompany,
  });

  const sortedVehicles = React.useMemo(() => {
    if (!companyVehicles) return [];
    return [...companyVehicles].sort((a: any, b: any) => {
      const aMatch = a.officeId === trip.originId ? 0 : 1;
      const bMatch = b.officeId === trip.originId ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      if (a.available !== b.available) return a.available ? -1 : 1;
      return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`);
    });
  }, [companyVehicles, trip.originId]);

  const personalVehicle = getVehicleObj(dbUser?.vehicleInfo);
  const personalVehicleString = `${personalVehicle.brand || '---'} ${personalVehicle.plate ? `- ${personalVehicle.plate}` : ''}`.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { availableSeats: seats - participantCount, vehicleType: viatura };
    if (isCompany) {
      payload.companyVehicleId = selectedVehicleId;
      payload.returnTime = returnDate;
    } else {
      payload.companyVehicleId = null;
      payload.tripVehicleDetails = dbUser?.vehicleInfo || null;
    }
    onSave(payload);
  };

  const parsedVehicle = getVehicleObj(dbUser?.vehicleInfo);
  const hasPersonalVehicle = !!(parsedVehicle && parsedVehicle.brand);

  const canSubmit = !isSaving && (
    (isCompany && !!selectedVehicleId && !!returnDate) ||
    (!isCompany && hasPersonalVehicle)
  );

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ ...S.card, maxWidth: '480px', width: '100%', margin: 0, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: BRAND.primary }}>Editar Viagem</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: BRAND.textMuted }}>×</button>
        </div>

        <div style={{ padding: '12px', background: BRAND.bg, borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: BRAND.textMuted }}>Trajeto</p>
          <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: '600' }}>
            {getCityName(trip.originId, citiesData)} → {getCityName(trip.destinationId, citiesData)}
          </p>
          <p style={{ margin: '0 0 4px', fontSize: '12px', color: BRAND.textMuted }}>Data de Partida</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
            {new Date(trip.departureTime).toLocaleString('pt-PT')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={S.formGroup}>
            <label style={S.label}>Total de Lugares</label>
            <input
              style={S.input}
              type="number"
              min={Math.max(1, participantCount)}
              max={8}
              value={seats}
              onChange={e => setSeats(Number(e.target.value))}
            />
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: BRAND.textMuted }}>
              {participantCount > 0
                ? `${participantCount} reservado${participantCount !== 1 ? 's' : ''} · fica(m) ${Math.max(0, seats - participantCount)} lugar${seats - participantCount !== 1 ? 'es' : ''} disponíve${seats - participantCount !== 1 ? 'is' : 'l'} para outros`
                : 'Nenhuma reserva ainda'}
            </p>
          </div>

          <div style={S.formGroup}>
            <label style={S.label}>Viatura</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
              {['Viatura Pessoal', 'Viatura da Empresa'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="edit_viatura"
                    value={v}
                    checked={viatura === v}
                    onChange={() => { setViatura(v); setSelectedVehicleId(null); if (v === 'Viatura Pessoal') setReturnDate(''); }}
                  /> {v}
                </label>
              ))}
            </div>
          </div>

          <div style={{ padding: '12px', background: BRAND.primarySurface, borderRadius: '8px' }}>
            {!isCompany ? (
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: '600', color: BRAND.primaryLight }}>A sua Viatura Pessoal (Perfil)</p>
                <p style={{ margin: 0, fontSize: '14px', color: BRAND.text }}>{personalVehicleString || 'Nenhuma viatura definida no perfil.'}</p>
              </div>
            ) : (
              <div>
                <div style={{ ...S.formGroup, marginBottom: '12px' }}>
                  <label style={S.label}>Data de Retorno</label>
                  <input
                    style={S.input}
                    type="datetime-local"
                    value={returnDate}
                    min={departureDatetimeLocal}
                    onChange={e => { setReturnDate(e.target.value); setSelectedVehicleId(null); }}
                    required
                  />
                </div>

                <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: BRAND.primaryLight }}>
                  Selecionar Veículo da Empresa
                  {!returnDate && (
                    <span style={{ fontWeight: 400, color: BRAND.textMuted }}> — selecione a data de retorno para ver disponibilidade</span>
                  )}
                </p>

                {vehiclesLoading ? (
                  <p style={{ margin: 0, fontSize: '13px', color: BRAND.textMuted }}>A carregar veículos...</p>
                ) : !sortedVehicles.length ? (
                  <p style={{ margin: 0, fontSize: '13px', color: BRAND.textMuted }}>Nenhum veículo disponível.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {sortedVehicles.map((v: any) => {
                      const isSelected = selectedVehicleId === v.id;
                      const matchesOrigin = v.officeId === trip.originId;
                      return (
                        <label
                          key={v.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', borderRadius: '6px',
                            background: isSelected ? BRAND.primaryLight + '22' : BRAND.white,
                            border: `1px solid ${isSelected ? BRAND.primaryLight : BRAND.border}`,
                            cursor: v.available ? 'pointer' : 'not-allowed',
                            opacity: v.available ? 1 : 0.5,
                          }}
                        >
                          <input
                            type="radio"
                            name="edit_company_vehicle"
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

          {error && <p style={{ margin: 0, color: BRAND.danger, fontSize: '13px', fontWeight: '500' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" style={S.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" style={S.submitBtn} disabled={!canSubmit}>
              {isSaving ? 'A guardar...' : 'Guardar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
