"""Bulk URL import service with CSV validation."""

import csv
import io
from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ValidationErrorType(str, Enum):
    """Types of validation errors for CSV rows."""
    EMPTY_URL = "empty_url"
    INVALID_URL = "invalid_url"
    MISSING_COLUMN = "missing_column"
    DUPLICATE_URL = "duplicate_url"


@dataclass
class RowValidationError:
    """Error for a single row in CSV import."""
    row_number: int
    error_type: ValidationErrorType
    message: str
    row_data: Optional[dict] = None


@dataclass
class ImportResult:
    """Result of bulk import operation."""
    total_rows: int
    successful: int
    failed: int
    errors: list[RowValidationError]
    imported_codes: list[str]


def validate_url(url: str) -> bool:
    """Basic URL validation."""
    if not url or not isinstance(url, str):
        return False

    url = url.strip()

    if len(url) < 5:
        return False

    # Must have http:// or https:// scheme
    if not (url.startswith("http://") or url.startswith("https://")):
        return False

    return True


def parse_csv(content: str) -> tuple[list[dict], list[RowValidationError]]:
    """
    Parse CSV content and validate rows.

    Args:
        content: CSV file content as string

    Returns:
        Tuple of (valid_rows, errors)
    """
    valid_rows = []
    errors = []

    try:
        reader = csv.DictReader(io.StringIO(content))
    except Exception as e:
        errors.append(RowValidationError(
            row_number=0,
            error_type=ValidationErrorType.MISSING_COLUMN,
            message=f"Failed to parse CSV: {str(e)}"
        ))
        return [], errors

    if not reader.fieldnames:
        errors.append(RowValidationError(
            row_number=0,
            error_type=ValidationErrorType.MISSING_COLUMN,
            message="CSV has no headers"
        ))
        return [], errors

    # Look for URL column (case-insensitive)
    fieldnames = [f.lower() for f in reader.fieldnames]
    url_col = None
    for i, name in enumerate(fieldnames):
        if name in ['url', 'original_url', 'link', 'destination']:
            url_col = reader.fieldnames[i]
            break

    if not url_col:
        errors.append(RowValidationError(
            row_number=0,
            error_type=ValidationErrorType.MISSING_COLUMN,
            message="CSV must have a 'url' column"
        ))
        return [], errors

    # Track seen URLs to detect duplicates
    seen_urls = set()
    row_num = 1

    for row in reader:
        row_num += 1
        url_value = row.get(url_col, "").strip()

        # Check for empty or whitespace-only URL
        if not url_value or url_value == "":
            errors.append(RowValidationError(
                row_number=row_num,
                error_type=ValidationErrorType.EMPTY_URL,
                message="URL is empty",
                row_data=dict(row)
            ))
            continue

        # Validate URL format
        if not validate_url(url_value):
            errors.append(RowValidationError(
                row_number=row_num,
                error_type=ValidationErrorType.INVALID_URL,
                message=f"Invalid URL format: {url_value[:50]}...",
                row_data=dict(row)
            ))
            continue

        # Check for duplicates
        if url_value in seen_urls:
            errors.append(RowValidationError(
                row_number=row_num,
                error_type=ValidationErrorType.DUPLICATE_URL,
                message=f"Duplicate URL: {url_value[:50]}...",
                row_data=dict(row)
            ))
            continue

        seen_urls.add(url_value)
        valid_rows.append({"url": url_value})

    return valid_rows, errors


def generate_import_report(result: ImportResult) -> dict:
    """Generate a detailed import report."""
    return {
        "summary": {
            "total_rows": result.total_rows,
            "successful": result.successful,
            "failed": result.failed,
            "success_rate": round(result.successful / max(result.total_rows, 1) * 100, 2) if result.total_rows > 0 else 0
        },
        "errors": [
            {
                "row": error.row_number,
                "type": error.error_type.value,
                "message": error.message,
                "data": error.row_data
            }
            for error in result.errors
        ],
        "imported_codes": result.imported_codes
    }