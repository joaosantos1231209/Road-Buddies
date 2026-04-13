import { vi, describe, it, expect, beforeEach } from 'vitest';

// 1. MOCKS GLOBAIS
vi.mock('../src/middleware/auth.js', () => ({
    requireAuth: vi.fn((req, res, next) => { req.user = { uid: 'u123', email: 'u@l.c', name: 'U' }; next(); }),
    requireAdmin: vi.fn((req, res, next) => { req.user = { uid: 'a123', isAdmin: true }; next(); })
}));

vi.mock('../src/lib/auth-utils.js', () => ({
    generateVerificationCode: vi.fn(() => '123456'),
    isEmailAllowed: vi.fn(() => true),
    isCodeExpired: vi.fn(() => false)
}));

vi.mock('drizzle-orm', async (importOriginal) => {
    const orig = await importOriginal<any>();
    const mockFn = () => ({});
    return { ...orig, eq: mockFn, and: mockFn, or: mockFn, inArray: mockFn, ne: mockFn, sql: mockFn, desc: mockFn, asc: mockFn };
});

vi.mock('../src/db/index.js', () => {
    const ch: any = {
        where: () => ch, set: () => ch, values: () => ch, delete: () => ch, returning: () => Promise.resolve([{ id: 1 }]),
        orderBy: () => ch, limit: () => ch, from: () => ch, onConflictDoUpdate: () => ch,
        then: (fn: any) => Promise.resolve([{ id: 1 }]).then(fn)
    };
    return {
        db: {
            query: {
                users: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                trips: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                tripParticipants: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                cities: { findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn() },
                messages: { findMany: vi.fn().mockResolvedValue([]) },
                chatReads: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) },
                spRequests: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
                matches: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) }
            },
            update: () => ch, insert: () => ch, delete: () => ch, select: () => ({ from: () => ch }),
            transaction: vi.fn()
        }
    };
});

vi.mock('../src/services/email.js', () => ({ sendVerificationCode: vi.fn().mockResolvedValue(true), sendMatchFoundEmail: vi.fn().mockResolvedValue(true), sendPassengerJoinedEmail: vi.fn().mockResolvedValue(true), sendTripCancelledEmail: vi.fn().mockResolvedValue(true) }));
vi.mock('../src/services/fcm.js', () => ({ sendMatchNotification: vi.fn().mockResolvedValue(true), sendPassengerJoinedNotification: vi.fn().mockResolvedValue(true), sendTripCancelledNotification: vi.fn().mockResolvedValue(true), sendMessageNotification: vi.fn().mockResolvedValue(true) }));
vi.mock('../src/services/matchmaking.js', () => ({ runMatchmaking: vi.fn().mockResolvedValue(true) }));

import request from 'supertest';
import app from '../src/app.js';
import { db } from '../src/db/index.js';

describe('Road Buddies Comprehensive Suite (Full restoration)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('Sync Profile', async () => {
        (db.query.users.findFirst as any).mockResolvedValue({ id: 'u123', email: 'u@l.c' });
        await request(app).post('/api/auth/sync').send({ email: 'u@l.c' }).expect(200);
    });

    it('Verify Auth', async () => {
        (db.query.users.findFirst as any).mockResolvedValue({ id: 'u123', verificationCode: '123456', verificationExpiry: new Date(Date.now() + 100000) });
        await request(app).post('/api/auth/verify').send({ code: '123456' }).expect(200);
    });

    it('Update Profile', async () => {
        (db.query.users.findFirst as any).mockResolvedValue(null);
        await request(app).put('/api/users/profile').send({ username: 'U2' }).expect(200);
    });

    it('Join Trip Flow', async () => {
        const mockTx = {
            query: {
                trips: { findFirst: vi.fn().mockResolvedValueOnce({ id: 1, userId: 'other', availableSeats: 5, status: 'ACTIVE', type: 'PROVIDER', departureTime: new Date() }).mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) },
                tripParticipants: { findFirst: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) }
            },
            insert: () => ({ values: () => Promise.resolve() }), update: () => ({ set: () => ({ where: () => Promise.resolve() }) })
        };
        (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));
        (db.query.trips.findFirst as any).mockResolvedValue({ id: 1, userId: 'u123', creator: { email: 'd@l.c' }, originId: 1, destinationId: 2, departureTime: new Date() });
        (db.query.users.findFirst as any).mockResolvedValue({ id: 'u123', username: 'U' });
        (db.query.cities.findFirst as any).mockResolvedValue({ id: 1, name: 'C' });
        await request(app).post('/api/trips/1/join').expect(200);
    });

    it('Leave Trip', async () => {
        const mockTx = {
            query: { trips: { findFirst: vi.fn().mockResolvedValue({ id: 1, availableSeats: 5 }), findMany: vi.fn().mockResolvedValue([]) }, tripParticipants: { findFirst: vi.fn().mockResolvedValue({ userId: 'u123' }) } },
            update: () => ({ set: () => ({ where: () => Promise.resolve() }) }), delete: () => ({ where: () => Promise.resolve() })
        };
        (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));
        await request(app).post('/api/trips/1/leave').expect(200);
    });

    it('Cancel Trip', async () => {
        const mockTx = {
            query: { trips: { findFirst: vi.fn().mockResolvedValue({ id: 1, userId: 'u123', type: 'PROVIDER', participants: [] }) }, cities: { findFirst: vi.fn().mockResolvedValue({ id: 1, name: 'C' }) } },
            update: () => ({ set: () => ({ where: () => Promise.resolve() }) }), delete: () => ({ where: () => Promise.resolve() })
        };
        (db.transaction as any).mockImplementationOnce(async (cb: any) => cb(mockTx));
        await request(app).delete('/api/trips/1').expect(200);
    });

    it('Message Creation', async () => {
        (db.query.trips.findFirst as any).mockResolvedValue({ id: 1, userId: 'u123', participants: [] });
        await request(app).post('/api/messages/trip/1').send({ content: 'Olá' }).expect(201);
    });

    it('Unread Counts', async () => {
        (db.query.trips.findMany as any).mockResolvedValue([{ id: 1 }]);
        await request(app).get('/api/messages/unread').expect(200);
    });

    it('Admin Checks', async () => {
        await request(app).get('/api/sp-requests').expect(200);
    });

    it('Health Check', async () => {
        await request(app).get('/api/health').expect(200);
    });
});
