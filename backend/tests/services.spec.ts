import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. MOCKS NO TOPO
vi.mock('../src/db/index.js', () => {
    const chain: any = {
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 1 }])
    };
    return {
        db: {
            insert: vi.fn(() => chain),
            query: {
                trips: { findFirst: vi.fn(), findMany: vi.fn() },
                users: { findFirst: vi.fn() },
                cities: { findFirst: vi.fn() }
            }
        }
    };
});

vi.mock('../src/services/email.js', () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
  sendVerificationCode: vi.fn().mockResolvedValue(true),
  sendMatchFoundEmail: vi.fn().mockResolvedValue(true),
  sendPassengerJoinedEmail: vi.fn().mockResolvedValue(true),
  sendTripCancelledEmail: vi.fn().mockResolvedValue(true)
}));

vi.mock('../src/services/fcm.js', () => ({
  sendMatchNotification: vi.fn().mockResolvedValue(true),
  sendPassengerJoinedNotification: vi.fn().mockResolvedValue(true),
  sendTripCancelledNotification: vi.fn().mockResolvedValue(true),
  sendMessageNotification: vi.fn().mockResolvedValue(true)
}));

// 2. IMPORTS
import { runMatchmaking } from '../src/services/matchmaking.js';
import { db } from '../src/db/index.js';
import { sendMatchNotification } from '../src/services/fcm.js';

describe('Matchmaking Service Logic', () => {
    beforeEach(() => vi.clearAllMocks());

    it('Deve criar um match quando existe uma viagem compatível no mesmo dia', async () => {
        // Nova viagem: PASSAGEIRO (Seeker) de L para A no dia 2099-01-01
        const newTrip = { id: 1, type: 'NEEDRIDE', originId: 10, destinationId: 20, departureTime: '2099-01-01T10:00:00.000Z', status: 'ACTIVE', userId: 'u1' };
        
        // Viagens compatíveis existentes: CONDUTOR (Provider) de L para A no mesmo dia
        const existingProvider = { id: 2, type: 'PROVIDER', originId: 10, destinationId: 20, departureTime: '2099-01-01T15:00:00.000Z', status: 'ACTIVE', userId: 'u2', availableSeats: 3 };

        (db.query.trips.findFirst as any).mockResolvedValue(newTrip);
        (db.query.trips.findMany as any).mockResolvedValue([existingProvider]);
        (db.query.users.findFirst as any).mockResolvedValue({ id: 'u2', fcmToken: 'token-condutor' });
        (db.query.cities.findFirst as any).mockResolvedValue({ id: 20, name: 'Aveiro' });

        await runMatchmaking(1);

        // Verificar se o insert foi chamado para registrar o match
        expect(db.insert).toHaveBeenCalled();
        
        // Verificar se as notificações foram disparadas
        expect(sendMatchNotification).toHaveBeenCalledWith('token-condutor', expect.stringContaining('Aveiro'));
    });

    it('Não deve criar match se as datas forem diferentes', async () => {
        const newTrip = { id: 1, type: 'NEEDRIDE', originId: 10, destinationId: 20, departureTime: '2099-01-01T10:00:00.000Z', status: 'ACTIVE', userId: 'u1' };
        // Outra data: 2099-01-02
        const existingProvider = { id: 2, type: 'PROVIDER', originId: 10, destinationId: 20, departureTime: '2099-01-02T10:00:00.000Z', status: 'ACTIVE', userId: 'u2', availableSeats: 3 };

        (db.query.trips.findFirst as any).mockResolvedValue(newTrip);
        (db.query.trips.findMany as any).mockResolvedValue([existingProvider]);

        await runMatchmaking(1);

        // Não deve haver insert de match
        expect(db.insert).not.toHaveBeenCalled();
    });
});
