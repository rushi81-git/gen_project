from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database.session import get_db
from app.database.models import AlertRecord
from app.schemas.alerts_schemas import AlertItemResponse, AlertUpdate
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertItemResponse])
def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(AlertRecord)
    if status_filter:
        query = query.filter(AlertRecord.status == status_filter)
    return query.order_by(desc(AlertRecord.created_at)).limit(100).all()

@router.patch("/{alert_id}", response_model=AlertItemResponse)
def update_alert(alert_id: int, payload: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert record not found")

    alert.status = payload.status
    if payload.status in ["acknowledged", "resolved"]:
        alert.acknowledged_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(alert)
    return alert

@router.post("/evaluate")
def trigger_alert_evaluation(db: Session = Depends(get_db)):
    AlertService.evaluate_operational_thresholds(db)
    return {"status": "ok", "message": "Operational alert thresholds evaluated"}
