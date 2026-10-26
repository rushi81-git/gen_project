from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class ModelConfigBase(BaseModel):
    model_id: str = Field(..., description="Hugging Face repo or identifier, e.g. distilbert/distilgpt2")
    name: str = Field(..., description="Human-readable model name")
    provider: Literal["local", "hosted", "mock"] = Field(..., description="Model provider/execution type")
    task: str = Field(default="text-generation", description="Model task")
    endpoint_url: Optional[str] = Field(default=None, description="Custom endpoint URL for hosted models")
    max_tokens: int = Field(default=150, ge=1, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)

class ModelConfigCreate(ModelConfigBase):
    pass

class ModelConfigUpdate(BaseModel):
    name: Optional[str] = None
    endpoint_url: Optional[str] = None
    max_tokens: Optional[int] = Field(default=None, ge=1, le=4096)
    temperature: Optional[float] = Field(default=None, ge=0.0, le=2.0)

class ModelConfigResponse(ModelConfigBase):
    id: int
    status: str
    health_status: str
    last_health_check: Optional[datetime] = None
    last_error: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class HealthCheckResponse(BaseModel):
    model_id: str
    provider: str
    status: str
    latency_ms: float
    message: str
    timestamp: datetime
