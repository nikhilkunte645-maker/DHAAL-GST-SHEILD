import React from 'react';
import { Button } from './ui/Button';

interface HelpFaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpFaqModal: React.FC<HelpFaqModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const faqs = [
    {
      q: 'What is Form GST ASMT-10?',
      a: 'Form ASMT-10 is a statutory scrutiny notice issued under Section 61 of the CGST Act, read with Rule 99(1). It intimates discrepancies found in your filed GST returns (such as GSTR-3B vs GSTR-2B) and requests an explanation.',
    },
    {
      q: 'Is this an immediate tax demand or fine?',
      a: 'No. ASMT-10 is a pre-adjudication scrutiny notice, not an adjudication order (like Form DRC-07). It offers you 30 days to furnish an explanation in Form ASMT-11 with supporting purchase invoices and reconciliation records.',
    },
    {
      q: 'Why did the pipeline pause in Step 2?',
      a: 'Dhaal uses human-in-the-loop verification. If a scanned document has a physical print defect or smudge, Dhaal will never guess or hallucinate tax amounts. It asks you to confirm the exact disputed figure before synthesizing grounds.',
    },
    {
      q: 'Does Dhaal file anything with the GST department?',
      a: 'No. Dhaal is strictly a statutory drafting aid. Nothing is uploaded or filed to the government portal. The finalized dossier and Form ASMT-11 reply must be signed by your Chartered Accountant with a valid UDIN.',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] max-w-xl w-full p-6 flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-start pb-2 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B4C9B]">help</span>
            <h3 className="font-headline text-base font-bold text-[#0B1F3A]">
              Help &amp; Statutory FAQ
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#5B6B82] hover:bg-[#F1F5F9] transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto space-y-3 pr-1 text-xs">
          {faqs.map((faq, index) => (
            <div key={index} className="p-3.5 bg-[#F8FAFC] rounded-control border border-[#E2E8F0]">
              <span className="font-headline text-xs font-bold text-[#0B1F3A] block">
                {faq.q}
              </span>
              <p className="text-[#5B6B82] mt-1 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#E2E8F0] flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Close FAQ
          </Button>
        </div>
      </div>
    </div>
  );
};
