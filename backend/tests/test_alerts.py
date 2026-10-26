import uuid
from datetime import datetime, timezone
from app.database.models import RequestLog, AlertRecord
from app.services.alert_service import AlertService

def test_alert_threshold_trigger(client, db):
    # Insert 6 failed requests to trigger high error rate & consecutive failures
    for _ in range(6):
        db.add(RequestLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            model_id="mock-gpt-fast",
            provider="mock",
            execution_mode="mock",
            status="failed",
            latency_ms=50.0,
            sanitized_error="Simulated continuous outage"
        ))
    db.commit()

    # Trigger evaluation
    AlertService.evaluate_operational_thresholds(db)

    # Check alert was created
    alerts = db.query(AlertRecord).filter(AlertRecord.status == "active").all()
    assert len(alerts) > 0
    rule_names = [a.rule_name for a in alerts]
    assert "HIGH_ERROR_RATE" in rule_names or "CONSECUTIVE_FAILURES" in rule_names

    # Test acknowledging alert via API
    alert_to_ack = alerts[0]
    res = client.patch(f"/api/alerts/{alert_to_ack.id}", json={"status": "acknowledged"})
    assert res.status_code == 200
    assert res.json()["status"] == "acknowledged"
