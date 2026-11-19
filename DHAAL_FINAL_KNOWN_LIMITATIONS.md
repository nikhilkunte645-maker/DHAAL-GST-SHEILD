# DHAAL (ढाल) — FINAL KNOWN LIMITATIONS & SYSTEM BOUNDARIES
**Release**: DHAAL 2.0 Production (Post-Release Integrity Hotfix)  
**Scope**: Statutory Scope, Technical Boundaries & Production Integrity Caveats  

---

## 1. Statutory & Legal Scope Boundaries

1. **Scrutiny Scope (Form ASMT-10 Only)**:
   - DHAAL is specifically engineered for scrutiny notices issued under Section 61 of the CGST Act (Form GST ASMT-10) and drafting responses under Rule 99(2) (Form GST ASMT-11).
   - It is not designed to draft responses for summary assessment under Section 62/63/64, search and seizure under Section 67, or formal demand notices under Section 73/74 (Form DRC-01) or Section 74A.

2. **CBIC Circular No. 183/15/2022-GST Temporal & Scope Limitations**:
   - Circular 183/15/2022-GST strictly applies to **FY 2017-18 and FY 2018-19** for differences between Form GSTR-3B and Form GSTR-2A. It was extended to FY 2019-20 and FY 2020-21 (up to 31.12.2021) via Circular 193/05/2023-GST.
   - Circular 183 **DOES NOT APPLY** to FY 2021-22, FY 2022-23, FY 2023-24, or FY 2024-25. For periods after 01.01.2022, Section 16(2)(aa) strictly requires invoices to be reflected in Form GSTR-2B.
   - For demo cases in FY 2024-25, Circular 183 is marked `NOT APPLICABLE` or `LEGAL APPLICABILITY UNVERIFIED`. DHAAL never labels arbitrary GSTR-2B mismatches as automatically eligible for Circular 183 relief.

3. **Section 16(2)(c) Supplier Proof & Certificate Limitations**:
   - Under Section 16(2)(c), the burden of proving that the supplier actually deposited tax into the government treasury rests legally on the recipient.
   - A supplier certificate or CA certificate with UDIN is an administrative document submitted under circular procedures; it is **NOT** conclusive proof of government tax deposit. The proper officer retains statutory discretion to verify government treasury receipts.

4. **Evidence Completeness Indicator (ECI) Non-Legal Metric**:
   - The Evidence Completeness Indicator (ECI) measures solely whether required document categories and data fields exist in the case dossier.
   - It **DOES NOT** represent probability of winning a dispute, guaranteed GST compliance, legal entitlement to ITC, or prediction of a favorable adjudication.
   - CA sign-off adds professional review status, but cannot convert missing source evidence into verified evidence.

5. **Period-Aware Adjudication (Section 73/74 vs Section 74A)**:
   - For periods up to FY 2023-24, determination of tax is governed by Section 73 (non-fraud) or Section 74 (fraud).
   - For periods from FY 2024-25 onwards, determination is governed by the unified **Section 74A** (inserted by Section 136 of Finance (No. 2) Act, 2024).

---

## 2. Technical & Data Provenance Boundaries

1. **Synthetic Demonstration Data vs Real Evidence**:
   - In demonstration mode, banking vouchers (e.g., UTR `SAMPLEUTR0001`) are explicitly classified as `SYNTHETIC` and unverified.
   - Synthetic records are never labeled as `VERIFIED` and do not contribute to the real verified evidence score.
   - Real-world statutory defense requires uploaded bank statements / MT940 files and official GSTN returns.

2. **Partial Transport Documentation**:
   - In the demonstration case, E-Way bills are attached for 18 out of 24 invoices (75% coverage).
   - DHAAL does not invent missing records or imply 100% physical delivery verification when 6 consignments lack transport bilties.

3. **GST Portal API Integration (ASP/GSP)**:
   - Direct real-time live retrieval of GSTR-2B from GSTN requires registered GSP (GST Suvidha Provider) credentials with hardware security module (HSM) tokens.
   - For demo and unauthenticated users, DHAAL utilizes structured Excel/JSON uploads and an onboard canonical 24-invoice test fixture.

4. **Cryptographic Hashes (SHA-256)**:
   - SHA-256 hashes generated across Evidence Graph nodes are computed from deterministic JSON serialization of node properties for state and tamper verification.
   - A cryptographic hash does not constitute proof of document authenticity or statutory legal admissibility.

5. **Ephemeral In-Memory Architecture**:
   - In accordance with enterprise data protection principles, DHAAL processes uploaded notices in memory streams (`pypdf`).
   - Notice PDFs and purchase registers are not persisted to disk or external databases.
