# DHAAL (ढाल) — FINAL DEFECT REGISTER (PHASE 1)
**Comprehensive Full-Stack Audit, Defect Root Causes, Fixes Applied & Proof of Resolution**

**Audit Timestamp:** 2026-11-20T01:22:30+05:30  
**Severity Classification:** CRITICAL | HIGH | MEDIUM | LOW  
**Resolution Status:** 100% Resolved & Verified  

---

## 1. Defect Register

### Defect DEF-01: Legacy Invoice 24 Arithmetic Discrepancy
- **Severity:** CRITICAL
- **Description:** In `src/data/reconciliationData.ts`, invoice 24 discrepancy was set to ₹2,600, causing the 24 invoices to sum to ₹1,84,350 (₹100 higher than the Form ASMT-10 notice demand of ₹1,84,250).
- **Root Cause:** Legacy typo in seed amounts array (`[... 8300, 2600]`).
- **Affected Files:** `src/data/reconciliationData.ts`, `src/lib/__tests__/financialPrecision.test.ts`.
- **Fix Applied:** Changed invoice 24 to `{ diff: 2500, taxable: 13889 }`. The 24 invoices now sum **exactly to ₹1,84,250** discrepancy and **₹10,23,611** taxable value.
- **Proof of Resolution:** Passed `financialPrecision.test.ts` and `backend/tests/test_reconciler.py`.

---

### Defect DEF-02: Reverse Division Floating-Point Drift
- **Severity:** HIGH
- **Description:** On-the-fly division `Math.round(diff / 0.18)` introduced rounding artifacts and non-reproducible line-item taxable figures.
- **Root Cause:** IEEE-754 binary floating-point representation drift.
- **Affected Files:** `src/data/reconciliationData.ts`, `backend/reconciler.py`.
- **Fix Applied:** Replaced division with explicit pre-calculated source taxable integer values in `INVOICE_SEEDS`.
- **Proof of Resolution:** Passed `test_canonical_24_invoices_reconciliation`.

---

### Defect DEF-03: Section 170 Statutory Rounding vs Banker's Rounding
- **Severity:** HIGH
- **Description:** Python 3's built-in `round(2.5)` produces `2` (banker's round-to-even). Section 170 of the CGST Act strictly mandates that fractions of 50 paise or more must round UP to the nearest rupee.
- **Root Cause:** Use of generic language rounding helper without statutory grounding.
- **Affected Files:** `backend/verifier.py`, `backend/reconciler.py`.
- **Fix Applied:** Implemented `round_statutory_inr` using Python `Decimal` and `ROUND_HALF_UP`.
- **Proof of Resolution:** Passed `test_section_170_statutory_rounding` in `backend/test_api.py`.

---

### Defect DEF-04: Negative Countdown on Expired GST Notices
- **Severity:** HIGH
- **Description:** When notice dates were past the statutory 30-day reply window, the UI displayed negative countdowns (e.g. `"-5 days remaining"`).
- **Root Cause:** Missing explicit urgency state branching in `deadline.ts`.
- **Affected Files:** `src/lib/deadline.ts`, `src/components/Sidebar.tsx`, `src/screens/Screen3ExplainerDeadlines.tsx`.
- **Fix Applied:** Implemented mutually exclusive urgency states: `EXPIRED`, `DUE TODAY`, `CRITICAL`, `WARNING`, `NORMAL`, `UNVERIFIED`.
- **Proof of Resolution:** Passed 18 tests in `deadline.test.ts` covering leap years and expired dates.

---

### Defect DEF-05: Missing Demonstration Data Labels
- **Severity:** MEDIUM
- **Description:** Users could confuse the pre-loaded synthetic case for M/s Apex Enterprises with live production client data.
- **Root Cause:** Missing visible demo designation badges.
- **Affected Files:** `src/screens/DashboardScreen.tsx`.
- **Fix Applied:** Added `SAMPLE CASE / WORKSPACE DEMO` badge, `1 Sample Notice (Demonstration Mode ASMT-10)`, table header badge, and dismissible disclaimer banner.
- **Proof of Resolution:** Verified in dashboard rendering and E2E headless audit.

---

### Defect DEF-06: Potential Traceback Leakage in Serverless Error Handlers
- **Severity:** MEDIUM
- **Description:** Internal Python exceptions could potentially leak filesystem paths or stack traces in HTTP 500 / 422 responses.
- **Root Cause:** Generic exception handler returning raw `str(exc)`.
- **Affected Files:** `backend/main.py`.
- **Fix Applied:** Sanitized error responses using standardized RFC 7807 payloads, masked notice IDs (`ZA27***2M`), and omitted raw rupee amounts from standard server logs.
- **Proof of Resolution:** Passed `test_upload.py` and security audit.

---

## 2. Defect Verification Matrix

| Defect ID | Severity | Status | Verification Suite | Exit Code |
|:---:|:---:|:---:|:---:|:---:|
| **DEF-01** | CRITICAL | ✅ Resolved | `financialPrecision.test.ts` | 0 |
| **DEF-02** | HIGH | ✅ Resolved | `test_reconciler.py` | 0 |
| **DEF-03** | HIGH | ✅ Resolved | `test_api.py::test_section_170_statutory_rounding` | 0 |
| **DEF-04** | HIGH | ✅ Resolved | `deadline.test.ts` | 0 |
| **DEF-05** | MEDIUM | ✅ Resolved | `DashboardScreen.tsx` E2E check | 0 |
| **DEF-06** | MEDIUM | ✅ Resolved | `test_upload.py` | 0 |
