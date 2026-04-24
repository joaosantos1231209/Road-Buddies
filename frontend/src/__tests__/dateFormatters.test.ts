import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodayDate, getTodayDatetimeLocal } from '../lib/dateFormatters';

describe('getTodayDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T14:30:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns today in YYYY-MM-DD format', () => {
    expect(getTodayDate()).toBe('2025-03-15');
  });
});

describe('getTodayDatetimeLocal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-03-15T09:05:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns datetime in YYYY-MM-DDTHH:MM format with padding', () => {
    const result = getTodayDatetimeLocal();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});
