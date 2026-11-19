/**
 * Dhaal (ढाल) - Statutory GST Notice Deadline & Urgency Engine
 * Implements deterministic deadline state modeling for Form GST ASMT-10 / Rule 99(1).
 */

export type DeadlineState =
  | 'EXPIRED'
  | 'DUE TODAY'
  | 'CRITICAL'
  | 'WARNING'
  | 'NORMAL'
  | 'UNVERIFIED';

export type UrgencyLevel = 'expired' | 'due_today' | 'critical' | 'caution' | 'normal' | 'unverified';

export interface UrgencyInfo {
  state: DeadlineState;
  level: UrgencyLevel;
  label: string;
  badgeClass: string;
  barColor: string;
  textColor: string;
  description: string;
  isExpired: boolean;
  isDueToday: boolean;
  isUrgent: boolean;
  isVerified: boolean;
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Checks whether a given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Returns the maximum days in a given month/year.
 */
export function getDaysInMonth(year: number, monthZeroIndexed: number): number {
  if (monthZeroIndexed === 1) {
    return isLeapYear(year) ? 29 : 28;
  }
  const thirtyDayMonths = [3, 5, 8, 10]; // Apr, Jun, Sep, Nov
  return thirtyDayMonths.includes(monthZeroIndexed) ? 30 : 31;
}

/**
 * Deterministically parses a date string into [year, monthIndex, day].
 * Accepts:
 *   - "DD-MMM-YYYY" (e.g. "13-Jun-2025" or "13-JUN-2025")
 *   - "YYYY-MM-DD"  (e.g. "2025-06-13")
 *
 * Avoids browser timezone drift by extracting integer calendar day components.
 * Returns null for invalid, malformed, or impossible calendar dates.
 */
export function parseDateComponents(dateStr: string | null | undefined): [number, number, number] | null {
  if (!dateStr || typeof dateStr !== 'string') {
    return null;
  }

  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Pattern 1: DD-MMM-YYYY (e.g. 13-Jun-2025 or 14-May-2024)
  const dmmmyyyyMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (dmmmyyyyMatch) {
    const day = parseInt(dmmmyyyyMatch[1], 10);
    const monthKey = dmmmyyyyMatch[2].toLowerCase();
    const year = parseInt(dmmmyyyyMatch[3], 10);

    if (!(monthKey in MONTH_MAP)) return null;
    const month = MONTH_MAP[monthKey];

    if (year < 1900 || year > 2100) return null;
    const maxDays = getDaysInMonth(year, month);
    if (day < 1 || day > maxDays) return null;

    return [year, month, day];
  }

  // Pattern 2: YYYY-MM-DD (e.g. 2025-06-13)
  const yyyymmddMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const year = parseInt(yyyymmddMatch[1], 10);
    const month1 = parseInt(yyyymmddMatch[2], 10);
    const day = parseInt(yyyymmddMatch[3], 10);

    if (month1 < 1 || month1 > 12) return null;
    const month = month1 - 1;

    if (year < 1900 || year > 2100) return null;
    const maxDays = getDaysInMonth(year, month);
    if (day < 1 || day > maxDays) return null;

    return [year, month, day];
  }

  return null;
}

/**
 * Calculates calendar days remaining between referenceDate and deadlineDate.
 * Both dates are evaluated as UTC midnight calendar days, completely eliminating
 * local timezone offsets and DST anomalies.
 *
 * Returns:
 *   - integer days remaining (positive = future, 0 = due today, negative = expired)
 *   - null if either date string is invalid or unverified.
 */
