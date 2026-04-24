import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useRoute, useLocation } from 'wouter';
import { S, BRAND } from '../lib/design';
import { API_BASE_URL } from '../lib/constants';

const fetchMessages = async (tripId: string, token: string) => {
  const res = await fetch(`${API_BASE_URL}/messages/trip/${tripId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Falha ao carregar mensagens');
  return res.json().then(data => data.messages);
};

export const Chat = () => {
  const [match, params] = useRoute("/chat/:tripId");
  const [, setLocation] = useLocation();
  const tripId = params?.tripId;
  const { user, getToken } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', tripId],
    queryFn: async () => {
      const token = await getToken();
      if (!token || !tripId) throw new Error("No token or missing trip");
      return fetchMessages(tripId, token);
    },
    enabled: !!user && !!tripId,
    refetchInterval: 3000
  });

  const { data: trips } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("No token");
      const res = await fetch(`${API_BASE_URL}/trips`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json().then(d => d.trips);
    },
    enabled: !!user
  });

  const { data: citiesData = [] } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/cities`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user
  });

  useEffect(() => {
    if (user && tripId) {
      const markRead = async () => {
        try {
          const token = await getToken();
          if (!token) return;
          await fetch(`${API_BASE_URL}/messages/trip/${tripId}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          // Invalidate immediately AND after 1 second as a safety measure
          queryClient.invalidateQueries({ queryKey: ['unreadChats'] });
          setTimeout(() => queryClient.invalidateQueries({ queryKey: ['unreadChats'] }), 1000);
        } catch (err) {
          console.error("Error marking chat read:", err);
        }
      };
      markRead();
    }
  }, [tripId, user, messages?.length]); // Re-run if count changes

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async (msgContent: string) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/messages/trip/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: msgContent })
      });
      if (!res.ok) throw new Error('Erro ao enviar mensagem');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', tripId] });
      setContent("");
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessageMutation.mutate(content);
  };

  const getCityName = (id: number) => citiesData.find((c: any) => c.id === id)?.name || "...";
  const currentTrip = trips?.find((t: any) => t.id.toString() === tripId?.toString());

  let chatTitle = `Chat da Viagem #${tripId}`;
  if (currentTrip && citiesData.length > 0) {
    const d = new Date(currentTrip.departureTime);
    const dayStr = d.toLocaleDateString('pt-PT');
    chatTitle = `Viagem de ${currentTrip.creator?.username || 'Condutor'} - ${getCityName(currentTrip.originId)} -> ${getCityName(currentTrip.destinationId)} - ${dayStr}`;
  }

  if (!match) return <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>Invalid Route</div>;

  return (
    <div style={{ ...S.app, flexDirection: "column" }}>
      <div style={{ ...S.header, flexShrink: 0 }}>
        <div style={S.headerLeft}>
          <button style={S.btnSecondary} onClick={() => setLocation("/dashboard")}>
            ← Voltar
          </button>
          <div style={{ display: "flex", flexDirection: "column", marginLeft: "12px" }}>
            <p style={{ margin: 0, fontWeight: "700", fontSize: "16px", color: BRAND.text }}>{chatTitle}</p>
            <p style={{ margin: 0, fontSize: "12px", color: BRAND.success }}>Ativo</p>
          </div>
        </div>
      </div>

      <div style={{ ...S.content, display: "flex", flexDirection: "column", background: BRAND.bg }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "20px" }}>
          {isLoading ? (
            <div style={{ textAlign: "center", color: BRAND.textMuted }}>A carregar...</div>
          ) : messages?.length === 0 ? (
            <div style={{ textAlign: "center", color: BRAND.textMuted, marginTop: "40px" }}>O chat está vazio. Diga Olá ao seu Road Buddy!</div>
          ) : (
            messages?.map((msg: any) => {
              const isMine = msg.senderId === user?.uid;
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: BRAND.textMuted, marginBottom: "4px" }}>
                      {isMine ? 'Você' : (msg.sender?.username || 'Companheiro')}
                    </span>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "16px",
                      borderBottomRightRadius: isMine ? "4px" : "16px",
                      borderBottomLeftRadius: !isMine ? "4px" : "16px",
                      background: isMine ? BRAND.primary : BRAND.white,
                      color: isMine ? "white" : BRAND.text,
                      border: isMine ? "none" : `1px solid ${BRAND.border}`,
                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                    }}>
                      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.4" }}>{msg.content}</p>
                    </div>
                    <span style={{ fontSize: "10px", color: BRAND.textMuted, marginTop: "4px" }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: "16px", background: BRAND.white, borderRadius: "12px", border: `1px solid ${BRAND.border}`, display: "flex", gap: "12px", marginTop: "16px" }}>
          <input
            style={{ ...S.input, flex: 1, border: "none", background: BRAND.primarySurface }}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Escreva a sua mensagem..."
            onKeyDown={e => { if (e.key === 'Enter') handleSend(e) }}
          />
          <button style={S.btnPrimary} onClick={handleSend} disabled={sendMessageMutation.isPending || !content.trim()}>
            {sendMessageMutation.isPending ? '...' : 'Enviar'}
          </button>
        </div>
      </div>
    </div>
  );
};
