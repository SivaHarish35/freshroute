from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, default='Operations Lead')
    organization = Column(String, default='FreshRoute Produce Logistics')
    role = Column(String, default='Logistics Manager')
    has_completed_onboarding = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Warehouse(Base):
    __tablename__ = 'warehouses'
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_kg = Column(Float, default=50000.0)

    batches = relationship('InventoryBatch', back_populates='warehouse')
    routes = relationship('TransportRoute', back_populates='warehouse')

class Destination(Base):
    __tablename__ = 'destinations'
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    receiving_capacity_kg = Column(Float, default=20000.0)
    priority_tier = Column(Integer, default=1)

    demands = relationship('DemandRecord', back_populates='destination')
    routes = relationship('TransportRoute', back_populates='destination')

class InventoryBatch(Base):
    __tablename__ = 'inventory_batches'
    id = Column(Integer, primary_key=True, index=True)
    batch_code = Column(String, unique=True, index=True, nullable=False)
    commodity = Column(String, nullable=False)
    origin_warehouse_id = Column(Integer, ForeignKey('warehouses.id'), nullable=False)
    initial_quantity_kg = Column(Float, nullable=False)
    current_quantity_kg = Column(Float, nullable=False)
    remaining_shelf_life_hours = Column(Float, nullable=False)
    harvest_date = Column(String, nullable=True)
    received_at = Column(DateTime, default=datetime.utcnow)
    storage_temp_c = Column(Float, default=4.0)
    handling_time_hours = Column(Float, default=2.0)
    spoilage_cost_per_kg = Column(Float, default=3.50)
    holding_cost_per_kg = Column(Float, default=0.10)
    notes = Column(String, default='')
    risk_status = Column(String, default='Healthy')

    warehouse = relationship('Warehouse', back_populates='batches')
    temperature_logs = relationship('TemperatureLog', back_populates='batch')

class DemandRecord(Base):
    __tablename__ = 'demand_records'
    id = Column(Integer, primary_key=True, index=True)
    destination_id = Column(Integer, ForeignKey('destinations.id'), nullable=False)
    commodity = Column(String, nullable=False)
    demand_quantity_kg = Column(Float, nullable=False)
    market_price_per_kg = Column(Float, nullable=False)
    time_period = Column(String, default='Current Shift (24h)')

    destination = relationship('Destination', back_populates='demands')

class TransportRoute(Base):
    __tablename__ = 'transport_routes'
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey('warehouses.id'), nullable=False)
    destination_id = Column(Integer, ForeignKey('destinations.id'), nullable=False)
    travel_time_hours = Column(Float, nullable=False)
    transport_cost_per_kg = Column(Float, nullable=False)
    vehicle_capacity_kg = Column(Float, default=15000.0)

    warehouse = relationship('Warehouse', back_populates='routes')
    destination = relationship('Destination', back_populates='routes')

class OptimizationRun(Base):
    __tablename__ = 'optimization_runs'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    run_timestamp = Column(DateTime, default=datetime.utcnow)
    horizon_hours = Column(Float, default=48.0)
    objective_type = Column(String, default='maximize_net_revenue')
    solver_method = Column(String, default='OR-Tools SCIP MIP')
    status = Column(String, default='Optimal')
    total_inventory_kg = Column(Float, default=0.0)
    total_demand_kg = Column(Float, default=0.0)
    total_allocated_kg = Column(Float, default=0.0)
    baseline_spoilage_kg = Column(Float, default=0.0)
    optimized_spoilage_kg = Column(Float, default=0.0)
    baseline_net_revenue = Column(Float, default=0.0)
    optimized_net_revenue = Column(Float, default=0.0)
    baseline_fulfillment_pct = Column(Float, default=0.0)
    optimized_fulfillment_pct = Column(Float, default=0.0)
    baseline_transport_cost = Column(Float, default=0.0)
    optimized_transport_cost = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=False)
    scenario_name = Column(String, nullable=True)
    metadata_json = Column(Text, default='{}')

    allocations = relationship('AllocationItem', back_populates='run', cascade='all, delete-orphan')
    discount_recommendations = relationship('DiscountRecommendation', back_populates='run', cascade='all, delete-orphan')

class AllocationItem(Base):
    __tablename__ = 'allocation_items'
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey('optimization_runs.id'), nullable=False)
    batch_id = Column(Integer, ForeignKey('inventory_batches.id'), nullable=False)
    destination_id = Column(Integer, ForeignKey('destinations.id'), nullable=False)
    allocated_quantity_kg = Column(Float, nullable=False)
    dispatch_priority = Column(Integer, default=1)
    is_feasible = Column(Boolean, default=True)
    infeasibility_reason = Column(String, nullable=True)
    travel_time_hours = Column(Float, default=0.0)
    remaining_shelf_life_arrival = Column(Float, default=0.0)
    unit_price = Column(Float, default=0.0)
    unit_transport_cost = Column(Float, default=0.0)
    gross_revenue = Column(Float, default=0.0)
    net_contribution = Column(Float, default=0.0)
    status = Column(String, default='Proposed') # Proposed, Approved, Dispatched, Completed
    explanation_json = Column(Text, default='{}')

    run = relationship('OptimizationRun', back_populates='allocations')
    batch = relationship('InventoryBatch')
    destination = relationship('Destination')

class DiscountRecommendation(Base):
    __tablename__ = 'discount_recommendations'
    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey('optimization_runs.id'), nullable=True)
    batch_id = Column(Integer, ForeignKey('inventory_batches.id'), nullable=False)
    original_price_per_kg = Column(Float, nullable=False)
    discount_pct = Column(Float, nullable=False)
    discounted_price_per_kg = Column(Float, nullable=False)
    recommended_destination_id = Column(Integer, ForeignKey('destinations.id'), nullable=True)
    reason = Column(String, nullable=False)
    economic_tradeoff_json = Column(Text, default='{}')

    run = relationship('OptimizationRun', back_populates='discount_recommendations')
    batch = relationship('InventoryBatch')
    destination = relationship('Destination')

class Scenario(Base):
    __tablename__ = 'scenarios'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, default='')
    delay_hours = Column(Float, default=0.0)
    demand_multiplier = Column(Float, default=1.0)
    capacity_multiplier = Column(Float, default=1.0)
    price_multiplier = Column(Float, default=1.0)
    route_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TemperatureLog(Base):
    __tablename__ = 'temperature_logs'
    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey('inventory_batches.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    temperature_c = Column(Float, nullable=False)
    is_alert = Column(Boolean, default=False)
    alert_message = Column(String, nullable=True)
    is_simulated = Column(Boolean, default=True)

    batch = relationship('InventoryBatch', back_populates='temperature_logs')
