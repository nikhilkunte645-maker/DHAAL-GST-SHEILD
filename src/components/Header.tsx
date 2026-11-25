import React, { useState, useRef, useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { I18N, Language } from '../data/i18n';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { BrandLogo } from './BrandLogo';

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
  const { step, maxStep, setStep, language, setLanguage, resetDemo } = useDhaalStore();
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-[#E4E9E5]">
      {/* Consolidated Legal & Sandbox Strip */}
      {!isBannerDismissed && (
        <div className="bg-[#073B3A] text-white px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] leading-tight transition-all no-print">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap mx-auto">
            <span className="material-symbols-outlined text-[14px] text-[#119B72] shrink-0">
              verified_user
            </span>
            <span className="font-sans text-[#E7F4EE] tracking-wide truncate">
              Statutory drafting aid for professional review. Not legal advice.
            </span>
            <span className="inline-flex items-center gap-1 bg-[#0A4A48] text-[#E7F4EE] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#119B72]/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#119B72]"></span>
              Sandbox Mode • Synthetic Data
            </span>
          </div>

          {onDismissBanner && (
            <button
              type="button"
              onClick={onDismissBanner}
              className="p-1 rounded text-[#A3B8B5] hover:text-white hover:bg-white/10 transition-colors shrink-0 min-h-[44px] min-w-[44px] sm:min-h-[28px] sm:min-w-[28px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              title="Dismiss banner"
              aria-label="Dismiss statutory disclaimer banner"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>
      )}

      {/* Main Header Bar (56–64px height) */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 max-w-[1240px] mx-auto">
        {/* Left: Mobile Drawer Trigger + Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            className="lg:hidden p-2 rounded-lg text-[#152B2A] hover:bg-[#FAF9F5] focus:outline-none focus:ring-2 focus:ring-[#087F73] min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            className="flex items-center group select-none min-h-[44px] py-1"
            aria-label="Dhaal home"
          >
            <BrandLogo variant="full" size="md" />
          </a>
        </div>

        {/* Center: Stepper */}
        {/* Desktop: 6-Step Stepper (xl+) */}
        <nav
          aria-label="Compliance workflow steps"
          className="hidden xl:flex items-center gap-1 bg-[#FAF9F5] p-1 rounded-lg border border-[#E4E9E5]"
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
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap min-h-[36px] ${isCurrent
                  ? 'bg-[#073B3A] text-white shadow-xs'
                  : isCompleted
                    ? 'text-[#073B3A] hover:bg-[#E7F4EE]'
                    : isAccessible
                      ? 'text-[#687674] hover:bg-[#E4E9E5]'
                      : 'text-[#687674]/50 cursor-not-allowed'
                  }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-center leading-4 text-[10px] font-bold shrink-0 ${isCurrent
                    ? 'bg-[#119B72] text-white'
                    : isCompleted
                      ? 'bg-[#119B72] text-white'
                      : 'bg-[#CBD5E1] text-[#152B2A]'
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
        <div className="hidden md:flex xl:hidden items-center gap-2 bg-[#FAF9F5] px-3 py-1.5 rounded-lg border border-[#E4E9E5]">
          <span className="w-5 h-5 rounded-full bg-[#073B3A] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
            {step}
          </span>
          <span className="text-xs font-semibold text-[#073B3A] whitespace-nowrap">
            {stepsList[step - 1]?.label}
          </span>
          <span className="text-[11px] text-[#687674] font-mono">({step}/6)</span>
        </div>

        {/* Right Tools: Language Switcher, Help, Profile Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Language Switcher */}
          <div
            className="inline-flex bg-[#FAF9F5] rounded-lg p-0.5 border border-[#E4E9E5] shrink-0"
            role="group"
            aria-label="Language selector"
          >
            {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1.5 text-xs rounded transition-all min-h-[44px] min-w-[44px] flex items-center justify-center font-bold ${language === lang
                  ? 'bg-white text-[#073B3A] shadow-xs border border-[#E4E9E5]'
                  : 'text-[#687674] hover:text-[#073B3A]'
                  }`}
                lang={lang}
                aria-label={`Switch language to ${lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Marathi'}`}
              >
                {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिं' : 'मरा'}
              </button>
            ))}
          </div>

          {/* Icon-only Help Trigger (Desktop & Tablet) */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="hidden sm:flex p-2 rounded-lg text-[#687674] hover:text-[#073B3A] hover:bg-[#FAF9F5] transition-colors min-h-[44px] min-w-[44px] items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73]"
            title="Help & Scrutiny FAQ"
            aria-label="Help and FAQ"
          >
            <span className="material-symbols-outlined text-xl">help</span>
          </button>

          {/* Profile Avatar with Popover */}
          <div className="relative shrink-0" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center w-11 h-11 min-h-[44px] min-w-[44px] rounded-full bg-[#073B3A] text-white font-bold text-xs ring-2 ring-[#087F73]/30 hover:ring-[#119B72] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73]"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              aria-label="User profile and taxpayer details"
            >
              SG
            </button>

            {/* Profile Popover Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-[#E4E9E5] p-4 flex flex-col gap-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E4E9E5]">
                  <div className="w-10 h-10 rounded-full bg-[#073B3A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    SG
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#152B2A] truncate">
                      {CANONICAL_DEMO_CASE.businessName}
                    </span>
                    <span className="font-mono text-[11px] text-[#687674] truncate">
                      {CANONICAL_DEMO_CASE.gstin}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center justify-between text-[#687674]">
                    <span>Jurisdiction</span>
                    <span className="font-semibold text-[#152B2A] text-right">
                      {CANONICAL_DEMO_CASE.office.division}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#687674]">
                    <span>Taxpayer Status</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#119B72] bg-[#E7F4EE] px-2 py-0.5 rounded border border-[#119B72]/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#119B72]"></span>
                      Active Registered
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#687674]">
                    <span>Case Reference</span>
                    <span className="font-mono text-[11px] text-[#152B2A]">
                      {CANONICAL_DEMO_CASE.noticeRef}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E4E9E5] flex flex-col gap-2">
                  <div className="text-[10px] text-[#687674] flex items-center justify-between">
                    <span>Storage:</span>
                    <span className="font-semibold text-[#087F73]">Ephemeral (RAM Only)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetDemo();
                      setIsProfileOpen(false);
                    }}
                    className="w-full py-1.5 px-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#C0392B] rounded text-xs font-semibold flex items-center justify-center gap-1.5 border border-[#FECACA] transition-colors"
                    title="Clear current case and purge all session data"
                  >
                    <span className="material-symbols-outlined text-sm">delete_sweep</span>
                    <span>Reset / Clear Case Data</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
