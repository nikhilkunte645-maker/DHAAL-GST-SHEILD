# DHAAL (ढाल) 2.0 — FINAL MASTER REPOSITORY FORENSIC AUDIT
**Date**: November 20, 2026  
**Auditor**: Integrated Product, Architecture, Security & QA Engineering Team  
**Repository**: [nikhilkunte645-maker/DHAAL-GST-SHEILD](https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD)  
**Production URL**: [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)  
**Production API**: [https://dhaal-gst-sheild.vercel.app/api](https://dhaal-gst-sheild.vercel.app/api)  
**Current HEAD Commit**: `88bdb63`  

---

## 1. Executive Summary & Audit Scope

This forensic audit evaluates the entire DHAAL codebase across frontend, backend, legal intelligence, reconciliation, AI orchestration, security boundaries, and production deployment against the rigorous standards of a production-grade Indian GST LegalTech platform.

Following the initial release (`1681858`) and the subsequent critical integrity hotfix (`ccf03b9` / `444928e` / `88bdb63`), this audit inspects the live repository to establish what is **actually implemented**, what is **partially implemented**, what was **remediated**, and what **residual limitations** exist.

---

## 2. Component Implementation Status

### 2.1 Actually Implemented Features (Verified by Working Code & Passing Tests)
1. **Deterministic GST Reconciliation Engine (`backend/reconciler.py`)**:
   - Two-tier matching: Exact compound hash matching (`GSTIN + Clean Invoice No + Exact Tax`) and explainable fuzzy matching (`Levenshtein distance <= 2, Date <= 30 days, Tax diff <= Rs. 10`).
   - Section 170 CGST Act statutory rounding (`ROUND_HALF_UP` to the nearest integer rupee).
   - Canonical 24-invoice purchase register reconciled against Form ASMT-10 discrepancy amount (exact ₹1,84,250 match, 0 unexplained variance).
   - Verified by `backend/tests/test_reconciler.py` (4 tests) and frontend `src/lib/__tests__/financialPrecision.test.ts` (13 tests).

2. **Period-Aware Legal Intelligence Engine (`backend/circular_183.py` & `src/lib/section16.ts`)**:
   - CBIC Circular 183/15/2022-GST strictly bounded to **FY 2017-18 and FY 2018-19** for Form GSTR-2A vs 3B differences.
   - Enforces ₹5 Lakh CA/CMA certificate threshold with mandatory **UDIN** vs supplier declaration.
   - Rejects Circular 183 relief for FY 2024-25 and Form GSTR-2B mismatches (governed by Section 16(2)(aa)).
   - Distinguishes Section 16(2)(aa) (effective 01.01.2022) and Section 16(2)(ba) (effective 01.10.2022).
   - Verified by `backend/tests/test_circular_183.py` (7 tests) and `src/lib/__tests__/section16.test.ts` (4 tests).

3. **Statutory Deadline & Limitation Calculator (`src/lib/deadline.ts`)**:
   - Differentiates Section 61(1) scrutiny authority, Rule 99(1) 30-day notice reply window, Rule 99(2) explanation acceptance, and Section 61(3) order initiation.
   - Period-aware tax determination: Section 73 & Section 74 (up to FY 2023-24) vs **Section 74A** (FY 2024-25 onwards under Finance (No. 2) Act, 2024).
   - Verified by `src/lib/__tests__/deadline.test.ts` (22 tests).

4. **Source-Grounded Evidence Graph DAG (`backend/evidence_graph.py` & `src/components/EvidenceGraphViewer.tsx`)**:
   - Structural DAG connecting notice allegation $\to$ statutory rules $\to$ vouchers $\to$ bank payment $\to$ E-Way bills $\to$ missing supplier confirmation $\to$ defense draft $\to$ CA review.
   - Automated Pydantic model validator rejecting duplicate node IDs, duplicate edge IDs, dangling edges, and invalid relationships.
   - Transparent provenance tagging (`SYNTHETIC`, `UPLOADED`, `PARSED`, `UNVERIFIED`, `VERIFIED`, `MISSING`, `REJECTED`, `CA_REVIEWED`).
   - Canonical SHA-256 deterministic node hashing for in-memory graph tamper detection.
   - Verified by `backend/tests/test_evidence_graph.py` (7 tests).

5. **Evidence Completeness Indicator (ECI)**:
   - Explicit 100-point denominator metric tracking documentation presence across invoices (25 pts), banking (25 pts), delivery (15 pts), supplier proof (0 pts), and recipient filing (5 pts).
   - Separates real verified score (0% for demo) from synthetic demo completeness (70%).
   - Explicit statutory disclaimer that ECI does not predict legal adjudication or guarantee compliance.

6. **Deterministic Notice Ingestion & Validation (`backend/main.py`)**:
   - Magic-byte validation (`%PDF`), file extension check, empty file rejection, and 4 MB size limit enforcement.
   - Text layer extraction and extraction error handling for scanned bitmaps without text.
   - Verified by `backend/tests/test_upload.py` (6 tests).

7. **Deterministic Draft Verifier (`backend/verifier.py` & `src/screens/Screen5DraftVerifier.tsx`)**:
   - Verifies draft reply text against confirmed notice facts: exact discrepancy amount, notice reference, GSTIN, tax period, and statutory sections.
   - Verified by `backend/tests/test_verifier.py` (4 tests).

8. **Multi-Language Vernacular Explanations (`backend/main.py` & `src/screens/Screen3ExplainerDeadlines.tsx`)**:
   - Fully localized explanations in English (`en`), Hindi (`hi`), and Marathi (`mr`).
   - Verified by API tests in `backend/test_api.py`.

9. **Professional FinTech User Experience (`src/`)**:
   - Responsive design across 7 viewports (1920x1080 down to 390x844 mobile).
   - 0 horizontal overflows, 0 touch targets under 44x44px.
   - Accessible keyboard controls and clear visual indicators for synthetic demonstration fixtures.

---

### 2.2 Partially Implemented Features & Realistic Boundaries
1. **OCR for Scanned Bitmap PDFs**:
   - Currently, uploaded PDFs must contain an extractable text layer. If a user uploads a pure raster scanned image with no embedded text, the backend returns `422 Unprocessable Entity (NO_TEXT_LAYER)` instead of hallucinating values.
   - Real Tesseract/PyTesseract OCR is not bundled in the serverless environment to prevent cold-start bloat and memory exhaustion.
2. **External LLM Integration**:
   - DHAAL includes an architectural AI investigation schema and prompt pipeline, but does **NOT** rely on external LLM calls for core financial calculations, tax liability determination, or statutory deadlines.
   - When no external API key is provided, DHAAL uses transparent, deterministic statutory templates that are completely free of hallucination risks.

---

## 3. Forensic Defect Register & Resolution Status

| Defect ID | Severity | Category | Description | Root Cause | Status | Acceptance Test |
|:---|:---:|:---:|:---|:---|:---:|:---|
| **DEF-01** | **CRITICAL** | Graph Integrity | Duplicate node ID `node_statute_16_2_prov` in Evidence Graph. | Collision between Section 16(2) 2nd Proviso and Circular 183. | **RESOLVED** | `test_evidence_graph_basic_topology_and_uniqueness`, `test_graph_validation_rejects_duplicate_node_id` |
| **DEF-02** | **HIGH** | Data Provenance | Demo UTR `SAMPLEUTR0001` marked as `VERIFIED`. | Lack of explicit provenance tagging. | **RESOLVED** | `test_bank_synthetic_utr_not_verified` |
| **DEF-03** | **HIGH** | Evidence Accuracy | E-Way Bill node claimed 100% verified delivery despite 18/24 attached. | Aggressive completeness assumption. | **RESOLVED** | `test_eway_bill_partial_coverage` |
| **DEF-04** | **CRITICAL** | GST Law | Circular 183 cited for FY 2024-25 GSTR-2B mismatch. | Overextension of historical CBIC circular. | **RESOLVED** | 7 tests in `test_circular_183.py` |
| **DEF-05** | **MEDIUM** | Statutory Limitation | Conflation of Section 61 scrutiny with Section 73/74/74A orders. | Lack of period-aware limitation mapping. | **RESOLVED** | 22 tests in `deadline.test.ts` |
| **DEF-06** | **HIGH** | GST Law | Uniform application of Section 16(2)(aa) to periods prior to 01.01.2022. | Missing effective date check. | **RESOLVED** | 4 tests in `section16.test.ts` |
| **DEF-07** | **MEDIUM** | Metric Integrity | Evidentiary strength score lacked defined denominator and allowed demo data inflation. | Undefined scoring model. | **RESOLVED** | `test_evidence_completeness_indicator_breakdown` |
| **DEF-08** | **MEDIUM** | Security | Graph SHA-256 lacked deterministic canonical ordering and legal disclaimer. | Unsorted JSON serialization. | **RESOLVED** | `test_evidence_graph_basic_topology_and_uniqueness` |

---

## 4. Test Coverage Summary

- **Frontend (Vitest)**: 51 / 51 passed across 4 test suites (1.10s).
- **Backend (Pytest)**: 41 / 41 passed across 6 test modules (1.48s).
- **Static Analysis (TypeScript)**: `tsc --noEmit` $\to$ 0 errors.
- **Production Build (Vite)**: Clean production build (5.50s), bundle size: 927 KB JS / 92 KB CSS.
- **End-to-End Responsive & PDF Audit**: 3 multi-page A4 PDFs generated (EN, HI, MR); 0 touch target violations (<44px); 0 horizontal overflow errors.

---

## 5. Deployment & Production Verification Status

- **GitHub Repository**: [nikhilkunte645-maker/DHAAL-GST-SHEILD](https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD)
- **Deployment Platform**: Vercel Serverless (Node.js 20.x + Python 3.12/3.14 + Edge CDN).
- **Production Branch**: `main` (commit `88bdb63`).
- **Development Branch**: `ui/declutter` (synchronized at `88bdb63`).
- **Live URL**: [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)
- **GitHub Actions CI Status**: All workflow checks passing.
- **Production Live Health**: Verified online; API endpoints returning 200 OK with correct period-aware and provenance payloads.

**Forensic Audit Verdict**: **SYSTEM PRODUCTION-READY — NO OUTSTANDING BLOCKERS**
