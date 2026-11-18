import React, { useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { I18N, Language } from '../data/i18n';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { dhaalApi } from '../mockApi';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenHelp }) => {
  const {
    step,
    maxStep,
    setStep,
    language,
    setLanguage,
    isDemoMode,
    setIsDemoMode,
    apiOnline,
    setApiOnline,
  } = useDhaalStore();
  const t = I18N[language];

  useEffect(() => {
    dhaalApi.checkHealth().then((health) => {
      setApiOnline(!!health);
    });
  }, [setApiOnline]);

  const stepsList = [
    { num: 1, label: t.stepper.step1, hash: '#upload' },
    { num: 2, label: t.stepper.step2, hash: '#confirm' },
    { num: 3, label: t.stepper.step3, hash: '#explain' },
    { num: 4, label: t.stepper.step4, hash: '#evidence' },
    { num: 5, label: t.stepper.step5, hash: '#draft' },
    { num: 6, label: t.stepper.step6, hash: '#brief' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_1px_8px_rgba(11,31,58,0.06)] border-b border-[#E3E8F0]">
      {/* Slim Persistent Disclaimer Strip */}
      <div className="bg-[#0B1F3A] text-white py-1 px-4 text-center flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-xs text-[#F59E0B]">shield</span>
        <span className="font-mono text-[11px] uppercase tracking-wider font-medium">
          Statutory Drafting aid for professional review. Not legal advice. Nothing is filed.
        </span>
        <span className="hidden md:inline-block text-[10px] bg-white/10 px-1.5 py-0.2 rounded text-[#cbdbf6]">
          Synthetic demo data
        </span>
      </div>

      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-3">
        {/* Logo & Mobile Menu Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-[#0F172A] hover:bg-[#F6F8FB] focus:outline-none focus:ring-2 focus:ring-[#2B4C9B]"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation drawer"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <a href="#upload" onClick={(e) => { e.preventDefault(); setStep(1); }} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center shadow-sm group-hover:bg-[#2B4C9B] transition-colors">
              <span className="material-symbols-outlined text-xl text-[#F59E0B]">shield</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline text-lg font-bold text-[#0B1F3A] tracking-tight leading-none">
                DHAAL <span className="font-devanagari text-sm font-normal text-[#5B6B82]">(ढाल)</span>
              </span>
              <span className="text-[11px] font-semibold text-[#5B6B82] tracking-wider uppercase -mt-0.5">
                GST Notice Shield
              </span>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setIsDemoMode(!isDemoMode)}
            title="Click to toggle between Live API Mode and Offline Demo Mode"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[11px] transition-all border cursor-pointer ${
              !isDemoMode && apiOnline
                ? 'bg-[#E6F4EA] text-[#12805C] border-[#A8DAB5] hover:border-[#12805C]'
                : 'bg-[#EFF4FF] text-[#2B4C9B] border-[#CBD5E1] hover:border-[#2B4C9B]'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                !isDemoMode && apiOnline ? 'bg-[#12805C] animate-pulse' : 'bg-[#F59E0B]'
              }`}
            ></span>
            <span>{!isDemoMode && apiOnline ? 'Live API :8001' : !isDemoMode ? 'API Offline (Fallback)' : 'Demo Mode'}</span>
          </button>
        </div>

        {/* 6-Step Stepper (xl+) / Compact Progress (<xl) */}
        <nav
          aria-label="Compliance workflow steps"
          className="hidden xl:flex items-center gap-1 bg-[#EFF4FF] p-1 rounded-lg border border-[#CBD5E1]"
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
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isCurrent
                    ? 'bg-[#0B1F3A] text-white shadow-sm'
                    : isAccessible
                    ? 'text-[#44474D] hover:bg-[#DCE9FF] hover:text-[#0B1C30]'
                    : 'text-[#75777E]/50 cursor-not-allowed'
                }`}
                title={!isAccessible ? `Complete step ${s.num - 1} to unlock` : s.label}
              >
                <span
                  className={`w-4 h-4 rounded-full text-center leading-4 text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-[#F59E0B] text-[#0F172A]'
                      : isCompleted
                      ? 'bg-[#12805C] text-white'
                      : 'bg-[#D3E4FF] text-[#0B1C30]'
                  }`}
                >
                  {isCompleted ? '✓' : s.num}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Compact Stepper for Mobile / Tablet */}
        <div className="flex xl:hidden items-center gap-2 bg-[#EFF4FF] px-3 py-1.5 rounded-lg border border-[#CBD5E1]">
          <span className="w-5 h-5 rounded-full bg-[#0B1F3A] text-white text-[11px] font-bold flex items-center justify-center">
            {step}
          </span>
          <span className="text-xs font-semibold text-[#0B1F3A]">
            Step {step} of 6: <span className="font-normal text-[#5B6B82]">{stepsList[step - 1]?.label}</span>
          </span>
        </div>

        {/* Right Tools: Language Switcher, Help, User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="inline-flex bg-[#EFF4FF] rounded-lg p-0.5 border border-[#CBD5E1]" role="group" aria-label="Language selector">
            {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  language === lang
                    ? 'bg-white text-[#0B1F3A] font-bold shadow-xs'
                    : 'text-[#5B6B82] hover:text-[#0B1F3A]'
                }`}
                lang={lang === 'hi' ? 'hi' : lang === 'mr' ? 'mr' : 'en'}
              >
                {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
              </button>
            ))}
          </div>

          {/* Help & FAQ */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="hidden md:flex items-center gap-1 text-xs font-semibold text-[#5B6B82] hover:text-[#0B1F3A] transition-colors"
          >
            <span className="material-symbols-outlined text-base">help</span>
            <span>Help & FAQ</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E3E8F0]">
            <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-[#CBD5E1]">
              SG
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#0F172A] leading-tight">
                {CANONICAL_DEMO_CASE.businessName}
              </span>
              <span className="font-mono text-[11px] text-[#5B6B82]">
                {CANONICAL_DEMO_CASE.gstin}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
