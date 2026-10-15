from typing import Dict, Any, List, Optional

def generate_allocation_explanation(
    batch,
    destination,
    route,
    allocated_qty: float,
    demand_qty: float,
    unit_price: float,
    unit_transport_cost: float,
    is_feasible: bool,
    infeasibility_reason: Optional[str] = None,
    alt_destinations: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    travel_time = route.travel_time_hours if route else 6.0
    handling_time = batch.handling_time_hours
    shelf_life = batch.remaining_shelf_life_hours
    arrival_shelf_life = max(0.0, shelf_life - travel_time - handling_time)

    gross_revenue = round(allocated_qty * unit_price, 2)
    total_transport_cost = round(allocated_qty * unit_transport_cost, 2)
    net_contribution = round(gross_revenue - total_transport_cost, 2)
    net_per_kg = round(unit_price - unit_transport_cost, 2)

    risk_label = "Critical-Risk" if shelf_life <= 24 else ("At-Risk" if shelf_life <= 48 else "Healthy")

    if not is_feasible:
        narrative = f"Allocation infeasible: {infeasibility_reason or 'Perishability constraint violated.'}"
    else:
        if shelf_life <= 36.0:
            urgency_text = f"High urgency dispatch: Remaining shelf-life is {shelf_life:.1f}h ({risk_label})."
        else:
            urgency_text = f"Standard dispatch: Batch has robust freshness buffer of {shelf_life:.1f}h."

        safety_margin_text = (
            f"Transit of {travel_time:.1f}h + {handling_time:.1f}h handling leaves {arrival_shelf_life:.1f}h "
            f"safety margin at {destination.name}."
        )

        econ_text = (
            f"Yields ${net_per_kg:.2f}/kg net margin after ${unit_transport_cost:.2f}/kg logistics cost, "
            f"generating ${net_contribution:,.2f} net contribution."
        )

        narrative = f"{urgency_text} {safety_margin_text} {econ_text}"

    return {
        "perishability": {
            "initial_shelf_life_hours": shelf_life,
            "travel_time_hours": travel_time,
            "handling_time_hours": handling_time,
            "shelf_life_at_arrival_hours": round(arrival_shelf_life, 1),
            "risk_status": risk_label,
            "is_within_tolerance": arrival_shelf_life > 0.0
        },
        "demand": {
            "destination_name": destination.name,
            "commodity": batch.commodity,
            "total_demand_kg": demand_qty,
            "batch_allocated_kg": allocated_qty,
            "fulfillment_pct": round((allocated_qty / demand_qty * 100.0), 1) if demand_qty > 0 else 0.0
        },
        "logistics": {
            "origin_warehouse": getattr(batch.warehouse, "name", "Origin Hub") if hasattr(batch, "warehouse") and batch.warehouse else "Origin Hub",
            "destination_market": destination.name,
            "travel_time_hours": travel_time,
            "unit_transport_cost": unit_transport_cost,
            "total_transport_cost": total_transport_cost,
            "destination_capacity_kg": destination.receiving_capacity_kg
        },
        "economics": {
            "unit_price": unit_price,
            "unit_transport_cost": unit_transport_cost,
            "net_margin_per_kg": net_per_kg,
            "gross_revenue": gross_revenue,
            "net_contribution": net_contribution
        },
        "alternatives": alt_destinations or [],
        "plain_language_narrative": narrative
    }
