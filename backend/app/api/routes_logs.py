import io
import csv
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.database.models import RequestLog
from app.schemas.logs_schemas import PaginatedLogsResponse, RequestLogItem

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("", response_model=PaginatedLogsResponse)
def get_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    model_id: Optional[str] = Query(None, description="Filter by model identifier"),
    provider: Optional[str] = Query(None, description="Filter by provider (mock, local, hosted)"),
    status: Optional[str] = Query(None, description="Filter by status (success, failed)"),
    min_latency: Optional[float] = Query(None, description="Filter minimum latency ms"),
    max_latency: Optional[float] = Query(None, description="Filter maximum latency ms"),
    search: Optional[str] = Query(None, description="Search prompt or error"),
    db: Session = Depends(get_db)
):
    query = db.query(RequestLog)

    if model_id:
        query = query.filter(RequestLog.model_id == model_id)
    if provider:
        query = query.filter(RequestLog.provider == provider)
    if status:
        query = query.filter(RequestLog.status == status)
    if min_latency is not None:
        query = query.filter(RequestLog.latency_ms >= min_latency)
    if max_latency is not None:
        query = query.filter(RequestLog.latency_ms <= max_latency)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (RequestLog.prompt_preview.ilike(search_filter)) |
            (RequestLog.sanitized_error.ilike(search_filter)) |
            (RequestLog.id.ilike(search_filter))
        )

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    items = query.order_by(desc(RequestLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedLogsResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=items
    )

@router.get("/export")
def export_logs_csv(
    model_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(1000, ge=1, le=5000),
    db: Session = Depends(get_db)
):
    """
    Exports filtered logs as a standard downloadable CSV file.
    """
    query = db.query(RequestLog)
    if model_id:
        query = query.filter(RequestLog.model_id == model_id)
    if status:
        query = query.filter(RequestLog.status == status)

    logs = query.order_by(desc(RequestLog.timestamp)).limit(limit).all()

    # Create in-memory CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "request_id",
        "timestamp_utc",
        "model_id",
        "provider",
        "status",
        "latency_ms",
        "prompt_tokens",
        "completion_tokens",
        "total_tokens",
        "tokens_estimated",
        "estimated_cost_usd",
        "error_type",
        "sanitized_error",
        "http_status"
    ])

    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp.isoformat() if log.timestamp else "",
            log.model_id,
            log.provider,
            log.status,
            log.latency_ms,
            log.prompt_tokens,
            log.completion_tokens,
            log.total_tokens,
            log.tokens_estimated,
            log.estimated_cost_usd,
            log.error_type or "",
            log.sanitized_error or "",
            log.http_status or ""
        ])

    output.seek(0)
    filename = f"inference_request_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/{request_id}", response_model=RequestLogItem)
def get_log_by_id(request_id: str, db: Session = Depends(get_db)):
    log = db.query(RequestLog).filter(RequestLog.id == request_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log entry not found")
    return log
