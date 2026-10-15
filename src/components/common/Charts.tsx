import React from "react";

interface ComparisonBarChartProps {
  baselineValue: number;
  optimizedValue: number;
  metricLabel: string;
  unitPrefix?: string;
  unitSuffix?: string;
  isLowerBetter?: boolean;
}

export const ComparisonBarChart: React.FC<ComparisonBarChartProps> = ({
  baselineValue,
  optimizedValue,
  metricLabel,
  unitPrefix = "",
  unitSuffix = "",
  isLowerBetter = false
}) => {
  const maxVal = Math.max(baselineValue, optimizedValue, 1);
  const basePct = Math.min(100, Math.max(8, (baselineValue / maxVal) * 100));
  const optPct = Math.min(100, Math.max(8, (optimizedValue / maxVal) * 100));

  const diff = optimizedValue - baselineValue;
  const isPositiveOutcome = isLowerBetter ? diff < 0 : diff > 0;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {metricLabel}
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
          isPositiveOutcome
            ? "bg-[var(--pale-green)] text-[var(--fresh-green)]"
            : "bg-[var(--pale-red)] text-[var(--critical-red)]"
        }`}>
          {diff > 0 ? "+" : ""}{diff.toLocaleString(undefined, { maximumFractionDigits: 1 })}{unitSuffix}
        </span>
      </div>

      <div className="space-y-3">
        {/* Baseline Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--text-secondary)]">Baseline (EEF Heuristic)</span>
            <span className="font-semibold">{unitPrefix}{baselineValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}{unitSuffix}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 dark:bg-slate-600 rounded-full transition-all duration-500"
              style={{ width: `${basePct}%` }}
            />
          </div>
        </div>

        {/* Optimized Bar */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-[var(--primary-gold)]">FreshRoute (OR-Tools MIP)</span>
            <span className="font-bold text-[var(--fresh-green)]">{unitPrefix}{optimizedValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}{unitSuffix}</span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPositiveOutcome ? "bg-[var(--fresh-green)]" : "bg-[var(--primary-gold)]"
              }`}
              style={{ width: `${optPct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TimeSeriesForecastChart: React.FC<{
  series: Array<{
    period: string;
    historical_demand?: number;
    forecast_demand: number;
    lower_bound: number;
    upper_bound: number;
  }>;
}> = ({ series }) => {
  if (!series || series.length === 0) return null;

  const maxVal = Math.max(...series.map(s => Math.max(s.upper_bound, s.historical_demand || 0))) * 1.15;
  const minVal = Math.max(0, Math.min(...series.map(s => s.lower_bound)) * 0.85);
  const range = maxVal - minVal || 1;

  const width = 600;
  const height = 220;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / (series.length - 1)) * chartWidth;
  const getY = (val: number) => padTop + chartHeight - ((val - minVal) / range) * chartHeight;

  // Build forecast area path (confidence interval)
  const forecastStartIdx = series.findIndex(s => s.historical_demand === undefined || s.historical_demand === null);
  const forecastSeries = forecastStartIdx >= 0 ? series.slice(forecastStartIdx - 1) : [];

  let ciAreaPath = "";
  if (forecastSeries.length > 1) {
    const topPoints = forecastSeries.map((s, i) => `${getX(forecastStartIdx - 1 + i)},${getY(s.upper_bound)}`).join(" L ");
    const bottomPoints = [...forecastSeries].reverse().map((s, i) => `${getX(series.length - 1 - i)},${getY(s.lower_bound)}`).join(" L ");
    ciAreaPath = `M ${topPoints} L ${bottomPoints} Z`;
  }

  // Historical line
  const histPoints = series
    .map((s, i) => s.historical_demand !== null && s.historical_demand !== undefined ? `${getX(i)},${getY(s.historical_demand)}` : null)
    .filter(Boolean)
    .join(" L ");

  // Forecast line
  const forecastPoints = forecastSeries
    .map((s, i) => `${getX(forecastStartIdx - 1 + i)},${getY(s.forecast_demand)}`)
    .join(" L ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padTop + chartHeight * (1 - pct);
          const val = Math.round(minVal + range * pct);
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
              <text x={padLeft - 6} y={y + 3} textAnchor="end" fontSize="9" fill="currentColor" opacity="0.6">
                {val}
              </text>
            </g>
          );
        })}

        {/* Confidence Interval shaded area */}
        {ciAreaPath && (
          <path d={ciAreaPath} fill="var(--primary-gold)" fillOpacity="0.15" />
        )}

        {/* Historical line */}
        {histPoints && (
          <path d={`M ${histPoints}`} fill="none" stroke="var(--fresh-green)" strokeWidth="2.5" />
        )}

        {/* Forecast line (dashed) */}
        {forecastPoints && (
          <path d={`M ${forecastPoints}`} fill="none" stroke="var(--primary-gold)" strokeWidth="2.5" strokeDasharray="4 4" />
        )}

        {/* Forecast start divider */}
        {forecastStartIdx >= 0 && (
          <line
            x1={getX(forecastStartIdx)}
            y1={padTop}
            x2={getX(forecastStartIdx)}
            y2={padTop + chartHeight}
            stroke="var(--primary-gold)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}

        {/* Data points */}
        {series.map((s, i) => {
          const isForecast = s.historical_demand === null || s.historical_demand === undefined;
          const yVal = isForecast ? s.forecast_demand : s.historical_demand!;
          return (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(yVal)}
              r={isForecast ? 3.5 : 3}
              fill={isForecast ? "var(--primary-gold)" : "var(--fresh-green)"}
              stroke="var(--bg-card)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* X axis labels (sample) */}
        {series.map((s, i) => {
          if (i % 3 === 0 || i === series.length - 1) {
            return (
              <text key={i} x={getX(i)} y={height - 10} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.7">
                {s.period.replace("Day ", "D")}
              </text>
            );
          }
          return null;
        })}
      </svg>
      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[var(--fresh-green)] inline-block" />
          <span>Historical Confirmed Demand</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[var(--primary-gold)] border-t border-dashed border-[var(--primary-gold)] inline-block" />
          <span>Forecast Demand (WMA + Seasonal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-[var(--primary-gold)] opacity-30 rounded-xs inline-block" />
          <span>95% Confidence Interval</span>
        </div>
      </div>
    </div>
  );
};

export const ColdChainTelemetryChart: React.FC<{
  readings: Array<{
    timestamp: string;
    temperature_c: number;
    is_alert: boolean;
    alert_message?: string;
  }>;
  targetTemp: number;
  minTemp: number;
  maxTemp: number;
}> = ({ readings, targetTemp, minTemp, maxTemp }) => {
  if (!readings || readings.length === 0) return null;

  const allTemps = readings.map(r => r.temperature_c);
  const minVal = Math.min(...allTemps, minTemp) - 1.5;
  const maxVal = Math.max(...allTemps, maxTemp) + 1.5;
  const range = maxVal - minVal || 1;

  const width = 600;
  const height = 200;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 15;
  const padBottom = 30;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const getX = (idx: number) => padLeft + (idx / (readings.length - 1)) * chartWidth;
  const getY = (val: number) => padTop + chartHeight - ((val - minVal) / range) * chartHeight;

  const linePoints = readings.map((r, i) => `${getX(i)},${getY(r.temperature_c)}`).join(" L ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
        {/* Critical Max Threshold Line */}
        <line
          x1={padLeft}
          y1={getY(maxTemp)}
          x2={width - padRight}
          y2={getY(maxTemp)}
          stroke="var(--critical-red)"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <text x={width - padRight} y={getY(maxTemp) - 4} textAnchor="end" fontSize="9" fill="var(--critical-red)" fontWeight="bold">
          Max Limit ({maxTemp}°C)
        </text>

        {/* Target Optimal Line */}
        <line
          x1={padLeft}
          y1={getY(targetTemp)}
          x2={width - padRight}
          y2={getY(targetTemp)}
          stroke="var(--fresh-green)"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.6"
        />
        <text x={padLeft + 4} y={getY(targetTemp) - 4} fontSize="9" fill="var(--fresh-green)">
          Optimal ({targetTemp}°C)
        </text>

        {/* Min Chill Line */}
        <line
          x1={padLeft}
          y1={getY(minTemp)}
          x2={width - padRight}
          y2={getY(minTemp)}
          stroke="#3B82F6"
          strokeWidth="1.5"
          strokeDasharray="4 2"
        />
        <text x={width - padRight} y={getY(minTemp) + 12} textAnchor="end" fontSize="9" fill="#3B82F6" fontWeight="bold">
          Min Freeze Limit ({minTemp}°C)
        </text>

        {/* Telemetry line */}
        <path d={`M ${linePoints}`} fill="none" stroke="currentColor" strokeWidth="2.5" />

        {/* Reading dots */}
        {readings.map((r, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(r.temperature_c)}
            r={r.is_alert ? 5 : 3}
            fill={r.is_alert ? "var(--critical-red)" : "var(--fresh-green)"}
            stroke="var(--bg-card)"
            strokeWidth="1.5"
          />
        ))}

        {/* X labels */}
        {readings.map((r, i) => {
          if (i % 2 === 0 || i === readings.length - 1) {
            return (
              <text key={i} x={getX(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.7">
                {r.timestamp}
              </text>
            );
          }
          return null;
        })}
      </svg>
      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--fresh-green)] inline-block" />
          <span>Optimal Reading</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--critical-red)] inline-block" />
          <span>Excursion Alert</span>
        </div>
      </div>
    </div>
  );
};
