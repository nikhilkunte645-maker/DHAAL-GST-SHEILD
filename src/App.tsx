import React, { useState, useEffect } from 'react';
import { useDhaalStore } from './store/useDhaalStore';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RawScanModal } from './components/RawScanModal';
import { HelpFaqModal } from './components/HelpFaqModal';

// Screens
import { Screen1Upload } from './screens/Screen1Upload';
import { Screen2ConfirmPause } from './screens/Screen2ConfirmPause';
import { Screen3ExplainerDeadlines } from './screens/Screen3ExplainerDeadlines';
import { Screen4EvidenceChecklist } from './screens/Screen4EvidenceChecklist';
import { Screen5DraftVerifier } from './screens/Screen5DraftVerifier';
import { Screen6CaReadyBrief } from './screens/Screen6CaReadyBrief';

export const App: React.FC = () => {
  const {
    step,
    maxStep,
    setStep,
    language,
    isRawScanModalOpen,
    setRawScanModalOpen,
  } = useDhaalStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Sync document language attribute with active store language for Indic font rendering & accessibility
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Synchronize hash routing with store step
  const stepHashMap: Record<string, number> = {
    '#upload': 1,
    '#confirm': 2,
    '#explain': 3,
    '#evidence': 4,
    '#draft': 5,
    '#brief': 6,
  };

  const stepNumberToHash: Record<number, string> = {
    1: '#upload',
    2: '#confirm',
    3: '#explain',
    4: '#evidence',
    5: '#draft',
    6: '#brief',
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const targetStep = stepHashMap[hash];
      if (targetStep) {
        setStep(targetStep);
      }
    };

    if (!window.location.hash) {
      window.location.hash = stepNumberToHash[step] || '#upload';
    } else {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [maxStep, setStep]);

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A] flex flex-col font-sans selection:bg-[#2B4C9B] selection:text-white overflow-x-hidden">
      {/* Top Fixed Header with Integrated Single-line Disclaimer */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenHelp={() => setIsHelpOpen(true)}
        isBannerDismissed={isBannerDismissed}
        onDismissBanner={() => setIsBannerDismissed(true)}
      />

      {/* Left Sidebar (Desktop Rail on 1024-1279px, 240px on >=1280px, Off-canvas on <1024px) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isBannerDismissed={isBannerDismissed}
      />

      {/* Main Content Area: Responsive offsets and centered 1200px container */}
      <div className="lg:pl-16 xl:pl-[240px] flex-1 flex flex-col transition-all duration-200 min-w-0">
        <main
          className={`${
            isBannerDismissed ? 'pt-16 sm:pt-20' : 'pt-[88px] sm:pt-[96px]'
          } pb-16 sm:pb-24 min-h-screen px-4 sm:px-6 max-w-[1200px] w-full mx-auto flex flex-col`}
        >
          {step === 1 && <Screen1Upload />}
          {step === 2 && <Screen2ConfirmPause />}
          {step === 3 && <Screen3ExplainerDeadlines />}
          {step === 4 && <Screen4EvidenceChecklist />}
          {step === 5 && <Screen5DraftVerifier />}
          {step === 6 && <Screen6CaReadyBrief />}
        </main>

        {/* Statutory Footer & In-Memory Privacy Notice */}
        <footer className="mt-auto py-4 px-4 sm:px-6 border-t border-[#E3E8F0] bg-white text-center text-xs text-[#5B6B82] no-print">
          <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span className="font-medium text-[#0B1F3A]">
              Drafting aid. Final review and submission by a Chartered Accountant required.
            </span>
            <span className="text-[11px] text-[#5B6B82]">
              In-Memory Processing: Notice files are processed purely in memory and never stored.
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile Sticky Bottom Action Bar (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E3E8F0] px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg no-print">
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-[#5B6B82]">Step {step} of 6</span>
          <span className="font-bold text-xs text-[#0B1F3A]">
            {step === 1 && 'Upload Notice'}
            {step === 2 && 'Confirm Scanned Amount'}
            {step === 3 && 'Statutory Deadlines'}
            {step === 4 && 'Evidence Checklist'}
            {step === 5 && 'Verify Legal Draft'}
            {step === 6 && 'Ready CA Brief'}
          </span>
        </div>

        {step < 6 && (
          <button
            type="button"
            onClick={() => {
              if (step < maxStep) {
                setStep(step + 1);
              }
            }}
            disabled={step >= maxStep}
            className="px-4 py-2 rounded-control bg-[#0B1F3A] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 shadow-2xs min-h-[44px]"
            aria-label="Proceed to next step"
          >
            <span>Next</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        )}
      </div>

      {/* Modals */}
      <RawScanModal
        isOpen={isRawScanModalOpen}
        onClose={() => setRawScanModalOpen(false)}
      />

      <HelpFaqModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
};

export default App;
