import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trip, InsertTrip } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Hook for fetching all trips
export function useTrips(options?: { 
  includeExpired?: boolean, 
  refetchInterval?: number 
}) {
  return useQuery<Trip[]>({
    queryKey: ['/api/trips', options?.includeExpired ? 'all' : 'active'],
    queryFn: async () => {
      const trips = await apiRequest('/api/trips');
      
      // Filter out expired trips unless includeExpired is true
      if (!options?.includeExpired) {
        const now = new Date();
        return trips.filter((trip: Trip) => {
          const endDate = trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate);
          return endDate >= now;
        });
      }
      
      return trips;
    },
    // Adiciona verificação periódica por novas viagens
    // O padrão é a cada 30 segundos, mas pode ser personalizado
    refetchInterval: options?.refetchInterval || 30000,
    // Garante que os dados sejam atualizados quando a aba ganhar foco novamente
    refetchOnWindowFocus: true,
    // Permite refetch em segundo plano sem interromper o usuário
    refetchIntervalInBackground: false,
  });
}

// Hook for fetching a specific trip
export function useTrip(id: number | string) {
  return useQuery<Trip>({
    queryKey: ['/api/trips', id],
    queryFn: async () => {
      if (!id) throw new Error("Trip ID is required");
      return await apiRequest(`/api/trips/${id}`);
    },
    enabled: !!id,
  });
}

// Hook for fetching trips for a specific user
export function useUserTrips(userId: number | string, options?: { 
  includeExpired?: boolean,
  refetchInterval?: number 
}) {
  return useQuery<Trip[]>({
    queryKey: ['/api/users', userId, 'trips', options?.includeExpired ? 'all' : 'active'],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const trips = await apiRequest(`/api/users/${userId}/trips`);
      
      // Filter out expired trips unless includeExpired is true
      if (!options?.includeExpired) {
        const now = new Date();
        return trips.filter((trip: Trip) => {
          const endDate = trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate);
          return endDate >= now;
        });
      }
      
      return trips;
    },
    enabled: !!userId,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: true
  });
}

// Hook for creating a new trip
export function useCreateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (newTrip: InsertTrip) => {
      return await apiRequest('/api/trips', 'POST', newTrip) as Trip;
    },
    onSuccess: (data) => {
      // Invalidate trips queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      // Also invalidate user-specific trips queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', data.userId, 'trips'] });
    },
  });
}

// Hook for updating a trip
export function useUpdateTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: number | string } & Partial<Trip>) => {
      const { id, ...tripData } = data;
      return await apiRequest(`/api/trips/${id}`, 'PATCH', tripData) as Trip;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific trip query and trips list
      queryClient.invalidateQueries({ queryKey: ['/api/trips', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      // Also invalidate user-specific trips queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', data.userId, 'trips'] });
      // Invalidate trip matches in case status or dates changed
      queryClient.invalidateQueries({ queryKey: ['/api/trips', variables.id, 'matches'] });
    },
  });
}

// Hook for deleting a trip
export function useDeleteTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      userId, 
      sendNotifications = true 
    }: { 
      id: number | string, 
      userId: number | string, 
      sendNotifications?: boolean 
    }) => {
      const response = await apiRequest(`/api/trips/${id}?sendNotifications=${sendNotifications}`, 'DELETE');
      return { 
        id, 
        userId,
        notificationsSent: response.notificationsSent
      };
    },
    onSuccess: ({ id, userId, notificationsSent }) => {
      // Invalidate specific trip query and trips list
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      // Also invalidate user-specific trips queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'trips'] });
      // Invalidate participating trips queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'participating'] });
      // Invalidate all trip participants
      queryClient.invalidateQueries({ queryKey: ['/api/trips', id, 'participants'] });
      
      return { id, userId, notificationsSent };
    },
  });
}

// Hook for finding matching trips
export function useMatchingTrips(tripId: number | string) {
  return useQuery<Trip[]>({
    queryKey: ['/api/trips', tripId, 'matches'],
    queryFn: async () => {
      if (!tripId) throw new Error("Trip ID is required");
      const matches = await apiRequest(`/api/trips/${tripId}/matches`);
      
      // Filter out expired matches
      const now = new Date();
      return matches.filter((trip: Trip) => {
        const endDate = trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate);
        return endDate >= now;
      });
    },
    enabled: !!tripId,
  });
}

