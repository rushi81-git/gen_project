from pydantic import BaseModel
from typing import List, Optional

class MetricsSummaryResponse(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    success_rate: float
    error_rate: float
    avg_latency_ms: float
    p95_latency_ms: float
    min_latency_ms: float
    max_latency_ms: float
    requests_per_minute: float
    total_prompt_tokens: int
    total_completion_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    active_models_count: int
    active_alerts_count: int

class TimeSeriesPoint(BaseModel):
    timestamp: str  # ISO string bucket e.g. "2026-10-26T14:00:00Z"
    requests: int
    success: int
    failed: int
    avg_latency_ms: float
    tokens: int

class ModelComparisonItem(BaseModel):
    model_id: str
    provider: str
    total_requests: int
    success_rate: float
    avg_latency_ms: float
    p95_latency_ms: float
    total_tokens: int
    estimated_cost_usd: float
    health_status: str

class MetricsOverview(BaseModel):
    summary: MetricsSummaryResponse
    timeseries: List[TimeSeriesPoint]
    models: List[ModelComparisonItem]
