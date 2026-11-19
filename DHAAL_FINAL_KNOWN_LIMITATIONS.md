# DHAAL (ढाल) — FINAL KNOWN LIMITATIONS & SYSTEM BOUNDARIES
**Release**: DHAAL 2.0 Production  
**Scope**: Statutory Scope, Technical Boundaries & Production Caveats  

---

## 1. Statutory & Legal Scope Boundaries

1. **Scrutiny Scope (Form ASMT-10 Only)**:
   - DHAAL is specifically engineered for scrutiny notices issued under Section 61 of the CGST Act (Form GST ASMT-10) and drafting responses under Rule 99(2) (Form GST ASMT-11).
   - It is not designed to draft responses for summary assessment under Section 62/63/64, search and seizure under Section 67, or formal demand notices under Section 73/74 (Form DRC-01), although the underlying evidence graph can serve as an exhibit.

2. **Section 16(2)(c) Supplier Proof**:
   - Under Section 16(2)(c), the burden of proving that the supplier actually deposited the tax into the government treasury rests legally on the recipient.
   - DHAAL can highlight whether this condition has been satisfied and generate a supplier request letter under CBIC Circular 183/15/2022-GST or Circular 193/05/2023-GST. However, it cannot unilaterally prove supplier tax payment without external supplier confirmation or CA certification.

3. **Human Professional in the Loop**:
   - DHAAL is a specialized drafting and intelligence tool designed for Chartered Accountants and tax professionals.
   - It does not file documents directly to the GST Common Portal (`services.gst.gov.in`) without human sign-off. All exported ASMT-11 responses require review, physical/digital signing, and submission by the authorized representative.

---

## 2. Technical & Architectural Boundaries

1. **GST Portal API Integration (ASP/GSP)**:
   - Direct real-time live retrieval of GSTR-2B from GSTN requires registered GSP (GST Suvidha Provider) credentials with hardware security module (HSM) tokens.
   - For demo and unauthenticated users, DHAAL utilizes structured Excel/JSON uploads and an onboard canonical 24-invoice test fixture.

2. **OCR Parsing vs Digital Native PDFs**:
   - DHAAL features high-accuracy text extraction for digitally generated ASMT-10 notices (e.g. system-generated notices from the GST portal).
   - Poorly scanned, handwritten, or degraded physical notice photocopies with heavy skew or low DPI require human verification and manual parameter confirmation in Screen 2.

3. **Ephemeral In-Memory Architecture**:
   - In accordance with enterprise data protection principles, DHAAL does not store uploaded notice PDFs or purchase registers on permanent disk or centralized relational databases.
   - Refreshing the browser or clearing session state resets the in-memory analysis unless the case is exported or saved.
