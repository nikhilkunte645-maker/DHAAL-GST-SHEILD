# DHAAL 2.0 — KNOWN LIMITATIONS & RESIDUAL ARCHITECTURAL DEBT
**Truth-in-Claims Transparency & Post-Hackathon Engineering Backlog**

**Status:** Canonical Disclosure  
**Rule:** Never represent prototype features as certified enterprise capabilities.

---

## 1. Functional Limitations

1. **Scanned PDF Optical Character Recognition (OCR):**
   - *Current Implementation:* Uses native PyMuPDF stream parsing for digital vector PDFs. Scanned image-only PDFs with heavy degradation, severe rotation (>45 degrees), or physical handwriting require manual confirmation on the Extraction Pause screen (`Screen 2`).
   - *Roadmap Remedy:* Integrate cloud-native Google Cloud Document AI or AWS Textract specialized for Indian tax forms.

2. **Single Notice Working Session per Client:**
   - *Current Implementation:* Optimized for single-case deep scrutiny workflows (`DH-2025-ASMT10-8912`). Multi-case portfolio bulk uploads are currently queued sequentially.
   - *Roadmap Remedy:* Asynchronous Celery / Redis task queue with parallel background workers.

3. **Regional Language Audio Synthesis:**
   - *Current Implementation:* Multi-lingual support covers full visual UI text and PDF exports in English, Hindi, and Marathi. Voice/audio explanations are not yet synthesized.
   - *Roadmap Remedy:* Integrate Google Cloud Text-to-Speech (Chirp Indic voices) for Marathi and Hindi voice walk-throughs.

---

## 2. Infrastructure & Security Limitations

1. **Ephemeral RAM vs Enterprise Multi-Tenancy:**
   - *Current Implementation:* All uploaded documents exist exclusively in RAM memory streams (`io.BytesIO`). While this provides maximum privacy (zero disk persistence), sessions are lost on page refresh unless exported.
   - *Roadmap Remedy:* PostgreSQL with Row-Level Security (RLS) and AES-256-GCM encrypted document blobs for enterprise firms.

2. **Automated ClamAV Daemon Ingestion:**
   - *Current Implementation:* Inbound documents pass magic-byte header inspection and file size limits ($\le 4\text{MB}$). Binary malware scanning using ClamAV is stubbed for cloud container deployment.
   - *Roadmap Remedy:* Containerized ClamAV sidecar daemon in production Kubernetes/Cloud Run pod.

3. **Compliance Certifications:**
   - *Current Implementation:* DHAAL is a hackathon-winning working prototype; it is **not yet SOC-2 Type II or ISO 27001 certified**.
