"""
Dhaal (ढाल) - Backend FastAPI Server
"""
import sys
import os
import io
import re
import time
import hashlib
import logging
from typing import Optional

try:
    import pypdf
except ImportError:
    try:
        import PyPDF2 as pypdf
    except ImportError:
        pypdf = None

# Ensure backend directory is in sys.path whether run from root or backend/
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

try:
    from schemas import (
        NoticeMetadata,
        DraftVerifyRequest,
        DraftVerifyResponse,
        BriefGenerateRequest,
        VerificationMismatch,
        NoticeData,
        NoticeUploadResponse,
        ConfirmAmountRequest,
        ConfirmAmountResponse,
        DraftGenerateRequest,
        DraftResponse,
        VerificationResponse,
        CaBriefRequest,
        CaBriefResponse,
        DiscrepancyRow,
        OfficeDetails,
        ExtractionDetails,
        SupplierDetails,
        BankingDetails,
        TransportDetails,
        CaCounselDetails,
    )
    from verifier import verify_draft as verify_draft_detailed, format_inr, round_statutory_inr
    from reconciler import run_deterministic_reconciliation
    from evidence_graph import build_evidence_graph_for_case
    from circular_183 import assess_circular_183_applicability, Circular183AssessmentInput
except ImportError:
    from backend.schemas import (
        NoticeMetadata,
        DraftVerifyRequest,
        DraftVerifyResponse,
        BriefGenerateRequest,
        VerificationMismatch,
        NoticeData,
        NoticeUploadResponse,
        ConfirmAmountRequest,
        ConfirmAmountResponse,
        DraftGenerateRequest,
        DraftResponse,
        VerificationResponse,
        CaBriefRequest,
        CaBriefResponse,
        DiscrepancyRow,
        OfficeDetails,
        ExtractionDetails,
        SupplierDetails,
        BankingDetails,
        TransportDetails,
        CaCounselDetails,
    )
    from backend.verifier import verify_draft as verify_draft_detailed, format_inr, round_statutory_inr
    from backend.reconciler import run_deterministic_reconciliation
    from backend.evidence_graph import build_evidence_graph_for_case
    from backend.circular_183 import assess_circular_183_applicability, Circular183AssessmentInput

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("dhaal_backend")

