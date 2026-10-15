import io
import csv
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import InventoryBatch, Warehouse, User
from app.schemas.schemas import InventoryBatchCreate, InventoryBatchUpdate, InventoryBatchResponse
from app.services.discount_engine import compute_batch_risk_status
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/inventory", tags=["Inventory Management"])

@router.get("", response_model=List[InventoryBatchResponse])
def get_inventory(
    commodity: Optional[str] = None,
    warehouse_id: Optional[int] = None,
    risk_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(InventoryBatch)
    if commodity:
        query = query.filter(InventoryBatch.commodity == commodity)
    if warehouse_id:
        query = query.filter(InventoryBatch.origin_warehouse_id == warehouse_id)
    if risk_status:
        query = query.filter(InventoryBatch.risk_status == risk_status)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (InventoryBatch.batch_code.ilike(s)) |
            (InventoryBatch.commodity.ilike(s)) |
            (InventoryBatch.notes.ilike(s))
        )

    batches = query.order_by(InventoryBatch.remaining_shelf_life_hours.asc()).all()
    results = []
    for b in batches:
        b_dict = {
            "id": b.id,
            "batch_code": b.batch_code,
            "commodity": b.commodity,
            "origin_warehouse_id": b.origin_warehouse_id,
            "initial_quantity_kg": b.initial_quantity_kg,
            "current_quantity_kg": b.current_quantity_kg,
            "remaining_shelf_life_hours": b.remaining_shelf_life_hours,
            "harvest_date": b.harvest_date,
            "received_at": b.received_at,
            "storage_temp_c": b.storage_temp_c,
            "handling_time_hours": b.handling_time_hours,
            "spoilage_cost_per_kg": b.spoilage_cost_per_kg,
            "holding_cost_per_kg": b.holding_cost_per_kg,
            "notes": b.notes,
            "risk_status": compute_batch_risk_status(b.remaining_shelf_life_hours),
            "warehouse_name": b.warehouse.name if b.warehouse else "Warehouse Hub",
            "warehouse_city": b.warehouse.city if b.warehouse else "Origin"
        }
        results.append(b_dict)
    return results

