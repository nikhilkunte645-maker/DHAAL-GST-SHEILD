import pytest
import sys
import os

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from verifier import verify_draft, format_inr
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_verifier_amount_match():
    draft_text = "With reference to Notice ZA270525008912M dated 14-May-2025 under Section 61 for GSTIN 27XXXXX1234X1ZX, the discrepancy of ₹1,84,250 is fully reconciled with GSTR-2B."
    confirmed = {
        "confirmedAmount": 184250.0,
        "allowedDates": ["14-May-2025"],
        "allowedSections": ["Section 61", "Section 16(2)"],
        "gstin": "27XXXXX1234X1ZX",
        "noticeDate": "14-May-2025"
    }
    report = verify_draft(draft_text, confirmed)
    assert report.passed is True
    assert len(report.errors) == 0
    amount_check = next((c for c in report.checks if c.id == "check-1-amount"), None)
    assert amount_check is not None
    assert amount_check.passed is True

def test_verifier_amount_mismatch():
    draft_text = "With reference to Notice ZA270525008912M under Section 61 for GSTIN 27XXXXX1234X1ZX, the discrepancy of ₹1,50,000 is reported."
    confirmed = {
        "confirmedAmount": 184250.0,
        "allowedDates": ["14-May-2025"],
        "allowedSections": ["Section 61"],
        "gstin": "27XXXXX1234X1ZX",
        "noticeDate": "14-May-2025"
    }
    report = verify_draft(draft_text, confirmed)
    assert report.passed is False
    assert len(report.errors) > 0
    amount_check = next((c for c in report.checks if c.id == "check-1-amount"), None)
    assert amount_check is not None
    assert amount_check.passed is False

def test_verify_draft_api_endpoint_pass():
    payload = {
        "draft_text": "In response to notice under Section 61, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PASS"
    assert data["checks"]["amount_match"] is True

def test_verify_draft_api_endpoint_fail():
    payload = {
        "draft_text": "In response to notice under Section 73, the discrepancy of ₹1,20,000 is reported.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "FAIL"
    assert len(data["mismatches"]) >= 1

def test_verify_draft_adversarial_scenarios():
    # 1. Section mismatch (citing Sec 74 instead of Sec 61)
    payload_bad_sec = {
        "draft_text": "Discrepancy of ₹1,84,250 is addressed under Section 74 for Apr-Jun 2024.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_bad_sec)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "FAIL"
    assert data["legal_verification"] is False
    assert any(m["field"] == "Section Code" for m in data["mismatches"])
    assert data["human_approval_required"] is True

    # 2. Period mismatch (stating Oct-Dec 2024 instead of Apr-Jun 2024)
    payload_bad_period = {
        "draft_text": "In response to Section 61 notice, the discrepancy of ₹1,84,250 for Oct-Dec 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_bad_period)
    assert res.status_code == 200
    data = res.json()
    assert data["source_data_consistency"] is False
    assert data["checks"]["period_match"] is False

    # 3. Adversarial section boundary: Section 161 should NOT match Section 61
    payload_sec_161 = {
        "draft_text": "In response to Section 161 notice, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_sec_161)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert res.json()["checks"]["section_match"] is False

    # 4. Adversarial section boundary: Section 610 should NOT match Section 61
    payload_sec_610 = {
        "draft_text": "In response to Section 610 notice, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_sec_610)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert res.json()["checks"]["section_match"] is False

    # 5. Section 61(1) sub-clause SHOULD match Section 61
    payload_sec_sub = {
        "draft_text": "In response to Section 61(1) notice, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_sec_sub)
    assert res.status_code == 200
    assert res.json()["status"] == "PASS"
    assert res.json()["checks"]["section_match"] is True

    # 6. Historical amount cited with competing discrepancy conclusion
    payload_competing = {
        "draft_text": "In historical audit of FY 2021-22, ₹1,84,250 was referenced. However, under Section 61 for Apr-Jun 2024, the assessed discrepancy amount is ₹50,000.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_competing)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert res.json()["checks"]["amount_match"] is False
    assert res.json()["financial_consistency"] is False

    # 7. Tax period valid equivalents (e.g. April to June 2024 or Q1 FY 2024-25)
    payload_equiv_period = {
        "draft_text": "In response to Section 61 notice, the discrepancy of ₹1,84,250 for April to June 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_equiv_period)
    assert res.status_code == 200
    assert res.json()["status"] == "PASS"
    assert res.json()["checks"]["period_match"] is True

    # 8. Adversarial section boundary: Section 61A should NOT match Section 61
    payload_sec_61a = {
        "draft_text": "In response to Section 61A notice, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_sec_61a)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert res.json()["checks"]["section_match"] is False

    # 9. Asymmetric section boundary: Confirmed 61(1) must NOT accept draft Section 61 alone
    payload_sec_generic = {
        "draft_text": "In response to Section 61 notice, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61(1)",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_sec_generic)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert res.json()["checks"]["section_match"] is False

    # 10. Amount embedded in larger number (e.g. 1184250 or 1842500) must NOT pass
    payload_embedded = {
        "draft_text": "In response to Section 61 notice, the discrepancy of 1184250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_embedded)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert res.json()["checks"]["amount_match"] is False

    # 11. Correct and contradictory periods appearing together must FAIL
    payload_mixed_periods = {
        "draft_text": "In response to notice for Apr-Jun 2024 under Section 61, the discrepancy for Oct-Dec 2024 of ₹1,84,250 is addressed.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_mixed_periods)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert res.json()["checks"]["period_match"] is False

    # 12. Correct discrepancy amount alongside an unrelated large currency figure (e.g. turnover ₹10,23,611) must PASS
    payload_with_turnover = {
        "draft_text": "Total taxable turnover under invoice is ₹10,23,611. In response to Section 61 notice for Apr-Jun 2024, the discrepancy of ₹1,84,250 is fully reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_with_turnover)
    assert res.status_code == 200
    assert res.json()["status"] == "PASS"
    assert res.json()["checks"]["amount_match"] is True

    # 13. Confirmed amount with .50 decimal rounds up to 184251 under Section 170
    payload_decimal_round = {
        "draft_text": "In response to Section 61 notice, the discrepancy of ₹1,84,251 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250.50,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload_decimal_round)
    assert res.status_code == 200
    assert res.json()["status"] == "PASS"
    assert res.json()["checks"]["amount_match"] is True
