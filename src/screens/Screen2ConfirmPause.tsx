import React, { useState } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { validateConfirmedAmount } from '../lib/amount';
import { formatINR } from '../lib/format';
import { NoticeScanViewer } from '../components/NoticeScanViewer';

export const Screen2ConfirmPause: React.FC = () => {
  const { confirmedAmount, pauseResolved, confirmAmount, setStep } = useDhaalStore();

  const [inputVal, setInputVal] = useState<string>(
    confirmedAmount ? String(confirmedAmount) : '184250'
  );
  const [showMathPreview, setShowMathPreview] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isConfirmedSuccess, setIsConfirmedSuccess] = useState<boolean>(pauseResolved);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    setValidationError(null);
    setIsConfirmedSuccess(false);
  };

  const handleFillReadA = () => {
    setInputVal('184250');
    setValidationError(null);
    setShowMathPreview(true);
  };

  const handleFillReadB = () => {
    setInputVal('181250');
    setValidationError(null);
  };

  const handleConfirm = () => {
    const result = validateConfirmedAmount(inputVal);
    if (!result.isValid) {
      setValidationError(result.errorMessage || 'Invalid amount');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      confirmAmount(result.parsedAmount!);
      setIsSubmitting(false);
      setIsConfirmedSuccess(true);
      // Auto advance to step 3 after a brief moment
      setTimeout(() => {
        setStep(3);
      }, 700);
    }, 400);
  };

  const currentFormattedDisplay = () => {
    const num = parseFloat(inputVal.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      return formatINR(num, true);
    }
    return '₹0.00';
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Header Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#EFF4FF] p-3 rounded-xl border border-[#CBD5E1]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-[#0B1F3A] bg-white px-2.5 py-1 rounded-full border border-[#E3E8F0] shadow-2xs">
            STAGE 02 OF 06
          </span>
          <span className="text-xs font-semibold text-[#0B1F3A]">
            Extraction Verification & Human-in-the-Loop Checkpoint
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white text-[#2B4C9B] border border-[#CBD5E1]">
            Strict Safe Mode Active
          </span>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-bold">
            Synthetic Demo Data
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Columns on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANE: Scanned Notice Viewer */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2B4C9B] text-lg">description</span>
              <h3 className="font-headline text-base font-bold text-[#0B1F3A]">
                Scanned Statutory Notice ASMT-10
              </h3>
            </div>
            <span className="text-xs text-[#5B6B82] font-mono">
              Ward 102 • Mumbai Div-IV
            </span>
          </div>

          <NoticeScanViewer />
        </div>

        {/* RIGHT PANE: Extracted Fields & THE PROMINENT AMBER PAUSE STATE */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* THE AMBER PAUSE CARD */}
          <div className="bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] p-6 relative overflow-hidden">
            {/* Top Accent Strip */}
            <div
              className={`absolute top-0 left-0 right-0 h-1.5 transition-colors ${
                isConfirmedSuccess ? 'bg-[#12805C]' : 'bg-[#F59E0B]'
              }`}
            ></div>

            {/* Amber Alert Banner */}
            <div
              role="alert"
              className={`flex items-start gap-3 p-4 rounded-card mb-5 border-l-4 transition-all ${
                isConfirmedSuccess
                  ? 'bg-[#E6F4EA] border-[#12805C] text-[#12805C]'
                  : 'bg-[#FEF3C7] border-[#B45309] text-[#B45309]'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                  isConfirmedSuccess
                    ? 'bg-[#12805C] text-white'
                    : 'bg-[#B45309] text-white'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isConfirmedSuccess ? 'check' : 'pause_circle'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-base font-bold text-[#0F172A]">
                  {isConfirmedSuccess
                    ? 'Extraction Confirmed by You'
                    : 'Pipeline Paused: Extraction Paused: Ambiguity Detected'}
                </span>
                <p className="text-xs text-[#0F172A] mt-0.5 leading-relaxed">
                  {isConfirmedSuccess
                    ? `Discrepancy amount confirmed as ₹1,84,250.00. The mathematical pipeline is unlocked.`
                    : 'We are not 100% sure about the exact questioned tax discrepancy amount due to an ink smudge. Because legal notice replies demand exact figures, please confirm the authentic figure before proceeding.'}
                </p>
              </div>
            </div>

            {/* High-Magnification Zoom Crop Comparison Module */}
            <div className="bg-[#EFF4FF] rounded-card p-4 mb-4 border border-[#CBD5E1]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase tracking-wider text-[#5B6B82] font-bold">
                  Document Micro-Scan Area [Row 2: Discrepancy Amount]
                </span>
                <span className="px-2 py-0.5 rounded bg-white text-[#0B1F3A] font-mono text-[10px] font-bold border border-[#CBD5E1]">
                  4.8x Magnification
                </span>
              </div>

              {/* Zoomed Crop Display */}
              <div className="relative bg-white rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs border border-[#E3E8F0]">
                <div className="flex items-center gap-3">
                  <div className="w-36 h-14 bg-[#EFF4FF] rounded flex items-center justify-center relative overflow-hidden font-mono text-lg font-bold tracking-wider text-[#0B1F3A] border border-[#CBD5E1]">
                    <span className="relative">
                      ₹1,8
                      <span className="relative inline-block text-[#B45309]">
                        4
                        <span className="absolute inset-0 bg-[#F59E0B]/30 blur-[2px]"></span>
                      </span>
                      ,250
                    </span>
                    <span className="absolute bottom-0.5 right-1 font-mono text-[9px] text-[#C0392B] font-bold">
                      SMUDGE
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs text-[#0B1F3A] font-bold">
                      Dual-Pass Engine Mismatch
                    </span>
                    <span className="font-mono text-[11px] text-[#5B6B82] mt-0.5">
                      Primary Engine: ₹1,84,250 • Verification Pass: ₹1,81,250
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-[#EFF4FF] text-right shrink-0 border border-[#CBD5E1]">
                  <span className="font-mono text-[10px] text-[#5B6B82] block">
                    Variance Potential
                  </span>
                  <span className="font-mono text-xs text-[#C0392B] font-bold">
                    ₹3,000 Delta
                  </span>
                </div>
              </div>

              {/* Technical Reason */}
              <div className="mt-2.5 p-2 rounded bg-white border border-[#E3E8F0] flex items-start gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B] text-base shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-[11px] text-[#5B6B82] leading-tight">
                  <strong className="text-[#0B1F3A]">Reason for Pause:</strong> A physical printhead ink-smear intersects the vertical stem of digit &apos;4&apos;. To protect your statutory reply under Section 61 from unintentional discrepancy admissions, please lock the authentic figure.
                </p>
              </div>
            </div>

            {/* Human Confirmation Form Area */}
            <div className="bg-[#F6F8FB] rounded-card p-4 mb-5 border border-[#E3E8F0]">
              <label
                htmlFor="discrepancy-input"
                className="block text-xs font-bold text-[#0B1F3A] mb-1.5"
              >
                Enter the exact questioned discrepancy amount as per physical notice (₹):
              </label>

              <div className="relative mb-2.5">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none font-mono text-base font-bold text-[#5B6B82]">
                  ₹
                </span>
                <input
                  id="discrepancy-input"
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  placeholder="e.g. 184250"
                  className="w-full pl-8 pr-28 py-2.5 bg-white rounded-control font-mono text-base font-bold text-[#0B1F3A] border border-[#E3E8F0] focus:outline-none focus:ring-2 focus:ring-[#2B4C9B] transition-all shadow-2xs"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="font-mono text-[11px] text-[#2B4C9B] font-bold">
                    INR (Exact)
                  </span>
                </div>
              </div>

              {/* Inline Validation Error */}
              {validationError && (
                <div className="p-2 mb-2.5 rounded bg-[#FEE2E2] text-[#C0392B] text-xs font-semibold flex items-center gap-2 border border-[#FECACA] animate-in fade-in duration-150">
                  <span className="material-symbols-outlined text-sm shrink-0">error</span>
                  <span>{validationError}</span>
                </div>
              )}

              {/* Quick Pick Chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#5B6B82] font-semibold">Quick Pick:</span>
                <button
                  type="button"
                  onClick={handleFillReadA}
                  className="px-2.5 py-1 rounded bg-white hover:bg-[#EFF4FF] text-[#0B1F3A] font-mono text-xs font-semibold transition-colors border border-[#E3E8F0] shadow-2xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs text-[#12805C]">check_circle</span>
                  <span>Match Read A (₹1,84,250)</span>
                </button>
                <button
                  type="button"
                  onClick={handleFillReadB}
                  className="px-2.5 py-1 rounded bg-white hover:bg-[#EFF4FF] text-[#0B1F3A] font-mono text-xs font-semibold transition-colors border border-[#E3E8F0] shadow-2xs flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs text-[#5B6B82]">history</span>
                  <span>Match Read B (₹1,81,250)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMathPreview(!showMathPreview)}
                  className="px-2.5 py-1 rounded bg-[#DCE9FF] hover:bg-[#CBD5E1] text-[#2B4C9B] font-mono text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">calculate</span>
                  <span>Refer GSTR-2B Math</span>
                </button>
              </div>

              {/* Dynamic Live Ledger Sync Preview */}
              {showMathPreview && (
                <div className="mt-3 p-3 rounded-card bg-white border border-[#CBD5E1] text-xs font-mono text-[#0F172A] animate-in fade-in duration-150">
                  <span className="font-bold text-[#0B1F3A]">Calculation check:</span>{' '}
                  3B Claimed (₹14,92,450) − 2B Available (₹13,08,200) ={' '}
                  <strong className="text-[#12805C] font-bold">₹1,84,250.00</strong>. This mathematically validates OCR Read A!
                </div>
              )}
            </div>

            {/* Confirmation CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-control bg-[#0B1F3A] text-white hover:bg-[#2B4C9B] transition-all shadow-md font-headline text-sm font-bold flex items-center justify-center gap-2 group cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">refresh</span>
                    <span>Confirming...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm and continue</span>
                    <span className="material-symbols-outlined text-base group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(
                    `Case ${CANONICAL_DEMO_CASE.caseId} flagged for dedicated CA review. Audit trail updated.`
                  );
                }}
                className="px-4 py-3 rounded-control bg-white hover:bg-[#EFF4FF] text-[#0B1F3A] text-xs font-semibold transition-colors border border-[#E3E8F0] flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                <span>Flag for Manual CA Review</span>
              </button>
            </div>
          </div>

          {/* EXTRACTED METADATA REPOSITORY */}
          <div className="bg-white rounded-modal shadow-tier1 border border-[#E3E8F0] p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0B1F3A] text-xl">fact_check</span>
                <h3 className="font-headline text-base font-bold text-[#0B1F3A]">
                  Validated Statutory Parameters
                </h3>
              </div>
              <span className="font-mono text-xs text-[#5B6B82]">Deterministic Rule Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Field 1: Notice Type */}
              <div className="p-3 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#5B6B82] uppercase">
                    Statutory Notice Type
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-white text-[#12805C] font-mono text-[10px] flex items-center gap-1 font-bold border border-[#E3E8F0]">
                    <span className="material-symbols-outlined text-xs">verified</span> 100%
                  </span>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold">
                  {CANONICAL_DEMO_CASE.formType}
                </span>
                <span className="text-[11px] text-[#5B6B82] mt-0.5">
                  Rule 99(1) of CGST Rules, 2017
                </span>
              </div>

              {/* Field 2: Scrutiny Period */}
              <div className="p-3 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#5B6B82] uppercase">
                    Scrutiny Period
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-white text-[#12805C] font-mono text-[10px] flex items-center gap-1 font-bold border border-[#E3E8F0]">
                    <span className="material-symbols-outlined text-xs">verified</span> 100%
                  </span>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold">
                  {CANONICAL_DEMO_CASE.taxPeriod}
                </span>
                <span className="text-[11px] text-[#5B6B82] mt-0.5">
                  First Quarter (Apr–Jun 2024)
                </span>
              </div>

              {/* Field 3: Legal Ground Cited */}
              <div className="p-3 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#5B6B82] uppercase">
                    Legal Ground Cited
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-white text-[#12805C] font-mono text-[10px] flex items-center gap-1 font-bold border border-[#E3E8F0]">
                    <span className="material-symbols-outlined text-xs">verified</span> 100%
                  </span>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold">
                  Section 61 (Scrutiny)
                </span>
                <span className="text-[11px] text-[#5B6B82] mt-0.5">
                  Discrepancy notice prior to demand adjudication
                </span>
              </div>

              {/* Field 4: Taxpayer & GSTIN */}
              <div className="p-3 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-[#5B6B82] uppercase">
                    Taxpayer Identity
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-white text-[#12805C] font-mono text-[10px] flex items-center gap-1 font-bold border border-[#E3E8F0]">
                    <span className="material-symbols-outlined text-xs">verified</span> 100%
                  </span>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold truncate">
                  {CANONICAL_DEMO_CASE.businessName}
                </span>
                <span className="font-mono text-[11px] text-[#5B6B82] mt-0.5">
                  GSTIN: {CANONICAL_DEMO_CASE.gstin}
                </span>
              </div>
            </div>

            {/* Field 5: Questioned Amount Field */}
            <div className="mt-3 p-3.5 rounded-card bg-[#FEF3C7]/40 border border-[#FDE68A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#B45309] flex items-center justify-center font-bold border border-[#FDE68A]">
                  <span className="material-symbols-outlined text-base">warning</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-[#B45309] uppercase font-bold">
                    Amount Questioned in Notice
                  </span>
                  <span className="font-mono text-lg text-[#0B1F3A] font-bold">
                    {currentFormattedDisplay()}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded bg-[#FEF3C7] text-[#B45309] font-mono text-[11px] font-bold flex items-center gap-1 border border-[#FDE68A]">
                <span className="material-symbols-outlined text-xs">
                  {isConfirmedSuccess ? 'check_circle' : 'edit_note'}
                </span>
                {isConfirmedSuccess ? 'Confirmed by Taxpayer' : 'Human Check Required'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