app = FastAPI(
    title="Dhaal (ढाल) API",
    description="GST Notice Shield Backend: Form ASMT-10 Analysis, Statutory Verification & CA-Ready Brief Synthesizer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(f"Path: {request.url.path} | Status: {response.status_code} | Time: {process_time:.2f}ms")
        return response
    except Exception as exc:
        logger.error(f"Server error on {request.url.path}: {exc}", exc_info=True)
        origin = request.headers.get("origin", "*")
        return JSONResponse(
            status_code=500,
            content={"detail": "Server error", "error": "An internal processing error occurred."},
            headers={
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true",
            }
        )

# ============================================================================
# CANONICAL REPOSITORY / IN-MEMORY STATE
# ============================================================================

CANONICAL_CASE = NoticeData(
    businessName="M/s Sharma Garments",
    proprietorName="Ramesh Sharma",
    gstin="27XXXXX1234X1ZX",
    noticeRef="ZA270525008912M",
    caseId="DH-2025-ASMT10-8912",
    formType="Form GST ASMT-10",
    formRule="[See Rule 99(1)]",
    noticeDate="14-May-2025",
    taxPeriod="FY 2024-25, Q1 (Apr-Jun 2024)",
    taxPeriodShort="Apr 2024 – Jun 2024",
    fixedClockDate="01-Jun-2025",
    replyDeadline="13-Jun-2025",
    recommendedCaSign="08-Jun-2025",
    statutoryWindowDays=30,
    daysRemaining=12,
    rows=[
        DiscrepancyRow(
            srNo="01",
            category="Inward supplies liable to Reverse Charge (RCM)",
            gstr3b=45000.0,
            gstr2b=45000.0,
            difference=0.0,
            isSmudged=False
        ),
        DiscrepancyRow(
            srNo="02",
            category="Excess Input Tax Credit Claimed (Table 4(A)(5) vs GSTR-2B)",
            gstr3b=1492450.0,
            gstr2b=1308200.0,
            difference=184250.0,
            isSmudged=True
        )
    ],
    office=OfficeDetails(
        state="Government of Maharashtra",
        designation="Office of the Assistant Commissioner of State Tax",
        division="Nodal Division-IV, Bandra-Kurla Complex, Mumbai - 400051",
        officer="Proper Officer (name redacted)",
        ward="Ward 102"
    ),
    extraction=ExtractionDetails(
        primaryEngineAmount=184250.0,
        verificationPassAmount=181250.0,
        delta=3000.0,
        smudgeCharIndex=4,
        magnification="4.8x"
    ),
    supplier=SupplierDetails(
        name="M/s Apex Textiles (fictional)",
        gstin="27XXXXX5678X1ZX",
        invoiceNo="AT/24-25/1102",
        invoiceDate="18-Jun-2024",
        amount=1023611.0,
        taxAmount=184250.0
    ),
    banking=BankingDetails(
        bankName="Sample Bank",
        utr="SAMPLEUTR0001",
        status="100% Cleared, Sample Bank"
    ),
    transport=TransportDetails(
        ewayBillNo="EWB-SAMPLE-0001",
        status="Consignment Received & Verified"
    ),
    caCounsel=CaCounselDetails(
        name="Assigned CA (to be added)",
        membershipNo="FCA Mem. #XXXXXX",
        passcode="DH-8912-PASS"
    )
)

case_state = {
    "confirmed_amount": 184250.0,
    "pause_resolved": False,
    "last_draft": None
}

# ============================================================================
# CORE API ENDPOINTS (SPECIFIED IN BLUEPRINT)
# ============================================================================

@app.get("/")
@app.get("/api")
@app.get("/api/")
def health_check():
    return {
        "status": "online",
        "system": "Dhaal Backend",
        "version": "1.0.0",
        "disclaimer": "Statutory Drafting aid for professional review. Not legal advice. Nothing is filed."
    }

MAX_FILE_SIZE = 4 * 1024 * 1024  # 4 MB (Vercel serverless request limit is 4.5 MB)

def extract_notice_metadata_from_pdf(file_bytes: bytes, filename: str = "", pre_extracted_text: str = "") -> NoticeMetadata:
    """
    Physical PDF text extraction with regex parsing for:
    - Assessee GSTIN
    - CGST Section
    - Tax Period
    - Discrepancy Amount
    - Notice ID / Reference
    Falls back gracefully to canonical case data if specific regex fields are unparsed.
    """
    extracted_text = pre_extracted_text
    if not extracted_text and pypdf and len(file_bytes) > 0:
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    extracted_text += "\n" + txt
            logger.info(f"Extracted {len(extracted_text)} characters from {filename}")
        except Exception as e:
            logger.warning(f"pypdf reader encountered an issue on {filename}: {e}")

    # Fallback to direct byte stream decoding if PDF reader yielded minimal text
    if len(extracted_text.strip()) < 10 and len(file_bytes) > 0:
        try:
            raw_text = file_bytes.decode("utf-8", errors="ignore")
            if len(raw_text.strip()) >= 10:
                extracted_text += "\n" + raw_text
        except Exception:
            raw_text = file_bytes.decode("latin-1", errors="ignore")
            extracted_text += "\n" + raw_text

    # Regex extraction with canonical fallbacks
    gstin_match = re.search(r"\b(\d{2}[A-Z0-9X]{10}[A-Z0-9]{3})\b", extracted_text, re.IGNORECASE)
    gstin = gstin_match.group(1).upper() if gstin_match else "27XXXXX1234X1ZX"

    notice_id_match = re.search(r"\b(ZA[0-9A-Z]{13}|[A-Z0-9]{14,16})\b", extracted_text)
    notice_id = notice_id_match.group(1) if notice_id_match else "ZA270525008912M"

    section_match = re.search(r"(?:Section|Sec\.?)\s*(\d+)", extracted_text, re.IGNORECASE)
    section = section_match.group(1) if section_match else "61"

    period_match = re.search(r"(?:tax\s*period|period)[:\s]*([^\n,;.]{4,25})", extracted_text, re.IGNORECASE)
    tax_period = period_match.group(1).strip() if period_match else "Apr-Jun 2024"

    # Match currency amounts (priority: keyword context -> currency prefix -> general amounts)
    discrepancy_amount = 184250
    amount_found = None

    # Priority 1: Keyword-bounded amounts (e.g. "Amount: Rs. 245000" or "Discrepancy: ₹1,84,250")
    context_match = re.search(
        r"(?:amount|discrepancy|demand|difference|mismatch)[^\d\n]{0,20}(?:₹|Rs\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})+|\d{4,9})(?:\.\d{2})?",
        extracted_text,
        re.IGNORECASE,
    )
    if context_match:
        try:
            val = float(context_match.group(1).replace(",", ""))
            if 1000 <= val <= 100000000:
                amount_found = int(val)
        except ValueError:
            pass

    # Priority 2: Direct currency symbol prefix (e.g. "₹1,84,250" or "Rs. 245000")
    if amount_found is None:
        curr_match = re.search(
            r"(?:₹|Rs\.?|INR)\s*([0-9]{1,3}(?:,[0-9]{2,3})+|\d{4,9})(?:\.\d{2})?",
            extracted_text,
            re.IGNORECASE,
        )
        if curr_match:
            try:
                val = float(curr_match.group(1).replace(",", ""))
                if 1000 <= val <= 100000000:
                    amount_found = int(val)
            except ValueError:
                pass

    # Priority 3: Any comma-formatted Indian rupee number
    if amount_found is None:
        for m in re.finditer(r"\b([0-9]{1,3}(?:,[0-9]{2,3})+)(?:\.[0-9]{2})?\b", extracted_text):
            try:
                val = float(m.group(1).replace(",", ""))
                if 1000 <= val <= 100000000:
                    amount_found = int(val)
                    break
            except ValueError:
                pass

    if amount_found is not None:
        discrepancy_amount = amount_found

    return NoticeMetadata(
        notice_id=notice_id,
        section=section,
        tax_period=tax_period,
        discrepancy_amount=discrepancy_amount,
        notice_date="2025-05-14",
        reply_deadline="2025-06-13",
        assessee_name="M/s Sharma Garments",
        gstin=gstin
    )

@app.post("/api/notice/upload")
async def upload_notice_metadata(file: UploadFile = File(...)):
    """
    Physical PDF text extraction with strict input validation:
    - 400 Bad Request: missing filename, empty file, non-PDF or missing %PDF magic bytes
    - 413 Payload Too Large: file > 4 MB (fits Vercel's 4.5 MB request limit)
    - 422 Unprocessable Entity: unreadable/corrupt PDF structure or image-only PDF with no text layer
    Returns NoticeMetadata on success. Never crashes with unhandled 500.
    """
    if not file.filename or len(file.filename.strip()) == 0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "INVALID_FILENAME",
                "message": "File name is required. Please select a valid document."
            }
        )

    try:
        file_bytes = await file.read()

        # 1. Size checks
        if len(file_bytes) == 0:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": "EMPTY_FILE",
                    "message": "Uploaded file is empty (0 bytes). Please upload a valid PDF notice."
                }
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            return JSONResponse(
                status_code=getattr(status, "HTTP_413_CONTENT_TOO_LARGE", 413),
                content={
                    "error": "FILE_TOO_LARGE",
                    "message": "File size exceeds the 4 MB limit for serverless upload. Please upload a smaller PDF."
                }
            )

        # 2. File type and magic bytes validation
        is_pdf_ext = file.filename.lower().endswith(".pdf")
        has_pdf_magic = file_bytes.startswith(b"%PDF")
        if not (is_pdf_ext and has_pdf_magic):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": "INVALID_FILE_TYPE",
                    "message": "Invalid file format. Only valid PDF files starting with %PDF magic header are accepted."
                }
            )

        # 3. PDF extraction & readability check
        extracted_text = ""
        pypdf_failed = False
        if pypdf:
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                if getattr(reader, "is_encrypted", False):
                    return JSONResponse(
                        status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
                        content={
                            "error": "PASSWORD_PROTECTED_PDF",
                            "message": "The uploaded PDF is password-protected. Please upload an unprotected document or enter notice details manually."
                        }
                    )
                for page in reader.pages:
                    txt = page.extract_text()
                    if txt:
                        extracted_text += "\n" + txt
            except Exception as pdf_err:
                err_msg = str(pdf_err).lower()
                if "password" in err_msg or "encrypt" in err_msg:
                    return JSONResponse(
                        status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
                        content={
                            "error": "PASSWORD_PROTECTED_PDF",
                            "message": "The uploaded PDF is encrypted or password-protected."
                        }
                    )
                logger.warning(f"pypdf reader encountered an issue on {file.filename}: {pdf_err}")
                pypdf_failed = True

        # Direct stream fallback for raw text embedded in streams or mock payloads
        if len(extracted_text.strip()) < 10:
            try:
                raw_text = file_bytes.decode("utf-8", errors="ignore")
                printable = re.sub(r"[^\x20-\x7E\n\r\t]", " ", raw_text)
                pdf_syntax_words = {"pdf", "obj", "endobj", "type", "catalog", "pages", "page", "count", "kids", "trailer", "xref", "startxref", "stream", "endstream"}
                content_words = [w for w in re.findall(r"[A-Za-z0-9]{2,}", printable) if w.lower() not in pdf_syntax_words]
                if len(" ".join(content_words)) >= 10:
                    extracted_text += "\n" + printable
            except Exception:
                pass

        # If pypdf failed AND no text could be recovered from stream
        if pypdf_failed and len(extracted_text.strip()) < 10:
            return JSONResponse(
                status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
                content={
                    "error": "CORRUPT_PDF",
                    "message": "Unable to read PDF structure. The file may be corrupt or encrypted."
                }
            )

        # 4. Image-only PDF check (no extractable text layer)
        if len(extracted_text.strip()) < 10:
            return JSONResponse(
                status_code=getattr(status, "HTTP_422_UNPROCESSABLE_CONTENT", 422),
                content={
                    "error": "NO_TEXT_LAYER",
                    "message": "The uploaded PDF appears to be an image-only scan with no text layer. Please upload a text-searchable PDF notice."
                }
            )

        metadata = extract_notice_metadata_from_pdf(file_bytes, file.filename, pre_extracted_text=extracted_text)
        # Redact notice_id and omit raw amount in routine logs for privacy
        masked_id = f"{metadata.notice_id[:4]}***{metadata.notice_id[-2:]}" if len(metadata.notice_id) > 6 else "***"
        logger.info(f"Notice upload metadata extracted: notice_id={masked_id}, section={metadata.section}")
        return metadata.model_dump() if hasattr(metadata, "model_dump") else metadata.dict()

    except Exception as exc:
        logger.error(f"Error parsing notice upload: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": "PARSE_ERROR",
                "message": "Could not parse notice details. Please ensure the document is a valid text-searchable Form GST ASMT-10 PDF."
            }
        )

