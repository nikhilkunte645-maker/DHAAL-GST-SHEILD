import React, { useState } from 'react';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';

interface NoticeScanViewerProps {
  onHighlightClick?: (fieldId: string) => void;
  className?: string;
  isModal?: boolean;
}

export const NoticeScanViewer: React.FC<NoticeScanViewerProps> = ({ className = '', isModal: _isModal = false }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 145));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 75));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className={`bg-white rounded-xl shadow-tier1 border border-[#E3E8F0] overflow-hidden flex flex-col ${className}`}>
      {/* Viewer Action Bar */}
      <div className="p-3 bg-[#EFF4FF] border-b border-[#CBD5E1] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#2B4C9B] text-lg">document_scanner</span>
          <span className="font-mono text-xs font-bold text-[#0B1F3A]">
            FORM_GST_ASMT-10.pdf
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#DCE9FF] text-[#2B4C9B] font-semibold">
            Page 1 of 3
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#CBD5E1] shadow-2xs">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-[#EFF4FF] text-[#5B6B82] transition-colors"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <span className="material-symbols-outlined text-base">zoom_out</span>
          </button>
          <span className="font-mono text-[11px] text-[#0F172A] px-1 font-semibold min-w-[40px] text-center">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-[#EFF4FF] text-[#5B6B82] transition-colors"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <span className="material-symbols-outlined text-base">zoom_in</span>
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1 rounded hover:bg-[#EFF4FF] text-[#5B6B82] transition-colors border-l border-[#E3E8F0] ml-0.5"
            title="Fit to width"
            aria-label="Reset zoom"
          >
            <span className="material-symbols-outlined text-base">fit_screen</span>
          </button>
        </div>
      </div>

      {/* Scanned Sheet Canvas with Bounding Boxes */}
      <div className="relative bg-[#EFF4FF]/60 p-4 overflow-auto select-none flex justify-center min-h-[460px]">
        {/* Synthetic Watermark Background Graphic */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center -rotate-12 opacity-5">
          <span className="font-headline text-5xl text-[#0B1F3A] uppercase font-bold tracking-widest text-center">
            SYNTHETIC DEMO RECORD<br />FORM ASMT-10
          </span>
        </div>

        {/* Scaled Document Paper Surface */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="relative bg-white rounded-lg p-6 shadow-md border border-[#E3E8F0] w-full max-w-xl text-[11px] leading-[18px] text-[#0F172A] font-serif transition-transform duration-150"
        >
          {/* Government Form Header */}
          <div className="text-center pb-3 mb-3 border-b border-[#E3E8F0]">
            <p className="font-bold tracking-widest uppercase text-xs text-[#0B1F3A]">
              Government of Maharashtra
            </p>
            <p className="font-semibold text-[11px] text-[#0F172A]">
              Office of the Assistant Commissioner of State Tax
            </p>
            <p className="text-[#5B6B82] text-[10px]">
              Nodal Division-IV, Bandra-Kurla Complex, Mumbai - 400051
            </p>
            <p className="font-bold underline mt-2 text-xs text-[#0B1F3A] tracking-wide">
              FORM GST ASMT-10
            </p>
            <p className="italic text-[10px] text-[#5B6B82]">[See Rule 99(1)]</p>
          </div>

          {/* Notice Metadata Table */}
          <div className="grid grid-cols-2 gap-2 mb-3 bg-[#F6F8FB] p-2.5 rounded border border-[#E3E8F0]">
            <div>
              <span className="text-[#5B6B82]">Reference No: </span>
              <span className="font-mono text-xs font-bold text-[#0B1F3A]">
                {CANONICAL_DEMO_CASE.noticeRef}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#5B6B82]">Date: </span>
              <span className="font-mono text-xs font-semibold text-[#0F172A]">
                {CANONICAL_DEMO_CASE.noticeDate}
              </span>
            </div>
            <div>
              <span className="text-[#5B6B82]">GSTIN: </span>
              <span className="font-mono text-xs font-bold text-[#0F172A]">
                {CANONICAL_DEMO_CASE.gstin}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[#5B6B82]">Tax Period: </span>
              <span className="font-mono text-xs font-semibold text-[#0F172A]">
                {CANONICAL_DEMO_CASE.taxPeriodShort}
              </span>
            </div>
            <div className="col-span-2 pt-1 border-t border-[#E3E8F0]">
              <span className="text-[#5B6B82]">Legal Name: </span>
              <span className="font-sans text-xs font-bold text-[#0B1F3A]">
                {CANONICAL_DEMO_CASE.businessName}
              </span>
            </div>
          </div>

          {/* Subject & Proviso with Bounding Box #1 */}
          <div className="relative my-3 p-2 rounded-lg bg-[#EFF4FF] border border-[#2B4C9B]/30">
            <div className="absolute -top-2.5 left-2 bg-[#2B4C9B] text-white px-1.5 py-0.2 rounded font-mono text-[9px] font-bold uppercase tracking-wider shadow-2xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">gavel</span>
              Sec 61 / Rule 99 Detected (98.7%)
            </div>
            <p className="font-semibold text-[#0B1F3A] pt-1">
              Subject: Notice for intimating discrepancies in the return after scrutiny under{' '}
              <span className="bg-[#DCE9FF] text-[#2B4C9B] px-1 rounded font-bold font-mono">
                Section 61
              </span>{' '}
              of CGST/MGST Act, 2017 read with{' '}
              <span className="bg-[#DCE9FF] text-[#2B4C9B] px-1 rounded font-bold font-mono">
                Rule 99
              </span>.
            </p>
          </div>

          {/* Paragraph */}
          <p className="mb-2 text-justify text-[10px] leading-relaxed text-[#0F172A]">
            A preliminary scrutiny of the returns furnished by you for the tax period specified above has been conducted as per statutory provisions. During the scrutiny of Form GSTR-3B filed against system-generated Form GSTR-2B, the following discrepancies have come to notice:
          </p>

          {/* Demand Table with Bounding Box #2 (Smudged Cell) */}
          <div className="my-2.5 overflow-x-auto rounded border border-[#E3E8F0]">
            <table className="w-full text-left text-[10px] bg-white">
              <thead className="bg-[#EFF4FF] text-[#0B1F3A] font-bold border-b border-[#CBD5E1]">
                <tr>
                  <th className="p-1.5 font-mono">Sr. No.</th>
                  <th className="p-1.5">Discrepancy Category</th>
                  <th className="p-1.5 text-right font-mono">As Per GSTR-3B</th>
                  <th className="p-1.5 text-right font-mono">As Per GSTR-2B</th>
                  <th className="p-1.5 text-right font-mono">Tax Difference (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0]">
                <tr>
                  <td className="p-1.5 font-mono">01</td>
                  <td className="p-1.5">Inward supplies liable to Reverse Charge (RCM)</td>
                  <td className="p-1.5 text-right font-mono">₹45,000</td>
                  <td className="p-1.5 text-right font-mono">₹45,000</td>
                  <td className="p-1.5 text-right font-mono text-[#5B6B82]">₹0</td>
                </tr>

                {/* Critical Row 2 with Smudge */}
                <tr className="bg-[#FEF3C7]/40 font-semibold">
                  <td className="p-1.5 font-mono text-[#B45309]">02</td>
                  <td className="p-1.5 text-[#0F172A]">Excess Input Tax Credit Claimed (Sec 16(2))</td>
                  <td className="p-1.5 text-right font-mono">₹14,92,450</td>
                  <td className="p-1.5 text-right font-mono">₹13,08,200</td>
                  <td className="p-1.5 text-right font-mono relative">
                    <div className="inline-block bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] px-1 py-0.5 rounded shadow-2xs font-mono font-bold text-[11px]">
                      ₹1,8
                      <span className="relative inline-block text-[#B45309]">
                        <span className="blur-[0.5px]">4</span>
                        <span className="absolute -top-1.5 right-0 text-[8px] text-[#C0392B] font-bold">*</span>
                      </span>
                      ,250
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Smudge Detection Notice */}
          <div className="flex items-center justify-end gap-1.5 text-[#B45309] font-mono text-[10px] mt-1">
            <span className="material-symbols-outlined text-xs">warning</span>
            <span className="font-semibold">
              Physical Smudge Detected on Character 4 at (X:412, Y:618)
            </span>
          </div>

          {/* Reply Window Proviso with Bounding Box #3 */}
          <div className="relative my-3 p-2 rounded-lg bg-[#EFF4FF] border border-[#0E9FA8]/40">
            <div className="absolute -top-2.5 left-2 bg-[#0B1F3A] text-white px-1.5 py-0.2 rounded font-mono text-[9px] font-bold uppercase tracking-wider shadow-2xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]">schedule</span>
              Reply Window Validated (30 Days)
            </div>
            <p className="pt-1 text-[#0F172A] text-[10px] leading-relaxed">
              You are hereby directed to submit your explanation for the said discrepancy in{' '}
              <span className="font-bold text-[#0B1F3A] underline">Form GST ASMT-11</span> within{' '}
              <span className="bg-[#DCE9FF] text-[#0B1F3A] px-1 rounded font-bold font-mono">
                thirty (30) days
              </span>{' '}
              of receipt of this notice, failing which the officer may proceed with further action under the Act.
            </p>
          </div>

          {/* Officer Signature Block */}
          <div className="mt-4 pt-2 border-t border-[#E3E8F0] flex justify-between items-end text-[10px]">
            <div className="flex flex-col text-[#5B6B82] font-mono text-[9px]">
              <span>Digital Verification ID: ASMT10-0941-BLR</span>
              <span>Generated via GSTN Scrutiny Portal</span>
            </div>
            <div className="text-right">
              <div className="h-5 w-24 bg-[#EFF4FF] rounded mx-auto mb-1 flex items-center justify-center opacity-70 italic text-[8px] text-[#5B6B82]">
                [Digitally Signed]
              </div>
              <p className="font-bold text-[#0B1F3A]">{CANONICAL_DEMO_CASE.office.officer}</p>
              <p className="text-[#5B6B82]">{CANONICAL_DEMO_CASE.office.ward}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="p-2.5 bg-white border-t border-[#E3E8F0] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#5B6B82]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2.5 h-2.5 rounded bg-[#F59E0B] ring-1 ring-[#B45309]"></span>
            Needs Human Check
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2.5 h-2.5 rounded bg-[#2B4C9B] ring-1 ring-[#0B1F3A]"></span>
            Statutory Ground
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="w-2.5 h-2.5 rounded bg-[#0E9FA8] ring-1 ring-[#0E9FA8]"></span>
            Timelines Validated
          </span>
        </div>
        <span className="text-[10px] text-[#75777E]">High-Resolution Vector Scan (300 DPI)</span>
      </div>
    </div>
  );
};
