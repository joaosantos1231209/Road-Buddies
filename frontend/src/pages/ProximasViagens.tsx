import { useState } from 'react';
import { useLocation } from 'wouter';
import { MessageSquare } from 'lucide-react';
import { S, BRAND } from '../lib/design';
import { useAuth } from '../contexts/AuthContext';
import { useTripsData } from '../hooks/useTripsData';
import { useTripsActions } from '../hooks/useTripsActions';
import { CitySelector } from '../components/CitySelector';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getCityName, getTripVehicleString } from '../lib/tripFormatters';
import type { Trip } from '../types';

const ITEMS_PER_PAGE = 10;

export function ProximasViagens() {
  const [, setLocation] = useLocation();
  const { dbUser } = useAuth() as any;
  const { citiesData, trips } = useTripsData();
  const { joinTripMutation, leaveTripMutation, cancelTripMutation } = useTripsActions();

  const [activeTab, setActiveTab] = useState('ofertas');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [pageOffers, setPageOffers] = useState(1);
  const [pageRequests, setPageRequests] = useState(1);
  const [filterDateType, setFilterDateType] = useState('text');
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const now = new Date();
  const upcomingTrips = trips?.filter((t: Trip) => new Date(t.departureTime) >= now && t.status !== 'CANCELLED') || [];

  const providerTrips = upcomingTrips.filter((t: Trip) => {
    if (t.type !== 'PROVIDER') return false;
    const isMine = t.userId === dbUser?.id;
    const isParticipant = t.participants?.some(p => p.userId === dbUser?.id);
    return !isMine && !isParticipant && t.availableSeats > 0;
  });

  const needRideTrips = upcomingTrips.filter((t: Trip) =>
    t.type === 'NEEDRIDE' && t.userId !== dbUser?.id && !t.hidden
  );

  const isOffers = activeTab === 'ofertas';
  const baseList = isOffers ? providerTrips : needRideTrips;

  const filteredList = baseList.filter((t: Trip) => {
    if (filterOrigin && t.originId.toString() !== filterOrigin) return false;
    if (filterDestination && t.destinationId.toString() !== filterDestination) return false;
    if (filterDate && !new Date(t.departureTime).toLocaleDateString('sv-SE').startsWith(filterDate)) return false;
    return true;
  }).sort((a: Trip, b: Trip) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const currentPage = isOffers ? pageOffers : pageRequests;
  const setCurrentPage = isOffers ? setPageOffers : setPageRequests;
  const paginatedList = filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetPagination = () => { setPageOffers(1); setPageRequests(1); };

  const askConfirm = (message: string, onConfirm: () => void) => setConfirm({ message, onConfirm });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
          confirmLabel="Confirmar"
          danger
        />
      )}

      <div style={{ display: 'flex', gap: '8px' }} role="tablist" aria-label="Tipo de viagem">
        <button role="tab" aria-selected={isOffers} style={S.tab(isOffers)} onClick={() => setActiveTab('ofertas')}>Ofertas de Boleia</button>
        <button role="tab" aria-selected={!isOffers} style={S.tab(!isOffers)} onClick={() => setActiveTab('pedidos')}>Pedidos de Boleia</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', background: BRAND.bg, padding: '12px', borderRadius: '10px', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: '600', color: BRAND.textMuted, whiteSpace: 'nowrap' }}>Filtrar:</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ minWidth: '160px' }}>
            <CitySelector value={filterOrigin} onChange={(v) => { setFilterOrigin(v); resetPagination(); }} citiesData={citiesData} placeholder="Origem" />
          </div>
          {filterOrigin && <button aria-label="Limpar filtro de origem" style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.textMuted, fontSize: '16px' }} onClick={() => { setFilterOrigin(''); resetPagination(); }}>×</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ minWidth: '160px' }}>
            <CitySelector value={filterDestination} onChange={(v) => { setFilterDestination(v); resetPagination(); }} citiesData={citiesData} placeholder="Destino" />
          </div>
          {filterDestination && <button aria-label="Limpar filtro de destino" style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.textMuted, fontSize: '16px' }} onClick={() => { setFilterDestination(''); resetPagination(); }}>×</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input aria-label="Filtrar por data" style={{ ...S.input, minWidth: '13px' }} type={filterDateType} placeholder="Data" value={filterDate} onFocus={() => setFilterDateType('date')} onBlur={() => { if (!filterDate) setFilterDateType('text'); }} onChange={e => { setFilterDate(e.target.value); resetPagination(); }} />
          {filterDate && <button aria-label="Limpar filtro de data" style={{ background: 'none', border: 'none', cursor: 'pointer', color: BRAND.textMuted, fontSize: '16px' }} onClick={() => { setFilterDate(''); resetPagination(); }}>×</button>}
        </div>
        {(filterOrigin || filterDestination || filterDate) && (
          <button style={{ ...S.btnSecondary, fontSize: '12px', padding: '6px 10px' }} onClick={() => { setFilterOrigin(''); setFilterDestination(''); setFilterDate(''); resetPagination(); }}>Limpar Tudo</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', paddingBottom: '20px' }}>
        {paginatedList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: BRAND.textMuted }}>Nenhuma viagem encontrada com os filtros selecionados.</div>
        ) : paginatedList.map((t: Trip) => {
          const isMine = t.userId === dbUser?.id;
          const hasJoined = t.participants?.some(p => p.userId === dbUser?.id);
          const isFull = t.availableSeats <= 0;
          return (
            <div key={t.id} style={S.travelCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={S.travelCardTitle}>
                  {t.creator?.username || `User #${t.userId}`}
                  {isMine && <span style={{ fontSize: '11px', background: BRAND.primarySurface, color: BRAND.primaryLight, borderRadius: '4px', padding: '2px 6px', marginLeft: '6px' }}>A minha viagem</span>}
                </p>
                <span style={S.badge(isOffers ? 'green' : 'yellow')}>{isOffers ? `${t.availableSeats} lugares` : 'Pedido'}</span>
              </div>
              <p style={S.travelCardSub}>{getCityName(t.originId, citiesData)} → {getCityName(t.destinationId, citiesData)}</p>
              <p style={S.travelCardSub}>{new Date(t.departureTime).toLocaleString()}{t.type === 'PROVIDER' ? ` · ${getTripVehicleString(t)}` : ''}</p>
              <div style={S.travelCardActions}>
                {isMine ? (
                  <>
                    <button
                      style={{ ...S.btnDanger, opacity: cancelTripMutation.isPending ? 0.6 : 1 }}
                      disabled={cancelTripMutation.isPending}
                      onClick={() => askConfirm('Tem a certeza que deseja cancelar esta viagem?', () => cancelTripMutation.mutate(t.id))}
                    >
                      {cancelTripMutation.isPending ? 'A cancelar...' : 'Cancelar'}
                    </button>
                    {t.participants && t.participants.length > 0 && (
                      <button style={{ ...S.btnChat, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setLocation(`/chat/${t.id}`)}>
                        <MessageSquare size={14} /> Chat
                      </button>
                    )}
                  </>
                ) : hasJoined ? (
                  <>
                    <button
                      style={{ ...S.btnDanger, opacity: leaveTripMutation.isPending ? 0.6 : 1 }}
                      disabled={leaveTripMutation.isPending}
                      onClick={() => askConfirm('Sair desta viagem?', () => leaveTripMutation.mutate(t.id))}
                    >
                      {leaveTripMutation.isPending ? 'A sair...' : 'Sair'}
                    </button>
                    <button style={{ ...S.btnChat, display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setLocation(`/chat/${t.id}`)}>
                      <MessageSquare size={14} /> Chat
                    </button>
                  </>
                ) : (
                  isOffers && !isFull && (
                    <button
                      style={{ ...S.btnReserve, opacity: joinTripMutation.isPending ? 0.6 : 1 }}
                      disabled={joinTripMutation.isPending}
                      onClick={() => joinTripMutation.mutate(t.id)}
                    >
                      {joinTripMutation.isPending ? 'A reservar...' : 'Reservar'}
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Paginação" style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', padding: '10px 0 30px' }}>
          <button
            aria-label="Página anterior"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            style={{ ...S.btnSecondary, padding: '6px 16px', opacity: currentPage === 1 ? 0.4 : 1 }}
          >Anterior</button>
          <span aria-live="polite" style={{ fontSize: '13px', fontWeight: '600' }}>Página {currentPage} de {totalPages}</span>
          <button
            aria-label="Próxima página"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            style={{ ...S.btnSecondary, padding: '6px 16px', opacity: currentPage === totalPages ? 0.4 : 1 }}
          >Próxima</button>
        </nav>
      )}
    </div>
  );
}
