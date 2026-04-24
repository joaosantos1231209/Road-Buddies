import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { S, BRAND } from '../lib/design';
import { useAuth } from '../contexts/AuthContext';
import { useTripsData } from '../hooks/useTripsData';
import { CitySelector } from '../components/CitySelector';
import { API_BASE_URL } from '../lib/constants';
import { getTodayDatetimeLocal } from '../lib/dateFormatters';
import { getVehicleObj } from '../lib/tripFormatters';
import { formatLicensePlate, isValidLicensePlate } from '@/lib/utils';

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
  const [seats, setSeats] = useState(1);
  const [viatura, setViatura] = useState('Viatura Pessoal');
  const [companyBrand, setCompanyBrand] = useState('');
  const [companyPlate, setCompanyPlate] = useState('');
  const [createError, setCreateError] = useState('');

  const personalVehicle = getVehicleObj(dbUser?.vehicleInfo);
  const personalVehicleString = `${personalVehicle.brand || '---'} ${personalVehicle.plate ? `- ${personalVehicle.plate}` : ''}`.trim();

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
    if (tripType === 'PROVIDER') {
      if (viatura === 'Viatura Pessoal') {
        if (!dbUser?.vehicleInfo) {
          setCreateError('Selecionou viatura pessoal mas não tem viatura pessoal associada à sua conta. Dirija-se ao seu perfil e preencha os dados da sua viatura.');
          return;
        }
        finalVehicleDetails = dbUser.vehicleInfo;
      } else {
        if (!companyBrand.trim() || !companyPlate.trim()) {
          setCreateError('Por favor, preencha todos os dados da viatura da empresa.');
          return;
        }
        if (!isValidLicensePlate(companyPlate)) {
          setCreateError('A matrícula da viatura da empresa é inválida. Use o formato XX-XX-XX.');
          return;
        }
        finalVehicleDetails = JSON.stringify({ brand: companyBrand, plate: companyPlate });
      }
    }

    createTripMutation.mutate({
      type: tripType,
      originId: parseInt(origin),
      destinationId: parseInt(destination),
      departureTime: date,
      availableSeats: tripType === 'PROVIDER' ? seats : 0,
      vehicleType: tripType === 'PROVIDER' ? viatura : null,
      tripVehicleDetails: finalVehicleDetails,
    });
  };

  return (
    <div style={{ width: '100%' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          <div style={S.formGroup}>
            <label style={S.label}>Data</label>
            <input style={S.input} type="datetime-local" value={date} min={getTodayDatetimeLocal()} onChange={e => setDate(e.target.value)} required />
          </div>
          <div style={{ ...S.formGroup, opacity: tripType === 'PROVIDER' ? 1 : 0.4 }}>
            <label style={S.label}>Lugares Disponíveis</label>
            <input style={S.input} type="number" min="1" value={seats} onChange={e => setSeats(Number(e.target.value))} disabled={tripType !== 'PROVIDER'} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          {['Viatura Pessoal', 'Viatura da Empresa'].map(v => (
            <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer', opacity: tripType === 'PROVIDER' ? 1 : 0.4 }}>
              <input type="radio" name="viatura" value={v} checked={viatura === v} onChange={() => setViatura(v)} disabled={tripType !== 'PROVIDER'} /> {v}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ ...S.label, color: BRAND.primaryLight }}>Marca e Modelo</label>
                  <input style={{ ...S.input, background: BRAND.white }} value={companyBrand} onChange={e => setCompanyBrand(e.target.value)} required />
                </div>
                <div>
                  <label style={{ ...S.label, color: BRAND.primaryLight }}>Matrícula</label>
                  <input style={{ ...S.input, background: BRAND.white }} value={companyPlate} onChange={e => setCompanyPlate(formatLicensePlate(e.target.value))} maxLength={8} required />
                </div>
              </div>
            )}
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
