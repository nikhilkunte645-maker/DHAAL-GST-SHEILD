import { describe, it, expect } from 'vitest';
import {
  getUrgencyInfo,
  getRingDashOffset,
  parseDateComponents,
  calculateDaysRemaining,
  isLeapYear,
  getDaysInMonth,
} from '../deadline';

describe('GST Deadline & Urgency Engine', () => {
  describe('isLeapYear and getDaysInMonth', () => {
    it('correctly identifies leap years', () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(2025)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
    });

    it('returns 29 days for Feb in leap year, 28 in non-leap year', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29);
      expect(getDaysInMonth(2025, 1)).toBe(28);
    });

    it('returns correct days for 30-day and 31-day months', () => {
      expect(getDaysInMonth(2024, 3)).toBe(30); // April
      expect(getDaysInMonth(2024, 4)).toBe(31); // May
      expect(getDaysInMonth(2024, 5)).toBe(30); // June
    });
  });

  describe('parseDateComponents', () => {
    it('parses valid DD-MMM-YYYY format', () => {
      expect(parseDateComponents('13-Jun-2025')).toEqual([2025, 5, 13]);
      expect(parseDateComponents('14-May-2024')).toEqual([2024, 4, 14]);
      expect(parseDateComponents('29-Feb-2024')).toEqual([2024, 1, 29]);
    });

    it('parses valid YYYY-MM-DD format', () => {
      expect(parseDateComponents('2025-06-13')).toEqual([2025, 5, 13]);
      expect(parseDateComponents('2024-02-29')).toEqual([2024, 1, 29]);
    });

    it('rejects impossible dates (e.g. 29-Feb in non-leap year, 31-Apr)', () => {
      expect(parseDateComponents('29-Feb-2025')).toBeNull();
      expect(parseDateComponents('31-Apr-2024')).toBeNull();
      expect(parseDateComponents('32-Jan-2024')).toBeNull();
      expect(parseDateComponents('00-Jan-2024')).toBeNull();
    });

    it('rejects invalid or missing date strings', () => {
      expect(parseDateComponents(null)).toBeNull();
      expect(parseDateComponents(undefined)).toBeNull();
      expect(parseDateComponents('')).toBeNull();
      expect(parseDateComponents('not-a-date')).toBeNull();
      expect(parseDateComponents('2025/13/45')).toBeNull();
    });
  });

  describe('calculateDaysRemaining', () => {
    it('calculates deterministic days between two dates across timezone boundaries', () => {
      // 14-May-2025 to 13-Jun-2025 is exactly 30 days
      expect(calculateDaysRemaining('13-Jun-2025', '14-May-2025')).toBe(30);
      // 01-Jun-2025 to 13-Jun-2025 is exactly 12 days
      expect(calculateDaysRemaining('13-Jun-2025', '01-Jun-2025')).toBe(12);
      // Same day is 0 (due today)
      expect(calculateDaysRemaining('13-Jun-2025', '13-Jun-2025')).toBe(0);
      // Past deadline is negative (expired)
      expect(calculateDaysRemaining('13-Jun-2025', '18-Jun-2025')).toBe(-5);
    });

    it('returns null for unverified or invalid inputs', () => {
      expect(calculateDaysRemaining(null, '14-May-2025')).toBeNull();
      expect(calculateDaysRemaining('invalid', '14-May-2025')).toBeNull();
      expect(calculateDaysRemaining('13-Jun-2025', 'invalid-ref')).toBeNull();
    });
  });

  describe('getUrgencyInfo explicit states', () => {
    it('returns UNVERIFIED for null, undefined, or NaN', () => {
      const uNull = getUrgencyInfo(null);
      expect(uNull.state).toBe('UNVERIFIED');
      expect(uNull.level).toBe('unverified');
      expect(uNull.isVerified).toBe(false);

      const uUndefined = getUrgencyInfo(undefined);
      expect(uUndefined.state).toBe('UNVERIFIED');

      const uNaN = getUrgencyInfo(NaN);
      expect(uNaN.state).toBe('UNVERIFIED');
    });

    it('returns EXPIRED for negative daysLeft', () => {
      const uExp = getUrgencyInfo(-5);
      expect(uExp.state).toBe('EXPIRED');
      expect(uExp.level).toBe('expired');
      expect(uExp.isExpired).toBe(true);
      expect(uExp.isDueToday).toBe(false);
      expect(uExp.label).toBe('Statutory Window Elapsed');
      expect(uExp.description).toContain('elapsed');
    });

    it('returns DUE TODAY for exactly 0 daysLeft', () => {
      const uToday = getUrgencyInfo(0);
      expect(uToday.state).toBe('DUE TODAY');
      expect(uToday.level).toBe('due_today');
      expect(uToday.isDueToday).toBe(true);
      expect(uToday.isExpired).toBe(false);
      expect(uToday.label).toBe('Due Today');
    });

    it('returns CRITICAL for 1 to 6 daysLeft', () => {
      const u1 = getUrgencyInfo(1);
      expect(u1.state).toBe('CRITICAL');
      expect(u1.level).toBe('critical');

      const u6 = getUrgencyInfo(6);
      expect(u6.state).toBe('CRITICAL');
      expect(u6.isUrgent).toBe(true);
    });

    it('returns WARNING for exactly 7 to 14 daysLeft', () => {
      const u7 = getUrgencyInfo(7);
      expect(u7.state).toBe('WARNING');
      expect(u7.level).toBe('caution');

      const u14 = getUrgencyInfo(14);
      expect(u14.state).toBe('WARNING');
      expect(u14.level).toBe('caution');
    });

    it('returns NORMAL for daysLeft > 14', () => {
      const u15 = getUrgencyInfo(15);
      expect(u15.state).toBe('NORMAL');
      expect(u15.level).toBe('normal');

      const u30 = getUrgencyInfo(30);
      expect(u30.state).toBe('NORMAL');
    });
  });

  describe('getRingDashOffset', () => {
    it('returns full circumference for 0, negative, or invalid days', () => {
      expect(getRingDashOffset(0)).toBe(427.26);
      expect(getRingDashOffset(-5)).toBe(427.26);
      expect(getRingDashOffset(null)).toBe(427.26);
      expect(getRingDashOffset(NaN)).toBe(427.26);
    });

    it('returns 0 for 30 or more days', () => {
      expect(getRingDashOffset(30)).toBe(0);
      expect(getRingDashOffset(40)).toBe(0);
    });

    it('returns proportional offset for intermediate days', () => {
      // 15 days out of 30 is 50% -> offset is half of 427.26 = 213.63
      expect(getRingDashOffset(15)).toBeCloseTo(213.63, 1);
    });
  });
});
