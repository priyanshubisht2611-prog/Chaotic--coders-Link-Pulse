"""Pydantic schemas for API requests and responses."""

from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional


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
