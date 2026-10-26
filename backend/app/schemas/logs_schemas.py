from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RequestLogItem(BaseModel):
    id: str
    timestamp: datetime
    model_id: str
    provider: str
    execution_mode: str
    status: str
    latency_ms: float
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    tokens_estimated: bool
    estimated_cost_usd: float
    prompt_preview: Optional[str] = None
    response_preview: Optional[str] = None
    error_type: Optional[str] = None
    sanitized_error: Optional[str] = None
    http_status: Optional[int] = None
    correlation_id: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedLogsResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[RequestLogItem]
