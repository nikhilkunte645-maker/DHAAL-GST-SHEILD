import React, { useState, useRef, useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { I18N } from '../data/i18n';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { dhaalApi, FALLBACK_NOTICE } from '../mockApi';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const Screen1Upload: React.FC = () => {
  const {
    language,
    upload,
    startUpload,
    setUploadProgress,
    setUploadError,
    setStep,
    setUploadedNotice,
    isDemoMode,
    resetDemo,
  } = useDhaalStore();

  const t = I18N[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAnchorRef = useRef<HTMLDivElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);
  const [isDemoControlsOpen, setIsDemoControlsOpen] = useState(false);
  const demoControlsRef = useRef<HTMLDivElement>(null);

  // Check if demo controls should be visible: DEV mode, demo mode active, or ?demo=1 query param
  const isDev = Boolean((import.meta as unknown as { env?: { DEV?: boolean } })?.env?.DEV);
  const isDemoUrl =
    typeof window !== 'undefined' &&
    (window.location.search.includes('demo=1') || isDemoMode || isDev);

  // Close demo controls popover on click outside or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (demoControlsRef.current && !demoControlsRef.current.contains(e.target as Node)) {
        setIsDemoControlsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDemoControlsOpen(false);
      }
    };

    if (isDemoControlsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDemoControlsOpen]);

  // Animated progress when uploading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (upload.status === 'parsing') {
      let current = upload.progress;
      interval = setInterval(() => {
        current += 10;
        if (current >= 100) {
          current = 100;
          setUploadProgress(100);
          clearInterval(interval);
        } else {
          setUploadProgress(current);
        }
      }, 180);
    }
    return () => clearInterval(interval);
  }, [upload.status, setUploadProgress]);

  // Auto-advance to Step 2 when progress reaches 100
  useEffect(() => {
    if (upload.status === 'success' && upload.progress >= 100) {
      const timeout = setTimeout(() => {
        setStep(2);
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [upload.status, upload.progress, setStep]);

  const handleFile = (file: File) => {
    setFileValidationError(null);
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    if (!fileExt || !validExtensions.includes(fileExt)) {
      setFileValidationError('Invalid file format. Please upload a PDF, PNG, or JPG file.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setFileValidationError('File size exceeds the 25MB limit. Please upload a smaller document.');
      return;
    }

    startUpload(file.name);
    dhaalApi
      .uploadNotice(file, file.name)
      .then((metadata) => {
        setUploadedNotice(metadata);
      })
      .catch((err) => {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed. Please check the file.';
        setFileValidationError(errorMsg);
        setUploadError('unreadable');
      });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleTriggerUpload = () => {
    uploadAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoadSample = () => {
    setFileValidationError(null);
    startUpload('FORM_GST_ASMT-10.pdf');
    const sampleBlob = new Blob(
      ['%PDF-1.4\nForm GST ASMT-10 Notice Reference ZA270525008912M GSTIN 27XXXXX1234X1ZX Discrepancy Amount Rs. 1,84,250 Period Apr-Jun 2024 Section 61\n%%EOF'],
      { type: 'application/pdf' }
    );
    dhaalApi
      .uploadNotice(sampleBlob, 'FORM_GST_ASMT-10.pdf')
      .then((metadata) => {
        setUploadedNotice(metadata);
      })
      .catch(() => {
        setUploadedNotice(FALLBACK_NOTICE);
        setUploadProgress(100);
      });
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* C.1: Clean Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10 sm:mb-14">
        {/* Left Hero: Headline, Concise Subcopy (max 2 lines), Actions */}
        <div className="lg:col-span-7 flex flex-col gap-4 sm:gap-5">
          <h1 className="font-headline text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#0B1F3A] tracking-tight leading-[1.15]">
            {t.heroHeadline}
            <span className="text-[#2B4C9B] underline decoration-[#F59E0B] decoration-4 underline-offset-4">
              {t.heroHeadlineHighlight}
            </span>
            {t.heroHeadlineEnd}
          </h1>

          {/* Supporting paragraph: maximum 2 lines on desktop */}
          <p className="text-sm sm:text-base text-[#475569] max-w-xl leading-relaxed">
            {t.heroSubcopy}
          </p>

          {/* Primary CTA & Secondary Action (no redundant badges or pills) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              variant="primary"
              size="lg"
              icon="cloud_upload"
              onClick={handleTriggerUpload}
              className="font-headline font-bold shadow-sm"
              aria-label="Upload your GST ASMT-10 notice"
            >
              {t.uploadCta}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              icon="description"
              onClick={handleLoadSample}
              aria-label="Try with canonical Form ASMT-10 sample notice"
            >
              {t.trySampleCta}
            </Button>
          </div>
        </div>

        {/* C.2: Right Hero Visual: Streamlined ASMT-10 Preview Card (At most 3 data rows, 1 badge per row) */}
        <div className="lg:col-span-5 relative">
          <div className="absolute -top-6 -right-6 w-64 h-64 bg-[#DCE9FF]/40 rounded-full blur-3xl pointer-events-none" />

          <Card
            variant="default"
            padding="none"
            className="relative overflow-hidden shadow-tier1 border-[#CBD5E1]"
          >
            {/* Document Header Bar */}
            <div className="flex items-center justify-between bg-[#F8FAFC] px-4 py-2.5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]"></span>
                <span className="font-mono text-xs text-[#0B1F3A] font-bold ml-1.5 truncate">
                  FORM_GST_ASMT-10.pdf
                </span>
              </div>
              <Badge variant="neutral" size="sm">
                Rule 99(1) Notice
              </Badge>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-3">
              {/* Official Header Simulation */}
              <div className="flex flex-col text-center pb-1">
                <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">
                  GST Scrutiny Directorate
                </span>
                <span className="font-headline text-sm font-bold text-[#0B1F3A]">
                  NOTICE UNDER SECTION 61
                </span>
                <span className="font-mono text-[11px] text-[#64748B]">
                  Ref: {CANONICAL_DEMO_CASE.noticeRef}
                </span>
              </div>

              {/* Data Row 1: Mismatch Amount */}
              <div className="p-3 bg-[#FEF2F2] rounded-control border border-[#FECACA] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[#C0392B] text-lg shrink-0">
                    warning
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-[#64748B] truncate">
                      Alleged ITC Mismatch (Table 4A)
                    </span>
                    <span className="font-mono text-sm sm:text-base text-[#C0392B] font-bold tracking-tight">
                      ₹1,84,250.00
                    </span>
                  </div>
                </div>
                <Badge variant="danger" size="sm" className="shrink-0 font-mono">
                  GSTR-3B vs 2B
                </Badge>
              </div>

              {/* Data Row 2: Statutory Response Window */}
              <div className="p-3 bg-[#FFFBEB] rounded-control border border-[#FDE68A] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[#B45309] text-lg shrink-0">
                    schedule
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-[#B45309] truncate">
                      Statutory Response Window
                    </span>
                    <span className="font-headline text-sm sm:text-base text-[#0B1F3A] font-bold">
                      12 Days Remaining
                    </span>
                  </div>
                </div>
                <Badge variant="warning" size="sm" className="shrink-0 font-mono">
                  30-Day Window
                </Badge>
              </div>

              {/* Data Row 3: Tax Period Extracted */}
              <div className="p-3 bg-[#F8FAFC] rounded-control border border-[#E2E8F0] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="material-symbols-outlined text-[#2B4C9B] text-lg shrink-0">
                    calendar_month
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-[#64748B] truncate">
                      Tax Period Under Review
                    </span>
                    <span className="font-mono text-xs text-[#0B1F3A] font-bold">
                      {CANONICAL_DEMO_CASE.taxPeriod}
                    </span>
                  </div>
                </div>
                <Badge variant="brand" size="sm" className="shrink-0 font-mono">
                  Q1 FY25
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* 3-Step Pipeline Strip */}
      <div className="mb-10 sm:mb-12">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#2B4C9B] font-bold">
            The Dhaal Shield Pipeline
          </span>
          <h2 className="font-headline text-xl sm:text-2xl font-bold text-[#0B1F3A] mt-1">
            From notice anxiety to audit-ready reply in three steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Pipeline Step 1 */}
          <Card variant="default" padding="md" className="flex flex-col gap-2.5 hover:border-[#CBD5E1]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-control bg-[#EFF4FF] text-[#0B1F3A] flex items-center justify-center font-headline text-sm font-bold">
                1
              </div>
              <span className="material-symbols-outlined text-[#2B4C9B] text-xl">upload_file</span>
            </div>
            <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">Upload Document</h3>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              Drop any ASMT-10 notice. Dhaal strips personal tokens, extracts discrepancy tables, and parses statutory sections.
            </p>
            <span className="font-mono text-[11px] text-[#2B4C9B] font-semibold mt-auto pt-2 border-t border-[#F1F5F9]">
              Form ASMT-10 Support
            </span>
          </Card>

          {/* Pipeline Step 2 */}
          <Card variant="default" padding="md" className="flex flex-col gap-2.5 hover:border-[#CBD5E1]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-control bg-[#EFF4FF] text-[#0B1F3A] flex items-center justify-center font-headline text-sm font-bold">
                2
              </div>
              <span className="material-symbols-outlined text-[#2B4C9B] text-xl">fact_check</span>
            </div>
            <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">Deterministic Check</h3>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              Numbers are mathematically verified against GSTR-3B vs 2B data. Ambiguous scans trigger an interactive confirmation checkpoint.
            </p>
            <span className="font-mono text-[11px] text-[#2B4C9B] font-semibold mt-auto pt-2 border-t border-[#F1F5F9]">
              Checked by Code
            </span>
          </Card>

          {/* Pipeline Step 3 */}
          <Card variant="default" padding="md" className="flex flex-col gap-2.5 hover:border-[#CBD5E1]">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-control bg-[#EFF4FF] text-[#0B1F3A] flex items-center justify-center font-headline text-sm font-bold">
                3
              </div>
              <span className="material-symbols-outlined text-[#2B4C9B] text-xl">verified</span>
            </div>
            <h3 className="font-headline text-sm font-bold text-[#0B1F3A]">CA-Ready Brief</h3>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              Receive a synthesized legal brief with vernacular audio explanations, statutory deadlines, evidence tracker, and ASMT-11 draft.
            </p>
            <span className="font-mono text-[11px] text-[#2B4C9B] font-semibold mt-auto pt-2 border-t border-[#F1F5F9]">
              Exportable Dossier
            </span>
          </Card>
        </div>
      </div>

      {/* Main Drag-and-Drop Ingestion Canvas */}
      <Card
        ref={uploadAnchorRef}
        id="upload-anchor"
        variant="default"
        padding="lg"
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0B1F3A] text-2xl">
                security_update_good
              </span>
              <h2 className="font-headline text-xl sm:text-2xl font-bold text-[#0B1F3A]">
                Ingest GST Notice
              </h2>
            </div>
            <p className="text-xs text-[#5B6B82] mt-0.5">
              Upload scanned documents, digital notice PDFs, or photos from your device.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="bolt"
            onClick={handleLoadSample}
            aria-label="Load demo notice file"
          >
            Try with sample notice
          </Button>
        </div>

        {/* Dropzone Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-card border-2 border-dashed transition-all p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3.5 ${
            isDragOver
              ? 'border-[#2B4C9B] bg-[#EFF4FF]'
              : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EFF4FF] hover:border-[#2B4C9B]'
          } ${upload.status === 'parsing' ? 'opacity-40 pointer-events-none' : ''}`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white text-[#2B4C9B] flex items-center justify-center shadow-xs border border-[#E3E8F0] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
          </div>

          <div className="flex flex-col gap-1 max-w-md">
            <span className="font-headline text-sm sm:text-base font-bold text-[#0B1F3A]">
              Drag & drop your GST Notice here, or{' '}
              <span className="text-[#2B4C9B] underline underline-offset-2">Browse Files</span>
            </span>
            <span className="text-xs text-[#5B6B82]">
              PDF, JPG, PNG • Max single file size 25MB
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Badge variant="neutral" size="sm">
              Form ASMT-10
            </Badge>
            <Badge variant="neutral" size="sm">
              In-Memory Processing
            </Badge>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
          />
        </div>

        {/* Inline File Validation Error */}
        {fileValidationError && (
          <div className="mt-4 p-3 rounded-control bg-[#FEE2E2] text-[#C0392B] text-xs font-semibold flex items-center gap-2 border border-[#FECACA]">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{fileValidationError}</span>
          </div>
        )}

        {/* STATE 2: Parsing Progress Panel */}
        {upload.status === 'parsing' && (
          <div className="mt-6 p-5 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col gap-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2B4C9B] text-white flex items-center justify-center animate-spin">
                  <span className="material-symbols-outlined text-base">autorenew</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline text-sm font-bold text-[#0B1F3A]">
                    Parsing ASMT-10 Notice...
                  </span>
                  <span className="text-xs text-[#5B6B82]">{upload.fileName}</span>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-[#2B4C9B]">
                {upload.progress}%
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-[#CBD5E1]">
              <div
                className="h-full bg-[#2B4C9B] rounded-full transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>

            {/* Checklist Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div className="flex items-center gap-2 text-[#12805C] font-semibold">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>1. Extracted</span>
              </div>
              <div className="flex items-center gap-2 text-[#12805C] font-semibold">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>2. Fields Detected</span>
              </div>
              <div className="flex items-center gap-2 text-[#B45309] font-bold animate-pulse">
                <span className="material-symbols-outlined text-base">hourglass_top</span>
                <span>3. Pausing for confirmation</span>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStep(2)}
              >
                Continue to Step 2
              </Button>
            </div>
          </div>
        )}

        {/* STATE 3: Unreadable Scan Error Alert (Blurry Photo) */}
        {upload.errorType === 'unreadable' && (
          <div className="mt-6 p-4 rounded-card bg-[#FEE2E2] text-[#C0392B] border border-[#FECACA] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#C0392B] text-2xl shrink-0 mt-0.5">
                document_scanner
              </span>
              <div className="flex flex-col">
                <span className="font-headline text-sm sm:text-base font-bold text-[#C0392B]">
                  Unreadable Document Scan
                </span>
                <span className="text-xs text-[#0F172A] mt-0.5">
                  The tax discrepancy numbers are partially blurred or cropped. Dhaal will not guess tax figures.
                </span>
                <span className="font-mono text-[11px] mt-1 text-[#C0392B] font-semibold">
                  Suggested: Upload the digital PDF downloaded directly from the GST Portal.
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => setUploadError('none')}
              className="shrink-0"
            >
              Try Higher Resolution
            </Button>
          </div>
        )}

        {/* STATE 4: Unsupported Notice Type Warning (Wrong Form) */}
        {upload.errorType === 'unsupported' && (
          <div className="mt-6 p-4 rounded-card bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#B45309] text-2xl shrink-0 mt-0.5">
                help_outline
              </span>
              <div className="flex flex-col">
                <span className="font-headline text-sm sm:text-base font-bold text-[#B45309]">
                  Unsupported Notice Detected: GSTR-3A / Return Default
                </span>
                <span className="text-xs text-[#0F172A] mt-0.5">
                  This appears to be an automated Form GSTR-3A reminder, not a scrutiny notice under Section 61 (ASMT-10).
                </span>
                <span className="font-mono text-[11px] mt-1 text-[#B45309] font-semibold">
                  Resolution: GSTR-3A non-filing notices do not require an ASMT-11 written brief.
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setUploadError('none');
                handleLoadSample();
              }}
              className="shrink-0"
            >
              Upload ASMT-10 Notice
            </Button>
          </div>
        )}
      </Card>

      {/* D.2: Compact Floating Demo Controls Popover (Fixed in bottom-right corner) */}
      {isDemoUrl && (
        <div className="fixed bottom-4 right-4 z-40" ref={demoControlsRef}>
          {isDemoControlsOpen ? (
            <Card
              variant="default"
              padding="sm"
              className="mb-2 shadow-tier3 border-[#CBD5E1] w-64 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E3E8F0]">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-[#2B4C9B]">tune</span>
                  <span className="font-mono text-[11px] text-[#0B1F3A] uppercase font-bold tracking-wider">
                    Demo Controls
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDemoControlsOpen(false)}
                  className="p-1 rounded text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                  aria-label="Close demo controls"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setUploadError('none');
                    useDhaalStore.setState((s) => ({
                      upload: { ...s.upload, status: 'idle', progress: 0 },
                    }));
                  }}
                  className={`px-2 py-1.5 rounded-control text-xs text-left font-medium transition-colors ${
                    upload.status === 'idle' && upload.errorType === 'none'
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#EFF4FF]'
                  }`}
                >
                  1. Default
                </button>

                <button
                  type="button"
                  onClick={() => startUpload('FORM_GST_ASMT-10.pdf')}
                  className={`px-2 py-1.5 rounded-control text-xs text-left font-medium transition-colors ${
                    upload.status === 'parsing'
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#EFF4FF]'
                  }`}
                >
                  2. Processing
                </button>

                <button
                  type="button"
                  onClick={() => setUploadError('unreadable')}
                  className={`px-2 py-1.5 rounded-control text-xs text-left font-medium transition-colors ${
                    upload.errorType === 'unreadable'
                      ? 'bg-[#C0392B] text-white'
                      : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#EFF4FF]'
                  }`}
                >
                  3. Blurry Photo
                </button>

                <button
                  type="button"
                  onClick={() => setUploadError('unsupported')}
                  className={`px-2 py-1.5 rounded-control text-xs text-left font-medium transition-colors ${
                    upload.errorType === 'unsupported'
                      ? 'bg-[#B45309] text-white'
                      : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-[#EFF4FF]'
                  }`}
                >
                  4. Wrong Form
                </button>
              </div>

              <div className="pt-1.5 border-t border-[#E3E8F0] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset demo state?')) {
                      resetDemo();
                      setIsDemoControlsOpen(false);
                    }
                  }}
                  className="text-[11px] text-[#C0392B] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span className="material-symbols-outlined text-xs">restart_alt</span>
                  <span>Reset Demo</span>
                </button>
                {isDev && (
                  <span className="font-mono text-[10px] text-[#94A3B8]">DEV</span>
                )}
              </div>
            </Card>
          ) : null}

          {/* Toggle Trigger Button */}
          <button
            type="button"
            onClick={() => setIsDemoControlsOpen(!isDemoControlsOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/95 backdrop-blur-md shadow-tier2 border border-[#E3E8F0] text-xs font-semibold text-[#0B1F3A] hover:border-[#2B4C9B] hover:shadow-tier3 transition-all ml-auto min-h-[44px] sm:min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4C9B]"
            aria-expanded={isDemoControlsOpen}
            aria-label="Toggle demo state controls"
          >
            <span className="material-symbols-outlined text-sm text-[#2B4C9B]">tune</span>
            <span>Demo controls</span>
          </button>
        </div>
      )}
    </div>
  );
};
