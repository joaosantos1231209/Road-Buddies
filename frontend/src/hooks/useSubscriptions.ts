import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../lib/constants';
import type { TripSubscription, SubscriptionDurationType } from '../types';

export function useSubscriptions() {
  const { getToken, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading } = useQuery<TripSubscription[]>({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json().then((d: { subscriptions: TripSubscription[] }) => d.subscriptions);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      originId: number;
      destinationId: number;
      durationType: SubscriptionDurationType;
      expiresAt?: string | null;
    }) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao criar subscrição');
      return json.subscription as TripSubscription;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, ...data }: {
      id: number;
      originId?: number;
      destinationId?: number;
      durationType?: SubscriptionDurationType;
      expiresAt?: string | null;
    }) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao editar subscrição');
      return json.subscription as TripSubscription;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/subscriptions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao cancelar subscrição');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  return { subscriptions, isLoading, createMutation, editMutation, cancelMutation };
}
