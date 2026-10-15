import React, { useState } from "react";
import { AllocationItem } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  ClockIcon, TruckIcon, ShieldCheckIcon, CheckIcon,
  PlayIcon, AlertIcon, EditIcon, RefreshIcon
} from "../components/common/Icons";

interface DispatchPlanningPageProps {
  allocations: AllocationItem[];
  onRefresh: () => void;
  onOpenExplainability: (item: AllocationItem) => void;
  searchQuery: string;
}

export const DispatchPlanningPage: React.FC<DispatchPlanningPageProps> = ({
  allocations,
  onRefresh,
  onOpenExplainability,
  searchQuery
}) => {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState<"suggested" | "approved" | "completed">("suggested");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const filtered = allocations.filter(a => {
    if (activeTab === "suggested" && a.status !== "Proposed") return false;
    if (activeTab === "approved" && a.status !== "Approved") return false;
    if (activeTab === "completed" && a.status !== "Completed") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return a.batch_code.toLowerCase().includes(q) ||
             a.commodity.toLowerCase().includes(q) ||
             a.destination_name.toLowerCase().includes(q);
    }
    return true;
  });

  const handleApprove = async (id: number) => {
    try {
      const res = await authFetch(`/api/dispatch/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" })
      });
      if (res.ok) onRefresh();
    } catch {
      alert("Error approving dispatch item");
    }
  };

  const handleApproveAll = async () => {
    setIsProcessing(true);
    try {
      const res = await authFetch("/api/dispatch/approve-all", { method: "POST" });
      if (res.ok) {
        onRefresh();
        setActiveTab("approved");
      }
    } catch {
      alert("Error approving dispatches");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveQuantity = async (id: number) => {
    try {
      const res = await authFetch(`/api/dispatch/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allocated_quantity_kg: editQty })
      });
      if (res.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.detail || "Validation error saving quantity");
      }
    } catch {
      alert("Error saving dispatch quantity");
    }
  };

  const handleSimulateDelivery = async () => {
    if (!confirm("Simulate physical delivery? This will fulfill and deduct stock from active inventory batches.")) return;
    setIsProcessing(true);
    try {
      const res = await authFetch("/api/dispatch/simulate-execution", { method: "POST" });
      if (res.ok) {
        alert("Physical dispatch simulated successfully! Inventory batches updated.");
        onRefresh();
        setActiveTab("completed");
      }
    } catch {
      alert("Error simulating execution");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Logistics Dispatch Planning & Execution
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Review proposed dispatches, approve loads, adjust quantities within constraints, and simulate freight delivery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "suggested" && (
            <button
              onClick={handleApproveAll}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--fresh-green)] hover:opacity-90 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckIcon className="w-4 h-4" /> Approve All Proposed ({allocations.filter(a => a.status === "Proposed").length})
            </button>
          )}

          {activeTab === "approved" && (
            <button
              onClick={handleSimulateDelivery}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary-gold)] hover:opacity-90 text-white shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <TruckIcon className="w-4 h-4" /> Simulate Freight Delivery
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)] space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("suggested")}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === "suggested"
              ? "border-[var(--primary-gold)] text-[var(--primary-gold)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]"
          }`}
        >
          Suggested Dispatches ({allocations.filter(a => a.status === "Proposed").length})
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === "approved"
              ? "border-[var(--fresh-green)] text-[var(--fresh-green)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]"
          }`}
        >
          Approved Dispatches ({allocations.filter(a => a.status === "Approved").length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-3 transition-colors border-b-2 cursor-pointer ${
            activeTab === "completed"
              ? "border-[var(--text-main)] text-[var(--text-main)]"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)]"
          }`}
        >
          Fulfilled / Completed ({allocations.filter(a => a.status === "Completed").length})
        </button>
      </div>

      {/* Dispatches Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-semibold">
              <tr>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Batch Code</th>
                <th className="p-3.5">Commodity</th>
                <th className="p-3.5">Destination</th>
                <th className="p-3.5">Quantity (kg)</th>
                <th className="p-3.5">Transit & Arrival SL</th>
                <th className="p-3.5">Net Contribution</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-[var(--primary-gold)]">
                    #{a.dispatch_priority}
                  </td>
                  <td className="p-3.5 font-mono font-medium">{a.batch_code}</td>
                  <td className="p-3.5 font-medium">{a.commodity}</td>
                  <td className="p-3.5 font-semibold text-[var(--text-main)]">{a.destination_name}</td>
                  <td className="p-3.5 font-bold">
                    {editingId === a.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(Number(e.target.value))}
                          className="w-20 p-1 border rounded"
                        />
                        <button
                          onClick={() => handleSaveQuantity(a.id)}
                          className="p-1 bg-[var(--fresh-green)] text-white rounded text-[10px]"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>{a.allocated_quantity_kg.toLocaleString()} kg</span>
                        {a.status === "Proposed" && (
                          <button
                            onClick={() => { setEditingId(a.id); setEditQty(a.allocated_quantity_kg); }}
                            className="text-[var(--text-muted)] hover:text-[var(--primary-gold)]"
                            title="Edit Quantity"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="text-[var(--text-secondary)]">{a.travel_time_hours}h transit &bull; </span>
                    <span className="font-bold text-[var(--fresh-green)]">{a.remaining_shelf_life_arrival}h arrival SL</span>
                  </td>
                  <td className="p-3.5 font-bold text-[var(--fresh-green)]">
                    ${a.net_contribution.toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      a.status === "Approved"
                        ? "bg-[var(--pale-green)] text-[var(--fresh-green)] border border-[var(--fresh-green)]/30"
                        : (a.status === "Completed" ? "bg-gray-200 dark:bg-gray-700 text-[var(--text-main)]" : "bg-[var(--soft-gold)] text-[var(--deep-gold)]")
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => onOpenExplainability(a)}
                      className="px-2 py-1 rounded bg-[var(--bg-card-subtle)] border border-[var(--border-color)] hover:bg-gray-100 font-semibold"
                    >
                      Why?
                    </button>
                    {a.status === "Proposed" && (
                      <button
                        onClick={() => handleApprove(a.id)}
                        className="px-2.5 py-1 rounded bg-[var(--fresh-green)] text-white font-bold hover:opacity-90"
                      >
                        Approve
                      </button>
                    )}
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
