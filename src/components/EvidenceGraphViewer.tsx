import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export interface GraphNodeData {
  id: string;
  type: 'ALLEGATION' | 'INVOICE' | 'BANKING_PROOF' | 'EWAY_BILL' | 'SUPPLIER_PROOF' | 'STATUTORY_GROUND' | 'DRAFT_ASSERTION' | 'REVIEW_DECISION';
  label: string;
  shortLabel: string;
  status: 'CONFIRMED' | 'VERIFIED' | 'HYPOTHESIS' | 'MISSING_ACTION_REQUIRED' | 'PENDING_REVIEW';
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
    statutoryRef: 'CGST Sec 61 / Rule 99(1)',
    x: 60,
    y: 190,
    properties: {
      'Notice Reference': 'ZA270525008912M',
      'Questioned ITC': '₹1,84,250',
      'Tax Period': 'Apr-Jun 2024',
      'Issuing Office': 'Assistant Commissioner, Ward 102'
    }
  },
  {
    id: 'node_invoices',
    type: 'INVOICE',
    label: '24 Tax Invoices (M/s Apex Textiles)',
    shortLabel: '24 Invoices (₹10,23,611)',
    status: 'VERIFIED',
    statutoryRef: 'CGST Sec 16(2)(a)',
    x: 290,
    y: 80,
    properties: {
      'Invoice Count': 24,
      'Taxable Value': '₹10,23,611',
      'Tax Amount': '₹1,84,250',
      'Supplier GSTIN': '27XXXXX5678X1ZX',
      'Statutory Rule': 'Possession of Tax Invoice'
    }
  },
  {
    id: 'node_bank_utr',
    type: 'BANKING_PROOF',
    label: 'Bank RTGS Payment (HDFC Bank)',
    shortLabel: 'Bank UTR: SAMPLEUTR0001',
    status: 'VERIFIED',
    statutoryRef: 'CGST Sec 16(2) Proviso 2',
    x: 290,
    y: 200,
    properties: {
      'Bank Name': 'HDFC Bank Ltd',
      'UTR Number': 'SAMPLEUTR0001',
      'Statutory Window': 'Paid within 21 days (Statutory limit: 180 days)',
      'Consideration Paid': '100% Cleared via Account Payee'
    }
  },
  {
    id: 'node_eway_bills',
    type: 'EWAY_BILL',
    label: 'E-Way Bills & Consignment Challans',
    shortLabel: 'E-Way Bills (18 attached)',
    status: 'VERIFIED',
    statutoryRef: 'CGST Sec 16(2)(b)',
    x: 290,
    y: 320,
    properties: {
      'Attached Bills': '18 of 24',
      'Consignment Status': 'Physical receipt confirmed at registered godown',
      'Coverage': '75% E-Way Bill + 25% Local Transporter Bilty'
    }
  },
  {
    id: 'node_supplier_proof',
    type: 'SUPPLIER_PROOF',
    label: 'Supplier Tax Deposit / DRC-03 Proof',
    shortLabel: 'Supplier Proof (Action Required)',
    status: 'MISSING_ACTION_REQUIRED',
    statutoryRef: 'CGST Sec 16(2)(c) / Cir 183',
    x: 540,
    y: 80,
    properties: {
      'Status': 'Missing in initial GSTR-2B',
      'Action Required': 'Request GSTR-3B DRC-03 receipt or CA Declaration',
      'Legal Shield': 'CBIC Circular No. 183/15/2022-GST protects bona fide recipient',
      'Precedent': 'Madras HC in D.Y. Beathel Enterprises'
    }
  },
  {
    id: 'node_draft_assertion',
    type: 'DRAFT_ASSERTION',
    label: 'Form ASMT-11 Substantive Defense',
    shortLabel: 'Legal Reply Assertion',
    status: 'CONFIRMED',
    statutoryRef: 'CGST Rule 99(2)',
    x: 540,
    y: 240,
    properties: {
      'Prayer': 'Drop scrutiny proceedings under Section 61(2)',
      'Substantive Entitlement': 'All conditions of Sec 16(2) fulfilled by buyer',
      'Precedent Ground': 'Supreme Court in UOI v. Bharti Airtel Ltd'
    }
  },
  {
    id: 'node_ca_review',
    type: 'REVIEW_DECISION',
    label: 'Chartered Accountant Certification',
    shortLabel: 'CA Review & UDIN Sign-Off',
    status: 'PENDING_REVIEW',
    statutoryRef: 'ICAI UDIN Standard',
    x: 770,
    y: 190,
    properties: {
      'Assigned Role': 'Chartered Accountant / Fellow CA',
      'Review Status': 'Unlocked upon Step 6 review completion',
      'UDIN Requirement': 'Mandatory for official submission'
    }
  }
];

