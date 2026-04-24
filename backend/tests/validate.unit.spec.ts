import { describe, it, expect } from 'vitest';
import {
  parseIntParam,
  createTripSchema,
  createSpRequestSchema,
  verifyCodeSchema,
  updateProfileSchema,
  sendMessageSchema,
} from '../src/lib/validate.js';

describe('parseIntParam', () => {
  it('parses valid positive integers', () => {
    expect(parseIntParam('1')).toBe(1);
    expect(parseIntParam('99')).toBe(99);
  });

  it('returns null for NaN', () => {
    expect(parseIntParam('abc')).toBeNull();
    expect(parseIntParam('')).toBeNull();
    expect(parseIntParam(undefined)).toBeNull();
  });

  it('returns null for zero or negative', () => {
    expect(parseIntParam('0')).toBeNull();
    expect(parseIntParam('-5')).toBeNull();
  });
});

describe('createTripSchema', () => {
  const valid = { type: 'PROVIDER', originId: 1, destinationId: 2, departureTime: '2025-12-01T09:00' };

  it('accepts valid trip data', () => {
    expect(createTripSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(createTripSchema.safeParse({ ...valid, type: 'UNKNOWN' }).success).toBe(false);
  });

  it('rejects missing departureTime', () => {
    const { departureTime: _, ...rest } = valid;
    expect(createTripSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects availableSeats > 8', () => {
    expect(createTripSchema.safeParse({ ...valid, availableSeats: 9 }).success).toBe(false);
  });
});

describe('verifyCodeSchema', () => {
  it('accepts 6-digit code', () => {
    expect(verifyCodeSchema.safeParse({ code: '123456' }).success).toBe(true);
  });

  it('rejects non-numeric code', () => {
    expect(verifyCodeSchema.safeParse({ code: 'abc123' }).success).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(verifyCodeSchema.safeParse({ code: '12345' }).success).toBe(false);
    expect(verifyCodeSchema.safeParse({ code: '1234567' }).success).toBe(false);
  });
});

describe('updateProfileSchema', () => {
  it('accepts valid phone', () => {
    expect(updateProfileSchema.safeParse({ phone: '912345678' }).success).toBe(true);
  });

  it('rejects phone with wrong length', () => {
    expect(updateProfileSchema.safeParse({ phone: '91234' }).success).toBe(false);
  });

  it('accepts empty string phone (optional)', () => {
    expect(updateProfileSchema.safeParse({ phone: '' }).success).toBe(true);
  });
});

describe('sendMessageSchema', () => {
  it('accepts valid message', () => {
    expect(sendMessageSchema.safeParse({ content: 'Olá!' }).success).toBe(true);
  });

  it('rejects empty content', () => {
    expect(sendMessageSchema.safeParse({ content: '' }).success).toBe(false);
  });

  it('rejects content over 2000 chars', () => {
    expect(sendMessageSchema.safeParse({ content: 'x'.repeat(2001) }).success).toBe(false);
  });
});
