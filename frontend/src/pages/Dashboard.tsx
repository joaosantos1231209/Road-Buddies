import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../lib/firebase';
import { useLocation } from 'wouter';
import { S, BRAND } from '../lib/design';
import { Profile } from './Profile';
import { AdminPanel } from './AdminPanel';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn, formatLicensePlate, isValidLicensePlate } from "@/lib/utils";
import { ChevronsUpDown, Check, Home, CalendarDays, History, User, Settings, MessageSquare } from "lucide-react";

// --- Subcomponents for City Selector ---
function CitySelector({ value, onChange, citiesData, placeholder = 'Pesquisar cidade...' }: { value: string, onChange: (val: string) => void, citiesData: any[], placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const offices = citiesData.filter((c: any) => c.isOffice).sort((a: any, b: any) => a.name.localeCompare(b.name));
  const regularCities = citiesData.filter((c: any) => !c.isOffice).sort((a: any, b: any) => a.name.localeCompare(b.name));

  const getCityName = (id: string) => {
    const city = citiesData.find((c: any) => c.id.toString() === id.toString());
    return city ? city.name : "...";
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" style={{ ...(S.input as any), display: "flex", justifyContent: "space-between", alignItems: "center", background: BRAND.white, color: value ? BRAND.text : BRAND.textMuted, cursor: "pointer", textAlign: "left" }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value ? getCityName(value) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Escreva para pesquisar..." />
          <CommandList>
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup heading="📍 Escritórios LOBA">
              {offices.map((c: any) => (
                <CommandItem key={c.id} value={c.name} onSelect={() => { onChange(c.id.toString()); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === c.id.toString() ? "opacity-100" : "opacity-0")} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Todos os Concelhos">
              {regularCities.map((c: any) => (
                <CommandItem key={c.id} value={c.name} onSelect={() => { onChange(c.id.toString()); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value === c.id.toString() ? "opacity-100" : "opacity-0")} />
                  {c.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const fetchTrips = async (token: string) => {
  const res = await fetch('http://localhost:3000/api/trips', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Falha ao carregar viagens');
  return res.json().then(data => data.trips);
};

// --- Subcomponents for Header ---
function Header({ onNavigate, showActions = true, userInitials = "U", userAvatar = "" }: any) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !userAvatar || imgError;

  return (
    <div style={S.header}>
      <div style={S.headerLeft}>
        {showActions && (
          <>
            <button style={S.btnPrimary} onClick={() => onNavigate("solicitar")}>
              Solicitar Viatura (SP)
            </button>
            <button style={S.btnSecondary} onClick={() => onNavigate("criar")}>
              Criar Oferta / Pedido
            </button>
          </>
        )}
      </div>
      <div
        style={{ ...S.avatar, overflow: "hidden", background: !showFallback ? "transparent" : BRAND.accentLight, padding: !showFallback ? 0 : undefined }}
        onClick={() => onNavigate("perfil")}
        title="Ver Perfil"
      >
        {!showFallback ? (
          <img
            src={userAvatar}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgError(true)}
          />
        ) : userInitials}
      </div>
    </div>
  );
}


export default function Dashboard() {
  const { user, dbUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [page, setPage] = useState('dashboard');

  // Logic states
  const [activeTabProx, setActiveTabProx] = useState('ofertas');
  const [activeTabMinhas, setActiveTabMinhas] = useState<'proximas' | 'matches' | 'historico' | 'pedidos'>('proximas');

  const [tripType, setTripType] = useState('NEEDRIDE');
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [date, setDate] = useState('');
  const [seats, setSeats] = useState(1);
  const [viatura, setViatura] = useState("Viatura Pessoal");
  const [companyBrand, setCompanyBrand] = useState("");
  const [companyPlate, setCompanyPlate] = useState("");
  const [spDate, setSpDate] = useState('');
  const [spJustification, setSpJustification] = useState('');

  // Filters for Próximas Viagens
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Pagination states
  const [pageOffers, setPageOffers] = useState(1);
  const [pageRequests, setPageRequests] = useState(1);
  const [pageUpcoming, setPageUpcoming] = useState(1);
  const itemsPerPage = 10;

  // History Detail State
  const [selectedHistoryTrip, setSelectedHistoryTrip] = useState<any>(null);

  // Form error state
  const [createError, setCreateError] = useState("");

  const getVehicleObj = () => {
    if (!dbUser?.vehicleInfo) return { brand: "", plate: "" };
    try {
      const parsed = JSON.parse(dbUser.vehicleInfo);
      if (parsed.brand !== undefined) return parsed;
      return { brand: dbUser.vehicleInfo, plate: "" };
    } catch {
      return { brand: dbUser.vehicleInfo, plate: "" };
    }
  };
  const personalVehicle = getVehicleObj();
  const personalVehicleString = `${personalVehicle.brand || '---'} ${personalVehicle.plate ? `- ${personalVehicle.plate}` : ''}`.trim();

  const getTripVehicleString = (t: any) => {
    if (t.type !== 'PROVIDER') return '';
    const fallback = t.vehicleType || "Viatura";

    let infoStr = t.tripVehicleDetails;
    if (t.vehicleType === 'Viatura Pessoal') {
      infoStr = t.creator?.vehicleInfo || infoStr;
    }

    if (!infoStr) return fallback;
    try {
      const v = JSON.parse(infoStr);
      return `${v.brand || ''} ${v.plate ? `- ${v.plate}` : ''}`.trim() || fallback;
    } catch {
      return infoStr;
    }
  };

  const { data: citiesData = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/cities', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user
  });

  const getCityName = (id: number | string) => {
    const city = citiesData.find((c: any) => c.id.toString() === id.toString());
    return city ? city.name : `...`;
  };

  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No token");
      return fetchTrips(token);
    },
    enabled: !!user
  });

  const createTripMutation = useMutation({
    mutationFn: async (newTrip: any) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTrip)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao criar viagem');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      setPage('proximas');
      setCreateError("");
    },
    onError: (error: Error) => {
      setCreateError(error.message);
    }
  });

  const joinTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`http://localhost:3000/api/trips/${tripId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao juntar viagem');
      }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trips'] }); },
    onError: (error: Error) => {
      alert(error.message);
    }
  });

  const leaveTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`http://localhost:3000/api/trips/${tripId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao cancelar reserva');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error: Error) => { alert(error.message); }
  });

  const cancelTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`http://localhost:3000/api/trips/${tripId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao cancelar viagem');
      }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trips'] }); },
    onError: (error: Error) => { alert(error.message); }
  });

  const createSpRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/sp-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao submeter solicitação');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spRequests'] });
      setOrigin('');
      setDestination('');
      setSpDate('');
      setSpJustification('');
      setPage('minhas');
    },
    onError: (error: Error) => { alert(error.message); }
  });

  const { data: spRequestsData = [] } = useQuery({
    queryKey: ['spRequests'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/sp-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json().then((d: any) => d.requests);
    },
    enabled: !!user
  });

  const { data: matchesData } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/matches', { headers: { Authorization: `Bearer ${token}` } });
      return res.json().then((d: any) => d.matches || []);
    },
    enabled: !!user,
    refetchInterval: 15000
  });

  const { data: unreadChats } = useQuery({
    queryKey: ['unreadChats'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/messages/unread', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 10000
  });

  const markMatchesReadMutation = useMutation({
    mutationFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      return fetch('http://localhost:3000/api/matches/mark-read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['matches'] }); }
  });

  const unreadMatchesCount = matchesData?.filter((m: any) => !m.isRead).length || 0;
  const unreadMessagesCount = unreadChats?.unreadCount || 0;

  // Otimista: se estamos na aba matches, ignoramos o count para apagar logo a bola vermelha no menu
  const displayUnreadMatchesCount = activeTabMinhas === "matches" && page === "minhas" ? 0 : unreadMatchesCount;

  useEffect(() => {
    if (activeTabMinhas === "matches" && unreadMatchesCount > 0) {
      markMatchesReadMutation.mutate();
    }
  }, [activeTabMinhas, unreadMatchesCount]);

  useEffect(() => {
    if (page === 'admin' && dbUser && !dbUser.isAdmin) {
      setPage('dashboard');
    }
  }, [page, dbUser?.isAdmin]);

  const todayStr = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  })();
  const todayDateStr = (() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (origin === destination) {
      setCreateError("A origem e o destino têm de ser diferentes.");
      return;
    }

    let finalVehicleType = tripType === 'PROVIDER' ? viatura : null;
    let finalVehicleDetails = null;

    if (tripType === 'PROVIDER') {
      if (viatura === 'Viatura Pessoal') {
        if (!dbUser?.vehicleInfo) {
          setCreateError("Selecionou viatura pessoal mas não tem viatura pessoal associada à sua conta. Dirija-se ao seu perfil e preencha os dados da sua viatura.");
          return;
        }
        finalVehicleDetails = dbUser?.vehicleInfo;
      } else {
        if (!companyBrand.trim() || !companyPlate.trim()) {
          setCreateError("Por favor, preencha todos os dados da viatura da empresa.");
          return;
        }
        if (!isValidLicensePlate(companyPlate)) {
          setCreateError("A matrícula da viatura da empresa é inválida. Use o formato XX-XX-XX.");
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
      vehicleType: finalVehicleType,
      tripVehicleDetails: finalVehicleDetails
    });
  };

  const now = new Date();
  const upcomingTrips = trips?.filter((t: any) => new Date(t.departureTime) >= now) || [];
  const providerTrips = upcomingTrips.filter((t: any) => {
    if (t.type !== 'PROVIDER') return false;
    const isMine = t.userId === dbUser?.id;
    const isParticipant = t.participants?.some((p: any) => p.userId === dbUser?.id);
    if (isMine || isParticipant) return false; // hide my own or trips I joined
    if (t.availableSeats <= 0) return false; // hide full trips
    return true;
  });
  const needRideTrips = upcomingTrips.filter((t: any) => {
    if (t.type !== 'NEEDRIDE') return false;
    if (t.userId === dbUser?.id) return false; // hide my own requests
    return true;
  });

  const myTripsRaw = trips?.filter((t: any) => t.userId === dbUser?.id || t.participants?.some((p: any) => p.userId === dbUser?.id)) || [];
  const myUpcomingTrips = myTripsRaw
    .filter((t: any) => new Date(t.departureTime) >= now)
    .sort((a: any, b: any) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  const myPastTrips = myTripsRaw
    .filter((t: any) => new Date(t.departureTime) < now)
    .sort((a: any, b: any) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());

  const userInitials = (dbUser?.username || user?.email || "U").substring(0, 2).toUpperCase();
  const userAvatar = dbUser?.avatarUrl || user?.photoURL || "";

  // Pages
  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Header onNavigate={setPage} userInitials={userInitials} userAvatar={userAvatar} />
      <div style={S.content}>
        <p style={S.pageTitle}>Dashboard</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${BRAND.primaryLight}` }} onClick={() => setPage("proximas")}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: BRAND.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.primaryLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: BRAND.text }}>Próximas Viagens</p>
                  <p style={{ margin: 0, fontSize: "12px", color: BRAND.textMuted }}>Ofertas e pedidos de boleia</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, background: BRAND.primarySurface, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: BRAND.primaryLight }}>{providerTrips.length}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: BRAND.textMuted }}>Ofertas disponíveis</p>
                </div>
                <div style={{ flex: 1, background: BRAND.accentLight, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: BRAND.accent }}>{needRideTrips.length}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: BRAND.textMuted }}>Pedidos ativos</p>
                </div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "12.5px", color: BRAND.primaryLight, fontWeight: "500" }}>Ver todas as viagens →</p>
            </div>

            <div style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${BRAND.success}` }} onClick={() => setPage("minhas")}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: BRAND.successBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: "700", fontSize: "15px", color: BRAND.text }}>Minhas Viagens</p>
                  <p style={{ margin: 0, fontSize: "12px", color: BRAND.textMuted }}>Histórico e pedidos de viatura</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1, background: BRAND.successBg, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: BRAND.success }}>{myPastTrips.length}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: BRAND.textMuted }}>Viagens concluídas</p>
                </div>
                <div style={{ flex: 1, background: BRAND.warningBg, borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: BRAND.warning }}>{myUpcomingTrips.length}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: BRAND.textMuted }}>Viagens futuras</p>
                </div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: "12.5px", color: BRAND.success, fontWeight: "500" }}>Ver o meu histórico →</p>
            </div>
          </div>

          <div style={{ ...S.card, background: `linear-gradient(135deg, ${BRAND.primary} 0%, ${BRAND.primaryLight} 100%)`, border: "none" }}>
            <p style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#fff" }}>Vantagens de Partilhar Viagens</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { icon: "💰", title: "Economize até 70%", desc: "Reduza os seus custos de deslocação partilhando viagem com colegas." },
                { icon: "🌿", title: "Reduza a pegada ambiental", desc: "Menos carros na estrada significa menos emissões de CO₂." },
                { icon: "🤝", title: "Conheça novas pessoas", desc: "Crie laços com colegas de outros departamentos e escritórios." },
                { icon: "⏱️", title: "Viagens mais rápidas", desc: "Acesso a vias de alta ocupação e lugares de estacionamento prioritários." },
              ].map((v) => (
                <div key={v.title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "20px", lineHeight: 1 }}>{v.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: "600", fontSize: "13.5px", color: "#fff" }}>{v.title}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProximas = () => {
    const isOffers = activeTabProx === "ofertas";
    const baseList = isOffers ? providerTrips : needRideTrips;
    const filteredList = (baseList || []).filter((t: any) => {
      if (filterOrigin && t.originId.toString() !== filterOrigin) return false;
      if (filterDestination && t.destinationId.toString() !== filterDestination) return false;
      if (filterDate && !new Date(t.departureTime).toLocaleDateString('sv-SE').startsWith(filterDate)) return false;
      return true;
    }).sort((a: any, b: any) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());

    const totalPages = Math.ceil(filteredList.length / itemsPerPage);
    const currentPage = isOffers ? pageOffers : pageRequests;
    const setCurrentPage = isOffers ? setPageOffers : setPageRequests;
    const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Header onNavigate={setPage} userInitials={userInitials} userAvatar={userAvatar} />
        <div style={S.content}>
          <p style={S.pageTitle}>Próximas Viagens</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button style={S.tab(isOffers)} onClick={() => setActiveTabProx("ofertas")}>Ofertas de Boleia</button>
            <button style={S.tab(!isOffers)} onClick={() => setActiveTabProx("pedidos")}>Pedidos de Boleia</button>
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", background: BRAND.bg, padding: "12px", borderRadius: "10px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: BRAND.textMuted, whiteSpace: "nowrap" }}>Filtrar por:</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ minWidth: "160px" }}><CitySelector value={filterOrigin} onChange={(v) => { setFilterOrigin(v); setPageOffers(1); setPageRequests(1); }} citiesData={citiesData} placeholder="Origem" /></div>
              {filterOrigin && <button style={{ background: "none", border: "none", cursor: "pointer", color: BRAND.textMuted, fontSize: "16px", lineHeight: 1 }} onClick={() => { setFilterOrigin(''); setPageOffers(1); setPageRequests(1); }} title="Limpar origem">×</button>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ minWidth: "160px" }}><CitySelector value={filterDestination} onChange={(v) => { setFilterDestination(v); setPageOffers(1); setPageRequests(1); }} citiesData={citiesData} placeholder="Destino" /></div>
              {filterDestination && <button style={{ background: "none", border: "none", cursor: "pointer", color: BRAND.textMuted, fontSize: "16px", lineHeight: 1 }} onClick={() => { setFilterDestination(''); setPageOffers(1); setPageRequests(1); }} title="Limpar destino">×</button>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <input style={{ ...S.input, minWidth: "130px", fontSize: "13px" }} type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPageOffers(1); setPageRequests(1); }} />
              {filterDate && <button style={{ background: "none", border: "none", cursor: "pointer", color: BRAND.textMuted, fontSize: "16px", lineHeight: 1 }} onClick={() => { setFilterDate(''); setPageOffers(1); setPageRequests(1); }} title="Limpar data">×</button>}
            </div>
            {(filterOrigin || filterDestination || filterDate) && (
              <button style={{ ...S.btnSecondary, fontSize: "12px", padding: "6px 10px" }} onClick={() => { setFilterOrigin(''); setFilterDestination(''); setFilterDate(''); setPageOffers(1); setPageRequests(1); }}>Limpar Tudo</button>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", paddingBottom: "20px" }}>
            {paginatedList.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: BRAND.textMuted }}>Nenhuma viagem encontrada com os filtros selecionados.</div>
            ) : paginatedList.map((t: any) => {
              const isMine = t.userId === dbUser?.id;
              const hasJoined = t.participants?.some((p: any) => p.userId === dbUser?.id);
              const isFull = t.availableSeats <= 0;
              return (
                <div key={t.id} style={S.travelCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <p style={S.travelCardTitle}>
                      {t.creator?.username || `User #${t.userId}`}
                      {isMine && <span style={{ fontSize: "11px", background: BRAND.primarySurface, color: BRAND.primaryLight, borderRadius: "4px", padding: "2px 6px", marginLeft: "6px" }}>A minha viagem</span>}
                    </p>
                    <span style={S.badge(isOffers ? "green" : "yellow")}>{isOffers ? `${t.availableSeats} lugares` : 'Pedido'}</span>
                  </div>
                  <p style={S.travelCardSub}>{getCityName(t.originId)} → {getCityName(t.destinationId)}</p>
                  <p style={S.travelCardSub}>{new Date(t.departureTime).toLocaleString()}{t.type === 'PROVIDER' ? ` · ${getTripVehicleString(t)}` : ''}</p>
                  <div style={S.travelCardActions}>
                    {isMine ? (
                      <>
                        <button style={S.btnDanger} onClick={() => window.confirm('Tem a certeza que deseja cancelar esta viagem?') && cancelTripMutation.mutate(t.id)}>Cancelar</button>
                        {t.participants?.length > 0 && (
                          <button style={{ ...S.btnChat, display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setLocation(`/chat/${t.id}`)}>
                            <MessageSquare size={14} /> Chat
                          </button>
                        )}
                      </>
                    ) : hasJoined ? (
                      <><button style={S.btnDanger} onClick={() => window.confirm('Sair desta viagem?') && leaveTripMutation.mutate(t.id)}>Sair</button>
                        <button style={{ ...S.btnChat, display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setLocation(`/chat/${t.id}`)}><MessageSquare size={14} /> Chat</button></>
                    ) : (
                      <>
                        {isOffers && !isFull && <button style={S.btnReserve} onClick={() => joinTripMutation.mutate(t.id)}>Reservar</button>}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center", padding: "10px 0 30px" }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ ...S.btnSecondary, padding: "6px 16px" }}>Anterior</button>
              <span style={{ fontSize: "13px", fontWeight: "600" }}>Página {currentPage} de {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ ...S.btnSecondary, padding: "6px 16px" }}>Próxima</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMinhas = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Header onNavigate={setPage} userInitials={userInitials} userAvatar={userAvatar} />
        <div style={S.content}>
          <p style={S.pageTitle}>Minhas Viagens</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <button style={S.tab(activeTabMinhas === "proximas")} onClick={() => setActiveTabMinhas("proximas")}>Próximas Viagens</button>
            <button style={{ ...S.tab(activeTabMinhas === "matches"), position: "relative" }} onClick={() => setActiveTabMinhas("matches")}>
              Matches {unreadMatchesCount > 0 && <span style={{ position: "absolute", top: "6px", right: "6px", width: "8px", height: "8px", background: BRAND.danger, borderRadius: "50%" }} />}
            </button>
            <button style={S.tab(activeTabMinhas === "historico")} onClick={() => setActiveTabMinhas("historico")}>Histórico</button>
            <button style={S.tab(activeTabMinhas === "pedidos")} onClick={() => setActiveTabMinhas("pedidos")}>Pedidos de Viatura</button>
          </div>
          {activeTabMinhas === "proximas" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {(() => {
                const totalPageUp = Math.ceil(myUpcomingTrips.length / itemsPerPage);
                const paginatedUpcoming = myUpcomingTrips.slice((pageUpcoming - 1) * itemsPerPage, pageUpcoming * itemsPerPage);

                if (paginatedUpcoming.length === 0) {
                  return <div style={{ padding: "24px", textAlign: "center", color: BRAND.textMuted, fontSize: "13px" }}>Ainda não tem viagens agendadas.</div>;
                }

                return (
                  <>
                    {paginatedUpcoming.map((t: any) => (
                      <div key={t.id} style={S.travelCard}>
                        <p style={S.travelCardTitle}>{t.userId === dbUser?.id ? (t.type === 'PROVIDER' ? 'Minha Oferta' : 'Meu Pedido') : `Boleia Reservada (Condutor: ${t.creator?.username || 'Colega'})`}</p>
                        {t.userId === dbUser?.id && t.type === 'PROVIDER' && (
                          <span style={{ ...S.badge(t.availableSeats > 0 ? 'green' : 'yellow'), marginBottom: '4px', display: 'inline-block' }}>
                            {t.availableSeats === 0 ? 'Lugares Disponíveis: 0' : `Lugares Disponíveis: ${t.availableSeats}`}
                          </span>
                        )}
                        <p style={S.travelCardSub}>{getCityName(t.originId)} → {getCityName(t.destinationId)}</p>
                        <p style={S.travelCardSub}>{new Date(t.departureTime).toLocaleString()}{t.type === 'PROVIDER' ? ` · ${getTripVehicleString(t)}` : ''}</p>
                        <div style={S.travelCardActions}>
                          {t.userId === dbUser?.id ? (
                            <button style={S.btnDanger} onClick={() => window.confirm('Tem a certeza que deseja cancelar esta viagem?') && cancelTripMutation.mutate(t.id)}>Cancelar</button>
                          ) : (
                            <button style={S.btnDanger} onClick={() => window.confirm('Tem a certeza que deseja sair desta viagem?') && leaveTripMutation.mutate(t.id)}>Sair da Viagem</button>
                          )}
                          {t.participants?.length > 0 && (
                            <button style={{ ...S.btnChat, display: "flex", alignItems: "center", gap: "6px", position: "relative" }} onClick={() => setLocation(`/chat/${t.id}`)}>
                              <MessageSquare size={14} /> Chat
                              {unreadChats?.unreadByTrip?.[t.id] > 0 && <span style={{ position: "absolute", top: "-4px", right: "-4px", background: BRAND.danger, color: "white", fontSize: "9px", width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>{unreadChats.unreadByTrip[t.id]}</span>}
                            </button>
                          )}
                        </div>
                        {t.userId === dbUser?.id && t.type === 'PROVIDER' && t.participants?.length > 0 && (
                          <div style={{ marginTop: "12px", padding: "10px", background: BRAND.bg, borderRadius: "6px" }}>
                            <p style={{ margin: "0 0 6px", fontSize: "12px", color: BRAND.primaryLight, fontWeight: "600" }}>Lugares Reservados:</p>
                            {t.participants.map((p: any) => (
                              <p key={p.id} style={{ margin: 0, fontSize: "13px", color: BRAND.text }}>• {p.user?.username || `Utilizador #${p.userId.substring(0, 6)}`}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {totalPageUp > 1 && (
                      <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center", paddingTop: "10px" }}>
                        <button disabled={pageUpcoming === 1} onClick={() => setPageUpcoming(p => p - 1)} style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: "12px" }}>Anterior</button>
                        <span style={{ fontSize: "12px", fontWeight: "600" }}>{pageUpcoming} / {totalPageUp}</span>
                        <button disabled={pageUpcoming === totalPageUp} onClick={() => setPageUpcoming(p => p + 1)} style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: "12px" }}>Próxima</button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          {activeTabMinhas === "matches" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {!matchesData || matchesData.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: BRAND.textMuted, fontSize: "13px" }}>Ainda não foram encontrados matches para os seus pedidos.</div>
              ) : matchesData.map((m: any) => {
                return (
                  <div key={m.id} style={S.travelCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <p style={S.travelCardTitle}>{m.providerTrip?.creator?.username || "Condutor"}</p>
                      <span style={S.badge("green")}>Match Encontrado</span>
                    </div>
                    <p style={S.travelCardSub}>{getCityName(m.providerTrip?.originId)} → {getCityName(m.providerTrip?.destinationId)}</p>
                    <p style={S.travelCardSub}>{new Date(m.providerTrip?.departureTime).toLocaleString()} · {m.providerTrip?.availableSeats} lugares restantes</p>
                    <div style={S.travelCardActions}>
                      {m.status === 'PENDING' && <button style={S.btnReserve} onClick={() => joinTripMutation.mutate(m.providerTripId)} disabled={joinTripMutation.isPending}>{joinTripMutation.isPending ? 'A reservar...' : 'Reservar Lugar'}</button>}
                      {m.status === 'ACCEPTED' && <span style={{ fontSize: "13px", color: BRAND.success, fontWeight: "600" }}>Lugar Reservado!</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {activeTabMinhas === "historico" && (
            myPastTrips.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: BRAND.textMuted, fontSize: "13px" }}>
                Ainda não tem viagens no seu histórico.
              </div>
            ) : (
              <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Data</th><th style={S.th}>Origem</th><th style={S.th}>Destino</th><th style={S.th}>Estado</th><th style={S.th}>Ações</th></tr></thead>
                  <tbody>
                    {myPastTrips.map((t: any) => (
                      <tr key={t.id}>
                        <td style={S.td}>{new Date(t.departureTime).toLocaleDateString()}</td>
                        <td style={S.td}>{getCityName(t.originId)}</td>
                        <td style={S.td}>{getCityName(t.destinationId)}</td>
                        <td style={S.td}><span style={S.badge("green")}>Concluída</span></td>
                        <td style={S.td}>
                          <button
                            style={{ ...S.btnReserve, padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => setSelectedHistoryTrip(t)}
                          >
                            Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
          {activeTabMinhas === "pedidos" && (
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              {spRequestsData.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: BRAND.textMuted, fontSize: "13px" }}>Ainda não tem pedidos de viatura registados.</div>
              ) : (
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Data do Pedido</th><th style={S.th}>Origem</th><th style={S.th}>Destino</th><th style={S.th}>Data Necessária</th><th style={{ ...S.th, minWidth: "200px" }}>Justificação</th></tr></thead>
                  <tbody>
                    {spRequestsData.map((r: any) => (
                      <tr key={r.id}>
                        <td style={S.td}>{new Date(r.createdAt).toLocaleDateString('pt-PT')}</td>
                        <td style={S.td}>{r.origin?.name || '—'}</td>
                        <td style={S.td}>{r.destination?.name || '—'}</td>
                        <td style={S.td}>{new Date(r.dateNeeded).toLocaleDateString('pt-PT')}</td>
                        <td style={S.td}>
                          <div style={{ maxWidth: "300px", overflowX: "auto", whiteSpace: "nowrap", paddingBottom: "4px" }}>
                            {r.justification || '—'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
          {/* History Details Modal */}
          {selectedHistoryTrip && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
              <div style={{ ...S.card, maxWidth: "450px", width: "100%", margin: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0, color: BRAND.primary }}>Detalhes da Viagem</h3>
                  <button onClick={() => setSelectedHistoryTrip(null)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: BRAND.textMuted }}>×</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ ...S.label, marginBottom: "4px" }}>Resumo</label>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>{getCityName(selectedHistoryTrip.originId)} → {getCityName(selectedHistoryTrip.destinationId)}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: BRAND.textMuted }}>{new Date(selectedHistoryTrip.departureTime).toLocaleString('pt-PT')}</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ ...S.label, marginBottom: "4px" }}>O seu papel</label>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                        {selectedHistoryTrip.userId === dbUser?.id ? "Condutor" : "Passageiro"}
                      </p>
                    </div>
                    {selectedHistoryTrip.userId === dbUser?.id && (
                      <div>
                        <label style={{ ...S.label, marginBottom: "4px" }}>Lotação</label>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>
                          {selectedHistoryTrip.participants?.length || 0} passageiro(s)
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ ...S.label, marginBottom: "4px" }}>Viatura Utilizada</label>
                    {selectedHistoryTrip.userId === dbUser?.id ? (
                      <>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>{selectedHistoryTrip.vehicleType || "Viatura Pessoal"}</p>
                        <p style={{ margin: 0, fontSize: "12px", color: BRAND.textMuted }}>{getTripVehicleString(selectedHistoryTrip)}</p>
                      </>
                    ) : (
                      <>
                        <p style={{ margin: 0, fontSize: "14px", fontWeight: "600" }}>Viatura do Condutor</p>
                        <p style={{ margin: 0, fontSize: "12px", color: BRAND.textMuted }}>{getTripVehicleString(selectedHistoryTrip)}</p>
                      </>
                    )}
                  </div>
                </div>

                <button
                  style={{ ...S.submitBtn, marginTop: "24px" }}
                  onClick={() => setSelectedHistoryTrip(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCriar = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <Header onNavigate={setPage} userInitials={userInitials} userAvatar={userAvatar} />
      <div style={S.content}>
        <p style={S.pageTitle}>Publicar no Dashboard</p>
        <div style={{ width: "100%" }}>
          <form onSubmit={handleCreate} style={S.card}>
            <div style={S.formGroup}>
              <label style={S.label}>Tipo de Registo</label>
              <select style={S.select} value={tripType} onChange={e => setTripType(e.target.value)}>
                <option value="NEEDRIDE">Passageiro (pede boleia)</option>
                <option value="PROVIDER">Condutor (oferece boleia)</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={S.formGroup}>
                <label style={S.label}>Origem</label>
                <CitySelector value={origin} onChange={setOrigin} citiesData={citiesData} />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Destino</label>
                <CitySelector value={destination} onChange={setDestination} citiesData={citiesData} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={S.formGroup}>
                <label style={S.label}>Data</label>
                <input style={S.input} type="datetime-local" value={date} min={todayStr} onChange={e => setDate(e.target.value)} required />
              </div>
              <div style={{ ...S.formGroup, opacity: tripType === "PROVIDER" ? 1 : 0.4 }}>
                <label style={S.label}>Lugares Disponíveis</label>
                <input style={S.input} type="number" min="1" value={seats} onChange={e => setSeats(Number(e.target.value))} disabled={tripType !== "PROVIDER"} />
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
              {["Viatura Pessoal", "Viatura da Empresa"].map(v => (
                <label key={v} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13.5px", cursor: "pointer", opacity: tripType === "PROVIDER" ? 1 : 0.4 }}>
                  <input type="radio" name="viatura" value={v} checked={viatura === v} onChange={() => setViatura(v)} disabled={tripType !== "PROVIDER"} /> {v}
                </label>
              ))}
            </div>
            {tripType === "PROVIDER" && (
              <div style={{ padding: "12px", background: BRAND.primarySurface, borderRadius: "8px", marginBottom: "16px" }}>
                {viatura === "Viatura Pessoal" ? (
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: BRAND.primaryLight }}>A sua Viatura Pessoal (Perfil)</p>
                    <p style={{ margin: 0, fontSize: "14px", color: BRAND.text }}>{personalVehicleString || "Nenhuma viatura definida no perfil."}</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
            <button type="submit" style={S.submitBtn} disabled={createTripMutation.isPending}>{createTripMutation.isPending ? 'A publicar...' : 'Publicar Viagem'}</button>
            {(createError || createTripMutation.isError) && (
              <p style={{ color: BRAND.danger, fontSize: "13px", marginTop: "10px", fontWeight: "500", lineHeight: "1.4" }}>
                {createError || "Erro ao criar viagem. Verifique os dados e tente novamente."}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );

  const renderSolicitar = () => {
    const handleSubmitSp = (e: React.FormEvent) => {
      e.preventDefault();
      if (origin === destination) {
        alert("A origem e o destino têm de ser diferentes.");
        return;
      }
      createSpRequestMutation.mutate({ originId: origin, destinationId: destination, dateNeeded: spDate, justification: spJustification });
    };
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <Header onNavigate={setPage} userInitials={userInitials} userAvatar={userAvatar} />
        <div style={S.content}>
          <p style={S.pageTitle}>Solicitar Viatura</p>
          <div style={{ width: "100%" }}>
            <form onSubmit={handleSubmitSp} style={S.card}>
              <div style={{ background: BRAND.primarySurface, borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
                <p style={{ margin: 0, fontWeight: "600", color: BRAND.primaryLight }}>Colaborador</p>
                <p style={{ margin: "2px 0 0", color: BRAND.textMuted }}>{dbUser?.username || 'Utilizador'} · {user?.email} <span style={{ fontSize: "11px", color: BRAND.success }}></span></p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={S.formGroup}>
                  <label style={S.label}>Origem</label>
                  <CitySelector value={origin} onChange={setOrigin} citiesData={citiesData} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Destino</label>
                  <CitySelector value={destination} onChange={setDestination} citiesData={citiesData} />
                </div>
              </div>
              <div style={S.formGroup}><label style={S.label}>Data Necessária</label><input style={S.input} type="date" value={spDate} min={todayDateStr} onChange={e => setSpDate(e.target.value)} required /></div>
              <div style={S.formGroup}><label style={S.label}>Justificação</label><textarea style={S.textarea} value={spJustification} onChange={e => setSpJustification(e.target.value)} /></div>
              <button type="submit" style={S.submitBtn} disabled={createSpRequestMutation.isPending}>{createSpRequestMutation.isPending ? 'A enviar...' : 'Solicitar Viatura'}</button>
              {createSpRequestMutation.isError && <p style={{ color: BRAND.danger, fontSize: "13px", marginTop: "8px" }}>Erro ao submeter. Tente novamente.</p>}
            </form>
          </div>
        </div>
      </div>
    );
  };

  const getPageContent = () => {
    switch (page) {
      case 'dashboard': return renderDashboard();
      case 'proximas': return renderProximas();
      case 'minhas': return renderMinhas();
      case 'perfil': return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}><Header onNavigate={setPage} showActions={false} userInitials={userInitials} userAvatar={userAvatar} /><div style={S.content}><Profile /></div></div>;
      case 'admin': return <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}><Header onNavigate={setPage} showActions={false} userInitials={userInitials} userAvatar={userAvatar} /><div style={S.content}><AdminPanel /></div></div>;
      case 'criar': return renderCriar();
      case 'solicitar': return renderSolicitar();
      default: return renderDashboard();
    }
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
    { id: "proximas", label: "Próximas Viagens", icon: <CalendarDays size={18} /> },
    { id: "minhas", label: "Minhas Viagens", icon: <History size={18} /> },
    { id: "perfil", label: "Perfil", icon: <User size={18} /> },
    ...(dbUser?.isAdmin ? [{ id: "admin", label: "Administração", icon: <Settings size={18} /> }] : []),
  ];

  return (
    <div style={S.app}>
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <p style={S.logoTitle}>Road Buddies</p>
          <p style={S.logoSub}>Carsharing LOBA</p>
        </div>
        <nav style={S.navList}>
          {navItems.map(({ id, label, icon }) => (
            <div key={id} style={{ ...S.navItem(page === id || (page === "criar" && id === "proximas") || (page === "solicitar" && id === "proximas")), display: "flex", alignItems: "center", gap: "10px", position: "relative" }} onClick={() => setPage(id)}>
              {icon} {label}
              {id === "minhas" && (displayUnreadMatchesCount > 0 || unreadMessagesCount > 0) && (
                <span style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", width: "8px", height: "8px", background: BRAND.danger, borderRadius: "50%" }} />
              )}
            </div>
          ))}
        </nav>
        <div style={S.sidebarFooter}>
          <button style={S.logoutBtn} onClick={logout}>Log Out</button>
        </div>
      </aside>
      <main style={S.main}>
        {getPageContent()}
        {unreadMatchesCount > 0 && sessionStorage.getItem('matchToastShown') !== 'true' && (
          <div style={{ position: "fixed", bottom: "24px", right: "24px", background: BRAND.white, padding: "16px 20px", borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", borderLeft: `4px solid ${BRAND.success}`, display: "flex", gap: "12px", alignItems: "center", zIndex: 9999 }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: BRAND.successBg, display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={16} color={BRAND.success} /></div>
            <div>
              <p style={{ margin: 0, fontWeight: "700", fontSize: "14px", color: BRAND.text }}>Viagem Encontrada!</p>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: BRAND.textMuted }}>Foi encontrado um match para a sua viagem.</p>
            </div>
            <button onClick={() => { sessionStorage.setItem('matchToastShown', 'true'); setPage('minhas'); setActiveTabMinhas('matches'); }} style={{ marginLeft: "12px", padding: "6px 12px", background: BRAND.success, color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>Ver</button>
          </div>
        )}
      </main>
    </div>
  );
}
