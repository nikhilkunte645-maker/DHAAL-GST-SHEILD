import React, { useState } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { getUrgencyInfo } from '../lib/deadline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isBannerDismissed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isBannerDismissed = false }) => {
  const { daysLeftOverride, resetDemo } = useDhaalStore();
  const [tooltip, setTooltip] = useState<string | null>(null);

  const urgency = getUrgencyInfo(daysLeftOverride);

  const showTooltip = (itemName: string) => {
    setTooltip(itemName);
    setTimeout(() => {
      setTooltip(null);
    }, 2200);
  };

  const navItems = [
    { id: 'active-cases', label: 'Active Cases', icon: 'folder_open' },
    { id: 'notices-inbox', label: 'Notices Inbox', icon: 'inbox' },
    { id: 'reconciliation-ledger', label: 'Reconciliation', icon: 'balance' },
    { id: 'ca-delegation', label: 'CA Collaboration', icon: 'assignment_ind' },
  ];

  const topOffsetClass = isBannerDismissed ? 'top-14 sm:top-16' : 'top-[80px] sm:top-[88px]';

  const fullSidebarContent = (
    <div className="flex flex-col justify-between h-full p-3.5 bg-white">
      <div className="flex flex-col gap-3.5">
        {/* Compact Scrutiny Case Card */}
        <div className="p-3 bg-[#FEF3C7]/40 rounded-card border-l-4 border-[#B45309] shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#B45309] font-bold uppercase tracking-wider">
              Scrutiny Case
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-[#B45309] font-mono border border-[#FDE68A] font-bold">
              ASMT-10
            </span>
          </div>

          <span className="font-mono text-xs text-[#0B1F3A] font-bold block mt-1 truncate">
            {CANONICAL_DEMO_CASE.caseId}
          </span>
          <span className="font-mono text-[11px] text-[#5B6B82] block truncate">
            Ref: {CANONICAL_DEMO_CASE.noticeRef}
          </span>

          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#FDE68A]/60">
            <span className="material-symbols-outlined text-sm text-[#C0392B]">schedule</span>
            <span className={`text-xs font-semibold ${urgency.textColor}`}>
              Due: {daysLeftOverride} Days
            </span>
          </div>
        </div>

        {/* Navigation Items (Single "Demo mode" indicator, no per-item clutter) */}
        <div className="flex items-center justify-between px-2 pt-1 text-[10px] font-semibold text-[#5B6B82] uppercase tracking-wider">
          <span>Navigation</span>
          <span className="text-[#94A3B8] font-normal lowercase">(demo case)</span>
        </div>

        <nav className="flex flex-col gap-1" aria-label="Sidebar navigation">
          {navItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() => showTooltip(item.label)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-control text-xs font-semibold text-[#44474D] hover:bg-[#F6F8FB] hover:text-[#0B1F3A] transition-colors group text-left min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-[#5B6B82] group-hover:text-[#2B4C9B] transition-colors">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
              </button>
              {tooltip === item.label && (
                <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 z-50 bg-[#0B1F3A] text-white text-[10px] font-mono py-0.5 px-2 rounded shadow-md whitespace-nowrap animate-in fade-in duration-150">
                  Single case mode
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Clean Footer Action: Reset Demo */}
      <div className="border-t border-[#E3E8F0] pt-3 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset demo to starting state?')) {
              resetDemo();
              onClose();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-control border border-[#E3E8F0] hover:border-[#C0392B] hover:text-[#C0392B] text-[#5B6B82] text-xs font-semibold transition-all hover:bg-white shadow-2xs min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B]"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          <span>Reset demo</span>
        </button>
      </div>
    </div>
  );

  const railSidebarContent = (
    <div className="flex flex-col justify-between items-center h-full py-4 px-2 bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Collapsed Scrutiny Case Pill */}
        <div
          className="w-10 h-10 rounded-control bg-[#FEF3C7] border border-[#FDE68A] flex flex-col items-center justify-center text-[#B45309] shadow-2xs"
          title={`Scrutiny Case: ${CANONICAL_DEMO_CASE.caseId} (Due: ${daysLeftOverride}d)`}
        >
          <span className="font-mono text-[9px] font-bold">ASMT</span>
          <span className="font-mono text-[8px]">10</span>
        </div>

        {/* Rail Nav Icons */}
        <nav className="flex flex-col gap-2" aria-label="Sidebar compact rail">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => showTooltip(item.label)}
              title={`${item.label} (Demo single case)`}
              aria-label={item.label}
              className="w-10 h-10 rounded-control flex items-center justify-center text-[#5B6B82] hover:text-[#0B1F3A] hover:bg-[#F6F8FB] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B]"
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Rail Reset Demo Button */}
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Reset demo to starting state?')) {
            resetDemo();
          }
        }}
        title="Reset demo"
        aria-label="Reset demo"
        className="w-10 h-10 rounded-control flex items-center justify-center text-[#5B6B82] hover:text-[#C0392B] hover:bg-[#FEE2E2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0392B]"
      >
        <span className="material-symbols-outlined text-lg">restart_alt</span>
      </button>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1280px expanded: 240px; 1024px–1279px rail: 64px) */}
      <aside
        className={`hidden lg:block fixed left-0 ${topOffsetClass} bottom-0 bg-white border-r border-[#E3E8F0] z-40 transition-all duration-200 lg:w-16 xl:w-[240px]`}
      >
        <div className="hidden xl:block h-full">{fullSidebarContent}</div>
        <div className="block xl:hidden h-full">{railSidebarContent}</div>
      </aside>

      {/* Mobile Off-canvas Drawer (< 1024px) */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-xl flex flex-col pt-14 sm:pt-16 z-50 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-control text-[#5B6B82] hover:bg-[#EFF4FF] min-h-[44px] min-w-[44px] flex items-center justify-center"
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
