import { describe, it, expect } from 'vitest';
import { verifyDraft, ConfirmedFields } from '../verifier';
import { formatINR } from '../format';
import { roundStatutoryINR, validateConfirmedAmount } from '../amount';
import { calculateStatutoryDueDate } from '../deadline';
import { CANONICAL_DEMO_CASE } from '../../data/demoCase';
import { RECONCILIATION_ROWS } from '../../data/reconciliationData';

describe('Frontend End-to-End GST Scrutiny Workflow Integration', () => {
  it('completes full deterministic audit and validation cycle', () => {
    // 1. Notice Date and 30-Day Statutory Deadline
    const noticeDate = '14-May-2025';
    const deadline = calculateStatutoryDueDate(noticeDate);
    expect(deadline.dueDateStr).toBe('13-Jun-2025');
    expect(deadline.isExplicitlySpecified).toBe(false);

    // 2. Financial Amount & Section 170 Statutory Rounding
    const unroundedDemand = 184250.49;
    const roundedDemand = roundStatutoryINR(unroundedDemand);
    expect(roundedDemand).toBe(184250);
    expect(formatINR(roundedDemand)).toBe('₹1,84,250');

    // 3. Reconciliation Ledger Integrity
    expect(RECONCILIATION_ROWS.length).toBe(24);
    const totalTaxable = RECONCILIATION_ROWS.reduce((sum, r) => sum + r.taxableValue, 0);
    expect(totalTaxable).toBeGreaterThan(0);

    // 4. Draft Generation & Deterministic Multi-Tier Verification
    const draftText = `In response to Notice ${CANONICAL_DEMO_CASE.caseId} dated 14-May-2025 issued under Section 61, the taxpayer M/s Sharma Garments (${CANONICAL_DEMO_CASE.gstin}) submits explanation regarding Input Tax Credit variance of ₹1,84,250.`;
    const confirmed: ConfirmedFields = {
      confirmedAmount: 184250,
      noticeDate: '14-May-2025',
      allowedDates: ['14-May-2025', '2025-05-14'],
      allowedSections: ['Section 61', '61'],
      gstin: CANONICAL_DEMO_CASE.gstin,
      noticeRef: CANONICAL_DEMO_CASE.caseId,
    };

    const report = verifyDraft(draftText, confirmed);
    expect(report.passed).toBe(true);
    expect(report.financialConsistency).toBe(true);
    expect(report.humanApprovalRequired).toBe(true);

    // 5. Invalidation on User Altering Financial Values
    const tamperedDraft = draftText.replace('₹1,84,250', '₹1,50,000');
    const tamperedReport = verifyDraft(tamperedDraft, confirmed);
    expect(tamperedReport.passed).toBe(false);
    expect(tamperedReport.errors.length).toBeGreaterThan(0);
  });

  it('validates synthetic demo case provenance markers', () => {
    expect(CANONICAL_DEMO_CASE.gstin).toBe('27XXXXX1234X1ZX');
    expect(CANONICAL_DEMO_CASE.supplier.gstin).toBe('27XXXXX5678X1ZX');
    expect(CANONICAL_DEMO_CASE.caseId).toContain('ASMT10');
    const parsed = validateConfirmedAmount('₹1,84,250');
    expect(parsed.isValid).toBe(true);
    expect(parsed.parsedAmount).toBe(184250);
  });
});
