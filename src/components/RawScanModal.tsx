import React, { useRef } from 'react';
import { NoticeScanViewer } from './NoticeScanViewer';
import { Button } from './ui/Button';
import { useModalAccessibility } from '../hooks/useModalAccessibility';

interface RawScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RawScanModal: React.FC<RawScanModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useModalAccessibility({ isOpen, onClose, modalRef });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 focus:outline-none"
      >
        <div className="p-4 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B4C9B]">visibility</span>
            <h3 id="scan-modal-title" className="text-base font-headline font-bold text-[#0B1F3A]">
              Original Scrutiny Notice (Form GST ASMT-10)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-control text-[#5B6B82] hover:bg-white hover:text-[#0B1F3A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B] min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-[#F8FAFC]">
          <NoticeScanViewer isModal />
        </div>

        <div className="p-3 bg-white border-t border-[#E2E8F0] flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Close Viewer
          </Button>
        </div>
      </div>
    </div>
  );
};
