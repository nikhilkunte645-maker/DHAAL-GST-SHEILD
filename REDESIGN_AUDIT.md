# DHAAL (ढाल) — Baseline Redesign & Quality Audit
**Document ID:** `REDESIGN_AUDIT.md`  
**Application:** DHAAL — GST Scrutiny Notice Shield (Form ASMT-10)  
**Repository:** `nikhilkunte645-maker/DHAAL-GST-SHEILD`  
**Branch:** `ui/declutter`  
**Audit Date:** November 2026  
**Auditor:** Principal Frontend Engineer, Senior UI Systems Architect & QA Specialist  

---

## 1. Executive Summary

A comprehensive baseline audit was conducted on **DHAAL (ढाल)**, an AI-powered GST Scrutiny Notice Shield designed to help Indian MSMEs, tax professionals, and Chartered Accountants respond effectively to GST Form ASMT-10 scrutiny notices.

The audit examined:
1. **Visual Hierarchy & Clutter**: High visual congestion, redundant cards, uncoordinated badge colors, and lack of vertical rhythm across the multi-step journey.
2. **Responsive Fragility & Layout Defects**: Viewport overflows on mobile (`390x844`) and tablet (`768x1024`), cramped touch targets (<44px), and inflexible desktop layouts.
3. **Multilingual & Font Rendering**: Matra clipping, uneven line-heights, and font fallback inconsistencies across Hindi (`hi`) and Marathi (`mr`).
4. **PDF Export Vulnerabilities**: Severe right-edge clipping on mobile exports, table clipping, and 1-page truncation dropping sections 4, 5, and 6.
5. **Functional Integrity**: State preservation across 6 primary steps, 4 demo states, and real-time backend API integration (`/api`).

---

## 2. Baseline Architecture & Inventory

### 2.1 Technology Stack Inventory
- **Framework:** React 18.2.0 + TypeScript 5.2.2 + Vite 5.4.21
- **Styling:** Tailwind CSS 3.4.13 + PostCSS + Autoprefixer
- **Icons:** Material Symbols Outlined (bundled WOFF/WOFF2 font families)
- **Typography:** Inter (Latin UI), Plus Jakarta Sans (Headings), JetBrains Mono (Financials/GSTIN), Noto Sans Devanagari (Hindi & Marathi)
- **PDF Generation:** jsPDF 2.5.2 + html2canvas 1.4.1
- **Testing:** Vitest 1.6.1 + Pytest 9.2.0 + Puppeteer 22.15.0 E2E Harness
- **Backend:** Python FastAPI (`backend/app.py`, Pydantic v2 schemas)

### 2.2 Component & Screen Inventory
| Screen / Component | File Path | Baseline Responsibility | Key Baseline Defect |
| :--- | :--- | :--- | :--- |
| **App Shell** | `src/App.tsx` | Layout wrapper, language switcher, demo bar, step navigation | Header overcrowded on mobile; step tabs wrapped awkwardly |
| **Step 1: Upload** | `src/screens/Screen1Upload.tsx` | Drag-and-drop zone, file validation, demo state triggers | Visual congestion, competing CTA colors |
| **Step 2: Confirm** | `src/screens/Screen2ConfirmPause.tsx` | Notice metadata extraction, 30-day pause protocol, discrepancy cards | Redundant metric badges, text overlap on mobile |
| **Step 3: Explain** | `src/screens/Screen3ExplainerDeadlines.tsx` | Plain-language explainer, timeline countdown, urgency slider | Urgency slider thumb/track < 44px tap target |
| **Step 4: Evidence** | `src/screens/Screen4EvidenceChecklist.tsx` | Evidentiary requirements, document status, missing items | Filter chips < 44px high; horizontal clipping |
| **Step 5: Draft** | `src/screens/Screen5DraftResponse.tsx` | Form DRC-06 response generator, tone selector, legal citations | Dual-pane split collapsed poorly on portrait tablets |
| **Step 6: Brief** | `src/screens/Screen6CaReadyBrief.tsx` | Final executive summary, evidentiary table, PDF export | Right-edge text clipping in PDF, multi-page truncation |

---

## 3. Detailed Baseline Audit Findings

### 3.1 Visual Congestion & Hierarchy (Severity: High)
- **Problem:** Every card had dense borders, high-contrast drop shadows, and saturated colored badges (red, amber, blue, emerald) competing for attention simultaneously.
- **Impact:** Taxpayers facing urgent scrutiny notices experienced cognitive overload rather than calm clarity.
- **Root Cause:** Absence of a centralized design token system with calm surface levels (`bg-slate-50`, `bg-white`, subtle borders `border-slate-200/80`).

### 3.2 Responsive Flaws & Mobile Touch Targets (Severity: High)
- **Problem:** Filter buttons on Screen 4 ("All Items", "Needs Action") and urgency presets on Screen 3 were rendered with `py-1` or `h-8` (~32px height), violating the WCAG 2.5.5 minimum 44x44px target standard.
- **Problem:** Executive summary header on Screen 6 had `flex justify-between items-center` with unwrapped flex items, pushing the `Amount questioned:` pill beyond the right boundary on viewports $\le 390\text{px}$.
- **Impact:** Failed mobile usability audits, horizontal scrollbars, and accidental tap errors.

### 3.3 Devanagari Typography & Matra Clipping (Severity: Medium)
- **Problem:** Hindi and Marathi script glyphs contain vertical conjuncts and vowel signs (*matras*) above the top headline (*shirorekha*) and below the baseline (e.g., *u*, *oo*, *ri* matras). Standard line-heights (`1.4`–`1.5`) caused upper and lower matras to collide with adjacent lines or get clipped inside containers with `overflow-hidden`.
- **Impact:** Degraded readability for regional Indian business owners.

### 3.4 PDF Export Breakdown (Severity: Critical)
- **Problem 1 (Mobile DOM Distortion):** `html2canvas(printableRef.current)` captured the live mobile DOM (390px width). When scaled onto an A4 page, tables were squished and illegible.
- **Problem 2 (Right-Edge Clipping):** Fixed sub-header flex layouts clipped the financial discrepancy badge.
- **Problem 3 (Single-Page Truncation):** The previous exporter inserted the entire rendered canvas as a single image on page 1. Since the content was ~393mm tall and A4 is 297mm, the bottom 96mm (sections 4, 5, and 6) disappeared completely.
- **Problem 4 (Orphaned Headers):** Page breaks sliced directly through table rows and signature blocks.

---

## 4. Functional Baseline Verification

Before initiating frontend redesign and decluttering passes, baseline tests were executed to ensure full functionality was captured:

| Test Suite | Command | Baseline Result | Status |
| :--- | :--- | :--- | :--- |
| **Frontend Unit Tests** | `npm test` | 12 tests passed | ✅ PASSED |
| **Backend Integration Tests** | `python -m pytest backend/` | 18 tests passed | ✅ PASSED |
| **TypeScript Typecheck** | `npx tsc --noEmit` | 0 errors | ✅ PASSED |
| **Vite Production Build** | `npm run build` | Dist assets bundled cleanly | ✅ PASSED |

**Conclusion:** The underlying functional logic, state store, and backend APIs were sound, but the UI presentation layer, responsive adaptability, Devanagari typography, and PDF export required structural engineering intervention.
