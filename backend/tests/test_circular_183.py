"""
Unit Tests for CBIC Circular No. 183/15/2022-GST Statutory Applicability
Tests:
- FY 2017-18 and FY 2018-19 applicability
- FY 2024-25 non-applicability (Section 16(2)(aa) governed)
- ₹5 Lakh CA/CMA UDIN threshold vs supplier declaration threshold
- GSTR-2A vs GSTR-2B mismatch handling
- Missing financial year handling
- Finalized proceedings exclusion
"""
import pytest
from decimal import Decimal
from backend.circular_183 import assess_circular_183_applicability, Circular183AssessmentInput


def test_circular_183_fy_2017_18_under_5_lakh():
    inp = Circular183AssessmentInput(
        financial_year="2017-18",
        mismatch_type="GSTR_3B_VS_GSTR_2A",
        tax_difference_amount=Decimal("150000.00"),
        has_tax_invoice=True,
        has_goods_receipt=True,
        supplier_certificate_obtained=True
    )
    result = assess_circular_183_applicability(inp)
    assert result.is_applicable is True
    assert "APPLICABLE" in result.verdict
    assert result.threshold_category == "UP_TO_5_LAKH"
    assert "supplier" in result.required_certificate_type.lower()


def test_circular_183_fy_2018_19_above_5_lakh_missing_udin():
    inp = Circular183AssessmentInput(
        financial_year="2018-19",
        mismatch_type="GSTR_3B_VS_GSTR_2A",
        tax_difference_amount=Decimal("650000.00"),  # > 5 Lakh
        has_tax_invoice=True,
        has_goods_receipt=True,
        supplier_certificate_obtained=True,
        ca_cma_certificate_obtained=False,
        udin_verified=False
    )
    result = assess_circular_183_applicability(inp)
    assert result.is_applicable is True
    assert result.threshold_category == "ABOVE_5_LAKH"
    assert "UDIN" in result.required_certificate_type
    assert any("UDIN" in r or "CA/CMA" in r for r in result.reasons)


def test_circular_183_fy_2018_19_above_5_lakh_with_udin():
    inp = Circular183AssessmentInput(
        financial_year="2018-19",
        mismatch_type="GSTR_3B_VS_GSTR_2A",
        tax_difference_amount=Decimal("650000.00"),
        has_tax_invoice=True,
        has_goods_receipt=True,
        ca_cma_certificate_obtained=True,
        udin_verified=True
    )
    result = assess_circular_183_applicability(inp)
    assert result.is_applicable is True
    assert result.threshold_category == "ABOVE_5_LAKH"


def test_circular_183_fy_2024_25_not_applicable():
    inp = Circular183AssessmentInput(
        financial_year="2024-25",
        mismatch_type="GSTR_3B_VS_GSTR_2B",
        tax_difference_amount=Decimal("184250.00")
    )
    result = assess_circular_183_applicability(inp)
    assert result.is_applicable is False
    assert result.verdict == "NOT APPLICABLE"
    assert any("Section 16(2)(aa)" in r for r in result.reasons)


def test_circular_183_missing_financial_year():
    inp = Circular183AssessmentInput(
        financial_year=None,
        tax_difference_amount=Decimal("184250.00")
    )
    result = assess_circular_183_applicability(inp)
    assert result.is_applicable is False
    assert result.verdict == "LEGAL APPLICABILITY UNVERIFIED"


def test_circular_183_gstr2b_mismatch_ineligible():
    inp = Circular183AssessmentInput(
        financial_year="2017-18",
        mismatch_type="GSTR_3B_VS_GSTR_2B",  # 2B did not exist in FY 17-18
        tax_difference_amount=Decimal("100000.00")
    )
    result = assess_circular_183_applicability(inp)
    assert result.is_applicable is False
    assert result.verdict == "NOT APPLICABLE"
    assert any("2B" in r for r in result.reasons)


def test_circular_183_completed_proceedings():
    inp = Circular183AssessmentInput(
        financial_year="2017-18",
        mismatch_type="GSTR_3B_VS_GSTR_2A",
        tax_difference_amount=Decimal("100000.00"),
        proceedings_status="COMPLETED"
    )
    result = assess_circular_183_applicability(inp)
    assert result.is_applicable is False
    assert result.verdict == "NOT APPLICABLE"
    assert any("para 6" in r or "final" in r.lower() for r in result.reasons)
