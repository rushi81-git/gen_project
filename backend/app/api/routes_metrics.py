from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.metrics_service import MetricsService
from app.schemas.metrics_schemas import (
    MetricsSummaryResponse,
    TimeSeriesPoint,
    ModelComparisonItem,
    MetricsOverview
)

router = APIRouter(prefix="/metrics", tags=["Metrics"])

@router.get("/summary", response_model=MetricsSummaryResponse)
def get_metrics_summary(db: Session = Depends(get_db)):
    return MetricsService.get_summary(db)

@router.get("/timeseries", response_model=List[TimeSeriesPoint])
def get_timeseries_metrics(
    hours: int = Query(24, ge=1, le=168, description="Historical lookback window in hours"),
    intervals: int = Query(12, ge=4, le=48, description="Number of aggregated time points"),
    db: Session = Depends(get_db)
):
    return MetricsService.get_timeseries(db, hours=hours, intervals=intervals)

@router.get("/models", response_model=List[ModelComparisonItem])
def get_model_comparison(db: Session = Depends(get_db)):
    return MetricsService.get_model_comparison(db)

@router.get("/overview", response_model=MetricsOverview)
def get_metrics_overview(db: Session = Depends(get_db)):
    return MetricsService.get_overview(db)
