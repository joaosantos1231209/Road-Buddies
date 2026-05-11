import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { S, BRAND } from '../lib/design';
import { useAuth } from '../contexts/AuthContext';
import { useTripsData } from '../hooks/useTripsData';
import { Profile } from './Profile';
import { AdminPanel } from './AdminPanel';
import { DashboardOverview } from './DashboardOverview';
import { ProximasViagens } from './ProximasViagens';
import { MinhasViagens } from './MinhasViagens';
import { CriarViagem } from './CriarViagem';
import { SolicitarViatura } from './SolicitarViatura';
import { Home, CalendarDays, History, User, Settings, Menu, X, Plus, Car, Check } from 'lucide-react';

function Header({ onNavigate, onToggleSidebar, isMobile, showActions = true, userInitials = 'U', userAvatar = '' }: any) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [userAvatar]);

  const showFallback = !userAvatar || imgError;

  return (
    <div style={{ ...S.header, padding: isMobile ? '12px 14px' : '12px 20px' }}>
      <div style={S.headerLeft}>
        {isMobile && (
          <button style={S.hmenu} onClick={onToggleSidebar}><Menu size={20} /></button>
        )}
        {showActions && !isMobile && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={S.btnPrimary} onClick={() => onNavigate('solicitar')}>Solicitar Viatura (SP)</button>
            <button style={S.btnSecondary} onClick={() => onNavigate('criar')}>Criar Oferta / Pedido</button>
          </div>
        )}
        {showActions && isMobile && (
          <span style={{ fontSize: '10px', color: BRAND.textMuted, marginLeft: '8px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Menu Lateral (Boleias / Viaturas)
          </span>
        )}
      </div>
      <div
        style={{ ...S.avatar, flexShrink: 0, overflow: 'hidden', background: !showFallback ? 'transparent' : BRAND.accentLight, padding: !showFallback ? 0 : undefined }}
        onClick={() => onNavigate('perfil')}
        title="Ver Perfil"
      >
        {!showFallback ? (
          <img src={userAvatar} alt="Avatar" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
        ) : userInitials}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, dbUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const { matchesData, unreadChats, trips } = useTripsData();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Cypress) {
      (window as any).queryClient = queryClient;
      (window as any).__APP_READY__ = true;
    }
  }, [queryClient]);

  const [page, setPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (page === 'admin' && dbUser && !dbUser.isAdmin) setPage('dashboard');
  }, [page, dbUser?.isAdmin]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 6 ? 'Boa Noite' : hour < 13 ? 'Bom Dia' : hour < 19 ? 'Boa Tarde' : 'Boa Noite';
  const greetingTitle = `${greeting}, ${dbUser?.username || ''}!`;
  const unreadMatchesCount = matchesData?.filter((m: any) => !m.isRead).length || 0;

  const myUpcomingTrips = trips?.filter((t: any) =>
    (t.userId === dbUser?.id || t.participants?.some((p: any) => p.userId === dbUser?.id)) &&
    new Date(t.departureTime) >= now
  ) || [];

  const unreadMessagesCount = myUpcomingTrips.filter((t: any) =>
    t.status !== 'CANCELLED' && (unreadChats?.unreadByTrip?.[t.id] || 0) > 0
  ).length;

  const userInitials = (dbUser?.username || user?.email || 'U').substring(0, 2).toUpperCase();
  const userAvatar = dbUser?.avatarUrl || (user as any)?.photoURL || '';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'proximas', label: 'Próximas Viagens', icon: <CalendarDays size={18} /> },
    { id: 'minhas', label: 'Minhas Viagens', icon: <History size={18} /> },
    { id: 'perfil', label: 'Perfil', icon: <User size={18} /> },
    ...(isMobile ? [
      { id: 'criar', label: 'Publicar Viagem', icon: <Plus size={18} /> },
      { id: 'solicitar', label: 'Solicitar Viatura', icon: <Car size={18} /> },
    ] : []),
    ...(dbUser?.isAdmin ? [{ id: 'admin', label: 'Administração', icon: <Settings size={18} /> }] : []),
  ];

  const headerProps = { onNavigate: setPage, onToggleSidebar: () => setIsSidebarOpen(true), isMobile, userInitials, userAvatar };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <>
            <Header {...headerProps} />
            <div style={S.content}>
              <p style={S.pageTitle}>{greetingTitle}</p>
              <DashboardOverview isMobile={isMobile} onNavigate={setPage} />
            </div>
          </>
        );
      case 'proximas':
        return (
          <>
            <Header {...headerProps} />
            <div style={S.content}>
              <p style={S.pageTitle}>Próximas Viagens</p>
              <ProximasViagens />
            </div>
          </>
        );
      case 'minhas':
        return (
          <>
            <Header {...headerProps} />
            <div style={S.content}>
              <p style={S.pageTitle}>Minhas Viagens</p>
              <MinhasViagens />
            </div>
          </>
        );
      case 'criar':
        return (
          <>
            <Header {...headerProps} />
            <div style={S.content}>
              <p style={S.pageTitle}>Publicar no Dashboard</p>
              <CriarViagem onNavigate={setPage} isMobile={isMobile} />
            </div>
          </>
        );
      case 'solicitar':
        return (
          <>
            <Header {...headerProps} />
            <div style={S.content}>
              <p style={S.pageTitle}>Solicitar Viatura</p>
              <SolicitarViatura onNavigate={setPage} isMobile={isMobile} />
            </div>
          </>
        );
      case 'perfil':
        return (
          <>
            <Header {...headerProps} showActions={false} />
            <div style={S.content}><Profile /></div>
          </>
        );
      case 'admin':
        return (
          <>
            <Header {...headerProps} showActions={false} />
            <div style={S.content}><AdminPanel /></div>
          </>
        );
      default:
        return (
          <>
            <Header {...headerProps} />
            <div style={S.content}>
              <p style={S.pageTitle}>{greetingTitle}</p>
              <DashboardOverview isMobile={isMobile} onNavigate={setPage} />
            </div>
          </>
        );
    }
  };

  return (
    <div style={S.app}>
      {isMobile && isSidebarOpen && <div style={S.overlay} onClick={() => setIsSidebarOpen(false)} />}
      <aside style={isMobile ? S.sidebarMobile(isSidebarOpen) : S.sidebar}>
        <div style={S.logo}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={S.logoTitle}>Road Buddies</p>
              <p style={S.logoSub}>Carsharing LOBA</p>
            </div>
            {isMobile && (
              <button aria-label="Fechar menu" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            )}
          </div>
        </div>
        <nav style={S.navList} aria-label="Navegação principal">
          {navItems.map(({ id, label, icon }) => {
            const isActive = page === id || (page === 'criar' && id === 'proximas') || (page === 'solicitar' && id === 'proximas');
            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'page' : undefined}
                style={{ ...S.navItem(isActive), display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}
                onClick={() => { setPage(id); if (isMobile) setIsSidebarOpen(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setPage(id); if (isMobile) setIsSidebarOpen(false); } }}
              >
                {icon} {label}
                {id === 'minhas' && (unreadMatchesCount > 0 || unreadMessagesCount > 0) && (
                  <span aria-label="Notificações não lidas" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', background: BRAND.danger, borderRadius: '50%' }} />
                )}
              </div>
            );
          })}
        </nav>
        <div style={S.sidebarFooter}>
          <button style={S.logoutBtn} onClick={logout}>Log Out</button>
        </div>
      </aside>
      <main style={S.main}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {renderPage()}
        </div>
        {unreadMatchesCount > 0 && sessionStorage.getItem('matchToastShown') !== 'true' && (
          <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: BRAND.white, padding: '16px 20px', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', borderLeft: `4px solid ${BRAND.success}`, display: 'flex', gap: '12px', alignItems: 'center', zIndex: 9999 }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: BRAND.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={16} color={BRAND.success} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: BRAND.text }}>Viagem Encontrada!</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: BRAND.textMuted }}>Foi encontrado um match para a sua viagem.</p>
            </div>
            <button onClick={() => { sessionStorage.setItem('matchToastShown', 'true'); setPage('minhas'); }} style={{ marginLeft: '12px', padding: '6px 12px', background: BRAND.success, color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Ver</button>
          </div>
        )}
      </main>
    </div>
  );
}