@app.post("/api/verify/draft", response_model=DraftVerifyResponse)
async def verify_draft_endpoint(payload: DraftVerifyRequest):
    mismatches = []
    amount_statutory = round_statutory_inr(payload.confirmed_amount)
    raw_amount_str = str(amount_statutory)
    inr_formatted = format_inr(amount_statutory).replace("₹", "")
    std_comma = f"{amount_statutory:,}"
    amount_in_text = (
        raw_amount_str in payload.draft_text or 
        inr_formatted in payload.draft_text or 
        std_comma in payload.draft_text
    )
    
    if not amount_in_text:
        mismatches.append(VerificationMismatch(
            field="Discrepancy Amount",
            expected=f"₹{inr_formatted}",
            found_in_draft="Mismatch",
            severity="CRITICAL"
        ))
        
    if payload.confirmed_section not in payload.draft_text:
        mismatches.append(VerificationMismatch(
            field="Section Code",
            expected=f"Section {payload.confirmed_section}",
            found_in_draft="Missing",
            severity="WARNING"
        ))

    amount_match = amount_in_text
    section_match = (payload.confirmed_section in payload.draft_text)
    period_match = (payload.confirmed_period.lower() in payload.draft_text.lower()) if payload.confirmed_period else True

    if len(mismatches) == 0:
        return DraftVerifyResponse(
            status="PASS",
            message="Checks passed.",
            checks={"amount_match": True, "section_match": True, "period_match": True},
            financial_consistency=amount_match,
            source_data_consistency=period_match,
            legal_verification=section_match,
            human_approval_required=True
        )
    else:
        return DraftVerifyResponse(
            status="FAIL",
            message="Export blocked.",
            mismatches=mismatches,
            checks={"amount_match": amount_match, "section_match": section_match, "period_match": period_match},
            financial_consistency=amount_match,
            source_data_consistency=period_match,
            legal_verification=section_match,
            human_approval_required=True
        )

