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
    isRawScanModalOpen,
    setRawScanModalOpen,
  } = useDhaalStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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
    <div className="min-h-screen bg-[#F6F8FB] text-[#0F172A] flex flex-col font-sans selection:bg-[#2B4C9B] selection:text-white">
      {/* Top Fixed Header */}
      <Header
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Left Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        <main className="pt-[88px] min-h-screen px-4 sm:px-6 lg:px-8 py-6 max-w-[1440px] w-full mx-auto">
          {step === 1 && <Screen1Upload />}
          {step === 2 && <Screen2ConfirmPause />}
          {step === 3 && <Screen3ExplainerDeadlines />}
          {step === 4 && <Screen4EvidenceChecklist />}
          {step === 5 && <Screen5DraftVerifier />}
          {step === 6 && <Screen6CaReadyBrief />}
        </main>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E3E8F0] p-3 flex items-center justify-between gap-3 shadow-lg no-print">
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
            className="px-4 py-2 rounded-control bg-[#0B1F3A] text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1 shadow-sm"
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
