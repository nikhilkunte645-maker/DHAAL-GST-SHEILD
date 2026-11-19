# DHAAL 2.0 — ARCHITECTURE BASELINE & REPOSITORY AUDIT (PHASE 0)
**Current System State, Reusable Asset Inventory, Risk Analysis & Dependency Map**

**Audit Timestamp:** 2026-11-20T00:56:00+05:30  
**Branch:** `ui/declutter` (ahead of `origin/ui/declutter` by 2 commits)  
**Target Production Branch:** `main`  
**Repository:** `nikhilkunte645-maker/DHAAL-GST-SHEILD`  
**Local Directory:** `C:\Users\lucifer\DHAAL`  

---

## 1. Directory Structure Inventory

```
C:\Users\lucifer\DHAAL
├── .github/workflows/ci.yml       # Automated GitHub Actions CI (Typecheck, Vitest, Pytest)
├── api/                           # Vercel Serverless Entrypoint
│   ├── index.py                   # Routes /api requests directly to backend.main:app
│   └── requirements.txt           # Vercel serverless Python runtime dependencies
├── backend/                       # Core FastAPI application
│   ├── main.py                    # API routes, PDF upload, verification, in-memory state
│   ├── schemas.py                 # Pydantic data schemas
│   ├── verifier.py                # Section 170 Decimal rounding & draft consistency verifier
│   ├── test_api.py                # Pytest suite for API endpoints & Section 170 rounding
│   └── tests/                     # Specialized unit tests (upload, verifier)
├── dist/                          # Production Vite bundle (verified clean build)
├── docs/screenshots/              # 13 verified high-resolution desktop & mobile UI screenshots
├── scripts/                       # Verification scripts
│   ├── test_pdf_and_verification.js # End-to-end PDF export, touch targets & viewport audit
│   └── verify_ui.js               # Puppeteer UI layout inspector
├── src/                           # Frontend React 18 + TypeScript Application
│   ├── components/                # UI components (Header, Sidebar, Modals, BrandLogo)
│   ├── data/                      # Data files (demoCase, i18n, reconciliationData)
│   ├── lib/                       # Utilities & core logic (deadline, amount, verifier, format)
│   │   └── __tests__/             # Vitest suites (deadline, financialPrecision, lib)
│   ├── screens/                   # 7 Workflow screens (Dashboard, Steps 1 through 6)
│   ├── store/                     # Zustand state management (useDhaalStore.ts)
│   ├── utils/                     # PDF export engine (pdfExport.ts)
│   ├── App.tsx                    # Root hash router & responsive layout shell
│   └── index.css                  # Tailwind styles & print media stylesheets
├── package.json                   # React 18, Vite 5, Tailwind 3, Vitest 1.5
├── vercel.json                    # Vercel serverless rewrite rules & build configuration
└── .env.example                   # Clean template for runtime environment variables
```

---

## 2. Inventory of Current Modules & Capabilities

### 2.1 Frontend Screens & Routes (Hash Router in `src/App.tsx`)
- `#dashboard` $\to$ `DashboardScreen.tsx`: Overview of statutory notice status, demo case banner, quick stats, and workflow initiation.
- `#upload` (Step 1) $\to$ `Screen1Upload.tsx`: Drag-and-drop PDF dropzone with client-side file inspection, progress simulation, and server upload handoff.
- `#confirm` (Step 2) $\to$ `Screen2ConfirmPause.tsx`: Dual-canvas scan viewer showing the Form ASMT-10 table alongside high-contrast zoom lenses and field confirmation buttons.
- `#explain` / `#reconcile` (Step 3) $\to$ `Screen3ExplainerDeadlines.tsx`: Statutory explanation of Section 61, urgent deadline calculator, and the 24-invoice itemized reconciliation ledger.
- `#evidence` (Step 4) $\to$ `Screen4EvidenceChecklist.tsx`: Section 16(2) compliance checklist (Purchase invoices, bank UTRs, E-Way bills, supplier declarations, CA memo).
- `#draft` (Step 5) $\to$ `Screen5DraftVerifier.tsx`: Form ASMT-11 reply editor with dynamic legal anchors and pre-submission consistency verifier.
- `#brief` (Step 6) $\to$ `Screen6CaReadyBrief.tsx`: Publication-grade dossier with multi-lingual toggles (EN, HI, MR) and zero-clipping multi-page A4 PDF export.

### 2.2 Backend Routes (`backend/main.py`)
- `GET /` & `GET /api`: Health check endpoint.
- `POST /api/notice/upload`: Ingests multipart PDF, performs magic-byte validation (`%PDF`), size check ($\le 4\text{MB}$), and text extraction with fallback.
- `POST /api/verify/draft`: Audits generated reply against confirmed amount and section code.
- `GET /api/explain/{language}`: Retrieves statutory explainer in English, Hindi, or Marathi.
- `POST /api/brief/generate`: Synthesizes final dossier payload with SHA-256 hash.
- `POST /api/notices`: SPA-compatible notice upload handler.
- `GET /api/notices/{case_id}`: Retrieves canonical notice metadata (`CANONICAL_CASE`).
- `POST /api/notices/{case_id}/confirm`: Verifies that confirmed amount matches Table 4(A)(5) arithmetic.
- `POST /api/notices/{case_id}/draft`: Generates Form ASMT-11 structured reply text.
- `GET /api/notices/{case_id}/verification`: Runs detailed `verify_draft` regex checks.
- `POST /api/notices/{case_id}/brief`: Computes SHA-256 tamper-evident hash for CA brief.

