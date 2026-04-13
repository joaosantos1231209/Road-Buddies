/**
 * Lógica de processamento de viagens para o Road Buddies.
 * Estas funções são puras e independentes de React, facilitando os testes unitários.
 */

export interface Trip {
  id: string;
  departureTime: string;
  status: string;
  type: string;
  userId: string;
  participants?: any[];
}

/**
 * Filtra as viagens que ainda vão acontecer (proximas).
 */
export const filterUpcomingTrips = (trips: Trip[], now: Date = new Date()) => {
  return trips
    .filter(t => t.status !== 'CANCELLED' && new Date(t.departureTime) >= now)
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
};

/**
 * Filtra as viagens passadas (histórico).
 */
export const filterPastTrips = (trips: Trip[], now: Date = new Date()) => {
  return trips
    .filter(t => new Date(t.departureTime) < now)
    .sort((a, b) => new Date(b.departureTime).getTime() - new Date(a.departureTime).getTime());
};

/**
 * Calcula o número de viagens com mensagens não lidas.
 */
export const countUnreadTrips = (trips: Trip[], unreadByTrip: Record<string, number>) => {
  if (!unreadByTrip) return 0;
  return trips.filter(t => (unreadByTrip[t.id] || 0) > 0).length;
};

/**
 * Categoriza as minhas viagens (as que eu criei ou participo).
 */
export const getMyTrips = (trips: Trip[], currentUserId: string) => {
  return trips.filter(t => 
    t.userId === currentUserId || 
    t.participants?.some(p => p.userId === currentUserId)
  );
};
