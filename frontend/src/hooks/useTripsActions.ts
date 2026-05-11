import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { API_BASE_URL } from '../lib/constants';

export function useTripsActions() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const joinTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao juntar viagem');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      showToast('Lugar reservado com sucesso!', 'success');
    },
    onError: (error: Error) => { showToast(error.message, 'error'); },
  });

  const leaveTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/leave`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao cancelar reserva');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      showToast('Saiu da viagem com sucesso.', 'success');
    },
    onError: (error: Error) => { showToast(error.message, 'error'); },
  });

  const cancelTripMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao cancelar viagem');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['company_vehicles_available'] });
      showToast('Viagem cancelada com sucesso.', 'success');
    },
    onError: (error: Error) => { showToast(error.message, 'error'); },
  });

  const editTripMutation = useMutation({
    mutationFn: async ({ tripId, data }: { tripId: number; data: any }) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao editar viagem');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['company_vehicles_available'] });
      showToast('Viagem atualizada com sucesso!', 'success');
    },
    onError: (error: Error) => { showToast(error.message, 'error'); },
  });

  const markMatchesReadMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return fetch(`${API_BASE_URL}/matches/mark-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['matches'] }); },
  });

  const markAllMessagesReadMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return fetch(`${API_BASE_URL}/messages/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['unreadChats'] }); },
  });

  return { joinTripMutation, leaveTripMutation, cancelTripMutation, editTripMutation, markMatchesReadMutation, markAllMessagesReadMutation };
}
