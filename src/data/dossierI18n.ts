import { Language } from './i18n';

export interface DossierTranslations {
  watermarkLine1: string;
  watermarkLine2: string;
  topRibbonLeft: string;
  topRibbonRight: string;
  dossierTitle: string;
  caseReference: string;
  generation: string;
  contentHash: string;
  assesseeTradeNameLabel: string;
  gstinRegistrationLabel: string;
  jurisdictionLabel: string;
  mumbaiCity: string;
  section1Heading: string;
  scrutinyGround: string;
  amountQuestioned: string;
  section1Summary: (amount: number, taxPeriod: string) => string;
  probableCauseLabel: string;
  probableCauseText: (supplierName: string, supplierGstin: string, invoiceNo: string) => string;
  section2Heading: string;
  statutoryDeadline: string;
  daysRemainingStrict: string;
  recommendedCaSign: string;
  contingencyBuffer: string;
  assignedCounsel: string;
  section3Heading: string;
  sealedCountBadge: string;
  colAnnexure: string;
  colDocDesc: string;
  colProofRef: string;
  colAuditStatus: string;
  annexA_desc: string;
  annexB_desc: string;
  annexC_desc: string;
  annexD_desc: string;
  annexE_desc: string;
  annexF_desc: string;
  demoTag: string;
  statusVerified: string;
  statusSynthetic: string;
  statusPartial: string;
  statusActionRequired: string;
  statusCaPending: string;
  missingSupplierProof: string;
  dhaalMatchRun: string;
  requiresUdinSignature: string;
  section4Heading: string;
  section4Badge: string;
  formatLabel: string;
  asmt11ExtractText: (noticeRef: string, amount: number) => string;
  disclaimerHeading: string;
  disclaimerText: string;
  assesseeSignatureLabel: string;
  proprietorRole: string;
  attestingCaLabel: string;
  udinPlaceholder: string;
}

