import React, { useState } from "react";
import { OptimizationRun, AllocationItem, DiscountRecommendation } from "../types";
import { useAuth } from "../context/AuthContext";
import { ComparisonBarChart } from "../components/common/Charts";
import {
  TruckIcon, PlayIcon, ShieldCheckIcon, AlertIcon, DollarIcon,
  ClockIcon, LeafIcon, SlidersIcon, RefreshIcon, ChevronRightIcon, CheckIcon
} from "../components/common/Icons";

interface OptimizationCenterPageProps {
  latestRun: OptimizationRun | null;
  onRunOptimization: (params: any) => Promise<void>;
  onOpenExplainability: (item: AllocationItem) => void;
  isRunning: boolean;
  searchQuery: string;
}

export const OptimizationCenterPage: React.FC<OptimizationCenterPageProps> = ({
  latestRun,
  onRunOptimization,
  onOpenExplainability,
  isRunning,
  searchQuery
}) => {
  const [horizonHours, setHorizonHours] = useState<number>(48);
  const [objectiveType, setObjectiveType] = useState<string>("maximize_net_revenue");
  const [discountEnabled, setDiscountEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"allocations" | "discounts" | "baseline">("allocations");

  const handleRun = async () => {
    await onRunOptimization({
      horizon_hours: horizonHours,
      objective_type: objectiveType,
      discount_policy_enabled: discountEnabled
    });
  };

  const filteredAllocations = (latestRun?.allocations || []).filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.batch_code.toLowerCase().includes(q) ||
           a.commodity.toLowerCase().includes(q) ||
           a.destination_name.toLowerCase().includes(q);
  });

  const spoilageAvoidedKg = latestRun
    ? Math.max(0, latestRun.baseline_spoilage_kg - latestRun.optimized_spoilage_kg)
    : 0;

  const netGain = latestRun
    ? latestRun.optimized_net_revenue - latestRun.baseline_net_revenue
    : 0;

  return (
    <div className="space-y-6">
      {/* Title & Engine Specs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
              Mixed Integer Programming
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--pale-green)] text-[var(--fresh-green)]">
              Google OR-Tools SCIP Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Perishability Optimization Center
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Solves exact multi-commodity, multi-destination allocation enforcing transit perishability feasibility (Transit + Handling &le; Shelf Life).
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-6 py-3 rounded-xl font-bold text-xs bg-[var(--primary-gold)] hover:opacity-90 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshIcon className="w-4 h-4 animate-spin" /> Solving MIP Constraints...
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4" /> Run Constrained Optimization
            </>
          )}
        </button>
      </div>

      {/* Solver Configuration Panel */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-gold)] flex items-center gap-1.5">
            <SlidersIcon className="w-4 h-4" /> Optimization Parameters & Economic Objective
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            Configures mathematical constraints and objective weights
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Horizon Slider */}
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Planning Horizon:</span>
              <span className="text-[var(--primary-gold)] font-bold">{horizonHours} hours</span>
            </div>
            <input
              type="range"
              min={24}
              max={72}
              step={12}
              value={horizonHours}
              onChange={(e) => setHorizonHours(Number(e.target.value))}
              className="w-full accent-[var(--primary-gold)] cursor-pointer"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block mt-1">
              Unallocated batches with shelf-life &le; horizon are accounted as spoiled.
            </span>
          </div>

          {/* Objective Function */}
          <div>
            <label className="font-semibold block mb-1">Solver Objective Function:</label>
            <select
              value={objectiveType}
              onChange={(e) => setObjectiveType(e.target.value)}
              className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-hidden font-medium"
            >
              <option value="maximize_net_revenue">Maximize Net Revenue (Sales - Freight - Spoilage)</option>
              <option value="minimize_spoilage">Minimize Modeled Spoilage (Max Stock Clearance)</option>
              <option value="balanced">Balanced (Revenue Maximization + 2.5x Spoilage Avoidance)</option>
            </select>
          </div>

          {/* Discount Policy Toggle */}
          <div>
            <label className="font-semibold block mb-1">At-Risk Discount Recommendation:</label>
            <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]">
              <input
                type="checkbox"
                id="discount-toggle"
                checked={discountEnabled}
                onChange={(e) => setDiscountEnabled(e.target.checked)}
                className="accent-[var(--primary-gold)] w-4 h-4 cursor-pointer"
              />
              <label htmlFor="discount-toggle" className="cursor-pointer text-xs font-medium text-[var(--text-main)]">
                Enable Dynamic Markdown Tiers (15% - 30%)
              </label>
            </div>
            <span className="text-[10px] text-[var(--text-secondary)] block mt-1">
              Automatically recommends promotional pricing for batches with &le; 48h shelf life.
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison vs. Documented Baseline */}
      {latestRun && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-[var(--text-main)] flex items-center gap-2">
                <ShieldCheckIcon className="w-5 h-5 text-[var(--fresh-green)]" />
                Baseline vs. Optimization Evaluation Scorecard
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Both strategies evaluated under identical starting stock, demand orders, freight matrices, and cost parameters.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[var(--pale-green)] px-3 py-1.5 rounded-xl border border-[var(--fresh-green)]/30 text-xs font-bold text-[var(--fresh-green)]">
              <span>Status: {latestRun.status}</span>
              <span>•</span>
              <span>{latestRun.solver_method}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ComparisonBarChart
              metricLabel="Estimated Spoilage (kg)"
              baselineValue={latestRun.baseline_spoilage_kg}
              optimizedValue={latestRun.optimized_spoilage_kg}
              unitSuffix=" kg"
              isLowerBetter={true}
            />
            <ComparisonBarChart
              metricLabel="Modeled Net Revenue ($)"
              baselineValue={latestRun.baseline_net_revenue}
              optimizedValue={latestRun.optimized_net_revenue}
              unitPrefix="$"
              isLowerBetter={false}
            />
            <ComparisonBarChart
              metricLabel="Demand Fulfillment Rate"
              baselineValue={latestRun.baseline_fulfillment_pct}
              optimizedValue={latestRun.optimized_fulfillment_pct}
              unitSuffix="%"
              isLowerBetter={false}
            />
            <ComparisonBarChart
              metricLabel="Logistics Freight Cost ($)"
              baselineValue={latestRun.baseline_transport_cost}
              optimizedValue={latestRun.optimized_transport_cost}
              unitPrefix="$"
              isLowerBetter={true}
            />
          </div>
        </div>
      )}

      {/* Results Tab Navigation */}
      <div className="flex border-b border-[var(--border-color)] space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("allocations")}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === "allocations"
              ? "border-[var(--primary-gold)] text-[var(--primary-gold)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]"
          }`}
        >
          Optimized Allocations ({filteredAllocations.length})
        </button>
        <button
          onClick={() => setActiveTab("discounts")}
          className={`pb-3 transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
            activeTab === "discounts"
              ? "border-[var(--primary-gold)] text-[var(--primary-gold)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]"
          }`}
        >
          <span>Discount Recommendations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[var(--pale-amber)] text-[var(--warning-amber)] text-[10px]">
            {latestRun?.discount_recommendations?.length || 0}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("baseline")}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === "baseline"
              ? "border-[var(--primary-gold)] text-[var(--primary-gold)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]"
          }`}
        >
          Baseline Strategy Details (EEF)
        </button>
      </div>

      {/* Tab 1: Allocations Table */}
      {activeTab === "allocations" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-semibold">
                <tr>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Batch Code</th>
                  <th className="p-3.5">Commodity</th>
                  <th className="p-3.5">Origin Warehouse</th>
                  <th className="p-3.5">Destination Terminal</th>
                  <th className="p-3.5">Allocated Qty</th>
                  <th className="p-3.5">Transit Time</th>
                  <th className="p-3.5">Arrival Freshness</th>
                  <th className="p-3.5">Net Contribution</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {filteredAllocations.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="p-3.5 font-bold text-[var(--primary-gold)]">
                      #{a.dispatch_priority}
                    </td>
                    <td className="p-3.5 font-mono font-medium">{a.batch_code}</td>
                    <td className="p-3.5 font-medium">{a.commodity}</td>
                    <td className="p-3.5 text-[var(--text-secondary)]">{a.warehouse_name}</td>
                    <td className="p-3.5 font-semibold text-[var(--text-main)]">{a.destination_name}</td>
                    <td className="p-3.5 font-bold text-[var(--text-main)]">
                      {a.allocated_quantity_kg.toLocaleString()} kg
                    </td>
                    <td className="p-3.5 text-[var(--text-secondary)]">{a.travel_time_hours}h</td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        a.remaining_shelf_life_arrival <= 24
                          ? "bg-[var(--pale-red)] text-[var(--critical-red)]"
                          : (a.remaining_shelf_life_arrival <= 40 ? "bg-[var(--pale-amber)] text-[var(--warning-amber)]" : "bg-[var(--pale-green)] text-[var(--fresh-green)]")
                      }`}>
                        {a.remaining_shelf_life_arrival}h margin
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-[var(--fresh-green)]">
                      ${a.net_contribution.toLocaleString()}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => onOpenExplainability(a)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--soft-gold)] text-[var(--deep-gold)] hover:opacity-90 cursor-pointer shadow-2xs"
                      >
                        Why this allocation?
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Discount Recommendations */}
      {activeTab === "discounts" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <DollarIcon className="w-5 h-5 text-[var(--primary-gold)]" />
              Dynamic Perishability Markdown Recommendations
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Proactive price reductions recommended for batches approaching critical spoilage windows to salvage inventory value.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestRun?.discount_recommendations?.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--text-main)]">{d.batch_code} ({d.commodity})</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--pale-red)] text-[var(--critical-red)]">
                    -{d.discount_pct}% Discount
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {d.reason}
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[var(--border-color)]">
                  <div>
                    <span className="text-[var(--text-muted)] block">Original Price</span>
                    <span className="font-semibold">${d.original_price_per_kg.toFixed(2)}/kg</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Discounted Price</span>
                    <span className="font-bold text-[var(--fresh-green)]">${d.discounted_price_per_kg.toFixed(2)}/kg</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Net Gain vs. Spoilage</span>
                    <span className="font-bold text-[var(--primary-gold)]">
                      +${(d.economic_tradeoff?.net_economic_benefit || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Baseline Details */}
      {activeTab === "baseline" && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-base font-extrabold text-[var(--text-main)]">
            Earliest-Expiry-First (EEF) Baseline Strategy Documentation
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            The Earliest-Expiry-First (EEF) heuristic prioritizes batches purely chronologically by remaining shelf-life, greedily allocating to the first reachable destination with demand and capacity. While it obeys hard feasibility, it does not globally optimize market prices, transportation costs, or joint vehicle route capacities.
          </p>
          <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] text-xs space-y-2 border border-[var(--border-color)]">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Baseline Estimated Spoilage:</span>
              <span className="font-bold text-[var(--critical-red)]">{latestRun?.baseline_spoilage_kg.toLocaleString()} kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Baseline Modeled Net Revenue:</span>
              <span className="font-semibold">${latestRun?.baseline_net_revenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Baseline Demand Fulfillment:</span>
              <span className="font-semibold">{latestRun?.baseline_fulfillment_pct}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
