import React, { useState } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { formatINR } from '../lib/format';
import { downloadReconciliationCsv } from '../data/reconciliationData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

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

  const getItemBadgeVariant = (statusType: string): 'neutral' | 'brand' | 'success' | 'warning' | 'danger' => {
    switch (statusType) {
      case 'uploaded':
      case 'verified':
        return 'success';
      case 'auto_generated':
      case 'in_progress':
        return 'brand';
      case 'action_required':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E2E8F0]">
        <div>
          <h1 className="font-headline text-xl sm:text-2xl font-bold text-[#0B1F3A]">
            Evidence Preparation: Statutory Binder
          </h1>
          <p className="text-xs sm:text-sm text-[#5B6B82] mt-0.5">
            Audit Trail &amp; Statutory Evidentiary Binder • Mandate: CGST Sec 16(2) Clauses (a) to (d)
          </p>
        </div>
        <Badge variant="brand" size="md">
          CGST Sec 16(2) Compliant
        </Badge>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1 */}
        <Card variant="default" padding="sm" className="flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B82] font-semibold uppercase tracking-wider">
            Amount Questioned
          </span>
          <span className="font-mono text-xl font-bold text-[#0B1F3A] mt-1">
            {formatINR(amount, true)}
          </span>
          <span className="text-[10px] text-[#C0392B] mt-1 font-semibold font-mono">
            Table 4(A)(5) Variance
          </span>
        </Card>

        {/* Card 2 */}
        <Card variant="default" padding="sm" className="flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B82] font-semibold uppercase tracking-wider">
            Bank Audit Matching
          </span>
          <span className="font-mono text-sm font-bold text-[#12805C] mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">verified</span>
            100% Cleared
          </span>
          <span className="text-[10px] text-[#5B6B82] mt-1 truncate">
            {CANONICAL_DEMO_CASE.banking.bankName} (UTR: {CANONICAL_DEMO_CASE.banking.utr})
          </span>
        </Card>

        {/* Card 3 */}
        <Card variant="default" padding="sm" className="flex flex-col justify-between">
          <span className="text-[11px] text-[#5B6B82] font-semibold uppercase tracking-wider">
            Notice Window
          </span>
          <span className="font-mono text-base font-bold text-[#0B1F3A] mt-1">
            {daysLeftOverride} Days Remaining
          </span>
          <span className="text-[10px] text-[#B45309] mt-1 font-semibold font-mono">
            Due {CANONICAL_DEMO_CASE.replyDeadline}
          </span>
        </Card>

        {/* Card 4: Live Progress */}
        <Card variant="default" padding="sm" className="flex flex-col justify-between">
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
            />
          </div>
          <span className="text-[10px] text-[#5B6B82]">
            {needsActionCount} action item{needsActionCount > 1 ? 's' : ''} pending review
          </span>
        </Card>
      </div>

      {/* Main Section: Evidentiary Items List */}
      <Card variant="default" padding="none" className="overflow-hidden mb-8">
        {/* Control Bar */}
        <div className="p-4 sm:p-5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-[#2B4C9B] font-bold">
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
              className={`px-3 py-1.5 min-h-[44px] sm:min-h-[36px] rounded-control text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs border ${
                activeFilter === 'all'
                  ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                  : 'bg-white text-[#44474D] border-[#CBD5E1] hover:bg-[#EFF4FF]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              <span>All Items ({totalCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('needs_action')}
              className={`px-3 py-1.5 min-h-[44px] sm:min-h-[36px] rounded-control text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs border ${
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
        <div className="divide-y divide-[#E2E8F0] flex flex-col">
          {filteredItems.map((item) => {
            const isAmber = item.statusType === 'action_required';

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isAmber ? 'bg-[#FFFBEB]/40 border-l-4 border-l-[#B45309]' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                <div className="flex items-start gap-3.5 sm:gap-4 flex-1">
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
                      <Badge variant={getItemBadgeVariant(item.statusType)} size="sm">
                        {item.statusBadge}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#0F172A] mt-1 leading-relaxed">
                      {item.provesText}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[#5B6B82] text-[11px]">
                      <span className="bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded text-[#0B1F3A] font-medium">
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
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        icon="visibility"
                        onClick={() => setSelectedInvoicesModal(true)}
                      >
                        View 24 Invoices
                      </Button>
                      <label className="inline-flex items-center justify-center font-semibold rounded-control transition-all duration-150 min-h-[38px] text-xs px-3 py-1.5 gap-1.5 bg-white hover:bg-[#EFF4FF] text-[#5B6B82] border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-2xs cursor-pointer">
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
                    <Badge variant="success" size="md">
                      Verified Match
                    </Badge>
                  )}

                  {item.actionType === 'download_sheet' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      icon="download"
                      onClick={downloadReconciliationCsv}
                    >
                      Download Sheet (CSV)
                    </Button>
                  )}

                  {item.actionType === 'upload_supplier' && (
                    <label className="inline-flex items-center justify-center font-semibold rounded-control transition-all duration-150 min-h-[38px] text-xs px-3.5 py-1.5 gap-1.5 bg-[#FEF3C7] text-[#B45309] hover:bg-[#FDE68A] border border-[#FDE68A] shadow-xs cursor-pointer">
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
                    <label className="inline-flex items-center justify-center font-semibold rounded-control transition-all duration-150 min-h-[38px] text-xs px-3 py-1.5 gap-1.5 bg-[#EFF4FF] text-[#0B1F3A] hover:bg-[#DCE9FF] border border-[#CBD5E1] shadow-2xs cursor-pointer">
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
                    <Badge variant="neutral" size="md">
                      Unlocks in Step 6
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Smart Guidance Bento Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* WhatsApp 1-Click Automation Callout */}
        <Card variant="default" padding="lg" className="lg:col-span-8 flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-control bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">chat</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge variant="warning" size="sm">
                  Smart Resolution Aid
                </Badge>
                <span className="text-xs text-[#5B6B82]">
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

          <div className="mt-4 pt-3 bg-[#F8FAFC] p-3 rounded-control border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[#0F172A] text-xs">
              <span className="material-symbols-outlined text-[#2B4C9B] text-sm">content_copy</span>
              <span>Pre-filled: {CANONICAL_DEMO_CASE.caseId}, Invoice AT/24-25/1102, ₹1.84L Tax</span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon="send"
              onClick={handleWhatsAppSupplierPrompt}
              className="bg-[#12805C] hover:bg-[#0E9FA8] text-white shrink-0"
            >
              Send 1-Click WhatsApp Request
            </Button>
          </div>
        </Card>

        {/* Evidence Health Score Card */}
        <Card variant="default" padding="lg" className="lg:col-span-4 flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#5B6B82] font-semibold">
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
              />
            </div>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              High sufficiency for Section 16(2)(a) &amp; (b). Adding vendor proof elevates score, minimizing penalty risks under Section 73(9).
            </p>
          </div>

          <div className="mt-4 p-2.5 bg-[#F8FAFC] rounded-control border border-[#E2E8F0] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B4C9B] text-base">shield</span>
            <span className="text-xs text-[#0B1F3A] font-semibold">
              Evidentiary defense compiled
            </span>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation & Workflow CTA */}
      <Card variant="default" padding="md" className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <Button
          type="button"
          variant="secondary"
          icon="arrow_back"
          onClick={() => setStep(3)}
          className="w-full sm:w-auto"
        >
          Previous: Deadlines &amp; Analysis
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto justify-end">
          {needsActionCount > 0 && (
            <span className="text-xs text-[#B45309] font-medium bg-[#FEF3C7] px-2.5 py-1 rounded-control border border-[#FDE68A]">
              {needsActionCount} item{needsActionCount > 1 ? 's' : ''} still pending; CA can add them
            </span>
          )}

          <Button
            type="button"
            variant="primary"
            icon="arrow_forward"
            iconPosition="right"
            onClick={() => setStep(5)}
            className="w-full sm:w-auto bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706]"
          >
            Continue to Draft &amp; Verifier
          </Button>
        </div>
      </Card>

      {/* Invoices List Modal */}
      {selectedInvoicesModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B]">receipt</span>
                <h3 className="font-headline text-base font-bold text-[#0B1F3A]">
                  Reconciled Purchase Invoices (24 Batches)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoicesModal(false)}
                className="p-1.5 rounded-control text-[#5B6B82] hover:bg-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B]"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 font-mono text-xs">
              <div className="p-2.5 mb-3 bg-[#EFF4FF] rounded-control text-[#2B4C9B] border border-[#CBD5E1]">
                Total Sum of 24 invoices: <strong>₹1,84,250.00</strong> exactly matching Table 4(A)(5) excess discrepancy.
              </div>
              <ul className="divide-y divide-[#E2E8F0]">
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
            <div className="p-3 bg-white border-t border-[#E2E8F0] flex justify-end gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={downloadReconciliationCsv}
              >
                Download Complete CSV
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedInvoicesModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
