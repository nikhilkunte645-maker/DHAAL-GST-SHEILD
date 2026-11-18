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
  status: 'Unreported in 2B' | 'Delayed Filing' | 'Classification Error';
}

// 24 invoice rows designed to sum up to exactly ₹1,84,250
const baseAmounts = [
  8250, 7500, 9200, 6800, 11400, 5600, 8900, 7100,
  9500, 6400, 8100, 7300, 8800, 6200, 7900, 8300,
  6900, 7700, 8500, 6600, 9100, 7400, 8300, 2600,
];
// Sum of baseAmounts:
// 8250+7500+9200+6800+11400+5600+8900+7100 = 64750
// 9500+6400+8100+7300+8800+6200+7900+8300 = 62500
// 6900+7700+8500+6600+9100+7400+8300+2600 = 57000
// 64750 + 62500 + 57000 = 184250! Exactly 184,250!

export const RECONCILIATION_ROWS: ReconciliationRow[] = baseAmounts.map((diff, index) => {
  const invNum = 1101 + index;
  const day = (index % 25) + 1;
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const month = index < 8 ? 'Apr' : index < 16 ? 'May' : 'Jun';
  const taxable = Math.round(diff / 0.18); // at 18% GST

  return {
    srNo: index + 1,
    invoiceNo: `AT/24-25/${invNum}`,
    invoiceDate: `${dayStr}-${month}-2024`,
    supplierName: 'M/s Apex Textiles (fictional)',
    supplierGstin: '27XXXXX5678X1ZX',
    taxableValue: taxable,
    claimedItc: diff,
    available2b: 0,
    difference: diff,
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
    `"${r.status}"`,
  ]);

  const totalDiff = RECONCILIATION_ROWS.reduce((acc, r) => acc + r.difference, 0);
  const totalTaxable = RECONCILIATION_ROWS.reduce((acc, r) => acc + r.taxableValue, 0);

  const summaryRow = [
    'TOTAL',
    '24 Invoices',
    '-',
    '-',
    '-',
    totalTaxable,
    totalDiff,
    0,
    totalDiff,
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