export function calculateDaysRemaining(
  deadlineStr: string | null | undefined,
  referenceDateStr?: string | null | undefined
): number | null {
  const deadlineComps = parseDateComponents(deadlineStr);
  if (!deadlineComps) return null;

  let refComps: [number, number, number] | null = null;
  if (referenceDateStr) {
    refComps = parseDateComponents(referenceDateStr);
    if (!refComps) return null;
  } else {
    // Current date in UTC
    const now = new Date();
    refComps = [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
  }

  const [dYear, dMonth, dDay] = deadlineComps;
  const [rYear, rMonth, rDay] = refComps;

  const deadlineUtc = Date.UTC(dYear, dMonth, dDay);
  const refUtc = Date.UTC(rYear, rMonth, rDay);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((deadlineUtc - refUtc) / MS_PER_DAY);
}

/**
 * Computes the statutory urgency and state from days left.
 * Mutually exclusive states:
 *   - UNVERIFIED: null, undefined, or NaN
 *   - EXPIRED:    daysLeft < 0
 *   - DUE TODAY:  daysLeft === 0
 *   - CRITICAL:   0 < daysLeft < 7
 *   - WARNING:    7 <= daysLeft <= 14
 *   - NORMAL:     daysLeft > 14
 */
export function getUrgencyInfo(daysLeft: number | null | undefined): UrgencyInfo {
  if (daysLeft === null || daysLeft === undefined || typeof daysLeft !== 'number' || isNaN(daysLeft)) {
    return {
      state: 'UNVERIFIED',
      level: 'unverified',
      label: 'Deadline Not Verified',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
      barColor: '#94A3B8',
      textColor: 'text-slate-600',
      description: 'Deadline not verified. Please check the notice date.',
      isExpired: false,
      isDueToday: false,
      isUrgent: false,
      isVerified: false,
    };
  }

  if (daysLeft < 0) {
    return {
      state: 'EXPIRED',
      level: 'expired',
      label: 'Statutory Window Elapsed',
      badgeClass: 'bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]',
      barColor: '#991B1B',
      textColor: 'text-[#991B1B]',
      description: 'Statutory response window elapsed. Verify the applicable deadline with your tax professional.',
      isExpired: true,
      isDueToday: false,
      isUrgent: true,
      isVerified: true,
    };
  }

  if (daysLeft === 0) {
    return {
      state: 'DUE TODAY',
      level: 'due_today',
      label: 'Due Today',
      badgeClass: 'bg-[#FEF2F2] text-[#C0392B] border border-[#F87171] animate-pulse',
      barColor: '#C0392B',
      textColor: 'text-[#C0392B]',
      description: 'Due today — professional verification and immediate submission recommended.',
      isExpired: false,
      isDueToday: true,
      isUrgent: true,
      isVerified: true,
    };
  }

  if (daysLeft < 7) {
    return {
      state: 'CRITICAL',
      level: 'critical',
      label: 'Critical Phase',
      badgeClass: 'bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA]',
      barColor: '#C0392B',
      textColor: 'text-[#C0392B]',
      description: 'Less than 7 days remaining. Immediate CA intervention recommended.',
      isExpired: false,
      isDueToday: false,
      isUrgent: true,
      isVerified: true,
    };
  }

  if (daysLeft <= 14) {
    return {
      state: 'WARNING',
      level: 'caution',
      label: 'Caution Phase',
      badgeClass: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
      barColor: '#D97706',
      textColor: 'text-[#D97706]',
      description: '7 to 14 days remaining. Active evidence preparation window.',
      isExpired: false,
      isDueToday: false,
      isUrgent: false,
      isVerified: true,
    };
  }

  return {
    state: 'NORMAL',
    level: 'normal',
    label: 'Normal Window',
    badgeClass: 'bg-[#E7F4EE] text-[#087F73] border border-[#119B72]/30',
    barColor: '#087F73',
    textColor: 'text-[#087F73]',
    description: 'More than 14 days remaining. Standard response cycle.',
    isExpired: false,
    isDueToday: false,
    isUrgent: false,
    isVerified: true,
  };
}

/**
 * Computes circle stroke dash offset for the 30-day countdown ring.
 * Radius 68 -> circumference = 2 * PI * 68 ≈ 427.26
 * Expired or non-positive days show complete fill (offset = circumference).
 */
export function getRingDashOffset(daysLeft: number | null | undefined, totalDays = 30, circumference = 427.26): number {
  if (daysLeft === null || daysLeft === undefined || typeof daysLeft !== 'number' || isNaN(daysLeft) || daysLeft <= 0) {
    return circumference;
  }
  const clamped = Math.min(daysLeft, totalDays);
  const progressRatio = clamped / totalDays;
  return circumference * (1 - progressRatio);
}
