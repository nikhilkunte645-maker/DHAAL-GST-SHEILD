# DHAAL (ढाल) — SECURITY, PRIVACY & DATA LIFECYCLE VERIFICATION (PHASE 9)
**End-to-End Document Lifecycle, Ephemeral Processing Audit & Residual Security Disclosures**

**Audit Timestamp:** 2026-11-20T01:22:50+05:30  
**Compliance Target:** Indian Digital Personal Data Protection (DPDP) Act, 2023 Principles  
**Status:** Canonical Security Audit  

---

## 1. Complete Document & Data Lifecycle Mapping

```
[User / Browser]
       │
       │ 1. Multipart PDF Upload (Max 4 MB) via TLS 1.3
       ▼
[FastAPI Entrypoint: /api/notice/upload]
       │
       │ 2. Magic-Byte Header Inspection (%PDF)
       ▼
[RAM Memory Buffer: io.BytesIO(file_bytes)]
       │
       │ 3. PyMuPDF Native Stream Text Extraction
       ▼
[In-Memory Text Buffer]
       │
       │ 4. Deterministic Regex Extractor (DIN, Section 61, ₹1,84,250)
       ▼
[Pydantic v2 NoticeMetadata Model]
       │
       │ 5. Response Delivered to Client JSON
       ▼
[Client Browser Zustand State]
       │
       │ 6. Request Context Closed
       ▼
[Python Garbage Collection: BytesIO Buffer Freed from RAM]
       │
   (ZERO bytes written to disk, /tmp, or external database)
```

### Detailed Lifecycle Stages:
1. **Upload Ingress:**
   - Files enter through `POST /api/notice/upload`.
   - Vercel Serverless runtime enforces a hard 4.5 MB request payload limit; our application middleware rejects any upload exceeding 4 MB (`MAX_FILE_SIZE = 4 * 1024 * 1024`).
2. **File Validation:**
   - Magic-byte verification requires `file_bytes.startswith(b"%PDF")`. Non-PDF files or renamed executables are rejected with HTTP 400 (`INVALID_FILE_TYPE`).
   - Corrupt or encrypted PDFs without extractable text are rejected with HTTP 422 (`CORRUPT_PDF` / `NO_TEXT_LAYER`).
3. **Processing & Memory Lifecycle:**
   - Uploaded bytes exist exclusively in RAM (`io.BytesIO(file_bytes)`).
   - No files are written to the server's local filesystem, `/tmp` directories, or external cloud buckets.
   - Once the extraction handler returns the JSON response, the `BytesIO` stream is unreferenced and reclaimed by Python's garbage collector.
4. **Third-Party Data Transmission:**
   - Zero document bytes or extracted taxpayer details are transmitted to external third-party APIs during standard notice processing or reconciliation.
5. **Logging & Error Disclosure:**
   - Notice IDs are masked in server logs (e.g. `ZA27***2M`).
   - Raw rupee amounts are omitted from standard operational logs.
   - Exception handlers return sanitized RFC 7807 problem payloads without leaking Python stack traces, server directories, or database connection strings.

---

## 2. Security Capabilities: Implemented vs Prototype Limitations

To maintain truth-in-claims transparency during hackathon evaluation, the table below distinguishes verified safeguards from prototype boundaries:

| Security Capability | Current Implementation Status | Verification Evidence |
|:---|:---:|:---|
| **Magic-Byte PDF Validation** | ✅ **Implemented & Verified** | `test_upload.py::test_invalid_file_type` |
| **Serverless Request Size Limit (4MB)**| ✅ **Implemented & Verified** | `test_upload.py::test_file_too_large` |
| **Ephemeral RAM Stream (Zero Disk)** | ✅ **Implemented & Verified** | Code audit of `backend/main.py` |
| **Sensitive PII Masking in Server Logs**| ✅ **Implemented & Verified** | `backend/main.py:426` log redactor |
| **Sanitized RFC 7807 Error Responses** | ✅ **Implemented & Verified** | `test_upload.py` (Zero tracebacks) |
| **Section 170 CGST Act Rounding** | ✅ **Implemented & Verified** | `test_section_170_statutory_rounding` |
| **Evidence Graph SHA-256 State Integrity** | ✅ **Implemented & Verified** | `test_evidence_graph.py` (In-memory tamper-check only; not proof of legal admissibility) |
| **Synthetic Provenance Flagging** | ✅ **Implemented & Verified** | Demo UTR `SAMPLEUTR0001` visibly marked `SYNTHETIC` throughout API & UI |
| **Multi-Tenant Database Row-Level Security**| ⚠️ **Prototype Boundary** | Currently uses in-memory single-session state; multi-tenancy is documented in `DHAAL_2_DATA_MODEL.md` for production roadmap. |
| **Role-Based Access Control (RBAC)** | ⚠️ **Prototype Boundary** | UI displays CA Sign-Off modal; formal OAuth/JWT session gating is scheduled for enterprise phase. |
| **SOC-2 Type II / ISO 27001 Certification**| ❌ **Not Certified** | DHAAL is an advanced working prototype, not yet submitted for third-party compliance audits. |
