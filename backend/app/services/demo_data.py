from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import (
    User, Warehouse, Destination, InventoryBatch, DemandRecord,
    TransportRoute, Scenario, OptimizationRun, AllocationItem
)
from app.services.discount_engine import compute_batch_risk_status

def seed_demo_database(db: Session, overwrite: bool = False):
    """
    Seeds the SQLite database with rich, realistic, internally consistent synthetic produce distribution data.
    Explicitly labeled: DEMO DATA — SIMULATED.
    """
    if overwrite:
        db.query(AllocationItem).delete()
        db.query(OptimizationRun).delete()
        db.query(DemandRecord).delete()
        db.query(TransportRoute).delete()
        db.query(InventoryBatch).delete()
        db.query(Destination).delete()
        db.query(Warehouse).delete()
        db.query(Scenario).delete()
        db.commit()

    # If already seeded and not overwrite, skip
    if db.query(Warehouse).count() > 0:
        return

    # 1. Warehouses (Origins)
    w1 = Warehouse(
        code="WH-SALINAS",
        name="Salinas Valley Cold Hub",
        city="Salinas",
        state="CA",
        latitude=36.6777,
        longitude=-121.6555,
        capacity_kg=60000.0
    )
    w2 = Warehouse(
        code="WH-CENTRAL",
        name="Central Valley Distribution Center",
        city="Fresno",
        state="CA",
        latitude=36.7468,
        longitude=-119.7726,
        capacity_kg=80000.0
    )
    w3 = Warehouse(
        code="WH-WATSON",
        name="Watsonville Berry & Organic Depot",
        city="Watsonville",
        state="CA",
        latitude=36.9102,
        longitude=-121.7569,
        capacity_kg=45000.0
    )
    db.add_all([w1, w2, w3])
    db.commit()

    # 2. Destinations (Markets)
    d1 = Destination(
        code="DEST-SFO",
        name="Bay Area Produce Terminal",
        city="South San Francisco",
        state="CA",
        latitude=37.6547,
        longitude=-122.4077,
        receiving_capacity_kg=22000.0,
        priority_tier=1
    )
    d2 = Destination(
        code="DEST-SAC",
        name="Sacramento Valley Regional Foods",
        city="Sacramento",
        state="CA",
        latitude=38.5816,
        longitude=-121.4944,
        receiving_capacity_kg=18000.0,
        priority_tier=1
    )
    d3 = Destination(
        code="DEST-OAK",
        name="Metro East Bay Distribution Hub",
        city="Oakland",
        state="CA",
        latitude=37.8044,
        longitude=-122.2712,
        receiving_capacity_kg=20000.0,
        priority_tier=2
    )
    d4 = Destination(
        code="DEST-SJC",
        name="Silicon Valley Fresh Co-op",
        city="San Jose",
        state="CA",
        latitude=37.3382,
        longitude=-121.8863,
        receiving_capacity_kg=15000.0,
        priority_tier=2
    )
    d5 = Destination(
        code="DEST-RENO",
        name="High Sierra Logistics Center",
        city="Reno",
        state="NV",
        latitude=39.5296,
        longitude=-119.8138,
        receiving_capacity_kg=12000.0,
        priority_tier=3
    )
    db.add_all([d1, d2, d3, d4, d5])
    db.commit()

    # 3. Transport Routes (Origin -> Destination travel times, costs, truck capacity)
    routes_data = [
        # Salinas
        (w1.id, d1.id, 2.5, 0.22, 12000.0),
        (w1.id, d2.id, 3.8, 0.30, 10000.0),
        (w1.id, d3.id, 2.8, 0.25, 12000.0),
        (w1.id, d4.id, 1.8, 0.18, 14000.0),
        (w1.id, d5.id, 6.8, 0.52, 8000.0),

        # Fresno
        (w2.id, d1.id, 3.8, 0.32, 14000.0),
        (w2.id, d2.id, 2.7, 0.24, 15000.0),
        (w2.id, d3.id, 3.5, 0.28, 14000.0),
        (w2.id, d4.id, 3.0, 0.26, 12000.0),
        (w2.id, d5.id, 5.5, 0.45, 9000.0),

        # Watsonville
        (w3.id, d1.id, 2.0, 0.20, 10000.0),
        (w3.id, d2.id, 3.5, 0.28, 9000.0),
        (w3.id, d3.id, 2.3, 0.22, 10000.0),
        (w3.id, d4.id, 1.2, 0.15, 12000.0),
        (w3.id, d5.id, 6.2, 0.48, 7000.0),
    ]
    for w_id, d_id, t_hours, cost_kg, veh_cap in routes_data:
        db.add(TransportRoute(
            warehouse_id=w_id,
            destination_id=d_id,
            travel_time_hours=t_hours,
            transport_cost_per_kg=cost_kg,
            vehicle_capacity_kg=veh_cap
        ))
    db.commit()

    # 4. Inventory Batches (Diverse shelf-life, commodities, quantities, risk levels)
    batches_data = [
        # batch_code, commodity, origin_w, qty, shelf_life, handling, spoil_cost, hold_cost, notes
        ("BATCH-STR-101", "Organic Strawberries", w3.id, 3200.0, 22.0, 2.0, 4.80, 0.15, "Critical-Risk: Pre-cooled berries from Salinas south field"),
        ("BATCH-STR-102", "Organic Strawberries", w3.id, 4500.0, 42.0, 2.0, 4.80, 0.15, "At-Risk: Morning harvest, standard clamshell packaging"),
        ("BATCH-STR-103", "Organic Strawberries", w1.id, 5000.0, 68.0, 2.0, 4.80, 0.15, "Healthy: Hydro-cooled pristine lot"),

        ("BATCH-SPN-201", "Baby Spinach", w1.id, 2800.0, 20.0, 1.5, 3.90, 0.10, "Critical-Risk: Triple-washed bagged greens, tight expiry"),
        ("BATCH-SPN-202", "Baby Spinach", w1.id, 4200.0, 52.0, 1.5, 3.90, 0.10, "Healthy: Modified atmosphere nitrogen sealed"),

        ("BATCH-TOM-301", "Vine Tomatoes", w2.id, 6500.0, 36.0, 2.0, 3.20, 0.08, "At-Risk: High color cluster tomatoes, ambient storage"),
        ("BATCH-TOM-302", "Vine Tomatoes", w2.id, 8000.0, 84.0, 2.0, 3.20, 0.08, "Healthy: Firm green-to-breaker stage lot"),

        ("BATCH-AVO-401", "Haas Avocados", w2.id, 5500.0, 28.0, 2.0, 5.20, 0.12, "At-Risk: Stage 4 ripe, ready-to-eat pressure test"),
        ("BATCH-AVO-402", "Haas Avocados", w2.id, 7500.0, 96.0, 2.0, 5.20, 0.12, "Healthy: Hard green import grade"),

        ("BATCH-PCH-501", "Sweet Peaches", w2.id, 3800.0, 30.0, 2.5, 4.20, 0.10, "At-Risk: Tree-ripened stone fruit from Fresno orchard"),
        ("BATCH-PCH-502", "Sweet Peaches", w2.id, 4600.0, 72.0, 2.5, 4.20, 0.10, "Healthy: Cold-stored firm peaches"),

        ("BATCH-CHS-601", "Artisan Soft Cheeses", w1.id, 1800.0, 18.0, 1.5, 6.50, 0.20, "Critical-Risk: Brie & Camembert lot near code expiration")
    ]

    for code, comm, origin, qty, sl, handling, spoil_cost, hold_cost, notes in batches_data:
        r_status = compute_batch_risk_status(sl)
        db.add(InventoryBatch(
            batch_code=code,
            commodity=comm,
            origin_warehouse_id=origin,
            initial_quantity_kg=qty,
            current_quantity_kg=qty,
            remaining_shelf_life_hours=sl,
            harvest_date="2026-10-14",
            handling_time_hours=handling,
            spoilage_cost_per_kg=spoil_cost,
            holding_cost_per_kg=hold_cost,
            notes=notes,
            risk_status=r_status
        ))
    db.commit()

    # 5. Destination Demands & Market Prices
    demands_data = [
        # (dest_id, commodity, demand_kg, price_per_kg)
        (d1.id, "Organic Strawberries", 4200.0, 6.20),
        (d1.id, "Baby Spinach", 3200.0, 4.80),
        (d1.id, "Vine Tomatoes", 5000.0, 4.20),
        (d1.id, "Haas Avocados", 4500.0, 6.80),
        (d1.id, "Sweet Peaches", 3000.0, 5.50),
        (d1.id, "Artisan Soft Cheeses", 1200.0, 8.50),

        (d2.id, "Organic Strawberries", 3500.0, 5.80),
        (d2.id, "Baby Spinach", 2500.0, 4.50),
        (d2.id, "Vine Tomatoes", 4200.0, 3.90),
        (d2.id, "Haas Avocados", 3800.0, 6.40),
        (d2.id, "Sweet Peaches", 2800.0, 5.20),

        (d3.id, "Organic Strawberries", 3000.0, 6.00),
        (d3.id, "Baby Spinach", 2200.0, 4.60),
        (d3.id, "Vine Tomatoes", 3800.0, 4.10),
        (d3.id, "Haas Avocados", 3200.0, 6.60),
        (d3.id, "Artisan Soft Cheeses", 800.0, 8.20),

        (d4.id, "Organic Strawberries", 2800.0, 6.40),
        (d4.id, "Baby Spinach", 2000.0, 4.90),
        (d4.id, "Haas Avocados", 3000.0, 7.00),

        (d5.id, "Vine Tomatoes", 3500.0, 3.80),
        (d5.id, "Sweet Peaches", 2500.0, 4.90)
    ]
    for dest_id, comm, dem_qty, price in demands_data:
        db.add(DemandRecord(
            destination_id=dest_id,
            commodity=comm,
            demand_quantity_kg=dem_qty,
            market_price_per_kg=price,
            time_period="Current Shift (24h Planning Window)"
        ))
    db.commit()

    # 6. Preset Operational Scenarios
    scenarios_data = [
        ("Normal Operations", "Baseline operating conditions with standard transit times, normal consumer demand, and full transport capacity.", 0.0, 1.0, 1.0, 1.0),
        ("Interstate Hwy Delay (+3.5h Transit)", "Severe highway congestion between Central Valley and Bay Area adding 3.5h to transit routes, testing shelf-life safety margins.", 3.5, 1.0, 1.0, 1.0),
        ("Weekend Demand Surge (+30%)", "Holiday weekend retail surge spiking destination demand by 30% across fresh berry and avocado lines.", 0.0, 1.3, 1.0, 1.05),
        ("Reefer Truck Fleet Shortage (-35% Fleet Cap)", "Temporary mechanical breakdown cutting regional reefer freight capacity by 35%, enforcing strict priority rationing.", 0.0, 1.0, 0.65, 1.0),
        ("Extreme Heat Spike & Price Volatility", "Heatwave causing accelerated ambient decay and market price shifts (+15% price spike in Bay Area, transit delays +2h).", 2.0, 1.15, 0.85, 1.15),
    ]
    for name, desc, delay, dem_m, cap_m, price_m in scenarios_data:
        db.add(Scenario(
            name=name,
            description=desc,
            delay_hours=delay,
            demand_multiplier=dem_m,
            capacity_multiplier=cap_m,
            price_multiplier=price_m
        ))
    db.commit()

    print("Demo database successfully initialized with rich synthetic produce distribution dataset.")
