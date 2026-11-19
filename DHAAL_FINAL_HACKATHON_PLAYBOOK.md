# DHAAL (ढाल) 2.0 — FINAL HACKATHON PLAYBOOK & DEMO SCRIPT
**Competition Guide**: Winning Strategy, Pitch Scripts & Technical Defense  
**Audience**: Technical Judges, FinTech Investors & Senior Chartered Accountants  
**Live URL**: [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)  

---

## 1. The 5-Minute Competition Pitch & Live Demonstration

### 1.1 The 30-Second Problem Statement
> *"Every month, Indian small businesses receive Form GST ASMT-10 scrutiny notices alleging lakhs of rupees in Input Tax Credit mismatches because supplier filings haven't reflected in GSTR-2B. Taxpayers panic because they face aggressive 30-day deadlines. But 80% of these notices are procedural timing differences, not tax evasion. Today, accountants waste days manually sifting through hundreds of invoices and bank statements, often citing outdated circulars or missing critical statutory deadlines. Small businesses urgently need an automated, legally rigorous defense shield."*

### 1.2 The 60-Second Product Explanation
> *"Meet DHAAL (ढाल) — the GST Scrutiny Intelligence Platform. DHAAL transforms an intimidating Form ASMT-10 notice into an evidence-backed, Chartered Accountant-ready defense in under 60 seconds. DHAAL is not a generic LLM chatbot wrapper. It is powered by a deterministic Section 170 mathematical reconciliation engine, an Evidence Graph DAG that tracks primary source provenance, and a period-aware GST legal rules engine that knows the difference between historical Circular 183 relief and modern Section 16(2)(aa) requirements. It bridges the gap between raw financial books, GST portal data, and formal statutory defense drafting."*

### 1.3 The 3-Minute Live Workflow Demonstration

```
Step 1: Notice Ingestion & Instant Analysis (30 sec)
   ├── Open https://dhaal-gst-sheild.vercel.app
   ├── Click "Load Demo Scrutiny Notice" (Form ASMT-10, Ref: ZA270525008912M)
   ├── Show instant extraction: Discrepancy Amount ₹1,84,250 | Tax Period Q1 2024-25 | 30-Day Due Date 13-Jun-2025.
   └── Point out: Notice is parsed deterministically without hallucination; user can manually override any field.

Step 2: Deterministic Reconciliation Workspace (45 sec)
   ├── Navigate to Step 2: "Reconcile Invoices"
   ├── Click "Run Reconciliation" against the 24 purchase invoices
   ├── Show the mathematical breakdown:
   │    ├── Total Taxable Value: ₹10,23,611
   │    ├── Questioned Difference: ₹1,84,250 (Exact 18% tax match, ₹0 unexplained variance)
   │    ├── Unreported in 2B: 16 invoices (Timing mismatch by vendor)
   │    └── Belated Filing: 8 invoices (Filed in subsequent period)
   └── Highlight: Enforces Section 170 statutory rounding (ROUND_HALF_UP).

Step 3: Source-Grounded Evidence Graph & ECI Metric (45 sec)
   ├── Switch to Step 3: "Evidence Graph"
   ├── Demonstrate the DAG visualization connecting Allegation → Invoices → Bank → E-Way Bills → Statutory Rules.
   ├── Click node `node_guidance_circular_183`: Show why it is marked "NOT APPLICABLE" for FY 2024-25 (governed by Section 16(2)(aa)).
   ├── Click node `node_bank_DH-2025-ASMT10-8912`: Highlight transparent `SYNTHETIC` badge for demo UTR `SAMPLEUTR0001`.
   ├── Click node `node_eway_DH-2025-ASMT10-8912`: Highlight `PARTIAL (75%)` badge (18/24 attached, 6 missing delivery proof).
   └── Point to the Evidence Completeness Indicator (ECI = 70/100) with explicit breakdown and legal disclaimer.

Step 4: Vernacular Explanations & Statutory Deadlines (30 sec)
   ├── Navigate to Step 4: "Statutory Guidance"
   ├── Toggle language tabs: Show localized explanations in English, Hindi (हिंदी), and Marathi (मराठी).
   └── Show statutory deadline distinction: Section 61(1) scrutiny vs Rule 99(1) 30-day response vs Section 74A adjudication for FY 2024-25.

Step 5 & 6: Deterministic Draft Verification & CA-Ready Export (30 sec)
   ├── Navigate to Step 5: "Draft Verifier"
   ├── Click "Run Deterministic Verification": 5 automated checks pass (Amount, Dates, GSTIN, Sections, Period).
   ├── Proceed to Step 6: "CA-Ready Brief"
   └── Click "Download Comprehensive Defense Dossier (PDF)": Show multi-page A4 PDF complete with Annexures A, B, C, and D, ready for professional CA sign-off.
```

