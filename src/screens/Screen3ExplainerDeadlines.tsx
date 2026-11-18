import React, { useState, useEffect } from 'react';
import { useDhaalStore } from '../store/useDhaalStore';
import { CANONICAL_DEMO_CASE } from '../data/demoCase';
import { Language } from '../data/i18n';
import { getUrgencyInfo, getRingDashOffset } from '../lib/deadline';
import { formatINR } from '../lib/format';
import { dhaalApi, ExplanationResponse } from '../mockApi';

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

  // Fetch live multilingual explanation from FastAPI endpoint
  useEffect(() => {
    dhaalApi.getExplanation(language).then((data) => {
      setApiExplanation(data);
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
      textToSpeak = `जीएसटी अधिकाऱ्यांच्या निदर्शनास आले आहे की तुम्ही एप्रिल ते जून 2024 या तिमाहीत GSTR-2B मधील रकमेपेक्षा 1 लाख 84 हजार 250 रुपये जास्त इनपुट टॅक्स क्रेडिट GSTR-3B मध्ये दाखवले आहे.`;
      voiceLang = 'mr-IN';
    } else {
      textToSpeak = `The GST officer noticed that you claimed 1 lakh 84 thousand 250 rupees more in Input Tax Credit on GSTR-3B than what your suppliers reported in GSTR-2B for Quarter 1, April to June 2024.`;
      voiceLang = 'en-IN';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;

    // Pick best matching voice if available
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

  return (
    <div className="flex flex-col w-full pb-16">
      {/* Top Header Context */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#EFF4FF] p-3 rounded-xl border border-[#CBD5E1]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-[#0B1F3A] bg-white px-2.5 py-1 rounded-full border border-[#E3E8F0] shadow-2xs">
            STAGE 03 OF 06
          </span>
          <span className="text-xs font-semibold text-[#0B1F3A]">
            Explain & Statutory Deadlines
          </span>
          <span className="text-xs text-[#5B6B82] hidden sm:inline">•</span>
          <span className="text-xs text-[#5B6B82] hidden sm:inline">
            {CANONICAL_DEMO_CASE.office.ward} ({CANONICAL_DEMO_CASE.office.division})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5B6B82]">Amount Questioned:</span>
          <span className="font-mono text-sm font-bold text-[#0B1F3A] bg-white px-2 py-0.5 rounded border border-[#CBD5E1]">
            {formatINR(amount, true)}
          </span>
        </div>
      </div>

      {/* Main Grid: Left Column Countdown + Right Column Explainer */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Statutory Countdown & Urgency (5 cols on xl) */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] p-6 flex flex-col relative overflow-hidden">
            {/* Top Accent Bar */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5 transition-colors"
              style={{ backgroundColor: urgency.barColor }}
            ></div>

            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-bold text-[#5B6B82] uppercase tracking-wider">
                Statutory Defense Window
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold shadow-2xs ${urgency.badgeClass}`}
              >
                {urgency.label}
              </span>
            </div>

            {/* SVG Countdown Ring */}
            <div className="flex flex-col items-center justify-center my-2">
              <div className="relative w-52 h-52 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                  {/* Track ring */}
                  <circle
                    cx="80"
                    cy="80"
                    fill="none"
                    r="68"
                    stroke="#EFF4FF"
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
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#B45309] font-bold">
                    T-Minus
                  </span>
                  <span className="font-headline text-4xl font-bold text-[#0B1F3A] tracking-tight">
                    {daysLeftOverride}
                  </span>
                  <span className="font-mono text-xs text-[#0B1F3A] font-bold -mt-1">
                    DAYS LEFT
                  </span>
                  <span className="text-[11px] text-[#5B6B82] mt-0.5">
                    out of 30 days
                  </span>
                </div>
              </div>

              <div className="mt-3 text-center">
                <p className="font-headline text-lg font-bold text-[#0B1F3A]">
                  {CANONICAL_DEMO_CASE.replyDeadline}
                </p>
                <p className="font-mono text-xs text-[#5B6B82]">
                  Formal Deadline u/r 99(1) CGST Rules, 2017
                </p>
              </div>
            </div>

            {/* Urgency Scale Bar */}
            <div className="flex flex-col gap-2 pt-4 mt-2 bg-[#EFF4FF] p-4 rounded-card border border-[#CBD5E1]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5B6B82] font-semibold">
                  Statutory Urgency Track
                </span>
                <span className="font-mono text-[10px] text-[#5B6B82] italic">
                  (interface states, not legal classifications)
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 h-3 rounded-full overflow-hidden bg-white p-0.5 border border-[#CBD5E1]">
                <div
                  className={`rounded-l-full transition-opacity ${
                    urgency.level === 'normal' ? 'bg-[#3b5baa]' : 'bg-[#3b5baa]/30'
                  }`}
                  title="Normal: 30-15 days"
                ></div>
                <div
                  className={`rounded-xs transition-opacity ${
                    urgency.level === 'caution' ? 'bg-[#F59E0B]' : 'bg-[#F59E0B]/30'
                  }`}
                  title="Caution: 14-7 days"
                ></div>
                <div
                  className={`rounded-r-full transition-opacity ${
                    urgency.level === 'critical' ? 'bg-[#C0392B]' : 'bg-[#C0392B]/30'
                  }`}
                  title="Critical: < 7 days"
                ></div>
              </div>

              <div className="grid grid-cols-3 text-center pt-0.5 font-mono text-[10px]">
                <span className={urgency.level === 'normal' ? 'font-bold text-[#2B4C9B]' : 'text-[#75777E]'}>
                  Normal (30-15d)
                </span>
                <span className={urgency.level === 'caution' ? 'font-bold text-[#B45309]' : 'text-[#75777E]'}>
                  Caution (14-7d)
                </span>
                <span className={urgency.level === 'critical' ? 'font-bold text-[#C0392B]' : 'text-[#75777E]'}>
                  Critical (&lt;7d)
                </span>
              </div>

              {/* Demo Slider for Urgency scrubbing */}
              <div className="mt-3 pt-3 border-t border-[#CBD5E1] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="urgency-slider" className="text-[11px] font-bold text-[#0B1F3A] flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-[#2B4C9B]">tune</span>
                    <span>Preview urgency (Demo-only slider):</span>
                  </label>
                  <span className="font-mono text-xs font-bold text-[#2B4C9B]">
                    {daysLeftOverride} days
                  </span>
                </div>
                <input
                  id="urgency-slider"
                  type="range"
                  min="1"
                  max="30"
                  value={daysLeftOverride}
                  onChange={(e) => setDaysLeftOverride(parseInt(e.target.value, 10))}
                  className="w-full accent-[#2B4C9B] cursor-pointer"
                />
              </div>
            </div>

            {/* Consequence note (Honesty rule applied) */}
            <div className="mt-4 p-3.5 bg-[#FEE2E2]/60 rounded-card border-l-accent-danger flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[#C0392B] text-lg shrink-0 mt-0.5">
                warning
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#C0392B] uppercase tracking-wide">
                  Timely Response Guidance
                </span>
                <p className="text-xs text-[#0F172A] mt-0.5 leading-relaxed">
                  If no reply is filed by the date above, the officer may proceed with further action under the Act. Confirm consequences with your CA.
                </p>
              </div>
            </div>
          </div>

          {/* Attached Scrutiny Notice Card with Raw Scan Launcher */}
          <div className="bg-white rounded-modal shadow-tier1 border border-[#E3E8F0] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#5B6B82]">
                Attached Scrutiny Notice
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#EFF4FF] text-[#2B4C9B] border border-[#CBD5E1]">
                PDF • Signed
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[#EFF4FF] rounded-card border border-[#CBD5E1]">
              <div className="w-12 h-14 bg-white rounded shadow-2xs flex flex-col items-center justify-center p-1 shrink-0 border border-[#CBD5E1]">
                <span className="material-symbols-outlined text-[#2B4C9B] text-xl">description</span>
                <span className="font-mono text-[9px] text-[#5B6B82] mt-0.5">ASMT-10</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-[#0B1F3A] truncate font-mono">
                  {CANONICAL_DEMO_CASE.noticeRef}.pdf
                </span>
                <span className="font-mono text-[10px] text-[#5B6B82]">
                  Proper Officer • Ward 102
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRawScanModalOpen(true)}
                    className="text-xs font-semibold text-[#2B4C9B] hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    <span>View Raw Scan</span>
                  </button>
                  <span className="text-[#5B6B82] text-xs">•</span>
                  <span className="text-[11px] text-[#5B6B82]">Vector PDF</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Plain-Language Explainer & IS/IS-NOT Contrast (7 cols on xl) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* Multilingual Explainer Card */}
          <div className="bg-white rounded-modal shadow-tier2 border border-[#E3E8F0] p-6">
            {/* Header with Language Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B] text-2xl">translate</span>
                <div>
                  <h2 className="font-headline text-lg font-bold text-[#0B1F3A]">
                    Plain-Language Explanation
                  </h2>
                  <p className="text-xs text-[#5B6B82]">
                    Bureaucratic allegations explained in simple vernacular terms
                  </p>
                </div>
              </div>

              {/* Language Switcher Tabs */}
              <div className="inline-flex bg-[#EFF4FF] p-1 rounded-lg border border-[#CBD5E1] self-start sm:self-auto">
                {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      language === lang
                        ? 'bg-[#0B1F3A] text-white font-bold shadow-2xs'
                        : 'text-[#5B6B82] hover:text-[#0B1F3A]'
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
              className="p-5 bg-[#EFF4FF] rounded-card border border-[#CBD5E1] my-4 focus:ring-2 focus:ring-[#2B4C9B] transition-all"
            >
              {language === 'en' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2B4C9B]"></span>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#2B4C9B] font-bold">
                      What the Officer Is Saying (English)
                    </span>
                  </div>
                  <p className="text-base text-[#0B1F3A] leading-relaxed font-medium">
                    &quot;The GST officer noticed that you claimed{' '}
                    <strong className="text-[#C0392B] bg-[#FEE2E2] px-1 py-0.5 rounded font-mono font-bold">
                      ₹1,84,250 more
                    </strong>{' '}
                    in Input Tax Credit (ITC) on GSTR-3B than what your suppliers reported in GSTR-2B for Q1 (Apr–Jun 2024).&quot;
                  </p>
                  <p className="text-xs text-[#44474D] mt-1 leading-relaxed">
                    Under GST provisions, every rupee of tax rebate you take must match the exact invoices uploaded by your vendors. The department is questioning this ₹1,84,250 gap before considering further action.
                  </p>
                </div>
              )}

              {language === 'hi' && (
                <div className="flex flex-col gap-2" lang="hi">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2B4C9B]"></span>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#2B4C9B] font-bold">
                      अधिकारी का क्या कहना है (सरल हिन्दी में)
                    </span>
                  </div>
                  <p className="text-base text-[#0B1F3A] leading-[1.65]">
                    &quot;जीएसटी अधिकारी ने पाया कि आपने पहली तिमाही (अप्रैल-जून 2024) के लिए{' '}
                    <strong className="text-[#0B1F3A] font-bold font-mono">GSTR-3B</strong> में आपके सप्लायर्स द्वारा{' '}
                    <strong className="text-[#0B1F3A] font-bold font-mono">GSTR-2B</strong> में दिखाए गए इनपुट टैक्स क्रेडिट (ITC) से{' '}
                    <strong className="text-[#C0392B] bg-[#FEE2E2] px-1 py-0.5 rounded font-mono font-bold">
                      ₹1,84,250 अधिक क्लेम
                    </strong>{' '}
                    किया है।&quot;
                  </p>
                  <p className="text-xs text-[#44474D] mt-1 leading-[1.6]">
                    इसका सीधा मतलब है कि आपके किसी वेंडर ने अपना रिटर्न दाखिल करने में देरी की है, या आपने गलती से गलत इनवॉइस जोड़ लिया है। आपको केवल इसका प्रमाण और हिसाब पेश करना है।
                  </p>
                </div>
              )}

              {language === 'mr' && (
                <div className="flex flex-col gap-2" lang="mr">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2B4C9B]"></span>
                    <span className="font-mono text-xs uppercase tracking-wider text-[#2B4C9B] font-bold">
                      जीएसटी अधिकाऱ्यांचे म्हणणे काय आहे (मराठीत)
                    </span>
                  </div>
                  <p className="text-base text-[#0B1F3A] leading-[1.65]">
                    &quot;जीएसटी अधिकाऱ्यांच्या निदर्शनास आले आहे की तुम्ही एप्रिल-जून २०२४ या तिमाहीत{' '}
                    <strong className="text-[#0B1F3A] font-bold font-mono">GSTR-2B</strong> मधील रकमेपेक्षा{' '}
                    <strong className="text-[#C0392B] bg-[#FEE2E2] px-1 py-0.5 rounded font-mono font-bold">
                      ₹१,८४,२५० जास्त
                    </strong>{' '}
                    इनपुट टॅक्स क्रेडिट (ITC){' '}
                    <strong className="text-[#0B1F3A] font-bold font-mono">GSTR-3B</strong> मध्ये दाखवले आहे.&quot;
                  </p>
                  <p className="text-xs text-[#44474D] mt-1 leading-[1.6]">
                    याचा अर्थ असा की आपल्या पुरवठादाराने वेळेत बीजक (Invoice) अपलोड केलेले नाही किंवा रकमेत तफावत आहे. योग्य पुराव्यासह खुलासा सादर केल्यास हा प्रश्न निकाली निघू शकतो.
                  </p>
                </div>
              )}

              {/* Audio Listen Assist */}
              <div className="mt-4 pt-3 border-t border-[#CBD5E1] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleSpeak}
                  disabled={!voiceAvailable}
                  title={voiceAvailable ? 'Play spoken explanation' : 'Voice synthesis not supported on this device'}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-control font-medium text-xs transition-all shadow-2xs border ${
                    isPlayingAudio
                      ? 'bg-[#F59E0B] text-[#0F172A] border-[#D97706] animate-pulse'
                      : voiceAvailable
                      ? 'bg-white text-[#0B1F3A] hover:bg-[#EFF4FF] border-[#CBD5E1] hover:border-[#2B4C9B]'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {isPlayingAudio ? 'stop_circle' : 'volume_up'}
                  </span>
                  <span className="font-bold">
                    {isPlayingAudio ? 'Stop Listening' : 'Listen to Explanation'}
                  </span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#5B6B82]">
                    Language: <span className="font-bold text-[#0B1F3A]">{language === 'hi' ? 'Hindi (hi-IN)' : language === 'mr' ? 'Marathi (mr-IN)' : 'English (en-IN)'}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[#5B6B82] bg-white border border-[#CBD5E1] px-2 py-0.5 rounded shadow-2xs">
                    Web Speech API
                  </span>
                </div>
              </div>
            </div>

            {/* Source-Sentence Grounding Quote Card */}
            <div
              className={`p-4 rounded-card border transition-all ${
                isQuoteHighlighted
                  ? 'bg-[#FEF3C7] border-[#F59E0B] shadow-sm'
                  : 'bg-[#EFF4FF] border-[#CBD5E1]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#0B1F3A] text-base">format_quote</span>
                  <span className="font-mono text-[11px] text-[#0B1F3A] uppercase font-bold tracking-wider">
                    Verbatim Quote from Scanned Notice ASMT-10
                  </span>
                </div>
                <span className="font-mono text-xs text-[#5B6B82] font-semibold">
                  Para 2(b) • Row 02
                </span>
              </div>

              <blockquote className="p-3 bg-white rounded-lg font-mono text-xs text-[#0B1F3A] leading-relaxed border border-[#E3E8F0]">
                {apiExplanation?.source_citation ||
                  `"Discrepancy in ITC claimed under Table 4(A)(5) of GSTR-3B vs ITC available in GSTR-2B, amounting to ₹1,84,250 u/s 16(2)(aa) read with Section 61 of the CGST Act, 2017."`}
              </blockquote>

              <div className="flex items-center justify-between text-xs text-[#5B6B82] pt-2">
                <span>
                  Statutory Ground: <strong>Section 16(2)(aa)</strong> (Invoice Furnishing Requirement)
                </span>
                <button
                  type="button"
                  onClick={() => setRawScanModalOpen(true)}
                  className="text-[#2B4C9B] font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  <span>View Raw Scan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clarity Checklist: What This Notice IS vs IS NOT */}
          <div className="bg-white rounded-modal shadow-tier1 border border-[#E3E8F0] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B] text-2xl">balance</span>
                <div>
                  <h2 className="font-headline text-lg font-bold text-[#0B1F3A]">
                    Clarity Checklist: What This Scrutiny Means
                  </h2>
                  <p className="text-xs text-[#5B6B82]">
                    Prevent panic-driven mistakes with factual statutory positioning
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#EFF4FF] text-[#0B1F3A] font-semibold border border-[#CBD5E1] hidden sm:inline-block">
                Legal Position: Pre-Adjudication
              </span>
            </div>

            {/* 2-Column Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* What this IS */}
              <div className="p-4 rounded-card bg-[#EFF4FF] border border-[#CBD5E1] flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[#0B1F3A] font-bold">
                  <div className="w-5 h-5 rounded-full bg-[#12805C] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs font-bold">check</span>
                  </div>
                  <span className="font-headline text-sm font-bold text-[#0B1F3A]">
                    What this notice IS
                  </span>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-[#0F172A] pt-1">
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#12805C] text-base shrink-0">check_circle</span>
                    <span><strong>An invitation to explain:</strong> The tax officer has merely observed an automated arithmetic mismatch and seeks your side of the ledger.</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#12805C] text-base shrink-0">check_circle</span>
                    <span><strong>No penalty finalized:</strong> No fine or interest has been adjudicated or decreed against Sharma Garments yet.</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#12805C] text-base shrink-0">check_circle</span>
                    <span><strong>Completely resolvable:</strong> Filing a clean <strong>Form ASMT-11</strong> reply with purchase vouchers will drop or reconcile legitimate mismatches.</span>
                  </li>
                </ul>
              </div>

              {/* What this IS NOT */}
              <div className="p-4 rounded-card bg-[#FEE2E2]/40 border border-[#FECACA] flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-[#C0392B] font-bold">
                  <div className="w-5 h-5 rounded-full bg-[#C0392B] text-white flex items-center justify-center">
                    <span className="material-symbols-outlined text-xs font-bold">close</span>
                  </div>
                  <span className="font-headline text-sm font-bold text-[#C0392B]">
                    What this notice IS NOT
                  </span>
                </div>
                <ul className="flex flex-col gap-2 text-xs text-[#0F172A] pt-1">
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#C0392B] text-base shrink-0">cancel</span>
                    <span><strong>NOT a Tax Demand Order:</strong> This is NOT an order under Form DRC-07 or an immediate recovery warrant.</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#C0392B] text-base shrink-0">cancel</span>
                    <span><strong>Bank accounts NOT frozen:</strong> The department has NOT attached accounts under Sec 83. Business ops remain completely normal.</span>
                  </li>
                  <li className="flex items-start gap-2 leading-relaxed">
                    <span className="material-symbols-outlined text-[#C0392B] text-base shrink-0">cancel</span>
                    <span><strong>Do NOT pay rashly:</strong> You do NOT have to deposit ₹1,84,250 immediately via DRC-03 before verifying vendor filings.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Strategic Action Tip */}
            <div className="p-3 bg-[#EFF4FF] rounded-lg border border-[#CBD5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2B4C9B] text-base">lightbulb</span>
                <span className="text-[#0B1F3A]">
                  <strong>Recommended action:</strong> Reconcile supplier invoices before consulting your CA.
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#5B6B82] font-semibold">
                Estimated CA Brief Prep: 8 mins
              </span>
            </div>
          </div>

          {/* Bottom Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-control bg-white text-[#0B1F3A] text-xs font-semibold hover:bg-[#EFF4FF] transition-colors border border-[#E3E8F0] shadow-2xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Back to Confirmation</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(4)}
              className="w-full sm:w-auto px-6 py-2.5 rounded-control bg-[#0B1F3A] hover:bg-[#2B4C9B] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Proceed to Evidence Checklist</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
