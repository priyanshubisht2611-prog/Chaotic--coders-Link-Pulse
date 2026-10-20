"""Integration tests for URL shortener API endpoints."""

import pytest

# Import app directly to test routes load
import sys
sys.path.insert(0, 'C:/Users/PRIYANSHU BISHT/Desktop/LinkPulse')

def test_shortener_routes_import():
    """Verify shortener routes module can be imported."""
    from backend.api.shortener_routes import router
    assert router is not None
    assert router.prefix == "/links"

def test_storage_import():
    """Verify storage module can be imported."""
    from backend.api.storage import url_store, URLStore, Link
    assert url_store is not None
    assert isinstance(url_store, URLStore)

def test_qr_service_import():
    """Verify QR service module can be imported."""
    from backend.api.qr_service import generate_qr_code, generate_short_url_qr
    assert generate_qr_code is not None
    assert generate_short_url_qr is not None

def test_bulk_import_import():
    """Verify bulk import module can be imported."""
    from backend.api.bulk_import import parse_csv, validate_url, ImportResult
    assert parse_csv is not None
    assert validate_url is not None
    assert ImportResult is not None

def test_models_import():
    """Verify new models can be imported."""
    from backend.api.models import ShortenRequest, ShortenResponse, LinkListResponse
    from backend.api.models import QRCodeResponse, BulkImportRequest, ImportResultResponse
    assert ShortenRequest is not None
    assert ShortenResponse is not None

def test_url_creation():
    """Test URL shortener creates valid links."""
    from backend.api.storage import url_store
    link = url_store.create_short_url("https://example.com/very/long/url/path")
    assert link.short_code is not None
    assert len(link.short_code) == 6
    assert link.original_url == "https://example.com/very/long/url/path"
    assert link.clicks == 0

def test_url_redirect():
    """Test URL redirect retrieves original URL."""
    from backend.api.storage import url_store
    link = url_store.create_short_url("https://test.com/page")
    retrieved = url_store.get_original_url(link.short_code)
    assert retrieved == "https://test.com/page"
    assert link.clicks == 1

def test_url_validation():
    """Test URL validation function."""
    from backend.api.bulk_import import validate_url
    assert validate_url("https://example.com") is True
    assert validate_url("http://example.com") is True
    assert validate_url("invalid") is False
    assert validate_url("") is False
    assert validate_url("ftp://example.com") is False

def test_csv_parsing():
    """Test CSV parsing returns correct structure."""
    from backend.api.bulk_import import parse_csv
    csv_content = """url
https://example.com
https://test.com
"""
    rows, errors = parse_csv(csv_content)
    assert len(rows) == 2
    assert len(errors) == 0
    assert rows[0]["url"] == "https://example.com"
    assert rows[1]["url"] == "https://test.com"

def test_csv_duplicate_detection():
    """Test CSV parsing detects duplicates."""
    from backend.api.bulk_import import parse_csv
    csv_content = """url
https://example.com
https://example.com
"""
    rows, errors = parse_csv(csv_content)
    assert len(rows) == 1
    assert len(errors) == 1
    assert "Duplicate" in errors[0].message or "duplicate" in errors[0].message.lower()

def test_csv_invalid_url_detection():
    """Test CSV parsing detects invalid URLs."""
    from backend.api.bulk_import import parse_csv
    csv_content = """url
https://example.com
not-a-url
"""
    rows, errors = parse_csv(csv_content)
    assert len(rows) == 1
    assert len(errors) == 1