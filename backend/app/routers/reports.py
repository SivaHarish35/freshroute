from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import OptimizationRun, AllocationItem, InventoryBatch, Destination

router = APIRouter(prefix="/api/reports", tags=["Reports and Analytics"])

@router.get("/food-waste-impact")
def get_food_waste_impact(run_id: Optional[int] = None, db: Session = Depends(get_db)):
    if run_id:
        run = db.query(OptimizationRun).filter(OptimizationRun.id == run_id).first()
    else:
        run = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).first()

    if not run:
        raise HTTPException(status_code=404, detail="No optimization runs recorded yet.")

    spoilage_avoided_kg = max(0.0, run.baseline_spoilage_kg - run.optimized_spoilage_kg)
    relative_reduction_pct = 0.0
    if run.baseline_spoilage_kg > 0.001:
        relative_reduction_pct = round((spoilage_avoided_kg / run.baseline_spoilage_kg) * 100.0, 1)

    # Commodity breakdown
    commodity_stats = {}
    batches = db.query(InventoryBatch).all()
    for b in batches:
        c = b.commodity
        if c not in commodity_stats:
            commodity_stats[c] = {
                "commodity": c,
                "initial_inventory_kg": 0.0,
                "allocated_kg": 0.0,
                "spoilage_cost_per_kg": b.spoilage_cost_per_kg
            }
        commodity_stats[c]["initial_inventory_kg"] += b.initial_quantity_kg

    for item in run.allocations:
        if item.batch:
            c = item.batch.commodity
            if c in commodity_stats:
                commodity_stats[c]["allocated_kg"] += item.allocated_quantity_kg

    breakdown_list = []
    for c, stats in commodity_stats.items():
        breakdown_list.append({
            "commodity": c,
            "total_inventory_kg": round(stats["initial_inventory_kg"], 1),
            "allocated_kg": round(stats["allocated_kg"], 1),
            "allocation_rate_pct": round((stats["allocated_kg"] / stats["initial_inventory_kg"] * 100.0), 1) if stats["initial_inventory_kg"] > 0 else 0.0,
            "spoilage_writeoff_risk_unit": f"${stats['spoilage_cost_per_kg']:.2f}/kg"
        })

    baseline_waste_cost = round(run.baseline_spoilage_kg * 4.20, 2)
    optimized_waste_cost = round(run.optimized_spoilage_kg * 4.20, 2)
    waste_cost_saved = round(baseline_waste_cost - optimized_waste_cost, 2)

    return {
        "run_id": run.id,
        "run_timestamp": run.run_timestamp,
        "scenario_name": run.scenario_name or "Standard Optimization",
        "solver_method": run.solver_method,
        "planning_horizon_hours": run.horizon_hours,
        "baseline_spoilage_kg": run.baseline_spoilage_kg,
        "optimized_spoilage_kg": run.optimized_spoilage_kg,
        "spoilage_avoided_kg": round(spoilage_avoided_kg, 2),
        "relative_reduction_pct": relative_reduction_pct,
        "baseline_waste_cost": baseline_waste_cost,
        "optimized_waste_cost": optimized_waste_cost,
        "waste_cost_saved": waste_cost_saved,
        "commodity_breakdown": breakdown_list,
        "methodology_disclosure": (
            "Food-waste reduction represents modeled perishable inventory spoilage avoided by allocating short shelf-life batches "
            "to reachable destination markets before expiry vs. the documented Earliest-Expiry-First heuristic baseline under identical constraints. "
            "Calculation does not claim downstream post-consumer consumption or unverified environmental offsets."
        )
    }

@router.get("/export-csv", response_class=PlainTextResponse)
def export_csv(type: str = Query("allocations"), db: Session = Depends(get_db)):
    if type == "allocations":
        latest = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).first()
        if not latest:
            return "No optimization runs found."
        csv_lines = ["run_id,batch_code,commodity,destination_name,quantity_kg,travel_time_hours,arrival_shelf_life,net_contribution_usd,status\n"]
        for a in latest.allocations:
            b_code = a.batch.batch_code if a.batch else f"B-{a.batch_id}"
            comm = a.batch.commodity if a.batch else "Produce"
            d_name = a.destination.name if a.destination else "Destination"
            csv_lines.append(f"{a.run_id},{b_code},{comm},{d_name},{a.allocated_quantity_kg},{a.travel_time_hours},{a.remaining_shelf_life_arrival},{a.net_contribution},{a.status}\n")
        return "".join(csv_lines)

    elif type == "inventory":
        batches = db.query(InventoryBatch).all()
        csv_lines = ["batch_code,commodity,warehouse,quantity_kg,shelf_life_hours,storage_temp_c,spoilage_cost_kg,risk_status\n"]
        for b in batches:
            wh = b.warehouse.name if b.warehouse else "Warehouse"
            csv_lines.append(f"{b.batch_code},{b.commodity},{wh},{b.current_quantity_kg},{b.remaining_shelf_life_hours},{b.storage_temp_c},{b.spoilage_cost_per_kg},{b.risk_status}\n")
        return "".join(csv_lines)

    return "Invalid export type. Use 'allocations' or 'inventory'."
