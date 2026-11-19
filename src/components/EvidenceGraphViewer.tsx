import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export interface GraphNodeData {
  id: string;
  type: string;
  label: string;
  shortLabel: string;
  status: 'CONFIRMED' | 'VERIFIED' | 'MISSING_ACTION_REQUIRED' | 'PENDING_REVIEW' | 'SYNTHETIC' | 'PARTIAL' | 'UNVERIFIED' | 'NOT_APPLICABLE';
  provenance: 'SYNTHETIC' | 'UPLOADED' | 'PARSED' | 'UNVERIFIED' | 'VERIFIED' | 'MISSING' | 'STATUTORY_RULE' | 'SYSTEM_GENERATED';
  statutoryRef: string;
  x: number;
  y: number;
  properties: Record<string, string | number | boolean>;
}

export interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  relationship: string;
  isMissing?: boolean;
}

const DEFAULT_NODES: GraphNodeData[] = [
  {
    id: 'node_allegation',
    type: 'ALLEGATION',
    label: 'ASMT-10 Row 02: Table 4(A)(5) Discrepancy',
    shortLabel: 'Notice Allegation (₹1,84,250)',
    status: 'CONFIRMED',
    provenance: 'PARSED',
    statutoryRef: 'CGST Sec 61(1) / Rule 99(1)',
    x: 60,
    y: 190,
    properties: {
      'Notice Reference': 'ZA270525008912M',
      'Questioned ITC': '₹1,84,250',
      'Tax Period': 'Q1 (Apr-Jun 2024)',
      'Statutory Authority': 'CGST Section 61(1) & Rule 99(1)',
      'Allegation Nature': 'Pre-adjudication observation (Not a demand order)'
    }
  },
  {
    id: 'node_invoices',
    type: 'INVOICE',
    label: '24 Tax Invoices [DEMO LEDGER] (M/s Apex Textiles)',
    shortLabel: '24 Invoices (₹10,23,611) [DEMO]',
    status: 'SYNTHETIC',
    provenance: 'SYNTHETIC',
    statutoryRef: 'CGST Sec 16(2)(a)',
    x: 290,
    y: 70,
    properties: {
      'Invoice Count': 24,
      'Taxable Value': '₹10,23,611',
      'Tax Amount': '₹1,84,250',
      'Supplier GSTIN': '27XXXXX5678X1ZX',
      'Data Provenance': 'SYNTHETIC (Onboard Demo Fixture)',
      'Statutory Rule': 'Possession of Tax Invoice under Section 16(2)(a)'
    }
  },
  {
    id: 'node_bank_utr',
    type: 'BANKING_PROOF',
    label: 'Bank Payment Voucher [SYNTHETIC DEMO]',
    shortLabel: 'Bank UTR: SAMPLEUTR0001 [DEMO]',
    status: 'SYNTHETIC',
    provenance: 'SYNTHETIC',
    statutoryRef: 'CGST Sec 16(2) 2nd Proviso',
    x: 290,
    y: 190,
    properties: {
      'Bank Name': 'HDFC Bank Ltd (Demonstration)',
      'UTR Number': 'SAMPLEUTR0001',
      'Record Status': 'SYNTHETIC DEMO (Unverified Demo Data)',
      'Statutory Condition': 'Payment to supplier within 180 days',
      'Verification Caveat': 'Demonstration data only. Real clearance requires uploaded bank statement / MT940 / certified payment ledger.'
    }
  },
  {
    id: 'node_eway_bills',
    type: 'EWAY_BILL',
    label: 'E-Way Bills: 18 of 24 attached [PARTIAL]',
    shortLabel: 'E-Way Bills: 18/24 [PARTIAL]',
    status: 'PARTIAL',
    provenance: 'SYNTHETIC',
    statutoryRef: 'CGST Sec 16(2)(b)',
    x: 290,
    y: 310,
    properties: {
      'Attached Documents': '18 of 24 invoices',
      'Missing Consignments': '6 invoices lack transport documents',
      'Coverage': '75.0% partial documentation',
      'Delivery Verification': 'Partial — Physical receipt not independently verified for 25% of shipments.'
    }
  },
  {
    id: 'node_supplier_proof',
    type: 'SUPPLIER_PROOF',
    label: 'Supplier GSTR-3B Tax Payment Certificate',
    shortLabel: 'Supplier Proof (ACTION REQUIRED)',
    status: 'MISSING_ACTION_REQUIRED',
    provenance: 'MISSING',
    statutoryRef: 'CGST Sec 16(2)(c)',
    x: 540,
    y: 70,
    properties: {
      'Status': 'MISSING — Action Required',
      'Statutory Condition': 'Tax paid to Government by supplier under Section 16(2)(c)',
      'Action Required': 'Request GSTR-3B tax payment confirmation or CA Certificate with UDIN',
      'Legal Caveat': 'A supplier certificate is an administrative document, NOT conclusive proof of government treasury deposit.'
    }
  },
  {
    id: 'node_statute_16_2_aa',
    type: 'STATUTORY_GROUND',
    label: 'CGST Sec 16(2)(aa): GSTR-2B Mandatory Reflection',
    shortLabel: 'Sec 16(2)(aa) [Post-2022]',
    status: 'MISSING_ACTION_REQUIRED',
    provenance: 'STATUTORY_RULE',
    statutoryRef: 'CGST Sec 16(2)(aa) w.e.f. 01.01.2022',
    x: 540,
    y: 190,
    properties: {
      'Statutory Rule': 'Invoice must be communicated in GSTR-2B under Section 38',
      'Effective Date': '01.01.2022 (Finance Act, 2021)',
      'Circular 183 Applicability': 'NOT APPLICABLE to FY 2024-25 GSTR-2B differences'
    }
  },
  {
    id: 'node_draft_assertion',
    type: 'DRAFT_ASSERTION',
    label: 'Form ASMT-11 Formal Response Draft',
    shortLabel: 'Legal Reply (ASMT-11)',
    status: 'CONFIRMED',
    provenance: 'SYSTEM_GENERATED',
    statutoryRef: 'CGST Rule 99(2)',
    x: 540,
    y: 310,
    properties: {
      'Statutory Form': 'Form GST ASMT-11 under Rule 99(2)',
      'Prayer': 'Drop scrutiny proceedings under Section 61(2) upon reconciliation',
      'Factual Defense': 'Invoice possession, bank consideration, and subsequent supplier filing'
    }
  },
  {
    id: 'node_ca_review',
    type: 'REVIEW_DECISION',
    label: 'Chartered Accountant Review & UDIN Sign-Off',
    shortLabel: 'CA Review & UDIN Sign-Off',
    status: 'PENDING_REVIEW',
    provenance: 'UNVERIFIED',
    statutoryRef: 'ICAI Standards & Section 61',
    x: 770,
    y: 190,
    properties: {
      'Review Role': 'Chartered Accountant / Tax Practitioner',
      'Status': 'Pending Step 6 sign-off',
      'Legal Principle': 'CA sign-off provides professional certification but CANNOT convert missing source evidence into verified evidence.'
    }
  }
];

