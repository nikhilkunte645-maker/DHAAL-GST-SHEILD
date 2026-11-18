/**
 * CANONICAL DEMO DATA (Single source of truth: src/data/demoCase.ts)
 * 
 * LEGAL NOTICE: Legal consequence text and statutory interpretations in this demo
 * are unverified synthetic representations for hackathon simulation purposes.
 * Must be verified against the official CGST Act, 2017 and relevant rules before any public use.
 */

export interface DiscrepancyRow {
  srNo: string;
  category: string;
  gstr3b: number;
  gstr2b: number;
  difference: number;
  isSmudged?: boolean;
}

export interface DemoCaseData {
  businessName: string;
  proprietorName: string;
  gstin: string;
  noticeRef: string;
  caseId: string;
  formType: string;
  formRule: string;
  noticeDate: string; // 14-May-2025
  taxPeriod: string;  // FY 2024-25, Q1 (Apr-Jun 2024)
  taxPeriodShort: string; // Apr-Jun 2024
  fixedClockDate: string; // 01-Jun-2025
  replyDeadline: string; // 13-Jun-2025
  recommendedCaSign: string; // 08-Jun-2025
  statutoryWindowDays: number; // 30
  daysRemaining: number; // 12
  
  // Table rows
  rows: DiscrepancyRow[];
  
  // Scrutiny office
  office: {
    state: string;
    designation: string;
    division: string;
    officer: string; // Proper Officer (name redacted)
    ward: string;
  };
  
  // Extraction uncertainty
  extraction: {
    primaryEngineAmount: number; // 184250
    verificationPassAmount: number; // 181250
    delta: number; // 3000
    smudgeCharIndex: number; // 4
    magnification: string; // 4.8x
  };

  // Supporting entities (fictional)
  supplier: {
    name: string;
    gstin: string;
    invoiceNo: string;
    invoiceDate: string;
    amount: number;
    taxAmount: number;
  };
  
  banking: {
    bankName: string; // Sample Bank
    utr: string; // SAMPLEUTR0001
    status: string; // 100% Cleared
  };

  transport: {
    ewayBillNo: string; // EWB-SAMPLE-0001
    status: string;
  };

  caCounsel: {
    name: string; // Assigned CA (to be added)
    membershipNo: string;
    passcode: string;
  };
}

export const CANONICAL_DEMO_CASE: DemoCaseData = {
  businessName: 'M/s Sharma Garments',
  proprietorName: 'Ramesh Sharma',
  gstin: '27XXXXX1234X1ZX',
  noticeRef: 'ZA270525008912M',
  caseId: 'DH-2025-ASMT10-8912',
  formType: 'Form GST ASMT-10',
  formRule: '[See Rule 99(1)]',
  noticeDate: '14-May-2025',
  taxPeriod: 'FY 2024-25, Q1 (Apr-Jun 2024)',
  taxPeriodShort: 'Apr 2024 – Jun 2024',
  fixedClockDate: '01-Jun-2025',
  replyDeadline: '13-Jun-2025',
  recommendedCaSign: '08-Jun-2025',
  statutoryWindowDays: 30,
  daysRemaining: 12,

  rows: [
    {
      srNo: '01',
      category: 'Inward supplies liable to Reverse Charge (RCM)',
      gstr3b: 45000,
      gstr2b: 45000,
      difference: 0,
      isSmudged: false,
    },
    {
      srNo: '02',
      category: 'Excess Input Tax Credit Claimed (Table 4(A)(5) vs GSTR-2B)',
      gstr3b: 1492450,
      gstr2b: 1308200,
      difference: 184250, // 1492450 - 1308200
      isSmudged: true,
    },
  ],

  office: {
    state: 'Government of Maharashtra',
    designation: 'Office of the Assistant Commissioner of State Tax',
    division: 'Nodal Division-IV, Bandra-Kurla Complex, Mumbai - 400051',
    officer: 'Proper Officer (name redacted)',
    ward: 'Ward 102',
  },

  extraction: {
    primaryEngineAmount: 184250,
    verificationPassAmount: 181250,
    delta: 3000,
    smudgeCharIndex: 4,
    magnification: '4.8x',
  },

  supplier: {
    name: 'M/s Apex Textiles (fictional)',
    gstin: '27XXXXX5678X1ZX',
    invoiceNo: 'AT/24-25/1102',
    invoiceDate: '18-Jun-2024',
    amount: 1023611,
    taxAmount: 184250,
  },

  banking: {
    bankName: 'Sample Bank',
    utr: 'SAMPLEUTR0001',
    status: '100% Cleared, Sample Bank',
  },

  transport: {
    ewayBillNo: 'EWB-SAMPLE-0001',
    status: 'Consignment Received & Verified',
  },

  caCounsel: {
    name: 'Assigned CA (to be added)',
    membershipNo: 'FCA Mem. #XXXXXX',
    passcode: 'DH-8912-PASS',
  },
};