// Hook for checking if a trip has matches
export function useTripMatches(tripId: number | string) {
  return useMatchingTrips(tripId);
}

// Hook for getting trip participants
export function useTripParticipants(tripId: number | string) {
  return useQuery({
    queryKey: ['/api/trips', tripId, 'participants'],
    queryFn: async () => {
      if (!tripId) throw new Error("Trip ID is required");
      return apiRequest(`/api/trips/${tripId}/participants`);
    },
    enabled: !!tripId,
  });
}

// Hook for getting trips where a user is participating
export function useUserParticipatingTrips(userId: number | string, options?: { 
  includeExpired?: boolean,
  refetchInterval?: number 
}) {
  return useQuery({
    queryKey: ['/api/users', userId, 'participating', options?.includeExpired ? 'all' : 'active'],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      const trips = await apiRequest(`/api/users/${userId}/participating-trips`);
      
      // Filter out expired trips unless includeExpired is true
      if (!options?.includeExpired) {
        const now = new Date();
        return trips.filter((trip: Trip) => {
          const endDate = trip.endDate ? new Date(trip.endDate) : new Date(trip.startDate);
          return endDate >= now;
        });
      }
      
      return trips;
    },
    enabled: !!userId,
    refetchInterval: options?.refetchInterval,
    refetchOnWindowFocus: true
  });
}

// Hook for joining a trip
export function useJoinTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      tripId, 
      userId, 
      createUserTrip = true,
      sendNotifications = true,
      existingNeedRideTripId = null
    }: { 
      tripId: number | string, 
      userId: number | string,
      createUserTrip?: boolean,
      sendNotifications?: boolean,
      existingNeedRideTripId?: number | null
    }) => {
      // Log exatamente o que estamos enviando para a API
      console.log('Join trip request parameters:', {
        tripId,
        userId,
        createUserTrip,
        sendNotifications,
        existingNeedRideTripId,
        existingNeedRideTripIdType: existingNeedRideTripId !== null ? typeof existingNeedRideTripId : 'null'
      });
      
      return apiRequest(`/api/trips/${tripId}/join`, 'POST', { 
        userId,
        createUserTrip,
        sendNotifications,
        // Garantir que enviamos um número ou null, nunca undefined
        existingNeedRideTripId: existingNeedRideTripId !== null ? Number(existingNeedRideTripId) : null
      });
    },
    onSuccess: (data, { userId }) => {
      // Invalidate the specific trip and all trips
      queryClient.invalidateQueries({ queryKey: ['/api/trips', data.trip.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      
      // If a new user trip was created, invalidate that as well
      if (data.userTrip) {
        queryClient.invalidateQueries({ queryKey: ['/api/trips', data.userTrip.id] });
      }
      
      // Also invalidate user-specific trips queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'participating'] });
    },
  });
}

// Hook for leaving a trip
export function useLeaveTrip() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      tripId, 
      userId, 
      deleteNeedRideTrip = false 
    }: { 
      tripId: number | string, 
      userId: number | string,
      deleteNeedRideTrip?: boolean 
    }) => {
      // Use a URL object to garantir que os parâmetros sejam corretamente serializados
      const url = new URL(`/api/trips/${tripId}/participants/${userId}`, window.location.origin);
      url.searchParams.append('deleteNeedRideTrip', deleteNeedRideTrip ? 'true' : 'false');
      return apiRequest(url.toString(), 'DELETE');
    },
    onSuccess: (data, { tripId, userId }) => {
      // Invalidate the specific trip and all trips
      queryClient.invalidateQueries({ queryKey: ['/api/trips', tripId] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      
      // If a NEEDRIDE trip was deleted, make sure to invalidate that too
      if (data.deletedNeedRideTrip) {
        queryClient.invalidateQueries({ queryKey: ['/api/trips', data.deletedNeedRideTrip.id] });
      }
      
      // Also invalidate user-specific trips queries
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'participating'] });
    },
  });
}
