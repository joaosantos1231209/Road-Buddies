import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { MessageSquare } from 'lucide-react';
import { S, BRAND } from '../lib/design';
import { useAuth } from '../contexts/AuthContext';
import { useTripsData } from '../hooks/useTripsData';
import { useTripsActions } from '../hooks/useTripsActions';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { getCityName, getTripVehicleString, sameUser } from '../lib/tripFormatters';

const ITEMS_PER_PAGE = 10;

function HistoryStatusBadge({ t, dbUserId }: { t: any; dbUserId: string }) {
  if (t.status === 'CANCELLED') return <span style={S.badge('danger')}>Cancelada</span>;
  const isCreator = sameUser(t.userId, dbUserId);
  const hasParticipants = Array.isArray(t.participants) && t.participants.length > 0;
  if (t.type === 'NEEDRIDE') {
    return t.status === 'MATCHED'
      ? <span style={S.badge('green')}>Concluída</span>
      : <span style={S.badge('yellow')}>SEM MATCH</span>;
  }
  if (t.type === 'PROVIDER' && isCreator) {
    return hasParticipants
      ? <span style={S.badge('green')}>Concluída</span>
      : <span style={S.badge('yellow')}>Não correspondida</span>;
  }
  return <span style={S.badge('green')}>Concluída</span>;
}

