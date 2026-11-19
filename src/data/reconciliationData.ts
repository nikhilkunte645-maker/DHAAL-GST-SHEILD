/**
 * Dhaal (ढाल) - Itemized Statutory Reconciliation Ledger (24 Invoices)
 *
 * Financial Precision Policy:
 * 1. Authoritative monetary amounts are stored as whole integer rupees per Section 170 of the CGST Act, 2017.
 * 2. To eliminate reverse-calculation floating-point drift, every invoice specifies explicit source taxable values
 *    rather than computing `Math.round(diff / 0.18)` on the fly.
 * 3. The 24 individual invoice line discrepancies sum exactly to ₹1,84,250, fully reconciling Table 4(A)(5) Row 02.
 */

export interface ReconciliationRow {
  srNo: number;
  invoiceNo: string;
  invoiceDate: string;
  supplierName: string;
  supplierGstin: string;
  taxableValue: number;
  claimedItc: number;
  available2b: number;
  difference: number;
  gstRate: number;
  status: 'Unreported in 2B' | 'Delayed Filing' | 'Classification Error';
}

// 24 explicit invoice line items designed to sum up to exactly ₹1,84,250
interface InvoiceSeed {
  diff: number;
  taxable: number;
}

const INVOICE_SEEDS: InvoiceSeed[] = [
  // Batch 1 (Apr 2024): 8250+7500+9200+6800+11400+5600+8900+7100 = 64750
  { diff: 8250,  taxable: 45833 },
  { diff: 7500,  taxable: 41667 },
  { diff: 9200,  taxable: 51111 },
  { diff: 6800,  taxable: 37778 },
  { diff: 11400, taxable: 63333 },
  { diff: 5600,  taxable: 31111 },
  { diff: 8900,  taxable: 49444 },
  { diff: 7100,  taxable: 39444 },

  // Batch 2 (May 2024): 9500+6400+8100+7300+8800+6200+7900+8300 = 62500
  { diff: 9500,  taxable: 52778 },
  { diff: 6400,  taxable: 35556 },
  { diff: 8100,  taxable: 45000 },
  { diff: 7300,  taxable: 40556 },
  { diff: 8800,  taxable: 48889 },
  { diff: 6200,  taxable: 34444 },
  { diff: 7900,  taxable: 43889 },
  { diff: 8300,  taxable: 46111 },

  // Batch 3 (Jun 2024): 6900+7700+8500+6600+9100+7400+8300+2500 = 57000
  { diff: 6900,  taxable: 38333 },
  { diff: 7700,  taxable: 42778 },
  { diff: 8500,  taxable: 47222 },
  { diff: 6600,  taxable: 36667 },
  { diff: 9100,  taxable: 50556 },
  { diff: 7400,  taxable: 41111 },
  { diff: 8300,  taxable: 46111 },
  { diff: 2500,  taxable: 13889 },
];

// 64750 + 62500 + 57000 = 184250! Exactly ₹1,84,250!
export const TOTAL_QUESTIONED_ITC = INVOICE_SEEDS.reduce((acc, s) => acc + s.diff, 0); // 184250
export const TOTAL_TAXABLE_VALUE = INVOICE_SEEDS.reduce((acc, s) => acc + s.taxable, 0); // 1023611

export const RECONCILIATION_ROWS: ReconciliationRow[] = INVOICE_SEEDS.map((seed, index) => {
  const invNum = 1101 + index;
  const day = (index % 25) + 1;
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const month = index < 8 ? 'Apr' : index < 16 ? 'May' : 'Jun';

  return {
    srNo: index + 1,
    invoiceNo: `AT/24-25/${invNum}`,
    invoiceDate: `${dayStr}-${month}-2024`,
    supplierName: 'M/s Apex Textiles (fictional)',
    supplierGstin: '27XXXXX5678X1ZX',
    taxableValue: seed.taxable,
    claimedItc: seed.diff,
    available2b: 0,
    difference: seed.diff,
    gstRate: 0.18,
    status: index === 0 ? 'Classification Error' : (index % 2 === 0 ? 'Delayed Filing' : 'Unreported in 2B'),
  };
});

export function generateReconciliationCsv(): string {
  const headers = [
    'Sr No',
    'Invoice Number',
    'Invoice Date',
    'Supplier Name',
    'Supplier GSTIN',
    'Taxable Value (INR)',
    'ITC Claimed 3B (INR)',
    'ITC Available 2B (INR)',
    'Difference (INR)',
    'GST Rate',
    'Audit Status',
  ];

  const rows = RECONCILIATION_ROWS.map(r => [
    r.srNo,
    r.invoiceNo,
    r.invoiceDate,
    `"${r.supplierName}"`,
    r.supplierGstin,
    r.taxableValue,
    r.claimedItc,
    r.available2b,
    r.difference,
    '18%',
    `"${r.status}"`,
  ]);

  const summaryRow = [
    'TOTAL',
    '24 Invoices',
    '-',
    '-',
    '-',
    TOTAL_TAXABLE_VALUE,
    TOTAL_QUESTIONED_ITC,
    0,
    TOTAL_QUESTIONED_ITC,
    '18%',
    'Reconciled to Form ASMT-10 Row 02',
  ];

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
    summaryRow.join(','),
  ].join('\n');
}

export function downloadReconciliationCsv(): void {
  const csvContent = generateReconciliationCsv();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'DHAAL_GSTR3B_vs_GSTR2B_Reconciliation_FY24-25_Q1.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
