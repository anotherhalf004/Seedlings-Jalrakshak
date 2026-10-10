# JalRakshak — Smart Water Crisis & Leakage Prevention (ML & Full-Stack Platform)

JalRakshak is an AI-powered municipal water intelligence system that forecasts urban water demand and supply, computes localized water deficits, classifies crisis risk tiers, and detects distribution loss anomalies across 69 Indian urban centers.

---

## 📁 Project Architecture & Directory Structure

[![Architecture diagram of anotherhalf004/seedlings-jalrakshak](https://gitdiagram.com/anotherhalf004/seedlings-jalrakshak/diagram.png)](https://gitdiagram.com/anotherhalf004/seedlings-jalrakshak?utm_source=readme&utm_medium=picture)

```text
AWS-Jalrakshak/
├── backend/                               # FastAPI backend service
│   ├── main.py                            # Production API endpoints, CORS & fuzzy city matcher
│   └── test_api.py                        # Automated regression and integration tests
├── frontend/                              # High-performance React 19 + Vite dashboard
│   ├── src/
│   │   ├── components/                    # UI Components (CityWaterMap, Charts, StatCard, GooeyNav, etc.)
│   │   ├── pages/                         # Dashboard, Predictor, and Simulator pages
│   │   ├── lib/                           # Utility functions & theme color mappings
│   │   └── api.js                         # API service client with dev proxy integration
│   ├── index.html                         # App root with dark mode baseline
│   ├── vite.config.js                     # Vite bundler configuration & proxy
│   └── package.json                       # React dependencies & scripts
├── data/
│   ├── raw/                               # Official source datasets (CGWB, IMD, JJM, Census)
│   └── final/
│       └── jalrakshak_master.csv          # Cleaned, unified 69-city master dataset
├── ml/
│   ├── data_audit.py                      # Phase 1: Data profiling and validation
│   ├── preprocessing.py                   # Phase 2: Data engineering & master generation
│   ├── shortage_engine.py                 # Phase 3: Shortage calculation & risk classification
│   ├── shortage_config.json               # Configurable risk thresholds
│   ├── train_demand.py                    # Phase 5: Water demand model training
│   ├── train_supply.py                    # Phase 5: Water supply model training
│   ├── train_anomaly.py                   # Phase 7: Water-loss anomaly detection
│   ├── evaluate.py                        # Phase 6: Held-out test evaluation
│   └── predict.py                         # Phase 9: Unified inference & dashboard payload interface
├── models/                                # Serialized ML models (.joblib)
├── reports/                               # Audit reports, test metrics, and predictions
├── population/                            # 35 State/UT Census CSVs
├── data_dictionary.md                     # Complete column descriptions & units
├── requirements.txt                       # Python dependencies
└── README.md
```

---

## 🧠 Machine Learning Architecture & Methodology

JalRakshak employs a physical-constraint-preserving hybrid modeling architecture designed to eliminate error amplification across municipal water balances:

1. **Water Demand Model (Ridge Linear Regression)**:
   - Forecasts total design water demand in MLD based on municipal population scale, tap connectivity, and monitoring infrastructure.
   - Evaluated Performance: **$R^2 = 0.9998$**, **MAE = 3.10 MLD** on held-out test splits.

2. **Water Supply Ratio Model (Gradient Boosting Regressor)**:
   - Rather than attempting to predict unconstrained absolute supply across wildly divergent city sizes, the model forecasts the scale-invariant **Supply Delivery Ratio**:
     $$\text{Supply Ratio} = \frac{\text{Estimated Supply Capacity (MLD)}}{\text{Benchmark Design Demand (MLD)}}$$
   - Integrates Groundwater Stress Vulnerability Index (GSVI), decadal borehole fall percentages, rainfall departures from IMD normal, and JJM tap connectivity coverage.
   - Selected using **Repeated Stratified 5-Fold Cross-Validation across all 69 cities** (5 repeats $\times$ 5 folds = 25 evaluations).
   - Absolute municipal supply capacity is derived physically as:
     $$\hat{\text{Supply}}_{\text{MLD}} = \hat{\text{Demand}}_{\text{MLD}} \times \hat{\text{Supply Ratio}}$$

3. **Shortage Estimation Engine & Crisis Categorization**:
   - Computes deterministic water deficit: $\text{Shortage}_{\text{MLD}} = \max(0, \hat{\text{Demand}} - \hat{\text{Supply}})$.
   - Computes shortage percentage: $\text{Shortage \%} = \frac{\text{Shortage}_{\text{MLD}}}{\hat{\text{Demand}}_{\text{MLD}}} \times 100\%$.
   - Categorizes risk tiers: **Low** ($<10\%$), **Medium** ($10-25\%$), **High** ($25-40\%$), and **Critical** ($\ge 40\%$).

4. **Suspected Water Loss Anomaly Detection (Isolation Forest)**:
   - Evaluates multidimensional non-revenue water (NRW) indicators against groundwater stress profiles to flag distribution loss anomalies without confounding pipeline leaks with subterranean recharge factors.

---

## 📈 Evaluation & Benchmark Performance

Models are evaluated both on **Repeated Stratified 5-Fold Cross-Validation across all 69 cities** and on a **Held-Out Test Set (20% split)**:

| Metric | Repeated Stratified 5-Fold CV (All 69 Cities) | Held-Out Test Set (14 Cities) |
| :--- | :---: | :---: |
| **Exact Risk Tier Accuracy** | **86.68%** | **85.71%** |
| **Within-One-Tier Accuracy** | **100.00%** | **100.00%** |
| **Shortage Deficit % MAE** | **2.62%** | **0.88%** |
| **Demand Forecasting $R^2$** | **0.9980** | **0.9998** |
| **Supply Forecasting $R^2$** | **0.9985** | **0.9994** |
| **Supply Forecasting MAE** | **13.62 MLD** | **3.67 MLD** |

---

## 🚀 Quickstart & Execution

### 1. Python Environment & Backend API

```bash
# Install dependencies
pip install -r requirements.txt

# Run backend regression & integration tests
python -m unittest backend.test_api

# Start FastAPI service (port 8000)
python backend/main.py
# Or with uvicorn directly:
uvicorn backend.main:app --reload --port 8000
```

### 2. Frontend Dashboard Setup

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server (port 5173 with API proxy to 8000)
npm run dev

# Run linter
npm run lint

# Build production bundle
npm run build
```

### 3. ML Pipeline Commands (Optional Re-training)

```bash
# 1. Regenerate master dataset from raw records
python ml/preprocessing.py

# 2. Retrain Demand, Supply Ratio & Anomaly models
python ml/train_demand.py
python ml/train_supply.py
python ml/train_anomaly.py

# 3. Run model evaluation
python ml/evaluate.py

# 4. Run CLI inference for a city
python ml/predict.py --city "Bengaluru" --population 8443675 --gw_fall_pct 91.67 --tap_pct 89.70 --rain_dep -11.0
```

---

## 🌐 API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Service health status and national monitoring scope |
| `GET` | `/api/v1/cities` | All 69 monitored Indian cities with groundwater stress, demand, supply, deficit, and NRW metrics |
| `POST` | `/api/v1/predict` | Dynamic ML prediction with intelligent fuzzy city and alias matching (`Bengaluru`/`Bangalore`, `Patna (phreatic)`, etc.) |
| `POST` | `/api/v1/simulate` | Interactive "What-If" NRW loss reduction and crisis downgrade simulator |

### Sample Inference Payload (`POST /api/v1/predict`)

```json
{
  "city": "Bengaluru",
  "forecast_period": "Upcoming Month",
  "population": 8443675,
  "groundwater_stress_index": 51.52,
  "water_balance": {
    "predicted_demand_mld": 1289.33,
    "predicted_supply_ratio": 0.7047,
    "predicted_supply_mld": 908.59,
    "estimated_shortage_mld": 380.74,
    "shortage_percentage": 29.53,
    "risk_tier": "High",
    "unit": "MLD (Million Liters per Day)"
  },
  "water_loss_diagnostics": {
    "estimated_unaccounted_water_mld": 178.45,
    "estimated_nrw_loss_percentage": 19.64,
    "suspected_loss_anomaly_flag": false,
    "disclaimer": "Suspected distribution / non-revenue loss anomaly; not confirmed underground physical pipe leak."
  },
  "advisory": "HIGH WATER STRESS: Mandate alternate-day municipal supply scheduling, strict borehole regulation, and non-revenue water inspection.",
  "model_metadata": {
    "data_sources": [
      "CGWB Ground Water",
      "IMD Rainfall",
      "JJM Har Ghar Jal",
      "Census Demographics"
    ],
    "benchmark_standard": "CPHEEO 135 LPCD Urban Standard",
    "prediction_status": "SUCCESS"
  }
}
```

---

## 💻 Frontend Features & UI Capabilities

- **National Water Stress Cockpit**: Real-time KPI summaries, interactive sorting & filtering across 69 cities, and diagnostic modal telemetry.
- **Interactive Geospatial Map (`CityWaterMap`)**: Leaflet-powered visual bubble map of India showing proportional municipal demand, supply, and deficit levels, plus alternative ECharts bar matrix view.
- **Risk Category Distribution (`RiskDistributionChart`)**: Interactive donut chart with tier selection, dynamic muted focus, and reset capabilities.
- **Interactive ML Inference (`Predictor`)**: Dynamic parameter sliders with intelligent city autofill (resolving municipal aliases and aquifer classifications).
- **What-If Scenario Simulator (`Simulator`)**: Models water volume recovered (MLD) and risk tier transitions upon reducing non-revenue water (NRW) distribution leakage.
- **Dark / Light Theme Switcher**: Full token-driven color system with Tailwind CSS and CSS variables.