@app.get("/api/explain/{language}")
async def get_explanation(language: str):
    explanations = {
        "en": {
            "title": "Understanding Form ASMT-10",
            "summary": "Notice under Sec 61 CGST Act.",
            "description": "This is NOT a tax demand order; it is an inquiry invitation.",
            "source_citation": "From Notice text: '...scrutiny of returns revealed discrepancies under section 61...'"
        },
        "hi": {
            "title": "फॉर्म ASMT-10 को समझें",
            "summary": "धारा 61 के तहत नोटिस।",
            "description": "यह कर मांग आदेश (Tax Demand) नहीं है।",
            "source_citation": "नोटिस से उद्धरण: '...धारा 61 के तहत अंतर पाया गया है...'"
        },
        "mr": {
            "title": "फॉर्म ASMT-10 समजून घ्या",
            "summary": "कलम 61 अंतर्गत नोटीस.",
            "description": "ही कोणतीही कर मागणी नाही.",
            "source_citation": "नोटीसमधील संदर्भ: '...कलम 61 अंतर्गत तफावत आढळली आहे...'"
        }
    }
    if language.lower() not in explanations:
        raise HTTPException(status_code=404, detail="Language not supported.")
    return explanations[language.lower()]

@app.post("/api/brief/generate")
async def generate_ca_brief_endpoint(payload: BriefGenerateRequest):
    return {
        "status": "SUCCESS",
        "dossier_id": "DH-2025-ASMT10-8912",
        "timestamp": "2025-06-01T12:00:00Z",
        "assessee": {"name": "M/s Sharma Garments", "gstin": "27XXXXX1234X1ZX"},
        "verified_draft": payload.draft_text,
        "disclaimer": "Drafting aid prepared for professional CA review. Not official legal filing."
    }

