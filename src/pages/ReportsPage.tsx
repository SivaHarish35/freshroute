import React, { useState, useEffect } from "react";
import { FoodWasteImpactReport } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  FileTextIcon, DownloadIcon, ShieldCheckIcon, LeafIcon,
  DollarIcon, InfoIcon
} from "../components/common/Icons";

export const ReportsPage: React.FC = () => {
  const { authFetch } = useAuth();
  const [report, setReport] = useState<FoodWasteImpactReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await authFetch("/api/reports/food-waste-impact");
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch {}
      setLoading(false);
    };
    fetchReport();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportAllocations = () => {
    window.open("/api/reports/export-csv?type=allocations", "_blank");
  };

  const handleExportInventory = () => {
    window.open("/api/reports/export-csv?type=inventory", "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--pale-green)] text-[var(--fresh-green)]">
              Auditable Reporting
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
              PS 07 Food-Waste Verification
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Food-Waste Impact & Allocation Manifests
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Documented post-harvest spoilage reduction metrics, economic savings, and exportable data records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={handleExportAllocations}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4 text-[var(--primary-gold)]" /> Allocations CSV
          </button>
          <button
            onClick={handleExportInventory}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
          >
            <DownloadIcon className="w-4 h-4 text-[var(--primary-gold)]" /> Inventory CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary-gold)] hover:opacity-90 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileTextIcon className="w-4 h-4" /> Print Clean Report
          </button>
        </div>
      </div>

      {report ? (
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[var(--border-color)] pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary-gold)]">
                  Modeled Food-Waste Impact Report
                </span>
                <h2 className="text-lg font-bold text-[var(--text-main)]">
                  Optimization Run #{report.run_id} &bull; {report.scenario_name}
                </h2>
              </div>
              <div className="text-right text-xs text-[var(--text-secondary)]">
                <div>Engine: <span className="font-semibold text-[var(--text-main)]">{report.solver_method}</span></div>
                <div>Horizon: <span className="font-semibold text-[var(--text-main)]">{report.planning_horizon_hours} hours</span></div>
              </div>
            </div>

            {/* Impact Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-[var(--pale-green)] border border-[var(--fresh-green)]/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--fresh-green)] block">
                  Spoilage Avoided
                </span>
                <div className="text-2xl font-extrabold text-[var(--fresh-green)] mt-1">
                  {report.spoilage_avoided_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </div>
                <span className="text-[11px] text-[var(--fresh-green)]/80 block mt-0.5">
                  Produce diverted from write-off
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[var(--soft-gold)] border border-[var(--primary-gold)]/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--deep-gold)] block">
                  Relative Spoilage Reduction
                </span>
                <div className="text-2xl font-extrabold text-[var(--deep-gold)] mt-1">
                  {report.relative_reduction_pct}%
                </div>
                <span className="text-[11px] text-[var(--deep-gold)]/80 block mt-0.5">
                  vs. Earliest-Expiry-First baseline
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Modeled Waste Cost Saved
                </span>
                <div className="text-2xl font-extrabold text-[var(--fresh-green)] mt-1">
                  ${report.waste_cost_saved.toLocaleString()}
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                  Direct loss write-off avoided
                </span>
              </div>

              <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)]">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                  Optimized Residual Spoilage
                </span>
                <div className="text-2xl font-extrabold text-[var(--text-main)] mt-1">
                  {report.optimized_spoilage_kg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </div>
                <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                  Down from {report.baseline_spoilage_kg.toLocaleString()}kg baseline
                </span>
              </div>
            </div>

            {/* Methodology Disclosure Alert */}
            <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2.5">
              <InfoIcon className="w-4 h-4 text-[var(--primary-gold)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text-main)] block mb-0.5">
                  Auditable Methodology & Boundary Assumptions:
                </span>
                {report.methodology_disclosure}
              </div>
            </div>
          </div>

          {/* Commodity Breakdown Table */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-base font-extrabold text-[var(--text-main)] flex items-center gap-2">
              <LeafIcon className="w-4 h-4 text-[var(--fresh-green)]" />
              Commodity Allocation & Spoilage Protection Breakdown
            </h3>
            <div className="border border-[var(--border-color)] rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-semibold">
                  <tr>
                    <th className="p-3.5">Produce Commodity</th>
                    <th className="p-3.5">Total Initial Inventory</th>
                    <th className="p-3.5">Optimized Fulfilled Allocation</th>
                    <th className="p-3.5">Allocation Clearance Rate</th>
                    <th className="p-3.5">Spoilage Loss Penalty Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {report.commodity_breakdown.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="p-3.5 font-bold text-[var(--text-main)]">{row.commodity}</td>
                      <td className="p-3.5 font-medium">{row.total_inventory_kg.toLocaleString()} kg</td>
                      <td className="p-3.5 font-semibold text-[var(--fresh-green)]">{row.allocated_kg.toLocaleString()} kg</td>
                      <td className="p-3.5 font-bold">
                        <div className="flex items-center gap-2">
                          <span>{row.allocation_rate_pct}%</span>
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--fresh-green)]" style={{ width: `${row.allocation_rate_pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-[var(--text-secondary)] font-mono">{row.spoilage_writeoff_risk_unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-12 text-center text-xs text-[var(--text-secondary)]">
          {loading ? "Compiling Food-Waste Impact Report..." : "No optimization runs found. Run an optimization first."}
        </div>
      )}
    </div>
  );
};
