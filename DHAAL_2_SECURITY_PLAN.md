# DHAAL 2.0 — ENTERPRISE SECURITY, PRIVACY & COMPLIANCE PLAN
**Zero-Trust Document Security, Multi-Tenant Isolation & PII Protection**

**Version:** 2.0.0-PROD-SEC  
**Status:** Canonical Engineering Specification  
**Compliance Target:** Indian Digital Personal Data Protection (DPDP) Act, 2023 & GST Legal Privilege  
**Operational Modes:** Ephemeral In-Memory (Zero-Retention) & Encrypted Multi-Tenant Storage  

---

## 1. Security Architecture & Threat Model

Financial and tax data ingested by DHAAL (Form ASMT-10 notices, invoices, bank statements, proprietary business ledgers) contains sensitive taxpayer assets:
- **Commercial Financials:** Exact turnover, profit margins, supplier terms, and trade volumes.
- **Personally Identifiable Information (PII):** Proprietor PAN, residential addresses, mobile numbers, and bank account numbers.
- **Legal Vulnerabilities:** Allegations of tax evasion or short payment that could damage brand reputation if leaked.

DHAAL 2.0 implements a **Defense-in-Depth Zero-Trust Model**:

```
[Inbound Traffic (TLS 1.3)]
           │
           ▼
[API Gateway: Rate Limiting & CORS Lockdown]
           │
           ▼
[Magic-Byte Inspection & PDF Sanitizer] ──► (Rejects executable / JS-embedded PDFs)
           │
           ▼
[JWT & RBAC Authorization Boundary] ──────► (Role: CA_APPROVER vs TAXPAYER_VIEWER)
           │
           ▼
[Tenant-Isolated Processing Zone]
   ┌───────────────────────────────┐
   │  Mode 1: Ephemeral RAM Stream │  (No disk writes, RAM wiped post-response)
   │  Mode 2: Encrypted Storage    │  (AES-256-GCM, Tenant Key-Split)
   └───────────────────────────────┘
           │
           ▼
[Audit Trail: Hash-Chained Tamper-Evident Ledger]
           │
           ▼
[PII Redaction Engine before Log Aggregation]
```

---

## 2. Authentication, Authorization & Tenant Isolation

### 2.1 Authentication & Session Management
- **Token Format:** Signed JWTs using asymmetric **RS256** or **Ed25519** key pairs.
- **Lifespan:** Short-lived access tokens (15 minutes) paired with rotating refresh tokens (7 days) stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
- **Multi-Factor Authentication (MFA):** Mandatory TOTP (Time-based One-Time Password) for accounts possessing the `CA_APPROVER` role to protect legal sign-offs.

### 2.2 Role-Based Access Control (RBAC) Matrix

| Resource / Action | Taxpayer (Client) | Staff Accountant | Chartered Accountant (CA) | Workspace Admin |
|:---|:---:|:---:|:---:|:---:|
| **Upload Notice & Raw Scans** | ✅ Create | ✅ Create | ✅ Create | ✅ Create |
| **Review & Confirm Extraction** | ❌ Read Only | ✅ Update | ✅ Update | ✅ Update |
| **Trigger Reconciliation Engine**| ❌ Read Only | ✅ Execute | ✅ Execute | ✅ Execute |
| **Attach & Modify Evidence** | ❌ Read Only | ✅ Create/Update | ✅ Create/Update | ✅ Full Control |
| **Edit Legal Response Draft** | ❌ Read Only | ✅ Edit Draft | ✅ Edit & Sign Off | ✅ Full Control |
| **Sign Off with CA Credentials** | ❌ Denied | ❌ Denied | ✅ **Exclusive** | ❌ Denied |
| **Export Official PDF Brief** | ⚠️ Watermarked | ⚠️ Watermarked | ✅ **Certified PDF** | ✅ Certified PDF |
| **Delete Case & Purge Evidence** | ❌ Denied | ❌ Denied | ❌ Denied | ✅ **Exclusive** |

### 2.3 Strict Multi-Tenant Isolation
- **Row-Level Security (RLS):** All database queries filter strictly on `tenant_id` injected from verified JWT claims.
- **Cross-Tenant Attack Prevention:** If a request URL contains `/case/DH-2025-001` but the caller's JWT belongs to `tenant_beta`, the security middleware aborts with `404 Not Found` (preventing ID enumeration).

---

## 3. Document Ingestion Security & Malware Mitigation

### 3.1 Strict File Validation Pipeline
1. **Magic-Byte Inspection:** The server validates file headers rather than relying on browser-submitted MIME types:
   - PDF: Must begin with `%PDF-` (`0x25 0x50 0x44 0x46`).
   - Images: Must match PNG (`0x89 0x50 0x4E 0x47`) or JPEG (`0xFF 0xD8 0xFF`).
2. **File Size Hard Limits:**
   - Single Notice PDF: **15 MB maximum**.
   - Bulk Invoices / Bank Zip: **25 MB maximum**.
   - Maximum PDF Page Count: **50 pages** (mitigates denial-of-service via decompression bombs).
3. **PDF Structure Sanitization:**
   - Any uploaded PDF is parsed through a PyMuPDF stream to detect and strip:
     - `/JavaScript` and `/JS` dictionary actions.
     - `/Launch` actions (attempting to trigger external executables).
     - Embedded XML Form Architecture (XFA) streams.
   - Files containing malicious executable tags are immediately purged, and the upload is rejected with `ERR_SUSPICIOUS_PDF_CONTENT`.

