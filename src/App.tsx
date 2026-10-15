import React, { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OnboardingProvider } from "./context/OnboardingContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InventoryPage } from "./pages/InventoryPage";
import { DestinationsPage } from "./pages/DestinationsPage";
import { OptimizationCenterPage } from "./pages/OptimizationCenterPage";
import { DispatchPlanningPage } from "./pages/DispatchPlanningPage";
import { ScenariosPage } from "./pages/ScenariosPage";
import { DemandForecastingPage } from "./pages/DemandForecastingPage";
import { ColdChainPage } from "./pages/ColdChainPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ExplainabilityDrawer } from "./components/common/ExplainabilityDrawer";
import { CsvImportWizard } from "./components/common/CsvImportWizard";
import { OnboardingWalkthrough } from "./components/common/OnboardingWalkthrough";
import {
  InventoryBatch, Destination, Warehouse, TransportRoute,
  OptimizationRun, AllocationItem, ScenarioPreset
} from "./types";

const MainApp: React.FC = () => {
  const { user, loading: authLoading, authFetch } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Data states
  const [inventory, setInventory] = useState<InventoryBatch[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioPreset[]>([]);
  const [latestRun, setLatestRun] = useState<OptimizationRun | null>(null);

  // Modal / Drawer states
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationItem | null>(null);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Fetch all initial data
  const loadAllData = async () => {
    try {
      const [invRes, destRes, whRes, routeRes, scenRes, runRes] = await Promise.all([
        authFetch("/api/inventory"),
        authFetch("/api/destinations"),
        authFetch("/api/warehouses"),
        authFetch("/api/routes"),
        authFetch("/api/scenarios"),
        authFetch("/api/optimization/latest")
      ]);

      if (invRes.ok) setInventory(await invRes.json());
      if (destRes.ok) setDestinations(await destRes.json());
      if (whRes.ok) setWarehouses(await whRes.json());
      if (routeRes.ok) setRoutes(await routeRes.json());
      if (scenRes.ok) setScenarios(await scenRes.json());
      if (runRes.ok) {
        const runData = await runRes.json();
        if (runData) setLatestRun(runData);
      }
    } catch {
      // offline / starting up
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const handleRunOptimization = async (params: any) => {
    setIsOptimizing(true);
    try {
      const res = await authFetch("/api/optimization/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        const newRun = await res.json();
        setLatestRun(newRun);
      } else {
        alert("Optimization run failed to solve.");
      }
    } catch {
      alert("Error contacting optimization engine.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      const res = await authFetch("/api/demo/reset", { method: "POST" });
      if (res.ok) {
        await loadAllData();
        alert("Demo workspace safely reset to initial 12 batches, 5 destinations, and 3 warehouses.");
      }
    } catch {
      alert("Error resetting demo.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
        Loading FreshRoute Environment...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <OnboardingProvider setCurrentPage={setCurrentPage}>
      <AppLayout
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onResetDemo={handleResetDemo}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      >
        {currentPage === "dashboard" && (
          <DashboardPage
            latestRun={latestRun}
            inventory={inventory}
            destinations={destinations}
            warehouses={warehouses}
            onNavigate={setCurrentPage}
            onOpenExplainability={setSelectedAllocation}
            searchQuery={searchQuery}
          />
        )}

        {currentPage === "inventory" && (
          <InventoryPage
            inventory={inventory}
            warehouses={warehouses}
            onRefresh={loadAllData}
            onOpenImportWizard={() => setIsImportWizardOpen(true)}
            searchQuery={searchQuery}
          />
        )}

        {currentPage === "destinations" && (
          <DestinationsPage
            destinations={destinations}
            warehouses={warehouses}
            routes={routes}
            searchQuery={searchQuery}
          />
        )}

        {currentPage === "optimization" && (
          <OptimizationCenterPage
            latestRun={latestRun}
            onRunOptimization={handleRunOptimization}
            onOpenExplainability={setSelectedAllocation}
            isRunning={isOptimizing}
            searchQuery={searchQuery}
          />
        )}

        {currentPage === "dispatch" && (
          <DispatchPlanningPage
            allocations={latestRun?.allocations || []}
            onRefresh={loadAllData}
            onOpenExplainability={setSelectedAllocation}
            searchQuery={searchQuery}
          />
        )}

        {currentPage === "scenarios" && (
          <ScenariosPage
            scenarios={scenarios}
            searchQuery={searchQuery}
          />
        )}

        {currentPage === "forecasting" && (
          <DemandForecastingPage
            destinations={destinations}
            onNavigate={setCurrentPage}
          />
        )}

        {currentPage === "cold-chain" && (
          <ColdChainPage />
        )}

        {currentPage === "reports" && (
          <ReportsPage />
        )}

        {currentPage === "settings" && (
          <SettingsPage onResetDemo={handleResetDemo} />
        )}

        {/* Explainability Drawer */}
        <ExplainabilityDrawer
          item={selectedAllocation}
          onClose={() => setSelectedAllocation(null)}
        />

        {/* CSV Import Wizard */}
        <CsvImportWizard
          isOpen={isImportWizardOpen}
          onClose={() => setIsImportWizardOpen(false)}
          onSuccess={() => {
            setIsImportWizardOpen(false);
            loadAllData();
          }}
        />

        {/* Interactive Guided Onboarding Card */}
        <OnboardingWalkthrough />
      </AppLayout>
    </OnboardingProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