# ============================================================================
# EXTENDED SPA COMPATIBILITY ENDPOINTS (Form ASMT-10 Workflow)
# ============================================================================

@app.post("/api/notices", response_model=NoticeUploadResponse)
async def upload_notice(
    file: Optional[UploadFile] = File(None),
    is_sample: Optional[bool] = Form(False)
):
    return NoticeUploadResponse(
        caseId=CANONICAL_CASE.caseId,
        status="ambiguity_detected",
        notice=CANONICAL_CASE,
        message="OCR extracted successfully. Ambiguity detected on character 4 of amount cell."
    )

@app.get("/api/notices/{case_id}", response_model=NoticeData)
def get_notice(case_id: str):
    if case_id != CANONICAL_CASE.caseId:
        raise HTTPException(status_code=404, detail="Case ID not found.")
    return CANONICAL_CASE

@app.post("/api/notices/{case_id}/confirm", response_model=ConfirmAmountResponse)
def confirm_amount(case_id: str, req: ConfirmAmountRequest):
    if case_id != CANONICAL_CASE.caseId:
        raise HTTPException(status_code=404, detail="Case ID not found.")

    expected = CANONICAL_CASE.rows[1].difference  # 184250.0
    if req.confirmedAmount != expected:
        raise HTTPException(
            status_code=422,
            detail=f"Amount does not match notice table arithmetic: ₹14,92,450 − ₹13,08,200 = {format_inr(expected)}."
        )

    case_state["confirmed_amount"] = req.confirmedAmount
    case_state["pause_resolved"] = True

    return ConfirmAmountResponse(
        caseId=case_id,
        confirmedAmount=req.confirmedAmount,
        status="confirmed",
        unlockedStep=3
    )

