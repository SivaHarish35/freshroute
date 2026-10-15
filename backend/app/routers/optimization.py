import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import (
    OptimizationRun, AllocationItem, DiscountRecommendation,
    InventoryBatch, Destination, Warehouse, TransportRoute, DemandRecord, User
)
from app.schemas.schemas import OptimizationRequest, OptimizationRunResponse
from app.services.optimizer import solve_allocation
from app.services.discount_engine import compute_batch_risk_status
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/optimization", tags=["Optimization Engine"])

def _format_run_response(run: OptimizationRun, db: Session) -> dict:
    allocations_res = []
    for item in run.allocations:
        expl = json.loads(item.explanation_json) if item.explanation_json else {}
        allocations_res.append({
            "id": item.id,
            "run_id": item.run_id,
            "batch_id": item.batch_id,
            "batch_code": item.batch.batch_code if item.batch else f"B-{item.batch_id}",
            "commodity": item.batch.commodity if item.batch else "Produce",
            "warehouse_name": item.batch.warehouse.name if item.batch and item.batch.warehouse else "Origin Hub",
            "destination_id": item.destination_id,
            "destination_name": item.destination.name if item.destination else f"Dest-{item.destination_id}",
            "destination_city": item.destination.city if item.destination else "City",
            "allocated_quantity_kg": item.allocated_quantity_kg,
            "dispatch_priority": item.dispatch_priority,
            "is_feasible": item.is_feasible,
            "infeasibility_reason": item.infeasibility_reason,
            "travel_time_hours": item.travel_time_hours,
            "remaining_shelf_life_arrival": item.remaining_shelf_life_arrival,
            "unit_price": item.unit_price,
            "unit_transport_cost": item.unit_transport_cost,
            "gross_revenue": item.gross_revenue,
            "net_contribution": item.net_contribution,
            "status": item.status,
            "explanation": expl
        })

    discounts_res = []
    for d in run.discount_recommendations:
        tradeoff = json.loads(d.economic_tradeoff_json) if d.economic_tradeoff_json else {}
        discounts_res.append({
            "id": d.id,
            "batch_id": d.batch_id,
            "batch_code": d.batch.batch_code if d.batch else f"B-{d.batch_id}",
            "commodity": d.batch.commodity if d.batch else "Produce",
            "remaining_shelf_life_hours": d.batch.remaining_shelf_life_hours if d.batch else 24.0,
            "original_price_per_kg": d.original_price_per_kg,
            "discount_pct": d.discount_pct,
            "discounted_price_per_kg": d.discounted_price_per_kg,
            "recommended_destination_name": d.destination.name if d.destination else None,
            "reason": d.reason,
            "economic_tradeoff": tradeoff
        })

    meta = json.loads(run.metadata_json) if run.metadata_json else {}

    return {
        "id": run.id,
        "run_timestamp": run.run_timestamp,
        "horizon_hours": run.horizon_hours,
        "objective_type": run.objective_type,
        "solver_method": run.solver_method,
        "status": run.status,
        "total_inventory_kg": run.total_inventory_kg,
        "total_demand_kg": run.total_demand_kg,
        "total_allocated_kg": run.total_allocated_kg,
        "baseline_spoilage_kg": run.baseline_spoilage_kg,
        "optimized_spoilage_kg": run.optimized_spoilage_kg,
        "baseline_net_revenue": run.baseline_net_revenue,
        "optimized_net_revenue": run.optimized_net_revenue,
        "baseline_fulfillment_pct": run.baseline_fulfillment_pct,
        "optimized_fulfillment_pct": run.optimized_fulfillment_pct,
        "baseline_transport_cost": run.baseline_transport_cost,
        "optimized_transport_cost": run.optimized_transport_cost,
        "is_demo": run.is_demo,
        "scenario_name": run.scenario_name,
        "allocations": allocations_res,
        "discount_recommendations": discounts_res,
        "metadata": meta
    }

