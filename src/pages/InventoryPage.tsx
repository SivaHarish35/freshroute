import React, { useState } from "react";
import { InventoryBatch, Warehouse } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  LeafIcon, UploadIcon, DownloadIcon, AlertIcon,
  SearchIcon, FilterIcon, Trash2Icon, EditIcon, CheckIcon, XIcon, PlusIcon
} from "../components/common/Icons";

interface InventoryPageProps {
  inventory: InventoryBatch[];
  warehouses: Warehouse[];
  onRefresh: () => void;
  onOpenImportWizard: () => void;
  searchQuery: string;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  inventory,
  warehouses,
  onRefresh,
  onOpenImportWizard,
  searchQuery
}) => {
  const { authFetch } = useAuth();
  const [selectedCommodity, setSelectedCommodity] = useState<string>("all");
  const [selectedRisk, setSelectedRisk] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);

  // Form state for creating batch
  const [newBatchCode, setNewBatchCode] = useState("");
  const [newCommodity, setNewCommodity] = useState("Organic Strawberries");
  const [newWarehouseId, setNewWarehouseId] = useState<number>(warehouses[0]?.id || 1);
  const [newQty, setNewQty] = useState<number>(3000);
  const [newShelfLife, setNewShelfLife] = useState<number>(36);
  const [newTemp, setNewTemp] = useState<number>(3.5);
  const [newNotes, setNewNotes] = useState("");

  const commodities = Array.from(new Set(inventory.map(b => b.commodity)));

  const filteredBatches = inventory.filter(b => {
    if (selectedCommodity !== "all" && b.commodity !== selectedCommodity) return false;
    if (selectedRisk !== "all" && b.risk_status !== selectedRisk) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.batch_code.toLowerCase().includes(q) ||
             b.commodity.toLowerCase().includes(q) ||
             (b.notes && b.notes.toLowerCase().includes(q));
    }
    return true;
  });

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authFetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batch_code: newBatchCode || `BATCH-${Date.now().toString().slice(-4)}`,
          commodity: newCommodity,
          origin_warehouse_id: Number(newWarehouseId),
          initial_quantity_kg: Number(newQty),
          current_quantity_kg: Number(newQty),
          remaining_shelf_life_hours: Number(newShelfLife),
          storage_temp_c: Number(newTemp),
          notes: newNotes
        })
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        onRefresh();
      } else {
        const err = await res.json();
        alert(err.detail || "Error creating batch");
      }
    } catch {
      alert("Error contacting server");
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;
    try {
      const res = await authFetch(`/api/inventory/${editingBatch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_quantity_kg: Number(editingBatch.current_quantity_kg),
          remaining_shelf_life_hours: Number(editingBatch.remaining_shelf_life_hours),
          storage_temp_c: Number(editingBatch.storage_temp_c),
          notes: editingBatch.notes
        })
      });
      if (res.ok) {
        setEditingBatch(null);
        onRefresh();
      }
    } catch {
      alert("Error updating batch");
    }
  };

  const handleDeleteBatch = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete batch ${code}?`)) return;
    try {
      const res = await authFetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      alert("Error deleting batch");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
            Perishable Produce Inventory Batches
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Real-time batch-level shelf-life tracking, temperature conditions, and perishability risk status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => window.open("/api/inventory/template-csv", "_blank")}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
            title="Download CSV Template"
          >
            <DownloadIcon className="w-4 h-4" /> Template
          </button>
          <button
            onClick={onOpenImportWizard}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--text-main)] flex items-center gap-1.5 cursor-pointer"
          >
            <UploadIcon className="w-4 h-4 text-[var(--primary-gold)]" /> Import CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--primary-gold)] hover:opacity-90 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <LeafIcon className="w-4 h-4" /> Add Batch
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-secondary)]">Commodity:</span>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-hidden"
            >
              <option value="all">All Commodities ({inventory.length})</option>
              {commodities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--text-secondary)]">Risk Status:</span>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="p-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Healthy">Healthy (&gt;48h)</option>
              <option value="At-Risk">At-Risk (24h-48h)</option>
              <option value="Critical-Risk">Critical-Risk (&le;24h)</option>
            </select>
          </div>
        </div>

        <div className="text-[var(--text-secondary)]">
          Showing <span className="font-bold text-[var(--text-main)]">{filteredBatches.length}</span> of {inventory.length} active batches
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left">
            <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-semibold">
              <tr>
                <th className="p-3.5">Batch Code</th>
                <th className="p-3.5">Commodity</th>
                <th className="p-3.5">Origin Warehouse</th>
                <th className="p-3.5">Available Stock</th>
                <th className="p-3.5">Remaining Shelf-Life</th>
                <th className="p-3.5">Storage Temp</th>
                <th className="p-3.5">Perishability Risk</th>
                <th className="p-3.5">Notes</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredBatches.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-[var(--text-main)]">
                    {b.batch_code}
                  </td>
                  <td className="p-3.5 font-medium">{b.commodity}</td>
                  <td className="p-3.5 text-[var(--text-secondary)]">
                    {b.warehouse_name} ({b.warehouse_city})
                  </td>
                  <td className="p-3.5 font-semibold text-[var(--text-main)]">
                    {b.current_quantity_kg.toLocaleString()} kg
                  </td>
                  <td className="p-3.5 font-bold">
                    <span className={`inline-flex items-center gap-1 ${
                      b.remaining_shelf_life_hours <= 24
                        ? "text-[var(--critical-red)]"
                        : (b.remaining_shelf_life_hours <= 48 ? "text-[var(--warning-amber)]" : "text-[var(--fresh-green)]")
                    }`}>
                      {b.remaining_shelf_life_hours}h
                    </span>
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)]">
                    {b.storage_temp_c}°C
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.risk_status === "Critical-Risk"
                        ? "bg-[var(--pale-red)] text-[var(--critical-red)] border border-[var(--critical-red)]/30"
                        : (b.risk_status === "At-Risk" ? "bg-[var(--pale-amber)] text-[var(--warning-amber)] border border-[var(--warning-amber)]/30" : "bg-[var(--pale-green)] text-[var(--fresh-green)] border border-[var(--fresh-green)]/30")
                    }`}>
                      {b.risk_status}
                    </span>
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)] max-w-xs truncate" title={b.notes}>
                    {b.notes || "—"}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <button
                      onClick={() => setEditingBatch(b)}
                      className="p-1 hover:text-[var(--primary-gold)] transition-colors cursor-pointer"
                      title="Edit Batch"
                    >
                      <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBatch(b.id, b.batch_code)}
                      className="p-1 hover:text-[var(--critical-red)] transition-colors cursor-pointer"
                      title="Delete Batch"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Batch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="font-bold text-base text-[var(--text-main)]">Add New Produce Batch</h3>
              <button onClick={() => setIsAddModalOpen(false)}><XIcon className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Batch Code</label>
                <input
                  type="text"
                  placeholder="e.g. BATCH-STR-104"
                  value={newBatchCode}
                  onChange={(e) => setNewBatchCode(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Commodity</label>
                  <select
                    value={newCommodity}
                    onChange={(e) => setNewCommodity(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                  >
                    <option value="Organic Strawberries">Organic Strawberries</option>
                    <option value="Baby Spinach">Baby Spinach</option>
                    <option value="Vine Tomatoes">Vine Tomatoes</option>
                    <option value="Haas Avocados">Haas Avocados</option>
                    <option value="Sweet Peaches">Sweet Peaches</option>
                    <option value="Artisan Soft Cheeses">Artisan Soft Cheeses</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Origin Warehouse</label>
                  <select
                    value={newWarehouseId}
                    onChange={(e) => setNewWarehouseId(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Shelf-Life (h)</label>
                  <input
                    type="number"
                    value={newShelfLife}
                    onChange={(e) => setNewShelfLife(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Temp (°C)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newTemp}
                    onChange={(e) => setNewTemp(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Handling / Storage Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Hydro-cooled morning lot"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary-gold)] text-white font-bold rounded-lg"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
              <h3 className="font-bold text-base text-[var(--text-main)]">Edit Batch {editingBatch.batch_code}</h3>
              <button onClick={() => setEditingBatch(null)}><XIcon className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <form onSubmit={handleUpdateBatch} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Available Quantity (kg)</label>
                <input
                  type="number"
                  value={editingBatch.current_quantity_kg}
                  onChange={(e) => setEditingBatch({ ...editingBatch, current_quantity_kg: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                  required
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Remaining Shelf-Life (hours)</label>
                <input
                  type="number"
                  value={editingBatch.remaining_shelf_life_hours}
                  onChange={(e) => setEditingBatch({ ...editingBatch, remaining_shelf_life_hours: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                  required
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Storage Temperature (°C)</label>
                <input
                  type="number"
                  step="0.5"
                  value={editingBatch.storage_temp_c}
                  onChange={(e) => setEditingBatch({ ...editingBatch, storage_temp_c: Number(e.target.value) })}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Notes</label>
                <input
                  type="text"
                  value={editingBatch.notes || ""}
                  onChange={(e) => setEditingBatch({ ...editingBatch, notes: e.target.value })}
                  className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 rounded-lg border border-[var(--border-color)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary-gold)] text-white font-bold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
