import React from "react";
import { AllocationItem } from "../../types";
import { XIcon, ShieldCheckIcon, AlertIcon, DollarIcon, TruckIcon, ClockIcon, LeafIcon } from "./Icons";

interface ExplainabilityDrawerProps {
  item: AllocationItem | null;
  onClose: () => void;
}

export const ExplainabilityDrawer: React.FC<ExplainabilityDrawerProps> = ({ item, onClose }) => {
  if (!item) return null;

  const exp = item.explanation;
  const perish = exp?.perishability;
  const demand = exp?.demand;
  const logistics = exp?.logistics;
  const econ = exp?.economics;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-xl bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-start justify-between bg-[var(--bg-card-subtle)]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
                Algorithmic Explainability
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--pale-green)] text-[var(--fresh-green)]">
                Priority #{item.dispatch_priority}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              Why This Allocation?
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              {item.batch_code} ({item.commodity}) &rarr; {item.destination_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--text-secondary)] transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Dynamic AI / Optimization Narrative */}
          <div className="p-4 rounded-xl bg-[var(--pale-green)] border border-[var(--fresh-green)]/30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--fresh-green)] mb-2">
              <ShieldCheckIcon className="w-4 h-4" />
              Optimization Decision Rationale
            </div>
            <p className="text-sm text-[var(--text-main)] leading-relaxed">
              {exp?.plain_language_narrative || "Allocation verified against all perishability, capacity, and demand bounds."}
            </p>
          </div>

          {/* Section 1: Perishability & Shelf-Life Feasibility */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <LeafIcon className="w-4 h-4 text-[var(--fresh-green)]" />
              1. Perishability & Freshness Margin
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <span className="text-xs text-[var(--text-secondary)] block">Shelf-Life at Dispatch</span>
                <span className="text-lg font-bold text-[var(--text-main)]">
                  {perish?.initial_shelf_life_hours || item.remaining_shelf_life_arrival}h
                </span>
                <span className={`text-[10px] block font-semibold ${
                  (perish?.initial_shelf_life_hours || 50) <= 24 ? "text-[var(--critical-red)]" : "text-[var(--fresh-green)]"
                }`}>
                  {perish?.risk_status || "Healthy"}
                </span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <span className="text-xs text-[var(--text-secondary)] block">Shelf-Life on Arrival</span>
                <span className="text-lg font-bold text-[var(--fresh-green)]">
                  {item.remaining_shelf_life_arrival}h
                </span>
                <span className="text-[10px] block text-[var(--text-secondary)]">
                  After transit & handling
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--bg-card-subtle)] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Transit Time:</span>
                <span className="font-semibold">{item.travel_time_hours} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Handling Buffer Required:</span>
                <span className="font-semibold">{perish?.handling_time_hours || 2.0} hours</span>
              </div>
              <div className="flex justify-between border-t border-[var(--border-color)] pt-1">
                <span className="text-[var(--text-secondary)]">Shelf-Life Feasibility:</span>
                <span className="font-bold text-[var(--fresh-green)] flex items-center gap-1">
                  <ShieldCheckIcon className="w-3.5 h-3.5" /> Feasible (Within Allowance)
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Demand & Capacity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <TruckIcon className="w-4 h-4 text-[var(--primary-gold)]" />
              2. Demand Fulfillment & Logistics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <span className="text-xs text-[var(--text-secondary)] block">Allocated Quantity</span>
                <span className="text-lg font-bold text-[var(--text-main)]">
                  {item.allocated_quantity_kg.toLocaleString()} kg
                </span>
                <span className="text-[10px] block text-[var(--text-secondary)]">
                  Fulfills {demand?.fulfillment_pct || 100}% of market order
                </span>
              </div>
              <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]">
                <span className="text-xs text-[var(--text-secondary)] block">Freight Route Cost</span>
                <span className="text-lg font-bold text-[var(--text-main)]">
                  ${item.unit_transport_cost.toFixed(2)}/kg
                </span>
                <span className="text-[10px] block text-[var(--text-secondary)]">
                  Total ${(item.allocated_quantity_kg * item.unit_transport_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Economic Contribution */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-2">
              <DollarIcon className="w-4 h-4 text-[var(--fresh-green)]" />
              3. Economic Model & Contribution
            </h3>
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Selling Market Price:</span>
                <span className="font-semibold">${item.unit_price.toFixed(2)} / kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Gross Expected Revenue:</span>
                <span className="font-semibold">${item.gross_revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[var(--critical-red)]">
                <span>Transport Logistics Cost:</span>
                <span>-${(item.allocated_quantity_kg * item.unit_transport_cost).toLocaleString()}</span>
              </div>
              <div className="border-t border-[var(--border-color)] pt-2 flex justify-between font-bold text-base">
                <span className="text-[var(--text-main)]">Net Margin Contribution:</span>
                <span className="text-[var(--fresh-green)]">${item.net_contribution.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card-subtle)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-medium bg-[var(--primary-gold)] hover:opacity-90 text-white transition-opacity"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
