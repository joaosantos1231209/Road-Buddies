import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../lib/constants';
import type { Trip, Match, SpRequest, UnreadChats, City } from '../types';

export function useTripsData() {
  const { getToken, user } = useAuth();

  const { data: citiesData = [] } = useQuery<City[]>({
    queryKey: ['cities'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/cities`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
  });

  const { data: trips } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('No token');
      const res = await fetch(`${API_BASE_URL}/trips`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Falha ao carregar viagens');
      return res.json().then((d: { trips: Trip[] }) => d.trips);
    },
    enabled: !!user,
  });

  const { data: spRequestsData = [] } = useQuery<SpRequest[]>({
    queryKey: ['spRequests'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/sp-requests`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      return res.json().then((d: { requests: SpRequest[] }) => d.requests);
    },
    enabled: !!user,
  });

  const { data: matchesData } = useQuery<Match[]>({
    queryKey: ['matches'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/matches`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json().then((d: { matches: Match[] }) => d.matches || []);
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const { data: unreadChats } = useQuery<UnreadChats>({
    queryKey: ['unreadChats'],
    queryFn: async () => {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/messages/unread`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  return { citiesData, trips, spRequestsData, matchesData, unreadChats };
}
