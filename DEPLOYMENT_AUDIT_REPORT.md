# DHAAL (ढाल) — Complete Deployment & Infrastructure Audit Report

**Date**: 20-November-2026  
**Auditor**: Principal Full-Stack & DevOps Reliability Engineer  
**Canonical Repository**: [https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD](https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD)  
**Production Frontend URL**: [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)  
**Production Backend URL**: [https://dhaal-gst-sheild.vercel.app/api](https://dhaal-gst-sheild.vercel.app/api)  
**Status**: Comprehensive Audit Complete • Root Cause Identified • Action Plan Ready

---

## 1. Executive Summary & Root Cause Analysis

### The Root Cause of the Stale Production Website
The live production website at `https://dhaal-gst-sheild.vercel.app` was serving an outdated build (commit `2f131ca` from Nov 19, 2026 ~08:29 UTC) because of **Git branch decoupling**:
1. **Production Branch on Vercel**: Vercel is connected to GitHub repository `nikhilkunte645-maker/DHAAL-GST-SHEILD` and configured to deploy production automatically from the default branch `main`.
2. **Branch Divergence**:
   - `origin/main` was pinned at commit `2f131ca`.
   - All subsequent major engineering work—including the new Welcome & Case Intelligence Dashboard, brand logo and color system, 24-invoice itemized audit, multi-page A4 PDF export fixes, mobile touch target repairs, and Pydantic v2 deprecation fixes—was committed to branch `ui/declutter` (16 commits ahead of `main`).
   - Because `ui/declutter` was never merged into `main`, Vercel's automated production deployment on `main` was never triggered.
3. **Linear Fast-Forward Compatibility**:
   - Branch `ui/declutter` was branched directly off `main` at `2f131ca`.
   - `git merge-base main ui/declutter` confirmed `2f131caef5f1178a71d9a6b56cdcf2c90483cfad` as the exact merge base with **zero divergence and zero conflicts**.
   - Merging `ui/declutter` into `main` is a 100% clean, linear fast-forward that immediately enables Vercel to build and serve the latest product.

---

## 2. Infrastructure & Hosting Discovery Matrix

| Component | Platform | Discovered Configuration | Status / Finding | Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Canonical Repo** | GitHub | `nikhilkunte645-maker/DHAAL-GST-SHEILD` | Active, single remote `origin` | Retain as single source of truth |
| **Active Dev Branch** | Git Local | `ui/declutter` (16 commits ahead of `main`) | Contains all latest verified code | Merge to `main` upon user approval |
| **Production Branch** | GitHub | `main` (commit `2f131ca`) | Stale by 16 commits | Fast-forward to `ui/declutter` |
| **Frontend Host** | Vercel | Connected to GitHub `main` branch | Serves static SPA bundle (`dist`) | Automatic deploy upon `main` push |
| **Backend Host** | Vercel | Python Serverless Function (`api/index.py`) | **Active & Online** at `/api` | Retain unified Vercel architecture |
| **Alternative Host** | Netlify | `netlify.toml` present in root | **404 Not Found**; obsolete | Mark as legacy/unused |
| **Alternative Host** | Render/Railway | `Procfile` present (`uvicorn backend.main:app`) | Standalone alternative | Retain for optional container hosting |

---

## 3. Detailed Component Audit

### A. GitHub Repository & Git Tree
- **Remote Origin**: `https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD.git`
- **Tracked Remotes**: Single remote `origin`. No competing or split remotes exist.
- **Branch Inventory**:
  - `main` (`2f131ca`): Default production branch on GitHub.
  - `ui/declutter` (`d51bc90`): Working feature branch with 16 commits ahead of `main`. Contains full brand identity, Welcome Intelligence Dashboard, 24-invoice itemized audit, Pydantic v2 fixes, and verified A4 PDF export.
  - `hackathon-polish` & `repo-polish`: Historical feature branches merged into `main` prior to `2f131ca`.
- **Working Tree**: Clean. Untracked snapshot `PROJECT_STATUS_REPORT.txt` preserved without modification.

### B. Vercel Hosting Architecture
- **Unified Single-Project Architecture**:
  - Dhaal utilizes Vercel's native hybrid monorepo deployment:
    - **Frontend**: React 18 + Vite 5 built into `dist/` via `npm run build`.
    - **Backend**: FastAPI running inside Python 3.11+ Serverless Runtime via `api/index.py` with rewrite rule `{"source": "/api/(.*)", "destination": "/api/index.py"}`.
  - **SPA Routing**: Single Page Application rewrite `{"source": "/(.*)", "destination": "/index.html"}` prevents 404 errors on deep links and browser refreshes.
  - **Live Verification**:
    - `curl -I https://dhaal-gst-sheild.vercel.app` -> `HTTP/1.1 200 OK` (Vercel edge cache active).
    - `curl -s https://dhaal-gst-sheild.vercel.app/api` -> `{"status":"online","system":"Dhaal Backend","version":"1.0.0",...}` (FastAPI serverless active).
    - `curl -s https://dhaal-gst-sheild.vercel.app/api/explain/en` -> `{"title":"Understanding Form ASMT-10",...}` (Dynamic endpoint active).

### C. Frontend API Connectivity & Routing
- **Central API Client**: [src/mockApi.ts](file:///C:/Users/lucifer/DHAAL/src/mockApi.ts)
- **Base URL Resolution Logic**:
  ```typescript
  export const API_BASE_URL = rawEnvBase
    ? rawEnvBase.replace(/\/+$/, '')
    : isLocal
    ? 'http://localhost:8001'
    : '';
  ```
  - **Local Development**: Targets `http://localhost:8001` automatically when `window.location.hostname` is `localhost` or `127.0.0.1`.
  - **Production (Vercel)**: When `VITE_API_BASE_URL` is unset in production, `API_BASE_URL` resolves to `""` (empty string). All requests cleanly target same-origin `/api/...` routes (`/api/notice/upload`, `/api/verify/draft`, etc.).
  - **Zero Cross-Origin Friction**: Because both frontend and backend share the domain `https://dhaal-gst-sheild.vercel.app`, no CORS preflight latency or third-party cookie restrictions occur.

### D. Backend FastAPI Configuration
- **Entry Points**:
  - Standalone/Local: [backend/main.py](file:///C:/Users/lucifer/DHAAL/backend/main.py) (`uvicorn backend.main:app --host 0.0.0.0 --port 8001`)
  - Serverless Bridge: [api/index.py](file:///C:/Users/lucifer/DHAAL/api/index.py) (`from backend.main import app`)
- **Health Checks**: Responds with HTTP 200 at `/`, `/api`, and `/api/`.
- **CORS Policy**: Configured with permissive `allow_origin_regex=r"https?://.*"` and explicit localhost development ports (`3000`, `3001`).
- **Dependencies**: Synchronized in [requirements.txt](file:///C:/Users/lucifer/DHAAL/requirements.txt), [backend/requirements.txt](file:///C:/Users/lucifer/DHAAL/backend/requirements.txt), and [api/requirements.txt](file:///C:/Users/lucifer/DHAAL/api/requirements.txt).

### E. Netlify Status (Obsolete)
- `netlify.toml` specifies `publish = "dist"` and a basic redirect.
- Testing `https://dhaal-gst-sheild.netlify.app` returned `HTTP 404 Not Found`.
- Netlify cannot execute the Python FastAPI serverless code without non-standard serverless packaging.
- **Finding**: Netlify is an unused legacy configuration. Vercel is the sole canonical production host.

---

## 4. Recommended Target Architecture

```
                    GitHub Canonical Repository
          (https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD)
                                     |
                                     | Push to 'main'
                                     v
                          Vercel Unified Platform
                    (https://dhaal-gst-sheild.vercel.app)
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
     Frontend Static Edge                      Python Serverless Engine
         (Vite React SPA)                         (FastAPI /api/*)
               |                                           |
               +---------------------+---------------------+
                                     |
                                     v
                          Client Browser Experience
```

### Advantages of the Unified Architecture:
1. **Single Source of Truth**: One GitHub repo, one Vercel project, one production domain.
2. **Zero-Latency Same-Origin API**: No separate backend domain needed; `/api` calls resolve instantly via internal serverless routing.
3. **Automated Preview Deployments**: Every pull request or branch push to Vercel automatically deploys an isolated preview URL testing both frontend and backend changes.
4. **Zero Hosting Cost**: Free-tier serverless execution on Vercel with automatic horizontal scaling and zero maintenance.

---

## 5. Security & Environment Variable Policy

1. **Frontend (`VITE_API_BASE_URL`)**:
   - Optional. If unset, frontend automatically falls back to same-origin relative paths `/api/...` in production, and `http://localhost:8001` on localhost.
2. **Backend (`PORT`, `UV_LINK_MODE`)**:
   - `PORT`: Configured in `Procfile` / local runner (defaults to 8001).
   - `UV_LINK_MODE`: Set to `copy` in `vercel.json` to prevent hardlink failures in serverless containers.
3. **Secrets & Credentials**:
   - Dhaal processes GST notices entirely in-memory using deterministic parsing and statutory reconciliation rules.
   - **No external database credentials, proprietary API keys, or cloud storage tokens are required or bundled in client code.**
   - All `.env*` files (except `.env.example`) are strictly git-ignored via `.gitignore`.
