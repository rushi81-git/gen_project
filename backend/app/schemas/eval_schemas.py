from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class EvaluationRunRequest(BaseModel):
    model_id: str = Field(..., description="Target model to evaluate")
    provider: str = Field(default="mock", description="Provider mode: mock, hosted, or local")
    dataset_name: Optional[str] = Field(default="standard_qa_benchmark", description="Benchmark dataset")

class EvaluationDetailItem(BaseModel):
    prompt: str
    expected_contains: List[str]
    generated_text: str
    passed: bool
    completeness_score: float
    latency_ms: float
    error: Optional[str] = None

class EvaluationResponse(BaseModel):
    id: str
    timestamp: datetime
    model_id: str
    provider: str
    dataset_name: str
    total_prompts: int
    passed_prompts: int
    pass_rate: float
    avg_completeness: float
    avg_latency_ms: float
    empty_or_malformed_count: int
    details: List[EvaluationDetailItem]

    class Config:
        from_attributes = True
