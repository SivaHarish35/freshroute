from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Scenario, InventoryBatch, Destination, Warehouse, TransportRoute, DemandRecord, OptimizationRun
from app.services.optimizer import solve_allocation

router = APIRouter(prefix="/api/scenarios", tags=["What-If Scenarios"])

@router.get("")
def list_scenarios(db: Session = Depends(get_db)):
    return db.query(Scenario).all()

@router.post("/run")
def run_scenario(payload: dict, db: Session = Depends(get_db)):
    delay_hours = float(payload.get("delay_hours", 0.0))
    demand_multiplier = float(payload.get("demand_multiplier", 1.0))
    capacity_multiplier = float(payload.get("capacity_multiplier", 1.0))
    price_multiplier = float(payload.get("price_multiplier", 1.0))
    scenario_name = payload.get("scenario_name", "Custom What-If Scenario")

    batches = db.query(InventoryBatch).all()
    destinations = db.query(Destination).all()
    warehouses = db.query(Warehouse).all()
    routes = db.query(TransportRoute).all()
    demands = db.query(DemandRecord).all()

    if not batches or not destinations:
        raise HTTPException(status_code=400, detail="Inventory or destinations empty.")

    # 1. Run baseline normal operations for fair comparison
    normal_opt = solve_allocation(
        batches=batches,
        destinations=destinations,
        warehouses=warehouses,
        routes=routes,
        demands=demands,
        horizon_hours=48.0,
        delay_hours=0.0,
        demand_multiplier=1.0,
        capacity_multiplier=1.0,
        price_multiplier=1.0
    )

    # 2. Run scenario with modified parameters
    scenario_opt = solve_allocation(
        batches=batches,
        destinations=destinations,
        warehouses=warehouses,
        routes=routes,
        demands=demands,
        horizon_hours=48.0,
        delay_hours=delay_hours,
        demand_multiplier=demand_multiplier,
        capacity_multiplier=capacity_multiplier,
        price_multiplier=price_multiplier
    )

    # Calculate real mathematical deltas
    delta_spoilage = round(scenario_opt["optimized_spoilage_kg"] - normal_opt["optimized_spoilage_kg"], 2)
    delta_revenue = round(scenario_opt["optimized_net_revenue"] - normal_opt["optimized_net_revenue"], 2)
    delta_fulfillment = round(scenario_opt["optimized_fulfillment_pct"] - normal_opt["optimized_fulfillment_pct"], 1)

    # Find newly infeasible routes or allocations
    normal_batch_dests = set((a["batch_id"], a["destination_id"]) for a in normal_opt["allocations"])
    scenario_batch_dests = set((a["batch_id"], a["destination_id"]) for a in scenario_opt["allocations"])
    dropped_allocations = normal_batch_dests - scenario_batch_dests

    return {
        "scenario_name": scenario_name,
        "is_simulated": True,
        "parameters": {
            "delay_hours": delay_hours,
            "demand_multiplier": demand_multiplier,
            "capacity_multiplier": capacity_multiplier,
            "price_multiplier": price_multiplier
        },
        "normal_plan": {
            "allocated_kg": normal_opt["total_allocated_kg"],
            "spoilage_kg": normal_opt["optimized_spoilage_kg"],
            "net_revenue": normal_opt["optimized_net_revenue"],
            "fulfillment_pct": normal_opt["optimized_fulfillment_pct"]
        },
        "scenario_plan": {
            "allocated_kg": scenario_opt["total_allocated_kg"],
            "spoilage_kg": scenario_opt["optimized_spoilage_kg"],
            "net_revenue": scenario_opt["optimized_net_revenue"],
            "fulfillment_pct": scenario_opt["optimized_fulfillment_pct"],
            "allocations_count": len(scenario_opt["allocations"])
        },
        "deltas": {
            "spoilage_delta_kg": delta_spoilage,
            "net_revenue_delta": delta_revenue,
            "fulfillment_delta_pct": delta_fulfillment,
            "dropped_allocations_count": len(dropped_allocations)
        },
        "allocations": scenario_opt["allocations"],
        "infeasible_diagnostics": scenario_opt.get("infeasible_diagnostics", {})
    }
