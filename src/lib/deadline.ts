/**
 * Dhaal (ढाल) - Statutory GST Notice Deadline & Legal Limitation Engine
 *
 * Statutory Authorities Grounding:
 * - CGST Section 61(1): Proper officer's authority to scrutinize return and inform discrepancies.
 * - CGST Rule 99(1): Communication in FORM GST ASMT-10 seeking explanation within 30 days or such further period as permitted.
 * - CGST Rule 99(2): Registered person's explanation / acceptance in FORM GST ASMT-11.
 * - CGST Section 61(3): Consequence of non-reply / non-acceptance -> Audit (Sec 65/66), Inspection/Search (Sec 67),
 *   or Adjudication under Section 73/74 (up to FY 2023-24) or Section 74A (FY 2024-25 onwards).
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
  extensionNotice?: string;
}

export interface StatutoryContext {
  authoritySection: string; // "Section 61(1)"
  noticeRule: string; // "Rule 99(1)"
  replyRule: string; // "Rule 99(2)"
  subsequentActionSection: string; // "Section 61(3)"
  adjudicationSection: string; // "Section 73/74" or "Section 74A"
  isUnified74A: boolean;
  limitationDescription: string;
  legalDisclaimer: string;
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
 * Evaluated as UTC midnight calendar days, completely eliminating local timezone drift.
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
 * Computes period-aware adjudication statutory reference:
 * - Periods up to FY 2023-24: Section 73 (non-fraud) / Section 74 (fraud)
 * - Periods from FY 2024-25 onwards: Section 74A (unified non-fraud & fraud limitation,
 *   inserted by Finance (No. 2) Act, 2024).
 */
export function getApplicableDeterminationSection(financialYear: string | null | undefined): StatutoryContext {
  const defaultDisclaimer =
    'This statutory context is an algorithmic categorization based on the CGST Act as amended. It does not constitute a formal legal opinion on limitation without factual examination by a qualified Chartered Accountant or advocate.';

  if (!financialYear || typeof financialYear !== 'string') {
    return {
      authoritySection: 'Section 61(1)',
      noticeRule: 'Rule 99(1)',
      replyRule: 'Rule 99(2)',
      subsequentActionSection: 'Section 61(3)',
      adjudicationSection: 'Section 73/74 (up to FY 23-24) or Section 74A (FY 24-25 onwards)',
      isUnified74A: false,
      limitationDescription: 'Financial year unverified; statutory adjudication section requires year confirmation.',
      legalDisclaimer: defaultDisclaimer,
    };
  }

  const trimmed = financialYear.trim();
  const isPost2024 =
    trimmed.includes('2024-25') ||
    trimmed.includes('2025-26') ||
    trimmed.includes('24-25') ||
    trimmed.includes('25-26');

  if (isPost2024) {
    return {
      authoritySection: 'Section 61(1)',
      noticeRule: 'Rule 99(1)',
      replyRule: 'Rule 99(2)',
      subsequentActionSection: 'Section 61(3)',
      adjudicationSection: 'Section 74A',
      isUnified74A: true,
      limitationDescription:
        'Governed by Section 74A (inserted by Finance (No. 2) Act, 2024) for FY 2024-25 onwards, unifying determination proceedings.',
      legalDisclaimer: defaultDisclaimer,
    };
  }

  return {
    authoritySection: 'Section 61(1)',
    noticeRule: 'Rule 99(1)',
    replyRule: 'Rule 99(2)',
    subsequentActionSection: 'Section 61(3)',
    adjudicationSection: 'Section 73 or Section 74',
    isUnified74A: false,
    limitationDescription:
      'Governed by Section 73 (non-fraud) or Section 74 (fraud/wilful misstatement) for periods up to FY 2023-24.',
    legalDisclaimer: defaultDisclaimer,
  };
}

/**
 * Calculates the statutory reply due date considering:
 * - Actual specified due date in notice (Rule 99(1))
 * - Proper officer extension granted (Rule 99(1))
 * - Fallback to 30 days from notice date only when valid notice date exists
 * - Returns null when mandatory date context is missing (does NOT invent dates)
 */
