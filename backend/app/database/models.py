import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, Index
from app.database.session import Base

def utc_now():
    return datetime.now(timezone.utc)

class ModelConfig(Base):
    __tablename__ = "model_configs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)  # local, hosted, mock
    task = Column(String(100), default="text-generation")
    endpoint_url = Column(String(500), nullable=True)
    status = Column(String(50), default="configured")  # configured, loading, ready, degraded, unavailable, failed
    health_status = Column(String(50), default="unknown")  # healthy, degraded, unhealthy, unknown
    last_health_check = Column(DateTime, nullable=True)
    last_error = Column(Text, nullable=True)
    max_tokens = Column(Integer, default=150)
    temperature = Column(Float, default=0.7)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class RequestLog(Base):
    __tablename__ = "request_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=utc_now, index=True, nullable=False)
    model_id = Column(String(255), index=True, nullable=False)
    provider = Column(String(50), nullable=False)
    execution_mode = Column(String(50), nullable=False)
    status = Column(String(50), index=True, nullable=False)  # success, failed
    latency_ms = Column(Float, nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    tokens_estimated = Column(Boolean, default=False)
    estimated_cost_usd = Column(Float, default=0.0)
    prompt_preview = Column(Text, nullable=True)
    response_preview = Column(Text, nullable=True)
    error_type = Column(String(100), nullable=True)
    sanitized_error = Column(Text, nullable=True)
    http_status = Column(Integer, nullable=True)
    correlation_id = Column(String(100), nullable=True)

    __table_args__ = (
        Index("idx_request_status_time", "status", "timestamp"),
        Index("idx_request_model_time", "model_id", "timestamp"),
    )


class AlertRecord(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rule_name = Column(String(100), nullable=False)
    severity = Column(String(50), default="warning")  # info, warning, critical
    message = Column(Text, nullable=False)
    trigger_value = Column(Float, nullable=False)
    threshold_value = Column(Float, nullable=False)
    status = Column(String(50), default="active", index=True)  # active, acknowledged, resolved
    created_at = Column(DateTime, default=utc_now, index=True)
    acknowledged_at = Column(DateTime, nullable=True)


class EvaluationRecord(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=utc_now, index=True)
    model_id = Column(String(255), index=True, nullable=False)
    provider = Column(String(50), nullable=False)
    dataset_name = Column(String(100), nullable=False)
    total_prompts = Column(Integer, nullable=False)
    passed_prompts = Column(Integer, nullable=False)
    pass_rate = Column(Float, nullable=False)
    avg_completeness = Column(Float, nullable=False)
    avg_latency_ms = Column(Float, nullable=False)
    empty_or_malformed_count = Column(Integer, default=0)
    details_json = Column(Text, nullable=False)
