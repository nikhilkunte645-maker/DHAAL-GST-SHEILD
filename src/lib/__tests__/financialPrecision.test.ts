import { describe, it, expect } from 'vitest';
import { formatINR, formatNumberINR } from '../format';
import { validateConfirmedAmount, roundStatutoryINR } from '../amount';
import {
  RECONCILIATION_ROWS,
  TOTAL_QUESTIONED_ITC,
  TOTAL_TAXABLE_VALUE,
  generateReconciliationCsv,
} from '../../data/reconciliationData';

describe('Financial Precision & Statutory Reconciliation Policy', () => {
  describe('roundStatutoryINR Section 170 Policy', () => {
    it('rounds positive 50 paise boundary up to nearest rupee', () => {
      expect(roundStatutoryINR(184250.50)).toBe(184251);
      expect(roundStatutoryINR(184250.49)).toBe(184250);
      expect(roundStatutoryINR(100.00)).toBe(100);
      expect(roundStatutoryINR(0.0)).toBe(0);
    });

    it('rounds negative amounts (credit notes) symmetrically per Section 170', () => {
      expect(roundStatutoryINR(-1800.50)).toBe(-1801);
      expect(roundStatutoryINR(-1800.49)).toBe(-1800);
      expect(roundStatutoryINR(-0.50)).toBe(-1);
      expect(roundStatutoryINR(-0.49)).toBe(0);
    });
  });

  describe('formatINR utility', () => {
    it('formats integer amounts in Indian currency notation', () => {
      expect(formatINR(184250)).toBe('₹1,84,250');
      expect(formatINR(1492450)).toBe('₹14,92,450');
      expect(formatINR(1308200)).toBe('₹13,08,200');
    });

    it('formats negative values correctly', () => {
      expect(formatINR(-184250)).toBe('-₹1,84,250');
      expect(formatINR(-5000)).toBe('-₹5,000');
    });

    it('handles zero and invalid inputs gracefully', () => {
      expect(formatINR(0)).toBe('₹0');
      expect(formatINR('invalid')).toBe('₹0');
    });

    it('formats paise decimals when requested', () => {
      expect(formatINR(184250.5, true)).toBe('₹1,84,250.50');
      expect(formatINR(184250.49, true)).toBe('₹1,84,250.49');
    });

    it('formatNumberINR returns string without rupee symbol', () => {
      expect(formatNumberINR(184250)).toBe('1,84,250');
    });
  });

  describe('validateConfirmedAmount', () => {
    it('validates matching notice discrepancy (₹1,84,250)', () => {
      const res = validateConfirmedAmount('184250');
      expect(res.isValid).toBe(true);
      expect(res.parsedAmount).toBe(184250);
      expect(res.expectedAmount).toBe(184250);
    });

    it('rejects mismatched amount with detailed explanation', () => {
      const res = validateConfirmedAmount('180000');
      expect(res.isValid).toBe(false);
      expect(res.parsedAmount).toBe(180000);
      expect(res.errorMessage).toContain('This does not match the notice table');
    });

    it('rejects empty and non-numeric inputs', () => {
      expect(validateConfirmedAmount('').isValid).toBe(false);
      expect(validateConfirmedAmount('abc').isValid).toBe(false);
    });
  });

  describe('24-Invoice Statutory Reconciliation Ledger', () => {
    it('contains exactly 24 line items', () => {
      expect(RECONCILIATION_ROWS).toHaveLength(24);
    });

    it('sums exactly to ₹1,84,250 questioned tax difference', () => {
      const totalDifference = RECONCILIATION_ROWS.reduce((sum, r) => sum + r.difference, 0);
      expect(totalDifference).toBe(184250);
      expect(TOTAL_QUESTIONED_ITC).toBe(184250);
    });

    it('has explicit integer taxable values summing to TOTAL_TAXABLE_VALUE', () => {
      const sumTaxable = RECONCILIATION_ROWS.reduce((sum, r) => sum + r.taxableValue, 0);
      expect(sumTaxable).toBe(TOTAL_TAXABLE_VALUE);
      expect(sumTaxable).toBe(1023611);
    });

    it('ensures every row has valid positive integers and required metadata', () => {
      RECONCILIATION_ROWS.forEach((row, i) => {
        expect(row.srNo).toBe(i + 1);
        expect(row.difference).toBeGreaterThan(0);
        expect(row.taxableValue).toBeGreaterThan(0);
        expect(row.invoiceNo).toMatch(/^AT\/24-25\/\d+$/);
        expect(row.supplierGstin).toBe('27XXXXX5678X1ZX');
        expect(Number.isInteger(row.difference)).toBe(true);
        expect(Number.isInteger(row.taxableValue)).toBe(true);
      });
    });

    it('generates a valid RFC 4180 CSV export with correct totals', () => {
      const csv = generateReconciliationCsv();
      expect(csv).toContain('TOTAL,24 Invoices');
      expect(csv).toContain('184250');
      expect(csv).toContain('1023611');
      const lines = csv.split('\n');
      // 1 header + 24 rows + 1 total row = 26 lines
      expect(lines).toHaveLength(26);
    });
  });
});
