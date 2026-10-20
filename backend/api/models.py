"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional
from datetime import datetime

class ScanRequest(BaseModel):
    """Request schema for /scan endpoint."""
    url: HttpUrl = Field(..., description="URL to scan for phishing indicators")

class RiskSignal(BaseModel):
    """Explanatory risk signal."""
    signal: str = Field(..., description="Name of the risk signal")
    description: str = Field(..., description="Human-readable explanation")
    weight: float = Field(..., ge=0.0, le=1.0, description="Contribution to risk score (0-1)")

class ScanResponse(BaseModel):
    """Success response schema for /scan endpoint."""
    submitted_url: str = Field(..., description="The URL that was submitted")
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Risk score 0-100")
    classification: str = Field(..., description="safe, suspicious, or malicious")
    model_probability: Optional[float] = Field(None, ge=0.0, le=1.0, description="Probability from ML model")
    explanatory_risk_signals: List[RiskSignal] = Field(default_factory=list)
    recommendation: str = Field(..., description="Actionable advice for user")

class ValidationErrorResponse(BaseModel):
    """Validation error response."""
    error: str = "ValidationError"
    detail: str
    field: Optional[str] = None

class InternalErrorResponse(BaseModel):
    """Internal server error response."""
    error: str = "InternalServerError"
    detail: str
    timestamp: str

# --- URL Shortener Schemas ---

class ShortenRequest(BaseModel):
    """Request to create a short URL."""
    url: HttpUrl = Field(..., description="URL to shorten")

class ShortenResponse(BaseModel):
    """Short URL creation response."""
    original_url: str
    short_code: str
    short_url: str
    qr_code_url: Optional[str] = None
    created_at: str

class LinkListResponse(BaseModel):
    """List of shortened links."""
    links: List[ShortenResponse]
    total: int

class QRCodeResponse(BaseModel):
    """QR code generation response."""
    short_code: str
    short_url: str
    qr_image_url: str
    qr_image_base64: str

class ImportResultResponse(BaseModel):
    """Bulk import result."""
    total: int
    successful: int
    failed: int
    errors: List[str] = []

class BulkImportRequest(BaseModel):
    """Bulk import request for multiple URLs."""
    urls: List[str] = Field(..., min_length=1, description="List of URLs to import")

# --- Analytics Schemas ---

class AnalyticsSummary(BaseModel):
    """Analytics summary response."""
    total_clicks: int
    active_links: int
    total_links: int

class ClickTrendPoint(BaseModel):
    """Single point in click trend."""
    date: str
    clicks: int

class LinkPerformance(BaseModel):
    """Per-link performance data."""
    short_code: str
    original_url: str
    created_at: str
    clicks: int
    short_url: str

class LinkPerformanceList(BaseModel):
    """List of link performance data."""
    links: List[LinkPerformance]
    total: int

class DateRangeQuery(BaseModel):
    """Date range query parameters."""
    start: Optional[str] = Field(None, description="Start date YYYY-MM-DD")
    end: Optional[str] = Field(None, description="End date YYYY-MM-DD")
