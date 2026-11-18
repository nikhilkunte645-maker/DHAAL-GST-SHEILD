import pytest
import io
import sys
import os

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_upload_good_pdf():
    pdf_content = (
        b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\nstream\n"
        b"Form GST ASMT-10 Notice Reference ZA270525999999M GSTIN 27AAAAA0000A1Z5 "
        b"Discrepancy Amount Rs. 245000 Period Jul-Sep 2024 Section 61\n"
        b"endstream\nendobj\ntrailer\n<<>>\n%%EOF"
    )
    files = {"file": ("valid_notice.pdf", io.BytesIO(pdf_content), "application/pdf")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["notice_id"] == "ZA270525999999M"
    assert data["discrepancy_amount"] == 245000
    assert data["gstin"] == "27AAAAA0000A1Z5"

def test_upload_non_pdf_extension():
    content = b"This is a plain text file without PDF headers."
    files = {"file": ("document.txt", io.BytesIO(content), "text/plain")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 400
    data = res.json()
    assert data["error"] == "INVALID_FILE_TYPE"
    assert "PDF" in data["message"]

def test_upload_non_pdf_magic_bytes():
    # PDF extension but fake non-PDF content
    content = b"Not a real PDF header"
    files = {"file": ("fake_notice.pdf", io.BytesIO(content), "application/pdf")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 400
    data = res.json()
    assert data["error"] == "INVALID_FILE_TYPE"

def test_upload_empty_file():
    files = {"file": ("empty_notice.pdf", io.BytesIO(b""), "application/pdf")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 400
    data = res.json()
    assert data["error"] == "EMPTY_FILE"
    assert "empty" in data["message"].lower()

def test_upload_oversized_file():
    # 4.5 MB payload (exceeds 4 MB limit)
    large_content = b"%PDF-1.4 " + (b"X" * (4 * 1024 * 1024 + 100))
    files = {"file": ("large_notice.pdf", io.BytesIO(large_content), "application/pdf")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 413
    data = res.json()
    assert data["error"] == "FILE_TOO_LARGE"
    assert "4 MB" in data["message"]

def test_upload_image_only_pdf_no_text():
    # Valid %PDF magic bytes with no extractable text layer (e.g. simulated scanned bitmap without OCR)
    image_only_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF"
    files = {"file": ("scanned_photo.pdf", io.BytesIO(image_only_pdf), "application/pdf")}
    res = client.post("/api/notice/upload", files=files)
    assert res.status_code == 422
    data = res.json()
    assert data["error"] in ["NO_TEXT_LAYER", "CORRUPT_PDF"]
    assert "text" in data["message"].lower() or "pdf" in data["message"].lower()