export function calculateStatutoryDueDate(
  noticeDateStr: string | null | undefined,
  specifiedDueDateStr?: string | null | undefined,
  extensionDaysGranted?: number | null | undefined
): { dueDateStr: string | null; isExplicitlySpecified: boolean; hasExtension: boolean; extensionDays: number } {
  // If notice explicitly specifies a reply due date, respect it
  if (specifiedDueDateStr && parseDateComponents(specifiedDueDateStr)) {
    return {
      dueDateStr: specifiedDueDateStr,
      isExplicitlySpecified: true,
      hasExtension: Boolean(extensionDaysGranted && extensionDaysGranted > 0),
      extensionDays: extensionDaysGranted || 0,
    };
  }

  // Fallback: 30 days from notice date + extension
  const noticeComps = parseDateComponents(noticeDateStr);
  if (!noticeComps) {
    return {
      dueDateStr: null,
      isExplicitlySpecified: false,
      hasExtension: false,
      extensionDays: 0,
    };
  }

  const [nYear, nMonth, nDay] = noticeComps;
  const baseNoticeUtc = Date.UTC(nYear, nMonth, nDay);
  const totalDays = 30 + (extensionDaysGranted && extensionDaysGranted > 0 ? extensionDaysGranted : 0);
  const dueUtc = baseNoticeUtc + totalDays * 24 * 60 * 60 * 1000;

  const dueDate = new Date(dueUtc);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDueDate = `${dueDate.getUTCDate().toString().padStart(2, '0')}-${months[dueDate.getUTCMonth()]}-${dueDate.getUTCFullYear()}`;

  return {
    dueDateStr: formattedDueDate,
    isExplicitlySpecified: false,
    hasExtension: Boolean(extensionDaysGranted && extensionDaysGranted > 0),
    extensionDays: extensionDaysGranted || 0,
  };
}

/**
 * Computes urgency info from days remaining.
 */
export function getUrgencyInfo(
  daysLeft: number | null | undefined,
  extensionNotice?: string
): UrgencyInfo {
  if (daysLeft === null || daysLeft === undefined || typeof daysLeft !== 'number' || isNaN(daysLeft)) {
    return {
      state: 'UNVERIFIED',
      level: 'unverified',
      label: 'Deadline Not Verified',
      badgeClass: 'bg-slate-100 text-slate-700 border border-slate-300',
      barColor: '#94A3B8',
      textColor: 'text-slate-600',
      description: 'Notice date / reply deadline not verified. Professional verification required.',
      isExpired: false,
      isDueToday: false,
      isUrgent: false,
      isVerified: false,
      extensionNotice,
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
      description: 'Statutory response window elapsed under Rule 99(1). Officer may initiate action under Section 61(3). Verify limitation with a CA.',
      isExpired: true,
      isDueToday: false,
      isUrgent: true,
      isVerified: true,
      extensionNotice,
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
      description: 'Due today under Rule 99(1) — immediate submission of Form GST ASMT-11 recommended.',
      isExpired: false,
      isDueToday: true,
      isUrgent: true,
      isVerified: true,
      extensionNotice,
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
      description: 'Less than 7 days remaining under Rule 99(1). Active CA review recommended.',
      isExpired: false,
      isDueToday: false,
      isUrgent: true,
      isVerified: true,
      extensionNotice,
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
      description: '7 to 14 days remaining. Active evidence collection window.',
      isExpired: false,
      isDueToday: false,
      isUrgent: false,
      isVerified: true,
      extensionNotice,
    };
  }

  return {
    state: 'NORMAL',
    level: 'normal',
    label: 'Normal Window',
    badgeClass: 'bg-[#E7F4EE] text-[#087F73] border border-[#119B72]/30',
    barColor: '#087F73',
    textColor: 'text-[#087F73]',
    description: 'More than 14 days remaining under Rule 99(1). Standard response cycle.',
    isExpired: false,
    isDueToday: false,
    isUrgent: false,
    isVerified: true,
    extensionNotice,
  };
}

/**
 * Computes circle stroke dash offset for the countdown ring.
 */
export function getRingDashOffset(daysLeft: number | null | undefined, totalDays = 30, circumference = 427.26): number {
  if (daysLeft === null || daysLeft === undefined || typeof daysLeft !== 'number' || isNaN(daysLeft) || daysLeft <= 0) {
    return circumference;
  }
  const clamped = Math.min(daysLeft, totalDays);
  const progressRatio = clamped / totalDays;
  return circumference * (1 - progressRatio);
}
