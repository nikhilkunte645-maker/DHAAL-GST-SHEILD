import { describe, it, expect } from 'vitest';
import { evaluatePeriodAwareSection16 } from '../section16';

describe('Period-Aware Section 16 Legal Compliance Model', () => {
  it('recognizes Section 16(2)(aa) for FY 2024-25 as strictly applicable', () => {
    const res = evaluatePeriodAwareSection16('2024-25', {
      invoicesAttached: true,
      bankPaymentVerified: true,
      ewayBillsAttached: true,
      supplierDeclarationObtained: false,
      recipientReturnFiled: true,
    });

    expect(res['16_2_aa'].isApplicableInPeriod).toBe(true);
    expect(res['16_2_aa'].status).toBe('ACTION_REQUIRED');
    expect(res['16_2_aa'].effectiveFrom).toBe('01.01.2022');
  });

  it('marks Section 16(2)(aa) as NOT_APPLICABLE_IN_PERIOD for FY 2017-18 and 2018-19', () => {
    const res = evaluatePeriodAwareSection16('2017-18', {
      invoicesAttached: true,
      bankPaymentVerified: true,
      ewayBillsAttached: true,
      supplierDeclarationObtained: false,
      recipientReturnFiled: true,
    });

    expect(res['16_2_aa'].isApplicableInPeriod).toBe(false);
    expect(res['16_2_aa'].status).toBe('NOT_APPLICABLE_IN_PERIOD');
  });

  it('flags partial E-Way bill coverage (18 of 24) without claiming 100% compliance', () => {
    const res = evaluatePeriodAwareSection16('2024-25', {
      invoicesAttached: true,
      bankPaymentVerified: true,
      ewayBillsAttached: true,
      partialEwayCoverage: true,
      supplierDeclarationObtained: false,
      recipientReturnFiled: true,
    });

    expect(res['16_2_b'].status).toBe('PARTIAL_UNVERIFIED');
    expect(res['16_2_b'].score).toBe(75);
    expect(res['16_2_b'].notes).toContain('6 consignments lack independent proof');
  });

  it('visibly marks demo records as SYNTHETIC', () => {
    const res = evaluatePeriodAwareSection16(
      '2024-25',
      {
        invoicesAttached: true,
        bankPaymentVerified: false,
        ewayBillsAttached: true,
        supplierDeclarationObtained: false,
        recipientReturnFiled: true,
      },
      true // isDemoMode
    );

    expect(res['16_2_proviso_2'].isSynthetic).toBe(true);
    expect(res['16_2_proviso_2'].status).toBe('UNVERIFIED_SYNTHETIC');
    expect(res['16_2_proviso_2'].notes).toContain('Sample UTR is demonstration data only');
  });
});
