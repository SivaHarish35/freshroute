import React, { useState } from "react";
import { ScenarioPreset } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  SlidersIcon, PlayIcon, AlertIcon, ShieldCheckIcon,
  TrendingUpIcon, RefreshIcon, ChevronRightIcon, TruckIcon
} from "../components/common/Icons";

interface ScenariosPageProps {
  scenarios: ScenarioPreset[];
  searchQuery: string;
}

export const ScenariosPage: React.FC<ScenariosPageProps> = ({ scenarios }) => {
  const { authFetch } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState<ScenarioPreset>(scenarios[0] || {
    name: "Interstate Hwy Delay (+3.5h Transit)",
    description: "Severe highway congestion between Central Valley and Bay Area adding 3.5h to transit routes.",
    delay_hours: 3.5,
    demand_multiplier: 1.0,
    capacity_multiplier: 1.0,
    price_multiplier: 1.0
  });

  const [delayHours, setDelayHours] = useState<number>(selectedPreset.delay_hours);
  const [demandMultiplier, setDemandMultiplier] = useState<number>(selectedPreset.demand_multiplier);
  const [capacityMultiplier, setCapacityMultiplier] = useState<number>(selectedPreset.capacity_multiplier);
  const [priceMultiplier, setPriceMultiplier] = useState<number>(selectedPreset.price_multiplier);

  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);

  const handleApplyPreset = (preset: ScenarioPreset) => {
    setSelectedPreset(preset);
    setDelayHours(preset.delay_hours);
    setDemandMultiplier(preset.demand_multiplier);
    setCapacityMultiplier(preset.capacity_multiplier);
    setPriceMultiplier(preset.price_multiplier);
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await authFetch("/api/scenarios/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_name: selectedPreset.name,
          delay_hours: delayHours,
          demand_multiplier: demandMultiplier,
          capacity_multiplier: capacityMultiplier,
          price_multiplier: priceMultiplier
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
      } else {
        alert("Failed to simulate scenario.");
      }
    } catch {
      alert("Error contacting simulation engine.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
              Parametric Simulation
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--pale-amber)] text-[var(--warning-amber)]">
              SIMULATED WHAT-IF ESTIMATES
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            What-If Logistics Scenario Simulator
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Clones current inventory & demand datasets, introduces operational shocks, and recalculates optimal dispatch routes in real-time.
          </p>
        </div>

        <button
          onClick={handleRunSimulation}
          disabled={isSimulating}
          className="px-6 py-3 rounded-xl font-bold text-xs bg-[var(--primary-gold)] hover:opacity-90 text-white shadow-md flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {isSimulating ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <PlayIcon className="w-4 h-4" />}
          Simulate Shock & Recalculate
        </button>
      </div>

      {/* Preset Disruption Cards */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-3">
          1. Select Ready-Made Disruption Scenario
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {scenarios.map((sc, idx) => {
            const isSelected = selectedPreset.name === sc.name;
            return (
              <div
                key={idx}
                onClick={() => handleApplyPreset(sc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-[var(--primary-gold)] bg-[var(--soft-gold)]/40 shadow-xs ring-1 ring-[var(--primary-gold)]"
                    : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary-gold)]/50"
                }`}
              >
                <div className="font-bold text-xs text-[var(--text-main)] mb-1">
                  {sc.name}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {sc.description}
                </p>
                <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)]">
                  <span>Delay: +{sc.delay_hours}h</span>
                  <span>•</span>
                  <span>Dem: {sc.demand_multiplier}x</span>
                  <span>•</span>
                  <span>Cap: {sc.capacity_multiplier}x</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parametric Custom Sliders */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 shadow-xs space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-gold)] flex items-center gap-1.5 border-b border-[var(--border-color)] pb-3">
          <SlidersIcon className="w-4 h-4" /> 2. Fine-Tune Parameter Adjustments
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Transit Delay */}
          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Transit Delay Shock:</span>
              <span className="font-bold text-[var(--primary-gold)]">+{delayHours}h</span>
            </div>
            <input
              type="range"
              min={0}
              max={8}
              step={0.5}
              value={delayHours}
              onChange={(e) => setDelayHours(Number(e.target.value))}
              className="w-full accent-[var(--primary-gold)] cursor-pointer"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">
              Tests if batches still arrive before shelf-life expires.
            </span>
          </div>

          {/* Demand Multiplier */}
          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Market Demand Multiplier:</span>
              <span className="font-bold text-[var(--fresh-green)]">{demandMultiplier}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={demandMultiplier}
              onChange={(e) => setDemandMultiplier(Number(e.target.value))}
              className="w-full accent-[var(--fresh-green)] cursor-pointer"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">
              Simulates demand surges or retail lulls.
            </span>
          </div>

          {/* Vehicle Capacity Multiplier */}
          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Fleet Transport Capacity:</span>
              <span className="font-bold text-[var(--warning-amber)]">{capacityMultiplier}x</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1.5}
              step={0.05}
              value={capacityMultiplier}
              onChange={(e) => setCapacityMultiplier(Number(e.target.value))}
              className="w-full accent-[var(--warning-amber)] cursor-pointer"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">
              Simulates reefer truck shortages or expanded fleets.
            </span>
          </div>

          {/* Market Price Multiplier */}
          <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span>Market Price Shift:</span>
              <span className="font-bold text-[var(--deep-gold)]">{priceMultiplier}x</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.6}
              step={0.05}
              value={priceMultiplier}
              onChange={(e) => setPriceMultiplier(Number(e.target.value))}
              className="w-full accent-[var(--deep-gold)] cursor-pointer"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block">
              Simulates wholesale price inflation or market dips.
            </span>
          </div>
        </div>
      </div>

      {/* Simulation Results & Deltas */}
      {simulationResult && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
                Recalculation Complete
              </span>
              <span className="text-xs font-bold text-[var(--text-main)]">
                Scenario: {simulationResult.scenario_name}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              Shock Impact Deltas (Normal Operations vs. Shocked Scenario)
            </h3>
          </div>

          {/* Deltas Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Spoilage Delta */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                Spoilage Impact
              </span>
              <div className="text-2xl font-extrabold mt-1 text-[var(--text-main)]">
                {simulationResult.deltas.spoilage_delta_kg > 0 ? "+" : ""}
                {simulationResult.deltas.spoilage_delta_kg.toLocaleString()} kg
              </div>
              <span className="text-xs text-[var(--text-secondary)] block mt-1">
                Normal: {simulationResult.normal_plan.spoilage_kg}kg &rarr; Scenario: {simulationResult.scenario_plan.spoilage_kg}kg
              </span>
            </div>

            {/* Net Revenue Delta */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                Net Revenue Impact
              </span>
              <div className={`text-2xl font-extrabold mt-1 ${
                simulationResult.deltas.net_revenue_delta >= 0 ? "text-[var(--fresh-green)]" : "text-[var(--critical-red)]"
              }`}>
                {simulationResult.deltas.net_revenue_delta > 0 ? "+" : ""}$
                {simulationResult.deltas.net_revenue_delta.toLocaleString()}
              </div>
              <span className="text-xs text-[var(--text-secondary)] block mt-1">
                Normal: ${simulationResult.normal_plan.net_revenue.toLocaleString()} &rarr; Scenario: ${simulationResult.scenario_plan.net_revenue.toLocaleString()}
              </span>
            </div>

            {/* Fulfillment Delta */}
            <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                Fulfillment Shift
              </span>
              <div className={`text-2xl font-extrabold mt-1 ${
                simulationResult.deltas.fulfillment_delta_pct >= 0 ? "text-[var(--fresh-green)]" : "text-[var(--critical-red)]"
              }`}>
                {simulationResult.deltas.fulfillment_delta_pct > 0 ? "+" : ""}
                {simulationResult.deltas.fulfillment_delta_pct}%
              </div>
              <span className="text-xs text-[var(--text-secondary)] block mt-1">
                Fulfillment: {simulationResult.scenario_plan.fulfillment_pct}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
