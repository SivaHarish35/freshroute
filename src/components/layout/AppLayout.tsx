import React, { useState, useEffect } from "react";
import { useTheme, ThemeMode } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useOnboarding } from "../../context/OnboardingContext";
import {
  LeafIcon, RouteIcon, TruckIcon, BarChartIcon, SettingsIcon,
  FileTextIcon, ClockIcon, SunIcon, MoonIcon, LaptopIcon,
  SearchIcon, BellIcon, RefreshIcon, ChevronRightIcon,
  ThermometerIcon, TrendingUpIcon, SlidersIcon, AlertIcon, CheckIcon
} from "../common/Icons";

interface AppLayoutProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  children: React.ReactNode;
  onResetDemo: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  setCurrentPage,
  children,
  onResetDemo,
  searchQuery,
  setSearchQuery
}) => {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { startTour } = useOnboarding();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Live Dynamic Clock in browser local timezone
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateString = currentTime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChartIcon },
    { id: "inventory", label: "Inventory Batches", icon: LeafIcon },
    { id: "destinations", label: "Destinations & Demand", icon: RouteIcon },
    { id: "optimization", label: "Optimization Center", icon: TruckIcon, badge: "OR-Tools" },
    { id: "dispatch", label: "Dispatch Planning", icon: ClockIcon },
    { id: "scenarios", label: "What-If Scenarios", icon: SlidersIcon },
    { id: "forecasting", label: "Demand Forecasting", icon: TrendingUpIcon },
    { id: "cold-chain", label: "Cold-Chain Telemetry", icon: ThermometerIcon, badge: "Simulated" },
    { id: "reports", label: "Reports & Impact", icon: FileTextIcon },
    { id: "settings", label: "Settings & Pricing", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-primary)] text-[var(--text-main)]">
      {/* Collapsible Left Sidebar */}
      <aside className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] flex flex-col transition-all duration-300 z-30 shrink-0`}>
        {/* Brand Logo & Tagline */}
        <div className="h-16 px-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => setCurrentPage("dashboard")}>
            <div className="w-10 h-10 rounded-xl bg-[var(--pale-green)] border border-[var(--fresh-green)]/40 flex items-center justify-center shrink-0 shadow-xs">
              <LeafIcon className="w-6 h-6 text-[var(--fresh-green)]" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-base tracking-tight text-[var(--text-main)] flex items-center gap-1">
                  Fresh<span className="text-[var(--primary-gold)]">Route</span>
                </span>
                <span className="text-[10px] text-[var(--text-secondary)] truncate font-medium">
                  Intelligent Perishables
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Toggle Sidebar"
          >
            <ChevronRightIcon className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? "bg-[var(--soft-gold)] text-[var(--deep-gold)] font-bold shadow-xs border border-[var(--primary-gold)]/20"
                    : "text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[var(--text-main)]"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[var(--primary-gold)]" : ""}`} />
                {sidebarOpen && (
                  <span className="flex-1 text-left truncate flex items-center justify-between">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-md uppercase font-bold tracking-wider ${
                        item.badge === "OR-Tools"
                          ? "bg-[var(--pale-green)] text-[var(--fresh-green)]"
                          : "bg-gray-200 dark:bg-gray-700 text-[var(--text-secondary)]"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer: Commercial Model & Onboarding trigger */}
        {sidebarOpen && (
          <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-card-subtle)]/50">
            <div className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-gold)]">
                  Enterprise Tier
                </span>
                <span className="text-[10px] text-[var(--fresh-green)] font-semibold">Active</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-tight mb-2">
                Multi-Warehouse MIP Optimizer + What-If Recalculator
              </p>
              <button
                onClick={startTour}
                className="w-full py-1.5 text-center text-xs font-semibold rounded-lg bg-[var(--soft-gold)] text-[var(--deep-gold)] hover:opacity-90 transition-opacity"
              >
                Restart Guided Tour
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-card)] px-6 flex items-center justify-between shrink-0 z-20">
          {/* Global Search Filter */}
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <SearchIcon className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search batches, commodities, destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:border-[var(--primary-gold)] transition-colors"
              />
            </div>
          </div>

          {/* Right Controls: Live Clock, Demo Badge, Theme, User */}
          <div className="flex items-center gap-3">
            {/* Live Clock & Local Date (Browser Local Timezone) */}
            <div className="hidden lg:flex flex-col text-right pr-2 border-r border-[var(--border-color)]">
              <span className="text-xs font-mono font-bold text-[var(--text-main)] flex items-center justify-end gap-1">
                <ClockIcon className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                {timeString}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] font-medium">
                {dateString}
              </span>
            </div>

            {/* Prominent Demo Badge */}
            <div className="flex items-center gap-1.5 bg-[var(--soft-gold)]/60 border border-[var(--primary-gold)]/30 rounded-xl px-2.5 py-1 text-xs">
              <span className="w-2 h-2 rounded-full bg-[var(--warning-amber)] animate-pulse" />
              <span className="text-[10px] font-bold tracking-wider text-[var(--deep-gold)] uppercase">
                Demo Data — Simulated
              </span>
              <button
                onClick={onResetDemo}
                className="ml-1 p-1 hover:bg-[var(--soft-gold)] rounded-md text-[var(--deep-gold)]"
                title="Reset Simulated Data"
              >
                <RefreshIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Notification Center Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              >
                <BellIcon className="w-5 h-5" />
                <span className="w-2 h-2 rounded-full bg-[var(--critical-red)] absolute top-2 right-2" />
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl p-3 z-50 text-xs">
                  <div className="font-bold text-[var(--text-main)] mb-2 flex items-center justify-between">
                    <span>Active System Alerts</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">2 alerts</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-[var(--pale-red)] border border-[var(--critical-red)]/30 text-[var(--critical-red)]">
                      <span className="font-bold block">Batch BATCH-STR-101</span>
                      22h shelf-life remaining (Critical-Risk). 30% discount recommended.
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--pale-amber)] border border-[var(--warning-amber)]/30 text-[var(--warning-amber)]">
                      <span className="font-bold block">Simulated Reefer Warning</span>
                      Excursion logged: +2.1°C excursion on Watsonville transit route.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reusable Theme Selector (Light, Dark, System) */}
            <div className="flex items-center bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-0.5">
              <button
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  theme === "light"
                    ? "bg-[var(--bg-card)] text-[var(--primary-gold)] shadow-xs font-bold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                }`}
                title="Light Mode (Warm White & Gold)"
              >
                <SunIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  theme === "dark"
                    ? "bg-[var(--bg-card)] text-[var(--primary-gold)] shadow-xs font-bold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                }`}
                title="Dark Mode (Deep Navy Slate)"
              >
                <MoonIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTheme("system")}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  theme === "system"
                    ? "bg-[var(--bg-card)] text-[var(--primary-gold)] shadow-xs font-bold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-main)]"
                }`}
                title="System (Auto Sync OS)"
              >
                <LaptopIcon className="w-4 h-4" />
              </button>
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--primary-gold)] text-white flex items-center justify-center font-bold text-xs">
                  {user?.full_name ? user.full_name[0] : "A"}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-[var(--text-main)] leading-tight truncate max-w-[100px]">
                    {user?.full_name || "Alex Rivera"}
                  </span>
                  <span className="text-[10px] text-[var(--text-secondary)] leading-tight">
                    {user?.role || "Logistics Lead"}
                  </span>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl py-2 z-50 text-xs">
                  <div className="px-4 py-2 border-b border-[var(--border-color)]">
                    <p className="font-bold text-[var(--text-main)]">{user?.full_name || "Alex Rivera"}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{user?.email || "demo@freshroute.io"}</p>
                    <p className="text-[10px] text-[var(--primary-gold)] font-medium mt-0.5">{user?.organization || "Pacific Fresh Logistics"}</p>
                  </div>
                  <button
                    onClick={() => { setCurrentPage("settings"); setProfileOpen(false); }}
                    className="w-full px-4 py-2 text-left text-[var(--text-main)] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <SettingsIcon className="w-4 h-4 text-[var(--text-secondary)]" /> Settings & Subscriptions
                  </button>
                  <button
                    onClick={() => { startTour(); setProfileOpen(false); }}
                    className="w-full px-4 py-2 text-left text-[var(--text-main)] hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <RefreshIcon className="w-4 h-4 text-[var(--text-secondary)]" /> Replay Onboarding Tour
                  </button>
                  <div className="border-t border-[var(--border-color)] my-1" />
                  <button
                    onClick={() => { logout(); setProfileOpen(false); }}
                    className="w-full px-4 py-2 text-left text-[var(--critical-red)] hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
