"""
Dhaal (ढाल) 2.0 - CBIC Circular No. 183/15/2022-GST Statutory Applicability Engine

Official Statutory Ground:
CBIC Circular No. 183/15/2022-GST (dated 27th December 2022)
Clarification to deal with difference in Input Tax Credit (ITC) availed in FORM GSTR-3B
as compared to that detailed in FORM GSTR-2A for FY 2017-18 and 2018-19.
Extended to FY 2019-20 and FY 2020-21 (up to 31.12.2021) via Circular No. 193/05/2023-GST.

STATUTORY LIMITATION NOTICE:
Circular 183/15/2022-GST DOES NOT apply to GSTR-2B mismatches, nor does it apply
to FY 2022-23, FY 2023-24, or FY 2024-25. After 01.01.2022, Section 16(2)(aa)
mandates that ITC is available only if the invoice is communicated in GSTR-2B.
"""
from typing import Optional, Dict, Any, List
from decimal import Decimal
from pydantic import BaseModel, Field


class Circular183AssessmentInput(BaseModel):
    financial_year: Optional[str] = None  # e.g. "2017-18", "2018-19", "2024-25"
    mismatch_type: Optional[str] = None  # "GSTR_3B_VS_GSTR_2A" or "GSTR_3B_VS_GSTR_2B"
    supplier_gstin: Optional[str] = None
    tax_difference_amount: Decimal = Decimal("0.0")
    scenario_code: Optional[str] = None  # "3.1.a", "3.1.b", "3.1.c", "3.1.d"
    has_tax_invoice: bool = False
    has_goods_receipt: bool = False
    supplier_filed_gstr3b: Optional[bool] = None
    supplier_certificate_obtained: bool = False
    ca_cma_certificate_obtained: bool = False
    udin_verified: bool = False
    section_16_4_compliant: Optional[bool] = None
    proceedings_status: str = "PENDING"  # "PENDING", "COMPLETED"


class Circular183AssessmentResult(BaseModel):
    verdict: str  # One of: "APPLICABLE — CONDITIONS STILL REQUIRE VERIFICATION", "NOT APPLICABLE", "LEGAL APPLICABILITY UNVERIFIED", "PROFESSIONAL REVIEW REQUIRED"
    financial_year: Optional[str]
    circular_reference: str
    reasons: List[str]
    threshold_category: str  # "ABOVE_5_LAKH", "UP_TO_5_LAKH", "NOT_APPLICABLE"
    required_certificate_type: str
    statutory_caveats: List[str]
    is_applicable: bool


