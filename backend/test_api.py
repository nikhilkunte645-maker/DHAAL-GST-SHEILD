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

if __name__ == "__main__":
    test_health_check()
    test_upload_notice_metadata()
    test_verify_draft_pass()
    test_verify_draft_fail()
    test_explanations()
    test_brief_generate()
    test_spa_endpoints()
    print("All backend endpoints 100% operational and verified!")
