# DHAAL (ढाल) 2.0 — GST LEGAL RULES REGISTER
**Date**: November 20, 2026  
**Subject**: Statutory Authorities, Rule Mappings & Software Enforcement Matrix  
**Regulatory Jurisdiction**: Central Goods and Services Tax Act, 2017 (CGST Act) & Rules  

---

## 1. Statutory Authorities & Primary Sources

All rules implemented in DHAAL derive directly from official Government of India publications, CBIC statutory notifications, circulars, and the CGST Act, 2017:

1. **The Central Goods and Services Tax Act, 2017 (Act No. 12 of 2017)** — Published in the Gazette of India Extraordinary, Part II, Section 1, dated 12th April, 2017.
2. **The Central Goods and Services Tax Rules, 2017** — Notification No. 3/2017-Central Tax, dated 19th June, 2017 (as amended).
3. **The Finance Act, 2021 (Act No. 13 of 2021)** — Section 109 inserting clause (aa) into Section 16(2) of the CGST Act, notified w.e.f. 01.01.2022 vide Notification No. 39/2021-Central Tax, dated 21.12.2021.
4. **The Finance Act, 2022 (Act No. 6 of 2022)** — Section 100 inserting clause (ba) into Section 16(2) of the CGST Act, notified w.e.f. 01.10.2022 vide Notification No. 18/2022-Central Tax, dated 28.09.2022.
5. **The Finance (No. 2) Act, 2024 (Act No. 15 of 2024)** — Section 136 inserting Section 74A into the CGST Act for determination of tax for FY 2024-25 onwards, notified w.e.f. 01.11.2024.
6. **CBIC Circular No. 183/15/2022-GST (dated 27th December, 2022)** — Clarification to deal with difference in Input Tax Credit (ITC) availed in FORM GSTR-3B as compared to that detailed in FORM GSTR-2A for FY 2017-18 and 2018-19.
7. **CBIC Circular No. 193/05/2023-GST (dated 17th July, 2023)** — Clarification to deal with difference in ITC availed in FORM GSTR-3B as compared to that detailed in FORM GSTR-2A for the period 01.04.2019 to 31.12.2021.

---

## 2. Comprehensive Statutory Rule Matrix

