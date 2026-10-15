from typing import List, Dict, Any, Optional
from ortools.linear_solver import pywraplp
from app.services.explainer import generate_allocation_explanation
from app.services.baseline import run_baseline_heuristic
from app.services.discount_engine import generate_discount_recommendations, compute_batch_risk_status

def solve_allocation(
    batches: list,
    destinations: list,
    warehouses: list,
    routes: list,
    demands: list,
    horizon_hours: float = 48.0,
    objective_type: str = "maximize_net_revenue",
    discount_policy_enabled: bool = True,
    delay_hours: float = 0.0,
    demand_multiplier: float = 1.0,
    capacity_multiplier: float = 1.0,
    price_multiplier: float = 1.0
) -> Dict[str, Any]:
    """
    Solves the constrained Perishable Produce Allocation and Dispatch Problem
    using Google OR-Tools Mixed Integer / Linear Programming (SCIP solver).
    Enforces hard constraints: Shelf-life feasibility, Demand upper bounds,
    Destination receiving capacities, and Vehicle transport limits.
    """
    solver = pywraplp.Solver.CreateSolver("SCIP")
    if not solver:
        # Fallback to GLOP if SCIP is not compiled
        solver = pywraplp.Solver.CreateSolver("GLOP")
    
    solver_name = f"Google OR-Tools ({solver.ProblemType() if hasattr(solver, 'ProblemType') else 'MIP/LP'})"

    # Pre-index routes: (warehouse_id, dest_id) -> route
    routes_map = {}
    for r in routes:
        # Apply delay to travel time if simulated
        effective_travel_time = r.travel_time_hours + delay_hours
        effective_veh_cap = r.vehicle_capacity_kg * capacity_multiplier
        routes_map[(r.warehouse_id, r.destination_id)] = {
            "travel_time_hours": effective_travel_time,
            "transport_cost_per_kg": r.transport_cost_per_kg,
            "vehicle_capacity_kg": effective_veh_cap,
            "id": r.id
        }

    # Pre-index demands: (dest_id, commodity) -> (demand_qty, market_price)
    demands_map = {}
    for dem in demands:
        eff_dem = dem.demand_quantity_kg * demand_multiplier
        eff_price = dem.market_price_per_kg * price_multiplier
        demands_map[(dem.destination_id, dem.commodity)] = (eff_dem, eff_price)

    # Pre-calculate discounts for at-risk batches
    discounts = generate_discount_recommendations(batches, destinations, demands) if discount_policy_enabled else []
    discount_rate_map = {d["batch_id"]: d["discount_pct"] / 100.0 for d in discounts}

    # Decision variables: x[batch_id, dest_id]
    x = {}
    infeasible_combinations = {}

    for b in batches:
        w_id = b.origin_warehouse_id
        c = b.commodity
        for d in destinations:
            r_info = routes_map.get((w_id, d.id))
            if not r_info:
                infeasible_combinations[(b.id, d.id)] = "No logistics transport route exists between origin and destination."
                continue

            travel_time = r_info["travel_time_hours"]
            handling_time = b.handling_time_hours
            total_transit_needed = travel_time + handling_time

            # Hard Constraint 1: Perishability feasibility
            if total_transit_needed > b.remaining_shelf_life_hours:
                infeasible_combinations[(b.id, d.id)] = (
                    f"Perishability Infeasible: Required transit ({travel_time:.1f}h) + handling ({handling_time:.1f}h) = "
                    f"{total_transit_needed:.1f}h exceeds batch shelf-life allowance ({b.remaining_shelf_life_hours:.1f}h)."
                )
                continue

            # Eligible demand check
            dem_info = demands_map.get((d.id, c))
            if not dem_info or dem_info[0] <= 0.0:
                infeasible_combinations[(b.id, d.id)] = f"No demand exists for {c} at {d.name}."
                continue

            var_name = f"x_b{b.id}_d{d.id}"
            x[(b.id, d.id)] = solver.NumVar(0.0, float(b.current_quantity_kg), var_name)

    # Decision variables: u[batch_id] (unallocated inventory)
    u = {}
    for b in batches:
        u[b.id] = solver.NumVar(0.0, float(b.current_quantity_kg), f"u_b{b.id}")

    # Constraint 2: Inventory Conservation
    for b in batches:
        batch_vars = [x[(b.id, d.id)] for d in destinations if (b.id, d.id) in x]
        if batch_vars:
            solver.Add(solver.Sum(batch_vars) + u[b.id] == float(b.current_quantity_kg))
        else:
            solver.Add(u[b.id] == float(b.current_quantity_kg))

    # Constraint 3: Destination Demand Limits
    for d in destinations:
        for c in set(b.commodity for b in batches):
            dem_info = demands_map.get((d.id, c))
            if dem_info:
                max_dem = dem_info[0]
                comm_vars = [x[(b.id, d.id)] for b in batches if b.commodity == c and (b.id, d.id) in x]
                if comm_vars:
                    solver.Add(solver.Sum(comm_vars) <= float(max_dem))

    # Constraint 4: Destination Receiving Capacities
    for d in destinations:
        eff_dest_cap = d.receiving_capacity_kg * capacity_multiplier
        dest_vars = [x[(b.id, d.id)] for b in batches if (b.id, d.id) in x]
        if dest_vars:
            solver.Add(solver.Sum(dest_vars) <= float(eff_dest_cap))

    # Constraint 5: Route Vehicle Transport Capacities
    for (w_id, d_id), r_info in routes_map.items():
        route_vars = [x[(b.id, d_id)] for b in batches if b.origin_warehouse_id == w_id and (b.id, d_id) in x]
        if route_vars:
            solver.Add(solver.Sum(route_vars) <= float(r_info["vehicle_capacity_kg"]))

    # Objective Function
    objective = solver.Objective()

    for (b_id, d_id), var in x.items():
        batch = next(b for b in batches if b.id == b_id)
        r_info = routes_map[(batch.origin_warehouse_id, d_id)]
        dem_info = demands_map[(d_id, batch.commodity)]

        base_price = dem_info[1]
        discount_rate = discount_rate_map.get(b_id, 0.0)
        net_selling_price = base_price * (1.0 - discount_rate)
        unit_transport_cost = r_info["transport_cost_per_kg"]
        margin_per_kg = net_selling_price - unit_transport_cost

        if objective_type == "minimize_spoilage":
            # Primary focus is moving stock, revenue is secondary tie-breaker
            coeff = 10.0 + (margin_per_kg * 0.01)
        elif objective_type == "balanced":
            # Balanced: strong revenue focus with extra penalty protection against spoilage
            coeff = margin_per_kg + (batch.spoilage_cost_per_kg * 0.5)
        else: # maximize_net_revenue
            coeff = margin_per_kg

        objective.SetCoefficient(var, float(coeff))

    for b in batches:
        # If unallocated and expires within planning horizon, it spoils!
        if b.remaining_shelf_life_hours <= horizon_hours:
            spoil_penalty = b.spoilage_cost_per_kg
        else:
            spoil_penalty = 0.0
        
        hold_cost = b.holding_cost_per_kg
        total_unalloc_penalty = -(spoil_penalty + hold_cost)

        if objective_type == "minimize_spoilage":
            total_unalloc_penalty = -500.0 if b.remaining_shelf_life_hours <= horizon_hours else -hold_cost

        objective.SetCoefficient(u[b.id], float(total_unalloc_penalty))

    objective.SetMaximization()

    # Solve
    status = solver.Solve()
    status_str = "Optimal" if status == pywraplp.Solver.OPTIMAL else ("Feasible" if status == pywraplp.Solver.FEASIBLE else "Infeasible")

    # Extract allocations
    allocation_results = []
    total_allocated_kg = 0.0
    total_gross_revenue = 0.0
    total_transport_cost = 0.0
    total_spoilage_kg = 0.0
    total_spoilage_cost = 0.0
    total_holding_cost = 0.0

    batch_allocated_kg = {b.id: 0.0 for b in batches}

    dest_by_id = {d.id: d for d in destinations}
    routes_obj_map = {}
    for r in routes:
        routes_obj_map[(r.warehouse_id, r.destination_id)] = r

    for (b_id, d_id), var in x.items():
        qty = var.solution_value()
        if qty > 0.001:
            batch = next(b for b in batches if b.id == b_id)
            dest = dest_by_id[d_id]
            r_info = routes_map[(batch.origin_warehouse_id, d_id)]
            dem_info = demands_map[(d_id, batch.commodity)]

            base_price = dem_info[1]
            discount_rate = discount_rate_map.get(b_id, 0.0)
            eff_price = round(base_price * (1.0 - discount_rate), 2)
            u_cost = r_info["transport_cost_per_kg"]
            travel_time = r_info["travel_time_hours"]

            gross_rev = qty * eff_price
            trans_cost = qty * u_cost
            net_contrib = gross_rev - trans_cost

            total_allocated_kg += qty
            total_gross_revenue += gross_rev
            total_transport_cost += trans_cost
            batch_allocated_kg[b_id] += qty

            # Remaining shelf life on arrival
            arrival_sl = max(0.0, batch.remaining_shelf_life_hours - travel_time - batch.handling_time_hours)

            # Generate explainability details
            explanation = generate_allocation_explanation(
                batch=batch,
                destination=dest,
                route=routes_obj_map.get((batch.origin_warehouse_id, d_id)),
                allocated_qty=round(qty, 2),
                demand_qty=dem_info[0],
                unit_price=eff_price,
                unit_transport_cost=u_cost,
                is_feasible=True
            )

            allocation_results.append({
                "batch_id": b_id,
                "batch_code": batch.batch_code,
                "commodity": batch.commodity,
                "warehouse_name": getattr(batch.warehouse, "name", "Central Warehouse") if hasattr(batch, "warehouse") and batch.warehouse else "Warehouse Hub",
                "destination_id": d_id,
                "destination_name": dest.name,
                "destination_city": dest.city,
                "allocated_quantity_kg": round(qty, 2),
                "is_feasible": True,
                "infeasibility_reason": None,
                "travel_time_hours": round(travel_time, 1),
                "remaining_shelf_life_arrival": round(arrival_sl, 1),
                "unit_price": eff_price,
                "unit_transport_cost": u_cost,
                "gross_revenue": round(gross_rev, 2),
                "net_contribution": round(net_contrib, 2),
                "status": "Proposed",
                "explanation": explanation
            })

    # Evaluate Spoilage & Holding costs on remaining stock
    for b in batches:
        unalloc = u[b.id].solution_value() if b.id in u else b.current_quantity_kg
        if unalloc > 0.001:
            total_holding_cost += unalloc * b.holding_cost_per_kg
            if b.remaining_shelf_life_hours <= horizon_hours:
                total_spoilage_kg += unalloc
                total_spoilage_cost += unalloc * b.spoilage_cost_per_kg

    total_inventory_kg = sum(b.current_quantity_kg for b in batches)
    total_demand_kg = sum(v[0] for v in demands_map.values())
    opt_fulfillment_pct = (total_allocated_kg / total_demand_kg * 100.0) if total_demand_kg > 0 else 0.0
    opt_net_revenue = total_gross_revenue - total_transport_cost - total_spoilage_cost - total_holding_cost

    # Dispatch Priority ranking: earlier expiry arrival gets higher dispatch priority
    allocation_results.sort(key=lambda item: (item["remaining_shelf_life_arrival"], -item["net_contribution"]))
    for idx, item in enumerate(allocation_results):
        item["dispatch_priority"] = idx + 1

    # Run Fair Baseline Heuristic on identical conditions
    # Pass routes as objects or dicts
    class DummyRoute:
        def __init__(self, t, c, cap):
            self.travel_time_hours = t
            self.transport_cost_per_kg = c
            self.vehicle_capacity_kg = cap

    dummy_routes_map = {k: DummyRoute(v["travel_time_hours"], v["transport_cost_per_kg"], v["vehicle_capacity_kg"]) for k, v in routes_map.items()}

    baseline_res = run_baseline_heuristic(
        batches=batches,
        destinations=destinations,
        routes_map=dummy_routes_map,
        demands_map=demands_map,
        horizon_hours=horizon_hours,
        discount_policy_enabled=discount_policy_enabled
    )

    return {
        "status": status_str,
        "solver_method": solver_name,
        "horizon_hours": horizon_hours,
        "objective_type": objective_type,
        "total_inventory_kg": round(total_inventory_kg, 2),
        "total_demand_kg": round(total_demand_kg, 2),
        "total_allocated_kg": round(total_allocated_kg, 2),
        "optimized_spoilage_kg": round(total_spoilage_kg, 2),
        "optimized_net_revenue": round(opt_net_revenue, 2),
        "optimized_fulfillment_pct": round(opt_fulfillment_pct, 1),
        "optimized_transport_cost": round(total_transport_cost, 2),
        "baseline_spoilage_kg": baseline_res["spoilage_kg"],
        "baseline_net_revenue": baseline_res["net_revenue"],
        "baseline_fulfillment_pct": baseline_res["demand_fulfillment_pct"],
        "baseline_transport_cost": baseline_res["transport_cost"],
        "allocations": allocation_results,
        "discount_recommendations": discounts,
        "infeasible_diagnostics": infeasible_combinations,
        "metadata": {
            "num_batches": len(batches),
            "num_destinations": len(destinations),
            "num_constraints_evaluated": solver.NumConstraints() if hasattr(solver, "NumConstraints") else 0,
            "num_variables": solver.NumVariables() if hasattr(solver, "NumVariables") else 0,
            "delay_hours": delay_hours,
            "demand_multiplier": demand_multiplier,
            "capacity_multiplier": capacity_multiplier
        }
    }
