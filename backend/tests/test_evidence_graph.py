"""
Unit Tests for DHAAL 2.0 Evidence Graph (DEG) Engine
Verifies graph topology, Section 16(2) compliance matrix, missing link detection, and score calculation.
"""
from backend.evidence_graph import build_evidence_graph_for_case

def test_evidence_graph_basic_topology():
    graph = build_evidence_graph_for_case(case_id="DH-2025-ASMT10-8912")
    assert graph.case_id == "DH-2025-ASMT10-8912"
    assert len(graph.nodes) >= 8
    assert len(graph.edges) >= 8
    assert graph.evidentiary_strength_score >= 70

    # Ensure missing supplier proof is detected
    assert graph.missing_evidence_count >= 1
    assert graph.section_16_compliance["16_2_c"]["status"] == "ACTION_REQUIRED"

def test_evidence_graph_fully_compliant():
    checklist = {
        "invoices_attached": True,
        "bank_payment_verified": True,
        "reconciliation_ledger_ready": True,
        "supplier_declaration_obtained": True,  # Now resolved!
        "eway_bills_attached": True,
        "ca_memo_signed": True
    }
    ca_sign = {
        "ca_name": "CA Rajesh Sharma",
        "udin": "25049281BGXYZ9912"
    }

    graph = build_evidence_graph_for_case(
        case_id="DH-2025-ASMT10-8912",
        evidence_checklist_status=checklist,
        ca_sign_off=ca_sign
    )

    assert graph.evidentiary_strength_score == 100
    assert graph.missing_evidence_count == 0
    assert graph.unverified_hypotheses_count == 0
    assert graph.section_16_compliance["16_2_c"]["status"] == "COMPLIANT"