### 2.3 Data Storage & Database
- **Current State:** Ephemeral in-memory state.
- **Backend:** `CANONICAL_CASE` and `case_state` dict in Python RAM.
- **Frontend:** Zustand client-side reactive store (`useDhaalStore.ts`) persisting across step navigation.
- **Zero Disk Persistence:** No documents or taxpayer data are written to local disk or unencrypted databases.

### 2.4 GST Financial Math & Rounding
- **Reconciliation Ledger (`src/data/reconciliationData.ts`):** 24 explicit invoices summing **exactly to ₹1,84,250** discrepancy and **₹10,23,611** taxable value.
- **Section 170 CGST Act Compliance (`backend/verifier.py`):** Uses Python `Decimal` and `ROUND_HALF_UP` (50 paise or more rounds UP to the nearest rupee).

### 2.5 Security & Environment Variables
- **Environment Variables Identified in Config:**
  - `VITE_API_BASE_URL` (Defaults to `http://localhost:8001` or relative `/api`)
  - `PORT` (Defaults to `8001`)
  - `UV_LINK_MODE` (Set to `copy` in Vercel configuration)
- **Secrets Exposure:** None found in repository. `.env.local` is ignored in `.gitignore`.
- **Sensitive Logging:** Masked `notice_id` (e.g. `ZA27***2M`) and omitted raw rupee amounts from standard server logs.

---

## 3. Dependency Map & Inter-Module Relationships

```mermaid
graph TD
    UI[React 18 SPA] --> Store[Zustand Store]
    Store --> Screen1[Screen 1: Upload]
    Store --> Screen2[Screen 2: Confirm]
    Store --> Screen3[Screen 3: Reconcile & Deadlines]
    Store --> Screen4[Screen 4: Evidence Checklist]
    Store --> Screen5[Screen 5: Draft Verifier]
    Store --> Screen6[Screen 6: CA Brief]

    Screen1 --> API_Upload[/api/notice/upload]
    Screen2 --> API_Confirm[/api/notices/confirm]
    Screen3 --> Data_Rec[reconciliationData.ts]
    Screen3 --> Lib_Deadline[deadline.ts]
    Screen5 --> API_Verify[/api/verify/draft]
    Screen6 --> Util_PDF[pdfExport.ts]

    API_Upload --> Python_PyPDF[pypdf RAM Stream]
    API_Confirm --> Python_Verifier[verifier.py Section 170]
    API_Verify --> Python_Verifier
```

---

## 4. Architectural Analysis: Strengths, Deficiencies & Reuse Plan

| Dimension | What Already Works (Reuse) | What Is Incomplete / Deficient (Improve) | Redesign & Evolution Plan |
|:---|:---|:---|:---|
| **Financial Precision** | 24 invoices reconcile to exact ₹1,84,250; Section 170 Decimal rounding passing all unit tests. | Static invoice seeds; lacks dynamic user CSV ingestion and multi-rate tax calculations (12%, 28%). | Introduce dynamic `ReconciliationEngine` supporting user CSV uploads with exact & fuzzy matching. |
| **Notice Intelligence** | Native PyMuPDF text extraction; magic byte and size validation. | Regex-based extraction falls back to canonical data if text is noisy; lacks visual bounding box coordinates. | Add structured extraction confidence scores and multi-pass OCR fallback flags. |
| **Evidence Intelligence** | Section 16(2) compliance checklist (items 1–6) with statutory references. | Static checklist; items are not bound to individual invoices in a graph structure. | **Build DHAAL Evidence Graph (DEG):** Interactive DAG linking notice $\to$ invoices $\to$ bank UTRs $\to$ Section 16(2) legs. |
| **AI Investigation & Copilot** | Template-based Form ASMT-11 draft synthesis with regex verification. | No dynamic LLM structured output; no citation pills linking draft text to evidence nodes. | Bind Gemini 1.5 Pro via Pydantic schemas with inline Evidence Graph citation tags (`[DEG-INV-xxx]`). |
| **Audit & Case Lifecycle** | SHA-256 content hashing in CA brief endpoint. | Case state transitions are not formally tracked in an append-only audit trail. | Implement hash-chained `AuditEvent` ledger tracking every user and system operation. |
| **UI / UX** | Responsive Tailwind layout, dual-canvas scan viewer, multi-page A4 PDF export. | Screen 4 is a table rather than a graph; Screen 5 lacks split-screen evidence inspection. | Upgrade Screen 4 with SVG/WebGL Evidence Graph canvas; upgrade Screen 5 to dual-pane copilot. |

---

## 5. Baseline Test Execution Results

- **Vitest Suite (`npm test -- --run`):** ✅ **3 passed, 43 total tests** (0 failed).
- **TypeScript Typecheck (`npx tsc --noEmit`):** ✅ **0 compilation errors**.
- **Vite Production Build (`npm run build`):** ✅ **Clean bundle in 5.37s**.
- **Pytest Suite (`python -m pytest backend/`):** ✅ **19 passed** (0 failed).
- **E2E PDF & UI Script (`node scripts/test_pdf_and_verification.js`):** ✅ **3 multi-page PDFs generated**, 0 undersized touch targets, 0 viewport overflows.

---

## 6. Phase 0 Conclusion & Sign-Off

The baseline audit confirms that the DHAAL repository is stable, mathematically sound, and free of blocking regressions. We now proceed to **Phase 1: Normalized Data Model and API Contracts**.
