# DHAAL (ढाल) — Production Deployment & Operations Guide

This guide provides step-by-step instructions for deploying, updating, previewing, and rolling back DHAAL (ढाल) on Vercel and alternative hosting platforms.

---

## 1. Quick Summary: Architecture & Official URLs

- **Canonical Repository:** `https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD`
- **Official Production URL:** `https://dhaal-gst-sheild.vercel.app`
- **Production Backend Endpoint:** `https://dhaal-gst-sheild.vercel.app/api`
- **Frontend Architecture:** React 18 + Vite + TypeScript (Single Page Application)
- **Backend Architecture:** Python 3.11+ FastAPI Serverless Functions (`api/index.py`)
- **Hosting Model:** Unified single-project deployment on Vercel

---

## 2. Promoting Changes to Production (The Fast-Forward Merge)

Because Vercel is connected to GitHub and automatically deploys the `main` branch to production, updating the live site simply requires fast-forwarding `main` to the verified development branch (`ui/declutter`).

### Step-by-Step Promotion Commands:

Run the following commands in your terminal at `C:\Users\lucifer\DHAAL`:

```bash
# 1. Ensure you have the latest state on ui/declutter
git checkout ui/declutter

# 2. Switch to main
git checkout main

# 3. Fast-forward merge ui/declutter into main (zero conflicts)
git merge ui/declutter --ff-only

# 4. Push the updated main branch to GitHub
git push origin main
```

### What Happens Next (Automatic Deployment):
1. GitHub triggers the GitHub Actions CI workflow ([.github/workflows/ci.yml](file:///C:/Users/lucifer/DHAAL/.github/workflows/ci.yml)), running TypeScript type checks, Vitest tests, Vite production build, and Pytest backend tests.
2. Vercel automatically detects the push to `main`.
3. Vercel builds the frontend via `npm run build` into `dist/`.
4. Vercel packages the FastAPI backend from `api/index.py` using `requirements.txt`.
5. The live production URL `https://dhaal-gst-sheild.vercel.app` is updated within 45–90 seconds.

---

## 3. Preview Deployments for Feature Branches

Vercel provides automatic Preview Environments for all branches and Pull Requests:

1. When you push any branch other than `main` (for example, `git push origin ui/declutter`):
   - Vercel automatically creates a unique Preview URL (e.g., `https://dhaal-gst-sheild-git-ui-declutter-nikhilkunte645.vercel.app`).
   - The production URL `https://dhaal-gst-sheild.vercel.app` remains completely untouched.
2. You can test the live preview URL on mobile and desktop before merging into `main`.

---

## 4. Rollback Procedure

If a production deployment ever needs to be rolled back immediately:

### Option A: Instant Rollback via Vercel Dashboard (Fastest — 10 seconds)
1. Log in to [vercel.com](https://vercel.com).
2. Open the **DHAAL** project.
3. Navigate to the **Deployments** tab.
4. Locate the previous known-good deployment (e.g., commit `2f131ca` or any previous stable build).
5. Click the three dots (`...`) on the right side of the deployment row and select **Instant Rollback** (or **Promote to Production**).
6. Vercel instantly routes 100% of production traffic back to that build without rebuilding.

### Option B: Git Rollback via CLI
```bash
# Checkout main
git checkout main

# Revert the latest commit
git revert HEAD --no-edit

# Push to origin
git push origin main
```
Vercel will detect the push and deploy the reverted state automatically.

---

## 5. Local Development Setup

To run both the frontend and backend locally with live hot-reloading:

### Prerequisites:
- Node.js 18+ and npm
- Python 3.10+

### Step 1: Install Dependencies
```bash
# Install frontend packages
npm install

# Install backend Python packages
pip install -r requirements.txt
```

### Step 2: Start the Backend (Port 8001)
```bash
# Start FastAPI with Uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```
Verify the backend is live by opening `http://localhost:8001/api` in your browser.

### Step 3: Start the Frontend (Port 3001)
In a new terminal window:
```bash
npm run dev
```
Open `http://localhost:3001` in your browser. The frontend will automatically route API requests to `http://localhost:8001`.

---

## 6. Standalone Backend Deployment (Optional Alternative)

If you ever wish to decouple the Python FastAPI backend from Vercel (for instance, to host it on Render, Railway, or Fly.io):

1. **Procfile**: A production-ready [Procfile](file:///C:/Users/lucifer/DHAAL/Procfile) is provided in the root directory:
   ```
   web: uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8001}
   ```
2. **Deploy to Railway / Render**:
   - Connect repository `nikhilkunte645-maker/DHAAL-GST-SHEILD`.
   - Set Build Command: `pip install -r requirements.txt`.
   - Set Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.
3. **Configure Frontend**:
   - In your Vercel Project Settings, add the Environment Variable:
     `VITE_API_BASE_URL=https://your-custom-backend.up.railway.app`
   - Re-deploy the frontend. The SPA client will immediately send all `/api/*` traffic to your standalone backend.

---

## 7. Troubleshooting & Common Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Direct URL refresh returns 404** | Missing Single Page App rewrite rule | Verify that [vercel.json](file:///C:/Users/lucifer/DHAAL/vercel.json) contains `{"source": "/(.*)", "destination": "/index.html"}`. |
| **API calls return 404 in production** | Serverless route rewrite mismatch | Ensure [vercel.json](file:///C:/Users/lucifer/DHAAL/vercel.json) maps `/api/(.*)` to `/api/index.py`. |
| **CORS error in browser console** | Origin mismatch during local testing | [backend/main.py](file:///C:/Users/lucifer/DHAAL/backend/main.py) allows regex `https?://.*` and localhost ports `3000` and `3001`. Ensure your dev server runs on one of these ports. |
| **Vercel build fails on npm cache** | Linux environment permission conflict | Use the tuned install command in `vercel.json`: `env -u npm_config_cache_dir -u NPM_CONFIG_CACHE_DIR npm install`. |
| **PDF upload size exceeds limit** | Vercel Serverless payload cap | Notice uploads are streamed and limited to 4 MB for instant, reliable in-memory processing. |
