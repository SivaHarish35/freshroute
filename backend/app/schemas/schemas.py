from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# User & Auth
class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str = 'Logistics Lead'
    organization: str = 'FreshRoute Produce Logistics'
    role: str = 'Operations Manager'

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    organization: str
    role: str
    has_completed_onboarding: bool
    created_at: datetime
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserResponse

class OnboardingUpdate(BaseModel):
    has_completed_onboarding: bool

# Inventory
class InventoryBatchCreate(BaseModel):
    batch_code: str
    commodity: str
    origin_warehouse_id: int
    initial_quantity_kg: float
    current_quantity_kg: float
    remaining_shelf_life_hours: float
    harvest_date: Optional[str] = None
    storage_temp_c: float = 4.0
    handling_time_hours: float = 2.0
    spoilage_cost_per_kg: float = 3.50
    holding_cost_per_kg: float = 0.10
    notes: Optional[str] = ''

class InventoryBatchUpdate(BaseModel):
    commodity: Optional[str] = None
    current_quantity_kg: Optional[float] = None
    remaining_shelf_life_hours: Optional[float] = None
    storage_temp_c: Optional[float] = None
    notes: Optional[str] = None

class InventoryBatchResponse(BaseModel):
    id: int
    batch_code: str
    commodity: str
    origin_warehouse_id: int
    initial_quantity_kg: float
    current_quantity_kg: float
    remaining_shelf_life_hours: float
    harvest_date: Optional[str]
    received_at: datetime
    storage_temp_c: float
    handling_time_hours: float
    spoilage_cost_per_kg: float
    holding_cost_per_kg: float
    notes: Optional[str]
    risk_status: str
    warehouse_name: Optional[str] = None
    warehouse_city: Optional[str] = None
    class Config:
        from_attributes = True

# Destinations & Demand
class DemandRecordResponse(BaseModel):
    id: int
    commodity: str
    demand_quantity_kg: float
    market_price_per_kg: float
    time_period: str
    class Config:
        from_attributes = True

class DestinationResponse(BaseModel):
    id: int
    code: str
    name: str
    city: str
    state: str
    latitude: float
    longitude: float
    receiving_capacity_kg: float
    priority_tier: int
    demands: List[DemandRecordResponse] = []
    class Config:
        from_attributes = True

# Warehouse
class WarehouseResponse(BaseModel):
    id: int
    code: str
    name: str
    city: str
    state: str
    latitude: float
    longitude: float
    capacity_kg: float
    class Config:
        from_attributes = True

# Optimization
class OptimizationRequest(BaseModel):
    horizon_hours: float = 48.0
    objective_type: str = 'maximize_net_revenue' # 'maximize_net_revenue', 'minimize_spoilage', 'balanced'
    discount_policy_enabled: bool = True
    delay_hours: float = 0.0
    demand_multiplier: float = 1.0
    capacity_multiplier: float = 1.0
    scenario_name: Optional[str] = None

class AllocationItemResponse(BaseModel):
    id: int
    run_id: int
    batch_id: int
    batch_code: str
    commodity: str
    warehouse_name: str
    destination_id: int
    destination_name: str
    destination_city: str
    allocated_quantity_kg: float
    dispatch_priority: int
    is_feasible: bool
    infeasibility_reason: Optional[str] = None
    travel_time_hours: float
    remaining_shelf_life_arrival: float
    unit_price: float
    unit_transport_cost: float
    gross_revenue: float
    net_contribution: float
    status: str
    explanation: Dict[str, Any] = {}

class DiscountRecommendationResponse(BaseModel):
    id: int
    batch_id: int
    batch_code: str
    commodity: str
    remaining_shelf_life_hours: float
    original_price_per_kg: float
    discount_pct: float
    discounted_price_per_kg: float
    recommended_destination_name: Optional[str] = None
    reason: str
    economic_tradeoff: Dict[str, Any] = {}

class OptimizationRunResponse(BaseModel):
    id: int
    run_timestamp: datetime
    horizon_hours: float
    objective_type: str
    solver_method: str
    status: str
    total_inventory_kg: float
    total_demand_kg: float
    total_allocated_kg: float
    baseline_spoilage_kg: float
    optimized_spoilage_kg: float
    baseline_net_revenue: float
    optimized_net_revenue: float
    baseline_fulfillment_pct: float
    optimized_fulfillment_pct: float
    baseline_transport_cost: float
    optimized_transport_cost: float
    is_demo: bool
    scenario_name: Optional[str]
    allocations: List[AllocationItemResponse] = []
    discount_recommendations: List[DiscountRecommendationResponse] = []
    metadata: Dict[str, Any] = {}
    class Config:
        from_attributes = True

# Dispatch Update
class DispatchUpdateRequest(BaseModel):
    status: str # Proposed, Approved, Dispatched, Completed
    allocated_quantity_kg: Optional[float] = None

# Scenarios
class ScenarioPreset(BaseModel):
    id: str
    name: str
    description: str
    delay_hours: float = 0.0
    demand_multiplier: float = 1.0
    capacity_multiplier: float = 1.0
    price_multiplier: float = 1.0
    route_blocked_desc: Optional[str] = None

# Forecast
class ForecastPoint(BaseModel):
    period: str
    historical_demand: Optional[float] = None
    forecast_demand: float
    lower_bound: float
    upper_bound: float

class ForecastResponse(BaseModel):
    commodity: str
    destination: str
    method: str
    horizon: str
    mae: float
    rmse: float
    series: List[ForecastPoint]
    assumptions: str

# Temperature
class TemperatureReading(BaseModel):
    timestamp: str
    temperature_c: float
    is_alert: bool
    alert_message: Optional[str] = None

class ColdChainSimulationResponse(BaseModel):
    batch_code: str
    commodity: str
    target_temp_c: float
    tolerance_range: str
    status: str
    spoilage_rate_multiplier: float
    readings: List[TemperatureReading]
    explanation: str

# Food Waste Impact
class FoodWasteImpactReport(BaseModel):
    run_id: int
    run_timestamp: datetime
    planning_horizon_hours: float
    baseline_spoilage_kg: float
    optimized_spoilage_kg: float
    spoilage_avoided_kg: float
    relative_reduction_pct: float
    baseline_waste_cost: float
    optimized_waste_cost: float
    waste_cost_saved: float
    commodity_breakdown: List[Dict[str, Any]]
    methodology_disclosure: str
