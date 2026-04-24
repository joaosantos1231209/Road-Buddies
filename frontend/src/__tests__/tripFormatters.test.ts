import { describe, it, expect } from 'vitest';
import { getCityName, getVehicleObj, getTripVehicleString } from '../lib/tripFormatters';

describe('getCityName', () => {
  const cities = [
    { id: 1, name: 'Lisboa' },
    { id: 2, name: 'Porto' },
  ];

  it('returns city name for matching id', () => {
    expect(getCityName(1, cities)).toBe('Lisboa');
    expect(getCityName('2', cities)).toBe('Porto');
  });

  it('returns "..." for unknown id', () => {
    expect(getCityName(99, cities)).toBe('...');
    expect(getCityName('', cities)).toBe('...');
  });
});

describe('getVehicleObj', () => {
  it('returns empty object for null/undefined', () => {
    expect(getVehicleObj(null)).toEqual({ brand: '', plate: '' });
    expect(getVehicleObj(undefined)).toEqual({ brand: '', plate: '' });
  });

  it('parses valid JSON vehicle info', () => {
    expect(getVehicleObj('{"brand":"Toyota","plate":"AA-00-BB"}')).toEqual({ brand: 'Toyota', plate: 'AA-00-BB' });
  });

  it('returns raw string as brand when not JSON', () => {
    expect(getVehicleObj('Volkswagen')).toEqual({ brand: 'Volkswagen', plate: '' });
  });
});

describe('getTripVehicleString', () => {
  it('returns empty string for NEEDRIDE trips', () => {
    expect(getTripVehicleString({ type: 'NEEDRIDE' })).toBe('');
  });

  it('formats PROVIDER trip with vehicle details', () => {
    const trip = {
      type: 'PROVIDER',
      vehicleType: 'Viatura da Empresa',
      tripVehicleDetails: '{"brand":"BMW","plate":"12-AB-34"}',
    };
    expect(getTripVehicleString(trip)).toBe('BMW - 12-AB-34');
  });

  it('falls back to vehicleType when no details', () => {
    const trip = { type: 'PROVIDER', vehicleType: 'Viatura Pessoal', tripVehicleDetails: null };
    expect(getTripVehicleString(trip)).toBe('Viatura Pessoal');
  });
});
