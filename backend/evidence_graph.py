"""
Dhaal (ढाल) 2.0 - DHAAL Evidence Graph (DEG) Engine
Constructs and analyzes a cryptographic, directed acyclic bipartite graph linking:
Notice Allegation -> Invoices -> Reconciliation -> Discrepancy -> Supporting Evidence -> Response Draft -> Reviewer Decision
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import hashlib


class GraphNode(BaseModel):
    id: str
    type: str  # "ALLEGATION", "INVOICE", "RECONCILIATION", "BANKING_PROOF", "EWAY_BILL", "SUPPLIER_PROOF", "STATUTORY_GROUND", "DRAFT_ASSERTION", "REVIEW_DECISION"
    label: str
    status: str  # "CONFIRMED", "VERIFIED", "HYPOTHESIS", "MISSING_ACTION_REQUIRED", "PENDING_REVIEW"
    properties: Dict[str, Any]
    sha256_hash: Optional[str] = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str  # "ITEMIZED_UNDER", "DISCHARGED_BY", "DELIVERED_VIA", "PROVES_COMPLIANCE", "CITED_IN", "CERTIFIED_BY"
    confidence: float = 1.0
    is_missing: bool = False
    properties: Optional[Dict[str, Any]] = None


class EvidenceGraph(BaseModel):
    case_id: str
    nodes: List[GraphNode]
    edges: List[GraphEdge]
    evidentiary_strength_score: int  # 0 to 100
    missing_evidence_count: int
    unverified_hypotheses_count: int
    section_16_compliance: Dict[str, Dict[str, Any]]


def build_evidence_graph_for_case(
    case_id: str,
    discrepancy_amount: int = 184250,
    reconciliation_rows: Optional[List[Dict[str, Any]]] = None,
    evidence_checklist_status: Optional[Dict[str, bool]] = None,
    ca_sign_off: Optional[Dict[str, Any]] = None
) -> EvidenceGraph:
    """
    Constructs the authoritative Evidence Graph connecting:
    Notice Allegation -> Invoices -> Banking UTR -> Section 16(2) Legs -> Reply Draft -> CA Sign-off
    """
    if evidence_checklist_status is None:
        evidence_checklist_status = {
            "invoices_attached": True,
            "bank_payment_verified": True,
            "reconciliation_ledger_ready": True,
            "supplier_declaration_obtained": False,  # Key missing link in ASMT-10
            "eway_bills_attached": True,
            "ca_memo_signed": bool(ca_sign_off)
        }

    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []

    # 1. Root Allegation Node
    allegation_id = f"node_allegation_{case_id}"
    nodes.append(GraphNode(
        id=allegation_id,
        type="ALLEGATION",
        label=f"Form ASMT-10 Row 02: ITC Mismatch (₹{discrepancy_amount:,})",
        status="CONFIRMED",
        properties={
            "form": "Form GST ASMT-10",
            "section": "Section 61",
            "statutory_table": "Table 4(A)(5) vs GSTR-2B",
            "questioned_amount": discrepancy_amount
        },
        sha256_hash=hashlib.sha256(f"{case_id}|allegation|{discrepancy_amount}".encode()).hexdigest()
    ))

    # 2. Statutory Legal Ground Nodes (Section 16(2) Pillars)
    statute_16_2_a = "node_statute_16_2_a"
    statute_16_2_b = "node_statute_16_2_b"
    statute_16_2_c = "node_statute_16_2_c"
    statute_16_2_prov = "node_statute_16_2_prov"
    statute_cir_183 = "node_statute_cir_183"

    nodes.extend([
        GraphNode(
            id=statute_16_2_a,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2)(a): Possession of Tax Invoice",
            status="VERIFIED",
            properties={"rule": "Tax invoice held with prescribed particulars"}
        ),
        GraphNode(
            id=statute_16_2_b,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2)(b): Physical Receipt of Goods",
            status="VERIFIED",
            properties={"rule": "Goods received under E-Way Bill / Transport challan"}
        ),
        GraphNode(
            id=statute_16_2_c,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2)(c): Tax Paid by Supplier",
            status="HYPOTHESIS" if not evidence_checklist_status.get("supplier_declaration_obtained") else "VERIFIED",
            properties={"rule": "Supplier discharged tax in government treasury"}
        ),
        GraphNode(
            id=statute_16_2_prov,
            type="STATUTORY_GROUND",
            label="CGST Sec 16(2) 2nd Proviso: Payment within 180 Days",
            status="VERIFIED",
            properties={"rule": "Consideration + tax discharged via banking channel"}
        ),
        GraphNode(
            id=statute_16_2_prov,
            type="STATUTORY_GROUND",
            label="CBIC Circular No. 183/15/2022-GST",
            status="CONFIRMED",
            properties={"rule": "Procedure for supplier belated filing / B2C misreporting"}
        )
    ])

    # 3. Invoices (Sample 24 or provided rows)
    invoice_count = len(reconciliation_rows) if reconciliation_rows else 24
    inv_group_node = f"node_inv_group_{case_id}"
    nodes.append(GraphNode(
        id=inv_group_node,
        type="INVOICE",
        label=f"24 Tax Invoices (M/s Apex Textiles) — ₹10,23,611 Taxable",
        status="VERIFIED" if evidence_checklist_status.get("invoices_attached") else "MISSING_ACTION_REQUIRED",
        properties={
            "invoice_count": invoice_count,
            "tax_total": discrepancy_amount,
            "supplier_gstin": "27XXXXX5678X1ZX"
        }
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
        confidence=1.0
    ))

    # 4. Banking Payment Proof (UTR)
    bank_node = f"node_bank_{case_id}"
    nodes.append(GraphNode(
        id=bank_node,
        type="BANKING_PROOF",
        label="Bank Payment Voucher (HDFC Bank RTGS UTR: SAMPLEUTR0001)",
        status="VERIFIED" if evidence_checklist_status.get("bank_payment_verified") else "MISSING_ACTION_REQUIRED",
        properties={
            "utr": "SAMPLEUTR0001",
            "bank_name": "HDFC Bank Ltd",
            "cleared_within_180_days": True,
            "days_elapsed": 21
        }
    ))

    edges.append(GraphEdge(
        id="edge_invoices_bank",
        source=inv_group_node,
        target=bank_node,
        relationship="DISCHARGED_BY",
        confidence=1.0
    ))

    edges.append(GraphEdge(
        id="edge_bank_sec16_prov",
        source=bank_node,
        target=statute_16_2_prov,
        relationship="PROVES_COMPLIANCE",
        confidence=1.0
    ))

    # 5. E-Way Bills
    eway_node = f"node_eway_{case_id}"
    nodes.append(GraphNode(
        id=eway_node,
        type="EWAY_BILL",
        label="E-Way Bills & Consignment Delivery Notes (18 of 24 attached)",
        status="VERIFIED" if evidence_checklist_status.get("eway_bills_attached") else "MISSING_ACTION_REQUIRED",
        properties={
            "coverage": "75%",
            "consignee_delivery_confirmed": True
        }
    ))

    edges.append(GraphEdge(
        id="edge_invoices_eway",
        source=inv_group_node,
        target=eway_node,
        relationship="DELIVERED_VIA",
        confidence=0.95
    ))

    edges.append(GraphEdge(
        id="edge_eway_sec16_2_b",
        source=eway_node,
        target=statute_16_2_b,
        relationship="PROVES_COMPLIANCE",
        confidence=0.95
    ))

    # 6. Supplier Tax Payment Proof (The Critical Missing Link)
    has_supplier_proof = evidence_checklist_status.get("supplier_declaration_obtained", False)
    supplier_proof_node = f"node_supplier_proof_{case_id}"
    nodes.append(GraphNode(
        id=supplier_proof_node,
        type="SUPPLIER_PROOF",
        label="Supplier DRC-03 / Circular 183 Declaration" if has_supplier_proof else "Missing Supplier Confirmation (Action Required)",
        status="VERIFIED" if has_supplier_proof else "MISSING_ACTION_REQUIRED",
        properties={
            "supplier_gstin": "27XXXXX5678X1ZX",
            "statutory_relief": "CBIC Circular 183/15/2022-GST",
            "action_required": "Request certificate from M/s Apex Textiles or Chartered Accountant"
        }
    ))

    edges.append(GraphEdge(
        id="edge_invoices_supplier_proof",
        source=inv_group_node,
        target=supplier_proof_node,
        relationship="SUBSTANTIATED_BY",
        confidence=0.5 if not has_supplier_proof else 1.0,
        is_missing=not has_supplier_proof
    ))

    edges.append(GraphEdge(
        id="edge_supplier_proof_sec16_2_c",
        source=supplier_proof_node,
        target=statute_16_2_c,
        relationship="PROVES_COMPLIANCE",
        confidence=0.5 if not has_supplier_proof else 1.0,
        is_missing=not has_supplier_proof
    ))

    # 7. Draft Response Node
    draft_node = f"node_draft_{case_id}"
    nodes.append(GraphNode(
        id=draft_node,
        type="DRAFT_ASSERTION",
        label="Form ASMT-11 Formal Response Draft",
        status="CONFIRMED",
        properties={
            "form": "Form GST ASMT-11",
            "rule": "Rule 99(2)",
            "ground": "Substantive compliance under Section 16 & Circular 183"
        }
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
    nodes.append(GraphNode(
        id=review_node,
        type="REVIEW_DECISION",
        label=f"CA Certification ({ca_sign_off.get('ca_name', 'Pending Sign-Off')})" if is_ca_signed else "CA Review & Sign-Off (Pending Step 6)",
        status="VERIFIED" if is_ca_signed else "PENDING_REVIEW",
        properties={
            "ca_name": ca_sign_off.get("ca_name", "Unassigned") if ca_sign_off else "Unassigned",
            "udin": ca_sign_off.get("udin", "Pending") if ca_sign_off else "Pending"
        }
    ))

    edges.append(GraphEdge(
        id="edge_draft_ca_review",
        source=draft_node,
        target=review_node,
        relationship="CERTIFIED_BY",
        confidence=1.0 if is_ca_signed else 0.5,
        is_missing=not is_ca_signed
    ))

    # Calculate Evidentiary Strength Score (ESS)
    # Weights: Invoice (25%), Bank UTR (25%), E-Way Bill (20%), Supplier Proof (20%), CA Memo (10%)
    score = 0
    if evidence_checklist_status.get("invoices_attached"):
        score += 25
    if evidence_checklist_status.get("bank_payment_verified"):
        score += 25
    if evidence_checklist_status.get("eway_bills_attached"):
        score += 20
    if has_supplier_proof:
        score += 20
    else:
        score += 8  # Partial credit for Circular 183 legal positioning
    if is_ca_signed:
        score += 10

    # Section 16 compliance matrix
    sec16_matrix = {
        "16_2_a": {"clause": "Possession of Tax Invoice", "status": "COMPLIANT", "score": 100},
        "16_2_b": {"clause": "Physical Receipt of Goods", "status": "COMPLIANT", "score": 95},
        "16_2_c": {"clause": "Tax Paid by Supplier", "status": "ACTION_REQUIRED" if not has_supplier_proof else "COMPLIANT", "score": 40 if not has_supplier_proof else 100},
        "16_2_d": {"clause": "Return Furnished by Recipient", "status": "COMPLIANT", "score": 100},
        "16_2_proviso_2": {"clause": "Payment within 180 Days", "status": "COMPLIANT", "score": 100}
    }

    missing_count = 1 if not has_supplier_proof else 0
    if not is_ca_signed:
        missing_count += 1

    return EvidenceGraph(
        case_id=case_id,
        nodes=nodes,
        edges=edges,
        evidentiary_strength_score=score,
        missing_evidence_count=missing_count,
        unverified_hypotheses_count=1 if not has_supplier_proof else 0,
        section_16_compliance=sec16_matrix
    )
