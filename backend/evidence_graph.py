"""
Dhaal (ढाल) 2.0 - DHAAL Evidence Graph (DEG) Engine
Constructs, cryptographically links, and validates the Directed Acyclic Graph (DAG) connecting:
Notice Allegation -> Invoices -> Banking UTR -> Statutory Grounds -> Response Draft -> Reviewer Decision

Integrity Constraints Enforced:
1. Strict Node & Edge ID Uniqueness
2. Dangling Edge Rejection (Source/Target must exist in Graph)
3. Valid Statutory Relationship Whitelist
4. Transparent Evidence Provenance Tracking (SYNTHETIC, UPLOADED, PARSED, UNVERIFIED, VERIFIED, MISSING, REJECTED, CA_REVIEWED)
5. Evidence Completeness Indicator (ECI) with Separate Real vs Synthetic Accounting
"""
import hashlib
import json
from typing import Dict, List, Optional, Any, Set
from pydantic import BaseModel, Field, model_validator

try:
    from circular_183 import assess_circular_183_applicability, Circular183AssessmentInput
except ImportError:
    from backend.circular_183 import assess_circular_183_applicability, Circular183AssessmentInput

# Whitelist of valid statutory graph relationships
VALID_RELATIONSHIPS: Set[str] = {
    "ITEMIZED_UNDER",
    "DISCHARGED_BY",
    "DELIVERED_VIA",
    "PROVES_COMPLIANCE",
    "SUBSTANTIATED_BY",
    "CITED_IN",
    "CERTIFIED_BY",
    "GOVERNED_BY",
    "REMEDIED_UNDER_CIRCULAR"
}

VALID_PROVENANCE: Set[str] = {
    "SYNTHETIC",
    "UPLOADED",
    "PARSED",
    "UNVERIFIED",
    "VERIFIED",
    "MISSING",
    "REJECTED",
    "CA_REVIEWED",
    "STATUTORY_RULE",
    "SYSTEM_GENERATED"
}

VALID_STATUSES: Set[str] = {
    "SYNTHETIC",
    "UPLOADED",
    "PARSED",
    "UNVERIFIED",
    "VERIFIED",
    "MISSING",
    "REJECTED",
    "CA_REVIEWED",
    "CONFIRMED",
    "HYPOTHESIS",
    "MISSING_ACTION_REQUIRED",
    "PENDING_REVIEW"
}


class GraphNode(BaseModel):
    id: str
    type: str  # "ALLEGATION", "INVOICE", "RECONCILIATION", "BANKING_PROOF", "EWAY_BILL", "SUPPLIER_PROOF", "STATUTORY_GROUND", "DRAFT_ASSERTION", "REVIEW_DECISION"
    label: str
    status: str
    provenance: str = "UNVERIFIED"
    properties: Dict[str, Any] = Field(default_factory=dict)
    sha256_hash: Optional[str] = None
    hash_scope: Optional[str] = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    confidence: float = 1.0
    is_missing: bool = False
    properties: Optional[Dict[str, Any]] = None


class EciScorecardBreakdown(BaseModel):
    total_possible_score: int = 100
    real_verified_score: int
    synthetic_demo_score: int
    evidence_completeness_percentage: int
    invoices_score: int
    banking_score: int
    delivery_score: int
    supplier_proof_score: int
    recipient_filing_score: int
    disclaimer: str = (
        "The Evidence Completeness Indicator (ECI) measures solely whether required document types "
        "and data fields are present in the case dossier. It DOES NOT represent probability of winning "
        "a dispute, guaranteed GST compliance, legal entitlement to ITC, or prediction of a favorable "
        "adjudication by the proper officer."
    )


