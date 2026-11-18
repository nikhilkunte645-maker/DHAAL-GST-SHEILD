<p align="center">
  <img src="DHAAL-github-header.jpg" alt="Dhaal Banner" width="100%">
</p>

# Dhaal (ढाल) - GST Scrutiny Notice Shield (Form ASMT-10)

> **Statutory drafting aid for professional review. Not legal advice.**

Dhaal is an AI-powered full-stack web application designed to help businesses and Chartered Accountants read, parse, and analyze GST Scrutiny Notices (Form ASMT-10) within minutes, isolating questioned mismatches and generating audit-ready replies.

---

## 🚀 Live Production URL & Demo
* **Official Live Application:** [https://dhaal-gst-sheild.vercel.app](https://dhaal-gst-sheild.vercel.app)
* **Judges' Walkthrough Guide:** [🎯 3-Minute Hackathon Demo Script](./DEMO.md)

---

## 🛠️ Tech Stack & Architecture
* **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
* **Backend:** Python, FastAPI, Pydantic, PyPDF
* **Deployment Architecture:** Unified Serverless Deployment on Vercel (/api rewrites routing directly to Python FastAPI handler)

---

## ✨ Key Features
1. **Notice Ingestion & Parsing:** Upload PDF notices to automatically extract DIN, Reference numbers, and tax periods.
2. **Reconciliation Engine:** Compares GSTR-3B vs GSTR-2B mismatches with deterministic mathematical checks.
3. **Statutory Defense Generator:** Drafts formal replies referencing Section 61 CGST Act and Rule 99(1).
4. **Bilingual Support:** Multi-language interface for seamless accessibility.

---
*Built with precision for seamless tax compliance and audit automation.*