const DEFAULT_EDGES: GraphEdgeData[] = [
  { id: 'edge_allegation_invoices', source: 'node_allegation', target: 'node_invoices', relationship: 'ITEMIZED_UNDER' },
  { id: 'edge_invoices_bank', source: 'node_invoices', target: 'node_bank_utr', relationship: 'DISCHARGED_BY' },
  { id: 'edge_invoices_eway', source: 'node_invoices', target: 'node_eway_bills', relationship: 'DELIVERED_VIA' },
  { id: 'edge_invoices_supplier_proof', source: 'node_invoices', target: 'node_supplier_proof', relationship: 'SUBSTANTIATED_BY', isMissing: true },
  { id: 'edge_invoices_sec16_2_aa', source: 'node_invoices', target: 'node_statute_16_2_aa', relationship: 'GOVERNED_BY', isMissing: true },
  { id: 'edge_allegation_draft', source: 'node_allegation', target: 'node_draft_assertion', relationship: 'CITED_IN' },
  { id: 'edge_draft_ca_review', source: 'node_draft_assertion', target: 'node_ca_review', relationship: 'CERTIFIED_BY' }
];

export const EvidenceGraphViewer: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<GraphNodeData>(DEFAULT_NODES[0]);

  const getNodeColor = (node: GraphNodeData) => {
    switch (node.status) {
      case 'CONFIRMED':
      case 'VERIFIED':
        return {
          bg: '#E7F4EE',
          border: '#087F73',
          text: '#073B3A',
          icon: 'check_circle',
          badgeVariant: 'success' as const
        };
      case 'SYNTHETIC':
        return {
          bg: '#EFF6FF',
          border: '#3B82F6',
          text: '#1E40AF',
          icon: 'science',
          badgeVariant: 'neutral' as const
        };
      case 'PARTIAL':
        return {
          bg: '#FEF3C7',
          border: '#D97706',
          text: '#92400E',
          icon: 'incomplete_circle',
          badgeVariant: 'warning' as const
        };
      case 'MISSING_ACTION_REQUIRED':
        return {
          bg: '#FEF2F2',
          border: '#B91C1C',
          text: '#991B1B',
          icon: 'warning',
          badgeVariant: 'danger' as const
        };
      case 'PENDING_REVIEW':
        return {
          bg: '#F1F5F9',
          border: '#64748B',
          text: '#334155',
          icon: 'pending',
          badgeVariant: 'neutral' as const
        };
      default:
        return {
          bg: '#F8FAFC',
          border: '#94A3B8',
          text: '#475569',
          icon: 'help',
          badgeVariant: 'neutral' as const
        };
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Graph Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-card">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#087F73]">account_tree</span>
            <h3 className="font-headline text-base font-bold text-[#073B3A]">
              DHAAL Evidence Graph (DEG) — Directed Evidentiary Topology
            </h3>
          </div>
          <p className="text-xs text-[#687674] mt-0.5">
            Strict bipartite DAG mapping Notice Allegations $\to$ Invoices $\to$ Banking Vouchers $\to$ Section 16(2) Legs $\to$ Response Draft.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="neutral" size="md" className="font-mono bg-blue-50 text-blue-700 border-blue-200">
            ECI: 70% (Demo Completeness)
          </Badge>
          <Badge variant="warning" size="md">
            1 Action Required (Sec 16(2)(c))
          </Badge>
          <Badge variant="neutral" size="md">
            Demo UTR: SYNTHETIC
          </Badge>
        </div>
      </div>

      {/* Main Graph Grid (Canvas on left, Node Inspector on right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
        {/* Interactive SVG Canvas */}
        <Card variant="default" padding="none" className="lg:col-span-8 overflow-hidden bg-white border border-[#E2E8F0]">
          <div className="p-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#073B3A] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#087F73]">gesture</span>
              Click any node to inspect evidence provenance &amp; statutory grounding
            </span>
            <span className="text-[11px] font-mono text-[#687674]">
              DAG Schema v2.1.0 • Unique IDs Validated
            </span>
          </div>

          <div className="w-full overflow-x-auto p-4 flex items-center justify-center min-h-[420px] bg-[#FAFBFD]">
            <svg viewBox="0 0 920 420" className="w-full max-w-[920px] h-auto select-none">
              <defs>
                <marker
                  id="arrowhead-green"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#087F73" />
                </marker>
                <marker
                  id="arrowhead-amber"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#B45309" />
                </marker>
                <marker
                  id="arrowhead-blue"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#3B82F6" />
                </marker>
              </defs>

              {/* Render Directed Edges */}
              {DEFAULT_EDGES.map((edge) => {
                const sourceNode = DEFAULT_NODES.find((n) => n.id === edge.source);
                const targetNode = DEFAULT_NODES.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const isMissing = edge.isMissing;
                const strokeColor = isMissing ? '#B45309' : '#087F73';
                const markerId = isMissing ? 'url(#arrowhead-amber)' : 'url(#arrowhead-green)';

                return (
                  <g key={edge.id}>
                    <line
                      x1={sourceNode.x + 85}
                      y1={sourceNode.y + 25}
                      x2={targetNode.x - 5}
                      y2={targetNode.y + 25}
                      stroke={strokeColor}
                      strokeWidth={isMissing ? 1.5 : 2}
                      strokeDasharray={isMissing ? '4 3' : undefined}
                      markerEnd={markerId}
                    />
                    <text
                      x={(sourceNode.x + targetNode.x) / 2 + 35}
                      y={(sourceNode.y + targetNode.y) / 2 + 18}
                      fill={isMissing ? '#92400E' : '#687674'}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono tracking-tight"
                    >
                      {edge.relationship}
                    </text>
                  </g>
                );
              })}

              {/* Render Distinct Graph Nodes */}
              {DEFAULT_NODES.map((node) => {
                const isSelected = selectedNode.id === node.id;
                const { bg, border, text, icon } = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-transform hover:opacity-95"
                    transform={`translate(${node.x}, ${node.y})`}
                  >
                    {/* Node Card Box */}
                    <rect
                      x="0"
                      y="0"
                      width="170"
                      height="58"
                      rx="8"
                      fill={bg}
                      stroke={isSelected ? '#073B3A' : border}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      filter={isSelected ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' : undefined}
                    />

                    {/* Node Icon */}
                    <text
                      x="12"
                      y="26"
                      fontFamily="Material Symbols Outlined"
                      fontSize="16"
                      fill={text}
                    >
                      {icon}
                    </text>

                    {/* Node Short Label */}
                    <text
                      x="34"
                      y="24"
                      fill={text}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="Inter, sans-serif"
                    >
                      {node.shortLabel.length > 20 ? node.shortLabel.slice(0, 19) + '…' : node.shortLabel}
                    </text>

                    {/* Provenance Tag / Statutory Subtext */}
                    <text
                      x="12"
                      y="44"
                      fill="#687674"
                      fontSize="9"
                      fontFamily="Inter, sans-serif"
                    >
                      {node.statutoryRef}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        {/* Node Inspector Panel */}
        <Card variant="default" padding="md" className="lg:col-span-4 flex flex-col justify-between border border-[#E2E8F0]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#087F73]">
                Node Inspector
              </span>
              <div className="flex items-center gap-1.5">
                {selectedNode.provenance === 'SYNTHETIC' && (
                  <Badge variant="neutral" size="sm" className="bg-blue-50 text-blue-700 font-mono text-[9px]">
                    SYNTHETIC
                  </Badge>
                )}
                <Badge variant={getNodeColor(selectedNode).badgeVariant} size="sm">
                  {selectedNode.status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>

            <h4 className="font-headline text-base font-bold text-[#073B3A]">
              {selectedNode.label}
            </h4>
            <p className="text-xs text-[#087F73] font-semibold mt-0.5">
              Statutory Ground: {selectedNode.statutoryRef}
            </p>

            <div className="mt-4 space-y-2.5">
              {Object.entries(selectedNode.properties).map(([key, val]) => (
                <div key={key} className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                  <span className="block text-[10px] font-semibold uppercase text-[#687674]">
                    {key}
                  </span>
                  <span className="block text-xs font-mono font-bold text-[#073B3A] mt-0.5">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {selectedNode.status === 'SYNTHETIC' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-card">
              <span className="block text-xs font-bold text-blue-900 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">science</span>
                Demonstration Record
              </span>
              <p className="text-[11px] text-blue-800 mt-1">
                This record is populated for sandbox evaluation. Real-world statutory defense requires uploaded bank statements or GSTN returns.
              </p>
            </div>
          )}

          {selectedNode.status === 'MISSING_ACTION_REQUIRED' && (
            <div className="mt-4 p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-card">
              <span className="block text-xs font-bold text-[#991B1B] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">priority_high</span>
                Statutory Action Required
              </span>
              <p className="text-[11px] text-[#991B1B] mt-1">
                Section 16(2)(c) condition is unsatisfied. For FY 2024-25, request supplier amendment in subsequent GSTR-1 or DRC-03 tax-deposit receipt.
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Statutory ECI Disclaimer Footer */}
      <div className="p-3 bg-[#FAF9F5] border border-[#E4E9E5] rounded-card text-[11px] text-[#687674] leading-relaxed">
        <strong>Statutory Notice on Evidence Completeness Indicator (ECI):</strong> The ECI score measures whether required document categories and data fields exist in the case dossier. It DOES NOT represent a guarantee of GST compliance, legal entitlement to ITC, or prediction of a favorable adjudication by the proper officer under Section 61 or Section 74A.
      </div>
    </div>
  );
};
