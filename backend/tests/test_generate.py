from app.database.models import RequestLog

def test_mock_generation_success(client, db):
    payload = {
        "model_id": "mock-gpt-fast",
        "prompt": "Hello world of Generative AI!",
        "provider": "mock",
        "max_tokens": 50,
        "temperature": 0.7
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "[MOCK / SIMULATION]" in data["generated_text"]
    assert data["is_mock"] is True
    assert data["total_tokens"] > 0
    assert data["latency_ms"] >= 0.0

    # Verify request was persisted to database
    log = db.query(RequestLog).filter(RequestLog.id == data["request_id"]).first()
    assert log is not None
    assert log.status == "success"
    assert log.model_id == "mock-gpt-fast"

def test_generation_empty_prompt_validation(client):
    payload = {
        "model_id": "mock-gpt-fast",
        "prompt": "   ",
        "provider": "mock"
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 422

def test_mock_generation_failure_logged(client, db):
    payload = {
        "model_id": "mock-gpt-fast",
        "prompt": "Trigger intentional error",
        "provider": "mock",
        "simulate_error": True
    }
    response = client.post("/api/generate", json=payload)
    assert response.status_code == 500

    # Ensure failed request was still recorded in database!
    failed_log = db.query(RequestLog).filter(
        RequestLog.model_id == "mock-gpt-fast",
        RequestLog.status == "failed"
    ).order_by(RequestLog.timestamp.desc()).first()
    assert failed_log is not None
    assert "Simulated execution error" in failed_log.sanitized_error
