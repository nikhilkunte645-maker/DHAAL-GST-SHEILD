import { describe, it, expect } from 'vitest';
import { DOSSIER_I18N, DossierTranslations } from '../../data/dossierI18n';
import { Language } from '../../data/i18n';

describe('CA Brief Dossier Localization (DOSSIER_I18N)', () => {
  const languages: Language[] = ['en', 'hi', 'mr'];

  it('provides translations for all supported languages', () => {
    expect(DOSSIER_I18N).toHaveProperty('en');
    expect(DOSSIER_I18N).toHaveProperty('hi');
    expect(DOSSIER_I18N).toHaveProperty('mr');
  });

  it('contains all required string and function properties without missing keys or empty values', () => {
    const requiredKeys: (keyof DossierTranslations)[] = [
      'watermarkLine1',
      'watermarkLine2',
      'topRibbonLeft',
      'topRibbonRight',
      'dossierTitle',
      'caseReference',
      'generation',
      'contentHash',
      'assesseeTradeNameLabel',
      'gstinRegistrationLabel',
      'jurisdictionLabel',
      'mumbaiCity',
      'section1Heading',
      'scrutinyGround',
      'amountQuestioned',
      'section1Summary',
      'probableCauseLabel',
      'probableCauseText',
      'section2Heading',
      'statutoryDeadline',
      'daysRemainingStrict',
      'recommendedCaSign',
      'contingencyBuffer',
      'assignedCounsel',
      'section3Heading',
      'sealedCountBadge',
      'colAnnexure',
      'colDocDesc',
      'colProofRef',
      'colAuditStatus',
      'annexA_desc',
      'annexB_desc',
      'annexC_desc',
      'annexD_desc',
      'annexE_desc',
      'annexF_desc',
      'demoTag',
      'statusVerified',
      'statusSynthetic',
      'statusPartial',
      'statusActionRequired',
      'statusCaPending',
      'missingSupplierProof',
      'dhaalMatchRun',
      'requiresUdinSignature',
      'section4Heading',
      'section4Badge',
      'formatLabel',
      'asmt11ExtractText',
      'disclaimerHeading',
      'disclaimerText',
      'assesseeSignatureLabel',
      'proprietorRole',
      'attestingCaLabel',
      'udinPlaceholder',
    ];

    for (const lang of languages) {
      const dict = DOSSIER_I18N[lang];
      for (const key of requiredKeys) {
        expect(dict[key], `Missing key ${key} for language ${lang}`).toBeDefined();
        if (typeof dict[key] === 'string') {
          expect((dict[key] as string).trim().length).toBeGreaterThan(0);
        } else if (typeof dict[key] === 'function') {
          // test function execution
          if (key === 'section1Summary') {
            const res = (dict[key] as (amt: number, period: string) => string)(184250, 'Q1 (Apr–Jun 2024)');
            expect(res).toContain('1,84,250');
            expect(res).toContain('GSTR-2B');
            expect(res).toContain('GSTR-3B');
            expect(res).toContain('ASMT-10');
          } else if (key === 'probableCauseText') {
            const res = (dict[key] as (s: string, g: string, inv: string) => string)(
              'Apex Textiles',
              '27XXXXX5678X1ZX',
              'DEG-INV-24'
            );
            expect(res).toContain('Apex Textiles');
            expect(res).toContain('27XXXXX5678X1ZX');
            expect(res).toContain('DEG-INV-24');
          } else if (key === 'asmt11ExtractText') {
            const res = (dict[key] as (ref: string, amt: number) => string)('REF123', 184250);
            expect(res).toContain('REF123');
            expect(res).toContain('Table 4(A)(5)');
            expect(res).toContain('Section 16(2)');
          }
        }
      }
    }
  });

  it('guarantees Hindi and Marathi are distinct and not falling back to English', () => {
    const en = DOSSIER_I18N.en;
    const hi = DOSSIER_I18N.hi;
    const mr = DOSSIER_I18N.mr;

    // Distinct headings
    expect(hi.section1Heading).not.toBe(en.section1Heading);
    expect(mr.section1Heading).not.toBe(en.section1Heading);
    expect(hi.section1Heading).not.toBe(mr.section1Heading);

    // Distinct disclaimers
    expect(hi.disclaimerHeading).not.toBe(en.disclaimerHeading);
    expect(mr.disclaimerHeading).not.toBe(en.disclaimerHeading);
    expect(hi.disclaimerText).not.toBe(en.disclaimerText);
    expect(mr.disclaimerText).not.toBe(en.disclaimerText);
    expect(hi.disclaimerText).not.toBe(mr.disclaimerText);

    // Distinct annexure headers
    expect(hi.colAnnexure).not.toBe(en.colAnnexure);
    expect(mr.colAnnexure).not.toBe(en.colAnnexure);
    expect(hi.colDocDesc).not.toBe(en.colDocDesc);
    expect(mr.colDocDesc).not.toBe(en.colDocDesc);
  });

  it('strictly preserves statutory citations, section numbers, rule numbers, and placeholders', () => {
    for (const lang of languages) {
      const dict = DOSSIER_I18N[lang];
      // UDIN mention
      expect(dict.udinPlaceholder).toContain('UDIN');
      expect(dict.requiresUdinSignature).toContain('UDIN');

      // ASMT references
      expect(dict.topRibbonRight).toContain('ASMT-10');
      expect(dict.section4Heading).toContain('ASMT-11');

      // Table 4(A)(5)
      expect(dict.scrutinyGround).toContain('Table 4(A)(5)');

      // GSTR-3B
      expect(dict.scrutinyGround).toContain('GSTR-3B');

      // Annexure D mentions Section 16(2)(c)
      expect(dict.annexD_desc).toContain('16(2)(c)');

      // Extract text preserves Section 16(2)
      const extract = dict.asmt11ExtractText('TEST-REF', 1000);
      expect(extract).toContain('Section 16(2)');
      expect(extract).toContain('Table 4(A)(5)');
    }
  });
});
