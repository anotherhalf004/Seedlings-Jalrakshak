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

## ⚙️ Quickstart & Execution Commands

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Run Data Engineering & Generate Master Dataset
```bash
python ml/preprocessing.py
```

### 3. Train Demand & Supply Models
```bash
python ml/train_demand.py
python ml/train_supply.py
python ml/train_anomaly.py
```

### 4. Run Evaluation & Generate Test Metrics
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
  "groundwater_stress_index": 58.81,
  "water_balance": {
    "predicted_demand_mld": 1310.88,
    "predicted_supply_mld": 881.52,
    "estimated_shortage_mld": 429.36,
    "shortage_percentage": 32.75,
    "risk_tier": "High",
    "unit": "MLD (Million Liters per Day)"
  },
  "water_loss_diagnostics": {
    "estimated_unaccounted_water_mld": 176.3,
    "estimated_nrw_loss_percentage": 20.0,
    "suspected_loss_anomaly_flag": false,
    "disclaimer": "Suspected distribution / non-revenue loss anomaly; not confirmed underground physical pipe leak."
  },
  "advisory": "HIGH WATER STRESS: Mandate alternate-day municipal supply scheduling, strict borehole regulation, and non-revenue water inspection."
}
```

---

## 🔗 Connecting to the JalRakshak Backend & React Dashboard

1. **FastAPI Endpoint**:
   Wrap `ml/predict.py` in a FastAPI route (`POST /api/v1/forecast/water-crisis`).
2. **React Dashboard Widgets**:
   - **Water Balance Gauge**: Visualizes Demand vs Supply vs Shortage (in MLD).
   - **Risk Tier Badge**: Low (Green), Medium (Yellow), High (Orange), Critical (Red).
   - **Groundwater & Anomaly Radar**: Highlights high non-revenue water and severe borehole depletion.