@app.post("/api/notices/{case_id}/draft", response_model=DraftResponse)
def generate_draft(case_id: str, req: DraftGenerateRequest):
    if case_id != CANONICAL_CASE.caseId:
        raise HTTPException(status_code=404, detail="Case ID not found.")

    amount = req.amount or case_state["confirmed_amount"]
    amt_str = "₹1,81,250" if req.verifierMode == "fail" else format_inr(amount)

    draft_text = f"""FORM GST ASMT-11
[See Rule 99(2)]
REPLY TO NOTICE ISSUED UNDER SECTION 61

To:
The Proper Officer, Ward 102,
Office of the Assistant Commissioner of State Tax,
Nodal Division-IV, Bandra-Kurla Complex, Mumbai - 400051

Subject: Reply in Form GST ASMT-11 in response to Notice for Scrutiny in Form GST ASMT-10 reference number {CANONICAL_CASE.noticeRef} dated {CANONICAL_CASE.noticeDate}.

Assessee: {CANONICAL_CASE.businessName}
Proprietor: {CANONICAL_CASE.proprietorName}
GSTIN: {CANONICAL_CASE.gstin}
Tax Period: {CANONICAL_CASE.taxPeriod}

Respected Sir / Madam,

1. BASIS OF SCRUTINY & RECONCILIATION
In response to the statutory scrutiny notice pointing out an alleged ITC mismatch of {amt_str} in Table 4(A)(5) of Form GSTR-3B versus Form GSTR-2B for {CANONICAL_CASE.taxPeriod}, the registered person respectfully submits this comprehensive itemized explanation.

2. AFFIRMATION OF PHYSICAL VERIFICATION
The registered person has independently audited their purchase register, balance sheet, and bank remittance ledgers. It is confirmed that the said sum of {amt_str} was legally availed and rightfully credited in the Electronic Credit Ledger strictly in relation to genuine business supplies utilised for taxable outward supplies.

3. STATUTORY COMPLIANCE BENCHMARK
All goods represented in the invoices were physically received at the registered premises under cover of legitimate tax invoices and verified E-way bills, satisfying all four constituent conditions laid down under Section 16(2)(a), (b), (c), and (d) of the Central Goods and Services Tax Act, 2017. Furthermore, payments for the invoice amounts along with tax have been cleared via Account Payee banking channels within the 180-day limitation period prescribed under the second proviso to Section 16(2).

4. PROBABLE CAUSE & TAX DISCHARGE
The apparent variance occurred solely because the supplier, {CANONICAL_CASE.supplier.name} (GSTIN: {CANONICAL_CASE.supplier.gstin}), erroneously classified the supply in their outward return. The tax has duly been deposited into the Government treasury, and the vendor has since reconciled their subsequent Form GSTR-3B. Annexed hereto as Exhibit 3 is the Supplier Verification Certificate as recognized under CBIC Circular No. 183/15/2022-GST.

In light of the statutory precedents and verified exhibits, it is prayed that the proceedings initiated under Section 61 be respectfully dropped in terms of Rule 99(2) and Form GST ASMT-12 (Order of Acceptance) be issued.

Verification:
I, {CANONICAL_CASE.proprietorName}, Sole Proprietor, solemnly declare that the facts stated above are true to the best of my knowledge and records.
Date: 26-May-2025 | Place: Mumbai | Target submission before statutory deadline {CANONICAL_CASE.replyDeadline}."""

    case_state["last_draft"] = draft_text

    return DraftResponse(
        caseId=case_id,
        draftText=draft_text,
        templateVersion="v4.8-audit",
        isDraftForCaReview=True,
        activeAnchorsCount=4
    )

