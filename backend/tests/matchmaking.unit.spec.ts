import { describe, it, expect } from 'vitest';

// Pure logic extracted from matchmaking service for unit testing
function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toDateString() === d2.toDateString();
}

function buildMatchPairs(
  newTrip: { id: number; type: string; originId: number; destinationId: number; departureTime: Date; availableSeats: number; status: string },
  candidates: Array<{ id: number; type: string; originId: number; destinationId: number; departureTime: Date; availableSeats: number; status: string }>
) {
  const targetType = newTrip.type === 'PROVIDER' ? 'NEEDRIDE' : 'PROVIDER';

  return candidates
    .filter(c => {
      if (c.type !== targetType) return false;
      if (c.originId !== newTrip.originId) return false;
      if (c.destinationId !== newTrip.destinationId) return false;
      if (c.status !== 'ACTIVE') return false;
      if (targetType === 'PROVIDER' && c.availableSeats < 1) return false;
      if (!isSameDay(newTrip.departureTime, c.departureTime)) return false;
      return true;
    })
    .map(c => ({
      providerTripId: newTrip.type === 'PROVIDER' ? newTrip.id : c.id,
      seekerTripId: newTrip.type === 'NEEDRIDE' ? newTrip.id : c.id,
    }));
}

const base = {
  status: 'ACTIVE',
  availableSeats: 1,
  originId: 1,
  destinationId: 2,
};

const today = new Date('2026-04-22T08:00:00Z');
const tomorrow = new Date('2026-04-23T08:00:00Z');
const todayAlt = new Date('2026-04-22T09:30:00Z');

describe('matchmaking: buildMatchPairs', () => {
  it('matches PROVIDER with NEEDRIDE on same day, same route', () => {
    const provider = { ...base, id: 1, type: 'PROVIDER', departureTime: today };
    const seeker = { ...base, id: 2, type: 'NEEDRIDE', departureTime: todayAlt };
    const pairs = buildMatchPairs(provider, [seeker]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({ providerTripId: 1, seekerTripId: 2 });
  });

  it('matches NEEDRIDE with PROVIDER on same day, same route', () => {
    const seeker = { ...base, id: 10, type: 'NEEDRIDE', departureTime: today };
    const provider = { ...base, id: 20, type: 'PROVIDER', departureTime: todayAlt };
    const pairs = buildMatchPairs(seeker, [provider]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual({ providerTripId: 20, seekerTripId: 10 });
  });

  it('does not match trips on different days', () => {
    const provider = { ...base, id: 1, type: 'PROVIDER', departureTime: today };
    const seeker = { ...base, id: 2, type: 'NEEDRIDE', departureTime: tomorrow };
    expect(buildMatchPairs(provider, [seeker])).toHaveLength(0);
  });

  it('does not match trips with different route', () => {
    const provider = { ...base, id: 1, type: 'PROVIDER', departureTime: today };
    const seeker = { ...base, id: 2, type: 'NEEDRIDE', departureTime: today, originId: 3 };
    expect(buildMatchPairs(provider, [seeker])).toHaveLength(0);
  });

  it('does not match PROVIDER with PROVIDER', () => {
    const p1 = { ...base, id: 1, type: 'PROVIDER', departureTime: today };
    const p2 = { ...base, id: 2, type: 'PROVIDER', departureTime: today };
    expect(buildMatchPairs(p1, [p2])).toHaveLength(0);
  });

  it('does not match when PROVIDER has no available seats', () => {
    const seeker = { ...base, id: 1, type: 'NEEDRIDE', departureTime: today };
    const provider = { ...base, id: 2, type: 'PROVIDER', departureTime: today, availableSeats: 0 };
    expect(buildMatchPairs(seeker, [provider])).toHaveLength(0);
  });

  it('does not match inactive trips', () => {
    const provider = { ...base, id: 1, type: 'PROVIDER', departureTime: today };
    const seeker = { ...base, id: 2, type: 'NEEDRIDE', departureTime: today, status: 'CANCELLED' };
    expect(buildMatchPairs(provider, [seeker])).toHaveLength(0);
  });

  it('matches multiple seekers for one provider', () => {
    const provider = { ...base, id: 1, type: 'PROVIDER', departureTime: today };
    const seekers = [
      { ...base, id: 2, type: 'NEEDRIDE', departureTime: today },
      { ...base, id: 3, type: 'NEEDRIDE', departureTime: todayAlt },
    ];
    const pairs = buildMatchPairs(provider, seekers);
    expect(pairs).toHaveLength(2);
    expect(pairs.every(p => p.providerTripId === 1)).toBe(true);
  });

  it('returns empty array when no candidates', () => {
    const provider = { ...base, id: 1, type: 'PROVIDER', departureTime: today };
    expect(buildMatchPairs(provider, [])).toHaveLength(0);
  });
});

describe('matchmaking: isSameDay', () => {
  it('returns true for dates with same local date string', () => {
    const d1 = new Date('2026-04-22T08:00:00');
    const d2 = new Date('2026-04-22T18:00:00');
    expect(isSameDay(d1, d2)).toBe(true);
  });

  it('returns false for consecutive days', () => {
    const d1 = new Date('2026-04-22T08:00:00');
    const d2 = new Date('2026-04-23T08:00:00');
    expect(isSameDay(d1, d2)).toBe(false);
  });
});