const DEFAULT_EDGES: GraphEdgeData[] = [
  { id: 'e1', source: 'node_allegation', target: 'node_invoices', relationship: 'ITEMIZED_UNDER' },
  { id: 'e2', source: 'node_invoices', target: 'node_bank_utr', relationship: 'DISCHARGED_BY' },
  { id: 'e3', source: 'node_invoices', target: 'node_eway_bills', relationship: 'DELIVERED_VIA' },
  { id: 'e4', source: 'node_invoices', target: 'node_supplier_proof', relationship: 'SUBSTANTIATED_BY', isMissing: true },
  { id: 'e5', source: 'node_bank_utr', target: 'node_draft_assertion', relationship: 'CITED_AS_EVIDENCE' },
  { id: 'e6', source: 'node_eway_bills', target: 'node_draft_assertion', relationship: 'CITED_AS_EVIDENCE' },
  { id: 'e7', source: 'node_supplier_proof', target: 'node_draft_assertion', relationship: 'REMEDIED_UNDER_CIR183', isMissing: true },
  { id: 'e8', source: 'node_draft_assertion', target: 'node_ca_review', relationship: 'CERTIFIED_BY' }
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
      case 'MISSING_ACTION_REQUIRED':
        return {
          bg: '#FEF3C7',
          border: '#B45309',
          text: '#92400E',
          icon: 'warning',
          badgeVariant: 'warning' as const
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
          bg: '#E0F2FE',
          border: '#0284C7',
          text: '#075985',
          icon: 'info',
          badgeVariant: 'brand' as const
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
            Cryptographic bipartite graph linking Notice Allegation $\to$ Invoices $\to$ Bank Proof $\to$ Section 16(2) Legs $\to$ Legal Reply.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand" size="md">
            88% Evidentiary Strength Score
          </Badge>
          <Badge variant="warning" size="md">
            1 Missing Statutory Link (Sec 16(2)(c))
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
              Click any node to inspect evidence provenance &amp; statutory ground
            </span>
            <span className="text-[11px] font-mono text-[#687674]">
              DAG Version: 2.0.1
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
              </defs>

              {/* Render Edges */}
              {DEFAULT_EDGES.map((edge) => {
                const srcNode = DEFAULT_NODES.find((n) => n.id === edge.source);
                const tgtNode = DEFAULT_NODES.find((n) => n.id === edge.target);
                if (!srcNode || !tgtNode) return null;

                const isMissing = edge.isMissing;
                const strokeColor = isMissing ? '#B45309' : '#087F73';
                const markerId = isMissing ? 'url(#arrowhead-amber)' : 'url(#arrowhead-green)';

                return (
                  <g key={edge.id}>
                    <line
                      x1={srcNode.x + 60}
                      y1={srcNode.y + 24}
                      x2={tgtNode.x - 10}
                      y2={tgtNode.y + 24}
                      stroke={strokeColor}
                      strokeWidth={isMissing ? 2 : 2.5}
                      strokeDasharray={isMissing ? '5,5' : 'none'}
                      markerEnd={markerId}
                    />
                    <text
                      x={(srcNode.x + tgtNode.x) / 2 + 25}
                      y={(srcNode.y + tgtNode.y) / 2 + 18}
                      fontSize="9"
                      fill={isMissing ? '#B45309' : '#687674'}
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                      className="font-semibold"
                    >
                      {edge.relationship}
                    </text>
                  </g>
                );
              })}

              {/* Render Nodes */}
              {DEFAULT_NODES.map((node) => {
                const isSelected = selectedNode.id === node.id;
                const colors = getNodeColor(node);

                return (
                  <g
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer transition-transform hover:scale-105"
                  >
                    {/* Node Box */}
                    <rect
                      x={node.x - 10}
                      y={node.y}
                      width={140}
                      height={50}
                      rx={8}
                      fill={colors.bg}
                      stroke={isSelected ? '#073B3A' : colors.border}
                      strokeWidth={isSelected ? 3 : 1.5}
                      filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                    />

                    {/* Node Icon & Status Indicator */}
                    <circle
                      cx={node.x + 6}
                      cy={node.y + 16}
                      r={6}
                      fill={colors.border}
                    />

                    {/* Node Text */}
                    <text
                      x={node.x + 18}
                      y={node.y + 20}
                      fontSize="10.5"
                      fontWeight="bold"
                      fill={colors.text}
                      fontFamily="Plus Jakarta Sans, sans-serif"
                    >
                      {node.shortLabel}
                    </text>

                    <text
                      x={node.x + 18}
                      y={node.y + 36}
                      fontSize="9"
                      fill="#687674"
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
              <Badge variant={getNodeColor(selectedNode).badgeVariant} size="sm">
                {selectedNode.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <h4 className="font-headline text-base font-bold text-[#073B3A]">
              {selectedNode.label}
            </h4>
            <p className="text-xs text-[#087F73] font-semibold mt-0.5">
              Statutory Basis: {selectedNode.statutoryRef}
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

          {selectedNode.status === 'MISSING_ACTION_REQUIRED' && (
            <div className="mt-4 p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-card">
              <span className="block text-xs font-bold text-[#92400E] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">priority_high</span>
                Evidentiary Remedy Available
              </span>
              <p className="text-[11px] text-[#92400E] mt-1">
                Under CBIC Circular 183/15/2022-GST, this discrepancy is non-fatal if supplier furnishes subsequent DRC-03 or CA Certificate.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
