# DHAAL (ढाल) — UI Redesign & Architecture Plan
**Document ID:** `UI_REDESIGN_PLAN.md`  
**Application:** DHAAL — GST Scrutiny Notice Shield (Form ASMT-10)  
**Repository:** `nikhilkunte645-maker/DHAAL-GST-SHEILD`  
**Branch:** `ui/declutter`  
**Date:** November 2026  
**Author:** Principal UI/UX Architect, Senior Design Systems Engineer & Full-Stack Specialist  

---

## 1. Design System Specification

The redesigned UI establishes a calm, high-trust, authoritative design language tailored for Indian financial compliance, balancing professional clarity with modern SaaS aesthetics.

### 1.1 Color Palette & Semantic Tokens
- **Primary Navy (Authority & Structure):**  
  - `navy-950`: `#0a1628` (Deep document canvas)  
  - `navy-900`: `#0f2038` (Headers, brand accent)  
  - `navy-800`: `#1e3a5f` (Primary text, active tabs)  
  - `navy-700`: `#2c5282` (Borders, secondary accents)  
  - `navy-50`: `#f0f5fa` (Active card highlights)
- **Neutral Slate (Backgrounds & Surfaces):**  
  - `slate-900`: `#0f172a` (Primary typography)  
  - `slate-700`: `#334155` (Body text)  
  - `slate-500`: `#64748b` (Muted labels, metadata)  
  - `slate-200`: `#e2e8f0` (Subtle borders)  
  - `slate-100`: `#f1f5f9` (Subtle card fills)  
  - `slate-50`: `#f8fafc` (Page background)
- **Functional Semantics:**  
  - **Success / Matched:** Emerald (`emerald-600`, `emerald-50`, `emerald-200`)  
  - **Warning / Action Needed:** Amber (`amber-600`, `amber-50`, `amber-200`)  
  - **Critical / Deadline / Discrepancy:** Crimson/Rose (`rose-600`, `rose-50`, `rose-200`)  
  - **Statutory / Informational:** Royal Indigo (`indigo-600`, `indigo-50`, `indigo-200`)

### 1.2 Typography System
- **Heading Font:** `Plus Jakarta Sans`, sans-serif (Weights: 600, 700)
- **Body & Interface Font:** `Inter`, -apple-system, BlinkMacSystemFont, sans-serif (Weights: 400, 500, 600)
- **Data, Figures & GSTIN:** `JetBrains Mono`, monospace (Tabular figures, zero ambiguity between 0/O and 1/I)
- **Devanagari Font:** `Noto Sans Devanagari`, sans-serif
  - Configured with strict line-height multiplier $\ge 1.75$ (`line-height: 1.75 !important`) to prevent matra clipping.

### 1.3 Spacing, Borders & Elevation
- **Spacing Scale:** Standard 4px / 8px / 12px / 16px / 24px / 32px / 48px grid
- **Border Radius:** `rounded-lg` (8px) for buttons/badges, `rounded-xl` (12px) for cards, `rounded-2xl` (16px) for modals
- **Elevation:** Flat surfaces with subtle borders (`border border-slate-200/80`); zero heavy multi-layered drop shadows.

---

## 2. Responsive Layout Blueprints

### 2.1 Viewport Breakpoints
- **Mobile (`390px - 639px`):** Single-column stacked layouts, sticky step indicator with horizontal overflow scroll, 44px minimum touch targets, collapsible drawers for secondary actions.
- **Tablet (`640px - 1023px`):** Flexible grid layouts, 2-column discrepancy cards, condensed step progress bar, horizontal overflow containment.
- **Desktop & Widescreen (`1024px - 1920px+`):** Max-width container (`max-w-7xl mx-auto`), dual-pane editor layouts (Screen 5), multi-column evidentiary cards, high scannability.

### 2.2 Wireframe Layout Patterns

```
+-------------------------------------------------------------------------+
| HEADER: Logo (ढाल) | Step Progress (1->6) | Lang (EN/HI/MR) | Reset Demo|
+-------------------------------------------------------------------------+
| HERO CONTEXT: Step Title, Calm Subtitle & Statutory Badge (ASMT-10)    |
+-------------------------------------------------------------------------+
| MAIN CONTENT AREA:                                                      |
|   Desktop: 2-Column Split (Primary Work Area + Contextual Sidebar)       |
|   Mobile:  Single Stacked Flow (Card 1 -> Card 2 -> Bottom Action Bar)  |
+-------------------------------------------------------------------------+
| FOOTER / ACTION BAR: Prev Step Button | Primary Next Step CTA (>=44px)  |
+-------------------------------------------------------------------------+
```

