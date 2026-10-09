"""
JalRakshak ML Pipeline - Phase 9: Unified Inference & Dashboard API Interface
=============================================================================
Provides a production-grade inference interface that takes city/environmental parameters
and returns a standardized JSON prediction payload for the JalRakshak Backend / React Dashboard.
"""

import os
import sys
import json
import argparse
import numpy as np
import pandas as pd

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False

from shortage_engine import compute_shortage, load_shortage_config

def predict_water_crisis(
    city: str,
    population: float,
    gw_fall_pct: float,
    gw_fall_gt_4m_pct: float = 0.0,
    gw_rise_pct: float = 0.0,
    state_tap_water_coverage_pct: float = 85.0,
    rainfall_period_actual_mm: float = 15.0,
    rainfall_period_dep_pct: float = -20.0,
    monitoring_wells_count: int = 10,
    forecast_period: str = "Upcoming Month"
):
    """
    Unified forecasting function.
    
    Inputs:
    - city: Name of the urban city/district.
    - population: Current estimated municipal population.
    - gw_fall_pct: Percentage of monitoring wells showing falling water table (0-100%).
    - gw_fall_gt_4m_pct: Percentage of wells with >4m deep water level drop.
    - gw_rise_pct: Percentage of wells with rising water levels.
    - state_tap_water_coverage_pct: Household tap water connectivity coverage (%).
    - rainfall_period_actual_mm: Recent cumulative precipitation (mm).
    - rainfall_period_dep_pct: Rainfall departure from climatological normal (%).
    - monitoring_wells_count: Number of ground observation wells.
    - forecast_period: Horizon description (e.g., 'Upcoming Month', 'Q4 2026').
    
    Returns:
    - dict: Comprehensive prediction, shortage risk tier, anomaly alerts, and advisory.
    """
    
    # 1. Compute Groundwater Stress Index (GSVI)
    gsvi_score = round(
        0.55 * gw_fall_pct + 0.35 * gw_fall_gt_4m_pct + 0.10 * max(0.0, -rainfall_period_dep_pct),
        2
    )
    gsvi_score = min(100.0, max(0.0, gsvi_score))
    
    # 2. Demand Estimation (CPHEEO 135 LPCD + 15% non-domestic)
    # Demand (MLD) = (Population * 135 * 1.15) / 1,000,000
    base_demand_mld = round((population * 135.0 * 1.15) / 1e6, 2)
    
    # 3. Supply Capacity Estimation
    gw_availability_factor = max(0.40, (1.0 - (gsvi_score / 150.0)))
    tap_connectivity_factor = (state_tap_water_coverage_pct / 100.0) * 0.35 + 0.65
    estimated_supply_mld = round(base_demand_mld * gw_availability_factor * tap_connectivity_factor, 2)
    
    # Try using trained ML models if saved models exist
    demand_model_path = "models/demand_model.joblib"
    supply_model_path = "models/supply_model.joblib"
    
    if HAS_JOBLIB and os.path.exists(demand_model_path) and os.path.exists(supply_model_path):
        try:
            d_pkg = joblib.load(demand_model_path)
            s_pkg = joblib.load(supply_model_path)
            
            X_d = pd.DataFrame([{
                "population_estimated": population,
                "state_tap_water_coverage_pct": state_tap_water_coverage_pct,
                "monitoring_wells_count": monitoring_wells_count
            }])
            
            X_s = pd.DataFrame([{
                "population_estimated": population,
                "gw_fall_pct": gw_fall_pct,
                "gw_fall_gt_4m_pct": gw_fall_gt_4m_pct,
                "gw_rise_pct": gw_rise_pct,
                "state_tap_water_coverage_pct": state_tap_water_coverage_pct,
                "rainfall_period_actual_mm": rainfall_period_actual_mm,
                "rainfall_period_dep_pct": rainfall_period_dep_pct,
                "groundwater_stress_index": gsvi_score
            }])
            
            base_demand_mld = round(float(d_pkg["model"].predict(X_d)[0]), 2)
            estimated_supply_mld = round(float(s_pkg["model"].predict(X_s)[0]), 2)
        except Exception as e:
            pass # Gracefully fall back to engineering formulas
            
    # 4. Shortage Calculation
    config = load_shortage_config()
    shortage_info = compute_shortage(base_demand_mld, estimated_supply_mld, config)
    
    # 5. Suspected Water Loss & Anomaly Indicator
    nrw_loss_pct = round(15.0 + (100.0 - state_tap_water_coverage_pct) * 0.20 + (gsvi_score * 0.05), 2)
    unaccounted_water_mld = round(estimated_supply_mld * (nrw_loss_pct / 100.0), 2)
    is_suspected_loss_anomaly = (nrw_loss_pct > 25.0) or (gsvi_score > 60.0)
    
    # Build response payload
    response = {
        "city": city,
        "forecast_period": forecast_period,
        "population": int(population),
        "groundwater_stress_index": gsvi_score,
        "water_balance": {
            "predicted_demand_mld": shortage_info["predicted_demand_mld"],
            "predicted_supply_mld": shortage_info["predicted_supply_mld"],
            "estimated_shortage_mld": shortage_info["shortage_amount_mld"],
            "shortage_percentage": shortage_info["shortage_percentage"],
            "risk_tier": shortage_info["risk_tier"],
            "unit": "MLD (Million Liters per Day)"
        },
        "water_loss_diagnostics": {
            "estimated_unaccounted_water_mld": unaccounted_water_mld,
            "estimated_nrw_loss_percentage": nrw_loss_pct,
            "suspected_loss_anomaly_flag": bool(is_suspected_loss_anomaly),
            "disclaimer": "Suspected distribution / non-revenue loss anomaly; not confirmed underground physical pipe leak."
        },
        "advisory": shortage_info["advisory"],
        "model_metadata": {
            "data_sources": ["CGWB Ground Water", "IMD Rainfall", "JJM Har Ghar Jal", "Census Demographics"],
            "benchmark_standard": "CPHEEO 135 LPCD Urban Standard",
            "prediction_status": "SUCCESS"
        }
    }
    
    return response

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JalRakshak Water Crisis Predictor")
    parser.add_argument("--city", type=str, default="Bengaluru", help="City name")
    parser.add_argument("--population", type=float, default=8443675, help="Population")
    parser.add_argument("--gw_fall_pct", type=float, default=91.67, help="Groundwater wells falling percentage")
    parser.add_argument("--tap_pct", type=float, default=89.7, help="Tap water coverage percentage")
    parser.add_argument("--rain_dep", type=float, default=-11.0, help="Rainfall departure percentage")
    
    args = parser.parse_args()
    
    result = predict_water_crisis(
        city=args.city,
        population=args.population,
        gw_fall_pct=args.gw_fall_pct,
        state_tap_water_coverage_pct=args.tap_pct,
        rainfall_period_dep_pct=args.rain_dep
    )
    
    print("\n" + "="*70)
    print(f"JALRAKSHAK PREDICTION PAYLOAD FOR: {args.city}")
    print("="*70)
    print(json.dumps(result, indent=2))
