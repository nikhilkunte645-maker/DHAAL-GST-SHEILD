import React, { useState } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { getUrgencyInfo } from '../lib/deadline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
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

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-4 bg-white">
      <div className="flex flex-col gap-4">
        {/* Scrutiny Case Card */}
        <div className="p-3 bg-[#FEF3C7]/40 rounded-xl border-l-4 border-[#B45309] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-[#B45309] font-bold uppercase tracking-wider">
              Scrutiny Case
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-[#B45309] font-mono border border-[#FDE68A]">
              ASMT-10
            </span>
          </div>
          <span className="font-mono text-xs text-[#0B1F3A] font-bold block mt-1">
            {CANONICAL_DEMO_CASE.caseId}
          </span>
          <span className="font-mono text-[11px] text-[#5B6B82] block">
            Ref: {CANONICAL_DEMO_CASE.noticeRef}
          </span>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#FDE68A]/60">
            <span className="material-symbols-outlined text-sm text-[#C0392B]">schedule</span>
            <span className={`text-xs font-semibold ${urgency.textColor}`}>
              Response Due: {daysLeftOverride} Days
            </span>
          </div>
        </div>

        {/* Navigation Items (Single Case Demo) */}
        <nav className="flex flex-col gap-1" aria-label="Sidebar navigation">
          {navItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={() => showTooltip(item.label)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-[#44474D] hover:bg-[#EFF4FF] hover:text-[#0B1C30] transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg text-[#5B6B82] group-hover:text-[#2B4C9B]">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] text-[#75777E] opacity-70 group-hover:opacity-100">
                  Demo
                </span>
              </button>
              {tooltip === item.label && (
                <div className="absolute left-1/2 -bottom-7 -translate-x-1/2 z-50 bg-[#0B1F3A] text-white text-[10px] font-mono py-0.5 px-2 rounded shadow-md whitespace-nowrap animate-in fade-in duration-150">
                  Demo: single case mode
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Info Card & Reset Demo */}
      <div className="border-t border-[#E3E8F0] pt-4 flex flex-col gap-3">
        <div className="p-3 bg-[#EFF4FF] rounded-xl border border-[#CBD5E1]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0E9FA8] text-base">verified_user</span>
            <span className="text-xs text-[#0B1F3A] font-bold">Rules reference</span>
          </div>
          <p className="text-[11px] text-[#44474D] mt-1 leading-snug">
            CGST Sec 61 / Rule 99. Pre-adjudication scrutiny reply via Form ASMT-11.
          </p>
        </div>

        {/* Reset Demo Button */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset demo to starting state?')) {
              resetDemo();
              onClose();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-[#E3E8F0] hover:border-[#C0392B] hover:text-[#C0392B] text-[#5B6B82] text-xs font-semibold transition-all hover:bg-white shadow-2xs"
        >
          <span className="material-symbols-outlined text-sm">restart_alt</span>
          <span>Reset demo</span>
        </button>

        <div className="text-center">
          <span className="font-mono text-[10px] text-[#75777E]">
            DHAAL v1.0 • Offline Ready
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-[88px] bottom-0 w-64 bg-white border-r border-[#E3E8F0] z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Off-canvas Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0B1F3A]/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col pt-[88px] z-50 animate-in slide-in-from-left duration-200">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5B6B82] hover:bg-[#EFF4FF]"
              aria-label="Close drawer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