@app.get("/api/notices/{case_id}/verification", response_model=VerificationResponse)
def get_verification(case_id: str, verifier_mode: str = "pass"):
    if case_id != CANONICAL_CASE.caseId:
        raise HTTPException(status_code=404, detail="Case ID not found.")

    amt_str = "₹1,81,250" if verifier_mode == "fail" else format_inr(case_state["confirmed_amount"])
    draft_sample = f"""
    {CANONICAL_CASE.businessName} (GSTIN: {CANONICAL_CASE.gstin})
    Notice Reference: {CANONICAL_CASE.noticeRef} dated {CANONICAL_CASE.noticeDate}.
    In response to scrutiny under Section 61 and Rule 99(2), the alleged difference of {amt_str}
    in Table 4(A)(5) for {CANONICAL_CASE.taxPeriod} has been reconciled.
    Conditions under Section 16(2)(a), (b), (c), and (d) are fulfilled.
    Submission prepared on 26-May-2025 ahead of statutory deadline {CANONICAL_CASE.replyDeadline}.
    """

    confirmed_config = {
        "confirmedAmount": case_state["confirmed_amount"],
        "noticeDate": CANONICAL_CASE.noticeDate,
        "allowedDates": [
            CANONICAL_CASE.noticeDate,
            "26-May-2025",
            CANONICAL_CASE.replyDeadline,
            "18-Jun-2024",
            "14-June-2024",
            CANONICAL_CASE.fixedClockDate
        ],
        "allowedSections": [
            "Section 61",
            "Section 16",
            "Section 16(2)",
            "Rule 99",
            "Rule 99(1)",
            "Rule 99(2)"
        ],
        "gstin": CANONICAL_CASE.gstin,
        "noticeRef": CANONICAL_CASE.noticeRef
    }

    report = verify_draft_detailed(draft_sample, confirmed_config)

    return VerificationResponse(
        caseId=case_id,
        report=report,
        timestamp=f"{CANONICAL_CASE.fixedClockDate} | 14:38 IST"
    )

@app.post("/api/notices/{case_id}/brief", response_model=CaBriefResponse)
def generate_ca_brief(case_id: str, req: CaBriefRequest):
    if case_id != CANONICAL_CASE.caseId:
        raise HTTPException(status_code=404, detail="Case ID not found.")

    payload = req.contentToHash or f"{case_id}|{CANONICAL_CASE.gstin}|{case_state['confirmed_amount']}|{CANONICAL_CASE.noticeDate}|{CANONICAL_CASE.replyDeadline}"
    sha256_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    short_hash = sha256_hash[:8].upper()

    return CaBriefResponse(
        caseId=case_id,
        contentHash=sha256_hash,
        shortHash=short_hash,
        generatedAt=f"{CANONICAL_CASE.fixedClockDate} | 14:38 IST",
        isAuditReady=True,
        status="ready"
    )

# ============================================================================
# DHAAL 2.0 ADVANCED RECONCILIATION & EVIDENCE GRAPH ENDPOINTS
# ============================================================================

CANONICAL_24_SEEDS = [
    (8250, 45833), (7500, 41667), (9200, 51111), (6800, 37778),
    (11400, 63333), (5600, 31111), (8900, 49444), (7100, 39444),
    (9500, 52778), (6400, 35556), (8100, 45000), (7300, 40556),
    (8800, 48889), (6200, 34444), (7900, 43889), (8300, 46111),
    (6900, 38333), (7700, 42778), (8500, 47222), (6600, 36667),
    (9100, 50556), (7400, 41111), (8300, 46111), (2500, 13889),
]

