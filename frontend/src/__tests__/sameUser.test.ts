import { describe, it, expect } from 'vitest';
import { sameUser } from '../lib/tripFormatters';

describe('sameUser', () => {
  it('returns true for equal string ids', () => {
    expect(sameUser('abc123', 'abc123')).toBe(true);
  });

  it('returns true when comparing string and number of same value', () => {
    expect(sameUser('1', 1)).toBe(true);
    expect(sameUser(1, '1')).toBe(true);
  });

  it('returns false for different ids', () => {
    expect(sameUser('abc', 'xyz')).toBe(false);
  });

  it('returns false when either is null/undefined', () => {
    expect(sameUser(null, 'abc')).toBe(false);
    expect(sameUser('abc', undefined)).toBe(false);
    expect(sameUser(null, null)).toBe(false);
  });
});
