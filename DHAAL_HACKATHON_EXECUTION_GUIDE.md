# DHAAL (ढाल) — HACKATHON DEMO & EVALUATION GUIDE
**Product**: DHAAL — GST Scrutiny Intelligence Platform  
**Live Demo URL**: [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)  
**Demo Video / Walkthrough Target**: 3-Minute Live Pitch  

---

## 1. 30-Second Elevator Pitch
> *"Indian businesses and tax practitioners regularly receive automated GST scrutiny notices (Form ASMT-10) alleging input tax credit discrepancies. Chartered Accountants waste 8 to 15 billable hours manually cross-referencing hundreds of purchase invoices against GSTR-2B spreadsheets.
> **DHAAL** is the first GST Scrutiny Intelligence Platform that automates notice ingestion, executes deterministic invoice reconciliation down to the rupee, constructs a Section 16(2) Evidentiary DAG, and drafts a statutory, multi-lingual Form ASMT-11 response in under 90 seconds."*

---

## 2. 3-Minute Live Demo Script for Judges

### Minute 0:00 - 0:45: The Problem & Upload (Screen 1 & 2)
1. Navigate to [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app).
2. Point out the clean FinTech design system (Forest Green palette `#073B3A`, JetBrains Mono for monetary values, Devanagari typography).
3. Click **"Load Canonical Demo Notice"** or drop an ASMT-10 PDF.
4. **Judge Talking Point**: *"Notice how DHAAL instantly parses the notice number, issued date, statutory Section 61 deadline, and the exact ₹1,84,250 discrepancy without sending private tax data to cloud LLMs."*

### Minute 0:45 - 1:30: Deterministic Reconciliation (Screen 3)
1. Click **"Run Invoice Reconciliation"**.
2. Show the Bento metric cards:
   - **Total Invoices**: 24
   - **Taxable Value**: ₹10,23,611
   - **Questioned Discrepancy**: ₹1,84,250
   - **Unexplained Variance**: ₹0 (100% matched)
3. **Judge Talking Point**: *"We don't use probabilistic AI to guess tax numbers. Section 170 of the CGST Act mandates strict rounding rules. Our two-tier matcher pairs normalized invoice hashes and categorizes the exact statutory cause: 16 invoices unreported by supplier, 8 invoices filed belatedly."*

### Minute 1:30 - 2:15: DHAAL Evidence Graph (Screen 4)
1. Toggle from **"Statutory Checklist"** to **"Evidence Graph (DAG)"**.
2. Click on the red node: **"Missing Supplier Confirmation"**.
3. Point out the Evidentiary Strength Score (ESS: 78/100).
4. **Judge Talking Point**: *"Tax officers reject replies that lack evidence of Section 16(2)(c). DHAAL builds a formal directed acyclic graph linking the notice allegation to purchase invoices, bank RTGS UTRs, and statutory legal grounds, and explicitly flags missing supplier certificates under Circular 183."*

### Minute 2:15 - 3:00: Legal Draft Verifier & Multi-Lingual PDF (Screen 5 & 6)
1. Advance to Screen 5: Show the statutory citation audit (Section 16, Section 61, Circular 183/15/2022-GST).
2. Switch language to **Hindi (हिन्दी)** or **Marathi (मराठी)**.
3. Advance to Screen 6 and click **"Export Legal Response (PDF)"**.
4. Open the downloaded PDF: show the crisp A4 formatting, official Form ASMT-11 header, reconciliation schedule, and Section 16(2) verification matrix.
5. **Conclude**: *"DHAAL converts a stressful 15-hour tax scrutiny ordeal into a 90-second, CA-certified statutory shield."*

---

## 3. Defense against Hard Technical Questions

### Q1: *"Is the AI generating fake legal citations or hallucinating tax calculations?"*
> **Answer**: *"No. Our architecture strictly separates arithmetic from language. All mathematical reconciliation and Section 170 rounding is handled by deterministic Python/TypeScript routines with zero LLM involvement. The legal grounds are mapped against the codified CGST Act and official CBIC circulars."*

### Q2: *"How do you handle privacy of confidential client financial records?"*
> **Answer**: *"DHAAL adheres to ephemeral in-memory processing. Documents are parsed directly in RAM via `pypdf` streams. No tax invoices or financial numbers are persisted to disk or external databases. Logs are automatically sanitized of PAN, GSTIN, and account numbers."*

### Q3: *"Can this be deployed on enterprise infrastructure?"*
> **Answer**: *"Yes. DHAAL is built with standard FastAPI and React 18, container-ready with zero native system dependencies, currently deployed on Vercel Serverless with sub-250ms API response times."*
