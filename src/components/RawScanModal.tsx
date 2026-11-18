import React, { useEffect, useRef } from 'react';
import { NoticeScanViewer } from './NoticeScanViewer';

interface RawScanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RawScanModal: React.FC<RawScanModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1F3A]/40 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-modal shadow-tier3 border border-[#E3E8F0] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        <div className="p-4 bg-[#EFF4FF] border-b border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2B4C9B]">visibility</span>
            <h3 id="scan-modal-title" className="text-base font-headline font-bold text-[#0B1F3A]">
              Original Scrutiny Notice (Form GST ASMT-10)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5B6B82] hover:bg-white hover:text-[#0B1F3A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2B4C9B]"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-[#F6F8FB]">
          <NoticeScanViewer isModal />
        </div>

        <div className="p-3 bg-white border-t border-[#E3E8F0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-control bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#2B4C9B] transition-colors shadow-2xs"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
