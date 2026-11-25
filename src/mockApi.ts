/**
 * Dhaal (ढाल) - Live REST API Client Layer
 * Connects React SPA directly to live Python FastAPI Backend on http://localhost:8001
 */
import { roundStatutoryINR } from './lib/amount';
import { formatINR } from './lib/format';
import { isSectionMatch, isTaxPeriodMatch, normalizeAmount } from './lib/verifier';

interface CustomImportMeta {
  env?: {
    VITE_API_BASE_URL?: string;
    [key: string]: string | undefined;
  };
}

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const rawEnvBase =
  typeof import.meta !== 'undefined' &&
  (import.meta as unknown as CustomImportMeta)?.env?.VITE_API_BASE_URL;

// 1. Base URL Configuration (targets live backend on port 8001 locally, or same-origin /api routes on Vercel)
export const API_BASE_URL = rawEnvBase
  ? rawEnvBase.replace(/\/+$/, '')
  : isLocal
  ? 'http://localhost:8001'
  : '';

// 4. Zero Type Mismatches - Strict Pydantic Model Equivalents
export interface NoticeMetadata {
  notice_id: string;
  section: string;
  tax_period: string;
  discrepancy_amount: number;
  notice_date: string;
  reply_deadline: string;
  assessee_name: string;
  gstin: string;
}

export interface DraftVerifyRequest {
  draft_text: string;
  confirmed_amount: number;
  confirmed_section: string;
  confirmed_period: string;
}

export interface VerificationMismatch {
  field: string;
  expected: string;
  found_in_draft: string;
  severity: 'CRITICAL' | 'WARNING' | string;
}

export interface DraftVerifyResponse {
  status: 'PASS' | 'FAIL' | string;
  message: string;
  mismatches?: VerificationMismatch[] | null;
  checks?: Record<string, boolean> | null;
  financial_consistency?: boolean;
  source_data_consistency?: boolean;
  legal_verification?: boolean;
  human_approval_required?: boolean;
}

export interface ExplanationResponse {
  title: string;
  summary: string;
  description: string;
  source_citation: string;
}

export interface BriefGenerateRequest {
  notice_id: string;
  draft_text: string;
  evidence_checklist_status: Record<string, boolean>;
  confirmed_amount: number;
}

export interface BriefGenerateResponse {
  status: string;
  dossier_id: string;
  timestamp: string;
  assessee: {
    name: string;
    gstin: string;
  };
  verified_draft: string;
  disclaimer: string;
}

// Offline fallback data (retained only if server is physically unreachable)
export const FALLBACK_NOTICE: NoticeMetadata = {
  notice_id: 'ZA270525008912M',
  section: '61',
  tax_period: 'Apr-Jun 2024',
  discrepancy_amount: 184250,
  notice_date: '2025-05-14',
  reply_deadline: '2025-06-13',
  assessee_name: 'M/s Sharma Garments',
  gstin: '27XXXXX1234X1ZX',
};

const FALLBACK_EXPLANATIONS: Record<string, ExplanationResponse> = {
  en: {
    title: 'Understanding Form ASMT-10',
    summary: 'Notice under Sec 61 CGST Act.',
    description: 'This is NOT a tax demand order; it is an inquiry invitation.',
    source_citation: "From Notice text: '...scrutiny of returns revealed discrepancies under section 61...'",
  },
  hi: {
    title: 'फॉर्म ASMT-10 को समझें',
    summary: 'धारा 61 के तहत नोटिस।',
    description: 'यह कर मांग आदेश (Tax Demand) नहीं है।',
    source_citation: "नोटिस से उद्धरण: '...धारा 61 के तहत अंतर पाया गया है...'",
  },
  mr: {
    title: 'फॉर्म ASMT-10 समजून घ्या',
    summary: 'कलम 61 अंतर्गत नोटीस.',
    description: 'ही कोणतीही कर मागणी नाही.',
    source_citation: "नोटीसमधील संदर्भ: '...कलम 61 अंतर्गत तफावत आढळली आहे...'",
  },
};