@router.post("/run")
def execute_optimization(
    req: OptimizationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    batches = db.query(InventoryBatch).all()
    destinations = db.query(Destination).all()
    warehouses = db.query(Warehouse).all()
    routes = db.query(TransportRoute).all()
    demands = db.query(DemandRecord).all()

    if not batches or not destinations:
        raise HTTPException(status_code=400, detail="Inventory batches or destinations missing. Load demo data first.")

    # Call optimization engine (OR-Tools SCIP solver)
    result = solve_allocation(
        batches=batches,
        destinations=destinations,
        warehouses=warehouses,
        routes=routes,
        demands=demands,
        horizon_hours=req.horizon_hours,
        objective_type=req.objective_type,
        discount_policy_enabled=req.discount_policy_enabled,
        delay_hours=req.delay_hours,
        demand_multiplier=req.demand_multiplier,
        capacity_multiplier=req.capacity_multiplier
    )

    # Persist the run
    run_record = OptimizationRun(
        user_id=user.id,
        horizon_hours=req.horizon_hours,
        objective_type=req.objective_type,
        solver_method=result["solver_method"],
        status=result["status"],
        total_inventory_kg=result["total_inventory_kg"],
        total_demand_kg=result["total_demand_kg"],
        total_allocated_kg=result["total_allocated_kg"],
        baseline_spoilage_kg=result["baseline_spoilage_kg"],
        optimized_spoilage_kg=result["optimized_spoilage_kg"],
        baseline_net_revenue=result["baseline_net_revenue"],
        optimized_net_revenue=result["optimized_net_revenue"],
        baseline_fulfillment_pct=result["baseline_fulfillment_pct"],
        optimized_fulfillment_pct=result["optimized_fulfillment_pct"],
        baseline_transport_cost=result["baseline_transport_cost"],
        optimized_transport_cost=result["optimized_transport_cost"],
        is_demo=True,
        scenario_name=req.scenario_name or "Normal Operations",
        metadata_json=json.dumps(result["metadata"])
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    # Persist allocations
    for alloc in result["allocations"]:
        item = AllocationItem(
            run_id=run_record.id,
            batch_id=alloc["batch_id"],
            destination_id=alloc["destination_id"],
            allocated_quantity_kg=alloc["allocated_quantity_kg"],
            dispatch_priority=alloc.get("dispatch_priority", 1),
            is_feasible=alloc["is_feasible"],
            infeasibility_reason=alloc.get("infeasibility_reason"),
            travel_time_hours=alloc["travel_time_hours"],
            remaining_shelf_life_arrival=alloc["remaining_shelf_life_arrival"],
            unit_price=alloc["unit_price"],
            unit_transport_cost=alloc["unit_transport_cost"],
            gross_revenue=alloc["gross_revenue"],
            net_contribution=alloc["net_contribution"],
            status="Proposed",
            explanation_json=json.dumps(alloc.get("explanation", {}))
        )
        db.add(item)

    # Persist discounts
    for disc in result.get("discount_recommendations", []):
        d_item = DiscountRecommendation(
            run_id=run_record.id,
            batch_id=disc["batch_id"],
            original_price_per_kg=disc["original_price_per_kg"],
            discount_pct=disc["discount_pct"],
            discounted_price_per_kg=disc["discounted_price_per_kg"],
            recommended_destination_id=disc.get("recommended_destination_id"),
            reason=disc["reason"],
            economic_tradeoff_json=json.dumps(disc.get("economic_tradeoff", {}))
        )
        db.add(d_item)

    db.commit()
    db.refresh(run_record)

    return _format_run_response(run_record, db)

@router.get("/latest")
def get_latest_optimization(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    latest = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).first()
    if not latest:
        # Auto-execute initial optimization if batches exist
        if db.query(InventoryBatch).count() > 0:
            req = OptimizationRequest()
            return execute_optimization(req, user, db)
        return None
    return _format_run_response(latest, db)

@router.get("/runs")
def list_optimization_runs(db: Session = Depends(get_db)):
    runs = db.query(OptimizationRun).order_by(OptimizationRun.id.desc()).limit(10).all()
    return [{
        "id": r.id,
        "run_timestamp": r.run_timestamp,
        "scenario_name": r.scenario_name,
        "solver_method": r.solver_method,
        "total_allocated_kg": r.total_allocated_kg,
        "optimized_net_revenue": r.optimized_net_revenue,
        "baseline_net_revenue": r.baseline_net_revenue,
        "spoilage_avoided_kg": round(r.baseline_spoilage_kg - r.optimized_spoilage_kg, 2)
    } for r in runs]
