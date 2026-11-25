import { describe, it, expect } from 'vitest';
import { verifyDraft, ConfirmedFields } from '../verifier';
import { formatINR } from '../format';
import { roundStatutoryINR } from '../amount';

describe('15 Failure Scenarios Test Suite (Frontend Validation)', () => {
  const baseConfirmed: ConfirmedFields = {
    confirmedAmount: 184250,
    noticeDate: '14-May-2025',
    allowedDates: ['14-May-2025', '26-May-2025', '13-Jun-2025'],
    allowedSections: ['Section 61', 'Section 16', 'Section 16(2)', 'Rule 99', 'Rule 99(2)'],
    gstin: '27XXXXX1234X1ZX',
    noticeRef: 'ZA270525008912M',
  };

  it('Scenario 1: Detects incorrect extracted tax amount in draft', () => {
    const text = 'Notice under Section 61 for M/s Sharma Garments (27XXXXX1234X1ZX) alleges ₹1,40,000 on 14-May-2025.';
    const report = verifyDraft(text, baseConfirmed);
    expect(report.passed).toBe(false);
    expect(report.financialConsistency).toBe(false);
    expect(report.divergenceAmount).toBe(44250);
  });

  it('Scenario 7: Flags unsupported statutory section cited in draft', () => {
    const text = 'Notice under Section 74 for M/s Sharma Garments (27XXXXX1234X1ZX) alleges ₹1,84,250 on 14-May-2025.';
    const report = verifyDraft(text, baseConfirmed);
    expect(report.passed).toBe(false);
    expect(report.legalVerification).toBe(false);
    expect(report.errors.some(e => e.includes('Section 74'))).toBe(true);
  });

  it('Scenario 12: Invalidation when user edits verified draft to mismatching amount', () => {
    const validText = 'Notice under Section 61 for M/s Sharma Garments (27XXXXX1234X1ZX) alleges ₹1,84,250 on 14-May-2025.';
    const validReport = verifyDraft(validText, baseConfirmed);
    expect(validReport.passed).toBe(true);

    // User edits draft
    const editedText = 'Notice under Section 61 for M/s Sharma Garments (27XXXXX1234X1ZX) alleges ₹1,20,000 on 14-May-2025.';
    const editedReport = verifyDraft(editedText, baseConfirmed);
    expect(editedReport.passed).toBe(false);
    expect(editedReport.verificationLevel).toBe('FAILED_MISMATCH');
  });

  it('Scenario 13: Invalidation when confirmed case amount changes', () => {
    const draftText = 'Notice under Section 61 for M/s Sharma Garments (27XXXXX1234X1ZX) alleges ₹1,84,250 on 14-May-2025.';
    const modifiedConfirmed: ConfirmedFields = {
      ...baseConfirmed,
      confirmedAmount: 195000,
    };
    const report = verifyDraft(draftText, modifiedConfirmed);
    expect(report.passed).toBe(false);
    expect(report.financialConsistency).toBe(false);
  });

  it('Section 170 CGST Precision Rounding invariant', () => {
    // 50 paise rounds UP, 49 paise rounds DOWN
    expect(roundStatutoryINR(184250.50)).toBe(184251);
    expect(roundStatutoryINR(184250.49)).toBe(184250);
    expect(roundStatutoryINR(184250.00)).toBe(184250);
    expect(formatINR(roundStatutoryINR(184250.50))).toBe('₹1,84,251');
    expect(formatINR(184250.50, true)).toBe('₹1,84,250.50');
  });
});
