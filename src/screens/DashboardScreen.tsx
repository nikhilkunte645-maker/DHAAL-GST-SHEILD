import React from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { formatINR } from '../lib/format';
import { getUrgencyInfo } from '../lib/deadline';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const DashboardScreen: React.FC = () => {
  const { setStep, confirmedAmount, daysLeftOverride, checklist } = useDhaalStore();

  const amount = confirmedAmount || CANONICAL_DEMO_CASE.rows[1].difference;
  const urgency = getUrgencyInfo(daysLeftOverride);
  const verifiedCount = checklist.filter(
    (c) => c.statusType === 'verified' || c.statusType === 'uploaded' || c.statusType === 'auto_generated'
  ).length;

  return (
    <div className="flex flex-col w-full pb-16">
      {/* 1. WELCOME HERO SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#E4E9E5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
              SAMPLE CASE / WORKSPACE DEMO
            </span>
            <span className="text-xs font-semibold text-[#687674]">
              Guided Scrutiny Notice Environment • Form GST ASMT-10
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-bold text-[#073B3A] tracking-tight mt-1.5">
            GST Compliance &amp; Notice Intelligence
          </h1>
          <p className="text-sm text-[#687674] mt-1 max-w-2xl">
            Understand Form ASMT-10 scrutiny notices, identify arithmetic mismatches, organise supporting evidence, and prepare review-ready responses without tax jargon.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto shrink-0">
          <Button
            type="button"
            variant="primary"
            size="md"
            icon="upload_file"
            onClick={() => setStep(1)}
            className="shadow-sm font-headline"
            aria-label="Start New GST Notice Analysis"
          >
            Start New Notice Analysis
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            icon="description"
            onClick={() => setStep(6)}
            aria-label="View CA Brief for active case"
          >
            View CA Brief
          </Button>
        </div>
      </div>

      {/* 2. THREE CORE USER QUESTIONS GUIDANCE BANNER */}
      <div className="p-4 rounded-xl bg-white border border-[#E4E9E5] shadow-xs mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E7F4EE] text-[#087F73] flex items-center justify-center shrink-0 font-bold text-sm">
            1
          </div>
          <div>
            <span className="text-xs font-bold text-[#073B3A] block">Where am I?</span>
            <p className="text-xs text-[#687674] mt-0.5">
              In your active GST Scrutiny Defense Center for Form ASMT-10.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E7F4EE] text-[#087F73] flex items-center justify-center shrink-0 font-bold text-sm">
            2
          </div>
          <div>
            <span className="text-xs font-bold text-[#073B3A] block">What should I do here?</span>
            <p className="text-xs text-[#687674] mt-0.5">
              Review extracted discrepancies, reconcile vendor invoices, and collect evidence.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E7F4EE] text-[#087F73] flex items-center justify-center shrink-0 font-bold text-sm">
            3
          </div>
          <div>
            <span className="text-xs font-bold text-[#073B3A] block">What happens when I click?</span>
            <p className="text-xs text-[#687674] mt-0.5">
              Every step prepares a factual dossier for Chartered Accountant sign-off. Nothing is filed directly.
            </p>
          </div>
        </div>
      </div>

      {/* 3. CASE SUMMARY METRICS (Mercury / Ramp Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#687674] uppercase tracking-wider">
                Scrutiny Workqueue
              </span>
              <span className="material-symbols-outlined text-lg text-[#087F73]">folder_open</span>
            </div>
            <div className="font-headline text-2xl font-bold text-[#073B3A]">
              1 Sample Notice
            </div>
            <span className="text-[11px] text-[#D97706] font-semibold mt-1 block">
              Demonstration Mode (ASMT-10)
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#E4E9E5] flex items-center justify-between text-xs">
            <span className="text-[#687674]">Sample Assessee</span>
            <span className="font-semibold text-[#152B2A]">Sharma Garments</span>
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#687674] uppercase tracking-wider">
                Questioned Tax Gap
              </span>
              <span className="material-symbols-outlined text-lg text-[#C0392B]">account_balance_wallet</span>
            </div>
            <div className="font-mono text-2xl font-bold text-[#C0392B]">
              {formatINR(amount, true)}
            </div>
            <span className="text-[11px] text-[#687674] mt-1 block">
              Table 4(A)(5) GSTR-3B vs 2B (Demo)
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#E4E9E5] flex items-center justify-between text-xs">
            <span className="text-[#687674]">Audit Status</span>
            <span className="font-bold text-[#119B72]">100% Itemized (24 Inv)</span>
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#687674] uppercase tracking-wider">
                Statutory Defense Clock
              </span>
              <span className={`material-symbols-outlined text-lg ${urgency.textColor}`}>
                {urgency.isExpired ? 'warning' : 'schedule'}
              </span>
            </div>
            <div className="font-headline text-2xl font-bold text-[#073B3A]">
              {urgency.isExpired ? 'Window Elapsed' : urgency.isDueToday ? 'Due Today' : `${daysLeftOverride} Days Left`}
            </div>
            <span className="text-[11px] text-[#687674] mt-1 block">
              {urgency.isExpired ? 'Statutory deadline passed' : `Deadline: ${CANONICAL_DEMO_CASE.replyDeadline}`}
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#E4E9E5] flex items-center justify-between text-xs">
            <span className="text-[#687674]">Urgency Status</span>
            <span className={`font-semibold ${urgency.textColor}`}>{urgency.label}</span>
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#687674] uppercase tracking-wider">
                Evidence Readiness
              </span>
              <span className="material-symbols-outlined text-lg text-[#119B72]">task_alt</span>
            </div>
            <div className="font-headline text-2xl font-bold text-[#119B72]">
              {Math.round((verifiedCount / checklist.length) * 100)}% Ready
            </div>
            <span className="text-[11px] text-[#687674] mt-1 block">
              {verifiedCount} of {checklist.length} Statutory Items Verified
            </span>
          </div>
          <div className="mt-3 pt-2 border-t border-[#E4E9E5] flex items-center justify-between text-xs">
            <span className="text-[#687674]">Next Action</span>
            <span className="font-semibold text-[#D97706]">Vendor Declaration</span>
          </div>
        </Card>
      </div>

      {/* 4. ACTIVE CASES REQUIRING ATTENTION */}
      <Card variant="default" padding="none" className="mb-8 overflow-hidden">
        <div className="p-4 sm:p-5 bg-white border-b border-[#E4E9E5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#087F73]">inbox</span>
            <h2 className="font-headline text-base sm:text-lg font-bold text-[#073B3A]">
              GST Scrutiny Workqueue
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]">
              DEMO DATA / SAMPLE NOTICE
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="upload_file"
            onClick={() => setStep(1)}
            title="Upload your own ASMT-10 notice PDF"
          >
            Upload Real Notice
          </Button>
        </div>

        {/* Informational Banner */}
        <div className="p-3 bg-[#FAF9F5] border-b border-[#E4E9E5] text-xs text-[#687674] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-[#087F73] shrink-0">info</span>
            <span>The entry below is a demonstration case loaded to preview DHAAL&apos;s 6-step statutory audit flow.</span>
          </div>
          <button
            onClick={() => setStep(1)}
            className="text-[11px] font-bold text-[#087F73] hover:underline whitespace-nowrap self-start sm:self-auto"
          >
            Upload your own notice →
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F5] text-[#687674] border-b border-[#E4E9E5] font-semibold">
                <th className="py-3 px-4">Case Reference</th>
                <th className="py-3 px-4">Taxpayer / Business</th>
                <th className="py-3 px-4">Notice Type</th>
                <th className="py-3 px-4">Tax Period</th>
                <th className="py-3 px-4 text-right">Questioned ITC</th>
                <th className="py-3 px-4">Response Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E9E5] bg-white">
              <tr className="hover:bg-[#FAF9F5] transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-[#073B3A]">
                  {CANONICAL_DEMO_CASE.caseId}
                </td>
                <td className="py-3.5 px-4 font-medium text-[#152B2A]">
                  <div className="flex items-center gap-1.5">
                    <span>{CANONICAL_DEMO_CASE.businessName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#FAF9F5] text-[#D97706] border border-[#E4E9E5]">
                      SAMPLE
                    </span>
                  </div>
                  <span className="block font-mono text-[11px] text-[#687674]">
                    {CANONICAL_DEMO_CASE.gstin}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-[#E7F4EE] text-[#087F73] px-2 py-0.5 rounded border border-[#119B72]/30">
                    Form ASMT-10
                  </span>
                </td>
                <td className="py-3.5 px-4 text-[#687674] whitespace-nowrap">
                  {CANONICAL_DEMO_CASE.taxPeriod}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-[#C0392B]">
                  {formatINR(amount, true)}
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-semibold text-[#152B2A]">
                    {CANONICAL_DEMO_CASE.replyDeadline}
                  </span>
                  <span className={`block text-[11px] font-semibold ${urgency.textColor}`}>
                    {urgency.isExpired ? 'Expired' : urgency.isDueToday ? 'Due Today' : `${daysLeftOverride} days left`}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <Badge variant="warning" size="sm">
                    Evidence Pending
                  </Badge>
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon="arrow_forward"
                    iconPosition="right"
                    onClick={() => setStep(3)}
                    className="bg-[#073B3A] hover:bg-[#087F73]"
                  >
                    Explore Flow
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* 5. CASE PROGRESS TIMELINE */}
      <Card variant="default" padding="lg" className="mb-8">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E4E9E5]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#087F73]">linear_scale</span>
            <h2 className="font-headline text-base font-bold text-[#073B3A]">
              Statutory Defense Workflow Stage
            </h2>
          </div>
          <span className="text-xs text-[#D97706] font-semibold">
            Demonstration Timeline
          </span>
        </div>

        {/* Linear Stepper Representation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { num: 1, title: 'Notice Upload', status: 'Completed', date: '14-May', icon: 'upload_file', done: true },
            { num: 2, title: 'Notice Review', status: 'Confirmed', date: '26-May', icon: 'fact_check', done: true },
            { num: 3, title: 'Reconciliation', status: 'Reconciled', date: '24 Invoices', icon: 'account_balance', done: true },
            { num: 4, title: 'Evidence Matrix', status: 'In Progress', date: '4/6 ready', icon: 'checklist', current: true },
            { num: 5, title: 'Legal Draft', status: 'Pending Review', date: 'Target 08-Jun', icon: 'gavel', pending: true },
            { num: 6, title: 'CA-Ready Brief', status: 'Locked', date: 'Final 13-Jun', icon: 'description', pending: true },
          ].map((stage) => (
            <div
              key={stage.num}
              onClick={() => setStep(stage.num)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                stage.current
                  ? 'bg-[#E7F4EE] border-[#119B72] shadow-xs'
                  : stage.done
                  ? 'bg-white border-[#E4E9E5] hover:border-[#119B72]/40'
                  : 'bg-[#FAF9F5] border-[#E4E9E5] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] font-bold text-[#687674]">
                    STEP {stage.num}
                  </span>
                  {stage.done ? (
                    <span className="material-symbols-outlined text-sm text-[#119B72]">check_circle</span>
                  ) : stage.current ? (
                    <span className="material-symbols-outlined text-sm text-[#087F73] animate-pulse">pending</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm text-[#687674]">lock</span>
                  )}
                </div>
                <span className="font-headline text-xs font-bold text-[#073B3A] block truncate">
                  {stage.title}
                </span>
                <span className="text-[11px] text-[#687674] block mt-0.5">
                  {stage.status}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#687674] mt-2 block pt-1 border-t border-[#E4E9E5]">
                {stage.date}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. PLAIN-LANGUAGE KNOWLEDGE BASE FOR NON-TECHNICAL USERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-xl text-[#087F73]">info</span>
              <h3 className="font-headline text-sm font-bold text-[#073B3A]">
                What is Form ASMT-10?
              </h3>
            </div>
            <p className="text-xs text-[#687674] leading-relaxed">
              Form ASMT-10 is a scrutiny notice under Section 61. It is <strong>NOT a tax demand order</strong>. The tax department has simply noticed an arithmetic variance between your GSTR-3B return and supplier GSTR-2B returns and is inviting your explanation.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#E4E9E5] text-[11px] text-[#087F73] font-semibold">
            Rule 99(1) CGST Rules, 2017
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-xl text-[#119B72]">verified_user</span>
              <h3 className="font-headline text-sm font-bold text-[#073B3A]">
                Period-Aware Statutory Defense
              </h3>
            </div>
            <p className="text-xs text-[#687674] leading-relaxed">
              DHAAL applies period-aware legal rules: Circular 183/15/2022-GST for FY 2017-18 &amp; 2018-19, and Section 16(2)(aa) for FY 2024-25 onwards with vendor subsequent reconciliation and banking proof.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#E4E9E5] text-[11px] text-[#119B72] font-semibold">
            Section 16(2) Legal Defense
          </div>
        </Card>

        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-xl text-[#073B3A]">lock</span>
              <h3 className="font-headline text-sm font-bold text-[#073B3A]">
                In-Memory Ephemeral Processing
              </h3>
            </div>
            <p className="text-xs text-[#687674] leading-relaxed">
              DHAAL processes uploaded notice PDFs in ephemeral memory streams. Files are not stored on persistent server disks or third-party databases, and notice data is cleared after your browser session ends.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#E4E9E5] text-[11px] text-[#073B3A] font-semibold">
            Client-Side &amp; RAM Architecture
          </div>
        </Card>
      </div>
    </div>
  );
};
