from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Destination, Warehouse, DemandRecord, TransportRoute
from app.schemas.schemas import DestinationResponse, WarehouseResponse

router = APIRouter(prefix="/api", tags=["Destinations and Logistics"])

@router.get("/destinations", response_model=List[DestinationResponse])
def get_destinations(db: Session = Depends(get_db)):
    return db.query(Destination).all()

@router.get("/warehouses", response_model=List[WarehouseResponse])
def get_warehouses(db: Session = Depends(get_db)):
    return db.query(Warehouse).all()

@router.get("/routes")
def get_routes(db: Session = Depends(get_db)):
    routes = db.query(TransportRoute).all()
    results = []
    for r in routes:
        results.append({
            "id": r.id,
            "warehouse_id": r.warehouse_id,
            "warehouse_name": r.warehouse.name if r.warehouse else "Warehouse",
            "destination_id": r.destination_id,
            "destination_name": r.destination.name if r.destination else "Destination",
            "travel_time_hours": r.travel_time_hours,
            "transport_cost_per_kg": r.transport_cost_per_kg,
            "vehicle_capacity_kg": r.vehicle_capacity_kg
        })
    return results
