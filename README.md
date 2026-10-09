# JalRakshak — Smart Water Crisis & Leakage Prevention (ML Pipeline)

JalRakshak is a data-driven machine learning system designed to forecast urban water demand and supply, estimate water shortages, evaluate crisis risk tiers, and detect suspected distribution water-loss anomalies across Indian cities.

---

## 📁 Project Architecture & Directory Structure

```text
AWS-Jalrakshak/
├── data/
│   ├── raw/                               # Parsed official raw datasets
│   │   ├── census_2011_state_population.csv
│   │   ├── jjm_tap_water_state_status.csv
│   │   ├── cgwb_groundwater_decadal_cities.csv
│   │   └── imd_district_rainfall_oct2026.csv
│   └── processed/
│       └── jalrakshak_master.csv          # Cleaned, unified 66-city master dataset
├── ml/
│   ├── data_audit.py                      # Phase 1: Data profiling and validation
│   ├── preprocessing.py                   # Phase 2: Data engineering & master generation
│   ├── shortage_engine.py                 # Phase 3: Shortage calculation & risk classification
│   ├── shortage_config.json               # Configurable risk thresholds
│   ├── train_demand.py                    # Phase 5: Water demand model training
│   ├── train_supply.py                    # Phase 5: Water supply model training
│   ├── train_anomaly.py                   # Phase 7: Suspected water-loss anomaly detection
│   ├── evaluate.py                        # Phase 6: Rigorous held-out test evaluation
│   └── predict.py                         # Phase 9: Unified inference & dashboard payload interface
├── models/                                # Serialized models (.joblib)
├── reports/                               # Audit reports, test metrics, and predictions
│   ├── phase_1_data_audit_report.md
│   ├── evaluation_metrics.json
│   └── test_predictions.csv
├── population/                            # 35 State/UT Census CSVs
├── data_dictionary.md                     # Complete column descriptions & units
├── requirements.txt                       # Python dependencies
└── README.md
```

---

## 🧠 Machine Learning Architecture & Methodology

JalRakshak employs a physical-constraint-preserving hybrid modeling architecture designed to overcome error amplification across municipal water balances:

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

## ⚙️ Quickstart & Execution Commands

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Data Engineering & Generate Master Dataset
```bash
python ml/preprocessing.py
```

### 3. Train Demand, Supply Ratio & Anomaly Models
```bash
python ml/train_demand.py
python ml/train_supply.py
python ml/train_anomaly.py
```

### 4. Run Rigorous Model Evaluation
```bash
python ml/evaluate.py
```

### 5. Run Live Inference for Any City
```bash
python ml/predict.py --city "Bengaluru" --population 8443675 --gw_fall_pct 91.67 --tap_pct 89.70 --rain_dep -11.0
```

---

## 📊 Sample Inference Output Schema (JSON)

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

## 🔗 Connecting to the JalRakshak Backend & React Dashboard

1. **FastAPI Service**:
   Start backend API service with:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
2. **Endpoints Provided**:
   - `GET  /api/v1/health` — API health check
   - `GET  /api/v1/cities` — Monitored national cities with current baseline water balances
   - `POST /api/v1/predict` — Dynamic ML prediction with environmental and demographic parameters
   - `POST /api/v1/simulate` — Interactive "What-If" NRW loss reduction and crisis downgrade simulator