export const DOSSIER_I18N: Record<Language, DossierTranslations> = {
  en: {
    watermarkLine1: 'SYNTHETIC DEMO',
    watermarkLine2: 'CA BRIEF',
    topRibbonLeft: 'DHAAL COMPLIANCE DOSSIER | STRICTLY CONFIDENTIAL',
    topRibbonRight: 'FORM ASMT-10 RESPONSE FILE • STATUTORY COMPLIANCE',
    dossierTitle: 'DHAAL LEGAL SHIELD • CA BRIEF',
    caseReference: 'Case Reference',
    generation: 'Generation',
    contentHash: 'Content hash',
    assesseeTradeNameLabel: 'Assessee Legal Trade Name',
    gstinRegistrationLabel: 'GSTIN / Registration',
    jurisdictionLabel: 'Jurisdiction',
    mumbaiCity: 'Mumbai',
    section1Heading: 'Executive Summary & Allegation Mapping',
    scrutinyGround: 'Scrutiny Ground: Table 4(A)(5) GSTR-3B Discrepancy',
    amountQuestioned: 'Amount questioned',
    section1Summary: (amount: number, taxPeriod: string) =>
      `Form ASMT-10 scrutiny notice received alleging an apparent excess Input Tax Credit (ITC) claim of ₹${amount.toLocaleString('en-IN')} in monthly return GSTR-3B compared with system-generated GSTR-2B for ${taxPeriod}.`,
    probableCauseLabel: 'Probable cause (to be confirmed with supplier)',
    probableCauseText: (supplierName: string, supplierGstin: string, invoiceNo: string) =>
      `Principal vendor ${supplierName} (${supplierGstin}) reported supply in subsequent tax period. Assessee maintains verified physical possession of goods, original tax invoices (${invoiceNo}), valid E-Way bills, and prompt electronic bank settlement.`,
    section2Heading: 'Statutory Countdown & Safe Filing Windows',
    statutoryDeadline: 'Statutory Deadline',
    daysRemainingStrict: '12 Days strictly remaining',
    recommendedCaSign: 'Recommended CA Sign',
    contingencyBuffer: '5-day contingency buffer',
    assignedCounsel: 'Assigned Counsel / CA',
    section3Heading: 'Assembled Evidentiary Annexures',
    sealedCountBadge: '5 of 6 Sealed',
    colAnnexure: 'Annexure',
    colDocDesc: 'Document Description',
    colProofRef: 'Proof Reference',
    colAuditStatus: 'Audit Status',
    annexA_desc: 'Purchase Invoice (Apex Textiles)',
    annexB_desc: 'Bank Payment Voucher [SYNTHETIC DEMO]',
    annexC_desc: 'Consignment Notes & E-Way Bills (18 attached)',
    annexD_desc: 'Supplier 16(2)(c) Tax Clearance Proof',
    annexE_desc: 'Reconciliation Ledger & GSTR-2B Proof',
    annexF_desc: 'Practicing CA Verification Certificate',
    demoTag: 'Demo',
    statusVerified: '✓ Verified',
    statusSynthetic: 'SYNTHETIC (Demo)',
    statusPartial: 'Partial (18/24)',
    statusActionRequired: 'Action Required',
    statusCaPending: 'CA Pending',
    missingSupplierProof: 'Missing Supplier Proof',
    dhaalMatchRun: 'Dhaal Match Run',
    requiresUdinSignature: 'Requires UDIN Signature',
    section4Heading: 'Verified Statutory Form ASMT-11 Reply (Extract)',
    section4Badge: '5 of 5 checks passed',
    formatLabel: 'Format',
    asmt11ExtractText: (noticeRef: string, amount: number) =>
      `"Respected Officer, with reference to scrutiny notice ${noticeRef} pointing out alleged difference in ITC claimed under Table 4(A)(5) amounting to ₹${amount.toLocaleString('en-IN')}, conditions under Section 16(2) stand complied with..."`,
    disclaimerHeading: 'Statutory Disclaimer',
    disclaimerText:
      'This CA Brief is an algorithmic compliance compilation designed strictly as an assistive drafting aid for independent professional review. It does not constitute formal legal opinion or tax filing. The brief must be independently verified, endorsed, and uploaded under valid digital signature / UDIN by a practicing Chartered Accountant before GST portal submission.',
    assesseeSignatureLabel: 'Assessee',
    proprietorRole: 'Proprietor, Sharma Garments',
    attestingCaLabel: 'Attesting CA',
    udinPlaceholder: 'UDIN: To Be Generated by CA',
  },
  hi: {
    watermarkLine1: 'सिंथेटिक डेमो',
    watermarkLine2: 'सीए ब्रीफ',
    topRibbonLeft: 'ढाल अनुपालन डोजियर | अत्यंत गोपनीय',
    topRibbonRight: 'फॉर्म ASMT-10 जवाब फाइल • वैधानिक अनुपालन',
    dossierTitle: 'ढाल लीगल शील्ड • सीए ब्रीफ',
    caseReference: 'केस संदर्भ',
    generation: 'निर्माण',
    contentHash: 'कंटेंट हैश',
    assesseeTradeNameLabel: 'करदाता का कानूनी व्यापार नाम',
    gstinRegistrationLabel: 'GSTIN / पंजीकरण',
    jurisdictionLabel: 'अधिकार क्षेत्र',
    mumbaiCity: 'मुंबई',
    section1Heading: 'कार्यकारी सारांश और आरोप विवरण',
    scrutinyGround: 'जांच आधार: Table 4(A)(5) GSTR-3B विसंगति',
    amountQuestioned: 'पूछताछ राशि',
    section1Summary: (amount: number, taxPeriod: string) =>
      `${taxPeriod} के लिए सिस्टम-जनरेटेड GSTR-2B की तुलना में मासिक रिटर्न GSTR-3B में ₹${amount.toLocaleString('en-IN')} के इनपुट टैक्स क्रेडिट (ITC) का कथित अधिक दावा करने का आरोप लगाते हुए फॉर्म ASMT-10 जांच नोटिस प्राप्त हुआ।`,
    probableCauseLabel: 'संभावित कारण (आपूर्तिकर्ता से पुष्टि की जानी है)',
    probableCauseText: (supplierName: string, supplierGstin: string, invoiceNo: string) =>
      `मुख्य विक्रेता ${supplierName} (${supplierGstin}) ने आगामी कर अवधि में आपूर्ति की सूचना दी है। करदाता के पास माल का सत्यापित भौतिक कब्जा, मूल कर चालान (${invoiceNo}), वैध ई-वे बिल और त्वरित इलेक्ट्रॉनिक बैंक निपटान मौजूद है।`,
    section2Heading: 'वैधानिक उलटी गिनती और सुरक्षित फाइलिंग अवधि',
    statutoryDeadline: 'वैधानिक समय-सीमा',
    daysRemainingStrict: 'सख्ती से 12 दिन शेष',
    recommendedCaSign: 'अनुशंसित सीए हस्ताक्षर',
    contingencyBuffer: '5-दिवसीय आकस्मिक बफर',
    assignedCounsel: 'नामित सलाहकार / सीए',
    section3Heading: 'एकत्रित साक्ष्य अनुलग्नक',
    sealedCountBadge: '6 में से 5 संलग्न',
    colAnnexure: 'अनुलग्नक',
    colDocDesc: 'दस्तावेज़ विवरण',
    colProofRef: 'प्रमाण संदर्भ',
    colAuditStatus: 'ऑडिट स्थिति',
    annexA_desc: 'खरीद चालान (Apex Textiles)',
    annexB_desc: 'बैंक भुगतान वाउचर [सिंथेटिक डेमो]',
    annexC_desc: 'कंसाइनमेंट नोट्स और ई-वे बिल (18 संलग्न)',
    annexD_desc: 'आपूर्तिकर्ता धारा 16(2)(c) कर भुगतान प्रमाण',
    annexE_desc: 'मिलान बहीखाता और GSTR-2B प्रमाण',
    annexF_desc: 'प्रैक्टिसिंग सीए सत्यापन प्रमाणपत्र',
    demoTag: 'डेमो',
    statusVerified: '✓ सत्यापित',
    statusSynthetic: 'सिंथेटिक (डेमो)',
    statusPartial: 'आंशिक (18/24)',
    statusActionRequired: 'कार्रवाई आवश्यक',
    statusCaPending: 'सीए लंबित',
    missingSupplierProof: 'आपूर्तिकर्ता प्रमाण अनुपलब्ध',
    dhaalMatchRun: 'ढाल मिलान रन',
    requiresUdinSignature: 'UDIN हस्ताक्षर आवश्यक',
    section4Heading: 'सत्यापित वैधानिक फॉर्म ASMT-11 जवाब (उद्धरण)',
    section4Badge: '5 में से 5 जांच सफल',
    formatLabel: 'प्रारूप',
    asmt11ExtractText: (noticeRef: string, amount: number) =>
      `"आदरणीय अधिकारी महोदय, जांच नोटिस ${noticeRef} के संदर्भ में, जिसमें Table 4(A)(5) के तहत ₹${amount.toLocaleString('en-IN')} के ITC दावे में कथित अंतर दर्शाया गया है, Section 16(2) के तहत सभी शर्तों का अनुपालन किया गया है..."`,
    disclaimerHeading: 'वैधानिक अस्वीकरण',
    disclaimerText:
      'यह सीए ब्रीफ एक एल्गोरिथम अनुपालन संकलन है जिसे स्वतंत्र पेशेवर समीक्षा के लिए पूरी तरह से सहायक ड्राफ्टिंग सहायता के रूप में तैयार किया गया है। यह औपचारिक कानूनी राय या टैक्स फाइलिंग नहीं है। जीएसटी पोर्टल पर जमा करने से पहले किसी प्रैक्टिसिंग चार्टर्ड अकाउंटेंट द्वारा वैध डिजिटल हस्ताक्षर / UDIN के तहत इस ब्रीफ का स्वतंत्र रूप से सत्यापन, पृष्ठांकन और अपलोड किया जाना अनिवार्य है।',
    assesseeSignatureLabel: 'करदाता',
    proprietorRole: 'प्रोपराइटर, Sharma Garments',
    attestingCaLabel: 'सत्यापनकर्ता सीए',
    udinPlaceholder: 'UDIN: सीए द्वारा जनरेट किया जाएगा',
  },
  mr: {
    watermarkLine1: 'सिंथेटिक डेमो',
    watermarkLine2: 'सीए ब्रीफ',
    topRibbonLeft: 'ढाल अनुपालन डॉझियर | अत्यंत गोपनीय',
    topRibbonRight: 'फॉर्म ASMT-10 उत्तर फाइल • कायदेशीर अनुपालन',
    dossierTitle: 'ढाल लीगल शील्ड • सीए ब्रीफ',
    caseReference: 'केस संदर्भ',
    generation: 'निर्मिती',
    contentHash: 'कंटेंट हॅश',
    assesseeTradeNameLabel: 'करदात्याचे कायदेशीर व्यावसायिक नाव',
    gstinRegistrationLabel: 'GSTIN / नोंदणी',
    jurisdictionLabel: 'अधिकार क्षेत्र',
    mumbaiCity: 'मुंबई',
    section1Heading: 'कार्यकारी सारांश आणि आक्षेप विवरण',
    scrutinyGround: 'तपासणी आधार: Table 4(A)(5) GSTR-3B तफावत',
    amountQuestioned: 'आक्षेपार्ह रक्कम',
    section1Summary: (amount: number, taxPeriod: string) =>
      `${taxPeriod} साठी सिस्टम-जनरेटेड GSTR-2B च्या तुलनेत मासिक रिटर्न GSTR-3B मध्ये ₹${amount.toLocaleString('en-IN')} इतका अतिरिक्त इनपुट टॅक्स क्रेडिट (ITC) दावा केल्याचा आरोप असलेली फॉर्म ASMT-10 तपासणी नोटीस प्राप्त झाली.`,
    probableCauseLabel: 'संभाव्य कारण (पुरवठादाराकडून पुष्टी करणे आवश्यक)',
    probableCauseText: (supplierName: string, supplierGstin: string, invoiceNo: string) =>
      `प्रमुख पुरवठादार ${supplierName} (${supplierGstin}) यांनी पुढील कर कालावधीत पुरवठा नोंदवला आहे. करदात्याकडे मालाचा प्रत्यक्ष ताबा, मूळ कर बीजक (${invoiceNo}), वैध ई-वे बिले आणि तत्काळ इलेक्ट्रॉनिक बँक भरणा नोंदी उपलब्ध आहेत.`,
    section2Heading: 'कायदेशीर मुदत गणना आणि सुरक्षित फाइलिंग कालावधी',
    statutoryDeadline: 'कायदेशीर अंतिम मुदत',
    daysRemainingStrict: 'नियमतः १२ दिवस शिल्लक',
    recommendedCaSign: 'शिफारस केलेली सीए स्वाक्षरी',
    contingencyBuffer: '५-दिवसांचा सुरक्षित बफर',
    assignedCounsel: 'नियुक्त सल्लागार / सीए',
    section3Heading: 'एकत्रित पुरावा जोडपत्रे',
    sealedCountBadge: '६ पैकी ५ जोडलेली',
    colAnnexure: 'जोडपत्र',
    colDocDesc: 'कागदपत्र तपशील',
    colProofRef: 'पुरावा संदर्भ',
    colAuditStatus: 'ऑडिट स्थिती',
    annexA_desc: 'खरेदी बीजक (Apex Textiles)',
    annexB_desc: 'बँक भरणा पावती [सिंथेटिक डेमो]',
    annexC_desc: 'वाहतूक पावत्या व ई-वे बिले (१८ जोडलेली)',
    annexD_desc: 'पुरवठादार कलम 16(2)(c) कर भरणा पुरावा',
    annexE_desc: 'पडताळणी लेजर व GSTR-2B पुरावा',
    annexF_desc: 'प्रॅक्टिसिंग सीए पडताळणी प्रमाणपत्र',
    demoTag: 'डेमो',
    statusVerified: '✓ पडताळणी पूर्ण',
    statusSynthetic: 'सिंथेटिक (डेमो)',
    statusPartial: 'अंशतः (१८/२४)',
    statusActionRequired: 'कृती आवश्यक',
    statusCaPending: 'सीए प्रलंबित',
    missingSupplierProof: 'पुरवठादार पुरावा उपलब्ध नाही',
    dhaalMatchRun: 'ढाल पडताळणी रन',
    requiresUdinSignature: 'UDIN स्वाक्षरी आवश्यक',
    section4Heading: 'पडताळणी केलेला कायदेशीर फॉर्म ASMT-11 मसुदा (उतारा)',
    section4Badge: '५ पैकी ५ निकष उत्तीर्ण',
    formatLabel: 'प्रारूप',
    asmt11ExtractText: (noticeRef: string, amount: number) =>
      `"सन्माननीय अधिकारी, तपासणी नोटीस ${noticeRef} च्या संदर्भात, ज्यामध्ये Table 4(A)(5) अंतर्गत ₹${amount.toLocaleString('en-IN')} च्या ITC दाव्यात तफावत नमूद करण्यात आली आहे, Section 16(2) मधील सर्व अटींची पूर्तता करण्यात आली आहे..."`,
    disclaimerHeading: 'कायदेशीर अस्वीकरण',
    disclaimerText:
      'हे सीए ब्रीफ एक अल्गोरिदम आधारित अनुपालन संकलन असून ते केवळ स्वतंत्र व्यावसायिक पुनरावलोकनासाठी मसुदा तयार करण्यास साहाय्यक म्हणून डिझाइन केलेले आहे. हे कोणतेही औपचारिक कायदेशीर मत किंवा कर विवरणपत्र (Tax Filing) नाही. जीएसटी पोर्टलवर सादर करण्यापूर्वी प्रॅक्टिसिंग चार्टर्ड अकाउंटंटकडून वैध डिजिटल स्वाक्षरी / UDIN सह याचे स्वतंत्रपणे पुनरावलोकन, स्वाक्षरी आणि अपलोड करणे बंधनकारक आहे.',
    assesseeSignatureLabel: 'करदाता',
    proprietorRole: 'मालक, Sharma Garments',
    attestingCaLabel: 'प्रमाणित करणारे सीए',
    udinPlaceholder: 'UDIN: सीए द्वारे तयार केले जाईल',
  },
};
