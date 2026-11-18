import React, { useState, useRef, useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { I18N } from '../data/i18n';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { dhaalApi, FALLBACK_NOTICE } from '../mockApi';

export const Screen1Upload: React.FC = () => {
  const {
    language,
    upload,
    startUpload,
    setUploadProgress,
    setUploadError,
    setStep,
    setUploadedNotice,
  } = useDhaalStore();

  const t = I18N[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAnchorRef = useRef<HTMLDivElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);

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
        console.log('[Dhaal API] Uploaded Notice Metadata from FastAPI:', metadata);
      })
      .catch((err) => {
        console.error('[Dhaal API] Upload failed:', err);
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
        console.log('[Dhaal API] Sample Notice Metadata from FastAPI:', metadata);
      })
      .catch((err) => {
        console.warn('[Dhaal API] Sample upload falling back to local demo case:', err);
        setUploadedNotice(FALLBACK_NOTICE);
        setUploadProgress(100);
      });
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Utility Context Pill & Alert Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#EFF4FF] p-3 rounded-xl border border-[#CBD5E1]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#0B1F3A] font-mono text-[11px] font-bold tracking-wide border border-[#E3E8F0] shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#12805C]"></span>
            ACTIVE PROFILE: SHARMA GARMENTS
          </span>
          <span className="font-mono text-[11px] text-[#44474D] bg-[#DCE9FF] px-2.5 py-1 rounded-full">
            GSTIN: {CANONICAL_DEMO_CASE.gstin}
          </span>
          <span className="inline-flex items-center gap-1 text-[#B45309] bg-[#FEF3C7] px-2.5 py-1 rounded-full text-xs font-semibold border border-[#FDE68A]">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Sandbox Mode • Synthetic Demo Data
          </span>
        </div>

        {/* Bilingual Tagline Pill */}
        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-2xs border border-[#E3E8F0]">
          <span className="material-symbols-outlined text-[#F59E0B] text-base">campaign</span>
          <span className="text-xs text-[#0B1F3A] font-semibold" lang={language}>
            {t.tagline} <span className="text-[#5B6B82] font-normal">{t.taglineRomanized}</span>
          </span>
        </div>
      </div>

      {/* Hero Grid: Asymmetrical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
        {/* Left Hero Editorial Text & Intent Actions */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-[#EFF4FF] text-[#0B1F3A] text-xs font-semibold border border-[#CBD5E1]">
            <span className="material-symbols-outlined text-base text-[#F59E0B]">shield</span>
            <span>Statutory Defense • Form ASMT-10 Engine</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B4C9B]"></span>
            <span className="text-[#5B6B82] font-mono">Section 61 CGST Act</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#0B1F3A] tracking-tight leading-tight">
            {t.heroHeadline}
            <span className="text-[#2B4C9B] underline decoration-[#F59E0B] decoration-4 underline-offset-4">
              {t.heroHeadlineHighlight}
            </span>
            {t.heroHeadlineEnd}
          </h1>

          <p className="text-base text-[#44474D] max-w-2xl leading-relaxed">
            {t.heroSubcopy}
          </p>

          {/* Primary & Secondary CTA Block */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              onClick={handleTriggerUpload}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-control bg-[#0B1F3A] hover:bg-[#2B4C9B] text-white font-headline text-base font-bold transition-all shadow-md hover:shadow-lg active:scale-95 group"
            >
              <span className="material-symbols-outlined text-xl text-[#F59E0B] group-hover:scale-110 transition-transform">
                cloud_upload
              </span>
              <span>{t.uploadCta}</span>
            </button>

            <button
              type="button"
              onClick={handleLoadSample}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-control bg-white hover:bg-[#EFF4FF] text-[#0F172A] text-xs font-semibold transition-all border border-[#E3E8F0] shadow-sm hover:border-[#2B4C9B]"
            >
              <span className="material-symbols-outlined text-base text-[#2B4C9B]">description</span>
              <span>Try with sample notice</span>
              <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-mono text-[10px] font-bold border border-[#FDE68A]">
                Sample data
              </span>
            </button>
          </div>

          {/* Live Confidence Metric Callout */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center -space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white">
                SG
              </div>
              <div className="w-8 h-8 rounded-full bg-[#2B4C9B] text-white flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-white font-mono">
                CA
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-[#0B1F3A] font-bold">
                Code-Verified Statutory Defense
              </span>
              <span className="text-xs text-[#5B6B82]">
                Deterministic mathematical checks + CA review protocol
              </span>
            </div>
          </div>
        </div>

        {/* Right Hero Visual: Layered ASMT-10 Document Anatomy */}
        <div className="lg:col-span-5 relative">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-[#DCE9FF]/60 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] p-6 flex flex-col gap-4 overflow-hidden">
            {/* Hologram Overlay SVG */}
            <div className="absolute -right-12 -bottom-12 opacity-5 pointer-events-none text-[#0B1F3A]">
              <svg fill="currentColor" height="260" viewBox="0 0 24 24" width="260">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"></path>
              </svg>
            </div>

            {/* Document Header Bar */}
            <div className="flex items-center justify-between bg-[#EFF4FF] -mx-6 -mt-6 px-6 py-2.5 border-b border-[#CBD5E1]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#C0392B]"></span>
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                <span className="w-3 h-3 rounded-full bg-[#12805C]"></span>
                <span className="font-mono text-xs text-[#0B1F3A] font-bold ml-2">
                  FORM_GST_ASMT-10.pdf
                </span>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white text-[#0B1F3A] font-bold border border-[#CBD5E1]">
                Rule 99(1) Notice
              </span>
            </div>

            {/* Official Header Simulation */}
            <div className="flex flex-col text-center pt-1">
              <span className="text-[10px] text-[#5B6B82] uppercase tracking-widest font-bold">
                Government of Maharashtra • GST Scrutiny Directorate
              </span>
              <span className="font-headline text-base font-bold text-[#0B1F3A] mt-0.5">
                NOTICE FOR SCRUTINY UNDER SECTION 61
              </span>
              <span className="font-mono text-xs text-[#5B6B82] mt-0.5">
                Reference: {CANONICAL_DEMO_CASE.noticeRef}
              </span>
            </div>

            {/* Key Extracted Discrepancy Highlight Overlays */}
            <div className="flex flex-col gap-2.5 pt-1">
              {/* Highlight Item 1: Discrepancy Amount */}
              <div className="p-3 bg-[#FEE2E2]/60 rounded-card border-l-accent-danger flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#C0392B] text-xl">warning</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#5B6B82]">
                      Alleged ITC Mismatch (Table 4A)
                    </span>
                    <span className="font-mono text-base text-[#C0392B] font-bold tracking-tight">
                      ₹1,84,250.00
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[11px] bg-white text-[#C0392B] px-2 py-1 rounded border border-[#FECACA] font-bold">
                  GSTR-3B vs 2B
                </span>
              </div>

              {/* Highlight Item 2: Statutory Response Window */}
              <div className="p-3 bg-[#FEF3C7]/60 rounded-card border-l-accent-saffron flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#B45309] text-xl">schedule</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#B45309]">Statutory Response Window</span>
                    <span className="font-headline text-base text-[#0B1F3A] font-bold">
                      12 Days Remaining
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[11px] bg-white text-[#B45309] px-2 py-1 rounded border border-[#FDE68A] font-bold">
                  30-Day Rule Sec 61(3)
                </span>
              </div>

              {/* Highlight Item 3: Tax Period Extracted */}
              <div className="p-3 bg-[#EFF4FF] rounded-card border border-[#CBD5E1] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#2B4C9B] text-xl">calendar_month</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#5B6B82]">Tax Period Under Review</span>
                    <span className="font-mono text-xs text-[#0B1F3A] font-bold">
                      {CANONICAL_DEMO_CASE.taxPeriod}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-[11px] bg-white text-[#2B4C9B] px-2 py-1 rounded border border-[#CBD5E1]">
                  Extracted • Page 1
                </span>
              </div>
            </div>

            {/* Floating Trust Indicator (Honesty rule: Numbers checked by code) */}
            <div className="flex items-center justify-between pt-1 text-[#5B6B82] text-xs bg-[#EFF4FF] p-2.5 rounded-lg border border-[#CBD5E1]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#2B4C9B] text-base">verified</span>
                <span>Deterministic extraction pipeline</span>
              </div>
              <span className="font-mono text-xs text-[#0B1F3A] font-bold">
                Numbers checked by code
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Step Strip: The Dhaal Shield Pipeline */}
      <div className="mb-10">
        <div className="text-center max-w-xl mx-auto mb-6">
          <span className="font-mono text-xs uppercase tracking-wider text-[#2B4C9B] font-bold">
            The Dhaal Shield Pipeline
          </span>
          <h2 className="font-headline text-2xl font-bold text-[#0B1F3A] mt-1">
            From notice anxiety to audit-ready reply in three steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-card border border-[#E3E8F0] shadow-tier1 flex flex-col gap-3 hover:border-[#2B4C9B] transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-control bg-[#EFF4FF] text-[#0B1F3A] flex items-center justify-center font-headline text-lg font-bold">
                1
              </div>
              <span className="material-symbols-outlined text-[#2B4C9B] text-2xl">upload_file</span>
            </div>
            <h3 className="font-headline text-base font-bold text-[#0B1F3A]">Upload Document</h3>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              Drop any scanned notice or PDF. Dhaal strips personal tokens, extracts scrutiny tables, and validates statutory sections.
            </p>
            <span className="font-mono text-[11px] text-[#2B4C9B] font-semibold mt-auto pt-2 border-t border-[#E3E8F0]">
              Supports Form ASMT-10 in this version
            </span>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-card border border-[#E3E8F0] shadow-tier1 flex flex-col gap-3 hover:border-[#2B4C9B] transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-control bg-[#EFF4FF] text-[#0B1F3A] flex items-center justify-center font-headline text-lg font-bold">
                2
              </div>
              <span className="material-symbols-outlined text-[#2B4C9B] text-2xl">fact_check</span>
            </div>
            <h3 className="font-headline text-base font-bold text-[#0B1F3A]">Human & Code Verification</h3>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              Every figure is reconciled against return data. Uncertain values pause the pipeline for human confirmation before proceeding.
            </p>
            <span className="font-mono text-[11px] text-[#2B4C9B] font-semibold mt-auto pt-2 border-t border-[#E3E8F0]">
              Numbers checked by code
            </span>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-card border border-[#E3E8F0] shadow-tier1 flex flex-col gap-3 hover:border-[#2B4C9B] transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-control bg-[#EFF4FF] text-[#0B1F3A] flex items-center justify-center font-headline text-lg font-bold">
                3
              </div>
              <span className="material-symbols-outlined text-[#2B4C9B] text-2xl">verified</span>
            </div>
            <h3 className="font-headline text-base font-bold text-[#0B1F3A]">CA-Ready Brief</h3>
            <p className="text-xs text-[#5B6B82] leading-relaxed">
              Receive a synthesized legal brief with vernacular audio explanations, statutory deadlines, evidence tracker, and Form ASMT-11 draft.
            </p>
            <span className="font-mono text-[11px] text-[#2B4C9B] font-semibold mt-auto pt-2 border-t border-[#E3E8F0]">
              Exportable 1-Click Dossier
            </span>
          </div>
        </div>
      </div>

      {/* Trust Row Indicators */}
      <div className="bg-[#EFF4FF] p-4 rounded-card border border-[#CBD5E1] mb-10 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-[#2B4C9B] flex items-center justify-center shadow-2xs shrink-0 border border-[#CBD5E1]">
              <span className="material-symbols-outlined text-base">functions</span>
            </div>
            <span className="text-xs text-[#0B1F3A] font-semibold">
              Numbers checked by code
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-[#2B4C9B] flex items-center justify-center shadow-2xs shrink-0 border border-[#CBD5E1]">
              <span className="material-symbols-outlined text-base">pause_circle</span>
            </div>
            <span className="text-xs text-[#0B1F3A] font-semibold">
              Pause & Confirm checkpoint for ambiguous scans
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-[#2B4C9B] flex items-center justify-center shadow-2xs shrink-0 border border-[#CBD5E1]">
              <span className="material-symbols-outlined text-base">translate</span>
            </div>
            <span className="text-xs text-[#0B1F3A] font-semibold">
              Plain-language explanations in Hindi, Marathi & English
            </span>
          </div>
        </div>
      </div>

      {/* Main Drag-and-Drop Ingestion Canvas */}
      <div
        ref={uploadAnchorRef}
        id="upload-anchor"
        className="bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] p-6 sm:p-8 mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0B1F3A] text-2xl">
                security_update_good
              </span>
              <h2 className="font-headline text-2xl font-bold text-[#0B1F3A]">
                Ingest GST Notice
              </h2>
            </div>
            <p className="text-xs text-[#5B6B82] mt-1">
              Upload scanned documents, digital notice PDFs, or high-res photos from your mobile device.
            </p>
          </div>

          {/* Quick Sample Button */}
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-control bg-[#EFF4FF] hover:bg-[#DCE9FF] text-[#0B1F3A] text-xs font-semibold transition-colors border border-[#CBD5E1] shadow-2xs"
          >
            <span className="material-symbols-outlined text-base text-[#2B4C9B]">bolt</span>
            <span>Try with sample notice</span>
            <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-mono text-[10px] font-bold border border-[#FDE68A]">
              Sample data
            </span>
          </button>
        </div>

        {/* Dropzone Box */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative group cursor-pointer rounded-modal border-2 border-dashed transition-all p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 ${
            isDragOver
              ? 'border-[#2B4C9B] bg-[#EFF4FF] scale-[1.005]'
              : 'border-[#2B4C9B]/50 bg-[#F6F8FB] hover:bg-[#EFF4FF] hover:border-[#2B4C9B]'
          } ${upload.status === 'parsing' ? 'opacity-40 pointer-events-none' : ''}`}
        >
          {/* Shield Decorative Centerpiece */}
          <div className="w-16 h-16 rounded-2xl bg-white text-[#2B4C9B] flex items-center justify-center shadow-md border border-[#E3E8F0] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-3xl text-[#2B4C9B]">cloud_upload</span>
          </div>

          <div className="flex flex-col gap-1 max-w-md">
            <span className="font-headline text-base font-bold text-[#0B1F3A]">
              Drag & drop your GST Notice here, or{' '}
              <span className="text-[#2B4C9B] underline underline-offset-2">Browse Files</span>
            </span>
            <span className="text-xs text-[#5B6B82]">
              Supported file formats: PDF, JPG, PNG • Max single file size 25MB
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
            <span className="font-mono text-[10px] bg-white px-2.5 py-1 rounded-chip text-[#44474D] border border-[#CBD5E1]">
              Supports Form ASMT-10 in this version
            </span>
            <span className="font-mono text-[10px] bg-white px-2.5 py-1 rounded-chip text-[#44474D] border border-[#CBD5E1]">
              Multi-page OCR Ingestion
            </span>
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
          <div className="mt-4 p-3 rounded-card bg-[#FEE2E2] text-[#C0392B] text-xs font-semibold flex items-center gap-2 border border-[#FECACA]">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{fileValidationError}</span>
          </div>
        )}

        {/* STATE 1: Animated Parsing Progress Panel */}
        {upload.status === 'parsing' && (
          <div className="mt-6 p-6 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2B4C9B] text-white flex items-center justify-center animate-spin">
                  <span className="material-symbols-outlined text-base">autorenew</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-headline text-base font-bold text-[#0B1F3A]">
                    Parsing ASMT-10 Notice with Deterministic Pipeline...
                  </span>
                  <span className="text-xs text-[#5B6B82]">{upload.fileName}</span>
                </div>
              </div>
              <span className="font-mono text-base font-bold text-[#2B4C9B]">
                {upload.progress}%
              </span>
            </div>

            {/* Linear Progress Bar */}
            <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-[#CBD5E1]">
              <div
                className="h-full bg-[#2B4C9B] rounded-full transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              ></div>
            </div>

            {/* Checklist Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1">
              <div className="flex items-center gap-2 text-[#12805C] font-semibold">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>1. OCR Extracted</span>
              </div>
              <div className="flex items-center gap-2 text-[#12805C] font-semibold">
                <span className="material-symbols-outlined text-base">check_circle</span>
                <span>2. Fields Detected</span>
              </div>
              <div className="flex items-center gap-2 text-[#B45309] font-bold animate-pulse">
                <span className="material-symbols-outlined text-base">hourglass_top</span>
                <span>3. Pausing for confirmation on uncertain value</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-control bg-[#0B1F3A] text-white text-xs font-semibold hover:bg-[#2B4C9B] transition-colors"
              >
                Continue to Step 2
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: Unreadable Scan Error Alert (Simulated state) */}
        {upload.errorType === 'unreadable' && (
          <div className="mt-6 p-4 rounded-card bg-[#FEE2E2] text-[#C0392B] border border-[#FECACA] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#C0392B] text-2xl shrink-0 mt-0.5">
                document_scanner
              </span>
              <div className="flex flex-col">
                <span className="font-headline text-base font-bold text-[#C0392B]">
                  Unreadable Document Scan
                </span>
                <span className="text-xs text-[#0F172A] mt-0.5">
                  The tax discrepancy numbers on Page 2 are partially blurred or cropped. Dhaal will not guess tax liabilities.
                </span>
                <span className="font-mono text-[11px] mt-1 text-[#C0392B] font-semibold">
                  Suggested: Upload official PDF directly downloaded from the GST Portal (Services &gt; User Services &gt; View Notices).
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadError('none')}
              className="px-4 py-2 rounded-control bg-[#C0392B] text-white text-xs font-semibold shrink-0 shadow-sm hover:opacity-90 transition-opacity"
            >
              Try Higher Resolution
            </button>
          </div>
        )}

        {/* STATE 3: Unsupported Notice Type Warning (Simulated state) */}
        {upload.errorType === 'unsupported' && (
          <div className="mt-6 p-4 rounded-card bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[#B45309] text-2xl shrink-0 mt-0.5">
                help_outline
              </span>
              <div className="flex flex-col">
                <span className="font-headline text-base font-bold text-[#B45309]">
                  Unsupported Notice Detected: GSTR-3A / Return Default
                </span>
                <span className="text-xs text-[#0F172A] mt-0.5">
                  This appears to be an automated Form GSTR-3A non-filing reminder, not a scrutiny notice under Section 61 (ASMT-10).
                </span>
                <span className="font-mono text-[11px] mt-1 text-[#B45309] font-semibold">
                  Resolution: This reminder does not require an ASMT-11 written brief; simply file the pending return with late fees.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setUploadError('none');
                handleLoadSample();
              }}
              className="px-4 py-2 rounded-control bg-[#0B1F3A] text-white text-xs font-semibold shrink-0 shadow-sm hover:bg-[#2B4C9B] transition-colors"
            >
              Upload ASMT-10 Notice
            </button>
          </div>
        )}

        {/* Privacy & Honesty Simulation Note Box */}
        <div className="mt-6 p-4 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#2B4C9B] text-xl">lock</span>
            <div className="flex flex-col">
              <span className="text-xs text-[#0B1F3A] font-bold">
                Strict Client-Side Privacy Sandbox
              </span>
              <span className="text-[11px] text-[#5B6B82]">
                Demo build: extraction and AI checks are simulated on a sample notice. Nothing is transmitted or filed with the department.
              </span>
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#2B4C9B] bg-white border border-[#CBD5E1] px-2.5 py-1 rounded-chip font-bold shrink-0">
            DPDP Act Ready
          </span>
        </div>
      </div>

      {/* Interactive Edge States Simulator Panel (Demo Switcher) */}
      <div className="fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur-md rounded-card p-3 shadow-tier3 border border-[#E3E8F0] max-w-xs flex flex-col gap-2 demo-state-switcher">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#2B4C9B]">tune</span>
            <span className="font-mono text-[11px] text-[#0B1F3A] uppercase font-bold tracking-wider">
              Demo State Switcher
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#5B6B82]">Interactive</span>
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
                : 'bg-[#EFF4FF] text-[#0F172A] hover:bg-[#DCE9FF]'
            }`}
          >
            1. Default Drop
          </button>

          <button
            type="button"
            onClick={() => startUpload('FORM_GST_ASMT-10.pdf')}
            className={`px-2 py-1.5 rounded-control text-xs text-left font-medium transition-colors ${
              upload.status === 'parsing'
                ? 'bg-[#0B1F3A] text-white'
                : 'bg-[#EFF4FF] text-[#0F172A] hover:bg-[#DCE9FF]'
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
                : 'bg-[#EFF4FF] text-[#0F172A] hover:bg-[#DCE9FF]'
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
                : 'bg-[#EFF4FF] text-[#0F172A] hover:bg-[#DCE9FF]'
            }`}
          >
            4. Wrong Form
          </button>
        </div>
      </div>
    </div>
  );
};
