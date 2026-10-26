from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class AlertItemResponse(BaseModel):
    id: int
    rule_name: str
    severity: str
    message: str
    trigger_value: float
    threshold_value: float
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: Literal["active", "acknowledged", "resolved"]
