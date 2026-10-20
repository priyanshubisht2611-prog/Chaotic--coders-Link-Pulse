"""URL shortener and QR code routes."""

import base64
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse

from backend.api.models import (
    ShortenRequest, ShortenResponse, LinkListResponse,
    QRCodeResponse, ImportResultResponse
)
from backend.api.storage import url_store
from backend.api.qr_service import generate_short_url_qr
from backend.api.bulk_import import parse_csv, ImportResult

router = APIRouter(prefix="/links", tags=["links"])


@router.post("/shorten", response_model=ShortenResponse)
async def shorten_url(request: ShortenRequest):
    """Create a short URL for the given destination URL."""
    url_str = str(request.url)
    link = url_store.create_short_url(url_str)

    return ShortenResponse(
        original_url=link.original_url,
        short_code=link.short_code,
        short_url=f"/l/{link.short_code}",
        qr_code_url=f"/links/{link.short_code}/qr" if link.qr_enabled else None,
        created_at=link.created_at.isoformat() + "Z"
    )


@router.get("", response_model=LinkListResponse)
async def list_links():
    """List all shortened URLs."""
    links = url_store.list_links()
    return LinkListResponse(
        links=[
            ShortenResponse(
                original_url=l.original_url,
                short_code=l.short_code,
                short_url=f"/l/{l.short_code}",
                qr_code_url=f"/links/{l.short_code}/qr" if l.qr_enabled else None,
                created_at=l.created_at.isoformat() + "Z"
            )
            for l in links
        ],
        total=len(links)
    )


@router.delete("/{short_code}")
async def delete_link(short_code: str):
    """Delete a shortened URL."""
    if not url_store.delete_link(short_code):
        raise HTTPException(status_code=404, detail="Short URL not found")
    return {"status": "deleted", "short_code": short_code}


@router.post("/{short_code}/qr", response_model=QRCodeResponse)
async def generate_qr(short_code: str, base_url: Optional[str] = "http://localhost:8000"):
    """Generate QR code for an existing short URL."""
    link = url_store.get_link(short_code)
    if not link:
        raise HTTPException(status_code=404, detail="Short URL not found")

    qr_path, qr_bytes = generate_short_url_qr(f"/l/{short_code}", base_url)
    url_store.update_qr_status(short_code, qr_path)

    return QRCodeResponse(
        short_code=short_code,
        short_url=f"/l/{short_code}",
        qr_image_url=f"/links/{short_code}/qr",
        qr_image_base64=base64.b64encode(qr_bytes).decode("utf-8")
    )


@router.get("/{short_code}/qr")
async def get_qr_image(short_code: str):
    """Get QR code image for a short URL."""
    link = url_store.get_link(short_code)
    if not link or not link.qr_image_path:
        raise HTTPException(status_code=404, detail="QR code not found")

    from pathlib import Path
    qr_path = Path(link.qr_image_path)
    if not qr_path.exists():
        raise HTTPException(status_code=404, detail="QR image file not found")

    return FileResponse(qr_path, media_type="image/png")


@router.get("/{short_code}/stats")
async def get_link_stats(short_code: str):
    """Get statistics for a short URL."""
    link = url_store.get_link(short_code)
    if not link:
        raise HTTPException(status_code=404, detail="Short URL not found")

    return {
        "short_code": link.short_code,
        "original_url": link.original_url,
        "clicks": link.clicks,
        "created_at": link.created_at.isoformat() + "Z",
        "qr_enabled": link.qr_enabled
    }


@router.post("/import", response_model=ImportResultResponse)
async def bulk_import(
    file: UploadFile = File(...)
):
    """
    Import multiple URLs from a CSV file.

    CSV must have a column named 'url', 'original_url', 'link', or 'destination'.
    Each row should contain one URL to shorten.
    """
    content = await file.read()

    try:
        content_str = content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")

    valid_rows, errors = parse_csv(content_str)

    # Shorten each valid URL
    imported_codes = []
    for row in valid_rows:
        link = url_store.create_short_url(row["url"])
        imported_codes.append(link.short_code)

    result = ImportResult(
        total_rows=len(valid_rows) + len(errors),
        successful=len(valid_rows),
        failed=len(errors),
        errors=errors,
        imported_codes=imported_codes
    )

    # Generate summary for response
    summary = {
        "total_rows": result.total_rows,
        "successful": result.successful,
        "failed": result.failed,
        "success_rate": round(result.successful / max(result.total_rows, 1) * 100, 2) if result.total_rows > 0 else 0
    }

    return ImportResultResponse(
        summary=summary,
        errors=[
            {
                "row": error.row_number,
                "type": error.error_type.value,
                "message": error.message,
                "data": error.row_data
            }
            for error in result.errors
        ],
        imported_codes=result.imported_codes
    )