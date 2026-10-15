from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import AllocationItem, InventoryBatch, OptimizationRun
from app.schemas.schemas import DispatchUpdateRequest

router = APIRouter(prefix="/api/dispatch", tags=["Dispatch Planning"])

@router.get("")
def get_dispatch_plan(db: Session = Depends(get_db)):
    latest_run = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).first()
    if not latest_run:
        return {"run_id": None, "allocations": []}

    items = db.query(AllocationItem).filter(AllocationItem.run_id == latest_run.id).order_by(AllocationItem.dispatch_priority.asc()).all()
    results = []
    for item in items:
        results.append({
            "id": item.id,
            "batch_id": item.batch_id,
            "batch_code": item.batch.batch_code if item.batch else f"B-{item.batch_id}",
            "commodity": item.batch.commodity if item.batch else "Produce",
            "origin_warehouse": item.batch.warehouse.name if item.batch and item.batch.warehouse else "Warehouse",
            "destination_id": item.destination_id,
            "destination_name": item.destination.name if item.destination else "Destination",
            "destination_city": item.destination.city if item.destination else "City",
            "allocated_quantity_kg": item.allocated_quantity_kg,
            "dispatch_priority": item.dispatch_priority,
            "is_feasible": item.is_feasible,
            "travel_time_hours": item.travel_time_hours,
            "remaining_shelf_life_arrival": item.remaining_shelf_life_arrival,
            "unit_price": item.unit_price,
            "unit_transport_cost": item.unit_transport_cost,
            "net_contribution": item.net_contribution,
            "status": item.status
        })

    return {"run_id": latest_run.id, "allocations": results}

@router.put("/{allocation_id}")
def update_dispatch_item(allocation_id: int, req: DispatchUpdateRequest, db: Session = Depends(get_db)):
    item = db.query(AllocationItem).filter(AllocationItem.id == allocation_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Dispatch allocation item not found.")

    if req.status:
        if req.status not in ["Proposed", "Approved", "Dispatched", "Completed"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be Proposed, Approved, Dispatched, or Completed.")
        item.status = req.status

    if req.allocated_quantity_kg is not None:
        if req.allocated_quantity_kg < 0:
            raise HTTPException(status_code=400, detail="Allocated quantity cannot be negative.")
        if item.batch and req.allocated_quantity_kg > item.batch.current_quantity_kg:
            raise HTTPException(status_code=400, detail=f"Cannot allocate {req.allocated_quantity_kg}kg; batch only has {item.batch.current_quantity_kg}kg available.")
        
        item.allocated_quantity_kg = req.allocated_quantity_kg
        item.gross_revenue = round(req.allocated_quantity_kg * item.unit_price, 2)
        item.net_contribution = round(item.gross_revenue - (req.allocated_quantity_kg * item.unit_transport_cost), 2)

    db.commit()
    db.refresh(item)
    return {"status": "success", "message": f"Dispatch allocation updated to {item.status}", "allocation_id": item.id}

@router.post("/approve-all")
def approve_all_dispatches(db: Session = Depends(get_db)):
    latest_run = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).first()
    if not latest_run:
        raise HTTPException(status_code=400, detail="No active optimization run.")

    items = db.query(AllocationItem).filter(AllocationItem.run_id == latest_run.id).all()
    count = 0
    for item in items:
        if item.status == "Proposed":
            item.status = "Approved"
            count += 1
    db.commit()
    return {"status": "success", "approved_count": count}

@router.post("/simulate-execution")
def simulate_dispatch_execution(db: Session = Depends(get_db)):
    """Simulates physical dispatch delivery, deducting quantities from inventory batches."""
    latest_run = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).first()
    if not latest_run:
        raise HTTPException(status_code=400, detail="No active optimization run.")

    items = db.query(AllocationItem).filter(AllocationItem.run_id == latest_run.id, AllocationItem.status == "Approved").all()
    if not items:
        # If none approved, approve all first
        items = db.query(AllocationItem).filter(AllocationItem.run_id == latest_run.id).all()
    
    dispatched_kg = 0.0
    for item in items:
        item.status = "Completed"
        if item.batch:
            item.batch.current_quantity_kg = max(0.0, item.batch.current_quantity_kg - item.allocated_quantity_kg)
            dispatched_kg += item.allocated_quantity_kg

    db.commit()
    return {
        "status": "success",
        "message": f"Successfully simulated completion of {len(items)} dispatches ({dispatched_kg:,.1f} kg fulfilled)."
    }
