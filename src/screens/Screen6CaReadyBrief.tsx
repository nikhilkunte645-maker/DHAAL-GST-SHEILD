import React, { useState, useEffect, useRef } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { formatINR } from '../lib/format';
import { computeSha256 } from '../lib/hash';
import { dhaalApi } from '../mockApi';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

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
    computeSha256(briefPayload)
      .then((res) => {
        setContentHash(res);
      })
      .catch((err) => {
        console.warn('[Dhaal] Hash calculation error:', err);
      });

    dhaalApi
      .generateBrief({
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
      })
      .then((dossier) => {
        console.log('[Dhaal API] Sealed CA Dossier from FastAPI:', dossier);
      })
      .catch((err) => {
        console.warn('[Dhaal API] Brief generation catch:', err);
      });
  }, [amount]);

  // High-precision A4 multi-page PDF Export with smart pagination & zero right-edge clipping
  const handleExportPdf = async () => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    showToast('Compiling high-resolution A4 PDF Dossier...');

    let clone: HTMLElement | null = null;

    try {
      // 1. Wait for web fonts (including Noto Sans Devanagari) to finish loading
      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font loading error
        }
      }

      const element = printableRef.current;

      // 2. Clone the element to render at standard A4 desktop width (794px = 210mm @ 96 DPI)
      // This ensures mobile/tablet viewports produce the identical clean A4 desktop layout
      // with zero cramped columns or right-edge clipping.
      clone = element.cloneNode(true) as HTMLElement;
      clone.id = 'printable-dossier-a4-export';
      clone.style.width = '794px';
      clone.style.maxWidth = '794px';
      clone.style.minWidth = '794px';
      clone.style.position = 'fixed';
      clone.style.left = '-9999px';
      clone.style.top = '0';
      clone.style.zIndex = '-9999';
      clone.style.backgroundColor = '#FFFFFF';
      clone.style.boxShadow = 'none';
      clone.style.transform = 'none';
      document.body.appendChild(clone);

      // 3. Render clone to high-resolution canvas with 2x retina scale
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        windowWidth: 1200,
      });

      // 4. Standard A4 Dimensions in millimeters
      const a4WidthMm = 210;
      const a4HeightMm = 297;
      const marginMm = 12; // Consistent 12mm page margin
      const usableWidthMm = a4WidthMm - marginMm * 2; // 186mm
      const usableHeightMm = a4HeightMm - marginMm * 2; // 273mm

      // Canvas pixels per millimeter
      const pxPerMm = canvas.width / usableWidthMm;
      const maxPageHeightPx = Math.floor(usableHeightMm * pxPerMm);

      // 5. Detect semantic section boundaries from child cards
      const sectionBreaksPx: number[] = [];
      const container = clone.querySelector('.flex.flex-col.gap-6') || clone;
      const containerTop = container.getBoundingClientRect().top;

      for (const child of Array.from(container.children)) {
        const rect = child.getBoundingClientRect();
        const bottomRel = rect.bottom - containerTop;
        sectionBreaksPx.push(Math.round(bottomRel * 2));
      }

      // 6. Calculate page slices
      const slices: { startY: number; heightPx: number }[] = [];
      let currentY = 0;
      const totalHeightPx = canvas.height;

      while (currentY < totalHeightPx) {
        const remainingPx = totalHeightPx - currentY;
        if (remainingPx <= maxPageHeightPx) {
          slices.push({ startY: currentY, heightPx: remainingPx });
          break;
        }

        const maxNextY = currentY + maxPageHeightPx;
        let bestBreak = maxNextY;
        let foundSmartBreak = false;

        for (let i = sectionBreaksPx.length - 1; i >= 0; i--) {
          const b = sectionBreaksPx[i];
          if (b > currentY + maxPageHeightPx * 0.65 && b <= maxNextY) {
            bestBreak = b;
            foundSmartBreak = true;
            break;
          }
        }

        const sliceH = foundSmartBreak ? bestBreak - currentY : maxPageHeightPx;
        slices.push({ startY: currentY, heightPx: sliceH });
        currentY += sliceH;
      }

      // 7. Initialize jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const totalPages = slices.length;

      // 8. Draw each page slice into PDF
      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        if (pageIdx > 0) {
          pdf.addPage('a4', 'portrait');
        }

        const { startY, heightPx } = slices[pageIdx];

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = heightPx;

        const pageCtx = pageCanvas.getContext('2d');
        if (pageCtx) {
          pageCtx.fillStyle = '#FFFFFF';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0,
            startY,
            canvas.width,
            heightPx,
            0,
            0,
            pageCanvas.width,
            heightPx
          );

          const pageImgData = pageCanvas.toDataURL('image/png');
          const sliceHeightMm = (heightPx * usableWidthMm) / canvas.width;

          pdf.addImage(
            pageImgData,
            'PNG',
            marginMm,
            marginMm,
            usableWidthMm,
            sliceHeightMm,
            undefined,
            'FAST'
          );
        }

        // Add formal running footer
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(91, 107, 130);
        const footerText = `Page ${pageIdx + 1} of ${totalPages} • Case Reference: #${CANONICAL_DEMO_CASE.caseId} • Dhaal GST Notice Shield (Form ASMT-10)`;
        pdf.text(footerText, a4WidthMm / 2, a4HeightMm - 5, { align: 'center' });
      }

      pdf.save(`DHAAL_CA_Brief_${CANONICAL_DEMO_CASE.caseId}.pdf`);
      showToast('PDF Dossier downloaded successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('Error generating PDF. Using standard print fallback.');
      window.print();
    } finally {
      if (clone && clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
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
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        @media print {
          body {
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          nav, header, footer, aside, .print\\:hidden, #shareModal, #toastNotification {
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
          .dossier-section, tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* Success Header */}
      <Card variant="default" padding="md" className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#12805C] text-white flex items-center justify-center shadow-xs shrink-0">
            <span className="material-symbols-outlined text-2xl">task_alt</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-headline text-lg sm:text-xl font-bold text-[#0B1F3A]">
                Brief Ready. Your CA can take it from here.
              </h1>
              <Badge variant="success" size="sm">
                AUDIT READY
              </Badge>
            </div>
            <span className="text-xs text-[#5B6B82] mt-0.5">
              Case #{CANONICAL_DEMO_CASE.caseId} • Content Hash: <span className="font-mono font-semibold">{contentHash.shortHash}</span>
            </span>
          </div>
        </div>

        {/* Primary Dossier Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon="share"
            onClick={() => setIsShareModalOpen(true)}
            className="bg-[#12805C] hover:bg-[#0E9FA8] text-white"
          >
            Send CA Pack
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={isExportingPdf ? 'hourglass_top' : 'picture_as_pdf'}
            onClick={handleExportPdf}
            disabled={isExportingPdf}
          >
            {isExportingPdf ? 'Generating PDF...' : 'Download Audit Dossier (PDF)'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="print"
            onClick={handlePrint}
          >
            Print
          </Button>
        </div>
      </Card>

      {/* Main Grid: A4 Dossier Preview + Right Action Rail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* A4 DOCUMENT PREVIEW (8 cols on xl) */}
        <div className="xl:col-span-8 flex justify-center">
          <div
            id="printable-dossier"
            ref={printableRef}
            className="relative bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] p-6 sm:p-10 w-full max-w-[794px] min-h-[1050px] flex flex-col justify-between text-[#0F172A] font-sans overflow-hidden"
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
              <div className="font-mono text-[10px] uppercase tracking-widest text-[#5B6B82] border-b border-[#CBD5E1] pb-1.5 mb-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
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
                    <h2 className="font-headline text-lg font-bold text-[#0B1F3A] tracking-tight">
                      DHAAL LEGAL SHIELD • CA BRIEF
                    </h2>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#F8FAFC] rounded-control border border-[#E2E8F0] text-xs">
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
                  <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">
                    Executive Summary &amp; Allegation Mapping
                  </h3>
                </div>
                <div className="p-4 bg-[#F8FAFC] rounded-control border border-[#E2E8F0] space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="font-mono font-bold text-[#2B4C9B]">
                      Scrutiny Ground: Table 4(A)(5) GSTR-3B Discrepancy
                    </span>
                    <span className="font-mono font-bold text-[#0B1F3A] bg-white px-2 py-0.5 rounded border border-[#CBD5E1] shrink-0">
                      Amount questioned: {formatINR(amount, true)}
                    </span>
                  </div>
                  <p className="text-[#0F172A] leading-relaxed">
                    Form ASMT-10 scrutiny notice received alleging an apparent excess Input Tax Credit (ITC) claim of{' '}
                    <strong>₹{amount.toLocaleString('en-IN')}</strong> in monthly return GSTR-3B compared with system-generated GSTR-2B for {CANONICAL_DEMO_CASE.taxPeriod}.
                  </p>
                  <div className="p-3 bg-white rounded-control border border-[#E2E8F0]">
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
                  <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">
                    Statutory Countdown &amp; Safe Filing Windows
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#F8FAFC] rounded-control border border-[#E2E8F0]">
                    <span className="text-[#5B6B82] block text-[11px]">Statutory Deadline</span>
                    <span className="font-mono text-sm font-bold text-[#0B1F3A] block mt-0.5">
                      {CANONICAL_DEMO_CASE.replyDeadline}
                    </span>
                    <span className="text-[10px] text-[#B45309] font-bold">12 Days strictly remaining</span>
                  </div>
                  <div className="p-3 bg-[#FFFBEB] rounded-control border border-[#FDE68A]">
                    <span className="text-[#B45309] block text-[11px] font-semibold">Recommended CA Sign</span>
                    <span className="font-mono text-sm font-bold text-[#0B1F3A] block mt-0.5">
                      {CANONICAL_DEMO_CASE.recommendedCaSign}
                    </span>
                    <span className="text-[10px] text-[#B45309]">5-day contingency buffer</span>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] rounded-control border border-[#E2E8F0]">
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
                    <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">
                      Assembled Evidentiary Annexures
                    </h3>
                  </div>
                  <Badge variant="success" size="sm">
                    5 of 6 Sealed
                  </Badge>
                </div>

                <div className="rounded-control border border-[#E2E8F0] overflow-x-auto text-xs">
                  <table className="w-full text-left min-w-[500px] sm:min-w-0">
                    <thead className="bg-[#F8FAFC] text-[#0B1F3A] font-bold text-[11px] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-2 font-mono">Annexure</th>
                        <th className="p-2">Document Description</th>
                        <th className="p-2 font-mono">Proof Reference</th>
                        <th className="p-2 text-right">Audit Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
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
                      <tr className="bg-[#FFFBEB]/40">
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
                    <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">
                      Verified Statutory Form ASMT-11 Reply (Extract)
                    </h3>
                  </div>
                  <Badge variant="success" size="sm">
                    5 of 5 checks passed
                  </Badge>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-control border border-[#E2E8F0] text-xs font-mono leading-relaxed space-y-1">
                  <div className="flex justify-between border-b border-[#E2E8F0] pb-1 text-[10px] text-[#5B6B82]">
                    <span>Format: Form GST ASMT-11</span>
                    <span>Rule 99(2) CGST Rules</span>
                  </div>
                  <p>
                    &quot;Respected Officer, with reference to scrutiny notice {CANONICAL_DEMO_CASE.noticeRef} pointing out alleged difference in ITC claimed under Table 4(A)(5) amounting to ₹{amount.toLocaleString('en-IN')}, conditions under Section 16(2) stand complied with...&quot;
                  </p>
                </div>
              </div>

              {/* Section 5: Statutory Disclaimer Box */}
              <div className="p-3 bg-[#F8FAFC] rounded-control border border-[#CBD5E1] flex items-start gap-2.5 text-xs">
                <span className="material-symbols-outlined text-[#0B1F3A] text-base shrink-0 mt-0.5">
                  gavel
                </span>
                <p className="text-[11px] text-[#5B6B82] leading-tight">
                  <strong className="text-[#0B1F3A]">Statutory Disclaimer:</strong> This CA Brief is an algorithmic compliance compilation designed strictly as an assistive drafting aid for independent professional review. It does not constitute formal legal opinion or tax filing. The brief must be independently verified, endorsed, and uploaded under valid digital signature / UDIN by a practicing Chartered Accountant before GST portal submission.
                </p>
              </div>

              {/* Signatures Block */}
              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-[#5B6B82] uppercase block">Assessee</span>
                  <span className="font-headline text-sm font-bold text-[#0B1F3A] block mt-0.5">
                    {CANONICAL_DEMO_CASE.proprietorName}
                  </span>
                  <span className="text-[10px] text-[#5B6B82]">Proprietor, Sharma Garments</span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-[#5B6B82] uppercase block">Attesting CA</span>
                  <div className="w-44 h-7 rounded-control bg-[#F8FAFC] border border-[#CBD5E1] flex items-center justify-center text-[10px] text-[#5B6B82] mt-0.5">
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
          <Card variant="default" padding="lg" className="flex flex-col gap-4">
            <div>
              <Badge variant="warning" size="sm">
                STEP 6 OF 6 • READY TO TRANSMIT
              </Badge>
              <h3 className="font-headline text-base font-bold text-[#0B1F3A] mt-2">
                Hand Off To CA
              </h3>
              <p className="text-xs text-[#5B6B82] mt-0.5 leading-relaxed">
                Deliver the complete digital dossier, raw ledgers, and Form ASMT-11 draft directly to your tax consultant.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <Button
                type="button"
                variant="primary"
                icon="share"
                onClick={() => setIsShareModalOpen(true)}
                className="w-full bg-[#12805C] hover:bg-[#0E9FA8] text-white"
              >
                Send CA Pack via WhatsApp
              </Button>

              <Button
                type="button"
                variant="primary"
                icon="picture_as_pdf"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="w-full"
              >
                {isExportingPdf ? 'Generating PDF...' : 'Download Audit Dossier (PDF)'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                icon="description"
                onClick={() => showToast('Word (.docx) template downloaded for CA editing.')}
                className="w-full"
              >
                Download Word (.docx) for CA Edits
              </Button>
            </div>

            {/* Secure CA Passcode Handshake */}
            <div className="p-3 bg-[#F8FAFC] rounded-control border border-[#E2E8F0] space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0B1F3A]">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#2B4C9B]">lock</span>
                  <span>Encrypted CA Passcode</span>
                </span>
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              </div>
              <div className="flex items-center justify-between bg-white p-2 rounded-control border border-[#CBD5E1]">
                <span className="font-mono text-xs font-bold text-[#0B1F3A] tracking-wider">
                  {CANONICAL_DEMO_CASE.caCounsel.passcode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(CANONICAL_DEMO_CASE.caCounsel.passcode);
                    showToast('CA Access Passkey copied!');
                  }}
                  className="text-xs font-semibold text-[#2B4C9B] hover:underline min-h-[44px] px-2 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B] rounded-control"
                >
                  Copy Passkey
                </button>
              </div>
              <p className="text-[10px] text-[#5B6B82]">
                Your CA accesses raw GSTIN ledgers and editable tables with end-to-end audit logging.
              </p>
            </div>
          </Card>

          {/* Pre-Filing Checklist Card */}
          <Card variant="default" padding="md" className="space-y-3">
            <h4 className="font-headline text-sm font-bold text-[#0B1F3A] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2B4C9B]">checklist_rtl</span>
              <span>Pre-Filing Checklist</span>
            </h4>
            <div className="space-y-1 text-xs text-[#0F172A]">
              <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px] py-1 select-none">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#2B4C9B] shrink-0" />
                <span>Invoice &amp; E-Way bill values re-computed to 2 decimal places</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px] py-1 select-none">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#2B4C9B] shrink-0" />
                <span>Supplier filed GSTR-1 in subsequent month verified on GST portal</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px] py-1 select-none">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#2B4C9B] shrink-0" />
                <span>Bank payment confirmed against Tax Invoice date (Sec 16(2)(b))</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer min-h-[44px] py-1 select-none">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      showToast('Status updated: Brief signed and ready for GST Portal submission!');
                    }
                  }}
                  className="w-4 h-4 rounded text-[#0B1F3A] focus:ring-[#2B4C9B] shrink-0"
                />
                <span className="font-semibold text-[#0B1F3A]">Chartered Accountant review &amp; UDIN generated</span>
              </label>
            </div>
          </Card>

          {/* Start New Notice / Reset Demo */}
          <Card variant="default" padding="md" className="space-y-3">
            <h4 className="font-headline text-sm font-bold text-[#0B1F3A]">
              Other Scrutiny Notices?
            </h4>
            <p className="text-xs text-[#5B6B82]">
              Have an ASMT-10 for another tax period or assessment year?
            </p>
            <Button
              type="button"
              variant="secondary"
              icon="restart_alt"
              onClick={() => {
                if (window.confirm('Start a new notice investigation? Current brief #DH-2025-ASMT10-8912 is safely archived.')) {
                  resetDemo();
                }
              }}
              className="w-full"
            >
              Start New Notice Investigation
            </Button>
          </Card>
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
                className="text-[#5B6B82] hover:text-[#0B1F3A] hover:bg-[#F1F5F9] p-1.5 rounded-control transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B]"
                aria-label="Close"
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
                  className="w-full p-2.5 rounded-control bg-[#F8FAFC] font-mono text-xs text-[#0F172A] border border-[#CBD5E1] resize-none focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCopyShareMessage}
              >
                Copy Message
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon="send"
                onClick={handleDispatchWhatsApp}
                className="bg-[#12805C] hover:bg-[#0E9FA8] text-white"
              >
                Open in WhatsApp
              </Button>
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