### 1.4 The 30-Second Differentiation & Conclusion
> *"While others offer generic conversational bots that hallucinate legal citations and botch financial numbers, DHAAL is built with mathematical rigor, transparent evidence provenance, and period-aware statutory intelligence. It guarantees that every single rupee is accounted for, every legal claim is grounded in law, and every synthetic record is honestly disclosed. DHAAL is the production-ready shield Indian businesses and CAs can trust."*

---

## 2. Hard Judge Technical Q&A Defense Script

### Q1: "Why is this not just another ChatGPT / LLM wrapper?"
> **Answer**: *"DHAAL does not use an LLM for any core financial arithmetic, reconciliation matching, or statutory deadline calculations. All financial math is executed in pure Python using `Decimal` and Section 170 statutory rounding (`ROUND_HALF_UP`). All reconciliation decisions use deterministic two-tier compound hash and Levenshtein algorithms. The Evidence Graph is validated by a Pydantic DAG model that rejects duplicate nodes and orphan edges. DHAAL functions completely and reliably even if all external AI services are offline."*

### Q2: "How do you guarantee that GST calculations are 100% accurate?"
> **Answer**: *"We forbid floating-point arithmetic. All monetary values are handled using fixed-point `Decimal` objects. Furthermore, we enforce Section 170 of the CGST Act, which mandates that 50 paise or more rounds UP to the nearest rupee, unlike standard banker's rounding. The canonical 24-invoice dataset totals exactly ₹10,23,611 in taxable value, resulting in exactly ₹1,84,250 in 18% GST discrepancy, matching the notice to the exact rupee with zero unexplained variance."*

### Q3: "How do you prevent hallucinated or fake evidence?"
> **Answer**: *"We enforce strict 8-state immutable evidence provenance (`SYNTHETIC`, `UPLOADED`, `PARSED`, `UNVERIFIED`, `VERIFIED`, `MISSING`, `REJECTED`, `CA_REVIEWED`). Demonstration fixtures such as `SAMPLEUTR0001` are visibly labeled `SYNTHETIC` and contribute 0 points to verified evidence. Furthermore, in-memory graph states are protected by canonical deterministic SHA-256 hashes, ensuring that missing primary evidence can never be converted into verified evidence without corroborating documents."*

### Q4: "How is GST legal applicability determined across different financial years?"
> **Answer**: *"DHAAL implements a period-aware statutory rules layer. For example, CBIC Circular 183/15/2022-GST strictly applies only to FY 2017-18 and FY 2018-19. For FY 2024-25 notices, DHAAL marks Circular 183 as 'NOT APPLICABLE' because Section 16(2)(aa) was inserted w.e.f. 01.01.2022, making Form GSTR-2B reflection mandatory. Similarly, for tax periods from FY 2024-25 onwards, DHAAL cites Section 74A instead of Section 73/74, reflecting the Finance (No. 2) Act, 2024 amendments."*

### Q5: "What happens if an external AI provider experiences an outage or rate limit?"
> **Answer**: *"DHAAL is architected with complete offline statutory fallback. If an external model is unavailable, DHAAL immediately serves deterministic statutory defense templates and rule-based findings directly from its local backend. The user experience is never blocked by external API outages."*

### Q6: "How do you protect sensitive taxpayer financial data?"
> **Answer**: *"DHAAL runs on ephemeral serverless infrastructure with zero permanent disk retention of client invoices or notice files. Uploaded files are validated for magic bytes (`%PDF`), size-capped at 4 MB, processed purely in memory (`io.BytesIO`), and reclaimed by the garbage collector immediately upon response delivery. No customer data is stored in public databases or persisted on disk."*

### Q7: "What is automated vs what requires professional Chartered Accountant review?"
> **Answer**: *"DHAAL automates the tedious, error-prone data processing: notice parsing, invoice-to-2B matching, ECI score calculation, DAG building, deadline tracking, and draft formulation. However, DHAAL explicitly does NOT file returns or replace professional legal judgment. Step 6 is an explicit CA review gate requiring a licensed CA or advocate to review Annexures, verify supplier bona fides, generate a UDIN if applicable, and sign off on the formal Form ASMT-11 response."*

### Q8: "What are the current product limitations?"
> **Answer**: *"We maintain complete transparency regarding our technical boundaries:
> 1. Scanned raster PDFs without an OCR text stream are rejected with HTTP 422 to prevent hallucination.
> 2. The Evidence Completeness Indicator (ECI) measures documentation presence, not legal dispute outcomes.
> 3. Cryptographic SHA-256 hashes detect in-memory graph mutations but do not constitute legal certificates under Section 65B of the Indian Evidence Act.
> 4. We support the Form ASMT-10 to ASMT-11 scrutiny workflow; it does not replace GST portal filing."*
