from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.database.models import RequestLog, ModelConfig, AlertRecord
from app.schemas.metrics_schemas import (
    MetricsSummaryResponse,
    TimeSeriesPoint,
    ModelComparisonItem,
    MetricsOverview
)
from app.services.alert_service import calculate_percentile

class MetricsService:
    """
    Computes accurate, non-invented operational metrics from stored request logs.
    """

    @classmethod
    def get_summary(cls, db: Session) -> MetricsSummaryResponse:
        total_requests = db.query(RequestLog).count()
        if total_requests == 0:
            return MetricsSummaryResponse(
                total_requests=0,
                successful_requests=0,
                failed_requests=0,
                success_rate=100.0,
                error_rate=0.0,
                avg_latency_ms=0.0,
                p95_latency_ms=0.0,
                min_latency_ms=0.0,
                max_latency_ms=0.0,
                requests_per_minute=0.0,
                total_prompt_tokens=0,
                total_completion_tokens=0,
                total_tokens=0,
                estimated_cost_usd=0.0,
                active_models_count=db.query(ModelConfig).count(),
                active_alerts_count=db.query(AlertRecord).filter(AlertRecord.status == "active").count()
            )

        successful_requests = db.query(RequestLog).filter(RequestLog.status == "success").count()
        failed_requests = total_requests - successful_requests

        success_rate = round((successful_requests / total_requests) * 100.0, 2)
        error_rate = round((failed_requests / total_requests) * 100.0, 2)

        # Latencies
        successful_logs = db.query(RequestLog.latency_ms).filter(RequestLog.status == "success").all()
        latencies = [l[0] for l in successful_logs]

        if latencies:
            avg_latency_ms = round(sum(latencies) / len(latencies), 2)
            p95_latency_ms = round(calculate_percentile(latencies, 95.0), 2)
            min_latency_ms = round(min(latencies), 2)
            max_latency_ms = round(max(latencies), 2)
        else:
            avg_latency_ms = 0.0
            p95_latency_ms = 0.0
            min_latency_ms = 0.0
            max_latency_ms = 0.0

        # Rate over last 1 hour
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_count = db.query(RequestLog).filter(RequestLog.timestamp >= one_hour_ago).count()
        requests_per_minute = round(recent_count / 60.0, 2)

        # Tokens & costs
        totals = db.query(
            func.coalesce(func.sum(RequestLog.prompt_tokens), 0),
            func.coalesce(func.sum(RequestLog.completion_tokens), 0),
            func.coalesce(func.sum(RequestLog.total_tokens), 0),
            func.coalesce(func.sum(RequestLog.estimated_cost_usd), 0.0)
        ).first()

        total_prompt_tokens = int(totals[0])
        total_completion_tokens = int(totals[1])
        total_tokens = int(totals[2])
        estimated_cost_usd = round(float(totals[3]), 4)

        active_models_count = db.query(ModelConfig).count()
        active_alerts_count = db.query(AlertRecord).filter(AlertRecord.status == "active").count()

        return MetricsSummaryResponse(
            total_requests=total_requests,
            successful_requests=successful_requests,
            failed_requests=failed_requests,
            success_rate=success_rate,
            error_rate=error_rate,
            avg_latency_ms=avg_latency_ms,
            p95_latency_ms=p95_latency_ms,
            min_latency_ms=min_latency_ms,
            max_latency_ms=max_latency_ms,
            requests_per_minute=requests_per_minute,
            total_prompt_tokens=total_prompt_tokens,
            total_completion_tokens=total_completion_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=estimated_cost_usd,
            active_models_count=active_models_count,
            active_alerts_count=active_alerts_count
        )

    @classmethod
    def get_timeseries(cls, db: Session, hours: int = 24, intervals: int = 12) -> List[TimeSeriesPoint]:
        now = datetime.now(timezone.utc)
        step_minutes = max(5, (hours * 60) // intervals)
        start_time = now - timedelta(hours=hours)

        logs = db.query(RequestLog).filter(RequestLog.timestamp >= start_time).order_by(RequestLog.timestamp.asc()).all()

        points: List[TimeSeriesPoint] = []
        for i in range(intervals):
            b_start = start_time + timedelta(minutes=i * step_minutes)
            b_end = b_start + timedelta(minutes=step_minutes)

            b_logs = [l for l in logs if b_start <= l.timestamp.replace(tzinfo=timezone.utc if l.timestamp.tzinfo is None else None) < b_end]
            req_count = len(b_logs)
            succ_count = sum(1 for l in b_logs if l.status == "success")
            fail_count = req_count - succ_count
            tok_count = sum(l.total_tokens for l in b_logs)
            succ_lats = [l.latency_ms for l in b_logs if l.status == "success"]
            avg_lat = round(sum(succ_lats) / len(succ_lats), 2) if succ_lats else 0.0

            points.append(
                TimeSeriesPoint(
                    timestamp=b_start.strftime("%H:%M"),
                    requests=req_count,
                    success=succ_count,
                    failed=fail_count,
                    avg_latency_ms=avg_lat,
                    tokens=tok_count
                )
            )

        return points

    @classmethod
    def get_model_comparison(cls, db: Session) -> List[ModelComparisonItem]:
        models = db.query(ModelConfig).all()
        results: List[ModelComparisonItem] = []

        for m in models:
            m_logs = db.query(RequestLog).filter(RequestLog.model_id == m.model_id).all()
            total = len(m_logs)
            if total == 0:
                results.append(
                    ModelComparisonItem(
                        model_id=m.model_id,
                        provider=m.provider,
                        total_requests=0,
                        success_rate=100.0,
                        avg_latency_ms=0.0,
                        p95_latency_ms=0.0,
                        total_tokens=0,
                        estimated_cost_usd=0.0,
                        health_status=m.health_status
                    )
                )
                continue

            succ = [l for l in m_logs if l.status == "success"]
            success_rate = round((len(succ) / total) * 100.0, 2)
            succ_lats = [l.latency_ms for l in succ]
            avg_lat = round(sum(succ_lats) / len(succ_lats), 2) if succ_lats else 0.0
            p95_lat = round(calculate_percentile(succ_lats, 95.0), 2)
            total_toks = sum(l.total_tokens for l in m_logs)
            cost = round(sum(l.estimated_cost_usd for l in m_logs), 4)

            results.append(
                ModelComparisonItem(
                    model_id=m.model_id,
                    provider=m.provider,
                    total_requests=total,
                    success_rate=success_rate,
                    avg_latency_ms=avg_lat,
                    p95_latency_ms=p95_lat,
                    total_tokens=total_toks,
                    estimated_cost_usd=cost,
                    health_status=m.health_status
                )
            )

        return results

    @classmethod
    def get_overview(cls, db: Session) -> MetricsOverview:
        return MetricsOverview(
            summary=cls.get_summary(db),
            timeseries=cls.get_timeseries(db),
            models=cls.get_model_comparison(db)
        )
