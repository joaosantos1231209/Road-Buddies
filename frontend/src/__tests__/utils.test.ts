import { describe, it, expect } from 'vitest';
import { formatLicensePlate, isValidLicensePlate } from '../lib/utils';

describe('formatLicensePlate', () => {
  it('formats lowercase input to uppercase with dashes', () => {
    expect(formatLicensePlate('aa00bb')).toBe('AA-00-BB');
  });

  it('truncates to 8 chars (XX-XX-XX)', () => {
    expect(formatLicensePlate('AA0011BB99')).toBe('AA-00-11');
  });

  it('handles partially entered plates', () => {
    expect(formatLicensePlate('AA')).toBe('AA');
    expect(formatLicensePlate('AA00')).toBe('AA-00');
  });

  it('removes special characters', () => {
    expect(formatLicensePlate('AA-00-BB')).toBe('AA-00-BB');
    expect(formatLicensePlate('aa.00.bb')).toBe('AA-00-BB');
  });
});

describe('isValidLicensePlate', () => {
  it('accepts all valid Portuguese plate formats', () => {
    expect(isValidLicensePlate('AB-12-CD')).toBe(true); // letters-digits-letters
    expect(isValidLicensePlate('12-34-AB')).toBe(true); // digits-digits-letters
    expect(isValidLicensePlate('12-AB-34')).toBe(true); // digits-letters-digits
    expect(isValidLicensePlate('AB-12-34')).toBe(true); // letters-digits-digits
  });

  it('rejects invalid formats', () => {
    expect(isValidLicensePlate('AB-CD-EF')).toBe(false);
    expect(isValidLicensePlate('123456')).toBe(false);
    expect(isValidLicensePlate('')).toBe(false);
    expect(isValidLicensePlate('A-12-CD')).toBe(false);
  });
});
