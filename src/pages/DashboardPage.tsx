import React from "react";
import { OptimizationRun, InventoryBatch, Destination, Warehouse } from "../types";
import { ComparisonBarChart } from "../components/common/Charts";
import {
  LeafIcon, RouteIcon, TruckIcon, DollarIcon, AlertIcon, ShieldCheckIcon,
  PlayIcon, ChevronRightIcon, TrendingUpIcon, FileTextIcon, MapPinIcon
} from "../components/common/Icons";

interface DashboardPageProps {
  latestRun: OptimizationRun | null;
  inventory: InventoryBatch[];
  destinations: Destination[];
  warehouses: Warehouse[];
  onNavigate: (page: string) => void;
  onOpenExplainability: (item: any) => void;
  searchQuery: string;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  latestRun,
  inventory,
  destinations,
  warehouses,
  onNavigate,
  onOpenExplainability,
  searchQuery
}) => {
  const totalStockKg = inventory.reduce((sum, b) => sum + b.current_quantity_kg, 0);
  const criticalCount = inventory.filter(b => b.risk_status === "Critical-Risk").length;
  const atRiskCount = inventory.filter(b => b.risk_status === "At-Risk").length;

  const spoilageAvoidedKg = latestRun
    ? Math.max(0, latestRun.baseline_spoilage_kg - latestRun.optimized_spoilage_kg)
    : 0;

  const netRevenueGain = latestRun
    ? latestRun.optimized_net_revenue - latestRun.baseline_net_revenue
    : 0;

  const filteredAllocations = (latestRun?.allocations || []).filter(a => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.batch_code.toLowerCase().includes(q) ||
           a.commodity.toLowerCase().includes(q) ||
           a.destination_name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Solver Engine & Demo Workspace Status */}
      <div className="bg-gradient-to-r from-[var(--bg-card)] to-[var(--bg-card-subtle)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--pale-green)] text-[var(--fresh-green)] border border-[var(--fresh-green)]/30">
              Live Optimization Engine
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--soft-gold)] text-[var(--deep-gold)]">
              {latestRun?.solver_method || "Google OR-Tools SCIP MIP"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Perishable Produce Dispatch & Allocation Hub
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
            Coordinating shelf-life constraints, origin inventory, destination market prices, and vehicle freight limits to eliminate spoilage and maximize net revenue.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate("optimization")}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[var(--primary-gold)] hover:opacity-90 text-white shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlayIcon className="w-4 h-4" /> Run New Allocation
          </button>
          <button
            onClick={() => onNavigate("reports")}
            className="px-4 py-2.5 rounded-xl font-semibold text-xs border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--text-main)] transition-colors cursor-pointer"
          >
            Food-Waste Report
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Available Stock */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Available Stock</span>
            <LeafIcon className="w-5 h-5 text-[var(--fresh-green)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)]">
            {totalStockKg.toLocaleString()} <span className="text-sm font-medium text-[var(--text-secondary)]">kg</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="font-semibold text-[var(--critical-red)]">{criticalCount} Critical</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="font-semibold text-[var(--warning-amber)]">{atRiskCount} At-Risk</span>
            <span className="text-[var(--text-muted)]">•</span>
            <span className="text-[var(--text-secondary)]">{inventory.length} Batches</span>
          </div>
        </div>

        {/* Card 2: Optimized Net Revenue */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Modeled Net Revenue</span>
            <DollarIcon className="w-5 h-5 text-[var(--primary-gold)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)]">
            ${(latestRun?.optimized_net_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--fresh-green)] font-semibold">
            <TrendingUpIcon className="w-3.5 h-3.5" />
            <span>+${netRevenueGain.toLocaleString(undefined, { maximumFractionDigits: 0 })} vs. Baseline</span>
          </div>
        </div>

        {/* Card 3: Spoilage Avoided */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Spoilage Avoided</span>
            <ShieldCheckIcon className="w-5 h-5 text-[var(--fresh-green)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--fresh-green)]">
            {spoilageAvoidedKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm font-medium">kg</span>
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-2">
            {latestRun && latestRun.baseline_spoilage_kg > 0
              ? `${((spoilageAvoidedKg / latestRun.baseline_spoilage_kg) * 100).toFixed(1)}% reduction in physical waste`
              : "0 kg baseline spoilage"}
          </div>
        </div>

        {/* Card 4: Demand Fulfillment */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Demand Fulfillment</span>
            <TruckIcon className="w-5 h-5 text-[var(--deep-gold)]" />
          </div>
          <div className="text-2xl font-extrabold text-[var(--text-main)]">
            {latestRun?.optimized_fulfillment_pct || 0}%
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-2">
            Baseline reached {latestRun?.baseline_fulfillment_pct || 0}% fulfillment
          </div>
        </div>
      </div>

      {/* Side-by-Side Baseline vs. Optimization Scorecard */}
      {latestRun && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-[var(--primary-gold)]" />
              Rigorous Baseline Strategy Benchmark
            </h2>
            <span className="text-xs text-[var(--text-secondary)]">
              Evaluated under identical starting inventory, market demand, travel times, and vehicle capacity constraints
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComparisonBarChart
              metricLabel="Estimated Spoilage (Lower is Better)"
              baselineValue={latestRun.baseline_spoilage_kg}
              optimizedValue={latestRun.optimized_spoilage_kg}
              unitSuffix=" kg"
              isLowerBetter={true}
            />
            <ComparisonBarChart
              metricLabel="Modeled Net Revenue (Higher is Better)"
              baselineValue={latestRun.baseline_net_revenue}
              optimizedValue={latestRun.optimized_net_revenue}
              unitPrefix="$"
              isLowerBetter={false}
            />
            <ComparisonBarChart
              metricLabel="Demand Fulfillment %"
              baselineValue={latestRun.baseline_fulfillment_pct}
              optimizedValue={latestRun.optimized_fulfillment_pct}
              unitSuffix="%"
              isLowerBetter={false}
            />
          </div>
        </div>
      )}

      {/* Distribution Network Map / Schematic */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-[var(--primary-gold)]" />
              Regional Distribution Logistics Topology
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Origin Cold-Hub Warehouses &rarr; Destination Consumer Markets across Northern California & Nevada
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-[var(--deep-gold)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary-gold)]" /> 3 Origins
            </span>
            <span className="flex items-center gap-1.5 text-[var(--fresh-green)]">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--fresh-green)]" /> 5 Destinations
            </span>
          </div>
        </div>

        {/* Schematic Grid of Warehouses and Markets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {warehouses.map((wh) => {
            const whBatches = inventory.filter(b => b.origin_warehouse_id === wh.id);
            const whStock = whBatches.reduce((s, b) => s + b.current_quantity_kg, 0);
            return (
              <div key={wh.id} className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[var(--text-main)]">{wh.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--soft-gold)] text-[var(--deep-gold)] font-bold">
                    {wh.code}
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] flex justify-between">
                  <span>Current Inventory:</span>
                  <span className="font-semibold text-[var(--text-main)]">{whStock.toLocaleString()} kg</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary-gold)]"
                    style={{ width: `${Math.min(100, (whStock / wh.capacity_kg) * 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-[var(--text-muted)] flex justify-between">
                  <span>{wh.city}, {wh.state}</span>
                  <span>Cap: {wh.capacity_kg.toLocaleString()} kg</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Suggested Priority Dispatches Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-[var(--fresh-green)]" />
              Prioritized Dispatch Manifest (Latest Run)
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Ranked by perishability urgency and arrival shelf-life margins
            </p>
          </div>
          <button
            onClick={() => onNavigate("dispatch")}
            className="text-xs font-bold text-[var(--primary-gold)] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Manage All Dispatches <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <tr>
                <th className="p-3">Priority</th>
                <th className="p-3">Batch Code</th>
                <th className="p-3">Commodity</th>
                <th className="p-3">Destination Market</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Arrival Freshness</th>
                <th className="p-3">Net Contribution</th>
                <th className="p-3 text-right">Explainability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredAllocations.slice(0, 6).map((alloc) => (
                <tr key={alloc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="p-3 font-bold text-[var(--primary-gold)]">
                    #{alloc.dispatch_priority}
                  </td>
                  <td className="p-3 font-mono font-medium">{alloc.batch_code}</td>
                  <td className="p-3">{alloc.commodity}</td>
                  <td className="p-3 font-medium text-[var(--text-main)]">{alloc.destination_name}</td>
                  <td className="p-3 font-semibold">{alloc.allocated_quantity_kg.toLocaleString()} kg</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      alloc.remaining_shelf_life_arrival <= 24
                        ? "bg-[var(--pale-red)] text-[var(--critical-red)]"
                        : (alloc.remaining_shelf_life_arrival <= 40 ? "bg-[var(--pale-amber)] text-[var(--warning-amber)]" : "bg-[var(--pale-green)] text-[var(--fresh-green)]")
                    }`}>
                      {alloc.remaining_shelf_life_arrival}h margin
                    </span>
                  </td>
                  <td className="p-3 font-bold text-[var(--fresh-green)]">
                    ${alloc.net_contribution.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onOpenExplainability(alloc)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-[var(--soft-gold)] text-[var(--deep-gold)] hover:opacity-90 cursor-pointer"
                    >
                      Why this?
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
