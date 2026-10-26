import uuid
from datetime import datetime, timezone
from app.database.models import RequestLog

def test_logs_pagination_and_filtering(client, db):
    # Insert dummy logs with distinct status
    id_succ = str(uuid.uuid4())
    id_fail = str(uuid.uuid4())
    db.add(RequestLog(
        id=id_succ,
        timestamp=datetime.now(timezone.utc),
        model_id="mock-gpt-fast",
        provider="mock",
        execution_mode="mock",
        status="success",
        latency_ms=120.0,
        prompt_tokens=5,
        completion_tokens=15,
        total_tokens=20
    ))
    db.add(RequestLog(
        id=id_fail,
        timestamp=datetime.now(timezone.utc),
        model_id="mock-gpt-fast",
        provider="mock",
        execution_mode="mock",
        status="failed",
        latency_ms=45.0,
        sanitized_error="Simulated network failure"
    ))
    db.commit()

    # Query with status=failed
    res_failed = client.get("/api/logs?status=failed")
    assert res_failed.status_code == 200
    data = res_failed.json()
    assert data["total"] >= 1
    assert all(item["status"] == "failed" for item in data["items"])

    # Query with search
    res_search = client.get("/api/logs?search=network")
    assert res_search.status_code == 200
    assert len(res_search.json()["items"]) >= 1

def test_logs_csv_export(client, db):
    res = client.get("/api/logs/export")
    assert res.status_code == 200
    assert res.headers["content-type"] == "text/csv; charset=utf-8"
    assert "request_id,timestamp_utc,model_id" in res.text
