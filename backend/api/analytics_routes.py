"""Analytics routes for LinkPulse dashboard."""

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
import csv
import io
from datetime import datetime, timedelta
from typing import Optional

from backend.api.models import AnalyticsSummary, ClickTrendPoint, LinkPerformanceList, LinkPerformance
from backend.api.storage import url_store

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
async def get_summary():
    """Get analytics summary."""
    links = url_store.list_links()
    total_clicks = sum(link.clicks for link in links)
    active_links = len([l for l in links if l.clicks > 0])
    
    return AnalyticsSummary(
        total_clicks=total_clicks,
        active_links=active_links,
        total_links=len(links)
    )

@router.get("/trends", response_model=list[ClickTrendPoint])
async def get_trends(
    start: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="End date YYYY-MM-DD")
):
    """Get daily click trends."""
    try:
        # Validate dates
        if start:
            datetime.strptime(start, "%Y-%m-%d")
        if end:
            datetime.strptime(end, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    events = url_store.get_all_click_events(start_date=start, end_date=end)
    
    # Aggregate by date
    daily_counts = {}
    for event in events:
        date_str = event["timestamp"][:10]  # YYYY-MM-DD
        daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
    
    # Create sorted list
    trends = [
        ClickTrendPoint(date=date, clicks=count)
        for date, count in sorted(daily_counts.items())
    ]
    
    return trends

@router.get("/links", response_model=LinkPerformanceList)
async def get_links_performance(
    search: Optional[str] = Query(None, description="Search in URL or code"),
    sort_by: str = Query("created_at", description="Sort by: created_at, clicks, short_code"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get per-link performance data."""
    links = url_store.list_links()
    
    # Filter by search
    if search:
        search_lower = search.lower()
        links = [l for l in links if search_lower in l.original_url.lower() or search_lower in l.short_code.lower()]
    
    # Sort
    reverse = sort_order.lower() == "desc"
    if sort_by == "clicks":
        links.sort(key=lambda x: x.clicks, reverse=reverse)
    elif sort_by == "short_code":
        links.sort(key=lambda x: x.short_code, reverse=reverse)
    else:  # created_at
        links.sort(key=lambda x: x.created_at, reverse=reverse)
    
    # Paginate
    total = len(links)
    links = links[offset:offset + limit]
    
    performance = [
        LinkPerformance(
            short_code=link.short_code,
            original_url=link.original_url,
            created_at=link.created_at.isoformat().replace("+00:00", "Z"),
            clicks=link.clicks,
            short_url=f"/l/{link.short_code}"
        )
        for link in links
    ]
    
    return LinkPerformanceList(links=performance, total=total)

@router.get("/export")
async def export_analytics(
    format: str = Query("csv", description="Export format"),
    start: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="End date YYYY-MM-DD")
):
    """Export analytics data as CSV."""
    if format.lower() != "csv":
        raise HTTPException(status_code=400, detail="Only CSV format is supported")
    
    links = url_store.list_links()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(["short_code", "original_url", "created_at", "clicks", "short_url"])
    
    # Data
    for link in links:
        writer.writerow([
            link.short_code,
            link.original_url,
            link.created_at.isoformat().replace("+00:00", "Z"),
            link.clicks,
            f"/l/{link.short_code}"
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=linkpulse_analytics.csv"}
    )
