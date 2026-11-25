import { CANONICAL_DEMO_CASE } from '../data/demoCase';

export interface AmountValidationResult {
  isValid: boolean;
  parsedAmount: number | null;
  errorMessage?: string;
  expectedAmount: number;
  tableGstr3b: number;
  tableGstr2b: number;
}

/**
 * Validates the human confirmed amount against the notice table difference
 */
export function validateConfirmedAmount(inputVal: string | number): AmountValidationResult {
  const row2 = CANONICAL_DEMO_CASE.rows[1];
  const expectedAmount = row2.gstr3b - row2.gstr2b; // 1492450 - 1308200 = 184250

  const cleaned = String(inputVal).replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return {
      isValid: false,
      parsedAmount: null,
      errorMessage: 'Please enter an amount to confirm.',
      expectedAmount,
      tableGstr3b: row2.gstr3b,
      tableGstr2b: row2.gstr2b,
    };
  }

  const parsed = Math.round(parseFloat(cleaned));

  if (isNaN(parsed)) {
    return {
      isValid: false,
      parsedAmount: null,
      errorMessage: 'Invalid numeric amount.',
      expectedAmount,
      tableGstr3b: row2.gstr3b,
      tableGstr2b: row2.gstr2b,
    };
  }

  if (parsed !== expectedAmount) {
    return {
      isValid: false,
      parsedAmount: parsed,
      errorMessage: 'This does not match the notice table (₹14,92,450 − ₹13,08,200 = ₹1,84,250). Please re-check the highlighted cell.',
      expectedAmount,
      tableGstr3b: row2.gstr3b,
      tableGstr2b: row2.gstr2b,
    };
  }

  return {
    isValid: true,
    parsedAmount: parsed,
    expectedAmount,
    tableGstr3b: row2.gstr3b,
    tableGstr2b: row2.gstr2b,
  };
}

/**
 * Statutory Section 170 CGST Rounding:
 * Parts of 50 paise or more round UP to +1 rupee; less than 50 paise is ignored.
 * Evaluated symmetrically on absolute magnitude for credit notes and negative amounts
 * ensuring exact alignment with Python's Decimal.quantize(ROUND_HALF_UP).
 */
export function roundStatutoryINR(val: number): number {
  const roundedMag = Math.floor(Math.abs(val) + 0.5);
  if (roundedMag === 0) return 0;
  return val < 0 ? -roundedMag : roundedMag;
}
