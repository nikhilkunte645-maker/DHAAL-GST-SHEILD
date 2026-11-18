import React, { useState, useMemo, useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { verifyDraft, ConfirmedFields } from '../lib/verifier';
import { dhaalApi, DraftVerifyResponse } from '../mockApi';

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
The apparent variance occurred solely because the supplier, M/s Apex Textiles (fictional) (GSTIN: 27XXXXX5678X1ZX), erroneously classified the supply in their outward return. The tax has duly been deposited into the Government treasury, and the vendor has since reconciled their subsequent Form GSTR-3B. Annexed hereto as Exhibit 3 is the Supplier Verification Certificate as recognized under CBIC Circular No. 183/15/2022-GST.

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 bg-[#EFF4FF] p-4 rounded-xl border border-[#CBD5E1]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[#0B1F3A] bg-white px-2.5 py-1 rounded-full border border-[#E3E8F0] shadow-2xs">
            STAGE 05 OF 06
          </span>
          <span className="text-xs font-semibold text-[#0B1F3A]">
            Draft &amp; Statutory Verifier
          </span>
          <span className="text-xs text-[#5B6B82] hidden sm:inline">•</span>
          <span className="font-mono text-xs text-[#5B6B82]">
            DRAFT for CA review
          </span>
        </div>

        {/* Audit Mode Toggle (Segmented Control) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0B1F3A]">Verification Audit Mode:</span>
          <div className="inline-flex bg-white p-1 rounded-lg border border-[#CBD5E1] shadow-2xs">
            <button
              type="button"
              onClick={() => setVerifierMode('pass')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                verifierMode === 'pass'
                  ? 'bg-[#12805C] text-white shadow-2xs'
                  : 'text-[#44474D] hover:text-[#0B1F3A]'
              }`}
            >
              Pass (Verified ₹1,84,250)
            </button>
            <button
              type="button"
              onClick={() => setVerifierMode('fail')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                verifierMode === 'fail'
                  ? 'bg-[#C0392B] text-white shadow-2xs'
                  : 'text-[#44474D] hover:text-[#0B1F3A]'
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
          className="p-4 mb-6 rounded-card border-l-4 border-l-[#C0392B] bg-[#FEE2E2] border border-[#FECACA] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-shake"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#C0392B] text-2xl shrink-0 mt-0.5">
              gavel
            </span>
            <div>
              <h4 className="font-headline text-sm font-bold text-[#C0392B] flex items-center gap-2">
                <span>Deterministic Verification Failed: Statutory Mismatch Detected</span>
                <span className="px-2 py-0.5 rounded bg-[#C0392B] text-white text-[10px] font-mono">
                  EXPORT BLOCKED
                </span>
              </h4>
              <p className="text-xs text-[#0B1F3A] mt-1 leading-relaxed">
                The draft assertions diverge from confirmed case records. Exporting Form GST ASMT-11 with inconsistent figures or missing sections violates GST Audit Safety Policy DP-61.
              </p>
              {apiVerification?.mismatches && apiVerification.mismatches.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs font-mono text-[#C0392B]">
                  {apiVerification.mismatches.map((m, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C0392B]"></span>
                      <strong>{m.field}:</strong> Expected {m.expected}, found &quot;{m.found_in_draft}&quot; ({m.severity})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoFix}
            disabled={isAutoFixing}
            className="px-4 py-2.5 rounded-control bg-[#0B1F3A] hover:bg-[#2B4C9B] text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-md active:scale-98"
          >
            <span className={`material-symbols-outlined text-sm ${isAutoFixing ? 'animate-spin' : ''}`}>
              auto_fix_high
            </span>
            <span>{isAutoFixing ? 'Re-aligning...' : 'Re-align Figures (Auto-fix)'}</span>
          </button>
        </div>
      )}

      {/* Main Split View: Left Form ASMT-11 Draft / Right Dual-Layer Verifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Form GST ASMT-11 Interactive Draft Editor (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] overflow-hidden">
            {/* Document Card Header */}
            <div className="p-4 bg-[#EFF4FF] border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B]">description</span>
                <div>
                  <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">
                    Form GST ASMT-11 (Draft for CA Review)
                  </h3>
                  <span className="text-[10px] text-[#5B6B82] font-mono">[See Rule 99(2)]</span>
                </div>
              </div>

              {/* View/Edit Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-white p-0.5 rounded border border-[#CBD5E1] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setEditorTab('editor')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                      editorTab === 'editor'
                        ? 'bg-[#0B1F3A] text-white'
                        : 'text-[#5B6B82] hover:text-[#0B1F3A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">edit_note</span>
                    <span>Interactive Editor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                      editorTab === 'preview'
                        ? 'bg-[#0B1F3A] text-white'
                        : 'text-[#5B6B82] hover:text-[#0B1F3A]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    <span>Legal Layout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recipient & Metadata Strip */}
            <div className="p-3 bg-[#F6F8FB] border-b border-[#E3E8F0] text-xs font-mono flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong>To:</strong> The Proper Officer, {CANONICAL_DEMO_CASE.office.ward}, Mumbai | <strong>Tax Period:</strong> {CANONICAL_DEMO_CASE.taxPeriod}
              </div>
              <div className="flex items-center gap-2">
                {isVerifyingLive && (
                  <span className="font-mono text-[10px] text-[#2B4C9B] animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2B4C9B] animate-ping"></span>
                    Evaluating live...
                  </span>
                )}
                <span className="font-mono text-[10px] text-[#5B6B82]">
                  {draftContent.length} chars
                </span>
              </div>
            </div>

            {/* Interactive Editor View */}
            {editorTab === 'editor' ? (
              <div className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs text-[#5B6B82]">
                  <span className="font-medium">
                    Edit draft legal text. Real-time verification runs automatically upon typing:
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftContent(defaultDraftText)}
                    className="text-[#2B4C9B] hover:underline font-mono text-[11px]"
                  >
                    Reset Text
                  </button>
                </div>

                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  rows={20}
                  className="w-full p-4 font-mono text-xs leading-relaxed text-[#0B1F3A] bg-[#F8F9FF] border border-[#CBD5E1] rounded-card focus:outline-none focus:ring-2 focus:ring-[#2B4C9B] transition-all resize-y selection:bg-[#2B4C9B] selection:text-white"
                  placeholder="Enter or paste Form GST ASMT-11 statutory legal reply..."
                />
              </div>
            ) : (
              /* Structured Paragraph Preview View */
              <div className="p-6 flex flex-col gap-5 text-xs text-[#0F172A] leading-relaxed">
                <div className="p-3 bg-[#EFF4FF] rounded-lg border border-[#CBD5E1] font-medium text-[#0B1F3A]">
                  <strong>SUBJECT:</strong> Written explanation and reconciliation of discrepancy in Form GST ASMT-10 issued under Section 61 of the CGST / MGST Act, 2017 regarding Input Tax Credit claim.
                </div>

                <p className="font-semibold text-[#0B1F3A]">Respected Sir / Madam,</p>

                {/* Section 1 */}
                <div
                  className={`p-3 rounded-lg border transition-colors ${
                    activeAnchorHighlight === 'sec1'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F6F8FB] border-[#E3E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#0B1F3A]">
                      1. BASIS OF SCRUTINY &amp; RECONCILIATION
                    </span>
                    <span
                      onMouseEnter={() => setActiveAnchorHighlight('sec1')}
                      onMouseLeave={() => setActiveAnchorHighlight(null)}
                      className="px-2 py-0.2 rounded font-mono text-[10px] bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1] cursor-pointer hover:bg-[#DCE9FF]"
                    >
                      Notice Field (Verified)
                    </span>
                  </div>
                  <p>
                    In response to the statutory notice in Form GST ASMT-10 reference number{' '}
                    <span className="font-mono font-bold text-[#0B1F3A] bg-white px-1 rounded border border-[#CBD5E1]">
                      {CANONICAL_DEMO_CASE.noticeRef}
                    </span>{' '}
                    dated <strong>{CANONICAL_DEMO_CASE.noticeDate}</strong> pointing out an alleged ITC mismatch of{' '}
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                        verifierMode === 'fail'
                          ? 'bg-[#FEE2E2] text-[#C0392B] border border-[#FECACA] animate-pulse'
                          : 'bg-[#E6F4EA] text-[#12805C] border border-[#A8DAB5]'
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
                  className={`p-3 rounded-lg border transition-colors ${
                    activeAnchorHighlight === 'sec2'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F6F8FB] border-[#E3E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#0B1F3A]">
                      2. AFFIRMATION OF PHYSICAL VERIFICATION
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        onMouseEnter={() => setActiveAnchorHighlight('sec2')}
                        onMouseLeave={() => setActiveAnchorHighlight(null)}
                        className="px-2 py-0.2 rounded font-mono text-[10px] bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1] cursor-pointer hover:bg-[#DCE9FF]"
                      >
                        Confirmed by Taxpayer (Step 2)
                      </span>
                    </div>
                  </div>
                  <p>
                    The registered person has independently audited their purchase register, balance sheet, and bank remittance ledgers. It is confirmed that the said sum of{' '}
                    <span className="font-mono font-bold text-[#0B1F3A]">
                      ₹{displayedAmount.toLocaleString('en-IN')}
                    </span>{' '}
                    was legally availed and rightfully credited in the Electronic Credit Ledger strictly in relation to genuine business supplies utilised for taxable outward supplies.
                  </p>
                </div>

                {/* Section 3 */}
                <div
                  className={`p-3 rounded-lg border transition-colors ${
                    activeAnchorHighlight === 'sec3'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F6F8FB] border-[#E3E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#0B1F3A]">
                      3. STATUTORY COMPLIANCE BENCHMARK
                    </span>
                    <span
                      onMouseEnter={() => setActiveAnchorHighlight('sec3')}
                      onMouseLeave={() => setActiveAnchorHighlight(null)}
                      className="px-2 py-0.2 rounded font-mono text-[10px] bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1] cursor-pointer hover:bg-[#DCE9FF]"
                    >
                      Statutory Mandate: Sec 16(2)
                    </span>
                  </div>
                  <p>
                    All goods represented in the invoices were physically received at the registered premises under cover of legitimate tax invoices and verified E-way bills, satisfying all four constituent conditions laid down under <strong>Section 16(2)(a), (b), (c), and (d)</strong> of the Central Goods and Services Tax Act, 2017. Furthermore, payments for invoice amounts along with tax have been cleared via Account Payee banking channels within the 180-day limitation period prescribed under the second proviso to Section 16(2).
                  </p>
                </div>

                {/* Section 4 */}
                <div
                  className={`p-3 rounded-lg border transition-colors ${
                    activeAnchorHighlight === 'sec4'
                      ? 'bg-[#FEF3C7] border-[#F59E0B]'
                      : 'bg-[#F6F8FB] border-[#E3E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#0B1F3A]">
                      4. PROBABLE CAUSE &amp; TAX DISCHARGE
                    </span>
                    <span
                      onMouseEnter={() => setActiveAnchorHighlight('sec4')}
                      onMouseLeave={() => setActiveAnchorHighlight(null)}
                      className="px-2 py-0.2 rounded font-mono text-[10px] bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1] cursor-pointer hover:bg-[#DCE9FF]"
                    >
                      Evidence Attached
                    </span>
                  </div>
                  <p>
                    The apparent variance occurred solely because the supplier, <strong>{CANONICAL_DEMO_CASE.supplier.name} ({CANONICAL_DEMO_CASE.supplier.gstin})</strong>, erroneously classified the supply in their outward return. The tax has duly been deposited into the Government treasury, and the vendor has since reconciled their subsequent Form GSTR-3B. Annexed hereto as Exhibit 3 is the Supplier Verification Certificate as recognized under CBIC Circular No. 183/15/2022-GST.
                  </p>
                </div>

                <p className="mt-1">
                  In light of statutory precedents and verified exhibits, it is prayed that the proceedings initiated under Section 61 be respectfully dropped in terms of Rule 99(2) and Form GST ASMT-12 (Order of Acceptance) be issued.
                </p>

                {/* Verification Preview */}
                <div className="p-3 bg-[#EFF4FF] rounded-card border border-[#CBD5E1] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mt-2">
                  <div>
                    <span className="font-mono text-[10px] text-[#5B6B82] uppercase font-bold block">
                      Solemn Verification
                    </span>
                    <span className="font-semibold text-[#0B1F3A]">
                      Ramesh Sharma, Sole Proprietor
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[10px] text-[#5B6B82] block">
                      Mumbai • Target: {CANONICAL_DEMO_CASE.replyDeadline}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Dual-Layer Verification Card (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Main Inspection Banner */}
          <div
            className={`p-6 rounded-modal border transition-all ${
              isVerifiedPass
                ? 'bg-[#0B1F3A] text-white border-[#12805C] shadow-tier2'
                : 'bg-[#0B1F3A] text-white border-[#C0392B] shadow-tier2'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span
                  className={`material-symbols-outlined text-2xl ${
                    isVerifiedPass ? 'text-[#12805C]' : 'text-[#C0392B]'
                  }`}
                >
                  {isVerifiedPass ? 'verified_user' : 'dangerous'}
                </span>
                <div>
                  <h3 className="font-headline text-base font-bold">
                    Dual-Layer Verification Engine
                  </h3>
                  <p className="text-xs text-[#CBD5E1]">
                    Deterministic AST &amp; Statutory Assertion Safety Guard
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs px-3 py-1 rounded-full font-bold border flex items-center gap-1.5 ${
                    isVerifiedPass
                      ? 'bg-[#12805C]/20 text-[#12805C] border-[#12805C]'
                      : 'bg-[#C0392B]/20 text-[#C0392B] border-[#C0392B]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isVerifiedPass ? 'bg-[#12805C]' : 'bg-[#C0392B] animate-ping'
                    }`}
                  ></span>
                  <span>{isVerifiedPass ? 'VERIFIED: PASS' : 'VERIFIED: FAIL'}</span>
                </span>
              </div>
            </div>

            {/* Check Progress Indicators */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10 bg-white/5 p-3 rounded-card">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-mono">
                  <span className="text-[#CBD5E1] uppercase text-[10px]">Layer 1: Code Checks</span>
                  <span className="font-bold text-white">
                    {localReport.passedCount} / {localReport.totalChecks} Checks
                  </span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      localReport.passed ? 'bg-[#12805C]' : 'bg-[#C0392B]'
                    }`}
                    style={{ width: `${(localReport.passedCount / localReport.totalChecks) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-mono">
                  <span className="text-[#CBD5E1] uppercase text-[10px]">Layer 2: AI Claim Check</span>
                  <span className="font-bold text-white">4 / 4 Grounded</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-[#F59E0B]" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* LAYER 1: Deterministic Code Checks */}
          <div className="bg-white p-5 rounded-modal shadow-tier1 border border-[#E3E8F0] flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B]">memory</span>
                <h4 className="font-headline text-sm font-bold text-[#0B1F3A]">
                  Layer 1: Deterministic Code Checks
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {apiVerification && (
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold border ${
                      apiVerification.status === 'PASS'
                        ? 'bg-[#E6F4EA] text-[#12805C] border-[#A8DAB5]'
                        : 'bg-[#FEE2E2] text-[#C0392B] border-[#FECACA]'
                    }`}
                  >
                    API: {apiVerification.status}
                  </span>
                )}
                <span className="font-mono text-xs text-[#5B6B82]">Strict Rule Engine</span>
              </div>
            </div>

            {/* Render Checks Computed LIVE */}
            <div className="flex flex-col gap-3">
              {localReport.checks.map((c) => (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-card border transition-all ${
                    c.passed
                      ? 'bg-[#EFF4FF] border-[#CBD5E1]'
                      : 'bg-[#FEE2E2] border-[#C0392B]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`material-symbols-outlined text-lg shrink-0 mt-0.5 ${
                          c.passed ? 'text-[#12805C]' : 'text-[#C0392B]'
                        }`}
                      >
                        {c.passed ? 'check_circle' : 'cancel'}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0B1F3A]">
                          {c.name}
                        </span>
                        <p className="text-xs text-[#5B6B82] mt-0.5 leading-snug">
                          {c.message}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold shrink-0 border ${
                        c.passed
                          ? 'bg-[#E6F4EA] text-[#12805C] border-[#A8DAB5]'
                          : 'bg-[#C0392B] text-white border-[#C0392B]'
                      }`}
                    >
                      {c.passed ? 'PASSED' : 'CRITICAL FAIL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proceed to CA Brief Dossier Button */}
          <div className="p-4 bg-white rounded-modal border border-[#E3E8F0] shadow-tier1 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-headline text-sm font-bold text-[#0B1F3A]">
                {isVerifiedPass ? 'All Checks Verified' : 'Export Action Blocked'}
              </h4>
              <p className="text-xs text-[#5B6B82]">
                {isVerifiedPass
                  ? 'Form ASMT-11 draft meets statutory benchmarks. Ready to compile CA dossier.'
                  : 'Resolve discrepancy or click Auto-fix to unlock Step 6.'}
              </p>
            </div>

            <button
              type="button"
              disabled={!isVerifiedPass}
              onClick={() => setStep(6)}
              className={`px-6 py-3 rounded-control font-headline text-sm font-bold flex items-center gap-2 transition-all shadow-md ${
                isVerifiedPass
                  ? 'bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] active:scale-98 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>Compile CA-Ready Brief</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