@router.post("", response_model=InventoryBatchResponse)
def create_batch(batch_in: InventoryBatchCreate, db: Session = Depends(get_db)):
    existing = db.query(InventoryBatch).filter(InventoryBatch.batch_code == batch_in.batch_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Batch code {batch_in.batch_code} already exists.")

    w = db.query(Warehouse).filter(Warehouse.id == batch_in.origin_warehouse_id).first()
    if not w:
        raise HTTPException(status_code=400, detail=f"Warehouse ID {batch_in.origin_warehouse_id} not found.")

    r_status = compute_batch_risk_status(batch_in.remaining_shelf_life_hours)
    new_batch = InventoryBatch(
        batch_code=batch_in.batch_code,
        commodity=batch_in.commodity,
        origin_warehouse_id=batch_in.origin_warehouse_id,
        initial_quantity_kg=batch_in.initial_quantity_kg,
        current_quantity_kg=batch_in.current_quantity_kg,
        remaining_shelf_life_hours=batch_in.remaining_shelf_life_hours,
        harvest_date=batch_in.harvest_date,
        storage_temp_c=batch_in.storage_temp_c,
        handling_time_hours=batch_in.handling_time_hours,
        spoilage_cost_per_kg=batch_in.spoilage_cost_per_kg,
        holding_cost_per_kg=batch_in.holding_cost_per_kg,
        notes=batch_in.notes or "",
        risk_status=r_status
    )
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    return {
        "id": new_batch.id,
        "batch_code": new_batch.batch_code,
        "commodity": new_batch.commodity,
        "origin_warehouse_id": new_batch.origin_warehouse_id,
        "initial_quantity_kg": new_batch.initial_quantity_kg,
        "current_quantity_kg": new_batch.current_quantity_kg,
        "remaining_shelf_life_hours": new_batch.remaining_shelf_life_hours,
        "harvest_date": new_batch.harvest_date,
        "received_at": new_batch.received_at,
        "storage_temp_c": new_batch.storage_temp_c,
        "handling_time_hours": new_batch.handling_time_hours,
        "spoilage_cost_per_kg": new_batch.spoilage_cost_per_kg,
        "holding_cost_per_kg": new_batch.holding_cost_per_kg,
        "notes": new_batch.notes,
        "risk_status": r_status,
        "warehouse_name": w.name,
        "warehouse_city": w.city
    }

@router.put("/{batch_id}", response_model=InventoryBatchResponse)
def update_batch(batch_id: int, batch_in: InventoryBatchUpdate, db: Session = Depends(get_db)):
    batch = db.query(InventoryBatch).filter(InventoryBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    if batch_in.commodity is not None:
        batch.commodity = batch_in.commodity
    if batch_in.current_quantity_kg is not None:
        batch.current_quantity_kg = batch_in.current_quantity_kg
    if batch_in.remaining_shelf_life_hours is not None:
        batch.remaining_shelf_life_hours = batch_in.remaining_shelf_life_hours
        batch.risk_status = compute_batch_risk_status(batch.remaining_shelf_life_hours)
    if batch_in.storage_temp_c is not None:
        batch.storage_temp_c = batch_in.storage_temp_c
    if batch_in.notes is not None:
        batch.notes = batch_in.notes

    db.commit()
    db.refresh(batch)

    return {
        "id": batch.id,
        "batch_code": batch.batch_code,
        "commodity": batch.commodity,
        "origin_warehouse_id": batch.origin_warehouse_id,
        "initial_quantity_kg": batch.initial_quantity_kg,
        "current_quantity_kg": batch.current_quantity_kg,
        "remaining_shelf_life_hours": batch.remaining_shelf_life_hours,
        "harvest_date": batch.harvest_date,
        "received_at": batch.received_at,
        "storage_temp_c": batch.storage_temp_c,
        "handling_time_hours": batch.handling_time_hours,
        "spoilage_cost_per_kg": batch.spoilage_cost_per_kg,
        "holding_cost_per_kg": batch.holding_cost_per_kg,
        "notes": batch.notes,
        "risk_status": batch.risk_status,
        "warehouse_name": batch.warehouse.name if batch.warehouse else "Warehouse Hub",
        "warehouse_city": batch.warehouse.city if batch.warehouse else "Origin"
    }

@router.delete("/{batch_id}")
def delete_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(InventoryBatch).filter(InventoryBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    db.delete(batch)
    db.commit()
    return {"status": "success", "message": f"Batch {batch.batch_code} deleted."}

@router.get("/template-csv", response_class=PlainTextResponse)
def get_template_csv():
    output = "batch_code,commodity,warehouse_code,quantity_kg,shelf_life_hours,storage_temp_c,spoilage_cost,notes\n"
    output += "BATCH-TEST-001,Organic Strawberries,WH-SALINAS,3500,28.0,3.5,4.80,Morning field harvest\n"
    output += "BATCH-TEST-002,Baby Spinach,WH-SALINAS,2400,22.0,2.8,3.90,High nitrogen pre-pack\n"
    output += "BATCH-TEST-003,Vine Tomatoes,WH-CENTRAL,5000,56.0,12.0,3.20,Breaker stage cluster\n"
    return output

def _process_csv_text(decoded: str, db: Session):
    reader = csv.DictReader(io.StringIO(decoded))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file is empty or formatted incorrectly.")

    wh_map = {w.code: w.id for w in db.query(Warehouse).all()}
    valid_rows = []
    errors = []

    for idx, row in enumerate(rows):
        row_num = idx + 2
        batch_code = row.get("batch_code", "").strip()
        commodity = row.get("commodity", "").strip()
        wh_code = row.get("warehouse_code", "").strip()
        
        if not batch_code:
            errors.append({"row": row_num, "field": "batch_code", "message": "Missing required batch code"})
            continue
        if not commodity:
            errors.append({"row": row_num, "field": "commodity", "message": "Missing required commodity"})
            continue
        
        try:
            qty = float(row.get("quantity_kg", 0))
            if qty <= 0:
                errors.append({"row": row_num, "field": "quantity_kg", "message": "Quantity must be > 0"})
                continue
        except ValueError:
            errors.append({"row": row_num, "field": "quantity_kg", "message": "Invalid numeric quantity"})
            continue

        try:
            shelf_life = float(row.get("shelf_life_hours", 0))
            if shelf_life <= 0:
                errors.append({"row": row_num, "field": "shelf_life_hours", "message": "Shelf life must be > 0"})
                continue
        except ValueError:
            errors.append({"row": row_num, "field": "shelf_life_hours", "message": "Invalid numeric shelf life"})
            continue

        w_id = wh_map.get(wh_code)
        if not w_id:
            w_id = list(wh_map.values())[0] if wh_map else 1

        valid_rows.append({
            "batch_code": batch_code,
            "commodity": commodity,
            "origin_warehouse_id": w_id,
            "initial_quantity_kg": qty,
            "current_quantity_kg": qty,
            "remaining_shelf_life_hours": shelf_life,
            "storage_temp_c": float(row.get("storage_temp_c", 4.0)),
            "spoilage_cost_per_kg": float(row.get("spoilage_cost", 3.50)),
            "notes": row.get("notes", "Imported via CSV Wizard")
        })

    return {
        "total_rows": len(rows),
        "valid_count": len(valid_rows),
        "error_count": len(errors),
        "sample_valid": valid_rows[:5],
        "errors": errors,
        "valid_rows": valid_rows
    }

@router.post("/validate-csv-text")
def validate_csv_text(payload: dict, db: Session = Depends(get_db)):
    text = payload.get("csv_text", "")
    return _process_csv_text(text, db)

@router.post("/validate-csv")
async def validate_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    decoded = content.decode("utf-8-sig", errors="ignore")
    return _process_csv_text(decoded, db)

@router.post("/commit-import")
def commit_import(payload: dict, db: Session = Depends(get_db)):
    rows = payload.get("rows", [])
    if not rows:
        raise HTTPException(status_code=400, detail="No valid rows provided to commit.")

    created = 0
    updated = 0

    for r in rows:
        existing = db.query(InventoryBatch).filter(InventoryBatch.batch_code == r["batch_code"]).first()
        r_status = compute_batch_risk_status(r["remaining_shelf_life_hours"])
        if existing:
            existing.commodity = r["commodity"]
            existing.current_quantity_kg = r["current_quantity_kg"]
            existing.remaining_shelf_life_hours = r["remaining_shelf_life_hours"]
            existing.risk_status = r_status
            existing.notes = r.get("notes", existing.notes)
            updated += 1
        else:
            new_b = InventoryBatch(
                batch_code=r["batch_code"],
                commodity=r["commodity"],
                origin_warehouse_id=r["origin_warehouse_id"],
                initial_quantity_kg=r["initial_quantity_kg"],
                current_quantity_kg=r["current_quantity_kg"],
                remaining_shelf_life_hours=r["remaining_shelf_life_hours"],
                storage_temp_c=r.get("storage_temp_c", 4.0),
                spoilage_cost_per_kg=r.get("spoilage_cost_per_kg", 3.50),
                notes=r.get("notes", "Imported via CSV Wizard"),
                risk_status=r_status
            )
            db.add(new_b)
            created += 1

    db.commit()
    return {
        "status": "success",
        "created_records": created,
        "updated_records": updated,
        "total_committed": created + updated
    }
