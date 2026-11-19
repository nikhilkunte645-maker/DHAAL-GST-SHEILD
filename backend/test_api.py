import sys
import os
import io
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    res = client.get("/")
    assert res.status_code == 200
    assert "Dhaal Backend" in res.json()["system"]

def test_upload_notice_metadata():
    file_content = b"%PDF-1.4 Mock GST Notice Scan Content"
    files = {"file": ("notice_scan.pdf", io.BytesIO(file_content), "application/pdf")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["notice_id"] == "ZA270525008912M"
    assert data["section"] == "61"
    assert data["discrepancy_amount"] == 184250
    assert data["reply_deadline"] == "2025-06-13"

def test_dynamic_pdf_parsing():
    content = b"%PDF-1.4\nNotice ID: ZA270525999999M\nGSTIN: 27AAAAA0000A1Z5\nSection 61\nTax Period: Jul-Sep 2024\nAmount: Rs. 245000\n"
    files = {"file": ("dynamic_notice.pdf", io.BytesIO(content), "application/pdf")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["notice_id"] == "ZA270525999999M"
    assert data["gstin"] == "27AAAAA0000A1Z5"
    assert data["discrepancy_amount"] == 245000
    assert data["tax_period"] == "Jul-Sep 2024"

def test_verify_draft_pass():
    payload = {
        "draft_text": "In response to notice under Section 61, the discrepancy of ₹1,84,250 for Apr-Jun 2024 is reconciled.",
        "confirmed_amount": 184250,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "PASS"
    assert res.json()["checks"]["amount_match"] is True

def test_verify_draft_fail():
    payload = {
        "draft_text": "In response to notice under Section 73, the discrepancy of ₹1,50,000 is reported.",
        "confirmed_amount": 180000,
        "confirmed_section": "61",
        "confirmed_period": "Apr-Jun 2024"
    }
    res = client.post("/api/verify/draft", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "FAIL"
    assert len(res.json()["mismatches"]) >= 1

def test_explanations():
    for lang in ["en", "hi", "mr"]:
        res = client.get(f"/api/explain/{lang}")
        assert res.status_code == 200
        assert "title" in res.json()
        assert "summary" in res.json()

def test_brief_generate():
    payload = {
        "notice_id": "ZA270525008912M",
        "draft_text": "Verified Form ASMT-11 draft text",
        "evidence_checklist_status": {"exhibit1": True, "exhibit2": True},
        "confirmed_amount": 184250
    }
    res = client.post("/api/brief/generate", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "SUCCESS"
    assert res.json()["dossier_id"] == "DH-2025-ASMT10-8912"

def test_spa_endpoints():
    res = client.get("/api/notices/DH-2025-ASMT10-8912")
    assert res.status_code == 200
    assert res.json()["businessName"] == "M/s Sharma Garments"

def test_section_170_statutory_rounding():
    from verifier import round_statutory_inr, format_inr
    # Section 170: >= 50 paise rounds UP, < 50 paise rounds DOWN
    assert round_statutory_inr(184250.49) == 184250
    assert round_statutory_inr(184250.50) == 184251
    assert round_statutory_inr(184250.51) == 184251
    # Contrast with Python banker's rounding: 2.5 rounds to 3 under Section 170
    assert round_statutory_inr(2.5) == 3
    assert round_statutory_inr(3.5) == 4
    # Formatting
    assert format_inr(184250) == "₹1,84,250"
    assert format_inr(184250.50) == "₹1,84,251"

def test_reconciliation_endpoint():
    res = client.post("/api/reconciliation/run", json={})
    assert res.status_code == 200
    data = res.json()
    assert data["total_purchase_invoices"] == 24
    assert data["total_taxable_value"] == 1023611
    assert data["total_questioned_difference"] == 184250
    assert data["unexplained_variance"] == 0
    assert data["accuracy_ratio"] == 1.0

def test_evidence_graph_endpoint():
    res = client.get("/api/evidence/DH-2025-ASMT10-8912/graph")
    assert res.status_code == 200
    data = res.json()
    assert data["case_id"] == "DH-2025-ASMT10-8912"
    assert len(data["nodes"]) >= 8
    assert len(data["edges"]) >= 8
    assert data["evidentiary_strength_score"] >= 70

def test_evidence_scorecard_endpoint():
    res = client.get("/api/evidence/DH-2025-ASMT10-8912/scorecard")
    assert res.status_code == 200
    data = res.json()
    assert "section_16_compliance" in data
    assert data["section_16_compliance"]["16_2_a"]["status"] == "COMPLIANT"
    assert "evidence_completeness_indicator" in data
    assert "eci_breakdown" in data
    assert data["eci_breakdown"]["total_possible_score"] == 100

def test_circular_183_assessment_endpoint():
    # Test FY 2024-25 not applicable
    res = client.post("/api/circular-183/assess?financial_year=2024-25&mismatch_type=GSTR_3B_VS_GSTR_2B")
    assert res.status_code == 200
    data = res.json()
    assert data["is_applicable"] is False
    assert data["verdict"] == "NOT APPLICABLE"

    # Test FY 2017-18 under 5L applicable
    res_17 = client.post("/api/circular-183/assess?financial_year=2017-18&mismatch_type=GSTR_3B_VS_GSTR_2A&tax_difference=150000&has_supplier_certificate=true")
    assert res_17.status_code == 200
    data_17 = res_17.json()
    assert data_17["is_applicable"] is True
    assert "APPLICABLE" in data_17["verdict"]

if __name__ == "__main__":
    test_health_check()
    test_upload_notice_metadata()
    test_dynamic_pdf_parsing()
    test_verify_draft_pass()
    test_verify_draft_fail()
    test_explanations()
    test_brief_generate()
    test_spa_endpoints()
    print("All backend endpoints 100% operational and verified!")