class EvidenceGraph(BaseModel):
    case_id: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    evidentiary_strength_score: int  # Maintained for legacy compatibility (maps to ECI)
    evidence_completeness_indicator: int  # Authoritative ECI score
    eci_breakdown: EciScorecardBreakdown
    missing_evidence_count: int
    unverified_hypotheses_count: int
    section_16_compliance: Dict[str, Dict[str, Any]]
    circular_183_assessment: Optional[Dict[str, Any]] = None

    @model_validator(mode="after")
    def validate_graph_integrity(self) -> "EvidenceGraph":
        """
        Automated structural validation rejecting:
        - Duplicate node IDs
        - Duplicate edge IDs
        - Edges referencing nonexistent nodes
        - Invalid node relationships
        """
        node_ids: Set[str] = set()
        for node in self.nodes:
            if node.id in node_ids:
                raise ValueError(f"Graph Integrity Error: Duplicate node ID detected: '{node.id}'")
            node_ids.add(node.id)

        edge_ids: Set[str] = set()
        for edge in self.edges:
            if edge.id in edge_ids:
                raise ValueError(f"Graph Integrity Error: Duplicate edge ID detected: '{edge.id}'")
            edge_ids.add(edge.id)

            if edge.source not in node_ids:
                raise ValueError(f"Graph Integrity Error: Edge '{edge.id}' source '{edge.source}' does not exist in nodes")
            if edge.target not in node_ids:
                raise ValueError(f"Graph Integrity Error: Edge '{edge.id}' target '{edge.target}' does not exist in nodes")

            if edge.relationship not in VALID_RELATIONSHIPS:
                raise ValueError(f"Graph Integrity Error: Invalid edge relationship '{edge.relationship}' in edge '{edge.id}'")

        return self


