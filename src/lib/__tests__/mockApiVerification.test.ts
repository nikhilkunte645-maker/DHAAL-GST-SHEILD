import { describe, it, expect, vi } from 'vitest';
import { dhaalApi, DraftVerifyRequest } from '../../mockApi';

describe('dhaalApi.runLocalVerification - Deterministic Verification Parity', () => {
  it('TEST A: Correct amount - confirmed_amount 184250, draft contains ₹1,84,250 returns PASS', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'In response to Section 61 notice, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.financial_consistency).toBe(true);
    expect(res.legal_verification).toBe(true);
    expect(res.human_approval_required).toBe(true);
    expect(res.mismatches).toBeUndefined();
  });

  it('TEST B: Tampered amount - confirmed_amount 184250, draft contains ₹1,50,000 returns FAIL and financial_consistency: false', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'In response to Section 61 notice, the discrepancy of ₹1,50,000 for Apr-Jun 2024 is asserted.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.financial_consistency).toBe(false);
    expect(res.message).toBe('Export blocked.');
    expect(res.mismatches).toBeDefined();
    expect(res.mismatches?.some(m => m.field === 'Discrepancy Amount')).toBe(true);
  });

  it('TEST C: Missing amount - confirmed_amount 184250, draft contains no discrepancy amount returns FAIL', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'In response to notice under Section 61 for Apr-Jun 2024, no specific amounts are stated.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.financial_consistency).toBe(false);
    expect(res.mismatches?.some(m => m.field === 'Discrepancy Amount')).toBe(true);
  });

  it('TEST D: Different amount - confirmed_amount 200000, draft contains ₹1,84,250 returns FAIL', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'In response to notice under Section 61 for Apr-Jun 2024, the discrepancy of ₹1,84,250 is recorded.',
      confirmed_amount: 200000,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.financial_consistency).toBe(false);
    expect(res.mismatches?.some(m => m.field === 'Discrepancy Amount')).toBe(true);
  });

  it('TEST E: Indian comma formatting - draft contains 1,84,250 is correctly recognized', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Notice under Section 61 for Apr-Jun 2024 involving 1,84,250 rupees.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.financial_consistency).toBe(true);
  });

  it('TEST F: International comma formatting - draft contains 184,250 is correctly recognized', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Notice under Section 61 for Apr-Jun 2024 involving 184,250 tax variance.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.financial_consistency).toBe(true);
  });

  it('TEST G: Raw numeric formatting - draft contains 184250 is correctly recognized', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 61 for Apr-Jun 2024 with total discrepancy 184250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.financial_consistency).toBe(true);
  });

  it('TEST H: Bounded section matching - Section 161 does NOT match Section 61', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 161 for Apr-Jun 2024 with total discrepancy ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.checks?.section_match).toBe(false);
    expect(res.legal_verification).toBe(false);
  });

  it('TEST I: Bounded section matching - Section 610 does NOT match Section 61', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 610 for Apr-Jun 2024 with total discrepancy ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.checks?.section_match).toBe(false);
  });

  it('TEST J: Bounded section matching - Section 61(1) subclause matches Section 61', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 61(1) for Apr-Jun 2024 with total discrepancy ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.checks?.section_match).toBe(true);
  });

  it('TEST K: Historical amount cited with competing discrepancy conclusion fails verification', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'In historical audit of FY 2021-22, ₹1,84,250 was referenced. However, under Section 61 for Apr-Jun 2024, the assessed discrepancy amount is ₹50,000.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.financial_consistency).toBe(false);
    expect(res.checks?.amount_match).toBe(false);
  });

  it('TEST L: Tax period equivalent "April to June 2024" matches "Apr-Jun 2024"', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 61 for April to June 2024 with total discrepancy ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.checks?.period_match).toBe(true);
  });

  it('TEST M: Tax period mismatch "Oct-Dec 2024" fails against "Apr-Jun 2024"', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 61 for Oct-Dec 2024 with total discrepancy ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.checks?.period_match).toBe(false);
  });

  it('TEST N: Bounded section matching - Section 61A does NOT match Section 61', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 61A for Apr-Jun 2024 with total discrepancy ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.checks?.section_match).toBe(false);
  });

  it('TEST O: Offline fallback verification is executed when API is unreachable', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network offline'));
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 61 for Apr-Jun 2024 with discrepancy ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    // verifyDraft falls back to runLocalVerification on network failure
    const res = await dhaalApi.verifyDraft(payload);
    expect(fetchSpy).toHaveBeenCalled();
    expect(res.status).toBe('PASS');
    expect(res.financial_consistency).toBe(true);
    fetchSpy.mockRestore();
  });

  it('TEST P: Multiple competing discrepancy amounts above 10,000 threshold fail verification', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Discrepancy of ₹1,84,250 was cited, but subsequent difference of ₹95,000 is reported under Section 61 for Apr-Jun 2024.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.financial_consistency).toBe(false);
    expect(res.checks?.amount_match).toBe(false);
  });

  it('TEST Q: Asymmetric section boundary - Confirmed 61(1) rejects draft Section 61 only', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'In response to Section 61 notice, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.',
      confirmed_amount: 184250,
      confirmed_section: '61(1)',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.checks?.section_match).toBe(false);
  });

  it('TEST R: Confirmed amount embedded in a larger number (e.g. 1184250) must FAIL', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'In response to Section 61 notice, discrepancy is 1184250 for Apr-Jun 2024.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.checks?.amount_match).toBe(false);
  });

  it('TEST S: Correct and contradictory periods appearing together in draft must FAIL', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Notice for Apr-Jun 2024 under Section 61 references discrepancy for Oct-Dec 2024 of ₹1,84,250.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('FAIL');
    expect(res.checks?.period_match).toBe(false);
  });

  it('TEST T: ₹1,84,250.50 decimal rounding to ₹1,84,251 matches under Section 170', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Under Section 61 for Apr-Jun 2024, discrepancy of ₹1,84,251 is reconciled.',
      confirmed_amount: 184250.50,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.checks?.amount_match).toBe(true);
  });

  it('TEST U: Correct discrepancy amount alongside an unrelated large currency figure (turnover) must PASS', () => {
    const payload: DraftVerifyRequest = {
      draft_text: 'Total taxable invoice turnover is ₹10,23,611. In response to Section 61 notice for Apr-Jun 2024, discrepancy of ₹1,84,250 is fully reconciled.',
      confirmed_amount: 184250,
      confirmed_section: '61',
      confirmed_period: 'Apr-Jun 2024',
    };
    const res = dhaalApi.runLocalVerification(payload);
    expect(res.status).toBe('PASS');
    expect(res.checks?.amount_match).toBe(true);
  });

  it('TEST V: Identical payload matrix produces matching deterministic results across scenarios', () => {
    const parityMatrix: { payload: DraftVerifyRequest; expectedStatus: 'PASS' | 'FAIL' }[] = [
      {
        payload: {
          draft_text: 'Under Section 61 notice, discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.',
          confirmed_amount: 184250,
          confirmed_section: '61',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'PASS',
      },
      {
        payload: {
          draft_text: 'Under Section 61(1) notice, discrepancy of ₹1,84,250 for April to June 2024 is reconciled.',
          confirmed_amount: 184250,
          confirmed_section: '61',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'PASS',
      },
      {
        payload: {
          draft_text: 'Under Section 61 notice, discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.',
          confirmed_amount: 184250,
          confirmed_section: '61(1)',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'FAIL',
      },
      {
        payload: {
          draft_text: 'Under Section 161 notice, discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.',
          confirmed_amount: 184250,
          confirmed_section: '61',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'FAIL',
      },
      {
        payload: {
          draft_text: 'Under Section 61A notice, discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.',
          confirmed_amount: 184250,
          confirmed_section: '61',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'FAIL',
      },
      {
        payload: {
          draft_text: 'Under Section 61 notice, discrepancy of ₹1,50,000 for Apr-Jun 2024 is asserted.',
          confirmed_amount: 184250,
          confirmed_section: '61',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'FAIL',
      },
      {
        payload: {
          draft_text: 'Notice under Section 61 for Apr-Jun 2024 mentions 1184250.',
          confirmed_amount: 184250,
          confirmed_section: '61',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'FAIL',
      },
      {
        payload: {
          draft_text: 'Under Section 61 for Apr-Jun 2024 and Oct-Dec 2024, discrepancy of ₹1,84,250.',
          confirmed_amount: 184250,
          confirmed_section: '61',
          confirmed_period: 'Apr-Jun 2024',
        },
        expectedStatus: 'FAIL',
      },
    ];

    for (const testCase of parityMatrix) {
      const res = dhaalApi.runLocalVerification(testCase.payload);
      expect(res.status).toBe(testCase.expectedStatus);
    }
  });
});