| Rule ID | Statutory Section / Rule | Description & Legal Requirement | Effective Applicable Period | Software Implementation Module | Verification Test |
|:---|:---|:---|:---|:---|:---|
| **RULE-61-01** | **CGST Act Section 61(1)** | Authorizes the proper officer to scrutinize the return and related particulars to verify correctness of the return and inform discrepancies. | 01.07.2017 onwards | `backend/main.py`, `src/lib/deadline.ts` | `test_deadline_calculation_statutory_basis` |
| **RULE-99-01** | **CGST Rules Rule 99(1)** | Proper officer issues notice in Form GST ASMT-10 informing discrepancies and seeking explanation within 30 days (or permitted extension). | 01.07.2017 onwards | `src/lib/deadline.ts`, `backend/main.py` | `test_rule_99_1_response_window` |
| **RULE-99-02** | **CGST Rules Rule 99(2)** | Assessee furnishes explanation in Form GST ASMT-11. If found acceptable, officer drops proceedings in Form GST ASMT-12. | 01.07.2017 onwards | `src/screens/Screen5DraftVerifier.tsx`, `backend/verifier.py` | `test_verify_draft_pass` |
| **RULE-61-03** | **CGST Act Section 61(3)** | If no explanation is furnished or explanation is unacceptable, officer may initiate audit (Sec 65), special audit (Sec 66), inspection (Sec 67), or determine tax (Sec 73/74/74A). | 01.07.2017 onwards | `src/lib/deadline.ts` | `test_subsequent_statutory_actions` |
| **RULE-16-2-A** | **CGST Act Section 16(2)(a)** | Assessee must be in possession of a tax invoice or debit note issued by a registered supplier or other taxpaying documents. | 01.07.2017 onwards | `backend/evidence_graph.py`, `src/lib/section16.ts` | `test_section16_historical_clauses` |
| **RULE-16-2-AA** | **CGST Act Section 16(2)(aa)** | The details of invoice or debit note must have been furnished by the supplier in GSTR-1 and communicated to the recipient in Form GSTR-2B. | **01.01.2022 onwards** (Not applicable to FY 2017-18 to 2020-21) | `backend/circular_183.py`, `src/lib/section16.ts` | `test_section_16_2_aa_effective_date_enforcement` |
| **RULE-16-2-B** | **CGST Act Section 16(2)(b)** | Assessee must have physically received the goods or services or both (supported by E-Way Bill, consignment note, or delivery challan). | 01.07.2017 onwards | `backend/evidence_graph.py`, `src/lib/section16.ts` | `test_eway_bill_partial_coverage` |
| **RULE-16-2-BA** | **CGST Act Section 16(2)(ba)** | Details of ITC communicated to recipient in GSTR-2B must not be restricted under Section 38. | **01.10.2022 onwards** | `src/lib/section16.ts` | `test_section16_historical_clauses` |
| **RULE-16-2-C** | **CGST Act Section 16(2)(c)** | Tax charged in respect of supply has been actually paid to the Government, either in cash or through utilization of admissible ITC. | 01.07.2017 onwards | `backend/evidence_graph.py`, `src/lib/section16.ts` | `test_evidence_graph_basic_topology_and_uniqueness` |
| **RULE-16-2-D** | **CGST Act Section 16(2)(d)** | The registered person claiming ITC must have furnished the return under Section 39 (Form GSTR-3B). | 01.07.2017 onwards | `backend/evidence_graph.py`, `src/lib/section16.ts` | `test_evidence_completeness_indicator_breakdown` |
| **RULE-16-PROV2** | **CGST Act Section 16(2) 2nd Proviso** | Recipient must pay the supplier the value of supply plus tax within a period of 180 days from the invoice date; failing which ITC is added to output tax liability with interest. | 01.07.2017 onwards | `backend/evidence_graph.py`, `src/lib/section16.ts` | `test_bank_synthetic_utr_not_verified` |
| **RULE-16-4** | **CGST Act Section 16(4)** | Entitlement to claim ITC for an invoice expires after 30th November following the end of the FY, or furnishing of the annual return, whichever is earlier. | 01.07.2017 onwards | `src/lib/deadline.ts` | `test_statutory_due_date_unverified` |
| **RULE-CIRC-183** | **CBIC Circular No. 183/15/2022-GST** | Administrative mechanism for dealing with GSTR-2A vs GSTR-3B differences for **FY 2017-18 and FY 2018-19**. Difference > ₹5 Lakh requires CA/CMA certificate with **UDIN**; $\le$ ₹5 Lakh requires supplier certificate. | **Strictly FY 2017-18 & 2018-19** | `backend/circular_183.py`, `backend/main.py` | `test_circular_183_fy_17_18_above_5_lakh_requires_ca_udin`, `test_circular_183_not_applicable_to_fy_24_25` |
| **RULE-CIRC-193** | **CBIC Circular No. 193/05/2023-GST** | Extended Circular 183 principles to differences between GSTR-3B and GSTR-2A for the period 01.04.2019 to 31.12.2021, subject to Rule 36(4) cumulative caps. | **01.04.2019 to 31.12.2021** | `backend/circular_183.py` | `test_circular_183_applicability` |
| **RULE-73-74** | **CGST Act Section 73 & Section 74** | Determination of tax not paid, short paid, or ITC wrongly availed for normal and fraud/suppression cases respectively. | Up to **FY 2023-24** | `src/lib/deadline.ts` | `test_section_73_74_applicability_prior_to_fy24_25` |
| **RULE-74A** | **CGST Act Section 74A** | Unified statutory determination of tax not paid, short paid, or ITC wrongly availed (inserted by Finance (No. 2) Act, 2024). | **FY 2024-25 onwards** | `src/lib/deadline.ts` | `test_section_74a_applicability_fy24_25_onwards` |
| **RULE-170** | **CGST Act Section 170** | Statutory Rounding: The amount of tax, interest, penalty, refund or any other amount shall be rounded off to the nearest rupee (50 paise or more rounds UP). | 01.07.2017 onwards | `backend/reconciler.py`, `backend/verifier.py`, `src/lib/financialPrecision.ts` | `test_section_170_rounding_policy`, `financialPrecision.test.ts` |

---

## 3. Statutory Safeguards & Boundary Rules

### 3.1 Non-Applicability of Circular 183 to FY 2024-25
- Under Section 16(2)(aa) of the CGST Act (effective 01.01.2022), no registered person can avail ITC unless the invoice has been communicated in Form GSTR-2B.
- CBIC Circular 183/15/2022-GST was issued specifically to address the transitional absence of Form GSTR-2B in FY 2017-18 and FY 2018-19.
- **DHAAL Enforcement**: Any notice for FY 2024-25 involving GSTR-2B mismatches is marked `NOT APPLICABLE` for Circular 183. The software directs the user to vendor GSTR-1 amendment, credit note reconciliation, or Section 16(2)(c) proof.

### 3.2 Certificate vs Conclusive Proof
- Even where Circular 183 applies, paragraph 4.1.1 explicitly states that a supplier certificate or CA/CMA certificate does not constitute conclusive proof of payment of tax into the government treasury.
- Under Section 16(2)(c), the proper officer retains discretionary authority to independently verify supplier tax deposits.
- **DHAAL Enforcement**: All certificate checks are presented with an explicit statutory caveat: *"A supplier or CA certificate is an administrative compilation, NOT conclusive proof of government tax-deposit."*

### 3.3 Non-Reopening of Finalized Proceedings
- Paragraph 6 of Circular 183 specifies that these instructions apply only to pending proceedings and shall not reopen completed assessments that have attained finality.
- **DHAAL Enforcement**: The Circular 183 evaluation engine includes an explicit `completed_proceedings` check that returns `NOT APPLICABLE` if proceedings have attained finality.

### 3.4 Statutory Rounding Invariant (Section 170)
- The CGST Act forbids standard financial banker's rounding (round to even).
- Under Section 170, 50 paise or more must round strictly **UP** to the nearest whole rupee.
- **DHAAL Enforcement**: All tax calculations enforce Python `ROUND_HALF_UP` on `Decimal` objects and TypeScript `Math.floor(x + 0.5)`. No floating-point inaccuracies or reverse-calculated tax estimates are permitted.
