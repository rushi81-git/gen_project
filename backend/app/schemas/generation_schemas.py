from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class GenerationRequest(BaseModel):
    model_id: str = Field(..., description="Target model ID")
    prompt: str = Field(..., min_length=1, max_length=10000, description="Input user prompt")
    provider: Literal["local", "hosted", "mock"] = Field(default="mock", description="Execution mode")
    max_tokens: Optional[int] = Field(default=128, ge=1, le=2048)
    temperature: Optional[float] = Field(default=0.7, ge=0.0, le=2.0)
    # Testing / mock controls
    simulate_delay_ms: Optional[int] = Field(default=0, ge=0, le=10000)
    simulate_error: Optional[bool] = Field(default=False)

class GenerationResponse(BaseModel):
    request_id: str
    model_id: str
    provider: str
    execution_mode: str
    generated_text: str
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    tokens_estimated: bool
    estimated_cost_usd: float
    is_mock: bool
    created_at: datetime
