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
