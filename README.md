<p align="center">
  <img src="DHAAL-github-header.jpg" alt="Dhaal Banner" width="100%">
</p>

# Dhaal (ढाल) - GST Scrutiny Notice Shield (Form ASMT-10)

> **Statutory drafting aid for professional review. Not legal advice.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-dhaal--gst--sheild.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://dhaal-gst-sheild.vercel.app)
[![Python FastAPI](https://img.shields.io/badge/Backend-FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React & Vite](https://img.shields.io/badge/Frontend-React_%2B_Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://vitejs.dev/)

---

## 🌟 Overview
**Dhaal (ढाल)** is an AI-powered full-stack web application engineered to assist businesses, taxpayers, and Chartered Accountants in reading, parsing, and analyzing GST Scrutiny Notices (Form ASMT-10) within minutes. It isolates questioned mismatches, performs deterministic mathematical checks, and generates audit-ready statutory replies.

---

## 🚀 Live Production & Walkthrough
* **Official Live Application:** [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)[cite: 6]
* **Judges' Walkthrough & Demo Guide:** [🎯 3-Minute Hackathon Demo Script](./DEMO.md)

---

## 🛠️ Technical Architecture & Tech Stack
Dhaal implements a modern decoupled architecture optimized for rapid serverless execution on Vercel:

* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
* **Backend:** Python, FastAPI, Pydantic, PyPDF / PDFPlumber for precise document parsing.
* **Deployment & Routing:** Unified serverless deployment on Vercel (`vercel.json` rewrites routing `/api/(.*)` directly to the Python FastAPI ASGI handler).

---

## ✨ Core Features & Workflow

1. **Notice Ingestion & Parsing:**
   * Upload PDF notices (Form ASMT-10) to automatically extract DIN (Document Identification Number), Reference IDs, taxable periods, and tax officer remarks.
2. **Deterministic Reconciliation Engine:**
   * Mathematically compares GSTR-3B vs GSTR-2B discrepancies and Input Tax Credit (ITC) claims with strict validation checks.
3. **Statutory Defense Generator:**
   * Automatically drafts formal, legally aligned replies referencing **Section 61 of the CGST Act** and **Rule 99(1)**.
4. **Bilingual Support & CA Briefs:**
   * Multi-language interface for seamless accessibility and structured audit summaries tailored for Chartered Accountants.

---

## 🔒 Security & Privacy Guarantees
* **Zero-Retention Sandbox:** Taxpayer data and sensitive financial documents are processed securely in memory without persisting records to long-term third-party storage.
* **Audit Readiness:** Generates structured logs and defensible replies mapped directly to compliance standards.

---

## 💻 Local Development Setup

To run the project locally for development or testing:

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD.git](https://github.com/nikhilkunte645-maker/DHAAL-GST-SHEILD.git)
   cd DHAAL-GST-SHEILD
