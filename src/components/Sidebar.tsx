import React from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { getUrgencyInfo } from '../lib/deadline';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isBannerDismissed?: boolean;
  onOpenHelp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isBannerDismissed = false,
  onOpenHelp,
}) => {
  const { step, maxStep, setStep, daysLeftOverride, resetDemo } = useDhaalStore();

  const urgency = getUrgencyInfo(daysLeftOverride);

  const navItems = [
    { stepNum: 1, id: 'upload', label: 'Notice Upload', hash: '#upload', icon: 'upload_file' },
    { stepNum: 2, id: 'review', label: 'Notice Review', hash: '#confirm', icon: 'fact_check' },
    { stepNum: 3, id: 'reconciliation', label: 'Reconciliation', hash: '#explain', icon: 'account_balance' },
    { stepNum: 4, id: 'evidence', label: 'Evidence Checklist', hash: '#evidence', icon: 'checklist' },
    { stepNum: 5, id: 'draft', label: 'Legal Draft & Verifier', hash: '#draft', icon: 'gavel' },
    { stepNum: 6, id: 'brief', label: 'CA-Ready Brief (PDF)', hash: '#brief', icon: 'description' },
  ];

  const handleNavClick = (targetStep: number) => {
    if (targetStep <= maxStep) {
      setStep(targetStep);
      onClose();
    }
  };

  const topOffsetClass = isBannerDismissed ? 'top-14 sm:top-16' : 'top-[80px] sm:top-[88px]';

  const fullSidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 bg-[#073B3A] text-white">
      <div className="flex flex-col gap-4">
        {/* Brand Header inside Sidebar */}
        <div className="pb-3 border-b border-[#134E4A] flex items-center justify-between">
          <BrandLogo variant="dark-bg" size="md" />
        </div>

        {/* Compact Scrutiny Case Card */}
        <div className="p-3 bg-[#0A4A48] rounded-xl border border-[#119B72]/30 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-[#A3B8B5] font-semibold uppercase tracking-wider">
              Scrutiny Case
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#119B72]/20 text-[#E7F4EE] font-mono border border-[#119B72]/40 font-bold">
              ASMT-10
            </span>
          </div>

          <span className="font-mono text-xs text-white font-bold block truncate">
            {CANONICAL_DEMO_CASE.caseId}
          </span>
          <span className="font-sans text-[11px] text-[#A3B8B5] block truncate">
            {CANONICAL_DEMO_CASE.businessName}
          </span>

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-[#134E4A] text-xs">
            <span className="text-[#A3B8B5] font-mono text-[11px]">₹1,84,250</span>
            <div className="flex items-center gap-1 font-semibold text-[#FEF3C7]" title={`Urgency: ${urgency.label}`}>
              <span className="material-symbols-outlined text-xs text-[#F59E0B]">schedule</span>
              <span>{daysLeftOverride}d left</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-[#A3B8B5] uppercase tracking-wider">
          <span>Workflow Steps</span>
          <span className="font-mono text-[10px] text-[#119B72]">
            {step} / 6
          </span>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Workflow Navigation">
          {navItems.map((item) => {
            const isActive = step === item.stepNum;
            const isCompleted = item.stepNum < step;
            const isAccessible = item.stepNum <= maxStep;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.stepNum)}
                disabled={!isAccessible}
                aria-current={isActive ? 'step' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#119B72] ${
                  isActive
                    ? 'bg-[#087F73] text-white font-bold shadow-sm border-l-3 border-[#119B72]'
                    : isCompleted
                    ? 'text-[#E7F4EE] hover:bg-[#0A4A48] hover:text-white'
                    : isAccessible
                    ? 'text-[#A3B8B5] hover:bg-[#0A4A48] hover:text-white'
                    : 'text-[#56726E] cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`material-symbols-outlined text-lg shrink-0 ${
                      isActive
                        ? 'text-white'
                        : isCompleted
                        ? 'text-[#119B72]'
                        : 'text-[#A3B8B5]'
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>

                {isCompleted && (
                  <span className="material-symbols-outlined text-sm text-[#119B72] shrink-0">
                    check_circle
                  </span>
                )}
                {!isAccessible && (
                  <span className="material-symbols-outlined text-sm text-[#56726E] shrink-0">
                    lock
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions: Help & Reset Demo */}
      <div className="border-t border-[#134E4A] pt-3 flex flex-col gap-2">
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            className="w-full flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-[#A3B8B5] hover:text-white hover:bg-[#0A4A48] transition-colors min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#119B72]"
          >
            <span className="material-symbols-outlined text-base text-[#119B72]">help</span>
            <span>Help &amp; FAQs</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset demo to starting state?')) {
              resetDemo();
              onClose();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#134E4A] hover:border-[#C0392B] hover:text-[#FEE2E2] hover:bg-[#C0392B]/20 text-[#A3B8B5] text-xs font-semibold transition-all min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B]"
          title="Reset demo case"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          <span>Reset demo</span>
        </button>
      </div>
    </div>
  );

  const railSidebarContent = (
    <div className="flex flex-col justify-between items-center h-full py-4 px-2 bg-[#073B3A] text-white">
      <div className="flex flex-col items-center gap-4">
        {/* Compact Logo */}
        <BrandLogo variant="compact" size="sm" />

        {/* Collapsed Scrutiny Case Pill */}
        <div
          className="w-10 h-10 rounded-lg bg-[#0A4A48] border border-[#119B72]/40 flex flex-col items-center justify-center text-[#E7F4EE] shadow-2xs cursor-pointer"
          title={`Scrutiny Case: ${CANONICAL_DEMO_CASE.caseId} (Due: ${daysLeftOverride}d)`}
        >
          <span className="font-mono text-[9px] font-bold text-[#119B72]">ASMT</span>
          <span className="font-mono text-[8px] text-white font-bold">10</span>
        </div>

        {/* Rail Nav Icons */}
        <nav className="flex flex-col gap-2" aria-label="Sidebar compact rail">
          {navItems.map((item) => {
            const isActive = step === item.stepNum;
            const isAccessible = item.stepNum <= maxStep;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.stepNum)}
                disabled={!isAccessible}
                title={`${item.label} (Step ${item.stepNum})`}
                aria-label={item.label}
                aria-current={isActive ? 'step' : undefined}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#119B72] ${
                  isActive
                    ? 'bg-[#087F73] text-white shadow-xs'
                    : isAccessible
                    ? 'text-[#A3B8B5] hover:text-white hover:bg-[#0A4A48]'
                    : 'text-[#56726E] opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Rail Bottom Actions */}
      <div className="flex flex-col items-center gap-2">
        {onOpenHelp && (
          <button
            type="button"
            onClick={onOpenHelp}
            title="Help & FAQs"
            aria-label="Help & FAQs"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#A3B8B5] hover:text-white hover:bg-[#0A4A48] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#119B72]"
          >
            <span className="material-symbols-outlined text-lg">help</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset demo to starting state?')) {
              resetDemo();
            }
          }}
          title="Reset demo"
          aria-label="Reset demo"
          className="w-10 h-10 rounded-lg flex items-center justify-center text-[#A3B8B5] hover:text-[#FEE2E2] hover:bg-[#C0392B]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B]"
        >
          <span className="material-symbols-outlined text-lg">restart_alt</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1280px expanded: 260px; 1024px–1279px rail: 64px) */}
      <aside
        className={`hidden lg:block fixed left-0 ${topOffsetClass} bottom-0 bg-[#073B3A] border-r border-[#134E4A] z-40 transition-all duration-200 lg:w-16 xl:w-[260px]`}
      >
        <div className="hidden xl:block h-full">{fullSidebarContent}</div>
        <div className="block xl:hidden h-full">{railSidebarContent}</div>
      </aside>

      {/* Mobile Off-canvas Drawer (< 1024px) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#073B3A]/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-[#073B3A] h-full shadow-2xl flex flex-col pt-14 sm:pt-16 z-50 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-lg text-[#A3B8B5] hover:text-white hover:bg-[#0A4A48] min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#119B72]"
              aria-label="Close navigation drawer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            {fullSidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