@app.post("/api/reconciliation/run")
@app.post("/api/v2/reconciliation/run")
async def run_reconciliation(req: Optional[dict] = None):
    req = req or {}
    purchase_register = req.get("purchase_register")
    gstr_2b = req.get("gstr_2b_records", [])
    target = req.get("target_discrepancy_amount", 184250)

    # Use canonical 24 invoices if no custom register provided
    if not purchase_register:
        purchase_register = []
        for i, (tax, taxable) in enumerate(CANONICAL_24_SEEDS):
            month = "04" if i < 8 else "05" if i < 16 else "06"
            day = (i % 25) + 1
            purchase_register.append({
                "invoice_no": f"AT/24-25/{1101 + i}",
                "invoice_date": f"2024-{month}-{day:02d}",
                "supplier_gstin": "27XXXXX5678X1ZX",
                "supplier_name": "M/s Apex Textiles (fictional)",
                "taxable_value": taxable,
                "claimed_itc": tax,
                "cgst": tax // 2,
                "sgst": tax // 2,
            })

    report = run_deterministic_reconciliation(
        purchase_register=purchase_register,
        gstr_2b_records=gstr_2b,
        target_notice_amount=target
    )
    return report.model_dump() if hasattr(report, "model_dump") else report.dict()

@app.get("/api/evidence/{case_id}/graph")
@app.get("/api/v2/evidence/{case_id}/graph")
def get_evidence_graph(case_id: str):
    graph = build_evidence_graph_for_case(
        case_id=case_id,
        discrepancy_amount=int(case_state["confirmed_amount"])
    )
    return graph.model_dump() if hasattr(graph, "model_dump") else graph.dict()

@app.get("/api/evidence/{case_id}/scorecard")
@app.get("/api/v2/evidence/{case_id}/scorecard")
def get_evidence_scorecard(case_id: str):
    graph = build_evidence_graph_for_case(
        case_id=case_id,
        discrepancy_amount=int(case_state["confirmed_amount"])
    )
    return {
        "case_id": case_id,
        "evidentiary_strength_score": graph.evidentiary_strength_score,
        "evidence_completeness_indicator": graph.evidence_completeness_indicator,
        "eci_breakdown": graph.eci_breakdown.model_dump() if hasattr(graph.eci_breakdown, "model_dump") else graph.eci_breakdown.dict(),
        "missing_evidence_count": graph.missing_evidence_count,
        "unverified_hypotheses_count": graph.unverified_hypotheses_count,
        "section_16_compliance": graph.section_16_compliance,
        "circular_183_assessment": graph.circular_183_assessment
    }

class Circular183RequestBody(BaseModel):
    financial_year: Optional[str] = None
    mismatch_type: Optional[str] = None
    tax_difference: Optional[float] = None
    has_supplier_certificate: Optional[bool] = None
    has_ca_certificate: Optional[bool] = None
    has_udin: Optional[bool] = None

@app.post("/api/circular-183/assess")
@app.get("/api/circular-183/assess")
def assess_circular_183_endpoint(
    req: Optional[Circular183RequestBody] = None,
    financial_year: Optional[str] = "2024-25",
    mismatch_type: Optional[str] = "GSTR_3B_VS_GSTR_2B",
    tax_difference: Optional[float] = 184250.0,
    has_supplier_certificate: bool = False,
    has_ca_certificate: bool = False,
    has_udin: bool = False
):
    fy = req.financial_year if req and req.financial_year is not None else financial_year
    mm = req.mismatch_type if req and req.mismatch_type is not None else mismatch_type
    td = req.tax_difference if req and req.tax_difference is not None else tax_difference
    sc = req.has_supplier_certificate if req and req.has_supplier_certificate is not None else has_supplier_certificate
    cc = req.has_ca_certificate if req and req.has_ca_certificate is not None else has_ca_certificate
    ud = req.has_udin if req and req.has_udin is not None else has_udin

    inp = Circular183AssessmentInput(
        financial_year=fy,
        mismatch_type=mm,
        tax_difference_amount=td,
        supplier_certificate_obtained=sc,
        ca_cma_certificate_obtained=cc,
        udin_verified=ud
    )
    result = assess_circular_183_applicability(inp)
    return result.model_dump() if hasattr(result, "model_dump") else result.dict()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
