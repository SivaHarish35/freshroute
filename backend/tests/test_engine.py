import pytest
from app.services.optimizer import solve_allocation
from app.services.baseline import run_baseline_heuristic
from app.services.discount_engine import compute_batch_risk_status, generate_discount_recommendations

class MockWarehouse:
    def __init__(self, id, code, name):
        self.id = id
        self.code = code
        self.name = name

class MockDestination:
    def __init__(self, id, code, name, city, cap):
        self.id = id
        self.code = code
        self.name = name
        self.city = city
        self.receiving_capacity_kg = cap

class MockBatch:
    def __init__(self, id, code, comm, w_id, qty, sl, handling=2.0, spoil=4.0, hold=0.1):
        self.id = id
        self.batch_code = code
        self.commodity = comm
        self.origin_warehouse_id = w_id
        self.current_quantity_kg = qty
        self.initial_quantity_kg = qty
        self.remaining_shelf_life_hours = sl
        self.handling_time_hours = handling
        self.spoilage_cost_per_kg = spoil
        self.holding_cost_per_kg = hold
        self.warehouse = MockWarehouse(w_id, "WH1", "Origin Hub")

class MockRoute:
    def __init__(self, id, w_id, d_id, time_h, cost_kg, cap):
        self.id = id
        self.warehouse_id = w_id
        self.destination_id = d_id
        self.travel_time_hours = time_h
        self.transport_cost_per_kg = cost_kg
        self.vehicle_capacity_kg = cap

class MockDemand:
    def __init__(self, d_id, comm, qty, price):
        self.destination_id = d_id
        self.commodity = comm
        self.demand_quantity_kg = qty
        self.market_price_per_kg = price

def test_risk_status_classification():
    assert compute_batch_risk_status(18.0) == "Critical-Risk"
    assert compute_batch_risk_status(24.0) == "Critical-Risk"
    assert compute_batch_risk_status(36.0) == "At-Risk"
    assert compute_batch_risk_status(48.0) == "At-Risk"
    assert compute_batch_risk_status(72.0) == "Healthy"

def test_perishability_infeasibility_rejection():
    w = MockWarehouse(1, "W1", "Salinas Hub")
    d = MockDestination(1, "D1", "Bay Area Terminal", "SF", 5000.0)
    b = MockBatch(1, "B1", "Organic Strawberries", 1, 1000.0, 5.0, handling=2.0)
    r = MockRoute(1, 1, 1, 4.0, 0.25, 2000.0)
    dem = MockDemand(1, "Organic Strawberries", 1000.0, 5.00)

    result = solve_allocation(
        batches=[b],
        destinations=[d],
        warehouses=[w],
        routes=[r],
        demands=[dem],
        horizon_hours=48.0
    )

    assert result["total_allocated_kg"] == 0.0
    assert (1, 1) in result["infeasible_diagnostics"]
    assert "Perishability Infeasible" in result["infeasible_diagnostics"][(1, 1)]

def test_inventory_conservation_and_allocation_without_discount():
    w = MockWarehouse(1, "W1", "Salinas Hub")
    d = MockDestination(1, "D1", "Bay Area Terminal", "SF", 5000.0)
    b = MockBatch(1, "B1", "Organic Strawberries", 1, 1500.0, 40.0, handling=2.0)
    r = MockRoute(1, 1, 1, 3.0, 0.20, 5000.0)
    dem = MockDemand(1, "Organic Strawberries", 1000.0, 6.00)

    result = solve_allocation(
        batches=[b],
        destinations=[d],
        warehouses=[w],
        routes=[r],
        demands=[dem],
        horizon_hours=48.0,
        discount_policy_enabled=False
    )

    assert result["total_allocated_kg"] == 1000.0
    assert result["optimized_fulfillment_pct"] == 100.0
    assert len(result["allocations"]) == 1
    assert result["allocations"][0]["allocated_quantity_kg"] == 1000.0
    assert result["allocations"][0]["net_contribution"] == 1000.0 * (6.00 - 0.20)

def test_discount_application_for_at_risk_batch():
    w = MockWarehouse(1, "W1", "Salinas Hub")
    d = MockDestination(1, "D1", "Bay Area Terminal", "SF", 5000.0)
    b = MockBatch(1, "B1", "Organic Strawberries", 1, 1000.0, 30.0, handling=2.0)
    r = MockRoute(1, 1, 1, 3.0, 0.20, 5000.0)
    dem = MockDemand(1, "Organic Strawberries", 1000.0, 6.00)

    result = solve_allocation(
        batches=[b],
        destinations=[d],
        warehouses=[w],
        routes=[r],
        demands=[dem],
        horizon_hours=48.0,
        discount_policy_enabled=True
    )

    assert len(result["discount_recommendations"]) == 1
    assert result["discount_recommendations"][0]["discount_pct"] == 15.0
    assert result["allocations"][0]["unit_price"] == 5.10
    assert result["allocations"][0]["net_contribution"] == pytest.approx(4900.0)

def test_baseline_vs_optimizer_comparison():
    w = MockWarehouse(1, "W1", "Salinas Hub")
    d1 = MockDestination(1, "D1", "Market North", "City A", 5000.0)
    d2 = MockDestination(2, "D2", "Market South", "City B", 5000.0)
    b1 = MockBatch(1, "B1", "Strawberries", 1, 1000.0, 20.0, handling=2.0)
    b2 = MockBatch(2, "B2", "Strawberries", 1, 1000.0, 60.0, handling=2.0)
    r1 = MockRoute(1, 1, 1, 3.0, 0.30, 2000.0)
    r2 = MockRoute(2, 1, 2, 5.0, 0.50, 2000.0)
    dem1 = MockDemand(1, "Strawberries", 800.0, 6.00)
    dem2 = MockDemand(2, "Strawberries", 800.0, 7.50)

    result = solve_allocation(
        batches=[b1, b2],
        destinations=[d1, d2],
        warehouses=[w],
        routes=[r1, r2],
        demands=[dem1, dem2],
        horizon_hours=48.0
    )

    assert result["status"] in ["Optimal", "Feasible"]
    assert "baseline_spoilage_kg" in result
    assert "optimized_spoilage_kg" in result
    assert "baseline_net_revenue" in result
    assert "optimized_net_revenue" in result
    for a in result["allocations"]:
        assert a["is_feasible"] is True
        assert a["remaining_shelf_life_arrival"] > 0
