from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.generation_schemas import GenerationRequest, GenerationResponse
from app.services.model_adapter import ModelAdapter

router = APIRouter(tags=["Generation"])

@router.post("/generate", response_model=GenerationResponse)
async def generate_completion(request: GenerationRequest, db: Session = Depends(get_db)):
    """
    Executes model generation across Local, Hosted, or Mock providers.
    All attempts (including failures) are measured and recorded in persistent logs.
    """
    if not request.prompt or len(request.prompt.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Prompt text cannot be empty."
        )

    try:
        response = await ModelAdapter.execute_generation(request, db)
        return response
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
