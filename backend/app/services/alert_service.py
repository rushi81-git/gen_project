from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database.models import RequestLog, AlertRecord
from app.core.config import settings
from app.core.logging import logger

def calculate_percentile(values: list, percentile: float) -> float:
    # ponytail: stdlib sorted percentile, zero dependencies
    if not values:
        return 0.0
    sorted_vals = sorted(values)
    k = (len(sorted_vals) - 1) * (percentile / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_vals) - 1)
    d = k - f
    return float(sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * d)

class AlertService:
    """
    Evaluates operational metrics and triggers deduplicated threshold alerts.
    """

    @classmethod
    def evaluate_operational_thresholds(cls, db: Session):
        # Fetch last 50 requests to check rolling window
        recent_logs = db.query(RequestLog).order_by(desc(RequestLog.timestamp)).limit(50).all()
        if not recent_logs:
            return

        total_recent = len(recent_logs)
        failed_recent = sum(1 for r in recent_logs if r.status == "failed")
        error_rate = (failed_recent / total_recent) * 100.0

        # Rule 1: High Error Rate
        if total_recent >= 5 and error_rate >= settings.ALERT_ERROR_RATE_THRESHOLD:
            cls._create_or_retain_alert(
                db=db,
                rule_name="HIGH_ERROR_RATE",
                severity="critical" if error_rate >= 25.0 else "warning",
                message=f"Rolling error rate reached {error_rate:.1f}% across recent {total_recent} requests (threshold: {settings.ALERT_ERROR_RATE_THRESHOLD}%).",
                trigger_value=error_rate,
                threshold_value=settings.ALERT_ERROR_RATE_THRESHOLD
            )

        # Rule 2: Consecutive Failures
        consecutive_failures = 0
        for r in recent_logs:
            if r.status == "failed":
                consecutive_failures += 1
            else:
                break

        if consecutive_failures >= settings.ALERT_CONSECUTIVE_FAILURES_THRESHOLD:
            cls._create_or_retain_alert(
                db=db,
                rule_name="CONSECUTIVE_FAILURES",
                severity="critical",
                message=f"Detected {consecutive_failures} consecutive inference failures across models.",
                trigger_value=float(consecutive_failures),
                threshold_value=float(settings.ALERT_CONSECUTIVE_FAILURES_THRESHOLD)
            )

        # Rule 3: High P95 Latency on successful requests
        successful_latencies = [r.latency_ms for r in recent_logs if r.status == "success"]
        if len(successful_latencies) >= 5:
            p95 = round(calculate_percentile(successful_latencies, 95.0), 2)
            if p95 >= settings.ALERT_P95_LATENCY_THRESHOLD_MS:
                cls._create_or_retain_alert(
                    db=db,
                    rule_name="HIGH_P95_LATENCY",
                    severity="warning",
                    message=f"Rolling P95 latency reached {p95:.1f}ms (threshold: {settings.ALERT_P95_LATENCY_THRESHOLD_MS}ms).",
                    trigger_value=p95,
                    threshold_value=settings.ALERT_P95_LATENCY_THRESHOLD_MS
                )

    @classmethod
    def _create_or_retain_alert(
        cls,
        db: Session,
        rule_name: str,
        severity: str,
        message: str,
        trigger_value: float,
        threshold_value: float
    ):
        # Prevent spamming alert creation if an active alert already exists for this rule
        existing = db.query(AlertRecord).filter(
            AlertRecord.rule_name == rule_name,
            AlertRecord.status == "active"
        ).first()

        if existing:
            # Update trigger value and message
            existing.trigger_value = trigger_value
            existing.message = message
            db.commit()
            return

        alert = AlertRecord(
            rule_name=rule_name,
            severity=severity,
            message=message,
            trigger_value=trigger_value,
            threshold_value=threshold_value,
            status="active"
        )
        db.add(alert)
        db.commit()
        logger.warning(f"Operational Alert triggered: [{severity.upper()}] {message}")