### 3.2 Malware Scanning Architecture
- **In Cloud/Serverless Deployments:** Files pass through an AWS Lambda / Cloud Run asynchronous ClamAV daemon hook or Google Cloud Web Risk / VirusTotal API sandbox before persistent storage.
- **In Ephemeral Mode:** Files exist exclusively in memory buffers, parsed with memory limits, and never touch the filesystem.

---

## 4. Secure Storage & Retention Lifecycle

DHAAL 2.0 provides two distinct operating modes to respect client privacy:

### 4.1 Mode A: Ephemeral In-Memory Mode (Default for Demos & Privacy First)
- Notice PDFs, purchase registers, and bank statements are read into RAM (`io.BytesIO` streams in Python).
- Data structures exist only for the duration of the analysis request or active session.
- Once the user closes the browser or clicks "Purge Session", all server memory objects are unreferenced and garbage-collected.
- **Zero bytes written to persistent disks or external databases.**

### 4.2 Mode B: Encrypted Multi-Tenant Persistent Storage
- **Encryption at Rest:** All stored documents, tables, and audit logs are encrypted using **AES-256-GCM** with tenant-specific encryption keys.
- **Envelope Encryption:** Master Key stored in AWS KMS / GCP Cloud KMS; individual Data Encryption Keys (DEKs) rotated per tenant.
- **Retention Policies:**
  - Automated purge schedules configurable by workspace admin:
    - *Immediate (0 days)*: Purge source files immediately after brief export.
    - *30 Days*: Retain during statutory reply window, then erase.
    - *Statutory GST (8 Years)*: Retain audit trail and certified brief per Section 36 of CGST Act.
- **Cryptographic Shredding:** Case deletion deletes the tenant's DEK, rendering all stored ciphertext permanently irrecoverable.

---

## 5. Logging, Redaction & PII Masking

To prevent operational logs from turning into security liabilities, DHAAL enforces strict masking policies across all log aggregators (e.g. Datadog, CloudWatch, Vercel Logs).

```python
import re

def redact_sensitive_pii(log_message: str) -> str:
    """Masks GSTINs, PANs, Bank Accounts, and Rupee amounts from production logs."""
    # Mask GSTIN (keep state code and last character): 27AAAAA0000A1Z5 -> 27XXXXX0000X1ZX
    log_message = re.sub(
        r"\b([0-9]{2})[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z([0-9A-Z]{1})\b",
        r"\1XXXXX****\2",
        log_message
    )
    # Mask Indian PAN: ABCDE1234F -> AB***34F
    log_message = re.sub(r"\b([A-Z]{2})[A-Z]{3}[0-9]{2}([0-9]{2}[A-Z]{1})\b", r"\1***\2", log_message)
    # Mask exact Rupee amounts: ₹ 1,84,250 -> ₹ [REDACTED_AMOUNT]
    log_message = re.sub(r"₹\s*([0-9,]+)", r"₹[CONFIDENTIAL]", log_message)
    return log_message
```

### Sanitized Error Responses
Production API error handlers never return raw Python tracebacks, database queries, or server filesystem paths. Clients receive standardized RFC 7807 problem payloads with generic error messages and correlation IDs.

---

## 6. API Rate Limiting & Denial-of-Service Defense

DHAAL 2.0 enforces token-bucket rate limiting via Redis / memory cache:

| Route Classification | Limit per IP / User | Purpose |
|:---|:---:|:---|
| **Standard Reads (`GET /rows`, `/graph`)** | 120 req / min | High-throughput UI interaction |
| **Document Upload (`POST /notice/extract`)** | 10 req / min | Prevents OCR server resource exhaustion |
| **AI Inference (`POST /copilot/generate-draft`)** | 5 req / min | Protects external LLM quotas & budget |
| **Authentication (`POST /auth/login`)** | 5 req / min | Brute-force credential stuffing defense |

---

## 7. Secrets Management & Code Integrity

- **Zero Secrets in Repository:** Strict git-commit hooks scan for accidental API key exposure (`git-secrets` / `trufflehog`).
- **Runtime Injection:** All keys (`GEMINI_API_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`) are injected strictly at runtime via environment variables managed by Vercel Secrets or Doppler.
- **Dependency Scanning:** Automated GitHub Dependabot and `npm audit` / `pip-audit` checks run in CI to eliminate vulnerable upstream packages.

---

## 8. Truth-in-Claims: Current Status vs Future Roadmap

To ensure technical credibility during hackathon evaluation, DHAAL explicitly distinguishes between **implemented safeguards** and **enterprise roadmap items**:

| Security Capability | Current DHAAL Implementation | Production Enterprise Target |
|:---|:---:|:---:|
| **Section 170 CGST Rounding** | ✅ Fully Implemented in Python/TS | ✅ Maintained |
| **Ephemeral RAM-Only Stream** | ✅ Fully Implemented (`pypdf` streams) | ✅ Maintained |
| **Sensitive PII Log Masking** | ✅ Implemented in `backend/main.py` | ✅ Maintained |
| **Sanitized Error Responses** | ✅ Implemented (zero traceback leakage) | ✅ Maintained |
| **Magic-Byte PDF Inspection** | ⚠️ Partial (MIME & extension check) | 🔄 Fully Implemented (Hex scanner) |
| **Multi-Tenant RLS & KMS** | ⚠️ Logical In-Memory Tenant Context | 🔄 PostgreSQL RLS + AWS KMS |
| **SOC-2 Type II / ISO 27001** | ❌ Not Certified (Hackathon Prototype) | 🔄 Target for Post-Launch Audit |
