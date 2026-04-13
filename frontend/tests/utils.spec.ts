import { describe, it, expect } from 'vitest';
import { isValidLicensePlate, formatLicensePlate } from '../src/lib/utils';

describe('Utils: Matrículas', () => {
  it('deve validar matrículas no formato correto', () => {
    expect(isValidLicensePlate('AA-00-00')).toBe(true);
    expect(isValidLicensePlate('11-BB-22')).toBe(true);
    expect(isValidLicensePlate('33-44-CC')).toBe(true);
  });

  it('deve rejeitar matrículas no formato incorreto', () => {
    expect(isValidLicensePlate('AAA-00-00')).toBe(false);
    expect(isValidLicensePlate('AA-000-00')).toBe(false);
    expect(isValidLicensePlate('AA0000')).toBe(false);
    expect(isValidLicensePlate('!!-00-00')).toBe(false);
  });

  it('deve formatar matrículas automaticamente enquanto o utilizador escreve', () => {
    expect(formatLicensePlate('AA0000')).toBe('AA-00-00');
    expect(formatLicensePlate('11BB22')).toBe('11-BB-22');
    expect(formatLicensePlate('AA-0000')).toBe('AA-00-00');
  });

  it('deve formatar e capitalizar matrículas', () => {
    expect(formatLicensePlate('aa00bb')).toBe('AA-00-BB');
  });
});
