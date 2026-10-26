def test_evaluation_benchmark_run(client, db):
    payload = {
        "model_id": "mock-gpt-fast",
        "provider": "mock",
        "dataset_name": "standard_qa_benchmark"
    }
    response = client.post("/api/evaluations/run", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["model_id"] == "mock-gpt-fast"
    assert data["total_prompts"] > 0
    assert "pass_rate" in data
    assert "avg_completeness" in data
    assert len(data["details"]) == data["total_prompts"]

    # Verify listing runs
    list_res = client.get("/api/evaluations")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