function isDemoActive(): boolean {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const saved = window.sessionStorage.getItem('dhaal_demo_state_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isDemoMode === true) return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

// 2. Endpoint Mapping & Live Client Implementation
export const dhaalApi = {
  /**
   * Health Check: GET /api or GET /
   * Verifies live FastAPI backend availability locally or on Vercel serverless
   */
  async checkHealth(): Promise<{ status: string; system: string; version?: string } | null> {
    try {
      const healthUrl = API_BASE_URL ? `${API_BASE_URL}/api` : '/api';
      const res = await fetch(healthUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`[Dhaal API] Live backend check failed on ${API_BASE_URL || '/api'}:`, err);
      return null;
    }
  },

  /**
   * POST /api/notice/upload
   * Calls live FastAPI multi-part upload endpoint
   */
  async uploadNotice(file: File | Blob, filename = 'notice_scan.pdf'): Promise<NoticeMetadata> {
    if (isDemoActive()) {
      console.log('[Dhaal API] Demo Mode active: returning canonical fallback notice.');
      return FALLBACK_NOTICE;
    }

    try {
      const formData = new FormData();
      formData.append('file', file, filename);

      const res = await fetch(`${API_BASE_URL}/api/notice/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.message || errorData.detail || errorData.error || `Server responded with HTTP ${res.status}`;
        const err = new Error(msg);
        (err as unknown as { status: number }).status = res.status;
        throw err;
      }

      const data: NoticeMetadata = await res.json();
      console.log(`[Dhaal API] Live notice extracted via ${API_BASE_URL}/api/notice/upload:`, data);
      return data;
    } catch (err: unknown) {
      // Re-throw server errors (400, 413, 422) so the UI can display the message to the user
      if (err instanceof Error && 'status' in err) {
        throw err;
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Dhaal API] Live upload unreachable at ${API_BASE_URL}/api/notice/upload (${errorMsg}). Using offline fallback.`);
      return FALLBACK_NOTICE;
    }
  },

  /**
   * POST /api/verify/draft
   * Deterministic draft verification against live FastAPI backend
   */
  async verifyDraft(payload: DraftVerifyRequest): Promise<DraftVerifyResponse> {
    if (isDemoActive()) {
      return this.runLocalVerification(payload);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/verify/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with HTTP ${res.status}`);
      }

      const data: DraftVerifyResponse = await res.json();
      console.log(`[Dhaal API] Live draft verification via ${API_BASE_URL}/api/verify/draft:`, data);
      return data;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Dhaal API] Live verifyDraft unreachable at ${API_BASE_URL}/api/verify/draft (${errorMsg}). Using deterministic offline fallback.`);
      return this.runLocalVerification(payload);
    }
  },

  /**
   * Deterministic client-side fallback verification
   */
  runLocalVerification(payload: DraftVerifyRequest): DraftVerifyResponse {
    const amountStatutory = roundStatutoryINR(payload.confirmed_amount);
    const mismatches: VerificationMismatch[] = [];

    // 1. Bounded Section Verification (61 accepts 61(1), but 61(1) rejects 61; rejects 161, 610, 61A)
    const sectionRegex = /(?:Section|Sec\.?)\s*([0-9]+[A-Za-z0-9]*(?:\s*\([a-zA-Z0-9]+\))*)/gi;
    const foundSections: string[] = [];
    let sm: RegExpExecArray | null;
    while ((sm = sectionRegex.exec(payload.draft_text)) !== null) {
      foundSections.push(sm[1]);
    }
    const sectionMatch = foundSections.some(s => isSectionMatch(s, payload.confirmed_section));
    if (!sectionMatch) {
      mismatches.push({
        field: 'Section Code',
        expected: `Section ${payload.confirmed_section}`,
        found_in_draft: 'Missing/Unbounded Mismatch',
        severity: 'WARNING',
      });
    }

    // 2. Contextual & Competing Financial Evaluation (Numeric token boundaries, no unrestricted substring matching)
    const numericTokenRegex = /(?<![0-9A-Za-z])(?:₹|Rs\.?|INR)?\s*(-?[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?|-?[0-9]+(?:\.[0-9]+)?)(?![0-9A-Za-z])/gi;
    const discrepancyRegex = /(?:discrepancy|mismatch(?:ed)?|difference|variance|demand|unreconciled|disputed?|liability|tax\s+gap|amounting\s+to|table\s*4\([a-z0-9]+\)\([0-9]+\)|settlement)\s*(?:amount|value|figure|sum)?\s*(?:of|is|in|worth|for)?\s*(?:₹|Rs\.?|INR)?\s*(-?[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]+)?|-?[0-9]+(?:\.[0-9]+)?)(?![0-9A-Za-z])/gi;

    const contextMatches: number[] = [];
    let cm: RegExpExecArray | null;
    while ((cm = discrepancyRegex.exec(payload.draft_text)) !== null) {
      const val = roundStatutoryINR(normalizeAmount(cm[1]));
      if (val !== 0) contextMatches.push(val);
    }

    const allNumericTokens: number[] = [];
    let tm: RegExpExecArray | null;
    while ((tm = numericTokenRegex.exec(payload.draft_text)) !== null) {
      const val = roundStatutoryINR(normalizeAmount(tm[1]));
      if (Math.abs(val) >= 100) allNumericTokens.push(val);
    }

    let amountMatch = false;
    let competingAmounts: number[] = [];

    if (contextMatches.length > 0) {
      if (contextMatches.includes(amountStatutory)) {
        const competing = contextMatches.filter(a => a !== amountStatutory && a > 10000);
        if (competing.length === 0) {
          amountMatch = true;
        } else {
          competingAmounts = competing;
        }
      } else {
        const competing = contextMatches.slice(1).filter(a => a > 10000);
        if (competing.length > 0) {
          competingAmounts = contextMatches;
        }
      }
    } else if (allNumericTokens.includes(amountStatutory)) {
      const competing = allNumericTokens.filter(a => a !== amountStatutory && a > 10000);
      if (competing.length === 0) {
        amountMatch = true;
      } else {
        competingAmounts = competing;
      }
    }

    if (!amountMatch) {
      mismatches.push({
        field: 'Discrepancy Amount',
        expected: formatINR(amountStatutory),
        found_in_draft: competingAmounts.length > 0
          ? `Contradictory amounts: ${competingAmounts.join(', ')}`
          : 'Missing',
        severity: 'CRITICAL',
      });
    }

    // 3. Tax Period Verification
    const periodMatch = isTaxPeriodMatch(payload.draft_text, payload.confirmed_period);
    if (payload.confirmed_period && !periodMatch) {
      mismatches.push({
        field: 'Tax Period',
        expected: payload.confirmed_period,
        found_in_draft: 'Missing/Mismatch',
        severity: 'WARNING',
      });
    }

    if (mismatches.length === 0) {
      return {
        status: 'PASS',
        message: 'Checks passed.',
        checks: { amount_match: true, section_match: true, period_match: true },
        financial_consistency: true,
        source_data_consistency: true,
        legal_verification: true,
        human_approval_required: true,
      };
    } else {
      return {
        status: 'FAIL',
        message: 'Export blocked.',
        mismatches,
        checks: {
          amount_match: amountMatch,
          section_match: sectionMatch,
          period_match: periodMatch,
        },
        financial_consistency: amountMatch,
        source_data_consistency: periodMatch,
        legal_verification: sectionMatch,
        human_approval_required: true,
      };
    }
  },

  /**
   * GET /api/explain/{language}
   * Fetches live multilingual explanations (en, hi, mr) from FastAPI
   */
  async getExplanation(language: 'en' | 'hi' | 'mr' | string): Promise<ExplanationResponse> {
    const langKey = language.toLowerCase();
    if (isDemoActive()) {
      return FALLBACK_EXPLANATIONS[langKey] || FALLBACK_EXPLANATIONS.en;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/explain/${langKey}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Server responded with HTTP ${res.status}`);
      }

      const data: ExplanationResponse = await res.json();
      console.log(`[Dhaal API] Live explanation via ${API_BASE_URL}/api/explain/${langKey}:`, data);
      return data;
    } catch (err: unknown) {
      console.warn(`[Dhaal API] Live getExplanation(${langKey}) unreachable at ${API_BASE_URL}/api/explain/${langKey}. Using offline fallback:`, err);
      return FALLBACK_EXPLANATIONS[langKey] || FALLBACK_EXPLANATIONS.en;
    }
  },

  /**
   * POST /api/brief/generate
   * Generates sealed CA Dossier on live FastAPI backend
   */
  async generateBrief(payload: BriefGenerateRequest): Promise<BriefGenerateResponse> {
    if (isDemoActive()) {
      return {
        status: 'SUCCESS',
        dossier_id: payload.notice_id ? `DH-2025-ASMT10-8912` : 'DH-2025-ASMT10-8912',
        timestamp: '2025-06-01T12:00:00Z',
        assessee: { name: 'M/s Sharma Garments', gstin: '27XXXXX1234X1ZX' },
        verified_draft: payload.draft_text,
        disclaimer: 'Drafting aid prepared for professional CA review. Not official legal filing.',
      };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/brief/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server responded with HTTP ${res.status}`);
      }

      const data: BriefGenerateResponse = await res.json();
      console.log(`[Dhaal API] Live sealed brief generated via ${API_BASE_URL}/api/brief/generate:`, data);
      return data;
    } catch (err: unknown) {
      console.warn(`[Dhaal API] Live generateBrief unreachable at ${API_BASE_URL}/api/brief/generate. Using offline fallback:`, err);
      return {
        status: 'SUCCESS',
        dossier_id: payload.notice_id ? `DH-2025-ASMT10-8912` : 'DH-2025-ASMT10-8912',
        timestamp: '2025-06-01T12:00:00Z',
        assessee: { name: 'M/s Sharma Garments', gstin: '27XXXXX1234X1ZX' },
        verified_draft: payload.draft_text,
        disclaimer: 'Drafting aid prepared for professional CA review. Not official legal filing.',
      };
    }
  },
};

// Default export alias
export default dhaalApi;
export const mockApi = dhaalApi;