export function MinhasViagens() {
  const [, setLocation] = useLocation();
  const { dbUser } = useAuth() as any;
  const { citiesData, trips, spRequestsData, matchesData, unreadChats } = useTripsData();
  const { joinTripMutation, leaveTripMutation, cancelTripMutation, markMatchesReadMutation, markAllMessagesReadMutation } = useTripsActions();

  const [activeTab, setActiveTab] = useState<'proximas' | 'matches' | 'historico' | 'pedidos'>('proximas');
  const [pageUpcoming, setPageUpcoming] = useState(1);
  const [selectedHistoryTrip, setSelectedHistoryTrip] = useState<any>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const askConfirm = (message: string, onConfirm: () => void) => setConfirm({ message, onConfirm });

  const now = new Date();
  const myTripsRaw = trips?.filter((t: any) =>
    t.userId === dbUser?.id || t.participants?.some((p: any) => p.userId === dbUser?.id)
  ) || [];

  const myUpcomingTrips = myTripsRaw
    .filter((t: any) => new Date(t.departureTime) >= now)
    .sort((a: any, b: any) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

  const myPastTrips = myTripsRaw
    .filter((t: any) => new Date(t.departureTime) < now && t.status !== 'CANCELLED')
    .sort((a: any, b: any) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());

  const unreadMatchesCount = matchesData?.filter((m: any) => !m.isRead).length || 0;
  const unreadUpcomingCount = myUpcomingTrips.filter((t: any) =>
    t.status !== 'CANCELLED' && (unreadChats?.unreadByTrip?.[t.id] || 0) > 0
  ).length;

  useEffect(() => {
    if (activeTab === 'matches' && unreadMatchesCount > 0) {
      markMatchesReadMutation.mutate();
    }
  }, [activeTab, unreadMatchesCount]);

  const totalPageUp = Math.ceil(myUpcomingTrips.length / ITEMS_PER_PAGE);
  const paginatedUpcoming = myUpcomingTrips.slice((pageUpcoming - 1) * ITEMS_PER_PAGE, pageUpcoming * ITEMS_PER_PAGE);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ ...S.tab(activeTab === 'proximas'), position: 'relative' }} onClick={() => setActiveTab('proximas')}>
            Próximas
            {unreadUpcomingCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: BRAND.danger, borderRadius: '50%' }} />}
          </button>
          <button style={{ ...S.tab(activeTab === 'matches'), position: 'relative' }} onClick={() => setActiveTab('matches')}>
            Matches
            {unreadMatchesCount > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', width: '8px', height: '8px', background: BRAND.danger, borderRadius: '50%' }} />}
          </button>
          <button style={S.tab(activeTab === 'historico')} onClick={() => setActiveTab('historico')}>Histórico</button>
          <button style={S.tab(activeTab === 'pedidos')} onClick={() => setActiveTab('pedidos')}>Viatura</button>
        </div>
        {unreadUpcomingCount > 0 && (
          <button
            style={{ ...S.btnSecondary, fontSize: '12px', padding: '6px 12px', border: `1px solid ${BRAND.danger}`, color: BRAND.danger, background: 'none' }}
            onClick={() => askConfirm('Deseja marcar TODAS as mensagens como lidas?', () => markAllMessagesReadMutation.mutate())}
            disabled={markAllMessagesReadMutation.isPending}
          >
            {markAllMessagesReadMutation.isPending ? 'A limpar...' : 'Limpar Notificações'}
          </button>
        )}
      </div>

      {activeTab === 'proximas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {paginatedUpcoming.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: BRAND.textMuted, fontSize: '13px' }}>Ainda não tem viagens agendadas.</div>
          ) : (
            <>
              {paginatedUpcoming.map((t: any) => (
                <div key={t.id} style={S.travelCard}>
                  <p style={S.travelCardTitle}>{t.userId === dbUser?.id ? (t.type === 'PROVIDER' ? 'Minha Oferta' : 'Meu Pedido') : `Boleia Reservada (Condutor: ${t.creator?.username || 'Colega'})`}</p>
                  {t.userId === dbUser?.id && t.type === 'PROVIDER' && (
                    <span style={{ ...S.badge(t.availableSeats > 0 ? 'green' : 'yellow'), marginBottom: '4px', display: 'inline-block' }}>
                      Lugares Disponíveis: {t.availableSeats}
                    </span>
                  )}
                  <p style={S.travelCardSub}>{getCityName(t.originId, citiesData)} → {getCityName(t.destinationId, citiesData)}</p>
                  <p style={S.travelCardSub}>{new Date(t.departureTime).toLocaleString()}{t.type === 'PROVIDER' ? ` · ${getTripVehicleString(t)}` : ''}</p>
                  <div style={S.travelCardActions}>
                    {t.userId === dbUser?.id ? (
                      <button style={S.btnDanger} onClick={() => askConfirm('Tem a certeza que deseja cancelar esta viagem?', () => cancelTripMutation.mutate(t.id))}>Cancelar</button>
                    ) : (
                      <button style={S.btnDanger} onClick={() => askConfirm('Tem a certeza que deseja sair desta viagem?', () => leaveTripMutation.mutate(t.id))}>Sair da Viagem</button>
                    )}
                    {t.participants?.length > 0 && (
                      <button style={{ ...S.btnChat, display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }} onClick={() => setLocation(`/chat/${t.id}`)}>
                        <MessageSquare size={14} /> Chat
                        {(unreadChats?.unreadByTrip?.[t.id] ?? 0) > 0 && (
                          <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: BRAND.danger, color: 'white', fontSize: '9px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {unreadChats!.unreadByTrip[t.id]}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  {t.userId === dbUser?.id && t.type === 'PROVIDER' && t.participants?.length > 0 && (
                    <div style={{ marginTop: '12px', padding: '10px', background: BRAND.bg, borderRadius: '6px' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '12px', color: BRAND.primaryLight, fontWeight: '600' }}>Lugares Reservados:</p>
                      {t.participants.map((p: any) => (
                        <p key={p.id} style={{ margin: 0, fontSize: '13px', color: BRAND.text }}>• {p.user?.username || `Utilizador #${p.userId.substring(0, 6)}`}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {totalPageUp > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center', paddingTop: '10px' }}>
                  <button disabled={pageUpcoming === 1} onClick={() => setPageUpcoming(p => p - 1)} style={{ ...S.btnSecondary, padding: '5px 12px', fontSize: '12px' }}>Anterior</button>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>{pageUpcoming} / {totalPageUp}</span>
                  <button disabled={pageUpcoming === totalPageUp} onClick={() => setPageUpcoming(p => p + 1)} style={{ ...S.btnSecondary, padding: '5px 12px', fontSize: '12px' }}>Próxima</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!matchesData || matchesData.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: BRAND.textMuted, fontSize: '13px' }}>Ainda não foram encontrados matches para os seus pedidos.</div>
          ) : matchesData.map((m: any) => (
            <div key={m.id} style={S.travelCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={S.travelCardTitle}>{m.providerTrip?.creator?.username || 'Condutor'}</p>
                <span style={S.badge('green')}>Match Encontrado</span>
              </div>
              <p style={S.travelCardSub}>{getCityName(m.providerTrip?.originId, citiesData)} → {getCityName(m.providerTrip?.destinationId, citiesData)}</p>
              <p style={S.travelCardSub}>{new Date(m.providerTrip?.departureTime).toLocaleString()} · {m.providerTrip?.availableSeats} lugares restantes</p>
              <div style={S.travelCardActions}>
                {m.status === 'PENDING' && <button style={S.btnReserve} onClick={() => joinTripMutation.mutate(m.providerTripId)} disabled={joinTripMutation.isPending}>{joinTripMutation.isPending ? 'A reservar...' : 'Reservar Lugar'}</button>}
                {m.status === 'ACCEPTED' && <span style={{ fontSize: '13px', color: BRAND.success, fontWeight: '600' }}>Lugar Reservado!</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'historico' && (
        myPastTrips.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: BRAND.textMuted, fontSize: '13px' }}>Ainda não tem viagens no seu histórico.</div>
        ) : (
          <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Data</th><th style={S.th}>Origem</th><th style={S.th}>Destino</th><th style={S.th}>Estado</th><th style={S.th}>Ações</th></tr></thead>
              <tbody>
                {myPastTrips.map((t: any) => (
                  <tr key={t.id}>
                    <td style={S.td}>{new Date(t.departureTime).toLocaleDateString()}</td>
                    <td style={S.td}>{getCityName(t.originId, citiesData)}</td>
                    <td style={S.td}>{getCityName(t.destinationId, citiesData)}</td>
                    <td style={S.td}><HistoryStatusBadge t={t} dbUserId={dbUser?.id} /></td>
                    <td style={{ ...S.td, display: 'flex', gap: '6px' }}>
                      <button style={{ ...S.btnReserve, padding: '4px 8px', fontSize: '11px' }} onClick={() => setSelectedHistoryTrip(t)}>Detalhes</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'pedidos' && (
        <div style={{ ...S.card, padding: 0, overflowX: 'auto' }}>
          {spRequestsData.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: BRAND.textMuted, fontSize: '13px' }}>Ainda não tem pedidos de viatura registados.</div>
          ) : (
            <table style={S.table}>
              <thead><tr><th style={S.th}>Data do Pedido</th><th style={S.th}>Origem</th><th style={S.th}>Destino</th><th style={S.th}>Data Necessária</th><th style={{ ...S.th, minWidth: '200px' }}>Justificação</th></tr></thead>
              <tbody>
                {spRequestsData.map((r: any) => (
                  <tr key={r.id}>
                    <td style={S.td}>{new Date(r.createdAt).toLocaleDateString('pt-PT')}</td>
                    <td style={S.td}>{r.origin?.name || '—'}</td>
                    <td style={S.td}>{r.destination?.name || '—'}</td>
                    <td style={S.td}>{new Date(r.dateNeeded).toLocaleDateString('pt-PT')}</td>
                    <td style={S.td}><div style={{ maxWidth: '300px', overflowX: 'auto', whiteSpace: 'nowrap' }}>{r.justification || '—'}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedHistoryTrip && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ ...S.card, maxWidth: '450px', width: '100%', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: BRAND.primary }}>Detalhes da Viagem</h3>
              <button onClick={() => setSelectedHistoryTrip(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: BRAND.textMuted }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ ...S.label, marginBottom: '4px' }}>Resumo</label>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{getCityName(selectedHistoryTrip.originId, citiesData)} → {getCityName(selectedHistoryTrip.destinationId, citiesData)}</p>
                <p style={{ margin: 0, fontSize: '12px', color: BRAND.textMuted }}>{new Date(selectedHistoryTrip.departureTime).toLocaleString('pt-PT')}</p>
              </div>
              {selectedHistoryTrip.type === 'NEEDRIDE' && selectedHistoryTrip.userId === dbUser?.id ? (
                <div>
                  <label style={{ ...S.label, marginBottom: '4px' }}>O seu papel</label>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Seria passageiro</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ ...S.label, marginBottom: '4px' }}>O seu papel</label>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{selectedHistoryTrip.userId === dbUser?.id ? 'Condutor' : 'Passageiro'}</p>
                      {selectedHistoryTrip.userId !== dbUser?.id && <p style={{ margin: 0, fontSize: '12px', color: BRAND.textMuted }}>Condutor: {selectedHistoryTrip.creator?.username || '---'}</p>}
                    </div>
                    {selectedHistoryTrip.userId === dbUser?.id && (
                      <div>
                        <label style={{ ...S.label, marginBottom: '4px' }}>Lotação</label>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{selectedHistoryTrip.participants?.length || 0} passageiro(s)</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ ...S.label, marginBottom: '4px' }}>Viatura Utilizada</label>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{selectedHistoryTrip.userId === dbUser?.id ? (selectedHistoryTrip.vehicleType || 'Viatura Pessoal') : 'Viatura do Condutor'}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: BRAND.textMuted }}>{getTripVehicleString(selectedHistoryTrip)}</p>
                  </div>
                </>
              )}
            </div>
            <button style={{ ...S.submitBtn, marginTop: '24px' }} onClick={() => setSelectedHistoryTrip(null)}>Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
