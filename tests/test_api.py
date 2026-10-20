"""Tests for LinkPulse API."""

import pytest
from fastapi.testclient import TestClient

from backend.api.main import app

client = TestClient(app)


def test_root():
    """Test health endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "LinkPulse API"


def test_health():
    """Test health check."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_scan_valid_url_safe():
    """Test scanning a safe URL."""
    response = client.post(
        "/scan/",
        json={"url": "https://www.google.com"}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert "submitted_url" in data
    assert data["submitted_url"] == "https://www.google.com/"
    assert "risk_score" in data
    assert 0 <= data["risk_score"] <= 100
    assert data["classification"] in ["safe", "suspicious", "malicious"]
    assert "model_probability" in data
    assert "explanatory_risk_signals" in data
    assert "recommendation" in data


def test_scan_valid_url_phishing():
    """Test scanning a phishing-like URL."""
    response = client.post(
        "/scan/",
        json={"url": "http://paypal-verify.info/login.php?secure=1"}
    )
    assert response.status_code == 200
    data = response.json()
    
    assert "submitted_url" in data
    assert "risk_score" in data
    assert data["risk_score"] > 0
    assert data["classification"] in ["safe", "suspicious", "malicious"]
    assert "recommendation" in data


def test_scan_invalid_url():
    """Test scanning invalid URL."""
    response = client.post(
        "/scan/",
        json={"url": "not-a-valid-url"}
    )
    assert response.status_code == 422  # Validation error from Pydantic


def test_scan_missing_url():
    """Test scanning with missing URL field."""
    response = client.post(
        "/scan/",
        json={}
    )
    assert response.status_code == 422


def test_scan_response_format():
    """Test response matches API contract."""
    response = client.post(
        "/scan/",
        json={"url": "https://www.github.com"}
    )
    assert response.status_code == 200
    data = response.json()
    
    # Check required fields
    assert "submitted_url" in data
    assert "risk_score" in data
    assert isinstance(data["risk_score"], (int, float))
    assert 0 <= data["risk_score"] <= 100
    assert "classification" in data
    assert data["classification"] in ["safe", "suspicious", "malicious"]
    assert "model_probability" in data
    assert "explanatory_risk_signals" in data
    assert isinstance(data["explanatory_risk_signals"], list)
    assert "recommendation" in data
    assert isinstance(data["recommendation"], str)
    
    # Check risk signals format
    for signal in data["explanatory_risk_signals"]:
        assert "signal" in signal
        assert "description" in signal
        assert "weight" in signal
        assert 0 <= signal["weight"] <= 1


def test_classification_logic():
    """Test classification based on risk score."""
    response = client.post(
        "/scan/",
        json={"url": "https://www.google.com"}
    )
    assert response.status_code == 200
    data = response.json()
    
    risk_score = data["risk_score"]
    classification = data["classification"]
    
    if risk_score <= 30:
        assert classification == "safe"
    elif risk_score <= 70:
        assert classification == "suspicious"
    else:
        assert classification == "malicious"
