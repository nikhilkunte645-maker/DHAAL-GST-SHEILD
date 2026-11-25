export type Language = 'en' | 'hi' | 'mr';

export interface I18nDictionary {
  tagline: string;
  taglineRomanized: string;
  heroHeadline: string;
  heroHeadlineHighlight: string;
  heroHeadlineEnd: string;
  heroSubcopy: string;
  uploadCta: string;
  trySampleCta: string;
  stepper: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
  };
  stepperFull: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
  };
  explainer: {
    officerHeading: string;
    officerText: string;
    officerSubtext: string;
  };
}

export const I18N: Record<Language, I18nDictionary> = {
  en: {
    tagline: 'Notice aaya? Dhaal hai na.',
    taglineRomanized: '(Notice aaya? Dhaal hai na.)',
    heroHeadline: 'Understand your GST notice in ',
    heroHeadlineHighlight: 'minutes',
    heroHeadlineEnd: ', not days.',
    heroSubcopy: 'Dhaal reads your statutory notice, isolates every questioned mismatch, tells you what the officer is asking, and drafts an audit-ready brief for your CA.',
    uploadCta: 'Upload Notice',
    trySampleCta: 'Try with sample notice',
    stepper: {
      step1: 'Upload',
      step2: 'Confirm',
      step3: 'Explain',
      step4: 'Evidence',
      step5: 'Draft',
      step6: 'CA Brief',
    },
    stepperFull: {
      step1: 'Step 1: Upload Notice (Form ASMT-10)',
      step2: 'Step 2: Confirm Scanned Mismatch Amount',
      step3: 'Step 3: Understand Statutory Deadlines & Explainer',
      step4: 'Step 4: Prepare Evidence Checklist',
      step5: 'Step 5: Verify Legal Reply Draft',
      step6: 'Step 6: Review Audit-Ready CA Brief',
    },
    explainer: {
      officerHeading: 'What the Officer Is Saying (English)',
      officerText: '"The GST officer noticed that you claimed ₹1,84,250 more in Input Tax Credit (ITC) on GSTR-3B than what your suppliers reported in GSTR-2B for Q1 (Apr–Jun 2024)."',
      officerSubtext: 'Under GST provisions, every rupee of tax rebate you take must match the exact invoices uploaded by your vendors. The department is questioning this ₹1,84,250 gap before considering further action.',
    },
  },
  hi: {
    tagline: 'नोटिस आया? ढाल है ना।',
    taglineRomanized: '(Notice aaya? Dhaal hai na.)',
    heroHeadline: 'अपने जीएसटी नोटिस को ',
    heroHeadlineHighlight: 'मिनटों में',
    heroHeadlineEnd: ' समझें, दिनों में नहीं।',
    heroSubcopy: 'ढाल आपके वैधानिक नोटिस को पढ़ता है, हर विसंगति को अलग करता है, अधिकारी की मांग स्पष्ट करता है और आपके सीए के लिए ऑडिट-तैयार ब्रीफ तैयार करता है।',
    uploadCta: 'नोटिस अपलोड करें',
    trySampleCta: 'नमूना नोटिस देखें',
    stepper: {
      step1: 'अपलोड',
      step2: 'पुष्टि',
      step3: 'व्याख्या',
      step4: 'साक्ष्य',
      step5: 'ड्राफ्ट',
      step6: 'सीए ब्रीफ',
    },
    stepperFull: {
      step1: 'चरण 1: नोटिस अपलोड (फॉर्म ASMT-10)',
      step2: 'चरण 2: विसंगति राशि की पुष्टि व ठहराव',
      step3: 'चरण 3: वैधानिक समय-सीमा व सरल व्याख्या',
      step4: 'चरण 4: साक्ष्य दस्तावेज चेकलिस्ट',
      step5: 'चरण 5: कानूनी जवाब ड्राफ्ट व सत्यापन',
      step6: 'चरण 6: सीए के लिए संपूर्ण ब्रीफ',
    },
    explainer: {
      officerHeading: 'अधिकारी का क्या कहना है (सरल हिन्दी में)',
      officerText: '"जीएसटी अधिकारी ने पाया कि आपने पहली तिमाही (अप्रैल-जून 2024) के लिए GSTR-3B में आपके सप्लायर्स द्वारा GSTR-2B में दिखाए गए इनपुट टैक्स क्रेडिट (ITC) से ₹1,84,250 अधिक क्लेम किया है।"',
      officerSubtext: 'इसका सीधा मतलब है कि आपके किसी वेंडर ने अपना रिटर्न दाखिल करने में देरी की है, या आपने गलती से गलत इनवॉइस जोड़ लिया है। आपको केवल इसका प्रमाण और हिसाब पेश करना है।',
    },
  },
  mr: {
    tagline: 'नोटीस आली? ढाल आहे ना!',
    taglineRomanized: '(Notice aali? Dhaal aahe na.)',
    heroHeadline: 'आपली जीएसटी नोटीस ',
    heroHeadlineHighlight: 'काही मिनिटांत',
    heroHeadlineEnd: ' समजून घ्या, दिवसांत नाही.',
    heroSubcopy: 'ढाल आपली कायदेशीर नोटीस वाचते, प्रत्येक तफावत शोधते, अधिकारी काय विचारत आहेत हे स्पष्ट करते आणि सीएसाठी ऑडिट-तयार ब्रीफ तयार करते.',
    uploadCta: 'नोटीस अपलोड करा',
    trySampleCta: 'नमुना नोटीस पहा',
    stepper: {
      step1: 'अपलोड',
      step2: 'पडताळणी',
      step3: 'स्पष्टीकरण',
      step4: 'पुरावा',
      step5: 'मसुदा',
      step6: 'सीए ब्रीफ',
    },
    stepperFull: {
      step1: 'टप्पा १: नोटीस अपलोड (फॉर्म ASMT-10)',
      step2: 'टप्पा २: तफावत रक्कमेची पडताळणी',
      step3: 'टप्पा ३: कायदेशीर मुदत व स्पष्टीकरण',
      step4: 'टप्पा ४: पुरावा कागदपत्रे यादी',
      step5: 'टप्पा ५: मसुदा कायदेशीर पडताळणी',
      step6: 'टप्पा ६: सीए ऑडिट ब्रीफ',
    },
    explainer: {
      officerHeading: 'जीएसटी अधिकाऱ्यांचे म्हणणे काय आहे (मराठीत)',
      officerText: '"जीएसटी अधिकाऱ्यांच्या निदर्शनास आले आहे की तुम्ही एप्रिल-जून २०२४ या तिमाहीत GSTR-2B मधील रकमेपेक्षा ₹१,८४,२५० जास्त इनपुट टॅक्स क्रेडिट (ITC) GSTR-3B मध्ये दाखवले आहे."',
      officerSubtext: 'याचा अर्थ असा की आपल्या पुरवठादाराने वेळेत बीजक (Invoice) अपलोड केलेले नाही किंवा रकमेत तफावत आहे. योग्य पुराव्यासह खुलासा सादर केल्यास हा प्रश्न निकाली निघू शकतो.',
    },
  },
};

export * from './dossierI18n';
