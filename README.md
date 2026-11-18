# DHAAL (ढाल): GST Notice Shield
> **Form ASMT-10 Statutory Scrutiny Defense & CA-Ready Brief Synthesizer**

Dhaal (ढाल / Shield) is a high-precision, production-grade legal-fintech single-page application engineered to safeguard Indian MSMEs facing Goods and Services Tax (GST) scrutiny notices under **Form GST ASMT-10 [Rule 99(1)]**. It eliminates notice-induced panic, parses questioned discrepancies, enforces human-in-the-loop checkpoints, explains statutory allegations in plain Indic vernacular (Hindi, Marathi, and English), itemizes audit trails, and generates an audit-ready Chartered Accountant brief.

---

## 🛡️ Architecture & Design Philosophy

- **Modern Institutional Precision**: Built in strict adherence to `dhaal_shield_precision/DESIGN.md`, pairing Deep Navy (`#0B1F3A`) foundations with High-Urgency Saffron (`#F59E0B`) beacons and Verified Teal (`#0E9FA8`).
- **Zero-Drift & Deterministic Safety**: Replaces vague AI claims with rigorous code-level validation (`amount.ts`, `verifier.ts`, `deadline.ts`).
- **Human-in-the-Loop Amber Pause Checkpoint**: If an OCR smudge or printhead ink-smear causes uncertainty on questioned figures, the pipeline deliberately pauses to prevent unintended tax admissions.
- **Bilingual Indic Native**: Built-in support for English, Hindi (हिन्दी), and Marathi (मराठी) using self-hosted Noto Sans Devanagari with expanded line-height (`1.6`) to prevent matra clipping.
- **100% Offline Capability**: All fonts, icons, styling, and logic run completely client-side with zero external CDN dependencies at runtime.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on Node 20 / Node 24)
- npm 9+

### Installation & Development
```bash
# Clone or navigate to the repository root
cd DHAAL

# Install dependencies
npm install

# Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Verification
```bash
# Typecheck and compile production bundle
npm run build

# Run unit tests
npm test
```

### Running the FastAPI Backend
```bash
# Navigate to the backend directory
cd backend

# Install dependencies (or activate your venv)
pip install -r requirements.txt

# Run the API server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Run backend tests
python test_api.py
```
API docs are available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 📂 Project Structure

```
DHAAL/
├── backend/                       # Python FastAPI backend
│   ├── main.py                    # API routes, CORS & canonical case endpoints
│   ├── schemas.py                 # Pydantic v2 schemas
│   ├── verifier.py                # Dual-layer deterministic statutory verification
│   ├── test_api.py                # API test suite (7/7 passed)
│   └── requirements.txt           # FastAPI, Uvicorn, Pydantic dependencies
├── docs/
│   └── screenshots/               # Desktop (1440px) & Mobile (390px) screenshots
│       ├── desktop_1_landing_upload.png
│       ├── desktop_2_extraction_pause_confirmation.png
│       ├── desktop_3_explainer_deadlines.png
│       ├── desktop_4_evidence_checklist.png
│       ├── desktop_5_draft_verifier.png
│       ├── desktop_6_ca_ready_brief.png
│       └── mobile_...
├── src/
│   ├── components/                # Reusable shell & UI components
│   │   ├── Header.tsx             # Fixed header with stepper, disclaimer & language switcher
│   │   ├── Sidebar.tsx            # Case metadata sidebar & mobile drawer
│   │   ├── NoticeScanViewer.tsx   # Interactive vector ASMT-10 notice scanner
│   │   ├── RawScanModal.tsx       # Focus-trapped modal for viewing raw notice scan
│   │   └── HelpFaqModal.tsx       # Statutory compliance & FAQ modal
│   ├── data/
│   │   ├── demoCase.ts            # Single source of truth for canonical demo data
│   │   ├── i18n.ts                # English, Hindi, and Marathi translation dictionaries
│   │   └── reconciliationData.ts  # 24 invoice rows summing to ₹1,84,250 with CSV export
│   ├── lib/                       # Pure logic engines (fully unit-tested)
│   │   ├── amount.ts              # Mathematical validation of discrepancy amount
│   │   ├── deadline.ts            # Statutory countdown & urgency classification
│   │   ├── format.ts              # Indian Rupee (INR) formatting (e.g. ₹1,84,250)
│   │   ├── hash.ts                # Web Crypto SHA-256 content hashing
│   │   ├── verifier.ts            # Regex extraction & multi-rule draft verifier
│   │   └── __tests__/             # Vitest test suite
│   ├── screens/                   # The 6 core application workflow steps
│   │   ├── Screen1Upload.tsx
│   │   ├── Screen2ConfirmPause.tsx
│   │   ├── Screen3ExplainerDeadlines.tsx
│   │   ├── Screen4EvidenceChecklist.tsx
│   │   ├── Screen5DraftVerifier.tsx
│   │   └── Screen6CaReadyBrief.tsx
│   ├── services/
│   │   └── mockApi.ts             # Typed service layer mirroring FastAPI endpoints
│   ├── store/
│   │   └── useDhaalStore.ts       # Zustand store with step gating & persistence
│   ├── App.tsx                    # Shell router & responsive layout
│   ├── index.css                  # Design tokens, fonts, print styles
│   └── main.tsx                   # React 18 DOM root
├── tailwind.config.ts             # DESIGN.md color tokens, typography & elevations
├── vite.config.ts
└── package.json
```

---

## 🔌 Swapping mockApi for a Real FastAPI Backend

The application is architected with a decoupled service layer in `src/services/mockApi.ts`. All UI components interact strictly with this interface.

To connect to a live Python / FastAPI backend:

1. Update `src/services/mockApi.ts` to call your API base URL:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const mockApi = {
  async uploadNotice(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/notices`, { method: 'POST', body: formData });
    return res.json();
  },
  async getNotice(id: string) {
    const res = await fetch(`${API_BASE}/notices/${id}`);
    return res.json();
  },
  async confirmAmount(req: { caseId: string; confirmedAmount: number }) {
    const res = await fetch(`${API_BASE}/notices/${req.caseId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    return res.json();
  },
  // Same for /draft, /verification, and /brief
};
```

2. Point `VITE_API_BASE_URL` in your `.env` file to your server.

---

## 🧪 Testing

Run the Vitest test suite:
```bash
npm test
```
Validates:
- `formatINR` Indian rupee formatting
- `validateConfirmedAmount` notice table difference checking (₹14,92,450 − ₹13,08,200 = ₹1,84,250)
- `getUrgencyInfo` normal (30-15d), caution (14-7d), and critical (<7d) states
- `verifyDraft` passing drafts, mismatched amounts, unanchored dates, and unsupported statutory section codes
- `computeSha256` Web Crypto digest calculation

---

## ⚖️ Statutory & Compliance Disclaimer

> **Statutory Drafting aid for professional review. Not legal advice. Nothing is filed.**
> All assessee information, GSTINs, supplier identities, and Document Identification Numbers (DIN) in this demo application are synthetic representations created for evaluation purposes. The generated brief and Form ASMT-11 draft must be independently audited, finalized, and endorsed with a valid UDIN by a practicing Chartered Accountant prior to official submission.
