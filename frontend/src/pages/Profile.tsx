import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auth } from '../lib/firebase';
import { S, BRAND } from '../lib/design';
import { formatLicensePlate, isValidLicensePlate } from '../lib/utils';


const fetchTrips = async (token: string) => {
  const res = await fetch('http://localhost:3000/api/trips', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  return res.json().then(data => data.trips);
};

export const Profile = () => {
  const { user, dbUser, updateDbUser } = useAuth();
  const queryClient = useQueryClient();

  // Personal Info Edit State
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [username, setUsername] = useState(dbUser?.username || '');
  const [phone, setPhone] = useState(dbUser?.phone || '');
  const [profileError, setProfileError] = useState('');

  // Vehicle Info Edit State
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
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
  const vObj = getVehicleObj();
  const [vehicleBrand, setVehicleBrand] = useState(vObj.brand);
  const [vehiclePlate, setVehiclePlate] = useState(vObj.plate);

  const { data: trips = [] } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("No token");
      return fetchTrips(token);
    },
    enabled: !!user
  });

  const stats = useMemo(() => {
    if (!dbUser) return { total: 0, created: 0, completed: 0, passengers: 0 };
    const now = new Date();
    
    const myTripsRaw = trips.filter((t: any) => t.userId === dbUser.id || t.participants?.some((p: any) => p.userId === dbUser.id));
    const providerTrips = trips.filter((t: any) => t.userId === dbUser.id && t.type === 'PROVIDER');
    
    // Filter trips that are in the past and NOT cancelled
    const pastProviderTrips = providerTrips.filter((t: any) => new Date(t.departureTime) < now && t.status !== 'CANCELLED');
    const pastAllTrips = myTripsRaw.filter((t: any) => new Date(t.departureTime) < now && t.status !== 'CANCELLED');
    
    return {
      total: myTripsRaw.length,
      created: providerTrips.length,
      completed: pastAllTrips.length,
      passengers: pastProviderTrips.reduce((acc: number, t: any) => acc + (t.participants?.length || 0), 0)
    };
  }, [trips, dbUser]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { username: string, phone: string, vehicleInfo: string }) => {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao atualizar perfil');
      }
      return res.json();
    },
    onSuccess: (data) => {
      updateDbUser(data);
      queryClient.invalidateQueries({ queryKey: ['dbUser'] });
      setIsEditingPersonal(false);
      setIsEditingVehicle(false);
      setProfileError('');
    },
    onError: (err: any) => {
      setProfileError(err.message || 'Erro ao guardar alterações.');
    }
  });

  const handleSavePersonal = () => {
    setProfileError('');
    const digits = phone.replace(/\D/g, '');
    if (phone && digits.length !== 9) {
      setProfileError('O telemóvel deve ter exactamente 9 dígitos.');
      return;
    }
    updateProfileMutation.mutate({ 
      username, 
      phone, 
      vehicleInfo: dbUser?.vehicleInfo || '' 
    });
  };

  const handleSaveVehicle = () => {
    setProfileError('');
    if (vehiclePlate && !isValidLicensePlate(vehiclePlate)) {
      setProfileError('A matrícula introduzida é inválida. Use o formato XX-XX-XX.');
      return;
    }
    const vInfoStr = JSON.stringify({ brand: vehicleBrand, plate: vehiclePlate });
    updateProfileMutation.mutate({ 
      username: dbUser?.username || '', 
      phone: dbUser?.phone || '', 
      vehicleInfo: vInfoStr 
    });
  };

  const joinedDate = dbUser?.createdAt 
    ? new Date(dbUser.createdAt).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
    : 'março 2026';

  const userInitials = (dbUser?.username || user?.email || "U").substring(0, 2).toUpperCase();
  const userAvatar = dbUser?.avatarUrl || user?.photoURL || "";
  const displayName = dbUser?.username || user?.displayName || 'Colaborador';

  const [imgError, setImgError] = useState(false);
  const showFallback = !userAvatar || imgError;

  return (
    <>
      <p style={S.pageTitle}>Perfil</p>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 1fr", gap: "16px", alignItems: "start" }}>
        {/* Avatar card */}
        <div style={{ ...S.card, textAlign: "center", gridRow: "1 / 3" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: !showFallback ? "transparent" : BRAND.accentLight, border: `3px solid ${BRAND.accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: "24px", fontWeight: "700", color: BRAND.primaryLight, overflow: "hidden", padding: !showFallback ? 0 : undefined }}>
            {!showFallback ? (
              <img 
                src={userAvatar} 
                alt="Avatar" 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                onError={() => setImgError(true)}
              />
            ) : userInitials}
          </div>
          <p style={{ margin: 0, fontWeight: "700", fontSize: "16px" }}>{displayName}</p>
          <p style={{ margin: "4px 0 12px", fontSize: "13px", color: BRAND.textMuted }}>{stats.completed} viagens concluídas</p>
          <div style={{ background: BRAND.bg, borderRadius: "8px", padding: "8px", fontSize: "12.5px", color: BRAND.textMuted }}>
            Membro desde {joinedDate}
          </div>
        </div>
        
        {/* Info pessoal */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>Informações Pessoais</p>
            {!isEditingPersonal && !isEditingVehicle && (
              <button style={S.btnSecondary} onClick={() => {
                setUsername(dbUser?.username || '');
                setPhone(dbUser?.phone || '');
                setIsEditingPersonal(true);
              }}>Editar</button>
            )}
          </div>
          
          {isEditingPersonal ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
               <div>
                  <label style={S.label}>Nome</label>
                  <input style={S.input} value={username} onChange={e => setUsername(e.target.value)} />
               </div>
               <div>
                  <label style={S.label}>Telemóvel</label>
                  <input style={S.input} value={phone} onChange={e => setPhone(e.target.value)} />
               </div>
               <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button style={S.btnPrimary} onClick={handleSavePersonal} disabled={updateProfileMutation.isPending}>Guardar</button>
                  <button style={S.btnSecondary} onClick={() => { setIsEditingPersonal(false); setProfileError(''); }}>Cancelar</button>
               </div>
               {profileError && <p style={{ color: BRAND.danger, fontSize: '12px', marginTop: '6px' }}>{profileError}</p>}
            </div>
          ) : (
            [["Nome", displayName], ["E-mail", user?.email || ""], ["Telemóvel", dbUser?.phone || "—"], ["Localização", "Portugal"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                <span style={{ fontSize: "13px", color: BRAND.textMuted }}>{k}</span>
                <span style={{ fontSize: "13px", fontWeight: "500" }}>{v}</span>
              </div>
            ))
          )}
        </div>
        
        {/* Veículo */}
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ margin: 0, fontWeight: "600", fontSize: "14px" }}>Veículo Pessoal</p>
            {!isEditingPersonal && !isEditingVehicle && (
              <button style={S.btnSecondary} onClick={() => {
                const updatedVObj = getVehicleObj();
                setVehicleBrand(updatedVObj.brand || '');
                setVehiclePlate(updatedVObj.plate || '');
                setIsEditingVehicle(true);
              }}>Editar</button>
            )}
          </div>
          {isEditingVehicle ? (
             <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={S.label}>Viatura (Marca e Modelo)</label>
                  <input style={S.input} value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} />
                </div>
                <div>
                  <label style={S.label}>Matrícula</label>
                  <input style={S.input} value={vehiclePlate} onChange={e => setVehiclePlate(formatLicensePlate(e.target.value))} maxLength={8} />
                </div>
                 <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                   <button style={S.btnPrimary} onClick={handleSaveVehicle} disabled={updateProfileMutation.isPending}>Guardar</button>
                   <button style={S.btnSecondary} onClick={() => { setIsEditingVehicle(false); setProfileError(''); }}>Cancelar</button>
                </div>
                {profileError && <p style={{ color: BRAND.danger, fontSize: '12px', marginTop: '6px' }}>{profileError}</p>}
             </div>
          ) : (
            [["Viatura", vObj.brand || "—"], ["Matrícula", vObj.plate || "—"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                <span style={{ fontSize: "13px", color: BRAND.textMuted }}>{k}</span>
                <span style={{ fontSize: "13px", fontWeight: "500" }}>{v}</span>
              </div>
            ))
          )}
        </div>
        
        {/* Estatísticas */}
        <div style={{ ...S.card, gridColumn: "2 / 4" }}>
          <p style={{ margin: "0 0 12px", fontWeight: "600", fontSize: "14px" }}>Estatísticas</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            {[
              ["Viagens Criadas", stats.created], 
              ["Viagens Concluídas", stats.completed], 
              ["Pessoas Transportadas", stats.passengers]
            ].map(([k, v]) => (
              <div key={k} style={{ background: BRAND.bg, borderRadius: "8px", padding: "12px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: BRAND.primaryLight }}>{v}</p>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: BRAND.textMuted }}>{k}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
