import uuid
from datetime import datetime, timezone
from app.database.models import RequestLog
from app.services.alert_service import calculate_percentile

def test_empty_metrics(client):
    response = client.get("/api/metrics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_requests"] == 0
    assert data["success_rate"] == 100.0
    assert data["error_rate"] == 0.0
    assert data["avg_latency_ms"] == 0.0
    assert data["p95_latency_ms"] == 0.0

def test_metrics_calculation_and_percentiles(client, db):
    # Insert 10 mock logs
    latencies = [100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0, 450.0, 500.0, 1000.0]
    for lat in latencies:
        log = RequestLog(
            id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            model_id="mock-gpt-fast",
            provider="mock",
            execution_mode="mock",
            status="success",
            latency_ms=lat,
            prompt_tokens=10,
            completion_tokens=20,
            total_tokens=30,
            tokens_estimated=True,
            estimated_cost_usd=0.001
        )
        db.add(log)
    db.commit()

    response = client.get("/api/metrics/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_requests"] == 10
    assert data["successful_requests"] == 10
    assert data["failed_requests"] == 0
    assert data["success_rate"] == 100.0
    # Mean of latencies: 3700 / 10 = 370.0
    assert data["avg_latency_ms"] == 370.0
    # P95 of this array
    expected_p95 = round(calculate_percentile(latencies, 95.0), 2)
    assert data["p95_latency_ms"] == expected_p95
