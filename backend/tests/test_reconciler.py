"""
Unit Tests for DHAAL 2.0 Deterministic GST Reconciliation Engine
Verifies precision, recall, Section 170 rounding, fuzzy matching, and duplicate detection.
"""
from decimal import Decimal
import pytest
from backend.reconciler import (
    run_deterministic_reconciliation,
    clean_invoice_number,
    round_statutory_inr
)

def test_clean_invoice_number():
    assert clean_invoice_number("INV-00124/A") == "INV124A"
    assert clean_invoice_number("  000991 ") == "991"
    assert clean_invoice_number("AT/24-25/1101") == "AT24251101"
    assert clean_invoice_number("") == ""

def test_section_170_rounding_policy():
    # 50 paise or more rounds UP
    assert round_statutory_inr(Decimal("100.50")) == Decimal("101")
    assert round_statutory_inr(Decimal("100.49")) == Decimal("100")
    assert round_statutory_inr(Decimal("100.00")) == Decimal("100")
    assert round_statutory_inr(Decimal("100.99")) == Decimal("101")
    # Negative values (credit notes) rounded symmetrically per Section 170
    assert round_statutory_inr(Decimal("-1800.50")) == Decimal("-1801")
    assert round_statutory_inr(Decimal("-1800.49")) == Decimal("-1800")
    assert round_statutory_inr(Decimal("0.00")) == Decimal("0")

def test_exact_and_fuzzy_reconciliation():
    purchase_register = [
        # 1. Exact match candidate
        {
            "invoice_no": "INV-1001",
            "invoice_date": "2024-04-10",
            "supplier_gstin": "27AAACA1234A1Z5",
            "taxable_value": 50000,
            "claimed_itc": 9000,
        },
        # 2. Fuzzy match candidate (slight typo in invoice number & date offset)
        {
            "invoice_no": "INV/2024/002",
            "invoice_date": "2024-05-15",
            "supplier_gstin": "27BBBCB5678B1Z6",
            "taxable_value": 30000,
            "claimed_itc": 5400,
        },
        # 3. Duplicate entry in purchase register
        {
            "invoice_no": "INV-1001",
            "invoice_date": "2024-04-10",
            "supplier_gstin": "27AAACA1234A1Z5",
            "taxable_value": 50000,
            "claimed_itc": 9000,
        },
        # 4. Unreported in GSTR-2B
        {
            "invoice_no": "INV-9999",
            "invoice_date": "2024-04-20",
            "supplier_gstin": "27CCCC1234C1Z7",
            "taxable_value": 100000,
            "claimed_itc": 18000,
        }
    ]

    gstr_2b_records = [
        # Matches #1 exactly
        {
            "invoice_no": "INV1001",
            "invoice_date": "2024-04-10",
            "supplier_gstin": "27AAACA1234A1Z5",
            "taxable_value": 50000,
            "available_itc": 9000,
        },
        # Matches #2 fuzzily (INV2024002 vs INV202402)
        {
            "invoice_no": "INV202402",
            "invoice_date": "2024-05-18",
            "supplier_gstin": "27BBBCB5678B1Z6",
            "taxable_value": 30000,
            "available_itc": 5400,
        }
    ]

    report = run_deterministic_reconciliation(
        purchase_register=purchase_register,
        gstr_2b_records=gstr_2b_records,
        target_notice_amount=18000
    )

    assert report.total_purchase_invoices == 4
    assert report.exact_matches_count == 1
    assert report.fuzzy_matches_count == 1
    assert report.duplicates_count == 1
    assert report.unreported_2b_count == 1
    assert report.total_questioned_difference == 18000
    assert report.unexplained_variance == 0
    assert report.accuracy_ratio == 1.0

def test_canonical_24_invoices_reconciliation():
    # 24 synthetic invoices summing to exact ₹1,84,250
    SEEDS = [
        # Apr 2024
        (8250, 45833), (7500, 41667), (9200, 51111), (6800, 37778),
        (11400, 63333), (5600, 31111), (8900, 49444), (7100, 39444),
        # May 2024
        (9500, 52778), (6400, 35556), (8100, 45000), (7300, 40556),
        (8800, 48889), (6200, 34444), (7900, 43889), (8300, 46111),
        # Jun 2024
        (6900, 38333), (7700, 42778), (8500, 47222), (6600, 36667),
        (9100, 50556), (7400, 41111), (8300, 46111), (2500, 13889),
    ]

    purchase_register = []
    for i, (tax, taxable) in enumerate(SEEDS):
        month = "04" if i < 8 else "05" if i < 16 else "06"
        day = (i % 25) + 1
        purchase_register.append({
            "invoice_no": f"AT/24-25/{1101 + i}",
            "invoice_date": f"2024-{month}-{day:02d}",
            "supplier_gstin": "27XXXXX5678X1ZX",
            "taxable_value": taxable,
            "claimed_itc": tax,
            "cgst": tax // 2,
            "sgst": tax // 2,
        })

    # In GSTR-2B, all 24 invoices are missing (simulating Form ASMT-10 Row 02 inquiry)
    report = run_deterministic_reconciliation(
        purchase_register=purchase_register,
        gstr_2b_records=[],
        target_notice_amount=184250
    )

    assert report.total_purchase_invoices == 24
    assert report.total_taxable_value == 1023611
    assert report.total_questioned_difference == 184250
    assert report.unexplained_variance == 0
    assert report.accuracy_ratio == 1.0
    assert report.duplicates_count == 0
    assert len(report.matches) == 24

def test_rate_mismatch_detection():
    purchase_register = [{
        "invoice_no": "INV-500",
        "invoice_date": "2024-05-10",
        "supplier_gstin": "27AAACA1234A1Z5",
        "taxable_value": 100000,
        "claimed_itc": 18000, # 18%
    }]
    gstr_2b_records = [{
        "invoice_no": "INV500",
        "invoice_date": "2024-05-10",
        "supplier_gstin": "27AAACA1234A1Z5",
        "taxable_value": 100000,
        "available_itc": 12000, # 12% in 2B
    }]
    report = run_deterministic_reconciliation(
        purchase_register=purchase_register,
        gstr_2b_records=gstr_2b_records,
        target_notice_amount=6000
    )
    assert report.rate_mismatch_count == 1
    assert report.total_questioned_difference == 6000
    assert report.unexplained_variance == 0
    match = report.matches[0]
    assert match.status == "RATE_MISMATCH"
    assert "Tax rate mismatch" in match.reason

def test_surplus_2b_and_credit_notes():
    purchase_register = [{
        "invoice_no": "CN-001",
        "invoice_date": "2024-04-12",
        "supplier_gstin": "27AAACA1234A1Z5",
        "taxable_value": -20000,
        "claimed_itc": -3600,
        "doc_type": "CREDIT_NOTE"
    }]
    gstr_2b_records = [{
        "invoice_no": "INV-SURPLUS-99",
        "invoice_date": "2024-04-15",
        "supplier_gstin": "27BBBCB5678B1Z6",
        "taxable_value": 50000,
        "available_itc": 9000
    }]
    report = run_deterministic_reconciliation(
        purchase_register=purchase_register,
        gstr_2b_records=gstr_2b_records,
        target_notice_amount=0
    )
    assert report.credit_notes_count == 1
    assert report.surplus_2b_count == 1
    surplus_match = next((m for m in report.matches if m.status == "SURPLUS_IN_2B"), None)
    assert surplus_match is not None
    assert "omitted from books" in surplus_match.reason

