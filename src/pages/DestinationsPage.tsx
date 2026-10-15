import React, { useState } from "react";
import { Destination, Warehouse, TransportRoute } from "../types";
import { RouteIcon, TruckIcon, MapPinIcon, DollarIcon, ClockIcon } from "../components/common/Icons";

interface DestinationsPageProps {
  destinations: Destination[];
  warehouses: Warehouse[];
  routes: TransportRoute[];
  searchQuery: string;
}

export const DestinationsPage: React.FC<DestinationsPageProps> = ({
  destinations,
  warehouses,
  routes,
  searchQuery
}) => {
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(destinations[0] || null);

  const filteredDestinations = destinations.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) ||
           d.city.toLowerCase().includes(q) ||
           d.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
          Regional Destination Markets & Demand
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Receiving capacities, commodity demand quotas, market pricing, and origin-to-destination freight route matrix.
        </p>
      </div>

      {/* Grid: Destination Directory + Selected Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Destinations List */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
            Destination Terminals ({filteredDestinations.length})
          </span>
          <div className="space-y-2.5">
            {filteredDestinations.map((d) => {
              const isSelected = selectedDestination?.id === d.id;
              const totalDem = d.demands.reduce((s, dem) => s + dem.demand_quantity_kg, 0);
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDestination(d)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[var(--primary-gold)] bg-[var(--soft-gold)]/30 shadow-xs"
                      : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary-gold)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-[var(--text-main)]">{d.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-card)] font-bold text-[var(--deep-gold)] border border-[var(--border-color)]">
                      Tier {d.priority_tier}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mb-2">
                    <MapPinIcon className="w-3.5 h-3.5 text-[var(--primary-gold)]" />
                    <span>{d.city}, {d.state}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-2 border-t border-[var(--border-color)]">
                    <span className="text-[var(--text-secondary)]">Receiving Cap:</span>
                    <span className="font-semibold text-[var(--text-main)]">{d.receiving_capacity_kg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-[var(--text-secondary)]">Total Demand:</span>
                    <span className="font-bold text-[var(--fresh-green)]">{totalDem.toLocaleString()} kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Destination Demand Breakdown & Freight Routes */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDestination ? (
            <>
              {/* Destination Header Card */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-color)] pb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--primary-gold)]">
                      Market Specification • {selectedDestination.code}
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-main)]">
                      {selectedDestination.name}
                    </h2>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {selectedDestination.city}, {selectedDestination.state} (Lat: {selectedDestination.latitude}, Lon: {selectedDestination.longitude})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[var(--text-secondary)] block">Receiving Bay Capacity</span>
                    <span className="text-xl font-extrabold text-[var(--text-main)]">
                      {selectedDestination.receiving_capacity_kg.toLocaleString()} kg
                    </span>
                  </div>
                </div>

                {/* Demand Quota Table */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5">
                    Commodity Demand & Market Price Quotas
                  </h3>
                  <div className="border border-[var(--border-color)] rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[var(--bg-card-subtle)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-semibold">
                        <tr>
                          <th className="p-3">Commodity</th>
                          <th className="p-3">Demand Quantity</th>
                          <th className="p-3">Market Price</th>
                          <th className="p-3">Planning Shift</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {selectedDestination.demands.map((dem) => (
                          <tr key={dem.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                            <td className="p-3 font-semibold text-[var(--text-main)]">{dem.commodity}</td>
                            <td className="p-3 font-bold text-[var(--fresh-green)]">{dem.demand_quantity_kg.toLocaleString()} kg</td>
                            <td className="p-3 font-mono font-semibold">${dem.market_price_per_kg.toFixed(2)} / kg</td>
                            <td className="p-3 text-[var(--text-secondary)]">{dem.time_period}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inbound Transport Routes */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2.5 flex items-center gap-1.5">
                    <TruckIcon className="w-4 h-4 text-[var(--primary-gold)]" />
                    Inbound Freight Routes & Travel Times to {selectedDestination.name}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {routes
                      .filter(r => r.destination_id === selectedDestination.id)
                      .map((r) => (
                        <div key={r.id} className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card-subtle)] space-y-1.5">
                          <span className="font-bold text-[var(--text-main)] block truncate">{r.warehouse_name}</span>
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Travel Time:</span>
                            <span className="font-semibold text-[var(--primary-gold)]">{r.travel_time_hours} hours</span>
                          </div>
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Transport Cost:</span>
                            <span className="font-semibold text-[var(--text-main)]">${r.transport_cost_per_kg.toFixed(2)}/kg</span>
                          </div>
                          <div className="flex justify-between text-[var(--text-secondary)]">
                            <span>Truck Capacity:</span>
                            <span className="font-medium text-[var(--text-main)]">{r.vehicle_capacity_kg.toLocaleString()} kg</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-xs text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
              Select a destination terminal to inspect its demand and routes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
