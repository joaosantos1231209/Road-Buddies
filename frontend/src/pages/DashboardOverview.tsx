import { BRAND, S } from '../lib/design';
import { useTripsData } from '../hooks/useTripsData';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  isMobile: boolean;
  onNavigate: (page: string) => void;
}

export function DashboardOverview({ isMobile, onNavigate }: Props) {
  const { dbUser } = useAuth() as any;
  const { trips } = useTripsData();

  const now = new Date();
  const upcomingTrips = trips?.filter((t: any) => new Date(t.departureTime) >= now && t.status !== 'CANCELLED') || [];

  const providerTrips = upcomingTrips.filter((t: any) => {
    if (t.type !== 'PROVIDER') return false;
    const isMine = t.userId === dbUser?.id;
    const isParticipant = t.participants?.some((p: any) => p.userId === dbUser?.id);
    return !isMine && !isParticipant && t.availableSeats > 0;
  });

  const needRideTrips = upcomingTrips.filter((t: any) =>
    t.type === 'NEEDRIDE' && t.userId !== dbUser?.id
  );

  const myTripsRaw = trips?.filter((t: any) =>
    t.userId === dbUser?.id || t.participants?.some((p: any) => p.userId === dbUser?.id)
  ) || [];

  const myUpcomingTrips = myTripsRaw.filter((t: any) => new Date(t.departureTime) >= now && t.status !== 'CANCELLED');

  const completedCount = myTripsRaw
    .filter((t: any) => new Date(t.departureTime) < now && t.status !== 'CANCELLED')
    .filter((t: any) => t.type !== 'NEEDRIDE' || t.status === 'MATCHED').length;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ ...S.card, cursor: 'pointer', borderLeft: `4px solid ${BRAND.primaryLight}` }} onClick={() => onNavigate('proximas')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: BRAND.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.primaryLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: BRAND.text }}>Próximas Viagens</p>
              <p style={{ margin: 0, fontSize: '12px', color: BRAND.textMuted }}>Ofertas e pedidos de boleia</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, background: BRAND.primarySurface, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: BRAND.primaryLight }}>{providerTrips.length}</p>
              <p style={{ margin: 0, fontSize: '11px', color: BRAND.textMuted }}>Ofertas disponíveis</p>
            </div>
            <div style={{ flex: 1, background: BRAND.accentLight, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: BRAND.accent }}>{needRideTrips.length}</p>
              <p style={{ margin: 0, fontSize: '11px', color: BRAND.textMuted }}>Pedidos ativos</p>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: BRAND.primaryLight, fontWeight: '500' }}>Ver todas as viagens →</p>
        </div>

        <div style={{ ...S.card, cursor: 'pointer', borderLeft: `4px solid ${BRAND.success}` }} onClick={() => onNavigate('minhas')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: BRAND.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '15px', color: BRAND.text }}>Minhas Viagens</p>
              <p style={{ margin: 0, fontSize: '12px', color: BRAND.textMuted }}>Histórico e pedidos de viatura</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1, background: BRAND.successBg, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: BRAND.success }}>{completedCount}</p>
              <p style={{ margin: 0, fontSize: '11px', color: BRAND.textMuted }}>Viagens concluídas</p>
            </div>
            <div style={{ flex: 1, background: BRAND.warningBg, borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: BRAND.warning }}>{myUpcomingTrips.length}</p>
              <p style={{ margin: 0, fontSize: '11px', color: BRAND.textMuted }}>Viagens futuras</p>
            </div>
          </div>
          <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: BRAND.success, fontWeight: '500' }}>Ver o meu histórico →</p>
        </div>
      </div>

      <div style={{ ...S.card, background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%)`, border: 'none' }}>
        <p style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: '700', color: '#fff' }}>Vantagens de Partilhar Viagens</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { icon: '💰', title: 'Economize até 70%', desc: 'Reduza os seus custos de deslocação partilhando viagem com colegas.' },
            { icon: '🌿', title: 'Reduza a pegada ambiental', desc: 'Menos carros na estrada significa menos emissões de CO₂.' },
            { icon: '🤝', title: 'Conheça novas pessoas', desc: 'Crie laços com colegas de outros departamentos e escritórios.' },
            { icon: '⏱️', title: 'Viagens mais rápidas', desc: 'Acesso a vias de alta ocupação e lugares de estacionamento prioritários.' },
          ].map((v) => (
            <div key={v.title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px', lineHeight: 1 }}>{v.icon}</span>
              <div>
                <p style={{ margin: 0, fontWeight: '600', fontSize: '13.5px', color: '#fff' }}>{v.title}</p>
                <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
