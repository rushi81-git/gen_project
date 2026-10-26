from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.core.config import settings
from app.services.local_provider import LocalProvider

router = APIRouter(tags=["System"])

@router.get("/health")
def health_check():
    """
    Liveness probe: verifies that the FastAPI web server is alive.
    """
    return {
        "status": "healthy",
        "service": "genai-monitoring-api",
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness probe: validates database connectivity and local environment capabilities.
    """
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection check failed: {str(exc)}"
        )

    local_ml_available = LocalProvider.is_available()
    device = LocalProvider.get_device()

    return {
        "status": "ready",
        "database_connected": db_connected,
        "local_ml_dependencies": local_ml_available,
        "compute_device": device,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
