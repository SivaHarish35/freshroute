import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useOnboarding } from "../context/OnboardingContext";
import {
  SettingsIcon, SunIcon, MoonIcon, LaptopIcon, DollarIcon,
  ShieldCheckIcon, RefreshIcon, AlertIcon, CheckIcon
} from "../components/common/Icons";

interface SettingsPageProps {
  onResetDemo: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onResetDemo }) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { startTour } = useOnboarding();

  const [criticalThreshold, setCriticalThreshold] = useState<number>(24);
  const [atRiskThreshold, setAtRiskThreshold] = useState<number>(48);
  const [savedSettings, setSavedSettings] = useState<boolean>(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2000);
  };

  const pricingTiers = [
    {
      name: "Starter Distributor",
      badge: "Single Origin",
      price: "$490",
      period: "per month (illustrative)",
      description: "For local produce distributors operating a single central warehouse hub.",
      features: [
        "1 Origin Warehouse Hub",
        "Up to 10 Destination Markets",
        "Earliest-Expiry-First Baseline vs. MIP Optimizer",
        "Standard Shelf-Life Feasibility Checks",
        "CSV Data Ingestion & Export",
        "Email Support"
      ],
      buttonText: "Current Demonstration Tier",
      highlight: false
    },
    {
      name: "Professional Logistics",
      badge: "Multi-Depot",
      price: "$1,290",
      period: "per month (illustrative)",
      description: "For regional food wholesalers and multi-warehouse produce operators.",
      features: [
        "Up to 5 Origin Cold Hubs",
        "Unlimited Destination Markets",
        "Google OR-Tools SCIP MIP Solver",
        "Full What-If Scenario Stress Testing",
        "Demand Forecasting Engine (95% CI)",
        "Dynamic Markdown & Salvage Engine",
        "Priority 24/7 Logistics Support"
      ],
      buttonText: "Upgrade to Professional",
      highlight: true
    },
    {
      name: "Enterprise Freight",
      badge: "Full Network",
      price: "$2,890",
      period: "per month (illustrative)",
      description: "For large-scale agricultural supply-chain platforms & reefer fleets.",
      features: [
        "Unlimited Origin & Destination Hubs",
        "Custom Multi-Commodity Compatibility Rules",
        "Real-Time Telemetry & TMS API Integration",
        "Dedicated Operations Research Engineer",
        "Custom Linear Programming Objective Weights",
        "SOC-2 Type II Compliance & SLA"
      ],
      buttonText: "Contact Enterprise Sales",
      highlight: false
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
          System Preferences & Commercial Model
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Appearance, operational risk tolerances, account settings, and SaaS commercial subscription tiers.
        </p>
      </div>

      {/* Theme & Display Mode */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
          <SunIcon className="w-5 h-5 text-[var(--primary-gold)]" />
          Color Theme & Visual Experience
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Select between our refined Warm-White & Gold enterprise theme, Deep Navy Dark mode, or automatic operating system synchronization.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setTheme("light")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              theme === "light"
                ? "border-[var(--primary-gold)] bg-[var(--soft-gold)]/40 shadow-xs ring-1 ring-[var(--primary-gold)]"
                : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--primary-gold)]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-[var(--text-main)]">
              <SunIcon className="w-4 h-4 text-[var(--primary-gold)]" /> Light Mode (Default)
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
              Refined warm white (#FBF8F1), enterprise gold, and fresh produce green.
            </p>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              theme === "dark"
                ? "border-[var(--primary-gold)] bg-[var(--soft-gold)]/40 shadow-xs ring-1 ring-[var(--primary-gold)]"
                : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--primary-gold)]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-[var(--text-main)]">
              <MoonIcon className="w-4 h-4 text-[var(--primary-gold)]" /> Dark Mode
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
              Deep navy backgrounds, emerald green outcomes, and high accessible contrast.
            </p>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              theme === "system"
                ? "border-[var(--primary-gold)] bg-[var(--soft-gold)]/40 shadow-xs ring-1 ring-[var(--primary-gold)]"
                : "border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--primary-gold)]/50"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs text-[var(--text-main)]">
              <LaptopIcon className="w-4 h-4 text-[var(--primary-gold)]" /> System Default
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
              Automatically follows your device's preferred dark or light appearance.
            </p>
          </button>
        </div>
      </div>

      {/* Operational Risk Thresholds */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-[var(--fresh-green)]" />
          Perishability Risk Threshold Settings
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Configures remaining shelf-life hours that trigger At-Risk alerts and Critical-Risk promotional markdowns.
        </p>

        <form onSubmit={handleSavePreferences} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <label className="font-semibold block mb-1">
              Critical-Risk Cutoff (Hours &le;):
            </label>
            <input
              type="number"
              value={criticalThreshold}
              onChange={(e) => setCriticalThreshold(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] font-medium"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block mt-1">
              Batches with &le; {criticalThreshold}h remaining trigger 30% salvage markdowns.
            </span>
          </div>

          <div>
            <label className="font-semibold block mb-1">
              At-Risk Warning Cutoff (Hours &le;):
            </label>
            <input
              type="number"
              value={atRiskThreshold}
              onChange={(e) => setAtRiskThreshold(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] font-medium"
            />
            <span className="text-[10px] text-[var(--text-secondary)] block mt-1">
              Batches with &le; {atRiskThreshold}h remaining trigger 15% promotional incentives.
            </span>
          </div>

          <div className="sm:col-span-2 flex items-center justify-between pt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold bg-[var(--primary-gold)] hover:opacity-90 text-white cursor-pointer"
            >
              Save Risk Tolerances
            </button>
            {savedSettings && (
              <span className="text-xs text-[var(--fresh-green)] font-semibold flex items-center gap-1">
                <CheckIcon className="w-4 h-4" /> Preferences saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Commercial SaaS Subscription Model */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--soft-gold)] text-[var(--deep-gold)]">
                Commercial Model
              </span>
              <span className="text-[10px] font-bold text-[var(--warning-amber)] uppercase tracking-wider">
                ILLUSTRATIVE DEMO PRICING
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[var(--text-main)]">
              Subscription Software Plans for Produce Distributors
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pricingTiers.map((tier, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border flex flex-col justify-between ${
                tier.highlight
                  ? "border-[var(--primary-gold)] bg-[var(--bg-card)] shadow-lg ring-2 ring-[var(--primary-gold)] relative"
                  : "border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs"
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--primary-gold)] text-white text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-sm text-[var(--text-main)]">{tier.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--bg-primary)] text-[var(--deep-gold)]">
                    {tier.badge}
                  </span>
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-black text-[var(--text-main)]">{tier.price}</span>
                  <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">{tier.period}</span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                  {tier.description}
                </p>

                <div className="space-y-2 border-t border-[var(--border-color)] pt-3 text-xs">
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-[var(--text-secondary)]">
                      <CheckIcon className="w-3.5 h-3.5 text-[var(--fresh-green)] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-opacity cursor-pointer ${
                    tier.highlight
                      ? "bg-[var(--primary-gold)] hover:opacity-90 text-white"
                      : "bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-main)] hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {tier.buttonText}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account & Demo Reset Zone */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-[var(--text-main)]">
          Account Administration & Demo Reset
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] space-y-1">
            <span className="text-[var(--text-muted)] block">Signed In User</span>
            <span className="font-bold text-[var(--text-main)] text-sm">{user?.full_name || "Alex Rivera"}</span>
            <span className="text-[var(--text-secondary)] block">{user?.email || "demo@freshroute.io"}</span>
            <span className="text-[var(--primary-gold)] font-medium block">{user?.organization || "Pacific Fresh Logistics"}</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--bg-card-subtle)] flex flex-col justify-between space-y-2">
            <div>
              <span className="font-bold text-[var(--text-main)] block">Guided Walkthrough Tour</span>
              <span className="text-[var(--text-secondary)] block">
                Replay the 6-stage interactive onboarding walkthrough anytime.
              </span>
            </div>
            <button
              onClick={startTour}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[var(--soft-gold)] text-[var(--deep-gold)] hover:opacity-90 w-fit cursor-pointer"
            >
              Restart Onboarding Walkthrough
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm("Reset demo workspace? This will reload the canonical 12 batches, 5 destinations, and 3 warehouses.")) {
                onResetDemo();
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--warning-amber)]/40 text-[var(--warning-amber)] hover:bg-[var(--pale-amber)] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshIcon className="w-3.5 h-3.5" /> Reset Simulated Demo Workspace
          </button>

          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--critical-red)] hover:bg-[var(--pale-red)] transition-colors cursor-pointer"
          >
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
};
