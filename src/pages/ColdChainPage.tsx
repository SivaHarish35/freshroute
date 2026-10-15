import React, { useState, useEffect } from "react";
import { ColdChainResponse } from "../types";
import { useAuth } from "../context/AuthContext";
import { ColdChainTelemetryChart } from "../components/common/Charts";
import {
  ThermometerIcon, AlertIcon, ShieldCheckIcon,
  RefreshIcon, InfoIcon
} from "../components/common/Icons";

export const ColdChainPage: React.FC = () => {
  const { authFetch } = useAuth();
  const [commodity, setCommodity] = useState<string>("Organic Strawberries");
  const [batchCode, setBatchCode] = useState<string>("BATCH-STR-101");
  const [scenarioType, setScenarioType] = useState<string>("excursion");
  const [telemetry, setTelemetry] = useState<ColdChainResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/cold-chain?commodity=${encodeURIComponent(commodity)}&batch_code=${encodeURIComponent(batchCode)}&scenario_type=${scenarioType}`);
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, [commodity, batchCode, scenarioType]);

  const target = telemetry?.target_temp_c || 2.5;
  const minTemp = target - 1.5;
  const maxTemp = target + 2.0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--pale-amber)] text-[var(--warning-amber)]">
              SIMULATED COLD-CHAIN TELEMETRY
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
              Reefer Sensor Simulation
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Cold-Chain Risk & Telemetry Monitor
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Simulates IoT transit temperature logs, detects thermal threshold excursions, and models Arrhenius Q10 biological decay rate.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTelemetry}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Readings
          </button>
        </div>
      </div>

      {/* Selectors */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-secondary)]">Produce Commodity:</span>
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] font-medium text-[var(--text-main)] focus:outline-hidden"
          >
            <option value="Organic Strawberries">Organic Strawberries (1°C - 4.5°C)</option>
            <option value="Baby Spinach">Baby Spinach (1°C - 4°C)</option>
            <option value="Vine Tomatoes">Vine Tomatoes (10°C - 15°C)</option>
            <option value="Haas Avocados">Haas Avocados (5°C - 9°C)</option>
            <option value="Sweet Peaches">Sweet Peaches (2°C - 6°C)</option>
            <option value="Artisan Soft Cheeses">Artisan Soft Cheeses (2°C - 5°C)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-[var(--text-secondary)]">Simulated Condition:</span>
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value)}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] font-medium text-[var(--text-main)] focus:outline-hidden"
          >
            <option value="normal">Normal Reefer Operation (Within Tolerance)</option>
            <option value="excursion">Compressor Malfunction (+5.2°C Excursion Spike)</option>
            <option value="freeze">Cold Spot Airflow Chilling (Sub-Zero Freeze Risk)</option>
          </select>
        </div>
      </div>

      {/* Status Card & Respiration Decay Metric */}
      {telemetry && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Cold-Chain Compliance Status
            </span>
            <div className={`text-lg font-bold mt-1 flex items-center gap-1.5 ${
              telemetry.spoilage_rate_multiplier > 1.0 ? "text-[var(--critical-red)]" : "text-[var(--fresh-green)]"
            }`}>
              {telemetry.spoilage_rate_multiplier > 1.0 ? <AlertIcon className="w-5 h-5" /> : <ShieldCheckIcon className="w-5 h-5" />}
              {telemetry.status}
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Tolerance: {telemetry.tolerance_range}
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Respiration Decay Acceleration
            </span>
            <div className={`text-2xl font-extrabold mt-1 ${
              telemetry.spoilage_rate_multiplier > 1.0 ? "text-[var(--critical-red)]" : "text-[var(--fresh-green)]"
            }`}>
              {telemetry.spoilage_rate_multiplier}x
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Arrhenius Q10 biological respiration multiplier
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Monitored Target Temperature
            </span>
            <div className="text-2xl font-extrabold text-[var(--primary-gold)] mt-1">
              {telemetry.target_temp_c}°C
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Setpoint for {telemetry.commodity}
            </span>
          </div>
        </div>
      )}

      {/* Temperature Time-Series Chart */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
            <ThermometerIcon className="w-5 h-5 text-[var(--primary-gold)]" />
            12-Hour Hourly Reefer Temperature Telemetry
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Red markers indicate thermal excursions exceeding configured biological tolerance thresholds.
          </p>
        </div>

        {telemetry && (
          <ColdChainTelemetryChart
            readings={telemetry.readings}
            targetTemp={target}
            minTemp={minTemp}
            maxTemp={maxTemp}
          />
        )}

        <div className="p-3.5 rounded-xl bg-[var(--bg-card-subtle)] text-xs text-[var(--text-main)] leading-relaxed border border-[var(--border-color)]">
          <span className="font-bold block mb-1">Cold-Chain Assessment:</span>
          {telemetry?.explanation}
        </div>
      </div>
    </div>
  );
};
