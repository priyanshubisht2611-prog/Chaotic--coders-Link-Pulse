"""FastAPI application for LinkPulse phishing detection."""

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.api.routes import router as scan_router
from backend.api.shortener_routes import router as shortener_router
from backend.api.storage import url_store
from backend.api.analytics_routes import router as analytics_router

app = FastAPI(
    title="LinkPulse API",
    description="ML-powered phishing URL detection and URL shortener",
    version="1.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for QR codes
from pathlib import Path
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Include routers
app.include_router(scan_router)
app.include_router(shortener_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "LinkPulse API",
        "version": "1.1.0"
    }

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.get("/l/{short_code}")
async def redirect_to_url(short_code: str):
    """Redirect short URL to original URL."""
    original_url = url_store.get_original_url(short_code)
    if original_url:
        return RedirectResponse(url=original_url, status_code=302)
    return {"error": "Short URL not found", "short_code": short_code}, 404