def assess_circular_183_applicability(inp: Circular183AssessmentInput) -> Circular183AssessmentResult:
    """
    Evaluates whether CBIC Circular No. 183/15/2022-GST or Circular No. 193/05/2023-GST
    statutably applies to an ITC mismatch allegation.
    """
    reasons: List[str] = []
    caveats: List[str] = [
        "A supplier or CA certificate is an administrative compilation, NOT conclusive proof of government tax-deposit.",
        "Under Section 16(2)(c), the proper officer retains discretion to verify whether tax was actually deposited into the government treasury.",
        "Proceedings that have already been finalized and attained finality are not reopened under Circular 183 (para 6)."
    ]

    # 1. Financial Year Validation
    if not inp.financial_year or inp.financial_year.strip().upper() in ["UNKNOWN", "", "UNVERIFIED"]:
        return Circular183AssessmentResult(
            verdict="LEGAL APPLICABILITY UNVERIFIED",
            financial_year=inp.financial_year,
            circular_reference="CBIC Circular No. 183/15/2022-GST",
            reasons=["Financial Year not established. Circular 183 applicability strictly depends on the relevant tax period."],
            threshold_category="NOT_APPLICABLE",
            required_certificate_type="UNKNOWN (Requires Financial Year verification)",
            statutory_caveats=caveats,
            is_applicable=False
        )

    fy_clean = inp.financial_year.strip()
    is_cir_183_fy = fy_clean in ["2017-18", "2018-19", "17-18", "18-19", "FY 2017-18", "FY 2018-19"]
    is_cir_193_fy = fy_clean in ["2019-20", "2020-21", "19-20", "20-21", "FY 2019-20", "FY 2020-21"]

    if not is_cir_183_fy and not is_cir_193_fy:
        return Circular183AssessmentResult(
            verdict="NOT APPLICABLE",
            financial_year=fy_clean,
            circular_reference="None (Section 16(2)(aa) / Section 38 Applies)",
            reasons=[
                f"Financial Year {fy_clean} is outside the statutory scope of Circular 183/15/2022-GST (FY 2017-18 & 2018-19) and Circular 193/05/2023-GST (FY 2019-20 & 2020-21).",
                "For periods w.e.f. 01.01.2022, Section 16(2)(aa) strictly requires invoices to be reflected in Form GSTR-2B."
            ],
            threshold_category="NOT_APPLICABLE",
            required_certificate_type="NOT APPLICABLE (Governed by Section 16(2)(aa) / GSTR-2B)",
            statutory_caveats=caveats,
            is_applicable=False
        )

    # 2. Mismatch Type Validation (GSTR-2A vs GSTR-2B)
    if inp.mismatch_type and "2B" in inp.mismatch_type.upper():
        return Circular183AssessmentResult(
            verdict="NOT APPLICABLE",
            financial_year=fy_clean,
            circular_reference="CBIC Circular No. 183/15/2022-GST",
            reasons=[
                "Circular 183 exclusively covers GSTR-3B vs GSTR-2A differences.",
                "Form GSTR-2B was introduced only in August 2020 and did not exist for FY 2017-18 / 2018-19."
            ],
            threshold_category="NOT_APPLICABLE",
            required_certificate_type="NOT APPLICABLE",
            statutory_caveats=caveats,
            is_applicable=False
        )

    # 3. Proceedings Finality Check
    if inp.proceedings_status.upper() == "COMPLETED":
        return Circular183AssessmentResult(
            verdict="NOT APPLICABLE",
            financial_year=fy_clean,
            circular_reference="CBIC Circular No. 183/15/2022-GST para 6",
            reasons=["Circular 183 applies only to ongoing scrutiny/audit proceedings, not to finalized assessments."],
            threshold_category="NOT_APPLICABLE",
            required_certificate_type="NOT APPLICABLE",
            statutory_caveats=caveats,
            is_applicable=False
        )

    # 4. Threshold Assessment (Para 4.1.1 vs Para 4.1.2)
    diff_amount = Decimal(str(inp.tax_difference_amount))
    THRESHOLD = Decimal("500000.00")  # ₹5,00,000 per supplier in that FY

    if diff_amount > THRESHOLD:
        threshold_cat = "ABOVE_5_LAKH"
        required_cert = "Chartered Accountant (CA) or Cost Accountant (CMA) Certificate with valid UDIN (Para 4.1.1)"
        if not inp.ca_cma_certificate_obtained or not inp.udin_verified:
            reasons.append("Difference exceeds ₹5,00,000: Mandatory CA/CMA certificate with valid UDIN is pending.")
    else:
        threshold_cat = "UP_TO_5_LAKH"
        required_cert = "Certificate / Declaration issued by the concerned supplier (Para 4.1.2)"
        if not inp.supplier_certificate_obtained:
            reasons.append("Difference up to ₹5,00,000: Supplier certificate of tax payment is pending.")

    # 5. Section 16 Core Requirements
    if not inp.has_tax_invoice:
        reasons.append("Section 16(2)(a) requirement pending: Tax invoice possession not verified.")
    if not inp.has_goods_receipt:
        reasons.append("Section 16(2)(b) requirement pending: Proof of delivery / receipt of goods not verified.")

    if inp.section_16_4_compliant is False:
        return Circular183AssessmentResult(
            verdict="NOT APPLICABLE",
            financial_year=fy_clean,
            circular_reference="CBIC Circular No. 183/15/2022-GST",
            reasons=["ITC claimed beyond the time limitation prescribed under Section 16(4). Circular 183 cannot override statutory limitation."],
            threshold_category=threshold_cat,
            required_certificate_type=required_cert,
            statutory_caveats=caveats,
            is_applicable=False
        )

    # Determine Verdict
    cir_ref = "CBIC Circular No. 183/15/2022-GST" if is_cir_183_fy else "CBIC Circular No. 193/05/2023-GST"
    if reasons:
        verdict = "APPLICABLE — CONDITIONS STILL REQUIRE VERIFICATION"
    else:
        verdict = "APPLICABLE — CONDITIONS STILL REQUIRE VERIFICATION"  # Always requires proper officer verification

    return Circular183AssessmentResult(
        verdict=verdict,
        financial_year=fy_clean,
        circular_reference=cir_ref,
        reasons=reasons if reasons else ["Financial year and mismatch parameters fall within circular scope. Evidence verification required."],
        threshold_category=threshold_cat,
        required_certificate_type=required_cert,
        statutory_caveats=caveats,
        is_applicable=True
    )
