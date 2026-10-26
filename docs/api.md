# Backend API Reference Contract

The backend exposes a fully typed, documented REST API under the `/api` prefix.

---

## System Endpoints

### `GET /api/health`
Liveness probe checking if the web server is operational.
```json
{
  "status": "healthy",
  "service": "genai-monitoring-api",
  "environment": "development",
  "timestamp": "2026-10-26T14:40:00Z"
}
```

### `GET /api/ready`
Readiness probe verifying database connectivity and local compute acceleration capabilities.
```json
{
  "status": "ready",
  "database_connected": true,
  "local_ml_dependencies": false,
  "compute_device": "cpu",
  "timestamp": "2026-10-26T14:40:00Z"
}
```

---

## Model Management Endpoints

### `GET /api/models`
Returns all registered model configurations.

### `POST /api/models`
Register a new model configuration.
Request body:
```json
{
  "model_id": "distilbert/distilgpt2",
  "name": "DistilGPT-2 Local",
  "provider": "local",
  "task": "text-generation",
  "endpoint_url": null,
  "max_tokens": 150,
  "temperature": 0.7
}
```

### `POST /api/models/{model_id}/health-check`
Runs a live probe against the specified model endpoint. Returns latency and status (`healthy`, `degraded`, `unhealthy`).

---

## Generation & Inference Endpoints

### `POST /api/generate`
Unified inference dispatching to local, hosted, or mock providers. Telemetry is saved to persistent request logs for every invocation.
Request body:
```json
{
  "model_id": "mock-gpt-fast",
  "prompt": "Explain P95 latency.",
  "provider": "mock",
  "max_tokens": 128,
  "temperature": 0.7,
  "simulate_delay_ms": 0,
  "simulate_error": false
}
```
Response body:
```json
{
  "request_id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "model_id": "mock-gpt-fast",
  "provider": "mock",
  "execution_mode": "mock",
  "generated_text": "[MOCK / SIMULATION] ...",
  "latency_ms": 12.5,
  "prompt_tokens": 5,
  "completion_tokens": 35,
  "total_tokens": 40,
  "tokens_estimated": true,
  "estimated_cost_usd": 0.0,
  "is_mock": true,
  "created_at": "2026-10-26T14:40:00Z"
}
```

---

## Operational Monitoring & Metrics

### `GET /api/metrics/summary`
Returns top-level KPIs: `total_requests`, `success_rate`, `error_rate`, `avg_latency_ms`, `p95_latency_ms`, `requests_per_minute`, `total_tokens`, `estimated_cost_usd`, and `active_alerts_count`.

### `GET /api/metrics/timeseries?hours=24&intervals=12`
Returns bucketed time intervals for line and area charts.

### `GET /api/metrics/models`
Returns comparative statistics for each model.

---

## Request Logs & Audit

### `GET /api/logs`
Filterable, paginated request logs.
Query parameters:
- `page`: Page number (default: 1)
- `page_size`: Records per page (default: 20)
- `model_id`: Filter by model ID
- `provider`: Filter by provider (`mock`, `local`, `hosted`)
- `status`: Filter by status (`success`, `failed`)
- `search`: Full text search on prompt and error fields

### `GET /api/logs/export`
Exports filtered request logs as a downloadable standard CSV file (`text/csv`).

---

## Operational Alerts

### `GET /api/alerts?status=active`
List operational threshold alarms.

### `PATCH /api/alerts/{alert_id}`
Update alert status (`acknowledged` or `resolved`).

---

## Model Evaluation

### `POST /api/evaluations/run`
Executes the standard QA and instruction adherence benchmark suite on the selected model. Returns pass rate, completeness score, and case-by-case outputs.
