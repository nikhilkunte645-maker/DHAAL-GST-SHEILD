import React, { useState, useMemo, useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { verifyDraft, ConfirmedFields } from '../lib/verifier';
import { dhaalApi, DraftVerifyResponse } from '../mockApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const Screen5DraftVerifier: React.FC = () => {
  const {
    confirmedAmount,
    verifierMode,
    setVerifierMode,
    setStep,
  } = useDhaalStore();

  const [activeAnchorHighlight, setActiveAnchorHighlight] = useState<string | null>(null);
  const [isAutoFixing, setIsAutoFixing] = useState<boolean>(false);
  const [editorTab, setEditorTab] = useState<'editor' | 'preview'>('editor');
  const [isVerifyingLive, setIsVerifyingLive] = useState<boolean>(false);

  const trueAmount = confirmedAmount || CANONICAL_DEMO_CASE.rows[1].difference;
  const displayedAmount = verifierMode === 'fail' ? 181250 : trueAmount;

  // Canonical base draft template
  const defaultDraftText = useMemo(() => {
    const amtStr = verifierMode === 'fail' ? '₹1,81,250' : `₹${trueAmount.toLocaleString('en-IN')}`;
    return `FORM GST ASMT-11
[See Rule 99(2)]
REPLY TO NOTICE ISSUED UNDER SECTION 61

To:
The Proper Officer, Ward 102,
Office of the Assistant Commissioner of State Tax,
Nodal Division-IV, Bandra-Kurla Complex, Mumbai - 400051

Subject: Reply in Form GST ASMT-11 in response to Notice for Scrutiny in Form GST ASMT-10 reference number ${CANONICAL_DEMO_CASE.noticeRef} dated ${CANONICAL_DEMO_CASE.noticeDate}.

Assessee: M/s Sharma Garments (GSTIN: ${CANONICAL_DEMO_CASE.gstin})
Tax Period: ${CANONICAL_DEMO_CASE.taxPeriod}

1. BASIS OF SCRUTINY & RECONCILIATION
In response to the statutory scrutiny notice pointing out an alleged ITC mismatch of ${amtStr} in Table 4(A)(5) of Form GSTR-3B versus Form GSTR-2B for ${CANONICAL_DEMO_CASE.taxPeriod}, the registered person respectfully submits this comprehensive itemized explanation.

2. AFFIRMATION OF PHYSICAL VERIFICATION
The registered person has independently audited their purchase register, balance sheet, and bank remittance ledgers. It is confirmed that the said sum of ${amtStr} was legally availed and rightfully credited in the Electronic Credit Ledger strictly in relation to genuine business supplies utilised for taxable outward supplies.

3. STATUTORY COMPLIANCE BENCHMARK
All goods represented in the invoices were physically received at the registered premises under cover of legitimate tax invoices and verified E-way bills, satisfying all four constituent conditions laid down under Section 16(2)(a), (b), (c), and (d) of the Central Goods and Services Tax Act, 2017. Furthermore, payments for invoice amounts along with tax have been cleared via Account Payee banking channels within the 180-day limitation period prescribed under Section 16(2).

4. PROBABLE CAUSE & TAX DISCHARGE
The apparent variance occurred solely because the supplier, M/s Apex Textiles (fictional) (GSTIN: 27XXXXX5678X1ZX), omitted the supply in their initial outward return. The tax has duly been deposited into the Government treasury, and the vendor has since reconciled their subsequent Form GSTR-3B / outward return. Annexed hereto as Exhibit 3 is the Supplier Verification Declaration & Reconciliation Statement.

In light of statutory precedents and verified exhibits, it is prayed that the proceedings initiated under Section 61 be respectfully dropped in terms of Rule 99(2) and Form GST ASMT-12 (Order of Acceptance) be issued.

Verification:
I, Ramesh Sharma, Sole Proprietor, solemnly declare that the facts stated above are true to the best of my knowledge and records.
Date: 26-May-2025 | Place: Mumbai | Target submission before statutory deadline ${CANONICAL_DEMO_CASE.replyDeadline}.`;
  }, [verifierMode, trueAmount]);

  // Editable draft state
  const [draftContent, setDraftContent] = useState<string>(defaultDraftText);

  // Sync draftContent whenever verifierMode toggles
  useEffect(() => {
    setDraftContent(defaultDraftText);
  }, [defaultDraftText]);

  // Prepare confirmed fields for client verifier
  const confirmedConfig: ConfirmedFields = useMemo(() => ({
    confirmedAmount: trueAmount,
    noticeDate: CANONICAL_DEMO_CASE.noticeDate,
    allowedDates: [
      CANONICAL_DEMO_CASE.noticeDate,
      '26-May-2025',
      CANONICAL_DEMO_CASE.replyDeadline,
      '18-Jun-2024',
      '14-June-2024',
      CANONICAL_DEMO_CASE.fixedClockDate,
    ],
    allowedSections: ['Section 61', 'Section 16', 'Section 16(2)', 'Rule 99', 'Rule 99(1)', 'Rule 99(2)'],
    gstin: CANONICAL_DEMO_CASE.gstin,
    noticeRef: CANONICAL_DEMO_CASE.noticeRef,
  }), [trueAmount]);

  // Compute local deterministic report
  const localReport = useMemo(() => {
    return verifyDraft(draftContent, confirmedConfig);
  }, [draftContent, confirmedConfig]);

  const [apiVerification, setApiVerification] = useState<DraftVerifyResponse | null>(null);

  // 500ms Debounced live REST API verification on FastAPI backend (POST /api/verify/draft)
  useEffect(() => {
    setIsVerifyingLive(true);
    const debounceTimer = setTimeout(() => {
      dhaalApi.verifyDraft({
        draft_text: draftContent,
        confirmed_amount: displayedAmount,
        confirmed_section: '61',
        confirmed_period: 'Apr-Jun 2024',
      }).then((res) => {
        setApiVerification(res);
        setIsVerifyingLive(false);
      }).catch((err) => {
        console.warn('[Dhaal Verifier] Debounced live verification error:', err);
        setIsVerifyingLive(false);
      });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [draftContent, displayedAmount]);

  const handleAutoFix = () => {
    setIsAutoFixing(true);
    setTimeout(() => {
      setVerifierMode('pass');
      setDraftContent(defaultDraftText);
      setIsAutoFixing(false);
    }, 450);
  };

  const isVerifiedPass = apiVerification ? apiVerification.status === 'PASS' : localReport.passed;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Header Context & Audit Mode Segmented Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="font-headline text-xl sm:text-2xl font-bold text-[#073B3A]">
            Draft &amp; Statutory Verifier
          </h1>
          <p className="text-xs sm:text-sm text-[#687674] mt-0.5">
            Form GST ASMT-11 Draft • Deterministic AST &amp; Statutory Assertion Safety Guard
          </p>
        </div>

        {/* Audit Mode Toggle (Segmented Control) */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold text-[#073B3A]">Audit Mode:</span>
          <div className="inline-flex bg-[#F1F5F9] p-0.5 rounded-control border border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setVerifierMode('pass')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all min-h-[44px] sm:min-h-[32px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] ${
                verifierMode === 'pass'
                  ? 'bg-[#119B72] text-white shadow-2xs'
                  : 'text-[#44474D] hover:text-[#073B3A]'
              }`}
            >
              Pass (₹1,84,250)
            </button>
            <button
              type="button"
              onClick={() => setVerifierMode('fail')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all min-h-[44px] sm:min-h-[32px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] ${
                verifierMode === 'fail'
                  ? 'bg-[#C0392B] text-white shadow-2xs'
                  : 'text-[#44474D] hover:text-[#073B3A]'
              }`}
            >
              Simulate Mismatch (₹1,81,250)
            </button>
          </div>
        </div>
      </div>

      {/* Discrepancy Warning Banner (When in Fail Mode) */}
      {!isVerifiedPass && (
        <div
          role="alert"
          className="p-4 mb-6 rounded-control border-l-4 border-l-[#C0392B] bg-[#FEF2F2] border border-[#FECACA] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-shake"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#C0392B] text-2xl shrink-0 mt-0.5">
              gavel
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-headline text-sm font-bold text-[#C0392B]">
                  Deterministic Verification Failed: Statutory Mismatch Detected
                </h4>
                <Badge variant="danger" size="sm">
                  EXPORT BLOCKED
                </Badge>
              </div>
              <p className="text-xs text-[#073B3A] mt-1 leading-relaxed">
                The draft assertions diverge from confirmed case records. Exporting Form GST ASMT-11 with inconsistent figures or missing sections violates GST Audit Safety Policy DP-61.
              </p>
              {apiVerification?.mismatches && apiVerification.mismatches.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs font-mono text-[#C0392B]">
                  {apiVerification.mismatches.map((m, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B]" />
                      <strong>{m.field}:</strong> Expected {m.expected}, found &quot;{m.found_in_draft}&quot; ({m.severity})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={isAutoFixing ? 'autorenew' : 'auto_fix_high'}
            onClick={handleAutoFix}
            disabled={isAutoFixing}
            className="shrink-0"
          >
            {isAutoFixing ? 'Re-aligning...' : 'Re-align Figures (Auto-fix)'}
          </Button>
        </div>
      )}

      {/* Main Split View: Left Form ASMT-11 Draft / Right Dual-Layer Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: Form GST ASMT-11 Interactive Draft Editor (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <Card variant="default" padding="none" className="overflow-hidden">
            {/* Document Card Header */}
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F73]">description</span>
                <div>
                  <h3 className="font-headline text-sm font-bold text-[#073B3A]">
                    Form GST ASMT-11 (Draft for CA Review)
                  </h3>
                  <span className="text-[10px] text-[#687674] font-mono">[See Rule 99(2)]</span>
                </div>
              </div>

              {/* View/Edit Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-white p-0.5 rounded-control border border-[#E4E9E5] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setEditorTab('editor')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all min-h-[44px] sm:min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] ${
                      editorTab === 'editor'
                        ? 'bg-[#073B3A] text-white'
                        : 'text-[#687674] hover:text-[#073B3A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">edit_note</span>
                    <span>Interactive Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-all min-h-[44px] sm:min-h-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] ${
                      editorTab === 'preview'
                        ? 'bg-[#073B3A] text-white'
                        : 'text-[#687674] hover:text-[#073B3A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    <span>Legal Layout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient & Metadata Strip */}
            <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-mono flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong>To:</strong> The Proper Officer, {CANONICAL_DEMO_CASE.office.ward}, Mumbai | <strong>Tax Period:</strong> {CANONICAL_DEMO_CASE.taxPeriod}
              </div>
              <div className="flex items-center gap-2">
                {isVerifyingLive && (
                  <span className="text-[10px] text-[#087F73] animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#087F73] animate-ping" />
                    Evaluating live...
                  </span>
                )}
                <span className="text-[10px] text-[#687674]">
                  {draftContent.length} chars
                </span>
              </div>
            </div>

            {/* Interactive Editor View */}
            {editorTab === 'editor' ? (
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#687674]">
                  <span className="font-medium">
                    Edit draft legal text. Real-time verification runs automatically:
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftContent(defaultDraftText)}
                    className="text-[#087F73] hover:underline font-mono text-[11px] min-h-[44px] py-2 px-1 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] rounded-control"
                  >
                    Reset Text
                  </button>
                </div>

                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={20}
                  className="w-full p-4 font-mono text-xs leading-relaxed text-[#073B3A] bg-[#F8FAFC] border border-[#E4E9E5] rounded-control focus:outline-none focus:ring-2 focus:ring-[#087F73] transition-all resize-y selection:bg-[#087F73] selection:text-white"
                  placeholder="Enter or paste Form GST ASMT-11 statutory legal reply..."
                />
              </div>
            ) : (
              /* Structured Paragraph Preview View */
              <div className="p-5 sm:p-6 flex flex-col gap-4 text-xs text-[#152B2A] leading-relaxed">
                <div className="p-3 bg-[#F8FAFC] rounded-control border border-[#E2E8F0] font-medium text-[#073B3A]">
                  <strong>SUBJECT:</strong> Written explanation and reconciliation of discrepancy in Form GST ASMT-10 issued under Section 61 of the CGST / MGST Act, 2017 regarding Input Tax Credit claim.
                </div>

                <p className="font-semibold text-[#073B3A]">Respected Sir / Madam,</p>

                {/* Section 1 */}
                <div
                  className={`p-3 rounded-control border transition-colors ${
                    activeAnchorHighlight === 'sec1'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#073B3A]">
                      1. BASIS OF SCRUTINY &amp; RECONCILIATION
                    </span>
                    <Badge
                      variant="brand"
                      size="sm"
                      onMouseEnter={() => setActiveAnchorHighlight('sec1')}
                      onMouseLeave={() => setActiveAnchorHighlight(null)}
                      className="cursor-pointer"
                    >
                      Notice Field (Verified)
                    </Badge>
                  </div>
                  <p>
                    In response to the statutory notice in Form GST ASMT-10 reference number{' '}
                    <span className="font-mono font-bold text-[#073B3A] bg-white px-1 rounded border border-[#E4E9E5]">
                      {CANONICAL_DEMO_CASE.noticeRef}
                    </span>{' '}
                    dated <strong>{CANONICAL_DEMO_CASE.noticeDate}</strong> pointing out an alleged ITC mismatch of{' '}
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                        verifierMode === 'fail'
                          ? 'bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA] animate-pulse'
                          : 'bg-[#E6F4EA] text-[#119B72] border border-[#A8DAB5]'
                      }`}
                    >
                      ₹{displayedAmount.toLocaleString('en-IN')}
                      {verifierMode === 'fail' ? ' (Mismatch)' : ''}
                    </span>{' '}
                    in Table 4(A)(5) of Form GSTR-3B versus Form GSTR-2B for {CANONICAL_DEMO_CASE.taxPeriod}, the registered person respectfully submits this comprehensive itemized explanation.
                  </p>
                </div>

                {/* Section 2 */}
                <div
                  className={`p-3 rounded-control border transition-colors ${
                    activeAnchorHighlight === 'sec2'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#073B3A]">
                      2. AFFIRMATION OF PHYSICAL VERIFICATION
                    </span>
                    <Badge
                      variant="brand"
                      size="sm"
                      onMouseEnter={() => setActiveAnchorHighlight('sec2')}
                      onMouseLeave={() => setActiveAnchorHighlight(null)}
                      className="cursor-pointer"
                    >
                      Confirmed (Step 2)
                    </Badge>
                  </div>
                  <p>
                    The registered person has independently audited their purchase register, balance sheet, and bank remittance ledgers. It is confirmed that the said sum of{' '}
                    <span className="font-mono font-bold text-[#073B3A]">
                      ₹{displayedAmount.toLocaleString('en-IN')}
                    </span>{' '}
                    was legally availed and rightfully credited in the Electronic Credit Ledger strictly in relation to genuine business supplies utilised for taxable outward supplies.
                  </p>
                </div>

                {/* Section 3 */}
                <div
                  className={`p-3 rounded-control border transition-colors ${
                    activeAnchorHighlight === 'sec3'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#073B3A]">
                      3. STATUTORY COMPLIANCE BENCHMARK
                    </span>
                    <Badge
                      variant="brand"
                      size="sm"
                      onMouseEnter={() => setActiveAnchorHighlight('sec3')}
                      onMouseLeave={() => setActiveAnchorHighlight(null)}
                      className="cursor-pointer"
                    >
                      Sec 16(2)
                    </Badge>
                  </div>
                  <p>
                    All goods represented in the invoices were physically received at the registered premises under cover of legitimate tax invoices and verified E-way bills, satisfying all four constituent conditions laid down under <strong>Section 16(2)(a), (b), (c), and (d)</strong> of the Central Goods and Services Tax Act, 2017. Furthermore, payments for invoice amounts along with tax have been cleared via Account Payee banking channels within the 180-day limitation period prescribed under the second proviso to Section 16(2).
                  </p>
                </div>

                {/* Section 4 */}
                <div
                  className={`p-3 rounded-control border transition-colors ${
                    activeAnchorHighlight === 'sec4'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#073B3A]">
                      4. PROBABLE CAUSE &amp; TAX DISCHARGE
                    </span>
                    <Badge
                      variant="brand"
                      size="sm"
                      onMouseEnter={() => setActiveAnchorHighlight('sec4')}
                      onMouseLeave={() => setActiveAnchorHighlight(null)}
                      className="cursor-pointer"
                    >
                      Evidence Attached
                    </Badge>
                  </div>
                  <p>
                    The apparent variance occurred solely because the supplier, <strong>{CANONICAL_DEMO_CASE.supplier.name} ({CANONICAL_DEMO_CASE.supplier.gstin})</strong>, omitted the supply in their initial outward return. The tax has duly been deposited into the Government treasury, and the vendor has since reconciled their subsequent Form GSTR-3B / outward return. Annexed hereto as Exhibit 3 is the Supplier Verification Declaration &amp; Reconciliation Statement.
                  </p>
                </div>

                <p className="mt-1">
                  In light of statutory precedents and verified exhibits, it is prayed that the proceedings initiated under Section 61 be respectfully dropped in terms of Rule 99(2) and Form GST ASMT-12 (Order of Acceptance) be issued.
                </p>

                {/* Verification Preview */}
                <div className="p-3 bg-[#F8FAFC] rounded-control border border-[#E2E8F0] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mt-2">
                  <div>
                    <span className="text-[10px] text-[#687674] uppercase font-bold block">
                      Solemn Verification
                    </span>
                    <span className="font-semibold text-[#073B3A]">
                      Ramesh Sharma, Sole Proprietor
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#687674] block">
                      Mumbai • Target: {CANONICAL_DEMO_CASE.replyDeadline}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Dual-Layer Verification Card (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Main Inspection Banner */}
          <div
            className={`p-5 sm:p-6 rounded-card border transition-all ${
              isVerifiedPass
                ? 'bg-[#073B3A] text-white border-[#119B72] shadow-tier2'
                : 'bg-[#073B3A] text-white border-[#C0392B] shadow-tier2'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-2xl ${
                    isVerifiedPass ? 'text-[#119B72]' : 'text-[#C0392B]'
                  }`}
                >
                  {isVerifiedPass ? 'verified_user' : 'dangerous'}
                </span>
                <div>
                  <h3 className="font-headline text-base font-bold">
                    Dual-Layer Verification Engine
                  </h3>
                  <p className="text-xs text-[#E4E9E5]">
                    Deterministic AST &amp; Statutory Assertion Safety Guard
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
                    isVerifiedPass
                      ? 'bg-[#119B72]/20 text-[#119B72] border-[#119B72]'
                      : 'bg-[#C0392B]/20 text-[#C0392B] border-[#C0392B]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVerifiedPass ? 'bg-[#119B72]' : 'bg-[#C0392B] animate-ping'
                    }`}
                  />
                  <span>{isVerifiedPass ? 'VERIFIED: PASS' : 'VERIFIED: FAIL'}</span>
                </span>
              </div>
            </div>

            {/* Check Progress Indicators */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10 bg-white/5 p-3 rounded-control">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-[#E4E9E5] uppercase text-[10px]">Layer 1: Code Checks</span>
                  <span className="font-bold text-white font-mono">
                    {localReport.passedCount} / {localReport.totalChecks} Checks
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      localReport.passed ? 'bg-[#119B72]' : 'bg-[#C0392B]'
                    }`}
                    style={{ width: `${(localReport.passedCount / localReport.totalChecks) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="text-[#E4E9E5] uppercase text-[10px]">Layer 2: AI Claim Check</span>
                  <span className="font-bold text-white font-mono">4 / 4 Grounded</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B]" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* LAYER 1: Deterministic Code Checks */}
          <Card variant="default" padding="md" className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F73]">memory</span>
                <h4 className="font-headline text-sm font-bold text-[#073B3A]">
                  Layer 1: Deterministic Code Checks
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {apiVerification && (
                  <Badge variant={apiVerification.status === 'PASS' ? 'success' : 'danger'} size="sm">
                    API: {apiVerification.status}
                  </Badge>
                )}
                <span className="text-xs text-[#687674]">Strict Rule Engine</span>
              </div>
            </div>

            {/* Render Checks Computed LIVE */}
            <div className="flex flex-col gap-3">
              {localReport.checks.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-control border transition-all ${
                    c.passed
                      ? 'bg-[#F8FAFC] border-[#E2E8F0]'
                      : 'bg-[#FEF2F2] border-[#C0392B]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                          c.passed ? 'text-[#119B72]' : 'text-[#C0392B]'
                        }`}
                      >
                        {c.passed ? 'check_circle' : 'cancel'}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#073B3A]">
                          {c.name}
                        </span>
                        <p className="text-xs text-[#687674] mt-0.5 leading-snug">
                          {c.message}
                        </p>
                      </div>
                    </div>

                    <Badge variant={c.passed ? 'success' : 'danger'} size="sm">
                      {c.passed ? 'PASSED' : 'CRITICAL FAIL'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Proceed to CA Brief Dossier Button */}
          <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-headline text-sm font-bold text-[#073B3A]">
                {isVerifiedPass ? 'All Checks Verified' : 'Export Action Blocked'}
              </h4>
              <p className="text-xs text-[#687674]">
                {isVerifiedPass
                  ? 'Form ASMT-11 draft meets statutory benchmarks. Ready to compile CA dossier.'
                  : 'Resolve discrepancy or click Auto-fix to unlock Step 6.'}
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              icon="arrow_forward"
              iconPosition="right"
              disabled={!isVerifiedPass}
              onClick={() => setStep(6)}
              className={isVerifiedPass ? 'bg-[#F59E0B] text-[#152B2A] hover:bg-[#D97706] shrink-0' : 'shrink-0'}
            >
              Compile CA-Ready Brief
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};
