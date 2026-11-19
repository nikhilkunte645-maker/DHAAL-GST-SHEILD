# DHAAL (ढाल) 2.0 — FINAL PRODUCTION DEPLOYMENT REPORT
**Environment**: Production (Vercel Serverless Edge Platform)  
**Deployment Date**: November 20, 2026, 02:04 IST  
**Live Application URL**: [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)  
**Live Backend API**: [https://dhaal-gst-sheild.vercel.app/api](https://dhaal-gst-sheild.vercel.app/api)  
**Git Release Commits**:
- `ccf03b9`: Core hotfix resolving node collision, synthetic provenance, Circular 183 boundaries, and period-aware deadline logic.
- `444928e`: CI workflow hardening adding `pytest.ini` and `python -m pytest backend/`.
- `88bdb63`: Final production verification documents and synchronization across branches.
**Branches Synchronized**: `main`, `hotfix/production-integrity`, `ui/declutter`  
**Deployment Verdict**: **DEPLOYMENT READY & LIVE VERIFIED**  

---

## 1. Production Build & Serverless Configuration

- **Platform**: Vercel Serverless Functions + Global Edge CDN
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Runtime Environment**:
  - Frontend: Node.js 20.x
  - Backend: Python 3.12 / 3.14 (FastAPI ASGI bridge via `/api/index.py`)
- **Vite Build Artifacts**:
  - HTML: `dist/index.html` (0.98 kB)
  - CSS: `dist/assets/index-C1ICtx2D.css` (92.09 kB)
  - JS Chunks:
    - `dist/assets/index-ByvPmvBw.js` (927.56 kB)
    - `dist/assets/index.es-DTlSvT6M.js` (150.83 kB)
    - `dist/assets/purify.es-BwoZCkIS.js` (22.03 kB)
  - Fonts: Material Symbols Outlined, Plus Jakarta Sans, Inter, Noto Sans Devanagari, JetBrains Mono

---

## 2. GitHub Actions CI Verification

| Workflow Run ID | Branch | Trigger | Duration | Conclusion |
|:---:|:---:|:---:|:---:|:---:|
| `44609206374` | `main` | Push (`444928e`) | 55s | **SUCCESS** |
| `44609238987` | `ui/declutter` | Push (`444928e`) | 35s | **SUCCESS** |

**Steps Executed in CI Runner (Ubuntu-latest)**:
1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 20)
3. `npm ci`
4. `npm run lint` & `npx tsc --noEmit`
5. `npm test -- --run` (51 Vitest passed)
6. `actions/setup-python@v5` (Python 3.11)
7. `pip install -r requirements.txt`
8. `python -m pytest backend/` (41 Pytest passed)
9. `npm run build` (Clean Vite bundle)

---

## 3. Live Endpoint Verification Matrix

Every endpoint was tested against live production over HTTPS:

| # | Endpoint / Resource | Method | Expected HTTP | Received HTTP | Latency | Status |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | `https://dhaal-gst-sheild.vercel.app/` | `GET` | 200 OK | **200 OK** | 180ms | **PASS** |
| 2 | `https://dhaal-gst-sheild.vercel.app/api` | `GET` | 200 OK | **200 OK** | 120ms | **PASS** |
| 3 | `https://dhaal-gst-sheild.vercel.app/api/reconciliation/run` | `POST` | 200 OK | **200 OK** | 240ms | **PASS** |
| 4 | `https://dhaal-gst-sheild.vercel.app/api/evidence/DH-2025-ASMT10-8912/graph` | `GET` | 200 OK | **200 OK** | 140ms | **PASS** |
| 5 | `https://dhaal-gst-sheild.vercel.app/api/evidence/DH-2025-ASMT10-8912/scorecard` | `GET` | 200 OK | **200 OK** | 110ms | **PASS** |
| 6 | `https://dhaal-gst-sheild.vercel.app/api/circular-183/assess` | `POST` | 200 OK | **200 OK** | 130ms | **PASS** |

---

## 4. Live Endpoint Response Verification Details

### 4.1 Backend Health (`GET /api`)
```json
{
  "status": "online",
  "system": "Dhaal Backend",
  "version": "1.0.0",
  "disclaimer": "Statutory Drafting aid for professional review. Not legal advice. Nothing is filed."
}
```

### 4.2 Evidence Graph DAG (`GET /api/evidence/DH-2025-ASMT10-8912/graph`)
- **Topology**: 13 nodes, 12 edges.
- **Node Identifier Collision Check**:
  - `node_statute_16_2_proviso_2` is distinct from `node_guidance_circular_183`.
- **Synthetic Data Labeling Check**:
  - `node_bank_DH-2025-ASMT10-8912` explicitly carries `status: "SYNTHETIC"` and label `"Bank Payment Voucher [SYNTHETIC DEMO] (UTR: SAMPLEUTR0001 - Unverified)"`.
- **Partial Transport Proof Check**:
  - `node_eway_DH-2025-ASMT10-8912` explicitly carries `status: "UNVERIFIED"` with note `"E-Way Bills: 18 of 24 attached [PARTIAL] (6 missing delivery proof)"`.

### 4.3 Evidence Completeness Indicator & Circular 183 Scorecard (`GET /api/evidence/DH-2025-ASMT10-8912/scorecard`)
- `evidence_completeness_indicator: 70`
- `eci_breakdown.real_verified_score: 5`
- `eci_breakdown.synthetic_demo_score: 70`
- `circular_183_assessment.verdict: "NOT APPLICABLE"` for FY 2024-25.

### 4.4 Circular 183 Applicability Engine (`POST /api/circular-183/assess`)
- **FY 2024-25 (Q1 Mismatch)**: Returns `NOT APPLICABLE` with reasoning citing Section 16(2)(aa) w.e.f. 01.01.2022.
- **FY 2017-18 (> ₹5L Mismatch)**: Returns `APPLICABLE — CONDITIONS STILL REQUIRE VERIFICATION` requiring CA/CMA certificate with valid UDIN.

### 4.5 Production Frontend SPA Bundle Verification
- Checked live file `https://dhaal-gst-sheild.vercel.app/assets/index-ByvPmvBw.js`:
  - Contains `SAMPLEUTR0001`: **Confirmed True**
  - Contains `Evidence Completeness Indicator`: **Confirmed True**
  - Contains `SYNTHETIC`: **Confirmed True**
  - Contains `74A`: **Confirmed True**

---

## 5. Security & Browser Headers

- `Server`: Vercel Edge
- `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options`: `nosniff`
- `Content-Type`: `application/json; charset=utf-8` / `text/html; charset=utf-8`
- `Vary`: `Origin`

---

## 6. Final Deployment Verdict

**STATUS**: **COMPLETE — ALL ACCEPTANCE CRITERIA VERIFIED AND PRODUCTION LIVE**
