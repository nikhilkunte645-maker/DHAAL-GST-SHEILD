import React, { useState } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { validateConfirmedAmount } from '../lib/amount';
import { formatINR } from '../lib/format';
import { NoticeScanViewer } from '../components/NoticeScanViewer';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

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
    <div className="flex flex-col w-full pb-12">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
          Confirm Questioned Amount
        </h1>
        <p className="text-sm text-[#5B6B82] mt-1">
          Review extracted parameters from Form ASMT-10 and confirm the authentic discrepancy figure.
        </p>
      </div>

      {/* Main Grid: 2 Columns on Desktop, Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT PANE: Scanned Notice Viewer */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#2B4C9B] text-lg">description</span>
              <h2 className="font-headline text-base font-bold text-[#0B1F3A]">
                Scanned Notice ASMT-10
              </h2>
            </div>
            <span className="text-xs text-[#5B6B82] font-mono">
              Ward 102 • Mumbai Div-IV
            </span>
          </div>

          <NoticeScanViewer />
        </div>

        {/* RIGHT PANE: Extracted Fields & Pause Checkpoint Card */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* THE AMBER PAUSE CARD */}
          <Card variant="default" padding="none" className="relative overflow-hidden shadow-tier1">
            {/* Top Accent Strip */}
            <div
              className={`h-1.5 transition-colors ${
                isConfirmedSuccess ? 'bg-[#12805C]' : 'bg-[#F59E0B]'
              }`}
            />

            <div className="p-5 sm:p-6 flex flex-col gap-5">
              {/* Alert Callout */}
              <div
                role="alert"
                className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-control border-l-4 transition-all ${
                  isConfirmedSuccess
                    ? 'bg-[#E6F4EA] border-[#12805C] text-[#12805C]'
                    : 'bg-[#FEF3C7] border-[#B45309] text-[#B45309]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isConfirmedSuccess
                      ? 'bg-[#12805C] text-white'
                      : 'bg-[#B45309] text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isConfirmedSuccess ? 'check' : 'pause_circle'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline text-sm sm:text-base font-bold text-[#0F172A]">
                    {isConfirmedSuccess
                      ? 'Discrepancy Amount Confirmed'
                      : 'Verification Checkpoint: Ambiguity Detected'}
                  </span>
                  <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">
                    {isConfirmedSuccess
                      ? 'Figure confirmed as ₹1,84,250.00. The mathematical pipeline is unlocked.'
                      : 'An ink smudge on row 2 creates ambiguity between ₹1,84,250 and ₹1,81,250. Because legal notice replies demand exact figures, please confirm the authentic figure.'}
                  </p>
                </div>
              </div>

              {/* Magnification Comparison Crop Module */}
              <div className="bg-[#F8FAFC] rounded-control p-3.5 sm:p-4 border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#5B6B82] font-bold">
                    Micro-Scan Area [Row 2: Discrepancy Amount]
                  </span>
                  <Badge variant="neutral" size="sm">
                    4.8x Magnification
                  </Badge>
                </div>

                {/* Zoomed Crop Display */}
                <div className="bg-white rounded-control p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-[#E2E8F0] shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-12 bg-[#EFF4FF] rounded-control flex items-center justify-center relative overflow-hidden font-mono text-base font-bold tracking-wider text-[#0B1F3A] border border-[#CBD5E1]">
                      <span>
                        ₹1,8
                        <span className="relative inline-block text-[#B45309]">
                          4
                          <span className="absolute inset-0 bg-[#F59E0B]/30 blur-[2px]" />
                        </span>
                        ,250
                      </span>
                      <span className="absolute bottom-0.5 right-1 font-mono text-[8px] text-[#C0392B] font-bold">
                        SMUDGE
                      </span>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs text-[#0B1F3A] font-bold">
                        Dual-Pass Engine Mismatch
                      </span>
                      <span className="font-mono text-[11px] text-[#5B6B82] mt-0.5">
                        Read A: ₹1,84,250 • Read B: ₹1,81,250
                      </span>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-control bg-[#EFF4FF] text-right shrink-0 border border-[#CBD5E1]">
                    <span className="font-mono text-[10px] text-[#5B6B82] block">
                      Variance
                    </span>
                    <span className="font-mono text-xs text-[#C0392B] font-bold">
                      ₹3,000 Delta
                    </span>
                  </div>
                </div>

                <div className="mt-2 p-2 rounded-control bg-white border border-[#E2E8F0] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#2B4C9B] text-base shrink-0 mt-0.5">
                    info
                  </span>
                  <p className="text-[11px] text-[#5B6B82] leading-tight">
                    <strong className="text-[#0B1F3A]">Reason for Pause:</strong> A physical printhead ink-smear intersects the digit &apos;4&apos;. Confirm the correct figure to ensure your statutory response under Section 61 is accurate.
                  </p>
                </div>
              </div>

              {/* Confirmation Form */}
              <div className="bg-[#F8FAFC] rounded-control p-4 border border-[#E2E8F0]">
                <label
                  htmlFor="discrepancy-input"
                  className="block text-xs font-bold text-[#0B1F3A] mb-1.5"
                >
                  Enter the exact questioned discrepancy amount (₹):
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
                    className="w-full pl-8 pr-24 py-2.5 bg-white rounded-control font-mono text-base font-bold text-[#0B1F3A] border border-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2B4C9B] transition-all shadow-2xs"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="font-mono text-[11px] text-[#2B4C9B] font-bold">
                      INR Exact
                    </span>
                  </div>
                </div>

                {validationError && (
                  <div className="p-2 mb-2.5 rounded-control bg-[#FEE2E2] text-[#C0392B] text-xs font-semibold flex items-center gap-2 border border-[#FECACA]">
                    <span className="material-symbols-outlined text-sm shrink-0">error</span>
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Quick Pick Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#5B6B82] font-semibold">Quick Pick:</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon="check_circle"
                    onClick={handleFillReadA}
                    className="font-mono text-xs"
                  >
                    Read A (₹1,84,250)
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon="history"
                    onClick={handleFillReadB}
                    className="font-mono text-xs"
                  >
                    Read B (₹1,81,250)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon="calculate"
                    onClick={() => setShowMathPreview(!showMathPreview)}
                    className="text-xs"
                  >
                    GSTR-2B Math
                  </Button>
                </div>

                {showMathPreview && (
                  <div className="mt-3 p-3 rounded-control bg-white border border-[#CBD5E1] text-xs font-mono text-[#0F172A] animate-in fade-in duration-150">
                    <span className="font-bold text-[#0B1F3A]">Calculation check:</span>{' '}
                    3B Claimed (₹14,92,450) − 2B Available (₹13,08,200) ={' '}
                    <strong className="text-[#12805C] font-bold">₹1,84,250.00</strong>. This mathematically validates Read A!
                  </div>
                )}
              </div>

              {/* Confirmation CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  icon="arrow_forward"
                  iconPosition="right"
                  className="font-headline font-bold"
                >
                  Confirm and continue
                </Button>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  icon="support_agent"
                  onClick={() => {
                    alert(
                      `Case ${CANONICAL_DEMO_CASE.caseId} flagged for dedicated CA review. Audit trail updated.`
                    );
                  }}
                >
                  Flag for Manual CA Review
                </Button>
              </div>
            </div>
          </Card>

          {/* VALIDATED PARAMETERS CARD */}
          <Card variant="default" padding="md">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0B1F3A] text-xl">fact_check</span>
                <h3 className="font-headline text-sm sm:text-base font-bold text-[#0B1F3A]">
                  Validated Notice Parameters
                </h3>
              </div>
              <Badge variant="brand" size="sm">
                Deterministic
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field 1 */}
              <div className="p-3 rounded-control bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#5B6B82] uppercase font-semibold">
                    Statutory Notice Type
                  </span>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold">
                  {CANONICAL_DEMO_CASE.formType}
                </span>
                <span className="text-[11px] text-[#5B6B82] mt-0.5">
                  Rule 99(1) of CGST Rules
                </span>
              </div>

              {/* Field 2 */}
              <div className="p-3 rounded-control bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#5B6B82] uppercase font-semibold">
                    Scrutiny Period
                  </span>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold">
                  {CANONICAL_DEMO_CASE.taxPeriod}
                </span>
                <span className="text-[11px] text-[#5B6B82] mt-0.5">
                  First Quarter (Apr–Jun 2024)
                </span>
              </div>

              {/* Field 3 */}
              <div className="p-3 rounded-control bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#5B6B82] uppercase font-semibold">
                    Legal Ground Cited
                  </span>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold">
                  Section 61 (Scrutiny)
                </span>
                <span className="text-[11px] text-[#5B6B82] mt-0.5">
                  Pre-adjudication scrutiny notice
                </span>
              </div>

              {/* Field 4 */}
              <div className="p-3 rounded-control bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#5B6B82] uppercase font-semibold">
                    Taxpayer Identity
                  </span>
                  <Badge variant="success" size="sm">
                    Verified
                  </Badge>
                </div>
                <span className="font-headline text-sm text-[#0B1F3A] font-bold truncate">
                  {CANONICAL_DEMO_CASE.businessName}
                </span>
                <span className="font-mono text-[11px] text-[#5B6B82] mt-0.5">
                  GSTIN: {CANONICAL_DEMO_CASE.gstin}
                </span>
              </div>
            </div>

            {/* Questioned Amount Field */}
            <div className="mt-3 p-3.5 rounded-control bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-control bg-[#FEF3C7] text-[#B45309] flex items-center justify-center font-bold border border-[#FDE68A]">
                  <span className="material-symbols-outlined text-base">warning</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#B45309] uppercase font-bold">
                    Amount Questioned in Notice
                  </span>
                  <span className="font-mono text-base sm:text-lg text-[#0B1F3A] font-bold">
                    {currentFormattedDisplay()}
                  </span>
                </div>
              </div>

              <Badge variant={isConfirmedSuccess ? 'success' : 'warning'} size="md">
                {isConfirmedSuccess ? 'Confirmed by Taxpayer' : 'Human Check Required'}
              </Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
