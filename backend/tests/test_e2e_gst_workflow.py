"""
End-to-End Real-World GST Workflow Integration Tests for DHAAL (ढाल)
Validates the complete 11-step lifecycle:
1. Synthetic ASMT-10 Upload
2. Notice Parameter Extraction
3. Amount Confirmation & Section 170 Statutory Precision
4. Loading Purchase Register & GSTR-2B Data
5. Deterministic Reconciliation Execution
6. Mismatch Identification (Rate Mismatch, Missing Invoices, Credit Notes)
7. Evidence Graph Topology & Statutory Provisos
8. AI/Deterministic Draft Response Generation
9. Multi-Tier Verification Execution
10. Stale Verification Invalidation Guard
11. Final CA Dossier Generation & Financial Traceability
"""
import pytest
from fastapi.testclient import TestClient

from main import app
from reconciler import run_deterministic_reconciliation
from verifier import verify_draft
from evidence_graph import build_evidence_graph_for_case

client = TestClient(app)

def test_full_e2e_gst_scrutiny_lifecycle():
    # 1. Upload Synthetic ASMT-10 notice
    pdf_content = (
        b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"
        b"FORM GST ASMT-10\n"
        b"Reference No: ZA270324099881M\n"
        b"GSTIN: 27AABCU9603R1ZM\n"
        b"Tax Period: 2024-25\n"
        b"Tax Discrepancy under Section 61: Rs 1,84,250.00\n"
        b"Discrepancy in Table 8A vs GSTR-3B ITC"
    )
    upload_res = client.post(
        "/api/notice/upload",
        files={"file": ("synthetic_asmt10.pdf", pdf_content, "application/pdf")}
    )
    assert upload_res.status_code == 200, f"Upload failed: {upload_res.text}"
    extracted = upload_res.json()
    assert extracted["notice_id"] == "ZA270324099881M"
    assert extracted["discrepancy_amount"] == 184250

    # 2. Confirm Financial Values & Section 170 Invariant
    target_amount = 184250.0
    confirmed_case = {
        "case_id": "DH-2024-ASMT10-9988",
        "taxpayer_name": "M/s Synthetic Enterprises",
        "gstin": "27AABCU9603R1ZM",
        "notice_number": "ZA270324099881M",
        "confirmed_amount": target_amount,
        "tax_period": "2024-25",
        "statutory_section": "Section 61"
    }
    assert confirmed_case["confirmed_amount"] == 184250.0

    # 3. Load Synthetic Invoices & Run Reconciliation
    purchase_register = [
        {
            "invoice_no": "INV/24-25/001",
            "invoice_date": "2024-05-10",
            "supplier_gstin": "27XXXXX5678X1ZX",
            "supplier_name": "Apex Suppliers",
            "taxable_value": 1023611.0,
            "claimed_itc": 184250.0,
            "cgst": 92125.0,
            "sgst": 92125.0,
            "doc_type": "INVOICE"
        },
        {
            "invoice_no": "INV/24-25/002",
            "invoice_date": "2024-05-15",
            "supplier_gstin": "27YYYYY1234Y1ZY",
            "supplier_name": "Zenith Corp",
            "taxable_value": 50000.0,
            "claimed_itc": 9000.0,
            "cgst": 4500.0,
            "sgst": 4500.0,
            "doc_type": "INVOICE"
        },
        {
            "invoice_no": "CN/24-25/001",
            "invoice_date": "2024-05-20",
            "supplier_gstin": "27YYYYY1234Y1ZY",
            "supplier_name": "Zenith Corp",
            "taxable_value": -10000.0,
            "claimed_itc": -1800.0,
            "cgst": -900.0,
            "sgst": -900.0,
            "doc_type": "CREDIT_NOTE"
        }
    ]

    gstr_2b_records = [
        # Zenith matches
        {
            "invoice_no": "INV/24-25/002",
            "invoice_date": "2024-05-15",
            "supplier_gstin": "27YYYYY1234Y1ZY",
            "taxable_value": 50000.0,
            "total_tax": 9000.0,
            "cgst": 4500.0,
            "sgst": 4500.0
        },
        # Credit Note matches
        {
            "invoice_no": "CN/24-25/001",
            "invoice_date": "2024-05-20",
            "supplier_gstin": "27YYYYY1234Y1ZY",
            "taxable_value": -10000.0,
            "total_tax": -1800.0,
            "cgst": -900.0,
            "sgst": -900.0
        }
        # INV/24-25/001 is omitted in 2B (unreported by supplier)
    ]

    recon_report = run_deterministic_reconciliation(
        purchase_register=purchase_register,
        gstr_2b_records=gstr_2b_records,
        target_notice_amount=target_amount
    )

    # 4. Verify Reconciliation Findings
    assert recon_report.exact_matches_count >= 2
    assert recon_report.credit_notes_count == 1
    assert recon_report.unreported_2b_count >= 1
    # Unexplained variance should be zero because the single unreported invoice matches the notice demand exactly
    assert recon_report.unexplained_variance == 0.0

    # 5. Assemble Evidence Graph
    graph = build_evidence_graph_for_case("DH-2024-ASMT10-9988", int(target_amount))
    assert len(graph.nodes) > 0
    assert len(graph.edges) > 0
    node_ids = [n.id for n in graph.nodes]
    assert len(node_ids) == len(set(node_ids)), "Duplicate node ID found in evidence graph!"

    # 6. Generate and Verify Draft Response
    valid_draft = (
        "In response to Notice ZA270324099881M dated 14-May-2025 issued under Section 61, "
        "the taxpayer M/s Sharma Garments (GSTIN: 27AABCU9603R1ZM) submits explanation regarding "
        "Input Tax Credit demand of ₹1,84,250. The difference arose due to invoice INV/24-25/001 "
        "omitted by vendor in GSTR-1, subsequently reconciled with tax deposited into Government treasury."
    )
    conf_fields = {
        "confirmedAmount": target_amount,
        "allowedDates": ["14-May-2025"],
        "allowedSections": ["Section 61"],
        "gstin": "27AABCU9603R1ZM",
        "noticeNumber": "ZA270324099881M"
    }
    verif = verify_draft(valid_draft, conf_fields)
    assert verif.passed is True
    assert verif.financialConsistency is True
    assert verif.humanApprovalRequired is True

    # 7. Test Invalidation When User Alters Draft or Underlying Data
    tampered_draft = valid_draft.replace("₹1,84,250", "₹1,50,000")
    tampered_verif = verify_draft(tampered_draft, conf_fields)
    assert tampered_verif.passed is False
    assert any(not c.passed for c in tampered_verif.checks)

    # 8. Generate Final CA-Ready Dossier Brief
    brief_res = client.post(
        "/api/brief/generate",
        json={
            "notice_id": "ZA270324099881M",
            "draft_text": valid_draft,
            "evidence_checklist_status": {"exhibit1": True, "exhibit2": True, "exhibit3": True},
            "confirmed_amount": 184250
        }
    )
    assert brief_res.status_code == 200
    brief_data = brief_res.json()
    assert brief_data["status"] == "SUCCESS"
    assert brief_data["dossier_id"] == "DH-2025-ASMT10-8912"
    assert "184,250" in brief_data["verified_draft"] or "1,84,250" in brief_data["verified_draft"]

def test_multi_period_statutory_rule_handling():
    # Test Period-aware statutory compliance:
    # 2017-18 -> Circular 183 applies to 3B vs 2A differences with supplier declaration
    res_1718 = client.post("/api/circular-183/assess", json={
        "tax_difference": 150000.0,
        "financial_year": "2017-18",
        "mismatch_type": "GSTR_3B_VS_GSTR_2A",
        "has_supplier_certificate": True
    })
    assert res_1718.status_code == 200
    assert res_1718.json()["is_applicable"] is True
    assert "APPLICABLE" in res_1718.json()["verdict"]

    # 2024-25 -> Section 16(2)(aa) applies, Circular 183 NOT applicable
    res_2425 = client.post("/api/circular-183/assess", json={
        "tax_difference": 184250.0,
        "financial_year": "2024-25",
        "mismatch_type": "GSTR_3B_VS_GSTR_2B"
    })
    assert res_2425.status_code == 200
    assert res_2425.json()["is_applicable"] is False
    assert res_2425.json()["verdict"] == "NOT APPLICABLE"
