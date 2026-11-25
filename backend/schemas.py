from pydantic import BaseModel, Field
from typing import Dict, List, Optional

class NoticeMetadata(BaseModel):
    notice_id: str = Field(..., json_schema_extra={"example": "ZA270525008912M"})
    section: str = Field(..., json_schema_extra={"example": "61"})
    tax_period: str = Field(..., json_schema_extra={"example": "Apr-Jun 2024"})
    discrepancy_amount: int = Field(..., json_schema_extra={"example": 184250})
    notice_date: str = Field(..., json_schema_extra={"example": "2025-05-14"})
    reply_deadline: str = Field(..., json_schema_extra={"example": "2025-06-13"})
    assessee_name: str = Field(default="M/s Sharma Garments")
    gstin: str = Field(default="27XXXXX1234X1ZX")

class DraftVerifyRequest(BaseModel):
    draft_text: str = Field(..., description="The generated legal text reply.")
    confirmed_amount: int = Field(..., description="The user-confirmed discrepancy amount.")
    confirmed_section: str = Field(..., description="Section code from notice.")
    confirmed_period: str = Field(..., description="Tax period from notice.")

class VerificationMismatch(BaseModel):
    field: str
    expected: str
    found_in_draft: str
    severity: str

class DraftVerifyResponse(BaseModel):
    status: str
    message: str
    mismatches: Optional[List[VerificationMismatch]] = None
    checks: Optional[Dict[str, bool]] = None
    financial_consistency: bool = False
    source_data_consistency: bool = False
    legal_verification: bool = False
    human_approval_required: bool = True

class BriefGenerateRequest(BaseModel):
    notice_id: str
    draft_text: str
    evidence_checklist_status: Dict[str, bool]
    confirmed_amount: int

# Additional support models for comprehensive notice workflows
class DiscrepancyRow(BaseModel):
    srNo: str
    category: str
    gstr3b: float
    gstr2b: float
    difference: float
    isSmudged: bool = False

class OfficeDetails(BaseModel):
    state: str
    designation: str
    division: str
    officer: str
    ward: str

class ExtractionDetails(BaseModel):
    primaryEngineAmount: float
    verificationPassAmount: float
    delta: float
    smudgeCharIndex: int
    magnification: str

class SupplierDetails(BaseModel):
    name: str
    gstin: str
    invoiceNo: str
    invoiceDate: str
    amount: float
    taxAmount: float

class BankingDetails(BaseModel):
    bankName: str
    utr: str
    status: str

class TransportDetails(BaseModel):
    ewayBillNo: str
    status: str

class CaCounselDetails(BaseModel):
    name: str
    membershipNo: str
    passcode: str

class NoticeData(BaseModel):
    businessName: str
    proprietorName: str
    gstin: str
    noticeRef: str
    caseId: str
    formType: str
    formRule: str
    noticeDate: str
    taxPeriod: str
    taxPeriodShort: str
    fixedClockDate: str
    replyDeadline: str
    recommendedCaSign: str
    statutoryWindowDays: int
    daysRemaining: int
    rows: List[DiscrepancyRow]
    office: OfficeDetails
    extraction: ExtractionDetails
    supplier: SupplierDetails
    banking: BankingDetails
    transport: TransportDetails
    caCounsel: CaCounselDetails

class NoticeUploadResponse(BaseModel):
    caseId: str
    status: str
    notice: NoticeData
    message: str

class ConfirmAmountRequest(BaseModel):
    caseId: str
    confirmedAmount: float

class ConfirmAmountResponse(BaseModel):
    caseId: str
    confirmedAmount: float
    status: str
    unlockedStep: int

class DraftGenerateRequest(BaseModel):
    caseId: str
    verifierMode: str = Field(default="pass", description="'pass' or 'fail'")
    amount: Optional[float] = None

class DraftResponse(BaseModel):
    caseId: str
    draftText: str
    templateVersion: str
    isDraftForCaReview: bool
    activeAnchorsCount: int

class CheckItemResult(BaseModel):
    id: str
    name: str
    passed: bool
    message: str
    extractedValue: Optional[str] = None
    expectedValue: Optional[str] = None

class VerificationReport(BaseModel):
    passed: bool
    totalChecks: int
    passedCount: int
    checks: List[CheckItemResult]
    errors: List[str]
    divergenceAmount: float = 0.0
    assertedAmount: float = 0.0
    financialConsistency: bool = False
    sourceDataConsistency: bool = False
    legalVerification: bool = False
    humanApprovalRequired: bool = True
    verificationLevel: str = "PENDING_REVIEW"

class VerificationResponse(BaseModel):
    caseId: str
    report: VerificationReport
    timestamp: str

class CaBriefRequest(BaseModel):
    caseId: str
    contentToHash: Optional[str] = None

class CaBriefResponse(BaseModel):
    caseId: str
    contentHash: str
    shortHash: str
    generatedAt: str
    isAuditReady: bool
    status: str
