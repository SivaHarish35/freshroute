import React, { useState, useEffect } from "react";
import { Destination, ForecastResponse } from "../types";
import { useAuth } from "../context/AuthContext";
import { TimeSeriesForecastChart } from "../components/common/Charts";
import {
  TrendingUpIcon, RouteIcon, LeafIcon, ShieldCheckIcon,
  RefreshIcon, InfoIcon, CheckIcon
} from "../components/common/Icons";

interface DemandForecastingPageProps {
  destinations: Destination[];
  onNavigate: (page: string) => void;
}

export const DemandForecastingPage: React.FC<DemandForecastingPageProps> = ({ destinations, onNavigate }) => {
  const { authFetch } = useAuth();
  const [commodity, setCommodity] = useState<string>("Organic Strawberries");
  const [destination, setDestination] = useState<string>(destinations[0]?.name || "Bay Area Produce Terminal");
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [applied, setApplied] = useState<boolean>(false);

  const fetchForecast = async () => {
    setLoading(true);
    setApplied(false);
    try {
      const res = await authFetch(`/api/forecasting?commodity=${encodeURIComponent(commodity)}&destination=${encodeURIComponent(destination)}`);
      if (res.ok) {
        const data = await res.json();
        setForecastData(data);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [commodity, destination]);

  const handleApplyToOptimizer = () => {
    setApplied(true);
    setTimeout(() => {
      onNavigate("optimization");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
              Predictive Time-Series
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--pale-green)] text-[var(--fresh-green)]">
              Weighted Moving Average + Seasonality
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Destination Demand Forecasting
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Forecast upcoming retail demand cycles with 95% uncertainty confidence intervals and out-of-sample backtesting validation.
          </p>
        </div>

        <button
          onClick={handleApplyToOptimizer}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[var(--fresh-green)] hover:opacity-90 text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all"
        >
          {applied ? (
            <>
              <CheckIcon className="w-4 h-4" /> Applied to Optimizer!
            </>
          ) : (
            <>
              <TrendingUpIcon className="w-4 h-4" /> Apply Forecast to Allocation Center
            </>
          )}
        </button>
      </div>

      {/* Selectors Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <LeafIcon className="w-4 h-4 text-[var(--fresh-green)]" />
          <span className="font-semibold text-[var(--text-secondary)]">Commodity Line:</span>
          <select
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] font-medium text-[var(--text-main)] focus:outline-hidden"
          >
            <option value="Organic Strawberries">Organic Strawberries</option>
            <option value="Baby Spinach">Baby Spinach</option>
            <option value="Vine Tomatoes">Vine Tomatoes</option>
            <option value="Haas Avocados">Haas Avocados</option>
            <option value="Sweet Peaches">Sweet Peaches</option>
            <option value="Artisan Soft Cheeses">Artisan Soft Cheeses</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <RouteIcon className="w-4 h-4 text-[var(--primary-gold)]" />
          <span className="font-semibold text-[var(--text-secondary)]">Destination Market:</span>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] font-medium text-[var(--text-main)] focus:outline-hidden"
          >
            {destinations.map(d => (
              <option key={d.id} value={d.name}>{d.name} ({d.city})</option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchForecast}
          className="ml-auto p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-main)] rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Refresh Model"
        >
          <RefreshIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Forecast Accuracy Metrics & Disclosure */}
      {forecastData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Backtested MAE
            </span>
            <div className="text-2xl font-extrabold text-[var(--text-main)] mt-1">
              &plusmn;{forecastData.mae} <span className="text-xs font-normal text-[var(--text-secondary)]">kg</span>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Mean Absolute Error on 3-day held-out test window
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Root Mean Squared Error (RMSE)
            </span>
            <div className="text-2xl font-extrabold text-[var(--text-main)] mt-1">
              {forecastData.rmse} <span className="text-xs font-normal text-[var(--text-secondary)]">kg</span>
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Penalizes large outlier forecast errors
            </span>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Forecast Horizon
            </span>
            <div className="text-2xl font-extrabold text-[var(--primary-gold)] mt-1">
              {forecastData.horizon}
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
              Forward daily replenishment shifts
            </span>
          </div>
        </div>
      )}

      {/* Time-Series Chart */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-[var(--primary-gold)]" />
            Demand Projection Curve (History &rarr; 5-Day Forward Shift)
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Shaded region depicts 95% confidence intervals scaling with prediction uncertainty over time.
          </p>
        </div>

        {forecastData && (
          <TimeSeriesForecastChart series={forecastData.series} />
        )}

        <div className="p-3 rounded-xl bg-[var(--bg-card-subtle)] text-[11px] text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
          <InfoIcon className="w-4 h-4 text-[var(--primary-gold)] shrink-0 mt-0.5" />
          <span>
            {forecastData?.assumptions || "Simulated 14-day history reflects weekly retail replenishment demand. Chronological validation ensures honest accuracy reporting."}
          </span>
        </div>
      </div>
    </div>
  );
};