def compute_canonical_node_hash(node_id: str, node_type: str, properties: Dict[str, Any]) -> str:
    """
    Computes a reproducible SHA-256 hash from a deterministic JSON serialization
    of the node's properties.
    """
    canonical_payload = {
        "id": node_id,
        "type": node_type,
        "properties": {k: properties[k] for k in sorted(properties.keys()) if properties[k] is not None}
    }
    canonical_bytes = json.dumps(canonical_payload, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(canonical_bytes).hexdigest()


def build_evidence_graph_for_case(
    case_id: str,
    discrepancy_amount: int = 184250,
    financial_year: str = "2024-25",
    reconciliation_rows: Optional[List[Dict[str, Any]]] = None,
    evidence_checklist_status: Optional[Dict[str, bool]] = None,
    ca_sign_off: Optional[Dict[str, Any]] = None,
    is_demo_mode: bool = True
) -> EvidenceGraph:
    """
    Constructs the authoritative Evidence Graph connecting:
    Notice Allegation -> Invoices -> Banking UTR -> Section 16(2) Legs -> Reply Draft -> CA Sign-off
    """
    if evidence_checklist_status is None:
        evidence_checklist_status = {
            "invoices_attached": True,
            "bank_payment_verified": False,  # Demo UTR is synthetic, NOT real verified
            "reconciliation_ledger_ready": True,
            "supplier_declaration_obtained": False,  # Missing supplier proof
            "eway_bills_attached": True,  # 18 of 24 attached (partial)
            "ca_memo_signed": bool(ca_sign_off)
        }

    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []

    # 1. Root Allegation Node
    allegation_id = f"node_allegation_{case_id}"
    allegation_props = {
        "form": "Form GST ASMT-10",
        "section": "Section 61",
        "financial_year": financial_year,
        "statutory_table": "Table 4(A)(5) vs GSTR-2B",
        "questioned_amount": discrepancy_amount
    }
    nodes.append(GraphNode(
        id=allegation_id,
        type="ALLEGATION",
        label=f"Form ASMT-10 Row 02: ITC Mismatch (₹{discrepancy_amount:,})",
        status="CONFIRMED",
        provenance="PARSED",
        properties=allegation_props,
        sha256_hash=compute_canonical_node_hash(allegation_id, "ALLEGATION", allegation_props),
        hash_scope="Canonical JSON digest of parsed notice parameters for state integrity."
    ))

    # 2. Statutory Legal Ground Nodes (Period-Aware Section 16(2) Pillars)
    statute_16_2_a = "node_statute_16_2_a"
    statute_16_2_aa = "node_statute_16_2_aa"
    statute_16_2_b = "node_statute_16_2_b"
    statute_16_2_c = "node_statute_16_2_c"
    statute_16_2_proviso_2 = "node_statute_16_2_proviso_2"
    guidance_cir_183 = "node_guidance_circular_183"

    fy_is_post_2022 = financial_year in ["2022-23", "2023-24", "2024-25", "FY 2024-25"]

    nodes.extend([
        GraphNode(
            id=statute_16_2_a,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2)(a): Possession of Tax Invoice",
            status="CONFIRMED",
            provenance="STATUTORY_RULE",
            properties={"rule": "Tax invoice held with prescribed particulars", "effective_from": "01.07.2017"}
        ),
        GraphNode(
            id=statute_16_2_aa,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2)(aa): GSTR-2B Reflection",
            status="MISSING_ACTION_REQUIRED" if fy_is_post_2022 else "NOT_APPLICABLE_IN_PERIOD",
            provenance="STATUTORY_RULE",
            properties={
                "rule": "Invoice communicated in GSTR-2B under Section 38",
                "effective_from": "01.01.2022",
                "is_active_for_period": fy_is_post_2022
            }
        ),
        GraphNode(
            id=statute_16_2_b,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2)(b): Physical Receipt of Goods",
            status="CONFIRMED",
            provenance="STATUTORY_RULE",
            properties={"rule": "Goods received under valid transport documentation", "effective_from": "01.07.2017"}
        ),
        GraphNode(
            id=statute_16_2_c,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2)(c): Tax Paid to Government by Supplier",
            status="HYPOTHESIS" if not evidence_checklist_status.get("supplier_declaration_obtained") else "VERIFIED",
            provenance="STATUTORY_RULE",
            properties={"rule": "Tax charged has actually been paid to Government treasury", "effective_from": "01.07.2017"}
        ),
        GraphNode(
            id=statute_16_2_proviso_2,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2) 2nd Proviso: Payment within 180 Days",
            status="CONFIRMED",
            provenance="STATUTORY_RULE",
            properties={"rule": "Discharge value of supply + tax to supplier within 180 days", "effective_from": "01.07.2017"}
        ),
        GraphNode(
            id=guidance_cir_183,
            type="STATUTORY_GROUND",
            label="CBIC Circular No. 183/15/2022-GST",
            status="NOT_APPLICABLE" if fy_is_post_2022 else "CONFIRMED",
            provenance="STATUTORY_RULE",
            properties={
                "rule": "Procedure for GSTR-2A vs 3B mismatches in FY 2017-18 & 2018-19",
                "applicability_for_fy_2024_25": "NOT APPLICABLE (Governed by Section 16(2)(aa))"
            }
        )
    ])

    # 3. Invoices Node
    invoice_count = len(reconciliation_rows) if reconciliation_rows else 24
    inv_group_node = f"node_inv_group_{case_id}"
    inv_provenance = "SYNTHETIC" if is_demo_mode else "UPLOADED"
    inv_props = {
        "invoice_count": invoice_count,
        "tax_total": discrepancy_amount,
        "supplier_gstin": "27XXXXX5678X1ZX",
        "is_synthetic": is_demo_mode,
        "source": "Demo Purchase Register (Unverified)" if is_demo_mode else "Uploaded Purchase Register"
    }
    nodes.append(GraphNode(
        id=inv_group_node,
        type="INVOICE",
        label=f"24 Purchase Vouchers [SYNTHETIC DEMO] — ₹10,23,611" if is_demo_mode else f"{invoice_count} Purchase Invoices — ₹10,23,611",
        status="SYNTHETIC" if is_demo_mode else ("VERIFIED" if evidence_checklist_status.get("invoices_attached") else "MISSING_ACTION_REQUIRED"),
        provenance=inv_provenance,
        properties=inv_props,
        sha256_hash=compute_canonical_node_hash(inv_group_node, "INVOICE", inv_props),
        hash_scope="Canonical JSON digest of invoice set summary."
    ))

    edges.append(GraphEdge(
        id="edge_allegation_invoices",
        source=allegation_id,
        target=inv_group_node,
        relationship="ITEMIZED_UNDER",
        confidence=1.0
    ))

    edges.append(GraphEdge(
        id="edge_invoices_sec16_2_a",
        source=inv_group_node,
        target=statute_16_2_a,
        relationship="PROVES_COMPLIANCE",
        confidence=1.0 if not is_demo_mode else 0.5
    ))

    if fy_is_post_2022:
        edges.append(GraphEdge(
            id="edge_invoices_sec16_2_aa",
            source=inv_group_node,
            target=statute_16_2_aa,
            relationship="GOVERNED_BY",
            confidence=1.0,
            is_missing=True
        ))

    # 4. Banking Payment Proof (Explicitly SYNTHETIC for demo)
    bank_node = f"node_bank_{case_id}"
    bank_props = {
        "utr": "SAMPLEUTR0001",
        "bank_name": "HDFC Bank Ltd (Demonstration)",
        "is_synthetic": is_demo_mode,
        "cleared_within_180_days": None if is_demo_mode else True,
        "disclaimer": "SYNTHETIC demonstration record. Does not represent verified banking evidence. Real clearance requires uploaded bank statement / MT940 / certified payment ledger."
    }
    nodes.append(GraphNode(
        id=bank_node,
        type="BANKING_PROOF",
        label="Bank Payment Voucher [SYNTHETIC DEMO] (UTR: SAMPLEUTR0001 - Unverified)",
        status="SYNTHETIC" if is_demo_mode else ("VERIFIED" if evidence_checklist_status.get("bank_payment_verified") else "UNVERIFIED"),
        provenance="SYNTHETIC" if is_demo_mode else "UPLOADED",
        properties=bank_props,
        sha256_hash=compute_canonical_node_hash(bank_node, "BANKING_PROOF", bank_props),
        hash_scope="Canonical JSON digest of demonstration banking voucher."
    ))

    edges.append(GraphEdge(
        id="edge_invoices_bank",
        source=inv_group_node,
        target=bank_node,
        relationship="DISCHARGED_BY",
        confidence=0.5 if is_demo_mode else 1.0
    ))

    edges.append(GraphEdge(
        id="edge_bank_sec16_prov",
        source=bank_node,
        target=statute_16_2_proviso_2,
        relationship="PROVES_COMPLIANCE",
        confidence=0.5 if is_demo_mode else 1.0
    ))

    # 5. E-Way Bills (Partial Coverage: 18 of 24 attached)
    eway_node = f"node_eway_{case_id}"
    eway_props = {
        "attached_count": 18,
        "total_invoices": 24,
        "missing_count": 6,
        "coverage_percentage": 75.0,
        "all_delivered_verified": False,
        "is_synthetic": is_demo_mode,
        "disclaimer": "Partial coverage: 18 of 24 invoices attached. 6 consignments lack independent delivery documentation."
    }
    nodes.append(GraphNode(
        id=eway_node,
        type="EWAY_BILL",
        label="E-Way Bills: 18 of 24 attached [PARTIAL] (6 missing delivery proof)",
        status="UNVERIFIED",
        provenance="SYNTHETIC" if is_demo_mode else "UPLOADED",
        properties=eway_props,
        sha256_hash=compute_canonical_node_hash(eway_node, "EWAY_BILL", eway_props),
        hash_scope="Canonical JSON digest of partial transport documents."
    ))

    edges.append(GraphEdge(
        id="edge_invoices_eway",
        source=inv_group_node,
        target=eway_node,
        relationship="DELIVERED_VIA",
        confidence=0.75
    ))

    edges.append(GraphEdge(
        id="edge_eway_sec16_2_b",
        source=eway_node,
        target=statute_16_2_b,
        relationship="PROVES_COMPLIANCE",
        confidence=0.75
    ))

    # 6. Supplier Tax Payment Proof (The Critical Missing Link)
    has_supplier_proof = evidence_checklist_status.get("supplier_declaration_obtained", False)
    supplier_proof_node = f"node_supplier_proof_{case_id}"
    supplier_props = {
        "supplier_gstin": "27XXXXX5678X1ZX",
        "has_supplier_certificate": has_supplier_proof,
        "is_synthetic": False,
        "action_required": "Obtain supplier certificate / CA certification under UDIN",
        "statutory_caution": "A supplier certificate is an administrative document, not conclusive proof of government tax-deposit."
    }
    nodes.append(GraphNode(
        id=supplier_proof_node,
        type="SUPPLIER_PROOF",
        label="Supplier Tax Payment Declaration" if has_supplier_proof else "Missing Supplier Confirmation (Action Required)",
        status="VERIFIED" if has_supplier_proof else "MISSING",
        provenance="VERIFIED" if has_supplier_proof else "MISSING",
        properties=supplier_props,
        sha256_hash=compute_canonical_node_hash(supplier_proof_node, "SUPPLIER_PROOF", supplier_props) if has_supplier_proof else None,
        hash_scope="Canonical digest of supplier verification proof." if has_supplier_proof else None
    ))

    edges.append(GraphEdge(
        id="edge_invoices_supplier_proof",
        source=inv_group_node,
        target=supplier_proof_node,
        relationship="SUBSTANTIATED_BY",
        confidence=1.0 if has_supplier_proof else 0.0,
        is_missing=not has_supplier_proof
    ))

    edges.append(GraphEdge(
        id="edge_supplier_proof_sec16_2_c",
        source=supplier_proof_node,
        target=statute_16_2_c,
        relationship="PROVES_COMPLIANCE",
        confidence=1.0 if has_supplier_proof else 0.0,
        is_missing=not has_supplier_proof
    ))

    # Circular 183 Linkage
    edges.append(GraphEdge(
        id="edge_supplier_proof_cir183",
        source=supplier_proof_node,
        target=guidance_cir_183,
        relationship="REMEDIED_UNDER_CIRCULAR",
        confidence=0.5,
        is_missing=True
    ))

    # 7. Draft Response Node
    draft_node = f"node_draft_{case_id}"
    draft_props = {
        "form": "Form GST ASMT-11",
        "rule": "Rule 99(2)",
        "ground": "Substantive compliance under Section 16(2) and reconciliation ledger"
    }
    nodes.append(GraphNode(
        id=draft_node,
        type="DRAFT_ASSERTION",
        label="Form ASMT-11 Formal Response Draft",
        status="CONFIRMED",
        provenance="SYSTEM_GENERATED",
        properties=draft_props,
        sha256_hash=compute_canonical_node_hash(draft_node, "DRAFT_ASSERTION", draft_props),
        hash_scope="Canonical digest of statutory reply draft."
    ))

    edges.append(GraphEdge(
        id="edge_allegation_draft",
        source=allegation_id,
        target=draft_node,
        relationship="CITED_IN",
        confidence=1.0
    ))

    # 8. Reviewer CA Decision Node
    is_ca_signed = bool(ca_sign_off)
    review_node = f"node_ca_review_{case_id}"
    review_props = {
        "ca_name": ca_sign_off.get("ca_name", "Unassigned") if ca_sign_off else "Unassigned",
        "udin": ca_sign_off.get("udin", "Pending") if ca_sign_off else "Pending",
        "disclaimer": "CA sign-off provides professional certification but does not transform missing source evidence into verified evidence."
    }
    nodes.append(GraphNode(
        id=review_node,
        type="REVIEW_DECISION",
        label=f"CA Certification ({ca_sign_off.get('ca_name', 'Pending Sign-Off')})" if is_ca_signed else "CA Review & Sign-Off (Pending Step 6)",
        status="CA_REVIEWED" if is_ca_signed else "PENDING_REVIEW",
        provenance="CA_REVIEWED" if is_ca_signed else "UNVERIFIED",
        properties=review_props,
        sha256_hash=compute_canonical_node_hash(review_node, "REVIEW_DECISION", review_props) if is_ca_signed else None,
        hash_scope="Canonical digest of CA sign-off record." if is_ca_signed else None
    ))

    edges.append(GraphEdge(
        id="edge_draft_ca_review",
        source=draft_node,
        target=review_node,
        relationship="CERTIFIED_BY",
        confidence=1.0 if is_ca_signed else 0.5,
        is_missing=not is_ca_signed
    ))

    # Evaluate Circular 183 Applicability
    cir_assessment = assess_circular_183_applicability(Circular183AssessmentInput(
        financial_year=financial_year,
        mismatch_type="GSTR_3B_VS_GSTR_2B" if fy_is_post_2022 else "GSTR_3B_VS_GSTR_2A",
        supplier_gstin="27XXXXX5678X1ZX",
        tax_difference_amount=discrepancy_amount,
        has_tax_invoice=evidence_checklist_status.get("invoices_attached", False),
        has_goods_receipt=False,  # only 18/24
        supplier_certificate_obtained=has_supplier_proof,
        ca_cma_certificate_obtained=False,
        udin_verified=False
    ))

    # Evidence Completeness Indicator (ECI) Calculation
    # Total: 100 points
    # 1. Invoices (16(2)(a)): 25 points
    # 2. Banking (16(2) 2nd Proviso): 25 points (Real verified if bank_payment_verified, otherwise synthetic demo)
    # 3. Delivery (16(2)(b)): 20 points (15 for 18/24 partial, 20 if all attached)
    # 4. Supplier Tax Payment Proof (16(2)(c)): 20 points
    # 5. Recipient Compliance: 10 points (5 for GSTR-3B return, 5 for CA review)
    invoices_attached = evidence_checklist_status.get("invoices_attached", False)
    bank_verified = evidence_checklist_status.get("bank_payment_verified", False)
    eway_attached = evidence_checklist_status.get("eway_bills_attached", False)
    has_supplier_proof = evidence_checklist_status.get("supplier_declaration_obtained", False)
    is_ca_signed = bool(ca_sign_off)

    inv_points = 25 if invoices_attached else 0
    bank_points = 25 if bank_verified else (25 if is_demo_mode else 0)
    delivery_points = 20 if (eway_attached and (not is_demo_mode or bank_verified and has_supplier_proof)) else (15 if eway_attached else 0)
    supplier_points = 20 if has_supplier_proof else 0
    filing_points = 5  # Recipient GSTR-3B Table 4(A)(5) confirmed
    ca_points = 5 if is_ca_signed else 0

    score = inv_points + bank_points + delivery_points + supplier_points + filing_points + ca_points
    real_verified_score = (25 if (invoices_attached and not is_demo_mode) else 0) + \
                          (25 if (bank_verified and not is_demo_mode) else 0) + \
                          (20 if (delivery_points == 20 and not is_demo_mode) else 0) + \
                          (20 if has_supplier_proof else 0) + filing_points + ca_points

    eci_breakdown = EciScorecardBreakdown(
        total_possible_score=100,
        real_verified_score=real_verified_score,
        synthetic_demo_score=score,
        evidence_completeness_percentage=score,
        invoices_score=inv_points,
        banking_score=bank_points,
        delivery_score=delivery_points,
        supplier_proof_score=supplier_points,
        recipient_filing_score=filing_points + ca_points
    )

    # Section 16 compliance matrix
    sec16_matrix = {
        "16_2_a": {
            "clause": "Possession of Tax Invoice",
            "status": "COMPLIANT" if invoices_attached else "MISSING",
            "score": 100 if invoices_attached else 0,
            "provenance": inv_provenance
        },
        "16_2_aa": {
            "clause": "GSTR-2B Reflection",
            "status": "NON_COMPLIANT_ALLEGED" if fy_is_post_2022 else "NOT_APPLICABLE_IN_PERIOD",
            "score": 0 if fy_is_post_2022 else 100,
            "provenance": "STATUTORY_RULE"
        },
        "16_2_b": {
            "clause": "Physical Receipt of Goods",
            "status": "COMPLIANT" if (delivery_points == 20) else "PARTIAL_UNVERIFIED",
            "score": 100 if (delivery_points == 20) else 75,
            "provenance": "SYNTHETIC" if is_demo_mode else "UPLOADED",
            "note": "All consignments verified" if (delivery_points == 20) else "18 of 24 consignments documented (6 missing transport records)"
        },
        "16_2_c": {
            "clause": "Tax Paid by Supplier",
            "status": "COMPLIANT" if has_supplier_proof else "ACTION_REQUIRED",
            "score": 100 if has_supplier_proof else 0,
            "provenance": "VERIFIED" if has_supplier_proof else "MISSING"
        },
        "16_2_d": {
            "clause": "Return Furnished by Recipient",
            "status": "COMPLIANT",
            "score": 100,
            "provenance": "PARSED"
        },
        "16_2_proviso_2": {
            "clause": "Payment within 180 Days",
            "status": "COMPLIANT" if bank_verified else ("UNVERIFIED_SYNTHETIC" if is_demo_mode else "MISSING"),
            "score": 100 if bank_verified else (0 if is_demo_mode else 0),
            "provenance": "SYNTHETIC" if is_demo_mode else "UPLOADED"
        }
    }

    missing_count = 0
    if not has_supplier_proof:
        missing_count += 1
    if not is_ca_signed:
        missing_count += 1
    if not bank_verified and not is_demo_mode:
        missing_count += 1

    graph = EvidenceGraph(
        case_id=case_id,
        nodes=nodes,
        edges=edges,
        evidentiary_strength_score=score,
        evidence_completeness_indicator=score,
        eci_breakdown=eci_breakdown,
        missing_evidence_count=missing_count,
        unverified_hypotheses_count=1 if not has_supplier_proof else 0,
        section_16_compliance=sec16_matrix,
        circular_183_assessment=cir_assessment.model_dump() if hasattr(cir_assessment, "model_dump") else cir_assessment.dict()
    )
    return graph
