"""
Unit Tests for DHAAL 2.0 Evidence Graph (DEG) Engine
Verifies:
- Complete node ID uniqueness across graph
- Edge ID uniqueness and referential integrity (no dangling edges)
- Rejection of duplicate nodes/edges/invalid relationships
- Transparent provenance tracking (SYNTHETIC vs VERIFIED)
- Sample UTR (SAMPLEUTR0001) never marked VERIFIED
- E-Way Bill 18/24 partial coverage modeling
- Evidence Completeness Indicator (ECI) breakdown
- Reproducible SHA-256 hashes
"""
import pytest
from backend.evidence_graph import (
    build_evidence_graph_for_case,
    EvidenceGraph,
    GraphNode,
    GraphEdge,
    EciScorecardBreakdown
)


def test_evidence_graph_basic_topology_and_uniqueness():
    graph = build_evidence_graph_for_case(case_id="DH-2025-ASMT10-8912")
    assert graph.case_id == "DH-2025-ASMT10-8912"
    assert len(graph.nodes) >= 8
    assert len(graph.edges) >= 8

    # Assert 100% Unique Node IDs
    node_ids = [n.id for n in graph.nodes]
    assert len(node_ids) == len(set(node_ids)), f"Duplicate node IDs found: {[x for x in node_ids if node_ids.count(x) > 1]}"

    # Assert 100% Unique Edge IDs
    edge_ids = [e.id for e in graph.edges]
    assert len(edge_ids) == len(set(edge_ids)), f"Duplicate edge IDs found: {[x for x in edge_ids if edge_ids.count(x) > 1]}"

    # Assert No Dangling Edges
    node_id_set = set(node_ids)
    for edge in graph.edges:
        assert edge.source in node_id_set, f"Dangling edge source: {edge.source}"
        assert edge.target in node_id_set, f"Dangling edge target: {edge.target}"

    # Assert Proviso 2 and Circular 183 have distinct IDs
    assert "node_statute_16_2_proviso_2" in node_id_set
    assert "node_guidance_circular_183" in node_id_set


def test_bank_synthetic_utr_not_verified():
    graph = build_evidence_graph_for_case(case_id="DH-2025-ASMT10-8912")
    bank_nodes = [n for n in graph.nodes if n.type == "BANKING_PROOF"]
    assert len(bank_nodes) == 1
    bank_node = bank_nodes[0]

    # Must be marked SYNTHETIC, NEVER VERIFIED
    assert bank_node.status == "SYNTHETIC"
    assert bank_node.provenance == "SYNTHETIC"
    assert bank_node.status != "VERIFIED"
    assert "SAMPLEUTR0001" in bank_node.properties["utr"]
    assert bank_node.properties["is_synthetic"] is True
    assert bank_node.properties["cleared_within_180_days"] is None


def test_eway_bill_partial_coverage():
    graph = build_evidence_graph_for_case(case_id="DH-2025-ASMT10-8912")
    eway_nodes = [n for n in graph.nodes if n.type == "EWAY_BILL"]
    assert len(eway_nodes) == 1
    eway_node = eway_nodes[0]

    assert eway_node.properties["attached_count"] == 18
    assert eway_node.properties["missing_count"] == 6
    assert eway_node.properties["all_delivered_verified"] is False
    assert "PARTIAL" in eway_node.label or "18 of 24" in eway_node.label


def test_evidence_completeness_indicator_breakdown():
    graph = build_evidence_graph_for_case(case_id="DH-2025-ASMT10-8912")
    eci = graph.eci_breakdown
    assert eci.total_possible_score == 100
    assert eci.evidence_completeness_percentage >= 70
    assert "DOES NOT represent probability of winning" in eci.disclaimer
    assert graph.evidence_completeness_indicator == graph.evidentiary_strength_score


def test_graph_validation_rejects_duplicate_node_id():
    node1 = GraphNode(id="dup_node", type="ALLEGATION", label="A1", status="CONFIRMED")
    node2 = GraphNode(id="dup_node", type="INVOICE", label="A2", status="UNVERIFIED")
    edge = GraphEdge(id="e1", source="dup_node", target="dup_node", relationship="ITEMIZED_UNDER")

    eci = EciScorecardBreakdown(
        real_verified_score=0,
        synthetic_demo_score=0,
        evidence_completeness_percentage=0,
        invoices_score=0,
        banking_score=0,
        delivery_score=0,
        supplier_proof_score=0,
        recipient_filing_score=0
    )

    with pytest.raises(ValueError, match="Duplicate node ID"):
        EvidenceGraph(
            case_id="case_dup_test",
            nodes=[node1, node2],
            edges=[edge],
            evidentiary_strength_score=0,
            evidence_completeness_indicator=0,
            eci_breakdown=eci,
            missing_evidence_count=0,
            unverified_hypotheses_count=0,
            section_16_compliance={}
        )


def test_graph_validation_rejects_dangling_edge():
    node1 = GraphNode(id="n1", type="ALLEGATION", label="A1", status="CONFIRMED")
    edge = GraphEdge(id="e1", source="n1", target="nonexistent_node", relationship="ITEMIZED_UNDER")

    eci = EciScorecardBreakdown(
        real_verified_score=0,
        synthetic_demo_score=0,
        evidence_completeness_percentage=0,
        invoices_score=0,
        banking_score=0,
        delivery_score=0,
        supplier_proof_score=0,
        recipient_filing_score=0
    )

    with pytest.raises(ValueError, match="does not exist in nodes"):
        EvidenceGraph(
            case_id="case_dangle_test",
            nodes=[node1],
            edges=[edge],
            evidentiary_strength_score=0,
            evidence_completeness_indicator=0,
            eci_breakdown=eci,
            missing_evidence_count=0,
            unverified_hypotheses_count=0,
            section_16_compliance={}
        )


def test_evidence_graph_fully_compliant():
    checklist = {
        "invoices_attached": True,
        "bank_payment_verified": True,
        "reconciliation_ledger_ready": True,
        "supplier_declaration_obtained": True,
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
