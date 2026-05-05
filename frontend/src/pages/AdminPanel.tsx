import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { S, BRAND } from '../lib/design';
import { API_BASE_URL } from '../lib/constants';

const fetchUsers = async (token: string) => {
  const res = await fetch(`${API_BASE_URL}/users`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

const fetchCities = async (token: string) => {
  const res = await fetch(`${API_BASE_URL}/cities`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const AdminPanel = () => {
  const queryClient = useQueryClient(); const { getToken } = useAuth();
  const [tab, setTab] = useState("users");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [newCityName, setNewCityName] = useState("");
  const [isOfficeCheck, setIsOfficeCheck] = useState(false);
  const [cityError, setCityError] = useState("");

  // User list states
  const [userSearch, setUserSearch] = useState("");
  const [userPrivFilter, setUserPrivFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;
  const [cityPage, setCityPage] = useState(1);
  const citiesPerPage = 20;
  const [citySearch, setCitySearch] = useState("");

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin_users'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      return fetchUsers(token);
    }
  });

  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      return fetchCities(token);
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, action, value }: { id: string, action: 'verify' | 'admin', value: boolean }) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/users/${id}/${action}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(action === 'verify' ? { isVerified: value } : { isAdmin: value })
      });
      if (!res.ok) throw new Error(`Erro ao atualizar user ${action}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users'] });
    },
    onError: (err: any) => {
      if (err.message.includes('Forbidden')) {
        alert("A sua sessão de administrador expirou ou os seus privilégios foram revogados. Por favor, recarregue a página.");
        window.location.reload();
      } else {
        alert(err.message);
      }
    }
  });

  const saveCityMutation = useMutation({
    mutationFn: async ({ name, isOffice, isActive }: any) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/cities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, isOffice, isActive })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro ao salvar cidade`);
      }
      return res.json();
    },
    onSuccess: () => {
      setNewCityName('');
      setIsOfficeCheck(false);
      setCityError("");
      queryClient.invalidateQueries({ queryKey: ['cities'] });
    },
    onError: (err: any) => {
      if (err.message.includes('Forbidden')) {
        setCityError("Permissão negada. A sua conta deixou de ter privilégios de administrador.");
        setTimeout(() => window.location.reload(), 3000);
      } else {
        setCityError(err.message);
      }
    }
  });

  const handleToggleVerification = (id: string, currentVerified: boolean) => {
    updateUserMutation.mutate({ id, action: 'verify', value: !currentVerified });
  };

  const handleToggleAdmin = (id: string, currentAdmin: boolean) => {
    updateUserMutation.mutate({ id, action: 'admin', value: !currentAdmin });
  };

  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    setCityError("");
    if (!newCityName.trim()) return;
    saveCityMutation.mutate({ name: newCityName, isOffice: isOfficeCheck, isActive: true });
  }

  const handleToggleCityStatus = (city: any) => {
    saveCityMutation.mutate({ name: city.name, isOffice: city.isOffice, isActive: !city.isActive });
  }

  return (
    <>
      <p style={S.pageTitle}>Administração</p>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button style={S.tab(tab === "users")} onClick={() => setTab("users")}>Utilizadores e Permissões</button>
        <button style={S.tab(tab === "cidades")} onClick={() => setTab("cidades")}>Escritórios e Cidades</button>
      </div>

      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "nowrap", overflowX: "auto" }}>
            <input
              style={{ ...S.input, maxWidth: "300px" }}
              placeholder="Pesquisar por nome ou e-mail..."
              value={userSearch}
              onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
            />
            <select
              style={{ ...S.input, width: "180px", flexShrink: 0 }}
              value={userPrivFilter}
              onChange={e => { setUserPrivFilter(e.target.value); setUserPage(1); }}
            >
              <option value="">Todos os privilégios</option>
              <option value="admin">Administrador</option>
              <option value="colaborador">Colaborador</option>
            </select>
          </div>
          <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={S.table}>
                <thead><tr>
                  <th style={S.th}>Nome e E-mail</th>
                  <th style={S.th}>Acesso</th>
                  <th style={S.th}>Privilégios</th>
                  <th style={S.th}>Ações</th>
                </tr></thead>
                <tbody>
                  {usersLoading ? (
                    <tr><td colSpan={4} style={{ ...S.td, textAlign: "center" }}>A carregar...</td></tr>
                  ) : (() => {
                    const filtered = (users || [])
                      .filter((u: any) => {
                        const matchesSearch = (u.username || "").toLowerCase().includes(userSearch.toLowerCase()) || (u.email || "").toLowerCase().includes(userSearch.toLowerCase());
                        const matchesPriv = !userPrivFilter || (userPrivFilter === "admin" ? u.isAdmin : !u.isAdmin);
                        return matchesSearch && matchesPriv;
                      })
                      .sort((a: any, b: any) => (a.username || "").localeCompare(b.username || ""));

                    const totalPages = Math.ceil(filtered.length / usersPerPage);
                    const start = (userPage - 1) * usersPerPage;
                    const paginated = filtered.slice(start, start + usersPerPage);

                    if (paginated.length === 0) {
                      return <tr><td colSpan={4} style={{ ...S.td, textAlign: "center" }}>Nenhum utilizador encontrado.</td></tr>;
                    }

                    return (
                      <>
                        {paginated.map((u: any) => (
                          <tr key={u.id}>
                            <td style={S.td}>
                              <p style={{ margin: 0, fontWeight: "500" }}>{u.username || 'Sem Nome'}</p>
                              <p style={{ margin: 0, fontSize: "12px", color: BRAND.textMuted }}>{u.email}</p>
                            </td>
                            <td style={S.td}>
                              <span style={S.badge(u.isVerified ? "green" : "yellow")}>{u.isVerified ? "Aprovado" : "Pendente"}</span>
                            </td>
                            <td style={S.td}>
                              {u.isAdmin ? 'Administrador' : 'Colaborador'}
                            </td>
                            <td style={S.td}>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {u.isVerified ? (
                                  <button style={{ ...S.btnDanger, padding: "5px 10px", fontSize: "12px" }} onClick={() => handleToggleVerification(u.id, u.isVerified)}>Revogar Acesso</button>
                                ) : (
                                  <button style={{ ...S.btnReserve, padding: "5px 10px", fontSize: "12px" }} onClick={() => handleToggleVerification(u.id, u.isVerified)}>Aprovar Conta</button>
                                )}
                                {u.isAdmin ? (
                                  <button style={{ ...S.btnSecondary, padding: "5px 10px", fontSize: "12px" }} onClick={() => handleToggleAdmin(u.id, u.isAdmin)}>Remover Admin</button>
                                ) : (
                                  <button style={{ ...S.btnSecondary, padding: "5px 10px", fontSize: "12px" }} onClick={() => handleToggleAdmin(u.id, u.isAdmin)}>Tornar Admin</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {totalPages > 1 && (
                          <tr>
                            <td colSpan={4} style={{ padding: "12px", borderTop: `1px solid ${BRAND.border}` }}>
                              <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
                                <button
                                  disabled={userPage === 1}
                                  onClick={() => setUserPage(p => p - 1)}
                                  style={{ ...S.btnSecondary, padding: "4px 12px", fontSize: "12px" }}
                                >
                                  Anterior
                                </button>
                                <span style={{ fontSize: "12px", fontWeight: "600" }}>Página {userPage} de {totalPages}</span>
                                <button
                                  disabled={userPage === totalPages}
                                  onClick={() => setUserPage(p => p + 1)}
                                  style={{ ...S.btnSecondary, padding: "4px 12px", fontSize: "12px" }}
                                >
                                  Próxima
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "cidades" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: "16px", alignItems: "start" }}>
          <div style={S.card}>
            <p style={{ margin: "0 0 14px", fontWeight: "600", fontSize: "14px" }}>Nova Localidade</p>
            <form onSubmit={handleAddCity}>
              <div style={S.formGroup}>
                <label style={S.label}>Nome da Localidade</label>
                <input style={S.input} placeholder="Ex: Porto" value={newCityName} onChange={e => setNewCityName(e.target.value)} required />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px", cursor: "pointer", marginBottom: "16px" }}>
                <input type="checkbox" checked={isOfficeCheck} onChange={e => setIsOfficeCheck(e.target.checked)} /> Marcar como Escritório LOBA
              </label>
              <button type="submit" style={S.submitBtn} disabled={saveCityMutation.isPending}>{saveCityMutation.isPending ? 'A adicionar...' : 'Adicionar Localidade'}</button>
              {cityError && <p style={{ color: BRAND.danger, fontSize: "12px", marginTop: "8px" }}>{cityError}</p>}
            </form>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              style={{ ...S.input }}
              placeholder="Pesquisar localidade..."
              value={citySearch}
              onChange={e => { setCitySearch(e.target.value); setCityPage(1); }}
            />
            <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Localidade</th>
                    <th style={S.th}>Tipo</th>
                    <th style={S.th}>Estado</th>
                    <th style={S.th}>Ação</th>
                  </tr></thead>
                  <tbody>
                    {citiesLoading ? (
                      <tr><td colSpan={4} style={{ ...S.td, textAlign: "center" }}>A carregar...</td></tr>
                    ) : (() => {
                      const sortedCities = [...(cities || [])]
                        .filter((c: any) => (c.name || "").toLowerCase().includes(citySearch.toLowerCase()))
                        .sort((a: any, b: any) => {
                          if (a.isOffice !== b.isOffice) return a.isOffice ? -1 : 1;
                          return (a.name || "").localeCompare(b.name || "");
                        });
                      const totalCityPages = Math.ceil(sortedCities.length / citiesPerPage);
                      const paginatedCities = sortedCities.slice((cityPage - 1) * citiesPerPage, cityPage * citiesPerPage);
                      return (
                        <>
                          {paginatedCities.map((c: any) => (
                            <tr key={c.id} style={{ opacity: c.isActive ? 1 : 0.5 }}>
                              <td style={S.td}>{c.name}</td>
                              <td style={S.td}><span style={S.badge(c.isOffice ? "green" : "yellow")}>{c.isOffice ? "Escritório" : "Concelho"}</span></td>
                              <td style={S.td}><span style={S.badge(c.isActive ? "green" : "danger")}>{c.isActive ? "Ativa" : "Desativada"}</span></td>
                              <td style={S.td}>
                                <button style={{ ...(c.isActive ? S.btnDanger : S.btnSecondary), padding: "5px 10px", fontSize: "12px" }} onClick={() => handleToggleCityStatus(c)}>
                                  {c.isActive ? "Ocultar" : "Mostrar"}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {totalCityPages > 1 && (
                            <tr>
                              <td colSpan={4} style={{ padding: "12px", borderTop: `1px solid ${BRAND.border}` }}>
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
                                  <button disabled={cityPage === 1} onClick={() => setCityPage(p => p - 1)} style={{ ...S.btnSecondary, padding: "4px 12px", fontSize: "12px" }}>Anterior</button>
                                  <span style={{ fontSize: "12px", fontWeight: "600" }}>Página {cityPage} de {totalCityPages}</span>
                                  <button disabled={cityPage === totalCityPages} onClick={() => setCityPage(p => p + 1)} style={{ ...S.btnSecondary, padding: "4px 12px", fontSize: "12px" }}>Próxima</button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
