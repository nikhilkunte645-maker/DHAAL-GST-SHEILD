import { describe, it, expect } from 'vitest';
import { formatINR, formatNumberINR } from '../format';
import { validateConfirmedAmount } from '../amount';
import { getUrgencyInfo, getRingDashOffset } from '../deadline';
import { verifyDraft, ConfirmedFields } from '../verifier';
import { computeSha256 } from '../hash';

describe('formatINR', () => {
  it('formats Indian rupee amounts with commas properly', () => {
    expect(formatINR(184250)).toBe('₹1,84,250');
    expect(formatINR(1492450)).toBe('₹14,92,450');
    expect(formatINR(1308200, true)).toBe('₹13,08,200.00');
    expect(formatINR(0)).toBe('₹0');
  });

  it('handles negative and string inputs', () => {
    expect(formatINR(-3000)).toBe('-₹3,000');
    expect(formatINR('184250')).toBe('₹1,84,250');
    expect(formatNumberINR(184250)).toBe('1,84,250');
  });
});

describe('validateConfirmedAmount', () => {
  it('validates matching notice table difference (1492450 - 1308200 = 184250)', () => {
    const result = validateConfirmedAmount('184250');
    expect(result.isValid).toBe(true);
    expect(result.parsedAmount).toBe(184250);
  });

  it('rejects mismatching amounts with helpful error referencing table arithmetic', () => {
    const result = validateConfirmedAmount('181250');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('₹14,92,450 − ₹13,08,200 = ₹1,84,250');
  });

  it('rejects empty or non-numeric inputs', () => {
    const result = validateConfirmedAmount('');
    expect(result.isValid).toBe(false);
  });
});

describe('getUrgencyInfo and getRingDashOffset', () => {
  it('identifies urgency phases accurately', () => {
    expect(getUrgencyInfo(20).level).toBe('normal');
    expect(getUrgencyInfo(12).level).toBe('caution');
    expect(getUrgencyInfo(5).level).toBe('critical');
  });

  it('computes circle stroke dash offsets', () => {
    const full = getRingDashOffset(30, 30, 427.26);
    expect(full).toBeCloseTo(0, 1);
    const zero = getRingDashOffset(0, 30, 427.26);
    expect(zero).toBeCloseTo(427.26, 1);
    const twelve = getRingDashOffset(12, 30, 427.26);
    expect(twelve).toBeGreaterThan(0);
  });
});

describe('verifyDraft', () => {
  const confirmed: ConfirmedFields = {
    confirmedAmount: 184250,
    noticeDate: '14-May-2025',
    allowedDates: ['14-May-2025', '26-May-2025', '13-Jun-2025', '18-Jun-2024'],
    allowedSections: ['Section 61', 'Section 16', 'Rule 99'],
    gstin: '27XXXXX1234X1ZX',
    noticeRef: 'ZA270525008912M',
  };

  const passingDraft = `
    Sharma Garments (GSTIN: 27XXXXX1234X1ZX)
    In response to notice dated 14-May-2025, the alleged mismatch of ₹1,84,250 under Section 61 and Section 16(2)
    has been audited. Submission target is 26-May-2025 before deadline 13-Jun-2025.
  `;

  it('passes a fully aligned draft', () => {
    const result = verifyDraft(passingDraft, confirmed);
    expect(result.passed).toBe(true);
    expect(result.passedCount).toBe(5);
    expect(result.errors.length).toBe(0);
  });

  it('fails when draft asserts a divergent amount (e.g. ₹1,81,250)', () => {
    const failingDraft = `
      Sharma Garments (GSTIN: 27XXXXX1234X1ZX)
      In response to notice dated 14-May-2025, the alleged mismatch of ₹1,81,250 under Section 61 and Section 16(2)
      has been audited. Target date 26-May-2025.
    `;
    const result = verifyDraft(failingDraft, confirmed);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('1,81,250'))).toBe(true);
    expect(result.divergenceAmount).toBe(3000);
  });

  it('fails when an unanchored date is cited', () => {
    const badDateDraft = `
      Sharma Garments (GSTIN: 27XXXXX1234X1ZX)
      In response to notice dated 01-Jan-2099, the mismatch of ₹1,84,250 under Section 61.
    `;
    const result = verifyDraft(badDateDraft, confirmed);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('01-Jan-2099'))).toBe(true);
  });

  it('fails when an unsupported section is cited', () => {
    const badSectionDraft = `
      Sharma Garments (GSTIN: 27XXXXX1234X1ZX)
      In response to notice dated 14-May-2025, the mismatch of ₹1,84,250 under Section 999.
    `;
    const result = verifyDraft(badSectionDraft, confirmed);
    expect(result.passed).toBe(false);
    expect(result.errors.some(e => e.includes('Section 999'))).toBe(true);
  });
});

describe('computeSha256', () => {
  it('generates a valid hash and 8-character uppercase short hash', async () => {
    const result = await computeSha256('DHAAL-CASE-DH-2025-ASMT10-8912');
    expect(result.shortHash.length).toBe(8);
    expect(result.fullHash.length).toBe(64);
  });
});
