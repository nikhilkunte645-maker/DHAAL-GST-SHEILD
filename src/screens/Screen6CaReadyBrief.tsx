import React, { useState, useEffect, useRef } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { formatINR } from '../lib/format';
import { computeSha256 } from '../lib/hash';
import { dhaalApi } from '../mockApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const Screen6CaReadyBrief: React.FC = () => {
  const { confirmedAmount, resetDemo } = useDhaalStore();
  const printableRef = useRef<HTMLDivElement>(null);

  const [contentHash, setContentHash] = useState<{ fullHash: string; shortHash: string }>({
    fullHash: '',
    shortHash: '8E4A9F21',
  });
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const amount = confirmedAmount || CANONICAL_DEMO_CASE.rows[1].difference;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Compute real SHA-256 content hash on brief payload and call live FastAPI backend
  useEffect(() => {
    const briefPayload = `${CANONICAL_DEMO_CASE.caseId}|${CANONICAL_DEMO_CASE.gstin}|${amount}|${CANONICAL_DEMO_CASE.noticeDate}|${CANONICAL_DEMO_CASE.replyDeadline}`;
    computeSha256(briefPayload).then((res) => {
      setContentHash(res);
    });

    dhaalApi.generateBrief({
      notice_id: CANONICAL_DEMO_CASE.caseId,
      draft_text: `Form GST ASMT-11 draft reply for ${CANONICAL_DEMO_CASE.noticeRef}`,
      evidence_checklist_status: {
        invoices: true,
        bank_payment: true,
        differential_ledger: true,
        supplier_declaration: false,
        eway_bills: true,
        ca_memo: true,
      },
      confirmed_amount: amount,
    }).then((dossier) => {
      console.log('[Dhaal API] Sealed CA Dossier from FastAPI:', dossier);
    });
  }, [amount]);

  // Real PDF Export using html2canvas + jsPDF
  const handleExportPdf = async () => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    showToast('Compiling high-resolution PDF Dossier...');

    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DHAAL_CA_Brief_${CANONICAL_DEMO_CASE.caseId}.pdf`);

      showToast('PDF Dossier downloaded successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Error generating PDF. Using standard print fallback.');
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // WhatsApp share message: Case ID, deadline, note that brief is attached separately
  const shareWhatsAppMessage = `Hello CA Sir, here is our Dhaal Defense Brief for Case ID: ${CANONICAL_DEMO_CASE.caseId} (M/s Sharma Garments). Reply deadline: ${CANONICAL_DEMO_CASE.replyDeadline}. Full verified brief and annexures are attached separately.`;

  const handleDispatchWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareWhatsAppMessage)}`;
    window.open(url, '_blank');
    setIsShareModalOpen(false);
  };

  const handleCopyShareMessage = () => {
    navigator.clipboard.writeText(shareWhatsAppMessage);
    showToast('Case details copied to clipboard!');
    setIsShareModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          nav, header, footer, .print\\:hidden {
            display: none !important;
          }
          #printable-dossier {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      {/* Success Header */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-[#EFF4FF] p-4 rounded-xl border border-[#CBD5E1]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#12805C] text-white flex items-center justify-center shadow-xs">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-headline text-lg font-bold text-[#0B1F3A]">
                Brief Ready. Your CA can take it from here.
              </h2>
              <span className="px-2 py-0.5 rounded bg-[#E6F4EA] text-[#12805C] font-mono text-[10px] font-bold border border-[#A8DAB5]">
                AUDIT READY
              </span>
            </div>
            <span className="text-xs text-[#5B6B82]">
              Case #{CANONICAL_DEMO_CASE.caseId} • Content Hash: {contentHash.shortHash}
            </span>
          </div>
        </div>

        {/* Primary Dossier Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="px-4 py-2 rounded-control bg-[#12805C] hover:bg-[#0E9FA8] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">share</span>
            <span>Send CA Pack</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-4 py-2 rounded-control bg-[#0B1F3A] hover:bg-[#2B4C9B] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">
              {isExportingPdf ? 'hourglass_top' : 'picture_as_pdf'}
            </span>
            <span>{isExportingPdf ? 'Generating PDF...' : 'Download Audit Dossier (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2 rounded-control bg-white hover:bg-[#EFF4FF] text-[#0B1F3A] text-xs font-semibold transition-colors border border-[#CBD5E1] shadow-2xs flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Main Grid: A4 Dossier Preview + Right Action Rail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* A4 DOCUMENT PREVIEW (8 cols on xl) */}
        <div className="xl:col-span-8 flex justify-center">
          <div
            id="printable-dossier"
            ref={printableRef}
            className="relative bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] p-8 sm:p-10 w-full max-w-[794px] min-h-[1050px] flex flex-col justify-between text-[#0F172A] font-sans overflow-hidden"
          >
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center -rotate-45 opacity-5">
              <span className="font-headline text-6xl text-[#0B1F3A] uppercase font-bold tracking-widest text-center">
                SYNTHETIC DEMO<br />CA BRIEF
              </span>
            </div>

            {/* Inner Content Container */}
            <div className="flex flex-col gap-6 relative z-10">
              {/* Official Printable Header */}
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#5B6B82] border-b border-[#CBD5E1] pb-1.5 mb-1 flex justify-between items-center">
                <span className="font-bold text-[#0B1F3A]">DHAAL COMPLIANCE DOSSIER | STRICTLY CONFIDENTIAL</span>
                <span>FORM ASMT-10 RESPONSE FILE • STATUTORY COMPLIANCE</span>
              </div>

              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-[#0B1F3A] gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl text-[#F59E0B]">shield</span>
                  </div>
                  <div>
                    <h1 className="font-headline text-lg font-bold text-[#0B1F3A] tracking-tight">
                      DHAAL LEGAL SHIELD • CA BRIEF
                    </h1>
                    <p className="font-mono text-xs text-[#5B6B82]">
                      Case Reference: #{CANONICAL_DEMO_CASE.caseId}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono text-xs text-[#5B6B82]">
                  <div>Generation: {CANONICAL_DEMO_CASE.fixedClockDate} | 14:38 IST</div>
                  <div className="text-[11px] text-[#2B4C9B] font-bold mt-0.5">
                    Content hash: {contentHash.shortHash}
                  </div>
                </div>
              </div>

              {/* Assessee Metadata Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#EFF4FF] rounded-card border border-[#CBD5E1] text-xs">
                <div>
                  <span className="text-[#5B6B82] block">Assessee Legal Trade Name:</span>
                  <span className="font-bold text-[#0B1F3A] block">{CANONICAL_DEMO_CASE.businessName}</span>
                </div>
                <div>
                  <span className="text-[#5B6B82] block">GSTIN / Registration:</span>
                  <span className="font-mono font-bold text-[#0B1F3A] block">{CANONICAL_DEMO_CASE.gstin}</span>
                </div>
                <div>
                  <span className="text-[#5B6B82] block">Jurisdiction:</span>
                  <span className="font-bold text-[#0B1F3A] block">{CANONICAL_DEMO_CASE.office.ward} (Mumbai)</span>
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    1
                  </span>
                  <h2 className="font-headline text-sm font-bold text-[#0B1F3A]">
                    Executive Summary &amp; Allegation Mapping
                  </h2>
                </div>
                <div className="p-4 bg-[#F6F8FB] rounded-card border border-[#E3E8F0] space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[#2B4C9B]">
                      Scrutiny Ground: Table 4(A)(5) GSTR-3B Discrepancy
                    </span>
                    <span className="font-mono font-bold text-[#0B1F3A] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
                      Amount questioned: {formatINR(amount, true)}
                    </span>
                  </div>
                  <p className="text-[#0F172A] leading-relaxed">
                    Form ASMT-10 scrutiny notice received alleging an apparent excess Input Tax Credit (ITC) claim of{' '}
                    <strong>₹{amount.toLocaleString('en-IN')}</strong> in monthly return GSTR-3B compared with system-generated GSTR-2B for {CANONICAL_DEMO_CASE.taxPeriod}.
                  </p>
                  <div className="p-3 bg-white rounded border border-[#E3E8F0]">
                    <span className="font-mono text-[10px] text-[#B45309] block uppercase font-bold">
                      Probable cause (to be confirmed with supplier):
                    </span>
                    <p className="text-xs text-[#0F172A] mt-0.5">
                      Principal vendor <strong>{CANONICAL_DEMO_CASE.supplier.name} ({CANONICAL_DEMO_CASE.supplier.gstin})</strong> reported supply in subsequent tax period. Assessee maintains verified physical possession of goods, original tax invoices ({CANONICAL_DEMO_CASE.supplier.invoiceNo}), valid E-Way bills, and prompt electronic bank settlement.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Statutory Countdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                    2
                  </span>
                  <h2 className="font-headline text-sm font-bold text-[#0B1F3A]">
                    Statutory Countdown &amp; Safe Filing Windows
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#EFF4FF] rounded-card border border-[#CBD5E1]">
                    <span className="text-[#5B6B82] block text-[11px]">Statutory Deadline</span>
                    <span className="font-mono text-sm font-bold text-[#0B1F3A] block mt-0.5">
                      {CANONICAL_DEMO_CASE.replyDeadline}
                    </span>
                    <span className="text-[10px] text-[#B45309] font-bold">12 Days strictly remaining</span>
                  </div>
                  <div className="p-3 bg-[#FEF3C7]/40 rounded-card border border-[#FDE68A]">
                    <span className="text-[#B45309] block text-[11px] font-semibold">Recommended CA Sign</span>
                    <span className="font-mono text-sm font-bold text-[#0B1F3A] block mt-0.5">
                      {CANONICAL_DEMO_CASE.recommendedCaSign}
                    </span>
                    <span className="text-[10px] text-[#B45309]">5-day contingency buffer</span>
                  </div>
                  <div className="p-3 bg-[#EFF4FF] rounded-card border border-[#CBD5E1]">
                    <span className="text-[#5B6B82] block text-[11px]">Assigned Counsel / CA</span>
                    <span className="font-bold text-[#0B1F3A] block mt-0.5">
                      {CANONICAL_DEMO_CASE.caCounsel.name}
                    </span>
                    <span className="font-mono text-[10px] text-[#5B6B82]">{CANONICAL_DEMO_CASE.caCounsel.membershipNo}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Evidentiary Annexures Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                      3
                    </span>
                    <h2 className="font-headline text-sm font-bold text-[#0B1F3A]">
                      Assembled Evidentiary Annexures
                    </h2>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#E6F4EA] text-[#12805C] font-bold border border-[#A8DAB5]">
                    5 of 6 Sealed
                  </span>
                </div>

                <div className="rounded-card border border-[#E3E8F0] overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#EFF4FF] text-[#0B1F3A] font-bold text-[11px] border-b border-[#CBD5E1]">
                      <tr>
                        <th className="p-2 font-mono">Annexure</th>
                        <th className="p-2">Document Description</th>
                        <th className="p-2 font-mono">Proof Reference</th>
                        <th className="p-2 text-right">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E8F0]">
                      <tr>
                        <td className="p-2 font-mono font-bold text-[#0B1F3A]">ANNEX-A</td>
                        <td className="p-2">Purchase Invoice (Apex Textiles)</td>
                        <td className="p-2 font-mono text-[#5B6B82]">INV #{CANONICAL_DEMO_CASE.supplier.invoiceNo}</td>
                        <td className="p-2 text-right text-[#12805C] font-bold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono font-bold text-[#0B1F3A]">ANNEX-B</td>
                        <td className="p-2">Sample Bank Payment Advice &amp; UTR</td>
                        <td className="p-2 font-mono text-[#5B6B82]">{CANONICAL_DEMO_CASE.banking.utr}</td>
                        <td className="p-2 text-right text-[#12805C] font-bold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono font-bold text-[#0B1F3A]">ANNEX-C</td>
                        <td className="p-2">Consignment Note &amp; E-Way Bill</td>
                        <td className="p-2 font-mono text-[#5B6B82]">{CANONICAL_DEMO_CASE.transport.ewayBillNo}</td>
                        <td className="p-2 text-right text-[#12805C] font-bold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono font-bold text-[#0B1F3A]">ANNEX-D</td>
                        <td className="p-2">Supplier 16(2)(c) Tax Clearance Cert.</td>
                        <td className="p-2 font-mono text-[#5B6B82]">Apex / CA Declaration</td>
                        <td className="p-2 text-right text-[#12805C] font-bold">✓ Verified</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono font-bold text-[#0B1F3A]">ANNEX-E</td>
                        <td className="p-2">Reconciliation Ledger &amp; GSTR-2B Proof</td>
                        <td className="p-2 font-mono text-[#5B6B82]">Dhaal Match Run #109</td>
                        <td className="p-2 text-right text-[#12805C] font-bold">✓ Verified</td>
                      </tr>
                      <tr className="bg-[#FEF3C7]/20">
                        <td className="p-2 font-mono font-bold text-[#B45309]">ANNEX-F</td>
                        <td className="p-2 font-semibold">Practicing CA Verification Certificate</td>
                        <td className="p-2 font-mono text-[#5B6B82]">Requires UDIN Signature</td>
                        <td className="p-2 text-right text-[#B45309] font-bold">CA Pending</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Verified Form ASMT-11 Draft Engine Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-mono text-[10px] font-bold">
                      4
                    </span>
                    <h2 className="font-headline text-sm font-bold text-[#0B1F3A]">
                      Verified Statutory Form ASMT-11 Reply (Extract)
                    </h2>
                  </div>
                  <span className="font-mono text-[10px] text-[#12805C] font-bold">
                    Deterministic checks: 5 of 5 passed
                  </span>
                </div>
                <div className="bg-[#EFF4FF] p-3 rounded-card border border-[#CBD5E1] text-xs font-mono leading-relaxed space-y-1">
                  <div className="flex justify-between border-b border-[#CBD5E1] pb-1 text-[10px] text-[#5B6B82]">
                    <span>Format: Form GST ASMT-11</span>
                    <span>Rule 99(2) CGST Rules</span>
                  </div>
                  <p>
                    &quot;Respected Officer, with reference to scrutiny notice {CANONICAL_DEMO_CASE.noticeRef} pointing out alleged difference in ITC claimed under Table 4(A)(5) amounting to ₹{amount.toLocaleString('en-IN')}, conditions under Section 16(2) stand complied with...&quot;
                  </p>
                </div>
              </div>

              {/* Section 5: Statutory Disclaimer Box */}
              <div className="p-3 bg-[#F6F8FB] rounded-card border border-[#CBD5E1] flex items-start gap-2.5 text-xs">
                <span className="material-symbols-outlined text-[#0B1F3A] text-base shrink-0 mt-0.5">
                  gavel
                </span>
                <p className="text-[11px] text-[#5B6B82] leading-tight">
                  <strong className="text-[#0B1F3A]">Statutory Disclaimer:</strong> This CA Brief is an algorithmic compliance compilation designed strictly as an assistive drafting aid for independent professional review. It does not constitute formal legal opinion or tax filing. The brief must be independently verified, endorsed, and uploaded under valid digital signature / UDIN by a practicing Chartered Accountant before GST portal submission.
                </p>
              </div>

              {/* Signatures Block */}
              <div className="pt-4 border-t border-[#E3E8F0] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#5B6B82] uppercase block">Assessee</span>
                  <span className="font-headline text-sm font-bold text-[#0B1F3A] block mt-0.5">
                    {CANONICAL_DEMO_CASE.proprietorName}
                  </span>
                  <span className="text-[10px] text-[#5B6B82]">Proprietor, Sharma Garments</span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#5B6B82] uppercase block">Attesting CA</span>
                  <div className="w-44 h-7 rounded bg-[#EFF4FF] border border-[#CBD5E1] flex items-center justify-center text-[10px] text-[#5B6B82] mt-0.5">
                    [ Digitally Signed via DSC ]
                  </div>
                  <span className="text-[10px] text-[#5B6B82] block mt-0.5">UDIN: Pending Filing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: High-Converting Action Rail (4 cols on xl) */}
        <div className="xl:col-span-4 flex flex-col gap-6 print:hidden">
          {/* Primary Delivery Card */}
          <div className="bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] p-6 flex flex-col gap-4">
            <div>
              <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] font-mono text-[10px] font-bold uppercase tracking-wider border border-[#FDE68A]">
                STEP 6 OF 6 • READY TO TRANSMIT
              </span>
              <h3 className="font-headline text-base font-bold text-[#0B1F3A] mt-1">
                Hand Off To CA
              </h3>
              <p className="text-xs text-[#5B6B82] mt-0.5 leading-relaxed">
                Deliver the complete digital dossier, raw ledgers, and Form ASMT-11 draft directly to your tax consultant.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-control bg-[#12805C] hover:bg-[#0E9FA8] text-white font-headline text-sm font-bold shadow-md transition-all active:scale-98"
              >
                <span className="material-symbols-outlined text-lg">share</span>
                <span>Send CA Pack via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-control bg-[#0B1F3A] hover:bg-[#2B4C9B] text-white text-xs font-bold transition-all shadow-2xs disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                <span>{isExportingPdf ? 'Generating PDF...' : 'Download Audit Dossier (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => showToast('Word (.docx) template downloaded for CA editing.')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-control bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#0B1F3A] text-xs font-semibold transition-colors border border-[#CBD5E1]"
              >
                <span className="material-symbols-outlined text-base">description</span>
                <span>Download Word (.docx) for CA Edits</span>
              </button>
            </div>

            {/* Secure CA Passcode Handshake */}
            <div className="p-3 bg-[#EFF4FF] rounded-card border border-[#CBD5E1] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B1F3A]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#2B4C9B]">lock</span>
                  <span>Encrypted CA Passcode</span>
                </span>
                <span className="font-mono text-[10px] text-[#12805C] bg-[#E6F4EA] px-1.5 py-0.2 rounded border border-[#A8DAB5]">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded border border-[#CBD5E1]">
                <span className="font-mono text-xs font-bold text-[#0B1F3A] tracking-wider">
                  {CANONICAL_DEMO_CASE.caCounsel.passcode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(CANONICAL_DEMO_CASE.caCounsel.passcode);
                    showToast('CA Access Passkey copied!');
                  }}
                  className="text-xs font-semibold text-[#2B4C9B] hover:underline"
                >
                  Copy Passkey
                </button>
              </div>
              <p className="font-mono text-[10px] text-[#5B6B82]">
                Your CA accesses raw GSTIN ledgers and editable tables with end-to-end audit logging.
              </p>
            </div>
          </div>

          {/* Pre-Filing Checklist Card */}
          <div className="bg-white rounded-modal shadow-tier1 border border-[#E3E8F0] p-5 space-y-3">
            <h4 className="font-headline text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2B4C9B]">checklist_rtl</span>
              <span>Pre-Filing Checklist</span>
            </h4>
            <div className="space-y-2 text-xs text-[#0F172A]">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-[#0B1F3A] focus:ring-[#2B4C9B]" />
                <span>Invoice &amp; E-Way bill values re-computed to 2 decimal places</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-[#0B1F3A] focus:ring-[#2B4C9B]" />
                <span>Supplier filed GSTR-1 in subsequent month verified on GST portal</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-[#0B1F3A] focus:ring-[#2B4C9B]" />
                <span>Bank payment confirmed against Tax Invoice date (Sec 16(2)(b))</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      showToast('Status updated: Brief signed and ready for GST Portal submission!');
                    }
                  }}
                  className="mt-0.5 rounded text-[#0B1F3A] focus:ring-[#2B4C9B]"
                />
                <span className="font-semibold text-[#0B1F3A]">Chartered Accountant review &amp; UDIN generated</span>
              </label>
            </div>
          </div>

          {/* Start New Notice / Reset Demo */}
          <div className="bg-white rounded-modal shadow-tier1 border border-[#E3E8F0] p-5 space-y-3">
            <h4 className="font-headline text-sm font-bold text-[#0B1F3A]">
              Other Scrutiny Notices?
            </h4>
            <p className="text-xs text-[#5B6B82]">
              Have an ASMT-10 for another tax period or assessment year?
            </p>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Start a new notice investigation? Current brief #DH-2025-ASMT10-8912 is safely archived.')) {
                  resetDemo();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-control bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#0B1F3A] text-xs font-semibold transition-colors border border-[#CBD5E1]"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              <span>Start New Notice Investigation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Modal Overlay */}
      {isShareModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] max-w-lg w-full p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#E6F4EA] text-[#12805C] flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">send</span>
                </div>
                <div>
                  <h3 className="font-headline text-base font-bold text-[#0B1F3A]">
                    Share Legal Pack with CA
                  </h3>
                  <p className="text-xs text-[#5B6B82]">
                    Delivery via WhatsApp or direct message
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-[#5B6B82] hover:text-[#0B1F3A]"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-[#5B6B82] block mb-1">
                  Prepared Message Payload
                </label>
                <textarea
                  readOnly
                  rows={4}
                  value={shareWhatsAppMessage}
                  className="w-full p-2.5 rounded-lg bg-[#EFF4FF] font-mono text-xs text-[#0B1F3A] border border-[#CBD5E1] resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E3E8F0]">
              <button
                type="button"
                onClick={handleCopyShareMessage}
                className="px-3.5 py-2 rounded-control border border-[#CBD5E1] text-xs font-semibold text-[#0B1F3A] hover:bg-[#EFF4FF]"
              >
                Copy Message
              </button>
              <button
                type="button"
                onClick={handleDispatchWhatsApp}
                className="px-4 py-2 rounded-control bg-[#12805C] hover:bg-[#0E9FA8] text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">send</span>
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="bg-[#0B1F3A] text-white px-4 py-3 rounded-card shadow-tier3 flex items-center gap-2.5 border border-[#2B4C9B]">
            <span className="material-symbols-outlined text-[#F59E0B] text-lg">check_circle</span>
            <span className="text-xs font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
