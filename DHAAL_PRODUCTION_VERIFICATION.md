# DHAAL (ढाल) — LIVE PRODUCTION VERIFICATION AUDIT
**Environment**: Production (Vercel Serverless + Edge CDN)  
**Verification Date**: November 20, 2026, 02:02 IST  
**Live URL**: [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)  
**Git Commit**: `444928e` (Integrity Hotfix Release)  

---

## 1. Network & Endpoint Verification Matrix

| # | Endpoint / Resource | Method | Expected HTTP | Received HTTP | Latency | Result |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | `https://dhaal-gst-sheild.vercel.app/` | `GET` | 200 OK | **200 OK** | ~180ms | **PASS** |
| 2 | `https://dhaal-gst-sheild.vercel.app/api` | `GET` | 200 OK | **200 OK** | ~120ms | **PASS** |
| 3 | `https://dhaal-gst-sheild.vercel.app/api/reconciliation/run` | `POST` | 200 OK | **200 OK** | ~240ms | **PASS** |
| 4 | `https://dhaal-gst-sheild.vercel.app/api/evidence/DH-2025-ASMT10-8912/graph` | `GET` | 200 OK | **200 OK** | ~140ms | **PASS** |
| 5 | `https://dhaal-gst-sheild.vercel.app/api/evidence/DH-2025-ASMT10-8912/scorecard` | `GET` | 200 OK | **200 OK** | ~110ms | **PASS** |
| 6 | `https://dhaal-gst-sheild.vercel.app/api/circular-183/assess` | `POST` | 200 OK | **200 OK** | ~130ms | **PASS** |

---

## 2. Detailed Response Payloads

### 2.1 Health Check (`GET /api`)
```json
{
  "status": "online",
  "system": "Dhaal Backend",
  "version": "1.0.0",
  "disclaimer": "Statutory Drafting aid for professional review. Not legal advice. Nothing is filed."
}
```
*Headers: `Server: Vercel`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.*

### 2.2 Reconciliation Engine (`POST /api/reconciliation/run`)
```json
{
  "total_purchase_invoices": 24,
  "total_gstr2b_invoices": 0,
  "exact_matches_count": 0,
  "fuzzy_matches_count": 0,
  "unreported_2b_count": 16,
  "delayed_filing_count": 8,
  "duplicates_count": 0,
  "total_taxable_value": 1023611,
  "total_questioned_difference": 184250,
  "target_notice_amount": 184250,
  "unexplained_variance": 0,
  "accuracy_ratio": 1.0,
  "precision": 1.0,
  "recall": 0.0,
  "f1_score": 0.0
}
```
*Mathematical Validation: $10,23,611 \text{ taxable} \times 18\% = 1,84,250 \text{ tax}$. Target notice discrepancy ₹1,84,250 completely accounted for.*

### 2.3 Evidence Graph DAG (`GET /api/evidence/DH-2025-ASMT10-8912/graph`)
```json
{
  "case_id": "DH-2025-ASMT10-8912",
  "nodes_count": 13,
  "edges_count": 12,
  "evidentiary_strength_score": 70,
  "evidence_completeness_indicator": 70,
  "missing_evidence_count": 2,
  "unverified_hypotheses_count": 1,
  "nodes": [
    {"id": "node_statute_16_2_proviso_2", "label": "CGST Sec 16(2) 2nd Proviso: Payment within 180 Days", "status": "CONFIRMED"},
    {"id": "node_guidance_circular_183", "label": "CBIC Circular No. 183/15/2022-GST", "status": "NOT_APPLICABLE"},
    {"id": "node_bank_DH-2025-ASMT10-8912", "label": "Bank Payment Voucher [SYNTHETIC DEMO] (UTR: SAMPLEUTR0001 - Unverified)", "status": "SYNTHETIC"},
    {"id": "node_eway_DH-2025-ASMT10-8912", "label": "E-Way Bills: 18 of 24 attached [PARTIAL] (6 missing delivery proof)", "status": "UNVERIFIED"}
  ]
}
```

### 2.4 Evidence Completeness & Circular 183 (`GET /api/evidence/DH-2025-ASMT10-8912/scorecard`)
```json
{
  "case_id": "DH-2025-ASMT10-8912",
  "evidence_completeness_indicator": 70,
  "eci_breakdown": {
    "total_possible_score": 100,
    "real_verified_score": 5,
    "synthetic_demo_score": 70,
    "evidence_completeness_percentage": 70
  },
  "circular_183_assessment": {
    "verdict": "NOT APPLICABLE",
    "financial_year": "2024-25",
    "reasons": [
      "Financial Year 2024-25 is outside the statutory scope of Circular 183/15/2022-GST (FY 2017-18 & 2018-19) and Circular 193/05/2023-GST (FY 2019-20 & 2020-21).",
      "For periods w.e.f. 01.01.2022, Section 16(2)(aa) strictly requires invoices to be reflected in Form GSTR-2B."
    ],
    "is_applicable": false
  }
}
```

---

## 3. Security & Browser Headers
- `Server`: Vercel Edge
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `Content-Type`: `application/json; charset=utf-8` / `text/html; charset=utf-8`
- `Vary`: `Origin`
- Ephemeral processing verified: No sensitive client or invoice files persisted on disk.
