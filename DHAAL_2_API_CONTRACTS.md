# DHAAL 2.0 — CANONICAL API SPECIFICATION & DATA CONTRACTS (PHASE 1)
**Complete OpenAPI 3.1 REST Endpoints for GST Scrutiny Defense & Evidence Graph**

**Version:** 2.0.0-PROD-SPEC  
**Base URL (Production):** `https://dhaal-gst-sheild.vercel.app/api/v2`  
**Base URL (Local Dev):** `http://localhost:8001/api/v2`  
**Content-Type:** `application/json` (except where `multipart/form-data` is specified)  

---

## 1. Global Standards & Protocol Rules

### 1.1 Error Representation Standard (RFC 7807)
All error responses strictly adhere to RFC 7807 Problem Details:
```json
{
  "type": "https://dhaal.app/errors/INVALID_GSTIN_CHECKSUM",
  "title": "Invalid GSTIN Checksum",
  "status": 422,
  "detail": "Supplier GSTIN '27XXXXX5678X1ZX' failed Modulo-36 statutory check digit verification.",
  "instance": "/api/v2/cases/cas_8912/invoices/err_991823",
  "error_code": "ERR_GSTIN_CHECKSUM_FAILED",
  "timestamp": "2026-11-20T00:57:00Z",
  "fields": [
    {
      "field": "supplier_gstin",
      "rejected_value": "27XXXXX5678X1ZX",
      "expected_format": "2 digits state code + 10 char PAN + 1 entity num + 1 'Z' + 1 checksum"
    }
  ]
}
```

### 1.2 Common HTTP Headers
- `X-Correlation-ID`: `UUIDv4` for end-to-end distributed tracing.
- `X-Tenant-ID`: Identifies the client organization (`org_...`). Defaults to `org_demo_ca` in local development.
- `Authorization`: `Bearer <JWT_TOKEN>` with RS256 signature.

---

## 2. Complete Endpoint Specifications Across the 14 Core Workflows

### 2.1 Case Lifecycle & Ingestion

#### `POST /cases`
Creates a new scrutiny defense case under a client.
- **Request Body (JSON):**
```json
{
  "client_id": "cli_apex_enterprises",
  "statutory_form": "GST-ASMT-10",
  "notes": "Scrutiny notice received for FY 2024-25 Q1."
}
```
- **Response (201 Created):**
```json
{
  "case_id": "cas_2025_asmt10_8912",
  "client_id": "cli_apex_enterprises",
  "statutory_form": "GST-ASMT-10",
  "status": "CREATED",
  "created_at": "2026-11-20T00:57:30Z"
}
```

#### `POST /cases/{case_id}/documents`
Uploads raw notice scans, GSTR-2B JSON, or purchase registers.
- **Request:** `multipart/form-data`
  - `file`: Binary file (PDF, CSV, JSON, XLSX; $\le 15\text{MB}$)
  - `doc_type`: `NOTICE_PDF` | `GSTR2B_JSON` | `PURCHASE_REGISTER_CSV` | `BANK_STMT`
- **Response (200 OK):**
```json
{
  "doc_id": "doc_notice_asmt10_01",
  "case_id": "cas_2025_asmt10_8912",
  "file_name": "Form_ASMT_10_ZA270525008912M.pdf",
  "doc_type": "NOTICE_PDF",
  "file_size_bytes": 487291,
  "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "uploaded_at": "2026-11-20T00:57:45Z"
}
```

---

### 2.2 Notice Intelligence & Extraction

#### `POST /cases/{case_id}/notice/extract`
Parses the uploaded Form ASMT-10 / DRC-01A notice PDF.
- **Response (200 OK):**
```json
{
  "notice_id": "not_za270525008912m",
  "case_id": "cas_2025_asmt10_8912",
  "din": "ZA270525008912M",
  "statutory_section": "61",
  "notice_date": "2025-05-14",
  "reply_deadline": "2025-06-13",
  "total_questioned_amount": 184250,
  "urgency_state": "NORMAL",
  "days_remaining": 24,
  "extraction_confidence": 0.985,
  "requires_human_verification": false
}
```

#### `PUT /cases/{case_id}/notice/confirm`
Human-in-the-loop sign-off confirming extracted notice values.
- **Request Body (JSON):**
```json
{
  "confirmed_din": "ZA270525008912M",
  "confirmed_amount": 184250,
  "confirmed_section": "61",
  "confirmed_deadline": "2025-06-13"
}
```
- **Response (200 OK):**
```json
{
  "case_id": "cas_2025_asmt10_8912",
  "status": "NOTICE_EXTRACTED",
  "is_confirmed": true,
  "unlocked_next_stage": "RECONCILIATION"
}
```

