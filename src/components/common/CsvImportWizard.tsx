import React, { useState } from "react";
import { XIcon, UploadIcon, CheckIcon, AlertIcon, FileTextIcon, DownloadIcon, ChevronRightIcon, ChevronLeftIcon } from "./Icons";
import { useAuth } from "../../context/AuthContext";

interface CsvImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportWizard: React.FC<CsvImportWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const { authFetch } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [csvText, setCsvText] = useState<string>(
`batch_code,commodity,warehouse_code,quantity_kg,shelf_life_hours,storage_temp_c,spoilage_cost,notes
BATCH-IMP-001,Organic Strawberries,WH-SALINAS,3800,26.0,3.2,4.80,Coastal field harvest
BATCH-IMP-002,Baby Spinach,WH-SALINAS,2900,24.0,2.5,3.90,Pre-washed greens
BATCH-IMP-003,Vine Tomatoes,WH-CENTRAL,5200,64.0,12.0,3.20,Breaker stage cluster
BATCH-IMP-004,Haas Avocados,WH-CENTRAL,4400,32.0,6.5,5.20,Stage 3 firm ripe`
  );
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [commitResult, setCommitResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    window.open("/api/inventory/template-csv", "_blank");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCsvText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const res = await authFetch("/api/inventory/validate-csv-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv_text: csvText })
      });
      if (res.ok) {
        const data = await res.json();
        setValidationResult(data);
        setStep(3); // Go to mapping/preview
      } else {
        alert("Failed to validate CSV format.");
      }
    } catch {
      alert("Error contacting server during validation.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleCommit = async () => {
    if (!validationResult || !validationResult.valid_rows) return;
    setIsCommitting(true);
    try {
      const res = await authFetch("/api/inventory/commit-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: validationResult.valid_rows })
      });
      if (res.ok) {
        const data = await res.json();
        setCommitResult(data);
        setStep(5); // Success step
        onSuccess();
      } else {
        alert("Failed to commit inventory import.");
      }
    } catch {
      alert("Error committing import.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Wizard Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-card-subtle)]">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--primary-gold)]">
              Guided Data Ingestion
            </div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">
              Perishable Inventory CSV Import Wizard
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps */}
        <div className="flex border-b border-[var(--border-color)] px-6 py-3 bg-[var(--bg-card)] text-xs font-medium">
          {["1. Source & Upload", "2. Data Preview", "3. Column Validation", "4. Review & Commit"].map((label, idx) => (
            <div key={idx} className={`flex-1 flex items-center gap-1.5 ${
              step === idx + 1 ? "text-[var(--primary-gold)] font-bold" : (step > idx + 1 ? "text-[var(--fresh-green)]" : "text-[var(--text-secondary)]")
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step > idx + 1 ? "bg-[var(--pale-green)] text-[var(--fresh-green)]" : (step === idx + 1 ? "bg-[var(--soft-gold)] text-[var(--deep-gold)]" : "bg-gray-200 dark:bg-gray-800")
              }`}>
                {step > idx + 1 ? "✓" : idx + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Step 1: Upload or Paste CSV */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-secondary)]">
                  Select a CSV file from your machine or review/edit the sample data below.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-1.5 text-xs text-[var(--primary-gold)] hover:underline font-semibold"
                >
                  <DownloadIcon className="w-3.5 h-3.5" /> Download Template CSV
                </button>
              </div>

              <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-6 text-center hover:border-[var(--primary-gold)] transition-colors cursor-pointer bg-[var(--bg-card-subtle)]">
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-file-input" />
                <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
                  <UploadIcon className="w-8 h-8 text-[var(--primary-gold)] mb-2" />
                  <span className="text-sm font-semibold text-[var(--text-main)]">Click to choose a CSV file</span>
                  <span className="text-xs text-[var(--text-secondary)] mt-1">Supports standard CSV with UTF-8 encoding</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Or Edit / Inspect Raw CSV Text:
                </label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] focus:outline-hidden focus:border-[var(--primary-gold)]"
                />
              </div>
            </div>
          )}

          {/* Step 2/3: Validation Report */}
          {step === 3 && validationResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-center">
                  <span className="text-xs text-[var(--text-secondary)] block">Total Rows</span>
                  <span className="text-lg font-bold text-[var(--text-main)]">{validationResult.total_rows}</span>
                </div>
                <div className="p-3 rounded-lg border border-[var(--fresh-green)] bg-[var(--pale-green)] text-center">
                  <span className="text-xs text-[var(--fresh-green)] block">Valid Records</span>
                  <span className="text-lg font-bold text-[var(--fresh-green)]">{validationResult.valid_count}</span>
                </div>
                <div className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-center">
                  <span className="text-xs text-[var(--critical-red)] block">Rejected Rows</span>
                  <span className="text-lg font-bold text-[var(--critical-red)]">{validationResult.error_count}</span>
                </div>
              </div>

              {validationResult.errors?.length > 0 && (
                <div className="p-3 rounded-lg bg-[var(--pale-red)] border border-[var(--critical-red)]/30 text-xs text-[var(--critical-red)] space-y-1">
                  <span className="font-bold block">Validation Errors:</span>
                  {validationResult.errors.map((err: any, i: number) => (
                    <div key={i}>Row {err.row}: {err.field} - {err.message}</div>
                  ))}
                </div>
              )}

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block mb-2">
                  Sample Canonical Mappings (First 5 records):
                </span>
                <div className="border border-[var(--border-color)] rounded-lg overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-card-subtle)] border-b border-[var(--border-color)] text-[var(--text-secondary)]">
                      <tr>
                        <th className="p-2">Batch Code</th>
                        <th className="p-2">Commodity</th>
                        <th className="p-2">Quantity (kg)</th>
                        <th className="p-2">Shelf-Life (h)</th>
                        <th className="p-2">Temp (°C)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {validationResult.sample_valid?.map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono font-medium">{r.batch_code}</td>
                          <td className="p-2">{r.commodity}</td>
                          <td className="p-2">{r.current_quantity_kg.toLocaleString()}</td>
                          <td className="p-2 font-semibold text-[var(--fresh-green)]">{r.remaining_shelf_life_hours}h</td>
                          <td className="p-2">{r.storage_temp_c}°C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Success Result */}
          {step === 5 && commitResult && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[var(--pale-green)] text-[var(--fresh-green)] mx-auto flex items-center justify-center">
                <CheckIcon className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[var(--text-main)]">
                Import Successfully Committed!
              </h4>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Created {commitResult.created_records} new inventory batches and updated {commitResult.updated_records} existing records. The optimization engine is ready to allocate this stock.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-card-subtle)] flex items-center justify-between">
          {step === 1 && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-main)]">
                Cancel
              </button>
              <button
                onClick={handleValidate}
                disabled={isValidating || !csvText.trim()}
                className="px-5 py-2 bg-[var(--primary-gold)] hover:opacity-90 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5"
              >
                {isValidating ? "Validating..." : "Validate & Preview"} <ChevronRightIcon className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-[var(--text-secondary)] flex items-center gap-1">
                <ChevronLeftIcon className="w-4 h-4" /> Back to Edit
              </button>
              <button
                onClick={handleCommit}
                disabled={isCommitting || validationResult?.valid_count === 0}
                className="px-5 py-2 bg-[var(--fresh-green)] hover:opacity-90 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5"
              >
                {isCommitting ? "Committing..." : `Commit ${validationResult?.valid_count || 0} Records`} <CheckIcon className="w-4 h-4" />
              </button>
            </>
          )}

          {step === 5 && (
            <div className="w-full flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-[var(--primary-gold)] text-white rounded-lg text-sm font-semibold"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
