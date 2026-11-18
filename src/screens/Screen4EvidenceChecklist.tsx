import React, { useState } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { formatINR } from '../lib/format';
import { downloadReconciliationCsv } from '../data/reconciliationData';

export const Screen4EvidenceChecklist: React.FC = () => {
  const {
    checklist,
    markChecklistUploaded,
    confirmedAmount,
    daysLeftOverride,
    setStep,
  } = useDhaalStore();

  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_action'>('all');
  const [selectedInvoicesModal, setSelectedInvoicesModal] = useState(false);

  const amount = confirmedAmount || CANONICAL_DEMO_CASE.rows[1].difference;

  // Compute live completed vs pending count
  const completedCount = checklist.filter(
    (item) => item.statusType === 'uploaded' || item.statusType === 'verified' || item.statusType === 'auto_generated'
  ).length;
  const totalCount = checklist.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const needsActionCount = checklist.filter(
    (item) => item.statusType === 'action_required' || item.statusType === 'in_progress'
  ).length;

  const filteredItems = checklist.filter((item) => {
    if (activeFilter === 'needs_action') {
      return item.statusType === 'action_required' || item.statusType === 'in_progress';
    }
    return true;
  });

  const handleSimulatedUpload = (itemId: string) => {
    markChecklistUploaded(itemId);
  };

  const handleWhatsAppSupplierPrompt = () => {
    const text = encodeURIComponent(
      `Dear M/s Apex Textiles, regarding Invoice AT/24-25/1102 (Tax: ₹1,84,250), we received GST Notice ${CANONICAL_DEMO_CASE.caseId}. Under CBIC Circular 183, kindly share your GSTR-3B tax payment confirmation/CA declaration for reconciliation. - Sharma Garments`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Header Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#EFF4FF] p-3 rounded-xl border border-[#CBD5E1]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[#0B1F3A] bg-white px-2.5 py-1 rounded-full border border-[#E3E8F0] shadow-2xs">
            STAGE 04 OF 06
          </span>
          <span className="text-xs font-semibold text-[#0B1F3A]">
            Evidence Preparation: Audit Trail & Statutory Evidentiary Binder
          </span>
        </div>
        <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-white text-[#2B4C9B] border border-[#CBD5E1] font-semibold">
          Mandate: CGST Sec 16(2) Clauses (a) to (d)
        </span>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1 */}
        <div className="p-4 bg-white rounded-card border border-[#E3E8F0] shadow-tier1 flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B82] font-semibold uppercase tracking-wider">
            Amount Questioned
          </span>
          <span className="font-mono text-xl font-bold text-[#0B1F3A] mt-1">
            {formatINR(amount, true)}
          </span>
          <span className="font-mono text-[10px] text-[#C0392B] mt-1 font-semibold">
            Table 4(A)(5) Variance
          </span>
        </div>

        {/* Card 2 */}
        <div className="p-4 bg-white rounded-card border border-[#E3E8F0] shadow-tier1 flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B82] font-semibold uppercase tracking-wider">
            Bank Audit Matching
          </span>
          <span className="font-mono text-sm font-bold text-[#12805C] mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">verified</span>
            100% Cleared
          </span>
          <span className="font-mono text-[10px] text-[#5B6B82] mt-1">
            {CANONICAL_DEMO_CASE.banking.bankName} (UTR: {CANONICAL_DEMO_CASE.banking.utr})
          </span>
        </div>

        {/* Card 3 */}
        <div className="p-4 bg-white rounded-card border border-[#E3E8F0] shadow-tier1 flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B82] font-semibold uppercase tracking-wider">
            Notice Window
          </span>
          <span className="font-mono text-base font-bold text-[#0B1F3A] mt-1">
            {daysLeftOverride} Days Remaining
          </span>
          <span className="font-mono text-[10px] text-[#B45309] mt-1 font-semibold">
            Due {CANONICAL_DEMO_CASE.replyDeadline}
          </span>
        </div>

        {/* Card 4: Live Progress */}
        <div className="p-4 bg-white rounded-card border border-[#E3E8F0] shadow-tier1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#5B6B82] font-semibold uppercase tracking-wider">
              Binder Sufficiency
            </span>
            <span className="font-mono text-xs font-bold text-[#2B4C9B]">
              {completedCount} of {totalCount} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#EFF4FF] h-2 rounded-full overflow-hidden my-2 border border-[#CBD5E1]">
            <div
              className="bg-[#2B4C9B] h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-[#5B6B82]">
            {needsActionCount} action item{needsActionCount > 1 ? 's' : ''} pending CA review
          </span>
        </div>
      </div>

      {/* Main Section: Evidentiary Items List */}
      <div className="bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] overflow-hidden mb-8">
        {/* Control Bar */}
        <div className="p-4 sm:p-5 bg-[#EFF4FF] border-b border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-mono text-xs uppercase tracking-wider text-[#2B4C9B] font-bold">
              Evidentiary Itemization
            </span>
            <h3 className="font-headline text-base font-bold text-[#0B1F3A]">
              Required Exhibits for Formal Written Reply
            </h3>
          </div>

          {/* Filter Tabs with Live Counts */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs border ${
                activeFilter === 'all'
                  ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                  : 'bg-white text-[#44474D] border-[#CBD5E1] hover:bg-[#DCE9FF]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>All Items ({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('needs_action')}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs border ${
                activeFilter === 'needs_action'
                  ? 'bg-[#B45309] text-white border-[#B45309]'
                  : 'bg-white text-[#B45309] border-[#FDE68A] hover:bg-[#FEF3C7]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">priority_high</span>
              <span>Needs Action ({needsActionCount})</span>
            </button>
          </div>
        </div>

        {/* Item List Container */}
        <div className="divide-y divide-[#E3E8F0] flex flex-col">
          {filteredItems.map((item) => {
            const isAmber = item.statusType === 'action_required';

            return (
              <div
                key={item.id}
                className={`p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isAmber ? 'bg-[#FEF3C7]/20 border-l-4 border-l-[#B45309]' : 'hover:bg-[#F6F8FB]'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className={`w-10 h-10 rounded-control flex items-center justify-center shrink-0 mt-0.5 border ${
                      isAmber
                        ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                        : 'bg-[#EFF4FF] text-[#2B4C9B] border-[#CBD5E1]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {item.srNo === 1 && 'receipt'}
                      {item.srNo === 2 && 'account_balance_wallet'}
                      {item.srNo === 3 && 'table_chart'}
                      {item.srNo === 4 && 'warning'}
                      {item.srNo === 5 && 'local_shipping'}
                      {item.srNo === 6 && 'approval_delegation'}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-headline text-sm font-bold text-[#0B1F3A]">
                        {item.srNo}. {item.title}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-chip font-mono text-[10px] font-bold border ${
                          item.statusType === 'uploaded' || item.statusType === 'verified'
                            ? 'bg-[#E6F4EA] text-[#12805C] border-[#A8DAB5]'
                            : item.statusType === 'auto_generated'
                            ? 'bg-[#EFF4FF] text-[#2B4C9B] border-[#CBD5E1]'
                            : item.statusType === 'action_required'
                            ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                            : item.statusType === 'in_progress'
                            ? 'bg-[#DCE9FF] text-[#2B4C9B] border-[#CBD5E1]'
                            : 'bg-[#F1F5F9] text-[#75777E] border-[#CBD5E1]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {item.statusType === 'uploaded' || item.statusType === 'verified'
                            ? 'check_circle'
                            : item.statusType === 'auto_generated'
                            ? 'auto_awesome'
                            : item.statusType === 'action_required'
                            ? 'pending'
                            : item.statusType === 'in_progress'
                            ? 'hourglass_top'
                            : 'lock'}
                        </span>
                        {item.statusBadge}
                      </span>
                    </div>

                    <p className="text-xs text-[#0F172A] mt-1 leading-relaxed">
                      {item.provesText}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[#5B6B82] font-mono text-[11px]">
                      <span className="bg-[#EFF4FF] border border-[#CBD5E1] px-2 py-0.5 rounded text-[#0B1F3A] font-semibold">
                        {item.statutoryRef}
                      </span>
                      <span>•</span>
                      <span>{item.metaInfo}</span>
                    </div>
                  </div>
                </div>

                {/* Actions per item */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  {item.actionType === 'view_replace' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedInvoicesModal(true)}
                        className="px-3 py-1.5 rounded-control bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#0B1F3A] text-xs font-semibold transition-colors border border-[#CBD5E1] shadow-2xs flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        <span>View 24 Invoices</span>
                      </button>
                      <label className="px-3 py-1.5 rounded-control bg-white hover:bg-[#EFF4FF] text-[#5B6B82] text-xs font-semibold transition-colors border border-[#E3E8F0] shadow-2xs flex items-center gap-1.5 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">sync</span>
                        <span>Replace</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={() => handleSimulatedUpload(item.id)}
                        />
                      </label>
                    </>
                  )}

                  {item.actionType === 'verified_match' && (
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-control bg-[#E6F4EA] text-[#12805C] border border-[#A8DAB5] text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      <span>Verified Match</span>
                    </button>
                  )}

                  {item.actionType === 'download_sheet' && (
                    <button
                      type="button"
                      onClick={downloadReconciliationCsv}
                      className="px-4 py-2 rounded-control bg-[#0B1F3A] text-white hover:bg-[#2B4C9B] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                      <span>Download Sheet (CSV)</span>
                    </button>
                  )}

                  {item.actionType === 'upload_supplier' && (
                    <label className="px-4 py-2 rounded-control bg-[#FEF3C7] text-[#B45309] hover:bg-[#FDE68A] text-xs font-bold transition-all shadow-sm border border-[#FDE68A] flex items-center gap-1.5 cursor-pointer">
                      <span className="material-symbols-outlined text-base">upload_file</span>
                      <span>Upload Supplier Certificate</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={() => handleSimulatedUpload(item.id)}
                      />
                    </label>
                  )}

                  {item.actionType === 'upload_eway' && (
                    <label className="px-3.5 py-1.5 rounded-control bg-[#EFF4FF] text-[#0B1F3A] hover:bg-[#DCE9FF] text-xs font-semibold transition-colors border border-[#CBD5E1] shadow-2xs flex items-center gap-1.5 cursor-pointer">
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      <span>Upload Remaining E-Way Bills</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={() => handleSimulatedUpload(item.id)}
                      />
                    </label>
                  )}

                  {item.actionType === 'locked_ca' && (
                    <button
                      type="button"
                      disabled
                      className="px-3.5 py-1.5 rounded-control bg-[#F1F5F9] text-[#75777E] text-xs font-semibold cursor-not-allowed flex items-center gap-1.5 border border-[#CBD5E1]"
                    >
                      <span className="material-symbols-outlined text-sm">lock</span>
                      <span>Unlocks in Step 6</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Smart Guidance Bento Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* WhatsApp 1-Click Automation Callout */}
        <div className="lg:col-span-8 bg-white p-6 rounded-modal shadow-tier1 border border-[#E3E8F0] flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-card bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#B45309] font-mono text-[10px] uppercase font-bold tracking-wider border border-[#FDE68A]">
                  Smart Resolution Aid
                </span>
                <span className="font-mono text-xs text-[#5B6B82]">
                  Prevents ITC Disallowance
                </span>
              </div>
              <h4 className="font-headline text-base font-bold text-[#0B1F3A] mt-1">
                Don&apos;t have the supplier confirmation yet?
              </h4>
              <p className="text-xs text-[#0F172A] mt-1 leading-relaxed">
                Dhaal can generate a legally-phrased request template citing CBIC Circular 183 to prompt{' '}
                <strong className="text-[#0B1F3A]">{CANONICAL_DEMO_CASE.supplier.name}</strong> to provide GSTR-3B tax payment confirmation.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 bg-[#EFF4FF] p-3 rounded-card border border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#0F172A] font-mono text-xs">
              <span className="material-symbols-outlined text-[#2B4C9B] text-sm">content_copy</span>
              <span>Pre-filled with: {CANONICAL_DEMO_CASE.caseId}, Invoice AT/24-25/1102, ₹1.84L Tax</span>
            </div>
            <button
              type="button"
              onClick={handleWhatsAppSupplierPrompt}
              className="px-4 py-2 rounded-control bg-[#12805C] hover:bg-[#0E9FA8] text-white text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span>Send 1-Click WhatsApp Request</span>
            </button>
          </div>
        </div>

        {/* Evidence Health Score Card */}
        <div className="lg:col-span-4 bg-white p-6 rounded-modal shadow-tier1 border border-[#E3E8F0] flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-[#5B6B82] font-semibold">
                Evidence Health Score
              </span>
              <span className="font-headline text-lg font-bold text-[#2B4C9B]">
                {progressPercent} / 100
              </span>
            </div>
            <div className="w-full bg-[#EFF4FF] h-2 rounded-full overflow-hidden my-3 border border-[#CBD5E1]">
              <div
                className="bg-[#2B4C9B] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              High sufficiency for Section 16(2)(a) &amp; (b). Adding vendor proof elevates score, minimizing penalty risks under Section 73(9).
            </p>
          </div>

          <div className="mt-4 p-2.5 bg-[#EFF4FF] rounded-lg border border-[#CBD5E1] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B4C9B] text-base">shield</span>
            <span className="text-xs text-[#0B1F3A] font-semibold">
              Evidentiary defense compiled
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation & Workflow CTA */}
      <div className="bg-white p-5 rounded-modal shadow-tier2 border border-[#E3E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-control bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#0B1F3A] text-xs font-semibold transition-colors border border-[#CBD5E1] flex items-center justify-center gap-1.5 shadow-2xs"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span>Previous: Deadlines &amp; Analysis</span>
        </button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          {needsActionCount > 0 && (
            <span className="text-xs text-[#B45309] font-medium bg-[#FEF3C7] px-2.5 py-1 rounded border border-[#FDE68A]">
              {needsActionCount} item{needsActionCount > 1 ? 's' : ''} still pending; your CA can add them
            </span>
          )}

          <button
            type="button"
            onClick={() => setStep(5)}
            className="w-full sm:w-auto px-6 py-3 rounded-control bg-[#F59E0B] text-[#0F172A] hover:bg-[#F59E0B]/90 font-headline text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Continue to Draft &amp; Verifier</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Invoices List Modal */}
      {selectedInvoicesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-[#EFF4FF] border-b border-[#CBD5E1] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B]">receipt</span>
                <h3 className="font-headline text-base font-bold text-[#0B1F3A]">
                  Reconciled Purchase Invoices (24 Batches)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoicesModal(false)}
                className="p-1 rounded text-[#5B6B82] hover:bg-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs">
              <div className="p-2 mb-3 bg-[#EFF4FF] rounded text-[#2B4C9B] border border-[#CBD5E1]">
                Total Sum of 24 invoices: <strong>₹1,84,250.00</strong> exactly matching Table 4(A)(5) excess discrepancy.
              </div>
              <ul className="divide-y divide-[#E3E8F0]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <li key={i} className="py-2 flex justify-between items-center text-xs">
                    <span>INV #AT/24-25/110{i + 1} ({CANONICAL_DEMO_CASE.supplier.name})</span>
                    <span className="font-bold text-[#0B1F3A]">₹{(8000 + (i * 350)).toLocaleString('en-IN')}.00</span>
                  </li>
                ))}
                <li className="py-2 text-center text-[#5B6B82] text-[11px] italic">
                  ...and 16 more itemized vouchers
                </li>
              </ul>
            </div>
            <div className="p-3 bg-white border-t border-[#E3E8F0] flex justify-end gap-2">
              <button
                type="button"
                onClick={downloadReconciliationCsv}
                className="px-3 py-1.5 rounded-control bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#2B4C9B]"
              >
                Download Complete CSV
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoicesModal(false)}
                className="px-3 py-1.5 rounded-control border border-[#E3E8F0] text-xs font-semibold hover:bg-[#EFF4FF]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
