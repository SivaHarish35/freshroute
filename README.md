# FreshRoute — Intelligent Decision Support for Perishable Produce Distribution
> **Smarter Routes. Fresher Produce. Less Waste.**

Built for **PS 07 — FreshRoute: Intelligent Decision Support for Perishable Produce Distribution** (Bugged Out Hackathon).

---

## 🌟 Executive Summary

**FreshRoute** is an enterprise-grade SaaS decision support application for agricultural produce distributors, food logistics wholesalers, and cold-storage fleet operators. 

Perishable produce distribution faces severe operational coordination bottlenecks: tight commodity shelf lives, fluctuating destination market prices, variable origin-destination transit times, and vehicle capacity constraints. FreshRoute replaces guesswork and rigid heuristics with **Google OR-Tools Mixed Integer Linear Programming (SCIP MIP solver)** paired with an **auditable explainability engine**, a fair **Earliest-Expiry-First (EEF) baseline benchmark**, and **interactive What-If scenario simulations**.

---

## 🚀 Key Features

### 1. Perishability-Aware Optimization Engine (Google OR-Tools SCIP)
- Enforces hard physical constraints:
  $$\text{Transit Time} + \text{Handling Buffer} \le \text{Remaining Shelf-Life}$$
- Formulates multi-depot, multi-commodity linear programs balancing selling prices, freight costs, holding penalties, and spoilage write-offs.
- Infeasible combinations are explicitly diagnosed with plain-language explanations.

### 2. Rigorous Fair Baseline Comparison (Earliest-Expiry-First)
- Implements a documented **Earliest-Expiry-First (EEF)** heuristic benchmark.
- Evaluated on the **exact same starting inventory, destination demand orders, market prices, travel times, and vehicle capacities**.
- Reports genuine absolute and percentage deltas for **Estimated Spoilage (kg)**, **Demand Fulfillment (%)**, **Logistics Freight Spend ($)**, and **Net Revenue ($)**.

### 3. "Why This Allocation?" Deep Explainability Drawer
- Interactive audit drawer for every recommended dispatch:
  - **Perishability**: Initial shelf-life, transit hours, handling buffer, and arrival freshness margin.
  - **Demand Context**: Destination demand quota, batch allocation, and fulfillment percentage.
  - **Logistics & Capacities**: Truck freight rate, route transit duration, and receiving bay utilization.
  - **Economics**: Selling price, gross revenue, freight expense, and net margin contribution.
  - **Dynamic Natural Language AI Narrative**: Plain-language reasoning generated from computed values.

### 4. Dynamic Markdown & Salvage Pricing Engine
- Automatically identifies at-risk inventory ($\le 48\text{h}$ shelf life) and critical-risk inventory ($\le 24\text{h}$ shelf life).
- Recommends $15\%$ to $30\%$ promotional salvage discounts, calculating net economic benefit ($\Delta \text{Revenue} = \text{Discounted Price} \times \text{Quantity} + \text{Avoided Spoilage Write-Off}$).

### 5. 5-Step Smart CSV Data Ingestion Wizard
- Guided workflow for non-technical operations personnel:
  - **Step 1: Upload / Input**: File drag-and-drop or paste raw CSV (with downloadable template).
  - **Step 2: Preview**: Inspect detected rows and columns.
  - **Step 3: Column Mapping**: Canonical mapping to FreshRoute fields.
  - **Step 4: Real-time Validation**: Highlights invalid quantities, non-positive shelf lives, and warehouse mappings.
  - **Step 5: Review & Commit**: Atomic database commit with rollback protection.

### 6. Interactive What-If Scenario Stress Testing
- Clones active dataset and introduces parametric operational shocks:
  - Interstate Highway Delays ($+0\text{h}$ to $+8\text{h}$)
  - Destination Demand Surges ($0.5\times$ to $2.0\times$)
  - Reefer Fleet Shortages ($0.3\times$ to $1.5\times$)
  - Market Price Shifts ($0.6\times$ to $1.6\times$)
- Recalculates both baseline and optimizer in real time, reporting true deltas and dropped routes.

### 7. Demand Forecasting Module
- 14-day historical retail demand curve.
- 5-period forward projection with Weighted Moving Average and Day-of-Week seasonality.
- $95\%$ Confidence Interval uncertainty bands scaling with $\sqrt{\text{horizon}}$.
- Chronological held-out test window validation with reported **MAE** and **RMSE**.
- 1-Click "Apply Forecast to Allocation Center" integration.

### 8. Simulated Cold-Chain Telemetry Monitor
- Explicitly labeled **SIMULATED COLD-CHAIN TELEMETRY**.
- 12-hour hourly reefer temperature log with threshold alerts.
- Arrhenius $Q_{10}$ biological respiration rate calculation estimating accelerated shelf-life decay during temperature excursions.

### 9. Auditable Food-Waste Impact Report
- Quantifies physical kilograms of food waste avoided.
- Calculates relative percentage reduction vs. fair baseline.
- Commodity-by-commodity inventory clearance rates.
- Disclosed boundary methodology preventing fabricated carbon/water claims.
- 1-Click CSV data exports and clean printable executive report.

### 10. Enterprise UI Design System & Triple-Theme Support
- Refined **Warm White, Enterprise Gold, and Fresh Green** visual identity.
- Full support for **Light Mode** (`#FBF8F1`), **Dark Mode** (`#0B1118` deep navy), and **System Mode** (OS synchronization).
- Live dynamic clock & date in browser's local timezone.
- 6-Stage guided interactive onboarding tour.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Custom Responsive SVG Data Visualizations |
| **Backend** | Python 3.14, FastAPI, Pydantic v2, SQLAlchemy 2.0 ORM, Uvicorn, Pandas, PyJWT |
| **Optimization** | Google OR-Tools (SCIP Mixed Integer Programming solver) + SciPy HiGHS MIP fallback |
| **Database** | SQLite default (`freshroute.db`) with full PostgreSQL compatibility via `DATABASE_URL` |
| **Testing** | Pytest automated test suite covering constraints, conservation laws, and baselines |

---

## 💻 Running the Application

### Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ and npm (tested on Node v24 LTS)

### Quick Start (2 Terminals)

#### Terminal 1: Backend API
```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

#### Terminal 2: Frontend Web Application
```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
Open in Browser: `http://127.0.0.1:5173`

---

## 🧪 Running Automated Tests

To run the automated test suite verifying hard perishability constraints, inventory conservation, and baseline benchmarks:

```powershell
cd backend
python -m pytest tests -v
```

---

## 💼 Commercial Subscription Model (Illustrative)

FreshRoute is offered as B2B supply-chain optimization software:
- **Starter Plan ($490/mo)**: Single origin warehouse, up to 10 destination markets, EEF baseline vs. MIP solver.
- **Professional Plan ($1,290/mo)**: Multi-warehouse logistics hubs, What-If simulation engine, demand forecasting, and dynamic markdown rules.
- **Enterprise Plan ($2,890/mo)**: Custom linear programming objectives, multi-depot routing, TMS API integration, and dedicated SLA.
