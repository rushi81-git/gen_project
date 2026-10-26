import time
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.database.models import ModelConfig
from app.schemas.model_schemas import (
    ModelConfigCreate,
    ModelConfigUpdate,
    ModelConfigResponse,
    HealthCheckResponse
)
from app.services.mock_provider import MockProvider
from app.services.local_provider import LocalProvider
from app.services.hosted_provider import HostedProvider

router = APIRouter(prefix="/models", tags=["Models"])

@router.get("", response_model=List[ModelConfigResponse])
def list_models(db: Session = Depends(get_db)):
    return db.query(ModelConfig).order_by(ModelConfig.id.asc()).all()

@router.post("", response_model=ModelConfigResponse, status_code=status.HTTP_201_CREATED)
def create_model(model_in: ModelConfigCreate, db: Session = Depends(get_db)):
    existing = db.query(ModelConfig).filter(ModelConfig.model_id == model_in.model_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Model with ID '{model_in.model_id}' is already registered."
        )

    model = ModelConfig(
        model_id=model_in.model_id,
        name=model_in.name,
        provider=model_in.provider,
        task=model_in.task,
        endpoint_url=model_in.endpoint_url,
        max_tokens=model_in.max_tokens,
        temperature=model_in.temperature,
        status="ready" if model_in.provider == "mock" else "configured",
        health_status="healthy" if model_in.provider == "mock" else "unknown"
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model

@router.get("/{model_id}", response_model=ModelConfigResponse)
def get_model(model_id: str, db: Session = Depends(get_db)):
    model = db.query(ModelConfig).filter(ModelConfig.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model configuration not found")
    return model

@router.patch("/{model_id}", response_model=ModelConfigResponse)
def update_model(model_id: str, update_in: ModelConfigUpdate, db: Session = Depends(get_db)):
    model = db.query(ModelConfig).filter(ModelConfig.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model configuration not found")

    if update_in.name is not None:
        model.name = update_in.name
    if update_in.endpoint_url is not None:
        model.endpoint_url = update_in.endpoint_url
    if update_in.max_tokens is not None:
        model.max_tokens = update_in.max_tokens
    if update_in.temperature is not None:
        model.temperature = update_in.temperature

    model.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(model)
    return model

@router.post("/{model_id}/health-check", response_model=HealthCheckResponse)
async def check_model_health(model_id: str, db: Session = Depends(get_db)):
    model = db.query(ModelConfig).filter(ModelConfig.model_id == model_id).first()
    if not model:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model configuration not found")

    start_time = time.perf_counter()
    check_status = "healthy"
    message = "Model responded normally"

    try:
        if model.provider == "mock":
            await MockProvider.generate(model_id, prompt="health_check_ping", max_tokens=10)
            model.status = "ready"
            model.health_status = "healthy"
            model.last_error = None
        elif model.provider == "local":
            if not LocalProvider.is_available():
                check_status = "unavailable"
                message = "Local ML dependencies (torch/transformers) not installed"
                model.status = "unavailable"
                model.health_status = "unhealthy"
                model.last_error = message
            else:
                await LocalProvider.generate(model_id, prompt="ping", max_tokens=5)
                model.status = "ready"
                model.health_status = "healthy"
                model.last_error = None
        elif model.provider == "hosted":
            await HostedProvider.generate(model_id, prompt="ping", endpoint_url=model.endpoint_url, max_tokens=5)
            model.status = "ready"
            model.health_status = "healthy"
            model.last_error = None
    except Exception as e:
        check_status = "unhealthy"
        message = str(e)
        model.status = "failed"
        model.health_status = "unhealthy"
        model.last_error = message[:500]

    latency_ms = round((time.perf_counter() - start_time) * 1000.0, 2)
    model.last_health_check = datetime.now(timezone.utc)
    db.commit()

    return HealthCheckResponse(
        model_id=model_id,
        provider=model.provider,
        status=check_status,
        latency_ms=latency_ms,
        message=message,
        timestamp=model.last_health_check
    )