---

## 3. Screen-by-Screen Redesign Strategy

### 3.1 App Shell (`src/App.tsx`)
- **Action:** Streamline global header. Collapse step progress bar into a horizontal scrolling chip track on mobile (`overflow-x-auto no-scrollbar`).
- **Touch Targets:** Ensure language buttons, reset demo button, and step buttons have `min-h-[44px]` or padded tap boundaries.

### 3.2 Step 1: Upload Notice (`Screen1Upload.tsx`)
- **Action:** Convert upload zone into a calm, centered hero card. Provide instant visual cues for accepted formats (PDF, JPG, PNG $\le 10\text{MB}$).
- **Demo States:** Place demo notice triggers ("Sample Notice", "Blurry Photo", "Wrong Form") in a clean segmented controller below the drop zone.

### 3.3 Step 2: Confirm & 30-Day Pause Protocol (`Screen2ConfirmPause.tsx`)
- **Action:** Emphasize the statutory 30-day pause protocol under Rule 99(1). Display extracted notice metadata (GSTIN, DIN, Notice ID, Financial Year) in clean tabular metadata cells.
- **Responsive:** Ensure discrepancy cards stack cleanly without badge overlapping on narrow viewports.

### 3.4 Step 3: Plain Explainer & Timeline Countdown (`Screen3ExplainerDeadlines.tsx`)
- **Action:** Replace dense legal jargon with structured layperson explanations.
- **Interactive Component:** Urgency slider track and preset buttons configured to standard `min-h-[44px] h-[44px]` tap targets on mobile.

### 3.5 Step 4: Evidentiary Checklist (`Screen4EvidenceChecklist.tsx`)
- **Action:** Categorize documents by discrepancy type (ITC mismatch, GSTR-1 vs 3B difference, supplier cancellation).
- **Responsive:** Expand category filter buttons ("All", "Missing", "Ready") to `min-h-[44px]` on mobile.

### 3.6 Step 5: Draft Response Generator (`Screen5DraftResponse.tsx`)
- **Action:** Dual-pane layout on desktop: Left pane for tone selection (Formal, Conciliatory, Firm) and legal grounding; Right pane for live editable Form DRC-06 response text.
- **Responsive:** Stack into tabs or sequential cards on screens $< 1024\text{px}$.

### 3.7 Step 6: CA-Ready Audit Dossier & Multi-Page PDF (`Screen6CaReadyBrief.tsx`)
- **Action:** Executive summary card, evidentiary cross-reference table, pre-filing verification checklist, and direct CA download button.
- **PDF Architecture:** Implement an off-screen clone pipeline rendering fixed 794px desktop width at 2x scale, splitting into discrete A4 pages with running headers, footers, and page numbers.
- **Right-Edge Fix:** Add `flex-col sm:flex-row justify-between gap-2` to Executive Summary sub-header and `shrink-0` on financial badges.

---

## 4. Implementation Phasing & Risk Assessment

| Phase | Focus Area | Key Risk | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Design Tokens & Global CSS | Global regression in typography | Test across all 3 language tags (`en`, `hi`, `mr`) |
| **Phase 2** | Responsive Touch Targets | Breaking existing button click handlers | Wrap in flex/grid containers with `min-h-[44px]` |
| **Phase 3** | Screen 1–5 Decluttering | Dropping notice metadata | Preserve 100% of state store and backend props |
| **Phase 4** | Screen 6 PDF Overhaul | Mobile DOM capture blur / clipping | Off-screen 794px clone, font-ready gating |
| **Phase 5** | Multi-Viewport QA | Unnoticed horizontal overflow | Automated Puppeteer scan of 7 viewports |

---

## 5. Verification Methodology

Every modification must satisfy the **Six Strict Verification Gates**:
1. `npm test`: 12/12 unit tests pass.
2. `python -m pytest backend/`: 18/18 API tests pass.
3. `npx tsc --noEmit`: 0 TypeScript compilation errors.
4. `npm run build`: Production bundle builds under 6 seconds with 0 warnings.
5. `scripts/test_pdf_and_verification.js`: Real PDF generation in EN, HI, MR (multi-page A4, 0 right-edge clipping).
6. 7 Viewport Overflow Audit: `scrollWidth <= innerWidth` across 1920x1080, 1536x864, 1440x900, 1366x768, 1024x768, 768x1024, 390x844.
