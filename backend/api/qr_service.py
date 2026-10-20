"""QR Code generation service."""

import io
import uuid
from pathlib import Path
from typing import Optional

import qrcode


def _make_qr_svg(data: str) -> bytes:
    """Generate QR code as SVG string for environments without PIL."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Generate SVG
    img = qr.make_image(image_factory=qrcode.image.svg.SvgImage)
    svg_buffer = io.StringIO()
    img.save(svg_buffer)
    return svg_buffer.getvalue().encode('utf-8')


def generate_qr_code(data: str, output_dir: Optional[Path] = None) -> tuple[str, bytes]:
    """
    Generate QR code for the given data.

    Args:
        data: The data to encode in the QR code
        output_dir: Optional directory to save QR image

    Returns:
        Tuple of (relative_file_path, image_bytes)
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    # Try PIL first, fall back to SVG
    image_bytes = None
    try:
        from PIL import Image
        img = qr.make_image(fill_color="black", back_color="white")
        img_bytes = io.BytesIO()
        img.save(img_bytes, format="PNG")
        image_bytes = img_bytes.getvalue()
    except Exception:
        # Fall back to SVG (handles ImportError and broken PIL installs)
        image_bytes = _make_qr_svg(data)

    # Save to disk if directory provided
    file_path = None
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        filename = f"qr_{uuid.uuid4().hex[:8]}.png"
        file_path = output_dir / filename
        with open(file_path, "wb") as f:
            f.write(image_bytes)

    relative_path = str(file_path) if file_path else None
    return relative_path, image_bytes


def generate_short_url_qr(short_url: str, base_url: str = "http://localhost:8000") -> tuple[str, bytes]:
    """
    Generate QR code for a shortened URL.

    Args:
        short_url: The short URL path (e.g., "/l/abc123")
        base_url: The base URL of the service

    Returns:
        Tuple of (relative_file_path, image_bytes)
    """
    full_url = f"{base_url.rstrip('/')}{short_url}"
    output_dir = Path(__file__).parent.parent / "static" / "qr"
    return generate_qr_code(full_url, output_dir)