import React, { useState, useRef, useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { I18N, Language } from '../data/i18n';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenHelp?: () => void;
  isBannerDismissed?: boolean;
  onDismissBanner?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenHelp,
  isBannerDismissed = false,
  onDismissBanner,
}) => {
  const { step, maxStep, setStep, language, setLanguage } = useDhaalStore();
  const t = I18N[language];

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const stepsList = [
    { num: 1, label: t.stepper.step1, fullTitle: t.stepperFull.step1, hash: '#upload' },
    { num: 2, label: t.stepper.step2, fullTitle: t.stepperFull.step2, hash: '#confirm' },
    { num: 3, label: t.stepper.step3, fullTitle: t.stepperFull.step3, hash: '#explain' },
    { num: 4, label: t.stepper.step4, fullTitle: t.stepperFull.step4, hash: '#evidence' },
    { num: 5, label: t.stepper.step5, fullTitle: t.stepperFull.step5, hash: '#draft' },
    { num: 6, label: t.stepper.step6, fullTitle: t.stepperFull.step6, hash: '#brief' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-[#E3E8F0]">
      {/* A.2: Consolidated Low-Contrast Dismissible Legal & Sandbox Strip (max-height: 32px) */}
      {!isBannerDismissed && (
        <div className="bg-[#0B1F3A] text-white px-3 sm:px-4 py-1 flex items-center justify-between gap-2 text-[11px] leading-tight transition-all no-print">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap mx-auto">
            <span className="material-symbols-outlined text-[13px] text-[#F59E0B] shrink-0">
              shield
            </span>
            <span className="font-sans text-[#E2E8F0] tracking-wide truncate">
              Statutory drafting aid for professional review. Not legal advice.
            </span>
            <span className="inline-flex items-center gap-1 bg-[#1E293B] text-[#FDE68A] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#334155] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
              Sandbox Mode • Synthetic Data
            </span>
          </div>

          {onDismissBanner && (
            <button
              type="button"
              onClick={onDismissBanner}
              className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Dismiss banner"
              aria-label="Dismiss statutory disclaimer banner"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      )}

      {/* A.1: Compact Single Header Bar (56–64px height) */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 max-w-[1200px] mx-auto">
        {/* Left: Mobile Drawer Trigger + Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            className="lg:hidden p-2 rounded-control text-[#0F172A] hover:bg-[#F6F8FB] focus:outline-none focus:ring-2 focus:ring-[#2B4C9B] min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <a
            href="#upload"
            onClick={(e) => {
              e.preventDefault();
              setStep(1);
            }}
            className="flex items-center gap-2.5 group select-none"
            aria-label="Dhaal home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center shadow-xs group-hover:bg-[#2B4C9B] transition-colors shrink-0">
              <span className="material-symbols-outlined text-lg sm:text-xl text-[#F59E0B]">
                shield
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-base sm:text-lg font-bold text-[#0B1F3A] tracking-tight leading-none">
                Dhaal <span className="font-devanagari text-xs sm:text-sm font-normal text-[#5B6B82]">(ढाल)</span>
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-[#5B6B82] tracking-wider uppercase leading-tight mt-0.5">
                Notice Shield
              </span>
            </div>
          </a>
        </div>

        {/* Center: Stepper (Single-line labels, distinct states, responsive adaptation) */}
        {/* Desktop: 6-Step Stepper (xl+) */}
        <nav
          aria-label="Compliance workflow steps"
          className="hidden xl:flex items-center gap-1 bg-[#F6F8FB] p-1 rounded-control border border-[#E3E8F0]"
        >
          {stepsList.map((s) => {
            const isCurrent = step === s.num;
            const isCompleted = step > s.num;
            const isAccessible = s.num <= maxStep;

            return (
              <button
                key={s.num}
                type="button"
                disabled={!isAccessible}
                onClick={() => setStep(s.num)}
                title={s.fullTitle}
                aria-label={s.fullTitle}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap min-h-[36px] ${
                  isCurrent
                    ? 'bg-[#0B1F3A] text-white shadow-xs'
                    : isCompleted
                    ? 'text-[#0B1F3A] hover:bg-[#E2E8F0]'
                    : isAccessible
                    ? 'text-[#475569] hover:bg-[#E2E8F0]'
                    : 'text-[#94A3B8]/60 cursor-not-allowed'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-center leading-4 text-[10px] font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-[#F59E0B] text-[#0F172A]'
                      : isCompleted
                      ? 'bg-[#12805C] text-white'
                      : 'bg-[#CBD5E1] text-[#0F172A]'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </span>
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tablet: Current Step Indicator (md to lg) */}
        <div className="hidden md:flex xl:hidden items-center gap-2 bg-[#F6F8FB] px-3 py-1.5 rounded-control border border-[#E3E8F0]">
          <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {step}
          </span>
          <span className="text-xs font-semibold text-[#0B1F3A] whitespace-nowrap">
            {stepsList[step - 1]?.label}
          </span>
          <span className="text-[11px] text-[#5B6B82] font-mono">({step}/6)</span>
        </div>

        {/* Mobile: Compact Progress (< md) */}
        <div className="flex md:hidden items-center gap-2 bg-[#F6F8FB] px-2.5 py-1 rounded-control border border-[#E3E8F0]">
          <span className="font-mono text-xs font-bold text-[#0B1F3A]">
            {step}/6
          </span>
          <div className="w-12 h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0B1F3A] rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        {/* Right Tools: Language Switcher, Icon-only Help, Profile Avatar Popover */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Switcher */}
          <div
            className="inline-flex bg-[#F6F8FB] rounded-control p-0.5 border border-[#E3E8F0]"
            role="group"
            aria-label="Language selector"
          >
            {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-xs rounded transition-all min-h-[36px] sm:min-h-[28px] ${
                  language === lang
                    ? 'bg-white text-[#0B1F3A] font-bold shadow-2xs'
                    : 'text-[#5B6B82] hover:text-[#0B1F3A]'
                }`}
                lang={lang}
                aria-label={`Switch language to ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Marathi'}`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'मरा'}
              </button>
            ))}
          </div>

          {/* Icon-only Help Trigger */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-2 rounded-control text-[#5B6B82] hover:text-[#0B1F3A] hover:bg-[#F6F8FB] transition-colors min-h-[44px] min-w-[44px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B]"
            title="Help & Scrutiny FAQ"
            aria-label="Help and FAQ"
          >
            <span className="material-symbols-outlined text-xl">help</span>
          </button>

          {/* Profile Avatar with Popover */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0B1F3A] text-white font-bold text-xs ring-2 ring-white hover:ring-[#2B4C9B] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B]"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              aria-label="User profile and taxpayer details"
            >
              SG
            </button>

            {/* Profile Popover Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] p-4 flex flex-col gap-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E3E8F0]">
                  <div className="w-10 h-10 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    SG
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#0F172A] truncate">
                      {CANONICAL_DEMO_CASE.businessName}
                    </span>
                    <span className="font-mono text-[11px] text-[#5B6B82] truncate">
                      {CANONICAL_DEMO_CASE.gstin}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-[#5B6B82]">
                    <span>Jurisdiction</span>
                    <span className="font-semibold text-[#0F172A] text-right">
                      {CANONICAL_DEMO_CASE.office.division}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5B6B82]">
                    <span>Taxpayer Status</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#12805C] bg-[#E6F4EA] px-2 py-0.5 rounded border border-[#A8DAB5]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#12805C]"></span>
                      Active Registered
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5B6B82]">
                    <span>Case Reference</span>
                    <span className="font-mono text-[11px] text-[#0F172A]">
                      {CANONICAL_DEMO_CASE.noticeRef}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E3E8F0] text-[11px] text-[#5B6B82] text-center">
                  Sandbox session active
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