---

### 2.3 GST Reconciliation Engine

#### `POST /cases/{case_id}/reconciliation/run`
Executes two-tier matching (exact & fuzzy) between purchase registers and GSTR-2B.
- **Request Body (JSON):**
```json
{
  "target_discrepancy_amount": 184250,
  "rounding_policy": "SECTION_170_ROUND_HALF_UP",
  "fuzzy_threshold_similarity": 0.85
}
```
- **Response (200 OK):**
```json
{
  "run_id": "rec_2025_q1_run01",
  "case_id": "cas_2025_asmt10_8912",
  "summary": {
    "total_invoices_matched": 24,
    "total_taxable_value": 1023611,
    "total_questioned_itc": 184250,
    "reconciled_difference": 184250,
    "unexplained_delta": 0,
    "accuracy_ratio": 1.0000
  },
  "discrepancies": [
    {
      "discrepancy_id": "dis_line01_1101",
      "line_no": 1,
      "invoice_no": "AT/24-25/1101",
      "supplier_name": "M/s Apex Textiles (fictional)",
      "taxable_value": 45833,
      "claimed_itc": 8250,
      "available_2b": 0,
      "difference": 8250,
      "category": "Classification Error"
    }
  ]
}
```

---

### 2.4 The DHAAL Evidence Graph

#### `GET /cases/{case_id}/evidence/graph`
Retrieves the full directed bipartite graph topology.
- **Response (200 OK):**
```json
{
  "case_id": "cas_2025_asmt10_8912",
  "graph_version": "2.0.0",
  "nodes": [
    {
      "id": "node_not_01",
      "type": "ALLEGATION",
      "label": "ASMT-10 Row 02 (₹1,84,250)",
      "properties": { "statutory_ground": "Table 4(A)(5) vs GSTR-2B" }
    },
    {
      "id": "node_inv_1101",
      "type": "INVOICE",
      "label": "Invoice AT/24-25/1101",
      "properties": { "taxable": 45833, "tax": 8250 }
    },
    {
      "id": "node_bank_01",
      "type": "BANKING_PROOF",
      "label": "UTR: SAMPLEUTR0001",
      "properties": { "bank": "HDFC Bank", "cleared_within_180_days": true }
    }
  ],
  "edges": [
    {
      "id": "edge_01",
      "source": "node_not_01",
      "target": "node_inv_1101",
      "relationship": "ITEMIZED_UNDER"
    },
    {
      "id": "edge_02",
      "source": "node_inv_1101",
      "target": "node_bank_01",
      "relationship": "DISCHARGED_BY"
    }
  ],
  "evidentiary_strength_score": 88
}
```

---

### 2.5 Response Copilot & CA Approval

#### `POST /cases/{case_id}/copilot/generate-draft`
Synthesizes structured Form ASMT-11 reply with verified citation tags.
- **Request Body (JSON):**
```json
{
  "tone": "PROFESSIONAL_ASSERTIVE",
  "language": "en",
  "include_precedents": true
}
```
- **Response (200 OK):**
```json
{
  "draft_id": "drf_asmt11_reply_v1",
  "case_id": "cas_2025_asmt10_8912",
  "total_claimed_amount": 184250,
  "draft_content": "...formal legal text with [DEG-INV-1101] citations...",
  "pre_flight_passed": true
}
```

#### `POST /cases/{case_id}/review/approve`
Professional Chartered Accountant sign-off with membership number and UDIN.
- **Request Body (JSON):**
```json
{
  "ca_name": "CA Rajesh Sharma",
  "ca_membership_no": "049281",
  "udin": "25049281BGXYZ9912",
  "firm_name": "Sharma & Associates"
}
```
- **Response (200 OK):**
```json
{
  "review_id": "rev_ca_signoff_8912",
  "case_id": "cas_2025_asmt10_8912",
  "action": "APPROVED",
  "status": "APPROVED",
  "pdf_export_unlocked": true
}
```

#### `GET /cases/{case_id}/export/brief-pdf?lang=en`
Streams the certified, publication-grade multi-page A4 PDF brief.
- **Response (200 OK):** Binary stream (`application/pdf`) with `Content-Disposition: attachment; filename="DHAAL_CA_Brief_cas_8912.pdf"`.
