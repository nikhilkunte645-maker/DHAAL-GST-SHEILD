import React, { useState, useEffect, useMemo } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { Language } from '../data/i18n';
import { getUrgencyInfo, getRingDashOffset } from '../lib/deadline';
import { formatINR } from '../lib/format';
import { dhaalApi, ExplanationResponse } from '../mockApi';
import { RECONCILIATION_ROWS, downloadReconciliationCsv } from '../data/reconciliationData';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';

export const Screen3ExplainerDeadlines: React.FC = () => {
  const {
    language,
    setLanguage,
    daysLeftOverride,
    setDaysLeftOverride,
    confirmedAmount,
    setStep,
    setRawScanModalOpen,
  } = useDhaalStore();

  const [isQuoteHighlighted, setIsQuoteHighlighted] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [apiExplanation, setApiExplanation] = useState<ExplanationResponse | null>(null);

  // Reconciliation table state
  const [reconFilter, setReconFilter] = useState<'all' | 'unreported' | 'delayed' | 'classification'>('all');
  const [isReconExpanded, setIsReconExpanded] = useState(false);

  // Fetch live multilingual explanation from FastAPI endpoint
  useEffect(() => {
    dhaalApi
      .getExplanation(language)
      .then((data) => {
        setApiExplanation(data);
      })
      .catch((err) => {
        console.warn('[Dhaal API] Explanation fetch error:', err);
      });
  }, [language]);

  const amount = confirmedAmount || CANONICAL_DEMO_CASE.rows[1].difference;
  const urgency = getUrgencyInfo(daysLeftOverride);
  const ringOffset = getRingDashOffset(daysLeftOverride, 30);

  // Check speech synthesis voice availability
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const targetLang = language === 'hi' ? 'hi' : language === 'mr' ? 'mr' : 'en';
        const hasVoice = voices.some((v) => v.lang.startsWith(targetLang));
        setVoiceAvailable(hasVoice || voices.length > 0);
      };
      checkVoices();
      window.speechSynthesis.onvoiceschanged = checkVoices;
    } else {
      setVoiceAvailable(false);
    }
  }, [language]);

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    let textToSpeak = '';
    let voiceLang = 'en-IN';

    if (language === 'hi') {
      textToSpeak = `जीएसटी अधिकारी ने पाया कि आपने पहली तिमाही अप्रैल से जून 2024 के लिए GSTR-3B में आपके सप्लायर्स द्वारा GSTR-2B में दिखाए गए इनपुट टैक्स क्रेडिट से 1 लाख 84 हजार 250 रुपये अधिक क्लेम किया है।`;
      voiceLang = 'hi-IN';
    } else if (language === 'mr') {
      textToSpeak = `जीएसटी अधिकाऱ्यांच्या निदर्शनास आले आहे की तुम्ही एप्रिल ते जून 2024 या तिमाहीत GSTR-2B मधील रकमेपेक्षा 1 लाख 84 हजार 250 रुपये जास्त इनपुट टॅक्स क्रेडिट GSTR-3B मध्ये दाखवले आहे।`;
      voiceLang = 'mr-IN';
    } else {
      textToSpeak = `The GST officer noticed that you claimed 1 lakh 84 thousand 250 rupees more in Input Tax Credit on GSTR-3B than what your suppliers reported in GSTR-2B for Quarter 1, April to June 2024.`;
      voiceLang = 'en-IN';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang === voiceLang || v.lang.replace('_', '-').startsWith(voiceLang.split('-')[0]));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const badgeVariant =
    urgency.level === 'critical' ? 'danger' : urgency.level === 'caution' ? 'warning' : 'brand';

  // Filtered reconciliation rows
  const filteredRows = useMemo(() => {
    if (reconFilter === 'unreported') {
      return RECONCILIATION_ROWS.filter((r) => r.status === 'Unreported in 2B');
    }
    if (reconFilter === 'delayed') {
      return RECONCILIATION_ROWS.filter((r) => r.status === 'Delayed Filing');
    }
    if (reconFilter === 'classification') {
      return RECONCILIATION_ROWS.filter((r) => r.status === 'Classification Error');
    }
    return RECONCILIATION_ROWS;
  }, [reconFilter]);

  const displayedRows = isReconExpanded ? filteredRows : filteredRows.slice(0, 8);

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E4E9E5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-[#E7F4EE] text-[#087F73] border border-[#119B72]/30">
              STEP 3 OF 6
            </span>
            <span className="text-xs font-semibold text-[#687674]">
              {CANONICAL_DEMO_CASE.office.ward} ({CANONICAL_DEMO_CASE.office.division})
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold text-[#073B3A] tracking-tight mt-1">
            Financial Reconciliation &amp; Statutory Deadlines
          </h1>
          <p className="text-xs sm:text-sm text-[#687674] mt-0.5">
            Independent itemized comparison of Form GSTR-3B Table 4(A)(5) vs Form GSTR-2B • Discrepancy Breakdown
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="download"
            onClick={downloadReconciliationCsv}
            title="Download reconciliation spreadsheet"
          >
            Export CSV
          </Button>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-[#E4E9E5] shadow-xs">
            <span className="text-xs text-[#687674]">Questioned:</span>
            <span className="font-mono text-sm font-bold text-[#C0392B]">
              {formatINR(amount, true)}
            </span>
          </div>
        </div>
      </div>

      {/* 1. FINANCIAL SUMMARY CARDS (Mercury / Ramp Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Your Records (GSTR-3B Claimed) */}
        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#687674] uppercase tracking-wider">
                Your Records (GSTR-3B)
              </span>
              <span className="material-symbols-outlined text-lg text-[#087F73]">receipt_long</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#152B2A] tracking-tight">
              ₹14,92,450.00
            </div>
            <span className="text-[11px] text-[#687674] mt-1 block">
              Table 4(A)(5) All Other ITC Claimed
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E5] flex items-center justify-between text-xs">
            <span className="text-[#687674]">Return Status</span>
            <span className="font-semibold text-[#119B72]">Filed &amp; Accounted</span>
          </div>
        </Card>

        {/* Card 2: Portal Records (GSTR-2B Available) */}
        <Card variant="default" padding="md" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#687674] uppercase tracking-wider">
                GST Portal (GSTR-2B)
              </span>
              <span className="material-symbols-outlined text-lg text-[#087F73]">cloud_done</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#152B2A] tracking-tight">
              ₹13,08,200.00
            </div>
            <span className="text-[11px] text-[#687674] mt-1 block">
              Eligible Inward Supplies Reflected
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E5] flex items-center justify-between text-xs">
            <span className="text-[#687674]">Auto-population</span>
            <span className="font-semibold text-[#687674]">Static Cut-off Date</span>
          </div>
        </Card>

        {/* Card 3: Discrepancy / Questioned Gap */}
        <Card variant="default" padding="md" className="flex flex-col justify-between border-[#FECACA] bg-[#FEF2F2]/40">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#C0392B] uppercase tracking-wider">
                Alleged Discrepancy
              </span>
              <span className="material-symbols-outlined text-lg text-[#C0392B]">warning</span>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold text-[#C0392B] tracking-tight">
              ₹1,84,250.00
            </div>
            <span className="text-[11px] text-[#C0392B] mt-1 block font-medium">
              Form ASMT-10 Row 02 Allegation
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#FECACA] flex items-center justify-between text-xs">
            <span className="text-[#C0392B]">Variance Ratio</span>
            <span className="font-bold text-[#C0392B]">12.35% Excess ITC</span>
          </div>
        </Card>

        {/* Card 4: Reconciliation Audit Status */}
        <Card variant="default" padding="md" className="flex flex-col justify-between border-[#119B72]/40 bg-[#E7F4EE]/40">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#087F73] uppercase tracking-wider">
                Audit Resolution
              </span>
              <span className="material-symbols-outlined text-lg text-[#119B72]">fact_check</span>
            </div>
            <div className="font-headline text-xl sm:text-2xl font-bold text-[#073B3A] tracking-tight">
              24 Invoices
            </div>
            <span className="text-[11px] text-[#087F73] mt-1 block font-medium">
              Substantiated via Circular 183
            </span>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#119B72]/30 flex items-center justify-between text-xs">
            <span className="text-[#087F73]">Defense Readiness</span>
            <span className="font-bold text-[#119B72]">100% Traceable</span>
          </div>
        </Card>
      </div>

      {/* 2. ITEMISED RECONCILIATION LEDGER TABLE (Ramp / Mercury Pattern) */}
      <Card variant="default" padding="none" className="mb-8 overflow-hidden">
        {/* Table Header Bar with Filters */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E4E9E5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xl text-[#087F73]">table_chart</span>
              <h2 className="font-headline text-base sm:text-lg font-bold text-[#073B3A]">
                Itemized Reconciliation Ledger
              </h2>
              <Badge variant="brand" size="sm" className="font-mono">
                {filteredRows.length} Vouchers
              </Badge>
            </div>
            <p className="text-xs text-[#687674] mt-0.5">
              Invoice-level mathematical cross-reference against vendor M/s Apex Textiles (GSTIN: 27XXXXX5678X1ZX)
            </p>
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${RECONCILIATION_ROWS.length})` },
              { id: 'unreported', label: 'Unreported in 2B (12)' },
              { id: 'delayed', label: 'Delayed Filing (11)' },
              { id: 'classification', label: 'Classification Error (1)' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setReconFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[44px] sm:min-h-[36px] flex items-center justify-center ${
                  reconFilter === f.id
                    ? 'bg-[#073B3A] text-white shadow-xs'
                    : 'bg-[#FAF9F5] text-[#687674] hover:bg-[#E4E9E5] hover:text-[#073B3A] border border-[#E4E9E5]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF9F5] text-[#687674] border-b border-[#E4E9E5] font-semibold">
                <th className="py-3 px-4 font-mono w-12 text-center">#</th>
                <th className="py-3 px-4">Invoice Number</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4 text-right">Taxable Val</th>
                <th className="py-3 px-4 text-right">GSTR-3B Claimed</th>
                <th className="py-3 px-4 text-right">GSTR-2B Available</th>
                <th className="py-3 px-4 text-right">Difference</th>
                <th className="py-3 px-4 text-center">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E9E5] bg-white">
              {displayedRows.map((row) => (
                <tr key={row.srNo} className="hover:bg-[#FAF9F5] transition-colors">
                  <td className="py-2.5 px-4 font-mono text-center text-[#687674]">
                    {row.srNo < 10 ? `0${row.srNo}` : row.srNo}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-[#073B3A]">
                    {row.invoiceNo}
                  </td>
                  <td className="py-2.5 px-4 text-[#687674] whitespace-nowrap">
                    {row.invoiceDate}
                  </td>
                  <td className="py-2.5 px-4 text-[#152B2A] max-w-[180px] truncate" title={row.supplierName}>
                    {row.supplierName}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#687674]">
                    {formatINR(row.taxableValue)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#152B2A]">
                    {formatINR(row.claimedItc)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#687674]">
                    {formatINR(row.available2b)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-[#C0392B]">
                    +{formatINR(row.difference)}
                  </td>
                  <td className="py-2.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Delayed Filing'
                          ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                          : row.status === 'Classification Error'
                          ? 'bg-[#E7F4EE] text-[#087F73] border border-[#119B72]/30'
                          : 'bg-[#FEF2F2] text-[#C0392B] border border-[#FECACA]'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#FAF9F5] font-bold border-t-2 border-[#E4E9E5] text-[#152B2A]">
                <td colSpan={5} className="py-3 px-4 text-right font-headline">
                  TOTAL AUDITED DIFFERENCE (24 Invoices):
                </td>
                <td className="py-3 px-4 text-right font-mono text-[#073B3A]">
                  ₹1,84,250.00
                </td>
                <td className="py-3 px-4 text-right font-mono text-[#687674]">
                  ₹0.00
                </td>
                <td className="py-3 px-4 text-right font-mono text-[#C0392B]">
                  ₹1,84,250.00
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge variant="success" size="sm">
                    Reconciled
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Expand / Collapse Button & CSV Download */}
        <div className="p-3 bg-white border-t border-[#E4E9E5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setIsReconExpanded(!isReconExpanded)}
            className="text-[#087F73] font-bold hover:underline flex items-center gap-1.5 min-h-[44px] py-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] rounded-lg"
          >
            <span className="material-symbols-outlined text-base">
              {isReconExpanded ? 'unfold_less' : 'unfold_more'}
            </span>
            <span>
              {isReconExpanded
                ? `Collapse view (showing all ${filteredRows.length})`
                : `View all ${filteredRows.length} vouchers (+${filteredRows.length - displayedRows.length} more)`}
            </span>
          </button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon="table_view"
            onClick={downloadReconciliationCsv}
            className="w-full sm:w-auto"
          >
            Download Full Itemized Schedule (CSV)
          </Button>
        </div>
      </Card>

      {/* 3. STATUTORY COUNTDOWN & MULTILINGUAL EXPLAINER WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT COLUMN: Statutory Countdown & Urgency (5 cols on xl) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <Card variant="default" padding="lg" className="relative overflow-hidden">
            {/* Top Accent Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 transition-colors"
              style={{ backgroundColor: urgency.barColor }}
            />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#687674] uppercase tracking-wider">
                Statutory Defense Window
              </span>
              <Badge variant={badgeVariant} size="sm">
                {urgency.label}
              </Badge>
            </div>

            {/* SVG Countdown Ring */}
            <div className="flex flex-col items-center justify-center my-2">
              <div className="relative w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  {/* Track ring */}
                  <circle
                    cx="80"
                    cy="80"
                    fill="none"
                    r="68"
                    stroke="#E7F4EE"
                    strokeWidth="12"
                  />
                  {/* Active Arc */}
                  <circle
                    cx="80"
                    cy="80"
                    fill="none"
                    r="68"
                    stroke={urgency.barColor}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="427.26"
                    strokeDashoffset={ringOffset}
                    className="transition-all duration-500"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-[#D97706] font-bold">
                    {urgency.isExpired ? 'STATUS' : urgency.isDueToday ? 'ACTION' : 'T-Minus'}
                  </span>
                  <span className="font-headline text-4xl font-bold text-[#073B3A] tracking-tight">
                    {daysLeftOverride < 0 ? '0' : daysLeftOverride}
                  </span>
                  <span className="text-xs text-[#073B3A] font-bold -mt-1">
                    {urgency.isExpired ? 'EXPIRED' : urgency.isDueToday ? 'DUE TODAY' : 'DAYS LEFT'}
                  </span>
                  <span className="text-[11px] text-[#687674] mt-0.5">
                    {urgency.isExpired ? 'Statutory window elapsed' : urgency.isDueToday ? 'Submit response today' : 'out of 30 days'}
                  </span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="font-headline text-lg font-bold text-[#073B3A]">
                  {CANONICAL_DEMO_CASE.replyDeadline}
                </p>
                <p className="text-xs text-[#687674]">
                  Statutory Deadline under Rule 99(1) CGST Rules, 2017
                </p>
              </div>
            </div>

            {/* Urgency Scale Bar */}
            <div className="flex flex-col gap-2 pt-4 mt-2 bg-[#FAF9F5] p-4 rounded-xl border border-[#E4E9E5]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#687674] font-semibold">
                  Statutory Urgency Track
                </span>
                <span className="text-[10px] text-[#687674] italic">
                  (interactive preview slider)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 h-2.5 rounded-full overflow-hidden bg-white p-0.5 border border-[#E4E9E5]">
                <div
                  className={`rounded-l-full transition-opacity ${
                    urgency.level === 'normal' ? 'bg-[#087F73]' : 'bg-[#087F73]/30'
                  }`}
                  title="Normal: 30-15 days"
                />
                <div
                  className={`rounded-xs transition-opacity ${
                    urgency.level === 'caution' ? 'bg-[#D97706]' : 'bg-[#D97706]/30'
                  }`}
                  title="Caution: 14-7 days"
                />
                <div
                  className={`rounded-r-full transition-opacity ${
                    urgency.level === 'critical' || urgency.level === 'expired' || urgency.level === 'due_today' ? 'bg-[#C0392B]' : 'bg-[#C0392B]/30'
                  }`}
                  title="Critical: < 7 days / Due / Expired"
                />
              </div>

              <div className="grid grid-cols-3 text-center pt-0.5 text-[10px]">
                <span className={urgency.level === 'normal' ? 'font-bold text-[#087F73]' : 'text-[#687674]'}>
                  Normal (30-15d)
                </span>
                <span className={urgency.level === 'caution' ? 'font-bold text-[#D97706]' : 'text-[#687674]'}>
                  Caution (14-7d)
                </span>
                <span className={urgency.level === 'critical' ? 'font-bold text-[#C0392B]' : 'text-[#687674]'}>
                  Critical (&lt;7d)
                </span>
              </div>

              {/* Slider for Urgency scrubbing */}
              <div className="mt-3 pt-3 border-t border-[#E4E9E5] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="urgency-slider" className="text-[11px] font-bold text-[#073B3A] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#087F73]">tune</span>
                    <span>Preview urgency (Demo slider):</span>
                  </label>
                  <span className="font-mono text-xs font-bold text-[#087F73]">
                    {daysLeftOverride} days
                  </span>
                </div>
                <div className="py-1 flex items-center min-h-[44px]">
                  <input
                    id="urgency-slider"
                    type="range"
                    min="1"
                    max="30"
                    value={daysLeftOverride}
                    onChange={(e) => setDaysLeftOverride(parseInt(e.target.value, 10))}
                    className="w-full accent-[#087F73] cursor-pointer min-h-[44px] h-[44px] sm:min-h-[36px] sm:h-[36px]"
                    aria-label="Urgency slider"
                  />
                </div>
              </div>
            </div>

            {/* Consequence note */}
            <div className="mt-4 p-3 bg-[#FEF2F2] rounded-xl border-l-4 border-l-[#C0392B] flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#C0392B] text-lg shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#C0392B] uppercase tracking-wide">
                  Timely Response Guidance
                </span>
                <p className="text-xs text-[#152B2A] mt-0.5 leading-relaxed">
                  If no reply is filed by 13-Jun-2025, the officer may proceed with issuance of Show Cause Notice under Section 73/74. Timely submission of Form ASMT-11 protects your credit rights.
                </p>
              </div>
            </div>
          </Card>

          {/* Attached Scrutiny Notice Card with Raw Scan Launcher */}
          <Card variant="default" padding="md" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#687674]">
                Attached Scrutiny Notice
              </span>
              <Badge variant="brand" size="sm">
                PDF • Signed
              </Badge>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E9E5]">
              <div className="w-11 h-13 bg-white rounded-lg shadow-2xs flex flex-col items-center justify-center p-1 shrink-0 border border-[#E4E9E5]">
                <span className="material-symbols-outlined text-[#087F73] text-xl">description</span>
                <span className="text-[9px] font-mono text-[#687674] mt-0.5">ASMT-10</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#073B3A] truncate font-mono">
                  {CANONICAL_DEMO_CASE.noticeRef}.pdf
                </span>
                <span className="text-[10px] text-[#687674]">
                  Proper Officer • Ward 102
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRawScanModalOpen(true)}
                    className="text-xs font-semibold text-[#087F73] hover:underline flex items-center gap-1 min-h-[44px] py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] rounded-lg"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>View Raw Scan</span>
                  </button>
                  <span className="text-[#687674] text-xs">•</span>
                  <span className="text-[11px] text-[#687674]">Vector PDF</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Plain-Language Explainer & Clarity Checklist (7 cols on xl) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Multilingual Explainer Card */}
          <Card variant="default" padding="lg">
            {/* Header with Language Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E9E5]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F73] text-2xl">translate</span>
                <div>
                  <h2 className="font-headline text-lg font-bold text-[#073B3A]">
                    Plain-Language Explanation
                  </h2>
                  <p className="text-xs text-[#687674]">
                    Allegations translated into simple vernacular terms
                  </p>
                </div>
              </div>

              {/* Language Switcher Tabs */}
              <div className="inline-flex bg-[#FAF9F5] p-1 rounded-lg border border-[#E4E9E5] self-start sm:self-auto">
                {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 sm:py-1 rounded text-xs transition-all min-h-[44px] sm:min-h-[34px] font-semibold flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] ${
                      language === lang
                        ? 'bg-white text-[#073B3A] font-bold shadow-2xs border border-[#E4E9E5]'
                        : 'text-[#687674] hover:text-[#073B3A]'
                    }`}
                    lang={lang}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'मराठी'}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Explainer Box */}
            <div
              onMouseEnter={() => setIsQuoteHighlighted(true)}
              onMouseLeave={() => setIsQuoteHighlighted(false)}
              onFocus={() => setIsQuoteHighlighted(true)}
              onBlur={() => setIsQuoteHighlighted(false)}
              tabIndex={0}
              className="p-4 sm:p-5 bg-[#FAF9F5] rounded-xl border border-[#E4E9E5] my-4 focus:ring-2 focus:ring-[#087F73] transition-all"
            >
              {language === 'en' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#087F73]" />
                    <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">
                      What the Officer Is Saying (English)
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-[#152B2A] leading-relaxed font-medium">
                    &quot;The GST officer noticed that you claimed{' '}
                    <strong className="text-[#C0392B] bg-[#FEF2F2] px-1.5 py-0.5 rounded font-mono font-bold">
                      ₹1,84,250 more
                    </strong>{' '}
                    in Input Tax Credit (ITC) on GSTR-3B than what your suppliers reported in GSTR-2B for Q1 (Apr–Jun 2024).&quot;
                  </p>
                  <p className="text-xs text-[#687674] mt-1 leading-relaxed">
                    Under Section 16(2)(aa) read with Section 61, the department questions this difference. However, CBIC Circular 183 allows you to reconcile supplies with valid tax invoices, bank remittances, and vendor declarations.
                  </p>
                </div>
              )}

              {language === 'hi' && (
                <div className="flex flex-col gap-2" lang="hi">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#087F73]" />
                    <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">
                      अधिकारी का क्या कहना है (सरल हिन्दी में)
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-[#152B2A] leading-[1.75]">
                    &quot;जीएसटी अधिकारी ने पाया कि आपने पहली तिमाही (अप्रैल-जून 2024) के लिए{' '}
                    <strong className="text-[#073B3A] font-bold font-mono">GSTR-3B</strong> में आपके सप्लायर्स द्वारा{' '}
                    <strong className="text-[#073B3A] font-bold font-mono">GSTR-2B</strong> में दिखाए गए इनपुट टैक्स क्रेडिट (ITC) से{' '}
                    <strong className="text-[#C0392B] bg-[#FEF2F2] px-1.5 py-0.5 rounded font-mono font-bold">
                      ₹1,84,250 अधिक क्लेम
                    </strong>{' '}
                    किया है।&quot;
                  </p>
                  <p className="text-xs text-[#687674] mt-1 leading-[1.75]">
                    इसका सीधा मतलब है कि वेंडर ने अपनी आउटवर्ड रिटर्न देर से भरी है। सर्कुलर 183 के तहत वैध इनवॉइस और बैंक स्टेटमेंट से इसे पूरी तरह साबित किया जा सकता है।
                  </p>
                </div>
              )}

              {language === 'mr' && (
                <div className="flex flex-col gap-2" lang="mr">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#087F73]" />
                    <span className="text-xs uppercase tracking-wider text-[#087F73] font-bold">
                      जीएसटी अधिकाऱ्यांचे म्हणणे काय आहे (मराठीत)
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-[#152B2A] leading-[1.75]">
                    &quot;जीएसटी अधिकाऱ्यांच्या निदर्शनास आले आहे की तुम्ही एप्रिल-जून २०२४ या तिमाहीत{' '}
                    <strong className="text-[#073B3A] font-bold font-mono">GSTR-2B</strong> मधील रकमेपेक्षा{' '}
                    <strong className="text-[#C0392B] bg-[#FEF2F2] px-1.5 py-0.5 rounded font-mono font-bold">
                      ₹१,८४,२५० जास्त
                    </strong>{' '}
                    इनपुट टॅक्स क्रेडिट (ITC){' '}
                    <strong className="text-[#073B3A] font-bold font-mono">GSTR-3B</strong> मध्ये दाखवले आहे।&quot;
                  </p>
                  <p className="text-xs text-[#687674] mt-1 leading-[1.75]">
                    याचा अर्थ असा की पुरवठादाराने वेळेत रिटर्न दाखल केले नाही. सर्कुलर 183 नुसार खरेदी पावती व बँक पुराव्यानिशी समाधानकारक उत्तर देता येते.
                  </p>
                </div>
              )}

              {/* Audio Listen Assist */}
              <div className="mt-4 pt-3 border-t border-[#E4E9E5] flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant={isPlayingAudio ? 'primary' : 'secondary'}
                  size="sm"
                  icon={isPlayingAudio ? 'stop_circle' : 'volume_up'}
                  onClick={handleSpeak}
                  disabled={!voiceAvailable}
                  title={voiceAvailable ? 'Play spoken explanation' : 'Voice synthesis not supported on this device'}
                  className={isPlayingAudio ? 'bg-[#087F73] text-white hover:bg-[#119B72]' : ''}
                >
                  {isPlayingAudio ? 'Stop Listening' : 'Listen to Explanation'}
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#687674]">
                    Language: <span className="font-bold text-[#073B3A]">{language === 'hi' ? 'Hindi (hi-IN)' : language === 'mr' ? 'Marathi (mr-IN)' : 'English (en-IN)'}</span>
                  </span>
                  <Badge variant="neutral" size="sm">
                    Web Speech API
                  </Badge>
                </div>
              </div>
            </div>

            {/* Source-Sentence Grounding Quote Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isQuoteHighlighted
                  ? 'bg-[#FEF3C7] border-[#F59E0B] shadow-2xs'
                  : 'bg-[#FAF9F5] border-[#E4E9E5]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#073B3A] text-base">format_quote</span>
                  <span className="text-[11px] text-[#073B3A] uppercase font-bold tracking-wider">
                    Verbatim Quote from Scanned Notice ASMT-10
                  </span>
                </div>
                <span className="text-xs text-[#687674] font-semibold">
                  Para 2(b) • Row 02
                </span>
              </div>

              <blockquote className="p-3 bg-white rounded-lg font-mono text-xs text-[#152B2A] leading-relaxed border border-[#E4E9E5]">
                {apiExplanation?.source_citation ||
                  `"Discrepancy in ITC claimed under Table 4(A)(5) of GSTR-3B vs ITC available in GSTR-2B, amounting to ₹1,84,250 u/s 16(2)(aa) read with Section 61 of the CGST Act, 2017."`}
              </blockquote>

              <div className="flex items-center justify-between text-xs text-[#687674] pt-2">
                <span>
                  Statutory Ground: <strong>Section 16(2)(aa)</strong> (Invoice Furnishing Requirement)
                </span>
                <button
                  type="button"
                  onClick={() => setRawScanModalOpen(true)}
                  className="text-[#087F73] font-bold hover:underline flex items-center gap-1 min-h-[44px] py-2 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087F73] rounded-lg"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>View Raw Scan</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Clarity Checklist: What This Notice IS vs IS NOT */}
          <Card variant="default" padding="lg" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F73] text-2xl">balance</span>
                <div>
                  <h2 className="font-headline text-lg font-bold text-[#073B3A]">
                    Clarity Checklist: What This Scrutiny Means
                  </h2>
                  <p className="text-xs text-[#687674]">
                    Prevent panic-driven mistakes with factual statutory positioning
                  </p>
                </div>
              </div>
              <Badge variant="brand" size="sm" className="hidden sm:inline-flex">
                Pre-Adjudication
              </Badge>
            </div>

            {/* 2-Column Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* What this IS */}
              <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#E4E9E5] flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[#073B3A] font-bold">
                  <div className="w-5 h-5 rounded-full bg-[#119B72] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </div>
                  <span className="font-headline text-sm font-bold text-[#073B3A]">
                    What this notice IS
                  </span>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-[#152B2A] pt-1">
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#119B72] text-base shrink-0">check_circle</span>
                    <span><strong>An invitation to explain:</strong> The tax officer has observed an arithmetic mismatch and seeks your ledger explanation under Rule 99(1).</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#119B72] text-base shrink-0">check_circle</span>
                    <span><strong>No penalty finalized:</strong> No demand or penalty has been decreed under Form DRC-07 against Sharma Garments.</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#119B72] text-base shrink-0">check_circle</span>
                    <span><strong>Completely resolvable:</strong> Filing Form ASMT-11 with invoice reconciliation drops legitimate mismatches under Rule 99(2).</span>
                  </li>
                </ul>
              </div>

              {/* What this IS NOT */}
              <div className="p-4 rounded-xl bg-[#FEF2F2]/50 border border-[#FECACA] flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[#C0392B] font-bold">
                  <div className="w-5 h-5 rounded-full bg-[#C0392B] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs font-bold">close</span>
                  </div>
                  <span className="font-headline text-sm font-bold text-[#C0392B]">
                    What this notice IS NOT
                  </span>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-[#152B2A] pt-1">
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#C0392B] text-base shrink-0">cancel</span>
                    <span><strong>NOT a Tax Demand Order:</strong> This is NOT an order under Form DRC-07 or an immediate recovery notice.</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#C0392B] text-base shrink-0">cancel</span>
                    <span><strong>Bank accounts NOT frozen:</strong> The department has NOT attached accounts under Section 83. Business operations remain normal.</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#C0392B] text-base shrink-0">cancel</span>
                    <span><strong>Do NOT pay rashly:</strong> You do NOT have to deposit ₹1,84,250 immediately via DRC-03 before verifying vendor filings.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Strategic Action Tip */}
            <div className="p-3 bg-[#FAF9F5] rounded-xl border border-[#E4E9E5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#087F73] text-base">lightbulb</span>
                <span className="text-[#073B3A]">
                  <strong>Recommended action:</strong> Verify the 24 purchase vouchers before submitting the CA audit brief.
                </span>
              </div>
              <span className="text-[11px] text-[#687674] font-semibold">
                Estimated CA Brief Prep: 8 mins
              </span>
            </div>
          </Card>

          {/* Bottom Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Button
              type="button"
              variant="secondary"
              icon="arrow_back"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto"
            >
              Back to Notice Review
            </Button>

            <Button
              type="button"
              variant="primary"
              icon="arrow_forward"
              iconPosition="right"
              onClick={() => setStep(4)}
              className="w-full sm:w-auto bg-[#073B3A] hover:bg-[#087F73]"
            >
              Proceed to Evidence Checklist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
