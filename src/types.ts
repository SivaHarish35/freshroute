export interface User {
  id: number;
  email: string;
  full_name: string;
  organization: string;
  role: string;
  has_completed_onboarding: boolean;
  created_at: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  capacity_kg: number;
}

export interface DemandRecord {
  id: number;
  commodity: string;
  demand_quantity_kg: number;
  market_price_per_kg: number;
  time_period: string;
}

export interface Destination {
  id: number;
  code: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  receiving_capacity_kg: number;
  priority_tier: number;
  demands: DemandRecord[];
}

export interface TransportRoute {
  id: number;
  warehouse_id: number;
  warehouse_name: string;
  destination_id: number;
  destination_name: string;
  travel_time_hours: number;
  transport_cost_per_kg: number;
  vehicle_capacity_kg: number;
}

export interface InventoryBatch {
  id: number;
  batch_code: string;
  commodity: string;
  origin_warehouse_id: number;
  initial_quantity_kg: number;
  current_quantity_kg: number;
  remaining_shelf_life_hours: number;
  harvest_date?: string;
  received_at: string;
  storage_temp_c: number;
  handling_time_hours: number;
  spoilage_cost_per_kg: number;
  holding_cost_per_kg: number;
  notes?: string;
  risk_status: "Healthy" | "At-Risk" | "Critical-Risk";
  warehouse_name?: string;
  warehouse_city?: string;
}

export interface AllocationExplanation {
  perishability: {
    initial_shelf_life_hours: number;
    travel_time_hours: number;
    handling_time_hours: number;
    shelf_life_at_arrival_hours: number;
    risk_status: string;
    is_within_tolerance: boolean;
  };
  demand: {
    destination_name: string;
    commodity: string;
    total_demand_kg: number;
    batch_allocated_kg: number;
    fulfillment_pct: number;
  };
  logistics: {
    origin_warehouse: string;
    destination_market: string;
    travel_time_hours: number;
    unit_transport_cost: number;
    total_transport_cost: number;
    destination_capacity_kg: number;
  };
  economics: {
    unit_price: number;
    unit_transport_cost: number;
    net_margin_per_kg: number;
    gross_revenue: number;
    net_contribution: number;
  };
  alternatives: any[];
  plain_language_narrative: string;
}

export interface AllocationItem {
  id: number;
  run_id: number;
  batch_id: number;
  batch_code: string;
  commodity: string;
  warehouse_name: string;
  destination_id: number;
  destination_name: string;
  destination_city: string;
  allocated_quantity_kg: number;
  dispatch_priority: number;
  is_feasible: boolean;
  infeasibility_reason?: string;
  travel_time_hours: number;
  remaining_shelf_life_arrival: number;
  unit_price: number;
  unit_transport_cost: number;
  gross_revenue: number;
  net_contribution: number;
  status: "Proposed" | "Approved" | "Dispatched" | "Completed";
  explanation?: AllocationExplanation;
}

export interface DiscountRecommendation {
  id: number;
  batch_id: number;
  batch_code: string;
  commodity: string;
  remaining_shelf_life_hours: number;
  original_price_per_kg: number;
  discount_pct: number;
  discounted_price_per_kg: number;
  recommended_destination_name?: string;
  reason: string;
  economic_tradeoff: {
    original_price: number;
    discounted_price: number;
    quantity_kg: number;
    salvage_gross_revenue: number;
    avoided_spoilage_penalty: number;
    net_economic_benefit: number;
    shelf_life_hours: number;
    risk_status: string;
  };
}

export interface OptimizationRun {
  id: number;
  run_timestamp: string;
  horizon_hours: number;
  objective_type: string;
  solver_method: string;
  status: string;
  total_inventory_kg: number;
  total_demand_kg: number;
  total_allocated_kg: number;
  baseline_spoilage_kg: number;
  optimized_spoilage_kg: number;
  baseline_net_revenue: number;
  optimized_net_revenue: number;
  baseline_fulfillment_pct: number;
  optimized_fulfillment_pct: number;
  baseline_transport_cost: number;
  optimized_transport_cost: number;
  is_demo: boolean;
  scenario_name?: string;
  allocations: AllocationItem[];
  discount_recommendations: DiscountRecommendation[];
  metadata?: any;
}

export interface ScenarioPreset {
  id?: number;
  name: string;
  description: string;
  delay_hours: number;
  demand_multiplier: number;
  capacity_multiplier: number;
  price_multiplier: number;
}

export interface ForecastPoint {
  period: string;
  historical_demand?: number;
  forecast_demand: number;
  lower_bound: number;
  upper_bound: number;
}

export interface ForecastResponse {
  commodity: string;
  destination: string;
  method: string;
  horizon: string;
  mae: number;
  rmse: number;
  series: ForecastPoint[];
  assumptions: string;
}

export interface TemperatureReading {
  timestamp: string;
  temperature_c: number;
  is_alert: boolean;
  alert_message?: string;
}

export interface ColdChainResponse {
  batch_code: string;
  commodity: string;
  target_temp_c: number;
  tolerance_range: string;
  status: string;
  spoilage_rate_multiplier: number;
  readings: TemperatureReading[];
  explanation: string;
}

export interface FoodWasteImpactReport {
  run_id: number;
  run_timestamp: string;
  scenario_name: string;
  solver_method: string;
  planning_horizon_hours: number;
  baseline_spoilage_kg: number;
  optimized_spoilage_kg: number;
  spoilage_avoided_kg: number;
  relative_reduction_pct: number;
  baseline_waste_cost: number;
  optimized_waste_cost: number;
  waste_cost_saved: number;
  commodity_breakdown: {
    commodity: string;
    total_inventory_kg: number;
    allocated_kg: number;
    allocation_rate_pct: number;
    spoilage_writeoff_risk_unit: string;
  }[];
  methodology_disclosure: string;
}
