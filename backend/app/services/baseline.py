from typing import List, Dict, Any

def run_baseline_heuristic(
    batches: list,
    destinations: list,
    routes_map: dict, # (warehouse_id, dest_id) -> route
    demands_map: dict, # (dest_id, commodity) -> (demand_qty, price)
    horizon_hours: float = 48.0,
    discount_policy_enabled: bool = False
) -> Dict[str, Any]:
    """
    Earliest-Expiry-First (EEF) Fair Baseline Heuristic.
    Sorts batches strictly by remaining shelf-life ascending and greedily assigns to the
    first feasible destination with unmet demand and available capacity.
    Operates under the exact same hard constraints and economic equations as the mathematical optimizer.
    """
    # Clone demand, destination capacities, vehicle capacities
    remaining_demand = {k: v[0] for k, v in demands_map.items()}
    price_map = {k: v[1] for k, v in demands_map.items()}
    dest_capacity = {d.id: d.receiving_capacity_kg for d in destinations}
    veh_capacity = {k: r.vehicle_capacity_kg for k, r in routes_map.items()}

    # Sort batches by shelf-life ascending (Earliest Expiry First)
    sorted_batches = sorted(batches, key=lambda b: (b.remaining_shelf_life_hours, -b.current_quantity_kg))

    allocations = []
    total_allocated_kg = 0.0
    total_gross_revenue = 0.0
    total_transport_cost = 0.0
    total_holding_cost = 0.0
    total_spoilage_cost = 0.0
    total_spoilage_kg = 0.0

    batch_allocations_summary = {}

    for b in sorted_batches:
        batch_avail = b.current_quantity_kg
        batch_allocated = 0.0
        warehouse_id = b.origin_warehouse_id
        commodity = b.commodity

        # Check candidate destinations
        for d in destinations:
            if batch_avail <= 0.001:
                break

            route_key = (warehouse_id, d.id)
            route = routes_map.get(route_key)
            if not route:
                continue

            # Hard Constraint 1: Perishability & Shelf Life Check
            travel_time = route.travel_time_hours
            handling_time = b.handling_time_hours
            if travel_time + handling_time > b.remaining_shelf_life_hours:
                continue # Infeasible due to spoilage in transit/handling

            # Hard Constraint 2: Unmet Demand Check
            demand_key = (d.id, commodity)
            unmet_dem = remaining_demand.get(demand_key, 0.0)
            if unmet_dem <= 0.001:
                continue

            # Hard Constraint 3: Destination Receiving Capacity
            dest_avail_cap = dest_capacity.get(d.id, 0.0)
            if dest_avail_cap <= 0.001:
                continue

            # Hard Constraint 4: Vehicle Route Capacity
            route_avail_cap = veh_capacity.get(route_key, 0.0)
            if route_avail_cap <= 0.001:
                continue

            # Quantity to allocate
            alloc_qty = min(batch_avail, unmet_dem, dest_avail_cap, route_avail_cap)
            if alloc_qty <= 0.001:
                continue

            # Update tracking
            batch_avail -= alloc_qty
            batch_allocated += alloc_qty
            remaining_demand[demand_key] -= alloc_qty
            dest_capacity[d.id] -= alloc_qty
            veh_capacity[route_key] -= alloc_qty

            unit_price = price_map.get(demand_key, 4.0)
            unit_cost = route.transport_cost_per_kg
            gross_rev = alloc_qty * unit_price
            trans_cost = alloc_qty * unit_cost
            net_contrib = gross_rev - trans_cost

            total_allocated_kg += alloc_qty
            total_gross_revenue += gross_rev
            total_transport_cost += trans_cost

            allocations.append({
                "batch_id": b.id,
                "batch_code": b.batch_code,
                "commodity": b.commodity,
                "destination_id": d.id,
                "destination_name": d.name,
                "allocated_quantity_kg": round(alloc_qty, 2),
                "is_feasible": True,
                "travel_time_hours": travel_time,
                "remaining_shelf_life_arrival": round(max(0.0, b.remaining_shelf_life_hours - travel_time - handling_time), 1),
                "unit_price": unit_price,
                "unit_transport_cost": unit_cost,
                "gross_revenue": round(gross_rev, 2),
                "net_contribution": round(net_contrib, 2),
            })

        batch_allocations_summary[b.id] = batch_allocated

        # Spoilage & Holding evaluation for unallocated remainder
        unallocated_qty = b.current_quantity_kg - batch_allocated
        if unallocated_qty > 0.001:
            total_holding_cost += unallocated_qty * b.holding_cost_per_kg
            # If shelf life falls within planning horizon, it spoils!
            if b.remaining_shelf_life_hours <= horizon_hours:
                total_spoilage_kg += unallocated_qty
                total_spoilage_cost += unallocated_qty * b.spoilage_cost_per_kg

    total_demand_kg = sum(v[0] for v in demands_map.values())
    fulfillment_pct = (total_allocated_kg / total_demand_kg * 100.0) if total_demand_kg > 0 else 0.0
    net_revenue = total_gross_revenue - total_transport_cost - total_spoilage_cost - total_holding_cost

    return {
        "status": "Baseline Complete (Earliest-Expiry-First)",
        "solver_method": "Earliest-Expiry-First (EEF) Heuristic",
        "total_allocated_kg": round(total_allocated_kg, 2),
        "spoilage_kg": round(total_spoilage_kg, 2),
        "spoilage_cost": round(total_spoilage_cost, 2),
        "transport_cost": round(total_transport_cost, 2),
        "holding_cost": round(total_holding_cost, 2),
        "gross_revenue": round(total_gross_revenue, 2),
        "net_revenue": round(net_revenue, 2),
        "demand_fulfillment_pct": round(fulfillment_pct, 1),
        "allocations": allocations
    }
