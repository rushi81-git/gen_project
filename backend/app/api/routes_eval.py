from typing import List, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.eval_schemas import EvaluationRunRequest, EvaluationResponse
from app.services.eval_service import EvaluationService

router = APIRouter(prefix="/evaluations", tags=["Evaluation"])

@router.get("", response_model=List[Any])
def list_evaluations(db: Session = Depends(get_db)):
    return EvaluationService.list_evaluations(db)

@router.post("/run", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
async def run_evaluation(payload: EvaluationRunRequest, db: Session = Depends(get_db)):
    """
    Executes a transparent QA and instruction benchmark on the specified model.
    """
    result = await EvaluationService.run_benchmark(payload, db)
    return result
