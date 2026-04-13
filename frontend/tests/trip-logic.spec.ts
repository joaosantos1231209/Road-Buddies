import { describe, it, expect } from 'vitest';
import { filterUpcomingTrips, filterPastTrips, countUnreadTrips, getMyTrips, type Trip } from '../src/lib/trip-logic';

describe('Trip Logic: Casos de Borda e Validações', () => {
  const mockNow = new Date('2026-04-07T10:00:00Z');
  
  it('deve lidar com lista de viagens vazia', () => {
    expect(filterUpcomingTrips([], mockNow)).toHaveLength(0);
    expect(filterPastTrips([], mockNow)).toHaveLength(0);
  });

  it('deve filtrar corretamente viagens exatamente no momento "now"', () => {
    const tripAtNow: Trip = { id: 'now', departureTime: mockNow.toISOString(), status: 'OPEN', type: 'PROVIDER', userId: 'u' };
    const result = filterUpcomingTrips([tripAtNow], mockNow);
    // Viagens exatamente "agora" devem ser consideradas futuras/em curso
    expect(result).toHaveLength(1);
  });

  it('deve excluir viagens CANCELLED da listagem principal', () => {
    const cancelledTrip: Trip = { id: '99', departureTime: '2026-04-10T10:00:00Z', status: 'CANCELLED', type: 'PROVIDER', userId: 'u' };
    const result = filterUpcomingTrips([cancelledTrip], mockNow);
    expect(result).toHaveLength(0);
  });

  it('deve identificar corretamente viagens onde o utilizador é o condutor vs passageiro', () => {
    const myOwned: Trip = { id: 'owned', userId: 'me', status: 'OPEN', departureTime: '2026-04-10T00:00Z' } as any;
    const myJoined: Trip = { id: 'joined', userId: 'other', status: 'OPEN', departureTime: '2026-04-10T00:00Z', participants: [{ userId: 'me' }] } as any;
    const result = getMyTrips([myOwned, myJoined], 'me');
    expect(result).toHaveLength(2);
    expect(result.find(t => t.id === 'owned')).toBeDefined();
    expect(result.find(t => t.id === 'joined')).toBeDefined();
  });
});
