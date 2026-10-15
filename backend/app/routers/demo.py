from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import InventoryBatch, Destination, Warehouse, OptimizationRun
from app.services.demo_data import seed_demo_database

router = APIRouter(prefix="/api/demo", tags=["Demo Workspace Management"])

@router.get("/status")
def get_demo_status(db: Session = Depends(get_db)):
    batch_count = db.query(InventoryBatch).count()
    dest_count = db.query(Destination).count()
    wh_count = db.query(Warehouse).count()
    run_count = db.query(OptimizationRun).count()
    return {
        "is_seeded": batch_count > 0,
        "batch_count": batch_count,
        "destination_count": dest_count,
        "warehouse_count": wh_count,
        "run_count": run_count,
        "label": "DEMO DATA — SIMULATED"
    }

@router.post("/seed")
def seed_demo(db: Session = Depends(get_db)):
    seed_demo_database(db, overwrite=True)
    return {
        "status": "success",
        "message": "Demo workspace successfully loaded with 12 batches, 5 destinations, and 3 warehouses.",
        "label": "DEMO DATA — SIMULATED"
    }

@router.post("/reset")
def reset_demo(db: Session = Depends(get_db)):
    seed_demo_database(db, overwrite=True)
    return {
        "status": "success",
        "message": "Workspace has been safely reset to initial demo state."
    }
